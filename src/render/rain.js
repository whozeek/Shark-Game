// Rain: three GPU-animated layers of streaks (near, mid, far) that wrap around the camera,
// ground splashes, drifting mist banks and lightning bolts. All motion runs in the vertex
// shader, so even heavy storms cost very little CPU.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shared.js';
import { LAYER_NO_REFLECT } from '../world/cityBase.js';
import { makeFogSprite } from './textures.js';

const RainU = {
  uCam: { value: new THREE.Vector3() },
  uRainCol: { value: new THREE.Color('#cdd8ee') },
  uWind: { value: new THREE.Vector2() },
  uSpeed: { value: 1 },
  uDrop: { value: 1 },
  uRainLight: { value: 1 },
  uRainGlint: { value: 0.5 },
  uIntensity: { value: 0.5 },
  uSnowP: { value: 0 },
};

function rainLayer(count, box, len, width, alpha, near, far, seed) {
  const base = new THREE.PlaneGeometry(1, 1);
  base.translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.attributes.position = base.attributes.position;
  g.attributes.uv = base.attributes.uv;
  const rnd = new Float32Array(count * 4);
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) { rnd[i * 4] = r(); rnd[i * 4 + 1] = r(); rnd[i * 4 + 2] = r(); rnd[i * 4 + 3] = r(); }
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, ...RainU, uBox: { value: new THREE.Vector3(box[0], box[1], box[0]) }, uLen: { value: len }, uWidth: { value: width }, uAlpha: { value: alpha }, uNear: { value: near }, uFar: { value: far } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform vec3 uCam, uBox; uniform vec2 uWind; uniform float uTime, uSpeed, uLen, uWidth, uDrop, uSnowP;
      attribute vec4 aRnd;
      varying float vA; varying vec2 vUv; varying vec3 vW; varying float vFlake;
      void main(){
        float flake = step(aRnd.z, uSnowP * 0.999 + 0.0005) * step(0.001, uSnowP);
        vFlake = flake;
        float sp = (7.5 + aRnd.w * 3.5) * uSpeed * mix(1.0, 0.12, flake);
        vec3 vel = vec3(uWind.x, -sp, uWind.y);
        vec3 p = aRnd.xyz * uBox + vel * uTime;
        vec3 origin = uCam - vec3(uBox.x * 0.5, uBox.y * 0.35, uBox.z * 0.5);
        p = mod(p - origin, uBox) + origin;
        p.x += sin(uTime * 1.1 + aRnd.w * 30.0) * 0.45 * flake;
        p.z += cos(uTime * 0.9 + aRnd.x * 20.0) * 0.45 * flake;
        vec3 axis = normalize(vel);
        vec3 toCam = normalize(uCam - p);
        vec3 side = normalize(cross(axis, toCam));
        float L = uLen * uDrop * (0.7 + aRnd.w * 0.6) * (0.6 + 0.4 * uSpeed);
        float W = uWidth * uDrop;
        if (flake > 0.5) { W = max(W * 3.0, 0.03) * (0.6 + aRnd.y * 0.8); L = W; }
        vec3 wp = p + side * position.x * W - axis * position.y * L;
        vA = step(0.05, p.y) * (0.5 + aRnd.y * 0.5);
        vUv = uv; vW = wp;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform vec3 uRainCol, uCam; uniform float uAlpha, uNear, uFar, uRainLight, uRainGlint;
      varying float vA; varying vec2 vUv; varying vec3 vW; varying float vFlake;
      void main(){
        float d = length(vW - uCam);
        float fade = smoothstep(uNear * 0.6, uNear, d) * (1.0 - smoothstep(uFar * 0.7, uFar, d));
        float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float along = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
        vec3 c = uRainCol * uRainLight;
        c = mix(c, raRainbowCol(vW) * 1.4 * uRainLight + uRainCol * 0.2, uRainbow * (0.4 + uRainGlint * 0.6));
        c += uFlash * vec3(0.8, 0.85, 1.0) * 2.0;
        float a = across * along * fade * vA * uAlpha;
        if (vFlake > 0.5) {
          float r = length(vUv - 0.5);
          a = smoothstep(0.5, 0.15, r) * fade * vA * min(1.0, uAlpha * 2.2);
          c = vec3(0.92, 0.94, 0.98) * (uRainLight * 1.2 + 0.15) + uFlash * vec3(0.8);
        }
        gl_FragColor = vec4(c * a, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.layers.set(LAYER_NO_REFLECT);
  mesh.renderOrder = 10;
  mesh.userData.max = count;
  return mesh;
}

function splashLayer(count) {
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  const rnd = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) rnd[i] = Math.random();
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, ...RainU },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform vec3 uCam; uniform float uTime;
      attribute vec4 aRnd; varying vec2 vUv; varying float vT; varying float vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        float dur = 0.35 + aRnd.z * 0.2;
        float tt = uTime / dur + aRnd.w * 10.0;
        float cyc = floor(tt); float t = fract(tt);
        vec2 r = vec2(h(vec2(cyc, aRnd.x * 91.0)), h(vec2(aRnd.y * 37.0, cyc + 3.1)));
        float ang = r.x * 6.2831; float rad = sqrt(r.y) * 14.0 + 0.8;
        vec3 p = vec3(uCam.x + cos(ang) * rad, 0.02, uCam.z + sin(ang) * rad);
        vec3 toCam = normalize(vec3(uCam.x - p.x, 0.0, uCam.z - p.z));
        vec3 side = vec3(-toCam.z, 0.0, toCam.x);
        float s = 0.06 + t * 0.12;
        vec3 wp = p + side * position.x * s * 2.0 + vec3(0.0, (position.y + 0.5) * s * 1.2, 0.0);
        vUv = uv; vT = t; vD = rad;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRainCol; uniform float uRainLight; uniform float uIntensity;
      varying vec2 vUv; varying float vT; varying float vD;
      void main(){
        vec2 c = vUv - vec2(0.5, 0.0);
        float crown = smoothstep(0.5, 0.3, length(c * vec2(1.0, 1.4))) * smoothstep(0.0, 0.25, length(c * vec2(1.0, 1.4)));
        float a = crown * (1.0 - vT) * 0.35 * (1.0 - smoothstep(8.0, 14.0, vD));
        gl_FragColor = vec4(uRainCol * uRainLight * a, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false; mesh.layers.set(LAYER_NO_REFLECT); mesh.renderOrder = 11;
  mesh.userData.max = count;
  return mesh;
}

export class Rain {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.layers = [];
    this.mist = null;
    this.bolt = null;
    this.flash = 0; this.flashT = 0; this.nextStrike = 8;
    this.onThunder = null;
    this.u = RainU;
  }
  build(quality) {
    for (const l of this.layers) { this.group.remove(l); l.geometry.dispose(); l.material.dispose(); }
    this.layers = [];
    const m = quality.rainMul;
    this.near = rainLayer(Math.floor(5000 * m), [18, 22], 0.55, 0.012, 0.55, 0.4, 11, 11);
    this.mid = rainLayer(Math.floor(9000 * m), [50, 40], 0.9, 0.025, 0.32, 6, 30, 23);
    this.far = rainLayer(Math.floor(7000 * m), [130, 70], 1.6, 0.09, 0.14, 20, 75, 37);
    this.splash = splashLayer(Math.floor(900 * m));
    this.layers = [this.near, this.mid, this.far, this.splash];
    for (const l of this.layers) this.group.add(l);
    if (this.mist && this.mistCount !== quality.mist) { this.scene.remove(this.mist); this.mist = null; }
    this.mistCount = quality.mist ?? 26;
    if (!this.mist) this.buildMist();
    if (!this.bolt) this.buildBolt();
  }
  buildMist() {
    const tex = makeFogSprite(3);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.25, color: 0xffffff, fog: true });
    this.mist = new THREE.Group();
    this.mistSprites = [];
    for (let i = 0; i < this.mistCount; i++) {
      const s = new THREE.Sprite(mat);
      const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 70;
      s.userData = { a, r, y: 0.5 + Math.random() * 4, sz: 14 + Math.random() * 22, drift: (Math.random() - 0.5) * 0.02 };
      s.layers.set(LAYER_NO_REFLECT);
      this.mist.add(s); this.mistSprites.push(s);
    }
    this.mistMat = mat;
    this.scene.add(this.mist);
  }
  buildBolt() {
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(6, 6, 8), transparent: true, opacity: 1, fog: false });
    this.boltGeo = new THREE.BufferGeometry();
    this.boltGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 80), 3));
    this.bolt = new THREE.LineSegments(this.boltGeo, mat);
    this.bolt.visible = false; this.bolt.frustumCulled = false;
    this.bolt.layers.set(LAYER_NO_REFLECT);
    this.scene.add(this.bolt);
  }
  strike(camPos) {
    const a = Math.random() * Math.PI * 2, r = 400 + Math.random() * 500;
    let x = camPos.x + Math.cos(a) * r, z = camPos.z + Math.sin(a) * r, y = 420;
    const pts = [];
    const segs = 22;
    for (let i = 0; i < segs && pts.length < 78 * 3; i++) {
      const nx = x + (Math.random() - 0.5) * 40, ny = y - 420 / segs, nz = z + (Math.random() - 0.5) * 40;
      pts.push(x, y, z, nx, ny, nz);
      if (Math.random() < 0.25 && pts.length < 70 * 3) { pts.push(nx, ny, nz, nx + (Math.random() - 0.5) * 70, ny - 30, nz + (Math.random() - 0.5) * 70); }
      x = nx; y = ny; z = nz;
    }
    const arr = this.boltGeo.attributes.position.array;
    arr.fill(0); arr.set(pts.slice(0, arr.length));
    this.boltGeo.setDrawRange(0, pts.length / 3);
    this.boltGeo.attributes.position.needsUpdate = true;
    this.boltDist = r;
    U.uFlash.value = 1;
    this.flashT = 0;
    if (this.onThunder) this.onThunder(r, Math.random());
  }
  update(dt, t, s, cam, atm, opts = {}) {
    const intensity = opts.hidden ? 0 : s.rainIntensity;
    RainU.uSnowP.value = opts.snow || 0;
    RainU.uIntensity.value = intensity;
    RainU.uCam.value.copy(cam.position);
    RainU.uRainCol.value.set(s.rainColor);
    const wd = s.windDir * Math.PI / 180;
    const w = s.wind * 5 + s.storm * 3;
    RainU.uWind.value.set(Math.cos(wd) * w + Math.sin(t * 0.3) * w * 0.2, Math.sin(wd) * w);
    RainU.uSpeed.value = s.rainSpeed * (1 + s.storm * 0.3);
    RainU.uDrop.value = s.dropSize;
    // brighter rain at night near lights; daylight rain reads as pale streaks
    RainU.uRainLight.value = (0.35 + (1 - atm.night) * 0.5 + atm.night * 0.35) * (0.6 + s.reflRain * 0.8);
    RainU.uRainGlint.value = s.reflRain;
    const heavy = Math.min(1, intensity * (1 + s.storm * 0.5));
    if (this.near) {
      this.near.geometry.instanceCount = Math.floor(this.near.userData.max * Math.min(1, heavy * 1.1));
      this.mid.geometry.instanceCount = Math.floor(this.mid.userData.max * heavy);
      this.far.geometry.instanceCount = Math.floor(this.far.userData.max * Math.min(1, heavy * 1.2));
      this.splash.geometry.instanceCount = Math.floor(this.splash.userData.max * heavy * (1 - (opts.snow || 0)));
      this.group.visible = intensity > 0.001 && opts.indoor !== 'full';
      const part = opts.indoor === 'partial';
      this.near.visible = !part; this.mid.visible = !part; this.splash.visible = !part;
    }
    // mist banks
    if (this.mist) {
      const mistAmt = s.mist * (0.5 + s.fog * 0.5);
      this.mist.visible = mistAmt > 0.02 && !opts.hidden && !opts.indoor;
      this.mistMat.opacity = 0.16 * mistAmt;
      this.mistMat.color.copy(atm.fogCol).multiplyScalar(1.4).addScalar(0.04);
      for (const sp of this.mistSprites) {
        const d = sp.userData;
        d.a += d.drift * dt * (1 + s.wind * 3);
        sp.position.set(cam.position.x + Math.cos(d.a) * d.r, d.y, cam.position.z + Math.sin(d.a) * d.r);
        sp.scale.set(d.sz * 1.6, d.sz * 0.45, 1);
      }
    }
    // lightning
    if (s.lightning && s.storm > 0.15 && !opts.frozen) {
      this.nextStrike -= dt;
      if (this.nextStrike <= 0) {
        this.strike(cam.position);
        this.nextStrike = (6 + Math.random() * 22) / (0.4 + s.storm);
      }
    }
    if (U.uFlash.value > 0) {
      this.flashT += dt;
      const f = this.flashT;
      U.uFlash.value = Math.max(0, (f < 0.08 ? 1 : f < 0.14 ? 0.3 : f < 0.22 ? 0.9 : Math.exp(-(f - 0.22) * 9)) * Math.min(1, 0.5 + s.storm));
      this.bolt.visible = f < 0.3;
      this.bolt.material.opacity = f < 0.3 ? 1 - f / 0.3 : 0;
      if (U.uFlash.value < 0.002) U.uFlash.value = 0;
    } else if (this.bolt) this.bolt.visible = false;
  }
}
