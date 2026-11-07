/* Rush Hour Routes: globe + streamed world explorer. Entry point (bundled to one IIFE by build.mjs and injected into rush-hour-routes.html).
 * Public API: window.GeoWorld (also window.__rhr.geo). See GEO_API.md. */
import * as C from './core.js';
import { GW } from './core.js';
import { NET, whenIdle, pumpJobs, tileRecords, loadSample, abortAll, resetTiles, reloadAll } from './tiles.js';
import { createGlobe, PLACES, countryAt, nearestPlace, hav } from './globe.js';
import { createWorld } from './world.js';

const BRIDGEPORT = { lat: 41.1865, lon: -73.1952 };
const ATTR_HTML = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> (ODbL) &middot; <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &middot; Terrain: Mapzen / AWS Terrain Tiles (SRTM, 3DEP, GMTED, ETOPO1) &middot; Natural Earth (public domain)';
const CSS = `
#geo{position:fixed;inset:0;z-index:120;background:#050b18;color:#fff;font-family:var(--font-body,system-ui,sans-serif);overflow:hidden;-webkit-user-select:none;user-select:none}
#geo[hidden]{display:none}
#geo canvas#geocv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none}
#geo canvas#geocv:focus-visible{box-shadow:inset 0 0 0 3px #7fc0ff}
#geoLabels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
#geoLabels .gl{position:absolute;left:0;top:0;border:0;background:none;color:#fff;font:600 12px/16px var(--font-body,system-ui,sans-serif);padding:0 0 0 12px;margin:-8px 0 0 -6px;white-space:nowrap;text-shadow:0 0 3px #000,0 0 6px #000,0 1px 2px #000;pointer-events:none;will-change:transform}
#geoLabels .gl-city{min-height:24px;min-width:24px}
#geoLabels .gl-city::before{content:"";position:absolute;left:1px;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;background:#ffd24a;box-shadow:0 0 0 1px #000}
#geoLabels .gl-city.cap::before{background:#fff;border-radius:1px;transform:rotate(45deg)}
#geoLabels .gl-ocean{color:#a9d3ff;font-style:italic;font-weight:500;letter-spacing:.1em;opacity:.8}
#geoLabels .gl-cont{letter-spacing:.2em;font-size:12px;opacity:.78;color:#fff7c8}
#geoLabels .gl-country{font-size:11px;font-weight:600;color:#fff;opacity:.85;letter-spacing:.02em}
#geoLabels .gl-ocean::before,#geoLabels .gl-cont::before,#geoLabels .gl-country::before{display:none}
#geoLabels .gl-ocean,#geoLabels .gl-cont,#geoLabels .gl-country{padding-left:0;transform-origin:left}
.geo-btn{font:800 15px/1 var(--font-display,system-ui,sans-serif);min-height:44px;min-width:44px;padding:0 16px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:rgba(18,30,56,.82);color:#fff;cursor:pointer;backdrop-filter:blur(6px)}
.geo-btn:hover{background:rgba(40,70,120,.9)}.geo-btn:focus-visible,#geo input:focus-visible,#geo a:focus-visible,#geo button:focus-visible{outline:3px solid #7fc0ff;outline-offset:2px}
.geo-btn.pri{background:#1c68c9;border-color:#6fb0ff}.geo-btn.on{background:#1f7a42;border-color:#7be0a0}.geo-btn[disabled]{opacity:.5;cursor:default}
.geo-top{position:absolute;left:10px;top:10px;right:10px;display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;pointer-events:none}.geo-top>*{pointer-events:auto}
.geo-panel{background:rgba(10,20,42,.84);border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:10px 12px;backdrop-filter:blur(8px);font-size:14px;line-height:1.35}
#geoSide{position:absolute;left:10px;top:64px;width:min(330px,calc(100% - 20px));display:flex;flex-direction:column;gap:8px;max-height:calc(100% - 140px);overflow:auto}
#geoSide h2{margin:0 0 4px;font:800 17px var(--font-display,system-ui,sans-serif)}
#geoGo{width:100%;box-sizing:border-box;height:44px;border-radius:10px;border:1px solid #6b88b8;background:#0b1a36;color:#fff;padding:0 12px;font-size:16px;user-select:text;-webkit-user-select:text}
#geoGoList{list-style:none;margin:4px 0 0;padding:0;max-height:210px;overflow:auto}
#geoGoList li button{width:100%;text-align:left;min-height:44px;border:0;background:transparent;color:#fff;font-size:15px;padding:4px 8px;border-radius:8px;cursor:pointer}
#geoGoList li button:hover,#geoGoList li button[aria-selected=true]{background:rgba(80,130,220,.45)}
.geo-quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.geo-quick .geo-btn{min-height:40px;font-size:13px;padding:0 10px}
#geoCross{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;pointer-events:none;opacity:.8}
#geoCross::before,#geoCross::after{content:"";position:absolute;background:#fff;box-shadow:0 0 2px #000}#geoCross::before{left:12px;top:0;width:2px;height:26px}#geoCross::after{top:12px;left:0;height:2px;width:26px}
#geoCross{mix-blend-mode:normal}#geoCross i{position:absolute;left:9px;top:9px;width:8px;height:8px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 2px #000}
#geoAttr{position:absolute;left:0;right:0;bottom:0;padding:5px 10px;background:rgba(6,12,26,.82);font-size:11.5px;line-height:1.4;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#geoAttr a{color:#9fd0ff}#geoAttr .grow{flex:1;min-width:200px}#geoAttr button{min-height:32px;min-width:44px;font-size:12px;padding:0 10px}
#geoStatus{font-size:12.5px;padding:6px 10px;border-radius:10px;background:rgba(10,20,42,.85);border:1px solid rgba(255,255,255,.2);max-width:min(560px,100%)}
#geoStatus.warn{border-color:#f2b632;color:#ffe6a8}#geoStatus.error{border-color:#ff6b5c;color:#ffd2cc}
#geoWorldUI{position:absolute;inset:0;pointer-events:none}#geoWorldUI>*{pointer-events:auto}
#geoHud{position:absolute;left:10px;top:64px;width:min(340px,calc(100% - 20px))}
#geoHud .row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#geoHud .row .geo-btn{min-height:40px;font-size:13px;padding:0 10px;flex:1 1 auto}
#geoMini{position:absolute;right:10px;bottom:46px;width:150px;height:150px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 10px #0008;background:#dfe9d2}
#geoJoy{position:absolute;left:18px;bottom:62px;width:118px;height:118px;border-radius:50%;background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.5);touch-action:none;display:none}
#geo.touch #geoJoy{display:block}#geoJoy i{position:absolute;left:39px;top:39px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.8)}
#geo.touch #geoKeys{display:none}
#geoModal{position:absolute;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;padding:12px;z-index:5}#geoModal[hidden]{display:none}
#geoModal .card{background:#fff;color:#1b2733;border-radius:16px;max-width:760px;width:100%;max-height:92%;overflow:auto;padding:18px 20px;font-size:14px;line-height:1.5;user-select:text;-webkit-user-select:text}
#geoModal h2{margin:0 0 6px;font:800 22px var(--font-display,system-ui,sans-serif)}#geoModal h3{margin:14px 0 4px;font:800 16px var(--font-display,system-ui,sans-serif)}#geoModal a{color:#1c68c9}
#geoModal table{border-collapse:collapse;width:100%;font-size:13px}#geoModal td,#geoModal th{border-top:1px solid #d7e0e6;padding:5px 6px;vertical-align:top;text-align:left}
#geoModal .btnrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#geoModal .geo-btn{color:#fff}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:620px){#geoSide{max-height:46%}#geoMini{width:110px;height:110px;bottom:70px}#geoAttr{font-size:10.5px}#geoHud{top:58px}}
`;

