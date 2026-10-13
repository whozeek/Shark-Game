using Hearts.Sim;
using UnityEngine;

namespace Hearts.View
{
    // One per person. Holds only the person's id and draws them; all logic is in the sim.
    public class PersonView : MonoBehaviour
    {
        public const float HeadHeight = 2.1f;

        public int PersonId { get; private set; }
        public string BubbleText { get; private set; }
        public Color BubbleColor { get; private set; }
        public float BubbleAlpha { get { return Mathf.Clamp01(bubbleTime / 0.4f); } }
        public bool Selected { get; set; }

        GameRoot root;
        Renderer bodyRenderer;
        GameObject ring;
        Color baseColor;
        Color hairColor;
        Vector3 home;
        Vector3 goal;
        float idle;
        float bubbleTime;
        float bobPhase;

        public void Init(GameRoot root, PersonState p, Vector3 homePosition)
        {
            this.root = root;
            PersonId = p.id;
            name = "Person " + p.FullName;
            home = homePosition;

            baseColor = Color.HSVToRGB(p.hue, 0.5f, 0.88f);
            hairColor = Color.HSVToRGB(p.hue, 0.6f, 0.35f);

            var body = Effects.Primitive(PrimitiveType.Capsule, "Body", transform, baseColor, keepCollider: true);
            body.transform.localPosition = new Vector3(0f, 0.9f, 0f);
            body.transform.localScale = new Vector3(0.7f, 0.9f, 0.7f);
            bodyRenderer = body.GetComponent<Renderer>();

            var hair = Effects.Primitive(PrimitiveType.Sphere, "Hair", transform, hairColor);
            hair.transform.localPosition = new Vector3(0f, 1.72f, -0.04f);
            hair.transform.localScale = new Vector3(0.6f, 0.38f, 0.6f);

            var nose = Effects.Primitive(PrimitiveType.Cube, "Facing", transform, hairColor);
            nose.transform.localPosition = new Vector3(0f, 1.45f, 0.33f);
            nose.transform.localScale = new Vector3(0.12f, 0.08f, 0.1f);

            ring = Effects.Primitive(PrimitiveType.Cylinder, "SelectionRing", transform, new Color(1f, 0.95f, 0.55f));
            ring.transform.localPosition = new Vector3(0f, 0.02f, 0f);
            ring.transform.localScale = new Vector3(1.3f, 0.01f, 1.3f);
            ring.SetActive(false);

            transform.position = home + RandomOffset(2f);
            goal = transform.position;
            bobPhase = Random.value * 10f;
        }

        public void SetHome(Vector3 position) { home = position; idle = 0f; }

        public void Say(string text, Color color, float seconds = 3f)
        {
            BubbleText = text;
            BubbleColor = color;
            bubbleTime = seconds;
        }

        static Vector3 RandomOffset(float radius)
        {
            var c = Random.insideUnitCircle * radius;
            return new Vector3(c.x, 0f, c.y);
        }

        void Update()
        {
            if (root == null || root.Runner == null) return;
            var p = root.Runner.State.Person(PersonId);
            if (p == null) return;

            if (bubbleTime > 0f) bubbleTime -= Time.unscaledDeltaTime;
            ring.SetActive(Selected);

            var tint = p.IsHeartbroken ? Color.Lerp(baseColor, Color.gray, 0.6f) : baseColor;
            bodyRenderer.material.color = tint;

            float simSpeed = root.SimSpeed;
            if (simSpeed <= 0f) return;

            float dt = Time.deltaTime * Mathf.Sqrt(simSpeed);
            float walkSpeed = p.IsHeartbroken ? 0.7f : 1.4f;

            var flat = goal - transform.position;
            flat.y = 0f;
            if (flat.magnitude < 0.1f)
            {
                idle -= dt;
                if (idle <= 0f) PickGoal(p);
                transform.position = new Vector3(transform.position.x, 0f, transform.position.z);
                return;
            }

            var step = flat.normalized * Mathf.Min(flat.magnitude, walkSpeed * dt);
            transform.position += step;
            bobPhase += dt * 9f;
            transform.position = new Vector3(transform.position.x, Mathf.Abs(Mathf.Sin(bobPhase)) * 0.06f, transform.position.z);
            var look = Quaternion.LookRotation(flat.normalized, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, look, 1f - Mathf.Exp(-8f * dt));
        }

        void PickGoal(PersonState p)
        {
            idle = Random.Range(1.5f, 4.5f);
            var partner = root.Runner.State.PartnerOf(p);
            if (partner != null && Random.value < 0.5f)
            {
                var partnerView = root.ViewOf(partner.id);
                if (partnerView != null)
                {
                    goal = partnerView.transform.position + RandomOffset(1.2f);
                    return;
                }
            }
            // Sociable people wander toward the campfire more often.
            int social = root.Runner.Db.TraitIndex(TraitIds.Sociability);
            float sociability = social >= 0 ? p.traits[social] : 50f;
            if (Random.value < sociability / 200f) goal = RandomOffset(3f);
            else goal = home + RandomOffset(4f);
        }
    }
}
