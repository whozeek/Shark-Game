#!/usr/bin/env python3
"""Bridgeport road network hand-traced from a satellite screenshot (Apple Maps, Bridgeport and Fairfield, CT) into free-form district data.

  python3 tools/geo/trace_bridgeport.py            # rewrite the FF_TRACED block of tools/geo/ct_data.js, then run inject.py
  python3 tools/geo/trace_bridgeport.py --overlay out.json   # also dump the traced roads (screenshot pixels) for drawing over the picture

THIS IS APPROXIMATE DATA, TRACED FROM A PICTURE, NOT SURVEYED. Where it differs from the real map, the real map is right.
 * Coordinates below are DISPLAY pixels of the screenshot (921 x 2000). One pixel is taken as PX_M metres (calibrated on Bridgeport downtown to Fairfield, about 7.5 km).
 * Motorways, arterials and the bends of the main streets were followed by eye. The dense side-street meshes are NOT street by street: the screenshot only gave the direction and
   spacing of the blocks, so mesh() lays parallel streets (with jitter and gaps) at that direction inside each traced area, with real Bridgeport street names dealt out in turn.
 * Street names on the arterials follow the screenshot and general knowledge; the side-street names are only plausible, not located.
When tools/geo/fetch_osm.py + build_levels.py have real data for a district, that data replaces the traced `ff:` of the district (same format).

Output format (metres from the north-west corner of the window, x east, y south), one object per district:
  {src:'traced', m:[W,H], sc:units per metre, roads:[[name,cls,[[x,y]..],{br,straight}?]..], water:[poly..], parks:[poly..], zones:[['B'|'.',poly]..], poi:[[letter,x,y,name]..]}
cls: m motorway, a arterial, s street."""
import json, math, os, random, re, sys

PX_M = 7.3
HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- roads (screenshot pixels)
I95 = [(0, 1685), (60, 1670), (125, 1650), (180, 1620), (215, 1582), (240, 1520), (262, 1470), (285, 1425), (330, 1386), (390, 1358), (450, 1326), (486, 1322),
       (510, 1328), (554, 1344), (572, 1347), (610, 1350), (700, 1352), (743, 1340), (814, 1300), (850, 1278), (886, 1264), (921, 1235)]
ROADS = [
    ('I-95', 'm', I95),
    ('Route 8', 'm', [(888, 0), (890, 150), (880, 350), (872, 600), (868, 760), (852, 900), (857, 1000), (858, 1050), (848, 1110), (838, 1160), (828, 1200), (832, 1230), (850, 1252), (886, 1264)]),
    ('Merritt Pkwy', 'm', [(0, 600), (50, 590), (75, 540), (120, 480), (170, 420), (230, 370), (290, 340), (370, 310), (450, 300), (530, 298), (600, 300), (680, 282), (760, 262), (830, 252), (921, 240)]),
    ('Main St', 'a', [(530, 298), (540, 380), (552, 445), (558, 470), (605, 540), (640, 610), (680, 690), (715, 750), (755, 825), (795, 900), (822, 960), (838, 1002), (857, 1036), (885, 1070), (903, 1093), (921, 1118)]),
    ('Park Ave', 'a', [(330, 560), (380, 615), (420, 660), (440, 690), (458, 722), (480, 755), (520, 830), (570, 910), (610, 975), (636, 1000), (671, 1054), (695, 1086), (725, 1125), (750, 1157), (779, 1196), (793, 1221), (800, 1238)]),
    ('North Ave', 'a', [(470, 1206), (500, 1192), (545, 1170), (590, 1158), (625, 1148), (660, 1112), (689, 1071), (720, 1035), (750, 1000), (790, 955), (830, 915)]),
    ('Black Rock Tpke', 'a', [(95, 1085), (170, 1130), (260, 1165), (330, 1180), (382, 1190), (440, 1200), (470, 1206)]),
    ('Black Rock Tpke', 'a', [(470, 1206), (438, 1230), (426, 1250), (416, 1290), (406, 1310), (382, 1338), (350, 1366), (330, 1386)]),
    ('Fairfield Ave', 'a', [(921, 1190), (896, 1203), (832, 1228), (800, 1238), (711, 1268), (678, 1286), (634, 1308), (600, 1322), (560, 1332), (530, 1332), (510, 1328)]),
    ('Brewster St', 'a', [(793, 1221), (740, 1226), (666, 1236), (652, 1242), (626, 1276), (610, 1303), (600, 1322), (572, 1347), (546, 1370), (526, 1402), (502, 1434), (484, 1460), (470, 1495)]),
    ('Boston Ave', 'a', [(793, 1221), (810, 1196), (826, 1176), (838, 1160)]),
    ('Madison Ave', 'a', [(715, 750), (760, 722), (820, 692), (860, 665)]),
    ('Post Rd', 's', [(376, 1398), (410, 1372), (436, 1352), (480, 1343), (530, 1338)], {'curve': 1}),
    ('Mill Pond Rd', 's', [(362, 1412), (400, 1440), (426, 1458), (445, 1478)], {'curve': 1}),
    ('Hillside Ave', 's', [(400, 393), (470, 392), (542, 393)]),
]

