// References (the user, 2026-10-30: "if I put a video in /storyboard in any of the boards it should put it where I put it, even in a blank space, videos/images and anything, it's like a reference for
// me"): a file put on a board stays where it was put, on the canvas itself, in no frame and in no video. `edits.refs`: {at, items: [{id, kind, url, name, x, y, w, h}]}, x y w h in world px; `at` says which of
// two copies of the list is the newer (mergeEdits), so what was taken away stays away. The file is saved by /api/storyboard/reference, the items are drawn by components/StoryboardRefs.jsx.
export const MAX_REFS = 500;
export const REF_MIN = 80;    // (world px: the narrowest a reference can be made)
const SHOWN = 520;            // a file comes in this long on the screen, whatever the zoom
const KINDS = ['image', 'video', 'audio', 'file'];
const NO_REFS = Object.freeze([]); // (the same empty list each time: what is memoized on it is not drawn again)
const now = () => new Date().toISOString();
const px = n => Math.round(n * 10) / 10;

export function kindOfFile(file) {
  const type = file?.type ?? '', name = file?.name ?? '';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/') || /\.(mp4|m4v|mov|webm|mkv|ogv)$/i.test(name)) return 'video';
  if (type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name)) return 'audio';
  return 'file';
}
export const newRefId = () => `ref-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
// Its size in world px: `size` the picture's {w, h} (none: a card with the file's name), long enough to be seen at the zoom it is put at
export function fitRef(size, zoom) {
  const long = SHOWN / zoom;
  if (!size?.w || !size?.h) return {w: px(long * 0.7), h: px(long * 0.22)};
  const k = long / Math.max(size.w, size.h);
  return {w: px(size.w * k), h: px(size.h * k)};
}
// Dragged by a corner: its proportions kept, the opposite corner where it is
export function resizedRef(from, handle, dx, dy) {
  const sx = handle.includes('e') ? 1 : -1, sy = handle.includes('s') ? 1 : -1, ratio = from.w / from.h;
  const w = Math.max(REF_MIN, from.w + Math.max(sx * dx, sy * dy * ratio)), h = w / ratio;
  return {x: sx > 0 ? from.x : from.x + from.w - w, y: sy > 0 ? from.y : from.y + from.h - h, w, h};
}

// ---- Cleaning (the file is edited by hand and by the command line too) ----
export function cleanRefs(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return null;
  const seen = new Set(), items = [];
  for (const r of raw.items) {
    const id = typeof r?.id === 'string' ? r.id.slice(0, 60).replace(/[^\w-]/g, '') : '', box = ['x', 'y', 'w', 'h'].map(k => Number(r?.[k]));
    if (!id || seen.has(id) || !KINDS.includes(r.kind) || typeof r.url !== 'string' || r.url.length > 300 || !r.url.startsWith('/storyboard/references/') || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0) continue;
    seen.add(id);
    items.push({id, kind: r.kind, url: r.url, name: typeof r.name === 'string' ? r.name.slice(0, 200) : '', x: px(box[0]), y: px(box[1]), w: px(box[2]), h: px(box[3])});
    if (items.length >= MAX_REFS) break;
  }
  return {at: typeof raw.at === 'string' ? raw.at : now(), items};
}
// Two copies (the file, this browser): the newer list wins
export function mergeRefs(base, other) {
  if (other && (!base || String(other.at ?? '') > String(base.at ?? ''))) return {refs: other, changed: true};
  return {refs: base ?? null, changed: false};
}

// ---- Reading and changing ----
export const refsOf = edits => edits?.refs?.items ?? NO_REFS;
export const refBoxes = edits => refsOf(edits).map(({x, y, w, h}) => ({x, y, w, h}));
const withItems = (edits, items) => ({...edits, refs: {at: now(), items}});
export const addRefs = (edits, made) => withItems(edits, [...refsOf(edits), ...made].slice(-MAX_REFS));
export const changeRef = (edits, id, patch) => withItems(edits, refsOf(edits).map(r => (r.id === id ? {...r, ...patch} : r)));
export const removeRef = (edits, id) => withItems(edits, refsOf(edits).filter(r => r.id !== id));
