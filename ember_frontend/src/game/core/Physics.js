import { clamp } from '../utils/math';

export class Physics {
  constructor() {
    this.gravity = 900; // px/s^2 in world units (pre-scaling)
    this.termVel = 900;
    this.friction = 1200;
  }

  resolve(world, player, dt) {
    // Horizontal acceleration from input already applied by Player
    // Vertical gravity
    player.vel.y += this.gravity * dt;
    player.vel.y = clamp(player.vel.y, -this.termVel, this.termVel);

    // Predict new position
    const nextX = player.pos.x + player.vel.x * dt;
    const nextY = player.pos.y + player.vel.y * dt;

    // Collide horizontally
    const hitX = world.collideAABB(nextX - player.hw, player.pos.y - player.hh, nextX + player.hw, player.pos.y + player.hh);
    if (hitX) {
      // Stop horizontal
      while (!world.collideAABB(Math.sign(player.vel.x) > 0 ? player.pos.x + 1 - player.hw : player.pos.x - 1 - player.hw,
        player.pos.y - player.hh,
        Math.sign(player.vel.x) > 0 ? player.pos.x + 1 + player.hw : player.pos.x - 1 + player.hw,
        player.pos.y + player.hh)) {
        player.pos.x += Math.sign(player.vel.x) > 0 ? 1 : -1;
      }
      player.vel.x = 0;
    } else {
      player.pos.x = nextX;
    }

    // Collide vertically
    const wasGrounded = player.grounded;
    const hitY = world.collideAABB(player.pos.x - player.hw, nextY - player.hh, player.pos.x + player.hw, nextY + player.hh);
    if (hitY) {
      if (player.vel.y > 0) {
        player.grounded = true;
        // Snap up until not colliding
        while (world.collideAABB(player.pos.x - player.hw, player.pos.y + 1 - player.hh, player.pos.x + player.hw, player.pos.y + 1 + player.hh)) {
          player.pos.y -= 1;
        }
      } else {
        // Hitting ceiling
        while (world.collideAABB(player.pos.x - player.hw, player.pos.y - 1 - player.hh, player.pos.x + player.hw, player.pos.y - 1 + player.hh)) {
          player.pos.y += 1;
        }
      }
      player.vel.y = 0;
    } else {
      player.grounded = false;
      player.pos.y = nextY;
    }

    // Apply friction when grounded
    if (player.grounded) {
      if (Math.abs(player.vel.x) < this.friction * dt) player.vel.x = 0;
      else player.vel.x -= Math.sign(player.vel.x) * this.friction * dt;
    }

    if (!wasGrounded && player.grounded) {
      player.coyoteTimer = 0.08;
      player.jumpCount = 0;
    }
    if (!player.grounded) {
      player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
    }
  }
}
