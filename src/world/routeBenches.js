// Benches along the guided walks, so every route has places to sit down and rest along the way.
// Placed against the building side of wide-enough sidewalks, facing the street, clear of the
// walking line and of anything already standing there.
import { routeNodes } from './cityBase.js';
import { bench } from './kit.js';

export function addRouteBenches(cb) {
  const G = cb.graph; if (!G?.nodes.length) return;
  const defs = cb.routes?.length ? cb.routes : (cb.routeHint ? [{ hint: cb.routeHint }] : []);
  const spacing = cb.def.benchSpacing ?? 60;
  const color = cb.def.benchColor;
  const placed = [];
  const near = (x, z, r) => placed.some(([px, pz]) => Math.hypot(px - x, pz - z) < r)
    || cb.seats.some((q) => Math.hypot(q.x - x, q.z - z) < r * 0.5)
    || (cb.placeStops || []).some((q) => Math.hypot(q.x - x, q.z - z) < 12)
    || (cb.keepClear || []).some(([kx, kz, kr]) => Math.hypot(kx - x, kz - z) < kr + 3);
  const indoor = (x, z) => (cb.indoors || []).some((q) => x > q.x0 - 1 && x < q.x1 + 1 && z > q.z0 - 1 && z < q.z1 + 1);
  for (const def of defs) {
    const route = routeNodes(G, def.hint);
    let since = spacing * 0.45; // first bench comes a little way into the walk
    for (let i = 0; i < route.length; i++) {
      const a = G.nodes[route[i]], b = G.nodes[route[(i + 1) % route.length]];
      const e = G.edgeBetween(a.id, b.id);
      if (!e) continue;
      if (e.kind !== 'walk' || !e.browse || e.len < 14) { since += e.len; continue; }
      const off = e.width / 2 - 0.5;
      if (off - 0.34 < 0.8) { since += e.len; continue; } // sidewalk too narrow to leave room to pass
      const dx = (b.x - a.x) / e.len, dz = (b.z - a.z) / e.len;
      const { nx, nz } = e.browse;
      // try a few spots along the block, away from the corners
      for (let t = 7; t <= e.len - 7; t += 3) {
        if (since + t < spacing) continue;
        const x = a.x + dx * t + nx * off, z = a.z + dz * t + nz * off;
        if (near(x, z, spacing * 0.5) || indoor(x, z)) continue;
        const yaw = Math.atan2(-nx, nz);
        // bench footprint and the space in front of it must be free
        let ok = true;
        for (const k of [-1.1, 0, 1.1]) {
          if (cb.col.blocked(x + dx * k, z + dz * k, 0.4) || cb.col.blocked(x + dx * k - nx * 0.7, z + dz * k - nz * 0.7, 0.3)) { ok = false; break; }
        }
        if (!ok) continue;
        bench(cb, x, z, yaw, { length: 2.2, color, label: 'bench' });
        placed.push([x, z]);
        since = -t;
        break;
      }
      since += e.len;
    }
  }
  return placed.length;
}
