/* motions-pp.js - personality and temper (prefix pp_).
 * Same channel/keyframe format as motions.js (origin = feet on the ground, y down, facing +x).
 * Idle fidgets, looking and pointing, edges, slips and scares, catching his breath, celebrations,
 * waves, trips and get-ups, three deaths, weather and bounce poses, and an anger ladder for
 * when he is hit or boxed in (huff, kick, flail, tantrum).
 */
(function () {
  'use strict';
  var def = window.StickMotions && window.StickMotions.define;
  if (!def) return;

  /* ------------------------------------------------------------ IDLE FIDGETS */

  // scratch: hand up to the side of his head, scratching, head tilted in thought.
  def('pp_scratch', { dur: 1.6, mode: { ra: 'ik' }, keys: [
    [0.0,  { y: -16.8, lean: 3, nod: 0,  las: 6,  lae: 12, rhx: 3,   rhy: -18 }],
    [0.25, { y: -16.6, lean: 2, nod: 10, las: 4,  lae: 14, rhx: 5.5, rhy: -45 }],
    [0.4,  { rhx: 6,   rhy: -43 }],
    [0.55, { rhx: 5.5, rhy: -45.5 }],
    [0.7,  { rhx: 6,   rhy: -43 }],
    [0.85, { rhx: 5.5, rhy: -45.5 }],
    [1.0,  { rhx: 6,   rhy: -43.5, nod: 12 }],
    [1.35, { y: -16.8, nod: 2, rhx: 3, rhy: -18 }],
    [1.6,  { y: -16.8, lean: 3, nod: 0, rhx: 3, rhy: -17.5 }]
  ]});

  // stretch: big two-arm stretch overhead, leaning back on his heels, then shakes out.
  def('pp_stretch', { dur: 1.9, keys: [
    [0.0,  { y: -16.8, lean: 3,   nod: 0,   las: 6,   lae: 12, ras: -6,  rae: 16 }],
    [0.45, { y: -17.6, lean: -8,  nod: -16, las: 172, lae: 6,  ras: 178, rae: 4, lfx: -3, rfx: 3 }],
    [0.95, { y: -17.5, lean: -11, nod: -20, las: 168, lae: 10, ras: 182, rae: 2 }],
    [1.3,  { y: -16.6, lean: 0,   nod: 4,   las: 100, lae: 10, ras: 100, rae: 10, face: 'happy' }],
    [1.9,  { y: -16.8, lean: 3,   nod: 0,   las: 6,   lae: 12, ras: -6,  rae: 16, face: 'normal' }]
  ]});

  // tapFoot: hands on hips, toe tapping, impatient.
  def('pp_tapFoot', { dur: 1.0, loop: true, mode: { la: 'ik', ra: 'ik' }, bend: { la: 1, ra: -1 }, keys: [
    [0.0,  { y: -16.8, lean: 1, nod: 6, lhx: -5.5, lhy: -18, rhx: 5.5, rhy: -18, lfx: -3.5, lfy: 0, rfx: 4.5, rfy: 0 }],
    [0.12, { rfx: 5.5, rfy: -2.5 }],
    [0.25, { rfx: 4.5, rfy: 0 }],
    [0.37, { rfx: 5.5, rfy: -2.5, nod: 8 }],
    [0.5,  { rfx: 4.5, rfy: 0 }],
    [0.62, { rfx: 5.5, rfy: -2.5 }],
    [0.75, { rfx: 4.5, rfy: 0, nod: 4 }],
    [0.87, { rfx: 5.5, rfy: -2.5 }]
  ]});

  // whistle: hands clasped behind his back, rocking heel to toe, looking about.
  def('pp_whistle', { dur: 2.0, loop: true, face: 'happy', keys: [
    [0.0, { y: -16.8, lean: -3, nod: -10, las: -32, lae: 45, ras: -28, rae: 50 }],
    [0.5, { y: -17.5, lean: 4,  nod: -4 }],
    [1.0, { y: -16.8, lean: -3, nod: -14 }],
    [1.5, { y: -17.4, lean: 3,  nod: -6 }]
  ]});

  // sit: plonks down and waits, arms resting on his knees, head bobbing.
  def('pp_sit', { dur: 3.0, loop: true, mode: { ll: 'fk', rl: 'fk', la: 'ik', ra: 'ik' }, bend: { la: 1, ra: 1 }, keys: [
    [0.0, { x: -3, y: -3.4, lean: 6,  nod: 6,  lhx: 3.5, lhy: -9.5, rhx: 5, rhy: -9, lls: 125, llk: 115, rls: 130, rlk: 118 }],
    [1.0, { x: -3, y: -3.4, lean: 9,  nod: 12 }],
    [2.0, { x: -3, y: -3.2, lean: 5,  nod: -4 }]
  ]});

  /* ------------------------------------------------------------ LOOKING */

  // pointUp: spots the falling block and points at it, bouncing with excitement.
  def('pp_pointUp', { dur: 0.8, loop: true, face: 'happy', mode: { la: 'ik' }, bend: { la: 1 }, keys: [
    [0.0, { y: -16.8, lean: -4, nod: -26, lhx: -5.5, lhy: -18, ras: 168, rae: 2 }],
    [0.2, { y: -17.8, lean: -6, nod: -30, ras: 172 }],
    [0.4, { y: -16.6, lean: -4, nod: -26, ras: 165 }],
    [0.6, { y: -17.6, lean: -6, nod: -30, ras: 172 }]
  ]});

  // edgePeer: at the lip of a drop, leaning out to look down, arms back for balance.
  def('pp_edgePeer', { dur: 1.8, loop: true, face: 'scared', keys: [
    [0.0, { x: -1,   y: -16.2, lean: 24, nod: 30, las: -55, lae: 10, ras: -42, rae: 15, lfx: -5, rfx: 3 }],
    [0.45, { x: -0.3, y: -16.0, lean: 28, nod: 34, las: -70, lae: 5,  ras: -30, rae: 25 }],
    [0.9, { x: -1.4, y: -16.3, lean: 20, nod: 26, las: -45, lae: 20, ras: -55, rae: 8 }],
    [1.35, { x: -0.6, y: -16.1, lean: 26, nod: 32, las: -62, lae: 8,  ras: -38, rae: 18 }]
  ]});

  /* ------------------------------------------------------------ SLIPS, SCARES, BREATH */

  // slip: feet shoot out from under him on ice; he lands on his backside.
  def('pp_slip', { dur: 0.9, mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: 0,  y: -16.8, lean: 3,   nod: 0,   las: 6,   lae: 12, ras: -6,  rae: 16, lls: 0,   llk: 6,  rls: 0,   rlk: 6, face: 'normal' }],
    [0.12, { x: -2, y: -14.5, lean: -32, nod: -20, las: 150, lae: 25, ras: 120, rae: 40, lls: 75,  llk: 5,  rls: 100, rlk: 10, face: 'scared' }],
    [0.3,  { x: -3, y: -4,    lean: -18, nod: -8,  las: -45, lae: 10, ras: -40, rae: 15, lls: 80,  llk: 10, rls: 88,  rlk: 6 }],
    [0.45, { x: -3, y: -3.2,  lean: -12, nod: 6,   las: -40, lae: 12, ras: -35, rae: 18, lls: 82,  llk: 14, rls: 86,  rlk: 10, face: 'dizzy' }],
    [0.9,  { x: -3, y: -3.2,  lean: -8,  nod: 10,  las: -38, lae: 12, ras: -34, rae: 18, lls: 82,  llk: 14, rls: 86,  rlk: 10 }]
  ]});

  // jumpScare: a startled hop with every limb flung out.
  def('pp_jumpScare', { dur: 0.6, face: 'scared', keys: [
    [0.0,  { y: -16.8, lean: 3,  nod: 0,   las: 6,   lae: 12, ras: -6,  rae: 16, lfx: -3, lfy: 0,  rfx: 3,  rfy: 0 }],
    [0.12, { y: -25,   lean: -6, nod: -14, las: 135, lae: 10, ras: 140, rae: 8,  lfx: -8, lfy: -6, rfx: 8,  rfy: -6 }],
    [0.3,  { y: -22,   lean: -2, nod: -8,  las: 120, lae: 20, ras: 125, rae: 15, lfx: -5, lfy: -2, rfx: 5,  rfy: -2 }],
    [0.42, { y: -15,   lean: 8,  nod: 4,   las: 40,  lae: 30, ras: 30,  rae: 35, lfx: -4, lfy: 0,  rfx: 4,  rfy: 0 }],
    [0.6,  { y: -16.8, lean: 3,  nod: 0,   las: 6,   lae: 12, ras: -6,  rae: 16, lfx: -3, rfx: 3 }]
  ]});

  // pant: bent over, hands on knees, heaving after a hard climb or a sprint.
  def('pp_pant', { dur: 0.7, loop: true, face: 'strain', mode: { la: 'ik', ra: 'ik' }, bend: { la: 1, ra: 1 }, keys: [
    [0.0,  { x: -1, y: -14.6, lean: 46, nod: 8,  lhx: 4,   lhy: -9.5, rhx: 5,   rhy: -9, lfx: -4, rfx: 3 }],
    [0.35, { x: -1, y: -15.3, lean: 40, nod: 0,  lhx: 4,   lhy: -9.5, rhx: 5,   rhy: -9 }]
  ]});

  /* ------------------------------------------------------------ CELEBRATIONS AND WAVES */

  // dance: a side-to-side groove, arms pumping in turn.
  def('pp_dance', { dur: 1.0, loop: true, face: 'happy', keys: [
    [0.0,  { x: -2, y: -15.6, lean: -6, nod: -6, las: 150, lae: 30, ras: 70,  rae: 90, lfx: -5, lfy: 0,  rfx: 3,  rfy: -3 }],
    [0.25, { x: 0,  y: -16.8, lean: 0,  nod: 4,  las: 90,  lae: 80, ras: 110, rae: 60, lfx: -3, lfy: 0,  rfx: 3,  rfy: 0 }],
    [0.5,  { x: 2,  y: -15.6, lean: 6,  nod: -6, las: 70,  lae: 90, ras: 155, rae: 25, lfx: -3, lfy: -3, rfx: 5,  rfy: 0 }],
    [0.75, { x: 0,  y: -16.8, lean: 0,  nod: 4,  las: 110, lae: 60, ras: 90,  rae: 80, lfx: -3, lfy: 0,  rfx: 3,  rfy: 0 }]
  ]});

  // flex: double biceps, squeezing in pulses.
  def('pp_flex', { dur: 0.8, loop: true, face: 'happy', keys: [
    [0.0, { y: -16.6, lean: -3, nod: -6, las: 92, lae: 95, ras: 92, rae: 95, lfx: -5, rfx: 5 }],
    [0.4, { y: -16.1, lean: -5, nod: -10, las: 100, lae: 110, ras: 100, rae: 110 }]
  ]});

  // fistPump: a quick "YES!": fist up, then yanked down.
  def('pp_fistPump', { dur: 0.8, face: 'happy', keys: [
    [0.0,  { y: -16.8, lean: 3,  nod: 0,   las: 6,  lae: 12, ras: -6,  rae: 16 }],
    [0.12, { y: -15,   lean: 8,  nod: 4,   las: 10, lae: 20, ras: 40,  rae: 120 }],
    [0.28, { y: -18,   lean: -4, nod: -18, las: 20, lae: 15, ras: 176, rae: 4 }],
    [0.48, { y: -15.4, lean: 16, nod: 10,  las: 15, lae: 20, ras: 65,  rae: 115 }],
    [0.8,  { y: -16.8, lean: 3,  nod: 0,   las: 6,  lae: 12, ras: -6,  rae: 16 }]
  ]});

  // waveBig: both arms high, waving side to side at you.
  def('pp_waveBig', { dur: 0.9, loop: true, face: 'happy', keys: [
    [0.0,  { x: -1, y: -17,   lean: -3, nod: -8, las: 165, lae: 8,  ras: 145, rae: 30 }],
    [0.45, { x: 1,  y: -16.4, lean: 2,  nod: -4, las: 140, lae: 30, ras: 168, rae: 6 }]
  ]});

  /* ------------------------------------------------------------ TRIPS AND GET-UPS */

  // trip: toe catches, he pitches forward, hops twice and catches himself.
  def('pp_trip', { dur: 0.8, keys: [
    [0.0,  { x: 0,   y: -16.6, lean: 10, nod: 0,   las: 30,  lae: 20, ras: -20, rae: 20, lfx: -3, lfy: 0,  rfx: 3,  rfy: 0 }],
    [0.1,  { x: 2,   y: -15.2, lean: 38, nod: -12, las: 120, lae: 25, ras: 100, rae: 30, lfx: -7, lfy: -1, rfx: 4,  rfy: -2, face: 'scared' }],
    [0.25, { x: 4,   y: -14.5, lean: 44, nod: -16, las: 140, lae: 20, ras: 80,  rae: 40, lfx: -2, lfy: -4, rfx: 9,  rfy: 0 }],
    [0.42, { x: 3,   y: -15.6, lean: 26, nod: -8,  las: 90,  lae: 30, ras: 120, rae: 25, lfx: 6,  lfy: 0,  rfx: 4,  rfy: -3 }],
    [0.6,  { x: 1,   y: -16.4, lean: 10, nod: 0,   las: 30,  lae: 25, ras: 20,  rae: 25, lfx: -2, lfy: 0,  rfx: 4,  rfy: 0, face: 'normal' }],
    [0.8,  { x: 0,   y: -16.8, lean: 3,  nod: 0,   las: 6,   lae: 12, ras: -6,  rae: 16, lfx: -3, lfy: 0,  rfx: 3,  rfy: 0 }]
  ]});

  // kipUp: from flat on his back, knees to chest, then springs to his feet, arms out: ta-da.
  def('pp_kipUp', { dur: 1.0, mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -6, y: -3,    lean: -82, nod: -10, las: -150, lae: 10, ras: -140, rae: 10, lls: 95,  llk: 10,  rls: 100, rlk: 15, face: 'grit' }],
    [0.25, { x: -5, y: -4,    lean: -78, nod: 6,   las: -170, lae: 40, ras: -165, rae: 40, lls: 150, llk: 130, rls: 155, rlk: 125 }],
    [0.45, { x: -1, y: -11,   lean: -25, nod: -8,  las: -60,  lae: 20, ras: -55,  rae: 20, lls: 20,  llk: 60,  rls: 30,  rlk: 70 }],
    [0.65, { x: 0,  y: -17.4, lean: 2,   nod: -8,  las: 130,  lae: 10, ras: 135,  rae: 8,  lls: -6,  llk: 6,   rls: 6,   rlk: 6, face: 'happy' }],
    [1.0,  { x: 0,  y: -16.8, lean: 3,   nod: 0,   las: 6,    lae: 12, ras: -6,   rae: 16, lls: 0,   llk: 6,   rls: 0,   rlk: 6, face: 'normal' }]
  ]});

  /* ------------------------------------------------------------ DEATHS */

  // deathBurn: lava. Leaps up clutching his backside, hops again, then keels over.
  def('pp_deathBurn', { dur: 2.2, face: 'scared', mode: { la: 'ik', ra: 'ik' }, bend: { la: 1, ra: 1 }, keys: [
    [0.0, { x: 0, y: -16.8, lean: 3,  nod: 0,   lhx: -2,  lhy: -16, rhx: 2,  rhy: -16, lfx: -3, lfy: 0,   rfx: 3,  rfy: 0 }],
    [0.15, { x: 0, y: -32,  lean: 22, nod: -22, lhx: -7,  lhy: -30, rhx: -6, rhy: -28, lfx: -5, lfy: -11, rfx: 2,  rfy: -9 }],
    [0.45, { x: 0, y: -18,  lean: 18, nod: -10, lhx: -7,  lhy: -16, rhx: -6, rhy: -15, lfx: -3, lfy: 0,   rfx: 3,  rfy: 0 }],
    [0.65, { x: 0, y: -27,  lean: 25, nod: -20, lhx: -7,  lhy: -25, rhx: -6, rhy: -24, lfx: -4, lfy: -8,  rfx: 4,  rfy: -6 }],
    [0.95, { x: 0, y: -16,  lean: 20, nod: 0,   lhx: -6,  lhy: -15, rhx: -5, rhy: -14, lfx: -3, lfy: 0,   rfx: 3,  rfy: 0 }],
    [1.4, { x: 1, y: -8,    lean: 48, nod: 20,  lhx: 6,   lhy: -2,  rhx: 9,  rhy: -1,  lfx: -3, lfy: 0,   rfx: 2,  rfy: 0, face: 'dizzy' }],
    [2.2, { x: 4, y: -4,    lean: 82, nod: 10,  lhx: 18,  lhy: -2,  rhx: 21, rhy: -1,  lfx: -10, lfy: 0,  rfx: -8, rfy: 0 }]
  ]});

  // deathSink: water. Arms thrashing overhead, then one hand left above the surface.
  def('pp_deathSink', { dur: 2.4, face: 'scared', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0, { y: -17,   lean: -4, nod: -18, las: 160, lae: 15, ras: 130, rae: 45, lls: 20,  llk: 30, rls: -10, rlk: 40 }],
    [0.3, { y: -17.5, lean: -8, nod: -24, las: 130, lae: 45, ras: 165, rae: 10, lls: -15, llk: 50, rls: 25,  rlk: 20 }],
    [0.6, { y: -17,   lean: -4, nod: -18, las: 165, lae: 10, ras: 130, rae: 40, lls: 25,  llk: 25, rls: -15, rlk: 45 }],
    [0.9, { y: -17.4, lean: -6, nod: -22, las: 128, lae: 50, ras: 168, rae: 6,  lls: -10, llk: 45, rls: 20,  rlk: 25 }],
    [1.5, { y: -17,   lean: -2, nod: -10, las: 90,  lae: 40, ras: 175, rae: 4,  lls: 5,   llk: 20, rls: 5,   rlk: 20, face: 'dizzy' }],
    [2.4, { y: -17,   lean: 0,  nod: -6,  las: 40,  lae: 30, ras: 178, rae: 2,  lls: 0,   llk: 15, rls: 0,   rlk: 15 }]
  ]});

  // deathSwoon: the tower tops out on him. Back of the hand to his brow, knees wobble, faints backwards.
  def('pp_deathSwoon', { dur: 1.8, mode: { ra: 'ik' }, keys: [
    [0.0, { x: 0,  y: -16.8, lean: 3,   nod: 0,   las: 6,   lae: 12, rhx: 3,  rhy: -18, lfx: -3, rfx: 3, face: 'scared' }],
    [0.4, { x: 0,  y: -16.2, lean: -10, nod: -20, las: 60,  lae: 30, rhx: 6,  rhy: -46 }],
    [0.8, { x: -1, y: -14.5, lean: -14, nod: -26, las: 80,  lae: 20, rhx: 5,  rhy: -43, lfx: -2, rfx: 4 }],
    [1.2, { x: -4, y: -8,    lean: -52, nod: -10, las: 120, lae: 10, rhx: -10, rhy: -30, lfx: 2, rfx: 6, face: 'dizzy' }],
    [1.8, { x: -6, y: -3,    lean: -84, nod: 0,   las: 175, lae: 5,  rhx: -24, rhy: -6,  lfx: 6, rfx: 10 }]
  ]});

  /* ------------------------------------------------------------ WEATHER AND BOUNCE */

  // windBrace: leaning hard into a gust, front arm shielding his face, back arm flapping.
  def('pp_windBrace', { dur: 0.5, loop: true, face: 'strain', keys: [
    [0.0,  { x: 1,   y: -15.8, lean: 26, nod: 12, las: -60, lae: 10, ras: 120, rae: 125, lfx: -7, rfx: 6 }],
    [0.25, { x: 1.4, y: -15.6, lean: 28, nod: 14, las: -45, lae: 25, ras: 122, rae: 122 }]
  ]});

  // bounceSpread: launched off a bouncy block: star jump, then a tuck.
  def('pp_bounceSpread', { dur: 0.6, loop: true, face: 'happy', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0, { y: -17, lean: 0,  nod: -10, las: 140, lae: 5,  ras: 150, rae: 5,  lls: -30, llk: 8,   rls: 30,  rlk: 8 }],
    [0.3, { y: -16, lean: 10, nod: 6,   las: 80,  lae: 60, ras: 90,  rae: 50, lls: 60,  llk: 110, rls: 70,  rlk: 115 }]
  ]});

  /* ------------------------------------------------------------ TEMPER */

  // stomp: fists clenched, stamping one foot then the other.
  def('pp_stomp', { dur: 0.9, face: 'angry', keys: [
    [0.0,  { y: -16.8, lean: 8,  nod: 12, las: 8, lae: 38, ras: 8, rae: 38, lfx: -3, lfy: 0,  rfx: 3, rfy: 0 }],
    [0.15, { y: -17.4, lean: 6,  nod: 10, rfx: 4, rfy: -9 }],
    [0.25, { y: -15.4, lean: 12, nod: 16, rfx: 3, rfy: 0 }],
    [0.5,  { y: -17.4, lean: 6,  nod: 10, lfx: -4, lfy: -9 }],
    [0.6,  { y: -15.4, lean: 12, nod: 16, lfx: -3, lfy: 0 }],
    [0.9,  { y: -16.8, lean: 6,  nod: 8,  las: 6, lae: 30, ras: 6, rae: 30 }]
  ]});

  // rubHead: wincing, rubbing the bump on top of his head.
  def('pp_rubHead', { dur: 1.2, face: 'strain', mode: { la: 'ik', ra: 'ik' }, bend: { la: 1, ra: -1 }, keys: [
    [0.0,  { y: -16.6, lean: 8,  nod: 14, lhx: -5.5, lhy: -18, rhx: 3,   rhy: -48 }],
    [0.2,  { rhx: 1,   rhy: -49 }],
    [0.4,  { rhx: 4,   rhy: -48.5 }],
    [0.6,  { rhx: 1.5, rhy: -49.5, nod: 18 }],
    [0.8,  { rhx: 4,   rhy: -48 }],
    [1.0,  { rhx: 2,   rhy: -49 }],
    [1.2,  { y: -16.8, lean: 4, nod: 6, rhx: 4, rhy: -18 }]
  ]});

  // huff: arms folded, a big indignant breath in and out, head tossed away.
  def('pp_huff', { dur: 1.4, loop: true, face: 'angry', mode: { la: 'ik', ra: 'ik' }, bend: { la: 1, ra: 1 }, keys: [
    [0.0,  { y: -16.8, lean: -2, nod: 6,   lhx: 5,  lhy: -27, rhx: -3, rhy: -29, lfx: -3, rfx: 4, rfy: 0 }],
    [0.35, { y: -17.6, lean: -6, nod: -10, lhx: 5,  lhy: -28.5, rhx: -3, rhy: -30.5 }],
    [0.6,  { y: -16.2, lean: 4,  nod: 14,  lhx: 5,  lhy: -26.5, rhx: -3, rhy: -28.5 }],
    [1.0,  { y: -16.8, lean: 0,  nod: 4,   rfx: 5, rfy: -2.5 }],
    [1.1,  { rfx: 4, rfy: 0 }]
  ]});

  // kickBlock: kicking and pounding at the block in front of him.
  def('pp_kickBlock', { dur: 0.9, loop: true, face: 'angry', keys: [
    [0.0,  { x: -1, y: -16.6, lean: 8,   nod: 6,  las: 60,  lae: 70, ras: 75,  rae: 60, lfx: -4, lfy: 0, rfx: -4, rfy: -7 }],
    [0.2,  { x: -1, y: -16.8, lean: -10, nod: -2, las: -30, lae: 20, ras: -20, rae: 20, rfx: 11, rfy: -9 }],
    [0.35, { x: -1, y: -16.6, lean: 4,   nod: 6,  rfx: 3, rfy: 0 }],
    [0.5,  { x: 0,  y: -16.4, lean: 18,  nod: 10, las: 100, lae: 30, ras: 70,  rae: 60 }],
    [0.6,  { x: 0,  y: -16.4, lean: 20,  nod: 12, las: 70,  lae: 60, ras: 100, rae: 30 }],
    [0.7,  { x: 0,  y: -16.4, lean: 18,  nod: 10, las: 100, lae: 30, ras: 70,  rae: 60 }],
    [0.8,  { x: 0,  y: -16.4, lean: 20,  nod: 12, las: 70,  lae: 60, ras: 100, rae: 30 }]
  ]});

  // flail: arms windmilling, hopping on the spot, head shaking.
  def('pp_flail', { dur: 0.6, loop: true, face: 'angry', keys: [
    [0.0,  { x: -1, y: -17.6, lean: -8, nod: -14, las: 170, lae: 20, ras: 40,  rae: 40, lfx: -3, lfy: 0,  rfx: 3,  rfy: -2 }],
    [0.15, { x: 0,  y: -19,   lean: 4,  nod: 10,  las: 90,  lae: 60, ras: 160, rae: 20, lfx: -3, lfy: -4, rfx: 3,  rfy: -4 }],
    [0.3,  { x: 1,  y: -17.6, lean: 8,  nod: -14, las: 30,  lae: 50, ras: 175, rae: 15, lfx: -3, lfy: -2, rfx: 3,  rfy: 0 }],
    [0.45, { x: 0,  y: -19,   lean: -4, nod: 10,  las: 150, lae: 20, ras: 90,  rae: 60, lfx: -3, lfy: -4, rfx: 3,  rfy: -4 }]
  ]});

  // tantrum: flat on his back, kicking his legs and pounding the ground with both fists.
  def('pp_tantrum', { dur: 0.5, loop: true, face: 'angry', mode: { ll: 'fk', rl: 'fk' }, keys: [
    [0.0,  { x: -6, y: -3, lean: -84, nod: 8,  las: 30, lae: 70, ras: 10, rae: 20, lls: 130, llk: 30, rls: 70,  rlk: 90 }],
    [0.12, { x: -6, y: -3.6, lean: -82, nod: -6, las: 10, lae: 20, ras: 30, rae: 70 }],
    [0.25, { x: -6, y: -3, lean: -84, nod: 8,  las: 30, lae: 70, ras: 10, rae: 20, lls: 70,  llk: 90, rls: 130, rlk: 30 }],
    [0.37, { x: -6, y: -3.6, lean: -82, nod: -6, las: 10, lae: 20, ras: 30, rae: 70 }]
  ]});
})();
