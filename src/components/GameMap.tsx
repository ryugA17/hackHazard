import React, { useState, useRef, useEffect } from "react";
import mapImage from '../assets/Map.png';

type TerrainType = "grass" | "water" | "mountain" | "forest";

type Cell = {
  type: "fog" | "revealed";
  terrain: TerrainType;
  marker: string | null;
  isObstacle?: boolean;
  // Add coordinates for background image positioning
  bgX: number;
  bgY: number;
};

type Position = {
  x: number;
  y: number;
} | null;

const GRID_SIZE = 10;
const CELL_SIZE = 64; // Size of each cell in pixels
const PLAYER_MARKER = "P"; // Can be replaced with a player sprite
const VISION_RANGE = 1;

// Replace emoji markers with background image positioning
const MAP_IMAGE_URL = mapImage;
const MAP_WIDTH = 640; // Total width of your map image
const MAP_HEIGHT = 640; // Total height of your map image

const OBSTACLE_TERRAINS: TerrainType[] = ["water", "mountain"];

const getRandomTerrain = (): TerrainType => {
  const terrains: TerrainType[] = ["grass", "water", "mountain", "forest"];
  const weights = [0.5, 0.2, 0.15, 0.15];
  
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) {
      return terrains[i];
    }
  }
  return "grass";
};

const createEmptyMap = (): Cell[][] => {
  return Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => {
      const terrain = getRandomTerrain();
      return {
        type: "fog",
        terrain,
        marker: null,
        isObstacle: OBSTACLE_TERRAINS.includes(terrain),
        // Calculate background position based on grid coordinates
        bgX: -(x * CELL_SIZE),
        bgY: -(y * CELL_SIZE)
      };
    })
  );
};

const GameMap: React.FC = () => {
  const [map, setMap] = useState<Cell[][]>(createEmptyMap);
  const [playerPosition, setPlayerPosition] = useState<Position>(null);
  const [isMoving, setIsMoving] = useState(false);
  
  // Store the previous position for animation
  const prevPosition = useRef<Position>(null);

  const placeMarker = (x: number, y: number, marker: string | null) => {
    setMap(currentMap => {
      const newMap = [...currentMap];
      newMap[y] = [...newMap[y]];
      newMap[y][x] = { 
        ...newMap[y][x],
        type: "revealed", 
        marker 
      };
      return newMap;
    });
  };

  const revealCell = (x: number, y: number) => {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      setMap(currentMap => {
        const newMap = [...currentMap];
        newMap[y] = [...newMap[y]];
        newMap[y][x] = { 
          ...newMap[y][x],
          type: "revealed"
        };
        return newMap;
      });
    }
  };

  const revealAreaAroundPlayer = (centerX: number, centerY: number) => {
    for (let y = centerY - VISION_RANGE; y <= centerY + VISION_RANGE; y++) {
      for (let x = centerX - VISION_RANGE; x <= centerX + VISION_RANGE; x++) {
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          revealCell(x, y);
        }
      }
    }
  };

  const isValidMove = (x: number, y: number): boolean => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return false;
    }
    return !map[y][x].isObstacle;
  };

  const handleCellClick = (x: number, y: number) => {
    if (!isValidMove(x, y) || isMoving) {
      return;
    }

    if (playerPosition) {
      // Store the current position before updating
      prevPosition.current = playerPosition;
      setIsMoving(true);

      // Calculate path (for now, just direct movement)
      const path = [{ x, y }];
      
      // Animate through path
      moveAlongPath(path);
    } else {
      // First placement doesn't need animation
      placeMarker(x, y, PLAYER_MARKER);
      setPlayerPosition({ x, y });
      revealAreaAroundPlayer(x, y);
    }
  };

  const moveAlongPath = async (path: Position[]) => {
    const nextPosition = path[0];
    if (!nextPosition) return;

    // Update player position with animation
    setPlayerPosition(nextPosition);

    // Wait for animation to complete
    setTimeout(() => {
      if (prevPosition.current) {
        placeMarker(prevPosition.current.x, prevPosition.current.y, null);
      }
      placeMarker(nextPosition.x, nextPosition.y, PLAYER_MARKER);
      revealAreaAroundPlayer(nextPosition.x, nextPosition.y);
      setIsMoving(false);
    }, 300); // Match this with transition duration
  };

  const getCellStyle = (cell: Cell) => ({
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'relative' as const,
    backgroundImage: `url(${MAP_IMAGE_URL})`,
    backgroundPosition: `${cell.bgX}px ${cell.bgY}px`,
    backgroundSize: `${MAP_WIDTH}px ${MAP_HEIGHT}px`,
    border: '1px solid #333',
    cursor: cell.isObstacle ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: cell.type === "fog" ? 0.5 : 1,
  });

  const getPlayerStyle = () => {
    if (!playerPosition) return {};
    
    const baseStyle = {
      position: 'absolute' as const,
      width: `${CELL_SIZE}px`,
      height: `${CELL_SIZE}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '24px',
      textShadow: '2px 2px 0 #000',
      transition: 'all 0.3s ease-in-out',
      backgroundColor: '#4a90e2',
      borderRadius: '50%',
      zIndex: 100,
      left: `${playerPosition.x * CELL_SIZE}px`,
      top: `${playerPosition.y * CELL_SIZE}px`,
    };

    return baseStyle;
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div
        className="grid relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: '1px',
          padding: '10px',
          backgroundColor: '#333',
          borderRadius: '8px',
        }}
      >
        {map.flatMap((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCellClick(x, y)}
              style={getCellStyle(cell)}
            />
          ))
        )}
        {playerPosition && (
          <div
            className={`player-marker ${isMoving ? 'moving' : ''}`}
            style={getPlayerStyle()}
          >
            {PLAYER_MARKER}
          </div>
        )}
      </div>
      <div className="fixed bottom-4 left-4 bg-black p-4 rounded-lg border border-gray-700">
        <p className="text-white">
          Player Position: {playerPosition 
            ? `(${playerPosition.x}, ${playerPosition.y})` 
            : "Not placed"}
        </p>
      </div>
    </div>
  );
};

export default GameMap;
