import { TILE } from '../core/Physics';

/**
 * World generation with interconnected biomes (Metroidvania-style).
 * Biomes stitched side-by-side with vertical layering and ability-gated paths,
 * shortcuts, and optional secrets. The rendering and physics remain tile-based
 * and fully compatible with existing systems.
 */

function makeArray(w, h, fill) {
  return new Array(w * h).fill(fill);
}

function stampHLine(data, width, y, x1, x2, id) {
  for (let x = Math.max(0, x1); x <= Math.min(width - 1, x2); x++) {
    data[y * width + x] = id;
  }
}
function stampVLine(data, width, x, y1, y2, id) {
  for (let y = Math.max(0, y1); y <= Math.min(y2, Math.floor(data.length / width) - 1); y++) {
    data[y * width + x] = id;
  }
}
function stampRect(data, width, x1, y1, x2, y2, id) {
  for (let y = y1; y <= y2; y++) {
    stampHLine(data, width, y, x1, x2, id);
  }
}

/**
 * Procedurally compose four themed zones across a single tilemap:
 * - Ruined Lowlands (start)
 * - Flooded Ruins (requires dash to cross wind/rain tunnel)
 * - Old Forest (requires wall-jump to climb)
 * - Sunken Catacombs (requires double-jump to navigate shafts)
 *
 * Gates:
 * - Gate tiles are "solid" until the player has the required ability.
 * - We color-code palette entries for gate tiles to visually signal gating.
 *
 * Secrets and shortcuts:
 * - Secret passages use "cracked" tiles that are not solid; look distinct.
 * - Shortcuts loop back to earlier areas; some unlock only after brazier count.
 */
