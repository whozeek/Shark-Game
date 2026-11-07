// Kyoto — a stylised, original canal quarter inspired by traditional Japanese townscapes:
// wooden lattice houses, tiled eaves, paper lanterns, willows and cherry trees along a stone
// canal, small bridges and a quiet garden. Not a reconstruction of any real street.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import { createMaterials, facadeMaterials, shopMaterial, building, perimeterLots, streetlight, tree, bench, SIDES, grassMaterial } from '../world/kit.js';
import { addHills, addSkyline } from '../world/skyline.js';
import { makePaving, makeNoren, makeLantern } from '../render/textures.js';
import { patchGround, patchWash } from '../render/shared.js';

export const kyoto = {
  id: 'kyoto', name: 'Kyoto', neighborhood: 'Canal Lanes',
  blurb: 'A stylised canal quarter of wooden houses, lanterns, willows and bridges.',
  seed: 8080, palette: { fog: '#1e2420', accent: '#ffcf7a' },
  glow: '#5a4a3a', vehicleMix: { car: 0 }, bus: false, noSignals: true, pedStyle: 'kyoto', bldClear: 0.6,
  build,
};

const SHOPS = [
  { name: '茶房 Willow Tea', type: 'tea', hue: 38, color: '#2a1e16', sign: '#f2e6c8' }, { name: '和菓子 Sweets', type: 'shop', hue: 32, color: '#3a2a1e', sign: '#f2e6c8' },
  { name: 'Lantern Noodles', type: 'restaurant', hue: 24, color: '#2a1a14', sign: '#ffd59a' }, { name: 'Indigo Textiles', type: 'shop', hue: 210, color: '#1e2a3a', sign: '#e8e0d0' },
  { name: '酒 Sake Bar', type: 'bar', hue: 20, color: '#2a1612', sign: '#ffcf8a' }, { name: 'Paper & Ink', type: 'books', hue: 36, color: '#2e241c', sign: '#f2e6c8' },
  { name: 'Moss Garden Café', type: 'cafe', hue: 40, color: '#24301e', sign: '#e8f0d8' }, { name: 'Pottery Studio', type: 'shop', hue: 30, color: '#3a2e24', sign: '#f2e6c8' },
];

