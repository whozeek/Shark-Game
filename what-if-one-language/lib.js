// Drawing kit for the "What If All Guns Vanished" video.
// Everything is drawn in a 1280x720 coordinate space.
const VW = 1280, VH = 720;
let ctx;
const FONT = 'Inter, "DejaVu Sans", sans-serif';

// ---------- math / timing ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const easeInOut = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const backOut = t => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const prog = (t, a, d) => clamp((t - a) / d);
const rad = d => d * Math.PI / 180;
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// fade window: 0 before a, ramps to 1 by a+fi, holds, ramps out over fo before b
function win(t, a, b, fi = .3, fo = .3) { return Math.min(prog(t, a, fi), 1 - prog(t, b - fo, fo)); }

// ---------- primitives ----------
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); ctx.fillStyle = c; ctx.fill(); }
function circle(x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
function ell(x, y, rx, ry, c) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
function line(x1, y1, x2, y2, w, c, cap = 'round') { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineCap = cap; ctx.stroke(); }
function poly(pts, c) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); }
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function vgrad(y1, y2, stops) { const g = ctx.createLinearGradient(0, y1, 0, y2); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; }
function sky(top, bottom, y2 = VH) { ctx.fillStyle = vgrad(0, y2, [top, bottom]); ctx.fillRect(0, 0, VW, y2); }
function alpha(a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
function text(s, x, y, size, c, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || 800} ${size}px ${FONT}`;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor || '#000'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur || 12; }
  ctx.fillStyle = c; ctx.fillText(s, x, y);
  ctx.restore();
}
function popText(s, x, y, size, c, p, o = {}) { // scale-in text
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = backOut(p); ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 3);
  text(s, 0, 0, size, c, o); ctx.restore();
}
function label(s, x, y, size, bg, fg, p = 1) { // pill label
  if (p <= 0) return;
  ctx.save(); ctx.font = `800 ${size}px ${FONT}`; const w = ctx.measureText(s).width + size * 1.2, h = size * 1.7;
  ctx.translate(x, y); const k = backOut(p); ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 3);
  fillRR(-w / 2, -h / 2, w, h, h / 2, bg); text(s, 0, 1, size, fg); ctx.restore();
}

// ---------- environment ----------
function cloud(x, y, s, c = 'rgba(255,255,255,.9)') {
  ell(x, y, 60 * s, 22 * s, c); circle(x - 25 * s, y - 12 * s, 24 * s, c); circle(x + 12 * s, y - 20 * s, 30 * s, c); circle(x + 38 * s, y - 6 * s, 20 * s, c);
}
function clouds(t, seed, n, y0, y1, c, speed = 8) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const s = .6 + r() * .9, y = lerp(y0, y1, r()); const x = ((r() * 1600 + t * speed * s) % 1600) - 160; cloud(x, y, s, c); }
}
function sun(x, y, r, c = '#ffe28a', glow = 'rgba(255,230,140,.35)') { circle(x, y, r * 1.8, glow); circle(x, y, r, c); }
function stars(seed, n, t, h = VH) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const x = r() * VW, y = r() * h, s = r() * 1.6 + .3, tw = .5 + .5 * Math.sin(t * 2 + i); circle(x, y, s, `rgba(255,255,255,${.4 + .6 * tw})`); }
}
const cityCache = {};
function city(seed, baseY, o = {}) {
  const key = seed + ':' + baseY;
  if (!cityCache[key]) {
    const r = rng(seed); const bs = []; let x = -20;
    while (x < VW + 20) { const w = (o.minW || 60) + r() * (o.varW || 80); const h = (o.minH || 120) + r() * (o.varH || 220); bs.push({ x, w, h, c: r(), win: r(), roof: r() }); x += w + (o.gap ?? 4); }
    cityCache[key] = bs;
  }
  const cols = o.colors || ['#6f8fb3', '#7d9cc0', '#5f7fa6', '#8aa8c9'];
  const night = o.night || 0;
  for (const b of cityCache[key]) {
    const c = cols[Math.floor(b.c * cols.length)];
    rect(b.x, baseY - b.h, b.w, b.h, c);
    if (b.roof > .7) rect(b.x + b.w * .3, baseY - b.h - 14, b.w * .4, 14, c);
    if (b.roof < .15) { line(b.x + b.w / 2, baseY - b.h, b.x + b.w / 2, baseY - b.h - 30, 2, c); }
    if (o.windows !== false) {
      const rr2 = rng(Math.floor(b.x * 13 + seed));
      for (let wy = baseY - b.h + 14; wy < baseY - 18; wy += 22) for (let wx = b.x + 8; wx < b.x + b.w - 14; wx += 18) {
        const lit = rr2() < (night ? .55 : .12);
        rect(wx, wy, 9, 12, lit ? (night ? '#ffd970' : 'rgba(255,255,255,.55)') : (o.winColor || 'rgba(20,40,70,.35)'));
      }
    }
  }
}
function street(baseY = 560, o = {}) {
  rect(0, baseY, VW, 50, o.walk || '#c9c3b8');
  for (let x = 0; x < VW; x += 80) line(x, baseY, x, baseY + 50, 2, 'rgba(0,0,0,.08)', 'butt');
  rect(0, baseY + 50, VW, 8, o.curb || '#9b958b');
  rect(0, baseY + 58, VW, VH - baseY - 58, o.road || '#45484f');
  for (let x = 20; x < VW; x += 120) rect(x, baseY + 108, 60, 6, o.lane || '#e9d76a');
}
function tree(x, y, s, c = '#3f9b52', trunk = '#7a5236') {
  rect(x - 5 * s, y - 40 * s, 10 * s, 40 * s, trunk); circle(x, y - 60 * s, 30 * s, c); circle(x - 20 * s, y - 45 * s, 20 * s, c); circle(x + 20 * s, y - 45 * s, 20 * s, c);
}
function pine(x, y, s, c = '#2f6b3f') {
  rect(x - 4 * s, y - 16 * s, 8 * s, 16 * s, '#5d3f27');
  for (let i = 0; i < 3; i++) poly([[x - (34 - i * 7) * s, y - (14 + i * 26) * s], [x + (34 - i * 7) * s, y - (14 + i * 26) * s], [x, y - (60 + i * 26) * s]], c);
}
function house(x, y, w, h, wall = '#e8c79a', roof = '#b5523b', o = {}) {
  rect(x, y - h, w, h, wall); poly([[x - 12, y - h], [x + w + 12, y - h], [x + w / 2, y - h - h * .6]], roof);
  rect(x + w * .4, y - h * .55, w * .2, h * .55, o.door || '#6b4428');
  rect(x + w * .1, y - h * .75, w * .2, h * .25, o.win || '#bfe3f5'); rect(x + w * .7, y - h * .75, w * .2, h * .25, o.win || '#bfe3f5');
}
function car(x, y, c, s = 1, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  fillRR(-60, -34, 120, 24, 8, c); fillRR(-36, -54, 66, 24, 10, c); rect(-30, -50, 26, 16, '#cfe8f5'); rect(0, -50, 24, 16, '#cfe8f5');
  circle(-34, -10, 12, '#222'); circle(34, -10, 12, '#222'); circle(-34, -10, 5, '#999'); circle(34, -10, 5, '#999'); rect(54, -30, 6, 6, '#ffe28a');
  ctx.restore();
}

// ---------- people ----------
const SKINS = ['#f2c9a0', '#e0a77a', '#c68642', '#8d5524', '#ffdbac', '#a8714a'];
const SHIRTS = ['#e85d5d', '#4c8ed9', '#f2b632', '#5cb85c', '#9b59b6', '#f07f3c', '#3bb3a8', '#e05297', '#2f3e6b'];
const HAIRS = ['#2b1b10', '#5a3418', '#111', '#c9a14a', '#8a4b20', '#777'];
const PANTS = ['#2f3b55', '#3b3b3b', '#5a4a3a', '#1f4f7a', '#46566e'];
function randPerson(r) {
  return { skin: SKINS[Math.floor(r() * SKINS.length)], shirt: SHIRTS[Math.floor(r() * SHIRTS.length)], hair: HAIRS[Math.floor(r() * HAIRS.length)], pants: PANTS[Math.floor(r() * PANTS.length)], long: r() < .4 };
}
// person(x, y=feet, scale, opts). Unit height ~108.
function person(x, y, s, o = {}) {
  const skin = o.skin || '#f2c9a0', shirt = o.shirt || '#4c8ed9', pants = o.pants || '#2f3b55', hair = o.hair || '#2b1b10';
  ctx.save(); ctx.translate(x, y - (o.jump || 0)); ctx.scale(s * (o.face || 1), s);
  if (o.lean) ctx.rotate(rad(o.lean));
  const ph = o.walk;
  const sw = ph != null ? Math.sin(ph) * 26 : (o.legSpread || 4);
  const bob = ph != null ? Math.abs(Math.cos(ph)) * 2 : 0;
  ctx.translate(0, -bob);
  // shadow
  if (!o.noShadow) ell(0, bob, 18, 4, 'rgba(0,0,0,.18)');
  // legs
  if (!o.noLegs) {
    const legL = 40;
    const lp = (a) => [Math.sin(rad(a)) * legL, -40 + Math.cos(rad(a)) * legL];
    const [ax, ay] = lp(sw), [bx, by] = lp(-sw);
    line(0, -40, bx, by, 10, shadeColor(pants, -15)); ell(bx + 3, by, 7, 4, '#222');
    line(0, -40, ax, ay, 10, pants); ell(ax + 3, ay, 7, 4, '#222');
  }
  const shoulder = [0, -74];
  const arm = (a, front) => {
    const L = 30, hx = Math.sin(rad(a)) * L, hy = -74 + Math.cos(rad(a)) * L;
    line(0, -74, hx, hy, 8, front ? (o.sleeve || shirt) : shadeColor(o.sleeve || shirt, -18)); circle(hx, hy, 5, skin);
    return [hx, hy, a];
  };
  let armB = o.armB ?? (ph != null ? -Math.sin(ph) * 30 : -8), armF = o.armF ?? (ph != null ? Math.sin(ph) * 30 : 8);
  const hb = arm(armB, false);
  if (o.back === 'rifle') drawRifle(-6, -60, 1, rad(-60), o.ghost);
  // torso
  fillRR(-13, -80, 26, 44, 9, shirt);
  if (o.vest) fillRR(-12, -76, 24, 30, 6, o.vest);
  if (o.coat) { rect(-13, -80, 26, 44, o.coat); line(0, -78, 0, -38, 1.5, 'rgba(0,0,0,.25)'); }
  if (o.badge) circle(6, -68, 3, '#f5cf4a');
  if (o.stripes) { for (let i = 0; i < 3; i++) rect(-13, -76 + i * 12, 26, 5, o.stripes); }
  // belt / holster
  if (o.belt) rect(-13, -42, 26, 5, '#222');
  if (o.holster) { fillRR(8, -44, 10, 16, 3, '#3a2a1a'); if (o.holster === 'gun') { fillRR(7, -50, 9, 9, 2, '#1d1d1d'); } }
  // head
  const hx = 0, hy = -96 + (o.headY || 0);
  if (o.long) { fillRR(-16, hy - 12, 28, 34, 10, hair); }
  circle(hx, hy, 15, skin);
  // hair
  if (!o.hat || o.hat === 'none') { ctx.beginPath(); ctx.arc(hx, hy - 2, 15.5, Math.PI * 1.02, Math.PI * 1.98); ctx.fillStyle = hair; ctx.fill(); if (o.long) rect(-16, hy - 6, 6, 18, hair); }
  drawHat(o.hat, hx, hy, o.hatColor);
  if (o.mask) { ctx.beginPath(); ctx.arc(hx, hy, 15.5, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill(); rect(-10, hy - 6, 22, 7, skin); }
  face(hx + 3, hy, o.mood || 'neutral');
  // front arm + item
  const hf = arm(armF, true);
  if (o.hold) holdItem(o.hold, hf[0], hf[1], armF, o);
  ctx.restore();
}
function shadeColor(c, p) {
  if (c[0] !== '#' || c.length !== 7) return c;
  const n = parseInt(c.slice(1), 16); const f = v => clamp(Math.round(v * (100 + p) / 100), 0, 255);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function face(x, y, mood) {
  const eye = '#1a1a1a';
  if (mood === 'happy' || mood === 'joy') {
    ctx.lineWidth = 2; ctx.strokeStyle = eye; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x - 5, y - 2, 2.5, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 5, y - 2, 2.5, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + 4, mood === 'joy' ? 6 : 5, 0, Math.PI); ctx.fillStyle = mood === 'joy' ? '#7a2b2b' : 'transparent'; ctx.fill(); ctx.stroke();
    return;
  }
  const big = mood === 'shock';
  circle(x - 5, y - 2, big ? 3.2 : 2.2, eye); circle(x + 5, y - 2, big ? 3.2 : 2.2, eye);
  ctx.lineWidth = 2; ctx.strokeStyle = eye; ctx.lineCap = 'round';
  if (mood === 'shock') { ell(x, y + 7, 3.5, 4.5, '#5a2020'); line(x - 8, y - 9, x - 3, y - 10, 2, eye); line(x + 3, y - 10, x + 8, y - 9, 2, eye); }
  else if (mood === 'sad') { ctx.beginPath(); ctx.arc(x, y + 9, 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); line(x - 8, y - 7, x - 3, y - 9, 1.8, eye); line(x + 3, y - 9, x + 8, y - 7, 1.8, eye); }
  else if (mood === 'worried') { ctx.beginPath(); ctx.moveTo(x - 4, y + 6); ctx.quadraticCurveTo(x - 1, y + 4, x + 1, y + 6); ctx.quadraticCurveTo(x + 3, y + 8, x + 5, y + 6); ctx.stroke(); line(x - 8, y - 7, x - 3, y - 9, 1.8, eye); line(x + 3, y - 9, x + 8, y - 7, 1.8, eye); }
  else if (mood === 'angry') { line(x - 8, y - 9, x - 3, y - 6, 2, eye); line(x + 3, y - 6, x + 8, y - 9, 2, eye); line(x - 3, y + 6, x + 3, y + 6, 2, eye); }
  else if (mood === 'confused') { line(x - 8, y - 8, x - 3, y - 8, 1.8, eye); line(x + 3, y - 11, x + 8, y - 9, 1.8, eye); line(x - 3, y + 6, x + 4, y + 5, 2, eye); }
  else { line(x - 3, y + 6, x + 3, y + 6, 2, eye); }
}
function drawHat(h, x, y, col) {
  if (!h || h === 'none') return;
  if (h === 'police') { fillRR(x - 16, y - 20, 32, 10, 3, col || '#1d2a4a'); rect(x - 17, y - 12, 34, 4, '#111'); rect(x + 4, y - 11, 14, 3, '#111'); circle(x, y - 15, 2.5, '#f5cf4a'); }
  else if (h === 'helmet' || h === 'blue') { ctx.beginPath(); ctx.arc(x, y - 4, 17.5, Math.PI, 0); ctx.fillStyle = col || (h === 'blue' ? '#3d8de0' : '#4d5b33'); ctx.fill(); rect(x - 19, y - 5, 38, 4, col || (h === 'blue' ? '#2f6fb3' : '#3d4a28')); }
  else if (h === 'cap') { ctx.beginPath(); ctx.arc(x, y - 4, 16, Math.PI, 0); ctx.fillStyle = col || '#f07f3c'; ctx.fill(); rect(x + 8, y - 6, 14, 4, col || '#f07f3c'); }
  else if (h === 'cowboy') { ell(x, y - 10, 26, 5, col || '#8a5a2b'); fillRR(x - 12, y - 26, 24, 16, 5, col || '#8a5a2b'); }
  else if (h === 'beanie') { ctx.beginPath(); ctx.arc(x, y - 4, 16, Math.PI, 0); ctx.fillStyle = col || '#222'; ctx.fill(); }
  else if (h === 'hardhat') { ctx.beginPath(); ctx.arc(x, y - 5, 16, Math.PI, 0); ctx.fillStyle = '#f2c230'; ctx.fill(); rect(x - 20, y - 6, 40, 4, '#e0ae1a'); }
}
function drawPistol(x, y, s = 1, a = 0, ghost) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); if (ghost) ctx.globalAlpha *= ghost;
  fillRR(-2, -4, 20, 7, 2, '#1d1d1d'); fillRR(-2, 0, 7, 12, 2, '#2a2a2a'); ctx.restore();
}
function drawRifle(x, y, s = 1, a = 0, ghost) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); if (ghost) ctx.globalAlpha *= ghost;
  fillRR(-30, -3, 70, 6, 2, '#262626'); fillRR(-36, -4, 18, 10, 3, '#6b4428'); fillRR(0, 2, 6, 10, 2, '#262626'); ctx.restore();
}
function holdItem(item, hx, hy, armA, o) {
  const a = rad(90 - armA);
  if (item === 'phone') { ctx.save(); ctx.translate(hx, hy); fillRR(-4, -14, 10, 16, 2, '#222'); fillRR(-2.5, -12.5, 7, 11, 1, o.glow ? '#9fe3ff' : '#4a6a8a'); ctx.restore(); if (o.glow) circle(hx + 1, hy - 7, 14, 'rgba(160,230,255,.25)'); }
  else if (item === 'pistol') drawPistol(hx, hy, 1, a - Math.PI / 2 + Math.PI / 2, o.ghost);
  else if (item === 'rifle') drawRifle(hx + 8, hy - 2, 1, -.15, o.ghost);
  else if (item === 'bat') { line(hx, hy, hx + 8, hy - 40, 6, '#c8955a'); }
  else if (item === 'baton') { line(hx, hy, hx + 22, hy - 22, 5, '#1a1a1a'); }
  else if (item === 'taser') { fillRR(hx - 2, hy - 8, 16, 9, 2, '#f2d21b'); }
  else if (item === 'bow') { ctx.beginPath(); ctx.arc(hx + 2, hy, 28, -1.2, 1.2); ctx.lineWidth = 3.5; ctx.strokeStyle = '#7a4a24'; ctx.stroke(); line(hx + 2 + Math.cos(-1.2) * 28, hy + Math.sin(-1.2) * 28, hx + 2 + Math.cos(1.2) * 28, hy + Math.sin(1.2) * 28, 1, '#ddd'); }
  else if (item === 'bag') { fillRR(hx - 12, hy, 24, 26, 8, '#d9d0b8'); text('$', hx, hy + 14, 14, '#555'); }
  else if (item === 'box') { fillRR(hx - 16, hy - 16, 32, 24, 2, '#c9a26b'); line(hx - 16, hy - 10, hx + 16, hy - 10, 1, 'rgba(0,0,0,.2)'); }
  else if (item === 'knife') { line(hx, hy, hx + 6, hy - 6, 4, '#3a2a1a'); line(hx + 6, hy - 6, hx + 18, hy - 18, 3, '#cfd6dc'); }
  else if (item === 'sign') { line(hx, hy, hx, hy - 60, 3, '#7a5236'); fillRR(hx - 40, hy - 92, 80, 40, 4, o.signColor || '#fff'); text(o.signText || '', hx, hy - 72, 11, '#222', { weight: 900 }); }
  else if (item === 'flag') { line(hx, hy + 10, hx, hy - 60, 3, '#555'); rect(hx, hy - 60, 40, 26, o.flagColor || '#5cb85c'); }
  else if (item === 'shield') { fillRR(hx - 4, hy - 30, 22, 50, 6, 'rgba(180,220,255,.6)'); }
  else if (item === 'spray') { fillRR(hx - 3, hy - 14, 8, 16, 2, '#d9342b'); }
  else if (item === 'briefcase') { fillRR(hx - 12, hy, 24, 18, 3, '#5a3a22'); }
  else if (item === 'paper') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.2); rect(-2, -14, 18, 22, '#fff'); ctx.restore(); }
}
// upper-body only (for behind counters / couches / tables)
function bust(x, y, s, o = {}) { ctx.save(); ctx.beginPath(); ctx.rect(x - 200, y - 400, 400, 400 + (o.cut ?? 0)); ctx.clip(); person(x, y + 36 * s, s, { ...o, noShadow: true }); ctx.restore(); }
function emote(x, y, str, p, c = '#fff', bg = '#222') {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = backOut(p); ctx.scale(k, k);
  const w = Math.max(40, str.length * 18 + 16);
  fillRR(-w / 2, -24, w, 44, 14, bg); poly([[-6, 18], [6, 18], [-2, 30]], bg);
  text(str, 0, -1, 28, c, { weight: 900 }); ctx.restore();
}

// ---------- effects ----------
function puff(x, y, p, size = 1, seed = 1) {
  if (p <= 0 || p >= 1) return;
  const r = rng(seed);
  ctx.save();
  for (let i = 0; i < 9; i++) {
    const ang = r() * Math.PI * 2, d = easeOut(p) * (20 + r() * 26) * size;
    const rr2 = (8 + r() * 12) * size * (0.5 + p);
    ctx.globalAlpha = (1 - p) * .9;
    circle(x + Math.cos(ang) * d, y + Math.sin(ang) * d - p * 10 * size, rr2, i % 2 ? '#ffffff' : '#dfe6ee');
  }
  // sparkles
  for (let i = 0; i < 6; i++) {
    const ang = r() * Math.PI * 2, d = easeOut(p) * (36 + r() * 30) * size;
    ctx.globalAlpha = (1 - p);
    star4(x + Math.cos(ang) * d, y + Math.sin(ang) * d, (4 + r() * 5) * size * (1 - p * .5), '#fff6b0');
  }
  ctx.restore();
}
function star4(x, y, r, c) { poly([[x, y - r], [x + r * .28, y - r * .28], [x + r, y], [x + r * .28, y + r * .28], [x, y + r], [x - r * .28, y + r * .28], [x - r, y], [x - r * .28, y - r * .28]], c); }
function confetti(t, seed, n, a = 1) {
  const r = rng(seed); const cs = ['#ff5a5a', '#ffd23f', '#3bceac', '#4c8ed9', '#ee4266', '#a05cff'];
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < n; i++) {
    const x0 = r() * VW, sp = 60 + r() * 90, ph = r() * 10; const y = ((r() * VH + t * sp) % (VH + 40)) - 20;
    const x = x0 + Math.sin(t * 2 + ph) * 20; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + ph); rect(-4, -2, 8, 5, cs[i % cs.length]); ctx.restore();
  }
  ctx.restore();
}
function flash(a, c = '#fff') { if (a > 0) { ctx.save(); ctx.globalAlpha = clamp(a); rect(0, 0, VW, VH, c); ctx.restore(); } }
function vignette(a = .45) { const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * .35, VW / 2, VH / 2, VH * .95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }
function cross(x, y, s, c = '#e63946', p = 1) { if (p <= 0) return; const k = backOut(p) * s; line(x - k, y - k, x + k, y + k, s * .45, c); line(x + k, y - k, x - k, y + k, s * .45, c); }
function check(x, y, s, c = '#2ecc71', p = 1) { if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(backOut(p), backOut(p)); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * .3, s * .7); ctx.lineTo(s, -s * .7); ctx.lineWidth = s * .4; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
function arrow(x1, y1, x2, y2, w, c) { line(x1, y1, x2, y2, w, c); const a = Math.atan2(y2 - y1, x2 - x1); poly([[x2 + Math.cos(a) * w * 1.6, y2 + Math.sin(a) * w * 1.6], [x2 + Math.cos(a + 2.3) * w * 2.2, y2 + Math.sin(a + 2.3) * w * 2.2], [x2 + Math.cos(a - 2.3) * w * 2.2, y2 + Math.sin(a - 2.3) * w * 2.2]], c); }
function card(x, y, w, h, bg = '#fff', p = 1) { if (p <= 0) return false; ctx.save(); ctx.translate(x + w / 2, y + h / 2); const k = backOut(p); ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 3); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6; fillRR(-w / 2, -h / 2, w, h, 18, bg); ctx.restore(); return true; }
function withCard(x, y, w, h, p, bg, fn) { if (p <= 0) return; ctx.save(); ctx.translate(x + w / 2, y + h / 2); const k = backOut(p); ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 3); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6; fillRR(-w / 2, -h / 2, w, h, 18, bg); ctx.restore(); ctx.translate(-w / 2, -h / 2); fn(w, h); ctx.restore(); }

// ---------- animals & machines ----------
function deer(x, y, s, face = 1, c = '#a8703f') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  for (const lx of [-22, -14, 14, 22]) line(lx, -30, lx, 0, 4, shadeColor(c, -20));
  ell(0, -36, 30, 13, c); line(24, -42, 34, -64, 9, c); ell(40, -66, 11, 7, c); circle(43, -68, 1.8, '#111');
  line(32, -72, 28, -90, 2.5, '#6b4a2a'); line(29, -84, 22, -92, 2, '#6b4a2a'); line(36, -72, 40, -90, 2.5, '#6b4a2a'); line(39, -84, 46, -92, 2, '#6b4a2a');
  ell(-30, -42, 5, 4, '#fff'); ctx.restore();
}
function boar(x, y, s, face = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  for (const lx of [-16, -8, 10, 18]) line(lx, -14, lx, 0, 4, '#3d2b20');
  ell(0, -22, 26, 14, '#5a4030'); ell(26, -20, 10, 9, '#5a4030'); ell(35, -18, 4, 5, '#3d2b20'); circle(27, -24, 1.6, '#111'); line(30, -14, 34, -20, 2, '#eee'); ctx.restore();
}
function wolf(x, y, s, face = 1, c = '#6e6e78') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  for (const lx of [-18, -10, 12, 20]) line(lx, -20, lx, 0, 4, shadeColor(c, -25));
  ell(0, -26, 28, 11, c); poly([[-26, -30], [-50, -38], [-30, -22]], c); ell(28, -32, 11, 9, c); poly([[34, -34], [50, -28], [34, -26]], c);
  poly([[22, -38], [25, -50], [30, -38]], c); circle(31, -34, 2, '#ffde59'); ctx.restore();
}
function sheep(x, y, s, face = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  for (const lx of [-12, -5, 6, 13]) line(lx, -14, lx, 0, 3.5, '#333');
  for (const [cx, cy] of [[-12, -24], [0, -28], [12, -24], [-6, -18], [8, -18]]) circle(cx, cy, 11, '#f4f4f0'); ell(22, -26, 7, 9, '#333'); circle(24, -28, 1.5, '#fff'); ctx.restore();
}
function dove(x, y, s, t, face = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  const f = Math.sin(t * 14) * .7;
  ell(0, 0, 18, 8, '#fff'); circle(16, -4, 6, '#fff'); poly([[21, -4], [27, -2], [21, -1]], '#f2a33a');
  ctx.save(); ctx.rotate(-f); poly([[-4, -2], [-12, -30], [8, -4]], '#f0f4f8'); ctx.restore(); poly([[-16, 0], [-28, -6], [-28, 6]], '#fff');
  ctx.restore();
}
function tank(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face || 1), s);
  const c = o.color || '#5f6b3a';
  fillRR(-90, -36, 180, 36, 18, '#333'); for (let i = -70; i <= 70; i += 28) circle(i, -18, 11, '#555');
  fillRR(-80, -62, 160, 30, 8, c); fillRR(-40, -92, 80, 32, 12, shadeColor(c, 10));
  if (o.barrel !== false) { ctx.globalAlpha *= (o.barrelA ?? 1); fillRR(30, -82, 100, 10, 3, shadeColor(c, -10)); }
  ctx.restore();
}
function drone(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  fillRR(-16, -6, 32, 12, 5, '#3a3f47'); line(-16, 0, -34, -10, 3, '#3a3f47'); line(16, 0, 34, -10, 3, '#3a3f47');
  const sp = Math.abs(Math.sin(t * 40)) * 14 + 4; ell(-34, -12, sp, 2, 'rgba(200,200,200,.8)'); ell(34, -12, sp, 2, 'rgba(200,200,200,.8)');
  circle(0, 4, 3, (Math.floor(t * 3) % 2) ? '#ff4040' : '#600'); ctx.restore();
}
function tv(x, y, w, h, fn) {
  fillRR(x - 10, y - 10, w + 20, h + 20, 10, '#1b1b1f'); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); fn(x, y, w, h); ctx.restore();
  rect(x + w / 2 - 6, y + h + 10, 12, 30, '#1b1b1f'); fillRR(x + w / 2 - 60, y + h + 36, 120, 8, 4, '#1b1b1f');
}

// ---------- world map ----------
const CONTINENTS = [
  [[-168, 66], [-160, 70], [-140, 70], [-120, 72], [-95, 72], [-80, 68], [-62, 60], [-55, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 30], [-80, 25], [-82, 28], [-90, 30], [-97, 26], [-97, 20], [-90, 16], [-84, 12], [-80, 8], [-85, 12], [-92, 15], [-105, 20], [-112, 28], [-117, 32], [-122, 37], [-124, 42], [-124, 48], [-133, 56], [-145, 60], [-155, 58], [-165, 60]],
  [[-55, 60], [-45, 60], [-20, 70], [-20, 80], [-40, 83], [-60, 80], [-70, 77], [-55, 70]],
  [[-80, 8], [-75, 11], [-62, 11], [-50, 2], [-35, -5], [-38, -13], [-40, -22], [-48, -27], [-58, -35], [-63, -40], [-66, -55], [-72, -50], [-74, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [0, 50], [5, 53], [8, 57], [5, 62], [12, 66], [20, 70], [30, 71], [40, 67], [42, 60], [40, 45], [30, 45], [28, 41], [22, 40], [20, 37], [15, 40], [12, 44], [8, 44], [3, 42], [0, 38], [-5, 36]],
  [[28, 41], [36, 36], [35, 30], [43, 13], [52, 15], [58, 22], [60, 25], [67, 25], [72, 20], [77, 8], [80, 15], [88, 22], [92, 22], [98, 16], [100, 8], [103, 1], [105, 10], [108, 15], [108, 21], [118, 24], [122, 30], [120, 37], [122, 40], [128, 35], [130, 43], [140, 48], [142, 54], [155, 59], [162, 62], [178, 65], [180, 69], [150, 72], [120, 74], [100, 77], [80, 73], [70, 70], [60, 69], [50, 68], [42, 60], [40, 45], [30, 45]],
  [[-17, 21], [-17, 15], [-12, 7], [-5, 5], [8, 4], [10, 0], [13, -10], [12, -18], [18, -34], [26, -34], [33, -26], [40, -15], [40, -3], [51, 12], [43, 12], [36, 22], [33, 31], [20, 32], [10, 37], [-5, 36], [-10, 30]],
  [[114, -22], [122, -17], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -34], [129, -32], [115, -34]],
  [[-6, 50], [2, 51], [0, 54], [-3, 59], [-6, 57]],
  [[130, 31], [141, 35], [142, 42], [140, 41], [135, 34]],
  [[95, 5], [105, -6], [115, -8], [120, -9], [110, -3], [100, 2]],
  [[44, -25], [49, -15], [50, -13], [47, -25]],
  [[167, -46], [174, -41], [178, -38], [173, -35], [172, -41]],
];
function inPoly(pt, vs) { let x = pt[0], y = pt[1], inside = false; for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) { const xi = vs[i][0], yi = vs[i][1], xj = vs[j][0], yj = vs[j][1]; if (((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside; } return inside; }
const LAND_PTS = (() => { const r = rng(42), pts = []; while (pts.length < 260) { const p = [r() * 360 - 180, r() * 140 - 60]; if (CONTINENTS.some(c => inPoly(p, c))) pts.push(p); } return pts; })();
function mapXY(lon, lat, x, y, w, h) { return [x + (lon + 180) / 360 * w, y + (85 - lat) / 145 * h]; }
function worldMap(x, y, w, h, fill = '#5fae6b', stroke = null, fillFn) {
  CONTINENTS.forEach((c, i) => { poly(c.map(p => mapXY(p[0], p[1], x, y, w, h)), fillFn ? fillFn(i) : fill); if (stroke) { ctx.lineWidth = 1.5; ctx.strokeStyle = stroke; ctx.stroke(); } });
}
function globe(cx, cy, R, lon0, lat0 = 15, o = {}) {
  const g = ctx.createRadialGradient(cx - R * .35, cy - R * .35, R * .1, cx, cy, R);
  g.addColorStop(0, o.ocean1 || '#4fb3ff'); g.addColorStop(1, o.ocean2 || '#1b4f9c');
  circle(cx, cy, R * 1.08, o.atmo || 'rgba(120,190,255,.18)');
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  const p0 = rad(lat0);
  const proj = (lon, lat) => { const l = rad(lon - lon0), p = rad(lat); let X = Math.cos(p) * Math.sin(l), Y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l); const cc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l); if (cc < 0) { const n = Math.hypot(X, Y) || 1; X /= n; Y /= n; } return [cx + X * R, cy - Y * R, cc]; };
  CONTINENTS.forEach((c, i) => {
    const pts = []; for (let k = 0; k < c.length; k++) { const a = c[k], b = c[(k + 1) % c.length]; for (let s = 0; s < 4; s++) pts.push(proj(lerp(a[0], b[0], s / 4), lerp(a[1], b[1], s / 4))); }
    if (pts.every(p => p[2] < 0)) return;
    poly(pts, o.land ? o.land(i) : '#5cbf6a');
  });
  if (o.dots) o.dots(proj);
  // shading
  const sh = ctx.createRadialGradient(cx - R * .4, cy - R * .4, R * .2, cx, cy, R * 1.05); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(.7, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,30,.45)');
  ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.restore();
}
