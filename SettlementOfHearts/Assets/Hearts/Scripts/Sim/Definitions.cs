using System;
using System.Collections.Generic;

namespace Hearts.Sim
{
    // Design-time definitions. These are plain serializable classes so the simulation
    // never depends on UnityEngine. ScriptableObjects in Hearts.Data wrap them.

    [Serializable]
    public class TraitDef
    {
        public string id;
        public string displayName;
        public string lowLabel;
        public string midLabel;
        public string highLabel;
        public string description;
    }

    [Serializable]
    public struct TraitWeight
    {
        public string traitId;
        public float weight;

        public TraitWeight(string traitId, float weight)
        {
            this.traitId = traitId;
            this.weight = weight;
        }
    }

    [Serializable]
    public class AttitudeDef
    {
        public string id;
        public string displayName;
        public string negativeLabel;
        public string positiveLabel;
        // Resting point = restBias + sum(weight * (trait - 50)) + quirk offsets.
        public List<TraitWeight> restWeights = new List<TraitWeight>();
        public float restBias;
        // Story lines for spontaneous changes of heart. {name} is replaced.
        public string flipUpLine;
        public string flipDownLine;
        public string thoughtUp;
        public string thoughtDown;
    }

    [Serializable]
    public struct AttitudeModifier
    {
        public string attitudeId;
        public float value;

        public AttitudeModifier(string attitudeId, float value)
        {
            this.attitudeId = attitudeId;
            this.value = value;
        }
    }

    [Serializable]
    public class QuirkDef
    {
        public string id;
        public string displayName;
        public string description;
        public float backfireBonus;
        public float influenceCostMultiplier = 1f;
        public List<AttitudeModifier> restOffsets = new List<AttitudeModifier>();
        public List<AttitudeModifier> driftMultipliers = new List<AttitudeModifier>();
        public float heartbreakMultiplier = 1f;
        public bool redeemable;
        public float partnerTensionCoolingMultiplier = 1f;
        public bool excludedFromSinglesPenalty;
    }

    public enum CompatibilityMode
    {
        Similar,
        BothHigh,
        BothLow,
        PenaliseBothHigh
    }

    [Serializable]
    public class CompatibilityRuleDef
    {
        public string traitId;
        public CompatibilityMode mode;
        public float weight = 10f;
    }

    [Serializable]
    public class NudgeDef
    {
        public string id;
        public string displayName;
        public string attitudeId;
        public int direction = 1;
        public float strength = 30f;
        public int cost = 10;
        public string acceptLine;
        public string shrugLine;
        public string backfireLine;
        // Nudges about a partner make no sense for single people.
        public bool requiresPartner;
    }

    [Serializable]
    public struct TraitValue
    {
        public string traitId;
        public float value;

        public TraitValue(string traitId, float value)
        {
            this.traitId = traitId;
            this.value = value;
        }
    }

    [Serializable]
    public struct AttitudeValue
    {
        public string attitudeId;
        public float value;

        public AttitudeValue(string attitudeId, float value)
        {
            this.attitudeId = attitudeId;
            this.value = value;
        }
    }

    [Serializable]
    public class PersonProfileDef
    {
        public string id;
        public string firstName;
        public string familyName;
        public int age = 25;
        public float hue;
        public string bio;
        public List<TraitValue> traits = new List<TraitValue>();
        public List<string> quirkIds = new List<string>();
        // Attitudes not listed here start at the person's resting point.
        public List<AttitudeValue> startingAttitudes = new List<AttitudeValue>();
    }

    public enum CoupleStage
    {
        Courting,
        Dating,
        Established
    }

    [Serializable]
    public class CoupleSeedDef
    {
        public string personA;
        public string personB;
        public CoupleStage stage = CoupleStage.Established;
        public float bond = 50f;
        public float tension = 10f;
    }

    [Serializable]
    public class ScenarioDef
    {
        public string id;
        public string displayName;
        public string goal;
        public int goalDays = 30;
        // 0 picks a random seed at game start.
        public int seed;
        public List<string> profileIds = new List<string>();
        public List<CoupleSeedDef> couples = new List<CoupleSeedDef>();
        // How many new Established couples the goal asks for. 0 means none.
        public int newCoupleTarget;
    }

