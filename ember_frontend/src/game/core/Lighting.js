//
// Lighting.js - simple screen-space dynamic lighting
//
import { clamp } from './MathUtils';

// PUBLIC_INTERFACE
export function renderLighting(ctx, width, height, lightSources, darkness = 0.8) {
  /**
   * Renders a darkness overlay with additive radial lights.
   * lightSources: [{x,y,r,strength,color}]
   */
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(0,0,0,${clamp(darkness, 0, 1)})`;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-out';
  for (const l of lightSources) {
    const grd = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    grd.addColorStop(0, `rgba(0,0,0,${1 - l.strength})`);
    grd.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // optional bloom tint
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lightSources) {
    ctx.fillStyle = l.color ?? 'rgba(255,200,120,0.08)';
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
