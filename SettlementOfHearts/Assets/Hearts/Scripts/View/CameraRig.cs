using UnityEngine;

namespace Hearts.View
{
    // Tilted three-quarter camera: WASD/arrows pan, Q/E or right-drag rotate, scroll zooms.
    public class CameraRig : MonoBehaviour
    {
        public float distance = 22f;
        public float minDistance = 8f;
        public float maxDistance = 45f;
        public float pitch = 50f;
        public float yaw = 35f;
        public float panSpeed = 14f;
        public float bounds = 24f;

        Vector3 target;
        Vector3 focusGoal;
        bool focusing;
        Camera cam;

        public void Init(Camera camera)
        {
            cam = camera;
            target = Vector3.zero;
            Apply();
        }

        public void FocusOn(Vector3 point)
        {
            focusGoal = new Vector3(point.x, 0f, point.z);
            focusing = true;
        }

        public void Tick(bool pointerOverUi)
        {
            float dt = Time.unscaledDeltaTime;
            var forward = Quaternion.Euler(0f, yaw, 0f) * Vector3.forward;
            var right = Quaternion.Euler(0f, yaw, 0f) * Vector3.right;
            var move = Vector3.zero;
            if (InputShim.Held(GameKey.Up)) move += forward;
            if (InputShim.Held(GameKey.Down)) move -= forward;
            if (InputShim.Held(GameKey.Right)) move += right;
            if (InputShim.Held(GameKey.Left)) move -= right;
            if (move.sqrMagnitude > 0f)
            {
                focusing = false;
                target += move.normalized * panSpeed * (distance / 22f) * dt;
            }

            if (InputShim.Held(GameKey.RotateLeft)) yaw += 70f * dt;
            if (InputShim.Held(GameKey.RotateRight)) yaw -= 70f * dt;
            if (InputShim.RightButtonHeld) yaw += InputShim.MouseDelta.x * 0.25f;

            if (!pointerOverUi)
            {
                float scroll = InputShim.Scroll;
                if (Mathf.Abs(scroll) > 0.01f) distance = Mathf.Clamp(distance * (1f - scroll * 0.1f), minDistance, maxDistance);
            }

            if (focusing)
            {
                target = Vector3.Lerp(target, focusGoal, 1f - Mathf.Exp(-6f * dt));
                if ((target - focusGoal).sqrMagnitude < 0.01f) focusing = false;
            }

            target.x = Mathf.Clamp(target.x, -bounds, bounds);
            target.z = Mathf.Clamp(target.z, -bounds, bounds);
            Apply();
        }

        void Apply()
        {
            if (cam == null) return;
            var rot = Quaternion.Euler(pitch, yaw, 0f);
            cam.transform.position = target - rot * Vector3.forward * distance;
            cam.transform.rotation = rot;
        }
    }
}
