using UnityEngine;

namespace Hearts.View
{
    // Placeholder VFX built from primitives, so they work in any render pipeline.
    public static class Effects
    {
        public static readonly Color Accept = new Color(0.35f, 0.9f, 0.45f);
        public static readonly Color Shrug = new Color(0.7f, 0.7f, 0.72f);
        public static readonly Color Backfire = new Color(0.95f, 0.3f, 0.25f);
        public static readonly Color Flip = new Color(1f, 0.85f, 0.3f);
        public static readonly Color Heart = new Color(1f, 0.4f, 0.55f);

        public static GameObject Primitive(PrimitiveType type, string name, Transform parent, Color color, bool keepCollider = false)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            if (!keepCollider) Object.Destroy(go.GetComponent<Collider>());
            if (parent != null) go.transform.SetParent(parent, false);
            go.GetComponent<Renderer>().material.color = color;
            return go;
        }

        public static void Burst(Vector3 position, Color color, int count, float speed = 2.5f, float size = 0.18f)
        {
            for (int i = 0; i < count; i++)
            {
                var go = Primitive(PrimitiveType.Sphere, "Spark", null, color);
                go.transform.position = position;
                go.transform.localScale = Vector3.one * size;
                var p = go.AddComponent<SparkParticle>();
                var dir = Random.onUnitSphere;
                dir.y = Mathf.Abs(dir.y) + 0.6f;
                p.velocity = dir.normalized * speed * Random.Range(0.6f, 1.2f);
                p.life = p.maxLife = Random.Range(0.7f, 1.1f);
            }
        }
    }

    public class SparkParticle : MonoBehaviour
    {
        public Vector3 velocity;
        public float life;
        public float maxLife = 1f;
        Vector3 startScale;

        void Start() { startScale = transform.localScale; }

        void Update()
        {
            float dt = Time.unscaledDeltaTime;
            life -= dt;
            if (life <= 0f)
            {
                Destroy(gameObject);
                return;
            }
            velocity += Vector3.down * 3f * dt;
            velocity *= 1f - 1.5f * dt;
            transform.position += velocity * dt;
            transform.localScale = startScale * Mathf.Clamp01(life / maxLife);
        }
    }
}
