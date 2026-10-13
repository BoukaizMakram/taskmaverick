import test from 'node:test';
import assert from 'node:assert/strict';
import {MESSAGE, POP_TIME, bubbleFrame, bubbleMetrics, bubbleRoom, popPose} from './captionBubbles.mjs';
import {clipParams} from './clipParams.mjs';

const rect = {x: 900, y: 300, w: 300, h: 90};
const center = {x: rect.x + rect.w / 2, y: rect.y + rect.h / 2};
// A point to the left, right, above and below, well outside the bubble.
const TIPS = {left: {x: 560, y: 380}, right: {x: 1560, y: 330}, above: {x: 1000, y: 40}, below: {x: 1100, y: 640}};
const frame = input => bubbleFrame(MESSAGE, {rect, t: 2, remaining: 9, ...input});
const length = f => Math.hypot(f.tail.tip.x - f.tail.base.x, f.tail.tip.y - f.tail.base.y);

test('the one caption style is the yellow message: #ffec00 with a black outline', () => {
  assert.equal(MESSAGE.id, 'yellow');
  assert.equal(MESSAGE.fill, '#ffec00');
  assert.equal(MESSAGE.stroke, '#111111');
  const f = frame({tip: TIPS.left});
  assert.match(f.svg, /fill="#ffec00"/);
  assert.match(f.svg, /stroke="#111111"/);
  assert.doesNotMatch(f.svg, /NaN|undefined|Infinity/);
});

test('the tail reaches the point, from the side the point is on', () => {
  for (const [side, tip] of Object.entries(TIPS)) {
    const f = frame({tip});
    assert.ok(f.tail, `${side}: no tail`);
    assert.equal(f.tail.tip.x, tip.x, side);
    assert.equal(f.tail.tip.y, tip.y, side);
    const o = f.outer, slack = 3;
    assert.ok(f.tail.base.x >= o.x - slack && f.tail.base.x <= o.x + o.w + slack, `${side} base x`);
    assert.ok(f.tail.base.y >= o.y - slack && f.tail.base.y <= o.y + o.h + slack, `${side} base y`);
    if (side === 'left') assert.ok(f.tail.base.x < center.x);
    if (side === 'right') assert.ok(f.tail.base.x > center.x);
    if (side === 'above') assert.ok(f.tail.base.y < center.y);
    if (side === 'below') assert.ok(f.tail.base.y > center.y);
  }
});

test('the bubble holds the words, with room for them and its outline', () => {
  const f = frame({tip: TIPS.left}), o = f.outer;
  assert.ok(o.x <= rect.x && o.y <= rect.y && o.x + o.w >= rect.x + rect.w && o.y + o.h >= rect.y + rect.h);
  const m = bubbleMetrics(MESSAGE, rect.w, rect.h);
  assert.ok(m.left >= MESSAGE.pad[0] - 0.01 && m.right >= MESSAGE.pad[0] - 0.01 && m.top >= MESSAGE.pad[1] - 0.01 && m.bottom >= MESSAGE.pad[1] - 0.01);
  assert.ok(bubbleRoom(MESSAGE) > 100 && bubbleRoom(MESSAGE) < 250, 'the art gives way by a sensible amount');
});

test('no tail when the words point at nothing, or at something under the bubble', () => {
  assert.equal(frame({tip: null}).tail, null);
  assert.equal(frame({tip: center}).tail, null, 'inside');
  assert.equal(frame({tip: TIPS.left, tailP: 0}).tail, null);
  assert.equal(frame({tip: TIPS.left, t: 0}).tail, null, 'before it reaches out');
});

