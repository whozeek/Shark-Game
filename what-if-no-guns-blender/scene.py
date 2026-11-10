# Builds and renders the 3D "What If All Guns Vanished" short in Blender (bpy).
# usage: python3 scene.py <start_frame> <end_frame> [--still f1,f2,...] [--save]
import bpy, json, math, random, sys, os
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(HERE + '/build/timeline.json'))
FPS = 24
F = lambda sec: int(round(sec * FPS)) + 1
SC = {s['id']: s for s in TL['scenes']}
def S(id): return F(SC[id]['start'])
def LN(id, i): return F(SC[id]['start'] + SC[id]['lines'][i]['start'])
END = F(TL['total'])
random.seed(3)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS; scene.frame_start = 1; scene.frame_end = END
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'

# ---------- materials ----------
MATS = {}
def mat(col, emit=0.0, rough=0.7, name=None):
    key = (tuple(round(c, 3) for c in col), emit, rough)
    if key in MATS: return MATS[key]
    m = bpy.data.materials.new(name or 'm%d' % len(MATS)); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    if emit: b.inputs['Base Color'].default_value = (0, 0, 0, 1); b.inputs['Emission Color'].default_value = (*col, 1); b.inputs['Emission Strength'].default_value = emit
    MATS[key] = m; return m
def hexc(h): h = h.lstrip('#'); return tuple((int(h[i:i+2], 16) / 255) ** 2.2 for i in (0, 2, 4))
def building_mat(wall, dims=(1, 1, 1)):
    m = bpy.data.materials.new('bld'); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); br = nt.nodes.new('ShaderNodeTexBrick')
    mp.inputs['Rotation'].default_value = (math.radians(90), 0, 0); mp.inputs['Scale'].default_value = dims
    br.offset = 0; br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = 0.3
    br.inputs['Brick Width'].default_value = 1.1; br.inputs['Row Height'].default_value = 1.3
    br.inputs['Color1'].default_value = (*hexc('#bfe6ff'), 1); br.inputs['Color2'].default_value = (*hexc('#8fc7ee'), 1)
    br.inputs['Mortar'].default_value = (*wall, 1)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], b.inputs['Base Color']); return m

# ---------- primitives ----------
def _fin(o, m, parent, smooth):
    if m: o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    if parent: o.parent = parent
    return o
