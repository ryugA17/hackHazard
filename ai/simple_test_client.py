import asyncio
import json
import websockets

async def test_dnd_client():
    """Test client for the DnD Dungeon Master WebSocket server"""
    uri = "ws://localhost:8002/ws/dnd/test-session"
    
    async with websockets.connect(uri) as websocket:
        print("Connected to DnD Dungeon Master server")
        
        # Receive initial narration
        response = await websocket.recv()
        data = json.loads(response)
        print(f"\nInitial narration: {data['content']}")
        
        # Send a user input message
        await websocket.send(json.dumps({
            "type": "user_input",
            "content": "I want to explore the forest ahead."
        }))
        
        # Receive response
        response = await websocket.recv()
        data = json.loads(response)
        print(f"\nDM response: {data['content']}")
        
        # Roll a dice
        await websocket.send(json.dumps({
            "type": "roll_dice",
            "dice_type": "d20",
            "result": 15
        }))
        
        # Receive response
        response = await websocket.recv()
        data = json.loads(response)
        print(f"\nDice roll narration: {data['content']}")
        
        # Request AI to take control and start an adventure
        await websocket.send(json.dumps({
            "type": "ai_control",
            "data": {
                "enabled": True
            }
        }))
        
        # Receive response
        response = await websocket.recv()
        data = json.loads(response)
        print(f"\nAdventure start: {data['content']}")

if __name__ == "__main__":
    asyncio.run(test_dnd_client())
