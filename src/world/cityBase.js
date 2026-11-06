// CityBuilder: the shared toolkit every city module uses to describe itself.
// It owns the merged geometry batch, collision shapes, the pedestrian walk graph,
// vehicle lanes, traffic signals, light sources, seats and minimap shapes.
import * as THREE from 'three';
import { Batcher } from './batcher.js';
import { CollisionWorld } from './collision.js';
import { RNG } from '../core/rng.js';

export const LAYER_NO_REFLECT = 2;

export class WalkGraph {
  constructor() { this.nodes = []; this.edges = []; }
  node(x, z, o = {}) {
    // merge with an existing node within 0.3m
    for (const n of this.nodes) if (Math.abs(n.x - x) < 0.3 && Math.abs(n.z - z) < 0.3) return n.id;
    const id = this.nodes.length;
    this.nodes.push({ id, x, z, edges: [], exit: !!o.exit, y: o.y ?? 0.15 });
    return id;
  }
  edge(a, b, o = {}) {
    if (a === b) return null;
    const na = this.nodes[a], nb = this.nodes[b];
    for (const e of na.edges) { const ed = this.edges[e]; if ((ed.a === a && ed.b === b) || (ed.a === b && ed.b === a)) return ed; }
    const len = Math.hypot(nb.x - na.x, nb.z - na.z);
    const e = { id: this.edges.length, a, b, len, width: o.width ?? 2, kind: o.kind || 'walk', axis: o.axis || null, browse: o.browse || null, y: o.y ?? 0.15 };
    this.edges.push(e);
    na.edges.push(e.id); nb.edges.push(e.id);
    return e;
  }
  other(e, n) { return e.a === n ? e.b : e.a; }
  nearestNode(x, z, filter = null) {
    let best = null, bd = Infinity;
    for (const n of this.nodes) { if (filter && !filter(n)) continue; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = n; } }
    return best;
  }
  /** Breadth-first path between nodes, returns node id list. */
  path(from, to) {
    const prev = new Map([[from, -1]]);
    const q = [from];
    while (q.length) {
      const n = q.shift();
      if (n === to) break;
      for (const eid of this.nodes[n].edges) {
        const o = this.other(this.edges[eid], n);
        if (!prev.has(o)) { prev.set(o, n); q.push(o); }
      }
    }
    if (!prev.has(to)) return null;
    const out = []; let c = to;
    while (c !== -1) { out.push(c); c = prev.get(c); }
    return out.reverse();
  }
  edgeBetween(a, b) {
    for (const eid of this.nodes[a].edges) { const e = this.edges[eid]; if (e.a === b || e.b === b) return e; }
    return null;
  }
}

/** Global traffic signal timing shared by cars, pedestrians and the stroll. */
export class Signals {
  constructor(cycle = 34) { this.cycle = cycle; this.t = 0; this.disabled = false; }
  update(dt) { this.t = (this.t + dt) % this.cycle; }
  // phase: 0..cycle. X-axis green for first ~45%, then yellow, all red, Z green, yellow, all red.
  state(axis) {
    if (this.disabled) return 'green';
    const c = this.cycle, t = this.t;
    const g = c * 0.42, y = 3, r = 2;
    const tt = axis === 'x' ? t : (t + c / 2) % c;
    if (tt < g) return 'green';
    if (tt < g + y) return 'yellow';
    return 'red';
  }
  /** Seconds of green remaining for an axis (0 if not green). */
  greenLeft(axis) {
    const c = this.cycle, g = c * 0.42;
    const tt = axis === 'x' ? this.t : (this.t + c / 2) % c;
    return tt < g ? g - tt : 0;
  }
  /** Pedestrians crossing along `axis` may start when that axis' traffic is green. */
  canWalk(axis, need = 6) { return this.disabled || this.greenLeft(axis) > need; }
}

