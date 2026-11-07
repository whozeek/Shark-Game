/* GeoWorld core: projection, loaded-area data model and the game-facing data API.
 *
 * COORDINATES (documented in GEO_API.md)
 *   Local metres, origin = the chosen lat/lon:  x = east, y = NORTH, z = up (metres above sea level).
 *   Derived from Web Mercator: x = (wx - wx0) * k,  y = -(wy - wy0) * k,  k = 40075016.686 m * cos(lat0),
 *   wx, wy being the normalised Web Mercator world coordinates (0..1). k includes the cos(lat0) scale correction, so one local metre is
 *   one real ground metre at the origin latitude (error well under 0.5% within 10 km up to about 60 degrees latitude).
 *   three.js position of a local point (x, y, z):  (x, z, -y).
 */
export const CIRC = 40075016.686, TZ = 14, EXT = 4096, EZ_DEFAULT = 12;
export const D2R = Math.PI / 180;
export const wxOf = lon => (lon + 180) / 360;
export const wyOf = lat => { const s = Math.sin(lat * D2R); return .5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI) };
export const lonOf = wx => wx * 360 - 180;
export const latOf = wy => { const n = Math.PI - 2 * Math.PI * wy; return Math.atan(.5 * (Math.exp(n) - Math.exp(-n))) / D2R };

export const GW = {
  origin: null, k: 1, wx0: 0, wy0: 0,
  opts: { proceduralFill: true, quality: 'standard', vExag: 1, ez: EZ_DEFAULT },
  tiles: new Map(),         // 'x,y' -> tile record (see tiles.js)
  elev: new Map(),          // 'x,y' (zoom ez) -> {h:Float32Array(65536)|null}
  buildings: [], roads: { nodes: [], edges: [], ways: [] }, places: [], peaks: [],
  _v: 0, _idxV: -1, _gV: -1,
  listeners: new Set(),
  status: { text: '', level: 'ok', source: 'none', pending: 0, loaded: 0, failed: 0 },
};

export function setOrigin(lat, lon) {
  GW.origin = { lat, lon }; GW.wx0 = wxOf(lon); GW.wy0 = wyOf(lat); GW.k = CIRC * Math.cos(lat * D2R);
}
export const toLocal = (lon, lat) => ({ x: (wxOf(lon) - GW.wx0) * GW.k, y: -(wyOf(lat) - GW.wy0) * GW.k });
export const toLonLat = (x, y) => ({ lon: lonOf(GW.wx0 + x / GW.k), lat: latOf(GW.wy0 - y / GW.k) });
export const tileSize = (z = TZ) => GW.k / Math.pow(2, z);
export const tileOfLocal = (x, y, z = TZ) => { const n = Math.pow(2, z); return { x: Math.floor((GW.wx0 + x / GW.k) * n), y: Math.floor((GW.wy0 - y / GW.k) * n) } };
export const tileOrigin = (tx, ty, z = TZ) => { const n = Math.pow(2, z); return { x: (tx / n - GW.wx0) * GW.k, y: -(ty / n - GW.wy0) * GW.k } };   // north-west corner, local metres
export const pxToLocal = (tx, ty, px, py) => { const o = tileOrigin(tx, ty), s = tileSize(); return [o.x + px / EXT * s, o.y - py / EXT * s] };

export function emit() { GW._v++; for (const f of GW.listeners) try { f(GW.status) } catch (e) { } }
export function setStatus(text, level, extra) { Object.assign(GW.status, { text, level: level || 'ok' }, extra || {}); emit() }

