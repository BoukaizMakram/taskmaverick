// The storyboard's video (the player at the right of the first part of the demo: its first captured line): the frames played one after
// the other, each one as the storyboard shows it (its moves, scales, retyped words, assets brought
// in or taken out), with a smooth move from one to the next. Pure parts only: when each frame is
// on, how far a move has gone, and which assets of a frame are the same asset in the next one (they
// glide to their new place; the others fade). The page (components/StoryboardPlayer.jsx) draws it.

import {animSeconds} from './storyboardEdits.mjs';

// How long a frame stays: as long as the demo did between it and the next (its `time`), kept
// between MIN and MAX so a click done in a blink is still seen and a long wait does not drag.
// A frame without a time (a blank one you added), or whose next one has none, stays FALLBACK.
// A frame whose move the director made longer (a click, a scene) still rests REST seconds once it is in (it is never cut off before its move ends).
export const HOLD = {min: 0.4, max: 1.4, fallback: 0.8, last: 1.8, rest: 0.45};
// The move into a frame: at most MAX seconds, and never more than SHARE of the time the frame stays.
export const MOVE = {max: 0.5, share: 0.55};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A chat box written by a pen (lib/storyboardHandwriting.mjs, edits `anims`) is written as soon as the words that were there are gone (the user, 2026-10-13: "don't keep the
// right side empty, always fade out and show the first word right away"): the old words go over the first `early` of the move, the pen touches just after, and the frame stays
// `tail` seconds after it lifts. A frame that does not move in (the first one) has the pen touch after `lead` seconds.
export const WRITE = {lead: 0.15, tail: 0.5, early: 0.5, gap: 0.05};
// `after`: the words' side (the panel) comes in with this move: the pen waits for it (the user, 2026-10-13: the words must not show up before the gray does).
// `at`: the video says when (seconds after the move is over), a scene that has the highlight come in first and the words after it (the user, 2026-10-13).
export const penStart = (move, after = false, at = null) => (at != null ? move + at : move > 0 ? (after ? move + WRITE.lead : move * WRITE.early + WRITE.gap) : WRITE.lead);

// How long a frame's pens write, in seconds (the slowest chat box; 0: none), from the storyboard's changes. `wordsFor(id, key)`: how many
// words a chat box has (a pen goes at so many words a second).
export const writeSecondsOf = (edits, wordsFor = () => '') => id => Math.max(0, ...Object.entries(edits?.frames?.[id]?.anims ?? {}).map(([key, a]) => animSeconds(a, wordsFor(id, key)) || 0));

// How far a chat box's writing has gone at `local` seconds into its frame: below 0 before the pen touches, 0 → 1 while it
// writes, above 1 when it is done. `item`: {move} the frame's timeline item; `seconds`: what that chat box takes.
export const writeProgress = (item, seconds, local) => (local - penStart(item.move, item.penAfter, item.penAt)) / Math.max(0.01, seconds);

// [{id, start, hold, move, write, settle}] (seconds): `start` is when the frame comes on, `move` how long its
// move in lasts (the first frame just is: 0), `write` how long a pen writes in it (0: none; the frame then stays long
// enough for it), `settle` when it is all there (moved in, written). `total` is the length of the video.
// `writing(id)` -> seconds of handwriting the frame has. `tune(id)` -> {move (seconds, instead of the usual), minHold, late (seconds after the
// move before what comes in last, a highlight, is all there), natural / rest (seconds, instead of the video's own), extra (seconds added to the hold)}: the video's director (components/storyboardPlayerDom.js) has the say.
export const LATE = {lead: 0.25, fade: 0.25}; // what comes in after the rest (a highlight, a timeline) waits for the move to end, then fades in
// `pace` ({natural, rest}, a video that has to be short: the user, 2026-10-13, "the whole video can be in 10 seconds"): how long a frame stays by itself and how long it rests once its move is done.
export function timelineOf(frames, writing = () => 0, tune = () => ({}), pace = {}) {
  const items = [];
  let start = 0;
  frames.forEach((frame, i) => {
    const next = frames[i + 1], gap = next && Number.isFinite(frame.time) && Number.isFinite(next.time) ? next.time - frame.time : null;
    const t = tune(frame.id) ?? {}; // (a frame can say how long it stays by itself (`natural`) and rests once its move is done (`rest`): the cursor that has come to what it clicks does not wait on it, the user, 2026-10-13)
    const natural = t.natural ?? pace.natural ?? (i === frames.length - 1 ? HOLD.last : gap != null && gap > 0 ? clamp(gap, HOLD.min, HOLD.max) : HOLD.fallback);
    const penAfter = !!t.penAfter, penAt = Number.isFinite(t.penAt) ? t.penAt : null, move = i === 0 ? 0 : Number.isFinite(t.move) ? t.move : Math.min(MOVE.max, natural * MOVE.share), write = writing(frame.id) || 0, late = t.late ? (Number.isFinite(t.lateLead) ? t.lateLead : LATE.lead) + (Number.isFinite(t.lateFade) ? t.lateFade : LATE.fade) : 0; // (`penAt`, `lateLead`, `lateFade`: a scene that has its own order and pace: the highlight first, then the words)
    const hold = Math.max(write > 0 ? Math.max(natural, penStart(move, penAfter, penAt) + write + WRITE.tail) : natural, t.minHold || 0, late ? move + late + 0.5 : 0, i > 0 && Number.isFinite(t.move) ? move + (t.rest ?? pace.rest ?? HOLD.rest) : 0) + (t.extra || 0); // (`extra`: seconds more, once all of it is there: the user, 2026-10-13, "add 2 seconds to who performed")
    items.push({id: frame.id, start, hold, move, write, penAfter, penAt, settle: start + Math.max(move, write > 0 ? penStart(move, penAfter, penAt) + write : 0, late ? move + late : 0) + 0.001});
    start += hold;
  });
  return {items, total: start};
}

// Where the video is at time `t`: the frame, and whether it is still moving in (`progress` 0 → 1, then
// the frame is held). A time out of range is the first / last frame at rest. null: no frames.
export function locate(timeline, t) {
  const {items, total} = timeline;
  if (!items.length) return null;
  const time = clamp(Number.isFinite(t) ? t : 0, 0, total);
  let lo = 0, hi = items.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (items[mid].start <= time) lo = mid; else hi = mid - 1; }
  const item = items[lo], local = time - item.start;
  const moving = lo > 0 && item.move > 0 && local < item.move;
  return {index: lo, id: item.id, local, moving, progress: moving ? local / item.move : 1};
}
// The time a frame is fully on (its move in done, its words written): where the video goes when a frame is picked.
export const settledAt = (timeline, index) => { const item = timeline.items[index]; return item ? Math.min(timeline.total, item.settle) : 0; };

