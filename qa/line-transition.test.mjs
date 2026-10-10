import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceLineTransition, fragmentLineArtwork } from '../src/scenes/line-transition.js';

test('ln has a 3-second cycle with .5-second scatter/gather and freezes at delta zero',()=>{
  const state={phase:'hold',elapsed:0};
  advanceLineTransition(state,2.5,true); assert.equal(state.phase,'out');
  const moving=advanceLineTransition(state,.1,true); assert.ok(moving.amount>0);
  const frozen={...state}; advanceLineTransition(state,0,true); assert.deepEqual(state,frozen);
  assert.equal(advanceLineTransition(state,.1,true).swap,true);
  assert.equal(state.phase,'in');
  advanceLineTransition(state,.3,true); assert.equal(state.phase,'hold');
});
test('ln waits for a prepared scene and reduced motion skips scattering',()=>{
  const state={phase:'hold',elapsed:0};
  assert.equal(advanceLineTransition(state,3,false).amount,0);
  const reduced=advanceLineTransition({phase:'hold',elapsed:0},3,true,true);
  assert.deepEqual(reduced,{swap:true,amount:0});
});
test('ln fragments preserve all vector strokes in a bounded number of groups',()=>{
  const lines=Array.from({length:100},(_,i)=>`<polyline stroke="currentColor" fill="none" points="${i*9},100 ${i*9+5},110" />`).join('');
  const result=fragmentLineArtwork(`<svg><g>${lines}</g></svg>`);
  assert.equal([...result.markup.matchAll(/<polyline/g)].length,100);
  assert.ok(result.fragments.length>1&&result.fragments.length<=32);
});
