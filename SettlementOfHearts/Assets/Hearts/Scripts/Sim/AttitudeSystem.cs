using System;

namespace Hearts.Sim
{
    // Free will: attitudes drift back toward a resting point set by traits, and people
    // sometimes change their minds on their own. Changes are telegraphed one day ahead.
    public class AttitudeSystem
    {
        readonly SimContext ctx;

        public AttitudeSystem(SimContext ctx) { this.ctx = ctx; }

        public float RestingPoint(PersonState p, int attitude)
        {
            var def = ctx.db.attitudes[attitude];
            float rest = def.restBias;
            foreach (var w in def.restWeights)
            {
                int t = ctx.db.TraitIndex(w.traitId);
                if (t >= 0) rest += w.weight * (p.traits[t] - 50f);
            }
            foreach (var q in ctx.db.QuirksOf(p))
                foreach (var m in q.restOffsets)
                    if (m.attitudeId == def.id) rest += m.value;
            return SimContext.Clamp100(rest);
        }

        public float DriftMultiplier(PersonState p, int attitude)
        {
            string id = ctx.db.attitudes[attitude].id;
            float mult = 1f;
            foreach (var q in ctx.db.QuirksOf(p))
                foreach (var m in q.driftMultipliers)
                    if (m.attitudeId == id) mult *= m.value;
            return mult;
        }

        public float FlipChance(PersonState p, int attitude)
        {
            var s = ctx.S;
            float distance = Math.Abs(p.attitudes[attitude] - RestingPoint(p, attitude));
            if (distance < s.flipMinDistance) return 0f;
            return s.flipBaseChance * (distance / s.flipDistanceScale) * (1f + p.traits[ctx.db.Volatility] / 100f);
        }

        public float FlipTarget(PersonState p, int attitude)
        {
            float rest = RestingPoint(p, attitude);
            return SimContext.Clamp100(rest + ctx.S.flipOvershoot * (rest - p.attitudes[attitude]));
        }

        bool IsRedeemable(PersonState p)
        {
            foreach (var q in ctx.db.QuirksOf(p))
                if (q.redeemable) return true;
            return false;
        }

        public void DailyTick(PersonState p)
        {
            var s = ctx.S;
            for (int a = 0; a < p.attitudes.Length; a++)
            {
                if (a == ctx.db.RelationshipDesire && p.IsHeartbroken)
                {
                    p.attitudes[a] = s.heartbreakDesire;
                    p.wavering[a] = false;
                    continue;
                }

                if (p.wavering[a])
                {
                    ExecuteFlip(p, a);
                    continue;
                }

                float rest = RestingPoint(p, a);
                float drift = Math.Min(1f, s.driftPerDay * DriftMultiplier(p, a));
                p.attitudes[a] += (rest - p.attitudes[a]) * drift;

                if (a == ctx.db.PartnerDisposition && p.attitudes[a] < s.redeemableThreshold && IsRedeemable(p)
                    && ctx.rng.Chance(s.redeemableDailyChance))
                {
                    ScheduleFlip(p, a, s.redeemableFlipTo);
                    continue;
                }

                if (ctx.rng.Chance(FlipChance(p, a)))
                    ScheduleFlip(p, a, FlipTarget(p, a));
            }
        }

        void ScheduleFlip(PersonState p, int a, float target)
        {
            p.wavering[a] = true;
            p.waveringTarget[a] = target;
            var def = ctx.db.attitudes[a];
            string toward = target > p.attitudes[a] ? def.positiveLabel : def.negativeLabel;
            ctx.Feed(p.firstName + " is wavering. They may change their mind tomorrow (" + toward.ToLowerInvariant() + ").", p.id, FeedKind.Flip);
            ctx.events.RaiseWavering(p.id, a);
        }

        void ExecuteFlip(PersonState p, int a)
        {
            var def = ctx.db.attitudes[a];
            float from = p.attitudes[a];
            float to = p.waveringTarget[a];
            p.wavering[a] = false;
            p.attitudes[a] = to;
            bool up = to > from;
            string line = ContentDb.Fill(up ? def.flipUpLine : def.flipDownLine, p);
            ctx.Story(p, line);
            ctx.Feed(line, p.id, FeedKind.Flip);
            ctx.state.stats.flips++;
            ctx.events.RaiseFlip(new FlipInfo
            {
                personId = p.id,
                attitude = a,
                from = from,
                to = to,
                thought = ContentDb.Fill(up ? def.thoughtUp : def.thoughtDown, p)
            });
        }
    }
}
