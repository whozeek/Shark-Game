#!/usr/bin/env python3
"""Writes a SYNTHETIC Overpass-style file (tools/geo/sample/br-blackrock.json) so you can test build_levels.py without downloading anything:

  python3 tools/geo/make_sample.py
  python3 tools/geo/build_levels.py br-blackrock --geo tools/geo/sample --report

The features are invented (a coastline, a harbour, a park, two main streets, a commercial block, a hospital and a grid of houses). It is test data only and is never used by the game."""
import json, math, os
HERE = os.path.dirname(os.path.abspath(__file__))
ds = {d['id']: d for d in json.load(open(os.path.join(HERE, 'districts.json'), encoding='utf-8'))}
d = ds['br-blackrock']
lat0, lon0 = d['ll']
bs, cols, rows = d['bs'], d['gridCols'], d['gridRows']
W, H = cols * bs, rows * bs
cl = math.cos(math.radians(lat0))


def ll(x, y):
    return {'lat': lat0 - (y - H / 2) / 110540.0, 'lon': lon0 + (x - W / 2) / (111320.0 * cl)}


els, i = [], 1
def way(pts, tags):
    global i
    els.append({'type': 'way', 'id': i, 'tags': tags, 'geometry': [ll(*p) for p in pts]}); i += 1
def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]

way([(-50, 6.2 * bs), (W + 50, 6.2 * bs)], {'natural': 'coastline'})                      # sea to the south (right of an east-going way)
way(rect(9.1 * bs, 1.2 * bs, W + 60, 5.0 * bs), {'natural': 'water'})                      # a harbour in the east
way(rect(8 * bs, -20, 10.2 * bs, 2.3 * bs), {'leisure': 'park', 'name': 'Sample Park'})
way(rect(2.6 * bs, 1.2 * bs, 5.1 * bs, 3.2 * bs), {'landuse': 'commercial'})
way(rect(0, 0, W, 6 * bs), {'landuse': 'residential'})
for name, a, b in [('Fairfield Avenue', (0, 3 * bs), (W, 3 * bs)), ('Brewster Street', (0, 4 * bs + 12), (W, 4 * bs + 12)), ('Grovers Avenue', (0, 2 * bs), (W, 2 * bs))]:
    way([a, b], {'highway': 'secondary' if 'Fairfield' in name else 'residential', 'name': name})
for name, x in [('Black Rock Turnpike', 3 * bs), ('Hollister Avenue', 1 * bs), ('Ellsworth Avenue', 5 * bs + 20)]:
    way([(x, 0), (x, H)], {'highway': 'primary' if 'Turnpike' in name else 'residential', 'name': name})
for gx in range(0, int(W), 45):
    for gy in range(0, int(6 * bs), 45):
        if gx > 9.1 * bs and 1.2 * bs < gy < 5 * bs:
            continue
        way(rect(gx + 8, gy + 8, gx + 30, gy + 30), {'building': 'house'})
way(rect(3.1 * bs, 1.4 * bs, 3.9 * bs, 1.9 * bs), {'building': 'hospital', 'amenity': 'hospital', 'name': 'Sample Hospital'})
way(rect(10 * bs, 2.5 * bs + 600, 10.6 * bs, 2.9 * bs + 600), {'leisure': 'stadium', 'name': 'Sample Field'})
os.makedirs(os.path.join(HERE, 'sample'), exist_ok=True)
json.dump({'elements': els, '_note': 'SYNTHETIC test data, not OpenStreetMap'}, open(os.path.join(HERE, 'sample', 'br-blackrock.json'), 'w'))
print('wrote sample with', len(els), 'elements')
