"""Claymation-style renderer for the Moral Loop short."""
import math, sys, os, zlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

S_DIR = os.path.dirname(os.path.abspath(__file__))
W, H = int(os.environ.get("W", 1080)), int(os.environ.get("H", 1920))
FPS = 24
DUR = 27.0
CARD = 22.0  # end card with logo + App Store badge

FONT_CAP = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FONT_TITLE = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
for f in ["/usr/share/fonts/opentype/inter/InterDisplay-Black.otf", "/usr/share/fonts/opentype/inter/Inter-Black.otf"]:
    if os.path.exists(f):
        FONT_TITLE = f
        break

# ---------------------------------------------------------------- timeline
LINES = [  # (start, text)
    (2.3, "Hello. I have a question for you."),
    (5.1, "You find out your two best friends are dating... but one of them is cheating on the other."),
    (11.0, "Do you keep the secret... or tell your friend?"),
    (18.3, "What will you do?"),
    (20.4, "More questions like this on"),
]
CUTS = [4.75, 10.75, 14.2, 18.0]
XF = 0.14  # half crossfade


def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def ramp(t, a, b):
    return smooth((t - a) / (b - a))


def lerp(a, b, k):
    if isinstance(a, tuple):
        return tuple(lerp(x, y, k) for x, y in zip(a, b))
    return a + (b - a) * k


def back_out(x):
    x = min(max(x, 0.0), 1.0)
    c = 2.2
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


# ---------------------------------------------------------------- audio envelope (lip sync)
SR = 24000
_voice = None
_env = None


def load_voice():
    import soundfile as sf
    global _voice, _env
    total = np.zeros(int(SR * (DUR + 1)), np.float32)
    for i, (st, _) in enumerate(LINES):
        a, sr = sf.read(f"{S_DIR}/audio/l{i}.wav", dtype="float32")
        s = int(st * SR)
        total[s:s + len(a)] += a[: len(total) - s]
    _voice = total
    n = int(DUR * FPS) + 2
    env = np.zeros(n)
    w = int(0.035 * SR)
    for f in range(n):
        c = int(f / FPS * SR)
        seg = total[max(0, c - w):c + w]
        env[f] = np.sqrt(np.mean(seg ** 2)) if len(seg) else 0
    env /= np.quantile(env[env > 0.003], 0.9) + 1e-6
    # light smoothing
    env = np.convolve(env, [0.25, 0.5, 0.25], mode="same")
    _env = np.clip(env, 0, 1.3)
    return total


def mouth_env(t):
    f = int(t * FPS)
    if _env is None or f >= len(_env):
        return 0.0
    return float(_env[f])


# ---------------------------------------------------------------- texture
rng0 = np.random.default_rng(7)
_tex_big = None


