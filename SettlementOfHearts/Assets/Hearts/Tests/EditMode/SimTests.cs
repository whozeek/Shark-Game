using System;
using Hearts.Sim;
using NUnit.Framework;

namespace Hearts.Tests
{
    public class SimTests
    {
        static SimulationRunner NewRunner(int seed = 12345)
        {
            return SimulationRunner.NewGame(DefaultContent.Create(), seed);
        }

        [Test]
        public void DefaultContentIsValid()
        {
            var db = new ContentDb();
            db.traits.AddRange(DefaultContent.Traits());
            db.attitudes.AddRange(DefaultContent.Attitudes());
            db.quirks.AddRange(DefaultContent.Quirks());
            db.nudges.AddRange(DefaultContent.Nudges());
            db.compatibilityRules.AddRange(DefaultContent.CompatibilityRules());
            db.profiles.AddRange(DefaultContent.Profiles());
            db.scenario = DefaultContent.Scenario();
            var errors = db.Build();
            Assert.IsEmpty(errors, string.Join("\n", errors));
        }

        [Test]
        public void ValidationReportsUnknownTrait()
        {
            var db = DefaultContent.Create();
            db.profiles[0].traits.Add(new TraitValue("charisma", 50));
            Assert.IsTrue(db.Build().Exists(e => e.Contains("charisma")));
        }

        [Test]
        public void ScenarioSpawnsSixPeopleAndTwoCouples()
        {
            var r = NewRunner();
            Assert.AreEqual(6, r.State.people.Count);
            Assert.AreEqual(2, r.State.couples.Count);
            Assert.AreEqual(r.FindByProfile("mara").coupleId, r.FindByProfile("tomas").coupleId);
        }

        [Test]
        public void RestingPointFollowsTraitWeights()
        {
            var r = NewRunner();
            var mara = r.FindByProfile("mara");
            // 0.8*(82-50) + 0.4*(85-50) - 0.3*(20-50) = 25.6 + 14 + 9
            Assert.AreEqual(48.6f, r.Attitudes.RestingPoint(mara, r.Db.PartnerDisposition), 0.01f);
        }

        [Test]
        public void QuirkOffsetsShiftRestingPoint()
        {
            var r = NewRunner();
            var oren = r.FindByProfile("oren");
            // -0.9*(25-50) + 0.4*(30-50) + 40 (Hopeless Romantic)
            Assert.AreEqual(54.5f, r.Attitudes.RestingPoint(oren, r.Db.RelationshipDesire), 0.01f);
        }

        [Test]
        public void StartingAttitudeOverrideApplies()
        {
            var r = NewRunner();
            Assert.AreEqual(-55f, r.FindByProfile("davin").attitudes[r.Db.PartnerDisposition], 0.001f);
        }

        [Test]
        public void AcceptanceChanceMatchesDesignFormula()
        {
            var s = new SimSettings();
            Assert.AreEqual(0.80f - 0.36f - 0.25f, InfluenceSystem.AcceptanceChance(s, 80, true, 0), 0.0001f);
            Assert.AreEqual(0.80f - 0.135f, InfluenceSystem.AcceptanceChance(s, 30, false, 0), 0.0001f);
            Assert.AreEqual(s.acceptMin, InfluenceSystem.AcceptanceChance(s, 100, true, 5), 0.0001f);
        }

        [Test]
        public void NudgeTowardNatureIsNotAgainstIt()
        {
            var r = NewRunner();
            var davin = r.FindByProfile("davin");
            // Davin rests near -29 but starts at -55, so "good partner" pulls him toward his nature.
            Assert.IsFalse(r.Influence.IsAgainstNature(davin, r.Db.Nudge("good_partner")));
            Assert.IsTrue(r.Influence.IsAgainstNature(davin, r.Db.Nudge("bad_partner")));
        }

        [Test]
        public void FirstPushFromRestIsFairButFurtherPushesAreAgainstNature()
        {
            var r = NewRunner();
            var mara = r.FindByProfile("mara");
            var bad = r.Db.Nudge("bad_partner");
            Assert.IsFalse(r.Influence.IsAgainstNature(mara, bad));
            mara.attitudes[r.Db.PartnerDisposition] -= 20f;
            Assert.IsTrue(r.Influence.IsAgainstNature(mara, bad));
            Assert.IsFalse(r.Influence.IsAgainstNature(mara, r.Db.Nudge("good_partner")));
        }

