"""Renders a 15s seamless-loop 9:16 ad for Shark Game.

Layer 1 (open loop): frame 0 is a megalodon eye + "1 in 10,000 players have seen this".
Layer 2 (buried clip): 6.0s-7.0s flashes the unlock steps too fast to read.
The last frame is the same eye shot, so the video loops back into its own hook.

Usage: python3 render.py [out.mp4]
"""
import math, random, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DUR = 1080, 1920, 30, 15.0
N = int(FPS * DUR)
OUT = sys.argv[1] if len(sys.argv) > 1 else "shark_loop_ad.mp4"

FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FONT_MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-ExtraBold.ttf"
def font(path, size): return ImageFont.truetype(path, size)
F_CAP = font(FONT_BOLD, 74)
F_HUD = font(FONT_BOLD, 54)
F_SMALL = font(FONT_BOLD, 38)
F_MONO = font(FONT_MONO, 30)
F_MONO_BIG = font(FONT_MONO, 44)

def lerp(a, b, k): return a + (b - a) * k
def clamp(v, lo=0.0, hi=1.0): return max(lo, min(hi, v))
def ease(k): k = clamp(k); return k * k * (3 - 2 * k)

# ---------- static layers ----------
def make_background():
    y = np.linspace(0, 1, H)[:, None]
    top, bot = np.array([18, 120, 170]), np.array([4, 22, 54])
    grad = (top * (1 - y) + bot * y)[:, None, :].repeat(W, axis=1)[:, :, 0, :] if False else None
    grad = np.zeros((H, W, 3))
    for c in range(3):
        grad[:, :, c] = (top[c] * (1 - y) + bot[c] * y)
    return Image.fromarray(grad.astype(np.uint8))

def make_rays():
    ray = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(ray)
    rnd = random.Random(3)
    for _ in range(7):
        x = rnd.randint(-200, W + 200)
        w = rnd.randint(60, 180)
        d.polygon([(x, 0), (x + w, 0), (x + w * 3 - 400, H), (x - 400, H)], fill=rnd.randint(18, 40))
    return ray.filter(ImageFilter.GaussianBlur(30))

BG = make_background()
RAYS = make_rays()

# ---------- sprites (drawn at 2x then downscaled for antialiasing) ----------
def shark_sprite(length, body=(120, 135, 150), belly=(215, 222, 228), teeth=False, eye_gold=False):
    S = 2
    L = int(length * S); Hh = int(length * 0.55 * S)
    img = Image.new("RGBA", (L, Hh), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cy = Hh * 0.55
    # body: torpedo facing right
    pts_top, pts_bot = [], []
    for i in range(41):
        u = i / 40
        x = L * (0.18 + 0.82 * u)
        thick = math.sin(math.pi * min(1, u * 1.15) ** 0.8) * Hh * 0.2
        pts_top.append((x, cy - thick))
        pts_bot.append((x, cy + thick * 0.95))
    tail_x = L * 0.18
    d.polygon([(tail_x + L * 0.04, cy), (0, cy - Hh * 0.42), (L * 0.07, cy), (0, cy + Hh * 0.3)], fill=body)
    d.polygon(pts_top + pts_bot[::-1], fill=body)
    belly_pts = [(x, y) for x, y in pts_bot[8:36]]
    d.polygon([(belly_pts[0][0], cy + 2)] + belly_pts + [(belly_pts[-1][0], cy + 2)], fill=belly)
    # dorsal + pectoral fins
    d.polygon([(L * 0.48, cy - Hh * 0.18), (L * 0.56, cy - Hh * 0.5), (L * 0.66, cy - Hh * 0.17)], fill=body)
    d.polygon([(L * 0.6, cy + Hh * 0.12), (L * 0.5, cy + Hh * 0.42), (L * 0.7, cy + Hh * 0.14)], fill=body)
    # gills
    for g in range(3):
        gx = L * (0.72 + g * 0.025)
        d.line([(gx, cy - Hh * 0.08), (gx - L * 0.01, cy + Hh * 0.06)], fill=(70, 80, 95), width=max(2, S * 2))
    # eye
    ex, ey, er = L * 0.86, cy - Hh * 0.06, Hh * 0.035
    d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=(255, 190, 40) if eye_gold else (10, 10, 14))
    if eye_gold:
        d.ellipse([ex - er * 0.3, ey - er, ex + er * 0.3, ey + er], fill=(10, 10, 14))
    # mouth
    mx0, mx1, my = L * 0.8, L * 0.95, cy + Hh * 0.07
    d.line([(mx0, my), (mx1, my - Hh * 0.02)], fill=(40, 20, 30), width=S * 3)
    if teeth:
        for k in range(9):
            tx = lerp(mx0, mx1, k / 9)
            ty = lerp(my, my - Hh * 0.02, k / 9)
            d.polygon([(tx, ty), (tx + L * 0.008, ty + Hh * 0.04), (tx + L * 0.016, ty)], fill=(245, 245, 235))
    return img.resize((int(length), int(length * 0.55)), Image.LANCZOS)

