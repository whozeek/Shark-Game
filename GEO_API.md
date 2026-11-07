# GeoWorld data API (for game code)

`window.GeoWorld` (also `window.__rhr.geo`) is defined by the bundle in `rush-hour-routes.html` (source: `tools/geo/world/*.js`). It exposes the map data of the area **currently loaded** around the player (a 3 by 3 ring of zoom-14 tiles, about 8 km across at 40 N). Data from OpenStreetMap contributors (ODbL), terrain from Mapzen/AWS terrain tiles, see `DATA_SOURCES.md`. Everything is generated and approximate: do not present it as exact.

## Coordinates

Local metres: **x east, y north, z up** (metres above sea level), origin at the lat/lon passed to `GeoWorld.enter()`. Web Mercator scaled by `cos(lat0)`, so a local metre is a ground metre at the origin latitude. three.js position of (x, y, z) is `(x, z, -y)`. `toLocal(lon, lat)` and `toLonLat(x, y)` convert. The origin never moves while you stay in the same explorer session; tiles stream in and out around the player.

## Lifecycle

| call | meaning |
| --- | --- |
| `GeoWorld.open()` | show the globe (returns false if WebGL is missing) |
| `GeoWorld.enter(lat, lon, {name, sample})` | async, resolves `{ok, loaded, status}` once the centre ring is meshed. `sample:true` uses the bundled Bridgeport sample and no network |
| `GeoWorld.dive(lat, lon, name, sample)` | globe camera dive, then `enter`, with the offline fallback card |
| `GeoWorld.whenIdle(ms)` | promise: no tile request or build job pending |
| `GeoWorld.toGlobe()`, `GeoWorld.close()` | leave the world / close the overlay |
| `GeoWorld.status` | `{text, level:'ok'|'warn'|'error', source:'network'|'sample', loaded, pending, failed}` |
| `GeoWorld.player` | `{x, y, z, yaw, mode:'walk'|'drive'|'fly', v}`; `placeOnRoad()`, `setMode(m)`, `teleport(x, y)` |

## Roads: `GeoWorld.roads` -> `{nodes, edges, ways}`

Rebuilt lazily when tiles load or unload, so **ids are not stable across rebuilds**; hold coordinates, not ids, over time.

* `nodes[i] = {id, x, y, z, adj:[edgeId...]}` z is the terrain height (bridge decks interpolate between their ends).
* `edges[i] = {id, a, b, len, cls, name, oneway, bridge, tunnel, lanes, width, way, drivable, walkable}` one segment between two nodes. `oneway`: 1 = from `a` to `b`, -1 = from `b` to `a`, 0 = both. `cls`: motorway, trunk, primary, secondary, tertiary, minor, service, path, track, pier. `lanes` and `width` are **estimates from the class** (OpenMapTiles has no lane data). Dead ends that touch the side of another road within 3.2 m are joined (the tile data has no shared vertex there).
* `ways[i] = {id, cls, name, oneway, bridge, tunnel, ramp, lanes, width, drivable, walkable, nodes:[ids], pts:[[x,y,z]...]}` the polyline of one mapped road piece.
* Names come from the tile's `transportation_name` layer by proximity and can be empty. Rail and ferries are drawn (rail) or ignored (ferry) and are not part of the graph.

## Buildings: `GeoWorld.buildings` (array)

`{id, tile, fp:[[x,y]...] (outer ring, counter-clockwise, no repeated first point), holes:[ring...], height, minHeight, source:'osm'|'procedural', approx:boolean, heightSource:'osm'|'estimated', colour, bbox:[x0,y0,x1,y1], cx, cy, area, baseZ, roofZ}`.

* `height` is metres above local ground (`render_height`; **exactly 5 m is treated as "not mapped"** and replaced by an estimate from footprint area plus a hash). `minHeight` > 0 means the part floats (bridge, overhang): it does not block ground movement.
* `source:'procedural'` / `approx:true` buildings are generated along streets inside residential/commercial/retail/industrial land-use areas where the map has no footprint. They are **not real**.
* `id` is derived from the tile (`<tx>_<ty>_r<n>` real, `_p<n>` procedural). OpenMapTiles carries no OSM ids.
* Very dense tiles keep only their 7,000 largest footprints (3,000 in battery saver); `GeoWorld.status.text` says how many were left out.
* Only buildings within about 650 m (380 m in saver) of the player get a 3D mesh; **all** loaded buildings are in the data and in collisions.

## Queries

`heightAt(x, y)` terrain metres (0 if sea or unknown); `groundAt(x, y)` also stands on bridge decks; `nearbyRoads(x, y, r)` -> `[{edge, dist, t, x, y, z}]` sorted by distance; `nearestRoad(x, y, maxR, filter)`; `nearbyBuildings(x, y, r)`; `pointInBuilding(x, y)`; `raycast2D(x0, y0, x1, y1)` -> first footprint crossed `{building, t, x, y, dist}`; `raycast({x,y,z}, {x,y,z}, maxDist, step)` -> marches terrain and building volumes `{kind, x, y, z, dist, building?}`.

## Collision

`collideCircle(x, y, r)` -> `{x, y, hit}` the position pushed out of every footprint it overlaps (slide response comes from calling it every frame with the moved position); `collideCapsule(ax, ay, bx, by, r)` -> `{dx, dy, hit}` the correction for a capsule. The explorer uses a 0.45 m circle on foot and 1.7 m driving.

## Navigation

`route(from:{x,y}, to:{x,y}, {mode:'drive'|'walk', maxSnap:400})` A* over the graph; snaps both ends to the nearest usable road node; drive respects one-way edges and ignores paths, walk ignores motorways/rail. Returns `{ok, length, nodes, points:[{x,y,z}], from:{node,dist}, to:{node,dist}}` or `{ok:false, reason}`. The explorer can draw a path with `GeoWorld.world.showPath(points)`.

## Bus game bridge

`GeoWorld.toFreeForm(cx, cy, radius=1250)` converts the roads in a square window (`2*radius` metres wide) to the free-form `ff` district format that `ffGraph()` in the game consumes: `{m:[w,h], sc:.6, src:'osm', roads:[[name, 'm'|'a'|'s', [[x,y]...], {br:1}?]], water:[...], parks:[...], zones:[['B', polygon]...], poi:[]}` with x east and y south from the window's north-west corner (the game's convention). Motorway/trunk -> `m`, primary/secondary -> `a`, tertiary/minor -> `s`, service/paths/tunnels dropped. `GeoWorld.startBusGame()` calls it for 1.25 km around the player and starts a **Free Play** level (`LEVELS` slot flagged `geo`, normal cash, never saved as stars, hidden from level lists) through `__rhr.geoStart`. If there are fewer than 6 usable road lines it refuses and says why in the status line.

## Inspection helpers

`GeoWorld.info()` renderer counts (`calls`, `tris`, `geometries`, `textures`), `tilesInfo()`, `net()` (requests, retries, bytes), `places` (named places from the tiles), `globeData` (bundled city list and country lookup).
