"""Loop long-form episode 8: "The Sketchbook" (from short 19_the_lost_sketchbook).
You returned a lost sketchbook to a quiet classmate. Your friend wants to praise the art online. The artist hasn't agreed.
Cast: you = "you" (green), Jo = "friend" (orange), Mika = "friend2" (yellow, the artist).
"""
TITLE = "The Sketchbook"
NAMES = {"J": ("Jo", (255, 170, 80)), "M": ("Mika", (255, 215, 90)), "Y": ("You", (130, 225, 145))}
VOICES = {"J": "am_eric", "M": "af_aoede", "Y": "am_adam"}

Y, J, MK = "you", "friend", "friend2"

# loop layers (see loop_ad.py): a page from Mika's sketchbook
LOOP = dict(
    hook="what's on the last page?",
    note=dict(title="page 41", lines=[
        "1 drawing a day",
        "art show: due fri",
        "enter? not sure",
        "just for me",
        "nobody sees this",
    ]),
    cut_scene=1,  # the fast cut lands in "Inside: page after page of drawings."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "You and Jo find a sketchbook at the library. No name on the cover.", [J, Y], "react", ["📓", "🔍"],
          "worried", set="library", exprs={0: "think"}),
        S("N", "To find the owner, you open it. Inside: page after page of drawings.", [J, Y], "see",
          ["📓", "🎨", "✨"], "shock", set="library"),
        S("N", "It belongs to Mika, the quiet one from art class.", [MK, Y], "react", ["📓", "🤝"], "worried",
          set="hall", exprs={0: "worried"}),
        S("M", "You found it! Thank you. Please... don't tell anyone what's in there.", [MK, Y], "say",
          ["📓", "🙏"], "worried", cont=True, set="hall", speaker=0, you=1, voiced=True, spk_expr="worried",
          hold=True),
        S("J", "Those drawings are amazing. People should know! Let's post about it.", [J, Y], "say",
          ["📱", "👏"], "happy", set="cafe", speaker=0, you=1, voiced=True, spk_smile=0.7, at=0.5),
        S("J", "We won't show the art. Just say how good Mika is.", [J, Y], "say", ["📱", "🙈"], "happy",
          cont=True, set="cafe", speaker=0, you=1, voiced=True, spk_smile=0.5, hold=True),
        S("N", "Mika's talent deserves praise. Mika asked for quiet. So... what do you do?", [Y], "think",
          ["🎨", "🤐", "❓"], set="home_night"),
        # ---------------- choice A
        CARD("N", "Choice A. You ask the artist before posting.", "CHOICE A", "ASK MIKA FIRST", "🙋"),
        S("Y", "Jo wants to post about your art. No pictures. Is that okay with you?", [MK, Y], "say", ["📱", "❓"],
          "worried", set="hall", speaker=1, you=1, voiced=True, spk_expr="think", at=0.5),
        S("M", "Thank you for asking. Nobody ever asks. Can I think about it?", [MK, Y], "say", ["🙏"], "think",
          cont=True, set="hall", speaker=0, you=1, voiced=True, spk_smile=0.3, hold=True),
        S("N", "A week passes. Mika doesn't decide. The art show deadline comes and goes.", [Y], "see",
          ["📅", "⏳"], "worried", set="home_night"),
        S("J", "We could have helped. Now nobody knows.", [J, Y], "say", ["🤷"], "sad", set="cafe", voiced=True,
          spk_expr="sad", at=0.5),
        S("N", "But Mika starts sketching at your lunch table. Book open. Not hiding it anymore.", [MK, Y], "react",
          ["📓", "✏️"], "happy", set="hall", exprs={0: "happy"}),
        S("N", "Mika trusts you more. And the art... is still a secret.", [Y], "think", ["📓", "💭"],
          set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You post praise without showing the art.", "CHOICE B",
             "POST THE PRAISE", "📣", color=(0.36, 0.80, 0.72)),
        S("N", "You and Jo post: someone in our school draws better than anyone we know.", [J, Y], "see", ["📱", "🎨"],
          "happy", set="cafe", exprs={0: "happy"}),
        S("N", "The post spreads. People start guessing. By lunch, they've guessed Mika.", [MK], "react",
          ["📱", "👀"], "shock", set="hall", you=0),
        S("M", "Everyone wants to see my sketchbook now.", [MK, Y], "say", ["📓", "😰"], "worried", set="hall",
          speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("N", "Then the art teacher hears about it, and invites Mika to the art show.", [MK], "react",
          ["🖼️", "💌"], "happy", set="library", you=0),
        S("M", "I entered. I'm terrified. But I entered.", [MK, Y], "say", ["🖼️", "😬"], "happy", set="hall",
          speaker=0, you=1, voiced=True, spk_smile=0.5, at=0.5),
        S("N", "But now the sketchbook stays in Mika's backpack. Zipped.", [MK], "react", ["🎒", "🔒"], "sad",
          set="library", you=0),
        S("N", "Mika's art has a stage. And Mika's privacy... has a crack in it.", [Y], "think", ["🖼️", "💭"],
          set="home_night"),
        # ---------------- the host
        M("Did you catch the last page?"),
        M("Two choices. Two very different endings."),
        M("Do you ask the artist before posting, or post praise without showing the art?"),
        M("What would you do?", close=True),
    ]
