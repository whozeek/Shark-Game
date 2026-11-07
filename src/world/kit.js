// The shared "street kit": materials and builders for buildings, street furniture, trees and lights.
// City modules combine these with their own landmarks so each place keeps a distinct identity.
import * as THREE from 'three';
import { patchGround, patchFacade, patchGlossy, patchWash } from '../render/shared.js';
import { makeAsphalt, makePaving, makeStripes, makeFacade, makeShopAtlas, makeNeonAtlas, makeLeaves } from '../render/textures.js';
import { worldUVBox, PRIM, compose } from './batcher.js';
import { vehicleParts, CAR_COLORS } from './vehicleGeo.js';
import { walkInShop, rooftop } from './interiors.js';

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function createMaterials(cb, q, opt = {}) {
  const T = (t) => cb.track(t);
  const M = {};
  const taps = q.reflTaps;
  M.asphalt = cb.track(patchGround(new THREE.MeshStandardMaterial({ map: T(makeAsphalt(3, opt.asphalt || '#2c2d31')), roughness: 0.92, vertexColors: true }), { puddleScale: 1, taps }));
  M.sidewalk = cb.track(patchGround(new THREE.MeshStandardMaterial({ map: T(makePaving(4, { base: opt.sidewalk || '#8e8c87', kind: opt.sidewalkKind })), roughness: 0.9, vertexColors: true }), { puddleScale: 0.55, taps }));
  M.ground = cb.track(new THREE.MeshStandardMaterial({ color: 0x3a3936, roughness: 1 }));
  M.marking = cb.track(patchGround(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, vertexColors: true }), { puddleScale: 0.8, taps }));
  M.curb = cb.track(patchWash(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, vertexColors: true })));
  M.paint = cb.track(patchWash(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, vertexColors: true })));
  M.stone = M.paint;
  M.metal = cb.track(patchGlossy(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.5, vertexColors: true }), { strengthUniform: 'uReflCar', base: 0.05, rainbowAmt: 0.1 }));
  M.glass = cb.track(patchGlossy(new THREE.MeshStandardMaterial({ color: 0x0d131c, roughness: 0.08, metalness: 0.3 }), { strengthUniform: 'uReflWindow', base: 0.25, rainbowAmt: 0.35 }));
  M.bulb = cb.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(6), vertexColors: true }));
  M.bulbSoft = cb.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(2.2), vertexColors: true }));
  M.leaf = cb.track(patchWash(new THREE.MeshStandardMaterial({ map: T(makeLeaves(21, '#c8d8b8', null)), color: 0xffffff, roughness: 0.8, vertexColors: true, side: THREE.DoubleSide }), 0.04, { leaf: true }));
  M.leaf.map.repeat.set(2, 2);
  M.bark = cb.track(patchWash(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, vertexColors: true }), 0.02));
  M.fabric = cb.track(patchWash(new THREE.MeshStandardMaterial({ map: T(makeStripes()), roughness: 0.9, vertexColors: true, side: THREE.DoubleSide }), 0.05));
  M.fabricSolid = cb.track(patchWash(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, vertexColors: true, side: THREE.DoubleSide }), 0.05));
  M.roof = cb.track(patchWash(new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.95, vertexColors: true }), 0.02));
  M.carPaint = cb.track(patchGlossy(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.4, vertexColors: true }), { strengthUniform: 'uReflCar', base: 0.08, rainbowAmt: 0.25 }));
  M.carGlass = cb.track(patchGlossy(new THREE.MeshStandardMaterial({ color: 0x0b0f15, roughness: 0.05, metalness: 0.5 }), { strengthUniform: 'uReflCar', base: 0.3, rainbowAmt: 0.45 }));
  M.rubber = cb.track(new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9, vertexColors: true }));
  M.water = cb.track(patchGround(new THREE.MeshStandardMaterial({ color: opt.water || 0x1b2a33, roughness: 0.1, vertexColors: true }), { puddleScale: 4, taps }));
  // Traffic signal lamps per axis & colour; brightness is animated each frame.
  M.sig = {};
  for (const axis of ['x', 'z']) {
    M.sig[axis] = {};
    for (const [k, col] of [['r', 0xff2a1a], ['y', 0xffb21a], ['g', 0x2affa0]]) {
      M.sig[axis][k] = cb.track(new THREE.MeshBasicMaterial({ color: col }));
      M.sig[axis][k].userData.base = new THREE.Color(col);
    }
  }
  return M;
}

/** Build a set of façade materials for a city from texture specs. */
/** Textured, rain-darkened grass/moss for parks, banks and gardens. */
export function grassMaterial(cb, tint = 0x5a7a48) {
  const tex = cb.track(makePaving(31, { kind: 'grass', base: '#3e5a32' }));
  tex.repeat.set(1, 1);
  return cb.track(patchGround(new THREE.MeshStandardMaterial({ map: tex, color: tint, roughness: 0.95, vertexColors: true }), { puddleScale: 0.25, taps: cb.q.reflTaps }));
}

export function facadeMaterials(cb, specs) {
  return specs.map((spec, i) => {
    const f = makeFacade({ seed: (spec.seed ?? 100) + i * 17, ...spec });
    cb.track(f.map); cb.track(f.emissive);
    const mat = patchFacade(new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 1, roughness: spec.roughness ?? 0.85, metalness: 0 }));
    cb.track(mat);
    cb.windowMats.push(mat);
    return { mat, tileW: f.tileW, tileH: f.tileH, spec };
  });
}

export function shopMaterial(cb, shops, seed, opts) {
  const a = makeShopAtlas(shops, seed, opts);
  cb.track(a.map); cb.track(a.emissive);
  const mat = cb.track(patchFacade(new THREE.MeshStandardMaterial({ map: a.map, emissiveMap: a.emissive, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 0.7, vertexColors: true }), { parallax: 0.006, shop: true }));
  cb.shopMats.push(mat);
  return { mat, atlas: a, shops };
}

/** Opening hours by shop type: [open, close] (close may exceed 24 for after midnight). */
export const SHOP_HOURS = {
  cafe: [6.5, 20], tea: [9, 18.5], bar: [16, 26], restaurant: [11, 23.5], deli: [0, 30], grocery: [7, 23],
  books: [9, 21], flowers: [8, 19], records: [11, 21.5], shop: [10, 20], laundry: [6, 24],
};
export function isOpen(hours, h) { if (!hours) return true; const [o, c] = hours; return (h >= o && h < c) || (h + 24 < c); }

const SIDES = {
  n: { nx: 0, nz: -1, ry: Math.PI },
  s: { nx: 0, nz: 1, ry: 0 },
  e: { nx: 1, nz: 0, ry: Math.PI / 2 },
  w: { nx: -1, nz: 0, ry: -Math.PI / 2 },
};

/** Façade quad on one side of a rectangle footprint. */
function faceQuad(side, b, y0, y1, uv) {
  const w = (side === 'n' || side === 's') ? b.x1 - b.x0 : b.z1 - b.z0;
  const h = y1 - y0;
  const g = new THREE.PlaneGeometry(w, h);
  const a = g.attributes.uv;
  for (let i = 0; i < a.count; i++) a.setXY(i, uv[0] + a.getX(i) * (uv[2] - uv[0]), uv[1] + a.getY(i) * (uv[3] - uv[1]));
  g.rotateY(SIDES[side].ry);
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  const px = side === 'e' ? b.x1 : side === 'w' ? b.x0 : cx;
  const pz = side === 's' ? b.z1 : side === 'n' ? b.z0 : cz;
  g.translate(px, (y0 + y1) / 2, pz);
  return { g, w };
}

/**
 * A building on rectangle {x0,z0,x1,z1}.
 * o: { h, fronts:['s'], facade, side, ground:'shop'|'facade'|'stoop'|'lobby', shop, gfH, cornice, roofKit, fireEscape, waterTower, awning, base }
 */
