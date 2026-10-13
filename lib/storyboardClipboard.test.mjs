import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY, addInserts, layersOf, normalizeEdits, orderedFrames, setMove, setNote, setText, setTip} from './storyboardEdits.mjs';
import {CLIP_MARK, copyFrames, copyLayers, copyPicks, isClip, layerKeyOf, pasteFrames, pasteLayers, standsAlone} from './storyboardClipboard.mjs';

const ASSETS = {
  a1: '<div class="iq2-mission" data-sb-root="mission"><p>Opening Quality Check</p><span>Anna F</span></div>',
  a2: '<div class="cb-caption" data-sb-root="bubble"><p aria-label="Hi"><span>Hi</span></p></div>',
  a3: '<div class="dh-hand" data-sb-root="hand"></div>',
};
const frame = (id, chapter = 'alerts') => ({id, chapter, label: 'Words', stageClass: 'ad-stage iq2-stage', scene: {id: chapter, view: 'mission'}, layers: [
  {key: 'mission', name: 'Mission', kind: 'dom', asset: 'a1', box: {x: 480, y: 20, w: 420, h: 700}},
  {key: 'bubble', name: 'Chat bubble', kind: 'bubble', asset: 'a2', box: {x: 950, y: 200, w: 260, h: 80}, style: 'yellow', tip: [900, 240]},
  {key: 'hand', name: 'Hand', kind: 'dom', asset: 'a3', box: {x: 880, y: 230, w: 42, h: 52}},
]});
const htmlOf = edits => hash => edits.library[hash] ?? ASSETS[hash];
const stage = {className: 'ad-stage iq2-stage', style: '--iq-caption-size: 27px;'};

test('an edit key belongs to its asset', () => {
  assert.deepEqual(['mission', 'mission/1.2', 'mission#0', 'mission/0#2'].map(layerKeyOf), ['mission', 'mission', 'mission', 'mission']);
});

test('copy: the picked assets in the frame\'s order, with their own changes only', () => {
  let edits = setMove(EMPTY, 'f1', 'mission', [10, 5]);
  edits = setMove(edits, 'f1', 'mission/1', [3, 0]);
  edits = setText(edits, 'f1', 'mission/0', 'Closing Check');
  edits = setText(edits, 'f1', 'hand#0', 'x');
  edits = setTip(edits, 'f1', 'bubble', [-20, 4]);
  const clip = copyLayers({frame: frame('f1'), edit: edits.frames.f1, keys: ['bubble', 'mission/1'], htmlOf: htmlOf(edits), stage, video: 'improved-quality-v2'});
  assert.ok(isClip(clip));
  assert.deepEqual([clip.mark, clip.kind, clip.from], [CLIP_MARK, 'layers', 'f1']);
  assert.deepEqual(clip.items.map(i => i.key), ['mission', 'bubble'], 'a part of an asset copies the whole asset');
  const [mission, bubble] = clip.items;
  assert.deepEqual(mission.moves, {'': [10, 5], '/1': [3, 0]});
  assert.deepEqual(mission.texts, {'/0': 'Closing Check'});
  assert.deepEqual([bubble.tipMove, bubble.tip, bubble.style], [[-20, 4], [900, 240], 'yellow']);
  assert.deepEqual(mission.ctx, {stageClass: 'ad-stage iq2-stage', style: '--iq-caption-size: 27px;', scene: 'alerts', view: 'mission'});
  assert.equal(mission.asset, undefined, 'it carries its HTML, not a hash of this board');
  assert.ok(!isClip({mark: 'x'}) && !isClip(null) && !isClip({mark: CLIP_MARK, kind: 'layers', items: []}));
});

test('copy: assets picked in several frames are one clip; only the first frame keeps its links', () => {
  const edits = setMove(EMPTY, 'f2', 'hand', [7, 7]);
  const clip = copyPicks({groups: [{frame: frame('f1'), edit: edits.frames.f1, keys: ['mission']}, {frame: frame('f2', 'links'), edit: edits.frames.f2, keys: ['hand', 'bubble']}], htmlOf: htmlOf(edits), stage, video: 'improved-quality-v2'});
  assert.ok(isClip(clip));
  assert.deepEqual([clip.kind, clip.from], ['layers', 'f1']);
  assert.deepEqual(clip.items.map(i => i.key), ['mission', 'bubble', 'hand'], 'each frame in its own order, one after the other');
  assert.deepEqual(clip.items.map(i => i.link), ['mission', null, null], 'a chat bubble is never linked, and the other frames\' assets are plain copies');
  assert.deepEqual(clip.items.find(i => i.key === 'hand').moves, {'': [7, 7]}, 'each keeps its own changes');
  // it pastes like any clip
  const target = frame('f3', 'links');
  assert.equal(pasteLayers(edits, target, clip.items).keys.length, 3);
});

