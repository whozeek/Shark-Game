using System;

namespace Hearts.Sim
{
    // The player's way to start a couple: introduce two single adults. Called by UI, not ticked.
    public class MatchmakingSystem
    {
        readonly SimContext ctx;
        readonly RelationshipSystem relationships;

        public MatchmakingSystem(SimContext ctx, RelationshipSystem relationships)
        {
            this.ctx = ctx;
            this.relationships = relationships;
        }

        // Why this person can't be introduced to anyone right now, or null if they can.
        public string UnavailableReason(PersonState p)
        {
            if (p == null) return "Nobody selected.";
            if (!p.IsSingle) return p.firstName + " is already with someone.";
            if (p.IsHeartbroken) return p.firstName + " is heartbroken and not ready.";
            if (p.age < ctx.S.adultAge) return p.firstName + " is too young.";
            return null;
        }

        public MatchPreview Preview(PersonState a, PersonState b)
        {
            var s = ctx.S;
            var preview = new MatchPreview { cost = s.matchmakeCost };
            if (a == null || b == null || a.id == b.id)
            {
                preview.blockedReason = "Pick two different people.";
                return preview;
            }
            preview.attraction = relationships.Attraction(a, b);
            preview.blockedReason = UnavailableReason(a) ?? UnavailableReason(b);
            if (preview.Blocked) return preview;
            if (relationships.FreeSlots() <= 0)
            {
                preview.blockedReason = "All your matchmaking slots are busy. A slot frees when one of your couples makes it official or splits up.";
                return preview;
            }

            int desire = ctx.db.RelationshipDesire;
            if (a.attitudes[desire] < s.matchmakeMinDesire) preview.failReason = a.firstName + " isn't looking right now.";
            else if (b.attitudes[desire] < s.matchmakeMinDesire) preview.failReason = b.firstName + " isn't looking right now.";
            else if (preview.attraction < s.matchmakeMinAttraction)
                preview.failReason = relationships.AreExes(a, b)
                    ? a.firstName + " and " + b.firstName + " have too much history."
                    : "There's no spark between " + a.firstName + " and " + b.firstName + ".";
            return preview;
        }

        public MatchResult Introduce(int personA, int personB)
        {
            var a = ctx.state.Person(personA);
            var b = ctx.state.Person(personB);
            var preview = Preview(a, b);
            var result = new MatchResult { personA = personA, personB = personB, coupleId = -1 };

            if (preview.Blocked)
            {
                result.reason = preview.blockedReason;
                return result;
            }
            if (ctx.state.influence < preview.cost)
            {
                result.reason = "Not enough Influence.";
                return result;
            }

            result.attempted = true;
            ctx.state.influence -= preview.cost;
            result.spent = preview.cost;

            if (preview.WillCourt)
            {
                var couple = relationships.StartCourting(a, b, true);
                result.success = true;
                result.coupleId = couple.id;
                ctx.state.stats.matchmakes++;
            }
            else
            {
                int refund = (int)Math.Floor(preview.cost * ctx.S.matchmakeRefundOnFail);
                ctx.state.influence = Math.Min(ctx.state.maxInfluence, ctx.state.influence + refund);
                result.spent -= refund;
                result.reason = preview.failReason;
                ctx.state.stats.failedMatchmakes++;
                ctx.Feed("Your introduction of " + a.firstName + " and " + b.firstName + " fell flat. " + preview.failReason, a.id, FeedKind.Info);
            }
            ctx.events.RaiseMatch(result);
            return result;
        }
    }
}
