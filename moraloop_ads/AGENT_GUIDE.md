# Moraloop content agents: guide

Two scheduled agents make new claymation videos for the Moraloop Instagram. Read this whole file and the repo's `CLAUDE.md` before every run.

## Schedule

- **Production starts Tuesday, October 20, 2026** so a backlog is ready before posting starts. Agents produce every other day: Oct 20, 22, 24, 26, 28, 30, Nov 1, 3, and so on. A run on any other day exits without doing anything. Exception: the loop short-form agent runs every day (see "Loop short-form agent").
- **Posting starts Friday, October 23, 2026.** Agents never post. They only make videos and add them to `moraloop_ads/plan/queue.csv`. All times are **US Eastern**.
  - **7:00 PM daily**: the existing 30-day plan (`plan/30_day_plan.md`, Oct 23 – Nov 21). Agents don't touch it.
  - **12:00 PM daily, from Sat Oct 24**: new trend shorts. Each run makes 2 shorts and gives them the **next two free 12:00 PM dates** in `queue.csv` (never earlier than Oct 24, and never a date already taken).
  - **4:00 PM every other day, Oct 24 – Nov 21**: long storylines, in the order of `plan/long_30_day_plan.md`. Each run makes the next not-done episode and queues it at **that episode's post date from the plan**, so episodes are made ahead of time.

## The one rule that matters most: never sway the viewer

Moraloop asks people what *they* would do. Every video, short or long, has to make the viewer stop and think, never pick a side in a second.

- Present both options with equal weight: the same amount of screen time, the same emotional pull, a real upside and a real downside each.
- No loaded words that judge a choice ("selfish", "coward", "the right thing"). Describe what happens, not whether it's good.
- Long videos that show both choices: each branch gets a comparable mix of gains and costs and ends open or bittersweet. Never punish one branch (no "everyone finds out and hates you" on one side only).
- Short videos: props, reactions and narration set up the dilemma and stop. No hint at an answer.
- Before rendering, ask: "If someone heard only this video, would they lean one way?" If yes, rewrite.

## TikTok-safe placement and reading time (every video, all agents; owner's rule since Oct 28, 2026)

Videos post to TikTok (and Facebook/Instagram), where the app's interface sits on top of the video. Essential text must never be under it.

- **The shared template handles placement. Don't override it.** `src/safe_zone.py` defines the safe area for the 1080×1920 export, and `ad.py`, `story.py`, `loop_ad.py` and the end card in `clay.py` already use it: subtitles sit just under TikTok's top bar, A/B answer cards and chapter cards stay clear of the right-side buttons, the loop hook and the hidden detail's readable line sit inside the safe area, and "COMING SOON" sits under the logo, above the caption area. Never hard-code a new text position, font size or width. If something new needs text, place it with `safe_zone.safe_rect()` / `max_centered_width()`.
- **Danger zones (keep essential text out):** top 250 px (status bar, Dynamic Island, LIVE / Following / For You tabs); right side from y=760 down, x ≥ 880 (avatar, like, comment, save, share, sound disc); bottom from y=1320 (username, 2-line caption, sound row, search/CTA rows, nav bar); left 120 px. Leave at least 24 px of padding inside the safe area.
- **Readable timing:** subtitles follow the voice in balanced chunks of at most 2 lines (no lone word flashing by). The loop hook question stays up for at least 0.6 s + 0.3 s per word, and subtitles wait until it's gone. The A/B cards stay up at least 2.6 s after card B appears. Never squeeze a multi-line message into about a second, and never shrink text to make it fit. Shorten the wording or give it more time instead.
- **Hidden details (loop agents):** the whole thread or note has to fit inside the safe area when paused, last line included. In practice that means at most 5 short messages or note lines, with the last line about 15 characters. `safe_zone.py check` flags it if it doesn't fit; rewrite the detail shorter rather than shrinking it.
- **Check every render against the TikTok overlay at export size** (a clean player preview is not enough): `python3 safe_zone.py check <video>.mp4 /tmp/<id>_tiktok.png` gives the first frame, 10 evenly spaced frames and the last frame under a TikTok interface overlay, and reports any frame where text looks like it's in a danger zone. View the sheet yourself. Also check the frames where the hook, the cards, the chapter cards and the end card are on screen (`python3 safe_zone.py check <video> <out> <t1> <t2> ...`). Fix and re-render anything flagged before queueing, and mention the check in your end-of-run summary.
- **Existing videos:** videos made before Oct 28, 2026 were re-exported with the safe layout as `<name>_tiktoksafe.mp4` next to the originals, and the queue points not-yet-posted rows at the safe version. Never delete or overwrite an original video, and never touch posts that are already live.

## Setup (every run starts in a fresh cloud session)

