using System.Collections.Generic;
using Hearts.Data;
using Hearts.Sim;
using UnityEngine;

namespace Hearts.View
{
    // Starts the game in whatever scene is open: press Play in an empty scene and it builds itself.
    public static class GameBootstrap
    {
#if !HEARTS_NO_AUTOBOOT
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Boot()
        {
            if (Object.FindAnyObjectByType<GameRoot>() != null) return;
            new GameObject("Hearts Game").AddComponent<GameRoot>();
        }
#endif
    }

    // Owns the simulation, ticks it from real time, spawns views and routes sim events to them.
    public class GameRoot : MonoBehaviour
    {
        public static readonly float[] Speeds = { 1f, 2f, 4f };

        [Tooltip("Real seconds per in-game day at 1x speed.")]
        public float secondsPerDay = 60f;
        [Tooltip("0 uses the scenario's seed, or a random one if that is also 0.")]
        public int seedOverride;

        public SimulationRunner Runner { get; private set; }
        public int SelectedId { get; private set; } = -1;
        public int SpeedIndex { get; private set; }
        public bool Paused { get; set; }
        public bool ShowNumbers { get; set; }
        public bool ShowOverlay { get; set; }
        public bool ShowIntro { get; set; } = true;
        public GoalReport GoalReport { get; set; }

        public float SimSpeed { get { return Paused || ShowIntro || GoalReport != null ? 0f : Speeds[SpeedIndex]; } }

        readonly Dictionary<int, PersonView> views = new Dictionary<int, PersonView>();
        readonly Dictionary<int, Transform> links = new Dictionary<int, Transform>();
        readonly List<int> staleLinks = new List<int>();
        WorldBuilder world;
        CameraRig cameraRig;
        Camera cam;
        Hud hud;

        void Start()
        {
            var db = GameDatabase.LoadOrDefault();
            Runner = SimulationRunner.NewGame(db, seedOverride);
            Debug.Log("[Hearts] New game, seed " + Runner.State.seed + ".");

            cam = WorldBuilder.EnsureCamera();
            WorldBuilder.EnsureLight();
            cameraRig = gameObject.AddComponent<CameraRig>();
            cameraRig.Init(cam);

            var worldRoot = new GameObject("World").transform;
            worldRoot.SetParent(transform, false);
            world = new WorldBuilder(worldRoot);
            world.BuildEnvironment();
            SpawnPeople();

            hud = new Hud(this);
            var ev = Runner.Events;
            ev.NudgeResolved += OnNudge;
            ev.Wavering += OnWavering;
            ev.AttitudeFlipped += OnFlip;
            ev.Steadied += OnSteadied;
            ev.BrokeUp += OnBreakUp;
            ev.HeartHealed += id => Say(id, "I'm ready to move on.", Effects.Accept);
            ev.CoupleStageChanged += c => { Burst(c.personA, Effects.Heart, 12); Burst(c.personB, Effects.Heart, 12); };
            ev.GoalReached += report => GoalReport = report;
        }

        void SpawnPeople()
        {
            var state = Runner.State;
            var housed = new HashSet<int>();
            foreach (var p in state.people)
            {
                if (housed.Contains(p.id)) continue;
                var partner = state.PartnerOf(p);
                var label = partner != null ? p.familyName + " & " + partner.familyName : p.FullName;
                var home = world.ClaimHome(label, Color.HSVToRGB(p.hue, 0.4f, 0.9f));
                CreateView(p, home);
                housed.Add(p.id);
                if (partner != null)
                {
                    CreateView(partner, home);
                    housed.Add(partner.id);
                }
            }
        }

        void CreateView(PersonState p, Vector3 home)
        {
            var go = new GameObject();
            go.transform.SetParent(transform, false);
            var view = go.AddComponent<PersonView>();
            view.Init(this, p, home);
            views[p.id] = view;
        }

        public PersonView ViewOf(int personId)
        {
            PersonView v;
            return views.TryGetValue(personId, out v) ? v : null;
        }

        public IEnumerable<PersonView> AllViews { get { return views.Values; } }
        public Camera Camera { get { return cam; } }

        public void Select(int personId, bool focusCamera = false)
        {
            if (SelectedId >= 0 && ViewOf(SelectedId) != null) ViewOf(SelectedId).Selected = false;
            SelectedId = personId;
            var view = ViewOf(personId);
            if (view != null)
            {
                view.Selected = true;
                if (focusCamera) cameraRig.FocusOn(view.transform.position);
            }
        }

        public void Deselect()
        {
            if (SelectedId >= 0 && ViewOf(SelectedId) != null) ViewOf(SelectedId).Selected = false;
            SelectedId = -1;
        }

        public void SetSpeed(int index)
        {
            SpeedIndex = Mathf.Clamp(index, 0, Speeds.Length - 1);
            Paused = false;
        }

