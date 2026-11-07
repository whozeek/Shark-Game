#!/usr/bin/env python3
"""Step 1 of baking the bundled Bridgeport sample: turn the downloaded terrarium PNGs (e_<x>_<y>.png, zoom 12) into a compact elevation file.
usage: bake_elev.py <dir>      (writes <dir>/elev.json; each tile is downsampled 2x to 128x128 and stored as int16 quarter-metres)
Needs Pillow and numpy. Elevation source: Mapzen/Tilezen terrain tiles (AWS Open Data), see DATA_SOURCES.md."""
import sys, glob, json, base64, os
import numpy as np
from PIL import Image
d = sys.argv[1]; out = {}
for f in glob.glob(d + '/e_*.png'):
    x, y = os.path.basename(f)[2:-4].split('_')
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float64)
    h = a[:, :, 0] * 256 + a[:, :, 1] + a[:, :, 2] / 256 - 32768
    h = h.reshape(128, 2, 128, 2).mean(axis=(1, 3))
    out[x + ',' + y] = {'n': 128, 'd': base64.b64encode(np.round(h * 4).astype('<i2').tobytes()).decode()}
json.dump(out, open(d + '/elev.json', 'w'))
print(len(out), 'tiles')
