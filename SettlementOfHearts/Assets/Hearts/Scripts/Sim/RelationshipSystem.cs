using System;
using System.Collections.Generic;

namespace Hearts.Sim
{
    // Bond and Tension per couple, stage changes, breakups and heartbreak.
    public class RelationshipSystem
    {
        readonly SimContext ctx;
        readonly List<CoupleState> scratch = new List<CoupleState>();

        public RelationshipSystem(SimContext ctx) { this.ctx = ctx; }

        public float Compatibility(PersonState a, PersonState b)
        {
            float total = 0f, weights = 0f;
            foreach (var rule in ctx.db.compatibilityRules)
            {
                int t = ctx.db.TraitIndex(rule.traitId);
                if (t < 0 || rule.weight <= 0f) continue;
                float va = a.traits[t], vb = b.traits[t];
                float score;
                switch (rule.mode)
                {
                    case CompatibilityMode.Similar: score = 1f - Math.Abs(va - vb) / 100f; break;
                    case CompatibilityMode.BothHigh: score = (va + vb) / 200f; break;
                    case CompatibilityMode.BothLow: score = 1f - (va + vb) / 200f; break;
                    default: score = 1f - Math.Max(0f, (Math.Min(va, vb) - 50f) / 50f); break;
                }
                total += rule.weight * SimContext.Clamp(score, 0f, 1f);
                weights += rule.weight;
            }
            return weights <= 0f ? 50f : 100f * total / weights;
        }

        public float Spark(PersonState a, PersonState b)
        {
            float range = ctx.S.sparkRange;
            return (float)(Rng.Hash01(a.id, b.id, 7) * 2.0 - 1.0) * range;
        }

        public CoupleState CreateCouple(PersonState a, PersonState b, CoupleStage stage, float bond, float tension)
        {
            var c = new CoupleState
            {
                id = ctx.state.nextCoupleId++,
                personA = a.id,
                personB = b.id,
                stage = stage,
                bond = SimContext.Clamp01x100(bond),
                tension = SimContext.Clamp01x100(tension),
                compatibility = Compatibility(a, b),
                spark = Spark(a, b),
                formedDay = ctx.state.day
            };
            ctx.state.couples.Add(c);
            a.coupleId = c.id;
            b.coupleId = c.id;
            SetLink(a, b.id, LinkType.Partner);
            SetLink(b, a.id, LinkType.Partner);
            return c;
        }

        static void SetLink(PersonState p, int otherId, LinkType type)
        {
            foreach (var l in p.links)
            {
                if (l.otherId == otherId && (l.type == LinkType.Partner || l.type == LinkType.ExPartner))
                {
                    l.type = type;
                    return;
                }
            }
            p.links.Add(new RelationshipLink { otherId = otherId, type = type, strength = 1f });
        }

        float TensionCooling(PersonState a, PersonState b)
        {
            // A Peacemaker helps their partner let things go.
            float mult = 1f;
            foreach (var q in ctx.db.QuirksOf(a)) mult *= q.partnerTensionCoolingMultiplier;
            foreach (var q in ctx.db.QuirksOf(b)) mult *= q.partnerTensionCoolingMultiplier;
            return ctx.S.tensionCoolingPerDay * mult;
        }

        public float BondChange(CoupleState c, PersonState a, PersonState b)
        {
            var s = ctx.S;
            int pd = ctx.db.PartnerDisposition, cm = ctx.db.Commitment;
            return s.bondFromCompatibility * (c.compatibility - 50f)
                   + s.bondFromDisposition * (a.attitudes[pd] + b.attitudes[pd]) / 2f
                   + s.bondFromCommitment * (a.attitudes[cm] + b.attitudes[cm]) / 2f;
        }

        public float TensionChange(PersonState a, PersonState b)
        {
            var s = ctx.S;
            int pd = ctx.db.PartnerDisposition, amb = ctx.db.Ambition;
            return s.tensionFromBadPartner * Math.Max(0f, -a.attitudes[pd])
                   + s.tensionFromBadPartner * Math.Max(0f, -b.attitudes[pd])
                   + s.tensionFromAmbitionGap * Math.Abs(a.traits[amb] - b.traits[amb])
                   - TensionCooling(a, b);
        }

