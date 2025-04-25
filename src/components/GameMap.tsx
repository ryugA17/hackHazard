import { Link } from 'react-router-dom';
import React from 'react';
import { DungeonMasterContext } from '../context/DungeonMasterContext';
import boyAvatar from '../assets/avatars/boy.gif';
import girlAvatar from '../assets/avatars/girl.gif';
import robotAvatar from '../assets/avatars/robot.gif';
import foxboyAvatar from '../assets/avatars/foxboy.gif';
import foxgirlAvatar from '../assets/avatars/foxgirl.gif';
import backgroundMusic from '../assets/aizentheme.mp3';
import DungeonChat from './DungeonChat';
import './GameMap.css';

const {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} = React;

// Utility functions
const getObstacles = () => {
  // Implementation of getObstacles
  return [];
};

const getTerrainMap = () => {
  // Implementation of getTerrainMap
  return {};
};

// Define map options
interface MapOption {
  id: string;
  name: string;
  image: string;
  description: string;
  gridSize: {
    width: number;
    height: number;
  };
  cellSize: number;
  terrainDistribution?: Record<string, number>;
}

// Define types
interface Piece {
  id: string;
  x: number;
  y: number;
  avatar: string;
  label: string;
  isDragging: boolean;
}

type TerrainType = "grass" | "water" | "mountain" | "forest" | "swamp" | "desert" | "cave";

interface Cell {
  type: "fog" | "revealed";
  terrain: TerrainType;
  isObstacle?: boolean;
  x: number;
  y: number;
}

// Constants
const VISION_RANGE = 2;
const MAX_PLAYERS = 5; // Set maximum number of players/tokens

// Obstacle terrain types
const OBSTACLE_TERRAINS: TerrainType[] = ["water", "mountain"];

// Sample character pieces with different avatars
const CHARACTER_AVATARS = [
  boyAvatar,
  girlAvatar,
  robotAvatar,
  foxboyAvatar,
  foxgirlAvatar,
];

const CHARACTER_LABELS = [
  "Boy",
  "Girl",
  "Robot",
  "Fox Boy",
  "Fox Girl"
];

// Default map configuration while waiting for a generated map
const DEFAULT_MAP: MapOption = {
  id: 'loading',
  name: 'Loading Adventure Map...',
  image: '',
  description: 'The Dungeon Master is creating your adventure map...',
  gridSize: { width: 8, height: 6 },
  cellSize: 80
};

// Helper function to create a placeholder empty map
const createEmptyMap = (gridWidth: number, gridHeight: number): Cell[][] => {
  return Array.from({ length: gridHeight }, (_, y) =>
    Array.from({ length: gridWidth }, (_, x) => {
      return {
        type: "revealed",
        terrain: "grass",
        isObstacle: false,
        x,
        y
      };
    })
  );
};

// Convert server-generated map data to our map format
const convertMapDataToGrid = (mapData: any): Cell[][] => {
  if (!mapData || !mapData.grid || !Array.isArray(mapData.grid)) {
    console.error("Invalid map data received:", mapData);
    return createEmptyMap(8, 6);
  }

  return mapData.grid.map((row: any[], y: number) =>
    row.map((cell: any, x: number) => ({
      type: cell.type || "revealed",
      terrain: cell.terrain || "grass",
      isObstacle: cell.is_obstacle || false,
      x,
      y
    }))
  );
};

