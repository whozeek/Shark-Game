// The interface: start screen, compact HUD, settings drawer (schema-driven), toasts, prompts,
// photo bar, touch stick and the minimap. The city stays the focus; everything can be hidden.
import { settings, PRESETS, STYLES, PALETTES, TIME_PRESETS, DEFAULTS } from '../core/settings.js';
import { STYLES as MUSIC_STYLES, TRACKS } from '../audio/music.js';
import { Minimap } from './minimap.js';
import { listMoods, saveMood, deleteMood, shareLink, copyText } from '../core/moods.js';

const I = {
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  unfull: '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1.1"/></svg>',
  umb: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/><path d="M12 3v0"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M6 6v12l8.5-6zM16 6h2v12h-2z"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M18 6v12L9.5 12zM6 6h2v12H6z"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
};

const fmtPct = (v) => Math.round(v * 100) + '%';
const fmtX = (v) => v.toFixed(2) + '×';
const fmtTime = (h) => { h = ((h % 24) + 24) % 24; const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); const ap = hh >= 12 ? 'PM' : 'AM'; const h12 = hh % 12 === 0 ? 12 : hh % 12; return `${h12}:${String(mm).padStart(2, '0')} ${ap}`; };
const fmtDeg = (v) => Math.round(v) + '°';

export function rainLabel(s) {
  const r = s.rainIntensity;
  if (s.storm > 0.6 && r > 0.5) return 'Thunderstorm';
  if (r < 0.03) return 'Overcast, no rain';
  if (r < 0.25) return 'Drizzle';
  if (r < 0.5) return 'Light rain';
  if (r < 0.8) return 'Steady rain';
  return 'Heavy rain';
}

function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v !== null && v !== undefined) e.setAttribute(k, v === true ? '' : v);
  }
  if (html) e.innerHTML = html;
  return e;
}

