export class LightingSystem {
  constructor(renderer) {
    this.r = renderer;
    this.lights = [];
    // Offscreen light buffer
    this.buffer = document.createElement('canvas');
    this.bctx = this.buffer.getContext('2d');
  }

  begin() {
    this.lights.length = 0;
  }

  addLight(x, y, radius, color = 'rgba(255,200,120,1)') {
    this.lights.push({ x, y, radius, color });
  }

  render(darknessLevel = 0.6) {
    const { canvas, ctx, pixelScale } = this.r;
    if (this.buffer.width !== canvas.width || this.buffer.height !== canvas.height) {
      this.buffer.width = canvas.width;
      this.buffer.height = canvas.height;
    }
    this.bctx.clearRect(0, 0, this.buffer.width, this.buffer.height);

    // Fill darkness
    this.bctx.fillStyle = `rgba(0,0,0,${Math.min(0.95, Math.max(0, darknessLevel))})`;
    this.bctx.fillRect(0, 0, this.buffer.width, this.buffer.height);

    // Lights as radial gradients "cut out" using destination-out
    this.bctx.globalCompositeOperation = 'destination-out';
    for (const l of this.lights) {
      const [sx, sy] = this.r.worldToScreen(l.x, l.y);
      const r = l.radius * pixelScale;
      const g = this.bctx.createRadialGradient(sx, sy, 1, sx, sy, r);
      g.addColorStop(0, 'rgba(0,0,0,0.9)');
      g.addColorStop(0.5, 'rgba(0,0,0,0.6)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      this.bctx.fillStyle = g;
      this.bctx.beginPath();
      this.bctx.arc(sx, sy, r, 0, Math.PI * 2);
      this.bctx.fill();
    }
    this.bctx.globalCompositeOperation = 'source-over';

    // Subtle color glow addition
    this.bctx.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      const [sx, sy] = this.r.worldToScreen(l.x, l.y);
      const r = l.radius * pixelScale * 0.6;
      const g = this.bctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, l.color.replace('1)', '0.7)').replace('rgb', 'rgba'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      this.bctx.fillStyle = g;
      this.bctx.beginPath();
      this.bctx.arc(sx, sy, r, 0, Math.PI * 2);
      this.bctx.fill();
    }
    this.bctx.globalCompositeOperation = 'source-over';

    // Composite on main canvas
    ctx.drawImage(this.buffer, 0, 0);
  }
}
