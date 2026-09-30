import test from 'node:test';
import assert from 'node:assert/strict';
import {HAND, tap, speak, handPose, leaveOf} from './demoHand.mjs';

const one = [{target: 'alert', ring: 0, press: HAND.travel}];
// A chapter with two clicks close together (a hop) and one much later (a second visit).
const many = [
  {target: 'yes-0', ring: 0, press: 0.8},
  {target: 'yes-1', ring: 1.05, press: 1.55},
  {target: 'translate', ring: 6, press: 6.5},
];

test('a click: the hand leaves, clicks, and what it opened is ready later', () => {
  const t = tap(1);
  assert.equal(t.press - t.ring, HAND.travel);
  assert.ok(Math.abs(t.open - t.press - 0.35) < 1e-9);
  assert.equal(tap(1, 0.35, HAND.hop).press, 1 + HAND.hop);
});

test('the bubble follows the click, the words follow the bubble', () => {
  const w = speak(2, 1.5);
  assert.ok(Math.abs(w.say - 2 - HAND.say) < 1e-9 && Math.abs(w.text - w.say - HAND.textLag) < 1e-9);
  assert.ok(Math.abs(w.typed - w.text - 1.5) < 1e-9);
});

test('nothing before the hand leaves; then it flies in from outside and lands before the click', () => {
  assert.equal(handPose(one, -0.1), null);
  assert.equal(handPose([], 1), null);
  const start = handPose(one, 0.01);
  assert.equal(start.from, 'edge');
  assert.ok(start.p < 0.05 && start.opacity < 0.2, 'just leaving, fading in');
  const landed = handPose(one, HAND.travel - HAND.arrive + 0.01);
  assert.ok(landed.p > 0.99 && landed.since < 0 && !landed.down, 'on the target, about to click');
  for (let t = 0.05; t < HAND.travel; t += 0.05) assert.ok(handPose(one, t).p >= handPose(one, t - 0.05).p - 1e-9, 'it only moves forward');
});

test('the click is held briefly (or until a drag ends)', () => {
  assert.ok(handPose(one, HAND.travel + 0.05).down);
  assert.ok(!handPose(one, HAND.travel + HAND.press + 0.02).down);
  const drag = [{target: 'knob', ring: 0, press: 1, hold: 3}];
  assert.ok(handPose(drag, 2.5).down && !handPose(drag, 3.05).down);
  assert.equal(leaveOf(drag[0]), 3 + HAND.linger, 'it lingers from the end of the drag');
});

test('the cursor fades out after the bubble has popped', () => {
  const press = one[0].press, popped = press + HAND.say + 0.42;
  assert.ok(handPose(one, press + 0.1).opacity > 0.99, 'still there as the teardrop comes out');
  assert.ok(HAND.linger >= popped - press - 0.05, 'it stays until the bubble has popped');
  assert.ok(handPose(one, leaveOf(one[0]) + HAND.fadeOut * 0.5).opacity < 0.6, 'fading');
  assert.equal(handPose(one, leaveOf(one[0]) + HAND.fadeOut + 0.01).opacity, 0, 'gone');
  assert.equal(handPose(one, 50).opacity, 0, 'and it stays gone');
});

test('close clicks keep the hand on screen; a click much later brings it back in from outside', () => {
  const hop = handPose(many, 1.2);
  assert.equal(hop.from, 'yes-0', 'flies from one answer to the next');
  assert.equal(hop.after, 'yes-0');
  assert.ok(hop.opacity > 0.99, 'no fade between close clicks');
  const gap = handPose(many, 4);
  assert.equal(gap.opacity, 0, 'gone while nothing is being clicked');
  const back = handPose(many, 6.05);
  assert.equal(back.from, 'edge', 'comes back in from outside');
  assert.equal(back.after, 'yes-1', 'but the bubble still comes from the last click');
  assert.ok(back.opacity < 0.7, 'fading back in');
  assert.ok(handPose(many, 6.6).opacity > 0.99);
});

test('clicking the same target twice does not make the hand fly', () => {
  const twice = [{target: 'translate', ring: 0, press: 0.8}, {target: 'translate', ring: 1.0, press: 1.3}];
  const p = handPose(twice, 1.1);
  assert.equal(p.from, 'translate');
  assert.equal(p.p, 1);
});
