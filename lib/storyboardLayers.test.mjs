import test from 'node:test';
import assert from 'node:assert/strict';
import {addEffect, addVideoLayer, animatedGroups, cleanVideoLayer, easeKeys, fxCss, groupsOf, isInSpan, layersOf, modifiedGroups, orderVideoLayers, removeEffect, removeKeys, setAnimated, setLayerAt, setSpan, shiftKeys, spansOf, splitVideoLayer, updateVideoLayer, valueAt} from './storyboardLayers.mjs';

const TITLE = 'A video';
const withLayers = (...layers) => layers.reduce((e, l) => addVideoLayer(e, TITLE, l).edits, {frames: {}});
const keyed = {id: 'rect-1', kind: 'rect', from: 0, to: 10, keys: [{t: 1, x: 0, y: 0, opacity: 1}, {t: 3, x: 100, y: 50, opacity: 0.5}]};

test('keyframes picked together move together, by the same time', () => {
  const l = layersOf(withLayers(keyed), TITLE)[0], moved = shiftKeys(l, [{t: 1, props: null}, {t: 3, props: null}], 2);
  assert.deepEqual(moved.keys.map(k => k.t), [3, 5]);
  assert.equal(valueAt(moved, 'x', 5), 100);
});

test('a property picked alone leaves the rest of its keyframe where it was', () => {
  const l = layersOf(withLayers(keyed), TITLE)[0], moved = shiftKeys(l, [{t: 3, props: ['x', 'y']}], 1);
  assert.deepEqual(moved.keys.map(k => k.t), [1, 3, 4]);
  assert.equal(moved.keys[1].opacity, 0.5, 'the opacity stays at 3 s');
  assert.equal(moved.keys[1].x, undefined);
  assert.equal(moved.keys[2].x, 100, 'the position went to 4 s');
});

test('a keyframe moved onto another is merged into it', () => {
  const l = layersOf(withLayers(keyed), TITLE)[0], moved = shiftKeys(l, [{t: 3, props: ['opacity']}], -2);
  assert.equal(moved.keys.length, 2);
  assert.equal(moved.keys[0].opacity, 0.5, 'the one moved wins');
  assert.equal(moved.keys[0].x, 0);
});

test('keyframes picked are deleted and eased together', () => {
  const l = layersOf(withLayers(keyed), TITLE)[0];
  assert.deepEqual(removeKeys(l, [{t: 1, props: null}]).keys.map(k => k.t), [3]);
  assert.deepEqual(removeKeys(l, [{t: 3, props: ['opacity']}]).keys[1], {t: 3, x: 100, y: 50});
  assert.deepEqual(easeKeys(l, [1, 3], 'hold').keys.map(k => k.ease), ['hold', 'hold']);
});

test('a layer split at the playhead is two layers, the second just above the first', () => {
  const edits = withLayers({id: 'rect-1', kind: 'rect', from: 2, to: 8}, {id: 'text-1', kind: 'text', from: 0, to: 4});
  const {edits: next, id} = splitVideoLayer(edits, TITLE, 'rect-1', 5);
  const items = layersOf(next, TITLE);
  assert.equal(id, 'rect-2');
  assert.deepEqual(items.map(l => [l.id, l.from, l.to]), [['rect-1', 2, 5], ['rect-2', 5, 8], ['text-1', 0, 4]]);
  assert.equal(splitVideoLayer(edits, TITLE, 'rect-1', 2).id, null, 'not at its very start');
});

test('the stacking is set at once, a layer not named staying in front', () => {
  const edits = withLayers({id: 'a', kind: 'rect'}, {id: 'b', kind: 'rect'}, {id: 'c', kind: 'rect'});
  assert.deepEqual(layersOf(orderVideoLayers(edits, TITLE, ['c', 'a', 'b']), TITLE).map(l => l.id), ['c', 'a', 'b']);
  assert.deepEqual(layersOf(orderVideoLayers(edits, TITLE, ['b', 'a']), TITLE).map(l => l.id), ['b', 'a', 'c']);
});

