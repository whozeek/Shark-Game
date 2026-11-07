// Chicago — a riverfront Loop interpretation: towers along a river crossed by steel truss bridges
// with bridge houses, and an elevated train rumbling over one street. Artistic interpretation.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import {
  createMaterials, facadeMaterials, shopMaterial, building, perimeterLots, streetlight, tree, hydrant,
  trashCan, bench, planter, trafficSignal, parkedCar, neonMaterial, neonSign, busShelter, cartOnKerb } from '../world/kit.js';
import { CAR_COLORS } from '../world/vehicleGeo.js';
import { addSkyline } from '../world/skyline.js';
import { elevatedPlatform } from '../world/interiors.js';

export const chicago = {
  id: 'chicago', name: 'Chicago', neighborhood: 'Riverfront Loop',
  blurb: 'Towers along a river, steel bridges and an elevated train overhead.',
  seed: 6060, palette: { fog: '#1a2230', accent: '#7fd0ff' },
  glow: '#4a5468', vehicleMix: { car: 0.55, taxi: 0.15, suv: 0.22, van: 0.08 }, busColor: 0x3a5a8a,
  bldClear: 1.3,
  build,
};

const SHOPS = [
  { name: 'Riverbend Coffee', type: 'cafe', hue: 30 }, { name: 'Loop Deli', type: 'deli', hue: 45 },
  { name: 'Bridgehouse Books', type: 'books', hue: 36 }, { name: 'Lakeshore Diner', type: 'restaurant', hue: 20, sign: '#ff8a7a' },
  { name: 'Prairie Florist', type: 'flowers', hue: 30 }, { name: 'North Branch Tavern', type: 'bar', hue: 18 },
  { name: 'Deep Dish Corner', type: 'restaurant', hue: 24, sign: '#ffd38a' }, { name: 'Union Press Café', type: 'cafe', hue: 34 },
  { name: 'Elevated Noodles', type: 'restaurant', hue: 10 }, { name: 'Steel Bridge Pub', type: 'bar', hue: 22 },
  { name: 'Wacker Wine & Co.', type: 'shop', hue: 330 }, { name: 'Lakefront Outfitters', type: 'shop', hue: 200 },
];
const NEON = [{ text: 'Diner', color: '#ff5a4a' }, { text: 'Tavern', color: '#ffb347' }, { text: 'Coffee', color: '#7fd0ff' }, { text: 'Pizza', color: '#ff7a3a' }];

