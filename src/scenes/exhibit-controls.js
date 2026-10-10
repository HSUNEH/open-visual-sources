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

export function perturbLenia(field, random = Math.random) {
  // A shear changes actual neighbour relationships, without adding random
  // cells or deleting mass. The solver, not an animation, then evolves it.
  let mass = 0, moment = 0, variance = 0;
  for (let y = 0; y < field.length; y++)
    for (const value of field[y]) { mass += value; moment += value * y; }
  if (mass < .01) return false;
  const center = moment / mass;
  for (let y = 0; y < field.length; y++)
    for (const value of field[y]) variance += value * (y-center)**2;
  const radius = Math.max(3, Math.sqrt(variance / mass));
  const direction = random() < .5 ? -1 : 1;
  const amplitude = Math.max(2, field.length * .016);
  for (let y = 0; y < field.length; y++) {
    const t = (y-center) / radius;
    const shift = Math.round(direction * amplitude * t * Math.exp((1-t*t)/2));
    const row = field[y].slice(), width = row.length;
    for (let x = 0; x < width; x++) {
      field[y][x] = row[((x-shift)%width+width)%width];
    }
  }
  return true;
}
