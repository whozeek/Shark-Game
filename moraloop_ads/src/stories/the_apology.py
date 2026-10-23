"""Long-form episode 2: "The Apology" (from short 24_another_chance).
A former best friend who walked away from your shared food stall comes back with an apology.
Cast: you = "you" (green), Robin = "friend" (orange hoodie), Dana = "friend2" (yellow).
"""
TITLE = "The Apology"
NAMES = {"R": ("Robin", (255, 170, 80)), "D": ("Dana", (255, 215, 110)), "Y": ("You", (130, 225, 145))}
VOICES = {"R": "am_liam", "D": "af_sarah", "Y": "am_adam"}

Y, R, D = "you", "friend", "friend2"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Two years ago, you and your best friend Robin planned to open a food stall together.", [R, Y],
          "react", ["🍜", "🤝"], "happy", set="store", exprs={0: "happy"}),
        S("N", "A week before launch, Robin pulled out... and opened it with someone else. No explanation.", [Y],
          "react", ["🍜", "💔", "❓"], "shock", set="store", at=0.45),
        S("N", "It took you a long time to feel settled again. Dana helped.", [D, Y], "react", ["🫂", "🌱"], "happy",
          set="park", exprs={0: "happy"}),
        S("N", "Then today, at the café... Robin walks in.", [R, Y], "react", ["☕"], "shock", set="cafe", at=0.6),
        S("R", "I was scared, and I handled it badly. I'm sorry. I've changed. Can we try again?", [R, Y], "say",
          ["🙏", "🌱"], "worried", cont=True, set="cafe", voiced=True, spk_expr="worried", hold=True),
        S("D", "Whatever you decide, I'm here. You finally have your calm back.", [D, Y], "say", ["💛"], "think",
          set="home", voiced=True, spk_smile=0.4, at=0.6),
        S("N", "You miss Robin. You also remember how that week felt. So... what do you do?", [Y], "think",
          ["🤝", "💔", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You forgive Robin.", "CHOICE A", "FORGIVE", "🤝"),
        S("Y", "Okay. Let's try again.", [Y, R], "say", ["🤝"], "happy", set="cafe", speaker=0, you=1, voiced=True,
          spk_smile=0.4, at=0.5),
        S("N", "Coffee turns into hours. You laugh like you used to.", [R, Y], "laugh", ["☕", "😂"], "laugh",
          set="cafe"),
        S("N", "On a rainy Saturday, Robin shows up to help you carry a new couch.", [R, Y], "react", ["🌧️", "🛋️"],
          "happy", set="home", exprs={0: "happy"}),
        S("N", "Then Robin cancels plans at the last minute. It's small... but for a second, the old fear comes back.",
          [Y], "see", ["📱", "❌", "😕"], "worried", set="home_night", at=0.6),
        S("D", "I'm happy for you. I just see you less now.", [D, Y], "say", ["💛", "📅"], "think", set="park",
          voiced=True, spk_expr="think", spk_smile=0.2, at=0.6),
        S("Y", "Are we okay?", [R, Y], "say", [], "think", set="park", speaker=1, you=0, voiced=True,
          spk_expr="worried", at=0.5),
        S("R", "I think so.", [R, Y], "say", ["🙂"], "think", cont=True, set="park", voiced=True, spk_smile=0.4,
          hold=True),
        S("N", "You're glad Robin's back... and still a little on guard.", [R, Y], "react", ["🤝", "🛡️"], "think",
          set="park", exprs={0: "happy"}),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You protect your peace.", "CHOICE B", "PROTECT YOUR PEACE", "🕊️",
             color=(0.36, 0.80, 0.72)),
        S("Y", "I accept your apology. I'm just not ready to start over.", [Y, R], "say", ["🙏", "🚪"], "sad",
          set="cafe", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.6),
        S("R", "I understand.", [R, Y], "say", [], "think", cont=True, set="cafe", voiced=True, spk_expr="sad",
          hold=True),
        S("N", "Life stays steady. Game nights with Dana. A routine that feels good.", [D, Y], "laugh", ["🎲", "🍕"],
          "laugh", set="gamenight"),
        S("N", "But now and then, you still reach for your phone to text Robin... and put it down.", [Y], "see",
          ["📱", "💬", "🤔"], "think", set="home_night", at=0.6),
        S("N", "Months later, you walk past Robin's stall. It's busy. Robin waves. You wave back... and keep walking.", [R, Y], "react",
          ["🍜", "👋"], "think", set="store", exprs={0: "happy"}),
        S("D", "Do you ever wonder?", [D, Y], "say", ["❓"], "think", set="park", voiced=True, spk_smile=0.2,
          at=0.6),
        S("Y", "Sometimes.", [D, Y], "say", [], "think", cont=True, set="park", speaker=1, you=0, voiced=True,
          spk_expr="think", hold=True),
        S("N", "The door is open. You just haven't walked through it.", [D, Y], "react", ["🚪", "❓"], "think",
          set="park", exprs={0: "happy"}),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you forgive them… or protect your peace?"),
        M("What would you do?", close=True),
    ]