async function build(cb, step) {
  const M = createMaterials(cb, cb.q, { asphalt: '#2a2b30', sidewalk: '#8a8a88', water: 0x15242e });
  cb.mats = M;
  cb.walkIns.push({ x: -70, z: -66, kind: 'cafe', name: 'Riverbend Coffee' });
  const F = facadeMaterials(cb, [
    { wall: 'glass', color: '#24404e', mullion: '#1c2228', bays: 4, bayW: 3, floorH: 3.8, litRatio: 0.55, lightTint: 'cool', seed: 3 },
    { wall: 'glass', color: '#1c2430', mullion: '#2c3036', bays: 4, bayW: 3, floorH: 3.8, litRatio: 0.45, lightTint: 'mixed', seed: 5 },
    { wall: 'stone', color: '#b5aa96', trim: '#d4cab6', windowStyle: 'office', bays: 4, bayW: 2.8, floorH: 3.6, bands: true, bandColor: '#c8bea9', litRatio: 0.5, lightTint: 'mixed', seed: 7 },
    { wall: 'brick', color: '#6a3a2a', mortar: '#857a6c', trim: '#c9bda8', windowStyle: 'wide', bays: 3, bayW: 3.4, floorH: 3.8, litRatio: 0.5, seed: 11 },
    { wall: 'stucco', color: '#d6cdbc', trim: '#e8e0d0', windowStyle: 'office', bays: 4, bayW: 2.8, floorH: 3.6, bands: true, bandColor: '#c4b9a5', litRatio: 0.45, seed: 13, cornerQuoins: true },
    { wall: 'panel', color: '#4a4e55', windowStyle: 'office', bays: 4, bayW: 2.6, floorH: 3.6, litRatio: 0.5, lightTint: 'cool', seed: 17 },
    { wall: 'glass', color: '#3a5260', mullion: '#c8ccd0', bays: 4, bayW: 3, floorH: 3.8, litRatio: 0.5, lightTint: 'cool', seed: 19 },
  ]);
  const [glassA, glassB, limestone, brick, terracotta, panel, glassC] = F;
  const shop = shopMaterial(cb, SHOPS, 333);
  neonMaterial(cb, NEON);
  await step(0.15, 'Laying out the Loop');

  const layout = {
    bounds: { minX: -150, maxX: 175, minZ: -150, maxZ: 150 },
    outer: 80,
    xs: [
      { x: -110, road: 14, walk: 5, dirs: [1, -1], park: [true, true], name: 'LaSalle St', kind: 'avenue' },
      { x: -30, road: 14, walk: 5, dirs: [-1, -1], park: [true, true], name: 'Clark St', kind: 'avenue', laneCount: 2 },
      { x: 50, road: 14, walk: 5, dirs: [1, -1], park: [true, true], name: 'Dearborn St', kind: 'avenue' },
      { x: 130, road: 18, walk: 6, dirs: [1, 1, -1, -1], park: [false, false], name: 'State St', kind: 'avenue', speed: 12 },
    ],
    zs: [
      { z: -122, road: 14, walk: 5, dirs: [1, -1], park: [false, false], name: 'Lake St', kind: 'avenue' },
      { z: -50, road: 16, walk: 6, dirs: [1, -1], park: [false, true], name: 'Wacker Dr', kind: 'avenue', speed: 12 },
      { z: 50, road: 12, walk: 5, dirs: [-1], park: [true, true], name: 'Riverside Pl', kind: 'street' },
      { z: 124, road: 14, walk: 5, dirs: [1, -1], park: [true, true], name: 'Randolph St', kind: 'avenue' },
    ],
    special: (b) => (b.z0 > -45 && b.z1 < 45 ? 'river' : null),
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Raising towers');
  const rng = cb.rng;
  let shopI = 0;
  for (const blk of grid.blocks) {
    if (blk.special === 'river') { river(cb, blk); continue; }
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 26 : 22, minW: 14, maxW: 26 });
    for (const lot of lots) {
      const w = lot.side === 'n' || lot.side === 's' ? lot.x1 - lot.x0 : lot.z1 - lot.z0;
      if (blk.outer) {
        building(cb, lot, { h: rng.range(30, 90), fronts: [lot.side], facade: rng.pick([glassA, glassB, limestone, panel]), ground: 'facade', roofKit: false, cornice: false, collide: false });
        continue;
      }
      const kind = rng.weighted([['tower', 4], ['classic', 3], ['loft', 2]]);
      const idx = shopI++ % SHOPS.length;
      if (kind === 'tower') {
        const f = rng.pick([glassA, glassB, glassC, panel]);
        const h1 = rng.range(26, 46);
        building(cb, lot, { h: h1, fronts: [lot.side], facade: f, ground: 'shop', shop, shopIdx: idx, gfH: 5, cornice: false, parapet: 0.4, trim: 0x3a3e44, signTrim: 0x1a1c20 });
        // setback tiers
        let base = 0.15 + h1, inset = 2.5, hTot = h1, rect = { ...lot };
        const tiers = rng.int(1, 3);
        for (let k = 0; k < tiers; k++) {
          rect = { x0: rect.x0 + inset, x1: rect.x1 - inset, z0: rect.z0 + inset, z1: rect.z1 - inset };
          if (rect.x1 - rect.x0 < 6 || rect.z1 - rect.z0 < 6) break;
          const h = rng.range(15, 40);
          building(cb, rect, { base, h, fronts: ['n', 's', 'e', 'w'], facade: f, ground: 'facade', cornice: false, parapet: 0.5, trim: 0x3a3e44, collide: false, roofKit: k === tiers - 1 });
          base += h; hTot += h;
        }
        if (rng.chance(0.4)) cb.batch.prim('cyl', M.metal, (rect.x0 + rect.x1) / 2, base + 8, (rect.z0 + rect.z1) / 2, 0.4, 16, 0.4, 0x8a8e94);
        cb.batch.prim('sphere', M.bulb, (rect.x0 + rect.x1) / 2, base + 16.5, (rect.z0 + rect.z1) / 2, 0.6, 0.6, 0.6, 0xff3020);
      } else if (kind === 'classic') {
        const f = rng.pick([limestone, terracotta]);
        const h = rng.range(28, 55);
        building(cb, lot, { h, fronts: [lot.side], facade: f, ground: 'shop', shop, shopIdx: idx, gfH: 5.5, corniceH: 1.2, corniceD: 0.8, corniceColor: 0xb0a690, ledges: true, ledgeColor: 0xc4b9a5, trim: 0xb0a690, awning: rng.chance(0.4) ? { color: rng.pick([0x1f3a5a, 0x2a2a2a, 0x7a1f24]), solid: true, depth: 1.4 } : null });
      } else {
        building(cb, lot, { h: rng.range(16, 26), fronts: [lot.side], facade: brick, ground: 'shop', shop, shopIdx: idx, gfH: 4.6, corniceColor: 0x4a3a30, fireEscape: rng.chance(0.5), waterTower: rng.chance(0.2), awning: rng.chance(0.6) ? { color: rng.pick([0x2f5a3a, 0x7a1f24, 0x1f3a5a, 0x8a5a1f]), depth: 1.4 } : null });
      }
      const s = SHOPS[idx];
      const ni = { restaurant: 0, bar: 1, cafe: 2 }[s.type];
      if (ni !== undefined && rng.chance(0.6) && w > 10) {
        const S = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[lot.side];
        const horiz = lot.side === 'n' || lot.side === 's';
        const px = lot.side === 'e' ? lot.x1 + 0.7 : lot.side === 'w' ? lot.x0 - 0.7 : lot.x0 + 1.2;
        const pz = lot.side === 's' ? lot.z1 + 0.7 : lot.side === 'n' ? lot.z0 - 0.7 : lot.z0 + 1.2;
        neonSign(cb, px, 6.3, pz, horiz ? Math.PI / 2 : 0, ni, { w: 1.6, vertical: true, poolDx: S[0], poolDz: S[1] });
      }
    }
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Raising towers');
  }
  cb.keepClear = [[-70, -39, 4]];
  furnish(cb, layout);
  cartOnKerb(cb, 120, -90, Math.PI / 2, 'coffee');
  cartOnKerb(cb, -102, 80, -Math.PI / 2, 'hotdog');
  elevated(cb, layout.zs[0], layout);
  for (const A of layout.xs) bridge(cb, A, -36, 36);
  elevatedPlatform(cb, layout.zs[0], -40, 20, 6.4 + 1.0, [-10, -112.5], { name: 'Lake & Clark station' });
  await step(0.75, 'Lighting the river');
  addSkyline(cb, { seed: 31, center: [0, 0], minR: 420, maxR: 950, count: 80, arcFrom: -Math.PI, arcTo: Math.PI * 0.4, hMin: 70, hMax: 330, color: '#232a34', lit: 0.45, extra: [{ x: -380, z: -620, w: 70, d: 70, h: 440 }, { x: -380, z: -620, w: 6, d: 6, h: 520 }, { x: 260, z: -560, w: 50, d: 50, h: 360 }] });
  cb.spawn = { x: -70, z: -39, yaw: -Math.PI / 2 - 0.35 };
  cb.viewpoints = [
    { x: -30 + 7 + 2.5, z: 0, look: [200, 10, 0], label: 'River view from the bridge' },
    { x: 50 - 7 - 2.5, z: 10, look: [-300, 10, 0], label: 'Bridges upstream' },
    { x: -70, z: -122 + 7 + 2.5, look: [60, 7, -122], label: 'Under the elevated tracks' },
  ];
  cb.routeHint = [[-21.5, -6], [-21.5, -60], [41, -60], [41, 60], [-21.5, 60]];
}

