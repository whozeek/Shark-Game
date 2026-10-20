"""Spec-driven Moral Loop ad renderer (builds on clay.py primitives)."""
import os, sys, math, hashlib, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import clay
from clay import (Frame, W, H, FPS, smooth, ramp, lerp, back_out, SKIN, SUIT, SUIT_D, SHIRT, TIE, HAIR, DARK,
                  MOUTH, font, FONT_CAP)

S_DIR = clay.S_DIR
SR = 24000
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
FONT_SEMI = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
BRAND_TTS = lambda s: s.replace("Moraloop", "Moral Loop")

# ============================================================ TTS
_kokoro = None


def tts(text, voice="am_michael", speed=0.95):
    os.makedirs(f"{S_DIR}/tts", exist_ok=True)
    key = hashlib.md5(text.encode()).hexdigest()[:16]
    if voice != "am_michael" or speed != 0.95:
        key = hashlib.md5(f"{voice}|{speed}|{text}".encode()).hexdigest()[:16]
    path = f"{S_DIR}/tts/{key}.wav"
    if not os.path.exists(path):
        global _kokoro
        import soundfile as sf
        if _kokoro is None:
            from kokoro_onnx import Kokoro
            _kokoro = Kokoro(f"{S_DIR}/models/kokoro-v1.0.onnx", f"{S_DIR}/models/voices-v1.0.bin")
        s, sr = _kokoro.create(BRAND_TTS(text), voice=voice, speed=speed, lang="en-us")
        sf.write(path, s, sr)
    return path


def wav(path):
    import soundfile as sf
    a, _ = sf.read(path, dtype="float32")
    return a


# ============================================================ timeline
class Ad:
    pass


def build(spec):
    ad = Ad()
    ad.spec = spec
    lines, segs, sfx, cards, shrugs, gestures = [], [], [], [], [], []

    def say(text, t0):
        p = tts(text)
        d = len(wav(p)) / SR
        lines.append(dict(t=t0, text=text, dur=d, path=p))
        return d

    segs.append(dict(kind="man", t0=0.0))
    d = say("Hello. I have a question for you.", 2.3)
    gestures.append((2.3, 2.3 + d))
    t = 2.3 + d + 0.4
    beats = list(spec["beats"])
    close = spec.get("close", "What would you do?")
    beats.append(("man", close, {"close": True}))
    if spec.get("outro"):
        beats.append(("man", spec["outro"], {"smile": True}))
    for kind, text, kw in beats:
        new = kind == "scene" or segs[-1]["kind"] != "man"
        if new:
            segs[-1]["t1"] = t
            sfx.append(("whoosh", t - 0.3))
            segs.append(dict(kind=kind, t0=t, data=kw))
            vs = t + (0.35 if kind == "scene" else 0.25)
        else:
            vs = t
        d = say(text, vs)
        if kind == "man":
            if kw.get("close"):
                shrugs.append((vs - 0.15, vs + d + 0.9))
            elif d > 1.0:
                gestures.append((vs, vs + d))
        if kw.get("cards"):
            low = text.lower()
            ob = low.rfind(" or ")
            q = max(low.rfind(". ", 0, ob), low.rfind("? ", 0, ob), low.rfind("” ", 0, ob)) if ob > 0 else -1
            ta = vs + d * (max(q, 0) / len(text)) if ob > 0 else vs + 0.2
            tb = vs + d * (ob / len(text)) if ob > 0 else vs + d * 0.5
            cards.append(dict(a=kw["cards"][0], b=kw["cards"][1], ta=ta, tb=tb, te=vs + d + 1.1))
        if kind == "scene":
            segs[-1]["vs"], segs[-1]["vd"] = vs, d
            t = vs + d + 0.55
        else:
            t = vs + d + (1.1 if kw.get("close") else 0.35)
    # closing sequence on the man
    if segs[-1]["kind"] != "man":
        segs[-1]["t1"] = t
        sfx.append(("whoosh", t - 0.3))
        segs.append(dict(kind="man", t0=t, data={}))
        t += 0.25
    d = say("More questions like this on Moraloop.", t)
    ad.smile_t = t
    ad.CARD = t + d * 0.55
    t2 = max(t + d + 0.3, ad.CARD + 1.5)
    d2 = say("Coming soon.", t2)
    ad.DUR = t2 + d2 + 1.8
    segs[-1]["t1"] = ad.DUR + 1
    sfx += [("clunk", 1.0), ("clunk2", 1.18), ("chime", ad.CARD), ("pop", ad.CARD + 1.1)]
    ad.lines, ad.segs, ad.sfx, ad.cards, ad.shrugs, ad.gestures = lines, segs, sfx, cards, shrugs, gestures
    # man camera targets: steadily closer on each return
    mans = [s for s in segs if s["kind"] == "man"]
    m = len(mans)
    for i, s in enumerate(mans):
        if i == 0:
            s["cam"] = (1180, 820, -500, -560)
        else:
            p0, p1 = (i - 1) / max(1, m - 1), i / max(1, m - 1)
            s["cam"] = (760 - 290 * p0, 760 - 290 * p1, -575 - 50 * p0, -575 - 50 * p1)
    # scene sfx
    for s in segs:
        if s["kind"] != "scene":
            continue
        sc = s["data"]
        T0, T1 = s["t0"], s["t1"]
        u2t = lambda u: T0 + (T1 - T0) * u
        if sc.get("icons"):
            sfx.append(("pop", u2t(0.12 if sc["act"] != "think" else 0.3)))
        if sc.get("react") == "shock":
            sfx.append(("sting", u2t(sc.get("at", 0.55))))
        if sc["act"] == "think":
            for k in np.arange(u2t(0.2), T1 - 0.1, 0.5):
                sfx.append(("tick", k))
    # voice track + mouth envelope
    N = int(SR * (ad.DUR + 1))
    v = np.zeros(N, np.float32)
    for ln in lines:
        a = wav(ln["path"])
        s0 = int(ln["t"] * SR)
        v[s0:s0 + len(a)] += a[:N - s0]
    ad.voice = v
    nf = int(ad.DUR * FPS) + 2
    env = np.zeros(nf)
    w = int(0.035 * SR)
    for f in range(nf):
        c = int(f / FPS * SR)
        seg = v[max(0, c - w):c + w]
        env[f] = np.sqrt(np.mean(seg ** 2)) if len(seg) else 0
    env /= np.quantile(env[env > 0.003], 0.9) + 1e-6
    ad.env = np.clip(np.convolve(env, [0.25, 0.5, 0.25], mode="same"), 0, 1.3)
    return ad


AD = None


def env_at(t):
    f = int(t * FPS)
    return float(AD.env[f]) if 0 <= f < len(AD.env) else 0.0


def win(t, a, b, fi=0.4, fo=0.5):
    return ramp(t, a, a + fi) * (1 - ramp(t, b - fo, b))


# ============================================================ emoji props (clay-shaded)
_emo = {}


def emoji_base(ch):
    if ch not in _emo:
        f = ImageFont.truetype(EMOJI_FONT, 109)
        im = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((100, 100), ch, font=f, embedded_color=True, anchor="mm")
        bb = im.getbbox()
        _emo[ch] = im.crop(bb) if bb else im
    return _emo[ch]


def composite(F, x0, y0, rgb, a):
    h, w = a.shape
    X0, Y0 = int(x0), int(y0)
    sx0, sy0 = max(0, -X0), max(0, -Y0)
    sx1, sy1 = min(w, W - X0), min(h, H - Y0)
    if sx1 <= sx0 or sy1 <= sy0:
        return
    reg = F.cv[Y0 + sy0:Y0 + sy1, X0 + sx0:X0 + sx1]
    aa = a[sy0:sy1, sx0:sx1, None]
    reg[:] = reg * (1 - aa) + rgb[sy0:sy1, sx0:sx1] * aa


