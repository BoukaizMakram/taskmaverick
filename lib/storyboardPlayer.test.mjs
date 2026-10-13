import test from 'node:test';
import assert from 'node:assert/strict';
import {HOLD, MOVE, WRITE, penStart, pairLists, easeInv, takeOver, windowEasing, windowKeys, isOverlay, isTypingStep, roleOf, writeProgress, writeSecondsOf, clock, ease, fadeFrames, lineMarks, locate, pairLayers, sameLook, settledAt, timelineOf, LATE} from './storyboardPlayer.mjs';

const f = (id, time, chapter = 'a') => ({id, time, chapter});

test('a frame stays as long as the demo did before the next one, kept between the limits', () => {
  const tl = timelineOf([f('1', 0), f('2', 0.1), f('3', 4), f('4', 20), f('5', null), f('6', 30)]);
  assert.equal(tl.items[0].hold, HOLD.min, '0.1 s later: the least');
  assert.equal(tl.items[1].hold, HOLD.max, '3.9 s later: no more than the most');
  assert.equal(tl.items[2].hold, HOLD.max, '16 s later: the most');
  assert.equal(timelineOf([f('1', 0), f('2', 1)]).items[0].hold, 1, 'in between: as long as the demo');
  assert.equal(tl.items[3].hold, HOLD.fallback, 'the next one has no time: the usual');
  assert.equal(tl.items[4].hold, HOLD.fallback, 'no time of its own: the usual');
  assert.equal(tl.items[5].hold, HOLD.last, 'the last one');
  assert.deepEqual(tl.items.map(i => i.start), tl.items.reduce((a, i, k) => [...a, k ? a[k - 1] + tl.items[k - 1].hold : 0], []), 'each starts when the one before is done');
  assert.ok(Math.abs(tl.total - tl.items.reduce((s, i) => s + i.hold, 0)) < 1e-9);
});

test('a frame goes out of order (a time that goes back) with the usual hold', () => {
  const tl = timelineOf([f('1', 10), f('2', 4), f('3', 5)]);
  assert.equal(tl.items[0].hold, HOLD.fallback);
  assert.equal(tl.items[1].hold, 1, 'a second later: a second');
});

test('the move into a frame is short, never most of its time, and the first frame has none', () => {
  const tl = timelineOf([f('1', 0), f('2', 0.8), f('3', 1.6)]);
  assert.equal(tl.items[0].move, 0);
  assert.ok(Math.abs(tl.items[1].move - tl.items[1].hold * MOVE.share) < 1e-9, 'a short one: a share of its time');
  assert.equal(tl.items[2].move, MOVE.max, 'the last frame holds long enough for the most');
  const long = timelineOf([f('1', 0), f('2', 5), f('3', 12)]);
  assert.equal(long.items[1].move, MOVE.max, 'a long one: at most the most');
});

test('a frame can say how long it stays and rests: the cursor that has come to what it clicks does not wait on it', () => {
  const frames = [f('1', 0), f('2', 0.9), f('3', 1.8)];
  const usual = timelineOf(frames, () => 0, id => (id === '2' ? {move: 0.6, minHold: 0.6 + 0.55} : {})).items[1];
  assert.ok(usual.hold >= 0.6 + 0.55, 'the usual: it waits the video\'s own rest');
  const quick = timelineOf(frames, () => 0, id => (id === '2' ? {move: 0.6, minHold: 0.6 + 0.12, natural: 0, rest: 0.12} : {})).items[1];
  assert.ok(Math.abs(quick.hold - (0.6 + 0.12)) < 1e-9, 'its own: the move, then only the rest it asked for');
  assert.equal(timelineOf(frames, () => 0, () => ({}), {rest: 0.2}).items[1].hold, timelineOf(frames).items[1].hold, 'a frame that does not say is as before');
});

test('a frame can say how many seconds more it stays once all of it is there', () => {
  const frames = [f('1', 0), f('2', 0.9), f('3', 1.8)];
  const usual = timelineOf(frames).items[1], longer = timelineOf(frames, () => 0, id => (id === '2' ? {extra: 2} : {})).items[1];
  assert.ok(Math.abs(longer.hold - (usual.hold + 2)) < 1e-9, 'two seconds more');
  assert.equal(longer.move, usual.move, 'its move is the same');
  assert.equal(timelineOf(frames, () => 0, id => (id === '2' ? {extra: 2} : {})).total, timelineOf(frames).total + 2, 'and so is the video');
});

