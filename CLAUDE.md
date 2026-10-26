# Moraloop ad guidelines

Claymation ads for the Moraloop app live in `moraloop_ads/` (generator in `moraloop_ads/src/`).

## Stay neutral on the dilemma

Moraloop asks viewers what *they* would do, so an ad must never steer them toward one answer.

- When an ad shows the outcomes of both choices (long storyline format), give each side a comparable mix of gains and costs. Don't give one choice a disaster ending and the other a happy one.
- Avoid scenes that "punish" one choice (e.g. the betrayed friend finding out and turning on you only in the keep-the-secret branch) unless the other choice gets an equally weighted downside.
- End each branch on an open or bittersweet note, then let the host ask "What would you do?"
- The same applies to short ads: props, reactions and narration should present the dilemma, not hint at the "right" answer.

## Other standing decisions

- End card: logo + "COMING SOON". The official App Store badge is saved in `moraloop_ads/src/badge/` but stays off (`SHOW_APP_STORE_BADGE`) until the app is live on the App Store.
- Question wording comes from the client's PDF and should match it exactly.

## Content agents

Scheduled agents make new videos every other day (production started Oct 20, 2026; posting starts Fri Oct 23, US Eastern times): 2 trend shorts per run, and 1 long (2–3 min) storyline per run from `moraloop_ads/plan/long_30_day_plan.md`. A second pair of loop agents makes loop-format videos with `moraloop_ads/src/loop_ad.py`: 6 loop shorts every day (queued at 12:30 PM) and 1 loop-format storyline every other day (videos in `moraloop_ads/loops/`). Their full instructions are in `moraloop_ads/AGENT_GUIDE.md`, and new posts are queued in `moraloop_ads/plan/queue.csv`.
