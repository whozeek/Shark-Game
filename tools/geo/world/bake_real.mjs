// Bake the REAL Bridgeport map section used by the Connecticut campaign's first level ("Bridgeport · Downtown (real map)").
// usage: node bake_real.mjs <dir with v_<x>_<y>.pbf zoom-14 OpenFreeMap tiles> [--stats]   -> writes tools/geo/real_bridgeport.b64 and tools/geo/real_bridgeport.json (readable copy)
// Source: OpenFreeMap planet tiles (OpenStreetMap data, ODbL). Everything is reduced to a 7 x 7 grid of 500 m "sectors" (3.5 km square); the game reveals the sectors one by one.
// Frame: x east, y SOUTH, metres from the north-west corner. Roads are a planar graph cut at every sector border, simplified and thinned per sector (node budget); buildings are
// oriented boxes (plus simplified polygons for large footprints); water, parks and woods are polygons clipped to their sector. See DATA_SOURCES.md section 6.
import fs from 'fs'; import zlib from 'zlib'; import path from 'path'; import { fileURLToPath } from 'url';
import Pbf from 'pbf'; import { VectorTile } from '@mapbox/vector-tile';
import { decodeMVT, extractTile } from './data.js';
import { GW, setOrigin, tileOrigin, tileSize, EXT, toLonLat } from './core.js';

const here = path.dirname(fileURLToPath(import.meta.url)), outDir = path.resolve(here, '..');
const dir = process.argv[2];
const LAT0 = 41.1771, LON0 = -73.1924;            // the start point (local origin): between Lafayette Boulevard, State Street and Fairfield Avenue in downtown Bridgeport
const SEC = 500, NX = 12, NY = 10, X0 = -3700, Y1 = 2250;   // frame: 3.5 km square, 1750 m west of the start, 2250 m north of it (1250 m south: the harbour)
const STARTS = JSON.parse(process.env.STARTS || '[{"key":"br","c":3,"r":8,"bud":[24,16,10],"cap":[50,40,30]},{"key":"dt","c":7,"r":4,"bud":[50,22,12],"cap":[100,70,50]}]');   // start sectors (centres of the 3x3 opening squares); budgets are generous near any of them                      // the start sector; the first level opens this sector and its 8 neighbours
const FW = NX * SEC, FH = NY * SEC;
setOrigin(LAT0, LON0); GW.opts.proceduralFill = false; GW.opts.quality = 'standard';
const fr = (x, y) => [x - X0, Y1 - y];             // local metres (y north) -> frame metres (y south)

// ---------------------------------------------------------------- read tiles
const roadsRaw = [], bRaw = [], water = [], parks = [], woods = [], pois = [], placeNames = [];
const polyOf = (r, O, k) => { const p = []; for (let i = 0; i < r.length; i += 2) p.push(fr(O.x + r[i] * k, O.y - r[i + 1] * k)); return p };
for (const f of fs.readdirSync(dir).sort()) {
  const m = /^v_(\d+)_(\d+)\.pbf$/.exec(f); if (!m) continue; const tx = +m[1], ty = +m[2];
  const bytes = new Uint8Array(fs.readFileSync(path.join(dir, f)));
  const norm = decodeMVT(bytes), T = extractTile(norm, tx, ty), O = tileOrigin(tx, ty), k = tileSize() / EXT;
  for (const w of T.ways) roadsRaw.push({ cls: w.cls, name: w.name, br: w.bridge, tn: w.tunnel, ramp: w.ramp, drv: w.drivable, pts: w.pts.map(p => fr(p[0], p[1])) });
  for (const b of T.buildings) bRaw.push({ fp: b.fp.map(p => fr(p[0], p[1])), h: b.height, known: b.heightSource === 'osm' });
  for (const p of T.waterPolys) water.push(p.map(q => fr(q[0], q[1])));
  for (const p of T.parkPolys) parks.push(p.map(q => fr(q[0], q[1])));
  const outer = r => { let a = 0; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)a += (r[j] - r[i]) * (r[j + 1] + r[i + 1]); return a > 0 };   // outer rings (pixel y down)
  for (const f2 of norm.l.landcover || []) if (f2.t === 3) { const c = f2.p.class, sc = f2.p.subclass; for (const r of f2.g) { if (r.length < 8 || !outer(r)) continue; if (c === 'wood' || c === 'wetland') woods.push(polyOf(r, O, k)); else if (c === 'grass' && sc !== 'garden') parks.push(polyOf(r, O, k)) } }
  for (const f2 of norm.l.landuse || []) if (f2.t === 3 && (f2.p.class === 'cemetery' || f2.p.class === 'playground' || f2.p.class === 'pitch')) for (const r of f2.g) { if (r.length >= 8 && outer(r)) parks.push(polyOf(r, O, k)) }
  // points of interest (names), straight from the tile
  const vt = new VectorTile(new Pbf(bytes)), PL = vt.layers.poi;
  if (PL) for (let i = 0; i < PL.length; i++) { const ft = PL.feature(i), p = ft.properties; if (!p.name) continue; const g = ft.loadGeometry()[0][0]; const q = fr(O.x + g.x * k, O.y - g.y * k); pois.push({ cls: p.class, sub: p.subclass, name: p.name, x: q[0], y: q[1] }) }
  for (const pl of T.places) placeNames.push(pl);
}
console.log('read', { roads: roadsRaw.length, buildings: bRaw.length, water: water.length, parks: parks.length, woods: woods.length, pois: pois.length });

