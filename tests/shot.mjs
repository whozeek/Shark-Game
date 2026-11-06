import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW || 'playwright');
const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || 'shot.png';
const wait = +(process.argv[4] || 6000);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 720) } });
const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
if (process.env.INIT) await page.addInitScript(process.env.INIT);
await page.goto(url);
await page.waitForTimeout(wait);
if (process.env.WAITDONE) await page.waitForFunction(() => window.__done, null, { timeout: 240000 });
if (process.env.EVAL) { try { console.log('EVAL', JSON.stringify(await page.evaluate(process.env.EVAL))); } catch (e) { console.log('EVALERR', e.message); } }
await page.screenshot({ path: out });
console.log(logs.slice(-40).join('\n'));
await browser.close();
