// Procedural textures painted on canvases at load time — no external image files are needed,
// which keeps the app fully original and license-clean.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';

const anisotropy = { value: 8 };
export function setAnisotropy(v) { anisotropy.value = v; }

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: false })];
}

function finishCanvasTex(c, { srgb = true, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = anisotropy.value;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

// Combine a colour canvas and a glass-mask canvas into one RGBA texture (alpha = glass).
function combineMask(colorCanvas, maskCanvas, repeat = true) {
  const w = colorCanvas.width, h = colorCanvas.height;
  const cd = colorCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const md = maskCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const src = y * w * 4, dst = (h - 1 - y) * w * 4; // flip rows: canvas top → v=1
    for (let x = 0; x < w * 4; x += 4) {
      out[dst + x] = cd[src + x];
      out[dst + x + 1] = cd[src + x + 1];
      out[dst + x + 2] = cd[src + x + 2];
      out[dst + x + 3] = md[src + x];
    }
  }
  const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = anisotropy.value;
  t.needsUpdate = true;
  return t;
}

const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
function shade(hex, f) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return '#' + c.getHexString();
}
function jitterColor(hex, rng, amt = 0.08) {
  const c = new THREE.Color(hex);
  const hslv = {}; c.getHSL(hslv);
  c.setHSL(hslv.h + (rng.f() - 0.5) * amt * 0.3, Math.min(1, Math.max(0, hslv.s + (rng.f() - 0.5) * amt)), Math.min(1, Math.max(0, hslv.l + (rng.f() - 0.5) * amt)));
  return '#' + c.getHexString();
}

// ---------------------------------------------------------------- wall materials
function paintWall(ctx, W, H, ppm, o, rng) {
  const { wall, color, mortar } = o;
  if (wall === 'brick') {
    ctx.fillStyle = mortar || '#8a8073';
    ctx.fillRect(0, 0, W, H);
    const ch = 0.076 * ppm, bw = 0.215 * ppm;
    let row = 0;
    for (let y = 0; y < H; y += ch, row++) {
      const off = (row % 2) * bw * 0.5;
      for (let x = -bw; x < W + bw; x += bw) {
        ctx.fillStyle = jitterColor(color, rng, 0.12);
        ctx.fillRect(x + off + 0.6, y + 0.6, bw - 1.4, ch - 1.4);
      }
    }
  } else if (wall === 'stone') {
    ctx.fillStyle = shade(color, 0.8); ctx.fillRect(0, 0, W, H);
    const ch = 0.42 * ppm, bw = 0.9 * ppm;
    let row = 0;
    for (let y = 0; y < H; y += ch, row++) {
      const off = (row % 2) * bw * 0.5;
      for (let x = -bw; x < W + bw; x += bw) {
        ctx.fillStyle = jitterColor(color, rng, 0.05);
        ctx.fillRect(x + off + 1, y + 1, bw - 2, ch - 2);
      }
    }
  } else if (wall === 'wood') {
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
    const pw = 0.18 * ppm;
    for (let x = 0; x < W; x += pw) {
      ctx.fillStyle = jitterColor(color, rng, 0.07);
      ctx.fillRect(x, 0, pw - 1.5, H);
    }
  } else if (wall === 'siding') {
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
    const ph = 0.2 * ppm;
    for (let y = 0; y < H; y += ph) {
      ctx.fillStyle = shade(color, 0.8); ctx.fillRect(0, y + ph - 2, W, 2);
    }
  } else { // stucco / concrete / panel
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 2500; i++) {
      ctx.fillStyle = `rgba(${rng.f() < 0.5 ? '0,0,0' : '255,255,255'},${rng.f() * 0.05})`;
      const s = rng.range(1, 6);
      ctx.fillRect(rng.f() * W, rng.f() * H, s, s);
    }
    if (wall === 'concrete' || wall === 'panel') {
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
      const pw = (wall === 'panel' ? 1.4 : 2.8) * ppm;
      for (let x = 0; x < W; x += pw) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 1.6 * ppm) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
  }
  // Rain streaks and grime
  for (let i = 0; i < 70; i++) {
    const x = rng.f() * W, y = rng.f() * H, l = rng.range(0.5, 3) * ppm;
    const g = ctx.createLinearGradient(x, y, x, y + l);
    g.addColorStop(0, 'rgba(0,0,0,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, rng.range(2, 8), l);
  }
}

