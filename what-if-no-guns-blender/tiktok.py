# Vertical 1080x1920 TikTok/Reels cut: 3D video centered over a blurred backdrop, big title and captions.
import json, glob, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
tl = json.load(open('build/timeline.json')); FPS = 24; W, H = 1080, 1920
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
ftitle = ImageFont.truetype(B, 132); fsub = ImageFont.truetype(B, 62); fcap = ImageFont.truetype(B, 66)
lines = [(s['start'] + l['start'] - .1, s['start'] + l['end'] + .3, l['text']) for s in tl['scenes'] for l in s['lines']]
for i in range(len(lines) - 1): lines[i] = (lines[i][0], min(lines[i][1], lines[i + 1][0] - .05), lines[i][2])
VH = 608; VY = 640
fs = sorted(glob.glob('build/final/f_*.jpg'))
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', 'build/mix.wav',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'what-if-all-guns-vanished-tiktok.mp4'], stdin=subprocess.PIPE)
def outlined(d, xy, s, font, fill, sw=8): d.text(xy, s, font=font, fill=fill, anchor='mm', stroke_width=sw, stroke_fill=(10, 10, 25))
for n, f in enumerate(fs):
    t = n / FPS; src = Image.open(f).convert('RGB')
    # blurred, darkened backdrop from the same frame
    bg = src.crop((328, 0, 632, 540)).resize((135, 240)).filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BICUBIC)
    im = ImageEnhance.Brightness(bg).enhance(.45); d = ImageDraw.Draw(im, 'RGBA')
    d.rounded_rectangle((-20, VY - 14, W + 20, VY + VH + 14), 0, fill=(255, 255, 255, 235))
    im.paste(src.resize((W, VH), Image.LANCZOS), (0, VY))
    outlined(d, (W / 2, 300), 'WHAT IF?', ftitle, (255, 210, 63), 12)
    outlined(d, (W / 2, 430), 'every gun on Earth', fsub, 'white'); outlined(d, (W / 2, 510), 'just vanished...', fsub, 'white')
    for a, b, txt in lines:
        if a <= t <= b:
            rows = []; cur = ''
            for w in txt.split():
                s = (cur + ' ' + w).strip()
                if d.textlength(s, font=fcap) > 940 and cur: rows.append(cur); cur = w
                else: cur = s
            rows.append(cur)
            for i, r in enumerate(rows): outlined(d, (W / 2, 1380 + i * 86), r, fcap, (255, 210, 63) if i % 2 == 0 and len(rows) == 1 else 'white')
    im.save(ff.stdin, 'JPEG', quality=93)
ff.stdin.close(); ff.wait(); print('frames', len(fs))
