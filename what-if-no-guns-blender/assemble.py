# Burns captions onto the Blender frames, upscales to 1080p and muxes the audio.
import json, glob, subprocess
from PIL import Image, ImageDraw, ImageFont
tl = json.load(open('build/timeline.json')); FPS = 24
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 44)
small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
lines = [(s['start'] + l['start'] - .1, s['start'] + l['end'] + .3, l['text']) for s in tl['scenes'] for l in s['lines']]
for i in range(len(lines) - 1): lines[i] = (lines[i][0], min(lines[i][1], lines[i + 1][0] - .05), lines[i][2])
fs = sorted(glob.glob('build/final/f_*.jpg'))
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', 'build/mix.wav',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'what-if-all-guns-vanished-blender.mp4'], stdin=subprocess.PIPE)
for n, f in enumerate(fs):
    t = n / FPS; im = Image.open(f).convert('RGB').resize((1920, 1080), Image.LANCZOS); d = ImageDraw.Draw(im, 'RGBA')
    for a, b, txt in lines:
        if a <= t <= b:
            words = txt.split(); rows = []; cur = ''
            for w in words:
                s = (cur + ' ' + w).strip()
                if d.textlength(s, font=font) > 1500 and cur: rows.append(cur); cur = w
                else: cur = s
            rows.append(cur); h = len(rows) * 58 + 28; wmax = max(d.textlength(r, font=font) for r in rows) + 60; y0 = 1080 - 50 - h
            d.rounded_rectangle((960 - wmax / 2, y0, 960 + wmax / 2, y0 + h), 18, fill=(0, 0, 0, 165))
            for i, r in enumerate(rows): d.text((960, y0 + 14 + 29 + i * 58), r, font=font, fill='white', anchor='mm')
    d.text((1890, 40), 'WHAT IF?', font=small, fill=(255, 255, 255, 150), anchor='rm')
    im.save(ff.stdin, 'JPEG', quality=95)
ff.stdin.close(); ff.wait(); print('frames', len(fs))
