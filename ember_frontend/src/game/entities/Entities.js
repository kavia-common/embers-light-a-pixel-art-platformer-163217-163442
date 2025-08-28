//
//
// Entities.js - other simple entities: motes and seeds (compatible with melee/knockback)
//
import { TILE } from '../core/Physics';

// Simple AABB overlap test
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// PUBLIC_INTERFACE
export function createMote(x, y) {
  /** Create a simple enemy that seeks the player, can be hit/knocked back, shows hit flash, and deals contact damage. */
  return {
    type: 'mote',
    x, y,
    w: 10, h: 10,
    vx: 0, vy: 0,
    hp: 60,
    aiTime: 0,
    contactDamage: 8,
    contactCooldown: 0.6,
    _contactTimer: 0,
    // reactive feedback
    hitFlash: 0,          // seconds remaining of white flash
    stunTime: 0,          // brief pause after being hit
    aggro: true,

    update(dt, player) {
      this.aiTime += dt;

      // decay timers
      if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (this.stunTime > 0) this.stunTime = Math.max(0, this.stunTime - dt);

      // simple damping to settle knockback
      this.vx *= 0.98;
      this.vy *= 0.98;

      // AI steering if not stunned
      if (this.stunTime <= 0) {
        const speed = player.dimmed ? 60 : 40;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const len = Math.hypot(dx, dy) || 1;
        // steer a little rather than fully override to allow knockback
        this.vx += ((dx / len) * speed - this.vx) * 0.05;
        this.vy += (((dy / len) * speed * 0.4 + Math.sin(this.aiTime * 3) * 10) - this.vy) * 0.05;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Handle contact damage with a small cooldown (respect player i-frames)
      if (this._contactTimer > 0) this._contactTimer -= dt;
      if (aabb(this.x, this.y, this.w, this.h, player.x, player.y, player.w, player.h)) {
        if (this._contactTimer <= 0) {
          if (typeof player.takeDamage === 'function') {
            player.takeDamage(this.contactDamage, { source: 'mote', knockback: { x: Math.sign(player.x - this.x), y: -0.4 } });
          }
          this._contactTimer = this.contactCooldown;
        }
      }
    },

    // PUBLIC_INTERFACE
    onHit(dmg, dir = 0) {
      /** Reaction when taking a hit: flash white and tiny stun. */
      this.hitFlash = 0.08;
      this.stunTime = 0.06;
      // Knockback already applied by attacker; ensure slight push
      this.vx += (dir || 0) * 20;
    },

    render(ctx, camera) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      // tint darker when low hp
      const hpPct = Math.max(0, Math.min(1, this.hp / 60));
      let base = hpPct < 0.35 ? '#2b3347' : '#202634';
      if (this.hitFlash > 0) base = '#e8eefc'; // hit flash
      ctx.fillStyle = base;
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.w, this.h);

      // simple hit spark indicator (tiny pixel) for feedback
      if (this.hitFlash > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(this.x + this.w / 2), Math.floor(this.y + this.h / 2), 1, 1);
      }
      ctx.restore();
    }
  };
}

// PUBLIC_INTERFACE
export function createSeed(p) {
  /** Flame seed projectile to ignite objects. */
  const ent = {
    type: 'seed',
    x: p.x, y: p.y,
    w: 4, h: 4,
    vx: p.vx, vy: p.vy,
    ttl: p.ttl ?? 2.0,
    gravity: 500,
    update(dt, systems, world) {
      this.ttl -= dt;
      if (this.ttl <= 0) this.dead = true;
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Ignite brazier if hit
      for (const b of world.braziers) {
        if (Math.abs(this.x - b.x) < TILE && Math.abs(this.y - b.y) < TILE) {
          b.lit = true;
          this.dead = true;
        }
      }
    },
    render(ctx, camera) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      ctx.fillStyle = '#fff2bf';
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.w, this.h);
      ctx.restore();
    }
  };
  return ent;
}
