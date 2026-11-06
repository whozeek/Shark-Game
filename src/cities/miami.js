// Miami — an Ocean Drive interpretation: pastel Art Deco hotels with neon trim and terraces,
// a palm-lined park, a beach with lifeguard huts, and the ocean. Artistic interpretation.
import * as THREE from 'three';
import { buildGrid } from '../world/cityBase.js';
import {
  createMaterials, facadeMaterials, shopMaterial, building, perimeterLots, streetlight, tree,
  trashCan, bench, trafficSignal, parkedCar, neonMaterial, neonSign, cafeSet, SIDES,
} from '../world/kit.js';
import { addSkyline } from '../world/skyline.js';
import { makePaving } from '../render/textures.js';
import { patchGround } from '../render/shared.js';

export const miami = {
  id: 'miami', name: 'Miami', neighborhood: 'Ocean Drive',
  blurb: 'Pastel Art Deco hotels, palms, neon and the sound of the sea.',
  seed: 3131, palette: { fog: '#1c2a38', accent: '#ff6fd8' },
  glow: '#6a3a6a', vehicleMix: { car: 0.5, suv: 0.25, van: 0.05, taxi: 0.2 }, busColor: 0x2aa8a0,
  pedStyle: 'miami', bldClear: 1.4,
  build,
};

const HOTELS = ['The Coral', 'Seabreeze', 'Palm Court', 'Starlite', 'Moonglow', 'Pelican Bay', 'Azure', 'Sea Glass', 'Flamingo', 'Lagoon'];
const NEON_COLORS = ['#ff4fd8', '#3ff2ff', '#b06bff', '#ff9f4a', '#7affb0', '#ff5a7a'];
const SHOPS = [
  { name: 'Coral Café', type: 'cafe', hue: 30, color: '#f0d8c8', sign: '#2a6a8a' }, { name: 'Sea Glass Bar', type: 'bar', hue: 300, color: '#2a3a5a' },
  { name: 'Mango Gelato', type: 'cafe', hue: 40, color: '#f0c8a0', sign: '#8a3a2a' }, { name: 'Cuban Coffee Window', type: 'cafe', hue: 34, color: '#d8e8e0', sign: '#2a5a4a' },
  { name: 'Tidepool Surf Shop', type: 'shop', hue: 190, color: '#a8d8e0', sign: '#1a3a4a' }, { name: 'Ceviche & Lime', type: 'restaurant', hue: 22, color: '#e0f0d8', sign: '#2a4a2a' },
  { name: 'Neon Palms Lounge', type: 'bar', hue: 320, color: '#2a1a3a', sign: '#ff9ae8' }, { name: 'Breeze Books', type: 'books', hue: 36, color: '#f8e0d0', sign: '#4a2a2a' },
];

