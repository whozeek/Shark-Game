/* Vector-tile decoding and extraction of game data from one OpenMapTiles-schema tile (OpenFreeMap serves these; the data is OpenStreetMap, ODbL).
 *
 * decodeMVT(bytes)      -> "norm": {l:{layer:[{p:{props},t:1|2|3,g:[[x0,y0,x1,y1,...],...]}]}} in integer tile pixels (extent 4096). This is also the format of the bundled sample.
 * extractTile(norm,tx,ty) -> game data in local metres (ways, buildings, water/park/business polygons, place names).
 */
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import { GW, EXT, tileOrigin, tileSize, polyArea, pointInRing, segPoint, hash2, heightAt } from './core.js';

const KEEP = {
  transportation: ['class', 'subclass', 'brunnel', 'oneway', 'ramp', 'service', 'layer'],
  transportation_name: ['name', 'class', 'ref'],
  building: ['render_height', 'render_min_height', 'colour', 'hide_3d'],
  water: ['class'], waterway: ['class'], landuse: ['class'], landcover: ['class', 'subclass'], park: ['class'],
  place: ['name', 'class', 'capital', 'rank'], mountain_peak: ['name', 'ele'],
};
export function decodeMVT(bytes) {
  const vt = new VectorTile(new Pbf(bytes)), out = { l: {} };
  for (const name in KEEP) {
    const L = vt.layers[name]; if (!L) continue; const arr = [];
    for (let i = 0; i < L.length; i++) {
      const f = L.feature(i), p = {}; for (const k of KEEP[name]) if (f.properties[k] !== undefined) p[k] = f.properties[k];
      const rings = f.loadGeometry().map(r => { const a = new Array(r.length * 2); for (let j = 0; j < r.length; j++) { a[2 * j] = r[j].x; a[2 * j + 1] = r[j].y } return a });
      arr.push({ p, t: f.type, g: rings });
    }
    out.l[name] = arr;
  }
  return out;
}

const ROAD = {   // class -> [width m, lanes, drivable, walkable, rank]
  motorway: [14, 4, 1, 0, 0], trunk: [12, 4, 1, 0, 1], primary: [10, 2, 1, 1, 2], secondary: [8.5, 2, 1, 1, 3], tertiary: [7.5, 2, 1, 1, 4],
  minor: [6, 2, 1, 1, 5], service: [3.8, 1, 1, 1, 6], path: [1.8, 0, 0, 1, 7], track: [3, 1, 0, 1, 7], pier: [4, 0, 0, 1, 7], busway: [6, 2, 0, 0, 5],
};
export const ROAD_STYLE = ROAD;
const URBAN = { residential: 1, commercial: 1, retail: 1, industrial: 1 };
const BIZ = { commercial: 1, retail: 1, industrial: 1 };

function groupPolys(rings, toLocal) {   // MVT rings -> [{outer, holes}] (outer rings have positive screen-space area)
  const out = []; let cur = null;
  for (const r of rings) {
    if (r.length < 8) continue; let a = 0; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)a += (r[j] - r[i]) * (r[j + 1] + r[i + 1]);   // shoelace on pixels (y down)
    const pts = []; for (let i = 0; i < r.length; i += 2)pts.push(toLocal(r[i], r[i + 1]));
    if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    if (pts.length < 3) continue;
    if (a > 0) { cur = { outer: pts, holes: [] }; out.push(cur) } else if (a < 0) { if (cur) cur.holes.push(pts); else { /* orphan hole: treat as outer */ cur = { outer: pts.reverse(), holes: [] }; out.push(cur) } }
  }
  return out;
}
function colourOf(c) {
  if (!c || typeof c !== 'string') return null;
  if (c[0] === '#') { const h = c.length === 4 ? c.replace(/./g, (m, i) => i ? m + m : '') : c; const v = parseInt(h.slice(1), 16); return isNaN(v) ? null : v }
  const N = { white: 0xf2f2f0, grey: 0xa0a0a0, gray: 0xa0a0a0, red: 0xb5523f, brown: 0x8b6b4e, beige: 0xd9c9a3, yellow: 0xe6d28a, black: 0x555555, green: 0x7a9a6a, blue: 0x7d9cbf, orange: 0xd89a5a, pink: 0xd9a0a8, tan: 0xc9b48a, cream: 0xefe6c8, silver: 0xbfc4c8, maroon: 0x8a4a4a };
  return N[c.toLowerCase()] || null;
}

