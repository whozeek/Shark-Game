using System;
using System.Collections.Generic;

namespace Hearts.Sim
{
    public enum NudgeOutcome
    {
        Accepted,
        ShruggedOff,
        Backfired,
        NotEnoughInfluence,
        Blocked
    }

    public enum NudgeHint
    {
        Likely,
        Uncertain,
        Unlikely
    }

    public struct NudgePreview
    {
        public float chance;
        public int cost;
        public bool againstNature;
        public NudgeHint hint;
        public string blockedReason;

        public bool Blocked { get { return !string.IsNullOrEmpty(blockedReason); } }
    }

    public struct NudgeResult
    {
        public int personId;
        public string nudgeId;
        public NudgeOutcome outcome;
        public float chance;
        public float before;
        public float after;
        public int cost;
        public string line;
    }

    public struct FlipInfo
    {
        public int personId;
        public int attitude;
        public float from;
        public float to;
        public string thought;
    }

    public struct MatchPreview
    {
        public float attraction;
        public int cost;
        // Set when the introduction can't be attempted at all (nothing is spent).
        public string blockedReason;
        // Set when it can be attempted but will not take (half the cost is refunded).
        public string failReason;

        public bool Blocked { get { return !string.IsNullOrEmpty(blockedReason); } }
        public bool WillCourt { get { return !Blocked && string.IsNullOrEmpty(failReason); } }
    }

    public struct MatchResult
    {
        public int personA;
        public int personB;
        public bool success;
        public bool attempted;
        public int spent;
        public string reason;
        public int coupleId;
    }

    public class GoalReport
    {
        public int day;
        public string goal;
        public List<string> lines = new List<string>();
    }

    // The only way the simulation talks to presentation code.
    public class SimEvents
    {
        public event Action<int> DayStarted;
        public event Action<NudgeResult> NudgeResolved;
        public event Action<int, int> Wavering;           // personId, attitude index
        public event Action<FlipInfo> AttitudeFlipped;
        public event Action<int, int> Steadied;           // personId, attitude index
        public event Action<CoupleState> CoupleFormed;
        public event Action<CoupleState> CoupleStageChanged;
        public event Action<MatchResult> MatchmakeResolved;
        public event Action<CoupleState> BrokeUp;
        public event Action<int> HeartHealed;             // personId
        public event Action<GoalReport> GoalReached;

        internal void RaiseDayStarted(int day) { if (DayStarted != null) DayStarted(day); }
        internal void RaiseNudge(NudgeResult r) { if (NudgeResolved != null) NudgeResolved(r); }
        internal void RaiseWavering(int p, int a) { if (Wavering != null) Wavering(p, a); }
        internal void RaiseFlip(FlipInfo f) { if (AttitudeFlipped != null) AttitudeFlipped(f); }
        internal void RaiseSteadied(int p, int a) { if (Steadied != null) Steadied(p, a); }
        internal void RaiseFormed(CoupleState c) { if (CoupleFormed != null) CoupleFormed(c); }
        internal void RaiseMatch(MatchResult m) { if (MatchmakeResolved != null) MatchmakeResolved(m); }
        internal void RaiseStage(CoupleState c) { if (CoupleStageChanged != null) CoupleStageChanged(c); }
        internal void RaiseBreakUp(CoupleState c) { if (BrokeUp != null) BrokeUp(c); }
        internal void RaiseHealed(int p) { if (HeartHealed != null) HeartHealed(p); }
        internal void RaiseGoal(GoalReport g) { if (GoalReached != null) GoalReached(g); }
    }
}
