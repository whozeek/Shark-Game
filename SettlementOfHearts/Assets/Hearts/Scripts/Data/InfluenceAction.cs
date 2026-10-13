using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // One nudge the player can spend Influence on.
    [CreateAssetMenu(menuName = "Hearts/Influence Action", fileName = "InfluenceAction")]
    public class InfluenceAction : ScriptableObject
    {
        public NudgeDef data = new NudgeDef();
    }
}
