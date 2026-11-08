# tools/geo: real map data for the Connecticut campaign

The game is a block-grid city, and it can also run a **free-form district** whose roads are a real road graph (curves, diagonals, ring roads, irregular street meshes). The Connecticut campaign turns each campaign map into a real DISTRICT of a real town.
Most districts are fitted onto the block grid and are **approximate** (`approx:true`, authored from general geographic knowledge). Three Bridgeport districts (Black Rock, North End, Downtown) are free-form and use roads **traced by eye from a satellite screenshot**
(see "Free-form districts" below; also approximate). These tools replace all of them with real data.
Swapping in real data is a data change inside the `CT_DATA` block of `rush-hour-routes.html`; no engine change is needed.

## Files

| file | what it is |
| --- | --- |
| `ct_data.js` | The source of the `CT_DATA` block: projection constants, towns, road corridors, hills, rivers and the district list (map letters, street names, landmark names, blurbs). Edit this, then run `inject.py`. |
| `districts.json` | The same districts as JSON for the Python tools. Regenerate with `node tools/geo/export_districts.js` after editing `ct_data.js`. |
| `fetch_osm.py` | Downloads OpenStreetMap data for every district bounding box into `geo_data/<id>.json`. **Run this on your own computer** (it needs internet). |
| `build_levels.py` | Rasterises the downloaded files onto the block grid and writes the district entries as JavaScript. For free-form districts (`isFF` in `districts.json`) it runs the **roads-to-graph** step instead (below). |
| `trace_bridgeport.py` | The hand-traced Bridgeport road network (screenshot pixels): motorways, arterials, water, parks and side-street meshes. Writes the `FF_TRACED` block of `ct_data.js`. Approximate, not surveyed. |
| `inject.py` | Puts `ct_data.js` (or just a generated districts list) into the game file. |
| `topo_extract.py` | Extracts the state outline from the us-atlas TopoJSON (already run, result in `geo_data/ct_outline.json`). |
| `make_sample.py` | Writes a tiny synthetic data file so you can test `build_levels.py` offline. Test data only. |

All Python is standard library only (Python 3.8+).

## Replace the approximations with real data

```sh
python3 tools/geo/fetch_osm.py --list              # ids and bounding boxes
python3 tools/geo/fetch_osm.py                     # download everything (or: ... br-downtown nh-yale)
python3 tools/geo/build_levels.py --report br-downtown   # look at the grid and the street names it picked
python3 tools/geo/build_levels.py --out tools/geo/ct_districts.generated.js
python3 tools/geo/inject.py --districts tools/geo/ct_districts.generated.js
node tools/geo/export_districts.js                 # keep districts.json in step
```

Districts without a data file keep their authored map, so you can do one town at a time. Districts built from data are flagged `osm:true`
(the campaign screen then shows **Map data (c) OpenStreetMap contributors**; the Guide credit already says so) and lose the "Approximate" chip.
Look at the result in the game: the rasteriser makes reasonable choices, but you can hand-edit any district in `ct_data.js` afterwards (a hand edit is a data edit too).

## Free-form districts (a road graph instead of a block grid)