/* ---------- elevation ---------- */
/* Terrarium: elevation m = R*256 + G + B/256 - 32768 (Mapzen/Tilezen terrain tiles on AWS Open Data). Bilinear across loaded tiles. */
export function heightRaw(x, y) {
  const ez = GW.opts.ez, n = Math.pow(2, ez), wx = GW.wx0 + x / GW.k, wy = GW.wy0 - y / GW.k;
  const fx = wx * n * 256 - .5, fy = wy * n * 256 - .5, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
  const g = (px, py) => {
    const tx = Math.floor(px / 256), ty = Math.floor(py / 256), e = GW.elev.get(tx + ',' + ty);
    if (!e || !e.h) return NaN;
    return e.h[(py - ty * 256) * 256 + (px - tx * 256)];
  };
  let a = g(ix, iy), b = g(ix + 1, iy), c = g(ix, iy + 1), d = g(ix + 1, iy + 1);
  const any = [a, b, c, d].find(v => !isNaN(v));
  if (any === undefined) return NaN;
  if (isNaN(a)) a = any; if (isNaN(b)) b = any; if (isNaN(c)) c = any; if (isNaN(d)) d = any;
  return (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay;
}
/* terrain height in metres above sea level at local (x,y); never below 0 (the terrarium tiles carry sea-floor depths, which the game does not model) */
export function heightAt(x, y) { const h = heightRaw(x, y); return isNaN(h) ? 0 : Math.max(0, h) * GW.opts.vExag }

/* ---------- geometry helpers ---------- */
export function polyArea(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++)a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2 }   // CCW positive (y up)
export function pointInRing(r, x, y) { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins } return ins }
export function segPoint(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy; let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
  const x = ax + dx * t, y = ay + dy * t; return { d: Math.hypot(px - x, py - y), t, x, y };
}
export function hash2(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }

/* ---------- spatial index (uniform grid, rebuilt lazily when tiles change) ---------- */
const CELL = 50;
let bGrid = new Map(), eGrid = new Map();
function ensureIndex() {
  if (GW._idxV === GW._v) return; GW._idxV = GW._v;
  bGrid = new Map(); eGrid = new Map();
  const add = (m, k, v) => { const l = m.get(k); if (l) l.push(v); else m.set(k, [v]) };
  for (const b of GW.buildings) for (let cx = Math.floor(b.bbox[0] / CELL); cx <= Math.floor(b.bbox[2] / CELL); cx++)for (let cy = Math.floor(b.bbox[1] / CELL); cy <= Math.floor(b.bbox[3] / CELL); cy++)add(bGrid, cx + ',' + cy, b);
  ensureGraph();
  for (const e of GW.roads.edges) { const A = GW.roads.nodes[e.a], B = GW.roads.nodes[e.b]; for (let cx = Math.floor(Math.min(A.x, B.x) / CELL); cx <= Math.floor(Math.max(A.x, B.x) / CELL); cx++)for (let cy = Math.floor(Math.min(A.y, B.y) / CELL); cy <= Math.floor(Math.max(A.y, B.y) / CELL); cy++)add(eGrid, cx + ',' + cy, e) }
}

