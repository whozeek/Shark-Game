// Paris — a Left Bank interpretation: cream Haussmann buildings with wrought-iron balconies and
// zinc mansard roofs, wide tree-lined boulevards, café terraces, advertising columns and a Métro.
// Street names are borrowed for flavour; layout and buildings are artistic interpretations.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import {
  createMaterials, facadeMaterials, shopMaterial, building, perimeterLots, neonMaterial, neonSign,
  furnishGrid, frontOf, cafeSet, staticPerson, cartOnKerb, SIDES,
} from '../world/kit.js';
import { addSkyline } from '../world/skyline.js';
import { subwayStation } from '../world/interiors.js';

export const paris = {
  id: 'paris', name: 'Paris', neighborhood: 'Left Bank Boulevards',
  blurb: 'Haussmann façades, iron balconies, café terraces and plane-tree boulevards.',
  seed: 7575, palette: { fog: '#262430', accent: '#ffcf8a' },
  glow: '#5a4a40', vehicleMix: { car: 0.6, taxi: 0.1, suv: 0.1, van: 0.2 }, taxiColor: 0x1a1a1e, busColor: 0x5a8a6a,
  bldClear: 1.6, build,
};

const SHOPS = [
  { name: 'Café de la Pluie', type: 'cafe', hue: 30, color: '#4a1a1e', sign: '#f2d48a' }, { name: 'Boulangerie Lune', type: 'cafe', hue: 38, color: '#2a3a4a', sign: '#f2e6c8' },
  { name: 'Librairie du Quai', type: 'books', hue: 36, color: '#1e2a22', sign: '#f2e6c8' }, { name: 'Le Petit Zinc', type: 'bar', hue: 22, color: '#3a1a1a', sign: '#f2d48a' },
  { name: 'Fromagerie Bleue', type: 'deli', hue: 44, color: '#1e2a4a', sign: '#f2e6c8' }, { name: 'Fleurs de Seine', type: 'flowers', hue: 30, color: '#2a3a2a' },
  { name: 'Pharmacie', type: 'shop', hue: 140, color: '#1e3a2a', sign: '#7aff9a' }, { name: 'Brasserie Verlaine', type: 'restaurant', hue: 24, color: '#4a2a1a', sign: '#f2d48a' },
  { name: 'Chocolatier Marceau', type: 'shop', hue: 32, color: '#3a2418' }, { name: 'Disques Rive Gauche', type: 'records', hue: 300, color: '#1a1a2a' },
  { name: 'Tabac — Presse', type: 'grocery', hue: 10, color: '#2a1a1a', sign: '#ff7a5a' }, { name: 'Galerie Sorel', type: 'shop', hue: 40, color: '#e8e4dc', sign: '#222' },
];
const NEON = [{ text: 'Café', color: '#ff9a3c' }, { text: 'Bar', color: '#ff4fa0' }, { text: 'Tabac', color: '#ff5a3a' }, { text: 'Hôtel', color: '#7fd0ff' }];

