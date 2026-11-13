// Engine: renderer, post-processing chain, and the systems that make up the living city.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { PlanarReflector } from './reflections.js';
import { Sky } from './sky.js';
import { LightRig } from './lights.js';
import { Atmosphere } from './atmosphere.js';
import { Rain } from './rain.js';
import { setAnisotropy } from './textures.js';
import { CityBuilder, LAYER_NO_REFLECT } from '../world/cityBase.js';
import { Crowd } from '../world/pedestrians.js';
import { Traffic } from '../world/traffic.js';
import { finishStatic } from '../world/staticInstances.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uSat: { value: 1 }, uContrast: { value: 1 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uLift: { value: new THREE.Vector3() },
    uGrain: { value: 0.05 }, uVignette: { value: 0.3 }, uPosterize: { value: 0 }, uMono: { value: 0 }, uWarm: { value: 0 }, uChroma: { value: 0 }, uSoft: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uSat, uContrast, uGrain, uVignette, uPosterize, uMono, uWarm, uChroma, uSoft;
    uniform vec3 uTint, uLift; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 0.0) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float ca = uChroma * 0.004 * dot(d, d) * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv + d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ca).b);
      if (uSoft > 0.0) {
        vec2 px = 1.5 / uRes;
        vec3 b = texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb + texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb + texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb + texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb;
        c = mix(c, max(c, b * 0.25), uSoft * 0.5);
      }
      c = c * uTint + uLift * (1.0 - c);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat);
      c = (c - 0.5) * uContrast + 0.5;
      c += vec3(0.04, 0.012, -0.04) * uWarm;
      c = mix(c, vec3(l) * vec3(1.02, 1.0, 0.97), uMono);
      if (uPosterize > 0.0) c = floor(c * uPosterize + 0.5) / uPosterize;
      float v = smoothstep(0.35, 0.95, length(d * vec2(1.0, 0.8)) * 1.3);
      c *= 1.0 - uVignette * v;
      float g = h(vUv * uRes + fract(uTime * 7.13) * 100.0) - 0.5;
      c += g * uGrain * (0.6 + 0.4 * (1.0 - l));
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

