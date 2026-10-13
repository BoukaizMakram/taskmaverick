import test from 'node:test';
import assert from 'node:assert/strict';
import {MIN_ZOOM, MAX_ZOOM, ZOOM_NOTCH, FRAME, clampZoom, toScreen, toWorld, zoomAt, panBy, fitRect, wheelAction, stepZoom, glideZoom, viewBetween, visibleWorld, intersects, layoutFrames, layoutGaps, gapAt, dropTarget, lineDropIndex, LAYOUT, keepView, restoreView, parseView, viewKey} from './storyboardView.mjs';

test('a carried line changes places once it is halfway over its neighbour', () => {
  assert.equal(lineDropIndex(1000, 3, 0), 0);
  assert.equal(lineDropIndex(1000, 3, 1000), 1);
  assert.equal(lineDropIndex(1000, 3, 1400), 1);
  assert.equal(lineDropIndex(1000, 3, 1600), 2);
  assert.equal(lineDropIndex(1000, 3, -800), 0, 'above the first');
  assert.equal(lineDropIndex(1000, 3, 9000), 3, 'below the last');
});

const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ~ ${b}`);

test('screen and world points convert both ways', () => {
  const view = {x: 120, y: -40, zoom: 0.5};
  const p = {x: 800, y: 300};
  const s = toScreen(view, p);
  assert.deepEqual(s, {x: 520, y: 110});
  assert.deepEqual(toWorld(view, s), p);
});

test('zooming keeps the point under the pointer where it is', () => {
  const view = {x: 50, y: 20, zoom: 0.4}, at = {x: 600, y: 350};
  const before = toWorld(view, at);
  for (const zoom of [0.1, 1, 3]) {
    const next = zoomAt(view, zoom, at);
    near(next.zoom, zoom);
    const after = toWorld(next, at);
    near(after.x, before.x); near(after.y, before.y);
  }
});

test('zoom never leaves its range', () => {
  assert.equal(clampZoom(0.0001), MIN_ZOOM);
  assert.equal(clampZoom(1000), MAX_ZOOM);
  assert.equal(zoomAt({x: 0, y: 0, zoom: 1}, 9999, {x: 0, y: 0}).zoom, MAX_ZOOM);
});

test('the wheel pans, Ctrl or ⌘ zooms (a pinch is a Ctrl wheel), Shift pans sideways', () => {
  assert.deepEqual(wheelAction({deltaX: 10, deltaY: 30}), {type: 'pan', dx: -10, dy: -30});
  assert.deepEqual(wheelAction({deltaX: 0, deltaY: 40, shiftKey: true}), {type: 'pan', dx: -40, dy: 0});
  const out = wheelAction({deltaX: 0, deltaY: 100, ctrlKey: true}), inn = wheelAction({deltaX: 0, deltaY: -100, metaKey: true});
  assert.equal(out.type, 'zoom'); assert.ok(out.factor < 1 && inn.factor > 1);
  assert.deepEqual(wheelAction({deltaX: 0, deltaY: 3, deltaMode: 1}), {type: 'pan', dx: -0, dy: -48});
});

test('a wheel notch zooms by a fifth and glides; a pinch follows the fingers in small steps', () => {
  const notch = wheelAction({deltaX: 0, deltaY: -100, ctrlKey: true});
  assert.equal(notch.glide, true); near(notch.factor, ZOOM_NOTCH);
  near(wheelAction({deltaX: 0, deltaY: 100, ctrlKey: true}).factor, 1 / ZOOM_NOTCH);
  near(wheelAction({deltaX: 0, deltaY: -3, deltaMode: 1, ctrlKey: true}).factor, ZOOM_NOTCH, 1e-9);
  near(wheelAction({deltaX: 0, deltaY: -300, ctrlKey: true}).factor, ZOOM_NOTCH ** 3, 1e-9);
  const pinch = wheelAction({deltaX: 0, deltaY: -2.5, ctrlKey: true});
  assert.equal(pinch.glide, false); assert.ok(pinch.factor > 1 && pinch.factor < 1.05);
});

test('a zoom glides to its target around the pointer, and lands on it', () => {
  let view = {x: 0, y: 0, zoom: 0.5}, steps = 0, done = false;
  const at = {x: 300, y: 200}, under = toWorld(view, at);
  while (!done && steps < 100) { ({view, done} = glideZoom(view, 1, at, 16)); steps++; }
  assert.ok(done && steps < 40, `${steps} steps`);
  assert.equal(view.zoom, 1);
  const still = toWorld(view, at); near(still.x, under.x, 1e-6); near(still.y, under.y, 1e-6);
  const half = viewBetween({x: 0, y: 0, zoom: 0.25}, {x: -500, y: 0, zoom: 1}, 0.5, {w: 1000, h: 800});
  near(half.zoom, 0.5);
  assert.deepEqual(viewBetween({x: 0, y: 0, zoom: 0.25}, {x: -500, y: 0, zoom: 1}, 1, {w: 1000, h: 800}), {x: -500, y: 0, zoom: 1});
});

test('zoom steps walk through the presets, up and down, a fifth or so at a time', () => {
  assert.equal(stepZoom(1, 1), 1.25);
  assert.equal(stepZoom(1, -1), 0.75);
  assert.equal(stepZoom(0.3, 1), 0.4);
  assert.equal(stepZoom(0.3, -1), 0.25);
  assert.equal(stepZoom(MAX_ZOOM, 1), MAX_ZOOM);
});

test('fitting a rectangle centers it and keeps its padding', () => {
  const size = {w: 1200, h: 800}, rect = {x: 1000, y: 500, w: 4000, h: 2000};
  const view = fitRect(rect, size, {padding: 100});
  const a = toScreen(view, {x: rect.x, y: rect.y}), b = toScreen(view, {x: rect.x + rect.w, y: rect.y + rect.h});
  assert.ok(a.x >= 100 - 1e-6 && a.y >= 100 - 1e-6 && b.x <= 1100 + 1e-6 && b.y <= 700 + 1e-6);
  near((a.x + b.x) / 2, 600); near((a.y + b.y) / 2, 400);
  assert.equal(fitRect({x: 0, y: 0, w: 100, h: 50}, size).zoom, 1, 'a small box is not blown up');
});

test('the visible part of the world, and what meets it', () => {
  const view = {x: -1000, y: -500, zoom: 0.5}, size = {w: 800, h: 600};
  assert.deepEqual(visibleWorld(view, size), {x: 2000, y: 1000, w: 1600, h: 1200});
  assert.ok(intersects(visibleWorld(view, size), {x: 3500, y: 1100, w: 1600, h: 900}));
  assert.ok(!intersects(visibleWorld(view, size), {x: 0, y: 0, w: 1600, h: 900}));
  assert.equal(panBy({x: 1, y: 2, zoom: 3}, 10, -5).x, 11);
});

test('the board has a row per chapter, frames left to right, nothing overlapping', () => {
  const chapters = [{id: 'a'}, {id: 'b'}, {id: 'c'}];
  const frames = [{id: 'a/1', chapter: 'a'}, {id: 'a/2', chapter: 'a'}, {id: 'b/1', chapter: 'b'}, {id: 'c/1', chapter: 'c'}, {id: 'c/2', chapter: 'c'}, {id: 'c/3', chapter: 'c'}];
  const {frames: at, rows, bounds} = layoutFrames(frames, chapters);
  assert.equal(rows.length, 3);
  assert.ok(at['a/2'].x > at['a/1'].x + FRAME.w, 'a gap between frames');
  assert.equal(at['a/1'].y, at['a/2'].y);
  assert.deepEqual([at['a/1'].index, at['a/2'].index, at['b/1'].index, at['c/1'].index, at['c/3'].index], [1, 2, 1, 1, 3], 'every row counts from 1');
  assert.ok(at['b/1'].y > at['a/1'].y + FRAME.h, 'the next chapter is further down');
  const boxes = frames.map(f => ({x: at[f.id].x, y: at[f.id].y, w: FRAME.w, h: FRAME.h}));
  boxes.forEach((p, i) => boxes.slice(i + 1).forEach(q => assert.ok(!intersects(p, q))));
  boxes.forEach(b => assert.ok(b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h));
});

test('between every two frames, and after the last one of a row, there is a gap to add a frame in', () => {
  const frames = [{id: 'a/1', chapter: 'a'}, {id: 'a/2', chapter: 'a'}, {id: 'b/1', chapter: 'b'}];
  const {frames: at} = layoutFrames(frames, [{id: 'a'}, {id: 'b'}]);
  const gaps = layoutGaps(frames, at);
  assert.deepEqual(gaps.map(g => g.after), ['a/1', 'a/2', 'b/1']);
  const first = gaps[0], middle = {x: first.x + first.w / 2, y: first.artTop + 100};
  assert.equal(gapAt(gaps, middle, 1)?.after, 'a/1', 'in the middle of the gap');
  assert.equal(gapAt(gaps, {x: at['a/1'].x + 300, y: at['a/1'].y + 300}, 1), null, 'on the frame itself: no gap');
  assert.equal(gapAt(gaps, {x: first.x + first.w / 2, y: first.y - 50}, 1), null, 'above the row');
  assert.equal(gapAt(gaps, {x: gaps[1].x + gaps[1].w + 20, y: gaps[1].artTop + 50}, 1), null, 'past the end of the row, well beyond the gap');
  // zoomed out the gap grows toward the frames beside it, but never far into them
  const edge = {x: first.x - 12, y: first.artTop + 50};
  assert.equal(gapAt(gaps, edge, 1), null);
  assert.equal(gapAt(gaps, edge, 0.2)?.after, 'a/1');
  assert.equal(gapAt(gaps, {x: first.x - 100, y: first.artTop + 50}, 0.1), null);
  assert.ok(LAYOUT.gapX > 0);
});

test('a row with no frames is still a row, so something can be dropped into it', () => {
  const board = layoutFrames([{id: 'a/1', chapter: 'a'}], [{id: 'a'}, {id: 'b'}]);
  assert.equal(board.rows.length, 2);
  assert.ok(board.rows[1].y > board.rows[0].y);
});

test('a dropped frame goes in the row it is over, at the place its middle is at', () => {
  const chapters = [{id: 'a'}, {id: 'b'}, {id: 'c'}];
  const frames = [{id: 'a/1', chapter: 'a'}, {id: 'a/2', chapter: 'a'}, {id: 'a/3', chapter: 'a'}, {id: 'b/1', chapter: 'b'}];
  const board = layoutFrames(frames, chapters);
  const middle = id => board.frames[id].x + FRAME.w / 2, rowY = i => board.rows[i].y + 400;
  assert.deepEqual(dropTarget(board, frames, {x: middle('a/1') - 100, y: rowY(0)}), {chapter: 'a', index: 0});
  assert.deepEqual(dropTarget(board, frames, {x: middle('a/1') + 100, y: rowY(0)}), {chapter: 'a', index: 1});
  assert.deepEqual(dropTarget(board, frames, {x: middle('a/3') + 100, y: rowY(0)}), {chapter: 'a', index: 3}, 'past the last one: at the end');
  assert.deepEqual(dropTarget(board, frames, {x: middle('a/2') + 50, y: rowY(1)}), {chapter: 'b', index: 1}, 'another row');
  assert.deepEqual(dropTarget(board, frames, {x: 5000, y: rowY(2)}), {chapter: 'c', index: 0}, 'an empty row');
  assert.equal(dropTarget(board, frames, {x: 0, y: -4000}).chapter, 'a', 'above everything: the first row');
  assert.equal(dropTarget(board, frames, {x: 0, y: 99999}).chapter, 'c', 'below everything: the last row');
  assert.equal(dropTarget({rows: []}, [], {x: 0, y: 0}), null);
});

test('a board opens where it was looked at: the middle of the window and the zoom are kept, for a window of any size', () => {
  const view = {x: -4000, y: -1500, zoom: 0.5}, size = {w: 1600, h: 900};
  const kept = keepView(view, size);
  assert.deepEqual(kept, {cx: 9600, cy: 3900, zoom: 0.5});
  assert.deepEqual(restoreView(kept, size), view, 'the same window: the same view');
  const other = restoreView(kept, {w: 1000, h: 600});
  assert.deepEqual(toWorld(other, {x: 500, y: 300}), {x: 9600, y: 3900}, 'another window: the same place is in its middle');
  assert.equal(other.zoom, 0.5);
  assert.deepEqual(restoreView(parseView(JSON.stringify(kept)), size), view, 'through the text it is stored as');
});

test('what was kept is only used when it still makes sense', () => {
  const size = {w: 1600, h: 900}, bounds = {x: 0, y: 0, w: 10000, h: 6000};
  assert.equal(restoreView(null, size), null);
  assert.equal(restoreView({cx: 1, cy: 2}, size), null, 'no zoom');
  assert.equal(restoreView({cx: 'a', cy: 2, zoom: 1}, size), null, 'not a number');
  assert.equal(restoreView(parseView('{not json'), size), null);
  assert.equal(parseView('null'), null);
  assert.equal(restoreView({cx: 1, cy: 2, zoom: 1}, {w: 0, h: 0}), null, 'a window that is not measured yet');
  assert.ok(restoreView({cx: 5000, cy: 3000, zoom: 0.3}, size, bounds), 'in the board');
  assert.ok(restoreView({cx: 10500, cy: -500, zoom: 0.3}, size, bounds), 'a little past its edge is still there');
  assert.equal(restoreView({cx: 90000, cy: 3000, zoom: 0.3}, size, bounds), null, 'far from the board (lines deleted): the usual opening');
  assert.equal(restoreView({cx: 0, cy: 0, zoom: 9999}, size).zoom, 32, 'the zoom stays in its range');
  assert.equal(viewKey('improved-quality-v2'), 'storyboard:view:improved-quality-v2');
});
