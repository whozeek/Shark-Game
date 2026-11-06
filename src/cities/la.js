// Los Angeles — an Arts District interpretation: wide streets, low brick and concrete warehouses,
// big murals, rooftop billboards, tall palms, power lines and hazy hills. Artistic interpretation.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import {
  createMaterials, facadeMaterials, shopMaterial, building, perimeterLots, streetlight, tree, hydrant,
  trashCan, bench, trafficSignal, parkedCar, neonMaterial, neonSign, SIDES,
} from '../world/kit.js';
import { CAR_COLORS } from '../world/vehicleGeo.js';
import { addSkyline, addHills } from '../world/skyline.js';
import { makeMural } from '../render/textures.js';
import { patchWash } from '../render/shared.js';

export const la = {
  id: 'la', name: 'Los Angeles', neighborhood: 'Arts District',
  blurb: 'Wide streets, murals on old warehouses, palms and hills in the haze.',
  seed: 9191, palette: { fog: '#2a2230', accent: '#ff9f6b' },
  glow: '#7a5040', vehicleMix: { car: 0.55, suv: 0.3, van: 0.15, taxi: 0 }, busColor: 0xc8a020, bus: true,
  bldClear: 1.2,
  build,
};

const SHOPS = [
  { name: 'Traction Coffee Roasters', type: 'cafe', hue: 30, color: '#2a2a2a' }, { name: 'Gallery 3rd & Light', type: 'shop', hue: 40, color: '#e0ddd5', sign: '#222' },
  { name: 'Warehouse Brewing Co.', type: 'bar', hue: 28, color: '#3a2a20' }, { name: 'Taco Luz', type: 'restaurant', hue: 18, color: '#7a2a1a', sign: '#ffe08a' },
  { name: 'Rewind Vinyl', type: 'records', hue: 300, color: '#1a1a2a' }, { name: 'Sunset Print Shop', type: 'shop', hue: 35, color: '#2a3a3a' },
  { name: 'Mateo Bakehouse', type: 'cafe', hue: 36, color: '#4a3a2a' }, { name: 'Concrete Jungle Plants', type: 'flowers', hue: 90, color: '#2a3a2a' },
  { name: 'Ramen Yard', type: 'restaurant', hue: 12, color: '#2a1a1a' }, { name: 'Canvas & Co.', type: 'shop', hue: 42, color: '#3a3530' },
  { name: 'Late Bloom Bar', type: 'bar', hue: 320, color: '#2a1a2a', sign: '#ffb3e1' }, { name: 'Arts District Market', type: 'grocery', hue: 45, color: '#1f2a1f' },
];
const NEON = [{ text: 'Tacos', color: '#ffb347' }, { text: 'Brewery', color: '#ff5a5a' }, { text: 'Coffee', color: '#4dffb8' }, { text: 'Vinyl', color: '#c38cff' }, { text: 'Open 24h', color: '#ff3fa4' }, { text: 'Gallery', color: '#7fd0ff' }];

