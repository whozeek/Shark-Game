// Collects many small geometries and merges them per material and per spatial chunk.
// This keeps draw calls low while still letting the renderer frustum-cull distant chunks.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const tmpColor = new THREE.Color();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

// Shared unit primitives (cloned + transformed when added)
export const PRIM = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1),
  cone: new THREE.ConeGeometry(0.5, 1, 8, 1),
  sphere: new THREE.SphereGeometry(0.5, 8, 6),
  plane: new THREE.PlaneGeometry(1, 1),
};

export class Batcher {
  constructor(chunkSize = 80) {
    this.chunk = chunkSize;
    this.buckets = new Map(); // key -> { mat, geos: [] }
  }

  /** Add a geometry already in world space. color: optional vertex colour. */
  addGeometry(geo, mat, color = null, chunkHint = null) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    // keep only common attributes
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    tmpColor.set(color ?? 0xffffff);
    for (let i = 0; i < n; i++) { col[i * 3] = tmpColor.r; col[i * 3 + 1] = tmpColor.g; col[i * 3 + 2] = tmpColor.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    let cx, cz;
    if (chunkHint) { cx = chunkHint[0]; cz = chunkHint[1]; } else {
      g.computeBoundingBox();
      const b = g.boundingBox;
      cx = (b.min.x + b.max.x) / 2; cz = (b.min.z + b.max.z) / 2;
    }
    const key = `${mat.uuid}|${Math.floor(cx / this.chunk)}|${Math.floor(cz / this.chunk)}`;
    let bucket = this.buckets.get(key);
    if (!bucket) { bucket = { mat, geos: [] }; this.buckets.set(key, bucket); }
    bucket.geos.push(g);
  }

  /** Box with position (center), size, rotation Y (and optional x/z rot). */
  box(mat, x, y, z, sx, sy, sz, color = null, ry = 0, rx = 0, rz = 0, uvScale = null) {
    const g = PRIM.box.clone();
    if (uvScale) worldUVBox(g, sx, sy, sz, uvScale);
    this.addGeometry(g.applyMatrix4(compose(x, y, z, sx, sy, sz, rx, ry, rz)), mat, color);
  }
  prim(name, mat, x, y, z, sx, sy, sz, color = null, ry = 0, rx = 0, rz = 0) {
    const g = PRIM[name].clone();
    this.addGeometry(g.applyMatrix4(compose(x, y, z, sx, sy, sz, rx, ry, rz)), mat, color);
  }
  /** Thin beam between two points (for railings, ladders, wires). */
  beam(mat, a, b, thick = 0.04, color = null, round = false) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const g = (round ? PRIM.cyl6 : PRIM.box).clone();
    if (!round) g.scale(thick, len, thick); else g.scale(thick, len, thick);
    _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    _m.compose(_p.addVectors(a, b).multiplyScalar(0.5), _q, _s.set(1, 1, 1));
    this.addGeometry(g.applyMatrix4(_m), mat, color);
  }

  build(parent, { castLayers = null, name = 'batch' } = {}) {
    const meshes = [];
    for (const [key, bucket] of this.buckets) {
      if (!bucket.geos.length) continue;
      const merged = mergeGeometries(bucket.geos, false);
      for (const g of bucket.geos) g.dispose();
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, bucket.mat);
      mesh.name = name;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      if (castLayers) castLayers(mesh);
      parent.add(mesh);
      meshes.push(mesh);
    }
    this.buckets.clear();
    return meshes;
  }
}

export function compose(x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q, new THREE.Vector3(sx, sy, sz));
}

/** Set box UVs in world units so tiled textures keep a consistent scale (per face). */
export function worldUVBox(g, sx, sy, sz, [tu, tv, ou = 0, ov = 0]) {
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z ; each 4 verts
  const uv = g.attributes.uv;
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) {
    const [w, h] = dims[f];
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * w / tu + ou, uv.getY(i) * h / tv + ov);
    }
  }
  uv.needsUpdate = true;
  return g;
}

/** A vertical quad (for façades) with UV mapping in world units or explicit rect. */
export function quad(w, h, uvRect = [0, 0, 1, 1]) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uvRect[0] + uv.getX(i) * (uvRect[2] - uvRect[0]), uvRect[1] + uv.getY(i) * (uvRect[3] - uvRect[1]));
  return g;
}
