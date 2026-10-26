"""Wraps an ad.py short in the open-loop format (see ads_loop.py)."""
import os, sys, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import ad, clay
from clay import W, H, FPS, font, FONT_CAP

FONT_SEMI = ad.FONT_SEMI
FONT_REG = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
EMOJI = ad.EMOJI_FONT
SKIP = 0.7      # trim most of ad.py's 1s black lead-in
FLASH = 0.25    # open-loop flash at the start (and again at the very end)
CUT = 1.0       # buried fast cut length
SPEC = None


def load(ad_id):
    global SPEC, DUR, CUT_T
    import ads_loop
    SPEC = next(a for a in ads_loop.ADS if a["id"] == ad_id)
    A = ad.build(SPEC)
    ad.AD = A
    for s in A.segs:
        s["idx"] = sum(ord(ch) for ch in ad_id)
    clay.CARD, clay.DUR, clay.DURS = A.CARD, A.DUR, []
    # fast cut starts 0.35s into the chosen scene's narration
    scenes = [s for s in A.segs if s["kind"] == "scene"]
    CUT_T = scenes[SPEC.get("cut_beat", 0)]["vs"] + 0.35 - SKIP
    # end on the end card, then cut straight to the flash frame (= frame 0)
    DUR = A.DUR - 0.7 - SKIP + FLASH
    return A


# ------------------------------------------------------------ phone close-up
def _text(d, xy, s, fnt, fill):
    """Draws text, switching to the emoji font for non-latin symbols."""
    x, y = xy
    ef = font(EMOJI, 109)
    for ch in s:
        if ord(ch) > 0x2000 and ch not in "’“”…":
            g = Image.new("RGBA", (136, 128), (0, 0, 0, 0))
            ImageDraw.Draw(g).text((0, 0), ch, font=ef, embedded_color=True)
            sz = int(fnt.size * 1.1)
            g = g.resize((int(sz * 136 / 128), sz), Image.LANCZOS)
            d._image.paste(g, (int(x), int(y + fnt.size * 0.05)), g)
            x += sz * 1.1
        else:
            d.text((x, y), ch, font=fnt, fill=fill)
            x += d.textlength(ch, font=fnt)


def phone(scroll=0.0, focus_last=False, seed=0):
    """Clay-lit phone filling the frame. focus_last: only the last bubble is sharp (the hook frame)."""
    th = SPEC["thread"]
    rng = np.random.default_rng(seed)
    img = Image.new("RGB", (W, H), (14, 16, 30))
    g = np.linspace(0, 1, H)[:, None, None]
    bg = (np.array([40, 34, 70]) * (1 - g) + np.array([8, 10, 20]) * g).repeat(W, axis=1)
    img = Image.fromarray(bg.astype(np.uint8))
    d = ImageDraw.Draw(img)
    px0, py0, px1, py1 = 90, 330, W - 90, H - 60
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((px0 + 20, py0 + 40, px1 + 20, py1 + 40), 110, fill=170)
    img.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(40)))
    d.rounded_rectangle((px0, py0, px1, py1), 110, fill=(28, 28, 34))
    d.rounded_rectangle((px0 + 6, py0 + 6, px1 - 6, py1 - 6), 106, outline=(80, 80, 92), width=4)
    sx0, sy0, sx1, sy1 = px0 + 34, py0 + 34, px1 - 34, py1 - 34
    scr = Image.new("RGB", (sx1 - sx0, sy1 - sy0), (250, 250, 252))
    sd = ImageDraw.Draw(scr)
    sw = scr.width
    # bubbles
    f = font(FONT_REG, 50)
    y = 330 - scroll
    sd.text((sw / 2, y), th["stamp"], font=font(FONT_SEMI, 32), fill=(140, 140, 150), anchor="mm")
    y += 60
    boxes = []
    for i, m in enumerate(th["msgs"]):
        lines = clay.wrap(sd, m, f, sw * 0.62)
        bw = max(sd.textlength(l, font=f) for l in lines) + 70
        bh = len(lines) * 62 + 44
        boxes.append((i, lines, 36, y, bw, bh))
        y += bh + 22
    last = len(boxes) - 1
    for i, lines, x, y, bw, bh in boxes:
        big = focus_last and i == last
        if big:
            fb = font(FONT_SEMI, 92)
            bw = sd.textlength(lines[0], font=fb) + 110
            bh = 160
            x, y = (sw - bw) / 2, scr.height * 0.52
            layer = scr.filter(ImageFilter.GaussianBlur(14))
            scr.paste(layer)
            sd = ImageDraw.Draw(scr)
            sd.rounded_rectangle((x, y, x + bw, y + bh), 70, fill=(229, 229, 234))
            _text(sd, (x + 55, y + 28), lines[0], fb, (10, 10, 12))
            continue
        sd.rounded_rectangle((x, y, x + bw, y + bh), 40, fill=(229, 229, 234))
        for k, l in enumerate(lines):
            _text(sd, (x + 35, y + 20 + k * 62), l, f, (10, 10, 12))
    # header
    sd.rectangle((0, 0, sw, 260), fill=(242, 242, 246))
    sd.ellipse((sw / 2 - 55, 70, sw / 2 + 55, 180), fill=(150, 120, 200))
    sd.text((sw / 2, 125), th["contact"][0], font=font(FONT_CAP, 64), fill=(255, 255, 255), anchor="mm")
    sd.text((sw / 2, 222), th["contact"], font=font(FONT_SEMI, 40), fill=(20, 20, 24), anchor="mm")
    sd.rounded_rectangle((sw / 2 - 90, 26, sw / 2 + 90, 60), 17, fill=(10, 10, 12))
    # input bar
    sd.rectangle((0, scr.height - 150, sw, scr.height), fill=(246, 246, 248))
    sd.rounded_rectangle((40, scr.height - 120, sw - 40, scr.height - 50), 35, outline=(200, 200, 206), width=3)
    sd.text((80, scr.height - 85), "iMessage", font=font(FONT_REG, 36), fill=(170, 170, 178), anchor="lm")
    mask = Image.new("L", scr.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, scr.width - 1, scr.height - 1), 80, fill=255)
    img.paste(scr, (sx0, sy0), mask)
    # soft clay highlight
    hl = Image.new("L", (W, H), 0)
    ImageDraw.Draw(hl).ellipse((px0 - 200, py0 - 300, px0 + 600, py0 + 500), fill=40)
    img.paste((255, 255, 255), (0, 0), hl.filter(ImageFilter.GaussianBlur(120)))
    return img


