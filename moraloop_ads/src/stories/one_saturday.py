"""Long-form episode 13: "One Saturday" (from short 34_who_do_you_help).
One car, one Saturday morning: help your oldest friend move, or drive a newcomer with no one to their job interview.
Cast: you = "you" (green), Mo = "friend" (orange hoodie), Ellis = "stranger" (new in town).
"""
TITLE = "One Saturday"
NAMES = {"O": ("Mo", (255, 170, 80)), "E": ("Ellis", (120, 215, 215)), "Y": ("You", (130, 225, 145))}
VOICES = {"O": "am_liam", "E": "am_onyx", "Y": "am_adam"}

Y, O, E = "you", "friend", "stranger"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Mo is your oldest friend. Mo helped you move twice, and sat with you in a waiting room all night.",
          [O, Y], "react", ["📦", "🏥"], "happy", set="home", exprs={0: "happy"}),
        S("O", "I'm moving Saturday morning. Can you help? I can't afford movers.", [O, Y], "say", ["📦", "🙏"],
          "think", cont=True, set="home", voiced=True, spk_expr="worried", hold=True),
        S("N", "Mo never asked for anything back. Until now.", [O, Y], "react", ["🤝"], "think", cont=True,
          set="home", exprs={0: "worried"}, hold=True),
        S("N", "At the library, you've been chatting with Ellis. Ellis just arrived in town, and knows nobody.",
          [E, Y], "react", ["📚", "👋"], "think", set="library", exprs={0: "happy"}),
        S("E", "I have a job interview Saturday morning, across the city. Could you drive me, and help me prepare? I don't have anyone else to ask.",
          [E, Y], "say", ["💼", "🚗"], "think", cont=True, set="library", voiced=True, spk_expr="worried",
          hold=True),
        S("N", "All week, Ellis has been practicing answers alone, at the library table.", [E], "react",
          ["💼", "📝"], "worried", set="library", you=0, exprs={0: "worried"}),
        S("N", "You have one car. And one morning. So... what do you do?", [Y], "think", ["🚗", "⏰", "❓"],
          set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You help Mo.", "CHOICE A", "THE ONE WHO ALWAYS HELPED YOU", "📦"),
        S("N", "Boxes. Laughs. A couch stuck in the doorway.", [O, Y], "laugh", ["📦", "🛋️"], "laugh",
          set="moving"),
        S("N", "Pizza on the floor of Mo's new place.", [O, Y], "react", ["🍕", "🏠"], "happy", set="moving",
          exprs={0: "happy"}),
        S("O", "I knew you'd show up.", [O, Y], "say", ["🤝"], "happy", cont=True, set="moving", voiced=True,
          spk_smile=0.8, hold=True),
        S("N", "Mo's move goes smoothly. Done by noon.", [O, Y], "react", ["✅", "🕛"], "happy", set="moving",
          exprs={0: "happy"}),
        S("N", "Across the city, Ellis takes two buses... and arrives late and flustered.", [E], "react",
          ["🚌", "⏰"], "worried", set="street", you=0),
        S("E", "Did my best.", [Y], "see", ["📱", "💬"], "think", set="moving", at=0.5),
        S("N", "A week later, Ellis texts: \"Still waiting to hear.\"", [Y], "see", ["📱", "⏳"], "think",
          set="home_night", at=0.5),
        S("N", "You type good luck... and wonder if a ride would have changed anything.", [Y], "think",
          ["📱", "🚗", "❓"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You help Ellis.", "CHOICE B", "THE ONE WHO NEVER HAD ANYONE", "💼",
             color=(0.36, 0.80, 0.72)),
        S("N", "Practice questions in the car. Ellis gets more confident with each answer.", [E, Y], "react",
          ["🚗", "💬"], "happy", set="street", exprs={0: "happy"}),
        S("E", "Thank you. Nobody's done that for me before.", [E, Y], "say", ["🙏"], "happy", set="office",
          voiced=True, spk_smile=0.8, at=0.6),
        S("N", "Ellis walks into the interview, standing tall.", [E], "react", ["💼", "✨"], "happy",
          set="office", you=0),
        S("N", "On the way home, Ellis saves your number as their first contact in town.", [E, Y], "react",
          ["📱", "🙂"], "happy", set="street", exprs={0: "happy"}),
        S("N", "Across town, Mo moves with fewer hands. It drags past dark. A box breaks.", [O], "react", ["📦", "💥"], "sad",
          set="moving", you=0),
        S("O", "It's fine. Done.", [Y], "see", ["📱", "💬"], "think", set="home", at=0.5),
        S("O", "Next time, okay?", [Y], "see", ["📱", "🤝"], "think", set="home_night", at=0.5),
        S("Y", "Yeah. Of course.", [Y], "see", ["📱"], "think", cont=True, set="home_night", hold=True),
        S("N", "Ellis is still waiting to hear back.", [Y], "think", ["📱", "⏳"], set="home_night"),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Who do you help?"),
        M("What would you do?", close=True),
    ]
