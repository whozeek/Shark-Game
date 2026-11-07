/* The 3D globe: Natural Earth countries (public domain, via world-atlas 1:50m, simplified) painted on a canvas texture, plus populated places.
 * lon/lat -> unit sphere:  (cos lat cos lon, sin lat, -cos lat sin lon). East is screen-right when looking at the sphere from outside with north up. */
import { feature, mesh } from 'topojson-client';
import TOPO from './globe_topo.json';
import PLACES_TXT from './globe_places.txt';

const D2R = Math.PI / 180;
export const xyz = (lat, lon, r = 1) => [r * Math.cos(lat * D2R) * Math.cos(lon * D2R), r * Math.sin(lat * D2R), -r * Math.cos(lat * D2R) * Math.sin(lon * D2R)];
export const fromXyz = (x, y, z) => ({ lat: Math.asin(Math.max(-1, Math.min(1, y))) / D2R, lon: Math.atan2(-z, x) / D2R });
export const hav = (a1, o1, a2, o2) => { const p = Math.sin((a2 - a1) * D2R / 2) ** 2 + Math.cos(a1 * D2R) * Math.cos(a2 * D2R) * Math.sin((o2 - o1) * D2R / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(p))) };   // km

export const PLACES = PLACES_TXT.split('\n').map(l => { const a = l.split('|'); return { name: a[0], lat: +a[1], lon: +a[2], pop: +a[3] * 1000, iso: a[4], cap: a[5] === '1' } });
const FEATS = feature(TOPO, TOPO.objects.countries).features;
const BORDERS = mesh(TOPO, TOPO.objects.countries, (a, b) => a !== b), COAST = mesh(TOPO, TOPO.objects.countries, (a, b) => a === b);

/* country under a point (simple even-odd test with bounding boxes) */
const bbox = g => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const p of polys) for (const q of p[0]) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1] } return [x0, y0, x1, y1, polys] };
const CINFO = FEATS.map(f => { const b = bbox(f.geometry); let best = null, ba = 0; for (const p of b[4]) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const q of p[0]) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]) } const a = (x1 - x0) * (y1 - y0); if (a > ba) { ba = a; best = [(x0 + x1) / 2, (y0 + y1) / 2] } } return { name: f.properties.name, bb: b, polys: b[4], area: ba, c: best } });
const inRing = (r, x, y) => { let s = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) s = !s } return s };
export function countryAt(lat, lon) {
  for (const c of CINFO) { if (lon < c.bb[0] || lon > c.bb[2] || lat < c.bb[1] || lat > c.bb[3]) continue; for (const p of c.polys) if (inRing(p[0], lon, lat) && !p.slice(1).some(h => inRing(h, lon, lat))) return c.name }
  return null;
}
export function nearestPlace(lat, lon) { let best = null, bd = 1e9; for (const p of PLACES) { const d = hav(lat, lon, p.lat, p.lon); if (d < bd) { bd = d; best = p } } return { place: best, km: bd } }

const LAND = ['#9bbd7e', '#b1c78a', '#a3c08d', '#c3cc92', '#8fb68a', '#bcc48c', '#a8bf86'];
const ICE = new Set(['Antarctica', 'Greenland']);
export function drawTexture(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a6da6'); gr.addColorStop(.5, '#1f66a3'); gr.addColorStop(1, '#2a6da6'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const X = lon => (lon + 180) / 360 * w, Y = lat => (90 - lat) / 180 * h;
  g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 1; g.beginPath();
  for (let lo = -150; lo <= 180; lo += 30) { g.moveTo(X(lo), 0); g.lineTo(X(lo), h) } for (let la = -60; la <= 60; la += 30) { g.moveTo(0, Y(la)); g.lineTo(w, Y(la)) } g.stroke();
  FEATS.forEach((f, i) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    g.fillStyle = ICE.has(f.properties.name) ? '#eef3f5' : LAND[(f.properties.name || '').length * 7 % LAND.length];
    g.beginPath(); for (const p of polys) for (const r of p) { r.forEach((q, k) => k ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1]))); g.closePath() } g.fill('evenodd');
  });
  const line = (m, style, lw) => { g.strokeStyle = style; g.lineWidth = lw; g.lineJoin = 'round'; for (const ln of m.coordinates) { g.beginPath(); let px = null; for (const q of ln) { if (px !== null && Math.abs(q[0] - px) > 180) g.moveTo(X(q[0]), Y(q[1])); else if (px === null) g.moveTo(X(q[0]), Y(q[1])); else g.lineTo(X(q[0]), Y(q[1])); px = q[0] } g.stroke() } };
  const s = w / 2048;
  line(BORDERS, 'rgba(250,246,230,.75)', Math.max(.8, .9 * s)); line(COAST, 'rgba(30,60,50,.75)', Math.max(.9, 1.1 * s));
  return c;
}

