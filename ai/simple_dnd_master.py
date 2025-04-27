import os
import time
import asyncio
import json
import random
from typing import Dict, List, Optional, Any
from groq import Groq

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize Groq client with the new API key
PRIMARY_API_KEY = "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"
BACKUP_API_KEY = "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"  # Same as primary for now, will be replaced if needed
client = Groq(api_key=PRIMARY_API_KEY)

# Configuration
CONFIG = {
    "model": "llama-3.3-70b-versatile",
    "fallback_model": "llama-3.1-8b-instant",  # Fallback to a smaller model if the main one is rate-limited
}

# Game state tracking
class MapGenerator:
    def __init__(self):
        self.terrain_types = [
            "grass", "forest", "mountain", "water", "desert",
            "swamp", "snow", "lava", "cave", "dungeon"
        ]
        self.structure_types = [
            "castle", "village", "temple", "tower", "ruins",
            "bridge", "camp", "portal", "shrine", "tavern"
        ]
        # Visual layers for map rendering
        self.decoration_objects = {
            "grass": ["flower", "rock", "stump", "bush"],
            "forest": ["tree", "fallen_log", "mushroom", "berry_bush"],
            "mountain": ["boulder", "cave_entrance", "cliff", "nest"],
            "water": ["lily_pad", "fish", "dock", "boat"],
            "desert": ["cactus", "bones", "sand_dune", "oasis"],
            "swamp": ["roots", "murky_pool", "hanging_moss", "dead_tree"],
            "snow": ["pine_tree", "ice_patch", "snowdrift", "frozen_pond"],
            "lava": ["smoke_vent", "obsidian", "fire_pit", "stone_arch"],
            "cave": ["stalagmite", "crystal", "underground_pool", "torch"],
            "dungeon": ["torch", "chains", "altar", "treasure_chest"]
        }
        self.lighting_effects = {
            "grass": "bright",
            "forest": "dappled",
            "mountain": "clear",
            "water": "reflective",
            "desert": "harsh",
            "swamp": "foggy",
            "snow": "glittering",
            "lava": "glowing",
            "cave": "dark",
            "dungeon": "shadowy"
        }

    def generate_map(self, width: int = 20, height: int = 20, theme: str = None) -> Dict:
        """Generate a random fantasy map"""
        import random

        # Set default theme if none provided
        if not theme:
            theme = random.choice(["forest", "mountain", "dungeon", "village", "castle"])

        # Determine primary and secondary terrain based on theme
        terrain_mapping = {
            "forest": ("forest", "grass"),
            "mountain": ("mountain", "grass"),
            "dungeon": ("cave", "dungeon"),
            "village": ("grass", "forest"),
            "castle": ("grass", "mountain"),
            "desert": ("desert", "grass"),
            "swamp": ("swamp", "water"),
            "snow": ("snow", "mountain"),
            "volcanic": ("mountain", "lava"),
            "coastal": ("grass", "water")
        }

        primary_terrain, secondary_terrain = terrain_mapping.get(theme, ("grass", "forest"))

        # Generate the base grid
        grid = []
        for y in range(height):
            row = []
            for x in range(width):
                # Determine terrain type with primary terrain being more common
                if random.random() < 0.7:
                    terrain = primary_terrain
                else:
                    terrain = secondary_terrain

                # Add some random variation
                if random.random() < 0.1:
                    terrain = random.choice(self.terrain_types)

                # Generate visual layers
                # Layer 1: Base terrain (tile)
                # Layer 2: Decorative objects
                # Layer 3: Lighting and effects
                decoration = None
                if random.random() < 0.3:  # 30% chance to have decoration
                    decoration_options = self.decoration_objects.get(terrain, [])
                    if decoration_options:
                        decoration = random.choice(decoration_options)
                
                lighting = self.lighting_effects.get(terrain, "normal")

                cell = {
                    "x": x,
                    "y": y,
                    "terrain": terrain,
                    "passable": terrain not in ["water", "lava", "mountain"],
                    "structure": None,
                    "decoration": decoration,
                    "lighting": lighting,
                    "is_obstacle": terrain in ["water", "lava", "mountain"]
                }
                row.append(cell)
            grid.append(row)

        # Add structures based on theme
        num_structures = random.randint(3, 8)
        structures_added = 0

        structure_mapping = {
            "forest": ["camp", "shrine", "ruins"],
            "mountain": ["tower", "ruins", "shrine"],
            "dungeon": ["ruins", "portal", "shrine"],
            "village": ["village", "tavern", "temple"],
            "castle": ["castle", "tower", "temple"],
            "desert": ["ruins", "temple", "portal"],
            "swamp": ["ruins", "shrine", "camp"],
            "snow": ["tower", "ruins", "camp"],
            "volcanic": ["ruins", "portal", "shrine"],
            "coastal": ["village", "bridge", "tavern"]
        }

        preferred_structures = structure_mapping.get(theme, self.structure_types)

        while structures_added < num_structures:
            x = random.randint(0, width - 1)
            y = random.randint(0, height - 1)

            # Only place structures on passable terrain
            if grid[y][x]["passable"] and grid[y][x]["structure"] is None:
                grid[y][x]["structure"] = random.choice(preferred_structures)
                structures_added += 1
                # Make structure cells always passable
                grid[y][x]["passable"] = True
                grid[y][x]["is_obstacle"] = False

        # Add paths connecting structures
        structures = []
        for y in range(height):
            for x in range(width):
                if grid[y][x]["structure"]:
                    structures.append((x, y))

        # Connect structures with paths
        for i in range(len(structures) - 1):
            start_x, start_y = structures[i]
            end_x, end_y = structures[i + 1]

            # Simple path algorithm
            x, y = start_x, start_y
            while (x, y) != (end_x, end_y):
                if x < end_x:
                    x += 1
                elif x > end_x:
                    x -= 1
                elif y < end_y:
                    y += 1
                elif y > end_y:
                    y -= 1

                # Mark as path if not a structure
                if not grid[y][x]["structure"]:
                    grid[y][x]["terrain"] = "path"
                    grid[y][x]["passable"] = True
                    grid[y][x]["is_obstacle"] = False
                    # Add appropriate decoration for paths
                    if random.random() < 0.1:  # 10% chance for path decoration
                        grid[y][x]["decoration"] = random.choice(["signpost", "bench", "lantern", "small_shrine"])

        # Create map metadata
        map_data = {
            "id": f"map_{int(time.time())}",
            "name": f"{theme.capitalize()} {random.choice(['Realm', 'Land', 'Territory', 'Domain'])}",
            "description": f"A {theme} themed map with {num_structures} structures.",
            "theme": theme,
            "width": width,
            "height": height,
            "grid": grid,
            "primary_lighting": self.lighting_effects.get(primary_terrain, "normal"),
            "terrain_distribution": {
                primary_terrain: 0.7,
                secondary_terrain: 0.3
            }
        }

        return map_data

