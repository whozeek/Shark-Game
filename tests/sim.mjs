import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
if (process.argv[3]) await p.addInitScript(process.argv[3]);
await p.goto('http://127.0.0.1:5173/?quality=' + (process.argv[4] || 'low') + '&frames=3&autostart=quiet&city=' + (process.argv[2] || 'nyc'));
await p.waitForFunction(() => window.__done, null, { timeout: 240000 });
const res = await p.evaluate(() => {
  const a = window.__rainfall; const out = {};
  const step = (n) => { for (let i = 0; i < n; i++) a.update(1 / 30); };
  const P = a.player;
  // 1) walk forward 20 s
  a.controls.keys.add('w'); const s0 = [P.x, P.z]; step(600); a.controls.keys.delete('w');
  out.walk = { from: s0.map((v) => +v.toFixed(1)), to: [+P.x.toFixed(1), +P.z.toFixed(1)], inside: a.cb.col.blocked(P.x, P.z, 0.25) };
  // 2) push sideways into buildings for 20 s
  a.controls.keys.add('d'); step(600); a.controls.keys.delete('d');
  out.wall = { at: [+P.x.toFixed(1), +P.z.toFixed(1)], inside: a.cb.col.blocked(P.x, P.z, 0.25) };
  // 3) stroll for 3 minutes, track progress, crossings, and collisions
  a.returnToStart(); a.toggleMode(); step(2);
  let maxIn = 0, statuses = new Set(), dist = 0, lx = P.x, lz = P.z, onRoadCarHit = 0;
  for (let i = 0; i < 5400; i++) {
    a.update(1 / 30);
    statuses.add(a.stroll.status);
    dist += Math.hypot(P.x - lx, P.z - lz); lx = P.x; lz = P.z;
    if (a.cb.col.blocked(P.x, P.z, 0.15)) maxIn++;
    for (const v of a.engine.traffic.vehicles) { const q = a.engine.traffic.pose(v); if (Math.hypot(q.x - P.x, q.z - P.z) < v.width / 2 + 0.2) onRoadCarHit++; }
  }
  out.stroll = { active: a.stroll.active, dist: +dist.toFixed(1), framesInsideColliders: maxIn, statuses: [...statuses], carOverlapFrames: onRoadCarHit, routeLen: +a.stroll.total.toFixed(0) };
  // 4) pedestrians: how many stand inside colliders
  const peds = a.engine.crowd.agents.filter((q) => q.alive);
  out.peds = { n: peds.length, inside: peds.filter((q) => a.cb.col.blocked(q.x, q.z, 0.05)).length, walking: peds.filter((q) => q.mode === 'walk').length, modes: peds.reduce((m, q) => { m[q.mode] = (m[q.mode] || 0) + 1; return m; }, {}), followers: peds.filter((q) => q.leader).length };
  // traffic turning check: run 2 more minutes and count completed turns and car-on-car overlaps
  const T = a.engine.traffic; let turns = 0, overlaps = 0, inTurn = new Set();
  for (let i = 0; i < 3600; i++) {
    a.update(1 / 30);
    for (const v of T.vehicles) { if (v.turn) inTurn.add(v); else if (inTurn.has(v)) { turns++; inTurn.delete(v); } }
    if (i % 10 === 0) { const ps = T.vehicles.map((v) => T.pose(v)); for (let m = 0; m < ps.length; m++) for (let n = m + 1; n < ps.length; n++) if (Math.hypot(ps[m].x - ps[n].x, ps[m].z - ps[n].z) < 1.2) overlaps++; }
  }
  out.turns = { completed: turns, overlapSamples: overlaps };
  out.cars = { n: a.engine.traffic.vehicles.length, moving: a.engine.traffic.vehicles.filter((v) => v.speed > 1).length };
  return out;
});
console.log(JSON.stringify(res), errs);
await b.close();
