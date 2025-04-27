import os
import time
import asyncio
import json
import random
import re
from typing import Dict, List, Optional, Any, Tuple
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
    # Map generation settings
    "map_generation": {
        "default_width": 10,
        "default_height": 8,
        "terrain_types": ["grass", "water", "mountain", "forest", "swamp", "desert", "cave"],
        "terrain_weights": [0.5, 0.1, 0.1, 0.15, 0.05, 0.05, 0.05]
    },
    # Dice mechanics
    "dice": {
        "types": ["d4", "d6", "d8", "d10", "d12", "d20", "d100"],
        "success_thresholds": {
            "easy": 5,
            "medium": 10,
            "hard": 15,
            "very_hard": 20
        }
    },
    # Reward system
    "rewards": {
        "blockchain": "Monad",
        "marketplace": "Magic Eden",
        "min_time_between_rewards": 300  # 5 minutes in seconds
    },
    # DM Persona
    "dm_personas": {
        "standard": "You are a fair and balanced Dungeon Master who creates immersive, dynamic adventures.",
        "epic": "You are a dramatic Dungeon Master who focuses on epic, high-stakes adventures with powerful enemies and magical rewards.",
        "comical": "You are a lighthearted Dungeon Master who adds humor and whimsy to your adventures.",
        "grim": "You are a serious Dungeon Master who creates dark, challenging adventures with moral complexity.",
        "mysterious": "You are an enigmatic Dungeon Master who weaves puzzles and mysteries into your narratives."
    },
    # Default persona
    "default_persona": "standard"
}

