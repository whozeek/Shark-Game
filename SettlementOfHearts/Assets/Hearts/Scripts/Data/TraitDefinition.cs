using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // A personality trait (0-100), fixed at birth.
    [CreateAssetMenu(menuName = "Hearts/Trait", fileName = "TraitDefinition")]
    public class TraitDefinition : ScriptableObject
    {
        public TraitDef data = new TraitDef();
    }
}
