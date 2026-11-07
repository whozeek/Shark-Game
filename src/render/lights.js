// Lighting rig: sky/ground ambient, sun or moon, a small pool of real point lights that follow the
// viewer to the nearest lamps and shopfronts, analytic light pools on wet ground, and soft
// volumetric cones beneath streetlights.
import * as THREE from 'three';
import { U, POOL_COUNT } from './shared.js';
import { isOpen } from '../world/kit.js';
import { LAYER_NO_REFLECT } from '../world/cityBase.js';

export class LightRig {
  constructor(scene) {
    this.scene = scene;
    this.hemi = new THREE.HemisphereLight(0x8090b0, 0x302820, 0.5);
    this.dir = new THREE.DirectionalLight(0xaabbdd, 0.3);
    this.dir.position.set(-60, 120, -40);
    scene.add(this.hemi, this.dir, this.dir.target);
    this.points = [];
    this.city = null;
    this.timer = 0;
    this.scales = { street: 1, shop: 1, neon: 1, porch: 1, shelter: 1, headlight: 1 };
    this.night = 1;
    this.streetOn = 1;
    this.cones = null;
  }
  setPointCount(n) {
    for (const p of this.points) this.scene.remove(p.light);
    this.points = [];
    for (let i = 0; i < n; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 18, 2);
      l.position.set(0, -100, 0);
      this.scene.add(l);
      this.points.push({ light: l, src: null, f: 0 });
    }
  }
  setCity(cb) {
    this.city = cb;
    for (const p of this.points) { p.src = null; p.f = 0; p.light.intensity = 0; }
    if (this.cones) { this.scene.remove(this.cones); this.cones.geometry.dispose(); this.cones = null; }
    if (cb.cones.length) this.cones = buildCones(cb.cones);
    if (this.cones) { this.cones.layers.set(LAYER_NO_REFLECT); this.scene.add(this.cones); }
  }
  kindScale(kind) {
    const s = this.scales;
    if (kind === 'street') return s.street * this.streetOn;
    if (kind === 'shop') return s.shop * (0.35 + 0.65 * this.night);
    if (kind === 'neon') return s.neon * (0.3 + 0.7 * this.night);
    if (kind === 'porch') return s.street * this.streetOn * 0.8;
    if (kind === 'shelter') return s.shop * (0.4 + 0.6 * this.night);
    return 1;
  }
  update(dt, camPos, dynamicPools = []) {
    const cb = this.city; if (!cb) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.3;
      // choose nearest light sources for real point lights (weighted by intensity)
      const want = this.points.length;
      if (want) {
        const scored = [];
        for (const L of cb.lights) {
          const d2 = (L.x - camPos.x) ** 2 + (L.z - camPos.z) ** 2;
          if (d2 > 70 * 70) continue;
          const w = this.kindScale(L.kind) * L.intensity * (isOpen(L.hours, this.hour ?? 20) ? 1 : 0.04);
          if (w < 0.05) continue;
          scored.push([d2 / (0.5 + Math.min(w, 30) / 30), L]);
        }
        scored.sort((a, b) => a[0] - b[0]);
        this.wanted = new Set(scored.slice(0, want).map((s) => s[1]));
        // free slots whose source isn't wanted
        const assigned = new Set(this.points.map((p) => p.src).filter(Boolean));
        for (const L of this.wanted) {
          if (assigned.has(L)) continue;
          const slot = this.points.find((p) => !p.src || (!this.wanted.has(p.src) && p.f <= 0.01));
          if (slot) { slot.src = L; slot.f = 0; assigned.add(L); slot.light.position.set(L.x, L.y, L.z); slot.light.color.copy(L.color); slot.light.distance = L.distance; }
        }
      }
      // ground light pools: nearest analytic pools
      const pools = [];
      for (const P of cb.pools) {
        const d2 = (P.x - camPos.x) ** 2 + (P.z - camPos.z) ** 2;
        if (d2 > 110 * 110) continue;
        const s = this.kindScale(P.kind) * P.strength * (isOpen(P.hours, this.hour ?? 20) ? 1 : 0.05);
        if (s < 0.02) continue;
        pools.push([d2, P, s]);
      }
      pools.sort((a, b) => a[0] - b[0]);
      this.poolList = pools;
    }
    // apply point light fades
    for (const p of this.points) {
      const want = p.src && this.wanted?.has(p.src);
      p.f = Math.max(0, Math.min(1, p.f + (want ? dt * 2.5 : -dt * 2.5)));
      if (!want && p.f === 0) p.src = null;
      p.light.intensity = p.src ? p.src.intensity * this.kindScale(p.src.kind) * p.f * (isOpen(p.src.hours, this.hour ?? 20) ? 1 : 0.04) : 0;
    }
    // write pool uniforms: dynamic first (headlights), then static
    const A = U.uPoolA.value, C = U.uPoolC.value;
    let i = 0;
    for (const d of dynamicPools) { if (i >= 10) break; A[i].set(d.x, d.z, d.r, d.s * this.scales.headlight); C[i].set(d.color.r, d.color.g, d.color.b); i++; }
    const list = this.poolList || [];
    for (let k = 0; k < list.length && i < POOL_COUNT; k++, i++) {
      const [, P, s] = list[k];
      A[i].set(P.x, P.z, P.r, s); C[i].set(P.color.r, P.color.g, P.color.b);
    }
    for (; i < POOL_COUNT; i++) A[i].w = 0;
    if (this.cones) {
      const m = this.cones.material.uniforms;
      m.uStrength.value = this.scales.street * this.streetOn;
      m.uCam.value.copy(camPos);
    }
  }
  dispose() { this.setPointCount(0); if (this.cones) { this.scene.remove(this.cones); this.cones.geometry.dispose(); } }
}

