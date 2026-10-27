"""Long-form episode 5: "Rent Night" (from short 07_the_wallet; question from 40_the_found_wallet).
Rent is due at midnight and you're short, then you find a wallet with enough cash to cover it.
Cast: you = "you" (green), Quinn = "elder" (your landlord), Pat = "stranger" (the wallet's owner), Max = "brother".
"""
TITLE = "Rent Night"
NAMES = {"Q": ("Quinn", (240, 175, 190)), "P": ("Pat", (120, 215, 215)), "X": ("Max", (120, 165, 255)),
         "Y": ("You", (130, 225, 145))}
VOICES = {"Q": "bf_isabella", "P": "am_onyx", "X": "am_puck", "Y": "am_adam"}

Y, Q, P, X = "you", "elder", "stranger", "brother"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        M("Of course I’d return it."),
        S("N", "Rent is due at midnight. You're four hundred dollars short.", [Y], "see", ["📄", "💸", "⏰"],
          "worried", set="home_night", at=0.5),
        S("Q", "I already gave you one extension. Midnight, okay?", [Q, Y], "say", ["📅"], "worried", set="home",
          voiced=True, spk_expr="worried", at=0.6),
        S("N", "Walking home, you find a wallet on the sidewalk. An ID, a few cards... and about five hundred dollars in cash.",
          [Y], "see", ["👛", "🪪", "💵"], "shock", set="street", at=0.7),
        S("N", "No one around. The ID says Pat lives ten minutes away.", [Y], "see", ["🪪", "📍"], "think",
          set="street", at=0.5),
        S("Y", "Four hundred short... and five hundred right here.", [Y], "see", ["👛", "💵"], "think", cont=True,
          set="street", hold=True),
        S("N", "You stand under a streetlight, doing math you don't want to do. So... what do you do?", [Y], "think",
          ["💵", "🏠", "❓"], set="street"),
        # ---------------- choice A
        CARD("N", "Choice A. You return it.", "CHOICE A", "RETURN IT", "🤝"),
        S("N", "You knock on Pat's door.", [P, Y], "react", ["🚪", "👛"], "neutral", set="home", wall=3,
          exprs={0: "shock"}),
        S("P", "Oh, thank you! I thought it was gone.", [P, Y], "say", ["🙏"], "happy", cont=True, set="home", wall=3,
          voiced=True, spk_smile=0.9, hold=True),
        S("N", "A handshake. The door closes.", [P, Y], "react", ["🤝", "🚪"], "think", cont=True, set="home", wall=3,
          exprs={0: "happy"}, hold=True),
        S("N", "At midnight, you text Quinn: \"I'm short.\"", [Y], "see", ["📱", "⏰"], "worried", set="home_night",
          at=0.5),
        S("Q", "Late fee. And this is the last extension.", [Q, Y], "say", ["💸", "⚠️"], "sad", set="home_night",
          voiced=True, spk_expr="think", at=0.6),
        S("N", "You call your brother Max to borrow money. Something you swore you'd never do again.", [Y], "see",
          ["📱", "💸"], "sad", set="home_night", at=0.6),
        S("X", "Okay... I'll send it.", [X, Y], "say", ["💵"], "think", set="home_night", voiced=True,
          spk_expr="think", at=0.6),
        S("N", "That night you lie awake, broke and owing Max... but you can walk past Pat's street without a second thought.",
          [Y], "think", ["💸", "🛣️"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You keep it.", "CHOICE B", "KEEP IT", "👛",
             color=(0.36, 0.80, 0.72)),
        S("N", "You pay Quinn on time.", [Q, Y], "react", ["💵", "✅"], "neutral", set="home", exprs={0: "happy"}),
        S("Q", "Thanks. You had me worried.", [Q, Y], "say", ["🙂"], "think", cont=True, set="home", voiced=True,
          spk_smile=0.6, hold=True),
        S("N", "Back home, the rent receipt sits on the table.", [Y], "see", ["🧾", "🏠"], "think",
          set="home_night", at=0.5),
        S("N", "You mail the ID and cards back to Pat. No note. No return address.", [Y], "see", ["✉️", "🪪"],
          "think", set="street", at=0.5),
        S("N", "Days later, at the store, you see a flyer. Lost wallet. Please return the cards.", [Y], "see",
          ["📄", "👛"], "shock", set="store", at=0.7),
        S("N", "You already did. Not the cash.", [Y], "see", ["📄", "💵"], "think", cont=True, set="store",
          hold=True),
        S("N", "You start a jar labeled Pat... and drop in a few dollars.", [Y], "see", ["🫙", "💵"], "think",
          set="home", at=0.5),
        S("N", "You have a home. And a name you won't forget.", [Y], "think", ["🏠", "🪪"], set="home_night"),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you return it or keep it?"),
        M("What would you do?", close=True),
    ]
