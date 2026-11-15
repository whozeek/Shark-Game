/* motions-ride.js - grabbing, hanging from and riding the falling piece.
 * Origins follow motions.base.js: riding / air poses have the origin at the feet,
 * ride_hangOne at the grip (block top-left corner, block at x>0,y>0) like 'hang'. */
(function () {
  'use strict';
  var def = window.StickMotions && window.StickMotions.define;
  if (!def) return;

  // ride_surf: relaxed surfer stance on a moving piece - wide feet, soft knees, arms loose and out.
  def('ride_surf', { dur: 1.8, loop: true, keys: [
    [0.0, { x: 0,    y: -15.2, lean: 6, nod: 2,  las: 62, lae: 28, ras: -48, rae: 22, lfx: -6.5, lfy: 0, rfx: 6, rfy: 0 }],
    [0.45, { x: 0.7, y: -15.6, lean: 8, nod: -3, las: 70, lae: 22, ras: -42, rae: 26 }],
    [0.9, { x: 0.2,  y: -15.1, lean: 5, nod: 4,  las: 58, lae: 30, ras: -52, rae: 20, face: 'happy' }],
    [1.35, { x: -0.6, y: -15.5, lean: 3, nod: 0, las: 66, lae: 24, ras: -46, rae: 24, face: 'normal' }]
  ]});

  // ride_windmill: thrown off balance by a jerk of the piece - arms flail in big opposite arcs.
  def('ride_windmill', { dur: 0.48, loop: true, face: 'scared', keys: [
    [0.0,  { x: 0,    y: -14.6, lean: 6,  nod: -8,  las: 165, lae: 12, ras: 25,  rae: 35, lfx: -5.5, lfy: 0, rfx: 5, rfy: 0 }],
    [0.12, { x: 0.8,  y: -14.2, lean: 2,  nod: -4,  las: 95,  lae: 30, ras: 115, rae: 20 }],
    [0.24, { x: 0.2,  y: -14.7, lean: -2, nod: -10, las: 30,  lae: 35, ras: 172, rae: 10 }],
    [0.36, { x: -0.7, y: -14.3, lean: 3,  nod: -5,  las: 110, lae: 20, ras: 90,  rae: 30 }]
  ]});

  // ride_teeter: toes over the edge (facing +x = the drop): hips pump back and forth, arms pinwheel,
  // the front foot paddles over the void while the back foot clings to the block.
  def('ride_teeter', { dur: 0.62, loop: true, face: 'scared', keys: [
    [0.0,  { x: -2.5, y: -15.6, lean: 20, nod: 12,  las: 150, lae: 20, ras: 60,  rae: 40, lfx: -6.5, lfy: 0, rfx: 4,   rfy: -4 }],
    [0.16, { x: -3.2, y: -16.2, lean: 4,  nod: 4,   las: 80,  lae: 40, ras: 150, rae: 15, rfx: 6,   rfy: -1.5 }],
    [0.31, { x: -3.8, y: -15.8, lean: -10, nod: -10, las: 40, lae: 30, ras: 175, rae: 8,  rfx: 3,   rfy: -5 }],
    [0.47, { x: -3.0, y: -16.0, lean: 8,  nod: 2,   las: 130, lae: 25, ras: 90,  rae: 30, rfx: 6.5, rfy: -2 }]
  ]});

  // ride_tiptoe: on a one-cell top (the T's point, a step of S/Z/J/L): feet together, up on the
  // toes, arms out like a tightrope walker, see-sawing.
  def('ride_tiptoe', { dur: 1.3, loop: true, face: 'strain', keys: [
    [0.0,  { x: 0,    y: -17.4, lean: 5,  nod: 6,  las: 98, lae: 6, ras: -82, rae: 8, lfx: -1.6, lfy: 0, rfx: 1.6, rfy: 0 }],
    [0.32, { x: 0.6,  y: -17.6, lean: -2, nod: 10, las: 80, lae: 4, ras: -100, rae: 6 }],
    [0.65, { x: 0,    y: -17.3, lean: 6,  nod: 4,  las: 104, lae: 8, ras: -76, rae: 10 }],
    [0.97, { x: -0.6, y: -17.6, lean: 1,  nod: 9,  las: 86, lae: 5, ras: -94, rae: 6 }]
  ]});

  // ride_brace: next to a step of the piece (+x): one hand planted on its top corner, weight on it.
  def('ride_brace', { dur: 1.8, loop: true, mode: { ra: 'ik' }, bend: { ra: -1 }, keys: [
    [0.0, { x: -0.5, y: -15.8, lean: 12, nod: -4, rhx: 10, rhy: -28.6, las: -12, lae: 20, lfx: -5, lfy: 0, rfx: 3, rfy: 0 }],
    [0.9, { x: 0.2,  y: -15.4, lean: 15, nod: 2,  rhx: 10, rhy: -28.6, las: -8,  lae: 26 }]
  ]});

  // ride_crouch: soft drop - squat low, hands by the knees, eyes front.
  def('ride_crouch', { dur: 0.9, loop: true, face: 'strain', keys: [
    [0.0,  { x: -1, y: -10.8, lean: 30, nod: -16, las: 40, lae: 25, ras: 18, rae: 40, lfx: -5, lfy: 0, rfx: 4.5, rfy: 0 }],
    [0.45, { x: -1, y: -11.4, lean: 27, nod: -12, las: 46, lae: 22, ras: 24, rae: 36 }]
  ]});

  // ride_elevator: hard-drop slam in progress - tucked low, arms blown up overhead.
  def('ride_elevator', { dur: 0.18, face: 'scared', keys: [
    [0.0,  { x: -0.5, y: -12.5, lean: 18, nod: -14, las: 130, lae: 30, ras: 140, rae: 25, lfx: -5, lfy: 0, rfx: 4.5, rfy: 0 }],
    [0.18, { x: -1,   y: -10.5, lean: 26, nod: -22, las: 168, lae: 8,  ras: 174, rae: 6 }]
  ]});

  // ride_absorb: the slam stops dead - deep squat soaking it up (head keeps going), then stand.
  def('ride_absorb', { dur: 0.5, face: 'grit', keys: [
    [0.0,  { x: -1, y: -8.6, lean: 30, nod: 14, las: 70, lae: 40, ras: 55, rae: 50, lfx: -6.5, lfy: 0, rfx: 6, rfy: 0 }],
    [0.1,  { x: -1, y: -7.8, lean: 36, nod: 18, las: 40, lae: 50, ras: 30, rae: 55 }],
    [0.3,  { x: -0.5, y: -13, lean: 14, nod: 2, las: 30, lae: 25, ras: -10, rae: 25, face: 'normal' }],
    [0.5,  { x: 0,  y: -16.4, lean: 4, nod: 0,  las: 6,  lae: 12, ras: -6, rae: 16, lfx: -4, rfx: 4 }]
  ]});

  // ride_cartoonStand: the piece under him was swapped away (Hold). Hangs in mid-air standing,
  // slowly looks down, realises, tiny hop of panic... (the engine then lets gravity back in).
  def('ride_cartoonStand', { dur: 0.6, keys: [
    [0.0,  { x: 0, y: -16.8, lean: 3,  nod: 0,  las: 6,  lae: 12, ras: -6, rae: 16, lfx: -3, lfy: 0, rfx: 3, rfy: 0 }],
    [0.18, { x: 0, y: -16.8, lean: 8,  nod: 30, las: 8,  lae: 14, ras: -4, rae: 18 }],
    [0.34, { x: 0, y: -17.2, lean: 10, nod: 40, las: 10, lae: 16, ras: -2, rae: 20, face: 'scared' }],
    [0.5,  { x: 0, y: -17.8, lean: 2,  nod: 6,  las: 60, lae: 30, ras: 50, rae: 35, lfx: -2, lfy: -1, rfx: 2, rfy: -1.5 }],
    [0.6,  { x: 0, y: -17.8, lean: 0,  nod: -6, las: 120, lae: 25, ras: 110, rae: 30 }]
  ]});

  // ride_cartoonHang: same beat when he was hanging - hands still up gripping nothing, legs
  // dangling; looks at his empty hands, then down. Origin = feet (hands ~49px above).
  def('ride_cartoonHang', { dur: 0.6, mode: { la: 'ik', ra: 'ik', ll: 'fk', rl: 'fk' }, bend: { la: 1, ra: 1 }, keys: [
    [0.0,  { x: -2, y: -17.5, lean: -8, nod: -10, lhx: 8, lhy: -48, rhx: 9, rhy: -48.5, lls: 6, llk: 15, rls: -2, rlk: 25 }],
    [0.16, { x: -2, y: -17.5, lean: -10, nod: -26, lhx: 9, lhy: -47, rhx: 10, rhy: -47.5 }],
    [0.32, { x: -2, y: -17.5, lean: -4, nod: 26, lhx: 10, lhy: -46, rhx: 11, rhy: -46.5, lls: 10, llk: 25, rls: 2, rlk: 30, face: 'scared' }],
    [0.6,  { x: -2, y: -17.5, lean: -4, nod: 18, lhx: 8, lhy: -44, rhx: 12, rhy: -43, lls: 14, llk: 30, rls: -6, rlk: 20 }]
  ]});

  // ride_hangOne: lost a hand - dangling from the left hand only (origin = grip), body swung under
  // the hand, free arm clawing back up at the edge, legs kicking.
  def('ride_hangOne', { dur: 0.8, loop: true, root: 'neck', face: 'scared',
    mode: { la: 'ik', ra: 'fk', ll: 'fk', rl: 'fk' }, bend: { la: 1 }, keys: [
    [0.0, { x: -3.5, y: 16.8, lean: -4, nod: -18, lhx: 0, lhy: 0, ras: 150, rae: 30, lls: 10, llk: 30, rls: -14, rlk: 20 }],
    [0.2, { x: -2.6, y: 17.0, lean: 4,  nod: -12, ras: 95,  rae: 55, lls: -12, llk: 20, rls: 16, rlk: 40 }],
    [0.4, { x: -2.0, y: 16.9, lean: 8,  nod: -20, ras: 165, rae: 15, lls: 14, llk: 35, rls: -8, rlk: 15 }],
    [0.6, { x: -3.0, y: 16.8, lean: 0,  nod: -14, ras: 110, rae: 45, lls: -8, llk: 15, rls: 12, rlk: 45 }]
  ]});

  // ride_miss: fingers slipped off the corner - reaching up after it, looking up, legs dangling.
  def('ride_miss', { dur: 0.4, face: 'scared', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0, { y: -17.6, lean: -2, nod: -26, las: 172, lae: 4,  ras: 150, rae: 22, lls: 6,  llk: 12, rls: -4, rlk: 30 }],
    [0.2, { y: -17.4, lean: -5, nod: -30, las: 162, lae: 18, ras: 170, rae: 6,  lls: 16, llk: 35, rls: 2,  rlk: 20 }],
    [0.4, { y: -17.0, lean: -4, nod: -22, las: 150, lae: 30, ras: 160, rae: 20, lls: 25, llk: 40, rls: 10, rlk: 60 }]
  ]});
})();
