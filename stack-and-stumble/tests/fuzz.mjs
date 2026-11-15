// Random play on a phone-sized screen; reports page errors, a stopped game loop, or the climber
// stuck in place while unsupported.  usage: node tests/fuzz.mjs [steps]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'path';
const page_ = 'file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), 'debug.html');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 400, height: 860 }, hasTouch: true });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(page_);
await p.waitForTimeout(300);
await p.evaluate(() => window.__startGame ? window.__startGame() : document.getElementById('ovBtn').click());
const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyZ', 'Space', 'ArrowDown', 'KeyC'];
let lastKey = null, same = 0, lastT = 0;
for (let i = 0; i < Number(process.argv[2] || 600); i++) {
  await p.waitForTimeout(100);
  if (Math.random() < 0.35) { const k = keys[Math.floor(Math.random() * keys.length)]; await p.keyboard.press(k); }
  const st = await p.evaluate(() => { const S = __S(), C = S.climber; return { mode: S.mode, t: S.time, s: C.state, x: C.x, y: C.y,
    uns: !['ground', 'dazed', 'win', 'squash', 'hang', 'pull', 'dead', 'button'].includes(C.state) }; });
  if (st.mode === 'over') { await p.evaluate(() => window.__startGame ? window.__startGame() : document.getElementById('ovBtn').click()); lastKey = null; continue; }
  if (st.mode === 'play' && st.t === lastT) { errs.push('LOOP STOPPED ' + JSON.stringify(st)); break; }
  lastT = st.t;
  const key = Math.round(st.x) + ',' + Math.round(st.y);
  if (st.uns && key === lastKey) same++; else same = 0;
  lastKey = key;
  if (same >= 8) { errs.push('STUCK ' + JSON.stringify(st)); same = 0; }
}
console.log(errs.join('\n\n') || 'no problems');
await b.close();
