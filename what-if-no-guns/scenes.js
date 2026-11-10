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

const SCENES = {
  // 1 ─ Title
  title(t, sc) {
    sky('#05060f', '#141a3a');
    stars(1, 220, t);
    const z = lerp(1.15, 1, easeOut(t / 4));
    ctx.save(); ctx.translate(640, 400); ctx.scale(z, z);
    globe(0, 0, 230, -40 + t * 12, 18);
    ctx.restore();
    const p1 = prog(t, .6, .6), p2 = prog(t, 2.2, .6);
    alpha(p1, () => { rect(0, 0, VW, VH, 'rgba(0,0,20,.35)'); });
    popText('WHAT IF...', 640, 250, 110, '#ffd23f', p1, { weight: 900, stroke: 10, strokeColor: '#1a1030' });
    popText('every gun in the world', 640, 380, 54, '#fff', p2, { weight: 900, stroke: 8, strokeColor: '#1a1030' });
    popText('JUST VANISHED?', 640, 460, 78, '#ff5a5a', prog(t, 2.8, .6), { weight: 900, stroke: 10, strokeColor: '#1a1030' });
  },

  // 2 ─ Ordinary morning
  morning(t, sc) {
    streetBG(t);
    // cars
    car(((t * 160) % 1700) - 200, 668, '#e85d5d', 1, 1); car(1500 - ((t * 120 + 600) % 1800), 640, '#4c8ed9', .9, -1);
    walkers(t, 610);
    person(780, 612, 1.25, { ...COP, holster: 'gun', mood: 'happy', armB: -5, armF: 10 });
    person(860, 612, 1.1, { skin: '#ffdbac', shirt: '#e05297', pants: '#1f4f7a', hair: '#c9a14a', long: true, face: -1, hold: 'phone', armF: 70, mood: 'happy' });
    // clock
    withCard(40, 30, 230, 80, prog(t, .3, .5), '#ffffffee', () => { text('TUESDAY', 95, 26, 18, '#666'); text('9:00 AM', 95, 54, 34, '#222', { weight: 900 }); circle(200, 40, 24, '#ffd23f'); line(200, 40, 200, 24, 3, '#222'); line(200, 40, 212, 40, 3, '#222'); });
    // billion counter
    const l1 = L(sc, 1), l2 = L(sc, 2);
    const pa = win(t, l1 - .1, l2 - .1, .4, .3);
    alpha(pa, () => {
      rect(0, 0, VW, VH, 'rgba(10,15,35,.55)');
      const n = Math.floor(easeOut(prog(t, l1, 2.2)) * 1000000000);
      text(n.toLocaleString('en-US') + '+', 640, 300, 96, '#ffd23f', { weight: 900, stroke: 8, strokeColor: '#111' });
      text('GUNS ON PLANET EARTH', 640, 390, 44, '#fff', { weight: 900, stroke: 6, strokeColor: '#111' });
      for (let i = 0; i < 14; i++) drawPistol(250 + i * 60, 470, 1.6, 0, prog(t, l1 + i * .12, .2));
    });
    // where they are
    const cards = [['HOMES', 'home'], ['POLICE', 'cop'], ['ARMIES', 'army'], ['WAREHOUSES', 'crate']];
    alpha(prog(t, l2 - .1, .3), () => rect(0, 0, VW, VH, 'rgba(10,15,35,.55)'));
    cards.forEach(([name, kind], i) => {
      const p = prog(t, l2 + i * .55, .5);
      withCard(80 + i * 290, 170, 250, 320, p, '#fff', (w, h) => {
        if (kind === 'home') { house(55, 230, 140, 110, '#e8c79a', '#b5523b'); drawPistol(178, 70, 1.5); }
        if (kind === 'cop') { person(125, 260, 1.7, { ...COP, holster: 'gun', mood: 'neutral', noShadow: true }); }
        if (kind === 'army') { person(95, 260, 1.5, { ...SOLDIER, back: 'rifle', noShadow: true }); person(165, 262, 1.5, { ...SOLDIER, skin: '#8d5524', hold: 'rifle', armF: 50, noShadow: true }); }
        if (kind === 'crate') { for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 3 - r2; c2++) { fillRR(40 + c2 * 58 + r2 * 29, 210 - r2 * 46, 54, 44, 3, '#b98a52'); drawRifle(67 + c2 * 58 + r2 * 29, 232 - r2 * 46, .55); } }
        text(name, w / 2, 285, 30, '#222', { weight: 900 });
      });
    });
  },

  // 3 ─ The poof
  poof(t, sc) {
    const tp = L(sc, 1), te = L(sc, 2);
    const gone = t >= tp;
    if (t < te - .2) {
      const z = 1 + .22 * easeInOut(prog(t, 0, tp));
      ctx.save(); ctx.translate(640, 560); ctx.scale(z, z); ctx.translate(-640, -560);
      streetBG(t + 12);
      const slow = gone ? 1 : clamp(1 - t / tp * .9, .1, 1);
      walkers(12 + t * slow * .3, 610);
      person(560, 612, 1.3, { ...SOLDIER, back: gone ? null : 'rifle', mood: gone ? 'shock' : 'neutral' });
      person(640, 612, 1.3, { ...COP, holster: gone ? 'empty' : 'gun', mood: gone ? 'shock' : 'neutral' });
      person(740, 612, 1.2, { ...HUNTER, hold: gone ? null : 'rifle', armF: 40, face: -1, mood: gone ? 'shock' : 'neutral' });
      if (gone) {
        const p = prog(t, tp, 1.4);
        puff(552, 540, p, 2.2, 1); puff(658, 556, p, 1.8, 2); puff(712, 520, p, 2.2, 3);
        for (let i = 0; i < 6; i++) { const r = rng(i + 9); puff(r() * 1280, 380 + r() * 200, prog(t, tp + r() * .4, 1.2), .7, i + 20); }
      }
      ctx.restore();
      // suspense darken
      alpha(prog(t, .2, tp - .3) * .5 * (gone ? 0 : 1), () => vignette(.9));
      if (gone) flash(1 - prog(t, tp, .45));
    }
    // world map of poofs
    if (t >= te - .4) {
      alpha(prog(t, te - .4, .4), () => {
        sky('#0c1530', '#1d2b55'); stars(4, 80, t);
        worldMap(40, 90, 1200, 560, '#3a8f5a', 'rgba(255,255,255,.15)');
        LAND_PTS.forEach((p, i) => { const r = rng(i * 7 + 1); const st = te + r() * 2.2; const [x, y] = mapXY(p[0], p[1], 40, 90, 1200, 560); if (t < st) drawPistol(x - 6, y - 2, .7); puff(x, y, prog(t, st, .9), .45, i); });
        const rem = Math.max(0, Math.floor(1000000000 * (1 - easeIn(prog(t, te, 2.6)))));
        withCard(400, 20, 480, 90, 1, '#111a', () => { text('GUNS LEFT: ' + rem.toLocaleString('en-US'), 240, 45, 40, rem ? '#ffd23f' : '#5df2a0', { weight: 900 }); });
      });
    }
  },

  // 4 ─ Reactions
  react(t, sc) {
    shots(t, sc, {
      0: (u) => {
        streetBG(t + 20); walkers(20 + t, 610);
        person(640, 612, 1.3, { ...COP, holster: 'empty', mood: 'happy' });
        withCard(40, 30, 230, 80, 1, '#ffffffee', () => { text('ONE MINUTE LATER', 115, 26, 16, '#666'); text('9:01 AM', 115, 54, 34, '#222', { weight: 900 }); });
      },
      1: (u) => {
        sky('#7ec8f2', '#d9f1ff', 720); city(5, 720, { colors: ['#5e7fa8', '#6d8db5', '#7b6f9e', '#c07a5a'], minH: 300, varH: 300 });
        const reach = easeInOut(prog(u, .6, .8));
        ctx.save(); ctx.translate(640, 900); ctx.scale(1, 1);
        person(0, 0, 6.2, { ...COP, holster: 'empty', armF: lerp(10, -12, reach), armB: -8, mood: u > 1.8 ? 'shock' : 'neutral', noShadow: true, headY: 0 });
        ctx.restore();
        emote(780, 200, '?', prog(u, 1.6, .4)); emote(840, 150, '?', prog(u, 2.0, .4), '#ffd23f');
      },
      2: (u) => {
        sky('#9fd3a8', '#e6f4d9', 720);
        for (let i = 0; i < 12; i++) pine(i * 120 + 20, 520 + (i % 2) * 20, 2.6 - (i % 3) * .3, i % 2 ? '#2f6b3f' : '#3b7d4a');
        rect(0, 560, VW, 160, '#6a9b4b');
        person(560, 650, 2.6, { ...HUNTER, armF: 70, armB: 60, mood: u > 1 ? 'confused' : 'neutral', headY: 4 });
        deer(880, 640, 1.8 , -1); emote(560, 290, '?!', prog(u, 1, .4));
        alpha(prog(u, 1.4, .5), () => emote(860, 420, '♥', prog(u, 1.4, .4), '#ff5a7a', '#fff'));
      },
      3: (u) => {
        sky('#f3c27a', '#fbe6bf', 720);
        poly([[0, 540], [300, 470], [700, 520], [1000, 460], [1280, 510], [1280, 720], [0, 720]], '#e2b06b');
        rect(0, 600, VW, 120, '#d49c55');
        for (let i = 0; i < 3; i++) {
          const walk = u < 1.2 ? u * 6 + i : null;
          person(380 + i * 220 + Math.min(u, 1.2) * 30, 640, 2.2, { ...SOLDIER, skin: SKINS[i + 1], walk, armF: walk == null ? 30 : undefined, armB: walk == null ? -20 : undefined, mood: u > 1.4 ? 'shock' : 'neutral', headY: u > 1.4 ? 3 : 0 });
        }
        emote(820, 330, '!?', prog(u, 1.6, .4)); emote(380, 350, '...', prog(u, 2.1, .4));
      },
    });
  },

  // 5 ─ News
  news(t, sc) {
    shots(t, sc, {
      0: (u) => {
        rect(0, 0, VW, VH, '#f1e3c8'); rect(0, 560, VW, 160, '#9c6b45'); for (let x = 0; x < VW; x += 90) line(x, 560, x, 720, 2, 'rgba(0,0,0,.1)');
        rect(80, 100, 220, 180, '#9fd3f2'); line(190, 100, 190, 280, 6, '#fff'); line(80, 190, 300, 190, 6, '#fff');
        tv(560, 110, 560, 320, (x, y, w, h) => {
          rect(x, y, w, h, '#1d3557'); text('BREAKING NEWS', x + w / 2, y + 40, 34, '#fff', { weight: 900 });
          rect(x, y + 70, w, 4, '#e63946');
          const p = prog(u, .2, .5); popText('ALL GUNS', x + w / 2, y + 130, 62, '#ffd23f', p, { weight: 900 });
          popText('GONE WORLDWIDE', x + w / 2, y + 195, 52, '#fff', prog(u, .5, .5), { weight: 900 });
          rect(x, y + h - 50, w, 50, '#e63946'); text('LIVE', x + 40, y + h - 25, 22, '#fff', { weight: 900 });
          const tick = 'POLICE ARMORIES EMPTY  •  MILITARY BASES REPORT MISSING WEAPONS  •  NO EXPLANATION YET  •  ';
          ctx.save(); ctx.beginPath(); ctx.rect(x + 80, y + h - 50, w - 80, 50); ctx.clip(); text(tick + tick, x + 80 - (u * 140) % 900, y + h - 25, 20, '#fff', { align: 'left' }); ctx.restore();
        });
        // couch + family
        fillRR(60, 470, 440, 120, 30, '#c0504d');
        bust(150, 500, 2, { skin: '#f2c9a0', shirt: '#4c8ed9', mood: 'shock', face: 1, armF: 150 + Math.sin(u * 10) * 5 });
        bust(260, 500, 1.9, { skin: '#f2c9a0', shirt: '#e05297', long: true, hair: '#8a4b20', mood: 'shock', face: 1 });
        bust(370, 520, 1.4, { skin: '#f2c9a0', shirt: '#f2b632', hair: '#c9a14a', mood: 'shock', face: 1 });
        fillRR(40, 530, 480, 70, 20, '#d9605c');
      },
      1: (u) => {
        sky('#2b3a67', '#6d7fb3', 560); city(5, 560, { colors: ['#3c4f7c', '#46598a', '#52457a'], night: 1, minH: 140, varH: 200 }); street(560, { walk: '#8a8597', road: '#2a2c33' });
        const r = rng(3);
        for (let i = 0; i < 9; i++) { const P = randPerson(r); person(70 + i * 140, 620 + (i % 2) * 14, 1.4, { ...P, hold: 'phone', armF: 75, glow: true, mood: i % 3 ? 'shock' : 'confused', face: i % 2 ? 1 : -1 }); }
        const posts = ['#WhereDidTheGunsGo', 'IS THIS REAL??', 'my holster is EMPTY', 'Pentagon: "no comment"', 'BREAKING: worldwide', '#NoMoreGuns', 'what happened???', 'church bells ringing here'];
        posts.forEach((s, i) => { const p = prog(u, .1 + i * .28, .4); const x = 120 + (i % 4) * 340, y = 110 + Math.floor(i / 4) * 130 + Math.sin(u * 2 + i) * 6; label(s, x, y, 22, i % 2 ? '#fff' : '#ffd23f', '#1a1a2e', p); });
      },
      2: (u) => {
        rect(0, 0, VW, VH, '#dfe8ec'); rect(0, 580, VW, 140, '#b7c4c9');
        fillRR(380, 90, 780, 330, 10, '#2d4a3e'); rect(370, 410, 800, 14, '#8a6a45');
        ctx.save(); ctx.globalAlpha = .9; text('E = mc²  ?', 560, 160, 40, '#f0f0f0', { weight: 600 }); text('∑ guns(t) = 0 ???', 860, 240, 40, '#f0f0f0', { weight: 600 }); text('physics?? magic??', 620, 330, 36, '#f0f0f0', { weight: 600 }); ctx.restore();
        popText('?', 1060, 330, 120, '#ffd23f', prog(u, .4, .5), { weight: 900 });
        person(300, 650, 2.2, { skin: '#ffdbac', shirt: '#9b59b6', coat: '#fafafa', pants: '#3b3b3b', hair: '#777', mood: 'confused', armF: 165, armB: -5 });
        person(520, 660, 2.1, { skin: '#8d5524', shirt: '#4c8ed9', coat: '#fafafa', pants: '#2f3b55', mood: 'worried', armF: 120, armB: 120, face: -1 });
        person(1050, 660, 2, { skin: '#e0a77a', shirt: '#5cb85c', coat: '#fafafa', pants: '#3b3b3b', long: true, hair: '#111', mood: 'shock', hold: 'paper', armF: 70 });
        emote(300, 360, '???', prog(u, .9, .4));
      },
      3: (u) => {
        sky('#2b3a67', '#e8a87c', 720);
        // domed government building
        rect(240, 330, 800, 260, '#e9e4d8'); for (let i = 0; i < 12; i++) rect(270 + i * 64, 380, 22, 210, '#d6d0c2');
        poly([[220, 330], [1060, 330], [640, 250]], '#ddd6c6'); ctx.beginPath(); ctx.arc(640, 250, 120, Math.PI, 0); ctx.fillStyle = '#efeadf'; ctx.fill(); rect(630, 100, 20, 40, '#ddd');
        rect(0, 590, VW, 130, '#7d8a6a'); rect(440, 590, 400, 130, '#c9c3b8');
        const fl = (Math.floor(u * 3) % 2);
        label('EMERGENCY SESSION', 640, 470, 34, fl ? '#e63946' : '#b3202c', '#fff', prog(u, .2, .4));
        for (let i = 0; i < 4; i++) car(-200 + ((u * 260 + i * 330) % 1700), 690, ['#111', '#222', '#333', '#1a1a1a'][i], 1);
        for (let i = 0; i < 5; i++) person(520 + i * 60, 600, 1, { shirt: '#222', pants: '#222', skin: SKINS[i], hold: 'briefcase', walk: u * 7 + i, face: -1, mood: 'worried' });
      },
    });
  },

  // 6 ─ Two moods
  mood(t, sc) {
    const l1 = L(sc, 1), l2 = L(sc, 2);
    const split = lerp(640, 640, 0);
    const focus = t < l1 - .2 ? 0 : t < l2 - .2 ? -1 : 1;
    const fL = focus === 1 ? .55 : 0, fR = focus === -1 ? .55 : 0;
    // left: celebration
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, split, VH); ctx.clip();
    sky('#ffcf6b', '#ffeccc', 720); city(21, 560, { colors: ['#e3a36b', '#d98e5a', '#f0b87d'], minH: 120, varH: 220, minW: 70 });
    rect(0, 560, VW, 160, '#d9cbb3');
    const r = rng(9);
    for (let i = 0; i < 8; i++) { const P = randPerson(r); const j = Math.abs(Math.sin(t * 5 + i)) * 18; person(40 + i * 78, 640 + (i % 2) * 30, 1.25, { ...P, jump: j, armF: 165 + Math.sin(t * 6 + i) * 10, armB: -165, mood: 'joy', face: i % 2 ? 1 : -1 }); }
    person(330, 660, 1.4, { skin: '#c68642', shirt: '#3bb3a8', hold: 'sign', signText: 'NO MORE GUNS!', armF: 175, mood: 'joy' });
    confetti(t, 5, 70);
    text('CELEBRATING', 320, 70, 44, '#fff', { weight: 900, stroke: 8, strokeColor: '#c0392b' });
    alpha(fL, () => rect(0, 0, VW, VH, '#000'));
    ctx.restore();
    // right: afraid
    ctx.save(); ctx.beginPath(); ctx.rect(split, 0, VW - split, VH); ctx.clip();
    sky('#1f2b4d', '#55688f', 720); stars(8, 60, t, 300);
    rect(640, 540, 640, 180, '#3d5236');
    // farm
    house(700, 560, 170, 120, '#8c3b32', '#5a2620', { win: '#ffd970' }); rect(880, 520, 6, 40, '#6b4a2a');
    for (let i = 0; i < 6; i++) line(890 + i * 24, 560, 890 + i * 24, 530, 4, '#7a5a3a'); line(890, 540, 1010, 540, 4, '#7a5a3a');
    person(800, 650, 1.6, { skin: '#f2c9a0', shirt: '#4a6a9a', pants: '#3b4a6b', hat: 'cowboy', mood: 'worried', armF: 20 });
    // shop
    rect(1030, 330, 250, 260, '#5a5f78'); rect(1030, 330, 250, 50, '#b3202c'); text('SHOP', 1155, 356, 26, '#fff', { weight: 900 }); rect(1050, 400, 210, 120, '#ffe7a3');
    bust(1150, 500, 1.5, { skin: '#a8714a', shirt: '#2f3e6b', hair: '#111', mood: 'worried', face: -1 });
    rect(1040, 500, 230, 90, '#7a5236');
    emote(800, 430, '?', prog(t, l2 + .5, .4)); emote(1240, 430, '!', prog(t, l2 + 1.4, .4));
    text('AFRAID', 960, 70, 44, '#fff', { weight: 900, stroke: 8, strokeColor: '#1f2b4d' });
    alpha(fR, () => rect(0, 0, VW, VH, '#000'));
    ctx.restore();
    line(split, 0, split, VH, 6, '#fff', 'butt');
  },

  // 7 ─ Chaos
  chaos(t, sc) {
    const siren = (Math.floor(t * 4) % 2);
    shots(t, sc, {
      0: (u) => {
        sky('#0b1024', '#26305a', 560); stars(2, 60, t, 300); city(5, 560, { colors: ['#2c3756', '#333f63', '#3b345c'], night: 1, minH: 140, varH: 220 }); street(560, { walk: '#5a5866', road: '#1e2026', lane: '#8a7f3a' });
        const r = rng(4); for (let i = 0; i < 8; i++) { const P = randPerson(r); person(((i * 190 + u * 220) % 1500) - 100, 615 + (i % 2) * 10, 1.1, { ...P, walk: u * 11 + i, mood: 'shock', armF: 60, armB: -60 }); }
        car(640 + Math.sin(u) * 10, 650, '#f4f4f4', 1.2); rect(600, 584, 30, 8, siren ? '#ff2a2a' : '#2a6bff'); rect(630, 584, 30, 8, siren ? '#2a6bff' : '#ff2a2a');
        alpha(.18, () => rect(0, 0, VW, VH, siren ? '#ff2a2a' : '#2a6bff'));
      },
      1: (u) => {
        sky('#0b1024', '#26305a', 560); city(6, 560, { colors: ['#2c3756', '#333f63', '#3b345c'], night: 1, minH: 160, varH: 200 }); street(560, { walk: '#5a5866', road: '#1e2026', lane: '#8a7f3a' });
        rect(860, 380, 300, 180, '#3a3f58'); rect(880, 400, 260, 110, '#ffe7a3'); rect(860, 360, 300, 30, '#e63946'); text('24/7 STORE', 1010, 375, 20, '#fff');
        // robber stops, shows empty hand, then flees, cop chases
        const stop = 1.1, flee = 2.2;
        const rx = u < stop ? lerp(300, 760, u / stop) : u < flee ? 760 : lerp(760, -200, (u - flee) / 1.6);
        const dir = u < flee ? 1 : -1;
        person(rx, 615, 1.5, { skin: '#e0a77a', shirt: '#333', stripes: '#ddd', pants: '#222', mask: true, face: dir, walk: (u < stop || u > flee) ? u * 12 : null, armF: (u >= stop && u < flee) ? 90 : undefined, mood: u < stop ? 'angry' : 'shock' });
        if (u >= stop && u < flee) emote(rx, 420, '...', prog(u, stop, .3));
        person(1010, 615, 1.5, { skin: '#c68642', shirt: '#3bb3a8', pants: '#2f3b55', face: -1, hold: 'bat', armF: 150, mood: 'angry' });
        if (u > flee - .3) { const cx = lerp(1350, 300, prog(u, flee, 2)); person(cx, 620, 1.5, { ...COP, holster: 'empty', face: -1, walk: u * 12, hold: 'baton', armF: 120 }); }
        label('UNARMED TOO', 640, 120, 36, '#ffd23f', '#111', prog(u, stop + .3, .4));
      },
      2: (u) => {
        sky('#16203d', '#3b4a7a', 720); rect(0, 560, VW, 160, '#3b3f4a');
        const items = ['baton', 'spray', 'taser', 'shield', 'baton'];
        items.forEach((it, i) => person(200 + i * 220, 640, 2, { ...COP, skin: SKINS[i], holster: 'empty', hold: it, armF: it === 'shield' ? 60 : 80, mood: 'neutral', hat: 'police' }));
        ['BATONS', 'PEPPER SPRAY', 'TASERS'].forEach((s, i) => label(s, 300 + i * 340, 120, 30, '#fff', '#16203d', prog(u, .3 + i * .5, .4)));
      },
      3: (u) => {
        rect(0, 0, VW, VH, '#f4f1ea'); rect(0, 600, VW, 120, '#cfc6b4');
        const shelves = [['BASEBALL BATS', 'bat'], ['LOCKS', 'lock'], ['CAMERAS', 'cam']];
        shelves.forEach(([n, k], i) => {
          const x = 90 + i * 400; rect(x, 150, 320, 330, '#b8875a'); for (let s = 0; s < 3; s++) rect(x, 250 + s * 100, 320, 10, '#8a6440');
          const left = Math.max(0, 12 - Math.floor(u * 4 + i * 2));
          for (let j = 0; j < left; j++) { const sx = x + 20 + (j % 4) * 75, sy = 240 + Math.floor(j / 4) * 100; if (k === 'bat') { line(sx + 10, sy, sx + 30, sy - 70, 9, '#3a2a1a'); line(sx + 10, sy, sx + 30, sy - 70, 6, '#f0d9a8'); } else if (k === 'lock') { fillRR(sx, sy - 40, 40, 36, 6, '#d4a017'); ctx.beginPath(); ctx.arc(sx + 20, sy - 42, 12, Math.PI, 0); ctx.lineWidth = 5; ctx.strokeStyle = '#999'; ctx.stroke(); } else { fillRR(sx, sy - 40, 48, 28, 6, '#333'); circle(sx + 40, sy - 26, 8, '#666'); } }
          text(n, x + 160, 120, 28, '#333', { weight: 900 });
          if (left === 0) { ctx.save(); ctx.translate(x + 160, 330); ctx.rotate(-.15); fillRR(-120, -36, 240, 72, 10, '#e63946'); text('SOLD OUT', 0, 2, 38, '#fff', { weight: 900 }); ctx.restore(); }
        });
        for (let i = 0; i < 10; i++) { const r = rng(i + 50), P = randPerson(r); person(60 + i * 125 - (u * 30 % 125), 690, 1.3, { ...P, mood: i % 2 ? 'worried' : 'neutral', hold: i % 3 === 0 ? 'box' : null, armF: 70 }); }
      },
    });
  },

  // 8 ─ Military
  military(t, sc) {
    shots(t, sc, {
      0: (u) => {
        sky('#c9d6b8', '#eef2df', 720); rect(0, 520, VW, 200, '#a8a57a');
        for (let i = 0; i < 4; i++) { const x = 60 + i * 310; rect(x, 360, 260, 160, '#6b7550'); ctx.beginPath(); ctx.arc(x + 130, 360, 130, Math.PI, 0); ctx.fillStyle = '#7a8560'; ctx.fill(); rect(x + 105, 440, 50, 80, '#3d4430'); }
        line(1180, 520, 1180, 250, 5, '#ccc'); rect(1182, 250, 70, 44, '#4c8ed9');
        // empty rack
        fillRR(520, 540, 260, 100, 6, '#5a4630'); for (let i = 0; i < 6; i++) line(545 + i * 42, 555, 545 + i * 42, 625, 3, '#2e2418');
        label('EMPTY', 650, 590, 24, '#e63946', '#fff', prog(u, .4, .4));
        for (let i = 0; i < 3; i++) person(240 + i * 120, 650, 1.6, { ...SOLDIER, skin: SKINS[i * 2], face: 1, mood: 'shock', armF: 100 + i * 20, armB: -20 });
        person(980, 650, 1.8, { ...SOLDIER, shirt: '#3d4a28', hat: 'none', hair: '#777', mood: 'angry', armF: 140, armB: -140 });
        emote(980, 410, '!!', prog(u, .6, .4));
      },
      1: (u) => {
        sky('#c9d6b8', '#eef2df', 720); rect(0, 540, VW, 180, '#a8a57a');
        const p = prog(u, .5, .1);
        tank(640, 600, 2.4, { barrel: u < .55 });
        puff(900, 400, prog(u, .5, 1.2), 2.2, 5);
        const items = ['RIFLES', 'MACHINE GUNS', 'TANK CANNONS'];
        items.forEach((s, i) => { const pp = prog(u, .8 + i * .55, .4); withCard(130 + i * 360, 70, 300, 80, pp, '#fff', (w, h) => { text(s, w / 2 - 20, h / 2, 26, '#222', { weight: 900 }); cross(w - 36, h / 2, 16, '#e63946', prog(u, 1 + i * .55, .3)); }); });
      },
      2: (u) => {
        sky('#060914', '#121a35');
        worldMap(40, 90, 1200, 560, '#1f3d4a', 'rgba(120,200,255,.25)');
        const hubs = [[-98, 39], [37, 55], [105, 35], [10, 50], [78, 22]];
        hubs.forEach((h, i) => { const [x, y] = mapXY(h[0], h[1], 40, 90, 1200, 560); for (let k = 0; k < 3; k++) { const rr2 = (((u * 60 + k * 40) % 120) + 120) % 120; ctx.beginPath(); ctx.arc(x, y, rr2, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,80,80,${1 - rr2 / 120})`; ctx.stroke(); } circle(x, y, 6, '#ff5050'); });
        for (let i = 0; i < hubs.length; i++) for (let j = i + 1; j < hubs.length; j++) { if ((i + j) % 2) continue; const a = mapXY(...hubs[i], 40, 90, 1200, 560), b = mapXY(...hubs[j], 40, 90, 1200, 560); ctx.setLineDash([8, 8]); ctx.lineDashOffset = -u * 30; line(a[0], a[1], b[0], b[1], 2, 'rgba(255,210,63,.6)'); ctx.setLineDash([]); }
        for (let i = 0; i < 4; i++) drone(((u * 120 + i * 360) % 1500) - 100, 140 + i * 110 + Math.sin(u * 2 + i) * 10, 1.4, u + i);
        label('MISSILES & DRONES STILL EXIST', 640, 60, 30, '#ffd23f', '#111', prog(u, .3, .4));
      },
    });
  },

  // 9 ─ United Nations
  un(t, sc) {
    shots(t, sc, {
      0: (u) => {
        rect(0, 0, VW, VH, '#123a6b'); for (let x = 0; x < VW; x += 40) line(x, 0, x, VH, 1, 'rgba(255,255,255,.08)'); for (let y = 0; y < VH; y += 40) line(0, y, VW, y, 1, 'rgba(255,255,255,.08)');
        // blueprint of a pistol
        ctx.save(); ctx.translate(640, 330); ctx.scale(9, 9); ctx.lineWidth = .25; ctx.strokeStyle = '#cfe6ff'; ctx.beginPath(); ctx.roundRect(-2, -4, 20, 7, 2); ctx.roundRect(-2, 0, 7, 12, 2); ctx.stroke(); ctx.restore();
        text('THE KNOWLEDGE REMAINS', 640, 120, 46, '#fff', { weight: 900 });
        const p = prog(u, .4, .5); popText('BLUEPRINTS • SKILLS • FACTORIES', 640, 560, 30, '#cfe6ff', p);
        circle(260, 300, 60 + Math.sin(u * 4) * 4, 'rgba(255,230,120,.25)'); circle(260, 300, 40, '#ffe27a'); rect(245, 340, 30, 26, '#aaa');
      },
      1: (u) => {
        sky('#cfd8e3', '#eef2f6', 720); rect(0, 560, VW, 160, '#8a8f99');
        rect(240, 300, 800, 260, '#9aa3ad'); for (let i = 0; i < 5; i++) poly([[240 + i * 160, 300], [400 + i * 160, 300], [400 + i * 160, 230]], '#8a939e');
        for (const [x, h] of [[320, 220], [920, 260]]) { rect(x, 300 - h, 50, h, '#7a838e'); for (let k = 0; k < 4; k++) circle(x + 25 + Math.sin(u + k) * 10, 300 - h - 30 - ((u * 40 + k * 40) % 160), 20 + k * 6, `rgba(220,220,225,${.7 - k * .15})`); }
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(500 + i * 140, 430); ctx.rotate(u * (i % 2 ? -2 : 2)); for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); rect(-8, -44, 16, 14, '#e0b23a'); } circle(0, 0, 34, '#e0b23a'); circle(0, 0, 12, '#9aa3ad'); ctx.restore(); }
        label('COULD RESTART IN WEEKS', 640, 120, 32, '#e63946', '#fff', prog(u, .4, .4));
      },
      2: (u) => {
        sky('#7ec8f2', '#d9f1ff', 560); clouds(t, 2, 4, 60, 160);
        rect(500, 110, 280, 450, '#5d8fae'); for (let y = 130; y < 540; y += 22) rect(510, y, 260, 12, '#9cc5dd');
        rect(300, 470, 680, 90, '#d9dde2');
        for (let i = 0; i < 14; i++) { const x = 120 + i * 80; line(x, 600, x, 470, 3, '#aaa'); rect(x, 470, 34, 22, SHIRTS[i % SHIRTS.length]); }
        rect(0, 560, VW, 160, '#9aa7b5');
        for (let i = 0; i < 6; i++) car(-200 + ((u * 300 + i * 260) % 1700), 680, '#111', 1);
        label('UNITED NATIONS • EMERGENCY SUMMIT', 640, 60, 30, '#fff', '#1d3557', prog(u, .2, .4));
      },
      3: (u) => {
        rect(0, 0, VW, VH, '#eaeef3'); circle(640, 220, 160, 'rgba(76,142,217,.12)');
        worldMap(340, 70, 600, 280, '#bcc6d2', null, (i) => { const p = prog(u, .3 + i * .15, .3); return p > .5 ? '#4caf6e' : '#bcc6d2'; });
        fillRR(140, 470, 1000, 40, 8, '#7a5236');
        for (let i = 0; i < 8; i++) { const x = 200 + i * 125; bust(x, 470, 1.4, { skin: SKINS[i % 6], shirt: ['#222', '#2f3e6b', '#444', '#5a3a22'][i % 4], hair: HAIRS[i % 6], long: i % 3 === 1, mood: 'neutral', armF: 60 + Math.sin(u * 3 + i) * 10, hold: 'paper' }); }
        fillRR(140, 490, 1000, 230, 0, '#8a6440');
        label('AGREEMENT: STOP MAKING GUNS', 640, 400, 30, '#fff', '#2e7d4f', prog(u, .6, .4));
      },
      4: (u) => {
        rect(0, 0, VW, VH, '#eaeef3');
        worldMap(140, 90, 1000, 470, '#4caf6e');
        const r = rng(77); for (let i = 0; i < 9; i++) { const p = LAND_PTS[Math.floor(r() * LAND_PTS.length)]; const [x, y] = mapXY(p[0], p[1], 140, 90, 1000, 470); const pp = prog(u, .2 + i * .15, .3); if (pp > 0) circle(x, y, 22 * backOut(pp), 'rgba(217,83,79,.35)'); cross(x, y, 12, '#b3202c', pp); }
        label('NOT EVERYONE SIGNS', 640, 50, 34, '#fff', '#b3202c', prog(u, .3, .4));
      },
    });
  },

  // 10 ─ Good things
  good(t, sc) {
    shots(t, sc, {
      0: (u) => {
        sky('#ffd9a0', '#fff4dd', 560); sun(640, 420, 80, '#ffd36b'); clouds(t, 6, 4, 60, 160);
        rect(0, 520, VW, 200, '#7cc46b'); for (const x of [100, 330, 980, 1180]) tree(x, 540, 1.3, '#4fae5a');
        const r = rng(31); for (let i = 0; i < 7; i++) { const P = randPerson(r); person(200 + i * 150, 620 + (i % 2) * 20, i % 3 === 2 ? .8 : 1.3, { ...P, walk: i % 2 ? u * 5 + i : null, face: i % 2 ? 1 : -1, mood: 'happy', armF: i % 2 ? undefined : 30 }); }
        label('ONE YEAR LATER', 640, 90, 36, '#fff', '#2e7d4f', prog(u, .2, .4));
      },
      1: (u) => {
        rect(0, 0, VW, VH, '#10213a');
        text('GUN DEATHS PER YEAR (WORLDWIDE)', 640, 90, 34, '#cfe6ff', { weight: 800 });
        const drop = easeInOut(prog(u, 3.2, 2.5));
        const v = Math.round(250000 * (1 - drop * .97) / 1000) * 1000;
        text('≈ ' + v.toLocaleString('en-US'), 640, 190, 80, drop > .5 ? '#5df2a0' : '#ff6b6b', { weight: 900 });
        // bars: 10 bars, last ones drop
        for (let i = 0; i < 10; i++) { const base = 260 + Math.sin(i) * 12; const h = i < 7 ? base : base * (1 - drop * (.75 + (i - 7) * .1)); const x = 220 + i * 86; const pp = prog(u, .2 + i * .08, .4); fillRR(x, 600 - h * pp, 60, h * pp, 6, i < 7 ? '#ff6b6b' : '#5df2a0'); text(i < 7 ? 'BEFORE' : 'AFTER', x + 30, 625, 12, '#8aa'); }
        line(200, 600, 1080, 600, 3, '#cfe6ff');
        alpha(prog(u, 3.2, .4), () => arrow(1130, 330, 1130, 560, 10, '#5df2a0'));
      },
      2: (u) => {
        rect(0, 0, VW, VH, '#eef7ef');
        [['MASS SHOOTINGS', 'STOP'], ['HOME ACCIDENTS', 'STOP']].forEach(([a, b], i) => withCard(140 + i * 530, 160, 470, 360, prog(u, .1 + i * 1.1, .5), '#fff', (w, h) => {
          text(a, w / 2, 70, 36, '#222', { weight: 900 });
          if (i === 0) { for (let k = 0; k < 5; k++) person(95 + k * 70, 280, 1.2, { ...randPerson(rng(k + 3)), mood: 'happy', noShadow: true }); }
          else { house(160, 280, 150, 120, '#e8c79a', '#b5523b'); person(360, 280, 1.2, { skin: '#ffdbac', shirt: '#f2b632', mood: 'joy', noShadow: true, armF: 160, armB: -160 }); }
          check(w - 34, 34, 20, '#2ecc71', prog(u, .6 + i * 1.1, .4));
          text(b, w / 2, 320, 30, '#2e7d4f', { weight: 900 });
        }));
      },
      3: (u) => {
        const night = prog(u, 2.6, .8);
        // school by day → night street
        alpha(1 - night, () => {
          sky('#86cdf5', '#e0f4ff', 560); rect(0, 520, VW, 200, '#7cc46b');
          rect(380, 220, 520, 300, '#d9734e'); poly([[360, 220], [920, 220], [640, 140]], '#9b3d2a'); for (let i = 0; i < 6; i++) rect(410 + i * 80, 270, 50, 50, '#cfe8f5'); rect(600, 420, 80, 100, '#6b4428'); text('SCHOOL', 640, 195, 24, '#fff', { weight: 900 });
          for (let i = 0; i < 8; i++) { const r = rng(i + 70), P = randPerson(r); const j = Math.abs(Math.sin(u * 6 + i)) * 20; person(120 + i * 150, 640 + (i % 2) * 20, .85, { ...P, jump: j, mood: 'joy', armF: 150, armB: -150 }); }
          circle(300 + Math.sin(u * 3) * 200, 560 - Math.abs(Math.sin(u * 4)) * 120, 12, '#e63946');
        });
        alpha(night, () => {
          sky('#0d1633', '#28325e', 560); stars(12, 90, t, 360); circle(1060, 120, 40, '#f5f1d0');
          city(17, 560, { colors: ['#2c3756', '#333f63', '#3b345c'], night: 1 }); street(560, { walk: '#5a5866', road: '#1e2026', lane: '#8a7f3a' });
          for (const x of [200, 640, 1080]) { line(x, 560, x, 380, 6, '#444'); circle(x, 380, 36, 'rgba(255,230,140,.3)'); circle(x, 380, 12, '#ffe28a'); }
          person(lerp(300, 820, prog(u, 2.6, 4)), 615, 1.6, { skin: '#ffdbac', shirt: '#e05297', pants: '#2f3b55', long: true, hair: '#c9a14a', walk: u * 6, mood: 'happy', hold: 'phone', armF: 40 });
        });
      },
    });
  },

  // 11 ─ Bad things
  bad(t, sc) {
    shots(t, sc, {
      0: (u) => {
        sky('#3a3f4f', '#6b6f80'); clouds(t, 9, 7, 60, 300, 'rgba(60,65,80,.95)', 18);
        const fl = Math.max(0, Math.sin(u * 7)) > .97 ? 1 : 0; flash(fl * .4);
        popText('BUT...', 640, 360, 130, '#ff6b6b', prog(u, .1, .5), { weight: 900, stroke: 10, strokeColor: '#111' });
      },
      1: (u) => {
        sky('#0b1024', '#26305a', 560); city(6, 560, { colors: ['#2c3756', '#333f63', '#3b345c'], night: 1 }); street(560, { walk: '#5a5866', road: '#1e2026', lane: '#8a7f3a' });
        rect(0, 0, VW, VH, 'rgba(0,0,0,.25)');
        person(520, 620, 1.9, { skin: '#e0a77a', shirt: '#333', pants: '#222', hat: 'beanie', mood: 'angry', hold: 'knife', armF: 70, face: 1 });
        person(780, 620, 1.9, { skin: '#ffdbac', shirt: '#4c8ed9', pants: '#2f3b55', mood: 'shock', armF: 150, armB: 150, face: -1 });
        label('CRIME DOESN\'T DISAPPEAR', 640, 110, 34, '#fff', '#b3202c', prog(u, .3, .4));
      },
      2: (u) => {
        sky('#141c3a', '#3a4a7a', 560); stars(3, 70, t, 300); circle(1100, 110, 36, '#f5f1d0');
        rect(0, 520, VW, 200, '#33502f');
        for (let i = 0; i < 12; i++) line(100 + i * 70, 600, 100 + i * 70, 540, 4, '#7a5a3a'); line(100, 560, 870, 560, 4, '#7a5a3a'); line(100, 585, 870, 585, 4, '#7a5a3a');
        for (let i = 0; i < 5; i++) sheep(200 + i * 120 + Math.sin(u * 3 + i) * 6, 660, 1.6, i % 2 ? 1 : -1);
        const wx = lerp(1400, 1000, easeOut(prog(u, .2, 1.5)));
        wolf(wx, 640, 1.8, -1); wolf(wx + 140, 670, 1.6, -1);
        person(160, 640, 1.6, { skin: '#f2c9a0', shirt: '#7a2e2e', pants: '#3b4a6b', hat: 'cowboy', mood: 'worried', hold: null, armF: 60 });
        emote(160, 420, '!', prog(u, 1.2, .4));
      },
      3: (u) => {
        sky('#9fd3a8', '#e6f4d9', 720); rect(0, 540, VW, 180, '#6a9b4b');
        for (let i = 0; i < 9; i++) pine(i * 150 + 20, 540, 2, '#2f6b3f');
        const n = 2 + Math.floor(prog(u, .2, 2.2) * 14);
        const r = rng(5);
        for (let i = 0; i < n; i++) { const x = 60 + r() * 1150, y = 590 + r() * 110, f = r() < .5 ? 1 : -1; if (i % 3 === 2) boar(x, y, 1.3, f); else deer(x, y, 1.1, f); }
        withCard(930, 40, 300, 170, 1, '#fffffff0', (w, h) => { text('POPULATION', w / 2, 30, 22, '#333', { weight: 900 }); ctx.beginPath(); ctx.moveTo(30, 140); const pp = prog(u, .2, 2.2); for (let k = 0; k <= 20; k++) { const x = 30 + k / 20 * 240 * pp; ctx.lineTo(x, 140 - Math.pow(k / 20 * pp, 2) * 90); } ctx.lineWidth = 5; ctx.strokeStyle = '#e63946'; ctx.stroke(); });
      },
      4: (u) => {
        sky('#9aa3ad', '#d3d8de', 560); rect(0, 560, VW, 160, '#8a8f99');
        rect(280, 260, 720, 300, '#7a838e'); for (let i = 0; i < 4; i++) poly([[280 + i * 180, 260], [460 + i * 180, 260], [460 + i * 180, 200]], '#6d757f');
        rect(560, 400, 160, 160, '#4a4f57'); ctx.save(); ctx.translate(640, 380); ctx.rotate(-.12); fillRR(-120, -34, 240, 68, 8, '#e63946'); text('CLOSED', 0, 2, 42, '#fff', { weight: 900 }); ctx.restore();
        for (let i = 0; i < 6; i++) { const x = 120 + i * 200 + (i > 2 ? 100 : 0); person(x + u * 20 * (i % 2 ? -1 : 1), 650, 1.5, { skin: SKINS[i], shirt: '#4a6a9a', pants: '#3b3b3b', hat: 'hardhat', mood: 'sad', hold: 'box', armF: 70, face: i % 2 ? -1 : 1, headY: 3 }); }
      },
      5: (u) => {
        rect(0, 0, VW, VH, '#2b2d42'); rect(0, 560, VW, 160, '#1f2133');
        const lean = Math.sin(u * 2) * 3;
        person(470, 650, 3.6, { skin: '#c68642', shirt: '#e63946', pants: '#222', mood: 'angry', armF: 50, armB: -40, lean });
        person(840, 650, 2.0, { skin: '#ffdbac', shirt: '#4c8ed9', pants: '#2f3b55', mood: 'worried', face: -1, armF: 140, armB: 140 });
        label('STRENGTH WINS', 640, 100, 36, '#fff', '#e63946', prog(u, .3, .4));
      },
    });
  },

  // 12 ─ Archery
  archery(t, sc) {
    shots(t, sc, {
      0: (u) => { rect(0, 0, VW, VH, '#fff7e0'); popText('MEANWHILE...', 640, 360, 100, '#f2b632', prog(u, .1, .5), { weight: 900, stroke: 10, strokeColor: '#5a3a10' }); },
      1: (u) => {
        sky('#86cdf5', '#e0f4ff', 520); rect(0, 500, VW, 220, '#7cc46b'); for (const x of [80, 1200]) tree(x, 520, 1.4);
        for (let i = 0; i < 3; i++) { const y = 380 + i * 110; const tx = 1050; circle(tx, y, 50 - i * 6, '#fff'); circle(tx, y, 38 - i * 5, '#e63946'); circle(tx, y, 26 - i * 4, '#fff'); circle(tx, y, 14 - i * 3, '#ffd23f'); line(tx, y + 40, tx, y + 110, 6, '#7a5a3a'); }
        for (let i = 0; i < 3; i++) {
          const y = 470 + i * 110; person(200 + i * 40, y + 80, 1.5 + i * .1, { ...randPerson(rng(i + 90)), hold: 'bow', armF: 90, armB: 80, mood: 'happy' });
          const cyc = (u * .9 + i * .33) % 1.3; const p = clamp(cyc / .5); const ax = lerp(260 + i * 40, 1040, p), ay = lerp(y - 40 + i * 5, 380 + i * 110, p) - Math.sin(p * Math.PI) * 30;
          line(ax - 40, ay, ax, ay, 3, '#6b4a2a'); poly([[ax, ay - 5], [ax + 10, ay], [ax, ay + 5]], '#888');
        }
      },
      2: (u) => {
        rect(0, 0, VW, VH, '#f4ede0'); rect(0, 600, VW, 120, '#c2a77d');
        rect(120, 120, 560, 420, '#7a5a3a'); rect(140, 180, 520, 340, '#5e4430'); for (let s = 0; s < 3; s++) rect(140, 280 + s * 100, 520, 10, '#3e2c1e');
        rect(120, 80, 560, 60, '#2e7d4f'); text('ARCHERY SHOP', 400, 110, 30, '#fff', { weight: 900 });
        ctx.save(); ctx.translate(400, 380); ctx.rotate(-.12); fillRR(-200, -46, 400, 92, 12, '#e63946'); text('BOWS SOLD OUT', 0, 2, 40, '#fff', { weight: 900 }); ctx.restore();
        withCard(760, 140, 420, 300, 1, '#fff', (w, h) => { text('BOW SALES', w / 2, 36, 26, '#222', { weight: 900 }); for (let k = 0; k < 6; k++) { const hh = (k < 3 ? 20 + k * 6 : 60 + Math.pow(k - 2, 2.2) * 22) * prog(u, .2 + k * .12, .4); fillRR(40 + k * 60, 260 - hh, 44, hh, 4, k < 3 ? '#aab' : '#2ecc71'); } });
        for (let i = 0; i < 9; i++) { const P = randPerson(rng(i + 110)); person(80 + i * 130, 690, 1.3, { ...P, face: -1, mood: i % 2 ? 'happy' : 'worried' }); }
      },
    });
  },

  // 13 ─ Wars slow down
  war(t, sc) {
    shots(t, sc, {
      0: (u) => {
        sky('#a9a497', '#d8d3c5', 720); rect(0, 480, VW, 240, '#8d7b5d');
        for (let i = 0; i < 6; i++) { const r = rng(i); circle(r() * VW, 200 + r() * 200, 60 + u * 20, `rgba(120,115,105,${.4 - u * .06})`); }
        rect(0, 560, VW, 40, '#6b5a40'); for (let i = 0; i < 16; i++) fillRR(i * 82, 540, 70, 30, 12, '#b9a57a');
        for (let i = 0; i < 4; i++) bust(200 + i * 280, 560, 1.6, { ...SOLDIER, skin: SKINS[i], mood: i % 2 ? 'sad' : 'neutral', armF: 30 });
      },
      1: (u) => {
        sky('#e9dfc9', '#f6f0e2'); worldMap(40, 90, 1200, 560, '#d1c3a0', 'rgba(0,0,0,.15)');
        const fr = [[20, 48], [35, 33], [30, 15], [100, 20]];
        fr.forEach((f, i) => { const [x, y] = mapXY(f[0], f[1], 40, 90, 1200, 560); const len = 60 * (1 - easeOut(prog(u, .3, 1.5))) + 10; arrow(x - len, y, x, y, 6, '#b3202c'); fillRR(x + 8, y - 14, 60, 28, 8, '#fff'); text('STALL', x + 38, y, 14, '#b3202c', { weight: 900 }); });
      },
      2: (u) => {
        sky('#bfe3f5', '#f2fbff', 560); rect(0, 520, VW, 200, '#9bc47b');
        for (let i = 0; i < 4; i++) person(lerp(-100, 280, easeOut(prog(u, 0, 1.5))) + i * 110, 640, 1.6, { skin: SKINS[i], shirt: '#5a7a9a', pants: '#3b4a5b', hat: 'blue', mood: 'happy', walk: u < 1.5 ? u * 7 + i : null });
        person(820, 640, 1.6, { ...SOLDIER, mood: 'happy', armF: 75, face: 1 });
        person(920, 640, 1.6, { ...SOLDIER, skin: '#8d5524', shirt: '#7a6a3a', pants: '#5b4b33', vest: '#6a5a2a', mood: 'happy', armF: 75, face: -1 });
        for (let i = 0; i < 4; i++) dove(((u * 140 + i * 300) % 1500) - 100, 120 + i * 50 + Math.sin(u * 2 + i) * 10, 1.2, u + i);
        label('CEASE-FIRE', 870, 400, 30, '#fff', '#3d8de0', prog(u, .8, .4));
      },
    });
  },

  // 14 ─ Five years later
  later(t, sc) {
    shots(t, sc, {
      0: (u) => {
        const p = prog(u, 0, 1.6);
        sky('#141a3a', '#3a3f7a');
        const yr = 2026 + Math.floor(easeOut(p) * 5);
        popText(String(yr), 640, 300, 160, '#ffd23f', prog(u, 0, .4), { weight: 900, stroke: 10, strokeColor: '#111' });
        popText('5 YEARS LATER', 640, 450, 56, '#fff', prog(u, 1.2, .4), { weight: 900 });
      },
      1: (u) => {
        sky('#7ec8f2', '#e5f6ff', 560); sun(1100, 110, 44); clouds(t, 13, 5, 60, 180);
        city(23, 560, { colors: ['#7fb5d8', '#a3d0a8', '#f2c48a', '#e8a0a0', '#b7a8e0'], minH: 140, varH: 200 });
        street(560, { walk: '#d9d2c4' }); for (const x of [100, 450, 820, 1180]) tree(x, 568, 1.1, '#4fae5a');
        person(560, 620, 1.7, { ...COP, holster: null, mood: 'happy', armF: 70, face: 1 });
        person(660, 620, 1.1, { skin: '#c68642', shirt: '#f2b632', pants: '#1f4f7a', mood: 'joy', face: -1, armF: 150 });
        person(750, 620, 1.6, { skin: '#c68642', shirt: '#9b59b6', pants: '#3b3b3b', long: true, hair: '#111', mood: 'happy', face: -1 });
        walkers(t, 610);
        label('UNARMED POLICE', 560, 340, 28, '#fff', '#2c3e74', prog(u, .4, .4));
      },
      2: (u) => {
        rect(0, 0, VW, VH, '#efe6d6'); rect(0, 580, VW, 140, '#a88a64');
        for (let i = 0; i < 3; i++) { const x = 160 + i * 360; fillRR(x - 10, 140, 300, 230, 6, '#c9a14a'); rect(x, 150, 280, 210, '#f8f4ea'); if (i === 1) drawPistol(x + 90, 230, 4.5); else if (i === 0) drawRifle(x + 140, 255, 2.4); else { drawPistol(x + 60, 210, 2.2); drawPistol(x + 160, 270, 2.2); } rect(x + 90, 390, 100, 30, '#fff'); text('c. 2026', x + 140, 405, 14, '#555'); }
        rect(0, 470, VW, 10, '#c9b590');
        for (let i = 0; i < 4; i++) { const P = randPerson(rng(i + 200)); person(250 + i * 250, 680, i % 2 ? 1.6 : 1.1, { ...P, mood: i % 2 ? 'neutral' : 'confused', armF: i % 2 ? 0 : 150 }); if (i % 2 === 0) emote(250 + i * 250, 520, '?', prog(u, .5 + i * .3, .4)); }
        label('MUSEUM OF HISTORY', 640, 70, 30, '#fff', '#5a3a22', prog(u, .1, .4));
      },
    });
  },

  // 15 ─ Ending
  end(t, sc) {
    const l1 = L(sc, 1), l2 = L(sc, 2), l3 = L(sc, 3);
    sky('#05060f', '#141a3a'); stars(21, 220, t);
    const gx = t < l1 ? 640 : lerp(640, 640, 0);
    const gr = lerp(260, 170, easeInOut(prog(t, l1 - .3, 1)));
    const gy = lerp(380, 330, easeInOut(prog(t, l1 - .3, 1)));
    globe(gx, gy, gr, 60 + t * 10, 15);
    withCard(60, 210, 320, 260, prog(t, l1, .5), '#2a1d1d', (w, h) => {
      ctx.save(); ctx.translate(0, -20);
      rect(60, 150, 200, 90, '#7a838e'); rect(80, 90, 36, 60, '#6d757f'); for (let k = 0; k < 3; k++) circle(98 + k * 8, 76 - k * 22, 14 + k * 4, 'rgba(200,200,205,.7)'); drawPistol(150, 170, 2.6);
      ctx.restore(); text('REBUILD?', w / 2, 225, 34, '#ff6b6b', { weight: 900 });
    });
    withCard(900, 210, 320, 260, prog(t, l2, .5), '#14301f', (w, h) => {
      for (let k = 0; k < 2; k++) dove(130 + k * 70, 90 + k * 40, 1.6, t + k, 1);
      text('A WORLD', w / 2, 180, 30, '#5df2a0', { weight: 900 }); text('WITHOUT GUNS?', w / 2, 220, 30, '#5df2a0', { weight: 900 });
    });
    popText('WHAT DO YOU THINK?', 640, 600, 64, '#ffd23f', prog(t, l3, .5), { weight: 900, stroke: 8, strokeColor: '#111' });
    // end card
    const ep = prog(t, sc.dur - 2.6, .6);
    alpha(ep, () => { rect(0, 0, VW, VH, '#05060f'); stars(21, 220, t); });
    popText('WHAT IF?', 640, 330, 140, '#ffd23f', ep, { weight: 900, stroke: 12, strokeColor: '#1a1030' });
    popText('Thanks for watching', 640, 450, 36, '#fff', prog(t, sc.dur - 2.1, .5), { weight: 700 });
  },
};