def box(loc, size, m, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.scale = size; return _fin(o, m, parent, False)
def cyl(loc, r, h, m, parent=None, rot=(0, 0, 0), verts=20, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot); return _fin(bpy.context.object, m, parent, smooth)
def sph(loc, r, m, parent=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=loc); o = bpy.context.object; o.scale = scale; return _fin(o, m, parent, True)
def ico(loc, r, m, parent=None, sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc); return _fin(bpy.context.object, m, parent, sub > 1)
def cone(loc, r, h, m, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=r, depth=h, location=loc, rotation=rot); return _fin(bpy.context.object, m, parent, True)
def empty(loc, parent=None):
    o = bpy.data.objects.new('e', None); bpy.context.collection.objects.link(o); o.location = loc
    if parent: o.parent = parent
    return o
def text3d(body, loc, size, m, rot=(math.radians(90), 0, 0), parent=None, extrude=0.04):
    bpy.ops.object.text_add(location=loc, rotation=rot); o = bpy.context.object
    o.data.body = body; o.data.size = size; o.data.align_x = 'CENTER'; o.data.align_y = 'CENTER'; o.data.extrude = extrude
    o.data.materials.append(m)
    if parent: o.parent = parent
    return o
def key(o, path, f, v, idx=-1):
    if idx >= 0: getattr(o, path)[idx] = v
    else: setattr(o, path, v)
    o.keyframe_insert(path, frame=f, index=idx)
def pop(o, f, s=1.0, dur=6):   # scale-in
    key(o, 'scale', f - 1, (0, 0, 0)); key(o, 'scale', f + dur - 2, (s * 1.2,) * 3); key(o, 'scale', f + dur, (s,) * 3)
def vanish(o, f): key(o, 'scale', f - 1, tuple(o.scale)); key(o, 'scale', f, (0, 0, 0))

SKINS = ['#f2c9a0', '#e0a77a', '#c68642', '#8d5524', '#ffdbac']
SHIRTS = ['#e85d5d', '#4c8ed9', '#f2b632', '#5cb85c', '#9b59b6', '#f07f3c', '#3bb3a8', '#e05297']
BLACK = mat((0.01, 0.01, 0.01)); WHITE = mat((1, 1, 1)); GUN = mat((0.02, 0.02, 0.025), rough=0.4)

# ---------- character ---------- (faces -Y, 1.5 units tall)
def person(loc, rz=0, shirt=None, skin=None, pants='#2f3b55', hat=None, s=1.0, hair=None):
    shirt = mat(hexc(shirt or random.choice(SHIRTS))); skin = mat(hexc(skin or random.choice(SKINS))); pm = mat(hexc(pants))
    root = empty(loc); root.rotation_euler = (0, 0, rz); root.scale = (s, s, s)
    P = {'root': root}
    sph((0, 0, .78), .26, shirt, root, scale=(1, .8, 1.35))
    head = sph((0, 0, 1.32), .21, skin, root); P['head'] = head
    for x in (-.08, .08): sph((x, -.19, .03), .028, BLACK, head)
    if hat == 'police':
        cyl((0, 0, .17), .2, .1, mat(hexc('#1d2a4a')), head); cyl((0, -.08, .12), .22, .02, BLACK, head); sph((0, -.2, .17), .03, mat(hexc('#f5cf4a'), rough=.3), head)
    elif hat == 'helmet': sph((0, 0, .05), .235, mat(hexc('#4d5b33')), head, scale=(1, 1, .8))
    elif hat == 'beanie': sph((0, 0, .05), .225, BLACK, head, scale=(1, 1, .8))
    else: sph((0, .02, .05), .22, mat(hexc(hair or random.choice(['#2b1b10', '#5a3418', '#111111', '#c9a14a']))), head, scale=(1, 1, .8))
    for side, x in (('L', -.3), ('R', .3)):
        a = empty((x, 0, 1.02), root); cyl((0, 0, -.2), .06, .4, shirt, a); sph((0, 0, -.43), .07, skin, a); P['arm' + side] = a
        l = empty((x * .4, 0, .45), root); cyl((0, 0, -.2), .08, .4, pm, l); sph((0, -.04, -.42), .09, BLACK, l, scale=(1, 1.4, .6)); P['leg' + side] = l
        a.rotation_euler = (0, math.radians(8 if x > 0 else -8), 0)
    return P
def walk(P, f0, f1, x0, x1, speed=1.0):
    r = P['root']; key(r, 'location', f0, x0, 0); key(r, 'location', f1, x1, 0)
    r.rotation_euler[2] = math.radians(90 if x1 > x0 else -90)
    f = f0; sgn = 1
    while f <= f1 + 6:
        for n, k in (('legL', 1), ('legR', -1), ('armL', -1), ('armR', 1)): key(P[n], 'rotation_euler', f, sgn * k * .6, 0)
        sgn = -sgn; f += int(7 / speed)
def jump(P, f0, f1, h=.35, phase=0):
    r = P['root']; z = r.location[2]; f = f0 + phase
    while f < f1: key(r, 'location', f, z, 2); key(r, 'location', f + 4, z + h, 2); f += 8
    key(r, 'location', f, z, 2)
def arms(P, f, l, r_, side=0):  # raise arms: angle around X (forward) ; side = outward angle
    key(P['armL'], 'rotation_euler', f, l, 0); key(P['armR'], 'rotation_euler', f, r_, 0)
def pistol(parent, loc, s=1.0):
    g = empty(loc, parent); box((0, -.07, 0), (.045, .2, .06), GUN, g); box((0, 0, -.07), (.045, .07, .13), GUN, g); g.scale = (s, s, s); return g
def rifle(parent, loc, rot=(0, 0, 0)):
    g = empty(loc, parent); g.rotation_euler = rot; box((0, -.2, 0), (.08, 1.1, .1), GUN, g); box((0, .42, -.04), (.085, .4, .18), mat(hexc('#6b4428')), g); return g
PUFFM = mat((1, 1, 1), emit=1.0)
def puff(loc, f, size=1.0, n=9):
    for i in range(n):
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-.3, 1))).normalized() * random.uniform(.25, .6) * size
        o = ico(loc, random.uniform(.12, .22) * size, PUFFM)
        key(o, 'scale', f - 1, (0, 0, 0)); key(o, 'location', f - 1, tuple(loc))
        key(o, 'scale', f + 5, (1.3,) * 3); key(o, 'location', f + 22, tuple(Vector(loc) + d)); key(o, 'scale', f + 22, (0, 0, 0))
