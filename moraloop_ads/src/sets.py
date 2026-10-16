"""Story settings: each dilemma scene happens in a place that fits it."""
import math
import numpy as np
from clay import W, H

_g = None
OPTS = {}


def world(F):
    global _g
    if _g is None:
        gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
        _g = (gx, gy)
    gx, gy = _g
    return (gx - W / 2) / F.z + F.cx, (gy - H / 2) / F.z + F.cy


def C(*v):
    return np.array(v, np.float32)


def vgrad(img, mask, wy, y0, y1, c0, c1):
    k = np.clip((wy - y0) / (y1 - y0), 0, 1)[..., None]
    col = c0 * (1 - k) + c1 * k
    img[mask] = col[mask]


def hashcol(idx, palette, salt=0):
    h = (idx.astype(np.int64) * 2654435761 + salt * 97) % 1000003
    return palette[(h % len(palette)).astype(np.int64)], h


def finish(F, img, tex=0.7):
    F.cv = img * (1 + F.tex[..., None] * tex)


# ------------------------------------------------------------ indoor base
def indoor(F, wall, floor=(0.66, 0.47, 0.31), planks=True, night=False):
    wx, wy = world(F)
    img = np.empty((H, W, 3), np.float32)
    w = C(*wall) * (0.62 if night else 1.0)
    img[:] = w
    img *= (0.86 + 0.14 * np.clip((wy + 1100) / 1000, 0, 1))[..., None]
    img[(wy > -130) & (wy <= -105)] = C(0.95, 0.93, 0.88) * (0.7 if night else 1)
    fl = wy > -105
    img[fl] = C(*floor) * (0.75 if night else 1)
    if planks:
        pl = np.abs((wx / (140 + (wy + 105) * 0.55) + 50) % 1 - 0.5) < 0.012
        img[fl & pl] = C(*floor) * (0.8 if not night else 0.6)
    return img, wx, wy


def window(F, t, x0=-340, x1=-110, night=False):
    F.poly([(x0, -980), (x1, -980), (x1, -660), (x0, -660)], (0.98, 0.96, 0.9), "winframe", wob=0.004, smooth_it=1)
    sky = (0.12, 0.16, 0.35) if night else (0.55, 0.80, 0.98)
    F.poly([(x0 + 20, -960), (x1 - 20, -960), (x1 - 20, -680), (x0 + 20, -680)], sky, "sky", wob=0.004,
           smooth_it=1, shade=0.4, shadow=0.5, spec=0)
    mx = (x0 + x1) / 2
    if night:
        F.ell((mx - 40, -880), 30, 30, (0.98, 0.95, 0.80), "moon", shadow=0, spec=0.2)
        for i, (sx, sy) in enumerate([(-10, -920), (40, -800), (70, -900), (-70, -720), (30, -710)]):
            F.ell((mx + sx, sy), 5, 5, (1, 1, 0.9), f"star{i}", shadow=0, shade=0)
    else:
        for i, (dx, y, r) in enumerate([(-45, -820, 30), (-10, -840, 36), (30, -820, 28)]):
            F.ell((mx + dx + math.sin(t * 0.3) * 8, y), r, r * 0.8, (1, 1, 1), f"cloud{i}", shadow=0)
    F.cap((mx, -970), (mx, -670), 6, (0.98, 0.96, 0.9), "winbar", shadow=0.2)


def picture(F, x=245):
    F.poly([(x - 95, -960), (x + 95, -960), (x + 95, -800), (x - 95, -800)], (0.92, 0.70, 0.20), "frame", wob=0.005, smooth_it=1, spec=0.3)
    F.poly([(x - 78, -943), (x + 78, -943), (x + 78, -817), (x - 78, -817)], (0.98, 0.94, 0.85), "canvas", wob=0.005,
           smooth_it=1, shadow=0.4, shade=0.4)
    F.ell((x - 40, -905), 20, 20, (0.98, 0.75, 0.15), "sun")
    F.poly([(x - 74, -821), (x - 15, -880), (x + 30, -840), (x + 74, -872), (x + 74, -821)], (0.35, 0.65, 0.40), "hills", smooth_it=1)


def plant(F, x=-260):
    F.poly([(x - 40, -200), (x + 40, -200), (x + 30, -110), (x - 30, -110)], (0.80, 0.40, 0.25), "pot")
    for i, a in enumerate((-0.5, -0.15, 0.2, 0.55)):
        F.ell((x + math.sin(a) * 60, -260 - math.cos(a) * 40), 18, 50, (0.25, 0.55, 0.30), f"leaf{i}", rot=a)


