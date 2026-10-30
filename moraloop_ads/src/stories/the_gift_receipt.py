"""Loop long-form episode 11: "The Gift Receipt" (from short 28_the_gift).
Your aunt hand-knits you a birthday sweater that really isn't your style, and she's watching your face.
Cast: you = "you" (green), Aunt June = "elder", Pip = "cousin" (your little cousin).
"""
TITLE = "The Gift Receipt"
NAMES = {"J": ("Aunt June", (240, 175, 190)), "Y": ("You", (130, 225, 145))}
VOICES = {"J": "bf_emma", "Y": "am_adam"}

Y, J, P = "you", "elder", "cousin"

# loop layers (see loop_ad.py): the card tucked into the gift
LOOP = dict(
    hook="what did the card say?",
    note=dict(title="Happy birthday!", lines=[
        "first time doing stripes",
        "tell me if it fits!",
        "wear it Sunday?",
        "love, Aunt June",
        "made it myself!",
    ]),
    cut_scene=1,  # the fast cut lands in "Tucked inside, a card."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Your birthday party. Aunt June hands you a big, soft package.", [J, Y], "give", ["🎁", "🎂"],
          "happy", set="party", exprs={0: "happy"}),
        S("N", "Aunt June has knitted for the family since before you were born.", [J, Y], "react", ["🧶", "👵"],
          "happy", cont=True, set="party", exprs={0: "happy"}, hold=True),
        S("N", "Tucked inside, a card. And a hand-knitted sweater. Orange and purple stripes. Two sizes too big.",
          [J, Y], "see", ["🧶", "🟧", "🟪"], "shock", set="party"),
        S("J", "I made it myself! Will you wear it to Sunday dinner?", [J, Y], "say", ["🧶", "🍽️"], "happy",
          set="party", speaker=0, you=1, voiced=True, spk_smile=0.8, at=0.5),
        S("N", "Your little cousin Pip giggles. Aunt June is watching your face.", [P, J, Y], "laugh", ["😂", "👀"],
          "worried", set="party", exprs={0: "laugh", 1: "happy"}),
        S("N", "It's not your style. At all. But she made it by hand. So... what do you do?", [Y], "think",
          ["🧶", "❤️", "❓"], set="party"),
        # ---------------- choice A
        CARD("N", "Choice A. You say you love it.", "CHOICE A", "SAY YOU LOVE IT", "🥰"),
        S("Y", "I love it! Thank you, Aunt June.", [J, Y], "say", ["🥰"], "happy", set="party", speaker=1, you=1,
          voiced=True, spk_smile=0.6, at=0.5),
        S("N", "Aunt June beams. She tells everyone at the party.", [J], "react", ["✨", "🗣️"], "happy",
          set="party", you=0),
        S("N", "Sunday dinner. You wear it. It itches all evening.", [J, Y], "react", ["🧶", "😬"], "worried",
          set="dinner", exprs={0: "happy"}),
        S("J", "You look wonderful! I'll knit you a matching hat for winter.", [J, Y], "say", ["🧢", "❄️"],
          "worried", cont=True, set="dinner", speaker=0, you=1, voiced=True, spk_smile=0.8, hold=True),
        S("N", "Photos of you in the sweater land in the family group chat.", [Y], "see", ["📱", "📸"], "worried",
          set="home_night"),
        S("N", "Aunt June smiles every time you wear it. So you keep wearing it.", [J], "react", ["😊", "🧶"], "happy",
          set="home", you=0),
        S("N", "Aunt June is happy. And a matching hat... is on its way.", [Y], "think", ["🧢", "💭"],
          set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You're honest about how you feel.", "CHOICE B", "BE HONEST", "💬",
             color=(0.36, 0.80, 0.72)),
        S("Y", "I love that you made it. It's just... not really my style. And it's a bit big.", [J, Y], "say",
          ["🧶", "💬"], "worried", set="party", speaker=1, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("J", "Oh.", [J, Y], "say", ["😶"], "sad", cont=True, set="party", speaker=0, you=1, voiced=True,
          spk_expr="sad", hold=True),
        S("J", "Well. Tell me what you'd really wear. I'll get the next one right.", [J, Y], "say", ["🧶", "📝"],
          "think", set="party", speaker=0, you=1, voiced=True, spk_smile=0.3, at=0.5),
        S("N", "Two months later, a plain green scarf arrives. You wear it every day.", [Y], "react", ["🧣", "💚"],
          "happy", set="home"),
        S("N", "But at the next birthday, Aunt June hands over a gift card. Just in case.", [J], "give",
          ["💳", "🎁"], "sad", set="party", you=0),
        S("N", "You got the truth out, and a scarf you love. Aunt June's knitting... is a little more careful now.",
          [Y], "think", ["🧣", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch what the card said?"),
        M("Two choices. Two very different endings."),
        M("Do you pretend you love it... or are you honest about how you feel?"),
        M("What would you do?", close=True),
    ]
