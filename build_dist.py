#!/usr/bin/env python3
"""Build dist/rush-hour-routes.html: the game with three.js and its post-processing add-ons inlined,
so the page has no external script dependencies (needed for offline play)."""
import re, os, sys
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'rush-hour-routes.html'), encoding='utf-8').read()
lib = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('THREE_DIR', '')
if not lib:
    sys.exit('usage: build_dist.py <path to three@0.128.0 package dir>')
def read(p): return open(os.path.join(lib, p), encoding='utf-8').read()
files = {
 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js': 'build/three.min.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js': 'examples/js/shaders/CopyShader.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js': 'examples/js/shaders/LuminosityHighPassShader.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js': 'examples/js/postprocessing/EffectComposer.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js': 'examples/js/postprocessing/RenderPass.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js': 'examples/js/postprocessing/ShaderPass.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js': 'examples/js/postprocessing/UnrealBloomPass.js',
}
out = src
for url, path in files.items():
    tag = '<script src="%s"></script>' % url
    assert tag in out, 'missing tag ' + url
    code = read(path)
    assert '</script' not in code.lower()
    out = out.replace(tag, '<script>' + code + '</script>')
os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
open(os.path.join(here, 'dist', 'rush-hour-routes.html'), 'w', encoding='utf-8').write(out)
print('built dist/rush-hour-routes.html', len(out), 'bytes')
