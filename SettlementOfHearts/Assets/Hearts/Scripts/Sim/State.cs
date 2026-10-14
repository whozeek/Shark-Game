using System;
using System.Collections.Generic;

namespace Hearts.Sim
{
    // Runtime state. Everything the game needs to save lives here; definitions are referenced by id.

    [Serializable]
    public class StoryEntry
    {
        public int day;
        public string text;

        public StoryEntry(int day, string text)
        {
            this.day = day;
            this.text = text;
        }
    }

    public enum LinkType
    {
        Partner,
        ExPartner,
        Parent,
        Child,
        Sibling,
        Friend,
        Rival
    }

    [Serializable]
    public class RelationshipLink
    {
        public int otherId;
        public LinkType type;
        public float strength;
        public int meetings;
    }

    [Serializable]
    public class PersonState
    {
        public int id;
        public string profileId;
        public string firstName;
        public string familyName;
        public int age;
        public float hue;
        public string bio;
        public float[] traits;
        public float[] attitudes;
        public List<string> quirkIds = new List<string>();
        public float happiness = 60f;
        public int coupleId = -1;
        public int heartbrokenDaysLeft;
        // Consecutive days spent as a known bad partner; the whole settlement notices.
        public int daysBadPartner;
        // A pending change of heart per attitude, executed at the next day tick.
        public bool[] wavering;
        public float[] waveringTarget;
        public List<int> nudgeDays = new List<int>();
        public List<StoryEntry> story = new List<StoryEntry>();
        public List<RelationshipLink> links = new List<RelationshipLink>();

        public string FullName { get { return firstName + " " + familyName; } }
        public bool IsHeartbroken { get { return heartbrokenDaysLeft > 0; } }
        public bool IsSingle { get { return coupleId < 0; } }

        public RelationshipLink Link(int otherId, LinkType type)
        {
            foreach (var l in links)
                if (l.otherId == otherId && l.type == type) return l;
            return null;
        }
        public bool HasPartner { get { return coupleId >= 0; } }
    }

    [Serializable]
    public class CoupleState
    {
        public int id;
        public int personA;
        public int personB;
        public CoupleStage stage;
        public float bond;
        public float tension;
        public float compatibility;
        public float spark;
        public int daysAtHighBond;
        public int childCount;
        public int lastChildDay;
        public int formedDay;
        public bool usesMatchmakingSlot;
        public bool matchmade;
        public int leaverId = -1;

        public int Other(int personId) { return personId == personA ? personB : personA; }
        public float Attraction { get { return compatibility + spark; } }
    }

    [Serializable]
    public class FeedEntry
    {
        public int day;
        public string text;
        public int personId;
        public FeedKind kind;
    }

    public enum FeedKind
    {
        Info,
        Good,
        Bad,
        Flip
    }

    [Serializable]
    public class SessionStats
    {
        public int nudgesTried;
        public int accepted;
        public int shrugged;
        public int backfired;
        public int flips;
        public int steadied;
        public int breakups;
        public int matchmakes;
        public int failedMatchmakes;
        public int naturalCouples;
        public int established;
    }

    [Serializable]
    public class SettlementState
    {
        public int version = 1;
        public string scenarioId;
        public int seed;
        public int day = 1;
        public float hourOfDay = 8f;
        public float influence;
        public float maxInfluence;
        public int matchmakingSlots = 1;
        public ulong rngState;
        public int nextPersonId;
        public int nextCoupleId;
        public bool goalReported;
        public List<PersonState> people = new List<PersonState>();
        public List<CoupleState> couples = new List<CoupleState>();
        public List<FeedEntry> feed = new List<FeedEntry>();
        public SessionStats stats = new SessionStats();

        public PersonState Person(int id)
        {
            for (int i = 0; i < people.Count; i++)
                if (people[i].id == id) return people[i];
            return null;
        }

        public CoupleState Couple(int id)
        {
            for (int i = 0; i < couples.Count; i++)
                if (couples[i].id == id) return couples[i];
            return null;
        }

        public CoupleState CoupleOf(PersonState p)
        {
            return p == null || p.coupleId < 0 ? null : Couple(p.coupleId);
        }

        public PersonState PartnerOf(PersonState p)
        {
            var c = CoupleOf(p);
            return c == null ? null : Person(c.Other(p.id));
        }
    }
}
