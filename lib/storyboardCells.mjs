// A line of videos (the user, 2026-10-12: "make them videos not slides"): a line the board shows as VIDEOS, one for each entry of its `videos`
// ([{id, name, ids}] in the line's record, lib/storyboardEdits.mjs), not as the slides they are made of. The slides are still frames of the line (the
// video plays them, the command line and the "Slides" view of the line show them), but on the board each video takes the place of its first
// slide (its anchor): the anchor's header says the video's name, its notes are the video's, and a player takes the place of its picture. The other
// slides of a video are not on the board while the line is shown as videos. Pure.
import {addCopy, nameOf, setLineVideos, setName, setNote} from './storyboardEdits.mjs';

const OK = line => !!line && Array.isArray(line.videos) && line.videos.length > 0;

// What a board shows as videos: `edits` and `frames` (every frame of the board, in board order, the slides of a video included).
// -> {hidden: Set(frame id) the slides that are not on the board, anchors: Map(frame id -> {line, id, name, ids, anchor}) the videos by their first slide,
//     lines: Map(line id -> {scenes: [{line, id, name, ids, anchor}] in the order of the line, slides: bool}) every line of videos (shown as slides too)}
export function cellsOf(edits, frames) {
  const have = new Set(frames.map(f => f.id)), hidden = new Set(), anchors = new Map(), lines = new Map(), taken = new Set();
  for (const [lineId, line] of Object.entries(edits.lines?.added ?? {})) {
    if (!OK(line)) continue;
    const scenes = [];
    for (const v of line.videos) {
      const ids = (v.ids ?? []).filter(id => have.has(id) && !taken.has(id));
      if (!ids.length) continue;
      ids.forEach(id => taken.add(id));
      scenes.push({line: lineId, id: v.id, name: v.name, ids, anchor: ids[0]});
    }
    const slides = line.view === 'slides';
    lines.set(lineId, {scenes, slides});
    if (slides) continue;
    for (const s of scenes) { anchors.set(s.anchor, s); for (const id of s.ids.slice(1)) hidden.add(id); }
  }
  return {hidden, anchors, lines};
}

// A video stands for all its slides (the one on the board is only the first): taking a video out, copying it or cutting it takes every slide. `ids` -> `ids` with
// the slides of every video among them, each once.
export const withSlides = (ids, cells) => [...new Set(ids.flatMap(id => cells.anchors.get(id)?.ids ?? [id]))];

// The slides that go where a video goes: {first slide: [the other slides]}, to keep them right after it in the order of a row (moveFrame in lib/storyboardEdits.mjs).
export const followersOf = cells => Object.fromEntries([...cells.anchors].map(([anchor, scene]) => [anchor, scene.ids.slice(1)]));

// A video duplicated (Ctrl+D): each of its slides is copied, with its changes, note and name, right after the original; the copies are a video of the same line, right
// after the original one. `scene`: a value of cellsOf's `anchors`. -> {edits, ids (the copies), anchor (the first of them)}
export function duplicateVideo(edits, scene) {
  let next = edits;
  const ids = [];
  for (const id of scene.ids) {
    const made = addCopy(next, {from: id, after: id, inherit: id});
    next = made.edits;
    const note = edits.frames[id]?.note, name = nameOf(edits, id);
    if (note) next = setNote(next, made.id, note);
    if (name) next = setName(next, made.id, name);
    ids.push(made.id);
  }
  const list = next.lines?.added?.[scene.line]?.videos ?? [], at = list.findIndex(v => v.id === scene.id);
  let n = 2;
  while (list.some(v => v.id === `${scene.id}-${n}`)) n++;
  const copy = {id: `${scene.id}-${n}`, name: scene.name, ids};
  return {edits: setLineVideos(next, scene.line, [...list.slice(0, at + 1), copy, ...list.slice(at + 1)]), ids, anchor: ids[0]};
}

// A line's frames as its video plays them: the slides of every video where its anchor is, a frame that is no video's as it is. `shown`: the line's frames that
// are on the board, in order (what the line looks like); `cells`: cellsOf; `byId`: every frame by its id.
export const expandLine = (shown, cells, byId) => shown.flatMap(f => (cells.anchors.has(f.id) ? cells.anchors.get(f.id).ids.map(id => byId[id]).filter(Boolean) : [f]));

// The row of a line shown as slides again: the slides of each video together, in the order the videos are in on the board, then what was in no video.
// `frames`: every frame in board order (the line's, among others).
export function slidesOrder(edits, lineId, frames) {
  const cells = cellsOf(edits, frames), byId = Object.fromEntries(frames.map(f => [f.id, f]));
  const mine = frames.filter(f => f.chapter === lineId), shown = mine.filter(f => !cells.hidden.has(f.id)), ids = expandLine(shown, cells, byId).map(f => f.id), seen = new Set(ids);
  return [...ids, ...mine.filter(f => !seen.has(f.id)).map(f => f.id)];
}
