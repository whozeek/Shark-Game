using System;
using System.Collections.Generic;

namespace Hearts.Sim
{
    // Runs many headless settlements and averages what happened, day by day.
    // Used by the Sim Runner editor window and the tuning tests.
    public class SimBatch
    {
        public class Series
        {
            public string name;
            public float[] values;
        }

        public int runs;
        public int days;
        public Series couples, established, available, heartbroken, breakupsTotal, naturalTotal, flipsTotal;
        public List<Series> All { get { return new List<Series> { couples, established, available, heartbroken, breakupsTotal, naturalTotal, flipsTotal }; } }

        // Sanity problems found during the runs (NaN or out-of-range values).
        public readonly List<string> problems = new List<string>();

        // Optional per-day hook for an auto-player, called before each day is simulated.
        public Action<SimulationRunner> policy;

        public static SimBatch Run(Func<ContentDb> content, int runs, int days, int firstSeed = 1, Action<SimulationRunner> policy = null)
        {
            var batch = new SimBatch { runs = runs, days = days, policy = policy };
            batch.couples = NewSeries("Couples", days);
            batch.established = NewSeries("Established", days);
            batch.available = NewSeries("Available singles", days);
            batch.heartbroken = NewSeries("Heartbroken", days);
            batch.breakupsTotal = NewSeries("Breakups (total)", days);
            batch.naturalTotal = NewSeries("Natural couples (total)", days);
            batch.flipsTotal = NewSeries("Changes of heart (total)", days);

            for (int r = 0; r < runs; r++)
            {
                var runner = SimulationRunner.NewGame(content(), firstSeed + r);
                for (int d = 0; d < days; d++)
                {
                    if (policy != null) policy(runner);
                    runner.AdvanceDays(1);
                    batch.Sample(runner, d);
                }
            }

            foreach (var s in batch.All)
                for (int d = 0; d < days; d++) s.values[d] /= Math.Max(1, runs);
            return batch;
        }

        static Series NewSeries(string name, int days)
        {
            return new Series { name = name, values = new float[days] };
        }

        void Sample(SimulationRunner r, int d)
        {
            var st = r.State;
            int est = 0;
            foreach (var c in st.couples)
            {
                if (c.stage == CoupleStage.Established) est++;
                if (float.IsNaN(c.bond) || float.IsNaN(c.tension) || c.bond < 0 || c.bond > 100 || c.tension < 0 || c.tension > 100)
                    Problem("Couple " + c.id + " has Bond " + c.bond + ", Tension " + c.tension + " on day " + st.day);
            }
            int avail = 0, broken = 0;
            foreach (var p in st.people)
            {
                if (r.Relationships.IsAvailable(p)) avail++;
                if (p.IsHeartbroken) broken++;
                foreach (var a in p.attitudes)
                    if (float.IsNaN(a) || a < -100f || a > 100f) Problem(p.firstName + " has attitude " + a + " on day " + st.day);
                if (float.IsNaN(p.happiness)) Problem(p.firstName + " has NaN happiness on day " + st.day);
            }
            couples.values[d] += st.couples.Count;
            established.values[d] += est;
            available.values[d] += avail;
            heartbroken.values[d] += broken;
            breakupsTotal.values[d] += st.stats.breakups;
            naturalTotal.values[d] += st.stats.naturalCouples;
            flipsTotal.values[d] += st.stats.flips;
        }

        void Problem(string text)
        {
            if (problems.Count < 50) problems.Add(text);
        }

        public float Final(Series s) { return s.values.Length > 0 ? s.values[s.values.Length - 1] : 0f; }

        public float Max(Series s)
        {
            float m = 0f;
            foreach (var v in s.values) m = Math.Max(m, v);
            return m;
        }

        // A simple auto-player: introduces the most attracted willing pair whenever a slot is free.
        public static void GreedyMatchmaker(SimulationRunner r)
        {
            if (r.Relationships.FreeSlots() <= 0 || r.State.influence < r.Db.settings.matchmakeCost) return;
            PersonState bestA = null, bestB = null;
            float best = float.MinValue;
            var people = r.State.people;
            for (int i = 0; i < people.Count; i++)
                for (int j = i + 1; j < people.Count; j++)
                {
                    var pv = r.Matchmaking.Preview(people[i], people[j]);
                    if (!pv.WillCourt || pv.attraction <= best) continue;
                    best = pv.attraction;
                    bestA = people[i];
                    bestB = people[j];
                }
            if (bestA != null) r.Matchmaking.Introduce(bestA.id, bestB.id);
        }
    }
}
