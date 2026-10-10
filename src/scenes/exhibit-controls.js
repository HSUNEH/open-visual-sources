// These small adapters are serialized into the unmodified upstream frames.
export function applyVowel(tract, ui, index) {
  const vowels = [[12.9, 2.43, 1.5], [25, 2.2, 1.5], [18, 2.15, .55]];
  const [position, diameter, lips] = vowels[index] || vowels[0];
  ui.tongueTouch = 0;
  ui.tongueIndex = position;
  ui.tongueDiameter = diameter;
  ui.setRestDiameter();
  for (let i = tract.lipStart; i < tract.n; i++) tract.restDiameter[i] = lips;
  // restDiameter drives the drawing; targetDiameter drives the actual audio.
  tract.targetDiameter.set(tract.restDiameter);
  tract.velumTarget = .01;
}

export function gentlyPerturb(field, random = Math.random) {
  const active = [];
  for (let y = 0; y < field.length; y++)
    for (let x = 0; x < field[y].length; x++)
      if (field[y][x] > .15) active.push([x, y]);
  if (!active.length) return false;
  const [cx, cy] = active[Math.floor(random() * active.length)];
  const radius = Math.max(3, field.length / 16);
  for (let y = 0; y < field.length; y++)
    for (let x = 0; x < field[y].length; x++) {
      const v = field[y][x];
      const weight = Math.exp(-((x-cx)**2 + (y-cy)**2) / (2*radius**2));
      field[y][x] = v + .08 * weight * v * (1-v);
    }
  return true;
}