def emoji(F, ch, c, size, seed, rot=0.0, alpha=1.0, shadow=0.45):
    if size <= 1 or alpha <= 0.01:
        return
    base = emoji_base(ch)
    px = size * F.z
    sc = px / max(base.size)
    w, h = max(2, int(base.width * sc)), max(2, int(base.height * sc))
    r = rot + F.wob(seed, 3, 1.0)[0] * 4
    im = base.resize((w, h), Image.LANCZOS).rotate(r, expand=True, resample=Image.BICUBIC)
    arr = np.asarray(im, np.float32) / 255
    A = arr[..., 3]
    rp = max(1.5, 0.07 * px)
    pad = int(rp * 3) + 2
    Ap = np.pad(A, pad)
    Aim = Image.fromarray((Ap * 255).astype(np.uint8))
    off = int(rp * 0.6)
    sh = np.roll(np.roll(Ap, int(rp * 0.5), 0), int(rp * 0.35), 1)
    L = np.asarray(Image.fromarray((np.roll(np.roll(Ap, -off, 0), -off, 1) * 255).astype(np.uint8))
                   .filter(ImageFilter.GaussianBlur(rp)), np.float32) / 255
    shb = np.asarray(Image.fromarray((sh * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rp)), np.float32) / 255
    rgb = np.zeros(Ap.shape + (3,), np.float32)
    rgb[pad:pad + A.shape[0], pad:pad + A.shape[1]] = arr[..., :3]
    k = 0.62 + 0.48 * L
    spec = 0.12 * np.clip((L - 0.85) / 0.15, 0, 1) ** 2
    rgb = rgb * k[..., None] + spec[..., None]
    s = F.S([c])[0]
    x0, y0 = s[0] - Ap.shape[1] / 2, s[1] - Ap.shape[0] / 2
    # shadow first
    hh, ww = Ap.shape
    X0, Y0 = int(x0), int(y0)
    sx0, sy0, sx1, sy1 = max(0, -X0), max(0, -Y0), min(ww, W - X0), min(hh, H - Y0)
    if sx1 > sx0 and sy1 > sy0:
        F.cv[Y0 + sy0:Y0 + sy1, X0 + sx0:X0 + sx1] *= (1 - shadow * alpha * shb[sy0:sy1, sx0:sx1])[..., None]
    composite(F, x0, y0, rgb, Ap * alpha)


# ============================================================ man
def draw_man(F, t):
    env = env_at(t)
    br = math.sin(t * 2.1) * 2.0
    sh = max([win(t, a, b, 0.45, 0.8) for a, b in AD.shrugs] + [0])
    lean = sh
    g1 = max([win(t, a + 0.1, b, 0.4, 0.5) for a, b in AD.gestures] + [0])
    bob = env * 3 * math.sin(t * 9)
    hx = math.sin(t * 0.9) * 3 + lean * 2
    hy = -680 + br * 0.5 + bob - lean * 6
    tilt = math.sin(t * 0.7) * 0.04 + lean * 0.10
    for s in (-1, 1):
        F.cap((s * 45, -270), (s * 50, -25), 40, SUIT_D, f"leg{s}")
        F.ell((s * 58, -12), 56, 22, DARK, f"shoe{s}", spec=0.3)
    arms = []
    alt = int(t / 3) % 2  # alternate which hand gestures
    for s in (-1, 1):
        shoulder = (s * 128, -535 + br)
        elbow = lerp((s * 150, -405), (s * 165, -440), sh)
        hand = lerp((s * 140, -275), (s * 100, -555), sh)
        if (s == 1) == (alt == 0):
            elbow = lerp(elbow, (s * 165, -400), g1 * (1 - sh))
            hand = lerp(hand, (s * 90, -420 + math.sin(t * 5) * 6), g1 * (1 - sh))
        arms.append((s, shoulder, elbow, hand))
    torso = [(-152, -515 + br), (-118, -555 + br), (-42, -572 + br), (42, -572 + br), (118, -555 + br),
             (152, -515 + br), (138, -250), (-138, -250)]
    F.cap((hx * 0.5, -610), (0, -560), 34, (0.85, 0.62, 0.50), "neck", shadow=0.2)
    F.poly(torso, SUIT, "torso", spec=0.08)
    F.poly([(-44, -572 + br), (44, -572 + br), (0, -432)], SHIRT, "shirt", smooth_it=1)
    F.poly([(-14, -548), (14, -548), (24, -445), (0, -418), (-24, -445)], TIE, "tie", smooth_it=1, spec=0.25)
    F.ell((0, -556), 16, 13, (0.70, 0.10, 0.12), "knot")
    for s in (-1, 1):
        F.poly([(s * 44, -572 + br), (s * 72, -555 + br), (s * 58, -500), (s * 20, -425), (s * 8, -440)],
               SUIT_D, f"lapel{s}", smooth_it=1, shadow=0.45)
        F.poly([(s * 6, -578), (s * 42, -578), (s * 26, -545)], SHIRT, f"collar{s}", smooth_it=1, shadow=0.3)
    for i, y in enumerate((-395, -340)):
        F.ell((0, y), 7, 7, DARK, f"btn{i}", spec=0.4, shadow=0.2)
    F.poly([(-112, -462), (-100, -482), (-90, -470), (-80, -484), (-72, -462)], SHIRT, "pocketsq", smooth_it=1, shadow=0.2)
    cx, cy, rot = hx, hy, tilt
    cr, sr = math.cos(rot), math.sin(rot)
    H_ = lambda x, y: (cx + x * cr - y * sr, cy + x * sr + y * cr)
    for s in (-1, 1):
        F.ell(H_(s * 78, 2), 15, 24, (0.88, 0.64, 0.52), f"ear{s}", rot=rot)
    F.ell((cx, cy), 80, 94, SKIN, "head", rot=rot, spec=0.14)
    hair = [H_(math.cos(math.pi * (1.05 + i / 22 * 0.9)) * 86, math.sin(math.pi * (1.05 + i / 22 * 0.9)) * 102 - 4)
            for i in range(23)]
    hair += [H_(84, -18), H_(60, -52), H_(20, -66), H_(-30, -60), H_(-58, -48), H_(-82, -20)]
    F.poly(hair, HAIR, "hair", smooth_it=2, spec=0.12, shadow=0.4)
    F.ell(H_(-10, -86), 52, 14, (0.32, 0.21, 0.13), "hairhl", rot=rot - 0.1, shadow=0)
    for s in (-1, 1):
        F.ell(H_(s * 46, 22), 15, 9, (0.95, 0.58, 0.52), f"blush{s}", rot=rot, shade=0.2, shadow=0, alpha=0.55)
    blink = 0.12 if (1.20 < t % 3.4 < 1.32) else 1.0
    if sh > 0.5:
        blink = 1.15
    brow_up = 6 + 9 * sh + 5 * (env > 0.7)
    look = (math.sin(t * 0.6) * 1.5, 0)
    for s in (-1, 1):
        ex, ey = s * 30, -12
        F.ell(H_(ex, ey), 16, 18 * blink, (0.98, 0.97, 0.95), f"eye{s}", rot=rot, shadow=0.25, spec=0.2)
        if blink > 0.3:
            F.ell(H_(ex + look[0], ey + 2), 8, 8 * min(1, blink), (0.18, 0.12, 0.08), f"pup{s}", rot=rot, shadow=0, spec=0)
            F.ell(H_(ex + look[0] - 3, ey - 2), 2.6, 2.6, (1, 1, 1), f"glint{s}", shadow=0, shade=0)
        extra = 5 * sh if s == 1 else 0
        F.cap(H_(ex - 16, ey - 22 - brow_up - extra * 0.3), H_(ex + 16, ey - 26 - brow_up - extra), 5.5, HAIR,
              f"brow{s}", shadow=0.2)
    F.ell(H_(0, 12), 13, 18, (0.90, 0.64, 0.50), "nose", rot=rot, shadow=0.35, spec=0.2)
    smile = 0.25 + 0.6 * ramp(t, AD.smile_t - 0.3, AD.smile_t + 0.3) - 0.35 * sh
    F.mouth(H_(0, 44), 22, 2 + 20 * min(1, env), smile, MOUTH, "mouth")
    for s, shoulder, elbow, hand in arms:
        F.limb([shoulder, elbow, hand], 33, SUIT, f"arm{s}", shadow=0.4)
        F.ell(hand, 20, 14, SHIRT, f"cuff{s}", rot=math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]) + math.pi / 2)
        palm_up = sh > 0.5
        hpos = (hand[0] + s * 4, hand[1] + (-8 if palm_up else 18))
        F.ell(hpos, 22, 20, SKIN, f"hand{s}", spec=0.12)
        if palm_up:
            F.ell((hpos[0] + s * 18, hpos[1] - 14), 8, 14, SKIN, f"thumb{s}", rot=s * 0.5)