export class CityBuilder {
  constructor(def, quality, materials) {
    this.def = def;
    this.q = quality;
    this.group = new THREE.Group();
    this.group.name = 'city-' + def.id;
    this.batch = new Batcher(70);
    this.col = new CollisionWorld(8);
    this.graph = new WalkGraph();
    this.signals = new Signals(def.signalCycle || 34);
    this.signals.disabled = !!def.noSignals;
    this.lanes = [];
    this.lights = []; // point light candidates {x,y,z,color,intensity,distance}
    this.pools = []; // ground light decals {x,z,r,color,strength,kind}
    this.cones = []; // volumetric cones {x,y,z,r,h,color}
    this.signalHeads = [];
    this.seats = [];
    this.shelters = [];
    this.parked = [];
    this.minimap = [];
    this.viewpoints = [];
    this.disposables = [];
    this.windowMats = [];
    this.neonMats = [];
    this.shopMats = [];
    this.animated = []; // {update(dt,t)}
    this.groundHeight = null; // optional fn(x,z)->y
    this.rng = new RNG(def.seed || 1234);
    this.mats = materials;
    this.spawn = { x: 0, z: 0, yaw: 0 };
    this.route = null;
    this.waterRects = [];
  }
  track(obj) { this.disposables.push(obj); return obj; }
  addMesh(mesh, noReflect = false) {
    if (noReflect) mesh.layers.set(LAYER_NO_REFLECT);
    this.group.add(mesh);
    return mesh;
  }
  light(x, y, z, color, intensity = 1, distance = 18, kind = 'street') {
    this.lights.push({ x, y, z, color: new THREE.Color(color), intensity, distance, kind });
  }
  pool(x, z, r, color, strength = 1, kind = 'street', y = null) { this.pools.push({ x, z, r, color: new THREE.Color(color), strength, kind, y }); }
  cone(x, y, z, r, h, color, strength = 1) { this.cones.push({ x, y, z, r, h, color: new THREE.Color(color), strength }); }
  seat(x, z, yaw, label = 'bench', y = 0.15) { this.seats.push({ x, z, yaw, label, y }); }
  map(type, pts, extra = {}) { this.minimap.push({ type, pts, ...extra }); }
  mapRect(type, x0, z0, x1, z1, extra) { this.map(type, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], extra); }

  /**
   * Lane for vehicles. axis: 'x' or 'z'; fixed: the other coordinate; dir ±1; from/to along axis.
   * stops: list of cross-street {c, hw} used for stop lines.
   */
  lane(o) {
    const lane = { axis: o.axis, fixed: o.fixed, dir: o.dir, from: o.from, to: o.to, stops: o.stops || [], speed: o.speed || 10, kinds: o.kinds || ['car', 'taxi', 'bus', 'bike'], y: o.y ?? 0, signal: o.signal !== false, cars: [] };
    this.lanes.push(lane);
    return lane;
  }
}

/**
 * Generic street grid. Many cities (NYC, Chicago, LA, Miami) share this generator and then add
 * their own blocks, landmarks and features. Streets:
 *   xs: [{ x, road, walk, dirs:[...], park:[bool,bool], name, crossings:true }]  — run along Z (north–south)
 *   zs: [{ z, road, walk, dirs, park, name }]                                    — run along X (east–west)
 * bounds: walkable area. outer: how far scenery continues beyond the bounds.
 */
