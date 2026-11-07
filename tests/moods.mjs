import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 800, height: 450 }, permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://127.0.0.1:5173/?quality=low');
await p.waitForFunction(() => !document.querySelector('.row-btns')?.hidden, null, { timeout: 180000 });
await p.click('[data-go="sound"]');
await p.evaluate(() => { const s = window.__rainfall; window.__settings.setMany({ timeOfDay: 3.5, rainbow: 0.7, style: 'neon' }); });
await p.keyboard.press('m'); await p.waitForTimeout(500);
p.once('dialog', (d) => d.accept('Test mood'));
await p.click('text=Save current mood'); await p.waitForTimeout(400);
const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('rainfall-avenue:moods:v1')).map((m) => m.name));
await p.click('text=Copy share link'); await p.waitForTimeout(400);
const link = await p.evaluate(() => navigator.clipboard.readText());
// audio tab: add a file
await p.click('#tab-audio'); await p.waitForTimeout(300);
await p.setInputFiles('input[type=file]', process.argv[2]);
await p.waitForTimeout(1500);
const music = await p.evaluate(() => ({ src: window.__rainfall.music.source, cur: window.__rainfall.music.current(), n: window.__rainfall.localMusic.tracks.length, np: document.querySelector('.now-playing .title').textContent }));
// open the share link in a fresh page
const p2 = await ctx.newPage(); p2.on('pageerror', (e) => errs.push(e.message));
await p2.addInitScript(() => localStorage.removeItem('rainfall-avenue:settings:v1'));
await p2.goto(link.replace('5173/', '5173/?quality=low'));
await p2.waitForFunction(() => !document.querySelector('.row-btns')?.hidden, null, { timeout: 180000 });
const opened = await p2.evaluate(() => ({ t: window.__settings.values.timeOfDay, rb: window.__settings.values.rainbow, st: window.__settings.values.style, hash: location.hash }));
console.log(JSON.stringify({ saved, link: link.slice(0, 90) + '…', music, opened, errs }));
await b.close();