/* labels (oceans, continents, countries, cities) */
const OCEANS = [['Pacific Ocean', 0, -150], ['Pacific Ocean', -10, 175], ['Atlantic Ocean', 20, -38], ['Atlantic Ocean', -25, -15], ['Indian Ocean', -20, 80], ['Arctic Ocean', 82, 0], ['Southern Ocean', -62, 60]];
const CONT = [['AFRICA', 5, 20], ['EUROPE', 52, 15], ['ASIA', 45, 90], ['NORTH AMERICA', 48, -100], ['SOUTH AMERICA', -15, -60], ['OCEANIA', -25, 135], ['ANTARCTICA', -80, 30]];
const LABELS = [];
for (const o of OCEANS) LABELS.push({ t: o[0], lat: o[1], lon: o[2], k: 'ocean', pr: 9 });
for (const o of CONT) LABELS.push({ t: o[0], lat: o[1], lon: o[2], k: 'cont', pr: 8 });
for (const c of CINFO) if (c.c && c.name && c.area > 3) LABELS.push({ t: c.name, lat: c.c[1], lon: c.c[0], k: 'country', pr: 5, area: c.area });
for (const p of PLACES) LABELS.push({ t: p.name, lat: p.lat, lon: p.lon, k: 'city', pr: 1, pop: p.pop, cap: p.cap, place: p });