async function build(cb, step) {
  const M = createMaterials(cb, cb.q, { asphalt: '#2e2d2f', sidewalk: '#9a948a' });
  cb.mats = M;
  const F = facadeMaterials(cb, [
    { wall: 'brick', color: '#7a3e2c', mortar: '#8f8273', trim: '#c9bda8', windowStyle: 'wide', bays: 3, bayW: 3.8, floorH: 4.2, litRatio: 0.45, seed: 41 },
    { wall: 'concrete', color: '#c8bfae', windowStyle: 'wide', frame: '#2a2a2a', bays: 3, bayW: 3.8, floorH: 4.2, litRatio: 0.4, seed: 43 },
    { wall: 'stucco', color: '#b9c2b0', windowStyle: 'office', bays: 4, bayW: 3, floorH: 4, litRatio: 0.45, seed: 47 },
    { wall: 'brick', color: '#5a3328', mortar: '#7a7064', trim: '#b8ac98', windowStyle: 'arched', bays: 4, bayW: 3, floorH: 4, litRatio: 0.45, seed: 53 },
    { wall: 'siding', color: '#8a8e90', windowStyle: 'wide', frame: '#1a1a1a', bays: 3, bayW: 3.8, floorH: 4.2, litRatio: 0.35, seed: 59 },
    { wall: 'stucco', color: '#d8b8a0', windowStyle: 'office', bays: 4, bayW: 3, floorH: 4, litRatio: 0.45, seed: 61 },
  ]);
  const shop = shopMaterial(cb, SHOPS, 919);
  neonMaterial(cb, NEON);
  // murals
  const muralMats = [];
  for (let i = 0; i < 6; i++) {
    const tex = cb.track(makeMural(500 + i * 37));
    muralMats.push(cb.track(patchWash(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, vertexColors: true }), 0.06)));
  }
  await step(0.15, 'Painting murals');

  const layout = {
    bounds: { minX: -140, maxX: 160, minZ: -140, maxZ: 145 },
    outer: 90,
    xs: [
      { x: -100, road: 18, walk: 4.6, dirs: [1, -1], park: [true, true], name: 'Mateo St', kind: 'avenue' },
      { x: -8, road: 22, walk: 5, dirs: [1, 1, -1, -1], park: [true, true], name: 'Santa Fe Ave', kind: 'avenue', speed: 13 },
      { x: 92, road: 17, walk: 4.6, dirs: [1, -1], park: [true, true], name: 'Hewitt St', kind: 'avenue' },
    ],
    zs: [
      { z: -100, road: 18, walk: 4.6, dirs: [1, -1], park: [true, true], name: 'E 3rd St', kind: 'avenue' },
      { z: -6, road: 17, walk: 4.6, dirs: [1, -1], park: [true, true], name: 'Traction Ave', kind: 'avenue' },
      { z: 92, road: 18, walk: 4.6, dirs: [1, -1], park: [true, true], name: 'Industrial St', kind: 'avenue' },
    ],
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Building warehouses');
  const rng = cb.rng;
  let shopI = 0, mi = 0;
  const lotBlock = grid.blocks.find((b) => b.inside && b.streets.e?.name === 'Hewitt St' && b.streets.n?.name === 'Traction Ave');
  for (const blk of grid.blocks) {
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 30 : 24, minW: 14, maxW: 28, sides: blk === lotBlock ? ['n', 'w', 'e'] : ['n', 's', 'e', 'w'] });
    for (const lot of lots) {
      if (blk === lotBlock && lot.side === 'n' && lot.x0 > blk.x0 + (blk.x1 - blk.x0) * 0.45) continue; // open lot
      const w = lot.side === 'n' || lot.side === 's' ? lot.x1 - lot.x0 : lot.z1 - lot.z0;
      const f = rng.pick(F);
      const floors = rng.int(2, 4);
      const h = floors * 4.2 + rng.range(0.5, 1.5);
      if (blk.outer) { building(cb, lot, { h, fronts: [lot.side], facade: f, ground: 'facade', roofKit: false, collide: false, cornice: false }); continue; }
      const isShop = rng.chance(0.55);
      const idx = shopI++ % SHOPS.length;
      building(cb, lot, {
        h, fronts: [lot.side], facade: f, ground: isShop ? 'shop' : 'facade', shop, shopIdx: idx, gfH: 4.6,
        cornice: rng.chance(0.4), corniceColor: 0x8a7a6a, parapet: rng.range(0.8, 1.6), trim: rng.pick([0x9a8a7a, 0x6a6a6a, 0xb8a890]),
        awning: isShop && rng.chance(0.5) ? { color: rng.pick([0x2a2a2a, 0x8a3a1f, 0x1f4a4a, 0xd8a020]), solid: true, depth: 2.0, drop: 0.3 } : null,
      });
      if (!isShop) rollupDoor(cb, lot, rng);
      // murals on visible side walls of corner lots and on some fronts
      for (const side of ['n', 's', 'e', 'w']) {
        if (side === lot.side) continue;
        const onStreet = (side === 'n' && Math.abs(lot.z0 - blk.z0) < 0.1) || (side === 's' && Math.abs(lot.z1 - blk.z1) < 0.1) || (side === 'w' && Math.abs(lot.x0 - blk.x0) < 0.1) || (side === 'e' && Math.abs(lot.x1 - blk.x1) < 0.1);
        if (onStreet && rng.chance(0.75)) mural(cb, lot, side, 0.3, h - 0.3, muralMats[mi++ % muralMats.length]);
      }
      if (!isShop && rng.chance(0.35) && w > 12) mural(cb, lot, lot.side, 5, h - 0.5, muralMats[mi++ % muralMats.length], 0.6);
      if (isShop) {
        const s = SHOPS[idx]; const ni = { restaurant: 0, bar: 1, cafe: 2, records: 3, shop: 5 }[s.type];
        if (ni !== undefined && rng.chance(0.7)) {
          const S = SIDES[lot.side];
          const horiz = lot.side === 'n' || lot.side === 's';
          const cx = lot.side === 'e' ? lot.x1 : lot.side === 'w' ? lot.x0 : (lot.x0 + lot.x1) / 2;
          const cz = lot.side === 's' ? lot.z1 : lot.side === 'n' ? lot.z0 : (lot.z0 + lot.z1) / 2;
          neonSign(cb, cx + S.nx * 0.12, 5.6, cz + S.nz * 0.12, horiz ? 0 : Math.PI / 2, ni, { w: 3.0, backing: false, poolDx: S.nx * 2, poolDz: S.nz * 2 });
        }
      }
      if (rng.chance(0.18)) billboard(cb, lot, h, rng);
    }
    if (blk === lotBlock) openLot(cb, blk);
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Building warehouses');
  }
  cb.keepClear = [[-8 + 11 + 2.5, -6 + 8.5 + 2.3, 4]];
  furnish(cb, layout);
  await step(0.72, 'Planting palms');
  addHills(cb, { seed: 7, center: [0, 0], r: 1100, arcFrom: -Math.PI * 0.95, arcTo: -Math.PI * 0.05, h: 260, base: 40, color: '#2a3036', top: '#3a3a44', lights: true });
  addHills(cb, { seed: 9, center: [0, 0], r: 1350, arcFrom: -Math.PI * 1.05, arcTo: Math.PI * 0.2, h: 420, base: 60, color: '#353a44', top: '#4a4a56' });
  addSkyline(cb, { seed: 51, center: [-200, -100], minR: 500, maxR: 700, count: 30, arcFrom: -Math.PI * 0.9, arcTo: -Math.PI * 0.55, hMin: 80, hMax: 300, color: '#2a2e38', lit: 0.4 });
  cb.spawn = { x: -8 + 11 + 2.5, z: -6 + 8.5 + 2.3, yaw: -Math.PI / 2 + 0.3 };
  cb.viewpoints = [
    { x: -8 + 11 + 2.4, z: -100 + 9 + 2.3, look: [-300, 60, -800], label: 'Hills in the haze' },
    { x: 60, z: -6 - 8.5 - 2.4, look: [60, 6, -40], label: 'Murals on Traction Ave' },
  ];
  cb.routeHint = [[5.5, 4.8], [79, 4.8], [79, 79], [5.5, 79]];
}

