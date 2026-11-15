// Screenshot the page: node tests/shot.mjs <out.png> [width] [height] [js-to-run-before] [waitMs]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'path';
const [out, w = '900', h = '780', js = '', wait = '600'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), 'debug.html'));
await p.waitForTimeout(400);
if (js) await p.evaluate(js);
await p.waitForTimeout(+wait);
await p.screenshot({ path: out });
console.log(errs.join('\n') || 'no errors');
await b.close();
