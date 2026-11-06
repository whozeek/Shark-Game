// Audio graph: master → compressor → speakers, with separate buses for music and each ambience
// layer. Created only after the user presses a button, as browsers require.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.buses = {};
  }
  async start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Web Audio is not supported in this browser.');
    const ctx = new AC({ latencyHint: 'playback' });
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.knee.value = 12; this.comp.ratio.value = 3;
    this.comp.attack.value = 0.01; this.comp.release.value = 0.3;
    this.master.connect(this.comp).connect(ctx.destination);
    for (const name of ['music', 'rain', 'thunder', 'traffic', 'people', 'wind', 'ambience', 'footsteps']) {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(this.master); this.buses[name] = g;
    }
    this.noise = {
      white: this.makeNoise('white', 3),
      pink: this.makeNoise('pink', 4),
      brown: this.makeNoise('brown', 5),
    };
    if (ctx.state === 'suspended') await ctx.resume();
    this.ready = true;
    // resume when coming back to the tab (iOS suspends contexts)
    document.addEventListener('visibilitychange', () => { if (!document.hidden && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); });
  }
  makeNoise(type, seconds) {
    const ctx = this.ctx; const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'white') d[i] = w * 0.5;
        else if (type === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      }
      // crossfade the loop seam
      const f = Math.floor(ctx.sampleRate * 0.05);
      for (let i = 0; i < f; i++) { const t = i / f; d[i] = d[i] * t + d[len - f + i] * (1 - t); }
    }
    return buf;
  }
  loop(buffer, dest, rate = 1) {
    const s = this.ctx.createBufferSource();
    s.buffer = buffer; s.loop = true; s.playbackRate.value = rate;
    s.loopEnd = buffer.duration - 0.05;
    s.connect(dest); s.start(this.ctx.currentTime + Math.random() * 0.1, Math.random() * buffer.duration * 0.5);
    return s;
  }
  setBus(name, v, ramp = 0.3) {
    const b = this.buses[name]; if (!b) return;
    b.gain.setTargetAtTime(v, this.ctx.currentTime, ramp);
  }
  setMaster(v) { if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
}
