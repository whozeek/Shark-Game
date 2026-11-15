/* motions-near.js - near misses, shockwaves and dodge choreography.
 * Same spec as motions.js def(). All recoil motions face the impact (+x) and recoil toward -x;
 * the engine turns him to face the impact, and moves him with velocity, so the motions end
 * centred over the origin (feet at about +-3) to blend cleanly back into idle/walk.
 * Faces: near_wide (eyes wide), near_shut (squeezed), near_phew (eyes closed, puffing out). */
(function () {
  'use strict';
  var D = StickMotions.define;
  var STAND = { x: 0, y: -16.8, lean: 3, nod: 0, las: 6, lae: 12, ras: -6, rae: 16, lfx: -3, lfy: 0, rfx: 3, rfy: 0 };
  function st(extra) { var o = {}, k; for (k in STAND) o[k] = STAND[k]; for (k in extra || {}) o[k] = extra[k]; return o; }

  /* ----------------------------------------------------------- anticipation */

  // startle: head snaps up at the piece, shoulders hunch, hands half up, eyes wide.
  D('near_startle', { dur: 0.22, face: 'near_wide', keys: [
    [0.0,  st()],
    [0.07, { x: -0.8, y: -16.0, lean: -6, nod: -26, las: 35, lae: 70, ras: 25, rae: 75 }],
    [0.22, { x: -1.2, y: -15.6, lean: -8, nod: -30, las: 55, lae: 85, ras: 45, rae: 90 }]
  ]});

  // burst: the first push-off step out of the startle, deep lean, rear leg driving.
  D('near_burst', { dur: 0.16, face: 'near_wide', keys: [
    [0.0,  { x: -1, y: -15.6, lean: -6, nod: -28, las: 55, lae: 85, ras: 45, rae: 90, lfx: -3, lfy: 0, rfx: 3, rfy: 0 }],
    [0.06, { x: 0,  y: -13.5, lean: 22, nod: -10, las: -40, lae: 70, ras: 60, rae: 80, lfx: -6, lfy: 0, rfx: 5, rfy: -5 }],
    [0.16, { x: 1.5, y: -14.8, lean: 26, nod: -12, las: -50, lae: 65, ras: 55, rae: 85, lfx: -9, lfy: -1, rfx: 8, rfy: -2 }]
  ]});

  // sprint: panic run, stronger lean than run, head down, arms pumping hard.
  (function () {
    var R = [[8, 0], [3, 0], [-3, 0], [-9, -1.5], [-9, -10], [-2, -11], [6, -9.5], [10, -3.5]];
    var ARM = [-60, -48, 8, 52, 66, 50, -8, -48];
    var ELB = [60, 70, 95, 104, 98, 88, 70, 58];
    var HY = [-14.8, -14.3, -15.0, -16.2], NOD = [-2, 0, -3, -5];
    var keys = [];
    for (var i = 0; i < 8; i++) {
      var o = (i + 4) % 8;
      keys.push([0.34 * i / 8, { x: 0, y: HY[i % 4], lean: 24, nod: NOD[i % 4],
        rfx: R[i][0], rfy: R[i][1], lfx: R[o][0], lfy: R[o][1], ras: ARM[i], rae: ELB[i], las: ARM[o], lae: ELB[o] }]);
    }
    D('near_sprint', { dur: 0.34, loop: true, face: 'near_wide', keys: keys });
  })();

  // skid: stopping hard, weight thrown back, front foot planted ahead, arms out.
  D('near_skid', { dur: 0.3, face: 'near_wide', keys: [
    [0.0,  { x: 2,    y: -15,   lean: 20,  nod: -8,  las: -40, lae: 60, ras: 50, rae: 70, lfx: -6, lfy: 0, rfx: 6,  rfy: -2 }],
    [0.08, { x: -1.5, y: -13.5, lean: -14, nod: -6,  las: 70,  lae: 30, ras: 95, rae: 25, lfx: -3, lfy: 0, rfx: 10, rfy: 0 }],
    [0.3,  { x: -0.5, y: -15.8, lean: -6,  nod: -16, las: 40,  lae: 40, ras: 55, rae: 40, lfx: -4, rfx: 5 }]
  ]});

  // watch: on guard, weight back, following the piece (the engine aims the head at it).
  D('near_watch', { dur: 1.4, loop: true, face: 'near_wide', keys: [
    [0.0, { x: -0.8, y: -16.2, lean: -5, nod: -14, las: 40, lae: 60, ras: 30, rae: 65, lfx: -4.5, lfy: 0, rfx: 4, rfy: 0 }],
    [0.7, { x: -1.1, y: -15.8, lean: -7, nod: -18, las: 44, lae: 64, ras: 34, rae: 70 }]
  ]});

  // phew: deflate onto the knees, a breath, straighten and wipe the brow.
  D('near_phew', { dur: 1.2, face: 'near_phew', mode: { la: 'ik', ra: 'ik' }, keys: [
    [0.0,  { x: -0.8, y: -16.2, lean: -5, nod: -10, lhx: 3, lhy: -20, rhx: 5, rhy: -22, lfx: -4.5, lfy: 0, rfx: 4, rfy: 0 }],
    [0.2,  { x: -1.5, y: -14.5, lean: 32, nod: 12, lhx: 5, lhy: -12, rhx: 8, rhy: -12, lfx: -5, rfx: 5 }],
    [0.45, { x: -1.3, y: -14.9, lean: 28, nod: 8 }],
    [0.62, { x: -1.5, y: -14.5, lean: 31, nod: 12 }],
    [0.82, { x: -0.5, y: -16.2, lean: 2,  nod: -4, lhx: 0, lhy: -17, rhx: 6, rhy: -41 }],
    [0.98, { rhx: -1, rhy: -43 }],
    [1.2,  { x: 0, y: -16.8, lean: 3, nod: 0, lhx: -1, lhy: -17, rhx: 2, rhy: -17, lfx: -3, rfx: 3, face: 'normal' }]
  ]});

  /* ------------------------------------------------------------- shockwave */

  // glance: a far thump - quick look toward it, tiny shoulder jerk.
  D('near_glance', { dur: 0.6, keys: [
    [0.0,  st()],
    [0.08, { x: -0.6, y: -16.4, lean: -4, nod: 6, las: 20, lae: 30, ras: 10, rae: 35, face: 'near_wide' }],
    [0.45, { x: -0.4, y: -16.6, lean: -2, nod: 4 }],
    [0.6,  st({ face: 'normal' })]
  ]});

  // flinch: arms snap up in front of the face, one foot steps back, eyes squeezed.
  D('near_flinch', { dur: 0.5, face: 'near_shut', keys: [
    [0.0,  st()],
    [0.06, { x: -3,   y: -15,   lean: -14, nod: 10, las: 110, lae: 95, ras: 95, rae: 100, lfx: -7, lfy: -2, rfx: 2 }],
    [0.16, { x: -3.5, y: -14.8, lean: -10, nod: 8,  lfx: -8, lfy: 0 }],
    [0.34, { x: -1.5, y: -15.8, lean: -4,  nod: 2,  las: 50, lae: 40, ras: 30, rae: 45, lfx: -5, rfx: 2.5, face: 'normal' }],
    [0.5,  st({ face: 'normal' })]
  ]});

  // hop: startled jump in place, knees up, arms flung out, squash on landing.
  D('near_hop', { dur: 0.55, face: 'near_wide', keys: [
    [0.0,  st()],
    [0.05, { x: -0.5, y: -14,   lean: 10, nod: -8,  las: -20, lae: 30, ras: -25, rae: 30 }],
    [0.14, { x: -1,   y: -25,   lean: -8, nod: -20, las: 120, lae: 40, ras: 140, rae: 30, lfx: -4, lfy: -7, rfx: 1, rfy: -9 }],
    [0.26, { x: -1.5, y: -22,   lean: -4, nod: -14, lfx: -4, lfy: -3, rfx: 2, rfy: -4 }],
    [0.34, { x: -1,   y: -13.5, lean: 12, nod: 6,   las: 60,  lae: 40, ras: 70,  rae: 40, lfx: -4, lfy: 0, rfx: 3, rfy: 0 }],
    [0.55, st({ face: 'normal' })]
  ]});

  // stagger: blown backwards, catch steps, arms windmilling for balance.
  D('near_stagger', { dur: 0.8, face: 'near_wide', keys: [
    [0.0,  st()],
    [0.06, { x: -2,   y: -15,   lean: -18, nod: 14, las: 130, lae: 30, ras: 70,  rae: 60, lfx: -8, lfy: -5, rfx: 5,  rfy: 0, face: 'near_shut' }],
    [0.18, { x: -1,   y: -14.5, lean: -22, nod: 10, las: 60,  lae: 50, ras: 150, rae: 20, lfx: -6, lfy: 0,  rfx: 8,  rfy: 0 }],
    [0.3,  { x: -2,   y: -15,   lean: -16, nod: 6,  las: 150, lae: 20, ras: 60,  rae: 60, lfx: 3,  lfy: 0,  rfx: -6, rfy: -5, face: 'near_wide' }],
    [0.42, { x: -1.5, y: -15.2, lean: -12, nod: 4,  las: 80,  lae: 40, ras: 130, rae: 30, lfx: 6,  lfy: 0,  rfx: -5, rfy: 0 }],
    [0.56, { x: -0.5, y: -15.8, lean: -6,  nod: 2,  las: 110, lae: 30, ras: 60,  rae: 40, lfx: 2,  lfy: -4, rfx: -3, rfy: 0 }],
    [0.8,  st({ face: 'normal' })]
  ]});

  // bowl: bowled over onto his backside; ends exactly on the dazed sitting pose.
  D('near_bowl', { dur: 0.45, face: 'near_shut', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: 0,  y: -16.6, lean: -10, nod: 10,  las: 120, lae: 30, ras: 100, rae: 40, lls: -5, llk: 8,  rls: 5,  rlk: 8 }],
    [0.15, { x: -2, y: -10,   lean: -25, nod: 15,  las: 150, lae: 20, ras: 140, rae: 20, lls: 40, llk: 30, rls: 55, rlk: 40 }],
    [0.28, { x: -3, y: -2.5,  lean: -8,  nod: -10, las: 60,  lae: 30, ras: -40, rae: 10, lls: 100, llk: 30, rls: 90, rlk: 25 }],
    [0.45, { x: -3, y: -3,    lean: 4,   nod: 18,  las: 35,  lae: 40, ras: -30, rae: 6,  lls: 100, llk: 40, rls: 95, rlk: 35, face: 'dizzy' }]
  ]});

  // teeter: heels on the edge (local x ~ +2), hips hanging out over the drop behind him,
  // arms windmilling to get the weight back over his feet.
  D('near_teeter', { dur: 0.8, loop: true, face: 'near_wide', keys: [
    [0.0, { x: -1.5, y: -16,   lean: -20, nod: -4, las: 160, lae: 20, ras: 40,  rae: 30, lfx: 1.5, lfy: 0, rfx: 4.5, rfy: 0 }],
    [0.2, { x: -2.5, y: -15.4, lean: -28, nod: -10, las: 240, lae: 30, ras: 120, rae: 20, rfy: -2 }],
    [0.4, { x: -1,   y: -16.2, lean: -14, nod: 2,  las: 60,  lae: 20, ras: 180, rae: 20, rfy: 0 }],
    [0.6, { x: -2,   y: -15.6, lean: -25, nod: -8, las: 110, lae: 40, ras: 250, rae: 30, lfy: -2 }]
  ]});

  // recover: got it - lunge forward off the edge, then stand.
  D('near_recover', { dur: 0.45, keys: [
    [0.0,  { x: -1.5, y: -16, lean: -16, nod: -4, las: 160, lae: 20, ras: 40, rae: 30, lfx: 1.5, lfy: 0, rfx: 4.5, rfy: 0, face: 'near_wide' }],
    [0.12, { x: 1,  y: -14,   lean: 28, nod: -6, las: 100, lae: 30, ras: 80, rae: 30, lfx: -3, lfy: 0, rfx: 10, rfy: -3 }],
    [0.25, { x: 2,  y: -14.5, lean: 22, nod: 0,  lfx: -4, rfx: 9, rfy: 0 }],
    [0.45, st({ face: 'normal' })]
  ]});

  /* ------------------------------------------------------------ near misses */

  // duck: something just over his head - drop low, forearms over the head.
  D('near_duck', { dur: 0.3, face: 'near_shut', keys: [
    [0.0, st({ lfx: -4, rfx: 4 })],
    [0.1, { x: -1, y: -10,  lean: 28, nod: 6, las: 150, lae: 60, ras: 135, rae: 70, lfx: -5, rfx: 5 }],
    [0.3, { x: -1, y: -9.5, lean: 30, nod: 8, las: 148, lae: 62, ras: 132, rae: 72 }]
  ]});

  // lean: a piece sliding / falling right past his face - sway away from it, guard up.
  D('near_lean', { dur: 0.3, face: 'near_wide', keys: [
    [0.0,  st()],
    [0.12, { x: -2.5, y: -15.6, lean: -16, nod: 4, las: 80, lae: 70, ras: 60, rae: 80, lfx: -6, rfx: 2 }],
    [0.3,  { x: -2.8, y: -15.4, lean: -18, nod: 6 }]
  ]});

  // dive: superman dive, body flat out, arms reaching, legs trailing; reaches down to land.
  D('near_dive', { dur: 0.45, face: 'near_wide', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: 0, y: -16, lean: 40, nod: -10, las: 20,  lae: 20, ras: 10,  rae: 20, lls: -20, llk: 10, rls: 10,  rlk: 30 }],
    [0.1,  { x: 0, y: -14, lean: 78, nod: -20, las: 105, lae: 5,  ras: 100, rae: 8,  lls: -75, llk: 10, rls: -65, rlk: 25 }],
    [0.3,  { x: 0, y: -12, lean: 84, nod: -15, las: 95,  lae: 8,  ras: 92,  rae: 10, lls: -80, llk: 15, rls: -72, rlk: 35 }],
    [0.45, { x: 0, y: -11, lean: 80, nod: -5,  las: 70,  lae: 20, ras: 65,  rae: 25, lls: -70, llk: 20, rls: -60, rlk: 40 }]
  ]});

  // slidedive: flat, low, desperate dive straight into a belly slide.
  D('near_slidedive', { dur: 0.25, face: 'near_wide', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -2, y: -14, lean: 55, nod: -10, las: 60,  lae: 20, ras: 50, rae: 20, lls: -30, llk: 10, rls: 0,   rlk: 30 }],
    [0.12, { x: -8, y: -8,  lean: 86, nod: -16, las: 100, lae: 5,  ras: 96, rae: 8,  lls: -85, llk: 10, rls: -80, rlk: 20 }],
    [0.25, { x: -12, y: -5, lean: 88, nod: -14, las: 100, lae: 5,  ras: 95, rae: 8,  lls: -90, llk: 12, rls: -86, rlk: 25 }]
  ]});

  // bellyslide: prone, sliding on the belly, then a push-up back to standing.
  D('near_bellyslide', { dur: 0.9, face: 'near_wide', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -14, y: -4,   lean: 88, nod: -12, las: 100, lae: 5,  ras: 95, rae: 8,  lls: -92, llk: 10, rls: -88, rlk: 25 }],
    [0.4,  { x: -14, y: -3.5, lean: 89, nod: -15, lls: -90, llk: 30, rls: -90, rlk: 50 }],
    [0.55, { x: -9,  y: -6,   lean: 70, nod: -10, las: 10, lae: 0, ras: 5, rae: 0, lls: -60, llk: 50, rls: -70, rlk: 60, face: 'near_shut' }],
    [0.72, { x: -4,  y: -11,  lean: 35, nod: 0,   las: 20, lae: 10, ras: 15, rae: 10, lls: 50, llk: 100, rls: 30, rlk: 90 }],
    [0.9,  { x: 0,   y: -17.5, lean: 4, nod: 0,   las: 6,  lae: 12, ras: -6, rae: 16, lls: -4, llk: 6,  rls: 4,  rlk: 6, face: 'normal' }]
  ]});

  // roll: tucked ball; the engine spins it forward around (0,-15) while he slides.
  D('near_roll', { dur: 0.45, face: 'near_shut', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -6, y: -6,   lean: 30, nod: 70, las: 110, lae: 90,  ras: 95,  rae: 100, lls: 150, llk: 150, rls: 140, rlk: 140 }],
    [0.45, { x: -6, y: -6.5, lean: 34, nod: 66, las: 115, lae: 95,  ras: 100, rae: 105, lls: 145, llk: 145, rls: 135, rlk: 135 }]
  ]});

  // rollup: out of the tuck, onto the feet, standing tall.
  D('near_rollup', { dur: 0.35, mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -6, y: -6.5, lean: 34, nod: 66, las: 115, lae: 95, ras: 100, rae: 105, lls: 145, llk: 145, rls: 135, rlk: 135, face: 'near_shut' }],
    [0.15, { x: -1, y: -11,  lean: 30, nod: 0,  las: 40,  lae: 60, ras: 30,  rae: 60,  lls: 60,  llk: 110, rls: 50,  rlk: 100, face: 'near_wide' }],
    [0.35, { x: 0,  y: -17.5, lean: 4, nod: -6, las: 6,   lae: 12, ras: -6,  rae: 16,  lls: -4,  llk: 6,   rls: 4,   rlk: 6 }]
  ]});

  // leap: hurdling up onto a low block, lead leg forward, trail leg tucked back.
  D('near_leap', { dur: 0.45, face: 'near_wide', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: 0, y: -17, lean: 15, nod: -10, las: 150, lae: 20, ras: -40, rae: 40, lls: 80, llk: 20, rls: -40, rlk: 80 }],
    [0.2,  { x: 0, y: -18, lean: 22, nod: -5,  las: 120, lae: 30, ras: -30, rae: 50, lls: 90, llk: 10, rls: -60, rlk: 90 }],
    [0.45, { x: 0, y: -17, lean: 8,  nod: 0,   las: 90,  lae: 30, ras: 40,  rae: 40, lls: 40, llk: 30, rls: 10,  rlk: 40 }]
  ]});
})();