// Main component
const GameMap: React.FC = () => {
  const { issueReward } = React.useContext(DungeonMasterContext);
  const [showRewardModal, setShowRewardModal] = React.useState(false);
  const [currentReward, setCurrentReward] = React.useState<string>('');
  const [availableMaps, setAvailableMaps] = useState<MapOption[]>([]);
  const [selectedMap, setSelectedMap] = React.useState<MapOption>(DEFAULT_MAP);
  const [map, setMap] = React.useState<Cell[][]>(() => createEmptyMap(
    DEFAULT_MAP.gridSize.width,
    DEFAULT_MAP.gridSize.height
  ));
  const [pieces, setPieces] = React.useState<Piece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = React.useState<string | null>(null);
  const [draggingPiece, setDraggingPiece] = React.useState<Piece | null>(null);
  const [nextPieceId, setNextPieceId] = React.useState(1);
  const [wsConnection, setWsConnection] = React.useState<WebSocket | null>(null);
  const [narration, setNarration] = React.useState<string>("");
  const [loadingMap, setLoadingMap] = useState(true);

  // Define playSoundEffect function before using it in useEffect
  // Play sound effect
  const playSoundEffect = useCallback((soundUrl: string) => {
    if (!soundEffectRef.current) return;

    // Check if sound is enabled
    const soundEnabled = document.getElementById('sound-enabled') as HTMLInputElement;
    if (soundEnabled && !soundEnabled.checked) return;

    console.log('Playing sound effect:', soundUrl);

    // Set the source and play the sound
    soundEffectRef.current.src = `http://localhost:8001${soundUrl}`;
    soundEffectRef.current.play().catch((error: Error) => {
      console.error('Error playing sound effect:', error);
    });
  }, []);

  useEffect(() => {
    // Create a unique session ID for this game session
    const sessionId = `session-${Date.now()}`;
    console.log('Connecting to WebSocket server with session ID:', sessionId);
    const ws = new WebSocket(`ws://localhost:8001/ws/dnd/${sessionId}`);

    ws.onopen = () => {
      console.log('Connected to DND Dungeon Master server');
      setWsConnection(ws);

      // Enable AI control
      ws.send(JSON.stringify({
        type: 'ai_control',
        data: {
          enabled: true
        }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'narration') {
        // Update the narration panel
        setNarration(data.content);

        // Also add to chat history if AI is controlling the game
        // We'll check the current state inside the message handler
        const isAiControlled = document.querySelector('.chat-panel') !== null;
        if (isAiControlled) {
          setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [...prev, { role: 'dm', content: data.content }]);
        }
      } else if (data.type === 'map_data') {
        console.log("Received map data:", data);

        // The map data could be in data.map_data or directly in data
        const mapData = data.map_data || data;

        console.log("Extracted map data:", mapData);

        if (!mapData || !mapData.grid) {
          console.error("Invalid map data received:", mapData);
          return;
        }

        // Create a new map option from the received data
        const newMap: MapOption = {
          id: mapData.id || `map-${Date.now()}`,
          name: mapData.name || "Adventure Map",
          description: mapData.description || "A mysterious realm awaits",
          image: '',
          gridSize: {
            width: mapData.width || (mapData.grid && mapData.grid[0] ? mapData.grid[0].length : 8),
            height: mapData.height || (mapData.grid ? mapData.grid.length : 6)
          },
          cellSize: 80,
          terrainDistribution: mapData.terrain_distribution || {}
        };

        console.log("Created map option:", newMap);

        // Convert the map grid data
        const newGrid = convertMapDataToGrid(mapData);

        console.log("Converted grid:", newGrid);

        // Update state with new map
        setSelectedMap(newMap);
        setMap(newGrid);
        setLoadingMap(false);

        // Add to available maps
        setAvailableMaps((prev: MapOption[]) => {
          // Check if this map already exists (by ID)
          const exists = prev.some((m: MapOption) => m.id === newMap.id);
          if (!exists) {
            return [...prev, newMap];
          }
          return prev;
        });
      } else if (data.type === 'dm_response') {
        // Add DM response to chat history
        setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [...prev, { role: 'dm', content: data.content }]);

        // Check if DM is requesting a dice roll
        if (data.request_dice_roll) {
          setWaitingForDiceRoll(true);
          setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [
            ...prev,
            {
              role: 'dm',
              content: `Please roll a ${data.dice_type || 'd20'} to determine the outcome.`
            }
          ]);
        }
      } else if (data.type === 'chat_message') {
        // Add chat message to chat history
        console.log('Received chat message:', data);
        setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [
          ...prev,
          {
            role: data.sender === 'Player' ? 'user' : 'dm',
            content: data.content
          }
        ]);

        // Check if DM is moving a character
        if (data.move_character) {
          const { character_id, to_x, to_y } = data.move_character;

          // Find the character and move it
          setPieces((prevPieces: Piece[]) => prevPieces.map((piece: Piece) =>
            piece.id === character_id
              ? { ...piece, x: to_x, y: to_y }
              : piece
          ));
        }

        // Check if DM is adding a new character/monster
        if (data.add_character) {
          const { type, x, y, label } = data.add_character;

          // Create a new piece with the specified properties
          const newPiece: Piece = {
            id: `piece-${Date.now()}`,
            x,
            y,
            label: label || type,
            avatar: type === 'monster' ? CHARACTER_AVATARS[0] : CHARACTER_AVATARS[Math.floor(Math.random() * CHARACTER_AVATARS.length)],
            isDragging: false
          };

          // Add the new piece to the map
          setPieces((prevPieces: Piece[]) => [...prevPieces, newPiece]);
        }
      } else if (data.type === 'error') {
        console.error('Error from DM server:', data.content);
        setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [
          ...prev,
          {
            role: 'dm',
            content: `Error: ${data.content}`
          }
        ]);
      } else if (data.type === 'play_sound') {
        // Play the sound effect
        if (data.sound_url) {
          console.log('Received sound effect request:', data.sound_url);
          playSoundEffect(data.sound_url);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from DND Dungeon Master server');
    };

    setWsConnection(ws);

    // Clean up function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const sendGameState = useCallback(() => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      // Create a more detailed game state object
      const detailedGameState = {
        type: 'get_state',
        data: {
          // Map information
          grid_cells: map,
          tokens: pieces.map((piece: Piece) => ({
            ...piece,
            terrain: piece.y < map.length && piece.x < map[0].length
              ? map[piece.y][piece.x].terrain
              : "unknown"
          })),
          obstacles: getObstacles(),
          terrain: getTerrainMap(),
          selected_map: selectedMap.id,

          // Map metadata
          map_data: {
            id: selectedMap.id,
            name: selectedMap.name,
            description: selectedMap.description,
            gridSize: selectedMap.gridSize,
            cellSize: selectedMap.cellSize,
            terrainDistribution: selectedMap.terrainDistribution
          },

          // Game state
          game_state: {
            current_map: selectedMap.id,
            characters: pieces.map((piece: Piece) => ({
              id: piece.id,
              type: piece.label
            })),
            player_positions: pieces.reduce((acc: Record<string, { x: number, y: number }>, piece: Piece) => {
              acc[piece.id] = { x: piece.x, y: piece.y };
              return acc;
            }, {} as Record<string, { x: number, y: number }>),
            in_combat: false, // You could add a combat state to your game
            last_action: null // This will be set by action handlers
          }
        }
      };

      wsConnection.send(JSON.stringify(detailedGameState));
      console.log("Sent detailed game state to DM", detailedGameState);
    }
  }, [map, pieces, wsConnection, selectedMap]);

  // Request a dynamically generated map
  const requestGeneratedMap = useCallback((theme?: string) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      setLoadingMap(true);

      const request = {
        type: 'generate_map',
        theme: theme || 'fantasy adventure',
        content: 'Create a dynamic map for my adventure'
      };

      console.log("Sending map generation request:", request);
      wsConnection.send(JSON.stringify(request));
      console.log("Requested a generated map with theme:", theme || 'fantasy adventure');
    } else {
      console.error("WebSocket not connected. Connection state:", wsConnection ? wsConnection.readyState : "null");
    }
  }, [wsConnection]);

  // State management
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [showMusicError, setShowMusicError] = useState(false);
  const [aiControlled, setAiControlled] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'dm', content: string}>>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const soundEffectRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Create a new piece
  const createNewPiece = useCallback((x: number, y: number): Piece => {
    // Check if we've reached the maximum number of players
    if (pieces.length >= MAX_PLAYERS) {
      alert(`Maximum of ${MAX_PLAYERS} avatars allowed on the map.`);
      return null as unknown as Piece;
    }

    const avatarIndex = nextPieceId % CHARACTER_AVATARS.length;
    const newPiece: Piece = {
      id: `piece-${nextPieceId}`,
      x,
      y,
      avatar: CHARACTER_AVATARS[avatarIndex],
      label: CHARACTER_LABELS[avatarIndex],
      isDragging: false
    };

    setPieces((prevPieces: Piece[]) => [...prevPieces, newPiece]);
    setNextPieceId((prev: number) => prev + 1);
    return newPiece;
  }, [nextPieceId, pieces.length]);

  // Send player action to the DND server
  const sendPlayerAction = useCallback((action: string, details: any) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      // Create the action object
      const actionObject = {
        type: action,
        ...details
      };

      // Send the action to the server
      wsConnection.send(JSON.stringify({
        type: 'player_action',
        action: actionObject
      }));

      console.log("Sent player action to DM", actionObject);

      // After sending an action, also send the updated game state
      // This ensures the DM has the most current information
      setTimeout(() => sendGameState(), 100);
    }
  }, [wsConnection, sendGameState]);

  // Handle cell click to add new piece or move existing piece
  const handleCellClick = useCallback((x: number, y: number): void => {
    // If in placing mode, add a new piece
    if (isPlacingMode) {
      // Check if we've reached the maximum number of players
      if (pieces.length >= MAX_PLAYERS) {
        alert(`Maximum of ${MAX_PLAYERS} avatars allowed on the map.`);
        setIsPlacingMode(false);
        return;
      }

      // Check if the cell is empty and not an obstacle
      if (!pieces.some((piece: Piece) => piece.x === x && piece.y === y) &&
          y < map.length && x < map[0].length && !map[y][x].isObstacle) {
        const newPiece = createNewPiece(x, y);
        setIsPlacingMode(false); // Exit placing mode after placing a piece

        // Notify the DM about the new character
        sendPlayerAction('add_character', {
          character_id: newPiece.id,
          character_type: newPiece.label,
          position: { x, y }
        });
      }
      return;
    }

    // If a piece is already selected, move it
    if (selectedPieceId) {
      // Check if the destination cell is valid (not an obstacle and no other piece)
      if (y < map.length && x < map[0].length &&
          !map[y][x].isObstacle &&
          !pieces.some((p: Piece) => p.x === x && p.y === y)) {

        // Find the selected piece
        const selectedPiece = pieces.find((p: Piece) => p.id === selectedPieceId);

        // Update the piece position
        setPieces((prevPieces: Piece[]) => prevPieces.map((piece: Piece) =>
          piece.id === selectedPieceId
            ? { ...piece, x, y, isDragging: false }
            : piece
        ));

        // Notify the DM about the movement
        if (selectedPiece) {
          sendPlayerAction('move_character', {
            character_id: selectedPieceId,
            character_type: selectedPiece.label,
            from: { x: selectedPiece.x, y: selectedPiece.y },
            to: { x, y }
          });
        }

        setSelectedPieceId(null);
      }
    } else {
      // Check if we clicked on a piece
      const clickedPiece = pieces.find((piece: Piece) => piece.x === x && piece.y === y);

      if (clickedPiece) {
        // Select this piece for movement
        setSelectedPieceId(clickedPiece.id);

        // Notify the DM about the selection
        sendPlayerAction('select_character', {
          character_id: clickedPiece.id,
          character_type: clickedPiece.label,
          position: { x, y }
        });
      }
    }
  }, [isPlacingMode, pieces, selectedPieceId, map, createNewPiece, sendPlayerAction]);

  // Handle piece click
  const handlePieceClick = useCallback((e: React.MouseEvent, piece: Piece): void => {
    e.stopPropagation();

    if (selectedPieceId === piece.id) {
      // Deselect if already selected
      setSelectedPieceId(null);
    } else {
      // Select this piece
      setSelectedPieceId(piece.id);
    }
  }, [selectedPieceId]);

  // Handle piece drag start
  const handlePieceDragStart = useCallback((e: React.MouseEvent, piece: Piece): void => {
    e.stopPropagation();

    // Start dragging this piece
    setPieces((prevPieces: Piece[]) => prevPieces.map((p: Piece) =>
      p.id === piece.id
        ? { ...p, isDragging: true }
        : p
    ));
    setDraggingPiece(piece);
    setSelectedPieceId(piece.id);
  }, []);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: React.MouseEvent): void => {
    if (!draggingPiece || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const offsetX = rect.left + window.scrollX + 10; // Add padding offset
    const offsetY = rect.top + window.scrollY + 10; // Add padding offset

    // Calculate grid position, accounting for gap between cells (4px)
    const cellWithGap = selectedMap.cellSize + 4; // Cell size plus gap
    const x = Math.floor((e.clientX - offsetX) / cellWithGap);
    const y = Math.floor((e.clientY - offsetY) / cellWithGap);

    // Ensure we're within grid bounds and not on an obstacle or other piece
    if (x >= 0 && x < selectedMap.gridSize.width &&
        y >= 0 && y < selectedMap.gridSize.height &&
        y < map.length && x < map[0].length &&
        !map[y][x].isObstacle &&
        !pieces.some((p: Piece) => p.id !== draggingPiece.id && p.x === x && p.y === y)) {
      setPieces((prevPieces: Piece[]) => prevPieces.map((p: Piece) =>
        p.id === draggingPiece.id
          ? { ...p, x, y }
          : p
      ));
    }
  }, [draggingPiece, selectedMap, map, pieces]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback((): void => {
    if (!draggingPiece) return;

    setPieces((prevPieces: Piece[]) => prevPieces.map((p: Piece) =>
      p.id === draggingPiece.id
        ? { ...p, isDragging: false }
        : p
    ));
    setDraggingPiece(null);
  }, [draggingPiece]);

  // Add global event handlers for mouse movement outside the grid
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingPiece) {
        const customEvent = e as unknown as React.MouseEvent;
        handleMouseMove(customEvent);
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggingPiece) {
        handleMouseUp();
      }
    };

    // Add the event listeners
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    // Clean up the event listeners when component unmounts
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingPiece, handleMouseMove, handleMouseUp]);

  // Handle piece deletion
  const handleDeletePiece = useCallback((e: React.MouseEvent, piece: Piece): void => {
    e.stopPropagation();
    setPieces((prevPieces: Piece[]) => prevPieces.filter((p: Piece) => p.id !== piece.id));

    // Notify the DM about the character removal
    sendPlayerAction('remove_character', {
      character_id: piece.id,
      character_type: piece.label,
      position: { x: piece.x, y: piece.y }
    });

    if (selectedPieceId === piece.id) {
      setSelectedPieceId(null);
    }
  }, [selectedPieceId, sendPlayerAction]);

  // Get cell class names based on cell properties
  const getCellClassName = useCallback((cell: Cell, x: number, y: number): string => {
    const isSelected = selectedPieceId !== null &&
      pieces.some((p: Piece) => p.id === selectedPieceId && p.x === x && p.y === y);

    const isPlaceable = isPlacingMode &&
      !pieces.some((piece: Piece) => piece.x === x && piece.y === y) &&
      !cell.isObstacle;

    let classes = "cell";

    // Add terrain classes
    classes += ` terrain-${cell.terrain}`;

    // Add state classes
    if (isSelected) classes += " selected";
    if (cell.isObstacle) classes += " obstacle";
    if (isPlaceable) classes += " placeable";

    return classes;
  }, [isPlacingMode, pieces, selectedPieceId]);

  // Get piece class names
  const getPieceClassName = useCallback((piece: Piece): string => {
    let classes = "piece";

    if (selectedPieceId === piece.id) {
      classes += " selected";
    }

    if (piece.isDragging) {
      classes += " dragging";
    }

    return classes;
  }, [selectedPieceId]);

  // Add random piece function
  const addRandomPiece = useCallback((): void => {
    // Check if we've reached the maximum number of players
    if (pieces.length >= MAX_PLAYERS) {
      alert(`Maximum of ${MAX_PLAYERS} avatars allowed on the map.`);
      return;
    }

    const emptyCells: {x: number, y: number}[] = [];

    for (let y = 0; y < selectedMap.gridSize.height && y < map.length; y++) {
      for (let x = 0; x < selectedMap.gridSize.width && x < map[0].length; x++) {
        if (!map[y][x].isObstacle && !pieces.some((p: Piece) => p.x === x && p.y === y)) {
          emptyCells.push({x, y});
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      createNewPiece(randomCell.x, randomCell.y);
    }
  }, [selectedMap.gridSize.height, selectedMap.gridSize.width, map, pieces, createNewPiece]);

  // Remove selected piece function
  const removeSelectedPiece = useCallback((): void => {
    if (selectedPieceId) {
      setPieces((prevPieces: Piece[]) => prevPieces.filter((p: Piece) => p.id !== selectedPieceId));
      setSelectedPieceId(null);
    }
  }, [selectedPieceId]);

  // Toggle placing mode function
  const togglePlacingMode = useCallback((): void => {
    // If trying to enter placing mode but already at max tokens, show warning
    if (!isPlacingMode && pieces.length >= MAX_PLAYERS) {
      alert(`Maximum of ${MAX_PLAYERS} avatars allowed on the map.`);
      return;
    }

    setIsPlacingMode(!isPlacingMode);
    // Deselect any selected piece when entering placing mode
    if (!isPlacingMode) {
      setSelectedPieceId(null);
    }
  }, [isPlacingMode, pieces.length]);

  // Reset game function
  const resetGame = useCallback((): void => {
    setPieces([]);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setNextPieceId(1);
    setIsPlacingMode(false);

    // Request a new map
    requestGeneratedMap();
  }, [requestGeneratedMap]);

  // Handle map selection
  const handleMapSelect = useCallback((mapOption: MapOption): void => {
    setSelectedMap(mapOption);

    // If this is a saved map from the server, request its details
    if (mapOption.id !== 'loading') {
      // Send request to get the map details
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify({
          type: 'get_map',
          map_id: mapOption.id
        }));
      }
    }

    // Reset game state
    setPieces([]);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setNextPieceId(1);
    setIsPlacingMode(false);
  }, [wsConnection]);

  // Play background music function
  const playMusic = useCallback(() => {
    if (!audioRef.current) return;

    // Make sure the audio is loaded
    if (audioRef.current.readyState < 2) {
      // If audio is not loaded yet, load it first
      audioRef.current.load();
      // Add an event listener to play when loaded
      const onCanPlay = () => {
        playMusic();
        audioRef.current?.removeEventListener('canplaythrough', onCanPlay);
      };
      audioRef.current.addEventListener('canplaythrough', onCanPlay);
      return;
    }

    // Check if audio context is suspended (browser autoplay policy)
    const playPromise = audioRef.current.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Music started playing");
          setIsMusicPlaying(true);
          setShowMusicError(false);
        })
        .catch((error: Error) => {
          console.error("Music playback failed:", error);
          setShowMusicError(true);
          // Most browsers require user interaction before audio can play
          // We'll keep the button visible for manual play
        });
    }
  }, []);

  // Handle audio loaded
  useEffect(() => {
    const audioElement = audioRef.current;

    if (audioElement) {
      // Set up audio properties
      audioElement.volume = 0.5;

      // Add event listeners
      const handleCanPlay = () => {
        console.log("Audio can now be played");
      };

      const handleError = (e: Event) => {
        console.error("Audio error:", e);
        setShowMusicError(true);
      };

      audioElement.addEventListener('canplaythrough', handleCanPlay);
      audioElement.addEventListener('error', handleError);

      // Clean up
      return () => {
        audioElement.removeEventListener('canplaythrough', handleCanPlay);
        audioElement.removeEventListener('error', handleError);
      };
    }
  }, []);

  // Start game with the AI-generated map
  const startGame = useCallback((): void => {
    setGameStarted(true);

    // Request a generated map when starting the game
    requestGeneratedMap();

    // Try to play background music when game starts
    setTimeout(() => {
      // Delayed attempt to play audio after component mounts
      if (audioRef.current) {
        audioRef.current.volume = 0.5; // Set volume to 50%
        playMusic();
      }

      // Send initial game state to the DM after a short delay
      // This ensures the WebSocket connection is established
      setTimeout(() => {
        sendGameState();
        console.log("Sent initial game state to DM");
      }, 1000);
    }, 1000);
  }, [playMusic, sendGameState, requestGeneratedMap]);

  // Toggle music play/pause
  const toggleMusic = useCallback((): void => {
    if (!audioRef.current) return;

    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      playMusic();
    }
  }, [isMusicPlaying, playMusic]);

  // Toggle music mute state
  const toggleMute = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMusicMuted(!isMusicMuted);

      // If currently not playing and unmuting, try to play
      if (!isMusicPlaying && isMusicMuted) {
        playMusic();
      }
    }
  }, [isMusicMuted, isMusicPlaying, playMusic]);

  // Return to map selection
  const backToMapSelection = useCallback((): void => {
    setGameStarted(false);
    setPieces([]);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setNextPieceId(1);
    setIsPlacingMode(false);
    setShowMapSelector(false);

    // Pause music when returning to map selection
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    }
  }, [isMusicPlaying]);

  // Clean up audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      }
    };
  }, [isMusicPlaying]);

  // Set up periodic state updates to keep the DM informed
  useEffect(() => {
    if (!gameStarted) return;

    // Send game state every 10 seconds
    const intervalId = setInterval(() => {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        sendGameState();
      }
    }, 10000);

    // Clean up interval on unmount or when game ends
    return () => clearInterval(intervalId);
  }, [gameStarted, wsConnection, sendGameState]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Get cell style adjustments based on cell size
  const getCellStyle = useCallback((cell: Cell): React.CSSProperties => {
    // Base cell styles
    const baseStyle: React.CSSProperties = {
      width: selectedMap.cellSize,
      height: selectedMap.cellSize,
    };

    // Add background color based on terrain type
    switch (cell.terrain) {
      case 'grass':
        return { ...baseStyle, backgroundColor: 'rgba(76, 175, 80, 0.15)' };
      case 'water':
        return { ...baseStyle, backgroundColor: 'rgba(33, 150, 243, 0.2)' };
      case 'mountain':
        return { ...baseStyle, backgroundColor: 'rgba(121, 85, 72, 0.2)' };
      case 'forest':
        return { ...baseStyle, backgroundColor: 'rgba(139, 195, 74, 0.15)' };
      case 'swamp':
        return { ...baseStyle, backgroundColor: 'rgba(121, 134, 203, 0.2)' };
      case 'desert':
        return { ...baseStyle, backgroundColor: 'rgba(255, 235, 59, 0.15)' };
      case 'cave':
        return { ...baseStyle, backgroundColor: 'rgba(66, 66, 66, 0.2)' };
      default:
        return { ...baseStyle, backgroundColor: 'rgba(255, 255, 255, 0.1)' };
    }
  }, [selectedMap.cellSize]);

  // Get piece style adjustments based on cell size
  const getPieceStyle = useCallback((piece: Piece): React.CSSProperties => {
    return {
      width: `${selectedMap.cellSize * 0.8}px`,
      height: `${selectedMap.cellSize * 0.8}px`,
      backgroundImage: `url(${piece.avatar})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: '50%',
      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.6)',
    };
  }, [selectedMap.cellSize]);

  // Define a memoized Cell component to optimize rendering
  const CellComponent = React.memo(({ cell, x, y }: { cell: Cell; x: number; y: number }) => {
    const cellPieces = pieces.filter((piece: Piece) => piece.x === x && piece.y === y);

    return (
      <div
        className={getCellClassName(cell, x, y)}
        style={getCellStyle(cell)}
      >
        {cellPieces.length > 0 && cellPieces.map((piece: Piece) => (
          <div
            key={piece.id}
            className={getPieceClassName(piece)}
            style={getPieceStyle(piece)}
            onMouseDown={(e) => handlePieceDragStart(e, piece)}
            onClick={(e) => handlePieceClick(e, piece)}
            onDoubleClick={(e) => handleDeletePiece(e, piece)}
            title={piece.label}
            data-player={piece.label}
          >
            {/* Avatar is displayed via background image */}
          </div>
        ))}
        {cell.isObstacle && (
          <div className="obstacle-indicator">
            ⛔
          </div>
        )}
      </div>
    );
  });

  // Use useMemo to optimize grid click handler calculation
  const gridClickHandler = useCallback((e: React.MouseEvent): void => {
    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const offsetX = rect.left + window.scrollX + 10; // Add padding offset
    const offsetY = rect.top + window.scrollY + 10; // Add padding offset

    // Calculate position with gap between cells
    const cellWithGap = selectedMap.cellSize + 4;
    const x = Math.floor((e.clientX - offsetX) / cellWithGap);
    const y = Math.floor((e.clientY - offsetY) / cellWithGap);

    if (x >= 0 && x < selectedMap.gridSize.width && y >= 0 && y < selectedMap.gridSize.height) {
      handleCellClick(x, y);
    }
  }, [selectedMap.cellSize, selectedMap.gridSize.width, selectedMap.gridSize.height, handleCellClick]);

  // Create grid items in a more optimal way
  const renderGrid = useCallback(() => {
    const gridItems = [];

    for (let y = 0; y < selectedMap.gridSize.height && y < map.length; y++) {
      const row = map[y];
      for (let x = 0; x < selectedMap.gridSize.width && x < row.length; x++) {
        gridItems.push(
          <CellComponent
            key={`${x}-${y}`}
            cell={row[x]}
            x={x}
            y={y}
          />
        );
      }
    }

    return gridItems;
  }, [map, selectedMap.gridSize, pieces]);

  // Memoize the grid items to prevent unnecessary re-renders
  const gridItems = useMemo(() => renderGrid(), [renderGrid]);

  // Render the Map Selection Screen
  const renderMapSelectionScreen = useCallback(() => {
    return (
      <div className="map-selection-screen">
        <h1 className="game-title">D&D Game Map</h1>
        <p className="game-subtitle">Start your adventure with an AI-generated map</p>

        <div className="map-selection-actions">
          <button
            className="btn btn-start-game"
            onClick={startGame}
          >
            Generate Adventure Map
          </button>

          <div className="music-controls">
            <button
              className="btn btn-music music-selection-btn"
              onClick={toggleMusic}
              title={isMusicPlaying ? "Pause Music" : "Play Music"}
            >
              {isMusicPlaying ? '⏸️ Pause Music' : '▶️ Play Music'}
            </button>

            <button
              className="btn btn-music music-selection-btn"
              onClick={toggleMute}
              title={isMusicMuted ? "Unmute music" : "Mute music"}
              disabled={!isMusicPlaying}
            >
              {isMusicMuted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
          </div>

          {showMusicError && (
            <div className="music-error-message">
              Your browser blocked autoplay. Please click "Play Music" to start the music manually.
            </div>
          )}
        </div>

        <div className="map-generation-themes">
          <h3>Or generate a map with a specific theme:</h3>
          <div className="theme-buttons">
            <button onClick={() => { setGameStarted(true); requestGeneratedMap('medieval fantasy') }}>Medieval Fantasy</button>
            <button onClick={() => { setGameStarted(true); requestGeneratedMap('dark dungeon') }}>Dark Dungeon</button>
            <button onClick={() => { setGameStarted(true); requestGeneratedMap('forest adventure') }}>Forest Adventure</button>
            <button onClick={() => { setGameStarted(true); requestGeneratedMap('mountain pass') }}>Mountain Pass</button>
            <button onClick={() => { setGameStarted(true); requestGeneratedMap('coastal kingdom') }}>Coastal Kingdom</button>
          </div>
        </div>

        {/* Audio element for background music */}
        <audio
          ref={audioRef}
          src={backgroundMusic}
          loop
          preload="auto"
          crossOrigin="anonymous"
          playsInline
        />
      </div>
    );
  }, [startGame, toggleMusic, toggleMute, isMusicPlaying, isMusicMuted, showMusicError, requestGeneratedMap]);

  // Render the Game Interface
  const renderGameInterface = useCallback(() => {
    return (
      <>
        <header className="game-header">
          <h1 className="game-title">D&D Game Map</h1>
          <p className="game-subtitle">
            Place and move your character avatars on the interactive game board
          </p>
        </header>

        <div className="game-board">
          <div className="controls">
            <button
              className="btn btn-back"
              onClick={backToMapSelection}
            >
              ← Change Map
            </button>

            <button
              className={`btn btn-place ${isPlacingMode ? 'active' : ''}`}
              onClick={togglePlacingMode}
              disabled={pieces.length >= MAX_PLAYERS}
            >
              {isPlacingMode ? '✘ Cancel' : '✚ Add Avatar'}
            </button>

            <button
              className="btn btn-random"
              onClick={addRandomPiece}
              disabled={pieces.length >= MAX_PLAYERS}
            >
              🎲 Random Avatar
            </button>

            <button
              className="btn btn-remove"
              onClick={removeSelectedPiece}
              disabled={!selectedPieceId}
            >
              🗑️ Remove Avatar
            </button>

            <button
              className="btn btn-reset"
              onClick={resetGame}
            >
              🔄 Generate New Map
            </button>

            <button
              className="btn btn-music"
              onClick={toggleMusic}
              title={isMusicPlaying ? "Pause Music" : "Play Music"}
            >
              {isMusicPlaying ? '⏸️' : '▶️'}
            </button>

            <button
              className="btn btn-music"
              onClick={toggleMute}
              title={isMusicMuted ? "Unmute music" : "Mute music"}
              disabled={!isMusicPlaying}
            >
              {isMusicMuted ? '🔇' : '🔊'}
            </button>
          </div>

          {showMapSelector && (
            <div className="map-selector">
              <h3>Select a Map</h3>
              <div className="map-options">
                {availableMaps.length > 0 ? (
                  availableMaps.map((mapOption: MapOption) => (
                    <div
                      key={mapOption.id}
                      className={`map-option ${selectedMap.id === mapOption.id ? 'selected' : ''}`}
                      onClick={() => handleMapSelect(mapOption)}
                    >
                      <div className="map-info">
                        <h4>{mapOption.name}</h4>
                        <p>{mapOption.description}</p>
                        <div className="map-grid-info">
                          Grid: {mapOption.gridSize.width}×{mapOption.gridSize.height}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No maps available yet. Use "Generate New Map" to create one.</p>
                )}
              </div>
              <button
                className="btn btn-close-selector"
                onClick={() => setShowMapSelector(false)}
              >
                Close
              </button>
            </div>
          )}

          <div className="status-bar">
            {loadingMap ? (
              <span>Generating your adventure map...</span>
            ) : isPlacingMode ? (
              <span className="status-placing">✓ Select any empty cell to place a new avatar</span>
            ) : selectedPieceId ? (
              <span className="status-selected">✓ Avatar selected - click on a cell to move it</span>
            ) : pieces.length >= MAX_PLAYERS ? (
              <span className="status-max-players">Maximum player limit reached ({MAX_PLAYERS})</span>
            ) : (
              <span>Select an avatar to move it or use the buttons above ({pieces.length}/{MAX_PLAYERS} avatars used)</span>
            )}
          </div>

          <div className="help-button" onClick={() => setShowTooltip(!showTooltip)}>
            ?
          </div>

          {showTooltip && (
            <div className="tooltip">
              <h3>Terrain Guide:</h3>
              <ul>
                <li>Light Green: Grass</li>
                <li>Blue: Water (obstacle)</li>
                <li>Brown: Mountains (obstacle)</li>
                <li>Dark Green: Forest</li>
                <li>Purple: Swamp</li>
                <li>Yellow: Desert</li>
                <li>Gray: Cave</li>
              </ul>
              <button
                className="tooltip-close"
                onClick={() => setShowTooltip(false)}
              >
                ✕
              </button>
            </div>
          )}

          {loadingMap ? (
            <div className="loading-map">
              <p>The Dungeon Master is creating your adventure map...</p>
              <div className="spinner"></div>
            </div>
          ) : (
            <div
              ref={gridRef}
              className={`grid ${isPlacingMode ? 'cursor-crosshair' : draggingPiece ? 'cursor-grabbing' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${selectedMap.gridSize.width}, ${selectedMap.cellSize}px)`,
                gridTemplateRows: `repeat(${selectedMap.gridSize.height}, ${selectedMap.cellSize}px)`,
                width: `${selectedMap.gridSize.width * (selectedMap.cellSize + 4) - 4}px`,
                height: `${selectedMap.gridSize.height * (selectedMap.cellSize + 4) - 4}px`,
                gap: '4px',
              }}
              onClick={gridClickHandler}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {gridItems}
            </div>
          )}

          <div className="legend">
            <div className="legend-item">
              <div className="legend-color legend-grass"></div>
              <span>Grass</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-water"></div>
              <span>Water (obstacle)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-mountain"></div>
              <span>Mountain (obstacle)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-forest"></div>
              <span>Forest</span>
            </div>
            {selectedMap.terrainDistribution && selectedMap.terrainDistribution.swamp > 0 && (
              <div className="legend-item">
                <div className="legend-color legend-swamp"></div>
                <span>Swamp</span>
              </div>
            )}
            {selectedMap.terrainDistribution && selectedMap.terrainDistribution.desert > 0 && (
              <div className="legend-item">
                <div className="legend-color legend-desert"></div>
                <span>Desert</span>
              </div>
            )}
            {selectedMap.terrainDistribution && selectedMap.terrainDistribution.cave > 0 && (
              <div className="legend-item">
                <div className="legend-color legend-cave"></div>
                <span>Cave</span>
              </div>
            )}
          </div>

          <div className="current-map-info">
            <h3>Current Map: {selectedMap.name}</h3>
            <p>{selectedMap.description}</p>
            <div className="grid-dimensions">
              Grid Size: {selectedMap.gridSize.width} × {selectedMap.gridSize.height}
            </div>
          </div>
        </div>

        <footer className="game-footer">
          <p>Hover over avatars to see character name • Double-click to remove an avatar</p>
        </footer>

        {/* Audio element for background music */}
        <audio
          ref={audioRef}
          src={backgroundMusic}
          loop
          preload="auto"
          crossOrigin="anonymous"
          playsInline
        />
      </>
    );
  }, [
    selectedMap, gridItems, isPlacingMode, selectedPieceId, draggingPiece,
    showMapSelector, showTooltip, isMusicMuted, loadingMap, availableMaps,
    backToMapSelection, togglePlacingMode, addRandomPiece, removeSelectedPiece,
    resetGame, handleMapSelect, gridClickHandler, handleMouseMove, handleMouseUp, toggleMusic, toggleMute, pieces.length
  ]);

  // Roll dice function
  const rollDice = useCallback((diceType: string) => {
    // Parse dice type (e.g., "d20", "2d6", etc.)
    const match = diceType.match(/^(\d*)d(\d+)$/i);
    if (!match) {
      console.error(`Invalid dice format: ${diceType}`);
      return;
    }

    const count = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);

    // Roll the dice
    let total = 0;
    const rolls = [];

    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    // Send the roll to the DM
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'roll_dice',
        dice_type: diceType,
        result: total,
        individual_rolls: rolls
      }));
    }

    // Return the result for UI display
    return { total, rolls };
  }, [wsConnection]);

  // State for dice rolling
  const [diceResult, setDiceResult] = useState<{ type: string; total: number; rolls: number[] } | null>(null);
  const [showDicePanel, setShowDicePanel] = useState(false);

  // State for chat interface
  const [userInput, setUserInput] = useState<string>("");
  const [waitingForDiceRoll, setWaitingForDiceRoll] = useState<boolean>(false);

  // Handle dice roll button click
  const handleDiceRoll = useCallback((diceType: string) => {
    const result = rollDice(diceType);
    if (result) {
      setDiceResult({
        type: diceType,
        total: result.total,
        rolls: result.rolls
      });

      // If we were waiting for a dice roll, add it to chat history
      if (waitingForDiceRoll) {
        setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [
          ...prev,
          {
            role: 'user',
            content: `🎲 Rolled ${diceType}: ${result.total}${result.rolls.length > 1 ? ` (${result.rolls.join(', ')})` : ''}`
          }
        ]);
        setWaitingForDiceRoll(false);

        // Send the dice roll to the DM for interpretation
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(JSON.stringify({
            type: 'user_input',
            content: `I rolled a ${result.total} on ${diceType}.`,
            dice_roll: {
              type: diceType,
              result: result.total,
              rolls: result.rolls
            }
          }));
        }
      }
    }
  }, [rollDice, waitingForDiceRoll, wsConnection]);

  // Handle user chat input
  const handleUserInput = useCallback(() => {
    if (!userInput.trim()) return;

    // Add user message to chat history
    setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [...prev, { role: 'user', content: userInput }]);

    // Send user input to the DM
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'user_input',
        content: userInput
      }));
    }

    // Clear input field
    setUserInput('');
  }, [userInput, wsConnection]);



  // Handle AI taking control of the game
  const handleAIControl = useCallback(() => {
    if (pieces.length === 0) {
      alert("Please place at least one character on the map first!");
      return;
    }

    setAiControlled(true);

    // Notify the DM that AI is now controlling the game
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'ai_control',
        data: {
          enabled: true
        }
      }));

      // Add a message to the chat history
      setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [
        ...prev,
        {
          role: 'dm',
          content: "The Dungeon Master has taken control of the game. Your fate now lies in the hands of the dice. Describe your actions, and I will guide you through this adventure."
        }
      ]);
    }
  }, [pieces.length, wsConnection]);

  // Main render
  return (
    <div className="game-container">
      {!gameStarted ? renderMapSelectionScreen() : renderGameInterface()}

      <div className="game-controls-panel">
        <button
          className="btn btn-dice"
          onClick={() => setShowDicePanel(!showDicePanel)}
        >
          🎲 Dice
        </button>

        <button
          className="btn btn-update"
          onClick={sendGameState}
        >
          🔄 Update
        </button>

        <div className="sound-toggle">
          <input type="checkbox" id="sound-enabled" defaultChecked={true} />
          <label htmlFor="sound-enabled">🔊 Sound</label>
        </div>
      </div>

      {showDicePanel && (
        <div className="dice-panel">
          <h3>Roll Dice</h3>
          <div className="dice-buttons">
            <button onClick={() => handleDiceRoll('d4')}>d4</button>
            <button onClick={() => handleDiceRoll('d6')}>d6</button>
            <button onClick={() => handleDiceRoll('d8')}>d8</button>
            <button onClick={() => handleDiceRoll('d10')}>d10</button>
            <button onClick={() => handleDiceRoll('d12')}>d12</button>
            <button onClick={() => handleDiceRoll('d20')}>d20</button>
            <button onClick={() => handleDiceRoll('2d6')}>2d6</button>
          </div>

          {diceResult && (
            <div className="dice-result">
              <p>
                <strong>{diceResult.type} Roll:</strong> {diceResult.total}
              </p>
              {diceResult.rolls.length > 1 && (
                <p className="individual-rolls">
                  Individual rolls: {diceResult.rolls.join(', ')}
                </p>
              )}
            </div>
          )}

          <button
            className="btn btn-close"
            onClick={() => setShowDicePanel(false)}
          >
            Close
          </button>
        </div>
      )}

      <div className="game-panels">
        <div className="narration-panel">
          <h3>Dungeon Master</h3>
          <p>{narration}</p>

          {!aiControlled && pieces.length > 0 && (
            <button
              className="btn btn-ai-control"
              onClick={handleAIControl}
            >
              Let AI Take Control
            </button>
          )}
        </div>

        {aiControlled && (
          <DungeonChat
            chatHistory={chatHistory}
            onSendMessage={(message: string) => {
              // Add user message to chat history
              setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [...prev, { role: 'user', content: message }]);

              // Send user input to the DM
              if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                wsConnection.send(JSON.stringify({
                  type: 'user_input',
                  content: message
                }));
              }
            }}
            onRollDice={handleDiceRoll}
            waitingForDiceRoll={waitingForDiceRoll}
          />
        )}
      </div>

      {showRewardModal && (
        <div className="reward-modal">
          <h2>Achievement Unlocked!</h2>
          <p>You've earned a new NFT reward!</p>
          <p>Transaction: {currentReward}</p>
          <button onClick={() => setShowRewardModal(false)}>Close</button>
          <Link to="/nfts" className="view-nft-button">
            View in NFT Gallery
          </Link>
        </div>
      )}

      {/* Audio element for background music */}
      <audio
        ref={audioRef}
        src={backgroundMusic}
        loop
        preload="auto"
        crossOrigin="anonymous"
        playsInline
      />

      {/* Audio element for sound effects */}
      <audio
        ref={soundEffectRef}
        preload="auto"
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default GameMap;
