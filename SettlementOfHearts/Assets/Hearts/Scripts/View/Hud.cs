using System.Collections.Generic;
using Hearts.Sim;
using UnityEngine;

namespace Hearts.View
{
    // Prototype HUD and person inspector, drawn with IMGUI so the first playable needs no UI assets.
    // The production UI moves to UI Toolkit (see the design doc); the information shown stays the same.
    public class Hud
    {
        const float InspectorWidth = 420f;
        const float TopBarHeight = 64f;

        static readonly Color Panel = new Color(0.08f, 0.09f, 0.11f, 0.88f);
        static readonly Color Track = new Color(0.22f, 0.24f, 0.28f, 1f);
        static readonly Color Positive = new Color(0.36f, 0.78f, 0.7f);
        static readonly Color Negative = new Color(0.95f, 0.55f, 0.3f);
        static readonly Color Gold = new Color(1f, 0.85f, 0.3f);
        static readonly Color Muted = new Color(0.7f, 0.72f, 0.76f);

        readonly GameRoot root;
        readonly List<Rect> uiRects = new List<Rect>();
        float scale = 1f;
        float vw;
        float vh;
        Vector2 feedScroll;
        Vector2 inspectorScroll;

        bool stylesReady;
        Texture2D panelTex;
        GUIStyle panel, title, header, label, small, muted, wrap, bubble, nameTag, feedEntry, nudgeButton, chip, modalText;

        public Hud(GameRoot root) { this.root = root; }

        SimulationRunner Runner { get { return root.Runner; } }
        ContentDb Db { get { return root.Runner.Db; } }

        public bool PointerOverUi(Vector2 screenPos)
        {
            if (root.ShowIntro || root.GoalReport != null) return true;
            var p = new Vector2(screenPos.x / scale, (Screen.height - screenPos.y) / scale);
            foreach (var r in uiRects)
                if (r.Contains(p)) return true;
            return false;
        }

        public void Draw()
        {
            if (Runner == null) return;
            EnsureStyles();
            scale = Mathf.Clamp(Screen.height / 860f, 0.8f, 2.5f);
            GUI.matrix = Matrix4x4.TRS(Vector3.zero, Quaternion.identity, new Vector3(scale, scale, 1f));
            vw = Screen.width / scale;
            vh = Screen.height / scale;
            if (Event.current.type == EventType.Layout) uiRects.Clear();

            bool modal = root.ShowIntro || root.GoalReport != null;
            GUI.enabled = !modal;
            DrawWorldLabels();
            DrawTopBar();
            DrawFeed();
            if (root.SelectedId >= 0 && Runner.State.Person(root.SelectedId) != null) DrawInspector();
            GUI.enabled = true;

            if (root.ShowIntro) DrawIntro();
            else if (root.GoalReport != null) DrawGoal();
            else DrawTooltip();
        }

        // ---------- Styles and drawing helpers ----------

        void EnsureStyles()
        {
            if (stylesReady && panelTex != null) return;
            panelTex = new Texture2D(1, 1);
            panelTex.SetPixel(0, 0, Panel);
            panelTex.Apply();

            panel = new GUIStyle();
            panel.normal.background = panelTex;
            title = new GUIStyle(GUI.skin.label) { fontSize = 22, fontStyle = FontStyle.Bold, wordWrap = true };
            title.normal.textColor = Color.white;
            header = new GUIStyle(GUI.skin.label) { fontSize = 15, fontStyle = FontStyle.Bold };
            header.normal.textColor = Gold;
            label = new GUIStyle(GUI.skin.label) { fontSize = 14, richText = true };
            label.normal.textColor = new Color(0.93f, 0.93f, 0.95f);
            small = new GUIStyle(label) { fontSize = 12 };
            muted = new GUIStyle(small);
            muted.normal.textColor = Muted;
            wrap = new GUIStyle(label) { wordWrap = true };
            bubble = new GUIStyle(GUI.skin.box) { fontSize = 13, wordWrap = true, alignment = TextAnchor.MiddleCenter, padding = new RectOffset(8, 8, 5, 5) };
            bubble.normal.background = panelTex;
            nameTag = new GUIStyle(label) { fontSize = 13, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter, richText = true };
            feedEntry = new GUIStyle(small) { wordWrap = true, richText = true };
            feedEntry.hover.textColor = Color.white;
            nudgeButton = new GUIStyle(GUI.skin.button) { fontSize = 13, wordWrap = true, richText = true, padding = new RectOffset(6, 6, 6, 6) };
            chip = new GUIStyle(GUI.skin.box) { fontSize = 12, padding = new RectOffset(6, 6, 3, 3) };
            chip.normal.textColor = Gold;
            modalText = new GUIStyle(label) { fontSize = 15, wordWrap = true, richText = true };
            stylesReady = true;
        }