async function build(cb, step) {
  const M = createMaterials(cb, cb.q, { sidewalk: '#7a756c', sidewalkKind: 'cobble', water: 0x1a2a26 });
  // stone-paved lanes instead of asphalt
  M.asphalt = cb.track(patchGround(new THREE.MeshStandardMaterial({ map: cb.track(makePaving(12, { kind: 'cobble', base: '#5e5a54' })), roughness: 0.85, vertexColors: true }), { puddleScale: 1.1, taps: cb.q.reflTaps }));
  cb.mats = M;
  const F = facadeMaterials(cb, [
    { wall: 'wood', color: '#4a2e1e', trim: '#2a1a10', windowStyle: 'lattice', frame: '#2a1a10', bays: 3, bayW: 2.2, floorH: 3.0, litRatio: 0.65, seed: 301 },
    { wall: 'wood', color: '#5a3a26', trim: '#2e1c12', windowStyle: 'lattice', frame: '#3a2416', bays: 3, bayW: 2.2, floorH: 3.0, litRatio: 0.6, seed: 307 },
    { wall: 'stucco', color: '#d8cdb4', trim: '#3a2416', windowStyle: 'lattice', frame: '#3a2416', bays: 3, bayW: 2.2, floorH: 3.0, litRatio: 0.55, seed: 311 },
    { wall: 'wood', color: '#3a2618', trim: '#1e140c', windowStyle: 'lattice', frame: '#1e140c', bays: 4, bayW: 2.0, floorH: 3.0, litRatio: 0.6, seed: 313 },
  ]);
  const shop = shopMaterial(cb, SHOPS, 808, { openText: '営業中' });
  const tileMat = cb.track(patchWash(new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.55, metalness: 0.15, vertexColors: true }), 0.04));
  const noren = ['茶', '酒', '麺', '菓', '宿'].map((t, i) => cb.track(new THREE.MeshStandardMaterial({ map: cb.track(makeNoren(t, ['#24304a', '#5a1e1e', '#2e3a2a', '#3a2a4a', '#24304a'][i])), side: THREE.DoubleSide, roughness: 0.9 })));
  const lanternMats = [['', '#ffefd0'], ['', '#ff9a6a'], ['祭', '#ffd8a0']].map(([t, c]) => {
    const m = cb.track(new THREE.MeshBasicMaterial({ map: cb.track(makeLantern(t, c)), color: new THREE.Color(1, 1, 1).multiplyScalar(2.4) }));
    cb.neonMats.push(m); m.userData.base = 2.4;
    return m;
  });
  cb.lanternMats = lanternMats;
  await step(0.15, 'Laying stone lanes');

  const layout = {
    bounds: { minX: -130, maxX: 125, minZ: -140, maxZ: 135 },
    outer: 60,
    curbH: 0.08,
    xs: [
      { x: -90, road: 6, walk: 1.8, dirs: [1], park: [false, false], name: 'Ishidatami-michi', kind: 'lane', kinds: ['bike'], speed: 4 },
      { x: -20, road: 7, walk: 2.0, dirs: [-1], park: [false, false], name: 'Chōchin-dōri', kind: 'lane', kinds: ['bike'], speed: 4 },
      { x: 55, road: 6, walk: 1.8, dirs: [1], park: [false, false], name: 'Momiji-koji', kind: 'lane', kinds: ['bike'], speed: 4 },
    ],
    zs: [
      { z: -110, road: 6, walk: 1.8, dirs: [1], park: [false, false], name: 'Yanagi-koji', kind: 'lane', kinds: ['bike'], speed: 4 },
      { z: -30, road: 5.5, walk: 2.2, dirs: [], park: [false, false], name: 'Kawabata north bank', kind: 'lane' },
      { z: -6, road: 5.5, walk: 2.2, dirs: [], park: [false, false], name: 'Kawabata south bank', kind: 'lane' },
      { z: 72, road: 6, walk: 1.8, dirs: [-1], park: [false, false], name: 'Sakura-dōri', kind: 'lane', kinds: ['bike'], speed: 4 },
    ],
    special: (b) => (b.z0 > -30 && b.z1 < -6 ? 'canal' : null),
    noBarriers: true,
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Building machiya houses');
  const rng = cb.rng;
  const gardenBlock = grid.blocks.find((b) => b.inside && b.streets.w?.x === -20 && b.streets.n?.z === -6);
  let si = 0;
  for (const blk of grid.blocks) {
    if (blk.special === 'canal') { canal(cb, blk); continue; }
    if (blk === gardenBlock) { garden(cb, blk); continue; }
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 16 : 13, minW: 5.5, maxW: 9 });
    for (const lot of lots) {
      if (blk.outer) { machiya(cb, lot, rng.pick(F), rng, { simple: true }); continue; }
      const isShop = rng.chance(0.45);
      machiya(cb, lot, rng.pick(F), rng, { shop: isShop ? shop : null, shopIdx: si++ % SHOPS.length, noren: rng.pick(noren), tileMat, lantern: rng.pick(lanternMats) });
    }
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Building machiya houses');
  }
  cb.keepClear = [[-60, -6 - 2.75 - 1.1 + 0.0, 3]];
  furnish(cb, layout, lanternMats);
  await step(0.72, 'Hanging lanterns');
  addHills(cb, { seed: 21, center: [0, 0], r: 900, arcFrom: -Math.PI, arcTo: Math.PI, h: 220, base: 50, color: '#1e2a24', top: '#2a3430', lights: true });
  addHills(cb, { seed: 23, center: [0, 0], r: 1300, arcFrom: -Math.PI, arcTo: Math.PI, h: 360, base: 80, color: '#28302e', top: '#343c3c' });
  pagoda(cb, 340, -520, 0);
  addSkyline(cb, { seed: 61, center: [0, 0], minR: 420, maxR: 650, count: 24, arcFrom: Math.PI * 0.2, arcTo: Math.PI * 0.8, hMin: 18, hMax: 45, color: '#2a2a2c', lit: 0.4, beacons: false });
  cb.spawn = { x: -60, z: -6 - 2.75 - 1.1, yaw: -Math.PI / 2 + 0.35 };
  cb.viewpoints = [
    { x: -20 + 3.5 + 1, z: -18, look: [120, 2, -18], label: 'Down the canal' },
    { x: 15, z: 25, look: [15, 1, 35], label: 'Garden pond' },
  ];
  cb.routeHint = [[-60, -9.85], [-13.5, -9.85], [-13.5, 66.5], [48, 66.5], [48, -9.85]];
}

