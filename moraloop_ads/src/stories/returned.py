"""Loop long-form episode 15: "Returned" (from short 46_returned_damaged).
A friend borrows your favorite headphones and returns them cracked, acting like it's no big deal.
Cast: you = "you" (green), Wren = "friend" (orange).
"""
TITLE = "Returned"
NAMES = {"W": ("Wren", (255, 170, 80)), "Y": ("You", (130, 225, 145))}
VOICES = {"W": "af_heart", "Y": "am_adam"}

Y, W = "you", "friend"

# loop layers (see loop_ad.py): Wren's texts when the headphones came back
LOOP = dict(
    hook="what did Wren text?",
    thread=dict(contact="Wren", stamp="Sun 6:20 PM", msgs=[
        "thanks for lending them!!",
        "they were perfect on the trip",
        "left them at your door",
        "case got a bit scuffed",
        "all good 👍",
    ]),
    cut_scene=2,  # the fast cut lands in "They come back with a crack. And a text."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You saved for three months to buy these headphones. They're your favorite thing.", [Y], "react",
          ["🎧", "💚"], "happy", set="home"),
        S("N", "They go everywhere with you. The bus. The gym. Every night before bed.", [Y], "react",
          ["🚌", "🏋️", "🌙"], "happy", cont=True, set="home", hold=True),
        S("W", "Can I borrow them for my trip? I'll be super careful!", [W, Y], "say", ["🎧", "✈️"], "happy",
          set="home", speaker=0, you=1, voiced=True, spk_smile=0.7, at=0.5),
        S("N", "A week later, they come back. With a crack across one side. And a text.", [Y], "see",
          ["🎧", "💥", "📱"], "shock", set="home_night"),
        S("N", "You put them on. The left side crackles now.", [Y], "react", ["🎧", "🔇"], "sad", set="home_night"),
        S("W", "Best trip ever! Thanks again. Those headphones were a lifesaver.", [W, Y], "say", ["✈️", "😄"],
          "happy", set="cafe", speaker=0, you=1, voiced=True, spk_smile=0.8, at=0.5),
        S("N", "Wren doesn't mention the crack. So... what do you do?", [Y], "think", ["🎧", "🤝", "❓"],
          set="cafe"),
        # ---------------- choice A
        CARD("N", "Choice A. You confront them.", "CHOICE A", "SAY SOMETHING", "🗣️"),
        S("Y", "Wren, they came back cracked. The left side crackles now.", [W, Y], "say", ["🎧", "💥"],
          "worried", set="cafe", speaker=1, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("W", "What? They seemed fine when I left them. I think.", [W, Y], "say", ["😟"], "worried", cont=True,
          set="cafe", speaker=0, you=1, voiced=True, spk_expr="worried", hold=True),
        S("N", "Wren offers to pay half. You say yes.", [W, Y], "give", ["💵", "🤝"], "think", set="cafe",
          exprs={0: "worried"}),
        S("N", "But the next few hangouts feel a little stiff.", [W, Y], "react", ["😶", "🍕"], "worried",
          set="park", exprs={0: "think"}),
        S("W", "I'm sorry. I should have checked them before I gave them back.", [W, Y], "say", ["🙏"], "sad",
          set="park", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "Now Wren asks twice before borrowing anything.", [W], "react", ["🙅", "📦"], "think",
          set="street", you=0),
        S("N", "You got half the cost back. And a friendship that's a little more careful.", [Y], "think",
          ["💵", "💭"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You let it go to keep the peace.", "CHOICE B", "LET IT GO", "🕊️",
             color=(0.36, 0.80, 0.72)),
        S("Y", "Glad you had fun!", [W, Y], "say", ["😊"], "think", set="cafe", speaker=1, you=1, voiced=True,
          spk_smile=0.3, at=0.5),
        S("N", "You keep using them. One side crackles.", [Y], "react", ["🎧", "🔇"], "worried",
          set="home_night"),
        S("N", "Your hangouts stay easy. Wren invites you on the next trip.", [W, Y], "laugh", ["✈️", "😄"],
          "happy", set="park", exprs={0: "happy"}),
        S("N", "No awkward talk. No money changing hands. Nothing changes between you.", [W, Y], "react",
          ["🤝", "😊"], "happy", set="park", exprs={0: "happy"}),
        S("N", "But every time you press play, you remember.", [Y], "react", ["🎧", "💭"], "sad", set="home"),
        S("W", "Hey, want to come to the beach next month?", [W, Y], "say", ["🏖️", "😄"], "happy", set="park",
          speaker=0, you=1, voiced=True, spk_smile=0.7, at=0.5),
        S("N", "The peace held. And the crack... is still there every time you press play.", [Y], "think",
          ["🕊️", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch what Wren texted?"),
        M("Two choices. Two very different endings."),
        M("Do you confront them, or let it go to keep the peace?"),
        M("What would you do?", close=True),
    ]