// ---------------------------------------------------------------- geometry helpers
const inFrame = (x, y) => x >= 0 && x <= FW && y >= 0 && y <= FH;
function clipLine(pts) {   // split a polyline at the frame border, keep the inside parts
  const out = []; let cur = [];
  const cross = (a, b) => { // the point where segment a-b meets the frame border (a inside, b outside or vice versa)
    let t = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
    for (const [v, d, lim] of [[a[0], dx, 0], [a[0], dx, FW], [a[1], dy, 0], [a[1], dy, FH]]) { if (d === 0) continue; const tt = (lim - v) / d; if (tt > 1e-9 && tt < t) { const x = a[0] + dx * tt, y = a[1] + dy * tt; if (x >= -1e-6 && x <= FW + 1e-6 && y >= -1e-6 && y <= FH + 1e-6) t = tt } }
    return [a[0] + dx * t, a[1] + dy * t];
  };
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], ins = inFrame(p[0], p[1]);
    if (i === 0) { if (ins) cur.push(p); continue }
    const q = pts[i - 1], qin = inFrame(q[0], q[1]);
    if (ins && qin) cur.push(p);
    else if (ins && !qin) { cur = [cross(p, q), p] }
    else if (!ins && qin) { cur.push(cross(q, p)); if (cur.length > 1) out.push(cur); cur = [] }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}
function dp(pts, tol) {   // Douglas-Peucker
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1; const A = pts[a], B = pts[b], dx = B[0] - A[0], dy = B[1] - A[1], l2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) { const P = pts[i]; let t = l2 ? ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); const d = Math.hypot(P[0] - A[0] - dx * t, P[1] - A[1] - dy * t); if (d > md) { md = d; mi = i } }
    if (md > tol && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]) }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++)a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2 };
