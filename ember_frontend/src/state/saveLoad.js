const KEY = 'ember.save.v1';

// PUBLIC_INTERFACE
export function saveGameToStorage(state) {
  /** Saves provided state to localStorage. */
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game', e);
  }
}

// PUBLIC_INTERFACE
export function loadGameFromStorage() {
  /** Loads game state from localStorage or returns null. */
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load saved game', e);
    return null;
  }
}
