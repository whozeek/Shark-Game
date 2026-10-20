"""Template for a long-form storyline. Copy to stories/<slug>.py, then render with:
    STORY=<slug> python3 story.py plan            # timeline + duration (aim 120-180 s)
    STORY=<slug> python3 story.py still 12.5 40   # check frames
    STORY=<slug> python3 story.py render out.mp4
Letters pick the speaker voice: N = narrator/host, H = host on stage, plus your cast letters below.
Char ids: you, friend, friend2, partner, brother, sibling, ex, kid, cousin, boss, coworker, stranger, elder, coach, teammate.
"""
TITLE = "Example"
NAMES = {"A": ("Sam", (255, 170, 80)), "B": ("Alex", (205, 160, 255)), "Y": ("You", (130, 225, 145))}
VOICES = {"A": "am_liam", "B": "af_bella", "Y": "am_adam"}


def beats(S, CARD, M):
    return [
        S("N", "Meet Sam and Alex.", ["friend", "partner", "you"], "react", ["🙂"], "happy", set="park"),
        S("A", "Hey, got a minute?", ["friend", "you"], "say", [], "neutral", set="park", voiced=True),
        CARD("N", "Choice A. You speak up.", "CHOICE A", "SPEAK UP", "🗣️"),
        S("N", "...balanced outcome A...", ["you"], "think", ["🤔"], set="home"),
        CARD("N", "Now... rewind. Choice B. You stay quiet.", "CHOICE B", "STAY QUIET", "🤐", color=(0.36, 0.80, 0.72)),
        S("N", "...balanced outcome B...", ["you"], "think", ["🤔"], set="home"),
        M("Two choices. Two very different endings."),
        M("What would you do?", close=True),
    ]
