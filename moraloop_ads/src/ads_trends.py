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

    # Trend: Reddit post about refusing rides with a friend who screams along in the car (Daily Dot, Oct 29 2026)
    dict(id="t025_the_loud_ride", title="The Loud Ride", made_on="2026-10-30", beats=[
        S("Your friend drives you to work. They sing at full volume the whole way.", ["friend", "you"], "laugh",
          ["🚗", "🎤", "🎶"], "worried", set="street"),
        S("Your ears ring after. But it’s a free ride, and they love it.", ["you"], "think", ["👂", "🔔", "🚗"],
          "worried", set="street"),
    ], close="Do you ask them to stop, or find another ride?"),

    # Trend: Reddit story about a company that cut 30% of staff, then asked a worker to give up days off (Oct 29 2026)
    dict(id="t026_the_days_off", title="The Days Off", made_on="2026-10-30", beats=[
        S("Your company cut a third of the team. Everyone’s stretched thin.", ["coworker", "you"], "react",
          ["📉", "😓", "💼"], "worried", others="worried", set="office"),
        S("Now your boss asks you to work your days off. There’s extra pay.", ["boss", "you"], "say",
          ["⏰", "💵", "🙏"], "worried", set="office"),
    ], close="Do you take the extra shifts, or keep your days off?"),

    # Trend: Reddit story about a customer demanding to use an expired coupon (TwistedSifter, Oct 29 2026)
    dict(id="t027_the_expired_coupon", title="The Expired Coupon", made_on="2026-10-30", beats=[
        S("You work the register. A customer hands you a coupon that expired yesterday.", ["stranger", "you"],
          "give", ["🎟️", "❌"], "worried", set="store"),
        S("They’re a regular, and it’s just one day. But rules are rules.", ["you"], "think", ["🎟️", "🤔", "📏"],
          "worried", set="store"),
    ], close="Do you accept it, or say no?"),

    # Trend: Reddit story about turning down being godfather to a spouse's cousin's baby (TwistedSifter, Oct 29 2026)
    dict(id="t028_the_godparent", title="The Godparent", made_on="2026-10-30", beats=[
        S("Your partner’s cousin asks you to be godparent to her baby.", ["friend2", "partner", "you"], "say",
          ["👶", "🙏", "💛"], "shock", set="home"),
        S("You’ve only met her twice. It’s a big honor, and a big commitment.", ["you"], "think",
          ["👶", "🤝", "⏳"], "worried", set="home"),
    ], close="Do you say yes, or politely decline?"),

    # Trend: TikTok about a friend skipping a wedding for his girlfriend's graduation (Daily Dot, Oct 22 2026)
    dict(id="t029_wedding_or_graduation", title="Wedding or Graduation", made_on="2026-10-30", beats=[
        S("Your best friend is getting married. You promised you’d be there.", ["friend", "you"], "say",
          ["💍", "💒", "🎉"], "happy", set="cafe"),
        S("Then your partner’s graduation gets moved to the same day.", ["partner", "you"], "tell",
          ["🎓", "⏰", "❗"], "shock", set="home"),
    ], close="Do you go to the wedding, or the graduation?"),

    # Trend: Reddit post from someone who still loves their partner but thinks they'd be happier single (Oct 2026)
    dict(id="t030_happier_alone", title="Happier Alone", made_on="2026-10-30", beats=[
        S("You and your partner have been together four years. You still love them.", ["partner", "you"],
          "react", ["❤️", "🏠", "🐶"], "happy", others="happy", set="home"),
        S("But lately you think you’d be happier on your own.", ["you"], "think", ["💭", "🚪", "🌱"], "worried",
          set="home_night"),
    ], close="Do you stay and work on it, or leave?"),

    # Trend: Reddit post about parents planning a lake trip during someone's days off without asking (Daily Dot, Oct 30 2026)
    dict(id="t031_the_lake_trip", title="The Lake Trip", made_on="2026-10-31", beats=[
        S("You finally have nine days off. Your mom books a lake trip for all of you.", ["elder", "you"], "say",
          ["🏞️", "🛶", "🧳"], "shock", set="home"),
        S("She didn’t ask first. But it would mean a lot to her.", ["you"], "think", ["🛌", "🤔", "❤️"],
          "worried", set="home"),
    ], close="Do you go with them, or keep your days off?"),

    # Trend: Reddit post about strangers filling water tanks from a community spigot as bills rise (TwistedSifter, Oct 30 2026)
    dict(id="t032_the_spigot", title="The Spigot", made_on="2026-10-31", beats=[
        S("Strangers keep filling big water tanks from your building’s spigot.", ["stranger", "you"], "react",
          ["🚰", "🛢️", "👀"], "shock", set="street"),
        S("Residents pay the water bill. But they might really need the water.", ["you"], "think",
          ["💸", "💧", "🤔"], "worried", set="street"),
    ], close="Do you report it, or let it go?"),

    # Trend: Reddit post about a teen trading in a gifted car that kept breaking down (TwistedSifter, Oct 30 2026)
    dict(id="t033_the_gifted_car", title="The Gifted Car", made_on="2026-10-31", beats=[
        S("Your grandparents gave you their old car. You’ve loved it for years.", ["elder", "you"], "give",
          ["🔑", "🚗", "❤️"], "happy", set="street"),
        S("Now it breaks down every month. A dealer offers you a good trade.", ["you"], "think", ["🔧", "🚗", "💵"],
          "worried", set="street"),
    ], close="Do you trade it in, or keep fixing it?"),

    # Trend: Reddit story about a diner who helped a waiter, then declined a free meal for the table (TwistedSifter, Oct 30 2026)
    dict(id="t034_the_free_meal", title="The Free Meal", made_on="2026-10-31", beats=[
        S("At dinner, your waiter feels faint. You help them sit down and get water.", ["coworker", "you"], "react",
          ["🍽️", "💧", "🤝"], "worried", set="cafe"),
        S("The manager offers your table a free meal. Your friends are thrilled. It feels odd to you.",
          ["friend", "friend2", "you"], "react", ["🍽️", "🎁", "😄"], "worried", others="happy", set="cafe"),
    ], close="Do you accept the free meal, or decline it?"),

    # Trend: Reddit post about not contributing to a manager's new-baby cash fund (Percolately, Oct 30 2026)
    dict(id="t035_the_baby_fund", title="The Baby Fund", made_on="2026-10-31", beats=[
        S("Your office is collecting money for your manager’s new baby.", ["coworker", "you"], "say",
          ["👶", "💵", "🎁"], "worried", set="office"),
        S("Everyone’s chipping in twenty dollars. Money is tight for you this month.", ["you"], "think",
          ["💵", "😬", "📉"], "worried", set="office"),
    ], close="Do you chip in, or skip it?"),

    # Trend: Reddit debate about an absent dad wanting a front-row seat at graduation (Daily Dot, Oct 30 2026)
    dict(id="t036_the_front_row", title="The Front Row", made_on="2026-10-31", beats=[
        S("Your dad missed most of your childhood. Now he wants a front-row seat at your graduation.",
          ["stranger", "you"], "say", ["🎓", "🪑", "🙏"], "worried", set="home"),
        S("He’s really trying. But your mom and stepdad were there for everything.", ["you"], "think",
          ["🪑", "👨‍👩‍👦", "🤔"], "worried", set="home"),
    ], close="Do you give him a front-row seat, or a seat further back?"),

    # Trend: Reddit story about a shopper over the self-checkout item limit (TwistedSifter, Nov 1 2026)
    dict(id="t037_the_item_limit", title="The Item Limit", made_on="2026-11-01", beats=[
        S("Self-checkout says fifteen items max. You have eighteen.", ["you"], "think", ["🛒", "🔢", "🤔"],
          "worried", set="store"),
        S("The only cashier line is ten people deep.", ["stranger", "coworker", "you"], "react",
          ["🧍", "⏳", "😩"], "worried", others="neutral", set="store"),
    ], close="Do you use self-checkout anyway, or wait in line?"),

    # Trend: viral Reddit debate over whether an early airport ride for a partner is a big ask (Fox News)
    dict(id="t038_the_airport_ride", title="The Airport Ride", made_on="2026-11-01", beats=[
        S("Your partner has a six a.m. flight. They ask you for a ride to the airport.", ["partner", "you"],
          "say", ["✈️", "🚗", "⏰"], "worried", set="home_night"),
        S("That means leaving at four. You have a big day at work.", ["you"], "think", ["😴", "💼", "🚕"],
          "worried", set="home_night"),
    ], close="Do you drive them, or suggest a rideshare?"),

    # Trend: viral Reddit debate about houseguests staying all day before a late flight (Newsweek)
    dict(id="t039_the_late_flight", title="The Late Flight", made_on="2026-11-01", beats=[
        S("Your friends visit for the weekend. Their flight home leaves at midnight.", ["friend", "friend2", "you"],
          "react", ["🧳", "✈️", "🌙"], "happy", others="happy", set="home"),
        S("They ask to stay all day Sunday. You were hoping for a quiet afternoon.", ["you"], "think",
          ["🛋️", "⏰", "🤔"], "worried", set="home"),
    ], close="Do you let them stay, or ask them to head out?"),

    # Trend: Reddit story about a contractor taking loud business calls in a library (TwistedSifter, Nov 2 2026)
    dict(id="t040_the_library_call", title="The Library Call", made_on="2026-11-02", beats=[
        S("You’re studying in the library. A man at the next table takes loud work calls.", ["stranger", "you"],
          "say", ["📞", "🔊", "📚"], "worried", set="library"),
        S("Your exam is tomorrow. He might have nowhere else to work.", ["you"], "think", ["📝", "⏰", "🤔"],
          "worried", set="library"),
    ], close="Do you ask him to stop, or move tables?"),

    # Trend: Reddit story about a fantasy football commissioner secretly changing league rules (TwistedSifter, Nov 2 2026)
    dict(id="t041_the_league_rules", title="The League Rules", made_on="2026-11-02", beats=[
        S("Your friend runs your fantasy football league. You notice he quietly changed a rule.",
          ["you"], "see", ["📱", "🏈", "📋"], "shock", set="home"),
        S("It helps his team. It might be an honest mistake. The league is your friend group.",
          ["friend", "you"], "react", ["🏈", "🤝", "🤔"], "worried", others="happy", set="home"),
    ], close="Do you call it out to the group, or ask him privately?"),

    # Trend: Reddit story about a neighbor's camera aimed over a privacy fence (TwistedSifter, Nov 2 2026)
    dict(id="t042_the_fence_camera", title="The Fence Camera", made_on="2026-11-02", beats=[
        S("Your neighbor installs a camera. It points right over your fence into your yard.", ["you"], "react",
          ["📹", "🏡", "👀"], "shock", set="street"),
        S("They say it’s for package thieves. You feel watched.", ["stranger", "you"], "say", ["📦", "📹", "😬"],
          "worried", set="street"),
    ], close="Do you ask them to move it, or block the view yourself?"),

    # Trend: Reddit story about a housemate who games late while the other starts work at five (TwistedSifter, Nov 5 2026)
    dict(id="t043_the_late_game", title="The Late Game", made_on="2026-11-05", beats=[
        S("Gaming at night is how you unwind after work.", ["you"], "react", ["🎮", "🌙", "😌"], "happy",
          set="home_night"),
        S("Your roommate starts work at five. They ask for quiet after nine.", ["friend", "you"], "say",
          ["⏰", "🤫", "😴"], "worried", set="home_night"),
    ], close="Do you stop at nine, or keep your evenings?"),

    # Trend: Reddit story about a son asked to translate his dad's meeting during class (TwistedSifter, Nov 5 2026)
    dict(id="t044_the_translator", title="The Translator", made_on="2026-11-05", beats=[
        S("You’ve translated for your dad your whole life. He needs you at a meeting tomorrow.", ["stranger", "you"],
          "say", ["🗣️", "📄", "🙏"], "worried", set="home"),
        S("It’s during your class, and you have a test.", ["you"], "think", ["🎓", "📝", "⏰"], "worried",
          set="classroom"),
    ], close="Do you skip class to translate, or take your test?"),

    # Trend: Reddit post about buying a mother-in-law's groceries, then hearing she dislikes the store brands (Daily Dot, Nov 5 2026)
    dict(id="t045_the_store_brand", title="The Store Brand", made_on="2026-11-06", beats=[
        S("Every week you buy your mother-in-law’s groceries. She can’t afford them, and it isn’t cheap.", ["elder", "you"], "give",
          ["🛒", "🥫", "💵"], "worried", set="home"),
        S("Then you hear she complains that you always get the store brand.", ["partner", "you"], "tell",
          ["🏷️", "😒", "🛒"], "shock", set="home"),
    ], close="Do you keep buying her groceries, or stop?"),

    # Trend: Reddit story about a fired supervisor recruited back to rescue a failing contract (TwistedSifter, Nov 6 2026)
    dict(id="t046_the_callback", title="The Callback", made_on="2026-11-06", beats=[
        S("Your old boss let you go last year. Now their big project is failing.", ["boss", "you"], "say",
          ["📉", "📞", "🙏"], "shock", set="office"),
        S("They want you back to fix it. The pay is great, but they let you go.", ["you"], "think",
          ["💵", "🤔", "🚪"], "worried", set="home"),
    ], close="Do you go back to help, or say no?"),

    # Trend: Reddit story about an employee whose honest survey answers upset management (TwistedSifter, Nov 7 2026)
    dict(id="t047_the_honest_survey", title="The Honest Survey", made_on="2026-11-07", beats=[
        S("Your company sends an anonymous survey. They say they want honest answers.", ["you"], "see",
          ["📱", "📋", "🤫"], "worried", set="office"),
        S("You have real complaints. But you wonder how anonymous it really is.", ["you"], "think",
          ["📝", "👀", "🤔"], "worried", set="office"),
    ], close="Do you write what you really think, or play it safe?"),

    # Trend: story about handmade holiday gifts causing family tension (Daily Dot, Nov 6 2026)
    dict(id="t048_the_handmade_gifts", title="The Handmade Gifts", made_on="2026-11-07", beats=[
        S("Every year you make handmade gifts for your family. It takes you weeks.", ["you"], "react",
          ["🧶", "🎁", "❤️"], "happy", set="home"),
        S("This year you overhear them saying they’d prefer something from a store.", ["elder", "partner", "you"],
          "tell", ["🛍️", "🎁", "😬"], "shock", others="neutral", set="home"),
    ], close="Do you keep making them, or buy store gifts?"),

    # Trend: viral AITA post about declining a friend's bridesmaid request (r/AITApod, resurfacing Nov 2026)
    dict(id="t049_the_bridesmaid", title="The Bridesmaid", made_on="2026-11-08", beats=[
        S("Your close friend asks you to be a bridesmaid. You’re honored.", ["friend2", "you"], "say",
          ["💍", "👗", "🥂"], "happy", set="cafe"),
        S("Then you see the cost: the dress, the trip, the parties. About two thousand dollars.", ["you"], "see",
          ["📱", "💸", "✈️"], "shock", set="home"),
    ], close="Do you say yes, or decline?"),

    # Trend: Reddit story about a husband who trusted his friend over his wife, and the friend staying in their home (TwistedSifter, Nov 8 2026)
    dict(id="t050_the_houseguest", title="The Houseguest", made_on="2026-11-08", beats=[
        S("Your partner’s best friend is staying with you for a few months.", ["friend", "partner", "you"],
          "react", ["🛋️", "🧳", "🏠"], "worried", others="happy", set="home"),
        S("Every time you two disagree, the friend takes your partner’s side.", ["friend", "partner", "you"], "say",
          ["💬", "⚖️", "😤"], "worried", set="home"),
    ], close="Do you ask the friend to leave, or wait it out?"),

    # Trend: Reddit story about a cousin who threw out grandparents' things, then wanted the original photos (TwistedSifter, Nov 9 2026)
    dict(id="t051_the_family_photos", title="The Family Photos", made_on="2026-11-09", beats=[
        S("When your grandparents’ house was cleared out, you saved their old photos. Your cousin tossed the rest.",
          ["you"], "think", ["🖼️", "📦", "👴"], "sad", set="home"),
        S("Now your cousin wants the original photos for her own home.", ["friend2", "you"], "say",
          ["🖼️", "🙏", "🏠"], "worried", set="home"),
    ], close="Do you give them the originals, or send copies?"),

    # Trend: Reddit story about a friend staying over who wanted free professional advice (TwistedSifter, Nov 9 2026)
    dict(id="t052_the_free_advice", title="The Free Advice", made_on="2026-11-09", beats=[
        S("Your friend is staying with you while they look for a place.", ["friend", "you"], "react",
          ["🛋️", "🧳", "🏠"], "happy", others="happy", set="home"),
        S("Now they ask for work advice you normally charge clients for.", ["friend", "you"], "say",
          ["💼", "📋", "💵"], "worried", set="home"),
    ], close="Do you give the advice for free, or say no?"),

    # Trend: Reddit story about promising an old laptop to a struggling student, then parents wanting it for a sister (TwistedSifter, Nov 10 2026)
    dict(id="t053_the_old_laptop", title="The Old Laptop", made_on="2026-11-10", beats=[
        S("You promised your old laptop to a friend starting college. They can’t afford one.",
          ["friend", "you"], "give", ["💻", "🎓", "🙏"], "happy", set="home"),
        S("Then your mom says your little sister needs it for school.", ["elder", "kid", "you"], "say",
          ["💻", "👧", "📚"], "worried", others="worried", set="home"),
    ], close="Do you keep your promise, or give it to your sister?"),

    # Trend: Reddit story about a father-in-law who moved out and took appliances the couple paid for (TwistedSifter, Nov 10 2026)
    dict(id="t054_the_appliances", title="The Appliances", made_on="2026-11-10", beats=[
        S("Your father-in-law lived with you for a year. Now he’s moving out.", ["stranger", "partner", "you"],
          "react", ["🧳", "🏠", "👋"], "worried", others="neutral", set="home"),
        S("He takes the washer and fridge you paid for. He’s starting over, and money’s tight.",
          ["stranger", "partner", "you"], "say", ["🧺", "🧊", "💸"], "worried", others="worried", set="home"),
    ], close="Do you ask him to pay you back, or let it go?"),

    # Trend: r/AmIOverreacting post about a boyfriend choosing a guys-only holiday party (Daily Dot, Nov 10 2026)
    dict(id="t055_the_holiday_party", title="The Holiday Party", made_on="2026-11-11", beats=[
        S("Your partner’s friends throw a holiday party. Partners aren’t invited.", ["partner", "you"], "say",
          ["🎄", "🍻", "🚫"], "worried", set="home"),
        S("It’s the same night as a party you could both go to.", ["you"], "think", ["🎉", "🌙", "💑"],
          "worried", set="home"),
    ], close="Do you ask them to skip it, or let them go?"),

    # Trend: Reddit story about a host who stopped a stranger from coming in to use the bathroom (TwistedSifter, Nov 11 2026)
    dict(id="t056_the_bathroom", title="The Bathroom", made_on="2026-11-11", beats=[
        S("You’re hosting a party. A stranger knocks and asks to use your bathroom.", ["stranger", "you"], "say",
          ["🚪", "🚻", "🙏"], "shock", set="home_night"),
        S("They seem desperate. But you don’t know them, and your house is full.", ["you"], "think",
          ["🏠", "👥", "🤔"], "worried", set="home_night"),
    ], close="Do you let them in, or say no?"),

    # Trend: Reddit story about a roommate asking someone to give up her private bedroom for a couple (TwistedSifter, Nov 12 2026)
    dict(id="t057_the_private_room", title="The Private Room", made_on="2026-11-12", beats=[
        S("You have the only private bedroom. Your roommate just moved her partner in.", ["friend2", "you"], "say",
          ["🛏️", "🚪", "💑"], "worried", set="home"),
        S("She asks to swap rooms so they can have privacy. She offers to pay a little more rent.",
          ["friend2", "you"], "say", ["🔁", "💵", "🙏"], "worried", set="home"),
    ], close="Do you swap rooms, or keep yours?"),

    # Trend: story about a sister-in-law planning her wedding during someone's honeymoon (Daily Dot, Nov 11 2026)
    dict(id="t058_the_honeymoon", title="The Honeymoon", made_on="2026-11-12", beats=[
        S("Your honeymoon was booked months ago. Nonrefundable.", ["partner", "you"], "react", ["✈️", "🏝️", "💍"],
          "happy", others="happy", set="home"),
        S("Then your sister-in-law sets her wedding for the same week. She says it’s the only date.",
          ["friend2", "partner", "you"], "say", ["💒", "👰", "😬"], "shock", others="worried", set="home"),
    ], close="Do you move your honeymoon, or miss her wedding?"),
]