_grid = None


def grid():
    global _grid
    if _grid is None:
        gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
        _grid = (gx, gy)
    return _grid


def stage_bg(F):
    gx, gy = grid()
    wx = (gx - W / 2) / F.z + F.cx
    wy = (gy - H / 2) / F.z + F.cy
    fold = 0.5 + 0.5 * np.cos(2 * np.pi * wx / 120 + np.sin(wy / 300 + F.bi * 0.0) * 0.15)
    sh = 0.42 + 0.58 * fold ** 0.8
    cur = np.array([0.36, 0.10, 0.12], np.float32)
    flo = np.array([0.42, 0.28, 0.19], np.float32)
    img = cur[None, None, :] * sh[..., None]
    floor = wy > -20
    img[floor] = flo
    F.cv = img * (1 + F.tex[..., None] * 0.8)


def scene_man(t, seg):
    vh0, vh1, cy0, cy1 = seg["cam"]
    k = ramp(t, seg["t0"] + (1.3 if seg["t0"] == 0 else -0.15), seg["t1"] + 0.3)
    vh, cy = lerp(vh0, vh1, k), lerp(cy0, cy1, k)
    if seg is AD.segs[-1]:
        vh -= 25 * ramp(t, seg["t0"], AD.DUR)
    sh = max([win(t, a, b, 0.45, 0.8) for a, b in AD.shrugs] + [0])
    vh -= 40 * sh
    F = Frame(t, (0, cy, vh))
    stage_bg(F)
    F.ell((0, 0), 170, 26, (0, 0, 0), "manshadow", shade=0, shadow=0, alpha=0.4, tex=0)
    F.poly([(-40, -1150), (40, -1150), (75, -1000), (-75, -1000)], (0.18, 0.18, 0.2), "lamp", spec=0.3)
    F.cap((0, -1400), (0, -1150), 8, (0.12, 0.12, 0.12), "lampcord")
    draw_man(F, t)
    clay.lighting_man(F, t)
    F.poly([(-40, -1150), (40, -1150), (75, -1000), (-75, -1000)], (0.30, 0.30, 0.33), "lamp2", spec=0.3, shadow=0)
    F.cap((0, -1400), (0, -1150), 8, (0.22, 0.22, 0.22), "lampcord2", shadow=0)
    if t >= 1.0 and not (1.08 < t < 1.18):
        F.ell((0, -998), 60, 12, (1.6, 1.5, 1.2), "bulb", shade=0, shadow=0, tex=0.2)
    return F.cv


# ============================================================ cast
CHARS = {
    "you": dict(skin=(0.96, 0.78, 0.65), top=(0.33, 0.66, 0.42), pants=(0.68, 0.57, 0.40), hair=(0.45, 0.27, 0.13), shoe=(0.85, 0.20, 0.20), style="short"),
    "friend": dict(skin=(0.62, 0.42, 0.30), top=(0.96, 0.55, 0.20), pants=(0.22, 0.29, 0.48), hair=(0.10, 0.08, 0.08), shoe=(0.95, 0.95, 0.95), style="curly", hood=True),
    "friend2": dict(skin=(0.90, 0.70, 0.55), top=(0.95, 0.75, 0.25), pants=(0.30, 0.30, 0.35), hair=(0.55, 0.20, 0.10), shoe=(0.30, 0.50, 0.90), style="bun"),
    "partner": dict(skin=(0.85, 0.62, 0.48), top=(0.62, 0.38, 0.75), pants=(0.25, 0.22, 0.30), hair=(0.12, 0.08, 0.06), shoe=(0.20, 0.20, 0.20), style="long"),
    "brother": dict(skin=(0.96, 0.80, 0.66), top=(0.30, 0.50, 0.85), pants=(0.25, 0.25, 0.30), hair=(0.85, 0.68, 0.30), shoe=(0.30, 0.30, 0.30), style="spiky"),
    "sibling": dict(skin=(0.96, 0.80, 0.66), top=(0.30, 0.50, 0.85), pants=(0.25, 0.25, 0.30), hair=(0.85, 0.68, 0.30), shoe=(0.30, 0.30, 0.30), style="spiky"),
    "ex": dict(skin=(0.97, 0.82, 0.70), top=(0.90, 0.30, 0.35), pants=(0.20, 0.20, 0.25), hair=(0.92, 0.75, 0.40), shoe=(0.10, 0.10, 0.10), style="long"),
    "kid": dict(skin=(0.80, 0.58, 0.42), top=(0.98, 0.82, 0.25), pants=(0.30, 0.45, 0.70), hair=(0.25, 0.15, 0.08), shoe=(0.20, 0.60, 0.90), style="bun", scale=0.74),
    "cousin": dict(skin=(0.70, 0.50, 0.36), top=(0.95, 0.45, 0.60), pants=(0.30, 0.30, 0.50), hair=(0.12, 0.08, 0.06), shoe=(0.95, 0.95, 0.30), style="curly", scale=0.78),
    "boss": dict(skin=(0.92, 0.74, 0.62), top=(0.40, 0.42, 0.48), pants=(0.25, 0.26, 0.30), hair=(0.72, 0.72, 0.74), shoe=(0.10, 0.10, 0.10), style="short", tie=True),
    "coworker": dict(skin=(0.75, 0.55, 0.42), top=(0.85, 0.85, 0.80), pants=(0.25, 0.30, 0.40), hair=(0.15, 0.10, 0.08), shoe=(0.30, 0.20, 0.15), style="short", tie=True),
    "stranger": dict(skin=(0.70, 0.50, 0.38), top=(0.25, 0.62, 0.62), pants=(0.35, 0.30, 0.25), hair=(0.15, 0.10, 0.08), shoe=(0.40, 0.25, 0.15), style="bald"),
    "elder": dict(skin=(0.93, 0.76, 0.66), top=(0.80, 0.55, 0.60), pants=(0.45, 0.40, 0.45), hair=(0.92, 0.92, 0.94), shoe=(0.40, 0.30, 0.30), style="bun", scale=0.9),
    "coach": dict(skin=(0.88, 0.66, 0.52), top=(0.85, 0.20, 0.20), pants=(0.15, 0.15, 0.20), hair=(0.30, 0.20, 0.12), shoe=(0.95, 0.95, 0.95), style="short"),
    "teammate": dict(skin=(0.68, 0.48, 0.34), top=(0.20, 0.40, 0.85), pants=(0.95, 0.95, 0.95), hair=(0.10, 0.08, 0.06), shoe=(0.10, 0.10, 0.10), style="spiky"),
}

POSE = {
    "rest": {-1: ((-86, -300), (-90, -212)), 1: ((86, -300), (90, -212))},
    "shock": {-1: ((-104, -370), (-84, -500)), 1: ((104, -370), (84, -500))},
    "laugh": {-1: ((-92, -310), (-40, -268)), 1: ((92, -310), (40, -268))},
    "hips": {-1: ((-118, -310), (-80, -235)), 1: ((118, -310), (80, -235))},
    "shrug": {-1: ((-110, -330), (-125, -410)), 1: ((110, -330), (125, -410))},
    "sad": {-1: ((-70, -300), (-25, -235)), 1: ((70, -300), (25, -235))},
}