```bash
cd <repo> && git fetch origin claude/moral-loop-claymation && git checkout claude/moral-loop-claymation && git pull
python3 -m pip install kokoro-onnx soundfile numpy pillow   # same interpreter you run with
mkdir -p moraloop_ads/src/models && cd moraloop_ads/src/models
curl -sSLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -sSLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

ffmpeg and the Inter / Noto Color Emoji fonts are already in the image. Always run the generator with the same `python3` you installed into (if `import numpy` fails, use `/usr/bin/python3`). If the repo isn't checked out, clone `https://github.com/whozeek/shark-game`. Work from `moraloop_ads/src/`.

## Short-form agent (2 trend shorts per run)

1. **Research what people are talking about right now.** Use WebSearch (and WebFetch where a site allows it). Generic searches like "trending topics today" return stale pages, so use specific, dated queries that include this week's month and year, for example:
   - "viral AITA post this week <Month> <Year>", "reddit relationship_advice viral <Month> <Year>"
   - "trending on X this week <Month> <Year>", "viral Facebook debate <Month> <Year>", "TikTok trend <Month> <Year>"
   - "pop culture news this week", "new show everyone is talking about <Month> <Year>", "viral wedding / roommate / coworker story <Month> <Year>"

   Prefer results dated within the last 7 days. Look for everyday situations people argue about.
2. **Turn two trends into two new dilemmas.** Check `ads_spec.py`, `ads_trends.py` and `plan/queue.csv` so you never repeat one.
   - The question is **very short and straight to the point**, ideally 12 words or fewer. No long setups, no hard words, nothing confusing. Good: "Your friend went viral for a lie. Do you call them out?"
   - The whole short runs about 15–30 seconds: "Hello. I have a question for you." (automatic), then 1–2 short scene lines (under ~20 words each), then the closing question.
   - Keep it hypothetical and brand-safe. Reference the *situation* behind a trend, never claims about real people. No real names of private individuals, no defamation, no tragedies, no graphic or hateful content, no politics.
3. **Add both to `ads_trends.py`** with ids `t###_slug` (next free number), the `made_on` date, and `set=` on every scene. The building blocks (sets, characters, acts, reactions, emoji) are the same as `ads_spec.py`; see `ad.py` (`CHARS`, `EXPR`) and `sets.py` for what exists.
4. **Check stills first:** `python3 ad.py still <id> <t1> <t2> ...` and look at the PNGs. Settings must fit the story, the right people must be on screen, props must read clearly, and nothing should be clipped.
5. **Render:** `python3 ad.py render ../trends <id>` (each takes about 2–3 minutes).
6. **Review the finished video:** `python3 frames.py ../trends/<id>.mp4 /tmp/<id>.png 10` and `python3 safe_zone.py check ../trends/<id>.mp4 /tmp/<id>_tiktok.png`, then view both. If you can start a subagent, have it independently check fit, clarity and neutrality against this guide. Fix and re-render anything that fails.
7. **Queue and publish** (see "Finishing a run").

## Long-form agent (1 storyline of 2–3 minutes per run)

1. Open `plan/long_30_day_plan.md`, find the next episode not yet marked done, and use its outline. These episodes turn dilemmas we already made as shorts into full storylines.
2. Write `stories/<slug>.py` from `stories/example_template.py` (the full worked example is the default BEATS in `story.py`, "Two Best Friends"). Structure: a short setup that makes both sides understandable, then **CHOICE A** card → branch with a balanced ending, "Now... rewind." → **CHOICE B** card → branch with an equally balanced ending, then the man in the suit: "Two choices. Two very different endings." and "What would you do?". Give each character a distinct voice and name (`NAMES`, `VOICES`).
3. `STORY=<slug> python3 story.py plan` and aim for **120–180 seconds**. Then check stills with `STORY=<slug> python3 story.py still <t...>`.
4. **Neutrality check before rendering:** count the wins and losses in each branch, and make sure neither choice looks obviously right. If you can start a subagent, have it review the script and stills against this guide.
5. **Render:** `STORY=<slug> python3 story.py render ../long/<slug>.mp4` (about 15 minutes), review it with `frames.py` (16+ frames), and fix anything wrong.
6. Mark the episode done in `long_30_day_plan.md`, then finish the run.

## Finishing a run

