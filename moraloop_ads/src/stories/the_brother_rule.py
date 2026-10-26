"""Loop long-form episode 1: "The Brother Rule" (from short 01_your_brother).
You always said you'd tell a friend if their partner cheated. Then the one who cheated is your brother.
Cast: you = "you" (green), Theo = "brother" (blue), Maya = "partner" (purple, Theo's girlfriend and your friend),
Nia = "friend" (orange), Mom = "elder", the other person = "stranger".
"""
TITLE = "The Brother Rule"
NAMES = {"T": ("Theo", (120, 165, 255)), "P": ("Maya", (205, 160, 255)), "F": ("Nia", (255, 170, 80)),
         "Y": ("You", (130, 225, 145))}
VOICES = {"T": "am_echo", "P": "af_bella", "F": "af_nova", "Y": "am_adam"}

Y, T, P, F, E, X = "you", "brother", "partner", "friend", "elder", "stranger"

# loop layers (see loop_ad.py): the texts Theo sends you that night
LOOP = dict(
    hook="what did your brother ask you?",
    thread=dict(contact="Theo", stamp="Sat 1:12 AM", msgs=[
        "I know what you saw.",
        "it's not what it looked like. ok, it is.",
        "I'll tell her myself. give me a week.",
        "I know what you always say.",
        "just this once.",
    ]),
    cut_scene=3,  # the fast cut lands in "That night, Theo texts you."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "This is your brother, Theo. And Maya, his girlfriend of two years. She's also one of your closest friends.",
          [T, P, Y], "react", ["👬", "❤️"], "happy", set="park", exprs={0: "happy", 1: "happy"}),
        S("F", "My cousin's best friend saw her boyfriend with someone else. Would you say something?", [F, Y], "say", ["😮", "💔"], "shock",
          set="dinner", speaker=0, you=1, voiced=True, spk_expr="shock", at=0.6),
        S("Y", "Cheating is cheating. If it were my friend, I'd tell. Every time.", [F, Y], "say", ["🗣️"], "think",
          cont=True, set="dinner", speaker=1, you=1, voiced=True, spk_expr="think", hold=True),
        S("N", "Two weeks later, across town, you see Theo... with someone who isn't Maya.", [X, T, Y], "witness",
          ["💋"], "shock", set="street", xs=[-262, -100, 210], at=0.6),
        S("N", "That night, Theo texts you. Then he shows up at your door.", [Y], "see", ["📱", "🌙", "💬"], "worried",
          set="home_night"),
        S("T", "It was a mistake. I'll tell her myself. Please... just this once.", [T, Y], "tell", ["🙏", "🤫"],
          "worried", set="home", voiced=True, spk_expr="worried", at=0.4),
        S("N", "The next day, Maya calls. She wants your help planning Theo's birthday.", [Y], "see",
          ["📱", "🎂", "🎉"], "worried", set="home"),
        S("N", "Your rule says tell. Your brother says wait. So... what do you do?", [Y], "think",
          ["📏", "👬", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You tell Maya.", "CHOICE A", "TELL MAYA", "🗣️"),
        S("Y", "Maya... I need to tell you something. It's about Theo.", [Y, P], "say", ["💬"], "worried",
          set="cafe", speaker=0, you=0, voiced=True, spk_expr="worried", at=0.5),
        S("P", "How long have you known?", [Y, P], "say", [], "sad", cont=True, set="cafe", speaker=1, you=0,
          voiced=True, spk_expr="sad", hold=True),
        S("N", "Maya ends it. For weeks, she calls you late at night. You pick up every time.", [P, Y], "react",
          ["📱", "🤝"], "sad", set="home_night", exprs={0: "sad"}),
        S("T", "I needed one week. You couldn't give me that.", [T, Y], "say", ["💔"], "sad", set="street",
          voiced=True, spk_expr="angry", at=0.5),
        S("N", "At family dinner, there's an empty chair. Theo stopped coming.", [E, Y], "react", ["🍽️", "🪑"],
          "sad", set="dinner", exprs={0: "sad"}),
        S("P", "You were the only one who was straight with me.", [P, Y], "say", ["🤝"], "happy", set="park",
          speaker=0, you=1, voiced=True, spk_smile=0.3, at=0.5),
        S("N", "Theo answers your texts now. Short ones. You're still waiting for a long one.", [Y], "see",
          ["📱", "⏳"], "think", set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You keep the secret.", "CHOICE B", "KEEP THE SECRET", "🤫",
             color=(0.36, 0.80, 0.72)),
        S("N", "Theo's birthday. Maya's surprise works perfectly. You smile... and say nothing.", [T, P, Y],
          "laugh", ["🎂", "🎉"], "worried", set="party", exprs={0: "happy", 1: "happy"}),
        S("T", "Thank you. I mean it. I won't forget this.", [T, Y], "say", ["🙏"], "happy", set="party",
          speaker=0, you=1, voiced=True, spk_smile=0.4, at=0.5),
        S("N", "At family dinner, every chair is full. You and Theo are closer than ever. Maya asks why you're so quiet.",
          [E, T, Y], "react", ["🍽️", "👬"], "happy", set="dinner", exprs={0: "happy", 1: "happy"}),
        S("N", "A month later, Maya finds out. Theo says he was about to tell her.", [T, P], "tell", ["💬"], "sad",
          set="home", exprs={1: "sad"}),
        S("P", "You helped me plan his party. And you knew.", [P, Y], "say", ["💔"], "sad", set="cafe",
          speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "Your brother trusts you more than ever. Maya answers your texts now. Short ones.", [Y], "think",
          ["👬", "❓"], set="home_night"),
        # ---------------- the host
        M("Did you catch what Theo asked you that night?"),
        M("Two choices. Two very different endings."),
        M("Your brother cheated, and you always said you’d tell. Do you tell?"),
        M("What would you do?", close=True),
    ]
