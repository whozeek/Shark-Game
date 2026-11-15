// Seal him in a pocket too thick to drill and log how his anger escalates until the teleport button.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'path';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 780 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), 'debug.html'));
await p.waitForTimeout(300);
await p.evaluate(() => { const P = __dbg.PREF(); P.mode = 'classic'; P.world = 'garden'; __startGame();
  const S = __S(); for (let r = 4; r < 20; r++) for (let c = 0; c < 10; c++) if (!(r >= 18 && c >= 3 && c <= 5)) S.board[r][c] = 'J';
  S.board[19][9] = 0; S.board[5][9] = 0; S.board[4][9] = 0;
  S.climber.x = 4 * 28 + 14; S.climber.y = 560; S.cur.y = -2; S.dropT = -999; });
let last = '', shot = 0;
for (let i = 0; i < 120; i++) {
  await p.waitForTimeout(250);
  const st = await p.evaluate(() => { const C = __S().climber; return `${C.state} ${(C.pp && C.pp.name) || ''} ${C.intent ? C.intent.type : ''} clock ${(C.stuckClock || 0).toFixed(0)} "${C.sayT > 0 ? C.sayText : ''}"`; });
  const k = st.replace(/clock \d+/, '');
  if (k !== last) { console.log((i / 4).toFixed(1) + 's', st); last = k; }
  if (/pp_(kickBlock|flail|tantrum)/.test(st) && shot < 3) { await p.screenshot({ path: `tests/shots/mad${shot++}.png`, clip: { x: 330, y: 600, width: 180, height: 170 } }); }
}
console.log(errs.join('\n') || 'no errors');
await b.close();
