// Original procedural lo-fi music. Every track is composed in the browser from a seed:
// jazzy chord progressions with voice leading, Rhodes-style FM keys, plucked guitar, warm bass,
// swung drums, melodies built from repeating motifs, tape wobble, vinyl crackle and reverb.
// No samples, no copyrighted material and no streaming service.
import { RNG } from '../core/rng.js';

export const STYLES = {
  lofi: { label: 'Lo-fi hip-hop' },
  jazzhop: { label: 'Rainy jazz-hop' },
  chill: { label: 'Chill beats' },
  latenight: { label: 'Late-night lo-fi' },
  coffee: { label: 'Coffee-shop beats' },
  ambient: { label: 'Ambient lo-fi' },
};

export const TRACKS = [
  { title: 'Umbrella Weather', style: 'lofi', seed: 101, bpm: 82, key: 5, minor: false },
  { title: 'Puddle Neon', style: 'latenight', seed: 202, bpm: 72, key: 2, minor: true },
  { title: 'Window Seat Espresso', style: 'coffee', seed: 303, bpm: 88, key: 7, minor: false },
  { title: 'Rain on Bleecker', style: 'jazzhop', seed: 404, bpm: 86, key: 10, minor: false },
  { title: 'Slow Taxi Home', style: 'chill', seed: 505, bpm: 78, key: 9, minor: true },
  { title: 'Fog Over the River', style: 'ambient', seed: 606, bpm: 66, key: 4, minor: true },
  { title: 'Lantern Canal', style: 'coffee', seed: 707, bpm: 74, key: 2, minor: false },
  { title: 'Late Train Lights', style: 'latenight', seed: 808, bpm: 70, key: 0, minor: true },
  { title: 'Warm Radiator', style: 'lofi', seed: 909, bpm: 84, key: 3, minor: false },
  { title: 'Drizzle Sketches', style: 'jazzhop', seed: 1001, bpm: 90, key: 5, minor: true },
  { title: 'Palm Street Mist', style: 'chill', seed: 1102, bpm: 80, key: 8, minor: false },
  { title: '3 A.M. Laundromat', style: 'latenight', seed: 1203, bpm: 68, key: 7, minor: true },
  { title: 'Soft Focus Sunday', style: 'ambient', seed: 1304, bpm: 62, key: 0, minor: false },
  { title: 'Cardigan & Steam', style: 'coffee', seed: 1405, bpm: 92, key: 9, minor: false },
];

// chord qualities as semitone stacks
const Q = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], m7b5: [0, 3, 6, 10], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14], dom9: [0, 4, 7, 10, 14], m11: [0, 3, 7, 10, 17], six9: [0, 4, 7, 9, 14] };
const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
const PROG_MAJ = [
  [[2, 'm9'], [5, 'dom9'], [1, 'maj9'], [1, 'maj7']],
  [[1, 'maj7'], [6, 'm7'], [2, 'm9'], [5, 'dom7']],
  [[4, 'maj7'], [3, 'm7'], [2, 'm7'], [1, 'maj9']],
  [[1, 'maj9'], [4, 'maj7'], [3, 'm7'], [6, 'dom7']],
  [[4, 'maj9'], [5, 'dom9'], [3, 'm7'], [6, 'm9']],
  [[1, 'six9'], [2, 'm7'], [3, 'm7'], [4, 'maj7']],
];
const PROG_MIN = [
  [[1, 'm9'], [4, 'm7'], [7, 'dom7'], [3, 'maj7']],
  [[1, 'm7'], [6, 'maj7'], [2, 'm7b5'], [5, 'dom7']],
  [[1, 'm11'], [4, 'm9'], [1, 'm9'], [5, 'm7']],
  [[6, 'maj7'], [5, 'm7'], [1, 'm9'], [1, 'm7']],
  [[1, 'm9'], [7, 'dom9'], [6, 'maj7'], [5, 'm7']],
];

