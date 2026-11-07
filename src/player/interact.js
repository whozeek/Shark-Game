// Finds nearby places to pause (benches, stoops, café seats, viewpoints, shelters) and reports a prompt.
export class Interactions {
  constructor() { this.current = null; this.sheltered = false; }
  setCity(cb) { this.cb = cb; }
  update(player) {
    const cb = this.cb; if (!cb) return null;
    let best = null, bd = 2.4;
    const lv = player.level ? cb.levels[player.level] : null;
    // stairs and doors between levels take priority when you're right next to them
    for (const p of cb.portals || []) {
      if ((p.level || null) !== (player.level || null)) continue;
      const d = Math.hypot(p.x - player.x, p.z - player.z);
      if (d < 1.8 && !player.seat) { best = { type: 'portal', portal: p, label: p.label }; bd = 0; break; }
    }
    if (!player.seat && !best) {
      for (const s of (lv ? lv.seats : cb.seats)) {
        const d = Math.hypot(s.x - player.x, s.z - player.z);
        if (d < bd) { bd = d; best = { type: 'seat', seat: s, label: `Sit on the ${s.label}` }; }
      }
      if (!best && !lv) for (const v of cb.viewpoints || []) {
        const d = Math.hypot(v.x - player.x, v.z - player.z);
        if (d < 4) { best = { type: 'view', view: v, label: `Pause here: ${v.label}` }; break; }
      }
    } else if (player.seat) best = { type: 'stand', label: 'Stand up' };
    this.sheltered = false; this.indoor = null;
    if (lv) { this.indoor = lv.indoor ? { kind: lv.sound, name: lv.label } : null; if (!lv.indoor) this.sheltered = false; }
    else {
      for (const r of cb.indoors || []) if (player.x > r.x0 && player.x < r.x1 && player.z > r.z0 && player.z < r.z1) { this.indoor = r; break; }
      if (!this.indoor) for (const s of cb.shelters) if (player.x > s.x0 && player.x < s.x1 && player.z > s.z0 && player.z < s.z1) { this.sheltered = s.label; break; }
    }
    this.current = best;
    return best;
  }
}