def emote(txt, loc, f, col='#ffd23f', size=.5):
    o = text3d(txt, loc, size, mat(hexc(col), emit=1.0)); pop(o, f); return o
def tree(loc, s=1.0):
    cyl((loc[0], loc[1], loc[2] + .5 * s), .1 * s, 1.0 * s, mat(hexc('#7a5236'))); ico((loc[0], loc[1], loc[2] + 1.5 * s), .7 * s, mat(hexc('#3f9b52')))
def buildings(x0, x1, y, seed=1):
    rr = random.Random(seed); x = x0; cols = ['#6f8fb3', '#c07a5a', '#d29a5a', '#7b6f9e', '#8aa8c9', '#d98e8e', '#7fb89a']
    while x < x1:
        w = rr.uniform(3.5, 6); h = rr.uniform(6, 16); box((x + w / 2, y + 2.5, h / 2), (w, 5, h), building_mat(hexc(rr.choice(cols)), (w, 5, h))); x += w + .3
def ground(x, col='#c9c3b8', w=60, road=True):
    box((x, 0, -.1), (w, 60, .2), mat(hexc(col)))
    if road:
        box((x, -3.5, -.08), (w, 4.5, .2), mat(hexc('#45484f')))
        for i in range(int(-w / 2), int(w / 2), 3): box((x + i, -3.5, .025), (1.4, .12, .01), mat(hexc('#e9d76a')))
def car(x, y, col):
    c = empty((x, y, 0)); m = mat(hexc(col), rough=.3); box((0, 0, .45), (2.2, 1, .5), m, c); box((-.1, 0, .9), (1.2, .9, .45), m, c)
    for dx in (-.7, .7):
        for dy in (-.5, .5): cyl((dx, dy, .25), .25, .15, BLACK, c, rot=(math.radians(90), 0, 0))
    return c

# ============ SET A: city street (x≈0) ============
ground(0); buildings(-30, 30, 4.5, 1)
for x in (-9, -4.5, 4.5, 9): tree((x, 3.6, 0), 1.3)
fp = LN('poof', 1)   # the poof frame
cop = person((0, 1, 0), shirt='#2c3e74', skin='#c68642', pants='#1d2a4a', hat='police', s=1.15)
g1 = pistol(cop['root'], (.34, -.32, .8), 2.0)
sol = person((-1.6, 1.2, 0), rz=.3, shirt='#5a6b3a', skin='#e0a77a', pants='#4d5b33', hat='helmet', s=1.15)
g2 = rifle(sol['root'], (0, -.3, .85), (0, .5, 1.57))
sol2 = person((-2.8, 1.5, 0), rz=.5, shirt='#5a6b3a', skin='#8d5524', pants='#4d5b33', hat='helmet', s=1.15)
g4 = rifle(sol2['root'], (0, -.3, .85), (0, .5, 1.57))
hun = person((1.7, 1.2, 0), rz=-.3, shirt='#f07f3c', skin='#f2c9a0', pants='#4a5a3a', s=1.15)
g3 = rifle(hun['root'], (0, -.3, .85), (0, -.5, 1.57))
for g, P in ((g1, cop), (g2, sol), (g3, hun), (g4, sol2)):
    vanish(g, fp); puff(tuple(g.matrix_world.translation) if False else (P['root'].location[0] + .3, P['root'].location[1] - .5, 1.1), fp, 1.3)
