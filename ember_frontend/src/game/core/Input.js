//
// Input.js - keyboard state management for platformer controls
//
const defaultBindings = {
  left: ['ArrowLeft', 'a', 'A'],
  right: ['ArrowRight', 'd', 'D'],
  up: ['ArrowUp', 'w', 'W'],
  down: ['ArrowDown', 's', 'S'],
  jump: ['Space', 'k', 'K'],
  burst: ['j', 'J'],
  seed: ['l', 'L'],
  dim: ['Shift'],
  menu: ['Escape'],
  map: ['m', 'M'],
  interact: ['e', 'E'],
  pause: ['p', 'P']
};

class Input {
  constructor(bindings = defaultBindings) {
    this.bindings = bindings;
    this.state = {};
    this.pressed = {};
    this.released = {};
    this.active = true;
    this._onKeyDown = (e) => this._handle(e, true);
    this._onKeyUp = (e) => this._handle(e, false);
  }

  // PUBLIC_INTERFACE
  attach() {
    /** Attach event listeners for keyboard input. */
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  // PUBLIC_INTERFACE
  detach() {
    /** Detach keyboard listeners. */
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  // PUBLIC_INTERFACE
  update() {
    /** Clear per-frame pressed/released flags. Call once per frame. */
    this.pressed = {};
    this.released = {};
  }

  // PUBLIC_INTERFACE
  isDown(action) {
    /** Is action currently held down. */
    return !!this.state[action];
  }

  // PUBLIC_INTERFACE
  wasPressed(action) {
    /** Was action pressed this frame. */
    return !!this.pressed[action];
  }

  // PUBLIC_INTERFACE
  wasReleased(action) {
    /** Was action released this frame. */
    return !!this.released[action];
  }

  _handle(e, down) {
    if (!this.active) return;
    const key = e.key;
    for (const action in this.bindings) {
      if (this.bindings[action].includes(key)) {
        if (down && !this.state[action]) {
          this.pressed[action] = true;
        } else if (!down && this.state[action]) {
          this.released[action] = true;
        }
        this.state[action] = down;
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(key)) {
          e.preventDefault();
        }
      }
    }
  }
}

const input = new Input();
export default input;
