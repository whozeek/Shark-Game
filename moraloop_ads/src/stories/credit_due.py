"""Loop long-form episode 6: "Credit Due" (from short 13_the_team_project).
A teammate did little work on the fair project but wants their name on it, and promises to help next time.
Cast: you = "you" (green, team lead), Rory = "teammate" (blue), Ana = "friend2" (yellow), Ms. Park = "coach" (teacher).
"""
TITLE = "Credit Due"
NAMES = {"R": ("Rory", (120, 165, 255)), "A": ("Ana", (255, 215, 90)), "T": ("Ms. Park", (255, 120, 120)),
         "Y": ("You", (130, 225, 145))}
VOICES = {"R": "am_eric", "A": "af_jessica", "T": "af_sarah", "Y": "am_adam"}

Y, R, A, T = "you", "teammate", "friend2", "coach"

# loop layers (see loop_ad.py): the team's task list
LOOP = dict(
    hook="who didn't show up?",
    note=dict(title="Fair project tasks", lines=[
        "research: Ana + you",
        "model: you + Ana",
        "slides: Rory",
        "practice run: all",
        "(no-show)",
    ]),
    cut_scene=2,  # the fast cut lands in "You look at the task list."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You lead a team of three for the science fair. You, Ana... and Rory.", [A, R, Y], "react",
          ["🔬", "🏆"], "happy", set="library", exprs={0: "happy", 1: "neutral"}),
        S("N", "The top two teams go on to the state fair.", [A, R, Y], "react", ["🏆", "🚌"], "happy", cont=True,
          set="library", exprs={0: "happy", 1: "neutral"}, hold=True),
        S("N", "For four weeks, you and Ana stay late. Rory keeps texting that something came up at home.", [A, Y], "react", ["🌙", "🛠️"],
          "worried", set="library", exprs={0: "think"}),
        S("N", "The week it's due, you look at the task list.", [Y], "see", ["📝", "👀"], "think",
          set="home_night"),
        S("R", "Please put my name on it. Things were hard at home. I'll do double next time.", [R, Y], "say",
          ["📝", "🙏"], "worried", set="library", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("A", "We stayed late four weeks in a row. Rory came once.", [A, Y], "say", ["🌙", "4️⃣"], "sad",
          set="library", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("T", "Final names on the entry by Friday, please.", [T, Y], "say", ["📋", "⏰"], "neutral",
          set="library", speaker=0, you=1, voiced=True, spk_smile=0.2, at=0.5),
        S("N", "A second chance... or credit that matches the work? So... what do you do?", [Y], "think",
          ["🤝", "⚖️", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You give Rory credit this time.", "CHOICE A", "CREDIT RORY TOO", "🤝"),
        S("Y", "All three names go on it. Rory, next time you lead the model.", [R, Y], "say", ["📝"],
          "think", set="library", speaker=1, you=1, voiced=True, spk_expr="think", at=0.5),
        S("R", "Thank you. I won't forget this.", [R, Y], "say", ["🙏"], "happy", cont=True, set="library",
          speaker=0, you=1, voiced=True, spk_smile=0.5, hold=True),
        S("N", "Second place. Three names on the ribbon.", [A, R, Y], "react", ["🥈", "🎀"], "happy",
          set="hall", exprs={0: "neutral", 1: "happy"}),
        S("A", "Four weeks of late nights. The same ribbon as one visit.", [A, Y], "say", ["🎀", "🌙"], "sad",
          set="hall", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "On the next project, Rory shows up first. Every single time.", [R], "react", ["⏰", "💪"],
          "happy", set="library", you=0),
        S("N", "But Ana asks to join a different team.", [A], "react", ["🚶", "👋"], "sad", set="library",
          you=0),
        S("N", "Rory got a second chance. Ana is still counting the late nights.", [Y], "think", ["🎀", "💭"],
          set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You credit only those who helped.", "CHOICE B", "ONLY WHO HELPED",
             "⚖️", color=(0.36, 0.80, 0.72)),
        S("Y", "Only the names of the people who did the work. I'm sorry, Rory.", [R, Y], "say", ["📝"],
          "think", set="library", speaker=1, you=1, voiced=True, spk_expr="think", at=0.5),
        S("R", "You never asked why I wasn't there.", [R, Y], "say", ["🏠"], "sad", cont=True, set="library",
          speaker=0, you=1, voiced=True, spk_expr="sad", hold=True),
        S("N", "Second place. Two names on the ribbon.", [A, Y], "react", ["🥈", "🎀"], "happy", set="hall",
          exprs={0: "happy"}),
        S("A", "Thank you. That felt fair.", [A, Y], "say", ["🤝"], "happy", set="hall", speaker=0, you=1,
          voiced=True, spk_smile=0.5, at=0.5),
        S("N", "On the next project, everyone does their part from day one.", [A, Y], "react", ["📋", "✅"],
          "happy", set="library", exprs={0: "happy"}),
        S("N", "But Rory stops sitting with the group at lunch.", [R], "react", ["🍱", "🪑"], "sad",
          set="hall", you=0),
        S("N", "The credit matches the work. And Rory's seat at lunch... is still empty.", [Y], "think",
          ["⚖️", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch who didn't show up?"),
        M("Two choices. Two very different endings."),
        M("Do you give them credit this time, or credit only those who helped?"),
        M("What would you do?", close=True),
    ]