        [Test]
        public void NudgeSpendsInfluenceAndRecordsFatigue()
        {
            var r = NewRunner();
            var mara = r.FindByProfile("mara");
            float before = r.State.influence;
            var result = r.Influence.Apply(mara.id, "seek_love");
            Assert.AreNotEqual(NudgeOutcome.NotEnoughInfluence, result.outcome);
            Assert.AreEqual(before - 8f, r.State.influence, 0.001f);
            Assert.AreEqual(1, r.Influence.Fatigue(mara));
        }

        [Test]
        public void ImpressionableCostsLess()
        {
            var r = NewRunner();
            Assert.AreEqual(6, r.Influence.Cost(r.FindByProfile("sela"), r.Db.Nudge("seek_love")));
        }

        [Test]
        public void NotEnoughInfluenceChangesNothing()
        {
            var r = NewRunner();
            r.State.influence = 3f;
            var mara = r.FindByProfile("mara");
            float pd = mara.attitudes[r.Db.PartnerDisposition];
            var result = r.Influence.Apply(mara.id, "bad_partner");
            Assert.AreEqual(NudgeOutcome.NotEnoughInfluence, result.outcome);
            Assert.AreEqual(pd, mara.attitudes[r.Db.PartnerDisposition]);
            Assert.AreEqual(3f, r.State.influence);
        }

        [Test]
        public void PartnerNudgesAreBlockedForSingles()
        {
            var r = NewRunner();
            var oren = r.FindByProfile("oren");
            Assert.IsTrue(r.Influence.Preview(oren, r.Db.Nudge("leave")).Blocked);
            Assert.AreEqual(NudgeOutcome.Blocked, r.Influence.Apply(oren.id, "leave").outcome);
        }

        [Test]
        public void OutcomesMoveAttitudeByDesignedAmounts()
        {
            for (int seed = 1; seed < 200; seed++)
            {
                var r = NewRunner(seed);
                r.State.influence = 50f;
                var tomas = r.FindByProfile("tomas");
                var result = r.Influence.Apply(tomas.id, "seek_love");
                float delta = result.after - result.before;
                switch (result.outcome)
                {
                    case NudgeOutcome.Accepted: Assert.AreEqual(30f * (1f - 55f / 200f), delta, 0.01f); break;
                    case NudgeOutcome.ShruggedOff: Assert.AreEqual(0f, delta, 0.0001f); break;
                    case NudgeOutcome.Backfired: Assert.AreEqual(-15f, delta, 0.01f); break;
                    default: Assert.Fail("Unexpected outcome " + result.outcome); break;
                }
            }
        }

        [Test]
        public void AttitudesDriftTowardRestingPoint()
        {
            var r = NewRunner();
            var mara = r.FindByProfile("mara");
            int a = r.Db.PartnerDisposition;
            float rest = r.Attitudes.RestingPoint(mara, a);
            mara.attitudes[a] = -40f;
            mara.wavering[a] = false;
            // Disable flips so only drift acts.
            r.Db.settings.flipBaseChance = 0f;
            r.AdvanceDays(1);
            Assert.AreEqual(-40f + (rest + 40f) * 0.05f, mara.attitudes[a], 0.01f);
        }

        [Test]
        public void WaveringFlipHappensNextDayWithOvershoot()
        {
            var r = NewRunner();
            var oren = r.FindByProfile("oren");
            int a = r.Db.RelationshipDesire;
            r.Db.settings.flipBaseChance = 1f; // guarantee a flip roll once far from rest
            oren.attitudes[a] = -60f;
            float expectedTarget = r.Attitudes.FlipTarget(oren, a);
            r.AdvanceDays(1); // drift, then schedule
            Assert.IsTrue(oren.wavering[a]);
            float target = oren.waveringTarget[a];
            r.Db.settings.flipBaseChance = 0f;
            r.AdvanceDays(1);
            Assert.IsFalse(oren.wavering[a]);
            Assert.AreEqual(target, oren.attitudes[a], 0.001f);
            Assert.Greater(target, r.Attitudes.RestingPoint(oren, a)); // overshoots past their nature
            Assert.Greater(expectedTarget, 54.5f);
        }

