// New York diagnostics: render cost per quality, pedestrians inside obstacles, and stroll slow spots.
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW);
const quality = process.argv[2] || 'balanced';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript((s) => localStorage.setItem('rainfall-avenue:settings:v1', s), process.argv[3] || '{}');
await p.goto(`http://127.0.0.1:5173/?quality=${quality}&frames=3&autostart=quiet&city=nyc`);
await p.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await p.evaluate(() => {
  const a = window.__rainfall, cb = a.cb, eng = a.engine, out = {};
  const info = eng.renderer.info;
  a.renderFrame(); out.render = { calls: info.render.calls, tris: info.render.triangles, geos: info.memory.geometries, textures: info.memory.textures, pr: eng.renderer.getPixelRatio() };
  let verts = 0; cb.group.traverse((o) => { if (o.geometry?.attributes?.position) verts += o.geometry.attributes.position.count; });
  out.cityVerts = verts; out.colliders = cb.col.shapes.length; out.lights = cb.lights.length; out.pools = cb.pools.length;
  const step = (n) => { for (let i = 0; i < n; i++) a.update(1 / 30); };
  // pedestrians inside obstacles over 2 minutes
  const crowd = eng.crowd; const insideLog = new Map();
  for (let i = 0; i < 3600; i++) {
    a.update(1 / 30);
    if (i % 15) continue;
    for (const q of crowd.agents) {
      if (!q.alive || q.leader && !q.vis) continue;
      if (cb.col.blocked(q.x, q.z, 0.1)) {
        const key = q.i; const prev = insideLog.get(key) || { n: 0 };
        const hit = cb.col.query(q.x, q.z, 0.6).find((s) => { if (s.t === 1) return Math.hypot(s.x - q.x, s.z - q.z) < s.r + 0.1; const dx = q.x - s.cx, dz = q.z - s.cz; const lx = dx * s.c + dz * s.s, lz = -dx * s.s + dz * s.c; return Math.abs(lx) < s.hx + 0.1 && Math.abs(lz) < s.hz + 0.1; });
        insideLog.set(key, { n: prev.n + 1, mode: q.mode, edge: q.edge.kind, follower: !!q.leader, pos: [+q.x.toFixed(1), +q.z.toFixed(1)], shape: hit ? (hit.t === 1 ? 'circle r' + hit.r.toFixed(2) : `box ${hit.hx.toFixed(2)}x${hit.hz.toFixed(2)}`) : '?' });
      }
    }
  }
  out.pedsInside = { agentsEverInside: insideLog.size, samples: [...insideLog.values()].reduce((s, v) => s + v.n, 0), examples: [...insideLog.values()].sort((x, y) => y.n - x.n).slice(0, 8) };
  out.alive = crowd.agents.filter((q) => q.alive).length;
  // stroll: 6 minutes, record where it is slow and why
  const P = a.player; a.returnToStart(); a.toggleMode(); step(2);
  const st = {}; let slow = []; let lastX = P.x, lastZ = P.z, dist = 0, clip = 0;
  for (let i = 0; i < 10800; i++) {
    a.update(1 / 30);
    const s = a.stroll.status; st[s] = (st[s] || 0) + 1 / 30;
    const d = Math.hypot(P.x - lastX, P.z - lastZ); dist += d; lastX = P.x; lastZ = P.z;
    if (cb.col.blocked(P.x, P.z, 0.15)) clip++;
    if (d < 0.005 && !/Waiting|Pausing|shopping|Skyline|park/i.test(s)) slow.push(`${s}@${P.x.toFixed(0)},${P.z.toFixed(0)}`);
  }
  const slowSpots = {}; for (const k of slow) slowSpots[k] = (slowSpots[k] || 0) + 1;
  out.stroll = { dist: +dist.toFixed(0), routeLen: +a.stroll.total.toFixed(0), secondsByStatus: Object.fromEntries(Object.entries(st).map(([k, v]) => [k, +v.toFixed(0)])), clipFrames: clip, unexplainedStops: Object.entries(slowSpots).sort((x, y) => y[1] - x[1]).slice(0, 8) };
  return out;
});
console.log(JSON.stringify(r, null, 1), errs);
await b.close();
