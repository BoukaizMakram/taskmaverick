import test from 'node:test';
import assert from 'node:assert/strict';
import {chainSegments, deletePoints, hitPath, insertPoint, parsePolylineD, pathMarkup, refitPath, reversePoints, setSmooth, stagePoints} from './storyboardPaths.mjs';
import {cleanVideoLayer, valueAt} from './storyboardLayers.mjs';

const near = (a, b, tol = 0.1) => assert.ok(Math.abs(a - b) <= tol, `${a} is not near ${b}`);
const line = (extra = {}) => cleanVideoLayer({id: 'path-1', kind: 'path', from: 0, to: 5, points: [{x: 100, y: 100}, {x: 300, y: 100}], ...extra});

test('a path given with points on the picture gets a frame that fits them', () => {
  const l = line();
  assert.equal(l.kind, 'path');
  assert.deepEqual([l.x, l.y, l.w, l.h], [100, 100, 200, 1]);
  assert.deepEqual(l.points.map(p => [p.x, p.y]), [[0, 0], [200, 0]]);
  assert.equal(l.trimStart, 0);
  assert.equal(l.trimEnd, 1);
  assert.equal(cleanVideoLayer({id: 'x', kind: 'path', points: [{x: 1, y: 1}]}), null, 'one point is no path');
});

test('the trim of a path is animated like the other properties', () => {
  const l = line({keys: [{t: 0.5, trimEnd: 0}, {t: 2, trimEnd: 1}]});
  assert.equal(l.keys.length, 2);
  assert.equal(valueAt(l, 'trimEnd', 0), 0);
  near(valueAt(l, 'trimEnd', 1.25), 0.5, 0.001);
  assert.equal(valueAt(l, 'trimEnd', 3), 1);
});

test('lines that meet are chained into trails, one stopping where three meet', () => {
  // the rating's connector: out, the bracket, two ticks (the first on the middle of the bracket)
  const trails = chainSegments([[[0, 1], [23, 1], 'out'], [[22, 0], [22, 300], 'bracket'], [[22, 100], [47, 100], 'tick#0'], [[22, 300], [47, 300], 'tick#1']], 4);
  assert.equal(trails.length, 3);
  assert.deepEqual([...new Set(trails.flatMap(t => t.ids))].sort(), ['bracket', 'out', 'tick#0', 'tick#1']);
  assert.ok(trails.some(t => t.pts.length === 3 && Math.abs(t.pts[0][0]) < 1), 'one starts at the mission');
});

test('the corners of an svg path made of lines are read; a curve is not', () => {
  assert.deepEqual(parsePolylineD('M10 20 L30 20 L30 60'), [{pts: [[10, 20], [30, 20], [30, 60]], closed: false}]);
  assert.deepEqual(parsePolylineD('m10 20 l20 0 v40'), [{pts: [[10, 20], [30, 20], [30, 60]], closed: false}]);
  assert.equal(parsePolylineD('M0 0 C 1 1 2 2 3 3'), null);
});

test('a point added on a curve leaves the curve as it was', () => {
  const pts = [{x: 0, y: 0, ox: 0, oy: 100, smooth: true}, {x: 100, y: 0, ix: 0, iy: 100, smooth: true}];
  const {points, index} = insertPoint(pts, false, 0, 0.5);
  assert.equal(points.length, 3);
  assert.equal(index, 1);
  near(points[1].x, 50, 0.02);
  near(points[1].y, 75, 0.02); // (the middle of the curve: 3/4 of the way of its handles)
  assert.equal(insertPoint([{x: 0, y: 0}, {x: 100, y: 40}], false, 0, 0.5).points[1].y, 20, 'on a straight line: half way');
});

test('points taken out leave the rest; fewer than two is no path', () => {
  const pts = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 20, y: 0}];
  assert.deepEqual(deletePoints(pts, [1]).map(p => p.x), [0, 20]);
  assert.equal(deletePoints(pts, [0, 1]), null);
});

test('a point made smooth gets handles along the line, a corner loses them; reversed, a path swaps its handles', () => {
  const pts = [{x: 0, y: 0}, {x: 100, y: 0}, {x: 200, y: 0}];
  const smooth = setSmooth(pts, false, 1, true);
  assert.equal(smooth[1].smooth, true);
  near(smooth[1].ox, 100 / 3, 0.02);
  assert.equal(smooth[1].oy, 0);
  assert.equal(setSmooth(smooth, false, 1, false)[1].ox, undefined);
  const back = reversePoints([{x: 0, y: 0, ox: 5, oy: 6}, {x: 9, y: 9}]);
  assert.deepEqual(back[1], {x: 0, y: 0, ix: 5, iy: 6});
  assert.deepEqual(back[0], {x: 9, y: 9});
});

test('a path refitted after a point moved stays where it is on the picture, turned or not', () => {
  for (const rotation of [0, 30]) {
    const l = line({rotation}), moved = {...l, points: l.points.map((p, i) => (i ? {...p, x: p.x + 20, y: p.y + 80} : p))};
    const before = stagePoints(moved), after = stagePoints(refitPath(moved));
    before.forEach((p, i) => { near(p.x, after[i].x); near(p.y, after[i].y); });
  }
});

test('a path is hit on its line, not in the box round it', () => {
  const l = line({points: [{x: 100, y: 100}, {x: 300, y: 100}, {x: 300, y: 300}]});
  assert.equal(hitPath(l, l, 200, 102), true);
  assert.equal(hitPath(l, l, 300, 250), true);
  assert.equal(hitPath(l, l, 150, 250), false, 'inside the box, far from the line');
});

test('a path is drawn: its line, its ends, nothing when it is trimmed away', () => {
  const l = line({endCap: 'triangle', stroke: '#7b3cf0', strokeWidth: 4});
  const full = pathMarkup(l, {w: l.w, h: l.h, trimStart: 0, trimEnd: 1});
  assert.ok(full.includes('stroke="#7b3cf0"') && full.includes('Z'), 'a line and a solid head');
  assert.equal(pathMarkup(l, {w: l.w, h: l.h, trimStart: 0, trimEnd: 0}), '');
  assert.ok(pathMarkup(l, {w: l.w, h: l.h, trimStart: 0, trimEnd: 0.5}).includes('<path'), 'half of it');
});