export function createGlobe(env) {
  const THREE = window.THREE;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .01, 50);
  const view = { lat: 30, lon: -40, d: 3.6 }, vel = { lat: 0, lon: 0, d: 0 }; let sel = null, anim = null;
  const wrap = env.labels; wrap.innerHTML = '';
  scene.add(new THREE.AmbientLight(0xffffff, .62)); const sun = new THREE.DirectionalLight(0xffffff, .62); scene.add(sun); scene.add(sun.target);
  const tw = env.saver() ? 2048 : 4096, tex = new THREE.CanvasTexture(drawTexture(tw, tw / 2)); tex.anisotropy = 4;
  const seg = env.saver() ? [64, 40] : [112, 72];
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, seg[0], seg[1]), new THREE.MeshLambertMaterial({ map: tex })); earth.name = 'earth'; scene.add(earth);
  // atmosphere: back-face shell with a fresnel glow
  const atm = new THREE.Mesh(new THREE.SphereGeometry(1.035, 48, 32), new THREE.ShaderMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=(modelViewMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vN;varying vec3 vP;void main(){float i=pow(max(0.,.62-dot(vN,normalize(-vP))),2.5);gl_FragColor=vec4(.35,.62,1.,1.)*i*.9;}' })); scene.add(atm);
  // stars
  { const n = env.saver() ? 250 : 700, a = new Float32Array(n * 3); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < n; i++) { const u = r() * 2 - 1, t = r() * 6.283, q = Math.sqrt(1 - u * u); a.set([q * Math.cos(t) * 30, u * 30, q * Math.sin(t) * 30], i * 3) } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: .7, depthWrite: false }))) }
  // selection pin
  const pin = new THREE.Mesh(new THREE.SphereGeometry(.007, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff4b3a })); pin.visible = false; scene.add(pin);
  const pinRing = new THREE.Mesh(new THREE.RingGeometry(.012, .016, 32), new THREE.MeshBasicMaterial({ color: 0xff4b3a, side: THREE.DoubleSide, transparent: true, opacity: .85 })); pinRing.visible = false; scene.add(pinRing);

  const camDir = new THREE.Vector3();
  function place() {
    view.lat = Math.max(-85, Math.min(85, view.lat)); view.lon = ((view.lon + 540) % 360) - 180; view.d = Math.max(1.012, Math.min(6.5, view.d));
    const p = xyz(view.lat, view.lon, view.d); camera.position.set(p[0], p[1], p[2]); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0);
    camDir.set(p[0], p[1], p[2]).normalize();
    camera.near = Math.max(.002, (view.d - 1) * .4); camera.far = view.d + 3; camera.updateProjectionMatrix();
    sun.position.copy(camera.position).add(new THREE.Vector3(-.6, .8, .5)); sun.target.position.set(0, 0, 0);
    atm.visible = true;
  }
  function resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); env.w = w; env.h = h }
  const rayV = new THREE.Vector3(), tmp = new THREE.Vector3();
  /* screen px -> {lat,lon} on the sphere, or null if the pointer is off the globe */
  function pick(sx, sy) {
    const nx = sx / env.w * 2 - 1, ny = -(sy / env.h * 2 - 1); rayV.set(nx, ny, .5).unproject(camera).sub(camera.position).normalize();
    const o = camera.position, b = o.dot(rayV), c = o.dot(o) - 1, disc = b * b - c; if (disc < 0) return null;
    const t = -b - Math.sqrt(disc); tmp.copy(o).addScaledVector(rayV, t); return fromXyz(tmp.x, tmp.y, tmp.z);
  }
  function project(lat, lon) {   // -> {x,y,front} in px
    const p = xyz(lat, lon); tmp.set(p[0], p[1], p[2]); const front = tmp.dot(camDir) > 1 / view.d + .02; tmp.project(camera); return { x: (tmp.x + 1) / 2 * env.w, y: (1 - tmp.y) / 2 * env.h, front, z: tmp.z };
  }
  const pool = []; const rects = [];
  function minPop() { const d = view.d; return d > 4.2 ? 6e6 : d > 3.2 ? 3e6 : d > 2.5 ? 1.5e6 : d > 1.9 ? 6e5 : d > 1.5 ? 2.5e5 : d > 1.25 ? 9e4 : d > 1.1 ? 3e4 : 0 }
  function updateLabels() {
    const mp = minPop(), d = view.d, vis = []; rects.length = 0;
    const cands = [];
    for (const L of LABELS) {
      if (L.k === 'ocean' && d < 2.2) continue; if (L.k === 'cont' && (d < 2.6 || d > 5.2)) continue;
      if (L.k === 'country' && (d > 3.1 || d < 1.25 || L.area < (d > 2.4 ? 220 : d > 1.8 ? 60 : d > 1.45 ? 14 : 3))) continue;
      if (L.k === 'city' && L.pop < mp && !(L.cap && d < 2.2 && L.pop > mp / 4)) continue;
      cands.push(L);
    }
    cands.sort((a, b) => (b.pr * 1e9 + (b.pop || b.area || 0)) - (a.pr * 1e9 + (a.pop || a.area || 0)) || 0);
    cands.sort((a, b) => ((b.k === 'city') - (a.k === 'city')) || ((b.pop || b.area * 1e5 || 0) - (a.pop || a.area * 1e5 || 0)));
    for (const L of cands) {
      if (vis.length >= 46) break;
      const p = project(L.lat, L.lon); if (!p.front || p.x < -10 || p.y < -10 || p.x > env.w + 10 || p.y > env.h + 10) continue;
      const wdt = L.t.length * (L.k === 'city' ? 6.6 : 7.2) + 16, hgt = 18, r = [p.x - 6, p.y - hgt / 2, p.x - 6 + wdt, p.y + hgt / 2];
      if (rects.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) continue;
      rects.push(r); vis.push([L, p]);
    }
    vis.forEach(([L, p], i) => {
      let el = pool[i]; if (!el) { el = document.createElement('button'); el.type = 'button'; el.tabIndex = -1; wrap.appendChild(el); pool[i] = el }
      if (el._L !== L) { el._L = L; el.className = 'gl gl-' + L.k + (L.cap ? ' cap' : ''); el.textContent = L.t; el.setAttribute('aria-label', L.k === 'city' ? 'Choose ' + L.t : L.t); el.disabled = L.k !== 'city'; if (L.k === 'city') el.title = L.t + (L.place.iso ? ', ' + L.place.iso : '') + ' - population about ' + (L.pop >= 1e6 ? (L.pop / 1e6).toFixed(1) + ' million' : Math.round(L.pop / 1000) + ' thousand') }
      el.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px)'; el.style.display = '';
    });
    for (let i = vis.length; i < pool.length; i++)pool[i].style.display = 'none';
    env.labelCount = vis.length;
  }
  function setSel(lat, lon) {
    sel = lat === null ? null : { lat, lon };
    if (!sel) { pin.visible = pinRing.visible = false; return }
    const p = xyz(lat, lon, 1.002); pin.position.set(...p); pin.visible = true; const q = xyz(lat, lon, 1.001); pinRing.position.set(...q); pinRing.lookAt(0, 0, 0); pinRing.visible = true;
  }
  function flyTo(lat, lon, d, ms, done) {
    const rm = env.rm(); if (rm || ms <= 0) { view.lat = lat; view.lon = lon; view.d = d; vel.lat = vel.lon = vel.d = 0; place(); done && done(); return }
    let dl = lon - view.lon; dl = ((dl + 540) % 360) - 180;
    anim = { t0: performance.now(), ms, from: { ...view }, to: { lat, lon: view.lon + dl, d }, done };
  }
  function tick(now, dt, keys) {
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / anim.ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      view.lat = anim.from.lat + (anim.to.lat - anim.from.lat) * e; view.lon = anim.from.lon + (anim.to.lon - anim.from.lon) * e;
      view.d = 1 + (anim.from.d - 1) * Math.pow((anim.to.d - 1) / Math.max(.001, anim.from.d - 1), e);
      if (k >= 1) { const a = anim; anim = null; a.done && a.done() }
    } else {
      const sc = 2 * (view.d - 1) * Math.tan(17.5 * D2R) / Math.max(300, env.h) * 55 / D2R;   // degrees per key second, grows with altitude
      const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
      view.lon += dx * sc * dt * 4 / Math.max(.25, Math.cos(view.lat * D2R)); view.lat += dy * sc * dt * 4;
      if (keys.zin) view.d = 1 + (view.d - 1) * Math.exp(-dt * 1.6); if (keys.zout) view.d = 1 + (view.d - 1) * Math.exp(dt * 1.6);
      if (!env.rm()) { view.lon += vel.lon * dt * 60; view.lat += vel.lat * dt * 60; const f = Math.pow(.92, dt * 60); vel.lon *= f; vel.lat *= f; if (Math.abs(vel.lon) < .0005) vel.lon = 0; if (Math.abs(vel.lat) < .0005) vel.lat = 0 } else vel.lon = vel.lat = 0;
    }
    place();
    if (sel) { pinRing.scale.setScalar(1 + .15 * Math.sin(now / 300) * (env.rm() ? 0 : 1)); const s = Math.max(.35, (view.d - 1) * .9); pin.scale.setScalar(s); pinRing.scale.multiplyScalar(s) }
    updateLabels();
  }
  place();
  return {
    scene, camera, view, vel, resize, pick, project, tick, flyTo, setSel, getSel: () => sel, isFlying: () => !!anim, place,
    dispose() { tex.dispose(); earth.geometry.dispose(); earth.material.dispose(); atm.geometry.dispose(); atm.material.dispose(); wrap.innerHTML = '' },
    pxToDeg() { return 2 * (view.d - 1) * Math.tan(17.5 * D2R) / Math.max(300, env.h) / D2R },
  };
}
