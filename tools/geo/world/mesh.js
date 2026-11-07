/* Per-tile three.js geometry (terrain + ground texture, road ribbons, extruded buildings), merged so each tile costs 3 draw calls. */
import { GW, EXT, tileOrigin, tileSize, heightAt, hash2 } from './core.js';
import { ROAD_STYLE } from './data.js';

const T3 = () => window.THREE;
const GROUND = { grass: '#a5cf86', wood: '#6faa68', farmland: '#c9d98f', sand: '#e8dfb0', rock: '#a9a59c', ice: '#f1f6fa', wetland: '#8fbf9f', scrub: '#9fc080' };
const LANDUSE = { residential: '#dad6c9', commercial: '#d9d0d5', retail: '#e0d2cc', industrial: '#cfcac3', cemetery: '#a9d09b', school: '#e3dccb', university: '#e3dccb', hospital: '#e8dada', stadium: '#c9d8c0', pitch: '#9ad08a', playground: '#bfe0a6', military: '#d4cabb', railway: '#c8c3bd', quarry: '#bdb6a8', theme_park: '#d9cfe0', zoo: '#bfe0a6', garages: '#cfcac3', bus_station: '#cfcac3', track: '#9ad08a', miscellaneous: '#d9d6cb', kindergarten: '#e3dccb', college: '#e3dccb', library: '#e3dccb' };
const WATER = '#6aaedb', PARKC = '#8fcf8a', BASE = '#a8c283';
const WATERWAY = { river: 9, canal: 7, stream: 2.2, drain: 1.6, ditch: 1.4 };
const ROADCOL = { motorway: 0x6a707c, trunk: 0x727884, primary: 0x7a808a, secondary: 0x838993, tertiary: 0x8b909a, minor: 0x969ba3, service: 0xa5a8ae, path: 0xbba98a, track: 0xb09c78, pier: 0xa38f6f, busway: 0x8b909a };
const WALLS = [0xe8dcc4, 0xd9c7a8, 0xc9b79a, 0xe0d2cc, 0xd0c8be, 0xbfae98, 0xe6d9b8, 0xc8ced4, 0xd6c0b0, 0xcfd6c8];
const ROOFS = [0xb0685a, 0x8d8f94, 0xa8a29a, 0x7f8c7c, 0xb9a48a, 0x9a6f64, 0x6f7480];
const PWALLS = [0xf1e8d6, 0xe8dfcf, 0xe6e1d8, 0xeadfd2, 0xdfe3e2];   // lighter, flatter palette = clearly generated

export function groundTexture(norm, size) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), s = size / EXT;
  g.fillStyle = BASE; g.fillRect(0, 0, size, size);
  const poly = (rings, col) => { g.fillStyle = col; g.beginPath(); for (const r of rings) { if (r.length < 6) continue; g.moveTo(r[0] * s, r[1] * s); for (let i = 2; i < r.length; i += 2)g.lineTo(r[i] * s, r[i + 1] * s); g.closePath() } g.fill('evenodd') };
  const L = norm.l;
  for (const f of (L.landcover || [])) if (f.t === 3) poly(f.g, GROUND[f.p.class] || BASE);
  for (const f of (L.landuse || [])) if (f.t === 3) poly(f.g, LANDUSE[f.p.class] || '#d9d6cb');
  for (const f of (L.park || [])) if (f.t === 3) poly(f.g, PARKC);
  for (const f of (L.water || [])) if (f.t === 3) poly(f.g, WATER);
  g.strokeStyle = WATER; g.lineCap = 'round'; g.lineJoin = 'round';
  const k = (GW.k / Math.pow(2, 14)) / EXT;   // metres per tile pixel
  for (const f of (L.waterway || [])) if (f.t === 2) { g.lineWidth = Math.max(1.2, (WATERWAY[f.p.class] || 2) / k * s); for (const r of f.g) { g.beginPath(); g.moveTo(r[0] * s, r[1] * s); for (let i = 2; i < r.length; i += 2)g.lineTo(r[i] * s, r[i + 1] * s); g.stroke() } }
  const tex = new (T3().CanvasTexture)(c); tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = T3().LinearMipmapLinearFilter; return tex;
}

