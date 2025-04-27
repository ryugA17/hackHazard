import asyncio
import json
import os
import time as time_module
import random
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simple_dnd_master import DungeonMaster  # Changed import to use simple_dnd_master

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Store active connections
active_connections: Dict[str, WebSocket] = {}
# Store DM instances
dm_instances: Dict[str, DungeonMaster] = {}

# Function to check if a character is at the edge of the map
def is_at_map_edge(position, map_width, map_height, threshold=0):
    """Check if a position is at the edge of the map with optional threshold"""
    x, y = position["x"], position["y"]
    return (x <= threshold or x >= map_width - 1 - threshold or
            y <= threshold or y >= map_height - 1 - threshold)

# Function to determine edge direction
def get_edge_direction(position, map_width, map_height):
    """Determine which edge the character is touching"""
    x, y = position["x"], position["y"]

    if x == 0:
        return "west"
    elif x == map_width - 1:
        return "east"
    elif y == 0:
        return "north"
    elif y == map_height - 1:
        return "south"
    return None

# Function to expand the map when a character touches the edge
async def expand_map_in_direction(direction, map_data, character_id=None):
    """Expand the map in the specified direction with connected rooms"""
    # Get current map dimensions
    grid = map_data.get("grid", [])
    current_height = len(grid)
    current_width = len(grid[0]) if current_height > 0 else 0

    if current_width == 0 or current_height == 0:
        return map_data

    # Get terrain distribution for new area
    terrain_distribution = map_data.get("terrain_distribution", {})
    primary_terrain = list(terrain_distribution.keys())[0] if terrain_distribution else "grass"
    secondary_terrain = list(terrain_distribution.keys())[1] if len(terrain_distribution) > 1 else "forest"

    # Determine expansion parameters
    expansion_size = 5  # Number of tiles to add in the expansion direction

    # Create room templates - patterns of obstacles/passable areas for interesting room generation
    room_templates = [
        # Open room with pillars
        [
            [0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
        ],
        # Room with central feature
        [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ],
        # Corridor with side chambers
        [
            [1, 1, 0, 1, 1],
            [1, 0, 0, 0, 1],
            [0, 0, 0, 0, 0],
            [1, 0, 0, 0, 1],
            [1, 1, 0, 1, 1],
        ],
        # Zigzag path
        [
            [0, 0, 0, 1, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 0, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 0, 0, 0],
        ],
    ]

    # Select a random room template
    template = random.choice(room_templates)

    # Apply expansion based on direction
    if direction == "north":
        # Add rows at the top
        for i in range(expansion_size):
            new_row = []
            for x in range(current_width):
                # Use template for obstacle placement where possible
                template_y = i % len(template)
                template_x = x % len(template[0])
                is_obstacle = template[template_y][template_x] == 1

                # Determine terrain type
                if random.random() < 0.7:  # 70% primary terrain
                    terrain = primary_terrain
                else:
                    terrain = secondary_terrain

                cell = {
                    "x": x,
                    "y": 0,  # Will be updated after insertion
                    "terrain": terrain,
                    "is_obstacle": is_obstacle,
                    "type": "revealed"
                }
                new_row.append(cell)

            # Insert the new row at the beginning
            grid.insert(0, new_row)

        # Update y-coordinates for all cells
        for y in range(len(grid)):
            for x in range(len(grid[y])):
                grid[y][x]["y"] = y

    elif direction == "south":
        # Add rows at the bottom
        for i in range(expansion_size):
            new_row = []
            for x in range(current_width):
                template_y = i % len(template)
                template_x = x % len(template[0])
                is_obstacle = template[template_y][template_x] == 1

                # Determine terrain type
                if random.random() < 0.7:  # 70% primary terrain
                    terrain = primary_terrain
                else:
                    terrain = secondary_terrain

                cell = {
                    "x": x,
                    "y": current_height + i,
                    "terrain": terrain,
                    "is_obstacle": is_obstacle,
                    "type": "revealed"
                }
                new_row.append(cell)

            # Add the new row at the end
            grid.append(new_row)

    elif direction == "west":
        # Add columns on the left
        for y in range(current_height):
            for i in range(expansion_size):
                template_y = y % len(template)
                template_x = i % len(template[0])
                is_obstacle = template[template_y][template_x] == 1

                # Determine terrain type
                if random.random() < 0.7:  # 70% primary terrain
                    terrain = primary_terrain
                else:
                    terrain = secondary_terrain

                cell = {
                    "x": 0,  # Will be updated after insertion
                    "y": y,
                    "terrain": terrain,
                    "is_obstacle": is_obstacle,
                    "type": "revealed"
                }

                # Insert at the beginning of the row
                grid[y].insert(0, cell)

        # Update x-coordinates for all cells
        for y in range(len(grid)):
            for x in range(len(grid[y])):
                grid[y][x]["x"] = x

    elif direction == "east":
        # Add columns on the right
        for y in range(current_height):
            for i in range(expansion_size):
                template_y = y % len(template)
                template_x = i % len(template[0])
                is_obstacle = template[template_y][template_x] == 1

                # Determine terrain type
                if random.random() < 0.7:  # 70% primary terrain
                    terrain = primary_terrain
                else:
                    terrain = secondary_terrain

                cell = {
                    "x": current_width + i,
                    "y": y,
                    "terrain": terrain,
                    "is_obstacle": is_obstacle,
                    "type": "revealed"
                }

                # Add at the end of the row
                grid[y].append(cell)

    # Update map dimensions
    map_data["width"] = len(grid[0]) if len(grid) > 0 else 0
    map_data["height"] = len(grid)
    map_data["grid"] = grid

    # Create a transition path from old map to new area
    # This ensures there's always a passable path between old and new areas
    if character_id is not None:
        # Create a passage at the edge where the character is
        edge_cells = []
        if direction == "north":
            # Get cells at the boundary between old and new
            edge_cells = [(x, expansion_size-1) for x in range(current_width)]
        elif direction == "south":
            edge_cells = [(x, current_height) for x in range(current_width)]
        elif direction == "west":
            edge_cells = [(expansion_size-1, y) for y in range(current_height)]
        elif direction == "east":
            edge_cells = [(current_width, y) for y in range(current_height)]

        # Make sure there's at least one passable cell at the boundary
        if edge_cells:
            # Choose 1-3 random positions to make passable
            num_passages = random.randint(1, 3)
            passage_positions = random.sample(edge_cells, min(num_passages, len(edge_cells)))

            for x, y in passage_positions:
                if 0 <= y < len(grid) and 0 <= x < len(grid[0]):
                    grid[y][x]["is_obstacle"] = False

    return map_data

@app.websocket("/ws/dnd/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    # Store the connection
    active_connections[session_id] = websocket

    # Create a new DM instance if one doesn't exist for this session
    if session_id not in dm_instances:
        dm_instances[session_id] = DungeonMaster()

    dm = dm_instances[session_id]

    try:
        # Initialize the game window (if needed)
        if hasattr(dm, 'setup_game_window'):
            await dm.setup_game_window()

        # Send initial game state
        initial_state = {}
        initial_narration = "Welcome to the D&D Game! Select a map theme to begin your adventure."

        # Use methods if they exist
        if hasattr(dm, 'get_screen_state'):
            initial_state = await dm.get_screen_state()

        if hasattr(dm, 'analyze_game_state'):
            initial_narration = await dm.analyze_game_state(initial_state)

        await websocket.send_json({
            "type": "narration",
            "content": initial_narration,
            "timestamp": time_module.time()
        })

        # Main game loop
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            message = json.loads(data)

            message_type = message.get("type", "")

            if message_type == "get_state":
                # Get current game state
                state = {}
                narration = "The adventure continues..."

                # Use methods if they exist
                if hasattr(dm, 'get_screen_state'):
                    state = await dm.get_screen_state()

                # Only generate new narration if enough time has passed
                current_time = time_module.time()
                if hasattr(dm, 'last_narration_time') and hasattr(dm, 'narration_cooldown'):
                    if current_time - dm.last_narration_time > dm.narration_cooldown:
                        if hasattr(dm, 'analyze_game_state'):
                            narration = await dm.analyze_game_state(state)

                        await websocket.send_json({
                            "type": "narration",
                            "content": narration,
                            "timestamp": time_module.time()
                        })
                else:
                    # If we don't have timing attributes, just send a response
                    await websocket.send_json({
                        "type": "narration",
                        "content": narration,
                        "timestamp": time_module.time()
                    })

            elif message_type == "player_action":
                # Handle player action
                action = message.get("action", {})
                action_type = action.get("type", "")

                # Update game state with player action
                dm.game_state.last_action = action

                # Handle different action types
                if action_type == "move_character":
                    character_id = action.get("character_id", "")
                    to_pos = action.get("to", {})
                    from_pos = action.get("from", {})

                    # Check if this movement puts the character at the edge of the map
                    if dm.game_state.map_data and character_id:
                        map_width = dm.game_state.map_data.get("width", 0)
                        map_height = dm.game_state.map_data.get("height", 0)

                        # Check if the new position is at the edge
                        if is_at_map_edge(to_pos, map_width, map_height):
                            # Get the direction of the edge
                            edge_direction = get_edge_direction(to_pos, map_width, map_height)

                            if edge_direction:
                                print(f"Character {character_id} reached the {edge_direction} edge of the map!")

                                # Expand the map in that direction
                                dm.game_state.map_data = await expand_map_in_direction(
                                    edge_direction,
                                    dm.game_state.map_data,
                                    character_id
                                )

                                # Send the updated map to the client
                                await websocket.send_json({
                                    "type": "map_data",
                                    "map": dm.game_state.map_data,
                                    "timestamp": time_module.time()
                                })


                                # Generate a description for the new area
                                terrain_type = list(dm.game_state.map_data.get("terrain_distribution", {}).keys())[0] if dm.game_state.map_data.get("terrain_distribution") else "varied"

                                expansion_descriptions = {
                                    "north": f"As you reach the northern edge, the map expands to reveal more of the {terrain_type} landscape.",
                                    "south": f"The southern horizon reveals new terrain as the map expands. More {terrain_type} areas are now visible.",
                                    "east": f"Moving eastward, you discover new unexplored {terrain_type} areas as the map expands.",
                                    "west": f"The map expands westward, revealing more {terrain_type} terrain that was previously hidden from view."
                                }

                                expansion_narration = expansion_descriptions.get(
                                    edge_direction,
                                    f"The map expands to reveal more of the {terrain_type} landscape."
                                )

                                await websocket.send_json({
                                    "type": "narration",
                                    "content": expansion_narration,
                                    "timestamp": time_module.time()
                                })

                # Execute the action if needed
                if hasattr(dm, 'execute_action'):
                    await dm.execute_action(action)

                # Get updated state and generate narration
                state = await dm.get_screen_state()
                narration = await dm.analyze_game_state(state)

                await websocket.send_json({
                    "type": "narration",
                    "content": narration,
                    "timestamp": time_module.time()
                })

            elif message_type == "roll_dice":
                # Handle dice roll
                dice_type = message.get("dice_type", "d20")
                result = message.get("result", 0)

                # Add dice roll to game state
                dm.game_state.add_dice_roll(dice_type, result)

                # Generate narration for the dice roll
                state = await dm.get_screen_state()
                narration = await dm.analyze_game_state(state)

                await websocket.send_json({
                    "type": "narration",
                    "content": narration,
                    "timestamp": time_module.time()
                })

            elif message_type == "user_input":
                # Handle user text input
                content = message.get("content", "")
                dice_roll = message.get("dice_roll", None)

                # Add the user input to the game state
                if dice_roll:
                    dm.game_state.add_dice_roll(dice_roll.get("type", "d20"), dice_roll.get("result", 0))

                # Process the user input and generate a response
                response = await dm.process_user_input(content, dice_roll)

                # Prepare the response
                response_data = {
                    "type": "dm_response",
                    "content": response.get("content", ""),
                    "request_dice_roll": response.get("request_dice_roll", False),
                    "dice_type": response.get("dice_type", "d20"),
                    "move_character": response.get("move_character", None),
                    "add_character": response.get("add_character", None),
                    "timestamp": time_module.time()
                }

                # Add multiple character movements if present
                if "move_characters" in response:
                    response_data["move_characters"] = response.get("move_characters", [])
                    print(f"Adding multiple character movements: {response.get('move_characters', [])}")

                # Log movement data for debugging
                if response.get("move_character"):
                    print(f"Sending move_character command: {response.get('move_character')}")

                # Send the response back to the client
                print(f"Sending WebSocket response: {response_data}")
                await websocket.send_json(response_data)

            elif message_type == "generate_map":
                # Handle map generation request
                theme = message.get("theme", "fantasy adventure")
                content = message.get("content", "Create a dynamic map for my adventure")

                print(f"Generating map with theme: {theme}")

                try:
                    # Create a simple map directly

                    # Define terrain types
                    terrain_types = ["grass", "forest", "mountain", "water", "desert", "swamp", "cave"]

                    # Create a grid
                    width = 10
                    height = 8
                    grid = []

                    # Generate terrain based on theme
                    primary_terrain = "grass"
                    secondary_terrain = "forest"

                    # Adjust terrain based on theme
                    if "forest" in theme.lower():
                        primary_terrain = "forest"
                        secondary_terrain = "grass"
                    elif "mountain" in theme.lower():
                        primary_terrain = "mountain"
                        secondary_terrain = "grass"
                    elif "dungeon" in theme.lower() or "cave" in theme.lower():
                        primary_terrain = "cave"
                        secondary_terrain = "mountain"
                    elif "water" in theme.lower() or "coast" in theme.lower():
                        primary_terrain = "grass"
                        secondary_terrain = "water"
                    elif "desert" in theme.lower():
                        primary_terrain = "desert"
                        secondary_terrain = "grass"
                    elif "swamp" in theme.lower():
                        primary_terrain = "swamp"
                        secondary_terrain = "water"

                    # Generate the grid
                    for y in range(height):
                        row = []
                        for x in range(width):
                            # Determine terrain type
                            if random.random() < 0.7:  # 70% primary terrain
                                terrain = primary_terrain
                            else:
                                terrain = secondary_terrain

                            # Determine if obstacle
                            is_obstacle = terrain in ["water", "mountain"]

                            cell = {
                                "x": x,
                                "y": y,
                                "terrain": terrain,
                                "is_obstacle": is_obstacle,
                                "type": "revealed"
                            }
                            row.append(cell)
                        grid.append(row)

                    # Create map data
                    map_data = {
                        "id": f"map_{int(time_module.time())}",
                        "name": f"{theme.capitalize()} Realm",
                        "description": f"A {theme} themed map for your adventure.",
                        "grid": grid,
                        "width": width,
                        "height": height,
                        "terrain_distribution": {
                            primary_terrain: 0.7,
                            secondary_terrain: 0.3
                        }
                    }

                    # Send the map data to the client
                    await websocket.send_json({
                        "type": "map_data",
                        "map_data": map_data,
                        "timestamp": time_module.time()
                    })

                    # Send a description
                    description = f"You find yourself in a {theme} realm. The landscape is dominated by {primary_terrain} with patches of {secondary_terrain}. What adventures await you in this mysterious land?"

                    await websocket.send_json({
                        "type": "narration",
                        "content": description,
                        "timestamp": time_module.time()
                    })

                except Exception as e:
                    print(f"Error generating map: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "content": f"Error generating map: {str(e)}",
                        "timestamp": time_module.time()
                    })

            elif message_type == "ai_control":
                # Handle AI taking control of the game
                enabled = message.get("data", {}).get("enabled", False)

                if enabled:
                    # Generate an initial scene description
                    state = await dm.get_screen_state()
                    initial_scene = await dm.generate_adventure_start(state)

                    # Send the initial scene description
                    await websocket.send_json({
                        "type": "dm_response",
                        "content": initial_scene,
                        "timestamp": time_module.time()
                    })

            # Sleep briefly to prevent overwhelming the server
            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        # Clean up on disconnect
        if session_id in active_connections:
            del active_connections[session_id]
        print(f"Client disconnected: {session_id}")

    except Exception as e:
        # Handle other exceptions
        print(f"Error in WebSocket connection: {e}")
        await websocket.send_json({
            "type": "error",
            "content": str(e),
            "timestamp": time_module.time()
        })

        # Clean up
        if session_id in active_connections:
            del active_connections[session_id]

@app.get("/")
async def root():
    return {"message": "D&D Dungeon Master API is running"}

class MapTheme(BaseModel):
    theme: str = "fantasy adventure"

@app.post("/generate_map")
async def generate_map_endpoint(map_theme: MapTheme):
    try:
        # Use the theme from the request body
        theme = map_theme.theme
        print(f"API endpoint called with theme: {theme}")

        print(f"Generating map with theme: {theme}")

        # Define terrain types
        terrain_types = ["grass", "forest", "mountain", "water", "desert", "swamp", "cave"]

        # Create a grid
        width = 10
        height = 8
        grid = []

        # Generate terrain based on theme
        primary_terrain = "grass"
        secondary_terrain = "forest"

        # Adjust terrain based on theme
        if "forest" in theme.lower():
            primary_terrain = "forest"
            secondary_terrain = "grass"
        elif "mountain" in theme.lower():
            primary_terrain = "mountain"
            secondary_terrain = "grass"
        elif "dungeon" in theme.lower() or "cave" in theme.lower():
            primary_terrain = "cave"
            secondary_terrain = "mountain"
        elif "water" in theme.lower() or "coast" in theme.lower():
            primary_terrain = "grass"
            secondary_terrain = "water"
        elif "desert" in theme.lower():
            primary_terrain = "desert"
            secondary_terrain = "grass"
        elif "swamp" in theme.lower():
            primary_terrain = "swamp"
            secondary_terrain = "water"

        # Generate the grid
        for y in range(height):
            row = []
            for x in range(width):
                # Determine terrain type
                if random.random() < 0.7:  # 70% primary terrain
                    terrain = primary_terrain
                else:
                    terrain = secondary_terrain

                # Determine if obstacle
                is_obstacle = terrain in ["water", "mountain"]
                if terrain == "forest" and random.random() < 0.7:
                    is_obstacle = True
                elif terrain == "mountain" and random.random() < 0.9:
                    is_obstacle = True
                elif terrain == "water":
                    is_obstacle = True
                elif terrain in ["swamp", "cave"] and random.random() < 0.5:
                    is_obstacle = True

                cell = {
                    "x": x,
                    "y": y,
                    "terrain": terrain,
                    "is_obstacle": is_obstacle,
                    "type": "revealed"
                }
                row.append(cell)
            grid.append(row)

        # Create map data
        map_data = {
            "id": f"map_{int(time_module.time())}",
            "name": f"{theme.capitalize()} Realm",
            "description": f"A {theme} themed map for your adventure.",
            "grid": grid,
            "width": width,
            "height": height,
            "terrain_distribution": {
                primary_terrain: 0.7,
                secondary_terrain: 0.3
            }
        }

        return map_data
    except Exception as e:
        print(f"Error generating map: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
