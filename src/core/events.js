export class Emitter {
  constructor() { this.handlers = new Map(); }
  on(evt, fn) {
    if (!this.handlers.has(evt)) this.handlers.set(evt, new Set());
    this.handlers.get(evt).add(fn);
    return () => this.handlers.get(evt)?.delete(fn);
  }
  emit(evt, ...args) {
    const set = this.handlers.get(evt);
    if (set) for (const fn of [...set]) fn(...args);
  }
}
export const bus = new Emitter();