function drawInterior(e, x, y, w, h, rng, lit, tint) {
  // e: emissive ctx. Draw lit room behind glass.
  if (!lit) { e.fillStyle = '#000'; e.fillRect(x, y, w, h); return; }
  const warm = tint === 'cool' ? rng.chance(0.75) === false : (tint === 'mixed' ? rng.chance(0.6) : rng.chance(0.9));
  const hue = warm ? rng.range(24, 42) : rng.range(190, 220);
  const sat = warm ? rng.range(70, 95) : rng.range(15, 40);
  const lig = rng.range(38, 62) * (rng.chance(0.25) ? 0.55 : 1);
  const g = e.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, hsl(hue, sat, lig * 0.75));
  g.addColorStop(0.5, hsl(hue, sat, lig));
  g.addColorStop(1, hsl(hue, sat, lig * 0.55));
  e.fillStyle = g; e.fillRect(x, y, w, h);
  const r = rng.f();
  if (r < 0.35) { // curtains
    e.fillStyle = hsl(hue, sat * 0.8, Math.min(85, lig * 1.35));
    e.fillRect(x, y, w * rng.range(0.12, 0.3), h);
    e.fillRect(x + w * (1 - rng.range(0.12, 0.3)), y, w, h);
  } else if (r < 0.55) { // blinds
    e.fillStyle = 'rgba(0,0,0,0.35)';
    const n = Math.floor(h / 4);
    for (let i = 0; i < n; i++) e.fillRect(x, y + i * 4, w, 1.5);
  }
  if (rng.chance(0.35)) { // plant silhouette
    e.fillStyle = 'rgba(10,8,6,0.85)';
    const px = x + w * rng.range(0.15, 0.85), py = y + h;
    for (let i = 0; i < 6; i++) { e.beginPath(); e.ellipse(px + rng.range(-w * 0.12, w * 0.12), py - h * rng.range(0.15, 0.35), w * 0.08, h * 0.08, 0, 0, Math.PI * 2); e.fill(); }
    e.fillRect(px - w * 0.06, py - h * 0.15, w * 0.12, h * 0.15);
  }
  if (rng.chance(0.25)) { // lamp
    e.fillStyle = hsl(hue, 90, 80);
    const lx = x + w * rng.range(0.2, 0.8);
    e.beginPath(); e.moveTo(lx - w * 0.1, y + h * 0.55); e.lineTo(lx + w * 0.1, y + h * 0.55); e.lineTo(lx + w * 0.06, y + h * 0.42); e.lineTo(lx - w * 0.06, y + h * 0.42); e.fill();
  }
  if (rng.chance(0.12)) { // person silhouette
    e.fillStyle = 'rgba(8,6,6,0.8)';
    const px = x + w * rng.range(0.3, 0.7);
    e.beginPath(); e.arc(px, y + h * 0.35, w * 0.07, 0, Math.PI * 2); e.fill();
    e.fillRect(px - w * 0.11, y + h * 0.43, w * 0.22, h * 0.6);
  }
}

/**
 * Upper-floor façade tile. Returns { map (alpha=glass), emissive, tileW, tileH }.
 */
