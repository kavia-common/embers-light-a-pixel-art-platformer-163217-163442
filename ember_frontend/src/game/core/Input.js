export class Input {
  constructor(dom) {
    this.keys = new Map();
    this.pressed = new Set();
    this.released = new Set();
    this.suppressed = false;

    this._down = (e) => {
      this.keys.set(e.code, true);
      this.pressed.add(e.code);
    };
    this._up = (e) => {
      this.keys.set(e.code, false);
      this.released.add(e.code);
    };

    dom.tabIndex = 0;
    dom.addEventListener('keydown', this._down);
    dom.addEventListener('keyup', this._up);
    window.addEventListener('keydown', this._down);
    window.addEventListener('keyup', this._up);
  }

  update() {
    this.pressed.clear();
    this.released.clear();
    this.suppressed = false;
  }

  suppressFrame() {
    this.suppressed = true;
  }

  destroy() {
    window.removeEventListener('keydown', this._down);
    window.removeEventListener('keyup', this._up);
  }

  get left() { return !this.suppressed && (this.keys.get('ArrowLeft') || this.keys.get('KeyA')); }
  get right() { return !this.suppressed && (this.keys.get('ArrowRight') || this.keys.get('KeyD')); }
  get up() { return !this.suppressed && (this.keys.get('ArrowUp') || this.keys.get('KeyW')); }
  get down() { return !this.suppressed && (this.keys.get('ArrowDown') || this.keys.get('KeyS')); }

  get jumpPressed() { return !this.suppressed && (this.pressed.has('Space') || this.pressed.has('KeyK')); }
  get jump() { return !this.suppressed && (this.keys.get('Space') || this.keys.get('KeyK')); }

  get burstPressed() { return !this.suppressed && (this.pressed.has('KeyJ') || this.pressed.has('KeyF')); }
  get seedPressed() { return !this.suppressed && (this.pressed.has('KeyL')); }
  get dim() { return !this.suppressed && (this.keys.get('ShiftLeft') || this.keys.get('ShiftRight')); }
}
