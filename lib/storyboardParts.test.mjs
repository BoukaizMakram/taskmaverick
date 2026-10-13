import test from 'node:test';
import assert from 'node:assert/strict';
import {CATEGORIES, SYNTHETIC, groupParts, hashString, partHtml, partInsert, partList, searchParts, sizeLabel, sizeOf, slimParts} from './storyboardParts.mjs';
import {EMPTY, addInserts, layersOf} from './storyboardEdits.mjs';

const part = (id, name, category, extra = {}) => ({id, name, category, keywords: '', html: `<div class="x-${id}">${name}</div>`, w: 340, h: 700, k: 1, ctx: null, ...extra});
const catalog = {
  'tablet-board': part('tablet-board', 'Tablet board', 'Boards', {keywords: 'team columns', w: 860, h: 600}),
  'phone-board': part('phone-board', 'Phone board', 'Boards', {keywords: 'mobile', w: 360, h: 770}),
  'task-mission': part('task-mission', 'Task mission', 'Missions', {keywords: 'card chip', w: 360, h: 104}),
  'checklist-details': part('checklist-details', 'Checklist details', 'Mission details', {keywords: 'opened mission'}),
  'knowledge-base': part('knowledge-base', 'Knowledge base', 'Screens', {w: 383, h: 766, k: 0.95, ctx: {stageClass: 'ad-stage iq-stage iq2-stage', scene: {id: 'knowledge', view: 'knowledge'}}}),
  odd: part('odd', 'Not a category', 'Nope'),
};

test('the pieces are grouped by category, in the categories\' order, with the made ones last', () => {
  const list = partList(catalog);
  assert.ok(!list.some(p => p.id === 'odd'), 'a piece without a known category is not offered');
  const groups = groupParts(list);
  assert.deepEqual(groups.map(g => g.category), ['Missions', 'Mission details', 'Boards', 'Screens', 'Annotations']);
  assert.deepEqual(groups.find(g => g.category === 'Boards').items.map(p => p.name), ['Tablet board', 'Phone board'], 'in the order they were captured');
  assert.deepEqual(groups.at(-1).items.map(p => p.name), SYNTHETIC.map(p => p.name));
  assert.deepEqual(groupParts(partList(null)).map(g => g.category), ['Annotations'], 'with nothing captured, only the made ones');
  assert.deepEqual(CATEGORIES.slice(0, 3), ['Missions', 'Mission details', 'Boards']);
});

test('search finds a piece by its name, its category, or what it is also called', () => {
  const list = partList(catalog);
  assert.deepEqual(searchParts('', list), list);
  assert.equal(searchParts('tablet', list)[0].name, 'Tablet board');
  assert.deepEqual(searchParts('board', list).map(p => p.name).slice(0, 2), ['Tablet board', 'Phone board']);
  assert.ok(searchParts('mobile', list).some(p => p.name === 'Phone board'), 'a keyword');
  assert.ok(searchParts('chip', list).some(p => p.name === 'Task mission'), 'a keyword');
  assert.ok(searchParts('boards', list).some(p => p.name === 'Phone board'), 'the category, plural or not');
  assert.equal(searchParts('cursor', list)[0].name, 'Hand');
  assert.deepEqual(searchParts('mission details', list)[0].name, 'Checklist details', 'every word has to match');
  assert.deepEqual(searchParts('zzz', list), []);
});

test('choosing a captured piece adds just that piece, in the middle, at its size', () => {
  const made = partInsert({id: 'phone-board', catalog});
  const layer = made.inserts[0], html = made.library[layer.asset];
  assert.equal(made.inserts.length, 1);
  assert.equal(layer.name, 'Phone board');
  assert.ok(html.includes(`data-sb-root="${layer.key}"`) && html.includes('class="x-phone-board"'));
  assert.ok(html.includes('width:360px;height:770px'), 'the size it has in the product');
  assert.deepEqual([layer.box.w, layer.box.h], [360, 770]);
  assert.ok(Math.abs(layer.box.x + layer.box.w / 2 - 800) <= 1 && Math.abs(layer.box.y + layer.box.h / 2 - 450) <= 1, 'in the middle');
  assert.ok(!html.includes('ad-stage'), 'a piece from the gallery page needs no stage around it');
});