/* ---------- road graph ---------- */
const SNAP = 1.0;     // metres: vertices closer than this (rounded to a 1 m lattice) are the same node
export function ensureGraph() {
  if (GW._gV === GW._v) return; GW._gV = GW._v;
  const nodes = [], edges = [], ways = [], key = new Map();
  const node = (x, y) => {
    const kx = Math.round(x / SNAP), ky = Math.round(y / SNAP), k = kx + ',' + ky;
    let n = key.get(k); if (n) return n;
    n = { id: nodes.length, x, y, z: 0, adj: [] }; nodes.push(n); key.set(k, n); return n;
  };
  for (const t of GW.tiles.values()) {
    if (!t.ways) continue;
    for (const w of t.ways) {
      const ids = []; for (const p of w.pts) { const n = node(p[0], p[1]); if (ids[ids.length - 1] !== n.id) ids.push(n.id) }
      if (ids.length < 2) continue;
      const way = { id: ways.length, cls: w.cls, name: w.name, oneway: w.oneway, bridge: w.bridge, tunnel: w.tunnel, ramp: w.ramp, lanes: w.lanes, width: w.width, drivable: w.drivable, walkable: w.walkable, nodes: ids, pts: [] };
      ways.push(way);
      for (let i = 0; i + 1 < ids.length; i++) {
        const A = nodes[ids[i]], B = nodes[ids[i + 1]];
        const e = { id: edges.length, a: A.id, b: B.id, len: Math.hypot(A.x - B.x, A.y - B.y), cls: w.cls, name: w.name, oneway: w.oneway, bridge: w.bridge, tunnel: w.tunnel, lanes: w.lanes, width: w.width, way: way.id, drivable: w.drivable, walkable: w.walkable };
        edges.push(e); A.adj.push(e.id); B.adj.push(e.id);
      }
    }
  }
  // a road that ends on the side of another road (the tile geometry has no shared vertex there) becomes a junction: split the side road, join the end to it
  {
    const G = 25, grid = new Map(), TOL = 3.2;
    const reg = e => { const A = nodes[e.a], B = nodes[e.b]; for (let cx = Math.floor((Math.min(A.x, B.x) - TOL) / G); cx <= Math.floor((Math.max(A.x, B.x) + TOL) / G); cx++)for (let cy = Math.floor((Math.min(A.y, B.y) - TOL) / G); cy <= Math.floor((Math.max(A.y, B.y) + TOL) / G); cy++) { const k = cx + ',' + cy; (grid.get(k) || grid.set(k, []).get(k)).push(e.id) } };
    edges.forEach(reg);
    const ends = nodes.filter(n => n.adj.length === 1);
    for (const n of ends) {
      const own = edges[n.adj[0]]; let best = null;
      for (const id of grid.get(Math.floor(n.x / G) + ',' + Math.floor(n.y / G)) || []) {
        const e = edges[id]; if (e.a === n.id || e.b === n.id || e.way === own.way || e.tunnel !== own.tunnel) continue;
        if (!(own.drivable ? e.drivable : e.walkable)) continue;
        const A = nodes[e.a], B = nodes[e.b], h = segPoint(n.x, n.y, A.x, A.y, B.x, B.y); if (h.d <= TOL && (!best || h.d < best.d)) best = { e, h, d: h.d }
      }
      if (!best) continue;
      const e = best.e, A = nodes[e.a], B = nodes[e.b], len = e.len;
      let target;
      if (best.h.t * len < 2 && Math.hypot(A.x - n.x, A.y - n.y) <= TOL * 1.5) target = A; else if ((1 - best.h.t) * len < 2 && Math.hypot(B.x - n.x, B.y - n.y) <= TOL * 1.5) target = B;
      else {
        const m = { id: nodes.length, x: best.h.x, y: best.h.y, z: 0, adj: [] }; nodes.push(m);
        const e2 = Object.assign({}, e, { id: edges.length, a: m.id, b: B.id, len: len * (1 - best.h.t) }); e.b = m.id; e.len = len * best.h.t; edges.push(e2);
        B.adj[B.adj.indexOf(e.id)] = e2.id; m.adj.push(e.id, e2.id); target = m;
      }
      const d = Math.hypot(target.x - n.x, target.y - n.y);
      if (target !== n && d > .05) { const c = Object.assign({}, own, { id: edges.length, a: n.id, b: target.id, len: d }); edges.push(c); n.adj.push(c.id); target.adj.push(c.id) }
    }
  }
  // heights: terrain under each node; a bridge or tunnel node takes the mean of its two ends' terrain so decks stay level over valleys
  for (const n of nodes) n.z = heightAt(n.x, n.y);
  for (const w of ways) {
    if (w.bridge && w.nodes.length > 1) {
      const a = nodes[w.nodes[0]].z, b = nodes[w.nodes[w.nodes.length - 1]].z; let L = 0; const cum = [0];
      for (let i = 1; i < w.nodes.length; i++) { const P = nodes[w.nodes[i - 1]], Q = nodes[w.nodes[i]]; L += Math.hypot(P.x - Q.x, P.y - Q.y); cum.push(L) }
      for (let i = 1; i + 1 < w.nodes.length; i++) { const n = nodes[w.nodes[i]]; n.z = Math.max(n.z, a + (b - a) * (L ? cum[i] / L : 0)) + 0 }
    }
    w.pts = w.nodes.map(i => [nodes[i].x, nodes[i].y, nodes[i].z]);
  }
  GW.roads = { nodes, edges, ways };
}