const pip = (r, x, y) => { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins } return ins };
function clipPoly(poly, x0, y0, x1, y1) {   // Sutherland-Hodgman against an axis-aligned rectangle
  let p = poly;
  const edges = [[0, x0, 1], [0, x1, -1], [1, y0, 1], [1, y1, -1]];
  for (const [ax, lim, sg] of edges) {
    const o = [], inside = q => sg * (q[ax] - lim) >= 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length], ia = inside(a), ib = inside(b);
      const isect = () => { const t = (lim - a[ax]) / (b[ax] - a[ax]); return ax === 0 ? [lim, a[1] + (b[1] - a[1]) * t] : [a[0] + (b[0] - a[0]) * t, lim] };
      if (ia && ib) o.push(b); else if (ia && !ib) o.push(isect()); else if (!ia && ib) { o.push(isect()); o.push(b) }
    }
    p = o; if (!p.length) break;
  }
  return p;
}
const secOf = (x, y) => { const c = Math.max(0, Math.min(NX - 1, Math.floor(x / SEC))), r = Math.max(0, Math.min(NY - 1, Math.floor(y / SEC))); return r * NX + c };
const secNear = s => { let best = null; for (const t of STARTS) { const d = Math.max(Math.abs((s % NX) - t.c), Math.abs(Math.floor(s / NX) - t.r)); if (!best || d < best.d) best = { d, t } } return best };
const BUDs = s => { const n = secNear(s); return n.t.bud[Math.min(2, Math.max(0, n.d - 0 > 1 ? n.d - 1 : 0))] };
const CAPs = s => { const n = secNear(s); return n.t.cap[Math.min(2, Math.max(0, n.d > 1 ? n.d - 1 : 0))] };
const secDist = s => Math.min(...STARTS.map(t => Math.max(Math.abs((s % NX) - t.c), Math.abs(Math.floor(s / NX) - t.r))));
const hash = (a, b) => { let h = (Math.round(a) * 374761393 + Math.round(b) * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 };

// ---------------------------------------------------------------- roads -> planar graph
const CMAP = { motorway: 'm', trunk: 'm', primary: 'a', secondary: 'a', tertiary: 's', minor: 's' };
const RANK = { m: 0, a: 1, s: 2 };
let ways = [];
for (const w of roadsRaw) {
  if (w.tn || !w.drv) continue; let c = CMAP[w.cls]; if (!c) continue; if (w.ramp && c === 'm') c = 'a';
  for (const part of clipLine(w.pts)) ways.push({ cls: c, name: w.name || '', br: !!w.br, pts: part.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]) });
}
// dual carriageways (I-95, divided boulevards) are two parallel ways in OpenStreetMap; the game has single roads, so keep one of each parallel pair:
// every piece looks for a parallel piece of the same class (and name) within 55 m (30 m for boulevards); if that partner lies on the +side of a fixed reference axis, the piece is dropped
{
  const G = 80, grid = new Map(), RX = 1, RY = -.5; let dropped = 0;
  const axis = (A, B) => { let dx = B[0] - A[0], dy = B[1] - A[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; if (dx * RX + dy * RY < 0) { dx = -dx; dy = -dy } return [dx, dy] };
  const dual = w => w.cls === 'm' || (w.cls === 'a' && w.name);
  ways.forEach((w, wi) => { if (!dual(w)) return; for (let i = 0; i + 1 < w.pts.length; i++) { const A = w.pts[i], B = w.pts[i + 1], o = { A, B, wi, cls: w.cls, name: w.name, ax: axis(A, B) }; for (let a = Math.floor((Math.min(A[0], B[0]) - 60) / G); a <= Math.floor((Math.max(A[0], B[0]) + 60) / G); a++)for (let b = Math.floor((Math.min(A[1], B[1]) - 60) / G); b <= Math.floor((Math.max(A[1], B[1]) + 60) / G); b++) { const k = a + ',' + b; (grid.get(k) || grid.set(k, []).get(k)).push(o) } } });
  const keep = [];
  ways.forEach((w, wi) => {
    if (!dual(w)) { keep.push(w); return }
    const R = w.cls === 'm' ? 55 : 30; let side = 0, tot = 0;
    for (let i = 0; i + 1 < w.pts.length; i++) {
      const A = w.pts[i], B = w.pts[i + 1], L = Math.hypot(B[0] - A[0], B[1] - A[1]), ax = axis(A, B), n = Math.max(1, Math.floor(L / 12));
      for (let t = 0; t < n; t++) {
        const f = (t + .5) / n, x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f; tot++;
        let best = null, bd = R; for (const o of grid.get(Math.floor(x / G) + ',' + Math.floor(y / G)) || []) { if (o.wi === wi || o.cls !== w.cls || (w.cls === 'a' && o.name !== w.name)) continue; if (Math.abs(o.ax[0] * ax[0] + o.ax[1] * ax[1]) < .9) continue; const dx = o.B[0] - o.A[0], dy = o.B[1] - o.A[1], l2 = dx * dx + dy * dy; let u = l2 ? ((x - o.A[0]) * dx + (y - o.A[1]) * dy) / l2 : 0; u = Math.max(0, Math.min(1, u)); const px = o.A[0] + dx * u, py = o.A[1] + dy * u, d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; best = [px - x, py - y] } }
        if (best && best[0] * -ax[1] + best[1] * ax[0] > 0) side++;
      }
    }
    if (tot && side / tot > .6) { dropped++; return }
    keep.push(w);
  });
  console.log('parallel carriageways dropped', dropped, 'of', ways.length); ways = keep;
}
// a dead end that stops within 3.5 m of another road's side becomes a junction on that road
{
  const G = 50, grid = new Map(), seg = [];
  ways.forEach((w, wi) => { for (let i = 0; i + 1 < w.pts.length; i++) { const A = w.pts[i], B = w.pts[i + 1]; seg.push([wi, i]); const id = seg.length - 1; for (let a = Math.floor((Math.min(A[0], B[0]) - 4) / G); a <= Math.floor((Math.max(A[0], B[0]) + 4) / G); a++)for (let b = Math.floor((Math.min(A[1], B[1]) - 4) / G); b <= Math.floor((Math.max(A[1], B[1]) + 4) / G); b++) { const k = a + ',' + b; (grid.get(k) || grid.set(k, []).get(k)).push(id) } } });
  const key = p => Math.round(p[0] * 10) + ',' + Math.round(p[1] * 10), cnt = new Map();
  for (const w of ways) for (const p of w.pts) cnt.set(key(p), (cnt.get(key(p)) || 0) + 1);
  const ins = new Map(); let snapped = 0;
  ways.forEach((w, wi) => {
    for (const end of [0, w.pts.length - 1]) {
      const P = w.pts[end]; if (cnt.get(key(P)) > 1) continue;
      let best = null; const l = grid.get(Math.floor(P[0] / G) + ',' + Math.floor(P[1] / G)) || [];
      for (const id of l) { const [wj, i] = seg[id]; if (wj === wi) continue; const A = ways[wj].pts[i], B = ways[wj].pts[i + 1]; const dx = B[0] - A[0], dy = B[1] - A[1], l2 = dx * dx + dy * dy; if (!l2) continue; let t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / l2; if (t <= .02 || t >= .98) continue; const d = Math.hypot(P[0] - A[0] - dx * t, P[1] - A[1] - dy * t); if (d < (w.cls === 'a' && !w.name && ways[wj].cls === 'm' ? 32 : 3.5) && (!best || d < best.d)) best = { d, wj, i, t, x: Math.round((A[0] + dx * t) * 10) / 10, y: Math.round((A[1] + dy * t) * 10) / 10 } }
      if (best) { w.pts[end] = [best.x, best.y]; const k = best.wj + '.' + best.i; (ins.get(k) || ins.set(k, []).get(k)).push({ t: best.t, p: [best.x, best.y] }); snapped++ }
    }
  });
  ways.forEach((w, wi) => { const np = []; for (let i = 0; i < w.pts.length; i++) { np.push(w.pts[i]); const l = ins.get(wi + '.' + i); if (l) { l.sort((a, b) => a.t - b.t); for (const q of l) np.push(q.p) } } w.pts = np });
  console.log('T-junctions snapped', snapped);
}
// nodes = way ends and vertices shared by two ways; edges = pieces between nodes
const K = p => Math.round(p[0] * 10) + ',' + Math.round(p[1] * 10);
let edges = [];
{
  const cnt = new Map(); for (const w of ways) for (const p of w.pts) cnt.set(K(p), (cnt.get(K(p)) || 0) + 1);
  const seen = new Set();
  for (const w of ways) {
    let cur = [w.pts[0]];
    for (let i = 1; i < w.pts.length; i++) {
      const p = w.pts[i]; cur.push(p);
      if (i === w.pts.length - 1 || cnt.get(K(p)) > 1) {
        const a = K(cur[0]), b = K(cur[cur.length - 1]);
        if (a !== b) { const k = a < b ? a + '|' + b + '|' + cur.length : b + '|' + a + '|' + cur.length; if (!seen.has(k)) { seen.add(k); edges.push({ a, b, cls: w.cls, name: w.name, br: w.br, pts: cur }) } }
        cur = [p];
      }
    }
  }
}
const largest = es => { // keep the biggest connected piece
  const adj = new Map(); es.forEach((e, i) => { for (const n of [e.a, e.b]) (adj.get(n) || adj.set(n, []).get(n)).push(i) });
  const comp = new Map(); let best = null;
  for (const n of adj.keys()) { if (comp.has(n)) continue; const st = [n], mem = [n]; comp.set(n, n); while (st.length) { const x = st.pop(); for (const i of adj.get(x)) { const y = es[i].a === x ? es[i].b : es[i].a; if (!comp.has(y)) { comp.set(y, n); st.push(y); mem.push(y) } } } if (!best || mem.length > best.length) best = mem }
  const ok = new Set(best); return es.filter(e => ok.has(e.a) && ok.has(e.b));
};
edges = largest(edges);
console.log('graph before thinning: edges', edges.length);
// cut every edge at the sector borders (so each piece lies inside exactly one sector), then simplify each piece; sectors over their node budget get a coarser tolerance
const nodeOf = new Map(); const getNode = p => { const k = K(p); if (!nodeOf.has(k)) nodeOf.set(k, { x: Math.round(p[0]), y: Math.round(p[1]) }); return k };
let E2 = [];
for (const e of edges) {
  const pts = e.pts.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
  const pieces = []; let cur = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const A = pts[i - 1], B = pts[i], ts = [];
    for (let g = 1; g < NX; g++) { const v = g * SEC; if ((A[0] - v) * (B[0] - v) < 0) ts.push((v - A[0]) / (B[0] - A[0])) }
    for (let g = 1; g < NY; g++) { const v = g * SEC; if ((A[1] - v) * (B[1] - v) < 0) ts.push((v - A[1]) / (B[1] - A[1])) }
    ts.sort((a, b) => a - b);
    for (const t of ts) { const x = Math.round(A[0] + (B[0] - A[0]) * t), y = Math.round(A[1] + (B[1] - A[1]) * t); cur.push([x, y]); pieces.push(cur); cur = [[x, y]] }
    cur.push(B);
  }
  pieces.push(cur);
  for (const pc of pieces) { const p0 = [Math.round(pc[0][0]), Math.round(pc[0][1])], p1 = [Math.round(pc[pc.length - 1][0]), Math.round(pc[pc.length - 1][1])]; const mid = [(pc[0][0] + pc[pc.length - 1][0]) / 2, (pc[0][1] + pc[pc.length - 1][1]) / 2]; const a = getNode(p0), b = getNode(p1); if (a === b) continue; E2.push({ a, b, cls: e.cls, name: e.name, br: e.br, raw: pc.slice(1, -1), sec: secOf(mid[0], mid[1]) }) }
}
const tolS = new Array(NX * NY).fill(1);   // coarseness factor per sector
function simplifyAll() {
  for (const e of E2) {
    const A = nodeOf.get(e.a), B = nodeOf.get(e.b), t = tolS[e.sec] * (e.cls === 'm' ? 3 : e.cls === 'a' ? 3.5 : 5), sp = 26 * Math.max(1, tolS[e.sec] * .9);
    const pts = dp([[A.x, A.y], ...e.raw, [B.x, B.y]], t), q = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) if (Math.hypot(pts[i][0] - q[q.length - 1][0], pts[i][1] - q[q.length - 1][1]) >= sp && Math.hypot(pts[i][0] - B.x, pts[i][1] - B.y) >= sp * .55) q.push(pts[i]);
    e.inner = q.slice(1).map(p => [Math.round(p[0]), Math.round(p[1])]);
  }
}
// drop duplicates (same end nodes) keeping the better class
{ const m = new Map(); for (const e of E2) { const k = e.a < e.b ? e.a + '|' + e.b : e.b + '|' + e.a; const o = m.get(k); if (!o || RANK[e.cls] < RANK[o.cls] || (RANK[e.cls] === RANK[o.cls] && e.raw.length > o.raw.length)) m.set(k, e) } E2 = [...m.values()] }
const costOf = () => { const c = new Array(NX * NY).fill(0); for (const e of E2) c[e.sec] += e.inner.length + 1; return c };
simplifyAll();
for (let it = 0; it < 6; it++) { const c = costOf(); let ch = false; for (let s = 0; s < NX * NY; s++) if (c[s] > BUDs(s) * 1.15 && tolS[s] < 3.2) { tolS[s] *= 1.45; ch = true } if (!ch) break; simplifyAll() }
const eLen = e => { const pts = [nodeOf.get(e.a), ...e.inner.map(p => ({ x: p[0], y: p[1] })), nodeOf.get(e.b)]; let l = 0; for (let i = 1; i < pts.length; i++)l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return l };
E2.forEach(e => e.len = eLen(e));

