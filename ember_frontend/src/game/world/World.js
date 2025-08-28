import { clamp } from '../utils/math';

export class World {
  constructor() {
    // Simple tile map: 0 empty, 1 solid, 2 water (rain puddle), 3 shelter
    this.tileSize = 12;
    this.width = 160;
    this.height = 90;
    this.tiles = new Uint8Array(this.width * this.height);
    this.biome = 'Ruins';

    // Populate with platforms and shelters
    this._generateDemoLevel();

    // Mirrors for puzzles
    this.mirrors = [
      { x: 400, y: 280, angle: 45 },
      { x: 560, y: 220, angle: 315 },
    ];

    // Braziers to rekindle (goals)
    this.braziers = [
      { x: 720, y: 260, lit: false },
      { x: 980, y: 220, lit: false },
    ];

    // Ignitable objects list
    this.ignitables = [
      { x: 620, y: 260, w: 8, h: 8, onFire: false, fuel: 0 },
    ];
  }

  _generateDemoLevel() {
    // Ground
    for (let x = 0; x < this.width; x++) {
      this.setTile(x, this.height - 6, 1);
      this.setTile(x, this.height - 5, 1);
    }
    // Platforms and shelters
    for (let x = 10; x < 40; x++) this.setTile(x, 60, 1);
    for (let x = 50; x < 80; x++) this.setTile(x, 50, 1);
    for (let x = 90; x < 120; x++) this.setTile(x, 40, 1);

    // Shelter ceiling tiles (3)
    for (let x = 22; x < 28; x++) this.setTile(x, 59, 3);
    for (let x = 58; x < 62; x++) this.setTile(x, 49, 3);
  }

  idx(x, y) { return y * this.width + x; }
  getTile(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 1;
    return this.tiles[this.idx(x, y)];
  }
  setTile(x, y, v) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.tiles[this.idx(x, y)] = v;
  }

  collideAABB(l, t, r, b) {
    const ts = this.tileSize;
    const x0 = Math.floor(l / ts);
    const y0 = Math.floor(t / ts);
    const x1 = Math.floor(r / ts);
    const y1 = Math.floor(b / ts);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const tile = this.getTile(x, y);
        if (tile === 1) return true;
      }
    }
    return false;
  }

  isShelteredAt(x, y) {
    const tx = Math.floor(x / this.tileSize);
    const ty = Math.floor(y / this.tileSize) - 1;
    return this.getTile(tx, ty) === 3;
  }

  igniteNearby(x, y, radius) {
    let ignited = 0;
    for (const it of this.ignitables) {
      const dx = it.x - x;
      const dy = it.y - y;
      if (dx * dx + dy * dy <= radius * radius) {
        it.onFire = true;
        it.fuel = 5;
        ignited++;
      }
    }
    return ignited;
  }

  update(dt) {
    for (const it of this.ignitables) {
      if (it.onFire) {
        it.fuel -= dt;
        if (it.fuel <= 0) { it.onFire = false; it.fuel = 0; }
      }
    }
  }

  render(r) {
    // Draw tiles
    const ts = this.tileSize;
    const startX = Math.floor(r.camera.x / ts) - 2;
    const startY = Math.floor(r.camera.y / ts) - 2;
    const endX = startX + Math.ceil(r.viewW / ts) + 4;
    const endY = startY + Math.ceil(r.viewH / ts) + 4;

    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = this.getTile(tx, ty);
        const w = ts, h = ts;
        const x = tx * ts, y = ty * ts;
        if (tile === 1) r.rect(x, y, w, h, '#2e2d32');
        else if (tile === 2) r.rect(x, y, w, h, '#1b2230');
        else if (tile === 3) r.rect(x, y, w, h, '#201f25');
      }
    }

    // Mirrors
    for (const m of this.mirrors) {
      r.rect(m.x - 3, m.y - 12, 6, 24, '#a7a1b6');
    }

    // Braziers
    for (const b of this.braziers) {
      r.rect(b.x - 6, b.y - 6, 12, 12, b.lit ? '#ff9900' : '#44414c');
    }

    // Ignitables
    for (const it of this.ignitables) {
      r.rect(it.x - it.w/2, it.y - it.h/2, it.w, it.h, it.onFire ? '#ffb347' : '#544c58');
    }
  }

  // PUBLIC_INTERFACE
  serialize() {
    return {
      biome: this.biome,
      braziers: this.braziers.map(b => ({ ...b })),
      ignitables: this.ignitables.map(i => ({ ...i })),
    };
  }

  // PUBLIC_INTERFACE
  deserialize(s) {
    if (!s) return;
    this.biome = s.biome || this.biome;
    if (s.braziers) this.braziers = s.braziers.map(b => ({ ...b }));
    if (s.ignitables) this.ignitables = s.ignitables.map(i => ({ ...i }));
  }
}
