// The geometry of the video's text editor (components/StoryboardTextEditor.jsx): how a text's box changes when a handle or an edge is dragged. Pure.
export const MIN_BOX = {w: 40, h: 20}; // stage px: the smallest a box can be dragged to
const tenth = n => Math.round(n * 10) / 10;
// The box [x, y, w, h] (stage px) after a drag of `dx`, `dy`. `mode`: 'move' carries it; a handle ('n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw') pulls the sides it is on, the others stay where
// they are. `auto`: the box is as tall as its words (h 0 when kept): it stays so unless a top or bottom side is pulled.
export function draggedRect({mode, rect: [x, y, w, h], auto}, dx, dy) {
  if (mode === 'move') return [tenth(x + dx), tenth(y + dy), tenth(w), auto ? 0 : tenth(h)];
  let nx = x, ny = y, nw = w, nh = h;
  if (mode.includes('e')) nw = Math.max(MIN_BOX.w, w + dx);
  if (mode.includes('w')) { nw = Math.max(MIN_BOX.w, w - dx); nx = x + w - nw; }
  if (mode.includes('s')) nh = Math.max(MIN_BOX.h, h + dy);
  if (mode.includes('n')) { nh = Math.max(MIN_BOX.h, h - dy); ny = y + h - nh; }
  const tall = mode.includes('n') || mode.includes('s');
  return [tenth(nx), tenth(ny), tenth(nw), tall ? tenth(nh) : auto ? 0 : tenth(h)];
}
// A box typed in a field of the toolbar: `index` 0 x, 1 y, 2 w, 3 h (an empty h: as tall as its words).
export function typedRect([x, y, w, h], auto, index, value) {
  const next = [x, y, w, auto ? 0 : h];
  next[index] = value == null ? (index === 3 ? 0 : next[index]) : value;
  return next.map(tenth);
}
