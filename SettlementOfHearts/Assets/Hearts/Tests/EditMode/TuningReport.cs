using System;
using Hearts.Sim;
using NUnit.Framework;

namespace Hearts.Tests
{
    // Headless balance numbers for the starting scenario. Read the output, don't assert on taste.
    public class TuningReport
    {
        [Test]
        public void StartingScenarioReport()
        {
            const int runs = 300;
            int goodTogether = 0, badTogether = 0;
            for (int seed = 1; seed <= runs; seed++)
            {
                var r = SimulationRunner.NewGame(DefaultContent.Create(), seed);
                r.AdvanceDays(29);
                if (Together(r, "mara", "tomas")) goodTogether++;
                if (Together(r, "ilse", "davin")) badTogether++;
            }

            var db = DefaultContent.Create();
            var g = SimulationRunner.NewGame(db, 1);
            float sum = 0; int n = 0;
            foreach (var p in g.State.people)
                foreach (var nudge in db.nudges)
                {
                    var pv = g.Influence.Preview(p, nudge);
                    if (pv.Blocked) continue;
                    sum += pv.chance; n++;
                }

            var output = TestContext.Out;
            output.WriteLine("Untouched for 30 days over " + runs + " seeds:");
            output.WriteLine("  Mara + Tomas together: " + (100f * goodTogether / runs).ToString("0") + "%");
            output.WriteLine("  Ilse + Davin together: " + (100f * badTogether / runs).ToString("0") + "%");
            output.WriteLine("Average nudge acceptance at start: " + (100f * sum / n).ToString("0") + "%");

            output.WriteLine("Pairs a Matchmake would succeed on at start (attraction):");
            var people = g.State.people;
            for (int i = 0; i < people.Count; i++)
                for (int j = i + 1; j < people.Count; j++)
                {
                    var pv = g.Matchmaking.Preview(people[i], people[j]);
                    if (pv.WillCourt) output.WriteLine("  " + people[i].firstName + " + " + people[j].firstName + ": " + pv.attraction.ToString("0"));
                }

            var idle = SimBatch.Run(DefaultContent.Create, 100, 45);
            var active = SimBatch.Run(DefaultContent.Create, 100, 45, 1, SimBatch.GreedyMatchmaker);
            output.WriteLine("Day 45 averages over 100 seeds   no player | greedy matchmaker");
            foreach (var pair in new[] { Tuple.Create(idle.couples, active.couples), Tuple.Create(idle.established, active.established),
                         Tuple.Create(idle.naturalTotal, active.naturalTotal), Tuple.Create(idle.breakupsTotal, active.breakupsTotal),
                         Tuple.Create(idle.available, active.available) })
                output.WriteLine("  " + pair.Item1.name.PadRight(28) + idle.Final(pair.Item1).ToString("0.0").PadLeft(9) + " | " + active.Final(pair.Item2).ToString("0.0"));

            int goalMet = 0;
            for (int seed = 1; seed <= 100; seed++)
            {
                var r = SimulationRunner.NewGame(DefaultContent.Create(), seed);
                for (int d = 0; d < 45; d++) { SimBatch.GreedyMatchmaker(r); r.AdvanceDays(1); }
                if (r.NewEstablishedCouples() >= 2) goalMet++;
            }
            output.WriteLine("Greedy matchmaker meets the 2-new-couples goal in " + goalMet + "% of runs.");
        }

        static bool Together(SimulationRunner r, string a, string b)
        {
            var pa = r.FindByProfile(a);
            var pb = r.FindByProfile(b);
            return pa.coupleId >= 0 && pa.coupleId == pb.coupleId;
        }
    }
}