export function building(cb, b, o) {
  const M = cb.mats;
  const rng = cb.rng;
  const y0 = o.base ?? 0.15;
  const H = o.h;
  const fronts = o.fronts || ['s'];
  const fac = o.facade;
  // a requested walk-in café/laundromat/tea house takes over this lot's ground floor
  const req = fronts.length === 1 && (o.base ?? 0.15) < 0.5 && cb.walkIns.find((r) => !r.used && r.x > b.x0 && r.x < b.x1 && r.z > b.z0 && r.z < b.z1);
  if (req) {
    req.used = true; b.walkIn = req;
    o = { ...o, ground: 'shop', gfH: o.gfH ?? 4.2, awning: null, walkIn: req, collide: false };
  }
  const gfH = o.ground === 'shop' || o.ground === 'lobby' ? (o.gfH ?? 4.2) : 0;
  const sideFac = o.side || fac;
  const offU = rng.int(0, 7) * (fac.tileW / 4) / fac.tileW;
  const offV = rng.int(0, 3) / 4;
  for (const side of ['n', 's', 'e', 'w']) {
    const isFront = fronts.includes(side);
    const F = isFront ? fac : sideFac;
    const yStart = isFront ? y0 + gfH : y0;
    const { g, w } = faceQuad(side, b, yStart, y0 + H, [0, 0, 1, 1]);
    // world-scale UVs
    const uv = g.attributes.uv;
    const u1 = w / F.tileW, vh = (H - (isFront ? gfH : 0)) / F.tileH;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, offU + uv.getX(i) * u1, offV + (isFront ? 0 : 0.0) + uv.getY(i) * vh);
    cb.batch.addGeometry(g, F.mat);
    if (isFront && gfH > 0 && o.walkIn) {
      const w = walkInShop(cb, b, side, H, { ...o.walkIn, base: y0, gfH, doorLeft: cb.rng.chance(0.5) });
      if (o.walkIn.rooftop) rooftop(cb, b, H, w.stairs);
    } else if (isFront && gfH > 0) {
      if (o.ground === 'shop' && o.shop) {
        const s = o.shop; const a = s.atlas;
        const idx = o.shopIdx ?? rng.int(0, a.count - 1);
        const col = idx % a.cols, row = Math.floor(idx / a.cols);
        const uvr = [col / a.cols, 1 - (row + 1) / a.rows, (col + 1) / a.cols, 1 - row / a.rows];
        const { g: sg, w: sw } = faceQuad(side, b, y0, y0 + gfH, uvr);
        const S = SIDES[side];
        sg.translate(S.nx * 0.03, 0, S.nz * 0.03);
        const hrs = SHOP_HOURS[s.shops[idx]?.type] || [9, 20];
        cb.batch.addGeometry(sg, s.mat, new THREE.Color(hrs[0] / 30, hrs[1] / 30, 0.5));
        // spill light on the sidewalk + candidate point light
        const cx = side === 'e' ? b.x1 : side === 'w' ? b.x0 : (b.x0 + b.x1) / 2;
        const cz = side === 's' ? b.z1 : side === 'n' ? b.z0 : (b.z0 + b.z1) / 2;
        const shopName = s.shops[idx];
        const hue = shopName?.hue ?? 35;
        const col3 = new THREE.Color().setHSL(hue / 360, 0.75, 0.6);
        cb.pool(cx + S.nx * 1.8, cz + S.nz * 1.8, Math.min(sw * 0.45, 4.5), col3, 0.55, 'shop');
        cb.pools[cb.pools.length - 1].hours = hrs;
        cb.light(cx + S.nx * 1.2, 2.6, cz + S.nz * 1.2, col3, 14, 9, 'shop');
        cb.lights[cb.lights.length - 1].hours = hrs;
        // sign cornice
        cornice(cb, side, b, y0 + gfH, 0.35, 0.25, o.signTrim ?? 0x222222);
        if (o.awning) awning(cb, side, b, y0 + gfH - 0.25, o.awning);
      } else {
        // lobby / plain base: use facade with darker tone
        const { g: lg } = faceQuad(side, b, y0, y0 + gfH, [offU, 0, offU + w / F.tileW, gfH / F.tileH]);
        cb.batch.addGeometry(lg, F.mat);
      }
    }
  }
  // roof
  const roofG = new THREE.PlaneGeometry(b.x1 - b.x0, b.z1 - b.z0);
  roofG.rotateX(-Math.PI / 2); roofG.translate((b.x0 + b.x1) / 2, y0 + H, (b.z0 + b.z1) / 2);
  cb.batch.addGeometry(roofG, M.roof, o.roofColor ?? 0x3a3836);
  // parapet ring
  const pc = o.trim ?? 0x8a8478;
  const pw = 0.25, ph = o.parapet ?? 0.6;
  cb.batch.box(M.paint, (b.x0 + b.x1) / 2, y0 + H + ph / 2, b.z0 + pw / 2, b.x1 - b.x0, ph, pw, pc);
  cb.batch.box(M.paint, (b.x0 + b.x1) / 2, y0 + H + ph / 2, b.z1 - pw / 2, b.x1 - b.x0, ph, pw, pc);
  cb.batch.box(M.paint, b.x0 + pw / 2, y0 + H + ph / 2, (b.z0 + b.z1) / 2, pw, ph, b.z1 - b.z0, pc);
  cb.batch.box(M.paint, b.x1 - pw / 2, y0 + H + ph / 2, (b.z0 + b.z1) / 2, pw, ph, b.z1 - b.z0, pc);
  if (o.cornice !== false) for (const side of fronts) cornice(cb, side, b, y0 + H - 0.1, o.corniceH ?? 0.7, o.corniceD ?? 0.5, o.corniceColor ?? pc, true);
  // floor string courses on the front for depth
  if (o.ledges) for (const side of fronts) {
    for (let y = y0 + gfH + 3.2; y < y0 + H - 1; y += 3.2) cornice(cb, side, b, y, 0.14, 0.12, o.ledgeColor ?? pc);
  }
  if (o.fireEscape) for (const side of fronts) fireEscape(cb, side, b, y0 + Math.max(gfH, 3.4), y0 + H - 1.2, o.fireEscape === true ? 0x1f2326 : o.fireEscape);
  if (o.roofKit !== false) roofKit(cb, b, y0 + H, o);
  if (o.waterTower) waterTower(cb, b.x0 + (b.x1 - b.x0) * rng.range(0.3, 0.7), y0 + H, b.z0 + (b.z1 - b.z0) * rng.range(0.3, 0.7));
  if (o.ac) acUnits(cb, fronts, b, y0 + gfH, y0 + H);
  if (o.collide !== false) cb.col.addRect(b.x0, b.z0, b.x1, b.z1);
}

export function cornice(cb, side, b, y, h, d, color, brackets = false) {
  const S = SIDES[side];
  const horiz = side === 'n' || side === 's';
  const len = (horiz ? b.x1 - b.x0 : b.z1 - b.z0) + 0.2;
  const cx = side === 'e' ? b.x1 : side === 'w' ? b.x0 : (b.x0 + b.x1) / 2;
  const cz = side === 's' ? b.z1 : side === 'n' ? b.z0 : (b.z0 + b.z1) / 2;
  const px = cx + S.nx * d / 2, pz = cz + S.nz * d / 2;
  cb.batch.box(cb.mats.paint, px, y + h / 2, pz, horiz ? len : d, h, horiz ? d : len, color);
  cb.batch.box(cb.mats.paint, cx + S.nx * d * 0.35, y - 0.06, cz + S.nz * d * 0.35, horiz ? len - 0.1 : d * 0.7, 0.12, horiz ? d * 0.7 : len - 0.1, color);
  if (brackets) {
    const n = Math.floor(len / 1.1);
    for (let k = 0; k <= n; k++) {
      const a = -len / 2 + 0.1 + (len - 0.2) * k / Math.max(1, n);
      const bx = horiz ? cx + a : cx + S.nx * d * 0.4;
      const bz = horiz ? cz + S.nz * d * 0.4 : cz + a;
      cb.batch.box(cb.mats.paint, bx, y - 0.3, bz, horiz ? 0.16 : d * 0.75, 0.5, horiz ? d * 0.75 : 0.16, color);
    }
  }
}

export function awning(cb, side, b, y, o) {
  const S = SIDES[side];
  const horiz = side === 'n' || side === 's';
  const len = Math.min((horiz ? b.x1 - b.x0 : b.z1 - b.z0) - 0.8, o.width ?? 99);
  const depth = o.depth ?? 1.6, drop = o.drop ?? 0.6;
  const cx = side === 'e' ? b.x1 : side === 'w' ? b.x0 : (b.x0 + b.x1) / 2;
  const cz = side === 's' ? b.z1 : side === 'n' ? b.z0 : (b.z0 + b.z1) / 2;
  const slope = Math.atan2(drop, depth);
  const hyp = Math.hypot(depth, drop);
  const g = new THREE.PlaneGeometry(len, hyp);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / 1.6, uv.getY(i));
  // plane faces +z initially; tilt so it slopes down away from the wall
  g.rotateX(-Math.PI / 2 + slope);
  g.rotateY(SIDES[side].ry);
  g.translate(cx + S.nx * depth / 2, y - drop / 2, cz + S.nz * depth / 2);
  const mat = o.solid ? cb.mats.fabricSolid : cb.mats.fabric;
  cb.batch.addGeometry(g, mat, o.color);
  // valance
  const vg = new THREE.PlaneGeometry(len, 0.3);
  const vuv = vg.attributes.uv; for (let i = 0; i < vuv.count; i++) vuv.setXY(i, vuv.getX(i) * len / 1.6, vuv.getY(i) * 0.3);
  vg.rotateY(SIDES[side].ry);
  vg.translate(cx + S.nx * depth, y - drop - 0.15, cz + S.nz * depth);
  cb.batch.addGeometry(vg, mat, o.color);
  // shelter area for the player
  const x0 = horiz ? cx - len / 2 : Math.min(cx, cx + S.nx * depth);
  const x1 = horiz ? cx + len / 2 : Math.max(cx, cx + S.nx * depth);
  const z0 = horiz ? Math.min(cz, cz + S.nz * depth) : cz - len / 2;
  const z1 = horiz ? Math.max(cz, cz + S.nz * depth) : cz + len / 2;
  cb.shelters.push({ x0, z0, x1, z1, label: 'awning' });
}

