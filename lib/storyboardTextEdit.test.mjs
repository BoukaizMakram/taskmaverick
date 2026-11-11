import test from 'node:test';
import assert from 'node:assert/strict';
import {MIN_BOX, draggedRect, typedRect} from './storyboardTextEdit.mjs';

const box = {rect: [100, 200, 400, 80], auto: false};

test('a box is carried by its edges, whole, and a box as tall as its words stays so', () => {
  assert.deepEqual(draggedRect({...box, mode: 'move'}, 30, -20), [130, 180, 400, 80]);
  assert.deepEqual(draggedRect({rect: [100, 200, 400, 46], auto: true, mode: 'move'}, 5, 5), [105, 205, 400, 0], 'auto height is kept as auto');
});

test('a side handle pulls only its side: the other side stays where it was', () => {
  assert.deepEqual(draggedRect({...box, mode: 'e'}, 120, 50), [100, 200, 520, 80], 'east: wider to the right, the height is not touched by a side handle');
  assert.deepEqual(draggedRect({...box, mode: 'w'}, 120, 0), [220, 200, 280, 80], 'west: the right edge (500) stays');
  assert.deepEqual(draggedRect({...box, mode: 's'}, 0, 40), [100, 200, 400, 120]);
  assert.deepEqual(draggedRect({...box, mode: 'n'}, 0, -40), [100, 160, 400, 120], 'north: the bottom edge (280) stays');
});

test('a corner pulls both its sides', () => {
  assert.deepEqual(draggedRect({...box, mode: 'se'}, 20, 10), [100, 200, 420, 90]);
  assert.deepEqual(draggedRect({...box, mode: 'nw'}, -20, -10), [80, 190, 420, 90], 'the bottom right corner (500, 280) stays');
});

test('a box cannot be dragged smaller than a box', () => {
  assert.deepEqual(draggedRect({...box, mode: 'e'}, -900, 0), [100, 200, MIN_BOX.w, 80]);
  assert.deepEqual(draggedRect({...box, mode: 'w'}, 900, 0), [460, 200, MIN_BOX.w, 80], 'the right edge still at 500');
  assert.deepEqual(draggedRect({...box, mode: 's'}, 0, -900), [100, 200, 400, MIN_BOX.h]);
});

test('pulling the side of a box that is as tall as its words gives it a height; pulling the top or bottom does', () => {
  assert.deepEqual(draggedRect({rect: [100, 200, 400, 46], auto: true, mode: 'e'}, 10, 0), [100, 200, 410, 0], 'a side: still as tall as its words');
  assert.deepEqual(draggedRect({rect: [100, 200, 400, 46], auto: true, mode: 's'}, 0, 30), [100, 200, 400, 76], 'the bottom: a height of its own');
});

test('a number typed in the toolbar changes one number of the box; an empty height is as tall as its words', () => {
  assert.deepEqual(typedRect([100, 200, 400, 80], false, 0, 150), [150, 200, 400, 80]);
  assert.deepEqual(typedRect([100, 200, 400, 46], true, 2, 500), [100, 200, 500, 0], 'the height stays auto');
  assert.deepEqual(typedRect([100, 200, 400, 80], false, 3, null), [100, 200, 400, 0], 'a cleared height: auto');
  assert.deepEqual(typedRect([100, 200, 400, 80], false, 1, null), [100, 200, 400, 80], 'a cleared x: as it was');
});
