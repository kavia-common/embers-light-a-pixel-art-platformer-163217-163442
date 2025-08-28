//
//
// Entities.js - other simple entities: motes and seeds
//
import { TILE } from '../core/Physics';

// Simple AABB overlap test
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// PUBLIC_INTERFACE
export function createMote(x, y) {
  /** Create a simple enemy that seeks the player and deals contact damage. */
  return {
    type: 'mote',
    x, y,
    w: 10, h: 10,
    vx: 0, vy: 0,
    hp: 60,
    aiTime: 0,
    contactDamage: 8,        // damage per hit
    contactCooldown: 0.6,    // seconds between damage ticks on same target
    _contactTimer: 0,        // internal timer

    update(dt, player) {
      this.aiTime += dt;

      // float towards player slowly, avoid light if player is bright
      const speed = player.dimmed ? 60 : 40;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this.vx = (dx / len) * speed;
      this.vy = (dy / len) * speed * 0.4 + Math.sin(this.aiTime * 3) * 10;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Handle contact damage with a small cooldown so it doesn't strobe each frame
      if (this._contactTimer > 0) this._contactTimer -= dt;
      if (aabb(this.x, this.y, this.w, this.h, player.x, player.y, player.w, player.h)) {
        if (this._contactTimer <= 0) {
          // Ask player to take damage (it will handle its own i-frames)
          if (typeof player.takeDamage === 'function') {
            player.takeDamage(this.contactDamage, { source: 'mote', knockback: { x: Math.sign(dx), y: -0.4 } });
          }
          this._contactTimer = this.contactCooldown;
        }
      }
    },

    render(ctx, camera) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      ctx.fillStyle = '#202634';
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.w, this.h);
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
