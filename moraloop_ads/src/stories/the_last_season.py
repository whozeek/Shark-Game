"""Long-form episode 4: "The Last Season" (from short 18_the_team_secret).
Your teammate and friend might quit and asks you to keep it quiet while the coach plans around them.
Cast: you = "you" (green), Jesse = "teammate" (blue), Coach Lane = "coach" (red), Kit = "kid" (younger player).
"""
TITLE = "The Last Season"
NAMES = {"J": ("Jesse", (120, 165, 255)), "L": ("Coach Lane", (255, 120, 120)), "K": ("Kit", (255, 215, 90)),
         "Y": ("You", (130, 225, 145))}
VOICES = {"J": "am_echo", "L": "am_fenrir", "K": "af_sky", "Y": "am_adam"}

Y, J, L, K = "you", "teammate", "coach", "kid"


def beats(S, CARD, M):
    return [
        # ---------------- setup
        S("N", "Jesse is the best player on your team. And one of your closest friends.", [J, Y], "react",
          ["⚽", "⭐"], "happy", set="field", exprs={0: "happy"}),
        S("J", "I might quit. My family needs me at the shop. Please don't tell anyone until I decide.", [J, Y],
          "tell", ["🏪", "🤫"], "shock", set="field", voiced=True, spk_expr="worried", at=0.55),
        S("J", "Two weeks. That's all I need.", [J, Y], "tell", ["⏳"], "worried", cont=True, set="field", voiced=True,
          spk_expr="worried", hold=True),
        S("N", "Coach Lane is building the whole tournament plan around Jesse.", [L], "react", ["📋", "🏆"],
          "neutral", set="field", you=0),
        S("K", "I came early again, Coach. Can I get a real shot this season?", [K, L], "say", ["🙋", "⚽"],
          "think", set="field", voiced=True, spk_smile=0.5, at=0.6),
        S("L", "Anything I should know before I lock the lineup?", [L, Y], "say", ["📋", "❓"], "worried",
          set="field", voiced=True, spk_smile=0.2, at=0.6),
        S("N", "Jesse is your friend. The team is your team. So... what do you do?", [Y], "think",
          ["🤝", "⚽", "❓"], set="field"),
        # ---------------- choice A
        CARD("N", "Choice A. You tell the coach.", "CHOICE A", "TELL THE COACH", "📋"),
        S("Y", "You might want a backup. I can't say more.", [Y, L], "say", ["🔁"], "think", set="field",
          speaker=0, you=1, voiced=True, spk_expr="worried", at=0.6),
        S("N", "Coach starts training Kit with the first squad.", [L, K], "react", ["⚽", "📈"], "happy",
          set="field", exprs={0: "happy"}),
        S("J", "You told Coach? I asked you for two weeks.", [J, Y], "say", ["⏳"], "sad", set="street", voiced=True,
          spk_expr="sad", at=0.5),
        S("N", "Jesse still hasn't decided. But now, everyone is watching.", [J], "react", ["👀", "❓"], "worried",
          set="home_night", you=0),
        S("N", "Kit improves fast... and finally gets real minutes.", [K], "react", ["⚽", "⏱️"], "happy",
          set="field", you=0),
        S("N", "Tournament day. The team is ready for anything.", [J, K, Y], "react", ["🏆", "💪"], "happy",
          set="field", exprs={0: "think", 1: "happy"}),
        S("N", "Jesse plays, and even passes you the ball. But after the goal, Jesse walks right past you. No high five.", [J, Y], "react",
          ["⚽", "✋"], "think", set="field", exprs={0: "think"}),
        # ---------------- choice B
        CARD("N", "Now... rewind. Choice B. You keep the secret.", "CHOICE B", "KEEP THE SECRET", "🤫",
             color=(0.36, 0.80, 0.72)),
        S("Y", "Nothing, Coach.", [Y, L], "say", ["🤐"], "neutral", set="field", speaker=0, you=1, voiced=True,
          spk_expr="think", at=0.6),
        S("J", "Thanks. I needed time to think without everyone watching.", [J, Y], "say", ["🙏"], "happy",
          set="street", voiced=True, spk_smile=0.5, at=0.6),
        S("N", "You talk it through on long walks home. The friendship gets deeper.", [J, Y], "react",
          ["🚶", "💬"], "happy", set="street", exprs={0: "happy"}),
        S("N", "Two days before the tournament, Jesse decides to leave. Coach scrambles.", [L], "react",
          ["📋", "😰"], "worried", set="field", you=0),
        S("N", "Kit is thrown in with almost no practice.", [L, K], "react", ["⚽", "⏳"], "worried", set="field",
          exprs={0: "worried"}),
        S("N", "Tournament day. Kit steps onto the field, nervous... but ready to try.", [K], "react",
          ["⚽", "💪"], "worried", set="field", you=0),
        S("N", "From the stands, Jesse gives you a nod. Coach looks at you... for a long second.", [L, Y],
          "react", ["👋", "👀"], "think", set="field", exprs={0: "think"}),
        # ---------------- the host
        M("Two choices. Two very different endings."),
        M("Do you tell the coach the team needs a backup, or keep your teammate’s secret for now?"),
        M("What would you do?", close=True),
    ]