# shock reactions
for P in (cop, sol, sol2, hun):
    for n in ('armL', 'armR'):
        a = P[n]; r0 = a.rotation_euler[0]; key(a, 'rotation_euler', fp - 1, r0, 0); key(a, 'rotation_euler', fp + 5, 2.6, 0); key(a, 'rotation_euler', fp + 30, 2.6, 0); key(a, 'rotation_euler', fp + 40, .9 if P is not cop else 0, 0)
    key(P['root'], 'location', fp, 0, 2); key(P['root'], 'location', fp + 4, .3, 2); key(P['root'], 'location', fp + 8, 0, 2)
emote('?', (.0, 1, 2.3), fp + 14); emote('!?', (-2.2, 1.3, 2.3), fp + 18); emote('?', (1.8, 1.2, 2.3), fp + 22)
# cop pats empty holster in react scene
fr = S('react')
for k in range(4): key(cop['armR'], 'rotation_euler', fr + k * 10, -.25, 0); key(cop['armR'], 'rotation_euler', fr + k * 10 + 5, .25, 0)
key(cop['head'], 'rotation_euler', fr - 2, 0, 0); key(cop['head'], 'rotation_euler', fr + 8, -.5, 0)
for P in (sol, sol2):
    key(P['head'], 'rotation_euler', LN('react', 1) - 6, 0, 0); key(P['head'], 'rotation_euler', LN('react', 1) + 4, -.5, 0)
# walkers & cars
for i in range(7):
    P = person((0, random.uniform(2.3, 3.1), 0), s=random.uniform(.95, 1.1)); d = 1 if i % 2 else -1
    x0 = random.uniform(-14, 14); walk(P, 1, S('mood'), x0, x0 + d * random.uniform(9, 14))
for i, (col, d) in enumerate((('#e85d5d', 1), ('#4c8ed9', -1), ('#f2b632', 1))):
    c = car(0, -2.6 - (d < 0) * 1.8, col); x0 = -14 * d - i * 5 * d; key(c, 'location', 1, x0, 0); key(c, 'location', S('poof'), x0 + d * 60, 0)
    if d < 0: c.rotation_euler[2] = math.pi
# title + billboard
T1 = text3d('WHAT IF?', (-3.2, 2.5, 5.4), 2.4, mat(hexc('#ffd23f'), emit=1.0), extrude=.25); pop(T1, 10, 1, 8); vanish(T1, S('poof') + 20)
box((6.5, 4.3, 6), (7.5, .3, 3.6), BLACK)
bb = box((6.5, 4.1, 6), (7.1, .1, 3.2), mat(hexc('#b3202c'), emit=1.0))
fn = LN('react', 2)
t1 = text3d('BREAKING NEWS', (6.5, 4.0, 6.9), .62, mat((1, 1, 1), emit=1.0)); t2 = text3d('ALL GUNS GONE', (6.5, 4.0, 5.6), .78, mat(hexc('#ffd23f'), emit=1.0))
for o in (t1, t2): pop(o, fn - 4)
key(bb, 'scale', fn - 6, (7.1, .1, 0)); key(bb, 'scale', fn - 1, (7.1, .1, 3.2))