# NFT Reward System
class RewardSystem:
    """Handles blockchain-based NFT rewards for player achievements"""

    def __init__(self):
        self.rewards_issued = []
        self.reward_types = {
            "weapon": {
                "prefixes": ["Blade", "Sword", "Axe", "Mace", "Dagger", "Bow", "Staff", "Warhammer", "Spear"],
                "suffixes": ["of Power", "of Souls", "of Flames", "of Frost", "of Thunder", "of Shadows", "of Truth",
                            "of the Ancients", "of Dragonslaying", "of Demon Hunting"]
            },
            "armor": {
                "prefixes": ["Plate", "Shield", "Helm", "Gauntlets", "Breastplate", "Greaves", "Mail", "Cloak"],
                "suffixes": ["of Protection", "of Warding", "of Reflection", "of Endurance", "of Fortitude",
                            "of the Phoenix", "of the Guardian", "of Elemental Resistance"]
            },
            "accessory": {
                "prefixes": ["Amulet", "Ring", "Bracers", "Belt", "Crown", "Circlet", "Talisman"],
                "suffixes": ["of Magic", "of Wisdom", "of Fortune", "of Vitality", "of Haste",
                            "of Mental Clarity", "of the Oracle", "of Farsight"]
            },
            "potion": {
                "prefixes": ["Elixir", "Potion", "Brew", "Tonic", "Philter", "Draught"],
                "suffixes": ["of Healing", "of Strength", "of Invisibility", "of Speed", "of Wisdom",
                            "of True Sight", "of Mana Restoration", "of Giant's Might"]
            },
            "scroll": {
                "prefixes": ["Scroll", "Tome", "Grimoire", "Spellbook", "Runes"],
                "suffixes": ["of Fireball", "of Lightning", "of Teleportation", "of Summoning", "of Necromancy",
                            "of Time Control", "of Mind Control", "of Mass Healing"]
            },
            "quest_item": {
                "prefixes": ["Ancient", "Mystic", "Royal", "Divine", "Infernal", "Ethereal"],
                "suffixes": ["Key", "Emblem", "Artifact", "Relic", "Shard", "Crystal", "Totem", "Sigil"]
            }
        }

        self.rarities = {
            "legendary": ["Mythical", "Legendary", "Ancient", "Godly", "Divine"],
            "epic": ["Epic", "Magnificent", "Enchanted", "Superior", "Mystical"],
            "rare": ["Rare", "Unusual", "Special", "Exceptional", "Curious"],
            "uncommon": ["Uncommon", "Interesting", "Notable", "Distinct"],
            "common": ["Common", "Simple", "Basic", "Standard", "Ordinary"]
        }

        self.rarity_colors = {
            "legendary": "#FFA500",  # Orange
            "epic": "#A335EE",       # Purple
            "rare": "#0070DD",       # Blue
            "uncommon": "#1EFF00",   # Green
            "common": "#FFFFFF"      # White
        }

        self.achievement_types = {
            "quest_completion": {"min_rarity": "uncommon", "max_rarity": "legendary"},
            "boss_defeat": {"min_rarity": "rare", "max_rarity": "legendary"},
            "puzzle_solved": {"min_rarity": "uncommon", "max_rarity": "epic"},
            "hidden_discovery": {"min_rarity": "rare", "max_rarity": "legendary"},
            "enemy_defeat": {"min_rarity": "common", "max_rarity": "rare"},
            "skill_check_success": {"min_rarity": "common", "max_rarity": "uncommon"}
        }

    def generate_nft_metadata(self, achievement_type: str, achievement_details: str, player_id: str) -> Dict:
        """Generate NFT metadata for an achievement reward"""
        # Determine rarity based on achievement type
        achievement_info = self.achievement_types.get(achievement_type, {"min_rarity": "common", "max_rarity": "uncommon"})

        # Select rarity class
        available_rarities = []
        rarity_levels = ["common", "uncommon", "rare", "epic", "legendary"]

        min_index = rarity_levels.index(achievement_info["min_rarity"])
        max_index = rarity_levels.index(achievement_info["max_rarity"])

        for i in range(min_index, max_index + 1):
            available_rarities.append(rarity_levels[i])

        # Weight higher rarities to be less common
        weights = []
        for rarity in available_rarities:
            if rarity == "legendary":
                weights.append(1)
            elif rarity == "epic":
                weights.append(3)
            elif rarity == "rare":
                weights.append(6)
            elif rarity == "uncommon":
                weights.append(15)
            else:
                weights.append(30)

        rarity_class = random.choices(available_rarities, weights=weights, k=1)[0]

        # Determine item type based on achievement
        if "boss" in achievement_type:
            item_types = ["weapon", "armor"]
        elif "quest" in achievement_type:
            item_types = ["quest_item", "accessory", "weapon", "armor"]
        elif "puzzle" in achievement_type:
            item_types = ["scroll", "accessory"]
        elif "discovery" in achievement_type:
            item_types = ["accessory", "quest_item", "scroll"]
        else:
            item_types = list(self.reward_types.keys())

        item_type = random.choice(item_types)

        # Generate item name
        rarity_prefix = random.choice(self.rarities[rarity_class])
        item_prefix = random.choice(self.reward_types[item_type]["prefixes"])
        item_suffix = random.choice(self.reward_types[item_type]["suffixes"])

        # Create full item name with optional adjective
        adjectives = ["Shining", "Dark", "Cursed", "Blessed", "Haunted", "Radiant", "Burning", "Frozen", "Thunderous"]
        use_adjective = random.random() < 0.5

        if use_adjective:
            adjective = random.choice(adjectives)
            item_name = f"{rarity_prefix} {adjective} {item_prefix} {item_suffix}"
        else:
            item_name = f"{rarity_prefix} {item_prefix} {item_suffix}"

        # Generate item description
        descriptions = [
            f"A {rarity_class} item found during the {achievement_details}.",
            f"This {item_type} was rewarded after {achievement_details}.",
            f"A powerful {item_type} bestowed upon the hero who {achievement_details}.",
            f"An artifact of {rarity_class} power, earned through {achievement_details}.",
            f"This {rarity_class} {item_type} was forged in the heat of {achievement_details}."
        ]

        item_description = random.choice(descriptions)

        # Generate stats based on rarity
        stats = self._generate_item_stats(item_type, rarity_class)

        # Create NFT metadata
        metadata = {
            "name": item_name,
            "description": item_description,
            "item_type": item_type,
            "rarity": rarity_class,
            "color": self.rarity_colors[rarity_class],
            "stats": stats,
            "attributes": [
                {"trait_type": "Type", "value": item_type.replace("_", " ").title()},
                {"trait_type": "Rarity", "value": rarity_class.title()},
                {"trait_type": "Achievement", "value": achievement_type.replace("_", " ").title()},
                *[{"trait_type": stat_name.replace("_", " ").title(), "value": stat_value} for stat_name, stat_value in stats.items()]
            ],
            "player_id": player_id,
            "achievement": achievement_type,
            "achievement_details": achievement_details,
            "timestamp": time.time(),
            "token_id": f"reward_{len(self.rewards_issued) + 1}_{int(time.time())}"
        }

        # Add the reward to our record
        self.rewards_issued.append(metadata)

        return metadata

    def _generate_item_stats(self, item_type: str, rarity: str) -> Dict:
        """Generate appropriate stats for an item based on type and rarity"""
        stats = {}

        # Base multiplier based on rarity
        multipliers = {
            "common": 1,
            "uncommon": 1.5,
            "rare": 2,
            "epic": 3,
            "legendary": 5
        }

        multiplier = multipliers.get(rarity, 1)

        # Generate stats based on item type
        if item_type == "weapon":
            stats["damage"] = int(random.randint(5, 15) * multiplier)
            stats["attack_speed"] = round(random.uniform(0.8, 1.5) * min(multiplier, 2), 2)

            # Legendary and epic weapons get special effects
            if rarity in ["legendary", "epic"]:
                effects = ["fire", "frost", "lightning", "poison", "necrotic", "radiant", "psychic"]
                stats["special_effect"] = random.choice(effects)
                stats["effect_damage"] = int(random.randint(3, 8) * (multiplier - 1))

        elif item_type == "armor":
            stats["armor_class"] = int(random.randint(3, 8) * multiplier)
            stats["damage_reduction"] = int(random.randint(1, 5) * multiplier)

            # Higher rarity armors get resistance
            if rarity in ["rare", "epic", "legendary"]:
                resistances = ["fire", "cold", "lightning", "poison", "necrotic", "radiant", "force"]
                resistance_count = 1 if rarity == "rare" else (2 if rarity == "epic" else 3)
                stats["resistances"] = random.sample(resistances, k=min(resistance_count, len(resistances)))

        elif item_type == "accessory":
            stat_options = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
            stat_count = 1 if rarity in ["common", "uncommon"] else (2 if rarity == "rare" else 3)

            for _ in range(stat_count):
                stat = random.choice(stat_options)
                stat_options.remove(stat)  # Don't repeat stats
                stats[stat] = int(random.randint(1, 4) * multiplier)

        elif item_type == "potion":
            potion_effects = {
                "healing": int(random.randint(10, 30) * multiplier),
                "mana": int(random.randint(10, 30) * multiplier),
                "strength": int(random.randint(2, 8) * multiplier),
                "speed": int(random.randint(2, 8) * multiplier),
                "resistance": int(random.randint(2, 8) * multiplier)
            }

            effect_type = random.choice(list(potion_effects.keys()))
            stats["effect_type"] = effect_type
            stats["effect_value"] = potion_effects[effect_type]
            stats["duration"] = int(random.randint(1, 10) * multiplier) if effect_type != "healing" else "instant"

        elif item_type == "scroll":
            spell_levels = {
                "common": [0, 1],
                "uncommon": [1, 2],
                "rare": [2, 3],
                "epic": [3, 4, 5],
                "legendary": [5, 6, 7, 8, 9]
            }

            spell_level = random.choice(spell_levels.get(rarity, [1]))
            stats["spell_level"] = spell_level

            # Higher level scrolls get additional effects
            if spell_level >= 3:
                stats["area_of_effect"] = f"{random.randint(10, 30)} ft radius"
            if spell_level >= 5:
                stats["casting_time"] = "1 action" if random.random() < 0.7 else "1 bonus action"

        elif item_type == "quest_item":
            # Quest items have special properties
            properties = ["portal_key", "puzzle_solution", "ritual_component", "summoning_focus",
                          "guardian_seal", "ancient_knowledge", "divine_blessing"]

            # Higher rarity quest items get more properties
            property_count = 1 if rarity in ["common", "uncommon"] else (2 if rarity == "rare" else 3)
            stats["properties"] = random.sample(properties, k=min(property_count, len(properties)))

            # All quest items have a lore snippet
            lore_snippets = [
                "Said to have belonged to an ancient hero of legend.",
                "Forged in the fires of the world's creation.",
                "Carries whispers of forgotten civilizations.",
                "Radiates an otherworldly energy.",
                "Bears inscriptions in a language long dead.",
                "Seems to shift and change when not directly observed."
            ]
            stats["lore"] = random.choice(lore_snippets)

        return stats

    async def mint_nft_reward(self, metadata: Dict) -> Dict:
        """Simulate minting an NFT reward on the blockchain

        In a real implementation, this would connect to Monad or other blockchain
        """
        try:
            # Simulate blockchain transaction delay
            await asyncio.sleep(1)

            # Add transaction details to metadata
            transaction_hash = '0x' + ''.join(random.choices('0123456789abcdef', k=64))
            block_number = random.randint(1000000, 9999999)

            nft_data = {
                **metadata,
                "blockchain": "Monad",
                "transaction_hash": transaction_hash,
                "block_number": block_number,
                "marketplace_url": f"https://magiceden.io/item/{metadata['token_id']}",
                "minted": True,
                "mint_timestamp": time.time()
            }

            return nft_data

        except Exception as e:
            print(f"Error minting NFT reward: {e}")
            return {
                **metadata,
                "error": str(e),
                "minted": False
            }

