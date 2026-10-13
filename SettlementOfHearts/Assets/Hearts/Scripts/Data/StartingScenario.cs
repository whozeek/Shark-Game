using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // Who starts in the settlement and the opening goal.
    [CreateAssetMenu(menuName = "Hearts/Starting Scenario", fileName = "StartingScenario")]
    public class StartingScenario : ScriptableObject
    {
        public ScenarioDef data = new ScenarioDef();
    }
}
