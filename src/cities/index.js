// City registry. Each city lives in its own module and is loaded on demand, so cities can be
// added or reworked independently without touching the rest of the app.
export const CITIES = [
  { id: 'nyc', name: 'New York City', neighborhood: 'West Village', blurb: 'Brownstones, cafés and leafy one-way streets beneath a distant skyline.', palette: { fog: '#1d2233', accent: '#ffb86b' }, load: () => import('./nyc.js').then((m) => m.nyc) },
  { id: 'chicago', name: 'Chicago', neighborhood: 'Riverfront Loop', blurb: 'Towers along a river, steel bridges and an elevated train overhead.', palette: { fog: '#1a2230', accent: '#7fd0ff' }, load: () => import('./chicago.js').then((m) => m.chicago) },
  { id: 'la', name: 'Los Angeles', neighborhood: 'Arts District', blurb: 'Wide streets, murals on old warehouses, palms and hills in the haze.', palette: { fog: '#2a2230', accent: '#ff9f6b' }, load: () => import('./la.js').then((m) => m.la) },
  { id: 'miami', name: 'Miami', neighborhood: 'Ocean Drive', blurb: 'Pastel Art Deco hotels, palms, neon and the sound of the sea.', palette: { fog: '#1c2a38', accent: '#ff6fd8' }, load: () => import('./miami.js').then((m) => m.miami) },
  { id: 'kyoto', name: 'Kyoto', neighborhood: 'Canal Lanes', blurb: 'A stylised canal quarter of wooden houses, lanterns, willows and bridges.', palette: { fog: '#1e2420', accent: '#ffcf7a' }, load: () => import('./kyoto.js').then((m) => m.kyoto) },
];
export const cityMeta = (id) => CITIES.find((c) => c.id === id) || CITIES[0];
