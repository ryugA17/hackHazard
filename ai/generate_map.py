import json
import random
import time
import os
import uuid
import math

def generate_map(theme="fantasy adventure"):
    """Generate a procedural map with multi-layer visuals based on the theme"""
    print(f"Generating map with theme: {theme}")

    # Define terrain types
    terrain_types = ["grass", "forest", "mountain", "water", "desert", "swamp", "cave"]

    # Create a grid
    width = 12  # Larger grid
    height = 10
    grid = []

    # Generate terrain distribution based on theme
    terrain_distribution = {}
    
    # Default distribution - will be modified based on theme
    terrain_distribution["grass"] = 0.35
    terrain_distribution["forest"] = 0.25
    terrain_distribution["mountain"] = 0.15
    terrain_distribution["water"] = 0.15
    terrain_distribution["desert"] = 0.0
    terrain_distribution["swamp"] = 0.0
    terrain_distribution["cave"] = 0.0

    # Adjust terrain based on theme
    if "forest" in theme.lower():
        terrain_distribution["forest"] = 0.5
        terrain_distribution["grass"] = 0.3
        terrain_distribution["water"] = 0.1
        terrain_distribution["mountain"] = 0.1
    elif "mountain" in theme.lower():
        terrain_distribution["mountain"] = 0.5
        terrain_distribution["grass"] = 0.2
        terrain_distribution["forest"] = 0.2
        terrain_distribution["water"] = 0.1
    elif "dungeon" in theme.lower() or "cave" in theme.lower():
        terrain_distribution["cave"] = 0.5
        terrain_distribution["mountain"] = 0.3
        terrain_distribution["grass"] = 0.1
        terrain_distribution["forest"] = 0.1
    elif "water" in theme.lower() or "coast" in theme.lower():
        terrain_distribution["grass"] = 0.4
        terrain_distribution["water"] = 0.4
        terrain_distribution["forest"] = 0.1
        terrain_distribution["mountain"] = 0.1
    elif "desert" in theme.lower():
        terrain_distribution["desert"] = 0.6
        terrain_distribution["mountain"] = 0.2
        terrain_distribution["grass"] = 0.1
        terrain_distribution["cave"] = 0.1
    elif "swamp" in theme.lower():
        terrain_distribution["swamp"] = 0.5
        terrain_distribution["water"] = 0.3
        terrain_distribution["forest"] = 0.1
        terrain_distribution["grass"] = 0.1
    
    # Descriptive titles based on theme
    if "forest" in theme.lower():
        map_name = random.choice(["Whispering Woods", "Ancient Forest", "Emerald Canopy", "Verdant Wilds"])
        map_desc = "A dense forest where ancient trees whisper secrets and shadows dance between sunlit clearings."
    elif "mountain" in theme.lower():
        map_name = random.choice(["Jagged Peaks", "Frozen Summit", "Stone Sentinels", "Misty Mountains"])
        map_desc = "Towering mountains rise above the clouds, with treacherous paths and hidden caves awaiting exploration."
    elif "dungeon" in theme.lower():
        map_name = random.choice(["Forgotten Catacombs", "Shadow Labyrinth", "Crypts of Despair", "Abyssal Dungeon"])
        map_desc = "A dark, foreboding dungeon filled with ancient traps, lost treasures, and lurking dangers."
    elif "coast" in theme.lower() or "water" in theme.lower():
        map_name = random.choice(["Azure Shores", "Tidal Kingdom", "Salt Spray Haven", "Coastal Realm"])
        map_desc = "Crystal waters lap against sandy shores, with hidden coves and island mysteries waiting to be discovered."
    elif "desert" in theme.lower():
        map_name = random.choice(["Endless Sands", "Scorched Wastes", "Dune Sea", "Sunbaked Expanse"])
        map_desc = "A vast desert where mirages dance on the horizon and ancient ruins lie half-buried in shifting sands."
    elif "swamp" in theme.lower():
        map_name = random.choice(["Murky Depths", "Tangled Mire", "Fogbound Fen", "Serpent's Marsh"])
        map_desc = "A treacherous swamp where mist clings to gnarled trees and every step could lead to danger."
    else:
        map_name = random.choice(["Mystic Realm", "Enchanted Lands", "Forgotten Kingdom", "Adventure's Heart"])
        map_desc = "A diverse landscape with forests, mountains, and waters - perfect for an epic adventure."

    # Generate initial noise-based terrain map using simplex/perlin-like approach
    base_terrain = [[0 for _ in range(width)] for _ in range(height)]
    
    # Simple approximation of noise generation
    scale = 0.2
    for y in range(height):
        for x in range(width):
            # Create a simple noise value between 0 and 1
            nx = x * scale
            ny = y * scale
            value = (math.sin(nx) + math.sin(ny) + 
                     math.sin((nx + ny) * 0.5) + 
                     math.sin(math.sqrt(nx*nx + ny*ny) * 0.5)) * 0.25 + 0.5
            
            # Add some randomness
            value += random.uniform(-0.15, 0.15)
            
            # Clamp value
            value = max(0, min(1, value))
            
            base_terrain[y][x] = value
    
    # Assign terrain types based on noise values and distribution
    for y in range(height):
        row = []
        for x in range(width):
            value = base_terrain[y][x]
            
            # Determine terrain based on noise value and distribution
            terrain = select_terrain_from_distribution(value, terrain_distribution)
            
            # Determine if obstacle
            is_obstacle = terrain in ["mountain", "water"]
            
            # Add some random obstacles
            if terrain == "forest" and random.random() < 0.5:
                is_obstacle = True
            elif terrain == "swamp" and random.random() < 0.4:
                is_obstacle = True
            elif terrain == "cave" and random.random() < 0.6:
                is_obstacle = True
            
            # Create multi-layer visual system
            # Layer 1: Special variations (e.g., bloody tiles)
            special_variation = get_special_variation(terrain, theme)
            
            # Layer 2: Decorations and objects
            decoration = get_decoration(terrain, theme)
            
            # Layer 3: Lighting and shadows
            lighting = get_lighting(terrain, theme)
            
            # Add structures occasionally
            structure = None
            if random.random() < 0.05:  # 5% chance for a structure
                structure = get_structure(terrain, theme)
            
            # Add items rarely
            item = None
            if random.random() < 0.03:  # 3% chance for an item
                item = {
                    "id": f"item_{uuid.uuid4().hex[:8]}",
                    "type": get_item_type(terrain, theme),
                    "rarity": random.choice(["common", "uncommon", "rare"]),
                    "discovered": False
                }
            
            # Add traps rarely
            trap = None
            if random.random() < 0.04:  # 4% chance for a trap
                trap = {
                    "id": f"trap_{uuid.uuid4().hex[:8]}",
                    "type": get_trap_type(terrain, theme),
                    "detected": False,
                    "triggered": False,
                    "difficulty": random.randint(10, 20)  # DC for detecting/avoiding
                }
            
            # Create the cell with all our enhanced features
            cell = {
                "x": x,
                "y": y,
                "terrain": terrain,
                "is_obstacle": is_obstacle,
                "type": "revealed",
                "special_variation": special_variation,
                "decoration": decoration,
                "lighting": lighting,
                "structure": structure,
                "item": item,
                "trap": trap
            }
            row.append(cell)
        grid.append(row)
    
    # Post-processing: Ensure no player can get trapped (surrounded by obstacles)
    prevent_player_trapping(grid, width, height)
    
    # Create map data with our enhanced features
    map_data = {
        "id": f"map_{int(time.time())}",
        "name": map_name,
        "description": map_desc,
        "grid": grid,
        "width": width,
        "height": height,
        "terrain_distribution": terrain_distribution,
        "theme": theme
    }

    return map_data

