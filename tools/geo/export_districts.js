#!/usr/bin/env node
/* Writes tools/geo/districts.json (id, town, name, centre lat/lon, block size, grid size, metadata, and the authored fallback map) from tools/geo/ct_data.js.
   Run this after you edit ct_data.js:  node tools/geo/export_districts.js
   The Python tools read districts.json, so they need no JavaScript. */
const fs = require('fs'), path = require('path');
const here = __dirname;
const src = fs.readFileSync(path.join(here, 'ct_data.js'), 'utf8').replace('__CT_OUTLINE__', '{}');
const CT = new Function(src + ';return CT_DATA')();
const out = CT.districts.map(d => Object.assign({}, d, { cols: undefined, rows: undefined, rowNames: d.rows, colNames: d.cols,
  gridCols: d.map[0].length, gridRows: d.map.length }));
out.forEach(o => { delete o.cols; delete o.rows; });
fs.writeFileSync(path.join(here, 'districts.json'), JSON.stringify(out, null, 1));
console.log('wrote', out.length, 'districts');
