// Scene definitions. Each scene: (t = local seconds, sc = {dur, lines:[{start,end,text}]})
const L = (sc, i) => sc.lines[Math.min(i, sc.lines.length - 1)].start;
function segIdx(t, sc, lead = .15) { let k = 0; sc.lines.forEach((l, i) => { if (t >= l.start - lead) k = i; }); return k; }
// cross-dissolve between sub-shots: returns alpha for shot i
function shotA(t, sc, i, fade = .35) {
  const a = i === 0 ? -99 : L(sc, i) - .2, b = i + 1 < sc.lines.length ? L(sc, i + 1) - .2 : 1e9;
  return Math.min(prog(t, a, fade), 1 - prog(t, b, fade));
}
function shots(t, sc, map) { // map: {lineIndex: fn} — each shot lasts until next key
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
  keys.forEach((k, j) => {
    const a = j === 0 ? -99 : L(sc, k) - .25, b = j + 1 < keys.length ? L(sc, keys[j + 1]) - .25 : 1e9;
    const al = Math.min(prog(t, a, .4), 1 - prog(t, b, .4) + (j + 1 < keys.length ? 0 : 1));
    // previous shot stays fully opaque under the next (dissolve over), so draw if visible
    const visible = t >= a && t < b + .4;
    if (!visible) return;
    alpha(j === 0 ? 1 : prog(t, a, .4), () => map[k](t - (j === 0 ? 0 : L(sc, k)), t));
  });
}

// ---------- shared street ----------
const WALKERS = (() => { const r = rng(7), a = []; for (let i = 0; i < 9; i++) a.push({ ...randPerson(r), x0: r() * 1500, sp: 40 + r() * 35, dir: r() < .5 ? 1 : -1, ph: r() * 6, s: .95 + r() * .2, phone: r() < .3, hat: r() < .2 ? 'cap' : null }); return a; })();
function walkers(t, y = 600, o = {}) {
  WALKERS.forEach((w, i) => {
    let x = ((w.x0 + w.sp * t * w.dir) % 1500 + 1500) % 1500 - 110;
    person(x, y + (i % 3) * 6, w.s * (o.scale || 1), { ...w, face: w.dir, walk: t * 6 + w.ph, hold: w.phone ? 'phone' : null, armF: w.phone ? 70 : undefined, glow: o.glow, mood: o.mood ? o.mood(i) : (w.phone ? 'neutral' : 'happy') });
  });
}
function streetBG(t, o = {}) {
  sky(o.skyTop || '#7ec8f2', o.skyBot || '#d9f1ff', 560);
  sun(1080, 110, 42);
  clouds(t, 3, 6, 60, 200, 'rgba(255,255,255,.85)', 10);
  city(11, 560, { colors: ['#a9c3dd', '#b8cfe4', '#9db8d4'], minH: 220, varH: 200, windows: false });
  city(5, 560, { colors: ['#5e7fa8', '#6d8db5', '#7b6f9e', '#c07a5a', '#d29a5a'], minH: 120, varH: 200, minW: 90 });
  // shop fronts
  street(560);
  for (const x of [120, 520, 980]) { tree(x, 568, 1.05); }
}
const COP = { skin: '#c68642', shirt: '#2c3e74', pants: '#1d2a4a', hat: 'police', badge: true, belt: true };
const SOLDIER = { skin: '#e0a77a', shirt: '#5a6b3a', pants: '#4d5b33', hat: 'helmet', vest: '#4a5730', belt: true };
const HUNTER = { skin: '#f2c9a0', shirt: '#7a4e2a', vest: '#f07f3c', pants: '#4a5a3a', hat: 'cap', hatColor: '#f07f3c' };

