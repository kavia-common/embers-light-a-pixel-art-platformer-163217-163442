//
// World.js - defines tilemap, hazards, and interactables
//
import { TILE } from '../core/Physics';

function makeArray(w, h, fill) {
  return new Array(w * h).fill(fill);
}

function genDemoMap() {
  const width = 64;
  const height = 32;
  const data = makeArray(width, height, 0);

  // Ground
  for (let x = 0; x < width; x++) {
    data[(height - 3) * width + x] = 1;
    data[(height - 2) * width + x] = 1;
  }
  // Platforms
  for (let x = 8; x < 18; x++) data[20 * width + x] = 1;
  for (let x = 28; x < 40; x++) data[16 * width + x] = 1;
  for (let x = 48; x < 58; x++) data[12 * width + x] = 1;

  // Pillars
  for (let y = height - 4; y > 10; y--) {
    data[y * width + 26] = 1;
    data[y * width + 46] = 1;
  }

  return {
    width,
    height,
    data,
    solid: [1],
    palette: {
      0: '#1f1f26',
      1: '#2e2d32'
    }
  };
}

export function createInitialWorld() {
  const tiles = genDemoMap();
  const hazards = [
    // A rain zone
    { type: 'rain', x: 20 * TILE, y: 0, w: 10 * TILE, h: 40 * TILE, dps: 8 },
    // Wind corridor
    { type: 'wind', x: 40 * TILE, y: 0, w: 8 * TILE, h: 40 * TILE, forceX: -600, forceY: 0 },
    // Darkness basin
    { type: 'darkness', x: 0, y: 0, w: tiles.width * TILE, h: tiles.height * TILE, intensity: 0.6 },
  ];

  const braziers = [
    { id: 'brazier-1', x: 15 * TILE, y: (tiles.height - 5) * TILE, lit: false },
    { id: 'brazier-2', x: 35 * TILE, y: 15 * TILE, lit: false },
    { id: 'brazier-3', x: 55 * TILE, y: 11 * TILE, lit: false },
  ];

  const spawners = [
    { id: 'enemy-1', x: 34 * TILE, y: 14 * TILE, type: 'mote' },
    { id: 'enemy-2', x: 50 * TILE, y: 10 * TILE, type: 'mote' },
  ];

  return {
    tiles,
    hazards,
    braziers,
    spawners,
    gravity: 1600,
    camera: { x: 0, y: 0, w: 320, h: 180, scale: 3 },
    currentBiome: 'Ruined Lowlands',
    unlockedNodes: ['Ruined Lowlands'],
  };
}
