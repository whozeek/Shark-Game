// Seoul — an alley-district interpretation: narrow lanes lit by stacks of vertical signboards,
// a busy main road, convenience stores, orange tent bars, tangled power lines and delivery
// scooters, with towers and mountains in the haze. Artistic interpretation.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import {
  createMaterials, facadeMaterials, shopMaterial, building, perimeterLots, neonMaterial, neonSign,
  furnishGrid, frontOf, staticPerson, cartOnKerb, streetlight,
} from '../world/kit.js';
import { addSkyline, addHills } from '../world/skyline.js';

export const seoul = {
  id: 'seoul', name: 'Seoul', neighborhood: 'Neon Alleys',
  blurb: 'Glowing sign stacks, tent bars and delivery scooters in narrow rainy lanes.',
  seed: 8282, palette: { fog: '#1c1e2c', accent: '#4dffd8' },
  glow: '#4a3a5a', vehicleMix: { car: 0.55, taxi: 0.25, suv: 0.15, van: 0.05 }, taxiColor: 0xd87a2a, busColor: 0x2a7ad8,
  bldClear: 1.2, build,
};

const SHOPS = [
  { name: '24시 편의점 Corner Mart', type: 'grocery', hue: 200, color: '#e8eef4', sign: '#5a2a8a' }, { name: '호프 Beer Hall', type: 'bar', hue: 30, color: '#2a1a1a', sign: '#ffd38a' },
  { name: '치킨 Fried Chicken', type: 'restaurant', hue: 30, color: '#d8a020', sign: '#2a1a0a' }, { name: '분식 Snack Bar', type: 'restaurant', hue: 18, color: '#c82a2a', sign: '#fff2c8' },
  { name: '노래방 Karaoke', type: 'bar', hue: 300, color: '#1a1a2a', sign: '#ff7ae0' }, { name: '커피 Coffee Lab', type: 'cafe', hue: 32, color: '#1e2a2a', sign: '#e8f0ec' },
  { name: '약국 Pharmacy', type: 'shop', hue: 140, color: '#e8f4ee', sign: '#1a6a3a' }, { name: '국수 Noodles', type: 'restaurant', hue: 24, color: '#3a2418', sign: '#ffd38a' },
  { name: 'PC방 Game Room', type: 'shop', hue: 220, color: '#101828', sign: '#7ad0ff' }, { name: '빵집 Bakery', type: 'cafe', hue: 36, color: '#f0e4d0', sign: '#5a3a1a' },
  { name: '세탁 Laundry', type: 'laundry', hue: 200, color: '#dfe8ee', sign: '#1a3a6a' }, { name: '포차 Night Stall', type: 'bar', hue: 22, color: '#3a1a10', sign: '#ffb06a' },
];
const NEON = [
  { text: '노래방', color: '#ff4fd8', font: 'sans-serif' }, { text: '호프', color: '#ffb347', font: 'sans-serif' }, { text: '치킨', color: '#ffe14a', font: 'sans-serif' },
  { text: '커피', color: '#4dffd8', font: 'sans-serif' }, { text: '약국', color: '#5aff8a', font: 'sans-serif' }, { text: '분식', color: '#ff5a5a', font: 'sans-serif' },
  { text: 'PC방', color: '#5ab8ff', font: 'sans-serif' }, { text: '모텔', color: '#c08aff', font: 'sans-serif' },
];

