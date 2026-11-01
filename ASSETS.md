# Assets and data sources

## Connecticut campaign map data

| what | source | licence | real or approximate |
| --- | --- | --- | --- |
| State and county outlines of Connecticut, plus neighbouring counties (Westchester, Rockland, Providence, Washington RI, Hampden, Hampshire, Berkshire, Nassau, Suffolk) drawn on the campaign screen and used for the Connecticut map | US Census Bureau cartographic boundary files (2010s generalised 1:10m) as packaged in the npm package `us-atlas` 3.0.1 (`counties-10m.json`), simplified with `tools/geo/topo_extract.py` to `geo_data/ct_outline.json` | Census data: public domain. us-atlas wrapper: ISC. | **Real** (simplified to about 30 points per county) |
| Town positions (lat/lon of Bridgeport, Norwalk, Stamford, New Haven, Hartford and the "coming soon" towns) | general knowledge of the towns' centres | n/a | approximate (to about 1 km) |
| Highway corridors (I-95, Merritt Parkway / Route 15, I-91, I-84, Route 8), rivers (Housatonic, Connecticut, Naugatuck) and hills (Litchfield Hills, north-east hills, central ridge) in the 3D world and the campaign map | hand-placed waypoints from general knowledge | n/a | **approximate**, drawn as simple curves |
| Districts: land-use letters, street names, landmark names and blurbs of all 16 districts (Bridgeport 8, Norwalk 2, Stamford 2, New Haven 2, Hartford 2) | authored from general geographic knowledge | n/a | **approximate** (`approx:true`): layouts are plausible, street names are real street names of the town placed near their real position, but they are NOT surveyed and some may be misplaced |
| Planned: exact district grids and street names | OpenStreetMap through `tools/geo/fetch_osm.py` and `build_levels.py` | ODbL 1.0, credit "Map data (c) OpenStreetMap contributors" | not yet used (the data hosts were not reachable from the build environment). No OSM-derived data is in the game today. |

Sources that were tried and not reachable from the build container: OpenStreetMap Overpass, Nominatim, Geofabrik, the Census website.

Credits in the game: the Guide tab "Connecticut and credits" and the footer of the Campaign screen.

This file covers only the Connecticut map data.