// ---------------------------------------------------------------- thin to the per-sector node budget
const bridges = () => { // edges whose removal splits the graph (Tarjan on the multigraph)
  const adj = new Map(); E2.forEach((e, i) => { for (const n of [e.a, e.b]) (adj.get(n) || adj.set(n, []).get(n)).push([e.a === n ? e.b : e.a, i]) });
  const disc = new Map(), low = new Map(), out = new Set(); let t = 0;
  for (const root of adj.keys()) { if (disc.has(root)) continue; const st = [[root, -1, 0]]; disc.set(root, ++t); low.set(root, t);
    while (st.length) { const f = st[st.length - 1], [u, pe] = f, l = adj.get(u); if (f[2] < l.length) { const [v, ei] = l[f[2]++]; if (ei === pe) continue; if (!disc.has(v)) { disc.set(v, ++t); low.set(v, t); st.push([v, ei, 0]) } else low.set(u, Math.min(low.get(u), disc.get(v))) } else { st.pop(); if (st.length) { const p = st[st.length - 1][0]; low.set(p, Math.min(low.get(p), low.get(u))); if (low.get(u) > disc.get(p)) out.add(pe) } } } }
  return out;
};
{
  let removed = 0;
  for (let guard = 0; guard < 4000; guard++) {
    const cost = costOf(), deg = new Map(); for (const e of E2) { deg.set(e.a, (deg.get(e.a) || 0) + 1); deg.set(e.b, (deg.get(e.b) || 0) + 1) }
    const br = bridges(), bset = new Set([...br].map(i => E2[i])), drop = new Set();
    for (let s = 0; s < NX * NY; s++) {
      if (cost[s] <= BUDs(s)) continue;
      // streets first (dead ends, then short ones); arterial spurs (dead ends only) when nothing else is left; an edge that holds the graph together stays
      const cand = E2.filter(e => e.sec === s && ((e.cls === 's') || (e.cls === 'a' && ((deg.get(e.a) === 1 || deg.get(e.b) === 1) && e.len < 220 || (cost[s] > BUDs(s) * 1.2 && !bset.has(e)))))).map(e => ({ e, leaf: (deg.get(e.a) === 1 || deg.get(e.b) === 1) ? 0 : 1 }))
        .filter(c => !(bset.has(c.e) && c.leaf)).sort((p, q) => (p.e.cls === q.e.cls ? 0 : p.e.cls === 's' ? -1 : 1) || p.leaf - q.leaf || p.e.len - q.e.len);
      if (cand.length) drop.add(cand[0].e);
    }
    if (!drop.size) break; removed += drop.size; E2 = E2.filter(e => !drop.has(e));
  }
  console.log('thinned: removed', removed, 'edges');
}
E2 = largest(E2);
// compact ids, order by sector then position
E2.sort((p, q) => p.sec - q.sec || (nodeOf.get(p.a).y - nodeOf.get(q.a).y) || (nodeOf.get(p.a).x - nodeOf.get(q.a).x));
const used = new Map(), nodeList = []; const nid = k => { if (!used.has(k)) { used.set(k, nodeList.length); nodeList.push(nodeOf.get(k)) } return used.get(k) };
const nameTab = [''], nameIdx = new Map([['', 0]]); const nameId = n => { if (!nameIdx.has(n)) { nameIdx.set(n, nameTab.length); nameTab.push(n) } return nameIdx.get(n) };
const edgeOut = E2.map(e => ({ a: nid(e.a), b: nid(e.b), c: RANK[e.cls], br: e.br ? 1 : 0, n: nameId(e.name), s: e.sec, p: e.inner }));
const totalGameNodes = nodeList.length + edgeOut.reduce((a, e) => a + e.p.length, 0);
console.log('roads: nodes', nodeList.length, 'edges', edgeOut.length, 'game nodes (graph + shape points)', totalGameNodes);
const perSec = new Array(NX * NY).fill(0); for (const e of edgeOut) perSec[e.s] += e.p.length + 1;
// bridge flag: also set when the middle of an edge lies in water
for (const e of edgeOut) { if (e.br) continue; const A = nodeList[e.a], B = nodeList[e.b], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2; let w = false; for (const p of water) if (p.length > 2 && pip(p, mx, my)) w = true; if (w) e.br = 1 }