async function build(cb, step) {
  const M = createMaterials(cb, cb.q, { asphalt: '#2c2c30', sidewalk: '#c8bca8', sidewalkKind: 'tiles', water: 0x0f2a36 });
  cb.mats = M;
  const pastel = ['#f4c8d0', '#bfe6dd', '#f6e2b3', '#c9d7f2', '#e9d3f2', '#f9d8c0', '#d8f0c8', '#f2f0e8'];
  const F = facadeMaterials(cb, pastel.map((c, i) => ({ wall: 'stucco', color: c, trim: '#ffffff', windowStyle: i % 3 === 2 ? 'office' : 'deco', bays: 4, bayW: 2.8, floorH: 3.4, litRatio: 0.55, seed: 200 + i * 7 })));
  const shop = shopMaterial(cb, SHOPS, 515);
  neonMaterial(cb, HOTELS.map((t, i) => ({ text: t, color: NEON_COLORS[i % NEON_COLORS.length], font: '"Brush Script MT", "Segoe Script", cursive' })));
  await step(0.15, 'Laying out Ocean Drive');

  const layout = {
    bounds: { minX: -135, maxX: 104, minZ: -150, maxZ: 150 },
    outer: 70,
    openFrom: 6,
    noBarriers: false,
    xs: [
      { x: -95, road: 14, walk: 4.6, dirs: [1, -1], park: [true, true], name: 'Collins Ave', kind: 'avenue' },
      { x: 0, road: 12, walk: 6.5, dirs: [1, -1], park: [true, false], name: 'Ocean Dr', kind: 'avenue', speed: 8 },
    ],
    zs: [
      { z: -120, road: 10, walk: 4, dirs: [], park: [true, true], name: '9th St', kind: 'street' },
      { z: -40, road: 10, walk: 4, dirs: [], park: [true, true], name: '10th St', kind: 'street' },
      { z: 40, road: 10, walk: 4, dirs: [], park: [true, true], name: '11th St', kind: 'street' },
      { z: 120, road: 10, walk: 4, dirs: [], park: [true, true], name: '12th St', kind: 'street' },
    ],
  };
  const grid = buildGrid(cb, layout);
  await step(0.3, 'Painting Art Deco hotels');
  const rng = cb.rng;
  let hi = 0, si = 0;
  for (const blk of grid.blocks) {
    if (blk.open) continue;
    const lots = perimeterLots(blk, rng, { depth: blk.outer ? 22 : 20, minW: 13, maxW: 20 });
    for (const lot of lots) {
      const f = rng.pick(F);
      const floors = rng.int(3, 4);
      const h = floors * 3.4 + 4;
      const streetE = blk.streets[lot.side];
      if (blk.outer) { building(cb, lot, { h: h + rng.range(-2, 8), fronts: [lot.side], facade: f, ground: 'facade', roofKit: false, collide: false, cornice: false, trim: 0xf0ece0 }); continue; }
      const onOcean = streetE?.name === 'Ocean Dr';
      const S = SIDES[lot.side];
      // hotels on Ocean Drive are set back behind a raised terrace
      let rect = lot;
      if (onOcean) {
        const back = 4.2;
        rect = { ...lot, x1: lot.x1 - back };
        terrace(cb, { x0: rect.x1, x1: lot.x1, z0: lot.z0, z1: lot.z1 }, rng);
      }
      const isShop = !onOcean && rng.chance(0.6);
      building(cb, rect, { h, fronts: [lot.side], facade: f, ground: isShop ? 'shop' : 'lobby', shop, shopIdx: si++ % SHOPS.length, gfH: 4, cornice: false, parapet: 1.2, trim: 0xffffff, roofColor: 0xb8b0a0,
        awning: isShop && rng.chance(0.5) ? { color: rng.pick([0x2aa8a0, 0xff7a8a, 0xf2f0e8, 0x4a7ac8]), solid: rng.chance(0.5), depth: 1.6 } : null });
      decoDetails(cb, rect, lot.side, h, f.spec.color, rng, onOcean ? HOTELS[hi++ % HOTELS.length] : null, onOcean ? (hi - 1) % HOTELS.length : -1);
      void S;
    }
    await step(0.3 + 0.35 * grid.blocks.indexOf(blk) / grid.blocks.length, 'Painting Art Deco hotels');
  }
  cb.keepClear = [[9.2, 10, 3]];
  oceanfront(cb, layout);
  furnish(cb, layout);
  await step(0.75, 'Rolling in the tide');
  addSkyline(cb, { seed: 77, center: [0, 0], minR: 500, maxR: 900, count: 40, arcFrom: Math.PI * 0.55, arcTo: Math.PI * 1.45, hMin: 40, hMax: 160, color: '#2a3040', lit: 0.45, beacons: true });
  cb.spawn = { x: 9.2, z: 10, yaw: 0.55 };
  cb.viewpoints = [
    { x: 92, z: 0, look: [600, 2, 0], label: 'The ocean' },
    { x: 30, z: -60, look: [-20, 8, -60], label: 'Neon on Ocean Drive' },
  ];
  cb.routeHint = [[9.25, 20], [9.25, -80], [30, -80], [30, 80], [9.25, 80]];
}

