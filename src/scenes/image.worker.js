// Original teaching implementations of shape approximation and greedy string art.
// Does not contain code from fogleman/primitive or piellardj's GPL implementation.
import { random } from './shared-random';
let pixels, target, gray, currentGray, size, rand, kind, limit, count, paused, timer, peg, pegs, lines, exhausted;
function output() { self.postMessage({ lines:new Float32Array(lines), count, done: count >= limit || exhausted }); }
function primitiveStep() {
  let best = null;
  const a = .65;
  for (let attempt = 0; attempt < 35; attempt++) {
    const radius = 2 + rand() * Math.max(4, 38 * Math.exp(-count / 150));
    const x = rand() * size, y = rand() * size;
    const ids = [];
    const color = [0, 0, 0];
    for (let py = Math.max(0, Math.floor(y - radius)); py < Math.min(size, y + radius); py++) for (let px = Math.max(0, Math.floor(x - radius)); px < Math.min(size, x + radius); px++) {
      if ((px - x) ** 2 + (py - y) ** 2 > radius ** 2) continue;
      const i = (py * size + px) * 4;
      ids.push(i);
      for (let c = 0; c < 3; c++) color[c] += (target[i + c] - pixels[i + c] * (1 - a)) / a;
    }
    if (!ids.length) continue;
    for (let c = 0; c < 3; c++) color[c] = Math.max(0, Math.min(255, color[c] / ids.length));
    let improvement = 0;
    for (const i of ids) for (let c = 0; c < 3; c++) {
      const old = pixels[i + c], next = old * (1 - a) + color[c] * a;
      improvement += (old - target[i + c]) ** 2 - (next - target[i + c]) ** 2;
    }
    if (improvement > (best?.improvement || 0)) best = { ids, color, improvement };
  }
  if (best) for (const i of best.ids) for (let c = 0; c < 3; c++) pixels[i + c] = pixels[i + c] * (1 - a) + best.color[c] * a;
}
function linePixels(a, b) {
  const [x, y] = pegs[a], [x2, y2] = pegs[b];
  const n = Math.ceil(Math.max(Math.abs(x2 - x), Math.abs(y2 - y)));
  const points = [];
  let previous = -1;
  for (let i = 0; i <= n; i++) {
    const index = Math.round(y + (y2 - y) * i / n) * size + Math.round(x + (x2 - x) * i / n);
    if (index !== previous && index >= 0 && index < size * size) points.push(index);
    previous = index;
  }
  return points;
}
function threadStep() {
  let best = null;
  for (let candidate = 0; candidate < pegs.length; candidate++) {
    const diff = Math.abs(candidate - peg);
    if (diff < 9 || diff > pegs.length - 9) continue;
    const points = linePixels(peg, candidate);
    let gain = 0;
    for (const i of points) { const old = currentGray[i], next = Math.max(0, old - 20); gain += (old - gray[i]) ** 2 - (next - gray[i]) ** 2; }
    gain /= Math.max(1, points.length);
    if (!best || gain > best.gain) best = { points, gain, candidate };
  }
  if (!best || best.gain <= 0) { exhausted=true; return false; }
  lines.push(...pegs[peg],...pegs[best.candidate]);
  peg = best.candidate;
  for (const i of best.points) { currentGray[i] = Math.max(0, currentGray[i] - 20); pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = currentGray[i]; }
  return true;
}
function batch() {
  timer = undefined;
  if (paused || count >= limit || exhausted) return;
  for (let n = 0; n < 12 && count < limit; n++) { if (!threadStep()) break; count++; }
  output();
  timer = setTimeout(batch, 16);
}
self.onmessage = event => {
  const m = event.data;
  if (m.type === 'init') {
    clearTimeout(timer); target = m.pixels; size = m.size; kind = m.kind; limit = m.limit; paused = m.paused; count = 0; rand = random(m.seed); peg = 0; lines=[]; exhausted=false;
    pixels = new Uint8ClampedArray(size * size * 4);
    const mean = [0, 0, 0];
    for (let i = 0; i < target.length; i += 4) for (let c = 0; c < 3; c++) mean[c] += target[i + c] / (size * size);
    for (let i = 0; i < pixels.length; i += 4) { for (let c = 0; c < 3; c++) pixels[i + c] = kind === 'thread' ? 255 : mean[c]; pixels[i + 3] = 255; }
    gray = new Float32Array(size * size); currentGray = new Float32Array(size * size).fill(255);
    for (let i = 0; i < gray.length; i++) gray[i] = target[i * 4] * .299 + target[i * 4 + 1] * .587 + target[i * 4 + 2] * .114;
    pegs = Array.from({ length: 240 }, (_, i) => [size / 2 + Math.cos(i / 240 * Math.PI * 2) * (size / 2 - 2), size / 2 + Math.sin(i / 240 * Math.PI * 2) * (size / 2 - 2)]);
    // Reduced-motion/paused viewers still get a finished initial still.
    if (paused) { for (let n = 0; n < 70; n++) { if (!threadStep()) break; count++; } }
    output(); batch();
  } else if (m.type === 'paused') { paused = m.value; if (!paused && !timer) batch(); }
  else if (m.type === 'limit') { limit = m.value; if (!paused && !timer) batch(); }
};