# ---------------------------------------------------------------- water, parks, woods (pixels)
WATER = {
    'inlet': [(761, 1350), (736, 1371), (718, 1393), (707, 1414), (696, 1436), (686, 1457), (654, 1479), (629, 1507), (600, 1530), (590, 1560), (560, 1560), (560, 1520), (600, 1514),
              (636, 1486), (657, 1461), (668, 1443), (686, 1429), (698, 1404), (711, 1379), (718, 1353)],
    'sound': [(921, 1443), (850, 1452), (800, 1459), (753, 1473), (718, 1487), (689, 1507), (657, 1532), (629, 1564), (640, 1700), (921, 1700)],
    'pond': [(640, 442), (700, 444), (728, 455), (738, 485), (715, 505), (690, 515), (660, 520), (625, 525), (612, 505), (630, 490), (615, 470)],
}
PARKS = {
    'brooklawn': [(445, 1250), (520, 1235), (545, 1270), (540, 1310), (500, 1322), (455, 1310), (440, 1280)],
    'seaside': [(840, 1405), (921, 1395), (921, 1448), (850, 1448)],
}
ZONES = {   # woods / unbuilt land ('.') and commercial ('B')
    'woods-ne': ('.', [(650, 285), (757, 285), (757, 440), (740, 450), (700, 440), (650, 438)]),
    'mall': ('B', [(440, 315), (500, 315), (500, 372), (440, 372)]),
}
POI = {  # letter, pixel, name
    'M': ('M', (470, 342), 'Trumbull Mall'),
}

