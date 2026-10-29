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

    # Trend: TikTok about regretting skipping family dinner for a date (Daily Dot, Oct 27 2026)
    dict(id="t013_dinner_or_date", title="Dinner or Date", made_on="2026-10-28", beats=[
        S("Sunday family dinner. Everyone comes, every week.", ["elder", "kid", "you"], "react",
          ["🍝", "👨‍👩‍👧", "🕖"], "happy", others="happy", set="home"),
        S("Then your crush asks you out. Same night. The only night they’re free.", ["you"], "see",
          ["📱", "💘", "🕖"], "worried", set="home"),
    ], close="Do you go on the date, or go to family dinner?"),

    # Trend: Reddit post about a couple coming back to claim their concert seats (Oct 2026)
    dict(id="t014_the_concert_seats", title="The Concert Seats", made_on="2026-10-28", beats=[
        S("You leave your concert seats for an hour to grab food.", ["you"], "think", ["🎤", "🍔", "⏰"],
          "worried", set="hall"),
        S("When you get back, another couple is in them, having a great time.", ["friend", "friend2", "you"],
          "react", ["🎟️", "🎶", "😄"], "worried", others="happy", set="hall"),
    ], close="Do you ask for your seats back, or find new ones?"),

    # Trend: Reddit post about a neighbor dumping trash in someone else's bin (Oct 2026)
    dict(id="t015_the_trash_bin", title="The Trash Bin", made_on="2026-10-28", beats=[
        S("Your new neighbor keeps putting their trash in your bin.", ["you"], "react", ["🗑️", "🛍️", "🏠"],
          "shock", set="street"),
        S("Now your bin is full before pickup. But they’re friendly, and new in town.", ["stranger", "you"],
          "say", ["👋", "🏠"], "worried", set="street"),
    ], close="Do you say something, or let it slide?"),

    # Trend: Reddit post about a mother-in-law and a baby-naming dispute (Oct 2026)
    dict(id="t016_the_baby_name", title="The Baby Name", made_on="2026-10-28", beats=[
        S("Your mother-in-law asks you to name the baby after her. It would mean the world to her.",
          ["elder", "partner", "you"], "say", ["👶", "👵", "💬"], "worried", others="worried", set="home"),
        S("But you and your partner already picked a name you love.", ["you"], "think", ["👶", "❤️", "📝"],
          "worried", set="home"),
    ], close="Do you use her name, or the one you picked?"),

    # Trend: Reddit story about café regulars who secretly left 100+ bad reviews (Oct 2026)
    dict(id="t017_the_bad_reviews", title="The Bad Reviews", made_on="2026-10-28", beats=[
        S("You work at a café. A sweet older couple comes in every day.", ["elder", "stranger", "you"], "react",
          ["☕", "🥐", "😊"], "happy", others="happy", set="cafe"),
        S("Then you find out they’ve left dozens of bad reviews. But they’re your best regulars.", ["you"], "see", ["📱", "⭐", "👎"], "shock",
          set="cafe"),
    ], close="Do you confront them, or act like you don’t know?"),

    # Trend: roommate fight over a dish rack that became a 30-part TikTok series (The Cut, Oct 2026)
    dict(id="t018_the_roommate_series", title="The Roommate Series", made_on="2026-10-28", beats=[
        S("You and your roommate argue about the dishes.", ["friend", "you"], "say", ["🍽️", "💢"], "worried",
          set="home"),
        S("Then they post a video series about it. It goes viral.", ["you"], "see", ["📱", "📈", "😳"], "shock",
          set="home"),
    ], close="Do you post your side online, or talk in private?"),

    # Trend: Reddit post about paying off a girlfriend's student loans as a surprise gift (Daily Dot, Oct 28 2026)
    dict(id="t019_the_surprise_payoff", title="The Surprise Payoff", made_on="2026-10-29", beats=[
        S("You get a big bonus. Enough to pay off your partner’s student loans.", ["you"], "think",
          ["💰", "🎓", "💳"], "worried", set="home"),
        S("It could be the best surprise ever. Or they might feel it wasn’t your call.", ["partner", "you"],
          "react", ["🎁", "❓"], "worried", others="neutral", set="home"),
    ], close="Do you surprise them, or ask first?"),

    # Trend: Reddit post about a boss demanding a doctor's note for a headache (TwistedSifter, Oct 28 2026)
    dict(id="t020_the_doctors_note", title="The Doctor’s Note", made_on="2026-10-29", beats=[
        S("You miss one day of work with a bad headache.", ["you"], "react", ["🤕", "🛌"], "sad", set="home"),
        S("Your manager wants a doctor’s note. It’s policy, but the visit costs money.", ["boss", "you"], "say",
          ["📝", "🩺", "💸"], "worried", set="office"),
    ], close="Do you get the note, or push back on the rule?"),

    # Trend: Reddit story about a helpful shopper mistaken for a store employee (TwistedSifter, Oct 28 2026)
    dict(id="t021_not_an_employee", title="Not an Employee", made_on="2026-10-29", beats=[
        S("You help an older shopper carry a heavy bag of cat litter.", ["elder", "you"], "react",
          ["🛒", "🐈", "💪"], "happy", others="happy", set="store"),
        S("Another shopper thinks you work here. They need help finding something.", ["stranger", "you"], "say",
          ["❓", "🛒", "🏷️"], "shock", set="store"),
    ], close="Do you help them, or point them to staff?"),

    # Trend: Reddit post about a sister-in-law's last-minute plan changes and a group text (TwistedSifter, Oct 28 2026)
    dict(id="t022_the_plan_change", title="The Plan Change", made_on="2026-10-29", beats=[
        S("Family dinner was planned weeks ago. Your sister-in-law changes it last minute.", ["you"], "see",
          ["📱", "🔁", "❓"], "worried", set="home"),
        S("Pushing back could start a family fight. Going along keeps the peace.", ["you"], "think",
          ["💬", "👨‍👩‍👧", "⚖️"], "worried", set="home"),
    ], close="Do you push back, or go along with the change?"),

    # Trend: Reddit story about asking neighbors to turn down their bass (TwistedSifter, Oct 28 2026)
    dict(id="t023_the_bass_next_door", title="The Bass Next Door", made_on="2026-10-29", beats=[
        S("Your neighbor’s music shakes your walls every night.", ["you"], "react", ["🔊", "🎵", "😫"], "worried",
          set="home_night"),
        S("Last time you asked them to turn it down, things got tense for months.", ["you"], "think",
          ["🔇", "😬", "🏠"], "worried", set="home_night"),
    ], close="Do you ask again, or buy earplugs?"),

    # Trend: Reddit thread where men share what changed their dating life, like making the first move (Oct 28 2026)
    dict(id="t024_the_first_move", title="The First Move", made_on="2026-10-29", beats=[
        S("You’ve been texting someone for weeks. It’s going great.", ["you"], "see", ["📱", "💬", "😊"], "happy",
          set="home"),
        S("But they never ask to meet up.", ["you"], "think", ["☕", "❓", "⏳"], "worried", set="home"),
    ], close="Do you ask them out, or wait for them to ask?"),
]
