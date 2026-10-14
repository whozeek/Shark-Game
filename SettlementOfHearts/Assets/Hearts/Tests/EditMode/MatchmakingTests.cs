using Hearts.Sim;
using NUnit.Framework;

namespace Hearts.Tests
{
    public class MatchmakingTests
    {
        static SimulationRunner NewRunner(int seed = 4242)
        {
            return SimulationRunner.NewGame(DefaultContent.Create(), seed);
        }

        static PersonState P(SimulationRunner r, string id) { return r.FindByProfile(id); }

        [Test]
        public void SuccessfulIntroductionStartsCourtingAndUsesASlot()
        {
            var r = NewRunner();
            r.State.influence = 50f;
            var rhea = P(r, "rhea");
            var jory = P(r, "jory");
            var result = r.Matchmaking.Introduce(rhea.id, jory.id);
            Assert.IsTrue(result.success, result.reason);
            Assert.AreEqual(35f, r.State.influence, 0.001f);
            var couple = r.State.CoupleOf(rhea);
            Assert.AreEqual(CoupleStage.Courting, couple.stage);
            Assert.IsTrue(couple.usesMatchmakingSlot);
            Assert.AreEqual(0, r.Relationships.FreeSlots());
            Assert.AreEqual(r.Relationships.Attraction(rhea, jory) / 3f, couple.bond, 0.01f);
        }

        [Test]
        public void NoFreeSlotBlocksWithoutSpending()
        {
            var r = NewRunner();
            r.State.influence = 50f;
            Assert.IsTrue(r.Matchmaking.Introduce(P(r, "rhea").id, P(r, "jory").id).success);
            var blocked = r.Matchmaking.Introduce(P(r, "nell").id, P(r, "wren").id);
            Assert.IsFalse(blocked.attempted);
            Assert.AreEqual(35f, r.State.influence, 0.001f);
            StringAssert.Contains("slots", blocked.reason);
        }

        [Test]
        public void UnwillingPersonFailsAndRefundsHalf()
        {
            var r = NewRunner();
            r.State.influence = 50f;
            var bram = P(r, "bram");
            bram.attitudes[r.Db.RelationshipDesire] = -60f;
            var result = r.Matchmaking.Introduce(P(r, "rhea").id, bram.id);
            Assert.IsTrue(result.attempted);
            Assert.IsFalse(result.success);
            StringAssert.Contains("isn't looking", result.reason);
            Assert.AreEqual(50f - 15f + 7f, r.State.influence, 0.001f);
            Assert.IsTrue(bram.IsSingle);
        }

        [Test]
        public void TakenOrHeartbrokenPeopleCannotBeIntroduced()
        {
            var r = NewRunner();
            r.State.influence = 50f;
            Assert.IsTrue(r.Matchmaking.Preview(P(r, "mara"), P(r, "oren")).Blocked);
            var nell = P(r, "nell");
            nell.heartbrokenDaysLeft = 5;
            Assert.IsTrue(r.Matchmaking.Preview(nell, P(r, "oren")).Blocked);
        }

        [Test]
        public void SlotFreesWhenCoupleMakesItOfficial()
        {
            var r = NewRunner();
            r.Db.settings.moodSwingPerDay = 0f;
            r.State.influence = 50f;
            var rhea = P(r, "rhea");
            Assert.IsTrue(r.Matchmaking.Introduce(rhea.id, P(r, "jory").id).success);
            int days = 0;
            while (r.State.CoupleOf(rhea) != null && r.State.CoupleOf(rhea).stage != CoupleStage.Established && days < 60)
            {
                r.AdvanceDays(1);
                days++;
            }
            var couple = r.State.CoupleOf(rhea);
            Assert.IsNotNull(couple);
            Assert.AreEqual(CoupleStage.Established, couple.stage);
            Assert.IsFalse(couple.usesMatchmakingSlot);
            Assert.AreEqual(1, r.Relationships.FreeSlots());
            Assert.LessOrEqual(days, 25, "courting + dating should take about two to three weeks");
        }

        [Test]
        public void ExesAreLessAttractedToEachOther()
        {
            var r = NewRunner();
            var oren = P(r, "oren");
            var nell = P(r, "nell");
            float before = r.Relationships.Attraction(oren, nell);
            var c = r.Relationships.CreateCouple(oren, nell, CoupleStage.Dating, 40, 0);
            r.Relationships.BreakUp(c, nell);
            Assert.AreEqual(before - 20f, r.Relationships.Attraction(oren, nell), 0.001f);
        }

        [Test]
        public void KnownBadPartnersAreLessAttractive()
        {
            var r = NewRunner();
            r.Db.settings.moodSwingPerDay = 0f;
            r.Db.settings.flipBaseChance = 0f;
            r.Db.settings.driftPerDay = 0f;
            var jory = P(r, "jory");
            var rhea = P(r, "rhea");
            float before = r.Relationships.Attraction(jory, rhea);
            jory.attitudes[r.Db.PartnerDisposition] = -80f;
            r.AdvanceDays(14);
            Assert.IsTrue(r.Relationships.HasBadReputation(jory));
            Assert.AreEqual(before - 15f, r.Relationships.Attraction(jory, rhea), 0.001f);
        }

        [Test]
        public void SinglesSometimesPairUpOnTheirOwn()
        {
            int natural = 0;
            for (int seed = 1; seed <= 30; seed++)
            {
                var r = NewRunner(seed);
                r.AdvanceDays(45);
                natural += r.State.stats.naturalCouples;
            }
            Assert.Greater(natural, 5);
        }

        [Test]
        public void SociablePeopleMeetMoreOften()
        {
            var r = NewRunner();
            Assert.AreEqual(3, r.Encounters.MeetingsPerDay(P(r, "rhea")));
            Assert.AreEqual(2, r.Encounters.MeetingsPerDay(P(r, "bram")));
        }
    }
}
