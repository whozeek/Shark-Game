"""Loop long-form episode 14: "Ten Years Ago" (from short 36_the_old_online_post).
The host you booked for the town food fair is caught in a cruel post from ten years ago. They say they've changed.
Cast: you = "you" (green, fair organizer), Sol = "teammate" (blue, the host), Ines = "friend2" (yellow, a volunteer).
"""
TITLE = "Ten Years Ago"
NAMES = {"S": ("Sol", (120, 165, 255)), "I": ("Ines", (255, 215, 90)), "Y": ("You", (130, 225, 145))}
VOICES = {"S": "am_onyx", "I": "af_sarah", "Y": "am_adam"}

Y, SO, I = "you", "teammate", "friend2"

# loop layers (see loop_ad.py): a printout of the old post
LOOP = dict(
    hook="how old was the post?",
    note=dict(title="posted 10 years ago", lines=[
        "lol look at this kid",
        "who dresses like that??",
        "♥ 47",
        "found 2 days ago",
        "Sol, age 15",
    ]),
    cut_scene=1,  # the fast cut lands in "Then an old post resurfaces."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You run the town food fair. This year's host is Sol, a local baker everyone loves.", [SO, Y],
          "react", ["🥐", "🎪"], "happy", set="hall", exprs={0: "happy"}),
        S("N", "Then an old post resurfaces. Ten years old. Sol, mocking a kid's clothes.", [Y], "see",
          ["📱", "🕰️", "💬"], "shock", set="home_night"),
        S("I", "People are furious. Some vendors say they'll pull out if Sol hosts.", [I, Y], "say", ["📢", "🚫"],
          "worried", set="hall", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("S", "I was fifteen and cruel. I'm sorry. I've spent years trying to be better.", [SO, Y], "say",
          ["🙏", "💬"], "sad", set="cafe", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "Sol has volunteered at the fair for six years. The fair is in one week.", [SO], "react",
          ["🎪", "📅"], "worried", set="hall", you=0),
        S("N", "It's your call. So... what do you do?", [Y], "think", ["🤝", "⚖️", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You forgive them.", "CHOICE A", "FORGIVE SOL", "🤝"),
        S("Y", "You can host. And if you want, you can say something at the start.", [SO, Y], "say",
          ["🎤"], "think", set="cafe", speaker=1, you=1, voiced=True, spk_expr="think", at=0.5),
        S("N", "Opening day, Sol apologizes from the stage. Some people clap. Some walk away.", [SO],
          "react", ["🎤", "👏"], "worried", set="hall", you=0),
        S("N", "Three vendors pull out. Their tables stay empty all weekend.", [Y], "react", ["🪑", "🚫"], "sad",
          set="hall"),
        S("I", "I can't volunteer this year. It feels like it didn't matter.", [I, Y], "say", ["🚶"], "sad",
          set="street", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "That night, a teenager finds Sol. “Your apology helped me.”", [SO], "react", ["💬", "🌱"],
          "happy", set="hall", you=0),
        S("N", "Sol got a second chance. And those empty tables... are still on your mind.", [Y], "think",
          ["🤝", "💭"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You hold them accountable.", "CHOICE B", "HOLD SOL TO IT", "⚖️",
             color=(0.36, 0.80, 0.72)),
        S("Y", "I'm sorry, Sol. Not this year.", [SO, Y], "say", ["⚖️"], "sad", set="cafe", speaker=1,
          you=1, voiced=True, spk_expr="sad", at=0.5),
        S("S", "So ten years doesn't count for anything?", [SO, Y], "say", ["🕰️"], "sad", cont=True,
          set="cafe", speaker=0, you=1, voiced=True, spk_expr="sad", hold=True),
        S("N", "Every vendor stays. But the regulars keep asking where Sol is.", [I, Y], "react", ["🎪", "🎉"], "happy", set="hall",
          exprs={0: "happy"}),
        S("I", "Thank you for taking it seriously.", [I, Y], "say", ["🤝"], "happy", set="hall", speaker=0,
          you=1, voiced=True, spk_smile=0.4, at=0.5),
        S("N", "Sol stops posting. The bakery gets quieter.", [SO], "react", ["🥐", "🤐"], "sad",
          set="cafe", you=0),
        S("N", "Months later, Sol posts again: still learning. A few people reply. Most don't.", [Y], "see",
          ["📱", "🌱"], "think", set="home_night"),
        S("N", "The fair went on without Sol. And Sol is still waiting to find out when sorry is enough.", [Y], "think",
          ["⚖️", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch how old the post was?"),
        M("Two choices. Two very different endings."),
        M("Do you forgive them or hold them accountable forever?"),
        M("What would you do?", close=True),
    ]
