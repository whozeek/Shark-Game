using System;
using System.Collections.Generic;

namespace Hearts.Sim
{
    // All design data the simulation reads, with index lookups. Built either from
    // DefaultContent or from the GameDatabase ScriptableObject in Unity.
    public class ContentDb
    {
        public readonly List<TraitDef> traits = new List<TraitDef>();
        public readonly List<AttitudeDef> attitudes = new List<AttitudeDef>();
        public readonly List<QuirkDef> quirks = new List<QuirkDef>();
        public readonly List<NudgeDef> nudges = new List<NudgeDef>();
        public readonly List<CompatibilityRuleDef> compatibilityRules = new List<CompatibilityRuleDef>();
        public readonly List<PersonProfileDef> profiles = new List<PersonProfileDef>();
        public ScenarioDef scenario;
        public SimSettings settings = new SimSettings();

        readonly Dictionary<string, int> traitIndex = new Dictionary<string, int>();
        readonly Dictionary<string, int> attitudeIndex = new Dictionary<string, int>();
        readonly Dictionary<string, QuirkDef> quirkById = new Dictionary<string, QuirkDef>();
        readonly Dictionary<string, NudgeDef> nudgeById = new Dictionary<string, NudgeDef>();
        readonly Dictionary<string, PersonProfileDef> profileById = new Dictionary<string, PersonProfileDef>();

        // Cached indices of the traits and attitudes the formulas use.
        public int Stubbornness { get; private set; }
        public int Volatility { get; private set; }
        public int Ambition { get; private set; }
        public int PartnerDisposition { get; private set; }
        public int Commitment { get; private set; }
        public int RelationshipDesire { get; private set; }

        // Call after filling the lists. Returns a list of problems; empty means valid.
        public List<string> Build()
        {
            var errors = new List<string>();
            traitIndex.Clear();
            attitudeIndex.Clear();
            quirkById.Clear();
            nudgeById.Clear();
            profileById.Clear();

            for (int i = 0; i < traits.Count; i++)
            {
                if (traits[i] == null || string.IsNullOrEmpty(traits[i].id)) { errors.Add("Trait " + i + " has no id."); continue; }
                if (traitIndex.ContainsKey(traits[i].id)) errors.Add("Duplicate trait id '" + traits[i].id + "'.");
                else traitIndex[traits[i].id] = i;
            }
            for (int i = 0; i < attitudes.Count; i++)
            {
                if (attitudes[i] == null || string.IsNullOrEmpty(attitudes[i].id)) { errors.Add("Attitude " + i + " has no id."); continue; }
                if (attitudeIndex.ContainsKey(attitudes[i].id)) errors.Add("Duplicate attitude id '" + attitudes[i].id + "'.");
                else attitudeIndex[attitudes[i].id] = i;
            }
            foreach (var q in quirks)
            {
                if (q == null || string.IsNullOrEmpty(q.id)) { errors.Add("A quirk has no id."); continue; }
                quirkById[q.id] = q;
            }
            foreach (var n in nudges)
            {
                if (n == null || string.IsNullOrEmpty(n.id)) { errors.Add("A nudge has no id."); continue; }
                nudgeById[n.id] = n;
                if (!attitudeIndex.ContainsKey(n.attitudeId ?? "")) errors.Add("Nudge '" + n.id + "' targets unknown attitude '" + n.attitudeId + "'.");
            }
            foreach (var p in profiles)
            {
                if (p == null || string.IsNullOrEmpty(p.id)) { errors.Add("A person profile has no id."); continue; }
                profileById[p.id] = p;
                foreach (var t in p.traits)
                    if (!traitIndex.ContainsKey(t.traitId ?? "")) errors.Add("Profile '" + p.id + "' sets unknown trait '" + t.traitId + "'.");
                foreach (var qid in p.quirkIds)
                    if (!quirkById.ContainsKey(qid ?? "")) errors.Add("Profile '" + p.id + "' has unknown quirk '" + qid + "'.");
            }
            foreach (var a in attitudes)
                foreach (var w in a.restWeights)
                    if (!traitIndex.ContainsKey(w.traitId ?? "")) errors.Add("Attitude '" + a.id + "' weights unknown trait '" + w.traitId + "'.");
            foreach (var r in compatibilityRules)
                if (!traitIndex.ContainsKey(r.traitId ?? "")) errors.Add("Compatibility rule uses unknown trait '" + r.traitId + "'.");

            Stubbornness = Require(traitIndex, TraitIds.Stubbornness, "trait", errors);
            Volatility = Require(traitIndex, TraitIds.Volatility, "trait", errors);
            Ambition = Require(traitIndex, TraitIds.Ambition, "trait", errors);
            PartnerDisposition = Require(attitudeIndex, AttitudeIds.PartnerDisposition, "attitude", errors);
            Commitment = Require(attitudeIndex, AttitudeIds.Commitment, "attitude", errors);
            RelationshipDesire = Require(attitudeIndex, AttitudeIds.RelationshipDesire, "attitude", errors);

            if (scenario == null) errors.Add("No starting scenario.");
            else
            {
                foreach (var pid in scenario.profileIds)
                    if (!profileById.ContainsKey(pid ?? "")) errors.Add("Scenario uses unknown profile '" + pid + "'.");
                foreach (var c in scenario.couples)
                    if (!scenario.profileIds.Contains(c.personA) || !scenario.profileIds.Contains(c.personB))
                        errors.Add("Scenario couple " + c.personA + " + " + c.personB + " uses people not in the scenario.");
            }
            if (settings == null) settings = new SimSettings();
            return errors;
        }

        static int Require(Dictionary<string, int> map, string id, string kind, List<string> errors)
        {
            int i;
            if (map.TryGetValue(id, out i)) return i;
            errors.Add("Required " + kind + " '" + id + "' is missing.");
            return 0;
        }

        public int TraitIndex(string id) { int i; return traitIndex.TryGetValue(id ?? "", out i) ? i : -1; }
        public int AttitudeIndex(string id) { int i; return attitudeIndex.TryGetValue(id ?? "", out i) ? i : -1; }
        public QuirkDef Quirk(string id) { QuirkDef q; return quirkById.TryGetValue(id ?? "", out q) ? q : null; }
        public NudgeDef Nudge(string id) { NudgeDef n; return nudgeById.TryGetValue(id ?? "", out n) ? n : null; }
        public PersonProfileDef Profile(string id) { PersonProfileDef p; return profileById.TryGetValue(id ?? "", out p) ? p : null; }

        public IEnumerable<QuirkDef> QuirksOf(PersonState p)
        {
            foreach (var id in p.quirkIds)
            {
                var q = Quirk(id);
                if (q != null) yield return q;
            }
        }

        public static string Fill(string template, PersonState p)
        {
            if (string.IsNullOrEmpty(template)) return "";
            return template.Replace("{name}", p.firstName);
        }
    }
}
