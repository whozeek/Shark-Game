"""Long-form episode 6: "The Offer Letter" (from short 45_your_dream_or_your_family).
A dream job across the country, or staying with the grandparent and little brother who rely on you.
Cast: you = "you" (green), Rae = "elder" (your grandparent), Milo = "kid" (your little brother), Sasha = "friend".
"""
TITLE = "The Offer Letter"
NAMES = {"R": ("Rae", (240, 175, 190)), "K": ("Milo", (255, 215, 90)), "S": ("Sasha", (255, 170, 80)),
         "C": ("Studio lead", (235, 225, 200)),
         "Y": ("You", (130, 225, 145))}
VOICES = {"R": "bf_emma", "K": "af_sky", "S": "am_liam", "C": "af_nicole", "Y": "am_adam"}

Y, R, K, F, C = "you", "elder", "kid", "friend", "coworker"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You've drawn since you were six.", [Y], "see", ["✏️", "🎨"], "happy", set="home", at=0.5),
        S("N", "Then an email arrives. A studio across the country wants you. The answer is due Friday.", [Y],
          "see", ["📧", "🎨", "📅"], "shock", set="home", at=0.6),
        S("N", "Since your parents started working nights, you take Milo to practice... and eat dinner with Rae.",
          [K, R, Y], "react", ["⚽", "🍲"], "happy", set="dinner", exprs={0: "happy", 1: "happy"}),
        S("K", "Who'll come to my games?", [K, Y], "say", ["⚽", "❓"], "sad", set="dinner", voiced=True,
          spk_expr="worried", at=0.6),
        S("R", "Go. We'll be fine.", [R, Y], "say", ["💛"], "think", set="dinner", voiced=True, spk_expr="sad",
          spk_smile=0.3, at=0.6),
        S("S", "Chances like this don't come twice. But you're the glue in that house.", [F, Y], "say",
          ["🚀", "🏠"], "think", set="cafe", voiced=True, spk_smile=0.3, at=0.6),
        S("N", "Friday is coming. So... what do you do?", [Y], "think", ["🎨", "🏠", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You chase your dream.", "CHOICE A", "CHASE YOUR DREAM", "🎨"),
        S("N", "Moving boxes. A long hug with Rae. Milo waving from the porch.", [K, R, Y], "react", ["📦", "👋"],
          "sad", set="moving", exprs={0: "sad", 1: "think"}),
        S("N", "First week at the studio, your sketch goes up on the big screen. You've never felt this alive.",
          [C, Y], "react", ["🎨", "🖥️", "✨"], "happy", set="office", exprs={0: "happy"}),
        S("C", "Welcome to the team. We've been waiting for someone like you.", [C, Y], "say", ["🤝"], "happy",
          cont=True, set="office", voiced=True, spk_smile=0.8, hold=True),
        S("N", "Rae calls every Sunday: we're so proud of you. But the calls get shorter.", [Y], "see", ["📱", "⏳"], "think", set="home_night", at=0.5),
        S("N", "Milo scores his first goal. You watch it on a shaky phone video.", [Y], "see", ["📱", "⚽"],
          "think", set="home_night", at=0.5),
        S("K", "Will you be home for winter?", [Y], "see", ["📱", "❄️"], "worried", set="home_night", at=0.5),
        S("Y", "I'll try.", [Y], "see", ["📱", "❄️"], "think", cont=True, set="home_night", hold=True),
        S("N", "City lights out the window. A dream job... and a quieter house back home.", [Y], "think",
          ["🌃", "🏠"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You stay for them.", "CHOICE B", "STAY FOR THEM", "🏠",
             color=(0.36, 0.80, 0.72)),
        S("N", "You type: Thank you, but I can't. The send button takes a long time to press.", [Y], "see",
          ["💻", "✉️"], "sad", set="home", at=0.6),
        S("N", "Saturday games. You cheer for Milo from the sideline.", [K, Y], "react", ["⚽", "📣"], "happy",
          set="field", exprs={0: "happy"}),
        S("N", "Weeknight dinners with Rae, who laughs more now.", [R, Y], "laugh", ["🍲", "😂"], "laugh",
          set="dinner"),
        S("R", "I'm glad you're here. I just hope you are too.", [R, Y], "say", ["💛"], "think", set="dinner",
          voiced=True, spk_smile=0.5, at=0.6),
        S("N", "You take a local job. Most nights, you're too tired to draw.", [Y], "see", ["✏️", "🌙"], "think", set="home_night",
          at=0.5),
        S("N", "Months later, the studio releases the project you would have worked on.", [Y], "see",
          ["📱", "🎬"], "think", set="home", at=0.6),
        S("K", "I want to be like you.", [K, Y], "give", ["🖼️", "❤️"], "happy", set="home", voiced=True,
          spk_smile=0.8, at=0.6),
        S("N", "You smile... and open the studio's trailer one more time.", [Y], "see", ["📱", "🎬"], "think",
          set="home", at=0.5),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you chase your dream, or stay for them?"),
        M("What would you do?", close=True),
    ]
