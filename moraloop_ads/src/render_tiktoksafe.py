"""Re-export existing Moraloop videos with the TikTok-safe layout, next to the originals.

    python3 render_tiktoksafe.py list            # every video, its next post time and kind
    python3 render_tiktoksafe.py run [n]         # render the next n missing *_tiktoksafe.mp4 (soonest post first)

Originals are never touched: each corrected copy is written as <name>_tiktoksafe.mp4 in the same folder.
A TikTok-overlay contact sheet for each copy goes to src/out/tiktoksafe_review/.
"""
import csv, os, re, subprocess, sys, datetime, time

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(SRC, "..", ".."))
REV = os.path.join(SRC, "out", "tiktoksafe_review")
LOG = os.path.join(ROOT, "moraloop_ads/review/tiktoksafe/log.txt")  # committed, so later runs can read it


def safe_name(path):
    b, e = os.path.splitext(path)
    return b + "_tiktoksafe" + e


def jobs():
    when, new = {}, set()
    for r in csv.DictReader(open(os.path.join(ROOT, "moraloop_ads/plan/queue.csv"))):
        if r.get("made_on", "") >= "2026-10-28":  # made with the TikTok-safe template already: nothing to fix
            new.add(r["video_file"])
        dt = datetime.datetime.strptime(r["post_date"] + " " + r["post_time"], "%Y-%m-%d %I:%M %p")
        when.setdefault(r["video_file"], dt)
    plan = open(os.path.join(ROOT, "moraloop_ads/plan/30_day_plan.md")).read()
    for m in re.finditer(r"### Day \d+ \((\w+ \w+ \d+, \d{4}), 7:00 PM\).*?\nFile: `([^`]+)`", plan):
        dt = datetime.datetime.strptime(m.group(1) + " 7:00 PM", "%a %b %d, %Y %I:%M %p")
        when.setdefault(m.group(2), dt)
    out = []
    far = datetime.datetime(2099, 1, 1)
    import glob
    vids = sorted(glob.glob(os.path.join(ROOT, "moraloop_ads/**/*.mp4"), recursive=True)) + \
        [os.path.join(ROOT, "moraloop_storyline_two_best_friends.mp4")]
    for v in vids:
        rel = os.path.relpath(v, ROOT)
        if rel.endswith("_tiktoksafe.mp4") or rel.endswith(".part.mp4") or "/src/" in rel or rel in new:
            continue
        base = os.path.splitext(os.path.basename(v))[0]
        d = os.path.dirname(rel)
        if rel == "moraloop_storyline_two_best_friends.mp4":
            kind, key = "story", None
        elif d == "moraloop_ads/loops/long":
            kind, key = "loop_long", base
        elif d == "moraloop_ads/loops":
            kind, key = "loop_short", base
        elif d == "moraloop_ads/long":
            kind, key = "story", base
        else:
            kind, key = "short", base
        out.append(dict(rel=rel, kind=kind, key=key, when=when.get(rel, far)))
    # not-yet-posted first (soonest first), then already-posted, then unscheduled
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4))).replace(tzinfo=None)
    out.sort(key=lambda j: (0 if now <= j["when"] < far else (1 if j["when"] < now else 2), j["when"], j["rel"]))
    return out


def render(j):
    dst = os.path.join(ROOT, safe_name(j["rel"]))
    env = dict(os.environ, PROCS=os.environ.get("PROCS", "2"))
    env.pop("STORY", None)
    k = j["kind"]
    if k == "short":
        cmd = ["python3", "-c", f"import ad; ad.render_ad({j['key']!r}, {dst!r})"]
    elif k == "loop_short":
        cmd = ["python3", "-c", f"import loop_ad; loop_ad.render_ad({j['key']!r}, {dst!r})"]
    elif k == "loop_long":
        env["STORY"] = j["key"]
        cmd = ["python3", "-c", f"import loop_ad; loop_ad.render_ad({j['key']!r}, {dst!r})"]
    else:
        if j["key"]:
            env["STORY"] = j["key"]
        cmd = ["python3", "story.py", "render", dst]
    tmp = dst + ".part.mp4"
    cmd = [c.replace(dst, tmp) for c in cmd]
    subprocess.run(cmd, cwd=SRC, env=env, check=True)
    os.replace(tmp, dst)
    os.makedirs(REV, exist_ok=True)
    import safe_zone
    flags = safe_zone.check(dst, os.path.join(REV, os.path.basename(dst)[:-4] + ".png"),
                            label=os.path.basename(dst))
    return dst, flags


def repoint():
    """Point not-yet-posted queue rows and 30-day-plan entries at the corrected copy, once it exists.
    Rows whose post time has passed (live posts) are left exactly as they are."""
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4))).replace(tzinfo=None)
    qp = os.path.join(ROOT, "moraloop_ads/plan/queue.csv")
    rows = list(csv.DictReader(open(qp)))
    fields = list(rows[0].keys())
    n = 0
    for r in rows:
        dt = datetime.datetime.strptime(r["post_date"] + " " + r["post_time"], "%Y-%m-%d %I:%M %p")
        sv = safe_name(r["video_file"])
        if dt > now and not r["video_file"].endswith("_tiktoksafe.mp4") and os.path.exists(os.path.join(ROOT, sv)):
            r["video_file"] = sv
            n += 1
    with open(qp, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    pp = os.path.join(ROOT, "moraloop_ads/plan/30_day_plan.md")
    plan = open(pp).read()

    def sub(m):
        nonlocal n
        dt = datetime.datetime.strptime(m.group(2) + " 7:00 PM", "%a %b %d, %Y %I:%M %p")
        f = m.group(4)
        if dt > now and not f.endswith("_tiktoksafe.mp4") and os.path.exists(os.path.join(ROOT, safe_name(f))):
            n += 1
            return m.group(1) + safe_name(f) + m.group(5)
        return m.group(0)
    plan = re.sub(r"(### Day \d+ \((\w+ \w+ \d+, \d{4}), 7:00 PM\)(.*?)\nFile: `)([^`]+)(`)", sub, plan, flags=re.S)
    open(pp, "w").write(plan)
    print(f"repointed {n} upcoming entries to _tiktoksafe copies")


if __name__ == "__main__":
    J = jobs()
    if sys.argv[1] == "list":
        for j in J:
            done = os.path.exists(os.path.join(ROOT, safe_name(j["rel"])))
            print(("DONE " if done else "     ") + j["when"].strftime("%Y-%m-%d %H:%M"), j["kind"], j["rel"])
    elif sys.argv[1] == "repoint":
        repoint()
    elif sys.argv[1] == "run":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 10 ** 6
        os.makedirs(os.path.dirname(LOG), exist_ok=True)
        log = open(LOG, "a")
        budget = float(os.environ.get("MINUTES", "0")) * 60
        start = time.time()
        for j in J:
            if n <= 0:
                break
            if os.path.exists(os.path.join(ROOT, safe_name(j["rel"]))):
                continue
            if budget and time.time() - start > budget:
                print("time budget used, stopping", flush=True)
                break
            t0 = time.time()
            try:
                dst, flags = render(j)
                msg = f"OK {j['rel']} {time.time() - t0:.0f}s flags={flags}"
            except Exception as e:
                msg = f"FAIL {j['rel']} {e}"
            print(msg, flush=True)
            log.write(msg + "\n")
            log.flush()
            n -= 1