async function build(cb, step) {
  const M = createMaterials(cb, cb.q, { asphalt: '#2c2c32', sidewalk: '#9a948a' });
  cb.mats = M;
  cb.walkIns.push({ x: 18, z: 8, kind: 'cafe', name: 'Café de la Pluie' });
  const F = facadeMaterials(cb, [
    { wall: 'stone', color: '#d8ccb0', trim: '#e6dcc4', lintel: '#e6dcc4', windowStyle: 'tall', bays: 4, bayW: 2.4, floorH: 3.2, bands: true, bandColor: '#cfc3a8', litRatio: 0.5, seed: 701, frame: '#f2ece0', shutters: false },
    { wall: 'stone', color: '#e2d8c0', trim: '#ece2cc', lintel: '#ece2cc', windowStyle: 'tall', bays: 4, bayW: 2.4, floorH: 3.2, bands: true, bandColor: '#d6cab0', litRatio: 0.5, seed: 703, frame: '#f2ece0' },
    { wall: 'stucco', color: '#cfc4a8', trim: '#ddd2b8', windowStyle: 'tall', bays: 4, bayW: 2.4, floorH: 3.2, bands: true, bandColor: '#c6baa0', litRatio: 0.45, seed: 707, frame: '#f2ece0', shutters: true, shutterColor: '#5a6a6a' },
  ]);
  const shop = shopMaterial(cb, SHOPS, 757);
  neonMaterial(cb, NEON);
  const zinc = cb.track(new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.4, metalness: 0.6, vertexColors: true }));
  await step(0.15, 'Laying out the boulevards');
  const layout = {
    bounds: { minX: -135, maxX: 140, minZ: -135, maxZ: 130 }, outer: 70,
    xs: [
      { x: -90, road: 7, walk: 3, dirs: [1], park: [false, true], name: 'Rue de Seine', kind: 'street' },
      { x: 0, road: 17, walk: 7, dirs: [1, 1, -1, -1], park: [true, true], name: 'Boulevard Saint-Michel', kind: 'avenue', speed: 11 },
      { x: 95, road: 7, walk: 3, dirs: [-1], park: [true, false], name: 'Rue Jacob', kind: 'street' },
    ],
    zs: [
      { z: -95, road: 7, walk: 3, dirs: [1], park: [false, true], name: 'Rue de Buci', kind: 'street' },
      { z: -10, road: 17, walk: 7, dirs: [1, 1, -1, -1], park: [true, true], name: 'Boulevard Saint-Germain', kind: 'avenue', speed: 11 },
      { z: 85, road: 7, walk: 3, dirs: [-1], park: [true, false], name: 'Rue Saint-Sulpice', kind: 'street' },
    ],
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Carving Haussmann façades');
  const rng = cb.rng;
  let si = 0;
  for (const blk of grid.blocks) {
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 18 : 16, minW: 11, maxW: 17 });
    for (const lot of lots) {
      const st = blk.streets[lot.side];
      const f = rng.pick(F);
      const floors = rng.int(5, 6);
      const h = 4.6 + floors * 3.2;
      if (blk.outer) { building(cb, lot, { h, fronts: [lot.side], facade: f, ground: 'facade', roofKit: false, collide: false, cornice: true, corniceColor: 0xd6cab0, base: 0.15 }); mansard(cb, lot, h, zinc, true); continue; }
      const idx = si++ % SHOPS.length; const s = SHOPS[idx];
      const boulevard = st?.kind === 'avenue';
      building(cb, lot, { h, fronts: [lot.side], facade: f, ground: 'shop', shop, shopIdx: idx, gfH: 4.6, cornice: true, corniceH: 0.6, corniceD: 0.6, corniceColor: 0xd6cab0, trim: 0xd6cab0, ledges: true, ledgeColor: 0xd6cab0, roofKit: false,
        awning: (s.type === 'cafe' || s.type === 'restaurant' || s.type === 'bar') && !lot.walkIn ? { color: rng.pick([0x8a1e22, 0x1e3a2a, 0x2a2a4a]), solid: true, depth: boulevard ? 3.2 : 1.6, drop: 0.5 } : null });
      balconies(cb, lot, [4.6 + 3.2 + 0.15, 4.6 + 3.2 * 4 + 0.15]);
      mansard(cb, lot, h, zinc, false);
      if (boulevard && (s.type === 'cafe' || s.type === 'restaurant' || s.type === 'bar') && !lot.walkIn) terrace(cb, lot);
      const ni = { cafe: 0, bar: 1, grocery: 2 }[s.type];
      if (ni !== undefined && !lot.walkIn && rng.chance(0.6)) {
        const Fr = frontOf(lot);
        const [nx, nz] = Fr.at(-Fr.len / 2 + 0.8, 0.7);
        neonSign(cb, nx, 5.5, nz, Fr.horiz ? Math.PI / 2 : 0, ni, { w: 1.4, vertical: true, poolDx: Fr.S.nx, poolDz: Fr.S.nz });
      }
    }
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Carving Haussmann façades');
  }
  cb.keepClear = [[-11.5, 30, 4], [-12, -40, 3.5]];
  furnishGrid(cb, layout, {
    lamp: 'deco', pole: 0x1e2a22, lampColor: 0xffd49a, bin: 0x2a3a2a, hydrant: false, signalColor: 0x2a2d30,
    tree: { kind: 'street', every: 9, chance: 1, fence: true, scale: 1.25 },
    skip: undefined,
    extra: (P, a0, a1, axis, s, sgn) => {
      if (s.kind === 'avenue' && rng.chance(0.55)) { const [x, z] = P(a0 + 12, 0.35); if (!cb.col.blocked(x, z, 1.2)) morrisColumn(cb, x, z); }
    },
  });
  subwayStation(cb, [-12, -40], { name: 'Saint-Germain', exitDz: 2.6 });
  cartOnKerb(cb, -8.5 - 1.0, 40, Math.PI / 2, 'coffee');
  await step(0.75, 'Lighting the terraces');
  addSkyline(cb, { seed: 91, center: [0, 0], minR: 450, maxR: 900, count: 55, arcFrom: -Math.PI, arcTo: Math.PI, hMin: 18, hMax: 40, color: '#2e2c32', lit: 0.45, beacons: false,
    extra: [{ x: 360, z: -520, w: 60, d: 60, h: 55 }, { x: 360, z: -520, w: 34, d: 34, h: 85 }, { x: -420, z: 300, w: 50, d: 50, h: 48 }] });
  cb.spawn = { x: -11.5, z: 30, yaw: 0.05 };
  cb.viewpoints = [{ x: 11.5, z: -10 - 8.5 - 3.5, look: [-200, 8, -10], label: 'Down the boulevard' }];
  cb.routeHint = [[-11.5, 30], [-11.5, -27.5], [78, -27.5], [78, 7.5], [-11.5, 7.5]];
}

