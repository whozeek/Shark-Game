// Amsterdam — a canal-ring interpretation: tall narrow gabled canal houses, two canals with
// houseboats, brick bridges outlined in lights, elms, and bicycles everywhere. Artistic interpretation.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import {
  createMaterials, facadeMaterials, shopMaterial, building, perimeterLots, tree, bench, streetlight, neonMaterial,
  furnishGrid, frontOf, staticPerson, foodCart,
} from '../world/kit.js';
import { addSkyline } from '../world/skyline.js';

export const amsterdam = {
  id: 'amsterdam', name: 'Amsterdam', neighborhood: 'Canal Ring',
  blurb: 'Gabled canal houses, houseboats, lit bridges and bicycles everywhere.',
  seed: 2020, palette: { fog: '#1e2428', accent: '#ffb86b' },
  glow: '#5a4838', vehicleMix: { car: 0.7, suv: 0.1, van: 0.2 }, bus: false, bldClear: 1.0, build,
};

const SHOPS = [
  { name: 'Bruin Café De Gracht', type: 'bar', hue: 26, color: '#2a1a12', sign: '#f2d48a' }, { name: 'Koffie & Taart', type: 'cafe', hue: 34, color: '#1e2a2a' },
  { name: 'Boekhandel Water', type: 'books', hue: 36, color: '#2a2a3a' }, { name: 'Fietsenmaker', type: 'shop', hue: 40, color: '#1e3a4a', sign: '#f2e6c8' },
  { name: 'Kaas Huis', type: 'deli', hue: 46, color: '#d8a020', sign: '#2a1a0a' }, { name: 'Tulp & Takken', type: 'flowers', hue: 30, color: '#2a3a2a' },
  { name: 'Stroopwafel Hoek', type: 'cafe', hue: 38, color: '#4a2a1a', sign: '#f2d48a' }, { name: 'Antiek Molen', type: 'shop', hue: 36, color: '#3a2a22' },
];

