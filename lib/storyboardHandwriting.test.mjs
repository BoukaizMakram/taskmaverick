import test from 'node:test';
import assert from 'node:assert/strict';
import {thin, writePath, timeline, writeBetween, penWidth} from './storyboardHandwriting.mjs';

// a bitmap with boxes of ink: [x0, y0, x1, y1] (inclusive)
const bitmap = (w, h, boxes) => {
  const bits = new Uint8Array(w * h);
  for (const [x0, y0, x1, y1] of boxes) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) bits[y * w + x] = 1;
  return bits;
};
const count = bits => bits.reduce((n, v) => n + v, 0);
// skeleton pixels farther than 1.5 px from every point of the strokes
const unwritten = (skel, w, strokes) => { const pts = strokes.flat(); let missing = 0; for (let i = 0; i < skel.length; i++) if (skel[i] && !pts.some(([x, y]) => Math.hypot(x - i % w, y - ((i / w) | 0)) <= 1.5)) missing++; return missing; };

test('thinning leaves the center line of a thick stroke, one pixel wide, in its place', () => {
  const w = 60, h = 30, bits = bitmap(w, h, [[5, 12, 54, 18]]); // a bar 7 thick
  const skel = thin(bits, w, h);
  assert.ok(count(skel) > 40 && count(skel) < 70, `${count(skel)} pixels left of ${count(bits)}`);
  for (let x = 12; x < 48; x++) { let n = 0, sum = 0; for (let y = 0; y < h; y++) if (skel[y * w + x]) { n++; sum += y; } assert.equal(n, 1, `one pixel in column ${x}`); assert.ok(Math.abs(sum - 15) <= 1, 'on the middle'); }
});

test('a word is written left to right, a stroke at a time, each stroke followed end to end', () => {
  const w = 120, h = 40, bits = bitmap(w, h, [[10, 8, 13, 30], [10, 28, 40, 31], [60, 8, 63, 30], [80, 8, 83, 30]]); // an L, then two bars
  const strokes = writePath(thin(bits, w, h), w, h);
  assert.ok(strokes.length >= 3 && strokes.length <= 6, `${strokes.length} strokes`);
  const starts = strokes.map(s => s[0][0]);
  assert.deepEqual([...starts].sort((a, b) => a - b).slice(0, 1), [Math.min(...starts)], 'the first stroke is the leftmost');
  assert.ok(Math.min(...starts) <= 14, 'it begins at the left');
  assert.ok(strokes[0].length > 20, 'the L is walked as a whole (its bar and its foot)');
  assert.equal(unwritten(thin(bits, w, h), w, strokes), 0, 'every pixel of the skeleton is written (within the pen\'s reach)');
});

test('a ring is written as one stroke, all the way round', () => {
  const w = 60, h = 60, bits = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - 30, y - 30); if (d > 15 && d < 21) bits[y * w + x] = 1; }
  const skel = thin(bits, w, h), strokes = writePath(skel, w, h);
  assert.equal(strokes.length, 1);
  assert.equal(unwritten(skel, w, strokes), 0, 'all the way round');
});

test('lines are written in turn, top to bottom, each left to right', () => {
  const w = 100, h = 80, bits = bitmap(w, h, [[60, 10, 90, 13], [10, 50, 40, 53], [10, 10, 30, 13]]);
  const strokes = writePath(thin(bits, w, h), w, h, {bands: [[0, 30], [40, 70]]});
  const firsts = strokes.map(s => [s[0][0], s[0][1]]);
  assert.ok(firsts[0][1] < 30 && firsts[1][1] < 30, 'the upper line first');
  assert.ok(firsts[0][0] < firsts[1][0], 'its left stroke before its right one');
  assert.ok(firsts[2][1] > 40, 'then the lower line');
});

test('the timeline gives each stroke its length, a lift a little more, a new line a pause; writing it between two moments draws the pieces', () => {
  const strokes = [[[0, 0], [10, 0], [20, 0]], [[30, 0], [40, 0]], [[0, 50], [10, 50]]];
  const line = timeline(strokes, {bands: [[-1, 20], [40, 60]]});
  assert.equal(line.steps.filter(s => s.draw).length, 4);
  const drawn = line.steps.filter(s => s.draw).reduce((n, s) => n + s.units, 0);
  assert.equal(drawn, 40);
  assert.ok(line.total > drawn + 36, 'lifts and the new line take time');
  const first = writeBetween(line, 0, 15);
  assert.equal(first.segments.length, 2);
  assert.deepEqual(first.segments[1], [10, 0, 15, 0], 'the second piece is drawn half way');
  const second = writeBetween(line, 15, line.total);
  assert.equal(second.segments.length, 3, 'the rest of it');
  assert.deepEqual(second.pen, [10, 50]);
  const whole = writeBetween(line, 0, line.total).segments.reduce((n, [x0, y0, x1, y1]) => n + Math.hypot(x1 - x0, y1 - y0), 0);
  assert.ok(Math.abs(whole - 40) < 1e-9, 'in two parts or one, the same line');
  assert.deepEqual(writeBetween(line, line.total, line.total + 5).segments, []);
});

test('the pen is as thick as the strokes, a little more', () => {
  assert.equal(penWidth(700, 100), 7 * 1.9 + 2);
  assert.equal(penWidth(10, 100), 4, 'never thinner than 4');
});

test('a letter is finished before the next one: a stem is written downwards, then its serif, then the letter after it', () => {
  const w = 120, h = 60;
  // an "I" with a bar under it (its foot ends to the right of where the stem is, as in a slanted hand), then a bar for the next letter
  const bits = bitmap(w, h, [[20, 10, 23, 44], [14, 44, 40, 47], [60, 28, 63, 47]]);
  const strokes = writePath(thin(bits, w, h), w, h);
  const next = strokes.findIndex(s => s.some(([x]) => x > 55));
  assert.ok(next >= 0 && strokes.slice(0, next).flat().some(([x, y]) => x < 30 && y < 14), 'the top of the stem is written before the next letter');
  assert.ok(strokes.slice(0, next).flat().some(([x, y]) => x < 18 && y > 43), 'and its foot too');
  assert.ok(strokes[0][0][1] < 20, 'the stem is begun at its top');
});

test('the dot of an i is put after the letter, the bar of a t after its stem', () => {
  const w = 160, h = 80;
  // a stem, a dot over a second stem, a third stem: the dot comes after the second stem, not before it and not at the very end
  const bits = bitmap(w, h, [[10, 30, 13, 60], [50, 30, 53, 60], [49, 12, 54, 17], [100, 30, 103, 60]]);
  const strokes = writePath(thin(bits, w, h), w, h);
  const at = pred => strokes.findIndex(s => s.some(([x, y]) => pred(x, y)));
  const stem = at((x, y) => x > 45 && x < 58 && y > 30), dot = at((x, y) => x > 45 && x < 58 && y < 20), third = at(x => x > 95);
  assert.ok(stem >= 0 && dot > stem, 'the dot after its stem');
  assert.ok(third > dot, 'and before the next letter');
});
