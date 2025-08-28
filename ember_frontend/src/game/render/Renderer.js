export class Renderer {
  constructor(canvas, { pixelScale = 3 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelScale = pixelScale;
    this.camera = { x: 0, y: 0 };
    this.viewW = (canvas.width / pixelScale) | 0;
    this.viewH = (canvas.height / pixelScale) | 0;
  }

  setPixelScale(s) {
    this.pixelScale = s;
    this.viewW = (this.canvas.width / s) | 0;
    this.viewH = (this.canvas.height / s) | 0;
  }

  clear(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  worldToScreen(x, y) {
    return [
      Math.floor((x - this.camera.x) * this.pixelScale),
      Math.floor((y - this.camera.y) * this.pixelScale),
    ];
  }

  rect(x, y, w, h, color) {
    const [sx, sy] = this.worldToScreen(x, y);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(sx, sy, Math.ceil(w * this.pixelScale), Math.ceil(h * this.pixelScale));
  }

  drawSprite(x, y, w, h, color = '#ff9900') {
    // Placeholder sprite: glowing ember square
    this.rect(x - w/2, y - h/2, w, h, color);
  }

  drawText(x, y, text, color = '#ffeea9') {
    const [sx, sy] = this.worldToScreen(x, y);
    this.ctx.fillStyle = color;
    this.ctx.font = `${8 * this.pixelScale}px monospace`;
    this.ctx.fillText(text, sx, sy);
  }

  screenText(px, py, text, color = '#ffeea9', size = 12) {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px monospace`;
    this.ctx.fillText(text, px, py);
  }
}
