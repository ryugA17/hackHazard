import os
import time
import asyncio
import json
import random
from typing import Dict, List, Optional, Any
import pyautogui
from groq import Groq
from PIL import Image
import io
import base64

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Configuration
CONFIG = {
    "model": "llama-3.3-70b-versatile",
    "game_window_title": "D&D Game Map",  # Title of the game window
    "input_delay": 0.1,  # seconds between inputs
    "sampling_rate": 2,  # seconds between game state checks
}

# Game state tracking
class GameState:
    def __init__(self):
        self.characters = []
        self.current_map = "default"
        self.player_positions = {}
        self.in_combat = False
        self.current_turn = None
        self.narrative_history = []
        self.last_action = None
        self.dice_rolls = []

    def to_dict(self) -> Dict:
        """Convert game state to dictionary for serialization"""
        return {
            "characters": self.characters,
            "current_map": self.current_map,
            "player_positions": self.player_positions,
            "in_combat": self.in_combat,
            "current_turn": self.current_turn,
            "narrative_history": self.narrative_history[-5:] if self.narrative_history else [],
            "last_action": self.last_action,
            "dice_rolls": self.dice_rolls[-5:] if self.dice_rolls else []
        }

    def add_narrative(self, text: str) -> None:
        """Add a narrative entry to the history"""
        self.narrative_history.append({
            "text": text,
            "timestamp": time.time()
        })

    def add_dice_roll(self, roll_type: str, result: int) -> None:
        """Add a dice roll to the history"""
        self.dice_rolls.append({
            "type": roll_type,
            "result": result,
            "timestamp": time.time()
        })

