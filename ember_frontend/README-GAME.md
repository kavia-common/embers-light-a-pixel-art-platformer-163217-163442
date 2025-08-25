# Ember's Light - Frontend

A fullscreen pixel-art platformer implemented in React Canvas.

Controls:
- Left/Right: Arrow keys or A/D
- Jump: Space or K
- Flame Burst: J
- Fire Seed: L
- Dim (Stealth): Shift
- Map: M
- Pause: P
- Upgrades/Interact: E

Features:
- Dynamic lighting overlay (radial lights for player and braziers)
- Platforming physics with coyote time, jump buffer, friction
- Flame (life) decay and restoration at braziers
- Hazards: rain (decay), wind (push), darkness (decay when dim)
- Stealth dimming reduces speed and light radius
- Tactical combat: Flame Burst (AOE) and Fire Seeds (projectile)
- Simple enemies (motes) that seek player
- Puzzle hooks via braziers and seeds
- Progression via toggleable upgrades (Everbright Coal, Solar Mirror, Flame Cloak)
- World map modal with unlocked biomes
- Save/Load using localStorage (auto-save every 5s)

Structure:
- src/game/core: Input, Audio, Physics, Lighting, Storage, EventBus, Math
- src/game/world: World map generation, hazards, braziers
- src/game/entities: Player and other entities (mote, seed)
- src/game/render: Tile and object renderer
- src/game/ui: React HUD and Menus
- src/game/Game.js: Orchestrates loop and ties systems together

Notes:
- Audio manager stubs are in place; provide actual audio assets by preloading files in AudioManager and calling audio.preload(name, url).
- For additional content, extend world map, tileset, and entity systems.
