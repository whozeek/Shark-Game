"""Long-form episode 11: "The Empty Yard" (from short 02_the_school_garden).
One empty school yard and money to build one thing: a food garden or a play space.
Cast: you = "you" (a parent on the school committee), Principal Rowan = "elder", Bo = "kid", Pip = "cousin".
"""
TITLE = "The Empty Yard"
NAMES = {"R": ("Principal Rowan", (240, 175, 190)), "K": ("Bo", (255, 215, 90)), "P": ("Pip", (255, 140, 170)),
         "Y": ("You", (130, 225, 145))}
VOICES = {"R": "bm_george", "K": "af_sky", "P": "af_nicole", "Y": "am_adam"}

Y, R, K, P = "you", "elder", "kid", "cousin"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Behind the school, there's one empty yard. And money to build just one thing.", [R, Y], "react",
          ["🏫", "💵"], "think", set="yard", exprs={0: "think"}),
        S("N", "Bo's class has been learning where food comes from. Some families nearby rarely get fresh vegetables.",
          [K], "react", ["🥕", "🍅"], "think", set="library", you=0),
        S("K", "We could grow our own! Tomatoes, beans, everything!", [K, Y], "say", ["🌱", "🍅"], "happy",
          cont=True, set="library", voiced=True, spk_smile=0.8, hold=True),
        S("N", "Meanwhile, Pip and the younger kids spend recess squeezed onto a strip of concrete. Nowhere safe to run.",
          [P], "react", ["⚽", "🧱"], "worried", set="yard", you=0),
        S("P", "Can we please have somewhere to play?", [P, Y], "say", ["⚽", "🙏"], "think", cont=True, set="yard",
          voiced=True, spk_expr="worried", hold=True),
        S("N", "At the committee meeting, the vote is tied.", [R, Y], "react", ["🗳️", "⚖️"], "think", set="hall",
          exprs={0: "think"}),
        S("R", "You decide.", [R, Y], "say", ["👉"], "worried", cont=True, set="hall", voiced=True,
          spk_expr="think", hold=True),
        S("N", "Food or play. Both for the same kids. So... what do you do?", [Y], "think", ["🌱", "⚽", "❓"],
          set="hall"),
        # ---------------- choice A
        CARD("N", "Choice A. You make a garden.", "CHOICE A", "MAKE A GARDEN", "🌱"),
        S("N", "Kids in gloves, planting seeds. Bo waters every morning before class.", [K, Y], "react",
          ["🌱", "💧"], "happy", set="yard", exprs={0: "happy"},
          ground=[("🌱", -330, 0), ("🍅", -250, 0), ("🌱", 260, 0), ("🌱", 340, 0)]),
        S("N", "Harvest day. Bo carries a bag of tomatoes home, beaming.", [K], "react", ["🍅", "🛍️"], "happy",
          set="yard", you=0, ground=[("🌱", -330, 0), ("🍅", -250, 0), ("🌱", 260, 0), ("🌱", 340, 0)]),
        S("K", "My family's making sauce tonight!", [K, Y], "say", ["🍝"], "happy", cont=True, set="yard", ground=[("🌱", -330, 0), ("🍅", -250, 0), ("🌱", 260, 0), ("🌱", 340, 0)],
          voiced=True, spk_smile=0.9, hold=True),
        S("N", "Pip helps Bo water. Then kicks a ball against the wall, on the same strip of concrete.", [P],
          "react", ["💧", "⚽", "🧱"], "think", set="yard", you=0, ground=[("🌱", -330, 0), ("🍅", -250, 0), ("🌱", 260, 0), ("🌱", 340, 0)]),
        S("N", "A teacher calls out: \"Careful, not near the plants!\"", [P], "react", ["🌱", "⚠️"], "worried",
          cont=True, set="yard", you=0, hold=True, ground=[("🌱", -330, 0), ("🍅", -250, 0), ("🌱", 260, 0), ("🌱", 340, 0)]),
        S("P", "Can we play here someday?", [P, K], "say", ["⚽", "❓"], "think", set="yard", ground=[("🌱", -330, 0), ("🍅", -250, 0), ("🌱", 260, 0), ("🌱", 340, 0)], voiced=True,
          spk_expr="worried", at=0.6),
        S("K", "Maybe next year.", [P, K], "say", ["🤷"], "think", cont=True, set="yard", ground=[("🌱", -330, 0), ("🍅", -250, 0), ("🌱", 260, 0), ("🌱", 340, 0)], speaker=1, you=0,
          voiced=True, spk_expr="think", hold=True),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You make a play space.", "CHOICE B", "MAKE A PLAY SPACE", "⚽",
             color=(0.36, 0.80, 0.72)),
        S("N", "New lines painted. A soft field. Goals.", [P, Y], "react", ["🥅", "⚽"], "happy", set="field",
          exprs={0: "happy"}),
        S("N", "Pip's whole class plays together, for the first time. Even the shy kids get picked for teams.",
          [P, Y], "react", ["⚽", "🙋"], "happy", set="field", exprs={0: "happy"}),
        S("N", "Bo's seed packets sit in a drawer.", [K], "react", ["🌱", "🗄️"], "sad", set="library", you=0),
        S("N", "The garden lesson moves to a few pots on a windowsill.", [K, Y], "react", ["🪴", "🪟"], "think",
          set="library", exprs={0: "sad"}),
        S("N", "Weeks later, Bo shows you one small tomato.", [K, Y], "see", ["🍅"], "happy", set="library",
          you=0, at=0.5),
        S("K", "It grew.", [K, Y], "see", ["🍅"], "happy", cont=True, set="library", you=0, hold=True),
        S("N", "Outside, Pip scores.", [P], "react", ["⚽"], "think", set="field", you=0),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you make a garden for growing food, or make a play space for everyone?"),
        M("What would you do?", close=True),
    ]
