# Data sources of the world explorer

Checked 2026-11-07 from the build container. For each source: what I could read **from the primary host**, what I could only read through a secondary page, and what I could not reach. Licence text can change, so re-check before a public release.

> **Verification limits of this container.** `openfreemap.org`, `osmfoundation.org` and `openstreetmap.org` did **not resolve** from the build sandbox (their hostnames are outside its network allow-list). The OpenFreeMap **tile host** (`tiles.openfreemap.org`), the AWS elevation host, `raw.githubusercontent.com`, `github.com` and npm were reachable. So the OpenFreeMap terms and the OSM attribution guideline below come from the OpenFreeMap TileJSON (primary, machine readable), the lead's briefing and a web search that quoted the official pages; they are marked *(secondary)*. Everything marked *(primary)* was read or measured directly.

| Source | Used for | Licence | Attribution the game shows |
| --- | --- | --- | --- |
| OpenStreetMap data via OpenFreeMap vector tiles | roads, buildings, water, parks, land use, place names | ODbL 1.0 (data); OpenMapTiles schema; OpenFreeMap code MIT | "© OpenStreetMap contributors (ODbL)", "OpenFreeMap © OpenMapTiles" |
| Mapzen / Tilezen Terrain Tiles on AWS Open Data | terrain height | public-domain inputs (SRTM, 3DEP, GMTED2010, ETOPO1 and others), attribution requested | "Terrain: Mapzen / AWS Terrain Tiles (SRTM, 3DEP, GMTED, ETOPO1)" |
| Natural Earth 1:50m (via `world-atlas` 2.0.2 and `nvkelso/natural-earth-vector`) | globe: countries, coast, populated places | public domain (Natural Earth); `world-atlas` ISC | "Natural Earth (public domain)" |
| `pbf`, `@mapbox/vector-tile` | decoding vector tiles | BSD-3-Clause | listed in the Credits panel |
| `topojson-client` | globe geometry | ISC | listed in the Credits panel |
| three.js | rendering | MIT | already credited |

Not used, on purpose: Google Maps / Google Earth (forbidden by the brief), OSM tile servers (`tile.openstreetmap.org`, policy forbids app-backend use), the public Overpass API (manual says app backends should use extracts; rate limits, 429s), Open-Meteo elevation (CC BY 4.0 but free only for non-commercial use and rate limited), anything needing an account, key or billing.

---

## 1. OpenStreetMap data (ODbL)

* **Licence:** Open Database Licence 1.0, <https://opendatacommons.org/licenses/odbl/1-0/>. Copyright and licence page: <https://www.openstreetmap.org/copyright> *(secondary, not reachable from the sandbox)*.
* **Attribution:** OSMF attribution guideline (June 2021): public use needs visible credit naming OpenStreetMap and making clear the data is under the ODbL, linked to <https://www.openstreetmap.org/copyright>; "© OpenStreetMap contributors" is accepted *(secondary)*. The game shows `© OpenStreetMap contributors (ODbL)` linked to that page in a strip that is always visible in the globe and in the world, plus the full notice in the Credits panel.
* **Share-alike:** the ODbL applies to a *derived database* if you publish one. The game reads tiles at run time and keeps nothing; the only OSM-derived thing shipped is the tiny Bridgeport sample (9 tiles reduced to 4, about 290 KB deflated), which is a "produced work"/database extract and always shows the same notice. If anyone later ships baked data (for example a pre-converted city), that database must be offered under the ODbL and keep the attribution.
* **Coverage and limits:** global, but uneven. Measured on 2026-11-07 (see section 5): Bridgeport CT and Paris have thousands of footprints per tile, mapped heights exist for only a small fraction. Many buildings carry no height; OpenMapTiles fills `render_height` with 5 m in that case, so the game treats exactly 5 m as "unknown" and estimates a height.
* **Offline:** none of this works offline except the bundled sample.

## 2. OpenFreeMap vector tiles

