/* motions-top.js - reactions to a piece coming DOWN onto the climber (area: top).
 * Same channel/keyframe format as motions.js (origin = feet, y down, facing +x).
 * The engine fits the "under a piece" poses to the room left above his feet by scaling
 * them vertically around the feet (TOP_NOM in engine.js = head-centre height of each pose).
 */
(function () {
  'use strict';
  var def = window.StickMotions && window.StickMotions.define;
  if (!def) return;

  // holdUp: caught it - deep bow-legged squat, both palms flat on the underside of the
  // piece, pumping as he tries to push it back up. Head centre ~35px, hands ~42px.
  def('top_holdUp', { dur: 0.8, loop: true, face: 'strain', mode: { la: 'ik', ra: 'ik' }, bend: { la: 1, ra: -1, ll: -1, rl: 1 }, keys: [
    [0.0, { x: 0,    y: -10,   lean: 8, nod: -18, lhx: -3,   lhy: -41,   rhx: 7,   rhy: -41.5, lfx: -5.5, lfy: 0, rfx: 5.5, rfy: 0 }],
    [0.2, { x: 0.3,  y: -11.4, lean: 6, nod: -22, lhx: -3,   lhy: -42.2, rhx: 7,   rhy: -42.4 }],
    [0.4, { x: 0,    y: -10.2, lean: 9, nod: -16, lhx: -2.6, lhy: -41.2, rhx: 7.4, rhy: -41.4 }],
    [0.6, { x: -0.3, y: -11.1, lean: 7, nod: -20, lhx: -3,   lhy: -41.9, rhx: 7,   rhy: -42 }]
  ]});

  // duckWalk: squeezing out from under it - crouched waddle, back hand still sliding along
  // the underside, front arm reaching for daylight. Stance foot slides 9px / 0.25s = 36 px/s.
  def('top_duckWalk', { dur: 0.5, loop: true, face: 'strain', mode: { la: 'ik' }, bend: { la: 1 }, keys: [
    [0.0,   { x: 0, y: -10.5, lean: 22, nod: -30, lhx: 2,   lhy: -42, ras: 70, rae: 30, rfx: 5,  rfy: 0,    lfx: -4, lfy: 0 }],
    [0.125, { x: 0, y: -11.3, lean: 24, nod: -26, lhx: 3,   lhy: -42.5, ras: 78, rae: 22, rfx: 0.5, rfy: 0, lfx: 1,  lfy: -3.5 }],
    [0.25,  { x: 0, y: -10.5, lean: 22, nod: -30, lhx: 2,   lhy: -42, ras: 62, rae: 36, rfx: -4, rfy: 0,    lfx: 5,  lfy: 0 }],
    [0.375, { x: 0, y: -11.3, lean: 24, nod: -26, lhx: 3,   lhy: -42.5, ras: 74, rae: 26, rfx: 1,  rfy: -3.5, lfx: 0.5, lfy: 0 }]
  ]});

  // pancake: flattened face-down, head toward the way out, limbs splayed flat (~13px tall),
  // a leg twitches and the fingers drum now and then.
  def('top_pancake', { dur: 1.4, loop: true, face: 'dizzy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -7, y: -3,   lean: 90, nod: -24, las: -92, lae: 4,  ras: 92, rae: 4,  lls: -92, llk: 0,  rls: -88, rlk: 22 }],
    [0.5,  { x: -7, y: -3.3, lean: 90, nod: -22, rlk: 25 }],
    [0.62, { rlk: 75 }],
    [0.76, { rlk: 20 }],
    [1.0,  { x: -7, y: -3,   rae: 16 }],
    [1.12, { rae: 2 }]
  ]});

  // wriggle: flat on his belly, pulling himself along the gap hand over hand, hips humping,
  // feet flutter-kicking. Gripping hand slides 13px / 0.3s = 43 px/s.
  def('top_wriggle', { dur: 0.6, loop: true, face: 'strain', mode: { la: 'ik', ra: 'ik', ll: 'fk', rl: 'fk' }, bend: { la: 1, ra: 1 }, keys: [
    [0.0,  { x: -7, y: -3,   lean: 90, nod: -26, rhx: 27, rhy: -1, lhx: 14, lhy: -1,   lls: -92, llk: 10, rls: -90, rlk: 45 }],
    [0.15, { x: -6, y: -4.2, lean: 88, nod: -20, rhx: 21, rhy: -1, lhx: 21, lhy: -4.5, lls: -90, llk: 45, rls: -92, rlk: 8 }],
    [0.3,  { x: -5, y: -3,   lean: 90, nod: -26, rhx: 14, rhy: -1, lhx: 27, lhy: -1,   lls: -92, llk: 10, rls: -90, rlk: 45 }],
    [0.45, { x: -6, y: -4.2, lean: 88, nod: -20, rhx: 21, rhy: -4.5, lhx: 21, lhy: -1, lls: -90, llk: 45, rls: -92, rlk: 8 }]
  ]});

  // bonk: a point (T stem) lands on his head - head jammed down, knees buckle, arms jerk
  // out, then both hands clutch the top of his head and he wobbles.
  def('top_bonk', { dur: 0.6, face: 'dizzy', mode: { la: 'ik', ra: 'ik' }, bend: { la: 1, ra: -1 }, keys: [
    [0.0,  { x: 0,    y: -16.8, lean: 3,  nod: 0,  lhx: 1,  lhy: -16, rhx: 2,  rhy: -16,   lfx: -3, lfy: 0, rfx: 3, rfy: 0, face: 'scared' }],
    [0.05, { x: 0,    y: -12.5, lean: 12, nod: 36, lhx: -9, lhy: -31, rhx: 13, rhy: -30,   lfx: -4.5, rfx: 4.5, face: 'dizzy' }],
    [0.18, { x: 0,    y: -12.5, lean: 8,  nod: 20, lhx: 3,  lhy: -43, rhx: 8,  rhy: -42 }],
    [0.35, { x: -1,   y: -13.5, lean: -6, nod: 12, lhx: 0,  lhy: -44, rhx: 5,  rhy: -43.5 }],
    [0.6,  { x: 0.5,  y: -14.5, lean: 8,  nod: 16, lhx: 3,  lhy: -44, rhx: 8,  rhy: -43 }]
  ]});

  // kneel: the heavy O - knees buckle straight to the ground, arms crumple under the weight
  // and he ends kneeling, bowed, hands still pressed up (head centre ~34px).
  def('top_kneel', { dur: 0.3, face: 'strain', mode: { la: 'ik', ra: 'ik', ll: 'fk', rl: 'fk' }, bend: { la: 1, ra: -1 }, keys: [
    [0.0,  { x: 0,  y: -15,   lean: 6,  nod: -18, lhx: -2, lhy: -46, rhx: 6,  rhy: -46, lls: -10, llk: 16,  rls: 12, rlk: 20, face: 'scared' }],
    [0.1,  { x: 0,  y: -9.5,  lean: 16, nod: 12,  lhx: 1,  lhy: -34, rhx: 9,  rhy: -33, lls: 12,  llk: 104, rls: 18, rlk: 110, face: 'strain' }],
    [0.3,  { x: -1, y: -10,   lean: 12, nod: -10, lhx: 0,  lhy: -41, rhx: 8,  rhy: -41, lls: 10,  llk: 100, rls: 16, rlk: 106 }]
  ]});

  // shove: a corner clips his head/shoulder from behind-above - ducks, back arm flung up,
  // lurches forward (toward the open side) with a catch step, recovers.
  def('top_shove', { dur: 0.4, face: 'scared', keys: [
    [0.0,  { x: 0, y: -16.6, lean: 4,  nod: 0,  las: 6,    lae: 12, ras: -6,  rae: 16, lfx: -3, lfy: 0,  rfx: 3, rfy: 0 }],
    [0.05, { x: 3, y: -14,   lean: 32, nod: 30, las: -150, lae: 20, ras: 80,  rae: 30, lfx: -6, lfy: -2, rfx: 6, rfy: 0 }],
    [0.18, { x: 4, y: -14.5, lean: 22, nod: 10, las: -120, lae: 40, ras: 100, rae: 20, lfx: 5,  lfy: 0,  rfx: 4, rfy: -3 }],
    [0.3,  { x: 2, y: -16,   lean: 10, nod: 0,  las: -30,  lae: 30, ras: 40,  rae: 30, lfx: 3,  lfy: 0,  rfx: 7, rfy: 0 }],
    [0.4,  { x: 0, y: -16.6, lean: 4,  nod: 0,  las: 6,    lae: 12, ras: -6,  rae: 16, lfx: -3, lfy: 0,  rfx: 3, rfy: 0, face: 'normal' }]
  ]});

  // stagger: seeing stars after a bonk - tottering, knees wobbling, arms loose.
  // Feet roughly 8px per 0.225s -> ~30 px/s; the engine moves him ~22 px/s.
  def('top_stagger', { dur: 0.9, loop: true, face: 'dizzy', keys: [
    [0.0,   { x: 0, y: -15,   lean: -8, nod: 14,  lfx: -3, lfy: -3, rfx: 4,  rfy: 0,  las: 40, lae: 40, ras: -20, rae: 30 }],
    [0.225, { x: 1, y: -14,   lean: 14, nod: -8,  lfx: 4,  lfy: 0,  rfx: 0,  rfy: 0,  las: 80, lae: 20, ras: 30,  rae: 60 }],
    [0.45,  { x: 0, y: -15,   lean: -4, nod: 18,  lfx: 1,  lfy: 0,  rfx: -4, rfy: -2, las: 20, lae: 50, ras: 60,  rae: 20 }],
    [0.675, { x: 1, y: -14.2, lean: 12, nod: -10, lfx: -1, lfy: 0,  rfx: 5,  rfy: 0,  las: 70, lae: 30, ras: -10, rae: 40 }]
  ]});

  // popOut: springs out of the gap like a cork - stretched straight, arms up, toes pointed,
  // then opens up and settles into a normal fall.
  def('top_popOut', { dur: 0.5, face: 'scared', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { y: -19,   lean: 0,  nod: -12, las: 178, lae: 0,  ras: 172, rae: 4,  lls: -2, llk: 0,  rls: 3,  rlk: 0 }],
    [0.22, { y: -18,   lean: -3, nod: -6,  las: 130, lae: 12, ras: 122, rae: 16, lls: -8, llk: 10, rls: 10, rlk: 16, face: 'happy' }],
    [0.5,  { y: -17,   lean: -4, nod: -12, las: 150, lae: 30, ras: 165, rae: 10, lls: 25, llk: 30, rls: 10, rlk: 70 }]
  ]});

  // yank: a piece whooshes down right beside him and catches his hand - he snatches the
  // hand back to his chest and leans away, then settles.
  def('top_yank', { dur: 0.4, keys: [
    [0.0,  { x: 0,    y: -16.6, lean: 4,   nod: 0, las: 6,   lae: 12, ras: -6,  rae: 16,  lfx: -3, lfy: 0, rfx: 3,  rfy: 0 }],
    [0.06, { x: -2.5, y: -15,   lean: -14, nod: 8, las: -30, lae: 40, ras: -40, rae: 125, lfx: -5, lfy: 0, rfx: 1,  rfy: -2, face: 'scared' }],
    [0.22, { x: -2,   y: -15.6, lean: -8,  nod: 4, las: -20, lae: 35, ras: -30, rae: 128, rfx: -1, rfy: 0 }],
    [0.4,  { x: 0,    y: -16.6, lean: 4,   nod: 0, las: 6,   lae: 12, ras: -6,  rae: 16,  lfx: -3, lfy: 0, rfx: 3,  rfy: 0, face: 'normal' }]
  ]});

  // fingers: a piece landed on the ledge he was holding - dropping, shaking the hurt hand
  // over his head, other arm flailing, legs dangling.
  def('top_fingers', { dur: 0.36, loop: true, face: 'strain', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { y: -17, lean: -4, nod: -10, ras: 150, rae: 20, las: 120, lae: 40, lls: 20, llk: 30, rls: 5,  rlk: 60 }],
    [0.09, { ras: 160, rae: 55 }],
    [0.18, { y: -17.4, ras: 145, rae: 15, las: 150, lae: 20, lls: 5, llk: 50, rls: 25, rlk: 30 }],
    [0.27, { ras: 158, rae: 55 }]
  ]});
})();