// ---------------------------------------------------------------- polygons (water, parks, woods) clipped per sector
const polys = { w: Array.from({ length: NX * NY }, () => []), p: Array.from({ length: NX * NY }, () => []), z: Array.from({ length: NX * NY }, () => []) };
function addPolys(list, key, tol, minArea) {
  for (const raw of list) {
    let p = raw; if (p.length < 3) continue; p = dp(p.concat([p[0]]), tol).slice(0, -1); if (p.length < 3) continue;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of p) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]) }
    if (x1 < 0 || y1 < 0 || x0 > FW || y0 > FH) continue;
    for (let r = Math.max(0, Math.floor(y0 / SEC)); r <= Math.min(NY - 1, Math.floor(y1 / SEC)); r++)for (let c = Math.max(0, Math.floor(x0 / SEC)); c <= Math.min(NX - 1, Math.floor(x1 / SEC)); c++) {
      const cp = clipPoly(p, c * SEC, r * SEC, (c + 1) * SEC, (r + 1) * SEC); if (cp.length < 3) continue;
      if (Math.abs(area(cp)) < minArea) continue;
      polys[key][r * NX + c].push(cp.map(q => [Math.round(q[0]), Math.round(q[1])]));
    }
  }
}
addPolys(water, 'w', 4, 300); addPolys(parks, 'p', 4, 1800); addPolys(woods, 'z', 6, 4000);
// the sea: the OpenMapTiles water polygons already contain Long Island Sound
for (const k of ['w', 'p', 'z']) console.log('polygons', k, polys[k].reduce((a, l) => a + l.length, 0), 'points', polys[k].reduce((a, l) => a + l.reduce((b, p) => b + p.length, 0), 0));

