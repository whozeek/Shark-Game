"""Trend-based short ads written by the scheduled short-form agent.
Each entry follows the same format as ads_spec.py, but every scene sets its own `set=`.
Render one with:  python3 ad.py render ../trends <id>
"""
from ads_spec import M, S, WWYD

ADS = [
    # dict(id="t001_short_slug", title="...", made_on="2026-10-23", beats=[
    #     S("Short scene line.", ["friend", "you"], "say", ["📱"], "worried", set="cafe"),
    # ], close="Short, direct question?"),

    # Trend: viral Reddit post (Oct 2026) about a partner giving one spouse's craft room to a recovering parent
    dict(id="t001_the_craft_room", title="The Craft Room", made_on="2026-10-20", beats=[
        S("Your partner’s mom needs six weeks to heal. She moves into your craft room.",
          ["partner", "elder", "you"], "tell", ["🦵", "🛏️", "🧵"], "worried", others="worried", set="home"),
        S("Your sewing orders pile up. Your partner’s game room is how they unwind.", ["you"], "think", ["🧵", "📦", "🎮"],
          "worried", set="home"),
    ], close="Do you claim your partner’s game room, or wait six weeks?"),

    # Trend: "keeping my options open" dating posts and the "Two Fishes" audio (Oct 2026)
    dict(id="t002_two_fishes", title="Two Fishes", made_on="2026-10-20", beats=[
        S("Two months of dates. Then they say, “I’m still seeing other people.”",
          ["partner", "you"], "say", ["💬", "🐟", "🐟"], "shock", set="cafe"),
        S("Nothing serious yet. But you really like them.", ["you"], "think", ["❤️", "⏳"], "worried", set="cafe"),
    ], close="Do you wait it out, or walk away?"),
]