// The poster of a video: the moment of it that shows its first picture, all there (the first frame settled: its words written, its outline in) and never before
// that picture has come in (a title or the software comes in over a second, so at 0 it is blank).
export const POSTER_MIN = 0.95;
export const posterAt = timeline => Math.min(timeline.total, Math.max(POSTER_MIN, settledAt(timeline, 0)));

// Ease in and out (a smooth start and a soft stop).
export const ease = u => { const x = clamp(u, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2; };

// Whether two frames are drawn in the same way (the demo's classes and variables, the scene): then
// what they have in common can glide; else the next one just fades in over the one before.
export const sameLook = (a, b) => !!a && !!b && ['shell', 'stageClass', 'stageStyle', 'scene', 'view'].every(k => (a[k] ?? '') === (b[k] ?? ''));

// What happens to each asset between two frames. `from` and `to` are [{key, sig}]: the asset's key
// and a signature of how it looks (its HTML and what was changed on it, but not where it is). The
// same key in both: it glides to its new place (`same`: it looks the same, so it is only moved; else
// the old look fades into the new one on the way). Only in the first: it fades out. Only in the
// second: it fades in.
export function pairLayers(from, to) {
  const id = l => l.role ?? l.key; // (the same ROLE in both frames is the same asset: the cursor, the tablet, the words, even when the demo or the storyboard named them differently)
  const before = new Map(from.map(l => [id(l), l])), after = new Map(to.map(l => [id(l), l]));
  return {
    matched: to.filter(l => before.has(id(l))).map(l => ({key: l.key, from: before.get(id(l)).key, same: before.get(id(l)).sig === l.sig})),
    gone: from.filter(l => !after.has(id(l))).map(l => l.key),
    added: to.filter(l => !before.has(id(l))).map(l => l.key),
  };
}

// The role of a layer in the video: what it is on screen, so the cursor, the tablet and the words are ONE thing from frame to frame
// (they move, they do not fade out and in again). Anything else is itself (its key).
const ROLES = [['plate', /^plate$/i], ['panel', /^panel$/i], ['tablet', /^(tablet|mission|team board|report|board)$/i], ['hand', /^hand$/i], ['title', /^title$/i]]; // ('tablet': the main art of a slide, whatever it is: the tablet, the mission, the board, the report)
export const roleOf = layer => (layer.kind === 'bubble' ? 'words' : ROLES.find(([, re]) => re.test(layer.name ?? ''))?.[0] ?? layer.key);
// What is drawn over the art and is not part of it (a highlight, the timeline of a video, a ripple): it comes in after the art is in place.
// The art of a slide: its main piece and what goes with it (a lifted mission, the names in a report, the cards on a board).
export const isArt = layer => /^(tablet|mission|team board|lifted mission|report|board|names|dates|mission cards|isolated missions|layer)$/i.test(layer.name ?? '');
export const isOverlay = layer => !['plate', 'panel', 'tablet', 'hand', 'title', 'words'].includes(roleOf(layer)) && !isArt(layer);

// A frame that only shows the first words of what the next frame says (the storyboard has "As Teams", then the whole sentence): the video does
// not show it (the user, 2026-10-08: no incomplete text), it goes straight to the whole sentence. `now` and `next` are the two frames' words.
const squash = text => String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
export const isTypingStep = (now, next) => { const a = squash(now), b = squash(next); return a.length > 0 && b.length > a.length && b.startsWith(a); };
// How an asset's opacity goes over a move (as Web Animations keyframes, offsets 0 → 1; `opacity` is what it is when it is on): 'in' comes in over the first `span`
// of the move, 'out' goes out over the last `span` (so an old look and a new one cross without both being half there at once), 'fade-in' and 'fade-out' take all of it,
// 'swap-out' leaves in the first half and 'swap-in' comes in the second (words changed in the same place: the old ones are gone before the new ones are there, never both
// at once), 'hold' stays as it is (an asset that looks the same in the next frame hides its copy there while the first glides).
// Every fade is smooth at both ends (the user, 2026-10-12: "smooth transitions", "consistent across all videos"): it is a smoothstep over ITS part of the move in the move's own
// time. The move runs on an eased clock (`ease`: fastest in the middle), so the keyframes sit where that clock gets to each moment: a fade that ends half way would otherwise
// stop at the fastest the clock goes, and be seen to snap.
const smooth = x => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };
const RAMP = 8; // samples of a fade
// A fade from `a` to `b` between the moments `t0` and `t1` of the move (0 → 1) as [moment, opacity] points.
const ramp = (a, b, t0, t1) => Array.from({length: RAMP + 1}, (_, k) => [t0 + (t1 - t0) * k / RAMP, a + (b - a) * smooth(k / RAMP)]);
const keysOf = points => points.map(([t, opacity]) => ({opacity, offset: ease(t)}));
export function fadeFrames(phase, opacity, span = 0.5) {
  const o = Number.isFinite(opacity) ? opacity : 1;
  if (phase === 'in') return keysOf([[0, 0], ...ramp(0, o, 0, span), [1, o]]);
  if (phase === 'out') return keysOf([[0, o], ...ramp(o, 0, 1 - span, 1)]);
  if (phase === 'fade-in') return keysOf(ramp(0, o, 0, 1));
  if (phase === 'fade-out') return keysOf(ramp(o, 0, 0, 1));
  if (phase === 'hide') return [{opacity: 0, offset: 0}, {opacity: 0, offset: 1}];
  if (phase === 'click-in') return keysOf([[0, 0], ...ramp(0, o, 0.3, 0.6), [1, o]]); // (a click: the screen changes after the cursor has pressed)
  if (phase === 'click-out') return keysOf([[0, o], ...ramp(o, 0, 0.3, 0.6), [1, 0]]);
  if (phase === 'quick-out') return keysOf([...ramp(o, 0, 0, 0.25), [1, 0]]);
  if (phase === 'swap-out') return keysOf([...ramp(o, 0, 0, 0.5), [1, 0]]);
  if (phase === 'swap-in') return keysOf([[0, 0], ...ramp(0, o, 0.5, 1)]);
  if (phase === 'pen-in') return keysOf([[0, 0], [0.4, 0], [0.5, o], [1, o]]); // (words a pen writes: there once the old ones are gone, so the first letters are not faint; the pen's own paragraph is hidden till it touches)
  return [{opacity: o, offset: 0}, {opacity: o, offset: 1}];
}