NAMES = {
    'nd': ['Brooklawn Ave', 'Hillside Ave', 'Lindley St', 'Noble Ave', 'Capitol Ave', 'Mill Hill Ave', 'Hawley Ave', 'Oakwood Ave', 'Fairview Ave', 'Laurel Ave', 'Colorado Ave',
           'Anton St', 'Wilmot Ave', 'Lakeview Ave', 'Lincoln Blvd', 'Beardsley Pkwy', 'Reservoir Ave', 'Huntington Tpke', 'Mountain Grove St', 'Hollister Ave'],
    'br': ['Brinsmade Ave', 'Grovers Ave', 'Ellsworth St', 'Ocean Terrace', 'Lighthouse Rd', 'Pequot Ave', 'Hollister Ave', 'Cottage St', 'Wilson Pl', 'Grovers Pl', 'Bayview Ave',
           'Harbor Rd', 'Cove St', 'Fayerweather Rd', 'Ash Creek Rd', 'Brooklawn Ave', 'Ellsworth Ave'],
    'dt': ['Pembroke St', 'Iranistan Ave', 'Lafayette Blvd', 'Clinton Ave', 'Gregory St', 'Hough Ave', 'Sherman St', 'Elm St', 'Poplar St', 'Wood Ave', 'Bostwick Ave', 'Myrtle Ave',
           'Ridgefield Ave', 'Atlantic St', 'Hancock Ave', 'Clifford St', 'Grant St', 'Hallett St', 'Bishop Ave', 'Water St', 'Bank St', 'Congress St'],
}
# parallel-street meshes: (name list, polygon, angle of the long streets in deg (0 = east, 90 = south), spacing px, spacing of the cross streets px, seed)
MESHES = [
    ('nd', [(425, 600), (500, 565), (562, 505), (606, 545), (640, 612), (680, 692), (716, 752), (700, 770), (420, 770)], -19, 21, 62, 41),
    ('nd', [(612, 546), (700, 537), (760, 548), (760, 706), (724, 760), (716, 752), (680, 692), (640, 612)], -21, 21, 58, 42),
    ('nd', [(560, 475), (606, 520), (600, 545), (545, 520)], -20, 24, 70, 43),
    ('nd', [(445, 392), (526, 384), (542, 470), (500, 524), (440, 524)], 24, 26, 70, 44),
    ('nd', [(566, 330), (648, 330), (650, 436), (566, 436), (556, 380)], 24, 26, 70, 45),
    ('br', [(560, 1262), (760, 1262), (760, 1300), (715, 1268), (680, 1288), (636, 1310), (602, 1322), (590, 1300), (640, 1262)], 41, 21, 56, 51),
    ('br', [(404, 1262), (440, 1262), (438, 1300), (428, 1330), (404, 1330)], 40, 24, 60, 52),
    ('br', [(545, 1368), (574, 1350), (606, 1352), (700, 1356), (748, 1346), (750, 1414), (716, 1400), (700, 1440), (660, 1482), (600, 1520), (540, 1522), (500, 1470), (520, 1410)], -37, 21, 53, 53),
    ('br', [(404, 1352), (540, 1354), (500, 1470), (470, 1515), (404, 1515)], -38, 23, 52, 54),
    ('dt', [(706, 1128), (838, 1040), (848, 1112), (838, 1160), (826, 1176), (810, 1196), (793, 1221), (740, 1226), (700, 1250)], 28, 24, 52, 61),
    ('dt', [(850, 1036), (921, 1090), (921, 1190), (896, 1203), (870, 1214), (850, 1180), (860, 1100)], 41, 21, 48, 62),
    ('dt', [(660, 1240), (700, 1226), (793, 1221), (800, 1238), (711, 1268)], 0, 18, 44, 63),
    ('dt', [(712, 1296), (860, 1262), (850, 1280), (816, 1302), (745, 1338), (710, 1348), (700, 1352), (650, 1350)], -22, 20, 68, 64),
    ('dt', [(764, 1352), (840, 1304), (886, 1268), (921, 1250), (921, 1400), (840, 1405), (770, 1450), (748, 1420)], 33, 22, 50, 65),
]
# windows: id -> pixel box, units per metre, level centre (kept from CT_DATA)
WINDOWS = {
    'br-blackrock': dict(box=(400, 1262, 342, 251), sc=0.6, tag='br'),
    'br-northend': dict(box=(415, 285, 342, 420), sc=0.5, tag='nd'),
    'br-downtown': dict(box=(640, 1080, 281, 330), sc=0.6, tag='dt'),
}


# ---------------------------------------------------------------- geometry helpers
def pip(p, poly):
    x, y = p
    ins = False
    j = len(poly) - 1
    for i in range(len(poly)):
        a, b = poly[i], poly[j]
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
            ins = not ins
        j = i
    return ins


def seg_x(a, b, c, d):
    d1 = (b[0] - a[0], b[1] - a[1]); d2 = (d[0] - c[0], d[1] - c[1])
    den = d1[0] * d2[1] - d1[1] * d2[0]
    if abs(den) < 1e-9:
        return False
    t = ((c[0] - a[0]) * d2[1] - (c[1] - a[1]) * d2[0]) / den
    u = ((c[0] - a[0]) * d1[1] - (c[1] - a[1]) * d1[0]) / den
    return 0 < t < 1 and 0 < u < 1


def clip_line(p, q, x0, y0, x1, y1):
    """Liang-Barsky: the part of segment p-q inside the box, or None"""
    dx, dy = q[0] - p[0], q[1] - p[1]
    t0, t1 = 0.0, 1.0
    for pp, qq in ((-dx, p[0] - x0), (dx, x1 - p[0]), (-dy, p[1] - y0), (dy, y1 - p[1])):
        if pp == 0:
            if qq < 0:
                return None
        else:
            r = qq / pp
            if pp < 0:
                if r > t1: return None
                t0 = max(t0, r)
            else:
                if r < t0: return None
                t1 = min(t1, r)
    return (p[0] + t0 * dx, p[1] + t0 * dy), (p[0] + t1 * dx, p[1] + t1 * dy)


