// One shared planar reflection of the scene across the ground plane (y = 0). Every wet surface —
// roads, sidewalks, puddles, water — samples this single texture with its own blur/ripple/streak,
// so neon, headlights, windows and traffic lights reflect believably at the cost of one extra pass.
import * as THREE from 'three';
import { U } from './shared.js';

export class PlanarReflector {
  constructor(renderer) {
    this.renderer = renderer;
    this.cam = new THREE.PerspectiveCamera();
    this.cam.layers.set(0);
    this.scale = 0.5;
    this.enabled = true;
    this.rt = new THREE.WebGLRenderTarget(16, 16, {
      type: THREE.HalfFloatType, generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true,
    });
    U.uReflTex.value = this.rt.texture;
    this.normal = new THREE.Vector3(0, 1, 0);
    this.plane = new THREE.Plane();
    this.clip = new THREE.Vector4();
    this.q = new THREE.Vector4();
    this.bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this._v = new THREE.Vector3(); this._t = new THREE.Vector3(); this._l = new THREE.Vector3(); this._r = new THREE.Matrix4();
    this.frame = 0;
    this.every = 1;
  }
  setSize(w, h) {
    const rw = Math.max(64, Math.floor(w * this.scale)), rh = Math.max(64, Math.floor(h * this.scale));
    if (this.rt.width !== rw || this.rt.height !== rh) this.rt.setSize(rw, rh);
  }
  update(scene, camera, planeY = 0) {
    U.uReflOn.value = this.enabled ? 1 : 0;
    if (!this.enabled) return;
    this.frame++;
    if (this.every > 1 && this.frame % this.every !== 0) return;
    const cam = this.cam;
    const camPos = this._v.setFromMatrixPosition(camera.matrixWorld);
    const refPos = new THREE.Vector3(camPos.x, planeY, camPos.z);
    const n = this.normal;
    // mirror camera position
    const view = new THREE.Vector3().subVectors(refPos, camPos);
    if (view.dot(n) > 0) return;
    view.reflect(n).negate().add(refPos);
    this._r.extractRotation(camera.matrixWorld);
    const look = this._l.set(0, 0, -1).applyMatrix4(this._r).add(camPos);
    const target = this._t.subVectors(refPos, look).reflect(n).negate().add(refPos);
    cam.position.copy(view);
    cam.up.set(0, 1, 0).applyMatrix4(this._r).reflect(n);
    cam.lookAt(target);
    cam.far = camera.far; cam.near = camera.near;
    cam.updateMatrixWorld();
    cam.projectionMatrix.copy(camera.projectionMatrix);
    // texture matrix (world → reflection uv)
    U.uReflMat.value.copy(this.bias).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    // oblique near plane so nothing below the ground leaks into the reflection
    this.plane.setFromNormalAndCoplanarPoint(n, refPos).applyMatrix4(cam.matrixWorldInverse);
    const clip = this.clip.set(this.plane.normal.x, this.plane.normal.y, this.plane.normal.z, this.plane.constant);
    const pm = cam.projectionMatrix.elements;
    const q = this.q;
    q.x = (Math.sign(clip.x) + pm[8]) / pm[0];
    q.y = (Math.sign(clip.y) + pm[9]) / pm[5];
    q.z = -1.0;
    q.w = (1.0 + pm[10]) / pm[14];
    clip.multiplyScalar(2.0 / clip.dot(q));
    pm[2] = clip.x; pm[6] = clip.y; pm[10] = clip.z + 1.0 - 0.003; pm[14] = clip.w;
    const r = this.renderer;
    const prevRT = r.getRenderTarget();
    const prevXr = r.xr.enabled; r.xr.enabled = false;
    const prevShadow = r.shadowMap.autoUpdate; r.shadowMap.autoUpdate = false;
    U.uReflOn.value = 0; // ground isn't drawn in the reflection anyway (layer), but be safe
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(scene, cam);
    r.setRenderTarget(prevRT);
    r.xr.enabled = prevXr; r.shadowMap.autoUpdate = prevShadow;
    U.uReflOn.value = 1;
  }
  dispose() { this.rt.dispose(); }
}