function river(cb, blk) {
  const M = cb.mats;
  const { x0, x1, z0, z1 } = blk;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 4, z1 - z0).rotateX(-Math.PI / 2), M.water);
  water.position.set((x0 + x1) / 2, -2.4, (z0 + z1) / 2);
  cb.addMesh(water, true);
  cb.track(water.geometry);
  // embankment walls
  const wallC = 0x5d5a55;
  cb.batch.box(M.paint, (x0 + x1) / 2, -1.1, z0 - 0.3, x1 - x0, 2.6, 0.6, wallC);
  cb.batch.box(M.paint, (x0 + x1) / 2, -1.1, z1 + 0.3, x1 - x0, 2.6, 0.6, wallC);
  // bridge deck sides (fascia) over the water
  cb.batch.box(M.paint, x0 - 0.3, -0.9, (z0 + z1) / 2, 0.6, 2.2, z1 - z0, 0x3a3d42);
  cb.batch.box(M.paint, x1 + 0.3, -0.9, (z0 + z1) / 2, 0.6, 2.2, z1 - z0, 0x3a3d42);
  // railings along the banks
  for (const z of [z0 + 0.15, z1 - 0.15]) {
    cb.batch.box(M.metal, (x0 + x1) / 2, 1.15, z, x1 - x0, 0.06, 0.06, 0x2a2d30);
    cb.batch.box(M.metal, (x0 + x1) / 2, 0.6, z, x1 - x0, 0.04, 0.04, 0x2a2d30);
    for (let x = x0; x <= x1; x += 2) cb.batch.box(M.metal, x, 0.65, z, 0.06, 1.0, 0.06, 0x2a2d30);
  }
  // river lights reflecting: lamps along the banks
  for (let x = x0 + 4; x < x1 - 2; x += 14) {
    streetlight(cb, x, z0 - 0.8 + 0.0, Math.PI / 2, 'globe', { color: 0xffe0b0, strength: 0.7, force: true });
    streetlight(cb, x + 7, z1 + 0.8, -Math.PI / 2, 'globe', { color: 0xffe0b0, strength: 0.7, force: true });
  }
  cb.col.addRect(x0, z0, x1, z1);
  cb.mapRect('water', x0, z0, x1, z1);
  cb.waterRects.push({ x0, z0, x1, z1 });
}