def fish_sprite(size, color=(255, 140, 40), stripe=(255, 255, 255)):
    S = 4
    s = size * S
    img = Image.new("RGBA", (int(s * 1.5), int(s)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.polygon([(0, s * 0.15), (s * 0.4, s * 0.5), (0, s * 0.85)], fill=color)
    d.ellipse([s * 0.3, s * 0.1, s * 1.45, s * 0.9], fill=color)
    d.rectangle([s * 0.7, s * 0.15, s * 0.82, s * 0.85], fill=stripe)
    d.ellipse([s * 1.1, s * 0.3, s * 1.25, s * 0.45], fill=(15, 15, 20))
    return img.resize((int(size * 1.5), int(size)), Image.LANCZOS)

SHARK_R = shark_sprite(360)
SHARK_L = SHARK_R.transpose(Image.FLIP_LEFT_RIGHT)
PLAYER_R = fish_sprite(80)
PLAYER_L = PLAYER_R.transpose(Image.FLIP_LEFT_RIGHT)
GOLD = fish_sprite(60, color=(255, 205, 40), stripe=(255, 245, 190))
MEGA_BASE = shark_sprite(1400, body=(58, 64, 74), belly=(150, 158, 165), teeth=True, eye_gold=True)

def paste_center(dst, spr, x, y, alpha=1.0):
    if alpha < 1.0:
        spr = spr.copy()
        a = spr.getchannel("A").point(lambda v: int(v * alpha))
        spr.putalpha(a)
    dst.alpha_composite(spr, (int(x - spr.width / 2), int(y - spr.height / 2)))

# ---------- text ----------
def caption(img, text, y, size_font=F_CAP, fill=(255, 255, 255), stroke=(0, 0, 0), alpha=1.0, highlight=None):
    if alpha <= 0: return
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    lines = text.split("\n")
    lh = size_font.size * 1.18
    for i, line in enumerate(lines):
        w = d.textlength(line, font=size_font)
        x = (W - w) / 2
        yy = y + i * lh
        if highlight is not None:
            pad = 18
            d.rounded_rectangle([x - pad, yy - 6, x + w + pad, yy + size_font.size + 14], radius=14, fill=highlight)
            d.text((x, yy), line, font=size_font, fill=fill)
        else:
            d.text((x, yy), line, font=size_font, fill=fill, stroke_width=7, stroke_fill=stroke)
    if alpha < 1.0:
        layer.putalpha(layer.getchannel("A").point(lambda v: int(v * alpha)))
    img.alpha_composite(layer)

# ---------- game simulation (scripted) ----------
GOLD_TIMES = [8.0, 8.9, 9.8]
FREEZE_T = 10.0

def player_pos(t):
    tt = min(t, FREEZE_T)
    x = 540 + 330 * math.sin(0.95 * tt + 0.4)
    y = 1150 + 260 * math.sin(1.35 * tt + 1.0)
    return x, y

def player_facing(t):
    if t >= FREEZE_T: return 1
    dx = math.cos(0.95 * t + 0.4)
    return 1 if dx >= 0 else -1

SHARKS = [  # (lane y, speed px/s, phase, wobble)
    (760, 380, 0, 40),
    (1180, -430, 500, 60),
    (1560, 340, 900, 30),
]
def shark_states(t):
    out = []
    span = W + 800
    for lane, sp, ph, wob in SHARKS:
        x = ((ph + sp * t) % span) - 400
        y = lane + wob * math.sin(t * 1.7 + ph)
        out.append((x, y, 1 if sp > 0 else -1))
    return out

def score_at(t):
    base = int(t * 173)
    eaten = sum(1 for g in GOLD_TIMES if t >= g)
    return 4210 + base + eaten * 500

def bubbles(img, t, rnd_seed=7, count=40, alpha=1.0):
    d = ImageDraw.Draw(img)
    rnd = random.Random(rnd_seed)
    for _ in range(count):
        bx = rnd.uniform(0, W)
        sp = rnd.uniform(60, 160)
        r = rnd.uniform(4, 14)
        ph = rnd.uniform(0, H)
        y = H - ((ph + sp * t) % (H + 100))
        x = bx + 12 * math.sin(t * 2 + ph)
        a = int(110 * alpha)
        d.ellipse([x - r, y - r, x + r, y + r], outline=(200, 235, 255, a), width=3)

def ocean(t, dark=0.0):
    img = BG.copy().convert("RGBA")
    rays = RAYS.transform(RAYS.size, Image.AFFINE, (1, 0, 40 * math.sin(t * 0.6), 0, 1, 0))
    white = Image.new("RGBA", img.size, (180, 230, 255, 0))
    white.putalpha(rays.point(lambda v: int(v * (1 - dark))))
    img.alpha_composite(white)
    return img

def darken(img, k):
    if k <= 0: return img
    ov = Image.new("RGBA", img.size, (0, 4, 12, int(255 * clamp(k))))
    img.alpha_composite(ov)
    return img

def hud(img, t, gold_count):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([40, 150, 470, 250], radius=24, fill=(0, 0, 0, 120))
    d.text((70, 168), f"SCORE {score_at(t):,}", font=F_HUD, fill=(255, 255, 255))
    if t >= 7.0:
        d.rounded_rectangle([W - 330, 150, W - 40, 250], radius=24, fill=(0, 0, 0, 120))
        dots = "".join("●" if i < gold_count else "○" for i in range(3))
        d.text((W - 305, 168), "GOLD", font=F_HUD, fill=(255, 205, 40))
        d.text((W - 150, 172), dots, font=F_SMALL, fill=(255, 205, 40))

def footer(img):
    d = ImageDraw.Draw(img)
    txt = "SHARK GAME  ·  play free"
    w = d.textlength(txt, font=F_SMALL)
    d.rounded_rectangle([(W - w) / 2 - 30, H - 210, (W + w) / 2 + 30, H - 140], radius=35, fill=(255, 255, 255, 230))
    d.text(((W - w) / 2, H - 198), txt, font=F_SMALL, fill=(10, 30, 60))

def gameplay(t, dark=0.0, shark_alpha=1.0):
    img = ocean(t, dark)
    bubbles(img, t, alpha=1 - dark)
    eaten = sum(1 for g in GOLD_TIMES if t >= g)
    # gold fish appear at 7s, sit on the player's future path
    for i, g in enumerate(GOLD_TIMES):
        if 7.0 <= t < g:
            gx, gy = player_pos(g)
            bob = 10 * math.sin(t * 6 + i)
            glow = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
            ImageDraw.Draw(glow).ellipse([30, 30, 170, 170], fill=(255, 220, 80, 90))
            paste_center(img, glow.filter(ImageFilter.GaussianBlur(20)), gx, gy + bob)
            paste_center(img, GOLD, gx, gy + bob)
        elif g <= t < g + 0.35:  # pop
            gx, gy = player_pos(g)
            k = (t - g) / 0.35
            d = ImageDraw.Draw(img)
            r = 40 + 120 * k
            d.ellipse([gx - r, gy - r, gx + r, gy + r], outline=(255, 220, 80, int(255 * (1 - k))), width=8)
            d.text((gx + 40, gy - 90 - 60 * k), "+500", font=F_HUD, fill=(255, 220, 80, int(255 * (1 - k))))
    for x, y, f in shark_states(t):
        paste_center(img, SHARK_R if f > 0 else SHARK_L, x, y, alpha=shark_alpha)
    px, py = player_pos(t)
    py += 6 * math.sin(t * 8)
    paste_center(img, PLAYER_R if player_facing(t) > 0 else PLAYER_L, px, py)
    if t >= FREEZE_T:  # hold-still ring timer
        k = clamp((t - FREEZE_T) / 1.5)
        d = ImageDraw.Draw(img)
        r = 110
        d.arc([px - r, py - r, px + r, py + r], -90, -90 + 360 * k, fill=(255, 220, 80), width=10)
    img = darken(img, dark)
    hud(img, t, eaten)
    return img

# ---------- megalodon + eye ----------
def eye_closeup(s, t):
    """s in [0,1]: 0 = far, 1 = full-frame eye (the loop frame)."""
    img = Image.new("RGBA", (W, H), (4, 8, 16, 255))
    d = ImageDraw.Draw(img)
    # skin texture
    rnd = random.Random(11)
    skin = Image.new("RGBA", (W, H), (38, 44, 54, 255))
    sd = ImageDraw.Draw(skin)
    for _ in range(500):
        x, y = rnd.uniform(0, W), rnd.uniform(0, H)
        sd.line([(x, y), (x + rnd.uniform(20, 70), y + rnd.uniform(-6, 6))], fill=(52, 58, 70, 255), width=2)
    skin = skin.filter(ImageFilter.GaussianBlur(1.5))
    img.alpha_composite(skin)
    cx, cy = W / 2, H * 0.47
    R = lerp(120, 330, ease(s))
    # glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([cx - R * 1.6, cy - R * 1.6, cx + R * 1.6, cy + R * 1.6], fill=(255, 170, 30, 70))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(60)))
    d = ImageDraw.Draw(img)
    d.ellipse([cx - R * 1.08, cy - R * 1.08, cx + R * 1.08, cy + R * 1.08], fill=(12, 12, 16))
    # iris with rings
    for i in range(14, 0, -1):
        rr = R * i / 14
        c = (int(lerp(140, 255, i / 14)), int(lerp(70, 195, i / 14)), int(lerp(5, 50, i / 14)))
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=c)
    for a in range(0, 360, 9):
        ang = math.radians(a)
        d.line([(cx + math.cos(ang) * R * 0.35, cy + math.sin(ang) * R * 0.35),
                (cx + math.cos(ang) * R * 0.95, cy + math.sin(ang) * R * 0.95)], fill=(200, 120, 20), width=3)
    # slit pupil breathes slightly but returns to the same width at loop points
    pw = R * (0.22 + 0.03 * math.sin(2 * math.pi * t / DUR * 15))
    d.ellipse([cx - pw, cy - R * 0.92, cx + pw, cy + R * 0.92], fill=(5, 5, 8))
    d.ellipse([cx + R * 0.3, cy - R * 0.55, cx + R * 0.48, cy - R * 0.37], fill=(255, 250, 230, 220))
    # vignette
    vig = Image.new("L", (W, H), 0)
    ImageDraw.Draw(vig).ellipse([-200, 100, W + 200, H - 100], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(160))
    black = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    black.putalpha(vig.point(lambda v: 255 - v))
    img.alpha_composite(black)
    return img

def megalodon_scene(t):
    k = ease((t - 11.6) / 1.8)          # rise
    img = gameplay(min(t, 11.9), dark=lerp(0.55, 0.85, k), shark_alpha=0.0)
    scale = lerp(0.8, 1.15, k)
    spr = MEGA_BASE.resize((int(MEGA_BASE.width * scale), int(MEGA_BASE.height * scale)), Image.LANCZOS)
    spr = spr.transpose(Image.FLIP_LEFT_RIGHT)
    x = lerp(W * 1.0, W * 0.85, k)
    y = lerp(H + 500, H * 0.62, k) + 14 * math.sin(t * 9) * (1 - k)  # rumble
    paste_center(img, spr, x, y, alpha=clamp(k * 1.4))
    return img

# ---------- buried 1-second fast cut ----------
STEP_CARDS = [
    ["HIDDEN SHARK UNLOCK // v1.0.3", "1. eat 3 GOLD fish in one run", "   (they only spawn after 4,000 pts)", "2. don't get hit while collecting"],
    ["3. STOP moving. completely.", "   hold still for 3 seconds", "   (the ring fills gold)", "4. don't touch the screen edges"],
    ["5. if the water goes dark...", "   it worked.", "   ~1 in 10,000 runs find it", ">> MEGALODON: 5000 pts / bite"],
    ["// you weren't supposed to pause this", "// tell nobody", "", "steps: GOLD x3 > NO HIT > FREEZE 3s"],
]
def fast_cut(t, i):
    base = gameplay(t)
    rnd = random.Random(int(t * FPS))
    card = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    top = 640 + rnd.randint(-30, 30)
    d.rectangle([60, top - 40, W - 60, top + 300], fill=(0, 0, 0, 215))
    d.rectangle([60, top - 40, W - 60, top - 34], fill=(255, 205, 40, 255))
    for j, line in enumerate(STEP_CARDS[i]):
        d.text((95, top + j * 62), line, font=F_MONO_BIG if j == 0 else F_MONO, fill=(255, 230, 120) if j == 0 else (230, 240, 255))
    # chromatic split + jitter so it reads as a glitch at speed
    r, g, b, a = card.split()
    off = rnd.randint(6, 14)
    rc = Image.merge("RGBA", (r, Image.new("L", r.size, 0), Image.new("L", r.size, 0), a)).transform(card.size, Image.AFFINE, (1, 0, off, 0, 1, 0))
    base.alpha_composite(rc)
    base.alpha_composite(card, (rnd.randint(-8, 8), 0))
    # scanlines
    sl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sl)
    for y in range(0, H, 6): sd.line([(0, y), (W, y)], fill=(0, 0, 0, 50))
    base.alpha_composite(sl)
    return base