def side_pose(base, side, el, hd):
    p = dict(base)
    p[side] = (el, hd)
    return p


def facepose(f, kind):
    """Arm pose that depends on facing direction (near-side arm = sign of f)."""
    s = 1 if f >= 0 else -1
    if kind == "whisper":
        return side_pose(POSE["rest"], s, (s * 96, -380), (s * 60, -462))
    if kind == "talk":
        return side_pose(POSE["rest"], s, (s * 100, -330), (s * 135, -380))
    if kind == "hold":
        return side_pose(POSE["rest"], s, (s * 70, -310), (s * 110, -360))
    if kind == "give":
        return side_pose(POSE["rest"], s, (s * 105, -335), (s * 160, -350))
    if kind == "point":
        return side_pose(POSE["rest"], s, (s * 100, -390), (s * 150, -440))
    if kind == "chin":
        return {-s: ((-s * 30, -315), (s * 46, -340)), s: ((s * 70, -340), (s * 30, -458))}
    return POSE["rest"]


EXPR = {
    "neutral": dict(),
    "shock": dict(eye=1.45, eyew=1.25, pup=0.6, brow=14, mo=22, mw=12, smile=-0.3, hy=-10),
    "sad": dict(eye=0.85, brow=3, browtilt=-5, smile=-0.55, look=(0, 4), mo=1),
    "happy": dict(eye=0.9, brow=5, smile=0.9, mo=8, mw=16),
    "laugh": dict(eye=0.45, brow=6, smile=1.0, mo=14, mw=16),
    "angry": dict(brow=-6, browtilt=10, smile=-0.6, mo=4, mw=13, eye=0.8),
    "worried": dict(brow=7, browtilt=-5, smile=-0.35, mo=2, mw=11),
    "think": dict(eye=0.85, brow=6, browtilt=-5, smile=-0.45, mo=1, mw=9),
    "smug": dict(eye=0.8, brow=2, browtilt=3, smile=0.6, mo=1, mw=14),
}
REACT_POSE = {"shock": "shock", "laugh": "laugh", "angry": "hips", "sad": "sad", "worried": "shrug"}
REACT_ICON = {"angry": "💢", "sad": "💧", "worried": "💦", "happy": "✨", "laugh": "😂"}


def draw_char(F, t, cid, x, f, P):
    c = CHARS[cid]
    s = P.get("scale") or c.get("scale", 1.0)
    X = lambda px, py: (x + px * s, py * s)
    skin, top, pants, hairc, shoe = c["skin"], c["top"], c["pants"], c["hair"], c["shoe"]
    sd = f"{cid}{int(x)}"
    bounce = math.sin(t * 2.3 + x * 0.01) * 2.5 + P.get("bounce", 0)
    F.ell(X(0, 0), 110 * s, 18 * s, (0, 0, 0), sd + "sh", shade=0, shadow=0, alpha=0.25, tex=0)
    for k in (-1, 1):
        F.cap(X(k * 28, -205), X(k * 32, -28), 24 * s, pants, f"{sd}leg{k}")
        F.ell(X(k * 34 + f * 12, -12), 36 * s, 17 * s, shoe, f"{sd}shoe{k}", spec=0.25)
    F.poly([X(-74, -420 + bounce), X(74, -420 + bounce), X(90, -195), X(-90, -195)], top, sd + "torso", spec=0.08)
    if c.get("hood"):
        F.poly([X(-48, -285), X(48, -285), X(58, -225), X(-58, -225)], tuple(v * 0.9 for v in top), sd + "pk", shadow=0.3)
        for k in (-1, 1):
            F.cap(X(k * 14, -410), X(k * 16, -360), 3.5 * s, (0.98, 0.95, 0.9), f"{sd}str{k}", shadow=0.2)
    elif c.get("tie"):
        F.poly([X(-24, -422 + bounce), X(24, -422 + bounce), X(0, -380)], (0.97, 0.97, 0.95), sd + "col", smooth_it=1, shadow=0.2)
        F.poly([X(-8, -410), X(8, -410), X(12, -320), X(0, -305), X(-12, -320)], (0.25, 0.30, 0.60), sd + "tie", smooth_it=1)
    else:
        F.poly([X(-26, -422 + bounce), X(26, -422 + bounce), X(0, -392)], skin, sd + "nv", smooth_it=1, shadow=0.2)
    lean = P.get("lean", 0)
    hx = x + (f * 8 + lean) * s + math.sin(t * 60) * P.get("shake", 0)
    hy = (-508 + bounce + P.get("hy", 0)) * s
    style = c["style"]
    if style == "long":  # hair behind head
        F.poly([(hx - 78 * s, hy - 10 * s), (hx + 78 * s, hy - 10 * s), (hx + 82 * s, hy + 95 * s), (hx - 82 * s, hy + 95 * s)],
               hairc, sd + "hback", shadow=0.3)
    F.ell((hx, hy), 72 * s, 76 * s, skin, sd + "head", spec=0.14)
    fx = hx + f * 16 * s
    if style == "curly":
        for i in range(11):
            a = math.pi * (1.0 + i / 10)
            F.ell((hx + math.cos(a) * 64 * s, hy + (math.sin(a) * 66 - 6) * s), 24 * s, 24 * s, hairc, f"{sd}c{i}", spec=0.1, shadow=0.3)
        F.ell((hx, hy - 62 * s), 48 * s, 26 * s, hairc, sd + "cm", shadow=0.3)
    elif style in ("short", "long", "bun", "spiky"):
        hp = [(hx + math.cos(math.pi * (1.02 + i / 20 * 0.96)) * 78 * s, hy + (math.sin(math.pi * (1.02 + i / 20 * 0.96)) * 82 - 3) * s)
              for i in range(21)]
        hp += [(hx + 76 * s, hy - 5 * s), (hx + (50 - f * 10) * s, hy - 45 * s), (hx + (10 - f * 20) * s, hy - 52 * s),
               (hx - (50 + f * 10) * s, hy - 40 * s), (hx - 78 * s, hy - 5 * s)]
        F.poly(hp, hairc, sd + "hair", spec=0.12, shadow=0.4)
        if style == "bun":
            F.ell((hx - f * 10 * s, hy - 92 * s), 30 * s, 26 * s, hairc, sd + "bun", spec=0.12, shadow=0.3)
        if style == "spiky":
            for i, a in enumerate((-0.6, -0.2, 0.2, 0.6)):
                bx, by = hx + math.sin(a) * 60 * s, hy - math.cos(a) * 70 * s
                F.poly([(bx - 18 * s, by + 10 * s), (bx + 18 * s, by + 10 * s), (bx + math.sin(a) * 30 * s, by - 34 * s)],
                       hairc, f"{sd}sp{i}", smooth_it=1, shadow=0.3)
        if style == "long":
            for k in (-1, 1):
                F.cap((hx + k * 70 * s, hy - 20 * s), (hx + k * 76 * s, hy + 80 * s), 18 * s, hairc, f"{sd}lk{k}", shadow=0.3)
    eo = P.get("eye", 1.0)
    lx, ly = P.get("look", (f * 3, 0))
    brow = P.get("brow", 0)
    for k in (-1, 1):
        ex, ey = fx + k * 23 * s, hy - 8 * s
        F.ell((ex, ey), 13 * s * P.get("eyew", 1), 15 * s * eo, (0.98, 0.97, 0.95), f"{sd}eye{k}", shadow=0.2, spec=0.2)
        pr = 6.5 * s * P.get("pup", 1)
        F.ell((ex + lx * s, ey + ly * s), pr, pr, (0.12, 0.08, 0.06), f"{sd}pup{k}", shadow=0, spec=0)
        F.ell((ex + (lx - 2) * s, ey + (ly - 2) * s), 2 * s, 2 * s, (1, 1, 1), f"{sd}gl{k}", shadow=0, shade=0)
        tl = P.get("browtilt", 0) * k
        F.cap((ex - 13 * s, ey - (22 + brow - tl) * s), (ex + 13 * s, ey - (24 + brow + tl) * s), 4.5 * s, hairc if style != "bald" else (0.2, 0.12, 0.08),
              f"{sd}brow{k}", shadow=0.15)
        F.ell((ex + k * 6 * s, hy + 22 * s), 12 * s, 7 * s, (0.95, 0.55, 0.50), f"{sd}bl{k}", shade=0.2, shadow=0,
              alpha=0.45 + 0.4 * P.get("blush", 0))
    F.ell((fx + f * 8 * s, hy + 10 * s), 9 * s, 11 * s, tuple(v * 0.92 for v in skin), sd + "nose", shadow=0.3)
    F.mouth((fx + f * 4 * s, hy + 36 * s), P.get("mw", 15) * s, P.get("mo", 1) * s, P.get("smile", 0.2), MOUTH, sd + "m")
    arms = P.get("arms", POSE["rest"])
    for k in (-1, 1):
        el, hd = arms[k]
        F.limb([X(k * 66, -398 + bounce), X(*el), X(*hd)], 21 * s, top, f"{sd}arm{k}", shadow=0.35)
        F.ell(X(*hd), 17 * s, 17 * s, skin, f"{sd}hand{k}", spec=0.12)
    if P.get("prop"):
        hd = arms[1 if f >= 0 else -1][1]
        emoji(F, P["prop"], X(hd[0] + (12 if f >= 0 else -12), hd[1] - 30), 70 * s, sd + "prop")
    return (hx, hy)