test('paste into another frame: new keys, same place, its changes kept; a captured asset keeps its stage around it', () => {
  let edits = setMove(EMPTY, 'f1', 'mission', [10, 5]);
  edits = setText(edits, 'f1', 'mission/0', 'Closing Check');
  edits = setTip(edits, 'f1', 'bubble', [-20, 4]);
  const clip = copyLayers({frame: frame('f1'), edit: edits.frames.f1, keys: ['mission', 'bubble'], htmlOf: htmlOf(edits), stage});
  const target = frame('f2', 'links');
  const {edits: out, keys} = pasteLayers(edits, target, clip.items);
  assert.deepEqual(keys, ['c1-mission', 'c1-chat-bubble']);
  const rec = out.frames.f2, [m, b] = rec.inserts;
  assert.deepEqual([m.kind, b.kind, b.style, b.tip], ['dom', 'bubble', 'yellow', [900, 240]]);
  const html = out.library[m.asset];
  assert.match(html, /^<div data-sb-root="c1-mission" style="position:absolute;left:480px;top:20px;width:420px;height:700px;z-index:20">/);
  assert.match(html, /class="ad-stage iq2-stage" data-scene="alerts" data-view="mission" data-sb-wrap/);
  assert.ok(html.includes('--iq-caption-size: 27px;position:absolute;left:-480px;top:-20px;width:1600px;height:900px'));
  assert.ok(html.includes('data-sb-was=""') && !html.includes('data-sb-root="mission"'), 'one root only');
  assert.ok(out.library[b.asset].includes('data-sb-root="c1-chat-bubble"') && !out.library[b.asset].includes('data-sb-wrap'), 'a bubble is not wrapped');
  assert.deepEqual([b.z, /^<div class="cb-caption" data-sb-root="c1-chat-bubble" style="z-index:23">/.test(out.library[b.asset])], [22, true], 'its words sit just above its shape');
  assert.deepEqual(rec.moves, {'c1-mission': [10, 5]});
  assert.deepEqual(rec.texts, {'c1-mission/0.0.0': 'Closing Check'}, 'its own HTML sits two levels in');
  assert.deepEqual(rec.tips, {'c1-chat-bubble': [-20, 4]});
  assert.deepEqual(layersOf(target, rec).map(l => l.key), ['mission', 'bubble', 'hand', 'c1-mission', 'c1-chat-bubble']);
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(out))).frames.f2.inserts, rec.inserts, 'what is pasted survives a save and a load');
});

test('paste into the same frame: a little down and right; pasting again never reuses a key', () => {
  const clip = copyLayers({frame: frame('f1'), edit: undefined, keys: ['hand'], htmlOf: htmlOf(EMPTY), stage});
  const one = pasteLayers(EMPTY, frame('f1'), clip.items, {nudge: true});
  assert.deepEqual(one.edits.frames.f1.moves, {'c1-hand': [24, 24]});
  const two = pasteLayers(one.edits, frame('f1'), clip.items, {nudge: true});
  assert.deepEqual(two.keys, ['c2-hand']);
  assert.deepEqual(two.edits.frames.f1.inserts.map(l => l.z), [20, 22], 'each later one above the one before');
  // a pasted asset copied again is not wrapped twice
  const again = copyLayers({frame: frame('f1'), edit: two.edits.frames.f1, keys: ['c2-hand'], htmlOf: htmlOf(two.edits), stage});
  assert.equal(again.items[0].insert, true);
  const three = pasteLayers(two.edits, frame('f3'), again.items);
  const html = three.edits.library[three.edits.frames.f3.inserts[0].asset];
  assert.equal(html.split('data-sb-wrap').length - 1, 1);
  assert.ok(html.includes('data-sb-root="c1-hand"'));
  assert.deepEqual(three.edits.frames.f3.moves, {'c1-hand': [24, 24]}, 'where it was, it stays');
  assert.deepEqual(pasteLayers(EMPTY, frame('f1'), []).keys, []);
});

