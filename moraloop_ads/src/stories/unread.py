"""Loop long-form episode 4: "Unread" (from short 09_the_message).
You and your partner never read each other's messages. Then a pop-up shows they lied about Friday.
Cast: you = "you" (green), Robin = "partner" (purple). Morgan only appears in the messages.
"""
TITLE = "Unread"
NAMES = {"P": ("Robin", (205, 160, 255)), "Y": ("You", (130, 225, 145))}
VOICES = {"P": "am_michael", "Y": "am_adam"}

Y, P = "you", "partner"

# loop layers (see loop_ad.py): the messages on Robin's laptop
LOOP = dict(
    hook="what did the last message say?",
    thread=dict(contact="Morgan", stamp="Fri 10:26 PM", msgs=[
        "did you tell them yet?",
        "it's not a small thing.",
        "glad you skipped work for this.",
        "you deserve this, really",
        "about Monday, I",
    ]),
    cut_scene=2,  # the fast cut lands in "Friday night. A message pops up."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You and Robin have one rule. You never read each other's messages. Ever.", [P, Y], "react",
          ["📱", "🤝"], "happy", set="home", exprs={0: "happy"}),
        S("N", "Three years together, and it's always worked. No checking. No questions.", [P, Y], "react",
          ["🗓️", "🤝"], "happy", cont=True, set="home", exprs={0: "happy"}, hold=True),
        S("P", "Working late on Friday. Don't wait up!", [P, Y], "say", ["💼", "🌙"], "happy", set="home",
          speaker=0, you=1, voiced=True, spk_smile=0.6, at=0.5),
        S("N", "Friday night. Robin's laptop is open on the couch. A message pops up.", [Y], "see",
          ["💻", "💬"], "worried", set="home_night"),
        S("N", "It's from Morgan. And it says Robin wasn't at work tonight.", [Y], "see", ["💻", "💼", "❌"],
          "shock", set="home_night"),
        S("N", "The whole conversation is right there. One scroll away.", [Y], "think", ["💻", "👆"],
          set="home_night"),
        S("N", "Your rule says close it. Your doubt says look. So... what do you do?", [Y], "think",
          ["🤝", "💻", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You keep reading.", "CHOICE A", "KEEP READING", "👆"),
        S("N", "You scroll up. Weeks of messages with Morgan, a recruiter. Robin didn't work late. Robin drove to a job interview. In another city.",
          [Y], "see", ["💻", "🚗", "🏙️"], "shock", set="home_night"),
        S("P", "You read my messages? We had one rule.", [P, Y], "say", ["💻"], "sad", set="home", speaker=0,
          you=1, voiced=True, spk_expr="sad", at=0.5),
        S("Y", "I know. I'm sorry. But I'd rather know now than later.", [P, Y], "say", ["🙏"], "worried",
          cont=True, set="home", speaker=1, you=1, voiced=True, spk_expr="worried", hold=True),
        S("N", "You talk all night. For the first time, you plan the future together, out loud.", [P, Y], "react",
          ["🗺️", "💬"], "happy", set="home_night", exprs={0: "happy"}),
        S("N", "But now Robin keeps the laptop facing away. Every time.", [P, Y], "react", ["💻", "🔒"], "think",
          set="home", exprs={0: "think"}),
        S("N", "You know everything. And Robin knows you looked.", [Y], "think", ["💻", "💭"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You close the laptop.", "CHOICE B", "CLOSE THE LAPTOP", "💻",
             color=(0.36, 0.80, 0.72)),
        S("Y", "How was work?", [P, Y], "say", ["💼"], "think", set="home", speaker=1, you=1, voiced=True,
          spk_expr="think", at=0.5),
        S("P", "Long. Really long.", [P, Y], "say", ["🥱"], "think", cont=True, set="home", speaker=0, you=1,
          voiced=True, spk_smile=0.2, hold=True),
        S("N", "For two weeks, you wonder. Every late night feels a little longer.", [Y], "think", ["🌙", "⏳"],
          "worried", set="home_night"),
        S("P", "I need to tell you something. I got a job offer. In another city.", [P, Y], "say", ["✈️", "🏙️"],
          "shock", set="home", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("N", "Robin chose to tell you. In Robin's own time. That means something.", [P, Y], "react", ["🤝"],
          "happy", set="home", exprs={0: "happy"}),
        S("N", "But the decision is almost made. You're only hearing about it now.", [Y], "think", ["⏰", "💭"],
          "worried", set="home_night"),
        S("N", "Your rule held. The news... is still sinking in.", [Y], "think", ["🤝", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch the last message?"),
        M("Two choices. Two very different endings."),
        M("Do you keep reading?"),
        M("What would you do?", close=True),
    ]