export function fireEscape(cb, side, b, yStart, yEnd, color) {
  const S = SIDES[side];
  const horiz = side === 'n' || side === 's';
  const len = horiz ? b.x1 - b.x0 : b.z1 - b.z0;
  if (len < 6) return;
  const w = Math.min(4.2, len * 0.45), d = 1.0;
  const along = cb.rng.range(-len / 2 + w / 2 + 0.4, len / 2 - w / 2 - 0.4);
  const cx = side === 'e' ? b.x1 : side === 'w' ? b.x0 : (b.x0 + b.x1) / 2;
  const cz = side === 's' ? b.z1 : side === 'n' ? b.z0 : (b.z0 + b.z1) / 2;
  const M = cb.mats;
  const P = (a, out, y) => horiz ? v3(cx + a, y, cz + S.nz * out) : v3(cx + S.nx * out, y, cz + a);
  const floors = [];
  for (let y = yStart; y <= yEnd; y += 3.2) floors.push(y);
  floors.forEach((y, k) => {
    const c = P(along, d / 2, y);
    cb.batch.box(M.metal, c.x, y, c.z, horiz ? w : d, 0.06, horiz ? d : w, color);
    // rails
    const top = y + 0.95;
    const a0 = along - w / 2, a1 = along + w / 2;
    cb.batch.beam(M.metal, P(a0, d, top), P(a1, d, top), 0.04, color);
    cb.batch.beam(M.metal, P(a0, d, y + 0.45), P(a1, d, y + 0.45), 0.025, color);
    cb.batch.beam(M.metal, P(a0, 0, top), P(a0, d, top), 0.04, color);
    cb.batch.beam(M.metal, P(a1, 0, top), P(a1, d, top), 0.04, color);
    for (let t = 0; t <= 6; t++) { const a = a0 + (a1 - a0) * t / 6; cb.batch.beam(M.metal, P(a, d, y), P(a, d, top), 0.025, color); }
    // ladder to next floor
    if (k < floors.length - 1) {
      const dir = k % 2 ? 1 : -1;
      const la = along + dir * (w / 2 - 0.9), lb = along - dir * (w / 2 - 0.9);
      cb.batch.beam(M.metal, P(la, d * 0.25, y), P(lb, d * 0.25, y + 3.2), 0.05, color);
      cb.batch.beam(M.metal, P(la, d * 0.75, y), P(lb, d * 0.75, y + 3.2), 0.05, color);
      for (let t = 1; t < 8; t++) {
        const a = la + (lb - la) * t / 8, yy = y + 3.2 * t / 8;
        cb.batch.beam(M.metal, P(a, d * 0.25, yy), P(a, d * 0.75, yy), 0.03, color);
      }
    }
  });
  // drop ladder (raised)
  const fl = floors[0];
  cb.batch.beam(M.metal, P(along + w / 2 - 0.4, d * 0.9, fl), P(along + w / 2 - 0.4, d * 0.9, fl - 1.6), 0.04, color);
  cb.batch.beam(M.metal, P(along + w / 2 - 0.9, d * 0.9, fl), P(along + w / 2 - 0.9, d * 0.9, fl - 1.6), 0.04, color);
}

export function roofKit(cb, b, y, o) {
  const rng = cb.rng; const M = cb.mats;
  const n = rng.int(1, 3);
  for (let i = 0; i < n; i++) {
    const w = rng.range(0.8, 1.8), d = rng.range(0.8, 1.6), h = rng.range(0.6, 1.3);
    const x = rng.range(b.x0 + 1 + w / 2, Math.max(b.x0 + 1 + w / 2, b.x1 - 1 - w / 2));
    const z = rng.range(b.z0 + 1 + d / 2, Math.max(b.z0 + 1 + d / 2, b.z1 - 1 - d / 2));
    cb.batch.box(M.metal, x, y + h / 2, z, w, h, d, rng.pick([0x8c9096, 0x6c7076, 0x9a9488]));
  }
  if (rng.chance(0.5) && b.x1 - b.x0 > 5 && b.z1 - b.z0 > 5) { // stair bulkhead
    const x = (b.x0 + b.x1) / 2 + rng.range(-1, 1), z = (b.z0 + b.z1) / 2 + rng.range(-1, 1);
    cb.batch.box(M.paint, x, y + 1.3, z, 2.4, 2.6, 2.8, o.trim ?? 0x6a645c);
  }
}

export function waterTower(cb, x, y, z) {
  const M = cb.mats; const wood = 0x6b4a34;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cb.batch.prim('cyl6', M.metal, x + dx * 1.1, y + 1.5, z + dz * 1.1, 0.12, 3, 0.12, 0x2a2a2a);
  cb.batch.box(M.metal, x, y + 3.0, z, 2.8, 0.12, 2.8, 0x2a2a2a);
  cb.batch.prim('cyl', M.bark, x, y + 4.6, z, 2.6, 3.2, 2.6, wood);
  for (let k = 0; k < 4; k++) cb.batch.prim('cyl', M.metal, x, y + 3.4 + k * 0.85, z, 2.66, 0.06, 2.66, 0x222222);
  cb.batch.prim('cone', M.roof, x, y + 6.7, z, 2.9, 1.1, 2.9, 0x3a3230);
}

export function acUnits(cb, fronts, b, yFrom, yTo) {
  const rng = cb.rng; const M = cb.mats;
  for (const side of fronts) {
    const S = SIDES[side];
    const horiz = side === 'n' || side === 's';
    const len = horiz ? b.x1 - b.x0 : b.z1 - b.z0;
    const cx = side === 'e' ? b.x1 : side === 'w' ? b.x0 : (b.x0 + b.x1) / 2;
    const cz = side === 's' ? b.z1 : side === 'n' ? b.z0 : (b.z0 + b.z1) / 2;
    for (let y = yFrom + 1.1; y < yTo - 2; y += 3.2) {
      if (!rng.chance(0.35)) continue;
      const a = rng.range(-len / 2 + 0.8, len / 2 - 0.8);
      const px = horiz ? cx + a : cx + S.nx * 0.25, pz = horiz ? cz + S.nz * 0.25 : cz + a;
      cb.batch.box(M.metal, px, y, pz, horiz ? 0.7 : 0.5, 0.45, horiz ? 0.5 : 0.7, 0xb8b6ae);
    }
  }
}

