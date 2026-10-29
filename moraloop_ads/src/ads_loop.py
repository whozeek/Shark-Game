"""Loop-format shorts: a regular Moraloop short wrapped by loop_ad.py with
(1) an open-loop flash on the first frame, (2) a buried 1-second fast cut mid-video,
and (3) a last frame that matches the first so the video replays seamlessly.
Render one with:  python3 loop_ad.py render ../loops <id>
"""
from ads_spec import S, M

ADS = [
    dict(id="l001_dont_tell_her", title="Don’t Tell Her", made_on="2026-10-26",
         hook="what did the last text say?",
         # phone thread: shown full-size for a few frames at the start, and in a 1s fast cut mid-video
         thread=dict(contact="Jordan", stamp="Sat 11:48 PM", msgs=[
             "hey, you up?",
             "ok I booked it for Saturday",
             "she can NOT find out before then",
             "I’ll explain everything tomorrow ❤️",
             "don’t tell her.",
         ]),
         cut_beat=1,  # the fast cut lands inside this scene beat (0-based)
         beats=[
             S("Your best friend’s partner texts you. Late at night.", ["you"], "see", ["📱", "🌙", "💬"],
               "shock", set="home_night"),
             S("Something about Saturday. Then: “Don’t tell her.”", ["you"], "think", ["📱", "🤫"], "worried",
               set="home_night"),
             M("Did you catch the whole thread?"),
         ], close="Do you tell your friend, or keep quiet?"),

    # Trend: Reddit posts about being uninvited from a childhood friend's wedding a week out (Oct 2026)
    dict(id="l002_the_uninvite", title="The Uninvite", made_on="2026-10-26",
         hook="why were you uninvited?",
         thread=dict(contact="Casey", stamp="Sun 9:12 PM", msgs=[
             "I hate doing this over text",
             "the venue cut us to 60 people",
             "we had to pick old friends or new",
             "so sorry. drinks after the honeymoon?",
             "don’t hate me 🙏",
         ]),
         cut_beat=1,
         beats=[
             S("Your childhood friend uninvites you from their wedding. One week before.", ["you"], "see",
               ["📱", "💍", "💔"], "shock", set="home"),
             S("Your gift is already bought and wrapped.", ["you"], "think", ["🎁", "🤔"], "worried", set="home"),
             M("Did you read the whole text?"),
         ], close="Do you still send the gift, or keep it?"),

    # Trend: group-costume chats on TikTok ("47 ideas, zero decisions") the week before Halloween (Oct 2026)
    dict(id="l003_the_fifth_costume", title="The Fifth Costume", made_on="2026-10-26",
         hook="what did the group chat decide?",
         thread=dict(contact="Costume Crew", stamp="Mon 6:40 PM", msgs=[
             "ok it’s settled: the four seasons 🍂",
             "wait, aren’t we five?",
             "maybe a fifth season? idk",
             "you weren’t on when we voted",
             "your call 🤷",
         ]),
         cut_beat=1,
         beats=[
             S("Your friends pick a group costume for four people. There are five of you.",
               ["friend", "friend2", "you"], "say", ["🎃", "👥", "🍂"], "worried", others="happy", set="home"),
             S("The costumes are already ordered. Halloween is Saturday.", ["you"], "think", ["📦", "👻", "🗓️"],
               "worried", set="home"),
             M("Did you catch the whole group chat?"),
         ], close="Do you sit this one out, or ask them to change?"),

    # Trend: viral posts about being let go the same day you give notice (BuzzFeed/Reddit, Oct 21 2026)
    dict(id="l004_the_two_weeks", title="The Two Weeks", made_on="2026-10-27",
         hook="what happened when they quit?",
         thread=dict(contact="Alex", stamp="Fri 5:02 PM", msgs=[
             "they cut my access in 20 min",
             "HR said effective immediately",
             "lost two weeks of pay",
             "but my boss wrote a great reference",
             "do what’s best",
         ]),
         cut_beat=1,
         beats=[
             S("You have a new job lined up. Time to tell your boss.", ["you"], "think", ["💼", "✉️", "👋"],
               "worried", set="office"),
             S("Last week, your coworker gave notice and was let go that same day.", ["coworker", "you"], "tell",
               ["📦", "🚪"], "shock", others="worried", set="office"),
             M("Did you read what your coworker sent?"),
         ], close="Do you give two weeks’ notice, or leave without it?"),

    # Trend: viral NYC neighbors trading notes through facing windows (Instagram, Oct 2026)
    dict(id="l005_the_window_note", title="The Window Note", made_on="2026-10-27",
         hook="what does the note say?",
         note=dict(title="Hey, neighbor", lines=[
             "sorry about last night 😳",
             "I didn’t know anyone could see 💃",
             "can we pretend it never happened?",
             "or...",
             "coffee?",
         ]),
         cut_beat=1,
         beats=[
             S("Last night you saw your neighbor across the way dancing. Badly. They saw you see.", ["you"],
               "laugh", ["🪟", "💃", "😳"], "laugh", set="home_night"),
             S("This morning, a note is taped to their window.", ["you"], "see", ["🪟", "📝"], "shock",
               set="home"),
             M("Did you catch the whole note?"),
         ], close="Do you write back, or act like you never saw it?"),

    # Trend: viral TikTok about a Hinge date that switched to a pricier spot, then asked about the bill (Oct 22 2026)
    dict(id="l006_the_second_spot", title="The Second Spot", made_on="2026-10-27",
         hook="what did your date text?",
         thread=dict(contact="Your date", stamp="Sat 11:20 PM", msgs=[
             "had so much fun tonight!",
             "sorry, I picked the pricey place",
             "that dessert tho 🤤",
             "same time next week?",
             "no pressure 🙂",
         ]),
         cut_beat=1,
         beats=[
             S("First date. Halfway through, your date wants to move to a fancier spot.", ["partner", "you"], "say",
               ["🍝", "🥂", "✨"], "happy", others="happy", set="cafe"),
             S("The bill comes. They ask, “How do you want to do this?”", ["partner", "you"], "say", ["🧾", "💳", "❓"],
               "worried", others="neutral", set="cafe"),
             M("Did you catch the whole text?"),
         ], close="Do you split it, or pay for just your own?"),

    # Trend: "Switch Witch" candy-swap debate among parents the week of Halloween (Oct 2026)
    dict(id="l007_the_candy_swap", title="The Candy Swap", made_on="2026-10-27",
         hook="what did the other parents say?",
         thread=dict(contact="Class Parents", stamp="Thu 8:15 PM", msgs=[
             "so are we doing the candy swap?",
             "mine cried last year lol",
             "mine still talks about the toy",
             "dentist says ration it",
             "do what works",
         ]),
         cut_beat=1,
         beats=[
             S("Halloween night. Your kid comes home with a giant bag of candy.", ["kid", "you"], "give",
               ["🎃", "🍬", "🍫"], "shock", others="happy", set="home_night"),
             S("Some parents swap the candy for a toy while kids sleep.", ["you"], "think", ["🍬", "🔄", "🧸"],
               "worried", set="home_night"),
             M("Did you catch the whole group chat?"),
         ], close="Do you swap the candy for a toy, or let them keep it?"),

    # Trend: Reddit/TikTok story about a dinner-party guest sitting on someone's partner's lap (Oct 2026)
    dict(id="l008_the_lap", title="The Lap", made_on="2026-10-27",
         hook="what did the guest text?",
         thread=dict(contact="Morgan", stamp="Sun 10:41 AM", msgs=[
             "lol last night was wild",
             "sorry if the lap thing was weird",
             "we’ve been friends since college",
             "it’s just how we joke",
             "we good? 😅",
         ]),
         cut_beat=1,
         beats=[
             S("Dinner party. Your partner’s old friend sits on their lap. As a joke.", ["friend2", "partner", "you"],
               "laugh", ["🍷", "🪑", "😬"], "shock", others="laugh", set="party"),
             S("Everyone laughs. Your partner laughs too.", ["partner", "you"], "laugh", ["😂", "🤔"], "worried",
               others="laugh", set="party"),
             M("Did you read the whole text?"),
         ], close="Do you say something, or laugh it off?"),

    # Trend: Reddit posts about hosting Thanksgiving again with little help from family (Oct 2026)
    dict(id="l009_the_host_again", title="The Host Again", made_on="2026-10-27",
         hook="what did your sibling say?",
         thread=dict(contact="Sibling", stamp="Tue 7:03 PM", msgs=[
             "so same as last year? 🦃",
             "I can bring dessert",
             "I can help clean up",
             "mom is so excited",
             "you’re the best",
         ]),
         cut_beat=1,
         beats=[
             S("You’ve hosted the big family dinner three years in a row.", ["you"], "think", ["🦃", "🍽️", "🧽"],
               "worried", set="home"),
             S("It costs you hundreds and a week of cooking. But it’s the one day everyone shows up.",
               ["sibling", "you"], "say", ["💸", "🍳", "⏰"], "worried", others="happy", set="home"),
             M("Did you catch the whole thread?"),
         ], close="Do you host again, or say no this year?"),

    # Trend: Reddit post about being "volun-told" to drive a friend's teen to work before dawn (Oct 2026)
    dict(id="l010_the_early_ride", title="The Early Ride", made_on="2026-10-28",
         hook="what did your friend ask?",
         thread=dict(contact="Riley", stamp="Sun 8:47 PM", msgs=[
             "she starts Monday at 6 🙏",
             "it’s right on your way",
             "I’d do it but my shifts…",
             "happy to pay for gas",
             "only if you can",
         ]),
         cut_beat=1,
         beats=[
             S("Your friend’s teen just got a job. It starts at six in the morning.", ["friend", "cousin", "you"],
               "say", ["🚗", "⏰", "🌙"], "worried", others="happy", set="home"),
             S("They ask if you can drive her there. Every day. You’d be up before five.", ["you"], "think",
               ["🚗", "😴", "🌅"], "worried", set="home_night"),
             M("Did you catch the whole text?"),
         ], close="Do you say yes to the rides, or say no?"),

    # Trend: Reddit post about splitting a bigger vacation rental evenly with friends who bring kids (Oct 2026)
    dict(id="l011_the_even_split", title="The Even Split", made_on="2026-10-28",
         hook="what did the trip chat say?",
         thread=dict(contact="Beach Trip", stamp="Tue 9:30 PM", msgs=[
             "bigger house booked 🏠",
             "even split keeps it simple",
             "we’ll cook every night 🍝",
             "you get the ocean room 🌊",
             "sound good?",
         ]),
         cut_beat=1,
         beats=[
             S("Your friend group rents a beach house. Two couples are bringing their kids.",
               ["friend", "friend2", "you"], "say", ["🏖️", "🏠", "👨‍👩‍👧"], "happy", others="happy", set="home"),
             S("So the house got bigger, and pricier. They want to split it evenly.", ["you"], "think",
               ["🏠", "💸", "➗"], "worried", set="home"),
             M("Did you catch the whole chat?"),
         ], close="Do you split it evenly, or ask to pay less?"),

    # Trend: TikTok boss video about a worker calling out over a bad sunburn (Daily Dot, Oct 21 2026)
    dict(id="l012_the_sunburn", title="The Sunburn", made_on="2026-10-28",
         hook="what did your coworker text?",
         thread=dict(contact="Sam (work)", stamp="Mon 6:52 AM", msgs=[
             "you coming in today?",
             "we’re short two people",
             "boss is in a mood lol",
             "it’s fine if you can’t",
             "let me know",
         ]),
         cut_beat=1,
         beats=[
             S("You wake up with a terrible sunburn. Everything hurts.", ["you"], "react", ["☀️", "🔥", "😣"],
               "shock", set="home"),
             S("Your shift starts in an hour. You could still make it.", ["you"], "think", ["⏰", "💼", "🤒"],
               "worried", set="home"),
             M("Did you read the whole thread?"),
         ], close="Do you call in sick, or go in?"),

    # Trend: TikTok couple disagreeing over tipping after slow service (Daily Dot, Oct 26 2026)
    dict(id="l013_the_tip", title="The Tip", made_on="2026-10-28",
         hook="what does the receipt say?",
         note=dict(title="Receipt", lines=[
             "2 pasta, 1 salad: $64",
             "Wrong order, remade",
             "Wait: 55 min",
             "Thanks! Jamie ☺",
             "Tip: ____",
         ]),
         cut_beat=1,
         beats=[
             S("Dinner out. The food takes almost an hour, and one order comes out wrong.", ["partner", "you"], "react",
               ["🍝", "⏳", "❌"], "worried", others="worried", set="cafe"),
             S("The bill comes. Your partner says, “We’re not tipping for that.”", ["partner", "you"], "say",
               ["🧾", "💵", "🤔"], "worried", others="angry", set="cafe"),
             M("Did you catch the whole receipt?"),
         ], close="Do you leave the full tip, or leave less?"),

    # Trend: TikTok about a partner liking strangers' photos online (Daily Dot, Oct 26 2026)
    dict(id="l014_the_likes", title="The Likes", made_on="2026-10-28",
         hook="what did your friend find?",
         thread=dict(contact="Bestie", stamp="Thu 10:15 PM", msgs=[
             "ok I checked their likes 👀",
             "mostly gym and food pics",
             "and… a lot of selfies",
             "could mean nothing tbh",
             "idk 🤷",
         ]),
         cut_beat=1,
         beats=[
             S("Your partner is great. Kind, funny, always there for you.", ["partner", "you"], "laugh",
               ["❤️", "😂", "🏠"], "happy", others="happy", set="home"),
             S("But online, they like a lot of strangers’ selfies.", ["you"], "see", ["📱", "❤️", "🤳"],
               "worried", set="home_night"),
             M("Did you read the whole thread?"),
         ], close="Do you bring it up, or let it go?"),

    # Trend: viral debate over wedding gifts worth less than the cost of a guest's meal (Oct 2026)
    dict(id="l015_the_plate_price", title="The Plate Price", made_on="2026-10-28",
         hook="how much is everyone giving?",
         thread=dict(contact="Jordan", stamp="Fri 4:20 PM", msgs=[
             "how much are you giving?",
             "I heard plates are $110 😬",
             "I was gonna do $100",
             "they did fly in for ours tho",
             "idk… you?",
         ]),
         cut_beat=1,
         beats=[
             S("Your friend’s wedding is this weekend. You planned to give $100.", ["you"], "think",
               ["💍", "✉️", "💵"], "happy", set="home"),
             S("Then you hear each dinner plate costs more than that.", ["friend", "you"], "tell",
               ["🍽️", "💸", "😬"], "worried", others="worried", set="home"),
             M("Did you catch the whole thread?"),
         ], close="Do you give more, or give what you planned?"),

    # Trend: TikTok about a steakhouse serving a cheaper cut than the one ordered (Fox News, Oct 26 2026)
    dict(id="l016_the_wrong_steak", title="The Wrong Steak", made_on="2026-10-29",
         hook="what did your friend say?",
         thread=dict(contact="Dana", stamp="Sat 8:14 PM", msgs=[
             "wait, it’s the cheaper cut?",
             "that’s half the price tho",
             "but you ate half lol",
             "they’re slammed tonight",
             "up to you",
         ]),
         cut_beat=1,
         beats=[
             S("You order the priciest steak on the menu. Twice the price of the next cut.", ["you"], "react",
               ["🥩", "💵", "😋"], "happy", set="cafe"),
             S("Halfway through, you realize they brought the cheaper cut.", ["you"], "think", ["🥩", "🤔", "🧾"],
               "worried", set="cafe"),
             M("Did you catch the whole text?"),
         ], close="Do you ask them to fix the bill, or just pay?"),

    # Trend: Reddit post about backing out of babysitting a coworker's kid when the boss required overtime (Oct 28 2026)
    dict(id="l017_the_overtime", title="The Overtime", made_on="2026-10-29",
         hook="what did your coworker text?",
         thread=dict(contact="Jess (work)", stamp="Thu 3:05 PM", msgs=[
             "still good for tonight? 🙏",
             "sitter fell through again",
             "pickup’s at 6",
             "if work gets crazy I get it",
             "thank you!!",
         ]),
         cut_beat=1,
         beats=[
             S("You promised to watch your coworker’s kid tonight.", ["coworker", "you"], "tell",
               ["🧸", "🕕", "🙏"], "happy", others="happy", set="office"),
             S("Then your boss says the whole team has to stay late.", ["boss", "you"], "say", ["⏰", "💼", "❗"],
               "worried", others="neutral", set="office"),
             M("Did you read the whole thread?"),
         ], close="Do you stay for overtime, or leave to babysit?"),

    # Trend: Reddit post about a teen who didn't want to share food she bought with her mom (Oct 28 2026)
    dict(id="l018_the_first_paycheck", title="The First Paycheck", made_on="2026-10-29",
         hook="what did your mom text?",
         thread=dict(contact="Mom", stamp="Fri 6:40 PM", msgs=[
             "smells amazing in here 😋",
             "I cooked all week btw",
             "but it’s your money",
             "half?? 👀",
             "or not, lol",
         ]),
         cut_beat=1,
         beats=[
             S("You buy dinner with your very first paycheck. Your favorite.", ["you"], "laugh", ["💵", "🍔", "🎉"],
               "happy", set="home"),
             S("Your mom asks if she can have half.", ["friend2", "you"], "say", ["🍔", "✋", "🤔"], "worried",
               others="happy", set="home"),
             M("Did you catch the whole thread?"),
         ], close="Do you share it, or keep it?"),

    # Trend: viral Reddit debate about a friend announcing a pregnancy at someone else's celebration (Motherly, Oct 2026)
    dict(id="l019_the_big_news", title="The Big News", made_on="2026-10-29",
         hook="what did your friend text?",
         thread=dict(contact="Kai", stamp="Sun 12:31 AM", msgs=[
             "did NOT see that coming 😳",
             "at your birthday tho?",
             "they were so nervous",
             "maybe it felt like the time",
             "you okay?",
         ]),
         cut_beat=1,
         beats=[
             S("It’s your birthday dinner. Everyone you love is here.", ["friend", "friend2", "you"], "laugh",
               ["🎂", "🎉", "🥂"], "happy", others="happy", set="party"),
             S("Then your friend stands up and announces they’re having a baby.", ["friend2", "you"], "say",
               ["👶", "🎈", "😮"], "shock", others="happy", set="party"),
             M("Did you read the whole thread?"),
         ], close="Do you tell them how it felt, or let it be their moment?"),

    # Trend: TikTok warning about getting too close to coworkers sparks debate (Daily Dot, Oct 2026)
    dict(id="l020_the_work_friend", title="The Work Friend", made_on="2026-10-29",
         hook="what did the invite say?",
         thread=dict(contact="Theo (work)", stamp="Wed 1:12 PM", msgs=[
             "small thing Saturday 🎂",
             "mostly my college friends",
             "no pressure at all",
             "would be fun though",
             "lmk 🙂",
         ]),
         cut_beat=1,
         beats=[
             S("You’re friendly at work, but you keep your weekends separate.", ["coworker", "you"], "laugh",
               ["💼", "🚪", "🏠"], "happy", others="happy", set="office"),
             S("Then a coworker invites you to their birthday this weekend.", ["coworker", "you"], "say",
               ["🎂", "🎉", "🤔"], "worried", others="happy", set="office"),
             M("Did you catch the whole invite?"),
         ], close="Do you go, or keep work and weekends apart?"),

    # Trend: Reddit story about best friends who live and work together until one burns out (TwistedSifter, Oct 2026)
    dict(id="l021_the_roommate_bestie", title="The Roommate Bestie", made_on="2026-10-29",
         hook="what did your bestie text?",
         thread=dict(contact="Bestie", stamp="Tue 9:58 PM", msgs=[
             "carpool tmrw? 🚗",
             "rent’s due friday btw",
             "I’d be lost without you lol",
             "kinda need a quiet night tho",
             "you good?",
         ]),
         cut_beat=1,
         beats=[
             S("Your best friend is also your roommate. And your coworker.", ["friend", "you"], "laugh",
               ["🏠", "💼", "👯"], "happy", others="happy", set="home"),
             S("You love them, but you never get time alone. Moving out would cost a lot.", ["you"], "think",
               ["🏠", "💸", "🔑"], "worried", set="home_night"),
             M("Did you read the whole thread?"),
         ], close="Do you move out, or stay?"),
]