test('a device is cropped to what it draws, and sits in the middle by that', () => {
  const board = {...catalog['tablet-board'], w: 860, h: 896, crop: {x: 0, y: 0, w: 860, h: 600}};
  assert.deepEqual(sizeOf(board), {w: 860, h: 600});
  const html = partHtml(board, 'k', 10, 20);
  assert.match(html, /width:860px;height:600px;overflow:hidden;transform:scale\(1\)/, 'the box is the device');
  assert.match(html, /left:0px;top:0px;width:860px;height:896px/, 'the whole piece inside it, shifted by the crop');
  const moved = partHtml({...board, crop: {x: 30, y: 40, w: 800, h: 560}}, 'k', 0, 0);
  assert.match(moved, /left:-30px;top:-40px/);
  const made = partInsert({id: 'tablet-board', catalog: {'tablet-board': board}});
  assert.deepEqual([made.inserts[0].box.w, made.inserts[0].box.h], [860, 600]);
  assert.ok(Math.abs(made.inserts[0].box.y + 300 - 450) <= 1, 'centred by the device, not by the piece');
});

test('a page that only shows the pieces gets them without their HTML, with the size they have in a frame', () => {
  const slim = slimParts(catalog);
  assert.deepEqual(Object.keys(slim), Object.keys(catalog));
  assert.ok(Object.values(slim).every(p => !('html' in p) && !('ctx' in p)), 'no HTML, no stage');
  assert.deepEqual(slim['phone-board'], {id: 'phone-board', name: 'Phone board', category: 'Boards', keywords: 'mobile', w: 360, h: 770, k: 1});
  assert.deepEqual(groupParts(partList(slim)).map(g => g.category), groupParts(partList(catalog)).map(g => g.category), 'it lists and groups the same');
  assert.equal(sizeLabel(slim['phone-board']), '360 × 770');
  assert.equal(sizeLabel(slim['knowledge-base']), '364 × 728', 'at the scale it is drawn');
  assert.equal(sizeLabel({...catalog['tablet-board'], crop: {x: 0, y: 0, w: 860, h: 500}}), '860 × 500', 'a device is its own size');
  assert.deepEqual(slimParts(null), {});
});

test('a piece taken from a video keeps its stage around it, at the scale it had', () => {
  const html = partHtml(catalog['knowledge-base'], 'k', 10, 20);
  assert.match(html, /class="ad-stage iq-stage iq2-stage" data-scene="knowledge" data-view="knowledge" data-sb-wrap/);
  assert.match(html, /transform:scale\(0\.95\)/);
  assert.deepEqual(sizeOf(catalog['knowledge-base']), {w: 364, h: 728});
});

test('the hand, the speech bubble and the spotlight are made', () => {
  const hand = partInsert({id: 'hand', catalog: null}), bubble = partInsert({id: 'speech-bubble', catalog: null}), spot = partInsert({id: 'spotlight', catalog: null});
  assert.match(hand.library[hand.inserts[0].asset], /class="dh-hand".*demo-hand\.png/);
  assert.equal(bubble.inserts[0].kind, 'bubble');
  assert.ok(Array.isArray(bubble.inserts[0].tip), 'a speech bubble has a tail to move');
  assert.match(bubble.library[bubble.inserts[0].asset], /cb-caption.*Your words here/);
  assert.match(spot.library[spot.inserts[0].asset], /class="iq2-mark"/);
  assert.equal(partInsert({id: 'not-there', catalog}), null);
});

test('bringing the same thing in again gets a new key, and lands a little lower', () => {
  const first = partInsert({id: 'task-mission', catalog});
  const second = partInsert({id: 'task-mission', catalog, taken: new Set(first.inserts.map(l => l.key)), count: 1});
  assert.notEqual(first.inserts[0].key, second.inserts[0].key);
  assert.ok(second.inserts[0].box.y > first.inserts[0].box.y && second.inserts[0].box.x > first.inserts[0].box.x);
  assert.ok(second.inserts[0].z > first.inserts[0].z && first.inserts[0].z > 12, 'brought in above the things already in the frame, each above the one before');
  assert.match(second.library[second.inserts[0].asset], new RegExp(`z-index:${second.inserts[0].z}`));
  assert.equal(hashString('a'), hashString('a'));
  assert.notEqual(hashString('a'), hashString('b'));
});

test('what is brought in is added to the frame like any asset, with its HTML in the library', () => {
  const made = partInsert({id: 'tablet-board', catalog});
  const edits = addInserts(EMPTY, 'a/1', made.inserts, made.library);
  const frame = {id: 'a/1', layers: [{key: 'mission', kind: 'dom', asset: 'h'}]};
  assert.deepEqual(layersOf(frame, edits.frames['a/1']).map(l => l.key), ['mission', made.inserts[0].key]);
  assert.ok(edits.library[made.inserts[0].asset]);
});
