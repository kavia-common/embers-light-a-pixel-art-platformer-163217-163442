//
// Renderer.js - draws tiles, entities, and UI layers
//
import { TILE } from '../core/Physics';

export function renderTiles(ctx, world, camera) {
  const tiles = world.tiles;
  const startX = Math.floor(camera.x / TILE);
  const endX = Math.ceil((camera.x + camera.w) / TILE);
  const startY = Math.floor(camera.y / TILE);
  const endY = Math.ceil((camera.y + camera.h) / TILE);

  for (let ty = startY; ty < endY; ty++) {
    for (let tx = startX; tx < endX; tx++) {
      const id = tiles.data[ty * tiles.width + tx];
      if (id === undefined) continue;
      const color = tiles.palette[id] || '#111';
      ctx.fillStyle = color;
      ctx.fillRect(tx * TILE - camera.x, ty * TILE - camera.y, TILE, TILE);
    }
  }
}

// PUBLIC_INTERFACE
export function renderBraziers(ctx, world, camera) {
  /** Draw braziers and their flames. */
  for (const b of world.braziers) {
    ctx.fillStyle = b.lit ? '#ffb84d' : '#3a3943';
    ctx.fillRect(Math.floor(b.x - camera.x), Math.floor(b.y - camera.y), 10, 8);
    if (b.lit) {
      ctx.fillStyle = '#fff2bf';
      ctx.fillRect(Math.floor(b.x - camera.x + 3), Math.floor(b.y - camera.y - 6), 4, 6);
    }
  }
}

// PUBLIC_INTERFACE
export function renderLostFlame(ctx, world, camera) {
  /** Draw the reclaimable lost flame marker if present. */
  const lf = world.lostFlame;
  if (!lf) return;
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.fillStyle = 'rgba(255,200,120,0.8)';
  ctx.fillRect(Math.floor(lf.x) - 2, Math.floor(lf.y) - 4, 6, 6);
  // small glow
  ctx.fillStyle = 'rgba(255,230,180,0.4)';
  ctx.fillRect(Math.floor(lf.x) - 3, Math.floor(lf.y) - 5, 8, 8);
  ctx.restore();
}