def clip_polyline(pts, box):
    x0, y0, x1, y1 = box
    out, cur = [], []
    for i in range(len(pts) - 1):
        c = clip_line(pts[i], pts[i + 1], x0, y0, x1, y1)
        if not c:
            if len(cur) > 1: out.append(cur)
            cur = []
            continue
        a, b = c
        if cur and math.hypot(cur[-1][0] - a[0], cur[-1][1] - a[1]) < 0.01:
            cur.append(b)
        else:
            if len(cur) > 1: out.append(cur)
            cur = [a, b]
    if len(cur) > 1: out.append(cur)
    return out


def clip_poly(poly, box):
    """Sutherland-Hodgman against an axis-aligned box"""
    x0, y0, x1, y1 = box
    def cut(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a):
                out.append(inter(a, b))
        return out
    def ix(xv):
        return lambda a, b: (xv, a[1] + (b[1] - a[1]) * (xv - a[0]) / (b[0] - a[0]))
    def iy(yv):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (yv - a[1]) / (b[1] - a[1]), yv)
    pts = list(poly)
    for ins, it in ((lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)), (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1))):
        if not pts: break
        pts = cut(pts, ins, it)
    return pts


def mesh_lines(poly, ang, sp, rnd, jit=0.14, gap=0.12, off=0.0):
    """parallel lines at angle ang through the polygon, cut into the parts inside it"""
    a = math.radians(ang + rnd.uniform(-1.5, 1.5))
    d = (math.cos(a), math.sin(a)); n = (-d[1], d[0])
    cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
    R = max(math.hypot(p[0] - cx, p[1] - cy) for p in poly) + 5
    out = []
    k = -int(R / sp) - 1
    while k * sp < R + sp:
        o = k * sp + off + rnd.uniform(-jit, jit) * sp
        k += 1
        if abs(o) > R: continue
        base = (cx + n[0] * o, cy + n[1] * o)
        ts = []
        for i in range(len(poly)):
            p, q = poly[i - 1], poly[i]
            e = (q[0] - p[0], q[1] - p[1])
            den = d[0] * e[1] - d[1] * e[0]
            if abs(den) < 1e-9: continue
            t = ((p[0] - base[0]) * e[1] - (p[1] - base[1]) * e[0]) / den
            u = ((p[0] - base[0]) * d[1] - (p[1] - base[1]) * d[0]) / den
            if 0 <= u < 1: ts.append(t)
        ts.sort()
        for i in range(0, len(ts) - 1, 2):
            t0, t1 = ts[i], ts[i + 1]
            if t1 - t0 < 12: continue
            pa = (base[0] + d[0] * t0, base[1] + d[1] * t0); pb = (base[0] + d[0] * t1, base[1] + d[1] * t1)
            if rnd.random() < gap and t1 - t0 > 70:
                m = (t0 + t1) / 2 + rnd.uniform(-.2, .2) * (t1 - t0)
                g = rnd.uniform(5, 11)
                out.append([pa, (base[0] + d[0] * (m - g), base[1] + d[1] * (m - g))])
                out.append([(base[0] + d[0] * (m + g), base[1] + d[1] * (m + g)), pb])
            else:
                out.append([pa, pb])
    return out


