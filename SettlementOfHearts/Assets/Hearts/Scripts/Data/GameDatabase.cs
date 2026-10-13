using System.Collections.Generic;
using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // Lists every definition asset. The game loads the one at Resources/GameDatabase;
    // without it, the built-in DefaultContent is used.
    [CreateAssetMenu(menuName = "Hearts/Game Database", fileName = "GameDatabase")]
    public class GameDatabase : ScriptableObject
    {
        public const string ResourcePath = "GameDatabase";

        [Tooltip("Order matters: it is the index order used for trait arrays.")]
        public List<TraitDefinition> traits = new List<TraitDefinition>();
        public List<AttitudeDefinition> attitudes = new List<AttitudeDefinition>();
        public List<QuirkDefinition> quirks = new List<QuirkDefinition>();
        public List<InfluenceAction> influenceActions = new List<InfluenceAction>();
        public List<CompatibilityRule> compatibilityRules = new List<CompatibilityRule>();
        public List<PersonProfile> people = new List<PersonProfile>();
        public StartingScenario scenario;
        public SimulationSettings settings;

        // Copies the asset data so play mode can never write back into the assets.
        public ContentDb ToContentDb(out List<string> errors)
        {
            var db = new ContentDb();
            foreach (var t in traits) if (t != null) db.traits.Add(Copy(t.data));
            foreach (var a in attitudes) if (a != null) db.attitudes.Add(Copy(a.data));
            foreach (var q in quirks) if (q != null) db.quirks.Add(Copy(q.data));
            foreach (var n in influenceActions) if (n != null) db.nudges.Add(Copy(n.data));
            foreach (var r in compatibilityRules) if (r != null) db.compatibilityRules.Add(Copy(r.data));
            foreach (var p in people) if (p != null) db.profiles.Add(Copy(p.data));
            db.scenario = scenario != null ? Copy(scenario.data) : null;
            db.settings = settings != null ? Copy(settings.data) : new SimSettings();
            errors = db.Build();
            return db;
        }

        static T Copy<T>(T source)
        {
            return JsonUtility.FromJson<T>(JsonUtility.ToJson(source));
        }

        public static ContentDb LoadOrDefault()
        {
            var asset = Resources.Load<GameDatabase>(ResourcePath);
            if (asset == null)
            {
                Debug.Log("[Hearts] No Resources/GameDatabase asset found; using built-in content. " +
                          "Use Hearts > Create Default Data Assets to make editable data.");
                return DefaultContent.Create();
            }

            List<string> errors;
            var db = asset.ToContentDb(out errors);
            if (errors.Count == 0) return db;

            foreach (var e in errors) Debug.LogError("[Hearts] GameDatabase: " + e);
            Debug.LogWarning("[Hearts] GameDatabase has errors; falling back to built-in content.");
            return DefaultContent.Create();
        }
    }
}
