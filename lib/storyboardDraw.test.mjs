import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY, addInserts, normalizeEdits, orderedFrames, setInsertHtml} from './storyboardEdits.mjs';
import {copyLayers, pasteLayers} from './storyboardClipboard.mjs';
import {linkOf, linkedParts} from './storyboardLinks.mjs';
import {PEN, hexToHsv, hsvToHex, inkOf, normalizeHex, pathOf, restyleInk, strokeInsert, thin, wheelAt, wheelPoint} from './storyboardDraw.mjs';
import {hashString} from './storyboardParts.mjs';

test('colors: any way a color is written becomes #rrggbb; hue, saturation and value go there and back', () => {
  assert.deepEqual(['#abc', 'AABBCC', 'rgb(255, 236, 0)', 'rgba(18 113 183 / 0.5)', 'rgb(0,0,0)'].map(normalizeHex), ['#aabbcc', '#aabbcc', '#ffec00', '#1271b7', '#000000']);
  assert.deepEqual(['', 'red', '#12', null].map(normalizeHex), [null, null, null, null]);
  for (const hex of ['#ff3b30', '#ffec00', '#1271b7', '#007a33', '#111111', '#ffffff', '#000000', '#8a2be2']) assert.equal(hsvToHex(hexToHsv(hex)), hex, hex);
  assert.deepEqual(hexToHsv('#ff0000'), {h: 0, s: 1, v: 1});
  assert.deepEqual([hexToHsv('#00ff00').h, hexToHsv('#0000ff').h, hexToHsv('#808080').s], [120, 240, 0]);
  assert.equal(hsvToHex({h: 60, s: 1, v: 1}), '#ffff00');
  assert.equal(hsvToHex({h: 420, s: 1, v: 1}), '#ffff00', 'the hue goes round');
});

test('the wheel: hue around it, saturation from the middle to the rim', () => {
  assert.deepEqual(wheelAt(50, 0, 50), {h: 0, s: 1});
  assert.deepEqual([Math.round(wheelAt(0, 25, 50).h), wheelAt(0, 25, 50).s], [90, 0.5]);
  assert.equal(wheelAt(-400, 0, 50).s, 1, 'past the rim is the rim');
  const p = wheelPoint({h: 180, s: 0.5}, 60);
  assert.ok(Math.abs(p.x + 30) < 1e-9 && Math.abs(p.y) < 1e-9);
  const back = wheelAt(p.x, p.y, 60);
  assert.ok(Math.abs(back.h - 180) < 1e-9 && Math.abs(back.s - 0.5) < 1e-9);
});

test('a stroke: thinned, smoothed, in a box of its own on the frame', () => {
  const dense = Array.from({length: 50}, (_, i) => ({x: 100 + i * 0.5, y: 200}));
  assert.ok(thin(dense).length < 15 && thin(dense).at(-1) === dense.at(-1), 'the last point is kept');
  assert.equal(pathOf([{x: 1, y: 2}]), 'M1 2l0.01 0');
  assert.equal(pathOf([{x: 0, y: 0}, {x: 10, y: 0}]), 'M0 0L10 0');
  assert.equal(pathOf([{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}]), 'M0 0Q10 0 10 5L10 10');
  const made = strokeInsert({points: [{x: 100, y: 200}, {x: 180, y: 240}, {x: 260, y: 200}], color: 'rgb(255, 236, 0)', width: 8, taken: new Set(['d1-drawing']), count: 3});
  const [layer] = made.inserts, html = made.library[layer.asset];
  assert.deepEqual([layer.key, layer.kind, layer.name, layer.z, layer.box], ['d2-drawing', 'dom', 'Drawing', 26, {x: 94, y: 194, w: 172, h: 52}]);
  assert.match(html, /^<div data-sb-root="d2-drawing" data-sb-box="drawing" style="position:absolute;left:94px;top:194px;width:172px;height:52px;z-index:26;pointer-events:none">/);
  assert.match(html, /<path data-ink="" d="M6 6Q86 46 126 26L166 6" fill="none" stroke="#ffec00" stroke-width="8"/);
  assert.deepEqual(inkOf(html), {color: '#ffec00', width: 8});
  assert.equal(strokeInsert({points: []}), null);
  assert.deepEqual(strokeInsert({points: [{x: 5, y: 5}]}).inserts[0].box, {x: 0, y: 0, w: 10, h: 10}, 'a click is a dot');
  assert.equal(inkOf(strokeInsert({points: [{x: 5, y: 5}]}).library[strokeInsert({points: [{x: 5, y: 5}]}).inserts[0].asset]).color, PEN.color);
});

test('a drawing takes another color or width, and survives a save', () => {
  const made = strokeInsert({points: [{x: 0, y: 0}, {x: 50, y: 50}], color: '#111111', width: 6});
  let edits = addInserts(EMPTY, 'f1', made.inserts, made.library);
  const key = made.inserts[0].key, html = restyleInk(made.library[made.inserts[0].asset], {color: '#1271b7', width: 12});
  assert.deepEqual(inkOf(html), {color: '#1271b7', width: 12});
  assert.match(html, /stroke="transparent" stroke-width="24"/);
  assert.equal(restyleInk('<div>no ink</div>', {color: '#fff'}), '<div>no ink</div>');
  assert.deepEqual(inkOf(restyleInk(html, {width: 999})), {color: '#1271b7', width: 40}, 'a width within bounds');
  edits = setInsertHtml(edits, 'f1', key, html, hashString(html));
  assert.deepEqual([edits.frames.f1.inserts[0].asset, Object.keys(edits.library)], [hashString(html), [hashString(html)]], 'the old HTML is dropped');
  assert.equal(setInsertHtml(edits, 'f1', 'nope', html, 'h'), edits);
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(edits))).frames.f1.inserts, edits.frames.f1.inserts);
});

test('a chat bubble is always unique: never linked, in a capture or as a copy', () => {
  const frame = id => ({id, chapter: 'alerts', label: 'Words', scene: {}, layers: [
    {key: 'mission', name: 'Mission', kind: 'dom', asset: 'm', box: {x: 0, y: 0, w: 10, h: 10}},
    {key: 'bubble', name: 'Chat bubble', kind: 'bubble', asset: 'b', box: {x: 0, y: 0, w: 10, h: 10}, style: 'yellow', tip: [1, 1]},
  ]});
  const base = [frame('a1'), frame('a2')], html = {m: '<div data-sb-root="mission">M</div>', b: '<div data-sb-root="bubble"><p aria-label="Hi"><span>Hi</span></p></div>'};
  assert.equal(linkOf(base[0], undefined, 'bubble'), null);
  assert.deepEqual(linkedParts({frames: base, edits: EMPTY, frame: base[0], key: 'bubble/0'}), []);
  assert.equal(linkedParts({frames: base, edits: EMPTY, frame: base[0], key: 'mission'}).length, 1, 'the mission still is linked');
  const clip = copyLayers({frame: base[0], edit: undefined, keys: ['bubble', 'mission'], htmlOf: hash => html[hash]});
  assert.deepEqual(clip.items.map(i => i.link), ['mission', null]);
  const {edits} = pasteLayers(EMPTY, base[1], clip.items, {linked: true, source: 'a1'});
  assert.deepEqual(edits.frames.a2.inserts.map(l => l.link), ['mission', undefined]);
  const frames = orderedFrames(base, edits);
  assert.equal(linkOf(frames[1], edits.frames.a2, 'c1-chat-bubble'), null);
});
