// Central settings store: defaults, the UI schema, presets and local persistence.
import { Emitter } from './events.js';

const STORAGE_KEY = 'rainfall-avenue:settings:v1';

export const TIME_PRESETS = [
  ['Dawn', 5.8], ['Morning', 8.5], ['Afternoon', 14], ['Sunset', 18.6],
  ['Evening', 20.4], ['Midnight', 0], ['Late night', 2.6],
];

export const STYLES = {
  realistic: { label: 'Realistic rain', sat: 0.92, contrast: 1.05, tint: [1, 1, 1], lift: [0, 0, 0], grain: 0.03, vignette: 0.25, bloom: 0.8, posterize: 0, mono: 0, warm: 0, soft: 0, chroma: 0 },
  cozy: { label: 'Cozy lo-fi', sat: 1.05, contrast: 0.98, tint: [1.04, 0.98, 0.94], lift: [0.03, 0.02, 0.05], grain: 0.07, vignette: 0.35, bloom: 1.0, posterize: 0, mono: 0, warm: 0.15, soft: 0.15, chroma: 0.15 },
  dreamy: { label: 'Dreamy', sat: 0.95, contrast: 0.9, tint: [1.02, 0.97, 1.06], lift: [0.06, 0.04, 0.08], grain: 0.04, vignette: 0.3, bloom: 1.4, posterize: 0, mono: 0, warm: 0, soft: 0.5, chroma: 0.25 },
  neon: { label: 'Neon', sat: 1.35, contrast: 1.12, tint: [1.02, 0.95, 1.1], lift: [0.02, 0, 0.05], grain: 0.04, vignette: 0.4, bloom: 1.35, posterize: 0, mono: 0, warm: -0.05, soft: 0.05, chroma: 0.3 },
  film: { label: 'Film', sat: 0.85, contrast: 1.1, tint: [1.03, 1.0, 0.92], lift: [0.04, 0.035, 0.02], grain: 0.14, vignette: 0.45, bloom: 0.8, posterize: 0, mono: 0, warm: 0.1, soft: 0.1, chroma: 0.2 },
  retro: { label: 'Retro', sat: 0.9, contrast: 1.0, tint: [1.08, 0.98, 0.85], lift: [0.06, 0.04, 0.02], grain: 0.1, vignette: 0.5, bloom: 0.9, posterize: 28, mono: 0, warm: 0.25, soft: 0.15, chroma: 0.5 },
  pastel: { label: 'Pastel', sat: 0.75, contrast: 0.85, tint: [1.03, 0.99, 1.04], lift: [0.1, 0.09, 0.11], grain: 0.03, vignette: 0.2, bloom: 1.1, posterize: 0, mono: 0, warm: 0, soft: 0.3, chroma: 0 },
  monochrome: { label: 'Monochrome', sat: 0, contrast: 1.15, tint: [1, 1, 1], lift: [0.02, 0.02, 0.02], grain: 0.12, vignette: 0.45, bloom: 0.9, posterize: 0, mono: 1, warm: 0, soft: 0.05, chroma: 0 },
  cyber: { label: 'Cyber-city', sat: 1.25, contrast: 1.15, tint: [0.92, 1.0, 1.12], lift: [0, 0.02, 0.05], grain: 0.05, vignette: 0.45, bloom: 1.5, posterize: 0, mono: 0, warm: -0.2, soft: 0, chroma: 0.6 },
  noir: { label: 'Rainy noir', sat: 0.25, contrast: 1.25, tint: [0.98, 1.0, 1.06], lift: [0, 0, 0.01], grain: 0.12, vignette: 0.6, bloom: 1.0, posterize: 0, mono: 0, warm: -0.1, soft: 0, chroma: 0.1 },
  golden: { label: 'Golden hour', sat: 1.1, contrast: 1.02, tint: [1.1, 1.0, 0.85], lift: [0.04, 0.02, 0.0], grain: 0.05, vignette: 0.3, bloom: 1.1, posterize: 0, mono: 0, warm: 0.35, soft: 0.2, chroma: 0.1 },
};

