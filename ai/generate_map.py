import json
import random
import time

def generate_map(theme="fantasy adventure"):
    """Generate a simple map based on the theme"""
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
            is_obstacle = terrain in ["water", "mountain", "forest"]

            # Add some random obstacles
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
        "id": f"map_{int(time.time())}",
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

if __name__ == "__main__":
    # Generate a map
    map_data = generate_map("forest adventure")

    # Save to a file
    with open("map.json", "w") as f:
        json.dump(map_data, f, indent=2)

    print(f"Map generated and saved to map.json")