export const ConeU = { uHaze: { value: 0.5 } };

function buildCones(cones) {
  const geos = [];
  for (const c of cones) {
    const g = new THREE.CylinderGeometry(0.15, c.r, c.h, 20, 1, true);
    g.translate(c.x, c.y - c.h / 2, c.z);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { col[i * 4] = c.color.r; col[i * 4 + 1] = c.color.g; col[i * 4 + 2] = c.color.b; col[i * 4 + 3] = c.y; }
    g.setAttribute('cdata', new THREE.BufferAttribute(col, 4));
    geos.push(g.toNonIndexed());
  }
  let total = 0; for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), cd = new Float32Array(total * 4), nrm = new Float32Array(total * 3);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3); cd.set(g.attributes.cdata.array, o * 4); nrm.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count; g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute('cdata', new THREE.BufferAttribute(cd, 4));
  geo.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, ...ConeU, uStrength: { value: 1 }, uCam: { value: new THREE.Vector3() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 cdata; varying vec3 vCol; varying float vT; varying vec3 vW; varying vec3 vN;
      void main(){ vCol = cdata.rgb; vT = clamp((cdata.a - position.y) / max(cdata.a, 0.1), 0.0, 1.0); vW = position; vN = normal;
        gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uStrength, uHaze, uTime; uniform vec3 uCam;
      varying vec3 vCol; varying float vT; varying vec3 vW; varying vec3 vN;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec3 V = normalize(uCam - vW);
        float edge = abs(dot(normalize(vN), V));
        float a = pow(edge, 1.5) * (1.0 - vT) * (1.0 - vT * 0.3);
        float dist = length(uCam - vW);
        a *= smoothstep(1.5, 5.0, dist) * (1.0 - smoothstep(60.0, 110.0, dist));
        // falling sparkle of rain caught in the beam
        vec2 sp = vec2(atan(vW.z - uCam.z, vW.x - uCam.x) * 40.0, vW.y * 6.0 + uTime * 30.0);
        float sparkle = step(0.93, h(floor(sp))) * 0.8;
        gl_FragColor = vec4(vCol * a * (0.05 + uHaze * 0.12 + sparkle * 0.06) * uStrength, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 5;
  return mesh;
}
