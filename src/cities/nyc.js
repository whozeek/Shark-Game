// New York — a cozy West Village–inspired neighbourhood. Street names are borrowed for flavour;
// the block layout, façades and skyline are artistic interpretations, not a survey-accurate map.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import {
  createMaterials, facadeMaterials, shopMaterial, building, stoop, perimeterLots, streetlight, tree, hydrant,
  trashCan, bench, planter, newsBox, cafeSet, busShelter, trafficSignal, parkedCar, neonMaterial, neonSign, grassMaterial } from '../world/kit.js';
import { CAR_COLORS, TAXI_YELLOW } from '../world/vehicleGeo.js';
import { addSkyline } from '../world/skyline.js';

export const nyc = {
  id: 'nyc',
  name: 'New York City',
  neighborhood: 'West Village',
  blurb: 'Brownstones, cafés and leafy one-way streets beneath a distant skyline.',
  seed: 4242,
  palette: { fog: '#1d2233', accent: '#ffb86b' },
  vehicleMix: { car: 0.55, taxi: 0.3, suv: 0.1, van: 0.05 },
  bus: true,
  build,
};

const SHOPS = [
  { name: 'Hudson & Ivy Café', type: 'cafe', hue: 32, color: '#2b3a32' },
  { name: 'Corner Deli & Grocery', type: 'deli', hue: 48, color: '#1f2a3a', sign: '#ffe08a' },
  { name: 'Paper Moon Books', type: 'books', hue: 36, color: '#3b2a2a' },
  { name: 'Little Fern Florist', type: 'flowers', hue: 30, color: '#2f4a3a' },
  { name: 'Night Owl Pizza', type: 'restaurant', hue: 22, color: '#5a1f24', sign: '#ffd38a' },
  { name: 'Spin Cycle Laundromat', type: 'laundry', hue: 200, color: '#1f2f3a', sign: '#bde6ff' },
  { name: 'Bluebird Records', type: 'records', hue: 285, color: '#222' },
  { name: 'Wren Wine Bar', type: 'bar', hue: 16, color: '#3a1f2a' },
  { name: 'Perry St. Bakery', type: 'cafe', hue: 38, color: '#4a3b2a' },
  { name: 'Village Hardware', type: 'shop', hue: 42, color: '#2a2f36' },
  { name: 'Cobble Coffee', type: 'cafe', hue: 30, color: '#1d2a22' },
  { name: 'Sakura Noodle Bar', type: 'restaurant', hue: 12, color: '#3a1616' },
  { name: 'Thimble Tailors', type: 'shop', hue: 40, color: '#33302a' },
  { name: 'Lantern Lounge', type: 'bar', hue: 330, color: '#2a1630', sign: '#ffb3e1' },
  { name: 'Moss & Stone Gifts', type: 'shop', hue: 34, color: '#2a3a2e' },
  { name: 'Hearth Trattoria', type: 'restaurant', hue: 24, color: '#40261a' },
];

const NEON = [
  { text: 'Café', color: '#ff9a3c' }, { text: 'Cocktails', color: '#ff3fa4' }, { text: 'Pizza', color: '#ff4d3d' },
  { text: 'Books', color: '#58d6ff' }, { text: 'Records', color: '#b98cff' }, { text: 'Open late', color: '#47ffb0' },
  { text: 'Laundry', color: '#7ad7ff' }, { text: 'Wine', color: '#ff6f91' },
];

