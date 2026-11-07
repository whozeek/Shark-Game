// London — a Marylebone-inspired quarter of Georgian brick terraces and white stucco houses,
// corner pubs, a railed garden square, red buses and black cabs driving on the left.
// Street names are borrowed for flavour; the layout and buildings are artistic interpretations.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import {
  createMaterials, facadeMaterials, shopMaterial, building, perimeterLots, tree, bench, neonMaterial, neonSign,
  furnishGrid, frontOf, busShelter, grassMaterial, staticPerson, cartOnKerb, streetlight,
} from '../world/kit.js';
import { addSkyline } from '../world/skyline.js';

export const london = {
  id: 'london', name: 'London', neighborhood: 'Marylebone Terraces',
  blurb: 'Georgian terraces, corner pubs, red buses and black cabs in the drizzle.',
  seed: 4411, palette: { fog: '#22262c', accent: '#d8402a' },
  glow: '#5a4a3a', vehicleMix: { car: 0.5, taxi: 0.3, suv: 0.12, van: 0.08 }, taxiColor: 0x16181b, busColor: 0xc41e1a, decker: true,
  bldClear: 1.5, build,
};

const SHOPS = [
  { name: 'The Crown & Lantern', type: 'bar', hue: 28, color: '#1e3a2a', sign: '#f2d48a' }, { name: 'Marylebone Books', type: 'books', hue: 36, color: '#2a2a3a' },
  { name: 'Pressed Coffee House', type: 'cafe', hue: 32, color: '#2a2420' }, { name: 'The Fox & Fiddle', type: 'bar', hue: 22, color: '#4a1a1e', sign: '#f2d48a' },
  { name: 'Hartley Cheesemonger', type: 'deli', hue: 44, color: '#2a3a4a' }, { name: 'Wren Florist', type: 'flowers', hue: 30, color: '#3a4a3a' },
  { name: 'Beaumont Tailors', type: 'shop', hue: 40, color: '#1e1e22' }, { name: 'Cavendish Bakery', type: 'cafe', hue: 38, color: '#4a3a2a' },
  { name: 'Moon Under Water', type: 'bar', hue: 26, color: '#2a1e3a', sign: '#f2d48a' }, { name: 'Gallery Twelve', type: 'shop', hue: 40, color: '#e8e4dc', sign: '#222' },
  { name: 'Corner News & Wine', type: 'grocery', hue: 46, color: '#1e2a3a' }, { name: 'Little Teapot', type: 'tea', hue: 34, color: '#3a2a2a' },
];
const NEON = [{ text: 'Pub', color: '#ffb347' }, { text: 'Coffee', color: '#ff9a5a' }, { text: 'Books', color: '#9ad7ff' }, { text: 'Open', color: '#ff4a6a' }];