function rollupDoor(cb, lot, rng) {
  const M = cb.mats; const S = SIDES[lot.side];
  const horiz = lot.side === 'n' || lot.side === 's';
  const len = horiz ? lot.x1 - lot.x0 : lot.z1 - lot.z0;
  const cx = lot.side === 'e' ? lot.x1 : lot.side === 'w' ? lot.x0 : (lot.x0 + lot.x1) / 2;
  const cz = lot.side === 's' ? lot.z1 : lot.side === 'n' ? lot.z0 : (lot.z0 + lot.z1) / 2;
  const n = Math.max(1, Math.floor(len / 9));
  for (let k = 0; k < n; k++) {
    const a = -len / 2 + (k + 0.5) * len / n;
    const px = horiz ? cx + a : cx + S.nx * 0.06, pz = horiz ? cz + S.nz * 0.06 : cz + a;
    const col = rng.pick([0x6a6e72, 0x4a5a6a, 0x8a3a2a, 0x3a4a3a, 0x9a9488]);
    cb.batch.box(M.metal, px, 0.15 + 1.8, pz, horiz ? 3.6 : 0.08, 3.6, horiz ? 0.08 : 3.6, col);
    for (let y = 0.4; y < 3.6; y += 0.25) cb.batch.box(M.metal, px + S.nx * 0.05, 0.15 + y, pz + S.nz * 0.05, horiz ? 3.6 : 0.03, 0.03, horiz ? 0.03 : 3.6, 0x2a2a2a);
    // loading dock lamp
    cb.batch.box(M.bulb, px + S.nx * 0.25, 4.2, pz + S.nz * 0.25, 0.3, 0.12, 0.3, 0xffb870);
    cb.pool(px + S.nx * 1.5, pz + S.nz * 1.5, 3.2, 0xffb870, 0.45, 'porch');
  }
}