async function build(cb, step) {
  const q = cb.q;
  const M = createMaterials(cb, q, { asphalt: '#2a2b2f', sidewalk: '#8d8a84' });
  cb.mats = M;
  const F = facadeMaterials(cb, [
    { wall: 'stone', color: '#6b4636', trim: '#5a3a2c', lintel: '#7d5644', frame: '#e6dccb', windowStyle: 'tall', bays: 3, bayW: 2.3, floorH: 3.3, litRatio: 0.5, seed: 11 },
    { wall: 'brick', color: '#8a3b2a', mortar: '#9b9184', trim: '#ece4d4', windowStyle: 'sash', bays: 4, bayW: 2.5, bands: false, litRatio: 0.45, seed: 23, flowerBoxes: true },
    { wall: 'brick', color: '#5e3328', mortar: '#8d8275', trim: '#d8cdb8', windowStyle: 'arched', bays: 4, bayW: 2.5, litRatio: 0.45, seed: 37 },
    { wall: 'brick', color: '#c4b293', mortar: '#a79b88', trim: '#3c3a36', frame: '#2c2c2c', windowStyle: 'sash', bays: 4, bayW: 2.5, bands: true, bandColor: '#b8a98f', litRatio: 0.5, seed: 41 },
    { wall: 'brick', color: '#dcd6c8', mortar: '#c8c2b4', trim: '#f4f1ea', windowStyle: 'sash', bays: 3, bayW: 2.4, shutters: true, shutterColor: '#2f4a3a', litRatio: 0.5, seed: 53, flowerBoxes: true },
    { wall: 'stone', color: '#98928a', trim: '#cfc8bb', windowStyle: 'office', bays: 4, bayW: 2.6, bands: true, bandColor: '#b5ad9f', litRatio: 0.4, seed: 67, cornerQuoins: true },
    { wall: 'brick', color: '#9b4a35', mortar: '#a39889', trim: '#efe7d8', windowStyle: 'sash', bays: 4, bayW: 2.4, litRatio: 0.5, seed: 79, shutters: true, shutterColor: '#1f2b3a' },
    { wall: 'brick', color: '#7a3a2c', mortar: '#8a8072', trim: '#c9bda8', windowStyle: 'sash', bays: 4, bayW: 2.6, windowSkip: 0.7, litRatio: 0.3, seed: 91 },
    { wall: 'brick', color: '#4b3a33', mortar: '#7a7066', trim: '#bdb3a2', windowStyle: 'wide', bays: 3, bayW: 3.2, litRatio: 0.5, seed: 97 },
  ]);
  const [brown, redBrick, darkBrick, cream, painted, prewar, redShutter, sideWall, loft] = F;
  const shop = shopMaterial(cb, SHOPS, 777);
  neonMaterial(cb, NEON);
  await step(0.15, 'Laying out streets');

  const layout = {
    bounds: { minX: -150, maxX: 175, minZ: -150, maxZ: 145 },
    outer: 70,
    xs: [
      { x: -95, road: 8.5, walk: 4.8, dirs: [1], park: [true, true], name: 'Bleecker St', kind: 'street' },
      { x: -20, road: 16, walk: 5.2, dirs: [-1, -1, -1], park: [true, true], name: 'Hudson St', kind: 'avenue', speed: 11, laneCount: 3 },
      { x: 62, road: 8.5, walk: 4.8, dirs: [-1], park: [true, true], name: 'W 4th St', kind: 'street' },
      { x: 135, road: 12, walk: 4.6, dirs: [1, -1], park: [false, true], name: 'Greenwich Ave', kind: 'avenue', speed: 10 },
    ],
    zs: [
      { z: -108, road: 8, walk: 4.6, dirs: [1], park: [true, true], name: 'Bank St', kind: 'street' },
      { z: -38, road: 9, walk: 4.8, dirs: [-1], park: [true, true], name: 'W 11th St', kind: 'street' },
      { z: 32, road: 8, walk: 4.8, dirs: [1], park: [true, true], name: 'Perry St', kind: 'street' },
      { z: 102, road: 9, walk: 4.8, dirs: [-1], park: [true, true], name: 'Charles St', kind: 'street' },
    ],
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Raising brownstones');

  const rng = cb.rng;
  const parkBlock = grid.blocks.find((b) => b.streets.w?.name === 'Hudson St' && b.streets.n?.name === 'Perry St');
  let shopCounter = 0;

  for (const blk of grid.blocks) {
    if (blk === parkBlock) { pocketPark(cb, blk); continue; }
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 18 : 15, minW: 6, maxW: 9.5 });
    for (const lot of lots) {
      const street = blk.streets[lot.side];
      const avenue = street?.kind === 'avenue';
      const isCorner = (lot.side === 'n' || lot.side === 's') ? (Math.abs(lot.x0 - blk.x0) < 0.1 || Math.abs(lot.x1 - blk.x1) < 0.1) : false;
      if (blk.outer) {
        const f = rng.pick([redBrick, darkBrick, cream, prewar, brown]);
        building(cb, lot, { h: rng.range(12, 24), fronts: [lot.side], facade: f, side: sideWall, ground: 'facade', roofKit: false, cornice: rng.chance(0.6), collide: false });
        continue;
      }
      const w = lot.side === 'n' || lot.side === 's' ? lot.x1 - lot.x0 : lot.z1 - lot.z0;
      if (avenue || isCorner || rng.chance(0.18)) {
        // tenement / pre-war with shop
        const tall = avenue && rng.chance(0.3);
        const floors = tall ? rng.int(7, 11) : rng.int(4, 6);
        const f = tall ? rng.pick([prewar, cream, darkBrick]) : rng.pick([redBrick, darkBrick, cream, redShutter, loft, painted]);
        const idx = shopCounter++ % SHOPS.length;
        const awnColor = rng.pick([0x2f5a3a, 0x7a1f24, 0x1f3a5a, 0x2a2a2a, 0x8a5a1f, 0x5a2f4a, 0xa8432f]);
        building(cb, lot, {
          h: 4.2 + floors * 3.2, fronts: [lot.side], facade: f, side: sideWall, ground: 'shop', shop, shopIdx: idx,
          awning: rng.chance(0.75) ? { color: awnColor, solid: rng.chance(0.4), depth: rng.range(1.2, 1.8) } : null,
          fireEscape: !tall && rng.chance(0.6), waterTower: tall || rng.chance(0.12), ac: true, ledges: tall,
          corniceColor: rng.pick([0x8a8478, 0x5a4a40, 0x2b2b2b, 0xb8ae9c]),
        });
        // neon blade sign on some shops
        const s = SHOPS[idx];
        const neonIdx = { cafe: 0, bar: 1, restaurant: 2, books: 3, records: 4, laundry: 6 }[s.type];
        if (neonIdx !== undefined && rng.chance(0.75)) {
          const S = sideVec(lot.side);
          const along = (lot.side === 'n' || lot.side === 's') ? lot.x0 + 0.9 : lot.z0 + 0.9;
          const px = lot.side === 'e' ? lot.x1 + 0.7 : lot.side === 'w' ? lot.x0 - 0.7 : along;
          const pz = lot.side === 's' ? lot.z1 + 0.7 : lot.side === 'n' ? lot.z0 - 0.7 : along;
          const yaw = (lot.side === 'n' || lot.side === 's') ? Math.PI / 2 : 0;
          neonSign(cb, px, 5.6, pz, yaw, neonIdx, { w: 1.4, vertical: true, poolDx: S[0] * 1.2, poolDz: S[1] * 1.2 });
        }
        if (s.type === 'cafe' && avenue) {
          // sidewalk tables along the wall
          const S = sideVec(lot.side);
          for (let k = 0; k < 2; k++) {
            const a = (k + 0.5) / 2;
            const tx = lot.side === 'e' || lot.side === 'w' ? (lot.side === 'e' ? lot.x1 : lot.x0) + S[0] * 0.95 : lot.x0 + 1.5 + (w - 3) * a;
            const tz = lot.side === 'n' || lot.side === 's' ? (lot.side === 's' ? lot.z1 : lot.z0) + S[1] * 0.95 : lot.z0 + 1.5 + (w - 3) * a;
            cafeSet(cb, tx, tz, (lot.side === 'n' || lot.side === 's') ? 0 : Math.PI / 2);
          }
        }
      } else {
        // rowhouse / brownstone with stoop
        const f = rng.weighted([[brown, 4], [painted, 2], [redShutter, 2], [redBrick, 2], [darkBrick, 1]]);
        const floors = rng.int(3, 5);
        building(cb, lot, {
          h: floors * 3.3 + 1.2, fronts: [lot.side], facade: f, side: sideWall, ground: 'facade',
          corniceColor: f === brown ? 0x4a3226 : rng.pick([0x2b2b2b, 0x6a5a4a, 0xd8d0c0]), corniceH: 0.8,
          fireEscape: f !== brown && rng.chance(0.25), ac: rng.chance(0.4),
        });
        if (w > 5.5 && (f === brown || rng.chance(0.5))) {
          const along = (lot.side === 'n' || lot.side === 's') ? rng.range(-w / 2 + 1.4, w / 2 - 1.4) : rng.range(-w / 2 + 1.4, w / 2 - 1.4);
          stoop(cb, lot.side, lot, along, { color: f === brown ? 0x5e3e30 : 0x7a7068 });
          // the bottom step is a nice place to sit
          const S = sideVec(lot.side);
          const cx = lot.side === 'e' ? lot.x1 : lot.side === 'w' ? lot.x0 : (lot.x0 + lot.x1) / 2;
          const cz = lot.side === 's' ? lot.z1 : lot.side === 'n' ? lot.z0 : (lot.z0 + lot.z1) / 2;
          const horiz = lot.side === 'n' || lot.side === 's';
          const sx = horiz ? cx + along : cx + S[0] * 1.9, sz = horiz ? cz + S[1] * 1.9 : cz + along;
          if (rng.chance(0.35)) cb.seat(sx, sz, Math.atan2(S[0], S[1]), 'stoop', 0.35);
        }
      }
    }
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Raising brownstones');
  }

  // ---- street furniture along every sidewalk inside the bounds
  cb.keepClear = [[-10.6, 18, 5.5]];
  furnishStreets(cb, layout, grid);
  await step(0.72, 'Planting trees and lamps');

  // ---- distant Manhattan skyline to the north and east
  addSkyline(cb, {
    seed: 99, center: [0, 0], minR: 480, maxR: 1000, count: 70, arcFrom: -Math.PI * 0.95, arcTo: -Math.PI * 0.05,
    hMin: 60, hMax: 230, color: '#2b2f3a', spire: { x: 120, z: -780, h: 380 }, lit: 0.4,
  });
  addSkyline(cb, { seed: 7, center: [0, 0], minR: 420, maxR: 700, count: 40, arcFrom: 0.1, arcTo: Math.PI * 0.9, hMin: 25, hMax: 90, color: '#2a2c33', lit: 0.3 });

  cb.spawn = { x: -10.6, z: 18, yaw: 0.16 };
  cb.viewpoints = [
    { x: -20 + 8 + 2.6, z: 32 - 4 - 2.1, look: [-20, 4, -600], label: 'Skyline up Hudson St' },
    { x: 20, z: 60, look: [20, 2, 80], label: 'Pocket park' },
  ];
  cb.routeHint = [
    [38, 38.1], [-9.4, 38.1], [-9.4, 95.9], [56, 95.9], [56, 38.1],
  ];
  await step(0.8, 'Lighting windows');
}

