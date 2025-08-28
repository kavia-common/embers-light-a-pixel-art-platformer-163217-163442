export class PuzzleSystem {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    this.beams = []; // computed solar beams
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    this._computeBeams();
    // If solar_mirror upgrade, reflect beams to ignite braziers
    if (this.beams.length > 0) {
      for (const b of this.world.braziers) {
        for (const beam of this.beams) {
          const dx = b.x - beam.x;
          const dy = b.y - beam.y;
          if (dx * dx + dy * dy < 20 * 20) {
            if (this.player.upgrades.has('solar_mirror')) {
              b.lit = true;
            }
          }
        }
      }
    }
  }

  _computeBeams() {
    this.beams.length = 0;
    // Simulate weak sunlight from top, mirrors redirect downward
    for (const m of this.world.mirrors) {
      // Beam originating slightly above mirror
      const bx = m.x, by = m.y - 40;
      this.beams.push({ x: bx, y: by, angle: m.angle });
    }
  }
}
