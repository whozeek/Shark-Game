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
]