function balconies(cb, lot, levels) {
  const M = cb.mats; const F = frontOf(lot);
  for (const y of levels) {
    const [cx, cz] = F.at(0, 0.45);
    cb.batch.box(M.paint, cx, y, cz, F.horiz ? F.len - 0.4 : 0.9, 0.12, F.horiz ? 0.9 : F.len - 0.4, 0xd6cab0);
    const [rx, rz] = F.at(0, 0.88);
    cb.batch.box(M.metal, rx, y + 1.0, rz, F.horiz ? F.len - 0.4 : 0.04, 0.05, F.horiz ? 0.04 : F.len - 0.4, 0x141414);
    cb.batch.box(M.metal, rx, y + 0.35, rz, F.horiz ? F.len - 0.4 : 0.03, 0.04, F.horiz ? 0.03 : F.len - 0.4, 0x141414);
    const n = Math.floor((F.len - 0.4) / 0.12);
    for (let k = 0; k <= n; k++) { const [x, z] = F.at(-F.len / 2 + 0.2 + k * (F.len - 0.4) / n, 0.88); cb.batch.box(M.metal, x, y + 0.55, z, 0.02, 0.9, 0.02, 0x141414); }
  }
}

function mansard(cb, lot, h, zinc, simple) {
  const M = cb.mats; const F = frontOf(lot);
  const top = 0.15 + h, mh = 3.6;
  const W = lot.x1 - lot.x0, D = lot.z1 - lot.z0, cx = (lot.x0 + lot.x1) / 2, cz = (lot.z0 + lot.z1) / 2;
  // steep lower slope + flat top
  for (const side of ['n', 's', 'e', 'w']) {
    const S = SIDES[side]; const horiz = side === 'n' || side === 's';
    const len = horiz ? W : D;
    const g = new THREE.BoxGeometry(horiz ? len : 0.2, Math.hypot(mh, 1.1), horiz ? 0.2 : len);
    if (horiz) g.rotateX(-S.nz * Math.atan2(1.1, mh)); else g.rotateZ(S.nx * Math.atan2(1.1, mh));
    g.translate(cx + S.nx * ((horiz ? 0 : W / 2) - 0.55), top + mh / 2, cz + S.nz * ((horiz ? D / 2 : 0) - 0.55));
    cb.batch.addGeometry(g, zinc, 0xffffff);
  }
  cb.batch.box(zinc, cx, top + mh, cz, W - 2.0, 0.15, D - 2.0, 0x8a8e94);
  if (simple) return;
  // dormer windows on the street side and chimney stacks
  const n = Math.max(2, Math.floor(F.len / 2.4));
  for (let k = 0; k < n; k++) {
    const u = -F.len / 2 + (k + 0.5) * F.len / n;
    const [x, z] = F.at(u, -0.45);
    cb.batch.box(zinc, x, top + 1.5, z, F.horiz ? 1.0 : 0.9, 1.5, F.horiz ? 0.9 : 1.0, 0xa8acb2);
    const [wx, wz] = F.at(u, -0.02);
    const lit = cb.rng.chance(0.45);
    cb.batch.box(lit ? M.bulbSoft : M.glass, wx, top + 1.4, wz, F.horiz ? 0.6 : 0.05, 0.9, F.horiz ? 0.05 : 0.6, lit ? 0xffc988 : 0xffffff);
    cb.batch.prim('cone', zinc, x, top + 2.5, z, 1.3, 0.6, 1.3, 0xa8acb2);
  }
  for (let k = 0; k < 3; k++) {
    const x = lot.x0 + 1 + cb.rng.f() * (W - 2), z = lot.z0 + 1 + cb.rng.f() * (D - 2);
    cb.batch.box(M.paint, x, top + mh + 0.6, z, 1.6, 1.2, 0.6, 0xb8a890);
    for (let q = 0; q < 4; q++) cb.batch.prim('cyl', M.paint, x - 0.6 + q * 0.4, top + mh + 1.35, z, 0.18, 0.4, 0.18, 0xb86a4a);
  }
}

