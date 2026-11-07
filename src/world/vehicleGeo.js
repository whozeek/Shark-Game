// Vehicle part geometries (local forward = +X, ground at y=0). Shared by moving traffic
// (instanced) and parked cars (merged into the static city batch).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function extrudeProfile(points, width, bevel = 0.04) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -(width - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

function wheelSet(positions, r = 0.34, w = 0.24) {
  const parts = positions.map(([x, z]) => {
    const g = new THREE.CylinderGeometry(r, r, w, 14);
    g.rotateX(Math.PI / 2);
    g.translate(x, r, z);
    return g;
  });
  return mergeGeometries(parts.map((p) => p.toNonIndexed()));
}

function boxAt(x, y, z, sx, sy, sz) { const g = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed(); g.translate(x, y, z); return g; }

const cache = new Map();

/** Returns { body, glass, wheels, front, rear, extra, length, width, height } geometries for a vehicle type. */
export function vehicleParts(type) {
  if (cache.has(type)) return cache.get(type);
  let out;
  if (type === 'decker') {
    const L = 10.6, W = 2.55, H = 4.4;
    const body = mergeGeometries([
      boxAt(0, 0.95, 0, L, 1.3, W), boxAt(0, 2.45, 0, L, 0.35, W), boxAt(0, 4.25, 0, L - 0.2, 0.3, W - 0.04),
      boxAt(L / 2 - 0.1, 3.3, 0, 0.2, 0.25, W - 0.1), boxAt(-L / 2 + 0.1, 3.3, 0, 0.2, 1.6, W - 0.1),
    ]);
    const glass = mergeGeometries([boxAt(0, 1.95, 0, L - 0.4, 0.75, W - 0.04), boxAt(0, 3.4, 0, L - 0.5, 0.9, W - 0.04), boxAt(L / 2 - 0.05, 3.4, 0, 0.12, 0.9, W - 0.2), boxAt(L / 2 - 0.05, 1.9, 0, 0.12, 1.0, W - 0.2)]);
    const wheels = wheelSet([[3.6, 1.1], [3.6, -1.1], [-3.2, 1.1], [-3.2, -1.1]], 0.5, 0.3);
    const front = mergeGeometries([boxAt(L / 2 + 0.01, 0.75, 0.95, 0.04, 0.2, 0.35), boxAt(L / 2 + 0.01, 0.75, -0.95, 0.04, 0.2, 0.35)]);
    const rear = mergeGeometries([boxAt(-L / 2 - 0.01, 0.9, 1.0, 0.04, 0.35, 0.25), boxAt(-L / 2 - 0.01, 0.9, -1.0, 0.04, 0.35, 0.25)]);
    const extra = boxAt(L / 2 + 0.02, 2.75, 0, 0.04, 0.3, 1.8);
    out = { body, glass, wheels, front, rear, extra, length: L, width: W, height: H };
  } else if (type === 'bus') {
    const L = 11.5, W = 2.55, H = 3.1;
    const body = mergeGeometries([
      boxAt(0, 0.95, 0, L, 1.3, W),
      boxAt(0, 2.95, 0, L, 0.3, W - 0.02),
      boxAt(L / 2 - 0.1, 2.0, 0, 0.2, 0.9, W * 0.3),
    ]);
    const glass = mergeGeometries([boxAt(-0.2, 2.15, 0, L - 0.6, 1.3, W - 0.04), boxAt(L / 2 - 0.05, 2.0, 0, 0.12, 1.5, W - 0.2)]);
    const wheels = wheelSet([[3.8, 1.1], [3.8, -1.1], [-3.4, 1.1], [-3.4, -1.1]], 0.5, 0.3);
    const front = mergeGeometries([boxAt(L / 2 + 0.01, 0.75, 0.95, 0.04, 0.2, 0.35), boxAt(L / 2 + 0.01, 0.75, -0.95, 0.04, 0.2, 0.35)]);
    const rear = mergeGeometries([boxAt(-L / 2 - 0.01, 0.9, 1.0, 0.04, 0.35, 0.25), boxAt(-L / 2 - 0.01, 0.9, -1.0, 0.04, 0.35, 0.25)]);
    const extra = boxAt(L / 2 + 0.02, 2.85, 0, 0.04, 0.25, 1.6); // route sign
    out = { body, glass, wheels, front, rear, extra, length: L, width: W, height: H };
  } else if (type === 'van') {
    const L = 5.0, W = 1.95;
    const body = extrudeProfile([[-2.5, 0.35], [2.5, 0.35], [2.5, 0.95], [1.8, 1.1], [1.2, 2.0], [-2.5, 2.05]], W);
    const glass = mergeGeometries([extrudeProfile([[1.75, 1.15], [1.25, 1.9], [0.7, 1.92], [0.7, 1.15]], W + 0.02, 0.01)]);
    const wheels = wheelSet([[1.6, 0.85], [1.6, -0.85], [-1.6, 0.85], [-1.6, -0.85]], 0.36);
    const front = mergeGeometries([boxAt(2.5, 0.85, 0.72, 0.04, 0.16, 0.3), boxAt(2.5, 0.85, -0.72, 0.04, 0.16, 0.3)]);
    const rear = mergeGeometries([boxAt(-2.51, 1.0, 0.8, 0.04, 0.4, 0.18), boxAt(-2.51, 1.0, -0.8, 0.04, 0.4, 0.18)]);
    out = { body, glass, wheels, front, rear, extra: null, length: L, width: W, height: 2.1 };
  } else {
    // sedan / taxi / suv share a silhouette with variations
    const suv = type === 'suv';
    const L = suv ? 4.7 : 4.5, W = suv ? 1.9 : 1.8;
    const belt = suv ? 1.05 : 0.85;
    const roof = suv ? 1.75 : 1.42;
    const body = extrudeProfile([
      [-L / 2, 0.32], [L / 2, 0.32], [L / 2 + 0.02, 0.62], [L / 2 - 0.15, belt - 0.02], [L * 0.22, belt + 0.05],
      [-L * 0.36, belt + 0.06], [-L / 2 + 0.05, belt], [-L / 2, 0.55],
    ], W);
    const cab = [[L * 0.22, belt + 0.04], [suv ? L * 0.05 : L * 0.04, roof], [-L * 0.27, roof], [-L * 0.38, belt + 0.05]];
    const glass = extrudeProfile(cab, W - 0.12, 0.03);
    const roofCap = boxAt((cab[1][0] + cab[2][0]) / 2, roof + 0.02, 0, cab[1][0] - cab[2][0] + 0.02, 0.05, W - 0.14);
    const pillars = mergeGeometries([
      boxAt(-L * 0.11, (belt + roof) / 2, (W - 0.1) / 2, 0.1, roof - belt, 0.04),
      boxAt(-L * 0.11, (belt + roof) / 2, -(W - 0.1) / 2, 0.1, roof - belt, 0.04),
    ]);
    const bodyAll = mergeGeometries([body.toNonIndexed(), roofCap, pillars]);
    const wheels = wheelSet([[L * 0.33, W / 2 - 0.12], [L * 0.33, -W / 2 + 0.12], [-L * 0.31, W / 2 - 0.12], [-L * 0.31, -W / 2 + 0.12]], suv ? 0.38 : 0.33);
    const front = mergeGeometries([boxAt(L / 2 + 0.01, 0.66, W / 2 - 0.28, 0.06, 0.12, 0.34), boxAt(L / 2 + 0.01, 0.66, -W / 2 + 0.28, 0.06, 0.12, 0.34)]);
    const rear = mergeGeometries([boxAt(-L / 2 - 0.01, 0.75, W / 2 - 0.22, 0.05, 0.13, 0.36), boxAt(-L / 2 - 0.01, 0.75, -W / 2 + 0.22, 0.05, 0.13, 0.36)]);
    const extra = type === 'taxi' ? boxAt(-L * 0.1, roof + 0.16, 0, 0.55, 0.22, 0.28) : null;
    out = { body: bodyAll, glass, wheels, front, rear, extra, length: L, width: W, height: roof };
  }
  // details: bumpers, hubcaps, mirrors, grille and plates
  {
    const big = type === 'bus' || type === 'decker';
    const L = out.length, W = out.width, wr = big ? 0.5 : type === 'suv' ? 0.38 : 0.34;
    const bump = big ? 0.55 : 0.42;
    out.bumpers = mergeGeometries([
      boxAt(L / 2 + 0.03, bump, 0, 0.14, 0.2, W - 0.06), boxAt(-L / 2 - 0.03, bump, 0, 0.14, 0.2, W - 0.06),
      boxAt(L / 2 + 0.02, bump + 0.22, 0, 0.04, 0.16, W * 0.42), // grille
      boxAt(0, 0.38, W / 2 + 0.005, L * 0.62, 0.08, 0.02), boxAt(0, 0.38, -W / 2 - 0.005, L * 0.62, 0.08, 0.02), // side skirts
    ]);
    const hubs = [];
    const wx = type === 'bus' ? [3.8, -3.4] : type === 'decker' ? [3.6, -3.2] : type === 'van' ? [1.6, -1.6] : [L * 0.33, -L * 0.31];
    const wz = big ? 1.1 : type === 'van' ? 0.85 : W / 2 - 0.12;
    for (const x of wx) for (const sz of [1, -1]) { const g = new THREE.CylinderGeometry(wr * 0.55, wr * 0.55, 0.04, 10); g.rotateX(Math.PI / 2); g.translate(x, wr, sz * (wz + (big ? 0.16 : 0.13))); hubs.push(g.toNonIndexed()); }
    if (!big) for (const sz of [1, -1]) hubs.push(boxAt(L * 0.16, (out.height + 0.85) / 2 - 0.05, sz * (W / 2 + 0.08), 0.12, 0.1, 0.12));
    hubs.push(boxAt(-L / 2 - 0.06, bump + 0.16, 0, 0.02, 0.12, 0.34), boxAt(L / 2 + 0.06, bump - 0.02, 0, 0.02, 0.1, 0.3)); // plates
    out.trim = mergeGeometries(hubs);
  }
  for (const k of ['body', 'glass', 'wheels', 'front', 'rear', 'extra', 'trim', 'bumpers']) {
    if (out[k]) {
      let g = out[k].index ? out[k].toNonIndexed() : out[k];
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.computeVertexNormals();
      out[k] = g;
    }
  }
  cache.set(type, out);
  return out;
}

export const CAR_COLORS = [0x23272f, 0xdcdcd8, 0xa3222a, 0x34507a, 0x6c7178, 0x1f5a45, 0xc3c4c0, 0x5a4232, 0x7f90a8, 0x8f2a4a, 0xece6d4, 0x2c4a78, 0xb08a3a, 0x4a6a5a];
export const TAXI_YELLOW = 0xf2b51b;