/* ---------- queries ---------- */
export function nearbyBuildings(x, y, r) {
  ensureIndex(); const out = new Set(), x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
  for (let cx = x0; cx <= x1; cx++)for (let cy = y0; cy <= y1; cy++) { const l = bGrid.get(cx + ',' + cy); if (l) for (const b of l) if (x + r >= b.bbox[0] && x - r <= b.bbox[2] && y + r >= b.bbox[1] && y - r <= b.bbox[3]) out.add(b) }
  return [...out];
}
export function nearbyRoads(x, y, r) {
  ensureIndex(); const out = new Map(), x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL), N = GW.roads.nodes;
  for (let cx = x0; cx <= x1; cx++)for (let cy = y0; cy <= y1; cy++) { const l = eGrid.get(cx + ',' + cy); if (l) for (const e of l) { if (out.has(e.id)) continue; const A = N[e.a], B = N[e.b], h = segPoint(x, y, A.x, A.y, B.x, B.y); if (h.d <= r) out.set(e.id, { edge: e, dist: h.d, t: h.t, x: h.x, y: h.y, z: A.z + (B.z - A.z) * h.t }) } }
  return [...out.values()].sort((p, q) => p.dist - q.dist);
}
export function nearestRoad(x, y, maxR = 300, filt) {
  for (let r = 25; r <= maxR * 2; r *= 2) { const l = nearbyRoads(x, y, Math.min(r, maxR)).filter(h => !filt || filt(h.edge)); if (l.length) return l[0]; if (r >= maxR) break }
  return null;
}
export function pointInBuilding(x, y) {
  for (const b of nearbyBuildings(x, y, 0)) if (pointInRing(b.fp, x, y) && !b.holes.some(h => pointInRing(h, x, y))) return b;
  return null;
}
/* ground height used for walking: terrain, or the deck of a bridge you stand on */
export function groundAt(x, y) {
  let h = heightAt(x, y);
  for (const hit of nearbyRoads(x, y, 14)) { const e = hit.edge; if (e.bridge && hit.dist <= e.width / 2 + .5 && hit.z > h) h = hit.z }
  return h;
}

/* ---------- collision ---------- */
function circleVsRing(ring, px, py, r) {
  let best = 1e18, bx = 0, by = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const h = segPoint(px, py, ring[j][0], ring[j][1], ring[i][0], ring[i][1]); if (h.d < best) { best = h.d; bx = h.x; by = h.y } }
  return { d: best, x: bx, y: by };
}
/* Push a circle (x,y,r) out of every building footprint it overlaps. Buildings that only exist above head height (minHeight > 2.5 m) do not block. */
export function collideCircle(x, y, r) {
  let hit = null;
  for (let it = 0; it < 5; it++) {
    let moved = false;
    for (const b of nearbyBuildings(x, y, r)) {
      if (b.minHeight > 2.5) continue;
      const inside = pointInRing(b.fp, x, y) && !b.holes.some(h => pointInRing(h, x, y));
      let c = circleVsRing(b.fp, x, y, r);
      for (const h of b.holes) { const c2 = circleVsRing(h, x, y, r); if (c2.d < c.d) c = c2 }
      if (!inside && c.d >= r) continue;
      let nx, ny, depth;
      if (inside) { nx = c.x - x; ny = c.y - y; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; depth = c.d + r + .01 }
      else { nx = x - c.x; ny = y - c.y; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; depth = r - c.d + .01 }
      x += nx * depth; y += ny * depth; moved = true; hit = b;
    }
    if (!moved) break;
  }
  return { x, y, hit };
}
/* capsule from (ax,ay) to (bx,by) with radius r: returns the correction that moves the whole capsule out of the buildings */
export function collideCapsule(ax, ay, bx, by, r) {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / Math.max(.3, r))); let dx = 0, dy = 0, hit = null;
  for (let i = 0; i <= n; i++) { const t = i / n, p = collideCircle(ax + (bx - ax) * t + dx, ay + (by - ay) * t + dy, r); if (p.hit) { dx = p.x - (ax + (bx - ax) * t); dy = p.y - (ay + (by - ay) * t); hit = p.hit } }
  return { dx, dy, hit };
}