function machiya(cb, lot, fac, rng, o) {
  const M = cb.mats; const side = lot.side; const S = SIDES[side];
  const floors = o.simple ? 2 : rng.weighted([[2, 5], [3, 1]]);
  const h = floors * 3.0 + 0.4;
  building(cb, lot, { h, fronts: [side], facade: fac, ground: o.shop ? 'shop' : 'facade', shop: o.shop, shopIdx: o.shopIdx, gfH: 3.0, cornice: false, roofKit: false, parapet: 0.01, trim: 0x2a1a10, collide: !o.simple, signTrim: 0x2a1a10, base: 0.08 });
  const horiz = side === 'n' || side === 's';
  const len = horiz ? lot.x1 - lot.x0 : lot.z1 - lot.z0;
  const depth = horiz ? lot.z1 - lot.z0 : lot.x1 - lot.x0;
  const cx = (lot.x0 + lot.x1) / 2, cz = (lot.z0 + lot.z1) / 2;
  const fx = side === 'e' ? lot.x1 : side === 'w' ? lot.x0 : cx;
  const fz = side === 's' ? lot.z1 : side === 'n' ? lot.z0 : cz;
  const tile = o.tileMat || M.roof;
  const tileC = rng.pick([0x3a3c40, 0x34363a, 0x404246]);
  // pent roof between floors (hisashi)
  const pent = (y, out) => {
    const g = new THREE.BoxGeometry(horiz ? len + 0.1 : out, 0.12, horiz ? out : len + 0.1);
    const tilt = 0.32;
    g.rotateX(horiz ? S.nz * tilt : 0); g.rotateZ(horiz ? 0 : -S.nx * tilt);
    g.translate(fx + S.nx * out / 2, y, fz + S.nz * out / 2);
    cb.batch.addGeometry(g, tile, tileC);
  };
  pent(3.3, 1.0);
  if (floors === 3) pent(6.3, 0.7);
  // main gable roof (ridge parallel to the street)
  const top = 0.08 + h;
  const half = depth / 2 + 0.6;
  for (const sgn of [-1, 1]) {
    const g = new THREE.BoxGeometry(horiz ? len + 0.4 : half * 1.08, 0.16, horiz ? half * 1.08 : len + 0.4);
    const a = 0.42 * sgn;
    if (horiz) { g.rotateX(a); g.translate(cx, top + Math.tan(0.42) * half / 2, cz + sgn * half / 2); }
    else { g.rotateZ(-a); g.translate(cx + sgn * half / 2, top + Math.tan(0.42) * half / 2, cz); }
    cb.batch.addGeometry(g, tile, tileC);
  }
  cb.batch.box(tile, cx, top + Math.tan(0.42) * half + 0.05, cz, horiz ? len + 0.4 : 0.35, 0.22, horiz ? 0.35 : len + 0.4, 0x2a2c30);
  if (o.simple) return;
  // wooden plinth and bench-like ledge
  cb.batch.box(M.paint, fx + S.nx * 0.12, 0.25, fz + S.nz * 0.12, horiz ? len : 0.24, 0.3, horiz ? 0.24 : len, 0x2a1a10);
  if (o.shop) {
    // noren curtain over the entrance and a hanging lantern
    const along = rng.range(-len / 2 + 1, len / 2 - 1);
    const nx = horiz ? fx + along : fx + S.nx * 0.25, nz = horiz ? fz + S.nz * 0.25 : fz + along;
    const ng = new THREE.PlaneGeometry(1.4, 1.05); ng.rotateY(S.ry); ng.translate(nx, 2.35, nz);
    cb.batch.addGeometry(ng, o.noren, 0xffffff);
    const lx = nx + S.nx * 0.6 + (horiz ? 1.0 : 0), lz = nz + S.nz * 0.6 + (horiz ? 0 : 1.0);
    hangLantern(cb, lx, 2.65, lz, o.lantern);
  } else if (rng.chance(0.3)) {
    hangLantern(cb, fx + S.nx * 0.7, 2.6, fz + S.nz * 0.7, o.lantern);
  }
  // potted plants by the door
  if (rng.chance(0.5)) {
    const a = rng.range(-len / 2 + 0.6, len / 2 - 0.6);
    const px = horiz ? fx + a : fx + S.nx * 0.45, pz = horiz ? fz + S.nz * 0.45 : fz + a;
    cb.batch.prim('cyl', M.paint, px, 0.3, pz, 0.45, 0.45, 0.45, 0x5a4a3a);
    cb.batch.prim('sphere', M.leaf, px, 0.75, pz, 0.6, 0.6, 0.6, 0x3e6b35);
  }
}