test('where the video is: the frame, moving in or held', () => {
  const tl = timelineOf([f('1', 0), f('2', 2), f('3', 4), f('4', 6)]);
  const [a, b, c] = tl.items;
  assert.deepEqual(locate(tl, 0), {index: 0, id: '1', local: 0, moving: false, progress: 1});
  const mid = locate(tl, b.start + b.move / 2);
  assert.equal(mid.index, 1); assert.equal(mid.moving, true); assert.ok(Math.abs(mid.progress - 0.5) < 1e-9);
  const held = locate(tl, b.start + b.move + 0.2);
  assert.deepEqual([held.index, held.moving, held.progress], [1, false, 1]);
  assert.equal(locate(tl, c.start).index, 2, 'the moment the next starts');
  assert.equal(locate(tl, a.start + a.hold - 1e-6).index, 0, 'a hair before it');
  assert.equal(locate(tl, -5).index, 0, 'before the start: the first');
  assert.equal(locate(tl, 999).index, 3, 'after the end: the last, at rest');
  assert.equal(locate(tl, 999).moving, false);
  assert.equal(locate(timelineOf([]), 0), null);
  assert.equal(locate(tl, NaN).index, 0);
});

test('a picked frame is shown settled, not half moved in', () => {
  const tl = timelineOf([f('1', 0), f('2', 2), f('3', 4)]);
  for (let i = 0; i < 3; i++) { const at = locate(tl, settledAt(tl, i)); assert.equal(at.index, i); assert.equal(at.moving, false); }
  assert.equal(settledAt(tl, 99), 0);
  assert.ok(settledAt(timelineOf([f('1', 0)]), 0) <= 1.8);
});

test('the move is eased: slow at both ends, half way at the middle, always in range', () => {
  assert.equal(ease(0), 0); assert.equal(ease(1), 1); assert.equal(ease(0.5), 0.5);
  assert.ok(ease(0.1) < 0.1 && ease(0.9) > 0.9, 'a soft start and stop');
  assert.equal(ease(-1), 0); assert.equal(ease(3), 1);
  let last = -1;
  for (let i = 0; i <= 100; i++) { const v = ease(i / 100); assert.ok(v >= last, 'never goes back'); last = v; }
});

test('frames are drawn the same way when the demo\'s classes, variables and scene are the same', () => {
  const a = {shell: 's', stageClass: 'c', stageStyle: '--x:1', scene: 'knowledge', view: 'kb'};
  assert.equal(sameLook(a, {...a}), true);
  assert.equal(sameLook(a, {...a, scene: 'alerts'}), false);
  assert.equal(sameLook(a, {...a, stageStyle: ''}), false);
  assert.equal(sameLook({scene: 'x'}, {scene: 'x', view: ''}), true, 'nothing and empty are the same');
  assert.equal(sameLook(null, a), false);
});

test('between two frames an asset glides, fades in or fades out', () => {
  const from = [{key: 'tablet', sig: 't1'}, {key: 'hand', sig: 'h1'}, {key: 'bubble', sig: 'b1'}, {key: 'circle', sig: 'c1'}];
  const to = [{key: 'tablet', sig: 't1'}, {key: 'bubble', sig: 'b2'}, {key: 'hand', sig: 'h1'}, {key: 'ripple', sig: 'r1'}];
  const p = pairLayers(from, to);
  assert.deepEqual(p.matched, [{key: 'tablet', from: 'tablet', same: true}, {key: 'bubble', from: 'bubble', same: false}, {key: 'hand', from: 'hand', same: true}], 'in the order of the next frame');
  assert.deepEqual(p.gone, ['circle']);
  assert.deepEqual(p.added, ['ripple']);
  assert.deepEqual(pairLayers([], to), {matched: [], gone: [], added: ['tablet', 'bubble', 'hand', 'ripple']});
  assert.deepEqual(pairLayers(from, []), {matched: [], gone: ['tablet', 'hand', 'bubble', 'circle'], added: []});
});

// the opacity a keyframe list gives at `u` of the (eased) move: linear between keyframes
const opacityAt = (frames, u) => {
  for (let k = 1; k < frames.length; k++) if (u <= frames[k].offset) { const p = frames[k - 1], q = frames[k]; return q.offset === p.offset ? q.opacity : p.opacity + (q.opacity - p.opacity) * (u - p.offset) / (q.offset - p.offset); }
  return frames.at(-1).opacity;
};

