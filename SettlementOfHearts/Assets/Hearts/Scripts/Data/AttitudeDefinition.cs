using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // A malleable attitude (-100 to +100) that influence moves.
    [CreateAssetMenu(menuName = "Hearts/Attitude", fileName = "AttitudeDefinition")]
    public class AttitudeDefinition : ScriptableObject
    {
        public AttitudeDef data = new AttitudeDef();
    }
}