export function makeFacade(o) {
  const rng = new RNG(o.seed || 1);
  const bays = o.bays || 4, floors = o.floors || 4;
  const bayW = o.bayW || 2.8, floorH = o.floorH || 3.2;
  const tileW = bays * bayW, tileH = floors * floorH;
  const W = o.size || 1024; const ppm = W / tileW;
  const H = Math.round(tileH * ppm);
  const [cc, c] = canvas(W, H);
  const [mc, m] = canvas(W, H);
  const [ec, e] = canvas(W, H);
  m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const style = o.windowStyle || 'sash';
  const trim = o.trim || '#e8e2d6';
  const lit = o.litRatio ?? 0.45;
  const tint = o.lightTint || 'warm';

  if (o.wall === 'glass') {
    // curtain wall
    c.fillStyle = o.color; c.fillRect(0, 0, W, H);
    m.fillStyle = '#fff'; m.fillRect(0, 0, W, H);
    const mull = o.mullion || '#2a2e35';
    for (let j = 0; j < floors; j++) {
      const y0 = j * floorH * ppm;
      const floorLit = rng.f() < lit;
      for (let i = 0; i < bays * 2; i++) {
        const x0 = i * bayW * 0.5 * ppm;
        const g = c.createLinearGradient(x0, y0, x0, y0 + floorH * ppm);
        g.addColorStop(0, shade(o.color, 1.15)); g.addColorStop(1, shade(o.color, 0.75));
        c.fillStyle = g; c.fillRect(x0, y0, bayW * 0.5 * ppm, floorH * ppm);
        if (floorLit && rng.chance(0.8)) {
          const cool = rng.chance(tint === 'warm' ? 0.2 : 0.7);
          e.fillStyle = cool ? hsl(205, 25, rng.range(45, 70)) : hsl(38, 70, rng.range(40, 62));
          e.fillRect(x0, y0 + floorH * ppm * 0.2, bayW * 0.5 * ppm, floorH * ppm * 0.75);
          e.fillStyle = 'rgba(255,255,255,0.35)';
          e.fillRect(x0, y0 + floorH * ppm * 0.2, bayW * 0.5 * ppm, 3);
        }
      }
      // spandrel band
      c.fillStyle = mull; c.fillRect(0, y0 + floorH * ppm * 0.88, W, floorH * ppm * 0.12);
      m.fillStyle = '#000'; m.fillRect(0, y0 + floorH * ppm * 0.88, W, floorH * ppm * 0.12);
      e.fillStyle = '#000'; e.fillRect(0, y0 + floorH * ppm * 0.88, W, floorH * ppm * 0.12);
    }
    c.fillStyle = mull; m.fillStyle = '#000';
    for (let i = 0; i <= bays * 2; i++) {
      const x = i * bayW * 0.5 * ppm;
      c.fillRect(x - 3, 0, 6, H); m.fillRect(x - 3, 0, 6, H);
    }
  } else {
    paintWall(c, W, H, ppm, o, rng);
    for (let j = 0; j < floors; j++) {
      const yTop = j * floorH * ppm; // canvas y of floor top
      if (o.bands) {
        c.fillStyle = o.bandColor || trim;
        c.fillRect(0, yTop + floorH * ppm - 0.18 * ppm, W, 0.18 * ppm);
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.fillRect(0, yTop + floorH * ppm, W, 3);
      }
      if (style === 'deco') {
        // continuous ribbon windows with eyebrow ledges
        const wy = yTop + 0.9 * ppm, wh = 1.5 * ppm;
        c.fillStyle = shade(o.color, 0.85); c.fillRect(0, wy - 0.35 * ppm, W, 0.18 * ppm);
        for (let i = 0; i < bays; i++) {
          const x0 = (i * bayW + 0.35) * ppm, ww = (bayW - 0.7) * ppm;
          c.fillStyle = '#1d2733'; c.fillRect(x0, wy, ww, wh);
          m.fillStyle = '#fff'; m.fillRect(x0 + 3, wy + 3, ww - 6, wh - 6);
          drawInterior(e, x0 + 3, wy + 3, ww - 6, wh - 6, rng, rng.f() < lit, tint);
          c.fillStyle = trim; m.fillStyle = '#000';
          for (let k = 1; k < 3; k++) { const xx = x0 + ww * k / 3; c.fillRect(xx - 2, wy, 4, wh); m.fillRect(xx - 2, wy, 4, wh); }
        }
        continue;
      }
      for (let i = 0; i < bays; i++) {
        let ww, wh, wb;
        switch (style) {
          case 'tall': ww = 1.0; wh = 2.15; wb = 0.6; break;
          case 'wide': ww = bayW * 0.78; wh = 2.0; wb = 0.7; break;
          case 'office': ww = bayW * 0.62; wh = 1.7; wb = 0.85; break;
          case 'lattice': ww = bayW * 0.8; wh = 1.6; wb = 0.8; break;
          case 'arched': ww = 1.05; wh = 1.9; wb = 0.8; break;
          default: ww = 1.1; wh = 1.75; wb = 0.85;
        }
        if (o.windowSkip && rng.f() < o.windowSkip) continue;
        const cx = (i + 0.5) * bayW * ppm;
        const x0 = cx - ww * ppm / 2, w = ww * ppm, h = wh * ppm;
        const y0 = yTop + (floorH - wb - wh) * ppm;
        const isLit = rng.f() < lit;
        // lintel and sill
        if (style !== 'wide' && style !== 'lattice') {
          c.fillStyle = o.lintel || trim;
          if (style === 'arched') {
            c.beginPath(); c.arc(cx, y0 + w / 2, w / 2 + 0.14 * ppm, Math.PI, 0); c.fill();
          } else c.fillRect(x0 - 0.1 * ppm, y0 - 0.22 * ppm, w + 0.2 * ppm, 0.22 * ppm);
          c.fillRect(x0 - 0.08 * ppm, y0 + h, w + 0.16 * ppm, 0.12 * ppm);
          c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x0 - 0.08 * ppm, y0 + h + 0.12 * ppm, w + 0.16 * ppm, 4);
        }
        // frame
        const frame = o.frame || (style === 'wide' ? '#2b2b2b' : trim);
        c.fillStyle = frame;
        if (style === 'arched') { c.beginPath(); c.arc(cx, y0 + w / 2, w / 2, Math.PI, 0); c.fill(); c.fillRect(x0, y0 + w / 2, w, h - w / 2); }
        else c.fillRect(x0, y0, w, h);
        const fpx = Math.max(3, 0.06 * ppm);
        const gx = x0 + fpx, gy = y0 + fpx, gw = w - 2 * fpx, gh = h - 2 * fpx;
        // glass base (dark reflective)
        const gg = c.createLinearGradient(gx, gy, gx, gy + gh);
        gg.addColorStop(0, '#1a2230'); gg.addColorStop(1, '#0b0f16');
        c.fillStyle = gg;
        m.fillStyle = '#fff';
        if (style === 'arched') {
          c.beginPath(); c.arc(cx, gy + gw / 2, gw / 2, Math.PI, 0); c.lineTo(gx + gw, gy + gh); c.lineTo(gx, gy + gh); c.fill();
          m.beginPath(); m.arc(cx, gy + gw / 2, gw / 2, Math.PI, 0); m.lineTo(gx + gw, gy + gh); m.lineTo(gx, gy + gh); m.fill();
        } else { c.fillRect(gx, gy, gw, gh); m.fillRect(gx, gy, gw, gh); }
        drawInterior(e, gx, gy, gw, gh, rng, isLit, tint);
        if (style === 'arched') { // mask emissive arch top
          e.fillStyle = '#000';
          e.beginPath(); e.moveTo(gx, gy); e.lineTo(gx, gy + gw / 2); e.arc(cx, gy + gw / 2, gw / 2, Math.PI, 0); e.lineTo(gx + gw, gy); e.fill();
        }
        // mullions
        c.fillStyle = frame; m.fillStyle = '#000'; e.fillStyle = 'rgba(0,0,0,0.85)';
        const bar = (x, y, bw, bh) => { c.fillRect(x, y, bw, bh); m.fillRect(x, y, bw, bh); e.fillRect(x, y, bw, bh); };
        if (style === 'wide') {
          const cols = 4, rows = 4;
          for (let k = 1; k < cols; k++) bar(gx + gw * k / cols - 2, gy, 4, gh);
          for (let k = 1; k < rows; k++) bar(gx, gy + gh * k / rows - 2, gw, 4);
        } else if (style === 'lattice') {
          for (let k = 1; k < 14; k++) bar(gx + gw * k / 14 - 1.5, gy, 3, gh);
          bar(gx, gy + gh * 0.5 - 2, gw, 4);
        } else if (style === 'office') {
          bar(gx + gw / 2 - 2, gy, 4, gh);
        } else {
          bar(gx, gy + gh * 0.5 - fpx / 2, gw, fpx);
          if (rng.chance(0.5)) bar(gx + gw / 2 - 1.5, gy, 3, gh);
        }
        // shutters
        if (o.shutters && rng.chance(0.8)) {
          c.fillStyle = o.shutterColor || '#2f4a3a';
          c.fillRect(x0 - w * 0.45, y0, w * 0.4, h); c.fillRect(x0 + w * 1.05, y0, w * 0.4, h);
          c.fillStyle = 'rgba(0,0,0,0.25)';
          for (let k = 0; k < h; k += 6) { c.fillRect(x0 - w * 0.45, y0 + k, w * 0.4, 2); c.fillRect(x0 + w * 1.05, y0 + k, w * 0.4, 2); }
        }
        // AC unit or flower box occasionally (painted)
        if (o.flowerBoxes && rng.chance(0.18)) {
          c.fillStyle = '#4a2f22'; c.fillRect(x0 - 4, y0 + h - 0.05 * ppm, w + 8, 0.22 * ppm);
          for (let k = 0; k < 8; k++) { c.fillStyle = rng.pick(['#e65f7a', '#f2c14e', '#7fbf6a', '#d6e3f0', '#3e7d3a']); c.beginPath(); c.arc(x0 + rng.f() * w, y0 + h - 0.06 * ppm, 0.07 * ppm, 0, 7); c.fill(); }
        }
      }
    }
    if (o.cornerQuoins) {
      c.fillStyle = o.lintel || trim;
      for (let y = 0; y < H; y += 0.6 * ppm) { c.fillRect(0, y, (y / (0.6 * ppm)) % 2 ? 0.35 * ppm : 0.55 * ppm, 0.5 * ppm); }
    }
  }
  const map = combineMask(cc, mc, true);
  const emissive = finishCanvasTex(ec, { repeat: true });
  return { map, emissive, tileW, tileH };
}

