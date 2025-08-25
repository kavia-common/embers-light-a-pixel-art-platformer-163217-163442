//
// Player.js - Ember player character
//
import { clamp, approach } from '../core/MathUtils';
import { stepPhysics, TILE, collidesWithTiles } from '../core/Physics';

export default class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 14;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.facing = 1;

    // Life/Flame
    this.maxFlame = 100;
    this.flame = 100;
    this.maxHealth = 100;
    this.health = 100;

    // States
    this.dimmed = false; // stealth
    this.ignitedObjects = new Set();
    this.cooldowns = { burst: 0, seed: 0 };
    this.upgrades = {
      everbrightCoal: false,
      solarMirror: false,
      flameCloak: false,
    };
  }

  // PUBLIC_INTERFACE
  update(dt, input, world, systems) {
    /** Integrate controls, physics, and mechanics. */
    // Timers
    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.cooldowns.burst = Math.max(0, this.cooldowns.burst - dt);
    this.cooldowns.seed = Math.max(0, this.cooldowns.seed - dt);

    // Base movement
    const accel = 2200;
    const maxSpeed = 180 * (this.dimmed ? 0.7 : 1);
    if (input.isDown('left')) {
      this.vx = approach(this.vx, -maxSpeed, accel * dt);
      this.facing = -1;
    } else if (input.isDown('right')) {
      this.vx = approach(this.vx, maxSpeed, accel * dt);
      this.facing = 1;
    }

    // Jump buffering
    if (input.wasPressed('jump')) {
      this.jumpBuffer = 0.12;
    }
    if ((this.onGround || this.coyote > 0) && this.jumpBuffer > 0) {
      this.vy = -420;
      this.onGround = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      systems.audio.playSfx('jump');
    }
    // Short hop if releasing jump early
    if (!input.isDown('jump') && this.vy < -160) {
      this.vy = -160;
    }

    // Dim/stealth
    this.dimmed = input.isDown('dim');

    // Abilities
    if (input.wasPressed('burst') && this.cooldowns.burst === 0) {
      this._flameBurst(world, systems);
    }
    if (input.wasPressed('seed') && this.cooldowns.seed === 0) {
      this._fireSeed(world, systems);
    }

    // Flame decay and hazards
    this._applyFlameDecay(dt, world);

    // Hooks for hazards
    this.onHazardTick = (hz) => {
      if (hz.type === 'rain') {
        const factor = this.upgrades.flameCloak ? 0.25 : 1;
        this.flame = clamp(this.flame - hz.dps * factor * dt, 0, this.maxFlame);
      }
    };
    this.onDarknessTick = (hz) => {
      // If too dim and in darkness, slow decay or slight damage over time
      if (this.dimmed) {
        this.flame = clamp(this.flame - 2 * dt, 0, this.maxFlame);
      }
    };

    // Physics
    stepPhysics(this, dt, world);

    // Interaction with braziers (restore flame)
    for (const b of world.braziers) {
      if (Math.abs(this.x - b.x) < TILE && Math.abs(this.y - b.y) < TILE) {
        if (!b.lit) {
          // Ignite if burst near it or auto-ignite when very close with enough flame
          if (this._nearIgnitionPoint(b)) {
            b.lit = true;
            this.flame = clamp(this.flame + 50, 0, this.maxFlame);
            systems.audio.playSfx('ignite');
          }
        } else {
          // Recharge when near lit brazier
          this.flame = clamp(this.flame + 10 * dt, 0, this.maxFlame);
        }
      }
    }

    // Prevent falling out - simple death/reset if out of bounds
    const mapH = world.tiles.height * TILE;
    if (this.y > mapH + 200) {
      this.health = Math.max(0, this.health - 25);
      // Respawn at start
      this.x = 3 * TILE;
      this.y = (world.tiles.height - 6) * TILE;
      this.vx = 0; this.vy = 0;
      systems.audio.playSfx('hurt');
    }
  }

  _applyFlameDecay(dt, world) {
    // Base decay
    let decay = this.dimmed ? 1.0 : 2.0;
    // Rain, darkness handled via hazard ticks
    if (this.upgrades.everbrightCoal) decay *= 0.6;
    this.flame = clamp(this.flame - decay * dt, 0, this.maxFlame);
    if (this.flame <= 0) {
      // Health drains when flame is out
      this.health = clamp(this.health - 10 * dt, 0, this.maxHealth);
    } else if (this.health < this.maxHealth && !this.dimmed) {
      // Slow health regen when lit
      this.health = clamp(this.health + 3 * dt, 0, this.maxHealth);
    }
  }

  _nearIgnitionPoint(b) {
    return Math.abs(this.x - b.x) < 14 && Math.abs(this.y - b.y) < 16;
  }

  _flameBurst(world, systems) {
    if (this.flame < 10) return;
    this.flame = Math.max(0, this.flame - 10);
    this.cooldowns.burst = 0.35;
    systems.audio.playSfx('burst');

    // Light nearby braziers and damage motes
    const radius = 40;
    for (const b of world.braziers) {
      const dx = b.x - this.x, dy = b.y - this.y;
      if (dx * dx + dy * dy < radius * radius) b.lit = true;
    }
    for (const e of systems.entities) {
      if (e.type === 'mote') {
        const dx = e.x - this.x, dy = e.y - this.y;
        if (dx * dx + dy * dy < radius * radius) e.hp -= 50;
      }
    }
  }

  _fireSeed(world, systems) {
    if (this.flame < 5) return;
    this.flame = Math.max(0, this.flame - 5);
    this.cooldowns.seed = 0.6;
    systems.audio.playSfx('seed');

    // Create a small projectile that ignites objects
    systems.spawn({
      type: 'seed',
      x: this.x + (this.facing > 0 ? this.w : 0),
      y: this.y + this.h / 2,
      vx: 240 * this.facing,
      vy: -60,
      ttl: 2.5,
    });
  }

  // PUBLIC_INTERFACE
  render(ctx, camera) {
    /** Draw Ember as a simple pixel character. */
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Body
    ctx.fillStyle = this.dimmed ? '#cc7a00' : '#ff9900';
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.w, this.h);

    // Face glow
    ctx.fillStyle = '#ffeea9';
    ctx.fillRect(Math.floor(this.x + (this.facing > 0 ? 6 : 2)), Math.floor(this.y + 4), 2, 2);

    ctx.restore();
  }

  // PUBLIC_INTERFACE
  getLightSources(camera) {
    /** Return an array of dynamic lights for lighting system. */
    const baseR = 70 + (this.flame / this.maxFlame) * 40;
    const strength = this.dimmed ? 0.6 : 0.9;
    return [
      {
        x: Math.floor(this.x - camera.x + this.w / 2),
        y: Math.floor(this.y - camera.y + this.h / 2),
        r: baseR,
        strength,
        // Slightly stronger glow when not dimmed to remain readable with brighter ambient
        color: this.dimmed ? 'rgba(255,190,120,0.06)' : 'rgba(255,220,160,0.10)'
      }
    ];
  }
}