def side_table(F, x, items, emoji):
    F.poly([(x - 85, -330), (x + 85, -330), (x + 85, -300), (x - 85, -300)], (0.55, 0.36, 0.22), "tabletop", smooth_it=1)
    for k in (-1, 1):
        F.cap((x + k * 68, -305), (x + k * 90, -110), 9, (0.45, 0.29, 0.18), f"tleg{k}")
    for i, ch in enumerate(items):
        emoji(F, ch, (x + (i - (len(items) - 1) / 2) * 70, -375), 68, f"ti{i}")


# ------------------------------------------------------------ outdoor base
def outdoor(F, sky0=(0.50, 0.75, 0.98), sky1=(0.88, 0.95, 1.0), ground=(0.45, 0.72, 0.35), horizon=-160):
    wx, wy = world(F)
    img = np.empty((H, W, 3), np.float32)
    vgrad(img, np.ones((H, W), bool), wy, -1400, horizon, C(*sky0), C(*sky1))
    g = wy > horizon
    vgrad(img, g, wy, horizon, 500, C(*ground) * 1.08, C(*ground) * 0.85)
    return img, wx, wy


def trees(F, xs, y=-160, seed="tr"):
    for i, x in enumerate(xs):
        F.cap((x, y), (x, y - 220), 22, (0.45, 0.30, 0.18), f"{seed}tk{i}")
        for j, (dx, dy, r) in enumerate([(0, -300, 110), (-75, -240, 80), (75, -240, 80), (0, -380, 80)]):
            F.ell((x + dx, y + dy), r, r * 0.9, (0.28, 0.58, 0.30), f"{seed}f{i}{j}", spec=0.05)


def hills(F):
    for i, (x, r, c) in enumerate([(-600, 600, (0.55, 0.78, 0.50)), (500, 700, (0.50, 0.74, 0.46))]):
        F.ell((x, -120), r, 220, c, f"hill{i}", shade=0.4, shadow=0, wob=0.006)


