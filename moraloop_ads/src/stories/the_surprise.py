"""Long-form episode 14: "The Surprise" (from short 21_the_birthday_plan).
A friend spent weeks planning a surprise party; the birthday friend just said they hate surprises.
Cast: you = "you" (green), Harper = "friend" (the birthday friend), Rio = "friend2" (the organizer).
"""
TITLE = "The Surprise"
NAMES = {"P": ("Harper", (255, 170, 80)), "R": ("Rio", (255, 215, 110)), "Y": ("You", (130, 225, 145))}
VOICES = {"P": "am_liam", "R": "af_sarah", "Y": "am_adam"}

Y, H, R = "you", "friend", "friend2"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Rio has spent three weeks, and real money, planning Harper's surprise party. Twenty friends. A cake. A playlist.",
          [R, Y], "react", ["🎂", "🎉"], "happy", set="home", exprs={0: "happy"}),
        S("N", "Two days before, at the café, Harper says...", [H, Y], "react", ["☕"], "think", set="cafe",
          exprs={0: "think"}),
        S("P", "Please, no fuss this year. I hate surprises. I just want a quiet day.", [H, Y], "say", ["🙏", "🤫"],
          "think", cont=True, set="cafe", voiced=True, spk_expr="think", hold=True),
        S("N", "But last year, Harper also said this...", [H, Y], "react", ["🎂"], "think", set="home",
          exprs={0: "sad"}),
        S("P", "Nobody ever makes an effort for me.", [H, Y], "say", ["💔"], "think", cont=True, set="home",
          voiced=True, spk_expr="sad", hold=True),
        S("N", "Then Rio texts you.", [Y], "see", ["📱", "🎉"], "think", set="home_night", at=0.5),
        S("R", "Harper is going to love this. Don't you dare spoil it.", [Y], "see", ["📱", "🤫"], "worried",
          cont=True, set="home_night", hold=True),
        S("N", "So... what do you do?", [Y], "think", ["🎉", "🤫", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You tell the group to change the plan.", "CHOICE A", "CHANGE THE PLAN", "🔁"),
        S("Y", "Rio... Harper told me they don't want a party.", [Y, R], "say", ["🎉", "❌"], "sad", set="cafe",
          speaker=0, you=1, voiced=True, spk_expr="worried", at=0.6),
        S("R", "Three weeks. And the deposits are non-refundable.", [R, Y], "say", ["💸"], "worried", set="cafe",
          voiced=True, spk_expr="sad", at=0.6),
        S("N", "The party turns into a small dinner at home. Harper is relaxed, and laughing.", [H, R, Y],
          "react", ["🍝", "😂"], "happy", set="dinner", exprs={0: "laugh", 1: "think"}),
        S("P", "This is nice. Quiet, like I asked.", [H, Y], "say", ["💛"], "happy", set="dinner",
          voiced=True, spk_smile=0.9, at=0.6),
        S("N", "Rio is quieter all night, eating cake that was meant for twenty.", [R], "react", ["🎂"], "sad",
          set="dinner", you=0),
        S("P", "Thank you for even thinking of it.", [H, R], "say", ["🤗"], "think", set="dinner", voiced=True,
          spk_smile=0.8, at=0.6),
        S("R", "You could have just let it happen.", [R, Y], "say", ["🎂"], "think", set="dinner", voiced=True,
          spk_expr="sad", at=0.6),
        S("N", "Rio smiles, a little thin. And Harper never knows how much was planned.", [R, Y], "react",
          ["🙂", "🎂"], "think", cont=True, set="dinner", exprs={0: "think"}, hold=True),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You keep the surprise.", "CHOICE B", "KEEP THE SURPRISE", "🎉",
             color=(0.36, 0.80, 0.72)),
        S("N", "Lights on. Twenty friends shout: \"Surprise!\"", [H, R, Y], "react", ["💡", "🎉"], "happy",
          set="party", exprs={0: "shock", 1: "happy"}, at=0.5),
        S("N", "Harper freezes... then forces a smile.", [H], "react", ["😬"], "worried", set="party", you=0),
        S("N", "Harper slips out to the yard for air. You follow.", [H, Y], "react", ["🌙"], "think", set="yard",
          exprs={0: "sad"}),
        S("P", "I told you I wanted quiet.", [H, Y], "say", ["🤫"], "sad", cont=True, set="yard", voiced=True,
          spk_expr="sad", hold=True),
        S("N", "Back inside, Harper sees the photo wall Rio made. Years of friendship. And tears up.", [H, R],
          "react", ["🖼️", "🥹"], "happy", set="party", exprs={0: "happy"}),
        S("P", "That was a lot. And... thank you. I think.", [H, Y], "say", ["🎉", "❓"], "think", set="party",
          voiced=True, spk_expr="think", at=0.6),
        S("N", "Rio is beaming. You're not sure which part Harper will remember.", [R, Y], "react", ["😁", "❓"],
          "think", set="party", exprs={0: "happy"}),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you tell the group to change the plan, or keep the surprise they worked hard on?"),
        M("What would you do?", close=True),
    ]