function sideVec(side) { return { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[side]; }

function pocketPark(cb, blk) {
  const M = cb.mats; const rng = cb.rng;
  const { x0, x1, z0, z1 } = blk;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  // lawn & paths
  const grassMat = grassMaterial(cb, 0x5a7a48);
  cb.addGround(grassMat, x0 + 1, z0 + 1, x1 - 1, z1 - 1, 0.17, 4);
  cb.addGround(M.sidewalk, cx - 1.6, z0, cx + 1.6, z1, 0.19, 3);
  cb.addGround(M.sidewalk, x0, cz - 1.6, x1, cz + 1.6, 0.191, 3);
  // ring path
  const r = Math.min(x1 - x0, z1 - z0) * 0.22;
  cb.addGround(M.sidewalk, cx - r - 2, cz - r - 2, cx + r + 2, cz + r + 2, 0.188, 3);
  cb.mapRect('park', x0, z0, x1, z1);
  // fountain-ish basin in the centre
  cb.batch.prim('cyl', M.paint, cx, 0.45, cz, 5.2, 0.6, 5.2, 0x7d7a73);
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.45, 32).rotateX(-Math.PI / 2), M.water);
  water.position.set(cx, 0.7, cz);
  cb.addMesh(water, true);
  cb.batch.prim('cyl', M.paint, cx, 1.1, cz, 0.6, 1.4, 0.6, 0x8a867e);
  cb.col.addCircle(cx, cz, 2.7);
  // iron fence with entrances on each path
  const fence = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az); const n = Math.floor(len / 0.25);
    cb.batch.beam(M.metal, new THREE.Vector3(ax, 1.05, az), new THREE.Vector3(bx, 1.05, bz), 0.04, 0x141714);
    cb.batch.beam(M.metal, new THREE.Vector3(ax, 0.3, az), new THREE.Vector3(bx, 0.3, bz), 0.03, 0x141714);
    for (let k = 0; k <= n; k++) { const f = k / n; const x = ax + (bx - ax) * f, z = az + (bz - az) * f; cb.batch.box(M.metal, x, 0.7, z, 0.025, 1.1, 0.025, 0x141714); }
    const midx = (ax + bx) / 2, midz = (az + bz) / 2;
    cb.col.addBox(midx, midz, Math.abs(bx - ax) / 2 + 0.05, Math.abs(bz - az) / 2 + 0.05);
  };
  const g = 1.8;
  fence(x0 + 0.5, z0 + 0.5, cx - g, z0 + 0.5); fence(cx + g, z0 + 0.5, x1 - 0.5, z0 + 0.5);
  fence(x0 + 0.5, z1 - 0.5, cx - g, z1 - 0.5); fence(cx + g, z1 - 0.5, x1 - 0.5, z1 - 0.5);
  fence(x0 + 0.5, z0 + 0.5, x0 + 0.5, cz - g); fence(x0 + 0.5, cz + g, x0 + 0.5, z1 - 0.5);
  fence(x1 - 0.5, z0 + 0.5, x1 - 0.5, cz - g); fence(x1 - 0.5, cz + g, x1 - 0.5, z1 - 0.5);
  // trees in the lawns
  for (const [qx, qz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    for (let k = 0; k < 4; k++) {
      const tx = cx + qx * rng.range(r + 4, (x1 - x0) / 2 - 4), tz = cz + qz * rng.range(5, (z1 - z0) / 2 - 4);
      tree(cb, tx, tz, { scale: rng.range(1.1, 1.5), pit: false });
    }
  }
  // benches facing the fountain and along the paths
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2 + 0.3;
    const bx = cx + Math.cos(a) * (r + 1.2), bz = cz + Math.sin(a) * (r + 1.2);
    bench(cb, bx, bz, a + Math.PI / 2 + Math.PI, { label: 'park bench' });
  }
  for (const [bx, bz, yaw] of [[cx - 2.6, z0 + 10, Math.PI / 2], [cx + 2.6, z1 - 10, -Math.PI / 2], [x0 + 12, cz - 2.6, 0], [x1 - 12, cz + 2.6, Math.PI]]) {
    bench(cb, bx, bz, yaw, { label: 'park bench' });
  }
  // lamps along paths
  for (const [lx, lz] of [[cx - 2.2, z0 + 5], [cx + 2.2, z1 - 5], [x0 + 6, cz + 2.2], [x1 - 6, cz - 2.2], [cx - 2.2, cz - r - 3], [cx + 2.2, cz + r + 3]]) {
    streetlight(cb, lx, lz, 0, 'globe', { color: 0xffd9a0, strength: 0.6 });
  }
  // walk graph through the park so people stroll in it too
  const G = cb.graph;
  const n = (x, z) => G.node(x, z, { y: 0.19 });
  const north = n(cx, z0 - 0.0), south = n(cx, z1), west = n(x0, cz), east = n(x1, cz);
  const ringN = n(cx, cz - r - 0.8), ringS = n(cx, cz + r + 0.8), ringW = n(cx - r - 0.8, cz), ringE = n(cx + r + 0.8, cz);
  const ringNE = n(cx + (r + 0.8) * 0.72, cz - (r + 0.8) * 0.72), ringNW = n(cx - (r + 0.8) * 0.72, cz - (r + 0.8) * 0.72);
  const ringSE = n(cx + (r + 0.8) * 0.72, cz + (r + 0.8) * 0.72), ringSW = n(cx - (r + 0.8) * 0.72, cz + (r + 0.8) * 0.72);
  const e = (a, b) => G.edge(a, b, { width: 2.6, kind: 'walk', y: 0.19 });
  e(north, ringN); e(south, ringS); e(west, ringW); e(east, ringE);
  e(ringN, ringNE); e(ringNE, ringE); e(ringE, ringSE); e(ringSE, ringS); e(ringS, ringSW); e(ringSW, ringW); e(ringW, ringNW); e(ringNW, ringN);
  // connect park entrances to the sidewalk graph
  for (const id of [north, south, west, east]) {
    const nd = G.nodes[id];
    let best = null, bd = 1e9;
    for (const m of G.nodes) { if (m.id === id) continue; const d = Math.hypot(m.x - nd.x, m.z - nd.z); if (d < bd && d < 12 && m.y !== 0.19) { bd = d; best = m; } }
    // project onto the nearest sidewalk: add a node on the sidewalk straight out from the gate
    const out = { [north]: [0, -1], [south]: [0, 1], [west]: [-1, 0], [east]: [1, 0] }[id];
    const sw = G.node(nd.x + out[0] * 2.1, nd.z + out[1] * 2.1);
    e(id, sw);
    // split the sidewalk edge that passes through `sw`
    splitEdgeAt(G, sw);
    void best;
  }
}

