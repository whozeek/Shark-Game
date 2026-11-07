/* Network + tile lifecycle. Etiquette: no keys, no cookies (credentials:'omit', no referrer), at most 6 requests in flight, Retry-After honoured,
 * exponential back-off on 429/5xx, 3x3 ring around the player only (no prefetch of huge areas), in-memory LRU, aborts on leave. */
import { GW, TZ, EXT, setStatus, emit, tileOfLocal, ensureGraph } from './core.js';
import { decodeMVT, extractTile } from './data.js';
import { buildTileGroup, disposeGroup, rebuildBuildings } from './mesh.js';
import SAMPLE_B64 from './sample.b64';

export const NET = {
  tilejson: 'https://tiles.openfreemap.org/planet', elevBase: 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium',
  maxConcurrent: 6, template: null, mode: 'network', sample: null, requests: 0, retries: 0, bytesVector: 0, bytesElev: 0, nVector: 0, nElev: 0, errors: [], pauseUntil: 0,
};
const RING = 1, KEEP_RING = 1;     // 3x3 tiles resident, never more
let epoch = 0, active = 0; const queue = [], ctls = new Set();
const rawCache = new Map(), RAW_MAX = 30;       // LRU of tile bytes
const sleep = (ms, sig) => new Promise((res, rej) => { const t = setTimeout(res, ms); if (sig) sig.addEventListener('abort', () => { clearTimeout(t); rej({ aborted: true }) }, { once: true }) });

function pump() {
  while (active < NET.maxConcurrent && queue.length) {
    queue.sort((a, b) => a.prio - b.prio); const j = queue.shift(); active++;
    j.fn().then(j.resolve, j.reject).finally(() => { active--; pump() });
  }
}
function schedule(fn, prio) { return new Promise((resolve, reject) => { queue.push({ fn, prio, resolve, reject, epoch }); pump() }) }
export function abortAll() { epoch++; for (const c of ctls) c.abort(); ctls.clear(); while (queue.length) queue.pop().reject({ aborted: true }) }

