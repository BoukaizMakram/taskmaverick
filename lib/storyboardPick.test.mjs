import test from 'node:test';
import assert from 'node:assert/strict';
import {addPick, framesOfPicks, groupPicks, hasPick, isBackdrop, meets, nextLayer, picksOf, rectOf, removePick, samePicks, sameSpot} from './storyboardPick.mjs';

test('picks keep the frame each asset is in, and add and remove one by one', () => {
  let picks = picksOf('a/1', ['mission']);
  picks = addPick(picks, {frame: 'b/2', key: 'hand'});
  picks = addPick(picks, {frame: 'b/2', key: 'hand'});
  assert.deepEqual(picks, [{frame: 'a/1', key: 'mission'}, {frame: 'b/2', key: 'hand'}], 'one pick is one asset, however many times it is added');
  assert.equal(hasPick(picks, {frame: 'b/2', key: 'hand'}), true);
  assert.equal(hasPick(picks, {frame: 'a/1', key: 'hand'}), false, 'the same key in another frame is another asset');
  assert.deepEqual(removePick(picks, {frame: 'a/1', key: 'mission'}), [{frame: 'b/2', key: 'hand'}]);
});

test('picks are grouped by frame, in the order they were picked', () => {
  const picks = [{frame: 'b', key: 'x'}, {frame: 'a', key: 'y'}, {frame: 'b', key: 'z'}, {frame: 'b', key: 'x'}];
  assert.deepEqual(groupPicks(picks), [{frame: 'b', keys: ['x', 'z']}, {frame: 'a', keys: ['y']}]);
  assert.deepEqual(framesOfPicks(picks), ['b', 'a']);
  assert.equal(samePicks([{frame: 'a', key: '1'}, {frame: 'b', key: '2'}], [{frame: 'b', key: '2'}, {frame: 'a', key: '1'}]), true);
  assert.equal(samePicks([{frame: 'a', key: '1'}], [{frame: 'a', key: '1'}, {frame: 'b', key: '2'}]), false);
});

test('a click again goes to the layer under, and round again after the last', () => {
  const under = ['text', 'card', 'mission', 'dim'];
  assert.equal(nextLayer(under, 'text'), 'card');
  assert.equal(nextLayer(under, 'mission'), 'dim');
  assert.equal(nextLayer(under, 'dim'), 'text', 'after the last, the top again');
  assert.equal(nextLayer(under, 'gone'), 'text', 'a selection not under the pointer: from the top');
  assert.equal(nextLayer(['only'], 'only'), 'only');
  assert.equal(nextLayer([], 'x'), null);
});

test('a click is again at the same place when the pointer barely moved', () => {
  assert.equal(sameSpot({x: 100, y: 100}, {x: 102, y: 103}), true);
  assert.equal(sameSpot({x: 100, y: 100}, {x: 110, y: 100}), false);
  assert.equal(sameSpot(null, {x: 1, y: 1}), false);
});

test('a rectangle takes in what it touches, drawn in any direction', () => {
  const box = {left: 100, top: 100, right: 200, bottom: 180};
  assert.equal(meets(rectOf({x: 150, y: 90}, {x: 120, y: 120}), box), true, 'it reaches into the box');
  assert.equal(meets(rectOf({x: 10, y: 10}, {x: 99, y: 99}), box), false, 'it stops just short');
  assert.equal(meets(rectOf({x: 0, y: 0}, {x: 300, y: 300}), box), true, 'it takes it all in');
  assert.deepEqual(rectOf({x: 50, y: 40}, {x: 10, y: 90}), {left: 10, top: 40, right: 50, bottom: 90}, 'from the bottom left up to the right is the same rectangle');
});

test('an asset as big as the frame is a backdrop, not something to take in', () => {
  const stage = {left: 0, top: 0, right: 1600, bottom: 900};
  assert.equal(isBackdrop({left: 0, top: 0, right: 1600, bottom: 900}, stage), true, 'a dim over everything');
  assert.equal(isBackdrop({left: -40, top: -40, right: 1640, bottom: 940}, stage), true, 'bigger than the frame');
  assert.equal(isBackdrop({left: 400, top: 100, right: 1260, bottom: 700}, stage), false, 'a tablet');
  assert.equal(isBackdrop({left: 0, top: 0, right: 1500, bottom: 850}, stage), true, 'nearly all of it');
});
