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
const { useState, useRef, useEffect } = React;
import mapImage from '../assets/Map.png';

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
const GRID_SIZE = 5; // Changed from 20 to 5 for smaller grid
const CELL_SIZE = 100; // Increased from 40 to 100 for bigger cells
const VISION_RANGE = 2;

// Background map image
const MAP_IMAGE_URL = mapImage;
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

const createEmptyMap = (): Cell[][] => {
  return Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => {
      const terrain = getRandomTerrain();
      return {
        type: "revealed",
        terrain,
        isObstacle: OBSTACLE_TERRAINS.includes(terrain),
        // Calculate background position based on grid coordinates
        bgX: -(x * CELL_SIZE) % MAP_WIDTH,
        bgY: -(y * CELL_SIZE) % MAP_HEIGHT
      };
    })
  );
};

// Main component
const GameMap: React.FC = () => {
  // State management
  const [map, setMap] = useState<Cell[][]>(createEmptyMap);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [draggingPiece, setDraggingPiece] = useState<Piece | null>(null);
  const [nextPieceId, setNextPieceId] = useState(1);
  const [isPlacingMode, setIsPlacingMode] = useState(false);
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
    const cellWithGap = CELL_SIZE + 4; // Cell size plus gap
    const x = Math.floor((e.clientX - offsetX) / cellWithGap);
    const y = Math.floor((e.clientY - offsetY) / cellWithGap);
    
    // Ensure we're within grid bounds
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
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
    
    setPieces(prevPieces => prevPieces.map(p => 
      p.id === draggingPiece.id
        ? { ...p, isDragging: false }
        : p
    ));
    setDraggingPiece(null);
  };

  // Handle piece deletion
  const handleDeletePiece = (e: React.MouseEvent, piece: Piece): void => {
    e.stopPropagation();
    setPieces(prevPieces => prevPieces.filter(p => p.id !== piece.id));
    if (selectedPieceId === piece.id) {
      setSelectedPieceId(null);
    }
  };

  // Cell styling
  const getCellStyle = (cell: Cell, x: number, y: number): React.CSSProperties => {
    const isSelected = selectedPieceId !== null && 
      pieces.some(p => p.id === selectedPieceId && p.x === x && p.y === y);
    
    return {
      width: CELL_SIZE,
      height: CELL_SIZE,
      position: 'relative',
      backgroundImage: `url(${MAP_IMAGE_URL})`,
      backgroundPosition: `${cell.bgX}px ${cell.bgY}px`,
      backgroundSize: `${MAP_WIDTH}px ${MAP_HEIGHT}px`,
      border: isSelected ? '3px solid white' : '3px solid #333', // Thicker border
      cursor: cell.isObstacle ? 'not-allowed' : 'pointer',
      opacity: cell.type === "fog" ? 0.5 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box', // Ensure border is included in size calculation
    };
  };

  // Piece styling
  const getPieceStyle = (piece: Piece): React.CSSProperties => {
    const isSelected = selectedPieceId === piece.id;
    
    return {
      position: 'absolute',
      width: '70%',
      height: '70%',
      backgroundColor: piece.color,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: '16px',
      cursor: 'grab',
      zIndex: isSelected || piece.isDragging ? 20 : 10,
      border: isSelected ? '2px solid white' : 'none',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      transition: piece.isDragging ? 'none' : 'all 0.2s',
    };
  };

  // Add random piece function
  const addRandomPiece = (): void => {
    const emptyCells: {x: number, y: number}[] = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!map[y][x].isObstacle && !pieces.some(p => p.x === x && p.y === y)) {
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
      setPieces(prevPieces => prevPieces.filter(p => p.id !== selectedPieceId));
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

  // Render
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl text-white">D&D Game Map</h1>
        
        <div className="flex items-center mb-4">
          <button 
            className={`px-4 py-2 text-white rounded mr-2 ${isPlacingMode ? 'bg-green-600' : 'bg-blue-600'}`}
            onClick={togglePlacingMode}
          >
            {isPlacingMode ? 'Cancel Placement' : 'Place New Token'}
          </button>
          
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
            onClick={addRandomPiece}
          >
            Add Random Piece
          </button>
          
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={removeSelectedPiece}
            disabled={!selectedPieceId}
          >
            Remove Selected Piece
          </button>
        </div>
        
        <div
          ref={gridRef}
          className="grid relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gap: '4px',
            padding: '10px',
            backgroundColor: '#333',
            borderRadius: '8px',
            cursor: isPlacingMode ? 'crosshair' : draggingPiece ? 'grabbing' : 'default',
          }}
          onClick={(e) => {
            if (!gridRef.current) return;
            
            const rect = gridRef.current.getBoundingClientRect();
            const offsetX = rect.left + window.scrollX + 10; // Add padding offset
            const offsetY = rect.top + window.scrollY + 10; // Add padding offset
            
            // Calculate position with gap between cells
            const cellWithGap = CELL_SIZE + 4;
            const x = Math.floor((e.clientX - offsetX) / cellWithGap);
            const y = Math.floor((e.clientY - offsetY) / cellWithGap);
            
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
              handleCellClick(x, y);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {map.flatMap((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                style={getCellStyle(cell, x, y)}
              >
                {pieces.some(piece => piece.x === x && piece.y === y) && (
                  pieces.filter(piece => piece.x === x && piece.y === y).map(piece => (
                    <div
                      key={piece.id}
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
              </div>
            ))
          )}
        </div>
        
        <div className="text-white mt-4">
          <p>Instructions:</p>
          <ul className="list-disc ml-5">
            <li>Click "Place New Token" then click on any empty cell to place a token</li>
            <li>Click on a piece to select it, then click on a cell to move it</li>
            <li>Drag and drop pieces to move them</li>
            <li>Double-click a piece to remove it</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameMap;
