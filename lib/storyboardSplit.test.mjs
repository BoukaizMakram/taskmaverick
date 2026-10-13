import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY, layersOf, lockOf} from './storyboardEdits.mjs';
import {SPLIT, applyFrame, areaOf, centerOf, fitLine, isOverlay, isTitle, place, sizeOf, unionOf} from './storyboardSplit.mjs';

const design = {
  background: {kind: 'linear', angle: 135, stops: [{color: '#4f4f57', at: 0}, {color: '#454547', at: 100}]},
  plate: {box: {x: -1.69, y: -2.25, w: 1601.69, h: 904.35}, fill: {kind: 'linear', angle: 135, stops: [{color: '#656a73', at: 0}, {color: '#9ea4b0', at: 100}]}},
  panel: {box: {x: 1042.61, y: 0, w: 559.08, h: 904.35}, fill: {kind: 'linear', angle: 135, stops: [{color: '#404245', at: 0}, {color: '#444547', at: 100}]}},
  slot: {x: 45, y: 46, w: 1128, h: 808}, plateCenterX: 515.5,
  text: {center: {x: 1370.3, y: 450}, styles: {strokeWidth: 0, fill: 'transparent', stroke: '#ffffff', color: '#ffffff', font: 'caveat', size: 34.99}},
  title: {styles: {font: 'caveat', color: '#ffffff', weight: 600}},
  bezel: {kind: 'linear', stops: [{color: '#000000', at: 0}, {color: '#000000', at: 100}], angle: 0, flat: true}, screenScale: 1.03,
};
const art = (l, t, w, h) => ({l, t, r: l + w, b: t + h});
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);

test('boxes: size, center, area, union', () => {
  const a = art(10, 20, 100, 50), b = art(50, 0, 100, 40);
  assert.deepEqual(sizeOf(a), {w: 100, h: 50});
  assert.deepEqual(centerOf(a), {x: 60, y: 45});
  assert.equal(areaOf(a), 5000);
  assert.deepEqual(unionOf([a, null, b]), {l: 10, t: 0, r: 150, b: 70});
  assert.equal(unionOf([null]), null);
});

test('layers over the art, and titles, are known by their names', () => {
  for (const name of ['Hand', 'Click ripple', 'Yellow outline', 'Highlight', 'Names', 'Dates', 'Rectangle', 'Chat bubble', 'Video timeline']) assert.ok(isOverlay(name), name);
  for (const name of ['Tablet', 'Mission', 'Team board', 'Report', 'Lifted mission', 'Board', 'Mission cards', 'Isolated missions', 'Layer', 'Title']) assert.ok(!isOverlay(name), name);
  assert.ok(isTitle('Title') && !isTitle('Titles'));
});

test('a tablet the size of the slot stays as big as it is and goes to the model\'s place', () => {
  const fits = fitLine([{id: 'a', art: art(68, 85, 1128, 808)}, {id: 'b', art: art(277, 85, 1128, 808)}], design);
  for (const id of ['a', 'b']) {
    close(fits[id].s, 1);
    const at = place(fits[id], centerOf(id === 'a' ? art(68, 85, 1128, 808) : art(277, 85, 1128, 808)));
    close(at.x, 45 + 564); close(at.y, 450);
  }
});

test('art narrower than the slot is centered on the plate; art too big is scaled down to fit', () => {
  const narrow = fitLine([{id: 'm', art: art(358, 20, 540, 860)}], design).m;
  close(narrow.s, 808 / 860);
  close(narrow.to.x, 515.5); close(narrow.to.y, 450);
  const wide = fitLine([{id: 'r', art: art(-54, 10, 1254, 876)}], design).r;
  close(wide.s, Math.min(1128 / 1254, 808 / 876));
  const edge = place(wide, {x: -54 + 1254, y: 450});
  assert.ok(edge.x <= 45 + 1128 + 1e-6, 'its right edge is inside the slot');
});

