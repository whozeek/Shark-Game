"""Long-form episode 9: "The Voice" (from short 51_the_urgent_call).
A 2 AM call in your sibling's voice asks for $3,000. It could be them, or an AI voice clone.
Cast: you = "you" (green), Nico = "sibling" (backpacking abroad), Gran = "elder". Kept non-scary: no danger shown.
"""
TITLE = "The Voice"
NAMES = {"X": ("Nico", (120, 165, 255)), "G": ("Gran", (240, 175, 190)), "Y": ("You", (130, 225, 145))}
VOICES = {"X": "am_puck", "G": "bf_isabella", "Y": "am_adam"}

Y, X, G = "you", "sibling", "elder"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Your sibling Nico is backpacking abroad. Their last message was two days ago: a photo from a train.",
          [Y], "see", ["📱", "🚆"], "happy", set="home", at=0.6),
        S("N", "Then, at two in the morning, your phone rings.", [Y], "see", ["📱", "⏰"], "shock",
          set="home_night", at=0.6),
        S("X", "It's me! My bag got stolen. I need three thousand dollars for a place to stay and a new passport. My phone's about to die.",
          [Y], "see", ["📱", "🎒"], "worried", cont=True, set="home_night", hold=True),
        S("N", "It sounds exactly like Nico. Even the nervous laugh.", [Y], "see", ["📱", "🗣️"], "think",
          cont=True, set="home_night", hold=True),
        S("N", "But last week, you read about AI voice clones. And three thousand dollars is almost all your savings.",
          [Y], "think", ["🤖", "💰"], set="home_night"),
        S("N", "The call drops. Nico's number goes straight to voicemail. So... what do you do?", [Y], "see",
          ["📱", "❓"], "worried", set="home_night", at=0.5),
        # ---------------- choice A
        CARD("N", "Choice A. You send help now.", "CHOICE A", "SEND HELP NOW", "💸"),
        S("N", "You send the money in under a minute. Your hands are shaking.", [Y], "see", ["📱", "💸"],
          "worried", set="home_night", at=0.5),
        S("N", "In the morning, Nico calls from a hostel phone. It really was them.", [Y], "see", ["📱", "🏨"],
          "happy", set="home", at=0.6),
        S("X", "You got me a bed, and a ride to the embassy. Thank you.", [Y], "see", ["📱", "🙏"], "happy",
          cont=True, set="home", hold=True),
        S("N", "Nico is safe, and knows you came through.", [X], "react", ["🏨", "🙏"], "happy", set="street",
          you=0),
        S("N", "Your savings are gone. Nico promises to pay you back, bit by bit.", [Y], "see", ["🐷", "📉"],
          "worried", set="home", at=0.5),
        S("G", "And if it hadn't been Nico?", [G, Y], "say", ["🤖", "❓"], "worried", set="cafe", voiced=True,
          spk_expr="think", at=0.6),
        S("N", "You don't have an answer. You'd send it again. But anyone with that voice could have asked.",
          [G, Y], "react", ["🤷", "❓"], "think", cont=True, set="cafe", exprs={0: "think"}, hold=True),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You verify first.", "CHOICE B", "VERIFY FIRST", "🔍",
             color=(0.36, 0.80, 0.72)),
        S("N", "You call Gran, text Nico's friends, and check the train company. Ninety minutes.", [Y], "see",
          ["📱", "⏳"], "worried", set="home_night", at=0.5),
        S("N", "Then a friend of Nico's replies. It's real. Nico is at a station.", [Y], "see", ["📱", "✅"],
          "shock", set="home_night", at=0.6),
        S("N", "You send help, after checking. Your savings are safe.", [Y], "see", ["📱", "💸"], "think",
          set="home_night", at=0.5),
        S("N", "Nico spent a cold night on a station bench before the money came.", [X], "react", ["🪑", "🥶"],
          "sad", set="street", you=0),
        S("X", "I was so scared. Why did it take so long?", [Y], "see", ["📱", "💬"], "sad", set="home", at=0.5),
        S("N", "Once Nico is home, the family sets a code word for emergencies. Nico agrees... still a little hurt.", [X, G, Y],
          "react", ["🔑", "💬"], "think", set="home", exprs={0: "think", 1: "happy"}),
        S("N", "Your money is safe. Nico's night wasn't.", [Y], "think", ["💰", "🌙"], set="home_night"),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you send help immediately and risk being scammed… or hold off to verify and risk losing precious time?"),
        M("What would you do?", close=True),
    ]