export const PALETTES = {
  rainbow: { label: 'Rainbow', mode: 0, colors: ['#ff4d6d', '#ffd166', '#06d6a0', '#4d96ff'] },
  purplepink: { label: 'Purple & pink', mode: 1, colors: ['#b15cff', '#ff5fa2', '#7b5cff', '#ff8ad8'] },
  bluecyan: { label: 'Blue & cyan', mode: 1, colors: ['#2d6bff', '#33e0ff', '#4b8dff', '#7af2ff'] },
  sunset: { label: 'Sunset', mode: 1, colors: ['#ff6b35', '#ff3d7f', '#ffb347', '#c94bff'] },
  neon: { label: 'Neon', mode: 1, colors: ['#ff2bd6', '#2bfff1', '#fff12b', '#7b2bff'] },
  custom: { label: 'Custom', mode: 1, colors: null },
};

export const DEFAULTS = {
  // City & movement
  city: 'nyc',
  mode: 'walk',
  reducedMotion: false,
  headBob: true,
  lookSensitivity: 1,
  invertY: false,
  walkSpeed: 1,
  umbrella: true,
  showMinimap: true,
  // Weather
  rainIntensity: 0.55,
  rainSpeed: 1,
  dropSize: 1,
  rainColor: '#cdd8ee',
  fog: 0.45,
  mist: 0.5,
  wind: 0.25,
  windDir: 35,
  puddles: 0.55,
  wetness: 1,
  clouds: 0.88,
  cloudDarkness: 0.55,
  cloudHeight: 0.5,
  cloudSpeed: 0.3,
  storm: 0.1,
  thunder: true,
  lightning: true,
  timeOfDay: 20.4,
  timeFlow: 'still',
  // Visual style
  style: 'cozy',
  palette: 'rainbow',
  custom1: '#ff7eb6',
  custom2: '#7afcff',
  custom3: '#feff9c',
  rainbow: 0,
  rainbowSpeed: 0.35,
  rainbowSpread: 0.5,
  rainbowDir: 40,
  rainbowSat: 0.85,
  rainbowMove: true,
  reflections: 0.85,
  reflStreet: 1,
  reflPuddle: 1,
  reflWindow: 0.7,
  reflCar: 0.8,
  reflRain: 0.5,
  reflNeon: 1,
  reflBlur: 0.3,
  reflLength: 0.55,
  reflColor: 1,
  reflMotion: 0.5,
  streetlights: 1,
  storefronts: 1,
  windowGlow: 1,
  headlights: 1,
  neon: 1,
  ambient: 1,
  moonlight: 1,
  bloom: 0.85,
  exposure: 1,
  // City life
  pedestrians: 0.5,
  pedSpeed: 1,
  umbrellaPct: 0.8,
  groups: 0.3,
  traffic: 0.45,
  trafficSpeed: 1,
  taxis: true,
  buses: true,
  headlightsOn: true,
  cyclists: true,
  dogs: true,
  citySounds: true,
  cityRhythm: true,
  // Audio
  masterVol: 0.8,
  musicVol: 0.55,
  musicStyle: 'all',
  shuffle: false,
  musicOn: true,
  rainVol: 0.7,
  thunderVol: 0.7,
  trafficVol: 0.45,
  peopleVol: 0.35,
  windVol: 0.35,
  ambienceVol: 0.5,
  footstepsVol: 0.35,
  // Display
  quality: 'auto',
  fpsCap: 'off',
  resolutionScale: 1,
  showFps: false,
};

// Photo-mode values are deliberately session-only.
export const PHOTO_DEFAULTS = {
  fov: 60, exposure: 1, dof: false, focus: 12, aperture: 0.4, grain: 0.05,
  hidePeople: false, hideCars: false, hideRain: false, freeze: true, roll: 0,
};

