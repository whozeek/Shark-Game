#!/usr/bin/env python3
"""Build dist/rush-hour-routes.html: three.js and its add-ons inlined (no external scripts, needed for offline play)
and the game script minified for faster loading.
usage: build_dist.py <three@0.128.0 package dir> [terser binary]"""
import os, subprocess, sys, tempfile
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'rush-hour-routes.html'), encoding='utf-8').read()
if len(sys.argv) < 2: sys.exit(__doc__)
lib = sys.argv[1]
terser = sys.argv[2] if len(sys.argv) > 2 else None
def read(p): return open(os.path.join(lib, p), encoding='utf-8').read()
def minify(code):
    if not terser: return code
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(code); name = f.name
    try:
        r = subprocess.run([terser, name, '-c', '-m'], capture_output=True, text=True, encoding='utf-8')
        if r.returncode != 0 or not r.stdout.strip():
            print('terser failed, keeping unminified:', r.stderr[:200]); return code
        return r.stdout
    finally: os.unlink(name)
files = {
 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js': ('build/three.min.js', False),
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js': ('examples/js/shaders/CopyShader.js', True),
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js': ('examples/js/shaders/LuminosityHighPassShader.js', True),
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js': ('examples/js/postprocessing/EffectComposer.js', True),
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js': ('examples/js/postprocessing/RenderPass.js', True),
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js': ('examples/js/postprocessing/ShaderPass.js', True),
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js': ('examples/js/postprocessing/UnrealBloomPass.js', True),
}
out = src
for url, (path, mini) in files.items():
    tag = '<script src="%s"></script>' % url
    assert tag in out, 'missing tag ' + url
    code = read(path)
    if mini: code = minify(code)
    assert '</script' not in code.lower()
    out = out.replace(tag, '<script>' + code + '</script>')
# minify the game script (the inline script that defines window.__rhr)
i = out.index('<script>', out.rindex('</script>', 0, out.index('window.__rhr=')) )
j = out.index('</script>', i)
game = out[i + 8:j]
out = out[:i + 8] + minify(game) + out[j:]
os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
open(os.path.join(here, 'dist', 'rush-hour-routes.html'), 'w', encoding='utf-8').write(out)
print('built dist/rush-hour-routes.html', len(out), 'bytes (source', len(src), ')')