function decoDetails(cb, r, side, h, color, rng, hotel, hotelIdx) {
  const M = cb.mats; const S = SIDES[side];
  const horiz = side === 'n' || side === 's';
  const len = horiz ? r.x1 - r.x0 : r.z1 - r.z0;
  const cx = side === 'e' ? r.x1 : side === 'w' ? r.x0 : (r.x0 + r.x1) / 2;
  const cz = side === 's' ? r.z1 : side === 'n' ? r.z0 : (r.z0 + r.z1) / 2;
  const deep = new THREE.Color(color).multiplyScalar(0.85);
  // eyebrow ledges over each floor
  for (let y = 4.15 + 3.4 * 0.78; y < h; y += 3.4) {
    cb.batch.box(M.paint, cx + S.nx * 0.35, y, cz + S.nz * 0.35, horiz ? len * 0.92 : 0.7, 0.12, horiz ? 0.7 : len * 0.92, deep);
  }
  // central fin rising above the parapet with a vertical neon name
  const fh = h + rng.range(3, 6);
  cb.batch.box(M.paint, cx + S.nx * 0.4, 0.15 + fh / 2 + 2, cz + S.nz * 0.4, horiz ? 1.2 : 0.8, fh - 4, horiz ? 0.8 : 1.2, 0xffffff);
  const neonCol = new THREE.Color(NEON_COLORS[(hotelIdx >= 0 ? hotelIdx : rng.int(0, 5)) % NEON_COLORS.length]);
  // neon outline along the parapet and up the fin
  cb.batch.box(M.bulb, cx + S.nx * 0.08, 0.15 + h + 0.7, cz + S.nz * 0.08, horiz ? len : 0.06, 0.07, horiz ? 0.06 : len, neonCol);
  cb.batch.box(M.bulb, cx + S.nx * 0.08, 0.15 + 4.1, cz + S.nz * 0.08, horiz ? len : 0.06, 0.06, horiz ? 0.06 : len, neonCol);
  cb.batch.box(M.bulb, cx + S.nx * 0.82, 0.15 + fh / 2 + 2, cz + S.nz * 0.82, 0.06, fh - 4, 0.06, neonCol);
  cb.pool(cx + S.nx * 3, cz + S.nz * 3, 6, neonCol, 0.55, 'neon');
  cb.light(cx + S.nx * 2.5, 4.5, cz + S.nz * 2.5, neonCol, 9, 12, 'neon');
  if (hotel) {
    neonSign(cb, cx + S.nx * 0.95, 0.15 + h * 0.55 + 1.5, cz + S.nz * 0.95, horiz ? 0 : Math.PI / 2, hotelIdx, { w: Math.min(7, h * 0.7), vertical: true, backing: false, strength: 1.2, poolDx: S.nx * 3, poolDz: S.nz * 3 });
    // rounded porch canopy over the entrance
    cb.batch.prim('cyl', M.paint, cx + S.nx * 1.3, 4.1, cz + S.nz * 1.3, 4.5, 0.25, 2.6, 0xffffff);
  }
}

