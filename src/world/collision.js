// 2D collision world (top-down). Buildings and props are oriented boxes or circles.
// The player and the scenic stroll use it; pedestrians stay on their sidewalk lanes instead.

export class CollisionWorld {
  constructor(cell = 8) {
    this.cell = cell;
    this.grid = new Map();
    this.shapes = [];
    this.bounds = null; // {minX,maxX,minZ,maxZ}
  }
  clear() { this.grid.clear(); this.shapes.length = 0; }
  _insert(s, minX, maxX, minZ, maxZ) {
    const c = this.cell;
    for (let gx = Math.floor(minX / c); gx <= Math.floor(maxX / c); gx++)
      for (let gz = Math.floor(minZ / c); gz <= Math.floor(maxZ / c); gz++) {
        const k = gx * 73856093 ^ gz * 19349663;
        let arr = this.grid.get(k);
        if (!arr) this.grid.set(k, arr = []);
        arr.push(s);
      }
  }
  /** Oriented rectangle: center, half extents, rotation (radians, about Y). */
  addBox(cx, cz, hx, hz, rot = 0, tag = null) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const s2 = { t: 0, cx, cz, hx, hz, c, s, tag };
    const ex = Math.abs(c) * hx + Math.abs(s) * hz, ez = Math.abs(s) * hx + Math.abs(c) * hz;
    this.shapes.push(s2);
    this._insert(s2, cx - ex, cx + ex, cz - ez, cz + ez);
    return s2;
  }
  /** Axis-aligned box from min/max. */
  addRect(x0, z0, x1, z1, tag = null) { return this.addBox((x0 + x1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0) / 2, Math.abs(z1 - z0) / 2, 0, tag); }
  addCircle(x, z, r, tag = null) {
    const s = { t: 1, x, z, r, tag };
    this.shapes.push(s);
    this._insert(s, x - r, x + r, z - r, z + r);
    return s;
  }
  query(x, z, r, out = []) {
    out.length = 0;
    const c = this.cell;
    const seen = new Set();
    for (let gx = Math.floor((x - r) / c); gx <= Math.floor((x + r) / c); gx++)
      for (let gz = Math.floor((z - r) / c); gz <= Math.floor((z + r) / c); gz++) {
        const arr = this.grid.get(gx * 73856093 ^ gz * 19349663);
        if (arr) for (const s of arr) if (!seen.has(s)) { seen.add(s); out.push(s); }
      }
    return out;
  }
  /** Push a circle out of all shapes. Returns corrected {x,z}. */
  resolve(x, z, r) {
    const list = this.query(x, z, r + 0.5);
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const s of list) {
        if (s.t === 1) {
          const dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz), m = s.r + r;
          if (d < m && d > 1e-6) { x = s.x + dx / d * m; z = s.z + dz / d * m; moved = true; }
        } else {
          // to local
          const dx = x - s.cx, dz = z - s.cz;
          const lx = dx * s.c + dz * s.s, lz = -dx * s.s + dz * s.c;
          const qx = Math.max(-s.hx, Math.min(s.hx, lx)), qz = Math.max(-s.hz, Math.min(s.hz, lz));
          let ox = lx - qx, oz = lz - qz;
          let d = Math.hypot(ox, oz);
          if (d < r) {
            let nx, nz, push;
            if (d > 1e-6) { nx = ox / d; nz = oz / d; push = r - d; }
            else { // center inside: push out along smallest axis
              const px = s.hx - Math.abs(lx), pz = s.hz - Math.abs(lz);
              if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; push = px + r; } else { nx = 0; nz = Math.sign(lz) || 1; push = pz + r; }
            }
            const nlx = lx + nx * push, nlz = lz + nz * push;
            x = s.cx + nlx * s.c - nlz * s.s; z = s.cz + nlx * s.s + nlz * s.c;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    if (this.bounds) {
      const b = this.bounds;
      x = Math.max(b.minX + r, Math.min(b.maxX - r, x));
      z = Math.max(b.minZ + r, Math.min(b.maxZ - r, z));
    }
    return { x, z };
  }
  blocked(x, z, r) {
    const list = this.query(x, z, r + 0.5);
    for (const s of list) {
      if (s.t === 1) { if (Math.hypot(x - s.x, z - s.z) < s.r + r) return true; }
      else {
        const dx = x - s.cx, dz = z - s.cz;
        const lx = dx * s.c + dz * s.s, lz = -dx * s.s + dz * s.c;
        const qx = Math.max(-s.hx, Math.min(s.hx, lx)), qz = Math.max(-s.hz, Math.min(s.hz, lz));
        if (Math.hypot(lx - qx, lz - qz) < r) return true;
      }
    }
    return false;
  }
}
