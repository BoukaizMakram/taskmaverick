// Snapping while an asset is dragged on the storyboard, the way Figma does it: the asset's left
// edge, middle or right edge lines up with the frame's (0, the middle, the right edge) or with
// another asset's, and likewise its top, middle and bottom, as soon as it comes within reach.
// A red guide shows each line it snapped to. Pure: boxes are stage px ({x, y, w, h}).
export const SNAP_REACH = 6; // screen px

// The lines an asset can snap to in a frame: [{at, from, to}] per axis (`from` / `to`: how far
// along the other axis the line runs, for its guide).
export function snapTargets(frame, others = []) {
  const x = [0, frame.w / 2, frame.w].map(at => ({at, from: 0, to: frame.h}));
  const y = [0, frame.h / 2, frame.h].map(at => ({at, from: 0, to: frame.w}));
  for (const b of others) {
    if (!(b.w > 0 && b.h > 0)) continue;
    for (const at of [b.x, b.x + b.w / 2, b.x + b.w]) x.push({at, from: b.y, to: b.y + b.h});
    for (const at of [b.y, b.y + b.h / 2, b.y + b.h]) y.push({at, from: b.x, to: b.x + b.w});
  }
  return {x, y};
}

// Where `box` snaps: {dx, dy} to add to it (0 where nothing is in `reach`) and the guides to draw,
// [{axis: 'x' | 'y', at, from, to}]. `axes` leaves an axis alone (Shift keeps the drag on the other).
export function snapBox(box, targets, reach, axes = {x: true, y: true}) {
  const along = (edges, lines) => {
    let best = null;
    for (const p of edges) for (const t of lines) {
      const d = t.at - p;
      if (Math.abs(d) <= reach && (!best || Math.abs(d) < Math.abs(best.d) - 1e-9)) best = {d};
    }
    return best ? best.d : 0;
  };
  const xs = b => [b.x, b.x + b.w / 2, b.x + b.w], ys = b => [b.y, b.y + b.h / 2, b.y + b.h];
  const dx = axes.x ? along(xs(box), targets.x) : 0, dy = axes.y ? along(ys(box), targets.y) : 0;
  const placed = {...box, x: box.x + dx, y: box.y + dy}, guides = [];
  const lines = (axis, edges, list) => { // a guide for each of its lines that sits on one
    for (const at of edges) {
      const hits = list.filter(t => Math.abs(t.at - at) < 0.5);
      if (!hits.length) continue;
      const [lo, hi] = axis === 'x' ? [placed.y, placed.y + placed.h] : [placed.x, placed.x + placed.w];
      guides.push({axis, at, from: Math.min(lo, ...hits.map(t => t.from)), to: Math.max(hi, ...hits.map(t => t.to))});
    }
  };
  if (axes.x) lines('x', xs(placed), targets.x);
  if (axes.y) lines('y', ys(placed), targets.y);
  return {dx, dy, guides};
}