test('fades: in over the first part of the move, out over the last, so two looks never both show half', () => {
  const at = opacityAt, inn = fadeFrames('in', 1), out = fadeFrames('out', 1);
  assert.equal(at(inn, 0), 0); assert.ok(Math.abs(at(inn, 0.5) - 1) < 1e-9); assert.equal(at(inn, 1), 1);
  assert.equal(at(out, 0), 1); assert.ok(Math.abs(at(out, 0.5) - 1) < 1e-9); assert.equal(at(out, 1), 0);
  for (let i = 0; i <= 40; i++) assert.ok(at(inn, i / 40) + at(out, i / 40) >= 1 - 1e-9, 'together they always cover it');
  assert.ok(Math.abs(at(fadeFrames('fade-in', 1), 0.5) - 0.5) < 1e-9, 'half way, half there'); assert.ok(Math.abs(at(fadeFrames('fade-out', 1), 0.5) - 0.5) < 1e-9);
  assert.equal(at(fadeFrames('hide', 1), 0.6), 0); assert.equal(at(fadeFrames('hold', 0.5), 0.6), 0.5);
  assert.equal(at(fadeFrames('in', 0.4), 1), 0.4, 'it ends as opaque as the asset is on (a dim at 40% stays 40%)');
  assert.equal(at(fadeFrames('in', NaN), 1), 1, 'an opacity that cannot be read is full');
});

test('fades are smooth at both ends (the user, 2026-10-12): in the time of the move they start and stop at no speed, whatever part of the move they take', () => {
  const atT = (frames, t) => opacityAt(frames, ease(t)), rate = (frames, t) => (atT(frames, t + 1e-3) - atT(frames, t - 1e-3)) / 2e-3, peak = frames => Math.max(...Array.from({length: 401}, (_, i) => Math.abs(rate(frames, 0.002 + i * 0.9975 / 400))));
  const PARTS = {in: [0, 0.5], out: [0.5, 1], 'fade-in': [0, 1], 'fade-out': [0, 1], 'swap-in': [0.5, 1], 'swap-out': [0, 0.5], 'quick-out': [0, 0.25], 'click-in': [0.3, 0.6], 'click-out': [0.3, 0.6]};
  for (const [phase, [t0, t1]] of Object.entries(PARTS)) {
    const frames = fadeFrames(phase, 1), fastest = peak(frames), edge = (t1 - t0) * 0.04;
    assert.ok(frames.every((k, i) => i === 0 || k.offset >= frames[i - 1].offset), phase + ': in order');
    assert.ok(frames.every(k => k.opacity >= -1e-9 && k.opacity <= 1 + 1e-9), phase + ': never beyond what it is');
    assert.ok(Math.abs(rate(frames, t0 + edge)) < fastest * 0.3, phase + ': it starts at no speed (' + rate(frames, t0 + edge).toFixed(2) + ' of ' + fastest.toFixed(2) + ')');
    assert.ok(Math.abs(rate(frames, t1 - edge)) < fastest * 0.3, phase + ': it stops at no speed (' + rate(frames, t1 - edge).toFixed(2) + ' of ' + fastest.toFixed(2) + ')');
  }
  // the same for a fade that ends half way through the move, where the clock is fastest: the last 3% of the move changes it very little
  const out = fadeFrames('swap-out', 1), nearEnd = atT(out, 0.47) - atT(out, 0.5);
  assert.ok(nearEnd < 0.03, 'the last 3% of its part changes it by ' + nearEnd.toFixed(3));
});

test('swapped words: the old ones are gone by half way and the new ones only come after it', () => {
  const out = fadeFrames('swap-out', 0.8), into = fadeFrames('swap-in', 0.8);
  assert.equal(out[0].offset, 0); assert.equal(out[0].opacity, 0.8); assert.equal(opacityAt(out, 0.5), 0); assert.equal(opacityAt(out, 1), 0);
  assert.equal(opacityAt(into, 0), 0); assert.equal(opacityAt(into, 0.5), 0); assert.ok(Math.abs(opacityAt(into, 1) - 0.8) < 1e-9);
  for (let i = 0; i <= 40; i++) { const t = i / 40; assert.ok(opacityAt(out, t) === 0 || opacityAt(into, t) === 0, 'never both there at once (t=' + t.toFixed(2) + ')'); }
});

