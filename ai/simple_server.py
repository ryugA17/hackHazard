import asyncio
import json
import time
import os
import random
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from generate_map import generate_map

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Mount static files directory for sounds
app.mount("/sounds", StaticFiles(directory="assets/sounds"), name="sounds")

# Mount static files directory for HTML files
app.mount("/static", StaticFiles(directory="."), name="static")

# Store active connections
active_connections = {}

# Store game state for each session
game_states = {}

class GameState:
    def __init__(self):
        self.map_data = None
        self.player_positions = {}  # Dictionary mapping player_id to position {x, y}
        self.last_action = None
        self.characters = []
        self.ai_characters = []  # List of AI-controlled characters
        self.in_combat = False  # Flag to track if the game is in combat mode
        self.chat_history = []  # List to store chat messages
        self.dice_results = {}  # Dictionary to store dice roll results

        # Sound effects mapping
        self.sound_effects = {
            "move": "/sounds/mixkit-footsteps-on-tall-grass-532.wav",  # Footsteps sound for movement
            "attack": "/sounds/mixkit-martial-arts-fast-punch-2047.wav",  # Punch sound for attacks
            "dice": "/sounds/mixkit-retro-game-notification-212.wav",  # Notification sound for dice rolls
            "chat": "/sounds/mixkit-melodical-flute-music-notification-2310.wav",  # Flute sound for chat messages
            "trapped": "/sounds/mixkit-classic-alarm-995.wav",  # Alarm sound for trapped characters
            "background": "/sounds/mixkit-light-rain-loop-2393.wav",  # Rain ambience for background
            "victory": "/sounds/mixkit-trumpet-fanfare-2293.wav",  # Trumpet fanfare for victory
            "defeat": "/sounds/mixkit-sad-game-over-trombone-471.wav",  # Sad trombone for defeat
            "monster": "/sounds/mixkit-aggressive-beast-roar-13.wav",  # Beast roar for monsters
            "magic": "/sounds/mixkit-cinematic-laser-gun-thunder-1287.wav",  # Laser sound for magic
            "surprise": "/sounds/mixkit-female-astonished-gasp-964.wav"  # Gasp sound for surprises
        }

    def add_character(self, character_id, character_type, position):
        self.characters.append({
            "id": character_id,
            "type": character_type
        })
        self.player_positions[character_id] = position

    def move_character(self, character_id, new_position):
        if character_id in self.player_positions:
            self.player_positions[character_id] = new_position

    def remove_character(self, character_id):
        if character_id in self.player_positions:
            del self.player_positions[character_id]
            self.characters = [c for c in self.characters if c["id"] != character_id]

    def is_valid_move(self, x, y):
        """Check if a move to position (x, y) is valid (not an obstacle)"""
        if not self.map_data or not self.map_data.get("grid"):
            return True  # No map data, assume valid

        grid = self.map_data.get("grid", [])
        if y < 0 or y >= len(grid) or x < 0 or x >= len(grid[0]):
            return False  # Out of bounds

        cell = grid[y][x]
        return not cell.get("is_obstacle", False)

    def is_occupied(self, x, y):
        """Check if a position is already occupied by another character"""
        for pos in self.player_positions.values():
            if pos.get("x") == x and pos.get("y") == y:
                return True
        return False

    def is_player_trapped(self, character_id):
        """Check if a player is trapped (surrounded by obstacles or other characters)"""
        if character_id not in self.player_positions:
            return False

        position = self.player_positions[character_id]
        x, y = position.get("x", 0), position.get("y", 0)

        # Check all adjacent cells (up, down, left, right)
        adjacent_positions = [
            (x, y-1),  # up
            (x, y+1),  # down
            (x-1, y),  # left
            (x+1, y)   # right
        ]

        # If any adjacent position is valid and not occupied, the player is not trapped
        for adj_x, adj_y in adjacent_positions:
            if self.is_valid_move(adj_x, adj_y) and not self.is_occupied(adj_x, adj_y):
                return False

        # If we get here, all adjacent cells are either obstacles or occupied
        return True

    def add_ai_character(self, character_type, position):
        """Add an AI-controlled character to the game"""
        ai_id = f"ai_{len(self.ai_characters) + 1}"

        # Add to AI characters list
        self.ai_characters.append({
            "id": ai_id,
            "type": character_type,
            "position": position
        })

        # Also add to player positions for collision detection
        self.player_positions[ai_id] = position

        return ai_id

    def get_ai_move(self, ai_id):
        """Determine the next move for an AI character"""
        if ai_id not in self.player_positions:
            return None

        position = self.player_positions[ai_id]
        x, y = position.get("x", 0), position.get("y", 0)

        # Get all possible moves (up, down, left, right)
        possible_moves = [
            {"x": x, "y": y-1},  # up
            {"x": x, "y": y+1},  # down
            {"x": x-1, "y": y},  # left
            {"x": x+1, "y": y}   # right
        ]

        # Filter to only valid moves
        valid_moves = []
        for move in possible_moves:
            move_x, move_y = move["x"], move["y"]
            if self.is_valid_move(move_x, move_y) and not self.is_occupied(move_x, move_y):
                valid_moves.append(move)

        # If no valid moves, return None
        if not valid_moves:
            return None

        # For now, just pick a random valid move
        import random
        return random.choice(valid_moves) if valid_moves else None

    async def process_ai_turns(self, websocket):
        """Process turns for all AI characters"""
        for ai_char in self.ai_characters:
            ai_id = ai_char["id"]
            ai_type = ai_char["type"]

            # Get the AI's next move
            next_move = self.get_ai_move(ai_id)

            if next_move:
                # Store the original position for reference
                original_pos = self.player_positions[ai_id].copy()

                # Move the AI character
                self.move_character(ai_id, next_move)

                # Send a message about the AI's movement
                await websocket.send_json({
                    "type": "narration",
                    "content": f"The {ai_type} moves from ({original_pos['x']}, {original_pos['y']}) to ({next_move['x']}, {next_move['y']}).",
                    "timestamp": time.time()
                })

                # Send a move_character message to update the UI
                await websocket.send_json({
                    "type": "dm_response",
                    "move_character": {
                        "character_id": ai_id,
                        "to_x": next_move["x"],
                        "to_y": next_move["y"]
                    },
                    "timestamp": time.time()
                })

                # Play movement sound
                await self.play_sound(websocket, "move")
            else:
                # AI is trapped or has no valid moves
                await websocket.send_json({
                    "type": "narration",
                    "content": f"The {ai_type} is trapped and cannot move!",
                    "timestamp": time.time()
                })

                # Play trapped sound
                await self.play_sound(websocket, "trapped")

    async def process_ai_chat(self, websocket, player_message):
        """Generate AI responses to player chat messages as a Dungeon Master"""
        # More sophisticated DM-style responses
        player_msg_lower = player_message.lower()

        # Use the Dungeon Master as the responder, not a random AI character
        dm_name = "Dungeon Master"
        dm_id = "dm"

        # Get game context
        map_name = self.map_data.get("name", "the realm") if self.map_data else "the realm"
        terrain_type = list(self.map_data.get("terrain_distribution", {}).keys())[0] if self.map_data and self.map_data.get("terrain_distribution") else "varied"
        num_characters = len(self.characters)
        num_ai = len(self.ai_characters)
        in_combat = self.in_combat

        # Get character information
        character_types = [char["type"] for char in self.characters]
        ai_types = [char["type"] for char in self.ai_characters]

        # Generate a DM response based on the player's message and game context
        response = None

        # Check for greeting
        if any(word in player_msg_lower for word in ["hello", "hi", "greetings", "hey"]):
            if num_characters == 0:
                response = f"Welcome to {map_name}! To begin your adventure, add a character to the map by clicking on an empty space."
            else:
                char_list = ", ".join(character_types)
                response = f"Greetings, brave adventurers! {char_list} stand ready in {map_name}. What would you like to do next?"

        # Check for movement or exploration intent
        elif any(word in player_msg_lower for word in ["move", "go", "walk", "travel", "explore"]):
            directions = {
                "north": "north", "up": "north", "forward": "north",
                "south": "south", "down": "south", "backward": "south",
                "east": "east", "right": "east",
                "west": "west", "left": "west"
            }

            direction = None
            for key, value in directions.items():
                if key in player_msg_lower:
                    direction = value
                    break

            if direction:
                if terrain_type == "forest":
                    response = f"As you move {direction}, the dense forest surrounds you. The trees seem to whisper ancient secrets. Be careful, as many creatures lurk in these woods."
                elif terrain_type == "mountain":
                    response = f"You trek {direction} along the rugged mountain path. The air grows thinner, but the view becomes more breathtaking with each step."
                else:
                    response = f"You venture {direction} across the {terrain_type} landscape. Who knows what adventures await in that direction?"
            else:
                response = f"The {terrain_type} landscape stretches before you, full of possibilities. To move a character, select them and then click on a valid destination."

        # Check for combat intent
        elif any(word in player_msg_lower for word in ["attack", "fight", "battle", "combat", "kill", "slay"]):
            if num_ai == 0:
                response = "You prepare for battle, but there are no enemies in sight. Perhaps you should spawn some monsters first?"
            else:
                enemy_list = ", ".join(ai_types)
                self.in_combat = True
                response = f"Roll for initiative! {enemy_list} {'stands' if num_ai == 1 else 'stand'} before you, ready for combat. What is your first move?"
                # Play attack sound
                await self.play_sound(websocket, "attack")

        # Check for quest or information request
        elif any(word in player_msg_lower for word in ["quest", "mission", "task", "adventure", "story", "lore", "history"]):
            quests = [
                f"Legend speaks of a lost artifact hidden somewhere in {map_name}. It is said to grant its wielder immense power, but it's guarded by ancient protectors.",
                f"The locals have been troubled by mysterious disappearances near the {terrain_type}. They're offering a reward to anyone brave enough to investigate.",
                f"An ancient evil stirs beneath {map_name}. The signs are subtle - withering plants, animals fleeing, and strange dreams plaguing the locals.",
                f"A powerful wizard has requested aid in collecting rare ingredients from the dangerous parts of {map_name} for a spell that could save the realm."
            ]
            response = random.choice(quests)

        # Check for item or treasure related queries
        elif any(word in player_msg_lower for word in ["item", "treasure", "gold", "weapon", "armor", "loot", "find"]):
            items = [
                "You notice a glint of metal partially buried in the ground. It could be worth investigating.",
                "A weathered chest sits half-hidden among the terrain. It appears to be locked.",
                "You spot what looks like an abandoned camp. Perhaps there are useful supplies left behind.",
                "There's a merchant's caravan in the distance. They might have items to trade if you have gold."
            ]
            response = random.choice(items)

        # Check for dice roll or skill check
        elif any(word in player_msg_lower for word in ["roll", "check", "skill", "ability", "strength", "dexterity", "wisdom", "intelligence"]):
            skills = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]
            skill = random.choice(skills)
            roll = random.randint(1, 20)

            if roll == 20:
                result = "Critical success!"
                await self.play_sound(websocket, "victory")
            elif roll == 1:
                result = "Critical failure!"
                await self.play_sound(websocket, "defeat")
            elif roll >= 15:
                result = "Success!"
            elif roll >= 10:
                result = "Partial success."
            else:
                result = "Failure."

            response = f"You roll a {skill} check: {roll}. {result}"

        # Check for help request
        elif any(word in player_msg_lower for word in ["help", "assist", "guide", "how", "what"]):
            help_topics = [
                "To move a character, select them and then click on a valid destination.",
                "You can spawn AI characters by using the 'spawn_ai' action with a character type and position.",
                "Combat is turn-based. When in combat, characters take turns making actions.",
                "Explore the map to find treasures, complete quests, and encounter creatures both friendly and hostile.",
                "Use the chat to describe your actions and I'll narrate the results and consequences."
            ]
            response = random.choice(help_topics)

        # Default response - generate a random event or observation
        else:
            events = [
                f"A gentle breeze rustles through the {terrain_type}, carrying the scent of adventure.",
                f"You notice tracks in the ground. Something or someone passed through here recently.",
                f"The sky darkens slightly as clouds pass overhead. The weather might turn soon.",
                f"A distant sound catches your attention - perhaps another traveler... or something less friendly.",
                f"You feel like you're being watched, though you can't spot anyone nearby.",
                f"The local wildlife seems unusually quiet. Something might have scared them off.",
                f"You spot a small settlement in the distance. It might be worth investigating for supplies or information."
            ]
            response = random.choice(events)

        # Add to chat history
        self.chat_history.append({
            "sender": "player",
            "message": player_message,
            "timestamp": time.time()
        })

        self.chat_history.append({
            "sender": dm_id,
            "message": response,
            "timestamp": time.time()
        })

        # Send the DM response
        await websocket.send_json({
            "type": "chat_message",
            "sender": dm_name,
            "content": response,
            "timestamp": time.time()
        })

        # Also send as narration for all clients
        await websocket.send_json({
            "type": "narration",
            "content": response,
            "timestamp": time.time()
        })

        # Play a sound effect for the DM response
        await self.play_sound(websocket, "chat")

        return response

    async def play_sound(self, websocket, sound_type):
        """Send a message to play a sound effect"""
        if sound_type in self.sound_effects:
            sound_url = self.sound_effects[sound_type]
            await websocket.send_json({
                "type": "play_sound",
                "sound_url": sound_url,
                "timestamp": time.time()
            })

    def roll_dice(self, dice_type, num_dice=1):
        """Roll dice and return the results"""
        import random

        # Parse dice type (e.g., "d20", "d6", etc.)
        try:
            sides = int(dice_type.replace("d", ""))
        except ValueError:
            return None

        # Roll the dice
        results = [random.randint(1, sides) for _ in range(num_dice)]
        total = sum(results)

        # Store the results
        roll_id = f"roll_{len(self.dice_results) + 1}"
        self.dice_results[roll_id] = {
            "dice_type": dice_type,
            "num_dice": num_dice,
            "results": results,
            "total": total,
            "timestamp": time.time()
        }

        return {
            "roll_id": roll_id,
            "dice_type": dice_type,
            "num_dice": num_dice,
            "results": results,
            "total": total
        }

