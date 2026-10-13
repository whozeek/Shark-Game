using System;
using System.Collections.Generic;

namespace Hearts.Sim
{
    // Owns the settlement state and ticks systems in a fixed order once per in-game day.
    public class SimulationRunner
    {
        public const float HoursPerDay = 24f;

        public readonly ContentDb Db;
        public readonly SettlementState State;
        public readonly SimEvents Events = new SimEvents();
        public readonly AttitudeSystem Attitudes;
        public readonly InfluenceSystem Influence;
        public readonly RelationshipSystem Relationships;
        public readonly HappinessSystem Happiness;
        readonly SimContext ctx;

        public SimulationRunner(ContentDb db, SettlementState state)
        {
            Db = db;
            State = state;
            ctx = new SimContext(db, state, Events);
            Attitudes = new AttitudeSystem(ctx);
            Influence = new InfluenceSystem(ctx, Attitudes);
            Relationships = new RelationshipSystem(ctx);
            Happiness = new HappinessSystem(ctx);
        }

        public static SimulationRunner NewGame(ContentDb db, int seedOverride = 0)
        {
            var scenario = db.scenario;
            int seed = seedOverride != 0 ? seedOverride : scenario.seed != 0 ? scenario.seed : Environment.TickCount;
            var state = new SettlementState
            {
                scenarioId = scenario.id,
                seed = seed,
                rngState = Rng.SeedState(seed),
                influence = db.settings.startingInfluence,
                maxInfluence = db.settings.maxInfluence
            };
            var runner = new SimulationRunner(db, state);

            var byProfile = new Dictionary<string, PersonState>();
            foreach (var pid in scenario.profileIds)
            {
                var person = runner.SpawnFromProfile(db.Profile(pid));
                byProfile[pid] = person;
            }
            foreach (var seedCouple in scenario.couples)
            {
                runner.Relationships.CreateCouple(byProfile[seedCouple.personA], byProfile[seedCouple.personB],
                    seedCouple.stage, seedCouple.bond, seedCouple.tension);
            }
            foreach (var p in state.people) p.happiness = runner.Happiness.Target(p);
            runner.ctx.Feed("Day 1. " + scenario.goal, -1, FeedKind.Info);
            return runner;
        }

        public PersonState SpawnFromProfile(PersonProfileDef profile)
        {
            var p = new PersonState
            {
                id = State.nextPersonId++,
                profileId = profile.id,
                firstName = profile.firstName,
                familyName = profile.familyName,
                age = profile.age,
                hue = profile.hue,
                bio = profile.bio,
                traits = new float[Db.traits.Count],
                attitudes = new float[Db.attitudes.Count],
                wavering = new bool[Db.attitudes.Count],
                waveringTarget = new float[Db.attitudes.Count],
                quirkIds = new List<string>(profile.quirkIds)
            };
            for (int i = 0; i < p.traits.Length; i++) p.traits[i] = 50f;
            foreach (var t in profile.traits)
            {
                int i = Db.TraitIndex(t.traitId);
                if (i >= 0) p.traits[i] = SimContext.Clamp01x100(t.value);
            }
            for (int a = 0; a < p.attitudes.Length; a++) p.attitudes[a] = Attitudes.RestingPoint(p, a);
            foreach (var av in profile.startingAttitudes)
            {
                int a = Db.AttitudeIndex(av.attitudeId);
                if (a >= 0) p.attitudes[a] = SimContext.Clamp100(av.value);
            }
            State.people.Add(p);
            return p;
        }

        public int Day { get { return State.day; } }

        // Advances the clock. Influence regenerates continuously; daily systems run at midnight.
        public void Advance(float hours)
        {
            if (hours <= 0f) return;
            State.influence = Math.Min(State.maxInfluence, State.influence + Db.settings.influenceRegenPerHour * hours);
            State.hourOfDay += hours;
            while (State.hourOfDay >= HoursPerDay)
            {
                State.hourOfDay -= HoursPerDay;
                DailyTick();
            }
        }

        public void AdvanceDays(int days)
        {
            for (int i = 0; i < days; i++) Advance(HoursPerDay);
        }

        void DailyTick()
        {
            State.day++;
            Events.RaiseDayStarted(State.day);

            foreach (var p in State.people) Relationships.HeartbreakTick(p);
            foreach (var p in State.people) Attitudes.DailyTick(p);
            Relationships.DailyTick();
            foreach (var p in State.people) Happiness.DailyTick(p);

            var scenario = Db.scenario;
            if (!State.goalReported && scenario != null && scenario.goalDays > 0 && State.day >= scenario.goalDays)
            {
                State.goalReported = true;
                Events.RaiseGoal(BuildGoalReport());
            }
        }

        public GoalReport BuildGoalReport()
        {
            var report = new GoalReport { day = State.day, goal = Db.scenario.goal };
            foreach (var c in Db.scenario.couples)
            {
                var a = FindByProfile(c.personA);
                var b = FindByProfile(c.personB);
                if (a == null || b == null) continue;
                bool together = a.coupleId >= 0 && a.coupleId == b.coupleId;
                if (together)
                {
                    var couple = State.Couple(a.coupleId);
                    report.lines.Add(a.firstName + " and " + b.firstName + " are still together (Bond "
                                     + Math.Round(couple.bond) + ", Tension " + Math.Round(couple.tension) + ").");
                }
                else
                {
                    report.lines.Add(a.firstName + " and " + b.firstName + " broke up.");
                }
            }
            var st = State.stats;
            report.lines.Add("Nudges: " + st.nudgesTried + " tried, " + st.accepted + " accepted, "
                             + st.shrugged + " shrugged off, " + st.backfired + " backfired.");
            report.lines.Add("Changes of heart: " + st.flips + ", steadied: " + st.steadied + ".");
            return report;
        }

        public PersonState FindByProfile(string profileId)
        {
            foreach (var p in State.people)
                if (p.profileId == profileId) return p;
            return null;
        }
    }
}