/** Brownstone stoop leading up to a raised parlour door. side: building face; a: position along face. */
export function stoop(cb, side, b, along, o = {}) {
  const S = SIDES[side];
  const horiz = side === 'n' || side === 's';
  const cx = side === 'e' ? b.x1 : side === 'w' ? b.x0 : (b.x0 + b.x1) / 2;
  const cz = side === 's' ? b.z1 : side === 'n' ? b.z0 : (b.z0 + b.z1) / 2;
  const M = cb.mats;
  const steps = 6, rise = 0.22, run = 0.26, w = 1.7;
  const color = o.color ?? 0x6e4a3a;
  const base = 0.15;
  const P = (a, out) => horiz ? [cx + a, cz + S.nz * out] : [cx + S.nx * out, cz + a];
  for (let k = 0; k < steps; k++) {
    const out = (steps - k) * run - run / 2;
    const h = (k + 1) * rise;
    const [x, z] = P(along, out);
    cb.batch.box(M.paint, x, base + h / 2, z, horiz ? w : run, h, horiz ? run : w, color);
  }
  // landing
  const [lx, lz] = P(along, 0.4);
  cb.batch.box(M.paint, lx, base + steps * rise / 2, lz, horiz ? w + 0.2 : 0.8, steps * rise, horiz ? 0.8 : w + 0.2, color);
  // railings (wrought iron)
  for (const s of [-1, 1]) {
    const a = along + s * (w / 2 + 0.04);
    const [x0, z0] = P(a, steps * run + 0.1), [x1, z1] = P(a, 0.2);
    cb.batch.beam(M.metal, v3(x0, base + 0.9, z0), v3(x1, base + steps * rise + 0.9, z1), 0.05, 0x151515);
    for (let t = 0; t <= 6; t++) {
      const f = t / 6; const x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, yb = base + steps * rise * f;
      cb.batch.beam(M.metal, v3(x, yb, z), v3(x, yb + 0.9, z), 0.03, 0x151515);
    }
    const [nx, nz] = P(a, steps * run + 0.1);
    cb.batch.prim('sphere', M.metal, nx, base + 1.0, nz, 0.12, 0.12, 0.12, 0x151515);
  }
  // door + transom glow
  const [dx, dz] = P(along, 0.02);
  const doorY = base + steps * rise;
  cb.batch.box(M.paint, dx, doorY + 1.2, dz, horiz ? 1.3 : 0.1, 2.4, horiz ? 0.1 : 1.3, o.door ?? cb.rng.pick([0x3b2416, 0x1d2a22, 0x4a1f1c, 0x16202e]));
  cb.batch.box(M.bulbSoft, dx + S.nx * 0.03, doorY + 2.6, dz + S.nz * 0.03, horiz ? 1.1 : 0.06, 0.3, horiz ? 0.06 : 1.1, 0xffc27a);
  cb.batch.box(M.paint, dx + S.nx * 0.08, doorY + 2.9, dz + S.nz * 0.08, horiz ? 1.8 : 0.2, 0.18, horiz ? 0.2 : 1.8, o.trim ?? 0x5e4033);
  // porch light
  const [plx, plz] = P(along + 1.05, 0.15);
  cb.batch.prim('sphere', M.bulb, plx, doorY + 2.2, plz, 0.16, 0.22, 0.16, 0xffd29a);
  cb.light(plx + S.nx * 0.6, doorY + 2.1, plz + S.nz * 0.6, 0xffc988, 4, 6, 'porch');
  cb.pool(...P(along, steps * run * 0.6), 1.8, 0xffc988, 0.35, 'porch');
  // collision footprint
  const [c0x, c0z] = P(along, steps * run / 2 + 0.1);
  cb.col.addBox(c0x, c0z, horiz ? w / 2 + 0.15 : steps * run / 2 + 0.1, horiz ? steps * run / 2 + 0.1 : w / 2 + 0.15);
}

// ---------------------------------------------------------------- street furniture
function keptClear(cb, x, z, r) {
  for (const [kx, kz, kr] of cb.keepClear || []) if (Math.hypot(x - kx, z - kz) < kr + r) return true;
  return false;
}

export function streetlight(cb, x, z, yaw, style = 'nyc', o = {}) {
  const M = cb.mats;
  if (!o.force && keptClear(cb, x, z, 0.5)) return;
  const dx = Math.cos(yaw), dz = Math.sin(yaw); // direction the arm reaches (toward the road)
  let hx, hz, hy, warm = o.color ?? 0xffc27a;
  if (style === 'nyc') {
    const h = 6.4, arm = 1.6;
    cb.batch.prim('cyl', M.metal, x, 0.5, z, 0.32, 1.0, 0.32, 0x1d2420);
    cb.batch.prim('cyl', M.metal, x, h / 2, z, 0.14, h, 0.14, 0x1d2420);
    hx = x + dx * arm; hz = z + dz * arm; hy = h - 0.3;
    cb.batch.beam(M.metal, v3(x, h - 0.2, z), v3(hx, h, hz), 0.08, 0x1d2420);
    cb.batch.beam(M.metal, v3(x, h - 0.9, z), v3(x + dx * arm * 0.6, h - 0.15, z + dz * arm * 0.6), 0.05, 0x1d2420);
    cb.batch.box(M.metal, hx, h - 0.05, hz, 0.7, 0.22, 0.5, 0x1d2420, -yaw);
    cb.batch.box(M.bulb, hx, h - 0.19, hz, 0.5, 0.06, 0.34, warm, -yaw);
  } else if (style === 'modern') {
    const h = 8.2, arm = 2.6;
    cb.batch.prim('cyl', M.metal, x, h / 2, z, 0.18, h, 0.18, 0x6d7177);
    hx = x + dx * arm; hz = z + dz * arm; hy = h - 0.3;
    cb.batch.beam(M.metal, v3(x, h - 0.1, z), v3(hx, h, hz), 0.1, 0x6d7177);
    cb.batch.box(M.metal, hx, h - 0.05, hz, 0.9, 0.18, 0.4, 0x6d7177, -yaw);
    cb.batch.box(M.bulb, hx, h - 0.16, hz, 0.7, 0.05, 0.3, warm, -yaw);
  } else if (style === 'globe' || style === 'deco') {
    const h = style === 'deco' ? 4.5 : 4.2;
    cb.batch.prim('cyl', M.metal, x, 0.6, z, 0.3, 1.2, 0.3, o.pole ?? 0x1c1c1c);
    cb.batch.prim('cyl', M.metal, x, h / 2, z, 0.1, h, 0.1, o.pole ?? 0x1c1c1c);
    hx = x; hz = z; hy = h + 0.3;
    cb.batch.prim('sphere', M.bulb, x, h + 0.3, z, 0.55, 0.55, 0.55, warm);
    if (style === 'deco') cb.batch.prim('cone', M.metal, x, h + 0.75, z, 0.4, 0.3, 0.4, o.pole ?? 0x1c1c1c);
  } else if (style === 'lantern') { // stone lantern / short post for Kyoto
    const h = 2.6;
    cb.batch.box(M.bark, x, h / 2, z, 0.16, h, 0.16, 0x2b1d14);
    cb.batch.box(M.bark, x + dx * 0.4, h, z + dz * 0.4, 0.9, 0.08, 0.1, 0x2b1d14, -yaw);
    hx = x + dx * 0.7; hz = z + dz * 0.7; hy = h - 0.45;
    cb.batch.prim('cyl', M.bulb, hx, hy, hz, 0.36, 0.55, 0.36, warm);
    cb.batch.prim('cyl', M.bark, hx, hy + 0.32, hz, 0.4, 0.06, 0.4, 0x1a1a1a);
  }
  const strength = o.strength ?? 1;
  cb.light(hx, hy - 0.2, hz, warm, (style === 'lantern' ? 6 : 26) * strength, style === 'lantern' ? 8 : 20, 'street');
  cb.pool(hx, hz, style === 'lantern' ? 2.6 : (style === 'modern' ? 7.5 : 6), warm, strength * (style === 'lantern' ? 0.6 : 1), 'street');
  if (style !== 'lantern' && o.cone !== false) cb.cone(hx, hy - 0.1, hz, style === 'modern' ? 3.2 : 2.5, hy - 0.1, warm, strength);
  cb.col.addCircle(x, z, style === 'nyc' ? 0.3 : 0.2);
}

