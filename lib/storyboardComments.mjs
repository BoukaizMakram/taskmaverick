// The comments of a VIDEO (the user, 2026-10-29: "add a way to add comment to the video, the comment should be a point I can place and write what I want and save its placement
// and the comment itself, it can be deleted right clicking it and delete or selecting and hitting delete on the right inspector"): notes the video editor
// (components/StoryboardVideoEditor.jsx) keeps on a video, each a POINT on its 1600 x 900 picture at a second of the video, with the words written for it. They are for the people
// making the video, and for Claude, who reads and answers them from the command line (scripts/storyboard.mjs `vcomments`, `vcomment-set`…). They are NEVER part of the picture: no
// player, no export and no clip draws them, only the editor's viewer (and its timeline's ruler) does. Pure data: the page and the command line share it.
//
// Kept per video, by the video's title (and the variation that plays, when it is not Variation 1: `commentKeyOf`), in its board's edits, as the layers are: `edits.comments[title] = {items: [comment, …], updated}` (the newer `updated` wins when two copies
// meet; an empty list is kept, it says all of them were deleted). `items` are in the order they were placed: that order is the number on a pin (1, 2, 3…).
//   comment {id, x, y, at, text, done?, created}
//     x, y     the point on the picture in the video's own STAGE px (1600 x 900), so it is the same at any zoom: the tip of the pin
//     at       the second of the video it was placed on (the playhead then); the pin is on the picture only in that second's scene (`sceneAt`; in the video editor, around the second: COMMENT_SHOW)
//     text     what is written, kept as typed (a pin just placed has none yet)
//     done     true once it is answered or settled: its pin is then on no video, picked or not (the lists and the ruler keep it, to take the Done off)
//     created  when it was placed (ISO)
import {STAGE_H, STAGE_W} from './storyboardLayers.mjs';
import {activeVariation, commentKeyOf} from './storyboardVariations.mjs';

// A pin is on the editor's picture from one picture before its second to 3 seconds after it (the pin that is picked stays on, faded, wherever the playhead is)
export const COMMENT_SHOW = {before: 1 / 30, after: 3};
export const COMMENT_TEXT_MAX = 4000;
export const MAX_COMMENTS = 300; // (a video)
const NO_COMMENTS = Object.freeze([]); // (the same empty list each time: what is memoized on it is not drawn again)
const now = () => new Date().toISOString();
const num = (v, lo, hi, digits = 2) => { const n = Number(v); if (!Number.isFinite(n)) return null; const k = 10 ** digits; return Math.round(Math.min(hi, Math.max(lo, n)) * k) / k; };

// ---- Cleaning (the file is edited by hand and by the command line too) ----
export function cleanVideoComment(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' ? raw.id.slice(0, 60).replace(/[^\w-]/g, '') : '';
  if (!id) return null;
  const x = num(raw.x, 0, STAGE_W, 1), y = num(raw.y, 0, STAGE_H, 1);
  if (x == null || y == null) return null;
  const out = {id, x, y, at: num(raw.at, 0, 36000, 3) ?? 0, text: typeof raw.text === 'string' ? raw.text.slice(0, COMMENT_TEXT_MAX) : ''};
  if (raw.done === true) out.done = true;
  out.created = typeof raw.created === 'string' && !Number.isNaN(Date.parse(raw.created)) ? raw.created : now();
  return out;
}
// `edits.comments` as kept: {title: {items, updated}}
export function cleanVideoComments(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const [title, v] of Object.entries(raw)) {
    if (typeof title !== 'string' || !title || title.length > 160 || !v || typeof v !== 'object') continue;
    const seen = new Set(), items = (Array.isArray(v.items) ? v.items : []).map(cleanVideoComment).filter(c => c && !seen.has(c.id) && seen.add(c.id)).slice(0, MAX_COMMENTS);
    out[title] = {items, updated: typeof v.updated === 'string' ? v.updated : now()};
  }
  return Object.keys(out).length ? out : null;
}
// Two copies of the board's edits meet: for each video the newer list wins (as the layers do).
export function mergeVideoComments(base, other) {
  let out = base ?? null, changed = false;
  for (const [title, theirs] of Object.entries(other ?? {})) {
    const mine = out?.[title];
    if (!mine || String(theirs.updated ?? '') > String(mine.updated ?? '')) { out = {...(out ?? {}), [title]: theirs}; changed = true; }
  }
  return {comments: out, changed};
}

// ---- Reading and changing the comments of a video (edits in, edits out; the same edits back when nothing changes, so there is no step of Undo for it) ----
// The ones of the variation the board's videos play (lib/storyboardVariations.mjs; the user, 2026-11-03: "Yes, separate them"): Variation 1's under the title itself, another's under "<title> [v2]". Every page and the
// command line read and change them through these, so a variation's comments are on its own pins, lists and seconds.
const keyOf = (edits, title) => commentKeyOf(title, activeVariation(edits).id);
export const commentsOf = (edits, title) => edits?.comments?.[keyOf(edits, title)]?.items ?? NO_COMMENTS;
export function setComments(edits, title, items, updated = now()) {
  return {...edits, comments: {...(edits.comments ?? {}), [keyOf(edits, title)]: {items, updated}}};
}
export function newCommentId(items) {
  const used = new Set(items.map(c => c.id));
  for (let n = 1; ; n++) { const id = `comment-${n}`; if (!used.has(id)) return id; }
}
// A new comment (the last, so the highest number); -> {edits, id}
export function addVideoComment(edits, title, comment, stamp = now()) {
  const items = commentsOf(edits, title);
  if (!title || items.length >= MAX_COMMENTS) return {edits, id: null};
  const clean = cleanVideoComment({created: stamp, ...comment, id: comment.id && !items.some(c => c.id === comment.id) ? comment.id : newCommentId(items)});
  if (!clean) return {edits, id: null};
  return {edits: setComments(edits, title, [...items, clean], stamp), id: clean.id};
}
// `change`: a patch, or a function of the comment -> the comment (cleaned after)
export function updateVideoComment(edits, title, id, change, stamp = now()) {
  const items = commentsOf(edits, title), i = items.findIndex(c => c.id === id);
  if (i < 0) return edits;
  const next = cleanVideoComment(typeof change === 'function' ? change(items[i]) : {...items[i], ...change});
  if (!next || next.id !== id || JSON.stringify(next) === JSON.stringify(items[i])) return edits;
  return setComments(edits, title, items.map((c, k) => (k === i ? next : c)), stamp);
}
export function removeVideoComment(edits, title, id, stamp = now()) {
  const items = commentsOf(edits, title);
  if (!items.some(c => c.id === id)) return edits;
  return setComments(edits, title, items.filter(c => c.id !== id), stamp);
}

// ---- Showing them ----
// Is the pin on the picture at the second `t` of the video? (never once it is done)
export const isCommentShown = (comment, t) => !comment.done && t >= comment.at - COMMENT_SHOW.before && t <= comment.at + COMMENT_SHOW.after;
// A comment's number (what its pin says): its place in the list, from 1; 0 when it is not there
export const commentNumber = (items, id) => items.findIndex(c => c.id === id) + 1;