function terrain(tx, ty, N, tex) {
  const THREE = T3(), O = tileOrigin(tx, ty), S = tileSize(), pos = [], nor = [], uv = [], idx = [], d = Math.max(8, S / N / 2);
  const hv = (x, y) => heightAt(x, y);
  for (let j = 0; j <= N; j++)for (let i = 0; i <= N; i++) {
    const x = O.x + i / N * S, y = O.y - j / N * S, h = hv(x, y);
    pos.push(x, h, -y); uv.push(i / N, 1 - j / N);
    const dhx = (hv(x + d, y) - hv(x - d, y)) / (2 * d), dhy = (hv(x, y + d) - hv(x, y - d)) / (2 * d), l = Math.hypot(dhx, dhy, 1); nor.push(-dhx / l, 1 / l, dhy / l);
  }
  const V = (i, j) => j * (N + 1) + i;
  for (let j = 0; j < N; j++)for (let i = 0; i < N; i++) { const a = V(i, j), b = V(i + 1, j), c = V(i, j + 1), e = V(i + 1, j + 1); idx.push(a, c, b, b, c, e) }
  // skirts hide cracks where neighbouring tiles meet
  const ring = []; for (let i = 0; i <= N; i++)ring.push(V(i, 0)); for (let j = 1; j <= N; j++)ring.push(V(N, j)); for (let i = N - 1; i >= 0; i--)ring.push(V(i, N)); for (let j = N - 1; j >= 1; j--)ring.push(V(0, j));
  const base = pos.length / 3;
  for (const r of ring) { pos.push(pos[r * 3], pos[r * 3 + 1] - 14, pos[r * 3 + 2]); nor.push(0, 1, 0); uv.push(uv[r * 2], uv[r * 2 + 1]) }
  for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], sa = base + k, sb = base + (k + 1) % ring.length; idx.push(a, b, sb, a, sb, sa, a, sb, b, a, sa, sb) }
  // steep slopes show bare rock: darken and warm the ground colour with the slope (vertex colours multiply the ground texture)
  const col = new Array(pos.length); for (let i = 0; i < pos.length / 3; i++) { const sl = Math.sqrt(Math.max(0, 1 / Math.max(.2, nor[i * 3 + 1]) ** 2 - 1)), t = Math.min(1, Math.max(0, (sl - .35) / .6)); col[i * 3] = 1 - .26 * t; col[i * 3 + 1] = 1 - .33 * t; col[i * 3 + 2] = 1 - .40 * t }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return { geo: g, mat: new THREE.MeshLambertMaterial({ map: tex, vertexColors: true }), tris: idx.length / 3 };
}

function ribbons(T) {
  const pos = [], col = [], nor = []; let tris = 0, c = new (T3().Color)();
  const add = (pts, w, hex, lift, bridge) => {
    // subdivide to <= 14 m so the ribbon hugs the terrain
    const P = [];
    for (let i = 0; i + 1 < pts.length; i++) { const A = pts[i], B = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / 14)); for (let s = 0; s < n; s++)P.push([A[0] + (B[0] - A[0]) * s / n, A[1] + (B[1] - A[1]) * s / n]) }
    P.push(pts[pts.length - 1]); if (P.length < 2) return;
    let z0 = heightAt(P[0][0], P[0][1]), z1 = heightAt(P[P.length - 1][0], P[P.length - 1][1]);
    const L = [], R = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      let z = heightAt(P[i][0], P[i][1]); if (bridge) z = Math.max(z, z0 + (z1 - z0) * i / (P.length - 1)); z += lift;
      L.push([P[i][0] - dy * w / 2, z, -(P[i][1] + dx * w / 2)]); R.push([P[i][0] + dy * w / 2, z, -(P[i][1] - dx * w / 2)]);
    }
    c.setHex(hex);
    for (let i = 0; i + 1 < P.length; i++) {
      const a = L[i], b = R[i], d = L[i + 1], e = R[i + 1];
      for (const v of [a, b, d, b, e, d]) { pos.push(v[0], v[1], v[2]); col.push(c.r, c.g, c.b); nor.push(0, 1, 0) } tris += 2;
    }
  };
  for (const w of T.ways) { if (w.tunnel) continue; add(w.pts, w.width, ROADCOL[w.cls] || 0x8b909a, .12 + (7 - w.rank) * .02 + (w.bridge ? .25 : 0), w.bridge) }
  for (const r of T.rails) add(r.pts, 2.4, 0x555a60, .1, false);
  return mk(pos, nor, col, tris);
}

function mk(pos, nor, col, tris) {
  const THREE = T3(), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return { geo: g, tris };
}

