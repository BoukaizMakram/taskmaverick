import test from 'node:test';
import assert from 'node:assert/strict';
import {planChapter, planVideo, bubbleMode, SPACING, MAX_GAP} from './storyboardFrames.mjs';
import {handPose, launchTail} from './demoHand.mjs';
import {QUALITY_STORY, HAND_STOPS, SAY, TEXT_AT, CLIP_SKIP} from './improvedQualityV2Story.mjs';

const video = () => planVideo({story: QUALITY_STORY, handStops: HAND_STOPS, say: SAY, textAt: TEXT_AT, skip: CLIP_SKIP});
const chapter = id => video().filter(f => f.chapter === id);

const FRESH = ['knowledge', 'translation', 'photo', 'video', 'emphasis', 'visibility', 'web'];          // the hand acts, nothing on screen before
const GOING_ON = ['steps', 'micro', 'rate', 'mobile', 'tour', 'remote'];           // the hand acts, going on from the chapter before
const SHOWN = ['alerts', 'links', 'capture', 'peer', 'performer', 'timestamp'];

test('the bubble is an empty bubble then its words; coming out of the hand, a tail first', () => {
  const t = {say: 1, textAt: 1.3};
  assert.equal(bubbleMode(0.9, t), null);
  assert.equal(bubbleMode(1.03, t), 'empty', 'no tail alone unless it comes out of the hand');
  assert.equal(bubbleMode(1.4, t), 'words');
  assert.equal(bubbleMode(2, {say: null, textAt: 0}), null, 'a chapter with no bubble');
  assert.equal(bubbleMode(1.03, {...t, tail: true}), 'tail');
  assert.equal(bubbleMode(1.25, {...t, tail: true}), 'empty');
  assert.equal(bubbleMode(1.4, {...t, tail: true}), 'words');
});

test('a chapter that shows something: the outline, then the empty bubble, then the words; never a tail', () => {
  for (const id of SHOWN) {
    const frames = chapter(id), kinds = frames.map(f => f.kind), at = k => frames.find(f => f.kind === k).time;
    for (const k of ['start', ...(id === 'peer' ? [] : ['mark']), 'bubble', 'words', 'end']) assert.ok(kinds.includes(k), `${id} has a ${k} frame`);
    assert.ok(!kinds.includes('tail') && !kinds.includes('fading') && frames.every(f => f.bubble !== 'tail'), `${id}: no tail (${kinds})`);
    assert.ok((id === 'peer' || at('mark') < at('bubble')) && at('bubble') < at('words'), id);
    assert.equal(frames.find(f => f.kind === 'bubble').bubble, 'empty');
    assert.equal(frames.find(f => f.kind === 'words').bubble, 'words');
  }
});

test('the hand acts with nothing on screen: the empty bubble, the words, the hand halfway out on the tail, both on the target, the click, then the tail fading', () => {
  for (const id of FRESH) {
    const frames = chapter(id), stops = HAND_STOPS[id], first = stops[0], at = k => frames.find(f => f.kind === k)?.at, kinds = frames.map(f => f.kind);
    for (const k of ['start', 'bubble', 'words', 'out', 'hand', 'click', 'fading', 'result', 'end']) assert.ok(kinds.includes(k), `${id} has a ${k} frame (${kinds})`);
    assert.ok(at('bubble') < at('words') && at('words') < at('out') && at('out') < at('hand') && at('hand') < at('click') && at('click') < at('fading') && at('fading') < at('result'), `${id}: ${kinds}`);
    assert.ok(!kinds.includes('tail'), `${id}: no tail alone`);
    assert.equal(frames.find(f => f.kind === 'start').bubble, null, `${id}: the scene comes in without it`);
    assert.equal(frames.find(f => f.kind === 'bubble').bubble, 'empty', `${id}: the box comes empty`);
    // coming out: the hand and the tail halfway
    const out = launchTail(stops, at('out')), pose = handPose(stops, at('out'));
    assert.ok(out.reach > 0.35 && out.reach < 0.65 && out.opacity === 1 && pose.from === 'bubble' && pose.opacity > 0.9, `${id}: halfway (${out.reach.toFixed(2)})`);
    // both on the target, the tail whole; the click with the tail still out; the tail fading after it
    assert.ok(at('hand') > first.arrive && at('hand') < first.press && launchTail(stops, at('hand')).opacity === 1, `${id}: on the target`);
    assert.ok(launchTail(stops, at('click')).opacity === 1 && handPose(stops, at('click')).down, `${id}: it clicks, the tail still out`);
    const fading = launchTail(stops, at('fading'));
    assert.ok(fading.reach === 1 && fading.opacity > 0.5 && fading.opacity < 0.9, `${id}: fading (${fading.opacity.toFixed(2)})`);
    assert.equal(launchTail(stops, at('result')).opacity, 0, `${id}: gone once the click is done`);
    assert.match(frames.find(f => f.kind === 'out').label, /halfway/);
    assert.match(frames.find(f => f.kind === 'hand').label, /^Tail and hand on /);
    assert.match(frames.find(f => f.kind === 'fading').label, /fading/);
  }
});

