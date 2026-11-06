// First-person umbrella: visible as a canopy edge across the top of the view with a handle in
// the lower right. Drips fall from the rim; it opens and closes with a short animation.
import * as THREE from 'three';
import { LAYER_NO_REFLECT } from '../world/cityBase.js';

export class Umbrella {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.layers.set(LAYER_NO_REFLECT);
    this.open = 0; this.target = 1;
    const ribs = 8;
    // canopy: shallow octagonal dome
    const canopyGeo = new THREE.ConeGeometry(0.62, 0.24, ribs, 3, true);
    canopyGeo.translate(0, -0.12, 0);
    // bulge the panels slightly between ribs
    const p = canopyGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(z, x), r = Math.hypot(x, z);
      const bulge = 1 + 0.06 * Math.cos(a * ribs) * (r / 0.62);
      p.setXYZ(i, x * bulge, y - Math.pow(r / 0.62, 2) * 0.05, z * bulge);
    }
    canopyGeo.computeVertexNormals();
    this.mat = new THREE.MeshStandardMaterial({ color: 0x26304f, emissive: 0x0a0c14, roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true, opacity: 0.94 });
    this.canopy = new THREE.Mesh(canopyGeo, this.mat);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.5, depthTest: false, depthWrite: false, transparent: true });
    const ribG = [];
    for (let k = 0; k < ribs; k++) {
      const a = k / ribs * Math.PI * 2;
      const g = new THREE.CylinderGeometry(0.004, 0.004, 0.66, 3);
      g.rotateZ(Math.PI / 2 - 0.36); g.translate(0.31, -0.12, 0); g.rotateY(-a);
      ribG.push(g);
    }
    this.ribs = new THREE.Group();
    for (const g of ribG) this.ribs.add(new THREE.Mesh(g, ribMat));
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.6, depthTest: false, depthWrite: false, transparent: true });
    this.shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.95, 6).translate(0, -0.47, 0), shaftMat);
    this.handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 12, Math.PI).rotateZ(Math.PI).translate(0.045, -0.95, 0), new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.6, depthTest: false, depthWrite: false, transparent: true }));
    this.top = new THREE.Group();
    this.top.add(this.canopy, this.ribs, this.shaft, this.handle);
    this.group.add(this.top);
    // drips from rib tips
    this.drips = [];
    const dripGeo = new THREE.SphereGeometry(0.0028, 4, 3); dripGeo.scale(1, 3, 1);
    const dripMat = new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0.35, depthTest: false });
    for (let k = 0; k < 10; k++) {
      const m = new THREE.Mesh(dripGeo, dripMat);
      m.userData = { t: Math.random(), rib: k % ribs };
      this.drips.push(m); this.top.add(m);
    }
    for (const o of [this.canopy, this.shaft, this.handle, ...this.ribs.children, ...this.drips]) { o.renderOrder = 999; o.layers.set(LAYER_NO_REFLECT); o.frustumCulled = false; }
    camera.add(this.group);
    this.group.position.set(0.18, 0.66, -0.2);
    this.group.rotation.set(-0.1, 0, -0.08);
    this.sway = 0;
  }
  setColor(c) { this.mat.color.set(c); }
  setOpen(v, instant = false) { this.target = v ? 1 : 0; if (instant) this.open = this.target; }
  update(dt, t, opts) {
    this.open += (this.target - this.open) * Math.min(1, dt * 5);
    const o = this.open;
    this.group.visible = o > 0.02 && !opts.hidden;
    const spread = 0.25 + 0.75 * o;
    this.canopy.scale.set(spread, 1, spread);
    this.ribs.scale.set(spread, 1, spread);
    this.group.position.y = 0.66 - (1 - o) * 0.7;
    const walk = opts.speed || 0;
    this.sway += dt * (1 + walk);
    const bob = opts.reducedMotion ? 0 : Math.sin(opts.bob * 2) * 0.012 * Math.min(1, walk);
    this.group.rotation.set(-0.1 + Math.sin(this.sway * 0.7) * 0.012 + bob, Math.sin(this.sway * 0.5) * 0.02, -0.08 + Math.sin(this.sway * 0.9) * 0.015 + (opts.wind || 0) * 0.04);
    const rain = opts.rain || 0;
    for (const d of this.drips) {
      const u = d.userData;
      u.t += dt * (0.8 + rain * 1.5);
      if (u.t > 1) { u.t = 0; u.rib = Math.floor(Math.random() * 8); }
      const a = u.rib / 8 * Math.PI * 2;
      const r = 0.6 * spread;
      d.position.set(Math.cos(a) * r, -0.24 - u.t * u.t * 0.8, -Math.sin(a) * r);
      d.visible = rain > 0.05 && o > 0.8 && u.t > 0.15;
    }
  }
}