function terrace(cb, r, rng) {
  const M = cb.mats;
  cb.batch.box(M.paint, (r.x0 + r.x1) / 2, 0.35, (r.z0 + r.z1) / 2, r.x1 - r.x0, 0.4, r.z1 - r.z0, 0xe8dccb);
  cb.addGround(M.sidewalk, r.x0, r.z0, r.x1, r.z1, 0.56, 3);
  // low wall with gaps
  cb.batch.box(M.paint, r.x1 - 0.15, 0.85, (r.z0 + r.z1) / 2 - (r.z1 - r.z0) * 0.3, 0.3, 0.6, (r.z1 - r.z0) * 0.35, 0xf2ece0);
  cb.batch.box(M.paint, r.x1 - 0.15, 0.85, (r.z0 + r.z1) / 2 + (r.z1 - r.z0) * 0.3, 0.3, 0.6, (r.z1 - r.z0) * 0.35, 0xf2ece0);
  const n = Math.max(1, Math.floor((r.z1 - r.z0) / 5));
  for (let k = 0; k < n; k++) {
    const z = r.z0 + (k + 0.5) * (r.z1 - r.z0) / n;
    cafeSet(cb, (r.x0 + r.x1) / 2, z, Math.PI / 2, rng.pick([0xffffff, 0xff8aa0, 0x5ad0c8, 0xf6d08a]));
  }
  cb.col.addRect(r.x0, r.z0, r.x1, r.z1);
  // string of warm bulbs
  for (let z = r.z0 + 0.5; z < r.z1; z += 1.2) cb.batch.prim('sphere', M.bulb, r.x1 - 0.2, 2.6 + Math.sin(z) * 0.05, z, 0.08, 0.08, 0.08, 0xffd59a);
  cb.pool((r.x0 + r.x1) / 2 + 2, (r.z0 + r.z1) / 2, (r.z1 - r.z0) * 0.6, 0xffd59a, 0.35, 'shop');
}

