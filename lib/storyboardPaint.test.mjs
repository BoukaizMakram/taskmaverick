import test from 'node:test';
import assert from 'node:assert/strict';
import {PAINT_PRESETS, TEXTURES, addStop, firstColor, gradientFrom, isGradient, normalizePaint, paintCss, removeStop, samePaint, setStop, solidFrom} from './storyboardPaint.mjs';

test('a plain color is a string; only real colors are kept', () => {
  assert.equal(normalizePaint('#1271B7'), '#1271b7');
  assert.equal(normalizePaint('rgb(10, 20, 30)'), 'rgb(10, 20, 30)');
  assert.equal(normalizePaint('transparent'), 'transparent');
  for (const bad of ['red', 'url(x)', '', null, undefined, 5, '#12', 'javascript:1', 'red;background:url(x)']) assert.equal(normalizePaint(bad), null, String(bad));
});

test('a gradient keeps 2 to 8 good stops in order, an angle in range', () => {
  const p = normalizePaint({kind: 'linear', angle: -45, stops: [{color: '#fff', at: 100}, {color: '#000000', at: 0}, {color: 'nope', at: 50}]});
  assert.deepEqual(p, {kind: 'linear', angle: 315, stops: [{color: '#000000', at: 0}, {color: '#fff', at: 100}]});
  assert.equal(normalizePaint({kind: 'linear', stops: [{color: '#fff', at: 0}]}), null, 'one stop is not a gradient');
  assert.equal(normalizePaint({kind: 'conic', stops: [{color: '#fff'}, {color: '#000'}]}), null);
  assert.equal(normalizePaint({kind: 'radial', stops: Array.from({length: 12}, () => ({color: '#fff', at: 1}))}).stops.length, 8);
  assert.deepEqual(normalizePaint({kind: 'radial', stops: [{color: '#fff', at: -20}, {color: '#000', at: 400}]}).stops.map(s => s.at), [0, 100], 'positions are kept in range');
  assert.deepEqual(normalizePaint({kind: 'linear', stops: [{color: '#fff'}, {color: '#000'}, {color: '#f00'}]}).stops.map(s => s.at), [0, 50, 100], 'no positions: spread evenly');
  const two = [{color: '#fff', at: 0}, {color: '#000', at: 1}];
  assert.equal(normalizePaint({kind: 'linear', angle: 90, texture: 'nope', stops: two}).texture, undefined, 'only the known surfaces');
  assert.equal(normalizePaint({kind: 'linear', angle: 90, texture: '__proto__', stops: two}).texture, undefined);
  assert.equal(normalizePaint({kind: 'linear', angle: 90, texture: 'grain', stops: two}).texture, 'grain');
  assert.equal(normalizePaint({kind: 'linear', angle: 90, brushed: true, stops: two}).texture, 'brushed', 'saved before as brushed: true');
  assert.equal('brushed' in normalizePaint({kind: 'linear', angle: 90, brushed: true, stops: two}), false);
});

test('CSS: a color as is, a gradient as a gradient, brushed metal with its grain on top', () => {
  assert.equal(paintCss('#ABCDEF'), '#abcdef');
  assert.equal(paintCss(null), '');
  assert.equal(paintCss({kind: 'linear', angle: 90, stops: [{color: '#ff0000', at: 0}, {color: '#0000ff', at: 100}]}), 'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)');
  assert.match(paintCss({kind: 'radial', stops: [{color: '#fff', at: 0}, {color: '#000', at: 100}]}), /^radial-gradient\(circle at 50% 42%, #fff 0%, #000 100%\)$/);
  const metal = paintCss(PAINT_PRESETS.find(p => p.id === 'metal-plate').paint);
  assert.match(metal, /^repeating-linear-gradient\(90deg.*\), linear-gradient\(135deg, #8e959c 0%/);
  assert.ok(!/[;{}]|url\(/.test(metal), 'never more than a background value');
});

test('every preset is a good paint, and the iPad glass then the metal plate come first', () => {
  assert.deepEqual(PAINT_PRESETS.slice(0, 4).map(p => p.id), ['ipad-glass', 'ipad-glass-gray', 'black', 'metal-plate']);
  assert.equal(normalizePaint(PAINT_PRESETS[2].paint).flat, true, 'the black has no rim light');
  assert.equal(normalizePaint(PAINT_PRESETS[0].paint).edge, true, 'the glass has the polished edge');
  assert.equal(normalizePaint({kind: 'linear', angle: 0, edge: 'yes', stops: [{color: '#000', at: 0}, {color: '#fff', at: 100}]}).edge, undefined);
  assert.equal(new Set(PAINT_PRESETS.map(p => p.id)).size, PAINT_PRESETS.length);
  for (const {paint, name} of PAINT_PRESETS) { assert.ok(normalizePaint(paint), name); assert.ok(paintCss(paint), name); assert.equal(samePaint(paint, normalizePaint(paint)), true, name); }
  assert.equal(PAINT_PRESETS.find(p => p.id === 'metal-plate').paint.texture, 'brushed');
  assert.ok(PAINT_PRESETS.every(p => typeof p.paint === 'object'), 'no plain colors among them');
  assert.ok(PAINT_PRESETS.length >= 18, 'a good many metals');
  assert.ok(PAINT_PRESETS.slice(0, 18).every(p => p.paint.texture || /^(chrome|ipad|black)/.test(p.id)), 'the metals come first, each a gradient with a texture');
  for (const t of Object.keys(TEXTURES)) assert.ok(PAINT_PRESETS.some(p => p.paint.texture === t), `a preset with ${t}`);
  for (const t of Object.values(TEXTURES)) assert.ok(t.css.length > 20 && !/[;{}]/.test(t.css), t.name);
});

test('switching between a color and a gradient keeps the color', () => {
  const g = gradientFrom('#ff8800', 'linear');
  assert.equal(isGradient(g), true); assert.equal(g.stops[0].color, '#ff8800'); assert.equal(g.angle, 135);
  const r = gradientFrom(g, 'radial');
  assert.equal(r.kind, 'radial'); assert.equal(r.stops[0].color, '#ff8800'); assert.equal('angle' in r, false);
  assert.equal(gradientFrom(r, 'linear').angle, 135);
  assert.equal(solidFrom(g), '#ff8800'); assert.equal(solidFrom('#123456'), '#123456'); assert.equal(solidFrom(null), '#ffffff');
  assert.equal(firstColor(g), '#ff8800'); assert.equal(firstColor('#abc'), '#abc'); assert.equal(firstColor(null), null);
  assert.equal(gradientFrom('transparent').stops[0].color, '#1271b7');
});

test('stops can be changed, added and taken out (two stay)', () => {
  let g = normalizePaint({kind: 'linear', angle: 0, stops: [{color: '#000000', at: 0}, {color: '#ffffff', at: 100}]});
  g = setStop(g, 0, {color: '#ff0000'});
  assert.equal(g.stops[0].color, '#ff0000');
  g = setStop(g, 1, {at: 60});
  assert.equal(g.stops[1].at, 60);
  g = addStop(g);
  assert.equal(g.stops.length, 3);
  assert.deepEqual(g.stops.map(s => s.at), [0, 30, 60], 'in the widest gap, halfway');
  g = removeStop(g, 1);
  assert.equal(g.stops.length, 2);
  assert.equal(removeStop(g, 0), g, 'two stay');
  assert.equal(setStop('#fff', 0, {color: '#000'}), '#fff', 'a color has no stops');
  assert.equal(setStop(g, 9, {color: '#000'}), g);
});
