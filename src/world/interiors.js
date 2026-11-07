// Places you can step into: walk-in cafés (tea house in Kyoto) and a laundromat on the street level,
// plus separate "levels" reached by stairs — a rooftop terrace, a subway platform with trains,
// an elevated-train platform — and a covered market arcade. Indoor areas hide the rain overhead
// and muffle the street.
import * as THREE from 'three';
import { CollisionWorld } from './collision.js';
import { staticPerson, SIDES } from './kit.js';
import { makeSignTex, makeWoodFloor, makeTiles } from '../render/textures.js';
import { patchWash } from '../render/shared.js';
import { LAYER_NO_REFLECT } from './cityBase.js';

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function mats(cb) {
  if (cb.imats) return cb.imats;
  const T = (t) => cb.track(t);
  cb.imats = {
    wood: cb.track(patchWash(new THREE.MeshStandardMaterial({ map: T(makeWoodFloor()), roughness: 0.6, vertexColors: true }), 0.01)),
    tile: cb.track(patchWash(new THREE.MeshStandardMaterial({ map: T(makeTiles()), roughness: 0.35, vertexColors: true }), 0.01)),
    window: cb.track(new THREE.MeshStandardMaterial({ color: 0x9fb4c8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })),
  };
  return cb.imats;
}

/** Register an interior/indoor rectangle. */
function indoor(cb, r, o) { (cb.indoors || (cb.indoors = [])).push({ ...r, ...o }); }

/** Add a portal: standing near (x,z) on `from` level lets you go to `to`. */
export function portal(cb, from, x, z, label, to) { (cb.portals || (cb.portals = [])).push({ level: from, x, z, label, to }); }

/** Create a separate walkable level with its own collision and floor height. */
export function makeLevel(cb, name, o) {
  const col = new CollisionWorld(8);
  col.bounds = o.bounds;
  const lv = { name, col, floor: o.floor, indoor: !!o.indoor, label: o.label, sound: o.sound || 'none', seats: [] };
  (cb.levels || (cb.levels = {}))[name] = lv;
  return lv;
}

// ------------------------------------------------------------------ café / laundromat / tea house
/**
 * Build a walk-in ground floor inside lot `b`, opening onto `side`.
 * kind: 'cafe' | 'laundry' | 'tea'. Returns door position (outside) for portals.
 */