# Game state tracking
class GameState:
    """Tracks and manages the state of the D&D game"""
    
    def __init__(self):
        self.characters = []
        self.npcs = []
        self.monsters = []
        self.current_map = "default"
        self.map_data = {}
        self.player_positions = {}
        self.in_combat = False
        self.current_turn = None
        self.narrative_history = []
        self.last_action = None
        self.dice_rolls = []
        self.quest_log = []
        self.completed_achievements = []
        self.active_effects = []
        self.inventory = {}
        self.environment_description = ""
        
    def to_dict(self) -> Dict:
        """Convert game state to dictionary for serialization"""
        return {
            "characters": self.characters,
            "npcs": self.npcs,
            "monsters": self.monsters,
            "current_map": self.current_map,
            "map_data": self.map_data,
            "player_positions": self.player_positions,
            "in_combat": self.in_combat,
            "current_turn": self.current_turn,
            "narrative_history": self.narrative_history[-5:] if self.narrative_history else [],
            "last_action": self.last_action,
            "dice_rolls": self.dice_rolls[-5:] if self.dice_rolls else [],
            "quest_log": self.quest_log,
            "completed_achievements": self.completed_achievements,
            "active_effects": self.active_effects,
            "inventory": self.inventory,
            "environment_description": self.environment_description
        }

    def add_narrative(self, text: str) -> None:
        """Add a narrative entry to the history"""
        self.narrative_history.append({
            "text": text,
            "timestamp": time.time()
        })

    def add_dice_roll(self, roll_type: str, result: int, context: str = "") -> None:
        """Add a dice roll to the history with optional context"""
        self.dice_rolls.append({
            "type": roll_type,
            "result": result,
            "context": context,
            "timestamp": time.time()
        })
        
    def add_quest(self, title: str, description: str, difficulty: str = "medium") -> None:
        """Add a new quest to the quest log"""
        self.quest_log.append({
            "id": f"quest_{len(self.quest_log) + 1}_{int(time.time())}",
            "title": title,
            "description": description,
            "difficulty": difficulty,
            "completed": False,
            "created_at": time.time(),
            "completed_at": None
        })
        
    def complete_quest(self, quest_id: str) -> bool:
        """Mark a quest as completed"""
        for quest in self.quest_log:
            if quest["id"] == quest_id and not quest["completed"]:
                quest["completed"] = True
                quest["completed_at"] = time.time()
                
                # Add to completed achievements for reward possibilities
                self.completed_achievements.append({
                    "type": "quest_completion",
                    "details": quest["title"],
                    "timestamp": time.time()
                })
                return True
        return False
    
    def add_achievement(self, achievement_type: str, details: str) -> None:
        """Add a completed achievement"""
        self.completed_achievements.append({
            "type": achievement_type,
            "details": details,
            "timestamp": time.time()
        })
    
    def update_environment(self, description: str) -> None:
        """Update the current environment description"""
        self.environment_description = description

class DiceMechanics:
    """Handles dice rolling and outcome determination"""

    def __init__(self):
        self.dice_types = CONFIG["dice"]["types"]
        self.success_thresholds = CONFIG["dice"]["success_thresholds"]
        self.last_rolls = []

    def roll_dice(self, dice_type: str, count: int = 1) -> Dict:
        """Roll dice and return the result

        Args:
            dice_type: The type of die to roll (e.g., "d20", "d6")
            count: Number of dice to roll

        Returns:
            Dictionary with roll results
        """
        if dice_type not in self.dice_types:
            raise ValueError(f"Invalid dice type: {dice_type}. Valid types are {self.dice_types}")

        sides = int(dice_type[1:])
        rolls = [random.randint(1, sides) for _ in range(count)]
        total = sum(rolls)

        result = {
            "type": dice_type,
            "count": count,
            "rolls": rolls,
            "total": total,
            "timestamp": time.time()
        }

        # Store this roll
        self.last_rolls.append(result)
        if len(self.last_rolls) > 10:
            self.last_rolls.pop(0)  # Keep only the last 10 rolls

        return result

    def interpret_roll(self, roll: Dict, difficulty: str = "medium") -> Dict:
        """Interpret a dice roll result

        Args:
            roll: The dice roll result
            difficulty: Difficulty level (easy, medium, hard, very_hard)

        Returns:
            Dictionary with interpretation
        """
        # Special handling for d20 (most common check dice)
        if roll["type"] == "d20":
            # Critical success on natural 20
            if 20 in roll["rolls"]:
                success_level = "critical_success"
                description = "Critical success! Your action succeeds spectacularly."
            # Critical failure on natural 1
            elif 1 in roll["rolls"]:
                success_level = "critical_failure"
                description = "Critical failure! Your action fails in the worst way possible."
            # Normal success/failure based on difficulty threshold
            else:
                threshold = self.success_thresholds.get(difficulty, 10)
                if roll["total"] >= threshold:
                    success_level = "success"
                    if roll["total"] >= threshold + 5:
                        description = "Great success! Your action succeeds with impressive results."
                    else:
                        description = "Success! Your action succeeds as intended."
                else:
                    success_level = "failure"
                    if roll["total"] <= threshold - 5:
                        description = "Significant failure. Your action fails badly."
                    else:
                        description = "Failure. Your action doesn't succeed."
        # Other dice types (damage dice, etc.)
        else:
            # For non-d20 dice, we just report the outcome without judgment
            success_level = "neutral"
            description = f"You rolled {roll['total']} on {roll['count']}{roll['type']}."

            # Add context for damage rolls
            sides = int(roll["type"][1:])
            max_possible = sides * roll["count"]
            if roll["total"] >= max_possible * 0.8:
                description += " That's a very high roll!"
            elif roll["total"] <= max_possible * 0.2:
                description += " That's a very low roll."

        return {
            "original_roll": roll,
            "success_level": success_level,
            "description": description,
            "difficulty": difficulty
        }

    def parse_dice_notation(self, notation: str) -> Dict:
        """Parse dice notation (e.g., '2d6+3')

        Args:
            notation: Dice notation string

        Returns:
            Dictionary with parsed components
        """
        # Match standard dice notation: [count]d[sides][+/-][modifier]
        pattern = r"^(\d+)?d(\d+)([+-]\d+)?$"
        match = re.match(pattern, notation.lower())

        if not match:
            raise ValueError(f"Invalid dice notation: {notation}")

        count = int(match.group(1) or 1)
        sides = int(match.group(2))
        modifier_str = match.group(3) or "+0"
        modifier = int(modifier_str)

        return {
            "count": count,
            "sides": sides,
            "dice_type": f"d{sides}",
            "modifier": modifier,
            "notation": notation
        }

    def get_recommended_difficulty(self, action_description: str) -> str:
        """Estimate an appropriate difficulty level for an action

        Args:
            action_description: Description of the action

        Returns:
            Recommended difficulty level
        """
        # This is a simplified implementation
        # In a real system, you might use NLP or keyword matching

        # Default to medium difficulty
        difficulty = "medium"

        # Check for keywords indicating different difficulty levels
        easy_keywords = ["simple", "easy", "trivial", "basic", "straightforward"]
        hard_keywords = ["difficult", "hard", "challenging", "complex", "complicated"]
        very_hard_keywords = ["extremely", "nearly impossible", "hardest", "very difficult", "master"]

        # Normalize description
        desc_lower = action_description.lower()

        # Check for keyword matches
        for keyword in easy_keywords:
            if keyword in desc_lower:
                return "easy"

        for keyword in hard_keywords:
            if keyword in desc_lower:
                return "hard"

        for keyword in very_hard_keywords:
            if keyword in desc_lower:
                return "very_hard"

        return difficulty

