export class CombatSystem {
  constructor(world, player, audio) {
    this.world = world;
    this.player = player;
    this.audio = audio;

    this.seedCount = 2;

    this.bursts = []; // active burst effects
    this.seeds = []; // active seed projectiles
    this.ignitedLights = [];
    this._bindInput();
  }

  _bindInput() {
    // We'll poll player's input reference via a per-frame hook
    this._onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.code === 'KeyJ' || e.code === 'KeyF') this.tryBurst();
      if (e.code === 'KeyL') this.trySeed();
    };
    window.addEventListener('keydown', this._onKeyDown);
  }

  tryBurst() {
    if (this.player.cooldowns.burst > 0) return;
    const cost = 12;
    if (this.player.flame < cost) return;
    this.player.flame -= cost;
    this.player.cooldowns.burst = 0.6;

    this.audio.playSfxBurst();
    // Ignite nearby objects and maybe braziers
    this.world.igniteNearby(this.player.pos.x, this.player.pos.y, 60);
    for (const b of this.world.braziers) {
      const dx = b.x - this.player.pos.x;
      const dy = b.y - this.player.pos.y;
      if (dx * dx + dy * dy <= 60 * 60) b.lit = true;
    }
    // Visual effect
    this.bursts.push({ x: this.player.pos.x, y: this.player.pos.y, r: 8, life: 0.3 });
  }

  trySeed() {
    if (this.player.cooldowns.seed > 0) return;
    if (this.seedCount <= 0) return;
    const cost = 6;
    if (this.player.flame < cost) return;
    this.player.flame -= cost;
    this.player.cooldowns.seed = 0.3;
    this.seedCount -= 1;
    this.audio.playSfxSeed();

    const dir = 1; // TODO: track last move dir
    const speed = 180;
    this.seeds.push({
      x: this.player.pos.x, y: this.player.pos.y - 6,
      vx: (dir >= 0 ? 1 : -1) * speed, vy: -40,
      life: 2.0,
    });
  }

  applyIgnitions(dt) {
    // Update bursts
    for (const b of this.bursts) {
      b.life -= dt;
      b.r += 160 * dt;
    }
    this.bursts = this.bursts.filter(b => b.life > 0);

    // Update seeds
    for (const s of this.seeds) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 180 * dt;
      s.life -= dt;

      // Ignite on contact near ignitables/brazier
      const ignited = this.world.igniteNearby(s.x, s.y, 22);
      if (ignited > 0) s.life = 0;
      for (const b of this.world.braziers) {
        const dx = b.x - s.x, dy = b.y - s.y;
        if (dx * dx + dy * dy < 20 * 20) { b.lit = true; s.life = 0; }
      }
    }
    this.seeds = this.seeds.filter(s => s.life > 0);
  }

  update(dt) {
    // Could handle enemy interactions here in a future pass
  }

  renderLights(lighting) {
    // Seed lights
    for (const s of this.seeds) {
      lighting.addLight(s.x, s.y, 24, 'rgba(255,200,100,1)');
    }
    // Burst glow
    for (const b of this.bursts) {
      lighting.addLight(b.x, b.y, b.r * 0.3, 'rgba(255,170,60,1)');
    }
    // Ignited objects
    for (const it of this.world.ignitables) {
      if (it.onFire) lighting.addLight(it.x, it.y, 36, 'rgba(255,160,70,1)');
    }
    // Braziers
    for (const br of this.world.braziers) {
      if (br.lit) lighting.addLight(br.x, br.y, 70, 'rgba(255,190,100,1)');
    }
  }

  // PUBLIC_INTERFACE
  serialize() { return { seeds: this.seedCount }; }
  // PUBLIC_INTERFACE
  deserialize(s) { if (s && typeof s.seeds === 'number') this.seedCount = s.seeds; }
}
