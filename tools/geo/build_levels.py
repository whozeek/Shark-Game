#!/usr/bin/env python3
"""Turn downloaded OpenStreetMap files (geo_data/<id>.json from fetch_osm.py) into game-ready district entries.

  python3 tools/geo/build_levels.py                      # all districts that have a data file; the others keep their authored (approximate) map
  python3 tools/geo/build_levels.py br-downtown --report # one district, and print the grid and the chosen street names
  python3 tools/geo/build_levels.py --out tools/geo/ct_districts.generated.js
  python3 tools/geo/inject.py --districts tools/geo/ct_districts.generated.js   # put the result into the game (and ct_data.js)

How a district is fitted onto the block grid (the game itself stays a rectangular block grid):
  * the district is the bounding box around its centre lat/lon: gridCols x gridRows blocks of `bs` metres (default 150 m);
  * every block is sampled 4 x 4 times; each sample is tested against water polygons, the coastline (sea lies to the right of an
    OSM coastline way), parks, and commercial / industrial / residential land use; building footprints add density;
  * a block becomes W (water, G where a bridge crosses it), P (park), B (commercial, industrial or dense large buildings),
    H (residential or built-up) or . (empty);
  * landmarks go to the block that contains them: O hospital, U university or college, K school, A airport, M mall,
    C arena or stadium (exactly one C is kept: the biggest arena/stadium, else the park block nearest the centre);
  * street names: every named road is classed east-west or north-south by its direction, and votes (weighted by its length inside the
    box) for the nearest grid row line or column line; the best name of each line is painted on the game's row / column.
Standard library only.  Data (c) OpenStreetMap contributors (ODbL): districts built from it are flagged osm:true and the game shows the credit."""
import json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
GEO = os.path.join(ROOT, 'geo_data')
CLASS_W = {'motorway': .3, 'trunk': .6, 'primary': 1.4, 'secondary': 1.3, 'tertiary': 1.15, 'residential': 1, 'unclassified': .9, 'living_street': .8, 'pedestrian': .5, 'service': .15}
ABBR = [(r'\bStreet\b', 'St'), (r'\bAvenue\b', 'Ave'), (r'\bBoulevard\b', 'Blvd'), (r'\bRoad\b', 'Rd'), (r'\bDrive\b', 'Dr'), (r'\bParkway\b', 'Pkwy'),
        (r'\bTurnpike\b', 'Tpke'), (r'\bLane\b', 'Ln'), (r'\bPlace\b', 'Pl'), (r'\bTerrace\b', 'Terr'), (r'\bCourt\b', 'Ct'), (r'\bHighway\b', 'Hwy'),
        (r'\bNorth\b', 'N'), (r'\bSouth\b', 'S'), (r'\bEast\b', 'E'), (r'\bWest\b', 'W')]


def abbr(n):
    for a, b in ABBR:
        n = re.sub(a, b, n)
    return n


class Frame:
    """local metres: x east, y south, origin at the north-west corner of the district's grid"""
    def __init__(s, d):
        s.lat0, s.lon0 = d['ll']
        s.bs = d.get('bs', 150)
        s.cols, s.rows = d['gridCols'], d['gridRows']
        s.cl = math.cos(math.radians(s.lat0))
        s.W, s.H = s.cols * s.bs, s.rows * s.bs

    def xy(s, lat, lon):
        return ((lon - s.lon0) * 111320.0 * s.cl + s.W / 2, (s.lat0 - lat) * 110540.0 + s.H / 2)