def tex_for(bi):
    global _tex_big
    if _tex_big is None:
        n = rng0.normal(0, 1, (H + 128, W + 128)).astype(np.float32)
        im = Image.fromarray(((n * 40) + 128).clip(0, 255).astype(np.uint8))
        fine = np.asarray(im.filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 128 - 1
        coarse = np.asarray(im.filter(ImageFilter.GaussianBlur(H / 160)), np.float32) / 128 - 1
        _tex_big = fine * 0.10 + coarse * 0.55
    ox, oy = (bi * 37) % 128, (bi * 53) % 128
    return _tex_big[oy:oy + H, ox:ox + W]


# ---------------------------------------------------------------- frame / camera
class Frame:
    def __init__(self, t, cam, bg=(0, 0, 0)):
        self.t = t
        self.bi = int(t * 12)  # animate "on twos": clay boils at 12 fps
        self.cx, self.cy, vh = cam
        self.z = H / vh
        self.cv = np.zeros((H, W, 3), np.float32)
        self.cv[:] = bg
        self.tex = tex_for(self.bi)

    def S(self, pts):
        p = np.asarray(pts, np.float64)
        out = np.empty_like(p)
        out[:, 0] = (p[:, 0] - self.cx) * self.z + W / 2
        out[:, 1] = (p[:, 1] - self.cy) * self.z + H / 2
        return out

    # world-space wobble so clay "boils" between stop-motion frames
    def wob(self, seed, n, amp):
        r = np.random.default_rng(zlib.crc32(f"{seed}|{self.bi}".encode()))
        k = np.arange(n) / n * 2 * math.pi
        out = np.zeros(n)
        for j in (2, 3, 5):
            out += r.uniform(-1, 1) * np.sin(j * k + r.uniform(0, 6.3)) / j
        return out * amp

    # --- core clay shading on an arbitrary drawn mask
    def _clay(self, bbox, drawfn, col, shade=1.0, shadow=0.35, spec=0.10, tex=1.0, alpha=1.0):
        x0, y0, x1, y1 = bbox
        size = max(2.0, min(x1 - x0, y1 - y0))
        r = float(np.clip(size * 0.22, 1.2, 160))
        pad = int(r * 2.2) + 3
        X0 = int(max(math.floor(x0) - pad, -pad))
        Y0 = int(max(math.floor(y0) - pad, -pad))
        X1 = int(min(math.ceil(x1) + pad, W + pad))
        Y1 = int(min(math.ceil(y1) + pad, H + pad))
        if X1 <= max(X0, 0) or Y1 <= max(Y0, 0) or X0 >= W or Y0 >= H:
            return
        ww, hh = X1 - X0, Y1 - Y0
        if ww <= 0 or hh <= 0 or ww * hh > 30e6:
            return

        def mask(ox, oy, blur=0):
            im = Image.new("L", (ww * 2, hh * 2), 0)
            drawfn(ImageDraw.Draw(im), lambda x, y: ((x - X0 + ox) * 2, (y - Y0 + oy) * 2), 2)
            im = im.resize((ww, hh), Image.BOX)
            if blur:
                im = im.filter(ImageFilter.GaussianBlur(blur))
            return np.asarray(im, np.float32) / 255

        m = mask(0, 0)
        # visible slice
        sx0, sy0 = max(0, -X0), max(0, -Y0)
        sx1, sy1 = ww - max(0, X1 - W), hh - max(0, Y1 - H)
        reg = self.cv[Y0 + sy0:Y0 + sy1, X0 + sx0:X0 + sx1]
        mm = m[sy0:sy1, sx0:sx1] * alpha
        if mm.size == 0 or mm.max() <= 0:
            return
        if shadow > 0:
            sh = mask(r * 0.30, r * 0.45, r * 0.7)[sy0:sy1, sx0:sx1]
            reg *= (1 - shadow * sh * alpha)[..., None]
        col = np.asarray(col, np.float32)
        if shade > 0:
            L = mask(-r * 0.28, -r * 0.38, r)[sy0:sy1, sx0:sx1]
            k = 1 - shade * (1 - (0.52 + 0.56 * L ** 1.25))
            sp = spec * np.clip((L - 0.82) / 0.18, 0, 1) ** 2
        else:
            k = np.ones_like(mm)
            sp = 0
        tx = self.tex[Y0 + sy0:Y0 + sy1, X0 + sx0:X0 + sx1] * tex
        c = col[None, None, :] * (k * (1 + tx))[..., None] + (sp[..., None] if shade > 0 else 0)
        reg[:] = reg * (1 - mm[..., None]) + c * mm[..., None]

    def poly(self, pts_world, col, seed, wob=0.012, smooth_it=2, **kw):
        p = np.asarray(pts_world, np.float64)
        for _ in range(smooth_it):  # chaikin = soft clay corners
            q = np.roll(p, -1, axis=0)
            p = np.stack([0.75 * p + 0.25 * q, 0.25 * p + 0.75 * q], 1).reshape(-1, 2)
        size = max(np.ptp(p[:, 0]), np.ptp(p[:, 1]))
        n = len(p)
        p = p + np.stack([self.wob(seed + "x", n, size * wob), self.wob(seed + "y", n, size * wob)], 1)
        s = self.S(p)
        bbox = (s[:, 0].min(), s[:, 1].min(), s[:, 0].max(), s[:, 1].max())
        pts = [tuple(v) for v in s]
        self._clay(bbox, lambda d, T, sc: d.polygon([T(x, y) for x, y in pts], fill=255), col, **kw)

    def ell(self, c, rx, ry, col, seed, rot=0.0, wob=0.018, n=56, **kw):
        a = np.arange(n) / n * 2 * math.pi
        rr = 1 + self.wob(seed, n, wob)
        x, y = np.cos(a) * rx * rr, np.sin(a) * ry * rr
        cr, sr = math.cos(rot), math.sin(rot)
        p = np.stack([c[0] + x * cr - y * sr, c[1] + x * sr + y * cr], 1)
        self.poly(p, col, seed, wob=0, smooth_it=0, **kw)

    def cap(self, a, b, rad, col, seed, rad2=None, **kw):
        rad2 = rad if rad2 is None else rad2
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        pts = []
        for i in range(13):
            th = ang + math.pi / 2 + i / 12 * math.pi
            pts.append((a[0] + math.cos(th) * rad, a[1] + math.sin(th) * rad))
        for i in range(13):
            th = ang - math.pi / 2 + i / 12 * math.pi
            pts.append((b[0] + math.cos(th) * rad2, b[1] + math.sin(th) * rad2))
        self.poly(pts, col, seed, wob=0.01, smooth_it=1, **kw)

    def limb(self, pts, rad, col, seed, **kw):
        for i in range(len(pts) - 1):
            self.cap(pts[i], pts[i + 1], rad, col, f"{seed}{i}", **kw)

    def text(self, s, c, size_w, col, font=FONT_TITLE, seed="t", stroke_div=14, **kw):
        px = max(4, int(size_w * self.z))
        fnt = ImageFont.truetype(font, px * 2)
        sc = self.S([c])[0]
        tmp = ImageDraw.Draw(Image.new("L", (4, 4)))
        bb = tmp.textbbox((0, 0), s, font=fnt, anchor="mm")
        jx, jy = self.wob(seed, 2, px * 0.03)
        cx, cy = sc[0] + jx, sc[1] + jy
        bbox = (cx + bb[0] / 2, cy + bb[1] / 2, cx + bb[2] / 2, cy + bb[3] / 2)
        stroke = max(1, px // stroke_div)
        self._clay(bbox, lambda d, T, k: d.text(T(cx, cy), s, font=fnt, fill=255, anchor="mm",
                                                stroke_width=stroke * 2, stroke_fill=255), col, **kw)

    def mouth(self, c, w, open_, smile, col, seed, **kw):
        u = np.linspace(-1, 1, 15)
        curve = smile * w * 0.28 * (1 - u ** 2)
        thick = np.sqrt(np.clip(1 - u ** 2, 0, 1))
        up = c[1] + curve - open_ * 0.35 * thick - w * 0.05
        lo = c[1] + curve + open_ * thick + w * 0.05
        xs = c[0] + u * w
        pts = list(zip(xs, up)) + list(zip(xs[::-1], lo[::-1]))
        self.poly(pts, col, seed, wob=0.01, smooth_it=1, shadow=0.0, spec=0.0, **kw)
        if open_ > w * 0.35:  # tongue
            self.ell((c[0], c[1] + curve[7] + open_ * 0.6), w * 0.45, open_ * 0.28,
                     (0.80, 0.35, 0.38), seed + "tg", shadow=0, spec=0)

    def heart(self, c, s, col, seed, split=0.0, **kw):
        # two lobes + point; split pulls halves apart (broken heart)
        for side in (-1, 1):
            dx = side * split
            rot = side * split * 0.02
            self.poly([(c[0] + dx, c[1] - s * 0.15),
                       (c[0] + dx + side * s * 0.05, c[1] - s * 0.55),
                       (c[0] + dx + side * s * 0.5, c[1] - s * 0.75),
                       (c[0] + dx + side * s * 1.0, c[1] - s * 0.45),
                       (c[0] + dx + side * s * 0.9, c[1] + s * 0.05),
                       (c[0] + dx + side * s * 0.1, c[1] + s * 0.85 - split * 0.4),
                       (c[0] + dx, c[1] + s * 0.95)] if True else [],
                      col, f"{seed}{side}", **kw)

    def finish(self):
        return self.cv


# ---------------------------------------------------------------- characters
SKIN = (0.93, 0.71, 0.57)
SUIT = (0.15, 0.19, 0.32)
SUIT_D = (0.10, 0.13, 0.23)
SHIRT = (0.96, 0.95, 0.91)
TIE = (0.78, 0.12, 0.14)
HAIR = (0.24, 0.15, 0.09)
DARK = (0.08, 0.06, 0.06)
MOUTH = (0.35, 0.08, 0.10)


def draw_man(F, t):
    # breathing + talk bob
    env = mouth_env(t)
    br = math.sin(t * 2.1) * 2.0
    lean = ramp(t, 18.05, 18.5) * (1 - ramp(t, 20.0, 20.8))  # leans in at "What will you do?"
    bob = env * 3 * math.sin(t * 9)
    hx = math.sin(t * 0.9) * 3 + lean * 2
    hy = -680 + br * 0.5 + bob - lean * 6
    tilt = math.sin(t * 0.7) * 0.04 + lean * 0.10

    # legs + shoes
    for s in (-1, 1):
        F.cap((s * 45, -270), (s * 50, -25), 40, SUIT_D, f"leg{s}")
        F.ell((s * 58, -12), 56, 22, DARK, f"shoe{s}", spec=0.3)

    # arm pose: rest -> shrug (palms up) at "What will you do?"
    sh = ramp(t, 18.05, 18.55) * (1 - ramp(t, 20.1, 20.9))
    # small hand gesture during first lines
    g1 = ramp(t, 2.4, 2.9) * (1 - ramp(t, 4.0, 4.6)) + ramp(t, 11.2, 11.7) * (1 - ramp(t, 13.7, 14.2))
    arms = []
    for s in (-1, 1):
        shoulder = (s * 128, -535 + br)
        elbow = lerp((s * 150, -405), (s * 165, -440), sh)
        hand = lerp((s * 140, -275), (s * 100, -555), sh)
        if s == 1:  # right hand gestures while talking
            elbow = lerp(elbow, (165, -400), g1 * (1 - sh))
            hand = lerp(hand, (90, -420 + math.sin(t * 5) * 6), g1 * (1 - sh))
        arms.append((s, shoulder, elbow, hand))

    # torso
    torso = [(-152, -515 + br), (-118, -555 + br), (-42, -572 + br), (42, -572 + br), (118, -555 + br),
             (152, -515 + br), (138, -250), (-138, -250)]
    # neck behind collar
    F.cap((hx * 0.5, -610), (0, -560), 34, (0.85, 0.62, 0.50), "neck", shadow=0.2)
    F.poly(torso, SUIT, "torso", spec=0.08)
    F.poly([(-44, -572 + br), (44, -572 + br), (0, -432)], SHIRT, "shirt", smooth_it=1)
    F.poly([(-14, -548), (14, -548), (24, -445), (0, -418), (-24, -445)], TIE, "tie", smooth_it=1, spec=0.25)
    F.ell((0, -556), 16, 13, (0.70, 0.10, 0.12), "knot")
    for s in (-1, 1):  # lapels + collar points
        F.poly([(s * 44, -572 + br), (s * 72, -555 + br), (s * 58, -500), (s * 20, -425), (s * 8, -440)],
               SUIT_D, f"lapel{s}", smooth_it=1, shadow=0.45)
        F.poly([(s * 6, -578), (s * 42, -578), (s * 26, -545)], SHIRT, f"collar{s}", smooth_it=1, shadow=0.3)
    for i, y in enumerate((-395, -340)):
        F.ell((0, y), 7, 7, DARK, f"btn{i}", spec=0.4, shadow=0.2)
    F.poly([(-112, -468), (-72, -468), (-74, -458), (-110, -458)], SHIRT, "pocketsq", smooth_it=1, shadow=0.2)

    # head
    cx, cy = hx, hy
    rot = tilt
    cr, sr = math.cos(rot), math.sin(rot)

    def H_(x, y):  # head-local -> world
        return (cx + x * cr - y * sr, cy + x * sr + y * cr)

    for s in (-1, 1):
        F.ell(H_(s * 78, 2), 15, 24, (0.88, 0.64, 0.52), f"ear{s}", rot=rot)
    F.ell((cx, cy), 80, 94, SKIN, "head", rot=rot, spec=0.14)
    # hair cap with side part
    hair = []
    for i in range(23):
        a = math.pi * (1.05 + i / 22 * 0.9)
        hair.append(H_(math.cos(a) * 86, math.sin(a) * 102 - 4))
    hair += [H_(84, -18), H_(60, -52), H_(20, -66), H_(-30, -60), H_(-58, -48), H_(-82, -20)]
    F.poly(hair, HAIR, "hair", smooth_it=2, spec=0.12, shadow=0.4)
    F.ell(H_(-10, -86), 52, 14, (0.32, 0.21, 0.13), "hairhl", rot=rot - 0.1, shadow=0)
    # blush
    for s in (-1, 1):
        F.ell(H_(s * 46, 22), 15, 9, (0.95, 0.58, 0.52), f"blush{s}", rot=rot, shade=0.2, shadow=0, alpha=0.55)
    # eyes
    blink_t = (t * 1.0) % 3.4
    blink = 0.12 if (1.20 < blink_t < 1.32) else 1.0
    if t > 18.1 and t < 20.1:
        blink = 1.15  # wide, intense
    brow_up = 6 + 9 * sh + 5 * ramp(t, 2.3, 2.6) * (1 - ramp(t, 3.0, 3.4)) + 5 * (env > 0.7)
    look = (math.sin(t * 0.6) * 1.5, 0)
    for s in (-1, 1):
        ex, ey = s * 30, -12
        F.ell(H_(ex, ey), 16, 18 * blink, (0.98, 0.97, 0.95), f"eye{s}", rot=rot, shadow=0.25, spec=0.2)
        if blink > 0.3:
            F.ell(H_(ex + look[0], ey + 2), 8, 8 * min(1, blink), (0.18, 0.12, 0.08), f"pup{s}", rot=rot, shadow=0, spec=0)
            F.ell(H_(ex + look[0] - 3, ey - 2), 2.6, 2.6, (1, 1, 1), f"glint{s}", shadow=0, shade=0)
        # brows (right brow arches higher on the question)
        extra = 5 * sh if s == 1 else 0
        F.cap(H_(ex - 16, ey - 22 - brow_up - extra * 0.3), H_(ex + 16, ey - 26 - brow_up - extra), 5.5, HAIR,
              f"brow{s}", shadow=0.2)
    # nose
    F.ell(H_(0, 12), 13, 18, (0.90, 0.64, 0.50), "nose", rot=rot, shadow=0.35, spec=0.2)
    # mouth (lip-synced)
    smile = 0.25 + 0.5 * ramp(t, 20.3, 20.9) + 0.4 * ramp(t, 23.4, 23.8)
    smile -= 0.35 * sh
    F.mouth(H_(0, 44), 22, 2 + 20 * min(1, env), smile, MOUTH, "mouth")

    # arms in front
    for s, shoulder, elbow, hand in arms:
        F.limb([shoulder, elbow, hand], 33, SUIT, f"arm{s}", shadow=0.4)
        F.ell(hand, 20, 14, SHIRT, f"cuff{s}", rot=math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]) + math.pi / 2)
        palm_up = sh > 0.5
        hpos = (hand[0] + s * 4, hand[1] + (-8 if palm_up else 18))
        F.ell(hpos, 22, 20, SKIN, f"hand{s}", spec=0.12)
        if palm_up:
            F.ell((hpos[0] + s * 18, hpos[1] - 14), 8, 14, SKIN, f"thumb{s}", rot=s * 0.5)