// ---------- speech bubbles ----------
const GREET = ['Hola', 'Bonjour', 'Ciao', 'Привет', 'こんにちは', '你好', 'Hallo', 'Jambo', 'Olá', 'Salut', 'Hej', 'Merhaba'];
const BCOL = ['#ff8a80', '#ffd180', '#a7ffeb', '#b388ff', '#82b1ff', '#f8bbd0', '#ccff90', '#ffe57f', '#80d8ff', '#ffab91', '#b9f6ca', '#ea80fc'];
function bubble(x, y, s, p, bg = '#fff', fg = '#222', size = 22) {
  if (p <= 0) return;
  ctx.save(); ctx.font = `800 ${size}px ${FONT}`; const w = ctx.measureText(s).width + size * 1.3, h = size * 1.9;
  ctx.translate(x, y); const k = backOut(p); ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 3);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; fillRR(-w / 2, -h, w, h, h / 2.4, bg); ctx.restore();
  poly([[-8, -2], [8, -2], [0, 14]], bg); text(s, 0, -h / 2 + 1, size, fg); ctx.restore();
}
const FOLK = (() => { const r = rng(77), a = []; for (let i = 0; i < 10; i++) a.push({ ...randPerson(r), x: 80 + i * 124, y: 618 + (i % 2) * 22, s: 1.25 + r() * .2, face: i % 2 ? -1 : 1 }); return a; })();
function folk(t, mood, word, wp) { // crowd with per-person bubbles
  FOLK.forEach((P, i) => {
    const m = typeof mood === 'function' ? mood(i) : mood;
    person(P.x, P.y, P.s, { ...P, mood: m, armF: m === 'joy' ? 160 + Math.sin(t * 6 + i) * 10 : 10 + Math.sin(t * 2 + i) * 8, armB: m === 'joy' ? -160 : -8, jump: m === 'joy' ? Math.abs(Math.sin(t * 5 + i)) * 12 : 0 });
    const w = word(i); if (w) bubble(P.x + 6, P.y - 150 - (i % 2) * 34, w[0], wp(i), w[1], '#222', 20);
  });
}