const CREDITS_HTML = `
<h2>Credits, licences and limits</h2>
<p><b>Honest summary.</b> Streets, buildings and terrain in the explorer are generated from open data. Where the data has gaps, the game fills them with <b>procedural approximations</b> (buildings along streets drawn in lighter, plainer colours and flagged <code>approx</code> in the data). <b>No street or building is guaranteed to look exactly like the real place</b>, heights are often estimated, and the terrain is smoothed (tens of metres per sample). The game never uses Google Maps or Google Earth data or imagery.</p>
<table>
<tr><th>Data</th><th>Source and licence</th><th>What the game does with it</th></tr>
<tr><td>Streets, buildings, water, parks, place names</td><td><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">&copy; OpenStreetMap contributors</a>, <b>Open Database Licence (ODbL) 1.0</b>. The data is available under the ODbL; attribution is required.</td><td>Read at run time as vector tiles. Nothing is redistributed except a tiny bundled Bridgeport sample (which carries the same notice).</td></tr>
<tr><td>Vector tiles</td><td><a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> (donation-funded public instance, no key, no sign-up), schema <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">&copy; OpenMapTiles</a>, data from OpenStreetMap. Credit asked: &quot;OpenFreeMap &copy; OpenMapTiles Data from OpenStreetMap&quot;.</td><td>Your browser downloads about nine tiles (roughly 0.1 to 0.7 MB each) directly from <code>tiles.openfreemap.org</code>. Free, no promise of availability: if the service is down or blocked, only the bundled sample works.</td></tr>
<tr><td>Terrain height</td><td><a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener noreferrer">Mapzen / Tilezen Terrain Tiles</a> on AWS Open Data: SRTM, 3DEP (NED), GMTED2010, ETOPO1 and regional sources. SRTM, 3DEP and GMTED data courtesy of the U.S. Geological Survey; ETOPO1 U.S. NOAA (not for navigation).</td><td>Terrarium PNG tiles (zoom 12, about 20 to 35 m per sample before smoothing). Sea-floor depths are not modelled (water is flat).</td></tr>
<tr><td>Globe: countries, coastlines, cities</td><td><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a> (public domain), 1:50m countries via the <i>world-atlas</i> package (ISC licence) and 1:50m populated places. Natural Earth draws de facto boundaries.</td><td>Bundled inside the game (about 190 KB), so the globe works offline. <b>Borders shown are not a statement about disputed territory</b>; they follow Natural Earth&#39;s de facto lines.</td></tr>
<tr><td>Code</td><td><i>pbf</i> (BSD-3-Clause), <i>@mapbox/vector-tile</i> (BSD-3-Clause), <i>topojson-client</i> (ISC), three.js (MIT).</td><td>Bundled in this file.</td></tr>
</table>
<h3>Limits, costs and privacy</h3>
<ul><li><b>Cost to you and to the game: none.</b> No account, key, billing or paid service is used. OpenFreeMap is run on donations, please consider <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">supporting it</a>. The OpenStreetMap servers and the public Overpass API are <i>not</i> used.</li>
<li>The game asks for at most 6 tiles at a time, only the 3 by 3 tiles around you, honours Retry-After and backs off on errors; no cookies are sent.</li>
<li>Your browser contacts <code>tiles.openfreemap.org</code> and <code>elevation-tiles-prod.s3.amazonaws.com</code>. They can see your IP address and which map tiles you ask for (roughly where on Earth you are exploring). Nothing else is sent.</li>
<li>OpenStreetMap coverage differs by country: some areas have few buildings or heights, some have none. Elevation is global, coarser in some regions.</li>
<li>If the network is blocked or you are offline, the globe still works, the world falls back to the <b>bundled sample of part of Bridgeport, Connecticut</b>, clearly labelled.</li>
<li>If you publish a database derived from OpenStreetMap data, the ODbL share-alike and attribution rules apply to that database.</li></ul>
<div class="btnrow"><button class="geo-btn pri" data-geo="closemodal" style="background:#1c68c9">Close</button></div>`;

