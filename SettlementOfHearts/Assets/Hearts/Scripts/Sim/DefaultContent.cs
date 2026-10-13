using System.Collections.Generic;

namespace Hearts.Sim
{
    // The built-in content for the influence toy (build step 1). In Unity, the menu
    // "Hearts > Create Default Data Assets" writes this out as editable ScriptableObjects.
    public static class DefaultContent
    {
        public static ContentDb Create()
        {
            var db = new ContentDb();
            db.traits.AddRange(Traits());
            db.attitudes.AddRange(Attitudes());
            db.quirks.AddRange(Quirks());
            db.nudges.AddRange(Nudges());
            db.compatibilityRules.AddRange(CompatibilityRules());
            db.profiles.AddRange(Profiles());
            db.scenario = Scenario();
            db.settings = new SimSettings();
            db.Build();
            return db;
        }

        static TraitDef Trait(string id, string name, string low, string mid, string high, string description)
        {
            return new TraitDef { id = id, displayName = name, lowLabel = low, midLabel = mid, highLabel = high, description = description };
        }

        public static List<TraitDef> Traits()
        {
            return new List<TraitDef>
            {
                Trait(TraitIds.Warmth, "Warmth", "Cold", "Polite", "Warm", "How kind and affectionate they are. Sets how good a partner they are by nature."),
                Trait(TraitIds.Loyalty, "Loyalty", "Restless", "Dependable", "Devoted", "How strongly they stick with the people they love."),
                Trait(TraitIds.Volatility, "Volatility", "Calm", "Changeable", "Volatile", "How moody and impulsive they are. Volatile people change their minds more often."),
                Trait(TraitIds.Independence, "Independence", "Clingy", "Balanced", "Self-reliant", "How happy they are on their own."),
                Trait(TraitIds.Stubbornness, "Stubbornness", "Suggestible", "Firm", "Headstrong", "How hard they resist being nudged."),
                Trait(TraitIds.Sociability, "Sociability", "Shy", "Friendly", "Outgoing", "How much they seek out other people."),
                Trait(TraitIds.Ambition, "Ambition", "Content", "Motivated", "Driven", "How driven they are. Big gaps in ambition cause friction in couples.")
            };
        }

        public static List<AttitudeDef> Attitudes()
        {
            return new List<AttitudeDef>
            {
                new AttitudeDef
                {
                    id = AttitudeIds.PartnerDisposition,
                    displayName = "Partner",
                    negativeLabel = "Bad partner",
                    positiveLabel = "Good partner",
                    restWeights = new List<TraitWeight>
                    {
                        new TraitWeight(TraitIds.Warmth, 0.8f),
                        new TraitWeight(TraitIds.Loyalty, 0.4f),
                        new TraitWeight(TraitIds.Volatility, -0.3f)
                    },
                    flipUpLine = "{name} had a change of heart and resolved to be a better partner.",
                    flipDownLine = "{name} grew careless and selfish toward the people close to them.",
                    thoughtUp = "I've been unfair. I can do better.",
                    thoughtDown = "Why should I always be the one who tries?"
                },
                new AttitudeDef
                {
                    id = AttitudeIds.Commitment,
                    displayName = "Commitment",
                    negativeLabel = "Wants to leave",
                    positiveLabel = "Wants to stay",
                    restWeights = new List<TraitWeight>
                    {
                        new TraitWeight(TraitIds.Loyalty, 0.9f),
                        new TraitWeight(TraitIds.Volatility, -0.4f),
                        new TraitWeight(TraitIds.Independence, -0.3f)
                    },
                    flipUpLine = "{name} decided this relationship is worth fighting for.",
                    flipDownLine = "{name} started wondering what life would be like alone.",
                    thoughtUp = "We're worth fighting for.",
                    thoughtDown = "Maybe I'd be better off on my own."
                },
                new AttitudeDef
                {
                    id = AttitudeIds.RelationshipDesire,
                    displayName = "Love life",
                    negativeLabel = "Wants to be single",
                    positiveLabel = "Wants a relationship",
                    restWeights = new List<TraitWeight>
                    {
                        new TraitWeight(TraitIds.Independence, -0.9f),
                        new TraitWeight(TraitIds.Sociability, 0.4f)
                    },
                    flipUpLine = "{name} realised they'd like someone to share their life with.",
                    flipDownLine = "{name} decided they're happier on their own for now.",
                    thoughtUp = "It would be nice to have someone.",
                    thoughtDown = "I like my own company just fine."
                }
            };
        }

