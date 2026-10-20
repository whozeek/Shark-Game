"""Contact sheet of frames from a finished video, for checking it before publishing.
    python3 frames.py video.mp4 sheet.png [count]     (evenly spaced, default 10)
"""
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw, ImageFont

video, out = sys.argv[1], sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 10
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).decode())
f = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", 18)
cols = min(n, 6)
rows = (n + cols - 1) // cols
sheet = Image.new("RGB", (270 * cols, 520 * rows), (20, 20, 20))
d = ImageDraw.Draw(sheet)
with tempfile.TemporaryDirectory() as tmp:
    for i in range(n):
        t = dur * (i + 0.5) / n
        p = os.path.join(tmp, f"{i}.png")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1",
                        "-vf", "scale=270:480", p], check=True)
        x, y = (i % cols) * 270, (i // cols) * 520
        sheet.paste(Image.open(p), (x, y + 40))
        d.text((x + 6, y + 10), f"t={t:.1f}s", font=f, fill=(255, 255, 255))
sheet.save(out)
print(f"{out}: {n} frames, video {dur:.1f}s")