const state = { open: false, mode: 'globe', raf: 0 };
let root, cv, renderer, globe, world, gkeys = {}, last = 0, lastR = 0, selInfo = null, liveEl, pointers = new Map(), drag = null, modalOpen = false;
const rhr = () => window.__rhr || {};
const prof = () => { try { return rhr().P && rhr().P() || {} } catch (e) { return {} } };
const saver = () => { const g = prof().gfx; return g === 'saver' || g === 'light' || !!(navigator.connection && navigator.connection.saveData) };
const rm = () => { try { return !!(rhr().ui && rhr().ui.rm) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) } catch (e) { return false } };
const $ = s => root.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtLL = (lat, lon) => Math.abs(lat).toFixed(3) + '°' + (lat >= 0 ? 'N' : 'S') + ' ' + Math.abs(lon).toFixed(3) + '°' + (lon >= 0 ? 'E' : 'W');
function say(t) { if (liveEl) liveEl.textContent = t }

function build() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  root = document.createElement('div'); root.id = 'geo'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Explore the world: globe');
  root.innerHTML = `
<canvas id="geocv" tabindex="0" role="application" aria-label="Globe. Arrow keys or WASD rotate, plus and minus zoom, Enter picks the place under the crosshair, Escape goes back." aria-describedby="geoHint"></canvas>
<div id="geoLabels" aria-hidden="true"></div><div id="geoCross" aria-hidden="true"><i></i></div>
<div class="sr" id="geoHint">Drag or use arrow keys to turn the globe, scroll or plus and minus to zoom, click or press Enter to choose a place, then Explore here. You can also use the Go to box.</div>
<div class="sr" id="geoLive" aria-live="polite"></div>
<div class="geo-top"><button class="geo-btn" data-geo="back" aria-label="Back (Escape)">&larr; Back</button><div id="geoStatus" role="status" hidden></div></div>
<div id="geoSide" class="">
 <div class="geo-panel" id="geoGoBox"><h2>Explore the world</h2><label for="geoGo" class="sr">Go to a city or latitude, longitude</label>
  <input id="geoGo" type="text" role="combobox" aria-expanded="false" aria-controls="geoGoList" aria-autocomplete="list" autocomplete="off" placeholder="Go to a city, or 41.18, -73.20" />
  <ul id="geoGoList" role="listbox" aria-label="Matching places"></ul>
  <div class="geo-quick" id="geoQuick"></div></div>
 <div class="geo-panel" id="geoSel"><b>Pick a place.</b> Drag the globe, then click, tap or press Enter on the crosshair.</div>
</div>
<div id="geoWorldUI" hidden>
 <div class="geo-panel" id="geoHud"><div id="geoHudT"><b>Exploring</b></div><button class="geo-btn" data-geo="hudtoggle" id="geoHudTog" aria-expanded="true" style="min-height:34px;font-size:12px;margin-top:6px">Hide controls</button><div id="geoHudBody">
  <div class="row" role="group" aria-label="Move as"><button class="geo-btn" data-geo="mode" data-m="walk" aria-pressed="true">Walk</button><button class="geo-btn" data-geo="mode" data-m="drive" aria-pressed="false">Drive</button><button class="geo-btn" data-geo="mode" data-m="fly" aria-pressed="false">Fly</button></div>
  <div class="row"><button class="geo-btn" data-geo="toroad">Put me on a road</button><button class="geo-btn" data-geo="proc" aria-pressed="true">Approximate buildings: on</button></div>
  <div class="row"><button class="geo-btn pri" data-geo="bus">Start a bus game here</button></div><div id="geoKeys" style="font-size:11.5px;opacity:.8;margin-top:8px">WASD / arrows move, Shift faster, Q E sidestep, drag to look, wheel zoom, 1 2 3 Walk Drive Fly (R F height), B bus game, Esc back</div></div></div>
 <canvas id="geoMini" width="150" height="150" role="img" aria-label="Minimap, north up"></canvas>
 <div id="geoJoy" aria-label="Move stick"><i></i></div>
</div>
<div id="geoAttr"><span class="grow" id="geoAttrT">${ATTR_HTML}</span><span id="geoDisp" class="sr"></span><button class="geo-btn" data-geo="credits">Credits &amp; limits</button></div>
<div id="geoModal" hidden role="dialog" aria-modal="true" aria-label="Credits and limits"><div class="card" tabindex="-1"></div></div>`;
  document.body.appendChild(root);
  cv = $('#geocv'); liveEl = $('#geoLive');
  $('#geoDisp').outerHTML = '<span style="opacity:.8" id="geoDisp">Borders: Natural Earth de facto lines, not a statement on disputed territory. Map is generated from open data and approximate.</span>';
  const q = $('#geoQuick');
  for (const [n, lat, lon, z] of [['Bridgeport, CT', 41.1865, -73.1952], ['New York', 40.758, -73.9855], ['Paris', 48.8584, 2.2945], ['Nairobi', -1.2921, 36.8219], ['Kathmandu', 27.7172, 85.324], ['Mount Everest area', 27.9881, 86.925], ['Grand Canyon', 36.1, -112.11], ['Tokyo', 35.6762, 139.6503]]) {
    const b = document.createElement('button'); b.className = 'geo-btn'; b.type = 'button'; b.textContent = n; b.onclick = () => chooseSpot(lat, lon, n, true); q.appendChild(b);
  }
  if (window.matchMedia && matchMedia('(pointer:coarse)').matches) root.classList.add('touch');
  wire();
}