test('frames: on their own board they are duplicated, on another board they arrive as blank frames with everything in them', () => {
  const base = [frame('f1'), frame('f2')];
  let edits = setNote(setMove(EMPTY, 'f1', 'hand', [5, 5]), 'f1', 'Slower here');
  const clip = copyFrames({frames: [base[0]], edits, htmlOf: htmlOf(edits), stage, video: 'improved-quality-v2'});
  assert.deepEqual([clip.kind, clip.items.length, clip.items[0].layers.length, clip.items[0].note], ['frames', 1, 3, 'Slower here']);
  // same board: a copy, right after the frame it was pasted after
  const same = pasteFrames(edits, clip.items, {after: 'f2', known: id => base.some(f => f.id === id)});
  assert.deepEqual(same.ids, ['f1#2']);
  assert.deepEqual(orderedFrames(base, same.edits).map(f => f.id), ['f1', 'f2', 'f1#2']);
  assert.deepEqual(same.edits.frames['f1#2'].moves, {hand: [5, 5]});
  // another board: blank frames, in order, each after the one before
  const other = [{id: 'g1', chapter: 'points', label: 'Start', scene: {}, layers: []}];
  const two = copyFrames({frames: base, edits, htmlOf: htmlOf(edits), stage});
  const far = pasteFrames(EMPTY, two.items, {after: 'g1'});
  assert.deepEqual(far.ids, ['blank-1', 'blank-2']);
  const order = orderedFrames(other, far.edits);
  assert.deepEqual(order.map(f => f.id), ['g1', 'blank-1', 'blank-2']);
  assert.deepEqual(far.edits.frames['blank-1'].inserts.map(l => l.key), ['c1-mission', 'c1-chat-bubble', 'c1-hand']);
  assert.equal(far.edits.frames['blank-1'].note, 'Slower here');
  assert.deepEqual(far.edits.frames['blank-1'].moves, {'c1-hand': [5, 5]});
  assert.equal(far.edits.frames['blank-2'].note, undefined);
});

test('an asset brought in with Shift+A copies like any other', () => {
  const html = '<div data-sb-root="p1-alert" style="left:10px"><div data-sb-wrap>Alert</div></div>';
  const edits = addInserts(EMPTY, 'f1', [{key: 'p1-alert', name: 'Alert', kind: 'dom', asset: 'h1', z: 20, box: {x: 10, y: 10, w: 300, h: 60}}], {h1: html});
  const clip = copyLayers({frame: frame('f1'), edit: edits.frames.f1, keys: ['p1-alert'], htmlOf: htmlOf(edits), stage});
  const out = pasteLayers(edits, frame('f2'), clip.items);
  assert.equal(out.edits.library[out.edits.frames.f2.inserts[0].asset], html.replace('p1-alert', 'c1-alert').replace('left:10px', 'left:10px;z-index:20'));
});

test('a yellow outline (a box of its own) is pasted as it is: the copy stretches from its sides like the original', () => {
  const mark = '<span class="iq2-mark" aria-hidden="true" style="opacity: 1; transform: translate(893.64px, 348.986px); width: 179.167px; height: 43.8978px;" data-sb-root="circle"></span>';
  const f = {id: 'f1', chapter: 'timestamp', label: 'Words', stageClass: 'ad-stage iq2-stage', scene: {id: 'timestamp', view: 'web'}, layers: [{key: 'circle', name: 'Yellow outline', kind: 'dom', asset: 'm1', box: {x: 893.64, y: 348.99, w: 179.16, h: 43.89}}]};
  let edits = setMove(EMPTY, 'f1', 'circle', [44.88, -11.11]);
  edits = {...edits, frames: {...edits.frames, f1: {...edits.frames.f1, sizes: {circle: [197.02, 47.05]}}}};
  const clip = copyLayers({frame: f, edit: edits.frames.f1, keys: ['circle'], htmlOf: hash => ({m1: mark})[hash], stage});
  assert.ok(standsAlone(clip.items[0]) && !standsAlone({html: ASSETS.a1}));
  const {edits: out, keys} = pasteLayers(edits, f, clip.items, {shift: [0, 350], linked: true, source: 'f1'});
  const html = out.library[out.frames.f1.inserts.find(l => l.key === keys[0]).asset];
  assert.ok(html.startsWith('<span class="iq2-mark"') && html.includes(`data-sb-root="${keys[0]}"`) && !html.includes('data-sb-wrap'), 'not wrapped: its root is still the outline');
  assert.equal(out.frames.f1.inserts.find(l => l.key === keys[0]).inner, undefined);
  assert.deepEqual(out.frames.f1.sizes[keys[0]], [197.02, 47.05], 'the same size as the original');
  assert.deepEqual(out.frames.f1.moves[keys[0]], [44.88, 338.89], 'where it was dropped');
});