function terrace(cb, lot) {
  const F = frontOf(lot);
  const n = Math.max(1, Math.floor((F.len - 2) / 2.2));
  for (let k = 0; k < n; k++) {
    const u = -F.len / 2 + 1.4 + k * (F.len - 2.8) / Math.max(1, n - 1);
    const [x, z] = F.at(u, 1.25);
    // chairs face the street, Paris-style
    cafeSet(cb, x, z, F.horiz ? 0 : Math.PI / 2);
    if (cb.rng.chance(0.4)) { const [px, pz] = F.at(u - 0.75, 1.25); staticPerson(cb, px, pz, F.yawOut, { pose: 'sit', seatH: 0.45, cup: true }); }
  }
  // patio heaters glow
  const [hx, hz] = F.at(0, 2.4);
  cb.light(hx, 2.6, hz, 0xff9a5a, 6, 7, 'shop');
  cb.pool(hx, hz, 3.5, 0xff9a5a, 0.45, 'shop');
}

function morrisColumn(cb, x, z) {
  const M = cb.mats;
  cb.batch.prim('cyl', M.paint, x, 1.6, z, 1.25, 3.0, 1.25, 0x1e3a2a);
  cb.batch.prim('cyl', M.bulbSoft, x, 1.8, z, 1.2, 2.2, 1.2, 0xf2dcc0);
  cb.batch.prim('sphere', M.paint, x, 3.25, z, 1.35, 0.7, 1.35, 0x1e3a2a);
  cb.batch.prim('cone', M.paint, x, 3.65, z, 0.3, 0.5, 0.3, 0x1e3a2a);
  cb.light(x, 2.0, z, 0xf2dcc0, 3, 5, 'shop');
  cb.col.addCircle(x, z, 0.7);
}