async function build(cb, step) {
  const M = createMaterials(cb, cb.q, { asphalt: '#2a2a2e', sidewalk: '#8a8884', sidewalkKind: 'tiles' });
  cb.mats = M;
  cb.walkIns.push({ x: -5, z: 10, kind: 'cafe', name: 'Pressed Coffee House' });
  const F = facadeMaterials(cb, [
    { wall: 'brick', color: '#9a8058', mortar: '#b0a48e', trim: '#f2ede2', lintel: '#e8e2d4', windowStyle: 'tall', bays: 3, bayW: 2.4, floorH: 3.3, bands: false, litRatio: 0.5, seed: 501, frame: '#f2ede2' },
    { wall: 'stucco', color: '#e8e2d4', trim: '#f4f0e6', windowStyle: 'tall', bays: 3, bayW: 2.4, floorH: 3.3, bands: true, bandColor: '#ddd6c6', litRatio: 0.5, seed: 503, frame: '#f4f0e6' },
    { wall: 'brick', color: '#7a5a42', mortar: '#a09484', trim: '#f2ede2', lintel: '#e8e2d4', windowStyle: 'tall', bays: 3, bayW: 2.4, floorH: 3.3, litRatio: 0.5, seed: 507, frame: '#f2ede2', flowerBoxes: true },
    { wall: 'brick', color: '#8a3a2a', mortar: '#a89c8a', trim: '#f2ede2', windowStyle: 'sash', bays: 4, bayW: 2.5, floorH: 3.3, litRatio: 0.45, seed: 509, frame: '#f2ede2' },
  ]);
  const [stock, stucco, darkStock, redBrick] = F;
  const shop = shopMaterial(cb, SHOPS, 441);
  neonMaterial(cb, NEON);
  await step(0.15, 'Laying out the terraces');
  const layout = {
    leftHand: true,
    bounds: { minX: -140, maxX: 165, minZ: -140, maxZ: 150 }, outer: 70,
    xs: [
      { x: -95, road: 9, walk: 3.8, dirs: [1, -1], park: [true, true], name: 'Wimpole St', kind: 'street' },
      { x: -15, road: 12, walk: 4.2, dirs: [1, -1], park: [true, true], name: 'Baker Row', kind: 'avenue', speed: 10 },
      { x: 70, road: 5.5, walk: 1.4, dirs: [], park: [false, false], name: 'Harley Mews', kind: 'mews', trees: false },
      { x: 130, road: 11, walk: 4.4, dirs: [1, -1], park: [false, true], name: 'Marylebone High St', kind: 'avenue' },
    ],
    zs: [
      { z: -100, road: 9, walk: 3.8, dirs: [1, -1], park: [true, true], name: 'Weymouth St', kind: 'street' },
      { z: -25, road: 10, walk: 4, dirs: [1, -1], park: [true, true], name: 'New Cavendish St', kind: 'avenue' },
      { z: 50, road: 9, walk: 3.8, dirs: [-1], park: [true, true], name: 'Devonshire Pl', kind: 'street' },
      { z: 120, road: 10, walk: 4, dirs: [1, -1], park: [true, true], name: 'Paddington St', kind: 'street' },
    ],
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Building Georgian houses');
  const rng = cb.rng;
  const square = grid.blocks.find((b) => b.inside && b.streets.w?.name === 'Baker Row' && b.streets.n?.name === 'Devonshire Pl');
  let si = 0;
  for (const blk of grid.blocks) {
    if (blk === square) { gardenSquare(cb, blk); continue; }
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 16 : 14, minW: 6, maxW: 8.5 });
    for (const lot of lots) {
      const st = blk.streets[lot.side];
      const high = st?.kind === 'avenue';
      const mews = st?.kind === 'mews';
      if (blk.outer) { building(cb, lot, { h: rng.range(11, 17), fronts: [lot.side], facade: rng.pick(F), ground: 'facade', roofKit: false, collide: false }); continue; }
      const corner = (lot.side === 'n' || lot.side === 's') && (Math.abs(lot.x0 - blk.x0) < 0.1 || Math.abs(lot.x1 - blk.x1) < 0.1);
      if (mews) {
        building(cb, lot, { h: rng.range(6.5, 8), fronts: [lot.side], facade: rng.pick([stucco, stock]), ground: 'facade', corniceH: 0.4, trim: 0xe8e2d4 });
        continue;
      }
      if (high || corner) {
        const idx = si++ % SHOPS.length; const s = SHOPS[idx];
        const pub = s.type === 'bar';
        building(cb, lot, { h: 4.2 + rng.int(3, 4) * 3.3, fronts: [lot.side], facade: rng.pick([stock, redBrick, darkStock]), ground: 'shop', shop, shopIdx: idx, corniceColor: 0xe8e2d4, trim: 0xe8e2d4,
          awning: !pub && rng.chance(0.5) ? { color: rng.pick([0x1e3a2a, 0x2a2a3a, 0x5a1e1e]), solid: true, depth: 1.3 } : null });
        if (pub && !lot.walkIn) pubDetails(cb, lot);
      } else {
        const f = rng.weighted([[stock, 3], [stucco, 2], [darkStock, 2]]);
        building(cb, lot, { h: rng.int(3, 4) * 3.3 + 1.0, fronts: [lot.side], facade: f, ground: 'facade', corniceColor: 0xe8e2d4, corniceH: 0.6, trim: 0xe8e2d4, ledges: f === stucco });
        georgianFront(cb, lot, f === stucco);
      }
    }
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Building Georgian houses');
  }
  cb.keepClear = [[-6.2, 30, 4]];
  furnishGrid(cb, layout, {
    lamp: 'deco', pole: 0x151515, lampColor: 0xffd8a0, bin: 0x1a1a1a, hydrant: false, signalColor: 0x1a1a1a,
    tree: { kind: 'street', every: 11, chance: 0.6, scale: 1.1 }, taxiColor: 0x16181b,
    parkTypes: [['sedan', 5], ['taxi', 1], ['suv', 2], ['van', 1]],
    extra: (P, a0, a1, axis, s, sgn, armYaw) => {
      if (s.kind === 'avenue' && rng.chance(0.5)) { const [x, z] = P(a0 + 7, 0.2); if (!cb.col.blocked(x, z, 1)) phoneKiosk(cb, x, z, armYaw); }
      if (rng.chance(0.35)) { const [x, z] = P(a1 - 6, 0.1); if (!cb.col.blocked(x, z, 0.6)) postBox(cb, x, z); }
    },
  });
  const hs = layout.xs[1];
  busShelter(cb, hs.x + hs.road / 2 + 0.75, -70, -Math.PI / 2, { ad: 0xffd0a0 });
  busShelter(cb, hs.x - hs.road / 2 - 0.75, 90, Math.PI / 2, { ad: 0xa0d0ff });
  cartOnKerb(cb, 130 - 5.5 - 1.0, -60, Math.PI / 2, 'coffee');
  await step(0.75, 'Lighting the pubs');
  addSkyline(cb, { seed: 81, center: [0, 0], minR: 500, maxR: 950, count: 45, arcFrom: -Math.PI * 0.6, arcTo: Math.PI * 0.2, hMin: 40, hMax: 200, color: '#2a2e36', lit: 0.4 });
  cb.spawn = { x: -6.2, z: 30, yaw: 0.1 };
  cb.viewpoints = [{ x: -6.2, z: 56, look: [30, 3, 85], label: 'The garden square' }, { x: 122, z: -10, look: [130, 4, -120], label: 'Along the high street' }];
  cb.routeHint = [[-6.2, 30], [-6.2, -20], [62, -20], [62, 45], [-6.2, 45]];
}

