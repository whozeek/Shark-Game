"""Long-form episode 15: "No Filter" (from short 41_every_unfiltered_thought).
A make-believe clay bracelet makes whoever wears it say every thought they have about you, for one week.
Cast: you = "you" (green), Skyler = "partner" (purple), a street vendor = "stranger". Kept playful.
"""
TITLE = "No Filter"
NAMES = {"S": ("Skyler", (205, 160, 255)), "V": ("Vendor", (120, 215, 215)), "Y": ("You", (130, 225, 145))}
VOICES = {"S": "af_bella", "V": "bm_fable", "Y": "am_adam"}

Y, K, V = "you", "partner", "stranger"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You and Skyler have been together three years. Comfortable. Happy... mostly.", [K, Y], "react",
          ["❤️", "🛋️"], "happy", set="home", exprs={0: "happy"}),
        S("N", "Sometimes you wonder what Skyler really thinks.", [Y], "think", ["💭", "❓"], set="home"),
        S("V", "Whoever wears this says every thought they have about you. Out loud. No filter. One week.",
          [V, Y], "give", ["📿", "✨"], "think", set="street", voiced=True, spk_smile=0.6, at=0.5),
        S("N", "The vendor winks... and disappears into the crowd.", [Y], "see", ["📿", "✨"], "shock",
          set="street", at=0.5),
        S("N", "It's just a little clay bracelet. Probably.", [Y], "see", ["📿", "🤔"], "think", set="street",
          at=0.5),
        S("S", "Ha! I'll wear it if you want. Your call.", [K, Y], "say", ["📿"], "think", set="home", voiced=True,
          spk_smile=0.7, at=0.6),
        S("N", "You hold the bracelet over Skyler's wrist. So... what do you do?", [K, Y], "react", ["📿", "❓"],
          "think", set="home", exprs={0: "happy"}),
        # ---------------- choice A
        CARD("N", "Choice A. You turn it on.", "CHOICE A", "TURN IT ON", "📿"),
        S("S", "You look great today.", [K, Y], "say", ["📿", "✨"], "happy", set="home", voiced=True, spk_smile=0.8,
          at=0.5),
        S("S", "I love how you laugh at your own jokes.", [K, Y], "say", ["😂"], "happy", cont=True, set="home",
          voiced=True, spk_smile=0.8, hold=True),
        S("S", "Your pancakes are honestly the best part of my week.", [K, Y], "say", ["🥞"], "happy", cont=True,
          set="home", voiced=True, spk_smile=0.8, hold=True),
        S("S", "I wish you'd put your phone down at dinner.", [K, Y], "say", ["📱", "🍽️"], "worried",
          set="dinner", voiced=True, spk_expr="think", at=0.6),
        S("S", "Sometimes I miss having more time alone.", [K, Y], "say", ["🕰️"], "worried", cont=True,
          set="dinner", voiced=True, spk_expr="think", hold=True),
        S("S", "And that song you hum every morning? I don't love it.", [K, Y], "say", ["🎵"], "worried", cont=True,
          set="dinner", voiced=True, spk_smile=0.3, hold=True),
        S("N", "Late-night talks you've never had before. Some things get fixed. Some things can't be unheard.",
          [K, Y], "react", ["🌙", "💬"], "think", set="home_night", exprs={0: "think"}),
        S("N", "Day seven. The bracelet clicks off.", [K], "react", ["📿", "🔓"], "think", set="home", you=0),
        S("S", "Do you still want to know?", [K, Y], "say", ["❓"], "think", set="home", voiced=True,
          spk_smile=0.4, at=0.6),
        S("N", "You both laugh. Nervously.", [K, Y], "laugh", ["😅"], "laugh", cont=True, set="home", hold=True),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You leave it off.", "CHOICE B", "LEAVE IT OFF", "🗄️",
             color=(0.36, 0.80, 0.72)),
        S("N", "You drop the bracelet in a drawer.", [Y], "see", ["📿", "🗄️"], "think", set="home", at=0.5),
        S("N", "Skyler kisses your forehead.", [K, Y], "react", ["😘"], "happy", set="home", exprs={0: "happy"}),
        S("N", "Life stays gentle. Inside jokes. Little kindnesses.", [K, Y], "laugh", ["😂", "💛"], "laugh",
          set="dinner"),
        S("N", "What goes unsaid stays unsaid.", [K, Y], "react", ["🤐"], "think", cont=True, set="dinner",
          exprs={0: "happy"}, hold=True),
        S("N", "Skyler leaves you a sticky note: \"Have a good day.\" You smile.", [Y], "see", ["📝", "💛"],
          "happy", set="home", at=0.5),
        S("N", "Skyler laughs at your joke. You wonder if it was really that funny.", [K, Y], "laugh", ["😂", "🤔"],
          "think", set="dinner"),
        S("N", "Some nights, Skyler goes quiet... and you wonder what they're thinking.", [K, Y], "react",
          ["🌙", "💭"], "think", set="home_night", exprs={0: "think"}),
        S("S", "Hm? Oh... nothing.", [K, Y], "say", ["🙂"], "think", cont=True, set="home_night", voiced=True,
          spk_smile=0.3, hold=True),
        S("N", "You open the drawer. Look at the bracelet... and close it again.", [Y], "see", ["📿", "🗄️"],
          "think", set="home", at=0.5),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Would that honesty save the relationship or destroy it?"),
        M("What would you do?", close=True),
    ]