        void DrawPanel(Rect r)
        {
            GUI.Box(r, GUIContent.none, panel);
            if (Event.current.type == EventType.Layout) uiRects.Add(r);
        }

        static void Fill(Rect r, Color c)
        {
            var old = GUI.color;
            GUI.color = c;
            GUI.DrawTexture(r, Texture2D.whiteTexture);
            GUI.color = old;
        }

        static void Bar(Rect r, float fill01, Color color)
        {
            Fill(r, Track);
            Fill(new Rect(r.x, r.y, r.width * Mathf.Clamp01(fill01), r.height), color);
        }

        static string Hex(Color c) { return ColorUtility.ToHtmlStringRGB(c); }

        // ---------- World-space labels and speech bubbles ----------

        void DrawWorldLabels()
        {
            var cam = root.Camera;
            if (cam == null) return;
            foreach (var view in root.AllViews)
            {
                var p = Runner.State.Person(view.PersonId);
                if (p == null) continue;
                var sp = cam.WorldToScreenPoint(view.transform.position + Vector3.up * (PersonView.HeadHeight + 0.2f));
                if (sp.z < 0f) continue;
                var gp = new Vector2(sp.x / scale, (Screen.height - sp.y) / scale);

                bool wavering = false;
                foreach (var w in p.wavering) wavering |= w;
                string text = p.firstName;
                if (wavering) text += " <color=#" + Hex(Gold) + ">?!</color>";
                if (p.IsHeartbroken) text += " <color=#" + Hex(Muted) + ">(heartbroken)</color>";
                var nameRect = new Rect(gp.x - 90f, gp.y - 22f, 180f, 20f);
                var shadow = nameRect;
                shadow.position += new Vector2(1f, 1f);
                var oldColor = GUI.contentColor;
                GUI.contentColor = Color.black;
                GUI.Label(shadow, StripColor(text), nameTag);
                GUI.contentColor = view.Selected ? Gold : Color.white;
                GUI.Label(nameRect, text, nameTag);
                GUI.contentColor = oldColor;

                if (!string.IsNullOrEmpty(view.BubbleText) && view.BubbleAlpha > 0f)
                {
                    var content = new GUIContent(view.BubbleText);
                    float width = Mathf.Min(240f, bubble.CalcSize(content).x + 4f);
                    float height = bubble.CalcHeight(content, width);
                    var r = new Rect(gp.x - width / 2f, nameRect.y - height - 4f, width, height);
                    var old = GUI.color;
                    GUI.color = new Color(1f, 1f, 1f, view.BubbleAlpha);
                    bubble.normal.textColor = view.BubbleColor;
                    GUI.Box(r, content, bubble);
                    GUI.color = old;
                }
            }
        }

        static string StripColor(string s)
        {
            return System.Text.RegularExpressions.Regex.Replace(s, "<.*?>", "");
        }

        // ---------- Top bar ----------