/**
 * Atlas of ground-floor shopfronts. shops: [{ name, type, color, sign }] — up to cols*rows.
 */
export function makeShopAtlas(shops, seed = 7, opts = {}) {
  const cols = 4, rows = Math.ceil(shops.length / cols);
  const cw = 512, ch = 288; // ~8m x 4.5m
  const W = cw * cols, H = ch * rows;
  const rng = new RNG(seed);
  const [cc, c] = canvas(W, H), [mc, m] = canvas(W, H), [ec, e] = canvas(W, H);
  m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const ppm = cw / 8;
  shops.forEach((s, idx) => {
    const ox = (idx % cols) * cw, oy = Math.floor(idx / cols) * ch;
    const frame = s.color || rng.pick(['#2b3a32', '#3b2a2a', '#1f2a3a', '#4a3b2a', '#222', '#5a1f24']);
    c.fillStyle = frame; c.fillRect(ox, oy, cw, ch);
    // sign band
    const sb = 0.95 * ppm;
    c.fillStyle = shade(frame, 0.8); c.fillRect(ox, oy, cw, sb);
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(ox, oy + sb - 4, cw, 4);
    const signColor = s.sign || rng.pick(['#f6e7c1', '#ffd38a', '#f4f1e8', '#ffb3a1', '#bde6ff']);
    const font = s.font || rng.pick(['Georgia, serif', '"Trebuchet MS", sans-serif', 'Palatino, serif', 'Futura, "Century Gothic", sans-serif', '"Courier New", monospace']);
    const fsz = Math.min(64, (cw * 0.85) / Math.max(6, s.name.length) * 1.7);
    for (const ctx of [c, e]) {
      ctx.save();
      ctx.font = `${s.bold ? 'bold ' : ''}${fsz}px ${font}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = signColor;
      if (ctx === e) { ctx.shadowColor = signColor; ctx.shadowBlur = 12; ctx.globalAlpha = s.litSign === false ? 0.15 : 0.9; }
      ctx.fillText(s.name, ox + cw / 2, oy + sb / 2 + 2);
      ctx.restore();
    }
    // pilasters
    c.fillStyle = shade(frame, 1.2);
    c.fillRect(ox, oy + sb, 0.35 * ppm, ch - sb); c.fillRect(ox + cw - 0.35 * ppm, oy + sb, 0.35 * ppm, ch - sb);
    // door position
    const doorLeft = rng.chance(0.5);
    const dw = 1.1 * ppm, dh = 2.45 * ppm;
    const dx = doorLeft ? ox + 0.6 * ppm : ox + cw - 0.6 * ppm - dw;
    const winX0 = doorLeft ? dx + dw + 0.25 * ppm : ox + 0.55 * ppm;
    const winX1 = doorLeft ? ox + cw - 0.55 * ppm : dx - 0.25 * ppm;
    const wy0 = oy + sb + 0.35 * ppm, wy1 = oy + ch - 0.55 * ppm;
    // display window
    const ww = winX1 - winX0, wh = wy1 - wy0;
    c.fillStyle = '#121820'; c.fillRect(winX0, wy0, ww, wh);
    m.fillStyle = '#fff'; m.fillRect(winX0, wy0, ww, wh);
    // interior light
    const hue = s.hue ?? rng.range(25, 45);
    const g = e.createLinearGradient(0, wy0, 0, wy1);
    g.addColorStop(0, hsl(hue, 80, 62)); g.addColorStop(0.6, hsl(hue, 75, 48)); g.addColorStop(1, hsl(hue, 70, 30));
    e.fillStyle = g; e.fillRect(winX0, wy0, ww, wh);
    // interior details by type
    e.save(); e.beginPath(); e.rect(winX0, wy0, ww, wh); e.clip();
    const dark = 'rgba(25,16,10,0.75)';
    if (s.type === 'cafe' || s.type === 'bar' || s.type === 'restaurant') {
      for (let k = 0; k < 4; k++) { // pendant lamps
        const lx = winX0 + ww * (k + 0.5) / 4;
        e.fillStyle = 'rgba(60,40,20,0.8)'; e.fillRect(lx - 1, wy0, 2, wh * 0.18);
        e.fillStyle = hsl(hue + 5, 100, 82); e.beginPath(); e.arc(lx, wy0 + wh * 0.22, ww * 0.03, 0, Math.PI * 2); e.fill();
      }
      e.fillStyle = dark;
      for (let k = 0; k < 3; k++) { // tables & people
        const tx = winX0 + ww * (k + 0.5) / 3;
        e.fillRect(tx - ww * 0.07, wy0 + wh * 0.72, ww * 0.14, wh * 0.04);
        e.fillRect(tx - 2, wy0 + wh * 0.72, 4, wh * 0.28);
        if (rng.chance(0.7)) { e.beginPath(); e.arc(tx - ww * 0.1, wy0 + wh * 0.5, wh * 0.06, 0, 7); e.fill(); e.fillRect(tx - ww * 0.14, wy0 + wh * 0.56, ww * 0.08, wh * 0.3); }
      }
      e.fillStyle = 'rgba(255,240,220,0.5)'; e.fillRect(winX0, wy0 + wh * 0.62, ww, 2);
    } else if (s.type === 'books' || s.type === 'records' || s.type === 'shop' || s.type === 'grocery' || s.type === 'deli') {
      for (let r = 0; r < 4; r++) {
        const sy = wy0 + wh * (0.15 + r * 0.2);
        e.fillStyle = dark; e.fillRect(winX0, sy + wh * 0.13, ww, 3);
        for (let x = winX0; x < winX0 + ww; x += rng.range(4, 10)) {
          e.fillStyle = hsl(rng.range(0, 360), rng.range(30, 70), rng.range(30, 60));
          const bh = wh * rng.range(0.08, 0.13);
          e.fillRect(x, sy + wh * 0.13 - bh, rng.range(3, 8), bh);
        }
      }
    } else if (s.type === 'flowers') {
      for (let k = 0; k < 60; k++) {
        e.fillStyle = hsl(rng.pick([340, 0, 45, 300, 20, 120]), 70, rng.range(45, 70));
        e.beginPath(); e.arc(winX0 + rng.f() * ww, wy0 + wh * rng.range(0.45, 0.95), rng.range(3, 8), 0, 7); e.fill();
      }
    } else if (s.type === 'laundry') {
      e.fillStyle = 'rgba(230,240,255,0.5)'; e.fillRect(winX0, wy0, ww, wh);
      for (let k = 0; k < 5; k++) { const x = winX0 + ww * (k + 0.5) / 5; e.fillStyle = dark; e.beginPath(); e.arc(x, wy0 + wh * 0.65, ww * 0.06, 0, 7); e.fill(); e.fillStyle = 'rgba(180,220,255,0.8)'; e.beginPath(); e.arc(x, wy0 + wh * 0.65, ww * 0.04, 0, 7); e.fill(); }
    } else if (s.type === 'tea') {
      e.fillStyle = 'rgba(255,230,180,0.45)'; e.fillRect(winX0, wy0, ww, wh);
      e.fillStyle = 'rgba(40,25,10,0.7)';
      for (let k = 1; k < 18; k++) e.fillRect(winX0 + ww * k / 18 - 1, wy0, 2, wh);
    }
    e.restore();
    // window mullions + kickplate
    c.fillStyle = frame; m.fillStyle = '#000'; e.fillStyle = '#000';
    const nPanes = Math.max(1, Math.round(ww / (1.6 * ppm)));
    for (let k = 1; k < nPanes; k++) { const x = winX0 + ww * k / nPanes; c.fillRect(x - 3, wy0, 6, wh); m.fillRect(x - 3, wy0, 6, wh); e.fillRect(x - 3, wy0, 6, wh); }
    c.fillStyle = shade(frame, 0.7); c.fillRect(winX0, wy1, ww, ch - (wy1 - oy));
    // door
    c.fillStyle = shade(frame, 0.6); c.fillRect(dx - 4, oy + ch - dh - 4, dw + 8, dh + 4);
    c.fillStyle = '#141a22'; c.fillRect(dx + 6, oy + ch - dh + 8, dw - 12, dh * 0.7);
    m.fillStyle = '#fff'; m.fillRect(dx + 6, oy + ch - dh + 8, dw - 12, dh * 0.7);
    e.fillStyle = hsl(hue, 70, 40); e.fillRect(dx + 6, oy + ch - dh + 8, dw - 12, dh * 0.7);
    // little "open" sign
    if (s.open !== false && rng.chance(0.6)) {
      e.save(); e.font = `bold ${0.22 * ppm}px sans-serif`; e.fillStyle = rng.pick(['#ff3b6b', '#ff7a2f', '#4dffb8']);
      e.shadowColor = e.fillStyle; e.shadowBlur = 8; e.textAlign = 'center';
      e.fillText(opts.openText || 'OPEN', winX0 + ww * 0.82, wy0 + wh * 0.35); e.restore();
    }
  });
  const map = combineMask(cc, mc, false);
  const emissive = finishCanvasTex(ec);
  return { map, emissive, cols, rows, count: shops.length };
}

// ---------------------------------------------------------------- ground
export function makeAsphalt(seed = 3, base = '#2c2d31') {
  const rng = new RNG(seed);
  const [cv, c] = canvas(512, 512);
  c.fillStyle = base; c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = rng.f();
    c.fillStyle = v < 0.5 ? `rgba(0,0,0,${rng.f() * 0.25})` : `rgba(255,255,255,${rng.f() * 0.07})`;
    c.fillRect(rng.f() * 512, rng.f() * 512, rng.range(1, 3), rng.range(1, 3));
  }
  for (let i = 0; i < 5; i++) { // patches
    c.fillStyle = `rgba(0,0,0,${rng.range(0.08, 0.18)})`;
    c.fillRect(rng.f() * 512, rng.f() * 512, rng.range(40, 160), rng.range(30, 120));
  }
  c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) { // cracks
    let x = rng.f() * 512, y = rng.f() * 512;
    c.beginPath(); c.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += rng.range(-18, 18); y += rng.range(-18, 18); c.lineTo(x, y); }
    c.stroke();
  }
  return finishCanvasTex(cv, { repeat: true });
}

export function makePaving(seed = 4, o = {}) {
  const rng = new RNG(seed);
  const base = o.base || '#8d8b86';
  const [cv, c] = canvas(512, 512);
  c.fillStyle = base; c.fillRect(0, 0, 512, 512);
  if (o.kind === 'cobble') {
    const s = 512 / 10;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
      c.fillStyle = jitterColor(base, rng, 0.12);
      const ox = (y % 2) * s * 0.5;
      c.beginPath(); c.roundRect((x * s + ox) % 512 + 3, y * s + 3, s - 6, s - 6, 10); c.fill();
    }
  } else if (o.kind === 'tiles') {
    const s = 512 / 8;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      c.fillStyle = jitterColor(base, rng, 0.06); c.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
    }
  } else if (o.kind === 'sand') {
    for (let i = 0; i < 20000; i++) { c.fillStyle = `rgba(${rng.f() < 0.5 ? '0,0,0' : '255,255,255'},${rng.f() * 0.12})`; c.fillRect(rng.f() * 512, rng.f() * 512, 1.5, 1.5); }
    return finishCanvasTex(cv, { repeat: true });
  } else if (o.kind === 'grass') {
    for (let i = 0; i < 16000; i++) { c.fillStyle = hsl(rng.range(80, 130), 40, rng.range(15, 35), 0.6); c.fillRect(rng.f() * 512, rng.f() * 512, 1.5, rng.range(2, 6)); }
    return finishCanvasTex(cv, { repeat: true });
  } else {
    // concrete slabs (two per texture, 1.5m each)
    for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${rng.f() < 0.5 ? '0,0,0' : '255,255,255'},${rng.f() * 0.08})`; c.fillRect(rng.f() * 512, rng.f() * 512, 2, 2); }
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(0,0,0,${rng.range(0.03, 0.08)})`; c.beginPath(); c.arc(rng.f() * 512, rng.f() * 512, rng.range(10, 60), 0, 7); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(0, 0, 512, 3); c.fillRect(0, 256, 512, 3);
    c.fillRect(0, 0, 3, 512); c.fillRect(256, 0, 3, 512);
  }
  return finishCanvasTex(cv, { repeat: true });
}

export function makeStripes(colors = ['#ffffff', '#d8d8d8'], n = 8) {
  const [cv, c] = canvas(256, 64);
  for (let i = 0; i < n; i++) { c.fillStyle = colors[i % colors.length]; c.fillRect(i * 256 / n, 0, 256 / n + 1, 64); }
  // scalloped edge shading
  const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
  c.fillStyle = g; c.fillRect(0, 0, 256, 64);
  return finishCanvasTex(cv, { repeat: true });
}

export function makeRadial(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128, falloff = 0.0) {
  const [cv, c] = canvas(size, size);
  const g = c.createRadialGradient(size / 2, size / 2, size * falloff * 0.5, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner); g.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.45)')); g.addColorStop(1, outer);
  c.fillStyle = g; c.fillRect(0, 0, size, size);
  return finishCanvasTex(cv, { srgb: false });
}

export function makeFogSprite(seed = 9) {
  const rng = new RNG(seed);
  const [cv, c] = canvas(256, 256);
  for (let i = 0; i < 40; i++) {
    const x = 128 + rng.range(-60, 60), y = 128 + rng.range(-35, 35), r = rng.range(30, 80);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  }
  return finishCanvasTex(cv, { srgb: false });
}

// Neon text texture (transparent background, glowing strokes)
export function makeNeonAtlas(items, seed = 11) {
  // items: [{ text, color, font }] each in 512x128 cell
  const cols = 2, rows = Math.ceil(items.length / cols);
  const cw = 512, ch = 160;
  const [cv, c] = canvas(cw * cols, ch * rows);
  c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  items.forEach((it, i) => {
    const ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
    const len = Math.max(4, it.text.length);
    const fs = Math.min(110, cw * 1.6 / len);
    c.save();
    c.font = `${it.weight || 'bold'} ${fs}px ${it.font || '"Brush Script MT", "Segoe Script", cursive'}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.strokeStyle = it.color; c.lineWidth = 4; c.shadowColor = it.color; c.shadowBlur = 22;
    c.strokeText(it.text, ox + cw / 2, oy + ch / 2);
    c.shadowBlur = 8; c.strokeText(it.text, ox + cw / 2, oy + ch / 2);
    c.lineWidth = 1.5; c.strokeStyle = '#fff'; c.shadowBlur = 0; c.globalAlpha = 0.8;
    c.strokeText(it.text, ox + cw / 2, oy + ch / 2);
    c.restore();
  });
  const t = finishCanvasTex(cv);
  return { tex: t, cols, rows };
}

