export class HazardSystem {
  constructor(world) {
    this.world = world;
    this.time = 0;
    this.isRaining = true;
    this.wind = 0.0;
    this.darknessLevel = 0.6;
    this.drops = [];
    for (let i = 0; i < 120; i++) {
      this.drops.push({ x: Math.random() * 2000, y: Math.random() * 600, v: 120 + Math.random() * 80 });
    }
  }

  update(dt, player) {
    this.time += dt;
    // Oscillate wind slowly
    this.wind = Math.sin(this.time * 0.2) * 0.6;
    // Darkness changes by biome or time
    this.darknessLevel = 0.55 + 0.1 * Math.sin(this.time * 0.05);

    // Occasional rain toggling in demo
    if (Math.random() < 0.002) this.isRaining = !this.isRaining;

    // Update drops positions
    if (this.isRaining) {
      for (const d of this.drops) {
        d.x += this.wind * 50 * dt;
        d.y += d.v * dt;
        if (d.y > 600) {
          d.y = -10;
          d.x = Math.random() * 2000;
        }
      }
      // Rain under shelter reduced or cancels hazard
      const sheltered = this.world.isShelteredAt(player.pos.x, player.pos.y);
      if (!sheltered) {
        // extinguish health when flame is too low and raining
        if (player.flame < 20) {
          player.health = Math.max(0, player.health - dt * 0.1);
        }
      }
    }
  }

  renderFX(r) {
    if (!this.isRaining) return;
    const ctx = r.ctx;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = 'rgba(120,140,180,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of this.drops) {
      const [sx, sy] = r.worldToScreen(d.x, d.y);
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 3, sy + 8);
    }
    ctx.stroke();
    ctx.restore();
  }
}
