# Rainfall Avenue

A relaxing first-person walk through rainy 3D city streets, with original lo-fi music. It's built for big screens and still works on phones. You can explore at your own pace or let the scenic stroll walk for you, like a screensaver.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (host anywhere)
```

## Cities
| City | Neighbourhood | Signature features |
|---|---|---|
| New York (default) | West Village–inspired | Brownstones with stoops, fire escapes, awnings, cafés, a pocket park with a fountain, taxis, distant skyline |
| Chicago | Riverfront Loop | Towers with setbacks, a river crossed by steel truss bridges with bridge houses, and a passing elevated train |
| Los Angeles | Arts District | Wide streets, warehouses with murals and roll-up doors, palms, power lines, billboards, a food-truck lot, hazy hills |
| Miami | Ocean Drive | Pastel Art Deco hotels with neon names and terraces, a palm park, a beach with lifeguard huts, the ocean |
| Kyoto (stylised) | Canal Lanes | Wooden lattice houses, tiled eaves, lanterns, a willow-lined canal with bridges, a garden pond, a covered market, a pagoda on the hills |
| London | Marylebone Terraces | Georgian brick and white stucco terraces with railings, corner pubs, a garden square, red double-deckers and black cabs driving on the left |
| Paris | Left Bank Boulevards | Haussmann façades with iron balconies and zinc mansards, café terraces, plane-tree boulevards, advertising columns, a Métro platform |
| Seoul | Neon Alleys | Narrow lanes under stacked signboards, tent bars, convenience stores, tangled power lines, delivery scooters |
| Amsterdam | Canal Ring | Gabled canal houses, two canals with houseboats, bridges outlined in lights, parked bicycles everywhere |

All layouts, façades, shop names and skylines are artistic interpretations, not maps. Some street names are borrowed for flavour.

## Things to do
- **Step inside:** every city has a walk-in café (a tea house in Kyoto), and New York also has a laundromat. Take a window seat and watch the rain.
- **Go up or down a level:** a rooftop terrace above the New York café, subway platforms in New York and Paris, and an elevated-train platform in Chicago where the train stops.
- **Seasons:** spring blossom, summer greens, autumn leaves, and winter snow or sleet that settles over time.
- **The city follows the clock:** shops open and close with shutters, windows go dark through the night, the streets quieten after midnight, and delivery vans double-park at dawn. You can turn this off in City Life.
- **Street life:** food carts, people on benches and at bus stops, buses that pull in at their stops, delivery riders, dog walkers, and headphone wearers nodding along to the music.
- **Your own music:** play your own audio files (Audio → Add music files). They stay on your device and are never uploaded.
- **Moods:** save the current scene and come back to it, or copy a link that opens the same city, time, weather and look on another device.

## Controls
- **Moving:** WASD to walk. Arrow keys walk forward/back and turn. Hold Shift to walk faster. Drag to look around.
- **Modes:** T switches between free walk and scenic stroll. P opens photo mode (Enter captures a picture).
- **Actions:** E sits down, uses stairs and doors, or pauses at a viewpoint. U opens or closes your umbrella. R returns you to the starting view.
- **Menus and display:** M opens settings and Esc closes them. H hides or shows the interface. F switches to full screen.
- **Music:** K plays or pauses. N skips to the next track.
- **Touch:** use the virtual stick at the bottom left to walk and drag anywhere else to look.
- **Gamepad:** left stick walks, right stick looks around.

## Architecture (`src/`)
- **`core/`:** settings (defaults, schema, presets, saving to localStorage), quality profiles and a seeded random-number generator.
- **`render/`:**
  - `engine.js`: renderer and post-processing (MSAA, bloom, depth of field, colour grade).
  - `reflections.js`: one shared planar reflection that every wet surface samples.
  - `shared.js`: material patches that add puddles, ripples, reflection blur and streaks, glass reflections and the world-space rainbow.
  - `sky.js`, `atmosphere.js`: simulated weather and time of day.
  - `lights.js`: point lights that follow you, light pools on the ground and light cones under lamps.
  - `rain.js`: GPU rain in three layers, splashes, mist and lightning.
  - `textures.js`: procedural textures.
- **`world/interiors.js`:** walk-in shops, rooftop, subway and elevated platforms, covered arcade, and the separate walkable levels they use.
- **`core/rhythm.js`, `core/moods.js`:** the daily rhythm of the city, and saved or shared moods.
- **`render/seasonFx.js`:** falling leaves and petals.
- **`world/`:**
  - `cityBase.js`: street grid, walk graph, lanes and signals.
  - `kit.js`: buildings and street furniture.
  - `pedestrians.js`: instanced, articulated people and dogs.
  - `traffic.js`: cars, taxis, buses and bikes that stop at red lights and for walkers.
  - `collision.js`, `skyline.js`.
- **`cities/`:** one module per city, loaded on demand and registered in `cities/index.js`.
- **`player/`:** controls, walker, scenic stroll, first-person umbrella, interactions and photo mode.
- **`audio/`:** Web Audio graph, synthesised ambience and the procedural lo-fi composer.
- **`ui/`:** HUD, settings drawer, minimap.

## Licensing and attribution
Everything is generated in the browser: geometry, textures, people, sound and music. No photos, map data, samples, copyrighted songs or paid services are used. The only third-party code is Three.js (MIT licence).

## Tests
`tests/` contains Playwright scripts that drive the running app:
- `functional.mjs`: UI, modes, photo mode and switching cities.
- `sim.mjs`: steps the simulation to check walking, collisions, the stroll, crossings, pedestrians and turning traffic.
- `places.mjs`: walks into the café, sits at the window, and uses every staircase.
- `moods.mjs`: saved moods, share links and adding your own music file.

Point them at a running dev server and set `PW` to a Playwright install.