def friend_parts(F, t, base_x, f, P, kind):
    """kind A: orange hoodie, curly hair. kind B: green shirt, brown hair."""
    if kind == "A":
        skin, top, pants, hairc, shoe = (0.62, 0.42, 0.30), (0.96, 0.55, 0.20), (0.22, 0.29, 0.48), (0.10, 0.08, 0.08), (0.95, 0.95, 0.95)
    else:
        skin, top, pants, hairc, shoe = (0.96, 0.78, 0.65), (0.33, 0.66, 0.42), (0.68, 0.57, 0.40), (0.45, 0.27, 0.13), (0.85, 0.20, 0.20)
    X = lambda x, y: (base_x + x, y)
    bounce = math.sin(t * 2.3 + (0 if kind == "A" else 1.4)) * 2.5
    F.ell(X(0, 0), 110, 18, (0, 0, 0), kind + "shadow", shade=0, shadow=0, alpha=0.25, tex=0)
    for s in (-1, 1):
        F.cap(X(s * 28, -205), X(s * 32, -28), 24, pants, f"{kind}leg{s}")
        F.ell(X(s * 34 + f * 12, -12), 36, 17, shoe, f"{kind}shoe{s}", spec=0.25)
    F.poly([X(-74, -420 + bounce), X(74, -420 + bounce), X(90, -195), X(-90, -195)], top, kind + "torso", spec=0.08)
    if kind == "A":  # hoodie pocket + strings
        F.poly([X(-48, -285), X(48, -285), X(58, -225), X(-58, -225)], (0.88, 0.48, 0.16), "Apocket", shadow=0.3)
        for s in (-1, 1):
            F.cap(X(s * 14, -410), X(s * 16, -360), 3.5, (0.98, 0.95, 0.9), f"Astr{s}", shadow=0.2)
    else:
        F.poly([X(-26, -422 + bounce), X(26, -422 + bounce), X(0, -392)], skin, "Bneckv", smooth_it=1, shadow=0.2)

    lean = P.get("lean", 0)
    hx, hy = base_x + f * 8 + lean, -508 + bounce + P.get("hy", 0)
    shake = P.get("shake", 0)
    hx += math.sin(t * 60) * shake
    F.ell((hx, hy), 72, 76, skin, kind + "head", spec=0.14)
    fx = hx + f * 16
    # hair
    if kind == "A":
        for i in range(11):
            a = math.pi * (1.0 + i / 10)
            F.ell((hx + math.cos(a) * 64, hy + math.sin(a) * 66 - 6), 24, 24, hairc, f"Acurl{i}", spec=0.1, shadow=0.3)
        F.ell((hx, hy - 62), 48, 26, hairc, "Acurlmid", shadow=0.3)
    else:
        hp = []
        for i in range(21):
            a = math.pi * (1.02 + i / 20 * 0.96)
            hp.append((hx + math.cos(a) * 78, hy + math.sin(a) * 82 - 3))
        hp += [(hx + 76, hy - 5), (hx + 50 - f * 10, hy - 45), (hx + 10 - f * 20, hy - 52), (hx - 50 - f * 10, hy - 40), (hx - 78, hy - 5)]
        F.poly(hp, hairc, "Bhair", spec=0.12, shadow=0.4)
    # face
    eo = P.get("eye", 1.0)
    lx, ly = P.get("look", (f * 3, 0))
    brow = P.get("brow", 0)
    for s in (-1, 1):
        ex = fx + s * 23
        ey = hy - 8
        F.ell((ex, ey), 13 * P.get("eyew", 1), 15 * eo, (0.98, 0.97, 0.95), f"{kind}eye{s}", shadow=0.2, spec=0.2)
        pr = 6.5 * P.get("pup", 1)
        F.ell((ex + lx, ey + ly), pr, pr, (0.12, 0.08, 0.06), f"{kind}pup{s}", shadow=0, spec=0)
        F.ell((ex + lx - 2, ey + ly - 2), 2, 2, (1, 1, 1), f"{kind}gl{s}", shadow=0, shade=0)
        tilt = P.get("browtilt", 0) * s
        F.cap((ex - 13, ey - 22 - brow + tilt), (ex + 13, ey - 24 - brow - tilt), 4.5, hairc, f"{kind}brow{s}", shadow=0.15)
        F.ell((ex + s * 6, hy + 22), 12, 7, (0.95, 0.55, 0.50), f"{kind}bl{s}", shade=0.2, shadow=0, alpha=0.45)
    F.ell((fx + f * 8, hy + 10), 9, 11, tuple(c * 0.92 for c in skin), kind + "nose", shadow=0.3)
    F.mouth((fx + f * 4, hy + 36), P.get("mw", 15), P.get("mo", 1), P.get("smile", 0.2), MOUTH, kind + "mouth")
    # arms (local poses)
    for s in (-1, 1):
        el, hd = P["arms"][s]
        sh_ = X(s * 66, -398 + bounce)
        F.limb([sh_, X(*el), X(*hd)], 21, top, f"{kind}arm{s}", shadow=0.35)
        F.ell(X(*hd), 17, 17, skin, f"{kind}hand{s}", spec=0.12)