async function getBytes(url, kind, ctl) {
  let lastErr = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (ctl.signal.aborted) throw { aborted: true };
    const wait = NET.pauseUntil - Date.now(); if (wait > 0) await sleep(wait, ctl.signal);
    try {
      NET.requests++;
      const res = await fetch(url, { signal: ctl.signal, mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (res.status === 404) return null;
      if (res.status === 429 || res.status >= 500) {
        const ra = parseFloat(res.headers.get('Retry-After')), ms = Math.min(30000, isNaN(ra) ? 800 * Math.pow(2, attempt) + Math.random() * 300 : ra * 1000);
        NET.pauseUntil = Date.now() + ms; NET.retries++; lastErr = new Error('HTTP ' + res.status); setStatus('The map server asked us to slow down (HTTP ' + res.status + '). Waiting ' + Math.round(ms / 1000) + ' s before retrying.', 'warn'); continue;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const b = await res.arrayBuffer(); if (kind === 'vector') { NET.bytesVector += b.byteLength; NET.nVector++ } else if (kind === 'elev') { NET.bytesElev += b.byteLength; NET.nElev++ } return b;
    } catch (e) {
      if (e && e.aborted || (e && e.name === 'AbortError')) throw { aborted: true };
      lastErr = e; NET.retries++; if (attempt < 3) await sleep(500 * Math.pow(2, attempt), ctl.signal);
    }
  }
  throw lastErr || new Error('network error');
}
function net(url, kind, prio) {
  return schedule(() => { const ctl = new AbortController(); ctls.add(ctl); return getBytes(url, kind, ctl).finally(() => ctls.delete(ctl)) }, prio);
}

let tplP = null;
function template() {   // one TileJSON request, shared (the versioned tile URL changes with every planet build)
  if (NET.template) return Promise.resolve(NET.template);
  if (tplP) return tplP;
  tplP = (async () => {
    const b = await net(NET.tilejson, 'json', -1); if (!b) throw new Error('TileJSON missing');
    const j = JSON.parse(new TextDecoder().decode(b)); if (!j.tiles || !j.tiles[0]) throw new Error('TileJSON has no tiles url');
    NET.template = j.tiles[0]; NET.attribution = j.attribution; NET.maxzoom = j.maxzoom; return NET.template;
  })().finally(() => { tplP = null });
  return tplP;
}

/* ---------- bundled sample (Bridgeport) ---------- */
export async function loadSample() {
  if (NET.sample) return NET.sample;
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot unpack the bundled sample');
  const bin = Uint8Array.from(atob(SAMPLE_B64), c => c.charCodeAt(0));
  const ds = new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate-raw')));
  const j = JSON.parse(await ds.text()), q = j.q || 1;
  for (const k in j.tiles) for (const l of Object.values(j.tiles[k].l)) for (const f of l) f.g = f.g.map(d => { const o = new Array(d.length); let x = 0, y = 0; for (let i = 0; i < d.length; i += 2) { x += d[i]; y += d[i + 1]; o[i] = x * q; o[i + 1] = y * q } return o });
  NET.sample = j; return j;
}
export function sampleCenter() { return NET.sample ? NET.sample.origin : { lat: 41.1865, lon: -73.1952 } }

/* ---------- elevation ---------- */
async function decodePng(bytes) {
  const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bmp, 0, 0); if (bmp.close) bmp.close();
  const d = g.getImageData(0, 0, 256, 256).data, h = new Float32Array(65536);
  for (let i = 0; i < 65536; i++)h[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768;
  return h;
}
function expandElev(s) {   // bundled sample: 128x128 int16 quarter-metres -> 256x256 metres (bilinear)
  const raw = Uint8Array.from(atob(s.d), c => c.charCodeAt(0)), n = s.n, v = new Int16Array(raw.buffer), h = new Float32Array(65536), at = (x, y) => v[Math.min(n - 1, Math.max(0, y)) * n + Math.min(n - 1, Math.max(0, x))] / 4;
  for (let y = 0; y < 256; y++)for (let x = 0; x < 256; x++) { const fx = (x - .5) / 2, fy = (y - .5) / 2, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy; h[y * 256 + x] = (at(ix, iy) * (1 - ax) + at(ix + 1, iy) * ax) * (1 - ay) + (at(ix, iy + 1) * (1 - ax) + at(ix + 1, iy + 1) * ax) * ay }
  return h;
}
const elevPending = new Map();
function getElev(ex, ey, prio) {
  const key = ex + ',' + ey, ez = GW.opts.ez; if (GW.elev.has(key)) return Promise.resolve(GW.elev.get(key));
  if (elevPending.has(key)) return elevPending.get(key);
  const p = (async () => {
    let h = null;
    try {
      if (NET.mode === 'sample') { const s = NET.sample.elev[key]; if (s) h = expandElev(s) }
      else { const b = await net(NET.elevBase + '/' + ez + '/' + ex + '/' + ey + '.png', 'elev', prio); if (b) h = await decodePng(b) }
    } catch (e) { if (e && e.aborted) throw e; GW.status.elevFailed = true }
    const rec = { h, x: ex, y: ey }; GW.elev.set(key, rec); return rec;
  })().finally(() => elevPending.delete(key));
  elevPending.set(key, p); return p;
}
function elevKeysFor(tx, ty) {
  const ez = GW.opts.ez, n = Math.pow(2, TZ), m = Math.pow(2, ez) * 256, x0 = Math.floor(tx / n * m - 2), x1 = Math.floor((tx + 1) / n * m + 2), y0 = Math.floor(ty / n * m - 2), y1 = Math.floor((ty + 1) / n * m + 2), out = [];
  for (let ex = x0 >> 8; ex <= x1 >> 8; ex++)for (let ey = y0 >> 8; ey <= y1 >> 8; ey++)out.push([ex, ey]);
  return out;
}

/* ---------- job pump (one mesh-building step per frame) ---------- */
const jobs = []; let idleWaiters = [];
export function pumpJobs(budgetMs = 7) {
  const t0 = performance.now();
  while (jobs.length && performance.now() - t0 < budgetMs) { const j = jobs.shift(); try { j() } catch (e) { console.error('geo job failed', e); NET.errors.push(String(e && e.message || e)) } }
  checkIdle();
}
function checkIdle() { if (!jobs.length && !queue.length && active === 0 && !GW._loading) { const w = idleWaiters; idleWaiters = []; w.forEach(f => f()) } }
export function whenIdle(timeout = 60000) {
  return new Promise(res => { const t = setTimeout(res, timeout); idleWaiters.push(() => { clearTimeout(t); res() }); (function tick() { pumpJobs(1000); checkIdle() })() });
}

/* ---------- vector tiles ---------- */
async function getVector(tx, ty, prio) {
  const key = tx + ',' + ty;
  if (NET.mode === 'sample') { const n = NET.sample.tiles[key]; return n ? { norm: n } : null }
  if (rawCache.has(key)) { const v = rawCache.get(key); rawCache.delete(key); rawCache.set(key, v); return { bytes: v } }
  const tpl = await template(), url = tpl.replace('{z}', TZ).replace('{x}', tx).replace('{y}', ty);
  const b = await net(url, 'vector', prio); if (!b) return { norm: { l: {} } };
  rawCache.set(key, b); while (rawCache.size > RAW_MAX) rawCache.delete(rawCache.keys().next().value);
  return { bytes: b };
}

function counts() { let n = 0, f = 0, p = 0; for (const r of recs.values()) { if (r.state === 'ready' || r.state === 'empty') n++; else if (r.state === 'failed') f++; else p++ } return { loaded: n, failed: f, pending: p } }
function refreshStatus() {
  const c = counts(), s = GW.status; Object.assign(s, c);
  const src = NET.mode === 'sample' ? 'bundled Bridgeport sample' : 'OpenFreeMap + AWS terrain tiles';
  s.source = NET.mode;
  if (c.failed && !c.loaded) { s.level = 'error'; s.text = 'Could not load map tiles (offline, or this page is not allowed to reach tiles.openfreemap.org). ' + (NET.lastError || '') }
  else if (c.pending) { s.level = 'ok'; s.text = 'Loading map tiles ' + c.loaded + '/' + (c.loaded + c.pending + c.failed) + ' (' + src + ')' }
  else { ensureGraph(); s.level = c.failed ? 'warn' : 'ok'; s.text = (NET.mode === 'sample' ? 'BUNDLED SAMPLE: Bridgeport (limited area, no network used)' : 'Map data loaded') + ' · ' + GW.buildings.length + ' buildings (' + GW.buildings.filter(b => b.approx).length + ' generated, approximate) · ' + GW.roads.ways.length + ' road segments' + (s.elevFailed ? ' · terrain unavailable, flat ground' : '') + (GW.omitted ? ' · ' + GW.omitted + ' small buildings left out of dense tiles' : '') + (c.failed ? ' · ' + c.failed + ' tile(s) failed' : '') }
  emit();
}

const recs = new Map(); let player = { x: 0, y: 0 };
export function tileRecords() { return recs }
async function loadRec(r) {
  GW._loading = (GW._loading || 0) + 1; refreshStatus();
  try {
    const prio = Math.abs(r.tx - r.cx) + Math.abs(r.ty - r.cy);
    const v = await getVector(r.tx, r.ty, prio);
    const ek = elevKeysFor(r.tx, r.ty);
    await Promise.all(ek.map(([x, y]) => getElev(x, y, prio)));
    if (r.dead) return;
    if (!v) { r.state = 'empty'; return }
    await new Promise(res => jobs.push(() => {
      if (r.dead) return res();
      const norm = v.norm || decodeMVT(v.bytes);
      jobs.unshift(() => {
        if (r.dead) return res();
        const T = extractTile(norm, r.tx, r.ty); Object.assign(r, T);
        jobs.unshift(() => {
          if (r.dead) return res();
          r.group = buildTileGroup(T, norm, r.tx, r.ty, player.x, player.y); r.bubble = T.bubble; if (GW.root) GW.root.add(r.group);
          GW.tiles.set(r.key, r); GW.omitted = [...GW.tiles.values()].reduce((a, t) => a + (t.omitted || 0), 0); GW.buildings = [...GW.tiles.values()].flatMap(t => t.buildings); GW.places = [...GW.tiles.values()].flatMap(t => t.places); GW.peaks = [...GW.tiles.values()].flatMap(t => t.peaks);
          r.state = 'ready'; GW._v++; res();
        });
      });
    }));
  } catch (e) {
    if (e && e.aborted) { r.state = 'aborted'; return }
    r.state = 'failed'; NET.lastError = String(e && e.message || e).slice(0, 120); NET.errors.push(NET.lastError);
  } finally { GW._loading--; refreshStatus(); checkIdle() }
}
function unloadRec(r) {
  r.dead = true; recs.delete(r.key);
  if (r.group) { if (GW.root) GW.root.remove(r.group); disposeGroup(r.group); r.group = null }
  if (GW.tiles.delete(r.key)) { GW.omitted = [...GW.tiles.values()].reduce((a, t) => a + (t.omitted || 0), 0); GW.buildings = [...GW.tiles.values()].flatMap(t => t.buildings); GW.places = [...GW.tiles.values()].flatMap(t => t.places); GW.peaks = [...GW.tiles.values()].flatMap(t => t.peaks); GW._v++ }
}
function pruneElev() {
  const need = new Set(); for (const r of recs.values()) for (const [x, y] of elevKeysFor(r.tx, r.ty)) need.add(x + ',' + y);
  for (const k of [...GW.elev.keys()]) if (!need.has(k)) GW.elev.delete(k);
}
/* call whenever the player moves: starts loading the 3x3 ring of z14 tiles around (x,y) local metres, drops tiles more than 2 tiles away */
export function updateAround(x, y) {
  player = { x, y }; const c = tileOfLocal(x, y), n = Math.pow(2, TZ);
  for (const r of [...recs.values()]) if (Math.max(Math.abs(r.tx - c.x), Math.abs(r.ty - c.y)) > KEEP_RING) unloadRec(r);
  let started = false;
  for (let dx = -RING; dx <= RING; dx++)for (let dy = -RING; dy <= RING; dy++) {
    const tx = c.x + dx, ty = c.y + dy, key = tx + ',' + ty; if (ty < 0 || ty >= n || recs.has(key)) continue;
    const r = { key, tx, ty, cx: c.x, cy: c.y, state: 'loading', dead: false }; recs.set(key, r); started = true; loadRec(r);
  }
  if (started) pruneElev();
  for (const r of recs.values()) if (r.state === 'ready' && r.bubble && !r.rebuilding && Math.hypot(r.bubble.x - x, r.bubble.y - y) > 130) { r.rebuilding = true; jobs.push(() => { r.rebuilding = false; if (!r.dead) { rebuildBuildings(r, player.x, player.y); GW._bv = (GW._bv || 0) + 1 } }) }
}
export function resetTiles() {
  abortAll(); for (const r of [...recs.values()]) unloadRec(r); recs.clear(); GW.elev.clear(); jobs.length = 0; GW.tiles.clear(); GW.buildings = []; GW.places = []; GW.peaks = []; GW.roads = { nodes: [], edges: [], ways: [] }; GW._v++; GW._loading = 0;
  GW.status.elevFailed = false; NET.lastError = '';
}
/* only used by tests to drop the cached vector bytes */
export function clearCache() { rawCache.clear() }
/* rebuild every loaded tile from the cached bytes (used when a setting that changes the generated data is toggled) */
export function reloadAll() { for (const r of [...recs.values()]) unloadRec(r); updateAround(player.x, player.y) }
