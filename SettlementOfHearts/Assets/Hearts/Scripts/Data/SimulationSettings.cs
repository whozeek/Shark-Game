using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // Every global tuning number.
    [CreateAssetMenu(menuName = "Hearts/Simulation Settings", fileName = "SimulationSettings")]
    public class SimulationSettings : ScriptableObject
    {
        public SimSettings data = new SimSettings();
    }
}