def build():
    allroads = [list(r) + ([{}] if len(r) == 3 else []) for r in ROADS]
    mot = [r[2] for r in allroads if r[1] == 'm']
    water = list(WATER.values()); park = list(PARKS.values()); woods = [z[1] for z in ZONES.values() if z[0] == '.']
    blocked = lambda p: any(pip(p, w) for w in water + park + woods)
    rnd = random.Random(7)
    idx = {'nd': 0, 'br': 0, 'dt': 0}
    mesh_roads = []
    for tag, poly, ang, sp, csp, seed in MESHES:
        rnd = random.Random(seed)
        names = NAMES[tag]
        for kind, a, s in (('L', ang, sp), ('X', ang + 88 + rnd.uniform(-8, 8), csp)):
            for line in mesh_lines(poly, a, s, rnd):
                p, q = line
                if blocked(((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)) or blocked(p) and blocked(q): continue
                if any(seg_x(p, q, m[i], m[i + 1]) for m in mot for i in range(len(m) - 1)): continue
                if any(seg_x(p, q, w[i - 1], w[i]) for w in water for i in range(len(w))): continue
                if math.hypot(q[0] - p[0], q[1] - p[1]) < 14: continue
                nm = names[idx[tag] % len(names)]; idx[tag] += 1
                mesh_roads.append((nm, 's', [p, q], {}))
    return allroads + mesh_roads


def to_metres(pt, box):
    return [round((pt[0] - box[0]) * PX_M), round((pt[1] - box[1]) * PX_M)]


def district(did, spec, roads):
    bx = spec['box']; sc = spec['sc']
    margin_px = 80 / sc / PX_M  # the margin ring around the board (MARGIN = 90 units) is filled with the same land
    x0, y0, w, h = bx
    win = (x0, y0, x0 + w, y0 + h)
    big = (x0 - margin_px, y0 - margin_px, x0 + w + margin_px, y0 + h + margin_px)
    out = {'src': 'traced', 'm': [round(w * PX_M), round(h * PX_M)], 'sc': sc, 'roads': [], 'water': [], 'parks': [], 'zones': [], 'poi': []}
    for r in roads:
        name, cls, pts = r[0], r[1], r[2]
        opts = r[3] if len(r) > 3 else {}
        for part in clip_polyline(pts, win):
            if len(part) < 2: continue
            m = [to_metres(p, bx) for p in part]
            dd = []
            for q in m:
                if not dd or dd[-1] != q: dd.append(q)
            if len(dd) < 2: continue
            L = sum(math.hypot(dd[i + 1][0] - dd[i][0], dd[i + 1][1] - dd[i][1]) for i in range(len(dd) - 1))
            if L < 60: continue
            ent = [name, cls, dd]
            if opts: ent.append(opts)
            out['roads'].append(ent)
    for name, poly in WATER.items():
        c = clip_poly(poly, big)
        if len(c) >= 3: out['water'].append([to_metres(p, bx) for p in c])
    for name, poly in PARKS.items():
        c = clip_poly(poly, big)
        if len(c) >= 3: out['parks'].append([to_metres(p, bx) for p in c])
    for name, (t, poly) in ZONES.items():
        c = clip_poly(poly, big)
        if len(c) >= 3: out['zones'].append([t, [to_metres(p, bx) for p in c]])
    for k, (letter, p, nm) in POI.items():
        if win[0] <= p[0] <= win[2] and win[1] <= p[1] <= win[3]:
            m = to_metres(p, bx); out['poi'].append([letter, m[0], m[1], nm])
    return out


def js(o):
    return json.dumps(o, separators=(',', ':'), ensure_ascii=False)


def main():
    roads = build()
    res = {did: district(did, spec, roads) for did, spec in WINDOWS.items()}
    txt = '/* FF_TRACED:BEGIN  (generated by tools/geo/trace_bridgeport.py: Bridgeport traced by eye from a satellite screenshot. APPROXIMATE, not surveyed.) */\nconst FF_TRACED={\n'
    txt += ',\n'.join(" '%s':%s" % (k, js(v)) for k, v in res.items()) + '\n};\n/* FF_TRACED:END */'
    path = os.path.join(HERE, 'ct_data.js')
    src = open(path, encoding='utf-8').read()
    pat = re.compile(r'/\* FF_TRACED:BEGIN.*?/\* FF_TRACED:END \*/', re.S)
    if pat.search(src):
        src = pat.sub(lambda m: txt, src, count=1)
    else:
        src = src.replace('const CT_DATA={', txt + '\nconst CT_DATA={', 1)
    open(path, 'w', encoding='utf-8').write(src)
    for k, v in res.items():
        print(k, 'roads', len(v['roads']), 'water', len(v['water']), 'parks', len(v['parks']), 'bytes', len(js(v)))
    if '--overlay' in sys.argv:
        o = sys.argv[sys.argv.index('--overlay') + 1]
        json.dump({'roads': [[r[0], r[1], [list(p) for p in r[2]]] for r in roads], 'water': [list(map(list, p)) for p in WATER.values()], 'parks': [list(map(list, p)) for p in PARKS.values()]}, open(o, 'w'))


if __name__ == '__main__':
    main()
