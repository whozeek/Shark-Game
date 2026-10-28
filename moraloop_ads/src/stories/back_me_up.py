"""Long-form episode 8: "Back Me Up" (from short 22_the_lie).
Your friend cracks the neighbor's greenhouse window, says it was already broken, and the neighbor asks you.
Cast: you = "you" (green), Drew = "friend" (orange hoodie), Bea = "elder" (the neighbor), Sky = "friend2".
"""
TITLE = "Back Me Up"
NAMES = {"D": ("Drew", (255, 170, 80)), "B": ("Bea", (240, 175, 190)), "Y": ("You", (130, 225, 145))}
VOICES = {"D": "am_liam", "B": "bf_emma", "Y": "am_adam"}

Y, D, B, S2 = "you", "friend", "elder", "friend2"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You, Drew and Sky are playing catch, right next to Bea's greenhouse.", [D, S2, Y], "laugh",
          ["⚾", "😂"], "laugh", set="yard"),
        S("N", "Drew throws wild... and the greenhouse window cracks.", [D, S2, Y], "react", ["💥", "🪟"], "shock",
          set="yard", exprs={0: "shock", 1: "shock"}, at=0.5),
        S("N", "Drew is on thin ice at home. One more incident, and the summer trip Drew saved up for is cancelled.",
          [D], "react", ["✈️", "⚠️"], "worried", set="yard", you=0),
        S("B", "What happened out here?", [B, Y], "say", ["🪟", "❓"], "worried", set="yard", voiced=True,
          spk_expr="think", at=0.6),
        S("D", "It was already cracked when we got here.", [D, B], "say", ["🪟"], "think", set="yard", voiced=True,
          spk_expr="worried", at=0.6),
        S("B", "Is that true?", [B, Y], "say", ["❓"], "worried", set="yard", voiced=True, spk_expr="think", at=0.5),
        S("N", "Sky looks at the ground.", [S2, Y], "react", ["👀"], "worried", set="yard", exprs={0: "sad"}),
        S("N", "Bea has known you since you were little. And Drew is looking at you too. So... what do you do?",
          [Y], "think", ["👀", "🪟", "❓"], set="yard"),
        # ---------------- choice A
        CARD("N", "Choice A. You back them up.", "CHOICE A", "BACK THEM UP", "🤝"),
        S("Y", "Yeah. It was already like that.", [Y, B], "say", ["🪟"], "think", set="yard", speaker=0, you=1,
          voiced=True, spk_expr="worried", at=0.6),
        S("N", "Bea sighs, and goes inside.", [Y, B], "react", ["😮‍💨"], "think", cont=True, set="yard", you=1,
          exprs={0: "worried"}, hold=True),
        S("D", "I owe you. Seriously.", [D, Y], "say", ["🙏"], "happy", set="street", voiced=True, spk_smile=0.8,
          at=0.6),
        S("N", "Drew's trip is saved.", [D, Y], "react", ["✈️", "✅"], "happy", cont=True, set="street",
          exprs={0: "happy"}, hold=True),
        S("N", "That weekend, Bea pays for the new glass herself.", [B], "react", ["🪟", "💵"], "sad", set="yard",
          you=0),
        S("N", "A week later, Bea asks you to help fix the greenhouse.", [B, Y], "react", ["🪟", "🔧"], "neutral",
          set="yard", exprs={0: "happy"}),
        S("B", "I'm glad I can count on you.", [B, Y], "say", ["💛"], "think", cont=True, set="yard", voiced=True,
          spk_smile=0.6, hold=True),
        S("N", "You hand her the tape... and say nothing.", [B, Y], "react", ["🩹", "🤐"], "think", cont=True,
          set="yard", exprs={0: "happy"}, hold=True),
        S("N", "Then Drew sends you a photo from the trip: \"Wish you were here.\" You smile... and think of Bea's window.",
          [Y], "see", ["📱", "🏖️", "🪟"], "think", set="home", at=0.6),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You tell the truth.", "CHOICE B", "TELL THE TRUTH", "🗣️",
             color=(0.36, 0.80, 0.72)),
        S("Y", "It was us. I'm sorry.", [Y, B], "say", ["🙏"], "think", set="yard", speaker=0, you=1, voiced=True,
          spk_expr="sad", at=0.6),
        S("N", "Drew stares at you.", [D, Y], "react", ["😶"], "worried", cont=True, set="yard",
          exprs={0: "shock"}, hold=True),
        S("N", "Drew's parents find out... and the trip is cancelled.", [D], "react",
          ["✈️", "❌"], "sad", set="home", you=0),
        S("N", "You split the cost of the glass with Drew. It takes most of your savings.", [Y], "see",
          ["🪟", "💵"], "think", set="home", at=0.5),
        S("N", "Drew doesn't text for a week.", [Y], "see", ["📱", "🔇"], "sad", set="home_night", at=0.5),
        S("N", "You and Bea fix the greenhouse together. She makes you lemonade.", [B, Y], "react", ["🪟", "🍋"],
          "happy", set="yard", exprs={0: "happy"}),
        S("D", "You could've just said yes.", [D, Y], "say", ["⚾"], "think", set="park", voiced=True,
          spk_expr="sad", at=0.6),
        S("Y", "I know.", [D, Y], "say", [], "think", cont=True, set="park", speaker=1, you=0, voiced=True,
          spk_expr="think", hold=True),
        S("N", "You toss the ball. Drew catches it... still not smiling.", [D, Y], "react", ["⚾", "😐"], "think",
          set="park", exprs={0: "think"}),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you back them up… or tell the truth?"),
        M("What would you do?", close=True),
    ]