/* ---------- ray casts ---------- */
/* 2D: first building footprint crossed by the segment (x0,y0)->(x1,y1) */
export function raycast2D(x0, y0, x1, y1) {
  const L = Math.hypot(x1 - x0, y1 - y0), cand = nearbyBuildings((x0 + x1) / 2, (y0 + y1) / 2, L / 2 + 2); let best = null;
  for (const b of cand) {
    const rings = [b.fp].concat(b.holes);
    for (const ring of rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const A = ring[j], B = ring[i], d1x = x1 - x0, d1y = y1 - y0, d2x = B[0] - A[0], d2y = B[1] - A[1], den = d1x * d2y - d1y * d2x; if (Math.abs(den) < 1e-9) continue;
      const t = ((A[0] - x0) * d2y - (A[1] - y0) * d2x) / den, u = ((A[0] - x0) * d1y - (A[1] - y0) * d1x) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1 && (!best || t < best.t)) best = { building: b, t, x: x0 + d1x * t, y: y0 + d1y * t, dist: t * L };
    }
    if (!best && pointInRing(b.fp, x0, y0)) best = { building: b, t: 0, x: x0, y: y0, dist: 0 };
  }
  return best;
}
/* 3D: march a ray (origin o = {x,y,z}, direction d = {x,y,z}, normalised) against terrain and buildings. Returns {kind:'terrain'|'building', x,y,z, dist, building?} or null. */
export function raycast(o, d, maxDist = 500, step = 1) {
  let px = o.x, py = o.y, pz = o.z;
  for (let t = 0; t <= maxDist; t += step) {
    px = o.x + d.x * t; py = o.y + d.y * t; pz = o.z + d.z * t;
    const g = heightAt(px, py); if (pz <= g) return { kind: 'terrain', x: px, y: py, z: pz, dist: t };
    const b = pointInBuilding(px, py); if (b && pz <= g + b.height && pz >= g + b.minHeight) return { kind: 'building', x: px, y: py, z: pz, dist: t, building: b };
  }
  return null;
}

/* ---------- navigation: A* over the road graph ---------- */
class Heap { constructor() { this.a = [] } get n() { return this.a.length } push(k, v) { const a = this.a; a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break;[a[p], a[i]] = [a[i], a[p]]; i = p } } pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (; ;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break;[a[m], a[i]] = [a[i], a[m]]; i = m } } return top } }
const SPEEDK = { motorway: 1.0, trunk: .95, primary: .85, secondary: .75, tertiary: .65, minor: .55, service: .4, path: .3 };
/* route(from, to, {mode:'drive'|'walk', maxSnap}) with from/to {x,y}. Snaps to the nearest road node. Respects one-way streets when driving.
 * returns {ok, length, nodes:[nodeId...], points:[{x,y,z}...], from:{node,dist}, to:{node,dist}, reason?} */