test('it grows out of the point it reaches: a teardrop first, then the bubble', () => {
  const reach = t => { const f = frame({tip: TIPS.left, t}); return f.tail ? length(f) : 0; };
  assert.ok(reach(0.04) > 0 && reach(0.04) < reach(0.12) && reach(0.12) < reach(2), 'the tail grows with the bubble');
  assert.deepEqual(frame({tip: TIPS.left}).origin, TIPS.left, 'it grows from the fingertip');
  assert.deepEqual(frame({tip: null}).origin, center);
  const first = popPose(0), last = popPose(POP_TIME);
  assert.ok(first.scale < 0.3 && first.opacity < 1, 'it starts as a small teardrop');
  assert.ok(Math.abs(last.scale - 1) < 1e-6 && last.opacity === 1, 'and lands at full size');
  assert.ok(Math.max(...[0.5, 0.6, 0.7, 0.8].map(p => popPose(p * POP_TIME).scale)) > 1, 'with a little spring');
});

test('words first: it pops from its middle with no tail; the tail comes later and fades alone', () => {
  const paths = f => (f.svg.match(/<path/g) ?? []).length;
  // popping: from the middle, even beside something
  assert.deepEqual(frame({tip: TIPS.left, middle: true, tailP: 0, t: 0.1}).origin, center);
  assert.equal(frame({tip: TIPS.left, middle: true, tailP: 0}).tail, null, 'no tail yet');
  // the tail reaches as far as asked, however long the bubble has been there (or not)
  const half = frame({tip: TIPS.left, middle: true, tailP: 0.5, t: 0}), whole = frame({tip: TIPS.left, middle: true, tailP: 1, t: 0});
  assert.ok(length(half) > 0 && length(half) < length(whole));
  assert.deepEqual(whole.tail.tip, TIPS.left);
  // where the tail leaves the bubble (the hand comes out there): on its outline, even with no tail drawn
  const base = frame({tip: TIPS.left, middle: true, tailP: 0}).base;
  assert.deepEqual(base, whole.tail.base);
  assert.equal(frame({tip: null}).base, null);
  // fading: the closed bubble stays whole under the fading one with its tail
  const fading = frame({tip: TIPS.left, middle: true, tailOpacity: 0.4});
  assert.match(fading.svg, /<g opacity="0.4">/);
  assert.equal(paths(fading), 6, 'the closed bubble (2) under the bubble with its tail (4)');
  assert.equal(fading.opacity, 1, 'the bubble itself does not fade');
  assert.equal(paths(frame({tip: TIPS.left, middle: true})), 4);
  const gone = frame({tip: TIPS.left, middle: true, tailOpacity: 0});
  assert.ok(gone.tail === null && paths(gone) === 2, 'faded out: the closed bubble alone');
});

test('half the tail while the words are still gliding in', () => {
  assert.ok(length(frame({tip: TIPS.left, tailP: 0.5})) < length(frame({tip: TIPS.left})));
});

test('the bubble leaves with its words', () => {
  assert.equal(frame({tip: TIPS.left, remaining: 9}).opacity, 1);
  assert.ok(frame({tip: TIPS.left, remaining: 0.1}).opacity < 0.5);
  assert.equal(frame({tip: TIPS.left, remaining: 0}).opacity, 0);
});

test('the embed takes a chapter, a mode and a still; there is no caption style to choose', () => {
  const params = clipParams({clip: 'alerts', mode: 'preview', bubble: 'comic'});
  assert.equal(params.clip, 'alerts');
  assert.equal(params.mode, 'preview');
  assert.equal('bubble' in params, false);
});

test('a point inside the bubble makes no tail (the storyboard turns a tail off this way)', () => {
  const [px, py] = MESSAGE.pad;
  for (const tip of [center, {x: rect.x + 4, y: rect.y + 4}, {x: rect.x - px + 1, y: center.y}, {x: center.x, y: rect.y + rect.h + py - 1}]) {
    const f = frame({tip});
    assert.equal(f.tail, null, JSON.stringify(tip));
    assert.equal((f.svg.match(/<path/g) ?? []).length, 2, 'the body alone');
  }
  assert.ok(frame({tip: {x: rect.x - px - 40, y: center.y}}).tail, 'just outside: the tail is back');
});
