"""Loop long-form episode 7: "Left Behind" (from short 14_the_private_message).
A friend leaves their phone with you and asks for privacy. Then another friend asks why no one is replying.
Cast: you = "you" (green), Nico = "friend" (orange, the phone's owner), Bea = "friend2" (yellow, the sender).
"""
TITLE = "Left Behind"
NAMES = {"C": ("Nico", (255, 170, 80)), "B": ("Bea", (255, 215, 90)), "Y": ("You", (130, 225, 145))}
VOICES = {"C": "am_liam", "B": "af_kore", "Y": "am_adam"}

Y, NI, B = "you", "friend", "friend2"

# loop layers (see loop_ad.py): Bea's messages on Nico's phone
LOOP = dict(
    hook="what did Bea send?",
    thread=dict(contact="Bea", stamp="Sat 6:15 PM", msgs=[
        "saw the photos from friday",
        "guess my invite got lost?",
        "it's fine. really.",
        "can we talk later?",
        "are you there?",
    ]),
    cut_scene=2,  # the fast cut lands in "Nico's phone lights up."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("C", "Don't read anything on my phone, okay? Some of it's private.", [NI, Y],
          "say", ["📱", "🤐"], "worried", set="cafe", voiced=True, spk_smile=0.3, at=0.5),
        S("N", "Nico runs for the bus... and forgets the phone on the table.", [Y], "react", ["📱", "☕"],
          "worried", set="cafe"),
        S("N", "Then Nico's phone lights up. It's Bea. You only see the preview.", [Y], "see", ["📱", "💬"],
          "shock", set="cafe"),
        S("N", "Bea is a friend of you both. Bea wasn't at Friday's dinner.", [B], "react", ["🍽️", "😔"],
          "sad", set="home_night", you=0),
        S("B", "Is Nico ignoring me? I sent something important and nobody's replying.", [B, Y], "say",
          ["📱", "❓"], "worried", set="park", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("N", "You know the phone was left behind. You know Nico asked for privacy. So... what do you do?",
          [Y], "think", ["📱", "🤐", "❓"], set="park"),
        # ---------------- choice A
        CARD("N", "Choice A. You explain the phone was left behind.", "CHOICE A", "EXPLAIN THE PHONE", "📱"),
        S("Y", "Nico left the phone with me. I don't think Nico's seen it yet.", [B, Y], "say", ["📱"],
          "worried", set="park", speaker=1, you=1, voiced=True, spk_expr="think", at=0.5),
        S("B", "Oh. Okay. That helps. Wait... did you read it?", [B, Y], "say", ["😳"], "shock", cont=True,
          set="park", speaker=0, you=1, voiced=True, spk_expr="worried", hold=True),
        S("N", "Bea stops worrying about being ignored. But knowing you saw it stings a little.", [B], "react",
          ["😌", "😳"], "worried", set="home_night", you=0),
        S("C", "Bea knows you saw the message? I asked you not to read anything.", [NI, Y], "say", ["📱", "🤐"],
          "sad", set="street", voiced=True, spk_expr="sad", at=0.5),
        S("N", "That night, Nico calls Bea. They talk for an hour.", [NI, B], "react", ["📞", "💬"], "happy",
          set="home_night", exprs={0: "happy", 1: "happy"}),
        S("N", "Bea had a calmer night. Nico still isn't sure about handing you a phone again.", [Y], "think",
          ["📱", "💭"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You tell Bea to ask Nico directly.", "CHOICE B", "ASK NICO DIRECTLY",
             "💬", color=(0.36, 0.80, 0.72)),
        S("Y", "I think you should ask Nico directly.", [B, Y], "say", ["💬"], "worried", set="park", speaker=1,
          you=1, voiced=True, spk_expr="think", at=0.5),
        S("B", "So you know something.", [B, Y], "say", ["🤨"], "sad", cont=True, set="park", speaker=0, you=1,
          voiced=True, spk_expr="sad", hold=True),
        S("N", "Bea spends the evening refreshing the chat. No answer.", [B], "see", ["📱", "🔄"], "sad",
          set="home_night", you=0),
        S("C", "Thanks for staying out of the middle. I owe you.", [NI, Y], "say", ["🙏"], "happy",
          set="street", voiced=True, spk_smile=0.5, at=0.5),
        S("N", "The next morning, Nico reads the message and calls Bea right away.", [NI, B], "react",
          ["📞", "💬"], "happy", set="home", exprs={0: "happy", 1: "happy"}),
        S("B", "Nico explained. I'm glad you didn't go through the phone.", [B, Y], "say", ["🤝"], "think", set="park",
          speaker=0, you=1, voiced=True, spk_smile=0.3, at=0.5),
        S("N", "Nico's privacy held. Bea's long night... still sits between you.", [Y], "think", ["🤐", "💭"],
          set="home_night"),
        # ---------------- the host
        M("Did you catch what Bea sent?"),
        M("Two choices. Two very different endings."),
        M("Do you explain that the phone was left behind, or tell them to ask the owner directly?"),
        M("What would you do?", close=True),
    ]
