import test from 'node:test';
import assert from 'node:assert/strict';
import {clickTarget, targetSelector} from './demoTargets.mjs';

const STOPS = {
  rate: [{target: 'rate-0'}, {target: 'rate-knob', hold: 2}, {target: 'rate-submit'}],
  capture: [{target: 'proof-block', kind: 'point'}],
  web: [{target: 'gallery-view'}],
};
const slide = (chapter, label) => ({chapter, label});

test('the click a slide names: its stop, by the number in its name', () => {
  assert.equal(clickTarget(STOPS, slide('rate', 'Words'), slide('rate', 'Click Rate knob (2 of 3)')).name, 'rate-knob');
  assert.equal(clickTarget(STOPS, slide('rate', 'After the click (1 of 3)'), slide('rate', 'After the click (3 of 3) (copy)')).name, 'rate-submit');
  assert.equal(clickTarget(STOPS, slide('web', 'Words'), slide('web', 'After the click')).name, 'gallery-view', 'one stop: no number');
});

test('the slide where the cursor rests names the click first; a stop that only points is no click', () => {
  assert.equal(clickTarget(STOPS, slide('rate', 'Hand on Rate 0 (1 of 3)'), slide('rate', 'Click Rate submit (3 of 3)')).name, 'rate-0');
  assert.equal(clickTarget(STOPS, slide('capture', 'Words'), slide('capture', 'After the click')), null);
  assert.equal(clickTarget(STOPS, slide('rate', 'Words'), slide('rate', 'Moving')), null);
  assert.equal(clickTarget(STOPS, slide('rate', 'Words'), slide('rate', 'Click Rate knob (2 of 3)')).stop.hold, 2, 'the stop comes with it (a held one drags)');
});

test('a target is the demo\'s selector, else its data-iq-target; the steps\' spot is the n-th Yes', () => {
  assert.equal(targetSelector('improved-quality-v2', 'rate-knob'), '.iq2-iso-stack .iq-rate-knob');
  assert.equal(targetSelector('improved-quality-v2', 'add-video'), '[data-iq-target="add-video"]');
  assert.equal(targetSelector('increased-efficiency-v2', 'card-sig'), '.ev2-cards [data-card="sig"] .chip');
  assert.equal(targetSelector('improved-quality-v2', 'step-spot', 2), '[data-iq-target="yes-1"]');
});
