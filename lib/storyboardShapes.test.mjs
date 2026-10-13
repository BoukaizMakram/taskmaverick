import test from 'node:test';
import assert from 'node:assert/strict';
import {RECT_FILL, RECT_MIN, RECT_SIZE, inStage, rectBox, rectFrom, rectInsert} from './storyboardShapes.mjs';
import {normalizePaint} from './storyboardPaint.mjs';

test('a box between two points, in any direction', () => {
  assert.deepEqual(rectBox({x: 100, y: 100}, {x: 300, y: 250}), {x: 100, y: 100, w: 200, h: 150});
  assert.deepEqual(rectBox({x: 300, y: 250}, {x: 100, y: 100}), {x: 100, y: 100, w: 200, h: 150}, 'dragged up and to the left');
  assert.deepEqual(rectBox({x: 100, y: 300}, {x: 250, y: 100}), {x: 100, y: 100, w: 150, h: 200});
});

test('Shift makes a square from the first point, the longer side', () => {
  assert.deepEqual(rectBox({x: 100, y: 100}, {x: 300, y: 150}, {square: true}), {x: 100, y: 100, w: 200, h: 200});
  assert.deepEqual(rectBox({x: 300, y: 300}, {x: 250, y: 100}, {square: true}), {x: 100, y: 100, w: 200, h: 200}, 'up and to the left: grown that way');
});

test('a click makes a default box centered on the point; a short drag is a click', () => {
  const click = rectFrom({x: 800, y: 450}, {x: 800, y: 450});
  assert.deepEqual(click, {x: 800 - RECT_SIZE.w / 2, y: 450 - RECT_SIZE.h / 2, w: RECT_SIZE.w, h: RECT_SIZE.h});
  assert.deepEqual(rectFrom({x: 800, y: 450}, {x: 802, y: 451}), click);
  assert.deepEqual(rectFrom({x: 10, y: 10}, {x: 410, y: 12}), {x: 10, y: 10, w: 400, h: RECT_MIN}, 'a thin line is kept thin, not made default');
});

test('drawing one gives an asset with its own key, a plain gray, and room in the stack', () => {
  const made = rectInsert({box: {x: 10, y: 20, w: 300, h: 100}, taken: new Set(['r1-rectangle']), count: 3});
  assert.equal(made.key, 'r2-rectangle');
  assert.deepEqual(made.inserts[0], {key: 'r2-rectangle', name: 'Rectangle', kind: 'dom', asset: made.inserts[0].asset, z: 26, box: {x: 10, y: 20, w: 300, h: 100}});
  const html = made.library[made.inserts[0].asset];
  assert.match(html, /^<div data-sb-root="r2-rectangle" data-sb-box="rect" style="position:absolute;left:10px;top:20px;width:300px;height:100px;z-index:26;/);
  assert.match(html, /background:#cfd6dd/);
  const same = rectInsert({box: {x: 10, y: 20, w: 300, h: 100}, taken: new Set(), count: 3});
  assert.notEqual(same.inserts[0].asset, made.inserts[0].asset, 'another key, another asset');
});

test('the first fill is a good gradient, and points stay inside the frame', () => {
  assert.ok(normalizePaint(RECT_FILL) && typeof normalizePaint(RECT_FILL) === 'object');
  assert.deepEqual(inStage({x: -20, y: 2000}), {x: 0, y: 900});
  assert.deepEqual(inStage({x: 400, y: 300}), {x: 400, y: 300});
});
