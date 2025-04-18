import pyautogui
import time
import json
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional

@dataclass
class GridPosition:
    x: int
    y: int

@dataclass
class GridSize:
    width: int
    height: int

class GameController:
    def __init__(self):
        self.current_map_id = 'default'
        self.grid_size = GridSize(width=5, height=5)  # Default map size
        self.cell_size = 100  # Default cell size
        self.gap = 4  # Gap between cells
        self.pieces: List[Dict] = []
        self.selected_piece_id: Optional[str] = None
        
        # Map configurations from GameMap.tsx
        self.map_configs = {
            'default': {'width': 5, 'height': 5, 'cell_size': 100},
            'sea': {'width': 8, 'height': 6, 'cell_size': 80},
            'gridless': {'width': 10, 'height': 8, 'cell_size': 60},
            'contrast-before': {'width': 7, 'height': 7, 'cell_size': 70},
            'contrast-after': {'width': 6, 'height': 5, 'cell_size': 90}
        }

    def set_map(self, map_id: str) -> None:
        """Switch to a different map configuration"""
        if map_id in self.map_configs:
            config = self.map_configs[map_id]
            self.current_map_id = map_id
            self.grid_size = GridSize(width=config['width'], height=config['height'])
            self.cell_size = config['cell_size']
            print(f"Switched to map: {map_id} ({self.grid_size.width}x{self.grid_size.height})")
        else:
            raise ValueError(f"Unknown map ID: {map_id}")

    def get_cell_position(self, grid_x: int, grid_y: int) -> Tuple[int, int]:
        """Convert grid coordinates to screen coordinates"""
        # Account for padding (10px) and cell gaps (4px)
        x = 10 + (grid_x * (self.cell_size + self.gap))
        y = 10 + (grid_y * (self.cell_size + self.gap))
        return (x, y)

    def click_cell(self, x: int, y: int) -> None:
        """Click a cell at the given grid coordinates"""
        if not (0 <= x < self.grid_size.width and 0 <= y < self.grid_size.height):
            raise ValueError(f"Grid coordinates out of bounds: ({x}, {y})")
        
        screen_x, screen_y = self.get_cell_position(x, y)
        pyautogui.click(screen_x + self.cell_size/2, screen_y + self.cell_size/2)
        time.sleep(0.2)  # Small delay after click

    def move_piece(self, piece_id: str, to_x: int, to_y: int) -> None:
        """Move a piece to the specified grid position"""
        # First click the piece to select it
        piece = next((p for p in self.pieces if p['id'] == piece_id), None)
        if not piece:
            raise ValueError(f"No piece found with ID: {piece_id}")
        
        self.click_cell(piece['x'], piece['y'])
        time.sleep(0.2)
        
        # Then click the destination
        self.click_cell(to_x, to_y)
        
        # Update piece position in our local state
        piece['x'] = to_x
        piece['y'] = to_y

    def add_piece(self, x: int, y: int) -> str:
        """Add a new piece at the specified position"""
        piece_id = f"piece-{len(self.pieces)}"
        self.pieces.append({
            'id': piece_id,
            'x': x,
            'y': y
        })
        return piece_id

    def remove_piece(self, piece_id: str) -> None:
        """Remove a piece from the grid"""
        piece = next((p for p in self.pieces if p['id'] == piece_id), None)
        if piece:
            # Double click the piece to remove it
            self.click_cell(piece['x'], piece['y'])
            time.sleep(0.1)
            self.click_cell(piece['x'], piece['y'])
            self.pieces = [p for p in self.pieces if p['id'] != piece_id]

    def get_game_state(self) -> dict:
        """Get current game state"""
        return {
            'map_id': self.current_map_id,
            'grid_size': {'width': self.grid_size.width, 'height': self.grid_size.height},
            'cell_size': self.cell_size,
            'pieces': self.pieces
        }

def test_game_controller():
    """Test the game controller functionality"""
    controller = GameController()
    
    try:
        print("Starting game controller test...")
        
        # Test map switching
        print("\nTesting map configurations:")
        for map_id in controller.map_configs:
            controller.set_map(map_id)
            state = controller.get_game_state()
            print(f"Map {map_id}: {state['grid_size']['width']}x{state['grid_size']['height']} cells")
        
        # Switch back to default map
        controller.set_map('default')
        
        # Test piece placement
        print("\nTesting piece placement...")
        piece1_id = controller.add_piece(1, 1)
        print(f"Added piece at (1,1) with ID: {piece1_id}")
        time.sleep(1)
        
        # Test piece movement
        print("\nTesting piece movement...")
        controller.move_piece(piece1_id, 2, 2)
        print(f"Moved piece to (2,2)")
        time.sleep(1)
        
        # Test piece removal
        print("\nTesting piece removal...")
        controller.remove_piece(piece1_id)
        print(f"Removed piece {piece1_id}")
        
        print("\nGame controller test completed successfully")
        
    except Exception as e:
        print(f"Error during game controller test: {e}")

if __name__ == "__main__":
    # Add a 3 second delay before starting
    print("Starting in 3 seconds...")
    time.sleep(3)
    
    # Enable fail-safe
    pyautogui.FAILSAFE = True
    print("Fail-safe enabled: Move mouse to screen corner to abort")
    
    test_game_controller()