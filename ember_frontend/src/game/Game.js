import { Input } from './core/Input';
import { Physics } from './core/Physics';
import { Renderer } from './render/Renderer';
import { LightingSystem } from './render/LightingSystem';
import { AudioManager } from './sound/AudioManager';
import { World } from './world/World';
import { Player } from './player/Player';
import { HazardSystem } from './systems/HazardSystem';
import { CombatSystem } from './systems/CombatSystem';
import { PuzzleSystem } from './systems/PuzzleSystem';
import { StealthSystem } from './systems/StealthSystem';
import { Inventory } from './player/Inventory';
import { Upgrades } from './player/Upgrades';
import { clamp } from './utils/math';

// PUBLIC_INTERFACE
export class Game {
  /**
   * Game coordinates all systems. Provides:
   *  - start/stop main loop
   *  - pause/input blocking
   *  - export/import state for save/load
   *  - HUD updates via onHUDUpdate callback
   */
  constructor({ parent, onHUDUpdate, onRequestPause }) {
    this.parent = parent;
    this.onHUDUpdate = onHUDUpdate || (() => {});
    this.onRequestPause = onRequestPause || (() => {});
    this.paused = false;
    this.blockInput = false;

    // Canvas setup
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.imageRendering = 'pixelated';
    this.parent.appendChild(this.canvas);

    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDt = 1000 / 60;

    // Systems
    this.input = new Input(this.canvas);
    this.physics = new Physics();
    this.renderer = new Renderer(this.canvas, { pixelScale: 3 });
    this.lighting = new LightingSystem(this.renderer);
    this.audio = new AudioManager();
    this.world = new World();
    this.inventory = new Inventory();
    this.upgrades = new Upgrades();
    this.player = new Player(this.world, this.input, this.inventory, this.upgrades);
    this.hazards = new HazardSystem(this.world);
    this.combat = new CombatSystem(this.world, this.player, this.audio);
    this.puzzles = new PuzzleSystem(this.world, this.player);
    this.stealth = new StealthSystem(this.world, this.player);

    // Hook resize
    this._onResize = this.onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this.onResize();

    // Music
    this.audio.init().then(() => {
      this.audio.playAmbient('ruins');
    });

    // HUD init
    this._updateHUD();
  }

  onResize() {
    const rect = this.parent.getBoundingClientRect();
    const w = Math.max(320, rect.width | 0);
    const h = Math.max(240, rect.height | 0);
    // Keep integer scaling for pixel art
    const pixelScale = Math.max(2, Math.floor(Math.min(w / 320, h / 180)));
    this.renderer.setPixelScale(pixelScale);
    this.canvas.width = Math.floor(w / pixelScale) * pixelScale;
    this.canvas.height = Math.floor(h / pixelScale) * pixelScale;
  }

  setPaused(v) {
    this.paused = !!v;
    this.audio.setPaused(this.paused);
  }

  setInputBlocked(v) {
    this.blockInput = !!v;
  }

  start() {
    this._rafId = requestAnimationFrame(this._tick.bind(this));
  }

  destroy() {
    cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this._onResize);
    this.input.destroy();
    this.audio.destroy();
    this.parent.removeChild(this.canvas);
  }

  _tick(ts) {
    if (!this.lastTime) this.lastTime = ts;
    let dt = ts - this.lastTime;
    this.lastTime = ts;

    if (!this.paused) {
      // Input
      this.input.update();
      if (this.blockInput) {
        this.input.suppressFrame();
      }

      // Fixed update loop for physics
      this.accumulator += dt;
      while (this.accumulator >= this.fixedDt) {
        this._fixedUpdate(this.fixedDt / 1000);
        this.accumulator -= this.fixedDt;
      }

      // Smooth update and render
      this._update(dt / 1000);
    }

    this._render();

    this._rafId = requestAnimationFrame(this._tick.bind(this));
  }

  _fixedUpdate(dt) {
    // Player update and physics
    this.player.update(dt, { inputBlocked: this.blockInput });
    this.physics.resolve(this.world, this.player, dt);

    // Environment and systems
    this.hazards.update(dt, this.player);
    this.stealth.update(dt);
    this.combat.update(dt);
    this.puzzles.update(dt);

    // Flame decay as life
    const decayRate = this.stealth.isInShelter ? 0.2 : 0.6; // slower under shelter
    const rainPenalty = this.hazards.isRaining ? 0.4 : 0;
    const darknessPenalty = this.stealth.inDarkness ? 0.2 : 0;
    const upgradeFactor = this.upgrades.getFlameDecayMultiplier();
    const totalDecay = (decayRate + rainPenalty + darknessPenalty) * upgradeFactor;

    this.player.flame = clamp(this.player.flame - totalDecay * dt, 0, this.player.maxFlame);

    // Request pause if flame exhausted
    if (this.player.flame <= 0) {
      this.onRequestPause && this.onRequestPause();
    }

    // Ignite objects and apply light sources from combat system
    this.combat.applyIgnitions(dt);

    this._updateHUD();
  }

  _update(dt) {
    // Camera follows player
    this.renderer.camera.x = this.player.pos.x - this.renderer.viewW / 2;
    this.renderer.camera.y = this.player.pos.y - this.renderer.viewH / 2;
  }

  _render() {
    // Base scene
    this.renderer.clear('#0a090d');
    this.world.render(this.renderer);
    this.player.render(this.renderer);

    // Lighting pass
    this.lighting.begin();
    // Player light - intensity depends on flame
    const pLight = 48 + (this.player.flame / this.player.maxFlame) * 80;
    this.lighting.addLight(this.player.pos.x, this.player.pos.y - 6, pLight, 'rgba(255,180,80,0.9)');
    // Ignited objects lights
    this.combat.renderLights(this.lighting);
    // Environmental darkness mask
    this.lighting.render(this.hazards.darknessLevel);

    // Screen-space effects (rain/wind)
    this.hazards.renderFX(this.renderer);

    // Optional debug
    // this.renderer.drawText(8, 8, `flame: ${this.player.flame.toFixed(1)}`);
  }

  // PUBLIC_INTERFACE
  exportState() {
    /** Returns serializable game state for saving. */
    return {
      player: this.player.serialize(),
      world: this.world.serialize(),
      inventory: this.inventory.serialize(),
      upgrades: this.upgrades.serialize(),
      systems: this.combat.serialize(),
      meta: { v: 1, t: Date.now() },
    };
  }

  // PUBLIC_INTERFACE
  importState(state) {
    /** Loads a previously saved state. */
    if (!state) return;
    this.player.deserialize(state.player);
    this.world.deserialize(state.world);
    this.inventory.deserialize(state.inventory);
    this.upgrades.deserialize(state.upgrades);
    this.combat.deserialize(state.systems);
    this._updateHUD();
  }

  _updateHUD() {
    const hud = {
      flame: this.player.flame,
      maxFlame: this.player.maxFlame,
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      inventory: this.inventory.items,
      upgrades: this.upgrades.flags,
      biome: this.world.biome,
      seeds: this.combat.seedCount,
      isRaining: this.hazards.isRaining,
      wind: this.hazards.wind,
    };
    this.onHUDUpdate && this.onHUDUpdate(hud);
  }
}
