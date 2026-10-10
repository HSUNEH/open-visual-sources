import test from 'node:test';
import assert from 'node:assert/strict';
import { ShaderMaterial } from 'three';
import { applyProps } from '@react-three/fiber';
import { updateVolumeUniforms } from '../src/scenes/volume-uniforms.js';

function setup() {
  const initial = Object.fromEntries(['clock', 'threshold', 'cut', 'seed', 'aspect'].map(key => [key, { value: 0 }]));
  const material = new ShaderMaterial();
  applyProps(material, { uniforms: initial });
  return { initial, material };
}

test('volume controls update the real material uniforms copied by R3F', () => {
  const { initial, material } = setup();
  assert.notEqual(material.uniforms.cut, initial.cut);
  updateVolumeUniforms(material, { density: 80, cut: 5, seed: 1234, aspect: 2 });
  assert.equal(material.uniforms.threshold.value, .62);
  assert.equal(material.uniforms.cut.value, -.9);
  assert.equal(material.uniforms.seed.value, (1234 % 997) / 71);
  assert.equal(material.uniforms.aspect.value, 2);
  assert.equal(initial.cut.value, 0);
  material.dispose();
});

test('volume clock advances during playback but parameter edits preserve paused time', () => {
  const { material } = setup();
  const values = { density: 48, cut: 65, seed: 1, aspect: 1 };
  updateVolumeUniforms(material, values, 1);
  assert.equal(material.uniforms.clock.value, .05);
  updateVolumeUniforms(material, { ...values, cut: 100 });
  assert.equal(material.uniforms.clock.value, .05);
  assert.equal(material.uniforms.cut.value, 1);
  updateVolumeUniforms(material, values, .01);
  assert.equal(material.uniforms.clock.value, .05 + .01);
  material.dispose();
});