- Append one row per video to `plan/queue.csv`: `post_date` (YYYY-MM-DD), `post_time` (12:00 PM for shorts, 4:00 PM for long), `kind`, `title`, `video_file` (repo path), `caption`, `made_on`. A caption is the hook question, a neutral call to action ("Comment A or B 👇", "What would you do? 👇"), the line "More questions like this on Moraloop. Coming soon.", and 5–8 hashtags (always `#moraloop #whatwouldyoudo #moraldilemma #claymation`).
- Then rebuild the posting list with `python3 make_ready.py` (from `moraloop_ads/src/`). It regenerates `moraloop_ads/READY_TO_POST.md`, the one file the owner's posting assistant reads to find each video, its time and its caption. Commit it with everything else.
- Commit the videos, specs, story files and queue/plan updates. Never commit `src/models/`, `src/tts/` or `src/out/` (they're in `.gitignore`). Then `git pull --rebase origin claude/moral-loop-claymation` and `git push origin claude/moral-loop-claymation`, retrying network failures up to 4 times with backoff.
- End with a short summary: what was made, the trend each short came from, and the posting dates.

## Standing decisions (don't change)

- End card: logo + "COMING SOON". The App Store badge stays off until the owner says the app is live.
- Vertical 1080×1920, the clay style and the man in the suit stay the same across all videos.
- Agents never post anywhere themselves. The owner's posting assistant (e.g. ChatGPT) reads `moraloop_ads/READY_TO_POST.md` and posts to Facebook and TikTok.

## Loop agents (loop-format shorts and storylines)

A second pair of scheduled agents makes the same kinds of videos as the agents above (a short-form one and a long-form one), with the same rules, research, neutrality check, review steps and posting list. The only difference is that their videos are rendered with `src/loop_ad.py`, which adds the **loop format** on top of the normal video:

1. **Open loop in the first frame.** The video opens on a hidden detail for a quarter second: a phone text thread (`thread=`) or a paper note (`note=`). Only its last line is readable, and a hook question sits above it (`hook=`, lowercase, e.g. "what did the last text say?"). The question only pays off near the end.
2. **A buried 1-second fast cut mid-video.** Four glitchy shots of the full detail, too fast to read at normal speed, so viewers pause, scroll back or rewatch. It lands inside a scene chosen with `cut_beat` (shorts) or `cut_scene` (long).
3. **A payoff that sends people back.** A host line near the end points at the detail ("Did you catch the whole thread?"), then the question.
4. **A seamless loop.** After the end card the last frame is the same as the first, so the video replays straight into its hook.

**The hidden detail must stay neutral.** It adds ambiguity (it could mean either thing), never information that makes one answer obvious. Ask: "If someone paused and read every word, would they lean one way?" If yes, rewrite it.

Its text is small and fast but must be readable in a paused frame: at most 5 short lines, no real names of private people, and nothing that breaks the brand-safety rules above.

### Loop short-form agent (6 loop shorts per run, daily)

Same as "Short-form agent" above, except:
- Add each short to `src/ads_loop.py` (not `ads_trends.py`) with id `l###_slug` (next free number), `made_on`, `hook`, `thread` (contact, stamp, msgs) or `note` (title, lines), and `cut_beat` (the 0-based scene beat the fast cut lands in, usually the 2nd scene). Put a host line `M("Did you catch ...?")` (or similar) before `close=`. `l001_dont_tell_her` is the worked example.
- Never repeat a dilemma already in `ads_spec.py`, `ads_trends.py`, `ads_loop.py` or `plan/queue.csv`.
- Stills: `python3 loop_ad.py still <id> 0.1 <cut time + 0.1> <cut time + 0.4> ...` (it prints the cut time and length; PNGs land in `src/out/`). Check the flash frame, every fast-cut shot and the last frame.
- Render: `python3 loop_ad.py render ../loops <id>` → `moraloop_ads/loops/<id>.mp4`.
- **Runs every day** (owner's rule since Oct 26, 2026; no every-other-day check) and makes **six** loop shorts per run, all distinct from each other.
- Queue all six at the **next six free 12:30 PM dates** in `plan/queue.csv` (never earlier than Oct 27, 2026, never a date already taken at 12:30 PM), `kind` = `loop short`. Time-sensitive topics (e.g. a holiday) must land before the event. (Loop shorts made before this change were queued at 9:00 AM; leave those as they are.)

### Loop long-form agent (1 loop storyline per run)

Same as "Long-form agent" above, except:
- Take the next `todo` episode in `plan/loop_long_plan.md` (not the regular long plan).
- In `stories/<slug>.py` also define `LOOP = dict(hook=..., thread=... or note=..., cut_scene=N)`, where `cut_scene` is the 0-based index of the (non-continuing) scene where the fast cut lands, usually in the setup before CHOICE A. Add one host line near the end that points back at the detail, before "Two choices. Two very different endings."
- Plan with `STORY=<slug> python3 story.py plan`, stills with `STORY=<slug> python3 loop_ad.py still <slug> 0.1 ...`, render with `STORY=<slug> python3 loop_ad.py render ../loops/long <slug>` → `moraloop_ads/loops/long/<slug>.mp4`.
- Mark the episode done in `plan/loop_long_plan.md` (`done (YYYY-MM-DD) → loops/long/<slug>.mp4`), and queue it at that episode's post date at **8:00 PM**, `kind` = `loop long`.

Both loop agents finish exactly like the others: append to `plan/queue.csv`, run `python3 make_ready.py` so the videos appear in `moraloop_ads/READY_TO_POST.md` for the posting assistant, commit, pull with rebase and push to `claude/moral-loop-claymation`. They never post anywhere themselves.

**Posting slots (US Eastern), all agents:** 9:00 AM the first three loop shorts (Oct 27–29 only), 12:00 PM trend shorts (daily), 12:30 PM loop shorts (daily), 4:00 PM long storylines (every other day), 7:00 PM 30-day plan (daily), 8:00 PM loop storylines (every other day).