// ---- effects, blend, label, trimmed elements (the user, 2026-10-28) ----
test('an effect is added with its defaults, its numbers can be keyframed like the transform numbers', () => {
  const base = layersOf(withLayers({id: 'rect-1', kind: 'rect', from: 0, to: 10}), TITLE)[0], {layer, id} = addEffect(base, 'blur');
  assert.equal(id, 'blur-1');
  assert.equal(fxCss(layer, 1), 'blur(8px)');
  const animated = setAnimated(layer, 'fx:blur-1:radius', 0, true), keyed = setLayerAt(animated, 4, {'fx:blur-1:radius': 40});
  assert.equal(valueAt(keyed, 'fx:blur-1:radius', 2), 24, 'half way, eased in and out');
  assert.equal(fxCss(keyed, 4), 'blur(40px)');
  assert.equal(addEffect(layer, 'blur').id, 'blur-2', 'a second one has its own id');
});

test('an effect taken off takes its keyframes with it; a keyframe of an effect that is not there is dropped', () => {
  const base = layersOf(withLayers({id: 'rect-1', kind: 'rect', from: 0, to: 10}), TITLE)[0];
  const keyed = setLayerAt(setAnimated(addEffect(base, 'glow').layer, 'fx:glow-1:radius', 1, true), 3, {'fx:glow-1:radius': 60});
  assert.equal(keyed.keys.length, 2);
  assert.equal(removeEffect(keyed, 'glow-1').keys.length, 0);
  const raw = cleanVideoLayer({...base, keys: [{t: 1, 'fx:ghost-1:radius': 5}, {t: 2, x: 10}]});
  assert.deepEqual(raw.keys, [{t: 2, x: 10}]);
});

test('the effects of a layer are cleaned: a known type, a number held to its range, a blend mode and a label that exist', () => {
  const l = cleanVideoLayer({id: 'a', kind: 'rect', blend: 'multiply', label: 99, fx: [{type: 'blur', params: {radius: 9999}}, {type: 'nope'}, {type: 'shadow', color: 'red'}]});
  assert.equal(l.blend, 'multiply');
  assert.equal(l.label, 16);
  assert.deepEqual(l.fx.map(e => e.type), ['blur', 'shadow']);
  assert.equal(l.fx[0].params.radius, 300);
  assert.equal(l.fx[1].params.opacity, 55, 'a number left out is the default');
  assert.equal(cleanVideoLayer({id: 'b', kind: 'rect', blend: 'normal'}).blend, undefined);
});

test('U shows the groups with a keyframe, UU those changed too', () => {
  const base = layersOf(withLayers({id: 'rect-1', kind: 'rect', from: 0, to: 10, rotation: 20}), TITLE)[0];
  const l = setAnimated(addEffect(base, 'sepia').layer, 'opacity', 1, true);
  assert.deepEqual(animatedGroups(l), ['opacity']);
  assert.deepEqual(modifiedGroups(l).sort(), ['fx:sepia-1', 'opacity', 'rotation']);
  assert.deepEqual(groupsOf(l).map(g => g.id), ['position', 'size', 'rotation', 'opacity', 'fx:sepia-1']);
});

test('an element of the slides is trimmed by a window that survives a change of the layers', () => {
  const edits = setSpan(withLayers({id: 'rect-1', kind: 'rect'}), TITLE, 'Tablet', {from: 4, to: 9});
  assert.deepEqual(spansOf(edits, TITLE), {Tablet: {from: 4, to: 9}});
  const next = updateVideoLayer(edits, TITLE, 'rect-1', {name: 'Box'});
  assert.deepEqual(spansOf(next, TITLE), {Tablet: {from: 4, to: 9}}, 'a layer changed leaves the windows');
  assert.equal(isInSpan(spansOf(next, TITLE).Tablet, 3), false);
  assert.equal(isInSpan(spansOf(next, TITLE).Tablet, 4), true);
  assert.equal(isInSpan({to: 5}, 100), false);
  assert.deepEqual(spansOf(setSpan(next, TITLE, 'Tablet', null), TITLE), {}, 'null gives it the whole video back');
});