async function build(cb, step) {
  const M = createMaterials(cb, cb.q, { asphalt: '#2a2a30', sidewalk: '#7a7a80', sidewalkKind: 'tiles' });
  cb.mats = M;
  cb.walkIns.push({ x: -35, z: 10, kind: 'cafe', name: '커피 Coffee Lab' });
  const F = facadeMaterials(cb, [
    { wall: 'panel', color: '#d8d4cc', windowStyle: 'office', bays: 3, bayW: 2.6, floorH: 3.2, litRatio: 0.55, lightTint: 'mixed', seed: 801 },
    { wall: 'concrete', color: '#a8a49c', windowStyle: 'wide', frame: '#3a3a3a', bays: 3, bayW: 3, floorH: 3.2, litRatio: 0.5, lightTint: 'cool', seed: 803 },
    { wall: 'brick', color: '#7a4a3a', mortar: '#8a8070', trim: '#c8c0b0', windowStyle: 'office', bays: 3, bayW: 2.6, floorH: 3.2, litRatio: 0.55, seed: 807 },
    { wall: 'panel', color: '#c8ccd2', windowStyle: 'office', bays: 4, bayW: 2.4, floorH: 3.2, litRatio: 0.6, lightTint: 'cool', seed: 809 },
    { wall: 'stucco', color: '#e0d8c8', windowStyle: 'office', bays: 3, bayW: 2.6, floorH: 3.2, litRatio: 0.5, seed: 811 },
  ]);
  const shop = shopMaterial(cb, SHOPS, 828, { openText: '영업중' });
  neonMaterial(cb, NEON);
  await step(0.15, 'Wiring the alleys');
  const alley = (x, name) => ({ x, road: 5, walk: 1.2, dirs: [1], park: [false, false], name, kind: 'lane', kinds: ['bike'], speed: 5, crossings: true });
  const zAlley = (z, name) => ({ z, road: 5, walk: 1.2, dirs: [-1], park: [false, false], name, kind: 'lane', kinds: ['bike'], speed: 5 });
  const layout = {
    bounds: { minX: -130, maxX: 140, minZ: -130, maxZ: 130 }, outer: 60, curbH: 0.12,
    xs: [alley(-80, 'Euljiro 3-gil'), { x: -20, road: 16, walk: 4, dirs: [1, 1, -1, -1], park: [false, false], name: 'Euljiro-ro', kind: 'avenue', speed: 12 }, alley(40, 'Euljiro 5-gil'), alley(100, 'Euljiro 7-gil')],
    zs: [zAlley(-90, 'Supyo-ro 2-gil'), zAlley(-30, 'Supyo-ro 4-gil'), { z: 30, road: 14, walk: 4, dirs: [1, -1], park: [false, false], name: 'Samil-daero', kind: 'avenue', speed: 11 }, zAlley(95, 'Supyo-ro 6-gil')],
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Stacking signboards');
  const rng = cb.rng;
  let si = 0;
  // two small open plazas off the alleys for the tent bars
  const plazas = [{ x0: 43.7, x1: 58, z0: -69, z1: -51 }, { x0: -98, x1: -83.7, z0: 51, z1: 69 }];
  for (const r of plazas) { cb.addGround(M.sidewalk, r.x0, r.z0, r.x1, r.z1, 0.135, 3); cb.mapRect('plaza', r.x0, r.z0, r.x1, r.z1); }
  for (const blk of grid.blocks) {
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 14 : 12, minW: 6, maxW: 10 });
    for (const lot of lots) {
      if (plazas.some((r) => lot.x0 < r.x1 && lot.x1 > r.x0 && lot.z0 < r.z1 && lot.z1 > r.z0)) continue;
      const f = rng.pick(F);
      const floors = rng.int(3, blk.outer ? 8 : 6);
      const h = 4.0 + floors * 3.2;
      if (blk.outer) { building(cb, lot, { h: h + rng.range(0, 20), fronts: [lot.side], facade: f, ground: 'facade', roofKit: false, collide: false, cornice: false }); continue; }
      const idx = si++ % SHOPS.length;
      building(cb, lot, { h, fronts: [lot.side], facade: f, ground: 'shop', shop, shopIdx: idx, gfH: 4.0, cornice: false, parapet: 1.0, trim: 0x8a8a8a, ac: true,
        awning: rng.chance(0.35) && !lot.walkIn ? { color: rng.pick([0x2a7ad8, 0xd83a2a, 0x2aa86a, 0xf2c41a]), solid: true, depth: 1.0, drop: 0.2 } : null });
      if (!lot.walkIn) signStack(cb, lot, h, rng);
    }
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Stacking signboards');
  }
  cb.keepClear = [[-30, 50, 4]];
  furnishGrid(cb, layout, {
    lamp: 'modern', lampColor: 0xe8f0ff, bin: 0x5a6a7a, hydrant: 0xd8c040, signalColor: 0x6a6e72, lampEvery: 30,
    skip: (axis, s) => s.kind === 'lane',
    tree: { kind: 'street', every: 12, chance: 0.6, scale: 0.9 },
  });
  // alleys: low lamps on walls and a web of power lines overhead
  for (const s of [...layout.xs, ...layout.zs]) if (s.kind === 'lane') alleyWires(cb, s, layout, s.x === undefined ? 'x' : 'z');
  // orange tent bars (pojangmacha) with people inside
  tentBar(cb, 51, -60, 0); tentBar(cb, -91, 60, Math.PI);
  cartOnKerb(cb, -20 + 8 + 1.0, 70, -Math.PI / 2, 'tacos');
  await step(0.75, 'Switching on the neon');
  addHills(cb, { seed: 31, center: [0, 0], r: 1100, arcFrom: -Math.PI * 1.0, arcTo: -Math.PI * 0.1, h: 380, base: 60, color: '#232a2c', top: '#30383a', lights: true });
  addSkyline(cb, { seed: 83, center: [0, 0], minR: 380, maxR: 900, count: 80, arcFrom: -Math.PI, arcTo: Math.PI, hMin: 40, hMax: 220, color: '#262a36', lit: 0.5 });
  cb.spawn = { x: -30, z: 50, yaw: 0.0 };
  cb.viewpoints = [{ x: 40 - 2.5 - 0.6, z: -60, look: [40, 6, -120], label: 'Signs down the alley' }];
  cb.routeHint = [[-30, 50], [-30, -24], [36.9, -24], [36.9, 24.5], [-30, 24.5]];
}