// ---------------------------------------------------------------- buildings
function obb(fp) {   // minimum-area oriented rectangle of a footprint: [cx, cy, w, d, angle]  (w >= d, angle of the w axis, radians, y south)
  const pts = fp.map(p => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p) }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p) }
  const hull = lo.slice(0, -1).concat(up.slice(0, -1)); let best = null;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(ang), s = Math.sin(ang);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of hull) { const u = p[0] * c + p[1] * s, v = -p[0] * s + p[1] * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v) }
    const A = (u1 - u0) * (v1 - v0); if (!best || A < best.A) best = { A, ang, c, s, u0, u1, v0, v1 };
  }
  const { c, s, u0, u1, v0, v1 } = best, mu = (u0 + u1) / 2, mv = (v0 + v1) / 2; let w = u1 - u0, d = v1 - v0, ang = best.ang;
  if (d > w) { [w, d] = [d, w]; ang += Math.PI / 2 }
  return [mu * c - mv * s, mu * s + mv * c, w, d, ((ang % Math.PI) + Math.PI) % Math.PI];
}
const bySec = Array.from({ length: NX * NY }, () => []);
const bizPolys = []; // commercial land would be better, but the tile helper only gives it in local metres; use big footprints and heights instead
for (const b of bRaw) {
  const a = Math.abs(area(b.fp)); if (a < 40) continue;
  const [cx, cy, w, d, ang] = obb(b.fp); if (!inFrame(cx, cy)) continue;
  let wet = false; for (const p of water) if (p.length > 2 && pip(p, cx, cy)) { wet = true; break } if (wet) continue;
  bySec[secOf(cx, cy)].push({ fp: b.fp, a, cx, cy, w, d, ang, h: b.h, known: b.known });
}
const bOut = bySec.map((list, s) => {
  const cap = CAPs(s);
  // jobs: big or tall footprints; apartments: mid-size; houses: the rest, thinned evenly by a hash so the whole sector is covered
  list.forEach(b => { b.t = (b.a >= 700 || (b.known && b.h >= 16)) ? 2 : (b.a >= 260 || (b.known && b.h >= 10)) ? 1 : 0; b.r = hash(b.cx, b.cy) });
  const big = list.filter(b => b.t === 2).sort((p, q) => q.a - p.a).slice(0, Math.round(cap * .38));
  const rest = list.filter(b => b.t !== 2).sort((p, q) => p.r - q.r).slice(0, cap - big.length);
  return big.concat(rest).map(b => {
    let poly = 0;
    if (b.a >= 900 && big.indexOf(b) >= 0 && big.indexOf(b) < 18) { const sp = dp(b.fp.concat([b.fp[0]]), 3).slice(0, -1); if (sp.length >= 3 && sp.length <= 14) { poly = []; let px = Math.round(b.cx), py = Math.round(b.cy); for (const q of sp) { poly.push(Math.round(q[0]) - px, Math.round(q[1]) - py) } } }
    const o = [Math.round(b.cx), Math.round(b.cy), Math.max(4, Math.round(b.w)), Math.max(4, Math.round(b.d)), Math.round(b.ang * 180 / Math.PI / 3) % 60, Math.max(3, Math.round(b.h)), b.t];
    if (poly) o.push(poly); return o;
  });
});
console.log('buildings kept', bOut.reduce((a, l) => a + l.length, 0), 'of', bRaw.length, 'polygon ones', bOut.reduce((a, l) => a + l.filter(b => b.length > 7).length, 0));

