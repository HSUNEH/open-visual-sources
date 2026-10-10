// Lifecycle adapter for ondras/primitive.js, MIT. The vendor files are unmodified.
// Candidate selection is scheduled in small batches; colors, rasterization,
// mutations and distance calculations come from the actual upstream port.
import { assetUrl } from '../asset-url';
export function primitiveAdapter() {
  let alive = true, paused = false, limit = 320, count = 0, timer, state, cfg, api, started = false, running = false;
  const shapesSVG = [];
  const bridge = {
    onmessage: null, onerror: null,
    postMessage(message) {
      if (message.type === 'paused') paused = message.value;
      if (message.type === 'limit') limit = message.value;
      if (message.type === 'init') initialize(message).catch(error => bridge.onerror?.(error));
      else if (started && !timer && !running) schedule();
    },
    terminate() { alive = false; clearTimeout(timer); },
  };
  async function initialize(message) {
    const paths = ['canvas', 'shape', 'state', 'step'];
    // Absolute same-origin URLs avoid Vite appending ?import to public files.
    const modules = await Promise.all(paths.map(name => { const path = new URL(assetUrl(`vendor/primitive/${name}.js`), window.location.origin).href; return import(/* @vite-ignore */ path); }));
    if (!alive) return;
    const [canvasModule, shapes, stateModule, stepModule] = modules;
    api = { Canvas: canvasModule.default, ...shapes, State: stateModule.default, Step: stepModule.default };
    limit = message.limit; paused = message.paused;
    cfg = { width: message.size, height: message.size, alpha: .65, mutateAlpha: true, fill: '#b7a397', shapeTypes: [api.Triangle] };
    const target = new api.Canvas(message.size, message.size);
    target.ctx.putImageData(new ImageData(message.pixels, message.size, message.size), 0, 0);
    state = new api.State(target, api.Canvas.empty(cfg)); started = true;
    schedule();
  }
  function schedule() {
    if (!alive || count >= limit || (paused && count >= 30)) return;
    timer = setTimeout(() => { timer = null; batch().catch(error => bridge.onerror?.(error)); }, 0);
  }
  async function batch() {
    if (!alive) return;
    running = true;
    const deadline = performance.now() + 12;
    do {
    let best;
    for (let i = 0; i < 12; i++) {
      const step = await new api.Step(api.Shape.create(cfg), cfg).compute(state);
      if (!best || step.distance < best.distance) best = step;
    }
    for (let i = 0; i < 18; i++) { const candidate = await best.mutate().compute(state); if (candidate.distance < best.distance) best = candidate; }
    if (!alive) return;
    if (best.distance < state.distance) { state = best.apply(state); shapesSVG.push(new XMLSerializer().serializeToString(best.toSVG())); }
    count++;
    } while (alive && count < limit && (!paused || count < 30) && performance.now() < deadline);
    running = false;
    if (!alive) return;
    bridge.onmessage?.({ data: { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cfg.width} ${cfg.height}"><rect width="100%" height="100%" fill="${cfg.fill}"/>${shapesSVG.join('')}</svg>`, count, done: count >= limit } });
    schedule();
  }
  return bridge;
}
