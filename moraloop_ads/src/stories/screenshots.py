"""Loop long-form episode 3: "Screenshots" (from short 05_the_group_chat_relationship).
Your partner shared screenshots of your private argument, even your apology, with their friends' group chat.
Cast: you = "you" (green), Jules = "partner" (purple), Dev = "friend" (orange), Pia = "friend2" (yellow).
"""
TITLE = "Screenshots"
NAMES = {"P": ("Jules", (205, 160, 255)), "D": ("Dev", (255, 170, 80)), "G": ("Pia", (255, 215, 90)),
         "Y": ("You", (130, 225, 145))}
VOICES = {"P": "af_bella", "D": "am_liam", "G": "af_nova", "Y": "am_adam"}

Y, P, D, G = "you", "partner", "friend", "friend2"

# loop layers (see loop_ad.py): the group chat that saw the screenshots
LOOP = dict(
    hook="what did the group chat say?",
    thread=dict(contact="Game Night crew", stamp="Sun 10:02 PM", msgs=[
        "[2 screenshots]",
        "wait, is that the apology?",
        "we only know half of it",
        "maybe delete these?",
        "did Jules ask?",
    ]),
    cut_scene=3,  # the fast cut lands in "Then you see it. Screenshots."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Game night with your partner Jules... and Jules's closest friends.", [D, G, Y], "react", ["🎲", "🍕"],
          "happy", set="gamenight", exprs={0: "happy", 1: "happy"}),
        S("D", "Hey, whose turn is it to apologize? Three whole paragraphs!", [D, G, Y], "laugh", ["🎲", "🗯️"],
          "sad", set="gamenight", speaker=0, you=2, voiced=True, spk_expr="laugh", at=0.5),
        S("N", "Everyone laughs. It's your private argument with Jules. You never told them.", [D, G, Y], "laugh",
          ["😂", "🤐"], "sad", cont=True, set="gamenight", hold=True),
        S("P", "I'm sorry. I told them about our fight. I needed advice.", [P, Y], "say", ["🙏"], "worried",
          set="home", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("N", "Then you see it. Jules sent screenshots to the group. Even your apology.", [Y], "see",
          ["📱", "📸", "🙏"], "shock", set="home_night"),
        S("P", "I'll fix it. Just tell me what you want.", [P, Y], "say", ["🛠️"], "worried", set="home", speaker=0,
          you=1, voiced=True, spk_expr="worried", at=0.5),
        S("N", "Make the screenshots disappear... or make the story complete? So... what do you do?", [Y], "think",
          ["🗑️", "📝", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You ask for the screenshots to be removed.", "CHOICE A", "DELETE SCREENSHOTS",
             "🗑️"),
        S("Y", "Ask them to delete the screenshots. All of them. Tonight.", [P, Y], "say", ["🗑️"], "worried",
          set="home", speaker=1, you=1, voiced=True, spk_expr="think", at=0.5),
        S("N", "Jules asks. One by one, the replies come in. Deleted. Deleted. Deleted.", [P], "see", ["📱", "🗑️"],
          "happy", set="home_night", you=0),
        S("P", "Thank you for giving me a way to fix it.", [P, Y], "say", ["🤝"], "happy", set="park", speaker=0,
          you=1, voiced=True, spk_smile=0.5, at=0.5),
        S("N", "Your words aren't sitting in anyone's phone anymore. That feels lighter.", [Y], "think",
          ["📱", "🍃"], set="park"),
        S("D", "Deleted, I promise. But we still remember the three paragraphs.", [D, Y], "laugh", ["😅"], "sad",
          set="gamenight", speaker=0, you=1, voiced=True, spk_smile=0.6, at=0.5),
        S("N", "The jokes slow down. But nobody ever hears your side.", [D, G, Y], "react", ["🎲", "🤐"], "think",
          set="gamenight", exprs={0: "neutral", 1: "neutral"}),
        S("N", "The screenshots are gone. The story they heard is still the only one.", [Y], "think",
          ["🗑️", "💭"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You ask them to correct the story.", "CHOICE B", "CORRECT THE STORY",
             "📝", color=(0.36, 0.80, 0.72)),
        S("Y", "Tell them what really happened. Both sides. Including yours.", [P, Y], "say", ["📝"], "worried",
          set="home", speaker=1, you=1, voiced=True, spk_expr="think", at=0.5),
        S("N", "Jules writes a long message to the group. The whole argument, and Jules's part in it.", [P], "see",
          ["📱", "📝"], "worried", set="home_night", you=0),
        S("G", "Oh. That's really different from what we thought.", [G, Y], "say", ["💡"], "think",
          set="gamenight", speaker=0, you=1, voiced=True, spk_expr="think", at=0.5),
        S("N", "Your side is out there now. The friends see you differently now.", [D, G, Y], "react",
          ["🤝", "🎲"], "happy", set="gamenight", exprs={0: "happy", 1: "happy"}),
        S("P", "Honestly? I felt like I was on trial in my own group chat.", [P, Y], "say", ["⚖️"], "sad",
          set="park", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "And the screenshots? They're still in everyone's phones.", [Y], "see", ["📱", "📸"], "worried",
          set="home_night"),
        S("N", "The story is complete now. Your apology... is still out there.", [Y], "think", ["📝", "💭"],
          set="home_night"),
        # ---------------- the host
        M("Did you catch what the group chat said?"),
        M("Two choices. Two very different endings."),
        M("Do you ask for the screenshots to be removed, or ask them to correct the story?"),
        M("What would you do?", close=True),
    ]
