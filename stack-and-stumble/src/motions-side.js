/* motions-side.js - reactions to a falling piece hitting him from the SIDE.
 * Same spec format as motions.js def(). Figure faces +x; unless noted the piece is at +x
 * (he faces what hit him) and the engine slides him along with C.vx while these play. */
(function () {
  var D = StickMotions.define;

  // side_guard: anticipation - a piece is sliding toward him. Weight back, knees soft,
  // forearms up in front of the face, eyes on the piece. Holds the last key.
  D('side_guard', { dur: 0.32, face: 'scared', keys: [
    [0.0,  { x: 0,    y: -16.6, lean: 3,  nod: 0,   las: 6,   lae: 12, ras: -6,  rae: 16, lfx: -3, rfx: 3 }],
    [0.1,  { x: -1.4, y: -15.2, lean: -6, nod: 6,   las: 70,  lae: 70, ras: 50,  rae: 80, lfx: -6, rfx: 3 }],
    [0.32, { x: -2,   y: -14.8, lean: -9, nod: 8,   las: 96,  lae: 84, ras: 76,  rae: 92, lfx: -7, rfx: 3.5 }]
  ]});

  // side_jostle: a light bump from the front. Rocks back onto the heel, arms fly up,
  // a little hop-step back, then a glare at the piece.
  D('side_jostle', { dur: 0.5, keys: [
    [0.0,  { x: 0,    y: -16.4, lean: 2,   nod: 0,  las: 8,   lae: 14, ras: -4,  rae: 16, lfx: -3, lfy: 0, rfx: 3, rfy: 0 }],
    [0.05, { x: -2.5, y: -16,   lean: -16, nod: 12, las: 120, lae: 30, ras: 70,  rae: 40, lfx: -7, lfy: -2, rfx: 2, rfy: 0, face: 'scared' }],
    [0.16, { x: -2,   y: -16.4, lean: -10, nod: 6,  las: 95,  lae: 50, ras: 30,  rae: 50, lfx: -6, lfy: 0, rfx: 1, rfy: -3 }],
    [0.3,  { x: -0.6, y: -16.2, lean: 0,   nod: 2,  las: 30,  lae: 30, ras: -10, rae: 25, lfx: -4, lfy: 0, rfx: 3, rfy: 0, face: 'grit' }],
    [0.5,  { x: 0,    y: -16.6, lean: 4,   nod: 0,  las: 6,   lae: 12, ras: -6,  rae: 16, lfx: -3, lfy: 0, rfx: 3, rfy: 0 }]
  ]});

  // side_jab: the point of a T jabs him in the belly. Hips shoot back, he folds over the
  // point, hands clutch the stomach, then straightens up.
  D('side_jab', { dur: 0.6, mode: { la: 'ik', ra: 'ik' }, keys: [
    [0.0,  { x: 0,    y: -16.4, lean: 4,  nod: 0,  lhx: 1,  lhy: -16, rhx: 2,  rhy: -16, lfx: -3, rfx: 3 }],
    [0.06, { x: -4,   y: -14,   lean: 42, nod: 14, lhx: 4,  lhy: -20, rhx: 5,  rhy: -18, lfx: -7, rfx: 1, face: 'scared' }],
    [0.25, { x: -4.5, y: -13.5, lean: 48, nod: 18, lhx: 3,  lhy: -19, rhx: 4,  rhy: -17, face: 'dizzy' }],
    [0.42, { x: -2,   y: -15.5, lean: 20, nod: 6,  lhx: 2,  lhy: -18, rhx: 3,  rhy: -17, lfx: -4, rfx: 2.5, face: 'strain' }],
    [0.6,  { x: 0,    y: -16.6, lean: 4,  nod: 0,  lhx: 1,  lhy: -16, rhx: 2,  rhy: -16, lfx: -3, rfx: 3 }]
  ]});

  // side_staggerBack: shoved hard from the front. Torso whips back, arms windmill forward
  // to find balance, three quick backward steps (engine slides him back meanwhile).
  D('side_staggerBack', { dur: 0.85, keys: [
    [0.0,  { x: 0,    y: -16.4, lean: 3,   nod: 0,  las: 10,  lae: 14, ras: -6,  rae: 16, lfx: -3,  lfy: 0,  rfx: 3,  rfy: 0 }],
    [0.06, { x: -3,   y: -15.5, lean: -24, nod: 16, las: 150, lae: 20, ras: 100, rae: 30, lfx: -4,  lfy: 0,  rfx: 4,  rfy: -2, face: 'scared' }],
    [0.18, { x: -3.5, y: -15,   lean: -20, nod: 10, las: 230, lae: 20, ras: 170, rae: 20, lfx: -10, lfy: -3, rfx: 3,  rfy: 0 }],
    [0.3,  { x: -2,   y: -15.6, lean: -14, nod: 8,  las: 300, lae: 25, ras: 250, rae: 20, lfx: -8,  lfy: 0,  rfx: -2, rfy: -4 }],
    [0.42, { x: -2.5, y: -15.2, lean: -16, nod: 10, las: 380, lae: 20, ras: 320, rae: 25, lfx: -5,  lfy: -3, rfx: -6, rfy: 0 }],
    [0.56, { x: -1.5, y: -15.8, lean: -8,  nod: 4,  las: 450, lae: 25, ras: 400, rae: 25, lfx: -7,  lfy: 0,  rfx: 0,  rfy: -2 }],
    [0.7,  { x: -0.5, y: -16.3, lean: 0,   nod: 2,  las: 480, lae: 20, ras: 430, rae: 22, lfx: -4,  lfy: 0,  rfx: 3,  rfy: 0, face: 'strain' }],
    [0.85, { x: 0,    y: -16.6, lean: 4,   nod: 0,  las: 366, lae: 12, ras: 354, rae: 16, lfx: -3,  lfy: 0,  rfx: 3,  rfy: 0, face: 'normal' }]
  ]});

  // side_staggerFwd: shoved in the back. Pitches forward, arms windmill backward,
  // catch steps forward, recovers.
  D('side_staggerFwd', { dur: 0.75, keys: [
    [0.0,  { x: 0,   y: -16.4, lean: 3,  nod: 0,   las: 8,   lae: 14, ras: -6,   rae: 16, lfx: -3, lfy: 0,  rfx: 3,  rfy: 0 }],
    [0.06, { x: 2.5, y: -15.6, lean: 30, nod: -16, las: -40, lae: 20, ras: -70,  rae: 20, lfx: -6, lfy: -2, rfx: 3,  rfy: 0, face: 'scared' }],
    [0.18, { x: 3,   y: -14.5, lean: 38, nod: -20, las: 60,  lae: 30, ras: -140, rae: 20, lfx: 7,  lfy: -4, rfx: 1,  rfy: 0 }],
    [0.3,  { x: 2,   y: -14.8, lean: 30, nod: -12, las: 160, lae: 25, ras: -220, rae: 20, lfx: 8,  lfy: 0,  rfx: 4,  rfy: -4 }],
    [0.44, { x: 2.5, y: -15,   lean: 26, nod: -10, las: 240, lae: 20, ras: -290, rae: 25, lfx: 3,  lfy: -3, rfx: 9,  rfy: 0 }],
    [0.58, { x: 1,   y: -16,   lean: 12, nod: -4,  las: 330, lae: 25, ras: -340, rae: 20, lfx: 6,  lfy: 0,  rfx: 4,  rfy: 0, face: 'strain' }],
    [0.75, { x: 0,   y: -16.6, lean: 4,  nod: 0,   las: 366, lae: 12, ras: -366, rae: 16, lfx: 3,  lfy: 0,  rfx: 7,  rfy: 0, face: 'normal' }]
  ]});

  // side_spin: a corner (S/Z/J/L) clips his shoulder and spins him round. The engine flips
  // his facing at t=0.3, where the pose is mirror-symmetric (arms straight up, feet together).
  D('side_spin', { dur: 0.9, keys: [
    [0.0,  { x: 0,    y: -16.4, lean: 2,   nod: 0,  las: 8,   lae: 14, ras: -6,   rae: 16, lfx: -3,  rfx: 3 }],
    [0.06, { x: -1.5, y: -16.6, lean: -14, nod: 8,  las: 100, lae: 10, ras: -100, rae: 10, lfx: -4,  rfx: 1, face: 'scared' }],
    [0.18, { x: -0.6, y: -17.4, lean: -6,  nod: 2,  las: 150, lae: 6,  ras: -150, rae: 8,  lfx: -1.5, rfx: 0.5 }],
    [0.3,  { x: 0,    y: -17.6, lean: 0,   nod: 0,  las: 180, lae: 0,  ras: 180,  rae: 0,  lfx: -1,  rfx: 1 }],
    [0.42, { x: 0.6,  y: -17.2, lean: 6,   nod: -2, las: 150, lae: 8,  ras: 210,  rae: 6,  lfx: -2,  rfx: 2, face: 'dizzy' }],
    [0.6,  { x: 1.2,  y: -16,   lean: 10,  nod: 8,  las: 100, lae: 30, ras: 250,  rae: 20, lfx: -5,  rfx: 4 }],
    [0.75, { x: 0.4,  y: -16.2, lean: 6,   nod: 4,  las: 40,  lae: 20, ras: 330,  rae: 18 }],
    [0.9,  { x: 0,    y: -16.6, lean: 4,   nod: 0,  las: 6,   lae: 12, ras: 354,  rae: 16, lfx: -3,  rfx: 3, face: 'normal' }]
  ]});

  // side_fallBack: a big hit knocks him flat on his back (head at -x, away from the piece),
  // legs kick up, he lies stunned, then rolls up to sitting and stands.
  D('side_fallBack', { dur: 1.7, mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: 0,    y: -16.4, lean: 2,   nod: 0,   las: 8,   lae: 14, ras: -6,  rae: 16, lls: -4,  llk: 6,   rls: 4,   rlk: 6 }],
    [0.07, { x: -3,   y: -15,   lean: -30, nod: 18,  las: 140, lae: 20, ras: 110, rae: 30, lls: 10,  llk: 10,  rls: 30,  rlk: 20, face: 'scared' }],
    [0.2,  { x: -5,   y: -9,    lean: -62, nod: 20,  las: 170, lae: 20, ras: 140, rae: 30, lls: 70,  llk: 40,  rls: 85,  rlk: 50 }],
    [0.32, { x: -6,   y: -5,    lean: -86, nod: 10,  las: 200, lae: 15, ras: 120, rae: 40, lls: 140, llk: 30,  rls: 120, rlk: 60, face: 'dizzy' }],
    [0.45, { x: -6,   y: -5.5,  lean: -84, nod: 8,   las: 190, lae: 20, ras: 110, rae: 35, lls: 120, llk: 60,  rls: 145, rlk: 20 }],
    [0.6,  { x: -6,   y: -5,    lean: -86, nod: 10,  las: 196, lae: 18, ras: 116, rae: 38, lls: 98,  llk: 30,  rls: 100, rlk: 40 }],
    [0.95, { x: -6,   y: -5,    lean: -84, nod: 6,   las: 200, lae: 20, ras: 120, rae: 30, lls: 96,  llk: 26,  rls: 98,  rlk: 34 }],
    [1.15, { x: -4,   y: -3.5,  lean: -10, nod: 10,  las: 40,  lae: 40, ras: -30, rae: 10, lls: 100, llk: 40,  rls: 95,  rlk: 35 }],
    [1.35, { x: -2,   y: -6,    lean: 30,  nod: 10,  las: 60,  lae: 30, ras: 40,  rae: 30, lls: 40,  llk: 110, rls: 30,  rlk: 120, face: 'strain' }],
    [1.52, { x: -0.5, y: -13,   lean: 18,  nod: 4,   las: 20,  lae: 20, ras: 10,  rae: 20, lls: 15,  llk: 40,  rls: 5,   rlk: 35 }],
    [1.7,  { x: 0,    y: -16.6, lean: 4,   nod: 0,   las: 6,   lae: 12, ras: -6,  rae: 16, lls: -6,  llk: 8,   rls: 6,   rlk: 8, face: 'normal' }]
  ]});

  // side_skid: a heavy O bulldozes him along. Leaning into it with both palms on the face
  // (piece face at local x ~ +7.6; the engine shifts the origin), heels dug in and skidding, legs juddering.
  D('side_skid', { dur: 0.36, loop: true, face: 'grit', mode: { la: 'ik', ra: 'ik' }, keys: [
    [0.0,  { x: -9,   y: -14,   lean: 34, nod: -36, lhx: 7.3, lhy: -27, rhx: 7.5, rhy: -23, lfx: -18, lfy: 0,    rfx: -11, rfy: 0 }],
    [0.09, { x: -9.4, y: -13.6, lean: 36, nod: -38, lfx: -18.5, lfy: -1.5 }],
    [0.18, { x: -9,   y: -14.2, lean: 34, nod: -35, lfx: -18, lfy: 0, rfx: -11.5, rfy: -1.5 }],
    [0.27, { x: -8.6, y: -13.8, lean: 33, nod: -37, rfx: -11, rfy: 0 }]
  ]});

  // side_brace: a resting piece leans on him and he pushes back. Same contact as side_skid
  // but planted and straining, with a slow tremble.
  D('side_brace', { dur: 0.8, loop: true, face: 'strain', mode: { la: 'ik', ra: 'ik' }, keys: [
    [0.0, { x: -8.5, y: -14.5, lean: 30, nod: -28, lhx: 7.3, lhy: -27, rhx: 7.5, rhy: -23, lfx: -17, lfy: 0, rfx: -6, rfy: 0 }],
    [0.2, { x: -8.2, y: -14.2, lean: 32, nod: -30, lhx: 7.6, lhy: -26.5, face: 'grit' }],
    [0.4, { x: -8.6, y: -14.6, lean: 29, nod: -27, lhx: 7.3, lhy: -27 }],
    [0.6, { x: -8.3, y: -14.3, lean: 31, nod: -29, rhx: 7.4, rhy: -22.6, face: 'strain' }]
  ]});

  // side_squeezed: wedged flat in a slot - arms straight up, knees together, squirming.
  D('side_squeezed', { dur: 0.5, loop: true, face: 'strain', keys: [
    [0.0,   { x: 0,    y: -17.4, lean: 0,  nod: -6, las: 178, lae: 0, ras: 182, rae: 0, lfx: -1, rfx: 1 }],
    [0.125, { x: 0.8,  y: -17.6, lean: 3,  nod: -2, las: 172, lae: 6, ras: 186, rae: 0, lfx: -0.5, rfx: 1.5 }],
    [0.25,  { x: 0,    y: -17.4, lean: 0,  nod: -8, las: 178, lae: 0, ras: 182, rae: 0, lfx: -1, rfx: 1 }],
    [0.375, { x: -0.8, y: -17.6, lean: -3, nod: -4, las: 184, lae: 0, ras: 176, rae: 6, lfx: -1.5, rfx: 0.5 }]
  ]});

  // side_pop: squeezed out upward like a melon seed - rigid, arms up, toes pointed.
  D('side_pop', { dur: 0.45, mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { y: -18,   lean: 0,  nod: -10, las: 178, lae: 0,  ras: 182, rae: 0,  lls: -2, llk: 0,  rls: 2,  rlk: 0, face: 'scared' }],
    [0.25, { y: -18,   lean: -4, nod: -14, las: 170, lae: 8,  ras: 190, rae: 6,  lls: -4, llk: 4,  rls: 4,  rlk: 6 }],
    [0.45, { y: -17,   lean: -2, nod: -8,  las: 140, lae: 30, ras: 160, rae: 20, lls: 10, llk: 30, rls: 20, rlk: 50 }]
  ]});

  // side_hangTuck: hanging while a piece slides past underneath/behind - knees yanked up
  // to the chest, peeking down at it.
  D('side_hangTuck', { dur: 1.2, loop: true, root: 'neck', face: 'scared',
                       mode: { la: 'ik', ra: 'ik', ll: 'fk', rl: 'fk' }, bend: { la: 1, ra: 1 }, keys: [
    [0.0, { x: -6.8, y: 13.6, lean: -4, nod: 22, lhx: 0, lhy: 0, rhx: 0, rhy: 0, lls: 95,  llk: 135, rls: 105, rlk: 140 }],
    [0.6, { x: -6.4, y: 13.2, lean: -2, nod: 26, lls: 102, llk: 140, rls: 98,  rlk: 132 }]
  ]});

  // side_swept: knocked off a climbing face, back to the piece - limbs flung, falling away.
  D('side_swept', { dur: 0.5, loop: true, face: 'scared', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { y: -17, lean: -18, nod: 10, las: 160, lae: 30, ras: 120, rae: 40, lls: 30, llk: 50, rls: -10, rlk: 30 }],
    [0.25, { y: -17, lean: -22, nod: 14, las: 130, lae: 50, ras: 165, rae: 20, lls: -5, llk: 30, rls: 35,  rlk: 60 }]
  ]});
})();