function hangLantern(cb, x, y, z, mat) {
  const g = new THREE.CylinderGeometry(0.22, 0.22, 0.55, 12, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const yy = p.getY(i); const f = 1 + 0.25 * Math.cos(yy / 0.275 * Math.PI / 2); p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); }
  g.computeVertexNormals();
  g.translate(x, y, z);
  cb.batch.addGeometry(g, mat, 0xffffff);
  cb.batch.box(cb.mats.paint, x, y + 0.31, z, 0.3, 0.06, 0.3, 0x1a1a1a);
  cb.batch.box(cb.mats.paint, x, y - 0.31, z, 0.3, 0.06, 0.3, 0x1a1a1a);
  cb.light(x, y - 0.2, z, 0xffb070, 4, 7, 'neon');
  cb.pool(x, z, 2.4, 0xffb070, 0.55, 'neon');
}

function canal(cb, blk) {
  const M = cb.mats; const rng = cb.rng;
  const { x0, x1, z0, z1 } = blk;
  const mid = (z0 + z1) / 2, half = 3.2;
  // grassy/stone banks
  const bank = grassMaterial(cb, 0x6a7a58);
  cb.addGround(bank, x0, z0, x1, mid - half, 0.08, 4);
  cb.addGround(bank, x0, mid + half, x1, z1, 0.08, 4);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 2, half * 2).rotateX(-Math.PI / 2), M.water);
  water.position.set((x0 + x1) / 2, -1.0, mid);
  cb.addMesh(water, true); cb.track(water.geometry);
  for (const sgn of [-1, 1]) {
    cb.batch.box(M.paint, (x0 + x1) / 2, -0.45, mid + sgn * (half + 0.2), x1 - x0, 1.1, 0.4, 0x6a665e);
    cb.batch.box(M.paint, (x0 + x1) / 2, 0.12, mid + sgn * (half + 0.25), x1 - x0, 0.12, 0.6, 0x8a857a);
  }
  // bridge sides (stone)
  cb.batch.box(M.paint, x0 - 0.2, -0.45, mid, 0.4, 1.1, half * 2, 0x6a665e);
  cb.batch.box(M.paint, x1 + 0.2, -0.45, mid, 0.4, 1.1, half * 2, 0x6a665e);
  // willows and cherries along the banks
  for (let x = x0 + 3; x < x1 - 2; x += rng.range(7, 10)) {
    tree(cb, x, mid - half - 1.4 + rng.range(-0.3, 0.3), { kind: rng.chance(0.6) ? 'willow' : 'cherry', pit: false, scale: rng.range(0.9, 1.15) });
    tree(cb, x + 4, mid + half + 1.4 + rng.range(-0.3, 0.3), { kind: rng.chance(0.6) ? 'willow' : 'cherry', pit: false, scale: rng.range(0.9, 1.15) });
  }
  // low railings at the water's edge
  for (const sgn of [-1, 1]) {
    const z = mid + sgn * (half + 0.45);
    cb.batch.box(M.paint, (x0 + x1) / 2, 0.7, z, x1 - x0, 0.08, 0.08, 0x3a2416);
    for (let x = x0 + 1; x < x1; x += 2.2) cb.batch.box(M.paint, x, 0.42, z, 0.1, 0.65, 0.1, 0x3a2416);
  }
  cb.col.addRect(x0, z0, x1, z1);
  cb.mapRect('park', x0, z0, x1, z1);
  cb.mapRect('water', x0, mid - half, x1, mid + half);
}

