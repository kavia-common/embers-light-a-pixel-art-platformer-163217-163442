# Ember Frontend

A modern-retro pixel art platformer frontend built with React and Canvas.

Features:
- Fullscreen pixel art rendering with dynamic lighting mask
- Platforming controls and physics
- Light-as-life (flame) mechanic with decay and restoration near lit braziers
- Environmental hazards: rain, wind, darkness
- Stealth (dimming) system
- Tactical combat: Flame Burst, Fire Seeds, object ignition
- Puzzle hooks: mirrors and solar beams
- Progression upgrades UI (Everbright Coal, Solar Mirror, Flame Cloak)
- World map overlay
- Ambient audio and effects (WebAudio)
- Local save/load

Controls:
- Move: Arrow Keys / A D
- Jump: Space / K
- Flame Burst: J / F
- Fire Seed: L
- Dim / Stealth: Shift
- Pause: Esc
- World Map: M
- Upgrades: U
- Save / Load: F5 / F9

Project Structure:
- src/game
  - core: Input, Physics
  - render: Renderer, LightingSystem
  - sound: AudioManager
  - world: World (tiles, braziers, mirrors, ignitables)
  - player: Player, Inventory, Upgrades
  - systems: HazardSystem, CombatSystem, PuzzleSystem, StealthSystem
  - utils: helpers
- src/ui: overlay components for HUD, Map, Upgrades, Pause
- src/state: save/load

Run:
- npm start

Build:
- npm run build