function bridge(cb, A, z0, z1) {
  const M = cb.mats;
  const red = 0x5a3a2c, steel = 0x3a4048;
  for (const sgn of [-1, 1]) {
    const x = A.x + sgn * (A.road / 2 + A.walk + 0.1);
    const n = 12;
    const top = (t) => 2.4 + Math.sin(t * Math.PI) * 2.6;
    for (let k = 0; k < n; k++) {
      const ta = k / n, tb = (k + 1) / n;
      const za = z0 + (z1 - z0) * ta, zb = z0 + (z1 - z0) * tb;
      cb.batch.beam(M.metal, new THREE.Vector3(x, top(ta), za), new THREE.Vector3(x, top(tb), zb), 0.28, steel);
      cb.batch.beam(M.metal, new THREE.Vector3(x, 0.4, za), new THREE.Vector3(x, 0.4, zb), 0.3, steel);
      cb.batch.beam(M.metal, new THREE.Vector3(x, 0.4, za), new THREE.Vector3(x, top(ta), za), 0.16, steel);
      cb.batch.beam(M.metal, new THREE.Vector3(x, 0.4, za), new THREE.Vector3(x, top(tb), zb), 0.12, steel);
    }
    cb.batch.beam(M.metal, new THREE.Vector3(x, 2.4, z1), new THREE.Vector3(x, 0.4, z1), 0.16, steel);
    cb.col.addRect(x - 0.25, z0, x + 0.25, z1);
    // bridge houses at both ends
    for (const z of [z0 - 3.2, z1 + 3.2]) {
      const hx = x + sgn * 2.4;
      cb.batch.box(M.paint, hx, 3.2, z, 4, 6.4, 4, 0xb8ae9a);
      cb.batch.box(M.paint, hx, 6.6, z, 4.6, 0.5, 4.6, 0x8a8070);
      cb.batch.box(M.roof, hx, 7.3, z, 3.4, 1.0, 3.4, 0x3a3a3a);
      cb.batch.box(M.bulbSoft, hx - sgn * 2.02, 3.6, z, 0.05, 1.6, 0.9, 0xffd49a);
      cb.light(hx - sgn * 2.6, 3.4, z, 0xffd49a, 6, 8, 'porch');
      cb.col.addRect(hx - 2, z - 2, hx + 2, z + 2);
    }
    // deck lamps
    for (let z = z0 + 6; z < z1 - 3; z += 12) streetlight(cb, x - sgn * 0.5, z, sgn > 0 ? Math.PI : 0, 'modern', { color: 0xffe2b8, strength: 0.8, cone: false, force: true });
  }
  cb.mapRect('bridge', A.x - A.road / 2 - A.walk, z0, A.x + A.road / 2 + A.walk, z1);
  void red;
}

