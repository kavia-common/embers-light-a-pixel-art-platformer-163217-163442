export class StealthSystem {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    this.isInShelter = false;
    this.inDarkness = true;
  }

  update(dt) {
    this.isInShelter = this.world.isShelteredAt(this.player.pos.x, this.player.pos.y);
    // In darkness if away from lit braziers and dimmed
    let nearLight = false;
    for (const b of this.world.braziers) {
      const dx = b.x - this.player.pos.x;
      const dy = b.y - this.player.pos.y;
      const d2 = dx * dx + dy * dy;
      if (b.lit && d2 < 120 * 120) { nearLight = true; break; }
    }
    this.inDarkness = !nearLight && this.player.dimFactor < 1.0;
  }
}
