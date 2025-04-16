/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Note: There are still some TypeScript errors in this file related to:
 * 1. The React import - a project configuration issue with allowSyntheticDefaultImports
 * 2. Some implicit 'any' type parameters in the component
 * 
 * These issues don't affect functionality but would need to be addressed in a 
 * future update by adding proper TypeScript configuration.
 */
import React from 'react';
import mapImage from '../assets/Map.png';
import seaMap from '../assets/Maps/SeaSomethingMap.jpg';
import gridlessMap from '../assets/Maps/GridlessMap.jpg';
import contrastBeforeMap from '../assets/Maps/Contrast-Before.jpg';
import contrastAfterMap from '../assets/Maps/Contrast-After.jpg';
import './GameMap.css';

const { useState, useRef, useEffect } = React;

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

const MAP_OPTIONS: MapOption[] = [
  {
    id: 'default',
    name: 'Default Map',
    image: mapImage,
    description: 'The original D&D campaign map',
    gridSize: {
      width: 5,
      height: 5
    },
    cellSize: 100
  },
  {
    id: 'sea',
    name: 'Coastal Adventure',
    image: seaMap,
    description: 'A seaside village with coastal areas',
    gridSize: {
      width: 8,
      height: 6
    },
    cellSize: 80
  },
  {
    id: 'gridless',
    name: 'Open Plains',
    image: gridlessMap,
    description: 'Wide open battle ground',
    gridSize: {
      width: 10,
      height: 8
    },
    cellSize: 60
  },
  {
    id: 'contrast-before',
    name: 'Ancient Ruins',
    image: contrastBeforeMap,
    description: 'Mysterious ruins with ancient magic',
    gridSize: {
      width: 7,
      height: 7
    },
    cellSize: 70
  },
  {
    id: 'contrast-after',
    name: 'Forest Encampment',
    image: contrastAfterMap,
    description: 'Forest campsite with tactical positions',
    gridSize: {
      width: 6,
      height: 5
    },
    cellSize: 90
  }
];

