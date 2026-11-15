// Draws every motion matching a prefix as a filmstrip grid (rows = motions, columns = time).
// usage: node tests/motions-sheet.mjs <prefix> <out.png> [frames]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs'; import path from 'path';
const [prefix = 'pp_', out = 'tests/shots/sheet.png', N = '8'] = process.argv.slice(2);
const src = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src');
const js = ['motions.js', ...fs.readdirSync(src).filter(f => /^motions-.*\.js$/.test(f))].map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n');
const html = `<canvas id=c></canvas><script>${js}</script><script>
const M = StickMotions, names = M.names.filter(n => n.startsWith(${JSON.stringify(prefix)})), N = ${+N};
const W = 90, H = 90, c = document.getElementById('c'); c.width = 130 + W * N; c.height = H * names.length;
const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
names.forEach((n, i) => {
  x.fillStyle = '#333'; x.font = '12px sans-serif'; x.fillText(n, 4, i * H + 48);
  const d = M.duration(n);
  for (let k = 0; k < N; k++) {
    const P = M.sample(n, d * k / (N - (M.loops(n) ? 0 : 1)));
    const ox = 130 + k * W + 45, oy = i * H + 70;
    x.strokeStyle = '#ccc'; x.beginPath(); x.moveTo(ox - 40, oy); x.lineTo(ox + 40, oy); x.stroke();
    x.strokeStyle = '#111'; x.lineWidth = 2.2; x.lineCap = 'round';
    const L = (a, b) => { x.moveTo(ox + P[a][0], oy + P[a][1]); x.lineTo(ox + P[b][0], oy + P[b][1]); };
    x.beginPath(); L('neck', 'hip'); L('neck', 'lElbow'); L('lElbow', 'lHand'); L('neck', 'rElbow'); L('rElbow', 'rHand');
    L('hip', 'lKnee'); L('lKnee', 'lFoot'); L('hip', 'rKnee'); L('rKnee', 'rFoot'); x.stroke();
    x.beginPath(); x.arc(ox + P.head[0], oy + P.head[1], 6.5, 0, 7); x.stroke();
    x.strokeStyle = '#d33'; x.beginPath(); L('neck', 'rElbow'); L('rElbow', 'rHand'); L('hip', 'rKnee'); L('rKnee', 'rFoot'); x.lineWidth = 1; x.stroke();
    x.fillStyle = '#888'; x.font = '9px sans-serif'; x.fillText(P.face || '', ox - 40, oy + 14);
  }
});
document.title = 'ok:' + names.length;
</script>`;
fs.mkdirSync(path.dirname(out), { recursive: true });
const tmp = path.resolve('tests/shots/_sheet.html'); fs.writeFileSync(tmp, html);
const b = await chromium.launch(); const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + tmp); await p.waitForTimeout(200);
const size = await p.evaluate(() => [document.getElementById('c').width, document.getElementById('c').height, document.title]);
await p.setViewportSize({ width: size[0] + 20, height: size[1] + 20 });
await p.locator('#c').screenshot({ path: out });
console.log(size[2], errs.join(' | ') || 'no errors');
await b.close();