function mural(cb, lot, side, y0, y1, mat, frac = 0.92) {
  const S = SIDES[side];
  const horiz = side === 'n' || side === 's';
  const len = (horiz ? lot.x1 - lot.x0 : lot.z1 - lot.z0) * frac;
  const g = new THREE.PlaneGeometry(len, y1 - y0);
  g.rotateY(S.ry);
  const cx = side === 'e' ? lot.x1 : side === 'w' ? lot.x0 : (lot.x0 + lot.x1) / 2;
  const cz = side === 's' ? lot.z1 : side === 'n' ? lot.z0 : (lot.z0 + lot.z1) / 2;
  g.translate(cx + S.nx * 0.04, 0.15 + (y0 + y1) / 2, cz + S.nz * 0.04);
  cb.batch.addGeometry(g, mat, 0xffffff);
  // a wall-washer light so murals read at night
  cb.light(cx + S.nx * 3, 6, cz + S.nz * 3, 0xffd8b0, 8, 12, 'shop');
}

function billboard(cb, lot, h, rng) {
  const M = cb.mats;
  const x = (lot.x0 + lot.x1) / 2, z = (lot.z0 + lot.z1) / 2, y = 0.15 + h;
  const yaw = lot.side === 'n' || lot.side === 's' ? 0 : Math.PI / 2;
  for (const o of [-3, 3]) cb.batch.box(M.metal, x + (yaw ? 0 : o), y + 3, z + (yaw ? o : 0), 0.3, 6, 0.3, 0x3a3a3a);
  const col = rng.pick([0xff9a5a, 0x5ad0ff, 0xff5aa8, 0xffe07a]);
  cb.batch.box(M.bulbSoft, x, y + 6.5, z, yaw ? 0.3 : 12, 4.5, yaw ? 12 : 0.3, col);
  cb.batch.box(M.metal, x, y + 4.1, z, yaw ? 0.6 : 12, 0.2, yaw ? 12 : 0.6, 0x2a2a2a);
}

