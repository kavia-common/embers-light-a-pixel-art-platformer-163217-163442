export class Inventory {
  constructor() {
    this.items = {
      seeds: 3,
      keys: 0,
      shards: 0,
    };
  }
  add(item, count = 1) {
    this.items[item] = (this.items[item] || 0) + count;
  }
  use(item, count = 1) {
    if ((this.items[item] || 0) >= count) {
      this.items[item] -= count;
      return true;
    }
    return false;
  }
  // PUBLIC_INTERFACE
  serialize() { return { ...this.items }; }
  // PUBLIC_INTERFACE
  deserialize(s) { if (s) this.items = { ...s }; }
}
