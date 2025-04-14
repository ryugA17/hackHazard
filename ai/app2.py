import os
import time
import cv2
import numpy as np
import mss
import groq
import threading
import tempfile
from gtts import gTTS
from pygame import mixer
import requests
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
import keyboard

# Load environment variables
load_dotenv()

# Initialize Groq client
client = groq.Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Initialize pygame mixer for audio playback
mixer.init()

# Define the screen capture area (adjust as needed for your game window)
monitor = {"top": 0, "left": 0, "width": 800, "height": 600}

# Game state tracking
last_frame = None
last_narration_time = 0
narration_cooldown = 5  # seconds between narrations
currently_speaking = False
game_state = {
    "location": "unknown",
    "character_position": "unknown",
    "nearby_npcs": [],
    "nearby_pokemon": None,
    "in_battle": False,
    "in_menu": False,
    "in_conversation": False,
    "health_status": "unknown",
    "team": [],
    "current_objective": "Start your journey",
    "badges": 0,
    "last_event": "",
    "player_input": "",
}

# Conversation history to maintain context
conversation_history = []
MAX_HISTORY_LENGTH = 5  # Keep last 5 interactions

def capture_screen():
    """Capture the current game screen"""
    with mss.mss() as sct:
        screenshot = np.array(sct.grab(monitor))
        return cv2.cvtColor(screenshot, cv2.COLOR_BGRA2RGB)

def add_to_conversation_history(message, sender):
    """Add a message to the conversation history"""
    global conversation_history
    conversation_history.append({"role": sender, "content": message})
    # Limit history length
    if len(conversation_history) > MAX_HISTORY_LENGTH:
        conversation_history = conversation_history[-MAX_HISTORY_LENGTH:]

def analyze_with_llm(image):
    """Send image to LLM for analysis with improved context"""
    try:
        # Create a more detailed prompt with game context
        prompt = f"""
        You are a real-time gaming assistant for Pokémon Fire Red with expertise in the game.
        
        Current game state:
        - Location: {game_state["location"]}
        - Current objective: {game_state["current_objective"]}
        - In battle: {game_state["in_battle"]}
        - In menu: {game_state["in_menu"]}
        - In conversation: {game_state["in_conversation"]}
        - Pokémon team: {", ".join(game_state["team"]) if game_state["team"] else "Unknown"}
        - Badges: {game_state["badges"]}
        - Last event: {game_state["last_event"]}
        - Player's last input: {game_state["player_input"]}
        
        First, analyze the current situation based on the information above.
        Then, provide 1-2 specific and actionable instructions for what the player should do next.
        Be direct and precise - tell the player exactly which buttons to press or actions to take.
        
        If in battle, give specific battle tactics based on the opponent.
        If exploring, give clear navigation directions.
        If in a conversation, advise on dialogue choices.
        
        End your response with a clear, concise instruction like "Press A to talk to the Professor" or "Use Ember on Oddish".
        """
        
        # Create messages with conversation history for better context
        messages = [
            {"role": "system", "content": "You are a helpful Pokémon Fire Red gaming assistant that gives clear, specific instructions."}
        ]
        
        # Add conversation history
        for entry in conversation_history:
            messages.append(entry)
        
        # Add current prompt
        messages.append({"role": "user", "content": prompt})
        
        # Call Groq API with context
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300
        )
        
        # Extract the response text
        analysis = response.choices[0].message.content
        
        # Add to conversation history
        add_to_conversation_history(prompt, "user")
        add_to_conversation_history(analysis, "assistant")
        
        # Update game state
        update_game_state(analysis)
        
        return analysis
    
    except Exception as e:
        print(f"Error with LLM API: {e}")
        return "I can't analyze the game right now. Please check your connection or API key."