export function tree(cb, x, z, o = {}) {
  const M = cb.mats; const rng = cb.rng;
  if (keptClear(cb, x, z, 2.5)) return;
  const s = o.scale ?? rng.range(0.85, 1.2);
  const kind = o.kind || 'street';
  if (kind === 'palm') {
    const h = (o.h ?? rng.range(7, 11)) * s;
    const lean = rng.range(-0.15, 0.15), leanDir = rng.f() * Math.PI * 2;
    const seg = 6; let px = x, pz = z;
    for (let k = 0; k < seg; k++) {
      const y0 = h * k / seg, y1 = h * (k + 1) / seg;
      const nx = x + Math.cos(leanDir) * lean * y1 * 0.3 * (y1 / h), nz = z + Math.sin(leanDir) * lean * y1 * 0.3 * (y1 / h);
      cb.batch.beam(M.bark, v3(px, y0, pz), v3(nx, y1, nz), 0.32 - k * 0.025, 0x8a7458, true);
      px = nx; pz = nz;
    }
    const top = v3(px, h, pz);
    const fronds = 10;
    for (let k = 0; k < fronds; k++) {
      const a = k / fronds * Math.PI * 2 + rng.f() * 0.3;
      const len = rng.range(3.0, 4.2) * s;
      const mid = v3(top.x + Math.cos(a) * len * 0.5, top.y + 0.5, top.z + Math.sin(a) * len * 0.5);
      const end = v3(top.x + Math.cos(a) * len, top.y - rng.range(0.8, 1.8), top.z + Math.sin(a) * len);
      const col = rng.pick([0x3f6b35, 0x4b7a3a, 0x355d2f]);
      leafBlade(cb, top, mid, 0.55 * s, col);
      leafBlade(cb, mid, end, 0.45 * s, col);
    }
    cb.batch.prim('sphere', M.bark, top.x, top.y - 0.2, top.z, 0.7, 0.6, 0.7, 0x6b5a3f);
    cb.col.addCircle(x, z, 0.35);
    return;
  }
  const trunkH = (kind === 'willow' ? 2.6 : kind === 'cherry' ? 2.0 : 3.3) * s;
  cb.batch.prim('cyl', M.bark, x, trunkH / 2, z, 0.26 * s, trunkH, 0.26 * s, 0x4a3a2c);
  const baseCol = o.color ?? (kind === 'cherry' ? 0xf6bfd2 : kind === 'pine' ? 0x2d4a2f : 0x5a8a45);
  const blobs = kind === 'willow' ? 8 : 14;
  for (let k = 0; k < blobs; k++) {
    const r = (kind === 'cherry' ? rng.range(0.65, 1.0) : rng.range(0.7, 1.15)) * s;
    const ang = rng.f() * Math.PI * 2, rad = Math.sqrt(rng.f()) * 1.7 * s;
    const bx = x + Math.cos(ang) * rad, bz = z + Math.sin(ang) * rad, by = trunkH + (0.6 + (1 - rad / (1.8 * s)) * 1.8 + rng.range(0, 0.6)) * s;
    const c = new THREE.Color(baseCol).offsetHSL(rng.range(-0.03, 0.03), rng.range(-0.05, 0.05), rng.range(-0.08, 0.08) + (by > trunkH + 2 * s ? 0.05 : -0.03));
    const g = blobGeo(rng.int(0, 2));
    g.applyMatrix4(compose(bx, by, bz, r, r * 0.85, r, 0, rng.f() * 6, 0));
    cb.batch.addGeometry(g, M.leaf, c);
    // branch to blob
    cb.batch.beam(M.bark, v3(x, trunkH * 0.85, z), v3(bx, by - r * 0.5, bz), 0.1 * s, 0x4a3a2c);
  }
  if (kind === 'willow') {
    for (let k = 0; k < 26; k++) {
      const a = rng.f() * Math.PI * 2, r = rng.range(1.0, 2.4) * s;
      const tx = x + Math.cos(a) * r, tz = z + Math.sin(a) * r, ty = trunkH + rng.range(1.5, 2.8) * s;
      cb.batch.beam(M.leaf, v3(tx, ty, tz), v3(tx + Math.cos(a) * 0.3, ty - rng.range(2.0, 3.4) * s, tz + Math.sin(a) * 0.3), 0.18, 0x5f8a45);
    }
  }
  if (o.pit !== false) {
    cb.batch.box(M.paint, x, 0.16, z, 1.3, 0.02, 1.3, 0x2a2420);
    if (o.fence) for (const [a, b2] of [[[-0.65, -0.65], [0.65, -0.65]], [[0.65, -0.65], [0.65, 0.65]], [[0.65, 0.65], [-0.65, 0.65]], [[-0.65, 0.65], [-0.65, -0.65]]]) {
      cb.batch.beam(M.metal, v3(x + a[0], 0.55, z + a[1]), v3(x + b2[0], 0.55, z + b2[1]), 0.03, 0x1b1f1c);
    }
  }
  cb.col.addCircle(x, z, o.fence ? 0.75 : 0.35);
}

function leafBlade(cb, a, b, w, color) {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  const g = new THREE.BoxGeometry(w, 0.04, len);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  cb.batch.addGeometry(g, cb.mats.leaf, color);
}

const blobCache = [];
function blobGeo(i) {
  if (!blobCache[i]) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const p = g.attributes.position;
    let seed = 1 + i * 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const map = new Map();
    for (let k = 0; k < p.count; k++) {
      const key = `${p.getX(k).toFixed(3)},${p.getY(k).toFixed(3)},${p.getZ(k).toFixed(3)}`;
      if (!map.has(key)) map.set(key, 0.78 + rnd() * 0.4);
      const f = map.get(key);
      p.setXYZ(k, p.getX(k) * f, p.getY(k) * f, p.getZ(k) * f);
    }
    g.computeVertexNormals();
    blobCache[i] = g;
  }
  return blobCache[i].clone();
}

export function hydrant(cb, x, z, color = 0xb8322a) {
  const M = cb.mats;
  cb.batch.prim('cyl', M.paint, x, 0.45, z, 0.26, 0.6, 0.26, color);
  cb.batch.prim('sphere', M.paint, x, 0.78, z, 0.28, 0.22, 0.28, color);
  cb.batch.prim('cyl', M.paint, x, 0.55, z, 0.42, 0.12, 0.12, color);
  cb.col.addCircle(x, z, 0.22);
}

export function trashCan(cb, x, z, color = 0x2f4a34) {
  cb.batch.prim('cyl', cb.mats.metal, x, 0.6, z, 0.55, 0.9, 0.55, color);
  cb.batch.prim('cyl', cb.mats.metal, x, 1.07, z, 0.6, 0.06, 0.6, 0x222222);
  cb.col.addCircle(x, z, 0.32);
}

export function bench(cb, x, z, yaw, o = {}) {
  const M = cb.mats;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const wood = o.color ?? 0x6b4a2f;
  const L = o.length ?? 1.8;
  const P = (a, b2) => [x + c * a - s * b2, z + s * a + c * b2];
  // seat slats
  for (let k = 0; k < 3; k++) { const [px, pz] = P(0, -0.15 + k * 0.15); cb.batch.box(M.paint, px, 0.6, pz, L, 0.05, 0.12, wood, -yaw); }
  if (o.back !== false) for (let k = 0; k < 2; k++) { const [px, pz] = P(0, 0.26); cb.batch.box(M.paint, px, 0.82 + k * 0.18, pz + 0, L, 0.1, 0.04, wood, -yaw); }
  for (const a of [-L / 2 + 0.15, L / 2 - 0.15]) { const [px, pz] = P(a, 0.02); cb.batch.box(M.metal, px, 0.4, pz, 0.06, 0.8, 0.55, 0x1c1c1c, -yaw); }
  const [sx, sz] = P(0, -0.35);
  // some benches already have someone on them; the rest are free to sit on
  const occupied = o.occupied ?? cb.rng.chance(0.28);
  if (occupied) {
    const [px, pz] = P(cb.rng.range(-L / 2 + 0.4, L / 2 - 0.4), -0.05);
    staticPerson(cb, px, pz, yaw + Math.PI, { pose: 'sit', seatH: 0.48, cup: cb.rng.chance(0.4) });
  }
  if (!occupied || L > 1.9) cb.seat(sx, sz, yaw + Math.PI, o.label || 'bench', 0.15);
  cb.col.addBox(x, z, L / 2, 0.32, yaw);
}

export function planter(cb, x, z, w = 1.2, flowers = true) {
  const M = cb.mats; const rng = cb.rng;
  cb.batch.box(M.paint, x, 0.45, z, w, 0.6, w * 0.6, 0x5a5550);
  if (flowers) for (let k = 0; k < 8; k++) cb.batch.prim('sphere', M.leaf, x + rng.range(-w / 2.4, w / 2.4), 0.85, z + rng.range(-w * 0.2, w * 0.2), 0.3, 0.25, 0.3, rng.pick([0x3e6b32, 0xd65a78, 0xf0c04a, 0x4f7f3a]));
  cb.col.addBox(x, z, w / 2, w * 0.3);
}

export function bollard(cb, x, z, color = 0x2b2e33) {
  cb.batch.prim('cyl', cb.mats.metal, x, 0.5, z, 0.22, 1.0, 0.22, color);
  cb.col.addCircle(x, z, 0.15);
}

export function newsBox(cb, x, z, yaw, color) {
  cb.batch.box(cb.mats.paint, x, 0.55, z, 0.5, 1.1, 0.45, color, -yaw);
  cb.col.addBox(x, z, 0.3, 0.3, yaw);
}