class GameState:
    def __init__(self):
        self.characters = []
        self.current_map = None
        self.map_data = None
        self.player_positions = {}
        self.in_combat = False
        self.current_turn = None
        self.narrative_history = []
        self.last_action = None
        self.dice_rolls = []
        self.inventory = {}  # Player inventory
        self.active_quests = []  # Active quests
        self.completed_quests = []  # Completed quests
        self.sound_effects = {}  # Sound effects to play

        # Generate initial map
        map_generator = MapGenerator()
        self.map_data = map_generator.generate_map()
        self.current_map = self.map_data["id"]

    def to_dict(self) -> Dict:
        """Convert game state to dictionary for serialization"""
        return {
            "characters": self.characters,
            "current_map": self.current_map,
            "map_data": self.map_data,
            "player_positions": self.player_positions,
            "in_combat": self.in_combat,
            "current_turn": self.current_turn,
            "narrative_history": self.narrative_history[-5:] if self.narrative_history else [],
            "last_action": self.last_action,
            "dice_rolls": self.dice_rolls[-5:] if self.dice_rolls else [],
            "inventory": self.inventory,
            "active_quests": self.active_quests,
            "completed_quests": self.completed_quests
        }

    def add_narrative(self, text: str) -> None:
        """Add a narrative entry to the history"""
        self.narrative_history.append({
            "text": text,
            "timestamp": time.time()
        })

    def add_dice_roll(self, roll_type: str, result: int, context: str = "") -> None:
        """Add a dice roll to the history"""
        self.dice_rolls.append({
            "type": roll_type,
            "result": result,
            "context": context,
            "timestamp": time.time()
        })
        
    def add_item_to_inventory(self, character_id: str, item: Dict) -> None:
        """Add an item to a character's inventory"""
        if character_id not in self.inventory:
            self.inventory[character_id] = []
        
        self.inventory[character_id].append(item)
        
    def remove_item_from_inventory(self, character_id: str, item_id: str) -> Dict:
        """Remove an item from a character's inventory"""
        if character_id not in self.inventory:
            return None
        
        for i, item in enumerate(self.inventory[character_id]):
            if item.get("id") == item_id:
                return self.inventory[character_id].pop(i)
        
        return None
        
    def add_quest(self, title: str, description: str, objectives: List[str], reward: Dict = None) -> Dict:
        """Add a new quest to the active quests"""
        quest_id = f"quest_{int(time.time())}"
        quest = {
            "id": quest_id,
            "title": title,
            "description": description,
            "objectives": objectives,
            "completed_objectives": [],
            "reward": reward,
            "completed": False,
            "timestamp": time.time()
        }
        
        self.active_quests.append(quest)
        return quest
        
    def complete_quest(self, quest_id: str) -> Dict:
        """Mark a quest as complete and move it to completed quests"""
        for i, quest in enumerate(self.active_quests):
            if quest.get("id") == quest_id:
                quest["completed"] = True
                quest["completion_time"] = time.time()
                completed_quest = self.active_quests.pop(i)
                self.completed_quests.append(completed_quest)
                return completed_quest
        
        return None
        
    def add_sound_effect(self, event_type: str, sound_file: str) -> None:
        """Associate a sound effect with an event type"""
        self.sound_effects[event_type] = sound_file

