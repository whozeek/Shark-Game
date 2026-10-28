"""Build the TikTok-safe re-export report: before/after screenshots under the TikTok overlay + change list.

    python3 tiktoksafe_report.py        -> moraloop_ads/review/tiktoksafe/REPORT.md and <name>.jpg per video

Each JPG has two rows (ORIGINAL on top, TIKTOK-SAFE below) at the same moments: first frame, three points in
the video, the end card and the last frame, all under the TikTok interface overlay at export size.
"""
import os, sys, tempfile, datetime
from PIL import Image, ImageDraw
import safe_zone as SZ
import render_tiktoksafe as R

ROOT = R.ROOT
OUT = os.path.join(ROOT, "moraloop_ads/review/tiktoksafe")
FW, FH = 216, 384


def changes(j):
    k, key = j["kind"], j["key"]
    c = ["subtitles moved from the bottom caption area (y≈1440–1600) to just under TikTok's top bar, "
         "in balanced 2-line chunks",
         "end card: tagline moved below the top bar; COMING SOON moved from y≈1420 (caption area) to just under the logo"]
    if k in ("short", "loop_short"):
        import ads_spec, ads_trends, ads_loop
        spec = next((a for a in ads_spec.ADS + ads_trends.ADS + ads_loop.ADS if a["id"] == key), {})
        if any(kw.get("cards") for _, _, kw in spec.get("beats", [])):
            c.append("A/B answer cards narrowed to clear the right-side buttons and moved above the caption area "
                     "(long answers wrap at the same size); card B stays up at least 2.6 s")
    if k in ("story", "loop_long"):
        c.append("CHOICE A/B chapter cards moved above the button rail; long subtitles wrap instead of running off "
                 "screen; narration subtitles on these cards use the low safe band")
    if k in ("loop_short", "loop_long"):
        c.append("hook question moved from y≈160 (behind the For You tabs) into the safe area, balanced lines, "
                 "on screen at least 0.6 s + 0.3 s per word")
        c.append("hidden detail: phone thread sits higher with tighter bubble spacing (same text size) / note lines "
                 "wrap clear of the buttons, so the whole detail and its readable last line fit when paused")
    return c


def strip(video, times, ov):
    row = Image.new("RGB", (FW * len(times), FH), (0, 0, 0))
    with tempfile.TemporaryDirectory() as tmp:
        for i, t in enumerate(times):
            im = SZ.frame_at(video, t, os.path.join(tmp, f"{i}.png")).resize((FW, FH), Image.LANCZOS).convert("RGBA")
            im.alpha_composite(ov)
            row.paste(im.convert("RGB"), (i * FW, 0))
    return row


def sheet(orig, safe, out):
    d0, d1 = SZ.duration(orig), SZ.duration(safe)
    rel = lambda d: [0.0, d * 0.2, d * 0.45, d * 0.7, d - 2.2, max(0, d - 0.05)]
    ov = SZ.overlay(FW, FH)
    a, b = strip(orig, rel(d0), ov), strip(safe, rel(d1), ov)
    im = Image.new("RGB", (a.width, FH * 2 + 70), (20, 20, 20))
    dr = ImageDraw.Draw(im)
    dr.text((8, 6), "ORIGINAL", font=SZ._f(24, True), fill=(255, 110, 110))
    im.paste(a, (0, 34))
    dr.text((8, FH + 38), "TIKTOK-SAFE", font=SZ._f(24, True), fill=(90, 230, 140))
    im.paste(b, (0, FH + 68))
    im.save(out, quality=82)


def main():
    os.makedirs(OUT, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4))).replace(tzinfo=None)
    far = datetime.datetime(2099, 1, 1)
    J = R.jobs()
    log = {}
    lp = R.LOG
    if os.path.exists(lp):
        for ln in open(lp):
            p = ln.split()
            if len(p) > 1:
                log[p[1]] = ln.strip()
    done, missing = [], []
    for j in J:
        safe = os.path.join(ROOT, R.safe_name(j["rel"]))
        (done if os.path.exists(safe) else missing).append(j)
    md = ["# TikTok-safe re-export report", "",
          f"Generated {now:%Y-%m-%d %H:%M} US Eastern. Originals are untouched; each corrected copy sits next to its "
          "original as `<name>_tiktoksafe.mp4`. Upcoming queue rows and 30-day-plan entries point at the corrected "
          "copy; posts whose time had already passed (live posts) were left as they are.", "",
          f"**{len(done)} of {len(J)} videos re-exported.**" + (f" {len(missing)} still missing (listed at the end)." if missing else ""), "",
          "Safe area (1080×1920): top 250 px (status bar, Dynamic Island, tabs), right x≥880 from y=760 down (avatar, like, "
          "comment, save, share, sound), bottom from y=1320 (username, caption, sound row, nav bar), left 120 px, plus 24 px "
          "padding. Story, wording, voice, visuals, animation and timing are unchanged apart from the listed moves.", "",
          "Screenshots: each image shows the ORIGINAL (top) and TIKTOK-SAFE copy (bottom) under the TikTok overlay at the "
          "same moments: first frame, 20/45/70 % through, the end card and the last frame.", ""]
    md += ["| # | Video | Posting | Status | Changes | Screenshot |", "|---|---|---|---|---|---|"]
    for i, j in enumerate(done, 1):
        safe = os.path.join(ROOT, R.safe_name(j["rel"]))
        name = os.path.basename(R.safe_name(j["rel"]))[:-4]
        jpg = os.path.join(OUT, name + ".jpg")
        if not os.path.exists(jpg):
            try:
                sheet(os.path.join(ROOT, j["rel"]), safe, jpg)
            except Exception as e:
                print("sheet failed", j["rel"], e)
        when = "unscheduled" if j["when"] == far else j["when"].strftime("%a %b %d %I:%M %p")
        status = "live post left as is; copy kept for reference" if j["when"] < now else (
            "unscheduled" if j["when"] == far else "upcoming post now uses the safe copy")
        flags = log.get(j["rel"], "")
        note = ""
        if "flags=[]" not in flags and flags:
            note = " ⚠ overlay check flagged frames " + flags.split("flags=")[-1] + " (review the screenshot; glitch flash frames can trip the detector)"
        md.append(f"| {i} | `{R.safe_name(j['rel'])}` | {when} | {status} | " + "; ".join(changes(j)) + note +
                  f" | [view]({name}.jpg) |")
    md += ["", "## Not verified / flagged", "",
           "- The overlay is reconstructed from TikTok's published 2026 safe-zone specs and its feed layout, not captured "
           "from the app on a real device. Placement can vary by phone, Android navigation bar, caption length and app version; "
           "the safe area is deliberately conservative to cover that.",
           "- Day 1 `moral_loop_claymation.mp4` (posted Oct 23) could not be re-exported: its voice audio files are not in the repo. "
           "It is already live and was left untouched.",
           "- The App Store badge layout (off until launch) has not been moved into the safe area yet; re-check it with "
           "`safe_zone.py` before turning it on.",
           "- The automatic text detector is a heuristic; every flagged frame above should be checked by eye."]
    if missing:
        md += ["", "## Still missing", ""] + [f"- `{j['rel']}`" for j in missing]
    open(os.path.join(OUT, "REPORT.md"), "w").write("\n".join(md) + "\n")
    print(f"REPORT.md: {len(done)} done, {len(missing)} missing")


if __name__ == "__main__":
    main()