export class Engine {
  constructor(container, quality) {
    this.container = container;
    this.quality = quality;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false });
    } catch (e) {
      throw new Error('WebGL could not start on this device or browser. Try another browser, enable hardware acceleration, or update your graphics drivers.');
    }
    if (!renderer.capabilities.isWebGL2) throw new Error('This experience needs WebGL 2, which this browser does not provide.');
    this.renderer = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x05070c);
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Rainy city view');
    renderer.domElement.tabIndex = 0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.08, 3200);
    this.camera.layers.enable(LAYER_NO_REFLECT);
    this.camera.position.set(0, 1.65, 0);
    this.scene.add(this.camera);
    this.sky = new Sky();
    this.scene.add(this.sky.mesh);
    this.rig = new LightRig(this.scene);
    this.atmo = new Atmosphere(this.scene, this.sky, this.rig);
    this.rain = new Rain(this.scene);
    this.reflector = new PlanarReflector(renderer);
    this.renderScale = 1;
    this.city = null;
    this.crowd = null; this.traffic = null;
    this.buildPost();
    this.applyQuality(quality);
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', () => setTimeout(this.onResize, 250));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this.onResize);
    this.resize();
  }
  buildPost() {
    const r = this.renderer;
    if (this.composer) this.composer.dispose();
    const size = r.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y), { type: THREE.HalfFloatType, samples: this.quality?.msaa || 0 });
    this.composer = new EffectComposer(r, rt);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.bokeh = new BokehPass(this.scene, this.camera, { focus: 12, aperture: 0.0002, maxblur: 0.008 });
    this.bokeh.enabled = false;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.8, 0.55, 0.82);
    this.output = new OutputPass();
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bokeh);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.output);
    this.composer.addPass(this.grade);
  }
  applyQuality(q) {
    const prevMsaa = this.quality?.msaa;
    this.quality = q;
    setAnisotropy(Math.min(q.aniso, this.renderer.capabilities.getMaxAnisotropy()));
    this.reflector.scale = q.refl; this.reflector.every = q.reflEvery;
    this.rig.setPointCount(q.points);
    this.rain.build(q);
    if (prevMsaa !== undefined && prevMsaa !== q.msaa) this.buildPost();
    this.resize();
  }
  resize() {
    const w = this.container.clientWidth || window.innerWidth, h = this.container.clientHeight || window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, this.quality.maxPR) * this.renderScale * (this.userScale ?? 1);
    this.renderer.setPixelRatio(Math.max(0.4, pr));
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    const bs = this.quality.bloomRes;
    this.bloom.setSize(Math.floor(w * this.renderer.getPixelRatio() * bs), Math.floor(h * this.renderer.getPixelRatio() * bs));
    const ds = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.reflector.setSize(ds.x, ds.y);
    this.grade.uniforms.uRes.value.set(ds.x, ds.y);
    this.size = { w, h };
  }

  async loadCity(def, onProgress) {
    const step = async (p, label) => { onProgress?.(p, label); await new Promise((r) => setTimeout(r, 0)); };
    const old = this.city;
    const cb = new CityBuilder(def, this.quality, null);
    await def.build(cb, step);
    await step(0.85, 'Merging geometry');
    // ground-plane surfaces sample the reflection, so they are left out of it
    finishStatic(cb, this.quality);
    cb.batch.build(cb.group, { castLayers: (m) => {
      if (m.material.userData.noReflect) m.layers.set(LAYER_NO_REFLECT);
      if (m.material === cb.mats.metal) m.userData.detail = true; // railings, fire escapes, poles: only needed up close
    }, name: 'city' });
    // meshes that take part in distance culling (merged chunks; ground stays always on)
    cb.cullable = cb.group.children.filter((m) => m.isMesh && !m.isInstancedMesh && m.name === 'city' && m.geometry.boundingSphere && !m.material.userData.noReflect);
    if (old) this.unloadCity(old);
    this.scene.add(cb.group);
    this.city = cb;
    this.rig.setCity(cb);
    if (!this.crowd) this.crowd = new Crowd(this.scene, this.quality.peds);
    if (!this.traffic) this.traffic = new Traffic(this.scene, this.quality.cars);
    this.crowd.bldClear = def.bldClear ?? 1.6;
    this.crowd.col = cb.col;
    this.crowd.setGraph(cb.graph, cb.signals, def.pedStyle || 'city');
    this.traffic.setCity(cb, def);
    await step(0.95, 'Warming up shaders');
    try { this.renderer.compile(this.scene, this.camera); } catch { /* compile is a best-effort warm-up */ }
    await step(1, 'Ready');
    return cb;
  }
  unloadCity(cb) {
    this.scene.remove(cb.group);
    cb.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    for (const d of cb.disposables) d.dispose?.();
  }
  rebuildPopulation() {
    if (this.crowd) { this.crowd.dispose(); this.crowd = null; }
    if (this.traffic) { this.traffic.dispose(); this.traffic = null; }
    if (this.city) {
      this.crowd = new Crowd(this.scene, this.quality.peds);
      this.crowd.bldClear = this.city.def.bldClear ?? 1.6;
      this.crowd.col = this.city.col;
      this.crowd.setGraph(this.city.graph, this.city.signals, this.city.def.pedStyle || 'city');
      this.traffic = new Traffic(this.scene, this.quality.cars);
      this.traffic.setCity(this.city, this.city.def);
    }
  }
  /** Skip city chunks the fog hides anyway, and fine metal detail beyond close range. */
  cullCity(reflection = false) {
    const cb = this.city; if (!cb?.cullable) return;
    const q = this.quality, c = this.camera.position;
    // puddles only reflect what's fairly close, and never the fine metalwork
    const far = reflection ? (q.reflDist ?? 90) : q.viewDist + 45, near = reflection ? -1 : (q.detailDist ?? 70);
    for (const m of cb.cullable) {
      const bs = m.geometry.boundingSphere;
      const d = Math.hypot(bs.center.x - c.x, bs.center.z - c.z) - bs.radius;
      m.visible = d < (m.userData.detail ? near : far);
    }
    const parkedFar = reflection ? Math.min(far, q.parkedDist ?? 90) : (q.parkedDist ?? 90);
    for (const m of cb.cullInst || []) {
      const bs = m.boundingSphere; if (!bs) continue;
      const d = Math.hypot(bs.center.x - c.x, bs.center.z - c.z) - bs.radius;
      m.visible = d < (m.userData.cull === 'parked' ? parkedFar : far);
    }
  }
  render() {
    this.cullCity(true);
    this.reflector.update(this.scene, this.camera, 0);
    this.cullCity(false);
    this.composer.render();
  }
}
