import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY, addCopy, isEdited, normalizeEdits, orderedFrames, resetFrame, setScale, setSize, setUnique} from './storyboardEdits.mjs';
import {copyLayers, pasteLayers} from './storyboardClipboard.mjs';
import {fromShared, linkOf, linkedLayers, linkedParts, splitKey, toShared} from './storyboardLinks.mjs';
import {fitImage, imageInsert, isImage} from './storyboardImages.mjs';

const ASSETS = {
  m: '<div class="iq2-mission" data-sb-root="mission"><p>Opening Quality Check</p><span>Anna F</span></div>',
  b: '<div class="cb-caption" data-sb-root="bubble"><p aria-label="Hi"><span>Hi</span></p></div>',
};
const frame = (id, chapter) => ({id, chapter, label: 'Words', stageClass: 'ad-stage', scene: {id: chapter, view: 'mission'}, layers: [
  {key: 'mission', name: 'Mission', kind: 'dom', asset: 'm', box: {x: 480, y: 20, w: 420, h: 700}},
  {key: 'bubble', name: 'Chat bubble', kind: 'bubble', asset: 'b', box: {x: 950, y: 200, w: 260, h: 80}, style: 'yellow', tip: [900, 240]},
]});
const BASE = [frame('a1', 'alerts'), frame('a2', 'alerts'), frame('l1', 'links')];
const htmlOf = edits => hash => edits.library[hash] ?? ASSETS[hash];
const dup = (edits, from, to, keys, options = {}) => {
  const framesNow = orderedFrames(BASE, edits), src = framesNow.find(f => f.id === from), dst = framesNow.find(f => f.id === to);
  const clip = copyLayers({frame: src, edit: edits.frames[from], keys, htmlOf: htmlOf(edits)});
  return pasteLayers(edits, dst, clip.items, {linked: true, source: from, ...options});
};

test('keys: an asset, a part of it, a piece of text; and a part\'s place inside a pasted wrapper', () => {
  assert.deepEqual(['mission', 'mission/1.2', 'mission#0', 'mission/1#2'].map(splitKey), [{layer: 'mission', rest: ''}, {layer: 'mission', rest: '/1.2'}, {layer: 'mission', rest: '#0'}, {layer: 'mission', rest: '/1#2'}]);
  for (const rest of ['', '/1.2', '#0', '/1#2']) {
    assert.equal(toShared(rest, false), rest);
    assert.equal(toShared(fromShared(rest, true), true), rest, rest);
  }
  assert.deepEqual(['', '/1.2', '#0'].map(r => fromShared(r, true)), ['/0.0', '/0.0.1.2', '/0.0#0']);
  assert.equal(toShared('/0', true), null, 'the wrapper itself is not shared');
  assert.equal(toShared('', true), null);
});

test('the same captured asset is linked along its line of the board, not across lines', () => {
  const frames = orderedFrames(BASE, EMPTY);
  assert.deepEqual(linkOf(frames[0], undefined, 'mission'), {id: 'mission', inner: false});
  assert.deepEqual(linkedLayers(frames.filter(f => f.chapter === 'alerts'), EMPTY, 'mission').map(m => m.frame), ['a1', 'a2']);
  assert.deepEqual(linkedParts({frames, edits: EMPTY, frame: frames[0], key: 'mission/0'}).map(m => [m.frame, m.key, m.asset]), [['a2', 'mission/0', 'm']], 'the other frame of the line only');
  assert.deepEqual(linkedParts({frames, edits: EMPTY, frame: frames[2], key: 'mission/0'}), [], 'alone in its line');
});

test('a duplicate (Alt+drag, paste) is linked to its original; in a duplicated frame too', () => {
  // the mission duplicated inside its frame, and into the next one
  let {edits, keys} = dup(EMPTY, 'a1', 'a1', ['mission'], {shift: [100, 0]});
  assert.deepEqual(keys, ['c1-mission']);
  const made = edits.frames.a1.inserts[0];
  assert.deepEqual([made.link, made.inner], ['mission', true]);
  assert.deepEqual(edits.frames.a1.moves, {'c1-mission': [100, 0]});
  edits = dup(edits, 'a1', 'a2', ['c1-mission']).edits;
  assert.deepEqual([edits.frames.a2.inserts[0].link, edits.frames.a2.inserts[0].inner], ['mission', true], 'a copy of a copy is still a copy of the original, wrapped once');
  // a whole frame duplicated: everything in it is a duplicate
  edits = addCopy(edits, {from: 'a2', after: 'a2', inherit: 'a2'}).edits;
  const frames = orderedFrames(BASE, edits), a1 = frames.find(f => f.id === 'a1');
  const parts = linkedParts({frames, edits, frame: a1, key: 'mission/0'});
  assert.deepEqual(parts.map(m => [m.frame, m.key]), [['a1', 'c1-mission/0.0.0'], ['a2', 'mission/0'], ['a2', 'c1-mission/0.0.0'], ['a2#2', 'mission/0'], ['a2#2', 'c1-mission/0.0.0']]);
  // ... and from a copy back to the original
  const back = linkedParts({frames, edits, frame: a1, key: 'c1-mission/0.0.0'});
  assert.deepEqual(back.map(m => [m.frame, m.key]).slice(0, 2), [['a1', 'mission/0'], ['a2', 'mission/0']]);
  assert.deepEqual(linkedParts({frames, edits, frame: a1, key: 'c1-mission'}), [], 'the wrapper is the copy\'s own');
  // the bubble's tail keeps pointing the same way when a duplicate lands elsewhere
  const b = dup(EMPTY, 'a1', 'a2', ['bubble'], {shift: [-30, 40]}).edits.frames.a2;
  assert.deepEqual([b.moves, b.tips], [{'c1-chat-bubble': [-30, 40]}, {'c1-chat-bubble': [-30, 40]}]);
});

