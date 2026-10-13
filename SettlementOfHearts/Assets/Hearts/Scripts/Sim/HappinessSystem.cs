namespace Hearts.Sim
{
    // Personal happiness moves toward a target set by the person's situation.
    public class HappinessSystem
    {
        readonly SimContext ctx;

        public HappinessSystem(SimContext ctx) { this.ctx = ctx; }

        public float Target(PersonState p)
        {
            var s = ctx.S;
            float target = s.happinessRest;
            if (p.IsHeartbroken) target += s.happinessHeartbroken;

            var partner = ctx.state.PartnerOf(p);
            if (partner != null)
            {
                float pd = partner.attitudes[ctx.db.PartnerDisposition];
                if (pd > s.goodPartnerThreshold) target += s.happinessGoodPartner;
                else if (pd < s.badPartnerThreshold) target += s.happinessBadPartner;
            }
            else if (!p.IsHeartbroken && p.attitudes[ctx.db.RelationshipDesire] > s.lonelyDesireThreshold)
            {
                target += s.happinessLonely;
            }
            return SimContext.Clamp01x100(target);
        }

        public void DailyTick(PersonState p)
        {
            p.happiness += (Target(p) - p.happiness) * ctx.S.happinessMovePerDay;
        }
    }
}
