using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // A rule-modifying tag that makes a person memorable.
    [CreateAssetMenu(menuName = "Hearts/Quirk", fileName = "QuirkDefinition")]
    public class QuirkDefinition : ScriptableObject
    {
        public QuirkDef data = new QuirkDef();
    }
}