function oceanfront(cb, layout) {
  const M = cb.mats; const rng = cb.rng;
  const oceanX = layout.xs[1].x + layout.xs[1].road / 2; // east curb
  const parkX0 = oceanX + layout.xs[1].walk, parkX1 = 50, beachX1 = 112;
  const z0 = -260, z1 = 260;
  const grass = cb.track(new THREE.MeshStandardMaterial({ color: 0x2f4a2c, roughness: 1 }));
  cb.addGround(grass, parkX0, z0, parkX1, z1, 0.14, 4);
  const sandTex = cb.track(makePaving(8, { kind: 'sand', base: '#cbb796' }));
  const sand = cb.track(patchGround(new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.95, vertexColors: true }), { puddleScale: 0.4, taps: cb.q.reflTaps }));
  cb.addGround(sand, parkX1, z0, beachX1 + 2, z1, 0.08, 6);
  // the sea
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2), M.water);
  sea.position.set(beachX1 + 1500, -0.15, 0);
  cb.addMesh(sea, true); cb.track(sea.geometry);
  // shoreline foam that washes in and out
  const foamMat = cb.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.8, 0.85), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
  const foams = [];
  for (let k = 0; k < 3; k++) {
    const g = cb.track(new THREE.PlaneGeometry(2.2, 520, 1, 1).rotateX(-Math.PI / 2));
    const m = new THREE.Mesh(g, foamMat.clone()); cb.track(m.material);
    m.position.set(beachX1 + 2 + k * 6, 0.1, 0); m.layers.set(2);
    cb.group.add(m); foams.push(m);
  }
  cb.animated.push({ update: (dt, t) => foams.forEach((m, k) => { const ph = t * 0.18 + k * 0.33; const f = ph - Math.floor(ph); m.position.x = beachX1 + 20 - f * 22 + k * 2; m.material.opacity = Math.sin(f * Math.PI) * 0.35; m.scale.x = 0.6 + f; }) });
  // low coral-stone wall between park and beach with openings
  const gaps = [-80, 0, 80];
  let za = z0;
  for (const g of [...gaps, z1]) {
    const zb = g === z1 ? z1 : g - 2;
    if (zb > za) { cb.batch.box(M.paint, parkX1, 0.45, (za + zb) / 2, 0.6, 0.7, zb - za, 0xd8cdb0); cb.col.addRect(parkX1 - 0.3, za, parkX1 + 0.3, zb); }
    za = g + 2;
  }
  // promenade: serpentine path through the park
  const G = cb.graph;
  const pathX = (z) => 30 + Math.sin(z / 40) * 5;
  const path = cb.track(new THREE.MeshStandardMaterial({ color: 0xc8bca8, roughness: 0.9 }));
  const ids = [];
  for (let z = layout.bounds.minZ, k = 0; z <= layout.bounds.maxZ; z += 10, k++) {
    cb.addGround(M.sidewalk, pathX(z) - 1.8, z - 5.2, pathX(z) + 1.8, z + 5.2, 0.16 + (k % 2) * 0.002, 3);
    ids.push(G.node(pathX(z), z, { y: 0.16, exit: z === layout.bounds.minZ || z >= layout.bounds.maxZ - 10 }));
  }
  for (let k = 0; k < ids.length - 1; k++) G.edge(ids[k], ids[k + 1], { width: 3.6, kind: 'walk', y: 0.16 });
  // connectors from Ocean Drive's park-side sidewalk to the promenade at each cross street
  for (const C of layout.zs) {
    if (C.z < layout.bounds.minZ || C.z > layout.bounds.maxZ) continue;
    const swId = G.nearestNode(oceanX + layout.xs[1].walk / 2, C.z + C.road / 2 + C.walk / 2).id;
    const pz = C.z + C.road / 2 + C.walk / 2;
    const target = G.nearestNode(pathX(pz), pz, (n) => n.y === 0.16 && Math.abs(n.x - pathX(n.z)) < 0.1);
    for (let x = oceanX + layout.xs[1].walk; x < pathX(pz) - 1.5; x += 3) cb.addGround(M.sidewalk, x, pz - 1.4, x + 3, pz + 1.4, 0.155, 3);
    G.edge(swId, target.id, { width: 2.8, kind: 'walk', y: 0.155 });
  }
  void path;
  // palms, benches and lamps in the park
  for (let z = z0 + 6; z < z1; z += rng.range(9, 15)) {
    const x = rng.chance(0.5) ? rng.range(parkX0 + 3, pathX(z) - 4) : rng.range(pathX(z) + 4, parkX1 - 3);
    tree(cb, x, z, { kind: 'palm', h: rng.range(9, 14), pit: false });
  }
  for (let z = layout.bounds.minZ + 15; z < layout.bounds.maxZ - 10; z += 30) {
    bench(cb, pathX(z) + 2.6, z, Math.PI / 2, { label: 'bench by the beach' });
    streetlight(cb, pathX(z + 15) - 2.4, z + 15, 0, 'deco', { color: 0xffe2b8, strength: 0.7, force: true });
  }
  // lifeguard huts
  for (const [hx, hz, col] of [[86, -50, 0xff8aa0], [86, 60, 0x5ad0c8], [86, 150, 0xf6d08a]]) {
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cb.batch.box(M.paint, hx + dx * 1.1, 1.1, hz + dz * 1.1, 0.18, 2.2, 0.18, 0xe8e0d0);
    cb.batch.box(M.paint, hx, 2.4, hz, 3.4, 0.2, 3.4, 0xe8e0d0);
    cb.batch.box(M.paint, hx, 3.6, hz, 2.8, 2.2, 2.6, col);
    cb.batch.box(M.paint, hx, 4.9, hz, 3.4, 0.25, 3.2, 0xffffff);
    cb.batch.box(M.bulbSoft, hx + 1.41, 3.7, hz, 0.02, 0.8, 1.6, 0x9ad0ff);
    cb.batch.beam(M.paint, new THREE.Vector3(hx - 1.7, 2.4, hz), new THREE.Vector3(hx - 5.5, 0.1, hz), 0.9, 0xe8e0d0);
    cb.col.addRect(hx - 1.8, hz - 1.8, hx + 1.8, hz + 1.8);
    cb.light(hx + 2.2, 3.2, hz, 0x9ad0ff, 4, 8, 'porch');
  }
  cb.mapRect('park', parkX0, z0, parkX1, z1);
  cb.mapRect('beach', parkX1, z0, beachX1, z1);
  cb.mapRect('water', beachX1, z0, beachX1 + 600, z1);
  // keep the walker out of the sea
  cb.col.addRect(beachX1 - 6, z0, beachX1 + 400, z1);
}