class DungeonMaster:
    def __init__(self):
        self.game_state = GameState()
        self.last_narration_time = 0
        self.narration_cooldown = 3  # seconds between narrations

    async def setup_game_window(self) -> bool:
        """Find and focus the game window (simplified version)"""
        try:
            # In a real implementation, we would use pyautogui to find and focus the window
            # For now, we'll just simulate success
            print("Simulating window focus - in a real implementation, we would use pyautogui")
            return True
        except Exception as e:
            print(f"Failed to find game window: {e}")
            return False

    async def get_screen_state(self) -> Dict:
        """Capture the current game state (simplified version)"""
        try:
            # Simulate window focus
            await self.setup_game_window()

            # In a real implementation, we would capture the screen
            # For now, we'll just create a placeholder image
            width, height = 800, 600
            screenshot = Image.new('RGB', (width, height), color='black')

            # Convert PIL Image to base64 string for sending over WebSocket
            buffered = io.BytesIO()
            screenshot.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()

            # Get simulated game text
            text = await self.get_game_text()

            return {
                "screenshot": img_str,
                "text": text,
                "window_title": "D&D Game Map",
                "is_focused": True,
                "game_state": self.game_state.to_dict()
            }

        except Exception as e:
            print(f"Failed to capture game state: {e}")
            return {
                "error": str(e),
                "game_state": self.game_state.to_dict()
            }

    async def get_game_text(self) -> str:
        """Extract text from the game window (simplified version)"""
        try:
            # In a real implementation, we would extract text from the screen
            # For now, we'll just return a placeholder text
            return "The game board shows a fantasy map with several character tokens placed on it."

        except Exception as e:
            print(f"Failed to get game text: {e}")
            return ""

    async def analyze_game_state(self, state: Dict) -> str:
        """Analyze the current game state and generate DM narration"""
        try:
            # Extract relevant information from state
            text = state.get("text", "")

            # Get the game state from the state object or use our internal state
            game_state_dict = state.get("game_state", self.game_state.to_dict())

            # Extract additional map data if available
            map_data = state.get("map_data", {})
            grid_cells = state.get("grid_cells", [])
            tokens = state.get("tokens", [])
            terrain = state.get("terrain", {})

            # Update our internal game state with the new information
            if "current_map" in game_state_dict:
                self.game_state.current_map = game_state_dict["current_map"]

            if "characters" in game_state_dict:
                self.game_state.characters = game_state_dict["characters"]
            elif tokens:
                # Convert tokens to characters format
                self.game_state.characters = [
                    {"id": token.get("id", ""), "type": token.get("label", "Unknown")}
                    for token in tokens
                ]

            if "player_positions" in game_state_dict:
                self.game_state.player_positions = game_state_dict["player_positions"]
            elif tokens:
                # Convert tokens positions to player_positions format
                self.game_state.player_positions = {
                    token.get("id", ""): {"x": token.get("x", 0), "y": token.get("y", 0)}
                    for token in tokens
                }

            # Create a more detailed prompt for the LLM
            prompt = self._create_enhanced_dm_prompt(
                text,
                self.game_state.to_dict(),
                map_data,
                grid_cells,
                tokens,
                terrain
            )

            # Call Groq API
            response = client.chat.completions.create(
                model=CONFIG["model"],
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )

            # Extract the narration
            narration = response.choices[0].message.content

            # Update game state with new narration
            self.game_state.add_narrative(narration)
            self.last_narration_time = time.time()

            return narration

        except Exception as e:
            print(f"Error analyzing game state: {e}")
            return f"The Dungeon Master pauses for a moment... (Error: {str(e)})"

    def _create_enhanced_dm_prompt(self, text: str, game_state: Dict,
                                  map_data: Dict, grid_cells: List,
                                  tokens: List, terrain: Dict) -> str:
        """Create an enhanced prompt for the DM based on detailed game state"""
        # Extract relevant information from game state
        characters = game_state.get("characters", [])
        current_map = game_state.get("current_map", "default")
        player_positions = game_state.get("player_positions", {})
        in_combat = game_state.get("in_combat", False)
        narrative_history = game_state.get("narrative_history", [])
        last_action = game_state.get("last_action")
        dice_rolls = game_state.get("dice_rolls", [])

        # Get map description based on the current map
        map_description = self._get_map_description(current_map)

        # Process tokens to get character information
        character_descriptions = []
        if tokens:
            for token in tokens:
                token_id = token.get("id", "")
                token_label = token.get("label", "Unknown")
                token_x = token.get("x", 0)
                token_y = token.get("y", 0)

                # Get terrain at this position if available
                terrain_type = "unknown"
                if grid_cells and token_y < len(grid_cells) and token_x < len(grid_cells[token_y]):
                    cell = grid_cells[token_y][token_x]
                    terrain_type = cell.get("terrain", "unknown")

                character_descriptions.append(
                    f"- {token_label} (ID: {token_id}) is at position ({token_x}, {token_y}) on {terrain_type} terrain"
                )
        elif characters:
            for char in characters:
                char_id = char.get("id", "unknown")
                char_type = char.get("type", "unknown")
                position = player_positions.get(char_id, {"x": "?", "y": "?"})
                character_descriptions.append(
                    f"- {char_type} (ID: {char_id}) is at position ({position.get('x', '?')}, {position.get('y', '?')})"
                )

        # Build the enhanced prompt
        prompt = f"""
        # Current Game State

        Map: {current_map} - {map_description}
        In Combat: {"Yes" if in_combat else "No"}

        ## Characters on Map
        {self._format_list(character_descriptions) if character_descriptions else "No characters on map"}

        ## Recent Game Text
        {text}

        ## Recent Narrative History
        {self._format_narrative_history(narrative_history)}

        ## Last Player Action
        {self._format_last_action(last_action)}

        ## Recent Dice Rolls
        {self._format_dice_rolls(dice_rolls)}

        # Task
        Based on the current game state, provide a Dungeon Master narration that:
        1. Describes the current scene and environment in vivid detail
        2. Responds to any player actions or movements
        3. Acknowledges the positions and actions of characters on the map
        4. Maintains the fantasy atmosphere and D&D setting
        5. Advances the story in an engaging way

        Keep your response in-character as a Dungeon Master. Be concise but vivid.
        """

        return prompt

    def _get_map_description(self, map_id: str) -> str:
        """Get a description for the given map ID"""
        map_descriptions = {
            "default": "A classic fantasy map with varied terrain including forests, plains, and mountains.",
            "sea": "A coastal region with beaches, cliffs, and a vast ocean stretching to the horizon.",
            "gridless": "A wide open plain with tall grass swaying in the breeze.",
            "contrast-before": "Ancient ruins with crumbling stone structures and mysterious magical auras.",
            "contrast-after": "A dense forest with towering trees, underbrush, and hidden paths."
        }

        return map_descriptions.get(map_id, "An unknown region with mysterious features.")

    def _format_list(self, items: List[str]) -> str:
        """Format a list of items for the prompt"""
        if not items:
            return "None"
        return "\n".join(items)

    def _format_last_action(self, action: Optional[Dict]) -> str:
        """Format the last action for the prompt"""
        if not action:
            return "No recent action"

        action_type = action.get("type", "unknown")

        if action_type == "move_character":
            char_id = action.get("character_id", "unknown")
            char_type = action.get("character_type", "character")
            from_pos = action.get("from", {})
            to_pos = action.get("to", {})
            return f"{char_type} (ID: {char_id}) moved from ({from_pos.get('x', '?')}, {from_pos.get('y', '?')}) to ({to_pos.get('x', '?')}, {to_pos.get('y', '?')})"

        elif action_type == "add_character":
            char_id = action.get("character_id", "unknown")
            char_type = action.get("character_type", "character")
            position = action.get("position", {})
            return f"New {char_type} (ID: {char_id}) added at position ({position.get('x', '?')}, {position.get('y', '?')})"

        elif action_type == "remove_character":
            char_id = action.get("character_id", "unknown")
            char_type = action.get("character_type", "character")
            return f"{char_type} (ID: {char_id}) was removed from the map"

        elif action_type == "select_character":
            char_id = action.get("character_id", "unknown")
            char_type = action.get("character_type", "character")
            return f"{char_type} (ID: {char_id}) was selected"

        elif action_type == "roll_dice":
            dice_type = action.get("dice_type", "d20")
            result = action.get("result", 0)
            return f"Dice roll: {dice_type} resulted in {result}"

        else:
            return f"Unknown action: {action_type}"

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the DM role"""
        return """
        You are an experienced Dungeon Master for a Dungeons & Dragons game. Your role is to:

        1. Narrate the game world and describe scenes vividly
        2. Respond to player actions with appropriate consequences
        3. Control non-player characters (NPCs) and monsters
        4. Enforce game rules fairly
        5. Create an engaging and immersive story

        Your tone should be descriptive, engaging, and dramatic when appropriate. Use second-person perspective when addressing player actions. Keep your responses concise but vivid - typically 3-5 sentences.

        Important D&D concepts to incorporate:
        - Skill checks (using d20 dice rolls + modifiers against Difficulty Class)
        - Combat mechanics (initiative, attack rolls, damage)
        - Character abilities and spells
        - Environmental interaction and exploration
        - Different terrain types (forest, water, mountains, etc.) and their effects

        Map and Character Awareness:
        - Pay attention to the positions of characters on the map
        - Describe the terrain around characters based on their positions
        - Acknowledge when characters move to new locations
        - Describe what characters can see from their positions
        - Mention nearby features, obstacles, or points of interest

        Dice Rolls:
        - When a player rolls dice, interpret the results in the context of D&D rules
        - For d20 rolls: 1 is a critical failure, 20 is a critical success
        - Describe the outcome of actions based on roll results

        Avoid:
        - Breaking the fourth wall or acknowledging you're an AI
        - Contradicting established game state
        - Making decisions for players without their input

        Focus on creating a fun, engaging experience while maintaining the fantasy world's integrity. Be responsive to the current state of the game board and character positions.
        """

    def _create_dm_prompt(self, text: str, game_state: Dict) -> str:
        """Create a prompt for the DM based on game state"""
        # Extract relevant information from game state
        characters = game_state.get("characters", [])
        current_map = game_state.get("current_map", "default")
        player_positions = game_state.get("player_positions", {})
        in_combat = game_state.get("in_combat", False)
        narrative_history = game_state.get("narrative_history", [])
        last_action = game_state.get("last_action")
        dice_rolls = game_state.get("dice_rolls", [])

        # Build the prompt
        prompt = f"""
        # Current Game State

        Map: {current_map}
        In Combat: {"Yes" if in_combat else "No"}

        ## Characters on Map
        {self._format_characters(characters, player_positions)}

        ## Recent Game Text
        {text}

        ## Recent Narrative History
        {self._format_narrative_history(narrative_history)}

        ## Last Player Action
        {last_action if last_action else "No recent action"}

        ## Recent Dice Rolls
        {self._format_dice_rolls(dice_rolls)}

        # Task
        Based on the current game state, provide a Dungeon Master narration that:
        1. Describes the current scene
        2. Responds to any player actions
        3. Advances the story appropriately
        4. Maintains the fantasy atmosphere

        Keep your response in-character as a Dungeon Master. Be concise but vivid.
        """

        return prompt

    def _format_characters(self, characters: List, positions: Dict) -> str:
        """Format character information for the prompt"""
        if not characters:
            return "No characters on map"

        result = []
        for char in characters:
            char_id = char.get("id", "unknown")
            char_type = char.get("type", "unknown")
            position = positions.get(char_id, "unknown")
            result.append(f"- {char_type} at position {position}")

        return "\n".join(result)

    def _format_narrative_history(self, history: List) -> str:
        """Format narrative history for the prompt"""
        if not history:
            return "No recent narrative"

        result = []
        for entry in history:
            text = entry.get("text", "")
            result.append(f"- {text}")

        return "\n".join(result)

    def _format_dice_rolls(self, rolls: List) -> str:
        """Format dice rolls for the prompt"""
        if not rolls:
            return "No recent dice rolls"

        result = []
        for roll in rolls:
            roll_type = roll.get("type", "")
            result = roll.get("result", 0)
            result.append(f"- {roll_type}: {result}")

        return "\n".join(result)

    async def execute_action(self, action: Dict) -> None:
        """Execute a game action based on DM decision (simplified version)"""
        try:
            action_type = action.get("type")

            if action_type == "move_character":
                # In a real implementation, we would move the character on screen
                # For now, just update our internal state
                character_id = action.get("character_id")
                to_position = action.get("to", {})

                # Update player positions in game state
                if character_id and to_position:
                    self.game_state.player_positions[character_id] = to_position

            elif action_type == "start_combat":
                self.game_state.in_combat = True
                print("Combat started")

            elif action_type == "end_combat":
                self.game_state.in_combat = False
                print("Combat ended")

            elif action_type == "roll_dice":
                # In a real implementation, we might show dice animation
                # For now, just log the roll
                dice_type = action.get("dice_type", "d20")
                result = action.get("result", 0)
                print(f"Dice roll: {dice_type} = {result}")

            # Update game state
            self.game_state.last_action = action

        except Exception as e:
            print(f"Failed to execute action: {e}")

    async def process_user_input(self, content: str, dice_roll: Optional[Dict] = None) -> Dict:
        """Process user input and generate a response"""
        try:
            # Create a prompt for the LLM based on user input
            prompt = self._create_user_input_prompt(content, dice_roll)

            # Call Groq API
            response = client.chat.completions.create(
                model=CONFIG["model"],
                messages=[
                    {"role": "system", "content": self._get_dm_interactive_prompt()},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )

            # Extract the response
            dm_response = response.choices[0].message.content

            # Parse the response for special commands
            parsed_response = self._parse_dm_response(dm_response)

            return parsed_response

        except Exception as e:
            print(f"Error processing user input: {e}")
            return {
                "content": f"The Dungeon Master pauses for a moment... (Error: {str(e)})"
            }

    def _create_user_input_prompt(self, content: str, dice_roll: Optional[Dict] = None) -> str:
        """Create a prompt for the LLM based on user input"""
        # Get the current game state
        game_state_dict = self.game_state.to_dict()

        # Format dice roll information if available
        dice_roll_text = ""
        if dice_roll:
            dice_type = dice_roll.get("type", "d20")
            result = dice_roll.get("result", 0)
            dice_roll_text = f"The player just rolled a {result} on a {dice_type}."

        # Build the prompt
        prompt = f"""
        # Current Game State

        Map: {game_state_dict.get("current_map", "default")}
        In Combat: {"Yes" if game_state_dict.get("in_combat", False) else "No"}

        ## Characters on Map
        {self._format_characters(game_state_dict.get("characters", []), game_state_dict.get("player_positions", {}))}

        ## Recent Narrative History
        {self._format_narrative_history(game_state_dict.get("narrative_history", []))}

        ## Recent Dice Rolls
        {self._format_dice_rolls(game_state_dict.get("dice_rolls", []))}

        # User Input
        The player says: "{content}"

        {dice_roll_text}

        # Task
        Respond to the player's input as a Dungeon Master would. Consider:
        1. The current game state and narrative history
        2. The player's specific request or action
        3. Any dice roll results that might determine success or failure

        If the player's action requires a skill check or saving throw, you can request a dice roll.
        If the player's action would result in character movement, you can specify where the character should move.
        If the player's action would trigger a combat encounter, you can add monsters to the map.

        Keep your response in-character as a Dungeon Master.
        """

        return prompt

    def _parse_dm_response(self, response: str) -> Dict:
        """Parse the DM response for special commands"""
        result = {
            "content": response
        }

        # Check for dice roll request
        if "roll a d20" in response.lower() or "make a roll" in response.lower() or "roll for" in response.lower():
            result["request_dice_roll"] = True

            # Try to determine dice type
            dice_types = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"]
            for dice_type in dice_types:
                if dice_type in response.lower():
                    result["dice_type"] = dice_type
                    break
            else:
                result["dice_type"] = "d20"  # Default to d20 if no specific dice mentioned

        # Check for character movement
        if "moves to" in response.lower() or "moving to" in response.lower():
            # This is a simplified implementation
            # In a real implementation, we would parse the text to extract character and position
            characters = self.game_state.characters
            if characters:
                char_id = characters[0].get("id", "")
                # Just move the character to a random adjacent position for demonstration
                current_pos = self.game_state.player_positions.get(char_id, {"x": 0, "y": 0})
                new_x = current_pos.get("x", 0) + (1 if random.random() > 0.5 else -1)
                new_y = current_pos.get("y", 0) + (1 if random.random() > 0.5 else -1)

                result["move_character"] = {
                    "character_id": char_id,
                    "to_x": max(0, new_x),
                    "to_y": max(0, new_y)
                }

        # Check for adding a monster
        if "appears" in response.lower() or "monster" in response.lower() or "enemy" in response.lower():
            # Add a monster at a random position
            monster_types = ["Goblin", "Orc", "Skeleton", "Zombie", "Dragon"]
            monster_type = random.choice(monster_types)

            # Find an empty position on the map
            positions = list(self.game_state.player_positions.values())
            x, y = 5, 5  # Default position

            if positions:
                # Try to place monster near a player
                player_pos = positions[0]
                x = player_pos.get("x", 0) + random.randint(2, 4)
                y = player_pos.get("y", 0) + random.randint(2, 4)

            result["add_character"] = {
                "type": "monster",
                "label": monster_type,
                "x": max(0, x),
                "y": max(0, y)
            }

        return result

    def _get_dm_interactive_prompt(self) -> str:
        """Get the system prompt for interactive DM role"""
        return """
        You are an experienced Dungeon Master for a Dungeons & Dragons game. Your role is to:

        1. Narrate the game world and describe scenes vividly
        2. Respond to player actions with appropriate consequences
        3. Control non-player characters (NPCs) and monsters
        4. Enforce game rules fairly
        5. Create an engaging and immersive story

        Your tone should be descriptive, engaging, and dramatic when appropriate. Use second-person perspective when addressing player actions.

        Important D&D concepts to incorporate:
        - Skill checks (using d20 dice rolls + modifiers against Difficulty Class)
        - Combat mechanics (initiative, attack rolls, damage)
        - Character abilities and spells
        - Environmental interaction and exploration

        Interactive Features:
        - When a player attempts an action with uncertain outcome, ask them to "roll a d20" for the appropriate check
        - For different types of checks, you can specify different dice (d4, d6, d8, d10, d12, d20)
        - Interpret dice roll results: 1-5 (failure), 6-10 (partial success), 11-15 (success), 16-20 (great success)
        - When describing combat, you can add monsters by mentioning them appearing or attacking
        - You can move characters by describing their movement in the narrative

        Avoid:
        - Breaking the fourth wall or acknowledging you're an AI
        - Contradicting established game state
        - Making decisions for players without their input

        Focus on creating a fun, engaging experience while maintaining the fantasy world's integrity.
        """

    async def generate_adventure_start(self, state: Dict) -> str:
        """Generate an initial adventure scene when AI takes control"""
        try:
            # Extract relevant information from state
            game_state_dict = state.get("game_state", self.game_state.to_dict())

            # Create a prompt for the LLM
            prompt = f"""
            # Game State

            Map: {game_state_dict.get("current_map", "default")}
            Characters: {len(game_state_dict.get("characters", []))} character(s) on the map

            # Task
            Generate an engaging opening scene for a D&D adventure. This should:
            1. Set the scene with vivid description
            2. Introduce a compelling hook or quest
            3. Present an immediate situation for the player to respond to
            4. End with a prompt for the player's first action

            Make this opening exciting and immersive, drawing the player into the world.
            """

            # Call Groq API
            response = client.chat.completions.create(
                model=CONFIG["model"],
                messages=[
                    {"role": "system", "content": self._get_dm_interactive_prompt()},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.8
            )

            # Extract the narration
            adventure_start = response.choices[0].message.content

            # Update game state with new narration
            self.game_state.add_narrative(adventure_start)

            return adventure_start

        except Exception as e:
            print(f"Error generating adventure start: {e}")
            return "As you gather your party and prepare for adventure, the Dungeon Master unfolds a map before you. 'Welcome, brave adventurers,' they say with a gleam in their eye. 'What would you like to do first?'"

# For testing
async def test_dungeon_master():
    try:
        dm = DungeonMaster()

        # Setup game window
        window = await dm.setup_game_window()
        if not window:
            print("Failed to find game window. Please make sure the game is running.")
            return

        print("Game window found and focused.")

        # Get initial game state
        state = await dm.get_screen_state()
        print("Initial game state captured.")

        # Generate initial narration
        narration = await dm.analyze_game_state(state)
        print("\nDungeon Master says:")
        print(narration)

        # Main loop - would normally run continuously
        for _ in range(3):  # Just for testing, do 3 iterations
            await asyncio.sleep(5)  # Wait 5 seconds between updates

            # Get updated game state
            state = await dm.get_screen_state()

            # Generate new narration
            narration = await dm.analyze_game_state(state)
            print("\nDungeon Master says:")
            print(narration)

    except Exception as e:
        print(f"Error in test: {e}")

if __name__ == "__main__":
    # Run the test
    asyncio.run(test_dungeon_master())