/** If node `id` lies on an existing straight edge, split that edge in two. */
function splitEdgeAt(G, id) {
  const n = G.nodes[id];
  for (const e of [...G.edges]) {
    if (e.dead || e.a === id || e.b === id) continue;
    const a = G.nodes[e.a], b = G.nodes[e.b];
    const minX = Math.min(a.x, b.x) - 0.05, maxX = Math.max(a.x, b.x) + 0.05, minZ = Math.min(a.z, b.z) - 0.05, maxZ = Math.max(a.z, b.z) + 0.05;
    if (n.x < minX || n.x > maxX || n.z < minZ || n.z > maxZ) continue;
    const cross = (b.x - a.x) * (n.z - a.z) - (b.z - a.z) * (n.x - a.x);
    if (Math.abs(cross) / (e.len || 1) > 0.3) continue;
    // detach e
    e.dead = true;
    a.edges = a.edges.filter((x) => x !== e.id); b.edges = b.edges.filter((x) => x !== e.id);
    G.edge(e.a, id, { width: e.width, kind: e.kind, axis: e.axis, browse: e.browse, y: e.y });
    G.edge(id, e.b, { width: e.width, kind: e.kind, axis: e.axis, browse: e.browse, y: e.y });
    return;
  }
}

function furnishStreets(cb, layout, grid) {
  const rng = cb.rng; const b = layout.bounds;
  const { xs, zs } = layout;
  // Along each street, both sides
  const doSide = (axis, s, sgn) => {
    // axis: direction the street runs; sgn: which side (-1/+1)
    const curb = (axis === 'x' ? s.z : s.x) + sgn * (s.road / 2 + 0.55);
    const cross = axis === 'x' ? xs : zs;
    const lo = axis === 'x' ? b.minX - 40 : b.minZ - 40, hi = axis === 'x' ? b.maxX + 40 : b.maxZ + 40;
    // segments between cross streets
    const cuts = cross.map((c) => { const cc = axis === 'x' ? c.x : c.z; const hw = c.road / 2 + c.walk; return [cc - hw, cc + hw]; }).sort((a1, b1) => a1[0] - b1[0]);
    const segs = []; let p = lo;
    for (const [c0, c1] of cuts) { if (c0 > p) segs.push([p, c0]); p = c1; }
    if (p < hi) segs.push([p, hi]);
    const P = (a, off = 0) => axis === 'x' ? [a, curb + sgn * off] : [curb + sgn * off, a];
    const armYaw = axis === 'x' ? (sgn > 0 ? -Math.PI / 2 : Math.PI / 2) : (sgn > 0 ? Math.PI : 0);
    const inside = (a) => axis === 'x' ? a > b.minX - 30 && a < b.maxX + 30 : a > b.minZ - 30 && a < b.maxZ + 30;
    const avenue = s.kind === 'avenue';
    for (const [a0, a1] of segs) {
      const len = a1 - a0;
      if (len < 8) continue;
      // streetlights
      const nL = Math.max(1, Math.round(len / 26));
      for (let k = 0; k < nL; k++) {
        const a = a0 + (k + 0.5) * len / nL + (sgn > 0 ? 6 : -6) * (k % 2 ? 1 : 0);
        if (!inside(a)) continue;
        const [x, z] = P(a);
        streetlight(cb, x, z, armYaw, 'nyc');
      }
      // trees on side streets
      if (!avenue) {
        for (let a = a0 + 5 + rng.f() * 3; a < a1 - 5; a += rng.range(7.5, 11)) {
          if (!inside(a)) continue;
          const [x, z] = P(a, 0.25);
          if (cb.col.blocked(x, z, 0.8)) continue;
          tree(cb, x, z, { fence: rng.chance(0.4) });
        }
      } else {
        for (let a = a0 + 8; a < a1 - 8; a += rng.range(14, 22)) {
          if (!inside(a) || !rng.chance(0.5)) continue;
          const [x, z] = P(a, 0.25);
          if (cb.col.blocked(x, z, 0.8)) continue;
          tree(cb, x, z, { scale: 0.9 });
        }
      }
      // hydrant near one end, trash cans near corners
      if (inside(a0 + 4)) { const [x, z] = P(a0 + 3.2, 0.05); if (!cb.col.blocked(x, z, 0.4)) hydrant(cb, x, z); }
      if (inside(a1 - 2.5) && rng.chance(0.7)) { const [x, z] = P(a1 - 2.2, 0.05); if (!cb.col.blocked(x, z, 0.5)) trashCan(cb, x, z, rng.pick([0x2f4a34, 0x1e2a22, 0x3a3f44])); }
      if (avenue && inside(a0 + 6) && rng.chance(0.6)) {
        for (let k = 0; k < 3; k++) { const [x, z] = P(a0 + 5.5 + k * 0.6, 0.05); if (!cb.col.blocked(x, z, 0.3)) newsBox(cb, x, z, armYaw, rng.pick([0x1f4fa0, 0xb02a2a, 0xe0c020, 0x2a7a3a])); }
      }
      if (rng.chance(0.25) && inside((a0 + a1) / 2)) { const [x, z] = P((a0 + a1) / 2 + 3, 0.1); if (!cb.col.blocked(x, z, 0.8)) planter(cb, x, z, 1.2); }
      // parked cars along the parking lane on this side
      const parkSide = sgn < 0 ? s.park?.[0] : s.park?.[1];
      if (parkSide) {
        const laneC = (axis === 'x' ? s.z : s.x) + sgn * (s.road / 2 - 1.2);
        for (let a = a0 + 5; a < a1 - 5;) {
          const L = 5.6 + rng.f() * 1.2;
          if (rng.chance(0.82)) {
            const type = rng.weighted([['sedan', 6], ['suv', 3], ['van', 1], ['taxi', 0.4]]);
            const x = axis === 'x' ? a + L / 2 : laneC, z = axis === 'x' ? laneC : a + L / 2;
            const yaw = axis === 'x' ? (sgn > 0 ? 0 : Math.PI) : (sgn > 0 ? -Math.PI / 2 : Math.PI / 2);
            parkedCar(cb, x, z, yaw + (rng.f() - 0.5) * 0.04, type, type === 'taxi' ? TAXI_YELLOW : rng.pick(CAR_COLORS));
          }
          a += L;
        }
      }
    }
  };
  for (const s of zs) { doSide('x', s, -1); doSide('x', s, 1); }
  for (const s of xs) { doSide('z', s, -1); doSide('z', s, 1); }

  // traffic signals at intersections (on two diagonal corners)
  for (const A of xs) for (const C of zs) {
    if (A.x < b.minX - 1 || A.x > b.maxX + 1 || C.z < b.minZ - 1 || C.z > b.maxZ + 1) continue;
    const ox = A.road / 2 + 0.5, oz = C.road / 2 + 0.5;
    // corner NE (x+, z-) arm over the zs street towards -x... signal for traffic moving in X hangs over the zs road
    trafficSignal(cb, A.x + ox, C.z - oz, [0, 1], C.road * 0.8, 'x', { heads: [C.road * 0.3, C.road * 0.7] });
    trafficSignal(cb, A.x - ox, C.z + oz, [1, 0], A.road * 0.8, 'z', { heads: [A.road * 0.3, A.road * 0.7] });
  }
  // bus shelter on Hudson St
  const hud = xs[1];
  busShelter(cb, hud.x + hud.road / 2 + 0.75, -75, -Math.PI / 2, { ad: 0xffc0e0 });
  busShelter(cb, hud.x - hud.road / 2 - 0.75, 68, Math.PI / 2, { ad: 0x9ad7ff });
  void grid;
}
