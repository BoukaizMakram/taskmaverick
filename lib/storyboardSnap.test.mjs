import test from 'node:test';
import assert from 'node:assert/strict';
import {snapBox, snapTargets} from './storyboardSnap.mjs';

const FRAME = {w: 1600, h: 900};

test('an asset near the middle of the frame snaps to it, with a guide the height of the frame', () => {
  const box = {x: 694, y: 300, w: 200, h: 100}; // its middle is at 794: 6 from the frame's 800
  const s = snapBox(box, snapTargets(FRAME), 8);
  assert.deepEqual([s.dx, s.dy], [6, 0]);
  assert.deepEqual(s.guides, [{axis: 'x', at: 800, from: 0, to: 900}]);
});

test('edges snap to another asset\'s edges; the nearest line wins; out of reach nothing moves', () => {
  const other = {x: 100, y: 100, w: 300, h: 50};
  const t = snapTargets(FRAME, [other]);
  const s = snapBox({x: 103, y: 400, w: 120, h: 40}, t, 8); // left edge 3 from the other's left edge
  assert.equal(s.dx, -3);
  assert.deepEqual(s.guides.find(g => g.axis === 'x'), {axis: 'x', at: 100, from: 100, to: 440}, 'the guide runs from one to the other');
  const far = snapBox({x: 520, y: 520, w: 50, h: 50}, t, 8);
  assert.deepEqual([far.dx, far.dy, far.guides.length], [0, 0, 0]);
});

test('an axis held by Shift is left alone', () => {
  const s = snapBox({x: 694, y: 397, w: 200, h: 100}, snapTargets(FRAME), 8, {x: false, y: true});
  assert.deepEqual([s.dx, s.dy], [0, 3]);
  assert.ok(s.guides.every(g => g.axis === 'y'));
});
