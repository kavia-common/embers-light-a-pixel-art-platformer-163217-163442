//
// MathUtils.js - small helpers for physics and rendering
//

// PUBLIC_INTERFACE
export function clamp(value, min, max) {
  /** Clamp a number between min and max. */
  return Math.max(min, Math.min(max, value));
}

// PUBLIC_INTERFACE
export function lerp(a, b, t) {
  /** Linear interpolation between a and b by t in [0,1]. */
  return a + (b - a) * t;
}

// PUBLIC_INTERFACE
export function randRange(min, max) {
  /** Random float in [min, max). */
  return Math.random() * (max - min) + min;
}

// PUBLIC_INTERFACE
export function approach(current, target, delta) {
  /** Move current towards target by delta without overshoot. */
  if (current < target) return Math.min(current + delta, target);
  if (current > target) return Math.max(current - delta, target);
  return current;
}