# ------------------------------------------------------------ the sets
def draw_set(F, t, name, wall, emoji):
    if name in ("home", "moving"):
        img, *_ = indoor(F, wall)
        finish(F, img)
        window(F, t, -340, -110)
        picture(F, 245)
        if name == "moving":
            for i, (x, y) in enumerate([(-300, -60), (-300, -175), (300, -60), (300, -175), (230, -60)]):
                emoji(F, "📦", (x, y), 120, f"box{i}")
        else:
            plant(F, -320)
    elif name in ("home_night", "gamenight"):
        img, *_ = indoor(F, wall, night=True)
        finish(F, img)
        window(F, t, night=True)
        # warm floor lamp
        F.cap((300, -110), (300, -620), 8, (0.25, 0.22, 0.2), "lamppole")
        F.poly([(235, -720), (365, -720), (390, -610), (210, -610)], (0.98, 0.85, 0.55), "lampshade", shadow=0.3)
        wx, wy = world(F)
        glow = np.exp(-(((wx - 300) / 380) ** 2 + ((wy + 600) / 420) ** 2))
        F.cv = F.cv + glow[..., None] * C(0.30, 0.20, 0.08)
        for i in range(14):  # string lights
            x = -820 + i * 125
            y = -1060 + 40 * math.sin(i * 0.9) ** 2
            col = [(1, 0.8, 0.3), (1, 0.45, 0.45), (0.5, 0.9, 0.6), (0.5, 0.7, 1)][i % 4]
            F.ell((x, y), 12, 16, col, f"sl{i}", shadow=0, shade=0.3)
        if name == "gamenight":
            side_table(F, -300, ["🎲", "🃏"], emoji)
    elif name == "party":
        img, *_ = indoor(F, (0.98, 0.86, 0.70))
        finish(F, img)
        for i in range(16):  # bunting
            x = -900 + i * 120
            y = -1080 + 30 * math.sin(i * 0.8)
            col = [(0.95, 0.35, 0.35), (0.98, 0.80, 0.25), (0.35, 0.70, 0.95), (0.55, 0.85, 0.45)][i % 4]
            F.poly([(x - 45, y), (x + 45, y), (x, y + 75)], col, f"bunt{i}", smooth_it=1, shadow=0.2)
        for i, (x, y, col) in enumerate([(-330, -880, (0.95, 0.3, 0.4)), (-250, -960, (0.3, 0.6, 0.95)), (260, -930, (0.98, 0.8, 0.2)),
                                          (335, -860, (0.6, 0.4, 0.9))]):
            F.cap((x, y + 60), (x + 20, y + 330), 2, (0.4, 0.4, 0.4), f"bs{i}", shadow=0)
            F.ell((x, y), 55, 68, col, f"bal{i}", spec=0.35)
        side_table(F, 300, ["🎂", "🎁"], emoji)
    elif name == "dinner":
        img, *_ = indoor(F, wall)
        finish(F, img)
        window(F, t)
        F.poly([(-620, -340), (620, -340), (620, -300), (-620, -300)], (0.98, 0.98, 0.95), "cloth", smooth_it=1)
        F.poly([(-620, -305), (620, -305), (620, -230), (-620, -230)], (0.90, 0.88, 0.84), "clothdrop", smooth_it=0, shade=0.3)
        for i, x in enumerate((-330, -260, 260, 330)):
            emoji(F, "🍽️", (x, -370), 62, f"pl{i}")
        emoji(F, "🕯️", (0, -395), 60, "cnd")
    elif name == "yard":
        img, wx, wy = outdoor(F)
        # school building with window grid
        b = (np.abs(wx) < 760) & (wy > -1050) & (wy < -160)
        img[b] = C(0.74, 0.38, 0.30)
        win_ = b & (np.abs(((wx + 760) % 190) - 95) < 45) & (np.abs(((wy + 1050) % 230) - 115) < 60) & (wy < -360)
        img[win_] = C(0.70, 0.86, 0.98)
        roof = (np.abs(wx) < 800) & (wy > -1100) & (wy <= -1050)
        img[roof] = C(0.45, 0.25, 0.22)
        door = (np.abs(wx) < 80) & (wy > -360) & (wy < -160)
        img[door] = C(0.40, 0.25, 0.15)
        finish(F, img)
        F.ell((0, -960), 50, 50, (0.98, 0.98, 0.95), "clock", spec=0.3)
        F.cap((0, -960), (0, -995), 4, (0.1, 0.1, 0.1), "ch1", shadow=0)
        F.cap((0, -960), (22, -960), 4, (0.1, 0.1, 0.1), "ch2", shadow=0)
        for i in range(-14, 15):  # fence
            F.cap((i * 60, -150), (i * 60, -330), 5, (0.70, 0.72, 0.75), f"fn{i}", shadow=0.1)
        for y in (-310, -200):
            F.cap((-900, y), (900, y), 4, (0.70, 0.72, 0.75), f"fr{y}", shadow=0.1)
        F.ell((330, 60), 260, 45, (0.62, 0.50, 0.35), "dirt", shade=0.3, shadow=0)
    elif name == "park":
        img, *_ = outdoor(F)
        finish(F, img)
        hills(F)
        trees(F, [-330, 340])
        F.poly([(-120, -150), (120, -150), (420, 600), (-420, 600)], (0.82, 0.76, 0.62), "path", wob=0.003, shade=0.2, shadow=0)
        F.poly([(-330, -240), (-200, -240), (-200, -210), (-330, -210)], (0.55, 0.36, 0.22), "bench", smooth_it=1)
    elif name == "field":
        img, wx, wy = outdoor(F, ground=(0.36, 0.66, 0.30))
        stripe = (wy > -160) & ((np.floor((wx + 3000) / 160) % 2) == 0)
        img[stripe] *= 1.06
        bl = (wy > -620) & (wy < -160)  # bleachers
        rows = bl & ((np.floor((wy + 620) / 70) % 2) == 0)
        img[bl] = C(0.55, 0.58, 0.65)
        img[rows] = C(0.68, 0.70, 0.76)
        finish(F, img)
        for k in (-1, 1):
            F.cap((240 + k * 80, -150), (240 + k * 80, -400), 9, (0.97, 0.97, 0.97), f"gp{k}")
        F.cap((160, -400), (320, -400), 9, (0.97, 0.97, 0.97), "gbar")
        F.cap((-900, 40), (900, 40), 5, (0.95, 0.95, 0.95), "line", shadow=0, shade=0)
    elif name == "library":
        img, wx, wy = indoor(F, (0.86, 0.76, 0.60), floor=(0.55, 0.26, 0.26), planks=False)
        shelf = (np.abs(wx) < 820) & (wy > -980) & (wy < -130)
        img[shelf] = C(0.42, 0.27, 0.16)
        row = np.floor((wy + 980) / 170)
        inrow = shelf & (((wy + 980) % 170) > 22)
        col = np.floor((wx + 3000) / 26)
        pal = np.array([(0.80, 0.25, 0.25), (0.25, 0.45, 0.80), (0.90, 0.75, 0.30), (0.30, 0.62, 0.40), (0.60, 0.35, 0.70),
                        (0.95, 0.55, 0.25), (0.85, 0.85, 0.80)], np.float32)
        bc, hsh = hashcol(col + row * 131, pal)
        top = (wy + 980) % 170 > 22 + (hsh % 40)
        books = inrow & top & ((wx + 3000) % 26 > 3)
        img[books] = bc[books]
        finish(F, img)
    elif name == "classroom":
        img, *_ = indoor(F, (0.80, 0.88, 0.78), floor=(0.82, 0.80, 0.74), planks=False)
        finish(F, img)
        F.poly([(-330, -1070), (330, -1070), (330, -780), (-330, -780)], (0.55, 0.38, 0.22), "bframe", wob=0.003, smooth_it=1)
        F.poly([(-305, -1048), (305, -1048), (305, -802), (-305, -802)], (0.16, 0.32, 0.24), "board", wob=0.003, smooth_it=1,
               shade=0.3, shadow=0.5, spec=0)
        F.text("A + B = ?", (0, -925), 62, (0.95, 0.95, 0.92), font="/usr/share/fonts/opentype/inter/Inter-SemiBold.otf",
               seed="chalk", shade=0.2, shadow=0, spec=0)
        for k in (-1, 1):
            x = k * 320
            F.poly([(x - 90, -330), (x + 90, -330), (x + 90, -300), (x - 90, -300)], (0.75, 0.55, 0.32), f"desk{k}", smooth_it=1)
            F.cap((x - 70, -305), (x - 70, -110), 8, (0.5, 0.5, 0.52), f"dl{k}a")
            F.cap((x + 70, -305), (x + 70, -110), 8, (0.5, 0.5, 0.52), f"dl{k}b")
            emoji(F, "📚" if k < 0 else "✏️", (x, -370), 60, f"de{k}")
    elif name == "office":
        img, wx, wy = indoor(F, (0.86, 0.87, 0.86), floor=(0.45, 0.50, 0.58), planks=False)
        win_ = (wx > -350) & (wx < -110) & (wy > -1000) & (wy < -680)
        img[win_] = C(0.70, 0.84, 0.95)
        blinds = win_ & (((wy + 1000) % 30) < 9)
        img[blinds] = C(0.92, 0.92, 0.90)
        finish(F, img)
        F.poly([(190, -340), (420, -340), (420, -305), (190, -305)], (0.92, 0.92, 0.94), "odesk", smooth_it=1)
        for x in (215, 395):
            F.cap((x, -310), (x, -110), 8, (0.4, 0.4, 0.45), f"odl{x}")
        emoji(F, "🖥️", (290, -415), 110, "mon")
        emoji(F, "☕", (375, -372), 45, "mug")
        plant(F, -320)
    elif name == "store":
        img, wx, wy = indoor(F, (0.95, 0.94, 0.90), floor=(0.88, 0.88, 0.86), planks=False)
        fl = wy > -105
        chk = fl & (((np.floor((wx + 3000) / 90) + np.floor((wy + 3000) / 45)) % 2) == 0)
        img[chk] = C(0.72, 0.74, 0.76)
        sh = (wx > -420) & (wx < -170) & (wy > -1050) & (wy < -130)
        img[sh] = C(0.75, 0.76, 0.78)
        rowm = sh & (((wy + 1050) % 150) > 20)
        pal = np.array([(0.90, 0.30, 0.30), (0.95, 0.80, 0.25), (0.30, 0.60, 0.90), (0.40, 0.75, 0.40), (0.95, 0.55, 0.20)], np.float32)
        bc, hsh = hashcol(np.floor((wx + 3000) / 60) + np.floor((wy + 1050) / 150) * 57, pal)
        box = rowm & (((wx + 3000) % 60) > 8) & (((wy + 1050) % 150) > 20 + (hsh % 35))
        img[box] = bc[box]
        finish(F, img)
        F.poly([(190, -360), (520, -360), (520, -110), (190, -110)], (0.40, 0.55, 0.70), "counter", wob=0.003, smooth_it=1)
        F.poly([(175, -380), (530, -380), (530, -350), (175, -350)], (0.92, 0.92, 0.92), "ctop", smooth_it=1)
        emoji(F, "🧾", (300, -430), 65, "rcpt")
        emoji(F, "🛒", (-320, 40), 100, "cart")
    elif name == "hall":
        img, *_ = indoor(F, (0.93, 0.88, 0.76))
        finish(F, img)
        F.poly([(-760, -340), (760, -340), (760, -300), (-760, -300)], (0.97, 0.97, 0.95), "htable", smooth_it=1)
        F.poly([(-760, -305), (760, -305), (760, -220), (-760, -220)], (0.85, 0.30, 0.30), "hcloth", smooth_it=0, shade=0.3)
        for i, (x, ch) in enumerate([(-330, "🍲"), (-260, "🥖"), (260, "🍎"), (330, "🥗")]):
            emoji(F, ch, (x, -385), 70, f"hf{i}")
        for i in range(16):
            x = -900 + i * 120
            y = -1080 + 25 * math.sin(i * 0.8)
            col = [(0.95, 0.35, 0.35), (0.98, 0.80, 0.25), (0.35, 0.70, 0.95)][i % 3]
            F.poly([(x - 45, y), (x + 45, y), (x, y + 70)], col, f"hb{i}", smooth_it=1, shadow=0.2)
    elif name == "street":
        img, wx, wy = outdoor(F, ground=(0.62, 0.62, 0.64), horizon=-150)
        shops = (wy > -900) & (wy < -150)
        pal = np.array([(0.90, 0.60, 0.50), (0.60, 0.75, 0.85), (0.95, 0.85, 0.60), (0.70, 0.85, 0.65)], np.float32)
        bc, _ = hashcol(np.floor((wx + 3000) / 420), pal)
        img[shops] = bc[shops]
        sw = shops & (np.abs(((wx + 3000) % 420) - 210) < 130) & (wy > -620) & (wy < -260)
        img[sw] = C(0.75, 0.88, 0.96)
        curb = (wy > -150) & (wy < -120)
        img[curb] = C(0.80, 0.80, 0.80)
        finish(F, img)
        for i, x in enumerate((-630, -210, 210, 630)):
            col = [(0.85, 0.25, 0.25), (0.25, 0.55, 0.85), (0.30, 0.65, 0.40), (0.95, 0.65, 0.20)][i]
            F.poly([(x - 150, -680), (x + 150, -680), (x + 175, -610), (x - 175, -610)], col, f"awn{i}", smooth_it=1)
    elif name == "tracks":
        img, wx, wy = outdoor(F, ground=(0.50, 0.68, 0.38), horizon=-260)
        g = wy > -260
        d = np.maximum(wy + 260, 1)
        # perspective track running from the horizon to the lower left
        cxl = -40 - d * 0.42
        half = 14 + d * 0.24
        bed = g & (np.abs(wx - cxl) < half * 1.35)
        img[bed] = C(0.55, 0.50, 0.45)
        ties = bed & (np.abs(wx - cxl) < half * 1.2) & ((np.log(d) * 9) % 1 < 0.45)
        img[ties] = C(0.42, 0.28, 0.18)
        rails = g & (np.abs(np.abs(wx - cxl) - half * 0.85) < (2 + d * 0.012))
        img[rails] = C(0.75, 0.76, 0.80)
        finish(F, img)
        # lever
        F.poly([(170, -60), (270, -60), (270, -10), (170, -10)], (0.35, 0.35, 0.38), "lvbase", smooth_it=1)
        if OPTS.get("broken_lever"):  # snapped lever: stub + broken piece on the ground
            F.cap((220, -40), (240, -105), 9, (0.55, 0.55, 0.6), "lvstub")
            F.cap((300, -15), (395, -40), 9, (0.55, 0.55, 0.6), "lvpiece")
            F.ell((400, -42), 20, 20, (0.85, 0.15, 0.15), "lvknob", spec=0.3)
            emoji(F, "❌", (240, -170), 55, "lvx")
        else:
            F.cap((220, -40), (290, -230), 9, (0.55, 0.55, 0.6), "lvstick")
            F.ell((290, -235), 20, 20, (0.85, 0.15, 0.15), "lvknob", spec=0.3)
        emoji(F, OPTS.get("train", "🚋"), (-70, -330), 90, "tram")
    elif name == "sea":
        img, wx, wy = outdoor(F, sky0=(0.35, 0.40, 0.50), sky1=(0.62, 0.68, 0.74), ground=(0.18, 0.40, 0.58), horizon=-380)
        waves = (wy > -380) & (np.sin(wx / 60 + np.sin(wy / 40) * 2 + F.bi * 0.8) > 0.85)
        img[waves] = C(0.70, 0.82, 0.90)
        dock = wy > -60
        img[dock] = C(0.58, 0.42, 0.28)
        dl = dock & (((wy + 60) % 40) < 4)
        img[dl] = C(0.45, 0.32, 0.20)
        finish(F, img)
        emoji(F, "🚤", (-220, -430 + math.sin(t * 2) * 8), 170, "sink", rot=-25)
        emoji(F, "🛟", (290, -150), 100, "ring")
        F.cap((290, -60), (290, -260), 14, (0.45, 0.32, 0.2), "post")
    elif name == "fire":
        img, wx, wy = outdoor(F, sky0=(0.25, 0.18, 0.22), sky1=(0.85, 0.45, 0.25), ground=(0.40, 0.40, 0.42), horizon=-150)
        bld = (np.abs(wx) < 420) & (wy > -1150) & (wy < -150)
        img[bld] = C(0.42, 0.36, 0.34)
        win_ = bld & (np.abs(((wx + 420) % 140) - 70) < 34) & (np.abs(((wy + 1150) % 170) - 85) < 45)
        img[win_] = C(0.98, 0.65, 0.20)
        finish(F, img)
        for i in range(7):
            x = -350 + i * 115
            h = 160 + 60 * math.sin(i * 1.7 + F.bi * 0.9)
            F.poly([(x - 60, -820), (x + 60, -820), (x + 10, -820 - h), (x - 10, -820 - h * 0.7)], (0.98, 0.50, 0.12), f"fl{i}",
                   smooth_it=2, shadow=0, spec=0.2)
            F.poly([(x - 30, -820), (x + 30, -820), (x, -820 - h * 0.55)], (1.0, 0.85, 0.30), f"fy{i}", smooth_it=2, shadow=0)
        for i in range(4):
            F.ell((-200 + i * 140, -1180 - i * 60 - (t * 20) % 60), 120, 80, (0.35, 0.33, 0.35), f"smk{i}", shadow=0, alpha=0.8)
        if not OPTS.get("no_truck"):
            emoji(F, "🚒", (300, -80), 150, "truck")
    elif name == "lifeboat":
        img, wx, wy = outdoor(F, sky0=(0.33, 0.38, 0.48), sky1=(0.60, 0.66, 0.72), ground=(0.18, 0.40, 0.58), horizon=-430)
        waves = (wy > -430) & (np.sin(wx / 55 + np.sin(wy / 35) * 2 + F.bi * 0.8) > 0.86)
        img[waves] = C(0.70, 0.82, 0.90)
        finish(F, img)
        emoji(F, "🚢", (-230, -500), 230, "ship", rot=-18)
        F.poly([(-700, -470), (700, -470), (700, -380), (-700, -380)], (0.20, 0.42, 0.60), "shipwater", wob=0.01, smooth_it=1, shade=0.2, shadow=0)
    elif name == "cafe":
        img, *_ = indoor(F, (0.62, 0.44, 0.32))
        finish(F, img)
        F.poly([(-340, -1040), (-110, -1040), (-110, -780), (-340, -780)], (0.15, 0.15, 0.15), "menu", smooth_it=1, shade=0.3)
        for i, y in enumerate((-990, -945, -900, -855, -810)):
            F.cap((-310, y), (-150 - (i % 2) * 40, y), 5, (0.95, 0.95, 0.9), f"mt{i}", shadow=0, shade=0)
        F.poly([(190, -360), (520, -360), (520, -110), (190, -110)], (0.40, 0.26, 0.18), "ccounter", smooth_it=1)
        emoji(F, "☕", (270, -420), 65, "cup")
        emoji(F, "🥐", (380, -415), 60, "crois")
    else:
        img, *_ = indoor(F, wall)
        finish(F, img)
