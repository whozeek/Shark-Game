using System;
using System.Collections.Generic;

namespace Hearts.Sim
{
    // Daily meetings: people bump into each other, form friendships and rivalries,
    // and two willing singles who click can start courting without any help.
    public class EncounterSystem
    {
        readonly SimContext ctx;
        readonly RelationshipSystem relationships;
        readonly List<PersonState> others = new List<PersonState>();

        public EncounterSystem(SimContext ctx, RelationshipSystem relationships)
        {
            this.ctx = ctx;
            this.relationships = relationships;
        }

        public int MeetingsPerDay(PersonState p)
        {
            int social = ctx.db.TraitIndex(TraitIds.Sociability);
            float sociability = social >= 0 ? p.traits[social] : 50f;
            return 1 + (int)(sociability / Math.Max(1f, ctx.S.sociabilityPerExtraMeeting));
        }

        public void DailyTick()
        {
            var people = ctx.state.people;
            if (people.Count < 2) return;
            for (int i = 0; i < people.Count; i++)
            {
                var p = people[i];
                int meetings = MeetingsPerDay(p);
                for (int m = 0; m < meetings; m++)
                {
                    int j = ctx.rng.Range(0, people.Count - 1);
                    if (j >= i) j++;
                    Meet(p, people[j]);
                }
            }
        }

        void Meet(PersonState a, PersonState b)
        {
            var s = ctx.S;
            UpdateAcquaintance(a, b);
            UpdateAcquaintance(b, a);

            if (!relationships.IsAvailable(a) || !relationships.IsAvailable(b)) return;
            int desire = ctx.db.RelationshipDesire;
            if (a.attitudes[desire] <= s.naturalMinDesire || b.attitudes[desire] <= s.naturalMinDesire) return;
            if (relationships.Attraction(a, b) <= s.naturalMinAttraction) return;
            if (!ctx.rng.Chance(s.naturalCourtshipChance)) return;
            relationships.StartCourting(a, b, false);
        }

        void UpdateAcquaintance(PersonState p, PersonState other)
        {
            var s = ctx.S;
            var friend = p.Link(other.id, LinkType.Friend);
            var rival = p.Link(other.id, LinkType.Rival);
            var link = friend ?? rival;
            if (link == null)
            {
                // Acquaintances are stored as Friend links with zero strength until they know each other.
                link = new RelationshipLink { otherId = other.id, type = LinkType.Friend, strength = 0f, meetings = 0 };
                p.links.Add(link);
            }
            link.meetings++;
            if (link.meetings < s.friendMeetings) return;

            float compat = relationships.Compatibility(p, other);
            if (compat >= s.friendCompatibility)
            {
                link.type = LinkType.Friend;
                link.strength = Math.Min(1f, link.strength + 0.05f);
            }
            else if (compat < s.rivalCompatibility)
            {
                link.type = LinkType.Rival;
                link.strength = Math.Min(1f, link.strength + 0.05f);
            }
        }
    }
}