function signStack(cb, lot, h, rng) {
  const F = frontOf(lot); const M = cb.mats;
  // a vertical neon sign plus stacked horizontal signboards on the upper floors
  const nIdx = rng.int(0, 7);
  const [vx, vz] = F.at(F.len / 2 - 0.7, 0.75);
  neonSign(cb, vx, Math.min(h - 1.5, 8.5), vz, F.horiz ? Math.PI / 2 : 0, nIdx, { w: Math.min(5.5, h - 6), vertical: true, strength: 0.9, poolDx: F.S.nx * 1.2, poolDz: F.S.nz * 1.2 });
  for (let y = 5.0; y < h - 1; y += 3.2) {
    if (!rng.chance(0.65)) continue;
    const col = new THREE.Color().setHSL(rng.f(), 0.75, 0.6);
    const [x, z] = F.at(rng.range(-F.len / 4, F.len / 4), 0.12);
    cb.batch.box(M.bulbSoft, x, y, z, F.horiz ? F.len * 0.55 : 0.12, 0.75, F.horiz ? 0.12 : F.len * 0.55, col);
    cb.batch.box(M.paint, x - F.S.nx * 0.01, y + 0.42, z - F.S.nz * 0.01, F.horiz ? F.len * 0.57 : 0.14, 0.08, F.horiz ? 0.14 : F.len * 0.57, 0x1a1a1a);
  }
  cb.light(vx + F.S.nx * 1.2, 4.0, vz + F.S.nz * 1.2, 0xff8ad8, 4, 7, 'neon');
}

function alleyWires(cb, s, layout, axis) {
  const M = cb.mats; const b = layout.bounds;
  const lo = axis === 'x' ? b.minX : b.minZ, hi = axis === 'x' ? b.maxX : b.maxZ;
  const fixed = axis === 'x' ? s.z : s.x;
  let prev = null;
  for (let a = lo + 4; a < hi - 4; a += 18) {
    const cross = axis === 'x' ? layout.xs : layout.zs;
    if (cross.some((c) => Math.abs(a - (axis === 'x' ? c.x : c.z)) < c.road / 2 + c.walk + 1.5)) continue;
    const off = s.road / 2 + 0.35;
    const [x, z] = axis === 'x' ? [a, fixed + off] : [fixed + off, a];
    cb.batch.prim('cyl6', M.metal, x, 4.5, z, 0.3, 9, 0.3, 0x8a8a84);
    for (let k = 0; k < 3; k++) cb.batch.prim('cyl', M.metal, x + (axis === 'x' ? 0 : 0.3), 6.8 + k * 0.5, z + (axis === 'x' ? 0.3 : 0), 0.35, 0.45, 0.35, 0x6a6a6a);
    cb.col.addCircle(x, z, 0.2);
    streetlight(cb, x - (axis === 'x' ? 0 : off * 0.9), z - (axis === 'x' ? off * 0.9 : 0), 0, 'lantern', { color: 0xfff0d8, force: true });
    if (prev) for (let k = 0; k < 5; k++) {
      const pa = new THREE.Vector3(prev[0], 7.8 + k * 0.25, prev[1]), pb = new THREE.Vector3(x, 7.6 + k * 0.3, z);
      const mid = pa.clone().lerp(pb, 0.5); mid.y -= 0.7 + k * 0.15; mid.x += (axis === 'z' ? -1.5 + k * 0.6 : 0); mid.z += (axis === 'x' ? -1.5 + k * 0.6 : 0);
      cb.batch.beam(M.metal, pa, mid, 0.02, 0x111111, true); cb.batch.beam(M.metal, mid, pb, 0.02, 0x111111, true);
    }
    prev = [x, z];
  }
}

function tentBar(cb, x, z, yaw) {
  const M = cb.mats;
  const tent = cb.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.75, 0.25), transparent: true, opacity: 0.88, side: THREE.DoubleSide }));
  cb.neonMats.push(tent); tent.userData.base = 1.6;
  const g = new THREE.BoxGeometry(4, 2.4, 3); g.translate(x, 1.35, z);
  cb.batch.addGeometry(g, tent, 0xffffff);
  cb.batch.box(M.paint, x, 2.6, z, 4.2, 0.12, 3.2, 0xc86a1a);
  cb.light(x, 2.0, z, 0xff9a40, 10, 9, 'neon');
  cb.pool(x, z, 4.5, 0xff9a40, 0.7, 'neon');
  for (let k = 0; k < 3; k++) staticPerson(cb, x - 1.2 + k * 1.2, z + (k % 2 ? 0.6 : -0.6), yaw + (k % 2 ? Math.PI : 0), { pose: 'sit', seatH: 0.45 });
  cb.col.addRect(x - 2, z - 1.5, x + 2, z + 1.5);
}
