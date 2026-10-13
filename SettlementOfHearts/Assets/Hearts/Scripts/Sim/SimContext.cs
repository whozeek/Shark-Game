using System;

namespace Hearts.Sim
{
    // Shared handles every system needs.
    public class SimContext
    {
        public const int MaxFeed = 60;
        public const int MaxStory = 30;

        public readonly ContentDb db;
        public readonly SettlementState state;
        public readonly Rng rng;
        public readonly SimEvents events;

        public SimSettings S { get { return db.settings; } }

        public SimContext(ContentDb db, SettlementState state, SimEvents events)
        {
            this.db = db;
            this.state = state;
            this.events = events;
            rng = new Rng(state);
        }

        public void Feed(string text, int personId, FeedKind kind)
        {
            state.feed.Add(new FeedEntry { day = state.day, text = text, personId = personId, kind = kind });
            if (state.feed.Count > MaxFeed) state.feed.RemoveAt(0);
        }

        public void Story(PersonState p, string text)
        {
            p.story.Add(new StoryEntry(state.day, text));
            if (p.story.Count > MaxStory) p.story.RemoveAt(0);
        }

        public static float Clamp(float v, float min, float max) { return v < min ? min : v > max ? max : v; }
        public static float Clamp100(float v) { return Clamp(v, -100f, 100f); }
        public static float Clamp01x100(float v) { return Clamp(v, 0f, 100f); }
    }
}