REST = {-1: ((-86, -300), (-90, -212)), 1: ((86, -300), (90, -212))}


# ---------------------------------------------------------------- scenes
def lighting_man(F, t):
    gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
    wx = (gx - W / 2) / F.z + F.cx
    wy = (gy - H / 2) / F.z + F.cy
    on = 0.0
    if t >= 1.0:
        on = 1.0
        if 1.08 < t < 1.18: on = 0.05
        elif 1.18 <= t < 1.32: on = 0.6
    d = np.maximum(wy + 990, 0)
    hw = 60 + d * 0.30
    cone = np.clip((hw * 1.12 - np.abs(wx)) / (hw * 0.45), 0, 1) ** 1.5
    cone *= (wy > -995)
    pool = np.clip(1 - ((wx / 300) ** 2 + ((wy - 0) / 70) ** 2), 0, 1)
    vign = 1 - 0.45 * (((gx / W - 0.5) * 1.6) ** 2 + ((gy / H - 0.5) * 1.1) ** 2)
    light = (0.035 + 1.08 * cone + 0.3 * pool) * on * vign
    haze = 0.055 * cone * np.clip(1 - d / 1300, 0, 1) * on
    warm = np.array([1.0, 0.94, 0.84], np.float32)
    F.cv = F.cv * light[..., None] * warm + haze[..., None] * warm


