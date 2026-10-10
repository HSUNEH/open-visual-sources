// One wheel/trackpad gesture advances one page, regardless of whether it starts
// over the gallery, its chrome or an embedded exhibit. Native touch stays native.
export function createWheelGesture() {
  return { last: -Infinity, movedAt: -Infinity, x: 0, y: 0, fired: false };
}

export function wheelIntent(state, { x = 0, y = 0, mode = 0, shift = false }, now, width, height) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (now-state.last > 180) { state.x = state.y = 0; state.fired = false; }
  state.last = now;
  // Keep consuming inertial tail events even after the destination has changed.
  if (state.fired || now-state.movedAt < 650) return null;
  if (shift && !x) { x = y; y = 0; }
  state.x += x * (mode === 1 ? 16 : mode === 2 ? width : 1);
  state.y += y * (mode === 1 ? 16 : mode === 2 ? height : 1);
  if (Math.max(Math.abs(state.x), Math.abs(state.y)) < 40) return null;
  state.fired = true; state.movedAt = now;
  return Math.abs(state.x) > Math.abs(state.y)
    ? { axis: 'theme', direction: Math.sign(state.x) }
    : { axis: 'work', direction: Math.sign(state.y) };
}