test('going on with the hand of the chapter before: the hand where it was, on its new target, the tail out of it alone, the empty bubble, the words, the click, the tail fading', () => {
  for (const id of GOING_ON) {
    const frames = chapter(id), stops = HAND_STOPS[id], first = stops[0], at = k => frames.find(f => f.kind === k)?.at, kinds = frames.map(f => f.kind);
    for (const k of ['start', 'hand', 'tail', 'bubble', 'words', 'click', 'fading', 'result', 'end']) assert.ok(kinds.includes(k), `${id} has a ${k} frame (${kinds})`);
    assert.ok(at('hand') < at('tail') && at('tail') < at('bubble') && at('bubble') < at('words') && at('words') < at('click') && at('click') < at('fading') && at('fading') < at('result'), `${id}: ${kinds}`);
    assert.ok(!kinds.includes('out'), `${id}: the hand does not come out of a bubble`);
    assert.equal(handPose(stops, 0.01).opacity, 1, `${id}: the hand is on screen from the start`);
    assert.equal(handPose(stops, 0.01).to, first.carry.target, `${id}: where the chapter before left it`);
    assert.equal(frames.find(f => f.kind === 'hand').bubble, null, `${id}: on its target before the bubble`);
    assert.equal(frames.find(f => f.kind === 'tail').bubble, 'tail', `${id}: the tail comes first`);
    assert.ok(handPose(stops, at('click')).down && launchTail(stops, at('click')).opacity === 1, `${id}: it clicks, the tail still out`);
    assert.ok(launchTail(stops, at('fading')).opacity < 0.9 && launchTail(stops, at('result')).opacity === 0, `${id}: then it fades`);
  }
});

test('every hand stop gets its own hand and click frames', () => {
  const frames = chapter('knowledge');
  assert.equal(frames.filter(f => f.kind === 'hand').length, HAND_STOPS.knowledge.length, 'the first one is the hand on its target with the tail');
  assert.equal(frames.filter(f => f.kind === 'click').length, HAND_STOPS.knowledge.length);
  assert.equal(chapter('alerts').filter(f => f.kind === 'click').length, 0, 'a point-only stop has no click frame');
});

test('title chapters have just their words', () => {
  const kinds = chapter('guidance').map(f => f.kind);
  assert.ok(kinds.includes('words') && !kinds.includes('tail') && !kinds.includes('click'));
});

test('frames stay inside their chapter, in order, never too close, never too far apart', () => {
  for (const scene of QUALITY_STORY) {
    const frames = chapter(scene.id);
    assert.ok(frames.length >= 2, scene.id);
    frames.forEach((f, i) => {
      assert.ok(f.time >= scene.start && f.time < scene.end, `${scene.id} ${f.kind} inside`);
      if (i) {
        const gap = f.time - frames[i - 1].time;
        assert.ok(gap >= SPACING - 1e-6, `${scene.id}: ${frames[i - 1].kind} -> ${f.kind} not too close (${gap})`);
        assert.ok(gap <= MAX_GAP + 1e-6, `${scene.id}: ${frames[i - 1].kind} -> ${f.kind} not too far (${gap})`);
      }
    });
  }
});

test('a chapter starts after the last one has left (its first frame is past CLIP_SKIP)', () => {
  for (const [id, skip] of Object.entries(CLIP_SKIP)) assert.ok(chapter(id)[0].at >= skip, id);
});

test('the video is numbered 1.. with unique ids', () => {
  const frames = video();
  assert.deepEqual(frames.map(f => f.n), frames.map((_, i) => i + 1));
  assert.equal(new Set(frames.map(f => f.id)).size, frames.length);
  assert.ok(frames.length > 60 && frames.length < 260, `${frames.length} frames`);
});

test('a short chapter with nothing in it still gets frames', () => {
  const frames = planChapter({start: 0, duration: 1, ready: 0.5}, {});
  assert.ok(frames.length >= 1);
});

test('what is only shown has an outline frame (the yellow rectangle), not a hand frame', () => {
  for (const id of ['alerts', 'links', 'capture', 'performer', 'timestamp']) { // (the peers' ratings: the drawn bracket points at them, no outline)
    const kinds = chapter(id).map(f => f.kind);
    assert.ok(kinds.includes('mark') && !kinds.includes('hand') && !kinds.includes('click'), `${id}: ${kinds}`);
    assert.ok(kinds.indexOf('mark') < kinds.indexOf('bubble'), `${id}: the outline, then the bubble`);
    assert.match(chapter(id).find(f => f.kind === 'mark').label, /^Outline on /);
  }
  const kinds = chapter('instructions').map(f => f.kind);
  assert.equal(kinds.filter(k => k === 'mark').length, 1, 'the card that only sets the level has no frame of its own');
  assert.ok(!chapter('translation').some(f => f.kind === 'mark'), 'a click keeps its hand frames');
});

test('the "after the click" frame waits until what the click did is done (never half way)', () => {
  const scene = {duration: 12, ready: 0.5};
  const stops = [{target: 'a', ring: 1, arrive: 1.4, press: 1.6, fade: 1.8}, {target: 'b', ring: 2, arrive: 2.4, press: 2.6, fade: 2.8, settle: 7}];
  const frames = planChapter(scene, {stops, say: 0.2, textAt: 0.5});
  const results = frames.filter(f => f.kind === 'result');
  assert.deepEqual(results.map(f => f.time), [2.15, 7], 'a click with no settle keeps press + 0.55; one with settle is after it');
  // the micro-training's Submit folds the quiz into a Done tile: its frame is after that
  const submit = chapter('micro').find(f => f.id === 'micro/result-5'), done = QUALITY_STORY.find(s => s.id === 'micro');
  assert.ok(submit && submit.at >= 0, 'it is still there');
  assert.ok(submit.time > done.start + 8, `it is late in the chapter (${submit.at}s)`);
});
