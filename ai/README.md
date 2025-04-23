# DND Dungeon Master AI

This module provides an AI-powered Dungeon Master for a Dungeons & Dragons game. It simulates screen observation and generates appropriate narration and responses as a dungeon master.

## Features

- Simulated screen observation (can be extended with real screen capture)
- Natural language generation for DM narration
- WebSocket communication with the game frontend
- Dice rolling and game state tracking
- Character and map management

## Installation

1. Make sure you have Python 3.8+ installed
2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

3. Set up your environment variables by creating a `.env` file:

```
GROQ_API_KEY=your_groq_api_key
```

## Usage

1. Start the DND server:

```bash
python dnd_server.py
```

2. In a separate terminal, start the React frontend:

```bash
cd ..
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

4. Select a map and start playing!

## How It Works

The system consists of several components:

1. **DungeonMaster Class**: Handles the core DM functionality, including simulating game state observation, generating narration, and responding to player actions.

2. **WebSocket Server**: Facilitates communication between the frontend and the AI dungeon master.

3. **Screen Observation Simulation**: Currently simulates screen observation, but can be extended with real screen capture using libraries like pyautogui.

4. **LLM Integration**: Uses the Groq API to generate contextually appropriate DM responses.

## Troubleshooting

- If the WebSocket connection fails, check that the server is running and the port is not blocked.
- If the AI responses are not appropriate, check your Groq API key and ensure the prompts are correctly formatted.
- If you want to implement real screen capture, you'll need to modify the `get_screen_state` method in the `DungeonMaster` class.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
