using System;
using Hearts.Sim;
using NUnit.Framework;

namespace Hearts.Tests
{
    // Headless balance numbers for the first scenario. Read the output, don't assert on taste.
    public class TuningReport
    {
        [Test]
        public void FirstMonthReport()
        {
            const int runs = 500;
            int goodTogether = 0, badTogether = 0, flips = 0;
            float splitDaySum = 0; int splits = 0;
            for (int seed = 1; seed <= runs; seed++)
            {
                var r = SimulationRunner.NewGame(DefaultContent.Create(), seed);
                int splitDay = -1;
                r.Events.BrokeUp += c => { if (splitDay < 0) splitDay = r.State.day; };
                r.AdvanceDays(29);
                if (r.FindByProfile("mara").coupleId >= 0 && r.FindByProfile("mara").coupleId == r.FindByProfile("tomas").coupleId) goodTogether++;
                if (r.FindByProfile("ilse").coupleId >= 0 && r.FindByProfile("ilse").coupleId == r.FindByProfile("davin").coupleId) badTogether++;
                if (splitDay > 0) { splitDaySum += splitDay; splits++; }
                flips += r.State.stats.flips;
            }

            // Average acceptance over every nudge on every person at game start.
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

            TestContext.Out.WriteLine("Untouched for 30 days over " + runs + " seeds:");
            TestContext.Out.WriteLine("  Mara + Tomas together: " + (100f * goodTogether / runs).ToString("0") + "%");
            TestContext.Out.WriteLine("  Ilse + Davin together: " + (100f * badTogether / runs).ToString("0") + "%");
            TestContext.Out.WriteLine("  First breakup day (avg): " + (splits > 0 ? (splitDaySum / splits).ToString("0.0") : "-"));
            TestContext.Out.WriteLine("  Changes of heart per run: " + ((float)flips / runs).ToString("0.00"));
            TestContext.Out.WriteLine("Average nudge acceptance at start: " + (100f * sum / n).ToString("0") + "%");
        }
    }
}
