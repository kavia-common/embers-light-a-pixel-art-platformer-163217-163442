import { TILE } from '../core/Physics';

function makeArray(w, h, fill) {
  return new Array(w * h).fill(fill);
}

/**
 * Generate a larger demo map for exploration.
 * New size: 160 x 96 tiles (was 64 x 32).
 * Adds multiple platform bands, pillars, and open spaces across the map.
 */
function genDemoMap() {
  const width = 160;
  const height = 96;
  const data = makeArray(width, height, 0);

  // Base ground: two solid layers near the bottom across entire width
  for (let x = 0; x < width; x++) {
    data[(height - 3) * width + x] = 1;
    data[(height - 2) * width + x] = 1;
  }

  // Several horizontal platform bands at different heights and regions
  const platforms = [
    { y: height - 8, x1: 8, x2: 40 },
    { y: height - 12, x1: 28, x2: 70 },
    { y: height - 16, x1: 60, x2: 95 },
    { y: height - 20, x1: 88, x2: 120 },
    { y: height - 24, x1: 112, x2: 150 },
    { y: 40, x1: 12, x2: 30 },
    { y: 32, x1: 36, x2: 52 },
    { y: 26, x1: 58, x2: 78 },
    { y: 22, x1: 82, x2: 98 },
    { y: 20, x1: 104, x2: 124 },
    { y: 18, x1: 128, x2: 152 }
  ];
  for (const p of platforms) {
    for (let x = p.x1; x <= p.x2; x++) data[p.y * width + x] = 1;
  }

  // Pillars to create verticality and obstacles
  const pillarXs = [26, 46, 76, 96, 116, 136];
  for (const px of pillarXs) {
    for (let y = height - 4; y > 12; y--) {
      data[y * width + px] = 1;
    }
  }

  return {
    width,
    height,
    data,
    solid: [1],
    palette: {
      0: '#242a38',  /* sky/empty - brighter than before */
      1: '#3a3a45'   /* solid - lighter than previous dark stone */
    }
  };
}

export function createInitialWorld() {
  const tiles = genDemoMap();

  // Expand hazards to cover more of the larger map with varied zones
  const hazards = [
    // A wide rain belt in the first third
    { type: 'rain', x: 20 * TILE, y: 0, w: 40 * TILE, h: tiles.height * TILE, dps: 8 },
    // Wind corridors at a couple of columns
    { type: 'wind', x: 80 * TILE, y: 0, w: 8 * TILE, h: tiles.height * TILE, forceX: -600, forceY: 0 },
    { type: 'wind', x: 120 * TILE, y: 0, w: 8 * TILE, h: tiles.height * TILE, forceX: 500, forceY: 0 },
    // Darkness covers whole map; intensity remains same so the UI slider still works consistently
    { type: 'darkness', x: 0, y: 0, w: tiles.width * TILE, h: tiles.height * TILE, intensity: 0.55 },
  ];

  // Scatter more braziers as checkpoints/restoration points across the map
  const braziers = [
    { id: 'brazier-1', x: 15 * TILE, y: (tiles.height - 5) * TILE, lit: false },
    { id: 'brazier-2', x: 35 * TILE, y: (tiles.height - 9) * TILE, lit: false },
    { id: 'brazier-3', x: 55 * TILE, y: (tiles.height - 13) * TILE, lit: false },
    { id: 'brazier-4', x: 85 * TILE, y: (tiles.height - 21) * TILE, lit: false },
    { id: 'brazier-5', x: 110 * TILE, y: 22 * TILE, lit: false },
    { id: 'brazier-6', x: 135 * TILE, y: 18 * TILE, lit: false },
    { id: 'brazier-7', x: 150 * TILE - 3 * TILE, y: (tiles.height - 6) * TILE, lit: false },
  ];

  // Additional enemy spawners to populate the expanded space
  const spawners = [
    { id: 'enemy-1', x: 34 * TILE, y: (tiles.height - 10) * TILE, type: 'mote' },
    { id: 'enemy-2', x: 50 * TILE, y: (tiles.height - 14) * TILE, type: 'mote' },
    { id: 'enemy-3', x: 78 * TILE, y: (tiles.height - 18) * TILE, type: 'mote' },
    { id: 'enemy-4', x: 96 * TILE, y: 26 * TILE, type: 'mote' },
    { id: 'enemy-5', x: 120 * TILE, y: 22 * TILE, type: 'mote' },
    { id: 'enemy-6', x: 142 * TILE, y: (tiles.height - 8) * TILE, type: 'mote' },
  ];

  return {
    tiles,
    hazards,
    braziers,
    spawners,
    gravity: 1600,
    // Camera pixel dimensions unchanged; clamping logic in Game.js already uses tiles width/height
    camera: { x: 0, y: 0, w: 320, h: 180, scale: 3 },
    currentBiome: 'Ruined Lowlands',
    unlockedNodes: ['Ruined Lowlands'],
  };
}
