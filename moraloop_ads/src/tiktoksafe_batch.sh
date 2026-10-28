#!/bin/bash
# Re-export missing TikTok-safe copies one at a time for up to $MINUTES minutes (default 45), committing and
# pushing after each video. Originals are never touched. Run from anywhere inside the repo checkout.
cd "$(git rev-parse --show-toplevel)"
B=claude/moral-loop-claymation
MIN=${MINUTES:-45}
START=$(date +%s)
push() {
  git pull -q --rebase --autostash origin $B || true
  (cd moraloop_ads/src && python3 render_tiktoksafe.py repoint && python3 make_ready.py)
  git add $(git ls-files --others --modified --exclude-standard | grep -E '_tiktoksafe\.mp4$|review/tiktoksafe/' | grep -v '\.part\.mp4$') \
      moraloop_ads/plan/queue.csv moraloop_ads/plan/30_day_plan.md moraloop_ads/READY_TO_POST.md 2>/dev/null
  git diff --cached --quiet && return 0
  git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -qm "$1

Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
  for i in 1 2 3 4; do
    git push -q origin HEAD:$B && return 0
    sleep $((i * 5)); git pull -q --rebase origin $B
  done
  echo "PUSH FAILED"; return 1
}
while true; do
  LEFT=$(( MIN * 60 - ($(date +%s) - START) ))
  [ $LEFT -le 0 ] && echo "time budget used" && break
  OUT=$(cd moraloop_ads/src && MINUTES=0.01 python3 render_tiktoksafe.py run 1 2>&1 | grep -E '^(OK|FAIL)')
  [ -z "$OUT" ] && echo "ALL DONE: no missing TikTok-safe copies" && break
  echo "$OUT"
  push "TikTok-safe re-export: $(echo "$OUT" | awk '{print $2}' | xargs -n1 basename)"
done