export function walkInShop(cb, b, side, H, o) {
  const M = cb.mats, IM = mats(cb), rng = cb.rng;
  const kind = o.kind || 'cafe';
  const y0 = o.base ?? 0.15, gfH = o.gfH ?? 4.2;
  const gH = Math.min(2.6, gfH - 1.5); // window height
  const S = SIDES[side];
  const horiz = side === 'n' || side === 's';
  // local frame: u along the façade (left→right seen from the street), w into the building
  const len = horiz ? b.x1 - b.x0 : b.z1 - b.z0, dep = horiz ? b.z1 - b.z0 : b.x1 - b.x0;
  const fx = side === 'e' ? b.x1 : side === 'w' ? b.x0 : (b.x0 + b.x1) / 2;
  const fz = side === 's' ? b.z1 : side === 'n' ? b.z0 : (b.z0 + b.z1) / 2;
  const ux = horiz ? (side === 's' ? 1 : -1) : 0, uz = horiz ? 0 : (side === 'e' ? -1 : 1);
  const wx = -S.nx, wz = -S.nz; // into the building
  const P = (u, w) => [fx + ux * u + wx * w, fz + uz * u + wz * w];
  const ry = Math.atan2(ux, uz) - Math.PI / 2; // rotate boxes so local x runs along the façade
  const box = (mat, u, y, w, su, sy, sw, col) => { const [x, z] = P(u, w); cb.batch.box(mat, x, y, z, su, sy, sw, col, -ry); };
  const prim = (name, mat, u, y, w, sx, sy, sz, col) => { const [x, z] = P(u, w); cb.batch.prim(name, mat, x, y, z, sx, sy, sz, col); };
  const t = 0.25; // wall thickness
  const inner = { u0: -len / 2 + t, u1: len / 2 - t, w0: t, w1: dep - t };
  const palette = {
    cafe: { wall: 0xb88a62, floor: 0x9a6a44, accent: 0x2f4a3a, light: 0xffc98a, trim: 0x3a2618 },
    laundry: { wall: 0xdfe6ea, floor: 0xd0d0cc, accent: 0x2a6aa8, light: 0xe8f2ff, trim: 0x6a7a88 },
    tea: { wall: 0xd8c9a8, floor: 0xb89a6a, accent: 0x5a1e1e, light: 0xffc070, trim: 0x2a1a10 },
  }[kind];
  // floor, ceiling, walls
  const fl = new THREE.PlaneGeometry(len - 2 * t, dep - 2 * t); fl.rotateX(-Math.PI / 2);
  const [cxF, czF] = P(0, dep / 2); fl.translate(cxF, y0 + 0.012, czF);
  const fuv = fl.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * len / 3, fuv.getY(i) * dep / 3);
  cb.batch.addGeometry(fl, kind === 'laundry' ? IM.tile : IM.wood, kind === 'laundry' ? 0xffffff : palette.floor | 0x303030);
  box(M.paint, 0, y0 + gfH - 0.05, dep / 2, len - 0.1, 0.1, dep - 0.1, kind === 'laundry' ? 0xf2f2f0 : 0x3a2a20);
  box(M.paint, inner.u0 - t / 2, y0 + gfH / 2, dep / 2, t, gfH, dep, palette.wall);
  box(M.paint, inner.u1 + t / 2, y0 + gfH / 2, dep / 2, t, gfH, dep, palette.wall);
  box(M.paint, 0, y0 + gfH / 2, inner.w1 + t / 2, len, gfH, t, palette.wall);
  if (kind === 'cafe') box(M.paint, 0, y0 + 1.6, inner.w1 - 0.02, len * 0.98, 3.2, 0.04, 0x8a4a32); // brick-red feature wall
  // street front: kick plate, glass, door gap, transom and sign
  const doorU = o.doorLeft ? inner.u0 + 1.2 : inner.u1 - 1.2, doorW = 1.5;
  const segs = [[inner.u0 - t, doorU - doorW / 2], [doorU + doorW / 2, inner.u1 + t]];
  for (const [a, c] of segs) {
    if (c - a < 0.1) continue;
    const m = (a + c) / 2, wdt = c - a;
    box(M.paint, m, y0 + 0.3, 0.06, wdt, 0.6, 0.18, palette.trim);
    const [gx, gz] = P(m, 0.06);
    const g = new THREE.PlaneGeometry(wdt, gH); g.rotateY(S.ry); g.translate(gx, y0 + 0.6 + gH / 2, gz);
    cb.batch.addGeometry(g, IM.window, 0xffffff);
    const nM = Math.max(1, Math.round(wdt / 1.6));
    for (let k = 0; k <= nM; k++) box(M.paint, a + k * wdt / nM, y0 + 0.6 + gH / 2, 0.06, 0.08, gH, 0.12, palette.trim);
    cb.col.addBox(...P(m, 0.06), wdt / 2, 0.12, Math.atan2(uz, ux));
  }
  box(M.paint, 0, y0 + 0.6 + gH + 0.12, 0.06, len, 0.25, 0.16, palette.trim);
  box(M.paint, doorU - doorW / 2 - 0.05, y0 + (gH + 0.6) / 2, 0.06, 0.1, gH + 0.6, 0.14, palette.trim);
  box(M.paint, doorU + doorW / 2 + 0.05, y0 + (gH + 0.6) / 2, 0.06, 0.1, gH + 0.6, 0.14, palette.trim);
  if (gfH - (gH + 0.85) > 0.05) box(M.paint, 0, y0 + (gfH + gH + 0.85) / 2, -0.01, len, gfH - gH - 0.85, 0.12, palette.trim);
  // sign above the window
  const signMat = cb.track(new THREE.MeshBasicMaterial({ map: cb.track(makeSignTex(o.name, kind === 'laundry' ? '#1e3a5a' : kind === 'tea' ? '#2a1a10' : '#1d2a22', '#f6e8c8')), color: new THREE.Color(1.6, 1.6, 1.6) }));
  cb.neonMats.push(signMat); signMat.userData.base = 1.6;
  const [sx, sz] = P(0, -0.02);
  const sg = new THREE.PlaneGeometry(Math.min(len * 0.8, 6.5), 0.62); sg.rotateY(S.ry); sg.translate(sx + S.nx * 0.12, y0 + Math.min(gfH - 0.4, gH + 1.15), sz + S.nz * 0.12);
  cb.batch.addGeometry(sg, signMat, 0xffffff);
  // wall colliders (with the door gap left open)
  const addWall = (u, w, hu, hw) => { const [x, z] = P(u, w); cb.col.addBox(x, z, hu, hw, Math.atan2(uz, ux)); };
  addWall(inner.u0 - t / 2, dep / 2, t / 2, dep / 2);
  addWall(inner.u1 + t / 2, dep / 2, t / 2, dep / 2);
  addWall(0, inner.w1 + t / 2, len / 2, t / 2);
  // lighting: pendants + a real light inside, and warm spill on the pavement
  const nL = Math.max(2, Math.round(len / 2.6));
  for (let k = 0; k < nL; k++) {
    const u = inner.u0 + (k + 0.5) * (inner.u1 - inner.u0) / nL;
    if (kind === 'laundry') { box(M.bulbSoft, u, y0 + gfH - 0.15, dep / 2, 0.2, 0.06, dep * 0.7, palette.light); continue; }
    const ly = Math.max(y0 + 2.3, y0 + gfH - 1.2);
    box(M.metal, u, (ly + y0 + gfH) / 2, 2.2, 0.01, y0 + gfH - ly, 0.01, 0x222222);
    prim('sphere', M.bulb, u, ly, 2.2, 0.22, 0.22, 0.22, palette.light);
    prim('cone', M.metal, u, ly + 0.15, 2.2, 0.42, 0.25, 0.42, kind === 'tea' ? 0xd8c8a0 : 0x2a3a2a);
  }
  const [lx, lz] = P(0, dep * 0.45);
  cb.light(lx, y0 + 3.0, lz, palette.light, 26, Math.max(len, dep) * 1.1, 'cafe');
  const [px2, pz2] = P(0, -1.8);
  cb.pool(px2, pz2, Math.min(len * 0.5, 4.5), palette.light, 0.6, 'shop');
  // furnishings
  if (kind === 'laundry') {
    const nW = Math.floor((dep - 3) / 0.85);
    for (let k = 0; k < nW; k++) {
      const w = 1.5 + k * 0.85;
      for (const u of [inner.u0 + 0.45, inner.u0 + 0.45]) {
        box(M.paint, u, y0 + 0.5, w, 0.8, 1.0, 0.8, 0xf4f4f2);
        const [dx, dz] = P(u + 0.41, w);
        cb.batch.prim('cyl', M.glass, dx, y0 + 0.55, dz, 0.5, 0.04, 0.5, 0xffffff);
        cb.batch.prim('cyl', M.bulbSoft, dx + ux * 0.0, y0 + 0.55, dz, 0.56, 0.02, 0.56, 0x9ad0ff);
      }
      box(M.paint, inner.u0 + 0.45, y0 + 1.5, w, 0.8, 0.9, 0.8, 0xe8e8e6); // dryers stacked
    }
    addWall(inner.u0 + 0.45, dep / 2 + 0.75, 0.45, (dep - 3) / 2);
    box(M.paint, inner.u1 - 0.6, y0 + 0.85, dep / 2, 0.9, 0.08, dep * 0.5, 0xd8d0c0); // folding table
    addWall(inner.u1 - 0.6, dep / 2, 0.5, dep * 0.25);
    for (let k = 0; k < 4; k++) { const w = 2.0 + k * 0.9; chair(cb, P, box, inner.u0 + 1.8, y0, w, Math.atan2(ux, uz), palette.accent, 'laundromat chair', side); }
    staticPerson(cb, ...P(inner.u1 - 1.4, dep * 0.4), Math.atan2(ux, uz), { y: y0, working: true });
    staticPerson(cb, ...P(inner.u0 + 1.8, 2.9), Math.atan2(ux, uz), { y: y0, pose: 'sit', seatH: 0.48 });
  } else {
    // counter at the back
    const cw = Math.min(len - 2, 5.2), cu = o.doorLeft ? inner.u1 - cw / 2 - 0.3 : inner.u0 + cw / 2 + 0.3;
    const cW = dep - 2.4;
    box(M.paint, cu, y0 + 0.5, cW, cw, 1.0, 0.7, kind === 'tea' ? 0x5a3a22 : 0x4a2e1e);
    box(M.paint, cu, y0 + 1.03, cW, cw + 0.1, 0.06, 0.8, kind === 'tea' ? 0x3a2416 : 0xe8e4dc);
    addWall(cu, cW, cw / 2, 0.4);
    if (kind === 'cafe') {
      box(M.metal, cu - cw * 0.25, y0 + 1.3, cW, 0.7, 0.5, 0.5, 0xc8ccd2); // espresso machine
      prim('sphere', M.bulb, cu - cw * 0.25, y0 + 1.6, cW - 0.2, 0.06, 0.06, 0.06, 0xff6a3a);
      box(M.bulbSoft, cu + cw * 0.25, y0 + 1.3, cW - 0.05, 1.2, 0.45, 0.55, 0xffe0b0); // pastry case
      for (let k = 0; k < 3; k++) box(M.paint, cu - 1.2 + k * 1.2, y0 + 2.6, inner.w1 - 0.08, 1.0, 0.7, 0.04, 0x1e2420); // menu boards
      for (let k = 0; k < 10; k++) prim('cyl', M.paint, cu - cw / 2 + 0.3 + k * (cw - 0.6) / 9, y0 + 2.05, inner.w1 - 0.25, 0.14, 0.16, 0.14, rng.pick([0xf2ece0, 0x2a5a6a, 0xd86a4a, 0xf2ece0]));
      box(M.paint, cu, y0 + 1.95, inner.w1 - 0.25, cw, 0.04, 0.3, 0x4a2e1e);
    } else {
      for (let k = 0; k < 5; k++) prim('cyl', M.paint, cu - cw / 2 + 0.6 + k * (cw - 1.2) / 4, y0 + 1.15, cW, 0.18, 0.18, 0.18, rng.pick([0x8a6a4a, 0x3a5a3a, 0xd8d0c0]));
      box(M.fabricSolid, cu, y0 + 2.6, inner.w1 - 0.06, cw, 1.2, 0.02, palette.accent);
    }
    staticPerson(cb, ...P(cu, cW + 0.75), Math.atan2(-wx, -wz), { y: y0, working: true });
    // window counter with stools, facing the street — the best seat in town
    box(M.paint, 0, y0 + 1.05, 0.55, len - 1.2, 0.06, 0.45, kind === 'tea' ? 0x3a2416 : 0x5a3a22);
    const nS = Math.max(2, Math.floor((len - 2.2) / 1.2));
    for (let k = 0; k < nS; k++) {
      const u = inner.u0 + 0.8 + k * (inner.u1 - inner.u0 - 1.6) / Math.max(1, nS - 1);
      if (Math.abs(u - doorU) < 1.1) continue;
      prim('cyl', M.metal, u, y0 + 0.38, 1.05, 0.06, 0.76, 0.06, 0x222222);
      prim('cyl', M.paint, u, y0 + 0.78, 1.05, 0.38, 0.06, 0.38, 0x3a2416);
      const [sx2, sz2] = P(u, 1.1);
      if (k === 1 && nS > 2) staticPerson(cb, sx2, sz2, Math.atan2(-wx, -wz), { y: y0, pose: 'sit', seatH: 0.78, cup: true });
      else cb.seat(sx2, sz2, Math.atan2(wx, wz), kind === 'tea' ? 'window seat in the tea house' : 'window seat', y0 + 0.35);
    }
    // a couple of tables in the middle
    for (let k = 0; k < 2; k++) {
      const u = inner.u0 + 1.4 + k * (inner.u1 - inner.u0 - 2.8), w = dep * 0.48;
      if (Math.abs(u - cu) < cw / 2 + 0.6 && w > cW - 1.2) continue;
      prim('cyl', M.paint, u, y0 + (kind === 'tea' ? 0.35 : 0.74), w, 0.9, 0.05, 0.9, kind === 'tea' ? 0x3a2416 : 0x6a4a2e);
      prim('cyl', M.metal, u, y0 + 0.36, w, 0.06, 0.72, 0.06, 0x222222);
      const occ = k === 0;
      if (occ) { staticPerson(cb, ...P(u - 0.7, w), Math.atan2(ux, uz), { y: y0, pose: 'sit', seatH: kind === 'tea' ? 0.15 : 0.47, cup: true }); staticPerson(cb, ...P(u + 0.7, w), Math.atan2(-ux, -uz), { y: y0, pose: 'sit', seatH: kind === 'tea' ? 0.15 : 0.47 }); }
      else { const [tx, tz] = P(u - 0.7, w); cb.seat(tx, tz, Math.atan2(-ux, -uz) + Math.PI, kind === 'tea' ? 'cushion' : 'café table', y0); }
      cb.col.addCircle(...P(u, w), 0.5);
    }
    // plants
    prim('cyl', M.paint, inner.u0 + 0.4, y0 + 0.3, inner.w1 - 0.4, 0.45, 0.6, 0.45, 0x8a5a3a);
    prim('sphere', M.leaf, inner.u0 + 0.4, y0 + 1.1, inner.w1 - 0.4, 0.9, 1.1, 0.9, 0x4a7a3a);
  }
  // a staircase in the back corner (to the rooftop, when there is one)
  const stU = o.doorLeft ? inner.u0 + 0.7 : inner.u1 - 0.7;
  if (o.rooftop) {
    for (let k = 0; k < 8; k++) box(M.paint, stU, y0 + 0.12 + k * 0.25, inner.w1 - 0.6 - k * 0.3, 1.0, 0.24, 0.3, 0x5a4030);
    addWall(stU, inner.w1 - 1.6, 0.55, 1.2);
  }
  // register the indoor area (slightly inset)
  const [ax, az] = P(inner.u0, inner.w0), [bx, bz] = P(inner.u1, inner.w1);
  indoor(cb, { x0: Math.min(ax, bx), z0: Math.min(az, bz), x1: Math.max(ax, bx), z1: Math.max(az, bz) }, { kind, name: o.name });
  return { door: P(doorU, -1.0), stairs: P(stU, inner.w1 - 3.3), P, gfH, y0 };
}