        public float BreakupChance(CoupleState c, PersonState a, PersonState b)
        {
            if (c.tension <= c.bond) return 0f;
            var s = ctx.S;
            int cm = ctx.db.Commitment;
            float lowest = Math.Min(a.attitudes[cm], b.attitudes[cm]);
            float chance = s.breakupBaseChance + s.breakupPerTenCommitment * Math.Max(0f, -lowest) / 10f;
            if (c.stage != CoupleStage.Established) chance *= s.breakupEarlyStageMultiplier;
            return Math.Min(1f, chance);
        }

        public void DailyTick()
        {
            var s = ctx.S;
            scratch.Clear();
            scratch.AddRange(ctx.state.couples);
            foreach (var c in scratch)
            {
                var a = ctx.state.Person(c.personA);
                var b = ctx.state.Person(c.personB);
                if (a == null || b == null) continue;

                c.bond = SimContext.Clamp01x100(c.bond + BondChange(c, a, b));
                c.tension = SimContext.Clamp01x100(c.tension + TensionChange(a, b));

                if (c.stage == CoupleStage.Courting && c.bond >= s.datingBond)
                {
                    c.stage = CoupleStage.Dating;
                    ctx.Feed(a.firstName + " and " + b.firstName + " are now dating.", a.id, FeedKind.Good);
                    ctx.events.RaiseStage(c);
                }
                else if (c.stage == CoupleStage.Dating)
                {
                    c.daysAtHighBond = c.bond >= s.establishedBond ? c.daysAtHighBond + 1 : 0;
                    if (c.daysAtHighBond >= s.establishedDays)
                    {
                        c.stage = CoupleStage.Established;
                        ctx.Feed(a.firstName + " and " + b.firstName + " made it official.", a.id, FeedKind.Good);
                        ctx.events.RaiseStage(c);
                    }
                }

                if (ctx.rng.Chance(BreakupChance(c, a, b)))
                {
                    // The partner with less commitment is the one who leaves.
                    int cm = ctx.db.Commitment;
                    var leaver = a.attitudes[cm] <= b.attitudes[cm] ? a : b;
                    BreakUp(c, leaver);
                }
            }
        }

        public void BreakUp(CoupleState c, PersonState leaver)
        {
            var a = ctx.state.Person(c.personA);
            var b = ctx.state.Person(c.personB);
            var left = leaver == a ? b : a;
            c.leaverId = leaver.id;
            ctx.state.couples.Remove(c);
            ctx.state.stats.breakups++;
            foreach (var p in new[] { a, b })
            {
                p.coupleId = -1;
                float mult = 1f;
                foreach (var q in ctx.db.QuirksOf(p)) mult *= q.heartbreakMultiplier;
                p.heartbrokenDaysLeft = (int)Math.Round(ctx.S.heartbreakDays * mult);
                p.attitudes[ctx.db.RelationshipDesire] = ctx.S.heartbreakDesire;
                for (int i = 0; i < p.wavering.Length; i++) p.wavering[i] = false;
            }
            SetLink(a, b.id, LinkType.ExPartner);
            SetLink(b, a.id, LinkType.ExPartner);
            ctx.Story(leaver, "Left " + left.firstName + " after too many arguments.");
            ctx.Story(left, "Was left by " + leaver.firstName + ".");
            ctx.Feed(leaver.firstName + " left " + left.firstName + ". Both are heartbroken.", leaver.id, FeedKind.Bad);
            ctx.events.RaiseBreakUp(c);
        }

        public void HeartbreakTick(PersonState p)
        {
            if (p.heartbrokenDaysLeft <= 0) return;
            p.heartbrokenDaysLeft--;
            if (p.heartbrokenDaysLeft == 0)
            {
                // Desire resumes from neutral and drifts back to the person's nature.
                p.attitudes[ctx.db.RelationshipDesire] = 0f;
                ctx.Story(p, "Feels ready to move on.");
                ctx.Feed(p.firstName + " has mended and is ready to move on.", p.id, FeedKind.Info);
                ctx.events.RaiseHealed(p.id);
            }
        }
    }
}
