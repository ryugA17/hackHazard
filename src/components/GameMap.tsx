import { Link } from 'react-router-dom';
import React from 'react';
import { DungeonMasterContext } from '../context/DungeonMasterContext';
import mapImage from '../assets/Map.png';
import boyAvatar from '../assets/avatars/boy.gif';
import girlAvatar from '../assets/avatars/girl.gif';
import robotAvatar from '../assets/avatars/robot.gif';
import foxboyAvatar from '../assets/avatars/foxboy.gif';
import foxgirlAvatar from '../assets/avatars/foxgirl.gif';
import backgroundMusic from '../assets/aizentheme.mp3';
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
}

// Temporary placeholder for missing images
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/x8AAuMB8DtXNJsAAAAASUVORK5CYII=';

const MAP_OPTIONS: MapOption[] = [
  {
    id: 'default',
    name: 'Default Map',
    image: mapImage,
    description: 'The original D&D campaign map',
    gridSize: { width: 5, height: 5 },
    cellSize: 100
  },
  {
    id: 'sea',
    name: 'Coastal Adventure',
    image: placeholderImage, // Temporarily use placeholder
    description: 'A seaside village with coastal areas',
    gridSize: { width: 8, height: 6 },
    cellSize: 80
  },
  {
    id: 'gridless',
    name: 'Open Plains',
    image: placeholderImage, // Temporarily use placeholder
    description: 'Wide open battle ground',
    gridSize: { width: 10, height: 8 },
    cellSize: 60
  },
  {
    id: 'contrast-before',
    name: 'Ancient Ruins',
    image: placeholderImage, // Temporarily use placeholder
    description: 'Mysterious ruins with ancient magic',
    gridSize: { width: 7, height: 7 },
    cellSize: 70
  },
  {
    id: 'contrast-after',
    name: 'Forest Encampment',
    image: placeholderImage, // Temporarily use placeholder
    description: 'Forest campsite with tactical positions',
    gridSize: { width: 6, height: 5 },
    cellSize: 90
  }
];

// Define types
interface Piece {
  id: string;
  x: number;
  y: number;
  avatar: string;
  label: string;
  isDragging: boolean;
}

type TerrainType = "grass" | "water" | "mountain" | "forest";

interface Cell {
  type: "fog" | "revealed";
  terrain: TerrainType;
  isObstacle?: boolean;
  // Add coordinates for background image positioning
  bgX: number;
  bgY: number;
}

// Constants
const VISION_RANGE = 2;
const MAX_PLAYERS = 5; // Set maximum number of players/tokens

// Background map image
const MAP_WIDTH = 640;
const MAP_HEIGHT = 640;

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

// Helper functions
const getRandomTerrain = (): TerrainType => {
  const terrains: TerrainType[] = ["grass", "water", "mountain", "forest"];
  const weights = [0.7, 0.1, 0.1, 0.1]; // More grass for playable area
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return terrains[i];
  }
  return "grass";
};

const createEmptyMap = (gridWidth: number, gridHeight: number, cellSize: number): Cell[][] => {
  return Array.from({ length: gridHeight }, (_, y) =>
    Array.from({ length: gridWidth }, (_, x) => {
      const terrain = getRandomTerrain();
      return {
        type: "revealed",
        terrain,
        isObstacle: OBSTACLE_TERRAINS.includes(terrain),
        // Calculate background position based on grid coordinates
        bgX: -(x * cellSize) % MAP_WIDTH,
        bgY: -(y * cellSize) % MAP_HEIGHT
      };
    })
  );
};

