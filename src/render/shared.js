// Shared shader uniforms and material "patches" that add wet reflections, glass sheen and
// world-space rainbow colour to standard Three.js materials. Every material that should react
// to the atmosphere is patched here, so the look stays consistent across all cities.
import * as THREE from 'three';

export const U = {
  uTime: { value: 0 },
  uRainbow: { value: 0 },
  uRbPhase: { value: 0 },
  uRbSpread: { value: 0.5 },
  uRbSat: { value: 0.85 },
  uRbDir: { value: new THREE.Vector2(0.7, 0.7) },
  uPal0: { value: new THREE.Color('#ff4d6d') },
  uPal1: { value: new THREE.Color('#ffd166') },
  uPal2: { value: new THREE.Color('#06d6a0') },
  uPal3: { value: new THREE.Color('#4d96ff') },
  uPalMode: { value: 0 },
  uFlash: { value: 0 },
  uSkyTop: { value: new THREE.Color(0x0b1020) },
  uSkyHorizon: { value: new THREE.Color(0x2a2f45) },
  uCityGlow: { value: new THREE.Color(0x553a2a) },
  // reflections
  uReflTex: { value: null },
  uReflMat: { value: new THREE.Matrix4() },
  uReflOn: { value: 0 },
  uReflStreet: { value: 1 },
  uReflPuddle: { value: 1 },
  uReflWindow: { value: 0.7 },
  uReflCar: { value: 0.8 },
  uReflBlur: { value: 0.3 },
  uReflLen: { value: 0.5 },
  uReflColor: { value: 1 },
  uReflMotion: { value: 0.5 },
  uWetness: { value: 1 },
  uPuddles: { value: 0.55 },
  uRainAmt: { value: 0.5 },
  uNight: { value: 1 },
  uPoolA: { value: Array.from({ length: 40 }, () => new THREE.Vector4(0, 0, 1, 0)) },
  uPoolC: { value: Array.from({ length: 40 }, () => new THREE.Vector3()) },
  uPoolGain: { value: 1 },
};
export const POOL_COUNT = 40;