# ============ SET B: moods (x≈100) ============
BX = 100; ground(BX, '#d9cbb3'); buildings(BX - 30, BX + 30, 5, 2)
fm = S('mood'); fm2 = LN('mood', 1)
for i in range(9):
    P = person((BX - 7 + i * .95, random.uniform(.2, 2.2), 0), rz=random.uniform(-.4, .4)); jump(P, fm - 10, fm2 + 30, .4, i % 4 * 2)
    P['armL'].rotation_euler = (2.8, -.3, 0); P['armR'].rotation_euler = (2.8, .3, 0)
sg = text3d('NO MORE GUNS!', (BX - 3, 3.2, 3.2), .7, mat(hexc('#2ecc71'), emit=1.0), extrude=.08)
for i in range(70):
    c = box((BX - 3 + random.uniform(-6, 6), random.uniform(-1, 3), 0), (.12, .12, .02), mat(hexc(random.choice(['#ff5a5a', '#ffd23f', '#3bceac', '#4c8ed9', '#ee4266'])), emit=.4), rot=(random.random() * 3, random.random() * 3, 0))
    z = random.uniform(3, 9); key(c, 'location', fm - 10, z, 2); key(c, 'location', fm2 + 40, z - 7, 2)
# shop
SX = BX + 9
box((SX, 3.5, 2), (7, 3, 4), mat(hexc('#5a5f78'))); box((SX, 1.9, 3.5), (7, .2, .9), mat(hexc('#b3202c')))
text3d('SHOP', (SX, 1.78, 3.5), .6, mat((1, 1, 1), emit=1.0))
for k in range(3): box((SX, 1.7, .6 + k * .8), (5, .5, .08), mat(hexc('#8a6440')))
bats = []
for k in range(8):
    b = cyl((SX - 2 + k * .55, 1.6, 1.0), .06, .7, mat(hexc('#e8c08a'))); vanish(b, fm2 + 10 + k * 8)
    l = box((SX - 2 + k * .55, 1.6, 1.62), (.25, .2, .25), mat(hexc('#d4a017'), rough=.3)); vanish(l, fm2 + 14 + k * 8)
so = text3d('SOLD OUT', (SX, 1.3, 1.5), .8, mat(hexc('#ff3b3b'), emit=1.0), rot=(math.radians(90), .15, 0), extrude=.06); pop(so, fm2 + 72)
for i in range(4):
    P = person((SX - 2.5 + i * 1.5, -.2 - (i % 2) * .5, 0), rz=math.pi); P['armL'].rotation_euler = (-1.2, 0, 0)

# ============ SET C: good news (x≈200) ============
CX = 200; ground(CX, '#7cc46b', road=False); fg = S('good')
for x in (-9, -6.5, 6.5, 9): tree((CX + x, 4, 0), 1.6)
bars = []
for i in range(6):
    h = 3.4 + math.sin(i) * .4; b = box((CX - 3 + i * 1.2, 3, h / 2), (.9, .9, h), mat(hexc('#ff5a5a')))
    f0 = fg + 60 + i * 4; key(b, 'scale', f0, h, 2); key(b, 'location', f0, h / 2, 2); key(b, 'scale', f0 + 40, .15, 2); key(b, 'location', f0 + 40, .075, 2)
n1 = text3d('250,000 / YEAR', (CX, 3, 5), .9, mat(hexc('#ff5a5a'), emit=1.0), extrude=.08); pop(n1, fg + 20); vanish(n1, fg + 95)
n2 = text3d('NEAR ZERO', (CX, 3, 3), 1.3, mat(hexc('#2ecc71'), emit=1.0), extrude=.1); pop(n2, fg + 96)
for i in range(7):
    P = person((CX - 5.5 + i * 1.8, random.uniform(-.5, 1), 0), rz=random.uniform(-.3, .3), s=.7 if i % 3 == 1 else 1.05); jump(P, fg + 100, fg + 200, .35, i * 2)
    for n, k in (('armL', -.3), ('armR', .3)): key(P[n], 'rotation_euler', fg + 96, 0, 0); key(P[n], 'rotation_euler', fg + 104, 2.8, 0)

