// Pedestrians: articulated, instanced people (and the odd dog) walking the sidewalk graph.
// Each body part is one InstancedMesh, so a full rush-hour crowd costs only ~20 draw calls.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { patchWash } from '../render/shared.js';

const SKIN = ['#f1d3bd', '#e5b896', '#c98e68', '#a86f4c', '#8a5537', '#5e3a26', '#f3cfb0', '#d9a37f'];
const HAIR = ['#141110', '#2a1d16', '#3e2a1e', '#5a3c26', '#8a5a34', '#b88a52', '#d9c08a', '#8d8a86', '#c4c0bb', '#6b2b1e'];
const COATS = ['#1f2a3a', '#2b2b2e', '#a8835a', '#4a4f36', '#5c1f2a', '#3a3f45', '#8a6a2a', '#22352b', '#6a6e74', '#7a3b2e', '#384a63', '#c9b79a', '#1a1a1c', '#5a4a6a', '#9a3a3a', '#d8d2c4'];
const PANTS = ['#1c2433', '#121214', '#3a3a3e', '#2c3a52', '#5a4e3c', '#2a2420', '#40362a', '#4a4a50'];
const UMB = ['#141416', '#141416', '#141416', '#1c2a44', '#7a1820', '#2a3a2a', '#d8d0bf', '#e0b020', '#3a2a4a', '#1a3a4a', '#b8405a', '#2f6aa8'];
const WAGASA = ['#b8302a', '#2b3a6a', '#c88a3a', '#1c1c1c', '#8a2a4a', '#3a5a3a'];

function capsule(r, len, seg = 6) {
  const g = new THREE.CapsuleGeometry(r, len, 3, seg);
  g.translate(0, -(len / 2 + r), 0);
  return g;
}

function buildPartGeos() {
  const torso = new THREE.CapsuleGeometry(0.155, 0.27, 3, 8);
  torso.translate(0, 0.29, 0); torso.scale(1.15, 1, 0.72);
  const coat = new THREE.CylinderGeometry(0.19, 0.25, 0.42, 8, 1, true); coat.translate(0, -0.15, 0);
  coat.scale(1, 1, 0.75);
  const head = new THREE.SphereGeometry(0.105, 10, 8); head.scale(0.92, 1.1, 1);
  const neck = new THREE.CylinderGeometry(0.045, 0.05, 0.08, 6);
  const hairShort = new THREE.SphereGeometry(0.115, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55); hairShort.scale(0.95, 1.05, 1.05); hairShort.translate(0, 0.015, -0.01);
  const hairLong = new THREE.SphereGeometry(0.118, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62); hairLong.scale(0.98, 1.05, 1.06);
  const back = new THREE.BoxGeometry(0.2, 0.24, 0.07); back.translate(0, -0.1, -0.075);
  const hairL = mergeSimple([hairLong, back]);
  const bun = mergeSimple([hairShort.clone(), new THREE.SphereGeometry(0.055, 8, 6).translate(0, 0.08, -0.09)]);
  const beanie = new THREE.SphereGeometry(0.122, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5); beanie.scale(1, 1.15, 1);
  const cap = mergeSimple([beanie.clone(), new THREE.BoxGeometry(0.16, 0.015, 0.1).translate(0, 0.0, 0.12)]);
  const upperArm = capsule(0.048, 0.22);
  const foreArm = mergeSimple([capsule(0.042, 0.2), new THREE.SphereGeometry(0.045, 6, 5).translate(0, -0.3, 0.01)]);
  const thigh = capsule(0.072, 0.3);
  const shin = mergeSimple([capsule(0.058, 0.32), new THREE.BoxGeometry(0.09, 0.07, 0.24).translate(0, -0.43, 0.05)]);
  const canopy = new THREE.ConeGeometry(0.58, 0.26, 8, 1, true); canopy.translate(0, 0.13, 0);
  const canopyTop = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 4); canopyTop.translate(0, 0.32, 0);
  const umbrella = mergeSimple([canopy, canopyTop]);
  const shaft = new THREE.CylinderGeometry(0.009, 0.009, 0.78, 4); shaft.translate(0, 0.39, 0);
  const folded = new THREE.CylinderGeometry(0.025, 0.012, 0.75, 6); folded.translate(0, -0.37, 0);
  const bag = new THREE.BoxGeometry(0.08, 0.26, 0.3); bag.translate(0, -0.15, 0);
  // dog
  const dogBody = new THREE.CapsuleGeometry(0.11, 0.32, 3, 8); dogBody.rotateZ(Math.PI / 2);
  const dogHead = mergeSimple([new THREE.SphereGeometry(0.09, 8, 6), new THREE.BoxGeometry(0.06, 0.06, 0.1).translate(0.09, -0.02, 0)]);
  const dogLeg = new THREE.CylinderGeometry(0.025, 0.022, 0.22, 5); dogLeg.translate(0, -0.11, 0);
  const dogTail = new THREE.CylinderGeometry(0.015, 0.008, 0.18, 4); dogTail.translate(0, 0.09, 0);
  const band = new THREE.TorusGeometry(0.122, 0.014, 5, 14, Math.PI); band.rotateY(Math.PI / 2); band.translate(0, 0.02, 0);
  const cupL = new THREE.CylinderGeometry(0.045, 0.045, 0.035, 10).rotateZ(Math.PI / 2).translate(0.118, 0.0, 0);
  const cupR = new THREE.CylinderGeometry(0.045, 0.045, 0.035, 10).rotateZ(Math.PI / 2).translate(-0.118, 0.0, 0);
  const phones = mergeSimple([band, cupL, cupR]);
  return { torso, coat, head, neck, hairShort, hairL, bun, cap, upperArm, foreArm, thigh, shin, umbrella, shaft, folded, bag, dogBody, dogHead, dogLeg, dogTail, phones };
}

