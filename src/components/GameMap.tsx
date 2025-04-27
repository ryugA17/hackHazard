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
import './ScrollAnimations.css';
import { setupScrollAnimations } from '../utils/scrollAnimations';

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

// Define updated Piece interface
interface Piece {
  id: string;
  x: number;
  y: number;
  avatar: string;
  label: string;
  isSelected?: boolean;
  isTrapped?: boolean;
  isDragging?: boolean;
}

type TerrainType = "grass" | "water" | "mountain" | "forest" | "swamp" | "desert" | "cave" | "dungeon" | "snow" | "lava" | "path";

interface Cell {
  type: "revealed" | "hidden" | "fog";
  terrain: TerrainType;
  isObstacle: boolean;
  x: number;
  y: number;
  // Layer 1: Special variations
  specialVariation?: string;
  // Layer 2: Decorative objects
  decoration?: string;
  // Layer 3: Lighting and shadows
  lighting?: string | {
    base: string;
    variation?: string;
    intensity?: number;
    colorShift?: string;
  };
  // Additional map features
  structure?: string;
  item?: {
    id: string;
    type: string;
    rarity: string;
    discovered: boolean;
  };
  trap?: {
    id: string;
    type: string;
    detected: boolean;
    triggered: boolean;
    difficulty: number;
  };
  // Additional properties from server
  special_variation?: string;
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
      y,
      // Include enhanced features from our multi-layer visual system
      special_variation: cell.special_variation || null,
      decoration: cell.decoration || null,
      lighting: cell.lighting || {
        base: "normal",
        variation: "standard",
        intensity: 1.0,
        color_shift: null
      },
      structure: cell.structure || null,
      item: cell.item || null,
      trap: cell.trap || null
    }))
  );
};