function georgianFront(cb, lot, stucco) {
  const M = cb.mats; const F = frontOf(lot);
  // black area railings along the front with a gap at the door, and a portico on stucco houses
  const doorU = (cb.rng.f() - 0.5) * (F.len - 2.4);
  const rail = (u0, u1) => {
    if (u1 - u0 < 0.3) return;
    const [ax, az] = F.at(u0, 0.9), [bx, bz] = F.at(u1, 0.9);
    cb.batch.beam(M.metal, new THREE.Vector3(ax, 1.05, az), new THREE.Vector3(bx, 1.05, bz), 0.04, 0x0e0e10);
    const n = Math.floor((u1 - u0) / 0.14);
    for (let k = 0; k <= n; k++) { const [x, z] = F.at(u0 + (u1 - u0) * k / n, 0.9); cb.batch.box(M.metal, x, 0.6, z, 0.025, 0.95, 0.025, 0x0e0e10); }
    const [cx, cz] = F.at((u0 + u1) / 2, 0.9);
    cb.col.addBox(cx, cz, F.horiz ? (u1 - u0) / 2 : 0.06, F.horiz ? 0.06 : (u1 - u0) / 2);
  };
  rail(-F.len / 2 + 0.1, doorU - 0.8); rail(doorU + 0.8, F.len / 2 - 0.1);
  const [dx, dz] = F.at(doorU, 0.03);
  cb.batch.box(M.paint, dx, 1.35, dz, F.horiz ? 1.1 : 0.08, 2.4, F.horiz ? 0.08 : 1.1, cb.rng.pick([0x1a1a1e, 0x1e3a2a, 0x5a1a1e, 0x1e2a4a, 0xf2ede2]));
  cb.batch.box(M.bulbSoft, dx + F.S.nx * 0.03, 2.8, dz + F.S.nz * 0.03, F.horiz ? 1.0 : 0.05, 0.4, F.horiz ? 0.05 : 1.0, 0xffcf8a);
  if (stucco) {
    for (const o of [-0.85, 0.85]) { const [px, pz] = F.at(doorU + o, 0.9); cb.batch.prim('cyl', M.paint, px, 1.75, pz, 0.28, 3.2, 0.28, 0xf4f0e6); cb.col.addCircle(px, pz, 0.18); }
    const [ex, ez] = F.at(doorU, 0.5);
    cb.batch.box(M.paint, ex, 3.45, ez, F.horiz ? 2.3 : 1.1, 0.3, F.horiz ? 1.1 : 2.3, 0xf4f0e6);
  }
  cb.light(dx + F.S.nx * 1.0, 2.8, dz + F.S.nz * 1.0, 0xffcf8a, 3, 6, 'porch');
}

