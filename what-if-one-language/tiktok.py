# Vertical 1080x1920 TikTok/Reels cut: animation centered over a blurred backdrop, big title and captions.
import json, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
tl = json.load(open('build/timeline.json')); FPS = 30; W, H = 1080, 1920; VH = 608; VY = 640
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
ftitle = ImageFont.truetype(B, 132); fsub = ImageFont.truetype(B, 60); fcap = ImageFont.truetype(B, 64)
lines = [(s['start'] + l['start'] - .1, s['start'] + l['end'] + .3, l['text']) for s in tl['scenes'] for l in s['lines']]
for i in range(len(lines) - 1): lines[i] = (lines[i][0], min(lines[i][1], lines[i + 1][0] - .05), lines[i][2])
src = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', 'build/clean.mp4', '-vf', f'scale={W}:{VH}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', 'build/mix.wav',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'what-if-one-language-tiktok.mp4'], stdin=subprocess.PIPE)
def outlined(d, xy, s, font, fill, sw=8): d.text(xy, s, font=font, fill=fill, anchor='mm', stroke_width=sw, stroke_fill=(10, 10, 25))
n = 0
while True:
    raw = src.stdout.read(W * VH * 3)
    if len(raw) < W * VH * 3: break
    t = n / FPS; fr = Image.frombytes('RGB', (W, VH), raw)
    bg = fr.crop((370, 0, 710, VH)).resize((135, 240)).filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BICUBIC)
    im = ImageEnhance.Brightness(bg).enhance(.45); d = ImageDraw.Draw(im, 'RGBA')
    d.rectangle((0, VY - 14, W, VY + VH + 14), fill=(255, 255, 255, 235)); im.paste(fr, (0, VY))
    outlined(d, (W / 2, 290), 'WHAT IF?', ftitle, (255, 210, 63), 12)
    outlined(d, (W / 2, 425), 'everyone spoke the', fsub, 'white'); outlined(d, (W / 2, 505), 'same language...', fsub, (93, 242, 160))
    for a, b, txt in lines:
        if a <= t <= b:
            rows = []; cur = ''
            for w in txt.split():
                s = (cur + ' ' + w).strip()
                if d.textlength(s, font=fcap) > 940 and cur: rows.append(cur); cur = w
                else: cur = s
            rows.append(cur)
            for i, r in enumerate(rows): outlined(d, (W / 2, 1370 + i * 84), r, fcap, 'white')
    im.save(ff.stdin, 'JPEG', quality=93); n += 1
ff.stdin.close(); ff.wait(); print('frames', n)