class MapGenerator:
    """Dynamically generates maps based on the narrative situation"""
    
    def __init__(self):
        self.terrain_types = CONFIG["map_generation"]["terrain_types"]
        self.terrain_weights = CONFIG["map_generation"]["terrain_weights"]
        self.default_width = CONFIG["map_generation"]["default_width"]
        self.default_height = CONFIG["map_generation"]["default_height"]

    def generate_map(self, context: str, width: int = None, height: int = None) -> Dict:
        """Generate a map based on the narrative context"""
        # Use default dimensions if not specified
        width = width or self.default_width
        height = height or self.default_height

        # Analyze context to determine terrain distribution
        terrain_distribution = self._analyze_context_for_terrain(context)

        # Generate the grid
        grid = self._generate_grid(width, height, terrain_distribution)

        # Generate map metadata
        map_id = f"map_{int(time.time())}"
        map_name = self._generate_map_name(context)
        map_description = self._generate_map_description(context)

        return {
            "id": map_id,
            "name": map_name,
            "description": map_description,
            "grid": grid,
            "width": width,
            "height": height,
            "terrain_distribution": terrain_distribution
        }

    def _analyze_context_for_terrain(self, context: str) -> Dict[str, float]:
        """Analyze the narrative context to determine terrain distribution"""
        # Start with default weights
        weights = dict(zip(self.terrain_types, self.terrain_weights))

        # Adjust weights based on context keywords
        keywords = {
            "forest": ["forest", "woods", "trees", "woodland", "jungle", "grove"],
            "mountain": ["mountain", "mountains", "hill", "hills", "cliff", "rocky", "highland"],
            "water": ["water", "river", "lake", "ocean", "sea", "stream", "pond", "coast"],
            "desert": ["desert", "sand", "dune", "arid", "dry", "barren"],
            "swamp": ["swamp", "marsh", "bog", "wetland", "mire", "fen"],
            "cave": ["cave", "cavern", "underground", "tunnel", "dungeon", "crypt", "tomb"],
            "grass": ["grass", "plain", "field", "meadow", "prairie", "grassland"]
        }

        # Normalize the context
        context_lower = context.lower()

        # Check for keyword matches and adjust weights
        total_matches = 0
        for terrain, keyword_list in keywords.items():
            matches = sum([1 for keyword in keyword_list if keyword in context_lower])
            if matches > 0:
                # Increase weight for matched terrain
                weights[terrain] = weights.get(terrain, 0.1) + (matches * 0.1)
                total_matches += matches

        # Normalize weights to sum to 1
        if total_matches > 0:
            weight_sum = sum(weights.values())
            weights = {k: v / weight_sum for k, v in weights.items()}

        return weights

    def _generate_grid(self, width: int, height: int, terrain_distribution: Dict[str, float]) -> List[List[Dict]]:
        """Generate a grid with terrain based on the distribution"""
        grid = []

        # Extract terrain types and weights for random.choices
        terrain_types = list(terrain_distribution.keys())
        terrain_weights = list(terrain_distribution.values())

        # Initialize with random terrain
        for y in range(height):
            row = []
            for x in range(width):
                terrain = random.choices(terrain_types, weights=terrain_weights, k=1)[0]
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

        # Apply cellular automata to make terrain more natural
        grid = self._smooth_terrain(grid, 2)

        return grid

    def _smooth_terrain(self, grid: List[List[Dict]], iterations: int) -> List[List[Dict]]:
        """Apply cellular automata to make terrain more natural"""
        height = len(grid)
        width = len(grid[0]) if height > 0 else 0

        for _ in range(iterations):
            new_grid = []
            for y in range(height):
                new_row = []
                for x in range(width):
                    # Count neighboring terrains
                    neighbors = []
                    for dy in [-1, 0, 1]:
                        for dx in [-1, 0, 1]:
                            # Skip the center cell
                            if dx == 0 and dy == 0:
                                continue

                            # Get neighbor coordinates
                            nx, ny = x + dx, y + dy

                            # Check if neighbor is within bounds
                            if 0 <= nx < width and 0 <= ny < height:
                                neighbors.append(grid[ny][nx]["terrain"])

                    # Find most common neighbor terrain
                    if neighbors:
                        terrain_counts = {}
                        for terrain in neighbors:
                            terrain_counts[terrain] = terrain_counts.get(terrain, 0) + 1

                        current_terrain = grid[y][x]["terrain"]
                        current_count = terrain_counts.get(current_terrain, 0)

                        # If current terrain is not most common, randomly decide if it should change
                        most_common = max(terrain_counts.items(), key=lambda x: x[1])
                        if most_common[1] > current_count and random.random() < 0.7:
                            new_terrain = most_common[0]
                        else:
                            new_terrain = current_terrain
                    else:
                        new_terrain = grid[y][x]["terrain"]

                    # Create new cell with updated terrain
                    new_cell = grid[y][x].copy()
                    new_cell["terrain"] = new_terrain
                    new_cell["is_obstacle"] = new_terrain in ["water", "mountain"]
                    new_row.append(new_cell)

                new_grid.append(new_row)

            grid = new_grid

        return grid

    def _generate_map_name(self, context: str) -> str:
        """Generate a name for the map based on context"""
        # Define some prefixes and suffixes
        prefixes = ["The", "Ancient", "Forgotten", "Mysterious", "Hidden", "Forbidden", "Enchanted", "Sacred", "Lost"]
        locations = ["Realm", "Land", "Kingdom", "Domain", "Territory", "Vale", "Glen", "Pass", "Hollow", "Woods", "Forest", "Mountains", "Hills", "Caves", "Ruins", "Temple", "Sanctuary", "Haven", "Refuge"]
        suffixes = ["of Shadows", "of Light", "of Mystery", "of Magic", "of Terror", "of Wonder", "of the Ancients", "of the Forgotten", "of Doom", "of Destiny", "of Dragons", "of Elves", "of Dwarves", "of Giants"]

        # Generate a random name
        name_parts = []

        # 50% chance to add a prefix
        if random.random() < 0.5:
            name_parts.append(random.choice(prefixes))

        # Always add a location
        name_parts.append(random.choice(locations))

        # 50% chance to add a suffix
        if random.random() < 0.5:
            name_parts.append(random.choice(suffixes))

        return " ".join(name_parts)

    def _generate_map_description(self, context: str) -> str:
        """Generate a description for the map based on context"""
        # Simple template-based description
        templates = [
            "A {adjective} landscape with {feature}.",
            "This {adjective} area is known for its {feature}.",
            "Travelers speak of the {feature} that make this region {adjective}.",
            "A {adjective} region that contains {feature}.",
            "Legends tell of {feature} in this {adjective} land."
        ]

        adjectives = ["mysterious", "dangerous", "magical", "ancient", "forgotten", "enchanted", "cursed", "blessed", "wild", "untamed", "rugged", "peaceful", "treacherous", "serene", "haunted"]

        features = [
            "towering mountains and deep valleys",
            "dense forests and hidden glades",
            "winding rivers and crystal-clear lakes",
            "ancient ruins and forgotten temples",
            "dark caves and underground passages",
            "rolling hills and vast plains",
            "magical anomalies and strange phenomena",
            "diverse ecosystems and rare creatures",
            "abandoned settlements and eerie structures",
            "sacred sites and magical fountains"
        ]

        template = random.choice(templates)
        description = template.format(
            adjective=random.choice(adjectives),
            feature=random.choice(features)
        )

        return description