def scene_man(t):
    # camera: wide -> slow push in -> settles at a good head-and-shoulders distance
    if t < CUTS[0] + XF:
        k = ramp(t, 1.3, 5.2)
        vh, cy = lerp(1180, 820, k), lerp(-500, -560, k)
    elif t < CUTS[2] + XF:
        k = ramp(t, CUTS[1] - XF, CUTS[2] + 0.3)
        vh, cy = lerp(760, 600, k), lerp(-575, -600, k)
    else:
        k = ramp(t, CUTS[3] - XF, 20.0)
        k2 = ramp(t, 20.0, DUR)
        vh = lerp(560, 470, k) - 25 * k2
        cy = lerp(-610, -625, k)
    lean = ramp(t, 18.05, 18.5) * (1 - ramp(t, 20.0, 20.8))
    vh -= 40 * lean
    F = Frame(t, (0, cy, vh), bg=(0.30, 0.27, 0.27))
    # stage: back curtain folds + floor
    for i in range(-9, 10):
        x = i * 120
        F.poly([(x - 70, -1400), (x + 70, -1400), (x + 64, 40), (x - 64, 40)], (0.36, 0.10, 0.12), f"cur{i}",
               wob=0.004, smooth_it=1, shade=0.8, shadow=0.0, spec=0.0)
    F.poly([(-1600, -20), (1600, -20), (1800, 600), (-1800, 600)], (0.42, 0.28, 0.19), "floor",
           wob=0.002, shade=0.0, shadow=0, smooth_it=0)
    F.ell((0, 0), 170, 26, (0, 0, 0), "manshadow", shade=0, shadow=0, alpha=0.4, tex=0)
    # lamp fixture
    F.poly([(-40, -1150), (40, -1150), (75, -1000), (-75, -1000)], (0.18, 0.18, 0.2), "lamp", spec=0.3)
    F.cap((0, -1400), (0, -1150), 8, (0.12, 0.12, 0.12), "lampcord")
    draw_man(F, t)
    lighting_man(F, t)
    if t >= 1.0 and not (1.08 < t < 1.18):
        F.ell((0, -998), 60, 12, (1.6, 1.5, 1.2), "bulb", shade=0, shadow=0, tex=0.2)
    return F.cv


