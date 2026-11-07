// Step 2: decode the downloaded vector tiles (v_<x>_<y>.pbf, zoom 14) and write tools/geo/world/sample.b64 (deflate-raw JSON, base64).
// usage: node bake_sample.mjs <dir with v_*.pbf and elev.json> [Q] [lat lon]   (run after bake_elev.py)
// Size diet for the bundled file: coordinates snapped to a grid of Q tile pixels (Q=2 is about 1.4 m at 41N) and delta-encoded (decoded again in tiles.js: unpackSample).
import fs from 'fs'; import zlib from 'zlib'; import path from 'path';
import { decodeMVT } from './data.js';
const dir = process.argv[2], Q = +process.argv[3] || 2, lat = +process.argv[4] || 41.1865, lon = +process.argv[5] || -73.1952;
const tiles = {};
const pack = rings => rings.map(r => { const o = []; let px = 0, py = 0; for (let i = 0; i < r.length; i += 2) { const x = Math.round(r[i] / Q), y = Math.round(r[i + 1] / Q); if (i && x === px && y === py) continue; o.push(x - px, y - py); px = x; py = y } return o });
for (const f of fs.readdirSync(dir)) {
  const m = /^v_(\d+)_(\d+)\.pbf$/.exec(f); if (!m) continue;
  const norm = decodeMVT(new Uint8Array(fs.readFileSync(path.join(dir, f))));
  const l = {};
  for (const k in norm.l) {
    let arr = norm.l[k];
    if (['landcover', 'landuse', 'water', 'park'].includes(k)) arr = arr.filter(x => x.g.reduce((s, r) => s + r.length, 0) > 12);
    l[k] = arr.map(x => ({ p: x.p, t: x.t, g: pack(x.g) }));
  }
  tiles[m[1] + ',' + m[2]] = { l };
}
const elev = JSON.parse(fs.readFileSync(path.join(dir, 'elev.json'), 'utf8'));
const json = JSON.stringify({ origin: { lat, lon }, q: Q, bakedFrom: 'OpenFreeMap planet (OpenStreetMap, ODbL) z14 + Mapzen terrarium z12', date: new Date().toISOString().slice(0, 10), tiles, elev });
const z = zlib.deflateRawSync(Buffer.from(json), { level: 9 });
fs.writeFileSync(new URL('./sample.b64', import.meta.url), z.toString('base64'));
console.log('json', json.length, 'deflated', z.length, 'base64', Math.ceil(z.length / 3) * 4);
