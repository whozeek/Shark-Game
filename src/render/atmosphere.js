// Maps simulated weather + time of day to sky colours, fog, ambient light and the night factor.
// This is simulated weather — nothing here reads a live weather service.
import * as THREE from 'three';
import { U } from './shared.js';
import { SkyU } from '../world/skyline.js';
import { ConeU } from './lights.js';

const KEYS = [
  // hour, top, horizon, ambient, night, sunUp
  [0, '#04060d', '#121828', 0.10, 1.0],
  [4.6, '#060914', '#1a1f33', 0.11, 1.0],
  [5.6, '#1c2340', '#6a5470', 0.18, 0.75],
  [6.4, '#3d4d74', '#d29a82', 0.35, 0.45],
  [7.6, '#6680a6', '#cfc3b8', 0.6, 0.12],
  [12, '#7d98b8', '#d3d9df', 0.85, 0.0],
  [16.5, '#7590b2', '#d9cfc2', 0.75, 0.02],
  [18.0, '#4f5f8a', '#f0a06a', 0.5, 0.25],
  [18.9, '#2a3260', '#b8607a', 0.32, 0.5],
  [19.8, '#141a3a', '#4a3a5c', 0.2, 0.78],
  [20.8, '#0a0f24', '#252842', 0.13, 0.94],
  [24, '#04060d', '#121828', 0.10, 1.0],
];

const _a = new THREE.Color(), _b = new THREE.Color();
function sampleKeys(hour) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const k0 = KEYS[i], k1 = KEYS[i + 1];
    if (hour >= k0[0] && hour <= k1[0]) {
      const t = (hour - k0[0]) / (k1[0] - k0[0]);
      const s = t * t * (3 - 2 * t);
      return {
        top: _a.set(k0[1]).lerp(_b.set(k1[1]), s).clone(),
        hor: _a.set(k0[2]).lerp(_b.set(k1[2]), s).clone(),
        amb: k0[3] + (k1[3] - k0[3]) * s,
        night: k0[4] + (k1[4] - k0[4]) * s,
      };
    }
  }
  return sampleKeys(0);
}

