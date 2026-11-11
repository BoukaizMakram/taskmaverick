import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY, addCopy, applyAlongRow, isEdited, normalizeEdits, orderedFrames, resetFrame, setMove, setScale, setSize, setText} from './storyboardEdits.mjs';
import {copyLayers, pasteLayers} from './storyboardClipboard.mjs';
import {linkOf, linkedLayers, splitKey} from './storyboardLinks.mjs';
import {fitImage, imageInsert, isImage} from './storyboardImages.mjs';

// Nothing in the storyboard is linked (the user, 2026-11-09): a copy is a thing of its own, a text is retyped in its
// frame alone; "the same piece" along a row (the captured asset with the same key) is only for Apply to all in this row.
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
  return pasteLayers(edits, dst, clip.items, options);
};

test('keys: an asset, a part of it, a piece of text', () => {
  assert.deepEqual(['mission', 'mission/1.2', 'mission#0', 'mission/1#2'].map(splitKey), [{layer: 'mission', rest: ''}, {layer: 'mission', rest: '/1.2'}, {layer: 'mission', rest: '#0'}, {layer: 'mission', rest: '/1#2'}]);
});

test('the same captured asset is the same piece along its row (for Apply to all), not across rows', () => {
  const frames = orderedFrames(BASE, EMPTY);
  assert.deepEqual(linkOf(frames[0], undefined, 'mission'), {id: 'mission'});
  assert.deepEqual(linkedLayers(frames.filter(f => f.chapter === 'alerts'), EMPTY, 'mission').map(m => m.frame), ['a1', 'a2']);
  assert.deepEqual(linkedLayers(frames.filter(f => f.chapter === 'links'), EMPTY, 'mission').map(m => m.frame), ['l1']);
});

test('a copy (Alt+drag, paste, in a duplicated frame) is never linked; its words are the ones it was copied with', () => {
  // slide 5 says 123, slide 4 says 234; 123 is copied to slide 4: there it says 123
  let edits = setText(EMPTY, 'a2', 'mission/0', '123');
  edits = setText(edits, 'a1', 'mission/0', '234');
  edits = dup(edits, 'a2', 'a1', ['mission']).edits;
  const made = edits.frames.a1.inserts[0];
  assert.equal(made.key, 'c1-mission');
  assert.equal(made.link, undefined);
  assert.equal(made.inner, true);
  assert.equal(edits.frames.a1.texts['c1-mission/0.0.0'], '123');
  assert.equal(edits.frames.a1.texts['mission/0'], '234', 'what slide 4 had stays');
  assert.equal(edits.frames.a2.texts['mission/0'], '123', 'what it came from is untouched');
  const frames = orderedFrames(BASE, edits);
  assert.equal(linkOf(frames[0], edits.frames.a1, 'c1-mission'), null, 'the copy is its frame own');
  assert.deepEqual(linkedLayers(frames.filter(f => f.chapter === 'alerts'), edits, 'mission').map(m => [m.frame, m.key]), [['a1', 'mission'], ['a2', 'mission']], 'the copy is not one of the row');
  // a whole frame duplicated: a snapshot, its own from then on
  edits = addCopy(edits, {from: 'a2', after: 'a2', inherit: 'a2'}).edits;
  assert.equal(edits.frames['a2#2'].texts['mission/0'], '123');
  // the bubble's tail keeps pointing the same way when a duplicate lands elsewhere
  const b = dup(EMPTY, 'a1', 'a2', ['bubble'], {shift: [-30, 40]}).edits.frames.a2;
  assert.deepEqual([b.moves, b.tips], [{'c1-chat-bubble': [-30, 40]}, {'c1-chat-bubble': [-30, 40]}]);
});

test('an older file: a pasted copy with a link, and assets made unique, are each their own', () => {
  const html = '<div data-sb-root="i1-image" data-sb-box="image" style="left:10px"><img src="/x.png"></div>';
  const edits = normalizeEdits({library: {h: html}, frames: {a1: {unique: ['mission'], inserts: [{key: 'c1-mission', name: 'Mission', kind: 'dom', asset: 'h', z: 20, link: 'mission', inner: true, box: {x: 10, y: 10, w: 100, h: 50}}]}}});
  assert.equal(edits.frames.a1.inserts[0].link, undefined, 'the old link is dropped when the file is loaded');
  const frames = orderedFrames(BASE, edits);
  assert.equal(linkOf(frames[0], {inserts: [{key: 'c1-mission', link: 'mission'}]}, 'c1-mission'), null, 'and ignored if it is there');
  assert.deepEqual(linkedLayers(frames.filter(f => f.chapter === 'alerts'), edits, 'mission').map(m => m.frame), ['a1', 'a2'], 'made unique: still the same piece for Apply to all');
  const clip = copyLayers({frame: frames[0], edit: {inserts: [{...edits.frames.a1.inserts[0], link: 'mission'}]}, keys: ['c1-mission'], htmlOf: htmlOf(edits)});
  assert.equal(clip.items[0].link, undefined, 'the old link is not carried');
});

test('Apply to all in this row carries the place, never the words', () => {
  let edits = setText(EMPTY, 'a1', 'mission/0', 'One');
  edits = setText(edits, 'a2', 'mission/0', 'Two');
  edits = setMove(edits, 'a1', 'mission', [10, 5]);
  const out = applyAlongRow(edits, 'a1', 'mission', [{frame: 'a2', key: 'mission'}]);
  assert.deepEqual(out.frames.a2.moves, {mission: [10, 5]});
  assert.equal(out.frames.a2.texts['mission/0'], 'Two');
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