@app.websocket("/ws/dnd/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    print(f"Client connected: {session_id}")

    # Store the connection
    active_connections[session_id] = websocket

    # Create a new game state for this session if it doesn't exist
    if session_id not in game_states:
        game_states[session_id] = GameState()

    game_state = game_states[session_id]

    try:
        # Send initial welcome message
        await websocket.send_json({
            "type": "narration",
            "content": "Welcome to the D&D Game! Select a map theme to begin your adventure.",
            "timestamp": time.time()
        })

        # Main game loop
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received message: {message}")

            message_type = message.get("type", "")

            if message_type == "generate_map":
                # Handle map generation request
                theme = message.get("theme", "fantasy adventure")
                print(f"Generating map with theme: {theme}")

                try:
                    # Generate a map
                    map_data = generate_map(theme)

                    # Store the map data in the game state
                    game_state.map_data = map_data

                    # Reset player positions when a new map is generated
                    game_state.player_positions = {}
                    game_state.characters = []

                    # Send the map data to the client
                    await websocket.send_json({
                        "type": "map_data",
                        "map_data": map_data,
                        "timestamp": time.time()
                    })

                    # Log the map data being sent
                    print(f"Sending map data: {json.dumps(map_data)[:200]}...")

                    # Send a description
                    primary_terrain = list(map_data["terrain_distribution"].keys())[0] if map_data["terrain_distribution"] else "varied"
                    description = f"You find yourself in a {theme} realm. The landscape is dominated by {primary_terrain} terrain. What adventures await you in this mysterious land?"

                    await websocket.send_json({
                        "type": "narration",
                        "content": description,
                        "timestamp": time.time()
                    })

                    # Play background music
                    if session_id in game_states:
                        await game_states[session_id].play_sound(websocket, "background")

                except Exception as e:
                    print(f"Error generating map: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "content": f"Error generating map: {str(e)}",
                        "timestamp": time.time()
                    })

            elif message_type == "player_action":
                # Handle player action
                action = message.get("action", {})
                action_type = action.get("type", "")

                # Store the last action in the game state
                game_state.last_action = action

                if action_type == "add_character":
                    # Handle adding a new character
                    character_id = action.get("character_id", "")
                    character_type = action.get("character_type", "")
                    position = action.get("position", {})

                    # Add the character to the game state
                    game_state.add_character(character_id, character_type, position)

                    # Check if the character is trapped at their starting position
                    is_trapped = game_state.is_player_trapped(character_id)

                    if is_trapped:
                        await websocket.send_json({
                            "type": "narration",
                            "content": f"A new {character_type} has joined the adventure, but they're trapped! They need to find a way out.",
                            "timestamp": time.time()
                        })
                        # Play trapped sound
                        await game_state.play_sound(websocket, "trapped")
                    else:
                        await websocket.send_json({
                            "type": "narration",
                            "content": f"A new {character_type} has joined the adventure!",
                            "timestamp": time.time()
                        })
                        # Play appropriate sound based on character type
                        if "monster" in character_type.lower() or "beast" in character_type.lower() or "dragon" in character_type.lower():
                            await game_state.play_sound(websocket, "monster")
                        elif "wizard" in character_type.lower() or "mage" in character_type.lower() or "sorcerer" in character_type.lower():
                            await game_state.play_sound(websocket, "magic")
                        else:
                            await game_state.play_sound(websocket, "chat")

                elif action_type == "move_character":
                    # Handle moving a character
                    character_id = action.get("character_id", "")
                    from_pos = action.get("from", {})
                    to_pos = action.get("to", {})
                    character_type = action.get("character_type", "")

                    to_x = to_pos.get("x", 0)
                    to_y = to_pos.get("y", 0)

                    # Check if the move is valid (not onto an obstacle)
                    if game_state.is_valid_move(to_x, to_y):
                        # Move is valid, update the character position
                        game_state.move_character(character_id, to_pos)

                        # Check if the player is now trapped
                        is_trapped = game_state.is_player_trapped(character_id)

                        # Send appropriate message based on trapped status
                        if is_trapped:
                            await websocket.send_json({
                                "type": "narration",
                                "content": f"The {character_type} moves to a new position but is now trapped! All surrounding paths are blocked by obstacles or other characters.",
                                "timestamp": time.time()
                            })
                            # Play trapped sound
                            await game_state.play_sound(websocket, "trapped")
                        else:
                            await websocket.send_json({
                                "type": "narration",
                                "content": f"The {character_type} moves to a new position.",
                                "timestamp": time.time()
                            })
                            # Play movement sound
                            await game_state.play_sound(websocket, "move")
                    else:
                        # Move is invalid (obstacle), send an error message
                        await websocket.send_json({
                            "type": "narration",
                            "content": f"The {character_type} cannot move there - that area is impassable!",
                            "timestamp": time.time()
                        })

                        # Send a move_character message to move the character back to its original position
                        await websocket.send_json({
                            "type": "dm_response",
                            "move_character": {
                                "character_id": character_id,
                                "to_x": from_pos.get("x", 0),
                                "to_y": from_pos.get("y", 0)
                            },
                            "timestamp": time.time()
                        })

                elif action_type == "remove_character":
                    # Handle removing a character
                    character_id = action.get("character_id", "")
                    character_type = action.get("character_type", "")

                    # Remove the character from the game state
                    game_state.remove_character(character_id)

                    await websocket.send_json({
                        "type": "narration",
                        "content": f"The {character_type} has left the adventure.",
                        "timestamp": time.time()
                    })

                elif action_type == "spawn_ai":
                    # Handle spawning an AI character
                    character_type = action.get("character_type", "Monster")
                    position = action.get("position", {"x": 5, "y": 5})

                    # Add the AI character to the game state
                    ai_id = game_state.add_ai_character(character_type, position)

                    # Notify about the new AI character
                    await websocket.send_json({
                        "type": "narration",
                        "content": f"A {character_type} (AI) has appeared at position ({position['x']}, {position['y']})!",
                        "timestamp": time.time()
                    })

                    # Send a message to add the character to the UI
                    await websocket.send_json({
                        "type": "dm_response",
                        "add_character": {
                            "character_id": ai_id,
                            "character_type": character_type,
                            "position": position
                        },
                        "timestamp": time.time()
                    })

                    # Play appropriate sound based on AI character type
                    if "monster" in character_type.lower() or "beast" in character_type.lower() or "dragon" in character_type.lower():
                        await game_state.play_sound(websocket, "monster")
                    elif "wizard" in character_type.lower() or "mage" in character_type.lower() or "sorcerer" in character_type.lower():
                        await game_state.play_sound(websocket, "magic")
                    else:
                        await game_state.play_sound(websocket, "attack")

                elif action_type == "ai_turn":
                    # Process turns for all AI characters
                    await game_state.process_ai_turns(websocket)

                elif action_type == "chat":
                    # Handle player chat message
                    message_content = action.get("message", "")
                    sender = action.get("sender", "Player")

                    # Add to chat history
                    game_state.chat_history.append({
                        "sender": sender,
                        "message": message_content,
                        "timestamp": time.time()
                    })

                    # Broadcast the message to all clients
                    await websocket.send_json({
                        "type": "chat_message",
                        "sender": sender,
                        "content": message_content,
                        "timestamp": time.time()
                    })

                    # Always process DM response, regardless of AI characters
                    await game_state.process_ai_chat(websocket, message_content)

                    # Play chat sound
                    await game_state.play_sound(websocket, "chat")

                elif action_type == "roll_dice":
                    # Handle dice rolling
                    dice_type = action.get("dice_type", "d20")
                    num_dice = action.get("num_dice", 1)
                    character_id = action.get("character_id", "")

                    # Roll the dice
                    roll_result = game_state.roll_dice(dice_type, num_dice)

                    if roll_result:
                        # Get character info for the message
                        character_type = "Unknown"
                        for char in game_state.characters:
                            if char["id"] == character_id:
                                character_type = char["type"]
                                break

                        # Create result message
                        if num_dice == 1:
                            result_msg = f"The {character_type} rolled a {dice_type} and got {roll_result['total']}!"
                        else:
                            result_msg = f"The {character_type} rolled {num_dice}{dice_type} and got {roll_result['results']} for a total of {roll_result['total']}!"

                        # Send the result
                        await websocket.send_json({
                            "type": "dice_result",
                            "character_id": character_id,
                            "roll_result": roll_result,
                            "content": result_msg,
                            "timestamp": time.time()
                        })

                        # Also send as narration for all clients
                        await websocket.send_json({
                            "type": "narration",
                            "content": result_msg,
                            "timestamp": time.time()
                        })

                        # Play appropriate dice sound based on the roll result
                        if dice_type == "d20" and roll_result['total'] == 20:
                            # Critical hit!
                            await game_state.play_sound(websocket, "victory")
                        elif dice_type == "d20" and roll_result['total'] == 1:
                            # Critical fail!
                            await game_state.play_sound(websocket, "defeat")
                        elif dice_type.startswith("d") and roll_result['total'] >= int(0.8 * int(dice_type[1:]) * num_dice):
                            # High roll (80% or higher of maximum possible)
                            await game_state.play_sound(websocket, "surprise")
                        else:
                            # Normal roll
                            await game_state.play_sound(websocket, "dice")

            elif message_type == "user_input":
                # Handle direct user chat input
                message_content = message.get("content", "")

                # Process the chat message as if it were a player_action with type "chat"
                # Add to chat history
                game_state.chat_history.append({
                    "sender": "Player",
                    "message": message_content,
                    "timestamp": time.time()
                })

                # Broadcast the message to all clients
                await websocket.send_json({
                    "type": "chat_message",
                    "sender": "Player",
                    "content": message_content,
                    "timestamp": time.time()
                })

                # Always process DM response, regardless of AI characters
                await game_state.process_ai_chat(websocket, message_content)

                # Play chat sound
                await game_state.play_sound(websocket, "chat")

            elif message_type == "get_state":
                # Handle request for current game state
                # This is used by the client to sync the game state

                # Create a response with the current game state
                response = {
                    "type": "narration",
                    "content": "The adventure continues...",
                    "timestamp": time.time()
                }

                # Send the response
                await websocket.send_json(response)

            # Sleep briefly to prevent overwhelming the server
            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        # Clean up on disconnect
        if session_id in active_connections:
            del active_connections[session_id]
        if session_id in game_states:
            del game_states[session_id]
        print(f"Client disconnected: {session_id}")

    except Exception as e:
        # Handle other exceptions
        print(f"Error in WebSocket connection: {e}")
        await websocket.send_json({
            "type": "error",
            "content": str(e),
            "timestamp": time.time()
        })

        # Clean up
        if session_id in active_connections:
            del active_connections[session_id]
        if session_id in game_states:
            del game_states[session_id]

@app.get("/")
async def root():
    return {"message": "D&D Dungeon Master API is running"}

@app.get("/chat")
async def chat_page():
    from fastapi.responses import FileResponse
    return FileResponse("chat_test_simple.html")

@app.get("/dnd")
async def dnd_chat_page():
    from fastapi.responses import FileResponse
    return FileResponse("dnd_chat.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
