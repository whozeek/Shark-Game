"""Loop long-form episode 5: "The Alibi" (from short 10_the_cover_story).
You always said you'd tell someone they're being cheated on. Then your best friend asks you to be their alibi.
Cast: you = "you" (green), Kai = "friend" (orange, your best friend), Lane = "partner" (purple, Kai's partner).
"""
TITLE = "The Alibi"
NAMES = {"K": ("Kai", (255, 170, 80)), "L": ("Lane", (205, 160, 255)), "Y": ("You", (130, 225, 145))}
VOICES = {"K": "am_puck", "L": "af_heart", "Y": "am_adam"}

Y, K, L = "you", "friend", "partner"

# loop layers (see loop_ad.py): Kai's texts to you
LOOP = dict(
    hook="what did Kai ask you?",
    thread=dict(contact="Kai", stamp="Sun 12:40 AM", msgs=[
        "hey. I need a favor.",
        "saturday we watched the game, ok?",
        "it's ending. this week.",
        "I'll tell Lane myself.",
        "I was with you.",
    ]),
    cut_scene=2,  # the fast cut lands in "That night, Kai texts you."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        M("You always said you’d tell someone they’re being cheated on."),
        S("N", "This is Kai, your best friend since school. And Lane, Kai's partner of three years.", [K, L, Y],
          "react", ["🤝", "❤️"], "happy", set="park", exprs={0: "happy", 1: "happy"}),
        S("N", "For years, you've had Sunday dinner at their place.", [K, L, Y], "react", ["🍝", "🏠"], "happy",
          cont=True, set="park", exprs={0: "happy", 1: "happy"}, hold=True),
        S("K", "I've been seeing someone else. I'm ending it. And I'll tell Lane myself. Just not yet.", [K, Y],
          "tell", ["🤫", "🙏"], "shock", set="cafe", voiced=True, spk_expr="worried", at=0.4),
        S("N", "That night, Kai texts you. Kai needs an alibi.", [Y], "see", ["📱", "🌙", "💬"], "worried",
          set="home_night"),
        S("L", "We're signing a lease next week! Kai said you two had a great Saturday.", [L, Y], "say",
          ["🏠", "🔑"], "happy", set="cafe", speaker=0, you=1, voiced=True, spk_smile=0.7, at=0.5),
        S("N", "Kai is your best friend. Lane is about to sign a lease. So... what do you do?", [Y], "think",
          ["🤝", "🏠", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You tell Lane.", "CHOICE A", "TELL LANE", "🗣️"),
        S("Y", "Lane... Kai wasn't with me on Saturday. Please talk to Kai before you sign.", [L, Y], "say",
          ["🏠", "💬"], "worried", set="cafe", speaker=1, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("L", "I think part of me already knew. Thank you.", [L, Y], "say", ["💔"], "sad", cont=True,
          set="cafe", speaker=0, you=1, voiced=True, spk_expr="sad", hold=True),
        S("N", "Lane doesn't sign the lease. Lane moves out of Kai's place that month.", [L], "react",
          ["🏠", "📦"], "sad", set="home", you=0),
        S("K", "I was telling Lane this week. You took that from me.", [K, Y], "say", ["💔"], "sad",
          set="street", voiced=True, spk_expr="angry", at=0.5),
        S("N", "Your best friend since school stops answering your calls.", [Y], "see", ["📱", "🚫"], "sad",
          set="home_night"),
        S("L", "I'm doing better. You were honest with me when it counted.", [L, Y], "say", ["🌱"], "happy",
          set="park", speaker=0, you=1, voiced=True, spk_smile=0.4, at=0.5),
        S("N", "Lane got the truth in time. And Kai's number... is still in your phone.", [Y], "think",
          ["📱", "💭"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You don't tell.", "CHOICE B", "DON'T TELL", "🤐",
             color=(0.36, 0.80, 0.72)),
        S("N", "Lane talks about the new place. You smile... and change the subject.", [L, Y], "react",
          ["🏠", "🤐"], "worried", set="cafe", exprs={0: "happy"}),
        S("K", "Thank you. I'll tell Lane myself. This week. I promise.", [K, Y], "say", ["🙏"], "worried",
          set="street", voiced=True, spk_smile=0.3, at=0.5),
        S("N", "And Kai does, before the lease. Lane hears it from Kai, face to face.", [K, L], "tell", ["💬"], "sad",
          set="home", exprs={1: "sad"}),
        S("L", "Kai said you knew. And you sat there while I talked about the lease.", [L, Y], "say", ["🏠", "💔"],
          "sad", set="cafe", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "Kai is still your best friend. Lane stops replying to your messages.", [Y], "see",
          ["📱", "🚫"], "sad", set="home_night"),
        S("N", "Kai told the truth in Kai's own way. Lane is still asking what else you knew.", [Y], "think",
          ["🤝", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch what Kai asked you?"),
        M("Two choices. Two very different endings."),
        M("Do you tell their partner?"),
        M("What would you do?", close=True),
    ]