function garden(cb, blk) {
  const M = cb.mats; const rng = cb.rng;
  const { x0, x1, z0, z1 } = blk;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const gravel = cb.track(new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 1 }));
  const moss = grassMaterial(cb, 0x5a7a4a);
  cb.addGround(moss, x0, z0, x1, z1, 0.09, 4);
  cb.addGround(gravel, cx - 2, z0, cx + 2, z1, 0.1, 3);
  cb.addGround(gravel, x0, cz - 2, x1, cz + 2, 0.101, 3);
  cb.mapRect('park', x0, z0, x1, z1);
  // pond
  const pr = 9;
  const pond = new THREE.Mesh(new THREE.CircleGeometry(pr, 40).rotateX(-Math.PI / 2), M.water);
  pond.position.set(cx + 18, -0.2, cz + 14);
  cb.addMesh(pond, true); cb.track(pond.geometry);
  for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2; cb.batch.prim('sphere', M.paint, cx + 18 + Math.cos(a) * pr, 0.1, cz + 14 + Math.sin(a) * pr, rng.range(0.8, 1.4), rng.range(0.4, 0.7), rng.range(0.8, 1.4), rng.pick([0x6a665e, 0x5a5650, 0x7a756c])); }
  cb.col.addCircle(cx + 18, cz + 14, pr + 0.3);
  cb.map('water', Array.from({ length: 16 }, (_, k) => [cx + 18 + Math.cos(k / 16 * Math.PI * 2) * pr, cz + 14 + Math.sin(k / 16 * Math.PI * 2) * pr]));
  // stone lanterns
  for (const [lx, lz] of [[cx + 8, cz + 6], [cx + 28, cz + 22], [cx - 10, cz - 10], [cx + 6, cz - 22]]) {
    cb.batch.box(M.paint, lx, 0.5, lz, 0.5, 0.9, 0.5, 0x7a756c);
    cb.batch.box(M.paint, lx, 1.05, lz, 0.8, 0.12, 0.8, 0x7a756c);
    cb.batch.box(M.bulbSoft, lx, 1.3, lz, 0.4, 0.38, 0.4, 0xffc070);
    cb.batch.prim('cone', M.paint, lx, 1.75, lz, 1.2, 0.5, 1.2, 0x6a665e);
    cb.light(lx, 1.3, lz, 0xffc070, 3, 6, 'neon');
    cb.pool(lx, lz, 2.2, 0xffc070, 0.5, 'neon');
    cb.col.addCircle(lx, lz, 0.5);
  }
  // trees
  for (let k = 0; k < 14; k++) {
    const tx = rng.range(x0 + 4, x1 - 4), tz = rng.range(z0 + 4, z1 - 4);
    if (Math.abs(tx - cx) < 4 || Math.abs(tz - cz) < 4 || Math.hypot(tx - cx - 18, tz - cz - 14) < pr + 3) continue;
    tree(cb, tx, tz, { kind: rng.pick(['cherry', 'cherry', 'street', 'pine']), color: rng.chance(0.3) ? 0xb8402a : undefined, pit: false, scale: rng.range(0.8, 1.2) });
  }
  // gate at the north entrance
  const gz = z0 + 1;
  for (const o of [-2.2, 2.2]) { cb.batch.box(M.bark, cx + o, 1.9, gz, 0.35, 3.8, 0.35, 0x2a1a10); cb.col.addCircle(cx + o, gz, 0.3); }
  cb.batch.box(M.bark, cx, 3.6, gz, 5.6, 0.3, 0.4, 0x2a1a10);
  cb.batch.box(cb.lanternMats ? M.roof : M.roof, cx, 4.1, gz, 6.4, 0.25, 1.6, 0x3a3c40);
  // benches by the pond
  bench(cb, cx + 6.5, cz + 14, Math.PI / 2 + Math.PI, { label: 'garden bench', color: 0x4a3020 });
  bench(cb, cx + 18, cz + 2.5, 0, { label: 'garden bench', color: 0x4a3020 });
  // walk graph through the garden
  const G = cb.graph;
  const n = (x, z) => G.node(x, z, { y: 0.1 });
  const a = n(cx, z0), b = n(cx, z1), c = n(x0, cz), d = n(x1, cz), m = n(cx, cz);
  for (const id of [a, b, c, d]) G.edge(id, m, { width: 3.6, kind: 'walk', y: 0.1 });
  for (const [id, out] of [[a, [0, -1]], [b, [0, 1]], [c, [-1, 0]], [d, [1, 0]]]) {
    const nd = G.nodes[id];
    const sw = G.nearestNode(nd.x + out[0] * 1.2, nd.z + out[1] * 1.2, (q) => q.y !== 0.1);
    if (sw && Math.hypot(sw.x - nd.x, sw.z - nd.z) < 14) G.edge(id, sw.id, { width: 2.4, kind: 'walk', y: 0.1 });
  }
}