export class Atmosphere {
  constructor(scene, sky, rig) {
    this.scene = scene; this.sky = sky; this.rig = rig;
    this.fog = new THREE.FogExp2(0x1d2233, 0.01);
    scene.fog = this.fog;
    this.state = {};
    this.cloudOff = new THREE.Vector2();
  }
  update(dt, s, extra = {}) {
    const hour = ((s.timeOfDay % 24) + 24) % 24;
    const k = sampleKeys(hour);
    const rain = s.rainIntensity;
    const storm = s.storm;
    const overcast = Math.min(1, s.clouds * (0.6 + 0.4 * rain) + storm * 0.3);
    const dark = s.cloudDarkness * 0.6 + storm * 0.4;
    // overcast desaturates and darkens the sky
    const lumTop = k.top.r * 0.3 + k.top.g * 0.59 + k.top.b * 0.11;
    const lumHor = k.hor.r * 0.3 + k.hor.g * 0.59 + k.hor.b * 0.11;
    const grey = new THREE.Color(0.55, 0.58, 0.64);
    const top = k.top.clone().lerp(grey.clone().multiplyScalar(lumTop * 1.2), overcast * 0.7).multiplyScalar(1 - dark * overcast * 0.55);
    const hor = k.hor.clone().lerp(grey.clone().multiplyScalar(lumHor * 1.15), overcast * 0.6).multiplyScalar(1 - dark * overcast * 0.45);
    const night = Math.min(1, k.night + overcast * dark * 0.25 * (1 - k.night) + storm * 0.15);
    this.night = night;
    // city light pollution glows warm on low clouds at night
    const city = new THREE.Color(extra.glow || '#6a4a3a').multiplyScalar(0.55 * night * (0.4 + overcast * 0.8));
    const fogCol = hor.clone().lerp(new THREE.Color(0.32, 0.34, 0.4).multiplyScalar(0.3 + (1 - night) * 0.7), 0.4).add(city.clone().multiplyScalar(0.35));
    const fogAmt = s.fog;
    const density = 0.0025 + fogAmt * fogAmt * 0.022 + rain * 0.004 + storm * 0.003;
    this.fog.color.copy(fogCol);
    this.fog.density = density;
    this.scene.background = null;
    // sky uniforms
    const su = this.sky.uniforms;
    su.uTop.value.copy(top);
    su.uHor.value.copy(hor).lerp(fogCol, Math.min(0.9, fogAmt * 0.6 + rain * 0.2));
    su.uGlowCol.value.copy(city);
    su.uCloudCol.value.copy(hor).lerp(grey, 0.5).multiplyScalar(0.55 + (1 - night) * 0.5).add(city.clone().multiplyScalar(0.7));
    su.uCover.value = Math.min(1, s.clouds * 0.9 + storm * 0.15);
    su.uCloudDark.value = Math.min(1, s.cloudDarkness * 0.8 + storm * 0.3);
    su.uCloudH.value = s.cloudHeight;
    const wd = s.windDir * Math.PI / 180;
    this.cloudOff.x += Math.cos(wd) * dt * s.cloudSpeed * 0.06 * (1 + s.wind);
    this.cloudOff.y += Math.sin(wd) * dt * s.cloudSpeed * 0.06 * (1 + s.wind);
    su.uCloudOff.value.copy(this.cloudOff);
    // sun & moon
    const sunA = (hour - 6) / 12 * Math.PI; // 0 at 6h, PI at 18h
    const sunDir = new THREE.Vector3(Math.cos(sunA) * 0.8, Math.sin(sunA), -0.55).normalize();
    su.uSunDir.value.copy(sunDir);
    su.uSun.value = Math.max(0, Math.min(1, sunDir.y * 4 + 0.3)) * (1 - overcast * 0.5);
    su.uSunCol.value.setHSL(0.07 + Math.max(0, sunDir.y) * 0.05, 0.9, 0.6);
    const moonA = ((hour + 12) % 24 - 6) / 12 * Math.PI;
    const moonDir = new THREE.Vector3(Math.cos(moonA) * 0.7, Math.max(0.15, Math.sin(moonA)), -0.7).normalize();
    su.uMoonDir.value.copy(moonDir);
    su.uMoon.value = night * s.moonlight;
    // shared uniforms
    U.uSkyTop.value.copy(top);
    U.uSkyHorizon.value.copy(hor);
    U.uCityGlow.value.copy(city);
    U.uNight.value = night;
    // lights
    const ambient = k.amb * (1 - overcast * 0.45) * (1 - storm * 0.2) * s.ambient;
    const rig = this.rig;
    rig.hemi.color.copy(top).lerp(new THREE.Color(0.6, 0.65, 0.8), 0.5);
    rig.hemi.groundColor.copy(new THREE.Color(0.28, 0.24, 0.2)).add(city.clone().multiplyScalar(0.5));
    rig.hemi.intensity = 0.25 + ambient * 2.2 + night * 0.35 + U.uFlash.value * 4;
    const sunUp = sunDir.y > 0;
    if (sunUp) {
      rig.dir.color.copy(su.uSunCol.value).lerp(new THREE.Color(1, 1, 1), 0.5);
      rig.dir.intensity = Math.max(0, sunDir.y) * 2.2 * (1 - overcast * 0.75);
      rig.dir.position.copy(sunDir).multiplyScalar(200);
    } else {
      rig.dir.color.set(0x9fb2ff);
      rig.dir.intensity = 0.25 * s.moonlight * (1 - overcast * 0.6);
      rig.dir.position.copy(moonDir).multiplyScalar(200);
    }
    rig.night = night;
    rig.streetOn = smoothstep(0.25, 0.55, night) * 0.85 + 0.15 * smoothstep(0.1, 0.25, night);
    // distant scenery haze
    SkyU.uHazeCol.value.copy(fogCol).lerp(hor, 0.3);
    SkyU.uHaze.value = Math.min(0.93, 0.35 + fogAmt * 0.45 + rain * 0.12);
    SkyU.uAmb.value.copy(top).multiplyScalar(0.6).add(new THREE.Color(0.02, 0.02, 0.03));
    SkyU.uGlow.value = (0.25 + night * 0.9) * s.windowGlow;
    ConeU.uHaze.value = Math.min(1, fogAmt * 0.6 + rain * 0.6);
    this.state = { night, overcast, fogCol, density, hour, top, hor };
    return this.state;
  }
}

function smoothstep(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
