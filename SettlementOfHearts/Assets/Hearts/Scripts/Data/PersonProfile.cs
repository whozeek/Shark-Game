using Hearts.Sim;
using UnityEngine;

namespace Hearts.Data
{
    // A hand-authored person.
    [CreateAssetMenu(menuName = "Hearts/Person Profile", fileName = "PersonProfile")]
    public class PersonProfile : ScriptableObject
    {
        public PersonProfileDef data = new PersonProfileDef();
    }
}
