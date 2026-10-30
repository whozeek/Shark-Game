"""Loop long-form episode 12: "Not My Business" (from short 29_the_unasked_advice).
Your friend is quitting a steady job for a startup. You hear it has money trouble. They didn't ask for advice.
Cast: you = "you" (green), Ezra = "friend" (orange). Tam only appears in the messages.
"""
TITLE = "Not My Business"
NAMES = {"E": ("Ezra", (255, 170, 80)), "Y": ("You", (130, 225, 145))}
VOICES = {"E": "am_fenrir", "Y": "am_adam"}

Y, E = "you", "friend"

# loop layers (see loop_ad.py): Tam's texts about the startup
LOOP = dict(
    hook="what did Tam tell you?",
    thread=dict(contact="Tam", stamp="Thu 10:47 PM", msgs=[
        "Kit's startup? I left after 2 months",
        "pay came late. twice.",
        "the idea is really good though",
        "some people love it there",
        "Ezra has no idea",
    ]),
    cut_scene=2,  # the fast cut lands in "That night, Tam texts you."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("E", "I'm quitting on Monday. I'm going all in on Kit's startup!", [E, Y], "say", ["🚀", "💼"], "happy",
          set="cafe", speaker=0, you=1, voiced=True, spk_smile=0.8, at=0.5),
        S("E", "Don't try to talk me out of it. I just need you in my corner.", [E, Y], "say", ["🤝", "🙏"], "happy",
          cont=True, set="cafe", speaker=0, you=1, voiced=True, spk_smile=0.5, hold=True),
        S("N", "Ezra has a steady job, and has dreamed about this for years.", [E], "react", ["💼", "✨"],
          "happy", set="office", you=0),
        S("N", "Kit, the founder, is Ezra's friend from college. The idea is exciting.", [E], "react",
          ["💡", "🤝"], "happy", cont=True, set="office", you=0, hold=True),
        S("N", "That night, Tam texts you. Tam used to work at Kit's startup.", [Y], "see", ["📱", "🌙", "💬"],
          "worried", set="home_night"),
        S("N", "Ezra didn't ask for advice. Ezra asked for support. So... what do you do?", [Y], "think",
          ["⚠️", "🤝", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You warn Ezra.", "CHOICE A", "WARN EZRA", "⚠️"),
        S("Y", "Before Monday... Tam worked there. The pay came late. Twice. I just think you should know.",
          [E, Y], "say", ["📱", "⚠️"], "worried", set="cafe", speaker=1, you=1, voiced=True, spk_expr="worried",
          at=0.5),
        S("E", "I didn't ask for a review. I asked for a friend.", [E, Y], "say", ["😤"], "sad", cont=True,
          set="cafe", speaker=0, you=1, voiced=True, spk_expr="angry", hold=True),
        S("N", "Ezra asks Kit. Kit admits money is tight right now.", [E], "see", ["📱", "💸"], "worried",
          set="home_night", you=0),
        S("N", "Ezra waits two months and saves up first. Then makes the jump.", [E], "react", ["🐷", "🚀"],
          "happy", set="office", you=0),
        S("E", "Thanks. Even if I hated hearing it.", [E, Y], "say", ["🤝"], "think", set="park", speaker=0, you=1,
          voiced=True, spk_smile=0.3, at=0.5),
        S("N", "But now Ezra stops telling you big plans early.", [Y], "see", ["📱", "🤐"], "sad",
          set="home_night"),
        S("N", "Ezra jumped with a safety net. And next time, you might hear about it last.", [Y], "think",
          ["🪂", "💭"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You stay out of it.", "CHOICE B", "STAY OUT OF IT", "🤐",
             color=(0.36, 0.80, 0.72)),
        S("Y", "If this is what you want, I'm in your corner.", [E, Y], "say", ["🤝"], "happy", set="cafe",
          speaker=1, you=1, voiced=True, spk_smile=0.5, at=0.5),
        S("E", "That means everything.", [E, Y], "say", ["🥹"], "happy", cont=True, set="cafe", speaker=0, you=1,
          voiced=True, spk_smile=0.8, hold=True),
        S("N", "Ezra quits on Monday. The first month is the happiest you've seen Ezra in years.", [E], "react",
          ["🚀", "😄"], "happy", set="office", you=0),
        S("N", "In month two, a paycheck comes late.", [E], "see", ["📅", "💸"], "worried", set="home_night",
          you=0),
        S("E", "Rough month. But I'd still do it again.", [E, Y], "say", ["📅", "🚀"], "think",
          set="park", speaker=0, you=1, voiced=True, spk_smile=0.3, at=0.5),
        S("N", "Ezra is still there. Still believes in it. Still a little short on rent.", [E], "react",
          ["🚀", "🧾"], "think", set="office", you=0),
        S("N", "Ezra chose freely. And you'll never know if a warning would have changed anything.", [Y], "think",
          ["🤐", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch what Tam told you?"),
        M("Two choices. Two very different endings."),
        M("Do you warn them... or stay out of it?"),
        M("What would you do?", close=True),
    ]