def pip(x, y, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def area(poly):
    a = 0.0
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % len(poly)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def geom(F, g):
    return [F.xy(p['lat'], p['lon']) for p in g]


def rings_of(F, el):
    """closed rings of a way or the outer members of a relation (open outer pieces are chained by their end points)"""
    out = []
    if el['type'] == 'way' and el.get('geometry'):
        pts = geom(F, el['geometry'])
        if len(pts) > 3 and el['geometry'][0] == el['geometry'][-1]:
            out.append(pts)
    elif el['type'] == 'relation':
        pieces = [geom(F, m['geometry']) for m in el.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
        for _ in range(len(pieces) + 1):
            merged = False
            for i in range(len(pieces)):
                for j in range(len(pieces)):
                    if i != j and pieces[i] and pieces[j] and pieces[i][-1] == pieces[j][0]:
                        pieces[i] = pieces[i] + pieces[j][1:]
                        pieces[j] = []
                        merged = True
            if not merged:
                break
        out = [p for p in pieces if len(p) > 3 and p[0] == p[-1]]
    return out


def center_of(F, el):
    if 'center' in el:
        return F.xy(el['center']['lat'], el['center']['lon'])
    if 'lat' in el:
        return F.xy(el['lat'], el['lon'])
    if el.get('geometry'):
        pts = geom(F, el['geometry'])
    else:
        pts = [q for m in el.get('members', []) if m.get('geometry') for q in geom(F, m['geometry'])]
    if not pts:
        return None
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def size_of(F, el):
    rs = rings_of(F, el)
    return max([area(r) for r in rs] or [1.0])


def build(d, data, report=False):
    F = Frame(d)
    els = data.get('elements', [])
    water, parks, com, ind, res, coast, bridges, builds = [], [], [], [], [], [], [], []
    lm = {}
    named = []  # (name, class weight, points)

    def best(letter, el, name=None):
        c = center_of(F, el)
        if not c or not (0 <= c[0] < F.W and 0 <= c[1] < F.H):
            return
        a = size_of(F, el)
        if letter not in lm or a > lm[letter][0]:
            lm[letter] = (a, c, name)
    for el in els:
        t = el.get('tags') or {}
        if el['type'] == 'way' and el.get('geometry'):
            pts = geom(F, el['geometry'])
        else:
            pts = None
        if 'highway' in t and pts:
            if t.get('bridge') in ('yes', 'viaduct', 'movable') and t['highway'] not in ('service',):
                bridges.append(pts)
            if t.get('name') and t['highway'] in CLASS_W:
                named.append((t['name'], CLASS_W[t['highway']], pts))
            continue
        if t.get('natural') == 'coastline' and pts:
            coast.append(pts)
            continue
        if t.get('natural') in ('water', 'bay', 'wetland') or t.get('landuse') in ('reservoir', 'basin') or t.get('waterway') in ('riverbank', 'dock'):
            water.extend(rings_of(F, el))
            continue
        if t.get('waterway') in ('river', 'canal', 'stream') and pts and t.get('waterway') != 'stream':
            continue  # a thin line river does not fill a block
        if t.get('leisure') in ('park', 'pitch', 'golf_course', 'nature_reserve', 'garden', 'playground', 'track', 'stadium') or t.get('landuse') in ('grass', 'recreation_ground', 'forest', 'cemetery'):
            if t.get('leisure') != 'stadium':
                parks.extend(rings_of(F, el))
        lu = t.get('landuse')
        if lu in ('commercial', 'retail'):
            com.extend(rings_of(F, el))
        elif lu in ('industrial', 'port', 'railway'):
            ind.extend(rings_of(F, el))
        elif lu == 'residential':
            res.extend(rings_of(F, el))
        if 'building' in t and pts and len(pts) > 3:
            c = center_of(F, el)
            if c:
                builds.append((c[0], c[1], area(pts), t.get('building')))
        am, lei, bd = t.get('amenity'), t.get('leisure'), t.get('building')
        nm = t.get('name')
        if am == 'hospital' or bd == 'hospital':
            best('O', el, nm)
        elif am in ('university', 'college') or bd == 'university':
            best('U', el, nm)
        elif am == 'school':
            best('K', el, nm)
        elif am == 'arena' or lei == 'stadium' or bd == 'stadium':
            best('C', el, nm)
        elif t.get('aeroway') in ('aerodrome', 'terminal'):
            best('A', el, nm)
        elif t.get('shop') == 'mall':
            best('M', el, nm)

    # coastline segments for the "sea is on the right" test
    csegs = []
    for pts in coast:
        for i in range(len(pts) - 1):
            csegs.append((pts[i], pts[i + 1]))

    def sea(x, y):
        if not csegs:
            return False
        bd, bs_ = 1e18, None
        for a, b in csegs:
            dx, dy = b[0] - a[0], b[1] - a[1]
            l2 = dx * dx + dy * dy or 1e-9
            t = max(0, min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2))
            px, py = a[0] + dx * t, a[1] + dy * t
            dd = (px - x) ** 2 + (py - y) ** 2
            if dd < bd:
                bd, bs_ = dd, (a, b)
        a, b = bs_
        cross = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])
        # y points down (south) here, which mirrors the usual map orientation: right of the way in OSM terms is cross < 0 in this frame
        return cross > 0

    def bbox_of(poly):
        xs = [p[0] for p in poly]
        ys = [p[1] for p in poly]
        return (min(xs), min(ys), max(xs), max(ys))
    prep = lambda L: [(bbox_of(p), p) for p in L]
    Pw, Pp, Pc, Pi, Pr = prep(water), prep(parks), prep(com), prep(ind), prep(res)

    def hit(P, x, y):
        for bb, poly in P:
            if bb[0] <= x <= bb[2] and bb[1] <= y <= bb[3] and pip(x, y, poly):
                return True
        return False

    N = 4
    grid = []
    for r in range(F.rows):
        row = ''
        for c in range(F.cols):
            n = fw = fp = fc = fi = fr = 0
            for sy in range(N):
                for sx in range(N):
                    x = (c + (sx + .5) / N) * F.bs
                    y = (r + (sy + .5) / N) * F.bs
                    n += 1
                    if hit(Pw, x, y) or sea(x, y):
                        fw += 1
                        continue
                    if hit(Pp, x, y):
                        fp += 1
                    elif hit(Pc, x, y):
                        fc += 1
                    elif hit(Pi, x, y):
                        fi += 1
                    elif hit(Pr, x, y):
                        fr += 1
            x0, y0, x1, y1 = c * F.bs, r * F.bs, (c + 1) * F.bs, (r + 1) * F.bs
            cov = 0.0
            cnt = 0
            for bx, by, ba, _ in builds:
                if x0 <= bx < x1 and y0 <= by < y1:
                    cov += ba
                    cnt += 1
            cov /= F.bs * F.bs
            avg = (cov * F.bs * F.bs / cnt) if cnt else 0
            if fw / n >= .5:
                ch = 'W'
                for br in bridges:
                    if any(x0 <= p[0] < x1 and y0 <= p[1] < y1 for p in br):
                        ch = 'G'
                        break
            elif fp / n >= .45:
                ch = 'P'
            elif (fc + fi) / n >= .4 or (cov > .28 and avg > 350):
                ch = 'B'
            elif fr / n >= .3 or cov >= .06 or (fc + fi + fr) / n >= .3:
                ch = 'H'
            else:
                ch = '.'
            row += ch
        grid.append(list(row))

    # landmarks onto the blocks that contain them
    names = {}
    for letter in ('O', 'U', 'K', 'A', 'M', 'C'):
        if letter in lm:
            a, (x, y), nm = lm[letter]
            c, r = min(F.cols - 1, max(0, int(x // F.bs))), min(F.rows - 1, max(0, int(y // F.bs)))
            if grid[r][c] in 'WG':
                continue
            grid[r][c] = letter
            if nm:
                names[letter] = nm
    flat = [(r, c) for r in range(F.rows) for c in range(F.cols) if grid[r][c] == 'C']
    if not flat:  # no arena or stadium found: the park block nearest the centre becomes the venue
        cands = [(abs(c - F.cols / 2) + abs(r - F.rows / 2), r, c) for r in range(F.rows) for c in range(F.cols) if grid[r][c] == 'P'] or \
                [(abs(c - F.cols / 2) + abs(r - F.rows / 2), r, c) for r in range(F.rows) for c in range(F.cols) if grid[r][c] in 'H.']
        if cands:
            _, r, c = min(cands)
            grid[r][c] = 'C'
    elif len(flat) > 1:
        for r, c in flat[1:]:
            grid[r][c] = 'P'

    # street names: vote for the nearest row line (east-west roads) or column line (north-south roads)
    rv = [dict() for _ in range(F.rows + 1)]
    cv = [dict() for _ in range(F.cols + 1)]
    for name, w, pts in named:
        dx = sum(abs(pts[i + 1][0] - pts[i][0]) for i in range(len(pts) - 1))
        dy = sum(abs(pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))
        ew = dx >= dy
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]
            mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
            if not (0 <= mx <= F.W and 0 <= my <= F.H):
                continue
            ln = math.hypot(b[0] - a[0], b[1] - a[1])
            if ew:
                k = int(round(my / F.bs))
                off = abs(my - k * F.bs) / F.bs
                rv[k][name] = rv[k].get(name, 0) + ln * w * (1 - min(.9, off))
            else:
                k = int(round(mx / F.bs))
                off = abs(mx - k * F.bs) / F.bs
                cv[k][name] = cv[k].get(name, 0) + ln * w * (1 - min(.9, off))

    def pick(votes):
        used = {}
        out = [''] * len(votes)
        order = sorted(range(len(votes)), key=lambda i: -max(votes[i].values() or [0]))
        for i in order:
            for nm, sc in sorted(votes[i].items(), key=lambda kv: -kv[1]):
                if used.get(nm, 0) < 1 or sc > 2.5 * F.bs:  # a long avenue may serve two lines, only if it is strong
                    out[i] = abbr(nm)
                    used[nm] = used.get(nm, 0) + 1
                    break
        return out
    rowNames, colNames = pick(rv), pick(cv)
    mp = [''.join(r) for r in grid]
    if report:
        print('\n'.join(mp))
        print('rows', rowNames)
        print('cols', colNames)
        print('landmarks', names)
    e = {k: v for k, v in d.items() if k not in ('gridCols', 'gridRows', 'rowNames', 'colNames', 'map', 'lm')}
    e.update({'approx': False, 'osm': True, 'map': mp, 'rows': rowNames, 'cols': colNames, 'lm': names})
    return e


def keep_authored(d):
    e = {k: v for k, v in d.items() if k not in ('gridCols', 'gridRows', 'rowNames', 'colNames')}
    e['rows'], e['cols'] = d['rowNames'], d['colNames']
    return e


def js_entry(e):
    keys = ['id', 'town', 'name', 'll', 'bs', 'region', 'theme', 'approx', 'osm', 'chips', 'blurb', 'intro', 'outro', 'map', 'rows', 'cols', 'lm']
    parts = []
    for k in keys + [k for k in e if k not in keys]:
        if k in e:
            parts.append(json.dumps(k) + ':' + json.dumps(e[k], ensure_ascii=False))
    return '  {' + ',\n   '.join(parts) + '}'


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    ds = json.load(open(os.path.join(HERE, 'districts.json'), encoding='utf-8'))
    out_path = None
    if '--out' in sys.argv:
        out_path = sys.argv[sys.argv.index('--out') + 1]
        args = [a for a in args if a != out_path]
    geo_dir = GEO
    if '--geo' in sys.argv:
        geo_dir = sys.argv[sys.argv.index('--geo') + 1]
        args = [a for a in args if a != geo_dir]
    res, nreal = [], 0
    for d in ds:
        if args and d['id'] not in args:
            res.append(keep_authored(d))
            continue
        p = os.path.join(geo_dir, d['id'] + '.json')
        if os.path.exists(p):
            res.append(build(d, json.load(open(p, encoding='utf-8')), '--report' in sys.argv))
            nreal += 1
            print('built from data:', d['id'])
        else:
            res.append(keep_authored(d))
            print('no data file, keeping the approximate authored map:', d['id'])
    text = 'districts:[\n' + ',\n'.join(js_entry(e) for e in res) + '\n ]'
    if out_path:
        open(out_path, 'w', encoding='utf-8').write(text + '\n')
        print('wrote', out_path, '(', nreal, 'districts from real data )')
    else:
        print(text)


if __name__ == '__main__':
    main()