def mix_expr(a, b, k):
    out = dict(EXPR["neutral"])
    keys = set(a) | set(b)
    defaults = dict(eye=1.0, eyew=1.0, pup=1.0, brow=0, browtilt=0, mo=1, mw=15, smile=0.2, hy=0, look=(0, 0))
    for key in keys:
        va, vb = a.get(key, defaults[key]), b.get(key, defaults[key])
        out[key] = lerp(va, vb, k)
    return out


def lerp_pose(a, b, k):
    return {s: (lerp(a[s][0], b[s][0], k), lerp(a[s][1], b[s][1], k)) for s in (-1, 1)}


WALLS = [(0.52, 0.72, 0.75), (0.93, 0.80, 0.62), (0.80, 0.70, 0.86), (0.72, 0.84, 0.66), (0.96, 0.72, 0.66),
         (0.66, 0.76, 0.92)]


def room_bg(F, wall):
    gx, gy = grid()
    wy = (gy - H / 2) / F.z + F.cy
    wx = (gx - W / 2) / F.z + F.cx
    wallc = np.array(wall, np.float32)
    img = np.empty((H, W, 3), np.float32)
    img[:] = wallc
    # soft wall shading toward top
    img *= (0.88 + 0.12 * np.clip((wy + 1100) / 1000, 0, 1))[..., None]
    base = (wy > -130) & (wy <= -105)
    img[base] = (0.95, 0.93, 0.88)
    fl = wy > -105
    planks = (np.abs(((wx * (1 - 0.0) ) / (140 + (wy + 105) * 0.55) + 50) % 1 - 0.5) < 0.012)
    img[fl] = (0.66, 0.47, 0.31)
    img[fl & planks] = (0.55, 0.38, 0.25)
    F.cv = img * (1 + F.tex[..., None] * 0.7)


def room_props(F, t, wall_i):
    F.poly([(-760, -720), (-380, -720), (-380, -300), (-760, -300)], (0.98, 0.96, 0.9), "winframe", wob=0.004, smooth_it=1)
    F.poly([(-735, -695), (-405, -695), (-405, -325), (-735, -325)], (0.55, 0.80, 0.98), "sky", wob=0.004,
           smooth_it=1, shade=0.4, shadow=0.5, spec=0)
    for i, (x, y, r) in enumerate([(-640, -560, 40), (-600, -580, 48), (-555, -560, 38)]):
        F.ell((x + math.sin(t * 0.3) * 10, y), r, r * 0.8, (1, 1, 1), f"cloud{i}", shadow=0)
    F.cap((-570, -700), (-570, -320), 7, (0.98, 0.96, 0.9), "winbar", shadow=0.2)
    F.poly([(380, -760), (620, -760), (620, -560), (380, -560)], (0.92, 0.70, 0.20), "frame", wob=0.005, smooth_it=1, spec=0.3)
    F.poly([(400, -740), (600, -740), (600, -580), (400, -580)], (0.98, 0.94, 0.85), "canvas", wob=0.005,
           smooth_it=1, shadow=0.4, shade=0.4)
    F.ell((450, -690), 26, 26, (0.98, 0.75, 0.15), "sun")
    F.poly([(405, -585), (480, -660), (540, -610), (595, -650), (595, -585)], (0.35, 0.65, 0.40), "hills", smooth_it=1)
    if wall_i % 2 == 0:
        F.poly([(-300, -200), (-220, -200), (-230, -110), (-290, -110)], (0.80, 0.40, 0.25), "pot")
        for i, a in enumerate((-0.5, -0.15, 0.2, 0.55)):
            F.ell((-260 + math.sin(a) * 60, -260 - math.cos(a) * 40), 18, 50, (0.25, 0.55, 0.30), f"leaf{i}", rot=a)


def bubble(F, c, icons, p, seed, think=False, tail_to=None):
    if p <= 0.02:
        return
    n = max(1, len(icons))
    gap = 112 if n < 3 else 96
    rx = (70 + gap * 0.55 * n) * p
    ry = 82 * p
    if think:
        for i, (dx, dy, r) in enumerate([(-55, 10, 48), (0, -25, 58), (55, 8, 50), (0, 30, 50), (-30, 32, 40), (35, 32, 42)]):
            sx = (rx / 90)
            F.ell((c[0] + dx * sx, c[1] + dy * p), r * p * max(1, sx * 0.8), r * 0.9 * p, (1, 1, 1), f"{seed}cl{i}", shadow=0.15)
        if tail_to:
            for i, k in enumerate((0.35, 0.65)):
                q = lerp(tail_to, (c[0], c[1] + ry), k)
                F.ell(q, (10 + 6 * i) * p, (10 + 6 * i) * p, (1, 1, 1), f"{seed}td{i}")
    else:
        if tail_to:
            F.poly([(c[0] - 25, c[1] + ry * 0.6), (c[0] + 15, c[1] + ry * 0.6), tail_to], (1, 1, 1), seed + "tail", smooth_it=1)
        F.ell(c, rx, ry, (1, 1, 1), seed + "b", spec=0.05)
    for i, ch in enumerate(icons):
        x = c[0] + (i - (n - 1) / 2) * gap * p
        bob = math.sin(F.t * 4 + i) * 4
        emoji(F, ch, (x, c[1] + bob), (88 if n < 3 else 78) * p, f"{seed}i{i}")


