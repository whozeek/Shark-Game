using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace Hearts.View
{
    public enum GameKey
    {
        Pause,
        Speed1,
        Speed2,
        Speed3,
        Overlay,
        Numbers,
        Cancel,
        Focus,
        Up,
        Down,
        Left,
        Right,
        RotateLeft,
        RotateRight
    }

    // Works with either the Input System package or the legacy Input Manager,
    // whichever the project's Active Input Handling setting enables.
    public static class InputShim
    {
        public static Vector2 MousePosition
        {
            get
            {
#if ENABLE_INPUT_SYSTEM
                return Mouse.current != null ? Mouse.current.position.ReadValue() : Vector2.zero;
#else
                return Input.mousePosition;
#endif
            }
        }

        public static bool LeftClickDown
        {
            get
            {
#if ENABLE_INPUT_SYSTEM
                return Mouse.current != null && Mouse.current.leftButton.wasPressedThisFrame;
#else
                return Input.GetMouseButtonDown(0);
#endif
            }
        }

        public static bool RightButtonHeld
        {
            get
            {
#if ENABLE_INPUT_SYSTEM
                return Mouse.current != null && Mouse.current.rightButton.isPressed;
#else
                return Input.GetMouseButton(1);
#endif
            }
        }

        public static Vector2 MouseDelta
        {
            get
            {
#if ENABLE_INPUT_SYSTEM
                return Mouse.current != null ? Mouse.current.delta.ReadValue() : Vector2.zero;
#else
                return new Vector2(Input.GetAxis("Mouse X"), Input.GetAxis("Mouse Y")) * 10f;
#endif
            }
        }

        // Positive when scrolling up, roughly one unit per notch.
        public static float Scroll
        {
            get
            {
#if ENABLE_INPUT_SYSTEM
                return Mouse.current != null ? Mouse.current.scroll.ReadValue().y / 120f : 0f;
#else
                return Input.mouseScrollDelta.y;
#endif
            }
        }

        public static bool Down(GameKey key)
        {
#if ENABLE_INPUT_SYSTEM
            var k = Keyboard.current;
            if (k == null) return false;
            switch (key)
            {
                case GameKey.Pause: return k.spaceKey.wasPressedThisFrame;
                case GameKey.Speed1: return k.digit1Key.wasPressedThisFrame;
                case GameKey.Speed2: return k.digit2Key.wasPressedThisFrame;
                case GameKey.Speed3: return k.digit3Key.wasPressedThisFrame;
                case GameKey.Overlay: return k.rKey.wasPressedThisFrame;
                case GameKey.Numbers: return k.f1Key.wasPressedThisFrame;
                case GameKey.Cancel: return k.escapeKey.wasPressedThisFrame;
                case GameKey.Focus: return k.fKey.wasPressedThisFrame;
            }
            return false;
#else
            switch (key)
            {
                case GameKey.Pause: return Input.GetKeyDown(KeyCode.Space);
                case GameKey.Speed1: return Input.GetKeyDown(KeyCode.Alpha1);
                case GameKey.Speed2: return Input.GetKeyDown(KeyCode.Alpha2);
                case GameKey.Speed3: return Input.GetKeyDown(KeyCode.Alpha3);
                case GameKey.Overlay: return Input.GetKeyDown(KeyCode.R);
                case GameKey.Numbers: return Input.GetKeyDown(KeyCode.F1);
                case GameKey.Cancel: return Input.GetKeyDown(KeyCode.Escape);
                case GameKey.Focus: return Input.GetKeyDown(KeyCode.F);
            }
            return false;
#endif
        }

        public static bool Held(GameKey key)
        {
#if ENABLE_INPUT_SYSTEM
            var k = Keyboard.current;
            if (k == null) return false;
            switch (key)
            {
                case GameKey.Up: return k.wKey.isPressed || k.upArrowKey.isPressed;
                case GameKey.Down: return k.sKey.isPressed || k.downArrowKey.isPressed;
                case GameKey.Left: return k.aKey.isPressed || k.leftArrowKey.isPressed;
                case GameKey.Right: return k.dKey.isPressed || k.rightArrowKey.isPressed;
                case GameKey.RotateLeft: return k.qKey.isPressed;
                case GameKey.RotateRight: return k.eKey.isPressed;
            }
            return false;
#else
            switch (key)
            {
                case GameKey.Up: return Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow);
                case GameKey.Down: return Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow);
                case GameKey.Left: return Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow);
                case GameKey.Right: return Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow);
                case GameKey.RotateLeft: return Input.GetKey(KeyCode.Q);
                case GameKey.RotateRight: return Input.GetKey(KeyCode.E);
            }
            return false;
#endif
        }
    }
}
