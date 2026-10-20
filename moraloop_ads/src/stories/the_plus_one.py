"""Long-form episode 1: "The Plus One" (from short 04_the_ex_plus_one).
Your partner's ex asks your partner to be their date at a family wedding for one night.
Cast: you = "you" (green), Avery = "partner" (purple), Jamie = "ex" (red).
"""
TITLE = "The Plus One"
NAMES = {"A": ("Avery", (205, 160, 255)), "J": ("Jamie", (255, 140, 140)), "Y": ("You", (130, 225, 145))}
VOICES = {"A": "af_bella", "J": "af_nova", "Y": "am_adam"}

Y, A, J = "you", "partner", "ex"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "This is Avery. Your partner of one year. Things are good.", [A, Y], "react", ["❤️", "🥰"], "happy",
          set="park", exprs={0: "happy"}),
        S("N", "And this is Jamie. Avery's ex. They dated years ago... and stayed friends.", [J, A, Y], "react",
          ["👋", "🙂"], "neutral", set="cafe", exprs={0: "happy", 1: "happy"}),
        S("J", "My sister's wedding is Saturday. We RSVP'd as a pair before we split. Just one evening?", [J, A],
          "say", ["💒", "💃"], "worried", set="cafe", speaker=0, you=1, voiced=True, spk_smile=0.3, at=0.6),
        S("J", "My grandma isn't well. She keeps asking about the two of us. I just don't want a scene.", [J, A],
          "say", ["👵", "🙏"], "worried", cont=True, set="cafe", speaker=0, you=1, voiced=True, spk_expr="worried",
          hold=True),
        S("N", "It's a small wedding. You're not invited.", [Y], "think", ["💌", "❌"], set="home"),
        S("A", "It means nothing. But it's your call.", [A, Y], "say", ["🤷"], "think", set="home", voiced=True,
          spk_smile=0.3, at=0.6),
        S("N", "You trust Avery. You also notice the knot in your stomach. So... what do you do?", [Y], "think",
          ["🤝", "🪢", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You say you're uncomfortable.", "CHOICE A", "SAY YOU'RE UNEASY", "🗣️"),
        S("Y", "I trust you. I just don't feel okay with it.", [Y, A], "say", ["💬"], "worried", set="home",
          speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("A", "Thank you for telling me. I'll let Jamie know.", [A, Y], "say", ["📱"], "happy", set="home",
          voiced=True, spk_smile=0.4, at=0.6),
        S("N", "Avery texts Jamie. The reply is one word. Okay.", [A], "see", ["📱", "👌"], "sad", set="home",
          you=0, at=0.6),
        S("N", "Saturday, Jamie goes to the wedding alone... and answers questions about Avery all night.", [J],
          "react", ["💒", "❓", "❓"], "worried", set="party", you=0, at=0.4),
        S("N", "Weeks pass. You and Avery feel closer. But the old group chat goes quiet.", [Y, A], "see", ["📱", "💬", "🔇"], "think",
          set="home_night", you=1, speaker=0, at=0.5),
        S("Y", "Do you miss Jamie?", [Y, A], "say", [], "sad", set="park", speaker=0, you=1, voiced=True,
          spk_expr="worried", at=0.5),
        S("A", "Sometimes. I'm glad you told me. I just hope Jamie's okay.", [A, Y], "say", ["💜", "📵"], "think",
          cont=True, set="park", voiced=True, spk_expr="sad", spk_smile=0.2, hold=True),
        S("N", "You feel heard. And Avery keeps glancing at a silent phone.", [A, Y], "react", ["❤️", "📵"],
          "think", set="park", exprs={0: "sad", 1: "happy"}),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You support the one-night plan.", "CHOICE B",
             "SUPPORT THE PLAN", "🤝", color=(0.36, 0.80, 0.72)),
        S("Y", "Go. Help Jamie out.", [Y, A], "say", ["💒"], "happy", set="home", speaker=0, you=1, voiced=True,
          spk_smile=0.5, at=0.5),
        S("A", "Thank you. Really.", [A, Y], "say", ["🤗"], "happy", cont=True, set="home", voiced=True,
          spk_smile=0.9, hold=True),
        S("N", "At the wedding, Jamie's family is all smiles. Grandma gets her photo.", [J, A], "react",
          ["👵", "📸", "💃"], "happy", set="party", exprs={0: "happy", 1: "happy"}),
        S("N", "Saturday night, you're home alone. Photos pop up: Avery and Jamie, dancing. The knot comes back.",
          [Y], "see", ["📱", "💃", "🪢"], "worried", set="home_night", at=0.6),
        S("A", "I came home early. Thank you for letting me go.", [A, Y], "say", ["🏠", "❤️"], "happy",
          set="home_night", voiced=True, spk_smile=0.7, at=0.5),
        S("N", "Then Jamie texts you: \"That meant a lot to my family.\"", [Y], "see", ["📱", "🙏"], "think",
          set="home", at=0.5),
        S("N", "Under one photo, a cousin comments: \"So happy you two are back together!\"", [Y], "see",
          ["📱", "💑", "❓"], "shock", set="home", at=0.7),
        S("N", "Avery promises to clear it up. You smile... and wonder where the line will be next time.", [A, Y],
          "react", ["🤝", "❓"], "think", set="home", exprs={0: "worried"}),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you say you’re uncomfortable, or support the one-night plan?"),
        M("What would you do?", close=True),
    ]
