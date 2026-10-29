"""Loop long-form episode 10: "Comment Section" (from short 25_the_public_comment).
A friend posts a careless joke publicly. You know they didn't mean harm, but people are upset.
Cast: you = "you" (green), Reese = "friend" (orange), Jamie = "friend2" (yellow).
"""
TITLE = "Comment Section"
NAMES = {"R": ("Reese", (255, 170, 80)), "J": ("Jamie", (255, 215, 90)), "Y": ("You", (130, 225, 145))}
VOICES = {"R": "am_echo", "J": "af_river", "Y": "am_adam"}

Y, R, J = "you", "friend", "friend2"

# loop layers (see loop_ad.py): the comments under Reese's post
LOOP = dict(
    hook="what was the last reply?",
    thread=dict(contact="Comments (48)", stamp="Sun 9:30 AM", msgs=[
        "my mom works a drive-thru. at 52.",
        "someone talk to Reese",
        "Reese is sweet irl tho",
        "it's getting screenshotted",
        "lol relax",
    ]),
    cut_scene=2,  # the fast cut lands in "By morning, the comments are on fire."
)


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Reese is one of your closest friends. Funny. Kind. Usually.", [R, Y], "react", ["😂", "🤝"],
          "happy", set="park", exprs={0: "happy"}),
        S("N", "Last night, Reese posted a joke about people who still work a drive-thru at forty.", [R], "see",
          ["📱", "🍔"], "happy", set="home_night", you=0),
        S("N", "By morning, the comments are on fire.", [Y], "see", ["📱", "🔥", "💬"], "shock", set="home"),
        S("J", "I'm Reese's friend too. My mom works a drive-thru. Is Reese really like that?", [J, Y], "say", ["🍔", "😔"], "sad",
          set="street", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("R", "It was a joke. People are taking it way too seriously.", [R, Y], "say", ["🤷"], "worried",
          set="cafe", speaker=0, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("N", "You know Reese didn't mean harm. You also know people are hurt. So... what do you do?", [Y],
          "think", ["🤝", "💔", "❓"], set="home"),
        # ---------------- choice A
        CARD("N", "Choice A. You reply in public.", "CHOICE A", "REPLY IN PUBLIC", "📢"),
        S("N", "You comment under the post: Reese, this one isn't funny. Please take it down.", [Y], "see",
          ["📱", "💬"], "worried", set="home"),
        S("N", "Dozens of people like your reply. Jamie sends you a heart.", [J], "see", ["📱", "❤️"], "happy",
          set="street", you=0),
        S("R", "You called me out in front of everyone? You could've just texted me.", [R, Y], "say",
          ["📢", "💔"], "sad", set="cafe", speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "Reese deletes the post and apologizes. Publicly.", [R], "see", ["📱", "🙏"], "worried",
          set="home_night", you=0),
        S("N", "But for weeks, Reese is quieter around you.", [R, Y], "react", ["🤐", "🚶"], "think", set="park",
          exprs={0: "think"}),
        S("N", "The apology was public. The friendship... is still finding its way back.", [Y], "think",
          ["📢", "💭"], set="home_night"),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You message Reese in private.", "CHOICE B", "TEXT IN PRIVATE", "💬",
             color=(0.36, 0.80, 0.72)),
        S("Y", "Hey. That post is hurting people. Jamie's mom works a drive-thru.", [R, Y], "say", ["📱", "🍔"],
          "worried", set="cafe", speaker=1, you=1, voiced=True, spk_expr="worried", at=0.5),
        S("R", "Oh no. I didn't think about that. I'll take it down.", [R, Y], "say", ["😟"], "sad", cont=True,
          set="cafe", speaker=0, you=1, voiced=True, spk_expr="sad", hold=True),
        S("N", "Reese deletes the post quietly. No apology. It's just gone.", [Y], "see", ["📱", "🗑️"],
          "think", set="home"),
        S("N", "Reese thanks you later. Your friendship feels closer than before.", [R, Y], "react", ["🤝"],
          "happy", set="park", exprs={0: "happy"}),
        S("J", "You saw it too. And you didn't say anything?", [J, Y], "say", ["📱", "🤨"], "sad", set="street",
          speaker=0, you=1, voiced=True, spk_expr="sad", at=0.5),
        S("N", "Reese learned something. But in public... it looks like nobody said a word.", [Y], "think",
          ["🤐", "💭"], set="home_night"),
        # ---------------- the host
        M("Did you catch the last reply?"),
        M("Two choices. Two very different endings."),
        M("Reply in public... or text Reese in private?"),
        M("What would you do?", close=True),
    ]