function openLot(cb, blk) {
  const M = cb.mats;
  const x0 = blk.x0 + (blk.x1 - blk.x0) * 0.45, x1 = blk.x1, z0 = blk.z0, z1 = blk.z0 + 24;
  const gravel = cb.track(new THREE.MeshStandardMaterial({ color: 0x4a4744, roughness: 1 }));
  cb.addGround(gravel, x0, z0, x1, z1, 0.16, 4);
  // chain-link fence with a gate opening
  const fence = (ax, az, bx, bz) => {
    cb.batch.beam(M.metal, new THREE.Vector3(ax, 1.9, az), new THREE.Vector3(bx, 1.9, bz), 0.05, 0x7a7e82);
    const n = Math.max(1, Math.floor(Math.hypot(bx - ax, bz - az) / 2.5));
    for (let k = 0; k <= n; k++) { const f = k / n; cb.batch.box(M.metal, ax + (bx - ax) * f, 1.0, az + (bz - az) * f, 0.06, 1.9, 0.06, 0x7a7e82); }
    cb.batch.box(M.glass, (ax + bx) / 2, 1.0, (az + bz) / 2, Math.max(0.02, Math.abs(bx - ax)), 1.8, Math.max(0.02, Math.abs(bz - az)), 0xffffff);
    cb.col.addRect(Math.min(ax, bx) - 0.05, Math.min(az, bz) - 0.05, Math.max(ax, bx) + 0.05, Math.max(az, bz) + 0.05);
  };
  const gx = (x0 + x1) / 2;
  fence(x0, z0 + 0.2, gx - 3, z0 + 0.2); fence(gx + 3, z0 + 0.2, x1, z0 + 0.2);
  fence(x0, z0, x0, z1);
  // food truck with a glowing window and picnic tables
  parkedFoodTruck(cb, gx + 6, z0 + 10);
  for (const [tx, tz] of [[gx - 6, z0 + 8], [gx - 6, z0 + 15], [gx + 1, z0 + 17]]) {
    cb.batch.box(M.paint, tx, 0.85, tz, 2.2, 0.08, 0.9, 0x6a4a2a);
    for (const o of [-0.75, 0.75]) cb.batch.box(M.paint, tx, 0.5, tz + o, 2.2, 0.06, 0.3, 0x6a4a2a);
    cb.seat(tx, tz + 1.05, Math.PI, 'picnic bench');
    cb.col.addBox(tx, tz, 1.15, 0.9);
  }
  // string lights
  for (let k = 0; k < 14; k++) {
    const f = k / 13; const x = gx - 8 + 16 * f; const z = z0 + 6 + Math.sin(f * Math.PI) * 1.5;
    cb.batch.prim('sphere', M.bulb, x, 3.6 - Math.sin(f * Math.PI) * 0.6, z, 0.12, 0.12, 0.12, 0xffd08a);
  }
  cb.pool(gx - 2, z0 + 10, 7, 0xffd08a, 0.5, 'shop');
  cb.light(gx - 2, 3.4, z0 + 10, 0xffd08a, 10, 14, 'shop');
  cb.mapRect('plaza', x0, z0, x1, z1);
}

function parkedFoodTruck(cb, x, z) {
  parkedCar(cb, x, z, -Math.PI / 2, 'van', 0xd8d0c0);
  const M = cb.mats;
  cb.batch.box(M.bulbSoft, x - 0.99, 1.45, z, 0.04, 0.6, 2.0, 0xffcf80);
  cb.batch.box(M.fabricSolid, x - 1.3, 2.05, z, 0.7, 0.05, 2.4, 0xd84a3a);
  cb.light(x - 2.5, 1.8, z, 0xffcf80, 6, 8, 'shop');
}

