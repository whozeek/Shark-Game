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
]