// the value a CSS linear(...) easing gives at `u` (0-1): linear between its points
const easedAt = (easing, u) => { const pts = /linear\(([^)]*)\)/.exec(easing)[1].split(',').map(Number), x = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(x)); return pts[i] + (pts[i + 1] - pts[i]) * (x - i); };

test('a part of a move (the screen changes once the cursor has pressed): it starts and stops at no speed, in the time of the move, not at the fastest of its eased clock', () => {
  for (const y of [0, 0.05, 0.3, 0.5, 0.77, 1]) assert.ok(Math.abs(ease(easeInv(y)) - y) < 1e-9, 'ease and its inverse');
  assert.equal(windowEasing(0, 1), 'linear', 'the whole move needs no more than its own ease');
  const e = windowEasing(0.3, 1), at = u => easedAt(e, u);
  assert.equal(at(0), 0); assert.equal(at(1), 1); assert.equal(at(ease(0.3)), 0, 'nothing happens before its part begins');
  let last = -1; for (let i = 0; i <= 100; i++) { assert.ok(at(i / 100) >= last - 1e-9, 'never goes back'); last = at(i / 100); }
  // in the time of the move (t -> u = ease(t)) the speed where it starts is a small share of what it goes at in the middle of its part
  const speed = t => (at(ease(t + 0.004)) - at(ease(t - 0.004))) / 0.008;
  assert.ok(speed(0.3 + 0.03) < speed(0.65) * 0.25, 'it eases in (' + speed(0.33).toFixed(2) + ' against ' + speed(0.65).toFixed(2) + ')');
  assert.ok(speed(0.97) < speed(0.65) * 0.25, 'and out');
  const keys = windowKeys({scale: '1'}, {scale: '2'}, 0.3, 1);
  assert.equal(keys.length, 2); assert.equal(keys.easing, e); assert.deepEqual(keys.map(k => k.offset), [0, 1]);
});

test('a screen that takes the place of another after a click: the new one comes in over the old, the old goes once it is there, so the picture never dips', () => {
  const {old, next} = takeOver(1, 0.3, 0.2), at = (frames, u) => { for (let k = 1; k < frames.length; k++) if (u <= frames[k].offset) { const p = frames[k - 1], q = frames[k]; return q.offset === p.offset ? q.opacity : p.opacity + (q.opacity - p.opacity) * (u - p.offset) / (q.offset - p.offset); } return frames.at(-1).opacity; };
  for (let i = 0; i <= 200; i++) { const u = i / 200, a = at(old, u), b = at(next, u); assert.ok(b + (1 - b) * a >= 1 - 1e-9, 'covered at ' + u.toFixed(3)); }
  assert.equal(at(next, ease(0.3)), 0, 'not before the click'); assert.ok(Math.abs(at(next, ease(0.5)) - 1) < 1e-9, 'there once its part is done'); assert.equal(at(old, 1), 0);
  assert.equal(at(takeOver(0.6, 0.3).next, 1), 0.6, 'as opaque as the screen is');
});

test('the things of two lists are paired by what they are: one put in among the others does not make each one after it the one before; one changed in place is still its own', () => {
  assert.deepEqual(pairLists(['a', 'b', 'c'], ['a', 'x', 'b', 'c']), [[0, 0], [1, 2], [2, 3]], 'one put in');
  assert.deepEqual(pairLists(['a', 'b', 'c'], ['a', 'c']), [[0, 0], [2, 1]], 'one taken out');
  assert.deepEqual(pairLists(['k:a', 'k:old', 'k:z'], ['k:a', 'k:new', 'k:z'], ['k', 'k', 'k'], ['k', 'k', 'k']), [[0, 0], [1, 1], [2, 2]], 'the same kind of thing with other words, between two that stay');
  assert.deepEqual(pairLists(['p:old'], ['q:new'], ['p'], ['q']), [], 'another kind of thing is not the same thing');
  assert.deepEqual(pairLists([], ['a']), []); assert.deepEqual(pairLists(['a'], []), []);
  const same = ['row', 'row', 'row'], rows = pairLists(['r:1', 'r:2', 'r:3'], ['r:new', 'r:1', 'r:2', 'r:3'], same, ['row', 'row', 'row', 'row']);
  assert.deepEqual(rows, [[0, 1], [1, 2], [2, 3]], 'a row put in at the top: the rows are the rows they were, not the next one down');
});