export function buildGrid(cb, layout, hooks = {}) {
  const { xs, zs, bounds } = layout;
  const outer = layout.outer ?? 60;
  const g = cb.graph;
  const M = cb.mats;
  const ext = { minX: bounds.minX - outer, maxX: bounds.maxX + outer, minZ: bounds.minZ - outer, maxZ: bounds.maxZ + outer };
  cb.col.bounds = bounds;
  cb.layout = layout;
  const curbH = layout.curbH ?? 0.15;

  // ---- ground: roads
  const roadMeshes = [];
  const addGround = (mat, x0, z0, x1, z1, y, uvScale, chunkOK = true) => {
    const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    geo.rotateX(-Math.PI / 2);
    geo.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    const uv = geo.attributes.uv;
    const p = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / uvScale, -p.getZ(i) / uvScale);
    cb.batch.addGeometry(geo, mat);
  };
  cb.addGround = addGround;

  // Road surfaces: one per street, intersections drawn once by the zs streets
  for (const s of xs) {
    const hw = s.road / 2;
    addGround(M.asphalt, s.x - hw, ext.minZ, s.x + hw, ext.maxZ, 0, 6);
    cb.mapRect('road', s.x - hw, ext.minZ, s.x + hw, ext.maxZ);
  }
  const openFrom = layout.openFrom ?? Infinity; // east of this x there are no east–west streets
  const zMaxX = Math.min(ext.maxX, openFrom);
  for (const s of zs) {
    const hw = s.road / 2;
    // split around xs roads to avoid z-fighting
    let x = ext.minX;
    const cuts = xs.map((a) => [a.x - a.road / 2, a.x + a.road / 2]).sort((a, b) => a[0] - b[0]);
    for (const [c0, c1] of cuts) { if (c0 > x && x < zMaxX) addGround(M.asphalt, x, s.z - hw, Math.min(c0, zMaxX), s.z + hw, 0, 6); x = c1; }
    if (x < zMaxX) addGround(M.asphalt, x, s.z - hw, zMaxX, s.z + hw, 0, 6);
    cb.mapRect('road', ext.minX, s.z - hw, zMaxX, s.z + hw);
  }

  // ---- blocks between streets (including outer blocks)
  const xEdges = [{ x: ext.minX, road: 0, walk: 0, edge: true }, ...xs, { x: ext.maxX, road: 0, walk: 0, edge: true }];
  const zEdges = [{ z: ext.minZ, road: 0, walk: 0, edge: true }, ...zs, { z: ext.maxZ, road: 0, walk: 0, edge: true }];
  const blocks = [];
  const zOpen = [zEdges[0], zEdges[zEdges.length - 1]];
  for (let i = 0; i < xEdges.length - 1; i++) {
    const open = xEdges[i].x >= openFrom - 0.1 - (xEdges[i].road || 0) / 2;
    const zE = open ? zOpen : zEdges;
    for (let j = 0; j < zE.length - 1; j++) {
      const A = xEdges[i], B = xEdges[i + 1], C = zE[j], D = zE[j + 1];
      // curb lines (sidewalk outer edges)
      const cx0 = A.x + A.road / 2, cx1 = B.x - B.road / 2, cz0 = C.z + C.road / 2, cz1 = D.z - D.road / 2;
      // property lines (inner edges)
      const px0 = cx0 + (A.edge ? 0 : A.walk), px1 = cx1 - (B.edge ? 0 : B.walk);
      const pz0 = cz0 + (C.edge ? 0 : C.walk), pz1 = cz1 - (D.edge ? 0 : D.walk);
      if (px1 - px0 < 2 || pz1 - pz0 < 2) continue;
      const block = {
        i, j, cx0, cx1, cz0, cz1, x0: px0, x1: px1, z0: pz0, z1: pz1,
        streets: { w: A.edge ? null : A, e: B.edge ? null : B, n: C.edge ? null : C, s: D.edge ? null : D },
        outer: px1 < bounds.minX - 1 || px0 > bounds.maxX + 1 || pz1 < bounds.minZ - 1 || pz0 > bounds.maxZ + 1,
      };
      block.inside = !block.outer;
      block.open = open;
      blocks.push(block);
      if (layout.special && layout.special(block)) { block.special = layout.special(block); }
      // sidewalk slab (raised) covers curb rect minus property rect -> draw as 4 strips
      const sw = M.sidewalk;
      if (!A.edge) addGround(sw, cx0, cz0, px0, cz1, curbH, 3);
      if (!B.edge) addGround(sw, px1, cz0, cx1, cz1, curbH, 3);
      if (!C.edge) addGround(sw, px0, cz0, px1, pz0, curbH, 3);
      if (!D.edge) addGround(sw, px0, pz1, px1, cz1, curbH, 3);
      // curb faces
      const curb = (x0, z0, x1, z1) => cb.batch.box(M.curb, (x0 + x1) / 2, curbH / 2, (z0 + z1) / 2, Math.max(0.12, x1 - x0), curbH, Math.max(0.12, z1 - z0), 0x9a9890);
      if (!A.edge) curb(cx0 - 0.06, cz0, cx0 + 0.06, cz1);
      if (!B.edge) curb(cx1 - 0.06, cz0, cx1 + 0.06, cz1);
      if (!C.edge) curb(cx0, cz0 - 0.06, cx1, cz0 + 0.06);
      if (!D.edge) curb(cx0, cz1 - 0.06, cx1, cz1 + 0.06);
      // block base (under buildings) so nothing shows through
      if (!block.special && !open) addGround(M.ground, px0, pz0, px1, pz1, curbH - 0.01, 4);
      if (!open && !block.special) cb.mapRect(block.outer ? 'blockOuter' : 'block', cx0, cz0, cx1, cz1);
    }
  }
  cb.blocks = blocks;

  // ---- lane markings & crosswalks
  const markMat = M.marking;
  const yMark = 0.012;
  for (const s of xs) markStreet(cb, s, 'x', xs, zs, ext, markMat, yMark);
  for (const s of zs) markStreet(cb, s, 'z', xs, zs, ext, markMat, yMark);

  // ---- walk graph
  const inside = (x, z) => x >= bounds.minX - 0.01 && x <= bounds.maxX + 0.01 && z >= bounds.minZ - 0.01 && z <= bounds.maxZ + 0.01;
  // corner node positions per intersection
  const corner = (si, sj, sx, sz) => {
    const A = xs[si], C = zs[sj];
    const x = A.x + sx * (A.road / 2 + A.walk / 2);
    const z = C.z + sz * (C.road / 2 + C.walk / 2);
    return [x, z];
  };
  const nodeAt = (x, z, o) => g.node(x, z, o);
  // sidewalks along zs streets (running in X)
  for (let j = 0; j < zs.length; j++) {
    const C = zs[j];
    if (C.noWalk) continue;
    for (const sz of [-1, 1]) {
      const z = C.z + sz * (C.road / 2 + C.walk / 2);
      // sequence of points along X: boundary start, corners at each xs (both sides), boundary end
      const pts = [[bounds.minX, true]];
      for (let i = 0; i < xs.length; i++) {
        const A = xs[i];
        pts.push([A.x - (A.road / 2 + A.walk / 2), false, i, -1]);
        pts.push([A.x + (A.road / 2 + A.walk / 2), false, i, 1]);
      }
      pts.push([bounds.maxX, true]);
      pts.sort((a, b) => a[0] - b[0]);
      const ids = pts.filter((p) => p[0] >= bounds.minX - 0.01 && p[0] <= Math.min(bounds.maxX, openFrom + 12) + 0.01).map((p) => nodeAt(p[0], z, { exit: p[1] }));
      for (let k = 0; k < ids.length - 1; k++) {
        const a = g.nodes[ids[k]], b = g.nodes[ids[k + 1]];
        if (Math.min(a.x, b.x) > openFrom - 0.1) continue;
        // segment crossing an xs road? then it's a crosswalk
        const mid = (a.x + b.x) / 2;
        const road = xs.find((A) => Math.abs(mid - A.x) < A.road / 2);
        if (road) {
          if (road.crossings === false || C.crossings === false) continue;
          g.edge(ids[k], ids[k + 1], { kind: 'cross', axis: 'x', width: 2.6, y: 0 });
        } else {
          g.edge(ids[k], ids[k + 1], { kind: 'walk', width: C.walk, browse: { nx: 0, nz: sz } });
        }
      }
    }
  }
  // sidewalks along xs streets (running in Z)
  for (let i = 0; i < xs.length; i++) {
    const A = xs[i];
    if (A.noWalk) continue;
    for (const sx of [-1, 1]) {
      const x = A.x + sx * (A.road / 2 + A.walk / 2);
      const pts = [[bounds.minZ, true]];
      for (const C of zs) { pts.push([C.z - (C.road / 2 + C.walk / 2), false]); pts.push([C.z + (C.road / 2 + C.walk / 2), false]); }
      pts.push([bounds.maxZ, true]);
      pts.sort((a, b) => a[0] - b[0]);
      const ids = pts.filter((p) => p[0] >= bounds.minZ - 0.01 && p[0] <= bounds.maxZ + 0.01).map((p) => nodeAt(x, p[0], { exit: p[1] }));
      for (let k = 0; k < ids.length - 1; k++) {
        const a = g.nodes[ids[k]], b = g.nodes[ids[k + 1]];
        const mid = (a.z + b.z) / 2;
        const road = zs.find((C) => Math.abs(mid - C.z) < C.road / 2);
        if (road) {
          if (road.crossings === false || A.crossings === false) continue;
          g.edge(ids[k], ids[k + 1], { kind: 'cross', axis: 'z', width: 2.6, y: 0 });
        } else {
          g.edge(ids[k], ids[k + 1], { kind: 'walk', width: A.walk, browse: { nx: sx, nz: 0 } });
        }
      }
    }
  }
  // remove exit flag on nodes that are not at bounds
  for (const n of g.nodes) n.exit = n.exit && (Math.abs(n.x - bounds.minX) < 0.5 || Math.abs(n.x - bounds.maxX) < 0.5 || Math.abs(n.z - bounds.minZ) < 0.5 || Math.abs(n.z - bounds.maxZ) < 0.5);

  // ---- vehicle lanes
  for (const s of zs) addLanes(cb, s, 'x', xs, ext);
  for (const s of xs) addLanes(cb, s, 'z', zs, ext);

  // ---- bounds: soft barriers where streets leave the walkable area
  if (!layout.noBarriers) {
    for (const s of xs) for (const zEdge of [bounds.minZ, bounds.maxZ]) barrierRow(cb, s.x - s.road / 2 - s.walk, s.x + s.road / 2 + s.walk, zEdge, 'x');
    for (const s of zs) for (const xEdge of [bounds.minX, bounds.maxX]) if (xEdge < openFrom) barrierRow(cb, s.z - s.road / 2 - s.walk, s.z + s.road / 2 + s.walk, xEdge, 'z');
  }
  // ground height: roads at 0, sidewalks/blocks at curb height
  cb.groundAt = (x, z) => {
    for (const s of xs) if (Math.abs(x - s.x) < s.road / 2) return 0;
    for (const s of zs) if (Math.abs(z - s.z) < s.road / 2 && x < openFrom) return 0;
    return curbH;
  };
  return { blocks, ext, inside, corner };
}