// Main component
const GameMap: React.FC = () => {
  // Add scroll animations setup
  React.useEffect(() => {
    // Set up scroll animations
    setupScrollAnimations();
  }, []);

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

  // State for narrations
  const [narrations, setNarrations] = useState<Array<{id: string, content: string, timestamp: Date}>>([]);

  // Interface for CellComponentProps
  interface CellComponentProps {
    cell: Cell;
    x: number;
    y: number;
  }

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

  // Function to play sound effects
  const playSound = useCallback((soundType: string) => {
    if (!soundEffectRef.current) return;

    // Check if sound is enabled
    const soundEnabled = document.getElementById('sound-enabled') as HTMLInputElement;
    if (soundEnabled && !soundEnabled.checked) return;

    // Map sound types to file paths
    const soundPaths: Record<string, string> = {
      // Basic game sounds
      'trapped': '/assets/sounds/mixkit-retro-game-emergency-alarm-1000.wav',
      'movement': '/assets/sounds/mixkit-quick-jump-arcade-game-239.wav',
      'dice': '/assets/sounds/mixkit-game-show-suspense-waiting-667.wav',
      'success': '/assets/sounds/mixkit-melodical-flute-music-notification-2310.wav',
      'failure': '/assets/sounds/mixkit-sad-game-over-trombone-471.wav',

      // Character sounds
      'character_select': '/assets/sounds/mixkit-retro-game-notification-212.wav',
      'character_add': '/assets/sounds/mixkit-positive-interface-beep-221.wav',
      'character_remove': '/assets/sounds/mixkit-negative-guitar-tone-2324.wav',

      // Environment sounds
      'edge_reached': '/assets/sounds/mixkit-fast-small-sweep-transition-166.wav',
      'new_area': '/assets/sounds/mixkit-magic-sweep-game-trophy-257.wav',
      'obstacle_hit': '/assets/sounds/mixkit-arcade-retro-changing-tab-206.wav',

      // Combat sounds
      'attack': '/assets/sounds/mixkit-sword-slash-swoosh-1476.wav',
      'defend': '/assets/sounds/mixkit-metal-hit-woosh-1485.wav',
      'spell': '/assets/sounds/mixkit-magical-spell-2102.wav',
      'heal': '/assets/sounds/mixkit-fairy-magic-sparkle-871.wav',
      'damage': '/assets/sounds/mixkit-boxer-getting-hit-2055.wav',
      'death': '/assets/sounds/mixkit-player-losing-or-failing-2042.wav',

      // UI sounds
      'button_click': '/assets/sounds/mixkit-select-click-1109.wav',
      'menu_open': '/assets/sounds/mixkit-game-click-1114.wav',
      'menu_close': '/assets/sounds/mixkit-tech-click-1115.wav',
      'notification': '/assets/sounds/mixkit-software-interface-start-2574.wav',
      'error': '/assets/sounds/mixkit-wrong-answer-fail-notification-946.wav'
    };

    // If the sound type is a direct file name, use it directly
    // Otherwise, look it up in the sound paths map
    let soundPath;
    if (soundType.includes('.wav') || soundType.includes('.mp3')) {
      soundPath = `/assets/sounds/${soundType}`;
    } else {
      soundPath = soundPaths[soundType] || `/assets/sounds/mixkit-select-click-1109.wav`;
    }

    console.log('Playing sound effect:', soundPath);

    // Set the source and play the sound
    soundEffectRef.current.src = `http://localhost:8001${soundPath}`;
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
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      if (message.type === 'narration') {
        // Add narration to chat
        setNarrations((prev: Array<{id: string, content: string, timestamp: Date}>) => [...prev, {
          id: Date.now().toString(),
          content: message.content,
          timestamp: new Date()
        }]);

        // Also add to chat history for DM chat
        setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [
          ...prev,
          { role: 'dm', content: message.content }
        ]);
      } else if (message.type === 'dm_response') {
        // Handle DM response
        setNarrations((prev: Array<{id: string, content: string, timestamp: Date}>) => [...prev, {
          id: Date.now().toString(),
          content: message.content,
          timestamp: new Date()
        }]);

        // Also add to chat history for DM chat
        setChatHistory((prev: Array<{role: 'user' | 'dm', content: string}>) => [
          ...prev,
          { role: 'dm', content: message.content }
        ]);

        // Handle character movement from AI
        if (message.move_character) {
          const { character_id, to_x, to_y } = message.move_character;

          setPieces((prevPieces: Piece[]) =>
            prevPieces.map((piece: Piece) =>
              piece.id === character_id
                ? { ...piece, x: to_x, y: to_y }
                : piece
            )
          );
        }

        // Handle multiple character movements
        if (message.move_characters) {
          setPieces((prevPieces: Piece[]) => {
            const updatedPieces = [...prevPieces];

            message.move_characters.forEach((move: any) => {
              const index = updatedPieces.findIndex(p => p.id === move.character_id);
              if (index !== -1) {
                updatedPieces[index] = {
                  ...updatedPieces[index],
                  x: move.to_x,
                  y: move.to_y
                };
              }
            });

            return updatedPieces;
          });
        }

        // Handle trapped character notifications
        if (message.trapped_characters) {
          setPieces((prevPieces: Piece[]) => {
            return prevPieces.map((piece: Piece) => {
              const trappedChar = message.trapped_characters.find(
                (tc: any) => tc.character_id === piece.id
              );

              return trappedChar
                ? { ...piece, isTrapped: true }
                : { ...piece, isTrapped: false };
            });
          });

          // Play trapped sound effect if available
          playSound('trapped');
        }
      } else if (message.type === 'map_data') {
        console.log("Received map data:", message);

        // The map data could be in data.map_data or directly in data
        const mapData = message.map_data || message;

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
  }, [playSound]);

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
    setLoadingMap(true);

    // Try both WebSocket and direct API call
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      const request = {
        type: 'generate_map',
        theme: theme || 'fantasy adventure',
        content: 'Create a dynamic map for my adventure'
      };

      console.log("Sending map generation request via WebSocket:", request);
      wsConnection.send(JSON.stringify(request));
    }

    // Also make a direct API call as a fallback
    console.log("Sending map generation request via API:", theme || 'fantasy adventure');

    fetch('http://localhost:8001/generate_map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: theme || 'fantasy adventure' }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(mapData => {
      console.log("Received map data from API:", mapData);

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
    })
    .catch(error => {
      console.error("Error fetching map data:", error);
      // If API call fails, rely on WebSocket response
    });
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

  // Function to check if a character is trapped (surrounded by obstacles)
  const checkIfTrapped = useCallback((x: number, y: number): boolean => {
    // If out of bounds, consider it trapped
    if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) {
      return true;
    }

    // Check all 8 surrounding cells
    const directions = [
      [-1, -1], [0, -1], [1, -1], // Top left, top, top right
      [-1, 0],           [1, 0],  // Left, right
      [-1, 1],  [0, 1],  [1, 1]   // Bottom left, bottom, bottom right
    ];

    // Count how many surrounding cells are obstacles
    let obstacleCount = 0;

    for (const [dx, dy] of directions) {
      const newY = y + dy;
      const newX = x + dx;

      // Check if the cell is within bounds
      if (newY >= 0 && newY < map.length && newX >= 0 && newX < map[0].length) {
        // Check if the cell is an obstacle
        if (map[newY][newX].isObstacle) {
          obstacleCount++;
        }
      } else {
        // Count out-of-bounds as obstacles
        obstacleCount++;
      }
    }

    // If 7 or more surrounding cells are obstacles, the character is trapped
    return obstacleCount >= 7;
  }, [map]);

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

        // Play sound effect for adding a character
        playSound('movement');
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

        if (!selectedPiece) return;

        // Check if the character is at the edge of the map
        const isAtEdge = (
          x === 0 ||
          y === 0 ||
          x === selectedMap.gridSize.width - 1 ||
          y === selectedMap.gridSize.height - 1
        );

        // If at edge, determine which edge
        let edgeDirection = null;
        if (isAtEdge) {
          if (x === 0) edgeDirection = "west";
          else if (x === selectedMap.gridSize.width - 1) edgeDirection = "east";
          else if (y === 0) edgeDirection = "north";
          else if (y === selectedMap.gridSize.height - 1) edgeDirection = "south";

          console.log(`Character at ${edgeDirection} edge of map`);

          // Play a special sound for reaching the edge
          playSound('mixkit-fast-small-sweep-transition-166.wav');
        }

        // Update the piece position
        setPieces((prevPieces: Piece[]) => prevPieces.map((piece: Piece) =>
          piece.id === selectedPieceId
            ? { ...piece, x, y, isDragging: false }
            : piece
        ));

        // Check if the character is trapped (surrounded by obstacles)
        const isTrapped = checkIfTrapped(x, y);

        if (isTrapped) {
          // Update the piece to show it's trapped
          setPieces((prevPieces: Piece[]) => prevPieces.map((piece: Piece) =>
            piece.id === selectedPieceId
              ? { ...piece, isTrapped: true }
              : piece
          ));

          // Play trapped sound
          playSound('mixkit-retro-game-emergency-alarm-1000.wav');

          // Show a message to the user
          setNarrations((prev: Array<{id: string, content: string, timestamp: Date}>) => [...prev, {
            id: Date.now().toString(),
            content: `${selectedPiece.label} is trapped! They are surrounded by obstacles and cannot move.`,
            timestamp: new Date()
          }]);
        } else if (selectedPiece.isTrapped) {
          // If the piece was trapped before but isn't now, update it
          setPieces((prevPieces: Piece[]) => prevPieces.map((piece: Piece) =>
            piece.id === selectedPieceId
              ? { ...piece, isTrapped: false }
              : piece
          ));
        }

        // Notify the DM about the movement with additional information
        const moveAction: any = {
          character_id: selectedPieceId,
          character_type: selectedPiece.label,
          from: { x: selectedPiece.x, y: selectedPiece.y },
          to: { x, y }
        };

        // If at edge, include edge information
        if (edgeDirection) {
          moveAction.edge_direction = edgeDirection;
        }

        // If trapped, include that information
        if (isTrapped) {
          moveAction.is_trapped = true;
        }

        sendPlayerAction('move_character', moveAction);

        // Play movement sound
        playSound('movement');

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

        // Play selection sound
        playSound('mixkit-retro-game-notification-212.wav');
      }
    }
  }, [isPlacingMode, pieces, selectedPieceId, map, createNewPiece, sendPlayerAction, selectedMap.gridSize, checkIfTrapped, playSound]);

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

    if (piece.isTrapped) {
      classes += " trapped";
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

  // Test function to directly move a character
  const testMoveCharacter = useCallback((): void => {
    if (pieces.length === 0) {
      alert("Please add a character first");
      return;
    }

    // Get the first character
    const firstPiece = pieces[0];

    // Create a test movement command
    const testMovement = {
      type: "dm_response",
      content: "The Dungeon Master moves your character.",
      move_character: {
        character_id: firstPiece.id,
        to_x: Math.min(firstPiece.x + 1, selectedMap.gridSize.width - 1),
        to_y: firstPiece.y
      }
    };

    console.log("Testing character movement with:", testMovement);

    // Directly update the pieces state
    setPieces((prevPieces: Piece[]) => {
      const updatedPieces = prevPieces.map((piece: Piece) =>
        piece.id === firstPiece.id
          ? { ...piece, x: testMovement.move_character.to_x, y: testMovement.move_character.to_y }
          : piece
      );
      console.log("Updated pieces after test movement:", updatedPieces);
      return updatedPieces;
    });
  }, [pieces, selectedMap.gridSize.width]);

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

  // Helper function to generate cell styles
  const getCellStyle = (cell: Cell): React.CSSProperties => {
    const style: React.CSSProperties = {};

    // Basic style for terrain type
    switch (cell.terrain) {
      case "grass":
        style.backgroundColor = "#7cba34";
        break;
      case "forest":
        style.backgroundColor = "#2d6a1a";
        break;
      case "water":
        style.backgroundColor = "#4a80d9";
        break;
      case "mountain":
        style.backgroundColor = "#8b7355";
        break;
      case "desert":
        style.backgroundColor = "#e6c588";
        break;
      case "swamp":
        style.backgroundColor = "#5a714b";
        break;
      case "cave":
        style.backgroundColor = "#5d4037";
        break;
      case "dungeon":
        style.backgroundColor = "#4e342e";
        break;
      case "snow":
        style.backgroundColor = "#e8f0f9";
        break;
      case "lava":
        style.backgroundColor = "#cf3f10";
        break;
      case "path":
        style.backgroundColor = "#c2a37c";
        break;
      default:
        style.backgroundColor = "#7cba34"; // Default to grass
    }

    // Add border for cells
    style.border = "1px solid rgba(0,0,0,0.1)";

    return style;
  };

  // Cell Component with multi-layer visual system
  const CellComponent: React.FC<CellComponentProps> = ({ cell, x, y }: { cell: Cell, x: number, y: number }) => {
    // Determine base cell class based on terrain type
    let cellClass = `cell terrain-${cell.terrain}`;

    // Add obstacle class if needed
    if (cell.isObstacle) {
      cellClass += " obstacle";
    }

    // Add layer 1 - special variation classes (like bloody tiles)
    if (cell.specialVariation) {
      cellClass += ` special-${cell.specialVariation}`;
    }

    // Create style object for rendering all layers
    const style: React.CSSProperties = {
      ...getCellStyle(cell),
      backgroundImage: 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    };

    // Layer 1: Base Tile - Use tileset assets based on terrain type
    const getTilesetImage = (terrain: TerrainType, isObstacle: boolean) => {
      // Map terrain types to tileset images
      const tilesetMap: Record<TerrainType, string[]> = {
        grass: ['floor_vines_0_new.png', 'floor_vines_1_new.png', 'floor_vines_2_new.png'],
        water: ['floor_nerves_0.png', 'floor_nerves_1_new.png', 'floor_nerves_2_new.png'],
        mountain: ['marble_floor_1.png', 'marble_floor_2.png', 'marble_floor_3.png'],
        forest: ['floor_vines_3_new.png', 'floor_vines_4_new.png', 'floor_vines_5_new.png'],
        swamp: ['floor_sand_stone_0.png', 'floor_sand_stone_1.png', 'floor_sand_stone_2.png'],
        desert: ['floor_sand_rock_0.png', 'floor_sand_rock_1.png', 'floor_sand_rock_2.png'],
        cave: ['volcanic_floor_0.png', 'volcanic_floor_1.png', 'volcanic_floor_2.png'],
        dungeon: ['crystal_floor_0.png', 'crystal_floor_1.png', 'crystal_floor_2.png'],
        snow: ['marble_floor_4.png', 'marble_floor_5.png', 'marble_floor_6.png'],
        lava: ['volcanic_floor_3.png', 'volcanic_floor_4.png', 'volcanic_floor_5.png'],
        path: ['sandstone_floor_0.png', 'sandstone_floor_1.png', 'sandstone_floor_2.png']
      };

      // Map for obstacle tiles
      const obstacleMap: Record<TerrainType, string[]> = {
        grass: ['wall_vines_0.png', 'wall_vines_1.png', 'wall_vines_2.png'],
        water: ['wall_flesh_0.png', 'wall_flesh_1.png', 'wall_flesh_2.png'],
        mountain: ['marble_wall_1.png', 'marble_wall_2.png', 'marble_wall_3.png'],
        forest: ['wall_vines_3.png', 'wall_vines_4.png', 'wall_vines_5.png'],
        swamp: ['wall_old_blood_0.png', 'wall_old_blood_1.png', 'wall_old_blood_2.png'],
        desert: ['sandstone_wall_0.png', 'sandstone_wall_1.png', 'sandstone_wall_2.png'],
        cave: ['volcanic_wall_0.png', 'volcanic_wall_1.png', 'volcanic_wall_2.png'],
        dungeon: ['crystal_wall_0.png', 'crystal_wall_1.png', 'crystal_wall_2.png'],
        snow: ['marble_wall_4.png', 'marble_wall_5.png', 'marble_wall_6.png'],
        lava: ['volcanic_wall_3.png', 'volcanic_wall_4.png', 'volcanic_wall_5.png'],
        path: ['wall_yellow_rock_0.png', 'wall_yellow_rock_1.png', 'wall_yellow_rock_2.png']
      };

      // Get the array of possible tiles for this terrain
      const tileOptions = isObstacle ?
        (obstacleMap[terrain] || obstacleMap.mountain) :
        (tilesetMap[terrain] || tilesetMap.grass);

      // Use a deterministic selection based on coordinates to ensure the same tile is always used for the same position
      const index = (x * 7 + y * 13) % tileOptions.length;

      // Return the selected tile
      return `http://localhost:8001/assets/Tilesets/${tileOptions[index]}`;
    };

    // Set the background image based on terrain and obstacle status
    style.backgroundImage = `url(${getTilesetImage(cell.terrain, cell.isObstacle)})`;

    // Layer 3 - Apply lighting effects
    if (cell.lighting) {
      // Add base lighting
      const lighting = typeof cell.lighting === 'string'
        ? { base: cell.lighting as string }
        : cell.lighting as { base: string, variation?: string, intensity?: number, colorShift?: string };

      switch (lighting.base) {
        case "bright":
          style.filter = "brightness(1.2)";
          break;
        case "dim":
          style.filter = "brightness(0.8)";
          break;
        case "dark":
          style.filter = "brightness(0.6)";
          break;
        case "dappled":
          style.backgroundImage = `url(${getTilesetImage(cell.terrain, cell.isObstacle)}), radial-gradient(rgba(255,255,255,0.1) 10%, transparent 70%)`;
          break;
        case "foggy":
          style.backgroundColor = "rgba(200, 200, 220, 0.3)";
          break;
        case "glowing":
          style.boxShadow = "inset 0 0 10px rgba(255, 200, 150, 0.5)";
          break;
      }

      // Intensity adjustment
      if (typeof lighting !== 'string' && lighting.intensity !== 1.0 && style.filter) {
        style.filter += ` brightness(${lighting.intensity})`;
      }

      // Color shift
      if (typeof lighting !== 'string' && lighting.colorShift) {
        switch (lighting.colorShift) {
          case "warm":
            style.filter = (style.filter || "") + " sepia(0.3)";
            break;
          case "cool":
            style.filter = (style.filter || "") + " hue-rotate(30deg)";
            break;
          case "eerie":
            style.filter = (style.filter || "") + " hue-rotate(90deg) saturate(0.7)";
            break;
        }
      }
    }

    // Prepare decoration element
    let decorationElement = null;

    // Add layer 2 - decorative objects using assets
    if (cell.decoration) {
      // Map decoration types to object images
      const decorationMap: Record<string, string> = {
        chest: 'chest.png',
        fountain: 'blue_fountain.png',
        blood_fountain: 'blood_fountain.png',
        boulder: 'boulder.png',
        box: 'box.png',
        large_box: 'large_box.png',
        sarcophagus: 'sarcophagus_sealed.png',
        mold: 'mold_large_1.png',
        glowing_mold: 'mold_glowing_1.png'
      };

      const decorationImage = decorationMap[cell.decoration] || 'chest.png';

      decorationElement = (
        <div
          className={`decoration decoration-${cell.decoration}`}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundImage: `url(http://localhost:8001/assets/Objects/${decorationImage})`,
            backgroundSize: '80%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
      );
    }

    // Add special effects for certain cells
    if ((x + y) % 7 === 0 && cell.terrain === 'lava') {
      // Add a glow effect to lava cells
      const glowElement = (
        <div
          className="glow-effect"
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundImage: `url(http://localhost:8001/assets/Effects/fire_white.png)`,
            backgroundSize: '50%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            opacity: '0.6',
            zIndex: 1
          }}
        />
      );

      decorationElement = (
        <>
          {glowElement}
          {decorationElement}
        </>
      );
    }

    return (
      <div
        className={cellClass}
        style={style}
        data-x={x}
        data-y={y}
        title={`${cell.terrain}${cell.structure ? ` (${cell.structure})` : ''}`}
        onClick={() => gridClickHandler(x, y)}
      >
        {/* Layer 2 - Decorations */}
        {decorationElement}

        {/* Display structure if present */}
        {cell.structure && (
          <div className={`structure structure-${cell.structure}`}>
            <span className="structure-label">{cell.structure}</span>
          </div>
        )}

        {/* Display item if discovered */}
        {cell.item && cell.item.discovered && (
          <div className={`item item-${cell.item.rarity} item-${cell.item.type}`}>
            <span className="item-label">{cell.item.type}</span>
          </div>
        )}

        {/* Display trap if detected */}
        {cell.trap && cell.trap.detected && (
          <div className={`trap trap-${cell.trap.type}${cell.trap.triggered ? ' triggered' : ''}`}>
            <span className="trap-label">{cell.trap.type}</span>
          </div>
        )}
      </div>
    );
  };

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

    // First, render all cells
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

    // Then, render all pieces (avatars) on top of the cells
    pieces.forEach((piece: Piece) => {
      // Only render pieces that are within the grid bounds
      if (piece.x >= 0 && piece.x < selectedMap.gridSize.width &&
          piece.y >= 0 && piece.y < selectedMap.gridSize.height) {

        // Calculate position for the piece
        const pieceStyle: React.CSSProperties = {
          left: `${piece.x * (selectedMap.cellSize + 4)}px`,
          top: `${piece.y * (selectedMap.cellSize + 4)}px`,
          width: `${selectedMap.cellSize}px`,
          height: `${selectedMap.cellSize}px`,
          backgroundImage: `url(${piece.avatar})`,
          position: 'absolute',
          backgroundSize: 'cover',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: piece.isTrapped ? '0 0 10px red' : '0 0 5px rgba(0,0,0,0.5)',
          border: selectedPieceId === piece.id ? '2px solid yellow' : '2px solid white',
          zIndex: 10
        };

        gridItems.push(
          <div
            key={`piece-${piece.id}`}
            className={`piece ${selectedPieceId === piece.id ? 'selected' : ''} ${piece.isDragging ? 'dragging' : ''} ${piece.isTrapped ? 'trapped' : ''}`}
            style={pieceStyle}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedPieceId === piece.id) {
                // Deselect if already selected
                setSelectedPieceId(null);
              } else {
                // Select this piece
                setSelectedPieceId(piece.id);
              }
            }}
            title={piece.label}
          >
            <div className="piece-label">{piece.label}</div>
          </div>
        );
      }
    });

    return gridItems;
  }, [map, selectedMap.gridSize, selectedMap.cellSize, pieces, selectedPieceId]);



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
      <div className="game-interface">
        <header className="game-header">
          <h1 className="game-title">D&D Game Map</h1>
          <div className="game-title-underline"></div>
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
              className="btn btn-test"
              onClick={testMoveCharacter}
            >
              🧪 Test Movement
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

        {/* Audio element for sound effects */}
        <audio
          ref={soundEffectRef}
          preload="auto"
          crossOrigin="anonymous"
        />
      </div>
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
    // Play dice rolling sound
    playSound('mixkit-game-show-suspense-waiting-667.wav');

    // Show rolling animation
    setDiceResult({
      type: diceType,
      total: 0,
      rolls: []
    });

    // Simulate rolling delay for better user experience
    setTimeout(() => {
      const result = rollDice(diceType);
      if (result) {
        setDiceResult({
          type: diceType,
          total: result.total,
          rolls: result.rolls
        });

        // Play success or failure sound based on the roll
        // For d20, consider 15+ a success, otherwise for other dice use 70% of max value
        const sides = parseInt(diceType.match(/d(\d+)/i)?.[1] || "20");
        const successThreshold = diceType === 'd20' ? 15 : Math.floor(sides * 0.7);

        if (result.total >= successThreshold) {
          playSound('mixkit-melodical-flute-music-notification-2310.wav');
        } else if (result.total === 1 || result.total < Math.floor(sides * 0.3)) {
          playSound('mixkit-sad-game-over-trombone-471.wav');
        }

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
    }, 1000); // 1 second delay for rolling animation
  }, [rollDice, waitingForDiceRoll, wsConnection, playSound]);

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

      // Also send the current game state to the DM
      sendGameState();
    }
  }, [pieces.length, wsConnection, sendGameState]);

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
            <button
              className="dice-btn d4-btn"
              onClick={() => handleDiceRoll('d4')}
              style={{
                backgroundImage: 'url(http://localhost:8001/assets/Effects/d4.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '60px',
                height: '60px',
                margin: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 2px #000'
              }}
            >
              d4
            </button>
            <button
              className="dice-btn d6-btn"
              onClick={() => handleDiceRoll('d6')}
              style={{
                backgroundImage: 'url(http://localhost:8001/assets/Effects/d6.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '60px',
                height: '60px',
                margin: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 2px #000'
              }}
            >
              d6
            </button>
            <button
              className="dice-btn d8-btn"
              onClick={() => handleDiceRoll('d8')}
              style={{
                backgroundImage: 'url(http://localhost:8001/assets/Effects/d8.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '60px',
                height: '60px',
                margin: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 2px #000'
              }}
            >
              d8
            </button>
            <button
              className="dice-btn d10-btn"
              onClick={() => handleDiceRoll('d10')}
              style={{
                backgroundImage: 'url(http://localhost:8001/assets/Effects/d10.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '60px',
                height: '60px',
                margin: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 2px #000'
              }}
            >
              d10
            </button>
            <button
              className="dice-btn d12-btn"
              onClick={() => handleDiceRoll('d12')}
              style={{
                backgroundImage: 'url(http://localhost:8001/assets/Effects/d12.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '60px',
                height: '60px',
                margin: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 2px #000'
              }}
            >
              d12
            </button>
            <button
              className="dice-btn d20-btn"
              onClick={() => handleDiceRoll('d20')}
              style={{
                backgroundImage: 'url(http://localhost:8001/assets/Effects/d20.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '60px',
                height: '60px',
                margin: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 2px #000'
              }}
            >
              d20
            </button>
            <button
              className="dice-btn d6-btn"
              onClick={() => handleDiceRoll('2d6')}
              style={{
                backgroundImage: 'url(http://localhost:8001/assets/Effects/2d6.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '60px',
                height: '60px',
                margin: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 2px #000'
              }}
            >
              2d6
            </button>
          </div>

          {diceResult && (
            <div className="dice-result" style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '15px',
              borderRadius: '10px',
              margin: '10px 0',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
              animation: diceResult.total === 0 ? 'pulse 1s infinite' : 'none'
            }}>
              {diceResult.total === 0 ? (
                <div className="rolling-animation" style={{
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  <p>Rolling {diceResult.type}...</p>
                  <div className="spinner" style={{
                    display: 'inline-block',
                    width: '30px',
                    height: '30px',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    borderTop: '4px solid #fff',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
              ) : (
                <>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#fff',
                    textAlign: 'center',
                    margin: '5px 0'
                  }}>
                    <strong>{diceResult.type} Roll:</strong> {diceResult.total}
                  </p>
                  {diceResult.rolls.length > 1 && (
                    <p className="individual-rolls" style={{
                      fontSize: '16px',
                      color: '#ddd',
                      textAlign: 'center'
                    }}>
                      Individual rolls: {diceResult.rolls.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <button
            className="btn btn-close"
            onClick={() => setShowDicePanel(false)}
            style={{
              backgroundColor: '#6d071a',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Close
          </button>
        </div>
      )}

      <div className="game-panels">
        <div className="narration-panel">
          <h3>Dungeon Master</h3>
          <p>{narration}</p>

          {!aiControlled && (
            <button
              className="btn btn-ai-control"
              onClick={handleAIControl}
              disabled={pieces.length === 0}
            >
              Let AI Take Control {pieces.length === 0 ? "(Add avatars first)" : ""}
            </button>
          )}

          {/* Debug button to force enable DM chat */}
          {!aiControlled && (
            <button
              className="btn btn-debug"
              onClick={() => setAiControlled(true)}
              style={{ marginTop: '10px', backgroundColor: '#555' }}
            >
              Debug: Force Enable DM Chat
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
