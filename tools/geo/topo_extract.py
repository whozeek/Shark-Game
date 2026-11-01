#!/usr/bin/env python3
"""Extract simplified outlines from us-atlas TopoJSON (public domain US Census cartographic
boundaries, packaged by the npm package us-atlas, ISC) for the game's Connecticut map.
Standard library only.
usage: python3 -I topo_extract.py counties-10m.json > geo_data/ct_outline.json"""
import json, sys, math


def decode(t):
    sc, tr = t['transform']['scale'], t['transform']['translate']
    arcs = []
    for a in t['arcs']:
        x = y = 0
        out = []
        for dx, dy in a:
            x += dx
            y += dy
            out.append((round(x * sc[0] + tr[0], 4), round(y * sc[1] + tr[1], 4)))
        arcs.append(out)
    return arcs


def ring(arcs, idxs):
    pts = []
    for i in idxs:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.extend(a if not pts else a[1:])
    return pts


def simplify(p, eps):
    if len(p) < 3:
        return p
    a, b = p[0], p[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    l = math.hypot(dx, dy) or 1e-12
    md, mi = 0, 0
    for i in range(1, len(p) - 1):
        d = abs(dy * (p[i][0] - a[0]) - dx * (p[i][1] - a[1])) / l
        if d > md:
            md, mi = d, i
    if md > eps:
        return simplify(p[:mi + 1], eps)[:-1] + simplify(p[mi:], eps)
    return [a, b]


def main():
    t = json.load(open(sys.argv[1]))
    arcs = decode(t)
    out = {}
    for g in t['objects']['counties']['geometries']:
        fips = str(g['id']).zfill(5)
        keep = fips[:2] == '09' or fips in ('36103', '36059', '36119', '36087', '44009', '44007', '25013', '25015', '25003')
        if not keep:
            continue
        polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        rs = []
        for poly in polys:
            r = ring(arcs, poly[0])
            h = len(r) // 2   # a closed ring has identical ends: simplify two halves
            s = simplify(r[:h + 1], 0.004)[:-1] + simplify(r[h:], 0.004)
            rs.append([list(q) for q in s])
        out[fips] = {'name': g['properties'].get('name'), 'rings': rs}
    json.dump(out, sys.stdout, separators=(',', ':'))


main()
