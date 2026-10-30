"""Loop long-form episode 13: "Word Gets Around" (from short 31_the_rumor).
A rumor says you copied your science project. You find out who passed it on.
Cast: you = "you" (green), Rowan = "friend2" (yellow, a classmate), Lee = "friend" (orange, your friend).
"""
TITLE = "Word Gets Around"
NAMES = {"R": ("Rowan", (255, 215, 90)), "L": ("Lee", (255, 170, 80)), "Y": ("You", (130, 225, 145))}
VOICES = {"R": "af_kore", "L": "am_liam", "Y": "am_adam"}

Y, R, L = "you", "friend2", "friend"

# loop layers (see loop_ad.py): Rowan's messages, forwarded to you
LOOP = dict(
    hook="who said it first?",
    thread=dict(contact="Rowan", stamp="Tue 7:58 PM", msgs=[
        "heard about the science project?",
        "they copied the whole thing",
        "teacher's looking into it",
        "just saying what I heard",
        "idk who started",
    ]),
    cut_scene=2,  # the fast cut lands in "Then Lee sends you screenshots."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You spent six weeks on your science project. It won first place.", [Y], "react", ["🔬", "🥇"],
          "happy", set="hall"),
        S("N", "You stayed up late for weeks to finish it.", [Y], "react", ["🌙", "🔬"], "happy", cont=True,
          set="hall", hold=True),
        S("N", "Then the whispers start. People say you copied it.", [R, L, Y], "laugh", ["🗣️", "👂"], "shock",
          set="hall", exprs={0: "laugh", 1: "worried"}),
        S("N", "Even Lee, your lab partner, asks if it's true.", [L, Y], "react", ["❓", "🔬"], "worried", cont=True,
          set="hall", exprs={0: "worried"}, hold=True),
        S("N", "Then Lee sends you screenshots. The messages came from Rowan, a classmate.", [Y], "see", ["📱", "📸", "💬"],
          "shock", set="home_night"),
        S("L", "Post them. Everyone should know where it started.", [L, Y], "say", ["📱", "📢"], "worried",
          set="library", speaker=0, you=1, voiced=True, spk_expr="angry", at=0.5),
        S("N", "Your name is on the line. So is Rowan's. So... what do you do?", [Y], "think",
          ["📢", "⚖️", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You expose them.", "CHOICE A", "EXPOSE ROWAN", "📢"),
        S("N", "You post the screenshots in the class chat. This is where it started.", [Y], "see", ["📱", "📢"],
          "worried", set="home_night"),
        S("N", "By lunch, the rumor is dead. Two classmates apologize to you.", [L, Y], "react", ["🙏", "✅"],
          "happy", set="hall", exprs={0: "happy"}),
        S("R", "I only repeated what I heard! Now everyone thinks I started it.", [R, Y], "say", ["😟", "💬"],
          "sad", set="library", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "For a week, Rowan eats lunch alone. You're not sure how that feels.", [R], "react", ["🍱", "🪑"],
          "sad", set="hall", you=0),
        S("N", "Your teacher shakes your hand at the science fair.", [Y], "react",
          ["🥇", "🤝"], "happy", set="library"),
        S("N", "Your name is clear. Now Rowan's... is the one people whisper about.", [Y], "think", ["🗣️", "💭"],
          set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You let karma handle it.", "CHOICE B", "LET KARMA HANDLE IT", "🍃",
             color=(0.36, 0.80, 0.72)),
        S("N", "You keep the screenshots to yourself. You just keep doing your work.", [Y], "react", ["📱", "🔬"],
          "think", set="library"),
        S("N", "The teacher checks your drafts. There's nothing to find. Case closed.", [Y], "react", ["📂", "✅"],
          "happy", set="library"),
        S("N", "But some classmates still give you looks in the hallway.", [L, R, Y], "react", ["👀", "🗣️"],
          "worried", set="hall", exprs={0: "worried", 1: "neutral"}),
        S("R", "Lee told me you had the screenshots. Thanks for not posting them.", [R, Y], "say", ["🙏"],
          "think", set="library", speaker=0, you=1, voiced=True, spk_smile=0.3, at=0.5),
        S("N", "A month later, a new rumor goes around. About someone else.", [Y], "see", ["📱", "🗣️"],
          "worried", set="home_night"),
        S("N", "You kept the peace. But for some people, the story never fully went away.", [Y], "think",
          ["🍃", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch who said it first?"),
        M("Two choices. Two very different endings."),
        M("Do you expose them... or let karma handle it?"),
        M("What would you do?", close=True),
    ]