export const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform float uRainbow, uRbPhase, uRbSpread, uRbSat, uPalMode, uFlash;
uniform vec2 uRbDir;
uniform vec3 uPal0, uPal1, uPal2, uPal3;
uniform vec3 uSkyTop, uSkyHorizon, uCityGlow;
uniform float uNight;
float raHash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 raHash32(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz+33.33); return fract((p3.xxy+p3.yzz)*p3.zyx); }
float raNoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(raHash12(i), raHash12(i+vec2(1,0)), f.x), mix(raHash12(i+vec2(0,1)), raHash12(i+vec2(1,1)), f.x), f.y); }
float raFbm(vec2 p){ float a = 0.5, s = 0.0; for(int i=0;i<4;i++){ s += a*raNoise(p); p = p*2.03 + 17.1; a *= 0.5; } return s; }
vec3 raHue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0))*6.0 - 3.0) - 1.0, 0.0, 1.0); }
vec3 raRainbowCol(vec3 wp){
  float t = dot(wp.xz, uRbDir) * (0.003 + uRbSpread*0.03) + wp.y*0.012 - uRbPhase;
  vec3 c;
  if (uPalMode < 0.5) { c = raHue(fract(t)); }
  else {
    float f = fract(t) * 4.0; float k = fract(f); k = k*k*(3.0-2.0*k);
    if (f < 1.0) c = mix(uPal0, uPal1, k); else if (f < 2.0) c = mix(uPal1, uPal2, k);
    else if (f < 3.0) c = mix(uPal2, uPal3, k); else c = mix(uPal3, uPal0, k);
  }
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, uRbSat);
}
// A cheap "city environment" for vertical glass: sky above, smeared lights below the horizon.
vec3 raEnv(vec3 R, vec3 wp){
  float h = R.y;
  vec3 sky = mix(uSkyHorizon, uSkyTop, clamp(h*1.6, 0.0, 1.0));
  float az = atan(R.z, R.x);
  float lights = smoothstep(0.55, 1.0, raNoise(vec2(az*18.0, h*30.0 + wp.y*0.2))) * smoothstep(0.15, -0.05, h);
  vec3 below = uSkyHorizon*0.35 + uCityGlow*0.6 + lights*vec3(1.0, 0.75, 0.45)*(0.4 + uNight*1.4);
  vec3 c = mix(sky, below, smoothstep(0.04, -0.12, h));
  c += uFlash * vec3(0.7, 0.75, 0.95) * smoothstep(-0.1, 0.3, h) * 2.0;
  c = mix(c, c*0.6 + raRainbowCol(wp + R*8.0)*0.9, uRainbow);
  return c;
}
`;

const GROUND_PARS = /* glsl */`
uniform sampler2D uReflTex;
uniform mat4 uReflMat;
uniform float uReflOn, uReflStreet, uReflPuddle, uReflBlur, uReflLen, uReflColor, uReflMotion, uWetness, uPuddles, uRainAmt;
uniform float uPuddleScale;
uniform vec4 uPoolA[40];
uniform vec3 uPoolC[40];
uniform float uPoolGain;
vec3 raPools(vec3 wp){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 40; i++) {
    vec4 a = uPoolA[i];
    if (a.w <= 0.0) continue;
    vec2 d = wp.xz - a.xy;
    float r2 = dot(d, d) / (a.z * a.z);
    if (r2 > 1.0) continue;
    float f = (1.0 - r2); f *= f;
    acc += uPoolC[i] * f * a.w;
  }
  return acc * uPoolGain;
}
vec2 raRipple(vec2 p, float t){
  vec2 n = vec2(0.0);
  for (int l = 0; l < 2; l++) {
    vec2 q = p + float(l) * vec2(0.37, 0.71);
    vec2 id = floor(q); vec2 f = fract(q);
    vec3 h = raHash32(id + float(l)*13.7);
    float ph = fract(t * (0.8 + 0.5*h.z) + h.z * 7.0);
    vec2 d = f - (0.25 + 0.5*h.xy);
    float r = length(d) + 1e-4;
    float R = ph * 0.42;
    float band = exp(-pow((r - R) * 22.0, 2.0));
    n += (d / r) * sin((r - R) * 70.0) * band * (1.0 - ph) * (1.0 - ph);
  }
  return n;
}
`;

const VERT_PARS = /* glsl */`
varying vec3 vRaWPos;
varying vec3 vRaWNrm;
`;
const VERT_MAIN = /* glsl */`
{
  mat4 raM = modelMatrix;
  #ifdef USE_INSTANCING
    raM = modelMatrix * instanceMatrix;
  #endif
  vRaWPos = (raM * vec4(transformed, 1.0)).xyz;
  vRaWNrm = normalize(mat3(raM) * objectNormal);
}
`;

function injectVertex(shader) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\n' + VERT_PARS)
    .replace('#include <project_vertex>', '#include <project_vertex>\n' + VERT_MAIN);
}

function addUniforms(shader, extra = {}) {
  Object.assign(shader.uniforms, U, extra);
}

/**
 * Wet ground: darkens with moisture, gathers puddles, ripples with rain and samples the shared
 * planar reflection with blur/streak controls.
 */
export function patchGround(mat, { puddleScale = 1, taps = 5 } = {}) {
  const extra = { uPuddleScale: { value: puddleScale } };
  mat.userData.raExtra = extra;
  mat.userData.noReflect = true;
  mat.onBeforeCompile = (shader) => {
    addUniforms(shader, extra);
    injectVertex(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS + GLSL_COMMON + GROUND_PARS)
      .replace('#include <map_fragment>', /* glsl */`
        #include <map_fragment>
        float raPn = raFbm(vRaWPos.xz * 0.11 + 3.0) * 0.7 + raNoise(vRaWPos.xz * 0.6) * 0.3;
        float raThr = mix(0.78, 0.38, uPuddles * uPuddleScale);
        float raPud = smoothstep(raThr, raThr + 0.06, raPn) * uWetness;
        float raWet = uWetness;
        diffuseColor.rgb *= mix(1.0, 0.55, raWet * 0.8) * mix(1.0, 0.45, raPud);
      `)
      .replace('#include <roughnessmap_fragment>', /* glsl */`
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, mix(0.45, 0.06, raPud), raWet);
      `)
      .replace('#include <opaque_fragment>', /* glsl */`
        #include <opaque_fragment>
        if (uReflOn > 0.5) {
          vec3 raV = normalize(cameraPosition - vRaWPos);
          float raFres = 0.04 + 0.96 * pow(1.0 - clamp(raV.y, 0.0, 1.0), 5.0);
          vec2 raRip = raRipple(vRaWPos.xz * 2.2, uTime) * uRainAmt;
          vec2 raRough = (vec2(raNoise(vRaWPos.xz * 3.1), raNoise(vRaWPos.xz * 3.1 + 9.2)) - 0.5);
          float raMot = uReflMotion * (0.5 + 0.5 * sin(uTime * 0.7 + vRaWPos.x * 0.3));
          vec4 raC = uReflMat * vec4(vRaWPos, 1.0);
          vec2 raUv = raC.xy / raC.w;
          raUv += raRip * (0.012 + 0.02 * raPud) + raRough * 0.018 * (1.0 - raPud) * (0.4 + raMot);
          float raLod = uReflBlur * 5.0 * (1.0 - raPud * 0.7) + (1.0 - raPud) * 0.6;
          vec3 raR = vec3(0.0); float raWs = 0.0;
          float raLen = uReflLen * 0.06 * (1.0 - raPud * 0.6);
          for (int i = 0; i < RA_TAPS; i++) {
            float o = (float(i) / float(RA_TAPS - 1) - 0.5);
            float w = 1.0 - abs(o) * 1.2;
            raR += textureLod(uReflTex, raUv + vec2(0.0, o * raLen), raLod + abs(o) * 1.5).rgb * w;
            raWs += w;
          }
          raR /= raWs;
          float raAmt = mix(uReflStreet * (0.1 + 0.6 * raFres), uReflPuddle * (0.45 + 0.55 * raFres), raPud) * raWet;
          vec3 raTint = mix(vec3(1.0), raRainbowCol(vRaWPos) * 1.6, uRainbow * 0.55);
          raR = mix(vec3(dot(raR, vec3(0.333))), raR, uReflColor) * max(uReflColor, 0.6);
          gl_FragColor.rgb += raR * raAmt * raTint;
        }
        {
          vec3 raPl = raPools(vRaWPos);
          gl_FragColor.rgb += raPl * (diffuseColor.rgb * 1.6 + 0.05 + 0.12 * raPud * uWetness);
        }
        gl_FragColor.rgb += raRainbowCol(vRaWPos) * uRainbow * 0.025 * uWetness;
      `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#define RA_TAPS ${taps}\n#include <common>`);
  };
  mat.customProgramCacheKey = () => `ra-ground-${taps}`;
  return mat;
}

