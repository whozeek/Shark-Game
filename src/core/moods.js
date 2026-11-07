// Saved and shareable moods: a snapshot of the scene (city, time, weather, look, city life)
// stored locally or encoded into a link. Audio volumes and display settings are left out.
import { DEFAULTS, settings } from './settings.js';

const KEY = 'rainfall-avenue:moods:v1';
const EXCLUDE = new Set(['masterVol', 'musicVol', 'rainVol', 'thunderVol', 'trafficVol', 'peopleVol', 'windVol', 'ambienceVol', 'footstepsVol',
  'quality', 'fpsCap', 'resolutionScale', 'showFps', 'lookSensitivity', 'invertY', 'musicOn', 'showMinimap']);

export function snapshot() {
  const o = {};
  for (const k of Object.keys(DEFAULTS)) if (!EXCLUDE.has(k)) o[k] = settings.values[k];
  return o;
}
export function sanitize(o) {
  const out = {};
  if (!o || typeof o !== 'object') return out;
  for (const [k, v] of Object.entries(o)) {
    if (!(k in DEFAULTS) || EXCLUDE.has(k) || typeof v !== typeof DEFAULTS[k]) continue;
    if (typeof v === 'number' && !Number.isFinite(v)) continue;
    if (typeof v === 'string' && v.length > 40) continue;
    out[k] = v;
  }
  return out;
}
const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function shareLink(name = '') {
  // keep links short: only include values that differ from the defaults
  const snap = snapshot(), diff = {};
  for (const [k, v] of Object.entries(snap)) if (v !== DEFAULTS[k]) diff[k] = typeof v === 'number' ? Math.round(v * 1000) / 1000 : v;
  if (name) diff._n = name.slice(0, 40);
  const url = new URL(location.href);
  url.search = '';
  url.hash = 'mood=' + b64(JSON.stringify(diff));
  return url.toString();
}
export function readSharedMood() {
  const m = location.hash.match(/mood=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const raw = JSON.parse(unb64(m[1]));
    const name = typeof raw._n === 'string' ? raw._n : '';
    return { name, values: { ...Object.fromEntries(Object.entries(DEFAULTS).filter(([k]) => !EXCLUDE.has(k))), ...sanitize(raw) } };
  } catch { return { error: true }; }
}
export function listMoods() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}
function store(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; } }
export function saveMood(name) {
  const list = listMoods().filter((m) => m.name !== name);
  list.unshift({ name: name.slice(0, 40), values: snapshot(), at: Date.now() });
  return store(list.slice(0, 30));
}
export function deleteMood(name) { return store(listMoods().filter((m) => m.name !== name)); }
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch { return false; }
  }
}