# ============ SET D: bad news (x≈300) ============
DX = 300; ground(DX, '#8a8f99', road=False); fb = S('bad'); buildings(DX - 22, DX - 2, 5, 4)
rob = person((DX - 9, .5, 0), rz=math.radians(90), shirt='#222222', pants='#222222', hat='beanie', s=1.15); rob['armR'].rotation_euler = (1.4, 0, 0)
kn = empty((0, 0, -.45), rob['armR']); box((0, -.2, 0), (.04, .35, .08), mat((.8, .82, .85), rough=.2), kn)
vic = person((DX - 7, .5, 0), rz=math.radians(-90), s=1.1); vic['armL'].rotation_euler = (2.8, 0, 0); vic['armR'].rotation_euler = (2.8, 0, 0)
key(rob['root'], 'location', fb, DX - 10.5, 0); key(rob['root'], 'location', fb + 40, DX - 8.3, 0)
emote('!', (DX - 7, .5, 2.2), fb + 20, '#ff5a5a')
# missile truck
MX = DX + 1.5; gm = mat(hexc('#5f6b3a'))
box((MX, 2, .7), (4.2, 1.6, .8), gm); box((MX - 1.4, 2, 1.5), (1.2, 1.5, .8), gm)
for dx in (-1.4, 0, 1.4): cyl((MX + dx, 1.2, .35), .35, .25, BLACK, rot=(math.radians(90), 0, 0))
for k in range(3):
    ms = empty((MX + .6, 1.5 + k * .5, 1.4)); ms.rotation_euler = (0, math.radians(-50), 0)
    cyl((0, 0, .9), .16, 2.2, mat((.9, .9, .9), rough=.3), ms); cone((0, 0, 2.2), .16, .5, mat(hexc('#e63946')), ms)
    key(ms, 'rotation_euler', LN('bad', 1) - 5, math.radians(-85), 1); key(ms, 'rotation_euler', LN('bad', 1) + 25, math.radians(-40), 1)
person((MX + 3.2, 1, 0), shirt='#5a6b3a', pants='#4d5b33', hat='helmet', s=1.15)
# factory
FX = DX + 12; fmat = mat(hexc('#7a838e'))
box((FX, 4, 1.8), (8, 4, 3.6), fmat)
for k in range(4): box((FX - 3 + k * 2, 4, 3.9), (2, 4, .9), mat(hexc('#6d757f')), rot=(0, math.radians(20), 0))
cyl((FX + 3, 4, 4.5), .45, 4, mat(hexc('#6d757f'))); smoke = mat((.85, .85, .87))
f3 = LN('bad', 2)
for k in range(10):
    o = ico((FX + 3, 4, 6.6), .5, smoke); f0 = f3 - 10 + k * 9
    key(o, 'scale', f0 - 1, (0, 0, 0)); key(o, 'scale', f0 + 8, (1, 1, 1)); key(o, 'location', f0, (FX + 3, 4, 6.6)); key(o, 'location', f0 + 60, (FX + 5 + k * .2, 4, 11)); key(o, 'scale', f0 + 60, (1.8,) * 3)
for k in range(3):
    gear = cyl((FX - 2.2 + k * 2.2, 1.95, 1.8), .7, .15, mat(hexc('#e0b23a'), rough=.3), rot=(math.radians(90), 0, 0), verts=8, smooth=False)
    key(gear, 'rotation_euler', fb, 0, 1); key(gear, 'rotation_euler', END, 14 * (1 if k % 2 else -1), 1)
cb = empty((FX - 5, 1.8, .9))
for k in range(5):
    c = box((FX - 4.6, 1.2 - k * .0, .35), (.9, .5, .35), mat(hexc('#b98a52'))); pistol(c, (0, 0, 0.6), 2.2).rotation_euler = (0, 0, math.radians(90)); c.children[0].scale = (2.2 / .9, 2.2 / .5, 2.2 / .35)
    f0 = f3 + k * 14; key(c, 'location', f0, FX - 4.6, 0); key(c, 'location', f0 + 60, FX - 4.6 - 6, 0); key(c, 'scale', f0 - 1, (0, 0, 0)); key(c, 'scale', f0, (.9, .5, .35))