class DiceMechanics:
    """Handles dice rolling and outcome determination"""
    
    def __init__(self):
        self.dice_types = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"]
        self.success_thresholds = {
            "easy": 5,
            "medium": 10,
            "hard": 15,
            "very_hard": 20
        }
        self.last_rolls = []
        self.available_sound_effects = {
            "roll": "dice_roll.mp3",
            "success": "success.mp3",
            "failure": "failure.mp3",
            "critical_success": "critical_success.mp3",
            "critical_failure": "critical_failure.mp3"
        }
    
    def roll_dice(self, dice_type: str, count: int = 1) -> Dict:
        """Roll dice and return the result"""
        if dice_type not in self.dice_types:
            if dice_type.startswith("d") and dice_type[1:].isdigit():
                sides = int(dice_type[1:])
            else:
                sides = 20  # Default to d20
        else:
            sides = int(dice_type[1:])
        
        # Roll the dice
        rolls = []
        for _ in range(count):
            rolls.append(random.randint(1, sides))
        
        total = sum(rolls)
        
        # Create result object
        result = {
            "type": dice_type,
            "count": count,
            "sides": sides,
            "rolls": rolls,
            "total": total,
            "timestamp": time.time()
        }
        
        # Save for history
        self.last_rolls.append(result)
        if len(self.last_rolls) > 10:
            self.last_rolls.pop(0)  # Keep only the last 10 rolls
        
        return result
    
    def interpret_roll(self, roll: Dict, difficulty: str = "medium") -> Dict:
        """Interpret the roll result based on difficulty"""
        # Get the success threshold based on difficulty
        threshold = self.success_thresholds.get(difficulty, 10)
        
        # Default description
        description = f"You rolled {roll['total']} on {roll['count']}{roll['type']}."
        success_level = "neutral"
        sound_effect = "roll"
        
        # For d20 rolls, interpret as pass/fail
        if roll["type"] == "d20":
            # Critical success/failure handling
            if roll["total"] == 20:
                success_level = "critical_success"
                description = "Critical success! Your action succeeds spectacularly."
                sound_effect = "critical_success"
            elif roll["total"] == 1:
                success_level = "critical_failure"
                description = "Critical failure! Your action fails miserably."
                sound_effect = "critical_failure"
            else:
                # Normal success/failure
                if roll["total"] >= threshold:
                    success_level = "success"
                    if roll["total"] >= threshold + 5:
                        description = "Great success! Your action succeeds with impressive results."
                    else:
                        description = "Success! Your action succeeds as intended."
                    sound_effect = "success"
                else:
                    success_level = "failure"
                    if roll["total"] <= threshold - 5:
                        description = "Significant failure. Your action fails badly."
                    else:
                        description = "Failure. Your action doesn't succeed."
                    sound_effect = "failure"
        # Other dice types (damage dice, etc.)
        else:
            # For non-d20 dice, we just report the outcome without judgment
            success_level = "neutral"
            description = f"You rolled {roll['total']} on {roll['count']}{roll['type']}."
            
            # Add context for damage rolls
            sides = roll["sides"]
            max_possible = sides * roll["count"]
            
            if roll["total"] >= max_possible * 0.8:
                description += " That's a very high roll!"
                sound_effect = "success"
            elif roll["total"] <= max_possible * 0.2:
                description += " That's a very low roll."
                sound_effect = "failure"
        
        return {
            "original_roll": roll,
            "success_level": success_level,
            "description": description,
            "sound_effect": sound_effect,
            "difficulty": difficulty
        }
    
    def get_recommended_difficulty(self, action_description: str) -> str:
        """Determine the recommended difficulty based on the action description"""
        # Simple keyword-based difficulty estimation
        easy_keywords = ["simple", "easy", "trivial", "basic"]
        hard_keywords = ["difficult", "hard", "challenging", "complex"]
        very_hard_keywords = ["very hard", "extremely", "nearly impossible", "legendary"]
        
        action_lower = action_description.lower()
        
        for keyword in very_hard_keywords:
            if keyword in action_lower:
                return "very_hard"
        
        for keyword in hard_keywords:
            if keyword in action_lower:
                return "hard"
        
        for keyword in easy_keywords:
            if keyword in action_lower:
                return "easy"
        
        # Default to medium difficulty
        return "medium"

