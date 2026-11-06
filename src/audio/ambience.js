// Synthesised ambience: rain (hiss, body, droplet patter, umbrella taps, gutter drips), thunder,
// wind, tyres on wet asphalt that follow the nearest real cars, crowd murmur, footsteps and
// city-specific beds (ocean, canal water, distant trains).
export class Ambience {
  constructor(audio) {
    this.a = audio;
    this.ctx = audio.ctx;
    const ctx = this.ctx, B = audio.buses, N = audio.noise;
    // ---------- rain
    this.rainHiss = ctx.createGain(); this.rainHiss.gain.value = 0;
    this.rainLP = ctx.createBiquadFilter(); this.rainLP.type = 'lowpass'; this.rainLP.frequency.value = 7000;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 450;
    audio.loop(N.pink, hp); hp.connect(this.rainLP).connect(this.rainHiss).connect(B.rain);
    this.rainBody = ctx.createGain(); this.rainBody.gain.value = 0;
    const blp = ctx.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 500;
    audio.loop(N.brown, blp); blp.connect(this.rainBody).connect(B.rain);
    this.patLight = this.patterLoop(45, [2200, 6000], 0.6);
    this.patHeavy = this.patterLoop(260, [1500, 5000], 0.5);
    this.patUmb = this.patterLoop(70, [700, 1600], 1.0, 0.012);
    this.patAwn = this.patterLoop(50, [400, 1100], 1.0, 0.02);
    for (const p of [this.patLight, this.patHeavy]) p.out.connect(this.rainLP);
    this.patUmb.out.connect(B.rain); this.patAwn.out.connect(B.rain);
    // ---------- wind
    this.windG = ctx.createGain(); this.windG.gain.value = 0;
    this.windBP = ctx.createBiquadFilter(); this.windBP.type = 'bandpass'; this.windBP.frequency.value = 500; this.windBP.Q.value = 0.6;
    audio.loop(N.pink, this.windBP, 0.6); this.windBP.connect(this.windG).connect(B.wind);
    // ---------- city hum & traffic
    this.hum = ctx.createGain(); this.hum.gain.value = 0;
    const hlp = ctx.createBiquadFilter(); hlp.type = 'lowpass'; hlp.frequency.value = 180;
    audio.loop(N.brown, hlp, 0.7); hlp.connect(this.hum).connect(B.traffic);
    this.cars = [];
    for (let i = 0; i < 3; i++) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.5;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
      const eng = ctx.createBiquadFilter(); eng.type = 'lowpass'; eng.frequency.value = 140;
      const g = ctx.createGain(); g.gain.value = 0;
      const eg = ctx.createGain(); eg.gain.value = 0;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
      audio.loop(N.pink, bp, 0.9 + i * 0.07); bp.connect(lp).connect(g).connect(pan);
      audio.loop(N.brown, eng, 1 + i * 0.1); eng.connect(eg).connect(pan);
      pan.connect(B.traffic);
      this.cars.push({ g, eg, pan, bp });
    }
    // ---------- people murmur
    this.murmur = ctx.createGain(); this.murmur.gain.value = 0;
    for (const [f, q, r] of [[420, 3, 0.9], [1150, 4, 1.1], [2500, 5, 1.0]]) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      const am = ctx.createGain(); am.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 2.5 + Math.random() * 3; const lg = ctx.createGain(); lg.gain.value = 0.35;
      lfo.connect(lg).connect(am.gain); lfo.start();
      audio.loop(N.white, bp, r); bp.connect(am).connect(this.murmur);
    }
    this.murmur.connect(B.people);
    // ---------- city-specific beds
    this.bed = ctx.createGain(); this.bed.gain.value = 0;
    this.bedLP = ctx.createBiquadFilter(); this.bedLP.type = 'lowpass'; this.bedLP.frequency.value = 600;
    this.bedLFO = ctx.createOscillator(); this.bedLFO.frequency.value = 0.09;
    this.bedLFOg = ctx.createGain(); this.bedLFOg.gain.value = 0;
    this.bedLFO.connect(this.bedLFOg).connect(this.bed.gain); this.bedLFO.start();
    audio.loop(N.pink, this.bedLP, 0.8); this.bedLP.connect(this.bed).connect(B.ambience);
    this.distant = ctx.createGain(); this.distant.gain.value = 0.0;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 90;
    audio.loop(N.brown, dlp, 0.5); dlp.connect(this.distant).connect(B.ambience);
    this.timers = { drip: 1, horn: 30, event: 20 };
    this.city = 'nyc';
  }
  /** Pre-render a looped stereo buffer full of droplets. */
  patterLoop(rate, [f0, f1], gain, dur = 0.006) {
    const ctx = this.ctx; const sr = ctx.sampleRate; const len = sr * 6;
    const buf = ctx.createBuffer(2, len, sr);
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const n = Math.floor(rate * 6);
    for (let k = 0; k < n; k++) {
      const start = Math.floor(Math.random() * (len - sr * 0.05));
      const f = f0 + Math.random() * (f1 - f0);
      const a = (0.2 + Math.random() * 0.8) * 0.5;
      const pan = Math.random();
      const decay = dur * (0.6 + Math.random() * 0.8);
      const m = Math.floor(sr * decay * 5);
      for (let i = 0; i < m && start + i < len; i++) {
        const t = i / sr;
        const env = Math.exp(-t / decay);
        const v = (Math.sin(2 * Math.PI * f * t) * 0.7 + (Math.random() * 2 - 1) * 0.3) * env * a;
        L[start + i] += v * (1 - pan); R[start + i] += v * pan;
      }
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const out = ctx.createGain(); out.gain.value = 0;
    src.connect(out); src.start(ctx.currentTime + Math.random() * 0.2);
    return { out, gain };
  }
  setCity(id) {
    this.city = id;
    const ctx = this.ctx, t = ctx.currentTime;
    // ocean swell for Miami, canal water for Kyoto, river for Chicago
    if (id === 'miami') { this.bedLP.frequency.setTargetAtTime(500, t, 0.5); this.bedLFO.frequency.value = 0.08; this.bedBase = 0.35; this.bedLFOg.gain.setTargetAtTime(0.3, t, 0.5); }
    else if (id === 'kyoto') { this.bedLP.type = 'bandpass'; this.bedLP.frequency.setTargetAtTime(1800, t, 0.5); this.bedLFO.frequency.value = 0.6; this.bedBase = 0.12; this.bedLFOg.gain.setTargetAtTime(0.04, t, 0.5); }
    else if (id === 'chicago') { this.bedLP.type = 'lowpass'; this.bedLP.frequency.setTargetAtTime(350, t, 0.5); this.bedLFO.frequency.value = 0.15; this.bedBase = 0.1; this.bedLFOg.gain.setTargetAtTime(0.05, t, 0.5); }
    else { this.bedLP.type = 'lowpass'; this.bedLP.frequency.setTargetAtTime(250, t, 0.5); this.bedBase = 0.05; this.bedLFOg.gain.setTargetAtTime(0.0, t, 0.5); }
  }
  thunder(distance, rnd = Math.random()) {
    const ctx = this.ctx, B = this.a.buses;
    const delay = Math.min(3.5, distance / 343 * 0.8) + 0.2;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource(); src.buffer = this.a.noise.brown; src.playbackRate.value = 0.6 + rnd * 0.3;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 - Math.min(700, distance * 0.6);
    const g = ctx.createGain(); g.gain.value = 0;
    const near = Math.max(0, 1 - distance / 900);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.6 + near * 0.9, t0 + 0.05 + (1 - near) * 0.4);
    let tt = t0 + 0.5;
    for (let k = 0; k < 6; k++) { tt += 0.4 + Math.random() * 0.9; g.gain.linearRampToValueAtTime((0.25 + Math.random() * 0.6) * (1 - k / 7), tt); }
    g.gain.linearRampToValueAtTime(0, tt + 2.5);
    lp.frequency.setValueAtTime(lp.frequency.value, t0); lp.frequency.exponentialRampToValueAtTime(120, tt + 2.5);
    src.connect(lp).connect(g).connect(B.thunder);
    src.start(t0, Math.random() * 2); src.stop(tt + 3);
  }
  footstep(speed, wet, umbrella) {
    const ctx = this.ctx, B = this.a.buses; const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.a.noise.white; src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700 + Math.random() * 400; bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35 * Math.min(1.3, speed / 1.4), t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(bp).connect(g).connect(B.footsteps); src.start(t, Math.random() * 2); src.stop(t + 0.15);
    if (wet > 0.2) { // splash
      const s2 = ctx.createBufferSource(); s2.buffer = this.a.noise.white;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, t + 0.02); g2.gain.linearRampToValueAtTime(0.12 * wet, t + 0.04); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      s2.connect(hp).connect(g2).connect(B.footsteps); s2.start(t + 0.02, Math.random() * 2); s2.stop(t + 0.25);
    }
    void umbrella;
  }
  drip(level = 1) {
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain(); const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    const f = 900 + Math.random() * 1400;
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.05);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06 * level, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18);
    if (pan.pan) pan.pan.value = Math.random() * 1.6 - 0.8;
    o.connect(g).connect(pan).connect(this.a.buses.rain); o.start(t); o.stop(t + 0.2);
  }
  horn() {
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (pan.pan) pan.pan.value = Math.random() * 1.4 - 0.7;
    const f = 380 + Math.random() * 80;
    for (const ff of [f, f * 1.26]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = ff; o.connect(lp); o.start(t); o.stop(t + 0.5); }
    const dur = Math.random() < 0.5 ? 0.18 : 0.38;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 0.02); g.gain.setValueAtTime(0.025, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.05);
    lp.connect(g).connect(pan).connect(this.a.buses.traffic);
  }
  bell() { // soft temple-bell-like tone (Kyoto)
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + 7);
    for (const [r, a] of [[1, 1], [2.76, 0.4], [5.4, 0.2], [0.5, 0.5]]) { const o = ctx.createOscillator(); o.frequency.value = 196 * r; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + 7); }
    g.connect(this.a.buses.ambience);
  }
  trainPass() { // distant elevated train rumble (Chicago)
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.a.noise.brown; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 5); g.gain.linearRampToValueAtTime(0, t + 12);
    src.connect(lp).connect(g).connect(this.a.buses.ambience); src.start(t); src.stop(t + 12.5);
  }
  update(dt, s, st) {
    const ctx = this.ctx, t = ctx.currentTime, a = this.a;
    const r = s.rainIntensity * (st.hideRain ? 0 : 1);
    const under = st.umbrellaOpen && !st.sheltered;
    const sheltered = !!st.sheltered;
    const muffle = sheltered || st.indoorish;
    this.rainHiss.gain.setTargetAtTime(Math.pow(r, 0.8) * 0.55 * (1 + s.storm * 0.3), t, 0.4);
    this.rainBody.gain.setTargetAtTime(r * r * 0.5 * (1 + s.storm * 0.5), t, 0.5);
    this.rainLP.frequency.setTargetAtTime(muffle ? 2200 : under ? 5200 : 8000, t, 0.3);
    this.patLight.out.gain.setTargetAtTime(Math.min(1, r * 2) * 0.5, t, 0.4);
    this.patHeavy.out.gain.setTargetAtTime(Math.max(0, r - 0.35) * 0.9, t, 0.4);
    this.patUmb.out.gain.setTargetAtTime(under ? Math.min(1, r * 1.5) * 0.55 : 0, t, 0.15);
    this.patAwn.out.gain.setTargetAtTime(sheltered ? Math.min(1, r * 1.5) * 0.6 : 0, t, 0.2);
    // wind gusts
    const gust = 0.6 + 0.4 * Math.sin(performance.now() / 3100) * Math.sin(performance.now() / 1700);
    this.windG.gain.setTargetAtTime((s.wind * 0.5 + s.storm * 0.25) * gust, t, 0.5);
    this.windBP.frequency.setTargetAtTime(300 + gust * 500 + s.wind * 300, t, 0.6);
    // traffic
    const traffic = s.citySounds ? 1 : 0;
    this.hum.gain.setTargetAtTime((0.12 + s.traffic * 0.35) * traffic * (this.city === 'kyoto' ? 0.25 : 1), t, 1);
    const near = st.cars || [];
    this.cars.forEach((c, i) => {
      const v = near[i];
      if (!v || !traffic) { c.g.gain.setTargetAtTime(0, t, 0.3); c.eg.gain.setTargetAtTime(0, t, 0.3); return; }
      const f = Math.max(0, 1 - v.d / 45);
      const sp = Math.min(1, v.speed / 10);
      const wet = 0.4 + 0.6 * s.wetness;
      c.g.gain.setTargetAtTime(f * f * sp * 0.55 * wet * (v.type === 'bike' ? 0.15 : 1), t, 0.12);
      c.eg.gain.setTargetAtTime(f * f * (0.15 + sp * 0.25) * (v.type === 'bus' ? 2.2 : v.type === 'bike' ? 0 : 1), t, 0.15);
      c.bp.frequency.setTargetAtTime(700 + sp * 900, t, 0.2);
      if (c.pan.pan) {
        const ang = Math.atan2(v.x - st.cam.x, v.z - st.cam.z);
        const rel = ang - st.yawWorld;
        c.pan.pan.setTargetAtTime(Math.max(-0.9, Math.min(0.9, Math.sin(rel))), t, 0.1);
      }
    });
    // people
    this.murmur.gain.setTargetAtTime(s.citySounds ? Math.min(1, (st.people || 0) / 10) * 0.25 : 0, t, 0.8);
    // beds
    this.bed.gain.setTargetAtTime((this.bedBase || 0.05) * (s.citySounds ? 1 : 0.4), t, 1);
    this.distant.gain.setTargetAtTime(s.citySounds ? 0.25 : 0.05, t, 1);
    // occasional events
    const T = this.timers;
    T.drip -= dt;
    if (T.drip <= 0 && r > 0.05) { this.drip(sheltered ? 1.5 : 0.8); T.drip = (sheltered ? 0.4 : 1.2) + Math.random() * 3 / (0.3 + r); }
    T.horn -= dt;
    if (T.horn <= 0) { if (s.citySounds && s.traffic > 0.2 && (this.city === 'nyc' || this.city === 'chicago' || this.city === 'la' || this.city === 'miami')) this.horn(); T.horn = 25 + Math.random() * 70 / (0.3 + s.traffic); }
    T.event -= dt;
    if (T.event <= 0) {
      if (s.citySounds) { if (this.city === 'kyoto') this.bell(); else if (this.city === 'chicago') this.trainPass(); }
      T.event = 60 + Math.random() * 90;
    }
    void a;
  }
}
