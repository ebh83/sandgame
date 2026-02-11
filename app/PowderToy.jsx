'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// Material types with their properties
const MATERIALS = {
  EMPTY: 0,
  SAND: 1,
  WATER: 2,
  STONE: 3,
  FIRE: 4,
  WOOD: 5,
  OIL: 6,
  SALT: 7,
  GUNPOWDER: 8,
  LAVA: 9,
  ICE: 10,
  STEAM: 11,
  SMOKE: 12,
  ACID: 13,
  PLANT: 14,
  EMBER: 15,
};

const MATERIAL_CONFIG = {
  [MATERIALS.EMPTY]: { name: 'Eraser', color: null, density: 0, isLiquid: false, isGas: false, isPowder: false },
  [MATERIALS.SAND]: { name: 'Sand', color: [224, 188, 128], density: 3, isLiquid: false, isGas: false, isPowder: true },
  [MATERIALS.WATER]: { name: 'Water', color: [50, 120, 200], density: 2, isLiquid: true, isGas: false, isPowder: false },
  [MATERIALS.STONE]: { name: 'Stone', color: [128, 128, 128], density: 10, isLiquid: false, isGas: false, isPowder: false, isStatic: true },
  [MATERIALS.FIRE]: { name: 'Fire', color: [255, 100, 20], density: 0, isLiquid: false, isGas: true, isPowder: false, lifetime: 30 },
  [MATERIALS.WOOD]: { name: 'Wood', color: [139, 90, 43], density: 10, isLiquid: false, isGas: false, isPowder: false, isStatic: true, flammable: true },
  [MATERIALS.OIL]: { name: 'Oil', color: [80, 60, 20], density: 1, isLiquid: true, isGas: false, isPowder: false, flammable: true },
  [MATERIALS.SALT]: { name: 'Salt', color: [240, 240, 245], density: 3, isLiquid: false, isGas: false, isPowder: true, dissolves: true },
  [MATERIALS.GUNPOWDER]: { name: 'Gunpowder', color: [60, 60, 60], density: 3, isLiquid: false, isGas: false, isPowder: true, explosive: true },
  [MATERIALS.LAVA]: { name: 'Lava', color: [255, 80, 0], density: 4, isLiquid: true, isGas: false, isPowder: false, hot: true },
  [MATERIALS.ICE]: { name: 'Ice', color: [180, 220, 255], density: 10, isLiquid: false, isGas: false, isPowder: false, isStatic: true, cold: true },
  [MATERIALS.STEAM]: { name: 'Steam', color: [200, 200, 220], density: 0, isLiquid: false, isGas: true, isPowder: false, lifetime: 100 },
  [MATERIALS.SMOKE]: { name: 'Smoke', color: [80, 80, 80], density: 0, isLiquid: false, isGas: true, isPowder: false, lifetime: 80 },
  [MATERIALS.ACID]: { name: 'Acid', color: [120, 255, 80], density: 2, isLiquid: true, isGas: false, isPowder: false, corrosive: true },
  [MATERIALS.PLANT]: { name: 'Plant', color: [34, 139, 34], density: 10, isLiquid: false, isGas: false, isPowder: false, isStatic: true, flammable: true, grows: true },
  [MATERIALS.EMBER]: { name: 'Ember', color: [255, 150, 50], density: 3, isLiquid: false, isGas: false, isPowder: true, hot: true, lifetime: 60 },
};

const MATERIAL_CATEGORIES = [
  { name: 'Basics', materials: [MATERIALS.SAND, MATERIALS.WATER, MATERIALS.STONE, MATERIALS.EMPTY] },
  { name: 'Nature', materials: [MATERIALS.WOOD, MATERIALS.PLANT, MATERIALS.ICE] },
  { name: 'Fire & Heat', materials: [MATERIALS.FIRE, MATERIALS.LAVA, MATERIALS.OIL, MATERIALS.GUNPOWDER] },
  { name: 'Special', materials: [MATERIALS.ACID, MATERIALS.SALT, MATERIALS.STEAM, MATERIALS.SMOKE] },
];

// Grid dimensions
const GRID_WIDTH = 300;
const GRID_HEIGHT = 200;
const CELL_SIZE = 4;