        void DrawTopBar()
        {
            var state = Runner.State;
            var bar = new Rect(0f, 0f, vw, TopBarHeight);
            DrawPanel(bar);

            int hour = Mathf.FloorToInt(state.hourOfDay);
            int minute = Mathf.FloorToInt((state.hourOfDay - hour) * 60f);
            GUI.Label(new Rect(14f, 8f, 150f, 24f), "Day " + state.day + ", " + hour.ToString("00") + ":" + minute.ToString("00"), header);

            GUI.Label(new Rect(170f, 8f, 80f, 24f), "Influence", label);
            Bar(new Rect(250f, 14f, 170f, 12f), state.influence / Mathf.Max(1f, state.maxInfluence), Gold);
            GUI.Label(new Rect(428f, 8f, 70f, 24f), Mathf.FloorToInt(state.influence) + " / " + Mathf.RoundToInt(state.maxInfluence), label);

            float x = 500f;
            if (GUI.Button(new Rect(x, 6f, 70f, 26f), root.Paused ? "Play" : "Pause")) root.Paused = !root.Paused;
            x += 76f;
            for (int i = 0; i < GameRoot.Speeds.Length; i++)
            {
                bool current = !root.Paused && root.SpeedIndex == i;
                var old = GUI.backgroundColor;
                if (current) GUI.backgroundColor = Gold;
                if (GUI.Button(new Rect(x, 6f, 40f, 26f), GameRoot.Speeds[i] + "x")) root.SetSpeed(i);
                GUI.backgroundColor = old;
                x += 44f;
            }
            x += 10f;
            root.ShowOverlay = GUI.Toggle(new Rect(x, 9f, 150f, 22f), root.ShowOverlay, " Relationships (R)");
            x += 154f;
            root.ShowNumbers = GUI.Toggle(new Rect(x, 9f, 130f, 22f), root.ShowNumbers, " Numbers (F1)");

            var scenario = Db.scenario;
            string goal = scenario != null ? "Goal (day " + Mathf.Min(state.day, scenario.goalDays) + " of " + scenario.goalDays + "): " + scenario.goal : "";
            GUI.Label(new Rect(14f, 36f, vw - 28f, 24f), goal, muted);
        }

        // ---------- Event feed ----------

        void DrawFeed()
        {
            var r = new Rect(10f, TopBarHeight + 8f, 340f, Mathf.Min(320f, vh - TopBarHeight - 18f));
            DrawPanel(r);
            GUILayout.BeginArea(new Rect(r.x + 10f, r.y + 8f, r.width - 20f, r.height - 16f));
            GUILayout.Label("Settlement news", header);
            feedScroll = GUILayout.BeginScrollView(feedScroll);
            var feed = Runner.State.feed;
            for (int i = feed.Count - 1; i >= 0; i--)
            {
                var e = feed[i];
                var color = e.kind == FeedKind.Good ? Effects.Accept : e.kind == FeedKind.Bad ? Effects.Backfire : e.kind == FeedKind.Flip ? Gold : label.normal.textColor;
                string text = "<color=#" + Hex(Muted) + ">Day " + e.day + "</color>  <color=#" + Hex(color) + ">" + e.text + "</color>";
                if (GUILayout.Button(text, feedEntry) && e.personId >= 0) root.Select(e.personId, true);
                GUILayout.Space(2f);
            }
            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }

        // ---------- Person inspector ----------

        void DrawInspector()
        {
            var p = Runner.State.Person(root.SelectedId);
            var r = new Rect(vw - InspectorWidth - 10f, TopBarHeight + 8f, InspectorWidth, vh - TopBarHeight - 18f);
            DrawPanel(r);
            if (GUI.Button(new Rect(r.xMax - 34f, r.y + 8f, 26f, 24f), "x")) { root.Deselect(); return; }

            GUILayout.BeginArea(new Rect(r.x + 12f, r.y + 8f, r.width - 24f, r.height - 16f));
            inspectorScroll = GUILayout.BeginScrollView(inspectorScroll);

            GUILayout.Label(p.FullName, title);
            string mood = MoodWord(p.happiness) + (root.ShowNumbers ? " (" + Mathf.RoundToInt(p.happiness) + ")" : "");
            string status = "Age " + p.age + "  ·  Mood: " + mood;
            if (p.IsHeartbroken) status += "  ·  <color=#" + Hex(Muted) + ">Heartbroken, " + p.heartbrokenDaysLeft + " days left</color>";
            GUILayout.Label(status, label);
            if (!string.IsNullOrEmpty(p.bio)) GUILayout.Label("<i>" + p.bio + "</i>", new GUIStyle(wrap) { fontSize = 13 });

            if (p.quirkIds.Count > 0)
            {
                GUILayout.BeginHorizontal();
                foreach (var q in Db.QuirksOf(p)) GUILayout.Label(new GUIContent(q.displayName, q.description), chip);
                GUILayout.FlexibleSpace();
                GUILayout.EndHorizontal();
            }

            GUILayout.Space(10f);
            GUILayout.Label("Personality", header);
            for (int t = 0; t < Db.traits.Count; t++) DrawTraitRow(p, t);

            GUILayout.Space(10f);
            GUILayout.Label("Heart and mind", header);
            for (int a = 0; a < Db.attitudes.Count; a++) DrawAttitude(p, a);

            GUILayout.Space(10f);
            GUILayout.Label("Relationships", header);
            DrawRelationships(p);

            GUILayout.Space(10f);
            GUILayout.Label("Influence", header);
            DrawNudges(p);

            GUILayout.Space(10f);
            GUILayout.Label("Story", header);
            if (p.story.Count == 0) GUILayout.Label("Nothing notable yet.", muted);
            for (int i = p.story.Count - 1; i >= 0 && i >= p.story.Count - 6; i--)
                GUILayout.Label("<color=#" + Hex(Muted) + ">Day " + p.story[i].day + "</color>  " + p.story[i].text, new GUIStyle(small) { wordWrap = true });

            GUILayout.Space(6f);
            GUILayout.Label("F: focus camera  ·  Esc: close", muted);
            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }

        static string MoodWord(float h)
        {
            if (h < 35f) return "Unhappy";
            if (h < 55f) return "Okay";
            if (h < 72f) return "Content";
            return "Happy";
        }

        void DrawTraitRow(PersonState p, int t)
        {
            var def = Db.traits[t];
            float v = p.traits[t];
            int bucket = Mathf.Clamp(Mathf.FloorToInt(v / 20f), 0, 4);
            string word = bucket == 0 ? "Very " + def.lowLabel.ToLowerInvariant()
                : bucket == 1 ? def.lowLabel
                : bucket == 2 ? def.midLabel
                : bucket == 3 ? def.highLabel
                : "Very " + def.highLabel.ToLowerInvariant();

            GUILayout.BeginHorizontal();
            GUILayout.Label(new GUIContent(def.displayName, def.description), small, GUILayout.Width(100f));
            GUILayout.Label(word, label, GUILayout.Width(140f));
            var bar = GUILayoutUtility.GetRect(110f, 12f, GUILayout.Width(110f));
            bar.y += 5f;
            for (int i = 0; i < 5; i++)
            {
                var seg = new Rect(bar.x + i * 22f, bar.y, 19f, 10f);
                Fill(seg, i <= bucket ? Positive : Track);
            }
            if (root.ShowNumbers) GUILayout.Label(Mathf.RoundToInt(v).ToString(), muted, GUILayout.Width(30f));
            GUILayout.EndHorizontal();
        }

        void DrawAttitude(PersonState p, int a)
        {
            var def = Db.attitudes[a];
            float v = p.attitudes[a];
            float rest = Runner.Attitudes.RestingPoint(p, a);
            string word = Mathf.Abs(v) < 20f ? "Undecided"
                : Mathf.Abs(v) < 60f ? "Leaning: " + (v > 0 ? def.positiveLabel : def.negativeLabel).ToLowerInvariant()
                : v > 0 ? def.positiveLabel : def.negativeLabel;
            if (a == Db.RelationshipDesire && p.IsHeartbroken) word = "Heartbroken";

            GUILayout.BeginHorizontal();
            GUILayout.Label("<b>" + def.displayName + "</b>", label, GUILayout.Width(110f));
            GUILayout.Label(word + (root.ShowNumbers ? "  (" + Mathf.RoundToInt(v) + ", rests at " + Mathf.RoundToInt(rest) + ")" : ""), label);
            GUILayout.EndHorizontal();

            var g = GUILayoutUtility.GetRect(360f, 16f);
            g.width = Mathf.Min(g.width, 370f);
            Fill(g, Track);
            float mid = g.x + g.width / 2f;
            float needle = mid + v / 100f * g.width / 2f;
            float restX = mid + rest / 100f * g.width / 2f;
            Fill(new Rect(Mathf.Min(mid, needle), g.y + 3f, Mathf.Abs(needle - mid), g.height - 6f), v >= 0f ? Positive : Negative);
            Fill(new Rect(mid - 0.5f, g.y, 1f, g.height), new Color(1f, 1f, 1f, 0.35f));
            Fill(new Rect(restX - 1f, g.y - 2f, 2f, g.height + 4f), new Color(1f, 1f, 1f, 0.8f));
            Fill(new Rect(needle - 2f, g.y - 3f, 4f, g.height + 6f), Color.white);

            GUILayout.BeginHorizontal();
            GUILayout.Label(def.negativeLabel, muted);
            GUILayout.FlexibleSpace();
            GUILayout.Label("white tick = their nature", muted);
            GUILayout.FlexibleSpace();
            GUILayout.Label(def.positiveLabel, muted);
            GUILayout.EndHorizontal();

            if (p.wavering[a])
            {
                string toward = (p.waveringTarget[a] > v ? def.positiveLabel : def.negativeLabel).ToLowerInvariant();
                int cost = Runner.Influence.SteadyCost(p, a);
                GUILayout.BeginHorizontal();
                GUILayout.Label("<color=#" + Hex(Gold) + ">Wavering: may turn toward \"" + toward + "\" tomorrow.</color>", new GUIStyle(small) { wordWrap = true }, GUILayout.Width(250f));
                bool wasEnabled = GUI.enabled;
                GUI.enabled = wasEnabled && Runner.State.influence >= cost;
                if (GUILayout.Button(new GUIContent("Steady (" + cost + ")", "Cancel this change of heart. Always works."), GUILayout.Width(100f)))
                    Runner.Influence.Steady(p.id, a);
                GUI.enabled = wasEnabled;
                GUILayout.EndHorizontal();
            }
            GUILayout.Space(4f);
        }

