# Settlement of Hearts (working title)

A settlement-growing game in which you are an unseen matchmaker. You nudge people with
free will toward being good or bad partners, staying or leaving, and seeking love or
staying single, and they decide for themselves whether to listen.

This folder is the Unity project. It currently contains **build steps 0 and 1** from the
design doc: the data skeleton and the "influence toy", the smallest playable version of
the influence system.

## Play it

1. Install Unity 6 (6000.0 LTS) through Unity Hub.
2. In Unity Hub choose **Add > Add project from disk** and pick this `SettlementOfHearts` folder.
   If your Unity 6 version differs from the one in `ProjectSettings/ProjectVersion.txt`, let Hub open it with yours.
3. If Unity asks whether to enable the new Input System backends, either answer works.
4. Press **Play**. Any scene will do, including the empty one Unity opens with; the game builds itself at runtime.

### Controls

| Action | Input |
| --- | --- |
| Inspect a person | Left-click them |
| Pan / rotate / zoom | WASD or arrows / Q, E or right-drag / scroll |
| Pause, speed 1x 2x 4x | Space, 1, 2, 3 |
| Show all relationships | R |
| Show raw numbers | F1 |
| Focus camera on selected person / close inspector | F / Esc |

### What's in this build

- Six hand-authored people with seven traits, three attitudes and quirks. Two couples, one well matched and one not, plus two singles.
- Six nudges paid with regenerating Influence. Each nudge rolls acceptance against the person's stubbornness, their nature and recent nudges, and it can be accepted, shrugged off or backfire.
- Free will: attitudes drift back toward each person's nature, and people sometimes change their minds on their own. A `?!` warns you a day ahead, and **Steady** cancels the change at a premium.
- Bond and Tension per couple, breakups, heartbreak and ex-partner links.
- A 30-day goal with an end-of-month report. You can keep playing afterwards.
- Capsule people, tents and primitive VFX only. Real art starts at build step 6.

## Project layout

```
Assets/Hearts/
  Scripts/Sim/    Hearts.Sim: pure C# simulation, no UnityEngine reference (state, systems, events, RNG, default content)
  Scripts/Data/   Hearts.Data: ScriptableObject wrappers + GameDatabase
  Scripts/View/   Hearts.View: GameRoot, people, camera, VFX, IMGUI HUD and inspector
  Scripts/Editor/ Hearts.Editor: "Hearts" menu
  Tests/EditMode/ NUnit tests for the simulation (Unity Test Runner)
Tools/SimTests/   Runs the same simulation tests with plain .NET, no Unity needed
```

The simulation only talks to the scene through `SimEvents`, and views only hold person ids.

## Editing people and traits as data

The game runs on built-in content until you create data assets:

1. **Hearts > Create Default Data Assets** writes every trait, attitude, quirk, nudge,
   compatibility rule, person and the starting scenario to `Assets/Hearts/Data/`, and creates
   `Assets/Hearts/Resources/GameDatabase.asset`.
2. Edit the assets in the Inspector. For example, change Davin's traits, add a quirk, or tune
   `SimulationSettings`.
3. **Hearts > Validate Game Database** reports missing or unknown ids. At runtime an invalid
   database logs its errors and falls back to built-in content.

## Tests

- In Unity: **Window > General > Test Runner > EditMode > Run All**.
- Without Unity: `dotnet test Tools/SimTests` (needs the .NET 8 SDK).

`TuningReport.FirstMonthReport` prints balance numbers from 500 headless runs. With the
current settings, Ilse and Davin stay together in about a third of untouched runs, Mara and
Tomas always do, and a nudge from rest works about 57% of the time.

## Next (from the build order)

Step 2 adds matchmaking and the full relationship lifecycle: compatibility preview, courting,
dating, natural meetings and the Sim Runner editor window.