function chair(cb, P, box, u, y0, w, yaw, col, label, side) {
  box(cb.mats.paint, u, y0 + 0.45, w, 0.45, 0.06, 0.45, col);
  box(cb.mats.paint, u - 0.2, y0 + 0.7, w, 0.06, 0.5, 0.45, col);
  const [x, z] = P(u, w);
  cb.seat(x, z, yaw + Math.PI, label, y0);
  void side;
}

// ------------------------------------------------------------------ rooftop terrace
export function rooftop(cb, b, H, doorStreet, name = 'rooftop') {
  const M = cb.mats, IM = mats(cb);
  const top = 0.15 + H;
  const r = { x0: b.x0 + 0.5, z0: b.z0 + 0.5, x1: b.x1 - 0.5, z1: b.z1 - 0.5 };
  const lv = makeLevel(cb, name, { floor: top, bounds: { minX: r.x0, maxX: r.x1, minZ: r.z0, maxZ: r.z1 }, label: 'Rooftop terrace' });
  const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  // decking
  const dk = new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0); dk.rotateX(-Math.PI / 2); dk.translate(cx, top + 0.05, cz);
  const uv = dk.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (r.x1 - r.x0) / 3, uv.getY(i) * (r.z1 - r.z0) / 3);
  cb.batch.addGeometry(dk, IM.wood, 0xb89a7a);
  // railing on top of the parapet
  for (const [ax, az, bx, bz] of [[r.x0, r.z0, r.x1, r.z0], [r.x1, r.z0, r.x1, r.z1], [r.x1, r.z1, r.x0, r.z1], [r.x0, r.z1, r.x0, r.z0]]) {
    cb.batch.beam(M.metal, v3(ax, top + 1.1, az), v3(bx, top + 1.1, bz), 0.05, 0x1a1a1a);
  }
  // stair bulkhead with the door down
  const bx = r.x0 + 1.6, bz = r.z0 + 1.8;
  cb.batch.box(M.paint, bx, top + 1.35, bz, 2.6, 2.7, 3.0, 0x6a5a4a);
  cb.batch.box(M.bulb, bx + 1.32, top + 2.2, bz, 0.06, 0.2, 0.2, 0xffc988);
  lv.col.addRect(bx - 1.3, bz - 1.5, bx + 1.3, bz + 1.5);
  cb.light(bx + 2, top + 2.3, bz, 0xffc988, 5, 7, 'porch');
  // string lights zig-zagging across
  for (let k = 0; k < 4; k++) {
    const za = r.z0 + 1 + k * (r.z1 - r.z0 - 2) / 3;
    for (let q = 0; q <= 12; q++) { const f = q / 12; cb.batch.prim('sphere', M.bulb, r.x0 + 0.5 + f * (r.x1 - r.x0 - 1), top + 3.0 - Math.sin(f * Math.PI) * 0.5, za, 0.09, 0.09, 0.09, 0xffd08a); }
  }
  for (const [px, pz] of [[r.x0 + 0.2, r.z0 + 0.2], [r.x1 - 0.2, r.z0 + 0.2], [r.x0 + 0.2, r.z1 - 0.2], [r.x1 - 0.2, r.z1 - 0.2]]) cb.batch.box(M.metal, px, top + 1.6, pz, 0.08, 3.2, 0.08, 0x222222);
  cb.light(cx, top + 2.6, cz, 0xffd08a, 9, 12, 'porch');
  // lounge chairs facing the skyline (north) and potted plants
  for (let k = 0; k < 3; k++) {
    const x = cx - 2 + k * 2, z = r.z1 - 2.2;
    cb.batch.box(M.paint, x, top + 0.35, z, 0.7, 0.12, 1.0, 0x2a5a6a);
    cb.batch.box(M.paint, x, top + 0.7, z + 0.45, 0.7, 0.7, 0.1, 0x2a5a6a);
    lv.seats.push({ x, z: z - 0.1, yaw: 0, label: 'deck chair with a view', y: top });
    lv.col.addBox(x, z, 0.4, 0.55);
  }
  for (const [px, pz] of [[r.x1 - 0.8, r.z0 + 0.8], [r.x1 - 0.8, cz], [cx, r.z0 + 0.8]]) {
    cb.batch.prim('cyl', M.paint, px, top + 0.4, pz, 0.8, 0.7, 0.8, 0x8a5a3a);
    cb.batch.prim('sphere', M.leaf, px, top + 1.2, pz, 1.2, 1.2, 1.2, 0x4a7a3a);
    lv.col.addCircle(px, pz, 0.45);
  }
  portal(cb, name, bx + 1.9, bz, 'Take the stairs back down', { level: null, x: doorStreet[0], z: doorStreet[1] });
  portal(cb, null, doorStreet[0], doorStreet[1], 'Take the stairs up to the rooftop', { level: name, x: bx + 2.2, z: bz, yaw: Math.PI });
  lv.spawn = { x: bx + 2.2, z: bz };
  return lv;
}