function pubDetails(cb, lot) {
  const M = cb.mats; const F = frontOf(lot);
  // hanging sign on a bracket and flower baskets under the first floor
  const [bx, bz] = F.at(-F.len / 2 + 0.6, 0.9);
  cb.batch.box(M.metal, bx - F.S.nx * 0.45, 4.6, bz - F.S.nz * 0.45, F.horiz ? 0.06 : 1.0, 0.06, F.horiz ? 1.0 : 0.06, 0x111111);
  cb.batch.box(M.paint, bx, 4.0, bz, F.horiz ? 0.06 : 0.9, 1.1, F.horiz ? 0.9 : 0.06, cb.rng.pick([0x1e3a2a, 0x5a1a1e, 0x1e2a4a]));
  cb.light(bx, 4.2, bz, 0xffcf8a, 4, 6, 'shop');
  for (let k = 0; k < Math.floor(F.len / 2.4); k++) {
    const [x, z] = F.at(-F.len / 2 + 1.2 + k * 2.4, 0.45);
    cb.batch.prim('sphere', M.leaf, x, 3.55, z, 0.7, 0.55, 0.7, cb.rng.pick([0xd8405a, 0xf2b84a, 0xe86a8a, 0x8a3ad8]));
    cb.batch.prim('cyl', M.metal, x, 3.95, z, 0.01, 0.6, 0.01, 0x111111);
  }
  // a couple of drinkers outside, under the eaves
  const [px, pz] = F.at(F.len / 2 - 1.0, 0.6);
  staticPerson(cb, px, pz, F.yawOut + Math.PI / 2, {});
}

function phoneKiosk(cb, x, z, yaw) {
  const M = cb.mats;
  cb.batch.box(M.paint, x, 1.25, z, 0.95, 2.5, 0.95, 0xc41e1a, -yaw);
  cb.batch.box(M.paint, x, 2.6, z, 1.05, 0.2, 1.05, 0xc41e1a, -yaw);
  cb.batch.prim('cyl', M.paint, x, 2.78, z, 0.95, 0.18, 0.95, 0xc41e1a);
  cb.batch.box(M.bulbSoft, x, 2.38, z, 0.97, 0.14, 0.97, 0xfff0d0, -yaw);
  cb.batch.box(M.glass, x, 1.4, z, 0.97, 1.5, 0.97, 0xffffff, -yaw);
  cb.light(x, 2.2, z, 0xfff0d0, 2, 4, 'porch');
  cb.col.addBox(x, z, 0.5, 0.5, yaw);
}
function postBox(cb, x, z) {
  const M = cb.mats;
  cb.batch.prim('cyl', M.paint, x, 0.75, z, 0.5, 1.5, 0.5, 0xc41e1a);
  cb.batch.prim('sphere', M.paint, x, 1.52, z, 0.55, 0.25, 0.55, 0xc41e1a);
  cb.batch.box(M.paint, x, 1.25, z + 0.24, 0.3, 0.06, 0.04, 0x111111);
  cb.col.addCircle(x, z, 0.3);
}