export function extractTile(norm, tx, ty) {
  const O = tileOrigin(tx, ty), S = tileSize(), k = S / EXT;
  const L = norm.l, toL = (px, py) => [O.x + px * k, O.y - py * k];
  const inTile = (px, py) => px >= 0 && px < EXT && py >= 0 && py < EXT;
  const T = { tx, ty, ways: [], rails: [], buildings: [], waterPolys: [], parkPolys: [], bizPolys: [], places: [], peaks: [], stats: {} };

  // --- names for roads: merged lines of transportation_name, matched to road lines by proximity (3 samples per road line)
  const names = [], NC = 256, ngrid = new Map();
  for (const f of (L.transportation_name || [])) {
    if (f.t !== 2 || !f.p.name) continue;
    for (const ln of f.g) for (let i = 0; i + 3 < ln.length; i += 2) { const s = { a: [ln[i], ln[i + 1]], b: [ln[i + 2], ln[i + 3]], name: f.p.name }; names.push(s); const cx0 = Math.floor(Math.min(s.a[0], s.b[0]) / NC), cx1 = Math.floor(Math.max(s.a[0], s.b[0]) / NC), cy0 = Math.floor(Math.min(s.a[1], s.b[1]) / NC), cy1 = Math.floor(Math.max(s.a[1], s.b[1]) / NC); for (let cx = cx0; cx <= cx1; cx++)for (let cy = cy0; cy <= cy1; cy++) { const kk = cx + ',' + cy; (ngrid.get(kk) || ngrid.set(kk, []).get(kk)).push(s) } }
  }
  const nameAt = (px, py) => {
    let best = null, bd = 14;
    for (let cx = Math.floor((px - 14) / NC); cx <= Math.floor((px + 14) / NC); cx++)for (let cy = Math.floor((py - 14) / NC); cy <= Math.floor((py + 14) / NC); cy++) { const l = ngrid.get(cx + ',' + cy); if (l) for (const s of l) { const h = segPoint(px, py, s.a[0], s.a[1], s.b[0], s.b[1]); if (h.d < bd) { bd = h.d; best = s.name } } }
    return best;
  };

  // --- roads
  for (const f of (L.transportation || [])) {
    if (f.t !== 2) continue; const c = f.p.class; if (c === 'ferry' || c === 'aerialway' || c === 'bus_guideway') continue;
    const isRail = c === 'rail' || c === 'transit';
    const info = ROAD[c]; if (!info && !isRail) continue;
    for (const ln of f.g) {
      // keep only segments whose midpoint lies in this tile (the tile buffer duplicates geometry of the neighbours)
      let run = [];
      const flush = () => {
        if (run.length > 1) {
          const pts = run.map(p => toL(p[0], p[1]));
          if (isRail) T.rails.push({ pts });
          else {
            const mid = run[run.length >> 1], vote = new Map();
            for (const q of [run[0], mid, run[run.length - 1]]) { const n = nameAt(q[0], q[1]); if (n) vote.set(n, (vote.get(n) || 0) + 1) }
            let name = ''; let bv = 0; for (const [n, v] of vote) if (v > bv) { bv = v; name = n }
            const ow = f.p.oneway ? (f.p.oneway < 0 ? -1 : 1) : 0, br = f.p.brunnel === 'bridge', tn = f.p.brunnel === 'tunnel';
            let w = info[0]; if (c === 'motorway' && ow) w = 9.5; if (c === 'trunk' && ow) w = 8.5;
            T.ways.push({ cls: c, sub: f.p.subclass || '', name, oneway: ow, bridge: br, tunnel: tn, ramp: !!f.p.ramp, lanes: ow ? Math.max(1, info[1] / 2) : info[1], width: w, drivable: !!info[2], walkable: !!info[3], rank: info[4], pts });
          }
        }
        run = [];
      };
      for (let i = 0; i + 1 < ln.length; i += 2) {
        const p = [ln[i], ln[i + 1]];
        if (i === 0) { run.push(p); continue }
        const q = [ln[i - 2], ln[i - 1]], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        if (inTile(mx, my)) { if (!run.length) run.push(q); run.push(p) } else flush();
      }
      flush();
    }
  }

  // --- ground polygons (kept in tile pixels for the ground texture) and local-metre rings for the bus-game export
  for (const f of (L.water || [])) if (f.t === 3) for (const g of groupPolys(f.g, toL)) T.waterPolys.push(g.outer);
  for (const f of (L.park || [])) if (f.t === 3) for (const g of groupPolys(f.g, toL)) T.parkPolys.push(g.outer);
  const urbanPx = [];
  for (const f of (L.landuse || [])) if (f.t === 3) {
    const cl = f.p.class;
    if (BIZ[cl]) for (const g of groupPolys(f.g, toL)) T.bizPolys.push(g.outer);
    if (URBAN[cl]) for (const r of f.g) urbanPx.push({ ring: r, cls: cl });
  }
  const pxRing = r => { const o = []; for (let i = 0; i < r.length; i += 2)o.push([r[i], r[i + 1]]); return o };
  const urbanRings = urbanPx.map(u => ({ ring: pxRing(u.ring), cls: u.cls })).filter(u => u.ring.length > 2 && polyArea(u.ring) !== 0);
  const waterPx = (L.water || []).filter(f => f.t === 3).flatMap(f => f.g.map(pxRing)), parkPx = [...(L.park || []), ...(L.landcover || []).filter(f => f.p.class === 'wood' || f.p.class === 'wetland')].filter(f => f.t === 3).flatMap(f => f.g.map(pxRing));

  // --- real building footprints
  const real = [];
  for (const f of (L.building || [])) {
    if (f.t !== 3) continue;
    const rh = f.p.render_height, rmin = f.p.render_min_height || 0;
    for (const g of groupPolys(f.g, toL)) {
      let outer = g.outer; if (polyArea(outer) < 0) outer.reverse();
      let cx = 0, cy = 0; for (const p of outer) { cx += p[0]; cy += p[1] } cx /= outer.length; cy /= outer.length;
      const px = (cx - O.x) / k, py = (O.y - cy) / k; if (!inTile(px, py)) continue;
      const area = Math.abs(polyArea(outer)); if (area < 3) continue;
      const holes = g.holes.map(h => polyArea(h) > 0 ? h.reverse() : h);
      let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18; for (const p of outer) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
      const known = rh !== undefined && rh !== 5;   // OpenMapTiles fills render_height with 5 m when the mapper gave neither height nor levels
      let h = known ? rh : 0;
      const id = tx + '_' + ty + '_r' + real.length;
      if (!known) { const u = hash2(Math.round(cx), Math.round(cy)); h = area < 70 ? 4 + u * 2.5 : area < 220 ? 5.5 + u * 4.5 : area < 800 ? 8 + u * 8 : 12 + u * 14 }
      real.push({ id, tile: tx + ',' + ty, fp: outer, holes, height: Math.max(h, rmin + 1), minHeight: rmin, source: 'osm', approx: false, heightSource: known ? 'osm' : 'estimated', colour: colourOf(f.p.colour), bbox: [x0, y0, x1, y1], cx, cy, area });
    }
  }
  // memory guard: a very dense tile (Kathmandu has about 14,000 footprints) keeps its largest footprints only; the count of omitted ones is reported in the status line
  const CAPB = GW.opts.quality === 'saver' ? 3000 : 7000; let omitted = 0;
  if (real.length > CAPB) { real.sort((a, b) => b.area - a.area); omitted = real.length - CAPB; real.length = CAPB }
  T.buildings = real; T.omitted = omitted;
  const nReal = real.length;

  // --- procedural buildings: only inside urban landuse polygons, along streets, never over a real footprint, a road, water or a park.
  let nProc = 0;
  if (GW.opts.proceduralFill && urbanRings.length) {
    const wayPx = T.ways.filter(w => w.rank >= 2 && w.rank <= 6 && !w.tunnel && w.drivable);
    const allSeg = [];  // road segments (local) of this tile for clearance tests
    for (const w of T.ways) { if (w.tunnel) continue; for (let i = 0; i + 1 < w.pts.length; i++)allSeg.push([w.pts[i], w.pts[i + 1], w.width / 2]) }
    const SG = 40, sgrid = new Map();
    allSeg.forEach((s, i) => { const x0 = Math.floor((Math.min(s[0][0], s[1][0]) - 12) / SG), x1 = Math.floor((Math.max(s[0][0], s[1][0]) + 12) / SG), y0 = Math.floor((Math.min(s[0][1], s[1][1]) - 12) / SG), y1 = Math.floor((Math.max(s[0][1], s[1][1]) + 12) / SG); for (let a = x0; a <= x1; a++)for (let b = y0; b <= y1; b++) { const kk = a + ',' + b; (sgrid.get(kk) || sgrid.set(kk, []).get(kk)).push(i) } });
    const roadClear = (x, y) => { const l = sgrid.get(Math.floor(x / SG) + ',' + Math.floor(y / SG)); let best = 1e9; if (l) for (const i of l) { const s = allSeg[i], d = segPoint(x, y, s[0][0], s[0][1], s[1][0], s[1][1]).d - s[2]; if (d < best) best = d } return best };
    const BG = 30, bgrid = new Map(), placed = [];
    const addB = b => { for (let a = Math.floor(b.bbox[0] / BG); a <= Math.floor(b.bbox[2] / BG); a++)for (let c = Math.floor(b.bbox[1] / BG); c <= Math.floor(b.bbox[3] / BG); c++) { const kk = a + ',' + c; (bgrid.get(kk) || bgrid.set(kk, []).get(kk)).push(b.bbox) } };
    real.forEach(addB);
    const overlaps = bb => { for (let a = Math.floor((bb[0] - 1.5) / BG); a <= Math.floor((bb[2] + 1.5) / BG); a++)for (let c = Math.floor((bb[1] - 1.5) / BG); c <= Math.floor((bb[3] + 1.5) / BG); c++) { const l = bgrid.get(a + ',' + c); if (l) for (const o of l) if (bb[0] - 1.5 < o[2] && bb[2] + 1.5 > o[0] && bb[1] - 1.5 < o[3] && bb[3] + 1.5 > o[1]) return true } return false };
    const urbanAt = (x, y) => { const px = (x - O.x) / k, py = (O.y - y) / k; for (const u of urbanRings) if (pointInRing(u.ring, px, py)) return u.cls; return null };
    const inAny = (rings, x, y) => { const px = (x - O.x) / k, py = (O.y - y) / k; for (const r of rings) if (r.length > 2 && pointInRing(r, px, py)) return true; return false };
    const waterR = waterPx.filter(r => r.length > 2), parkR = parkPx.filter(r => r.length > 2);
    const CAP = GW.opts.quality === 'saver' ? 500 : 1400;
    for (const w of wayPx) {
      let acc = 0;
      for (let i = 0; i + 1 < w.pts.length && nProc < CAP; i++) {
        const A = w.pts[i], B = w.pts[i + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]); if (len < 1) continue;
        const dx = (B[0] - A[0]) / len, dy = (B[1] - A[1]) / len, nx = -dy, ny = dx;
        let s = acc;
        for (; s < len && nProc < CAP; s += 16) {
          const px0 = A[0] + dx * s, py0 = A[1] + dy * s, u0 = hash2(Math.round(px0 / 3), Math.round(py0 / 3));
          for (const side of [-1, 1]) {
            const u = hash2(Math.round(px0 / 2) + side * 7, Math.round(py0 / 2) - side * 3); if (u < .18) continue;
            const wd = 9 + u * 6, dp = 7 + hash2(Math.round(px0), side) * 4.5, off = w.width / 2 + 4.5 + dp / 2 + u0 * 3;
            const cx = px0 + nx * off * side, cy = py0 + ny * off * side;
            if (Math.abs((cx - O.x) / k - EXT / 2) > EXT / 2 - 40 || Math.abs((O.y - cy) / k - EXT / 2) > EXT / 2 - 40) continue;   // stay off the tile border (the neighbour may hold real footprints we cannot see)
            const cls = urbanAt(cx, cy); if (!cls) continue;
            if (inAny(waterR, cx, cy) || inAny(parkR, cx, cy)) continue;
            const hx = dx * wd / 2, hy = dy * wd / 2, ox = nx * dp / 2, oy = ny * dp / 2;
            const fp = [[cx - hx - ox, cy - hy - oy], [cx + hx - ox, cy + hy - oy], [cx + hx + ox, cy + hy + oy], [cx - hx + ox, cy - hy + oy]];
            if (fp.some(p => roadClear(p[0], p[1]) < 1.5) || roadClear(cx, cy) < dp / 2 + 1) continue;
            const bb = [Math.min(...fp.map(p => p[0])), Math.min(...fp.map(p => p[1])), Math.max(...fp.map(p => p[0])), Math.max(...fp.map(p => p[1]))];
            if (overlaps(bb)) continue;
            const biz = BIZ[cls], hh = cls === 'industrial' ? 6 + u * 6 : biz ? 8 + u * 16 : 5.5 + u * 4.5, id = tx + '_' + ty + '_p' + nProc;
            const b = { id, tile: tx + ',' + ty, fp, holes: [], height: hh, minHeight: 0, source: 'procedural', approx: true, heightSource: 'estimated', colour: null, bbox: bb, cx, cy, area: wd * dp, landuse: cls };
            T.buildings.push(b); addB(b); nProc++;
          }
        }
        acc = s - len;
      }
    }
  }
  // --- names
  for (const f of (L.place || [])) if (f.t === 1 && f.p.name && f.g[0]) { const p = toL(f.g[0][0], f.g[0][1]); T.places.push({ name: f.p.name, cls: f.p.class, rank: f.p.rank || 99, x: p[0], y: p[1] }) }
  for (const f of (L.mountain_peak || [])) if (f.t === 1 && f.g[0]) { const p = toL(f.g[0][0], f.g[0][1]); T.peaks.push({ name: f.p.name || '', ele: f.p.ele, x: p[0], y: p[1] }) }
  T.stats = { ways: T.ways.length, buildingsOsm: nReal, buildingsProc: nProc };
  return T;
}