def glitch(im, t, amt=1.0):
    rng = np.random.default_rng(int(t * 1000))
    a = np.asarray(im).copy()
    off = int(rng.integers(8, 22) * amt)
    a[:, :, 0] = np.roll(a[:, :, 0], off, axis=1)
    a[:, :, 2] = np.roll(a[:, :, 2], -off // 2, axis=1)
    for _ in range(int(5 * amt)):
        y = int(rng.integers(0, H - 80)); h = int(rng.integers(10, 70))
        a[y:y + h] = np.roll(a[y:y + h], int(rng.integers(-60, 60)), axis=1)
    a[::4] = (a[::4] * 0.82).astype(np.uint8)
    return Image.fromarray(a)


def hook_caption(im):
    d = ImageDraw.Draw(im)
    fs = int(W * 0.068)
    fnt = font(FONT_CAP, fs)
    for k, line in enumerate(clay.wrap(d, SPEC["hook"], fnt, W * 0.84)):
        d.text((W / 2, H * 0.085 + k * fs * 1.2), line, font=fnt, fill=(255, 214, 60), stroke_width=fs // 8,
               stroke_fill=(0, 0, 0), anchor="mm")


_cache = {}


def hook_frame(t):
    if "hook" not in _cache:
        _cache["hook"] = phone(focus_last=True)
    im = glitch(_cache["hook"], t, 0.6)
    hook_caption(im)
    return im


def frame(u):
    if u < FLASH or u >= DUR - FLASH:
        return hook_frame(u if u < FLASH else u - (DUR - FLASH))
    t = u + SKIP
    if CUT_T <= u < CUT_T + CUT:
        i = int((u - CUT_T) / (CUT / 4))
        key = f"cut{i}"
        if key not in _cache:
            _cache[key] = phone(scroll=[0, 60, 130, 30][i], seed=i)
        im = _cache[key]
        return glitch(im, u, 1.0 if i % 2 else 0.4)
    im = ad.render(t)
    if u < 2.4:  # keep the question on screen until the man starts talking
        hook_caption(im)
    return im


# ------------------------------------------------------------ audio
def mix_audio(path):
    import soundfile as sf
    src = path + ".src.wav"
    ad.mix_audio(src)
    a, sr = sf.read(src, dtype="float32")
    a = a[int(SKIP * sr):]
    N = int(DUR * sr)
    a = np.concatenate([np.zeros(int(FLASH * sr * 0), np.float32), a])[:N]
    a = np.pad(a, (0, max(0, N - len(a))))
    rng = np.random.default_rng(3)

    def burst(t0, d=0.09, g=0.35):
        s = int(t0 * sr); n = int(d * sr)
        tt = np.arange(n) / sr
        sig = (rng.normal(0, 1, n) * 0.6 + np.sign(np.sin(2 * np.pi * 900 * tt))) * np.exp(-tt * 40)
        a[s:s + n] += (sig * g)[:max(0, min(n, N - s))]
    burst(0.0, 0.2)
    for i in range(4):
        burst(CUT_T + i * CUT / 4)
    burst(DUR - FLASH, 0.2)
    a = a / max(1e-6, np.abs(a).max()) * 0.92
    sf.write(path, a, sr)
    os.remove(src)


def render_ad(ad_id, out):
    load(ad_id)
    os.makedirs(f"{clay.S_DIR}/out", exist_ok=True)
    wavp = f"{clay.S_DIR}/out/{ad_id}.wav"
    mix_audio(wavp)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-i", wavp, "-c:v", "libx264", "-preset", "medium", "-crf", "22",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", out],
                          stdin=subprocess.PIPE)
    from multiprocessing import Pool
    n = int(DUR * FPS)
    with Pool(int(os.environ.get("PROCS", 4)), initializer=load, initargs=(ad_id,)) as p:
        for b in p.imap(_job, range(n), chunksize=2):
            ff.stdin.write(b)
    ff.stdin.close()
    ff.wait()
    return DUR


def _job(i):
    return np.asarray(frame(i / FPS).convert("RGB")).tobytes()


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "still":
        load(sys.argv[2])
        for ts in sys.argv[3:]:
            frame(float(ts)).convert("RGB").save(f"{clay.S_DIR}/out/loop_{sys.argv[2]}_{ts}.png")
        print("cut at", round(CUT_T, 2), "DUR", round(DUR, 2))
    elif cmd == "render":
        for ad_id in sys.argv[3:]:
            d = render_ad(ad_id, f"{sys.argv[2]}/{ad_id}.mp4")
            print(f"done {ad_id} {d:.1f}s", flush=True)
