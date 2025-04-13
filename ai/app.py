import cv2
import numpy as np
import time
import torch
import pyautogui
import keyboard
from ultralytics import YOLO
from collections import deque

class PokemonFireRedAI:
    def __init__(self):
        # Initialize YOLO model
        self.model = YOLO('yolov8n.pt')  # Use a pre-trained model initially
        self.custom_model = None  # Will store custom-trained model later
        
        # Game state tracking
        self.current_state = "exploring"  # exploring, battle, menu
        self.character_position = None
        self.target_position = None
        self.path = deque()
        
        # Movement keys
        self.movement_keys = {
            'up': 'w',
            'down': 's',
            'left': 'a',
            'right': 'd',
            'action': 'z',
            'back': 'x'
        }
        
        # Screen dimensions
        self.screen_width, self.screen_height = pyautogui.size()
        
        # Known locations (to be populated as the game explores)
        self.map_data = {}
        self.walls = set()
        self.points_of_interest = {}
        
        # Training data collection
        self.training_data = []
        
    def capture_screen(self):
        """Capture the current screen"""
        screenshot = pyautogui.screenshot()
        frame = np.array(screenshot)
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        return frame
    
    def detect_objects(self, frame):
        """Use YOLOv8 to detect objects in the frame"""
        if self.custom_model:
            results = self.custom_model(frame)
        else:
            # Use generic object detection until custom model is trained
            results = self.model(frame)
        
        # Process results to identify game elements
        game_objects = self._process_detections(results, frame)
        return game_objects
    
    def _process_detections(self, results, frame):
        """Process YOLO detections to identify game elements"""
        game_objects = {
            'character': None,
            'walls': [],
            'npcs': [],
            'grass': [],
            'doors': [],
            'battle_indicators': [],
            'pokemon_center': [],
            'gym': []
        }
        
        # Process each detection
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = box.conf[0].item()
                class_id = int(box.cls[0].item())
                class_name = result.names[class_id]
                
                # Map generic YOLO classes to game elements based on appearance
                # This is simplified and would need to be expanded with custom training
                if class_name == 'person':
                    # Center of the character would be the first 'person' detected
                    if game_objects['character'] is None:
                        game_objects['character'] = ((x1+x2)/2, (y1+y2)/2)
                    else:
                        game_objects['npcs'].append(((x1+x2)/2, (y1+y2)/2))
                
                # More class mappings would be added here
                
        return game_objects
    
    def detect_game_state(self, frame):
        """Detect the current game state (exploring, battle, menu)"""
        # This would use image recognition to determine the game state
        # Simple example: look for battle UI elements
        
        # For demonstration, this is simplified
        # In practice, you'd use image templates or train a classifier
        
        # Check for battle indicators (like HP bars, battle menu)
        battle_indicators = self._check_for_battle_ui(frame)
        if battle_indicators:
            return "battle"
        
        # Check for menus
        menu_indicators = self._check_for_menu_ui(frame)
        if menu_indicators:
            return "menu"
        
        # Default state is exploring
        return "exploring"
    
    def _check_for_battle_ui(self, frame):
        """Check for battle UI elements in the frame"""
        # This would use template matching or specific detection
        # For demonstration, this returns False
        return False
    
    def _check_for_menu_ui(self, frame):
        """Check for menu UI elements in the frame"""
        # This would use template matching or specific detection
        # For demonstration, this returns False
        return False
    
    def find_path(self, start, goal):
        """Find a path from start to goal using A* algorithm"""
        # Simple A* implementation
        open_set = {start}
        closed_set = set()
        
        g_score = {start: 0}
        f_score = {start: self._heuristic(start, goal)}
        
        came_from = {}
        
        while open_set:
            current = min(open_set, key=lambda pos: f_score.get(pos, float('inf')))
            
            if current == goal:
                path = self._reconstruct_path(came_from, current)
                return path
            
            open_set.remove(current)
            closed_set.add(current)
            
            for neighbor in self._get_neighbors(current):
                if neighbor in closed_set or neighbor in self.walls:
                    continue
                
                tentative_g_score = g_score.get(current, float('inf')) + 1
                
                if neighbor not in open_set:
                    open_set.add(neighbor)
                elif tentative_g_score >= g_score.get(neighbor, float('inf')):
                    continue
                
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score[neighbor] = g_score[neighbor] + self._heuristic(neighbor, goal)
        
        # No path found
        return deque()
    
    def _heuristic(self, a, b):
        """Manhattan distance heuristic"""
        return abs(a[0] - b[0]) + abs(a[1] - b[1])
    
    def _get_neighbors(self, position):
        """Get valid neighboring positions"""
        x, y = position
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]  # up, right, down, left
        
        neighbors = []
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if (nx, ny) not in self.walls:
                neighbors.append((nx, ny))
        
        return neighbors
    
    def _reconstruct_path(self, came_from, current):
        """Reconstruct path from A* search"""
        total_path = deque([current])
        while current in came_from:
            current = came_from[current]
            total_path.appendleft(current)
        return total_path
    
    def move_character(self, direction):
        """Send keypress to move character in given direction"""
        key = self.movement_keys.get(direction)
        if key:
            keyboard.press(key)
            time.sleep(0.1)  # Hold key briefly
            keyboard.release(key)
            time.sleep(0.1)  # Wait for movement to complete
    
    def handle_battle(self, frame):
        """Handle a random encounter or trainer battle"""
        # Check if it's a wild pokemon encounter
        is_wild_encounter = self._check_wild_encounter(frame)
        
        if is_wild_encounter:
            # Ask user if they want to catch it
            user_choice = input("A wild Pokémon appeared! Do you want to catch it? (yes/no): ")
            
            if user_choice.lower() in ['yes', 'y']:
                # Attempt to catch
                self._navigate_battle_menu("catch")
            else:
                # Run or fight based on strategy
                self._navigate_battle_menu("run")
        else:
            # Trainer battle - auto battle
            self._auto_battle()
    
    def _check_wild_encounter(self, frame):
        """Check if current battle is a wild encounter"""
        # This would analyze the battle screen
        # For demonstration, returns True
        return True
    
    def _navigate_battle_menu(self, action):
        """Navigate the battle menu to perform an action"""
        if action == "catch":
            # Navigate to bag, select pokeball, use
            self.move_character("right")  # Move to BAG
            self.move_character("action")  # Select BAG
            # Navigate to Pokéballs
            self.move_character("down")
            self.move_character("action")  # Select Pokéball
            self.move_character("action")  # Use Pokéball
        elif action == "run":
            # Navigate to RUN and select
            self.move_character("right")
            self.move_character("down")
            self.move_character("action")  # Select RUN
    
    def _auto_battle(self):
        """Automatically battle using the first move"""
        # Simple strategy: always use the first move
        self.move_character("action")  # FIGHT
        self.move_character("action")  # First move
    
    def handle_gym(self):
        """Handle entering a gym"""
        user_choice = input("You've reached a Gym! Do you want to challenge it? (yes/no): ")
        
        if user_choice.lower() in ['yes', 'y']:
            print("Entering gym challenge...")
            # Enter the gym and initiate battle
            self.move_character("action")
        else:
            print("Skipping this gym for now.")
    
    def update_map_data(self, game_objects):
        """Update internal map representation based on observed objects"""
        if game_objects['character']:
            self.character_position = game_objects['character']
        
        # Update walls and obstacles
        for wall in game_objects['walls']:
            grid_pos = self._pixel_to_grid(wall)
            self.walls.add(grid_pos)
        
        # Update points of interest
        for poi_type in ['pokemon_center', 'gym', 'doors']:
            for poi in game_objects[poi_type]:
                grid_pos = self._pixel_to_grid(poi)
                self.points_of_interest[grid_pos] = poi_type
    
    def _pixel_to_grid(self, pixel_pos):
        """Convert pixel coordinates to grid coordinates"""
        # This would depend on the game's resolution and tile size
        # For demonstration, using a simple division
        grid_x = int(pixel_pos[0] // 16)  # Assuming 16x16 tiles
        grid_y = int(pixel_pos[1] // 16)
        return (grid_x, grid_y)
    
    def collect_training_data(self, frame, label):
        """Collect training data for custom model training"""
        # Save frame and label for later training
        self.training_data.append((frame, label))
        
        # If we have enough data, train a custom model
        if len(self.training_data) >= 1000:
            self._train_custom_model()
    
    def _train_custom_model(self):
        """Train a custom YOLOv8 model on collected data"""
        # This would export the collected data in YOLO format
        # and train a custom model
        # For demonstration, this is simplified
        print("Training custom model with collected data...")
        # self.custom_model = YOLO('path/to/custom/weights.pt')
    
    def run(self):
        """Main loop for the AI"""
        print("Starting Pokémon Fire Red AI Controller...")
        print("Press Ctrl+C to exit")
        
        try:
            while True:
                # Capture and process screen
                frame = self.capture_screen()
                game_objects = self.detect_objects(frame)
                game_state = self.detect_game_state(frame)
                
                # Update internal map
                self.update_map_data(game_objects)
                
                # Handle different game states
                if game_state == "battle":
                    self.handle_battle(frame)
                elif game_state == "exploring":
                    # Check if we're at a gym
                    if self.character_position and self._is_at_gym():
                        self.handle_gym()
                    
                    # Navigate to target if exists
                    if self.target_position:
                        self._navigate_to_target()
                    else:
                        # Explore the map
                        self._explore()
                
                # Collect training data
                self.collect_training_data(frame, game_state)
                
                # Brief pause to prevent high CPU usage
                time.sleep(0.05)
                
        except KeyboardInterrupt:
            print("AI Controller stopped")
    
    def _is_at_gym(self):
        """Check if character is at a gym entrance"""
        if not self.character_position:
            return False
        
        character_grid = self._pixel_to_grid(self.character_position)
        
        # Check if any adjacent tile is a gym
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            adj_pos = (character_grid[0] + dx, character_grid[1] + dy)
            if adj_pos in self.points_of_interest and self.points_of_interest[adj_pos] == 'gym':
                return True
        
        return False
    
    def _navigate_to_target(self):
        """Navigate to the current target position"""
        if not self.path:
            # Calculate path if we don't have one
            if self.character_position and self.target_position:
                character_grid = self._pixel_to_grid(self.character_position)
                target_grid = self._pixel_to_grid(self.target_position)
                self.path = self.find_path(character_grid, target_grid)
        
        if self.path:
            next_pos = self.path.popleft()
            current_pos = self._pixel_to_grid(self.character_position)
            
            # Determine direction to move
            dx = next_pos[0] - current_pos[0]
            dy = next_pos[1] - current_pos[1]
            
            if dx > 0:
                self.move_character("right")
            elif dx < 0:
                self.move_character("left")
            elif dy > 0:
                self.move_character("down")
            elif dy < 0:
                self.move_character("up")
    
    def _explore(self):
        """Explore the map by moving to unexplored areas"""
        # Simple exploration strategy: pick an unexplored direction
        character_grid = self._pixel_to_grid(self.character_position)
        
        # Check all four directions
        available_moves = []
        for direction, (dx, dy) in zip(
            ["up", "right", "down", "left"],
            [(0, -1), (1, 0), (0, 1), (-1, 0)]
        ):
            next_pos = (character_grid[0] + dx, character_grid[1] + dy)
            if next_pos not in self.walls:
                available_moves.append(direction)
        
        if available_moves:
            # Pick a random direction to explore
            direction = np.random.choice(available_moves)
            self.move_character(direction)

if __name__ == "__main__":
    # Set up the AI
    pokemon_ai = PokemonFireRedAI()
    
    # Run the main loop
    pokemon_ai.run()