// Graphics presets. "Auto" picks a preset from the device and then nudges render resolution
// up or down to hold a smooth frame rate without overheating during long sessions.
export const QUALITY = {
  hd: { id: 'hd', label: 'High Definition', maxPR: 2, refl: 0.5, reflEvery: 1, reflTaps: 5, msaa: 4, bloomRes: 1, rainMul: 1, points: 8, peds: 150, cars: 46, aniso: 8, viewDist: 130, chunk: 70, pools: 40, detailDist: 120, reflDist: 140, parkedDist: 160, mist: 26 },
  balanced: { id: 'balanced', label: 'Balanced', maxPR: 1.25, refl: 0.33, reflEvery: 1, reflTaps: 3, msaa: 0, bloomRes: 0.5, rainMul: 0.6, points: 4, peds: 85, cars: 30, aniso: 4, viewDist: 105, chunk: 100, pools: 24, detailDist: 70, reflDist: 80, parkedDist: 90, mist: 12 },
  low: { id: 'low', label: 'Battery saver', maxPR: 1, refl: 0.25, reflEvery: 2, reflTaps: 3, msaa: 0, bloomRes: 0.5, rainMul: 0.4, points: 2, peds: 50, cars: 20, aniso: 2, viewDist: 90, chunk: 100, pools: 14, detailDist: 55, reflDist: 60, parkedDist: 70, mist: 7 },
};

export function isTouchDevice() {
  return (navigator.maxTouchPoints || 0) > 0 && matchMedia('(pointer: coarse)').matches;
}

export function detectQuality() {
  const touch = isTouchDevice();
  const small = Math.min(screen.width, screen.height) < 820;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  if (touch && small) return mem <= 3 ? 'low' : 'balanced';
  if (mem <= 4 || cores <= 4) return 'balanced';
  return 'hd';
}

export function resolveQuality(setting) {
  const id = setting === 'auto' ? detectQuality() : setting;
  const q = { ...(QUALITY[id] || QUALITY.balanced), auto: setting === 'auto' };
  // phones: refresh puddle reflections every other frame and thin the rain a little —
  // hard to see on a small screen, noticeably cooler and smoother
  if (isTouchDevice() && q.id !== 'hd') { q.reflEvery = 2; q.rainMul = Math.min(q.rainMul, 0.5); q.phone = true; }
  return q;
}
