using System;

namespace Hearts.Sim
{
    // The player's only verb on people. Called directly by UI, not ticked.
    public class InfluenceSystem
    {
        readonly SimContext ctx;
        readonly AttitudeSystem attitudes;

        public InfluenceSystem(SimContext ctx, AttitudeSystem attitudes)
        {
            this.ctx = ctx;
            this.attitudes = attitudes;
        }

        public int Fatigue(PersonState p)
        {
            int count = 0;
            for (int i = p.nudgeDays.Count - 1; i >= 0; i--)
            {
                if (ctx.state.day - p.nudgeDays[i] < ctx.S.fatigueWindowDays) count++;
                else p.nudgeDays.RemoveAt(i);
            }
            return count;
        }

        public float CostMultiplier(PersonState p)
        {
            float mult = 1f;
            foreach (var q in ctx.db.QuirksOf(p)) mult *= q.influenceCostMultiplier;
            return mult;
        }

        public int Cost(PersonState p, NudgeDef n)
        {
            return Math.Max(1, (int)Math.Round(n.cost * CostMultiplier(p)));
        }

        public bool IsAgainstNature(PersonState p, NudgeDef n)
        {
            // Pushing further from someone's nature is hard once they are already past the
            // dead zone; nudging back toward it, or a first push from rest, is not.
            int a = ctx.db.AttitudeIndex(n.attitudeId);
            float pastRest = p.attitudes[a] - attitudes.RestingPoint(p, a);
            if (Math.Abs(pastRest) < ctx.S.againstNatureDeadZone) return false;
            return Math.Sign(pastRest) == Math.Sign(n.direction);
        }

        public static float AcceptanceChance(SimSettings s, float stubbornness, bool against, int fatigue)
        {
            float p = s.acceptBase
                      - s.acceptStubbornness * stubbornness / 100f
                      - (against ? s.acceptAgainstNature : 0f)
                      - s.acceptFatigue * fatigue;
            return SimContext.Clamp(p, s.acceptMin, s.acceptMax);
        }

        public NudgePreview Preview(PersonState p, NudgeDef n)
        {
            var s = ctx.S;
            var preview = new NudgePreview();
            preview.cost = Cost(p, n);
            preview.againstNature = IsAgainstNature(p, n);
            preview.chance = AcceptanceChance(s, p.traits[ctx.db.Stubbornness], preview.againstNature, Fatigue(p));
            preview.hint = preview.chance >= s.likelyThreshold ? NudgeHint.Likely
                : preview.chance < s.unlikelyThreshold ? NudgeHint.Unlikely
                : NudgeHint.Uncertain;

            if (n.requiresPartner && !p.HasPartner)
                preview.blockedReason = p.firstName + " isn't with anyone.";
            else if (p.IsHeartbroken && n.attitudeId == AttitudeIds.RelationshipDesire)
                preview.blockedReason = p.firstName + " is heartbroken and won't hear about love yet.";
            return preview;
        }

        public NudgeResult Apply(int personId, string nudgeId)
        {
            var p = ctx.state.Person(personId);
            var n = ctx.db.Nudge(nudgeId);
            var result = new NudgeResult { personId = personId, nudgeId = nudgeId };
            if (p == null || n == null)
            {
                result.outcome = NudgeOutcome.Blocked;
                return result;
            }

            var s = ctx.S;
            int a = ctx.db.AttitudeIndex(n.attitudeId);
            var preview = Preview(p, n);
            result.chance = preview.chance;
            result.cost = preview.cost;
            result.before = result.after = p.attitudes[a];

            if (preview.Blocked)
            {
                result.outcome = NudgeOutcome.Blocked;
                result.line = preview.blockedReason;
                return result;
            }
            if (ctx.state.influence < preview.cost)
            {
                result.outcome = NudgeOutcome.NotEnoughInfluence;
                result.line = "Not enough Influence.";
                return result;
            }

            ctx.state.influence -= preview.cost;
            p.nudgeDays.Add(ctx.state.day);
            ctx.state.stats.nudgesTried++;

            float backfireBonus = 0f;
            foreach (var q in ctx.db.QuirksOf(p)) backfireBonus += q.backfireBonus;

            double roll = ctx.rng.NextDouble();
            if (backfireBonus > 0f && ctx.rng.Chance(backfireBonus))
                result.outcome = NudgeOutcome.Backfired;
            else if (roll < preview.chance)
                result.outcome = NudgeOutcome.Accepted;
            else if (roll < preview.chance + (1f - preview.chance) * s.shrugShareOfFailure)
                result.outcome = NudgeOutcome.ShruggedOff;
            else
                result.outcome = NudgeOutcome.Backfired;

            float stub = p.traits[ctx.db.Stubbornness];
            switch (result.outcome)
            {
                case NudgeOutcome.Accepted:
                    p.attitudes[a] = SimContext.Clamp100(p.attitudes[a] + n.direction * n.strength * (1f - stub / 200f));
                    result.line = ContentDb.Fill(n.acceptLine, p);
                    ctx.state.stats.accepted++;
                    ctx.Story(p, "Was nudged to " + n.displayName.ToLowerInvariant() + " and took it to heart.");
                    ctx.Feed(p.firstName + ": \"" + result.line + "\"", p.id, FeedKind.Good);
                    break;
                case NudgeOutcome.ShruggedOff:
                    result.line = ContentDb.Fill(n.shrugLine, p);
                    ctx.state.stats.shrugged++;
                    ctx.Feed(p.firstName + " shrugged off a nudge to " + n.displayName.ToLowerInvariant() + ".", p.id, FeedKind.Info);
                    break;
                case NudgeOutcome.Backfired:
                    p.attitudes[a] = SimContext.Clamp100(p.attitudes[a] - n.direction * n.strength * s.backfireStrengthFactor);
                    result.line = ContentDb.Fill(n.backfireLine, p);
                    ctx.state.stats.backfired++;
                    ctx.Story(p, "Resented being told to " + n.displayName.ToLowerInvariant() + " and did the opposite.");
                    ctx.Feed(p.firstName + " bristled: \"" + result.line + "\"", p.id, FeedKind.Bad);
                    break;
            }

            result.after = p.attitudes[a];
            ctx.events.RaiseNudge(result);
            return result;
        }

        public int SteadyCost(PersonState p, int attitude)
        {
            int cheapest = int.MaxValue;
            string id = ctx.db.attitudes[attitude].id;
            foreach (var n in ctx.db.nudges)
                if (n.attitudeId == id) cheapest = Math.Min(cheapest, n.cost);
            if (cheapest == int.MaxValue) cheapest = 10;
            return Math.Max(1, (int)Math.Ceiling(cheapest * ctx.S.steadyCostMultiplier * CostMultiplier(p)));
        }

        // Cancels a pending change of heart. Always works, at a premium.
        public bool Steady(int personId, int attitude)
        {
            var p = ctx.state.Person(personId);
            if (p == null || attitude < 0 || attitude >= p.attitudes.Length || !p.wavering[attitude]) return false;
            int cost = SteadyCost(p, attitude);
            if (ctx.state.influence < cost) return false;
            ctx.state.influence -= cost;
            p.wavering[attitude] = false;
            ctx.state.stats.steadied++;
            ctx.Feed("You steadied " + p.firstName + "'s wavering " + ctx.db.attitudes[attitude].displayName.ToLowerInvariant() + ".", p.id, FeedKind.Info);
            ctx.events.RaiseSteadied(p.id, attitude);
            return true;
        }
    }
}
