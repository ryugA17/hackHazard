import asyncio
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from generate_map import generate_map

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Store active connections
active_connections = {}

@app.websocket("/ws/dnd/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    print(f"Client connected: {session_id}")

    # Store the connection
    active_connections[session_id] = websocket

    try:
        # Send initial welcome message
        await websocket.send_json({
            "type": "narration",
            "content": "Welcome to the D&D Game! Select a map theme to begin your adventure.",
            "timestamp": time.time()
        })

        # Main game loop
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received message: {message}")

            message_type = message.get("type", "")

            if message_type == "generate_map":
                # Handle map generation request
                theme = message.get("theme", "fantasy adventure")
                print(f"Generating map with theme: {theme}")

                try:
                    # Generate a map
                    map_data = generate_map(theme)

                    # Send the map data to the client
                    await websocket.send_json({
                        "type": "map_data",
                        "map_data": map_data,
                        "timestamp": time.time()
                    })

                    # Send a description
                    primary_terrain = list(map_data["terrain_distribution"].keys())[0] if map_data["terrain_distribution"] else "varied"
                    description = f"You find yourself in a {theme} realm. The landscape is dominated by {primary_terrain} terrain. What adventures await you in this mysterious land?"

                    await websocket.send_json({
                        "type": "narration",
                        "content": description,
                        "timestamp": time.time()
                    })

                except Exception as e:
                    print(f"Error generating map: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "content": f"Error generating map: {str(e)}",
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
    uvicorn.run(app, host="0.0.0.0", port=8001)
