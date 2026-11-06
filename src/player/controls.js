// Input: keyboard, mouse/pointer drag, touch (virtual stick + look drag) and gamepads.
// Produces a simple per-frame intent: move vector, look deltas and action presses.
export class Controls {
  constructor(el, ui) {
    this.el = el;
    this.keys = new Set();
    this.look = { dx: 0, dy: 0 };
    this.move = { x: 0, z: 0 };
    this.touchMove = { x: 0, z: 0 };
    this.actions = new Set();
    this.dragging = false;
    this.enabled = true;
    this.lastInput = performance.now();
    this.pointers = new Map();
    this.stick = null;
    this.ui = ui;
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => this.keys.clear());
    el.addEventListener('pointerdown', (e) => this.onDown(e));
    window.addEventListener('pointermove', (e) => this.onMove(e));
    window.addEventListener('pointerup', (e) => this.onUp(e));
    window.addEventListener('pointercancel', (e) => this.onUp(e));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('wheel', (e) => { this.wheel = (this.wheel || 0) + Math.sign(e.deltaY); }, { passive: true });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === el; });
  }
  isTyping(e) { const t = e.target; return t && (t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox') || t?.tagName === 'TEXTAREA' || t?.tagName === 'SELECT'; }
  onKey(e, down) {
    if (this.isTyping(e)) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    // ignore movement keys while a menu control has focus (sliders use arrows)
    const inMenu = e.target && e.target.closest && e.target.closest('.panel');
    if (inMenu && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) return;
    if (down) {
      if (!this.keys.has(k)) this.actions.add(k);
      this.keys.add(k);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k) && !inMenu && !(e.target && e.target.closest && e.target.closest('button'))) e.preventDefault();
    } else this.keys.delete(k);
    this.lastInput = performance.now();
  }
  onDown(e) {
    this.lastInput = performance.now();
    this.el.focus({ preventScroll: true });
    if (e.pointerType === 'touch') {
      const w = window.innerWidth, h = window.innerHeight;
      // left-bottom area: virtual stick
      if (e.clientX < w * 0.42 && e.clientY > h * 0.45 && !this.stick) {
        this.stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
        this.ui?.showStick?.(this.stick);
      } else {
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      return;
    }
    if (e.button === 0 || e.button === 2) {
      this.dragging = true; this.px = e.clientX; this.py = e.clientY;
      this.el.setPointerCapture?.(e.pointerId);
    }
  }
  onMove(e) {
    if (e.pointerType === 'touch') {
      if (this.stick && e.pointerId === this.stick.id) {
        this.stick.x = e.clientX; this.stick.y = e.clientY;
        const dx = e.clientX - this.stick.x0, dy = e.clientY - this.stick.y0;
        const r = 55; const m = Math.min(1, Math.hypot(dx, dy) / r);
        const a = Math.atan2(dy, dx);
        this.touchMove.x = Math.cos(a) * m; this.touchMove.z = Math.sin(a) * m;
        this.ui?.showStick?.(this.stick);
      } else if (this.pointers.has(e.pointerId)) {
        const p = this.pointers.get(e.pointerId);
        this.look.dx += (e.clientX - p.x) * 1.3; this.look.dy += (e.clientY - p.y) * 1.3;
        p.x = e.clientX; p.y = e.clientY;
        this.lastLook = performance.now();
      }
      this.lastInput = performance.now();
      return;
    }
    if (this.locked) { this.look.dx += e.movementX; this.look.dy += e.movementY; this.lastLook = performance.now(); return; }
    if (!this.dragging) return;
    this.look.dx += e.clientX - this.px; this.look.dy += e.clientY - this.py;
    this.px = e.clientX; this.py = e.clientY;
    this.lastInput = this.lastLook = performance.now();
  }
  onUp(e) {
    if (e.pointerType === 'touch') {
      if (this.stick && e.pointerId === this.stick.id) { this.stick = null; this.touchMove.x = this.touchMove.z = 0; this.ui?.showStick?.(null); }
      this.pointers.delete(e.pointerId);
      return;
    }
    this.dragging = false;
  }
  pollGamepad(dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const dz = (v) => Math.abs(v) < 0.15 ? 0 : v;
      const lx = dz(p.axes[0]), ly = dz(p.axes[1]), rx = dz(p.axes[2] || 0), ry = dz(p.axes[3] || 0);
      if (lx || ly) { this.padMove = { x: lx, z: ly }; this.lastInput = performance.now(); } else this.padMove = null;
      if (rx || ry) { this.look.dx += rx * 600 * dt; this.look.dy += ry * 400 * dt; this.lastLook = this.lastInput = performance.now(); }
      const prev = this.padPrev || [];
      const map = { 0: 'e', 1: 'Escape', 2: 'u', 3: 't', 9: 'm', 8: 'h' };
      p.buttons.forEach((b, i) => { if (b.pressed && !prev[i] && map[i]) this.actions.add(map[i]); });
      this.padPrev = p.buttons.map((b) => b.pressed);
      this.padRun = p.buttons[10]?.pressed || p.buttons[7]?.value > 0.5;
      break;
    }
  }
  /** Returns move intent in camera space: x = strafe right, z = forward. */
  readMove() {
    const k = this.keys;
    let x = 0, z = 0;
    if (k.has('w') || k.has('ArrowUp')) z += 1;
    if (k.has('s') || k.has('ArrowDown')) z -= 1;
    if (k.has('a')) x -= 1;
    if (k.has('d')) x += 1;
    if (this.touchMove.x || this.touchMove.z) { x += this.touchMove.x; z -= this.touchMove.z; }
    if (this.padMove) { x += this.padMove.x; z -= this.padMove.z; }
    if (this.uiMove) { x += this.uiMove.x; z += this.uiMove.z; }
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z, run: k.has('Shift') || !!this.padRun };
  }
  consumeLook() { const l = { dx: this.look.dx, dy: this.look.dy }; this.look.dx = this.look.dy = 0; return l; }
  consumeActions() { const a = new Set(this.actions); this.actions.clear(); return a; }
  consumeWheel() { const w = this.wheel || 0; this.wheel = 0; return w; }
  /** Keyboard turning (arrow keys) for keyboard-only and TV-remote use: -1..1 */
  readTurn() { const k = this.keys; return (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0); }
  moving() { const m = this.readMove(); return Math.hypot(m.x, m.z) > 0.05 || this.readTurn() !== 0; }
}