class DungeonMaster:
    """Core AI Dungeon Master that manages the game, narration, and player interactions"""
    
    def __init__(self, persona: str = None):
        self.game_state = GameState()
        self.last_narration_time = 0
        self.narration_cooldown = 3  # seconds between narrations
        self.map_generator = MapGenerator()
        self.dice_mechanics = DiceMechanics()
        self.reward_system = RewardSystem()
        self.last_reward_time = 0
        self.persona = persona or CONFIG["default_persona"]
        
    async def _get_dm_response(self, prompt: str, system_prompt: str = None) -> str:
        """Get a response from the LLM for a given prompt"""
        try:
            # Use default system prompt if none provided
            if not system_prompt:
                system_prompt = self._get_system_prompt()
                
            # Call Groq API
            response = client.chat.completions.create(
                model=CONFIG["model"],
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            # Extract the response
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error getting DM response: {e}")
            return f"The Dungeon Master pauses momentarily... (Error: {str(e)})"
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI DM, incorporating the selected persona"""
        base_prompt = """
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
        - Interpret dice results dramatically: 1 is a critical failure, 20 is a critical success
        - Maintain internal consistency in the game world and narrative
        - When describing locations, be specific about spatial relationships to help players visualize the map
        - When a player defeats a significant enemy or completes a quest, consider awarding them with a magical item

        Always stay in character as the Dungeon Master. Avoid meta-level explanations unless specifically asked out-of-character. Your goal is to create an engaging, responsive, fair, and thrilling world for the players to explore.
        """
        
        # Add persona-specific guidance
        persona_guidance = CONFIG["dm_personas"].get(self.persona, CONFIG["dm_personas"]["standard"])
        
        return f"{base_prompt}\n\nPersona: {persona_guidance}"
        
    async def process_user_input(self, content: str, dice_roll: Optional[Dict] = None) -> Dict:
        """Process user input and generate a response"""
        try:
            # Get the current game state
            game_state_dict = self.game_state.to_dict()
            
            # Format dice roll information if available
            dice_roll_text = ""
            if dice_roll:
                dice_type = dice_roll.get("type", "d20")
                result = dice_roll.get("result", 0)
                dice_roll_text = f"The player just rolled a {result} on a {dice_type}."
                
                # Add context about what this roll is for
                context = dice_roll.get("context", "")
                if context:
                    dice_roll_text += f" This was rolled for: {context}"
            
            # Construct recent narrative context
            narrative_context = "Recent events:\n"
            for entry in game_state_dict.get("narrative_history", [])[-3:]:  # Last 3 entries
                narrative_context += f"- {entry.get('text', '')}\n"
            
            # Build the prompt
            prompt = f"""
            # Current Game State
            
            Map: {game_state_dict.get("current_map", "default")}
            Environment: {game_state_dict.get("environment_description", "A fantasy setting")}
            In Combat: {"Yes" if game_state_dict.get("in_combat", False) else "No"}
            
            ## Characters and NPCs
            {self._format_characters(game_state_dict.get("characters", []), game_state_dict.get("player_positions", {}))}
            
            ## Recent Narrative History
            {narrative_context}
            
            ## Recent Dice Rolls
            {self._format_dice_rolls(game_state_dict.get("dice_rolls", []))}
            
            ## Active Quests
            {self._format_quests(game_state_dict.get("quest_log", []))}
            
            # User Input
            The player says: "{content}"
            
            {dice_roll_text}
            
            # Task
            Respond to the player's input as a Dungeon Master would. Consider:
            1. The current game state and narrative history
            2. The player's specific request or action
            3. Any dice roll results that might determine success or failure
            
            If the player's action requires a skill check or saving throw, you should request a dice roll by mentioning the need for a specific dice roll (e.g., "Roll a d20 for Perception check").
            
            If the player is attempting to move or explore, describe the new environment vividly.
            
            If the player is engaging in combat, narrate the action dramatically based on any dice rolls.
            
            If the player completes a significant task, consider whether they deserve a reward.
            
            Keep your response in-character as a Dungeon Master. Be vivid and engaging.
            """
            
            # Get response from LLM
            dm_response = await self._get_dm_response(prompt)
            
            # Parse the response for special commands and metadata
            parsed_response = self._parse_dm_response(dm_response)
            
            # Update game state with new narration
            self.game_state.add_narrative(parsed_response["content"])
            self.last_narration_time = time.time()
            
            # Handle environment updates if this is an exploration response
            if "environment" in parsed_response:
                self.game_state.update_environment(parsed_response["environment"])
            
            # Check if we should issue a reward
            if parsed_response.get("issue_reward", False):
                # Determine a reason for the reward if none specified
                reward_reason = parsed_response.get("reward_reason", "recent accomplishment")
                reward_type = parsed_response.get("reward_type", "quest_completion")
                
                # Find the most recent character ID
                character_id = "player_1"
                if self.game_state.characters:
                    character_id = self.game_state.characters[0].get("id", "player_1")
                
                # Issue the reward
                reward_data = await self.issue_nft_reward(reward_type, reward_reason, character_id)
                
                # Append reward information to the response
                if reward_data.get("success", False):
                    reward_desc = reward_data.get("description", "")
                    parsed_response["content"] += f"\n\n{reward_desc}"
            
            return parsed_response
            
        except Exception as e:
            print(f"Error processing user input: {e}")
            return {
                "content": f"The Dungeon Master pauses for a moment... (Error: {str(e)})"
            }
    
    def _parse_dm_response(self, response: str) -> Dict:
        """Parse the DM response for special commands and metadata"""
        result = {
            "content": response
        }
        
        # Check for dice roll requests
        roll_patterns = [
            r"[Rr]oll a (d\d+)",
            r"[Mm]ake a (d\d+) roll",
            r"[Rr]oll (\d+d\d+)",
            r"[Nn]eed to roll a (d\d+)"
        ]
        
        for pattern in roll_patterns:
            matches = re.findall(pattern, response)
            if matches:
                result["request_dice_roll"] = True
                result["dice_type"] = matches[0]
                
                # Try to determine the context for this roll
                context_indicators = [
                    (r"for ([A-Za-z\s]+) check", "skill check"),
                    (r"for ([A-Za-z\s]+) save", "saving throw"),
                    (r"for ([A-Za-z\s]+) attack", "attack roll"),
                    (r"for ([A-Za-z\s]+) damage", "damage roll")
                ]
                
                for pattern, roll_type in context_indicators:
                    context_match = re.search(pattern, response)
                    if context_match:
                        result["roll_context"] = f"{roll_type}: {context_match.group(1)}"
                        break
                break
        
        # Check for combat indicators
        combat_indicators = ["attack", "combat", "initiative", "battle", "fight"]
        if any(indicator in response.lower() for indicator in combat_indicators):
            result["combat_indicated"] = True
        
        # Check for map changes (new area)
        environment_indicators = ["enter", "arrive", "new area", "come upon", "discover"]
        if any(indicator in response.lower() for indicator in environment_indicators):
            # Try to extract environment description
            environment_patterns = [
                r"You (?:see|enter|arrive at|find) ([^\.]+)",
                r"Before you (?:is|stands|lies) ([^\.]+)",
                r"You (?:come upon|discover) ([^\.]+)"
            ]
            
            for pattern in environment_patterns:
                match = re.search(pattern, response)
                if match:
                    result["environment"] = match.group(1).strip()
                    result["map_change_indicated"] = True
                    break
        
        # Check for reward indicators
        reward_indicators = ["reward", "treasure", "item", "receive", "granted", "bestow"]
        reward_match = any(indicator in response.lower() for indicator in reward_indicators)
        achievement_indicators = ["accomplish", "complete", "achieve", "defeat", "success", "victory"]
        achievement_match = any(indicator in response.lower() for indicator in achievement_indicators)
        
        if reward_match and achievement_match:
            result["issue_reward"] = True
            
            # Try to determine the reason for the reward
            if "quest" in response.lower():
                result["reward_type"] = "quest_completion"
                result["reward_reason"] = "completing a quest"
            elif "boss" in response.lower() or "defeat" in response.lower():
                result["reward_type"] = "boss_defeat"
                result["reward_reason"] = "defeating a powerful enemy"
            elif "puzzle" in response.lower() or "solve" in response.lower():
                result["reward_type"] = "puzzle_solved"
                result["reward_reason"] = "solving a challenging puzzle"
            elif "discover" in response.lower() or "find" in response.lower():
                result["reward_type"] = "hidden_discovery"
                result["reward_reason"] = "discovering a hidden secret"
            else:
                result["reward_type"] = "quest_completion"
                result["reward_reason"] = "your heroic deed"
                
        return result
    
    async def roll_dice_with_narration(self, dice_type: str, context: str = "") -> Dict:
        """Roll dice and generate narrative interpretation of the result"""
        try:
            # Parse if this is in XdY format (e.g., 2d6)
            count = 1
            if 'd' in dice_type and dice_type[0].isdigit():
                parts = dice_type.split('d')
                count = int(parts[0])
                dice_type = f"d{parts[1]}"
            
            # Roll the dice
            roll_result = self.dice_mechanics.roll_dice(dice_type, count)
            
            # Add context and store in game state
            self.game_state.add_dice_roll(dice_type, roll_result["total"], context)
            
            # Prepare prompt for interpretive narration
            prompt = f"""
            # Dice Roll Information
            
            Dice Type: {dice_type}
            Number of Dice: {count}
            Roll Result: {roll_result["total"]}
            Individual Rolls: {roll_result["rolls"]}
            
            # Roll Context
            This roll was made for: {context if context else "an unspecified action"}
            
            # Current Game State
            {self._format_narrative_history(self.game_state.narrative_history[-2:] if self.game_state.narrative_history else [])}
            
            # Task
            As a Dungeon Master, provide a dramatic, narrative interpretation of this dice roll result. 
            Consider:
            
            1. For d20 rolls: 1 is a critical failure, 20 is a critical success
            2. For damage rolls (d4, d6, d8, etc.): Describe the impact vividly
            3. For ability checks: Describe how well or poorly the character performs
            
            Keep your response concise (1-3 sentences) but vivid. Stay in character as a Dungeon Master.
            """
            
            # Get narrative from LLM
            narrative = await self._get_dm_response(prompt)
            
            return {
                "success": True,
                "roll": roll_result,
                "narrative": narrative,
                "context": context
            }
            
        except Exception as e:
            print(f"Error handling dice roll: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_dynamic_map(self, narrative_context: str) -> Dict:
        """Generate a map based on the narrative context and update game state"""
        try:
            # Use the MapGenerator to create a map
            map_data = self.map_generator.generate_map(narrative_context)
            
            # Update game state with new map data
            self.game_state.map_data = map_data
            
            # Build a prompt for describing the map
            prompt = f"""
            # Map Data
            
            Map Name: {map_data.get("name", "Unknown Region")}
            Map Description: {map_data.get("description", "A mysterious area")}
            Terrain Types Present: {', '.join(map_data.get("terrain_distribution", {}).keys())}
            
            # Narrative Context
            {narrative_context}
            
            # Task
            As a Dungeon Master, provide a vivid, detailed description of this map area that the players can visualize.
            Include:
            
            1. Notable landmarks or features
            2. The general layout and atmosphere
            3. Any immediate points of interest
            4. Sensory details (sights, sounds, smells)
            
            Keep your description immersive and fantasy-appropriate. This should help players visualize the map in their minds.
            """
            
            # Get description from LLM
            map_description = await self._get_dm_response(prompt)
            
            # Update environment description in game state
            self.game_state.update_environment(map_description)
            
            return {
                "success": True,
                "map": map_data,
                "description": map_description
            }
            
        except Exception as e:
            print(f"Error generating map: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def issue_nft_reward(self, achievement_type: str, achievement_details: str, player_id: str) -> Dict:
        """Issue an NFT reward for a player achievement"""
        try:
            # Check if enough time has passed since the last reward
            current_time = time.time()
            if current_time - self.last_reward_time < CONFIG["rewards"]["min_time_between_rewards"]:
                return {
                    "success": False,
                    "error": "Too soon to issue another reward"
                }
            
            # Generate NFT metadata
            metadata = self.reward_system.generate_nft_metadata(
                achievement_type,
                achievement_details,
                player_id
            )
            
            # Mint the NFT
            nft_data = await self.reward_system.mint_nft_reward(metadata)
            
            # Update last reward time
            self.last_reward_time = current_time
            
            # Generate a narrative description of the reward
            reward_description = self._generate_reward_narrative(nft_data)
            
            return {
                "success": True,
                "nft_data": nft_data,
                "description": reward_description
            }
            
        except Exception as e:
            print(f"Error issuing NFT reward: {e}")
            return {
                "success": False,
                "error": str(e)
            }
            
    def _generate_reward_narrative(self, nft_data: Dict) -> str:
        """Generate a narrative description of the reward"""
        item_name = nft_data.get("name", "mysterious item")
        item_type = nft_data.get("item_type", "item")
        rarity = nft_data.get("rarity", "common")
        
        # Get the stored templates or fallback to defaults if not available
        templates = {
            "legendary": [
                "With a blinding flash of light, {item_name} materializes before you. The air crackles with ancient power as this legendary {item_type} joins your inventory.",
                "The gods themselves seem to take notice as {item_name} appears in your possession. This legendary {item_type} will surely change the course of your destiny.",
                "Time itself seems to pause as {item_name} manifests in your hands. Few adventurers ever witness such a legendary {item_type}."
            ],
            "epic": [
                "A swirl of mystical energy coalesces into {item_name}. This epic {item_type} thrums with power as you add it to your collection.",
                "The earth trembles slightly as {item_name} appears. This epic {item_type} is coveted by heroes throughout the realm.",
                "Stars briefly align overhead as {item_name} comes into your possession. This epic {item_type} marks you as a hero of great renown."
            ],
            "rare": [
                "A soft glow emanates from {item_name} as you discover this rare {item_type} among your possessions.",
                "Fortune smiles upon you as {item_name} becomes yours. This rare {item_type} will serve you well in the adventures to come.",
                "Your companions look on with envy as {item_name} finds its way to you. This rare {item_type} is not easily obtained."
            ],
            "uncommon": [
                "You've acquired {item_name}, an uncommon {item_type} that stands out from ordinary equipment.",
                "Through skill and perseverance, {item_name} is now yours. This uncommon {item_type} will prove useful in your journey.",
                "A stroke of luck brings {item_name} into your inventory. This uncommon {item_type} is a welcome addition to your arsenal."
            ],
            "common": [
                "You've obtained {item_name}, a reliable {item_type} for your adventures.",
                "{item_name} is now yours. Though a common {item_type}, it will serve its purpose well.",
                "You add {item_name} to your inventory. This {item_type} may be common, but every hero needs reliable equipment."
            ]
        }
        
        # Get templates for the item's rarity, falling back to common if the rarity isn't recognized
        rarity_templates = templates.get(rarity, templates["common"])
        
        # Choose a random template and format it
        template = random.choice(rarity_templates)
        description = template.format(item_name=item_name, item_type=item_type)
        
        # Generate stats description
        stats = nft_data.get("stats", {})
        if stats:
            stats_desc = "\n\nItem properties:"
            for stat_name, stat_value in stats.items():
                formatted_name = stat_name.replace("_", " ").title()
                stats_desc += f"\n• {formatted_name}: {stat_value}"
            description += stats_desc
        
        # Add marketplace information
        marketplace = CONFIG["rewards"]["marketplace"]
        description += f"\n\nThis item has been recorded as an NFT on the {CONFIG['rewards']['blockchain']} blockchain and can be traded on {marketplace}."
        
        return description
    
    async def generate_quest(self, difficulty: str = "medium", theme: str = None) -> Dict:
        """Generate a new quest for the player"""
        try:
            # Get current game state for context
            state_dict = self.game_state.to_dict()
            
            # Extract narrative history for context
            narrative_context = "Recent events:\n"
            for entry in state_dict.get("narrative_history", [])[-3:]:
                narrative_context += f"- {entry.get('text', '')}\n"
            
            # Prepare prompt
            prompt = f"""
            # Current Game State
            
            Environment: {state_dict.get("environment_description", "A fantasy setting")}
            
            ## Recent Narrative History
            {narrative_context}
            
            ## Existing Quests
            {self._format_quests(state_dict.get("quest_log", []))}
            
            # Task
            As a Dungeon Master, create a new quest for the players. This quest should:
            
            1. Have a clear objective
            2. Be appropriate for a {difficulty} difficulty level
            3. Fit naturally into the current narrative
            4. Include a hook to motivate players
            5. Have a reward that feels appropriate
            {f"6. Incorporate the theme of: {theme}" if theme else ""}
            
            Provide:
            1. A quest title (short and evocative)
            2. A quest description (1-2 paragraphs)
            
            Format your response as:
            TITLE: [Quest title]
            
            DESCRIPTION: [Quest description]
            
            Then add 1-2 sentences as a Dungeon Master introducing this quest to the players.
            """
            
            # Get response from LLM
            response = await self._get_dm_response(prompt)
            
            # Parse the response
            title_match = re.search(r"TITLE:\s*(.+?)(?:\n|$)", response)
            desc_match = re.search(r"DESCRIPTION:\s*(.+?)(?:\n\n|$)", response, re.DOTALL)
            
            if title_match and desc_match:
                title = title_match.group(1).strip()
                description = desc_match.group(1).strip()
                
                # Extract the DM introduction (anything after the description)
                intro_match = re.search(r"DESCRIPTION:.+?\n\n(.+)$", response, re.DOTALL)
                introduction = intro_match.group(1).strip() if intro_match else "A new quest awaits you!"
                
                # Add quest to game state
                self.game_state.add_quest(title, description, difficulty)
                
                return {
                    "success": True,
                    "title": title,
                    "description": description,
                    "difficulty": difficulty,
                    "introduction": introduction
                }
            else:
                # Fallback if parsing fails
                return {
                    "success": False,
                    "error": "Failed to parse quest details",
                    "raw_response": response
                }
            
        except Exception as e:
            print(f"Error generating quest: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _format_characters(self, characters: List, positions: Dict) -> str:
        """Format character information for the prompt"""
        if not characters:
            return "No characters present"
        
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
            context = roll.get("context", "")
            context_text = f" for {context}" if context else ""
            result.append(f"- {roll_type}: {roll_result}{context_text}")
        
        return "\n".join(result)
    
    def _format_quests(self, quests: List) -> str:
        """Format quest information for the prompt"""
        if not quests:
            return "No active quests"
        
        result = []
        for quest in quests:
            if not quest.get("completed", False):
                title = quest.get("title", "Unknown quest")
                result.append(f"- {title}")
        
        if not result:
            return "No active quests"
        
        return "\n".join(result)
    
    async def generate_adventure_start(self) -> Dict:
        """Generate an initial adventure scene to begin the game"""
        try:
            # Prepare prompt
            prompt = """
            # Task
            Generate an engaging opening scene for a D&D adventure. This should:
            
            1. Set the scene with vivid description of the starting location
            2. Introduce a compelling hook or quest
            3. Present an immediate situation for the player to respond to
            4. Create a sense of adventure and possibility
            
            The opening should be approximately 3-4 paragraphs long and end with a prompt for the player's first action.
            Make this opening exciting and immersive, drawing the player into the world.
            """
            
            # Get response from LLM
            adventure_start = await self._get_dm_response(prompt)
            
            # Extract potential environment description
            # Typically the first paragraph describes the setting
            paragraphs = adventure_start.split("\n\n")
            if paragraphs:
                environment = paragraphs[0]
                self.game_state.update_environment(environment)
            
            # Update game state with new narration
            self.game_state.add_narrative(adventure_start)
            
            # Generate a starter map based on the narrative
            map_data = await self.generate_dynamic_map(adventure_start)
            
            # Generate a starter quest
            quest_data = await self.generate_quest(difficulty="easy")
            
            return {
                "success": True,
                "content": adventure_start,
                "map_data": map_data.get("map", {}),
                "quest_data": quest_data if quest_data.get("success", False) else None
            }
            
        except Exception as e:
            print(f"Error generating adventure start: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": "As you gather your party and prepare for adventure, the Dungeon Master unfolds a map before you. 'Welcome, brave adventurers,' they say with a gleam in their eye. 'What would you like to do first?'"
            }

    async def handle_combat_action(self, character_id: str, target_id: str, action_type: str) -> Dict:
        """Handle a combat action like attacking"""
        try:
            # Get character info
            character_info = None
            for char in self.game_state.characters:
                if char.get("id") == character_id:
                    character_info = char
                    break
            
            if not character_info:
                return {
                    "success": False,
                    "error": "Character not found"
                }
            
            # Get target info
            target_info = None
            for entity in self.game_state.characters + self.game_state.monsters + self.game_state.npcs:
                if entity.get("id") == target_id:
                    target_info = entity
                    break
            
            if not target_info:
                return {
                    "success": False,
                    "error": "Target not found"
                }
            
            # Roll appropriate dice based on action
            roll_result = None
            if action_type == "attack":
                # Roll for attack (d20)
                attack_roll = await self.roll_dice_with_narration("d20", f"attack roll against {target_info.get('type', 'enemy')}")
                
                # Determine if hit
                hit = attack_roll["roll"]["total"] >= 10  # Simplified; would normally use AC
                
                if hit:
                    # Roll for damage based on weapon
                    weapon_type = character_info.get("weapon", "simple")
                    damage_dice = "d6"  # Default
                    if weapon_type == "simple":
                        damage_dice = "d6"
                    elif weapon_type == "martial":
                        damage_dice = "d8"
                    elif weapon_type == "magical":
                        damage_dice = "d10"
                    
                    damage_roll = await self.roll_dice_with_narration(damage_dice, f"damage to {target_info.get('type', 'enemy')}")
                    
                    # Prepare combat narrative prompt
                    prompt = f"""
                    # Combat Information
                    
                    Attacker: {character_info.get('type', 'Character')}
                    Target: {target_info.get('type', 'Enemy')}
                    Attack Roll: {attack_roll["roll"]["total"]} (d20)
                    Damage Roll: {damage_roll["roll"]["total"]} ({damage_dice})
                    
                    # Current Environment
                    {self.game_state.environment_description}
                    
                    # Task
                    As a Dungeon Master, narrate this successful attack in vivid, dramatic detail.
                    Describe:
                    1. How the attack connects
                    2. The impact of the damage
                    3. The target's reaction
                    
                    Keep your description engaging and appropriate to a fantasy combat scene.
                    """
                    
                    # Get narrative from LLM
                    combat_narrative = await self._get_dm_response(prompt)
                    
                    return {
                        "success": True,
                        "hit": True,
                        "attack_roll": attack_roll["roll"]["total"],
                        "damage": damage_roll["roll"]["total"],
                        "narrative": combat_narrative
                    }
                else:
                    # Prepare miss narrative prompt
                    prompt = f"""
                    # Combat Information
                    
                    Attacker: {character_info.get('type', 'Character')}
                    Target: {target_info.get('type', 'Enemy')}
                    Attack Roll: {attack_roll["roll"]["total"]} (d20)
                    Result: Miss
                    
                    # Current Environment
                    {self.game_state.environment_description}
                    
                    # Task
                    As a Dungeon Master, narrate this missed attack in vivid, dramatic detail.
                    Describe:
                    1. How the attack fails to connect
                    2. The target's evasion or defense
                    3. The momentary consequences of the miss
                    
                    Keep your description engaging and appropriate to a fantasy combat scene.
                    """
                    
                    # Get narrative from LLM
                    combat_narrative = await self._get_dm_response(prompt)
                    
                    return {
                        "success": True,
                        "hit": False,
                        "attack_roll": attack_roll["roll"]["total"],
                        "narrative": combat_narrative
                    }
            else:
                return {
                    "success": False,
                    "error": f"Unsupported combat action: {action_type}"
                }
                
        except Exception as e:
            print(f"Error handling combat action: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# For testing
async def test_dungeon_master():
    try:
        dm = DungeonMaster(persona="epic")
        
        # Generate adventure start
        print("Generating adventure start...")
        adventure = await dm.generate_adventure_start()
        print("\nAdventure Start:")
        print(adventure["content"])
        
        # Process user input
        print("\nProcessing user input...")
        response = await dm.process_user_input("I want to explore the area and look for any signs of danger.")
        print("\nDM Response:")
        print(response["content"])
        
        # Roll some dice
        print("\nRolling dice...")
        roll_result = await dm.roll_dice_with_narration("d20", "perception check")
        print("\nDice Roll Narration:")
        print(roll_result["narrative"])
        
        # Generate a quest
        print("\nGenerating quest...")
        quest = await dm.generate_quest(theme="dragons")
        print("\nQuest:")
        print(f"Title: {quest['title']}")
        print(f"Description: {quest['description']}")
        print(f"Introduction: {quest['introduction']}")
        
    except Exception as e:
        print(f"Error in test: {e}")

if __name__ == "__main__":
    # Run the test
    asyncio.run(test_dungeon_master())
