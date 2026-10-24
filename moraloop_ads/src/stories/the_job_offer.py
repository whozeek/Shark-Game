"""Long-form episode 3: "The Job Offer" (from short 08_the_resume).
Your partner's new job, which saves your apartment, rests on a degree they never finished.
Cast: you = "you" (green), Casey = "partner" (purple), Morgan = "boss" (grey suit, the hiring manager).
"""
TITLE = "The Job Offer"
NAMES = {"C": ("Casey", (205, 160, 255)), "G": ("Morgan", (200, 205, 215)), "Y": ("You", (130, 225, 145))}
VOICES = {"C": "af_jessica", "G": "am_eric", "Y": "am_adam"}

Y, C, G = "you", "partner", "boss"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Your rent is going up. You have thirty days to cover it... or move out.", [Y], "see",
          ["📄", "💸", "⏳"], "worried", set="home", at=0.5),
        S("N", "Then your partner, Casey, gets a great job offer.", [C, Y], "react", ["💼", "🎉"], "happy",
          set="home", exprs={0: "happy"}),
        S("C", "They said yes! Takeout on the floor to celebrate?", [C, Y], "say", ["🥡", "🎉"], "happy",
          cont=True, set="home", voiced=True, spk_smile=0.9, hold=True),
        S("N", "Later, you glance at Casey's résumé on the laptop. It lists a degree Casey never finished. Two classes short.",
          [Y], "see", ["💻", "🎓", "❌"], "shock", set="home_night", at=0.6),
        S("C", "I can do this job. I've done it for years. I just needed them to look at me.", [C, Y], "say",
          ["💼", "🙏"], "think", set="home_night", voiced=True, spk_expr="worried", at=0.6),
        S("N", "Morgan, the hiring manager, picked Casey partly because of that degree.", [G], "react", ["🎓", "✅"],
          "neutral", set="office", you=0),
        S("N", "And without the job, you'll probably lose the apartment. So... what do you do?", [Y], "think",
          ["🏠", "🎓", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You expose the lie.", "CHOICE A", "EXPOSE THE LIE", "🗣️"),
        S("Y", "I can't pretend I didn't see it. Either we tell Morgan, or I'll have to.", [Y, C], "say", ["🗣️"],
          "worried", set="home_night", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.6),
        S("N", "The next morning, Casey goes to Morgan's office.", [C, G], "react", ["🏢"], "neutral", set="office",
          exprs={0: "worried"}),
        S("C", "I listed a degree I didn't finish. I'm sorry.", [C, G], "say", ["🎓", "🙏"], "think", cont=True,
          set="office", voiced=True, spk_expr="worried", hold=True),
        S("G", "I appreciate the honesty. I can't keep the offer. Finish those classes, and apply again.", [G, C],
          "say", ["📚", "🔁"], "sad", set="office", voiced=True, spk_expr="think", at=0.5),
        S("N", "Boxes. A smaller apartment across town. Casey signs up for the two classes.", [C, Y], "react",
          ["📦", "🏠", "📚"], "think", set="moving", exprs={0: "think"}),
        S("C", "We start over. With nothing to hide.", [C, Y], "say", ["🌱"], "happy", set="moving", voiced=True,
          spk_smile=0.5, at=0.6),
        S("N", "You squeeze hands... and both look at the stack of bills.", [C, Y], "react", ["🤝", "🧾"], "think",
          set="moving", exprs={0: "worried"}),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You keep quiet.", "CHOICE B", "KEEP QUIET", "🤐",
             color=(0.36, 0.80, 0.72)),
        S("N", "You say nothing. Casey starts on Monday... and is really good at the work.", [C, G], "react",
          ["💼", "⭐"], "happy", set="office", exprs={0: "happy"}),
        S("N", "The rent gets paid. You keep the apartment... and the balcony plants.", [C, Y], "react",
          ["🏠", "🪴"], "happy", set="home", exprs={0: "happy"}),
        S("G", "Great work, Casey. Would you mentor the new hires? Since you have the degree.", [G, C], "say",
          ["🎓", "👥"], "worried", set="office", voiced=True, spk_smile=0.6, at=0.75),
        S("N", "Casey nods... and doesn't answer.", [G, C], "react", ["🙂", "🤐"], "think", cont=True,
          set="office", exprs={0: "happy"}, hold=True),
        S("N", "That night, Casey tells you about the mentoring. Neither of you sleeps much.", [C, Y], "react",
          ["🎓", "🌙"], "think", set="home_night", exprs={0: "worried"}),
        S("C", "I'll fix it one day.", [C, Y], "say", ["🌙"], "think", cont=True, set="home_night", voiced=True,
          spk_expr="worried", hold=True),
        S("Y", "When?", [C, Y], "say", ["❓"], "think", cont=True, set="home_night", speaker=1, you=0, voiced=True,
          spk_expr="think", hold=True),
        S("N", "Late at night, the home is safe. The question isn't.", [C, Y], "react", ["🏠", "❓"], "think",
          set="home_night", exprs={0: "worried"}),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Would you expose the lie?"),
        M("What would you do?", close=True),
    ]