function buildings(list) {
  const THREE = T3(), pos = [], nor = [], col = [], c = new THREE.Color(); let tris = 0;
  const tri = (a, b, d, n, hex, sh) => { c.setHex(hex); for (const v of [a, b, d]) { pos.push(v[0], v[2], -v[1]); nor.push(n[0], n[2], -n[1]); col.push(c.r * sh, c.g * sh, c.b * sh) } tris++ };
  for (const b of list) {
    const fp = b.fp; let gmin = 1e9, gmax = -1e9;
    for (const p of fp) { const h = heightAt(p[0], p[1]); if (h < gmin) gmin = h; if (h > gmax) gmax = h }
    const hc = heightAt(b.cx, b.cy); gmax = Math.max(gmax, hc); gmin = Math.min(gmin, hc);
    const top = gmax + b.height, bot = b.minHeight > 0 ? gmin + b.minHeight : gmin - .3;
    b.baseZ = gmin; b.roofZ = top;
    const u = hash2(Math.round(b.cx * 3), Math.round(b.cy * 3));
    const wall = b.colour != null ? b.colour : (b.approx ? PWALLS : WALLS)[Math.floor(u * (b.approx ? PWALLS : WALLS).length)];
    const roof = b.approx ? 0xb7b2ac : b.height > 22 ? 0x9aa3ad : ROOFS[Math.floor(hash2(Math.round(b.cy * 3), Math.round(b.cx * 3)) * ROOFS.length)];
    const rings = [fp].concat(b.holes);
    for (const ring of rings) for (let i = 0, n = ring.length; i < n; i++) {
      const A = ring[i], B = ring[(i + 1) % n], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy); if (l < .05) continue;
      const nn = [dy / l, -dx / l, 0], sh = .82 + .18 * Math.abs(nn[0] * .5 + nn[1] * .85);
      const a0 = [A[0], A[1], bot], b0 = [B[0], B[1], bot], b1 = [B[0], B[1], top], a1 = [A[0], A[1], top];
      tri(a0, b0, b1, nn, wall, sh); tri(a0, b1, a1, nn, wall, sh);
    }
    // roof
    const V2 = THREE.Vector2, contour = fp.map(p => new V2(p[0], p[1])), hs = b.holes.map(h => h.map(p => new V2(p[0], p[1])));
    let faces; try { faces = THREE.ShapeUtils.triangulateShape(contour, hs) } catch (e) { faces = null }
    const all = fp.concat(...b.holes);
    if (faces) for (const f of faces) {
      let A = all[f[0]], B = all[f[1]], C = all[f[2]]; if (!A || !B || !C) continue;
      if ((B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]) < 0) { const t = B; B = C; C = t }
      tri([A[0], A[1], top], [B[0], B[1], top], [C[0], C[1], top], [0, 0, 1], roof, 1);
    }
  }
  const o = { pos, nor, col };
  const r = mk(o.pos, o.nor, o.col, tris); // positions already in three space (x, up, -y)
  return r;
}

/* Only buildings near the player get a mesh (a dense tile holds thousands of footprints; the data API still has all of them). */
export function bubbleRadius() { return GW.opts.quality === 'saver' ? 380 : 650 }
export function selectBubble(T, px, py) {
  const R = bubbleRadius(), cap = GW.opts.quality === 'saver' ? 1000 : 2200;
  let l = T.buildings.filter(b => Math.abs(b.cx - px) < R && Math.abs(b.cy - py) < R && Math.hypot(b.cx - px, b.cy - py) < R);
  if (l.length > cap) { l.sort((a, b) => Math.hypot(a.cx - px, a.cy - py) - Math.hypot(b.cx - px, b.cy - py)); l = l.slice(0, cap) }
  return l;
}
export function rebuildBuildings(rec, px, py) {
  const grp = rec.group; if (!grp) return;
  const old = grp.getObjectByName('buildings'); if (old) { grp.remove(old); old.geometry.dispose() }
  const l = selectBubble(rec, px, py), bd = buildings(l);
  rec.bubble = { x: px, y: py, n: l.length };
  grp.userData.stats.tris = grp.userData.stats.tris - (grp.userData.stats.bTris || 0) + bd.tris; grp.userData.stats.bTris = bd.tris;
  if (bd.tris) { const m = new (T3().Mesh)(bd.geo, GW._bldMat); m.name = 'buildings'; m.matrixAutoUpdate = false; grp.add(m) } else bd.geo.dispose();
}
export function buildTileGroup(T, norm, tx, ty, px, py) {
  const THREE = T3(), grp = new THREE.Group(), q = GW.opts.quality === 'saver' ? 32 : 48, st = { tris: 0, calls: 0 };
  const tex = groundTexture(norm, GW.opts.quality === 'saver' ? 256 : 512);
  const te = terrain(tx, ty, q, tex), tm = new THREE.Mesh(te.geo, te.mat); tm.name = 'terrain'; grp.add(tm); st.tris += te.tris; st.calls++;
  GW._roadMat = GW._roadMat || new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  GW._bldMat = GW._bldMat || new THREE.MeshLambertMaterial({ vertexColors: true });
  const rb = ribbons(T); if (rb.tris) { const m = new THREE.Mesh(rb.geo, GW._roadMat); m.name = 'roads'; grp.add(m); st.tris += rb.tris; st.calls++ } else rb.geo.dispose();
  const bl = selectBubble(T, px, py), bd = buildings(bl); T.bubble = { x: px, y: py, n: bl.length }; st.bTris = bd.tris; if (bd.tris) { const m = new THREE.Mesh(bd.geo, GW._bldMat); m.name = 'buildings'; grp.add(m); st.tris += bd.tris; st.calls++ } else bd.geo.dispose();
  grp.traverse(o => { o.matrixAutoUpdate = false; o.updateMatrix() }); grp.userData.stats = st; grp.userData.tex = tex;
  return grp;
}
export function disposeGroup(grp) {
  grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.name === 'terrain' && o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose() } });
}