export const PRESETS = [
  { id: 'cozy', name: 'Cozy Rain', desc: 'Soft evening drizzle, warm windows', values: { rainIntensity: 0.5, fog: 0.4, mist: 0.45, storm: 0.05, timeOfDay: 20.2, style: 'cozy', rainbow: 0, clouds: 0.85, cloudDarkness: 0.5, pedestrians: 0.45, traffic: 0.4, wind: 0.2, puddles: 0.55, windowGlow: 1.1, neon: 0.9 } },
  { id: 'rainbow', name: 'Rainbow Rain', desc: 'Colour drifting through the drops', values: { rainIntensity: 0.6, rainbow: 0.85, palette: 'rainbow', rainbowMove: true, rainbowSpeed: 0.35, style: 'dreamy', timeOfDay: 21, fog: 0.4, reflections: 1, reflRain: 0.9, storm: 0.05 } },
  { id: 'neonmidnight', name: 'Neon Midnight', desc: 'Deep night, glowing signs', values: { timeOfDay: 0.3, style: 'neon', neon: 1.4, storefronts: 1.2, rainIntensity: 0.6, rainbow: 0.2, palette: 'neon', reflections: 1, reflNeon: 1.3, fog: 0.5, pedestrians: 0.3, traffic: 0.35, storm: 0.1 } },
  { id: 'purplerain', name: 'Purple Rain', desc: 'Violet haze and pink reflections', values: { rainColor: '#d2b4ff', palette: 'purplepink', rainbow: 0.7, style: 'neon', timeOfDay: 22.5, rainIntensity: 0.7, fog: 0.5, reflections: 1, storm: 0.15 } },
  { id: 'foggymorning', name: 'Foggy Morning', desc: 'Grey drizzle, quiet streets', values: { timeOfDay: 7.8, fog: 0.9, mist: 0.9, rainIntensity: 0.3, style: 'realistic', rainbow: 0, clouds: 1, cloudDarkness: 0.35, pedestrians: 0.35, traffic: 0.3, storm: 0, windowGlow: 0.6 } },
  { id: 'coffeeshop', name: 'Coffee Shop Weather', desc: 'Afternoon rain, glowing cafés', values: { timeOfDay: 16.5, rainIntensity: 0.45, style: 'cozy', storefronts: 1.35, fog: 0.45, storm: 0, pedestrians: 0.5, traffic: 0.35, musicStyle: 'coffee', rainbow: 0 } },
  { id: 'rushhour', name: 'Rainy Rush Hour', desc: 'Busy sidewalks, streaming headlights', values: { timeOfDay: 18.3, pedestrians: 1, traffic: 0.95, groups: 0.45, rainIntensity: 0.65, style: 'realistic', headlights: 1.2, umbrellaPct: 0.92, storm: 0.1, rainbow: 0 } },
  { id: 'thunderstorm', name: 'NYC Thunderstorm', desc: 'Heavy rain, rolling thunder', values: { city: 'nyc', rainIntensity: 1, storm: 0.9, thunder: true, lightning: true, wind: 0.65, clouds: 1, cloudDarkness: 0.85, fog: 0.65, timeOfDay: 21.5, style: 'realistic', pedestrians: 0.2, traffic: 0.35, rainbow: 0, puddles: 0.85 } },
  { id: 'empty', name: 'Empty NYC', desc: 'Nobody out but you', values: { city: 'nyc', pedestrians: 0.02, traffic: 0.04, timeOfDay: 3.2, rainIntensity: 0.4, fog: 0.6, style: 'film', storm: 0, rainbow: 0 } },
  { id: 'sunrise', name: 'Rainy Sunrise', desc: 'Pale gold through thinning clouds', values: { timeOfDay: 6.3, clouds: 0.65, cloudDarkness: 0.3, rainIntensity: 0.3, fog: 0.55, mist: 0.7, style: 'golden', rainbow: 0.25, palette: 'sunset', storm: 0 } },
  { id: 'dreamy', name: 'Dreamy NYC', desc: 'Pastel glow and gentle colour', values: { city: 'nyc', style: 'pastel', rainbow: 0.45, palette: 'purplepink', bloom: 1.2, timeOfDay: 19.4, fog: 0.55, rainIntensity: 0.45, storm: 0 } },
];

const SAVE_EXCLUDE = new Set([]);

