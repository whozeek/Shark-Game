import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW);
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.addInitScript(() => localStorage.setItem('rainfall-avenue:settings:v1', JSON.stringify({ umbrella: true, timeOfDay: 19.5 })));
await p.goto('http://127.0.0.1:5173/?quality=low&autostart=quiet&city=' + (process.argv[3] || 'nyc'));
await p.waitForFunction(() => window.__rainfall?.started && window.__rainfall.cb, null, { timeout: 200000 });
const r = await p.evaluate(async () => {
  const a = window.__rainfall, cb = a.cb, P = a.player, out = {};
  const step = (n) => { for (let i = 0; i < n; i++) a.update(1 / 30); };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  out.walkIns = cb.walkIns.map((w) => [w.name, !!w.used]);
  out.indoors = cb.indoors.map((i) => i.name);
  out.levels = Object.keys(cb.levels);
  out.portals = cb.portals.map((q) => [q.level, q.label]);
  // walk in through the first walk-in door: start outside, head for the room centre
  const room = cb.indoors.find((i) => i.kind === 'cafe' || i.kind === 'tea') || cb.indoors.find((i) => i.kind !== 'arcade');
  if (room) {
    const cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2;
    // find the door by testing points along the front edge
    const door = cb.portals.length >= 0 && cb.walkIns[0];
    out.room = room.name;
    // place the player 2.5 m in front of the room's centre and walk towards it
    const seat = cb.seats.find((s) => /window seat/.test(s.label) && s.x > room.x0 - 1 && s.x < room.x1 + 1 && s.z > room.z0 - 1 && s.z < room.z1 + 1);
    out.windowSeat = !!seat;
    if (seat) {
      const dx = cx - seat.x, dz = cz - seat.z, L = Math.hypot(dx, dz);
      // outside point: from the seat move away from the room centre
      P.x = seat.x - dx / L * 3; P.z = seat.z - dz / L * 3; P.level = null;
      out.outsideBlocked = cb.col.blocked(P.x, P.z, 0.3);
      // walk toward each candidate door position along the window line until inside
      let inside = false;
      for (let tries = 0; tries < 40 && !inside; tries++) {
        const tx = cx, tz = cz;
        P.yaw = Math.atan2(-(tx - P.x), -(tz - P.z));
        a.controls.keys.add('w'); step(20); a.controls.keys.delete('w');
        a.interact.update(P);
        inside = !!a.interact.indoor;
        if (!inside) { // slide sideways along the front to find the door
          a.controls.keys.add('d'); step(10); a.controls.keys.delete('d');
        }
      }
      out.walkedInside = inside;
      // sit at the window seat
      P.x = seat.x + 0.5; P.z = seat.z; a.interact.update(P);
      out.prompt = a.interact.current?.label;
      a.interactNow(); out.seated = !!P.seat;
      a.controls.keys.add('w'); step(15); a.controls.keys.delete('w'); out.stoodUp = !P.seat;
    }
  }
  // every portal: go through and come back
  out.trips = [];
  for (const q of cb.portals.filter((q) => !q.level)) {
    P.level = null; P.x = q.x; P.z = q.z; a.interact.update(P);
    const label = a.interact.current?.label;
    a.interactNow(); for (let k = 0; k < 40 && P.level === null; k++) await wait(250); step(3);
    const lv = P.level, floor = +P.ground.toFixed(2), ind = a.interact.indoor?.kind || null;
    // walk around a bit on the level and make sure we stay inside its bounds
    a.controls.keys.add('w'); step(60); a.controls.keys.delete('w');
    const B = cb.levels[lv]?.col.bounds; const inB = B ? P.x >= B.minX - 0.01 && P.x <= B.maxX + 0.01 && P.z >= B.minZ - 0.01 && P.z <= B.maxZ + 0.01 : false;
    const back = cb.portals.find((x) => x.level === lv);
    P.x = back.x; P.z = back.z; a.interact.update(P); a.interactNow(); for (let k = 0; k < 40 && P.level !== null; k++) await wait(250); step(2);
    out.trips.push({ label, lv, floor, indoor: ind, stayedInBounds: inB, backOnStreet: P.level === null });
  }
  return out;
});
await p.waitForTimeout(300);
console.log(JSON.stringify(r, null, 1), errs);
await b.close();
