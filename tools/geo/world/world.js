/* The streamed world: scene, explorer (walk / drive / fly), terrain-following camera, collisions against building footprints, minimap. */
import { GW, setOrigin, toLonLat, heightAt, groundAt, collideCircle, nearestRoad, nearbyRoads, pointInBuilding, setStatus, emit, toFreeForm } from './core.js';
import { NET, updateAround, resetTiles, abortAll, pumpJobs, whenIdle, loadSample, tileRecords, clearCache } from './tiles.js';

export function createWorld(env) {
  const THREE = window.THREE;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(60, 1, .5, 7000);
  const SKY = 0xbcd8ee; scene.background = new THREE.Color(SKY);
  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x8a8f6a, .62), sun = new THREE.DirectionalLight(0xfff3dd, .42); sun.position.set(-.5, 1, .45); scene.add(hemi, sun);
  const root = new THREE.Group(); root.name = 'geoRoot'; scene.add(root); GW.root = root;
  const P = { x: 0, y: 0, z: 0, yaw: 0, v: 0, mode: 'walk', camYaw: 0, camPitch: .32, camDist: 7, flyAlt: 350 };
  const keys = {}, joy = { x: 0, y: 0 };
  const state = { active: false, t: 0, lastUpd: -9, mmT: 0, hudT: 0, collisions: 0 };
  // player models
  const mats = { walker: new THREE.MeshLambertMaterial({ color: 0xff6a3d }), bus: new THREE.MeshLambertMaterial({ color: 0xf2b632 }), dark: new THREE.MeshLambertMaterial({ color: 0x2b3a4a }), mark: new THREE.MeshBasicMaterial({ color: 0xff3b30 }) };
  const walker = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, 1.1, 10), mats.walker); b.position.y = .75; const h = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), mats.walker); h.position.y = 1.5; walker.add(b, h) }
  const bus = new THREE.Group(); { const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 9), mats.bus); b.position.y = 1.8; const w = new THREE.Mesh(new THREE.BoxGeometry(2.62, .9, 6.6), mats.dark); w.position.set(0, 2.2, -.4); bus.add(b, w) }
  const fly = new THREE.Mesh(new THREE.ConeGeometry(6, 18, 4), mats.mark); fly.rotation.x = Math.PI / 2;
  const flyG = new THREE.Group(); flyG.add(fly);
  for (const m of [walker, bus, flyG]) { m.visible = false; scene.add(m) }
  const pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff3b30 })); pathLine.frustumCulled = false; pathLine.visible = false; scene.add(pathLine);

  const radius = () => P.mode === 'drive' ? 1.7 : .45;
  const fwd = () => [Math.sin(P.yaw), Math.cos(P.yaw)];
  function setMode(m) { P.mode = m; walker.visible = m === 'walk'; bus.visible = m === 'drive'; flyG.visible = m === 'fly'; P.v = 0; if (m === 'drive') P.camDist = 16; else if (m === 'walk') P.camDist = 7; else P.camDist = 60; env.modeChanged && env.modeChanged(m) }
  function place(x, y, yaw) { P.x = x; P.y = y; if (yaw !== undefined) P.yaw = yaw; P.z = groundAt(x, y); updateAround(P.x, P.y) }
  function toRoad() {
    const h = nearestRoad(P.x, P.y, 800, e => e.drivable); if (!h) return false;
    const N = GW.roads.nodes, e = h.edge, A = N[e.a], B = N[e.b]; place(h.x, h.y, Math.atan2(B.x - A.x, B.y - A.y)); P.camYaw = 0; return true;
  }
  function resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix() }
  function applyQuality() { const sv = GW.opts.quality === 'saver'; scene.fog = new THREE.Fog(SKY, sv ? 350 : 520, sv ? 1100 : 1800); camera.far = sv ? 2500 : 4500; camera.updateProjectionMatrix() }

  async function enter(lat, lon, o = {}) {
    abortAll(); resetTiles(); NET.mode = o.sample ? 'sample' : 'network'; GW.opts.quality = env.saver() ? 'saver' : 'standard';
    if (o.sample) { await loadSample(); lat = NET.sample.origin.lat; lon = NET.sample.origin.lon }
    setOrigin(lat, lon); applyQuality(); GW.opts.ez = 12; GW.name = o.name || ''; GW.sampleMode = !!o.sample;
    P.x = P.y = 0; P.z = 0; P.yaw = 0; P.camYaw = 0; P.camPitch = .35; setMode('walk');
    setStatus(o.sample ? 'Opening the bundled Bridgeport sample' : 'Loading map tiles', 'ok');
    state.active = true; state.placed = false; updateAround(0, 0);
    await whenIdle(45000);
    const loaded = [...tileRecords().values()].filter(r => r.state === 'ready').length;
    if (loaded) { toRoad() || place(0, 0); state.placed = true }
    return { ok: loaded > 0, loaded, status: GW.status };
  }
  function leave() { state.active = false; abortAll(); resetTiles() }

  function step(dt) {
    const run = keys.shift ? 1 : 0, turn = ((keys.right || keys.d) ? 1 : 0) - ((keys.left || keys.a) ? 1 : 0), fw = ((keys.up || keys.w) ? 1 : 0) - ((keys.down || keys.s) ? 1 : 0) + (-joy.y);
    const tj = turn + joy.x * (P.mode === 'fly' ? 1 : 1);
    if (P.mode === 'walk') {
      P.yaw += tj * 2.1 * dt; const sp = (run ? 10 : 4.6), tgt = Math.max(-1, Math.min(1, fw)) * sp; P.v += (tgt - P.v) * Math.min(1, dt * 7);
      const st = ((keys.e ? 1 : 0) - (keys.q ? 1 : 0)), f = fwd();
      P.x += f[0] * P.v * dt + f[1] * st * sp * .8 * dt; P.y += f[1] * P.v * dt - f[0] * st * sp * .8 * dt;
    } else if (P.mode === 'drive') {
      const sp = run ? 42 : 21, tgt = Math.max(-.35, Math.min(1, fw)) * sp; P.v += (tgt - P.v) * Math.min(1, dt * (tgt === 0 ? 1.6 : 1.1));
      P.yaw += tj * 1.5 * dt * Math.max(-1, Math.min(1, P.v / 6)); const f = fwd(); P.x += f[0] * P.v * dt; P.y += f[1] * P.v * dt;
    } else {
      P.yaw += tj * 1.4 * dt; const sp = run ? 420 : 130, tgt = Math.max(-1, Math.min(1, fw)) * sp; P.v += (tgt - P.v) * Math.min(1, dt * 4); const f = fwd(); P.x += f[0] * P.v * dt; P.y += f[1] * P.v * dt;
      if (keys.r || keys.pageup) P.flyAlt = Math.min(2500, P.flyAlt * (1 + dt * 1.2)); if (keys.f || keys.pagedown) P.flyAlt = Math.max(40, P.flyAlt / (1 + dt * 1.2));
    }
    if (P.mode !== 'fly') {
      const c = collideCircle(P.x, P.y, radius()); if (c.hit) { state.collisions++; P.x = c.x; P.y = c.y; if (P.mode === 'drive') P.v *= .6; state.lastHit = c.hit.id }
    }
    const g = groundAt(P.x, P.y); P.z += (g - P.z) * Math.min(1, dt * (P.mode === 'drive' ? 8 : 14)); if (Math.abs(g - P.z) > 20) P.z = g;
  }
  function updateCamera() {
    const yaw = P.yaw + Math.PI + P.camYaw, pitch = P.mode === 'fly' ? Math.max(.5, P.camPitch + .6) : P.camPitch, d = P.mode === 'fly' ? P.flyAlt / Math.sin(pitch) * .9 : P.camDist;
    const h = P.mode === 'fly' ? P.z : P.z + (P.mode === 'drive' ? 2.4 : 1.4);
    const ox = Math.sin(yaw) * Math.cos(pitch) * d, oy = Math.cos(yaw) * Math.cos(pitch) * d, oz = Math.sin(pitch) * d;
    let cx = P.x + ox, cy = P.y + oy, cz = h + oz;
    const gmin = groundAt(cx, cy) + 1.2; if (cz < gmin) cz = gmin;
    camera.position.set(cx, cz, -cy); camera.lookAt(P.x, h + (P.mode === 'fly' ? 0 : .3), -P.y);
    for (const m of [walker, bus, flyG]) { m.position.set(P.x, P.z, -P.y); m.rotation.y = -P.yaw + Math.PI * 0 }
    flyG.position.y = P.z + 3; fly.rotation.set(Math.PI / 2, 0, 0);
    sun.position.set(P.x - 300, 800, -P.y + 250); sun.target.position.set(P.x, 0, -P.y); sun.target.updateMatrixWorld();
  }
  function tick(now, dt) {
    if (!state.active) return; dt = Math.min(dt, .1);
    pumpJobs(5); step(dt);
    state.t += dt; if (state.t - state.lastUpd > .5) { state.lastUpd = state.t; updateAround(P.x, P.y) }
    updateCamera();
  }
  /* look/orbit input from the mouse or a touch drag */
  function look(dx, dy) { P.camYaw -= dx * .006; P.camPitch = Math.max(.05, Math.min(1.4, P.camPitch + dy * .005)) }
  function zoom(f) { if (P.mode === 'fly') P.flyAlt = Math.max(40, Math.min(2500, P.flyAlt * f)); else P.camDist = Math.max(3, Math.min(P.mode === 'drive' ? 60 : 30, P.camDist * f)) }

  /* a route line on the ground (from GW.route) */
  function showPath(pts) {
    if (!pts || pts.length < 2) { pathLine.visible = false; return }
    const a = []; for (const p of pts) a.push(p.x, p.z + 1.2, -p.y); pathLine.geometry.dispose(); pathLine.geometry = new THREE.BufferGeometry(); pathLine.geometry.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); pathLine.visible = true;
  }

  /* ---------- minimap ---------- */
  function minimap(cv, R = 450) {
    const g = cv.getContext('2d'), S = cv.width, k = S / (2 * R), c = S / 2; g.clearRect(0, 0, S, S); g.save(); g.beginPath(); g.arc(c, c, c - 1, 0, 6.3); g.clip();
    g.fillStyle = '#dfe9d2'; g.fillRect(0, 0, S, S);
    const X = x => c + (x - P.x) * k, Y = y => c - (y - P.y) * k;
    g.fillStyle = '#9fc4e6'; for (const t of GW.tiles.values()) for (const p of t.waterPolys || []) { g.beginPath(); p.forEach((q, i) => i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1]))); g.fill() }
    g.fillStyle = '#b9b5ae'; let n = 0; for (const b of GW.buildings) { if (Math.abs(b.cx - P.x) > R || Math.abs(b.cy - P.y) > R) continue; if (++n > 700) break; g.beginPath(); b.fp.forEach((q, i) => i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1]))); g.fill() }
    g.lineCap = 'round'; const widths = { motorway: 4, trunk: 3.6, primary: 3.2, secondary: 2.6, tertiary: 2.2, minor: 1.6, service: 1, path: .8 };
    for (const w of GW.roads.ways) { if (w.tunnel) continue; const a = w.pts[0]; if (Math.abs(a[0] - P.x) > R * 2 && Math.abs(a[1] - P.y) > R * 2) continue; g.strokeStyle = w.cls === 'path' ? '#b98f5a' : w.cls === 'motorway' || w.cls === 'trunk' ? '#e0883a' : '#ffffff'; g.lineWidth = widths[w.cls] || 1; g.beginPath(); w.pts.forEach((q, i) => i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1]))); g.stroke() }
    g.restore(); g.save(); g.translate(c, c); g.rotate(P.yaw); g.fillStyle = '#e2352b'; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -8); g.lineTo(6, 7); g.lineTo(0, 4); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
    g.fillStyle = '#1b2733'; g.font = 'bold 11px sans-serif'; g.fillText('N', c - 4, 12);
  }
  function hudInfo() {
    const ll = toLonLat(P.x, P.y); let place = null, bd = 6000; for (const p of GW.places) { const d = Math.hypot(p.x - P.x, p.y - P.y); if (d < bd) { bd = d; place = p } }
    const r = nearbyRoads(P.x, P.y, 14)[0], b = pointInBuilding(P.x, P.y);
    return { lat: ll.lat, lon: ll.lon, ele: P.z, place: place && place.name, placeKm: bd / 1000, road: r && r.edge.name || (r ? '(unnamed ' + r.edge.cls + ')' : ''), x: P.x, y: P.y, mode: P.mode, speed: Math.abs(P.v), inBuilding: !!b };
  }
  function bridge(radius) { return toFreeForm(P.x, P.y, radius) }
  return { scene, camera, P, keys, joy, state, enter, leave, tick, resize, setMode, place, toRoad, look, zoom, minimap, hudInfo, showPath, bridge, applyQuality, mats };
}