// ---------------------------------------------------------------- points of interest (named landmarks)
const poiOut = Array.from({ length: NX * NY }, () => []);
{
  // one landmark per kind (the game keeps one of each), the real one nearest to the start; hospital = the nearest hospital-class POI (a clinic here)
  const want = { hospital: 'O', college: 'U', stadium: 'C', school: 'K' }, best = {};
  for (const p of pois) {
    const L = want[p.cls]; if (!L || !inFrame(p.x, p.y)) continue;
    if (L === 'C' && !/arena|stadium/i.test(p.name)) continue; if (L === 'K' && /nutrition|child|early|kinder/i.test(p.name)) continue;
    for (const t of STARTS) { const sx = (t.c + .5) * SEC, sy = (t.r + .5) * SEC, d = Math.hypot(p.x - sx, p.y - sy), k = L + t.key; if (!best[k] || d < best[k].d) best[k] = { d, p } }
  }
  const done = new Set(); for (const k in best) { const p = best[k].p, id = k[0] + p.name; if (done.has(id)) continue; done.add(id); poiOut[secOf(p.x, p.y)].push([k[0], Math.round(p.x), Math.round(p.y), p.name]) }
  console.log('landmarks', poiOut.flat().map(p => p.join(' ')).join(' | '));
}

// ---------------------------------------------------------------- place names (neighbourhoods) used to name the sectors the map can grow into
const plOut = []; { const seen = new Set(), ok = new Set(['neighbourhood', 'suburb', 'quarter', 'hamlet', 'village', 'town', 'city', 'island']);
  for (const p of placeNames) { if (!ok.has(p.cls) || seen.has(p.name)) continue; const q = fr(p.x, p.y); if (q[0] < -600 || q[0] > FW + 600 || q[1] < -600 || q[1] > FH + 600) continue; seen.add(p.name); plOut.push([Math.round(q[0]), Math.round(q[1]), p.name]) }
  console.log('places', plOut.map(p => p[2]).join(', ')); }
