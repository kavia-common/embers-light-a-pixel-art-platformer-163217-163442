//
//
// Player.js - Ember player character (revamped movement/combat & progression)
//
//
import { clamp, approach } from '../core/MathUtils';
import { stepPhysics, TILE, collidesWithTiles } from '../core/Physics';

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

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

    // Damage and invulnerability state (i-frames)
    this.invulnTime = 0;
    this.invulnDuration = 0.5;
    this.recentDamageTime = 0;

    // States
    this.dimmed = false; // stealth
    this.ignitedObjects = new Set();
    this.cooldowns = { burst: 0, seed: 0, dash: 0, melee: 0 };

    // Ability progression flags (unlock as you progress)
    this.abilities = {
      dash: false,
      doubleJump: false,
      wallJump: false,
      melee: true, // start with basic melee
    };

    // Upgrades (existing progression toggles)
    this.upgrades = {
      everbrightCoal: false,
      solarMirror: false,
      flameCloak: false,
    };

    // NEW: Progression subsystem state to track milestones and boss flags
    this.progression = {
      litCount: 0,
      milestones: {
        firstLight: false,   // first brazier
        duskPath: false,     // 3 braziers
        emberAscend: false,  // 5 braziers
      },
      bosses: {
        wardenMote: false,   // sample boss flag for future use
      }
    };

    // Platformer advanced move state
    this.freeMove = false; // platformer mode enabled
    this.wallSlide = false;
    this.wallDir = 0; // -1 left, 1 right
    this.doubleJumpUsed = false;
    this.dashTime = 0;
    this.dashDir = 0; // -1 or 1
    this.dashDuration = 0.18;
    this.dashSpeed = 520;

    // Melee combo state
    this.meleeComboIndex = 0;
    this.meleeComboTimer = 0; // time to chain next hit
    this.meleeWindow = 0.3; // seconds to chain
    this.meleeActiveTime = 0; // current swing active window
  }

  // PUBLIC_INTERFACE
  update(dt, input, world, systems) {
    /** Integrate controls, physics, combat, and progression rules. */
    // Timers
    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.cooldowns.burst = Math.max(0, this.cooldowns.burst - dt);
    this.cooldowns.seed = Math.max(0, this.cooldowns.seed - dt);
    this.cooldowns.dash = Math.max(0, this.cooldowns.dash - dt);
    this.cooldowns.melee = Math.max(0, this.cooldowns.melee - dt);
    if (this.invulnTime > 0) this.invulnTime = Math.max(0, this.invulnTime - dt);
    if (this.recentDamageTime > 0) this.recentDamageTime = Math.max(0, this.recentDamageTime - dt);

    // Combo windows diminish
    if (this.meleeComboTimer > 0) this.meleeComboTimer = Math.max(0, this.meleeComboTimer - dt);
    if (this.meleeActiveTime > 0) this.meleeActiveTime = Math.max(0, this.meleeActiveTime - dt);

    // Dim/stealth
    this.dimmed = input.isDown('dim');

    // Abilities (spells and melee)
    if (input.wasPressed('burst') && this.cooldowns.burst === 0) {
      // If dash unlocked and moving, treat burst as dash request for HK-like flow
      const movingDir = (input.isDown('left') ? -1 : 0) + (input.isDown('right') ? 1 : 0);
      if (this.abilities.dash && (movingDir !== 0 || this.dashTime <= 0) && this.cooldowns.dash === 0) {
        this._requestDash = true;
      } else {
        this._flameBurst(world, systems);
      }
    }
    if (input.wasPressed('seed') && this.cooldowns.seed === 0) {
      this._fireSeed(world, systems);
    }
    if (this.abilities.melee && input.wasPressed('interact') && this.cooldowns.melee === 0) {
      this._meleeAttack(systems, world);
    }

    // Movement and physics
    if (this.freeMove) {
      this._updateFreeMove(dt, input, world);
    } else {
      this._updatePlatformerAdvanced(dt, input, world, systems);
    }

    // Flame decay and hazards
    this._applyFlameDecay(dt, world);

    // Hazard hooks
    this.onHazardTick = (hz) => {
      if (hz.type === 'rain') {
        const factor = this.upgrades.flameCloak ? 0.25 : 1;
        this.flame = clamp(this.flame - hz.dps * factor * dt, 0, this.maxFlame);
      }
    };
    this.onDarknessTick = () => {
      if (this.dimmed) {
        this.flame = clamp(this.flame - 2 * dt, 0, this.maxFlame);
      }
    };

    // Interaction with braziers (restore flame and progression unlocks)
    for (const b of world.braziers) {
      if (Math.abs(this.x - b.x) < TILE && Math.abs(this.y - b.y) < TILE) {
        if (!b.lit) {
          if (this._nearIgnitionPoint(b)) {
            b.lit = true;
            this.flame = clamp(this.flame + 50, 0, this.maxFlame);
            systems.audio.playSfx('ignite');
            this._onMilestoneUpdate(world, systems); // update progression counts and unlocks
          }
        } else {
          this.flame = clamp(this.flame + 10 * dt, 0, this.maxFlame);
        }
      }
    }

    // Out-of-bounds safety
    const mapH = world.tiles.height * TILE;
    if (this.y > mapH + 200) {
      this.health = Math.max(0, this.health - 25);
      this.x = 3 * TILE;
      this.y = (world.tiles.height - 6) * TILE;
      this.vx = 0; this.vy = 0;
      systems.audio.playSfx('hurt');
    }
  }

  /**
   * Advanced platformer movement: dash, wall slide/jump, double jump, variable jump.
   */
  _updatePlatformerAdvanced(dt, input, world, systems) {
    const accel = 2400;
    const maxSpeed = 200 * (this.dimmed ? 0.8 : 1);
    const jumpVel = -420;

    // Horizontal input
    const left = input.isDown('left');
    const right = input.isDown('right');
    const hor = (left ? -1 : 0) + (right ? 1 : 0);
    if (hor !== 0) this.facing = hor;

    // Dash request handling
    if (this.abilities.dash && this._requestDash && this.cooldowns.dash === 0) {
      this._requestDash = false;
      this.dashTime = this.dashDuration;
      this.dashDir = hor !== 0 ? hor : this.facing;
      this.cooldowns.dash = 0.45;
      systems.audio.playSfx('dash');
    } else {
      this._requestDash = false;
    }

    // During dash: keep horizontal speed and damp vertical; grant brief i-frames
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      this.vx = this.dashDir * this.dashSpeed;
      this.vy = approach(this.vy, 0, 1800 * dt);
      this.invulnTime = Math.max(this.invulnTime, 0.05);
    } else {
      // Normal horizontal acceleration
      if (hor !== 0) {
        this.vx = approach(this.vx, hor * maxSpeed, accel * dt);
      }
      // else friction handled by stepPhysics
    }

    // Jump buffer
    if (input.wasPressed('jump')) {
      this.jumpBuffer = 0.15;
    }

    // Wall contact
    const tiles = world.tiles;
    const touchingLeft = collidesWithTiles(this.x - 1, this.y, this.w, this.h, tiles);
    const touchingRight = collidesWithTiles(this.x + 1, this.y, this.w, this.h, tiles);
    this.wallDir = touchingLeft ? -1 : (touchingRight ? 1 : 0);

    // Jump options
    const canGroundJump = (this.onGround || this.coyote > 0) && this.jumpBuffer > 0;
    const canWallJump = this.abilities.wallJump && this.wallDir !== 0 && this.jumpBuffer > 0 && !this.onGround;
    const canDoubleJump = this.abilities.doubleJump && !this.doubleJumpUsed && this.jumpBuffer > 0 && !this.onGround && !canWallJump;

    if (canGroundJump || canWallJump || canDoubleJump) {
      this.vy = jumpVel;
      if (canWallJump) {
        this.vx = 200 * -this.wallDir; // push off wall
        this.invulnTime = Math.max(this.invulnTime, 0.02);
      }
      if (!this.onGround && !canWallJump) {
        this.doubleJumpUsed = true;
      } else {
        this.doubleJumpUsed = false;
      }
      this.onGround = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      systems.audio.playSfx('jump');
    }

    // Wall slide
    this.wallSlide = false;
    if (!this.onGround && this.wallDir !== 0 && hor === this.wallDir && this.vy > 0) {
      this.wallSlide = true;
      this.vy = Math.min(this.vy, 80);
    }

    // Variable jump height
    if (!input.isDown('jump') && this.vy < -160) {
      this.vy = -160;
    }

    // Integrate physics/collisions
    stepPhysics(this, dt, world);

    // Reset landing states
    if (this.onGround) {
      this.doubleJumpUsed = false;
    }
  }

  /**
   * Handle free directional movement (kept for other modes).
   */
  _updateFreeMove(dt, input, world) {
    const accel = 2200;
    const maxSpeed = 150 * (this.dimmed ? 0.7 : 1);
    const decel = 2400;

    let dx = 0, dy = 0;
    if (input.isDown('left'))  dx -= 1;
    if (input.isDown('right')) dx += 1;
    if (input.isDown('up'))    dy -= 1;
    if (input.isDown('down'))  dy += 1;

    if (dx !== 0) this.facing = dx > 0 ? 1 : -1;

    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;

    const targetVX = dx * maxSpeed;
    const targetVY = dy * maxSpeed;

    this.vx = approach(this.vx, targetVX, accel * dt);
    this.vy = approach(this.vy, targetVY, accel * dt);

    if (dx === 0) this.vx = approach(this.vx, 0, decel * dt);
    if (dy === 0) this.vy = approach(this.vy, 0, decel * dt);

    const tiles = world.tiles;
    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    if (collidesWithTiles(nextX, this.y, this.w, this.h, tiles)) {
      const step = Math.sign(this.vx) || 1;
      let testX = this.x;
      while (!collidesWithTiles(testX + step, this.y, this.w, this.h, tiles)) {
        testX += step;
        if (Math.abs(testX - nextX) < 1) break;
      }
      this.x = testX;
      this.vx = 0;
    } else {
      this.x = nextX;
    }

    if (collidesWithTiles(this.x, nextY, this.w, this.h, tiles)) {
      const step = Math.sign(this.vy) || 1;
      let testY = this.y;
      while (!collidesWithTiles(this.x, testY + step, this.w, this.h, tiles)) {
        testY += step;
        if (Math.abs(testY - nextY) < 1) break;
      }
      this.y = testY;
      this.vy = 0;
    } else {
      this.y = nextY;
    }

    this.onGround = false;
  }

  _applyFlameDecay(dt) {
    let decay = this.dimmed ? 1.0 : 2.0;
    if (this.upgrades.everbrightCoal) decay *= 0.6;
    this.flame = clamp(this.flame - decay * dt, 0, this.maxFlame);
    if (this.flame <= 0) {
      this.health = clamp(this.health - 10 * dt, 0, this.maxHealth);
    } else if (this.health < this.maxHealth && !this.dimmed) {
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

    const radius = 40;
    for (const b of world.braziers) {
      const dx = b.x - this.x, dy = b.y - this.y;
      if (dx * dx + dy * dy < radius * radius) b.lit = true;
    }
    for (const e of systems.entities) {
      if (e.type === 'mote') {
        const dx = e.x - this.x, dy = e.y - this.y;
        if (dx * dx + dy * dy < radius * radius) {
          e.hp -= 50;
          if (typeof e.onHit === 'function') e.onHit(50, Math.sign(e.x - this.x));
        }
      }
    }
  }

  _fireSeed(world, systems) {
    if (this.flame < 5) return;
    this.flame = Math.max(0, this.flame - 5);
    this.cooldowns.seed = 0.6;
    systems.audio.playSfx('seed');

    systems.spawn({
      type: 'seed',
      x: this.x + (this.facing > 0 ? this.w : 0),
      y: this.y + this.h / 2,
      vx: 240 * this.facing,
      vy: -60,
      ttl: 2.5,
    });
  }

  /**
   * PUBLIC_INTERFACE
   * Perform a short-range melee slash with a 3-hit combo window.
   */
  _meleeAttack(systems) {
    /** Executes a melee attack; chains up to 3 hits if timed. */
    const comboMax = 3;
    // Determine combo index
    if (this.meleeComboTimer > 0) {
      this.meleeComboIndex = (this.meleeComboIndex + 1) % comboMax;
    } else {
      this.meleeComboIndex = 0;
    }
    this.meleeComboTimer = this.meleeWindow;
    this.meleeActiveTime = 0.12 + this.meleeComboIndex * 0.03; // later hits a bit longer
    this.cooldowns.melee = 0.18;

    // Deal damage to enemies in a small arc/box in front
    const rangeX = 14 + this.meleeComboIndex * 4;
    const rangeY = 10;
    const boxX = this.facing > 0 ? this.x + this.w : this.x - rangeX;
    const boxY = this.y + 2;

    for (const e of systems.entities) {
      if (e.type === 'mote' && !e.dead) {
        if (rectsOverlap(boxX, boxY, rangeX, rangeY, e.x, e.y, e.w, e.h)) {
          const dmg = 18 + this.meleeComboIndex * 8;
          e.hp -= dmg;
          // brief knockback
          if (e.vx !== undefined) e.vx += this.facing * 60;
          if (e.vy !== undefined) e.vy -= 40;
          if (typeof e.onHit === 'function') e.onHit(dmg, this.facing);
        }
      }
    }
    systems.audio.playSfx('slash');
  }

  /**
   * PUBLIC_INTERFACE
   * Progression: call after lighting a brazier or defeating a boss to update unlocks.
   */
  _onMilestoneUpdate(world, systems) {
    /** Updates lit counts, milestone flags, and unlocks abilities in sequence. */
    const newLit = world.braziers.filter(b => b.lit).length;
    if (newLit !== this.progression.litCount) {
      this.progression.litCount = newLit;
    }

    // Track milestone flags so we can use them for UI pings or save hooks later
    if (!this.progression.milestones.firstLight && this.progression.litCount >= 1) {
      this.progression.milestones.firstLight = true;
    }
    if (!this.progression.milestones.duskPath && this.progression.litCount >= 3) {
      this.progression.milestones.duskPath = true;
    }
    if (!this.progression.milestones.emberAscend && this.progression.litCount >= 5) {
      this.progression.milestones.emberAscend = true;
    }

    // Unlock abilities in a Metroidvania cadence
    this._maybeUnlockAbility(world, systems);
  }

  /**
   * PUBLIC_INTERFACE
   * Ability unlocking rule-of-thumb: based on number of lit braziers.
   */
  _maybeUnlockAbility(world, systems) {
    /** Unlocks moves gradually: dash -> wallJump -> doubleJump */
    const litCount = this.progression?.litCount || world.braziers.filter(b => b.lit).length;

    if (!this.abilities.dash && litCount >= 1) {
      this.abilities.dash = true;
      systems.audio.playSfx('powerup');
    } else if (!this.abilities.wallJump && litCount >= 3) {
      this.abilities.wallJump = true;
      systems.audio.playSfx('powerup');
    } else if (!this.abilities.doubleJump && litCount >= 5) {
      this.abilities.doubleJump = true;
      systems.audio.playSfx('powerup');
    }
  }

  // PUBLIC_INTERFACE
  takeDamage(amount, opts = {}) {
    /** Apply damage to the player with brief invulnerability and optional knockback. */
    if (this.invulnTime > 0) return;
    const dmg = Math.max(0, Math.floor(amount));
    this.health = clamp(this.health - dmg, 0, this.maxHealth);
    this.invulnTime = this.invulnDuration;
    this.recentDamageTime = 0.3;
    if (opts.knockback) {
      const kb = opts.knockback;
      this.vx += (kb.x || 0) * 120;
      this.vy += (kb.y || 0) * 160;
    }
    this.flame = clamp(this.flame - 2, 0, this.maxFlame);
  }

  // PUBLIC_INTERFACE
  render(ctx, camera) {
    /** Draw Ember with simple state hints (dash/melee/wall-slide). */
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    const blinking = this.invulnTime > 0 && Math.floor(this.invulnTime * 20) % 2 === 0;

    // Change hue slightly during dash
    const bodyColor = this.dashTime > 0 ? '#ffd27a' : (this.dimmed ? '#e08612' : '#ff9900');
    if (!blinking) {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.w, this.h);
    }

    // Face glow
    if (!blinking) {
      ctx.fillStyle = '#fff2bf';
      ctx.fillRect(Math.floor(this.x + (this.facing > 0 ? 6 : 2)), Math.floor(this.y + 4), 2, 2);
    }

    // Optional: draw melee hitbox briefly for feedback plus spark at tip
    if (this.meleeActiveTime > 0) {
      const rangeX = 14 + this.meleeComboIndex * 4;
      const rangeY = 10;
      const boxX = this.facing > 0 ? this.x + this.w : this.x - rangeX;
      const boxY = this.y + 2;
      ctx.fillStyle = 'rgba(255,230,180,0.25)';
      ctx.fillRect(Math.floor(boxX), Math.floor(boxY), rangeX, rangeY);
      // small hit spark pixel near the tip
      const sparkX = this.facing > 0 ? boxX + rangeX - 2 : boxX + 2;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(Math.floor(sparkX), Math.floor(boxY + rangeY / 2), 1, 1);
    }

    ctx.restore();
  }

  // PUBLIC_INTERFACE
  getLightSources(camera) {
    /** Return an array of dynamic lights for lighting system. */
    const baseR = 70 + (this.flame / this.maxFlame) * 40 + (this.dashTime > 0 ? 12 : 0);
    const strength = this.dimmed ? 0.6 : 0.9;
    return [
      {
        x: Math.floor(this.x - camera.x + this.w / 2),
        y: Math.floor(this.y - camera.y + this.h / 2),
        r: baseR,
        strength,
        color: this.dimmed ? 'rgba(255,190,120,0.06)' : 'rgba(255,220,160,0.10)'
      }
    ];
  }
}