        public static List<QuirkDef> Quirks()
        {
            return new List<QuirkDef>
            {
                new QuirkDef { id = "contrarian", displayName = "Contrarian", description = "25% chance any nudge has the opposite effect.", backfireBonus = 0.25f },
                new QuirkDef
                {
                    id = "hopeless_romantic", displayName = "Hopeless Romantic",
                    description = "Longs for love; heartbreak lasts twice as long.",
                    restOffsets = new List<AttitudeModifier> { new AttitudeModifier(AttitudeIds.RelationshipDesire, 40f) },
                    heartbreakMultiplier = 2f
                },
                new QuirkDef
                {
                    id = "lone_wolf", displayName = "Lone Wolf",
                    description = "Prefers being single, and never counts against the settlement for it.",
                    restOffsets = new List<AttitudeModifier> { new AttitudeModifier(AttitudeIds.RelationshipDesire, -40f) },
                    excludedFromSinglesPenalty = true
                },
                new QuirkDef { id = "redeemable", displayName = "Redeemable", description = "When a bad partner, has a 3% daily chance to reform.", redeemable = true },
                new QuirkDef
                {
                    id = "fickle", displayName = "Fickle",
                    description = "Commitment drifts three times faster.",
                    driftMultipliers = new List<AttitudeModifier> { new AttitudeModifier(AttitudeIds.Commitment, 3f) }
                },
                new QuirkDef { id = "peacemaker", displayName = "Peacemaker", description = "Their partner lets go of arguments 50% faster.", partnerTensionCoolingMultiplier = 1.5f },
                new QuirkDef { id = "impressionable", displayName = "Impressionable", description = "Influence costs 30% less on them.", influenceCostMultiplier = 0.7f }
            };
        }

        public static List<NudgeDef> Nudges()
        {
            return new List<NudgeDef>
            {
                new NudgeDef
                {
                    id = "good_partner", displayName = "Be a Good Partner", attitudeId = AttitudeIds.PartnerDisposition, direction = 1, cost = 10,
                    acceptLine = "I should be kinder at home.", shrugLine = "I'm fine as I am.", backfireLine = "Who are you to tell me how to love?"
                },
                new NudgeDef
                {
                    id = "bad_partner", displayName = "Be a Bad Partner", attitudeId = AttitudeIds.PartnerDisposition, direction = -1, cost = 10,
                    acceptLine = "Why should I do all the giving?", shrugLine = "No, that's not who I am.", backfireLine = "I'll prove you wrong. I'll be better."
                },
                new NudgeDef
                {
                    id = "stay", displayName = "Stay Together", attitudeId = AttitudeIds.Commitment, direction = 1, cost = 12, requiresPartner = true,
                    acceptLine = "We're worth the effort.", shrugLine = "We'll see.", backfireLine = "Don't tell me who to stay with."
                },
                new NudgeDef
                {
                    id = "leave", displayName = "Leave Them", attitudeId = AttitudeIds.Commitment, direction = -1, cost = 12, requiresPartner = true,
                    acceptLine = "Maybe it's time I moved on.", shrugLine = "I'm not going anywhere.", backfireLine = "I'm staying, and that's that."
                },
                new NudgeDef
                {
                    id = "seek_love", displayName = "Seek Love", attitudeId = AttitudeIds.RelationshipDesire, direction = 1, cost = 8,
                    acceptLine = "Maybe I should open my heart.", shrugLine = "Love can wait.", backfireLine = "I don't need anyone."
                },
                new NudgeDef
                {
                    id = "stay_single", displayName = "Stay Single", attitudeId = AttitudeIds.RelationshipDesire, direction = -1, cost = 8,
                    acceptLine = "I'm better off on my own.", shrugLine = "I'd still like someone.", backfireLine = "I'm not going to be alone forever."
                }
            };
        }

