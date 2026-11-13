// Static repeated objects drawn with instancing instead of being merged into the city batch:
// parked cars and tree canopies. Each shape is stored on the GPU once and drawn many times,
// which cuts New York's geometry by millions of vertices — important on phones.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { vehicleParts } from './vehicleGeo.js';
import { patchGlossy, patchWash } from '../render/shared.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);

export function addParked(cb, x, z, yaw, type, color) {
  (cb.parkedInst || (cb.parkedInst = [])).push({ x, z, yaw, type, color });
}
export function addLeaf(cb, matrix, color, variant) {
  (cb.leafInst || (cb.leafInst = [])).push({ matrix: matrix.clone(), color: new THREE.Color(color), variant });
}

function colored(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

const solidCache = new Map();
function parkedSolid(type) {
  if (solidCache.has(type)) return solidCache.get(type);
  const p = vehicleParts(type);
  const parts = [colored(p.body, 0xffffff), colored(p.glass, 0x0d1118), colored(p.wheels, 0x151515), colored(p.rear, 0x5a0e0e), colored(p.front, 0xbfc4c9)];
  if (p.extra) parts.push(colored(p.extra, 0xf2e6b0));
  if (p.trim) parts.push(colored(p.trim, 0x9a9ea4));
  if (p.bumpers) parts.push(colored(p.bumpers, 0x222326));
  const g = mergeGeometries(parts);
  g.computeBoundingSphere();
  solidCache.set(type, g);
  return g;
}

const blobCache = new Map();
function blobGeo(variant, detail) {
  const key = variant + ':' + detail;
  if (blobCache.has(key)) return blobCache.get(key);
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  let seed = 1 + variant * 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const map = new Map();
  for (let k = 0; k < p.count; k++) {
    const key2 = `${p.getX(k).toFixed(3)},${p.getY(k).toFixed(3)},${p.getZ(k).toFixed(3)}`;
    if (!map.has(key2)) map.set(key2, 0.78 + rnd() * 0.4);
    const f = map.get(key2);
    p.setXYZ(k, p.getX(k) * f, p.getY(k) * f, p.getZ(k) * f);
  }
  g.computeVertexNormals();
  blobCache.set(key, g);
  return g;
}

/** Build the instanced meshes once the city has been described. */
export function finishStatic(cb, quality) {
  const M = cb.mats;
  if (cb.parkedInst?.length) {
    const solidMat = cb.track(patchGlossy(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.4, vertexColors: true }), { strengthUniform: 'uReflCar', base: 0.08, rainbowAmt: 0.25 }));
    // group by type and by ~90 m neighbourhood cell so far-away groups can be skipped
    const byType = new Map();
    for (const c of cb.parkedInst) {
      const key = c.type + '|' + Math.floor(c.x / 90) + '|' + Math.floor(c.z / 90);
      if (!byType.has(key)) byType.set(key, []); byType.get(key).push(c);
    }
    for (const [key, list] of byType) {
      const type = key.split('|')[0];
      const solid = new THREE.InstancedMesh(parkedSolid(type), solidMat, list.length);
      list.forEach((c, i) => {
        _e.set(0, -c.yaw, 0); _q.setFromEuler(_e);
        _m.compose(_p.set(c.x, 0, c.z), _q, _s);
        solid.setMatrixAt(i, _m);
        solid.setColorAt(i, new THREE.Color(c.color));
      });
      for (const im of [solid]) { im.computeBoundingSphere(); im.name = 'parked-' + type; im.userData.cull = 'parked'; cb.group.add(im); (cb.cullInst || (cb.cullInst = [])).push(im); }
    }
  }
  if (cb.leafInst?.length) {
    const detail = quality.id === 'hd' ? 1 : 0;
    const leafMat = cb.track(patchWash(new THREE.MeshStandardMaterial({ map: M.leaf.map, roughness: 0.8, side: THREE.DoubleSide }), 0.04, { leaf: true }));
    const groups = new Map();
    for (const l of cb.leafInst) {
      _p.setFromMatrixPosition(l.matrix);
      const key = (quality.id === 'hd' ? l.variant : 0) + '|' + Math.floor(_p.x / 90) + '|' + Math.floor(_p.z / 90);
      if (!groups.has(key)) groups.set(key, []); groups.get(key).push(l);
    }
    for (const [key, list] of groups) {
      const v = +key.split('|')[0];
      const im = new THREE.InstancedMesh(blobGeo(v, detail), leafMat, list.length);
      list.forEach((l, i) => { im.setMatrixAt(i, l.matrix); im.setColorAt(i, l.color); });
      im.computeBoundingSphere(); im.name = 'leaves'; im.userData.cull = 'far';
      cb.group.add(im); (cb.cullInst || (cb.cullInst = [])).push(im);
    }
  }
  cb.parkedInst = null; cb.leafInst = null;
}
