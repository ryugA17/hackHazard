import asyncio
import os
import json
from dnd_master import DungeonMaster

async def test_dungeon_master():
    """Test the DungeonMaster class functionality"""
    print("Starting DND Dungeon Master test...")
    
    # Create a DungeonMaster instance
    dm = DungeonMaster()
    
    # Test game state creation
    print("\nTesting game state initialization...")
    print(f"Initial game state: {dm.game_state.to_dict()}")
    
    # Test narrative generation
    print("\nTesting narrative generation...")
    
    # Create a mock game state
    mock_state = {
        "text": "The party enters a dark cavern. Water drips from the ceiling.",
        "game_state": {
            "characters": [
                {"id": "piece-1", "type": "Warrior"},
                {"id": "piece-2", "type": "Wizard"}
            ],
            "current_map": "default",
            "player_positions": {
                "piece-1": {"x": 2, "y": 3},
                "piece-2": {"x": 3, "y": 3}
            },
            "in_combat": False,
            "narrative_history": [],
            "last_action": {
                "type": "move_character",
                "character_id": "piece-1",
                "from": {"x": 1, "y": 3},
                "to": {"x": 2, "y": 3}
            }
        }
    }
    
    # Generate narration
    narration = await dm.analyze_game_state(mock_state)
    print(f"Generated narration: {narration}")
    
    # Test dice roll
    print("\nTesting dice roll...")
    dm.game_state.add_dice_roll("d20", 18)
    print(f"Game state after dice roll: {dm.game_state.to_dict()}")
    
    # Test adding a character
    print("\nTesting character addition...")
    dm.game_state.characters.append({
        "id": "piece-3",
        "type": "Rogue",
        "position": {"x": 4, "y": 2}
    })
    print(f"Game state after character addition: {dm.game_state.to_dict()}")
    
    print("\nDND Dungeon Master test completed successfully!")

if __name__ == "__main__":
    # Run the test
    asyncio.run(test_dungeon_master())