export default function PowderToy() {
  const canvasRef = useRef(null);
  const gridRef = useRef(null);
  const lifetimeRef = useRef(null);
  const animationRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const lastMousePosRef = useRef({ x: -1, y: -1 });

  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS.SAND);
  const [brushSize, setBrushSize] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  // Initialize grid
  useEffect(() => {
    gridRef.current = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
    lifetimeRef.current = new Int16Array(GRID_WIDTH * GRID_HEIGHT);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = GRID_WIDTH * CELL_SIZE;
      canvas.height = GRID_HEIGHT * CELL_SIZE;
    }
  }, []);

  const getIndex = useCallback((x, y) => y * GRID_WIDTH + x, []);

  const isInBounds = useCallback((x, y) => x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT, []);

  const getCell = useCallback((x, y) => {
    if (!isInBounds(x, y)) return MATERIALS.STONE; // Treat out of bounds as stone
    return gridRef.current[getIndex(x, y)];
  }, [getIndex, isInBounds]);

  const setCell = useCallback((x, y, material) => {
    if (!isInBounds(x, y)) return;
    const idx = getIndex(x, y);
    gridRef.current[idx] = material;
    if (MATERIAL_CONFIG[material].lifetime) {
      lifetimeRef.current[idx] = MATERIAL_CONFIG[material].lifetime + Math.floor(Math.random() * 20);
    } else {
      lifetimeRef.current[idx] = 0;
    }
  }, [getIndex, isInBounds]);

  const swapCells = useCallback((x1, y1, x2, y2) => {
    const idx1 = getIndex(x1, y1);
    const idx2 = getIndex(x2, y2);
    const temp = gridRef.current[idx1];
    const tempLife = lifetimeRef.current[idx1];
    gridRef.current[idx1] = gridRef.current[idx2];
    lifetimeRef.current[idx1] = lifetimeRef.current[idx2];
    gridRef.current[idx2] = temp;
    lifetimeRef.current[idx2] = tempLife;
  }, [getIndex]);

  const addColorVariation = useCallback((baseColor, variation = 15) => {
    return baseColor.map(c => Math.max(0, Math.min(255, c + Math.floor(Math.random() * variation * 2) - variation)));
  }, []);

  // Physics update for a single cell
  const updateCell = useCallback((x, y, processed) => {
    const material = getCell(x, y);
    if (material === MATERIALS.EMPTY) return;

    const idx = getIndex(x, y);
    const config = MATERIAL_CONFIG[material];

    // Mark as processed
    processed.add(idx);

    // Handle lifetime (fire, steam, smoke, ember)
    if (config.lifetime) {
      lifetimeRef.current[idx]--;
      if (lifetimeRef.current[idx] <= 0) {
        if (material === MATERIALS.FIRE || material === MATERIALS.EMBER) {
          // Fire/ember might turn to smoke
          if (Math.random() < 0.3) {
            setCell(x, y, MATERIALS.SMOKE);
          } else {
            setCell(x, y, MATERIALS.EMPTY);
          }
        } else {
          setCell(x, y, MATERIALS.EMPTY);
        }
        return;
      }
    }

    // === REACTIONS ===

    // Fire spreads and burns
    if (material === MATERIALS.FIRE || material === MATERIALS.EMBER || material === MATERIALS.LAVA) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          const neighbor = getCell(nx, ny);
          const neighborConfig = MATERIAL_CONFIG[neighbor];

          if (neighborConfig && neighborConfig.flammable && Math.random() < 0.05) {
            if (neighbor === MATERIALS.GUNPOWDER) {
              // Explosion!
              for (let ex = -3; ex <= 3; ex++) {
                for (let ey = -3; ey <= 3; ey++) {
                  if (Math.random() < 0.7) {
                    const explosionMat = Math.random() < 0.5 ? MATERIALS.FIRE : MATERIALS.EMBER;
                    setCell(nx + ex, ny + ey, explosionMat);
                  }
                }
              }
            } else {
              setCell(nx, ny, Math.random() < 0.7 ? MATERIALS.FIRE : MATERIALS.EMBER);
            }
          }

          // Lava + water = stone + steam
          if (material === MATERIALS.LAVA && neighbor === MATERIALS.WATER) {
            setCell(nx, ny, MATERIALS.STEAM);
            if (Math.random() < 0.3) {
              setCell(x, y, MATERIALS.STONE);
            }
          }

          // Fire/lava melts ice
          if ((material === MATERIALS.FIRE || material === MATERIALS.LAVA) && neighbor === MATERIALS.ICE) {
            setCell(nx, ny, MATERIALS.WATER);
          }
        }
      }
    }

    // Water interactions
    if (material === MATERIALS.WATER) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          const neighbor = getCell(nx, ny);

          // Water + salt = salt dissolves
          if (neighbor === MATERIALS.SALT && Math.random() < 0.1) {
            setCell(nx, ny, MATERIALS.WATER);
          }

          // Water near ice might freeze
          if (neighbor === MATERIALS.ICE && Math.random() < 0.01) {
            setCell(x, y, MATERIALS.ICE);
            return;
          }

          // Water grows plants
          if (neighbor === MATERIALS.PLANT && Math.random() < 0.02) {
            // Find empty space near plant to grow
            const growDirs = [[0, -1], [-1, 0], [1, 0]];
            const dir = growDirs[Math.floor(Math.random() * growDirs.length)];
            const gx = nx + dir[0];
            const gy = ny + dir[1];
            if (getCell(gx, gy) === MATERIALS.EMPTY) {
              setCell(gx, gy, MATERIALS.PLANT);
              if (Math.random() < 0.5) {
                setCell(x, y, MATERIALS.EMPTY); // Consume water
              }
            }
          }
        }
      }
    }

    // Acid dissolves things
    if (material === MATERIALS.ACID) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          const neighbor = getCell(nx, ny);

          if (neighbor !== MATERIALS.EMPTY && neighbor !== MATERIALS.ACID && neighbor !== MATERIALS.STONE && Math.random() < 0.05) {
            setCell(nx, ny, MATERIALS.EMPTY);
            if (Math.random() < 0.3) {
              setCell(x, y, MATERIALS.SMOKE);
            }
            return;
          }
        }
      }
    }

    // === MOVEMENT ===

    if (config.isStatic) return;

    const below = getCell(x, y + 1);
    const belowConfig = MATERIAL_CONFIG[below];

    // Gas rises
    if (config.isGas) {
      const above = getCell(x, y - 1);
      const aboveConfig = MATERIAL_CONFIG[above];
      
      // Move up if possible
      if (above === MATERIALS.EMPTY || (aboveConfig && !aboveConfig.isGas && aboveConfig.density < config.density)) {
        if (!processed.has(getIndex(x, y - 1))) {
          swapCells(x, y, x, y - 1);
          return;
        }
      }
      
      // Drift sideways
      const dir = Math.random() < 0.5 ? -1 : 1;
      const sideUp = getCell(x + dir, y - 1);
      if (sideUp === MATERIALS.EMPTY && !processed.has(getIndex(x + dir, y - 1))) {
        swapCells(x, y, x + dir, y - 1);
        return;
      }
      
      // Random horizontal drift
      if (Math.random() < 0.3) {
        const side = getCell(x + dir, y);
        if (side === MATERIALS.EMPTY && !processed.has(getIndex(x + dir, y))) {
          swapCells(x, y, x + dir, y);
        }
      }
      return;
    }

    // Powder and liquid falls
    if (config.isPowder || config.isLiquid) {
      // Fall straight down
      if (below === MATERIALS.EMPTY || (belowConfig && !belowConfig.isStatic && belowConfig.density < config.density && !belowConfig.isGas)) {
        if (!processed.has(getIndex(x, y + 1))) {
          swapCells(x, y, x, y + 1);
          return;
        }
      }

      // Slide diagonally for powder
      if (config.isPowder) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const diagBelow = getCell(x + dir, y + 1);
        const side = getCell(x + dir, y);
        
        if (diagBelow === MATERIALS.EMPTY && (side === MATERIALS.EMPTY || MATERIAL_CONFIG[side].isLiquid)) {
          if (!processed.has(getIndex(x + dir, y + 1))) {
            swapCells(x, y, x + dir, y + 1);
            return;
          }
        }
        
        // Try other direction
        const diagBelow2 = getCell(x - dir, y + 1);
        const side2 = getCell(x - dir, y);
        if (diagBelow2 === MATERIALS.EMPTY && (side2 === MATERIALS.EMPTY || MATERIAL_CONFIG[side2].isLiquid)) {
          if (!processed.has(getIndex(x - dir, y + 1))) {
            swapCells(x, y, x - dir, y + 1);
            return;
          }
        }
      }

      // Liquid spreads horizontally
      if (config.isLiquid) {
        // Try diagonal first
        const dir = Math.random() < 0.5 ? -1 : 1;
        const diagBelow = getCell(x + dir, y + 1);
        if (diagBelow === MATERIALS.EMPTY && !processed.has(getIndex(x + dir, y + 1))) {
          swapCells(x, y, x + dir, y + 1);
          return;
        }
        
        const diagBelow2 = getCell(x - dir, y + 1);
        if (diagBelow2 === MATERIALS.EMPTY && !processed.has(getIndex(x - dir, y + 1))) {
          swapCells(x, y, x - dir, y + 1);
          return;
        }

        // Spread sideways
        const spreadDir = Math.random() < 0.5 ? -1 : 1;
        const side = getCell(x + spreadDir, y);
        if (side === MATERIALS.EMPTY && !processed.has(getIndex(x + spreadDir, y))) {
          swapCells(x, y, x + spreadDir, y);
          return;
        }
        
        const side2 = getCell(x - spreadDir, y);
        if (side2 === MATERIALS.EMPTY && !processed.has(getIndex(x - spreadDir, y))) {
          swapCells(x, y, x - spreadDir, y);
          return;
        }
      }
    }
  }, [getCell, setCell, swapCells, getIndex]);

  // Main simulation step
  const simulate = useCallback(() => {
    if (!gridRef.current) return;

    const processed = new Set();
    let count = 0;

    // Process from bottom to top, alternating left-right direction each row
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      const leftToRight = y % 2 === 0;
      for (let i = 0; i < GRID_WIDTH; i++) {
        const x = leftToRight ? i : GRID_WIDTH - 1 - i;
        const idx = getIndex(x, y);
        
        if (gridRef.current[idx] !== MATERIALS.EMPTY) {
          count++;
          if (!processed.has(idx)) {
            updateCell(x, y, processed);
          }
        }
      }
    }

    setParticleCount(count);
  }, [getIndex, updateCell]);

  // Draw the grid
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridRef.current) return;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    // Background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 15;     // R
      data[i + 1] = 15; // G
      data[i + 2] = 25; // B
      data[i + 3] = 255; // A
    }

    // Draw particles
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const material = gridRef.current[getIndex(x, y)];
        if (material === MATERIALS.EMPTY) continue;

        const config = MATERIAL_CONFIG[material];
        let color = config.color;

        if (!color) continue;

        // Add variation for visual interest
        let variation = 10;
        if (material === MATERIALS.FIRE) {
          variation = 50;
          color = [255, 50 + Math.random() * 150, Math.random() * 50];
        } else if (material === MATERIALS.LAVA) {
          variation = 30;
          color = [255, 50 + Math.random() * 80, Math.random() * 20];
        } else if (material === MATERIALS.WATER) {
          variation = 20;
        } else if (material === MATERIALS.EMBER) {
          color = [255, 100 + Math.random() * 100, 20];
        }

        const finalColor = addColorVariation(color, variation);

        // Draw cell (scaled by CELL_SIZE)
        for (let py = 0; py < CELL_SIZE; py++) {
          for (let px = 0; px < CELL_SIZE; px++) {
            const pixelX = x * CELL_SIZE + px;
            const pixelY = y * CELL_SIZE + py;
            const pixelIdx = (pixelY * canvas.width + pixelX) * 4;
            
            data[pixelIdx] = finalColor[0];
            data[pixelIdx + 1] = finalColor[1];
            data[pixelIdx + 2] = finalColor[2];
            data[pixelIdx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw grid lines if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= GRID_WIDTH; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_HEIGHT; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(canvas.width, y * CELL_SIZE);
        ctx.stroke();
      }
    }
  }, [getIndex, addColorVariation, showGrid]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      if (!isPaused) {
        simulate();
      }
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, simulate, draw]);

  // Mouse/touch handling
  const getGridPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.floor(((clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((clientY - rect.top) * scaleY) / CELL_SIZE);

    return { x, y };
  }, []);

  const drawBrush = useCallback((x, y) => {
    for (let dx = -brushSize; dx <= brushSize; dx++) {
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        // Circular brush
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (isInBounds(nx, ny)) {
            // For eraser, always erase
            if (selectedMaterial === MATERIALS.EMPTY) {
              setCell(nx, ny, MATERIALS.EMPTY);
            }
            // For other materials, only place in empty cells (with some randomness for natural look)
            else if (getCell(nx, ny) === MATERIALS.EMPTY && Math.random() < 0.7) {
              setCell(nx, ny, selectedMaterial);
            }
          }
        }
      }
    }
  }, [brushSize, selectedMaterial, isInBounds, setCell, getCell]);

  const interpolate = useCallback((x0, y0, x1, y1) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      drawBrush(x, y);

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }, [drawBrush]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isMouseDownRef.current = true;
    const pos = getGridPos(e);
    if (pos) {
      drawBrush(pos.x, pos.y);
      lastMousePosRef.current = pos;
    }
  }, [getGridPos, drawBrush]);

  const handleMouseMove = useCallback((e) => {
    if (!isMouseDownRef.current) return;
    e.preventDefault();
    const pos = getGridPos(e);
    if (pos) {
      if (lastMousePosRef.current.x >= 0) {
        interpolate(lastMousePosRef.current.x, lastMousePosRef.current.y, pos.x, pos.y);
      } else {
        drawBrush(pos.x, pos.y);
      }
      lastMousePosRef.current = pos;
    }
  }, [getGridPos, drawBrush, interpolate]);

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    lastMousePosRef.current = { x: -1, y: -1 };
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseUp]);

  const clearGrid = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.fill(MATERIALS.EMPTY);
      lifetimeRef.current.fill(0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
          Powder Toy
        </h1>
        <p className="text-center text-slate-400 mb-4 text-sm">Pour, burn, dissolve, and explode!</p>

        <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-slate-700/50 flex-shrink-0">
            <canvas
              ref={canvasRef}
              className="rounded-xl shadow-inner cursor-crosshair"
              style={{ maxWidth: '100%', height: 'auto', touchAction: 'none', imageRendering: 'pixelated' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
            />

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`px-6 py-2 rounded-lg font-medium transition-all shadow-lg ${
                  isPaused
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/25'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-yellow-500/25'
                } text-white`}
              >
                {isPaused ? '▶ Play' : '⏸ Pause'}
              </button>
              <button
                onClick={clearGrid}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/25"
              >
                ✕ Clear
              </button>
            </div>

            <div className="mt-3 text-center text-slate-400 text-sm">
              Particles: {particleCount.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-slate-700/50 w-full xl:w-96 flex-shrink-0">
            <h2 className="text-xl font-semibold text-white mb-4">Materials</h2>

            <div className="space-y-4">
              {MATERIAL_CATEGORIES.map((category) => (
                <div key={category.name}>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">{category.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.materials.map((material) => {
                      const config = MATERIAL_CONFIG[material];
                      const bgColor = config.color 
                        ? `rgb(${config.color[0]}, ${config.color[1]}, ${config.color[2]})`
                        : '#1a1a2e';
                      const isSelected = selectedMaterial === material;
                      const isEraser = material === MATERIALS.EMPTY;
                      
                      return (
                        <button
                          key={material}
                          onClick={() => setSelectedMaterial(material)}
                          className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-105'
                              : 'hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: isEraser ? '#333' : bgColor,
                            color: isEraser || (config.color && config.color[0] + config.color[1] + config.color[2] > 400) ? '#000' : '#fff',
                            border: isEraser ? '2px dashed #666' : 'none',
                          }}
                        >
                          {isEraser && <span>🧹</span>}
                          {config.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 flex justify-between">
                  <span>Brush Size</span>
                  <span className="text-orange-400">{brushSize}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full mt-1 accent-orange-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Show Grid</span>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    showGrid ? 'bg-orange-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      showGrid ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">💡 Try These!</h3>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Drop <span className="text-orange-400">Fire</span> on <span className="text-yellow-600">Oil</span> or <span className="text-amber-700">Wood</span></li>
                <li>• Pour <span className="text-blue-400">Water</span> on <span className="text-orange-500">Lava</span> to make <span className="text-gray-400">Stone</span></li>
                <li>• <span className="text-green-400">Acid</span> dissolves almost everything!</li>
                <li>• <span className="text-gray-600">Gunpowder</span> + <span className="text-orange-400">Fire</span> = 💥</li>
                <li>• <span className="text-blue-400">Water</span> helps <span className="text-green-500">Plants</span> grow</li>
                <li>• <span className="text-cyan-300">Ice</span> freezes nearby <span className="text-blue-400">Water</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>Click and drag to pour materials. Experiment with reactions!</p>
        </div>
      </div>
    </div>
  );
}
