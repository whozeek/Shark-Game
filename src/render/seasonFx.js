// Seasonal particles around the walker: autumn leaves tumbling down and spring petals drifting.
import * as THREE from 'three';
import { U } from './shared.js';
import { LAYER_NO_REFLECT } from '../world/cityBase.js';

export class SeasonFx {
  constructor(scene, count = 260) {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
    g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
    g.instanceCount = count;
    this.u = { uCam: { value: new THREE.Vector3() }, uKind: { value: 0 }, uAmt: { value: 0 }, uWind: { value: new THREE.Vector2() }, uLight: { value: 1 } };
    this.mat = new THREE.ShaderMaterial({
      uniforms: { ...U, ...this.u }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        uniform vec3 uCam; uniform float uTime, uKind; uniform vec2 uWind; attribute vec4 aRnd;
        varying vec2 vUv; varying float vR; varying float vD;
        void main(){
          vec3 box = vec3(36.0, 14.0, 36.0);
          float fall = mix(0.9, 0.45, uKind) * (0.7 + aRnd.w * 0.6);
          vec3 p = aRnd.xyz * box + vec3(uWind.x, -fall, uWind.y) * uTime;
          p.x += sin(uTime * (0.8 + aRnd.w) + aRnd.y * 20.0) * 1.2;
          p.z += cos(uTime * (0.7 + aRnd.x) + aRnd.z * 20.0) * 1.2;
          vec3 o = uCam - vec3(box.x * 0.5, 1.5, box.z * 0.5);
          p = mod(p - o, box) + o;
          float a = uTime * (1.5 + aRnd.y * 3.0) + aRnd.x * 6.28;
          float s = mix(0.11, 0.06, uKind);
          vec3 lp = vec3(position.x * s, position.y * s * 0.7, 0.0);
          lp = vec3(lp.x * cos(a) - lp.z * sin(a), lp.y * cos(a * 0.7) , lp.x * sin(a) + lp.z * cos(a));
          vec3 wp = p + lp;
          vUv = uv; vR = aRnd.y; vD = length(wp - uCam);
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform float uKind, uAmt, uLight; varying vec2 vUv; varying float vR; varying float vD;
        void main(){
          vec2 c = vUv - 0.5;
          float shape = smoothstep(0.5, 0.42, length(c * vec2(1.0, 1.6 - uKind * 0.4)));
          if (shape < 0.05) discard;
          vec3 autumn = mix(mix(vec3(0.8, 0.3, 0.06), vec3(0.92, 0.62, 0.12), vR), vec3(0.55, 0.12, 0.05), step(0.8, vR));
          vec3 petal = mix(vec3(1.0, 0.82, 0.88), vec3(0.98, 0.7, 0.8), vR);
          vec3 col = mix(autumn, petal, uKind) * uLight;
          float fade = smoothstep(0.6, 1.5, vD) * (1.0 - smoothstep(14.0, 18.0, vD));
          gl_FragColor = vec4(col, shape * fade * uAmt);
        }`,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.layers.set(LAYER_NO_REFLECT);
    this.mesh.renderOrder = 9;
    scene.add(this.mesh);
  }
  update(cam, season, leafy, s, atm, hidden) {
    const kind = season === 'spring' ? 1 : 0;
    const on = leafy && (season === 'autumn' || season === 'spring') && !hidden;
    this.mesh.visible = on;
    if (!on) return;
    this.u.uKind.value = kind;
    this.u.uAmt.value = 0.9;
    this.u.uCam.value.copy(cam.position);
    const wd = s.windDir * Math.PI / 180, w = 0.4 + s.wind * 2.5;
    this.u.uWind.value.set(Math.cos(wd) * w, Math.sin(wd) * w);
    this.u.uLight.value = 0.35 + (1 - atm.night) * 0.6 + atm.night * 0.25;
  }
}