* **What:** public instance at <https://tiles.openfreemap.org/planet> (TileJSON), tiles at `https://tiles.openfreemap.org/planet/<version>/{z}/{x}/{y}.pbf`. TileJSON read live on 2026-11-07 *(primary)*: version `3.16.0`, `minzoom 0`, `maxzoom 14`, tile path `20261101_080013_pt`, bounds the whole Web Mercator world, and this attribution string: `OpenFreeMap © OpenMapTiles Data from OpenStreetMap` (with links to openfreemap.org, openmaptiles.org and openstreetmap.org/copyright).
* **The versioned path changes with every planet build** (and old builds disappear), so the game always fetches the TileJSON first (once per session) and takes the tile URL from it.
* **Layers** (TileJSON, *primary*): aerodrome_label, aeroway, boundary, **building (z13-14)**, housenumber, landcover, landuse, mountain_peak, park, place, poi, **transportation (z4-14)**, transportation_name, water, water_name, waterway. Building fields: `render_height`, `render_min_height`, `colour`, `hide_3d`. Transportation fields include `class`, `subclass`, `brunnel`, `oneway`, `ramp`, `layer`, `surface`. There is no lane count and no OSM id in the tiles.
* **CORS** *(primary, curl with an Origin header)*: `access-control-allow-origin: *` on both the TileJSON and the `.pbf` tiles, `cache-control: max-age=315360000` on tiles (3600 on the TileJSON). So browsers can fetch directly; no proxy needed.
* **Terms** *(secondary: official site as quoted by search)*: free, no key, no registration, no cookies; commercial use allowed; attribution required ("OpenFreeMap © OpenMapTiles Data from OpenStreetMap"; the "OpenFreeMap" part is optional, OpenMapTiles and OpenStreetMap are not); funded by donations; no SLA. The lead's briefing says "no limits advertised"; I could not confirm the wording on the official page from here, so the game does **not** rely on it: it requests at most 6 tiles at a time, only the 3x3 ring around the player, honours Retry-After, backs off on 429/5xx, and never prefetches.
* **Size measured:** z14 tiles are 6 KB (empty mountain) to 690 KB (central New York); Bridgeport 75-210 KB, Paris 514 KB, Nairobi 271 KB. A 3x3 area at Bridgeport transferred 1.37 MB of vector tiles (9 tiles) plus 0.53 MB of terrain (4 PNGs) = **about 1.9 MB per area**, uncompressed on the wire as the test harness saw it (real browsers get gzip/brotli from Cloudflare where applicable, and the HTTP cache keeps tiles for years).
* **Offline:** fails; the game shows the status line "Could not load map tiles..." and offers the bundled sample.

## 3. Terrain: Mapzen / Tilezen Terrain Tiles on AWS Open Data

