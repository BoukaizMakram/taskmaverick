// The storyboard's canvas, the way Figma's works: an endless board you pan and
// zoom, with the frames laid out on it. Pure math: the page keeps the view
// {x, y, zoom} (a world point (wx, wy) sits at the screen point
// (wx * zoom + x, wy * zoom + y)) and calls these.
export const MIN_ZOOM = 0.01;
export const MAX_ZOOM = 32;
export const FRAME = {w: 1600, h: 900}; // a frame is the video's stage
// The presets Ctrl + / Ctrl − walk through: about a fifth more or less each time (not doubling).
export const ZOOM_STEPS = [0.01, 0.0125, 0.015, 0.02, 0.025, 0.03, 0.04, 0.05, 0.065, 0.08, 0.1, 0.125, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32];
export const ZOOM_NOTCH = 1.2; // one notch of a mouse wheel (with Ctrl): 20% in or out, the view gliding there

export const clampZoom = zoom => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
export const toScreen = (view, p) => ({x: p.x * view.zoom + view.x, y: p.y * view.zoom + view.y});
export const toWorld = (view, p) => ({x: (p.x - view.x) / view.zoom, y: (p.y - view.y) / view.zoom});

// Zoom to `zoom`, keeping the world point under the screen point `at` where it is.
export function zoomAt(view, zoom, at) {
  const z = clampZoom(zoom), w = toWorld(view, at);
  return {zoom: z, x: at.x - w.x * z, y: at.y - w.y * z};
}
export const panBy = (view, dx, dy) => ({...view, x: view.x + dx, y: view.y + dy});

// The view that shows `rect` (world) in a `size` (screen) window, centered. Never
// zooms in past `maxZoom` (Shift+1 on a few frames should not blow them up).
export function fitRect(rect, size, {padding = 80, maxZoom = 1} = {}) {
  const zoom = clampZoom(Math.min(maxZoom, (size.w - 2 * padding) / rect.w, (size.h - 2 * padding) / rect.h));
  return {zoom, x: size.w / 2 - (rect.x + rect.w / 2) * zoom, y: size.h / 2 - (rect.y + rect.h / 2) * zoom};
}

