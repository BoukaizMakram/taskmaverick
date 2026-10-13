import test from 'node:test';
import assert from 'node:assert/strict';
import {contentFactor, scaledBox, scaledStyles} from './storyboardScale.mjs';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);
const box = {left: 100, top: 100, right: 400, bottom: 300}; // 300 x 200

test('without padding a handle scales by the box: the opposite corner stays put', () => {
  close(contentFactor('se', box, {x: 1000, y: 700}), 3); // 900 x 600
  close(contentFactor('nw', box, {x: -500, y: -300}), 3); // dragged up and to the left: the right-bottom corner stays
  close(contentFactor('se', box, {x: 250, y: 200}), 0.5);
});

test('a corner follows the larger of its two sides; a side only its own', () => {
  close(contentFactor('se', box, {x: 1000, y: 300}), 3); // x says 3, y says 1
  close(contentFactor('se', box, {x: 400, y: 700}), 3); // y says 3, x says 1
  close(contentFactor('e', box, {x: 1000, y: 9999}), 3); // the middle of a side ignores the other axis
  close(contentFactor('s', box, {x: -9999, y: 700}), 3);
});

test('the padding does not scale: the words\' area does, and the corner stays under the pointer', () => {
  const pad = [30, 20]; // inner 240 x 160
  const f = contentFactor('se', box, {x: 100 + 2 * 240 + 60, y: 100 + 2 * 160 + 40}, {pad});
  close(f, 2); // 2 x the words' area + the same padding
  const [w, h] = scaledBox([300, 200], pad, f);
  close(100 + w, 100 + 2 * 240 + 60);
  close(100 + h, 100 + 2 * 160 + 40);
});

test('it never goes below the minimum, and a box with no room inside its padding scales by the box', () => {
  assert.equal(contentFactor('se', box, {x: 100, y: 100}), 0.05);
  assert.equal(contentFactor('se', box, {x: 100, y: 100}, {min: 0.2}), 0.2);
  close(contentFactor('se', box, {x: 1000, y: 700}, {pad: [150, 100]}), 3);
});

test('what scaling does to the numbers: the font, and what was given a size of its own', () => {
  assert.deepEqual(scaledStyles({}, 30, 1.5), {size: 45});
  assert.deepEqual(scaledStyles({lineHeight: 40, letterSpacing: 2, strokeWidth: 4, radius: 10, opacity: 0.5, color: '#fff'}, 30, 2), {size: 60, lineHeight: 80, letterSpacing: 4, strokeWidth: 8, radius: 20});
  assert.deepEqual(scaledStyles({radius: 12, strokeWidth: 3}, null, 0.5), {strokeWidth: 1.5, radius: 6}, 'a box with no text has no font to scale');
  assert.deepEqual(scaledStyles({letterSpacing: 0}, 20, 3), {size: 60, letterSpacing: 0});
});