def scene_friends(t, part):
    if part == 1:
        k = ramp(t, CUTS[0], CUTS[1])
        cam = (0, -400, lerp(940, 820, k))
    else:
        k = ramp(t, CUTS[2], CUTS[3])
        cam = (lerp(170, 200, k), -440, lerp(860, 780, k))
    F = Frame(t, cam, bg=(0.50, 0.70, 0.74))
    # room
    F.poly([(-1400, -2000), (1400, -2000), (1400, -120), (-1400, -120)], (0.52, 0.72, 0.75), "wall", wob=0,
           shade=0, shadow=0, smooth_it=0)
    F.poly([(-760, -720), (-380, -720), (-380, -300), (-760, -300)], (0.98, 0.96, 0.9), "winframe", wob=0.004, smooth_it=1)
    F.poly([(-735, -695), (-405, -695), (-405, -325), (-735, -325)], (0.55, 0.80, 0.98), "sky", wob=0.004,
           smooth_it=1, shade=0.4, shadow=0.5, spec=0)
    for i, (x, y, r) in enumerate([(-640, -560, 40), (-600, -580, 48), (-555, -560, 38)]):
        F.ell((x + math.sin(t * 0.3) * 10, y), r, r * 0.8, (1, 1, 1), f"cloud{i}", shadow=0)
    F.cap((-570, -700), (-570, -320), 7, (0.98, 0.96, 0.9), "winbar", shadow=0.2)
    # picture frame behind B
    F.poly([(380, -760), (620, -760), (620, -560), (380, -560)], (0.92, 0.70, 0.20), "frame", wob=0.005, smooth_it=1, spec=0.3)
    F.poly([(400, -740), (600, -740), (600, -580), (400, -580)], (0.98, 0.94, 0.85), "canvas", wob=0.005,
           smooth_it=1, shadow=0.4, shade=0.4)
    F.ell((450, -690), 26, 26, (0.98, 0.75, 0.15), "sun")
    F.poly([(405, -585), (480, -660), (540, -610), (595, -650), (595, -585)], (0.35, 0.65, 0.40), "hills", smooth_it=1)
    F.poly([(-1400, -130), (1400, -130), (1400, -105), (-1400, -105)], (0.95, 0.93, 0.88), "baseboard", wob=0,
           smooth_it=0, shade=0.5)
    F.poly([(-1600, -110), (1600, -110), (1900, 600), (-1900, 600)], (0.66, 0.47, 0.31), "floor2", wob=0,
           shade=0, shadow=0, smooth_it=0)
    for i in range(-8, 9):
        F.cap((i * 140, -100), (i * 190, 600), 2, (0.55, 0.38, 0.25), f"plank{i}", shadow=0, shade=0)
    # plant
    F.poly([(-300, -200), (-220, -200), (-230, -110), (-290, -110)], (0.80, 0.40, 0.25), "pot")
    for i, a in enumerate((-0.5, -0.15, 0.2, 0.55)):
        F.ell((-260 + math.sin(a) * 60, -260 - math.cos(a) * 40), 18, 50, (0.25, 0.55, 0.30), f"leaf{i}", rot=a)

    if part == 1:
        # A whispers, B listens -> shocked
        whisper = ramp(t, 5.2, 5.6) * (1 - ramp(t, 8.6, 9.0))
        shock = ramp(t, 8.1, 8.3)
        flap = (abs(math.sin(t * 11)) * 6 + 1) * (1 if 5.4 < t < 8.4 else 0)
        PA = {"arms": {-1: REST[-1], 1: lerp(REST[1], ((96, -380), (60, -462)), whisper)},
              "lean": 16 * whisper, "look": (4, 1), "mo": 1 + flap, "mw": 12, "smile": 0.1 + 0.4 * (t > 9.0),
              "brow": 4 * whisper, "browtilt": 3 * whisper}
        arms_shock = {-1: ((-104, -370), (-84, -500)), 1: ((104, -370), (84, -500))}
        PB = {"arms": {s: lerp(REST[s], arms_shock[s], shock) for s in (-1, 1)},
              "lean": lerp(-10 * whisper, 6, shock), "look": lerp((-4, 1), (0, -1), shock),
              "eye": 1 + 0.45 * shock, "eyew": 1 + 0.25 * shock, "pup": 1 - 0.4 * shock,
              "brow": 14 * shock, "mo": lerp(1, 22, shock), "mw": lerp(14, 12, shock),
              "smile": lerp(0.25, -0.3, shock), "shake": 2.5 * ramp(t, 8.1, 8.2) * (1 - ramp(t, 8.5, 8.9)),
              "hy": -10 * shock}
        friend_parts(F, t, -150, 1, PA, "A")
        friend_parts(F, t, 150, -1, PB, "B")
        # speech bubble with the secret
        bp = back_out(ramp(t, 5.4, 5.8) * 1.0) * (1 - ramp(t, 8.8, 9.1))
        if bp > 0.02:
            bc = (-10, -735)
            F.poly([(bc[0] - 30, bc[1] + 50 * bp), (bc[0] + 10, bc[1] + 50 * bp), (-80, -620)], (1, 1, 1), "tail", smooth_it=1)
            F.ell(bc, 135 * bp, 80 * bp, (1, 1, 1), "bubble", spec=0.05)
            crack = ramp(t, 7.7, 8.1)
            beat = 1 + 0.08 * math.sin(t * 12) * (1 - crack)
            for j, x in enumerate((-50, 50)):
                if j == 1 and crack > 0:
                    F.heart((bc[0] + x, bc[1] + 5 + crack * 8), 32 * bp * beat, (0.85, 0.15, 0.25), f"hrt{j}", split=crack * 10)
                else:
                    F.heart((bc[0] + x, bc[1] + 5), 32 * bp * beat, (0.92, 0.25, 0.40), f"hrt{j}")
        if shock > 0.05:
            p = back_out(ramp(t, 8.15, 8.5))
            jx = math.sin(t * 40) * 3 * (1 - ramp(t, 8.5, 9.2))
            ex, ey = 190 + jx, -720
            F.cap((ex, ey - 70 * p), (ex, ey - 5 * p), 14 * p, (0.95, 0.22, 0.20), "exc", rad2=9 * p, spec=0.3)
            F.ell((ex, ey + 22 * p), 12 * p, 12 * p, (0.95, 0.22, 0.20), "excdot", spec=0.3)
    else:
        # B turns away from A and thinks
        turn = ramp(t, CUTS[2] + 0.1, CUTS[2] + 0.9)
        step = ramp(t, CUTS[2] + 0.2, CUTS[2] + 1.0)
        chin = ramp(t, CUTS[2] + 0.8, CUTS[2] + 1.4)
        f = lerp(-1, 1, turn)
        PA = {"arms": REST, "look": (6, 0), "mo": 1, "mw": 12, "smile": -0.1, "brow": 3, "browtilt": 2}
        chin_arms = {-1: ((-30, -315), (46, -340)), 1: ((70, -340), (30, -458))}
        think = math.sin(t * 1.8)
        PB = {"arms": {s: lerp(REST[s], chin_arms[s], chin) for s in (-1, 1)},
              "look": lerp((-4, 0), (5 + think * 2, -5), chin), "eye": 1 - 0.15 * chin,
              "brow": 6 * chin, "browtilt": -5 * chin, "mo": 1, "mw": lerp(14, 9, chin),
              "smile": lerp(-0.2, -0.45, chin), "hy": 4 * chin}
        friend_parts(F, t, -150, 1, PA, "A")
        friend_parts(F, t, lerp(150, 215, step), f, PB, "B")
        tb = back_out(ramp(t, CUTS[2] + 1.3, CUTS[2] + 1.8))
        if tb > 0.02:
            bx = lerp(150, 215, step)
            for i, (dx, dy, r) in enumerate([(40, -615, 10), (55, -662, 16)]):
                F.ell((bx + dx, dy), r * tb, r * tb, (1, 1, 1), f"tdot{i}")
            cc = (bx + 70, -745 + math.sin(t * 2.4) * 6)
            for i, (dx, dy, r) in enumerate([(-55, 10, 48), (0, -25, 58), (55, 8, 50), (0, 30, 50), (-30, 32, 40), (35, 32, 42)]):
                F.ell((cc[0] + dx * tb, cc[1] + dy * tb), r * tb, r * 0.9 * tb, (1, 1, 1), f"cl{i}", shadow=0.15)
            F.text("?", (cc[0], cc[1] + 4 + math.sin(t * 5) * 4), 90 * tb, (0.55, 0.30, 0.85), seed="qm",
                   shadow=0.35, spec=0.25)
    return F.cv


