import cv2
import numpy as np
import time
from PIL import Image
from groq import Groq
import asyncio
from collections import deque
CONFIG = {
    "model": "llama-3.3-70b-versatile", 
    "board_dimensions": (8, 6), 
    "terrain_types": ["grass", "water", "mountain", "forest"],
    "max_history": 10,
    "sampling_rate": 5, 
}

class VisionModule:
    def __init__(self, config):
        self.config = config
        self.previous_frame = None
        self.grid_map = np.zeros(config["board_dimensions"], dtype=int)
        
    def capture_frame(self, camera_source=0):
        """Capture frame from camera or video source"""
        cap = cv2.VideoCapture(camera_source)
        ret, frame = cap.read()
        cap.release()
        return frame if ret else None
    
    def detect_grid(self, frame):
        """Detect the game board grid in the image"""
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Find grid lines using Hough transform
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
        
        # Process lines to extract grid structure
        # (simplified implementation)
        grid_cells = []
        for i in range(self.config["board_dimensions"][0]):
            for j in range(self.config["board_dimensions"][1]):
                grid_cells.append((i, j))
                
        return grid_cells
    
    def detect_tokens(self, frame, grid_cells):
        """Detect player tokens on the board"""
        # Use color segmentation or template matching to find tokens
        # For each detected token, associate with the nearest grid cell
        
        # Placeholder implementation
        tokens = []
        # Example: tokens.append({"player_id": 1, "position": (2, 3)})
        return tokens
    
    def detect_obstacles(self, frame, grid_cells):
        """Detect red obstacle markers on the board"""
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Red color range in HSV
        lower_red = np.array([0, 120, 70])
        upper_red = np.array([10, 255, 255])
        mask1 = cv2.inRange(hsv, lower_red, upper_red)
        
        lower_red = np.array([170, 120, 70])
        upper_red = np.array([180, 255, 255])
        mask2 = cv2.inRange(hsv, lower_red, upper_red)
        
        red_mask = mask1 + mask2
        
        # Find contours of red obstacles
        contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        obstacles = []
        for contour in contours:
            # Get centroid of contour
            M = cv2.moments(contour)
            if M["m00"] > 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                
                # Find nearest grid cell
                # (implementation simplified)
                cell = (int(cx / 100), int(cy / 100))  # Example mapping
                obstacles.append(cell)
                
        return obstacles
    
    def classify_terrain(self, frame, grid_cells):
        """Classify terrain types for each grid cell"""
        terrain_map = {}
        
        # For each grid cell, sample pixels and classify terrain
        for cell in grid_cells:
            # Extract region corresponding to this cell
            # Analyze color distribution to determine terrain type
            
            # Placeholder implementation
            # In reality, would use more sophisticated color analysis or ML classifier
            x, y = cell
            terrain_map[cell] = self.config["terrain_types"][
                (x + y) % len(self.config["terrain_types"])
            ]
            
        return terrain_map
    
    def detect_changes(self, current_frame):
        """Detect changes between frames to identify player actions"""
        if self.previous_frame is None:
            self.previous_frame = current_frame
            return None
        
        # Compute difference between frames
        diff = cv2.absdiff(current_frame, self.previous_frame)
        gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        
        # Threshold to identify significant changes
        _, thresholded = cv2.threshold(gray_diff, 30, 255, cv2.THRESH_BINARY)
        
        # Find contours of changed regions
        contours, _ = cv2.findContours(thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        changes = []
        for contour in contours:
            if cv2.contourArea(contour) > 100:  # Filter small changes
                # Get bounding box
                x, y, w, h = cv2.boundingRect(contour)
                # Map to grid coordinates
                grid_x = int(x / (frame_width / self.config["board_dimensions"][0]))
                grid_y = int(y / (frame_height / self.config["board_dimensions"][1]))
                changes.append((grid_x, grid_y))
        
        self.previous_frame = current_frame
        return changes
    
    def process_frame(self, frame):
        """Process a frame to extract game state"""
        grid_cells = self.detect_grid(frame)
        tokens = self.detect_tokens(frame, grid_cells)
        obstacles = self.detect_obstacles(frame, grid_cells)
        terrain = self.classify_terrain(frame, grid_cells)
        changes = self.detect_changes(frame)
        
        return {
            "grid_cells": grid_cells,
            "tokens": tokens,
            "obstacles": obstacles,
            "terrain": terrain,
            "changes": changes,
            "timestamp": time.time()
        }

class GameStateInterpreter:
    def __init__(self, config):
        self.config = config
        self.history = deque(maxlen=config["max_history"])
        self.current_state = {}
        self.narrative_context = {
            "campaign": "Coastal Adventure",
            "quests": [],
            "npcs": {},
            "events": []
        }
        
    def update_state(self, vision_data):
        """Update game state based on vision input"""
        previous_state = self.current_state.copy() if self.current_state else {}
        
        # Update current state with new vision data
        self.current_state = {
            "tokens": vision_data["tokens"],
            "obstacles": vision_data["obstacles"],
            "terrain": vision_data["terrain"],
        }
        
        # Detect events based on state changes
        events = self._detect_events(previous_state, self.current_state, vision_data["changes"])
        
        # Update history
        if events:
            self.history.append({
                "state": self.current_state,
                "events": events,
                "timestamp": vision_data["timestamp"]
            })
            
        return events
    
    def _detect_events(self, previous_state, current_state, changes):
        """Detect game events based on state changes"""
        events = []
        
        # If this is the first state, no events to detect
        if not previous_state:
            return []
            
        # Check for token movements
        for token in current_state["tokens"]:
            player_id = token["player_id"]
            position = token["position"]
            
            # Find previous position
            prev_position = None
            for prev_token in previous_state["tokens"]:
                if prev_token["player_id"] == player_id:
                    prev_position = prev_token["position"]
                    break
            
            # If position changed, create movement event
            if prev_position and prev_position != position:
                terrain_type = current_state["terrain"].get(position, "unknown")
                is_obstacle = position in current_state["obstacles"]
                
                event = {
                    "type": "movement",
                    "player_id": player_id,
                    "from": prev_position,
                    "to": position,
                    "terrain": terrain_type,
                    "obstacle_encountered": is_obstacle
                }
                events.append(event)
                
        # Check for other events based on detected changes
        if changes:
            for change_pos in changes:
                # If change wasn't already captured as a movement
                if not any(e["type"] == "movement" and e["to"] == change_pos for e in events):
                    events.append({
                        "type": "environment_change",
                        "position": change_pos
                    })
        
        return events
    
    def build_prompt(self, events):
        """Build a context-rich prompt for the LLM"""
        prompt = f"""
You are an expert Dungeon Master for a fantasy RPG adventure set in a {self.narrative_context['campaign']} setting.
Current game state:
- Terrain: {', '.join([f"{pos}: {type}" for pos, type in self.current_state['terrain'].items()][:5])}...
- Obstacles at positions: {', '.join([str(pos) for pos in self.current_state['obstacles']][:5])}...
- Player tokens at: {', '.join([f"Player {t['player_id']} at {t['position']}" for t in self.current_state['tokens']])}

Recent events:
"""
        
        # Add current events
        for event in events:
            if event["type"] == "movement":
                prompt += f"- Player {event['player_id']} moved from {event['from']} to {event['to']} "
                prompt += f"(terrain: {event['terrain']})"
                if event["obstacle_encountered"]:
                    prompt += " and encountered an obstacle!"
                prompt += "\n"
            elif event["type"] == "environment_change":
                prompt += f"- Something changed at position {event['position']}\n"
        
        # Add recent history
        prompt += "\nRecent history:\n"
        for past_state in list(self.history)[:-1]:  # Exclude current state
            for event in past_state["events"]:
                if event["type"] == "movement":
                    prompt += f"- Previously: Player {event['player_id']} moved to {event['to']} ({event['terrain']})\n"
        
        prompt += "\nAs the Dungeon Master, narrate what happens next in vivid detail. Describe the environment, any challenges encountered, and potential story developments based on the players' current situation."
        
        return prompt

class LLMNarrator:
    def __init__(self, config):
        self.config = config
        self.client = Groq(api_key="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")
        self.model = config["model"]
        
    async def generate_narration(self, prompt):
        """Generate DM narration using Groq LLM"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": "You are an expert Dungeon Master for a fantasy RPG game. Narrate events in a vivid, engaging style. Keep responses under 250 words."},
                          {"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating narration: {e}")
            return "The Dungeon Master pauses for a moment, considering the situation..."

class DungeonMasterAI:
    def __init__(self, config):
        self.config = config
        self.vision = VisionModule(config)
        self.interpreter = GameStateInterpreter(config)
        self.narrator = LLMNarrator(config)
        
    async def process_turn(self, frame=None):
        """Process a complete turn"""
        # Capture frame if not provided
        if frame is None:
            frame = self.vision.capture_frame()
            if frame is None:
                return "Unable to capture game board."
        
        # Process vision data
        vision_data = self.vision.process_frame(frame)
        
        # Update game state and detect events
        events = self.interpreter.update_state(vision_data)
        
        # If no significant events, provide ambient narration
        if not events:
            prompt = self.interpreter.build_prompt([{"type": "ambient", "description": "Players are planning their next move."}])
        else:
            prompt = self.interpreter.build_prompt(events)
        
        # Generate narration
        narration = await self.narrator.generate_narration(prompt)
        
        return narration

async def main():
    config = CONFIG
    dm_ai = DungeonMasterAI(config)
    
    # Example: Process a frame from a test image
    test_frame = cv2.imread("game_board.jpg")
    if test_frame is not None:
        narration = await dm_ai.process_turn(test_frame)
        print("DM Narration:")
        print(narration)
    else:
        print("Could not load test image.")

if __name__ == "__main__":
    asyncio.run(main())