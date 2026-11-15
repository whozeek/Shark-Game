// Guided walks: every route walks end-to-end, stops work (sit / step in) and resume, free movement is off.
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW);
const city = process.argv[2] || 'nyc';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`http://127.0.0.1:5173/?quality=low&frames=3&autostart=quiet&city=${city}`);
await p.waitForFunction(() => window.__done, null, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const a = window.__rainfall, cb = a.cb, P = a.player, st = a.stroll;
  const step = (n) => { for (let i = 0; i < n; i++) a.update(1 / 30); };
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const out = { routes: st.routes.map((r) => ({ id: r.id, name: r.name, len: Math.round(r.total), stops: r.stops.length, places: r.stops.filter((x) => x.kind === 'place').map((x) => x.label) })) };
  // free movement is off: holding W while paused doesn't move you
  a.stroll.paused = true; const x0 = P.x, z0 = P.z; a.controls.keys.add('w'); step(60); a.controls.keys.delete('w');
  out.wasdMoves = Math.hypot(P.x - x0, P.z - z0) > 0.05;
  out.walks = [];
  for (const route of st.routes) {
    a.placeOnRoute(route.id, false); a.toggleWalk();
    let dist = 0, lx = P.x, lz = P.z, clip = 0, sat = 0, stepped = 0;
    for (let i = 0; i < 5400; i++) {
      a.update(1 / 30);
      dist += Math.hypot(P.x - lx, P.z - lz); lx = P.x; lz = P.z;
      if (!P.level && !P.seat && cb.col.blocked(P.x, P.z, 0.15)) clip++;
      // try the first seat stop and the first place stop we pass
      const here = st.stopHere();
      if (here && !P.seat && !a.resume && ((here.kind === 'seat' && !sat) || (here.kind === 'place' && !stepped))) {
        a.sitAtStop(here);
        for (let k = 0; k < 20 && !P.seat; k++) await wait(200);
        const seated = !!P.seat, lvl = P.level, ind = a.interact.update(P) && a.interact.indoor?.name;
        step(30);
        a.resumeRoute();
        for (let k = 0; k < 20 && (P.seat || P.level); k++) await wait(200);
        step(5);
        if (here.kind === 'seat') sat = { label: here.label, seated, back: !P.seat && !P.level && !a.stroll.paused };
        else stepped = { label: here.label, seated, level: lvl, indoor: ind || null, back: !P.seat && !P.level && !a.stroll.paused };
      }
    }
    out.walks.push({ id: route.id, walked: Math.round(dist), routeLen: Math.round(route.total), clipFrames: clip, sat, stepped });
  }
  return out;
});
console.log(JSON.stringify(r, null, 1), errs);
await b.close();
