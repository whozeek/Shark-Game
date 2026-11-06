// Finds nearby places to pause (benches, stoops, café seats, viewpoints, shelters) and reports a prompt.
export class Interactions {
  constructor() { this.current = null; this.sheltered = false; }
  setCity(cb) { this.cb = cb; }
  update(player) {
    const cb = this.cb; if (!cb) return null;
    let best = null, bd = 2.4;
    if (!player.seat) {
      for (const s of cb.seats) {
        const d = Math.hypot(s.x - player.x, s.z - player.z);
        if (d < bd) { bd = d; best = { type: 'seat', seat: s, label: `Sit on the ${s.label}` }; }
      }
      if (!best) for (const v of cb.viewpoints || []) {
        const d = Math.hypot(v.x - player.x, v.z - player.z);
        if (d < 4) { best = { type: 'view', view: v, label: `Pause here: ${v.label}` }; break; }
      }
    } else best = { type: 'stand', label: 'Stand up' };
    this.sheltered = false;
    for (const s of cb.shelters) if (player.x > s.x0 && player.x < s.x1 && player.z > s.z0 && player.z < s.z1) { this.sheltered = s.label; break; }
    this.current = best;
    return best;
  }
}