export function cafeSet(cb, x, z, yaw, umbrellaColor = null) {
  const M = cb.mats; const rng = cb.rng;
  cb.batch.prim('cyl', M.metal, x, 0.72, z, 0.7, 0.04, 0.7, 0x2a2a2a);
  cb.batch.prim('cyl', M.metal, x, 0.36, z, 0.06, 0.72, 0.06, 0x2a2a2a);
  for (const a of [0, Math.PI]) {
    const cx = x + Math.cos(yaw + a) * 0.7, cz = z + Math.sin(yaw + a) * 0.7;
    cb.batch.box(M.metal, cx, 0.45, cz, 0.42, 0.04, 0.42, 0x2a2a2a);
    cb.batch.box(M.metal, cx + Math.cos(yaw + a) * 0.2, 0.7, cz + Math.sin(yaw + a) * 0.2, 0.06, 0.5, 0.06, 0x2a2a2a);
    for (const l of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) cb.batch.box(M.metal, cx + l[0], 0.22, cz + l[1], 0.03, 0.45, 0.03, 0x2a2a2a);
  }
  if (umbrellaColor) {
    cb.batch.prim('cyl', M.metal, x, 1.3, z, 0.05, 2.4, 0.05, 0x333333);
    cb.batch.prim('cone', M.fabricSolid, x, 2.45, z, 2.4, 0.5, 2.4, umbrellaColor);
    cb.shelters.push({ x0: x - 1.1, z0: z - 1.1, x1: x + 1.1, z1: z + 1.1, label: 'café umbrella' });
  }
  const sx = x + Math.cos(yaw) * 0.7, sz = z + Math.sin(yaw) * 0.7;
  cb.seat(sx, sz, yaw + Math.PI, 'café seat', 0.15);
  cb.col.addCircle(x, z, 0.75);
  void rng;
}

export function busShelter(cb, x, z, yaw, o = {}) {
  const M = cb.mats;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const L = 4.0, D = 1.3, H = 2.5;
  const P = (a, b2) => [x + c * a - s * b2, z + s * a + c * b2];
  // roof
  cb.batch.box(M.metal, x, H, z, L + 0.2, 0.12, D + 0.2, 0x3b4046, -yaw);
  // posts
  for (const a of [-L / 2, L / 2]) for (const b2 of [-D / 2, D / 2]) { const [px, pz] = P(a, b2); cb.batch.box(M.metal, px, H / 2, pz, 0.08, H, 0.08, 0x3b4046, -yaw); }
  // back glass and side panels
  const [bx, bz] = P(0, D / 2);
  cb.batch.box(M.glass, bx, 1.35, bz, L, 2.0, 0.04, 0xffffff, -yaw);
  for (const a of [-L / 2, L / 2]) { const [px, pz] = P(a, 0.2); cb.batch.box(M.glass, px, 1.35, pz, 0.04, 2.0, D * 0.6, 0xffffff, -yaw); }
  // ad panel glow
  const [ax, az] = P(L / 2 - 0.05, -0.1);
  cb.batch.box(M.bulbSoft, ax, 1.4, az, 0.08, 1.6, 1.0, o.ad ?? 0x9ad7ff, -yaw);
  cb.light(...[ax - s * 0.0, 1.6, az], o.ad ?? 0x9ad7ff, 4, 6, 'shelter');
  // bench
  bench(cb, ...P(0, D / 2 - 0.45), yaw, { back: false, length: 2.2, label: 'bus shelter bench', occupied: true });
  const [wx, wz] = P(1.3, -0.1);
  staticPerson(cb, wx, wz, yaw + Math.PI + 0.4, {});
  (cb.busStops || (cb.busStops = [])).push({ x, z });
  cb.batch.box(M.bulbSoft, x, H - 0.08, z, L * 0.8, 0.04, 0.1, 0xeef4ff, -yaw);
  cb.pool(x, z, 2.4, 0xd8ecff, 0.3, 'shelter');
  const ex = Math.abs(c) * L / 2 + Math.abs(s) * D / 2, ez = Math.abs(s) * L / 2 + Math.abs(c) * D / 2;
  cb.shelters.push({ x0: x - ex, z0: z - ex * 0 - ez, x1: x + ex, z1: z + ez, label: 'bus shelter' });
  // collide the back glass only so you can step inside
  cb.col.addBox(bx, bz, L / 2, 0.08, yaw);
}

/** Traffic signal on a corner with a mast arm reaching over the road. */
export function trafficSignal(cb, x, z, armDir, armLen, axis, o = {}) {
  const M = cb.mats;
  const h = 5.6;
  cb.batch.prim('cyl', M.metal, x, h / 2, z, 0.2, h, 0.2, o.color ?? 0x2a2d30);
  const ex = x + armDir[0] * armLen, ez = z + armDir[1] * armLen;
  cb.batch.beam(M.metal, v3(x, h - 0.2, z), v3(ex, h - 0.2, ez), 0.12, o.color ?? 0x2a2d30);
  // heads facing oncoming traffic along `axis` (both directions)
  const heads = o.heads ?? [armLen * 0.55, armLen * 0.95];
  for (const f of heads) {
    const hx = x + armDir[0] * f, hz = z + armDir[1] * f;
    for (const face of [-1, 1]) {
      const fx = axis === 'x' ? face : 0, fz = axis === 'z' ? face : 0;
      const px = hx + fx * 0.2, pz = hz + fz * 0.2;
      cb.batch.box(M.metal, px, h - 0.95, pz, axis === 'x' ? 0.3 : 0.38, 1.1, axis === 'x' ? 0.38 : 0.3, 0x1b1d1f);
      const lamps = [['r', h - 0.6], ['y', h - 0.95], ['g', h - 1.3]];
      for (const [k, ly] of lamps) {
        cb.batch.prim('sphere', M.sig[axis][k], px + fx * 0.17, ly, pz + fz * 0.17, 0.22, 0.22, 0.08 + (axis === 'x' ? 0.14 : 0), 0xffffff);
      }
    }
  }
  cb.col.addCircle(x, z, 0.25);
}

/** Static parked car built from the shared vehicle parts. */
export function parkedCar(cb, x, z, yaw, type = 'sedan', color = null) {
  const parts = vehicleParts(type);
  const M = cb.mats;
  const m = compose(x, 0, z, 1, 1, 1, 0, -yaw, 0);
  const col = color ?? cb.rng.pick(CAR_COLORS);
  cb.batch.addGeometry(parts.body.clone().applyMatrix4(m), M.carPaint, col);
  cb.batch.addGeometry(parts.glass.clone().applyMatrix4(m), M.carGlass, 0xffffff);
  cb.batch.addGeometry(parts.wheels.clone().applyMatrix4(m), M.rubber, 0x151515);
  cb.batch.addGeometry(parts.rear.clone().applyMatrix4(m), M.paint, 0x5a0e0e);
  cb.batch.addGeometry(parts.front.clone().applyMatrix4(m), M.paint, 0xbfc4c9);
  if (parts.extra) cb.batch.addGeometry(parts.extra.clone().applyMatrix4(m), M.paint, 0xf2e6b0);
  if (parts.trim) cb.batch.addGeometry(parts.trim.clone().applyMatrix4(m), M.metal, 0xc8ccd2);
  if (parts.bumpers) cb.batch.addGeometry(parts.bumpers.clone().applyMatrix4(m), M.rubber, 0x222326);
  cb.col.addBox(x, z, parts.length / 2, parts.width / 2, yaw);
  cb.parked.push({ x, z, yaw });
}

export function rectOfBlock(blk, inset = 0) { return { x0: blk.x0 + inset, z0: blk.z0 + inset, x1: blk.x1 - inset, z1: blk.z1 - inset }; }

/**
 * Split a block into building lots along each street-facing side ("perimeter block").
 * Returns lots: [{ x0,z0,x1,z1, side, corner }] with depth `depth`.
 */
export function perimeterLots(blk, rng, { depth = 14, minW = 6, maxW = 11, sides = ['n', 's', 'e', 'w'] } = {}) {
  const lots = [];
  const W = blk.x1 - blk.x0, D = blk.z1 - blk.z0;
  const dz = Math.min(depth, D / 2), dx = Math.min(depth, W / 2);
  const split = (a0, a1) => {
    const out = []; let a = a0;
    while (a1 - a > minW * 1.5) { const w = rng.range(minW, maxW); out.push([a, a + w]); a += w; }
    out.push([a, a1]);
    return out;
  };
  // n & s sides span full width; e & w fill the middle
  if (sides.includes('n')) for (const [a, b] of split(blk.x0, blk.x1)) lots.push({ x0: a, x1: b, z0: blk.z0, z1: blk.z0 + dz, side: 'n' });
  if (sides.includes('s')) for (const [a, b] of split(blk.x0, blk.x1)) lots.push({ x0: a, x1: b, z0: blk.z1 - dz, z1: blk.z1, side: 's' });
  const zz0 = blk.z0 + (sides.includes('n') ? dz : 0), zz1 = blk.z1 - (sides.includes('s') ? dz : 0);
  if (zz1 - zz0 > 3) {
    if (sides.includes('w')) for (const [a, b] of split(zz0, zz1)) lots.push({ z0: a, z1: b, x0: blk.x0, x1: blk.x0 + dx, side: 'w' });
    if (sides.includes('e')) for (const [a, b] of split(zz0, zz1)) lots.push({ z0: a, z1: b, x0: blk.x1 - dx, x1: blk.x1, side: 'e' });
  }
  return lots;
}

