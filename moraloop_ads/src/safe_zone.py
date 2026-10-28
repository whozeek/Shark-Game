"""TikTok-safe placement for every Moraloop video (shared by ad.py, story.py, loop_ad.py and clay.py).

All essential text (hooks, questions, subtitles, choice cards, chapter cards, end card) must sit inside
the SAFE area below, with PAD pixels of breathing room. Positions are for the 1080x1920 export.

Danger zones (conservative, covers TikTok's current For You feed on notched / Dynamic Island phones,
long captions, and the extra rows TikTok sometimes adds above the caption):
  top     0-250    status bar, Dynamic Island, LIVE / Following / For You tabs, search
  right   x>=880 from y=760 down: avatar + follow, like, comment, save, share, sound disc (and counts)
          x>=960 above that (edge margin)
  bottom  y>=1320  username, 2-line caption + "more", sound row, search / playlist / CTA rows, nav bar
  left    x<120    edge margin

Check any frame or video against the overlay:
    python3 safe_zone.py overlay out.png                     # just the overlay
    python3 safe_zone.py check video.mp4 out.png [t1 t2 ...]  # frames under the overlay (default: first,
                                                             # 9 evenly spaced, last) + text-outside-safe report
"""
import os, sys, subprocess, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
TOP = 250            # nothing essential above this
BOTTOM = 1320        # nothing essential below this
LEFT = 120
RIGHT = 960          # above RAIL_Y
RAIL_Y = 760         # the right-side button rail starts here
RAIL_X = 880         # ...and everything right of this is covered below RAIL_Y
PAD = 24             # extra breathing room around text, inside the safe area


def max_centered_width(y0, y1, w=W):
    """Widest horizontally centered text block that stays safe between rows y0..y1 (with padding)."""
    s = w / W
    right = RAIL_X * s if y1 * s >= RAIL_Y * s else RIGHT * s
    half = min(w / 2 - LEFT * s, right - w / 2) - PAD * s
    return 2 * half


def safe_rect(y=None):
    """(x0, y0, x1, y1) of the safe area, with padding. If y is given, the right edge for that row."""
    r = RAIL_X if (y is None or y >= RAIL_Y) else RIGHT
    return (LEFT + PAD, TOP + PAD, r - PAD, BOTTOM - PAD)


def caption_rows(n_lines, fs, line_h=1.22, name=False):
    """Top y for a subtitle block of n_lines so its bottom (plus a name label) ends inside the safe area."""
    block = n_lines * fs * line_h + (fs * 0.75 if name else 0)
    return BOTTOM - PAD - block


# ---------------------------------------------------------------- overlay
def _f(size, bold=False):
    p = "/usr/share/fonts/opentype/inter/Inter-%s.otf" % ("Bold" if bold else "SemiBold")
    return ImageFont.truetype(p, size)


