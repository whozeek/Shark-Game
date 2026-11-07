// The city's daily rhythm: how busy the streets are and how many households still have lights on.
function curve(points, h) {
  h = ((h % 24) + 24) % 24;
  for (let i = 0; i < points.length - 1; i++) {
    const [h0, v0] = points[i], [h1, v1] = points[i + 1];
    if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0); const s = t * t * (3 - 2 * t); return v0 + (v1 - v0) * s; }
  }
  return points[0][1];
}
const PEOPLE = [[0, 0.4], [2, 0.18], [4.5, 0.12], [6.5, 0.45], [8.5, 1.15], [10, 0.85], [12.5, 1.0], [15, 0.85], [17.8, 1.2], [20, 0.95], [22.5, 0.65], [24, 0.4]];
const TRAFFIC = [[0, 0.45], [2.5, 0.2], [4.5, 0.18], [6.5, 0.6], [8.3, 1.2], [10, 0.85], [13, 0.9], [17.5, 1.25], [19.5, 0.9], [22, 0.65], [24, 0.45]];
const WINDOWS = [[0, 0.7], [1.5, 0.45], [3, 0.28], [5, 0.25], [6.5, 0.6], [8, 0.55], [16.5, 0.55], [18, 0.95], [22.5, 1.0], [24, 0.7]];
export const peopleRhythm = (h) => curve(PEOPLE, h);
export const trafficRhythm = (h) => curve(TRAFFIC, h);
export const windowRhythm = (h) => curve(WINDOWS, h);
export const isDawnDelivery = (h) => h >= 4.8 && h <= 8.5;
