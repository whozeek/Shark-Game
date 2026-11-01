# tools/geo: real map data for the Connecticut campaign

The game is a block-grid city. The Connecticut campaign turns each campaign map into a real DISTRICT of a real town, fitted onto that grid.
Today most districts are **approximate**: authored from general geographic knowledge (`approx:true`). These tools replace them with real data.
Nothing here changes the engine: swapping in real data is a data change inside the `CT_DATA` block of `rush-hour-routes.html`.

## Files

| file | what it is |
| --- | --- |
| `ct_data.js` | The source of the `CT_DATA` block: projection constants, towns, road corridors, hills, rivers and the district list (map letters, street names, landmark names, blurbs). Edit this, then run `inject.py`. |
| `districts.json` | The same districts as JSON for the Python tools. Regenerate with `node tools/geo/export_districts.js` after editing `ct_data.js`. |
| `fetch_osm.py` | Downloads OpenStreetMap data for every district bounding box into `geo_data/<id>.json`. **Run this on your own computer** (it needs internet). |
| `build_levels.py` | Rasterises the downloaded files onto the block grid and writes the district entries as JavaScript. |
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
* **The streets are grid-fitted to the real layout, not surveyed.** Real roads are not straight or evenly spaced; the game's roads always are.

## World map positions

Districts are placed in the 3D world by latitude and longitude (equirectangular projection with latitude correction at 41.2 degrees, constant `CT_DATA.proj`).
Districts of one town keep their north-south and west-east order in tidy rows; distances between towns are compressed (`proj.far` world units per metre) and town blocks are
pushed apart where they would overlap. Road corridors (I-95, Merritt Parkway, I-91, I-84, Route 8), rivers, hills and the coast are lists of waypoints in `ct_data.js`.
Adding a town, a state or later the globe means adding data: a town entry, its districts and its corridors.

## Licences

* OpenStreetMap data: (c) OpenStreetMap contributors, Open Database Licence 1.0. Credit **Map data (c) OpenStreetMap contributors** wherever it is used. The downloaded files
  in `geo_data/` are an ODbL database; if you publish the generated maps, keep the credit. https://www.openstreetmap.org/copyright
* Outline: US Census Bureau cartographic boundary files (public domain) via the `us-atlas` package (ISC licence wrapper).