export function makeMural(seed = 5, w = 1024, h = 512) {
  const rng = new RNG(seed);
  const [cv, c] = canvas(w, h);
  const palettes = [
    ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#2b2d42'],
    ['#f72585', '#7209b7', '#3a0ca3', '#4cc9f0', '#fef9ef'],
    ['#ff9f1c', '#ffbf69', '#2ec4b6', '#cbf3f0', '#1b1b3a'],
    ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'],
    ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'],
  ];
  const pal = rng.pick(palettes);
  c.fillStyle = pal[4]; c.fillRect(0, 0, w, h);
  const kind = rng.int(0, 2);
  if (kind === 0) { // waves & suns
    for (let i = 0; i < 7; i++) {
      c.fillStyle = pal[i % 4];
      c.beginPath(); c.moveTo(0, h);
      const base = h * (0.35 + i * 0.09);
      for (let x = 0; x <= w; x += 16) c.lineTo(x, base + Math.sin(x * 0.01 * (1 + i * 0.3) + i) * 30);
      c.lineTo(w, h); c.fill();
    }
    c.fillStyle = pal[1]; c.beginPath(); c.arc(w * rng.range(0.2, 0.8), h * 0.28, h * 0.17, 0, 7); c.fill();
  } else if (kind === 1) { // geometric
    for (let i = 0; i < 40; i++) {
      c.fillStyle = rng.pick(pal.slice(0, 4)); c.globalAlpha = rng.range(0.6, 1);
      c.save(); c.translate(rng.f() * w, rng.f() * h); c.rotate(rng.f() * Math.PI);
      const s = rng.range(30, 160);
      if (rng.chance(0.5)) c.fillRect(-s / 2, -s / 2, s, s * rng.range(0.3, 1)); else { c.beginPath(); c.arc(0, 0, s / 2, 0, Math.PI * rng.range(1, 2)); c.fill(); }
      c.restore();
    }
    c.globalAlpha = 1;
  } else { // flowing face-like abstract
    for (let i = 0; i < 18; i++) {
      c.strokeStyle = rng.pick(pal.slice(0, 4)); c.lineWidth = rng.range(10, 40); c.lineCap = 'round';
      c.beginPath(); let x = rng.f() * w, y = rng.f() * h; c.moveTo(x, y);
      for (let k = 0; k < 4; k++) { c.quadraticCurveTo(rng.f() * w, rng.f() * h, x = rng.f() * w, y = rng.f() * h); }
      c.stroke();
    }
    c.fillStyle = pal[1]; c.font = `bold ${h * 0.18}px Impact, sans-serif`; c.textAlign = 'center';
    c.fillText(rng.pick(['RAIN DAYS', 'STAY SOFT', 'GOOD VIBES', 'DREAM ON', 'SLOW DOWN']), w / 2, h * 0.6);
  }
  return finishCanvasTex(cv);
}

