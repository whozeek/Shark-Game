// North-up neighbourhood overview centred on the walker, with the stroll route when active.
export class Minimap {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.range = 120; // metres from centre to edge
  }
  resize() {
    const r = this.cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(60, Math.round(r.width * dpr)), h = Math.max(60, Math.round(r.height * dpr));
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
  }
  draw(cb, player, yaw, stroll, colors = {}) {
    if (!cb) return;
    this.resize();
    const c = this.ctx, W = this.cv.width, H = this.cv.height;
    const s = W / (this.range * 2);
    const px = player.x, pz = player.z;
    const T = (x, z) => [(x - px) * s + W / 2, (z - pz) * s + H / 2];
    c.fillStyle = colors.bg || '#141824'; c.fillRect(0, 0, W, H);
    const fills = { road: '#2b3040', block: '#4a4540', blockOuter: '#3a3632', park: '#2f4a33', water: '#20405a', beach: '#6a6050', plaza: '#5a5650', bridge: '#3a3f50', rail: '#5a4a3a' };
    const order = ['water', 'beach', 'road', 'blockOuter', 'block', 'plaza', 'park', 'bridge', 'rail'];
    for (const type of order) {
      c.fillStyle = fills[type];
      for (const sh of cb.minimap) {
        if (sh.type !== type) continue;
        c.beginPath();
        sh.pts.forEach(([x, z], i) => { const [X, Y] = T(x, z); if (i) c.lineTo(X, Y); else c.moveTo(X, Y); });
        c.closePath(); c.fill();
      }
    }
    // route
    if (stroll && stroll.active && stroll.pts?.length) {
      c.strokeStyle = 'rgba(255, 184, 107, 0.9)'; c.lineWidth = Math.max(2, W / 80); c.setLineDash([W / 40, W / 60]);
      c.beginPath();
      stroll.pts.forEach((n, i) => { const [X, Y] = T(n.x, n.z); if (i) c.lineTo(X, Y); else c.moveTo(X, Y); });
      c.closePath(); c.stroke(); c.setLineDash([]);
    }
    // seats & viewpoints
    c.fillStyle = 'rgba(143, 211, 255, 0.8)';
    for (const v of cb.viewpoints || []) { const [X, Y] = T(v.x, v.z); c.beginPath(); c.arc(X, Y, W / 70, 0, 7); c.fill(); }
    // player arrow (camera faces -z when yaw = 0)
    const [cx, cy] = [W / 2, H / 2];
    c.save(); c.translate(cx, cy); c.rotate(-yaw);
    const a = W / 16;
    c.fillStyle = 'rgba(255, 184, 107, 0.22)';
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, a * 3, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); c.closePath(); c.fill();
    c.fillStyle = '#ffb86b'; c.strokeStyle = '#1a1206'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -a); c.lineTo(a * 0.7, a * 0.8); c.lineTo(0, a * 0.4); c.lineTo(-a * 0.7, a * 0.8); c.closePath(); c.fill(); c.stroke();
    c.restore();
    // north marker
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = `${Math.round(W / 14)}px sans-serif`; c.textAlign = 'center'; c.fillText('N', W / 2, W / 12);
  }
}
