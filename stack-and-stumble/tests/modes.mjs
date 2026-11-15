// Plays each mode/world for a while with random input; reports errors, game results and states seen.
// usage: node tests/modes.mjs [seconds-per-run]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'path';
const secs = +(process.argv[2] || 25);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 780 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), 'debug.html'));
await p.waitForTimeout(300);
const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'ArrowDown'];
for (const [mode, world] of [['classic', 'garden'], ['escape', 'garden'], ['escape', 'ice'], ['classic', 'wind'], ['escape', 'jelly'], ['classic', 'ruins'], ['daily', null]]) {
  await p.evaluate(([m, w]) => { const P = __dbg.PREF(); P.mode = m; if (w) P.world = w; __startGame(); }, [mode, world]);
  const seen = {}, motions = {};
  let result = null;
  for (let i = 0; i < secs * 4; i++) {
    await p.waitForTimeout(250);
    if (Math.random() < 0.4) await p.keyboard.press(keys[Math.floor(Math.random() * keys.length)]);
    const st = await p.evaluate(() => { const S = __S(); return { mode: S.mode, s: S.climber.state, res: S.result, haz: S.haz && Math.round(S.haz.y), pp: S.climber.pp && S.climber.pp.name, fx: S.fx.flat().filter(Boolean).length }; });
    seen[st.s] = (seen[st.s] || 0) + 1; if (st.pp) motions[st.pp] = 1;
    if (st.mode === 'over') { result = st.res; break; }
  }
  const fin = await p.evaluate(() => { const S = __S(); return { score: S.final || S.score, peak: S.climber.peak, haz: S.haz && Math.round(S.haz.y), fx: S.fx.flat().filter(Boolean).length, title: document.getElementById('ovTitle').textContent }; });
  console.log(mode, world, 'result', result, JSON.stringify(fin), JSON.stringify(seen), Object.keys(motions).join(','));
}
console.log(errs.join('\n') || 'no errors');
await b.close();