// ------------------------------------------------------------------ underground subway platform
export function subwayStation(cb, entrance, o = {}) {
  const M = cb.mats, IM = mats(cb);
  const Y = -9, L = 90, cx = o.x ?? entrance[0], cz = o.z ?? entrance[1] + 0;
  const pw = 7; // platform width; tracks run along +x at z = cz + pw/2 + 2
  const lv = makeLevel(cb, 'subway', { floor: Y, indoor: true, bounds: { minX: cx - L / 2 + 1, maxX: cx + L / 2 - 1, minZ: cz - pw / 2 + 0.3, maxZ: cz + pw / 2 - 0.45 }, label: o.name || 'Subway platform', sound: 'subway' });
  const g = new THREE.Group(); g.name = 'subway';
  const tileMat = IM.tile;
  // shell: floor, tracks bed, walls, ceiling — all facing inward
  cb.batch.box(M.paint, cx, Y - 0.5, cz, L, 1.0, pw, 0x8a8880);
  cb.batch.box(M.paint, cx, Y - 0.5, cz + pw / 2 - 0.25, L, 1.02, 0.5, 0xd8c040); // yellow edge strip
  cb.batch.box(M.paint, cx, Y - 1.6, cz + pw / 2 + 2.4, L, 0.2, 4.8, 0x2a2826);
  for (const dz of [1.6, 3.1]) cb.batch.box(M.metal, cx, Y - 1.4, cz + pw / 2 + dz, L, 0.15, 0.12, 0x6a6a6a);
  const wall = (z, h, col) => { const gg = new THREE.BoxGeometry(L, h, 0.3); const uv = gg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / 3, uv.getY(i) * h / 3); gg.translate(cx, Y + h / 2 - 1.7, z); cb.batch.addGeometry(gg, tileMat, col); };
  wall(cz - pw / 2 - 0.15, 6, 0xffffff);
  wall(cz + pw / 2 + 5.0, 6, 0xd8d4c8);
  cb.batch.box(M.paint, cx, Y + 4.4, cz + 1.2, L, 0.3, pw + 10, 0x6a6a64); // ceiling
  for (const x of [cx - L / 2, cx + L / 2]) cb.batch.box(M.paint, x, Y + 1.3, cz + 2.4, 0.3, 6, pw + 10, 0x0a0a0c); // tunnel mouths (dark)
  // mosaic name band and columns
  const nameMat = cb.track(new THREE.MeshBasicMaterial({ map: cb.track(makeSignTex(o.name || 'Perry St', '#1e5a3a', '#f2ead8', 'Helvetica, Arial, sans-serif')), color: new THREE.Color(1.1, 1.1, 1.1) }));
  for (let k = -2; k <= 2; k++) {
    const sg = new THREE.PlaneGeometry(3.2, 0.6); sg.translate(cx + k * 16, Y + 2.6, cz - pw / 2 + 0.01);
    cb.batch.addGeometry(sg, nameMat, 0xffffff);
  }
  for (let x = cx - L / 2 + 6; x < cx + L / 2 - 4; x += 7) {
    cb.batch.box(M.metal, x, Y + 2.0, cz + pw / 2 - 1.0, 0.35, 4.4, 0.35, 0x2a4a3a);
    lv.col.addCircle(x, cz + pw / 2 - 1.0, 0.3);
    cb.batch.box(M.bulbSoft, x, Y + 4.15, cz, 0.12, 0.06, 3.0, 0xe8f0ff);
  }
  for (let x = cx - L / 2 + 9; x < cx + L / 2 - 4; x += 14) cb.light(x, Y + 3.6, cz, 0xe8eeff, 14, 14, 'subway');
  // benches & waiting people
  for (let k = -2; k <= 2; k++) {
    const x = cx + k * 14 + 3.5, z = cz - pw / 2 + 0.6;
    cb.batch.box(M.bark, x, Y + 0.45, z, 2.2, 0.08, 0.45, 0x6a4a2e);
    cb.batch.box(M.bark, x, Y + 0.75, z - 0.2, 2.2, 0.5, 0.06, 0x6a4a2e);
    lv.col.addBox(x, z, 1.1, 0.3);
    if (k % 2 === 0) staticPerson(cb, x - 0.5, z + 0.12, 0, { y: Y, pose: 'sit', seatH: 0.48 });
    lv.seats.push({ x: x + 0.5, z: z + 0.35, yaw: Math.PI, label: 'platform bench', y: Y });
  }
  for (let k = 0; k < 4; k++) staticPerson(cb, cx - 20 + k * 12 + cb.rng.range(-2, 2), cz + cb.rng.range(-1.5, 1.5), cb.rng.range(-0.5, 0.5) + Math.PI, { y: Y });
  // stairs up (portal back to the street)
  const sx = cx - L / 2 + 4;
  for (let k = 0; k < 10; k++) cb.batch.box(M.paint, sx + k * 0.32, Y + k * 0.25 + 0.12, cz - pw / 2 + 1.2, 0.32, 0.25 + k * 0.5, 1.8, 0x9a968c);
  lv.col.addRect(sx - 0.2, cz - pw / 2, sx + 3.4, cz - pw / 2 + 2.2);
  portal(cb, 'subway', sx + 4.2, cz - pw / 2 + 1.4, 'Climb the stairs back to the street', { level: null, x: entrance[0] + (o.exitDx ?? 0), z: entrance[1] + (o.exitDz ?? 2.6) });
  portal(cb, null, entrance[0], entrance[1], 'Go down to the subway', { level: 'subway', x: sx + 4.8, z: cz - pw / 2 + 1.6, yaw: -Math.PI / 2 });
  // the train: arrives, waits with doors open, leaves
  const train = new THREE.Group();
  const bodyMat = cb.track(new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.35, metalness: 0.75 }));
  const winMat = cb.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.0) }));
  const carG = cb.track(new THREE.BoxGeometry(15, 3.2, 3.0)), winG = cb.track(new THREE.BoxGeometry(13.6, 1.0, 3.06));
  const headG = cb.track(new THREE.BoxGeometry(0.1, 0.3, 0.6)), headM = cb.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5, 4) }));
  for (let k = 0; k < 6; k++) {
    const c = new THREE.Mesh(carG, bodyMat); c.position.x = k * 15.4; train.add(c);
    const w = new THREE.Mesh(winG, winMat); w.position.set(k * 15.4, 0.35, 0); train.add(w);
  }
  for (const s of [-0.9, 0.9]) { const h = new THREE.Mesh(headG, headM); h.position.set(-7.6, -0.6, s); train.add(h); }
  train.position.set(cx - 400, Y - 0.1, cz + pw / 2 + 2.35);
  cb.group.add(train);
  const st = { phase: 'away', t: 18 };
  lv.train = st;
  cb.animated.push({ update: (dt) => {
    st.t -= dt;
    const stopX = cx - 2.5 * 15.4 + 2;
    if (st.phase === 'away' && st.t <= 0) { st.phase = 'arriving'; train.position.x = cx - L / 2 - 120; st.v = 16; lv.onTrain?.('arrive'); }
    if (st.phase === 'arriving') {
      const d = stopX - train.position.x;
      st.v = Math.max(0.6, Math.min(16, Math.sqrt(Math.max(0, 2 * 1.4 * d))));
      train.position.x += st.v * dt;
      if (d < 0.2) { st.phase = 'stopped'; st.t = 14; }
    } else if (st.phase === 'stopped' && st.t <= 0) { st.phase = 'leaving'; st.v = 0; lv.onTrain?.('leave'); }
    else if (st.phase === 'leaving') {
      st.v = Math.min(18, st.v + dt * 1.3); train.position.x += st.v * dt;
      if (train.position.x > cx + L / 2 + 140) { st.phase = 'away'; st.t = 45 + Math.random() * 30; train.position.x = cx - 400; }
    }
  } });
  // entrance kiosk on the street: railings, lamp globes, stairs going down
  const [ex, ez] = entrance;
  const ey = 0.15;
  for (const s of [-1, 1]) {
    cb.batch.box(M.metal, ex + s * 1.1, ey + 0.55, ez - 0.6, 0.06, 1.1, 3.2, 0x1e3a2a);
    cb.batch.prim('cyl', M.metal, ex + s * 1.1, ey + 1.5, ez - 2.1, 0.08, 1.9, 0.08, 0x1e3a2a);
    cb.batch.prim('sphere', M.bulb, ex + s * 1.1, ey + 2.55, ez - 2.1, 0.32, 0.32, 0.32, 0x5ad08a);
    cb.col.addRect(ex + s * 1.1 - 0.1, ez - 2.2, ex + s * 1.1 + 0.1, ez + 1.0);
  }
  cb.batch.box(M.metal, ex, ey + 0.55, ez - 2.2, 2.3, 1.1, 0.06, 0x1e3a2a);
  cb.col.addRect(ex - 1.15, ez - 2.3, ex + 1.15, ez - 2.1);
  for (let k = 0; k < 6; k++) cb.batch.box(M.paint, ex, ey - 0.15 - k * 0.22, ez - 1.6 + k * 0.4, 2.0, 0.08, 0.4, 0x8a867e);
  cb.light(ex, 2.6, ez - 2.1, 0x5ad08a, 4, 6, 'porch');
  cb.pool(ex, ez - 1, 2.5, 0x5ad08a, 0.35, 'porch');
  return lv;
}