test('the marks on the bar are where each line starts', () => {
  const frames = [f('1', 0, 'a'), f('2', 1, 'a'), f('3', 2, 'b'), f('4', 3, 'b'), f('5', 4, 'c')];
  const tl = timelineOf(frames);
  const marks = lineMarks(frames, tl);
  assert.deepEqual(marks.map(m => m.chapter), ['a', 'b', 'c']);
  assert.equal(marks[0].at, 0);
  assert.ok(marks[1].at > 0 && marks[1].at < marks[2].at && marks[2].at < 1);
  assert.deepEqual(lineMarks([], timelineOf([])), []);
});

test('the clock reads minutes and seconds', () => {
  assert.equal(clock(0), '0:00'); assert.equal(clock(65), '1:05'); assert.equal(clock(59.6), '1:00'); assert.equal(clock(-3), '0:00'); assert.equal(clock(600), '10:00');
});

test('a frame with a pen stays long enough for it, and is settled once the words are written', () => {
  const frames = [f('1', 0), f('2', 0.8), f('3', 1.6)];
  const plain = timelineOf(frames), written = timelineOf(frames, id => (id === '2' ? 4 : 0));
  assert.equal(plain.items[1].write, 0);
  assert.equal(written.items[1].write, 4);
  assert.deepEqual(written.items.map(i => i.move), plain.items.map(i => i.move), 'its move in is the same');
  assert.ok(written.items[1].hold >= penStart(written.items[1].move) + 4 + WRITE.tail - 1e-9, 'held for the pen and a moment after');
  assert.equal(written.items[0].hold, plain.items[0].hold, 'the others are as they were');
  assert.ok(written.total > plain.total + 3);
  const at = settledAt(written, 1), item = written.items[1];
  assert.ok(Math.abs(at - (item.start + penStart(item.move) + 4)) < 0.01, 'settled when the pen lifts');
  assert.ok(at < item.start + item.hold, 'and before the frame goes');
  assert.equal(locate(written, at).index, 1);
});

test('a pen touches once the old words are gone (half the move), not after the move; the first frame has no move: after the lead', () => {
  const item = {move: 0.4}, at = penStart(0.4);
  assert.ok(Math.abs(at - (0.4 * WRITE.early + WRITE.gap)) < 1e-9 && at < 0.4, 'before the move ends');
  assert.ok(writeProgress(item, 4, 0) < 0 && writeProgress(item, 4, at - 0.01) < 0, 'before it touches');
  assert.ok(Math.abs(writeProgress(item, 4, at)) < 1e-9, 'it touches as the old words are gone');
  assert.ok(Math.abs(writeProgress(item, 4, at + 2) - 0.5) < 1e-9, 'half way after half its seconds');
  assert.ok(writeProgress(item, 4, at + 4) >= 1 - 1e-9);
  assert.equal(penStart(0), WRITE.lead, 'a frame that does not move in');
});

test('writeSecondsOf takes the slowest chat box of a frame, 0 when it has none', () => {
  const edits = {frames: {a: {anims: {x: {type: 'handwrite', seconds: 3}, y: {type: 'handwrite', seconds: 5}}}, b: {}}};
  const of = writeSecondsOf(edits);
  assert.equal(of('a'), 5);
  assert.equal(of('b'), 0);
  assert.equal(of('nope'), 0);
  assert.equal(writeSecondsOf(null)('a'), 0);
});

test('the cursor, the tablet and the words are one asset from frame to frame, whatever they are called', () => {
  assert.equal(roleOf({key: 'c1-hand', name: 'Hand', kind: 'dom'}), 'hand');
  assert.equal(roleOf({key: 'c1-tablet', name: 'Tablet', kind: 'dom'}), 'tablet');
  assert.equal(roleOf({key: 'bubble', name: 'Chat bubble', kind: 'bubble'}), 'words');
  assert.equal(roleOf({key: 'panel', name: 'Panel', kind: 'dom'}), 'panel');
  const p = pairLayers([{key: 'hand', role: 'hand', sig: 'h'}, {key: 'tablet', role: 'tablet', sig: 't'}], [{key: 'c1-tablet', role: 'tablet', sig: 't'}, {key: 'c1-hand', role: 'hand', sig: 'h'}]);
  assert.deepEqual(p.matched, [{key: 'c1-tablet', from: 'tablet', same: true}, {key: 'c1-hand', from: 'hand', same: true}]);
  assert.deepEqual([p.gone, p.added], [[], []]);
});