function mergeSimple(geos) {
  const parts = geos.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; });
  let total = 0; for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3), nrm = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  for (const p of parts) { pos.set(p.attributes.position.array, o * 3); nrm.set(p.attributes.normal.array, o * 3); if (p.attributes.uv) uv.set(p.attributes.uv.array, o * 2); o += p.attributes.position.count; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

const _m = new THREE.Matrix4(), _root = new THREE.Matrix4(), _tmp = new THREE.Matrix4(), _tmp2 = new THREE.Matrix4();
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function local(x, y, z, rx = 0, ry = 0, rz = 0, s = 1, out = _tmp) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return out.compose(_v.set(x, y, z), _q, _s.set(s, s, s));
}

export class Crowd {
  constructor(scene, max, opts = {}) {
    this.scene = scene;
    this.max = max;
    this.agents = [];
    this.active = 0;
    this.graph = null;
    this.group = new THREE.Group();
    scene.add(this.group);
    const geos = buildPartGeos();
    this.geos = geos;
    const mat = patchWash(new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.0 }), 0.03);
    const umbMat = patchWash(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide }), 0.12);
    this.mat = mat; this.umbMat = umbMat;
    const mk = (name, g, count, m = mat) => {
      const im = new THREE.InstancedMesh(g, m, count);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.frustumCulled = false;
      im.name = 'ped-' + name;
      im.setColorAt(0, new THREE.Color(1, 1, 1));
      for (let i = 0; i < count; i++) im.setMatrixAt(i, ZERO);
      this.group.add(im);
      return im;
    };
    const N = max;
    this.M = {
      torso: mk('torso', geos.torso, N), coat: mk('coat', geos.coat, N), head: mk('head', geos.head, N), neck: mk('neck', geos.neck, N),
      hair0: mk('hair0', geos.hairShort, N), hair1: mk('hair1', geos.hairL, N), hair2: mk('hair2', geos.bun, N), hair3: mk('hair3', geos.cap, N),
      uArm: mk('uarm', geos.upperArm, N * 2), fArm: mk('farm', geos.foreArm, N * 2), thigh: mk('thigh', geos.thigh, N * 2), shin: mk('shin', geos.shin, N * 2),
      umb: mk('umb', geos.umbrella, N, umbMat), shaft: mk('shaft', geos.shaft, N), folded: mk('folded', geos.folded, N), bag: mk('bag', geos.bag, N),
      dogBody: mk('dogb', geos.dogBody, N * 2), dogHead: mk('dogh', geos.dogHead, N * 2), dogLeg: mk('dogl', geos.dogLeg, N * 8), dogTail: mk('dogt', geos.dogTail, N * 2),
      phones: mk('phones', geos.phones, N),
    };
    // leashes
    this.leashGeo = new THREE.BufferGeometry();
    this.leashGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 12), 3));
    this.leash = new THREE.LineSegments(this.leashGeo, new THREE.LineBasicMaterial({ color: 0x222222 }));
    this.leash.frustumCulled = false;
    this.group.add(this.leash);
    this.rng = new RNG(99);
    this.style = opts.style || 'city';
    for (let i = 0; i < N; i++) this.agents.push(this.makeAgent(i));
  }

  makeAgent(i) {
    const r = this.rng;
    const female = r.chance(0.5);
    const a = {
      i, alive: false, edge: null, from: 0, to: 0, s: 0, lat: 0, latPref: 0, latT: 0,
      speed: 1.3, base: r.range(1.05, 1.5), phase: r.f() * 6.28, mode: 'walk', timer: 0,
      h: female ? r.range(0.9, 1.0) : r.range(0.96, 1.08), w: r.range(0.92, 1.15),
      hair: female ? r.weighted([[1, 4], [2, 2], [0, 1], [3, 1]]) : r.weighted([[0, 6], [3, 2], [1, 0.5]]),
      coatLong: r.chance(female ? 0.45 : 0.3), bag: r.chance(0.3), umbrellaOwner: r.f(), dog: false,
      leader: null, followers: [], gOff: 0, x: 0, z: 0, y: 0.15, yaw: 0, look: 0, idlePose: r.f(),
      prevX: 0, prevZ: 0, vis: true, armSwing: r.range(0.25, 0.45), lean: 0, hurry: 0, umbTilt: r.range(-0.15, 0.15),
    };
    this.paint(a);
    return a;
  }
  paint(a) {
    const r = this.rng;
    const M = this.M; const c = new THREE.Color();
    const kyoto = this.style === 'kyoto', miami = this.style === 'miami';
    const coat = c.set(miami && r.chance(0.5) ? r.pick(['#e8c8a8', '#a8d8e8', '#f0a8b8', '#f4f1ea', '#88c0a0']) : r.pick(COATS)).offsetHSL(0, r.range(-0.05, 0.05), r.range(-0.05, 0.05)).clone();
    M.torso.setColorAt(a.i, coat); M.coat.setColorAt(a.i, coat);
    for (let k = 0; k < 2; k++) M.uArm.setColorAt(a.i * 2 + k, coat);
    const skin = c.set(r.pick(SKIN)).clone();
    M.head.setColorAt(a.i, skin); M.neck.setColorAt(a.i, skin);
    for (let k = 0; k < 2; k++) M.fArm.setColorAt(a.i * 2 + k, a.coatLong || r.chance(0.7) ? coat : skin);
    const pants = c.set(r.pick(PANTS)).clone();
    for (let k = 0; k < 2; k++) { M.thigh.setColorAt(a.i * 2 + k, pants); M.shin.setColorAt(a.i * 2 + k, pants); }
    const hair = c.set(a.hair === 3 ? r.pick(['#1f2a3a', '#7a1f24', '#2b2b2b', '#c9b79a', '#3a5a3a', '#d8a020']) : r.pick(HAIR)).clone();
    for (let k = 0; k < 4; k++) M['hair' + k].setColorAt(a.i, hair);
    const umb = c.set(kyoto && r.chance(0.6) ? r.pick(WAGASA) : r.pick(UMB)).clone();
    M.umb.setColorAt(a.i, umb); M.folded.setColorAt(a.i, umb);
    M.shaft.setColorAt(a.i, new THREE.Color(0x222222));
    M.bag.setColorAt(a.i, c.set(r.pick(['#3a2a1e', '#1a1a1a', '#6a4a2a', '#8a2a2a', '#2a3a4a'])).clone());
    const dog = c.set(r.pick(['#d8b880', '#3a2a1e', '#f0ead8', '#1a1a1a', '#a8683a', '#8a8a8a'])).clone();
    const dog2 = c.set(r.pick(['#f0ead8', '#3a2a1e', '#d8b880', '#6a6a6a'])).clone();
    for (const [slot, col] of [[a.i, dog], [a.i + this.max, dog2]]) {
      M.dogBody.setColorAt(slot, col); M.dogHead.setColorAt(slot, col); M.dogTail.setColorAt(slot, col);
      for (let k = 0; k < 4; k++) M.dogLeg.setColorAt(slot * 4 + k, col);
    }
    M.phones.setColorAt(a.i, c.set(r.pick(['#1a1a1a', '#e8e8e8', '#2a4a8a', '#c83a5a', '#d8c8a8'])).clone());
    a.phones = r.chance(0.22);
  }

  setGraph(graph, signals, style) {
    this.graph = graph; this.signals = signals;
    if (style && style !== this.style) { this.style = style; for (const a of this.agents) this.paint(a); this.flagColors(); }
    for (const a of this.agents) { a.alive = false; a.leader = null; a.followers = []; }
    this.active = 0;
    this.exits = graph.nodes.filter((n) => n.exit && n.edges.length);
    this.walkEdges = graph.edges.filter((e) => !e.dead && e.kind === 'walk');
  }
  flagColors() { for (const k in this.M) if (this.M[k].instanceColor) this.M[k].instanceColor.needsUpdate = true; }

  /** Set desired population (0..max). Groups and dogs follow city-life settings. */
  setPopulation(n, s) {
    n = Math.max(0, Math.min(this.max, Math.round(n)));
    this.settings = s;
    if (!this.graph || !this.walkEdges.length) return;
    const r = this.rng;
    // spawn
    let alive = this.agents.filter((a) => a.alive).length;
    for (const a of this.agents) {
      if (alive >= n) break;
      if (a.alive) continue;
      this.spawn(a);
      alive++;
      // groups
      if (r.f() < s.groups * 0.5 && alive < n - 1) {
        const size = r.chance(0.7) ? 1 : 2;
        for (let k = 0; k < size && alive < n; k++) {
          const f = this.agents.find((b) => !b.alive && b !== a);
          if (!f) break;
          f.alive = true; f.leader = a; f.gOff = k === 0 ? -0.6 : 0.6; f.dog = false; f.mode = a.mode;
          a.followers.push(f);
          alive++;
        }
      } else if (s.dogs && a.mode === 'walk' && r.chance(0.09)) { a.dog = true; a.dogs = r.chance(0.3) ? 2 : 1; }
    }
    // despawn extras (followers go with leaders)
    if (alive > n) {
      for (let i = this.agents.length - 1; i >= 0 && alive > n; i--) {
        const a = this.agents[i];
        if (!a.alive || a.leader) continue;
        alive -= 1 + a.followers.length;
        this.kill(a);
      }
    }
    if (!s.dogs) for (const a of this.agents) a.dog = false;
    this.active = alive;
  }
  kill(a) {
    a.alive = false;
    for (const f of a.followers) { f.alive = false; f.leader = null; this.hide(f); }
    a.followers = [];
    this.hide(a);
  }
  hide(a) {
    const M = this.M;
    for (const k of ['torso', 'coat', 'head', 'neck', 'hair0', 'hair1', 'hair2', 'hair3', 'umb', 'shaft', 'folded', 'bag', 'dogBody', 'dogHead', 'dogTail', 'phones']) M[k].setMatrixAt(a.i, ZERO);
    for (const k of ['dogBody', 'dogHead', 'dogTail']) M[k].setMatrixAt(a.i + this.max, ZERO);
    for (let k = 0; k < 4; k++) M.dogLeg.setMatrixAt((a.i + this.max) * 4 + k, ZERO);
    for (let k = 0; k < 2; k++) for (const p of ['uArm', 'fArm', 'thigh', 'shin']) M[p].setMatrixAt(a.i * 2 + k, ZERO);
    for (let k = 0; k < 4; k++) M.dogLeg.setMatrixAt(a.i * 4 + k, ZERO);
    const arr = this.leashGeo.attributes.position.array; arr.fill(0, a.i * 6, a.i * 6 + 6); arr.fill(0, (a.i + this.max) * 6, (a.i + this.max) * 6 + 6);
  }
  spawn(a, atExit = false, avoid = null) {
    const r = this.rng; const G = this.graph;
    let e;
    if (atExit && this.exits.length) {
      for (let tries = 0; tries < 6; tries++) {
        const n = r.pick(this.exits);
        if (avoid && Math.hypot(n.x - avoid.x, n.z - avoid.z) < 30) continue;
        const eid = n.edges.find((id) => !G.edges[id].dead);
        if (eid === undefined) continue;
        e = G.edges[eid];
        a.from = n.id; a.to = G.other(e, n.id); a.s = 0.2;
        break;
      }
    }
    if (!e) {
      e = r.pick(this.walkEdges);
      if (r.chance(0.5)) { a.from = e.a; a.to = e.b; } else { a.from = e.b; a.to = e.a; }
      a.s = r.f() * e.len;
    }
    a.edge = e; a.alive = true; a.leader = null; a.followers = [];
    a.mode = 'walk'; a.timer = 0;
    a.base = r.range(1.05, 1.5);
    a.latPref = r.range(0.15, 0.95);
    a.lat = this.latFor(a, a.latPref);
    a.dog = false;
    // some people simply stand around (waiting, chatting, sheltering)
    if (!atExit && r.chance(0.12) && e.kind === 'walk' && e.browse) { a.mode = 'stand'; a.timer = r.range(20, 90); a.latPref = 1.0; }
  }
  /** Map a 0..1 preference (0 = left edge of band, 1 = right/building edge) to a lateral offset. */
  band(a) {
    const e = a.edge;
    if (e.kind === 'cross') return [-1.0, 1.0];
    if (!e.browse) return [-(e.width / 2 - 0.5), e.width / 2 - 0.5];
    // world normal from centreline toward buildings is browse; lateral axis is "right" of travel
    const A = this.graph.nodes[a.from], B = this.graph.nodes[a.to];
    const dx = (B.x - A.x) / e.len, dz = (B.z - A.z) / e.len;
    const rx = -dz, rz = dx; // right vector
    const towardBld = rx * e.browse.nx + rz * e.browse.nz; // +1 if right side is building side
    const bldClear = this.bldClear ?? 1.6, curbClear = 1.45;
    const hw = e.width / 2;
    const lo = -(hw - curbClear), hi = hw - bldClear; // offsets along building normal (negative = toward curb)
    return towardBld > 0 ? [lo, hi] : [-hi, -lo];
  }
  latFor(a, pref) { const [lo, hi] = this.band(a); return lo + (hi - lo) * Math.max(0, Math.min(1, pref)); }

  nextEdge(a) {
    const G = this.graph; const r = this.rng;
    const node = G.nodes[a.to];
    if (node.exit && r.chance(0.85)) return 'exit';
    const options = node.edges.map((id) => G.edges[id]).filter((e) => !e.dead && e !== a.edge);
    if (!options.length) return a.edge;
    // prefer continuing straight-ish and sidewalks over crossings
    const weights = options.map((e) => {
      const o = G.nodes[G.other(e, node.id)];
      const A = G.nodes[a.from];
      const d1x = node.x - A.x, d1z = node.z - A.z, d2x = o.x - node.x, d2z = o.z - node.z;
      const straight = (d1x * d2x + d1z * d2z) / (Math.hypot(d1x, d1z) * Math.hypot(d2x, d2z) + 1e-6);
      return [e, (e.kind === 'cross' ? 0.6 : 1.0) * (1.2 + straight)];
    });
    return r.weighted(weights);
  }

  update(dt, t, ctx) {
    if (!this.graph) return;
    const s = this.settings || {};
    const G = this.graph;
    const camX = ctx.cam.x, camZ = ctx.cam.z;
    const rainy = ctx.rain > 0.07;
    const speedMul = s.pedSpeed ?? 1;
    const frame = (this.frame = (this.frame || 0) + 1);
    // simple spatial hash for avoidance
    const hash = new Map();
    for (const a of this.agents) {
      if (!a.alive) continue;
      const k = (Math.floor(a.x / 3) * 7919) ^ Math.floor(a.z / 3);
      let arr = hash.get(k); if (!arr) hash.set(k, arr = []); arr.push(a);
    }
    const near = (x, z) => {
      const out = [];
      const gx = Math.floor(x / 3), gz = Math.floor(z / 3);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const arr = hash.get(((gx + i) * 7919) ^ (gz + j)); if (arr) out.push(...arr); }
      return out;
    };
    for (const a of this.agents) {
      if (!a.alive) continue;
      if (a.leader) continue; // followers updated with leader
      if (ctx.frozen) { this.pose(a, 0, t, ctx, rainy); for (const f of a.followers) this.pose(f, 0, t, ctx, rainy); continue; }
      const e = a.edge;
      const A = G.nodes[a.from], B = G.nodes[a.to];
      const dx = (B.x - A.x) / e.len, dz = (B.z - A.z) / e.len;
      let want = a.base * speedMul * (rainy && !this.hasUmb(a, s) ? 1.18 : 1);
      if (a.followers.length) want = Math.min(want, 1.25 * speedMul);
      if (a.mode === 'walk') {
        // avoidance: slow for someone ahead in our lane; drift laterally for oncoming walkers and the player
        let latPush = 0;
        for (const b of near(a.x, a.z)) {
          if (b === a || b.leader === a || a.leader === b) continue;
          const ox = b.x - a.x, oz = b.z - a.z;
          const ahead = ox * dx + oz * dz;
          if (ahead <= 0 || ahead > 2.4) continue;
          const side = ox * -dz + oz * dx;
          if (Math.abs(side) > 0.75) continue;
          const sameDir = (b.edge === e && b.from === a.from) ? 1 : 0;
          if (sameDir && b.mode === 'walk') want = Math.min(want, b.speed * 0.95 + (ahead > 1.2 ? 0.2 : -0.2));
          else if (b.mode !== 'walk' && ahead < 1.6) latPush += side > 0 ? -0.8 : 0.8;
          else latPush += side > 0 ? -0.6 : 0.6;
        }
        const px = ctx.player.x - a.x, pz = ctx.player.z - a.z;
        const pAhead = px * dx + pz * dz, pSide = px * -dz + pz * dx;
        if (pAhead > -0.3 && pAhead < 2.6 && Math.abs(pSide) < 1.0) {
          latPush += pSide > 0 ? -1.2 : 1.2;
          if (pAhead < 1.0 && Math.abs(pSide) < 0.5) want *= 0.2;
        }
        const [lo, hi] = this.band(a);
        // steer around solid things on the pavement (carts, posts, tree pits, tables)
        if (this.col && e.kind === 'walk' && (frame + a.i) % 4 === 0) {
          const look = Math.min(e.len, a.s + 1.6);
          const bx = A.x + dx * look, bz = A.z + dz * look;
          const probe = (lat) => this.col.blocked(bx - dz * lat, bz + dx * lat, 0.32);
          if (probe(a.lat)) {
            let best = null;
            for (const d of [0.5, -0.5, 1.0, -1.0, 1.5, -1.5, 2.0, -2.0]) { const l = a.lat + d; if (l >= lo - 0.6 && l <= hi + 0.6 && !probe(l)) { best = l; break; } }
            a.avoid = best ?? a.lat; a.avoidT = 1.6;
          }
        }
        if (a.avoidT > 0) { a.avoidT -= dt; latPush += a.avoid - this.latFor(a, a.latPref); }
        const target = Math.max(lo - 0.6, Math.min(hi + 0.6, this.latFor(a, a.latPref) + latPush));
        a.lat += (target - a.lat) * Math.min(1, dt * 1.6);
        a.speed += (want - a.speed) * Math.min(1, dt * 2);
        a.s += a.speed * dt;
        // browse shop windows
        if (e.browse && a.s > 2 && a.s < e.len - 3 && !a.followers.length && this.rng.f() < dt * 0.025) { a.mode = 'browse'; a.timer = this.rng.range(3, 9); }
        if (a.s >= e.len) {
          const nxt = this.nextEdge(a);
          if (nxt === 'exit') {
            // leave the neighbourhood and re-enter elsewhere, out of sight if possible
            const far = Math.hypot(B.x - camX, B.z - camZ) > 25;
            if (far) { const fl = a.followers; this.spawn(a, true, ctx.cam); for (const f of fl) { f.leader = a; a.followers.push(f); } }
            else { const tmp = a.from; a.from = a.to; a.to = tmp; a.s = 0; }
          } else {
            const over = a.s - e.len;
            const nf = a.to, nt = G.other(nxt, a.to);
            if (nxt.kind === 'cross' && !this.signals.canWalk(nxt.axis, nxt.len / Math.max(0.8, a.speed) + 1.5)) {
              a.mode = 'wait'; a.s = e.len; a.pending = nxt;
            } else {
              a.edge = nxt; a.from = nf; a.to = nt; a.s = Math.min(over, 0.5);
            }
          }
        }
      } else if (a.mode === 'wait') {
        a.speed = 0;
        const nxt = a.pending;
        if (nxt && this.signals.canWalk(nxt.axis, nxt.len / 1.1 + 1)) {
          a.edge = nxt; a.from = a.to; a.to = G.other(nxt, a.from); a.s = 0; a.mode = 'walk'; a.pending = null;
        }
      } else if (a.mode === 'browse' || a.mode === 'stand') {
        a.speed = Math.max(0, a.speed - dt * 3);
        a.s += a.speed * dt;
        const [lo, hi] = this.band(a);
        const bSide = this.towardBld(a) > 0 ? hi : lo;
        a.lat += (bSide - a.lat) * Math.min(1, dt * 1.2);
        a.timer -= dt;
        if (a.timer <= 0) a.mode = 'walk';
        if (a.s >= a.edge.len) a.s = a.edge.len - 0.01;
      }
      this.pose(a, dt, t, ctx, rainy, frame);
      for (let k = 0; k < a.followers.length; k++) {
        const f = a.followers[k];
        f.edge = a.edge; f.from = a.from; f.to = a.to; f.mode = a.mode === 'browse' ? 'browse' : a.mode;
        f.s = Math.max(0, a.s - 0.15 * (k + 1));
        const [lo, hi] = this.band(f);
        f.lat = Math.max(lo, Math.min(hi, a.lat + f.gOff));
        f.speed = a.speed;
        this.pose(f, dt, t, ctx, rainy, frame, a);
      }
    }
    for (const k in this.M) this.M[k].instanceMatrix.needsUpdate = true;
    this.leashGeo.attributes.position.needsUpdate = true;
  }
  towardBld(a) {
    const e = a.edge; if (!e.browse) return 0;
    const A = this.graph.nodes[a.from], B = this.graph.nodes[a.to];
    const dx = (B.x - A.x) / e.len, dz = (B.z - A.z) / e.len;
    return -dz * e.browse.nx + dx * e.browse.nz;
  }
  hasUmb(a, s) { return a.umbrellaOwner < (s.umbrellaPct ?? 0.8); }

  pose(a, dt, t, ctx, rainy, frame = 0, leader = null) {
    const G = this.graph; const e = a.edge;
    const A = G.nodes[a.from], B = G.nodes[a.to];
    const dx = (B.x - A.x) / e.len, dz = (B.z - A.z) / e.len;
    const x = A.x + dx * a.s - dz * a.lat, z = A.z + dz * a.s + dx * a.lat;
    let y = e.kind === 'cross' ? ((a.s < 1.1 || a.s > e.len - 1.1) ? 0.15 : 0.0) : (e.y ?? 0.15);
    a.y += (y - a.y) * Math.min(1, dt * 12 || 1);
    a.prevX = a.x; a.prevZ = a.z; a.x = x; a.z = z;
    let yaw = Math.atan2(dx, dz);
    if (a.mode === 'browse' || (a.mode === 'stand' && e.browse)) {
      const tb = this.towardBld(a);
      const bx = e.browse.nx, bz = e.browse.nz;
      yaw = a.mode === 'browse' ? Math.atan2(bx, bz) : Math.atan2(-bx, -bz) + Math.sin(t * 0.2 + a.i) * 0.6;
      void tb;
    } else if (a.mode === 'wait') yaw += Math.sin(t * 0.3 + a.i) * 0.3;
    // smooth yaw
    let dy = yaw - a.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    a.yaw += dy * Math.min(1, (dt || 0.016) * 5);
    const dist = Math.hypot(x - ctx.cam.x, z - ctx.cam.z);
    const visible = dist < (ctx.viewDist || 110) && !ctx.hidePeople;
    if (!visible) { if (a.vis) { this.hide(a); a.vis = false; } return; }
    // throttle distant updates
    if (dist > 55 && frame % 3 !== a.i % 3 && a.vis) return;
    a.vis = true;
    const s = this.settings || {};
    const umbOpen = rainy && this.hasUmb(a, s);
    const carry = !rainy && this.hasUmb(a, s) && a.umbrellaOwner < 0.4;
    const walking = a.speed > 0.15;
    if (walking) a.phase += (dt || 0) * a.speed / 0.72 * Math.PI;
    const ph = a.phase;
    const amp = Math.min(1, a.speed / 1.2);
    const h = a.h;
    // root
    const bob = walking ? Math.abs(Math.cos(ph)) * 0.035 * amp : Math.sin(t * 1.5 + a.i) * 0.004;
    const hunch = rainy && !umbOpen ? 0.18 : 0.04;
    local(x, a.y + bob * h, z, 0, a.yaw, 0, h, _root);
    const M = this.M; const i = a.i;
    const put = (mesh, idx, mat) => { _m.multiplyMatrices(_root, mat); mesh.setMatrixAt(idx, _m); };
    const sway = walking ? Math.sin(ph) * 0.05 * amp : 0;
    // torso (from hip 0.92)
    const torsoM = local(0, 0.92, 0, hunch, sway, 0, 1, _tmp2);
    _tmp.copy(torsoM); _tmp.scale(_v.set(a.w, 1, a.w));
    put(M.torso, i, _tmp);
    if (a.coatLong) put(M.coat, i, local(0, 0.95, 0, hunch * 0.3, sway, 0, 1, _tmp)); else M.coat.setMatrixAt(i, ZERO);
    // head & neck via torso
    const nod = a.phones && ctx.beat !== undefined ? Math.max(0, Math.sin(ctx.beat * Math.PI * 2 + a.i)) * 0.09 : 0;
    const headM = new THREE.Matrix4().multiplyMatrices(torsoM, local(0, 0.66, 0.02, -hunch * 0.7 + nod + (a.mode === 'browse' ? 0.15 : 0), a.mode === 'stand' ? Math.sin(t * 0.4 + a.i) * 0.5 : 0, 0, 1, _tmp));
    put(M.neck, i, new THREE.Matrix4().multiplyMatrices(torsoM, local(0, 0.6, 0.01, 0, 0, 0, 1, _tmp)));
    put(M.head, i, headM);
    for (let k = 0; k < 4; k++) { if (k === a.hair) put(M['hair' + k], i, headM); else M['hair' + k].setMatrixAt(i, ZERO); }
    if (a.phones) put(M.phones, i, headM); else M.phones.setMatrixAt(i, ZERO);
    // legs
    for (let k = 0; k < 2; k++) {
      const sgn = k === 0 ? 1 : -1;
      const p = ph + (k === 0 ? 0 : Math.PI);
      const hipA = walking ? Math.sin(p) * 0.42 * amp : (a.mode === 'stand' ? (k ? 0.05 : -0.02) : 0);
      const knee = walking ? Math.max(0, Math.sin(p - 1.3)) * 0.85 * amp + 0.05 : 0.03;
      const thighM = local(sgn * 0.095 * a.w, 0.93, 0, -hipA, 0, 0, 1, new THREE.Matrix4());
      put(M.thigh, i * 2 + k, thighM);
      const shinM = new THREE.Matrix4().multiplyMatrices(thighM, local(0, -0.44, 0, knee, 0, 0, 1, _tmp));
      put(M.shin, i * 2 + k, shinM);
    }
    // arms (right arm holds the umbrella when open)
    for (let k = 0; k < 2; k++) {
      const sgn = k === 0 ? 1 : -1; // k=0 left (x+), k=1 right
      const p = ph + (k === 0 ? Math.PI : 0);
      let sh = walking ? Math.sin(p) * a.armSwing * amp : 0.05, el = -0.22 - (walking ? Math.max(0, -Math.sin(p)) * 0.35 * amp : 0.1), roll = sgn * 0.12;
      const holding = (umbOpen && k === 1);
      if (holding) { sh = -0.95; el = -1.05; roll = -0.25; }
      if (a.mode === 'stand' && k === 0 && a.idlePose > 0.6) { sh = -0.4; el = -1.6; roll = 0.5; } // phone / cup
      const shoulder = new THREE.Matrix4().multiplyMatrices(torsoM, local(sgn * 0.205 * a.w, 0.52, 0, sh, 0, roll, 1, _tmp));
      put(M.uArm, i * 2 + k, shoulder);
      const fore = new THREE.Matrix4().multiplyMatrices(shoulder, local(0, -0.31, 0, el, 0, 0, 1, _tmp));
      put(M.fArm, i * 2 + k, fore);
      if (k === 1) {
        if (holding) {
          // umbrella shaft from the hand, canopy above the head
          const hand = new THREE.Matrix4().multiplyMatrices(fore, local(0, -0.29, 0.02, 0, 0, 0, 1, _tmp));
          _v.setFromMatrixPosition(_m.multiplyMatrices(_root, hand));
          const wobble = Math.sin(t * 1.3 + a.i) * 0.04 + (walking ? Math.sin(ph) * 0.03 : 0);
          const um = local(_v.x, _v.y - 0.05, _v.z, a.umbTilt * 0.3 + wobble, a.yaw, -0.08 + wobble, h, new THREE.Matrix4());
          const umW = new THREE.Matrix4().multiplyMatrices(um, local(0, 0, 0, 0, 0, 0, 1, _tmp));
          M.shaft.setMatrixAt(i, umW);
          M.umb.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(um, local(0.08, 0.72, -0.02, -0.12, 0, 0.12, 1.08, _tmp)));
          M.folded.setMatrixAt(i, ZERO);
        } else {
          M.umb.setMatrixAt(i, ZERO); M.shaft.setMatrixAt(i, ZERO);
          if (carry) put(M.folded, i, new THREE.Matrix4().multiplyMatrices(fore, local(0, -0.28, 0.02, 0.2, 0, 0, 1, _tmp)));
          else M.folded.setMatrixAt(i, ZERO);
        }
      }
    }
    if (a.bag) put(M.bag, i, new THREE.Matrix4().multiplyMatrices(torsoM, local(0.2 * a.w, 0.45, -0.02, 0, 0, 0.05, 1, _tmp))); else M.bag.setMatrixAt(i, ZERO);
    // dogs (some walkers have two)
    const N = this.max;
    for (let d = 0; d < 2; d++) {
      const slot = i + d * N;
      if (a.dog && !leader && d < (a.dogs || 1)) {
        const dxs = Math.sin(a.yaw), dzs = Math.cos(a.yaw);
        const rx = dzs, rz = -dxs; // right of facing
        const side = d === 0 ? 0.45 : -0.15, ahead = d === 0 ? 0.9 : 1.35;
        const ddx = x + dxs * ahead + rx * side, ddz = z + dzs * ahead + rz * side;
        const dph = ph * 1.9 + d * 1.3;
        const dRoot = local(ddx, a.y + 0.34 * (d ? 0.8 : 1) + (walking ? Math.abs(Math.sin(dph)) * 0.02 : 0), ddz, 0, a.yaw - Math.PI / 2 + (d ? Math.sin(t * 0.7 + i) * 0.25 : 0), 0, d ? 0.8 : 1, new THREE.Matrix4());
        M.dogBody.setMatrixAt(slot, dRoot);
        M.dogHead.setMatrixAt(slot, new THREE.Matrix4().multiplyMatrices(dRoot, local(0.3, 0.12, 0, 0, 0, Math.sin(t * 2 + i + d) * 0.1, 1, _tmp)));
        M.dogTail.setMatrixAt(slot, new THREE.Matrix4().multiplyMatrices(dRoot, local(-0.26, 0.04, 0, Math.sin(t * 9 + i + d * 2) * 0.5, 0, -0.9, 1, _tmp)));
        const legs = [[0.17, 0.07, 0], [0.17, -0.07, Math.PI], [-0.17, 0.07, Math.PI], [-0.17, -0.07, 0]];
        legs.forEach(([lx, lz, o], k) => {
          const sw = walking ? Math.sin(dph + o) * 0.5 : 0;
          M.dogLeg.setMatrixAt(slot * 4 + k, new THREE.Matrix4().multiplyMatrices(dRoot, local(lx, -0.05, lz, 0, 0, sw, 1, _tmp)));
        });
        // leash from left hand to collar
        const arr = this.leashGeo.attributes.position.array;
        const lh = new THREE.Vector3().setFromMatrixPosition(_m.multiplyMatrices(_root, local(0.25, 0.75, 0.15, 0, 0, 0, 1, _tmp)));
        const col = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(dRoot, local(0.24, 0.08, 0, 0, 0, 0, 1, _tmp)));
        arr.set([lh.x, lh.y, lh.z, col.x, col.y, col.z], slot * 6);
      } else {
        M.dogBody.setMatrixAt(slot, ZERO); M.dogHead.setMatrixAt(slot, ZERO); M.dogTail.setMatrixAt(slot, ZERO);
        for (let k = 0; k < 4; k++) M.dogLeg.setMatrixAt(slot * 4 + k, ZERO);
        const arr = this.leashGeo.attributes.position.array; if (arr[slot * 6 + 1] !== 0) arr.fill(0, slot * 6, slot * 6 + 6);
      }
    }
  }
  /** People currently on (or waiting at) a crosswalk — turning cars yield to them. */
  crossing() {
    const out = this._cross || (this._cross = []);
    out.length = 0;
    for (const a of this.agents) if (a.alive && (a.edge?.kind === 'cross' || a.mode === 'wait')) out.push(a);
    return out;
  }
  /** People near a point (for the stroll and audio). */
  countNear(x, z, r) { let n = 0; for (const a of this.agents) if (a.alive && Math.abs(a.x - x) < r && Math.abs(a.z - z) < r) n++; return n; }
  blockedAhead(x, z, dx, dz, dist = 1.6) {
    for (const a of this.agents) {
      if (!a.alive) continue;
      const ox = a.x - x, oz = a.z - z;
      const ahead = ox * dx + oz * dz;
      if (ahead > 0.2 && ahead < dist && Math.abs(ox * -dz + oz * dx) < 0.55) return true;
    }
    return false;
  }
  setVisible(v) { this.group.visible = v; }
  dispose() { this.scene.remove(this.group); for (const k in this.M) { this.M[k].geometry.dispose(); this.M[k].dispose(); } this.mat.dispose(); this.umbMat.dispose(); }
}
