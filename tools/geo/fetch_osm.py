#!/usr/bin/env python3
"""Download OpenStreetMap data for each game district (run this on YOUR computer, it needs internet).

  python3 tools/geo/fetch_osm.py                 # every district
  python3 tools/geo/fetch_osm.py br-downtown     # one or more district ids
  python3 tools/geo/fetch_osm.py --list          # show ids and bounding boxes

Writes geo_data/<district id>.json (Overpass JSON: roads with names, water, coastline, parks, land use, buildings,
hospitals, universities, schools, arenas and stadiums, stations, airports, malls).  Standard library only.
Data (c) OpenStreetMap contributors, Open Database Licence (ODbL): keep the credit 'Map data (c) OpenStreetMap contributors'.
Be polite to the public servers: the script waits between requests and retries on busy servers."""
import json, math, os, sys, time, urllib.parse, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'geo_data')
SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter',
           'https://maps.mail.ru/osm/tools/overpass/api/interpreter']
UA = 'RushHourRoutes-geo-tools/1.0 (game level generator; contact: repository owner)'


def bbox(d, pad=0.15):
    """south, west, north, east of a district: centre lat/lon, gridCols x gridRows blocks of bs metres, plus a small margin"""
    lat, lon = d['ll']
    bs = d.get('bs', 150)
    h = d['gridRows'] * bs / 2 * (1 + pad)
    w = d['gridCols'] * bs / 2 * (1 + pad)
    if d.get('ffm'):   # free-form district: the box is given in metres
        w, h = d['ffm'][0] / 2 * (1 + pad), d['ffm'][1] / 2 * (1 + pad)
    dlat = h / 110540.0
    dlon = w / (111320.0 * math.cos(math.radians(lat)))
    return (lat - dlat, lon - dlon, lat + dlat, lon + dlon)


def query(bb):
    s, w, n, e = ['%.6f' % v for v in bb]
    b = '(%s,%s,%s,%s)' % (s, w, n, e)
    return f'''[out:json][timeout:120];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|service|pedestrian)$"]{b};
  way["natural"~"^(water|coastline|bay|wetland|wood)$"]{b};
  relation["natural"="water"]{b};
  way["waterway"~"^(river|canal|stream|riverbank|dock)$"]{b};
  way["landuse"~"^(residential|commercial|retail|industrial|forest|grass|recreation_ground|cemetery|port|railway|reservoir|basin)$"]{b};
  relation["landuse"~"^(residential|commercial|retail|industrial)$"]{b};
  way["leisure"~"^(park|pitch|stadium|golf_course|nature_reserve|garden|marina|playground|sports_centre|track)$"]{b};
  relation["leisure"~"^(park|nature_reserve)$"]{b};
  way["building"]{b};
  nwr["amenity"~"^(hospital|university|college|school|arena|theatre|ferry_terminal|bus_station)$"]{b};
  nwr["building"~"^(hospital|university|stadium|train_station|transportation)$"]{b};
  nwr["leisure"="stadium"]{b};
  nwr["railway"="station"]{b};
  nwr["aeroway"~"^(aerodrome|terminal)$"]{b};
  nwr["shop"="mall"]{b};
);
out geom tags;'''


def post(server, q):
    data = urllib.parse.urlencode({'data': q}).encode()
    req = urllib.request.Request(server, data=data, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=240) as r:
        return json.loads(r.read().decode('utf-8'))


def main():
    ds = json.load(open(os.path.join(HERE, 'districts.json'), encoding='utf-8'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--list' in sys.argv:
        for d in ds:
            print(d['id'], ['%.5f' % v for v in bbox(d)])
        return
    force = '--force' in sys.argv
    todo = [d for d in ds if not args or d['id'] in args]
    os.makedirs(OUT, exist_ok=True)
    for d in todo:
        path = os.path.join(OUT, d['id'] + '.json')
        if os.path.exists(path) and not force:
            print('skip (exists, use --force):', d['id'])
            continue
        q = query(bbox(d))
        for attempt in range(6):
            srv = SERVERS[attempt % len(SERVERS)]
            try:
                print('fetching', d['id'], 'from', srv)
                js = post(srv, q)
                js['_district'] = d['id']
                js['_bbox'] = bbox(d)
                json.dump(js, open(path, 'w', encoding='utf-8'))
                print('  saved', path, len(js.get('elements', [])), 'elements')
                break
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as ex:
                print('  failed:', ex, '- retrying in', 15 * (attempt + 1), 's')
                time.sleep(15 * (attempt + 1))
        else:
            print('GAVE UP on', d['id'])
        time.sleep(8)


if __name__ == '__main__':
    main()