export { SIDES, PRIM, worldUVBox };

// ---------------------------------------------------------------- neon & signs

/** Create the per-city neon material from a list of sign texts. */
export function neonMaterial(cb, items) {
  const a = makeNeonAtlas(items);
  cb.track(a.tex);
  const mat = cb.track(new THREE.MeshBasicMaterial({ map: a.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: new THREE.Color(1, 1, 1).multiplyScalar(3) }));
  mat.userData.base = 3;
  cb.neonMats.push(mat);
  cb.neon = { mat, atlas: a, items };
  return cb.neon;
}

/** Neon sign quad. mount: 'blade' projects from the wall (perpendicular), 'flat' sits on the wall. */
export function neonSign(cb, x, y, z, yaw, idx, o = {}) {
  const N = cb.neon; if (!N) return;
  const { cols, rows } = N.atlas;
  const col = idx % cols, row = Math.floor(idx / cols);
  const w = o.w ?? 1.8, h = o.h ?? w * 160 / 512;
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  const u0 = col / cols, u1 = (col + 1) / cols, v0 = 1 - (row + 1) / rows, v1 = 1 - row / rows;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  if (o.vertical) g.rotateZ(Math.PI / 2);
  g.rotateY(-yaw);
  g.translate(x, y, z);
  cb.batch.addGeometry(g, N.mat, 0xffffff);
  const color = new THREE.Color(N.items[idx].color);
  if (o.backing !== false) cb.batch.box(cb.mats.paint, x - Math.sin(-yaw) * 0.0, y, z, Math.abs(Math.cos(yaw)) * (o.vertical ? h : w) + 0.08, (o.vertical ? w : h) + 0.1, Math.abs(Math.sin(yaw)) * (o.vertical ? h : w) + 0.08, 0x111111, 0);
  cb.light(x, y, z, color, 8 * (o.strength ?? 1), 9, 'neon');
  cb.pool(x + (o.poolDx ?? 0), z + (o.poolDz ?? 0), 2.6, color, 0.5 * (o.strength ?? 1), 'neon');
}

// ---------------------------------------------------------------- static people & street vendors
const P_COATS = [0x1f2a3a, 0x2b2b2e, 0xa8835a, 0x4a4f36, 0x5c1f2a, 0x3a3f45, 0x8a6a2a, 0x22352b, 0x6a6e74, 0x7a3b2e, 0x384a63, 0xc9b79a];
const P_SKIN = [0xf1d3bd, 0xe5b896, 0xc98e68, 0xa86f4c, 0x8a5537, 0x5e3a26];
const P_HAIR = [0x141110, 0x2a1d16, 0x5a3c26, 0x8a5a34, 0xb88a52, 0x8d8a86];
const P_PANTS = [0x1c2433, 0x121214, 0x3a3a3e, 0x2c3a52, 0x5a4e3c];

/**
 * A person who stays put (sitting on a bench, standing at a cart, waiting for the bus).
 * yaw: the direction they face (atan2 of forward x,z).
 */
export function staticPerson(cb, x, z, yaw, o = {}) {
  const M = cb.mats; const rng = cb.rng;
  const y = o.y ?? 0.15;
  const coat = o.coat ?? rng.pick(P_COATS), skin = rng.pick(P_SKIN), hair = rng.pick(P_HAIR), pants = rng.pick(P_PANTS);
  const s = o.scale ?? rng.range(0.92, 1.06);
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = fz, rz = -fx;
  const at = (fwd, up, right) => [x + fx * fwd * s + rx * right * s, y + up * s, z + fz * fwd * s + rz * right * s];
  const box = (p, sx, sy, sz, col, pitch = 0) => cb.batch.box(M.paint, p[0], p[1], p[2], sx * s, sy * s, sz * s, col, yaw, pitch);
  if (o.pose === 'sit') {
    const seat = o.seatH ?? 0.45;
    for (const sd of [-0.1, 0.1]) {
      box(at(0.2, seat + 0.07, sd), 0.13, 0.13, 0.42, pants);           // thigh
      box(at(0.4, seat / 2, sd), 0.11, seat, 0.11, pants);             // shin
      box(at(0.45, 0.04, sd), 0.1, 0.07, 0.22, 0x1a1a1a);              // shoe
    }
    box(at(-0.02, seat + 0.42, 0), 0.38, 0.58, 0.22, coat, -0.08);      // torso
    for (const sd of [-0.22, 0.22]) box(at(0.12, seat + 0.36, sd), 0.09, 0.09, 0.36, coat, 0.6);
    const hp = at(0.0, seat + 0.86, 0);
    cb.batch.prim('sphere', M.paint, hp[0], hp[1], hp[2], 0.2 * s, 0.24 * s, 0.21 * s, skin);
    cb.batch.prim('sphere', M.paint, hp[0] - fx * 0.02, hp[1] + 0.04 * s, hp[2] - fz * 0.02, 0.22 * s, 0.17 * s, 0.22 * s, hair);
    if (o.cup) { const c = at(0.3, seat + 0.32, 0.18); cb.batch.prim('cyl', M.paint, c[0], c[1], c[2], 0.07, 0.1, 0.07, 0xf2ece0); }
  } else {
    for (const sd of [-0.1, 0.1]) { box(at(0, 0.45, sd), 0.13, 0.9, 0.14, pants); box(at(0.04, 0.04, sd), 0.1, 0.07, 0.24, 0x1a1a1a); }
    box(at(0, 1.2, 0), 0.4, 0.62, 0.24, coat);
    for (const sd of [-0.24, 0.24]) box(at(o.working ? 0.15 : 0, o.working ? 1.1 : 1.08, sd), 0.09, o.working ? 0.3 : 0.56, 0.09, coat, o.working ? 0.9 : 0);
    const hp = at(0, 1.64, 0);
    cb.batch.prim('sphere', M.paint, hp[0], hp[1], hp[2], 0.2 * s, 0.24 * s, 0.21 * s, skin);
    cb.batch.prim('sphere', M.paint, hp[0] - fx * 0.02, hp[1] + 0.04 * s, hp[2] - fz * 0.02, 0.22 * s, 0.17 * s, 0.22 * s, o.hat ?? hair);
    if (o.umbrella) { const u = at(0.05, 2.05, 0.1); cb.batch.prim('cone', M.fabricSolid, u[0], u[1], u[2], 1.1, 0.3, 1.1, o.umbrella); cb.batch.prim('cyl', M.metal, u[0], u[1] - 0.45, u[2], 0.02, 0.9, 0.02, 0x222222); }
  }
}

