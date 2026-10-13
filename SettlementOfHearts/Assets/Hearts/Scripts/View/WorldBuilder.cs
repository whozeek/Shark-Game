using UnityEngine;

namespace Hearts.View
{
    // Greybox Camp: a clearing, a campfire, a few trees and tents placed on a ring.
    public class WorldBuilder
    {
        const int HomeSlots = 10;
        const float HomeRadius = 10f;

        readonly Transform root;
        readonly bool[] slotUsed = new bool[HomeSlots];

        public WorldBuilder(Transform root) { this.root = root; }

        public void BuildEnvironment()
        {
            var ground = Effects.Primitive(PrimitiveType.Plane, "Ground", root, new Color(0.47f, 0.62f, 0.36f), keepCollider: true);
            ground.transform.localScale = new Vector3(6f, 1f, 6f);

            var clearing = Effects.Primitive(PrimitiveType.Cylinder, "Clearing", root, new Color(0.62f, 0.55f, 0.4f));
            clearing.transform.localPosition = new Vector3(0f, -0.04f, 0f);
            clearing.transform.localScale = new Vector3(9f, 0.05f, 9f);

            var fire = Effects.Primitive(PrimitiveType.Cylinder, "Campfire", root, new Color(0.3f, 0.22f, 0.18f));
            fire.transform.localPosition = new Vector3(0f, 0.1f, 0f);
            fire.transform.localScale = new Vector3(1.2f, 0.1f, 1.2f);
            var flame = Effects.Primitive(PrimitiveType.Sphere, "Flame", fire.transform, new Color(1f, 0.6f, 0.2f));
            flame.transform.localPosition = new Vector3(0f, 3f, 0f);
            flame.transform.localScale = new Vector3(0.5f, 6f, 0.5f);

            var rng = new System.Random(7);
            for (int i = 0; i < 28; i++)
            {
                float angle = (float)rng.NextDouble() * Mathf.PI * 2f;
                float radius = 17f + (float)rng.NextDouble() * 10f;
                var pos = new Vector3(Mathf.Cos(angle) * radius, 0f, Mathf.Sin(angle) * radius);
                float size = 0.8f + (float)rng.NextDouble() * 0.8f;
                var trunk = Effects.Primitive(PrimitiveType.Cylinder, "Tree", root, new Color(0.4f, 0.28f, 0.18f));
                trunk.transform.localPosition = pos + Vector3.up * size;
                trunk.transform.localScale = new Vector3(0.35f * size, size, 0.35f * size);
                var crown = Effects.Primitive(PrimitiveType.Sphere, "Crown", root, new Color(0.25f, 0.45f + (float)rng.NextDouble() * 0.1f, 0.25f));
                crown.transform.localPosition = pos + Vector3.up * (2.6f * size);
                crown.transform.localScale = Vector3.one * 2.2f * size;
            }
        }

        public static Camera EnsureCamera()
        {
            var cam = Camera.main;
            if (cam == null)
            {
                var go = new GameObject("Main Camera");
                go.tag = "MainCamera";
                cam = go.AddComponent<Camera>();
                go.AddComponent<AudioListener>();
            }
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.62f, 0.78f, 0.9f);
            cam.fieldOfView = 40f;
            cam.farClipPlane = 300f;
            return cam;
        }

        public static void EnsureLight()
        {
            foreach (var l in Object.FindObjectsByType<Light>(FindObjectsSortMode.None))
                if (l.type == LightType.Directional) return;
            var go = new GameObject("Sun");
            var light = go.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            light.shadows = LightShadows.Soft;
            go.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
        }

        public Vector3 ClaimHome(string label, Color color)
        {
            int slot = 0;
            for (int i = 0; i < HomeSlots; i++)
            {
                if (!slotUsed[i]) { slot = i; break; }
            }
            slotUsed[slot] = true;
            float angle = slot * Mathf.PI * 2f / HomeSlots + 0.3f;
            var pos = new Vector3(Mathf.Cos(angle) * HomeRadius, 0f, Mathf.Sin(angle) * HomeRadius);
            BuildTent(label, pos, color);
            return pos + (Vector3.zero - pos).normalized * 2.2f;
        }

        void BuildTent(string label, Vector3 pos, Color color)
        {
            var tent = new GameObject("Tent " + label);
            tent.transform.SetParent(root, false);
            tent.transform.localPosition = pos;
            tent.transform.rotation = Quaternion.LookRotation((Vector3.zero - pos).normalized, Vector3.up);

            var canvas = Effects.Primitive(PrimitiveType.Cube, "Canvas", tent.transform, Color.Lerp(color, new Color(0.9f, 0.85f, 0.75f), 0.55f));
            canvas.transform.localPosition = new Vector3(0f, 0.8f, 0f);
            canvas.transform.localRotation = Quaternion.Euler(0f, 0f, 45f);
            canvas.transform.localScale = new Vector3(1.8f, 1.8f, 2.4f);

            var door = Effects.Primitive(PrimitiveType.Cube, "Door", tent.transform, new Color(0.25f, 0.2f, 0.18f));
            door.transform.localPosition = new Vector3(0f, 0.45f, 1.2f);
            door.transform.localScale = new Vector3(0.6f, 0.9f, 0.05f);
        }

        public static Transform MakeLink(Transform parent)
        {
            var go = Effects.Primitive(PrimitiveType.Cube, "PartnerLink", parent, Effects.Heart);
            return go.transform;
        }

        public static void PlaceLink(Transform link, Vector3 a, Vector3 b, float width, Color color)
        {
            a.y = b.y = 0.08f;
            var delta = b - a;
            float length = delta.magnitude;
            if (length < 0.01f)
            {
                link.gameObject.SetActive(false);
                return;
            }
            link.gameObject.SetActive(true);
            link.position = (a + b) * 0.5f;
            link.rotation = Quaternion.LookRotation(delta / length, Vector3.up);
            link.localScale = new Vector3(width, 0.04f, length);
            link.GetComponent<Renderer>().material.color = color;
        }
    }
}