function barrierRow(cb, a0, a1, fixed, axis) {
  // planters & bollards across the street end
  const M = cb.mats;
  const n = Math.max(2, Math.round((a1 - a0) / 1.6));
  for (let k = 0; k <= n; k++) {
    const a = a0 + (a1 - a0) * k / n;
    const x = axis === 'x' ? a : fixed, z = axis === 'x' ? fixed : a;
    cb.batch.prim('cyl', M.metal, x, 0.5, z, 0.2, 1.0, 0.2, 0x2f3236);
    cb.batch.prim('sphere', M.metal, x, 1.0, z, 0.2, 0.12, 0.2, 0x2f3236);
  }
}

function markStreet(cb, s, axis, xs, zs, ext, mat, y) {
  // Center line for two-way streets, dashed lane lines for multi-lane one-way, crosswalk zebras.
  const along = axis === 'x' ? [ext.minZ, ext.maxZ] : [ext.minX, Math.min(ext.maxX, cb.layout.openFrom ?? Infinity)];
  const cross = axis === 'x' ? zs : xs;
  const fixed = axis === 'x' ? s.x : s.z;
  const segs = [];
  let p = along[0];
  const cuts = cross.map((c) => { const cc = axis === 'x' ? c.z : c.x; const hw = c.road / 2 + c.walk + 0.5; return [cc - hw, cc + hw]; }).sort((a, b) => a[0] - b[0]);
  for (const [c0, c1] of cuts) { if (c0 > p) segs.push([p, c0]); p = c1; }
  if (p < along[1]) segs.push([p, along[1]]);
  const dirs = s.dirs || [];
  const twoWay = dirs.includes(1) && dirs.includes(-1);
  const put = (a0, a1, off, w, color, dash = 0) => {
    const step = dash ? dash * 2 : a1 - a0;
    for (let a = a0; a < a1; a += step) {
      const b = Math.min(a1, a + (dash || a1 - a0));
      const len = b - a; if (len < 0.2) continue;
      const c = (a + b) / 2;
      if (axis === 'x') cb.batch.box(mat, fixed + off, y, c, w, 0.01, len, color);
      else cb.batch.box(mat, c, y, fixed + off, len, 0.01, w, color);
    }
  };
  for (const [a0, a1] of segs) {
    if (twoWay) { put(a0, a1, -0.1, 0.1, 0xd9b84a); put(a0, a1, 0.1, 0.1, 0xd9b84a); }
    const nLanes = s.laneCount || dirs.length;
    if (!twoWay && nLanes > 1) {
      const usable = s.road - (s.park?.[0] ? 2.4 : 0) - (s.park?.[1] ? 2.4 : 0);
      const start = -s.road / 2 + (s.park?.[0] ? 2.4 : 0);
      for (let k = 1; k < nLanes; k++) put(a0, a1, start + usable * k / nLanes, 0.12, 0xdedede, 3);
    }
    // edge lines near curbs
    put(a0, a1, -s.road / 2 + 0.3, 0.1, 0xcfcfcf);
    put(a0, a1, s.road / 2 - 0.3, 0.1, 0xcfcfcf);
  }
  // crosswalks at each intersection on this street (zebra across this road)
  if (s.crossings === false) return;
  for (const c of cross) {
    if (c.crossings === false) continue;
    const cc = axis === 'x' ? c.z : c.x;
    if (axis === 'z' && cc > (cb.layout.openFrom ?? Infinity)) continue;
    for (const sgn of [-1, 1]) {
      const pos = cc + sgn * (c.road / 2 + c.walk / 2);
      const stripes = Math.floor(s.road / 0.9);
      for (let k = 0; k < stripes; k++) {
        const o = -s.road / 2 + (k + 0.5) * s.road / stripes;
        if (axis === 'x') cb.batch.box(mat, fixed + o, y + 0.002, pos, 0.5, 0.01, 2.6, 0xe8e8e8);
        else cb.batch.box(mat, pos, y + 0.002, fixed + o, 2.6, 0.01, 0.5, 0xe8e8e8);
      }
      // stop line
      const sl = pos - sgn * 1.9;
      if (axis === 'x') cb.batch.box(mat, fixed, y + 0.002, sl, s.road - 0.6, 0.01, 0.35, 0xe0e0e0);
      else cb.batch.box(mat, sl, y + 0.002, fixed, 0.35, 0.01, s.road - 0.6, 0xe0e0e0);
    }
  }
}

