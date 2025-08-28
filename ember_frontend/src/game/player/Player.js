import { clamp } from '../utils/math';

export class Player {
  constructor(world, input, inventory, upgrades) {
    this.world = world;
    this.input = input;
    this.inventory = inventory;
    this.upgrades = upgrades;

    // Initial position will be set by Game during initialization (center of view)
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.hw = 5; // half width
    this.hh = 7; // half height

    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpCount = 0;
    this.maxJumps = 1;

    this.moveSpeed = 200;
    this.jumpVel = -320;

    this.maxHealth = 3;
    this.health = 3;

    this.maxFlame = 100;
    this.flame = 100;

    this.dimFactor = 1.0; // 1 bright, lower is dim/stealthier

    this.cooldowns = {
      burst: 0,
      seed: 0,
    };
  }

  update(dt, { inputBlocked }) {
    // Movement input (horizontal)
    // Keep player visually centered; treat input as desired horizontal movement.
    // We set a target horizontal velocity but final position update/collision occurs in Physics.
    const speed = this.moveSpeed * (this.upgrades.has('flame_cloak') ? 1.1 : 1.0);
    if (!inputBlocked) {
      if (this.input.left) this.vel.x = -speed;
      else if (this.input.right) this.vel.x = speed;
      else this.vel.x = 0;
    } else {
      this.vel.x = 0;
    }

    // Jump
    if (!inputBlocked && this.input.jumpPressed && (this.grounded || this.coyoteTimer > 0 || this.jumpCount < this.maxJumps)) {
      this.vel.y = this.jumpVel * (this.upgrades.has('flame_cloak') ? 1.05 : 1.0);
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpCount++;
    }

    // Dimming for stealth
    if (!inputBlocked) {
      this.dimFactor = this.input.dim ? 0.4 : 1.0;
    }

    // Cooldowns
    for (const k of Object.keys(this.cooldowns)) {
      this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }

    // Burst and seeds triggered in CombatSystem via input read, but we track flame constraints here
    // Flame regen near lit braziers
    for (const b of this.world.braziers) {
      const dx = b.x - this.pos.x;
      const dy = b.y - this.pos.y;
      const dist = Math.hypot(dx, dy);
      if (b.lit && dist < 60) {
        this.flame = clamp(this.flame + 15 * dt, 0, this.maxFlame);
      }
    }
  }

  render(r) {
    const size = 8 + Math.floor((this.flame / this.maxFlame) * 6);
    const tint = Math.floor(153 + (this.flame / this.maxFlame) * 100);
    const color = `rgb(${tint}, ${120 + (this.dimFactor < 1 ? -30 : 0)}, 60)`;
    r.drawSprite(this.pos.x, this.pos.y - 4, size, size, color);
  }

  // PUBLIC_INTERFACE
  serialize() {
    return {
      pos: this.pos, vel: this.vel,
      health: this.health, maxHealth: this.maxHealth,
      flame: this.flame, maxFlame: this.maxFlame,
    };
  }

  // PUBLIC_INTERFACE
  deserialize(s) {
    if (!s) return;
    this.pos = s.pos || this.pos;
    this.vel = s.vel || this.vel;
    this.health = s.health ?? this.health;
    this.maxHealth = s.maxHealth ?? this.maxHealth;
    this.flame = s.flame ?? this.flame;
    this.maxFlame = s.maxFlame ?? this.maxFlame;
  }
}