# ============ SET E: globe ending (x≈400) ============
EX = 400; fe = S('end')
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=2.6, location=(EX, 0, 3)); gl = bpy.context.object
for p in gl.data.polygons: p.use_smooth = True
gm = bpy.data.materials.new('globe'); gm.use_nodes = True; nt = gm.node_tree; b = nt.nodes['Principled BSDF']
nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.6; nz.inputs['Detail'].default_value = 5
tc = nt.nodes.new('ShaderNodeTexCoord'); cr = nt.nodes.new('ShaderNodeValToRGB')
cr.color_ramp.elements[0].position = .5; cr.color_ramp.elements[0].color = (*hexc('#1f6fd0'), 1); cr.color_ramp.elements[1].position = .53; cr.color_ramp.elements[1].color = (*hexc('#4fbf5f'), 1)
nt.links.new(tc.outputs['Object'], nz.inputs['Vector']); nt.links.new(nz.outputs[0], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .5
gl.data.materials.append(gm); key(gl, 'rotation_euler', fe - 5, 0, 2); key(gl, 'rotation_euler', END, 2.2, 2)
box((EX, 12, 3), (80, .2, 60), mat((0.004, 0.006, 0.02)))
for i in range(120): ico((EX + random.uniform(-22, 22), 11.5, random.uniform(-6, 14)), random.uniform(.02, .06), mat((1, 1, 1), emit=6), sub=1)
q1 = text3d('REBUILD?', (EX - 4.9, -.5, 3.6), .62, mat(hexc('#ff5a5a'), emit=1.0), extrude=.08); pop(q1, fe + 30)
q2 = text3d('GUN FREE?', (EX + 4.9, -.5, 3.6), .62, mat(hexc('#2ecc71'), emit=1.0), extrude=.08); pop(q2, fe + 62)
q3 = text3d('WHAT DO YOU THINK?', (EX, -1.5, .1), .95, mat(hexc('#ffd23f'), emit=1.0), extrude=.1); pop(q3, LN('end', 1) - 2)
pl = bpy.data.lights.new('pl', 'AREA'); pl.energy = 4000; pl.size = 6; plo = bpy.data.objects.new('pl', pl); bpy.context.collection.objects.link(plo); plo.location = (EX - 5, -8, 8)
plo.rotation_euler = (math.radians(55), 0, math.radians(-30))

# ---------- world, sun, camera ----------
w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (*hexc('#9fd4f7'), 1)
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 4; sun.angle = math.radians(4); so_ = bpy.data.objects.new('sun', sun); bpy.context.collection.objects.link(so_); so_.rotation_euler = (math.radians(50), 0, math.radians(-35))
def wkey(f, v): bg.inputs['Strength'].default_value = v; bg.inputs['Strength'].keyframe_insert('default_value', frame=f)
def skey(f, v): sun.energy = v; sun.keyframe_insert('energy', frame=f)
wkey(1, 1); wkey(fp - 1, 1); wkey(fp, 12); wkey(fp + 2, 12); wkey(fp + 10, 1); wkey(fe - 1, 1); wkey(fe, 0.0)
skey(fe - 1, 4); skey(fe, 0)

cam = bpy.data.cameras.new('cam'); cam.lens = 35; co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); scene.camera = co
tgt = empty((0, 0, 0)); tr = co.constraints.new('TRACK_TO'); tr.target = tgt; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'
def shot(f0, f1, p0, t0, p1=None, t1=None):
    key(co, 'location', f0, p0); key(tgt, 'location', f0, t0); key(co, 'location', f1 - 1, p1 or p0); key(tgt, 'location', f1 - 1, t1 or t0)
