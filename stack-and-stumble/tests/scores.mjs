// Plays 5 quick games (forced endings), then screenshots the result card with the unlock and the score board.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'path';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 780 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), 'debug.html'));
await p.waitForTimeout(300);
for (let i = 0; i < 5; i++) {
  await p.evaluate(i => { const P = __dbg.PREF(); P.mode = i % 2 ? 'escape' : 'classic'; __startGame(); const S = __S(); S.score = 400 + i * 350; }, i);
  await p.waitForTimeout(300);
  await p.evaluate(() => { const S = __S(); for (let c = 0; c < 9; c++) S.board[0][c] = 'J'; S.cur = null; });
  await p.evaluate(() => { const S = __S(); S.climber.peak = 40; });
  await p.evaluate(() => document.querySelector('#ovBtn')); // noop
  await p.evaluate(() => { const S = __S(); S.mode === 'play' && (S.board[0][9] = 0); });
  await p.evaluate(() => window.__S && __S()); 
  await p.evaluate(() => { /* force a topout */ const S = __S(); S.cur = { t: 'O', m: [[1, 1], [1, 1]], x: 4, y: 0 }; });
  await p.evaluate(() => { const S = __S(); for (let r = 0; r < 20; r++) for (let c = 0; c < 10; c++) S.board[r][c] = (c === 9) ? 0 : 'J'; });
  await p.keyboard.press('Space');
  await p.waitForTimeout(500);
}
await p.screenshot({ path: 'tests/shots/result.png', clip: { x: 250, y: 50, width: 400, height: 730 } });
await p.click('#scoresBtn2');
await p.waitForTimeout(600);
await p.screenshot({ path: 'tests/shots/scores.png', clip: { x: 250, y: 50, width: 400, height: 730 } });
console.log(await p.evaluate(() => JSON.stringify({ unlocked: localStorage.getItem('stack-stumble-unlocked'), scores: localStorage.getItem('stack-stumble-scores') })));
console.log(errs.join('\n') || 'no errors');
await b.close();
