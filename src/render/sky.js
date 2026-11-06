// Sky dome with time-of-day gradient, drifting rain clouds, moon, city glow and lightning.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shared.js';

export class Sky {
  constructor() {
    this.uniforms = {
      ...U,
      uTop: { value: new THREE.Color() },
      uHor: { value: new THREE.Color() },
      uGlowCol: { value: new THREE.Color() },
      uCloudCol: { value: new THREE.Color() },
      uCover: { value: 0.8 },
      uCloudDark: { value: 0.5 },
      uCloudH: { value: 0.5 },
      uCloudOff: { value: new THREE.Vector2() },
      uMoonDir: { value: new THREE.Vector3(0.3, 0.5, -0.8).normalize() },
      uMoon: { value: 1 },
      uSunDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() },
      uSun: { value: 0 },
      uSunCol: { value: new THREE.Color(1, 0.7, 0.4) },
      uBoltPos: { value: new THREE.Vector2(0, 0) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        uniform vec3 uTop, uHor, uGlowCol, uCloudCol, uMoonDir, uSunDir, uSunCol;
        uniform float uCover, uCloudDark, uCloudH, uMoon, uSun;
        uniform vec2 uCloudOff, uBoltPos;
        varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = mix(uHor, uTop, pow(clamp(h, 0.0, 1.0), 0.55));
          col += uGlowCol * pow(1.0 - clamp(abs(h), 0.0, 1.0), 6.0);
          // sun glow (behind clouds)
          float sd = max(dot(d, uSunDir), 0.0);
          col += uSunCol * (pow(sd, 8.0) * 0.35 + pow(sd, 200.0) * 2.0) * uSun * (1.0 - uCover * 0.7);
          // moon
          float md = dot(d, uMoonDir);
          float moon = smoothstep(0.9992, 0.9996, md);
          float halo = pow(max(md, 0.0), 60.0) * 0.25;
          // clouds on a plane
          float k = (0.6 + uCloudH * 1.2) / max(h + 0.08, 0.03);
          vec2 p = d.xz * k + uCloudOff;
          float n = raFbm(p * 0.9) * 0.65 + raFbm(p * 2.7 + 4.0) * 0.35;
          float cover = smoothstep(1.0 - uCover - 0.15, 1.0 - uCover + 0.35, n);
          float thick = smoothstep(0.3, 1.0, n);
          vec3 cc = uCloudCol * (1.0 - uCloudDark * 0.75 * thick);
          cc += uGlowCol * 0.6 * (1.0 - thick);
          float fade = smoothstep(-0.02, 0.18, h);
          float vis = (1.0 - cover * fade);
          col += vec3(0.85, 0.88, 1.0) * (moon * 1.4 + halo) * uMoon * vis * smoothstep(0.0, 0.1, h);
          col = mix(col, cc, cover * fade);
          // lightning lights the cloud undersides
          float bolt = exp(-length(d.xz / max(h, 0.05) * 0.2 - uBoltPos) * 1.2);
          col += uFlash * vec3(0.75, 0.8, 1.0) * (0.35 + bolt * 1.8 * thick) * fade;
          col = mix(col, col * 0.7 + raRainbowCol(d * 300.0) * 0.4, uRainbow * 0.4 * fade);
          if (h < 0.0) col = mix(col, uHor * 0.8, smoothstep(0.0, -0.1, h));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
  }
  update(camera) { this.mesh.position.copy(camera.position); }
}
