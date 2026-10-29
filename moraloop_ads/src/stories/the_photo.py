"""Loop long-form episode 9: "The Photo" (from short 20_the_group_chat_photo).
An embarrassing photo of your friend is posted in a group chat they aren't in. The poster asks you not to tell yet.
Cast: you = "you" (green), Dani = "friend" (orange), Sam = "teammate" (blue, who posted it).
"""
TITLE = "The Photo"
NAMES = {"D": ("Dani", (255, 170, 80)), "S": ("Sam", (120, 165, 255)), "Y": ("You", (130, 225, 145))}
VOICES = {"D": "af_nicole", "S": "am_michael", "Y": "am_adam"}

Y, D, SM = "you", "friend", "teammate"

# loop layers (see loop_ad.py): the group chat around the photo
LOOP = dict(
    hook="what did the chat say?",
    thread=dict(contact="Beach crew", stamp="Mon 8:12 AM", msgs=[
        "[photo]",
        "😂😂😂 I can't",
        "wait, does Dani know?",
        "Sam: I'll handle it",
        "don't tell yet",
    ]),
    cut_scene=2,  # the fast cut lands in "The chat explodes."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Dani and Sam are both your friends. Last weekend, you all went to the beach.", [D, SM, Y], "react",
          ["🏖️", "📸"], "happy", set="park", exprs={0: "happy", 1: "happy"}),
        S("N", "Monday morning, Sam posts a photo of Dani in the group chat. Mid-fall. Mouth wide open.",
          [SM, Y], "see", ["📱", "📸", "😳"], "worried", set="hall", exprs={0: "laugh"}),
        S("N", "The chat explodes. Dani isn't in that chat.", [Y], "see", ["📱", "😂", "💬"], "worried",
          set="hall"),
        S("D", "Why is everyone looking at me and laughing?", [D, Y], "say", ["😂", "❓"], "worried",
          set="park", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("S", "Please don't tell Dani yet. I'll delete it and explain myself. Tonight.", [SM, Y], "say",
          ["🙏", "⏰"], "worried", set="park", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("N", "Dani is asking you. Sam is asking you to wait. So... what do you do?", [Y], "think",
          ["🗣️", "⏳", "❓"], set="park"),
        # ---------------- choice A
        CARD("N", "Choice A. You tell your friend about the photo.", "CHOICE A", "TELL DANI", "🗣️"),
        S("Y", "Sam posted a photo of you in the group chat. From the beach.", [D, Y], "say", ["📸"], "worried",
          set="park", speaker=1, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("D", "Everyone saw that?", [D, Y], "say", ["😳"], "sad", cont=True, set="park", speaker=0, you=1,
          voiced=True, spk_expr="sad", hold=True),
        S("N", "Dani asks Sam to delete it. It's gone within the hour.", [D, SM], "react", ["📱", "🗑️"], "worried",
          set="hall", exprs={0: "think", 1: "worried"}),
        S("D", "Thanks for not letting me find out last.", [D, Y], "say", ["🤝"], "happy", set="park", speaker=0,
          you=1, voiced=True, spk_smile=0.4, at=0.5),
        S("S", "I was going to tell Dani tonight. You didn't give me the chance.", [SM, Y], "say", ["⏰"], "sad",
          set="street", voiced=True, spk_expr="sad", at=0.5),
        S("N", "Then Dani leaves the beach crew chat. The group feels smaller.", [Y], "see", ["📱", "👋"], "sad",
          set="home_night"),
        S("N", "Dani knows the truth. And the group chat... is quieter now.", [Y], "think", ["📱", "💭"],
          set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You give the person who posted it time to explain.", "CHOICE B",
             "GIVE SAM TIME", "⏳", color=(0.36, 0.80, 0.72)),
        S("Y", "Okay. Tonight. Not later.", [SM, Y], "say", ["⏰"], "think", set="park", speaker=1, you=1,
          voiced=True, spk_expr="think", at=0.5),
        S("N", "All day, Dani keeps asking what's funny. You change the subject.", [D, Y], "react", ["❓", "🤐"],
          "worried", set="hall", exprs={0: "worried"}),
        S("N", "That evening, Sam calls Dani, apologizes, and deletes the photo.", [SM, D], "tell", ["📞", "🗑️"],
          "worried", set="home_night", exprs={1: "think"}),
        S("D", "Sam told me. It's gone. I'm okay... I think.", [D, Y], "say", ["😅"], "happy", set="park",
          speaker=0, you=1, voiced=True, spk_smile=0.6, at=0.5),
        S("D", "Wait... you knew the whole day?", [D, Y], "say", ["🤨"], "sad", cont=True, set="park", speaker=0,
          you=1, voiced=True, spk_expr="sad", hold=True),
        S("N", "The beach crew stays together. But Dani stops telling you things first.", [D, SM, Y], "react",
          ["🏖️", "🤔"], "think", set="park", exprs={0: "think", 1: "happy"}),
        S("N", "The photo is gone. The group is whole. And that long day... still sits with Dani.", [Y], "think",
          ["📸", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch what the chat said?"),
        M("Two choices. Two very different endings."),
        M("Do you tell your friend about the photo, or give the person who posted it time to explain?"),
        M("What would you do?", close=True),
    ]
