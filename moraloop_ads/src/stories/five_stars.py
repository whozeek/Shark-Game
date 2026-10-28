"""Long-form episode 10: "Five Stars?" (from short 26_the_honest_review).
Your friend's new bakery needs reviews. The coffee is great; the cookies are dry.
Cast: you = "you" (green), Reese = "friend" (orange hoodie), Ash = "friend2", a customer = "stranger".
"""
TITLE = "Five Stars?"
NAMES = {"R": ("Reese", (255, 170, 80)), "A": ("Ash", (255, 215, 110)), "C": ("Customer", (120, 215, 215)),
         "Y": ("You", (130, 225, 145))}
VOICES = {"R": "am_liam", "A": "af_sarah", "C": "am_onyx", "Y": "am_adam"}

Y, R, A, C = "you", "friend", "friend2", "stranger"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Reese quit a steady job to open a tiny bakery. Opening week, the whole town is watching.", [R, Y],
          "react", ["🧁", "🏪"], "happy", set="store", exprs={0: "happy"}),
        S("R", "Reviews make or break new places. Will you write one?", [R, Y], "say", ["⭐", "🙏"], "happy",
          cont=True, set="store", voiced=True, spk_smile=0.7, hold=True),
        S("N", "You try the cookies. They're dry. But the coffee is great, and the staff is lovely.", [Y], "see",
          ["🍪", "☕"], "think", set="store", at=0.5),
        S("A", "Just give five stars. Friends support friends.", [A, Y], "say", ["⭐", "🤝"], "think", set="cafe",
          voiced=True, spk_smile=0.5, at=0.6),
        S("N", "You've always trusted reviews when deciding where to eat.", [Y], "think", ["⭐", "📱"],
          set="home_night"),
        S("N", "You open the review app... and stare at the stars. So... what do you do?", [Y], "see",
          ["📱", "⭐", "❓"], "think", set="home_night", at=0.5),
        # ---------------- choice A
        CARD("N", "Choice A. You post an honest review.", "CHOICE A", "HONEST REVIEW", "📝"),
        S("N", "Three stars. Lovely people, great coffee. Cookies were a bit dry.", [Y], "see", ["📱", "⭐"],
          "think", set="home_night", at=0.5),
        S("N", "Reese reads it... and goes quiet.", [R], "react", ["📱", "😶"], "sad", set="store", you=0),
        S("R", "I asked for help, not a grade.", [R, Y], "say", ["💬"], "sad", set="store", voiced=True,
          spk_expr="sad", at=0.6),
        S("Y", "I was trying to help.", [R, Y], "say", [], "worried", cont=True, set="store", speaker=1, you=0,
          voiced=True, spk_expr="worried", hold=True),
        S("N", "A slow week.", [R], "react", ["🏪", "📉"], "sad", set="store", you=0),
        S("C", "I came for the coffee. Because of a review.", [C, R], "say", ["☕", "⭐"], "think", set="store",
          voiced=True, spk_smile=0.6, at=0.6),
        S("N", "Reese starts testing new cookie recipes at night.", [R], "react", ["🍪", "🌙"], "think",
          set="store", you=0),
        S("N", "Then Reese slides a new cookie across the counter, without a word. You take a bite. Reese waits.",
          [R, Y], "react", ["🍪", "❓"], "think", set="store", exprs={0: "think"}),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You stay positive.", "CHOICE B", "STAY POSITIVE", "⭐",
             color=(0.36, 0.80, 0.72)),
        S("N", "Five stars. Best bakery in town!", [Y], "see", ["📱", "⭐"], "happy", set="home_night", at=0.5),
        S("N", "Reese hugs you over the counter.", [R, Y], "react", ["🤗", "⭐"], "happy", set="store",
          exprs={0: "happy"}),
        S("R", "This means so much. Thank you.", [R, Y], "say", ["💛"], "happy", cont=True, set="store",
          voiced=True, spk_smile=0.9, hold=True),
        S("N", "New customers come in. Some love it.", [C, R], "react", ["🧁", "😋"], "happy", set="store",
          exprs={0: "happy"}),
        S("N", "A few leave half-eaten cookies... and mixed reviews.", [R], "react", ["🍪", "📉"], "worried",
          set="store", you=0),
        S("N", "Reese reads the reviews, confused.", [R], "react", ["📱", "😕"], "think", set="store", you=0),
        S("R", "Your review said best bakery in town.", [R, Y], "say", ["📱", "❓"], "worried", set="store",
          voiced=True, spk_expr="think", at=0.6),
        S("R", "Be honest with me. Are they good?", [R, Y], "say", ["🍪", "❓"], "think", cont=True, set="store",
          voiced=True, spk_expr="sad", hold=True),
        S("N", "You open your mouth...", [R, Y], "react", ["🍪", "❓"], "think", cont=True, set="store",
          exprs={0: "think"}, hold=True),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you post an honest review… or protect their business and stay positive?"),
        M("What would you do?", close=True),
    ]
