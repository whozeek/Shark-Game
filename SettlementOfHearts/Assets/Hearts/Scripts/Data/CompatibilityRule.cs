using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // Compares one trait between two people.
    [CreateAssetMenu(menuName = "Hearts/Compatibility Rule", fileName = "CompatibilityRule")]
    public class CompatibilityRule : ScriptableObject
    {
        public CompatibilityRuleDef data = new CompatibilityRuleDef();
    }
}