def select_terrain_from_distribution(value, distribution):
    """Select terrain type based on a value and distribution"""
    # Sort terrains by their distribution values
    sorted_terrains = sorted(distribution.items(), key=lambda x: x[1], reverse=True)
    
    # Use the value to select a terrain
    threshold = 0
    for terrain, ratio in sorted_terrains:
        threshold += ratio
        if value <= threshold:
            return terrain
    
    # Default to grass if something goes wrong
    return "grass"

def get_special_variation(terrain, theme):
    """Get a special variation for terrain based on theme"""
    # 10% chance for special variations
    if random.random() > 0.1:
        return None
    
    # Base variations by terrain
    variations = {
        "grass": ["bloody_grass"],
        "forest": ["bloody_leaves", "scorched_grass", "burnt_trees"],
        "mountain": ["bloody_rocks"],
        "water": ["bloody_water", "magical_pool"],
        "desert": ["bloody_sand"],
        "swamp": ["bloody_swamp", "mystical_grove"],
        "cave": ["bloody_floor", "crystal_formation"]
    }
    
    # Add theme-specific variations
    if "dark" in theme.lower() or "dungeon" in theme.lower():
        for key in variations:
            variations[key].append("bloody_" + key)
    
    if "mystical" in theme.lower() or "magical" in theme.lower():
        variations["grass"].append("mystical_grove")
        variations["water"].append("magical_pool")
        variations["cave"].append("crystal_formation")
    
    # Get variations for this terrain
    terrain_variations = variations.get(terrain, [])
    
    # Return a random variation or None if no variations available
    return random.choice(terrain_variations) if terrain_variations else None