const SCENES = {
  title(t, sc) {
    sky('#05060f', '#141a3a'); stars(1, 220, t);
    globe(640, 420, 210, -40 + t * 14, 18);
    GREET.forEach((g, i) => { const a = i / GREET.length * Math.PI * 2 + t * .25; bubble(640 + Math.cos(a) * 420, 430 + Math.sin(a) * 250, g, prog(t, .2 + i * .12, .4), BCOL[i], '#222', 22); });
    alpha(prog(t, .8, .5), () => rect(0, 0, VW, VH, 'rgba(0,0,20,.4)'));
    popText('WHAT IF...', 640, 240, 104, '#ffd23f', prog(t, .8, .6), { weight: 900, stroke: 10, strokeColor: '#1a1030' });
    popText('everyone on Earth spoke', 640, 370, 50, '#fff', prog(t, 2.0, .5), { weight: 900, stroke: 8, strokeColor: '#1a1030' });
    popText('THE SAME LANGUAGE?', 640, 450, 70, '#5df2a0', prog(t, 2.6, .5), { weight: 900, stroke: 10, strokeColor: '#1a1030' });
  },

  morning(t, sc) {
    streetBG(t);
    folk(t, i => 'happy', i => [GREET[i % GREET.length], BCOL[i % BCOL.length]], i => prog(t, .3 + i * .15, .4) * (.85 + .15 * Math.sin(t * 3 + i)));
    const l1 = L(sc, 1);
    alpha(win(t, .6, l1 - .1, .4, .3), () => { popText('≈ 7,000', 640, 170, 110, '#ffd23f', prog(t, .7, .5), { weight: 900, stroke: 10, strokeColor: '#111' }); popText('LANGUAGES', 640, 265, 48, '#fff', prog(t, 1.0, .5), { weight: 900, stroke: 8, strokeColor: '#111' }); });
    alpha(prog(t, l1 - .1, .4), () => {
      rect(0, 0, VW, VH, 'rgba(10,15,35,.6)');
      person(470, 560, 2.4, { skin: '#f2c9a0', shirt: '#e85d5d', mood: 'confused', armF: 60 }); person(810, 560, 2.4, { skin: '#8d5524', shirt: '#4c8ed9', mood: 'confused', face: -1, armF: 60 });
      bubble(430, 260, 'こんにちは!', prog(t, l1 + .2, .4), '#ffd180', '#222', 30); bubble(850, 260, 'Bonjour !', prog(t, l1 + .7, .4), '#82b1ff', '#222', 30);
      popText('???', 640, 330, 80, '#ff6b6b', prog(t, l1 + 1.3, .4), { weight: 900, stroke: 8, strokeColor: '#111' });
    });
  },

  poof(t, sc) {
    const tp = L(sc, 1), te = L(sc, 2), same = t >= tp;
    if (t < te + 1.2) {
      const z = 1 + .12 * easeInOut(prog(t, 0, tp));
      ctx.save(); ctx.translate(640, 560); ctx.scale(z, z); ctx.translate(-640, -560);
      streetBG(t + 9);
      folk(t, i => same ? (t > tp + 1 ? 'joy' : 'shock') : 'happy', i => same ? ['Hello!', '#5df2a0'] : [GREET[i % GREET.length], BCOL[i % BCOL.length]], i => same ? prog(t, tp + .15 + i * .06, .35) : 1);
      ctx.restore();
      if (same) { for (let k = 0; k < 3; k++) { const r = (t - tp - k * .15) * 1300; if (r > 0 && r < 1500) { ctx.beginPath(); ctx.arc(640, 420, r, 0, Math.PI * 2); ctx.lineWidth = 26 - k * 6; ctx.strokeStyle = `rgba(93,242,160,${clamp(1 - r / 1500) * .8})`; ctx.stroke(); } } flash(1 - prog(t, tp, .4)); }
      else alpha(prog(t, .2, tp - .3) * .5, () => vignette(.9));
    }
    if (t >= te + .8) alpha(prog(t, te + .8, .4), () => {
      sky('#0c1530', '#1d2b55'); stars(4, 80, t); worldMap(40, 90, 1200, 560, '#3a8f5a', 'rgba(255,255,255,.15)');
      for (let i = 0; i < 46; i++) { const p = LAND_PTS[i * 5]; const [x, y] = mapXY(p[0], p[1], 40, 90, 1200, 560); bubble(x, y, 'Hello!', prog(t, te + .9 + (i * .37 % 1) * 1.2, .35), '#5df2a0', '#123', 15); }
    });
  },

  react(t, sc) {
    shots(t, sc, {
      0: (u) => {
        streetBG(t + 30);
        person(520, 620, 2.2, { skin: '#ffdbac', shirt: '#f2b632', pants: '#5a4a3a', hat: 'cap', hatColor: '#e85d5d', hold: 'paper', armF: 70, mood: u > 3 ? 'joy' : 'confused' });
        person(790, 620, 2.2, { skin: '#c68642', shirt: '#3bb3a8', pants: '#2f3b55', face: -1, armF: u > 1.6 ? 110 : 10, mood: 'happy' });
        bubble(470, 330, 'Where is the station?', prog(u, .4, .4), '#fff', '#222', 26); bubble(850, 330, 'Two blocks, then left!', prog(u, 1.8, .4), '#5df2a0', '#123', 26);
        popText('!', 520, 250, 70, '#ffd23f', prog(u, 3.1, .3), { weight: 900, stroke: 8, strokeColor: '#111' });
      },
      1: (u) => {
        rect(0, 0, VW, VH, '#dfe6ee');
        for (let i = 0; i < 4; i++) { const x = 60 + i * 310; fillRR(x, 110, 250, 220, 24, '#8fd0f5'); ctx.save(); ctx.beginPath(); ctx.roundRect(x, 110, 250, 220, 24); ctx.clip(); for (let k = 0; k < 4; k++) { const tx = x + ((k * 130 - u * 500) % 500 + 500) % 500 - 100; tree(tx, 330, 1.3); } rect(x, 300, 250, 30, '#7cc46b'); ctx.restore(); }
        rect(0, 60, VW, 14, '#b8c2cc'); rect(0, 600, VW, 120, '#8f9aa6');
        for (let i = 0; i < 5; i++) { const x = 150 + i * 245; const P = FOLK[i]; bust(x, 500, 2, { ...P, face: i % 2 ? -1 : 1, mood: 'happy', armF: 40 + Math.sin(u * 4 + i) * 20 }); }
        fillRR(40, 480, 1200, 130, 26, '#3f6fb5'); for (let i = 0; i < 5; i++) fillRR(60 + i * 240, 440, 220, 60, 20, '#4a7cc4');
        const lines = ['Nice hat!', 'Thanks!', 'Where are you from?', 'Far away!', 'Me too!'];
        lines.forEach((s, i) => bubble(150 + i * 245, 280 - (i % 2) * 50, s, prog(u, .3 + i * .45, .4), i % 2 ? '#5df2a0' : '#fff', '#123', 22));
      },
      2: (u) => {
        sky('#86cdf5', '#e0f4ff', 560); rect(0, 520, VW, 200, '#7cc46b');
        rect(380, 220, 520, 300, '#d9734e'); poly([[360, 220], [920, 220], [640, 140]], '#9b3d2a'); for (let i = 0; i < 6; i++) rect(410 + i * 80, 270, 50, 50, '#cfe8f5'); rect(600, 420, 80, 100, '#6b4428'); text('SCHOOL', 640, 195, 24, '#fff', { weight: 900 });
        for (let i = 0; i < 8; i++) { const P = FOLK[i]; person(150 + i * 140, 640 + (i % 2) * 24, .95, { ...P, jump: Math.abs(Math.sin(u * 7 + i)) * 14, mood: 'joy', armF: 140, armB: -140, face: i % 2 ? 1 : -1 }); bubble(150 + i * 140, 500 - (i % 2) * 40, i % 3 ? 'HAHA!' : 'LOL', prog(u, .6 + i * .12, .3), BCOL[i], '#222', 20); }
      },
    });
  },

  good(t, sc) {
    shots(t, sc, {
      0: (u) => {
        sky('#86cdf5', '#e0f4ff', 560); clouds(t, 6, 5, 60, 220); rect(0, 540, VW, 180, '#b8bec6');
        fillRR(60, 330, 620, 210, 12, '#e9eef3'); for (let i = 0; i < 7; i++) rect(90 + i * 84, 370, 56, 90, '#9fd3f2'); rect(60, 300, 620, 40, '#3f6fb5'); text('AIRPORT', 370, 320, 26, '#fff', { weight: 900 });
        const px = lerp(1400, 300, prog(u, 0, 5)), py = lerp(260, 60, prog(u, 0, 5));
        ctx.save(); ctx.translate(px, py); ctx.rotate(-.12); fillRR(-90, -14, 180, 28, 14, '#fff'); poly([[-10, -10], [-50, -60], [-30, -10]], '#e85d5d'); poly([[-10, 10], [-60, 50], [-30, 10]], '#d0d6dc'); poly([[70, -12], [95, -50], [90, -10]], '#e85d5d'); ctx.restore();
        for (let i = 0; i < 6; i++) { const P = FOLK[i]; person(760 + i * 85 - u * 25, 640 + (i % 2) * 20, 1.35, { ...P, face: -1, walk: u * 6 + i, hold: 'briefcase', mood: 'happy' }); }
        ['PASSPORTS', 'TAXI', 'MENU', 'HOTEL'].forEach((s, i) => { withCard(730 + (i % 2) * 260, 90 + Math.floor(i / 2) * 110, 230, 84, prog(u, .4 + i * .35, .4), '#fff', (w, h) => { text(s, w / 2 - 18, h / 2, 24, '#222', { weight: 900 }); check(w - 34, h / 2, 13, '#2ecc71', prog(u, .7 + i * .35, .3)); }); });
      },
      1: (u) => {
        sky('#060914', '#121a35'); worldMap(40, 90, 1200, 560, '#1f4d5a', 'rgba(120,200,255,.25)');
        const hubs = [[-98, 39], [-50, -15], [10, 50], [25, 0], [78, 22], [115, 35], [135, -25]];
        hubs.forEach((h, i) => hubs.forEach((g, j) => { if (j <= i || (i + j) % 3 === 0) return; const a = mapXY(...h, 40, 90, 1200, 560), b = mapXY(...g, 40, 90, 1200, 560); const p = prog(u, .2 + (i + j) * .08, .7); if (p <= 0) return; ctx.beginPath(); ctx.moveTo(a[0], a[1]); const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 80; ctx.quadraticCurveTo(mx, my, lerp(a[0], b[0], p), lerp(a[1], b[1], p)); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(93,242,160,.7)'; ctx.stroke(); }));
        hubs.forEach((h, i) => { const [x, y] = mapXY(...h, 40, 90, 1200, 560); circle(x, y, 18 + Math.sin(u * 4 + i) * 3, 'rgba(93,242,160,.25)'); circle(x, y, 8, '#5df2a0'); });
        person(250, 690, 1.9, { skin: '#ffdbac', shirt: '#9b59b6', coat: '#fafafa', hair: '#777', mood: 'joy', armF: 150, hold: 'paper' });
        person(1040, 690, 1.9, { skin: '#8d5524', shirt: '#4c8ed9', coat: '#fafafa', mood: 'joy', armF: 150, face: -1 });
        label('ONE LANGUAGE • SHARED KNOWLEDGE', 640, 60, 30, '#5df2a0', '#10213a', prog(u, .3, .4));
      },
    });
  },

  bad(t, sc) {
    shots(t, sc, {
      0: (u) => {
        sky('#9aa3ad', '#d3d8de', 560); rect(0, 560, VW, 160, '#8a8f99');
        rect(330, 200, 620, 360, '#6f7a8c'); rect(330, 200, 620, 70, '#2f3e6b'); text('TRANSLATION AGENCY', 640, 236, 32, '#fff', { weight: 900 });
        for (let i = 0; i < 3; i++) rect(370 + i * 200, 300, 140, 110, '#cfe8f5'); rect(590, 440, 100, 120, '#4a4f57');
        ctx.save(); ctx.translate(640, 400); ctx.rotate(-.1); const p = backOut(prog(u, .5, .4)); ctx.scale(p, p); fillRR(-130, -38, 260, 76, 8, '#e63946'); text('CLOSED', 0, 2, 46, '#fff', { weight: 900 }); ctx.restore();
        for (let i = 0; i < 6; i++) { const x = 110 + i * 205; person(x + u * 16 * (i % 2 ? -1 : 1), 660, 1.5, { ...FOLK[i], mood: 'sad', hold: 'box', armF: 70, face: i % 2 ? -1 : 1, headY: 3 }); }
      },
      1: (u) => {
        rect(0, 0, VW, VH, '#3b2f2a'); rect(0, 600, VW, 120, '#2a211d');
        const fade = prog(u, .8, 3.5);
        for (let r = 0; r < 3; r++) { rect(60, 250 + r * 120, 1160, 12, '#6b4a2a'); for (let i = 0; i < 38; i++) { const rr2 = rng(r * 100 + i); const h = 70 + rr2() * 34, c = BCOL[Math.floor(rr2() * BCOL.length)]; const gone = fade * 1.3 > rr2(); rect(70 + i * 30, 250 + r * 120 - h, 24, h, gone ? '#5a534e' : c); } }
        GREET.forEach((g, i) => { const st = .6 + i * .32, p = prog(u, st, 2.6); if (p > 0 && p < 1) alpha(1 - p, () => text(g, 120 + (i * 97 % 1040), 520 - p * 420 + Math.sin(u * 2 + i) * 10, 30, BCOL[i], { weight: 800 })); });
        person(560, 690, 1.9, { skin: '#f2c9a0', shirt: '#8a6a9a', hair: '#bbb', long: true, mood: 'sad', armF: 30, headY: 3 }); person(700, 690, 1.15, { skin: '#f2c9a0', shirt: '#f2b632', mood: 'confused', face: -1 });
        label('≈ 7,000 LANGUAGES → 1', 640, 70, 32, '#fff', '#b3202c', prog(u, .5, .4));
      },
    });
  },

  argue(t, sc) {
    const l1 = L(sc, 1);
    rect(0, 0, VW, VH, '#2b2d42'); rect(0, 580, VW, 140, '#1f2133');
    const sh = Math.sin(t * 18) * 3;
    person(470 + sh, 650, 3, { skin: '#c68642', shirt: '#e63946', pants: '#222', mood: 'angry', armF: 100 + Math.sin(t * 9) * 20, armB: -30 });
    person(810 - sh, 650, 3, { skin: '#ffdbac', shirt: '#4c8ed9', pants: '#2f3b55', mood: 'angry', face: -1, armF: 100 + Math.cos(t * 9) * 20, armB: -30 });
    bubble(400, 250, "You're wrong!", prog(t, .3, .3), '#ff8a80', '#222', 30); bubble(880, 250, 'No, YOU are!', prog(t, .9, .3), '#82b1ff', '#222', 30);
    popText('SAME WORDS ≠ SAME OPINIONS', 640, 90, 44, '#ffd23f', prog(t, l1, .5), { weight: 900, stroke: 8, strokeColor: '#111' });
  },

  later(t, sc) {
    sky('#e9dfc9', '#f6f0e2'); worldMap(40, 90, 1200, 560, '#b9c9a0', 'rgba(0,0,0,.15)');
    const spots = [[-100, 42, 'Heyo!'], [-55, -12, 'Olla!'], [5, 50, "'Ello!"], [22, 5, 'Halo-o!'], [80, 25, 'Helu!'], [112, 38, 'Hē-lo!'], [135, -25, 'Yo!']];
    spots.forEach((s, i) => { const [x, y] = mapXY(s[0], s[1], 40, 90, 1200, 560); const ch = prog(t, 2 + i * .35, .4); if (ch < 1) bubble(x, y, 'Hello!', (1 - ch) * prog(t, .2 + i * .1, .3), '#5df2a0', '#123', 22); bubble(x, y, s[2], ch, BCOL[i], '#222', 24); });
    const yrs = Math.floor(easeInOut(prog(t, 1, 4)) * 200);
    withCard(470, 20, 340, 76, 1, '#111a', () => text('+' + yrs + ' YEARS', 170, 38, 38, '#ffd23f', { weight: 900 }));
  },

  end(t, sc) {
    const l1 = L(sc, 1);
    sky('#05060f', '#141a3a'); stars(21, 220, t);
    globe(640, 320, 170, 60 + t * 10, 15);
    withCard(60, 200, 320, 240, prog(t, .8, .5), '#14301f', (w, h) => { bubble(w / 2, 110, 'Hello!', 1, '#5df2a0', '#123', 34); text('UNITED?', w / 2, 180, 38, '#5df2a0', { weight: 900 }); });
    withCard(900, 200, 320, 240, prog(t, 2.6, .5), '#2a1d2e', (w, h) => { ['Hola', 'Ciao', '你好'].forEach((g, i) => bubble(70 + i * 90, 90 + (i % 2) * 40, g, 1, '#8a8a8a', '#ddd', 20)); text('LESS COLORFUL?', w / 2, 190, 30, '#ff8a80', { weight: 900 }); });
    popText('WHAT DO YOU THINK?', 640, 590, 64, '#ffd23f', prog(t, l1, .5), { weight: 900, stroke: 8, strokeColor: '#111' });
    const ep = prog(t, sc.dur - 2.4, .6);
    alpha(ep, () => { rect(0, 0, VW, VH, '#05060f'); stars(21, 220, t); });
    popText('WHAT IF?', 640, 330, 140, '#ffd23f', ep, { weight: 900, stroke: 12, strokeColor: '#1a1030' });
    popText('Thanks for watching', 640, 450, 36, '#fff', prog(t, sc.dur - 1.9, .5), { weight: 700 });
  },
};