test('words that are the start of the next frame words are typed on in the video, not crossed', () => {
  assert.equal(isTypingStep('As Teams  ', 'As Teams Work Information Is Readily Available '), true);
  assert.equal(isTypingStep('Knowledge', 'As Teams Work'), false);
  assert.equal(isTypingStep('As Teams Work', 'As Teams Work'), false, 'the same words are not a step');
  assert.equal(isTypingStep('', 'As Teams'), false);
});

test('a frame whose words are only the start of the next frame words is not shown; the roles of the layers', () => {
  assert.equal(isTypingStep('Teams Are', 'Teams Are Constantly Guided'), true);
  assert.equal(isTypingStep('Teams Are', 'Teams Are'), false);
  assert.equal(roleOf({key: 'c1-title', name: 'Title', kind: 'dom'}), 'title');
  assert.equal(roleOf({key: 'x', name: 'Plate', kind: 'dom'}), 'plate');
  assert.equal(isOverlay({key: 'c1-highlight', name: 'Highlight', kind: 'dom'}), true);
  assert.equal(isOverlay({key: 'c1-tablet', name: 'Tablet', kind: 'dom'}), false);
  assert.equal(isOverlay({key: 'bubble', name: 'Chat bubble', kind: 'bubble'}), false);
});

test('the director can lengthen a move and keep a frame on until its late highlight is all there', () => {
  const frames = [{id: 'a', time: 0}, {id: 'b', time: 1}, {id: 'c', time: 2}];
  const t = timelineOf(frames, () => 0, id => (id === 'b' ? {move: 0.9, late: true} : id === 'c' ? {minHold: 3} : {}));
  assert.equal(t.items[1].move, 0.9);
  assert.ok(t.items[1].hold >= 0.9 + LATE.lead + LATE.fade + 0.5 - 1e-9, 'the highlight is seen for a moment');
  assert.ok(t.items[1].settle >= t.items[1].start + 0.9 + LATE.lead + LATE.fade);
  assert.equal(t.items[2].hold, 3);
});

test('a lengthened move is never cut off: the frame rests after it, whatever the demo gave it', () => {
  const frames = [{id: 'a', time: 0}, {id: 'b', time: 0.2}, {id: 'c', time: 0.4}];
  const t = timelineOf(frames, () => 0, id => (id === 'b' ? {move: 1.15} : {}));
  assert.ok(t.items[1].hold >= 1.15 + HOLD.rest - 1e-9);
  assert.equal(locate(t, t.items[1].start + 1.15 + 0.01).moving, false, 'the click is all done before the next frame');
});

test('letters per second: a frame with a pen stays for its letters / speed', () => {
  const edits = {frames: {a: {anims: {x: {type: 'handwrite', cps: 4}}}}};
  assert.equal(writeSecondsOf(edits, () => 'abcdefgh')('a'), 2);
});

test('a scene with its own beat: the highlight first, the pen after it, the whole of it in the time the video says, then the hold (the user, 2026-10-13)', () => {
  const frames = [{id: 'a', time: 0}, {id: 'b', time: 0.2}];
  // the move into b is 0.5 s; the highlight is in 0.35 s after it; the pen touches just after (penAt) and writes 2.6 s: all of it is 3 s after the move, held 0.7 s more
  const t = timelineOf(frames, id => (id === 'b' ? 2.6 : 0), id => (id === 'b' ? {move: 0.5, penAt: 0.4, lateLead: 0, lateFade: 0.35, late: true, minHold: 0.5 + 3 + 0.7} : {}));
  const item = t.items[1];
  assert.equal(item.penAt, 0.4);
  assert.equal(penStart(item.move, false, item.penAt), 0.9, 'the pen touches 0.4 s after the move is over, not during it');
  assert.equal(penStart(0.5, false, null), 0.5 * WRITE.early + WRITE.gap, 'the usual: during the move');
  assert.ok(Math.abs(item.hold - 4.2) < 1e-9, `the scene is its move + 3.7 s (${item.hold})`);
  assert.ok(writeProgress(item, 2.6, 0.5 + 0.35) < 0, 'while the highlight comes in the pen has not touched');
  assert.ok(Math.abs(writeProgress(item, 2.6, 0.5 + 3) - 1) < 1e-9, 'the writing is done 3 s after the move');
  assert.ok(item.settle >= item.start + 0.5 + 3, 'settled when it is all there');
});