def get_decoration(terrain, theme):
    """Get decorations for terrain based on theme"""
    # 40% chance for decorations
    if random.random() > 0.4:
        return None
    
    # Define decorations by terrain
    decorations = {
        "grass": ["flower", "rock", "bush"],
        "forest": ["tree", "stump", "fallen_log", "mushroom", "berry_bush"],
        "mountain": ["boulder", "cave_entrance", "cliff", "nest"],
        "water": ["lily_pad", "fish", "dock", "boat"],
        "desert": ["cactus", "bones", "sand_dune", "oasis"],
        "swamp": ["roots", "murky_pool", "hanging_moss", "dead_tree"],
        "cave": ["stalagmite", "crystal", "underground_pool"]
    }
    
    # Add theme-specific decorations
    if "winter" in theme.lower() or "frozen" in theme.lower():
        decorations["grass"] = ["ice_patch", "snowdrift"]
        decorations["water"] = ["frozen_pond", "ice_patch"]
        decorations["forest"] = ["pine_tree", "snowdrift", "frozen_pond"]
    
    if "volcanic" in theme.lower() or "fire" in theme.lower():
        decorations["mountain"].extend(["smoke_vent", "obsidian", "fire_pit"])
        decorations["cave"].extend(["fire_pit", "smoke_vent", "obsidian"])
    
    if "ancient" in theme.lower() or "ruins" in theme.lower():
        for key in decorations:
            decorations[key].extend(["stone_arch", "altar", "treasure_chest"])
    
    if "civilized" in theme.lower() or "settlement" in theme.lower():
        decorations["grass"].extend(["signpost", "bench", "lantern"])
        decorations["forest"].extend(["signpost", "small_shrine"])
    
    # Get decorations for this terrain
    terrain_decorations = decorations.get(terrain, [])
    
    # Return a random decoration or None if no decorations available
    return random.choice(terrain_decorations) if terrain_decorations else None

def get_lighting(terrain, theme):
    """Get lighting effects for terrain based on theme"""
    # Define lighting by terrain
    base_lighting = {
        "grass": "bright",
        "forest": "dappled",
        "mountain": "bright",
        "water": "bright",
        "desert": "bright",
        "swamp": "foggy",
        "cave": "dark"
    }
    
    # Adjust lighting based on theme
    if "night" in theme.lower() or "dark" in theme.lower():
        for key in base_lighting:
            base_lighting[key] = "dark"
    
    if "fog" in theme.lower() or "mist" in theme.lower():
        for key in base_lighting:
            base_lighting[key] = "foggy"
    
    if "magical" in theme.lower() or "enchanted" in theme.lower():
        # Some terrains get magical lighting
        if random.random() < 0.3:  # 30% chance
            return {
                "base": "glowing",
                "variation": "flicker" if random.random() < 0.5 else "standard",
                "intensity": random.uniform(0.8, 1.2),
                "color_shift": random.choice([None, "warm", "cool", "eerie"])
            }
    
    # Get base lighting for this terrain
    base = base_lighting.get(terrain, "bright")
    
    # Create lighting object
    return {
        "base": base,
        "variation": "flicker" if random.random() < 0.1 else "standard", # 10% chance for flickering
        "intensity": random.uniform(0.7, 1.3),  # Random brightness
        "color_shift": random.choice([None, None, None, "warm", "cool"]) # Usually no shift
    }