function genMetroidvaniaMap() {
  const width = 192;
  const height = 112;
  const data = makeArray(width, height, 0);

  // Tile IDs
  const EMPTY = 0;
  const SOLID = 1;
  const LOWLANDS = 2;     // cosmetic floor type
  const FOREST = 3;       // cosmetic floor
  const CATACOMB = 4;     // cosmetic floor
  const GATE_DASH = 5;    // solid until dash
  const GATE_WALL = 6;    // solid until wall-jump
  const GATE_DOUBLE = 7;  // solid until double-jump
  const SECRET = 8;       // non-solid but visually "cracked rock"

  // Base ground band at bottom
  stampRect(data, width, 0, height - 3, width - 1, height - 1, SOLID);

  // Partition zones horizontally:
  // [0..60): Lowlands | [60..112): Flooded | [112..156): Forest | [156..192): Catacombs
  const lowR = { x1: 0, x2: 60, y1: 0, y2: height - 1 };
  const floodR = { x1: 60, x2: 112, y1: 0, y2: height - 1 };
  const forestR = { x1: 112, x2: 156, y1: 0, y2: height - 1 };
  const cataR = { x1: 156, x2: width - 1, y1: 0, y2: height - 1 };

  // Fill floors/platforms per zone
  // Lowlands - gentle stepping platforms
  for (let step = 0; step < 4; step++) {
    const y = height - 8 - step * 6;
    stampHLine(data, width, y, lowR.x1 + 6 + step * 6, lowR.x2 - 4 - step * 5, LOWLANDS);
  }
  // Flooded Ruins - platforms with gaps and wind/rain corridor
  stampHLine(data, width, height - 10, floodR.x1 + 4, floodR.x2 - 4, SOLID);
  stampHLine(data, width, height - 18, floodR.x1 + 8, floodR.x2 - 10, LOWLANDS);
  // Tall columns
  stampVLine(data, width, floodR.x1 + 14, height - 11, height - 30, SOLID);
  stampVLine(data, width, floodR.x1 + 30, height - 11, height - 36, SOLID);
  // Dash gate corridor at mid-height
  stampRect(data, width, floodR.x1 + 48, height - 28, floodR.x1 + 52, height - 20, GATE_DASH);

  // Forest - vertical climb with alcoves and a wall-jump gate "thicket"
  for (let y = height - 12; y > height - 56; y -= 7) {
    stampHLine(data, width, y, forestR.x1 + 6, forestR.x2 - 6, FOREST);
  }
  // Wall gate barrier midway up
  stampVLine(data, width, forestR.x1 + 20, height - 12, height - 48, GATE_WALL);

  // Catacombs - shafts and ledges, with a double-jump gate arch
  stampHLine(data, width, height - 12, cataR.x1 + 6, cataR.x2 - 6, CATACOMB);
  stampHLine(data, width, height - 22, cataR.x1 + 12, cataR.x2 - 12, CATACOMB);
  stampVLine(data, width, cataR.x1 + 18, height - 13, height - 50, SOLID);
  // Double jump arch near upper area
  stampRect(data, width, cataR.x1 + 28, height - 44, cataR.x1 + 30, height - 36, GATE_DOUBLE);

  // Secret passages (cracked, passable): connect Lowlands high ledge to Forest lower ledge
  stampRect(data, width, lowR.x2 - 2, height - 26, lowR.x2, height - 22, SECRET);
  stampRect(data, width, forestR.x1, height - 26, forestR.x1 + 1, height - 22, SECRET);

  // A shortcut loopback from Catacombs to Flooded via secret underpass
  stampRect(data, width, floodR.x2 - 2, height - 6, floodR.x2, height - 4, SECRET);
  stampRect(data, width, cataR.x1, height - 6, cataR.x1 + 1, height - 4, SECRET);

  return {
    width,
    height,
    data,
    solid: [SOLID, LOWLANDS, FOREST, CATACOMB, GATE_DASH, GATE_WALL, GATE_DOUBLE], // SECRET not solid
    palette: {
      [EMPTY]: '#242a38',
      [SOLID]: '#3a3a45',
      [LOWLANDS]: '#3e3d48',
      [FOREST]: '#2f3b2e',
      [CATACOMB]: '#2f2b3b',
      [GATE_DASH]: '#5b3a24',     // amber-brown: dash gate
      [GATE_WALL]: '#2c4a5a',     // teal: wall gate
      [GATE_DOUBLE]: '#5a2c5a',   // violet: double jump gate
      [SECRET]: '#45414f'         // cracked rock (non-solid)
    },
    gates: {
      GATE_DASH,
      GATE_WALL,
      GATE_DOUBLE,
      SECRET
    },
    zones: [
      { name: 'Ruined Lowlands', rect: lowR },
      { name: 'Flooded Ruins', rect: floodR },
      { name: 'Old Forest', rect: forestR },
      { name: 'Sunken Catacombs', rect: cataR }
    ],
    // Traversal graph nodes (for map and unlock list)
    nodes: [
      { id: 'lowlands-start', name: 'Ruined Lowlands', x: 10, y: height - 6 },
      { id: 'flooded-entrance', name: 'Flooded Ruins', x: floodR.x1 + 6, y: height - 10 },
      { id: 'forest-base', name: 'Old Forest', x: forestR.x1 + 6, y: height - 12 },
      { id: 'catacombs-gate', name: 'Sunken Catacombs', x: cataR.x1 + 8, y: height - 12 }
    ],
    // Physical gate placements for UI and logic (rect in pixels, requirement string)
    gateRects: [
      {
        id: 'gate-dash-1',
        rect: { x: (floodR.x1 + 48) * TILE, y: (height - 28) * TILE, w: 4 * TILE, h: 8 * TILE },
        requires: 'dash',
        hint: 'Gale Tunnel'
      },
      {
        id: 'gate-wall-1',
        rect: { x: (forestR.x1 + 20) * TILE, y: (height - 48) * TILE, w: TILE, h: 36 * TILE },
        requires: 'wallJump',
        hint: 'Overgrown Thicket'
      },
      {
        id: 'gate-double-1',
        rect: { x: (cataR.x1 + 28) * TILE, y: (height - 44) * TILE, w: 2 * TILE, h: 8 * TILE },
        requires: 'doubleJump',
        hint: 'Echo Arch'
      }
    ],
    // Secrets metadata for possible future UI highlighting
    secretRects: [
      { id: 'secret-pass-1', rect: { x: (lowR.x2 - 2) * TILE, y: (height - 26) * TILE, w: 3 * TILE, h: 4 * TILE } },
      { id: 'secret-pass-2', rect: { x: floodR.x2 * TILE - 2 * TILE, y: (height - 6) * TILE, w: 2 * TILE, h: 2 * TILE } }
    ]
  };
}

/**
 * PUBLIC_INTERFACE
 * Check if a gate is currently passable given player abilities.
 */
export function isGatePassable(gateTileId, tiles, playerAbilities) {
  /** Returns true if the specified gate tile should be considered non-solid. */
  const g = tiles.gates || {};
  if (gateTileId === g.GATE_DASH) return !!playerAbilities?.dash;
  if (gateTileId === g.GATE_WALL) return !!playerAbilities?.wallJump;
  if (gateTileId === g.GATE_DOUBLE) return !!playerAbilities?.doubleJump;
  // SECRET is already non-solid
  return true;
}

