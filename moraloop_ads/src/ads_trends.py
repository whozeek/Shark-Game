"""Trend-based short ads written by the scheduled short-form agent.
Each entry follows the same format as ads_spec.py, but every scene sets its own `set=`.
Render one with:  python3 ad.py render ../trends <id>
"""
from ads_spec import M, S, WWYD

ADS = [
    # dict(id="t001_short_slug", title="...", made_on="2026-10-23", beats=[
    #     S("Short scene line.", ["friend", "you"], "say", ["📱"], "worried", set="cafe"),
    # ], close="Short, direct question?"),
]
