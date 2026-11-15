// App: wires settings, engine, city, walker, stroll, audio and UI together and runs the frame loop.
import * as THREE from 'three';
import { settings, STYLES, PALETTES } from './core/settings.js';
import { resolveQuality, isTouchDevice } from './core/quality.js';
import { Engine } from './render/engine.js';
import { U } from './render/shared.js';
import { CITIES, cityMeta } from './cities/index.js';
import { Controls } from './player/controls.js';
import { Player } from './player/player.js';
import { Stroll } from './player/stroll.js';
import { Umbrella } from './player/umbrella.js';
import { Interactions } from './player/interact.js';
import { PhotoMode } from './player/photo.js';
import { AudioEngine } from './audio/engine.js';
import { Ambience } from './audio/ambience.js';
import { LofiMusic } from './audio/music.js';
import { LocalMusic, MusicRouter } from './audio/localMusic.js';
import { readSharedMood } from './core/moods.js';
import { UI } from './ui/ui.js';
import { SeasonFx } from './render/seasonFx.js';
import { peopleRhythm, trafficRhythm, windowRhythm } from './core/rhythm.js';
import { isOpen } from './world/kit.js';

export class App {
  constructor() {
    this.cities = CITIES;
    this.isTouch = isTouchDevice();
    this.audio = new AudioEngine();
    this.audioReady = false;
    this.time = 0;
    this.expanded = false;
    this.ui = new UI(document.getElementById('ui'), this);
    if (settings.loadError) this.ui.toast('Saved settings could not be read, so defaults are used.', 'error');
  }