* **What:** `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png`, 256x256 PNG, elevation in metres = `R*256 + G + B/256 - 32768`. Registry page: <https://registry.opendata.aws/terrain-tiles/>. The game uses zoom 12 (about 29 m per sample at 41 N, 35 m at the equator), the tile and its neighbours for smooth edges, bilinear sampling.
* **Sources and attribution** *(primary: Tilezen joerd `docs/attribution.md`, read 2026-11-07)*: SRTM: "SRTM data courtesy of the U.S. Geological Survey"; 3DEP: "3DEP data courtesy of the U.S. Geological Survey"; GMTED2010: "GMTED2010 data courtesy of the U.S. Geological Survey"; ETOPO1: "Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration" (use limitation: not to be used for navigation); plus regional datasets with their own credits (Australia CC BY 4.0, Austria CC BY 3.0 AT, Canada OGL, EU-DEM/Copernicus, Mexico INEGI, New Zealand CC BY 3.0 NZ, Norway CC BY 4.0, UK OGL v3, ArcticDEM). USGS/NOAA products are public domain; USGS asks for credit when published. The game's strip says "Terrain: Mapzen / AWS Terrain Tiles (SRTM, 3DEP, GMTED, ETOPO1)" and the Credits panel names USGS/NOAA and says "regional sources". If you ship in a region with its own required credit (for example Norway), add it.
* **CORS** *(primary)*: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET`. Tile responses carry `x-amz-meta-x-imagery-sources` (for example `srtm/N40W074.tif, gmted/..., etopo1/ETOPO1_Bed_g.tif` for Bridgeport), which shows which datasets fed a tile.
* **Limits:** a public S3 bucket without published rate limits; I assume fair use. No key, no cost to us; AWS pays for the open data programme.
* **Quality:** about 30 m, SRTM-derived: smooth, no building/tree heights, sea-floor depths below zero (the game clamps to 0 so water stays flat). Everest tile test: summit 8727 m (true 8849 m) because of the 29 m smoothing.
* **Offline:** fails; terrain falls back to flat ground with a note in the status line. The bundled sample ships a 128x128 downsampled copy of the 4 Bridgeport terrain tiles.

## 4. Natural Earth (globe)

* **Licence:** public domain. `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/LICENSE.md` *(primary, read)*: "All versions of Natural Earth raster + vector map data ... are in the public domain ... No permission is needed to use Natural Earth. Crediting the authors is unnecessary." The game credits it anyway.
* **Data used:** countries from the npm package `world-atlas` 2.0.2 (`countries-50m.json`, Natural Earth 1:50m admin-0, repackaged under ISC), simplified with `topojson-simplify` to 12% of arc points and re-quantised (153 KB); populated places from `ne_50m_populated_places_simple.geojson`: the 1,251 largest by `pop_max` plus all national capitals (38 KB). Built with `tools/geo/world/mkglobe.mjs`.
* **Disputed borders:** Natural Earth draws boundaries "de facto". The globe says so in the strip ("Borders: Natural Earth de facto lines, not a statement on disputed territory") and the Credits panel repeats it.
* **Offline:** fully bundled, works offline. City populations are `pop_max` (agglomeration estimates), which is why "Bridgeport" shows 1.0 million (the metro area).

## 5. What I measured about OpenFreeMap building completeness (2026-11-07)

Decoded z14 tiles with `@mapbox/vector-tile`. A building *feature* in these tiles is a multipolygon that groups every footprint with the same `render_height` (one tile had a single feature with 4,966 rings), so count rings, not features.

| Tile | Footprints (polygons) | Notes |
| --- | --- | --- |
| Bridgeport 4860/6131 area, 9-tile ring | 28,207 footprints, **27,881 OSM + 326 generated** | only 42 had mapped heights (everything else 5 m default or estimated) |
| Paris centre | 103 features, thousands of rings | |
| Nairobi | 203 features | |
| Himalaya (Everest) | 0 buildings, 2 path ways | wilderness: terrain only |

Where footprints exist the game uses them; heights are mostly estimated from footprint area and a hash; procedural buildings are only added inside residential/commercial/retail/industrial land-use polygons, along streets, never over a real footprint, a road, water or a park. In dense mapped areas (Bridgeport) only 1% of buildings are generated.

## 6. Other sources considered

* **Microsoft Global ML Building Footprints** (ODbL) and **Google Open Buildings** (CC BY 4.0 / ODbL for the v3 dataset): licences allow use but the data are huge, need a backend or baking, and ODbL share-alike would attach to a baked derived database. Not used; documented only.
* **Copernicus GLO-30 DEM** (free with attribution, ESA licence): better than terrarium at 30 m global, but only distributed as GeoTIFF on AWS (`copernicus-dem-30m`), not as web tiles; would need a baking step. Not used.
* **Open-Meteo elevation API** (CC BY 4.0): free for non-commercial use only, rate limited. Not used.
* **OSM tile servers / Overpass:** see the top of this file. Not used.

## Network etiquette implemented

No keys, no cookies (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`), at most 6 requests in flight, 3x3 tiles around the player only (nothing prefetched beyond that), unloads tiles outside the ring, aborts every request when you leave the explorer, honours `Retry-After`, exponential back-off with jitter on 429/5xx/network errors (3 retries), one TileJSON request per session, 30-tile byte LRU and the browser HTTP cache (tiles are served with `max-age` of 10 years).

## What the game sends

Your browser contacts `tiles.openfreemap.org` and `elevation-tiles-prod.s3.amazonaws.com` directly. They see your IP address, your browser's user agent and which tiles you request (which reveals roughly where you are looking). No account, no cookie, no other data. If that is not acceptable for a given deployment, remove the explorer or host a mirror.

## Re-baking the bundled sample and the globe

```
cd tools/geo/world && npm install
# globe (needs ne_50m_populated_places_simple.geojson in the working directory)
node mkglobe.mjs 0.12
# Bridgeport sample: download 4 z14 tiles and the z12 terrain tiles around 41.1865,-73.1952, then
python3 bake_elev.py <dir> && node bake_sample.mjs <dir> 2
node build.mjs          # bundles everything into rush-hour-routes.html
```
