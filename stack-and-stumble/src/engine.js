(() => {
  // ---------- constants ----------
  const COLS = 10, ROWS = 20, CELL = 28;
  const BW = COLS * CELL, RULER = 30, TOP = 46;
  const W = BW + RULER, BH = ROWS * CELL, H = TOP + BH;
  // the climber's body and physics (pixels, seconds)
  const HW = 5, BODYH = 46, ARMS = 49;      // half width, body height, grip height above feet (matches the motions)
  const G = 1500, JUMP_H = 98, JV = Math.sqrt(2 * G * JUMP_H);
  const WALK = 55, RUN = 92, DODGE = 128;
  const SLAM = 0.016;                        // seconds per row while a hard drop slams down
  const TELEPORT_AFTER = 25;                  // seconds boxed in before he reaches for the teleport button
  const CRACK_AT = 5, BREAK_AT = 10;          // seconds of drilling before cracks show, and before the block breaks
  const dropInterval = () => Math.max(0.06, 0.9 * Math.pow(0.85, S.level - 1));
  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
  };
  const TYPES = 'IOTSZJL';
  const LINE_SCORE = [0, 100, 300, 500, 800];

  const SAY = {
    start: ['Here I go!', 'Nice blocks. Thanks!', 'Up we go.'],
    chat: ['Just keep moving.', "You can't stop me!", 'One block at a time.', 'Hmm hm hmm…', 'Great stairs.'],
    near: ['I can see the sky!', 'Almost out!', 'So close…'],
    grab: ['Got it!', 'Gotcha!', 'Free ride!'],
    ride: ['Wheee!', 'Going down?', 'Taxi!'],
    small: ['Hey!', 'Whoa—', 'Easy!', 'Rude.', 'Hng!'],
    big: ['AAAAH!', 'Not again!', 'Seriously?!', 'Noooo—'],
    thrown: ['WHOA!', 'Hey, quit spinning it!', 'Bad driver!'],
    bonk: ['OOF!', 'My head!', 'BONK.', 'Ow ow ow!'],
    slip: ['Losing grip!', 'Nope nope nope—', 'My fingers!'],
    button: ['That\'s it. Plan B.', 'Okay. Cheat code.', 'I didn\'t want to do this…'],
    arrive: ['Ta-da!', 'Teleported!', 'Miss me?'],
    dodge: ['!', 'WHOA!', 'Not on my head!', 'Incoming!', 'Eep!'],
    missed: ['Ha! Missed me!', 'Too slow!', 'Close one!', 'Nice try.'],
    drill: ['Fine. Drill time.', 'Stand back.', 'BRRRRRRT!', 'I came prepared.'],
    smash: ['HA!', 'Out of my way!', 'Demolition!'],
    stuck: ['Let me out!', 'Hmph.', 'Hey! Up here!', 'This is fine.'],
    wait: ['Build it higher!', 'Need a step here…', 'Come on, one more block.', 'I can wait.'],
    look: ['Ooh, that one.', 'Come to papa.', 'I can reach that…'],
    ground: ['Ow.', 'Back to the bottom…', 'My everything.', '…ow.'],
    up: ['Okay. Again.', 'Round two.', "I'm not giving up."],
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---------- motions (from StickMotions, with a plain fallback) ----------
  const STAND = { hip: [0, -17], neck: [0, -34], head: [0, -42], lElbow: [-3, -26], lHand: [-4, -17], rElbow: [3, -26], rHand: [4, -17],
                  lKnee: [-2, -9], lFoot: [-4, 0], rKnee: [2, -9], rFoot: [4, 0] };
  const M = window.StickMotions || {
    sample: () => STAND, duration: () => 0.5, loops: () => true, names: [],
    blend: (a, b, k) => { const o = {}; for (const j in b) o[j] = Array.isArray(b[j]) && a[j] ? [a[j][0] + (b[j][0] - a[j][0]) * k, a[j][1] + (b[j][1] - a[j][1]) * k] : b[j]; return o; },
  };
  const JOINTS = ['hip', 'neck', 'head', 'lElbow', 'lHand', 'rElbow', 'rHand', 'lKnee', 'lFoot', 'rKnee', 'rFoot'];

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const holdC = $('hold'), nextC = $('next');
  const well = $('well');
  const ui = { score: $('score'), lines: $('lines'), level: $('level'), best: $('best'), alt: $('alt'), peak: $('peak') };
  const overlay = $('overlay'), ovTitle = $('ovTitle'), ovText = $('ovText'), ovBtn = $('ovBtn'), ovKeys = $('ovKeys');

  // ---------- theme tokens ----------
  let T = {};
  function readTokens() {
    const cs = getComputedStyle(document.documentElement);
    const g = n => cs.getPropertyValue(n).trim();
    T = { paper: g('--paper'), board: g('--board'), grid: g('--grid'), ink: g('--ink'), muted: g('--muted'),
          wall: g('--wall'), wallInk: g('--wall-ink'), accent: g('--accent'), p: {} };
    for (const t of TYPES) T.p[t] = g('--p-' + t);
    T.hand = getComputedStyle(document.body).fontFamily;
  }
  readTokens();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readTokens); } catch (e) {}
  new MutationObserver(readTokens).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(readTokens);

  // ---------- sizing ----------
  function fit() {
    const r = well.getBoundingClientRect();
    const availW = Math.max(160, r.width - 4), availH = Math.max(240, r.height - 4);
    const scale = Math.min(availW / W, availH / H, 1.35);
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.floor(W * scale), cssH = Math.floor(H * scale);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    for (const c of [holdC, nextC]) {
      const cw = c.clientWidth || 88, ch = c.clientHeight || 64;
      c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr);
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    drawMinis();
  }
  window.addEventListener('resize', fit);

  // ---------- state ----------
  let S;
  const colX = c => c * CELL + CELL / 2;
  function freshClimber() {
    return { x: 16, y: BH, vx: 0, vy: 0, f: 1, state: 'intro', t: 0,
             tumble: false, rot: 0, spin: 0, fallFrom: BH, airT: 0, wantGrab: false, steer: 0,
             anchor: null, hangT: 0, pullT: 0, escape: false, climbCol: 0,
             crouchT: 0, crouchLen: 0.14, jumpV: 0, jumpVx: 0, landT: 0, stumbleT: 0, dazedT: 0, squashT: 0, winT: 0,
             wobble: 0, grit: 0, think: 0, intent: null, mood: 'idle', moodT: 3, wanderT: 0, wanderX: 16,
             stuckT: 0, lastX: 16, sayText: '', sayT: 0, chatT: 7, peak: 0 };
  }
  function newState() {
    return {
      board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
      cur: null, queue: [], bag: [], hold: null, canHold: true,
      score: 0, lines: 0, level: 1, mode: 'intro', time: 0,
      dropT: 0, lockT: 0, lockResets: 0, shake: 0, flash: 0,
      climber: freshClimber(), result: null,
      ids: Array.from({ length: ROWS }, () => Array(COLS).fill(0)), serial: 1, parts: [],
      crk: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
      // world extras: special block per cell, crumble timers, jelly wobble, smoke and dust, mode rules
      fx: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
      crm: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
      jelly: {}, smoke: [], puff: [], thump: 0, run: null, haz: null, wind: null, final: 0,
    };
  }
  let best = 0;
  try { best = +localStorage.getItem('stack-stumble-best') || 0; } catch (e) {}

  // ---------- world queries ----------
  // walls and floor are solid but he never climbs them; he climbs pieces only
  function pieceHas(r, c) {
    const p = S.cur;
    if (!p || S.mode === 'intro' || S.mode === 'over' && S.result === 'topout') return false;
    const pr = r - p.y, pc = c - p.x;
    return pr >= 0 && pc >= 0 && pr < p.m.length && pc < p.m.length && !!p.m[pr][pc];
  }
  function solidB(r, c) {
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r < 0) return false;
    return !!S.board[r][c];
  }
  const solid = (r, c) => solidB(r, c) || (r >= 0 && c >= 0 && c < COLS && pieceHas(r, c));
  function boxFree(x, y) {
    const c0 = Math.floor((x - HW) / CELL), c1 = Math.floor((x + HW - 0.001) / CELL);
    const r0 = Math.floor((y - BODYH) / CELL), r1 = Math.floor((y - 0.5) / CELL);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solid(r, c)) return false;
    return true;
  }
  // what is directly under his feet: 'board', 'piece' or null
  function supportUnder(x, y) {
    if (Math.abs(y - Math.round(y / CELL) * CELL) > 0.6) return null;
    const r = Math.round(y / CELL);
    const c0 = Math.floor((x - HW) / CELL), c1 = Math.floor((x + HW - 0.001) / CELL);
    let res = null;
    for (let c = c0; c <= c1; c++) { if (solidB(r, c)) return 'board'; if (r >= 0 && pieceHas(r, c)) res = 'piece'; }
    return res;
  }

  // ---------- pieces ----------
  const clone = m => m.map(r => r.slice());
  function rotateM(m, dir) {
    const n = m.length, out = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (dir > 0) out[x][n - 1 - y] = m[y][x]; else out[n - 1 - x][y] = m[y][x];
    }
    return out;
  }
  function refill() {
    while (S.queue.length < 5) {
      if (!S.bag.length) {
        S.bag = TYPES.split('');
        for (let i = S.bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [S.bag[i], S.bag[j]] = [S.bag[j], S.bag[i]]; }
      }
      S.queue.push(S.bag.pop());
    }
  }
  function makePiece(t) {
    const m = clone(SHAPES[t]);
    return { t, m, x: Math.floor((COLS - m.length) / 2), y: t === 'I' ? -1 : 0 };
  }
  function collide(m, px, py) {
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
      if (!m[y][x]) continue;
      const nx = px + x, ny = py + y;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && S.board[ny][nx]) return true;
    }
    return false;
  }

  // every change to the falling piece goes through here, so he can ride it, hang from it, or get hit by it
  function pieceAction(fn) {
    const C = S.climber;
    const riding = (C.state === 'ground' || C.state === 'dazed') && supportUnder(C.x, C.y) === 'piece';
    const hanging = (C.state === 'hang' || C.state === 'pull') && C.anchor && C.anchor.piece;
    const p = S.cur, px = p.x, py = p.y, pm = p.m;
    const res = fn();
    if (S.cur === p && (p.x !== px || p.y !== py || p.m !== pm)) afterPieceMove(p.x - px, p.y - py, p.m !== pm, riding, hanging);
    return res;
  }
  function spawn(t) {
    refill();
    S.cur = makePiece(t || S.queue.shift());
    S.cur.fx = specialFor();
    refill();
    S.dropT = 0; S.lockT = 0; S.lockResets = 0;
    if (collide(S.cur.m, S.cur.x, S.cur.y)) return gameOver('topout');
    resolveOverlap(0, 0);
    drawMinis();
  }
  const grounded = () => collide(S.cur.m, S.cur.x, S.cur.y + 1);
  function resetLock() { if (grounded() && S.lockResets < 15) { S.lockT = 0; S.lockResets++; } }
  function move(dx) {
    return pieceAction(() => {
      if (!collide(S.cur.m, S.cur.x + dx, S.cur.y)) { S.cur.x += dx; resetLock(); return true; }
      return false;
    });
  }
  function rotate(dir) {
    if (S.cur.t === 'O') return;
    rideRotDir = dir;
    pieceAction(() => {
      const m2 = rotateM(S.cur.m, dir);
      for (const [kx, ky] of [[0,0],[1,0],[-1,0],[0,-1],[2,0],[-2,0],[1,-1],[-1,-1]]) {
        if (!collide(m2, S.cur.x + kx, S.cur.y + ky)) {
          S.cur.m = m2; S.cur.x += kx; S.cur.y += ky; resetLock(); sfx('rot'); return;
        }
      }
    });
  }
  function fallStep() {
    return pieceAction(() => {
      if (!collide(S.cur.m, S.cur.x, S.cur.y + 1)) { S.cur.y++; return true; }
      return false;
    });
  }
  function softStep() { if (fallStep()) { S.score += 1; S.dropT = 0; } }
  // a hard drop slams the piece down fast but not instantly, so he gets a split second to see it coming
  function hardDrop() { S.slam = { d: 0, t: 0, y0: S.cur.y }; }
  function updateSlam(dt) {
    S.slam.t += dt;
    while (S.slam && S.slam.t >= SLAM) {
      S.slam.t -= SLAM;
      if (fallStep()) { S.slam.d++; S.score += 2; }
      else { const d = S.slam.d; S.slam = null; lock(true, d); }
    }
  }
  function holdPiece() {
    if (!S.canHold) return;
    const C = S.climber;
    const riding = (C.state === 'ground' || C.state === 'dazed') && supportUnder(C.x, C.y) === 'piece';
    if ((C.state === 'hang' || C.state === 'pull') && C.anchor && C.anchor.piece) rideHoldSwap('hang');
    const t = S.cur.t;
    if (S.hold) { const h = S.hold; S.hold = t; spawn(h); }
    else { S.hold = t; spawn(); }
    if (riding) rideHoldSwap('ride');
    S.canHold = false;
    drawMinis();
  }
  function lock(hard, dist) {
    const C = S.climber;
    const body = C.state === 'ground' || C.state === 'dazed';
    const riding = body && supportUnder(C.x, C.y) === 'piece';
    const { m, x, y, t } = S.cur;
    let over = false;
    const cells = [];
    S.serial++;
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m.length; c++) {
      if (!m[r][c]) continue;
      if (y + r < 0) { over = true; continue; }
      S.board[y + r][x + c] = t;
      S.ids[y + r][x + c] = S.serial;
      S.fx[y + r][x + c] = S.cur.fx || 0; S.crm[y + r][x + c] = 0;
      cells.push([y + r, x + c]);
    }
    // whatever he was holding on the piece is now part of the stack
    if (C.anchor && C.anchor.piece) { C.anchor = { piece: false, r: C.anchor.r + y, c: C.anchor.c + x, f: C.anchor.f }; }

    // clear lines; anything above a cleared row (him included) drops with it
    const cleared = [];
    for (let r = 0; r < ROWS; r++) if (S.board[r].every(v => v)) cleared.push(r);
    if (cleared.length) {
      for (const r of cleared) {
        S.board.splice(r, 1); S.board.unshift(Array(COLS).fill(0));
        S.ids.splice(r, 1); S.ids.unshift(Array(COLS).fill(0));
        S.fx.splice(r, 1); S.fx.unshift(Array(COLS).fill(0));
        S.crm.splice(r, 1); S.crm.unshift(Array(COLS).fill(0));
        S.crk.splice(r, 1); S.crk.unshift(Array(COLS).fill(0));
      }
      if (C.state !== 'win' && C.state !== 'intro') {
        const below = cleared.filter(r => r * CELL >= C.y - 0.5).length;
        if (C.state === 'hang' || C.state === 'pull' || C.state === 'climb') {
          const a = C.anchor;
          if (a && cleared.includes(a.r)) letGo('slip');
          else if (a) a.r += cleared.filter(r => r > a.r).length;
          if (C.state === 'climb') letGo('slip');
        } else {
          C.y = Math.min(BH, C.y + below * CELL);
        }
      }
      S.flash = 0.18;
      for (const r of cleared) for (let c = 0; c < COLS; c++) addParts(colX(c), r * CELL + CELL / 2, T.p[TYPES[(r + c) % 7]], 2, 120);
      if (C.state === 'ground' && !C.pp && !C.alert && Math.random() < 0.6) { startPP('pp_jumpScare'); grunt('yelp'); }
    }
    const n = cleared.length;
    S.score += LINE_SCORE[n] * S.level;
    S.lines += n;
    S.level = 1 + Math.floor(S.lines / 10);

    S.shake = Math.min(12, S.shake + 1.5 + (hard ? dist * 0.3 : 0) + n * 3);
    knock(cells, hard, dist, n, riding);
    lockDust(cells, hard);
    S.thump = Math.min(1.4, S.thump + (hard ? 0.7 + dist * 0.03 : 0.4));
    sfx(n ? 'clear' + n : (hard ? 'slam' : 'lock'));

    S.canHold = true;
    if (over) return gameOver('topout');
    resolveOverlap(0, 0);
    spawn();
  }

  // ---------- the climber: reactions ----------
  function say(text, dur = 1.9) {
    const C = S.climber;
    if (text === C.sayText && C.sayT > -1.5) return;   // same line again too soon
    C.sayText = text; C.sayT = dur;
  }
  function toAir() {
    const C = S.climber;
    C.alert = null; C.pp = null;
    if (C.state !== 'air') { C.fallFrom = C.y; C.airT = 0; }
    C.state = 'air'; C.anchor = null;
  }
  function letGo(why) {
    const C = S.climber;
    C.anchor = null; C.escape = false;
    toAir(); C.vy = Math.max(C.vy, 0); C.wantGrab = false;
    if (why === 'slip') { say(pick(SAY.slip), 1.3); }
  }
  function knockOff(dir, why) {
    const C = S.climber;
    toAir();
    C.vy = -220; C.vx = dir * 120; C.tumble = true; C.spin = dir * (8 + Math.random() * 4);
    C.wantGrab = false;
    say(pick(why === 'thrown' ? SAY.thrown : SAY.big), 1.5); sfx('fall');
  }
  function squash() {
    const C = S.climber;
    C.state = 'squash'; C.squashT = 0.7; C.anchor = null; C.vx = 0; C.vy = 0; C.topHit = null;
    say(pick(SAY.bonk), 1.6); sfx('bonk');
  }
  // pop him out to the nearest open spot after he was buried
  function expel() {
    const C = S.climber;
    for (let k = 1; k <= 8; k++) {
      for (const [dx, dy] of [[0, -k * 7], [-k * 7, 0], [k * 7, 0], [-k * 7, -k * 7], [k * 7, -k * 7]]) {
        const nx = Math.max(HW, Math.min(BW - HW, C.x + dx));
        if (boxFree(nx, C.y + dy)) {
          C.x = nx; C.y += dy; toAir();
          C.vy = -140; C.vx = (dx || (Math.random() < 0.5 ? -1 : 1)) > 0 ? 70 : -70;
          C.tumble = true; C.spin = Math.sign(C.vx) * 9;
          return;
        }
      }
    }
    let c = Math.max(0, Math.min(COLS - 1, Math.floor(C.x / CELL))), r = 0;
    while (r < ROWS && solid(r, c)) r++;
    while (r < ROWS && !solid(r, c)) r++;
    C.x = colX(c); C.y = r * CELL; toAir(); C.tumble = true;
  }
  function resolveOverlap(dx, dy) {
    const C = S.climber;
    if (!['ground', 'air', 'dazed', 'climb', 'button'].includes(C.state)) return;
    if (boxFree(C.x, C.y)) return;
    if (dy > 0) return topHit();
    // nudged sideways or by a rotation: try a small push before burying him
    for (const [ox, oy] of [[0, -6], [-8, 0], [8, 0], [0, -14], [-14, 0], [14, 0]]) {
      if (boxFree(C.x + ox, C.y + oy)) { C.x += ox; C.y += oy; if (C.state === 'climb') letGo(); if (oy) toAir(); return; }
    }
    squash();
  }
  function afterPieceMove(dx, dy, rot, riding, hanging) {
    const C = S.climber;
    // side hits; hanging from the piece itself is handled by the ride reactions
    if (!hanging && sideHit(dx, dy, rot, riding, hanging)) return;
    if (riding && (C.state === 'ground' || C.state === 'dazed')) rideCarry(dx, dy, rot);
    if (hanging && (C.state === 'hang' || C.state === 'pull')) rideHangMove(dx, dy, rot);
    if (dy > 0) topBrush();
    resolveOverlap(dx, dy);
  }
  function knock(cells, hard, dist, cleared, riding) {
    const C = S.climber;
    if (['win', 'intro', 'squash'].includes(C.state)) return;
    C.grit = 0;
    const near = cells.some(([r, c]) => Math.abs(colX(c) - C.x) <= 2 * CELL && Math.abs(r * CELL - C.y) <= 4 * CELL);
    const veryNear = cells.some(([r, c]) => Math.abs(colX(c) - C.x) <= 1.6 * CELL && Math.abs(r * CELL + CELL / 2 - (C.y - 20)) <= 2 * CELL);
    const away = Math.sign(C.x - cells.reduce((s, [, c]) => s + colX(c), 0) / cells.length) || 1;
    switch (C.state) {
      case 'ground':
        if (riding && rideLock(hard, dist, cleared)) break;
        if (nearKnock(cells, hard, dist, cleared, riding)) break;
        if (riding && hard) { knockOff(away, 'thrown'); C.vy = -320; }
        else if ((veryNear && hard) || (cleared >= 2 && Math.random() < 0.5)) knockOff(away);
        else if (near || cleared) { C.stumbleT = 0.5; C.crouchT = 0; if (C.sayT <= 0 && Math.random() < 0.4) say(pick(SAY.small), 1.1); }
        else if (Math.random() < 0.3) C.stumbleT = 0.25;
        break;
      case 'hang': case 'pull': {
        if (rideHangLock(hard, dist, cleared)) break;
        const p = (hard ? 0.45 : 0.12) + (near ? 0.3 : 0) + (cleared ? 0.5 : 0);
        if (Math.random() < p) letGo('slip');
        break;
      }
      case 'climb':
        if ((hard && near) || cleared) letGo('slip');
        else if (boxFree(C.x, C.y + 12)) C.y += 12;
        break;
      case 'dazed': C.dazedT = Math.min(2.5, C.dazedT + 0.2); break;
    }
  }

  // ---------- the climber: brain ----------
  // highest spot on the stack he can reach by walking, dropping, jumping up and climbing
  function planStack() {
    const C = S.climber;
    const sc = Math.max(0, Math.min(COLS - 1, Math.floor(C.x / CELL))), sr = Math.round(C.y / CELL);
    const key = (c, r) => c * 64 + r;
    const from = new Map([[key(sc, sr), null]]);
    const q = [[sc, sr, 0]];
    let best = [sc, sr, 0];
    while (q.length) {
      const [c, r, d] = q.shift();
      if (r < best[1]) best = [c, r, d];
      for (const dir of [-1, 1]) {
        const nc = c + dir;
        if (nc < 0 || nc >= COLS) continue;
        let move = null;
        if (!solidB(r - 1, nc)) {
          if (solidB(r - 2, nc)) continue;
          let k = r; while (!solidB(k, nc)) k++;
          move = { type: 'walk', nc, k, dir };
        } else {
          let k = r - 1;
          while (k > 0 && solidB(k - 1, nc)) k--;
          if (k <= 0 || solidB(k - 1, nc) || solidB(k - 2, nc)) continue;
          let ok = true;
          for (let y = k - 2; ok && y < r; y++) if (y >= 0 && solidB(y, c)) ok = false;
          if (!ok) continue;
          move = { type: r - k <= 3 ? 'jump' : 'climb', nc, k, dir, rise: r - k };
        }
        if (from.has(key(nc, move.k))) continue;
        from.set(key(nc, move.k), { c, r, move });
        q.push([nc, move.k, d + 1]);
      }
    }
    let node = key(best[0], best[1]), first = null;
    while (from.get(node)) { const p = from.get(node); first = p.move; node = key(p.c, p.r); }
    return { bestY: best[1] * CELL, move: first, col: sc };
  }
  // a grabbable top corner on the falling piece that would get him higher than the stack can
  function pieceOption(bestY) {
    const C = S.climber, p = S.cur;
    if (!p) return null;
    const sr = Math.round(C.y / CELL);
    let best = null;
    for (let pr = 0; pr < p.m.length; pr++) for (let pc = 0; pc < p.m.length; pc++) {
      if (!p.m[pr][pc]) continue;
      const r = p.y + pr, c = p.x + pc;
      if (r < 0 || solid(r - 1, c)) continue;
      for (const f of [1, -1]) {
        const sc = c - f;
        if (sc < 0 || sc >= COLS || solid(r, sc)) continue;
        let clear = true;
        for (let rr = r + 1; rr < sr; rr++) if (pieceHas(rr, sc) || solidB(rr, sc)) clear = false;
        if (!clear) continue;
        const gy = r * CELL, gx = f > 0 ? c * CELL : (c + 1) * CELL;
        if (gy >= C.y - BODYH || gy > bestY - CELL) continue;
        const sx = gx - f * (HW + 4);
        if (!walkable(C.x, sx, sr)) continue;
        if (!best || gy < best.gy || (gy === best.gy && Math.abs(sx - C.x) < Math.abs(best.sx - C.x))) best = { gy, sx, f };
      }
    }
    return best;
  }
  function walkable(x0, x1, r) {
    const c0 = Math.floor(Math.min(x0, x1) / CELL), c1 = Math.floor(Math.max(x0, x1) / CELL);
    for (let c = c0; c <= c1; c++) {
      if (c < 0 || c >= COLS || !solidB(r, c) || solid(r - 1, c) || solid(r - 2, c)) return false;
    }
    return true;
  }
  function intentFor(m, c) {
    if (m.type === 'walk') return { type: 'go', x: colX(m.nc) };
    const edge = m.dir > 0 ? (c + 1) * CELL - HW - 3 : c * CELL + HW + 3;
    if (m.type === 'jump') return { type: 'jump', x: edge, f: m.dir, v: Math.min(JV, Math.sqrt(2 * G * (m.rise * CELL + 22))), vx: m.dir * 40 };
    return { type: 'climb', x: m.dir > 0 ? (c + 1) * CELL - 7 : c * CELL + 7, f: m.dir, col: m.nc };
  }
  function brain() {
    const C = S.climber;
    if (C.noJumpUntil && C.t < C.noJumpUntil) { C.intent = { type: 'idle', x: C.x }; return; }
    const sr = Math.round(C.y / CELL);
    // close enough to the top to jump for it
    if (C.y <= JUMP_H + ARMS - 4) { C.intent = { type: 'escape', x: C.x }; return; }
    // riding the falling piece: hang on and enjoy the view
    if (supportUnder(C.x, C.y) === 'piece') { C.intent = rideIntent(); return; }
    const plan = planStack();
    const po = pieceOption(plan.bestY);
    const need = po ? C.y - ARMS - po.gy + 6 : 0;
    // only wait for the piece if it will be in reach soon; otherwise keep climbing
    const waitRows = Math.max(0, (need - JUMP_H) / CELL);
    const interval = dropInterval();
    if (po && (waitRows * interval < 2.5 || !plan.move)) {
      const reachNow = need <= JUMP_H;
      C.idleT = 0; C.trapT = 0; C.drilling = false; C.stuckClock = 0; C.boxedIn = false;
      C.intent = { type: reachNow ? 'jump' : 'wait', x: po.sx, f: po.f, v: Math.sqrt(2 * G * Math.max(20, need + 6)), vx: po.f * 20, piece: true };
      return;
    }
    const m = plan.move;
    if (m) {
      const c = plan.col;
      C.idleT = 0; C.trapT = 0; C.drilling = false; C.stuckClock = 0; C.boxedIn = false; C.digging = false;
      C.intent = intentFor(m, c);
      return;
    }
    // boxed in for too long (drilling included): out comes the teleport button
    C.boxedIn = roofed();
    if (C.boxedIn) {
      if (C.stuckClock >= TELEPORT_AFTER && teleportSpot()) {
        C.stuckClock = 0; C.state = 'button'; C.btnT = 0; C.intent = null; C.vx = 0; C.drilling = false;
        say(pick(SAY.button), 1.6);
        return;
      }
    } else C.stuckClock = 0;
    // boxed in by blocks: after a moment, get the drill out
    const tgt = drillTarget();
    if (tgt) {
      C.trapT = (C.trapT || 0) + 0.2;
      if (C.trapT > 1.6) {
        C.digging = true;
        // first get to where the digging starts
        if (tgt.move) { C.drilling = false; C.intent = intentFor(tgt.move, tgt.col); return; }
        if (!C.drilling) { C.drilling = true; C.drillT = 0; say(pick(SAY.drill), 1.6); }
        C.intent = { type: 'drill', x: tgt.x, tr: tgt.r, tc: tgt.c, side: tgt.side };
        return;
      }
    } else { C.trapT = 0; C.digging = false; }
    C.drilling = false;
    // boxed in with nothing to drill: he gets madder the longer it lasts
    if (C.boxedIn && Math.random() < 0.4 && tantrumStep(C)) { C.intent = { type: 'idle', x: C.x }; return; }
    // nowhere higher to go right now: pace, look around, hop in frustration
    C.idleT = (C.idleT || 0) + 0.2;
    if (C.idleT > 3 && Math.random() < 0.12) {
      C.idleT = 0;
      C.intent = { type: 'jump', x: C.x, f: C.f, v: Math.sqrt(2 * G * (14 + Math.random() * 16)), vx: 0 };
      if (C.sayT <= 0 && Math.random() < 0.5) say(pick(SAY.stuck), 1.4);
      return;
    }
    C.intent = { type: 'idle', x: C.wanderT > 0 ? C.wanderX : C.x };
    if (C.wanderT <= 0 && Math.random() < 0.15) {
      C.wanderT = 1.5 + Math.random() * 1.5;
      const span = [];
      for (let c = 0; c < COLS; c++) if (walkable(C.x, colX(c), sr)) span.push(colX(c));
      C.wanderX = span.length ? pick(span) : C.x;
    }
    if (C.sayT <= 0) { C.chatT -= 0.2; if (C.chatT <= 0) { C.chatT = 7 + Math.random() * 6; say(pick(S.cur ? SAY.wait : SAY.chat)); } }
  }

  // the block that has him boxed in: a ceiling just over his head, or a wall beside him
  // is there a block somewhere over his head (he is boxed in, not just waiting on top)?
  function roofed() {
    const C = S.climber;
    const r = Math.round(C.y / CELL), c = Math.max(0, Math.min(COLS - 1, Math.floor(C.x / CELL)));
    for (let k = r - 3; k >= 0; k--) if (solidB(k, c)) return true;
    return false;
  }
  // the highest block top in the board that he would fit on, if it is higher than where he is
  function teleportSpot() {
    const C = S.climber, now = Math.round(C.y / CELL);
    let best = null;
    for (let c = 0; c < COLS; c++) {
      let r = 0; while (r < ROWS && !solidB(r, c)) r++;
      if (r >= now || r < 1) continue;
      const x = colX(c), y = r * CELL;
      if (!boxFree(x, y)) continue;
      if (!best || r < best.r || (r === best.r && Math.abs(x - C.x) < Math.abs(best.x - C.x))) best = { r, x, y };
    }
    return best;
  }
  // cheapest way out: search his reachable spots where a move may need blocks drilled away,
  // counting each drilled block as a cost, and return the first step toward the cheapest higher spot
  const DIG_MAX = 6;
  function planDig() {
    const C = S.climber;
    const sc = Math.max(0, Math.min(COLS - 1, Math.floor(C.x / CELL))), sr = Math.round(C.y / CELL);
    const key = (c, r) => c * 64 + r;
    const dist = new Map([[key(sc, sr), 0]]), from = new Map();
    const open = [[0, sc, sr]];
    let best = null;
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [d, c, r] = open.shift();
      if (d > dist.get(key(c, r))) continue;
      if (r < sr && (!best || d < best.d || (d === best.d && r < best.r))) best = { d, c, r };
      for (const dir of [-1, 1]) {
        const nc = c + dir;
        if (nc < 0 || nc >= COLS) continue;
        const moves = [];
        // walk across (drilling out whatever is in the way at body height), then drop to the floor below
        {
          const cells = [r - 1, r - 2].filter(y => y >= 0 && solidB(y, nc)).map(y => [y, nc]);
          let k = r; while (!solidB(k, nc)) k++;
          moves.push({ type: 'walk', nc, k, dir, cells });
        }
        // climb a block face, drilling out anything in his own column on the way up (if within reach)
        if (solidB(r - 1, nc)) {
          let k = r - 1;
          while (k > 0 && solidB(k - 1, nc)) k--;
          if (k > 0) {
            const cells = [];
            for (let y = r - 3; y >= k - 2; y--) if (y >= 0 && solidB(y, c)) cells.push([y, c]);     // his own column, on the way up
            for (const y of [k - 1, k - 2]) if (y >= 0 && solidB(y, nc)) cells.push([y, nc]);       // room to stand on top
            moves.push({ type: r - k <= 3 ? 'jump' : 'climb', nc, k, dir, rise: r - k, cells });
          }
        }
        for (const m of moves) {
          const nd = d + m.cells.length;
          if (nd > DIG_MAX) continue;
          const kk = key(nc, m.k);
          if (dist.has(kk) && dist.get(kk) <= nd) continue;
          dist.set(kk, nd); from.set(kk, { c, r, m });
          open.push([nd, nc, m.k]);
        }
      }
    }
    if (!best || best.d === 0) return null;
    let node = key(best.c, best.r), first = null;
    while (from.get(node)) { const p = from.get(node); first = p.m; node = key(p.c, p.r); }
    return first ? { move: first, col: sc } : null;
  }
  // what to do next while dug in: either drill the next block on the cheapest way out, or move to where digging starts
  function drillTarget() {
    const C = S.climber;
    if (!C.digging && !roofed()) return null;   // open sky above: he is not blocked in, just waiting
    const plan = planDig();
    if (!plan) return null;
    const { move, col: c } = plan;
    const r = Math.round(C.y / CELL);
    // blocks he can reach standing here: beside him at body height, or overhead within the drill's reach
    const reach = move.cells.filter(([y, x]) => (x !== c && y >= r - 3) || (x === c && y >= r - 5));
    if (!reach.length) return { move, col: c };   // the rest get drilled while climbing or hanging
    // the block nearest his body first: beside him low before high, overhead low before high
    const [tr, tc] = reach.slice().sort((a, b) => b[0] - a[0])[0];
    const side = tc - c;
    return { r: tr, c: tc, side, x: side > 0 ? (c + 1) * CELL - HW - 3 : side < 0 ? c * CELL + HW + 3 : colX(c) };
  }
  function addParts(x, y, color, n, power) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = power * (0.4 + Math.random() * 0.8);
      S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.3, life: 0.5 + Math.random() * 0.5, s: 2 + Math.random() * 3, color });
    }
  }
  function breakBlock(r, c) {
    addParts(colX(c), r * CELL + CELL / 2, T.p[S.board[r][c]] || T.ink, 14, 160);
    S.board[r][c] = 0; S.ids[r][c] = 0; S.crk[r][c] = 0; S.fx[r][c] = 0; S.crm[r][c] = 0;
    S.climber.stuckClock = 0; STATS.broken++;
    S.shake = Math.min(12, S.shake + 4); sfx('crumble'); say(pick(SAY.smash), 1.5);
    // if another block still has him boxed in, he goes straight on to it
    const C = S.climber;
    C.intent = null; C.think = 0;
  }
  // one frame of drilling on the target block
  function drillTick(it, dt) {
    const C = S.climber;
    if (!S.board[it.tr] || !S.board[it.tr][it.tc]) { C.intent = null; C.think = 0; return; }
    if (it.side) C.f = it.side;
    drillCell(it, dt);
  }
  // drill while clinging to a face or hanging from a ledge
  function drillFrom(tr, tc, dt) {
    const C = S.climber, c = Math.floor(C.x / CELL);
    if (!C.drilling) { C.drilling = true; C.drillT = 0; say(pick(SAY.drill), 1.4); }
    C.drillAt = { tr, tc, side: tc === c ? 0 : tc - c };
    drillCell(C.drillAt, dt);
  }
  function drillCell(it, dt) {
    const C = S.climber;
    const before = C.drillT % 0.07;
    C.drillT += dt;
    if (C.drillT % 0.07 < before) {
      // the bit chatters against the block: chips, dust and a rattle
      const ix = it.side ? (it.side > 0 ? it.tc * CELL : (it.tc + 1) * CELL) : colX(it.tc);
      const iy = it.side ? it.tr * CELL + CELL / 2 : (it.tr + 1) * CELL;
      addParts(ix, iy, Math.random() < 0.3 ? T.muted : (T.p[S.board[it.tr][it.tc]] || T.ink), 1, 90);
      S.shake = Math.min(3, S.shake + 0.35);
      sfx('rattle');
    }
    S.crk[it.tr][it.tc] += dt;
    if (S.crk[it.tr][it.tc] >= BREAK_AT) breakBlock(it.tr, it.tc);
  }
  // the first block of the stack (not the falling piece) inside his body box at (x, y)
  function blockingCell(x, y) {
    const c0 = Math.floor((x - HW) / CELL), c1 = Math.floor((x + HW - 0.001) / CELL);
    const r0 = Math.floor((y - BODYH) / CELL), r1 = Math.floor((y - 0.5) / CELL);
    for (let r = r1; r >= r0; r--) for (let c = c0; c <= c1; c++) if (r >= 0 && c >= 0 && c < COLS && r < ROWS && S.board[r][c]) return [r, c];
    return null;
  }

  // ---------- the climber: seeing a piece coming ----------
  // is the falling piece going to land on him where he stands, and how soon?
  function threat() {
    const C = S.climber, p = S.cur;
    if (!p) return null;
    const c0 = Math.floor((C.x - HW) / CELL), c1 = Math.floor((C.x + HW - 0.001) / CELL);
    const head = Math.floor((C.y - BODYH) / CELL);
    let gy = p.y; while (!collide(p.m, p.x, gy + 1)) gy++;
    let rows = Infinity;
    for (let pr = 0; pr < p.m.length; pr++) for (let pc = 0; pc < p.m.length; pc++) {
      if (!p.m[pr][pc]) continue;
      const c = p.x + pc, r = p.y + pr;
      if (c < c0 || c > c1 || r >= head || r + (gy - p.y) < head) continue;
      rows = Math.min(rows, head - r);
    }
    if (rows === Infinity) return null;
    if (S.slam) return { rows, time: rows * SLAM - S.slam.t };
    if (held.soft) return { rows, time: rows * SOFT };
    return { rows, time: Math.max(0, rows * dropInterval() - S.dropT) };
  }
  // nearest spot along his footing that is out from under the piece
  function dodgePlan() {
    const C = S.climber, p = S.cur;
    const r = Math.round(C.y / CELL), c = Math.max(0, Math.min(COLS - 1, Math.floor(C.x / CELL)));
    const under = col => p.m.some((row, pr) => row.some((v, pc) => v && p.x + pc === col && p.y + pr < r));
    let bestX = null;
    for (const d of [-1, 1]) {
      for (let k = 0; k < COLS; k++) {
        const col = c + d * k;
        if (col < 0 || col >= COLS || solidB(r - 1, col) || solidB(r - 2, col)) break;
        if (!under(col)) {
          const x = d > 0 ? col * CELL + HW + 2 : (col + 1) * CELL - HW - 2;
          if (bestX === null || Math.abs(x - C.x) < Math.abs(bestX - C.x)) bestX = x;
          break;
        }
        if (!solidB(r, col)) break;   // stepping off a ledge here would still drop him under it
      }
    }
    return bestX;
  }

  // ---------- the climber: movement ----------
  function moveX(dx) {
    const C = S.climber;
    let nx = C.x + dx;
    if (boxFree(nx, C.y)) { C.x = nx; return false; }
    if (dx > 0) nx = Math.floor((nx + HW) / CELL) * CELL - HW - 0.01;
    else nx = (Math.floor((nx - HW) / CELL) + 1) * CELL + HW + 0.01;
    if (boxFree(nx, C.y) && Math.abs(nx - C.x) <= Math.abs(dx) + 0.02) C.x = nx;
    C.vx = 0;
    return true;
  }
  function moveY(dy) {
    const C = S.climber;
    let ny = C.y + dy;
    if (boxFree(C.x, ny)) { C.y = ny; return 0; }
    if (dy > 0) { ny = Math.floor(ny / CELL) * CELL; if (boxFree(C.x, ny) && ny >= C.y - 0.01) C.y = ny; C.vy = 0; return 1; }
    ny = (Math.floor((ny - BODYH) / CELL) + 1) * CELL + BODYH;
    if (boxFree(C.x, ny) && ny <= C.y + 0.01) C.y = ny;
    C.vy = 0;
    return -1;
  }
  function physics(dt) {
    const C = S.climber;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(C.vx), Math.abs(C.vy)) * dt / 5));
    let landed = false;
    for (let i = 0; i < n; i++) {
      moveX(C.vx * dt / n);
      if (moveY(C.vy * dt / n) === 1) { landed = true; break; }
    }
    return landed;
  }
  function startJump(i) {
    const C = S.climber;
    C.crouchT = C.crouchLen; C.f = i.f || C.f;
    C.jumpV = i.v || JV; C.jumpVx = i.vx || 0; C.steer = Math.sign(i.vx || 0);
  }
  function tryGrab() {
    const C = S.climber, f = C.f;
    const hy = C.y - ARMS;
    if (hy <= 2) {
      // his hands are over the top of the well
      C.anchor = { top: true, gx: C.x + f * (HW + 2), gy: 0, f };
      C.state = 'pull'; C.pullT = 0; C.escape = true; C.vx = C.vy = 0;
      say('Almost…!', 1); return true;
    }
    if (rideNoGrab()) return false;
    const r = Math.round(hy / CELL);
    if (Math.abs(r * CELL - hy) > 11) return false;
    const cf = Math.floor((C.x + f * (HW + 6)) / CELL);
    if (cf < 0 || cf >= COLS || !solid(r, cf) || solid(r - 1, cf)) return false;
    const gx = f > 0 ? cf * CELL : (cf + 1) * CELL, gy = r * CELL;
    if (Math.abs(C.x + f * HW - gx) > 10) return false;
    const hx = gx - f * (HW + 1);
    if (!boxFree(hx, gy + ARMS)) return false;
    const onPiece = !solidB(r, cf) && pieceHas(r, cf);
    if (rideGrabMiss(onPiece, gx, gy)) return false;
    rideCatch(onPiece);
    C.anchor = onPiece ? { piece: true, r: r - S.cur.y, c: cf - S.cur.x, f } : { piece: false, r, c: cf, f };
    C.state = 'hang'; C.hangT = 0; C.vx = C.vy = 0; C.tumble = false; C.rot = 0;
    C.x = hx; C.y = gy + ARMS;
    if (onPiece && Math.random() < 0.6) say(pick(SAY.grab), 1.2);
    return true;
  }
  function anchorAbs() {
    const a = S.climber.anchor;
    if (!a) return null;
    if (a.top) return { gx: a.gx, gy: 0, f: a.f, top: true };
    let r = a.r, c = a.c;
    if (a.piece) { if (!S.cur) return null; r += S.cur.y; c += S.cur.x; }
    return { r, c, f: a.f, gx: a.f > 0 ? c * CELL : (c + 1) * CELL, gy: r * CELL };
  }
  function land() {
    const C = S.climber;
    if (bounceOff()) return;
    const fall = C.y - C.fallFrom;
    // squishy landing, and an "oof" from a real drop
    animSquash(Math.min(0.38, 0.06 + Math.max(0, fall) / 260));
    if (fall > 2 * CELL && !C.tumble) grunt('oof');
    C.vy = 0; C.rot = 0; C.wantGrab = false; C.steer = 0;
    if (C.tumble || fall > 3.6 * CELL) {
      C.state = 'dazed'; C.dazedT = C.tumble ? 1.3 : 1.0; C.vx = 0;
      say(C.y >= BH - 1 ? pick(SAY.ground) : pick(SAY.small), 1.5); sfx('thud');
    } else {
      C.state = 'ground'; C.landT = fall > CELL ? 0.2 : 0.08; C.vx *= 0.3;
    }
    C.tumble = false; C.spin = 0;
    nearLanded();
  }

  function updateClimber(dt) {
    const C = S.climber;
    C.t += dt;
    rideTick(dt);
    C.sayT = Math.max(-10, C.sayT - dt);
    C.drillAt = null;
    sideTick(dt);
    if (C.boxedIn && ['ground', 'air', 'dazed'].includes(C.state)) C.stuckClock = (C.stuckClock || 0) + dt;
    // safety: if he ever ends up inside blocks (dragged by a piece, a line clear, a rotation), pop him out
    if (['ground', 'air', 'dazed', 'climb'].includes(C.state) && !boxFree(C.x, C.y)) { expel(); return; }
    // safety: airborne but not moving for a while means he is wedged; free him
    if (C.state === 'air' || ((C.state === 'ground' || C.state === 'dazed') && !supportUnder(C.x, C.y))) {
      if (Math.abs(C.y - (C.wedgeY ?? -1)) < 0.5 && Math.abs(C.x - (C.wedgeX ?? -1)) < 0.5) C.wedgeT = (C.wedgeT || 0) + dt;
      else C.wedgeT = 0;
      C.wedgeX = C.x; C.wedgeY = C.y;
      if (C.wedgeT > 0.4) { C.wedgeT = 0; C.y = Math.round(C.y / CELL) * CELL; if (!boxFree(C.x, C.y) || !supportUnder(C.x, C.y)) { C.x = Math.max(HW + 1, Math.min(BW - HW - 1, colX(Math.floor(C.x / CELL)))); expel(); } else land(); return; }
    } else C.wedgeT = 0;
    switch (C.state) {
      case 'ground': {
        if (C.arriveT > 0) C.arriveT = Math.max(0, C.arriveT - dt);
        if (!supportUnder(C.x, C.y)) { toAir(); C.wantGrab = Math.random() < 0.5; break; }
        if (C.pp && ppTick(dt)) break;
        if (C.topAnim && topGroundAnim(dt)) break;
        C.wobble = Math.max(0, C.wobble - dt * 0.7);
        if (C.shove && sideShoveTick(dt)) break;
        if (C.wanderT > 0) C.wanderT -= dt;
        if (nearGround(dt)) break;
        // a piece is coming down on him: notice it, then run for it (if there is time)
        const th = threat();
        if (th && th.time < 1.6 && !C.alert) {
          C.alert = { t: 0, react: 0.07 + Math.random() * 0.2 };
          C.crouchT = 0; C.stumbleT = 0;
          say(pick(SAY.dodge), 1.1);
        } else if (!th && C.alert) {
          if (C.alert.ran) nearSafe();
          C.alert = null; C.intent = null; C.think = 0.15;
        }
        if (C.alert && th) C.alert.left = th.time;
        if (C.alert) {
          C.alert.t += dt;
          if (C.alert.t < C.alert.react) { C.vx *= Math.pow(0.02, dt); moveX(C.vx * dt); break; }
          // re-plan every frame: the player may shift the piece while he runs
          const x = S.cur ? dodgePlan() : null;
          C.intent = x === null ? { type: 'brace', x: C.x } : { type: 'dodge', x };
          // pick the dodge style: jog, sprint, dive, sliding dive or a leap onto a low block
          if (nearDodge(th)) break;
        }
        if (C.crouchT > 0) {
          C.crouchT -= dt; C.vx *= 0.8;
          if (C.crouchT <= 0) { toAir(); C.vy = -C.jumpV; C.vx = C.jumpVx; C.wantGrab = true; sfx('jump'); animSquash(-0.3); if (Math.random() < 0.7) grunt('hup'); }
          break;
        }
        if (C.landT > 0) C.landT -= dt;
        if (C.rec && recoverTick(dt)) break;
        if (C.stumbleT > 0) {
          C.stumbleT -= dt; C.vx *= Math.pow(0.05, dt);
          physics(dt);
          if (!supportUnder(C.x, C.y)) toAir();
          break;
        }
        C.think -= dt;
        if (C.think <= 0 && !C.alert) { C.think = 0.2; brain(); }
        const it = C.intent || { type: 'idle', x: C.x };
        const gap = it.x - C.x;
        const speed = it.type === 'dodge' ? (it.spd || DODGE) : Math.abs(gap) > 50 ? RUN : WALK;
        const want = Math.abs(gap) < 1.5 ? 0 : Math.sign(gap) * Math.min(speed, Math.abs(gap) * 7);
        C.vx += (want - C.vx) * Math.min(1, dt * (it.type === 'dodge' ? 30 : 9) * iceGrip());
        if (Math.abs(C.vx) > 4) C.f = Math.sign(C.vx);
        const bumped = moveX(C.vx * dt);
        if (!supportUnder(C.x, C.y)) { toAir(); break; }
        // arrived: do the thing
        if (Math.abs(gap) < 2.5 && C.landT <= 0) {
          if (it.type === 'jump') {
            const spot = Math.round(C.x / 4) + ':' + Math.round(C.y / CELL);
            C.jumpTries = C.jumpSpot === spot ? (C.jumpTries || 0) + 1 : 1; C.jumpSpot = spot;
            if (C.jumpTries > 4 && it.v > 300) {
              // this jump keeps failing: stop trying it for a while
              C.jumpTries = 0; C.noJumpUntil = C.t + 4; C.intent = { type: 'idle', x: C.x };
              if (C.sayT <= 0) say(pick(SAY.stuck), 1.4);
            } else { C.f = it.f; startJump(it); }
          }
          else if (it.type === 'escape') startJump({ f: C.f, v: JV, vx: 0 });
          else if (it.type === 'climb') {
            const cf = it.col;
            if (solid(Math.floor((C.y - 1) / CELL), cf)) { C.f = it.f; C.climbCol = cf; C.state = 'climb'; C.vx = 0; }
          } else if (it.type === 'wait') C.f = it.f;
          else if (it.type === 'drill') drillTick(it, dt);
        }
        // watchdog: if he is trying to go somewhere and not getting there, wander for a bit
        if (Math.abs(want) > 1 && (bumped || Math.abs(C.x - C.lastX) < 0.05)) C.stuckT += dt; else C.stuckT = 0;
        C.lastX = C.x;
        if (C.stuckT > 1.2) { C.stuckT = 0; C.wanderT = 1.5; C.wanderX = colX(Math.floor(Math.random() * COLS)); C.intent = { type: 'idle', x: C.wanderX }; }
        break;
      }
      case 'air': {
        if (rideCartoon(dt)) break;
        C.airT += dt;
        C.vy = Math.min(C.vy + G * dt, 900);
        if (C.steer && !C.tumble) C.vx += (C.steer * 55 - C.vx) * Math.min(1, dt * 4);
        else C.vx *= Math.pow(0.6, dt);
        if (C.tumble) C.rot += C.spin * dt;
        if (Math.abs(C.vx) > 6 && !C.tumble) C.f = Math.sign(C.vx);
        if (physics(dt)) { land(); break; }
        if (!C.tumble && (C.wantGrab || C.vy > 120) && C.vy > -260) tryGrab();
        if (C.y > BH) { C.y = BH; land(); }
        break;
      }
      case 'hang': {
        const A = anchorAbs();
        if (!A || !solid(A.r, A.c) || solid(A.r - 1, A.c)) { if (!topFingers(A)) letGo('slip'); break; }
        C.x = A.gx - A.f * (HW + 1); C.y = A.gy + ARMS;
        if (!boxFree(C.x, C.y)) {
          if (topHangHit()) break;
          // his legs are being dragged into the blocks below: drop to the side and scramble out
          letGo('slip'); expel(); break;
        }
        C.hangT += dt;
        if (C.hangT > 0.32) {
          if (boxFree(A.gx + A.f * 8, A.gy)) { C.state = 'pull'; C.pullT = 0; }
          else {
            const bc = C.digging && !A.top && !(C.anchor && C.anchor.piece) && blockingCell(A.gx + A.f * 8, A.gy);
            if (bc) { C.hangT = 0.33; drillFrom(bc[0], bc[1], dt); }
            else if (C.hangT > 1.3) letGo();
          }
        }
        break;
      }
      case 'pull': {
        const A = anchorAbs();
        if (!A || (!A.top && (!solid(A.r, A.c) || solid(A.r - 1, A.c)))) { if (!topFingers(A)) letGo('slip'); break; }
        C.pullT += dt;
        if (C.pullT >= (M.duration('pullUp') || 0.55)) {
          C.anchor = null;
          C.x = A.gx + A.f * 8; C.y = A.gy;
          if (A.top) { C.state = 'win'; C.winT = 0; C.escape = false; say('I MADE IT!', 3); sfx('win'); break; }
          C.state = 'ground'; C.landT = 0.06; C.vx = 0; grunt('hup');
          if (!boxFree(C.x, C.y)) expel();
        }
        break;
      }
      case 'climb': {
        const f = C.f, cf = C.climbCol;
        const faceX = f > 0 ? cf * CELL : (cf + 1) * CELL;
        C.x = faceX - f * 7;
        C.grit = Math.min(10, C.grit + dt * 0.5);
        const ny = C.y - (26 + 3 * (S.level - 1) + C.grit) * climbGrip() * dt;
        if (!boxFree(C.x, ny)) {
          const bc = C.digging && blockingCell(C.x, ny);
          if (bc) { drillFrom(bc[0], bc[1], dt); break; }
          letGo(); break;
        }
        C.y = ny;
        const rh = Math.floor((C.y - ARMS) / CELL);
        if (!solid(rh, cf)) {
          const r = rh + 1;
          if (solid(r, cf) && r * CELL - (C.y - ARMS) < 14) {
            const onPiece = !solidB(r, cf) && pieceHas(r, cf);
            C.anchor = onPiece ? { piece: true, r: r - S.cur.y, c: cf - S.cur.x, f } : { piece: false, r, c: cf, f };
            C.state = 'hang'; C.hangT = 0.2;
          } else if (!solid(Math.floor((C.y - 4) / CELL), cf)) letGo();
        }
        break;
      }
      case 'dazed':
        C.dazedT -= dt;
        if (!supportUnder(C.x, C.y)) { toAir(); C.tumble = true; break; }
        if (C.dazedT <= 0) { C.state = 'ground'; C.landT = 0.15; if (C.y >= BH - 1 && Math.random() < 0.6) say(pick(SAY.up), 1.5); }
        break;
      case 'button': {
        // pull out the box, slap the button, beam out, beam in on top of the stack
        C.btnT += dt; C.vx = 0;
        if (!supportUnder(C.x, C.y)) { toAir(); break; }
        if (C.btnT >= 0.75 && !C.pressed) { C.pressed = true; sfx('beep'); }
        if (C.btnT >= 1.05 && !C.zapped) {
          C.zapped = true; sfx('zap');
          for (let i = 0; i < 3; i++) addParts(C.x, C.y - 10 - i * 14, i % 2 ? T.accent : T.p.I, 5, 60);
        }
        if (C.btnT >= 1.5) {
          const tp = teleportSpot();
          if (tp) { C.x = tp.x; C.y = tp.y; }
          C.state = 'ground'; C.arriveT = 0.7; C.pressed = C.zapped = false;
          C.intent = null; C.think = 0.4; C.trapT = 0; C.stuckClock = 0; C.boxedIn = false;
          for (let i = 0; i < 3; i++) addParts(C.x, C.y - 10 - i * 14, i % 2 ? T.accent : T.p.I, 6, 80);
          sfx('zap'); say(pick(SAY.arrive), 1.4);
        }
        break;
      }
      case 'squash':
        if (C.topHit) { topUpdate(dt); break; }
        C.squashT -= dt;
        if (C.squashT <= 0) expel();
        break;
      case 'win':
        C.winT += dt;
        if (C.winT > 2.6 && S.mode === 'play') gameOver('win');
        break;
    }
    recoverWatch(dt);
    C.peak = Math.max(C.peak, altitude());
  }
  // last resort: put him back on top of the stack in his column
  function rescueClimber() {
    const C = S.climber;
    const c = Math.max(0, Math.min(COLS - 1, Math.floor((C.x || 0) / CELL)));
    let r = 0; while (r < ROWS && !solidB(r, c)) r++;
    Object.assign(C, { x: colX(c), y: r * CELL, vx: 0, vy: 0, state: 'air', anchor: null, alert: null, intent: null, tumble: false, rot: 0 });
  }
  const altitude = () => Math.max(0, Math.min(100, Math.round((1 - S.climber.y / BH) * 100)));

  // ---------- reactions: ride ----------
  // Grabbing, hanging from and riding the falling piece. Per-climber state lives in C.rd:
  //   grip      0..1 grip strength: tires while hanging from a moving piece, recovers on his feet
  //   a, w      hang pendulum: body angle around the grip (rad, his local frame, + = swung out
  //             away from the block) and its speed; purely visual, his box stays under the grip
  //   jy, jv    vertical jolt of the hanging body (px, - = lifted, arms bent)
  //   lean, lv  riding lean (rad, world, + = toward +x) and its speed; too much and he loses it
  //   bob, bv   knee dip from the piece stepping down under him
  //   one       one-handed dangle { t, len }; catchT: second hand still reaching after a catch
  //   miss      fingers slipped off a corner { t, gx, gy, hand }; noGrabT blocks a re-grab
  //   absorbT   deep squat after a hard-drop slam; cartoon { t, len, kind } Hold took his piece
  //   teeter    -1/0/1 toes over a drop edge, teeterT how long; brace -1/0/1 hand on a step; narrow
  const RIDE_STAB = { I: 1.3, O: 1.15, T: 0.95, S: 0.8, Z: 0.8, J: 0.88, L: 0.88 };
  const RIDE_L = 34, RIDE_W2 = 40, RIDE_AMIN = -0.07;   // pendulum length, natural freq^2, wall stop
  const RIDE_SAY = {
    miss: ['My fingers!', 'Nnngh—', 'Slippery!'],
    regrab: ['Phew!', 'Got it… got it!', 'Not today!'],
    teeter: ['Whoa whoa whoa—', 'Easy… easy…', 'Don\'t look down.'],
    absorb: ['Hup!', 'Stuck the landing!', 'Knees!'],
    bounce: ['BOING—', 'WAAAH!', 'Too fast!'],
  };
  let rideRotDir = 1;                       // direction of the last rotation (set by rotate())
  const rclamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rd() {
    const C = S.climber;
    return C.rd || (C.rd = { grip: 1, a: 0, w: 0, jy: 0, jv: 0, lean: 0, lv: 0, bob: 0, bv: 0, one: null, catchT: 0, lead: 'r',
                             miss: null, noGrabT: 0, absorbT: 0, cartoon: null, onPiece: false, teeter: 0, teeterT: 0, brace: 0, narrow: false });
  }
  // the run of open-topped piece cells he stands on, and what lies past each end
  function rideSurface() {
    const C = S.climber, r = Math.round(C.y / CELL);
    const top = c => c >= 0 && c < COLS && pieceHas(r, c) && !solid(r - 1, c);
    let c = Math.floor(C.x / CELL);
    if (!top(c)) { const a = Math.floor((C.x - HW) / CELL), b = Math.floor((C.x + HW - 0.001) / CELL); c = top(a) ? a : top(b) ? b : -1; }
    if (c < 0) return null;
    let c0 = c, c1 = c;
    while (top(c0 - 1)) c0--;
    while (top(c1 + 1)) c1++;
    // 'wall' = a step of the piece (or the well side) to lean on, 'flat' = more floor, 'drop' = air
    const kind = k => k < 0 || k >= COLS || solid(r - 1, k) ? 'wall' : solid(r, k) ? 'flat' : 'drop';
    return { l: c0 * CELL, r: (c1 + 1) * CELL, w: c1 - c0 + 1, lk: kind(c0 - 1), rk: kind(c1 + 1) };
  }
  // how hard the piece is to stand on: I wide and steady, O heavy, T and the S/Z/J/L steps tippier
  function rideStab(sf) {
    const t = S.cur ? S.cur.t : 'O';
    let s = RIDE_STAB[t] || 1;
    if (sf && sf.w === 1) s *= t === 'T' ? 0.5 : 0.65;
    return s;
  }
  // brain hook while riding: hold still while teetering, then shuffle back in from a drop edge
  function rideIntent() {
    const C = S.climber, R = rd(), sf = rideSurface();
    if (!sf || (R.teeter && R.teeterT < 0.45)) return { type: 'idle', x: C.x };
    const lo = sf.l + (sf.lk === 'drop' ? HW + 3 : HW), hi = sf.r - (sf.rk === 'drop' ? HW + 3 : HW);
    return { type: 'idle', x: lo <= hi ? rclamp(C.x, lo, hi) : (sf.l + sf.r) / 2 };
  }

  // --- the catch ---
  function rideNoGrab() { const R = S.climber.rd; return !!(R && R.noGrabT > 0); }
  // fingers slip: more likely on a moving piece, falling fast, or with a tired grip
  function rideGrabMiss(onPiece, gx, gy) {
    const C = S.climber, R = rd();
    let p = onPiece ? 0.1 : 0.04;
    if (onPiece && (held.soft || S.slam)) p += 0.3;
    p += Math.max(0, C.vy - 260) / 1500 + (1 - R.grip) * 0.25;
    if (Math.random() >= p) return false;
    R.miss = { t: 0, gx, gy, hand: Math.random() < 0.5 ? 'l' : 'r' };
    R.noGrabT = 0.35;
    if (C.sayT <= 0 || Math.random() < 0.5) say(pick(RIDE_SAY.miss), 1);
    addParts(gx, gy, onPiece && S.cur ? T.p[S.cur.t] : T.wall, 2, 25);
    return true;
  }
  // one hand catches first, the other follows; his momentum swings the body on the arms
  function rideCatch(onPiece) {
    const C = S.climber, R = rd(), f = C.f;
    R.a = 0;
    R.w = rclamp(-C.vx * f * 0.016 + Math.max(0, C.vy) * 0.006 + (Math.random() - 0.5) * 0.6, -3.5, 3.5);
    R.jy = C.vy < 0 ? -6 : 1.2; R.jv = 0;
    R.catchT = 0.2; R.lead = Math.random() < 0.5 ? 'l' : 'r'; R.one = null; R.miss = null;
    // a hard catch on a piece in motion: only one hand makes it
    if (onPiece && C.vy > 380 && Math.random() < 0.35) { R.one = { t: 0, len: 0.55 + Math.random() * 0.3 }; R.catchT = 0; }
  }

  // --- hanging from the piece ---
  function rideLoseHand() {
    const C = S.climber, R = rd();
    if (R.one) return rideDrop();
    R.one = { t: 0, len: 0.45 + Math.random() * 0.4 }; R.catchT = 0;
    R.jv += 40;
    say(pick(SAY.slip), 1.2);
  }
  // let go mid-swing: he keeps the swing's speed
  function rideDrop() {
    const C = S.climber, R = rd(), f = C.anchor ? C.anchor.f : C.f;
    const vx = -RIDE_L * R.w * Math.cos(R.a) * f * 0.7;
    R.one = null;
    letGo('slip');
    C.vx = rclamp(vx, -160, 160); C.vy = Math.max(C.vy, 20);
    R.noGrabT = 0.25;
  }
  // a rotation tears the corner out of his hands and flings him along the turn
  function rideFling(gx, gy, dx, dy, fromHang) {
    const C = S.climber, p = S.cur, n = p.m.length, dir = rideRotDir;
    const cx = (p.x - dx + n / 2) * CELL, cy = (p.y - dy + n / 2) * CELL;
    const om = 7;                                              // a quarter turn snaps in a blink
    let vx = dir * -(gy - cy) * om, vy = dir * (gx - cx) * om;
    vy = Math.min(vy, 60) - (fromHang ? 60 : 150);              // the turning block pops him up
    vx = rclamp(vx, -260, 260); vy = rclamp(vy, -420, 80);
    const sp = Math.hypot(vx, vy);
    // the turn swept the block through where he stands: he is shoved out along the throw first
    if (!fromHang && !boxFree(C.x, C.y)) {
      const sx = Math.sign(vx) || dir;
      out: for (let k = 1; k <= 6; k++) for (const [ox, oy] of [[sx * k * 6, -k * 6], [0, -k * 7], [sx * k * 7, 0], [-sx * k * 6, -k * 6]]) {
        const nx = rclamp(C.x + ox, HW, BW - HW);
        if (boxFree(nx, C.y + oy)) { C.x = nx; C.y += oy; break out; }
      }
    }
    if (fromHang) { rd().one = null; letGo('slip'); } else knockOff(Math.sign(vx) || 1, 'thrown');
    C.vx = vx; C.vy = vy;
    C.tumble = sp > 230; C.spin = (Math.sign(vx) || dir) * (6 + sp / 50);
    C.wantGrab = !C.tumble; rd().noGrabT = 0.12;
  }
  function rideHangMove(dx, dy, rot) {
    const C = S.climber, R = rd(), a = C.anchor;
    if (!a) return;
    if (rot) return rideFling(C.x + a.f * (HW + 1), C.y - ARMS, dx, dy, true);
    if (C.state === 'pull') {
      // halfway over the edge: a jerk can still cost him the grip
      if (dx && Math.random() < 0.1 + (1 - R.grip) * 0.35) { rideDrop(); C.vx = -dx * 60; }
      return;
    }
    if (dx) {
      // the grip jerks sideways, his body lags behind: swing out (or bang into the block face)
      R.w += dx * a.f * 3.4;
      R.grip = Math.max(0, R.grip - 0.05 - 0.04 * Math.abs(R.a));
      const p = rclamp((Math.abs(R.w) - 2.5) * 0.12 + (0.6 - R.grip) * 0.5, 0, 0.6);
      if (Math.random() < (R.one ? p + 0.35 : p)) rideLoseHand();
    }
    if (dy) { R.jv -= 55 * dy; R.grip = Math.max(0, R.grip - 0.012); }
  }
  // the piece he hangs from locks: the stop jolts him, a slam can shake him off
  function rideHangLock(hard, dist, cleared) {
    const C = S.climber, R = rd();
    if (!R.onPiece || cleared) return false;
    R.jv += hard ? 50 + dist * 6 : 25;
    R.w += (Math.random() - 0.3) * (hard ? 2 : 0.6);
    const p = hard ? Math.min(0.85, 0.08 + dist * 0.045 + (1 - R.grip) * 0.4) : 0.03 + (1 - R.grip) * 0.15;
    if (Math.random() < p) { if (R.one || Math.random() < 0.5) rideDrop(); else rideLoseHand(); }
    return true;
  }

  // --- riding on top ---
  function rideCarry(dx, dy, rot) {
    const C = S.climber, R = rd();
    if (rot) return rideFling(C.x, C.y, dx, dy, false);
    C.x += dx * CELL; C.y += dy * CELL;
    if (dy && !dx) {
      R.bv += 26;                                              // the step down dips his knees
      if (C.sayT <= 0 && Math.random() < 0.02) say(pick(SAY.ride), 1.2);
      return;
    }
    if (!dx) return;
    const sf = rideSurface(), stab = rideStab(sf);
    const trail = !sf ? 'drop' : dx > 0 ? sf.lk : sf.rk;
    const tdist = !sf ? 0 : dx > 0 ? C.x - sf.l : sf.r - C.x;
    // braced against a step on the trailing side: it shoves him along instead of leaving him behind
    const braced = trail === 'wall' && tdist < HW + 6;
    const slip = braced ? 0 : (2 + 5 * (1 - Math.min(1, stab))) * (C.state === 'dazed' ? 1.6 : 1);
    if (slip && boxFree(C.x - dx * slip, C.y)) C.x -= dx * slip;
    if (C.state === 'dazed') { if (!supportUnder(C.x, C.y)) { toAir(); C.tumble = true; C.vx = -dx * 50; } return; }
    R.lv += -dx * (braced ? 0.9 : 2.4) / stab * (trail === 'drop' && tdist < 12 ? 1.6 : 1);
    C.wobble = Math.min(1, Math.abs(R.lean) * 1.5 + 0.2);
    if (!supportUnder(C.x, C.y)) return rideFallOff(-dx);
    if (C.sayT <= 0 && Math.random() < 0.3) say(pick(SAY.small), 1);
  }
  function rideFallOff(s) {
    const C = S.climber;
    toAir();
    C.vx = s * 75; C.vy = -90; C.tumble = false; C.wantGrab = true; C.f = -s;
    rd().teeter = 0;
    say(pick(SAY.big), 1.3); sfx('fall');
  }
  // the lean got away from him: wall to fall against, a drop to go over, or room to catch it
  function rideLoseBalance(sf) {
    const C = S.climber, R = rd(), s = Math.sign(R.lean);
    const kind = s > 0 ? sf.rk : sf.lk, dist = s > 0 ? sf.r - C.x : C.x - sf.l;
    if (kind === 'wall' && dist < HW + 8) { R.lean = s * 0.3; R.lv = -s * 1.5; R.brace = s; return; }
    if (kind === 'drop' && dist < 12) {
      if (Math.random() < 0.35 * rideStab(sf)) {
        R.lean = s * 0.4; R.lv = -s * 1.8; R.teeter = s; R.teeterT = 0; C.f = s;
        say(pick(RIDE_SAY.teeter), 1.2);
      } else rideFallOff(s);
      return;
    }
    if (sf.w >= 2 && Math.random() < 0.6) {
      // a catch step into the lean
      C.stumbleT = 0.3; C.f = s; if (boxFree(C.x + s * 4, C.y) && C.x + s * 4 > sf.l && C.x + s * 4 < sf.r) C.x += s * 4;
      R.lean *= 0.3; R.lv *= 0.2;
    } else {
      // hop back toward the middle of the piece
      const mid = (sf.l + sf.r) / 2;
      toAir(); C.vy = -240; C.vx = rclamp((mid - C.x) * 3, -70, 70); C.f = Math.sign(C.vx) || C.f; C.wantGrab = false;
      R.lean *= 0.4; sfx('jump');
    }
  }
  // the piece he rides locks: absorb or get bounced off a slam, settle after a gentle lock
  function rideLock(hard, dist, cleared) {
    const C = S.climber, R = rd();
    if (cleared >= 2 && Math.random() < 0.5) return false;
    if (hard) {
      const stab = rideStab(rideSurface());
      if (dist <= 3 || (dist <= 8 && Math.random() < 0.25 + 0.45 * stab)) {
        R.absorbT = 0.5; C.stumbleT = 0; C.landT = 0; C.crouchT = 0; R.bv += 30; R.lean *= 0.3;
        if (C.sayT <= 0 || Math.random() < 0.4) say(pick(RIDE_SAY.absorb), 1);
        return true;
      }
      const sf = rideSurface();
      const side = sf ? (C.x - sf.l < sf.r - C.x ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
      knockOff(side, 'thrown');
      C.vy = -Math.min(430, 170 + dist * 16); C.vx = side * (40 + Math.random() * 60); C.spin = side * (6 + dist * 0.4);
      say(pick(RIDE_SAY.bounce), 1.2);
      return true;
    }
    // a gentle lock: the ride stops, knees settle; a big lean turns it into a stumble
    R.bv += 20;
    if (Math.abs(R.lean) > 0.3) { C.stumbleT = 0.3; C.f = Math.sign(R.lean) || C.f; }
    else C.landT = Math.max(C.landT, 0.12);
    R.teeter = 0;
    return true;
  }

  // --- Hold swaps the piece out from under him: hangs in the air a beat, looks down, drops ---
  function rideHoldSwap(kind) {
    const C = S.climber, R = rd();
    if (kind === 'ride' && C.state !== 'ground' && C.state !== 'dazed') return;
    if (kind === 'hang') { C.escape = false; R.one = null; }
    toAir(); C.vx = 0; C.vy = 0; C.tumble = false; C.wantGrab = false;
    R.cartoon = { t: 0, len: 0.5 + Math.random() * 0.15, kind };
    R.noGrabT = 0.6; R.teeter = 0;
    say(kind === 'hang' ? '…huh?' : 'Where did it go?!', 1.4);
  }
  function rideCartoon(dt) {
    const C = S.climber, k = C.rd && C.rd.cartoon;
    if (!k) return false;
    k.t += dt; C.wedgeT = 0; C.vx = 0; C.vy = 0; C.fallFrom = C.y;
    if (k.t < k.len && boxFree(C.x, C.y)) return true;
    C.rd.cartoon = null; C.vy = 30; C.wantGrab = true; sfx('fall');
    return false;
  }

  // --- per-frame springs and decisions ---
  function rideTick(dt) {
    const C = S.climber, R = rd();
    R.noGrabT = Math.max(0, R.noGrabT - dt);
    R.absorbT = Math.max(0, R.absorbT - dt);
    if (R.miss) { R.miss.t += dt; if (R.miss.t > 0.45 || C.state !== 'air') R.miss = null; }
    if (R.cartoon && C.state !== 'air') R.cartoon = null;
    R.onPiece = !!(C.anchor && C.anchor.piece);
    const hanging = C.state === 'hang';
    if (hanging && R.onPiece) R.grip = Math.max(0, R.grip - dt * (R.one ? 0.12 : 0.03));
    else if (C.state === 'ground' || C.state === 'dazed') R.grip = Math.min(1, R.grip + dt * 0.35);
    // knee bob
    R.bv += (-120 * R.bob - 14 * R.bv) * dt; R.bob = rclamp(R.bob + R.bv * dt, -2, 5);
    if (hanging) {
      // pendulum, stopped by the block face on one side and by anything solid on the other
      const A = anchorAbs();
      R.w += (-RIDE_W2 * Math.sin(R.a) - 1.3 * R.w) * dt; R.a += R.w * dt;
      if (R.a < RIDE_AMIN) { R.a = RIDE_AMIN; if (R.w < 0) R.w = -R.w * 0.35; }
      if (A && R.a > 0.05) {
        const s = Math.sin(R.a), co = Math.cos(R.a);
        for (const [lx, ly] of [[-4, 50], [-6, 34]]) {
          const wx = A.gx + (lx * co - ly * s) * A.f, wy = A.gy + lx * s + ly * co;
          if (solid(Math.floor(wy / CELL), Math.floor(wx / CELL))) { R.a -= R.w * dt; if (R.w > 0) R.w = -R.w * 0.3; break; }
        }
      }
      R.a = rclamp(R.a, RIDE_AMIN, 0.9);
      R.jv += (-160 * R.jy - 10 * R.jv) * dt; R.jy = rclamp(R.jy + R.jv * dt, -9, 1.5);
      R.catchT = Math.max(0, R.catchT - dt);
      // wait for the swing to die down (and both hands on) before pulling up
      if (R.one || R.catchT > 0 || Math.abs(R.a) > 0.12 || Math.abs(R.w) > 1.2) C.hangT = Math.min(C.hangT, 0.3);
      if (R.one) {
        R.one.t += dt;
        if (R.one.t >= R.one.len) {
          if (Math.abs(R.a) < 0.4 && Math.random() < 0.3 + R.grip * 0.7) {
            R.one = null; R.catchT = 0.18; R.grip = Math.min(1, R.grip + 0.12); R.jv -= 30;
            say(pick(RIDE_SAY.regrab), 1.1);
          } else { rideDrop(); return; }
        }
      } else if (R.onPiece && R.grip <= 0.04) rideLoseHand();
    } else {
      const k = Math.exp(-12 * dt);
      R.a *= k; R.w *= k; R.jy *= k; R.jv = 0; R.one = null; R.catchT = 0;
    }
    const riding = C.state === 'ground' && S.cur && supportUnder(C.x, C.y) === 'piece';
    if (!riding) {
      R.lean *= Math.exp(-10 * dt); R.lv = 0; R.teeter = 0; R.teeterT = 0; R.brace = 0; R.narrow = false;
      return;
    }
    const sf = rideSurface();
    if (!sf) return;
    // lean spring, plus gravity tipping him over when his toes are past a drop
    R.teeter = sf.lk === 'drop' && C.x < sf.l + 1 ? -1 : sf.rk === 'drop' && C.x > sf.r - 1 ? 1 : 0;
    if (R.teeter) {
      if (!R.teeterT && C.sayT <= 0 && Math.random() < 0.5) say(pick(RIDE_SAY.teeter), 1.1);
      R.teeterT += dt; C.f = R.teeter; R.lv += R.teeter * 1.6 * dt;
      if (R.teeterT > 1.4) return rideFallOff(R.teeter);
    } else R.teeterT = 0;
    R.lv += (-55 * R.lean - 6 * R.lv) * dt; R.lean += R.lv * dt;
    R.brace = sf.lk === 'wall' && C.x - sf.l < HW + 7 && sf.l > 0 ? -1 : sf.rk === 'wall' && sf.r - C.x < HW + 7 && sf.r < BW ? 1 : 0;
    R.narrow = sf.w === 1;
    if (R.brace && Math.abs(C.vx) < 6 && !R.teeter) C.f = R.brace;
    if (Math.abs(R.lean) > 0.62 && C.stumbleT <= 0) rideLoseBalance(sf);
  }

  // --- which motion ---
  function rideMotion(mo) {
    const C = S.climber, R = C.rd;
    if (!R) return mo;
    if (C.state === 'air' && R.cartoon) return { ...mo, name: R.cartoon.kind === 'hang' ? 'ride_cartoonHang' : 'ride_cartoonStand', t: R.cartoon.t };
    if (C.state === 'air' && R.miss && !C.tumble) return { ...mo, name: 'ride_miss', t: R.miss.t };
    if (C.state === 'hang' && R.one) return { ...mo, name: 'ride_hangOne', t: C.t };
    if (C.state !== 'ground') return mo;
    if (R.absorbT > 0) return { ...mo, name: 'ride_absorb', t: 0.5 - R.absorbT };
    if (!['balance', 'idle', 'lookUp', 'wave'].includes(mo.name) || supportUnder(C.x, C.y) !== 'piece') return mo;
    let name = 'ride_surf';
    if (S.slam) name = 'ride_elevator';
    else if (held.soft) name = 'ride_crouch';
    else if (R.teeter) name = 'ride_teeter';
    else if (Math.abs(R.lean) > 0.2) name = 'ride_windmill';
    else if (R.brace) name = 'ride_brace';
    else if (R.narrow) name = 'ride_tiptoe';
    return { ...mo, name, t: C.t };
  }

  // --- pose layers on top of the motion (world coords, after mirroring) ---
  function rideElbow(P, sh, hand, ej) {
    // two-bone solve shoulder->hand (9+9); keep the elbow on the side it already bends to
    const dx = hand[0] - sh[0], dy = hand[1] - sh[1], d = Math.max(0.01, Math.hypot(dx, dy));
    const dc = Math.min(d, 17.99), along = dc / 2, h = Math.sqrt(Math.max(0, 81 - along * along));
    const ux = dx / d, uy = dy / d, mx = sh[0] + ux * along, my = sh[1] + uy * along;
    const e1 = [mx - uy * h, my + ux * h], e2 = [mx + uy * h, my - ux * h], o = P[ej];
    P[ej] = Math.hypot(e1[0] - o[0], e1[1] - o[1]) <= Math.hypot(e2[0] - o[0], e2[1] - o[1]) ? e1 : e2;
  }
  function rideDecorate(P) {
    const C = S.climber, R = C.rd;
    if (!R) return;
    const BODY = ['hip', 'neck', 'head', 'lElbow', 'rElbow', 'lKnee', 'lFoot', 'rKnee', 'rFoot'];
    if (C.state === 'hang') {
      const A = anchorAbs();
      if (!A) return;
      const g = [A.gx, A.gy], th = R.a * A.f, co = Math.cos(th), sn = Math.sin(th);
      const shake = R.grip < 0.35 && R.onPiece ? (Math.random() - 0.5) * (0.35 - R.grip) * 3 : 0;
      for (const j of BODY) {
        const x = P[j][0] - g[0], y = P[j][1] - g[1];
        P[j] = [g[0] + x * co - y * sn + shake, g[1] + x * sn + y * co + R.jy];
      }
      // arms can't stretch: if the jolt pulls the shoulders out of reach, the body stops short
      const d = Math.hypot(P.neck[0] - g[0], P.neck[1] - g[1]);
      if (d > 17.6) {
        const k = (d - 17.6) / d, ox = (g[0] - P.neck[0]) * k, oy = (g[1] - P.neck[1]) * k;
        for (const j of BODY) P[j] = [P[j][0] + ox, P[j][1] + oy];
      }
      if (R.one) { P.lHand = g; rideElbow(P, P.neck, g, 'lElbow'); return; }
      P.lHand = g; P.rHand = g;
      if (R.catchT > 0) {
        // the second hand is still on its way up to the edge
        const k = 1 - R.catchT / 0.2, e = k * k * (3 - 2 * k);
        const from = [P.neck[0] - A.f * 7, P.neck[1] + 9];
        const hj = R.lead === 'l' ? 'rHand' : 'lHand';
        P[hj] = [from[0] + (g[0] - from[0]) * e, from[1] + (g[1] - from[1]) * e];
      }
      rideElbow(P, P.neck, P.lHand, 'lElbow'); rideElbow(P, P.neck, P.rHand, 'rElbow');
      return;
    }
    if (C.state === 'air' && R.miss && R.miss.t < 0.3) {
      // fingertips scraping off the corner, then the hand comes away
      const m = R.miss, hj = m.hand === 'l' ? 'lHand' : 'rHand', ej = m.hand === 'l' ? 'lElbow' : 'rElbow';
      const k = 1 - m.t / 0.3;
      let tx = m.gx, ty = m.gy + 2;
      const d = Math.hypot(tx - P.neck[0], ty - P.neck[1]);
      if (d > 17.5) { tx = P.neck[0] + (tx - P.neck[0]) * 17.5 / d; ty = P.neck[1] + (ty - P.neck[1]) * 17.5 / d; }
      P[hj] = [P[hj][0] + (tx - P[hj][0]) * k, P[hj][1] + (ty - P[hj][1]) * k];
      rideElbow(P, P.neck, P[hj], ej);
      ctx.save(); ctx.strokeStyle = T.ink; ctx.lineWidth = 1; ctx.globalAlpha = k;
      ctx.beginPath();
      for (const o of [-3, 0, 3]) { ctx.moveTo(m.gx + o, m.gy + 1); ctx.lineTo(m.gx + o * 1.4, m.gy + 6 + Math.abs(o)); }
      ctx.stroke(); ctx.restore();
      return;
    }
    if (C.state === 'ground' && (Math.abs(R.lean) > 0.005 || Math.abs(R.bob) > 0.05)) {
      // lean from the hips (hips go the other way to keep over the feet), knees take the bob
      const hp = P.hip, th = R.lean, co = Math.cos(th), sn = Math.sin(th);
      const nh = [hp[0] - R.lean * 5, hp[1] + Math.max(0, R.bob)];
      for (const j of ['neck', 'head', 'lElbow', 'lHand', 'rElbow', 'rHand']) {
        const x = P[j][0] - hp[0], y = P[j][1] - hp[1];
        P[j] = [nh[0] + x * co - y * sn, nh[1] + x * sn + y * co];
      }
      P.hip = nh;
      rideElbow(P, P.hip, P.lFoot, 'lKnee'); rideElbow(P, P.hip, P.rFoot, 'rKnee');
    }
  }

  // ---------- reactions: recover ----------
  // Two jobs. (1) Recovery: what he does after a piece got him. Out of a tumble he rolls
  // and slides into a sit; after a squash he lies flat like a pancake; then he gets up
  // (peel up / groggy / quick, by how hard he was hit and by which piece) and maybe
  // shakes it off, dusts off, or shakes a fist at the piece. (2) The pose pipeline run
  // after worldPose's cross-fade: per-motion blend times and curves, follow-through
  // springs on head and hands, body jolts, squash & stretch, head look-at, breathing.
  //
  // API for other reactions (cheap, safe to call any time, all optional):
  //   noteHit(kind, sev, piece, x, y)  what just hit him: kind 'squash'|'knock'|'thrown'|'stumble'|'fall'|'nudge'
  //                                    (or your own), sev 0..1, piece 'I'..'L', x/y board px of the piece.
  //                                    Recovery flavour reads it. Omitted args are inferred (S.cur, S.slam).
  //                                    If nobody calls it, recoverWatch infers hits from state changes.
  //   animImpulse(dx, dy, strength)    jolt his upper body toward (dx, dy); head and hands trail and settle.
  //                                    strength ~0.5 nudge, 1 hit, 2 slam.
  //   animSquash(amount)               + squashes (0.1 light .. 0.35 heavy), - stretches; springs back with a wobble.
  //   animLookAt(x, y, dur, weight)    turn head and eyes to a board point for dur seconds (weight 0..1).
  //   animBlendIn(name, sec, curve)    blend time and curve INTO motion `name`; curves 'out' (snappy, impacts),
  //                                    'smooth' (ease in-out), 'in', 'linear'. Unlisted names fall back to
  //                                    0.04 s 'out' if the name looks like an impact (hit/slam/bonk/...), else 0.12 s.
  //   animBlendNext(sec, curve)        override the very next motion change only.
  //   startRecovery(name, opts)        play a ground motion now as a recovery ({tx, ty} faces and looks at a point);
  //                                    blocks the brain until it ends; a threat / stumble / jump cancels it.
  const PIECE_WEIGHT = { I: 0.95, O: 1, T: 0.7, S: 0.62, Z: 0.62, J: 0.75, L: 0.75 };
  const HIT_BASE = { squash: 0.85, knock: 0.72, thrown: 0.55, stumble: 0.3, fall: 0.5, nudge: 0.2 };
  const REC_SAY = {
    groggy: ['Ugh…', 'Who turned off the lights?', 'I felt that.', 'Five more minutes…', 'Ow. Ow.'],
    I: ['Who ordered the I-beam?', 'Long one. Ow.'], O: ['That one was HEAVY.', 'Square to the face.'],
    T: ['Pointy end. Ow.'], S: ['Sneaky S…'], Z: ['Zigzag. Ow.'], J: ['Hooked me…'], L: ['L is for… ow.'],
    fist: ['HEY!', 'Watch it!', 'I saw that!', 'Do you MIND?!', 'Rude!'],
    shake: ['Shake it off.', "I'm fine. Fine!", 'Pfft.'],
  };
  const EASE = {
    linear: k => k, out: k => 1 - (1 - k) * (1 - k) * (1 - k), in: k => k * k * k, smooth: k => k * k * (3 - 2 * k),
  };
  // how long (s) and with what curve to blend INTO each motion. Impacts snap, recoveries ease.
  const BLEND_IN = {
    squashed: [0.035, 'out'], tumble: [0.06, 'out'], brace: [0.06, 'out'], stumble: [0.05, 'out'], land: [0.04, 'out'],
    crouch: [0.06, 'out'], jumpUp: [0.05, 'out'], fallDown: [0.16, 'smooth'], ledgeReach: [0.08, 'out'],
    hang: [0.06, 'out'], hangShimmy: [0.2, 'smooth'], pullUp: [0.05, 'out'], climb: [0.1, 'smooth'],
    walk: [0.14, 'smooth'], run: [0.14, 'smooth'], idle: [0.26, 'smooth'], lookUp: [0.22, 'smooth'], wave: [0.26, 'smooth'],
    balance: [0.16, 'smooth'], push: [0.14, 'smooth'], dazed: [0.22, 'smooth'], celebrate: [0.12, 'out'],
    recover_roll: [0.05, 'out'], recover_flat: [0.07, 'out'], recover_peelUp: [0.18, 'smooth'],
    recover_groggyUp: [0.22, 'smooth'], recover_quickUp: [0.12, 'smooth'], recover_shakeOff: [0.1, 'smooth'],
    recover_fist: [0.14, 'smooth'], recover_dust: [0.14, 'smooth'],
  };
  function animBlendIn(name, sec, curve = 'smooth') { BLEND_IN[name] = [Math.max(0, sec), curve]; }
  function animBlendNext(sec, curve = 'smooth') { AN.next = [Math.max(0, sec), curve]; }
  function blendFor(from, to) {
    if (AN.next) { const b = AN.next; AN.next = null; return b; }
    if (!from) return [0, 'linear'];
    if (from === 'crouch' && to === 'jumpUp') return [0.05, 'out'];
    if (from === 'pullUp') return [0.1, 'smooth'];                      // ends in the standing pose already
    if ((from === 'walk' || from === 'run') && (to === 'walk' || to === 'run')) return [0.18, 'smooth'];
    return BLEND_IN[to] || (/(hit|impact|slam|squash|bonk|smack|knock|flinch|crush)/i.test(to) ? [0.04, 'out'] : [0.12, 'smooth']);
  }

  // animation state lives outside S: it is presentation only and resets with a new climber
  const AN = { C: null, clock: 0, sp: {}, jx: 0, jy: 0, jvx: 0, jvy: 0, sq: 0, sqv: 0, br: 0,
               lx: 0, ly: 0, lw: 0, look: null, roll: null, starA: 0, next: null, bx: 0, by: 0 };
  function animReset(C) {
    Object.assign(AN, { C, sp: {}, jx: 0, jy: 0, jvx: 0, jvy: 0, sq: 0, sqv: 0, br: 0, lw: 0, look: null, roll: null,
                        starA: 0, next: null, bx: C.x, by: C.y, lx: C.x, ly: C.y - 80 });
  }
  function animImpulse(dx, dy, strength = 1) {
    const L = Math.hypot(dx, dy) || 1;
    AN.jvx += dx / L * 55 * strength; AN.jvy += dy / L * 55 * strength;
  }
  function animSquash(amount) { AN.sqv += amount * 22; }
  function animLookAt(x, y, dur = 0.8, weight = 1) { AN.look = { x, y, until: AN.clock + dur, w: Math.max(0, Math.min(1, weight)) }; }

  // keep a cross-fade's source pose travelling with him, so a blend while running or riding
  // does not drag limbs behind in world space (big jumps - teleports, piece steps - blend in place)
  function carryFrom(from) {
    const C = S.climber;
    const dx = C.x - AN.bx, dy = C.y - AN.by;
    AN.bx = C.x; AN.by = C.y;
    if (!from || fadeT <= 0 || (!dx && !dy) || Math.abs(dx) > 14 || Math.abs(dy) > 14) return;
    for (const j of JOINTS) from[j] = [from[j][0] + dx, from[j][1] + dy];
  }

  // put the middle joint (elbow/knee) back so both bones are 9 px again, on the side it was;
  // near-straight crossings (facing flips) shrink the bend smoothly instead of popping
  function solveLimb(Q, root, mid, end) {
    const r = Q[root], e = Q[end], m = Q[mid];
    const dx = e[0] - r[0], dy = e[1] - r[1], d = Math.hypot(dx, dy);
    if (d < 0.5) return;
    const ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    const half = Math.min(d, 18) / 2, h = Math.sqrt(Math.max(0, 81 - half * half));
    const sd = (m[0] - r[0]) * nx + (m[1] - r[1]) * ny;
    const k = Math.min(1, Math.abs(sd) / (0.6 * h + 1e-6));
    const off = Math.sign(sd || 1) * h * k;
    Q[mid] = [r[0] + ux * d / 2 + nx * off, r[1] + uy * d / 2 + ny * off];
  }

  const LOOK_W = { ground: 0.85, dazed: 0.45, hang: 0.6, climb: 0.5, air: 0.4 };
  const UPPER = { hip: 0.6, neck: 1, head: 1, lElbow: 1, lHand: 1, rElbow: 1, rHand: 1, lKnee: 0.3, rKnee: 0.3, lFoot: 0, rFoot: 0 };
  const BREATH = { hip: 0.3, neck: 1, head: 1, lElbow: 0.9, lHand: 0.8, rElbow: 0.9, rHand: 0.8, lKnee: 0.15, rKnee: 0.15, lFoot: 0, rFoot: 0 };
  function animPost(P, mo, clock) {
    const C = S.climber;
    if (AN.C !== C) animReset(C);
    const dt = Math.max(0, Math.min(0.05, clock - AN.clock)); AN.clock = clock;
    const st = C.state;
    const Q = { face: P.face, f: P.f };
    for (const j of JOINTS) Q[j] = [P[j][0], P[j][1]];
    const feetFixed = st !== 'air' && st !== 'win';
    const handsFixed = st === 'hang' || st === 'pull' || st === 'climb' || mo.name === 'push';

    // inertia: a sudden stop or start on the ground throws the upper body forward / back
    if (st === 'ground' && dt > 0) { const dv = C.vx - (AN.pvx ?? C.vx); if (Math.abs(dv) < 400) AN.jvx -= dv * 0.25; }
    AN.pvx = C.vx;
    // jolt spring (slightly underdamped) and squash spring (bouncy)
    AN.jvx += (-160 * AN.jx - 12 * AN.jvx) * dt; AN.jvy += (-160 * AN.jy - 12 * AN.jvy) * dt;
    AN.jx = Math.max(-6, Math.min(6, AN.jx + AN.jvx * dt)); AN.jy = Math.max(-6, Math.min(6, AN.jy + AN.jvy * dt));
    AN.sqv += (-320 * AN.sq - 11 * AN.sqv) * dt;
    AN.sq = Math.max(-0.3, Math.min(0.4, AN.sq + AN.sqv * dt));
    // breathing so holds never look frozen
    const still = (st === 'ground' && Math.abs(C.vx) < 8) || st === 'dazed' || st === 'intro';
    AN.br += ((still ? 1 : 0) - AN.br) * Math.min(1, dt * 3);
    const breath = Math.sin(clock * 2.1) * 0.45 * AN.br;
    for (const j of JOINTS) {
      const w = feetFixed ? UPPER[j] : 1, wh = handsFixed && /Hand/.test(j) ? 0 : handsFixed && /Elbow/.test(j) ? 0.5 : 1;
      Q[j][0] += AN.jx * w * wh;
      Q[j][1] += AN.jy * w * wh + breath * BREATH[j] * wh;
    }

    // follow-through: head and hands are springs chasing their pose, so they overshoot and trail
    const hd0 = Math.hypot(P.head[0] - P.neck[0], P.head[1] - P.neck[1]) || 8;
    for (const j of ['head', 'lHand', 'rHand']) {
      const T = Q[j];
      let s = AN.sp[j];
      if (!s || dt === 0 || Math.abs(T[0] - s.tx) > 16 || Math.abs(T[1] - s.ty) > 16) {
        if (s && dt > 0) { s.x += T[0] - s.tx; s.y += T[1] - s.ty; s.tx = T[0]; s.ty = T[1]; }   // teleport: keep the offset
        else AN.sp[j] = { x: T[0], y: T[1], vx: 0, vy: 0, tx: T[0], ty: T[1] };
        continue;
      }
      const tvx = (T[0] - s.tx) / dt, tvy = (T[1] - s.ty) / dt;
      s.vx += (220 * (T[0] - s.x) + 18 * (tvx - s.vx)) * dt; s.vy += (220 * (T[1] - s.y) + 18 * (tvy - s.vy)) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.tx = T[0]; s.ty = T[1];
      const max = j === 'head' ? 2.5 : 4, w = j !== 'head' && handsFixed ? 0 : 1;
      let ox = s.x - T[0], oy = s.y - T[1];
      const L = Math.hypot(ox, oy);
      if (L > max) { ox *= max / L; oy *= max / L; s.x = T[0] + ox; s.y = T[1] + oy; }
      Q[j] = [T[0] + ox * w, T[1] + oy * w];
    }

    // look-at: the falling piece when it is above and close, or a point someone asked for
    let tx = null, ty = 0, want = 0;
    if (AN.look && AN.look.until > clock) { tx = AN.look.x; ty = AN.look.y; want = AN.look.w; }
    else if (S.cur && LOOK_W[st] && !C.tumble && S.mode === 'play') {
      const p = S.cur;
      let sx = 0, sy = 0, n = 0;
      for (let r = 0; r < p.m.length; r++) for (let c = 0; c < p.m.length; c++) if (p.m[r][c]) { sx += c; sy += r; n++; }
      const px = (p.x + sx / n + 0.5) * CELL, py = (p.y + sy / n + 0.5) * CELL;
      const dx = px - Q.neck[0], dy = py - Q.neck[1];
      if (dy < 10 && dy > -10 * CELL && Math.abs(dx) < 5 * CELL) {
        want = LOOK_W[st] * Math.min(1, (10 * CELL + dy) / (6 * CELL)) * Math.min(1, (5 * CELL - Math.abs(dx)) / (2.5 * CELL));
        tx = px; ty = py;
      }
    }
    if (tx !== null) {
      if (AN.lw < 0.02) { AN.lx = tx; AN.ly = ty; }
      AN.lx += (tx - AN.lx) * Math.min(1, dt * 7); AN.ly += (ty - AN.ly) * Math.min(1, dt * 7);
    }
    AN.lw += (want - AN.lw) * Math.min(1, dt * 4);
    // head keeps its length from the neck, then turns toward the look target
    {
      const hx = Q.head[0] - Q.neck[0], hy = Q.head[1] - Q.neck[1];
      let a = Math.atan2(hy, hx);
      if (AN.lw > 0.01) {
        const a1 = Math.atan2(AN.ly - Q.neck[1], AN.lx - Q.neck[0]);
        let d = a1 - a; d = Math.atan2(Math.sin(d), Math.cos(d));
        a += Math.max(-1, Math.min(1, d)) * AN.lw;
        Q.gaze = [Math.cos(a1) * 1.5 * AN.lw, Math.sin(a1) * 1.5 * AN.lw];
      }
      Q.head = [Q.neck[0] + Math.cos(a) * hd0, Q.neck[1] + Math.sin(a) * hd0];
    }

    // limbs back to exact length (blends and offsets shorten them)
    solveLimb(Q, 'neck', 'lElbow', 'lHand'); solveLimb(Q, 'neck', 'rElbow', 'rHand');
    solveLimb(Q, 'hip', 'lKnee', 'lFoot'); solveLimb(Q, 'hip', 'rKnee', 'rFoot');

    // squash & stretch about his base (feet on the ground, grip when hanging, centre in the air)
    if (Math.abs(AN.sq) > 0.003) {
      const bx = feetFixed ? mo.ox : C.x, by = feetFixed ? mo.oy : C.y - 20;
      const sy = 1 - AN.sq, sx = 1 + AN.sq * 0.6;
      for (const j of JOINTS) Q[j] = [bx + (Q[j][0] - bx) * sx, by + (Q[j][1] - by) * sy];
    }
    // roll-out after a tumble: the leftover spin unwinds around his middle
    if (AN.roll) {
      const R = AN.roll;
      R.t += dt;
      if (R.t >= R.dur || st !== 'dazed') AN.roll = null;
      else {
        const a = R.a0 * (1 - EASE.out(R.t / R.dur)), cs = Math.cos(a), sn = Math.sin(a), cx = C.x, cy = C.y - 9;
        for (const j of JOINTS) { const dx = Q[j][0] - cx, dy = Q[j][1] - cy; Q[j] = [cx + dx * cs - dy * sn, cy + dx * sn + dy * cs]; }
      }
    }
    // dizzy stars fade in and out instead of popping
    AN.starA = Math.max(0, Math.min(1, AN.starA + (Q.face === 'dizzy' ? dt * 5 : -dt * 1.6)));
    return Q;
  }
  function drawStars(hx, hy) {
    const a = AN.starA;
    if (a < 0.03) return;
    ctx.save();
    ctx.globalAlpha *= a; ctx.fillStyle = T.p.O;
    for (let i = 0; i < 3; i++) {
      const ang = S.climber.t * 4 + i * 2.1;
      star(hx + Math.cos(ang) * 11, hy - 9 - (1 - a) * 5 + Math.sin(ang) * 3, 3 * (0.5 + 0.5 * a));
    }
    ctx.restore();
  }

  // ---- what hit him
  function noteHit(kind, sev, piece, x, y) {
    const C = S.climber, p = S.cur;
    piece = piece || (p && p.t) || null;
    if (sev == null) sev = (HIT_BASE[kind] ?? 0.5) * (piece ? PIECE_WEIGHT[piece] : 0.8) + (S.slam ? 0.2 : 0);
    if (x == null && p) { x = (p.x + p.m.length / 2) * CELL; y = (p.y + p.m.length / 2) * CELL; }
    C.hit = { kind, sev: Math.max(0, Math.min(1, sev)), piece, x: x ?? C.x, y: y ?? C.y - 60, t: C.t };
  }
  const recentHit = age => { const C = S.climber; return C.hit && C.t - C.hit.t < age ? C.hit : null; };

  // ---- recovery on the ground: a motion that plays out, then hands back to the brain
  function startRecovery(name, o = {}) {
    const C = S.climber;
    if (C.state !== 'ground' || C.alert) return false;
    C.rec = { m: name, t: 0, dur: M.duration(name) || 0.6 };
    if (o.tx != null) { C.f = Math.sign(o.tx - C.x) || C.f; animLookAt(o.tx, o.ty ?? C.y - 120, C.rec.dur, 0.9); }
    C.vx *= 0.3;
    return true;
  }
  function recoverTick(dt) {
    const C = S.climber, r = C.rec;
    if (C.alert || C.crouchT > 0 || C.stumbleT > 0) { C.rec = null; return false; }
    r.t += dt;
    C.vx *= Math.pow(0.01, dt); moveX(C.vx * dt);
    if (!supportUnder(C.x, C.y)) { C.rec = null; toAir(); return true; }
    if (r.t >= r.dur) { C.rec = null; C.think = 0; return false; }
    return true;
  }
  // after getting up / after a hit stumble: shake it off, dust off, or shake a fist
  function followUp(h, big) {
    const C = S.climber, r = Math.random();
    const at = S.cur ? { tx: (S.cur.x + S.cur.m.length / 2) * CELL, ty: (S.cur.y + 1) * CELL } : { tx: h.x, ty: h.y };
    if (r < (big ? 0.35 : 0.22)) {
      if (startRecovery('recover_fist', at) && C.sayT <= 0) say(pick(REC_SAY.fist), 1.2);
    } else if (big && r < 0.7) startRecovery('recover_dust');
    else if (r < (big ? 1 : 0.6)) { if (startRecovery('recover_shakeOff') && C.sayT <= 0 && Math.random() < 0.3) say(pick(REC_SAY.shake), 1.1); }
  }

  // ---- dazed: roll in, sit (or lie flat after a squash), then a get-up that fits the hit
  function recoverDazedStart(wasTumble, vx) {
    const C = S.climber;
    const h = recentHit(4) || { kind: 'fall', sev: 0.5, piece: null, x: C.x, y: C.y - 60 };
    const flat = h.kind === 'squash', roll = !flat && wasTumble;
    const up = flat ? 'recover_peelUp' : h.sev >= 0.62 ? 'recover_groggyUp' : 'recover_quickUp';
    const d = { el: 0, intro: roll ? M.duration('recover_roll') : 0, roll, flat, up, upDur: M.duration(up),
                sev: h.sev, hit: h, slide: vx * (roll ? 0.7 : 0.25), sprung: false, said: false, hurry: false };
    C.daze = d;
    // lying flat he is ~45 px long: lie the other way round if his legs would go into a wall
    if (flat) { const bx = C.x - C.f * 26; if (bx < 2 || bx > BW - 2 || solidB(Math.floor((C.y - 4) / CELL), Math.floor(bx / CELL))) C.f = -C.f; }
    C.dazedT = d.intro + (flat ? 0.5 + 0.9 * h.sev : 0.35 + 1.1 * h.sev) + d.upDur;
    if (roll) AN.roll = { t: 0, dur: 0.34, a0: -(Math.sign(vx) || C.f) * Math.PI * 0.8 };
  }
  function recoverDazedTick(dt) {
    const C = S.climber, d = C.daze;
    if (!d) return;
    d.el += dt;
    if (d.slide) {
      // slide out the landing; stops at walls and blocks
      if (moveX(d.slide * dt)) d.slide = 0;
      d.slide *= Math.pow(0.03, dt);
      if (Math.abs(d.slide) < 4) d.slide = 0;
    }
    // a piece is about to land on him: scramble up now instead of sitting there
    if (!d.hurry && C.dazedT > d.upDur && d.el > d.intro && S.cur) {
      const th = threat();
      if (th && th.time < 1.1) {
        d.hurry = true;
        if (!d.flat) { d.up = 'recover_quickUp'; d.upDur = M.duration(d.up); }
        C.dazedT = d.upDur;
      }
    }
    const ut = d.upDur - C.dazedT;   // time into the get-up
    if (ut >= 0 && !d.said) {
      d.said = true;
      if (C.sayT <= 0 && d.sev >= 0.62 && Math.random() < 0.55) {
        const lines = d.hit.piece && REC_SAY[d.hit.piece] && Math.random() < 0.5 ? REC_SAY[d.hit.piece] : REC_SAY.groggy;
        say(pick(lines), 1.4);
      }
    }
    // springing back into shape at the top of the get-up
    const springAt = d.up === 'recover_peelUp' ? 0.78 : d.up === 'recover_groggyUp' ? 1.02 : 0.3;
    if (!d.sprung && ut >= springAt) { d.sprung = true; animSquash(d.up === 'recover_peelUp' ? -0.3 : -0.14); }
  }

  // watches the climber once per update and turns state changes into animation events,
  // so the reaction code elsewhere does not need to know about any of this
  const RW = { C: null };
  function recoverWatch(dt) {
    const C = S.climber;
    if (RW.C !== C) Object.assign(RW, { C, st: C.state, vx: 0, vy: 0, x: C.x, y: C.y, tumble: false, stumble: 0, stumbleHit: null });
    const st = C.state, prev = RW.st;
    if (C.alert && C.rec) C.rec = null;
    if (st !== prev) {
      if (st === 'squash') {
        if (!recentHit(0.1)) noteHit('squash');
        animSquash(0.18); animImpulse(0, 1, 1.2);
      } else if (st === 'air' && C.tumble && prev !== 'air') {
        if (!recentHit(1.2)) noteHit(Math.abs(C.vy) > 260 ? 'thrown' : 'knock');
        animImpulse(Math.sign(C.vx) || 1, -0.6, 1);
      }
      if (prev === 'air' && (st === 'ground' || st === 'dazed')) {
        const v = RW.vy;
        animSquash(Math.min(0.32, Math.max(0, (v - 220) / 650) * 0.32) + (st === 'dazed' ? 0.06 : 0));
        if (st === 'dazed') recoverDazedStart(RW.tumble, RW.vx);
      }
      if (prev === 'dazed') {
        const d = C.daze; C.daze = null;
        if (st === 'ground' && d) {
          C.landT = 0;                 // the get-up already ends standing
          if (!d.hurry) followUp(d.hit, d.sev >= 0.62 || d.flat);
        }
      }
      if (st !== 'ground') C.rec = null;
    }
    if (st === 'dazed') recoverDazedTick(dt);
    if (st === 'ground') {
      // a stumble that came from a hit (not from his own wobbling)
      if (C.stumbleT > RW.stumble + 0.1) {
        if (C.stumbleT >= 0.4 && !recentHit(0.1)) noteHit('stumble');
        const h = recentHit(0.2);
        RW.stumbleHit = h;
        animImpulse(h ? Math.sign(C.x - h.x) || C.f : C.f, -0.2, h ? 0.9 : 0.5);
      } else if (RW.stumble > 0 && C.stumbleT <= 0 && RW.stumbleHit) {
        const h = RW.stumbleHit; RW.stumbleHit = null;
        if (!C.alert && C.crouchT <= 0) followUp(h, false);
      }
      // carried by the piece he rides: sideways steps jolt him, drops lift him onto his toes
      const dx = C.x - RW.x, dy = C.y - RW.y;
      if (Math.abs(dx) > 20 && Math.abs(dx) < 40 && Math.abs(dy) < 1) animImpulse(-Math.sign(dx), 0, 0.8);
      else if (dy > 20 && dy < 40 && Math.abs(dx) < 1) animSquash(-0.05);
    }
    RW.st = st; RW.vx = C.vx; RW.vy = C.vy; RW.x = C.x; RW.y = C.y; RW.tumble = C.tumble; RW.stumble = C.stumbleT;
  }

  // which motion recovery wants on screen (called at the end of currentMotion)
  function recoverMotion(mo) {
    const C = S.climber;
    if (C.state === 'ground' && C.rec && !C.alert) return { ...mo, name: C.rec.m, t: C.rec.t, speed: 1 };
    if (C.state === 'dazed' && C.daze) {
      const d = C.daze;
      if (C.dazedT <= d.upDur) return { ...mo, name: d.up, t: d.upDur - C.dazedT };
      if (d.el < d.intro) return { ...mo, name: 'recover_roll', t: d.el };
      if (d.flat) return { ...mo, name: 'recover_flat' };
    }
    return mo;
  }

  // ---------- reactions: top ----------
  // A piece coming DOWN onto him. Instead of a generic flatten-then-teleport he flinches, takes the hit
  // in a way that depends on the piece and where it lands on him, gets pressed into whatever room is
  // left under it, then squeezes out sideways along the gap toward open space and recovers.
  // While it plays: C.state === 'squash' and C.topHit = { kind, phase, t, age, mt, dir, hard, sid, sy, ... }.
  //   kind  : 'clip' (a corner caught him: shoved aside), 'bonk' (a point on his head), 'crumple' (O),
  //           'pancake' (flat I, or any slam), 'press' (slow flat side: he holds it up)
  //   phase : 'shove' -> done | 'impact' -> 'hold' (room left: pushes up, then duck-walks out)
  //           -> 'flat' (no room: pancaked, then wriggles out) -> recover (stand up / pop out)
  const TOP_NOM = { top_holdUp: 35, top_duckWalk: 35, top_bonk: 37, top_kneel: 34, brace: 33 };   // head-centre height of each pose
  const TOP_SAY = {
    press: ['Hnnng!', 'Heavy!', 'Too… heavy…', 'Little help?!'],
    flat: ['Mmmph!', 'Splat.', 'Ffflat…', 'mmf mmf!'],
    crumple: ['My knees!', 'Oof— heavy!', 'Why the big one?!'],
    pop: ['Boing!', 'Pfff—', 'Ta-da…?', 'Fwoop!'],
    phew: ['Phew!', 'Made it.', 'Excuse me…', 'Out!'],
    brush: ['Whoa—my hand!', 'Watch it!', 'Close!', 'Hey!'],
    fingers: ['MY FINGERS!', 'Ow ow ow!', 'Yowch!'],
  };
  // the falling piece's cells inside his body box: [row, col, pieceRow, pieceCol]
  function topOverlap(x, y) {
    const p = S.cur, out = [];
    if (!p) return out;
    for (let pr = 0; pr < p.m.length; pr++) for (let pc = 0; pc < p.m.length; pc++) {
      if (!p.m[pr][pc]) continue;
      const r = p.y + pr, c = p.x + pc;
      if (c * CELL < x + HW && (c + 1) * CELL > x - HW && r * CELL < y && (r + 1) * CELL > y - BODYH) out.push([r, c, pr, pc]);
    }
    return out;
  }
  // free height above his feet (0 = something is lying right on him)
  function topRoom(x, y) {
    const c0 = Math.floor((x - HW) / CELL), c1 = Math.floor((x + HW - 0.001) / CELL), rf = Math.floor((y - 0.5) / CELL);
    for (let r = rf; r >= rf - 2; r--) for (let c = c0; c <= c1; c++) if (solid(r, c)) return Math.max(0, y - (r + 1) * CELL);
    return 99;
  }
  // can he squeeze along here? Under the piece that pinned him (or a later one) yes, through the old stack no
  function topPassable(x, y, h) {
    const c0 = Math.floor((x - HW) / CELL), c1 = Math.floor((x + HW - 0.001) / CELL), rf = Math.floor((y - 0.5) / CELL);
    let support = false;
    for (let c = c0; c <= c1; c++) {
      if (c < 0 || c >= COLS) return false;
      if (solid(rf, c) && !(pieceHas(rf, c) || (rf >= 0 && S.board[rf][c] && S.ids[rf][c] >= h.sid))) return false;
      if (solid(rf + 1, c)) support = true;
    }
    return support;
  }
  // nearest spot along the gap where he can stand up again; prefers h.dir (the open side / where he was running)
  function topExit(h) {
    const C = S.climber;
    let best = null;
    for (const d of [-1, 1]) {
      for (let k = 2; k <= 4 * CELL; k += 2) {
        const x = C.x + d * k;
        if (x < HW || x > BW - HW || !topPassable(x, C.y, h)) break;
        if (boxFree(x, C.y)) {
          const cost = k - (d === h.dir ? 20 : 0);
          if (!best || cost < best.cost) best = { x, d, cost };
          break;
        }
      }
    }
    return best;
  }
  function topStart(o) {
    const C = S.climber;
    C.state = 'squash'; C.squashT = 0.7; C.anchor = null; C.vx = 0; C.vy = 0;
    C.alert = null; C.intent = null; C.topAnim = null; C.tumble = false; C.rot = 0; C.spin = 0; C.pressed = C.zapped = false;
    C.topHit = Object.assign({ t: 0, age: 0, mt: 0, sy: 1, room: 46, crawl: false, noExit: 0, sid: S.serial + 1,
                            dir: 0, hard: false, impact: 0, holdT: 0.4, flatHold: 0.4 }, o);
    return C.topHit;
  }
  // entry point: the falling piece just moved down into his body
  function topHit() {
    const C = S.climber, p = S.cur;
    let cells = topOverlap(C.x, C.y);
    if (!p || !cells.length) return squash();
    const hard = !!S.slam;
    // in the air, on a wall: swatted down (or, with no room below, pinned to the floor)
    if (C.state === 'air' || C.state === 'climb') {
      const ctr = cells.reduce((s, [, c]) => s + colX(c), 0) / cells.length;
      const push = C.state === 'climb' ? -C.f : -(Math.sign(ctr - C.x) || C.f);
      if (topSwat(push)) return;
      const ny = Math.ceil(C.y / CELL - 0.02) * CELL;
      if (ny - C.y > BODYH || !supportUnder(C.x, ny)) return squash();
      C.y = ny;
      cells = topOverlap(C.x, C.y);
      if (!cells.length) { C.state = 'ground'; C.landT = 0.2; return; }
    }
    const aware = !!C.alert;
    const run = C.state === 'ground' && C.alert && C.alert.ran && Math.abs(C.vx) > 40 ? Math.sign(C.vx) : 0;
    const left = Math.min(...cells.map(([, c]) => c * CELL)), right = Math.max(...cells.map(([, c]) => (c + 1) * CELL));
    const cover = (Math.min(C.x + HW, right) - Math.max(C.x - HW, left)) / (2 * HW);
    const side = Math.sign((left + right) / 2 - C.x);
    // the lowest cell touching him: is it a lone point (T stem, end of an upright piece)?
    const low = cells.reduce((a, b) => (b[0] > a[0] ? b : a));
    const point = p.m[low[2]].filter(Boolean).length === 1;
    // only a corner or edge caught his head/shoulder: shoved toward the open side
    if (cover < 0.75 && side) {
      const d = -side, x1 = d < 0 ? left - HW - 0.5 : right + HW + 0.5;
      if (Math.abs(x1 - C.x) <= 2 * HW && x1 >= HW && x1 <= BW - HW && boxFree(x1, C.y)) {
        topStart({ kind: 'clip', phase: 'shove', dir: d, x0: C.x, x1, dur: hard ? 0.13 : 0.22, hard, run: run === d,
                   dizzy: p.t === 'T' || point || hard });
        C.f = d;
        addParts(C.x - d * 4, C.y - BODYH + 4, T.p[p.t], 3, 50);
        sfx('bonk'); say(pick(hard ? SAY.bonk : SAY.small), 1.1);
        return;
      }
    }
    let kind;
    if (p.t === 'O') kind = 'crumple';
    else if (point && (p.t === 'T' || !hard)) kind = 'bonk';
    else if (hard || (p.t === 'I' && !point)) kind = 'pancake';
    else kind = 'press';
    const h = topStart({ kind, phase: 'impact', hard, dir: run || 0, aware,
                         impact: { bonk: hard ? 0.28 : 0.45, crumple: hard ? 0.16 : 0.26, press: 0.14, pancake: 0 }[kind],
                         holdT: aware ? 0.45 : 0.3, flatHold: hard ? 0.5 : 0.35 });
    if (kind === 'bonk') {
      addParts(C.x, C.y - BODYH, T.p.O, 5, 80); sfx('bonk'); say(pick(SAY.bonk), 1.4);
    } else if (kind === 'crumple') { sfx('thud'); say(pick(TOP_SAY.crumple), 1.4); }
    else if (kind === 'press') { sfx('thud'); say(pick(TOP_SAY.press), 1.4); }
    else { topFlat(); }
    h.sy = 1;
  }
  function topFlat() {
    const C = S.climber, h = C.topHit;
    h.phase = 'flat'; h.t = 0; h.crawl = false; h.sy = 1;
    const ex = topExit(h);
    if (ex) { C.f = ex.d; if (!h.dir) h.dir = ex.d; }
    addParts(C.x, C.y - 2, T.muted, 6, 70);
    S.shake = Math.min(12, S.shake + (h.hard ? 3 : 1.5));
    sfx('bonk'); say(pick(TOP_SAY.flat), 1.4);
  }
  function topUpdate(dt) {
    const C = S.climber, h = C.topHit;
    h.t += dt; h.age += dt; C.vx = 0; C.vy = 0;
    if (h.phase === 'shove') {
      const k = Math.min(1, h.t / h.dur);
      C.x = h.x0 + (h.x1 - h.x0) * (1 - (1 - k) * (1 - k));
      if (k >= 1) topShoveDone();
      return;
    }
    const room = h.room = topRoom(C.x, C.y);
    // whole body fits again: he crawled out, or the piece moved off him
    if (boxFree(C.x, C.y) && !(h.phase === 'impact' && h.t < h.impact)) return topRecover();
    if (room <= 6 && h.phase !== 'flat' && !(h.phase === 'impact' && h.kind === 'crumple' && h.t < 0.16)) topFlat();
    else if (h.phase === 'impact' && h.t >= h.impact) { h.phase = 'hold'; h.t = 0; }
    else if (h.phase === 'flat' && room > 20 && h.t > h.flatHold) { h.phase = 'hold'; h.t = h.holdT; }   // room again: back up into a crouch
    // squeeze out along the gap
    const wait = h.phase === 'flat' ? h.flatHold : h.phase === 'hold' ? h.holdT : Infinity;
    if (h.t >= wait) {
      const ex = topExit(h);
      if (ex) {
        h.noExit = 0;
        if (!h.crawl || C.f !== ex.d) { h.crawl = true; C.f = ex.d; h.dir = ex.d; }
        const flat = h.phase === 'flat', v = flat ? 38 : 48;
        h.mt += dt * v / (flat ? 43 : 36);
        C.x += ex.d * Math.min(Math.abs(ex.x - C.x), v * dt);
      } else {
        h.crawl = false; h.noExit += dt;
        if (h.noExit > 1.6) return topGiveUp();
      }
    }
    if (h.age > 7) return topGiveUp();
    // fit the pose under the piece: squash vertically around his feet, bulge a little sideways
    const nom = TOP_NOM[topMotion().name] || 42;
    const target = h.phase === 'flat' ? 1 : Math.max(0.25, Math.min(1, (room - 7) / nom));
    h.sy += (target - h.sy) * Math.min(1, dt * 30);
    if (h.sy > target + 0.04) h.sy = target + 0.04;   // never lag up into the block
  }
  function topShoveDone() {
    const C = S.climber, h = C.topHit;
    if (!boxFree(C.x, C.y)) { Object.assign(h, { kind: 'press', phase: 'impact', t: 0, impact: 0.1 }); return; }
    C.topHit = null; C.intent = null; C.think = 0.3;
    if (h.hard || h.run) {
      // a slam clipping him, or caught mid-run: thrown out the open side
      toAir(); C.vx = h.dir * (h.run ? 170 : 140); C.vy = h.run ? -120 : -170;
      C.tumble = !h.run; C.spin = h.dir * 9; C.wantGrab = false; C.steer = 0;
      if (h.run) C.bonkUntil = C.t + 0.6;
    } else {
      C.state = 'ground'; C.vx = 0;
      if (h.dizzy) topAnim('top_stagger', 0.9, h.dir * 22);
      else C.stumbleT = 0.4;
    }
  }
  function topRecover() {
    const C = S.climber, h = C.topHit;
    C.topHit = null; C.intent = null; C.think = 0.3; C.stuckT = 0;
    if (h.phase === 'flat' || (h.phase === 'impact' && h.kind === 'pancake')) {
      // squash-and-stretch: he springs out of the gap like a cork
      toAir(); C.vy = h.hard ? -330 : -250; C.vx = (h.crawl ? C.f : 0) * 60;
      C.tumble = false; C.steer = 0; C.wantGrab = false; C.popUntil = C.t + 0.5;
      addParts(C.x, C.y - 2, T.muted, 5, 60); sfx('jump'); say(pick(TOP_SAY.pop), 1.2);
    } else {
      C.state = 'ground'; C.landT = 0.24; C.vx = 0;
      if (h.kind === 'bonk') topAnim('top_stagger', 1.0, (h.dir || C.f) * 22);
      else say(pick(TOP_SAY.phew), 1.2);
    }
  }
  // boxed in under it with nowhere to squeeze: fall back to the old pop-out
  function topGiveUp() {
    const C = S.climber;
    C.topHit = null; expel(); C.popUntil = C.t + 0.5;
  }
  // knocked downward out of the air / off a wall or ledge; false if there is no room below
  function topSwat(push) {
    const C = S.climber, hard = !!S.slam;
    for (let k = 1; k <= CELL + 18 && C.y + k <= BH; k++) {
      if (!boxFree(C.x, C.y + k)) continue;
      C.y += k; toAir(); C.wantGrab = false; C.steer = 0;
      // at least as fast as the piece driving him down, so it doesn't catch him again at once
      C.vy = Math.max(hard ? 420 : 240, (held.soft ? CELL / SOFT : 0) + 60); C.vx = push * (hard ? 90 : 60);
      C.tumble = hard; C.spin = push * 10; C.bonkUntil = C.t + 0.9;
      addParts(C.x, C.y - BODYH, T.p.O, 5, 70); sfx('bonk'); say(pick(SAY.bonk), 1.2);
      return true;
    }
    return false;
  }
  // hanging and the falling piece comes down on his body: swatted off the ledge
  function topHangHit() {
    const C = S.climber;
    if (!topOverlap(C.x, C.y).length) return false;
    const f = C.anchor ? C.anchor.f : C.f;
    C.anchor = null; C.escape = false; toAir(); C.wantGrab = false;
    if (topSwat(-f)) return true;
    C.vy = 0; topHit();
    return true;
  }
  // hanging and a piece lands on the ledge his fingers are on
  function topFingers(A) {
    const C = S.climber;
    if (!A || A.top || (C.anchor && C.anchor.piece) || A.r < 1) return false;
    const r = A.r - 1;
    if (!pieceHas(r, A.c) && !(S.board[r][A.c] && S.ids[r][A.c] === S.serial)) return false;
    letGo(); C.vx = -A.f * 45; C.vy = 40; C.fingerUntil = C.t + 0.9; C.f = A.f;
    addParts(A.gx, A.gy, T.p.O, 4, 60); sfx('bonk'); say(pick(TOP_SAY.fingers), 1.4);
    return true;
  }
  // a piece whooshes down right beside him at arm height: he snatches his hand back
  function topBrush() {
    const C = S.climber, p = S.cur;
    if (!p || C.state !== 'ground' || C.brushId === S.serial || Math.abs(C.vx) > 30 || (C.topAnim && C.t < C.topAnim.until)) return;
    if (!boxFree(C.x, C.y)) return;
    for (let pr = 0; pr < p.m.length; pr++) for (let pc = 0; pc < p.m.length; pc++) {
      if (!p.m[pr][pc]) continue;
      const r = p.y + pr, c = p.x + pc;
      if ((r + 1) * CELL < C.y - 40 || r * CELL > C.y - 14) continue;
      const gr = c * CELL - (C.x + HW), gl = (C.x - HW) - (c + 1) * CELL;
      const sd = gr >= 0 && gr < 8 ? 1 : gl >= 0 && gl < 8 ? -1 : 0;
      if (!sd) continue;
      C.brushId = S.serial; C.f = sd;
      topAnim('top_yank', 0.4, -sd * 35);
      if (C.sayT <= 0 || Math.random() < 0.5) say(pick(TOP_SAY.brush), 1);
      return;
    }
  }
  // short reaction animations that own the ground state while they play
  function topAnim(name, dur, vx) {
    const C = S.climber;
    C.topAnim = { name, t: 0, until: C.t + dur, vx: vx || 0 };
    if (vx) C.f = Math.sign(vx) * (name === 'top_yank' ? -1 : 1);
  }
  function topGroundAnim(dt) {
    const C = S.climber, a = C.topAnim;
    if (C.t >= a.until) { C.topAnim = null; return false; }
    // a new piece is about to land on him: snap out of it and let him dodge
    if (a.t > 0.3) { const th = threat(); if (th && th.time < 0.8) { C.topAnim = null; return false; } }
    a.t += dt; C.vx = 0;
    if (a.vx) {
      moveX(a.vx * dt); a.vx *= Math.pow(0.35, dt);
      if (!supportUnder(C.x, C.y)) { C.topAnim = null; toAir(); }
    }
    return true;
  }
  // which motion shows during a hit
  function topMotion() {
    const C = S.climber, h = C.topHit;
    if (h.phase === 'shove') return { name: 'top_shove', t: h.t * 0.3 / h.dur + 0.05 };
    if (h.phase === 'flat') return h.crawl ? { name: 'top_wriggle', t: h.mt } : { name: 'top_pancake', t: h.t };
    if (h.phase === 'impact') {
      const k = h.hard ? 1.6 : 1;
      if (h.kind === 'bonk') return { name: 'top_bonk', t: h.t * k };
      if (h.kind === 'crumple') return { name: 'top_kneel', t: h.t * k };
      return { name: 'brace', t: 0.3 };
    }
    if (h.crawl) return { name: 'top_duckWalk', t: h.mt };
    if (h.kind === 'crumple') return { name: 'top_kneel', t: 0.3 };
    return { name: 'top_holdUp', t: h.t };
  }
  function topAirMotion() {
    const C = S.climber;
    if (C.popUntil > C.t && !C.tumble) return { name: 'top_popOut', t: 0.5 - (C.popUntil - C.t) };
    if (C.fingerUntil > C.t) return { name: 'top_fingers', t: C.t };
    return null;
  }
  // squash & stretch around his feet, strain shake, dizzy face after a bonk
  function topDeform(w, mo, local) {
    const C = S.climber;
    let sx = 1, sy = 1, jx = 0;
    if (C.state === 'squash' && C.topHit) {
      const h = C.topHit;
      if (h.hard && h.age < 0.08) fadeT = Math.min(fadeT, 0.03);   // a slam flattens him at once: no soft cross-fade
      if (h.phase === 'flat') { sx = 1.1; sy = 0.85 + 0.05 * Math.sin(C.t * 9); }
      else if (h.phase !== 'shove') { sy = h.sy; sx = 1 + (1 - sy) * 0.6; }
      if (h.phase === 'hold' && !h.crawl) jx = Math.sin(C.t * 70) * 0.5;
    } else if (C.state === 'air' && C.popUntil > C.t && !C.tumble) {
      const k = (C.popUntil - C.t) / 0.5;
      sy = 1 + 0.4 * k * k; sx = 1 - 0.22 * k * k;
    }
    if (C.state === 'air' && C.bonkUntil > C.t && !C.tumble) local.face = w.face = 'dizzy';
    if (sx === 1 && sy === 1 && !jx) return;
    for (const j of JOINTS) { w[j][0] = mo.ox + (w[j][0] - mo.ox) * sx + jx; w[j][1] = mo.oy + (w[j][1] - mo.oy) * sy; }
  }

  // ---------- reactions: side ----------
  // The falling piece meeting him from the left or right: moved into him, rotated into him
  // (wall kicks included), or sliding past while he climbs or hangs. Force depends on the
  // piece (I long lever, O heavy, T point, S/Z/J/L corners) and on how often he was just hit.
  const SIDE_MOVE = { I: 1.2, O: 1.6, T: 1.1, S: 1.0, Z: 1.0, J: 1.0, L: 1.0 };   // shoved by a sideways move
  const SIDE_ROT = { I: 3.0, O: 0, T: 2.3, S: 2.0, Z: 2.0, J: 2.1, L: 2.1 };      // swept by a rotation
  const SIDE_SAY = { rot: ['Watch the elbows!', 'OW! Corners!', 'Hey, I was standing there!', 'Swing much?'],
                     push: ['Hnngh!', 'Too… heavy…', 'Stop pushing!'], pin: ['Hrrk—!', 'Can\'t… breathe…', 'SQUISH'] };
  const SIDE_LOSE = { I: 0.3, O: 0.65, T: 0.45, S: 0.5, Z: 0.5, J: 0.45, L: 0.45 }; // chance a jolt costs a hand
  const SIDE_SHOVE = {
    jostle: { dur: 0.5, motion: 'side_jostle', v: 70, fr: 0.004 },
    jab: { dur: 0.6, motion: 'side_jab', v: 60, fr: 0.002 },
    staggerBack: { dur: 0.85, motion: 'side_staggerBack', v: 125, fr: 0.06 },
    staggerFwd: { dur: 0.75, motion: 'side_staggerFwd', v: 120, fr: 0.06 },
    spin: { dur: 0.9, motion: 'side_spin', v: 95, fr: 0.03 },
    sprawl: { dur: 1.7, motion: 'side_fallBack', v: 150, fr: 0.0005 },
    skid: { dur: 0.45, motion: 'side_skid', v: 0, fr: 1e-4 },
  };
  // falling-piece cells level with his body (or about to be), nearest one on each side
  function sideScan() {
    const C = S.climber, p = S.cur;
    if (!p) return null;
    let best = null;
    for (let pr = 0; pr < p.m.length; pr++) for (let pc = 0; pc < p.m.length; pc++) {
      if (!p.m[pr][pc]) continue;
      const r = p.y + pr, c = p.x + pc;
      if (r * CELL >= C.y || (r + 1) * CELL <= C.y - BODYH) continue;
      const L = c * CELL, R = L + CELL;
      const gap = L >= C.x ? L - (C.x + HW) : R <= C.x ? (C.x - HW) - R : -1;
      if (gap < 0) continue;
      if (!best || gap < best.gap) best = { gap, d: L >= C.x ? 1 : -1, r, c };
    }
    return best;
  }
  // free space on his side d before the stack or a wall (body rows only)
  function sideRoom(d) {
    const C = S.climber;
    const co = d > 0 ? Math.floor((C.x + HW - 0.001) / CELL) + 1 : Math.floor((C.x - HW) / CELL) - 1;
    const r0 = Math.floor((C.y - BODYH) / CELL), r1 = Math.floor((C.y - 0.5) / CELL);
    for (let r = r0; r <= r1; r++) if (solidB(r, co)) return d > 0 ? co * CELL - (C.x + HW) : (C.x - HW) - (co + 1) * CELL;
    return 99;
  }
  // smallest step along (ux, uy) that clears his box, or 0
  function sideClear(ux, uy, max) {
    const C = S.climber;
    for (let s = 1; s <= max; s++) if (boxFree(C.x + ux * s, C.y + uy * s)) return s;
    return 0;
  }
  // displace him out of the piece. The last drawn pose moves with him, so the 0.12 s
  // cross-fade into the reaction blends poses in place instead of dragging him through
  // the block; speed streaks show the jump instead.
  function sideShiftPose(dx, dy) {
    if (lastWorld) for (const j of JOINTS) lastWorld[j] = [lastWorld[j][0] + dx, lastWorld[j][1] + dy];
  }
  function sideMoveBy(dx, dy, color, n) {
    const C = S.climber, x0 = C.x, y0 = C.y - 24;
    C.x += dx; C.y += dy;
    sideShiftPose(dx, dy);
    if (Math.abs(dx) + Math.abs(dy) > 3) C.sideFx = { x0, y0, x1: C.x, y1: C.y - 24, t: 0.18 };
    if (n) addParts(x0 + dx * 0.4, y0 + dy * 0.4, color, n, 70);
  }
  // which way the piece pushes him: the move direction, or for a rotation away from the
  // overlapping cells' centre
  function sideDir(dx) {
    const C = S.climber, p = S.cur;
    if (dx) return Math.sign(dx);
    let sx = 0, n = 0;
    for (let pr = 0; pr < p.m.length; pr++) for (let pc = 0; pc < p.m.length; pc++) {
      if (!p.m[pr][pc]) continue;
      const r = p.y + pr, c = p.x + pc;
      if (r * CELL >= C.y || (r + 1) * CELL <= C.y - BODYH) continue;
      if ((c + 1) * CELL <= C.x - HW || c * CELL >= C.x + HW) continue;
      sx += colX(c); n++;
    }
    if (!n) { sx = (p.x + p.m.length / 2) * CELL; n = 1; }
    return Math.sign(C.x - sx / n) || -C.f;
  }
  function sideShove(kind, d) {
    const C = S.climber, k = SIDE_SHOVE[kind];
    // shoved from the front plays backward, from behind forward
    if (kind === 'staggerBack' && C.f === d) kind = 'staggerFwd';
    if (kind === 'jostle' || kind === 'jab' || kind === 'sprawl' || kind === 'skid' || kind === 'spin') C.f = -d;
    const kk = SIDE_SHOVE[kind] || k;
    C.shove = { kind, d, t: 0, dur: kk.dur, motion: kk.motion, fr: kk.fr, flipped: false };
    C.vx = d * kk.v;
    C.alert = null; C.intent = null; C.crouchT = 0; C.stumbleT = 0; C.landT = 0; C.think = 0.3;
  }
  // a sideways move or rotation of the falling piece; true = fully handled here
  function sideHit(dx, dy, rot, riding, hanging) {
    const C = S.climber, p = S.cur;
    if (!p || riding || dy > 0 || (!dx && !rot)) return false;
    const st = C.state, t = p.t;
    if (hanging && (st === 'hang' || st === 'pull')) return sideHangJolt(dx, rot, t);
    if (st === 'hang') return boxFree(C.x, C.y) ? (sideWatch(dx), false) : sideScrape(dx);
    if (!['ground', 'air', 'dazed', 'climb', 'button'].includes(st)) return false;
    if (boxFree(C.x, C.y)) { sideWatch(dx); return false; }

    const d = sideDir(dx);
    C.sideHits = (C.sideHits || 0) + 1;
    const F = (rot ? SIDE_ROT[t] + (dy < 0 ? 0.3 : 0) : SIDE_MOVE[t]) + (t === 'O' ? 0 : 0.6 * (C.sideHits - 1));
    const color = T.p[t] || T.ink;
    S.shake = Math.min(12, S.shake + 0.8 + F);

    if (st === 'climb') return sideClimbHit(d, F, color);
    const s = sideClear(d, 0, 30);
    if (!s) return sidePinned(d, color, F);
    sideMoveBy(d * s, 0, color, F >= 2 ? 6 : 3);
    sfx(F >= 2 ? 'bonk' : 'thud');

    if (st === 'air') {
      C.vx = d * Math.max(Math.abs(C.vx), 140 + F * 30); C.vy = Math.min(C.vy, -120);
      if (F >= 2) { C.tumble = true; C.spin = d * 10; }
      say(pick(SAY.bonk), 1.1);
      return true;
    }
    if (st === 'dazed') { C.dazedT = Math.min(2.5, C.dazedT + 0.4); say('Hey!', 0.9); return true; }
    if (st === 'button') { C.state = 'ground'; C.pressed = C.zapped = false; C.btnT = 0; }
    if (!supportUnder(C.x, C.y)) { toAir(); C.vx = d * (90 + F * 40); C.vy = -80; C.tumble = F >= 2; C.spin = d * 9; return true; }
    if (F >= 2.8) {
      // the long arm of an I (or a pile of hits) sends him flying
      toAir(); C.vx = d * 175; C.vy = -270; C.tumble = true; C.spin = d * 11; C.wantGrab = false;
      say(pick(SAY.big), 1.4); sfx('fall');
    } else if (F >= 2.0) {
      sideShove((t === 'S' || t === 'Z') && rot ? 'spin' : 'sprawl', d);
      say(pick(rot ? SIDE_SAY.rot : SAY.bonk), 1.3);
    } else if (t === 'O' && !rot) {
      // heavy and flat: he gets bulldozed, staying pressed against its face
      sideShove('skid', d);
      if (C.sideHits < 1.5 || C.sayT <= 0) say(pick(SIDE_SAY.push), 1.2);
    } else if (F >= 1.4) {
      sideShove('staggerBack', d);
      if (C.sayT <= 0) say(pick(SAY.small), 1);
    } else {
      sideShove(t === 'T' && C.f !== d ? 'jab' : 'jostle', d);
      if (C.sayT <= 0 && Math.random() < 0.6) say(t === 'T' ? 'Oof!' : pick(SAY.small), 1);
    }
    return true;
  }
  // nothing hit him yet: did it just slide up next to him? then he looks at it
  function sideWatch(dx) {
    const C = S.climber;
    if (!dx) return;
    const sc = sideScan();
    if (!sc || sc.d !== -Math.sign(dx) || sc.gap > CELL + 2) return;
    C.sideWarn = { d: sc.d, t: 0.7 };
    if (C.state === 'ground' && !C.shove && !C.alert && Math.abs(C.vx) < 25 && C.crouchT <= 0) C.f = sc.d;
  }
  // no room to be pushed: squeeze, then pop out upward like a melon seed (or get flattened)
  function sidePinned(d, color, F) {
    const C = S.climber;
    const up = sideClear(0, -1, 70);
    if (!up) return false;              // the old nudge/squash path handles it
    if (F >= 2.5) {
      // too hard to squeeze: the swing scoops him up and over
      sideMoveBy(0, -up); toAir(); C.vy = -300; C.vx = -d * 60; C.tumble = true; C.spin = -d * 11; C.wantGrab = false;
      addParts(C.x, C.y - 10, color, 6, 90); say(pick(SAY.big), 1.4); sfx('fall');
      return true;
    }
    C.state = 'squash'; C.squashT = 9; C.vx = C.vy = 0; C.anchor = null; C.shove = null;
    C.sideSq = { t: 0, up, d, wall: d > 0 ? Math.ceil((C.x + HW) / CELL) * CELL : Math.floor((C.x - HW) / CELL) * CELL };
    addParts(C.x, C.y - 26, color, 4, 50);
    say(pick(SIDE_SAY.pin), 1); sfx('bonk');
    return true;
  }
  function sidePop() {
    const C = S.climber, q = C.sideSq;
    C.sideSq = null;
    const up = sideClear(0, -1, 70);
    if (!up) { expel(); return; }
    sideMoveBy(0, -up); toAir();
    C.vy = -330; C.vx = -q.d * 20; C.wantGrab = true; C.tumble = false; C.sidePopT = 0.5;
    addParts(C.x, C.y, T.ink, 5, 90); sfx('jump'); say('PWAH!', 0.9);
  }
  // climbing a face: pushed into it (pinned, pops up) or swept off it
  function sideClimbHit(d, F, color) {
    const C = S.climber, f = C.f;
    const up = F >= 2 && sideClear(0, -1, 70);
    if (up) {
      // a rotation scoops him off the face: up, back over the piece, spinning
      sideMoveBy(0, -up); toAir(); C.vy = -240; C.vx = -f * 110; C.tumble = true; C.spin = -f * 10; C.wantGrab = false;
      addParts(C.x + f * 6, C.y - 20, color, 5, 80); say(pick(SIDE_SAY.rot), 1.3); sfx('fall');
      return true;
    }
    if (d === -f) {
      const s = sideClear(d, 0, 30);
      if (s) {
        sideMoveBy(d * s, 0, color, 4); toAir();
        C.vx = d * (110 + F * 35); C.vy = -90; C.tumble = F >= 2; C.spin = d * 9; C.wantGrab = F < 2;
        C.sideSwept = !C.tumble;
        say(pick(SAY.slip), 1.1); sfx('fall');
        return true;
      }
    }
    if (sidePinned(d, color, F)) return true;
    const dn = sideClear(0, 1, 56);
    if (dn) { sideMoveBy(0, dn); toAir(); C.vy = 60; C.vx = -f * 30; say(pick(SAY.slip), 1.1); return true; }
    return false;
  }
  // hanging from the falling piece while it is moved or rotated: swing, lose a hand, lose both
  function sideHangJolt(dx, rot, t) {
    const C = S.climber;
    if (C.state === 'pull') return false;
    const A = anchorAbs(), f = A ? A.f : C.f;
    if (rot) {
      const d = -f;
      letGo(); C.vx = d * (t === 'I' ? 220 : 150); C.vy = t === 'I' ? -230 : -160;
      C.tumble = t === 'I' || t === 'T'; C.spin = d * 10; C.sideSwept = !C.tumble;
      say(pick(SAY.thrown), 1.3); sfx('fall');
      return true;
    }
    // the grip lurches dx; his body lags behind and swings (+ = feet away from the face)
    sideShiftPose(dx * CELL, 0);
    C.swV = (C.swV || 0) + dx * f * (t === 'O' ? 3.4 : t === 'I' ? 2.2 : 2.8);
    if (C.oneHand) {
      letGo('slip'); C.vx = -dx * 100; C.vy = -40; C.sideSwept = true;
      return true;
    }
    if (Math.random() < SIDE_LOSE[t]) {
      C.oneHand = dx * f > 0 ? 'lHand' : 'rHand'; C.oneHandT = 1.0;
      say(pick(SAY.slip), 1.1);
    } else if (C.sayT <= 0 && Math.random() < 0.4) say(pick(['Whoa!', 'Easy!', 'Wheee—']), 0.9);
    return true;
  }
  // hanging from the stack and the piece is moved into his body: scramble up or drop
  function sideScrape(dx) {
    const C = S.climber, A = anchorAbs();
    if (A && !A.top && boxFree(A.gx + A.f * 8, A.gy)) {
      C.state = 'pull'; C.pullT = 0.16; C.sideBoost = 0.3;
      say(pick(['Yikes!', 'Up up up!']), 0.9);
      return true;
    }
    const d = Math.sign(dx) || -(A ? A.f : C.f);
    letGo('slip');
    const dn = sideClear(0, 1, 56);
    if (dn) { sideMoveBy(0, dn); C.vx = d * 60; C.sideSwept = true; return true; }
    const s = sideClear(d, 0, 30);
    if (s) { sideMoveBy(d * s, 0); C.vx = d * 80; C.sideSwept = true; return true; }
    expel();
    return true;
  }
  // per frame, before the state machine: timers, swing, and what the nearby piece makes him do
  function sideTick(dt) {
    const C = S.climber;
    C.sideHits = Math.max(0, (C.sideHits || 0) - dt * 0.6);
    if (C.sideFx && (C.sideFx.t -= dt) <= 0) C.sideFx = null;
    if (C.sidePopT > 0) C.sidePopT -= dt;
    if (C.sideWarn && (C.sideWarn.t -= dt) <= 0) C.sideWarn = null;
    if (C.state !== 'air') C.sideSwept = false;
    if (C.state !== 'ground') C.shove = null;
    if (C.sideSq) {
      if (C.state !== 'squash') C.sideSq = null;
      else if ((C.sideSq.t += dt) > 0.42) sidePop();
    }
    if (C.sideBoost > 0 && C.state === 'pull') { const b = Math.min(C.sideBoost, dt); C.pullT += b; C.sideBoost -= b; }
    // pendulum swing around the grip, about 1 s period; the face below the grip stops the feet
    if (C.state === 'hang' || C.state === 'pull') {
      const A = anchorAbs();
      let a = C.swA || 0, v = C.swV || 0;
      if (C.state === 'pull') { a *= Math.exp(-dt * 10); v = 0; }
      else {
        const k = C.oneHand ? 26 : 34;
        v += (-k * a - 2 * v) * dt; a += v * dt;
        const lim = A && !A.top && solid(A.r + 1, A.c) ? -0.06 : -0.3;
        if (a < lim) { a = lim; if (v < -1.2) { addParts(C.x + (A ? A.f : 1) * 5, C.y - 4, T.ink, 2, 30); sfx('thud'); } v = -v * 0.35; }
        if (a > 0.9) { a = 0.9; v = Math.min(0, v); }
      }
      C.swA = a; C.swV = v;
      if (C.oneHand) {
        C.oneHandT -= dt; C.hangT = Math.min(C.hangT, 0.2);
        if (C.oneHandT <= 0 && Math.abs(a) < 0.25) C.oneHand = null;   // regrab once the swing settles
      }
    } else { C.swA = C.swV = 0; C.oneHand = null; }
    // piece beside him: brace against it, squeeze in a slot, tuck legs, or watch it go by
    C.sideBrace = null; C.sideTuck = false; C.sideLook = 0;
    const pinK = C.sidePinK || 0;
    let pinned = false;
    const sc = S.cur && !S.slam && ['ground', 'climb', 'hang'].includes(C.state) ? sideScan() : null;
    if (sc) {
      if (C.state === 'ground' && !C.shove && !C.alert && C.crouchT <= 0 && C.stumbleT <= 0) {
        if (sc.gap + sideRoom(-sc.d) <= 20) pinned = true;
        else if (sc.gap <= 6 && grounded() && Math.abs(C.vx) < 30 && supportUnder(C.x, C.y) === 'board') {
          C.sideBrace = { d: sc.d, gap: sc.gap }; C.f = sc.d;
          if (C.sayT <= -1 && Math.random() < dt * 0.6) say(pick(['Hnnng!', 'Get… off…', 'I got it!']), 1);
        } else if (sc.gap <= CELL) {
          // sliding down past him: keep watching it until it is gone
          if (C.sideWarn && C.sideWarn.d === sc.d) C.sideWarn.t = Math.max(C.sideWarn.t, 0.15);
          else { C.sideWarn = { d: sc.d, t: 0.7 }; if (Math.abs(C.vx) < 25) C.f = sc.d; }
        }
      } else if (C.state === 'climb' && sc.gap <= CELL && sc.d === -C.f) C.sideLook = sc.d;
      else if (C.state === 'hang' && sc.gap <= CELL && !(C.anchor && C.anchor.piece)) { C.sideTuck = true; C.sideLook = sc.d; }
    }
    C.sidePinK = Math.max(0, Math.min(1, pinK + (pinned ? dt * 6 : -dt * 4)));
    if (pinned && pinK === 0) say(pick(['Hey, I live here!', 'Tight fit…', 'Eek!']), 1);
  }
  // ground state while being shoved; returns true while the shove owns him
  function sideShoveTick(dt) {
    const C = S.climber, s = C.shove;
    s.t += dt;
    C.vx *= Math.pow(s.fr, dt);
    if (s.kind === 'spin' && !s.flipped && s.t >= 0.3) { s.flipped = true; C.f = -C.f; }
    if (moveX(C.vx * dt) && s.kind !== 'skid' && Math.abs(C.vx) > 40) sfx('thud');
    if (!supportUnder(C.x, C.y)) {
      const tum = s.kind === 'sprawl' || s.kind === 'spin';
      C.shove = null; toAir(); C.tumble = tum; C.spin = s.d * 8; C.sideSwept = !tum; C.vx = s.d * Math.max(50, Math.abs(C.vx));
      return true;
    }
    if (s.t >= s.dur) { C.shove = null; C.vx = 0; C.think = 0.15; C.landT = 0; }
    return true;
  }
  // overrides the motion currentMotion() picked
  function sideMotion(mo) {
    const C = S.climber;
    const w = C.sideWarn;
    if (C.state === 'squash' && C.sideSq) { mo.name = 'side_squeezed'; mo.t = C.t; }
    else if (C.state === 'ground') {
      if (C.shove) {
        mo.name = C.shove.motion; mo.t = C.shove.t;
        if (C.shove.kind === 'skid') mo.ox = C.x + C.f * (HW - 7.6);   // palms flat on the face
      }
      else if (C.alert) return mo;
      else if (C.sideBrace) { mo.name = 'side_brace'; mo.t = C.t; mo.ox = C.x + C.f * (C.sideBrace.gap + HW - 7.6); }
      else if (C.sidePinK > 0.3) { mo.name = 'side_squeezed'; mo.t = C.t; }
      else if (w && Math.abs(C.vx) < 25 && C.crouchT <= 0 && C.stumbleT <= 0 && C.landT <= 0) { mo.name = 'side_guard'; mo.t = 0.7 - w.t; }
    } else if (C.state === 'air' && !C.tumble) {
      if (C.sidePopT > 0) { mo.name = 'side_pop'; mo.t = 0.5 - C.sidePopT; }
      else if (C.sideSwept) mo.name = 'side_swept';
    } else if (C.state === 'hang' && C.sideTuck && mo.name === 'hang') mo.name = 'side_hangTuck';
    return mo;
  }
  // tweaks the sampled world pose and draws motion streaks; cheap, per frame
  function sideDraw(P, dt) {
    const C = S.climber;
    const tr = fn => { for (const j of JOINTS) P[j] = fn(P[j]); };
    if ((C.state === 'hang' || C.state === 'pull') && (C.swA || C.oneHand)) {
      const A = anchorAbs();
      if (A) {
        const gx = A.gx, gy = A.gy, f = A.f;
        // one hand lost: the free arm flails outward and the body sags onto the other
        if (C.oneHand && C.state === 'hang') {
          // angles from straight down, positive swinging outward (away from the wall, -f)
          const sh = [P.neck[0], P.neck[1] + 3], w = C.t * 17;
          const a1 = 2.0 + 0.6 * Math.sin(w), a2 = a1 + 0.5 + 0.4 * Math.sin(w + 1.3);
          const el = [sh[0] - f * Math.sin(a1) * 9, sh[1] + Math.cos(a1) * 9];
          P[C.oneHand] = [el[0] - f * Math.sin(a2) * 9, el[1] + Math.cos(a2) * 9];
          P[C.oneHand === 'lHand' ? 'lElbow' : 'rElbow'] = el;
          P.face = 'scared';
        }
        const r = f * (C.swA || 0), cs = Math.cos(r), sn = Math.sin(r);
        tr(p => { const x = p[0] - gx, y = p[1] - gy; return [gx + x * cs - y * sn, gy + x * sn + y * cs]; });
      }
    }
    if (C.state === 'squash' && C.sideSq) {
      // flattened against the wall side: squeeze across, stretch up, quiver
      const q = C.sideSq, k = Math.min(1, q.t / 0.08), sx = 1 - 0.65 * k, sy = 1 + 0.12 * k;
      const jx = (Math.random() - 0.5) * 1.2;
      tr(p => [q.wall + (p[0] - q.wall) * sx + jx, C.y + (p[1] - C.y) * sy]);
    } else if (C.sidePinK > 0) {
      const k = C.sidePinK, sx = 1 - 0.3 * k, jx = Math.sin(C.t * 40) * 0.5 * k;
      tr(p => [C.x + (p[0] - C.x) * sx + jx, p[1]]);
    }
    if (C.state === 'air' && C.sidePopT > 0) {
      const k = C.sidePopT / 0.5, sx = 1 - 0.3 * k, sy = 1 + 0.25 * k;
      tr(p => [C.x + (p[0] - C.x) * sx, C.y - 23 + (p[1] - C.y + 23) * sy]);
    }
    if (C.shove && C.shove.kind === 'spin' && C.shove.t > 0.06 && C.shove.t < 0.54) {
      // a pirouette: squash across through edge-on, the facing flip happens at the thinnest point
      const sx = Math.max(0.12, Math.abs(Math.cos(Math.PI * (C.shove.t - 0.06) / 0.48))), cx = P.hip[0];
      tr(p => [cx + (p[0] - cx) * sx, p[1]]);
    }
    if (C.sideBrace || (C.shove && C.shove.kind === 'skid')) {
      const j = (Math.random() - 0.5) * 0.7;
      P.head = [P.head[0] + j, P.head[1]];
    }
    if (C.sideLook) { P.f = C.sideLook; P.face = 'scared'; }
    else if (C.sideWarn && C.state !== 'ground') P.face = 'scared';
    if (C.sideFx) {
      // speed streaks from where he was hit to where he ended up
      const q = C.sideFx, a = q.t / 0.18, dx = q.x1 - q.x0, dy = q.y1 - q.y0, L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L, k = 1 - a;                // streak tails catch up with him
      ctx.save();
      ctx.globalAlpha = 0.55 * a; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const o of [-12, 0, 12]) {
        ctx.moveTo(q.x0 + dx * k + nx * o, q.y0 + dy * k + ny * o);
        ctx.lineTo(q.x1 - dx / L * 6 + nx * o, q.y1 - dy / L * 6 + ny * o);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- reactions: near ----------
  // Near misses and shockwaves: pieces landing beside him (not on him), pieces brushing past,
  // and the choreography of getting out of the way. One reaction runs at a time in C.react
  // ({ kind, t, dur, vx, drag, dir, s, next, piece }) while he is on the ground.
  const NEAR_MASS = { I: 1.2, O: 1.15, T: 0.9, J: 0.9, L: 0.9, S: 0.85, Z: 0.85 };
  const NEAR_MO = { glance: 'near_glance', flinch: 'near_flinch', hop: 'near_hop', stagger: 'near_stagger', bowl: 'near_bowl',
                    teeter: 'near_teeter', recover: 'near_recover', skid: 'near_skid', watch: 'near_watch', phew: 'near_phew',
                    roll: 'near_roll', rollup: 'near_rollup', slide: 'near_bellyslide', duck: 'near_duck', lean: 'near_lean', land: 'land' };
  // these give way at once if a new piece comes for him; the rest play out first
  const NEAR_SOFT = ['glance', 'flinch', 'watch', 'phew', 'duck', 'lean', 'land', 'skid'];
  const NEAR_SAY = {
    flinch: ['Yikes!', 'Hey!', 'Eek!'], hop: ['Whoa!', 'Hup!', 'Yipe!'],
    stagger: ['Whoa-whoa-whoa!', 'Easy!', 'Hey, careful!'], bowl: ['Oof!', 'Bowled over…'],
    teeter: ['Whoa… whoa…', "Don't look down…", 'Balance… balance…'], caught: ['…Safe.', 'Nailed it.', 'Steady.'],
    fell: ['Nooo—', 'Aaah—'], phew: ['Phew…', 'Too close!', 'That was an inch!', 'Hoo boy.'],
    dive: ['Eep!', 'Hup!', 'Gotta go!'], leap: ['Hup!', 'Up and over!'],
    I: ['Timber!', 'Big one!'], O: ['THUD.', 'Heavy!'], T: ['Pointy!'], S: ['Wobbly one!'], Z: ['Wobbly one!'], J: ['Watch the corner!'], L: ['Watch the corner!'],
  };

  function nearStart(kind, o) {
    const C = S.climber;
    C.react = Object.assign({ kind, t: 0, dur: M.duration(NEAR_MO[kind]) || 0.4, vx: 0, drag: 0.02, lastT: C.t }, o || {});
    C.crouchT = 0; C.stumbleT = 0; C.landT = 0; C.vx = 0; C.intent = null;
    return C.react;
  }
  function nearEnd() {
    const C = S.climber;
    C.react = null; C.vx = 0; C.intent = null; C.think = 0.1;
  }
  // piece centre in board px (for looking at it)
  function nearPieceAt(p) {
    let x = 0, y = 0, n = 0;
    p.m.forEach((row, r) => row.forEach((v, c) => { if (v) { x += (p.x + c + 0.5) * CELL; y += (p.y + r + 0.5) * CELL; n++; } }));
    return n ? [x / n, y / n] : null;
  }
  // soft round dust puffs (drawn in drawNearFx) and a ground ripple for slams
  function nearDust(x, y, dir, n, power) {
    S.nearFx = S.nearFx || [];
    for (let i = 0; i < n; i++) {
      const d = dir || (Math.random() < 0.5 ? -1 : 1);
      S.nearFx.push({ k: 'puff', x: x + (Math.random() - 0.5) * 6, y: y - 2, vx: d * power * (0.4 + Math.random() * 0.7), vy: -power * (0.1 + Math.random() * 0.3),
                      r: 2 + Math.random() * 2, t: 0, life: 0.35 + Math.random() * 0.3 });
    }
  }

  // a piece just locked: a shockwave through the ground, sized by piece mass, drop height, distance
  function nearKnock(cells, hard, dist, cleared, riding) {
    const C = S.climber;
    if (riding || cleared || !cells.length) return false;
    const t = S.board[cells[0][0]][cells[0][1]] || 'T';
    const flatI = t === 'I' && cells.every(([r]) => r === cells[0][0]);
    const bodyMid = C.y - BODYH / 2, headTop = C.y - BODYH;
    let best = null;
    for (const [r, c] of cells) {
      const gx = Math.max(0, Math.abs(colX(c) - C.x) - CELL / 2 - HW);
      const gy = Math.max(0, Math.abs(r * CELL + CELL / 2 - bodyMid) - CELL / 2 - BODYH / 2);
      const d = Math.hypot(gx, gy * 1.3);
      if (!best || d < best.d) best = { d, r, c, gx, gy };
    }
    const mass = NEAR_MASS[t] * (flatI ? 1.08 : 1);
    const base = hard ? 0.75 + Math.min(dist, 20) * 0.03 : 0.5;
    let s = mass * base * Math.pow(Math.max(0, 1 - best.d / (3.2 * CELL)), 1.3);
    const overhead = best.gx === 0 && (best.r + 1) * CELL <= headTop + 1;
    const away = Math.sign(C.x - colX(best.c)) || -C.f;
    const R0 = C.react;
    const dodging = (C.alert && C.alert.ran) || (R0 && ['watch', 'skid', 'roll', 'rollup', 'slide', 'land'].includes(R0.kind));
    const close = best.d < 0.6 * CELL;
    // dust where the piece meets the ground on his side, and round his feet
    if (s > 0.15) {
      const side = colX(best.c) + (overhead ? 0 : -away * -CELL / 2);
      for (const [r, c] of cells) {
        if (r + 1 >= ROWS || !cells.some(([r2, c2]) => r2 === r + 1 && c2 === c)) {
          if (!flatI && c !== best.c) continue;
          nearDust(flatI ? colX(c) : side, (r + 1) * CELL, flatI ? (Math.random() < 0.5 ? -1 : 1) : away, Math.round(1 + s * 3), 40 + s * 50);
        }
      }
      const footY = Math.max(...cells.filter(([, c]) => c === best.c).map(([r]) => (r + 1) * CELL));
      if (hard) S.nearFx.push({ k: 'ring', x: side, y: footY, t: 0, life: 0.4, s: Math.min(1.6, s) });
      if (s > 0.35) { nearDust(C.x - 3, C.y, -1, 2, 30 + s * 30); nearDust(C.x + 3, C.y, 1, 2, 30 + s * 30); }
    }
    if (R0 && ['roll', 'rollup', 'slide', 'teeter', 'bowl'].includes(R0.kind)) {
      // mid-move: no new pose, but remember to sigh once he is up
      if (close && !R0.next) R0.next = 'phew';
      R0.at = [colX(best.c), best.r * CELL + CELL / 2];
      return true;
    }
    C.alert = null;
    // pick the reaction tier
    let kind = s < 0.12 ? null : s < 0.3 ? 'glance' : s < 0.55 ? 'flinch' : s < 0.8 ? 'hop' : s < 1.15 ? 'stagger' : 'bowl';
    if (kind === 'bowl' && s > 1.5 && (t === 'I' || t === 'O')) {
      nearEnd(); knockOff(away); C.vy = -260 - s * 40; return true;
    }
    if (overhead) kind = s < 0.12 ? null : 'duck';
    if (dodging && (!kind || kind === 'glance' || kind === 'flinch' || kind === 'hop')) {
      // he got out of the way: a close shave makes him flinch and sigh, a wide miss gets a taunt
      if (close) kind = 'flinch';
      else { if (R0 && R0.kind === 'watch') nearEnd(); if (Math.random() < 0.6) say(pick(SAY.missed), 1.4); if (!kind) return true; }
    }
    if (!kind) { if (R0 && R0.kind === 'watch') nearEnd(); return true; }
    if (kind !== 'duck') C.f = -away;
    const vx = { glance: 0, flinch: 30, hop: 55, stagger: 95, bowl: 60, duck: 0 }[kind] * away;
    const R = nearStart(kind, { vx, drag: kind === 'stagger' ? 0.03 : 0.02, dir: away, s, at: [colX(best.c), best.r * CELL + CELL / 2] });
    if (kind === 'duck') R.hold = C.t + 0.45;
    if (dodging && close) R.next = 'phew';
    else if (close && kind === 'stagger' && Math.random() < 0.6) R.next = 'phew';
    if (kind !== 'glance' && kind !== 'duck' && C.sayT <= 0.3 && Math.random() < 0.7)
      say(pick(s > 0.8 && Math.random() < 0.5 ? NEAR_SAY[t] : NEAR_SAY[kind]), 1.2);
    if (kind === 'bowl') sfx('thud');
    return true;
  }

  // he just landed: a dive turns into a forward roll (or a belly slide with no room), a leap into a look back
  function nearLanded() {
    const C = S.climber;
    const dv = C.dive && C.t - C.dive.t0 < 1.5 ? C.dive : null, lp = C.leap && C.t - C.leap.t0 < 1.5 ? C.leap : null;
    C.dive = C.leap = null;
    if (C.state !== 'ground' || (!dv && !lp)) return;
    const d = C.f || 1;
    if (dv) {
      const room = boxFree(C.x + d * 30, C.y) && supportUnder(C.x + d * 30, C.y);
      if (dv.flat || !room) nearStart('slide', { vx: d * 150, drag: 0.004, dir: d, piece: dv.piece, next: 'watch' });
      else nearStart('roll', { vx: d * 120, drag: 0.08, dir: d, piece: dv.piece, next: 'rollup' });
      nearDust(C.x, C.y, -d, 3, 50);
    } else nearStart('land', { piece: lp.piece, next: 'watch' });
  }

  // the threat is gone and he ran: skid to a stop and turn to watch it come down
  function nearSafe() {
    const C = S.climber, A = C.alert;
    STATS.dodges++;
    const piece = A && A.piece === S.cur ? S.cur : null;
    if (C.react && !NEAR_SOFT.includes(C.react.kind)) { if (!C.react.next && piece) C.react.next = 'watch'; return; }
    if (!piece) { if (Math.random() < 0.5) say(pick(SAY.missed), 1.4); return; }
    if (Math.abs(C.vx) > 50) nearStart('skid', { vx: C.vx, drag: 0.0005, piece, next: 'watch' });
    else nearStart('watch', { piece });
  }

  // a flat dodge path is blocked: a one-block step he can leap onto, out from under the piece
  function nearLeapPlan() {
    const C = S.climber, p = S.cur;
    const r = Math.round(C.y / CELL), c = Math.max(0, Math.min(COLS - 1, Math.floor(C.x / CELL)));
    const inPiece = col => p.m.some((row, pr) => row.some((v, pc) => v && p.x + pc === col));
    let best = null;
    for (const d of [-1, 1]) {
      for (let k = 1; k < COLS; k++) {
        const col = c + d * k;
        if (col < 0 || col >= COLS) break;
        if (solidB(r - 1, col)) {
          if (!solidB(r - 2, col) && !solidB(r - 3, col) && !inPiece(col) && !solidB(r - 3, col - d) && !solidB(r - 4, col - d)) {
            const x = d > 0 ? col * CELL - HW - 16 : (col + 1) * CELL + HW + 16;
            if (!best || Math.abs(x - C.x) < Math.abs(best.x - C.x)) best = { x, d, col };
          }
          break;
        }
        if (!solidB(r, col)) break;
      }
    }
    return best;
  }

  // called every frame while he dodges: choose the style by time left and what is around him
  function nearDodge(th) {
    const C = S.climber, A = C.alert, p = S.cur;
    if (!p) return false;
    A.piece = A.piece || p;
    let it = C.intent;
    if (it.type === 'brace') {
      const lp = nearLeapPlan();
      if (!lp) return false;
      C.intent = it = { type: 'dodge', x: lp.x, leap: lp };
    }
    A.ran = true;
    const gap = it.x - C.x, dist = Math.abs(gap), left = th ? th.time : 1, d = Math.sign(gap) || C.f;
    // plenty of time: a brisk jog; otherwise a flat-out sprint
    it.spd = left > dist / RUN + 0.5 ? RUN : DODGE;
    A.spd = it.spd;
    if (it.leap) {
      if (dist < 5 || (left < 0.22 && dist < 26)) {
        toAir(); C.f = d; C.steer = 0; C.vx = d * 140; C.vy = -Math.sqrt(2 * G * (CELL + 18)); C.wantGrab = true;   // carry well past the lip, clear of the piece
        C.leap = { t0: C.t, piece: p };
        say(pick(NEAR_SAY.leap), 0.9); sfx('jump');
        return true;
      }
      return false;
    }
    // not enough time to run: dive - a low sliding dive when it is desperate or short
    if (!A.dived && dist > 3 && left < dist / DODGE + 0.06) {
      A.dived = true;
      const flat = left < 0.14 || dist < 22;
      toAir(); C.f = d; C.steer = 0;                 // no air steering: keep the full dive speed
      if (flat) { C.vx = d * 200; C.vy = -90; } else { C.vx = d * 185; C.vy = -170; }
      C.dive = { t0: C.t, flat, piece: p };
      say(pick(NEAR_SAY.dive), 0.9);
      return true;
    }
    return false;
  }

  // edge of his footing in direction dir, measured from x
  function nearEdge(x, dir) {
    const C = S.climber, r = Math.round(C.y / CELL);
    let col = Math.floor((x - dir * (HW - 0.5)) / CELL);
    if (!solidB(r, col)) return null;
    while (col + dir >= 0 && col + dir < COLS && solidB(r, col + dir)) col += dir;
    return dir > 0 ? (col + 1) * CELL : col * CELL;
  }
  // shoved to a ledge edge: heels on the edge, hips out over the drop, arms windmilling
  function nearTeeter(R) {
    const C = S.climber, dir = Math.sign(R.vx) || R.dir || 1;
    const E = nearEdge(C.x, dir);
    if (E === null) return false;
    const x = E + dir * (HW - 3);
    if (!boxFree(x, C.y) || !supportUnder(x, C.y)) return false;
    C.x = x; C.f = -dir;
    const s = R.s || 0.6;
    nearStart('teeter', { dir, s, dur: 0.75 + Math.random() * 0.45, fall: Math.random() < Math.min(0.6, Math.max(0.1, 0.1 + (s - 0.4) * 0.6)) });
    say(pick(NEAR_SAY.teeter), 1.2);
    return true;
  }

  // brushes: a piece just over his head (duck), or sliding/falling right past his face (lean away)
  function nearSense() {
    const C = S.climber, p = S.cur;
    if (!p || S.mode !== 'play') return false;
    const c0 = Math.floor((C.x - HW) / CELL), c1 = Math.floor((C.x + HW - 0.001) / CELL), headTop = C.y - BODYH;
    let duck = false, lean = 0;
    for (let pr = 0; pr < p.m.length; pr++) for (let pc = 0; pc < p.m.length; pc++) {
      if (!p.m[pr][pc]) continue;
      const r = p.y + pr, c = p.x + pc, top = r * CELL, bot = top + CELL;
      if (c >= c0 && c <= c1) { if (bot <= headTop + 0.5 && headTop - bot < 16) duck = true; }
      else if (bot > headTop + 4 && top < C.y - 4) {
        const gx = c < c0 ? (C.x - HW) - (c + 1) * CELL : c * CELL - (C.x + HW);
        if (gx >= 0 && gx < 9) lean = c < c0 ? -1 : 1;
      }
    }
    if (!duck && !lean) return false;
    if (threat()) return false;                   // it is coming down on him: the dodge handles that
    const R = C.react;
    if (R && (R.kind === 'duck' || R.kind === 'lean')) { R.hold = C.t + 0.25; return true; }
    if (R || Math.abs(C.vx) > 30 && !duck) return false;
    if (duck) nearStart('duck', { hold: C.t + 0.25 });
    else { C.f = lean; nearStart('lean', { hold: C.t + 0.25, piece: p }); }
    if (C.sayT <= 0 && Math.random() < 0.3) say(pick(SAY.small), 0.9);
    return true;
  }

  // ground-state hook: runs the current reaction; true = it owns this frame
  function nearGround(dt) {
    const C = S.climber;
    let R = C.react;
    if (R && C.t - R.lastT > 0.15) R = C.react = null;          // he left the ground in between: stale
    if ((!R || R.kind === 'duck' || R.kind === 'lean') && !C.alert) nearSense();
    R = C.react;
    if (!R) return false;
    R.lastT = C.t; R.t += dt;
    if (NEAR_SOFT.includes(R.kind)) {
      const th = threat();
      if (th && th.time < 1.6) { C.react = null; return false; }
    }
    if (R.vx) {
      const was = C.x;
      if (moveX(R.vx * dt)) R.vx = 0;
      R.vx *= Math.pow(R.drag, dt);
      if (Math.abs(R.vx) < 2) R.vx = 0;
      if (!supportUnder(C.x, C.y)) {
        if (R.kind === 'roll' || R.kind === 'slide' || R.kind === 'recover') { const v = R.vx; nearEnd(); toAir(); C.vx = v * 0.6; return true; }
        C.x = was;
        if (R.kind !== 'teeter' && !nearTeeter(R)) R.vx = 0;
        return true;
      }
      // shoved until his middle is out over a drop: he teeters there
      if (['flinch', 'hop', 'stagger'].includes(R.kind) && !solidB(Math.round(C.y / CELL), Math.floor(C.x / CELL)) && nearTeeter(R)) return true;
    }
    C.vx = 0;
    if (R.kind === 'watch') {
      const p = S.cur, at = p === R.piece && nearPieceAt(p);
      // keep an eye on it until it locks, unless it wanders off away from him
      if (!at || R.t > 4 || (R.t > 1.2 && Math.abs(at[0] - C.x) > 3.5 * CELL)) { nearEnd(); return true; }
      if (Math.abs(at[0] - C.x) > 4) C.f = Math.sign(at[0] - C.x);
      return true;
    }
    if (R.kind === 'duck' || R.kind === 'lean') {
      if (C.t > R.hold) nearEnd();
      return true;
    }
    if (R.t < R.dur) return true;
    // finished: chain into what comes next
    switch (R.kind) {
      case 'teeter':
        if (R.fall) {
          // over he goes, backwards: off the lip, and half the time his hands snag the ledge on the way down
          const E = nearEdge(C.x, R.dir), x = E === null ? C.x : E + R.dir * (HW + 0.5);
          nearEnd();
          if (boxFree(x, C.y)) C.x = x;
          toAir(); C.vy = 0;
          const snag = Math.random() < 0.5;
          C.vx = R.dir * (snag ? 4 : 45); C.wantGrab = snag;
          say(pick(NEAR_SAY.fell), 1.1); sfx('fall');
        } else {
          nearStart('recover', { vx: -R.dir * 50, drag: 0.01 });
          if (C.sayT <= 0.4) say(pick(NEAR_SAY.caught), 1.2);
        }
        return true;
      case 'bowl':
        nearEnd(); C.state = 'dazed'; C.dazedT = 0.6 + (R.s || 1) * 0.3;
        return true;
    }
    const next = R.next, piece = R.piece, at = R.at;
    nearEnd();
    if (next === 'watch') {
      if (S.cur && S.cur === piece) nearStart('watch', { piece });
      else if (at) { C.f = Math.sign(at[0] - C.x) || C.f; nearStart('glance', { at }); }   // it already landed: look back at it
    }
    else if (next) {
      nearStart(next, { piece, next: next === 'rollup' ? 'watch' : null });
      if (next === 'phew') say(pick(NEAR_SAY.phew), 1.4);
    }
    return true;
  }

  // which motion to show for the near reactions (null = leave the normal choice)
  function nearMotion(C) {
    if (C.state === 'air') {
      if (C.dive && C.t - C.dive.t0 < 1.5 && !C.tumble) return { name: C.dive.flat ? 'near_slidedive' : 'near_dive', t: C.t - C.dive.t0 };
      if (C.leap && C.t - C.leap.t0 < 1.5 && !C.tumble && C.vy < 200) return { name: 'near_leap', t: C.t - C.leap.t0 };
      return null;
    }
    if (C.state !== 'ground') return null;
    const R = C.react;
    if (R && C.t - R.lastT < 0.15) return { name: NEAR_MO[R.kind], t: M.loops(NEAR_MO[R.kind]) ? C.t : R.t };
    const A = C.alert;
    if (A) {
      if (A.t < A.react) return { name: 'near_startle', t: A.t };
      const it = C.intent;
      if (it && it.type === 'dodge') {
        if (A.t < A.react + 0.15 && Math.abs(it.x - C.x) > 8) return { name: 'near_burst', t: A.t - A.react };
        if (Math.abs(C.vx) > 70 && A.spd === DODGE) return { name: 'near_sprint', t: C.t, speed: Math.abs(C.vx) / 128 };
      }
    }
    return null;
  }
  // forward roll: spin the tucked pose once around its middle (worldPose pivots at 15px up)
  function nearRot(C) {
    const R = C.react;
    if (C.state !== 'ground' || !R || R.kind !== 'roll' || C.t - R.lastT > 0.15) return 0;
    return R.dir * Math.PI * 2 * Math.min(1, R.t / R.dur);
  }
  // aim his head at what he is watching (the falling piece, or the impact)
  function nearPose(P) {
    const C = S.climber, R = C.react;
    if (C.state !== 'ground' || !R || !['watch', 'lean', 'glance', 'skid'].includes(R.kind)) return;
    const at = R.kind === 'glance' ? R.at : S.cur && nearPieceAt(S.cur);
    if (!at) return;
    const nx = P.neck[0], ny = P.neck[1];
    const vx = P.head[0] - nx, vy = P.head[1] - ny, len = Math.hypot(vx, vy) || 1;
    let ux = at[0] - nx, uy = at[1] - ny;
    const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    if (ux * (P.f || 1) < -0.2) return;            // behind him: don't twist the head round
    const k = 0.6, dx = vx / len * (1 - k) + ux * k, dy = vy / len * (1 - k) + uy * k, dl = Math.hypot(dx, dy) || 1;
    P.head = [nx + dx / dl * len, ny + dy / dl * len];
  }
  // dust puffs and slam ripples (board coordinates)
  function drawNearFx(dt) {
    const L = S.nearFx;
    if (!L || !L.length) return;
    ctx.save();
    ctx.strokeStyle = T.muted; ctx.fillStyle = T.muted; ctx.lineWidth = 1.2;
    for (const q of L) {
      q.t += dt;
      const k = q.t / q.life;
      if (k >= 1) continue;
      if (q.k === 'puff') {
        q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= Math.pow(0.05, dt); q.vy *= Math.pow(0.2, dt);
        ctx.globalAlpha = 0.45 * (1 - k);
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 + k * 1.6), 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.globalAlpha = 0.7 * (1 - k);
        const rx = 6 + k * 60 * q.s, ry = 1.5 + k * 4;
        ctx.beginPath(); ctx.ellipse(q.x, q.y - 1, rx, ry, 0, Math.PI, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(q.x, q.y - 1, rx * 0.6, ry * 0.7, 0, Math.PI, Math.PI * 2); ctx.stroke();
      }
    }
    S.nearFx = L.filter(q => q.t < q.life);
    ctx.restore();
  }
  // faces: wide eyes, squeezed eyes, and a relieved puff of breath
  function drawNearFace(face, hx, hy, f) {
    ctx.beginPath();
    if (face === 'near_wide') {
      for (const ex of [-0.4, 3.6]) { ctx.moveTo(hx + ex * f + 1.6, hy - 1.4); ctx.arc(hx + ex * f, hy - 1.4, 1.6, 0, Math.PI * 2); }
      ctx.stroke();
      for (const ex of [-0.4, 3.6]) { ctx.beginPath(); ctx.arc(hx + ex * f + 0.3 * f, hy - 1.4, 0.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.arc(hx + 1.6 * f, hy + 2.8, 1.1, 0, Math.PI * 2); ctx.stroke();
    } else if (face === 'near_shut') {
      for (const ex of [0, 3.2]) { const x = hx + ex * f; ctx.moveTo(x - 1.3, hy - 2.4); ctx.lineTo(x + 0.2, hy - 1.4); ctx.lineTo(x - 1.3, hy - 0.4); }
      ctx.moveTo(hx + 0.2 * f, hy + 2.6); ctx.lineTo(hx + 1.2 * f, hy + 2); ctx.lineTo(hx + 2.2 * f, hy + 2.7); ctx.lineTo(hx + 3.2 * f, hy + 2.1);
      ctx.stroke();
    } else {
      for (const ex of [0, 3.2]) { const x = hx + ex * f; ctx.moveTo(x - 1.2, hy - 1.6); ctx.quadraticCurveTo(x, hy - 0.6, x + 1.2, hy - 1.6); }
      ctx.moveTo(hx + 2.6 * f, hy + 2.4); ctx.arc(hx + 1.8 * f, hy + 2.4, 0.8, 0, Math.PI * 2);
      ctx.stroke();
      // little breath clouds
      const k = (S.climber.t * 2) % 1;
      ctx.globalAlpha *= 1 - k;
      ctx.beginPath(); ctx.arc(hx + (6 + k * 5) * f, hy + 2 - k * 2, 1.2 + k, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx + (9.5 + k * 6) * f, hy + 0.5 - k * 3, 1.6 + k * 1.2, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // ---------- modes, worlds, climbers & scores ----------
  // Saved per player in this browser: chosen mode/world/climber, sound settings, stats that
  // unlock climbers, and local high scores. A shared board (everyone's bests) lights up when
  // the page runs where the claude.ai db capability is available.
  const store = {
    get(k, d) { try { const v = localStorage.getItem('stack-stumble-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('stack-stumble-' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const WORLDS = {
    garden: { name: 'Garden', blurb: 'Plain blocks, the classic climb.', special: null, rate: 0, hazard: 'lava' },
    ice: { name: 'Ice Caves', blurb: 'Icy blocks are slippery. He slides, slips and struggles to climb them.', special: 'ice', rate: 0.45, hazard: 'water' },
    wind: { name: 'Windy Peak', blurb: 'Gusts shove him around and nudge your falling piece.', special: null, rate: 0, wind: true, hazard: 'lava' },
    jelly: { name: 'Jelly Jungle', blurb: 'Jelly blocks are bouncy. Land on one and he springs up.', special: 'bouncy', rate: 0.4, hazard: 'water' },
    ruins: { name: 'Crumbling Ruins', blurb: 'Cracked blocks crumble a moment after he stands on them.', special: 'crumble', rate: 0.4, hazard: 'lava' },
  };
  const WORLD_IDS = Object.keys(WORLDS);
  const MODES = {
    classic: { name: 'Classic', hint: 'Keep him from reaching the top. Score points the Tetris way.' },
    escape: { name: 'Escape', hint: 'It is rising from below! Build him a way up and get him out the top before it catches him.' },
    daily: { name: 'Daily', hint: 'Today’s escape: the same world and the same pieces for everyone. New climb every day.' },
  };
  const CLIMBERS = [
    { id: 'stick', name: 'Stick', how: 'Ready from the start.', ok: () => true },
    { id: 'party', name: 'Party Animal', how: 'Play 5 games.', ok: s => s.games >= 5 },
    { id: 'hardhat', name: 'Hard Hat', how: 'Drill out 10 blocks.', ok: s => s.broken >= 10 },
    { id: 'ninja', name: 'Ninja', how: 'Dodge 20 falling pieces.', ok: s => s.dodges >= 20 },
    { id: 'diver', name: 'Diver', how: 'Escape the rising water once.', ok: s => s.waterEscapes >= 1 },
    { id: 'fire', name: 'Firefighter', how: 'Escape the lava 3 times.', ok: s => s.lavaEscapes >= 3 },
    { id: 'crown', name: 'King', how: 'Score 3,000 in Classic.', ok: s => s.classicBest >= 3000 },
    { id: 'astro', name: 'Astronaut', how: 'Play the Daily Challenge on 3 different days.', ok: s => (s.dailyDays || []).length >= 3 },
  ];
  const PREF = Object.assign({ mode: 'classic', world: 'garden', climber: 'stick', vol: 0.7, muted: false, music: true }, store.get('prefs', {}));
  const STATS = Object.assign({ games: 0, broken: 0, dodges: 0, waterEscapes: 0, lavaEscapes: 0, deaths: 0, classicBest: 0, dailyDays: [] }, store.get('stats', {}));
  const savePrefs = () => store.set('prefs', PREF);
  const unlockedIds = () => store.get('unlocked', ['stick']);
  if (!unlockedIds().includes(PREF.climber)) PREF.climber = 'stick';

  const dayKey = () => new Date().toISOString().slice(0, 10);
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) {
    return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // pieces and special blocks come from rng (seeded for the daily, so everyone gets the same climb)
  let rng = Math.random;
  function runRules() {
    if (PREF.mode === 'daily') {
      const d = dayKey();
      return { mode: 'daily', world: WORLD_IDS[hashStr('world' + d) % WORLD_IDS.length], hazard: true, seed: hashStr('daily' + d), day: d };
    }
    return { mode: PREF.mode, world: PREF.world, hazard: PREF.mode === 'escape' };
  }
  const wld = () => WORLDS[(S.run && S.run.world) || 'garden'];
  const specialFor = () => { const w = wld(); return w.special && rng() < w.rate ? w.special : 0; };

  // ----- special blocks -----
  const CRUMBLE_T = 1.5;
  const fxAt = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS ? (S.board[r][c] ? S.fx[r][c] : pieceHas(r, c) ? S.cur.fx || 0 : 0) : 0;
  // the block cells directly under his feet (empty when he is not standing)
  function feetCells() {
    const C = S.climber;
    if (!['ground', 'dazed', 'button'].includes(C.state) || Math.abs(C.y - Math.round(C.y / CELL) * CELL) > 0.6) return [];
    const r = Math.round(C.y / CELL), out = [];
    for (let c = Math.floor((C.x - HW) / CELL); c <= Math.floor((C.x + HW - 0.001) / CELL); c++) if (r < ROWS && solid(r, c) && c >= 0 && c < COLS) out.push([r, c]);
    return out;
  }
  const onFx = kind => feetCells().some(([r, c]) => fxAt(r, c) === kind);
  const iceGrip = () => (wld().special === 'ice' && onFx('ice') ? 0.16 : 1);
  function climbGrip() {
    const C = S.climber;
    if (wld().special !== 'ice' || C.state !== 'climb') return 1;
    return fxAt(Math.floor((C.y - 1) / CELL), C.climbCol) === 'ice' ? 0.55 : 1;
  }
  function crumbleCell(r, c) {
    addParts(colX(c), r * CELL + CELL / 2, T.p[S.board[r][c]] || T.ink, 12, 120);
    addParts(colX(c), r * CELL + CELL / 2, T.muted, 6, 80);
    S.board[r][c] = 0; S.ids[r][c] = 0; S.crk[r][c] = 0; S.fx[r][c] = 0; S.crm[r][c] = 0;
    S.shake = Math.min(12, S.shake + 2.5); sfx('crumble');
    const C = S.climber; if (C.sayT <= 0 && Math.random() < 0.6) say(pick(['Whoa, it’s crumbling!', 'Not these blocks…', 'Ruins. Great.']), 1.3);
  }
  // land on a jelly block from a height and he springs back up
  function bounceOff() {
    const C = S.climber, fall = C.y - C.fallFrom;
    if (wld().special !== 'bouncy' || fall < 10 || C.state === 'dead') return false;
    const cells = feetCells().filter(([r, c]) => fxAt(r, c) === 'bouncy');
    if (!cells.length) return false;
    const v = Math.sqrt(2 * G * fall);
    for (const [r, c] of cells) S.jelly[r * COLS + c] = 0.6;
    C.state = 'air'; C.fallFrom = C.y; C.airT = 0; C.tumble = false; C.rot = 0; C.wantGrab = true;
    C.vy = -Math.min(JV * 1.18, v * 0.85 + 240); C.vx *= 0.8; C.bounceT = 0.75;
    animSquash(0.35); sfx('boing');
    if (C.sayT <= 0 && Math.random() < 0.5) say(pick(['Boing!', 'Wheee!', 'Jelly!']), 1);
    return true;
  }

  // ----- wind -----
  function windTick(dt) {
    const Wd = S.wind, C = S.climber;
    if (!Wd.on) {
      Wd.next -= dt;
      if (Wd.next <= 0) { Wd.on = true; Wd.t = 2.6; Wd.dir = rng() < 0.5 ? -1 : 1; Wd.nudge = 0.25; sfx('whoosh'); if (C.sayT <= 0) say(pick(['Hold on to your hat!', 'Windy!', 'Whoa, gust!']), 1.3); }
      return;
    }
    Wd.t -= dt; Wd.phase = (Wd.phase || 0) + dt;
    if (C.state === 'air' && !C.tumble) C.vx += Wd.dir * 170 * dt;
    else if (C.state === 'ground' && !C.alert) {
      moveX(Wd.dir * 15 * dt); C.windT = 0.3;
      if (!supportUnder(C.x, C.y)) toAir();
    }
    Wd.nudge -= dt;
    if (Wd.nudge <= 0) { Wd.nudge = 0.9; if (S.cur && !S.slam) move(Wd.dir); }
    if (Wd.t <= 0) { Wd.on = false; Wd.next = 6 + rng() * 5; }
  }

  // ----- the rising lava / water -----
  const HAZ_SAY = { lava: ['Hot hot HOT!', 'The floor is lava! Literally!', 'Build faster!', 'My shoes are melting!'],
                    water: ['I can’t swim!', 'Water’s rising!', 'Glub—', 'Up! Up! Up!'] };
  const DEATH_SAY = { lava: ['YEOUCH!', 'HOT HOT HOT—'], water: ['Glub glub…', 'Should’ve learned to swim…'], swoon: ['Oh no…', 'My tower…'] };
  function hazTick(dt) {
    const h = S.haz, C = S.climber;
    if (h.delay > 0) h.delay -= dt;
    else h.y = Math.max(-60, h.y - Math.min(6, 1.4 + S.time * 0.012) * dt);   // slow at first, then it speeds up
    h.phase = (h.phase || 0) + dt;
    if (!['dead', 'win'].includes(C.state) && C.y > h.y + 8) die(h.kind);
    else if (C.y > h.y - 2 * CELL && C.sayT <= -1 && Math.random() < dt * 0.6) say(pick(HAZ_SAY[h.kind]), 1.4);
  }
  function die(kind) {
    const C = S.climber;
    if (C.state === 'dead' || C.state === 'win') return;
    Object.assign(C, { state: 'dead', deathKind: kind, deathAt: C.t, vx: 0, vy: 0, anchor: null, alert: null, intent: null,
                       tumble: false, rot: 0, pp: null, rec: null });
    STATS.deaths++;
    sfx(kind === 'water' ? 'splash' : kind === 'lava' ? 'sizzle' : 'faint');
    grunt(kind === 'swoon' ? 'aww' : 'yelp');
    say(pick(DEATH_SAY[kind]), 2);
  }
  function deadTick(dt) {
    const C = S.climber, T0 = C.t - C.deathAt;
    if (C.deathKind === 'water') C.y += 13 * dt;
    if (C.deathKind === 'lava' && T0 > 0.3 && Math.random() < dt * 14) S.smoke.push({ x: C.x + (Math.random() - 0.5) * 10, y: C.y - 20, r: 3, life: 1.2 });
    if (T0 > 2.5 && S.mode === 'play') gameOver('dead');
  }

  // ----- personality: one-shot moves he plays on the ground (C.pp) -----
  const PP_DUR = { pp_scratch: 1.6, pp_stretch: 1.9, pp_slip: 0.9, pp_jumpScare: 0.6, pp_pant: 1.6, pp_fistPump: 0.8, pp_trip: 0.8,
                   pp_kipUp: 1.0, pp_stomp: 0.9, pp_rubHead: 1.2, pp_huff: 1.6, pp_kickBlock: 1.8, pp_flail: 1.3, pp_tantrum: 2.2 };
  function startPP(name, o = {}) {
    const C = S.climber;
    C.pp = { name, t0: C.t, until: C.t + (o.dur || PP_DUR[name] || 1), slide: !!o.slide, then: o.then || null };
  }
  // runs in the ground state; true while the move holds him in place
  function ppTick(dt) {
    const C = S.climber, p = C.pp;
    if (!p) return false;
    if (C.alert || C.t >= p.until) {
      C.pp = null;
      if (!C.alert && p.then === 'kipUp') { startPP('pp_kipUp'); grunt('hup'); return true; }
      return false;
    }
    if (p.slide) { moveX(C.vx * dt); C.vx *= Math.pow(0.3, dt); if (!supportUnder(C.x, C.y)) { C.pp = null; toAir(); } }
    else C.vx *= Math.pow(0.02, dt);
    return true;
  }
  const idleOnGround = C => C.state === 'ground' && !C.pp && !C.alert && !C.rec && !C.shove && Math.abs(C.vx) < 6 && C.crouchT <= 0 &&
                            (!C.intent || C.intent.type === 'idle' || C.intent.type === 'wait');
  function pickMood(C) {
    const m = ['idle', 'idle', 'lookUp', 'pp_whistle', 'wave'];
    if (S.cur && Math.abs(colX(S.cur.x + 1) - C.x) < 3 * CELL) m.push('pp_pointUp', 'pp_pointUp');
    if ((C.idleT || 0) > 5) m.push('pp_tapFoot', 'pp_sit', 'pp_sit');
    if (idleOnGround(C) && Math.random() < 0.35) startPP(pick(['pp_scratch', 'pp_stretch', 'pp_scratch']));
    return pick(m);
  }
  // a drop right beside his feet: -1 / 1, or 0
  function edgeDir() {
    const C = S.climber, r = Math.round(C.y / CELL);
    if (r >= ROWS) return 0;
    if (!solid(r, Math.floor((C.x + HW + 3) / CELL)) && Math.floor((C.x + HW + 3) / CELL) < COLS) return 1;
    if (!solid(r, Math.floor((C.x - HW - 3) / CELL)) && Math.floor((C.x - HW - 3) / CELL) >= 0) return -1;
    return 0;
  }
  // the anger ladder while boxed in: annoyed huff, kicking the blocks, flailing, a full tantrum
  const MAD_SAY = [['Hmph.', 'Seriously?', 'Ugh.'], ['Let. Me. OUT!', 'Stupid blocks!', 'Move!'],
                   ['ARGH!', 'This is SO unfair!', 'GRRR!'], ['WAAAAH!', 'I hate this game!', 'Not fair not fair not fair!']];
  function madTier(C) { const s = C.stuckClock || 0; return s < 3 ? -1 : s < 8 ? 0 : s < 13 ? 1 : s < 18 ? 2 : 3; }
  function tantrumStep(C) {
    const tier = madTier(C);
    if (tier < 0 || C.pp) return false;
    const name = ['pp_huff', 'pp_kickBlock', 'pp_flail', 'pp_tantrum'][tier];
    if (name === 'pp_kickBlock') {
      // face the nearest block to kick
      const r = Math.round(C.y / CELL), c = Math.floor(C.x / CELL);
      C.f = solidB(r - 1, c + 1) ? 1 : solidB(r - 1, c - 1) ? -1 : C.f;
    }
    startPP(name);
    grunt(tier >= 2 ? 'rage' : 'grr');
    if (C.sayT <= 0 || tier >= 2) say(pick(MAD_SAY[tier]), 1.4);
    return true;
  }
  // after a hit: once he is back on his feet, sometimes stomp or rub his head
  function angerAfterHit(C) {
    if (!C.angry || !idleOnGround(C)) return;
    const kind = C.angry; C.angry = null;
    if (Math.random() < 0.65) {
      startPP(kind === 'squash' ? pick(['pp_rubHead', 'pp_stomp']) : pick(['pp_stomp', 'pp_stomp', 'pp_rubHead']));
      grunt('grr');
      if (C.sayT <= 0) say(pick(['HEY!', 'Ow! Watch it!', 'That’s it, I’m mad.', 'Do you MIND?!']), 1.3);
    }
  }

  // ----- per-frame world rules and personality, called in play after updateClimber -----
  function worldTick(dt) {
    const C = S.climber, w = wld();
    if (w.special === 'crumble') {
      for (const [r, c] of feetCells()) {
        if (S.board[r][c] && S.fx[r][c] === 'crumble') {
          if (S.crm[r][c] === 0) sfx('creak');
          S.crm[r][c] += dt;
          if (S.crm[r][c] >= CRUMBLE_T) crumbleCell(r, c);
        }
      }
    }
    if (w.wind) windTick(dt);
    if (S.haz) hazTick(dt);
    if (C.state === 'dead') { deadTick(dt); return; }
    for (const k in S.jelly) { S.jelly[k] -= dt; if (S.jelly[k] <= 0) delete S.jelly[k]; }
    if (C.bounceT > 0) C.bounceT -= dt;
    if (C.windT > 0) C.windT -= dt;
    // slipping on ice while walking
    if (w.special === 'ice' && C.state === 'ground' && !C.pp && !C.alert && Math.abs(C.vx) > 28 && onFx('ice') && Math.random() < dt * 0.7) {
      startPP('pp_slip', { slide: true, then: Math.random() < 0.5 ? 'kipUp' : null });
      grunt('yelp'); if (C.sayT <= 0) say(pick(['Whoa—!', 'Slippery!', 'Ice. Why ice.']), 1.1);
    }
    // ice faces: his hands slip now and then
    if (C.state === 'climb' && climbGrip() < 1 && Math.random() < dt * 0.35 && boxFree(C.x, C.y + 10)) { C.y += 10; grunt('yelp'); }
    // effort: climbing and sprinting tire him out; once he stops he catches his breath
    if (C.state === 'climb') C.exert = (C.exert || 0) + 26 * dt;
    else if (C.state === 'ground' && Math.abs(C.vx) > 80) C.exert = (C.exert || 0) + 22 * dt;
    else C.exert = Math.max(0, (C.exert || 0) - 6 * dt);
    if (C.exert > 70 && idleOnGround(C)) { C.exert = 0; startPP('pp_pant'); grunt('pant'); }
    // a little celebration every 20 m he climbs
    const tier = Math.floor(C.peak / 20);
    if (tier > (C.cheered || 0) && idleOnGround(C)) { C.cheered = tier; startPP('pp_fistPump'); grunt('woo'); if (C.sayT <= 0) say(pick(['Woo!', `${tier * 20} m!`, 'Getting there!']), 1.2); }
    // the odd trip while walking
    if (C.state === 'ground' && !C.pp && !C.alert && Math.abs(C.vx) > 40 && Math.random() < dt * 0.05) { startPP('pp_trip', { slide: true }); grunt('oof'); }
    // a hit makes him angry once he is back up
    if (['squash', 'dazed'].includes(C.state)) C.angry = C.state;
    angerAfterHit(C);
    // climbing grunts
    if (C.state === 'climb') { C.gruntT = (C.gruntT || 0) - dt; if (C.gruntT <= 0) { C.gruntT = 0.8 + Math.random() * 0.6; if (Math.random() < 0.5) grunt('hnn'); } }
  }

  // ----- climbers (cosmetic outfits) -----
  function checkUnlocks() {
    const have = unlockedIds(), fresh = [];
    for (const k of CLIMBERS) if (!have.includes(k.id) && k.ok(STATS)) { have.push(k.id); fresh.push(k.name); }
    if (fresh.length) store.set('unlocked', have);
    return fresh;
  }
  function drawOutfit(P, f) {
    const id = PREF.climber;
    if (id === 'stick') return;
    const [hx, hy] = P.head, nx = P.neck[0], ny = P.neck[1];
    // head axis: from neck to head, so hats tilt with him
    let ux = hx - nx, uy = hy - ny; const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
    const px = -uy * f, py = ux * f;                         // sideways, toward his face
    const top = [hx + ux * 6.5, hy + uy * 6.5];
    ctx.save(); ctx.lineWidth = 1.4; ctx.strokeStyle = T.ink; ctx.lineJoin = 'round';
    const poly = (pts, fill) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
    const at = (a, s) => [hx + ux * a + px * s, hy + uy * a + py * s];
    if (id === 'party') {
      poly([at(5, -4.5), at(5, 4.5), at(17, 1.5)], '#e94b8a');
      ctx.strokeStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(...at(9, -3.2)); ctx.lineTo(...at(9, 3.8)); ctx.moveTo(...at(13, -1.8)); ctx.lineTo(...at(13, 2.8)); ctx.stroke();
      ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(...at(18, 1.6), 2.2, 0, 7); ctx.fill();
    } else if (id === 'hardhat') {
      poly([at(3, -8.5), at(3, 9.5), at(5, 7), at(9.5, 4), at(10, -2), at(7, -6.5), at(5, -7)], '#f2c230');
    } else if (id === 'ninja') {
      ctx.strokeStyle = '#d8323c'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(...at(2.5, -6.6)); ctx.lineTo(...at(2.5, 6.6)); ctx.stroke();
      const wv = Math.sin(S.climber.t * 9);
      ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(...at(2.5, -6.5)); ctx.quadraticCurveTo(...at(4 + wv * 2, -12), ...at(1 + wv * 3, -17)); ctx.moveTo(...at(2, -6.5)); ctx.quadraticCurveTo(...at(-1 - wv, -11), ...at(-3 - wv * 2, -15)); ctx.stroke();
    } else if (id === 'diver') {
      ctx.fillStyle = 'rgba(120,200,240,0.55)';
      ctx.beginPath(); ctx.arc(...at(1.2, 3.6), 3, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...at(1.2, 0.6)); ctx.lineTo(...at(1.2, -6.5)); ctx.stroke();
      ctx.strokeStyle = '#f2852f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...at(-3, 5)); ctx.lineTo(...at(-3, 8)); ctx.lineTo(...at(9, 8)); ctx.stroke();
    } else if (id === 'fire') {
      poly([at(2, -11), at(3, 7.5), at(6.5, 6), at(10.5, 1), at(9.5, -5), at(5, -8.5)], '#d8323c');
      ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(...at(7, 3.5), 1.8, 0, 7); ctx.fill();
    } else if (id === 'crown') {
      poly([at(5, -5.5), at(5, 5.5), at(11.5, 6), at(8.5, 3), at(11.5, 0), at(8.5, -3), at(11.5, -6)], '#f2c230');
    } else if (id === 'astro') {
      ctx.fillStyle = 'rgba(150,210,255,0.22)';
      ctx.beginPath(); ctx.arc(hx, hy, 10.5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(hx + px * 3, hy + py * 3 - 3, 5.5, -2.4, -1.3); ctx.stroke();
      ctx.strokeStyle = T.ink; ctx.beginPath(); ctx.moveTo(...at(10.5, -3)); ctx.lineTo(...at(15, -5)); ctx.stroke();
      ctx.fillStyle = T.accent; ctx.beginPath(); ctx.arc(...at(15.5, -5.2), 1.6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ----- drawing the world extras -----
  function drawFx(x, y, kind, seed, r, c) {
    ctx.save();
    if (kind === 'ice') {
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#e8f6ff'; ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
      ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x + 6, y + 9); ctx.lineTo(x + 11, y + 5); ctx.moveTo(x + 9, y + 15); ctx.lineTo(x + 18, y + 7); ctx.stroke();
      ctx.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 4 + hash(seed + i) * 18, y + 2, 2, 2);
    } else if (kind === 'bouncy') {
      const j = S.jelly[r * COLS + c] || 0, k = j > 0 ? Math.sin(j * 30) * j * 0.25 : 0;
      ctx.translate(x + CELL / 2, y + CELL); ctx.scale(1 + k, 1 - k); ctx.translate(-x - CELL / 2, -y - CELL);
      ctx.globalAlpha = 0.45; ctx.fillStyle = '#ff8fd0';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 4, 8); else ctx.rect(x + 2, y + 2, CELL - 4, CELL - 4); ctx.fill();
      ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(x + 9, y + 8, 4, 2.4, -0.5, 0, 7); ctx.fill();
    } else if (kind === 'crumble') {
      const p = S.crm[r] ? S.crm[r][c] || 0 : 0;
      ctx.globalAlpha = 0.35; ctx.fillStyle = T.ink;
      for (let i = 0; i < 5; i++) ctx.fillRect(x + 3 + hash(seed * 3 + i) * 20, y + 3 + hash(seed * 7 + i) * 20, 2, 2);
      ctx.globalAlpha = 1;
      drawCracks(x + (p ? (Math.random() - 0.5) * p * 2 : 0), y, 0.15 + Math.min(1, p / CRUMBLE_T) * 0.85, seed);
    }
    ctx.restore();
  }
  function drawHazard(t) {
    const h = S.haz;
    if (!h || h.y > BH + 4) return;
    const lava = h.kind === 'lava';
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, BH + 30);
    for (let x = 0; x <= BW; x += 7) ctx.lineTo(x, h.y + Math.sin(x * 0.07 + t * (lava ? 2.2 : 3.4)) * (lava ? 2 : 3));
    ctx.lineTo(BW, BH + 30); ctx.closePath();
    const g = ctx.createLinearGradient(0, h.y, 0, h.y + 120);
    if (lava) { g.addColorStop(0, 'rgba(255,170,40,0.95)'); g.addColorStop(0.25, 'rgba(232,72,26,0.92)'); g.addColorStop(1, 'rgba(150,20,10,0.95)'); }
    else { g.addColorStop(0, 'rgba(120,200,240,0.62)'); g.addColorStop(1, 'rgba(30,90,170,0.82)'); }
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = lava ? '#ffe08a' : 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();
    // bubbles
    ctx.fillStyle = lava ? 'rgba(255,220,120,0.9)' : 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 7; i++) {
      const bx = (hash(i * 13) * BW + t * 9 * (i % 2 ? 1 : -1) + BW) % BW, ph = (t * 0.6 + hash(i * 5)) % 1;
      const by = h.y + 40 - ph * 40;
      if (by > h.y + 2) { ctx.beginPath(); ctx.arc(bx, by, 1.5 + hash(i) * 2, 0, 7); ctx.fill(); }
    }
    ctx.restore();
    // warning arrow on the ruler is drawn by drawRuler
  }
  function drawWind(t) {
    const Wd = S.wind;
    if (!Wd || !Wd.on) return;
    ctx.save(); ctx.strokeStyle = T.muted; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const y = hash(i * 9) * BH, len = 18 + hash(i * 3) * 26, sp = 260 + hash(i * 7) * 160;
      let x = ((t * sp + hash(i) * 800) % (BW + 120)) - 60;
      if (Wd.dir < 0) x = BW - x;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - Wd.dir * len / 2, y - 3, x - Wd.dir * len, y); ctx.stroke();
    }
    ctx.restore();
  }
  function drawSmoke(dt) {
    if (!S.smoke.length) return;
    ctx.save(); ctx.fillStyle = T.muted;
    for (const q of S.smoke) { q.y -= 22 * dt; q.r += 6 * dt; q.life -= dt; ctx.globalAlpha = Math.max(0, q.life * 0.4); ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); }
    S.smoke = S.smoke.filter(q => q.life > 0);
    ctx.restore();
  }
  // landing dust under freshly locked cells, and a sparkle burst along cleared rows
  function lockDust(cells, hard) {
    for (const [r, c] of cells) {
      if (r + 1 < ROWS && S.board[r + 1][c] && !cells.some(([rr, cc]) => rr === r + 1 && cc === c) || r + 1 === ROWS) {
        for (const s of [-1, 1]) S.puff.push({ x: colX(c) + s * 10, y: (r + 1) * CELL, vx: s * (20 + Math.random() * 30) * (hard ? 1.6 : 1), r: 2.5, life: 0.45 });
      }
    }
  }
  function drawPuffs(dt) {
    if (!S.puff.length) return;
    ctx.save(); ctx.fillStyle = T.wallInk;
    for (const q of S.puff) { q.x += q.vx * dt; q.vx *= Math.pow(0.05, dt); q.y -= 6 * dt; q.r += 9 * dt; q.life -= dt; ctx.globalAlpha = Math.max(0, q.life * 1.3); ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); }
    S.puff = S.puff.filter(q => q.life > 0);
    ctx.restore();
  }

  // ----- high scores: this browser, plus everyone's bests when the shared board is available -----
  const scoreKey = run => run.mode === 'daily' ? 'daily:' + run.day : run.mode;
  function localScores(key) { return (store.get('scores', {})[key] || []); }
  function recordScore(run, score) {
    const all = store.get('scores', {}), key = scoreKey(run);
    const row = { s: score, w: run.world, c: PREF.climber, d: Date.now() };
    const list = (all[key] || []).concat([row]).sort((a, b) => b.s - a.s).slice(0, 10);
    all[key] = list; store.set('scores', all);
    return list.indexOf(row) + 1;
  }
  const shared = { db: null, user: null, me: null, tried: false };
  async function sharedInit() {
    if (shared.tried) return shared.db;
    shared.tried = true;
    try {
      if (!window.claude || !window.claude.use) return null;
      shared.db = await window.claude.use('db');
      shared.user = await window.claude.use('user');
      shared.me = shared.user ? await shared.user.id() : null;
    } catch (e) { shared.db = null; }
    return shared.db;
  }
  async function submitShared(run, score) {
    try {
      if (!(await sharedInit()) || !shared.me) return;
      const ref = shared.db.doc('scores/' + shared.me);
      const snap = await ref.get();
      const cur = snap.exists ? JSON.parse(JSON.stringify(snap.data() || {})) : {};
      const k = run.mode, prev = cur[k];
      const better = !prev || score > prev.s || (k === 'daily' && prev.day !== run.day);
      if (!better) return;
      cur[k] = { s: score, w: run.world, c: PREF.climber, at: Date.now() };
      if (k === 'daily') cur[k].day = run.day;
      await ref.set(cur);
    } catch (e) { /* the shared board is optional */ }
  }
  async function loadShared(mode) {
    if (!(await sharedInit())) return { note: 'The shared board appears when this game is opened on claude.ai.' };
    try {
      const snap = await Promise.race([shared.db.collection('scores').limit(500).get(), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 10000))]);
      const today = dayKey();
      const rows = snap.docs.map(d => ({ id: d.id, e: (d.data() || {})[mode] })).filter(x => x.e && typeof x.e.s === 'number' && (mode !== 'daily' || x.e.day === today))
        .sort((a, b) => b.e.s - a.e.s).slice(0, 10);
      let names = {};
      if (shared.user && rows.length) { try { names = await shared.user.profiles(rows.map(r => r.id)); } catch (e) { names = {}; } }
      return { rows: rows.map(r => ({ s: r.e.s, w: r.e.w, c: r.e.c, who: r.id === shared.me ? 'You' : ((names[r.id] && names[r.id].name) || 'Someone') })) };
    } catch (e) { return { note: 'Couldn’t reach the shared board right now.' }; }
  }

  // ----- menu, result and score panels -----
  const panels = { menu: $('menu'), result: $('result'), scores: $('scores') };
  function showPanel(name) {
    for (const k in panels) panels[k].hidden = k !== name;
    overlay.hidden = false;
    const focus = { menu: $('playBtn'), result: ovBtn, scores: $('scoresBack') }[name];
    try { focus.focus({ preventScroll: true }); } catch (e) {}
  }
  function chip(label, pressed, onClick, cls) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    if (cls) b.className = cls;
    b.addEventListener('click', onClick);
    return b;
  }
  function renderMenu() {
    const segs = $('modeSeg'); segs.replaceChildren();
    for (const m in MODES) segs.append(chip(MODES[m].name, PREF.mode === m, () => { PREF.mode = m; savePrefs(); renderMenu(); }));
    $('modeHint').textContent = MODES[PREF.mode].hint;
    const wc = $('worldChips'); wc.replaceChildren();
    if (PREF.mode === 'daily') {
      const d = runRules();
      wc.append(chip('Today: ' + WORLDS[d.world].name, true, () => {}));
      $('worldHint').textContent = WORLDS[d.world].blurb;
    } else {
      for (const w of WORLD_IDS) wc.append(chip(WORLDS[w].name, PREF.world === w, () => { PREF.world = w; savePrefs(); renderMenu(); }));
      $('worldHint').textContent = WORLDS[PREF.world].blurb;
    }
    const cc = $('climberChips'); cc.replaceChildren();
    const have = unlockedIds();
    for (const k of CLIMBERS) {
      const open = have.includes(k.id);
      cc.append(chip(k.name, PREF.climber === k.id, () => {
        if (open) { PREF.climber = k.id; savePrefs(); renderMenu(); }
        else $('climberHint').textContent = `${k.name} is locked. ${k.how}`;
      }, open ? '' : 'locked'));
    }
    $('climberHint').textContent = `${have.length} of ${CLIMBERS.length} climbers unlocked.`;
    best = (localScores(scoreKey(runRules()))[0] || { s: 0 }).s;
  }
  function showMenu() {
    S = newState();
    S.climber.sayText = 'Hey! Down there!'; S.climber.sayT = 999;
    rng = Math.random;
    renderMenu(); showPanel('menu'); drawMinis();
  }
  async function showScores(mode) {
    showPanel('scores');
    const seg = $('scoreSeg'); seg.replaceChildren();
    for (const m of ['classic', 'escape', 'daily']) seg.append(chip(m === 'daily' ? 'Today’s daily' : MODES[m].name, m === mode, () => showScores(m)));
    const fill = (ol, rows, empty) => {
      ol.replaceChildren();
      if (!rows.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = empty; ol.append(li); return; }
      for (const r of rows) {
        const li = document.createElement('li');
        const who = r.who ? r.who + ' · ' : '';
        li.textContent = `${r.s.toLocaleString()} — ${who}${(WORLDS[r.w] || {}).name || ''}`;
        ol.append(li);
      }
    };
    const key = mode === 'daily' ? 'daily:' + dayKey() : mode;
    fill($('scoreMine'), localScores(key).slice(0, 5), 'No scores yet. Go play!');
    $('scoreAllNote').textContent = 'Loading…';
    $('scoreAll').replaceChildren();
    const res = await loadShared(mode);
    if (panels.scores.hidden) return;
    $('scoreAllNote').textContent = res.note || (res.rows.length ? '' : 'Nobody on the board yet. Be the first!');
    if (res.rows) fill($('scoreAll'), res.rows, 'Nobody on the board yet.');
  }
  $('playBtn').addEventListener('click', () => startGame());
  $('scoresBtn').addEventListener('click', () => showScores(PREF.mode));
  $('menuBtn').addEventListener('click', () => { setMusicFor(); showMenu(); });
  $('scoresBtn2').addEventListener('click', () => showScores((S.run && S.run.mode) || PREF.mode));
  $('scoresBack').addEventListener('click', () => (S.mode === 'over' ? showPanel('result') : showMenu()));

  // ---------- game flow ----------
  function startGame() {
    S = newState();
    S.run = runRules();
    rng = S.run.seed != null ? mulberry(S.run.seed) : Math.random;
    S.mode = 'play';
    S.climber.state = 'ground';
    if (S.run.hazard) S.haz = { kind: wld().hazard, y: BH + 20, delay: 10 };
    if (wld().wind) S.wind = { on: false, next: 4 + rng() * 3, t: 0, dir: 1, nudge: 0 };
    STATS.games++;
    if (S.run.mode === 'daily' && !STATS.dailyDays.includes(S.run.day)) STATS.dailyDays = STATS.dailyDays.concat([S.run.day]).slice(-60);
    store.set('stats', STATS);
    best = (localScores(scoreKey(S.run))[0] || { s: 0 }).s;
    refill(); spawn();
    say(S.run.hazard ? pick(['Get me out of here!', 'Build me some stairs!', 'Is it getting warm in here?']) : pick(SAY.start), 1.8);
    overlay.hidden = true;
    for (const k in panels) panels[k].hidden = true;
    $('pauseBtn').textContent = 'Pause';
    initAudio(); setMusicFor();
  }
  function setPaused(p) {
    if (S.mode === 'intro' || S.mode === 'over') return;
    S.mode = p ? 'paused' : 'play';
    $('pauseBtn').textContent = p ? 'Resume' : 'Pause';
    if (p) showCard('Paused.', 'He is hanging on. Take a breath.', 'Resume', false);
    else overlay.hidden = true;
  }
  function gameOver(kind) {
    if (S.mode === 'over') return;
    S.mode = 'over'; S.result = kind;
    const C = S.climber, run = S.run || runRules(), esc = run.hazard;
    if (kind === 'topout' && C.state !== 'win' && C.state !== 'dead') {
      Object.assign(C, { state: 'dead', deathKind: 'swoon', deathAt: C.t, anchor: null, alert: null, pp: null, rec: null, react: null, tumble: false, rot: 0 });
      grunt('aww');
    }
    const escaped = kind === 'win';
    const bonus = esc && escaped ? 1000 + Math.max(0, 4000 - Math.round(S.time) * 20) : 0;
    const final = S.score + (esc ? C.peak * 10 : 0) + bonus;
    S.final = final;
    if (esc && escaped) STATS[wld().hazard === 'water' ? 'waterEscapes' : 'lavaEscapes']++;
    if (run.mode === 'classic') STATS.classicBest = Math.max(STATS.classicBest, final);
    store.set('stats', STATS);
    const fresh = checkUnlocks();
    const rank = recordScore(run, final);
    submitShared(run, final);
    best = Math.max(best, final);
    const when = `${Math.floor(S.time / 60)}:${String(Math.floor(S.time % 60)).padStart(2, '0')}`;
    const tag = run.mode === 'daily' ? `Daily ${run.day}, ${wld().name}. ` : '';
    const rankTxt = rank === 1 ? ' New best!' : rank && rank <= 5 ? ` That’s #${rank} on your board.` : '';
    const pts = final.toLocaleString();
    let title, text;
    if (!esc) {
      if (escaped) { title = 'You lose.'; text = `He made it to the top in ${when} and he is dancing about it. Score: ${pts}.${rankTxt}`; }
      else {
        sfx('over'); title = 'Your stack hit the ceiling.';
        text = `${C.peak < 5 ? 'He never got off the floor' : `He never got out (his best was ${C.peak} m)`}, but your tower toppled anyway. Score: ${pts}.${rankTxt}`;
      }
    } else if (escaped) {
      title = 'He escaped! You win.';
      text = `${tag}You got him out in ${when}. Score: ${pts}, with a ${bonus.toLocaleString()} escape bonus.${rankTxt}`;
    } else if (kind === 'dead') {
      sfx('over');
      title = S.haz && S.haz.kind === 'water' ? 'The water got him.' : 'The lava got him.';
      text = `${tag}He made it to ${C.peak} m. Score: ${pts}.${rankTxt} Build him stairs faster, and don’t knock him into it!`;
    } else {
      sfx('over'); title = 'Your stack hit the ceiling.';
      text = `${tag}He was at ${C.peak} m. Score: ${pts}.${rankTxt}`;
    }
    showCard(title, text, 'Play again', false);
    const ul = $('ovUnlock');
    if (fresh.length) { ul.textContent = `New climber unlocked: ${fresh.join(', ')}! Pick it in the menu.`; ul.hidden = false; setTimeout(() => sfx('unlock'), 700); }
    $('pauseBtn').textContent = 'Pause';
  }
  function showCard(title, text, btn) {
    ovTitle.textContent = title; ovText.textContent = text; ovBtn.textContent = btn;
    $('ovUnlock').hidden = true;
    showPanel('result');
  }
  ovBtn.addEventListener('click', () => {
    if (S.mode === 'paused') setPaused(false);
    else startGame();
  });
  $('pauseBtn').addEventListener('click', e => { setPaused(S.mode === 'play'); e.currentTarget.blur(); });

  // ---------- input ----------
  const held = {};
  const DAS = 0.16, ARR = 0.05, SOFT = 0.035;
  function press(act) {
    initAudio();
    if (S.mode !== 'play' || S.climber.state === 'win' || !S.cur || S.slam) return;
    switch (act) {
      case 'left': move(-1); held.left = { t: 0, r: 0 }; delete held.right; break;
      case 'right': move(1); held.right = { t: 0, r: 0 }; delete held.left; break;
      case 'soft': softStep(); held.soft = { t: 0, r: 0 }; break;
      case 'rotate': rotate(1); break;
      case 'ccw': rotate(-1); break;
      case 'hard': hardDrop(); break;
      case 'hold': holdPiece(); break;
    }
  }
  function release(act) { delete held[act]; }
  function updateHeld(dt) {
    for (const act of ['left', 'right']) {
      const h = held[act]; if (!h) continue;
      h.t += dt;
      if (h.t > DAS) { h.r += dt; while (h.r >= ARR && S.cur) { h.r -= ARR; move(act === 'left' ? -1 : 1); } }
    }
    if (held.soft) { held.soft.r += dt; while (held.soft.r >= SOFT && S.cur) { held.soft.r -= SOFT; softStep(); } }
  }
  const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'soft', ArrowUp: 'rotate', KeyX: 'rotate',
                   KeyZ: 'ccw', Space: 'hard', KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold' };
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyP' || e.code === 'Escape') { e.preventDefault(); setPaused(S.mode === 'play'); return; }
    if (e.code === 'Enter' && (S.mode === 'intro' || S.mode === 'over')) { e.preventDefault(); startGame(); return; }
    const act = KEYMAP[e.code];
    if (!act) return;
    e.preventDefault();
    if (e.repeat) return;
    press(act);
  });
  window.addEventListener('keyup', e => { const act = KEYMAP[e.code]; if (act) release(act); });
  window.addEventListener('blur', () => { for (const k in held) delete held[k]; });
  for (const b of document.querySelectorAll('#pad button')) {
    const act = b.dataset.act;
    b.addEventListener('pointerdown', e => { e.preventDefault(); press(act); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => release(act));
    b.addEventListener('contextmenu', e => e.preventDefault());
  }

  // ---------- sound ----------
  // Everything is synthesized with Web Audio: sound effects, his voice (a buzzy source through
  // two vowel formant filters, so grunts read as "hup", "oof", "grr"), and a chiptune soundtrack
  // scheduled a little ahead of time. Master volume, mute and music are saved per player.
  let ac = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  const muteBtn = $('muteBtn'), musicBtn = $('musicBtn'), volIn = $('vol');
  function syncSoundUI() {
    muteBtn.textContent = PREF.muted ? 'Unmute' : 'Mute';
    muteBtn.setAttribute('aria-pressed', PREF.muted ? 'true' : 'false');
    musicBtn.textContent = PREF.music ? 'Music on' : 'Music off';
    musicBtn.setAttribute('aria-pressed', PREF.music ? 'true' : 'false');
    volIn.value = Math.round(PREF.vol * 100);
    if (master) master.gain.setTargetAtTime(PREF.muted ? 0 : PREF.vol * PREF.vol, ac.currentTime, 0.05);
    if (musicBus) musicBus.gain.setTargetAtTime(PREF.music ? 0.32 : 0, ac.currentTime, 0.1);
  }
  muteBtn.addEventListener('click', e => { PREF.muted = !PREF.muted; savePrefs(); initAudio(); syncSoundUI(); e.currentTarget.blur(); });
  musicBtn.addEventListener('click', e => { PREF.music = !PREF.music; savePrefs(); initAudio(); syncSoundUI(); e.currentTarget.blur(); });
  volIn.addEventListener('input', () => { PREF.vol = volIn.value / 100; PREF.muted = false; initAudio(); syncSoundUI(); });
  volIn.addEventListener('change', () => { savePrefs(); volIn.blur(); });
  function initAudio() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
      master = ac.createGain(); master.connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      musicBus = ac.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      syncSoundUI();
      setInterval(musicTick, 25);
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
  }
  syncSoundUI();
  const live = () => ac && !PREF.muted;
  function tone(f0, f1, dur, type = 'square', vol = 0.06, delay = 0, bus = sfxBus) {
    if (!live()) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, freq, q, vol = 0.1, delay = 0, type = 'bandpass', bus = sfxBus) {
    if (!live()) return;
    const t = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  // his voice: a sawtooth with vibrato through two vowel formants
  const VOWEL = { u: [320, 800], o: [520, 900], a: [760, 1150], e: [500, 1750], i: [300, 2250] };
  function voice(f0, f1, dur, vowel = 'u', vol = 0.12, delay = 0, wobble = 0) {
    if (!live()) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    if (wobble) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 28; lg.gain.value = wobble; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + 0.02); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    for (const [fq, gain] of [[VOWEL[vowel][0], 1], [VOWEL[vowel][1], 0.5]]) {
      const f = ac.createBiquadFilter(), fg = ac.createGain();
      f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = 7; fg.gain.value = gain * 2.2;
      g.connect(f).connect(fg).connect(sfxBus);
    }
    o.start(t); o.stop(t + dur + 0.02);
  }
  // little sounds he makes
  function grunt(kind) {
    if (!live()) return;
    const p = 1 + (Math.random() - 0.5) * 0.12;   // never quite the same twice
    switch (kind) {
      case 'hup': voice(190 * p, 260 * p, 0.12, 'u', 0.11); break;
      case 'hnn': voice(150 * p, 165 * p, 0.17, 'u', 0.07); break;
      case 'oof': voice(240 * p, 140 * p, 0.15, 'o', 0.12); break;
      case 'yelp': voice(520 * p, 980 * p, 0.17, 'i', 0.1); break;
      case 'ow': voice(420 * p, 230 * p, 0.22, 'a', 0.11); break;
      case 'grr': voice(115 * p, 100 * p, 0.38, 'o', 0.12, 0, 9); break;
      case 'hmph': voice(210 * p, 150 * p, 0.2, 'u', 0.1); noise(0.12, 900, 0.8, 0.05, 0.12); break;
      case 'rage': voice(150 * p, 120 * p, 0.32, 'a', 0.13, 0, 14); voice(180 * p, 110 * p, 0.3, 'a', 0.12, 0.34, 14); break;
      case 'pant': for (let i = 0; i < 3; i++) noise(0.11, 1400, 0.7, 0.07, i * 0.24, 'bandpass'); break;
      case 'woo': voice(330 * p, 620 * p, 0.25, 'u', 0.1); break;
      case 'aww': voice(330 * p, 160 * p, 0.6, 'a', 0.1, 0, 4); break;
    }
  }
  function sfx(name) {
    if (!live()) return;
    switch (name) {
      case 'rot': tone(520, 600, 0.04, 'square', 0.025); break;
      // a satisfying thunk: a low thump plus a short knock of filtered noise
      case 'lock': tone(150, 52, 0.14, 'sine', 0.32); noise(0.06, 500, 1.2, 0.18); tone(900, 700, 0.03, 'triangle', 0.03); break;
      case 'slam': tone(130, 38, 0.22, 'sine', 0.42); noise(0.12, 300, 0.9, 0.28); tone(80, 30, 0.14, 'sawtooth', 0.05); break;
      case 'clear1': case 'clear2': case 'clear3':
        [523, 659, 784].slice(0, +name.slice(-1) + 1).forEach((f, i) => tone(f, f, 0.1, 'square', 0.05, i * 0.06)); break;
      case 'clear4': [523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.01, 0.14, 'square', 0.06, i * 0.07)); break;
      case 'jump': tone(300, 700, 0.12, 'square', 0.025); break;
      case 'rattle': tone(95 + Math.random() * 30, 60, 0.05, 'square', 0.03); if (Math.random() < 0.3) tone(1400, 900, 0.03, 'square', 0.012); break;
      case 'beep': tone(880, 880, 0.07, 'square', 0.05); tone(1320, 1320, 0.09, 'square', 0.05, 0.08); break;
      case 'zap': tone(180, 2200, 0.35, 'sawtooth', 0.035); tone(2400, 300, 0.3, 'sine', 0.03, 0.1); break;
      case 'crumble': tone(220, 50, 0.45, 'sawtooth', 0.06); noise(0.4, 400, 0.7, 0.18); break;
      case 'creak': tone(160, 120, 0.3, 'sawtooth', 0.025); break;
      case 'fall': tone(1200, 180, 0.7, 'sine', 0.06); break;
      case 'bonk': tone(700, 160, 0.18, 'square', 0.07); tone(90, 40, 0.15, 'triangle', 0.15); break;
      case 'thud': tone(90, 40, 0.2, 'triangle', 0.18); noise(0.08, 300, 1, 0.08); break;
      case 'boing': tone(180, 520, 0.28, 'sine', 0.12); tone(260, 700, 0.2, 'triangle', 0.04, 0.05); break;
      case 'whoosh': noise(1.2, 700, 0.6, 0.12, 0, 'bandpass'); break;
      case 'splash': noise(0.5, 1200, 0.5, 0.22); tone(500, 120, 0.3, 'sine', 0.06); break;
      case 'sizzle': noise(1.2, 4000, 0.4, 0.14, 0, 'highpass'); tone(300, 90, 0.4, 'sawtooth', 0.04); break;
      case 'faint': tone(500, 140, 0.9, 'triangle', 0.07); break;
      case 'unlock': [659, 784, 988, 1319].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.08, i * 0.09)); break;
      case 'win': [392, 523, 659, 784].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.08, i * 0.12)); break;
      case 'over': [330, 262, 196].forEach((f, i) => tone(f, f * 0.98, 0.22, 'triangle', 0.08, i * 0.16)); break;
    }
  }

  // --- soundtrack: 8 bars in C (C G Am F / F G Am G), drums, bass and a lead; faster and busier
  // in the escape modes, and busier still when the lava is close. Each world shifts the key a little.
  const MEL = [
    [76, 0, 79, 0, 84, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0], [74, 0, 79, 0, 83, 0, 79, 0, 81, 0, 79, 0, 74, 0, 0, 0],
    [72, 0, 76, 0, 81, 0, 76, 0, 79, 0, 76, 0, 72, 0, 74, 0], [72, 0, 77, 0, 81, 0, 77, 0, 79, 0, 81, 0, 79, 0, 0, 0],
    [81, 0, 0, 0, 79, 0, 77, 0, 76, 0, 0, 0, 74, 0, 72, 0], [74, 0, 0, 0, 76, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [76, 0, 0, 0, 74, 0, 72, 0, 69, 0, 0, 0, 72, 0, 74, 0], [71, 0, 0, 0, 74, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const ROOT = [48, 43, 45, 41, 41, 43, 45, 43];
  const KEY = { garden: 0, ice: 2, wind: -3, jelly: 5, ruins: -5 };
  const LEAD = { garden: 'square', ice: 'triangle', wind: 'sawtooth', jelly: 'square', ruins: 'triangle' };
  const mus = { next: 0, step: 0 };
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  function setMusicFor() { mus.step = 0; }
  function musicTick() {
    if (!ac || PREF.muted || !PREF.music || document.hidden) { if (ac) mus.next = ac.currentTime + 0.05; return; }
    const run = S && S.run, intense = run && run.hazard && S.mode === 'play';
    const danger = intense && S.haz && S.climber.y > S.haz.y - 3 * CELL;
    const bpm = S && S.mode === 'play' ? (intense ? 132 : 112) : 96;
    const st = 60 / bpm / 4, world = (run && run.world) || 'garden', k = KEY[world] || 0;
    if (mus.next < ac.currentTime) mus.next = ac.currentTime + 0.05;
    while (mus.next < ac.currentTime + 0.12) {
      const t = mus.next - ac.currentTime, s = mus.step % 16, bar = Math.floor(mus.step / 16) % 8;
      const calm = !S || S.mode !== 'play';
      // drums
      if (!calm) {
        if (s === 0 || s === 8 || (intense && s === 10)) tone(120, 45, 0.12, 'sine', 0.5, t, musicBus);
        if (s === 4 || s === 12) noise(0.09, 1800, 0.8, 0.18, t, 'bandpass', musicBus);
        if (s % 2 === 0 || danger) noise(0.03, 7000, 1, s % 4 === 2 ? 0.07 : 0.04, t, 'highpass', musicBus);
      }
      // bass on the beat, octave bounce on the off-beats
      if (s % 4 === 0) tone(hz(ROOT[bar] + k), hz(ROOT[bar] + k), st * 3, 'triangle', calm ? 0.16 : 0.22, t, musicBus);
      if (s % 4 === 2 && !calm) tone(hz(ROOT[bar] + 12 + k), hz(ROOT[bar] + 12 + k), st * 1.5, 'triangle', 0.12, t, musicBus);
      // lead
      const n = MEL[bar][s];
      if (n) tone(hz(n + k), hz(n + k) * 0.995, st * (calm ? 3 : 2.2), LEAD[world] || 'square', calm ? 0.035 : 0.05, t, musicBus);
      mus.next += st; mus.step++;
    }
  }

  // ---------- drawing ----------
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function drawCell(c, x, y, size, color, seed, alpha = 1) {
    const j = (hash(seed) - 0.5) * 1.6, k = (hash(seed + 7) - 0.5) * 1.6;
    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.fillRect(x + 2 + j, y + 2 + k, size - 4, size - 4);
    c.strokeStyle = T.ink; c.lineWidth = Math.max(1, size * 0.055);
    c.beginPath();
    c.moveTo(x + 1.5, y + 1.5 + k * 0.5); c.lineTo(x + size - 1.5, y + 1.5);
    c.lineTo(x + size - 1.5 + j * 0.4, y + size - 1.5); c.lineTo(x + 1.5, y + size - 1.5 + j * 0.4);
    c.closePath(); c.stroke();
    c.globalAlpha = alpha * 0.28; c.strokeStyle = T.board;
    c.beginPath(); c.moveTo(x + size * 0.25, y + size * 0.72); c.lineTo(x + size * 0.7, y + size * 0.27); c.stroke();
    c.globalAlpha = 1;
  }

  function drawSky(t) {
    ctx.fillStyle = T.paper; ctx.fillRect(0, 0, W, TOP);
    ctx.strokeStyle = T.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, TOP - 1); ctx.lineTo(W, TOP - 1); ctx.stroke();
    const fx = BW + 14;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fx, TOP - 2); ctx.lineTo(fx, TOP - 34); ctx.stroke();
    const wave = Math.sin(t * 4) * 3;
    ctx.fillStyle = T.accent;
    ctx.beginPath(); ctx.moveTo(fx, TOP - 34); ctx.quadraticCurveTo(fx - 10, TOP - 30 + wave, fx - 20, TOP - 28 + wave);
    ctx.lineTo(fx, TOP - 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = T.muted; ctx.font = `13px ${T.hand}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const run = S.run;
    ctx.fillText(!run ? 'the top ↑ (he wants it)' : run.mode === 'classic' ? `the top ↑ keep him from it · ${wld().name}`
      : `${run.mode === 'daily' ? 'daily · ' : ''}the way out ↑ help him up! · ${wld().name}`, 6, TOP - 16);
  }

  function drawRuler() {
    ctx.fillStyle = T.wall; ctx.fillRect(BW, TOP, RULER, BH);
    ctx.strokeStyle = T.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(BW + 1, TOP); ctx.lineTo(BW + 1, H); ctx.stroke();
    ctx.fillStyle = T.muted; ctx.strokeStyle = T.muted; ctx.lineWidth = 1.2;
    ctx.font = `12px ${T.hand}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let m = 0; m <= 100; m += 10) {
      const y = TOP + BH * (1 - m / 100);
      ctx.beginPath(); ctx.moveTo(BW + 2, y); ctx.lineTo(BW + 7, y); ctx.stroke();
      if (m % 20 === 0 && m > 0 && m < 100) ctx.fillText(m + 'm', W - 3, y);
    }
    if (S.haz && S.haz.y < BH) {
      // the hazard level on the ruler
      const y = TOP + Math.max(0, S.haz.y);
      ctx.fillStyle = S.haz.kind === 'lava' ? '#e8481a' : '#2d8fd0';
      ctx.fillRect(BW + 2, y, RULER - 2, H - y);
    }
    if (S.mode !== 'intro') {
      const y = TOP + Math.max(0, Math.min(BH, S.climber.y));
      ctx.fillStyle = T.accent;
      ctx.beginPath(); ctx.moveTo(BW + 3, y); ctx.lineTo(BW + 11, y - 5); ctx.lineTo(BW + 11, y + 5); ctx.closePath(); ctx.fill();
    }
  }

  function drawBoard() {
    ctx.fillStyle = T.board; ctx.fillRect(0, 0, BW, BH);
    ctx.strokeStyle = T.grid; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) { ctx.moveTo(x * CELL + 0.5, 0); ctx.lineTo(x * CELL + 0.5, BH); }
    for (let y = 1; y < ROWS; y++) { ctx.moveTo(0, y * CELL + 0.5); ctx.lineTo(BW, y * CELL + 0.5); }
    ctx.stroke();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const v = S.board[y][x];
      if (!v) continue;
      const prog = S.crk[y][x] || 0;
      const jig = prog > BREAK_AT - 2 ? (Math.random() - 0.5) * (prog - (BREAK_AT - 2)) : 0;
      drawCell(ctx, x * CELL + jig, y * CELL, CELL, T.p[v], y * 31 + x);
      if (S.fx[y][x]) drawFx(x * CELL + jig, y * CELL, S.fx[y][x], y * 31 + x, y, x);
      if (prog >= CRACK_AT) drawCracks(x * CELL + jig, y * CELL, (prog - CRACK_AT) / (BREAK_AT - CRACK_AT), y * 31 + x);
    }
    if (S.cur && S.mode !== 'intro') {
      const { m, x } = S.cur;
      let gy = S.cur.y; while (!collide(m, x, gy + 1)) gy++;
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.muted; ctx.lineWidth = 1.5;
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m.length; c++)
        if (m[r][c] && gy + r >= 0) ctx.strokeRect((x + c) * CELL + 3.5, (gy + r) * CELL + 3.5, CELL - 7, CELL - 7);
      ctx.setLineDash([]);
      if (S.slam) {
        // speed streaks behind a slamming piece
        ctx.globalAlpha = 0.18; ctx.fillStyle = T.p[S.cur.t];
        for (let c = 0; c < m.length; c++) {
          let top = -1; for (let r = 0; r < m.length; r++) if (m[r][c]) { top = r; break; }
          if (top < 0) continue;
          const y1 = (S.cur.y + top) * CELL, y0 = Math.max(0, (S.slam.y0 + top) * CELL);
          if (y1 > y0) ctx.fillRect((x + c) * CELL + 6, y0, CELL - 12, y1 - y0);
        }
        ctx.globalAlpha = 1;
      }
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m.length; c++)
        if (m[r][c] && S.cur.y + r >= 0) {
          drawCell(ctx, (x + c) * CELL, (S.cur.y + r) * CELL, CELL, T.p[S.cur.t], r * 5 + c + 999);
          if (S.cur.fx) drawFx((x + c) * CELL, (S.cur.y + r) * CELL, S.cur.fx, r * 5 + c + 999, -1, -1);
        }
    }
  }

  // hairline cracks that spread as the drilling goes on (k: 0 → 1)
  function drawCracks(x, y, k, seed) {
    ctx.save();
    ctx.strokeStyle = T.ink; ctx.lineWidth = 1.1 + k * 0.6; ctx.lineCap = 'round';
    const branches = 2 + Math.floor(k * 4);
    const cx = x + CELL * (0.35 + hash(seed + 3) * 0.3), cy = y + CELL * (0.35 + hash(seed + 5) * 0.3);
    ctx.beginPath();
    for (let b = 0; b < branches; b++) {
      let a = hash(seed + b * 11) * Math.PI * 2, px = cx, py = cy;
      ctx.moveTo(px, py);
      const segs = 2 + Math.floor(k * 2), len = (4 + k * 7) / segs * 2;
      for (let i = 0; i < segs; i++) {
        a += (hash(seed + b * 7 + i) - 0.5) * 1.2;
        px = Math.max(x + 1, Math.min(x + CELL - 1, px + Math.cos(a) * len));
        py = Math.max(y + 1, Math.min(y + CELL - 1, py + Math.sin(a) * len));
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // which motion to show, how far into it, and where its origin sits in the world
  function currentMotion() {
    const C = S.climber;
    let name = 'idle', t = C.t, ox = C.x, oy = C.y, speed = 1;
    switch (C.state) {
      case 'intro': name = 'pp_waveBig'; break;
      case 'dead': name = { lava: 'pp_deathBurn', water: 'pp_deathSink' }[C.deathKind] || 'pp_deathSwoon'; t = C.t - C.deathAt; break;
      case 'ground': {
        if (C.pp && C.t < C.pp.until) { name = C.pp.name; t = C.t - C.pp.t0; break; }
        if (C.topAnim && C.t < C.topAnim.until) { name = C.topAnim.name; t = C.topAnim.t; break; }
        const v = Math.abs(C.vx);
        const riding = supportUnder(C.x, C.y) === 'piece';
        if (C.alert && C.alert.t < C.alert.react) name = 'lookUp';
        else if (C.alert && C.alert.left < 0.14 && Math.abs(C.vx) < 60) name = 'brace';   // flinch: it's about to hit
        else if (C.alert && C.intent && C.intent.type === 'brace') name = 'brace';
        else if (C.crouchT > 0) { name = 'crouch'; t = C.crouchLen - C.crouchT; }
        else if (C.stumbleT > 0) name = 'stumble';
        else if (C.landT > 0) name = 'land';
        else if (v > 70) { name = 'run'; speed = v / 105; }
        else if (v > 6) { name = 'walk'; speed = Math.max(0.5, v / 44); }
        else if (riding || C.wobble > 0.15) name = 'balance';
        else if (C.intent && C.intent.type === 'wait') name = 'lookUp';
        else if (C.windT > 0 && S.wind) { name = 'pp_windBrace'; C.f = -S.wind.dir; }
        else {
          const ed = C.mood === 'idle' ? edgeDir() : 0;
          if (ed) { name = 'pp_edgePeer'; C.f = ed; } else name = C.mood;
        }
        break;
      }
      case 'air': {
        const tm = topAirMotion();
        if (tm) { name = tm.name; t = tm.t; break; }
        if (C.bounceT > 0 && !C.tumble) { name = 'pp_bounceSpread'; break; }
        if (C.tumble) name = 'tumble';
        else if (C.vy < 0) { name = 'jumpUp'; t = C.airT; }
        else name = 'fallDown';
        break;
      }
      case 'hang': case 'pull': {
        const A = anchorAbs();
        if (A) { ox = A.gx; oy = A.gy; }
        name = C.state === 'hang' ? (C.hangT > 0.9 ? 'hangShimmy' : 'hang') : 'pullUp';
        if (C.state === 'pull') t = C.pullT;
        break;
      }
      case 'button': name = 'idle'; break;
      case 'climb': name = 'climb'; speed = (26 + 3 * (S.level - 1) + C.grit) / 37; break;
      case 'dazed': name = 'dazed'; break;
      case 'squash':
        if (C.topHit) { ({ name, t } = topMotion()); break; }
        name = 'squashed'; t = 0.7 - C.squashT; break;
      case 'win': {
        // a victory routine: hop, dance, flex, wave
        const k = Math.floor(C.winT / 1.6) % 4;
        name = ['celebrate', 'pp_dance', 'pp_flex', 'pp_waveBig'][k]; oy = 0; t = C.winT % 1.6;
        break;
      }
    }
    const nm = C.state === 'dead' ? null : nearMotion(C);
    if (nm) { name = nm.name; t = nm.t; speed = nm.speed || speed; }
    if (C.state === 'dead' || (C.pp && C.state === 'ground')) return { name, t, ox, oy, speed };
    // riding poses first, then recoveries take priority over them
    return recoverMotion(sideMotion(rideMotion({ name, t, ox, oy, speed })));
  }
  let lastWorld = null, fromWorld = null, fadeT = 0, fadeLen = 0.12, fadeEase = 'smooth', lastName = '', lastF = 0, animStart = 0;
  function worldPose(clock) {
    const C = S.climber;
    const mo = currentMotion();
    const f = C.state === 'hang' || C.state === 'pull' ? (anchorAbs() || { f: C.f }).f : C.f;
    if (mo.name !== lastName || f !== lastF) {
      // blend from whatever is on screen (even mid-blend); time and curve depend on the motions
      const b = mo.name !== lastName ? blendFor(lastName, mo.name) : [0.1, 'smooth'];
      fromWorld = lastWorld; fadeT = fadeLen = b[0]; fadeEase = b[1];
      if (mo.name !== lastName) animStart = clock;
      lastName = mo.name; lastF = f;
    }
    carryFrom(fromWorld);
    const local = M.sample(mo.name, mo.t === C.t ? (clock - animStart) * mo.speed : mo.t, { speed: mo.speed }) || STAND;
    const w = { face: local.face };
    const rot = C.state === 'air' && C.tumble ? C.rot : nearRot(C);
    const cx = mo.ox, cy = mo.oy - (C.state === 'ground' ? 15 : 18), cs = Math.cos(rot), sn = Math.sin(rot);
    for (const j of JOINTS) {
      const p = local[j] || STAND[j];
      let x = mo.ox + p[0] * f, y = mo.oy + p[1];
      if (rot) { const dx = x - cx, dy = y - cy; x = cx + dx * cs - dy * sn; y = cy + dx * sn + dy * cs; }
      w[j] = [x, y];
    }
    topDeform(w, mo, local);
    let out = w;
    if (fadeT > 0 && fromWorld) {
      const k = (EASE[fadeEase] || EASE.smooth)(1 - fadeT / fadeLen);
      out = { face: local.face };
      for (const j of JOINTS) out[j] = [fromWorld[j][0] + (w[j][0] - fromWorld[j][0]) * k, fromWorld[j][1] + (w[j][1] - fromWorld[j][1]) * k];
    }
    out.f = f;
    if (C.alert && !/^near_/.test(out.face || '')) out.face = 'scared';
    nearPose(out);
    lastWorld = out;
    return animPost(out, mo, clock);
  }
  function drawClimber(clock, dt) {
    if (fadeT > 0) fadeT = Math.max(0, fadeT - dt);
    drawNearFx(dt);
    const P = worldPose(clock);
    rideDecorate(P);
    sideDraw(P, dt);
    const C = S.climber, it = C.intent;
    const dj = C.state === 'ground' && !C.alert && it && it.type === 'drill' ? { tr: it.tr, tc: it.tc, side: it.side } : C.drillAt;
    let drill = null;
    if (dj) {
      // both hands on the jackhammer's T-handle, everything shaking
      const f = dj.side ? Math.sign(dj.side) : (P.f || 1);
      const jit = () => (Math.random() - 0.5) * 1.6;
      const sx = P.neck[0], sy = P.neck[1] + 3;
      let hx, hy, tipX, tipY, ax, ay;
      if (!dj.side) {
        // overhead, the drill goes up beside his head rather than through it
        hx = sx + f * 10 + jit(); hy = sy - 2 + jit(); tipX = hx; tipY = (dj.tr + 1) * CELL; ax = 0; ay = -1;
      } else {
        hx = sx + f * 2 + jit(); hy = sy + 4 + jit();
        tipX = f > 0 ? dj.tc * CELL : (dj.tc + 1) * CELL;
        tipY = Math.max(dj.tr * CELL + 4, Math.min((dj.tr + 1) * CELL - 4, hy));
        const L = Math.hypot(tipX - hx, tipY - hy) || 1;
        ax = (tipX - hx) / L; ay = (tipY - hy) / L;
      }
      const px = -ay, py = ax;                                            // across the handle
      for (const [side, e] of [[-1, 'lElbow'], [1, 'rElbow']]) {
        const hand = [hx + px * 5 * side + jit() * 0.5, hy + py * 5 * side + jit() * 0.5];
        P[e === 'lElbow' ? 'lHand' : 'rHand'] = hand;
        P[e] = [(sx + hand[0]) / 2 + px * 5 * side - ax * 3, (sy + hand[1]) / 2 + py * 5 * side - ay * 3 + (dj.side ? 3 : 0)];
      }
      P.head = [P.head[0] + jit() * 0.6, P.head[1] + jit() * 0.6];
      P.face = 'grit';
      drill = { hx, hy, tipX, tipY, ax, ay, px, py, f };
    }
    let btn = null, alpha = 1;
    if (C.state === 'button') {
      const f = P.f || 1, t = C.btnT;
      const out = Math.min(1, t / 0.35);                                 // box comes out
      const bx = P.neck[0] + f * (4 + 8 * out), by = P.neck[1] + 14 - 2 * out;
      const sx = P.neck[0], sy = P.neck[1] + 3;
      P.rHand = [bx + f * 1, by + 5]; P.rElbow = [(sx + P.rHand[0]) / 2 - f * 2, (sy + P.rHand[1]) / 2 + 4];
      // the other hand winds up, then slaps down on the button
      const slap = t < 0.55 ? 0 : t < 0.75 ? (t - 0.55) / 0.2 : 1;
      const up = [bx - f * 2, by - 14], down = [bx, by - 3];
      P.lHand = t < 0.55 ? [sx - f * 4, sy + 14] : [up[0] + (down[0] - up[0]) * slap, up[1] + (down[1] - up[1]) * slap * slap];
      P.lElbow = [(sx + P.lHand[0]) / 2 - f * 4, (sy + P.lHand[1]) / 2 - 2];
      P.face = t > 0.75 ? 'happy' : 'normal';
      btn = { bx, by, pressed: t >= 0.75 };
      if (t > 1.05) alpha = Math.max(0, 1 - (t - 1.05) / 0.45);
    }
    if (C.arriveT > 0) alpha = Math.min(alpha, 1 - C.arriveT / 0.7);
    // beam of light while he teleports out or in
    const beam = C.state === 'button' && C.btnT > 0.95 ? Math.min(1, (C.btnT - 0.95) / 0.2) * (1 - Math.max(0, C.btnT - 1.35) / 0.15) : C.arriveT > 0 ? C.arriveT / 0.7 : 0;
    if (beam > 0) {
      ctx.save();
      ctx.globalAlpha = 0.28 * beam; ctx.fillStyle = T.p.I;
      ctx.fillRect(C.x - 9, C.y - 220, 18, 220);
      ctx.globalAlpha = 0.6 * beam; ctx.strokeStyle = T.accent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(C.x, C.y, 10 + (1 - beam) * 10, 3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, alpha);
    const charred = C.state === 'dead' && C.deathKind === 'lava' && C.t - C.deathAt > 0.5;
    ctx.strokeStyle = charred ? T.muted : T.ink; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const sh = [P.neck[0], P.neck[1] + 3];
    ctx.beginPath();
    ctx.moveTo(P.neck[0], P.neck[1]); ctx.lineTo(P.hip[0], P.hip[1]);
    ctx.moveTo(sh[0], sh[1]); ctx.lineTo(P.lElbow[0], P.lElbow[1]); ctx.lineTo(P.lHand[0], P.lHand[1]);
    ctx.moveTo(sh[0], sh[1]); ctx.lineTo(P.rElbow[0], P.rElbow[1]); ctx.lineTo(P.rHand[0], P.rHand[1]);
    ctx.moveTo(P.hip[0], P.hip[1]); ctx.lineTo(P.lKnee[0], P.lKnee[1]); ctx.lineTo(P.lFoot[0], P.lFoot[1]);
    ctx.moveTo(P.hip[0], P.hip[1]); ctx.lineTo(P.rKnee[0], P.rKnee[1]); ctx.lineTo(P.rFoot[0], P.rFoot[1]);
    ctx.stroke();
    if (drill) {
      const { hx, hy, tipX, tipY, ax, ay, px, py } = drill;
      const len = Math.max(10, (tipX - hx) * ax + (tipY - hy) * ay);
      const bodyL = Math.min(14, len * 0.62);
      ctx.save();
      ctx.lineWidth = 1.6; ctx.strokeStyle = T.ink;
      // hose, looping down to the ground
      const bx = hx + ax * bodyL * 0.5 + px * 4, by = hy + ay * bodyL * 0.5 + py * 4;
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + 14 * (drill.f || 1), by + 4, bx + 18 * (drill.f || 1), S.climber.y - 10, bx + 22 * (drill.f || 1), S.climber.y - 1);
      ctx.stroke();
      // T-handle
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(hx - px * 7, hy - py * 7); ctx.lineTo(hx + px * 7, hy + py * 7); ctx.stroke();
      // body
      ctx.fillStyle = T.board; ctx.lineWidth = 1.6;
      const w = 4.5;
      ctx.beginPath();
      ctx.moveTo(hx - px * w, hy - py * w); ctx.lineTo(hx + px * w, hy + py * w);
      ctx.lineTo(hx + px * w + ax * bodyL, hy + py * w + ay * bodyL); ctx.lineTo(hx - px * w + ax * bodyL, hy - py * w + ay * bodyL);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.ink;
      ctx.beginPath(); ctx.arc(hx + ax * bodyL * 0.35, hy + ay * bodyL * 0.35, 0.9, 0, Math.PI * 2); ctx.fill();
      // bit, hammering in and out
      const kick = Math.random() * 1.5;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(hx + ax * bodyL, hy + ay * bodyL);
      ctx.lineTo(tipX - ax * kick, tipY - ay * kick); ctx.stroke();
      // spark lines where the bit meets the block
      ctx.lineWidth = 1; ctx.strokeStyle = T.accent;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, r0 = 2, r1 = 5 + Math.random() * 5;
        ctx.moveTo(tipX + Math.cos(a) * r0, tipY + Math.sin(a) * r0); ctx.lineTo(tipX + Math.cos(a) * r1, tipY + Math.sin(a) * r1);
      }
      ctx.stroke();
      // shake marks beside the hands, stress squiggles over the head
      ctx.strokeStyle = T.ink; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const h of [P.lHand, P.rHand]) {
        const o = h === P.lHand ? -1 : 1;
        ctx.moveTo(h[0] + px * o * 4 - ay * 3, h[1] + py * o * 4 + ax * 3);
        ctx.quadraticCurveTo(h[0] + px * o * 6, h[1] + py * o * 6, h[0] + px * o * 4 + ay * 3, h[1] + py * o * 4 - ax * 3);
      }
      const [qx, qy] = P.head;
      for (const dx of [-4, 4]) {
        let x0 = qx + dx, y0 = qy - 9;
        ctx.moveTo(x0, y0);
        for (let i = 1; i <= 4; i++) ctx.lineTo(x0 + (i % 2 ? 1.6 : -1.6), y0 - i * 2);
      }
      ctx.stroke();
      ctx.restore();
    }
    const [hx, hy] = P.head;
    ctx.beginPath(); ctx.arc(hx, hy, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = T.board; ctx.fill(); ctx.stroke();
    // a tiny face
    const f = P.f || 1;
    ctx.lineWidth = 1.3; ctx.fillStyle = T.ink;
    const face = P.face || 'normal';
    if (face.startsWith('near_')) drawNearFace(face, hx, hy, f);
    else if (face === 'dizzy') {
      ctx.beginPath();
      for (const ex of [-1, 3]) { const x = hx + ex * f; ctx.moveTo(x - 1.4, hy - 2.4); ctx.lineTo(x + 1.4, hy + 0.4); ctx.moveTo(x + 1.4, hy - 2.4); ctx.lineTo(x - 1.4, hy + 0.4); }
      ctx.stroke();
    } else {
      const g = P.gaze || [0, 0];
      for (const ex of [0, 3.2]) { ctx.beginPath(); ctx.arc(hx + ex * f + g[0], hy - 1.2 + g[1], 0.95, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath();
      if (face === 'happy') ctx.arc(hx + 1.6 * f, hy + 1.2, 2.2, 0.15 * Math.PI, 0.85 * Math.PI);
      else if (face === 'scared') ctx.arc(hx + 1.6 * f, hy + 2.6, 1.3, 0, Math.PI * 2);
      else if (face === 'strain') { ctx.moveTo(hx + 0.2 * f, hy + 2.6); ctx.lineTo(hx + 3.2 * f, hy + 2.2); }
      else if (face === 'grit') {
        // angry brows and clenched teeth
        ctx.moveTo(hx - 1.2 * f, hy - 3.6); ctx.lineTo(hx + 1.2 * f, hy - 2.4);
        ctx.moveTo(hx + 2.2 * f, hy - 2.4); ctx.lineTo(hx + 4.4 * f, hy - 3.6);
        ctx.rect(hx - 1.4 * f - (f < 0 ? 5.2 : 0), hy + 1.2, 5.2, 2.6);
        ctx.moveTo(hx - 1.4 * f, hy + 2.5); ctx.lineTo(hx + 3.8 * f, hy + 2.5);
        for (const t of [0.3, 1.6, 2.9]) { ctx.moveTo(hx + t * f, hy + 1.2); ctx.lineTo(hx + t * f, hy + 3.8); }
      } else if (face === 'angry') {
        // slanted brows and a frown
        ctx.moveTo(hx - 1.4 * f, hy - 4); ctx.lineTo(hx + 1.2 * f, hy - 2.6);
        ctx.moveTo(hx + 2.2 * f, hy - 2.6); ctx.lineTo(hx + 4.6 * f, hy - 4);
        ctx.moveTo(hx + 0.1 * f, hy + 3.4); ctx.quadraticCurveTo(hx + 1.7 * f, hy + 1.4, hx + 3.3 * f, hy + 3.4);
      }
      ctx.stroke();
    }
    drawOutfit(P, f);
    drawStars(hx, hy);
    if (btn) {
      // a little box with a big red button
      const { bx, by, pressed } = btn;
      ctx.lineWidth = 1.4; ctx.strokeStyle = T.ink;
      ctx.fillStyle = T.wall; ctx.fillRect(bx - 6, by, 12, 8); ctx.strokeRect(bx - 6, by, 12, 8);
      ctx.fillStyle = T.accent;
      ctx.beginPath(); ctx.ellipse(bx, by, 4, pressed ? 1.5 : 3.2, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    return P.head;
  }
  function star(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function drawBubble(head) {
    const C = S.climber;
    if (C.sayT <= 0 || !C.sayText) return;
    const hx = head[0], hy = head[1] + TOP;
    ctx.save();
    ctx.globalAlpha = Math.min(1, C.sayT * 4);
    ctx.font = `17px ${T.hand}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const tw = ctx.measureText(C.sayText).width, bw = tw + 16, bh = 26;
    const leftSide = hx > BW / 2;
    let bx = leftSide ? hx - 14 - bw : hx + 14, by = hy - 34;
    bx = Math.max(4, Math.min(W - bw - 4, bx)); by = Math.max(4, Math.min(H - bh - 4, by));
    ctx.fillStyle = T.board; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 9); else ctx.rect(bx, by, bw, bh);
    ctx.fill(); ctx.stroke();
    const tx = Math.max(bx + 10, Math.min(bx + bw - 10, hx));
    ctx.beginPath();
    ctx.moveTo(tx - 6, by + bh - 1); ctx.lineTo(hx + (leftSide ? -6 : 6), hy - 6); ctx.lineTo(tx + 2, by + bh - 1);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = T.ink; ctx.fillText(C.sayText, bx + 8, by + bh / 2 + 1);
    ctx.restore();
  }

  function drawMini(c, types) {
    const cw = c.clientWidth || 88, ch = c.clientHeight || 64, x2 = c.getContext('2d');
    x2.clearRect(0, 0, cw, ch);
    if (!types.length) return;
    const slots = Math.max(1, Math.min(types.length, Math.floor(ch / 56)));
    const slotH = ch / slots, cs = Math.min(16, (cw - 12) / 4, (slotH - 10) / 2);
    types.slice(0, slots).forEach((t, i) => {
      const m = SHAPES[t];
      let minX = 9, maxX = -1, minY = 9, maxY = -1;
      m.forEach((r, y) => r.forEach((v, x) => { if (v) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); } }));
      const pw = (maxX - minX + 1) * cs, ph = (maxY - minY + 1) * cs;
      const ox = (cw - pw) / 2, oy = i * slotH + (slotH - ph) / 2;
      m.forEach((r, y) => r.forEach((v, x) => { if (v) drawCell(x2, ox + (x - minX) * cs, oy + (y - minY) * cs, cs, T.p[t], i * 13 + y * 4 + x, (c === holdC && !S.canHold) ? 0.4 : 1); }));
    });
  }
  function drawMinis() {
    if (!S) return;
    drawMini(holdC, S.hold ? [S.hold] : []);
    drawMini(nextC, S.mode === 'intro' ? [] : S.queue.slice(0, 3));
  }

  let last = {};
  function syncUI() {
    const vals = { score: S.score.toLocaleString(), lines: S.lines, level: S.level, best: Math.max(best, S.score).toLocaleString(),
                   alt: altitude() + ' m', peak: S.climber.peak + ' m' };
    for (const k in vals) if (last[k] !== vals[k]) { ui[k].textContent = vals[k]; last[k] = vals[k]; }
  }

  function render(clock, dt) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    drawSky(clock);
    if (S.shake > 0.2) ctx.translate((Math.random() - 0.5) * S.shake * 0.5, (Math.random() - 0.5) * S.shake * 0.35);
    drawRuler();
    ctx.save();
    ctx.translate(0, TOP + S.thump * 2.5);
    ctx.beginPath(); ctx.rect(-20, -TOP, BW + 40, H + 20); ctx.clip();
    drawBoard();
    drawPuffs(dt);
    const head = drawClimber(clock, dt);
    drawSmoke(dt);
    drawHazard(clock);
    drawWind(clock);
    for (const q of S.parts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, q.life * 2));
      ctx.fillStyle = q.color; ctx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
      ctx.strokeStyle = T.ink; ctx.lineWidth = 0.6; ctx.strokeRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
    }
    ctx.globalAlpha = 1;
    if (S.flash > 0) { ctx.globalAlpha = S.flash * 3; ctx.fillStyle = T.board; ctx.fillRect(0, 0, BW, BH); ctx.globalAlpha = 1; }
    ctx.restore();
    drawBubble(head);
    ctx.restore();
  }

  // ---------- loop ----------
  let prev = performance.now(), clock = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now; clock += dt;
    if (S.mode === 'play') {
      S.time += dt;
      updateHeld(dt);
      const C = S.climber;
      if (S.slam && S.cur) updateSlam(dt);
      else if (C.state !== 'win' && S.cur) {
        const interval = dropInterval();
        S.dropT += dt;
        if (S.dropT >= interval) { S.dropT = 0; fallStep(); }
        if (S.cur && grounded()) { S.lockT += dt; if (S.lockT >= 0.5) lock(false, 0); }
        else S.lockT = 0;
      }
      // the mood he shows when he has nothing better to do
      C.moodT -= dt;
      if (C.moodT <= 0) { C.moodT = 2.5 + Math.random() * 3; C.mood = pickMood(C); }
      if (S.mode === 'play') {
        try { updateClimber(dt); if (S.mode === 'play') worldTick(dt); }
        catch (err) { console.error(err); rescueClimber(); }
      }
    } else {
      S.climber.t += dt;
      if (S.climber.state === 'win') S.climber.winT += dt;
      if (S.climber.sayT > 0 && S.mode !== 'intro') S.climber.sayT -= dt;
    }
    S.shake *= Math.exp(-dt * 9);
    S.thump = Math.max(0, S.thump - dt * 7);
    if (S.parts.length) {
      for (const q of S.parts) { q.vy += 700 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
      S.parts = S.parts.filter(q => q.life > 0 && q.y < BH + 20);
    }
    if (S.flash > 0) S.flash -= dt;
    try { render(clock, dt); syncUI(); }
    catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }

  // ---------- boot (with hot-reload snapshot) ----------
  window.claude?.hot?.snapshot?.(() => S && S.mode !== 'intro' ? JSON.parse(JSON.stringify(S)) : {});
  function start(data) {
    S = newState();
    if (data && data.board && data.climber && 'vx' in data.climber && data.run && data.fx) {
      S = Object.assign(newState(), data);
      if (!S.ids) S.ids = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      if (!S.crk) S.crk = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      if (S.mode === 'play') S.mode = 'paused';
      if (S.mode === 'paused') showCard('Paused.', 'The page was updated. He is still hanging on.', 'Resume', false);
      else if (S.mode === 'over') overlay.hidden = false;
      $('pauseBtn').textContent = S.mode === 'paused' ? 'Resume' : 'Pause';
    } else {
      showMenu();
    }
    fit();
    requestAnimationFrame(t => { prev = t; fit(); requestAnimationFrame(frame); });
  }
  window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
