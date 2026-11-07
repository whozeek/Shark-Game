// First-person walker: smooth acceleration, gentle head bob, collision with buildings and props,
// curb steps, and sitting on benches/stoops/café seats.
import * as THREE from 'three';

export class Player {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.x = 0; this.z = 0; this.ground = 0.15; this.yaw = 0; this.pitch = 0;
    this.vx = 0; this.vz = 0;
    this.bob = 0; this.bobAmt = 0;
    this.eye = 1.66;
    this.seat = null;
    this.onStep = null;
    this.radius = 0.32;
    this.lookYawOff = 0; this.lookPitchOff = 0;
    this.speed = 0;
  }
  setCity(cb) { this.cb = cb; this.level = null; this.toSpawn(); }
  get lv() { return this.level ? this.cb.levels[this.level] : null; }
  colWorld() { return this.lv ? this.lv.col : this.cb.col; }
  groundHere() { return this.lv ? this.lv.floor : (this.cb.groundAt ? this.cb.groundAt(this.x, this.z) : 0.15); }
  /** Move to another level (or back to the street with level null). */
  teleport(to) {
    if (this.seat) this.seat = null;
    this.level = to.level || null;
    this.x = to.x; this.z = to.z;
    if (to.yaw !== undefined) this.yaw = to.yaw;
    this.vx = this.vz = 0;
    this.ground = this.groundHere();
  }
  toSpawn() {
    const s = this.cb.spawn;
    this.x = s.x; this.z = s.z; this.yaw = s.yaw; this.pitch = -0.03;
    this.vx = this.vz = 0; this.seat = null; this.level = null;
    this.ground = this.cb.groundAt ? this.cb.groundAt(this.x, this.z) : 0.15;
  }
  sit(seat) {
    this.seat = seat; this.vx = this.vz = 0;
    this.preSeat = { x: this.x, z: this.z };
    this.yaw = seat.yaw; this.pitch = -0.02;
  }
  stand() {
    if (!this.seat) return;
    const s = this.seat;
    // step forward off the seat
    const fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw);
    const p = this.colWorld().resolve(s.x + fx * 0.9, s.z + fz * 0.9, this.radius);
    this.x = p.x; this.z = p.z;
    this.seat = null;
  }
  applyLook(settings, scale = 1) {
    const l = this.controls.consumeLook();
    const sens = settings.lookSensitivity * scale;
    this.yaw -= l.dx * 0.0032 * sens;
    this.pitch -= l.dy * 0.0028 * sens * (settings.invertY ? -1 : 1);
    this.pitch = Math.max(-1.25, Math.min(1.25, this.pitch));
    return l;
  }
  update(dt, settings, opts = {}) {
    const c = this.controls;
    this.applyLook(settings);
    this.yaw += c.readTurn() * dt * 1.7 * settings.lookSensitivity;
    let speed = 0;
    if (this.seat) {
      const s = this.seat;
      this.x = s.x; this.z = s.z; this.ground = s.y;
      if (c.moving()) { const m = c.readMove(); if (Math.abs(m.z) > 0.3 || Math.abs(m.x) > 0.3) this.stand(); }
    } else {
      const m = c.readMove();
      const base = 1.45 * settings.walkSpeed * (m.run ? 1.9 : 1);
      const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
      const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
      const tvx = (fx * m.z + rx * m.x) * base, tvz = (fz * m.z + rz * m.x) * base;
      const k = Math.min(1, dt * (Math.hypot(tvx, tvz) > 0.01 ? 5 : 7));
      this.vx += (tvx - this.vx) * k; this.vz += (tvz - this.vz) * k;
      speed = Math.hypot(this.vx, this.vz);
      if (speed > 0.001) {
        const p = this.colWorld().resolve(this.x + this.vx * dt, this.z + this.vz * dt, this.radius);
        this.x = p.x; this.z = p.z;
      }
      const g = this.groundHere();
      this.ground += (g - this.ground) * Math.min(1, dt * 10);
    }
    this.speed = speed;
    this.applyCamera(dt, settings, speed);
  }
  /** Used by the stroll: move along a desired position with collision. */
  moveTo(nx, nz) {
    const p = this.cb.col.resolve(nx, nz, this.radius * 0.8);
    this.x = p.x; this.z = p.z;
    const g = this.cb.groundAt ? this.cb.groundAt(this.x, this.z) : 0.15;
    this.ground += (g - this.ground) * 0.15;
  }
  applyCamera(dt, settings, speed) {
    const bobOn = settings.headBob && !settings.reducedMotion;
    const prev = this.bob;
    if (speed > 0.2) this.bob += dt * speed / 0.74 * Math.PI;
    this.bobAmt += ((speed > 0.2 ? Math.min(1, speed / 1.4) : 0) - this.bobAmt) * Math.min(1, dt * 4);
    if (Math.floor(prev / Math.PI) !== Math.floor(this.bob / Math.PI) && speed > 0.2) this.onStep?.(speed);
    const amp = bobOn ? this.bobAmt : this.bobAmt * 0.15;
    const by = Math.abs(Math.sin(this.bob)) * 0.032 * amp - 0.016 * amp;
    const bx = Math.cos(this.bob) * 0.018 * amp;
    const eye = this.seat ? 1.14 : this.eye;
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    this.camera.position.set(this.x + rx * bx, this.ground + eye + by, this.z + rz * bx);
    this.camera.rotation.set(this.pitch + this.lookPitchOff, this.yaw + this.lookYawOff, bobOn ? Math.cos(this.bob) * 0.004 * amp : 0, 'YXZ');
  }
}