test('one scale for the whole line: the smallest that fits every full frame', () => {
  const fits = fitLine([{id: 'a', art: art(0, 0, 540, 813)}, {id: 'b', art: art(0, 0, 540, 860)}], design);
  close(fits.a.s, 808 / 860); close(fits.b.s, 808 / 860);
});

test('small art is not blown up past the limit', () => {
  const fit = fitLine([{id: 'c', art: art(0, 0, 100, 60)}], design).c;
  assert.equal(fit.s, SPLIT.maxUp);
});

test('a partial frame (a card still alone) is placed as the next full frame; frames with no art have no fit', () => {
  const frames = [{id: 'start', art: art(358, 121, 581, 138)}, {id: 'mark', art: art(275, 113, 685, 672)}, {id: 'words', art: art(275, 113, 685, 672)}, {id: 'title', art: null}];
  const fits = fitLine(frames, design);
  assert.deepEqual(fits.start, fits.mark);
  assert.equal(fits.title, null);
  const last = fitLine([{id: 'full', art: art(0, 0, 500, 630)}, {id: 'lone', art: art(0, 0, 500, 100)}], design);
  assert.deepEqual(last.lone, last.full, 'no full frame after it: the one before');
});

const frame = {id: 'x/1', layers: [{key: 'tablet', name: 'Tablet', kind: 'dom', asset: 'a1', box: {x: 0, y: 0, w: 1220, h: 850}}, {key: 'bubble', name: 'Chat bubble', kind: 'bubble', asset: 'a2', box: {x: 1280, y: 57, w: 249, h: 114}, style: 'yellow'}]};
const plan = {
  plate: true,
  roots: [{key: 'tablet', translate: [19.5, 3.25], scale: null, size: null}],
  bubble: {key: 'bubble', translate: [-29.7, 335.94], size: [300, 0]},
  tablets: {roots: ['tablet'], screens: ['tablet/0.0'], tabs: [{key: 'tablet/0.1', size: 15.67}], chips: ['tablet/0.2', 'tablet/0.3']},
};

test('a frame takes the model: background, plate at the back, art placed, words as the model\'s, iPad, headers, chips', () => {
  const e = applyFrame(EMPTY, frame, plan, design), r = e.frames['x/1'];
  assert.deepEqual(r.background, design.background);
  const layers = layersOf(frame, r);
  assert.equal(layers[0].name, 'Plate', 'the light plate is at the very back');
  assert.equal(layers[1].name, 'Panel', 'the dark panel just over it');
  assert.equal(layers.length, 4);
  assert.deepEqual(r.styles[layers[1].key].fill, design.panel.fill);
  assert.ok(e.library[layers[1].asset].includes('left:1042.61px') && e.library[layers[1].asset].includes('width:1601.69px'), 'one size: as wide as the plate, over the right side');
  assert.deepEqual(r.sizes.plate, undefined);
  assert.deepEqual(r.styles[layers[0].key].fill, design.plate.fill);
  assert.deepEqual(r.moves.tablet, [19.5, 3.25]);
  assert.deepEqual(r.styles.bubble, {...design.text.styles});
  assert.equal(r.bubbles.bubble.tail, false);
  assert.deepEqual(r.moves.bubble, [-29.7, 335.94]);
  assert.deepEqual(r.sizes.bubble, [300, 0]);
  assert.deepEqual(r.styles.tablet.bezel, design.bezel);
  assert.deepEqual(r.scales['tablet/0.0'], [1.03, 1.03], 'the screen a bit bigger: a thinner frame');
  assert.equal(r.styles['tablet/0.1'].size, 15.67);
  assert.equal(r.styles['tablet/0.2'].shadow, true);
  const html = e.library[layers[0].asset];
  assert.ok(html.includes('left:-1.69px') && html.includes('width:1601.69px') && html.includes('height:904.35px'));
});

