//
// Physics.js - basic platformer physics and collision with tile map
//
import { clamp } from './MathUtils';

export const TILE = 16; // Base pixel grid

// Simple AABB collision
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// PUBLIC_INTERFACE
export function stepPhysics(entity, dt, world) {
  /**
   * Integrate entity physics with gravity, friction, and tile collisions.
   * entity: { x, y, vx, vy, w, h, onGround, canJump, jumpBuffer, coyote }
   */
  const g = world.gravity ?? 1600; // px/s^2
  const maxFall = 1200;
  entity.vy += g * dt;
  entity.vy = clamp(entity.vy, -Infinity, maxFall);

  // Apply velocities
  let nx = entity.x + entity.vx * dt;
  let ny = entity.y + entity.vy * dt;

  // Tile collision on X then Y
  const tiles = world.tiles;

  // Horizontal collision
  if (collidesWithTiles(nx, entity.y, entity.w, entity.h, tiles)) {
    // Move back until not colliding
    const step = Math.sign(entity.vx) || 1;
    while (!collidesWithTiles(entity.x, entity.y, entity.w, entity.h, tiles) &&
      collidesWithTiles(nx, entity.y, entity.w, entity.h, tiles)) {
      nx -= step;
    }
    entity.vx = 0;
  }
  entity.x = nx;

  // Vertical collision
  const wasGrounded = entity.onGround;
  entity.onGround = false;
  if (collidesWithTiles(entity.x, ny, entity.w, entity.h, tiles)) {
    const step = Math.sign(entity.vy) || 1;
    while (!collidesWithTiles(entity.x, entity.y, entity.w, entity.h, tiles) &&
      collidesWithTiles(entity.x, ny, entity.w, entity.h, tiles)) {
      ny -= step;
    }
    if (entity.vy > 0) {
      entity.onGround = true;
      entity.coyote = 0.1; // coyote time
    }
    entity.vy = 0;
  }
  entity.y = ny;

  // Ground friction
  if (entity.onGround) {
    entity.vx *= 0.85;
  } else {
    entity.vx *= 0.99;
  }

  // Hazard checks
  for (const hz of world.hazards) {
    if (aabb(entity.x, entity.y, entity.w, entity.h, hz.x, hz.y, hz.w, hz.h)) {
      if (hz.type === 'rain' || hz.type === 'water') {
        if (entity.onHazardTick) entity.onHazardTick(hz);
      }
      if (hz.type === 'wind') {
        entity.vx += hz.forceX * dt;
        entity.vy += hz.forceY * dt;
      }
      if (hz.type === 'darkness') {
        if (entity.onDarknessTick) entity.onDarknessTick(hz);
      }
    }
  }

  // Leaving ground resets jump buffering properly
  if (!entity.onGround && wasGrounded) {
    // continue coyote timer
  }
}

// PUBLIC_INTERFACE
export function collidesWithTiles(x, y, w, h, tiles) {
  /** Collision test against solid tiles array {width,height,data,solid:[ids]} */
  const minTX = Math.floor(x / TILE);
  const maxTX = Math.floor((x + w - 1) / TILE);
  const minTY = Math.floor(y / TILE);
  const maxTY = Math.floor((y + h - 1) / TILE);
  for (let ty = minTY; ty <= maxTY; ty++) {
    for (let tx = minTX; tx <= maxTX; tx++) {
      if (isSolid(tx, ty, tiles)) return true;
    }
  }
  return false;
}

function isSolid(tx, ty, tiles) {
  if (tx < 0 || ty < 0 || tx >= tiles.width || ty >= tiles.height) return true;
  const id = tiles.data[ty * tiles.width + tx];
  return tiles.solid.includes(id);
}
