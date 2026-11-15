/* motions.js - hand-keyframed stick-figure motion library.
 *
 * window.StickMotions = { sample, duration, loops, names, blend }
 *
 * Poses: { hip, neck, head, lElbow, lHand, rElbow, rHand, lKnee, lFoot, rKnee, rFoot, face }
 * each joint [x, y] in px, y DOWN, figure facing +x. Engine mirrors x for facing left.
 *
 * How it works: each keyframe stores a few "channels" (hip or neck position, torso lean,
 * head nod, and per limb either FK angles or an IK end-effector target). Channels are
 * interpolated with monotone cubic Hermite splines (smooth, no overshoot, holds stay
 * exactly still, loops wrap seamlessly), then forward/inverse kinematics builds the
 * joints. Limb lengths are therefore always exact: arm 9+9, leg 9+9, torso 17, head 8.
 *
 * Angle convention (degrees): measured from straight DOWN, positive rotates toward +x
 * (forward). 0 = hanging down, 90 = pointing forward, 180 = pointing up.
 *   torso  lean : 0 upright, + leans forward (neck ahead of hip)
 *   head   nod  : added to lean; + tips head forward/down, - tilts it back (look up)
 *   arm FK  s,e : upper arm absolute angle s; forearm angle = s + e (e >= 0 bends elbow)
 *   leg FK  s,k : thigh absolute angle s;    shin angle    = s - k (k >= 0 bends knee)
 *   IK bend sign: +1 puts the joint on the side n = (u.y, -u.x) of the root->target dir u.
 *                 For a leg pointing down that is +x (knee forward).
 */
