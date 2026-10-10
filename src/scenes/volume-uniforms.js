// R3F copies the supplied uniform wrappers into ShaderMaterial.uniforms.
// Only the material-owned values reach the GPU after the initial render.
export function updateVolumeUniforms(material, { density, cut, seed, aspect }, delta = 0) {
  if (!material) return;
  const uniforms = material.uniforms;
  uniforms.threshold.value = .3 + density * .004;
  uniforms.cut.value = -1 + cut * .02;
  uniforms.seed.value = (seed % 997) / 71;
  uniforms.aspect.value = aspect;
  uniforms.clock.value += Math.min(Math.max(delta, 0), .05);
}
