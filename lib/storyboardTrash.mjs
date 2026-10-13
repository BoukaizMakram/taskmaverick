// The Trash: where a frame you delete from a storyboard goes (Delete on a frame). It is
// a board of its own, /storyboard?video=trash, kept in content/storyboard/trash.json
// like any other board: its edits file holds `trash` (what came from where) and, for
// each trashed frame, its assets as the inserts of frames[id], exactly like a blank
// frame's. So everything the boards do already works there: look at a frame, pick it
// (Ctrl+C) and paste it on a storyboard (Ctrl+V), where it arrives as a new frame holding
// the same assets. Pure: edits in, new edits out.
//
//   a frame deleted      -> trashEntry() snapshots it (its assets with their own HTML and
//                           changes, its note), addToTrash() puts it in the Trash's edits
//   the Trash board      -> trashVideo() makes its rows (one per video) and frames from
//                           `edits.trash`, newest first
//   deleted from there   -> removeFromTrash(): gone for good
import {pasteLayers} from './storyboardClipboard.mjs';
import {prune, setNote} from './storyboardEdits.mjs';

export const TRASH = 'trash';

// What the Trash keeps of one deleted frame. `item` is the frame as copyFrames made it
// ({label, note, layers}); `frame` the frame on the board; `board` is {id, name, chapters,
// stage} of the video it was deleted from.
// `id` is the id it will have in the Trash: made when the frame is deleted, so that undoing the
// delete (and redoing it) can take the same frame out of the Trash (and put it back).
export function trashEntry({item, frame, board, at = new Date().toISOString(), id = null}) {
  const chapter = board.chapters?.find(c => c.id === frame.chapter), stage = board.stage ?? {};
  return {
    id,
    meta: {
      video: board.id, videoName: board.name ?? board.id, chapter: frame.chapter ?? '', chapterTitle: chapter?.title ?? '', label: frame.label ?? item.label ?? 'Frame',
      time: Number.isFinite(frame.time) ? frame.time : null, from: frame.id, deletedAt: at,
      look: {shell: frame.shell ?? stage.shell ?? '', stageClass: frame.stageClass ?? stage.className ?? '', stageStyle: frame.stageStyle ?? stage.style ?? '', scene: {id: frame.scene?.id ?? null, view: frame.scene?.view ?? null}},
    },
    layers: item.layers ?? [], note: item.note ?? '',
  };
}

// Put deleted frames in the Trash's edits: each has an id of its own (the one it was given,
// else a new one) and its assets as the inserts of that frame. -> {edits, ids}
export function addToTrash(edits, entries, at = new Date().toISOString()) {
  const stamp = (Date.parse(at) || Date.now()).toString(36), taken = new Set([...edits.trash.map(t => t.id), ...Object.keys(edits.frames)]);
  let next = edits, n = 0;
  const trash = [...edits.trash], ids = [];
  for (const entry of entries) {
    let id = entry.id && !taken.has(entry.id) ? entry.id : null;
    while (!id) { const made = `trash-${stamp}-${++n}`; if (!taken.has(made)) id = made; }
    taken.add(id);
    next = pasteLayers(next, {id, layers: []}, entry.layers).edits;
    if (entry.note) next = setNote(next, id, entry.note, at);
    trash.push({...entry.meta, id});
    ids.push(id);
  }
  return {edits: {...next, trash}, ids};
}

// Delete trashed frames for good (their assets' HTML goes too, once nothing else uses it).
export function removeFromTrash(edits, ids) {
  const gone = new Set(ids), frames = {...edits.frames};
  for (const id of gone) delete frames[id];
  const rows = Object.fromEntries(Object.entries(edits.rows).map(([row, list]) => [row, list.filter(id => !gone.has(id))]));
  return prune({...edits, trash: edits.trash.filter(t => !gone.has(t.id)), frames, rows});
}

// The Trash as a board: the "video" the board draws. A row per line the frames were deleted
// from, with that line's name (the user, 2026-10-06), the line deleted last first; in a row the
// frames newest deleted first (those deleted together keep their order).
export const lineOfEntry = t => `${t.video}::${t.chapter || 'line'}`;
export function trashVideo(base, edits) {
  const entries = [...edits.trash].sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : a.deletedAt > b.deletedAt ? -1 : 0));
  const lines = new Map();
  for (const t of entries) if (!lines.has(lineOfEntry(t))) lines.set(lineOfEntry(t), t.chapterTitle || t.videoName);
  const chapters = [...lines].map(([id, title], i) => ({id, number: i + 1, title}));
  const frames = entries.map(t => ({
    id: t.id, n: 0, chapter: lineOfEntry(t), kind: 'blank', label: t.label, time: t.time, bubble: null, thumb: null, scene: t.look.scene, layers: [],
    ...(t.look.shell ? {shell: t.look.shell} : {}), ...(t.look.stageClass ? {stageClass: t.look.stageClass} : {}), ...(t.look.stageStyle ? {stageStyle: t.look.stageStyle} : {}),
  }));
  return {...base, chapters, frames};
}