/** Street food cart with a vendor. style: hotdog | coffee | tacos | juice | yatai */
export function foodCart(cb, x, z, yaw, style = 'hotdog') {
  const M = cb.mats;
  const cols = { hotdog: [0x2a6ad8, 0xf2c41a], coffee: [0x2a2a2a, 0xd8a050], tacos: [0xd84a2a, 0x2aa86a], juice: [0xff7aa8, 0x5ad0c8], yatai: [0x8a2a1a, 0x3a2416] }[style] || [0x2a6ad8, 0xf2c41a];
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const L = style === 'yatai' ? 2.4 : 1.9, D = 1.0;
  const across = Math.abs(fx) > 0.5; // cart length runs perpendicular to the facing direction
  if (style === 'yatai') {
    cb.batch.box(M.bark, x, 0.55, z, across ? D : L, 0.9, across ? L : D, 0x5a3a22);
    cb.batch.box(M.bark, x, 1.0, z, across ? D + 0.3 : L + 0.3, 0.06, across ? L + 0.3 : D + 0.3, 0x3a2416);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cb.batch.box(M.bark, x + a * (across ? D : L) / 2, 1.5, z + b * (across ? L : D) / 2, 0.08, 1.0, 0.08, 0x3a2416);
    cb.batch.box(M.roof, x, 2.05, z, across ? D + 0.8 : L + 0.6, 0.12, across ? L + 0.6 : D + 0.8, 0x2a2c30);
    cb.batch.box(M.fabricSolid, x - fx * (D / 2 + 0.05), 1.75, z - fz * (D / 2 + 0.05), across ? 0.03 : L, 0.45, across ? L : 0.03, 0xe8e0d0);
    for (const o of [-0.7, 0.7]) { const lx = x + (across ? 0 : o) - fx * 0.7, lz = z + (across ? o : 0) - fz * 0.7; cb.batch.prim('cyl', M.bulb, lx, 1.6, lz, 0.28, 0.4, 0.28, 0xff7a40); }
  } else {
    cb.batch.box(M.metal, x, 0.75, z, across ? D : L, 0.7, across ? L : D, 0xc8ccd2);
    cb.batch.box(M.paint, x, 1.12, z, across ? D + 0.05 : L + 0.05, 0.05, across ? L + 0.05 : D + 0.05, 0x3a3a3a);
    cb.batch.box(M.bulbSoft, x - fx * (D / 2 + 0.02), 0.85, z - fz * (D / 2 + 0.02), across ? 0.02 : L * 0.8, 0.35, across ? L * 0.8 : 0.02, cols[1]);
    for (const o of [-0.6, 0.6]) cb.batch.prim('cyl', M.rubber, x + (across ? 0 : o), 0.28, z + (across ? o : 0), 0.5, 0.08, 0.5, 0x151515);
    cb.batch.prim('cyl', M.metal, x, 1.9, z, 0.04, 1.6, 0.04, 0x333333);
    cb.batch.prim('cone', M.fabricSolid, x, 2.75, z, 2.3, 0.45, 2.3, cols[0]);
    cb.batch.prim('sphere', M.bulb, x, 2.35, z, 0.14, 0.14, 0.14, 0xffd59a);
    cb.shelters.push({ x0: x - 1.1, z0: z - 1.1, x1: x + 1.1, z1: z + 1.1, label: 'cart umbrella' });
  }
  staticPerson(cb, x + fx * (D / 2 + 0.45), z + fz * (D / 2 + 0.45), yaw + Math.PI, { working: true, hat: style === 'yatai' ? 0xe8e0d0 : undefined });
  cb.light(x - fx * 1.2, 1.6, z - fz * 1.2, 0xffcf8a, 7, 8, 'shop');
  cb.pool(x - fx * 1.0, z - fz * 1.0, 2.6, 0xffcf8a, 0.55, 'shop');
  cb.pools[cb.pools.length - 1].hours = style === 'coffee' ? [6, 15] : [10, 24];
  cb.col.addBox(x, z, (across ? D : L) / 2 + 0.1, (across ? L : D) / 2 + 0.1);
  cb.col.addCircle(x + fx * (D / 2 + 0.45), z + fz * (D / 2 + 0.45), 0.3);
}

/** Place a food cart on the kerb strip near (x, z), sliding along `axis` to find a clear spot. */
export function cartOnKerb(cb, x, z, yaw, style, axis = 'z') {
  for (let k = 0; k < 14; k++) {
    const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2.5;
    const px = axis === 'x' ? x + off : x, pz = axis === 'z' ? z + off : z;
    if (!cb.col.blocked(px, pz, 1.7)) { foodCart(cb, px, pz, yaw, style); return true; }
  }
  return false;
}

/**
 * Generic street furnishing for grid cities: lamps, trees, hydrants, bins, parked cars and signals.
 * o: { lamp, lampColor, tree: {kind, every, chance, fence}, hydrant, bin, parkTypes, carColors, signals, skip(axis, s, a) }
 */
export function furnishGrid(cb, layout, o = {}) {
  const rng = cb.rng; const b = layout.bounds;
  const { xs, zs } = layout;
  const side = (axis, s, sgn) => {
    if (s.noFurnish) return;
    const curb = (axis === 'x' ? s.z : s.x) + sgn * (s.road / 2 + 0.55);
    const cross = axis === 'x' ? xs : zs;
    const lo = axis === 'x' ? b.minX - 30 : b.minZ - 30, hi = axis === 'x' ? Math.min(b.maxX + 30, layout.openFrom ?? Infinity) : b.maxZ + 30;
    const cuts = cross.map((c) => { const cc = axis === 'x' ? c.x : c.z; const hw = c.road / 2 + c.walk; return [cc - hw, cc + hw]; }).sort((a1, b1) => a1[0] - b1[0]);
    const segs = []; let p = lo;
    for (const [c0, c1] of cuts) { if (c0 > p) segs.push([p, Math.min(c0, hi)]); p = c1; }
    if (p < hi) segs.push([p, hi]);
    const P = (a, off = 0) => (axis === 'x' ? [a, curb + sgn * off] : [curb + sgn * off, a]);
    const armYaw = axis === 'x' ? (sgn > 0 ? -Math.PI / 2 : Math.PI / 2) : (sgn > 0 ? Math.PI : 0);
    for (const [a0, a1] of segs) {
      const len = a1 - a0; if (len < 8) continue;
      if (o.skip && o.skip(axis, s, (a0 + a1) / 2)) continue;
      const nL = Math.max(1, Math.round(len / (o.lampEvery || 26)));
      for (let k = 0; k < nL; k++) { const a = a0 + (k + 0.5) * len / nL; const [x, z] = P(a); streetlight(cb, x, z, armYaw, o.lamp || 'nyc', { color: o.lampColor ?? 0xffc27a, pole: o.pole }); }
      if (o.tree && s.trees !== false) for (let a = a0 + 6; a < a1 - 6; a += rng.range(o.tree.every || 10, (o.tree.every || 10) * 1.4)) {
        if (!rng.chance(o.tree.chance ?? 1)) continue;
        const [x, z] = P(a, 0.25); if (!cb.col.blocked(x, z, 1)) tree(cb, x, z, { kind: o.tree.kind || 'street', fence: o.tree.fence, scale: o.tree.scale });
      }
      if (o.hydrant !== false) { const [x, z] = P(a0 + 3, 0.05); if (!cb.col.blocked(x, z, 0.4)) hydrant(cb, x, z, o.hydrant ?? 0xb8322a); }
      if (rng.chance(0.6)) { const [x, z] = P(a1 - 2.5, 0.05); if (!cb.col.blocked(x, z, 0.5)) trashCan(cb, x, z, o.bin ?? 0x2f4a34); }
      if (o.extra) o.extra(P, a0, a1, axis, s, sgn, armYaw);
      const parkSide = sgn < 0 ? s.park?.[0] : s.park?.[1];
      if (parkSide) {
        const laneC = (axis === 'x' ? s.z : s.x) + sgn * (s.road / 2 - 1.2);
        const lh = layout.leftHand ? -1 : 1;
        for (let a = a0 + 6; a < a1 - 6;) {
          const L = 5.6 + rng.f() * 1.2;
          if (rng.chance(o.parkChance ?? 0.75)) {
            const type = rng.weighted(o.parkTypes || [['sedan', 5], ['suv', 3], ['van', 1]]);
            const yaw = axis === 'x' ? (sgn * lh > 0 ? 0 : Math.PI) : (sgn * lh > 0 ? -Math.PI / 2 : Math.PI / 2);
            parkedCar(cb, axis === 'x' ? a + L / 2 : laneC, axis === 'x' ? laneC : a + L / 2, yaw + (rng.f() - 0.5) * 0.03, type, type === 'taxi' ? (o.taxiColor ?? 0xf2b51b) : rng.pick(o.carColors || CAR_COLORS));
          }
          a += L;
        }
      }
    }
  };
  for (const s of zs) { side('x', s, -1); side('x', s, 1); }
  for (const s of xs) { side('z', s, -1); side('z', s, 1); }
  if (o.signals !== false) for (const A of xs) for (const C of zs) {
    if (A.x < b.minX - 1 || A.x > b.maxX + 1 || C.z < b.minZ - 1 || C.z > b.maxZ + 1) continue;
    if ((A.dirs || []).length === 0 && (C.dirs || []).length === 0) continue;
    const ox = A.road / 2 + 0.5, oz = C.road / 2 + 0.5;
    trafficSignal(cb, A.x + ox, C.z - oz, [0, 1], C.road * 0.8, 'x', { heads: [C.road * 0.3, C.road * 0.7], color: o.signalColor });
    trafficSignal(cb, A.x - ox, C.z + oz, [1, 0], A.road * 0.8, 'z', { heads: [A.road * 0.3, A.road * 0.7], color: o.signalColor });
  }
}

/** Front-face helpers for city-specific details. */
export function frontOf(lot) {
  const side = lot.side; const S = SIDES[side];
  const horiz = side === 'n' || side === 's';
  const len = horiz ? lot.x1 - lot.x0 : lot.z1 - lot.z0;
  const fx = side === 'e' ? lot.x1 : side === 'w' ? lot.x0 : (lot.x0 + lot.x1) / 2;
  const fz = side === 's' ? lot.z1 : side === 'n' ? lot.z0 : (lot.z0 + lot.z1) / 2;
  // u runs along the façade; out is the street normal
  const ux = horiz ? 1 : 0, uz = horiz ? 0 : 1;
  const at = (u, out = 0) => [fx + ux * u + S.nx * out, fz + uz * u + S.nz * out];
  return { side, S, horiz, len, fx, fz, at, yawOut: Math.atan2(S.nx, S.nz) };
}