// ------------------------------------------------------------------ elevated-train platform
export function elevatedPlatform(cb, S, x0, x1, y, stairsAt, o = {}) {
  const M = cb.mats, IM = mats(cb);
  const z0 = S.z + 3.0, z1 = S.z + 6.1;
  const lv = makeLevel(cb, 'lplatform', { floor: y, bounds: { minX: x0 + 0.5, maxX: x1 - 0.5, minZ: z0 + 0.2, maxZ: z1 - 0.3 }, label: o.name || 'Elevated platform' });
  const fl = new THREE.PlaneGeometry(x1 - x0, z1 - z0); fl.rotateX(-Math.PI / 2); fl.translate((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2);
  const uv = fl.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / 3, uv.getY(i));
  cb.batch.addGeometry(fl, IM.wood, 0x8a7a6a);
  cb.batch.box(M.paint, (x0 + x1) / 2, y - 0.2, (z0 + z1) / 2, x1 - x0, 0.4, z1 - z0, 0x4a4844);
  cb.batch.box(M.paint, (x0 + x1) / 2, y + 0.03, z0 + 0.15, x1 - x0, 0.02, 0.3, 0xd8c040);
  // canopy on posts, railing on the street side, signs
  for (let x = x0 + 2; x < x1; x += 6) { cb.batch.box(M.metal, x, y + 1.6, z1 - 0.4, 0.16, 3.2, 0.16, 0x3a4a5a); lv.col.addCircle(x, z1 - 0.4, 0.2); cb.batch.box(M.bulbSoft, x + 3, y + 3.0, (z0 + z1) / 2, 2.5, 0.05, 0.12, 0xf0f4ff); }
  cb.batch.box(M.roof, (x0 + x1) / 2, y + 3.25, (z0 + z1) / 2, x1 - x0 + 1, 0.15, z1 - z0 + 1, 0x3a4a5a);
  cb.batch.beam(M.metal, v3(x0, y + 1.1, z1 - 0.1), v3(x1, y + 1.1, z1 - 0.1), 0.06, 0x2a2d30);
  for (let x = x0 + 4; x < x1 - 2; x += 9) cb.light(x, y + 2.8, (z0 + z1) / 2, 0xf0f4ff, 8, 10, 'subway');
  for (let k = 0; k < 3; k++) {
    const x = x0 + 6 + k * (x1 - x0 - 12) / 2, z = z1 - 0.9;
    cb.batch.box(M.bark, x, y + 0.45, z, 2.0, 0.08, 0.45, 0x6a4a2e);
    cb.batch.box(M.bark, x, y + 0.75, z + 0.2, 2.0, 0.5, 0.06, 0x6a4a2e);
    lv.col.addBox(x, z, 1.0, 0.3);
    lv.seats.push({ x: x + 0.4, z: z - 0.35, yaw: 0, label: 'platform bench', y });
    if (k === 1) staticPerson(cb, x - 0.5, z - 0.1, Math.PI, { y, pose: 'sit', seatH: 0.48 });
  }
  staticPerson(cb, (x0 + x1) / 2 + 3, z0 + 1.2, Math.PI, { y });
  // stairs from the sidewalk up to the platform
  const [sx, sz] = stairsAt;
  for (let k = 0; k < 14; k++) cb.batch.box(M.metal, sx - 1.5 + k * 0.32, 0.15 + k * 0.5, sz, 0.34, 0.12, 1.6, 0x3a4a5a);
  cb.batch.beam(M.metal, v3(sx - 1.5, 1.1, sz - 0.85), v3(sx + 3, 7.6, sz - 0.85), 0.05, 0x2a2d30);
  cb.batch.beam(M.metal, v3(sx - 1.5, 1.1, sz + 0.85), v3(sx + 3, 7.6, sz + 0.85), 0.05, 0x2a2d30);
  cb.col.addRect(sx - 0.8, sz - 0.9, sx + 3.2, sz + 0.9);
  portal(cb, null, sx - 2.2, sz, 'Climb up to the elevated platform', { level: 'lplatform', x: x0 + 2.5, z: (z0 + z1) / 2, yaw: -Math.PI / 2 });
  portal(cb, 'lplatform', x0 + 1.4, (z0 + z1) / 2, 'Take the stairs back down', { level: null, x: sx - 2.6, z: sz });
  return lv;
}

