#!/usr/bin/env python3
"""Put the Connecticut data block into the game file.

  python3 tools/geo/inject.py                      # copy tools/geo/ct_data.js (+ geo_data/ct_outline.json) into rush-hour-routes.html
  python3 tools/geo/inject.py --districts out.js   # replace ONLY the districts list (output of build_levels.py), in the game AND in ct_data.js
  python3 tools/geo/inject.py other.html           # another game file

The game reads everything between the CT_DATA:BEGIN and CT_DATA:END markers, so swapping approximate districts for real ones is a data change.
Standard library only."""
import re, sys, os
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(os.path.join(here, '..', '..'))
argv = sys.argv[1:]
dist = None
if '--districts' in argv:
    dist = argv[argv.index('--districts') + 1]
    argv = [a for a in argv if a not in ('--districts', dist)]
html_path = argv[0] if argv else os.path.join(root, 'rush-hour-routes.html')
data_path = os.path.join(here, 'ct_data.js')
DPAT = re.compile(r'(/\* CT_DISTRICTS:BEGIN \*/).*?(/\* CT_DISTRICTS:END \*/)', re.S)


def put_districts(text, gen):
    if not DPAT.search(text):
        sys.exit('CT_DISTRICTS markers not found')
    return DPAT.sub(lambda m: m.group(1) + '\n ' + gen + '\n ' + m.group(2), text, count=1)


if dist:
    gen = open(dist, encoding='utf-8').read().strip()
    for path in (data_path, html_path):
        t = open(path, encoding='utf-8').read()
        open(path, 'w', encoding='utf-8').write(put_districts(t, gen))
        print('districts replaced in', path)
else:
    src = open(data_path, encoding='utf-8').read()
    outline = open(os.path.join(root, 'geo_data', 'ct_outline.json'), encoding='utf-8').read().strip()
    src = src.replace('__CT_OUTLINE__', outline).strip()
    html = open(html_path, encoding='utf-8').read()
    pat = re.compile(r'/\* CT_DATA:BEGIN.*?CT_DATA:END \*/', re.S)
    if not pat.search(html):
        sys.exit('CT_DATA markers not found in ' + html_path)
    open(html_path, 'w', encoding='utf-8').write(pat.sub(lambda m: src, html, count=1))
    print('ok', html_path)