def update_game_state(analysis_text):
    """Update the game state based on LLM analysis with improved detection"""
    global game_state
    
    # Battle detection
    battle_keywords = ["battle", "fight", "opponent", "wild", "trainer", "attack", "move", "hp"]
    battle_score = sum(1 for word in battle_keywords if word in analysis_text.lower())
    game_state["in_battle"] = battle_score >= 2
        
    # Menu detection
    menu_keywords = ["menu", "inventory", "bag", "items", "pokemon", "summary", "save"]
    menu_score = sum(1 for word in menu_keywords if word in analysis_text.lower())
    game_state["in_menu"] = menu_score >= 2
        
    # Conversation detection
    conversation_keywords = ["talking", "conversation", "dialog", "npc", "professor", "says", "ask", "reply"]
    conversation_score = sum(1 for word in conversation_keywords if word in analysis_text.lower())
    game_state["in_conversation"] = conversation_score >= 2
        
    # Location detection
    location_keywords = ["town", "city", "route", "cave", "forest", "gym", "center", "mart", "house", "lab"]
    for keyword in location_keywords:
        if keyword in analysis_text.lower():
            sentences = analysis_text.split('.')
            for sentence in sentences:
                if keyword in sentence.lower():
                    # Extract location from sentence
                    possible_location = sentence.strip()
                    if 10 < len(possible_location) < 100:  # Reasonable length for a location description
                        game_state["location"] = possible_location
                        break
    
    # Pokémon team detection
    pokemon_names = ["bulbasaur", "charmander", "squirtle", "pikachu", "pidgey", "rattata", "caterpie", 
                    "weedle", "metapod", "kakuna", "spearow", "ekans", "sandshrew", "nidoran"]
    for pokemon in pokemon_names:
        if pokemon in analysis_text.lower() and pokemon not in game_state["team"]:
            game_state["team"].append(pokemon)

    # Badge detection
    if "badge" in analysis_text.lower():
        for i in range(1, 9):
            if f"{i} badge" in analysis_text.lower() or f"{i}th badge" in analysis_text.lower():
                game_state["badges"] = max(game_state["badges"], i)
    
    # Objective detection
    objective_indicators = ["need to", "should", "objective", "goal", "task", "quest", "next"]
    for indicator in objective_indicators:
        if indicator in analysis_text.lower():
            sentences = analysis_text.split('.')
            for sentence in sentences:
                if indicator in sentence.lower() and "you" in sentence.lower():
                    # This sentence might contain an objective
                    potential_objective = sentence.strip()
                    if 15 < len(potential_objective) < 100:  # Reasonable length for an objective
                        game_state["current_objective"] = potential_objective
                        break

def speak_text(text):
    """Convert text to speech and play it"""
    global currently_speaking
    
    if currently_speaking:
        return
    
    currently_speaking = True
    
    try:
        # Generate speech
        tts = gTTS(text=text, lang='en', slow=False)
        
        # Use tempfile to create a temporary file with proper permissions
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
            temp_filename = temp_file.name
            
        # Save to the temporary file
        tts.save(temp_filename)
        
        # Play the audio
        mixer.music.load(temp_filename)
        mixer.music.play()
        
        # Wait for audio to finish
        while mixer.music.get_busy():
            time.sleep(0.1)
        
        # Clean up
        try:
            os.remove(temp_filename)
        except:
            pass  # Ignore errors during cleanup
        
    except Exception as e:
        print(f"TTS error: {e}")
    
    finally:
        currently_speaking = False

def detect_significant_change(current_frame, threshold=0.15):
    """Detect if there's a significant change in the game screen"""
    global last_frame
    
    if last_frame is None:
        last_frame = current_frame
        return True
    
    # Resize for faster comparison
    current_small = cv2.resize(current_frame, (160, 120))
    last_small = cv2.resize(last_frame, (160, 120))
    
    # Convert to grayscale
    current_gray = cv2.cvtColor(current_small, cv2.COLOR_RGB2GRAY)
    last_gray = cv2.cvtColor(last_small, cv2.COLOR_RGB2GRAY)
    
    # Calculate difference
    diff = cv2.absdiff(current_gray, last_gray)
    
    # Calculate percentage of change
    change_percentage = np.sum(diff > 30) / (diff.shape[0] * diff.shape[1])
    
    if change_percentage > threshold:
        last_frame = current_frame
        return True
    
    return False