# ---------- timeline ----------
HOOK = "1 in 10,000 players\nhave seen this shark"
def frame(n):
    t = n / FPS
    if t < 0.3 or t >= 14.3:                       # loop frame: eye + hook
        s = 1.0 if t < 0.3 else ease((t - 14.3) / 0.7)
        img = eye_closeup(s, t)
        caption(img, HOOK, 260)
    elif t < 6.0:
        img = gameplay(t)
        if t < 3.0:
            caption(img, "there's a shark in this game\nyou're not supposed to see", 340)
        else:
            caption(img, "it's in this video.\nkeep watching.", 340, alpha=clamp((t - 3.0) * 5))
    elif t < 7.0:                                   # buried 1s clip: 4 cuts
        i = min(3, int((t - 6.0) / 0.25))
        img = fast_cut(t, i)
    elif t < 11.6:
        dark = 0.55 * ease((t - 10.4) / 1.2)
        img = gameplay(t, dark=dark, shark_alpha=1 - ease((t - 10.2) / 0.8))
        if t < 9.8:
            caption(img, "gold fish only spawn\nafter 4,000 points…", 340)
        elif t < 10.4:
            caption(img, "now don't move.", 380)
        else:
            caption(img, "wait.", 380, alpha=clamp((t - 10.4) * 4))
    else:
        img = megalodon_scene(t)
        if t < 13.4:
            caption(img, "the water goes dark first.", 340, alpha=clamp((t - 11.8) * 4))
        else:
            caption(img, "did you catch the steps?", 340, fill=(10, 10, 10), highlight=(255, 205, 40, 255))
    footer(img)
    return img.convert("RGB")

