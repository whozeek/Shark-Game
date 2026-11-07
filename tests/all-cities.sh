#!/usr/bin/env bash
# Runs the places + simulation checks for every city and prints a one-line summary each.
export PW=${PW:-$(npm root -g)/playwright}
for c in ${CITIES:-nyc chicago la miami kyoto london paris seoul amsterdam}; do
  P=$(timeout 1200 node tests/places.mjs /tmp $c 2>&1 | tr -d '\n' )
  S=$(timeout 1200 node tests/sim.mjs $c "localStorage.setItem('rainfall-avenue:settings:v1', JSON.stringify({traffic:0.8, pedestrians:0.7}))" balanced 2>&1 | tail -1)
  python3 - "$c" "$P" "$S" <<'PY'
import json, sys, re
c, P, S = sys.argv[1:4]
def jpart(t):
    i = t.find('{'); j = t.rfind('}')
    try: return json.loads(t[i:j+1]), t[j+1:].strip()
    except Exception as e: return None, t[-300:]
p, perr = jpart(P); s, serr = jpart(S)
out = {'city': c}
if p:
    out['walkIns'] = p.get('walkIns'); out['inside'] = p.get('walkedInside'); out['windowSeat'] = p.get('seated')
    out['trips'] = [(t['lv'], t['stayedInBounds'], t['backOnStreet']) for t in p.get('trips', [])]
if s:
    out['stroll_m'] = s['stroll']['dist']; out['clip'] = s['stroll']['framesInsideColliders']; out['carHits'] = s['stroll']['carOverlapFrames']
    out['turns'] = s['turns']['completed']; out['carOverlaps'] = s['turns']['overlapSamples']; out['peds'] = f"{s['peds']['walking']}/{s['peds']['n']} walking, {s['peds']['inside']} inside"
out['errors'] = [x for x in (perr, serr) if x and x != '[]']
print(json.dumps(out))
PY
done
