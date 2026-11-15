/* motions-recover.js - recovery motions (getting up after a piece got him).
 * Origin = feet contact, figure facing +x, same channel format as motions.js.
 * Every get-up ends in the standing pose that idle/walk start from, so the engine's blend
 * into the next motion is short and invisible. Faces switch dizzy -> normal part-way up
 * (the engine fades the stars out on its own). */
(function () {
  'use strict';
  var def = window.StickMotions && window.StickMotions.define;
  if (!def) return;

  // FK standing pose with the legs in FK mode (feet land at y ~ 0 with hip y -17.8).
  var STAND_FK = { x: 0, y: -17.8, lean: 3, nod: 0, hd: 8, las: 6, lae: 12, ras: -6, rae: 16, lls: -4, llk: 6, rls: 4, rlk: 6, face: 'normal' };
  // the sitting pose of 'dazed' at t=0, so get-ups start exactly where the sit loop is
  var SIT = { x: -3, y: -3, lean: 4, nod: 18, hd: 8, las: 35, lae: 40, ras: -30, rae: 6, lls: 100, llk: 40, rls: 95, rlk: 35 };
  function k(base, over) { var o = {}, p; for (p in base) o[p] = base[p]; for (p in over || {}) o[p] = over[p]; return o; }

  // roll: lands curled from a tumble, rolls once (engine adds the spin), opens into the sit.
  def('recover_roll', { dur: 0.42, face: 'dizzy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -1, y: -9, lean: 45, nod: 30, hd: 8, las: 160, lae: 50, ras: 120, rae: 70, lls: 115, llk: 125, rls: 100, rlk: 110 }],
    [0.2,  { x: -2, y: -6, lean: 22, nod: 26, las: 80, lae: 50, ras: 40, rae: 45, lls: 102, llk: 70, rls: 96, rlk: 60 }],
    [0.42, SIT]
  ]});

  // flat: popped out from under a block and lying face-down like a pancake. Head lifts
  // groggily, one lower leg flops. Loops while he is down.
  def('recover_flat', { dur: 1.4, loop: true, face: 'dizzy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -10, y: -3.4, lean: 85, nod: -8,  hd: 8, las: -95, lae: 8, ras: 92, rae: 30, lls: -95, llk: 40, rls: -93, rlk: 55 }],
    [0.35, { nod: -20, ras: 96, rae: 45 }],
    [0.7,  { nod: -6, llk: 72 }],
    [1.05, { nod: -15, ras: 90, rae: 25, llk: 40 }]
  ]});

  // peelUp: from flat: hands slap down under the shoulders, push-up, knees tuck in, rise,
  // overshoot tall (springing back into shape), settle.
  def('recover_peelUp', { dur: 1.0, face: 'dizzy', mode: { la: 'ik', ra: 'ik', ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -10, y: -3.4, lean: 85, nod: -8,  hd: 8, lhx: -9, lhy: -3, rhx: 15, rhy: -2, lls: -95, llk: 40, rls: -93, rlk: 55 }],
    [0.2,  { x: -10, y: -3.4, lean: 84, nod: -16, lhx: 5, lhy: 0, rhx: 8, rhy: 0 }],
    [0.4,  { x: -9,  y: -4.5, lean: 50, nod: -12, lls: -80, llk: 60, rls: -84, rlk: 64 }],
    [0.58, { x: -3,  y: -9,   lean: 55, nod: -6,  lhx: 6, lhy: 0, rhx: 8, rhy: 0, lls: 62, llk: 124, rls: 55, rlk: 115 }],
    [0.76, { x: -1,  y: -16.6, lean: 20, nod: 4, lhx: -1, lhy: -13, rhx: 4, rhy: -14, lls: 25, llk: 45, rls: 18, rlk: 40, face: 'normal' }],
    [0.88, { x: 0,   y: -18,  lean: -3, nod: -10, lhx: -3, lhy: -19, rhx: 3.5, rhy: -19, lls: -2, llk: 0, rls: 2, rlk: 0 }],
    [1.0,  { x: 0,   y: -17.8, lean: 3, nod: 0,   lhx: -2, lhy: -17, rhx: 3, rhy: -16.5, lls: -4, llk: 6, rls: 4, rlk: 6 }]
  ]});

  // groggyUp: after a big hit. Shakes his head, rolls onto one knee with a hand on it,
  // pushes up, staggers back a step, then stands.
  def('recover_groggyUp', { dur: 1.3, face: 'dizzy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  SIT],
    [0.12, { nod: -12, lean: 0, hd: 8.4 }],
    [0.24, { nod: 22, lean: 6, hd: 8 }],
    [0.34, { nod: -8, lean: 2 }],
    [0.44, { nod: 14, lean: 5 }],
    [0.49, { lls: 120, llk: 130 }],
    [0.54, { x: -2, y: -5.5, lean: 18, nod: 12, las: 30, lae: 35, ras: -10, rae: 6, lls: 60, llk: 140, rls: 88, rlk: 40 }],
    [0.64, { x: -1, y: -8, lean: 30, nod: 8, las: 25, lae: 30, ras: 2, rae: 4, lls: 20, llk: 110, rls: 80, rlk: 35 }],
    [0.86, { x: 0, y: -12.3, lean: 32, nod: 4, las: 30, lae: 30, ras: 8, rae: 10, lls: 45, llk: 90, rls: 50, rlk: 100, face: 'normal' }],
    [1.06, { x: -1.2, y: -17.4, lean: -7, nod: 10, las: -25, lae: 30, ras: 35, rae: 25, lls: -8, llk: 6, rls: 8, rlk: 10 }],
    [1.3,  STAND_FK]
  ]});

  // quickUp: light hit. Tuck, push off both hands and spring straight up.
  def('recover_quickUp', { dur: 0.62, face: 'dizzy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  SIT],
    [0.07, { x: -2.6, y: -4.6, lean: 14, nod: 4, las: 0, lae: 20, ras: -30, rae: 10, lls: 112, llk: 150, rls: 108, rlk: 145 }],
    [0.14, { x: -2, y: -6.3, lean: 28, nod: 10, las: -30, lae: 10, ras: -25, rae: 15, lls: 75, llk: 140, rls: 65, rlk: 130 }],
    [0.3,  { x: 0, y: -15.5, lean: 16, nod: -4, las: 70, lae: 30, ras: 55, rae: 35, lls: 35, llk: 70, rls: 25, rlk: 55, face: 'normal' }],
    [0.45, { x: 0, y: -18, lean: -3, nod: -8, las: 40, lae: 20, ras: 30, rae: 20, lls: -2, llk: 0, rls: 2, rlk: 0 }],
    [0.62, STAND_FK]
  ]});

  // shakeOff: standing, flicks both arms out loose and shakes his head. Quick.
  def('recover_shakeOff', { dur: 0.6, keys: [
    [0.0,  { x: 0,    y: -16.8, lean: 4, nod: 4,  las: 10, lae: 10, ras: -10, rae: 10, lfx: -3.5, rfx: 3.5 }],
    [0.08, { x: 0.5,  y: -16.4, nod: -6, las: 42, lae: 55, ras: -40, rae: 50 }],
    [0.16, { x: -0.5, y: -16.7, nod: 7,  las: -12, lae: 4, ras: 22, rae: 6 }],
    [0.24, { x: 0.5,  y: -16.4, nod: -6, las: 45, lae: 58, ras: -36, rae: 55 }],
    [0.32, { x: -0.3, y: -16.7, nod: 6,  las: -6, lae: 5, ras: 16, rae: 5 }],
    [0.42, { x: 0,    y: -16.6, nod: 0,  las: 28, lae: 38, ras: -24, rae: 36 }],
    [0.6,  { x: 0,    y: -16.8, lean: 3, nod: 0, las: 6, lae: 12, ras: -6, rae: 16, lfx: -3, rfx: 3 }]
  ]});

  // fist: annoyed. Hand on hip, glares up, shakes a fist at the piece / the player.
  def('recover_fist', { dur: 1.0, face: 'grit', keys: [
    [0.0,  { x: 0,    y: -16.8, lean: 2,  nod: -6,  las: -18, lae: 55, ras: 60,  rae: 60, lfx: -4, rfx: 4.5 }],
    [0.12, { x: -0.8, y: -16.4, lean: -6, nod: -14, las: -28, lae: 75, ras: 118, rae: 60 }],
    [0.22, { ras: 132, rae: 20 }],
    [0.32, { y: -16.1, ras: 122, rae: 70 }],
    [0.42, { y: -16.6, ras: 134, rae: 18 }],
    [0.52, { y: -16.1, ras: 122, rae: 70 }],
    [0.62, { y: -16.6, ras: 132, rae: 24 }],
    [0.8,  { x: -0.2, lean: 0, nod: -8, las: -10, lae: 40, ras: 90, rae: 60 }],
    [1.0,  { x: 0,    y: -16.8, lean: 3, nod: 0, las: 6, lae: 12, ras: -6, rae: 16, lfx: -3, rfx: 3, face: 'normal' }]
  ]});

  // dust: bends a little and pats the dust off his legs, then straightens up.
  def('recover_dust', { dur: 0.75, keys: [
    [0.0,  { x: 0,   y: -16.8, lean: 4,  nod: 2,  las: 6,  lae: 12, ras: -6, rae: 16, lfx: -3.5, rfx: 3.5 }],
    [0.14, { x: -1,  y: -15.4, lean: 26, nod: 14, las: 30, lae: 40, ras: 10, rae: 30 }],
    [0.24, { las: 10, lae: 20, ras: 34, rae: 44 }],
    [0.34, { las: 34, lae: 44, ras: 12, rae: 22 }],
    [0.44, { las: 12, lae: 22, ras: 36, rae: 46 }],
    [0.58, { x: 0,   y: -16.6, lean: 6, nod: -2, las: 12, lae: 20, ras: 2, rae: 20 }],
    [0.75, { x: 0,   y: -16.8, lean: 3, nod: 0,  las: 6, lae: 12, ras: -6, rae: 16, lfx: -3, rfx: 3 }]
  ]});
})();