export class UI {
  constructor(root, app) {
    this.root = root; this.app = app;
    this.hidden = false;
    this.panelOpen = false;
    this.tab = 'moods';
    this.bindings = [];
    this.touch = app.isTouch;
    if (this.touch) document.documentElement.classList.add('is-touch');
    this.buildStart();
    this.buildHUD();
    settings.on('change', (k) => this.onSetting(k));
    settings.on('photo', () => this.refreshBindings());
    document.addEventListener('fullscreenchange', () => this.updateFullscreenIcon());
    document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenIcon());
  }

  // ------------------------------------------------------------------ start screen
  buildStart() {
    const s = el('div', { class: 'start loading', role: 'dialog', 'aria-label': 'Welcome' });
    s.innerHTML = `
      <div class="start-card glass">
        <h1 class="brand">Rainfall <em>Avenue</em></h1>
        <p class="tagline">Wander rainy city streets at your own pace, or sit back while a scenic stroll walks for you — with original lo-fi music and the sound of rain.</p>
        <div class="progress" aria-hidden="true"><i></i></div>
        <div class="load-label" role="status" aria-live="polite">Preparing the city…</div>
        <div class="row-btns" hidden>
          <button class="btn primary" data-go="sound">Step outside ♪</button>
          <button class="btn" data-go="stroll">Start scenic stroll</button>
          <button class="linkish" data-go="quiet">Enter without sound</button>
        </div>
        <div class="err" hidden></div>
        <p class="note" style="margin-top:14px">Simulated weather. City layouts, façades and skylines are artistic interpretations — not exact maps.</p>
      </div>`;
    this.root.appendChild(s);
    this.start = s;
    s.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => this.app.begin(b.dataset.go)));
  }
  setProgress(p, label) {
    const bar = this.start.querySelector('.progress i');
    bar.style.width = Math.round(p * 100) + '%';
    if (label) this.start.querySelector('.load-label').textContent = label + '…';
  }
  ready() {
    this.start.classList.remove('loading');
    this.start.querySelector('.row-btns').hidden = false;
    this.start.querySelector('.load-label').textContent = 'Ready when you are.';
    this.start.querySelector('.progress').style.visibility = 'hidden';
    this.start.querySelector('[data-go="sound"]').focus();
  }
  hideStart() { this.start.classList.add('gone'); setTimeout(() => this.start.remove(), 900); this.started = true; }
  showError(msg) {
    const e = this.start?.querySelector('.err');
    if (e && !this.started) { e.hidden = false; e.className = 'err error-box'; e.textContent = msg; this.start.querySelector('.load-label').textContent = 'Something went wrong.'; }
    else this.toast(msg, 'error', 7000);
  }
  // loading overlay when switching city
  showLoading(label) {
    if (!this.loader) {
      this.loader = el('div', { class: 'start loading', role: 'status', 'aria-live': 'polite' });
      this.loader.innerHTML = '<div class="start-card glass"><h2 class="brand" style="font-size:1.8em"></h2><div class="progress"><i></i></div><div class="load-label"></div></div>';
      this.root.appendChild(this.loader);
    }
    this.loader.classList.remove('gone');
    this.loader.querySelector('h2').textContent = label;
  }
  loadingProgress(p, label) { if (!this.loader) return; this.loader.querySelector('.progress i').style.width = Math.round(p * 100) + '%'; this.loader.querySelector('.load-label').textContent = label + '…'; }
  hideLoading() { if (this.loader) { this.loader.classList.add('gone'); } }

  // ------------------------------------------------------------------ HUD
  buildHUD() {
    const hud = el('div', { class: 'hud' });
    this.hud = hud;
    this.place = el('div', { class: 'hud-top-left glass', 'aria-live': 'polite' });
    hud.appendChild(this.place);
    const tr = el('div', { class: 'hud-top-right', role: 'toolbar', 'aria-label': 'Quick controls' });
    this.modeBtn = el('button', { class: 'mode-pill', 'aria-label': 'Switch between free walk and scenic stroll (T)', onclick: () => this.app.toggleMode() });
    this.umbBtn = this.iconBtn(I.umb, 'Umbrella (U)', () => this.app.toggleUmbrella());
    this.photoBtn = this.iconBtn(I.cam, 'Photo mode (P)', () => this.app.togglePhoto());
    this.hideBtn = this.iconBtn(I.eyeOff, 'Hide interface (H)', () => this.setHidden(true));
    this.fsBtn = this.iconBtn(I.full, 'Full screen (F)', () => this.app.toggleFullscreen());
    this.menuBtn = this.iconBtn(I.menu, 'Settings (M)', () => this.togglePanel());
    this.menuBtn.setAttribute('aria-haspopup', 'dialog');
    tr.append(this.modeBtn, this.umbBtn, this.photoBtn, this.hideBtn, this.fsBtn, this.menuBtn);
    hud.appendChild(tr);
    // now playing
    const np = el('div', { class: 'now-playing glass', role: 'group', 'aria-label': 'Music player' });
    np.innerHTML = `<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><div class="title"><b>Lo-fi radio</b><span>Paused</span></div>`;
    this.npPrev = el('button', { class: 'np-btn', 'aria-label': 'Previous track', onclick: () => this.app.music?.prev() }, I.prev);
    this.npPlay = el('button', { class: 'np-btn', 'aria-label': 'Play music', onclick: () => this.app.toggleMusic() }, I.play);
    this.npNext = el('button', { class: 'np-btn', 'aria-label': 'Next track', onclick: () => this.app.music?.next() }, I.next);
    np.append(this.npPrev, this.npPlay, this.npNext);
    this.np = np;
    hud.appendChild(np);
    // minimap
    const mm = el('div', { class: 'minimap-wrap glass', role: 'img', 'aria-label': 'Neighbourhood map showing your position' });
    const cv = el('canvas');
    mm.appendChild(cv);
    this.mmWrap = mm;
    this.minimap = new Minimap(cv);
    hud.appendChild(mm);
    // prompt
    this.prompt = el('button', { class: 'prompt glass', hidden: true, onclick: () => this.app.interact() });
    hud.appendChild(this.prompt);
    // touch stick hint + vertical move buttons for photo mode
    const touch = el('div', { class: 'touch-ui' });
    this.stickHint = el('div', { class: 'stick-hint', 'aria-hidden': 'true' }, 'Drag here<br>to walk');
    this.stickEl = el('div', { class: 'stick', hidden: true }, '<i></i>');
    touch.append(this.stickHint, this.stickEl);
    this.touchUI = touch;
    this.root.appendChild(hud);
    this.root.appendChild(touch);
    this.toasts = el('div', { class: 'toast-wrap', 'aria-live': 'polite' });
    this.root.appendChild(this.toasts);
    this.showUiBtn = this.iconBtn(I.eye, 'Show interface (H)', () => this.setHidden(false));
    this.showUiBtn.classList.add('show-ui');
    this.showUiBtn.hidden = true;
    this.root.appendChild(this.showUiBtn);
    this.fps = el('div', { class: 'fps glass', hidden: true });
    this.root.appendChild(this.fps);
    this.hud.style.visibility = 'hidden';
    this.updateMode(); this.updateUmbrella();
  }
  iconBtn(svg, label, fn) {
    const b = el('button', { class: 'icon-btn', 'aria-label': label, onclick: fn }, svg + `<span class="tip" aria-hidden="true">${label}</span>`);
    return b;
  }
  showHUD() { this.hud.style.visibility = 'visible'; if (this.touch) setTimeout(() => this.stickHint.remove(), 9000); }
  showStick(st) {
    if (!st) { this.stickEl.hidden = true; return; }
    this.stickEl.hidden = false;
    this.stickEl.style.left = st.x0 + 'px'; this.stickEl.style.top = st.y0 + 'px';
    const dx = Math.max(-40, Math.min(40, st.x - st.x0)), dy = Math.max(-40, Math.min(40, st.y - st.y0));
    this.stickEl.firstChild.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  updatePlace(def, extra) {
    const s = settings.values;
    this.place.innerHTML = `<div class="place">${def.name}<small>${def.neighborhood}</small></div><div class="status-line">${fmtTime(s.timeOfDay)} · ${rainLabel(s)}${extra ? ' · ' + extra : ''}</div>`;
  }
  updateMode() {
    const stroll = settings.get('mode') === 'stroll';
    this.modeBtn.className = 'mode-pill' + (stroll ? ' stroll' : '');
    this.modeBtn.innerHTML = `<span class="dot" aria-hidden="true"></span>${stroll ? 'Scenic stroll' : 'Free walk'}<span class="lbl-long" style="color:var(--muted);font-weight:400"> · T</span>`;
    this.modeBtn.setAttribute('aria-pressed', stroll ? 'true' : 'false');
  }
  updateUmbrella() {
    const on = settings.get('umbrella');
    this.umbBtn.classList.toggle('on', on);
    this.umbBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  updateMusic(track, playing) {
    if (!track) return;
    this.np.querySelector('.title b').textContent = track.title;
    this.np.querySelector('.title span').textContent = (track.style === 'mine' ? 'Your music' : MUSIC_STYLES[track.style]?.label || '') + (playing ? '' : ' · paused');
    this.np.classList.toggle('paused', !playing);
    this.npPlay.innerHTML = playing ? I.pause : I.play;
    this.npPlay.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    if (this.panelOpen && this.tab === 'audio') { const t = this.panelBody.querySelector('[data-now]'); if (t) t.textContent = `${track.title} — ${MUSIC_STYLES[track.style]?.label}${playing ? '' : ' (paused)'}`; }
  }
  updateFullscreenIcon() {
    const fs = !!(document.fullscreenElement || document.webkitFullscreenElement) || this.app.expanded;
    this.fsBtn.innerHTML = (fs ? I.unfull : I.full) + `<span class="tip" aria-hidden="true">${fs ? 'Exit full screen (F)' : 'Full screen (F)'}</span>`;
    this.fsBtn.setAttribute('aria-label', fs ? 'Exit full screen (F)' : 'Full screen (F)');
  }
  setPrompt(p) {
    if (!p || this.app.photo.active) { this.prompt.hidden = true; this.promptKey = null; return; }
    const key = p.label;
    if (this.promptKey === key) return;
    this.promptKey = key;
    this.prompt.hidden = false;
    this.prompt.innerHTML = `<kbd>${this.touch ? 'Tap' : 'E'}</kbd> ${p.label}`;
  }
  setHidden(h) {
    this.hidden = h;
    document.getElementById('app').classList.toggle('hidden-ui', h);
    this.showUiBtn.hidden = !h;
    if (h) { this.closePanel(); this.toast(this.touch ? 'Interface hidden — tap the eye icon in the corner to bring it back' : 'Interface hidden — press H or click the eye icon to bring it back', 'info', 4000); this.showUiBtn.focus(); }
    else this.menuBtn.focus();
  }
  toast(msg, kind = 'info', ms = 2600) {
    const t = el('div', { class: 'toast glass' + (kind === 'error' ? ' error' : ''), role: kind === 'error' ? 'alert' : 'status' });
    t.textContent = msg;
    // In hidden-UI mode only show the "how to return" message
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 3) this.toasts.firstChild.remove();
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .5s'; setTimeout(() => t.remove(), 600); }, ms);
  }
  /** Brief fade to black around a change of place (stairs, doors). */
  fade(mid) {
    const f = el('div', { class: 'flash', style: 'background:#000' }); this.root.appendChild(f);
    requestAnimationFrame(() => { f.style.opacity = '1'; setTimeout(() => { mid(); f.style.opacity = '0'; setTimeout(() => f.remove(), 600); }, 450); });
  }
  flash() { const f = el('div', { class: 'flash' }); this.root.appendChild(f); requestAnimationFrame(() => { f.style.opacity = '0.7'; setTimeout(() => { f.style.opacity = '0'; setTimeout(() => f.remove(), 600); }, 80); }); }

  // ------------------------------------------------------------------ photo mode bar
  showPhotoBar(on) {
    if (on) {
      this.closePanel();
      this.photoBar = el('div', { class: 'photo-bar glass', role: 'toolbar', 'aria-label': 'Photo mode' });
      const cap = el('button', { class: 'btn primary', onclick: () => this.app.capturePhoto() }, 'Capture');
      const set = el('button', { class: 'btn', onclick: () => { this.openPanel('photo'); } }, 'Lens & look');
      const ex = el('button', { class: 'btn', onclick: () => this.app.togglePhoto() }, 'Exit photo mode');
      this.photoBar.append(cap, set, ex);
      if (this.touch) {
        const up = el('button', { class: 'btn', 'aria-label': 'Raise camera', onpointerdown: () => (this.app.controls.uiUp = 1), onpointerup: () => (this.app.controls.uiUp = 0), onpointerleave: () => (this.app.controls.uiUp = 0) }, '▲');
        const dn = el('button', { class: 'btn', 'aria-label': 'Lower camera', onpointerdown: () => (this.app.controls.uiUp = -1), onpointerup: () => (this.app.controls.uiUp = 0), onpointerleave: () => (this.app.controls.uiUp = 0) }, '▼');
        this.photoBar.append(up, dn);
      }
      this.root.appendChild(this.photoBar);
      this.photoFrame = el('div', { class: 'photo-frame' });
      this.root.appendChild(this.photoFrame);
      this.hud.style.display = 'none';
      cap.focus();
      this.toast(this.touch ? 'Photo mode: drag to look, use the stick to fly' : 'Photo mode: WASD to fly, Q/E down/up, drag to look, scroll to zoom, Enter to capture, P or Esc to exit', 'info', 5000);
    } else {
      this.photoBar?.remove(); this.photoFrame?.remove();
      this.hud.style.display = '';
      this.photoBtn.focus();
    }
  }

  // ------------------------------------------------------------------ settings panel
  togglePanel() { if (this.panelOpen) this.closePanel(); else this.openPanel(); }
  openPanel(tab) {
    if (tab) this.tab = tab;
    if (this.panelOpen) { this.renderTab(); return; }
    this.panelOpen = true;
    const p = el('div', { class: 'panel glass', role: 'dialog', 'aria-label': 'Settings', 'aria-modal': 'false' });
    p.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); this.closePanel(); } });
    p.addEventListener('pointerdown', (e) => e.stopPropagation());
    const header = el('header');
    header.append(el('h2', {}, 'Settings'));
    header.append(this.iconBtn(I.close, 'Close settings (Esc)', () => this.closePanel()));
    p.appendChild(header);
    const tabs = el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Settings sections' });
    const list = [['moods', 'Moods'], ['city', 'City'], ['weather', 'Weather'], ['style', 'Visual Style'], ['life', 'City Life'], ['audio', 'Audio'], ['photo', 'Photo Mode'], ['display', 'Display & Help']];
    this.tabBtns = {};
    for (const [id, label] of list) {
      const b = el('button', { class: 'tab', role: 'tab', id: 'tab-' + id, 'aria-controls': 'panel-body', onclick: () => { this.tab = id; this.renderTab(); } }, label);
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const ids = list.map((x) => x[0]); let i = ids.indexOf(this.tab);
        i = (i + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
        this.tab = ids[i]; this.renderTab(); this.tabBtns[this.tab].focus(); e.preventDefault();
      });
      this.tabBtns[id] = b; tabs.appendChild(b);
    }
    p.appendChild(tabs);
    this.panelBody = el('div', { class: 'panel-body', id: 'panel-body', role: 'tabpanel' });
    p.appendChild(this.panelBody);
    this.panel = p;
    this.root.appendChild(p);
    this.menuBtn.classList.add('on');
    this.renderTab();
    this.tabBtns[this.tab].focus();
  }
  closePanel() {
    if (!this.panelOpen) return;
    this.panelOpen = false;
    this.panel.remove(); this.panel = null; this.bindings = [];
    this.menuBtn.classList.remove('on');
    if (!this.hidden && !this.app.photo.active) this.menuBtn.focus();
  }
  renderTab() {
    for (const [id, b] of Object.entries(this.tabBtns)) { b.setAttribute('aria-selected', id === this.tab ? 'true' : 'false'); b.tabIndex = id === this.tab ? 0 : -1; }
    this.panelBody.setAttribute('aria-labelledby', 'tab-' + this.tab);
    this.panelBody.innerHTML = '';
    this.bindings = [];
    const schema = this.schema()[this.tab];
    for (const item of schema) this.panelBody.appendChild(this.renderItem(item));
    this.panelBody.scrollTop = 0;
    this.tabBtns[this.tab].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  get(key) { return key.startsWith('photo.') ? settings.photo[key.slice(6)] : settings.get(key); }
  set(key, v) { if (key.startsWith('photo.')) settings.setPhoto(key.slice(6), v); else settings.set(key, v); }
  renderItem(it) {
    const id = 'c-' + (it.key || Math.random().toString(36).slice(2)).replace('.', '-');
    if (it.type === 'h') return el('div', { class: 'sec-h', role: 'heading', 'aria-level': '3' }, it.label);
    if (it.type === 'note') return el('p', { class: 'note' }, it.text);
    if (it.type === 'custom') { const d = el('div'); it.render(d); return d; }
    if (it.type === 'buttons') {
      const d = el('div', { class: 'btn-row' });
      for (const b of it.items) d.appendChild(el('button', { class: 'btn' + (b.primary ? ' primary' : ''), onclick: b.action }, b.label));
      return d;
    }
    const row = el('div', { class: 'row' });
    if (it.type === 'slider') {
      const lab = el('label', { for: id }, it.label);
      const fmt = it.fmt || fmtPct;
      const out = el('output', { for: id });
      const input = el('input', { type: 'range', id, min: it.min ?? 0, max: it.max ?? 1, step: it.step ?? 0.01 });
      const sync = () => { const v = this.get(it.key); input.value = v; out.textContent = fmt(v); input.setAttribute('aria-valuetext', fmt(v)); };
      input.addEventListener('input', () => { const v = parseFloat(input.value); this.set(it.key, v); out.textContent = fmt(v); input.setAttribute('aria-valuetext', fmt(v)); });
      row.append(lab, out, input); sync(); this.bindings.push([it.key, sync]);
    } else if (it.type === 'toggle') {
      const lab = el('span', { class: 'lbl', id: id + '-l' }, it.label);
      const sw = el('button', { class: 'switch', role: 'switch', 'aria-labelledby': id + '-l', id });
      const sync = () => sw.setAttribute('aria-checked', this.get(it.key) ? 'true' : 'false');
      sw.addEventListener('click', () => { this.set(it.key, !this.get(it.key)); sync(); });
      row.append(lab, sw); sync(); this.bindings.push([it.key, sync]);
    } else if (it.type === 'select') {
      const lab = el('label', { for: id }, it.label);
      const sel = el('select', { id });
      for (const [v, l] of it.options) sel.appendChild(el('option', { value: v }, l));
      const sync = () => { sel.value = this.get(it.key); };
      sel.addEventListener('change', () => this.set(it.key, sel.value));
      row.append(lab, sel); sync(); this.bindings.push([it.key, sync]);
    } else if (it.type === 'color') {
      const lab = el('label', { for: id }, it.label);
      const inp = el('input', { type: 'color', id });
      const sync = () => { inp.value = this.get(it.key); };
      inp.addEventListener('input', () => this.set(it.key, inp.value));
      row.append(lab, inp); sync(); this.bindings.push([it.key, sync]);
    } else if (it.type === 'seg') {
      const lab = el('span', { class: 'lbl', id: id + '-l' }, it.label);
      const seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': id + '-l' });
      const btns = it.options.map(([v, l]) => { const b = el('button', { onclick: () => { this.set(it.key, v); sync(); } }, l); seg.appendChild(b); return [v, b]; });
      const sync = () => { const cur = this.get(it.key); for (const [v, b] of btns) b.setAttribute('aria-pressed', (typeof v === 'number' ? Math.abs(cur - v) < 0.05 : cur === v) ? 'true' : 'false'); };
      row.append(lab, el('span'), seg); sync(); this.bindings.push([it.key, sync]);
    }
    return row;
  }
  refreshBindings() { for (const [, sync] of this.bindings) sync(); }
  onSetting(k) {
    for (const [key, sync] of this.bindings) if (key === k) sync();
    if (k === 'mode') this.updateMode();
    if (k === 'umbrella') this.updateUmbrella();
    if (k === 'showMinimap') this.mmWrap.hidden = !settings.get('showMinimap');
    if (k === 'showFps') this.fps.hidden = !settings.get('showFps');
    if (k === 'city' && this.panelOpen && this.tab === 'city') this.renderTab();
  }

  schema() {
    const app = this.app;
    const opts = (obj) => Object.entries(obj).map(([k, v]) => [k, v.label]);
    return {
      moods: [
        { type: 'h', label: 'Atmosphere presets' },
        { type: 'note', text: 'Each mood changes several settings together. You can fine-tune anything afterwards.' },
        { type: 'custom', render: (d) => {
          const g = el('div', { class: 'presets' });
          for (const p of PRESETS) g.appendChild(el('button', { class: 'preset', onclick: () => { settings.applyPreset(p.id); this.toast(p.name); } }, `<b>${p.name}</b><span>${p.desc}</span>`));
          d.appendChild(g);
        } },
        { type: 'h', label: 'Your moods' },
        { type: 'custom', render: (d) => {
          const list = listMoods();
          if (!list.length) d.appendChild(el('p', { class: 'note' }, 'Save the current scene — city, time, weather and look — to come back to it later or share it as a link.'));
          const g = el('div', { class: 'presets' });
          for (const m of list) {
            const wrap = el('div', { style: 'position:relative' });
            wrap.appendChild(el('button', { class: 'preset', style: 'width:100%', onclick: () => { settings.setMany(m.values); this.toast(m.name); } }, `<b>${escapeHtml(m.name)}</b><span>${new Date(m.at).toLocaleDateString()}</span>`));
            wrap.appendChild(el('button', { class: 'np-btn', style: 'position:absolute;top:4px;right:4px;width:32px;height:32px', 'aria-label': `Delete mood ${m.name}`, onclick: () => { deleteMood(m.name); this.renderTab(); } }, '✕'));
            g.appendChild(wrap);
          }
          d.appendChild(g);
          const row = el('div', { class: 'btn-row' });
          row.appendChild(el('button', { class: 'btn primary', onclick: () => {
            const name = prompt('Name this mood', `${this.app.def?.name || 'City'} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            if (!name) return;
            this.toast(saveMood(name.trim()) ? `Saved “${name.trim()}”` : 'Could not save — browser storage is unavailable', 'info');
            this.renderTab();
          } }, 'Save current mood'));
          row.appendChild(el('button', { class: 'btn', onclick: async () => {
            const link = shareLink();
            if (await copyText(link)) this.toast('Link copied — anyone opening it gets this scene');
            else prompt('Copy this link to share the scene:', link);
          } }, 'Copy share link'));
          d.appendChild(row);
        } },
        { type: 'h', label: 'More' },
        { type: 'buttons', items: [
          { label: '✦ Surprise me', primary: true, action: () => { settings.surprise(); this.toast('A new mood'); } },
          { label: 'Reset everything', action: () => { if (confirm('Reset all settings to their defaults?')) { settings.reset(); this.toast('Settings reset'); this.renderTab(); } } },
        ] },
      ],
      city: [
        { type: 'h', label: 'Choose a city' },
        { type: 'custom', render: (d) => {
          const g = el('div', { class: 'cards' });
          for (const c of app.cities) {
            const b = el('button', { class: 'card', 'aria-pressed': settings.get('city') === c.id ? 'true' : 'false', onclick: () => app.switchCity(c.id) },
              `<div class="sw" style="background:linear-gradient(135deg, ${c.palette.fog}, ${c.palette.accent})"></div><div><b>${c.name}</b><span>${c.neighborhood} — ${c.blurb}</span></div>`);
            g.appendChild(b);
          }
          d.appendChild(g);
        } },
        { type: 'h', label: 'Way of walking' },
        { type: 'seg', key: 'mode', label: 'Mode', options: [['walk', 'Free walk'], ['stroll', 'Scenic stroll']] },
        { type: 'slider', key: 'walkSpeed', label: 'Walking pace', min: 0.6, max: 1.6, step: 0.05, fmt: fmtX },
        { type: 'slider', key: 'lookSensitivity', label: 'Look sensitivity', min: 0.3, max: 2.5, step: 0.05, fmt: fmtX },
        { type: 'toggle', key: 'invertY', label: 'Invert vertical look' },
        { type: 'toggle', key: 'reducedMotion', label: 'Reduced motion (fewer automatic turns, no head bob)' },
        { type: 'toggle', key: 'headBob', label: 'Gentle head bob' },
        { type: 'toggle', key: 'umbrella', label: 'My umbrella open' },
        { type: 'toggle', key: 'showMinimap', label: 'Show neighbourhood map' },
        { type: 'buttons', items: [{ label: 'Return to starting view', action: () => { app.returnToStart(); } }, { label: 'Reset section', action: () => settings.reset('city') }] },
      ],
      weather: [
        { type: 'note', text: 'Simulated weather — it does not follow a live forecast.' },
        { type: 'h', label: 'Season' },
        { type: 'seg', key: 'season', label: 'Season', options: [['spring', 'Spring'], ['summer', 'Summer'], ['autumn', 'Autumn'], ['winter', 'Winter']] },
        { type: 'seg', key: 'precip', label: 'Falling', options: [['auto', 'Auto'], ['rain', 'Rain'], ['sleet', 'Sleet'], ['snow', 'Snow']] },
        { type: 'note', text: 'Auto brings snow in winter and rain the rest of the year. Snow slowly settles on roofs, ledges, cars and sidewalks.' },
        { type: 'h', label: 'Rain' },
        { type: 'slider', key: 'rainIntensity', label: 'Rain / snow intensity', fmt: (v) => `${fmtPct(v)} · ${rainLabel({ ...settings.values, rainIntensity: v })}` },
        { type: 'slider', key: 'rainSpeed', label: 'Rain speed', min: 0.4, max: 2, step: 0.05, fmt: fmtX },
        { type: 'slider', key: 'dropSize', label: 'Drop size', min: 0.4, max: 2, step: 0.05, fmt: fmtX },
        { type: 'color', key: 'rainColor', label: 'Rain colour' },
        { type: 'slider', key: 'puddles', label: 'Puddles' },
        { type: 'slider', key: 'wetness', label: 'Wet surfaces' },
        { type: 'h', label: 'Air' },
        { type: 'slider', key: 'fog', label: 'Fog' },
        { type: 'slider', key: 'mist', label: 'Low mist' },
        { type: 'slider', key: 'wind', label: 'Wind' },
        { type: 'slider', key: 'windDir', label: 'Wind direction', min: 0, max: 360, step: 5, fmt: fmtDeg },
        { type: 'h', label: 'Clouds' },
        { type: 'slider', key: 'clouds', label: 'Cloud coverage' },
        { type: 'slider', key: 'cloudDarkness', label: 'Cloud darkness' },
        { type: 'slider', key: 'cloudHeight', label: 'Cloud height' },
        { type: 'slider', key: 'cloudSpeed', label: 'Cloud movement' },
        { type: 'h', label: 'Storm' },
        { type: 'slider', key: 'storm', label: 'Storm strength' },
        { type: 'toggle', key: 'lightning', label: 'Lightning' },
        { type: 'toggle', key: 'thunder', label: 'Thunder' },
        { type: 'h', label: 'Time of day' },
        { type: 'slider', key: 'timeOfDay', label: 'Time', min: 0, max: 23.99, step: 0.05, fmt: fmtTime },
        { type: 'seg', key: 'timeOfDay', label: 'Quick pick', options: TIME_PRESETS.map(([l, v]) => [v, l]) },
        { type: 'seg', key: 'timeFlow', label: 'Clock', options: [['still', 'Stay still'], ['slow', 'Slowly pass'], ['gentle', 'Pass faster']] },
        { type: 'buttons', items: [{ label: 'Reset weather', action: () => settings.reset('weather') }] },
      ],
      style: [
        { type: 'h', label: 'Mood & colour' },
        { type: 'select', key: 'style', label: 'Visual style', options: opts(STYLES) },
        { type: 'select', key: 'palette', label: 'Colour palette', options: opts(PALETTES) },
        { type: 'color', key: 'custom1', label: 'Custom colour 1' },
        { type: 'color', key: 'custom2', label: 'Custom colour 2' },
        { type: 'color', key: 'custom3', label: 'Custom colour 3' },
        { type: 'h', label: 'Rainbow light' },
        { type: 'note', text: 'Colour drifts through the rain and is reflected by streets, puddles, walls, windows and cars.' },
        { type: 'slider', key: 'rainbow', label: 'Intensity' },
        { type: 'toggle', key: 'rainbowMove', label: 'Colours move' },
        { type: 'slider', key: 'rainbowSpeed', label: 'Movement speed' },
        { type: 'slider', key: 'rainbowSpread', label: 'Spread' },
        { type: 'slider', key: 'rainbowDir', label: 'Direction', min: 0, max: 360, step: 5, fmt: fmtDeg },
        { type: 'slider', key: 'rainbowSat', label: 'Saturation' },
        { type: 'h', label: 'Reflections' },
        { type: 'slider', key: 'reflections', label: 'Overall reflections' },
        { type: 'custom', render: (d) => {
          const det = el('details');
          det.appendChild(el('summary', {}, 'Fine-tune each surface'));
          for (const it of [
            { type: 'slider', key: 'reflStreet', label: 'Streets' }, { type: 'slider', key: 'reflPuddle', label: 'Puddles' },
            { type: 'slider', key: 'reflWindow', label: 'Windows' }, { type: 'slider', key: 'reflCar', label: 'Cars' },
            { type: 'slider', key: 'reflRain', label: 'Light in the rain' }, { type: 'slider', key: 'reflNeon', label: 'Neon glow' },
            { type: 'slider', key: 'reflBlur', label: 'Blur' }, { type: 'slider', key: 'reflLength', label: 'Streak length' },
            { type: 'slider', key: 'reflColor', label: 'Colour intensity', min: 0, max: 1.5 }, { type: 'slider', key: 'reflMotion', label: 'Ripple movement' },
          ]) det.appendChild(this.renderItem(it));
          d.appendChild(det);
        } },
        { type: 'h', label: 'City lights' },
        { type: 'slider', key: 'streetlights', label: 'Streetlights', max: 1.5 },
        { type: 'slider', key: 'storefronts', label: 'Storefronts', max: 1.5 },
        { type: 'slider', key: 'windowGlow', label: 'Window glow', max: 1.5 },
        { type: 'slider', key: 'headlights', label: 'Headlights', max: 1.5 },
        { type: 'slider', key: 'neon', label: 'Neon', max: 1.5 },
        { type: 'slider', key: 'ambient', label: 'Ambient light', max: 1.5 },
        { type: 'slider', key: 'moonlight', label: 'Moonlight', max: 1.5 },
        { type: 'slider', key: 'bloom', label: 'Bloom / glow', max: 1.5 },
        { type: 'slider', key: 'exposure', label: 'Brightness', min: 0.5, max: 1.8, fmt: fmtX },
        { type: 'buttons', items: [{ label: 'Reset visual style', action: () => settings.reset('style') }] },
      ],
      life: [
        { type: 'h', label: 'People' },
        { type: 'slider', key: 'pedestrians', label: 'Pedestrians', fmt: (v) => v < 0.05 ? 'Almost empty' : v > 0.85 ? 'Rush hour' : fmtPct(v) },
        { type: 'slider', key: 'pedSpeed', label: 'Walking speed', min: 0.6, max: 1.4, step: 0.05, fmt: fmtX },
        { type: 'slider', key: 'umbrellaPct', label: 'Carrying umbrellas' },
        { type: 'slider', key: 'groups', label: 'Groups vs. walking alone', fmt: (v) => v < 0.1 ? 'Mostly alone' : v > 0.7 ? 'Mostly groups' : fmtPct(v) },
        { type: 'toggle', key: 'dogs', label: 'Dog walkers' },
        { type: 'h', label: 'Traffic' },
        { type: 'slider', key: 'traffic', label: 'Traffic amount' },
        { type: 'slider', key: 'trafficSpeed', label: 'Traffic speed', min: 0.5, max: 1.5, step: 0.05, fmt: fmtX },
        { type: 'toggle', key: 'taxis', label: 'Taxis' },
        { type: 'toggle', key: 'buses', label: 'Buses' },
        { type: 'toggle', key: 'cyclists', label: 'Cyclists' },
        { type: 'toggle', key: 'headlightsOn', label: 'Headlights on' },
        { type: 'toggle', key: 'citySounds', label: 'City sounds' },
        { type: 'toggle', key: 'cityRhythm', label: 'City follows the clock (shops close, streets quieten late at night, dawn deliveries)' },
        { type: 'buttons', items: [{ label: 'Reset city life', action: () => settings.reset('life') }] },
      ],
      audio: [
        { type: 'h', label: 'Music' },
        { type: 'custom', render: (d) => {
          const tr = app.music?.current() || TRACKS[0];
          d.appendChild(el('p', { class: 'note', 'data-now': true }, app.audioReady ? `${tr.title} — ${MUSIC_STYLES[tr.style]?.label}${app.music?.playing ? '' : ' (paused)'}` : 'Sound is off. Press “Turn on sound” to start audio.'));
          const row = el('div', { class: 'btn-row' });
          if (!app.audioReady) row.appendChild(el('button', { class: 'btn primary', onclick: async () => { await app.enableAudio(true); this.renderTab(); } }, 'Turn on sound'));
          else {
            row.appendChild(el('button', { class: 'btn', onclick: () => app.music.prev() }, '⏮ Previous'));
            row.appendChild(el('button', { class: 'btn primary', onclick: () => app.toggleMusic() }, 'Play / pause'));
            row.appendChild(el('button', { class: 'btn', onclick: () => app.music.next() }, 'Next ⏭'));
          }
          d.appendChild(row);
        } },
        { type: 'seg', key: 'musicSource', label: 'Play', options: [['builtin', 'Built-in lo-fi'], ['mine', 'My music']] },
        { type: 'custom', render: (d) => {
          const lm = app.localMusic;
          const row = el('div', { class: 'btn-row' });
          const input = el('input', { type: 'file', accept: 'audio/*', multiple: true, hidden: true, 'aria-label': 'Choose audio files' });
          input.addEventListener('change', async () => {
            if (!app.audioReady) await app.enableAudio(false);
            const r = await app.localMusic.add([...input.files]);
            this.toast(`Added ${r.added} track${r.added === 1 ? '' : 's'}${r.skipped ? ` (${r.skipped} skipped — not audio)` : ''}`);
            if (r.added && settings.get('musicSource') !== 'mine') settings.set('musicSource', 'mine');
            this.renderTab();
          });
          row.append(input, el('button', { class: 'btn', onclick: () => input.click() }, '＋ Add music files'));
          if (lm?.tracks.length) row.appendChild(el('button', { class: 'btn', onclick: async () => { if (confirm('Remove all of your music from this app? (Your original files are not touched.)')) { await lm.clear(); this.renderTab(); } } }, 'Remove all'));
          d.appendChild(row);
          if (lm?.tracks.length) {
            const ul = el('div', { class: 'cards' });
            lm.tracks.forEach((t, i) => {
              const r2 = el('div', { class: 'row', style: 'padding:4px 0' });
              r2.append(el('button', { class: 'linkish', style: 'text-align:left;min-height:36px;padding:4px 0', onclick: () => { lm.index = i; if (settings.get('musicSource') !== 'mine') settings.set('musicSource', 'mine'); lm.playing = true; lm.start(); } }, escapeHtml(t.title)),
                el('button', { class: 'np-btn', 'aria-label': `Remove ${t.title}`, onclick: async () => { await lm.remove(t.id); this.renderTab(); } }, '✕'));
              ul.appendChild(r2);
            });
            d.appendChild(ul);
          }
          d.appendChild(el('p', { class: 'note' }, 'Your files stay on this device and are never uploaded. Formats depend on your browser (MP3, AAC and WAV work almost everywhere).'));
        } },
        { type: 'select', key: 'musicStyle', label: 'Built-in music style', options: [['all', 'All styles'], ...Object.entries(MUSIC_STYLES).map(([k, v]) => [k, v.label])] },
        { type: 'toggle', key: 'shuffle', label: 'Shuffle' },
        { type: 'slider', key: 'musicVol', label: 'Music volume' },
        { type: 'note', text: 'All music is composed live in your browser — original, royalty-free, and different every track.' },
        { type: 'h', label: 'Ambience' },
        { type: 'slider', key: 'masterVol', label: 'Master volume' },
        { type: 'slider', key: 'rainVol', label: 'Rain' },
        { type: 'slider', key: 'thunderVol', label: 'Thunder' },
        { type: 'slider', key: 'trafficVol', label: 'Traffic' },
        { type: 'slider', key: 'peopleVol', label: 'People' },
        { type: 'slider', key: 'windVol', label: 'Wind' },
        { type: 'slider', key: 'ambienceVol', label: 'City ambience' },
        { type: 'slider', key: 'footstepsVol', label: 'Footsteps' },
        { type: 'buttons', items: [{ label: 'Reset audio', action: () => settings.reset('audio') }] },
      ],
      photo: [
        { type: 'custom', render: (d) => {
          const row = el('div', { class: 'btn-row' });
          if (!app.photo.active) row.appendChild(el('button', { class: 'btn primary', onclick: () => app.togglePhoto() }, 'Enter photo mode'));
          else { row.appendChild(el('button', { class: 'btn primary', onclick: () => app.capturePhoto() }, 'Capture image')); row.appendChild(el('button', { class: 'btn', onclick: () => app.togglePhoto() }, 'Exit photo mode')); }
          d.appendChild(row);
          d.appendChild(el('p', { class: 'note' }, 'Photo mode pauses your walk. Fly freely with WASD (Q/E down/up), drag to look, scroll to zoom. On touch, use the stick and drag.'));
        } },
        { type: 'h', label: 'Lens' },
        { type: 'slider', key: 'photo.fov', label: 'Field of view (zoom)', min: 15, max: 100, step: 1, fmt: (v) => Math.round(v) + '°' },
        { type: 'slider', key: 'photo.roll', label: 'Camera tilt', min: -20, max: 20, step: 0.5, fmt: fmtDeg },
        { type: 'slider', key: 'photo.exposure', label: 'Exposure', min: 0.4, max: 2.2, step: 0.02, fmt: fmtX },
        { type: 'toggle', key: 'photo.dof', label: 'Depth of field' },
        { type: 'slider', key: 'photo.focus', label: 'Focus distance', min: 1, max: 60, step: 0.5, fmt: (v) => v.toFixed(1) + ' m' },
        { type: 'slider', key: 'photo.aperture', label: 'Background blur', min: 0.05, max: 2, step: 0.05 },
        { type: 'slider', key: 'photo.grain', label: 'Film grain', min: 0, max: 0.3, step: 0.01 },
        { type: 'h', label: 'Scene' },
        { type: 'toggle', key: 'photo.freeze', label: 'Freeze time' },
        { type: 'toggle', key: 'photo.hidePeople', label: 'Hide pedestrians' },
        { type: 'toggle', key: 'photo.hideCars', label: 'Hide vehicles' },
        { type: 'toggle', key: 'photo.hideRain', label: 'Hide rain' },
      ],
      display: [
        { type: 'h', label: 'Graphics' },
        { type: 'seg', key: 'quality', label: 'Quality', options: [['auto', 'Auto'], ['hd', 'High Definition'], ['balanced', 'Balanced'], ['low', 'Battery saver']] },
        { type: 'note', text: 'High Definition uses full-resolution reflections, smoother rain and more lights for capable computers and TVs. Balanced keeps the same look with lighter effects. Auto picks for your device and adjusts resolution to stay smooth.' },
        { type: 'slider', key: 'resolutionScale', label: 'Render resolution', min: 0.5, max: 1, step: 0.05, fmt: fmtPct },
        { type: 'seg', key: 'fpsCap', label: 'Frame-rate limit (cooler, quieter)', options: [['off', 'Off'], ['60', '60 fps'], ['30', '30 fps']] },
        { type: 'toggle', key: 'showFps', label: 'Show frame rate' },
        { type: 'buttons', items: [{ label: 'Full screen', action: () => app.toggleFullscreen() }, { label: 'Hide interface', action: () => this.setHidden(true) }] },
        { type: 'note', text: 'Some browsers (notably iPhone Safari) cannot hide their toolbars, and TVs may crop the picture edges (overscan). When true full screen is unavailable, an expanded view is used instead.' },
        { type: 'h', label: 'Controls' },
        { type: 'custom', render: (d) => {
          d.innerHTML = `<div class="keys">
            <kbd>W A S D</kbd><span>Walk (arrow keys: walk forward/back and turn)</span>
            <kbd>Drag</kbd><span>Look around (mouse, touch or trackpad)</span>
            <kbd>Shift</kbd><span>Walk faster</span>
            <kbd>T</kbd><span>Switch free walk ↔ scenic stroll</span>
            <kbd>E</kbd><span>Sit / stand, take stairs and doors, pause at a viewpoint</span>
            <kbd>U</kbd><span>Open or close umbrella</span>
            <kbd>P</kbd><span>Photo mode (Enter captures)</span>
            <kbd>M</kbd><span>Open settings · <kbd>Esc</kbd> closes</span>
            <kbd>H</kbd><span>Hide / show the interface</span>
            <kbd>F</kbd><span>Full screen</span>
            <kbd>R</kbd><span>Return to the starting view</span>
            <kbd>K</kbd><span>Play / pause music · <kbd>N</kbd> next track</span>
            <kbd>Gamepad</kbd><span>Left stick walk, right stick look, A sit, Y stroll</span>
          </div>`;
        } },
        { type: 'h', label: 'About' },
        { type: 'note', text: 'Rainfall Avenue is an original app. Every building, texture, person, sound and song is generated procedurally in your browser — no photos, map imagery, samples or paid services are used. Street names are borrowed for flavour; layouts, façades, shop names and skylines are artistic interpretations, not surveys of real places. Built with Three.js (MIT licence).' },
        { type: 'buttons', items: [{ label: 'Reset all settings', action: () => { if (confirm('Reset all settings to their defaults?')) { settings.reset(); this.renderTab(); } } }] },
      ],
    };
  }
}
export { fmtTime, DEFAULTS };
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