fpo = S('poof'); m3 = LN('react', 1)
shot(1, fpo, (0, -16, 6), (0, 2, 3.5), (0, -11, 3.2), (0, 2, 2.6))                       # intro: dolly into street
shot(fpo, fp - 3, (-3, -9, 2.2), (-.3, 1, 1.3), (-1, -7, 1.9), (-.3, 1, 1.2))             # ordinary morning → push in
shot(fp - 3, fr, (-.5, -6.2, 1.8), (-.3, 1, 1.2), (-.5, -7.5, 2.0), (-.3, 1, 1.3))        # POOF + reactions
shot(fr, m3 - 3, (1.6, -2.6, 1.5), (0, 1, 1.15), (1.2, -2.2, 1.45), (0, 1, 1.1))          # cop close-up
shot(m3 - 3, fn - 8, (-4.8, -2.6, 1.5), (-2.2, 1.3, 1.2), (-4.3, -2.2, 1.5), (-2.2, 1.3, 1.2))  # soldiers
shot(fn - 8, fm, (3, -9, 2), (6, 4, 5.6), (4, -7, 2), (6.5, 4, 6))                         # billboard
shot(fm, fm2 - 4, (BX - 3, -9, 2.2), (BX - 3, 1.5, 1.8), (BX - 3, -7.5, 2.0), (BX - 3, 1.5, 1.8))
shot(fm2 - 4, fg, (SX - 1, -8.5, 2.4), (SX, 1.5, 1.6), (SX + .5, -6.5, 2.2), (SX, 1.5, 1.5))
shot(fg, fb, (CX - 2, -11, 3), (CX, 3, 2.6), (CX + 2, -9.5, 2.6), (CX, 3, 2.2))
shot(fb, LN('bad', 1) - 4, (DX - 8, -7, 1.9), (DX - 8, .5, 1.2), (DX - 8, -5.5, 1.7), (DX - 8, .5, 1.2))
shot(LN('bad', 1) - 4, f3 - 4, (MX - 3, -8, 2), (MX + .5, 2, 1.8), (MX - 1, -7, 2.2), (MX + .5, 2, 2))
shot(f3 - 4, fe, (FX - 3, -12, 2.6), (FX - 1, 3, 3), (FX - 2, -10, 2.4), (FX - 1, 3, 3.2))
shot(fe, END + 1, (EX, -17, 3), (EX, 0, 2.6), (EX, -14, 3), (EX, 0, 2.6))

# ---------- render ----------
r = scene.render; r.engine = os.environ.get('ENGINE', 'CYCLES'); r.resolution_x = 960; r.resolution_y = 540; r.resolution_percentage = 100
c = scene.cycles; c.samples = int(os.environ.get('SPP', 8)); c.use_denoising = os.environ.get('DN', '1') == '1'; c.use_adaptive_sampling = False; c.max_bounces = 3; c.diffuse_bounces = 1; c.glossy_bounces = 1
try: c.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
except Exception: pass
r.use_persistent_data = True; scene.view_settings.view_transform = 'Standard'
r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 95
args = sys.argv[1:]
if '--save' in args: bpy.ops.wm.save_as_mainfile(filepath=HERE + '/what-if.blend')
if '--still' in args:
    for f in args[args.index('--still') + 1].split(','):
        scene.frame_set(int(f)); r.filepath = HERE + '/build/st2/still_%04d.jpg' % int(f); bpy.ops.render.render(write_still=True)
elif len(args) >= 2 and args[0].isdigit():
    scene.frame_start = int(args[0]); scene.frame_end = min(int(args[1]), END); r.threads_mode = 'FIXED'; r.threads = int(os.environ.get('THREADS', 1))
    r.filepath = HERE + '/build/final/f_'; bpy.ops.render.render(animation=True)
    sys.exit(0)
print('END', END, 'poof', fp)
