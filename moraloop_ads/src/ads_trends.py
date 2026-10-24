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

    # Trend: viral HOA letter asking neighbors to hand out only fun-size Halloween candy (Oct 2026)
    dict(id="t003_the_big_candy_bars", title="The Big Candy Bars", made_on="2026-10-24", beats=[
        S("Your neighborhood asks everyone to give out fun-size candy only, so no family feels left out.",
          ["stranger", "you"], "say", ["🏘️", "🍬", "🤝"], "worried", set="street"),
        S("But you promised the kids on your street big bars this year.", ["you"], "think", ["🍫", "🎃", "🤞"], "worried",
          set="home"),
    ], close="Do you give out the big bars, or stick to fun-size?"),

    # Trend: Reddit post about a sister asking someone to cancel a prepaid trip to babysit (Oct 2026)
    dict(id="t004_the_babysitting_ask", title="The Babysitting Ask", made_on="2026-10-24", beats=[
        S("Your sister’s sitter cancels. She asks you to watch her kid this weekend.",
          ["friend2", "kid", "you"], "say", ["👶", "🧸", "🙏"], "worried", others="worried", set="home"),
        S("It’s the weekend of your trip. Already paid. No refunds.", ["you"], "think", ["✈️", "🧳", "💸"],
          "worried", set="home"),
    ], close="Do you cancel your trip, or keep it?"),
]