A district entry with `ff:{...}` is built from its own roads. The format (metres from the district's north-west corner, x east, y south):

```js
ff:{src:'traced'|'osm', m:[widthM,heightM], sc:unitsPerMetre,
    roads:[[name, cls, [[x,y],...], {br:1, straight:1, curve:1}?], ...],   // cls: 'm' motorway, 'a' arterial, 's' street
    water:[polygon,...], parks:[polygon,...],                              // polygons [[x,y],...]
    zones:[['B'|'.', polygon],...],                                        // B = offices and shops, . = woods / unbuilt
    poi:[[letter,x,y,name],...]}                                           // O hospital, U university, K school, A airport, M mall, C arena or venue
```

How the game reads it (`ffGraph`, `ffDeriveMap`, `buildCityFF` in `rush-hour-routes.html`):
* every polyline vertex is a **node**, every segment an **edge** (a bend is a chain of short edges, so buses, riders, closures and traffic work exactly as on the grid); motorways and arterials (and streets flagged `curve`) are smoothed with a Catmull-Rom curve through the traced points;
* roads that share a vertex, or end within about 25 m of another road, or cross each other (motorways pass over) become **junctions**; only the biggest connected piece is kept; the ids are numbered in the data order, so saves stay valid as long as the data does not change;
* water and parks are polygons painted on the ground, water also becomes the animated water mesh, a road over water becomes a bridge deck;
* a coarse 100-unit cell map (`L.map`, the same letters as the grid levels) is **derived** from the polygons and the roads (cells far from every road are empty, cells beside an arterial are shops and offices). Homes, offices and landmarks are scattered over those cells and kept clear of roads, water and parks. Growth (the "pick a flashing circle" choice) only turns empty cells beside an existing road into homes, offices or a park; the road graph itself never changes, and the cinematic grid expansion is switched off for these districts;
* budget: keep a district under about 400 junctions and 700 nodes (ids must stay below 4096). Bridgeport's three districts have 150 to 215 nodes.

### Roads-to-graph step (OSM to `ff:`)

`build_levels.py` does this for every `isFF` district that has a downloaded file (`geo_data/<id>.json`, from `fetch_osm.py`, which already uses the district box `ffm` in metres):

1. `highway` ways become polylines; class `m` = motorway / trunk, `a` = primary / secondary (and long tertiary), `s` = everything else drivable; footways and paths are dropped.
2. Ways are cut where they share an OSM node (so junctions survive), every piece is simplified with Douglas-Peucker (5 m, 7 m for streets), clipped to the box, and side streets are thinned until the district has about `MAX_NODES` (520) vertices; service roads go first.
3. Water polygons, the sea (a coastline piece closed along the box, sea on its right), parks, woods (zone `.`), commercial / industrial land (zone `B`) and landmarks are written in the same units.

```sh
node tools/geo/export_districts.js                       # districts.json knows which districts are free-form (isFF, ffm, ffsc)
python3 tools/geo/fetch_osm.py br-blackrock br-northend br-downtown      # on your own computer
python3 tools/geo/build_levels.py --report br-blackrock --out tools/geo/ct_districts.generated.js
python3 tools/geo/inject.py --districts tools/geo/ct_districts.generated.js
```
Districts without a data file keep their traced `ff:` (written as `FF_TRACED["id"]`). To trace more of the screenshot, edit `trace_bridgeport.py` (pixel coordinates, windows, meshes) and run it, then `inject.py`.
**The traced data is a hand drawing:** the arterials and the motorway follow the picture, the side streets only follow its direction and spacing, street names on side streets are plausible, not located, and the window centres reuse each district's `ll`. Real OSM data replaces all of this.

## How a district is fitted onto the grid

* The district is the box around its centre `ll:[lat,lon]` that is `cols x rows` blocks of `bs` metres (default 150 m). The game's grid keeps its real aspect ratio.
* Every block is sampled 4 x 4 times. Each sample is tested against water polygons, the coastline (the sea is on the right-hand side of an OSM coastline way), parks and
  commercial / industrial / residential land use. Building footprints add density (coverage and average footprint).
* A block becomes `W` water (`G` where a bridge crosses it), `P` park, `B` offices (commercial, industrial or dense large buildings), `H` homes or `.` empty.
* Landmarks go to the block that contains them: `O` hospital, `U` university or college, `K` school, `A` airport, `M` mall, `C` the arena or stadium
  (exactly one `C` is kept: the biggest arena or stadium, otherwise the park block nearest the middle).
* Street names: each named road is classed east-west or north-south by its direction and votes, weighted by its length inside the box, for the nearest grid row line or
  column line. The strongest name of each line is painted on the game's streets (rows north to south, columns west to east). A line with no name stays empty and the
  game paints its generic name there.
* **The streets are grid-fitted to the real layout, not surveyed.** Real roads are not straight or evenly spaced; the game's roads always are (except in the free-form districts above).

## World map positions

Districts are placed in the 3D world by latitude and longitude (equirectangular projection with latitude correction at 41.2 degrees, constant `CT_DATA.proj`).
Districts of one town keep their north-south and west-east order in tidy rows; distances between towns are compressed (`proj.far` world units per metre) and town blocks are
pushed apart where they would overlap. Road corridors (I-95, Merritt Parkway, I-91, I-84, Route 8), rivers, hills and the coast are lists of waypoints in `ct_data.js`.
Adding a town, a state or later the globe means adding data: a town entry, its districts and its corridors.

## Licences

* OpenStreetMap data: (c) OpenStreetMap contributors, Open Database Licence 1.0. Credit **Map data (c) OpenStreetMap contributors** wherever it is used. The downloaded files
  in `geo_data/` are an ODbL database; if you publish the generated maps, keep the credit. https://www.openstreetmap.org/copyright
* Outline: US Census Bureau cartographic boundary files (public domain) via the `us-atlas` package (ISC licence wrapper).


## Real Bridgeport map that grows (REALMAP block)

`world/bake_real.mjs` turns zoom-14 OpenFreeMap tiles into `real_bridgeport.b64` / `.json` (roads graph cut into 500 m sectors, buildings, water, parks, landmarks); `realmap.js` is the game-side module (inflate, graph replay, building conversion, growth, reveal animation, fog painting); `inject_real.py` puts both into `rush-hour-routes.html`. A real-map level is an `ff` district with `real:1` and `rm.steps` (the list of opened sectors); the graph is replayed from the baked data, so growth only appends and saves store just the sector list. See DATA_SOURCES.md section 6.
