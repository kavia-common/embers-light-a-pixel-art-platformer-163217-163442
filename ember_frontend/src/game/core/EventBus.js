//
// EventBus.js - simple pub/sub bus to decouple systems
//
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  // PUBLIC_INTERFACE
  on(event, handler) {
    /** Subscribe to an event with a handler. */
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  // PUBLIC_INTERFACE
  off(event, handler) {
    /** Unsubscribe a handler from an event. */
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this.listeners.delete(event);
    }
  }

  // PUBLIC_INTERFACE
  emit(event, payload) {
    /** Emit an event with payload to all subscribers. */
    const set = this.listeners.get(event);
    if (set) {
      for (const h of Array.from(set)) {
        try { h(payload); } catch (e) { /* eslint-disable no-console */ console.error(e); }
      }
    }
  }
}

const bus = new EventBus();
export default bus;
