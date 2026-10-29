"""Long-form episode 12: "Moving Day" (from short 06_the_missing_deposit).
The day before you sign a lease together, your partner says their half of the deposit went to their sibling.
Cast: you = "you" (green), Sam = "partner" (purple), Jo = "sibling" (Sam's younger sibling).
"""
TITLE = "Moving Day"
NAMES = {"S": ("Sam", (205, 160, 255)), "J": ("Jo", (120, 165, 255)), "Y": ("You", (130, 225, 145))}
VOICES = {"S": "af_heart", "J": "am_puck", "Y": "am_adam"}

Y, S2, J = "you", "partner", "sibling"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You and Sam found the apartment. The one with the balcony.", [S2, Y], "react", ["🏠", "🌅"],
          "happy", set="home", exprs={0: "happy"}),
        S("N", "The lease gets signed Saturday. The deposit, split in half.", [S2, Y], "react", ["📝", "💵"],
          "happy", cont=True, set="home", exprs={0: "happy"}, hold=True),
        S("N", "Then, Friday night, Sam sits you down.", [S2, Y], "react", ["🛋️"], "think", set="home_night",
          exprs={0: "worried"}),
        S("S", "My half is gone. I gave it to Jo. Jo was about to be evicted.", [S2, Y], "tell", ["💵", "🏚️"],
          "shock", cont=True, set="home_night", voiced=True, spk_expr="worried", hold=True),
        S("J", "I'll pay Sam back. I just needed a month.", [J, Y], "say", ["🙏"], "think", set="cafe",
          voiced=True, spk_expr="sad", at=0.6),
        S("S", "I'll pay you back in three months. I promise.", [S2, Y], "say", ["🤞"], "think", set="home_night",
          voiced=True, spk_expr="worried", at=0.6),
        S("N", "You have enough savings to cover it. Just barely. And the landlord has three other couples waiting. So... what do you do?",
          [Y], "think", ["💰", "⏳", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You delay the move.", "CHOICE A", "DELAY THE MOVE", "⏳"),
        S("Y", "Let's wait until we can both pay our half.", [Y, S2], "say", ["⚖️"], "sad", set="home", speaker=0,
          you=1, voiced=True, spk_expr="think", at=0.6),
        S("N", "Sam nods... but looks stung.", [Y, S2], "react", ["😔"], "sad", cont=True, set="home", you=1,
          hold=True),
        S("S", "I was just trying to help my family.", [S2, Y], "say", ["👨‍👩‍👧"], "sad", set="home", voiced=True,
          spk_expr="sad", at=0.6),
        S("N", "The balcony apartment goes to someone else. Three more months in separate places.", [Y], "see",
          ["📱", "🏠", "❌"], "sad", set="home_night", at=0.6),
        S("N", "Sam saves every paycheck. Jo pays back part of it.", [S2], "react", ["💵", "📈"], "think",
          set="home", you=0),
        S("N", "Then, a smaller place. No balcony.", [S2, Y], "react", ["📦", "🏠"], "think", set="moving",
          exprs={0: "think"}),
        S("S", "It's not the one we wanted.", [S2, Y], "say", [], "think", cont=True, set="moving", voiced=True,
          spk_expr="think", hold=True),
        S("Y", "But it's half and half.", [S2, Y], "say", ["⚖️"], "think", cont=True, set="moving", speaker=1,
          you=0, voiced=True, spk_smile=0.4, hold=True),
        S("N", "You both smile. A little tired. Neither of you mentions the balcony.", [S2, Y], "react", ["🤝", "🙂"], "think", cont=True, set="moving",
          exprs={0: "happy"}, hold=True),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You cover the gap once.", "CHOICE B", "COVER THE GAP ONCE", "💵",
             color=(0.36, 0.80, 0.72)),
        S("N", "You pay the full deposit.", [Y], "see", ["💵", "✅"], "think", set="home", at=0.5),
        S("N", "Keys. Boxes. Pizza at sunset.", [S2, Y], "laugh", ["🍕", "🌅"], "laugh",
          set="moving"),
        S("S", "Our place. I still can't believe it.", [S2, Y], "say", ["🏠", "❤️"], "happy", cont=True,
          set="moving", voiced=True, spk_smile=0.9, hold=True),
        S("N", "Sam pays you back slowly. Your savings account looks very empty.", [Y], "see", ["📱", "🏦"],
          "worried", set="home", at=0.5),
        S("N", "One evening, Sam's phone lights up. A message from Jo: \"Thanks again, you're a lifesaver.\"",
          [S2, Y], "see", ["📱", "💬"], "think", set="home_night", you=0, exprs={1: "think"}, at=0.6),
        S("N", "You don't ask. Not yet.", [S2, Y], "see", ["📱", "🤐"], "think", cont=True, set="home_night",
          you=0, exprs={1: "think"}, hold=True),
        S("N", "That night, Sam reaches for your hand. You take it... and glance at the phone.", [S2, Y],
          "react", ["🤝", "📱"], "think", set="home_night", exprs={0: "happy"}),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you delay the move, or cover the gap once?"),
        M("What would you do?", close=True),
    ]