def overlay(w=W, h=H):
    """RGBA mock of TikTok's current For You interface at export size, with danger zones tinted red and
    the safe area outlined green. Built from TikTok's published 2026 safe-zone specs and the feed layout;
    not a pixel copy of the app."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    red = (255, 40, 60, 70)
    d.rectangle((0, 0, W, TOP), fill=red)
    d.rectangle((0, BOTTOM, W, H), fill=red)
    d.rectangle((RAIL_X, RAIL_Y, W, BOTTOM), fill=red)
    d.rectangle((RIGHT, TOP, W, RAIL_Y), fill=(255, 40, 60, 40))
    d.rectangle((0, TOP, LEFT, BOTTOM), fill=(255, 40, 60, 40))
    # top gradient + status bar + tabs
    for y in range(0, 300):
        d.line((0, y, W, y), fill=(0, 0, 0, int(110 * (1 - y / 300))))
    wh = (255, 255, 255, 235)
    gr = (255, 255, 255, 150)
    d.text((70, 58), "9:41", font=_f(40, True), fill=wh)
    d.rounded_rectangle((W / 2 - 125, 30, W / 2 + 125, 100), 35, fill=(0, 0, 0, 255))  # Dynamic Island
    d.rounded_rectangle((W - 140, 62, W - 70, 92), 8, outline=wh, width=3)
    d.rectangle((W - 135, 67, W - 95, 87), fill=wh)
    d.text((48, 160), "LIVE", font=_f(34, True), fill=gr)
    x = 230
    for lab, col in (("Explore", gr), ("Following", gr), ("For You", wh)):
        d.text((x, 156), lab, font=_f(42, True), fill=col)
        x += d.textlength(lab, font=_f(42, True)) + 46
    d.rectangle((x - 46 - d.textlength("For You", font=_f(42, True)) + 40, 216, x - 46 - 40, 222), fill=wh)
    d.ellipse((W - 108, 158, W - 60, 206), outline=wh, width=5)
    d.line((W - 66, 200, W - 46, 222), fill=wh, width=6)
    # right rail
    cx = 1010
    d.ellipse((cx - 52, 830, cx + 52, 934), fill=(200, 200, 200, 220), outline=wh, width=4)
    d.ellipse((cx - 20, 912, cx + 20, 952), fill=(254, 44, 85, 255))
    d.text((cx, 931), "+", font=_f(36, True), fill=wh, anchor="mm")
    icons = [("♥", 1030, "48.2K"), ("…", 1185, "1,204"), ("★", 1340, "3,118"), ("➦", 1495, "906")]
    for sym, y, cnt in icons:
        d.ellipse((cx - 44, y - 44, cx + 44, y + 44), fill=(255, 255, 255, 200))
        d.text((cx, y + 72), cnt, font=_f(28, True), fill=wh, anchor="mm")
    d.ellipse((cx - 46, 1640, cx + 46, 1732), fill=(40, 40, 40, 235), outline=(90, 90, 90, 255), width=10)
    # bottom gradient, caption block, sound row, nav bar
    for y in range(1300, H):
        d.line((0, y, W, y), fill=(0, 0, 0, int(150 * (y - 1300) / (H - 1300))))
    d.rounded_rectangle((40, 1380, 560, 1440), 14, fill=(255, 255, 255, 60))
    d.text((64, 1410), "Search · would you tell", font=_f(30), fill=wh, anchor="lm")
    d.text((40, 1478), "moraloop", font=_f(40, True), fill=wh)
    d.text((240, 1484), "· 2d ago", font=_f(32), fill=gr)
    d.text((40, 1540), "Your friend asks you to keep a secret.", font=_f(36), fill=wh)
    d.text((40, 1588), "What would you do? 👇 #moraloop …more", font=_f(36), fill=wh)
    d.text((40, 1650), "See translation", font=_f(30, True), fill=gr)
    d.text((40, 1712), "♫  original sound - moraloop", font=_f(34), fill=wh)
    d.rectangle((0, 1790, W, H), fill=(0, 0, 0, 245))
    for i, lab in enumerate(("Home", "Friends", "", "Inbox", "Profile")):
        x = 108 + i * 216
        if lab:
            d.text((x, 1880), lab, font=_f(26, True), fill=wh if i == 0 else gr, anchor="mm")
            d.rounded_rectangle((x - 26, 1812, x + 26, 1856), 10, outline=wh if i == 0 else gr, width=5)
        else:
            d.rounded_rectangle((x - 62, 1812, x + 62, 1876), 18, fill=wh)
            d.text((x, 1844), "+", font=_f(56, True), fill=(0, 0, 0, 255), anchor="mm")
    # safe area outline (dashed) + padded inner line
    g = (40, 230, 120, 255)
    pts = [(LEFT, TOP), (RIGHT, TOP), (RIGHT, RAIL_Y), (RAIL_X, RAIL_Y), (RAIL_X, BOTTOM), (LEFT, BOTTOM), (LEFT, TOP)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) / 24) or 1
        for k in range(0, n, 2):
            a, b = k / n, min(1, (k + 1) / n)
            d.line((x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, x0 + (x1 - x0) * b, y0 + (y1 - y0) * b), fill=g, width=5)
    d.text((LEFT + 8, TOP + 6), "SAFE AREA", font=_f(26, True), fill=g)
    if (w, h) != (W, H):
        ov = ov.resize((w, h), Image.LANCZOS)
    return ov


def unsafe_mask(w=W, h=H):
    m = np.ones((h, w), bool)
    s = w / W
    m[int(TOP * s):int(BOTTOM * s), int(LEFT * s):int(RIGHT * s)] = False
    m[int(RAIL_Y * s):int(BOTTOM * s), int(RAIL_X * s):] = True
    return m


def text_pixels_outside(img):
    """Rough detector for caption-style text (bright white/yellow fill with a black stroke) in the unsafe
    zones. Returns the fraction of unsafe-zone pixels that look like stroked text."""
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    bright = (a.min(axis=2) > 225) | ((a[..., 0] > 235) & (a[..., 1] > 190) & (a[..., 2] < 90))
    dark = a.max(axis=2) < 25
    from PIL import ImageFilter
    near_dark = np.asarray(Image.fromarray((dark * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    hit = bright & near_dark
    m = unsafe_mask(a.shape[1], a.shape[0])
    return hit[m].mean(), hit & m


def frame_at(video, t, path):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{max(0, t):.3f}", "-i", video, "-frames:v", "1", path],
                   check=True)
    return Image.open(path).convert("RGB")


def duration(video):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                          "csv=p=0", video]).decode())


def check(video, out, times=None, cols=6, label=None):
    """Contact sheet of frames under the overlay. Default: first frame, 10 evenly spaced, last frame."""
    dur = duration(video)
    if not times:
        times = [0.0] + [dur * (i + 0.5) / 10 for i in range(10)] + [max(0, dur - 0.05)]
    ov = overlay(360, 640)
    cols = min(cols, len(times))
    rows = (len(times) + cols - 1) // cols
    sheet = Image.new("RGB", (360 * cols, 690 * rows + (50 if label else 0)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    off = 50 if label else 0
    if label:
        d.text((10, 10), label, font=_f(28, True), fill=(255, 255, 255))
    flags = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, t in enumerate(times):
            im = frame_at(video, t, os.path.join(tmp, f"{i}.png"))
            frac, hit = text_pixels_outside(im)
            sm = im.resize((360, 640), Image.LANCZOS).convert("RGBA")
            sm.alpha_composite(ov)
            x, y = (i % cols) * 360, (i // cols) * 690 + off
            sheet.paste(sm.convert("RGB"), (x, y + 44))
            bad = frac > 0.002
            if bad:
                flags.append(round(t, 2))
            d.text((x + 8, y + 8), f"t={t:.2f}s" + ("  TEXT OUTSIDE?" if bad else ""), font=_f(24, True),
                   fill=(255, 90, 90) if bad else (255, 255, 255))
    sheet.save(out)
    return flags


def check_images(paths, out, cols=6):
    """Same as check(), for stills (PNG paths)."""
    ov = overlay(360, 640)
    cols = min(cols, len(paths))
    rows = (len(paths) + cols - 1) // cols
    sheet = Image.new("RGB", (360 * cols, 690 * rows), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    flags = []
    for i, p in enumerate(paths):
        im = Image.open(p).convert("RGB")
        frac, _ = text_pixels_outside(im)
        sm = im.resize((360, 640), Image.LANCZOS).convert("RGBA")
        sm.alpha_composite(ov)
        x, y = (i % cols) * 360, (i // cols) * 690
        sheet.paste(sm.convert("RGB"), (x, y + 44))
        bad = frac > 0.002
        if bad:
            flags.append(os.path.basename(p))
        d.text((x + 8, y + 8), os.path.basename(p)[-22:] + (" !" if bad else ""), font=_f(22, True),
               fill=(255, 90, 90) if bad else (255, 255, 255))
    sheet.save(out)
    return flags


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "overlay":
        overlay().save(sys.argv[2])
    elif cmd == "stills":
        print(check_images(sys.argv[3:], sys.argv[2]))
    elif cmd == "check":
        ts = [float(x) for x in sys.argv[4:]] or None
        fl = check(sys.argv[2], sys.argv[3], ts, label=os.path.basename(sys.argv[2]))
        print(f"{sys.argv[3]}: possible text in unsafe zones at {fl}" if fl else f"{sys.argv[3]}: no text detected outside the safe area")
