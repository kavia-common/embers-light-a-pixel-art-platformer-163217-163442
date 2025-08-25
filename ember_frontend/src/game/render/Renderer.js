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

export function renderBraziers(ctx, world, camera) {
  for (const b of world.braziers) {
    ctx.fillStyle = b.lit ? '#ffb84d' : '#33323a';
    ctx.fillRect(Math.floor(b.x - camera.x), Math.floor(b.y - camera.y), 10, 8);
    if (b.lit) {
      ctx.fillStyle = '#ffeea9';
      ctx.fillRect(Math.floor(b.x - camera.x + 3), Math.floor(b.y - camera.y - 6), 4, 6);
    }
  }
}
