import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('responsive controls preserve the desktop wrapper and wait for a mobile portal host', async () => {
  const source = await readFile('src/scenes/Controls.jsx', 'utf8');
  const { code } = await transform(source, { loader:'jsx', format:'esm' });
  // Resolve dependencies from the project, not the generated data URL.
  const moduleCode = code.replaceAll('"react"', JSON.stringify(import.meta.resolve('react'))).replaceAll('"react-dom"', JSON.stringify(import.meta.resolve('react-dom')));
  const { Controls, ControlsContext } = await import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`);
  const group = React.createElement(Controls, {className:'work-controls'}, React.createElement('button', null, 'demo'));
  assert.equal(renderToStaticMarkup(group), '<div class="work-controls"><button>demo</button></div>');
  assert.equal(renderToStaticMarkup(React.createElement(ControlsContext.Provider, {value:{mobile:true,host:null}}, group)), '');
});

test('every live scene routes secondary settings through shared responsive controls', async () => {
  for (const name of ['Drawing','Spatial','Interactive','Kinetic','Delaunay','Originals','Volume','Sand','FieldPlay','WaveFunction','Brush','PathTrace','NeuralCA','Lightweight']) {
    const source = await readFile(`src/scenes/${name}.jsx`, 'utf8');
    assert.match(source, /<Controls className=/, name);
    assert.doesNotMatch(source, /<div className="work-controls"/, name);
  }
  const app = await readFile('src/main.jsx','utf8');
  assert.match(app, /hidden=\{!mobile \|\| !controlsOpen \|\| immersive\}/);
  assert.match(app, /mobile-control-sheet, input/);
});