function furnish(cb, layout) {
  const rng = cb.rng; const b = layout.bounds;
  const { xs, zs } = layout;
  const side = (axis, s, sgn) => {
    const curb = (axis === 'x' ? s.z : s.x) + sgn * (s.road / 2 + 0.55);
    const cross = axis === 'x' ? xs : zs;
    const lo = axis === 'x' ? b.minX - 40 : b.minZ - 40, hi = axis === 'x' ? b.maxX + 40 : b.maxZ + 40;
    const cuts = cross.map((c) => { const cc = axis === 'x' ? c.x : c.z; const hw = c.road / 2 + c.walk; return [cc - hw, cc + hw]; }).sort((a1, b1) => a1[0] - b1[0]);
    const segs = []; let p = lo;
    for (const [c0, c1] of cuts) { if (c0 > p) segs.push([p, c0]); p = c1; }
    if (p < hi) segs.push([p, hi]);
    const P = (a, off = 0) => axis === 'x' ? [a, curb + sgn * off] : [curb + sgn * off, a];
    const armYaw = axis === 'x' ? (sgn > 0 ? -Math.PI / 2 : Math.PI / 2) : (sgn > 0 ? Math.PI : 0);
    for (const [a0, a1] of segs) {
      const len = a1 - a0; if (len < 8) continue;
      const nL = Math.max(1, Math.round(len / 34));
      for (let k = 0; k < nL; k++) { const a = a0 + (k + 0.5) * len / nL; const [x, z] = P(a); streetlight(cb, x, z, armYaw, 'modern', { color: 0xffb468 }); }
      for (let a = a0 + 8; a < a1 - 6; a += rng.range(14, 20)) { const [x, z] = P(a, 0.25); if (!cb.col.blocked(x, z, 1)) tree(cb, x, z, { kind: 'palm', h: rng.range(10, 15), pit: false }); }
      // power poles with sagging wires on one side
      if (sgn > 0) {
        let prev = null;
        for (let a = a0 + 4; a < a1 - 2; a += 26) {
          const [x, z] = P(a, -0.2);
          cb.batch.prim('cyl6', cb.mats.bark, x, 5.5, z, 0.28, 11, 0.28, 0x4a3a2c);
          cb.batch.box(cb.mats.bark, x, 10.4, z, axis === 'x' ? 0.15 : 2.6, 0.15, axis === 'x' ? 2.6 : 0.15, 0x4a3a2c);
          cb.col.addCircle(x, z, 0.2);
          if (prev) for (const o of [-1.1, 0, 1.1]) {
            const pa = new THREE.Vector3(prev[0] + (axis === 'x' ? 0 : o), 10.5, prev[1] + (axis === 'x' ? o : 0));
            const pb = new THREE.Vector3(x + (axis === 'x' ? 0 : o), 10.5, z + (axis === 'x' ? o : 0));
            const mid = pa.clone().lerp(pb, 0.5); mid.y -= 0.9;
            cb.batch.beam(cb.mats.metal, pa, mid, 0.025, 0x111111, true);
            cb.batch.beam(cb.mats.metal, mid, pb, 0.025, 0x111111, true);
          }
          prev = [x, z];
        }
      }
      { const [x, z] = P(a0 + 3, 0.05); if (!cb.col.blocked(x, z, 0.4)) hydrant(cb, x, z, 0xd8c040); }
      if (rng.chance(0.6)) { const [x, z] = P(a1 - 2.5, 0.05); if (!cb.col.blocked(x, z, 0.5)) trashCan(cb, x, z, 0x2a3a5a); }
      if (rng.chance(0.3)) { const [x, z] = P((a0 + a1) / 2, 0.2); if (!cb.col.blocked(x, z, 1.2)) bench(cb, x + (axis === 'x' ? 0 : 0), z, armYaw + Math.PI / 2 * 0 + (axis === 'x' ? (sgn > 0 ? 0 : Math.PI) : (sgn > 0 ? Math.PI / 2 : -Math.PI / 2)), { label: 'bench' }); }
      const parkSide = sgn < 0 ? s.park?.[0] : s.park?.[1];
      if (parkSide) {
        const laneC = (axis === 'x' ? s.z : s.x) + sgn * (s.road / 2 - 1.2);
        for (let a = a0 + 6; a < a1 - 6;) {
          const L = 6 + rng.f() * 1.5;
          if (rng.chance(0.6)) {
            const type = rng.weighted([['sedan', 4], ['suv', 4], ['van', 2]]);
            parkedCar(cb, axis === 'x' ? a + L / 2 : laneC, axis === 'x' ? laneC : a + L / 2, axis === 'x' ? (sgn > 0 ? 0 : Math.PI) : (sgn > 0 ? -Math.PI / 2 : Math.PI / 2), type, rng.pick(CAR_COLORS));
          }
          a += L;
        }
      }
    }
  };
  for (const s of zs) { side('x', s, -1); side('x', s, 1); }
  for (const s of xs) { side('z', s, -1); side('z', s, 1); }
  for (const A of xs) for (const C of zs) {
    const ox = A.road / 2 + 0.5, oz = C.road / 2 + 0.5;
    trafficSignal(cb, A.x + ox, C.z - oz, [0, 1], C.road * 0.8, 'x', { heads: [C.road * 0.35, C.road * 0.7], color: 0x6a6e72 });
    trafficSignal(cb, A.x - ox, C.z + oz, [1, 0], A.road * 0.8, 'z', { heads: [A.road * 0.35, A.road * 0.7], color: 0x6a6e72 });
  }
}