test('applying it again changes nothing more (one plate, headers not grown twice)', () => {
  const once = applyFrame(EMPTY, frame, plan, design), twice = applyFrame(once, frame, plan, design);
  const strip = r => JSON.parse(JSON.stringify({...r, updatedAt: null}));
  assert.deepEqual(strip(twice.frames['x/1']), strip(once.frames['x/1']));
  assert.equal(Object.keys(twice.library).length, Object.keys(once.library).length);
  assert.equal(layersOf(frame, twice.frames['x/1']).filter(l => l.name === 'Plate').length, 1);
  assert.equal(layersOf(frame, twice.frames['x/1']).filter(l => l.name === 'Panel').length, 1);
});

test('an old plate (a big rectangle with a gradient) is replaced, not left under the new one', () => {
  const old = {...EMPTY, frames: {'x/1': {
    inserts: [{key: 'r2-rectangle', name: 'Rectangle', kind: 'dom', asset: 'old', z: 24, box: {x: 1259, y: -12, w: 6, h: 16}}],
    sizes: {'r2-rectangle': [1269.87, 958.91]}, moves: {'r2-rectangle': [-1497.68, -17.45]}, styles: {'r2-rectangle': {fill: design.plate.fill}}, updatedAt: 'x'}}, library: {old: '<div data-sb-root="r2-rectangle"></div>'}};
  const e = applyFrame(old, frame, {...plan}, design), r = e.frames['x/1'];
  const names = layersOf(frame, r).map(l => l.name);
  assert.deepEqual(names.filter(n => /rectangle|plate|panel/i.test(n)), ['Plate', 'Panel']);
  assert.equal(r.moves['r2-rectangle'], undefined);
  assert.equal(r.sizes['r2-rectangle'], undefined);
  assert.equal(e.library.old, undefined, 'its HTML is dropped with it');
});

test('a frame of only words: the model\'s background, no plate, the title in the model\'s handwriting', () => {
  const words = {id: 'w/1', layers: [{key: 'title', name: 'Title', kind: 'dom', asset: 't1', box: {x: 0, y: 0, w: 1600, h: 900}}]};
  const e = applyFrame(EMPTY, words, {plate: false, roots: [], title: [{key: 'title', size: 60}]}, design), r = e.frames['w/1'];
  assert.deepEqual(r.background, design.background);
  assert.equal(r.inserts, undefined);
  assert.deepEqual(r.styles.title, {font: 'caveat', color: '#ffffff', weight: 600, size: 60});
});

test('the model\'s chat box is not locked', () => {
  const e = applyFrame(EMPTY, frame, plan, design);
  assert.deepEqual(lockOf(e, 'x/1', 'bubble'), {w: false, h: false});
});

test('a slide of only words can have the same two layers, the panel over the whole slide', () => {
  const words = {id: 'w/2', layers: [{key: 'title', name: 'Title', kind: 'dom', asset: 't1', box: {x: 0, y: 0, w: 1600, h: 900}}]};
  const e = applyFrame(EMPTY, words, {plate: false, titleBackdrop: true, roots: [], title: [{key: 'title', size: 60}]}, design), r = e.frames['w/2'];
  const layers = layersOf(words, r);
  assert.deepEqual(layers.map(l => l.name), ['Plate', 'Panel', 'Title']);
  assert.ok(e.library[layers[1].asset].includes('left:-1.69px') && e.library[layers[1].asset].includes('width:1601.69px'), 'the panel covers the whole slide');
});

test('the dark panel keeps its size and only moves: right, over the whole slide, or off the right edge', () => {
  const at = plan2 => { const e = applyFrame(EMPTY, frame, {...plan, ...plan2}, design); const l = layersOf(frame, e.frames['x/1'])[1]; const html = e.library[l.asset]; return [Number(/left:(-?[\d.]+)px/.exec(html)[1]), Number(/width:([\d.]+)px/.exec(html)[1])]; };
  assert.deepEqual(at({}), [1042.61, 1601.69]);
  assert.deepEqual(at({panel: 'away'}), [1600, 1601.69]);
  assert.deepEqual(at({panel: 'full'}), [-1.69, 1601.69]);
});
