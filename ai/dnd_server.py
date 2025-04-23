import asyncio
import json
import os
import time
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dnd_master import DungeonMaster

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Store active connections
active_connections: Dict[str, WebSocket] = {}
# Store DM instances
dm_instances: Dict[str, DungeonMaster] = {}

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
        # Initialize the game window
        await dm.setup_game_window()
        
        # Send initial game state
        initial_state = await dm.get_screen_state()
        initial_narration = await dm.analyze_game_state(initial_state)
        
        await websocket.send_json({
            "type": "narration",
            "content": initial_narration,
            "timestamp": time.time()
        })
        
        # Main game loop
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type", "")
            
            if message_type == "get_state":
                # Get current game state
                state = await dm.get_screen_state()
                
                # Only generate new narration if enough time has passed
                current_time = time.time()
                if current_time - dm.last_narration_time > dm.narration_cooldown:
                    narration = await dm.analyze_game_state(state)
                    
                    await websocket.send_json({
                        "type": "narration",
                        "content": narration,
                        "timestamp": current_time
                    })
            
            elif message_type == "player_action":
                # Handle player action
                action = message.get("action", {})
                
                # Update game state with player action
                dm.game_state.last_action = action
                
                # Execute the action if needed
                await dm.execute_action(action)
                
                # Get updated state and generate narration
                state = await dm.get_screen_state()
                narration = await dm.analyze_game_state(state)
                
                await websocket.send_json({
                    "type": "narration",
                    "content": narration,
                    "timestamp": time.time()
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
                    "timestamp": time.time()
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
            "timestamp": time.time()
        })
        
        # Clean up
        if session_id in active_connections:
            del active_connections[session_id]

@app.get("/")
async def root():
    return {"message": "D&D Dungeon Master API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
