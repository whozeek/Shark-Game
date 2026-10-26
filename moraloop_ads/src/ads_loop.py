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
]
