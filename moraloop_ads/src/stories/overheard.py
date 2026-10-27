"""Long-form episode 7: "Overheard" (from short 23_the_promotion).
You and a work friend are up for the same promotion, and you overhear that they might move abroad.
Cast: you = "you" (green), Taylor = "coworker" (your work friend), Morgan = "boss", your family = "elder".
"""
TITLE = "Overheard"
NAMES = {"T": ("Taylor", (235, 225, 200)), "G": ("Morgan", (200, 205, 215)), "Y": ("You", (130, 225, 145))}
VOICES = {"T": "am_puck", "G": "am_eric", "Y": "am_adam"}

Y, T, G, E = "you", "coworker", "boss", "elder"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You and Taylor are both up for team lead. You eat lunch together most days, and cheer each other on.",
          [T, Y], "laugh", ["🥪", "😂"], "laugh", set="office"),
        S("G", "Whoever leads has to stay at least two years. The team needs stability.", [G, Y], "say",
          ["📅", "👥"], "think", set="office", voiced=True, spk_expr="think", at=0.6),
        S("N", "Then, in the break room, you overhear Taylor on the phone.", [T, Y], "react", ["📱", "👂"], "shock",
          set="hall", xs=[-220, 200], face={0: -1.0}, at=0.6),
        S("T", "If my partner's transfer comes through, we'll move abroad next year.", [T, Y], "tell", ["✈️", "🌍"],
          "shock", cont=True, set="hall", xs=[-220, 200], face={0: -1.0}, voiced=True, spk_expr="think",
          hold=True),
        S("N", "Taylor hasn't told anyone. It might not even happen.", [Y], "think", ["🤐", "❓"], set="hall"),
        S("G", "You know the team well. Anything that should factor into this?", [G, Y], "say", ["📋", "❓"],
          "worried", set="office", voiced=True, spk_smile=0.2, at=0.6),
        S("N", "What you heard is true. It might matter to the team. And it isn't public. So... what do you do?",
          [Y], "think", ["✈️", "💼", "❓"], set="office"),
        # ---------------- choice A
        CARD("N", "Choice A. You tell your boss.", "CHOICE A", "TELL YOUR BOSS", "🗣️"),
        S("Y", "I heard Taylor might be moving next year. I thought you'd want to know.", [Y, G], "say", ["✈️"],
          "think", set="office", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.6),
        S("N", "Morgan writes something down.", [Y, G], "react", ["📝"], "think", cont=True, set="office",
          you=1, exprs={0: "worried"}, hold=True),
        S("G", "Congratulations. The team's in good hands.", [G, Y], "say", ["🎉"], "happy", set="office",
          voiced=True, spk_smile=0.7, at=0.6),
        S("N", "Your family takes you out to celebrate.", [E, Y], "react", ["🎉", "📈"],
          "happy", set="dinner", exprs={0: "happy"}),
        S("T", "Morgan asked about my move. I hadn't told anyone but family.", [T, Y], "say", ["✈️", "❓"],
          "worried", set="cafe", voiced=True, spk_expr="sad", at=0.6),
        S("N", "A long silence.", [T, Y], "react", ["🤐"], "sad", cont=True, set="cafe", exprs={0: "sad"},
          hold=True),
        S("N", "At the lead's desk, the lunch seat across from you stays empty.", [Y], "think", ["🪑", "💼"],
          set="office"),
        S("N", "You earned the job. You're just not sure how you got it.", [Y], "think", ["💼", "❓"], cont=True,
          set="office", hold=True),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You stay quiet.", "CHOICE B", "STAY QUIET", "🤐",
             color=(0.36, 0.80, 0.72)),
        S("Y", "Nothing I can think of.", [Y, G], "say", ["🤐"], "think", set="office", speaker=0, you=1,
          voiced=True, spk_expr="think", at=0.6),
        S("N", "It feels fair. And it stings.", [Y], "think", ["⚖️", "😣"], set="office"),
        S("N", "Taylor gets the promotion. You congratulate them, and mean most of it.", [T, Y], "react",
          ["🎉", "🤝"], "think", set="office", exprs={0: "happy"}),
        S("T", "Thanks. I mean it.", [T, Y], "say", ["🤝"], "think", cont=True, set="office",
          voiced=True, spk_smile=0.5, hold=True),
        S("N", "Eight months later, Taylor announces the move. The team scrambles, just like Morgan feared.", [T, G],
          "react", ["✈️", "🌍"], "worried", set="office", exprs={0: "worried"}, at=0.6),
        S("N", "Morgan looks at the open lead role... then at you.", [G, Y], "react", ["💼", "👀"], "think",
          set="office", exprs={0: "think"}),
        S("T", "You were the best part of this job.", [T, Y], "say", ["🤗"], "happy", set="hall", voiced=True,
          spk_smile=0.7, at=0.6),
        S("N", "You might get the role now. Or you might not.", [T, Y], "react", ["✈️", "❓"], "think",
          set="hall", exprs={0: "think"}),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Stay quiet? It’s fair. Tell your boss? You likely win."),
        M("What would you do?", close=True),
    ]