// Main component
const GameMap: React.FC = () => {
  const { issueReward } = React.useContext(DungeonMasterContext);
  const [showRewardModal, setShowRewardModal] = React.useState(false);
  const [currentReward, setCurrentReward] = React.useState<string>('');
  const [selectedMap, setSelectedMap] = React.useState<MapOption>(MAP_OPTIONS[0]);
  const [map, setMap] = React.useState<Cell[][]>(() => createEmptyMap(
    selectedMap.gridSize.width, 
    selectedMap.gridSize.height, 
    selectedMap.cellSize
  ));
  const [pieces, setPieces] = React.useState<Piece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = React.useState<string | null>(null);
  const [draggingPiece, setDraggingPiece] = React.useState<Piece | null>(null);
  const [nextPieceId, setNextPieceId] = React.useState(1);
  const [wsConnection, setWsConnection] = React.useState<WebSocket | null>(null);
  const [narration, setNarration] = React.useState<string>("");

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/game');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNarration(data.narration);
    };
    
    setWsConnection(ws);
    return () => ws.close();
  }, [map, pieces, wsConnection]);

  const sendGameState = useCallback(() => {
    if (wsConnection) {
      wsConnection.send(JSON.stringify({
        grid_cells: map,
        tokens: pieces,
        obstacles: getObstacles(),
        terrain: getTerrainMap()
      }));
    }
  }, [map, pieces, wsConnection]);

  // State management
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [showMusicError, setShowMusicError] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Memoize the creation of a new map when selecting a different map
  const createMap = useCallback((mapOption: MapOption) => {
    return createEmptyMap(
      mapOption.gridSize.width,
      mapOption.gridSize.height,
      mapOption.cellSize
    );
  }, []);
  
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
        createNewPiece(x, y);
        setIsPlacingMode(false); // Exit placing mode after placing a piece
      }
      return;
    }
    
    // If a piece is already selected, move it
    if (selectedPieceId) {
      // Check if the destination cell is valid (not an obstacle and no other piece)
      if (y < map.length && x < map[0].length && 
          !map[y][x].isObstacle && 
          !pieces.some((p: Piece) => p.x === x && p.y === y)) {
        setPieces((prevPieces: Piece[]) => prevPieces.map((piece: Piece) => 
          piece.id === selectedPieceId
            ? { ...piece, x, y, isDragging: false }
            : piece
        ));
        setSelectedPieceId(null);
      }
    } else {
      // Check if we clicked on a piece
      const clickedPiece = pieces.find((piece: Piece) => piece.x === x && piece.y === y);
      
      if (clickedPiece) {
        // Select this piece for movement
        setSelectedPieceId(clickedPiece.id);
      }
    }
  }, [isPlacingMode, pieces, selectedPieceId, map, createNewPiece]);

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
    if (selectedPieceId === piece.id) {
      setSelectedPieceId(null);
    }
  }, [selectedPieceId]);

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
    setMap(createMap(selectedMap));
    setPieces([]);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setNextPieceId(1);
    setIsPlacingMode(false);
  }, [selectedMap, createMap]);

  // Handle map selection
  const handleMapSelect = useCallback((mapOption: MapOption): void => {
    setSelectedMap(mapOption);
    
    // Create a new map with the selected map's grid size
    setMap(createMap(mapOption));
    
    // Reset game state
    setPieces([]);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setNextPieceId(1);
    setIsPlacingMode(false);
  }, [createMap]);

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
  
  // Start game with selected map
  const startGame = useCallback((): void => {
    setGameStarted(true);
    
    // Try to play background music when game starts
    setTimeout(() => {
      // Delayed attempt to play audio after component mounts
      if (audioRef.current) {
        audioRef.current.volume = 0.5; // Set volume to 50%
        playMusic();
      }
    }, 1000);
  }, [playMusic]);
  
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

  // Get cell style adjustments based on cell size
  const getCellStyle = useCallback((cell: Cell): React.CSSProperties => {
    return {
      width: selectedMap.cellSize,
      height: selectedMap.cellSize,
      backgroundColor: cell.isObstacle ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
    };
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
        <p className="game-subtitle">Select a map to begin your adventure</p>
        
        <div className="map-selection-grid">
          {MAP_OPTIONS.map(mapOption => (
            <div 
              key={mapOption.id} 
              className={`map-selection-card ${selectedMap.id === mapOption.id ? 'selected' : ''}`}
              onClick={() => handleMapSelect(mapOption)}
            >
              <div className="map-selection-preview" style={{ backgroundImage: `url(${mapOption.image})` }} />
              <div className="map-selection-info">
                <h2>{mapOption.name}</h2>
                <p>{mapOption.description}</p>
                <div className="map-selection-grid-info">
                  Grid: {mapOption.gridSize.width}×{mapOption.gridSize.height}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="map-selection-actions">
          <button 
            className="btn btn-start-game"
            onClick={startGame}
          >
            Start Game with {selectedMap.name}
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
  }, [handleMapSelect, selectedMap, startGame, toggleMusic, toggleMute, isMusicPlaying, isMusicMuted, showMusicError]);

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
              🔄 Reset Map
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
                {MAP_OPTIONS.map(mapOption => (
                  <div 
                    key={mapOption.id} 
                    className={`map-option ${selectedMap.id === mapOption.id ? 'selected' : ''}`}
                    onClick={() => handleMapSelect(mapOption)}
                  >
                    <div className="map-preview" style={{ backgroundImage: `url(${mapOption.image})` }} />
                    <div className="map-info">
                      <h4>{mapOption.name}</h4>
                      <p>{mapOption.description}</p>
                      <div className="map-grid-info">
                        Grid: {mapOption.gridSize.width}×{mapOption.gridSize.height}
                      </div>
                    </div>
                  </div>
                ))}
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
            {isPlacingMode ? (
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
              <h3>Color Guide:</h3>
              <ul>
                <li>Green tiles: Forests</li>
                <li>Blue tiles: Water (obstacle)</li>
                <li>Brown tiles: Mountains (obstacle)</li>
                <li>Light green: Grass</li>
              </ul>
              <button 
                className="tooltip-close"
                onClick={() => setShowTooltip(false)}
              >
                ✕
              </button>
            </div>
          )}
          
          <div
            ref={gridRef}
            className={`grid ${isPlacingMode ? 'cursor-crosshair' : draggingPiece ? 'cursor-grabbing' : ''}`}
            style={{
              gridTemplateColumns: `repeat(${selectedMap.gridSize.width}, ${selectedMap.cellSize}px)`,
              gridTemplateRows: `repeat(${selectedMap.gridSize.height}, ${selectedMap.cellSize}px)`,
              backgroundImage: `url(${selectedMap.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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
    showMapSelector, showTooltip, isMusicMuted,
    backToMapSelection, togglePlacingMode, addRandomPiece, removeSelectedPiece, 
    resetGame, handleMapSelect, gridClickHandler, handleMouseMove, handleMouseUp, toggleMusic, toggleMute
  ]);

  // Main render
  return (
    <div className="game-container">
      {!gameStarted ? renderMapSelectionScreen() : renderGameInterface()}
      <div className="narration-panel">
        <h3>Dungeon Master</h3>
        <p>{narration}</p>
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
    </div>
  );
};

export default GameMap;