// ------------------------------------------------------------------ covered market arcade
export function coveredArcade(cb, S, xa, xb, o = {}) {
  const M = cb.mats;
  const half = S.road / 2 + S.walk;
  const z0 = S.z - half, z1 = S.z + half, h = 6.2;
  for (let x = xa; x <= xb; x += 6) {
    for (const z of [z0 + 0.2, z1 - 0.2]) cb.batch.box(M.metal, x, h / 2, z, 0.18, h, 0.18, 0x3a2a20);
    cb.batch.beam(M.metal, v3(x, h, z0), v3(x, h + 1.2, S.z), 0.14, 0x3a2a20);
    cb.batch.beam(M.metal, v3(x, h + 1.2, S.z), v3(x, h, z1), 0.14, 0x3a2a20);
    // hanging banners and lanterns
    const lm = cb.lanternMats?.[Math.abs(Math.round(x / 6)) % 3];
    if (lm) { const g = new THREE.CylinderGeometry(0.24, 0.24, 0.5, 10); g.translate(x + 3, h - 0.9, S.z); cb.batch.addGeometry(g, lm, 0xffffff); }
    cb.batch.box(M.fabricSolid, x + 1.5, h - 1.1, S.z - 1.2, 0.02, 1.4, 0.7, [0x8a2a2a, 0x2a3a6a, 0xd8c8a0][Math.abs(Math.round(x / 6)) % 3]);
    cb.light(x + 3, h - 1.2, S.z, 0xffb070, 8, 10, 'neon');
    cb.pool(x + 3, S.z, 3.5, 0xffb070, 0.5, 'neon');
  }
  // translucent roof panels
  const roofMat = cb.track(new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.6, transparent: true, opacity: 0.55, side: THREE.DoubleSide, emissive: 0x3a2a18 }));
  for (const sgn of [-1, 1]) {
    const g = new THREE.PlaneGeometry(xb - xa, Math.hypot(half, 1.2));
    g.rotateX(-Math.PI / 2 + sgn * Math.atan2(1.2, half));
    g.translate((xa + xb) / 2, h + 0.6, S.z + sgn * half / 2);
    const m = new THREE.Mesh(g, roofMat); m.layers.set(LAYER_NO_REFLECT); cb.group.add(m); cb.track(g);
  }
  cb.map('plaza', [[xa, z0], [xb, z0], [xb, z1], [xa, z1]]);
  indoor(cb, { x0: xa, z0, x1: xb, z1 }, { kind: 'arcade', name: o.name || 'Covered market', open: true });
}