function addLanes(cb, s, axis, crossStreets, ext) {
  // axis is the direction of travel ('x' for streets in zs)
  const dirs = s.dirs || [];
  if (!dirs.length) return;
  const fixed = axis === 'x' ? s.z : s.x;
  const parkL = s.park?.[0] ? 2.4 : 0, parkR = s.park?.[1] ? 2.4 : 0;
  const usable = s.road - parkL - parkR;
  const start = -s.road / 2 + parkL;
  const twoWay = dirs.includes(1) && dirs.includes(-1);
  const stops = crossStreets.map((c) => ({ c: axis === 'x' ? c.x : c.z, hw: c.road / 2 + c.walk / 2 + 2.2 }));
  const from = axis === 'x' ? ext.minX - 20 : ext.minZ - 20;
  const to = axis === 'x' ? ext.maxX + 20 : ext.maxZ + 20;
  const n = dirs.length;
  dirs.forEach((dir, k) => {
    let off;
    if (twoWay) {
      // right-hand traffic. Travelling +x the right side is +z; travelling -z the right side is +x.
      const nd = dirs.filter((d) => d === dir).length;
      const idx = dirs.slice(0, k).filter((d) => d === dir).length;
      const half = usable / 2;
      const sideSign = axis === 'x' ? dir : -dir;
      off = sideSign * (half * (idx + 0.5) / nd);
      off += (start + usable / 2);
    } else {
      off = start + usable * (k + 0.5) / n;
    }
    cb.lane({ axis, fixed: fixed + off, dir, from, to, stops, speed: s.speed || (s.road > 12 ? 11 : 8), kinds: s.kinds });
  });
}