def scene_story(t, seg):
    sc = seg["data"]
    T0, T1 = seg["t0"], seg["t1"]
    u = (t - T0) / (T1 - T0)
    ut = lambda uu: T0 + (T1 - T0) * uu
    chars = sc["chars"]
    n = len(chars)
    xs = list(sc.get("xs") or {1: [0], 2: [-150, 150], 3: [-215, 0, 215]}[n])
    you = sc.get("you", chars.index("you") if "you" in chars else n - 1)
    spk = sc.get("speaker", 0 if you != 0 else min(1, n - 1))
    act = sc["act"]
    icons = sc.get("icons", [])
    react = sc.get("react", "shock")
    at = sc.get("at", 0.55)
    wall_i = sc.get("wall", seg.get("idx", 0)) % len(WALLS)
    if act == "think" and n == 1:
        cam = (xs[you] * 0.6 + 40, -540, lerp(1080, 990, u))
    elif act == "think":
        cam = (sum(xs) / n * 0.5 + 20, -520, lerp(1240, 1140, u))
    else:
        cam = (0, -520 if n < 3 else -540, lerp(1240, 1140, u) if n < 3 else lerp(1360, 1260, u))
    if sc.get("cam"):
        cx_, cy_, vh_ = sc["cam"]
        cam = (cx_, cy_, lerp(vh_, vh_ - sc.get("push", 90), u))
    F = Frame(t, cam)
    import sets
    sets.OPTS = sc
    sets.draw_set(F, t, sc.get("set", "home"), WALLS[wall_i], emoji)
    for j, (ch, dx, dy, sz) in enumerate(sc.get("decor", [])):
        emoji(F, ch, (dx, dy + math.sin(t * 3 + j) * 4), sz, f"decor{j}")
    for j, (ch, gx, u0) in enumerate(sc.get("ground", [])):
        if u >= u0:
            emoji(F, ch, (gx, -22), 72 * back_out(ramp(t, ut(u0), ut(u0) + 0.25)), f"ground{j}")
    rk = 1.0 if sc.get("hold") else ramp(t, ut(at), ut(at) + 0.25)
    heads = {}
    for i, cid in enumerate(chars):
        x = xs[i]
        other = xs[spk] if i != spk else xs[you] if you != i else 0
        f = 1.0 if other > x else -1.0 if other < x else 0.0
        if i in sc.get("face", {}):
            f = sc["face"][i]
        P = {"arms": POSE["rest"], "look": (f * 4, 0)}
        if i in sc.get("scale", {}):
            P["scale"] = sc["scale"][i]
        wk = sc.get("walk", {}).get(i)
        if wk:
            k = ramp(t, ut(wk[1]), ut(wk[2]))
            x = xs[i] + wk[0] * k
            if 0 < k < 1:
                f = 1.0 if wk[0] > 0 else -1.0
                P["bounce"] = abs(math.sin(t * 12)) * 7
        expr = dict(EXPR["neutral"])
        if act == "witness" and i in (0, 1):
            f = 1.0 if i == 0 else -1.0
            kk = 1.0 if sc.get("hold") else ramp(t, ut(0.08), ut(0.3))
            P["lean"] = f * 26 * kk
            P["arms"] = lerp_pose(POSE["rest"], facepose(f, "give"), kk)
            P["blush"] = kk
            expr = mix_expr(EXPR["neutral"], dict(eye=0.12, smile=0.85, mo=1, mw=10), kk)
        elif i == spk and i != you and act in ("tell", "say", "give", "laugh", "react"):
            talking = win(t, ut(0.05), ut(0.6), 0.2, 0.2)
            flap = (abs(math.sin(t * 11)) * 6 + 1) * (0.05 < u < 0.6)
            if sc.get("voiced"):
                talking = win(t, ut(0.0), ut(1.0), 0.2, 0.3)
                flap = 1 + 15 * min(1.0, env_at(t))
            if act == "tell":
                P["arms"] = lerp_pose(POSE["rest"], facepose(f, "whisper"), talking)
                P["lean"] = 16 * talking
            elif act == "say":
                P["arms"] = lerp_pose(POSE["rest"], facepose(f, "talk"), talking)
            elif act == "give":
                g = win(t, ut(0.08), ut(0.45), 0.25, 0.2)
                P["arms"] = lerp_pose(POSE["rest"], facepose(f, "give"), g)
                if u < 0.38:
                    P["prop"] = icons[0] if icons else None
            expr = dict(mo=1 + flap, mw=12, smile=sc.get("spk_smile", 0.2), brow=3)
            if sc.get("spk_expr"):
                expr = mix_expr(EXPR[sc["spk_expr"]], {}, 0)
                expr["mo"] = 1 + flap
                expr["mw"] = 12
            if act == "laugh":
                lk = ramp(t, ut(0.15), ut(0.3))
                expr = mix_expr(expr, EXPR["laugh"], lk)
                expr["mo"] = 6 + abs(math.sin(t * 14)) * 10 * lk
                P["arms"] = lerp_pose(POSE["rest"], POSE["laugh"], lk)
                P["bounce"] = abs(math.sin(t * 14)) * 6 * lk
        elif i == you:
            if act == "think":
                turn = ramp(t, ut(0.03), ut(0.25))
                away = -1.0 if n > 1 and xs[spk] > x else 1.0
                f = lerp(f if n > 1 else -1.0, away, turn)
                ck = ramp(t, ut(0.18), ut(0.35))
                P["arms"] = lerp_pose(POSE["rest"], facepose(f, "chin"), ck)
                expr = mix_expr(EXPR["neutral"], EXPR["think"], ck)
                expr["look"] = lerp((f * 4, 0), (f * 5 + math.sin(t * 1.8) * 2, -5), ck)
            else:
                if act == "see":
                    P["arms"] = facepose(f, "hold")
                    P["prop"] = icons[0] if icons else None
                    expr["look"] = (f * 6, 3)
                if act == "give" and u >= 0.38:
                    hk = ramp(t, ut(0.38), ut(0.45))
                    P["arms"] = lerp_pose(POSE["rest"], facepose(f, "hold"), hk)
                    P["prop"] = icons[0] if icons else None
                expr = mix_expr(expr, EXPR[react], rk)
                rp = REACT_POSE.get(react)
                if rp and act not in ("see", "give"):
                    P["arms"] = lerp_pose(P["arms"], POSE[rp], rk)
                if react == "shock":
                    P["shake"] = 2.5 * ramp(t, ut(at), ut(at) + 0.08) * (1 - ramp(t, ut(at) + 0.3, ut(at) + 0.6))
                if react in ("sad", "angry", "shock"):
                    P["blush"] = rk
                if react == "laugh":
                    expr["mo"] = 6 + abs(math.sin(t * 14)) * 10 * rk
        else:  # bystanders
            if act == "laugh":
                lk = ramp(t, ut(0.18), ut(0.32))
                expr = mix_expr(expr, EXPR["laugh"], lk)
                expr["mo"] = 6 + abs(math.sin(t * 13 + i)) * 10 * lk
                P["arms"] = lerp_pose(POSE["rest"], POSE["laugh"], lk)
            elif sc.get("others"):
                expr = mix_expr(expr, EXPR[sc["others"]], ramp(t, ut(0.15), ut(0.35)))
        if i in sc.get("exprs", {}):
            expr = mix_expr(expr, EXPR[sc["exprs"][i]], ramp(t, ut(0.1), ut(0.3)))
        P.update(expr)
        P["look"] = expr.get("look", P["look"]) if "look" in expr else P["look"]
        heads[i] = draw_char(F, t, cid, x, f, P)
        xs[i] = x
    if sc.get("set") == "lifeboat":  # hull in front of whoever stands in the boat
        F.poly([(-215, -175), (215, -175), (180, 45), (-180, 45)], (0.55, 0.33, 0.18), "hull", wob=0.004, smooth_it=1, spec=0.15)
        F.cap((-225, -180), (225, -180), 16, (0.42, 0.25, 0.14), "rim")
        F.poly([(-260, -60), (260, -60), (300, 120), (-300, 120)], (0.20, 0.42, 0.60), "waterfront", wob=0.01, smooth_it=1, shade=0.3, shadow=0)
    for j, (ch, dx, dy, sz) in enumerate(sc.get("front", [])):
        emoji(F, ch, (dx, dy + math.sin(t * 2.5 + j) * 6), sz, f"front{j}")
    if act == "witness":
        kk = ramp(t, ut(0.2), ut(0.35))
        (ax, ay), (bx, by) = heads[0], heads[1]
        mx, my = (ax + bx) / 2, min(ay, by) - 40
        for j, ch in enumerate(icons or ["💋"]):
            emoji(F, ch, (mx + j * 50, my - 60 * j - 20 * math.sin(t * 3)), 70 * kk * (1 + 0.1 * math.sin(t * 8)), f"wit{j}")
        emoji(F, "❤️", (mx + 50, my - 90 - (t * 40) % 80), 38 * kk, "witheart")
    # bubbles
    if icons and act in ("tell", "say", "laugh", "react"):
        bp = back_out(ramp(t, ut(0.12), ut(0.2))) * (1 - ramp(t, ut(0.92), ut(0.99)))
        if act == "react":
            c = (0, -760)
            tail = None
        else:
            hx, hy = heads[spk]
            dirn = 1 if xs[you] >= xs[spk] else -1
            c = (hx + dirn * 110, hy - 220)
            if n == 3:
                c = (hx + dirn * 120, hy - 240)
            tail = (hx + dirn * 30, hy - 95)
        sp = sc.get("split")
        bubble(F, c, icons if not sp else icons[:1], bp, "bub", tail_to=tail)
        if sp:  # second phase icons replace first (e.g. hearts -> broken heart)
            pass
    if act == "see" and len(icons) > 1:
        hx, hy = heads[you]
        bp = back_out(ramp(t, ut(0.15), ut(0.25))) * (1 - ramp(t, ut(0.92), ut(0.99)))
        side = -1 if xs[you] > 0 else 1 if xs[you] < 0 else 0
        bubble(F, (hx + side * 150, hy - 220), icons[1:], bp, "seeb", tail_to=(hx + side * 60 + 20, hy - 80))
    if act == "give" and len(icons) > 1:
        bp = back_out(ramp(t, ut(0.5), ut(0.6))) * (1 - ramp(t, ut(0.92), ut(0.99)))
        bubble(F, (0, -780), icons[1:], bp, "giveb")
    if act == "think":
        hx, hy = heads[you]
        tb = back_out(ramp(t, ut(0.3), ut(0.42))) * (1 - ramp(t, ut(0.93), ut(0.995)))
        ic = icons if icons else ["❓"]
        bubble(F, (F.cx + (len(ic) < 3) * 30, hy - 250 + math.sin(t * 2.4) * 6), ic, tb, "think", think=True, tail_to=(hx + 40, hy - 100))
    # reaction pop over listener
    if act != "think" and react and rk > 0.05:
        hx, hy = heads[you]
        p = back_out(ramp(t, ut(at) + 0.05, ut(at) + 0.35))
        if react == "shock":
            jx = math.sin(t * 40) * 3 * (1 - ramp(t, ut(at) + 0.4, ut(at) + 1.0))
            ex, ey = hx + 95 + jx, hy - 130
            F.cap((ex, ey - 70 * p), (ex, ey - 5 * p), 14 * p, (0.95, 0.22, 0.20), "exc", rad2=9 * p, spec=0.3)
            F.ell((ex, ey + 22 * p), 12 * p, 12 * p, (0.95, 0.22, 0.20), "excdot", spec=0.3)
        elif react in REACT_ICON:
            emoji(F, REACT_ICON[react], (hx - 85 if xs[you] >= 0 else hx + 85, hy - 60), 58 * p, "ricon")
    return F.cv