// ---- A part of a move (the user, 2026-10-12: "smooth transitions") ----
// A move runs on an eased clock (`ease`). Something that only starts part of the way through (the screen changes once the cursor has pressed, a swipe once the finger is
// down) must ease in and out in the TIME of the move, over its own part of it: run linearly on the eased clock it would start at the fastest the clock goes, and be seen to
// jump. The inverse of the ease, and an easing for an animation that runs over the part [t0, t1] of the move (CSS linear(): the animation's own progress, for the clock's).
export const easeInv = y => { const c = clamp(y, 0, 1); return c < 0.5 ? Math.cbrt(c / 4) : 1 - Math.cbrt(2 * (1 - c)) / 2; };
export function windowEasing(t0, t1, n = 48) {
  if (t0 <= 0 && t1 >= 1) return 'linear'; // (the whole move: the move's own ease is all it needs)
  const points = Array.from({length: n + 1}, (_, i) => Number(ease(clamp((easeInv(i / n) - t0) / Math.max(1e-6, t1 - t0), 0, 1)).toFixed(4)));
  return `linear(${points.join(', ')})`;
}
// The keyframes of something that goes from `from` to `to` over the part [t0, t1] of a move, with the easing that gives it that part.
export const windowKeys = (from, to, t0 = 0, t1 = 1) => Object.assign([{...from, offset: 0}, {...to, offset: 1}], {easing: windowEasing(t0, t1)});
// A screen taking the place of another at the moment `t0` of a move (the cursor has pressed): the new one comes in over the old over `w` of the move and the old one goes once it
// is there (covered, so the picture never dips); what is the same in both does not change, what is different is crossed. -> {old, next} keyframes.
export const takeOver = (opacity, t0, w = 0.2) => {
  const o = Number.isFinite(opacity) ? opacity : 1, t1 = Math.min(1, t0 + w), u1 = ease(t1);
  return {old: [{opacity: o, offset: 0}, {opacity: o, offset: u1}, {opacity: 0, offset: Math.min(1, u1 + 0.002)}, {opacity: 0, offset: 1}], next: keysOf([[0, 0], ...ramp(0, o, t0, t1), [1, o]])};
};

