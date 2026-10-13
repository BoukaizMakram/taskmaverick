// Picking assets on the storyboard: the pure parts (what is picked, which layer a repeated click
// goes to, what a rectangle drawn in a frame takes in). The page (components/Storyboard.jsx) does
// the measuring; these only answer from what was measured.
//
// An asset picked is {frame, key}. Several can be picked at once, in different frames (Shift+click,
// or a rectangle drawn in a frame); they move, copy and delete together.

export const samePick = (a, b) => !!a && !!b && a.frame === b.frame && a.key === b.key;
export const hasPick = (picks, pick) => picks.some(p => samePick(p, pick));
// `pick` added (at the end), unless it is picked already.
export const addPick = (picks, pick) => (hasPick(picks, pick) ? picks : [...picks, pick]);
export const removePick = (picks, pick) => picks.filter(p => !samePick(p, pick));
// Several keys of one frame as picks.
export const picksOf = (frame, keys) => keys.map(key => ({frame, key}));
// [{frame, keys}], frames in the order they were first picked, each one's keys in the order picked.
export function groupPicks(picks) {
  const groups = [];
  for (const {frame, key} of picks) {
    let group = groups.find(g => g.frame === frame);
    if (!group) groups.push(group = {frame, keys: []});
    if (!group.keys.includes(key)) group.keys.push(key);
  }
  return groups;
}
export const framesOfPicks = picks => groupPicks(picks).map(g => g.frame);
// Two lists of picks that hold the same things (in any order).
export const samePicks = (a, b) => a.length === b.length && a.every(p => hasPick(b, p));

// ---- A click again where the last one was: the next layer under the pointer ----
// `keys`: the layers under the pointer, the one on top first; `current`: the one selected.
// Each click goes to the one under it, and after the last one it starts again from the top.
// A selection that is not among them (it is hidden under something that cannot be clicked)
// starts from the top too.
export function nextLayer(keys, current) {
  if (!keys.length) return null;
  const at = keys.indexOf(current);
  return keys[at < 0 ? 0 : (at + 1) % keys.length];
}
// A click at the same place as the last one (a hand's width of wobble allowed).
export const sameSpot = (a, b, reach = 4) => !!a && !!b && Math.hypot(a.x - b.x, a.y - b.y) <= reach;

// ---- A rectangle drawn in a frame ----
// Boxes are {left, top, right, bottom} (screen px). A box is hit when the rectangle touches it.
export const meets = (a, b) => a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
export const rectOf = (a, b) => ({left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y)});
// An asset as big as the frame itself (a dim over everything, a background) is not what a rectangle
// is drawn to take in: it is there under all the others.
export const isBackdrop = (box, stage, share = 0.8) => {
  const area = Math.max(1, (stage.right - stage.left) * (stage.bottom - stage.top));
  const w = Math.max(0, Math.min(box.right, stage.right) - Math.max(box.left, stage.left)), h = Math.max(0, Math.min(box.bottom, stage.bottom) - Math.max(box.top, stage.top));
  return (w * h) / area >= share;
};
