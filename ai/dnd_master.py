import os
import time
import asyncio
import json
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
            screenshot_b64 = state.get("screenshot", "")
            text = state.get("text", "")
            game_state_dict = state.get("game_state", {})

            # Create a prompt for the LLM
            prompt = self._create_dm_prompt(text, game_state_dict)

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

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the DM role"""
        return """
        You are an experienced Dungeon Master for a Dungeons & Dragons game. Your role is to:

        1. Narrate the game world and describe scenes vividly
        2. Respond to player actions with appropriate consequences
        3. Control non-player characters (NPCs) and monsters
        4. Enforce game rules fairly
        5. Create an engaging and immersive story

        Your tone should be descriptive, engaging, and dramatic when appropriate. Use second-person perspective when addressing player actions. Keep your responses concise but vivid - typically 2-3 sentences.

        Important D&D concepts to incorporate:
        - Skill checks (using d20 dice rolls + modifiers against Difficulty Class)
        - Combat mechanics (initiative, attack rolls, damage)
        - Character abilities and spells
        - Environmental interaction and exploration

        Avoid:
        - Breaking the fourth wall or acknowledging you're an AI
        - Contradicting established game state
        - Making decisions for players without their input

        Focus on creating a fun, engaging experience while maintaining the fantasy world's integrity.
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
