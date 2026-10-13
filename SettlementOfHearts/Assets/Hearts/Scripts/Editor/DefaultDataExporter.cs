using System.IO;
using Hearts.Data;
using Hearts.Sim;
using UnityEditor;
using UnityEngine;

namespace Hearts.EditorTools
{
    // Writes the built-in content out as ScriptableObject assets so designers can edit it.
    public static class DefaultDataExporter
    {
        const string DataRoot = "Assets/Hearts/Data";
        const string DatabasePath = "Assets/Hearts/Resources/GameDatabase.asset";

        [MenuItem("Hearts/Create Default Data Assets")]
        public static void CreateDefaultData()
        {
            if (File.Exists(DatabasePath) &&
                !EditorUtility.DisplayDialog("Overwrite Hearts data?",
                    "This replaces every asset under " + DataRoot + " and the GameDatabase with the built-in defaults.",
                    "Overwrite", "Cancel"))
                return;

            var content = DefaultContent.Create();
            var db = ScriptableObject.CreateInstance<GameDatabase>();

            foreach (var t in content.traits)
                db.traits.Add(Save<TraitDefinition>("Traits", t.id, a => a.data = t));
            foreach (var a in content.attitudes)
                db.attitudes.Add(Save<AttitudeDefinition>("Attitudes", a.id, x => x.data = a));
            foreach (var q in content.quirks)
                db.quirks.Add(Save<QuirkDefinition>("Quirks", q.id, x => x.data = q));
            foreach (var n in content.nudges)
                db.influenceActions.Add(Save<InfluenceAction>("InfluenceActions", n.id, x => x.data = n));
            foreach (var r in content.compatibilityRules)
                db.compatibilityRules.Add(Save<CompatibilityRule>("CompatibilityRules", r.traitId + "_" + r.mode, x => x.data = r));
            foreach (var p in content.profiles)
                db.people.Add(Save<PersonProfile>("People", p.id, x => x.data = p));
            db.scenario = Save<StartingScenario>("Scenarios", content.scenario.id, x => x.data = content.scenario);
            db.settings = Save<SimulationSettings>("Settings", "SimulationSettings", x => x.data = content.settings);

            EnsureFolder(Path.GetDirectoryName(DatabasePath));
            AssetDatabase.DeleteAsset(DatabasePath);
            AssetDatabase.CreateAsset(db, DatabasePath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Selection.activeObject = db;
            Debug.Log("[Hearts] Created default data under " + DataRoot + " and " + DatabasePath + ".");
        }

        [MenuItem("Hearts/Validate Game Database")]
        public static void Validate()
        {
            var asset = AssetDatabase.LoadAssetAtPath<GameDatabase>(DatabasePath);
            if (asset == null)
            {
                Debug.LogWarning("[Hearts] No GameDatabase at " + DatabasePath + ".");
                return;
            }
            System.Collections.Generic.List<string> errors;
            asset.ToContentDb(out errors);
            if (errors.Count == 0) Debug.Log("[Hearts] GameDatabase is valid.");
            foreach (var e in errors) Debug.LogError("[Hearts] " + e);
        }

        static T Save<T>(string folder, string name, System.Action<T> fill) where T : ScriptableObject
        {
            string dir = DataRoot + "/" + folder;
            EnsureFolder(dir);
            string path = dir + "/" + name + ".asset";
            AssetDatabase.DeleteAsset(path);
            var asset = ScriptableObject.CreateInstance<T>();
            fill(asset);
            AssetDatabase.CreateAsset(asset, path);
            return asset;
        }

        static void EnsureFolder(string path)
        {
            path = path.Replace('\\', '/');
            if (AssetDatabase.IsValidFolder(path)) return;
            string parent = Path.GetDirectoryName(path).Replace('\\', '/');
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, Path.GetFileName(path));
        }
    }
}