export function makeLantern(text = '', color = '#ffefd0') {
  const [cv, c] = canvas(128, 256);
  const g = c.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, shade(color, 0.6)); g.addColorStop(0.5, color); g.addColorStop(1, shade(color, 0.6));
  c.fillStyle = g; c.fillRect(0, 0, 128, 256);
  c.strokeStyle = 'rgba(80,30,10,0.35)'; c.lineWidth = 2;
  for (let y = 10; y < 256; y += 18) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); }
  if (text) { c.fillStyle = '#1a0d08'; c.font = 'bold 64px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 64, 128); }
  return finishCanvasTex(cv);
}

export function makeSkylineTex(seed = 13, o = {}) {
  // Distant tower windows, tiny & many lit dots
  const rng = new RNG(seed);
  const [cv, c] = canvas(256, 512);
  const [ecv, e] = canvas(256, 512);
  c.fillStyle = o.color || '#2a2d36'; c.fillRect(0, 0, 256, 512);
  e.fillStyle = '#000'; e.fillRect(0, 0, 256, 512);
  for (let y = 4; y < 512; y += 10) for (let x = 4; x < 256; x += 8) {
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, y, 5, 6);
    if (rng.f() < (o.lit ?? 0.35)) { e.fillStyle = rng.chance(0.7) ? hsl(38, 70, rng.range(45, 70)) : hsl(200, 30, 70); e.fillRect(x, y, 5, 6); }
  }
  const map = finishCanvasTex(cv, { repeat: true });
  const emissive = finishCanvasTex(ecv, { repeat: true });
  return { map, emissive };
}