# ============================================================ render
def seg_at(t):
    for i, s in enumerate(AD.segs):
        if s["t0"] <= t < s["t1"]:
            return i
    return len(AD.segs) - 1


def seg_img(i, t):
    s = AD.segs[i]
    if s["kind"] == "card":
        return scene_card(t, s)
    return scene_man(t, s) if s["kind"] == "man" else scene_story(t, s)


def scene_card(t, seg):
    """Chapter title card (e.g. CHOICE A / TELL RILEY) in the brand colors."""
    F = Frame(t, (0, 0, H))
    F.cv = clay.end_card(t)
    F.z, F.cx, F.cy = 1.0, W / 2, H / 2
    k = t - seg["t0"]
    p1 = back_out(ramp(k, 0.15, 0.6))
    p2 = back_out(ramp(k, 0.5, 0.95))
    p3 = back_out(ramp(k, 0.8, 1.3))
    d = seg["data"]
    if p1 > 0.02:
        F.text(d["title"], (W / 2, H * 0.34), W * 0.16 * p1, d.get("color", (0.98, 0.70, 0.18)), font=FONT_CAP, seed="ct1",
               stroke_div=60, shadow=0.6, spec=0.3)
    if p2 > 0.02:
        F.text(d["sub"], (W / 2, H * 0.45), W * 0.085 * p2, (0.96, 0.96, 0.92), font=FONT_CAP, seed="ct2",
               stroke_div=60, shadow=0.5, spec=0.2)
    if p3 > 0.02 and d.get("icon"):
        emoji(F, d["icon"], (W / 2, H * 0.60 + math.sin(t * 3) * 10), W * 0.22 * p3, "cticon")
    return F.cv


XF = 0.14


def render(t):
    if t < 1.0:
        img = np.zeros((H, W, 3), np.float32)
    else:
        i = seg_at(t)
        s = AD.segs[i]
        img = None
        if t < s["t0"] + XF and i > 0:
            a = smooth((t - (s["t0"] - XF)) / (2 * XF))
            img = seg_img(i - 1, t) * (1 - a) + seg_img(i, t) * a
        elif t >= s["t1"] - XF and i + 1 < len(AD.segs) and t < AD.CARD:
            a = smooth((t - (s["t1"] - XF)) / (2 * XF))
            img = seg_img(i, t) * (1 - a) + seg_img(i + 1, t) * a
        if img is None:
            img = seg_img(i, t)
    if t >= AD.CARD - 0.2:
        a = ramp(t, AD.CARD - 0.2, AD.CARD + 0.2)
        img = img * (1 - a) + clay.end_card(t) * a
    img = img * (1 - ramp(t, AD.DUR - 0.7, AD.DUR - 0.05))
    g = np.random.default_rng(int(t * 1000)).normal(0, 0.012, (H, W, 1)).astype(np.float32)
    img = np.clip(img + g, 0, 1)
    im = Image.fromarray((img * 255).astype(np.uint8))
    captions(im, t)
    draw_cards(im, t)
    if t >= AD.CARD - 0.2:
        clay.card_overlay(im, t)
    return im