// ---------------------------------------------------------------- window metrics (3 x 3 sectors) to compare candidate starts
if (process.env.METRICS) {
  const deg = new Array(nodeList.length).fill(0); for (const e of edgeOut) { deg[e.a]++; deg[e.b]++ }
  const rows = [];
  for (let r0 = 0; r0 + 2 < NY; r0++)for (let c0 = 0; c0 + 2 < NX; c0++) {
    let junc = 0, mway = 0, br = 0, hom = 0, job = 0, arter = 0, nodes = 0, wat = 0, park = 0, edgesN = 0; const secs = []; for (let r = r0; r < r0 + 3; r++)for (let c = c0; c < c0 + 3; c++)secs.push(r * NX + c);
    for (const s of secs) { for (const b of bOut[s]) { if (b[6] === 2) job++; else hom++ } for (const p of polys.w[s]) wat += Math.abs(area(p.reduce((a, v, i) => i === 0 ? [[v]] : a, [[0]]) && [[0, 0]])) ; park += polys.p[s].length }
    const S = new Set(secs); edgeOut.forEach(e => { if (!S.has(e.s)) return; edgesN++; nodes += e.p.length + 1; if (e.c === 0) mway++; if (e.br) br++; if (e.c === 1) arter++ });
    nodeList.forEach((n, i) => { if (deg[i] >= 3 && S.has(secOf(n.x, n.y))) junc++ });
    rows.push({ c0, r0, cen: [c0 + 1, r0 + 1], junc, nodes, mway, br, arter, hom, job, park });
  }
  fs.writeFileSync(path.join(outDir, '_metrics.json'), JSON.stringify(rows));
}
// ---------------------------------------------------------------- pack
const rel = poly => { const o = [poly[0][0], poly[0][1]]; for (let i = 1; i < poly.length; i++)o.push(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]); return o };
const data = {
  v: 1, o: [LAT0, LON0], sec: SEC, nx: NX, ny: NY, st: STARTS.map(t => [t.key, t.c, t.r]), ext: [X0, Y1],
  src: 'OpenFreeMap planet tiles (OpenStreetMap contributors, ODbL), zoom 14, baked ' + new Date().toISOString().slice(0, 10),
  names: nameTab,
  pl: plOut,
  nodes: nodeList.map(n => [n.x, n.y]).flat(),
  edges: edgeOut.map(e => { const o = [e.a, e.b, e.c | (e.br << 2), e.n, e.s]; let px = nodeList[e.a].x, py = nodeList[e.a].y; for (const p of e.p) { o.push(p[0] - px, p[1] - py); px = p[0]; py = p[1] } return o }),
  sectors: Array.from({ length: NX * NY }, (_, s) => ({ w: polys.w[s].map(rel), p: polys.p[s].map(rel), z: polys.z[s].map(rel), b: bOut[s], l: poiOut[s] })),
};
const json = JSON.stringify(data);
const z = zlib.deflateRawSync(Buffer.from(json), { level: 9 }), b64 = z.toString('base64');
fs.writeFileSync(path.join(outDir, 'real_bridgeport.b64'), b64);
fs.writeFileSync(path.join(outDir, 'real_bridgeport.json'), json);
console.log('json', json.length, 'deflated', z.length, 'base64', b64.length);
console.log('nodes per sector (game nodes):'); for (let r = 0; r < NY; r++)console.log(Array.from({ length: NX }, (_, c) => String(perSec[r * NX + c]).padStart(4)).join(' '));
console.log('buildings per sector:'); for (let r = 0; r < NY; r++)console.log(Array.from({ length: NX }, (_, c) => String(bOut[r * NX + c].length).padStart(4)).join(' '));
console.log('origin lat/lon of frame corners', JSON.stringify(toLonLat(X0, Y1)), JSON.stringify(toLonLat(X0 + FW, Y1 - FH)));
