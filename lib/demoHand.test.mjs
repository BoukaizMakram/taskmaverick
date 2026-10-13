import test from 'node:test';
import assert from 'node:assert/strict';
import {HAND, LAUNCH, SWIPE, tap, speak, launch, relaunch, launchStop, carryStop, launches, carries, launchTail, handPose, leaveOf} from './demoHand.mjs';

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

test('between the clicks of a chapter the hand stays on screen and goes from one to the next; it leaves after the last', () => {
  const hop = handPose(many, 1.2);
  assert.equal(hop.from, 'yes-0', 'flies from one answer to the next');
  assert.equal(hop.after, 'yes-0');
  assert.ok(hop.opacity > 0.99, 'no fade between close clicks');
  const gap = handPose(many, 4);
  assert.ok(gap.opacity > 0.99 && gap.p === 1 && gap.to === 'yes-1', 'still there, on the last thing it clicked, while nothing is being clicked');
  const back = handPose(many, 6.05);
  assert.equal(back.from, 'yes-1', 'it goes on from there, never from outside');
  assert.ok(back.opacity > 0.99 && back.p < 0.2);
  assert.ok(handPose(many, 6.6).opacity > 0.99);
  assert.ok(handPose(many, leaveOf(many[2]) + HAND.fadeOut + 0.01).opacity === 0, 'after the last click it lingers, then goes');
  // a chapter whose last click the next chapter goes on with keeps it
  const kept = [...many.slice(0, 2), {...many[2], stay: true}];
  assert.equal(handPose(kept, 50).opacity, 1, 'it stays for the next chapter');
});

test('nothing on screen yet: the empty box, the words, the hand out of the bubble on the tail, the click, then the tail fades', () => {
  const t = launch(0.2, 1.5), stops = [launchStop('add-photo', t), {target: 'submit', ring: t.press + 4, press: t.press + 4.5}];
  assert.ok(launches(stops) && !launches(one) && !launches([]) && !carries(stops));
  assert.deepEqual([t.say, t.text], [0.2, 0.2 + LAUNCH.textLag]);
  assert.ok(Math.abs(t.typed - t.text - 1.5) < 1e-9, 'the words take their time');
  assert.ok(t.typed < t.ring && t.ring < t.arrive && t.arrive < t.press && t.press < t.fade, 'words, out, click, then the fade');
  assert.ok(Math.abs(t.open - t.press - 0.35) < 1e-9);
  // nothing while the words type
  assert.equal(handPose(stops, t.typed), null);
  assert.deepEqual(launchTail(stops, t.typed), {reach: 0, opacity: 0});
  // out of the bubble, the hand on the tail's tip
  const mid = handPose(stops, t.ring + LAUNCH.out / 2);
  assert.equal(mid.from, 'bubble');
  assert.ok(Math.abs(mid.p - launchTail(stops, t.ring + LAUNCH.out / 2).reach) < 1e-9 && mid.p > 0.4 && mid.p < 0.6);
  assert.deepEqual(launchTail(stops, t.arrive), {reach: 1, opacity: 1});
  assert.equal(handPose(stops, t.arrive).p, 1, 'the hand is on its target with the tail');
  // the click, with the tail still out; then the tail fades
  assert.ok(handPose(stops, t.press + 0.05).down && launchTail(stops, t.press + 0.05).opacity === 1, 'it clicks with the tail out');
  assert.ok(launchTail(stops, t.fade + LAUNCH.fade / 2).opacity < 0.6, 'then the tail fades');
  assert.equal(launchTail(stops, t.fade + LAUNCH.fade).opacity, 0);
  // a later click: the hand goes on from where it is, with no tail
  const back = handPose(stops, t.press + 4.05);
  assert.equal(back.from, 'add-photo');
  assert.equal(launchTail(stops, t.press + 4.05).opacity, 0);
  // a chapter where the hand does not act has no such tail
  assert.deepEqual(launchTail(one, 0.5), {reach: 0, opacity: 0});
  assert.equal(handPose(one, 0.01).from, 'edge');
  assert.deepEqual(launchStop('proofs', t, {kind: 'scroll', hold: 9}).kind, 'scroll');
});

test('going on with the hand of the chapter before: it is there from the start, goes to its target, the bubble comes out of it, the words, the click, then the tail fades', () => {
  const t = relaunch(0.45, 1.5), stops = [carryStop('yes-0', t, {target: 'translate'}), {target: 'yes-0', ring: t.press + 1, press: t.press + 1.3}];
  assert.ok(carries(stops) && !launches(stops));
  assert.ok(t.ring < t.arrive && t.arrive < t.say && t.say < t.text && t.text < t.typed && t.typed < t.press && t.press < t.fade, 'move, bubble, words, click, fade');
  assert.ok(Math.abs(t.say - t.arrive - HAND.say) < 1e-9 && Math.abs(t.text - t.say - HAND.textLag) < 1e-9);
  // before it sets off it is where the chapter before left it, on screen
  const resting = handPose(stops, 0);
  assert.deepEqual([resting.to, resting.p, resting.opacity, resting.down], ['translate', 1, 1, false]);
  // it goes from there to its target (no fade, not from the bubble or outside)
  const going = handPose(stops, (t.ring + t.arrive) / 2);
  assert.deepEqual([going.from, going.to, going.opacity], ['translate', 'yes-0', 1]);
  assert.ok(going.p > 0.2 && going.p < 0.8);
  // its bubble brings the tail out of it (whole), the tail fades after the click
  assert.deepEqual(launchTail(stops, t.say + 0.1), {reach: 1, opacity: 1});
  assert.ok(handPose(stops, t.press + 0.05).down && launchTail(stops, t.press + 0.05).opacity === 1);
  assert.equal(launchTail(stops, t.fade + LAUNCH.fade).opacity, 0);
  // a swipe left the hand up: the next flight starts from there
  const after = [carryStop('proofs', t, {target: 'proofs', kind: 'scroll'}, {kind: 'scroll', hold: t.press + 0.4})];
  assert.equal(handPose(after, 0).swipe, SWIPE, 'resting where the swipe left it');
  const start = handPose(after, t.ring + 0.01);
  assert.ok(start.fromSwipe === SWIPE && start.p < 0.1, 'and it sets off from there');
});

test('clicking the same target twice does not make the hand fly', () => {
  const twice = [{target: 'translate', ring: 0, press: 0.8}, {target: 'translate', ring: 1.0, press: 1.3}];
  const p = handPose(twice, 1.1);
  assert.equal(p.from, 'translate');
  assert.equal(p.p, 1);
});