/**
 * Building façades: the map's alpha channel marks glass. Glass gets a fake environment
 * reflection (sky, city lights, lightning, rainbow) and walls receive a faint rainbow wash.
 */
export function patchFacade(mat) {
  mat.onBeforeCompile = (shader) => {
    addUniforms(shader);
    injectVertex(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS + GLSL_COMMON + 'uniform float uReflWindow, uWetness;\n')
      .replace('#include <map_fragment>', /* glsl */`
        float raGlass = 0.0;
        #ifdef USE_MAP
          vec4 raS = texture2D(map, vMapUv);
          diffuseColor.rgb *= raS.rgb;
          raGlass = raS.a;
        #endif
        diffuseColor.rgb *= mix(1.0, 0.82, uWetness * (1.0 - raGlass));
      `)
      .replace('#include <roughnessmap_fragment>', /* glsl */`
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.12, raGlass);
      `)
      .replace('#include <opaque_fragment>', /* glsl */`
        #include <opaque_fragment>
        {
          vec3 raV = normalize(cameraPosition - vRaWPos);
          vec3 raN = normalize(vRaWNrm);
          vec3 raR = reflect(-raV, raN);
          float raF = pow(1.0 - clamp(dot(raN, raV), 0.0, 1.0), 3.0);
          gl_FragColor.rgb += raEnv(raR, vRaWPos) * raGlass * uReflWindow * (0.12 + 0.88 * raF) * 0.6;
          gl_FragColor.rgb += raRainbowCol(vRaWPos) * uRainbow * (0.035 + 0.25 * raGlass * raF) * (0.4 + uNight * 0.6);
        }
      `);
  };
  mat.customProgramCacheKey = () => 'ra-facade';
  return mat;
}

/** Glossy surfaces such as car paint and car glass: fresnel environment reflection. */
export function patchGlossy(mat, { strengthUniform = 'uReflCar', base = 0.35, rainbowAmt = 0.25 } = {}) {
  mat.onBeforeCompile = (shader) => {
    addUniforms(shader);
    injectVertex(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS + GLSL_COMMON + `uniform float ${strengthUniform};\n`)
      .replace('#include <opaque_fragment>', /* glsl */`
        #include <opaque_fragment>
        {
          vec3 raV = normalize(cameraPosition - vRaWPos);
          vec3 raN = normalize(vRaWNrm);
          vec3 raR = reflect(-raV, raN);
          float raF = ${base.toFixed(3)} + (1.0 - ${base.toFixed(3)}) * pow(1.0 - clamp(dot(raN, raV), 0.0, 1.0), 4.0);
          gl_FragColor.rgb += raEnv(raR, vRaWPos) * ${strengthUniform} * raF * 0.5;
          gl_FragColor.rgb += raRainbowCol(vRaWPos) * uRainbow * ${rainbowAmt.toFixed(3)} * raF;
        }
      `);
  };
  mat.customProgramCacheKey = () => `ra-glossy-${strengthUniform}-${base}-${rainbowAmt}`;
  return mat;
}

/** Plain walls/props: just a gentle rainbow wash and wet darkening. */
export function patchWash(mat, amt = 0.03) {
  mat.onBeforeCompile = (shader) => {
    addUniforms(shader);
    injectVertex(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS + GLSL_COMMON)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>\n gl_FragColor.rgb += raRainbowCol(vRaWPos) * uRainbow * ${amt.toFixed(3)} * (0.4 + uNight * 0.6);`);
  };
  mat.customProgramCacheKey = () => `ra-wash-${amt}`;
  return mat;
}
