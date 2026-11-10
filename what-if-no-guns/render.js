// usage: node render.js out.mp4 [fps] [startSec] [endSec] [frameList]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const out = process.argv[2], fps = +(process.argv[3] || 30);
  const tl = JSON.parse(require('fs').readFileSync(path.join(__dirname, 'build/timeline.json')));
  const s0 = +(process.argv[4] || 0), s1 = +(process.argv[5] || tl.total);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => document.fonts.ready);
  if (out.endsWith('.jpg')) { // still frames: times list
    const times = process.argv.slice(4).map(Number);
    for (const T of times) { const d = await page.evaluate(([T]) => grab(T, .85), [T]); require('fs').writeFileSync(out.replace('.jpg', `_${T.toFixed(1)}.jpg`), Buffer.from(d.split(',')[1], 'base64')); }
    if (errs.length) console.error(errs.slice(0, 5)); await browser.close(); return;
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(s0 * fps), n1 = Math.round(s1 * fps);
  const t0 = Date.now();
  for (let i = n0; i < n1; i++) {
    const d = await page.evaluate(([T]) => grab(T), [i / fps]);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.error(`frame ${i}/${n1} ${((Date.now() - t0) / 1000).toFixed(0)}s`, errs.length ? errs[0] : '');
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  if (errs.length) console.error('ERRORS', errs.slice(0, 5));
  await browser.close();
})();
