import cv2
import numpy as np
import time
from PIL import Image
from groq import Groq
import asyncio
from collections import deque
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect
from terminator import Terminator, By, until, Element

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

CONFIG = {
    "model": "llama-3.3-70b-versatile",
    "game_window_title": "VisualBoyAdvance",  # or your emulator window title
    "input_delay": 0.1,  # seconds between inputs
    "sampling_rate": 5,
}

class GameController:
    def __init__(self):
        self.terminator = Terminator()
        self.window = None
        
    async def setup_game_window(self):
        """Find and focus the game window"""
        try:
            # Wait for the game window to appear
            self.window = await self.terminator.wait_for_element(
                By.WINDOW_TITLE,
                CONFIG["game_window_title"],
                timeout=5000
            )
            await self.window.focus()
            return self.window
        except Exception as e:
            print(f"Failed to find game window: {e}")
            return None
            
    async def press_key(self, key: str, hold_time: float = 0.1):
        """Send a keyboard input to the game with configurable hold time"""
        try:
            if not self.window:
                await self.setup_game_window()
                
            # Map common game actions to keyboard keys
            key_map = {
                "up": "w",
                "down": "s",
                "left": "a",
                "right": "d",
                "a": "z",  # Common mapping for GBA emulators
                "b": "x",
                "start": "enter",
                "select": "backspace"
            }
            
            actual_key = key_map.get(key.lower(), key)
            
            await self.window.type_key(actual_key, hold_time)
            await asyncio.sleep(CONFIG["input_delay"])
            
        except Exception as e:
            print(f"Failed to send key {key}: {e}")
            
    async def get_game_text(self) -> str:
        """Extract text from the game window"""
        try:
            if not self.window:
                await self.setup_game_window()
                
            # Get text from the game window
            text = await self.window.get_text()
            return text
            
        except Exception as e:
            print(f"Failed to get game text: {e}")
            return ""
            
    async def get_screen_state(self):
        """Capture the current game state including visuals and text"""
        try:
            if not self.window:
                await self.setup_game_window()
                
            # Capture window content
            screenshot = await self.window.screenshot()
            
            # Get any visible text
            text = await self.get_game_text()
            
            return {
                "screenshot": screenshot,
                "text": text,
                "window_title": await self.window.get_title(),
                "is_focused": await self.window.is_focused()
            }
            
        except Exception as e:
            print(f"Failed to capture game state: {e}")
            return None

class PokemonGameAssistant:
    def __init__(self):
        self.controller = GameController()
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        
    async def analyze_game_state(self, state):
        """Analyze the current game state using LLM"""
        if not state:
            return "Unable to capture game state"
            
        # Prepare context for LLM
        prompt = f"""
        You are analyzing a Pokemon Fire Red game state.
        Current game text: {state['text']}
        Window title: {state['window_title']}
        Window focused: {state['is_focused']}
        
        Based on this information, provide:
        1. Current situation
        2. Recommended action
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a Pokemon game assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"LLM analysis failed: {e}")
            return "Failed to analyze game state"
            
    async def execute_action(self, action_description: str):
        """Execute recommended actions"""
        # Map common action descriptions to key sequences
        action_patterns = {
            "move forward": ["up"],
            "move back": ["down"],
            "move left": ["left"],
            "move right": ["right"],
            "talk": ["a"],
            "select": ["a"],
            "cancel": ["b"],
            "open menu": ["start"],
        }
        
        for pattern, keys in action_patterns.items():
            if pattern in action_description.lower():
                for key in keys:
                    await self.controller.press_key(key)
                break

@app.websocket("/ws/game")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        assistant = PokemonGameAssistant()
        
        while True:
            try:
                # Get current game state
                state = await assistant.controller.get_screen_state()
                
                # Analyze state and get recommendations
                analysis = await assistant.analyze_game_state(state)
                
                # Send analysis to client
                await websocket.send_json({
                    "analysis": analysis,
                    "timestamp": time.time()
                })
                
                # Execute any recommended actions
                await assistant.execute_action(analysis)
                
                await asyncio.sleep(1)  # Rate limiting
                
            except WebSocketDisconnect:
                print("Client disconnected")
                break
            except Exception as e:
                print(f"Error in game loop: {e}")
                await websocket.send_json({"error": str(e)})
                
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