  async init() {
    const shared = readSharedMood();
    if (shared && !shared.error) {
      settings.setMany(shared.values);
      this.sharedName = shared.name || 'a shared mood';
      history.replaceState(null, '', location.pathname + location.search);
    } else if (shared?.error) this.ui.toast('That mood link looks damaged, so the usual settings are used.', 'error', 6000);
    try {
      this.quality = resolveQuality(settings.get('quality'));
      this.engine = new Engine(document.getElementById('stage'), this.quality);
      this.engine.userScale = settings.get('resolutionScale');
    } catch (e) {
      this.ui.showError(e.message || String(e));
      throw e;
    }
    const eng = this.engine;
    this.controls = new Controls(eng.renderer.domElement, this.ui);
    this.controls.walkLocked = true; // guided walks only: you choose where to look, the route chooses where to go
    this.player = new Player(eng.camera, this.controls);
    this.stroll = new Stroll(this.player);
    this.seasonFx = new SeasonFx(eng.scene);
    this.snowCover = 0;
    this.seasonW = new THREE.Vector4(0, 0, 1, 0);
    this.umbrella = new Umbrella(eng.camera);
    this.umbrella.setOpen(settings.get('umbrella'), true);
    this.interact = new Interactions();
    this.photo = new PhotoMode(eng, this.controls, settings);
    this.player.onStep = (sp) => { if (this.audioReady) this.amb.footstep(sp, settings.get('wetness') * Math.min(1, settings.get('rainIntensity') * 3 + 0.3), settings.get('umbrella')); };
    eng.rain.onThunder = (d, r) => { if (this.audioReady && settings.get('thunder')) this.amb.thunder(d, r); };
    settings.on('change', (k, v) => this.onSetting(k, v));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.activeElement?.closest?.('.panel') == null) this.onEscape(); });
    await this.loadCity(settings.get('city'), true);
    this.ui.ready();
    // Test hooks: ?autostart=quiet|sound|stroll and ?frames=N (stop after N frames)
    const qs = new URLSearchParams(location.search);
    this.maxFrames = +(qs.get('frames') || 0);
    if (qs.get('autostart')) await this.begin(qs.get('autostart'));
    this.last = performance.now();
    this.frameTimes = [];
    requestAnimationFrame((t) => this.frame(t));
  }

  async loadCity(id, first = false) {
    const meta = cityMeta(id);
    if (!first) this.ui.showLoading(`${meta.name} · ${meta.neighborhood}`);
    const prog = (p, l) => (first ? this.ui.setProgress(p, l) : this.ui.loadingProgress(p, l));
    try {
      prog(0.02, 'Loading ' + meta.name);
      const def = await meta.load();
      this.def = def;
      const cb = await this.engine.loadCity(def, prog);
      this.cb = cb;
      this.player.setCity(cb);
      const camQ = new URLSearchParams(location.search).get('cam');
      if (camQ) { const [x, z, yaw, pitch = 0] = camQ.split(',').map(Number); Object.assign(this.player, { x, z, yaw, pitch }); }
      this.interact.setCity(cb);
      this.stroll.setCity(cb, this.engine.crowd, this.engine.traffic);
      this.engine.crowd.setPopulation(this.popTarget(), settings.values);
      if (this.audioReady) this.amb.setCity(def.id);
      this.placeOnRoute(settings.get('route'), !first && this.walking);
      this.ui.updatePlace(def);
      if (!first) { this.ui.hideLoading(); this.ui.toast(`${def.name} — ${def.neighborhood}`); }
    } catch (e) {
      console.error(e);
      if (!first) this.ui.hideLoading();
      this.ui.showError(`Could not load ${meta.name}: ${e.message || e}`);
      if (!first && this.def && this.def.id !== id) settings.set('city', this.def.id, true);
      if (first) throw e;
    }
  }
  rhythm(kind) {
    if (!settings.get('cityRhythm')) return 1;
    const h = settings.get('timeOfDay');
    return kind === 'traffic' ? trafficRhythm(h) : peopleRhythm(h);
  }
  popTarget() { return Math.round(this.engine.quality.peds * Math.min(1, Math.pow(settings.get('pedestrians'), 1.1) * this.rhythm('people'))); }

  async switchCity(id) {
    if (this.switching || (this.def && this.def.id === id)) return;
    this.switching = true;
    if (this.photo.active) this.togglePhoto();
    settings.set('city', id);
    await this.loadCity(id);
    this.switching = false;
    if (this.ui.panelOpen && this.ui.tab === 'city') this.ui.renderTab();
  }

  async begin(kind) {
    this.ui.hideStart();
    this.ui.showHUD();
    this.started = true;
    if (kind !== 'look') { this.stroll.paused = false; this.walking = true; }
    this.ui.updateWalk?.();
    if (kind !== 'quiet') await this.enableAudio(true);
    this.engine.renderer.domElement.focus();
    if (this.sharedName) this.ui.toast(`Opened ${this.sharedName}`, 'info', 4000);
    this.ui.toast(this.isTouch ? 'Drag to look around · tap a stop to sit down' : 'Drag to look around · Space pauses · E sits at a stop · M for settings', 'info', 5000);
  }
  async enableAudio(playMusic) {
    try {
      await this.audio.start();
      if (!this.amb) {
        this.amb = new Ambience(this.audio);
        this.localMusic = new LocalMusic(this.audio);
        this.localMusic.onError = (m) => this.ui.toast(m, 'error', 6000);
        this.music = new MusicRouter(new LofiMusic(this.audio), this.localMusic);
        await this.localMusic.restore();
        if (settings.get('musicSource') === 'mine' && this.localMusic.tracks.length) this.music.source = 'mine';
        this.music.shuffle = settings.get('shuffle');
        this.music.styleFilter = settings.get('musicStyle');
        if (settings.get('musicStyle') !== 'all') this.music.setStyle(settings.get('musicStyle'));
        this.music.onChange = (t) => this.ui.updateMusic(t, this.music.playing);
        this.amb.setCity(this.def.id);
      }
      this.audioReady = true;
      this.applyVolumes();
      if (playMusic && settings.get('musicOn')) this.music.play();
      this.ui.updateMusic(this.music.current(), this.music.playing);
    } catch (e) {
      this.ui.toast('Sound could not start: ' + (e.message || e), 'error', 6000);
    }
  }
  applyVolumes() {
    if (!this.audioReady) return;
    const s = settings.values, a = this.audio;
    const sm = this.sleepMix || { music: 1, amb: 1 };
    a.setMaster(s.masterVol);
    a.setBus('music', s.musicVol * 0.8 * sm.music, 1.5);
    a.setBus('rain', s.rainVol * sm.amb, 1.5);
    a.setBus('thunder', s.thunderVol * sm.amb, 1.5);
    a.setBus('traffic', s.trafficVol * sm.amb, 1.5);
    a.setBus('people', s.peopleVol * sm.amb, 1.5);
    a.setBus('wind', s.windVol * sm.amb, 1.5);
    a.setBus('ambience', s.ambienceVol * sm.amb, 1.5);
    a.setBus('footsteps', s.footstepsVol * sm.amb, 1.5);
  }
  async toggleMusic() {
    if (!this.audioReady) { await this.enableAudio(true); return; }
    this.music.toggle();
    settings.set('musicOn', this.music.playing);
    this.ui.updateMusic(this.music.current(), this.music.playing);
  }

  onSetting(k, v) {
    if (k === 'route' && this.cb && v !== this.stroll.current?.id) {
      this.ui.fade(() => { this.placeOnRoute(v, false); this.ui.toast(`${this.stroll.current.name} — press Start to walk`); });
    }
    if (k === 'city' && this.def && v !== this.def.id && !this.switching) this.switchCity(v);
    if (k === 'quality') this.changeQuality(v);
    if (k === 'resolutionScale') { this.engine.userScale = v; this.engine.resize(); }
    if (['pedestrians', 'groups', 'dogs', 'umbrellaPct', 'cityRhythm', 'timeOfDay'].includes(k)) this.engine.crowd?.setPopulation(this.popTarget(), settings.values);
    if (k.endsWith('Vol')) this.applyVolumes();
    if (k === 'shuffle' && this.music) this.music.shuffle = v;
    if (k === 'musicStyle' && this.music) this.music.setStyle(v);
    if (k === 'musicSource' && this.music) {
      if (v === 'mine' && !this.localMusic.tracks.length) this.ui.toast('Add some of your own audio files first (Audio → Add music files).');
      this.music.setSource(v);
      this.ui.updateMusic(this.music.current(), this.music.playing);
    }
    if (k === 'timeOfDay' || k === 'rainIntensity' || k === 'storm') this.ui.updatePlace(this.def);
  }
  async changeQuality(v) {
    const q = resolveQuality(v);
    this.engine.applyQuality(q);
    this.quality = q;
    // population pools and reflection taps depend on quality: rebuild the city cleanly
    const id = this.def.id;
    this.engine.crowd?.dispose(); this.engine.crowd = null;
    this.engine.traffic?.dispose(); this.engine.traffic = null;
    this.def = null;
    await this.loadCity(id);
    this.ui.toast(`Graphics: ${q.label}${q.auto ? ' (auto)' : ''}`);
  }

  /** Stand at the start of a route (or keep going on it), facing the way it heads. */
  placeOnRoute(id, keepWalking = false) {
    const r = this.stroll.select(id);
    if (!r) return;
    const P = this.player;
    P.seat = null; P.level = null;
    const st = this.stroll.startPose();
    P.x = st.x; P.z = st.z; P.yaw = st.yaw; P.pitch = -0.03; P.lookYawOff = 0; P.lookPitchOff = 0;
    P.ground = P.groundHere();
    this.stroll.start(true);
    this.stroll.s = 0; this.stroll.heading = st.yaw;
    this.stroll.paused = !keepWalking;
    this.resume = null;
    this.ui.updateWalk?.();
  }
  /** The one button: start or pause walking along the chosen route (or get up and carry on). */
  toggleWalk() {
    if (this.photo.active) return;
    if (this.player.seat || this.resume) { this.resumeRoute(); return; }
    this.stroll.paused = !this.stroll.paused;
    this.walking = !this.stroll.paused;
    this.ui.toast(this.stroll.paused ? 'Paused — look around, or press Start to carry on' : `Walking: ${this.stroll.current.name}`);
    this.ui.updateWalk?.();
  }
  /** Sit at a stop beside the route: a bench, a stoop, the café window, the rooftop, the platform. */
  sitAtStop(stop) {
    const P = this.player;
    this.resume = { s: this.stroll.s, x: P.x, z: P.z, yaw: P.yaw, wasWalking: !this.stroll.paused };
    this.stroll.paused = true;
    const go = () => {
      const seat = stop.kind === 'seat' ? stop.seat : stop.place.target.seat;
      if (stop.kind === 'place' && stop.place.target.level) { P.teleport({ level: stop.place.target.level, x: seat.x, z: seat.z }); this.hookLevel(stop.place.target.level); }
      P.sit(seat, stop.kind === 'seat');
      this.ui.toast(stop.kind === 'seat' ? `${stop.label.replace('Sit on', 'Sitting on')} — press Start or tap “Get up” to carry on` : `${stop.label.replace(/^(Step into|Go up to|Go down to|Climb up to) the /, '').replace(/^Step into /, '')}`, 'info', 4000);
      this.ui.updateWalk?.();
    };
    if (stop.kind === 'place') this.ui.fade(go); else go();
  }
  resumeRoute() {
    const P = this.player, r = this.resume;
    const back = () => {
      if (P.seat) P.seat = null;
      if (r) { P.level = null; P.x = r.x; P.z = r.z; P.ground = P.groundHere(); this.stroll.s = r.s; }
      this.stroll.heading = P.yaw + P.lookYawOff; P.lookYawOff = 0;
      this.stroll.paused = false; this.walking = true;
      this.resume = null;
      this.ui.updateWalk?.();
    };
    if (P.level || this.interact.indoor) this.ui.fade(back); else { if (r) P.beginGlide(); back(); }
  }
  /** Wind-down: over N minutes the music fades, the city quietens and the picture dims. */
  startSleep(minutes = settings.get('sleepMinutes')) {
    this.sleep = { t: 0, dur: minutes * 60 };
    this.ui.toast(`Winding down over ${minutes} minutes — sleep well`, 'info', 4000);
    this.ui.updateSleep?.(this.sleep);
  }
  cancelSleep() {
    this.sleep = null; this.sleepMix = { music: 1, amb: 1 }; this.sleepDim = 0;
    this.applyVolumes(); this.ui.updateSleep?.(null); this.ui.showGoodnight?.(false);
  }
  updateSleep(dt) {
    const sl = this.sleep; if (!sl) return;
    sl.t += dt;
    const p = Math.min(1, sl.t / sl.dur);
    const sm = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    this.sleepMix = { music: 1 - sm(0.45, 1, p), amb: 1 - 0.6 * sm(0.3, 1, p) };
    this.sleepDim = 0.55 * sm(0.55, 1, p);
    this.sleepVolT = (this.sleepVolT || 0) - dt;
    if (this.sleepVolT <= 0) { this.sleepVolT = 2; this.applyVolumes(); this.ui.updateSleep?.(sl); }
    if (p >= 1 && !sl.done) {
      sl.done = true;
      if (this.music?.playing) this.music.pause();
      this.stroll.paused = true; this.ui.updateWalk?.();
      this.ui.showGoodnight?.(true);
    }
  }
  hookLevel(name) {
    const lv = this.cb.levels[name];
    if (lv && !lv.hooked) { lv.hooked = true; lv.onTrain = (ev) => { if (this.audioReady && this.player.level === lv.name) this.amb.trainPass(ev === 'arrive' ? 1.6 : 1.2); }; }
  }
  toggleMode() { this.toggleWalk(); }
  toggleUmbrella() { settings.set('umbrella', !settings.get('umbrella')); }
  returnToStart() {
    if (this.photo.active) this.togglePhoto();
    this.ui.fade(() => { this.placeOnRoute(this.stroll.current?.id, false); this.ui.toast('Back at the start of the route'); });
  }
  interactNow() {
    const p = this.interact.current;
    if (!p) return;
    if (p.type === 'stop') { this.sitAtStop(p.stop); return; }
    if (p.type === 'resume') { this.resumeRoute(); return; }
    if (p.type === 'seat') {
      if (this.stroll.active) settings.set('mode', 'walk');
      this.player.sit(p.seat); this.ui.toast(`Sitting on the ${p.seat.label}. Move to stand up.`);
    } else if (p.type === 'stand') this.player.stand();
    else if (p.type === 'portal') {
      const to = p.portal.to;
      if (this.stroll.active) settings.set('mode', 'walk');
      this.ui.fade(() => {
        this.player.teleport(to);
        const lv = to.level ? this.cb.levels[to.level] : null;
        if (lv && !lv.hooked) { lv.hooked = true; lv.onTrain = (ev) => { if (this.audioReady && this.player.level === lv.name) this.amb.trainPass(ev === 'arrive' ? 1.6 : 1.2); }; }
        this.ui.toast(lv ? lv.label : `Back on ${this.def.name === 'Kyoto' ? 'the lane' : 'the street'}`);
      });
    }
    else if (p.type === 'view') {
      const [lx, ly, lz] = p.view.look;
      this.lookTween = { yaw: Math.atan2(-(lx - this.player.x), -(lz - this.player.z)), pitch: Math.atan2(ly - 1.7, Math.hypot(lx - this.player.x, lz - this.player.z)) * 0.6, t: 0 };
    }
  }
  interact() { this.interactNow(); }
  togglePhoto() {
    if (this.photo.active) { this.photo.exit(this.player); this.ui.showPhotoBar(false); this.controls.photoActive = false; }
    else { this.photo.enter(this.player); this.ui.showPhotoBar(true); this.controls.photoActive = true; }
  }
  async capturePhoto() {
    if (!this.photo.active) return;
    try {
      const name = await this.photo.capture(() => this.renderFrame(0), this.def.id);
      this.ui.flash();
      this.ui.toast('Saved ' + name);
    } catch (e) { this.ui.toast('Could not save the photo: ' + e.message, 'error'); }
  }
  async toggleFullscreen() {
    const d = document, elx = d.documentElement;
    const fsEl = d.fullscreenElement || d.webkitFullscreenElement;
    if (fsEl) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
    if (this.expanded) { this.setExpanded(false); return; }
    const req = elx.requestFullscreen || elx.webkitRequestFullscreen;
    if (req) {
      try { await req.call(elx, { navigationUI: 'hide' }); return; } catch { /* fall through to expanded view */ }
    }
    this.setExpanded(true);
  }
  setExpanded(on) {
    this.expanded = on;
    document.documentElement.classList.toggle('expanded', on);
    window.scrollTo(0, 1);
    if (on) {
      this.ui.toast('Full screen is not available in this browser — using an expanded view. Browser bars may remain visible.', 'info', 5000);
      this.exitExpandedBtn = document.createElement('button');
      this.exitExpandedBtn.className = 'btn expanded-exit glass';
      this.exitExpandedBtn.textContent = 'Exit expanded view';
      this.exitExpandedBtn.onclick = () => this.setExpanded(false);
      document.getElementById('ui').appendChild(this.exitExpandedBtn);
    } else this.exitExpandedBtn?.remove();
    this.engine.resize();
    this.ui.updateFullscreenIcon();
  }
  onEscape() {
    if (this.photo.active) { this.togglePhoto(); return; }
    if (this.ui.panelOpen) { this.ui.closePanel(); return; }
    if (this.ui.hidden) { this.ui.setHidden(false); return; }
    if (this.expanded) this.setExpanded(false);
  }
  handleActions(actions) {
    if (!this.started) return;
    for (const k of actions) {
      switch (k) {
        case 'm': this.ui.togglePanel(); break;
        case 'h': this.ui.setHidden(!this.ui.hidden); break;
        case 'f': this.toggleFullscreen(); break;
        case 't': case ' ': if (!this.photo.active) this.toggleWalk(); break;
        case 'u': this.toggleUmbrella(); break;
        case 'p': this.togglePhoto(); break;
        case 'e': if (!this.photo.active) this.interactNow(); break;
        case 'r': if (!this.photo.active) this.returnToStart(); break;
        case 'k': this.toggleMusic(); break;
        case 'n': this.music?.next(); break;
        case 'Enter': if (this.photo.active) this.capturePhoto(); break;
        default: break;
      }
    }
  }

  // ------------------------------------------------------------------ frame
  frame(now) {
    this.frameCount = (this.frameCount || 0) + 1;
    if (this.maxFrames && this.frameCount > this.maxFrames) { window.__done = true; return; }
    requestAnimationFrame((t) => this.frame(t));
    const cap = settings.get('fpsCap');
    const minDt = cap === '30' ? 1 / 31 : cap === '60' ? 1 / 61 : 0;
    const raw = (now - this.last) / 1000;
    if (raw < minDt) return;
    this.last = now;
    const dt = Math.min(0.05, raw);
    this.trackPerformance(raw);
    try { this.update(dt); this.renderFrame(dt); } catch (e) {
      if (!this.reported) { this.reported = true; console.error(e); this.ui.toast('A rendering problem occurred: ' + e.message, 'error', 8000); }
    }
  }
  trackPerformance(raw) {
    const eng = this.engine;
    this.frameTimes.push(raw);
    if (this.frameTimes.length >= 90) {
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.frameTimes.length = 0;
      if (settings.get('showFps')) this.ui.fps.textContent = `${Math.round(1 / avg)} fps · ${eng.renderer.getPixelRatio().toFixed(2)}× · ${eng.renderer.info.render.calls} draws`;
      if (this.quality.auto && settings.get('fpsCap') !== '30' && this.started) {
        if (avg > 1 / 42 && eng.renderScale > 0.6) { eng.renderScale = Math.max(0.6, eng.renderScale - 0.1); eng.resize(); }
        else if (avg < 1 / 57 && eng.renderScale < 1) { eng.renderScale = Math.min(1, eng.renderScale + 0.05); eng.resize(); }
      }
    }
  }
  update(dt) {
    const s = settings.values, eng = this.engine, cb = this.cb;
    if (!cb) return;
    const P = settings.photo;
    const photo = this.photo.active;
    const frozen = photo && P.freeze;
    if (!frozen) this.time += dt;
    const t = this.time;
    U.uTime.value = t;
    this.controls.pollGamepad(dt);
    this.handleActions(this.controls.consumeActions());
    // time of day progression
    if (s.timeFlow !== 'still' && !frozen && !(s.timeFlow === 'dusk' && s.timeOfDay >= 22 && s.timeOfDay < 23)) {
      // 'dusk': one hour every six minutes from early evening, settling at 10 PM
      const rate = s.timeFlow === 'slow' ? 1 / 600 : s.timeFlow === 'dusk' ? 1 / 360 : 1 / 120;
      settings.set('timeOfDay', (s.timeOfDay + dt * rate) % 24, true);
      this.placeTimer = (this.placeTimer || 0) - dt;
      if (this.placeTimer <= 0) { this.placeTimer = 5; this.ui.updatePlace(this.def); this.ui.refreshBindings(); }
    }
    // ---- movement
    if (photo) this.photo.update(dt);
    else if (!this.started) { this.player.applyCamera(dt, s, 0); this.controls.consumeLook(); }
    else if (this.stroll.active && !this.player.seat && !this.player.level) {
      this.stroll.update(dt, s, {});
    } else {
      this.player.update(dt, s);
      if (this.lookTween) {
        const lt = this.lookTween; lt.t += dt;
        const k = Math.min(1, dt * 2);
        let d = lt.yaw - this.player.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        this.player.yaw += d * k; this.player.pitch += (lt.pitch - this.player.pitch) * k;
        if (lt.t > 2.5 || this.controls.lastLook > performance.now() - 50) this.lookTween = null;
      }
    }
    // ---- world simulation
    if (!frozen) cb.signals.update(dt);
    const camPos = eng.camera.position;
    const atm = eng.atmo.update(frozen ? 0 : dt, s, { glow: this.def.glow, snowCover: this.snowCover });
    const playerPos = this.player.level ? { x: 1e6, z: 1e6 } : { x: this.player.x, z: this.player.z };
    const onRoad = !this.player.level && cb.groundAt && cb.groundAt(this.player.x, this.player.z) < 0.05;
    const crowd = eng.crowd, traffic = eng.traffic;
    const beat = this.music?.playing ? (performance.now() / 1000) * ((this.music.source === 'builtin' ? this.music.current().bpm : 90) || 80) / 60 % 1 : undefined;
    if (crowd) crowd.update(frozen ? 0 : dt, t, { beat, cam: camPos, player: playerPos, rain: s.rainIntensity, frozen, hidePeople: photo && P.hidePeople, viewDist: eng.quality.viewDist });
    if (traffic) traffic.update(frozen ? 0 : dt, t, { settings: s, cam: camPos, obstacles: onRoad && !photo ? [playerPos] : [], peds: crowd ? crowd.crossing() : [], trafficMul: this.rhythm('traffic'), hour: s.timeOfDay, rhythmOn: s.cityRhythm, night: atm.night, haze: Math.min(1, s.fog * 0.6 + s.rainIntensity * 0.6), frozen, hideCars: photo && P.hideCars });
    for (const a of cb.animated) a.update(dt, t);
    for (const lv of Object.values(cb.levels || {})) if (lv.trainMesh) lv.trainMesh.visible = this.player.level === lv.name;
    // ---- daily rhythm: open hours, bedtime windows and how busy the streets are
    U.uHour.value = ((s.timeOfDay % 24) + 24) % 24;
    U.uWinFrac.value = s.cityRhythm ? windowRhythm(s.timeOfDay) : 1;
    this.rhythmTimer = (this.rhythmTimer || 0) - dt;
    if (this.rhythmTimer <= 0 && crowd) { this.rhythmTimer = 4; crowd.setPopulation(this.popTarget(), s); }
    // ---- lighting & atmosphere
    const rig = eng.rig;
    rig.hour = s.cityRhythm ? U.uHour.value : 20;
    rig.scales.street = s.streetlights; rig.scales.shop = s.storefronts; rig.scales.neon = s.neon * (0.5 + 0.5 * s.reflNeon); rig.scales.headlight = s.headlights * (s.headlightsOn ? 1 : 0.1);
    rig.update(dt, camPos, traffic ? traffic.dynPools : []);
    // ---- season: blend leaf colours, choose rain/sleet/snow, let snow settle or melt
    const sIdx = { spring: 0, summer: 1, autumn: 2, winter: 3 }[s.season] ?? 2;
    const tgt = [0, 0, 0, 0]; tgt[sIdx] = 1;
    const kS = this.seasonInit ? Math.min(1, dt * 1.5) : 1; this.seasonInit = true;
    this.seasonW.set(this.seasonW.x + (tgt[0] - this.seasonW.x) * kS, this.seasonW.y + (tgt[1] - this.seasonW.y) * kS, this.seasonW.z + (tgt[2] - this.seasonW.z) * kS, this.seasonW.w + (tgt[3] - this.seasonW.w) * kS);
    U.uSeason.value.copy(this.seasonW);
    U.uSeasonLeaf.value = this.def.seasonal === false ? 0 : 1;
    const snowP = s.precip === 'snow' ? 1 : s.precip === 'sleet' ? 0.5 : s.precip === 'auto' && s.season === 'winter' ? 1 : 0;
    this.snowP = snowP;
    const coverTarget = snowP > 0 ? Math.min(1, s.rainIntensity * 1.6) * snowP : 0;
    if (this.lastSeason !== s.season + s.precip) { this.lastSeason = s.season + s.precip; if (snowP > 0 && this.snowCover < coverTarget * 0.5) this.snowCover = coverTarget * 0.5; }
    if (!frozen) this.snowCover += (coverTarget - this.snowCover) * Math.min(1, dt * (coverTarget > this.snowCover ? 0.02 : 0.05));
    U.uSnowCover.value = this.snowCover;
    U.uSnow.value = snowP;
    U.uRainAmt.value = s.rainIntensity * (1 - snowP);
    const ind = this.interact.indoor;
    const indoorMode = ind ? (ind.kind === 'subway' ? 'full' : ind.open ? null : 'partial') : null;
    if ((ind?.name || null) !== (this.lastIndoor || null)) {
      this.lastIndoor = ind?.name || null;
      if (ind && ind.kind !== 'subway' && this.started) this.ui.toast(ind.kind === 'arcade' ? `Under the roof of the ${ind.name}` : `Inside ${ind.name}`, 'info', 2200);
      this.ui.updatePlace(this.def, ind?.name);
    }
    eng.rain.update(frozen ? 0 : dt, t, s, eng.camera, atm, { hidden: photo && P.hideRain, frozen, snow: snowP, indoor: indoorMode });
    this.seasonFx.update(eng.camera, s.season, this.def.seasonal !== false, s, atm, photo && P.hideRain);
    eng.sky.update(eng.camera);
    this.applyLook(s, atm, dt, photo);
    // ---- umbrella & interactions
    this.umbrella.setOpen(s.umbrella && !(this.interact.indoor && !this.interact.indoor.open));
    this.umbrella.update(dt, t, { hidden: photo || !this.started, speed: this.player.speed, bob: this.player.bob, rain: s.rainIntensity, wind: s.wind, reducedMotion: s.reducedMotion });
    let prompt = this.started && !photo ? this.interact.update(this.player) : null;
    if (this.started && !photo) {
      if (this.player.seat || this.resume) prompt = { type: 'resume', label: 'Get up and keep walking', alt: s.sleepOnSit && !this.sleep ? { label: '🌙 Wind down here', action: () => this.startSleep() } : null };
      else { const st = this.stroll.stopHere(); prompt = st ? { type: 'stop', stop: st, label: st.label } : null; }
    }
    this.ui.setPrompt(prompt);
    // ---- sleep timer: music fades, city quietens, the picture dims, then everything rests
    this.updateSleep(dt);
    // ---- sound that follows you: chatter from open cafés and bars you pass
    this.chatTimer = (this.chatTimer || 0) - dt;
    if (this.chatTimer <= 0) {
      this.chatTimer = 0.4;
      let near = 99;
      if (!this.player.level) for (const L of cb.lights) {
        if (L.kind !== 'shop' || !/cafe|bar|restaurant|tea/.test(L.shopType || '')) continue;
        if (s.cityRhythm && L.hours && !isOpen(L.hours, s.timeOfDay)) continue;
        const d = Math.hypot(L.x - this.player.x, L.z - this.player.z); if (d < near) near = d;
      }
      this.chatter = Math.max(0, 1 - near / 10);
    }
    // ---- audio
    if (this.audioReady && this.amb) {
      this.amb.update(dt, s, {
        snow: this.snowP || 0, chatter: this.chatter || 0, indoor: this.interact.indoor, umbrellaOpen: s.umbrella && !this.interact.indoor, sheltered: this.interact.sheltered, hideRain: photo && P.hideRain,
        cars: traffic ? traffic.nearest(camPos, 3) : [], cam: camPos, yawWorld: Math.atan2(-Math.sin(eng.camera.rotation.y), -Math.cos(eng.camera.rotation.y)),
        people: crowd ? crowd.countNear(camPos.x, camPos.z, 12) : 0,
      });
    }
    // ---- HUD
    this.uiTimer = (this.uiTimer || 0) - dt;
    if (this.uiTimer <= 0 && this.started && !this.ui.hidden && settings.get('showMinimap')) {
      this.uiTimer = 0.12;
      const yaw = eng.camera.rotation.y;
      this.ui.minimap.draw(cb, this.player, yaw, this.stroll);
      const status = this.player.seat ? 'Sitting' : this.player.level ? '' : this.stroll.status;
      if (status !== this.lastStatus) { this.lastStatus = status; this.ui.updatePlace(this.def, status); }
    }
    // fade the HUD while the stroll plays like a screensaver
    const idle = performance.now() - this.controls.lastInput;
    this.ui.hud.classList.toggle('fade', !this.stroll.paused && idle > 12000 && !this.ui.panelOpen);
  }
  applyLook(s, atm, dt, photo) {
    const eng = this.engine, cb = this.cb;
    const st = STYLES[s.style] || STYLES.cozy;
    // rainbow & palette
    U.uRainbow.value = s.rainbow;
    if (s.rainbowMove) U.uRbPhase.value += dt * (0.05 + s.rainbowSpeed * 0.6);
    U.uRbSpread.value = s.rainbowSpread;
    U.uRbSat.value = s.rainbowSat;
    const a = s.rainbowDir * Math.PI / 180; U.uRbDir.value.set(Math.cos(a), Math.sin(a));
    const pal = PALETTES[s.palette] || PALETTES.rainbow;
    U.uPalMode.value = pal.mode;
    const cols = pal.colors || [s.custom1, s.custom2, s.custom3, s.custom1];
    U.uPal0.value.set(cols[0]); U.uPal1.value.set(cols[1]); U.uPal2.value.set(cols[2]); U.uPal3.value.set(cols[3]);
    // reflections & wetness
    const R = s.reflections;
    U.uReflStreet.value = s.reflStreet * R * 1.2; U.uReflPuddle.value = s.reflPuddle * R * 1.1;
    U.uReflWindow.value = s.reflWindow * R; U.uReflCar.value = s.reflCar * R;
    U.uReflBlur.value = s.reflBlur; U.uReflLen.value = s.reflLength; U.uReflColor.value = s.reflColor; U.uReflMotion.value = s.reflMotion;
    U.uWetness.value = s.wetness * Math.min(1, 0.55 + s.rainIntensity);
    U.uWindAmt.value = s.wind + s.storm * 0.5;
    U.uPuddles.value = s.puddles; U.uRainAmt.value = s.rainIntensity * (1 - (this.snowP || 0));
    // emissive levels
    const night = atm.night;
    if (cb.mats.bulb) cb.mats.bulb.color.setScalar(6 * (0.25 + 0.75 * eng.rig.streetOn));
    for (const m of cb.windowMats) m.emissiveIntensity = s.windowGlow * (0.12 + 0.95 * night) * 1.25;
    for (const m of cb.shopMats) m.emissiveIntensity = s.storefronts * (0.45 + 0.8 * night) * 1.25;
    for (const m of cb.neonMats) m.color.setScalar(m.userData.base * s.neon * (0.35 + 0.65 * night) * (0.6 + 0.4 * s.reflNeon));
    // traffic signals
    const sigIdx = (axis) => ({ red: 0, yellow: 1, green: 2 })[cb.signals.state(axis)];
    if (cb.mats.sigLamp) { const u = cb.mats.sigLamp.userData.sig; u.uSigX.value = sigIdx('x'); u.uSigZ.value = sigIdx('z'); }
    // post
    const P = settings.photo;
    eng.bloom.strength = st.bloom * s.bloom * 0.55;
    eng.bloom.threshold = 0.85;
    eng.bloom.radius = 0.5 + st.soft * 0.4;
    eng.renderer.toneMappingExposure = s.exposure * (photo ? P.exposure : 1) * (1 + U.uFlash.value * 0.25) * (1 - (this.sleepDim || 0));
    const g = eng.grade.uniforms;
    g.uTime.value = this.time;
    g.uSat.value = st.sat; g.uContrast.value = st.contrast;
    g.uTint.value.set(...st.tint); g.uLift.value.set(...st.lift);
    g.uGrain.value = photo ? P.grain : st.grain; g.uVignette.value = st.vignette;
    g.uPosterize.value = st.posterize; g.uMono.value = st.mono; g.uWarm.value = st.warm; g.uChroma.value = st.chroma; g.uSoft.value = st.soft;
  }
  renderFrame() { this.engine.render(); }
}

// Exposed for debugging and automated checks.
export { THREE };