// What a wheel / trackpad event does: Ctrl or ⌘ (a pinch sends Ctrl too) zooms
// at the pointer; Shift pans sideways; anything else pans. A mouse wheel's notch (whole lines
// or pages, or a big round number of px) zooms by ZOOM_NOTCH and `glide`s there; a pinch (small,
// fractional deltas, many of them) follows the fingers as they go.
export function wheelAction(e) {
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1, dx = e.deltaX * unit, dy = e.deltaY * unit;
  if (e.ctrlKey || e.metaKey) {
    const notch = e.deltaMode === 1 || e.deltaMode === 2 || (Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
    if (notch) {
      const notches = Math.min(5, e.deltaMode === 1 ? Math.abs(e.deltaY) / 3 : e.deltaMode === 2 ? Math.abs(e.deltaY) : Math.abs(e.deltaY) / 100);
      return {type: 'zoom', factor: ZOOM_NOTCH ** (-Math.sign(e.deltaY) * Math.max(notches, 0.5)), glide: true};
    }
    return {type: 'zoom', factor: Math.exp(-Math.max(-50, Math.min(50, dy)) * 0.012), glide: false};
  }
  if (e.shiftKey && !dx) return {type: 'pan', dx: -dy, dy: 0};
  return {type: 'pan', dx: -dx, dy: -dy};
}

// The next zoom preset up (dir > 0) or down (dir < 0) from `zoom`.
export function stepZoom(zoom, dir) {
  const next = dir > 0 ? ZOOM_STEPS.find(s => s > zoom * 1.001) : [...ZOOM_STEPS].reverse().find(s => s < zoom / 1.001);
  return next ?? (dir > 0 ? MAX_ZOOM : MIN_ZOOM);
}

// One step of a zoom gliding to `target` around the screen point `at`: `dt` ms later it has gone
// most of the way (in log scale, so it feels the same zooming in or out); within a hair it lands.
export function glideZoom(view, target, at, dt) {
  const cur = Math.log(view.zoom), goal = Math.log(clampZoom(target)), k = 1 - Math.exp(-Math.max(0, dt) / 55);
  const next = Math.abs(goal - cur) < 0.004 ? goal : cur + (goal - cur) * k;
  return {view: zoomAt(view, Math.exp(next), at), done: next === goal};
}
// The view part of the way (`t` 0 → 1) from `from` to `to`: the zoom in log scale, the point in
// the middle of the window on a straight line, so the move looks even.
export function viewBetween(from, to, t, size) {
  const mid = {x: size.w / 2, y: size.h / 2}, a = toWorld(from, mid), b = toWorld(to, mid);
  const zoom = Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * t), w = {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
  return t >= 1 ? to : {zoom, x: mid.x - w.x * zoom, y: mid.y - w.y * zoom};
}

// The part of the world on screen (plus a margin, in world px), and whether a
// box meets it: only the frames in view are drawn live.
// Where a board was looked at, kept to open there again (the user, 2026-10-13: "when I refresh the website using f5 or ctrl+shift+r or any way, I wanna be where I was before, when I
// refresh it takes me up"): the point of the board in the middle of the window and the zoom, so the same place is in the middle of a window of any size.
export const viewKey = videoId => `storyboard:view:${videoId}`;
export const keepView = (view, size) => { const c = toWorld(view, {x: size.w / 2, y: size.h / 2}); return {cx: Math.round(c.x), cy: Math.round(c.y), zoom: Number(view.zoom.toFixed(5))}; };
export const parseView = text => { try { const kept = JSON.parse(text); return kept && typeof kept === 'object' ? kept : null; } catch { return null; } };
// -> the view for a window of `size`, or null: what was kept is not usable, or its middle is nowhere near the board any more (`bounds`: the board's rows; a line deleted, another board).
export function restoreView(kept, size, bounds = null, margin = 800) {
  if (!kept || ![kept.cx, kept.cy, kept.zoom].every(Number.isFinite) || !(size?.w > 0) || !(size?.h > 0)) return null;
  if (bounds && (kept.cx < bounds.x - margin || kept.cx > bounds.x + bounds.w + margin || kept.cy < bounds.y - margin || kept.cy > bounds.y + bounds.h + margin)) return null;
  const zoom = clampZoom(kept.zoom);
  return {zoom, x: size.w / 2 - kept.cx * zoom, y: size.h / 2 - kept.cy * zoom};
}
export const visibleWorld = (view, size, margin = 0) => ({x: -view.x / view.zoom - margin, y: -view.y / view.zoom - margin, w: size.w / view.zoom + 2 * margin, h: size.h / view.zoom + 2 * margin});
export const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const union = boxes => {
  if (!boxes.length) return null;
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
  return {x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y};
};

// The board: one row per chapter. The chapter's name is a label block at the left,
// level with the numbers; its frames follow left to right, each with its number
// in a bar above and its notes below. (Proportions are those of the reference
// board: a frame is 1600 wide, the bars 112 high, 188 above the frame.)
export const LAYOUT = {labelW: 1010, labelGap: 135, gapX: 107, bar: 112, barGap: 188, notesGap: 40, notes: 230, rowGap: 260};
export function layoutFrames(frames, chapters, layout = LAYOUT) {
  const L = {...LAYOUT, ...layout}, x0 = L.labelW + L.labelGap, rowHeight = L.bar + L.barGap + FRAME.h + L.notesGap + L.notes + L.rowGap;
  const placed = {}, rows = [];
  let bounds = null;
  chapters.forEach((chapter, row) => {
    const y = row * rowHeight, mine = frames.filter(f => f.chapter === chapter.id); // (a row with no frames is kept: something can be dropped into it)
    mine.forEach((frame, i) => { placed[frame.id] = {x: x0 + i * (FRAME.w + L.gapX), y: y + L.bar + L.barGap, index: i + 1}; });// (each row counts from 1)
    rows.push({chapter, x: 0, y, w: L.labelW, h: L.bar});
    bounds = union([bounds, {x: 0, y, w: x0 + Math.max(0, mine.length * FRAME.w + (mine.length - 1) * L.gapX), h: rowHeight - L.rowGap}].filter(Boolean));
  });
  return {frames: placed, rows, rowHeight, bounds: bounds ?? {x: 0, y: 0, w: FRAME.w, h: FRAME.h}, layout: L};
}

// Where a frame dropped at `point` (world px; x is the middle of the frame being
// carried) would go: the row it is over, and its place among the frames there.
// `board` is the layout of the frames WITHOUT the one being carried, so the answer
// does not change as the others make room for it.
export function dropTarget(board, frames, point) {
  if (!board.rows.length) return null;
  const reach = board.rowHeight - board.layout.rowGap;
  let best = board.rows[0], nearest = Infinity;
  for (const row of board.rows) {
    const gap = point.y < row.y ? row.y - point.y : point.y > row.y + reach ? point.y - row.y - reach : 0;
    if (gap < nearest) { nearest = gap; best = row; }
  }
  const index = frames.filter(f => f.chapter === best.chapter.id && board.frames[f.id] && board.frames[f.id].x + FRAME.w / 2 < point.x).length;
  return {chapter: best.chapter.id, index};
}

// Where a line carried with its top edge at `top` (world px) would land among the `count` other
// lines (0 = first): it changes places once it is halfway over its neighbour.
export const lineDropIndex = (rowHeight, count, top) => Math.max(0, Math.min(count, Math.round(top / rowHeight)));

// The + between frames: for every frame, the strip of the board right after it
// (between it and the next frame, or past the end of its row), as tall as the
// frame with its number bar and notes. `artTop` / `artBottom` bound the picture.
export function layoutGaps(frames, placed, layout = LAYOUT) {
  const L = {...LAYOUT, ...layout}, top = L.bar + L.barGap, height = top + FRAME.h + L.notesGap + L.notes;
  return frames.filter(f => placed[f.id]).map(f => {
    const p = placed[f.id];
    return {after: f.id, x: p.x + FRAME.w, w: L.gapX, y: p.y - top, h: height, artTop: p.y, artBottom: p.y + FRAME.h};
  });
}
// The gap a world point is in, or null. Zoomed out, a gap is narrower than a
// finger: it is grown (into the frames beside it) to `wide` screen px.
export function gapAt(gaps, point, zoom, wide = 34) {
  const pad = Math.min(60, Math.max(0, (wide / zoom - LAYOUT.gapX) / 2));
  return gaps.find(g => point.x >= g.x - pad && point.x <= g.x + g.w + pad && point.y >= g.y && point.y <= g.y + g.h) ?? null;
}