function furnish(cb, layout) {
  const rng = cb.rng; const b = layout.bounds;
  const { xs, zs } = layout;
  for (const A of xs) {
    for (const sgn of [-1, 1]) {
      if (A.name === 'Ocean Dr' && sgn > 0) {
        for (let z = b.minZ - 30; z < b.maxZ + 30; z += 13) {
          if (zs.some((c) => Math.abs(z - c.z) < c.road / 2 + c.walk + 1)) continue;
          tree(cb, A.x + A.road / 2 + 0.8, z, { kind: 'palm', h: rng.range(10, 13), pit: false });
        }
      }
      const curb = A.x + sgn * (A.road / 2 + 0.55);
      for (let z = b.minZ - 30; z < b.maxZ + 30; z += 24) {
        if (zs.some((c) => Math.abs(z - c.z) < c.road / 2 + c.walk + 1)) continue;
        streetlight(cb, curb, z + 6, sgn > 0 ? Math.PI : 0, 'deco', { color: 0xffd8a8, pole: 0xf2f0e8 });
        if (A.name !== 'Ocean Dr' && rng.chance(0.6)) tree(cb, curb + sgn * 0.2, z + 14, { kind: 'palm', h: rng.range(8, 12), pit: false });
      }
      const parkSide = sgn < 0 ? A.park?.[0] : A.park?.[1];
      if (parkSide) {
        const laneC = A.x + sgn * (A.road / 2 - 1.2);
        for (let z = b.minZ - 30; z < b.maxZ + 30;) {
          const L = 5.8 + rng.f();
          if (!zs.some((c) => Math.abs(z + L / 2 - c.z) < c.road / 2 + 6) && rng.chance(0.75)) {
            const type = rng.weighted([['sedan', 5], ['suv', 3], ['taxi', 1]]);
            parkedCar(cb, laneC, z + L / 2, sgn > 0 ? -Math.PI / 2 : Math.PI / 2, type, type === 'taxi' ? 0xf2b51b : rng.pick([0xf2f0e8, 0x2aa8a0, 0xff8aa0, 0x1c1f26, 0xd8d0c0, 0x4a7ac8, 0xc83a3a]));
          }
          z += L;
        }
      }
    }
  }
  for (const s of zs) for (const sgn of [-1, 1]) {
    const laneC = s.z + sgn * (s.road / 2 - 1.2);
    for (let x = b.minX - 30; x < 0;) {
      const L = 5.8 + rng.f();
      if (!xs.some((a) => Math.abs(x + L / 2 - a.x) < a.road / 2 + a.walk + 4) && rng.chance(0.6)) parkedCar(cb, x + L / 2, laneC, sgn > 0 ? 0 : Math.PI, rng.pick(['sedan', 'suv']), rng.pick([0xf2f0e8, 0x2aa8a0, 0xff8aa0, 0x1c1f26, 0xd8d0c0]));
      x += L;
    }
    for (let x = b.minX + 10; x < -10; x += 30) { if (!xs.some((a) => Math.abs(x - a.x) < a.road / 2 + a.walk + 3)) streetlight(cb, x, s.z + sgn * (s.road / 2 + 0.55), sgn > 0 ? -Math.PI / 2 : Math.PI / 2, 'deco', { color: 0xffd8a8, pole: 0xf2f0e8 }); }
  }
  const A = xs[1];
  for (const C of zs) {
    trafficSignal(cb, A.x + A.road / 2 + 0.5, C.z - C.road / 2 - 0.5, [-1, 0], A.road * 0.8, 'z', { heads: [A.road * 0.4, A.road * 0.75], color: 0xe8e4da });
    trashCan(cb, A.x + A.road / 2 + 0.6, C.z + C.road / 2 + 1.0, 0x2aa8a0);
  }
}