SEGS = [lambda t: scene_man(t), lambda t: scene_friends(t, 1), lambda t: scene_man(t),
        lambda t: scene_friends(t, 2), lambda t: scene_man(t)]


def render(t):
    if t < 1.0:
        img = np.zeros((H, W, 3), np.float32)
    else:
        i = sum(1 for c in CUTS if t >= c)
        img = SEGS[i](t)
        for j, c in enumerate(CUTS):
            if c - XF <= t < c + XF:
                a = smooth((t - (c - XF)) / (2 * XF))
                other = SEGS[j + 1](t) if t < c else SEGS[j](t)
                img = img * (1 - a) + other * a if t < c else other * (1 - a) + img * a
    if t >= CARD - 0.2:
        a = ramp(t, CARD - 0.2, CARD + 0.2)
        img = img * (1 - a) + end_card(t) * a
    # end fade
    img = img * (1 - ramp(t, DUR - 0.7, DUR - 0.05))
    # film grain
    g = np.random.default_rng(int(t * 1000)).normal(0, 0.012, (H, W, 1)).astype(np.float32)
    img = np.clip(img + g, 0, 1)
    im = Image.fromarray((img * 255).astype(np.uint8))
    overlay_text(im, t)
    return im


# ---------------------------------------------------------------- captions + title
_fonts = {}


def font(path, size):
    k = (path, size)
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(path, size)
    return _fonts[k]