async function build(cb, step) {
  const M = createMaterials(cb, cb.q, { asphalt: '#3a3634', sidewalk: '#7a6a5a', sidewalkKind: 'cobble', water: 0x16222a });
  cb.mats = M;
  cb.walkIns.push({ x: -50, z: -26, kind: 'cafe', name: 'Koffie & Taart' });
  const F = facadeMaterials(cb, [
    { wall: 'brick', color: '#5a2e22', mortar: '#7a6a5a', trim: '#f4f0e6', windowStyle: 'tall', frame: '#f4f0e6', bays: 3, bayW: 2.0, floorH: 3.2, litRatio: 0.55, seed: 901 },
    { wall: 'brick', color: '#3a2a26', mortar: '#6a5a4a', trim: '#f4f0e6', windowStyle: 'tall', frame: '#f4f0e6', bays: 3, bayW: 2.0, floorH: 3.2, litRatio: 0.55, seed: 903 },
    { wall: 'brick', color: '#7a4a32', mortar: '#8a7a6a', trim: '#f4f0e6', windowStyle: 'tall', frame: '#f4f0e6', bays: 3, bayW: 2.0, floorH: 3.2, litRatio: 0.5, seed: 907 },
    { wall: 'stucco', color: '#e8e0d0', trim: '#f4f0e6', windowStyle: 'tall', frame: '#3a3a3a', bays: 3, bayW: 2.0, floorH: 3.2, litRatio: 0.5, seed: 909 },
    { wall: 'brick', color: '#2a2a2c', mortar: '#5a5a5a', trim: '#f4f0e6', windowStyle: 'tall', frame: '#f4f0e6', bays: 3, bayW: 2.0, floorH: 3.2, litRatio: 0.5, seed: 911 },
  ]);
  const shop = shopMaterial(cb, SHOPS, 202);
  neonMaterial(cb, [{ text: 'Café', color: '#ffb347' }]);
  await step(0.15, 'Filling the canals');
  const quay = (z, name, dir) => ({ z, road: 5.5, walk: 2.6, dirs: [dir], park: dir > 0 ? [false, true] : [true, false], name, kind: 'quay', speed: 7, kinds: ['car', 'bike'] });
  const layout = {
    bounds: { minX: -130, maxX: 130, minZ: -150, maxZ: 140 }, outer: 60,
    xs: [
      { x: -85, road: 6, walk: 2.4, dirs: [1], park: [false, false], name: 'Leidsestraat', kind: 'street', kinds: ['car', 'bike'], speed: 7 },
      { x: 0, road: 6.5, walk: 2.6, dirs: [-1], park: [false, false], name: 'Vijzelstraat', kind: 'street', kinds: ['car', 'bike'], speed: 7 },
      { x: 85, road: 6, walk: 2.4, dirs: [1], park: [false, false], name: 'Utrechtsestraat', kind: 'street', kinds: ['car', 'bike'], speed: 7 },
    ],
    zs: [quay(-100, 'Keizersgracht (north quay)', 1), quay(-74, 'Keizersgracht (south quay)', -1), { z: -12, road: 6, walk: 2.4, dirs: [], park: [false, false], name: 'Kerkstraat', kind: 'street' }, quay(52, 'Prinsengracht (north quay)', 1), quay(78, 'Prinsengracht (south quay)', -1)],
    special: (b) => ((b.z0 > -100 && b.z1 < -74) || (b.z0 > 52 && b.z1 < 78) ? 'canal' : null),
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Raising canal houses');
  const rng = cb.rng;
  let si = 0;
  for (const blk of grid.blocks) {
    if (blk.special === 'canal') { canal(cb, blk, layout); continue; }
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 16 : 15, minW: 5, maxW: 7.5 });
    for (const lot of lots) {
      const f = rng.pick(F);
      const floors = rng.int(3, 5);
      const h = floors * 3.2 + 1.0;
      if (blk.outer) { building(cb, lot, { h, fronts: [lot.side], facade: f, ground: 'facade', roofKit: false, collide: false, cornice: false }); gable(cb, lot, h, f, rng, true); continue; }
      const isShop = rng.chance(0.35) || lot.walkIn;
      const idx = si++ % SHOPS.length;
      building(cb, lot, { h, fronts: [lot.side], facade: f, ground: isShop ? 'shop' : 'facade', shop, shopIdx: idx, gfH: 3.6, cornice: false, roofKit: false, parapet: 0.01, trim: 0xf4f0e6 });
      gable(cb, lot, h, f, rng, false);
      if (!isShop) stoopStep(cb, lot);
    }
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Raising canal houses');
  }
  cb.keepClear = [[-40, -71, 3]];
  furnishGrid(cb, layout, { lamp: 'deco', pole: 0x1e2a22, lampColor: 0xffcf8a, bin: 0x1e2a22, hydrant: false, signals: false, lampEvery: 22,
    tree: { kind: 'street', every: 9, chance: 0.8, scale: 1.2 }, parkTypes: [['sedan', 6], ['van', 2]],
    skip: (axis, s) => s.kind === 'quay' && false,
    extra: (P, a0, a1, axis, s, sgn) => {
      // bicycles leaning against the railings and posts
      const n = Math.floor((a1 - a0) / 6);
      for (let k = 0; k < n; k++) if (rng.chance(0.45)) { const [x, z] = P(a0 + 3 + k * 6, 0.05); if (!cb.col.blocked(x, z, 0.6)) parkedBike(cb, x, z, axis === 'x' ? 0 : Math.PI / 2); }
    } });
  foodCart(cb, 3 + 2.6 + 4, -60, -Math.PI / 2, 'coffee');
  await step(0.75, 'Lighting the bridges');
  addSkyline(cb, { seed: 23, center: [0, 0], minR: 480, maxR: 900, count: 30, arcFrom: -Math.PI, arcTo: Math.PI, hMin: 18, hMax: 70, color: '#2a2c30', lit: 0.4, beacons: false,
    extra: [{ x: -300, z: -520, w: 14, d: 14, h: 85 }, { x: -300, z: -520, w: 4, d: 4, h: 110 }] });
  cb.spawn = { x: -40, z: -74 + 2.75 + 1.3, yaw: -Math.PI / 2 + 0.55 };
  cb.viewpoints = [{ x: 0, z: -87, look: [200, 2, -87], label: 'Bridge over the Keizersgracht' }, { x: 85, z: 65, look: [-200, 2, 65], label: 'Prinsengracht at night' }];
  cb.routeHint = [[-40, -69.95], [-4.4, -69.95], [-4.4, 47.6], [80.6, 47.6], [80.6, -69.95]];
}

