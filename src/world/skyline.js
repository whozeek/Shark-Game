// Distant scenery: towers and hills rendered with a cheap custom shader that fades into the
// atmospheric haze (independent of the near fog) so far silhouettes stay readable.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { makeSkylineTex } from '../render/textures.js';
import { U, GLSL_COMMON } from '../render/shared.js';
import { LAYER_NO_REFLECT } from './cityBase.js';

export const SkyU = {
  uHazeCol: { value: new THREE.Color(0x30364a) },
  uHaze: { value: 0.6 },
  uAmb: { value: new THREE.Color(0x202530) },
  uGlow: { value: 1 },
};

let skyMat = null, hillMat = null, skyTex = null;

function getSkyMat(cb) {
  if (!skyTex) skyTex = makeSkylineTex(5, { lit: 0.38 });
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, ...SkyU, uWin: { value: skyTex.emissive } },
    vertexColors: true,
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW;
      void main(){ vUv = uv; vCol = color; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform sampler2D uWin; uniform vec3 uHazeCol, uAmb; uniform float uHaze, uGlow;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW;
      void main(){
        vec3 win = texture2D(uWin, vUv).rgb;
        vec3 c = vCol * uAmb * 1.5 + win * uGlow * 1.6;
        c += raRainbowCol(vW) * uRainbow * 0.15;
        float h = clamp(1.0 - vW.y / 160.0, 0.0, 1.0);
        float hz = clamp(uHaze + h * h * 0.25, 0.0, 0.98);
        c = mix(c, uHazeCol, hz);
        c += uFlash * uHazeCol * 1.5;
        gl_FragColor = vec4(c, 1.0);
      }`,
    fog: false,
  });
  cb.track(mat);
  return mat;
}

function worldUVs(g, sx, sy, sz) {
  const uv = g.attributes.uv;
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v; const [w, h] = dims[f];
    uv.setXY(i, uv.getX(i) * w / 26, uv.getY(i) * h / 52);
  }
}

/** Ring of distant towers. */
export function addSkyline(cb, o) {
  const rng = new RNG(o.seed || 1);
  const geos = [];
  const add = (x, z, w, d, h, color) => {
    const g = new THREE.BoxGeometry(w, h, d);
    worldUVs(g, w, h, d);
    g.translate(x, h / 2 - 2, z);
    const c = new THREE.Color(color);
    const col = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < col.length; i += 3) { col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geos.push(g.toNonIndexed());
  };
  const base = new THREE.Color(o.color || '#2a2d36');
  for (let i = 0; i < o.count; i++) {
    const a = o.arcFrom + (o.arcTo - o.arcFrom) * rng.f();
    const r = o.minR + (o.maxR - o.minR) * Math.pow(rng.f(), 0.7);
    const x = o.center[0] + Math.cos(a) * r, z = o.center[1] + Math.sin(a) * r;
    const h = o.hMin + (o.hMax - o.hMin) * Math.pow(rng.f(), 1.8);
    const w = rng.range(18, 45), d = rng.range(18, 45);
    const c = base.clone().offsetHSL(0, 0, rng.range(-0.04, 0.05));
    add(x, z, w, d, h, c);
    if (h > (o.hMin + o.hMax) * 0.5 && rng.chance(0.5)) add(x, z, w * 0.6, d * 0.6, h * 1.18, c); // setback
    if (h > o.hMax * 0.75 && rng.chance(0.6)) add(x, z, 2, 2, h * 1.18 + 25, c); // antenna
  }
  if (o.spire) {
    const { x, z, h } = o.spire;
    const c = base.clone().offsetHSL(0, 0, 0.04);
    add(x, z, 52, 52, h * 0.55, c);
    add(x, z, 40, 40, h * 0.7, c);
    add(x, z, 28, 28, h * 0.82, c);
    add(x, z, 16, 16, h * 0.9, c);
    add(x, z, 4, 4, h, c);
  }
  if (o.extra) for (const e of o.extra) add(e.x, e.z, e.w, e.d, e.h, e.color ? new THREE.Color(e.color) : base);
  const mesh = finish(cb, geos, getSkyMat(cb));
  // aviation lights on the tallest
  if (o.beacons !== false) {
    const bm = cb.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.3, 0.2), fog: false }));
    const bg = cb.track(new THREE.SphereGeometry(1.4, 6, 4));
    const tall = geos.filter((g) => { g.computeBoundingBox(); return g.boundingBox.max.y > o.hMax * 0.8; }).slice(0, 14);
    for (const g of tall) {
      const b = g.boundingBox;
      const m = new THREE.Mesh(bg, bm);
      m.position.set((b.min.x + b.max.x) / 2, b.max.y + 1.5, (b.min.z + b.max.z) / 2);
      m.layers.set(LAYER_NO_REFLECT);
      cb.group.add(m);
      cb.animated.push({ update: (dt, t) => { m.visible = Math.sin(t * 2.2 + m.position.x) > -0.2; } });
    }
  }
  return mesh;
}

function finish(cb, geos, mat) {
  if (!geos.length) return null;
  const merged = mergeAll(geos);
  cb.track(merged);
  const mesh = new THREE.Mesh(merged, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  cb.group.add(mesh);
  return mesh;
}

function mergeAll(geos) {
  let total = 0; for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), uv = new Float32Array(total * 2), col = new Float32Array(total * 3);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
    g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  m.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return m;
}

/** Distant hills or mountains as a ring of noisy ridges. */
export function addHills(cb, o) {
  const rng = new RNG(o.seed || 3);
  if (!hillMat) hillMat = null;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, ...SkyU, uCol: { value: new THREE.Color(o.color || '#2a3530') }, uTop: { value: new THREE.Color(o.top || o.color || '#3a4540') } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform vec3 uHazeCol, uAmb, uCol, uTop; uniform float uHaze; varying vec3 vW;
      void main(){
        float t = clamp(vW.y / ${(o.h || 200).toFixed(1)}, 0.0, 1.0);
        vec3 c = mix(uCol, uTop, t) * (uAmb * 2.2 + 0.05);
        float lights = step(0.985, raHash12(floor(vW.xz * 0.25))) * step(t, 0.35) * ${o.lights ? '1.0' : '0.0'};
        c += lights * vec3(1.0, 0.75, 0.45) * uNight * 2.0;
        float hz = clamp(uHaze * 0.9 + (1.0 - t) * 0.15, 0.0, 0.97);
        c = mix(c, uHazeCol, hz);
        c += uFlash * uHazeCol;
        gl_FragColor = vec4(c, 1.0);
      }`,
    fog: false,
  });
  cb.track(mat);
  const seg = 160;
  const pos = [];
  const r = o.r || 900;
  const prof = [];
  for (let i = 0; i <= seg; i++) {
    const a = o.arcFrom + (o.arcTo - o.arcFrom) * i / seg;
    let h = 0, amp = o.h || 200, f = 1;
    for (let k = 0; k < 4; k++) { h += Math.sin(a * (3 + k * 4.3) * f + rng.f() * 0) * amp * 0.25 + amp * 0.25; amp *= 0.5; f *= 1.9; }
    h = h * (0.6 + 0.4 * Math.sin(a * 2.3 + (o.seed || 0))) + (o.base || 0);
    prof.push([Math.cos(a) * r + o.center[0], Math.max(10, h), Math.sin(a) * r + o.center[1]]);
  }
  for (let i = 0; i < seg; i++) {
    const [x0, h0, z0] = prof[i], [x1, h1, z1] = prof[i + 1];
    pos.push(x0, -5, z0, x1, -5, z1, x1, h1, z1, x0, -5, z0, x1, h1, z1, x0, h0, z0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  cb.track(g);
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mat.side = THREE.DoubleSide;
  mesh.renderOrder = -2;
  cb.group.add(mesh);
  return mesh;
}