function ensureRenderer() {
  if (renderer) return true;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !saver(), powerPreference: 'low-power', alpha: false });
  } catch (e) { renderer = null; $('#geoSel').innerHTML = '<b>3D graphics are not available</b> in this browser, so the globe cannot be drawn. You can still use the Go to box and the lists, but the explorer needs WebGL.'; return false }
  renderer.setClearColor(0x050b18, 1);
  const env = { labels: $('#geoLabels'), saver, rm, w: 1, h: 1 };
  globe = createGlobe(env); globe._env = env;
  world = createWorld({ saver, rm, modeChanged: m => { root.querySelectorAll('[data-geo=mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m))) } });
  GeoWorld.globe = globe; GeoWorld.world = world;
  size(); return true;
}
function size() {
  if (!renderer) return; const r = root.getBoundingClientRect(), w = Math.max(200, r.width | 0), h = Math.max(200, r.height | 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, saver() ? 1 : 1.75)); renderer.setSize(w, h, false);
  globe.resize(w, h); world.resize(w, h);
}

/* ------------------------------ globe selection ------------------------------ */
function describe(lat, lon, name) {
  const c = countryAt(lat, lon), n = nearestPlace(lat, lon);
  return { lat, lon, name: name || null, country: c, near: n.place, km: n.km };
}
function renderSel() {
  const s = selInfo, el = $('#geoSel');
  if (!s) { el.innerHTML = '<b>Pick a place.</b> Drag the globe, then click, tap or press Enter on the crosshair.'; return }
  const title = s.name || (s.country ? s.country : 'Open water or unlabelled land');
  el.innerHTML = '<b>' + esc(title) + '</b>' + (s.name && s.country ? ' <span style="opacity:.8">&middot; ' + esc(s.country) + '</span>' : '') + '<br><span>' + fmtLL(s.lat, s.lon) + '</span><br><span style="opacity:.85">Nearest listed place: ' + esc(s.near.name) + (s.near.iso ? ', ' + esc(s.near.iso) : '') + ' (' + (s.km < 1 ? 'under 1' : Math.round(s.km)) + ' km)</span>'
    + '<div class="geo-quick"><button class="geo-btn pri" data-geo="explore" id="geoExplore">Explore here (Enter)</button><button class="geo-btn" data-geo="clear">Clear</button></div>'
    + '<div style="font-size:12px;opacity:.8;margin-top:6px">The area is generated from OpenStreetMap and terrain data when you arrive. It is an approximation, not an exact copy of the real place.</div>';
  say('Selected ' + title + ', ' + fmtLL(s.lat, s.lon));
}
function chooseSpot(lat, lon, name, fly) {
  selInfo = describe(lat, lon, name); globe.setSel(lat, lon); renderSel();
  if (fly) globe.flyTo(lat, lon, Math.min(globe.view.d, 1.9), 900);
}
function pickAt(sx, sy) {
  // a city label under the pointer wins; otherwise the point on the sphere
  const p = globe.pick(sx, sy); if (!p) return;
  let best = null, bd = 22;
  for (const pl of PLACES) { const q = globe.project(pl.lat, pl.lon); if (!q.front) continue; const d = Math.hypot(q.x - sx, q.y - sy); if (d < bd && pl.pop >= minPopForPick()) { bd = d; best = pl } }
  if (best) chooseSpot(best.lat, best.lon, best.name, false); else chooseSpot(p.lat, p.lon, null, false);
}
function minPopForPick() { const d = globe.view.d; return d > 4.2 ? 6e6 : d > 3.2 ? 3e6 : d > 2.5 ? 1.5e6 : d > 1.9 ? 6e5 : d > 1.5 ? 2.5e5 : d > 1.25 ? 9e4 : d > 1.1 ? 3e4 : 0 }
function centerPick() { const p = globe.pick(globe._env.w / 2, globe._env.h / 2); if (p) pickAt(globe._env.w / 2, globe._env.h / 2) }

/* "Go to" box */
function goSearch(q) {
  q = q.trim(); const list = $('#geoGoList'); list.innerHTML = '';
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(q);
  let items = [];
  if (m && Math.abs(+m[1]) <= 90 && Math.abs(+m[2]) <= 180) items.push({ t: 'Go to ' + (+m[1]).toFixed(4) + ', ' + (+m[2]).toFixed(4), lat: +m[1], lon: +m[2], name: null });
  else if (q.length) { const ql = q.toLowerCase(); items = PLACES.filter(p => p.name.toLowerCase().startsWith(ql)).concat(PLACES.filter(p => !p.name.toLowerCase().startsWith(ql) && p.name.toLowerCase().includes(ql))).sort((a, b) => b.pop - a.pop).slice(0, 8).map(p => ({ t: p.name + (p.iso ? ', ' + p.iso : '') + ' (' + (p.pop >= 1e6 ? (p.pop / 1e6).toFixed(1) + 'M' : Math.round(p.pop / 1000) + 'k') + ')', lat: p.lat, lon: p.lon, name: p.name })) }
  else items = PLACES.slice().sort((a, b) => b.pop - a.pop).slice(0, 6).map(p => ({ t: p.name + (p.iso ? ', ' + p.iso : ''), lat: p.lat, lon: p.lon, name: p.name }));
  items.forEach((it, i) => { const li = document.createElement('li'); li.setAttribute('role', 'presentation'); const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'option'); b.id = 'geoOpt' + i; b.setAttribute('aria-selected', i === 0 ? 'true' : 'false'); b.textContent = it.t; b.onclick = () => { chooseSpot(it.lat, it.lon, it.name, true); $('#geoGo').value = it.name || ''; list.innerHTML = ''; $('#geoGo').setAttribute('aria-expanded', 'false'); cv.focus() }; li.appendChild(b); list.appendChild(li) });
  $('#geoGo').setAttribute('aria-expanded', items.length ? 'true' : 'false');
}

/* ------------------------------ diving into the world ------------------------------ */
async function dive(lat, lon, name, sample) {
  if (state.busy) return; state.busy = true;
  const go = async () => {
    state.mode = 'world'; root.querySelector('#geoSide').hidden = true; $('#geoCross').style.display = 'none'; $('#geoWorldUI').hidden = false; $('#geoLabels').style.display = 'none';
    if (root.getBoundingClientRect().width < 620) { $('#geoHudBody').hidden = true; $('#geoHudTog').textContent = 'Show controls'; $('#geoHudTog').setAttribute('aria-expanded', 'false') } else { $('#geoHudBody').hidden = false; $('#geoHudTog').textContent = 'Hide controls' }
    root.setAttribute('aria-label', 'World explorer'); cv.setAttribute('aria-label', 'World view. W A S D or arrow keys move, Shift is faster, 1 2 3 switch walk drive fly, Escape returns to the globe.');
    showStatus(); say('Loading ' + (name || fmtLL(lat, lon)) + '. This is a generated approximation of the area.');
    const r = await world.enter(lat, lon, { name, sample });
    state.busy = false;
    if (!r.ok) { offlineCard(lat, lon, name, sample) } else { cv.focus(); hudUpdate(true); say('Ready. ' + GW.status.text) }
  };
  if (sample) { await go(); return }
  globe.flyTo(lat, lon, 1.012, 1500, go);
  if (rm()) { /* flyTo ran done synchronously */ }
}
function offlineCard(lat, lon, name, wasSample) {
  const near = hav(lat, lon, BRIDGEPORT.lat, BRIDGEPORT.lon) < 20;
  if (!wasSample && near) { say('Map tiles could not be loaded. Opening the bundled Bridgeport sample instead.'); state.busy = false; dive(lat, lon, 'Bridgeport (bundled sample)', true).then(() => { GW.status.text = 'Could not reach the map servers, so this is the BUNDLED SAMPLE of part of Bridgeport (not live data). ' + GW.status.text; C.emit() }); return }
  const m = $('#geoModal'); m.hidden = false; modalOpen = true;
  m.querySelector('.card').innerHTML = '<h2>Map data could not be loaded</h2><p>The game could not download map tiles' + (name ? ' for <b>' + esc(name) + '</b>' : '') + '. You may be offline, or this page may not be allowed to contact <code>tiles.openfreemap.org</code> and <code>elevation-tiles-prod.s3.amazonaws.com</code> (some sandboxes block outside hosts). ' + esc(NET.lastError || '') + '</p><p>The globe works offline. A small <b>bundled sample of part of Bridgeport, Connecticut</b> is built into the game, so you can still try the explorer there. It is clearly labelled and is not live data.</p>'
    + '<div class="btnrow"><button class="geo-btn pri" style="background:#1c68c9" data-geo="usesample">Open the bundled Bridgeport sample</button><button class="geo-btn" style="background:#4a5a72" data-geo="retry">Try again</button><button class="geo-btn" style="background:#4a5a72" data-geo="toglobe">Back to the globe</button></div>';
  state.retry = { lat, lon, name }; m.querySelector('button').focus();
}
function toGlobe() {
  world.leave(); state.mode = 'globe'; state.busy = false; $('#geoWorldUI').hidden = true; $('#geoSide').hidden = false; $('#geoCross').style.display = ''; $('#geoLabels').style.display = ''; $('#geoStatus').hidden = true;
  root.setAttribute('aria-label', 'Explore the world: globe'); cv.setAttribute('aria-label', 'Globe. Arrow keys or WASD rotate, plus and minus zoom, Enter picks the place under the crosshair, Escape goes back.');
  closeModal(); if (selInfo) globe.flyTo(selInfo.lat, selInfo.lon, 1.6, 700); cv.focus(); say('Back at the globe');
}
function showStatus() { $('#geoStatus').hidden = false; statusUpdate() }
function statusUpdate() { const s = GW.status, el = $('#geoStatus'); if (el.textContent !== s.text) el.textContent = s.text; el.className = s.level === 'ok' ? '' : s.level }
let hudT = 0;
function hudUpdate(force) {
  const now = performance.now(); if (!force && now - hudT < 250) return; hudT = now; const i = world.hudInfo();
  $('#geoHudT').innerHTML = '<b>' + esc(GW.sampleMode ? 'Bundled sample: Bridgeport' : (i.place || GW.name || 'Exploring')) + '</b><br><span style="font-size:12.5px">' + fmtLL(i.lat, i.lon) + ' &middot; ' + Math.round(i.ele) + ' m above sea level' + (i.road ? '<br>On/near: ' + esc(i.road) : '') + '</span>';
  statusUpdate();
}

/* ------------------------------ bridge to the bus game ------------------------------ */
function startBus() {
  const r = world.bridge(1250);
  if (!r) { const t = rhr().toast; GW.status.text = 'Not enough mapped roads around you for a bus game. Move to a town or city.'; GW.status.level = 'warn'; statusUpdate(); say(GW.status.text); return false }
  const ll = C.toLonLat(world.P.x, world.P.y);
  if (!rhr().geoStart) return false;
  closeAll(); rhr().geoStart(r.ff, (GW.name || 'Mapped area') + (GW.sampleMode ? ' (sample)' : ''), [ll.lat, ll.lon]); return r.stats;
}

/* ------------------------------ modal ------------------------------ */
function openCredits() { const m = $('#geoModal'); m.hidden = false; modalOpen = true; m.querySelector('.card').innerHTML = CREDITS_HTML; m.querySelector('.card').scrollTop = 0; m.querySelector('button').focus() }
function closeModal() { const m = $('#geoModal'); m.hidden = true; modalOpen = false; cv.focus() }

/* ------------------------------ input ------------------------------ */
function wire() {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-geo]'); if (b) {
      const a = b.dataset.geo;
      if (a === 'back') { state.mode === 'world' ? toGlobe() : close() }
      else if (a === 'credits') openCredits(); else if (a === 'closemodal') closeModal();
      else if (a === 'explore' && selInfo) dive(selInfo.lat, selInfo.lon, selInfo.name || (selInfo.near && selInfo.km < 25 ? selInfo.near.name : null));
      else if (a === 'clear') { selInfo = null; globe.setSel(null); renderSel() }
      else if (a === 'mode') world.setMode(b.dataset.m);
      else if (a === 'hudtoggle') { const body = $('#geoHudBody'), h = !body.hidden; body.hidden = h; b.textContent = h ? 'Show controls' : 'Hide controls'; b.setAttribute('aria-expanded', String(!h)) }
      else if (a === 'toroad') { world.toRoad() }
      else if (a === 'proc') { GW.opts.proceduralFill = !GW.opts.proceduralFill; b.setAttribute('aria-pressed', String(GW.opts.proceduralFill)); b.textContent = 'Approximate buildings: ' + (GW.opts.proceduralFill ? 'on' : 'off'); reloadAll() }
      else if (a === 'bus') startBus();
      else if (a === 'usesample') { closeModal(); state.busy = false; dive(0, 0, 'Bridgeport (bundled sample)', true) }
      else if (a === 'retry') { closeModal(); state.busy = false; const r = state.retry; dive(r.lat, r.lon, r.name) }
      else if (a === 'toglobe') { toGlobe() }
      return;
    }
    const lbl = e.target.closest('.gl-city'); if (lbl && lbl._L) { chooseSpot(lbl._L.lat, lbl._L.lon, lbl._L.t, false); cv.focus() }
  });
  const goi = $('#geoGo');
  goi.addEventListener('input', () => goSearch(goi.value)); goi.addEventListener('focus', () => { if (!goi.value) goSearch('') });
  goi.addEventListener('keydown', e => {
    const list = $('#geoGoList'), opts = [...list.querySelectorAll('button')], cur = opts.findIndex(b => b.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!opts.length) return; const n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length; opts.forEach((b, i) => b.setAttribute('aria-selected', String(i === n))); goi.setAttribute('aria-activedescendant', opts[n].id); opts[n].scrollIntoView({ block: 'nearest' }) }
    else if (e.key === 'Enter') { e.preventDefault(); const o = opts[Math.max(0, cur)]; if (o) o.click() }
    else if (e.key === 'Escape') { if (list.children.length) { list.innerHTML = ''; goi.setAttribute('aria-expanded', 'false'); e.stopPropagation() } else { cv.focus(); e.stopPropagation() } }
  });
  // pointer: drag / pinch / click
  cv.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') root.classList.add('touch'); cv.focus(); try { cv.setPointerCapture(e.pointerId) } catch (x) { } pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, d0: pinchDist() }; if (state.mode === 'globe') { globe.vel.lat = globe.vel.lon = 0 } });
  cv.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (drag) drag.moved += Math.abs(dx) + Math.abs(dy);
    if (pointers.size >= 2) { const d = pinchDist(); if (drag && drag.d0 && d) { const f = drag.d0 / d; state.mode === 'globe' ? globe.view.d = 1 + (globe.view.d - 1) * f : world.zoom(f); drag.d0 = d } return }
    if (state.mode === 'globe') {
      if (globe.isFlying()) return; const k = globe.pxToDeg(), lc = Math.max(.2, Math.cos(globe.view.lat * Math.PI / 180));
      const now = performance.now(), dtm = Math.max(8, now - (drag.lt || now - 16)); drag.lt = now; globe.view.lon -= dx * k / lc; globe.view.lat += dy * k; const cap = v => Math.max(-120, Math.min(120, v)); globe.vel.lon = cap(globe.vel.lon * .4 + (-dx * k / lc / (dtm / 1000)) * .6); globe.vel.lat = cap(globe.vel.lat * .4 + (dy * k / (dtm / 1000)) * .6); drag.lastMove = now; globe.place();
    } else world.look(dx, dy);
  });
  const up = e => { const was = pointers.size === 1 && drag; if (drag && performance.now() - (drag.lastMove || 0) > 90 && globe) { globe.vel.lon = globe.vel.lat = 0 } pointers.delete(e.pointerId); if (was && drag.moved < 6 && performance.now() - drag.t < 600 && state.mode === 'globe' && e.type === 'pointerup') { const r = cv.getBoundingClientRect(); pickAt(e.clientX - r.left, e.clientY - r.top) } if (!pointers.size) drag = null };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('dblclick', e => { if (state.mode === 'globe' && selInfo) dive(selInfo.lat, selInfo.lon, selInfo.name) });
  cv.addEventListener('wheel', e => { e.preventDefault(); const f = Math.exp(Math.max(-60, Math.min(60, e.deltaY)) * .0016); if (state.mode === 'globe') { globe.view.d = 1 + (globe.view.d - 1) * f; globe.place() } else world.zoom(f) }, { passive: false });
  // joystick
  const joy = $('#geoJoy'), knob = joy.querySelector('i');
  const jm = e => { const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let x = (e.clientX - cx) / (r.width / 2), y = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l } world.joy.x = Math.abs(x) < .12 ? 0 : x; world.joy.y = Math.abs(y) < .12 ? 0 : y; knob.style.transform = 'translate(' + x * 36 + 'px,' + y * 36 + 'px)' };
  joy.addEventListener('pointerdown', e => { joy.setPointerCapture(e.pointerId); jm(e); e.preventDefault() }); joy.addEventListener('pointermove', e => { if (joy.hasPointerCapture(e.pointerId)) jm(e) });
  const jend = e => { world.joy.x = world.joy.y = 0; knob.style.transform = '' }; joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);
  // keys typed inside the overlay never reach the game's own shortcuts (its Tab trap and Escape handler would otherwise hijack them)
  root.addEventListener('keydown', e => { onKey(e); e.stopPropagation() }); root.addEventListener('keyup', e => { onKeyUp(e); e.stopPropagation() });
  window.addEventListener('keydown', e => { if (state.open && (e.target === document.body || e.target === document.documentElement)) { onKey(e); e.stopPropagation() } }, true);
  window.addEventListener('keyup', e => { if (state.open && (e.target === document.body || e.target === document.documentElement)) { onKeyUp(e); e.stopPropagation() } }, true);
  window.addEventListener('resize', () => { if (state.open) size() });
  window.addEventListener('blur', () => { gkeys = {}; if (world) { for (const k in world.keys) world.keys[k] = false } });
}
function pinchDist() { const a = [...pointers.values()]; return a.length >= 2 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0 }
const KMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'a', d: 'd', w: 'w', s: 's', q: 'q', e: 'e', r: 'r', f: 'f', PageUp: 'pageup', PageDown: 'pagedown' };
function onKey(e) {
  if (!state.open) return;
  const tgt = e.target, typing = tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA');
  if (e.key === 'Escape') { e.preventDefault(); if (modalOpen) closeModal(); else if (state.mode === 'world') toGlobe(); else close(); return }
  if (typing || modalOpen) return
  if (!root.contains(tgt) && tgt !== document.body) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (state.mode === 'globe') {
    const m = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', '+': 'zin', '=': 'zin', '-': 'zout', _: 'zout' }[k];
    if (m) { gkeys[m] = true; e.preventDefault(); e.stopPropagation() }
    else if (k === 'Enter' && (tgt === cv || tgt === document.body)) { e.preventDefault(); e.stopPropagation(); if (selInfo && globe.pick(globe._env.w / 2, globe._env.h / 2) && hav(selInfo.lat, selInfo.lon, globe.pick(globe._env.w / 2, globe._env.h / 2).lat, globe.pick(globe._env.w / 2, globe._env.h / 2).lon) < Math.max(40, (globe.view.d - 1) * 600)) dive(selInfo.lat, selInfo.lon, selInfo.name); else centerPick() }
    else if (k === '/' || k === 'g') { e.preventDefault(); $('#geoGo').focus() }
  } else {
    const m = KMAP[k] || KMAP[e.key]; if (m) { world.keys[m] = true; e.preventDefault(); e.stopPropagation() }
    world.keys.shift = e.shiftKey;
    if (k === '1') world.setMode('walk'); else if (k === '2') world.setMode('drive'); else if (k === '3') world.setMode('fly'); else if (k === 'b') startBus();
    else if (k === '+' || k === '=') world.zoom(.85); else if (k === '-' || k === '_') world.zoom(1.18);
    if (k === ' ') e.preventDefault();
  }
}
function onKeyUp(e) {
  if (!state.open) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  for (const m of [{ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', '+': 'zin', '=': 'zin', '-': 'zout', _: 'zout' }[k]]) if (m) gkeys[m] = false;
  const m2 = KMAP[k] || KMAP[e.key]; if (m2 && world) world.keys[m2] = false; if (world) world.keys.shift = e.shiftKey;
}

/* ------------------------------ loop ------------------------------ */
function frame(now) {
  if (!state.open) return; state.raf = requestAnimationFrame(frame);
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (saver() && now - lastR < 30) return; lastR = now;
  if (state.mode === 'globe') { globe.tick(now, dt, gkeys); renderer.render(globe.scene, globe.camera) }
  else {
    world.tick(now, dt); renderer.render(world.scene, world.camera); hudUpdate();
    if (now - (frame.mm || 0) > 160) { frame.mm = now; world.minimap($('#geoMini')) }
  }
}
function open(opts = {}) {
  if (!root) build();
  window.__geoOpen = true; root.hidden = false; state.open = true; state.mode = 'globe';
  if (!ensureRenderer()) return false;
  $('#geoWorldUI').hidden = true; $('#geoSide').hidden = false; $('#geoStatus').hidden = true;
  size(); last = performance.now(); cancelAnimationFrame(state.raf); state.raf = requestAnimationFrame(frame); cv.focus(); renderSel();
  return true;
}
function close() {
  if (!state.open) return; if (state.mode === 'world') { world.leave(); state.mode = 'globe' }
  state.open = false; root.hidden = true; window.__geoOpen = false; cancelAnimationFrame(state.raf); abortAll(); gkeys = {};
  try { const o = document.getElementById('ov'); if (o && !o.hidden) { const c = o.querySelector('.card,.hm'); (c || o).focus({ preventScroll: true }) } } catch (e) { }
}
function closeAll() { if (state.mode === 'world') world.leave(); state.mode = 'globe'; state.open = false; root.hidden = true; window.__geoOpen = false; cancelAnimationFrame(state.raf); abortAll() }

/* ------------------------------ public API ------------------------------ */
const GeoWorld = {
  version: 1, open, close, enter: (lat, lon, o) => { if (!state.open) open(); state.mode = 'world'; $('#geoSide').hidden = true; $('#geoWorldUI').hidden = false; $('#geoCross').style.display = 'none'; $('#geoLabels').style.display = 'none'; showStatus(); return world.enter(lat, lon, o || {}) },
  dive: (lat, lon, name, sample) => dive(lat, lon, name, sample), toGlobe, startBusGame: startBus, openCredits,
  get isOpen() { return state.open }, get mode() { return state.mode }, get world() { return world }, get globe() { return globe }, get player() { return world && world.P },
  opts: GW.opts, status: GW.status, NET, attribution: ATTR_HTML,
  // data API (see GEO_API.md)
  get roads() { C.ensureGraph(); return GW.roads }, get buildings() { return GW.buildings }, get places() { return GW.places },
  heightAt: C.heightAt, groundAt: C.groundAt, nearbyRoads: C.nearbyRoads, nearbyBuildings: C.nearbyBuildings, nearestRoad: C.nearestRoad, pointInBuilding: C.pointInBuilding,
  raycast: C.raycast, raycast2D: C.raycast2D, collideCircle: C.collideCircle, collideCapsule: C.collideCapsule, route: C.route, toLocal: C.toLocal, toLonLat: C.toLonLat, toFreeForm: C.toFreeForm,
  tileOfLocal: C.tileOfLocal, origin: () => GW.origin, whenIdle, pumpJobs, setOrigin: C.setOrigin,
  placeOnRoad() { return world.toRoad() }, setMode(m) { world.setMode(m) }, teleport(x, y) { world.place(x, y) },
  info() { const i = renderer ? renderer.info : null; return i ? { calls: i.render.calls, tris: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures } : null },
  tilesInfo() { return [...tileRecords().values()].map(r => ({ key: r.key, state: r.state, tris: r.group && r.group.userData.stats.tris, calls: r.group && r.group.userData.stats.calls, buildings: r.buildings && r.buildings.length, ways: r.ways && r.ways.length })) },
  net() { return { requests: NET.requests, retries: NET.retries, vectorTiles: NET.nVector, elevTiles: NET.nElev, bytesVector: NET.bytesVector, bytesElev: NET.bytesElev, mode: NET.mode, template: NET.template } },
  globeData: { places: PLACES, countryAt, nearestPlace },
};
window.GeoWorld = GeoWorld;
const attach = () => { if (window.__rhr) window.__rhr.geo = GeoWorld; else setTimeout(attach, 50) }; attach();