function canal(cb, blk, layout) {
  const M = cb.mats; const rng = cb.rng;
  const { x0, x1, z0, z1 } = blk;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 2, z1 - z0).rotateX(-Math.PI / 2), M.water);
  water.position.set((x0 + x1) / 2, -1.6, (z0 + z1) / 2);
  cb.addMesh(water, true); cb.track(water.geometry);
  for (const z of [z0 + 0.2, z1 - 0.2]) {
    cb.batch.box(M.paint, (x0 + x1) / 2, -0.75, z, x1 - x0, 1.7, 0.4, 0x5a4a3e);
    cb.batch.box(M.metal, (x0 + x1) / 2, 0.75, z, x1 - x0, 0.05, 0.05, 0x1a1a1a);
    for (let x = x0 + 1; x < x1; x += 2.5) cb.batch.box(M.metal, x, 0.45, z, 0.06, 0.6, 0.06, 0x1a1a1a);
  }
  cb.col.addRect(x0, z0, x1, z1);
  cb.mapRect('water', x0, z0, x1, z1);
  // houseboats moored along the quay
  for (let x = x0 + 6; x < x1 - 12; x += rng.range(16, 24)) {
    const zb = rng.chance(0.5) ? z0 + 2.2 : z1 - 2.2, L = rng.range(10, 14), col = rng.pick([0x2a4a3a, 0x3a2a4a, 0x6a2a22, 0x2a3a5a, 0xd8d0c0]);
    cb.batch.box(M.paint, x + L / 2, -1.2, zb, L, 0.8, 3.2, 0x2a2a2a);
    cb.batch.box(M.paint, x + L / 2, -0.25, zb, L - 1.5, 1.3, 2.8, col);
    cb.batch.box(M.bulbSoft, x + L / 2, -0.15, zb + (zb < (z0 + z1) / 2 ? -1.42 : 1.42), L - 2.5, 0.55, 0.04, 0xffc988);
    cb.batch.box(M.roof, x + L / 2, 0.45, zb, L - 1.2, 0.1, 3.0, 0x3a3a3a);
    for (let k = 0; k < 4; k++) cb.batch.prim('sphere', M.leaf, x + 1.5 + k * (L - 3) / 3, 0.7, zb, 0.5, 0.4, 0.5, rng.pick([0x4a7a3a, 0xd8405a, 0xf2b84a]));
    cb.light(x + L / 2, 0.4, zb, 0xffc988, 4, 7, 'porch');
  }
  // bridges: brick arches outlined with lights
  for (const A of layout.xs) {
    for (const sgn of [-1, 1]) {
      const x = A.x + sgn * (A.road / 2 + A.walk - 0.15);
      cb.batch.box(M.paint, x, 0.55, (z0 + z1) / 2, 0.3, 0.8, z1 - z0, 0x6a3a2a);
      cb.col.addRect(x - 0.15, z0, x + 0.15, z1);
      const n = 16;
      for (let k = 0; k <= n; k++) {
        const f = k / n, z = z0 + 1 + (z1 - z0 - 2) * f;
        const y = -1.1 + Math.sin(f * Math.PI) * 1.2;
        cb.batch.prim('sphere', M.bulb, x + sgn * 0.17, y, z, 0.07, 0.07, 0.07, 0xffd59a);
        cb.batch.prim('sphere', M.bulb, x + sgn * 0.17, 0.98, z, 0.06, 0.06, 0.06, 0xffd59a);
      }
      cb.light(x + sgn * 1.5, 0.2, (z0 + z1) / 2, 0xffd59a, 6, 9, 'street');
    }
    cb.batch.box(M.paint, A.x, -0.55, (z0 + z1) / 2, A.road + 2 * A.walk, 1.0, z1 - z0 - 3.5, 0x6a3a2a);
  }
  // elms along the water on both quays
  for (let x = x0 + 4; x < x1 - 3; x += rng.range(9, 12)) {
    tree(cb, x, z0 - 0.9, { scale: rng.range(1.2, 1.5), pit: true });
    tree(cb, x + 5, z1 + 0.9, { scale: rng.range(1.2, 1.5), pit: true });
  }
  for (let x = x0 + 10; x < x1 - 6; x += 26) bench(cb, x, z0 - 0.75, Math.PI, { label: 'canal-side bench' });
}

