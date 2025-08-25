//
// Lighting.js - simple screen-space dynamic lighting
//
import { clamp } from './MathUtils';

// PUBLIC_INTERFACE
export function renderLighting(ctx, width, height, lightSources, darkness = 0.6) {
  /**
   * Renders a darkness overlay with additive radial lights.
   * lightSources: [{ x, y, r, strength, color }]
   *
   * Brightness adjustments:
   * - Lower default darkness from 0.8 -> 0.6 so ambient scene is lighter.
   * - Slightly widen the "cutout" by easing the falloff to avoid harsh dark rings.
   * - Modestly increase bloom intensity to improve readability without washing out pixels.
   *
   * Parameters:
   * - ctx: CanvasRenderingContext2D to draw on
   * - width, height: dimensions of the scene (in world pixels, pre-scale)
   * - lightSources: array of light descriptors:
   *     { x: number, y: number, r: number, strength?: number, color?: string }
   * - darkness: ambient darkness factor in [0,1]; lower = brighter
   *
   * Returns: void (draws overlay to ctx)
   */
  ctx.save();

  // Base darkness overlay (reduced alpha = brighter scene)
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(0,0,0,${clamp(darkness, 0, 1)})`;
  ctx.fillRect(0, 0, width, height);

  // Subtractive radial lights carve out darkness
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < lightSources.length; i += 1) {
    const l = lightSources[i] || {};
    const strength = typeof l.strength === 'number' ? l.strength : 0.8;
    const innerAlpha = Math.max(0, 1 - strength); // strong lights remove more darkness
    const r = l.r || 0;

    const grd = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    // Slightly softer falloff near the inner radius to make areas feel brighter
    grd.addColorStop(0.0, `rgba(0,0,0,${innerAlpha})`);
    grd.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    grd.addColorStop(1.0, 'rgba(0,0,0,1)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(l.x, l.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gentle additive bloom for warmth/readability
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < lightSources.length; i += 1) {
    const l = lightSources[i] || {};
    // Slightly stronger default bloom and a bit larger radius to lift midtones
    const bloomColor = l.color || 'rgba(255,210,150,0.10)';
    const bloomRadius = (l.r || 0) * 0.78;
    ctx.fillStyle = bloomColor;
    ctx.beginPath();
    ctx.arc(l.x, l.y, bloomRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