/**
 * PUBLIC_INTERFACE
 * Returns a list of map nodes that should be unlocked based on progress.
 * For now, unlocked zones are determined by reaching adjacent biomes
 * and by lighting braziers (handled via player progression).
 */
export function computeUnlockedNodes(world) {
  /** Derive unlocked node names; simple additive reveal by presence in world.unlockedNodes. */
  return Array.from(new Set(world.unlockedNodes || [])).slice();
}

export function createInitialWorld() {
  const tiles = genMetroidvaniaMap();

  // Hazards themed per zone extents
  const hazards = [
    // Lowlands light darkness
    { type: 'darkness', x: 0, y: 0, w: 60 * TILE, h: tiles.height * TILE, intensity: 0.55 },
    // Flooded: rain band and cross-wind around dash corridor
    { type: 'rain', x: 64 * TILE, y: 0, w: 40 * TILE, h: tiles.height * TILE, dps: 8 },
    { type: 'wind', x: 92 * TILE, y: 0, w: 6 * TILE, h: tiles.height * TILE, forceX: -600, forceY: 0 },
    // Forest: pockets of wind updrafts
    { type: 'wind', x: 124 * TILE, y: 0, w: 4 * TILE, h: tiles.height * TILE, forceX: 0, forceY: -200 },
    // Catacombs: heavier darkness
    { type: 'darkness', x: 156 * TILE, y: 0, w: (tiles.width - 156) * TILE, h: tiles.height * TILE, intensity: 0.65 }
  ];

  // Place braziers as progression anchors in each zone
  const braziers = [
    { id: 'b-low-1', x: 10 * TILE, y: (tiles.height - 5) * TILE, lit: false },
    { id: 'b-flood-1', x: 72 * TILE, y: (tiles.height - 11) * TILE, lit: false },
    { id: 'b-forest-1', x: 120 * TILE, y: (tiles.height - 19) * TILE, lit: false },
    { id: 'b-forest-2', x: 132 * TILE, y: (tiles.height - 33) * TILE, lit: false },
    { id: 'b-cata-1', x: 166 * TILE, y: (tiles.height - 13) * TILE, lit: false },
  ];

  // Populate enemies sparsely across zones
  const spawners = [
    { id: 'm-low-1', x: 24 * TILE, y: (tiles.height - 10) * TILE, type: 'mote' },
    { id: 'm-flood-1', x: 88 * TILE, y: (tiles.height - 12) * TILE, type: 'mote' },
    { id: 'm-forest-1', x: 126 * TILE, y: (tiles.height - 26) * TILE, type: 'mote' },
    { id: 'm-cata-1', x: 170 * TILE, y: (tiles.height - 22) * TILE, type: 'mote' }
  ];

  // Camera setup remains the same; Game.js clamps by map extents
  const world = {
    tiles,
    hazards,
    braziers,
    spawners,
    gravity: 1600,
    camera: { x: 0, y: 0, w: 320, h: 180, scale: 3 },

    // Biome tracking and traversal
    currentBiome: 'Ruined Lowlands',
    unlockedNodes: ['Ruined Lowlands'],

    // Lost resource marker (reclaimable on return)
    lostFlame: null,
  };

  /**
   * PUBLIC_INTERFACE
   * Helper on world to check if a tile at (tx,ty) should be solid given player's abilities.
   * This allows future integration into collision checks if needed.
   */
  world.isSolidConsideringAbilities = (tx, ty, playerAbilities) => {
    if (tx < 0 || ty < 0 || tx >= tiles.width || ty >= tiles.height) return true;
    const id = tiles.data[ty * tiles.width + tx];
    // If it's a gate tile but player has the matching ability, treat as non-solid.
    if (id === tiles.gates.GATE_DASH && playerAbilities?.dash) return false;
    if (id === tiles.gates.GATE_WALL && playerAbilities?.wallJump) return false;
    if (id === tiles.gates.GATE_DOUBLE && playerAbilities?.doubleJump) return false;
    // SECRET is already not in solid[] list
    return tiles.solid.includes(id);
  };

  /**
   * PUBLIC_INTERFACE
   * Return travel nodes for map UI and fast travel (if added later).
   */
  world.getMapNodes = () => tiles.nodes.map(n => n.name);

  return world;
}