function gardenSquare(cb, blk) {
  const M = cb.mats; const rng = cb.rng;
  const { x0, x1, z0, z1 } = blk; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  cb.addGround(grassMaterial(cb, 0x5a7a48), x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, 0.17, 4);
  for (let x = x0 + 6; x < x1 - 4; x += 4) cb.addGround(M.sidewalk, x, cz - 1.4, x + 4, cz + 1.4, 0.19 + ((x / 4) % 2) * 0.001, 3);
  cb.mapRect('park', x0, z0, x1, z1);
  // tall railings with gates on the east and west paths
  const rail = (ax, az, bx, bz) => {
    cb.batch.beam(M.metal, new THREE.Vector3(ax, 1.55, az), new THREE.Vector3(bx, 1.55, bz), 0.04, 0x0e0e10);
    const n = Math.floor(Math.hypot(bx - ax, bz - az) / 0.16);
    for (let k = 0; k <= n; k++) { const f = k / n; cb.batch.box(M.metal, ax + (bx - ax) * f, 0.95, az + (bz - az) * f, 0.025, 1.6, 0.025, 0x0e0e10); }
    cb.col.addRect(Math.min(ax, bx) - 0.05, Math.min(az, bz) - 0.05, Math.max(ax, bx) + 0.05, Math.max(az, bz) + 0.05);
  };
  rail(x0 + 0.4, z0 + 0.4, x1 - 0.4, z0 + 0.4); rail(x0 + 0.4, z1 - 0.4, x1 - 0.4, z1 - 0.4);
  rail(x0 + 0.4, z0 + 0.4, x0 + 0.4, cz - 1.5); rail(x0 + 0.4, cz + 1.5, x0 + 0.4, z1 - 0.4);
  rail(x1 - 0.4, z0 + 0.4, x1 - 0.4, cz - 1.5); rail(x1 - 0.4, cz + 1.5, x1 - 0.4, z1 - 0.4);
  for (let k = 0; k < 14; k++) {
    const tx = rng.range(x0 + 4, x1 - 4), tz = rng.range(z0 + 4, z1 - 4);
    if (Math.abs(tz - cz) < 4) continue;
    tree(cb, tx, tz, { scale: rng.range(1.3, 1.7), pit: false });
  }
  for (let k = 0; k < 4; k++) { const bx = x0 + 14 + k * (x1 - x0 - 28) / 3; bench(cb, bx, cz - 2.4, Math.PI, { label: 'garden square bench', color: 0x2a3a2a }); }
  streetlight(cb, cx, cz + 2.2, 0, 'deco', { color: 0xffd8a0, pole: 0x151515, strength: 0.6, force: true });
  const G = cb.graph;
  const w = G.node(x0, cz, { y: 0.19 }), e = G.node(x1, cz, { y: 0.19 }), m = G.node(cx, cz, { y: 0.19 });
  G.edge(w, m, { width: 2.8, kind: 'walk', y: 0.19 }); G.edge(m, e, { width: 2.8, kind: 'walk', y: 0.19 });
  for (const [id, dx] of [[w, -1], [e, 1]]) {
    const n = G.nodes[id]; const sw = G.nearestNode(n.x + dx * 2, n.z, (q) => q.y !== 0.19);
    if (sw && Math.hypot(sw.x - n.x, sw.z - n.z) < 12) G.edge(id, sw.id, { width: 2.4, kind: 'walk', y: 0.19 });
  }
  void neonSign;
}