export function makeNoren(text, color = '#24304a') {
  const [cv, c] = canvas(256, 192);
  c.fillStyle = color; c.fillRect(0, 0, 256, 192);
  c.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 1; k < 4; k++) c.fillRect(k * 64 - 2, 30, 4, 162);
  c.fillStyle = '#f2ead8'; c.font = 'bold 72px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 128, 105);
  return finishCanvasTex(cv);
}

export function makeLeaves(seed = 21, base = '#3c6b3a', blossom = null) {
  const rng = new RNG(seed);
  const [cv, c] = canvas(256, 256);
  c.fillStyle = base; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    c.fillStyle = blossom && rng.chance(0.6) ? jitterColor(blossom, rng, 0.15) : jitterColor(base, rng, 0.2);
    c.beginPath(); c.ellipse(rng.f() * 256, rng.f() * 256, rng.range(3, 8), rng.range(2, 5), rng.f() * 3, 0, 7); c.fill();
  }
  return finishCanvasTex(cv, { repeat: true });
}

export function makeSignTex(text, bg = '#1a2a22', fg = '#f4e7c4', font = 'Georgia, serif') {
  const [cv, c] = canvas(512, 96);
  c.fillStyle = bg; c.fillRect(0, 0, 512, 96);
  c.strokeStyle = fg; c.globalAlpha = 0.5; c.lineWidth = 3; c.strokeRect(8, 8, 496, 80); c.globalAlpha = 1;
  c.fillStyle = fg; c.font = `bold ${Math.min(56, 900 / Math.max(6, text.length))}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, 256, 50);
  return finishCanvasTex(cv);
}
export function makeWoodFloor(seed = 61, base = '#6a4a30') {
  const rng = new RNG(seed);
  const [cv, c] = canvas(512, 512);
  const pw = 512 / 8;
  for (let i = 0; i < 8; i++) {
    let y = -rng.f() * 200;
    while (y < 512) {
      const len = rng.range(120, 300);
      c.fillStyle = jitterColor(base, rng, 0.1); c.fillRect(i * pw + 1, y, pw - 2, len - 2);
      for (let k = 0; k < 6; k++) { c.fillStyle = 'rgba(0,0,0,0.06)'; c.fillRect(i * pw + rng.f() * pw, y, 1, len); }
      y += len;
    }
  }
  return finishCanvasTex(cv, { repeat: true });
}
export function makeTiles(base = '#e8e6df', grout = '#a8a49a', w = 8, h = 16) {
  const rng = new RNG(71);
  const [cv, c] = canvas(512, 512);
  c.fillStyle = grout; c.fillRect(0, 0, 512, 512);
  const tw = 512 / w, th = 512 / h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { c.fillStyle = jitterColor(base, rng, 0.03); c.fillRect(x * tw + 2, y * th + 2, tw - 4, th - 4); }
  return finishCanvasTex(cv, { repeat: true });
}