function gable(cb, lot, h, f, rng, simple) {
  const M = cb.mats; const Fr = frontOf(lot);
  const top = 0.15 + h;
  const col = new THREE.Color(f.spec.color);
  const kind = rng.pick(['step', 'bell', 'neck', 'spout']);
  const W = Fr.len, t = 0.5;
  const piece = (u, y, w, hh, c = col) => { const [x, z] = Fr.at(u, -t / 2); cb.batch.box(M.paint, x, y, z, Fr.horiz ? w : t, hh, Fr.horiz ? t : w, c); };
  if (kind === 'step') { let w = W; for (let k = 0; k < 4; k++) { piece(0, top + 0.6 + k * 1.1, w, 1.1); piece(-w / 2 + 0.1, top + 1.2 + k * 1.1, 0.25, 0.12, 0xf4f0e6); piece(w / 2 - 0.1, top + 1.2 + k * 1.1, 0.25, 0.12, 0xf4f0e6); w *= 0.72; } }
  else if (kind === 'bell') { piece(0, top + 1.1, W * 0.9, 2.2); piece(0, top + 2.8, W * 0.55, 1.4); const [x, z] = Fr.at(0, -t / 2); cb.batch.prim('sphere', M.paint, x, top + 3.4, z, W * 0.55, 1.4, t, col); }
  else if (kind === 'neck') { piece(0, top + 0.6, W, 1.2); piece(0, top + 2.3, W * 0.5, 2.2); piece(0, top + 3.5, W * 0.62, 0.2, 0xf4f0e6); }
  else { piece(0, top + 1.2, W, 2.4); piece(0, top + 2.5, W * 0.45, 0.2, 0xf4f0e6); }
  // pitched roof running back from the gable
  const D = Fr.horiz ? lot.z1 - lot.z0 : lot.x1 - lot.x0;
  const cx = (lot.x0 + lot.x1) / 2, cz = (lot.z0 + lot.z1) / 2;
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(Fr.horiz ? W / 2 + 0.3 : D, 0.12, Fr.horiz ? D : W / 2 + 0.3);
    if (Fr.horiz) { g.rotateZ(s * 0.7); g.translate(cx - s * W / 4, top + 1.5, cz); } else { g.rotateX(-s * 0.7); g.translate(cx, top + 1.5, cz - s * W / 4); }
    cb.batch.addGeometry(g, M.roof, 0x3a2a24);
  }
  if (simple) return;
  // hoist beam with hook under the gable top
  const [hx, hz] = Fr.at(0, 0.5);
  cb.batch.box(M.bark, hx, top + 1.0, hz, Fr.horiz ? 0.18 : 1.0, 0.18, Fr.horiz ? 1.0 : 0.18, 0x2a1a10);
}

function stoopStep(cb, lot) {
  const M = cb.mats; const Fr = frontOf(lot);
  const u = (cb.rng.f() - 0.5) * (Fr.len - 2);
  const [x, z] = Fr.at(u, 0.4);
  cb.batch.box(M.paint, x, 0.3, z, Fr.horiz ? 1.4 : 0.8, 0.3, Fr.horiz ? 0.8 : 1.4, 0x6a6a64);
  const [dx, dz] = Fr.at(u, 0.03);
  cb.batch.box(M.paint, dx, 1.6, dz, Fr.horiz ? 1.0 : 0.08, 2.3, Fr.horiz ? 0.08 : 1.0, cb.rng.pick([0x1e3a2a, 0x1a1a1e, 0x5a1a1e, 0x2a3a5a]));
  cb.batch.box(M.bulbSoft, dx + Fr.S.nx * 0.03, 2.95, dz + Fr.S.nz * 0.03, Fr.horiz ? 0.9 : 0.05, 0.35, Fr.horiz ? 0.05 : 0.9, 0xffcf8a);
  cb.col.addBox(x, z, Fr.horiz ? 0.7 : 0.4, Fr.horiz ? 0.4 : 0.7);
  if (cb.rng.chance(0.2)) { const [px, pz] = Fr.at(u + 0.3, 0.45); staticPerson(cb, px, pz, Fr.yawOut, { pose: 'sit', seatH: 0.45 }); }
}

function parkedBike(cb, x, z, yaw) {
  const M = cb.mats; const col = cb.rng.pick([0x1a1a1a, 0x2a4a6a, 0x8a1e1e, 0x2a5a3a, 0xd8d0c0]);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  for (const o of [-0.52, 0.52]) { const g = new THREE.TorusGeometry(0.33, 0.025, 5, 14); g.rotateY(-yaw); g.translate(x + c * o, 0.48, z - s * o); cb.batch.addGeometry(g, M.rubber, 0x151515); }
  cb.batch.box(M.metal, x, 0.75, z, 1.0, 0.05, 0.05, col, yaw);
  cb.batch.box(M.metal, x - c * 0.2, 0.9, z + s * 0.2, 0.05, 0.4, 0.05, col, yaw);
  cb.batch.box(M.metal, x + c * 0.45, 1.0, z - s * 0.45, 0.05, 0.05, 0.5, 0x2a2a2a, yaw);
  cb.col.addCircle(x, z, 0.4);
}
