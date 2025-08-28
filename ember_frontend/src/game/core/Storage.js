//
// Storage.js - handles save/load with localStorage
//
const SAVE_KEY = 'ember_save_v1';

function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}

// PUBLIC_INTERFACE
export function saveGame(state) {
  /** Save minimal game state snapshot to localStorage. */
  const snapshot = {
    version: 2,
    player: {
      x: state.player.x,
      y: state.player.y,
      health: state.player.health,
      flame: state.player.flame,
      upgrades: state.player.upgrades,
      lastSave: state.player.lastSave || null, // brazier respawn point
    },
    world: {
      unlockedNodes: state.world.unlockedNodes,
      currentBiome: state.world.currentBiome,
      braziers: state.world.braziers.map(b => ({ id: b.id, x: b.x, y: b.y, lit: b.lit })),
      lostFlame: state.world.lostFlame || null, // dropped reclaimable resource
    },
    inventory: state.inventory,
    settings: state.settings,
    timestamp: Date.now()
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
}

// PUBLIC_INTERFACE
export function loadGame() {
  /** Load saved state snapshot or null if none. */
  const raw = localStorage.getItem(SAVE_KEY);
  return safeParse(raw);
}

// PUBLIC_INTERFACE
export function clearSave() {
  /** Clear save data. */
  localStorage.removeItem(SAVE_KEY);
}