        void DrawRelationships(PersonState p)
        {
            var couple = Runner.State.CoupleOf(p);
            var partner = Runner.State.PartnerOf(p);
            if (couple != null && partner != null)
            {
                GUILayout.BeginHorizontal();
                GUILayout.Label("Partner:", label, GUILayout.Width(70f));
                if (GUILayout.Button(partner.FullName, GUILayout.Width(150f))) root.Select(partner.id, true);
                GUILayout.Label(couple.stage.ToString(), muted);
                GUILayout.EndHorizontal();

                BarRow("Bond", couple.bond, Effects.Heart);
                BarRow("Tension", couple.tension, Negative);

                float compat = couple.compatibility + couple.spark;
                string match = compat >= 75f ? "Great match" : compat >= 60f ? "Good match" : compat >= 45f ? "Fair match" : "Poor match";
                string detail = match;
                if (couple.tension > couple.bond) detail += "  ·  <color=#" + Hex(Effects.Backfire) + ">Arguing more than loving</color>";
                GUILayout.Label(detail, label);
                if (root.ShowNumbers)
                {
                    var a = Runner.State.Person(couple.personA);
                    var b = Runner.State.Person(couple.personB);
                    GUILayout.Label("Compatibility " + Mathf.RoundToInt(couple.compatibility) + ", Spark " + couple.spark.ToString("+0;-0")
                                    + ", Bond " + Runner.Relationships.BondChange(couple, a, b).ToString("+0.0;-0.0") + "/day"
                                    + ", Tension " + Runner.Relationships.TensionChange(a, b).ToString("+0.0;-0.0") + "/day"
                                    + ", Breakup " + (Runner.Relationships.BreakupChance(couple, a, b) * 100f).ToString("0.0") + "%/day", new GUIStyle(muted) { wordWrap = true });
                }
            }
            else
            {
                GUILayout.Label(p.IsHeartbroken ? "Single, and heartbroken." : "Single.", label);
            }

            foreach (var link in p.links)
            {
                if (link.type != LinkType.ExPartner) continue;
                var ex = Runner.State.Person(link.otherId);
                if (ex == null) continue;
                GUILayout.BeginHorizontal();
                GUILayout.Label("Ex-partner:", muted, GUILayout.Width(80f));
                if (GUILayout.Button(ex.FullName, GUILayout.Width(150f))) root.Select(ex.id, true);
                GUILayout.FlexibleSpace();
                GUILayout.EndHorizontal();
            }
        }

        void BarRow(string name, float value, Color color)
        {
            GUILayout.BeginHorizontal();
            GUILayout.Label(name, small, GUILayout.Width(70f));
            var r = GUILayoutUtility.GetRect(220f, 12f, GUILayout.Width(220f));
            r.y += 4f;
            r.height = 10f;
            Bar(r, value / 100f, color);
            if (root.ShowNumbers) GUILayout.Label(Mathf.RoundToInt(value).ToString(), muted, GUILayout.Width(30f));
            GUILayout.EndHorizontal();
        }

        void DrawNudges(PersonState p)
        {
            var nudges = Db.nudges;
            for (int i = 0; i < nudges.Count; i += 2)
            {
                GUILayout.BeginHorizontal();
                NudgeButton(p, nudges[i]);
                if (i + 1 < nudges.Count) NudgeButton(p, nudges[i + 1]);
                GUILayout.EndHorizontal();
            }
            GUILayout.Label("Likely / Uncertain / Unlikely is how they will probably react. People have free will.", new GUIStyle(muted) { wordWrap = true });
        }

