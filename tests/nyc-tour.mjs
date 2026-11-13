// Visual tour of New York: renders a set of views for review.
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW);
const out = process.argv[2];
const only = process.argv[3] ? process.argv[3].split(',') : null;
const scenes = [
  { id: 'cafe-in', set: { timeOfDay: 20 }, go: 'cafeInside' },
  { id: 'cafe-window', set: { timeOfDay: 20 }, go: 'cafeSeat' },
  { id: 'laundry', set: { timeOfDay: 22 }, go: 'laundry' },
  { id: 'rooftop', set: { timeOfDay: 20.5 }, go: 'rooftop' },
  { id: 'subway', set: { timeOfDay: 20 }, go: 'subway' },
  { id: 'winter', set: { timeOfDay: 19.5, season: 'winter', precip: 'snow', rainIntensity: 0.6 }, go: 'spawn' },
  { id: 'night3am', set: { timeOfDay: 3 }, go: 'spawn' },
  { id: 'autumn-day', set: { timeOfDay: 15, season: 'autumn', rainIntensity: 0.35 }, go: 'park' },
].filter((s) => !only || only.includes(s.id));
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const sc of scenes) {
  const p = await b.newPage({ viewport: { width: 800, height: 450 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((s) => localStorage.setItem('rainfall-avenue:settings:v1', JSON.stringify({ umbrella: true, ...s })), sc.set);
  await p.goto('http://127.0.0.1:5173/?quality=balanced&frames=2&autostart=quiet&city=nyc');
  await p.waitForFunction(() => window.__done, null, { timeout: 300000 });
  await p.evaluate(async (go) => {
    const a = window.__rainfall, cb = a.cb, P = a.player;
    document.querySelectorAll('.toast-wrap').forEach((e) => e.remove());
    const room = (k) => cb.indoors.find((i) => i.kind === k);
    if (go === 'cafeInside' || go === 'cafeSeat' || go === 'laundry') {
      const r = room(go === 'laundry' ? 'laundry' : 'cafe');
      const seat = cb.seats.find((s) => /window seat/.test(s.label) && s.x > r.x0 - 1 && s.x < r.x1 + 1 && s.z > r.z0 - 1 && s.z < r.z1 + 1);
      const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      if (go === 'cafeSeat' && seat) { P.sit(seat); }
      else {
        // stand just inside the front, looking toward the back of the room
        const fx = seat ? seat.x : (Math.abs(r.x0 - cx) < Math.abs(r.z0 - cz) ? r.x0 + 1 : cx);
        const fz = seat ? seat.z : cz;
        const dx = cx - fx, dz = cz - fz, L = Math.hypot(dx, dz) || 1;
        P.x = fx + dx / L * 0.6; P.z = fz + dz / L * 0.6; P.yaw = Math.atan2(-dx, -dz) + 0.35; P.pitch = -0.05;
        if (go === 'laundry') { P.x = cx - dx / L * 2.5; P.z = cz - dz / L * 2.5; }
      }
    } else if (go === 'rooftop' || go === 'subway') {
      const portal = cb.portals.find((q) => !q.level && q.to.level === go);
      P.teleport(portal.to);
      if (go === 'rooftop') { P.yaw = 0.2; P.pitch = 0.02; const lv = cb.levels.rooftop; P.x = (lv.col.bounds.minX + lv.col.bounds.maxX) / 2; P.z = lv.col.bounds.maxZ - 0.6; }
      if (go === 'subway') { const st = cb.levels.subway.train; st.phase = 'arriving'; st.t = 0; P.yaw = -Math.PI / 2 - 0.5; P.pitch = 0.0; P.x += 10; }
    } else if (go === 'park') { P.x = 20; P.z = 52; P.yaw = 0.6; P.pitch = 0.05; }
    for (let i = 0; i < (go === 'subway' ? 420 : 30); i++) a.update(1 / 30);
    // let the app's own loop draw a few frames so the screenshot captures a live canvas
    window.__done = false; a.maxFrames = a.frameCount + 3; a.last = performance.now();
    requestAnimationFrame((t) => a.frame(t));
  }, sc.go);
  await p.waitForFunction(() => window.__done, null, { timeout: 300000 });
  await p.screenshot({ path: `${out}/tour-${sc.id}.png` });
  if (errs.length) console.log(sc.id, errs);
  await p.close();
}
await b.close();
console.log('done');