def extract_important_info(analysis):
    """Extract the most important information from the LLM analysis"""
    # Split into paragraphs
    paragraphs = analysis.split('\n')
    
    # Remove empty paragraphs
    paragraphs = [p for p in paragraphs if p.strip()]
    
    # Look for clear instructions (often at the end)
    instructions = ""
    for p in paragraphs:
        if ("press" in p.lower() or "use" in p.lower() or "go" in p.lower() or 
            "move" in p.lower() or "select" in p.lower() or "talk" in p.lower()):
            instructions = p
            break
    
    # If no specific instructions found, use the last paragraph
    if not instructions and paragraphs:
        instructions = paragraphs[-1]
    
    # Get situation description (usually first paragraph)
    description = paragraphs[0] if paragraphs else ""
    
    # Combine for narration
    narration = description
    if instructions and instructions != description:
        narration += " " + instructions
    
    return narration

def keyboard_listener():
    """Listen for keyboard input to update game state manually"""
    global game_state
    
    # Define hotkeys for manual game state updates
    keyboard.add_hotkey('b', lambda: set_game_state("in_battle", True))
    keyboard.add_hotkey('n', lambda: set_game_state("in_battle", False))
    keyboard.add_hotkey('m', lambda: set_game_state("in_menu", not game_state["in_menu"]))
    keyboard.add_hotkey('c', lambda: set_game_state("in_conversation", not game_state["in_conversation"]))
    keyboard.add_hotkey('l', lambda: input_location())
    keyboard.add_hotkey('t', lambda: input_team())
    keyboard.add_hotkey('o', lambda: input_objective())
    keyboard.add_hotkey('i', lambda: input_event())
    keyboard.add_hotkey('p', lambda: print_game_state())
    
    print("\nKeyboard shortcuts:")
    print("b - Set battle state to True")
    print("n - Set battle state to False")
    print("m - Toggle menu state")
    print("c - Toggle conversation state")
    print("l - Input current location")
    print("t - Update Pokémon team")
    print("o - Update current objective")
    print("i - Input recent event")
    print("p - Print current game state")

def set_game_state(key, value):
    """Update a game state value"""
    global game_state
    game_state[key] = value
    print(f"Updated {key} to {value}")

def input_location():
    """Get location input from user"""
    location = input("Enter current location: ")
    set_game_state("location", location)

def input_team():
    """Get team input from user"""
    team = input("Enter Pokémon team (comma separated): ")
    if team:
        set_game_state("team", [p.strip() for p in team.split(",")])

def input_objective():
    """Get objective input from user"""
    objective = input("Enter current objective: ")
    set_game_state("current_objective", objective)

def input_event():
    """Get recent event input from user"""
    event = input("Enter recent event: ")
    set_game_state("last_event", event)

def print_game_state():
    """Print the current game state"""
    print("\nCurrent Game State:")
    for key, value in game_state.items():
        print(f"{key}: {value}")

def main():
    """Main function to run the Pokemon Fire Red assistant"""
    global last_narration_time
    
    print("Starting Pokemon Fire Red Assistant...")
    print("Make sure your game window is visible and properly positioned.")
    
    # Start keyboard listener in a separate thread
    threading.Thread(target=keyboard_listener, daemon=True).start()
    
    print("Press Ctrl+C to exit.")
    
    try:
        while True:
            # Capture the current game screen
            current_frame = capture_screen()
            
            current_time = time.time()
            time_since_last = current_time - last_narration_time
            
            # Check if we should analyze the frame
            if (time_since_last > narration_cooldown and 
                not currently_speaking and 
                detect_significant_change(current_frame)):
                
                # Analyze the frame with LLM
                analysis = analyze_with_llm(current_frame)
                
                # Extract important information
                narration = extract_important_info(analysis)
                
                # Speak the narration in a separate thread
                threading.Thread(target=speak_text, args=(narration,)).start()
                
                # Update last narration time
                last_narration_time = current_time
                
                # Print the analysis for debugging
                print("\n" + "="*50)
                print("ANALYSIS:")
                print(analysis)
                print("="*50 + "\n")
            
            # Sleep to reduce CPU usage
            time.sleep(0.5)
    
    except KeyboardInterrupt:
        print("\nExiting Pokemon Fire Red Assistant...")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()