def get_structure(terrain, theme):
    """Get a structure appropriate for the terrain and theme"""
    # Define structures by terrain
    structures = {
        "grass": ["village", "camp"],
        "forest": ["temple", "ruins", "shrine"],
        "mountain": ["tower", "castle", "ruins"],
        "desert": ["ruins", "temple"],
        "swamp": ["ruins"],
        "cave": ["portal", "shrine"]
    }
    
    # Add theme-specific structures
    if "medieval" in theme.lower() or "fantasy" in theme.lower():
        structures["grass"].extend(["village", "castle", "bridge"])
        structures["forest"].extend(["tower", "shrine"])
    
    if "tavern" in theme.lower() or "inn" in theme.lower():
        for key in structures:
            if key in ["grass", "forest"]:
                structures[key].append("tavern")
    
    # Get structures for this terrain
    terrain_structures = structures.get(terrain, [])
    
    # Return a random structure or None if no structures available
    return random.choice(terrain_structures) if terrain_structures else None

def get_item_type(terrain, theme):
    """Get an item type appropriate for the terrain and theme"""
    # Define items by terrain
    items = {
        "grass": ["health_potion", "water_flask", "rations"],
        "forest": ["rope", "health_potion", "rations"],
        "mountain": ["rope", "water_flask", "healing_crystal"],
        "water": ["water_flask", "rope"],
        "desert": ["water_flask", "rations", "health_potion"],
        "swamp": ["antidote", "health_potion"],
        "cave": ["torch", "health_potion", "magic_scroll"]
    }
    
    # Add theme-specific items
    if "magic" in theme.lower() or "enchanted" in theme.lower():
        for key in items:
            items[key].extend(["magic_scroll", "enchanted_arrow", "teleportation_stone"])
    
    if "stealth" in theme.lower() or "rogue" in theme.lower():
        for key in items:
            items[key].extend(["disguise_kit", "invisibility_cloak"])
    
    # Get items for this terrain
    terrain_items = items.get(terrain, ["health_potion"])
    
    # Return a random item
    return random.choice(terrain_items)

def get_trap_type(terrain, theme):
    """Get a trap type appropriate for the terrain and theme"""
    # Define traps by terrain
    traps = {
        "grass": ["spike_trap", "alarm"],
        "forest": ["spike_trap", "collapse", "alarm"],
        "mountain": ["collapse", "spike_trap"],
        "desert": ["collapse", "spike_trap"],
        "swamp": ["poison_dart", "spike_trap"],
        "cave": ["collapse", "spike_trap", "poison_dart"]
    }
    
    # Add theme-specific traps
    if "magic" in theme.lower() or "enchanted" in theme.lower():
        for key in traps:
            traps[key].append("magic_rune")
    
    # Get traps for this terrain
    terrain_traps = traps.get(terrain, ["spike_trap"])
    
    # Return a random trap
    return random.choice(terrain_traps)

def prevent_player_trapping(grid, width, height):
    """Ensure no player can be trapped by being surrounded by obstacles"""
    for y in range(height):
        for x in range(width):
            # Skip if this cell is an obstacle
            if grid[y][x]["is_obstacle"]:
                continue
            
            # Check if surrounded by obstacles
            surrounded = True
            
            # Check adjacent cells (including diagonals)
            for dy in [-1, 0, 1]:
                for dx in [-1, 0, 1]:
                    # Skip the center cell
                    if dx == 0 and dy == 0:
                        continue
                    
                    # Check if out of bounds
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    
                    # If any adjacent cell is not an obstacle, we're not surrounded
                    if not grid[ny][nx]["is_obstacle"]:
                        surrounded = False
                        break
                
                if not surrounded:
                    break
            
            # If surrounded, turn one obstacle into a non-obstacle
            if surrounded:
                print(f"Found potential trap at ({x}, {y}), opening escape route")
                # Choose one adjacent cell randomly to make passable
                escape_options = []
                
                # Prefer cardinal directions
                for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        escape_options.append((nx, ny))
                
                if escape_options:
                    ex, ey = random.choice(escape_options)
                    grid[ey][ex]["is_obstacle"] = False
                    # Also update terrain if needed
                    if grid[ey][ex]["terrain"] == "water":
                        grid[ey][ex]["terrain"] = "grass"
                        grid[ey][ex]["special_variation"] = "magical_pool"
                    elif grid[ey][ex]["terrain"] == "mountain":
                        grid[ey][ex]["terrain"] = "grass"
                        grid[ey][ex]["decoration"] = "boulder"

if __name__ == "__main__":
    # Generate a map
    map_data = generate_map("forest adventure")

    # Save to a file
    with open("map.json", "w") as f:
        json.dump(map_data, f, indent=2)

    print(f"Map generated and saved to map.json")
