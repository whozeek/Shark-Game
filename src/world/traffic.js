// Traffic: instanced cars, taxis, vans, buses and cyclists that follow lanes, keep their distance,
// stop at red lights and wait for anyone standing in the road. Headlights light the wet street.
import * as THREE from 'three';
import { vehicleParts, CAR_COLORS, TAXI_YELLOW } from './vehicleGeo.js';
import { patchGlossy } from '../render/shared.js';
import { RNG } from '../core/rng.js';
import { LAYER_NO_REFLECT } from './cityBase.js';

const TYPES = ['sedan', 'taxi', 'suv', 'van', 'bus', 'decker'];
const isBus = (v) => v.type === 'bus' || v.type === 'decker';
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();

function beamGeo() {
  const g = new THREE.CylinderGeometry(0.12, 1.9, 13, 12, 1, true);
  g.rotateZ(-Math.PI / 2); // point along +X
  g.translate(6.5, 0, 0);
  return g;
}

export class Traffic {
  constructor(scene, max) {
    this.scene = scene;
    this.max = max;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.rng = new RNG(5);
    this.vehicles = [];
    this.lanes = [];
    const bodyMat = patchGlossy(new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.45 }), { strengthUniform: 'uReflCar', base: 0.08, rainbowAmt: 0.25 });
    const glassMat = patchGlossy(new THREE.MeshStandardMaterial({ color: 0x0b0f15, roughness: 0.05, metalness: 0.5 }), { strengthUniform: 'uReflCar', base: 0.3, rainbowAmt: 0.45 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.8 });
    const chrome = patchGlossy(new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: 0.25, metalness: 0.9 }), { strengthUniform: 'uReflCar', base: 0.4, rainbowAmt: 0.2 });
    this.headMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1) });
    this.tailMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1) });
    this.extraMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1) });
    this.mats = [bodyMat, glassMat, rubber, chrome, this.headMat, this.tailMat, this.extraMat];
    this.meshes = {};
    const perType = { sedan: max, taxi: max, suv: max, van: Math.ceil(max / 3), bus: Math.ceil(max / 6), decker: Math.ceil(max / 6) };
    this.capacity = perType;
    for (const t of TYPES) {
      const p = vehicleParts(t);
      const n = perType[t];
      const mk = (geo, mat, colors = false) => {
        if (!geo) return null;
        const im = new THREE.InstancedMesh(geo, mat, n);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        im.frustumCulled = false;
        if (colors) { im.setColorAt(0, new THREE.Color()); }
        for (let i = 0; i < n; i++) im.setMatrixAt(i, ZERO);
        this.group.add(im);
        return im;
      };
      this.meshes[t] = {
        body: mk(p.body, bodyMat, true), glass: mk(p.glass, glassMat), wheels: mk(p.wheels, rubber),
        front: mk(p.front, this.headMat, true), rear: mk(p.rear, this.tailMat, true), extra: mk(p.extra, this.extraMat, true),
        trim: mk(p.trim, chrome), bumpers: mk(p.bumpers, rubber),
        free: Array.from({ length: n }, (_, i) => n - 1 - i), parts: p,
      };
    }
    // bicycles: frame + wheels + rider
    this.bikeMax = Math.ceil(max / 4);
    const frame = new THREE.BoxGeometry(1.0, 0.05, 0.05).translate(0, 0.6, 0);
    const wheelG = new THREE.TorusGeometry(0.33, 0.025, 5, 16);
    const w1 = wheelG.clone().translate(0.52, 0.34, 0), w2 = wheelG.clone().translate(-0.52, 0.34, 0);
    const bikeG = mergeG([frame, w1, w2, new THREE.BoxGeometry(0.05, 0.4, 0.05).translate(-0.2, 0.75, 0), new THREE.BoxGeometry(0.05, 0.45, 0.4).translate(0.45, 0.85, 0)]);
    const riderTorso = new THREE.CapsuleGeometry(0.16, 0.3, 3, 8).rotateZ(-0.6).translate(0.05, 1.25, 0);
    const riderHead = new THREE.SphereGeometry(0.12, 8, 6).translate(0.32, 1.62, 0);
    const helmet = new THREE.SphereGeometry(0.135, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2).translate(0.32, 1.64, 0);
    const riderG = mergeG([riderTorso, riderHead, new THREE.CapsuleGeometry(0.05, 0.4, 2, 6).rotateZ(-1.1).translate(0.3, 1.2, 0.18), new THREE.CapsuleGeometry(0.05, 0.4, 2, 6).rotateZ(-1.1).translate(0.3, 1.2, -0.18)]);
    const legG = new THREE.CapsuleGeometry(0.065, 0.6, 2, 6).translate(0, -0.35, 0);
    const mk2 = (g, mat, n, colors) => { const im = new THREE.InstancedMesh(g, mat, n); im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); if (colors) im.setColorAt(0, new THREE.Color()); for (let i = 0; i < n; i++) im.setMatrixAt(i, ZERO); this.group.add(im); return im; };
    const plain = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    this.mats.push(plain);
    const boxG = new THREE.BoxGeometry(0.45, 0.42, 0.42).translate(-0.05, 1.55, 0);
    this.bike = { box: mk2(boxG, plain, this.bikeMax, true), frame: mk2(bikeG, bodyMat, this.bikeMax, true), rider: mk2(riderG, plain, this.bikeMax, true), helmet: mk2(helmet, bodyMat, this.bikeMax, true), leg: mk2(legG, plain, this.bikeMax * 2, true), lamp: mk2(new THREE.SphereGeometry(0.06, 6, 4).translate(0.55, 0.85, 0), this.headMat, this.bikeMax, true), free: Array.from({ length: this.bikeMax }, (_, i) => this.bikeMax - 1 - i) };
    // headlight beams
    this.beamMat = new THREE.ShaderMaterial({
      uniforms: { uStr: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying float vT; varying vec3 vN; varying vec3 vV;
        void main(){ vT = uv.y; vec4 w = modelMatrix * instanceMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix * instanceMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`uniform float uStr; varying float vT; varying vec3 vN; varying vec3 vV;
        void main(){ float e = pow(abs(dot(vN, vV)), 1.2); float a = e * pow(vT, 1.6) * 0.06 * uStr; gl_FragColor = vec4(vec3(1.0, 0.92, 0.8) * a, 1.0); }`,
    });
    this.beams = new THREE.InstancedMesh(beamGeo(), this.beamMat, max * 2);
    this.beams.frustumCulled = false; this.beams.layers.set(LAYER_NO_REFLECT);
    for (let i = 0; i < max * 2; i++) this.beams.setMatrixAt(i, ZERO);
    this.beams.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.beams);
    this.dynPools = [];
    this.lightLevel = 1;
    this.beamFree = Array.from({ length: max }, (_, i) => max - 1 - i);
  }

  setCity(cb, def) {
    for (const v of this.vehicles) this.release(v);
    this.vehicles = [];
    this.lanes = cb.lanes;
    for (const l of this.lanes) l.cars = [];
    this.signals = cb.signals;
    this.mix = def.vehicleMix || { car: 0.7, taxi: 0.1, suv: 0.15, van: 0.05 };
    this.busColor = def.busColor ?? 0x2a5aa8;
    this.taxiColor = def.taxiColor ?? TAXI_YELLOW;
    this.decker = !!def.decker;
    this.leftHand = !!cb.layout?.leftHand;
    this.allowBus = def.bus !== false;
    this.allowBikes = def.bikes !== false;
    this.populated = false;
    // bus stops along kerb-side lanes
    for (const L of this.lanes) {
      L.busStops = [];
      for (const st of cb.busStops || []) {
        const perp = L.axis === 'x' ? st.z : st.x, along = L.axis === 'x' ? st.x : st.z;
        if (Math.abs(perp - L.fixed) < 7.5) L.busStops.push(along);
      }
    }
    // which cross-street lanes a car can turn onto at each intersection (lane-correct turns only)
    const vec = (L) => (L.axis === 'x' ? [L.dir, 0] : [0, L.dir]);
    const posOf = (L) => (L.axis === 'x' ? [0, L.fixed] : [L.fixed, 0]);
    for (const L of this.lanes) {
      L.turnOpts = [];
      const h = vec(L), r = [-h[1], h[0]];
      const street = this.lanes.filter((o) => o.axis === L.axis && Math.abs(o.fixed - L.fixed) < 12);
      const same = street.filter((o) => o.dir === L.dir);
      const twoWay = street.some((o) => o.dir !== L.dir);
      const sideVal = (o) => { const p = posOf(o); return p[0] * r[0] + p[1] * r[1]; };
      const rightmost = same.every((o) => sideVal(o) <= sideVal(L) + 0.01);
      const leftmost = same.every((o) => sideVal(o) >= sideVal(L) - 0.01);
      for (const stop of L.stops) {
        const cross = this.lanes.filter((T) => T.axis !== L.axis && Math.abs(T.fixed - stop.c) < stop.hw - 1.5 && (T.kinds || ['car']).includes('car'));
        const lanes = [];
        for (const want of [1, -1]) { // 1 = right turn, -1 = left turn
          const easy = this.leftHand ? -1 : 1;
          if (want === easy && !(easy === 1 ? rightmost : leftmost)) continue;
          if (want === -easy && (twoWay || !(easy === 1 ? leftmost : rightmost))) continue;
          const cands = cross.filter((T) => { const t = vec(T); return t[0] * r[0] * want + t[1] * r[1] * want > 0.5; });
          if (!cands.length) continue;
          // enter the lane nearest the corner we came from
          const along = (T) => { const p = posOf(T); return p[0] * h[0] + p[1] * h[1]; };
          lanes.push(cands.reduce((a, b) => (along(b) < along(a) ? b : a)));
        }
        if (lanes.length) L.turnOpts.push({ c: stop.c, lanes });
      }
    }
  }

  /** World position and heading of a vehicle (on a lane or mid-turn). */
  pose(v) {
    if (v.turn) return v.turn.p;
    const L = v.lane;
    return {
      x: L.axis === 'x' ? v.pos : L.fixed, z: L.axis === 'x' ? L.fixed : v.pos,
      ry: L.axis === 'x' ? (L.dir > 0 ? 0 : Math.PI) : (L.dir > 0 ? -Math.PI / 2 : Math.PI / 2),
    };
  }

  /** Decide on (and possibly start) a turn for a car travelling on lane L. Returns true if it left the lane. */
  considerTurn(v, L) {
    if (v.type === 'bike' || isBus(v)) return false;
    const R = 7.5;
    if (!v.plan) {
      for (const o of L.turnOpts) {
        const ahead = (o.c - v.pos) * L.dir;
        if (ahead < 18 || ahead > 60 || v.decided === o.c) continue;
        v.decided = o.c;
        if (this.rng.f() < this.turnRate) {
          // prefer the cross-street lane on the near side for right turns, any for left turns
          v.plan = { c: o.c, T: this.rng.pick(o.lanes) };
        }
        break;
      }
      return false;
    }
    const T = v.plan.T;
    const sAlong = T.fixed - L.dir * R;
    const toStart = (sAlong - v.pos) * L.dir;
    if (toStart > 0) return false;
    if (toStart < -2.5) { v.plan = null; return false; }
    const eAlong = L.fixed + T.dir * R;
    const clear = T.cars.every((c) => Math.abs(c.pos - eAlong) > 10) && !this.vehicles.some((c) => c.turn && c.turn.T === T && c !== v);
    if (!clear) { v.plan = null; return false; }
    // quadratic Bezier from the current lane into the new one, through the lanes' crossing point
    const P = (along, lane) => lane.axis === 'x' ? [along, lane.fixed] : [lane.fixed, along];
    const S = P(v.pos, L), C = L.axis === 'x' ? [T.fixed, L.fixed] : [L.fixed, T.fixed], E = P(eAlong, T);
    let len = 0, prev = S;
    for (let k = 1; k <= 10; k++) { const q = bez(S, C, E, k / 10); len += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; }
    v.turn = { S, C, E, t: 0, len, T, eAlong, p: { ...this.pose(v) } };
    v.plan = null;
    return true;
  }

  pickType(lane, s) {
    const r = this.rng;
    const kinds = lane.kinds || ['car', 'taxi', 'bus', 'bike'];
    if (s.cyclists && this.allowBikes && kinds.includes('bike') && r.chance(kinds.length === 1 ? 1 : 0.08)) return 'bike';
    if (!kinds.includes('car')) return null;
    if (s.buses && this.allowBus && kinds.includes('bus') && r.chance(0.07)) return this.decker ? 'decker' : 'bus';
    const m = this.mix;
    const opts = [['sedan', m.car || 0], ['suv', m.suv || 0], ['van', m.van || 0]];
    if (s.taxis && kinds.includes('taxi')) opts.push(['taxi', m.taxi || 0]);
    return r.weighted(opts.filter((o) => o[1] > 0).length ? opts : [['sedan', 1]]);
  }

  acquire(type) {
    if (type === 'bike') { const i = this.bike.free.pop(); return i === undefined ? null : i; }
    const i = this.meshes[type].free.pop();
    return i === undefined ? null : i;
  }
  release(v) {
    if (v.type === 'bike') {
      const B = this.bike; B.free.push(v.idx);
      for (const k of ['frame', 'rider', 'helmet', 'lamp', 'box']) B[k].setMatrixAt(v.idx, ZERO);
      B.leg.setMatrixAt(v.idx * 2, ZERO); B.leg.setMatrixAt(v.idx * 2 + 1, ZERO);
    } else {
      const M = this.meshes[v.type];
      M.free.push(v.idx);
      for (const k of ['body', 'glass', 'wheels', 'front', 'rear', 'extra', 'trim', 'bumpers']) if (M[k]) M[k].setMatrixAt(v.idx, ZERO);
    }
    if (v.beam >= 0) { this.beams.setMatrixAt(v.beam * 2, ZERO); this.beams.setMatrixAt(v.beam * 2 + 1, ZERO); this.beamFree.push(v.beam); v.beam = -1; }
    if (v.lane) v.lane.cars = v.lane.cars.filter((c) => c !== v);
    v.turn = null; v.plan = null;
  }

  spawn(lane, pos, s) {
    const type = this.pickType(lane, s);
    if (!type) return null;
    const idx = this.acquire(type);
    if (idx === null) return null;
    const r = this.rng;
    const parts = type === 'bike' ? { length: 1.8, width: 0.6 } : this.meshes[type].parts;
    const v = { type, idx, lane, pos, speed: lane.speed * 0.8, len: parts.length, width: parts.width, color: null, braking: 0, beam: this.beamFree.pop() ?? -1, wantMul: r.range(0.85, 1.1) };
    const col = new THREE.Color(type === 'taxi' ? this.taxiColor : (type === 'bus' || type === 'decker') ? this.busColor : r.pick(CAR_COLORS));
    if (type === 'bike') {
      this.bike.frame.setColorAt(idx, new THREE.Color(r.pick([0xb8302a, 0x2a5aa8, 0x1a1a1a, 0x3a7a4a, 0xe0e0e0])));
      this.bike.rider.setColorAt(idx, new THREE.Color(r.pick([0x2a3a4a, 0x1a1a1a, 0xc8a020, 0x6a2a2a, 0x3a5a3a])));
      this.bike.helmet.setColorAt(idx, new THREE.Color(r.pick([0xffffff, 0x1a1a1a, 0xe04020, 0x20a0e0])));
      this.bike.leg.setColorAt(idx * 2, new THREE.Color(0x1c2433)); this.bike.leg.setColorAt(idx * 2 + 1, new THREE.Color(0x1c2433));
      this.bike.lamp.setColorAt(idx, new THREE.Color(4, 4, 3.6));
      for (const k of ['frame', 'rider', 'helmet', 'leg', 'lamp']) this.bike[k].instanceColor.needsUpdate = true;
      v.speed = 4.5; v.wantMul = r.range(0.8, 1.0);
      v.deliv = r.chance(0.4); if (v.deliv) v.wantMul = r.range(1.0, 1.15);
      this.bike.box.setColorAt(idx, new THREE.Color(r.pick([0x2ab06a, 0xff8a1a, 0xd8203a, 0x1a8ad8, 0xf2c41a]))); this.bike.box.instanceColor.needsUpdate = true;
    } else {
      const M = this.meshes[type];
      M.body.setColorAt(idx, col); M.body.instanceColor.needsUpdate = true;
      if (M.extra) { M.extra.setColorAt(idx, type === 'taxi' ? new THREE.Color(3, 2.6, 1.6) : new THREE.Color(3, 2.2, 0.6)); M.extra.instanceColor.needsUpdate = true; }
    }
    lane.cars.push(v);
    this.vehicles.push(v);
    return v;
  }

  populate(target, s) {
    // spread vehicles across lanes at sensible spacing
    const lanes = this.lanes.filter((l) => l.to > l.from);
    if (!lanes.length) return;
    let guard = 0;
    while (this.vehicles.length < target && guard++ < target * 6) {
      const lane = this.rng.pick(lanes);
      const pos = lane.from + this.rng.f() * (lane.to - lane.from);
      const clear = lane.cars.every((c) => Math.abs(c.pos - pos) > 12);
      if (clear) this.spawn(lane, pos, s);
    }
  }

  update(dt, t, ctx) {
    const s = ctx.settings;
    const target = Math.round(this.max * Math.min(1, s.traffic * (ctx.trafficMul ?? 1)));
    if (!this.populated) { this.populate(target, s); this.populated = true; }
    // adjust population gradually
    if (this.vehicles.length > target) {
      // remove one far from the camera
      const v = this.vehicles.find((c) => this.dist(c, ctx.cam) > 60) || (target === 0 ? this.vehicles[0] : null);
      if (v) { this.release(v); this.vehicles = this.vehicles.filter((c) => c !== v); }
    } else if (this.vehicles.length < target && this.rng.f() < dt * 2) {
      const lane = this.rng.pick(this.lanes);
      if (lane) {
        const start = lane.dir > 0 ? lane.from : lane.to;
        if (lane.cars.every((c) => Math.abs(c.pos - start) > 14)) this.spawn(lane, start, s);
      }
    }
    if (ctx.frozen) { this.writeMatrices(ctx, 0); return; }
    const sig = this.signals;
    const sp = s.trafficSpeed;
    this.turnRate = 0.35;
    const turners = [];
    const crossingPeds = (ctx.peds || []).filter((a) => a.mode === 'walk' && a.edge?.kind === 'cross');
    for (const lane of this.lanes) {
      const cars = lane.cars;
      cars.sort((a, b) => (b.pos - a.pos) * lane.dir);
      for (let i = 0; i < cars.length; i++) {
        const v = cars[i];
        const leader = i > 0 ? cars[i - 1] : null;
        let vmax = lane.speed * sp * v.wantMul * (isBus(v) ? 0.8 : 1);
        if (v.type === 'bike') vmax = Math.min(vmax, 5.2 * v.wantMul * sp);
        let limit = vmax;
        const front = v.pos + lane.dir * v.len / 2;
        if (leader) {
          const gap = (leader.pos - lane.dir * leader.len / 2 - front) * lane.dir;
          const safe = 2.2 + v.speed * 0.9;
          if (gap < safe * 3) limit = Math.min(limit, Math.max(0, (gap - 2.0) / (safe * 3 - 2.0)) * Math.max(leader.speed + 2, vmax));
          if (gap < 2.0) limit = 0;
        }
        // signals
        if (lane.signal) {
          const st = sig.state(lane.axis);
          if (st !== 'green') {
            for (const stop of lane.stops) {
              const line = stop.c - lane.dir * stop.hw;
              const d = (line - front) * lane.dir;
              if (d < -0.5 || d > 45) continue;
              const brakeDist = v.speed * v.speed / (2 * 4.5);
              if (st === 'yellow' && d < brakeDist * 0.6) continue; // too close to stop, proceed
              limit = Math.min(limit, Math.sqrt(Math.max(0, 2 * 3.5 * (d - 0.8))));
              break;
            }
          }
        }
        // buses pull in at stops for a few seconds
        if (isBus(v) && lane.busStops?.length && !v.dwell) {
          for (const bs of lane.busStops) {
            const d = (bs - v.pos) * lane.dir;
            if (d < -1 || d > 35 || v.servedStop === bs) continue;
            limit = Math.min(limit, Math.sqrt(Math.max(0, 2 * 2.5 * d)));
            if (d < 1.0 && v.speed < 0.6) { v.dwell = 7 + this.rng.f() * 5; v.servedStop = bs; v.atStop = true; }
            break;
          }
        }
        // dawn deliveries: vans double-park for a while with hazard lights
        if (v.type === 'van' && ctx.rhythmOn && ctx.hour >= 4.8 && ctx.hour <= 8.5) {
          if (!v.dwell && !v.delivered && this.rng.f() < dt * 0.04 && lane.stops.every((st) => Math.abs(st.c - v.pos) > 22)) { v.dwell = 16 + this.rng.f() * 14; v.delivered = true; }
        } else v.delivered = false;
        if (v.dwell > 0) { v.dwell -= dt; limit = 0; v.hazard = !v.atStop; if (v.dwell <= 0) { v.dwell = 0; v.hazard = false; v.atStop = false; } }
        // cars merging into this lane from a turn
        for (const o of this.vehicles) {
          if (!o.turn || o === v) continue;
          const op = o.turn.p;
          const along = lane.axis === 'x' ? op.x : op.z, perp = lane.axis === 'x' ? op.z : op.x;
          if (Math.abs(perp - lane.fixed) > 2.6) continue;
          const d = (along - front) * lane.dir;
          if (d < -1 || d > 18) continue;
          limit = Math.min(limit, Math.sqrt(Math.max(0, 2 * 4 * (d - 2.5))));
        }
        // people standing in the roadway (the player / stroll) and anyone still on a crosswalk
        for (const p of ctx.obstacles.concat(crossingPeds)) {
          const along = lane.axis === 'x' ? p.x : p.z;
          const perp = lane.axis === 'x' ? p.z : p.x;
          if (Math.abs(perp - lane.fixed) > 2.0) continue;
          const d = (along - front) * lane.dir;
          if (d < -1 || d > 30) continue;
          limit = Math.min(limit, Math.sqrt(Math.max(0, 2 * 4 * (d - 2.5))));
        }
        const acc = limit > v.speed ? 2.2 : -6.5;
        const prev = v.speed;
        v.speed = acc > 0 ? Math.min(limit, v.speed + acc * dt) : Math.max(limit, v.speed + acc * dt);
        v.speed = Math.max(0, v.speed);
        v.braking = (v.speed < prev - 0.01 || v.speed < 0.2) ? 1 : Math.max(0, v.braking - dt * 3);
        v.pos += lane.dir * v.speed * dt;
        if (this.considerTurn(v, lane)) { turners.push([v, lane]); continue; }
        // wrap at the end of the lane
        const past = lane.dir > 0 ? v.pos > lane.to : v.pos < lane.from;
        if (past) {
          const start = lane.dir > 0 ? lane.from : lane.to;
          if (cars.every((c) => c === v || Math.abs(c.pos - start) > 12)) { v.pos = start; v.speed = vmax * 0.8; }
          else v.pos = lane.dir > 0 ? lane.to : lane.from;
        }
      }
    }
    for (const [v, lane] of turners) lane.cars = lane.cars.filter((c) => c !== v);
    // cars part-way through a turn: slow, smooth, and they yield to anyone on the crosswalk
    const people = (ctx.obstacles || []).concat(ctx.peds || []);
    for (const v of this.vehicles) {
      const tr = v.turn; if (!tr) continue;
      const p = tr.p;
      const hx = Math.cos(p.ry), hz = -Math.sin(p.ry);
      let limit = Math.min(5.5, tr.T.speed * sp * 0.6);
      for (const o of people) {
        const dx = o.x - p.x, dz = o.z - p.z;
        const ahead = dx * hx + dz * hz;
        if (ahead > 0 && ahead < v.len / 2 + 5 && Math.abs(dx * -hz + dz * hx) < 1.8) limit = 0;
      }
      for (const o of this.vehicles) {
        if (o === v) continue;
        const q = this.pose(o);
        const dx = q.x - p.x, dz = q.z - p.z;
        const ahead = dx * hx + dz * hz;
        if (ahead > 0 && ahead < v.len / 2 + o.len / 2 + 3 && Math.abs(dx * -hz + dz * hx) < 2.0) limit = 0;
      }
      v.speed = limit > v.speed ? Math.min(limit, v.speed + 2 * dt) : Math.max(limit, v.speed - 7 * dt);
      v.braking = limit < v.speed + 0.1 && limit < 1 ? 1 : 0;
      tr.t = Math.min(1, tr.t + v.speed * dt / tr.len);
      const q = bez(tr.S, tr.C, tr.E, tr.t), d = bezD(tr.S, tr.C, tr.E, Math.min(0.999, Math.max(0.001, tr.t)));
      p.x = q[0]; p.z = q[1]; p.ry = Math.atan2(-d[1], d[0]);
      if (tr.t >= 1) { v.turn = null; v.lane = tr.T; v.pos = tr.eAlong; tr.T.cars.push(v); }
    }
    this.writeMatrices(ctx, dt, t);
  }
  dist(v, cam) {
    const p = this.pose(v);
    return Math.hypot(p.x - cam.x, p.z - cam.z);
  }
  writeMatrices(ctx, dt, t = 0) {
    const s = ctx.settings;
    const night = ctx.night;
    const lightsOn = s.headlightsOn ? (0.35 + 0.65 * night) : 0.08;
    const hl = s.headlights * lightsOn;
    this.headMat.color.setRGB(1, 0.95, 0.85).multiplyScalar(1 + 6 * hl);
    this.tailMat.color.setRGB(1, 0.06, 0.04).multiplyScalar(0.6 + 3 * lightsOn * s.headlights);
    this.beamMat.uniforms.uStr.value = hl * (0.3 + ctx.haze * 1.4);
    const pools = [];
    const hide = ctx.hideCars;
    this.group.visible = !hide;
    for (const v of this.vehicles) {
      const L = v.lane;
      const { x, z, ry } = this.pose(v);
      const d = Math.hypot(x - ctx.cam.x, z - ctx.cam.z);
      const far = d > 160;
      _e.set(0, ry, 0); _q.setFromEuler(_e);
      if (v.type === 'bike') {
        const B = this.bike; const i = v.idx;
        const off = (L.axis === 'x' ? 1 : -1) * L.dir * 0.9 * (this.leftHand ? -1 : 1);
        const bx = L.axis === 'x' ? x : x + off, bz = L.axis === 'x' ? z + off : z;
        if (far) { for (const k of ['frame', 'rider', 'helmet', 'lamp', 'box']) B[k].setMatrixAt(i, ZERO); continue; }
        _m.compose(_p.set(bx, L.y, bz), _q, _s.set(1, 1, 1));
        B.frame.setMatrixAt(i, _m); B.rider.setMatrixAt(i, _m); B.helmet.setMatrixAt(i, _m); B.lamp.setMatrixAt(i, _m); B.box.setMatrixAt(i, v.deliv ? _m : ZERO);
        v.crank = (v.crank || 0) + v.speed * (dt || 0) * 2.2;
        for (let k = 0; k < 2; k++) {
          const a = v.crank + k * Math.PI;
          const lm = new THREE.Matrix4().compose(new THREE.Vector3(-0.15, 1.05, k ? 0.13 : -0.13), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.5 + Math.sin(a) * 0.45)), new THREE.Vector3(1, 1, 1));
          B.leg.setMatrixAt(i * 2 + k, new THREE.Matrix4().multiplyMatrices(_m, lm));
        }
        continue;
      }
      const M = this.meshes[v.type];
      if (far) { for (const k of ['body', 'glass', 'wheels', 'front', 'rear', 'extra', 'trim', 'bumpers']) if (M[k]) M[k].setMatrixAt(v.idx, ZERO); if (v.beam >= 0) { this.beams.setMatrixAt(v.beam * 2, ZERO); this.beams.setMatrixAt(v.beam * 2 + 1, ZERO); } continue; }
      const bob = Math.sin(t * 9 + v.idx) * 0.004 * Math.min(1, v.speed);
      _m.compose(_p.set(x, L.y + bob, z), _q, _s.set(1, 1, 1));
      for (const k of ['body', 'glass', 'wheels', 'front', 'rear', 'extra', 'trim', 'bumpers']) if (M[k]) M[k].setMatrixAt(v.idx, _m);
      const blink = v.hazard && Math.sin(t * 9) > 0;
      const br = v.braking > 0.5 ? 2.6 : 1;
      if (v.hazard) { M.rear.setColorAt(v.idx, blink ? _brake.setRGB(4, 9, 0) : _brake.setRGB(0.4, 0.4, 0.4)); M.front.setColorAt(v.idx, blink ? _brake.setRGB(1.6, 0.9, 0.1) : _brake.setRGB(0.7, 0.7, 0.7)); }
      else { M.rear.setColorAt(v.idx, _brake.setRGB(br, br, br)); M.front.setColorAt(v.idx, _brake.setRGB(1, 1, 1)); }
      // beams
      if (hl > 0.05 && d < 90 && v.beam >= 0) {
        const fx = Math.cos(ry), fz = -Math.sin(ry);
        const half = v.len / 2, side = v.width / 2 - 0.3;
        for (let k = 0; k < 2; k++) {
          const sx = -fz * side * (k ? 1 : -1), sz = fx * side * (k ? 1 : -1);
          const bm = new THREE.Matrix4().compose(_p.set(x + fx * half + sx, L.y + 0.62, z + fz * half + sz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, -0.06)), _s.set(1, 1, 1));
          this.beams.setMatrixAt(v.beam * 2 + k, bm);
        }
        pools.push({ d, x: x + fx * (half + 6), z: z + fz * (half + 6), r: 6.5, s: 0.55 * hl, color: _warm });
      } else if (v.beam >= 0) { this.beams.setMatrixAt(v.beam * 2, ZERO); this.beams.setMatrixAt(v.beam * 2 + 1, ZERO); }
    }
    pools.sort((a, b) => a.d - b.d);
    this.dynPools = pools.slice(0, 10);
    const usedBy = {};
    for (const v of this.vehicles) usedBy[v.type] = Math.max(usedBy[v.type] || 0, v.idx + 1);
    for (const t2 of TYPES) {
      const M = this.meshes[t2];
      for (const k of ['body', 'glass', 'wheels', 'front', 'rear', 'extra', 'trim', 'bumpers']) if (M[k]) { M[k].count = usedBy[t2] || 0; M[k].instanceMatrix.needsUpdate = true; if (M[k].instanceColor) M[k].instanceColor.needsUpdate = true; }
    }
    const bikes = usedBy.bike || 0;
    for (const k of ['frame', 'rider', 'helmet', 'lamp', 'box']) this.bike[k].count = bikes;
    this.bike.leg.count = bikes * 2;
    let beamsUsed = 0; for (const v of this.vehicles) if (v.beam >= 0) beamsUsed = Math.max(beamsUsed, v.beam + 1);
    this.beams.count = beamsUsed * 2;
    for (const k of ['frame', 'rider', 'helmet', 'leg', 'lamp', 'box']) this.bike[k].instanceMatrix.needsUpdate = true;
    this.beams.instanceMatrix.needsUpdate = true;
  }
  /** Nearest moving vehicles for audio: [{x,z,speed,d}] */
  nearest(cam, n = 3) {
    const out = [];
    for (const v of this.vehicles) {
      const { x, z } = this.pose(v);
      out.push({ x, z, speed: v.speed, d: Math.hypot(x - cam.x, z - cam.z), type: v.type });
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, n);
  }
  /** Is any vehicle within the given rectangle around a crossing? */
  occupied(x0, z0, x1, z1, margin = 0, crossAxis = null) {
    for (const v of this.vehicles) {
      // cars driving parallel to the crosswalk never cross it; turning cars yield to walkers themselves
      if (crossAxis && (v.turn || v.lane.axis === crossAxis)) continue;
      const { x, z } = this.pose(v);
      if (x > x0 - margin - v.len / 2 && x < x1 + margin + v.len / 2 && z > z0 - margin - v.len / 2 && z < z1 + margin + v.len / 2 && v.speed > 0.3) return true;
    }
    return false;
  }
  dispose() {
    for (const v of this.vehicles) this.release(v);
    this.scene.remove(this.group);
    this.group.traverse((o) => { if (o.isInstancedMesh) { o.dispose(); } });
    for (const m of this.mats) m.dispose();
    this.beamMat.dispose();
  }
}
const _brake = new THREE.Color();
function bez(a, c, b, t) { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; }
function bezD(a, c, b, t) { return [2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]), 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1])]; }
const _warm = new THREE.Color(1, 0.9, 0.75);

function mergeG(geos) {
  const parts = geos.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal'].includes(k)) n.deleteAttribute(k); return n; });
  let total = 0; for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3), nrm = new Float32Array(total * 3);
  let o = 0;
  for (const p of parts) { pos.set(p.attributes.position.array, o * 3); nrm.set(p.attributes.normal.array, o * 3); o += p.attributes.position.count; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}
