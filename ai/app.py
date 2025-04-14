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
}

def capture_screen():
    """Capture the current game screen"""
    with mss.mss() as sct:
        screenshot = np.array(sct.grab(monitor))
        return cv2.cvtColor(screenshot, cv2.COLOR_BGRA2RGB)

def analyze_with_llm(image):
    """Send image to LLM for analysis"""
    # Text-only analysis approach since Groq doesn't support image inputs
    try:
        # Create prompt for the LLM
        prompt = f"""
        You are an AI assistant helping someone play Pokémon Fire Red.
        
        Current game state context: {game_state}
        
        Based on this information, provide:
        1. A brief assessment of the current game situation (1-2 sentences)
        2. Recommended actions the player should take (1-2 specific suggestions)
        
        Keep responses concise and focused on gameplay.
        """
        
        # Call Groq API with text-only prompt
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Choose appropriate Groq model
            messages=[
                {"role": "system", "content": "You are a helpful gaming assistant for Pokémon Fire Red."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300
        )
        
        # Extract the response text
        analysis = response.choices[0].message.content
        update_game_state(analysis)
        return analysis
    
    except Exception as e:
        print(f"Error with LLM API: {e}")
        return "I can't analyze the game right now. Please check your connection or API key."

def update_game_state(analysis_text):
    """Update the game state based on LLM analysis"""
    global game_state
    
    # Simple keyword-based state detection
    if "battle" in analysis_text.lower():
        game_state["in_battle"] = True
    else:
        game_state["in_battle"] = False
        
    if "menu" in analysis_text.lower():
        game_state["in_menu"] = True
    else:
        game_state["in_menu"] = False
        
    if "talking" in analysis_text.lower() or "conversation" in analysis_text.lower():
        game_state["in_conversation"] = True
    else:
        game_state["in_conversation"] = False
        
    # Try to extract location information
    location_keywords = ["town", "city", "route", "cave", "forest", "gym", "center", "mart"]
    for keyword in location_keywords:
        if keyword in analysis_text.lower():
            # Find the sentence containing the keyword
            sentences = analysis_text.split('.')
            for sentence in sentences:
                if keyword in sentence.lower():
                    game_state["location"] = sentence.strip()
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
        # This avoids permission issues by using the system's temp directory
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
    
    # Extract description and recommendation
    description = ""
    recommendation = ""
    
    for p in paragraphs:
        if "recommend" in p.lower() or "should" in p.lower() or "could" in p.lower():
            recommendation = p
        elif description == "" and len(p) > 15:  # Take first substantial paragraph as description
            description = p
    
    # If no specific recommendation found, use last paragraph
    if not recommendation and len(paragraphs) > 1:
        recommendation = paragraphs[-1]
    
    # Combine for narration
    narration = description
    if recommendation and recommendation != description:
        narration += " " + recommendation
    
    return narration

def main():
    """Main function to run the Pokemon Fire Red assistant"""
    global last_narration_time
    
    print("Starting Pokemon Fire Red Assistant...")
    print("Make sure your game window is visible and properly positioned.")
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