test('an asset brought in gets its link with its first duplicate; pasted on another board, no link', () => {
  const html = '<div data-sb-root="i1-image" data-sb-box="image" style="left:10px"><img src="/x.png"></div>';
  let edits = {...EMPTY, library: {h: html}, frames: {a1: {inserts: [{key: 'i1-image', name: 'Image', kind: 'dom', asset: 'h', z: 20, box: {x: 10, y: 10, w: 100, h: 50}}]}}};
  const frames0 = orderedFrames(BASE, edits);
  assert.equal(linkOf(frames0[0], edits.frames.a1, 'i1-image'), null);
  edits = dup(edits, 'a1', 'a2', ['i1-image']).edits;
  assert.deepEqual([edits.frames.a1.inserts[0].link, edits.frames.a2.inserts[0].link, edits.frames.a2.inserts[0].inner], ['dup:a1:i1-image', 'dup:a1:i1-image', undefined]);
  const far = dup(EMPTY, 'a1', 'l1', ['mission'], {linked: false, source: null}).edits;
  assert.equal(far.frames.l1.inserts[0].link, undefined);
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(edits))).frames.a2.inserts, edits.frames.a2.inserts, 'links survive a save and a load');
});

test('Make unique takes an asset out of its duplicates, both ways', () => {
  const edits = setUnique(EMPTY, 'a2', 'mission', true), frames = orderedFrames(BASE, edits);
  assert.deepEqual(linkedParts({frames, edits, frame: frames[0], key: 'mission/0'}), []);
  assert.deepEqual(linkedParts({frames, edits, frame: frames[1], key: 'mission/0'}), []);
  assert.equal(isEdited(edits.frames.a2), false, 'being unique is not a change of the frame');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(edits))).frames.a2.unique, ['mission']);
  const again = setUnique(edits, 'a2', 'mission', false);
  assert.equal(again.frames.a2, undefined);
  assert.equal(linkedParts({frames, edits: again, frame: frames[0], key: 'mission/0'}).length, 1);
});

test('scale and size are kept per asset, copied with it, and reset with the frame', () => {
  let edits = setScale(EMPTY, 'a1', 'mission', [1.5, 1.5]);
  edits = setSize(edits, 'a1', 'mission', [300.456, 120]);
  assert.deepEqual([edits.frames.a1.scales, edits.frames.a1.sizes], [{mission: [1.5, 1.5]}, {mission: [300.46, 120]}]);
  assert.ok(isEdited(edits.frames.a1));
  const pasted = dup(edits, 'a1', 'a2', ['mission']).edits.frames.a2;
  assert.deepEqual([pasted.scales, pasted.sizes], [{'c1-mission': [1.5, 1.5]}, {'c1-mission': [300.46, 120]}]);
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(edits))).frames.a1.scales, {mission: [1.5, 1.5]});
  assert.equal(normalizeEdits({frames: {a1: {scales: {mission: [0, -1]}, sizes: {mission: ['x', 2]}}}}).frames.a1, undefined, 'nonsense is dropped');
  assert.equal(setSize(setScale(edits, 'a1', 'mission', [1, 1]), 'a1', 'mission', null).frames.a1, undefined);
  assert.equal(resetFrame(edits, 'a1').frames.a1, undefined);
});

test('a picture brought in: fitted, in the middle or where it was dropped', () => {
  assert.deepEqual(fitImage(4000, 2000), {w: 800, h: 400});
  assert.deepEqual(fitImage(200, 100), {w: 200, h: 100}, 'never blown up');
  assert.deepEqual(fitImage(300, 3000), {w: 56, h: 560});
  assert.ok(isImage({type: 'image/png'}) && !isImage({type: 'image/svg+xml'}) && !isImage({type: 'text/plain'}) && !isImage(null));
  const made = imageInsert({url: '/storyboard/uploads/a"b.png', w: 400, h: 200, taken: new Set(['i1-image']), count: 2, at: {x: 300, y: 200}});
  const [layer] = made.inserts, html = made.library[layer.asset];
  assert.deepEqual([layer.key, layer.kind, layer.z, layer.box], ['i2-image', 'dom', 24, {x: 100, y: 100, w: 400, h: 200}]);
  assert.match(html, /^<div data-sb-root="i2-image" data-sb-box="image" style="position:absolute;left:100px;top:100px;width:400px;height:200px;z-index:24"><img src="\/storyboard\/uploads\/a&quot;b\.png"/);
  const middle = imageInsert({url: '/a.png', w: 100, h: 100}).inserts[0];
  assert.deepEqual(middle.box, {x: 750, y: 400, w: 100, h: 100});
});
