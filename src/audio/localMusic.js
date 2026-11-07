// "My music": play the listener's own audio files alongside the built-in lo-fi. Files stay on this
// device (kept in the browser's IndexedDB so they're still there next visit) and are never uploaded.
const DB = 'rainfall-avenue-music', STORE = 'tracks';

function openDB() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) { rej(new Error('no IndexedDB')); return; }
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
function tx(db, mode, fn) {
  return new Promise((res, rej) => { const t = db.transaction(STORE, mode); const out = fn(t.objectStore(STORE)); t.oncomplete = () => res(out?.result ?? out); t.onerror = () => rej(t.error); });
}

export class LocalMusic {
  constructor(audio) {
    this.a = audio;
    this.el = new Audio();
    this.el.preload = 'auto';
    this.el.crossOrigin = 'anonymous';
    this.src = audio.ctx.createMediaElementSource(this.el);
    this.gain = audio.ctx.createGain();
    this.src.connect(this.gain).connect(audio.buses.music);
    this.tracks = []; // { id, title, blob, url }
    this.index = 0; this.playing = false; this.shuffle = false; this.history = [];
    this.onChange = null;
    this.el.addEventListener('ended', () => this.next());
    this.el.addEventListener('error', () => { this.onError?.(`Couldn't play “${this.current()?.title}”. The format may not be supported by this browser.`); this.next(); });
  }
  async restore() {
    try {
      const db = await openDB();
      const rows = await tx(db, 'readonly', (s) => s.getAll());
      this.tracks = (rows || []).map((r) => ({ id: r.id, title: r.title, blob: r.blob }));
      this.db = db;
    } catch { this.tracks = []; }
    return this.tracks.length;
  }
  async add(files) {
    let added = 0, skipped = 0;
    for (const f of files) {
      if (!f.type.startsWith('audio/') && !/\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i.test(f.name)) { skipped++; continue; }
      const title = f.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
      const t = { title, blob: f };
      try { if (!this.db) this.db = await openDB(); t.id = await tx(this.db, 'readwrite', (s) => s.add({ title, blob: f })); } catch { t.id = 'mem-' + Math.random(); }
      this.tracks.push(t); added++;
    }
    this.onChange?.(this.current());
    return { added, skipped };
  }
  async remove(id) {
    const i = this.tracks.findIndex((t) => t.id === id);
    if (i < 0) return;
    const [t] = this.tracks.splice(i, 1);
    if (t.url) URL.revokeObjectURL(t.url);
    try { if (this.db && typeof id === 'number') await tx(this.db, 'readwrite', (s) => s.delete(id)); } catch { /* ignore */ }
    if (this.index >= this.tracks.length) this.index = 0;
    if (this.playing) { if (this.tracks.length) this.start(); else this.pause(); }
    this.onChange?.(this.current());
  }
  async clear() { for (const t of [...this.tracks]) await this.remove(t.id); }
  current() { const t = this.tracks[this.index]; return t ? { title: t.title, style: 'mine' } : { title: 'No files added yet', style: 'mine' }; }
  start() {
    const t = this.tracks[this.index]; if (!t) { this.playing = false; this.onChange?.(this.current()); return; }
    if (!t.url) t.url = URL.createObjectURL(t.blob);
    this.el.src = t.url;
    this.el.play().catch(() => {});
    this.onChange?.(this.current());
  }
  play() { if (!this.tracks.length) { this.onChange?.(this.current()); return; } this.playing = true; this.gain.gain.setTargetAtTime(1, this.a.ctx.currentTime, 0.1); if (this.el.src && this.el.paused && this.el.currentTime > 0) { this.el.play().catch(() => {}); this.onChange?.(this.current()); } else this.start(); }
  pause() { this.playing = false; this.el.pause(); this.onChange?.(this.current()); }
  toggle() { if (this.playing) this.pause(); else this.play(); }
  next() {
    if (!this.tracks.length) return;
    this.history.push(this.index);
    this.index = this.shuffle && this.tracks.length > 1 ? (this.index + 1 + Math.floor(Math.random() * (this.tracks.length - 1))) % this.tracks.length : (this.index + 1) % this.tracks.length;
    if (this.playing) this.start(); else this.onChange?.(this.current());
  }
  prev() {
    if (!this.tracks.length) return;
    if (this.el.currentTime > 4) { this.el.currentTime = 0; return; }
    this.index = this.history.length ? this.history.pop() : (this.index - 1 + this.tracks.length) % this.tracks.length;
    if (this.playing) this.start(); else this.onChange?.(this.current());
  }
}

/** Presents whichever source is active (built-in lo-fi or the listener's files) with one API. */
export class MusicRouter {
  constructor(builtin, local) { this.builtin = builtin; this.local = local; this.source = 'builtin'; }
  get active() { return this.source === 'mine' ? this.local : this.builtin; }
  get playing() { return this.active.playing; }
  setSource(src) {
    if (src === this.source) return;
    const was = this.playing;
    this.active.pause();
    this.source = src;
    if (was) this.active.play();
    this.onChange?.(this.current());
  }
  set onChange(fn) { this._on = fn; this.builtin.onChange = (t) => { if (this.source === 'builtin') fn(t); }; this.local.onChange = (t) => { if (this.source === 'mine') fn(t); }; }
  get onChange() { return this._on; }
  set shuffle(v) { this.builtin.shuffle = v; this.local.shuffle = v; }
  current() { return this.active.current(); }
  play() { this.active.play(); }
  pause() { this.active.pause(); }
  toggle() { this.active.toggle(); }
  next() { this.active.next(); }
  prev() { this.active.prev(); }
  setStyle(s) { this.builtin.setStyle(s); }
  set styleFilter(v) { this.builtin.styleFilter = v; }
}