function elevated(cb, S, layout) {
  // The "L": steel columns along both curbs, cross girders and a track deck above the street.
  const M = cb.mats;
  const steel = 0x2e3236, y = 6.4;
  const x0 = layout.bounds.minX - 80, x1 = layout.bounds.maxX + 80;
  const zA = S.z - S.road / 2 + 0.6, zB = S.z + S.road / 2 - 0.6;
  const crosses = layout.xs.map((a) => [a.x - a.road / 2 - 1, a.x + a.road / 2 + 1]);
  for (let x = x0; x <= x1; x += 13) {
    if (crosses.some(([a, b]) => x > a && x < b)) continue;
    for (const z of [zA, zB]) {
      cb.batch.box(M.metal, x, y / 2, z, 0.5, y, 0.5, steel);
      cb.batch.box(M.metal, x, 0.3, z, 0.8, 0.6, 0.8, 0x4a4e52);
      if (x > layout.bounds.minX && x < layout.bounds.maxX) cb.col.addCircle(x, z, 0.45);
    }
    cb.batch.box(M.metal, x, y + 0.2, S.z, 0.4, 0.8, S.road, steel);
    cb.batch.beam(M.metal, new THREE.Vector3(x, y - 1.5, zA), new THREE.Vector3(x, y, (zA + zB) / 2), 0.15, steel);
    cb.batch.beam(M.metal, new THREE.Vector3(x, y - 1.5, zB), new THREE.Vector3(x, y, (zA + zB) / 2), 0.15, steel);
    cb.light(x, y - 0.4, S.z, 0xffc890, 6, 10, 'street');
    cb.pool(x, S.z, 5, 0xffc890, 0.45, 'street');
    cb.batch.box(M.bulb, x, y - 0.25, S.z, 0.3, 0.06, 0.3, 0xffc890);
  }
  for (const z of [zA, zB, S.z - 1.6, S.z + 1.6]) cb.batch.box(M.metal, (x0 + x1) / 2, y + 0.75, z, x1 - x0, 0.7, 0.35, steel);
  cb.batch.box(M.roof, (x0 + x1) / 2, y + 1.15, S.z, x1 - x0, 0.15, S.road - 1, 0x26282b);
  for (const z of [S.z - 2.3, S.z - 0.9, S.z + 0.9, S.z + 2.3]) cb.batch.box(M.metal, (x0 + x1) / 2, y + 1.3, z, x1 - x0, 0.12, 0.1, 0x6a6a6a);
  cb.map('rail', [[x0, S.z - 2.5], [x1, S.z - 2.5], [x1, S.z + 2.5], [x0, S.z + 2.5]]);
  // a train that passes now and then
  const train = new THREE.Group();
  const bodyMat = cb.track(new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.4, metalness: 0.6 }));
  const winMat = cb.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.6) }));
  const carG = cb.track(new THREE.BoxGeometry(14, 3, 2.8)); const winG = cb.track(new THREE.BoxGeometry(12.5, 0.9, 2.9));
  for (let k = 0; k < 4; k++) {
    const c = new THREE.Mesh(carG, bodyMat); c.position.set(k * 14.6, 0, 0); train.add(c);
    const w = new THREE.Mesh(winG, winMat); w.position.set(k * 14.6, 0.35, 0); train.add(w);
  }
  train.position.set(x0, y + 2.9, S.z - 1.6);
  cb.group.add(train);
  let tx = x0 - 200, dir = 1, v = 14, wait = 0, served = false;
  const station = -10; // trains on the south track stop at the platform
  cb.animated.push({ update: (dt) => {
    if (wait > 0) { wait -= dt; if (wait <= 0) v = 0.5; return; }
    const center = tx + 21.9;
    if (dir === -1 && !served) {
      const d = center - station;
      if (d > 0) v = Math.max(0.8, Math.min(14, Math.sqrt(2 * 1.3 * d)));
      if (d <= 0.3) { wait = 12; served = true; return; }
    } else v = Math.min(14, v + dt * 1.4);
    tx += dir * dt * v;
    if (tx > x1 + 120) { dir = -1; served = false; train.position.z = S.z + 1.6; }
    if (tx < x0 - 240) { dir = 1; train.position.z = S.z - 1.6; }
    train.position.x = tx;
  } });
}