        [Test]
        public void SteadyCancelsAFlip()
        {
            var r = NewRunner();
            var oren = r.FindByProfile("oren");
            int a = r.Db.RelationshipDesire;
            oren.wavering[a] = true;
            oren.waveringTarget[a] = -100f;
            r.State.influence = 50f;
            Assert.AreEqual(16, r.Influence.SteadyCost(oren, a));
            Assert.IsTrue(r.Influence.Steady(oren.id, a));
            Assert.IsFalse(oren.wavering[a]);
            Assert.AreEqual(34f, r.State.influence, 0.001f);
        }

        [Test]
        public void SameSeedAndActionsReplayIdentically()
        {
            var a = NewRunner(777);
            var b = NewRunner(777);
            foreach (var r in new[] { a, b })
            {
                r.Influence.Apply(r.FindByProfile("davin").id, "good_partner");
                r.AdvanceDays(20);
                r.Influence.Apply(r.FindByProfile("ilse").id, "stay");
                r.AdvanceDays(40);
            }
            Assert.AreEqual(a.State.rngState, b.State.rngState);
            Assert.AreEqual(a.State.couples.Count, b.State.couples.Count);
            for (int i = 0; i < a.State.people.Count; i++)
                CollectionAssert.AreEqual(a.State.people[i].attitudes, b.State.people[i].attitudes);
        }

        [Test]
        public void BreakupMakesBothHeartbrokenAndExPartners()
        {
            var r = NewRunner();
            var ilse = r.FindByProfile("ilse");
            var davin = r.FindByProfile("davin");
            r.Relationships.BreakUp(r.State.CoupleOf(ilse), davin);
            Assert.AreEqual(1, r.State.couples.Count);
            Assert.IsTrue(ilse.IsHeartbroken && davin.IsHeartbroken);
            Assert.AreEqual(-50f, ilse.attitudes[r.Db.RelationshipDesire]);
            Assert.IsTrue(ilse.links.Exists(l => l.otherId == davin.id && l.type == LinkType.ExPartner));
            Assert.IsTrue(r.Influence.Preview(ilse, r.Db.Nudge("seek_love")).Blocked);
        }

        [Test]
        public void HopelessRomanticGrievesTwiceAsLong()
        {
            var r = NewRunner();
            var oren = r.FindByProfile("oren");
            var sela = r.FindByProfile("sela");
            var c = r.Relationships.CreateCouple(oren, sela, CoupleStage.Dating, 40, 10);
            r.Relationships.BreakUp(c, sela);
            Assert.AreEqual(20, oren.heartbrokenDaysLeft);
            Assert.AreEqual(10, sela.heartbrokenDaysLeft);
        }

        [Test]
        public void UntouchedGoodCoupleStaysTogetherAndBadCoupleUsuallySplits()
        {
            int goodSurvived = 0, badSplit = 0, runs = 100;
            for (int seed = 1; seed <= runs; seed++)
            {
                var r = NewRunner(seed);
                r.AdvanceDays(60);
                var mara = r.FindByProfile("mara");
                var tomas = r.FindByProfile("tomas");
                var ilse = r.FindByProfile("ilse");
                var davin = r.FindByProfile("davin");
                if (mara.coupleId >= 0 && mara.coupleId == tomas.coupleId) goodSurvived++;
                if (!(ilse.coupleId >= 0 && ilse.coupleId == davin.coupleId)) badSplit++;
            }
            Assert.GreaterOrEqual(goodSurvived, 90, "good couple survived " + goodSurvived + "/" + runs);
            Assert.GreaterOrEqual(badSplit, 50, "bad couple split " + badSplit + "/" + runs);
        }

        [Test]
        public void InfluenceRegeneratesAndCaps()
        {
            var r = NewRunner();
            r.State.influence = 0f;
            r.Advance(10f);
            Assert.AreEqual(10f, r.State.influence, 0.001f);
            r.Advance(100f);
            Assert.AreEqual(r.State.maxInfluence, r.State.influence, 0.001f);
        }

        [Test]
        public void GoalReportFiresOnceAtDay30()
        {
            var r = NewRunner();
            int fired = 0;
            GoalReport report = null;
            r.Events.GoalReached += g => { fired++; report = g; };
            r.AdvanceDays(40);
            Assert.AreEqual(1, fired);
            Assert.AreEqual(30, report.day);
            Assert.IsTrue(report.lines.Exists(l => l.Contains("Mara and Tomas")));
        }
    }
}