(function () {
  'use strict';

  var UA = 9, FA = 9, TH = 9, SH = 9, TORSO = 17, HEAD = 8;
  var D2R = Math.PI / 180;
  var JOINTS = ['hip', 'neck', 'head', 'lElbow', 'lHand', 'rElbow', 'rHand', 'lKnee', 'lFoot', 'rKnee', 'rFoot'];

  function dir(a, len) { return [len * Math.sin(a * D2R), len * Math.cos(a * D2R)]; }
  function add(p, v) { return [p[0] + v[0], p[1] + v[1]]; }

  // Two-bone IK. Returns [middleJoint, endPoint]; end is pulled in if out of reach.
  function ik(root, target, a, b, sigma) {
    var dx = target[0] - root[0], dy = target[1] - root[1];
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-6) { dx = 0; dy = 1; d = 1e-6; }
    var ux = dx / d, uy = dy / d;
    var dc = Math.min(Math.max(d, Math.abs(a - b) + 0.01), a + b - 0.001);
    var along = (a * a - b * b + dc * dc) / (2 * dc);
    var h = Math.sqrt(Math.max(0, a * a - along * along));
    var nx = uy * sigma, ny = -ux * sigma;
    return [[root[0] + ux * along + nx * h, root[1] + uy * along + ny * h],
            [root[0] + ux * dc, root[1] + uy * dc]];
  }

  // Default channel values (a relaxed standing pose).
  var BASE = {
    x: 0, y: -16.8, lean: 3, nod: 0, hd: HEAD,
    las: 6, lae: 12, ras: -6, rae: 16,              // arm FK
    lhx: 1, lhy: -16, rhx: 2, rhy: -16,              // arm IK targets
    lls: 0, llk: 6, rls: 0, rlk: 6,                  // leg FK
    lfx: -3, lfy: 0, rfx: 3, rfy: 0                  // leg IK targets
  };
  var LIMB_CH = {
    la: { fk: ['las', 'lae'], ik: ['lhx', 'lhy'] }, ra: { fk: ['ras', 'rae'], ik: ['rhx', 'rhy'] },
    ll: { fk: ['lls', 'llk'], ik: ['lfx', 'lfy'] }, rl: { fk: ['rls', 'rlk'], ik: ['rfx', 'rfy'] }
  };

  var MOTIONS = {};

  // Fritsch-Butland monotone slope at the middle of three points.
  function slope(p0, t0, p1, t1, p2, t2) {
    var h0 = t1 - t0, h1 = t2 - t1;
    var d0 = (p1 - p0) / h0, d1 = (p2 - p1) / h1;
    if (d0 * d1 <= 0) return 0;
    return 3 * (h0 + h1) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
  }

  /* def(name, spec)
   * spec.dur   seconds;  spec.loop bool;  spec.speedable (opts.speed applies)
   * spec.root  'hip' (x,y = hip) or 'neck' (x,y = neck; hip hangs from it)
   * spec.mode  { la, ra, ll, rl : 'fk' | 'ik' }  (defaults: arms fk, legs ik)
   * spec.bend  IK bend signs { la, ra, ll, rl }  (defaults: arms -1, legs +1)
   * spec.face  default face;  keys: [[t, {channels..., face?}], ...]
   * Missing channels carry over from the previous key (first key: BASE). */
  function def(name, spec) {
    var mode = { la: 'fk', ra: 'fk', ll: 'ik', rl: 'ik' };
    var bend = { la: -1, ra: -1, ll: 1, rl: 1 };
    var k;
    for (k in spec.mode || {}) mode[k] = spec.mode[k];
    for (k in spec.bend || {}) bend[k] = spec.bend[k];
    var chans = ['x', 'y', 'lean', 'nod', 'hd'];
    for (k in LIMB_CH) chans = chans.concat(LIMB_CH[k][mode[k]]);
    var keys = spec.keys.slice().sort(function (a, b) { return a[0] - b[0]; });
    var n = keys.length, T = [], V = {}, faces = [];
    chans.forEach(function (c) { V[c] = []; });
    var prev = BASE;
    keys.forEach(function (kf, i) {
      T.push(kf[0]);
      var cur = {};
      chans.forEach(function (c) { cur[c] = (c in kf[1]) ? kf[1][c] : prev[c]; V[c].push(cur[c]); });
      faces.push(kf[1].face || null);
      prev = cur;
    });
    // Precompute tangents.
    var M = {}, dur = spec.dur;
    chans.forEach(function (c) {
      var v = V[c], m = [];
      for (var i = 0; i < n; i++) {
        if (n < 2) { m.push(0); continue; }
        if (spec.loop) {
          var ip = (i - 1 + n) % n, inx = (i + 1) % n;
          var tp = T[ip] - (i === 0 ? dur : 0), tn = T[inx] + (i === n - 1 ? dur : 0);
          m.push(slope(v[ip], tp, v[i], T[i], v[inx], tn));
        } else if (i === 0 || i === n - 1) {
          m.push(0);
        } else {
          m.push(slope(v[i - 1], T[i - 1], v[i], T[i], v[i + 1], T[i + 1]));
        }
      }
      M[c] = m;
    });
    MOTIONS[name] = { name: name, spec: spec, mode: mode, bend: bend, chans: chans,
                      T: T, V: V, M: M, faces: faces, n: n, dur: dur, loop: !!spec.loop };
  }

  function evalMotion(mo, t) {
    var T = mo.T, n = mo.n, dur = mo.dur, out = {};
    var ia, ib, ta, tb;
    if (mo.loop) {
      t = ((t % dur) + dur) % dur;
      if (t < T[0]) t += dur;                  // before first key: wrap segment
      ia = n - 1;
      for (var i = 0; i < n - 1; i++) if (t >= T[i] && t < T[i + 1]) { ia = i; break; }
      ib = (ia + 1) % n; ta = T[ia]; tb = ib === 0 ? T[0] + dur : T[ib];
    } else {
      t = Math.max(T[0], Math.min(t, T[n - 1]));
      ia = 0;
      for (var j = 0; j < n - 1; j++) if (t >= T[j]) ia = j;
      ib = Math.min(ia + 1, n - 1); ta = T[ia]; tb = T[ib];
    }
    var h = tb - ta, s = h > 0 ? (t - ta) / h : 0;
    var s2 = s * s, s3 = s2 * s;
    var h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    mo.chans.forEach(function (c) {
      var v = mo.V[c], m = mo.M[c];
      out[c] = h00 * v[ia] + h10 * h * m[ia] + h01 * v[ib] + h11 * h * m[ib];
    });
    // Face is stepped: last key at or before t that names one.
    var face = mo.spec.face || 'normal';
    var tf = mo.loop ? t % dur : t;
    for (var q = 0; q < n; q++) if (mo.faces[q] && T[q] <= tf + 1e-9) face = mo.faces[q];
    if (mo.loop && tf < T[0]) for (var r = 0; r < n; r++) if (mo.faces[r]) face = mo.faces[r];
    out.face = face;
    return out;
  }

  function build(mo, c) {
    var tv = dir(180 - c.lean, TORSO);   // hip -> neck
    var hip, neck;
    if (mo.spec.root === 'neck') { neck = [c.x, c.y]; hip = [c.x - tv[0], c.y - tv[1]]; }
    else { hip = [c.x, c.y]; neck = add(hip, tv); }
    var head = add(neck, dir(180 - (c.lean + c.nod), c.hd));
    var p = { hip: hip, neck: neck, head: head };
    function limb(id, root, a, b, jn, en, sign) {
      var ch = LIMB_CH[id][mo.mode[id]];
      if (mo.mode[id] === 'fk') {
        var j = add(root, dir(c[ch[0]], a));
        p[jn] = j; p[en] = add(j, dir(c[ch[0]] + sign * c[ch[1]], b));
      } else {
        var r = ik(root, [c[ch[0]], c[ch[1]]], a, b, mo.bend[id]);
        p[jn] = r[0]; p[en] = r[1];
      }
    }
    limb('la', neck, UA, FA, 'lElbow', 'lHand', 1);
    limb('ra', neck, UA, FA, 'rElbow', 'rHand', 1);
    limb('ll', hip, TH, SH, 'lKnee', 'lFoot', -1);
    limb('rl', hip, TH, SH, 'rKnee', 'rFoot', -1);
    p.face = c.face;
    return p;
  }

  // Helper for gait cycles: n evenly spaced keys, fn(i) returns the channels of key i.
  function cycle(dur, n, fn) {
    var keys = [];
    for (var i = 0; i < n; i++) keys.push([dur * i / n, fn(i)]);
    return keys;
  }

  /* ------------------------------------------------------------------ GROUND */

  // idle: breathing (hip rises/falls), slow weight shift, a glance up around 2s.
  def('idle', { dur: 3.2, loop: true, keys: [
    [0.0,  { x: 0,    y: -16.8, lean: 3, nod: 0,   las: 6, lae: 12, ras: -6, rae: 16, lfx: -3, rfx: 3.5 }],
    [0.8,  { x: 0.5,  y: -16.3, lean: 4, nod: 2,   las: 8, lae: 15, ras: -4, rae: 19 }],
    [1.6,  { x: 0.9,  y: -16.7, lean: 3, nod: 1,   las: 6, lae: 12, ras: -6, rae: 15 }],
    [2.0,  { x: 0.6,  y: -16.6, lean: 2, nod: -16, las: 4, lae: 11, ras: -8, rae: 14 }],
    [2.5,  { x: 0.2,  y: -16.4, lean: 2, nod: -13 }],
    [2.75, { x: -0.2, y: -16.5, lean: 3, nod: 4,   las: 6, lae: 13, ras: -5, rae: 16 }]
  ]});

  // lookUp: weight back, head tipped up, right hand shading the eyes, left hand on hip.
  def('lookUp', { dur: 2.0, loop: true, mode: { ra: 'ik' }, keys: [
    [0.0, { x: -0.5, y: -16.8, lean: -5, nod: -25, las: -25, lae: 70, rhx: 3.5, rhy: -44,   lfx: -3.5, rfx: 3 }],
    [0.5, { x: -0.9, y: -16.5, lean: -6, nod: -31, las: -24, lae: 72, rhx: 3.0, rhy: -44.5 }],
    [1.0, { x: -0.4, y: -16.8, lean: -4, nod: -22, las: -26, lae: 69, rhx: 4.0, rhy: -43.5 }],
    [1.5, { x: 0.2,  y: -16.5, lean: -5, nod: -29, las: -25, lae: 71, rhx: 3.5, rhy: -44 }]
  ]});

  // walk: 8-key cycle. Right foot path W[i]; left foot is half a cycle later.
  // Stance foot slides back 12px per half cycle -> ground speed ~44 px/s at speed 1.
  (function () {
    var W = [[6, 0], [3, 0], [0, 0], [-3, 0], [-6.5, -1], [-3, -4.5], [1.5, -5.5], [5, -2.5]];
    var ARM = [-24, -25, -12, 6, 24, 25, 12, -6];          // right arm swing (opposes right leg)
    var ELB = [14, 13, 16, 22, 30, 31, 25, 18];
    var HY = [-16.0, -16.4, -17.2, -16.8], NOD = [2, 0, -2, 0];
    def('walk', { dur: 0.55, loop: true, speedable: true, keys: cycle(0.55, 8, function (i) {
      var o = (i + 4) % 8;
      return { x: 0, y: HY[i % 4], lean: 6, nod: NOD[i % 4],
               rfx: W[i][0], rfy: W[i][1], lfx: W[o][0], lfy: W[o][1],
               ras: ARM[i], rae: ELB[i], las: ARM[o], lae: ELB[o] };
    })});
  })();

  // run: forward lean, high knees, flight phase, big pumping arms with ~90 deg elbows.
  // Stance foot slides 15px per half cycle -> ground speed ~105 px/s at speed 1.
  (function () {
    var R = [[7, 0], [2, 0], [-3, 0], [-8, -1.5], [-8, -9], [-2, -10.5], [5, -9], [9, -3.5]];
    var ARM = [-48, -40, 5, 42, 55, 42, -5, -40];
    var ELB = [62, 70, 92, 102, 98, 88, 70, 60];
    var HY = [-15.4, -14.9, -15.6, -16.8], NOD = [-8, -6, -9, -11];
    def('run', { dur: 0.38, loop: true, speedable: true, keys: cycle(0.38, 8, function (i) {
      var o = (i + 4) % 8;
      return { x: 0, y: HY[i % 4], lean: 15, nod: NOD[i % 4],
               rfx: R[i][0], rfy: R[i][1], lfx: R[o][0], lfy: R[o][1],
               ras: ARM[i], rae: ELB[i], las: ARM[o], lae: ELB[o] };
    })});
  })();

  // crouch: anticipation before a jump. Deep knee bend, arms swing back, eyes up.
  def('crouch', { dur: 0.14, keys: [
    [0.0,  { x: 0,    y: -16.6, lean: 4,  nod: 0,   las: 5,   lae: 15, ras: -5,  rae: 15 }],
    [0.06, { x: -0.6, y: -13,   lean: 14, nod: 5,   las: -30, lae: 15, ras: -36, rae: 15 }],
    [0.14, { x: -1.5, y: -10,   lean: 28, nod: -12, las: -70, lae: 22, ras: -76, rae: 18 }]
  ]});

  // land: squash on impact (head keeps going = overlap), then recover to standing.
  def('land', { dur: 0.24, keys: [
    [0.0,  { x: 0, y: -14,   lean: 10, nod: 0,  las: 120, lae: 20, ras: 110, rae: 25, lfx: -4, rfx: 4 }],
    [0.06, { x: 0, y: -10.5, lean: 22, nod: 12, las: 50,  lae: 35, ras: 35,  rae: 40 }],
    [0.13, { x: 0, y: -12,   lean: 16, nod: 6,  las: 20,  lae: 25, ras: 10,  rae: 25 }],
    [0.24, { x: 0, y: -16.6, lean: 4,  nod: 0,  las: 6,   lae: 12, ras: -6,  rae: 16, lfx: -3, rfx: 3 }]
  ]});

  // ledgeReach: rise onto the toes and throw both arms straight up, eyes on the ledge.
  def('ledgeReach', { dur: 0.2, keys: [
    [0.0, { y: -16.6, lean: 4,  nod: 0,   las: 10,  lae: 20, ras: 0,   rae: 20, lfx: -2.5, rfx: 2.5 }],
    [0.1, { y: -17.0, lean: 2,  nod: -15, las: 110, lae: 30, ras: 100, rae: 35 }],
    [0.2, { y: -17.6, lean: -2, nod: -25, las: 172, lae: 4,  ras: 165, rae: 8 }]
  ]});

  // balance: on a moving piece. Wide soft stance, hips wobble, arms windmill to compensate.
  def('balance', { dur: 1.6, loop: true, face: 'strain', keys: [
    [0.0, { x: 1.2,  y: -15.2, lean: 9,   nod: -6, las: 105, lae: 20, ras: -95,  rae: 15, lfx: -4.5, rfx: 4.5 }],
    [0.4, { x: -0.4, y: -15.6, lean: -3,  nod: 4,  las: 70,  lae: 45, ras: -120, rae: 30 }],
    [0.8, { x: -1.4, y: -15.0, lean: -10, nod: 8,  las: 125, lae: 15, ras: -75,  rae: 35 }],
    [1.2, { x: 0.3,  y: -15.5, lean: 2,   nod: -2, las: 85,  lae: 35, ras: -105, rae: 20 }]
  ]});

  // stumble: toe catches, body pitches forward, arms flail, a catch step, recovery.
  def('stumble', { dur: 0.5, keys: [
    [0.0,  { x: -2,   y: -16.4, lean: 6,  nod: 0,   lfx: -5, lfy: 0,  rfx: 1,  rfy: 0,  las: 10,  lae: 15, ras: -10, rae: 15 }],
    [0.07, { x: -0.5, y: -15.5, lean: 26, nod: -10, lfx: -4, lfy: 0,  rfx: -8, rfy: -3, las: 120, lae: 30, ras: 50,  rae: 50, face: 'scared' }],
    [0.18, { x: 2.5,  y: -13,   lean: 42, nod: -18, lfx: 6,  lfy: 0,  rfx: -7, rfy: -5, las: 60,  lae: 60, ras: 160, rae: 20 }],
    [0.3,  { x: 1.5,  y: -14,   lean: 28, nod: -10, lfx: 5,  lfy: 0,  rfx: 1,  rfy: -4, las: 150, lae: 30, ras: 80,  rae: 50 }],
    [0.4,  { x: 0.6,  y: -16,   lean: 12, nod: -2,  lfx: 4,  lfy: 0,  rfx: -2, rfy: 0,  las: 40,  lae: 25, ras: 20,  rae: 30, face: 'normal' }],
    [0.5,  { x: 0,    y: -16.6, lean: 4,  nod: 0,   lfx: 3,  lfy: 0,  rfx: -3, rfy: 0,  las: 6,   lae: 12, ras: -6,  rae: 16 }]
  ]});

  // dazed: sitting, legs out front, arm propped back, head lolling in a slow circle.
  def('dazed', { dur: 1.6, loop: true, face: 'dizzy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0, { x: -3,   y: -3, lean: 4,  nod: 18,  hd: 8,   las: 35, lae: 40, ras: -30, rae: 6, lls: 100, llk: 40, rls: 95, rlk: 35 }],
    [0.4, { x: -2.7, y: -3, lean: 10, nod: 5,   hd: 7.4, las: 40, lae: 45 }],
    [0.8, { x: -3,   y: -3, lean: 6,  nod: -14, hd: 8,   las: 36, lae: 38, ras: -28 }],
    [1.2, { x: -3.3, y: -3, lean: -2, nod: 4,   hd: 8.6, las: 30, lae: 35, ras: -32 }]
  ]});

  // squashed: flattened face-down under a block (~12px tall): torso flat, one arm along the
  // body, one flung forward, lower legs flipped up behind; a leg twitches.
  def('squashed', { dur: 1.0, face: 'dizzy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -9,  y: -7,   lean: 65, nod: 10, las: -60, lae: 20, ras: 70, rae: 50, lls: -40, llk: 40,  rls: -70, rlk: 50 }],
    [0.08, { x: -10, y: -2.6, lean: 90, nod: -3, las: -96, lae: 6,  ras: 96, rae: 30, lls: -96, llk: 40,  rls: -92, rlk: 70 }],
    [0.2,  { x: -10, y: -3.2, lean: 88, nod: -4, las: -95, lae: 10, ras: 94, rae: 40, lls: -95, llk: 50,  rls: -93, rlk: 62 }],
    [0.6,  { lls: -95, llk: 50 }],
    [0.72, { lls: -95, llk: 85 }],
    [0.84, { lls: -95, llk: 45 }],
    [1.0,  { lls: -95, llk: 50 }]
  ]});

  // celebrate: hop for joy, arms in a V, heels kicked back at the top (~10px air).
  def('celebrate', { dur: 0.6, loop: true, face: 'happy', keys: [
    [0.0,  { x: 0, y: -12.5, lean: 10, nod: 8,   lfx: -3, lfy: 0,   rfx: 3,   rfy: 0,     las: 125, lae: 30, ras: 135, rae: 25 }],
    [0.12, { x: 0, y: -17.6, lean: 2,  nod: -6,  lfx: -2, lfy: 0,   rfx: 2.5, rfy: 0,     las: 160, lae: 10, ras: 168, rae: 8 }],
    [0.3,  { x: 0, y: -26.5, lean: -4, nod: -14, lfx: -7, lfy: -12, rfx: -4,  rfy: -10.5, las: 150, lae: 20, ras: 160, rae: 15 }],
    [0.45, { x: 0, y: -24,   lean: -2, nod: -8,  lfx: -2, lfy: -7,  rfx: 2,   rfy: -6,    las: 145, lae: 22, ras: 155, rae: 18 }],
    [0.54, { x: 0, y: -16.5, lean: 4,  nod: 2,   lfx: -3, lfy: 0,   rfx: 3,   rfy: 0,     las: 135, lae: 25, ras: 145, rae: 20 }]
  ]});

  // wave: right arm up, forearm waving twice a second, a little happy bounce.
  def('wave', { dur: 1.0, loop: true, face: 'happy', keys: [
    [0.0,  { y: -16.8, lean: 2, nod: -4, las: 5, lae: 12, ras: 150, rae: 12 }],
    [0.25, { y: -16.5, lean: 3, nod: -2, ras: 145, rae: 55 }],
    [0.5,  { y: -16.8, lean: 2, nod: -4, ras: 152, rae: 8 }],
    [0.75, { y: -16.5, lean: 3, nod: -2, ras: 146, rae: 50 }]
  ]});

  // push: leaning into something to the right (contact at x~+16), feet re-plant in turn.
  def('push', { dur: 1.0, loop: true, face: 'strain', mode: { la: 'ik', ra: 'ik' }, keys: [
    [0.0,  { x: -3,   y: -14,   lean: 35, nod: -15, lhx: 16, lhy: -28, rhx: 16.5, rhy: -25, lfx: -10, lfy: 0, rfx: 1, rfy: 0 }],
    [0.25, { x: -2.4, y: -14.4, lean: 33, nod: -12, rfx: 1.5, rfy: -3 }],
    [0.5,  { x: -2,   y: -14.5, lean: 36, nod: -15, rfx: 2,  rfy: 0 }],
    [0.75, { x: -2.6, y: -14.2, lean: 34, nod: -13, lfx: -8.5, lfy: -3 }]
  ]});

  // brace: flinch - duck, forearms folded over the head, eyes squeezed.
  def('brace', { dur: 0.3, face: 'scared', keys: [
    [0.0,  { x: 0,    y: -16.6, lean: 3,  nod: 0,  las: 6,   lae: 12, ras: -6,  rae: 16, lfx: -4, rfx: 3 }],
    [0.08, { x: -1,   y: -13,   lean: 16, nod: -6, las: 118, lae: 70, ras: 96,  rae: 80 }],
    [0.3,  { x: -1.5, y: -12,   lean: 18, nod: -4, las: 115, lae: 72, ras: 94,  rae: 82 }]
  ]});

  /* --------------------------------------------------------------------- AIR */

  // jumpUp: full extension with arms thrown up, then knees tuck. Origin = feet.
  def('jumpUp', { dur: 0.3, mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0, { y: -17.8, lean: 6, nod: -5,  las: 150, lae: 10, ras: 165, rae: 15, lls: -4, llk: 4,   rls: 2,  rlk: 6 }],
    [0.1, { y: -18,   lean: 2, nod: -10, las: 170, lae: 8,  ras: 175, rae: 10, lls: -6, llk: 10,  rls: 4,  rlk: 12 }],
    [0.3, { y: -14,   lean: 4, nod: 0,   las: 125, lae: 40, ras: 140, rae: 35, lls: 60, llk: 105, rls: 75, rlk: 115 }]
  ]});

  // fallDown: arms flailing overhead, legs bicycling.
  def('fallDown', { dur: 0.6, loop: true, face: 'scared', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { y: -17,   lean: -4, nod: -12, las: 150, lae: 30, ras: 165, rae: 10, lls: 25,  llk: 30, rls: 10,  rlk: 70 }],
    [0.15, { y: -17.5, lean: -6, nod: -16, las: 175, lae: 10, ras: 130, rae: 45, lls: 45,  llk: 80, rls: -10, rlk: 20 }],
    [0.3,  { y: -17,   lean: -3, nod: -10, las: 135, lae: 45, ras: 160, rae: 15, lls: 10,  llk: 70, rls: 25,  rlk: 30 }],
    [0.45, { y: -16.6, lean: -5, nod: -14, las: 160, lae: 20, ras: 140, rae: 35, lls: -10, llk: 20, rls: 45,  rlk: 80 }]
  ]});

  // tumble: curled ball with limbs flung, centred near (0,-18); engine spins it.
  def('tumble', { dur: 0.6, loop: true, face: 'dizzy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -9.5, y: -8,    lean: 40, nod: 30, lls: 115, llk: 125, rls: 100, rlk: 110, las: 200, lae: 20, ras: 120, rae: 70 }],
    [0.15, { x: -9,   y: -8.5, lean: 35, nod: 20, lls: 80,  llk: 40,  rls: 120, rlk: 130, las: 150, lae: 60, ras: 210, rae: 15 }],
    [0.3,  { x: -9.5, y: -8,    lean: 45, nod: 35, lls: 120, llk: 130, rls: 70,  rlk: 30,  las: 110, lae: 90, ras: 180, rae: 30 }],
    [0.45, { x: -9,   y: -7.5, lean: 38, nod: 25, lls: 100, llk: 100, rls: 110, rlk: 120, las: 230, lae: 25, ras: 140, rae: 60 }]
  ]});

  /* ------------------------------------------------------------ BLOCK / WALL */

  // hang: origin = grip (block top-left corner, block at x>0,y>0). Hands pinned at (0,0);
  // body dangles below-left like a pendulum, legs lag behind the swing, one small kick.
  var HANG_ARMS = { mode: { la: 'ik', ra: 'ik', ll: 'fk', rl: 'fk' }, bend: { la: 1, ra: 1 } };
  def('hang', { dur: 2.4, loop: true, root: 'neck', face: 'strain', mode: HANG_ARMS.mode, bend: HANG_ARMS.bend, keys: [
    [0.0, { x: -7.2, y: 14.6, lean: -6,  nod: -10, lhx: 0, lhy: 0, rhx: 0, rhy: 0, lls: 6,  llk: 15, rls: -2, rlk: 25 }],
    [0.6, { x: -6.3, y: 15.0, lean: -10, nod: -12, lls: 12, llk: 22, rls: 4,  rlk: 30 }],
    [1.2, { x: -5.5, y: 15.3, lean: -12, nod: -10, lls: 8,  llk: 14, rls: 6,  rlk: 62 }],
    [1.8, { x: -6.4, y: 15.0, lean: -8,  nod: -8,  lls: 0,  llk: 10, rls: 6,  rlk: 22 }]
  ]});

  // hangShimmy: hand-over-hand along the edge. Each hand lifts and moves +x while the
  // other holds; planted hand slides -x 4px per 0.25s -> shimmy ~16 px/s at speed 1.
  def('hangShimmy', { dur: 0.5, loop: true, speedable: true, root: 'neck', face: 'strain', mode: HANG_ARMS.mode, bend: HANG_ARMS.bend, keys: [
    [0.0,   { x: -6.5, y: 15.2, lean: -8, nod: -10, lhx: 2,  lhy: 0,    rhx: -2, rhy: 0,    lls: 4,  llk: 14, rls: 8,  rlk: 22 }],
    [0.125, { x: -6.0, y: 14.7, lean: -6, nod: -12, lhx: 0,  lhy: 0,    rhx: 0,  rhy: -1.8, lls: 8,  llk: 20, rls: 2,  rlk: 16 }],
    [0.25,  { x: -6.5, y: 15.2, lean: -8, nod: -10, lhx: -2, lhy: 0,    rhx: 2,  rhy: 0,    lls: 8,  llk: 22, rls: 4,  rlk: 14 }],
    [0.375, { x: -7.0, y: 14.7, lean: -9, nod: -12, lhx: 0,  lhy: -1.8, rhx: 0,  rhy: 0,    lls: 2,  llk: 16, rls: 8,  rlk: 20 }]
  ]});

  // pullUp: origin = grip. Starts as hang, pulls chest to the edge, presses down with
  // elbows up, right foot steps onto the ledge, stands at feet ~(5..11, 0), hip (8,-16.8).
  def('pullUp', { dur: 0.55, root: 'neck', face: 'strain', mode: { la: 'ik', ra: 'ik' }, bend: { la: 1, ra: 1 }, keys: [
    [0.0,  { x: -6.5, y: 15,   lean: -8, nod: -12, lhx: 0, lhy: 0, rhx: 0, rhy: 0, lfx: -3.6, lfy: 49.3, rfx: -2.6, rfy: 49 }],
    [0.14, { x: -4.5, y: 5,    lean: 4,  nod: -14, lfx: -2, lfy: 33, rfx: -9, rfy: 37 }],
    [0.26, { x: -0.5, y: -5,   lean: 25, nod: -10, lfx: -6, lfy: 26, rfx: -1, rfy: 15 }],
    [0.36, { x: 3,    y: -12,  lean: 35, nod: 0,   lhx: 0, lhy: 0, rhx: 0, rhy: 0, lfx: -7, lfy: 15, rfx: 3, rfy: 0 }],
    [0.46, { x: 7.5,  y: -26,  lean: 18, nod: 0,   lhx: 5, lhy: -12, rhx: 7, rhy: -11, lfx: 4, lfy: -3, rfx: 6, rfy: 0, face: 'normal' }],
    [0.55, { x: 8.89, y: -33.78, lean: 3, nod: 0,  lhx: 9.8, lhy: -16.8, rhx: 8.2, rhy: -16.5, lfx: 5, lfy: 0, rfx: 11, rfy: 0 }]
  ]});

  // climb: origin = feet contact; wall face at x~+7. Contralateral hand/foot pairs: a
  // gripping hand slides 11px down per half cycle -> climb rate ~37 px/s at speed 1.
  def('climb', { dur: 0.6, loop: true, speedable: true, face: 'strain', mode: { la: 'ik', ra: 'ik' }, keys: [
    [0.0,  { x: -2.5, y: -15.5, lean: 10, nod: -12, rhx: 7, rhy: -44,   lhx: 7, lhy: -33,   lfx: 6.5, lfy: -11,  rfx: 6.5, rfy: 0 }],
    [0.15, { x: -3.0, y: -16,   lean: 12, nod: -16, rhx: 7, rhy: -38.5, lhx: 3.5,   lhy: -41,   lfx: 6.5, lfy: -5.5, rfx: 3.5,   rfy: -7 }],
    [0.3,  { x: -2.5, y: -15.5, lean: 10, nod: -12, rhx: 7, rhy: -33,   lhx: 7, lhy: -44,   lfx: 6.5, lfy: 0,    rfx: 6.5, rfy: -11 }],
    [0.45, { x: -2.0, y: -16,   lean: 12, nod: -16, rhx: 3.5,   rhy: -41,   lhx: 7, lhy: -38.5, lfx: 3.5,   lfy: -7,   rfx: 6.5, rfy: -5.5 }]
  ]});

  /* -------------------------------------------------------------------- API */

  var names = Object.keys(MOTIONS);

  function get(name) { return MOTIONS[name] || MOTIONS.idle; }

  function sample(name, t, opts) {
    var mo = get(name);
    t = +t || 0;
    if (mo.spec.speedable && opts && opts.speed != null && isFinite(opts.speed)) t *= opts.speed;
    return build(mo, evalMotion(mo, t));
  }

  function blend(a, b, k) {
    k = Math.max(0, Math.min(1, +k || 0));
    var out = {};
    JOINTS.forEach(function (j) {
      var pa = a[j], pb = b[j];
      out[j] = [pa[0] + (pb[0] - pa[0]) * k, pa[1] + (pb[1] - pa[1]) * k];
    });
    out.face = k < 0.5 ? (a.face || 'normal') : (b.face || 'normal');
    return out;
  }

  window.StickMotions = {
    sample: sample,
    duration: function (name) { return get(name).dur; },
    loops: function (name) { return get(name).loop; },
    names: names,
    blend: blend,
    joints: JOINTS.slice(),
    // add a motion from another file: StickMotions.define(name, spec), spec as for def() above
    define: function (name, spec) { def(name, spec); if (names.indexOf(name) < 0) names.push(name); }
  };
})();