    [Serializable]
    public class SimSettings
    {
        // Influence
        public float startingInfluence = 30f;
        public float maxInfluence = 50f;
        public float influenceRegenPerHour = 1f;
        public float steadyCostMultiplier = 2f;

        // Acceptance roll
        public float acceptBase = 0.80f;
        public float acceptStubbornness = 0.45f;
        public float acceptAgainstNature = 0.25f;
        public float againstNatureDeadZone = 15f;
        public float acceptFatigue = 0.10f;
        public float acceptMin = 0.05f;
        public float acceptMax = 0.95f;
        public int fatigueWindowDays = 2;
        public float shrugShareOfFailure = 0.8f;
        public float backfireStrengthFactor = 0.5f;
        public float likelyThreshold = 0.65f;
        public float unlikelyThreshold = 0.35f;

        // Free will
        public float driftPerDay = 0.05f;
        // Daily random mood swing (standard deviation) for a person with Volatility 100.
        public float moodSwingPerDay = 8f;
        public float flipBaseChance = 0.005f;
        public float flipDistanceScale = 50f;
        public float flipMinDistance = 10f;
        public float flipOvershoot = 0.5f;
        public float redeemableThreshold = -50f;
        public float redeemableDailyChance = 0.03f;
        public float redeemableFlipTo = 30f;

        // Couples
        public float bondFromCompatibility = 0.04f;
        public float bondFromDisposition = 0.05f;
        public float bondFromCommitment = 0.03f;
        // Extra daily Bond while Courting or Dating: new love moves fast.
        public float newRomanceBondBonus = 2f;
        // Daily Bond lost by Established couples to routine; good partners outpace it, bad ones don't.
        public float establishedBondWear = 1.5f;
        public float tensionFromBadPartner = 0.06f;
        public float tensionFromAmbitionGap = 0.003f;
        public float tensionCoolingPerDay = 2f;
        public float sparkRange = 15f;
        public float datingBond = 30f;
        public float establishedBond = 70f;
        public int establishedDays = 7;
        public float breakupBaseChance = 0.02f;
        public float breakupPerTenCommitment = 0.01f;
        public float breakupEarlyStageMultiplier = 2f;
        public int heartbreakDays = 10;
        public float heartbreakDesire = -50f;

        // Matchmaking and meeting people
        public int startingMatchmakingSlots = 1;
        public int matchmakeCost = 15;
        public float matchmakeRefundOnFail = 0.5f;
        public float matchmakeMinDesire = -20f;
        public float matchmakeMinAttraction = 55f;
        public float naturalMinDesire = 20f;
        public float naturalMinAttraction = 60f;
        public float naturalCourtshipChance = 0.35f;
        public float sociabilityPerExtraMeeting = 34f;
        public float exAttractionPenalty = 20f;
        public float badReputationThreshold = -40f;
        public int badReputationDays = 14;
        public float badReputationPenalty = 15f;
        public int friendMeetings = 5;
        public float friendCompatibility = 55f;
        public float rivalCompatibility = 35f;
        public int adultAge = 18;

        // Happiness
        public float happinessRest = 60f;
        public float happinessGoodPartner = 15f;
        public float happinessBadPartner = -20f;
        public float happinessHeartbroken = -30f;
        public float happinessLonely = -10f;
        public float goodPartnerThreshold = 30f;
        public float badPartnerThreshold = -30f;
        public float lonelyDesireThreshold = 40f;
        public float happinessMovePerDay = 0.25f;
    }

    // Ids the simulation's formulas depend on. Content must define these.
    public static class TraitIds
    {
        public const string Warmth = "warmth";
        public const string Loyalty = "loyalty";
        public const string Volatility = "volatility";
        public const string Independence = "independence";
        public const string Stubbornness = "stubbornness";
        public const string Sociability = "sociability";
        public const string Ambition = "ambition";
    }

    public static class AttitudeIds
    {
        public const string PartnerDisposition = "partner_disposition";
        public const string Commitment = "commitment";
        public const string RelationshipDesire = "relationship_desire";
    }
}
