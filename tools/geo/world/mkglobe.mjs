// Build the bundled Natural Earth globe dataset: simplified countries (world-atlas 50m = Natural Earth 1:50m) + the largest populated places.
import fs from 'fs';
import {presimplify, simplify, quantile} from 'topojson-simplify';
import {quantize} from 'topojson-client';
const topo=JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json','utf8'));
const keep=+process.argv[2]||0.12;   // fraction of arc points kept
let t=presimplify(topo);
const minW=quantile(t,keep);
t=simplify(t,minW);
t=quantize(t,[-180,-90,180,90].map(Number)[0]===-180?1e4:1e4);
// strip unneeded props, keep name + id
const g=t.objects.countries.geometries;for(const o of g){o.properties={name:o.properties&&o.properties.name};}
delete t.objects.land;
const out={t, };
const arcs=JSON.stringify(t);
fs.writeFileSync('globe_topo.json',arcs);
console.log('topo bytes',arcs.length,'minW',minW);
// places
const gj=JSON.parse(fs.readFileSync('ne_pop.geojson','utf8'));
let P=gj.features.map(f=>f.properties).map(p=>({n:p.name,a:p.latitude,o:p.longitude,p:p.pop_max||0,c:p.adm0cap?1:0,i:p.iso_a2||'',r:p.adm1name||''}));
P.sort((a,b)=>b.p-a.p);
const sel=P.filter((p,i)=>i<1300||p.c);
const lines=sel.map(p=>[p.n.replace(/\|/g,' '),p.a.toFixed(2),p.o.toFixed(2),Math.round(p.p/1000),p.i,p.c].join('|')).join('\n');
fs.writeFileSync('globe_places.txt',lines);
console.log('places',sel.length,'bytes',lines.length);
console.log(sel.filter(p=>/Bridgeport|Kathmandu|Nairobi|Paris|La Paz|Cusco|Zürich|Denver/.test(p.n)).map(p=>p.n+' '+p.p));
