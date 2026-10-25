"""Rebuild moraloop_ads/READY_TO_POST.md from plan/queue.csv (run after every queue change).
One file that a posting assistant (e.g. ChatGPT) can read to find each video, when to post it, and its caption."""
import csv, os, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO, BRANCH = "whozeek/shark-game", "claude/moral-loop-claymation"
rows = list(csv.DictReader(open(os.path.join(ROOT, "moraloop_ads/plan/queue.csv"))))
order = lambda r: (r["post_date"], datetime.datetime.strptime(r["post_time"], "%I:%M %p").time())
rows.sort(key=order)
out = ["# Moraloop: ready to post", "",
       f"Repo `{REPO}`, branch `{BRANCH}`. Times are US Eastern. Post each video at its date and time on Facebook and TikTok, using its caption.",
       "This file is rebuilt automatically by the content agents after every run, so the newest videos are always listed here.", "",
       "| # | Post date | Time | Type | Title | Video file | Download |", "|---|---|---|---|---|---|---|"]
for i, r in enumerate(rows, 1):
    raw = f"https://github.com/{REPO}/raw/{BRANCH}/{r['video_file']}"
    out.append(f"| {i} | {r['post_date']} | {r['post_time']} | {r['kind']} | {r['title']} | `{r['video_file']}` | [download]({raw}) |")
out += ["", "## Captions", ""]
for i, r in enumerate(rows, 1):
    out += [f"### {i}. {r['post_date']} {r['post_time']}: {r['title']} ({r['kind']})", f"Video: `{r['video_file']}`", "", "```", r["caption"].strip(), "```", ""]
open(os.path.join(ROOT, "moraloop_ads/READY_TO_POST.md"), "w").write("\n".join(out) + "\n")
print(f"READY_TO_POST.md: {len(rows)} videos")