def captions(im, t):
    if t >= AD.CARD - 0.2:
        return
    d = ImageDraw.Draw(im)
    fs = int(W * 0.062)
    fnt = font(FONT_CAP, fs)
    for ln in AD.lines:
        st, txt, dur = ln["t"], ln["text"], ln["dur"]
        if not (st - 0.05 <= t < st + dur + 0.35):
            continue
        words = txt.split()
        prog = (t - st) / max(dur, 0.1)
        nchar = sum(len(w) + 1 for w in words)
        acc, cur = 0, 0
        for j, w in enumerate(words):
            if acc / nchar <= prog + 0.02:
                cur = j
            acc += len(w) + 1
        # chunk into groups of at most 2 wrapped lines
        chunks, buf = [], []
        for j, w in enumerate(words):
            trial = " ".join(words[k] for k in buf + [j])
            if buf and len(clay.wrap(d, trial, fnt, W * 0.84)) > 2:
                chunks.append(buf)
                buf = [j]
            else:
                buf.append(j)
        chunks.append(buf)
        ch = next(c for c in chunks if cur <= c[-1])
        text = " ".join(words[k] for k in ch)
        y = H * 0.75
        if ln.get("name"):
            nf = font(FONT_CAP, int(fs * 0.62))
            d.text((W / 2, y - fs * 0.75), ln["name"].upper(), font=nf, fill=ln.get("color", (255, 214, 60)),
                   stroke_width=max(2, fs // 12), stroke_fill=(0, 0, 0), anchor="mm")
        k = ch[0]
        for line in clay.wrap(d, text, fnt, W * 0.84):
            lw = d.textlength(line, font=fnt)
            x = (W - lw) / 2
            for w in line.split():
                if k <= cur:
                    col = (255, 214, 60) if (k == cur and prog < 1) else (255, 255, 255)
                    d.text((x, y), w, font=fnt, fill=col, stroke_width=max(3, fs // 9), stroke_fill=(0, 0, 0))
                x += d.textlength(w + " ", font=fnt)
                k += 1
            y += fs * 1.22


def draw_cards(im, t):
    for c in AD.cards:
        if not (c["ta"] - 0.1 <= t < c["te"]) or t >= AD.CARD - 0.2:
            continue
        out = 1 - ramp(t, c["te"] - 0.3, c["te"])
        for j, (lab, txt, t0) in enumerate((("A", c["a"], c["ta"]), ("B", c["b"], c["tb"]))):
            p = back_out(ramp(t, t0, t0 + 0.35)) * out
            if p <= 0.01:
                continue
            cw, chh = int(W * 0.86), int(W * 0.17)
            y = int(H * (0.47 + j * 0.115))
            x = int((W - cw) / 2 + (1 - p) * W * 0.12 * (1 if j else -1))
            card = Image.new("RGBA", (cw, chh), (0, 0, 0, 0))
            cd = ImageDraw.Draw(card)
            cd.rounded_rectangle((0, 0, cw - 1, chh - 1), radius=chh // 3, fill=(15, 31, 24, 235),
                                 outline=(42, 168, 150, 255), width=max(3, W // 300))
            r = int(chh * 0.36)
            cxy = (int(chh * 0.5), chh // 2)
            cd.ellipse((cxy[0] - r, cxy[1] - r, cxy[0] + r, cxy[1] + r), fill=(42, 168, 150, 255))
            cd.text(cxy, lab, font=font(FONT_CAP, int(chh * 0.42)), fill=(255, 255, 255, 255), anchor="mm")
            tx = int(chh * 0.98)
            fs = int(chh * 0.27)
            f2 = font(FONT_SEMI, fs)
            lines = clay.wrap(cd, txt, f2, cw - tx - chh * 0.25)
            while len(lines) > 2 and fs > 12:
                fs -= 2
                f2 = font(FONT_SEMI, fs)
                lines = clay.wrap(cd, txt, f2, cw - tx - chh * 0.25)
            yy = chh / 2 - (len(lines) - 1) * fs * 0.6
            for ln in lines:
                cd.text((tx, yy), ln, font=f2, fill=(245, 245, 240, 255), anchor="lm")
                yy += fs * 1.2
            a = card.getchannel("A").point(lambda v: int(v * min(1, p)))
            card.putalpha(a)
            im.paste(card, (x, y), card)


# ============================================================ audio
def mix_audio(path):
    import soundfile as sf
    N = int(SR * AD.DUR)
    t = np.arange(N) / SR
    fx = np.zeros(N)
    rng = np.random.default_rng(1)

    def add(sig, t0, g=1.0):
        s = int(t0 * SR)
        if s >= N:
            return
        e = min(N, s + len(sig))
        fx[s:e] += sig[:e - s] * g

    def env(d, a=0.005, k=8):
        tt = np.arange(int(d * SR)) / SR
        return np.minimum(tt / a, 1) * np.exp(-tt * k), tt

    for kind, t0 in AD.sfx:
        if kind in ("clunk", "clunk2"):
            e, tt = env(0.6, 0.002, 9)
            sig = np.sin(2 * np.pi * 70 * tt) * e * 0.9 + rng.normal(0, 1, len(tt)) * np.exp(-tt * 120) * 0.5 + np.sin(2 * np.pi * 1350 * tt) * np.exp(-tt * 14) * 0.15
            add(sig, t0, 0.8 if kind == "clunk" else 0.35)
        elif kind == "whoosh":
            d = 0.5
            tt = np.arange(int(d * SR)) / SR
            n = rng.normal(0, 1, len(tt))
            k = np.exp(-np.linspace(0, 6, 400)); k /= k.sum()
            w = np.convolve(n, k, mode="same") * np.sin(np.pi * tt / d) ** 2 * 6
            add(w, t0, 0.5)
        elif kind == "sting":
            e, tt = env(1.6, 0.004, 2.5)
            sig = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(110, 1), (116.5, 0.8), (220, 0.4), (233, 0.3), (440, 0.1)]) * e
            add(sig, t0, 0.16)
        elif kind == "pop":
            e, tt = env(0.13, 0.001, 32)
            add(np.sin(2 * np.pi * (300 + 2500 * tt) * tt) * e, t0, 0.25)
        elif kind == "tick":
            e, tt = env(0.05, 0.0005, 90)
            add(np.sin(2 * np.pi * (2400 if int(t0 * 2) % 2 else 1800) * tt) * e, t0, 0.12)
        elif kind == "chime":
            e, tt = env(1.8, 0.003, 2.2)
            add(sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(523.3, 1), (659.3, 0.7), (784, 0.6), (1046.5, 0.3)]) * e, t0, 0.12)
    hum = (np.sin(2 * np.pi * 60 * t) + 0.4 * np.sin(2 * np.pi * 120 * t)) * 0.012 * (t > 1.0)
    pad = sum(a * np.sin(2 * np.pi * f * t + np.sin(t * 0.3) * 2) for f, a in [(55, 0.05), (82.4, 0.035), (110, 0.02), (164.8, 0.012)])
    pad *= np.clip((t - 1.0) / 2, 0, 1)
    mix = AD.voice[:N] + fx + hum + pad
    mix *= np.clip((AD.DUR - 0.05 - t) / 0.7, 0, 1)
    mix = mix / max(1e-6, np.abs(mix).max()) * 0.92
    sf.write(path, mix.astype(np.float32), SR)


def load(ad_id):
    global AD
    import ads_spec
    allads = list(ads_spec.ADS)
    try:  # new trend-based short ads made by the scheduled agent
        import ads_trends
        allads += ads_trends.ADS
    except ImportError:
        pass
    spec = next(a for a in allads if a["id"] == ad_id)
    AD = build(spec)
    for i, s in enumerate(AD.segs):
        s["idx"] = sum(ord(ch) for ch in ad_id)  # one consistent look per ad
    clay.CARD = AD.CARD
    clay.DUR = AD.DUR
    clay.DURS = []
    return AD


def _init(ad_id):
    load(ad_id)


def _job(i):
    return np.asarray(render(i / FPS)).tobytes()


def render_ad(ad_id, out):
    from multiprocessing import Pool
    load(ad_id)
    wavp = f"{S_DIR}/out/{ad_id}.wav"
    os.makedirs(f"{S_DIR}/out", exist_ok=True)
    mix_audio(wavp)
    n = int(AD.DUR * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-i", wavp, "-c:v", "libx264", "-preset", "medium", "-crf", "26",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", out],
                          stdin=subprocess.PIPE)
    with Pool(int(os.environ.get("PROCS", 4)), initializer=_init, initargs=(ad_id,)) as p:
        for b in p.imap(_job, range(n), chunksize=2):
            ff.stdin.write(b)
    ff.stdin.close()
    ff.wait()
    return AD.DUR


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "still":
        load(sys.argv[2])
        for ts in sys.argv[3:]:
            render(float(ts)).save(f"{S_DIR}/still_{sys.argv[2]}_{ts}.png")
        print("segments:", [(s["kind"], round(s["t0"], 2), round(s["t1"], 2)) for s in AD.segs], "DUR", round(AD.DUR, 2))
    elif cmd == "render":
        out_dir = sys.argv[2]
        for ad_id in sys.argv[3:]:
            import time
            t0 = time.time()
            d = render_ad(ad_id, f"{out_dir}/{ad_id}.mp4")
            print(f"done {ad_id} {d:.1f}s video in {time.time() - t0:.0f}s", flush=True)