export class Settings extends Emitter {
  constructor() {
    super();
    this.values = { ...DEFAULTS };
    this.photo = { ...PHOTO_DEFAULTS };
    this.loadError = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        for (const k of Object.keys(saved)) if (k in DEFAULTS && typeof saved[k] === typeof DEFAULTS[k]) this.values[k] = saved[k];
      }
    } catch (e) { this.loadError = e; }
    this._saveTimer = 0;
  }
  get(k) { return this.values[k]; }
  set(k, v, silent = false) {
    if (this.values[k] === v) return;
    this.values[k] = v;
    if (!silent) this.emit('change', k, v);
    this.scheduleSave();
  }
  setMany(obj) {
    const changed = [];
    for (const [k, v] of Object.entries(obj)) {
      if (!(k in DEFAULTS)) continue;
      if (this.values[k] !== v) { this.values[k] = v; changed.push(k); }
    }
    for (const k of changed) this.emit('change', k, this.values[k]);
    this.emit('bulk', changed);
    this.scheduleSave();
  }
  applyPreset(id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    // Presets start from the default atmosphere so they feel distinct, but keep city/mode/audio/display choices.
    const keep = ['city', 'mode', 'reducedMotion', 'headBob', 'lookSensitivity', 'invertY', 'walkSpeed', 'showMinimap', 'quality', 'fpsCap', 'resolutionScale', 'showFps', 'masterVol', 'musicVol', 'rainVol', 'thunderVol', 'trafficVol', 'peopleVol', 'windVol', 'ambienceVol', 'footstepsVol', 'musicOn', 'shuffle', 'umbrella', 'musicStyle'];
    const base = { ...DEFAULTS };
    for (const k of keep) base[k] = this.values[k];
    this.setMany({ ...base, ...p.values });
  }
  reset(section) {
    if (!section) { this.setMany({ ...DEFAULTS, city: this.values.city }); return; }
    const keys = SCHEMA_KEYS[section] || [];
    const o = {}; for (const k of keys) o[k] = DEFAULTS[k];
    this.setMany(o);
  }
  surprise(rng = Math.random) {
    const pick = (a) => a[Math.floor(rng() * a.length)];
    const styles = Object.keys(STYLES);
    const pals = Object.keys(PALETTES).filter((p) => p !== 'custom');
    const tod = pick(TIME_PRESETS)[1] + (rng() - 0.5) * 1.2;
    this.setMany({
      style: pick(styles), palette: pick(pals),
      rainbow: rng() < 0.45 ? 0.3 + rng() * 0.6 : 0,
      rainIntensity: 0.2 + rng() * 0.8, fog: 0.2 + rng() * 0.7, mist: rng(),
      storm: rng() < 0.3 ? 0.4 + rng() * 0.6 : rng() * 0.2,
      wind: rng() * 0.7, timeOfDay: (tod + 24) % 24, clouds: 0.6 + rng() * 0.4,
      cloudDarkness: 0.2 + rng() * 0.7, puddles: 0.3 + rng() * 0.6,
      pedestrians: 0.15 + rng() * 0.8, traffic: 0.1 + rng() * 0.8,
    });
  }
  scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.save(), 400);
  }
  save() {
    try {
      const out = {};
      for (const k of Object.keys(this.values)) if (!SAVE_EXCLUDE.has(k)) out[k] = this.values[k];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch { /* storage may be unavailable (private mode) — settings still work for this visit */ }
  }
  setPhoto(k, v) { this.photo[k] = v; this.emit('photo', k, v); }
}

// Keys grouped by UI section, used for per-section reset.
export const SCHEMA_KEYS = {
  city: ['mode', 'reducedMotion', 'headBob', 'lookSensitivity', 'invertY', 'walkSpeed', 'umbrella', 'showMinimap'],
  weather: ['rainIntensity', 'rainSpeed', 'dropSize', 'rainColor', 'fog', 'mist', 'wind', 'windDir', 'puddles', 'wetness', 'clouds', 'cloudDarkness', 'cloudHeight', 'cloudSpeed', 'storm', 'thunder', 'lightning', 'timeOfDay', 'timeFlow'],
  style: ['style', 'palette', 'custom1', 'custom2', 'custom3', 'rainbow', 'rainbowSpeed', 'rainbowSpread', 'rainbowDir', 'rainbowSat', 'rainbowMove', 'reflections', 'reflStreet', 'reflPuddle', 'reflWindow', 'reflCar', 'reflRain', 'reflNeon', 'reflBlur', 'reflLength', 'reflColor', 'reflMotion', 'streetlights', 'storefronts', 'windowGlow', 'headlights', 'neon', 'ambient', 'moonlight', 'bloom', 'exposure'],
  life: ['pedestrians', 'pedSpeed', 'umbrellaPct', 'groups', 'traffic', 'trafficSpeed', 'taxis', 'buses', 'headlightsOn', 'cyclists', 'dogs', 'citySounds', 'cityRhythm'],
  audio: ['masterVol', 'musicVol', 'musicStyle', 'shuffle', 'rainVol', 'thunderVol', 'trafficVol', 'peopleVol', 'windVol', 'ambienceVol', 'footstepsVol'],
  display: ['quality', 'fpsCap', 'resolutionScale', 'showFps'],
};

export const settings = new Settings();