// Define types
interface Piece {
  id: string;
  x: number;
  y: number;
  color: string;
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

// Background map image
const MAP_WIDTH = 640;
const MAP_HEIGHT = 640;

const OBSTACLE_TERRAINS: TerrainType[] = ["water", "mountain"];

// Sample character pieces with different colors
const CHARACTER_COLORS = [
  "#FF5252", // Red
  "#4CAF50", // Green
  "#2196F3", // Blue
  "#FFC107", // Yellow
  "#9C27B0", // Purple
  "#FF9800", // Orange
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
  // State management
  const [selectedMap, setSelectedMap] = useState<MapOption>(MAP_OPTIONS[0]);
  const [map, setMap] = useState<Cell[][]>(createEmptyMap(
    selectedMap.gridSize.width, 
    selectedMap.gridSize.height, 
    selectedMap.cellSize
  ));
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [draggingPiece, setDraggingPiece] = useState<Piece | null>(null);
  const [nextPieceId, setNextPieceId] = useState(1);
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Create a new piece
  const createNewPiece = (x: number, y: number): Piece => {
    const newPiece: Piece = {
      id: `piece-${nextPieceId}`,
      x,
      y,
      color: CHARACTER_COLORS[nextPieceId % CHARACTER_COLORS.length],
      label: `P${nextPieceId}`,
      isDragging: false
    };
    
    setPieces((prevPieces: Piece[]) => [...prevPieces, newPiece]);
    setNextPieceId((prev: number) => prev + 1);
    return newPiece;
  };

  // Handle cell click to add new piece or move existing piece
  const handleCellClick = (x: number, y: number): void => {
    // If in placing mode, add a new piece
    if (isPlacingMode) {
      // Check if the cell is empty and not an obstacle
      if (!pieces.some((piece: Piece) => piece.x === x && piece.y === y) && !map[y][x].isObstacle) {
        createNewPiece(x, y);
        setIsPlacingMode(false); // Exit placing mode after placing a piece
      }
      return;
    }
    
    // If a piece is already selected, move it
    if (selectedPieceId) {
      setPieces((prevPieces: Piece[]) => prevPieces.map((piece: Piece) => 
        piece.id === selectedPieceId
          ? { ...piece, x, y, isDragging: false }
          : piece
      ));
      setSelectedPieceId(null);
    } else {
      // Check if we clicked on a piece
      const clickedPiece = pieces.find((piece: Piece) => piece.x === x && piece.y === y);
      
      if (clickedPiece) {
        // Select this piece for movement
        setSelectedPieceId(clickedPiece.id);
      }
    }
  };

  // Handle piece click
  const handlePieceClick = (e: React.MouseEvent, piece: Piece): void => {
    e.stopPropagation();
    
    if (selectedPieceId === piece.id) {
      // Deselect if already selected
      setSelectedPieceId(null);
    } else {
      // Select this piece
      setSelectedPieceId(piece.id);
    }
  };

  // Handle piece drag start
  const handlePieceDragStart = (e: React.MouseEvent, piece: Piece): void => {
    e.stopPropagation();
    
    // Start dragging this piece
    setPieces((prevPieces: Piece[]) => prevPieces.map((p: Piece) => 
      p.id === piece.id
        ? { ...p, isDragging: true }
        : p
    ));
    setDraggingPiece(piece);
    setSelectedPieceId(piece.id);
  };

  // Handle mouse move during drag
  const handleMouseMove = (e: React.MouseEvent): void => {
    if (!draggingPiece || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const offsetX = rect.left + window.scrollX + 10; // Add padding offset
    const offsetY = rect.top + window.scrollY + 10; // Add padding offset
    
    // Calculate grid position, accounting for gap between cells (4px)
    const cellWithGap = selectedMap.cellSize + 4; // Cell size plus gap
    const x = Math.floor((e.clientX - offsetX) / cellWithGap);
    const y = Math.floor((e.clientY - offsetY) / cellWithGap);
    
    // Ensure we're within grid bounds
    if (x >= 0 && x < selectedMap.gridSize.width && y >= 0 && y < selectedMap.gridSize.height) {
      setPieces((prevPieces: Piece[]) => prevPieces.map((p: Piece) => 
        p.id === draggingPiece.id
          ? { ...p, x, y }
          : p
      ));
    }
  };

  // Handle mouse up to end drag
  const handleMouseUp = (): void => {
    if (!draggingPiece) return;
    
    setPieces((prevPieces: Piece[]) => prevPieces.map((p: Piece) => 
      p.id === draggingPiece.id
        ? { ...p, isDragging: false }
        : p
    ));
    setDraggingPiece(null);
  };

  // Handle piece deletion
  const handleDeletePiece = (e: React.MouseEvent, piece: Piece): void => {
    e.stopPropagation();
    setPieces((prevPieces: Piece[]) => prevPieces.filter((p: Piece) => p.id !== piece.id));
    if (selectedPieceId === piece.id) {
      setSelectedPieceId(null);
    }
  };

  // Get cell class names based on cell properties
  const getCellClassName = (cell: Cell, x: number, y: number): string => {
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
  };

  // Get piece class names
  const getPieceClassName = (piece: Piece): string => {
    let classes = "piece";
    
    if (selectedPieceId === piece.id) {
      classes += " selected";
    }
    
    if (piece.isDragging) {
      classes += " dragging";
    }
    
    return classes;
  };

  // Add random piece function
  const addRandomPiece = (): void => {
    const emptyCells: {x: number, y: number}[] = [];
    
    for (let y = 0; y < selectedMap.gridSize.height; y++) {
      for (let x = 0; x < selectedMap.gridSize.width; x++) {
        if (!map[y][x].isObstacle && !pieces.some((p: Piece) => p.x === x && p.y === y)) {
          emptyCells.push({x, y});
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      createNewPiece(randomCell.x, randomCell.y);
    }
  };

  // Remove selected piece function
  const removeSelectedPiece = (): void => {
    if (selectedPieceId) {
      setPieces((prevPieces: Piece[]) => prevPieces.filter((p: Piece) => p.id !== selectedPieceId));
      setSelectedPieceId(null);
    }
  };

  // Toggle placing mode function
  const togglePlacingMode = (): void => {
    setIsPlacingMode(!isPlacingMode);
    // Deselect any selected piece when entering placing mode
    if (!isPlacingMode) {
      setSelectedPieceId(null);
    }
  };

  // Reset game function
  const resetGame = (): void => {
    setMap(createEmptyMap(
      selectedMap.gridSize.width, 
      selectedMap.gridSize.height, 
      selectedMap.cellSize
    ));
    setPieces([]);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setNextPieceId(1);
    setIsPlacingMode(false);
  };

  // Handle map selection
  const handleMapSelect = (mapOption: MapOption): void => {
    setSelectedMap(mapOption);
    
    // Create a new map with the selected map's grid size
    setMap(createEmptyMap(
      mapOption.gridSize.width, 
      mapOption.gridSize.height, 
      mapOption.cellSize
    ));
    
    // Reset game state
    setPieces([]);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setNextPieceId(1);
    setIsPlacingMode(false);
  };

  // Start game with selected map
  const startGame = (): void => {
    setGameStarted(true);
  };

  // Return to map selection
  const backToMapSelection = (): void => {
    setGameStarted(false);
    setPieces([]);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setNextPieceId(1);
    setIsPlacingMode(false);
    setShowMapSelector(false);
  };

  // Get cell style adjustments based on cell size
  const getCellStyle = (cell: Cell): React.CSSProperties => {
    return {
      width: selectedMap.cellSize,
      height: selectedMap.cellSize,
      backgroundColor: cell.isObstacle ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
    };
  };

  // Get piece style adjustments based on cell size
  const getPieceStyle = (piece: Piece): React.CSSProperties => {
    return {
      backgroundColor: piece.color,
      width: `${selectedMap.cellSize * 0.7}px`,
      height: `${selectedMap.cellSize * 0.7}px`,
      fontSize: selectedMap.cellSize < 70 ? '14px' : '18px',
    };
  };

  // Render the Map Selection Screen
  const renderMapSelectionScreen = () => {
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
        </div>
      </div>
    );
  };

  // Render the Game Interface
  const renderGameInterface = () => {
    return (
      <>
        <header className="game-header">
          <h1 className="game-title">D&D Game Map</h1>
          <p className="game-subtitle">
            Place and move your character tokens on the interactive game board
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
            >
              {isPlacingMode ? '✘ Cancel' : '✚ Place Token'}
            </button>
            
            <button 
              className="btn btn-random"
              onClick={addRandomPiece}
            >
              🎲 Random Token
            </button>
            
            <button 
              className="btn btn-remove"
              onClick={removeSelectedPiece}
              disabled={!selectedPieceId}
            >
              🗑️ Remove Token
            </button>
            
            <button 
              className="btn btn-reset"
              onClick={resetGame}
            >
              🔄 Reset Map
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
              <span className="status-placing">✓ Select any empty cell to place a new token</span>
            ) : selectedPieceId ? (
              <span className="status-selected">✓ Token selected - click on a cell to move it</span>
            ) : (
              <span>Select a token to move it or use the buttons above</span>
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
            }}
            onClick={(e) => {
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
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {map.flatMap((row: Cell[], y: number) =>
              row.map((cell: Cell, x: number) => (
                <div
                  key={`${x}-${y}`}
                  className={getCellClassName(cell, x, y)}
                  style={getCellStyle(cell)}
                >
                  {pieces.some((piece: Piece) => piece.x === x && piece.y === y) && (
                    pieces.filter((piece: Piece) => piece.x === x && piece.y === y).map((piece: Piece) => (
                      <div
                        key={piece.id}
                        className={getPieceClassName(piece)}
                        style={getPieceStyle(piece)}
                        onMouseDown={(e) => handlePieceDragStart(e, piece)}
                        onClick={(e) => handlePieceClick(e, piece)}
                        onDoubleClick={(e) => handleDeletePiece(e, piece)}
                        title={`${piece.label} (double-click to delete)`}
                      >
                        {piece.label}
                      </div>
                    ))
                  )}
                  {cell.isObstacle && (
                    <div className="obstacle-indicator">
                      ⛔
                    </div>
                  )}
                </div>
              ))
            )}
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
          <p>Hover over tokens to see their name • Double-click to remove a token</p>
        </footer>
      </>
    );
  };

  // Main render
  return (
    <div className="game-container">
      {!gameStarted ? renderMapSelectionScreen() : renderGameInterface()}
    </div>
  );
};

export default GameMap;