def wrap(d, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        nxt = (cur + " " + w).strip()
        if d.textlength(nxt, font=fnt) > maxw and cur:
            lines.append(cur)
            cur = w
        else:
            cur = nxt
    lines.append(cur)
    return lines


DURS = None


def overlay_text(im, t):
    d = ImageDraw.Draw(im)
    fs = int(W * 0.062)
    fnt = font(FONT_CAP, fs)
    for i, (st, txt) in enumerate(LINES):
        en = st + DURS[i] + (0.35 if i < 4 else 10)
        if st - 0.05 <= t < en and not (i == 4 and t >= CARD - 0.2):
            words = txt.split()
            # karaoke: reveal words progressively, proportional to characters
            prog = (t - st) / max(DURS[i], 0.1)
            nchar = sum(len(w) + 1 for w in words)
            shown, acc = [], 0
            for w in words:
                if acc / nchar <= prog + 0.02:
                    shown.append(w)
                acc += len(w) + 1
            lines = wrap(d, txt, fnt, W * 0.84)
            y = H * (0.66 if i == 4 else 0.74)
            cnt = 0
            for ln in lines:
                lw = d.textlength(ln, font=fnt)
                x = (W - lw) / 2
                for w in ln.split():
                    vis = cnt < len(shown)
                    if vis:
                        cur = cnt == len(shown) - 1 and prog < 1
                        col = (255, 214, 60) if cur else (255, 255, 255)
                        d.text((x, y), w, font=fnt, fill=col, stroke_width=max(3, fs // 9), stroke_fill=(0, 0, 0))
                    x += d.textlength(w + " ", font=fnt)
                    cnt += 1
                y += fs * 1.22
    if t >= CARD - 0.2:
        card_overlay(im, t)


# ---------------------------------------------------------------- end card
_logo = None
_bgcard = None


def logo_img():
    global _logo
    if _logo is None:
        im = Image.open(f"{S_DIR}/logo.png").convert("RGB").crop((20, 18, 994, 1004))
        m = Image.new("L", (im.width * 4, im.height * 4), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, m.width - 1, m.height - 1), radius=118 * 4, fill=255)
        im.putalpha(m.resize(im.size, Image.LANCZOS))
        _logo = im
    return _logo


def end_card(t):
    global _bgcard
    if _bgcard is None:
        gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((gx / W - 0.5) * 1.0) ** 2 + ((gy / H - 0.42) * 0.62) ** 2)
        glow = np.clip(1 - d / 0.55, 0, 1) ** 2
        base = np.array([15, 31, 24], np.float32) / 255
        hi = np.array([30, 66, 52], np.float32) / 255
        _bgcard = base * (1 - glow[..., None]) + hi * glow[..., None]
    return _bgcard.copy()


def apple_glyph(size):
    k = 4
    n = size * k
    m = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(m)
    c = lambda x, y, r, f=255: d.ellipse(((x - r) * n, (y - r) * n, (x + r) * n, (y + r) * n), fill=f)
    c(0.35, 0.52, 0.24); c(0.65, 0.52, 0.24)
    d.ellipse((0.11 * n, 0.34 * n, 0.89 * n, 0.86 * n), fill=255)
    d.ellipse((0.17 * n, 0.48 * n, 0.83 * n, 0.97 * n), fill=255)
    c(0.95, 0.52, 0.16, 0)  # bite
    c(0.50, 1.0, 0.06, 0)  # bottom notch
    leaf = Image.new("L", (n, n), 0)
    ImageDraw.Draw(leaf).ellipse((0.47 * n, 0.03 * n, 0.61 * n, 0.27 * n), fill=255)
    leaf = leaf.rotate(-42, center=(0.54 * n, 0.15 * n))
    m = Image.fromarray(np.maximum(np.asarray(m), np.asarray(leaf)))
    return m.resize((size, size), Image.LANCZOS)


def card_overlay(im, t):
    a = ramp(t, CARD - 0.2, CARD + 0.2)
    if a <= 0:
        return
    d = ImageDraw.Draw(im)
    # logo pops in
    p = back_out(ramp(t, CARD + 0.05, CARD + 0.6))
    if p > 0.01:
        fl = math.sin((t - CARD) * 2.2) * W * 0.006
        sz = max(2, int(W * 0.62 * p))
        lg = logo_img().resize((sz, sz), Image.LANCZOS)
        cx, cy = W // 2, int(H * 0.42 + fl)
        sh = Image.new("L", (sz + 120, sz + 120), 0)
        sh.paste(lg.getchannel("A"), (60, 60))
        sh = sh.filter(ImageFilter.GaussianBlur(28))
        shadow = Image.new("RGB", sh.size, (0, 0, 0))
        im.paste(shadow, (cx - sz // 2 - 60, cy - sz // 2 - 60 + int(W * 0.02)), sh.point(lambda v: int(v * 0.6)))
        im.paste(lg, (cx - sz // 2, cy - sz // 2), lg)
    # tagline above logo
    fs = int(W * 0.058)
    fnt = font(FONT_CAP, fs)
    ta = ramp(t, CARD + 0.1, CARD + 0.45)
    if ta > 0:
        txt = "More questions like this on"
        col = tuple(int(bg + (255 - bg) * ta) for bg in (18, 38, 30))
        d.text((W / 2, H * 0.16), txt, font=fnt, fill=col, anchor="mm")
    # Official Apple "Download on the App Store" badge (Apple artwork, unmodified).
    # Per Apple's guidelines: no animation of the badge itself (simple fade only),
    # clear space of 1/4 badge height, subordinate to the logo, trademark credit line.
    b = ramp(t, CARD + 1.1, CARD + 1.5)
    if b > 0.01 and not SHOW_APP_STORE_BADGE:
        cs = ramp(t, CARD + 1.1, CARD + 1.6)
        col = tuple(int(15 + (v - 15) * cs) for v in (150, 215, 195))
        d.text((W / 2, H * 0.74), "COMING SOON", font=font(FONT_CAP, int(W * 0.075)), fill=col, anchor="mm")
    elif b > 0.01:
        bh = int(W * 0.13)
        badge = official_badge(bh)
        bw = badge.width
        cy = int(H * 0.735)
        y = cy - bh // 2
        a = badge.getchannel("A").point(lambda v: int(v * b))
        bb = badge.copy()
        bb.putalpha(a)
        im.paste(bb, ((W - bw) // 2, y), bb)
        cfs = int(W * 0.045)
        ca = ramp(t, CARD + 1.5, CARD + 1.9)
        if ca > 0:
            col = tuple(int(15 + (v - 15) * ca) for v in (150, 215, 195))
            d.text((W / 2, y + bh + bh * 0.25 + cfs * 0.9), "COMING SOON", font=font(FONT_CAP, cfs), fill=col, anchor="mm")
        lf = font("/usr/share/fonts/opentype/inter/Inter-Regular.otf", int(W * 0.021))
        legal = ["Apple and the Apple logo are trademarks of Apple Inc.,",
                 "registered in the U.S. and other countries.",
                 "App Store is a service mark of Apple Inc."]
        lc = tuple(int(15 + (v - 15) * b) for v in (120, 150, 138))
        for i, ln in enumerate(legal):
            d.text((W / 2, H * 0.915 + i * W * 0.03), ln, font=lf, fill=lc, anchor="mm")


# Turn on once the app is live on the App Store (Apple only allows the badge for available apps).
SHOW_APP_STORE_BADGE = os.environ.get("SHOW_APP_STORE_BADGE") == "1"
_badge = {}


def official_badge(h):
    if h not in _badge:
        src = Image.open(f"{S_DIR}/badge/badge.png").convert("RGBA")
        _badge[h] = src.resize((int(src.width * h / src.height), h), Image.LANCZOS)
    return _badge[h]


def setup():
    global DURS
    import soundfile as sf
    DURS = []
    for i in range(len(LINES)):
        info = sf.info(f"{S_DIR}/audio/l{i}.wav")
        DURS.append(info.frames / info.samplerate)
    load_voice()


if __name__ == "__main__":
    setup()
    for ts in sys.argv[1:]:
        t = float(ts)
        render(t).save(f"{S_DIR}/test_{ts}.png")
        print("saved", ts)