function pagoda(cb, x, z, y0) {
  const M = cb.mats;
  let y = y0 + 60, w = 26;
  cb.batch.box(M.paint, x, y0 + 30, z, 40, 60, 40, 0x1e2420);
  for (let k = 0; k < 5; k++) {
    cb.batch.box(M.paint, x, y + 5, z, w * 0.7, 10, w * 0.7, 0x2a1a14);
    cb.batch.box(M.roof, x, y + 10.5, z, w * 1.1, 1.2, w * 1.1, 0x26282c);
    cb.batch.box(M.bulbSoft, x, y + 6, z, w * 0.72, 1.0, w * 0.72, 0xffb070);
    y += 12; w *= 0.84;
  }
  cb.batch.prim('cyl', M.metal, x, y + 9, z, 0.8, 18, 0.8, 0x6a5a3a);
}

function furnish(cb, layout, lanternMats) {
  const rng = cb.rng; const b = layout.bounds;
  const { xs, zs } = layout;
  // lantern posts along the lanes (short, warm)
  for (const s of zs) for (const sgn of [-1, 1]) {
    const z = s.z + sgn * (s.road / 2 + 0.45);
    for (let x = b.minX - 20; x < b.maxX + 20; x += rng.range(13, 17)) {
      if (xs.some((a) => Math.abs(x - a.x) < a.road / 2 + a.walk + 1)) continue;
      streetlight(cb, x, z, sgn > 0 ? -Math.PI / 2 : Math.PI / 2, 'lantern', { color: 0xffb070 });
    }
  }
  for (const s of xs) for (const sgn of [-1, 1]) {
    const x = s.x + sgn * (s.road / 2 + 0.45);
    for (let z = b.minZ - 20; z < b.maxZ + 20; z += rng.range(13, 17)) {
      if (zs.some((c) => Math.abs(z - c.z) < c.road / 2 + c.walk + 1)) continue;
      if (z > -30 && z < -6) continue;
      streetlight(cb, x, z, sgn > 0 ? Math.PI : 0, 'lantern', { color: 0xffb070 });
    }
  }
  // strings of festival lanterns across one lane
  const S = zs[3];
  for (let x = b.minX; x < b.maxX; x += 6) {
    if (xs.some((a) => Math.abs(x - a.x) < a.road / 2 + a.walk + 1)) continue;
    const g = new THREE.CylinderGeometry(0.18, 0.18, 0.42, 10); g.translate(x, 4.2, S.z);
    cb.batch.addGeometry(g, lanternMats[(Math.abs(Math.round(x / 6))) % 3], 0xffffff);
    cb.batch.beam(cb.mats.metal, new THREE.Vector3(x - 3, 4.5, S.z), new THREE.Vector3(x + 3, 4.5, S.z), 0.015, 0x111111, true);
    cb.pool(x, S.z, 2.5, 0xffa060, 0.4, 'neon');
  }
  // bridge railings over the canal on every lane
  for (const A of xs) for (const sgn of [-1, 1]) {
    const x = A.x + sgn * (A.road / 2 + A.walk - 0.1);
    cb.batch.box(cb.mats.paint, x, 0.95, -18, 0.12, 0.1, 14, 0xb8402a);
    for (let z = -25; z <= -11; z += 2) cb.batch.box(cb.mats.paint, x, 0.55, z, 0.1, 0.8, 0.1, 0xb8402a);
    cb.col.addRect(x - 0.1, -25, x + 0.1, -11);
  }
}