// Which of the things in one list are the things of another (the user, 2026-10-12: layout changes are animated): `a` and `b` are the looks of the items of two lists (what each is: its kind and
// its words), `kindsA` and `kindsB` only their kinds. Items with the same look are paired in order, the longest run of them, so a thing put in among the others does not make each one after it
// the one before; between two that are paired, the ones left over in each are paired in order when they are the same kind (the same card with other words: changed in place). -> [[i, j]]
export function pairLists(a, b, kindsA = a, kindsB = b) {
  const n = a.length, m = b.length, L = Array.from({length: n + 1}, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const same = [];
  for (let i = 0, j = 0; i < n && j < m;) { if (a[i] === b[j]) { same.push([i, j]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  const out = [];
  let pi = -1, pj = -1;
  for (const [i, j] of [...same, [n, m]]) {
    for (let x = pi + 1, y = pj + 1; x < i && y < j; x++, y++) if (kindsA[x] === kindsB[y]) out.push([x, y]);
    if (i < n) out.push([i, j]);
    pi = i; pj = j;
  }
  return out;
}

// The line starts on the video's timeline, as fractions of its length (for the marks on the bar):
// [{chapter, at}], one per line that has frames, in the order they play.
export function lineMarks(frames, timeline) {
  const marks = [];
  frames.forEach((frame, i) => { if (marks.at(-1)?.chapter !== frame.chapter) marks.push({chapter: frame.chapter, at: timeline.total ? timeline.items[i].start / timeline.total : 0}); });
  return marks;
}

// 1:05 for 65 seconds.
export const clock = seconds => { const s = Math.max(0, Math.round(seconds)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
