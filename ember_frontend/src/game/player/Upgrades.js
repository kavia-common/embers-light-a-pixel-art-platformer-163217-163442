export class Upgrades {
  constructor() {
    this.flags = {
      everbright_coal: false,
      solar_mirror: false,
      flame_cloak: false,
    };
  }

  has(k) { return !!this.flags[k]; }
  toggle(k) { this.flags[k] = !this.flags[k]; }

  getFlameDecayMultiplier() {
    // Everbright coal reduces decay
    return this.flags.everbright_coal ? 0.7 : 1.0;
  }

  // PUBLIC_INTERFACE
  serialize() { return { ...this.flags }; }
  // PUBLIC_INTERFACE
  deserialize(s) { if (s) this.flags = { ...this.flags, ...s }; }
}