class DungeonMaster:
    def __init__(self):
        self.game_state = GameState()
        self.last_narration_time = 0
        self.narration_cooldown = 3  # seconds between narrations
        self.map_generator = MapGenerator()

    def _format_characters(self, characters: List, positions: Dict) -> str:
        """Format character information for the prompt"""
        if not characters:
            return "No characters on map"

        result = []
        for char in characters:
            char_id = char.get("id", "unknown")
            char_type = char.get("type", "unknown")
            position = positions.get(char_id, {"x": "?", "y": "?"})
            result.append(
                f"- {char_type} (ID: {char_id}) is at position ({position.get('x', '?')}, {position.get('y', '?')})"
            )

        return "\n".join(result)

    def _format_narrative_history(self, history: List) -> str:
        """Format narrative history for the prompt"""
        if not history:
            return "No recent narrative history"

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
            roll_result = roll.get("result", 0)
            result.append(f"- {roll_type}: {roll_result}")

        return "\n".join(result)

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

    async def setup_game_window(self) -> bool:
        """Find and focus the game window using pyautogui"""
        try:
            # Use pyautogui to find and focus the window
            import pyautogui

            # Get the screen size
            screen_width, screen_height = pyautogui.size()

            # Click in the center of the screen to focus the window
            pyautogui.click(screen_width // 2, screen_height // 2)

            print(f"Focused game window at position ({screen_width // 2}, {screen_height // 2})")
            return True
        except Exception as e:
            print(f"Failed to find game window: {e}")
            return False

    async def get_screen_state(self) -> Dict:
        """Capture the current game state using pyautogui"""
        try:
            # Focus the window
            await self.setup_game_window()

            # Use pyautogui to capture the screen
            try:
                import pyautogui

                # Take a screenshot
                screenshot = pyautogui.screenshot()

                # Try to use OCR if available
                try:
                    import pytesseract
                    text = pytesseract.image_to_string(screenshot)
                    if not text.strip():
                        text = "The game board shows a fantasy map with several character tokens placed on it."
                except ImportError:
                    print("pytesseract not installed, using default text")
                    text = "The game board shows a fantasy map with several character tokens placed on it."
                except Exception as ocr_error:
                    print(f"OCR error: {ocr_error}")
                    text = "The game board shows a fantasy map with several character tokens placed on it."

                # Get active window title if possible
                try:
                    import pygetwindow as gw
                    active_window = gw.getActiveWindow()
                    window_title = active_window.title if active_window else "D&D Game Map"
                except ImportError:
                    print("pygetwindow not installed, using default window title")
                    window_title = "D&D Game Map"
                except Exception as window_error:
                    print(f"Window detection error: {window_error}")
                    window_title = "D&D Game Map"

                return {
                    "text": text,
                    "window_title": window_title,
                    "is_focused": True,
                    "game_state": self.game_state.to_dict(),
                    "screenshot_width": screenshot.width,
                    "screenshot_height": screenshot.height
                }

            except ImportError:
                print("pyautogui not installed, using default screen state")
                return {
                    "text": "The game board shows a fantasy map with several character tokens placed on it.",
                    "window_title": "D&D Game Map",
                    "is_focused": True,
                    "game_state": self.game_state.to_dict()
                }

        except Exception as e:
            print(f"Failed to capture game state: {e}")
            return {
                "text": "The game board shows a fantasy map with several character tokens placed on it.",
                "window_title": "D&D Game Map",
                "is_focused": False,
                "game_state": self.game_state.to_dict(),
                "error": str(e)
            }

    async def get_game_text(self) -> str:
        """Extract text from the game window using OCR"""
        try:
            # Try to use pyautogui and pytesseract if available
            try:
                import pyautogui

                # Take a screenshot
                screenshot = pyautogui.screenshot()

                # Try to use OCR if available
                try:
                    import pytesseract
                    text = pytesseract.image_to_string(screenshot)

                    # If no text is detected, return a default message
                    if not text.strip():
                        return "The game board shows a fantasy map with several character tokens placed on it."

                    return text
                except ImportError:
                    print("pytesseract not installed, using default text")
                    return "The game board shows a fantasy map with several character tokens placed on it."
                except Exception as ocr_error:
                    print(f"OCR error: {ocr_error}")
                    return "The game board shows a fantasy map with several character tokens placed on it."

            except ImportError:
                print("pyautogui not installed, using default text")
                return "The game board shows a fantasy map with several character tokens placed on it."

        except Exception as e:
            print(f"Failed to get game text: {e}")
            return "The game board shows a fantasy map with several character tokens placed on it."

    async def analyze_game_state(self, state: Dict) -> str:
        """Analyze the current game state and generate DM narration"""
        try:
            # Extract relevant information from state
            text = state.get("text", "")

            # Get the game state from the state object or use our internal state
            game_state_dict = state.get("game_state", self.game_state.to_dict())

            # Update our internal game state with the new information
            if "current_map" in game_state_dict:
                self.game_state.current_map = game_state_dict["current_map"]

            if "characters" in game_state_dict:
                self.game_state.characters = game_state_dict["characters"]

            if "player_positions" in game_state_dict:
                self.game_state.player_positions = game_state_dict["player_positions"]

            # Create a prompt for the LLM
            prompt = self._create_dm_prompt(text, self.game_state.to_dict())

            try:
                # Call Groq API with multiple fallback options
                try:
                    # Try with primary key and main model first
                    print("Trying with primary API key and main model for game state analysis...")
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
                    print(f"Received narration with primary key (first 100 chars): {narration[:100]}...")
                except Exception as primary_key_error:
                    print(f"Primary API key with main model failed: {primary_key_error}. Trying backup key...")

                    try:
                        # Try with backup key and main model
                        backup_client = Groq(api_key=BACKUP_API_KEY)
                        response = backup_client.chat.completions.create(
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
                        print(f"Received narration with backup key (first 100 chars): {narration[:100]}...")
                    except Exception as backup_key_error:
                        print(f"Backup API key with main model failed: {backup_key_error}. Trying fallback model...")

                        try:
                            # Try with primary key and fallback model
                            response = client.chat.completions.create(
                                model=CONFIG["fallback_model"],
                                messages=[
                                    {"role": "system", "content": self._get_system_prompt()},
                                    {"role": "user", "content": prompt}
                                ],
                                max_tokens=500,
                                temperature=0.7
                            )

                            # Extract the narration
                            narration = response.choices[0].message.content
                            print(f"Received narration with fallback model (first 100 chars): {narration[:100]}...")
                        except Exception as fallback_model_error:
                            print(f"Fallback model failed: {fallback_model_error}. Using local fallback...")

                            # Use a local fallback response
                            narration = f"The Dungeon Master examines the map of {self.game_state.map_data.get('name', 'the realm')}. 'Welcome, brave adventurers,' they say with a gleam in their eye. 'What would you like to do first?'"
                            print("Using local fallback response due to API limitations.")
            except Exception as api_error:
                print(f"Error calling Groq API: {api_error}")
                # Provide a fallback narration
                narration = f"The Dungeon Master examines the map of {self.game_state.map_data.get('name', 'the realm')}. 'Welcome, brave adventurers,' they say with a gleam in their eye. 'What would you like to do first?'"

            # Update game state with new narration
            self.game_state.add_narrative(narration)
            self.last_narration_time = time.time()

            return narration

        except Exception as e:
            print(f"Error analyzing game state: {e}")
            return f"The Dungeon Master pauses for a moment... (Error: {str(e)})"

    async def process_user_input(self, content: str, dice_roll: Optional[Dict] = None) -> Dict:
        """Process user input and generate a response"""
        try:
            print(f"Processing user input: '{content}'")

            # Get the current game state
            game_state_dict = self.game_state.to_dict()

            # Print current characters and positions for debugging
            print(f"Current characters: {game_state_dict.get('characters', [])}")
            print(f"Current positions: {game_state_dict.get('player_positions', {})}")

            # Format dice roll information if available
            dice_roll_text = ""
            if dice_roll:
                dice_type = dice_roll.get("type", "d20")
                result = dice_roll.get("result", 0)
                dice_roll_text = f"The player just rolled a {result} on a {dice_type}."
                print(f"Dice roll: {dice_type} = {result}")

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

            IMPORTANT: If the player asks a character to move, explicitly state that the character moves to a specific direction (e.g., "The warrior moves to the north" or "The wizard walks to the east").

            Keep your response in-character as a Dungeon Master.
            """

            print(f"Sending prompt to LLM (first 100 chars): {prompt[:100]}...")

            try:
                # Call Groq API with multiple fallback options
                try:
                    # Try with primary key and main model first
                    print("Trying with primary API key and main model...")
                    response = client.chat.completions.create(
                        model=CONFIG["model"],
                        messages=[
                            {"role": "system", "content": self._get_system_prompt()},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=800,
                        temperature=0.7
                    )

                    # Extract the response
                    dm_response = response.choices[0].message.content
                    print(f"Received DM response with primary key (first 100 chars): {dm_response[:100]}...")
                except Exception as primary_key_error:
                    print(f"Primary API key with main model failed: {primary_key_error}. Trying backup key...")

                    try:
                        # Try with backup key and main model
                        backup_client = Groq(api_key=BACKUP_API_KEY)
                        response = backup_client.chat.completions.create(
                            model=CONFIG["model"],
                            messages=[
                                {"role": "system", "content": self._get_system_prompt()},
                                {"role": "user", "content": prompt}
                            ],
                            max_tokens=800,
                            temperature=0.7
                        )

                        # Extract the response
                        dm_response = response.choices[0].message.content
                        print(f"Received DM response with backup key (first 100 chars): {dm_response[:100]}...")
                    except Exception as backup_key_error:
                        print(f"Backup API key with main model failed: {backup_key_error}. Trying fallback model...")

                        try:
                            # Try with primary key and fallback model
                            response = client.chat.completions.create(
                                model=CONFIG["fallback_model"],
                                messages=[
                                    {"role": "system", "content": self._get_system_prompt()},
                                    {"role": "user", "content": prompt}
                                ],
                                max_tokens=800,
                                temperature=0.7
                            )

                            # Extract the response
                            dm_response = response.choices[0].message.content
                            print(f"Received DM response with fallback model (first 100 chars): {dm_response[:100]}...")
                        except Exception as fallback_model_error:
                            print(f"Fallback model failed: {fallback_model_error}. Using local fallback...")

                            # Use a local fallback response
                            dm_response = f"The Dungeon Master considers your words carefully. 'Interesting choice, adventurer. The path ahead may hold many secrets. What would you like to do next?'"
                            print("Using local fallback response due to API limitations.")
            except Exception as api_error:
                print(f"Error calling Groq API: {api_error}")
                # Provide a fallback response
                dm_response = f"The Dungeon Master nods thoughtfully. 'An interesting choice, adventurer. What would you like to do next?'"

            # Parse the response for special commands
            parsed_response = self._parse_dm_response(dm_response)
            print(f"Parsed response: {parsed_response}")

            return parsed_response

        except Exception as e:
            print(f"Error processing user input: {e}")
            return {
                "content": f"The Dungeon Master pauses for a moment... (Error: {str(e)})"
            }

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
        movement_detected = "moves to" in response.lower() or "moving to" in response.lower() or "go to" in response.lower() or "walks to" in response.lower()

        # Check for trapped players
        self._check_trapped_players(result)

        # Process character movement
        if movement_detected or True:  # Always try to move characters if there are any
            # Improved implementation to detect character movement
            characters = self.game_state.characters
            if characters:
                # Check if we need to move multiple characters
                move_multiple = "and" in response.lower() or "," in response.lower()

                # Store character movements
                character_movements = []

                # If moving multiple characters, try to identify all characters mentioned
                if move_multiple:
                    # Try to find all characters mentioned in the response
                    for character in characters:
                        char_type = character.get("type", "").lower()
                        char_label = character.get("label", "").lower()
                        char_id = character.get("id", "")

                        # Check if character name is mentioned in the response
                        if char_type in response.lower() or char_label in response.lower():
                            # Get current position
                            current_pos = self.game_state.player_positions.get(char_id, {"x": 0, "y": 0})

                            # Try to determine direction for this character
                            # Look for phrases like "X to the left" or "Y to the right"
                            target_x, target_y = None, None

                            # Define a context window around the character name
                            char_index = -1
                            if char_type in response.lower():
                                char_index = response.lower().find(char_type)
                            elif char_label in response.lower():
                                char_index = response.lower().find(char_label)

                            if char_index >= 0:
                                # Get a context window of 30 characters after the character name
                                context = response.lower()[char_index:char_index+50]

                                # Check for directions in this context
                                directions = {
                                    "north": (0, -1),
                                    "south": (0, 1),
                                    "east": (1, 0),
                                    "west": (-1, 0),
                                    "up": (0, -1),
                                    "down": (0, 1),
                                    "right": (1, 0),
                                    "left": (-1, 0),
                                    "northeast": (1, -1),
                                    "northwest": (-1, -1),
                                    "southeast": (1, 1),
                                    "southwest": (-1, 1)
                                }

                                for direction, (dx, dy) in directions.items():
                                    if direction in context:
                                        target_x = current_pos.get("x", 0) + dx
                                        target_y = current_pos.get("y", 0) + dy
                                        break

                            # If no direction found, move to a random adjacent position
                            if target_x is None or target_y is None:
                                # Move 1-2 spaces in a random direction
                                dx = random.randint(-2, 2)
                                dy = random.randint(-2, 2)
                                # Ensure we move at least one space
                                if dx == 0 and dy == 0:
                                    dx = 1

                                target_x = current_pos.get("x", 0) + dx
                                target_y = current_pos.get("y", 0) + dy

                            # Ensure coordinates are valid (non-negative)
                            target_x = max(0, target_x)
                            target_y = max(0, target_y)

                            print(f"Moving character {char_id} from ({current_pos.get('x', 0)}, {current_pos.get('y', 0)}) to ({target_x}, {target_y})")

                            # Add this movement to our list
                            character_movements.append({
                                "character_id": char_id,
                                "to_x": target_x,
                                "to_y": target_y
                            })

                # If no direction was found in the response, move to a random adjacent position
                if not move_multiple or not character_movements:
                    # Try to identify which character is being moved
                    char_id = None
                    target_x, target_y = None

                    # First, try to find character by name in the response
                    for character in characters:
                        char_type = character.get("type", "").lower()
                        char_label = character.get("label", "").lower()

                        # Check if character name is mentioned in the response
                        if char_type in response.lower() or char_label in response.lower():
                            char_id = character.get("id", "")
                            break

                    # If no specific character found, use the first one
                    if not char_id and characters:
                        char_id = characters[0].get("id", "")

                    # Get current position
                    current_pos = self.game_state.player_positions.get(char_id, {"x": 0, "y": 0})

                    # Try to determine direction from the response
                    directions = {
                        "north": (0, -1),
                        "south": (0, 1),
                        "east": (1, 0),
                        "west": (-1, 0),
                        "up": (0, -1),
                        "down": (0, 1),
                        "right": (1, 0),
                        "left": (-1, 0),
                        "northeast": (1, -1),
                        "northwest": (-1, -1),
                        "southeast": (1, 1),
                        "southwest": (-1, 1)
                    }

                    # Check for direction words in the response
                    for direction, (dx, dy) in directions.items():
                        if direction in response.lower():
                            target_x = current_pos.get("x", 0) + dx
                            target_y = current_pos.get("y", 0) + dy
                            break

                    # If no direction found, move to a random adjacent position
                    if target_x is None or target_y is None:
                        # Move 1-2 spaces in a random direction
                        dx = random.randint(-2, 2)
                        dy = random.randint(-2, 2)
                        # Ensure we move at least one space
                        if dx == 0 and dy == 0:
                            dx = 1

                        target_x = current_pos.get("x", 0) + dx
                        target_y = current_pos.get("y", 0) + dy

                    # Ensure coordinates are valid (non-negative)
                    target_x = max(0, target_x)
                    target_y = max(0, target_y)

                    print(f"Moving character {char_id} from ({current_pos.get('x', 0)}, {current_pos.get('y', 0)}) to ({target_x}, {target_y})")

                    # Add this movement to our list
                    character_movements.append({
                        "character_id": char_id,
                        "to_x": target_x,
                        "to_y": target_y
                    })

                # Add all character movements to the result
                if len(character_movements) == 1:
                    # If only one character is moving, use the old format for backward compatibility
                    result["move_character"] = character_movements[0]
                else:
                    # If multiple characters are moving, use a new format
                    result["move_characters"] = character_movements

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

    async def execute_action(self, action: Dict) -> None:
        """Execute a game action based on DM decision"""
        try:
            action_type = action.get("type", "")

            # Handle different action types
            if action_type == "move_character":
                character_id = action.get("character_id", "")
                to_x = action.get("to_x", 0)
                to_y = action.get("to_y", 0)

                # Update the character position in our game state
                if character_id in self.game_state.player_positions:
                    old_pos = self.game_state.player_positions[character_id]
                    self.game_state.player_positions[character_id] = {"x": to_x, "y": to_y}

                    # Log the action
                    action["from"] = old_pos
                    action["to"] = {"x": to_x, "y": to_y}

            elif action_type == "add_character":
                character_type = action.get("type", "")
                character_label = action.get("label", "Unknown")
                character_id = f"character_{len(self.game_state.characters) + 1}_{int(time.time())}"

                # Add character to our game state
                self.game_state.characters.append({
                    "id": character_id,
                    "type": character_type,
                    "label": character_label
                })

                # Add position
                self.game_state.player_positions[character_id] = {
                    "x": action.get("x", 0),
                    "y": action.get("y", 0)
                }

            elif action_type == "dice_roll":
                dice_type = action.get("dice_type", "d20")
                result = action.get("result", 0)
                print(f"Dice roll: {dice_type} = {result}")

            # Update game state
            self.game_state.last_action = action

        except Exception as e:
            print(f"Failed to execute action: {e}")

    async def generate_new_map(self, theme: str = None) -> Dict:
        """Generate a new map with the specified theme"""
        try:
            print(f"Generating new map with theme: {theme if theme else 'random'}")

            # Generate a new map
            new_map = self.map_generator.generate_map(theme=theme)
            print(f"Map generated: {new_map['name']} (ID: {new_map['id']})")

            # Update the game state
            self.game_state.map_data = new_map
            self.game_state.current_map = new_map["id"]
            print(f"Game state updated with new map: {new_map['name']}")

            # Reset player positions to valid locations on the new map
            new_positions = {}
            for char_id, _ in self.game_state.player_positions.items():
                # Find a random passable cell
                passable_cells = []
                for y in range(len(new_map["grid"])):
                    for x in range(len(new_map["grid"][0])):
                        if new_map["grid"][y][x]["passable"]:
                            passable_cells.append((x, y))

                if passable_cells:
                    x, y = random.choice(passable_cells)
                    new_positions[char_id] = {"x": x, "y": y}

            self.game_state.player_positions = new_positions

            return new_map
        except Exception as e:
            print(f"Error generating new map: {e}")
            return self.game_state.map_data

    async def generate_adventure_start(self, state: Dict) -> str:
        """Generate an initial adventure scene when AI takes control"""
        try:
            # Extract relevant information from state
            game_state_dict = state.get("game_state", self.game_state.to_dict())

            # Generate a new map if needed
            if not self.game_state.map_data:
                await self.generate_new_map()
                game_state_dict = self.game_state.to_dict()

            # Get map details
            map_data = game_state_dict.get("map_data", {})
            map_name = map_data.get("name", "Unknown Realm")
            map_theme = map_data.get("theme", "forest")
            map_description = map_data.get("description", "A mysterious land")

            # Get structure information
            structures = []
            if map_data.get("grid"):
                for row in map_data["grid"]:
                    for cell in row:
                        if cell.get("structure"):
                            structures.append(f"{cell['structure']} at ({cell['x']}, {cell['y']})")

            structures_text = "\n".join(structures[:5])  # Limit to 5 structures
            if len(structures) > 5:
                structures_text += f"\n...and {len(structures) - 5} more"

            # Create a prompt for the LLM
            prompt = f"""
            # Game State

            Map: {map_name} ({map_theme})
            Description: {map_description}
            Characters: {len(game_state_dict.get("characters", []))} character(s) on the map

            Notable Locations:
            {structures_text}

            # Task
            Generate an engaging opening scene for a D&D adventure in {map_name}. This should:
            1. Set the scene with vivid description of this {map_theme} themed area
            2. Introduce a compelling hook or quest related to one of the structures on the map
            3. Present an immediate situation for the player to respond to
            4. End with a prompt for the player's first action

            Make this opening exciting and immersive, drawing the player into the world.
            """

            # Call Groq API with multiple fallback options
            try:
                # Try with primary key and main model first
                print("Trying with primary API key and main model for adventure start...")
                response = client.chat.completions.create(
                    model=CONFIG["model"],
                    messages=[
                        {"role": "system", "content": self._get_system_prompt()},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=800,
                    temperature=0.8
                )

                # Extract the narration
                adventure_start = response.choices[0].message.content
                print(f"Received adventure start with primary key (first 100 chars): {adventure_start[:100]}...")
            except Exception as primary_key_error:
                print(f"Primary API key with main model failed: {primary_key_error}. Trying backup key...")

                try:
                    # Try with backup key and main model
                    backup_client = Groq(api_key=BACKUP_API_KEY)
                    response = backup_client.chat.completions.create(
                        model=CONFIG["model"],
                        messages=[
                            {"role": "system", "content": self._get_system_prompt()},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=800,
                        temperature=0.8
                    )

                    # Extract the narration
                    adventure_start = response.choices[0].message.content
                    print(f"Received adventure start with backup key (first 100 chars): {adventure_start[:100]}...")
                except Exception as backup_key_error:
                    print(f"Backup API key with main model failed: {backup_key_error}. Trying fallback model...")

                    try:
                        # Try with primary key and fallback model
                        response = client.chat.completions.create(
                            model=CONFIG["fallback_model"],
                            messages=[
                                {"role": "system", "content": self._get_system_prompt()},
                                {"role": "user", "content": prompt}
                            ],
                            max_tokens=800,
                            temperature=0.8
                        )

                        # Extract the narration
                        adventure_start = response.choices[0].message.content
                        print(f"Received adventure start with fallback model (first 100 chars): {adventure_start[:100]}...")
                    except Exception as fallback_model_error:
                        print(f"Fallback model failed: {fallback_model_error}. Using local fallback...")

                        # Use a local fallback response
                        adventure_start = "As you gather your party and prepare for adventure, the Dungeon Master unfolds a map before you. 'Welcome, brave adventurers,' they say with a gleam in their eye. 'What would you like to do first?'"
                        print("Using local fallback response due to API limitations.")

            # Update game state with new narration
            self.game_state.add_narrative(adventure_start)

            return adventure_start

        except Exception as e:
            print(f"Error generating adventure start: {e}")
            return "As you gather your party and prepare for adventure, the Dungeon Master unfolds a map before you. 'Welcome, brave adventurers,' they say with a gleam in their eye. 'What would you like to do first?'"

    def _check_trapped_players(self, result: Dict) -> None:
        """Check if any players are trapped (surrounded by obstacles) and update the result accordingly"""
        try:
            # Get the current map data
            if not self.game_state.map_data or not self.game_state.map_data.get("grid"):
                return

            grid = self.game_state.map_data.get("grid", [])
            if not grid:
                return

            # Check each character to see if they're trapped
            trapped_characters = []

            for character in self.game_state.characters:
                character_id = character.get("id")
                if not character_id:
                    continue

                # Get character position
                position = self.game_state.player_positions.get(character_id)
                if not position:
                    continue

                x, y = position.get("x", 0), position.get("y", 0)

                # Check if the character is trapped (surrounded by obstacles)
                is_trapped = True

                # Check all adjacent cells (up, down, left, right)
                adjacent_positions = [
                    (x, y-1),  # up
                    (x, y+1),  # down
                    (x-1, y),  # left
                    (x+1, y)   # right
                ]

                for adj_x, adj_y in adjacent_positions:
                    # Check if position is valid
                    if 0 <= adj_y < len(grid) and 0 <= adj_x < len(grid[0]):
                        # Check if this cell is not an obstacle
                        if not grid[adj_y][adj_x].get("is_obstacle", False):
                            # Check if this cell is not occupied by another character
                            occupied = False
                            for other_id, other_pos in self.game_state.player_positions.items():
                                if other_id != character_id and other_pos.get("x") == adj_x and other_pos.get("y") == adj_y:
                                    occupied = True
                                    break

                            if not occupied:
                                is_trapped = False
                                break

                if is_trapped:
                    trapped_characters.append({
                        "character_id": character_id,
                        "character_type": character.get("type", "character"),
                        "position": {"x": x, "y": y}
                    })

            # If any characters are trapped, add them to the result
            if trapped_characters:
                result["trapped_characters"] = trapped_characters

                # Add a sound effect for trapped characters
                result["play_sound"] = "trapped"

                # Add a message about trapped characters
                trapped_names = [char.get("character_type", "character") for char in trapped_characters]
                if len(trapped_names) == 1:
                    result["content"] += f"\n\n⚠️ The {trapped_names[0]} is trapped! They are surrounded by obstacles and cannot move."
                else:
                    result["content"] += f"\n\n⚠️ The following characters are trapped: {', '.join(trapped_names)}. They are surrounded by obstacles and cannot move."

        except Exception as e:
            print(f"Error checking for trapped players: {e}")

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI DM"""
        return """
        You are an AI Dungeon Master in a text-based D&D-style fantasy role-playing game. Your role is to guide players through immersive, dynamic adventures using vivid storytelling and game mechanics.

        As the Dungeon Master, you should:
        1. Narrate the world, NPCs, environments, events, and consequences through engaging, vivid storytelling
        2. Use a tone fitting for a fantasy adventure - descriptive, atmospheric, and dramatic
        3. Manage dice rolls to determine success or failure of actions, explaining outcomes dramatically based on the number rolled
        4. Direct character movement on the map as appropriate to the narrative
        5. Introduce enemies, obstacles, and NPCs when the story calls for it
        6. Award appropriate rewards when players complete quests, defeat enemies, or discover rare items

        Important game mechanics to incorporate:
        - When players attempt risky actions, use appropriate dice rolls (d20 for skill checks, d6 for damage, etc.)
        - Interpret dice results based on difficulty: 1-5 (failure), 6-10 (partial success), 11-15 (success), 16-20 (great success)
        - Maintain internal consistency in the game world and narrative

        Always stay in character as the Dungeon Master. Avoid meta-level explanations unless specifically asked out-of-character. Your goal is to create an engaging, responsive, fair, and thrilling world for the players to explore.
        """
