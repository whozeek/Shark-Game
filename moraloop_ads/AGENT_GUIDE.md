# Moraloop content agents: guide

Two scheduled agents make new claymation videos for the Moraloop Instagram. Read this whole file and the repo's `CLAUDE.md` before every run.

## Schedule

- **Production starts Tuesday, October 20, 2026** so a backlog is ready before posting starts. Agents produce every other day: Oct 20, 22, 24, 26, 28, 30, Nov 1, 3, and so on. A run on any other day exits without doing anything.
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
6. **Review the finished video:** `python3 frames.py ../trends/<id>.mp4 /tmp/<id>.png 10`, then view it. If you can start a subagent, have it independently check fit, clarity and neutrality against this guide. Fix and re-render anything that fails.
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