        void Update()
        {
            if (Runner == null) return;
            bool overUi = hud.PointerOverUi(InputShim.MousePosition);

            if (InputShim.Down(GameKey.Pause)) Paused = !Paused;
            if (InputShim.Down(GameKey.Speed1)) SetSpeed(0);
            if (InputShim.Down(GameKey.Speed2)) SetSpeed(1);
            if (InputShim.Down(GameKey.Speed3)) SetSpeed(2);
            if (InputShim.Down(GameKey.Overlay)) ShowOverlay = !ShowOverlay;
            if (InputShim.Down(GameKey.Numbers)) ShowNumbers = !ShowNumbers;
            if (InputShim.Down(GameKey.Cancel)) Deselect();
            if (InputShim.Down(GameKey.Focus) && SelectedId >= 0) Select(SelectedId, true);

            if (InputShim.LeftClickDown && !overUi && !ShowIntro && GoalReport == null) ClickWorld();

            cameraRig.Tick(overUi);

            float speed = SimSpeed;
            if (speed > 0f) Runner.Advance(Time.deltaTime * speed * SimulationRunner.HoursPerDay / secondsPerDay);
        }

        void ClickWorld()
        {
            var ray = cam.ScreenPointToRay(InputShim.MousePosition);
            RaycastHit hit;
            if (Physics.Raycast(ray, out hit, 500f))
            {
                var view = hit.collider.GetComponentInParent<PersonView>();
                if (view != null)
                {
                    Select(view.PersonId);
                    return;
                }
            }
            Deselect();
        }

        void LateUpdate()
        {
            if (Runner == null) return;
            var state = Runner.State;
            foreach (var c in state.couples)
            {
                Transform link;
                if (!links.TryGetValue(c.id, out link))
                {
                    link = WorldBuilder.MakeLink(transform);
                    links[c.id] = link;
                }
                var a = ViewOf(c.personA);
                var b = ViewOf(c.personB);
                bool visible = ShowOverlay || SelectedId == c.personA || SelectedId == c.personB;
                if (!visible || a == null || b == null)
                {
                    link.gameObject.SetActive(false);
                    continue;
                }
                float strain = Mathf.Clamp01((c.tension - c.bond) / 40f + 0.5f);
                var color = Color.Lerp(Effects.Heart, new Color(0.35f, 0.35f, 0.4f), strain);
                WorldBuilder.PlaceLink(link, a.transform.position, b.transform.position, 0.06f + c.bond / 100f * 0.22f, color);
            }

            staleLinks.Clear();
            foreach (var kv in links)
                if (state.Couple(kv.Key) == null) staleLinks.Add(kv.Key);
            foreach (var id in staleLinks)
            {
                Destroy(links[id].gameObject);
                links.Remove(id);
            }
        }

        void OnGUI()
        {
            if (hud != null) hud.Draw();
        }

        void Say(int personId, string text, Color color, float seconds = 3f)
        {
            var v = ViewOf(personId);
            if (v != null && !string.IsNullOrEmpty(text)) v.Say(text, color, seconds);
        }

        void Burst(int personId, Color color, int count)
        {
            var v = ViewOf(personId);
            if (v != null) Effects.Burst(v.transform.position + Vector3.up * PersonView.HeadHeight, color, count);
        }

        void OnNudge(NudgeResult r)
        {
            switch (r.outcome)
            {
                case NudgeOutcome.Accepted:
                    Say(r.personId, r.line, Effects.Accept);
                    Burst(r.personId, Effects.Accept, 14);
                    break;
                case NudgeOutcome.ShruggedOff:
                    Say(r.personId, r.line, Effects.Shrug);
                    Burst(r.personId, Effects.Shrug, 6);
                    break;
                case NudgeOutcome.Backfired:
                    Say(r.personId, r.line, Effects.Backfire);
                    Burst(r.personId, Effects.Backfire, 14);
                    break;
            }
        }

        void OnWavering(int personId, int attitude)
        {
            Say(personId, "Hmm...", Effects.Flip, 2.5f);
        }

        void OnFlip(FlipInfo f)
        {
            Say(f.personId, f.thought, Effects.Flip, 5f);
            Burst(f.personId, Effects.Flip, 20);
        }

        void OnSteadied(int personId, int attitude)
        {
            Say(personId, "You're right. I'll hold steady.", Effects.Accept);
            Burst(personId, Effects.Accept, 8);
        }

        void OnBreakUp(CoupleState c)
        {
            Say(c.personA, "It's over.", Effects.Backfire, 4f);
            Say(c.personB, "It's over.", Effects.Backfire, 4f);
            Burst(c.personA, Effects.Backfire, 18);
            Burst(c.personB, Effects.Backfire, 18);

            // The person who left moves into a tent of their own.
            var leaver = Runner.State.Person(c.leaverId >= 0 ? c.leaverId : c.personA);
            var view = ViewOf(leaver.id);
            if (view != null) view.SetHome(world.ClaimHome(leaver.FullName, Color.HSVToRGB(leaver.hue, 0.4f, 0.9f)));
        }
    }
}
