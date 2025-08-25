//
// Entities.js - other simple entities: motes and seeds
//
import { TILE } from '../core/Physics';

export function createMote(x, y) {
  return {
    type: 'mote',
    x, y,
    w: 10, h: 10,
    vx: 0, vy: 0,
    hp: 60,
    aiTime: 0,
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
    },
    render(ctx, camera) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      ctx.fillStyle = '#0d0d12';
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.w, this.h);
      ctx.restore();
    }
  };
}

export function createSeed(p) {
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
      ctx.fillStyle = '#ffeea9';
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.w, this.h);
      ctx.restore();
    }
  };
  return ent;
}
