# Settlement of Hearts (working title)

A settlement-growing game in which you are an unseen matchmaker. You nudge people with
free will toward being good or bad partners, staying or leaving, and seeking love or
staying single, and they decide for themselves whether to listen.

This folder is the Unity project. It currently contains **build steps 0 to 2** from the
design doc: the data skeleton, the influence toy, and matchmaking with the full
relationship lifecycle.

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
| Introduce two singles | Matchmake in a single person's inspector, then click someone with a pink ring |
| Pan / rotate / zoom | WASD or arrows / Q, E or right-drag / scroll |
| Pause, speed 1x 2x 4x | Space, 1, 2, 3 |
| Show all relationships | R |
| Show raw numbers | F1 |
| Focus camera on selected person / close inspector or cancel matchmaking | F / Esc |

### What's in this build

- Twelve hand-authored people with seven traits, three attitudes and quirks. Two couples, one well matched and one not, plus eight singles.
- Six nudges paid with regenerating Influence. Each nudge rolls acceptance against the person's stubbornness, their nature and recent nudges, and it can be accepted, shrugged off or backfire.
- Free will: attitudes drift back toward each person's nature, and people sometimes change their minds on their own. A `?!` warns you a day ahead, and **Steady** cancels the change at a premium.
- Matchmaking: introduce two single adults for 15 Influence. Hearts over each candidate show attraction. You start with one matchmaking slot, and it comes back when that couple makes it official or splits up.
- Couples go Courting, then Dating, then Established, and move into one tent when they make it official.
- People meet each other every day, more often if they're sociable. Willing singles who click can start courting on their own, and people form friends and rivals.
- Bond and Tension per couple, breakups, heartbreak, ex-partners (less attracted to each other) and bad-partner reputations (less attractive to everyone).
- A 45-day goal: two new official couples, keep Mara and Tomas together, decide about Ilse and Davin. You can keep playing afterwards.
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

**Hearts > Sim Runner** runs many settlements headless (optionally with an auto-matchmaker)
and plots couples, singles, heartbreak, breakups and changes of heart over time.

`TuningReport.StartingScenarioReport` prints balance numbers. With the current settings:
Ilse and Davin stay together in about 30% of untouched runs and Mara and Tomas always do; a
nudge from rest works about 58% of the time; an introduced couple makes it official in about
two to three weeks; an auto-matchmaker meets the 45-day goal in about 94% of runs, while
without the player about one couple forms on its own.

## Tuning changes from the design doc

- A nudge counts as "against their nature" only once the person is already 15+ points past their resting point in that direction, so a first push from rest is fair.
- Volatility adds a daily random mood swing (up to 8 points), which keeps changes of heart happening.
- Courting and Dating couples get +2 Bond a day ("new romance"); Established couples lose 1.5 a day to routine, so a bad partner can slowly sink a relationship.
- A Matchmake needs Attraction 55, not 40, because most of the starting cast is warm and almost every pair cleared 40.

## Next (from the build order)

Step 3 adds families and aging: life stages, children (up to three per couple), inheritance,
upbringing, and deaths.
