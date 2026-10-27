"""Loop long-form episode 2: "Swap Night" (from short 03_the_phone_swap).
Your partner wants to swap unlocked phones, but yours holds a friend's secret that isn't yours to share.
Cast: you = "you" (green), Sky = "partner" (purple), Rae = "friend2" (yellow, your friend).
"""
TITLE = "Swap Night"
NAMES = {"P": ("Sky", (205, 160, 255)), "R": ("Rae", (255, 215, 90)), "Y": ("You", (130, 225, 145))}
VOICES = {"P": "af_sky", "R": "af_nova", "Y": "am_adam"}

Y, P, R = "you", "partner", "friend2"

# loop layers (see loop_ad.py): Rae's messages on your phone
LOOP = dict(
    hook="what did Rae ask you?",
    thread=dict(contact="Rae", stamp="Fri 9:40 PM", msgs=[
        "can I tell you something?",
        "you're the only one who knows.",
        "it changes a lot for me.",
        "I'll tell everyone soon.",
        "not yet, ok?",
    ]),
    cut_scene=2,  # the fast cut lands in "But your phone holds Rae's messages."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You and Sky have been together a year. Tonight is date night.", [P, Y], "react", ["🍝", "❤️"],
          "happy", set="dinner", exprs={0: "happy"}),
        S("P", "Let's swap phones. Unlocked. No secrets. I'll go first.", [P, Y], "give", ["📱", "🔓"], "worried",
          set="dinner", speaker=0, you=1, voiced=True, spk_smile=0.5, at=0.5),
        S("N", "But your phone holds Rae's messages. Last week, Rae told you something big.", [Y], "see",
          ["📱", "🤫", "💬"], "worried", set="dinner"),
        S("R", "I haven't told anyone else. Not even my family. Not yet.", [R, Y], "tell", ["🤫"], "worried",
          set="cafe", voiced=True, spk_expr="worried", at=0.5),
        S("N", "Sky's phone is already on your side of the table. Sky is waiting.", [P, Y], "react", ["📱", "⏳"],
          "worried", set="dinner", exprs={0: "think"}),
        S("N", "Sky is asking for openness. Rae asked for privacy. So... what do you do?", [Y], "think",
          ["🔓", "🤫", "❓"], set="dinner"),
        # ---------------- choice A
        CARD("N", "Choice A. You talk instead.", "CHOICE A", "TALK, DON'T SWAP", "💬"),
        S("Y", "Ask me anything. I'll answer. But I can't hand over my phone tonight.", [P, Y], "say", ["💬"],
          "worried", set="dinner", speaker=1, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("P", "So there's something on it you don't want me to see?", [P, Y], "say", ["📱", "❓"], "sad",
          cont=True, set="dinner", speaker=0, you=1, voiced=True, spk_expr="sad", hold=True),
        S("N", "You talk until the restaurant closes. Sky learns things no phone could show.", [P, Y], "react",
          ["💬", "🕯️"], "happy", set="dinner", exprs={0: "happy"}),
        S("N", "But on the drive home, Sky goes quiet. The phone stays between you.", [P, Y], "react", ["🚗", "📱"],
          "worried", set="street", exprs={0: "think"}),
        S("R", "You kept it to yourself? Thank you. Really.", [R, Y], "say", ["🙏"], "happy", set="cafe",
          speaker=0, you=1, voiced=True, spk_smile=0.5, at=0.5),
        S("N", "Weeks later, Sky still glances over whenever your phone buzzes.", [P, Y], "react", ["📱", "👀"],
          "worried", set="home_night", exprs={0: "think"}),
        S("N", "Rae's secret is safe. Sky has your words... and is still getting used to the silence.", [Y], "think",
          ["🤫", "💬"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You offer a limited look.", "CHOICE B", "A LIMITED LOOK", "🔍",
             color=(0.36, 0.80, 0.72)),
        S("Y", "You can look at everything except one chat. It's Rae's, not mine.", [P, Y], "give", ["📱", "🔒"],
          "worried", set="dinner", speaker=1, you=1, voiced=True, spk_expr="think", at=0.5),
        S("P", "Okay. That's fair.", [P, Y], "say", ["🤝"], "happy", cont=True, set="dinner", speaker=0, you=1,
          voiced=True, spk_smile=0.6, hold=True),
        S("N", "Sky scrolls, laughs at your photos, and hands it back. Something between you relaxes.", [P, Y],
          "laugh", ["📱", "😂"], "happy", set="dinner", exprs={0: "happy"}),
        S("N", "But Sky saw the name on the locked chat. Rae.", [P], "think", ["🔒", "💭"], "think",
          set="home_night", you=0),
        S("P", "Rae's chat was locked. Is Rae okay?", [P, Y], "say", ["🔒", "❓"], "think", set="home_night",
          speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("R", "Sky asked me if I'm okay. What did Sky see?", [R, Y], "say", ["😟"], "worried", set="street",
          voiced=True, spk_expr="worried", at=0.5),
        S("N", "Sky trusts you more than ever. Rae is still deciding what to tell you next time.", [Y], "think",
          ["🔓", "🤫"], set="home_night"),
        # ---------------- the host
        M("Did you catch what Rae asked you?"),
        M("Two choices. Two very different endings."),
        M("Do you talk instead, or offer a limited look?"),
        M("What would you do?", close=True),
    ]