const DRUMS = {
  lofi: { kick: [[0, 1], [7, 0.5], [10, 0.9]], snare: [[4, 1], [12, 1]], hat: 'eighths', swing: 0.58, ghost: 0.3 },
  jazzhop: { kick: [[0, 1], [6, 0.6], [10, 0.8]], snare: [[4, 0.8], [12, 0.8]], hat: 'ride', swing: 0.62, ghost: 0.45, rim: true },
  chill: { kick: [[0, 1], [8, 0.8], [11, 0.5]], snare: [[4, 0.9], [12, 0.9]], hat: 'eighths', swing: 0.54, ghost: 0.15 },
  latenight: { kick: [[0, 1], [9, 0.7]], snare: [[8, 0.9]], hat: 'sparse', swing: 0.56, ghost: 0.2, rim: true, half: true },
  coffee: { kick: [[0, 0.9], [8, 0.7]], snare: [[4, 0.6], [12, 0.6]], hat: 'shaker', swing: 0.6, ghost: 0.1, rim: true },
  ambient: { kick: [[0, 0.5]], snare: [], hat: 'none', swing: 0.5, ghost: 0 },
};

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class LofiMusic {
  constructor(audio) {
    this.a = audio; this.ctx = audio.ctx;
    const ctx = this.ctx;
    this.out = ctx.createGain(); this.out.gain.value = 1;
    // tape chain
    this.tape = ctx.createBiquadFilter(); this.tape.type = 'lowpass'; this.tape.frequency.value = 9000; this.tape.Q.value = 0.4;
    this.hpf = ctx.createBiquadFilter(); this.hpf.type = 'highpass'; this.hpf.frequency.value = 35;
    this.sat = ctx.createWaveShaper(); this.sat.curve = satCurve(); this.sat.oversample = '2x';
    this.bus = ctx.createGain(); this.bus.gain.value = 0.85;
    this.bus.connect(this.sat).connect(this.tape).connect(this.hpf).connect(this.out).connect(audio.buses.music);
    // reverb
    this.verb = ctx.createConvolver(); this.verb.buffer = this.makeIR(2.6);
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = 0.35;
    this.verbSend.connect(this.verb).connect(this.tape);
    // wobble LFO (shared detune)
    this.wob = ctx.createOscillator(); this.wob.frequency.value = 0.35;
    this.wobG = ctx.createGain(); this.wobG.gain.value = 9;
    this.wob.connect(this.wobG); this.wob.start();
    this.flutter = ctx.createOscillator(); this.flutter.frequency.value = 5.5;
    this.flutG = ctx.createGain(); this.flutG.gain.value = 2.5;
    this.flutter.connect(this.flutG); this.flutter.start();
    // vinyl crackle
    this.crackle = ctx.createBufferSource(); this.crackle.buffer = this.makeCrackle(); this.crackle.loop = true;
    this.crackleG = ctx.createGain(); this.crackleG.gain.value = 0;
    this.crackle.connect(this.crackleG).connect(this.out); this.crackle.start();
    this.playing = false;
    this.index = 0;
    this.shuffle = false;
    this.styleFilter = 'all';
    this.ksCache = new Map();
    this.onChange = null;
    this.timer = null;
    this.history = [];
  }
  makeIR(sec) {
    const ctx = this.ctx; const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * (i < 200 ? i / 200 : 1); } }
    return b;
  }
  makeCrackle() {
    const ctx = this.ctx; const len = ctx.sampleRate * 7;
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.006;
      for (let k = 0; k < 160; k++) { const p = Math.floor(Math.random() * (len - 60)); const a = Math.random() * 0.25 + 0.05; for (let i = 0; i < 40; i++) d[p + i] += (Math.random() * 2 - 1) * a * Math.exp(-i / 6); }
    }
    return b;
  }
  playlist() { return TRACKS.map((t, i) => ({ ...t, i })).filter((t) => this.styleFilter === 'all' || t.style === this.styleFilter); }
  current() { return TRACKS[this.index]; }
  setStyle(style) {
    this.styleFilter = style;
    const list = this.playlist();
    if (list.length && !list.find((t) => t.i === this.index)) { this.index = list[0].i; if (this.playing) this.startTrack(); else this.onChange?.(this.current()); }
  }
  play() {
    if (this.playing) return;
    this.playing = true;
    this.out.gain.cancelScheduledValues(this.ctx.currentTime);
    this.out.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2);
    this.startTrack();
  }
  pause() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer); this.timer = null;
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    this.onChange?.(this.current());
  }
  toggle() { if (this.playing) this.pause(); else this.play(); }
  next() {
    const list = this.playlist(); if (!list.length) return;
    this.history.push(this.index);
    if (this.shuffle && list.length > 1) { let n; do { n = list[Math.floor(Math.random() * list.length)].i; } while (n === this.index); this.index = n; }
    else { const pos = list.findIndex((t) => t.i === this.index); this.index = list[(pos + 1) % list.length].i; }
    if (this.playing) this.startTrack(); else this.onChange?.(this.current());
  }
  prev() {
    const list = this.playlist(); if (!list.length) return;
    if (this.history.length) this.index = this.history.pop();
    else { const pos = list.findIndex((t) => t.i === this.index); this.index = list[(pos - 1 + list.length) % list.length].i; }
    if (this.playing) this.startTrack(); else this.onChange?.(this.current());
  }

  // ------------------------------------------------------------------ composition
  compose(track) {
    const r = new RNG(track.seed);
    const scale = track.minor ? MIN : MAJ;
    const progs = track.minor ? PROG_MIN : PROG_MAJ;
    const progA = r.pick(progs), progB = r.chance(0.6) ? r.pick(progs) : progA;
    const root = 48 + track.key; // C3 + key
    const chordOf = ([deg, q]) => { const rootNote = root + scale[(deg - 1) % 7]; return { root: rootNote, tones: Q[q].map((iv) => rootNote + iv), q }; };
    const style = track.style;
    const sections = style === 'ambient'
      ? [['intro', 4], ['A', 8], ['B', 8], ['break', 4], ['B', 8], ['outro', 4]]
      : [['intro', 4], ['A', 8], ['B', 8], ['break', 4], ['A2', 8], ['B', 8], ['outro', 4]];
    const bars = [];
    for (const [name, n] of sections) {
      for (let b = 0; b < n; b++) {
        const prog = name === 'B' ? progB : progA;
        bars.push({ section: name, chord: chordOf(prog[b % prog.length]), bar: b, len: n });
      }
    }
    // melody motif (two bars of 8th-note positions in pentatonic)
    const penta = track.minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9];
    const motif = [];
    let deg = r.int(0, 4);
    for (let s = 0; s < 32; s += 2) {
      if (r.chance(style === 'ambient' ? 0.7 : 0.45)) continue;
      deg = Math.max(0, Math.min(9, deg + r.pick([-2, -1, -1, 0, 1, 1, 2])));
      motif.push({ step: s + (r.chance(0.2) ? 1 : 0), deg, len: r.pick([1, 2, 2, 3, 4]) });
    }
    return { bars, scale, root, penta, motif, drums: DRUMS[style], style, r };
  }
  startTrack() {
    clearInterval(this.timer);
    const track = this.current();
    this.song = this.compose(track);
    this.stepDur = 60 / track.bpm / 4;
    this.step = 0;
    this.prevVoicing = null;
    this.nextTime = this.ctx.currentTime + 0.25;
    this.crackleG.gain.setTargetAtTime(track.style === 'ambient' ? 0.5 : 0.8, this.ctx.currentTime, 0.5);
    this.verbSend.gain.value = { ambient: 0.6, latenight: 0.45, coffee: 0.3, jazzhop: 0.32, lofi: 0.28, chill: 0.38 }[track.style];
    this.onChange?.(track);
    this.timer = setInterval(() => this.schedule(), 30);
    this.schedule();
  }
  schedule() {
    if (!this.playing) return;
    const ctx = this.ctx;
    // If the tab slept, skip ahead rather than bursting notes.
    if (this.nextTime < ctx.currentTime - 0.3) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.25) {
      const song = this.song;
      const barIdx = Math.floor(this.step / 16);
      if (barIdx >= song.bars.length) { this.next(); return; }
      const st = this.step % 16;
      const swing = song.drums.swing;
      const swingOff = (st % 2 === 1) ? (swing - 0.5) * 2 * this.stepDur : 0;
      this.playStep(song, song.bars[barIdx], barIdx, st, this.nextTime + swingOff);
      this.nextTime += this.stepDur;
      this.step++;
    }
  }
  playStep(song, bar, barIdx, st, t) {
    const r = song.r; const style = song.style; const sec = bar.section;
    const D = song.drums;
    const drumsOn = sec !== 'intro' && sec !== 'break' && sec !== 'outro' && style !== 'ambient' || (style === 'ambient' && (sec === 'B'));
    const lastBarOfSection = bar.bar === bar.len - 1;
    // filter sweep for intro/outro/break
    if (st === 0) {
      const f = sec === 'intro' ? 1200 + 7000 * (bar.bar / bar.len) : sec === 'outro' ? 8000 - 6000 * (bar.bar / bar.len) : sec === 'break' ? 2200 : 9000;
      this.tape.frequency.setTargetAtTime(f, t, 0.8);
    }
    // ---- keys / chords
    if (st === 0 || (style !== 'ambient' && r.chance(0.18) && (st === 6 || st === 10 || st === 14))) {
      const v = this.voice(bar.chord);
      const vel = st === 0 ? 0.55 : 0.35;
      const len = st === 0 ? this.stepDur * (style === 'ambient' ? 16 : r.pick([8, 12, 16])) : this.stepDur * 3;
      v.forEach((n, k) => {
        const strum = (style === 'coffee' ? 0.025 : 0.012) * k + r.range(0, 0.008);
        if (style === 'coffee') this.pluck(n + 12 * (k > 1 ? 0 : 1), t + strum, vel * 0.9);
        else this.keys(n, t + strum, len, vel * (k === 0 ? 0.8 : 1));
      });
      if (style === 'ambient' || style === 'latenight' || sec === 'break') {
        if (st === 0) this.pad(bar.chord.tones.slice(0, 4).map((n) => n + 12), t, this.stepDur * 16, style === 'ambient' ? 0.18 : 0.1);
      }
    }
    // ---- bass
    if (sec !== 'intro' || bar.bar >= bar.len - 1) {
      const rt = bar.chord.root - 12;
      if (st === 0) this.bass(rt, t, this.stepDur * 6, 0.9);
      else if (style !== 'ambient' && st === 10 && r.chance(0.7)) this.bass(r.chance(0.7) ? rt : rt + 7, t, this.stepDur * 3, 0.7);
      else if (style === 'jazzhop' && (st === 4 || st === 8 || st === 12)) this.bass(rt + [0, 3, 4, 7, 10][r.int(0, 4)] - (r.chance(0.3) ? 12 : 0), t, this.stepDur * 3, 0.55);
      else if (st === 14 && r.chance(0.35) && style !== 'ambient') this.bass(rt + r.pick([-1, 2, 5]), t, this.stepDur * 1.5, 0.5);
    }
    // ---- drums
    if (drumsOn) {
      for (const [s, v] of D.kick) if (s === st && (s === 0 || r.chance(0.85))) this.kick(t, v);
      for (const [s, v] of D.snare) if (s === st) (D.rim && r.chance(0.5) ? this.rim(t, v) : this.snare(t, v));
      if (D.ghost && (st === 7 || st === 15) && r.chance(D.ghost)) this.snare(t, 0.15);
      if (D.hat === 'eighths' && st % 2 === 0) this.hat(t, st % 4 === 0 ? 0.35 : 0.22, r.chance(0.05));
      if (D.hat === 'eighths' && st % 2 === 1 && r.chance(D.ghost * 0.5)) this.hat(t, 0.1, false);
      if (D.hat === 'ride' && (st % 4 === 0 || st % 4 === 3)) this.ride(t, st % 4 === 0 ? 0.25 : 0.15);
      if (D.hat === 'sparse' && st % 4 === 2) this.hat(t, 0.18, r.chance(0.15));
      if (D.hat === 'shaker' && st % 2 === 0) this.shaker(t, st % 4 === 2 ? 0.25 : 0.15);
      if (lastBarOfSection && st >= 12 && r.chance(0.35)) this.snare(t, 0.25 + (st - 12) * 0.08);
    } else if (style === 'ambient' && sec === 'A' && st === 0) this.kick(t, 0.25);
    // ---- melody
    const melodyOn = sec === 'B' || (sec === 'A2' && song.style !== 'chill') || (style === 'ambient' && sec !== 'intro');
    if (melodyOn) {
      const pos = (bar.bar % 2) * 16 + st;
      for (const n of song.motif) {
        if (n.step !== pos) continue;
        let deg = n.deg + (bar.bar >= 4 && sec !== 'A2' ? 1 : 0);
        const oct = Math.floor(deg / 5); deg %= 5;
        let note = song.root + 24 + song.penta[deg] + oct * 12;
        // nudge toward a chord tone on strong beats
        if (st % 4 === 0) { const ct = bar.chord.tones.map((x) => x % 12); if (!ct.includes(note % 12)) note += r.chance(0.5) ? 1 : -1; if (!ct.includes(note % 12)) note = note; }
        if (r.chance(0.85)) this.lead(note, t, this.stepDur * n.len * 2, style);
      }
    }
  }
  voice(chord) {
    // keep voicings close to the previous chord, within C3..C5
    const tones = chord.tones.slice(1).map((n) => n);
    let best = null, bd = Infinity;
    for (let inv = 0; inv < tones.length; inv++) {
      const v = tones.map((n, k) => n + (k < inv ? 12 : 0)).sort((a, b) => a - b);
      while (v[0] < 52) v.forEach((_, k) => (v[k] += 12));
      while (v[v.length - 1] > 76) v.forEach((_, k) => (v[k] -= 12));
      const d = this.prevVoicing ? v.reduce((s, n, k) => s + Math.abs(n - (this.prevVoicing[k] ?? n)), 0) : 0;
      if (d < bd) { bd = d; best = v; }
    }
    this.prevVoicing = best;
    return best;
  }
  // ------------------------------------------------------------------ instruments
  env(g, t, a, peak, d, sus, rel, len) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * sus, t + a, d);
    g.gain.setTargetAtTime(0, t + len, rel);
  }
  keys(note, t, len, vel) {
    const ctx = this.ctx; const f = mtof(note);
    const car = ctx.createOscillator(); car.frequency.value = f;
    const mod = ctx.createOscillator(); mod.frequency.value = f; const mg = ctx.createGain();
    mg.gain.setValueAtTime(f * 1.6 * vel, t); mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.8);
    mod.connect(mg).connect(car.frequency);
    const tine = ctx.createOscillator(); tine.frequency.value = f * 4; const tg = ctx.createGain(); tg.gain.setValueAtTime(0.06 * vel, t); tg.gain.exponentialRampToValueAtTime(0.0005, t + 0.3);
    this.wobG.connect(car.detune); this.flutG.connect(car.detune); this.wobG.connect(mod.detune);
    const g = ctx.createGain();
    this.env(g, t, 0.006, 0.16 * vel, 0.9, 0.35, 0.35, len);
    const trem = ctx.createGain(); trem.gain.value = 1;
    car.connect(g); tine.connect(tg).connect(g);
    g.connect(trem); trem.connect(this.bus); trem.connect(this.verbSend);
    const stop = t + len + 2;
    for (const o of [car, mod, tine]) { o.start(t); o.stop(stop); }
    car.onended = () => { try { this.wobG.disconnect(car.detune); this.flutG.disconnect(car.detune); this.wobG.disconnect(mod.detune); } catch { /* already gone */ } };
  }
  pluck(note, t, vel) {
    const ctx = this.ctx;
    const key = note;
    let buf = this.ksCache.get(key);
    if (!buf) {
      const sr = ctx.sampleRate, f = mtof(note), N = Math.round(sr / f), len = Math.floor(sr * 1.8);
      buf = ctx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0); const ring = new Float32Array(N);
      for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
      let idx = 0, prev = 0;
      for (let i = 0; i < len; i++) { const cur = ring[idx]; const nv = 0.497 * (cur + prev); prev = cur; ring[idx] = nv; d[i] = cur; idx = (idx + 1) % N; }
      this.ksCache.set(key, buf);
    }
    const s = ctx.createBufferSource(); s.buffer = buf; this.wobG.connect(s.detune);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const g = ctx.createGain(); g.gain.value = 0.22 * vel;
    s.connect(lp).connect(g); g.connect(this.bus); g.connect(this.verbSend);
    s.start(t); s.onended = () => { try { this.wobG.disconnect(s.detune); } catch { /* noop */ } };
  }
  pad(notes, t, len, vel) {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.3;
    const g = ctx.createGain(); this.env(g, t, 1.4, vel, 1.5, 0.8, 1.2, len);
    lp.connect(g); g.connect(this.bus); g.connect(this.verbSend);
    for (const n of notes) for (const det of [-7, 7]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = det;
      const og = ctx.createGain(); og.gain.value = 0.05; o.connect(og).connect(lp); o.start(t); o.stop(t + len + 4);
    }
  }
  bass(note, t, len, vel) {
    const ctx = this.ctx; const f = mtof(note);
    const o = ctx.createOscillator(); o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; const g2 = ctx.createGain(); g2.gain.value = 0.35;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const g = ctx.createGain(); this.env(g, t, 0.012, 0.42 * vel, 0.4, 0.55, 0.12, len);
    o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(this.bus);
    o.start(t); o2.start(t); o.stop(t + len + 1); o2.stop(t + len + 1);
  }
  lead(note, t, len, style) {
    const ctx = this.ctx; const f = mtof(note);
    const o = ctx.createOscillator(); o.type = style === 'latenight' ? 'triangle' : 'sine'; o.frequency.value = f;
    this.wobG.connect(o.detune);
    const vib = ctx.createOscillator(); vib.frequency.value = 5; const vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.006, t + 0.4);
    vib.connect(vg).connect(o.frequency);
    const g = ctx.createGain(); this.env(g, t, style === 'ambient' ? 0.2 : 0.03, 0.085, 0.5, 0.6, 0.3, len);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500;
    o.connect(lp).connect(g); g.connect(this.bus); g.connect(this.verbSend);
    o.start(t); vib.start(t); o.stop(t + len + 1.5); vib.stop(t + len + 1.5);
    o.onended = () => { try { this.wobG.disconnect(o.detune); } catch { /* noop */ } };
  }
  kick(t, v) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.85 * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g).connect(this.bus); o.start(t); o.stop(t + 0.5);
  }
  noiseHit(t, type, freq, q, decay, v, send = 0) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = this.a.noise.white;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0008, t + decay);
    s.connect(f).connect(g).connect(this.bus);
    if (send) { const sg = ctx.createGain(); sg.gain.value = send; g.connect(sg).connect(this.verbSend); }
    s.start(t, Math.random() * 2); s.stop(t + decay + 0.05);
  }
  snare(t, v) {
    this.noiseHit(t, 'bandpass', 1900, 0.7, 0.2, 0.42 * v, 0.3);
    const ctx = this.ctx; const o = ctx.createOscillator(); o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.06);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.25 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g).connect(this.bus); o.start(t); o.stop(t + 0.12);
  }
  rim(t, v) { this.noiseHit(t, 'bandpass', 3200, 2, 0.05, 0.35 * v, 0.2); const ctx = this.ctx; const o = ctx.createOscillator(); o.frequency.value = 480; const g = ctx.createGain(); g.gain.setValueAtTime(0.18 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); o.connect(g).connect(this.bus); o.start(t); o.stop(t + 0.06); }
  hat(t, v, open) { this.noiseHit(t, 'highpass', 7500, 0.5, open ? 0.28 : 0.045, 0.18 * v); }
  ride(t, v) { this.noiseHit(t, 'bandpass', 6000, 1.5, 0.35, 0.12 * v, 0.1); }
  shaker(t, v) { this.noiseHit(t, 'highpass', 5000, 0.7, 0.07, 0.12 * v); }
}

function satCurve() {
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); }
  return c;
}
