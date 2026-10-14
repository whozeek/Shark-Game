using System.Collections.Generic;
using Hearts.Data;
using Hearts.Sim;
using UnityEditor;
using UnityEngine;

namespace Hearts.EditorTools
{
    // Runs many settlements headless and plots what happened. Most tuning happens here, not in play mode.
    public class SimRunnerWindow : EditorWindow
    {
        static readonly Color[] Palette =
        {
            new Color(0.95f, 0.45f, 0.55f), new Color(0.35f, 0.78f, 0.7f), new Color(0.98f, 0.8f, 0.3f),
            new Color(0.6f, 0.6f, 0.65f), new Color(0.95f, 0.45f, 0.25f), new Color(0.5f, 0.65f, 0.98f),
            new Color(0.75f, 0.55f, 0.95f)
        };

        int runs = 20;
        int days = 1000;
        int firstSeed = 1;
        bool autoMatchmake = true;
        bool useDatabaseAsset = true;
        SimBatch batch;
        readonly HashSet<string> hidden = new HashSet<string>();
        Vector2 scroll;
        string lastSource;

        [MenuItem("Hearts/Sim Runner")]
        public static void Open()
        {
            GetWindow<SimRunnerWindow>("Hearts Sim Runner").minSize = new Vector2(520f, 420f);
        }

        void OnGUI()
        {
            EditorGUILayout.LabelField("Headless runs", EditorStyles.boldLabel);
            runs = Mathf.Clamp(EditorGUILayout.IntField("Runs (seeds)", runs), 1, 500);
            days = Mathf.Clamp(EditorGUILayout.IntField("Days per run", days), 1, 5000);
            firstSeed = EditorGUILayout.IntField("First seed", firstSeed);
            autoMatchmake = EditorGUILayout.Toggle(new GUIContent("Auto-matchmaker", "Introduces the most attracted willing pair whenever a slot is free."), autoMatchmake);
            useDatabaseAsset = EditorGUILayout.Toggle(new GUIContent("Use GameDatabase asset", "Off uses the built-in DefaultContent."), useDatabaseAsset);

            if (GUILayout.Button("Run", GUILayout.Height(28f))) RunBatch();
            if (batch == null)
            {
                EditorGUILayout.HelpBox("Press Run to simulate. Values are averaged across runs, day by day.", MessageType.Info);
                return;
            }

            scroll = EditorGUILayout.BeginScrollView(scroll);
            EditorGUILayout.LabelField(batch.runs + " runs x " + batch.days + " days, content: " + lastSource, EditorStyles.miniLabel);
            if (batch.problems.Count > 0)
                EditorGUILayout.HelpBox("Problems found:\n" + string.Join("\n", batch.problems), MessageType.Error);

            var series = batch.All;
            for (int i = 0; i < series.Count; i++)
            {
                var s = series[i];
                EditorGUILayout.BeginHorizontal();
                var swatch = GUILayoutUtility.GetRect(12f, 12f, GUILayout.Width(12f));
                swatch.y += 3f;
                EditorGUI.DrawRect(swatch, Palette[i % Palette.Length]);
                bool shown = !hidden.Contains(s.name);
                bool now = EditorGUILayout.ToggleLeft(s.name, shown, GUILayout.Width(200f));
                if (now != shown) { if (now) hidden.Remove(s.name); else hidden.Add(s.name); }
                EditorGUILayout.LabelField("end " + batch.Final(s).ToString("0.0") + "   max " + batch.Max(s).ToString("0.0"));
                EditorGUILayout.EndHorizontal();
            }

            var plot = GUILayoutUtility.GetRect(position.width - 20f, 260f);
            DrawPlot(plot, series);
            EditorGUILayout.EndScrollView();
        }

        void RunBatch()
        {
            System.Func<ContentDb> content = DefaultContent.Create;
            lastSource = "built-in DefaultContent";
            if (useDatabaseAsset)
            {
                var asset = Resources.Load<GameDatabase>(GameDatabase.ResourcePath);
                if (asset != null)
                {
                    List<string> errors;
                    asset.ToContentDb(out errors);
                    if (errors.Count > 0)
                    {
                        foreach (var e in errors) Debug.LogError("[Hearts] " + e);
                        EditorUtility.DisplayDialog("GameDatabase has errors", "See the Console. Using built-in content instead.", "OK");
                    }
                    else
                    {
                        content = () => { List<string> ignored; return asset.ToContentDb(out ignored); };
                        lastSource = "Resources/GameDatabase";
                    }
                }
            }
            batch = SimBatch.Run(content, runs, days, firstSeed, autoMatchmake ? (System.Action<SimulationRunner>)SimBatch.GreedyMatchmaker : null);
        }

        void DrawPlot(Rect r, List<SimBatch.Series> series)
        {
            EditorGUI.DrawRect(r, new Color(0.13f, 0.14f, 0.16f));
            float max = 1f;
            foreach (var s in series)
                if (!hidden.Contains(s.name)) max = Mathf.Max(max, batch.Max(s));

            Handles.BeginGUI();
            Handles.color = new Color(1f, 1f, 1f, 0.08f);
            for (int g = 1; g < 4; g++)
            {
                float y = r.yMax - r.height * g / 4f;
                Handles.DrawLine(new Vector3(r.x, y), new Vector3(r.xMax, y));
            }
            for (int i = 0; i < series.Count; i++)
            {
                var s = series[i];
                if (hidden.Contains(s.name) || s.values.Length < 2) continue;
                int n = s.values.Length;
                int step = Mathf.Max(1, n / Mathf.Max(1, (int)r.width));
                var points = new List<Vector3>();
                for (int d = 0; d < n; d += step)
                    points.Add(new Vector3(r.x + r.width * d / (n - 1), r.yMax - r.height * (s.values[d] / max)));
                Handles.color = Palette[i % Palette.Length];
                Handles.DrawAAPolyLine(2f, points.ToArray());
            }
            Handles.EndGUI();

            GUI.Label(new Rect(r.x + 4f, r.y + 2f, 120f, 16f), max.ToString("0.0"), EditorStyles.miniLabel);
            GUI.Label(new Rect(r.x + 4f, r.yMax - 16f, 60f, 16f), "day 1", EditorStyles.miniLabel);
            GUI.Label(new Rect(r.xMax - 70f, r.yMax - 16f, 66f, 16f), "day " + batch.days, EditorStyles.miniLabel);
        }
    }
}