        public static List<CompatibilityRuleDef> CompatibilityRules()
        {
            return new List<CompatibilityRuleDef>
            {
                new CompatibilityRuleDef { traitId = TraitIds.Warmth, mode = CompatibilityMode.BothHigh, weight = 25 },
                new CompatibilityRuleDef { traitId = TraitIds.Ambition, mode = CompatibilityMode.Similar, weight = 20 },
                new CompatibilityRuleDef { traitId = TraitIds.Independence, mode = CompatibilityMode.Similar, weight = 20 },
                new CompatibilityRuleDef { traitId = TraitIds.Volatility, mode = CompatibilityMode.BothLow, weight = 15 },
                new CompatibilityRuleDef { traitId = TraitIds.Sociability, mode = CompatibilityMode.Similar, weight = 10 },
                new CompatibilityRuleDef { traitId = TraitIds.Stubbornness, mode = CompatibilityMode.PenaliseBothHigh, weight = 10 }
            };
        }

        static PersonProfileDef Person(string id, string first, string family, int age, float hue, string bio,
            float warmth, float loyalty, float volatility, float independence, float stubbornness, float sociability, float ambition,
            params string[] quirks)
        {
            return new PersonProfileDef
            {
                id = id, firstName = first, familyName = family, age = age, hue = hue, bio = bio,
                traits = new List<TraitValue>
                {
                    new TraitValue(TraitIds.Warmth, warmth),
                    new TraitValue(TraitIds.Loyalty, loyalty),
                    new TraitValue(TraitIds.Volatility, volatility),
                    new TraitValue(TraitIds.Independence, independence),
                    new TraitValue(TraitIds.Stubbornness, stubbornness),
                    new TraitValue(TraitIds.Sociability, sociability),
                    new TraitValue(TraitIds.Ambition, ambition)
                },
                quirkIds = new List<string>(quirks)
            };
        }

        public static List<PersonProfileDef> Profiles()
        {
            var davin = Person("davin", "Davin", "Cole", 30, 0.33f,
                "A charming drifter who has never stayed anywhere long. Knows he could be better.",
                28, 30, 60, 60, 40, 55, 25, "fickle", "redeemable");
            davin.startingAttitudes.Add(new AttitudeValue(AttitudeIds.PartnerDisposition, -55f));

            return new List<PersonProfileDef>
            {
                Person("mara", "Mara", "Hale", 29, 0.06f,
                    "The settlement's healer. Patient, generous, and slow to anger.",
                    82, 85, 20, 40, 45, 65, 45, "peacemaker"),
                Person("tomas", "Tomas", "Reed", 31, 0.58f,
                    "A carpenter with big plans for the settlement, sometimes at the cost of his evenings.",
                    72, 74, 50, 45, 55, 50, 78),
                Person("ilse", "Ilse", "Varga", 27, 0.92f,
                    "Fierce, brilliant and quick to argue. Does the opposite of what she's told, often on purpose.",
                    45, 50, 78, 70, 80, 70, 88, "contrarian"),
                davin,
                Person("oren", "Oren", "Pike", 24, 0.75f,
                    "A shy young shepherd who writes poems he never shows anyone.",
                    70, 72, 35, 25, 30, 30, 40, "hopeless_romantic"),
                Person("sela", "Sela", "Moss", 33, 0.45f,
                    "A scout who spends days alone in the hills and likes it that way.",
                    60, 55, 25, 85, 35, 45, 70, "lone_wolf", "impressionable")
            };
        }

        public static ScenarioDef Scenario()
        {
            return new ScenarioDef
            {
                id = "first_month",
                displayName = "The First Month",
                goal = "Keep Mara and Tomas together, and decide what to do about Ilse and Davin, for 30 days.",
                goalDays = 30,
                profileIds = new List<string> { "mara", "tomas", "ilse", "davin", "oren", "sela" },
                couples = new List<CoupleSeedDef>
                {
                    new CoupleSeedDef { personA = "mara", personB = "tomas", stage = CoupleStage.Established, bond = 68, tension = 15 },
                    new CoupleSeedDef { personA = "ilse", personB = "davin", stage = CoupleStage.Established, bond = 45, tension = 38 }
                }
            };
        }
    }
}