function furnish(cb, layout) {
  const rng = cb.rng; const b = layout.bounds;
  const { xs, zs } = layout;
  const side = (axis, s, sgn) => {
    const curb = (axis === 'x' ? s.z : s.x) + sgn * (s.road / 2 + 0.55);
    const cross = axis === 'x' ? xs : zs;
    const lo = axis === 'x' ? b.minX - 30 : b.minZ - 30, hi = axis === 'x' ? b.maxX + 30 : b.maxZ + 30;
    const cuts = cross.map((c) => { const cc = axis === 'x' ? c.x : c.z; const hw = c.road / 2 + c.walk; return [cc - hw, cc + hw]; }).sort((a1, b1) => a1[0] - b1[0]);
    const segs = []; let p = lo;
    for (const [c0, c1] of cuts) { if (c0 > p) segs.push([p, c0]); p = c1; }
    if (p < hi) segs.push([p, hi]);
    const P = (a, off = 0) => axis === 'x' ? [a, curb + sgn * off] : [curb + sgn * off, a];
    const armYaw = axis === 'x' ? (sgn > 0 ? -Math.PI / 2 : Math.PI / 2) : (sgn > 0 ? Math.PI : 0);
    const overRiver = (a) => axis === 'z' && a > -45 && a < 45;
    for (const [a0, a1] of segs) {
      const len = a1 - a0; if (len < 8) continue;
      const mid = (a0 + a1) / 2;
      if (overRiver(mid)) continue;
      const nL = Math.max(1, Math.round(len / 30));
      for (let k = 0; k < nL; k++) { const a = a0 + (k + 0.5) * len / nL; const [x, z] = P(a); if (!(axis === 'x' && s.name === 'Lake St')) streetlight(cb, x, z, armYaw, 'modern', { color: 0xffdcb0 }); }
      for (let a = a0 + 6; a < a1 - 6; a += rng.range(11, 16)) { const [x, z] = P(a, 0.3); if (!cb.col.blocked(x, z, 1) && s.name !== 'Lake St') tree(cb, x, z, { scale: 0.85, fence: true }); }
      { const [x, z] = P(a0 + 3, 0.05); if (!cb.col.blocked(x, z, 0.4)) hydrant(cb, x, z, 0xc8a020); }
      if (rng.chance(0.6)) { const [x, z] = P(a1 - 2.5, 0.05); if (!cb.col.blocked(x, z, 0.5)) trashCan(cb, x, z, 0x3a3f44); }
      if (rng.chance(0.4)) { const [x, z] = P(mid + 4, 0.1); if (!cb.col.blocked(x, z, 0.9)) planter(cb, x, z, 1.4); }
      const parkSide = sgn < 0 ? s.park?.[0] : s.park?.[1];
      if (parkSide) {
        const laneC = (axis === 'x' ? s.z : s.x) + sgn * (s.road / 2 - 1.2);
        for (let a = a0 + 6; a < a1 - 6;) {
          const L = 5.8 + rng.f(); if (rng.chance(0.7)) {
            const type = rng.weighted([['sedan', 5], ['suv', 4], ['van', 1]]);
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
    trafficSignal(cb, A.x + ox, C.z - oz, [0, 1], C.road * 0.8, 'x', { heads: [C.road * 0.3, C.road * 0.7], color: 0x3a3e30 });
    trafficSignal(cb, A.x - ox, C.z + oz, [1, 0], A.road * 0.8, 'z', { heads: [A.road * 0.3, A.road * 0.7], color: 0x3a3e30 });
  }
  // riverside benches facing the water
  for (let x = -100; x < 160; x += 22) {
    if (xs.some((a) => Math.abs(x - a.x) < 14)) continue;
    bench(cb, x, -36.85, Math.PI, { label: 'riverside bench' });
    bench(cb, x + 8, 36.85, 0, { label: 'riverside bench' });
  }
  busShelter(cb, xs[3].x - xs[3].road / 2 - 0.75, -88, Math.PI / 2, { ad: 0x9ad7ff });
}