# ---------- audio ----------
def render_audio(path, sr=44100):
    n = int(sr * DUR)
    tt = np.arange(n) / sr
    # drone at frequencies whose periods divide DUR so it loops clean
    a = 0.12 * np.sin(2 * np.pi * 55 * tt) + 0.06 * np.sin(2 * np.pi * 82.4 * tt)
    a *= 0.7 + 0.3 * np.sin(2 * np.pi * tt / DUR * 4)
    def add(t0, dur, f0, f1, amp, noise=0.0):
        i0, i1 = int(t0 * sr), min(n, int((t0 + dur) * sr))
        k = np.linspace(0, 1, i1 - i0)
        ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * k) / sr
        sig = np.sin(ph) + noise * np.random.default_rng(int(t0 * 100)).standard_normal(len(k))
        a[i0:i1] += amp * sig * (1 - k) ** 2
    for c in range(4):                       # glitch ticks on each fast cut
        add(6.0 + c * 0.25, 0.08, 1800, 600, 0.25, noise=0.6)
    for g in GOLD_TIMES:                     # gold pickup chimes
        add(g, 0.25, 880, 1320, 0.25); add(g + 0.06, 0.25, 1320, 1760, 0.15)
    add(10.4, 1.4, 120, 40, 0.0)
    add(11.6, 2.2, 70, 28, 0.55, noise=0.15)  # megalodon boom
    add(14.3, 0.7, 40, 55, 0.2)
    a = np.clip(a, -1, 1)
    pcm = (a * 32000).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())

if __name__ == "__main__":
    wav = OUT.rsplit(".", 1)[0] + ".wav"
    render_audio(wav)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
                           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", OUT],
                          stdin=subprocess.PIPE)
    for n in range(N):
        ff.stdin.write(frame(n).tobytes())
        if n % 60 == 0: print(f"frame {n}/{N}", flush=True)
    ff.stdin.close(); ff.wait()
    print("wrote", OUT)