export function route(from, to, o = {}) {
  ensureGraph(); const mode = o.mode || 'drive', N = GW.roads.nodes, E = GW.roads.edges, maxSnap = o.maxSnap || 400;
  const ok = e => mode === 'walk' ? e.walkable : e.drivable;
  const snap = p => { let best = null, bd = maxSnap; for (const h of nearbyRoads(p.x, p.y, maxSnap)) { if (!ok(h.edge)) continue; for (const id of [h.edge.a, h.edge.b]) { const d = Math.hypot(N[id].x - p.x, N[id].y - p.y); if (d < bd) { bd = d; best = id } } if (best !== null && h.dist > bd) break } return best === null ? null : { node: best, dist: bd } };
  const s = snap(from), g = snap(to);
  if (!s || !g) return { ok: false, reason: !s ? 'start is not near a usable road' : 'destination is not near a usable road' };
  const dist = new Map([[s.node, 0]]), prev = new Map(), H = new Heap(), done = new Set(), T = N[g.node];
  H.push(0, s.node);
  while (H.n) {
    const [, u] = H.pop(); if (done.has(u)) continue; done.add(u); if (u === g.node) break;
    const U = N[u];
    for (const ei of U.adj) {
      const e = E[ei]; if (!ok(e)) continue;
      const v = e.a === u ? e.b : e.a;
      if (mode === 'drive' && e.oneway) { if (e.oneway > 0 && e.a !== u) continue; if (e.oneway < 0 && e.b !== u) continue }
      const w = e.len / (mode === 'walk' ? 1 : (SPEEDK[e.cls] || .5));
      const nd = dist.get(u) + w; if (nd < (dist.has(v) ? dist.get(v) : 1e18)) { dist.set(v, nd); prev.set(v, u); const V = N[v]; H.push(nd + Math.hypot(V.x - T.x, V.y - T.y) * (mode === 'walk' ? 1 : .8), v) }
    }
  }
  if (!done.has(g.node)) return { ok: false, reason: 'no connected route found', from: s, to: g };
  const ids = [g.node]; while (ids[0] !== s.node) ids.unshift(prev.get(ids[0]));
  let length = 0; for (let i = 1; i < ids.length; i++)length += Math.hypot(N[ids[i]].x - N[ids[i - 1]].x, N[ids[i]].y - N[ids[i - 1]].y);
  return { ok: true, length, nodes: ids, points: ids.map(i => ({ x: N[i].x, y: N[i].y, z: N[i].z })), from: s, to: g };
}

/* ---------- convert the loaded area into the bus game's free-form district format ('ff', see ffGraph in rush-hour-routes.html) ----------
 * radius: half-size of the square window in metres (default 1250 => about 2.5 km across). Returns {ff, stats} or null if there are too few roads. */
export function toFreeForm(cx, cy, radius = 1250) {
  ensureGraph();
  const x0 = cx - radius, x1 = cx + radius, y0 = cy - radius, y1 = cy + radius, W = x1 - x0;
  const inside = p => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
  const cls = c => ({ motorway: 'm', trunk: 'm', primary: 'a', secondary: 'a', tertiary: 's', minor: 's', service: null }[c] || null);
  const loc = p => [Math.round((p[0] - x0) * 10) / 10, Math.round((y1 - p[1]) * 10) / 10];
  const roads = []; let nm = 0, na = 0, ns = 0;
  const minorAllowed = GW.roads.ways.filter(w => w.cls === 'minor').length < 3000;
  for (const w of GW.roads.ways) {
    const c = cls(w.cls); if (!c || w.tunnel || !w.drivable) continue; if (c === 's' && !minorAllowed && w.cls === 'minor' && !w.name) continue;
    let run = [];
    const flush = () => { if (run.length > 1) { roads.push([w.name || '', c, run.map(loc), w.bridge ? { br: 1 } : {}]); if (c === 'm') nm++; else if (c === 'a') na++; else ns++ } run = [] };
    for (const p of w.pts) { if (inside(p)) run.push(p); else flush() } flush();
  }
  if (roads.length < 6) return null;
  const clipPoly = (ring) => { const o = ring.map(loc); return o.map(p => [Math.max(-20, Math.min(W + 20, p[0])), Math.max(-20, Math.min(W + 20, p[1]))]) };
  const water = [], parks = [], zones = [];
  for (const t of GW.tiles.values()) {
    for (const p of (t.waterPolys || [])) { if (p.some(inside)) water.push(clipPoly(p)) }
    for (const p of (t.parkPolys || [])) { if (p.some(inside)) parks.push(clipPoly(p)) }
    for (const p of (t.bizPolys || [])) { if (p.some(inside)) zones.push(['B', clipPoly(p)]) }
  }
  return { ff: { m: [Math.round(W), Math.round(W)], sc: .6, src: 'osm', roads, water: water.slice(0, 60), parks: parks.slice(0, 60), zones: zones.slice(0, 60), poi: [] }, stats: { roads: roads.length, motorway: nm, arterial: na, street: ns, water: water.length, parks: parks.length, zones: zones.length } };
}