        void NudgeButton(PersonState p, NudgeDef n)
        {
            var preview = Runner.Influence.Preview(p, n);
            string line2;
            Color hintColor;
            if (preview.Blocked)
            {
                line2 = "Not available";
                hintColor = Muted;
            }
            else
            {
                line2 = preview.hint.ToString();
                hintColor = preview.hint == NudgeHint.Likely ? Effects.Accept : preview.hint == NudgeHint.Unlikely ? Effects.Backfire : Gold;
                if (root.ShowNumbers) line2 += " " + Mathf.RoundToInt(preview.chance * 100f) + "%";
            }
            string text = "<b>" + n.displayName + "</b>\n" + preview.cost + " Influence · <color=#" + Hex(hintColor) + ">" + line2 + "</color>";
            string tip = preview.Blocked ? preview.blockedReason
                : preview.againstNature ? "Pushing them further from their nature is harder."
                : "This goes with their nature, or starts from it.";

            bool wasEnabled = GUI.enabled;
            GUI.enabled = wasEnabled && !preview.Blocked && Runner.State.influence >= preview.cost;
            if (GUILayout.Button(new GUIContent(text, tip), nudgeButton, GUILayout.Width(190f), GUILayout.Height(48f)))
                Runner.Influence.Apply(p.id, n.id);
            GUI.enabled = wasEnabled;
        }

        // ---------- Tooltip and modals ----------

        void DrawTooltip()
        {
            if (string.IsNullOrEmpty(GUI.tooltip)) return;
            var content = new GUIContent(GUI.tooltip);
            float width = 260f;
            float height = bubble.CalcHeight(content, width);
            var m = Event.current.mousePosition;
            var r = new Rect(Mathf.Min(m.x + 16f, vw - width - 4f), Mathf.Min(m.y + 16f, vh - height - 4f), width, height);
            bubble.normal.textColor = Color.white;
            GUI.Box(r, content, bubble);
        }

        Rect ModalRect(float width, float height)
        {
            Fill(new Rect(0f, 0f, vw, vh), new Color(0f, 0f, 0f, 0.45f));
            var r = new Rect((vw - width) / 2f, (vh - height) / 2f, width, height);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Box(r, GUIContent.none, panel);
            return r;
        }

        void DrawIntro()
        {
            var r = ModalRect(560f, 470f);
            GUILayout.BeginArea(new Rect(r.x + 24f, r.y + 20f, r.width - 48f, r.height - 40f));
            GUILayout.Label("Settlement of Hearts", title);
            GUILayout.Label(Db.scenario != null ? Db.scenario.displayName : "", header);
            GUILayout.Space(8f);
            GUILayout.Label(
                "You are an unseen matchmaker watching over a small camp. Six people live here, each with their own personality.\n\n" +
                "<b>Click a person</b> to see who they are, how they feel and who they love.\n" +
                "<b>Spend Influence</b> to nudge them: be a better or worse partner, stay or leave, seek love or stay single.\n" +
                "<b>People have free will.</b> Nudges can be shrugged off or backfire, and people drift back toward their nature. " +
                "Sometimes they change their minds on their own; a <color=#" + Hex(Gold) + ">?!</color> means someone is wavering.\n\n" +
                (Db.scenario != null ? "<b>Goal:</b> " + Db.scenario.goal : ""), modalText);
            GUILayout.Space(8f);
            GUILayout.Label("WASD/arrows pan · Q/E rotate · scroll zoom · Space pause · 1/2/3 speed · R relationships · F1 numbers", muted);
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("Begin", GUILayout.Height(36f))) root.ShowIntro = false;
            GUILayout.EndArea();
        }

        void DrawGoal()
        {
            var report = root.GoalReport;
            var r = ModalRect(540f, 360f);
            GUILayout.BeginArea(new Rect(r.x + 24f, r.y + 20f, r.width - 48f, r.height - 40f));
            GUILayout.Label("Day " + report.day + ": the first month is over", title);
            GUILayout.Label(report.goal, muted);
            GUILayout.Space(10f);
            foreach (var line in report.lines) GUILayout.Label("•  " + line, modalText);
            GUILayout.FlexibleSpace();
            if (GUILayout.Button("Keep playing", GUILayout.Height(34f))) root.GoalReport = null;
            GUILayout.EndArea();
        }
    }
}
