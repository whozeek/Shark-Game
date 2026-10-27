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

    # Trend: viral post about a brand-new car found scratched overnight outside a home (Oct 2026)
    dict(id="t005_the_scratched_car", title="The Scratched Car", made_on="2026-10-26", beats=[
        S("Late at night, you see your neighbor’s kid scratch a brand-new car.", ["you"], "react",
          ["🧒", "🔑", "🚗"], "shock", set="home_night"),
        S("The next morning, the car’s owner asks if anyone saw anything.", ["stranger", "you"], "say",
          ["🚗", "❓"], "worried", set="street"),
    ], close="Do you tell the owner, or talk to the neighbor first?"),

    # Trend: Reddit thread about feeling checked out during a 10-week notice period (Oct 2026)
    dict(id="t006_the_notice_period", title="The Notice Period", made_on="2026-10-26", beats=[
        S("You gave notice at work. Ten more weeks to go.", ["you"], "think", ["💼", "⏳", "👋"], "worried",
          set="office"),
        S("You’re burned out, and your new job starts right after. But your team still counts on you.",
          ["coworker", "you"], "say", ["🪫", "📋"], "worried", others="worried", set="office"),
    ], close="Do you push hard to the end, or ease off?"),

    # Trend: porch-light / teen trick-or-treating debates the week before Halloween (Oct 2026)
    dict(id="t007_teen_trick_or_treaters", title="Teen Trick-or-Treaters", made_on="2026-10-27", beats=[
        S("Halloween night. Two teens at your door. No costumes, just pillowcases.",
          ["teammate", "cousin", "you"], "say", ["🎃", "🛍️"], "worried", others="happy", set="street"),
        S("They’re still kids. But your bowl is almost empty.", ["you"], "think", ["🍬", "🥣", "👶"], "worried",
          set="home"),
    ], close="Do you give them candy, or save it for little kids?"),

    # Trend: TikTok "Stop the Wedding" trend (Oct 2026)
    dict(id="t008_stop_the_wedding", title="Stop the Wedding", made_on="2026-10-27", beats=[
        S("Your best friend is getting married. You think it’s a mistake. They seem happy.", ["you"], "think",
          ["💒", "💍", "😬"], "worried", set="hall"),
        S("The officiant asks, “Does anyone object?” Everyone goes quiet.", ["elder", "friend", "you"], "say",
          ["💒", "❓"], "shock", others="neutral", set="hall"),
    ], close="Do you speak up, or stay quiet?"),

    # Trend: viral post about a manager telling a Gen Z worker to "cut down" on accessories (Oct 2026)
    dict(id="t009_the_dress_code", title="The Dress Code", made_on="2026-10-27", beats=[
        S("Your reviews are great. But your boss asks you to tone down your style.", ["boss", "you"], "say",
          ["⭐", "💍", "🎀"], "worried", set="office"),
        S("Your look is part of who you are. But you want that promotion.", ["you"], "think", ["🎀", "🪞", "📈"],
          "worried", set="office"),
    ], close="Do you tone it down, or keep your style?"),

    # Trend: viral question about grandparents crediting everyone but the mother for a baby's looks (Oct 2026)
    dict(id="t010_the_baby_looks", title="The Baby Looks", made_on="2026-10-27", beats=[
        S("Your mom holds your new baby. “Looks just like our side of the family.”", ["elder", "partner", "you"],
          "say", ["👶", "👀", "👨‍👩‍👧"], "worried", others="sad", set="home"),
        S("She means it kindly. But your partner seems hurt.", ["you"], "think", ["👶", "😕", "🤐"], "worried",
          set="home"),
    ], close="Do you say something to your mom, or let it go?"),

    # Trend: Reddit HR thread on interview red flags, including AI-written answers (Oct 2026)
    dict(id="t011_the_ai_interview", title="The AI Interview", made_on="2026-10-27", beats=[
        S("Big job interview tomorrow. You always blank under pressure.", ["you"], "think", ["💼", "😰", "⏰"],
          "worried", set="home_night"),
        S("An AI app could write perfect answers for you to memorize.", ["you"], "see", ["📱", "🤖", "📝"],
          "worried", set="home_night"),
    ], close="Do you memorize the AI answers, or wing it?"),

    # Trend: Reddit story about an ex asking for the wedding dress back before remarrying (Oct 2026)
    dict(id="t012_the_wedding_dress", title="The Wedding Dress", made_on="2026-10-27", beats=[
        S("Your ex is getting remarried. They want the wedding dress back. It was their grandma’s.",
          ["ex", "you"], "say", ["👗", "💍", "👵"], "shock", set="home"),
        S("But you paid to restore it, and it’s been yours for years.", ["you"], "think", ["👗", "💸", "🧵"], "worried",
          set="home"),
    ], close="Do you give it back, or keep it?"),
]
