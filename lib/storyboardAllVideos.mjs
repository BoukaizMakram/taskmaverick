// All videos (the user, 2026-10-29: "make me a new section where all videos are in one place, only videos, and these videos should be stitched of only the finished ones ... merge all
// video in videos line, not in videos in details or others, just the line where it has videos on the left, stitch the whole line into one continuous video, then we start fixing it, so
// place it in the new section before fixing ... just say on top if it's final, or in progress when it comes to fixing it, for increased efficiency it will be finished after our fix, but
// for now all should be under in progress"). The board /storyboard?video=all-videos (components/StoryboardAllVideos.jsx) has no frames of its own: one video for each board that is
// finished (Improved Quality and every section that is not `draft`, in the board menu's order), which is the board's line "Videos" (the videos on the left of the line, NOT "Videos in
// detail" and its variants) played from the first to the last, one after the other. It plays the board's own slides with the board's own edits, so a slide fixed on its board is fixed
// in the stitched video too.
//   FINAL_BOARDS    the boards whose stitched video is final; every other one is "In progress". The user moves a board here when its fixing is done (one line to edit).
//   stitchedBoards  [{board, name, group, title, status}] in the board menu's order
//   partsOf         the parts of a board's stitched video, from the board's captured data and its edits: [{id (the video's id on its board), title, frames}]
//   crossOf         how the next part of a board's stitched video comes in over the one before: {seconds, curve (a CSS easing)}
import {BOARD_GROUPS, SECTIONS, SECTION_BOARDS} from './sections/index.mjs';
import {runsOf, shelvedRuns} from './storyboardVideos.mjs';
import {linesOf as boardLines, orderedFrames} from './storyboardEdits.mjs';
import {cellsOf, expandLine} from './storyboardCells.mjs';
import {commentsOf} from './storyboardComments.mjs';
import {FRAME, union} from './storyboardView.mjs';

export const ALL_VIDEOS = 'all-videos', ALL_VIDEOS_NAME = 'All videos', ALL_VIDEOS_GROUP = 'Videos'; // (the board's id, its name and the group it stands in at the top of the board menu)

// The boards whose stitched video is final. Empty for now: they are all being fixed (the user, 2026-10-29: "for increased efficiency it will be finished after our fix, but for now all
// should be under in progress"). Put a board's id here (e.g. 'increased-efficiency-v3') and its video says Final.
export const FINAL_BOARDS = [];
export const STATUS = {progress: {id: 'progress', label: 'In progress'}, final: {id: 'final', label: 'Final'}};
export const statusOf = board => (FINAL_BOARDS.includes(board) ? STATUS.final : STATUS.progress);

export const STITCH_SUFFIX = ' · all in one';
export const stitchTitle = name => `${name}${STITCH_SUFFIX}`;

// Two parts cross in 0.45 s; a section can say its own (`cross` of its spec: {move, influence}, the seconds and After Effects' Easy Ease; the user, 2026-10-30, Increased Efficiency: "on all animations same speed").
const CROSS = {seconds: 0.45, curve: 'ease'};
export const crossOf = board => { const own = SECTIONS.find(s => s.board === board)?.cross; return own ? {seconds: own.move, curve: `cubic-bezier(${own.influence}, 0, ${(1 - own.influence).toFixed(2)}, 1)`} : CROSS; };

// Improved Quality is a board of its own; the sections are SECTION_BOARDS. A section still being built (`draft`) is not finished: it has no stitched video yet. (The previous Increased
// Efficiency board is not in the list: the section's board, increased-efficiency-v3, is the current one.)
const IMPROVED_QUALITY = {id: 'improved-quality-v2', name: 'Improved Quality'};
// The videos of a board that are left out when its line "Videos" cannot be found and its videos are taken in the order of lib/storyboardVideos.mjs (Improved Quality's first one, the
// Animations, is a line of its own, not part of the story).
const NOT_STITCHED = {'improved-quality-v2': ['animations']};

export function stitchedBoards() {
  const names = new Map([[IMPROVED_QUALITY.id, IMPROVED_QUALITY.name], ...SECTION_BOARDS.filter(b => !b.draft).map(b => [b.id, b.name])]), done = new Set(), out = [];
  const add = (board, group) => { if (!names.has(board) || done.has(board)) return; done.add(board); out.push({board, name: names.get(board), group, title: stitchTitle(names.get(board)), status: statusOf(board)}); };
  for (const g of BOARD_GROUPS) for (const board of g.boards) add(board, g.name);
  for (const b of SECTION_BOARDS) add(b.id, b.group ?? 'Operations'); // (a section that is in no group of the menu is not left out)
  return out;
}
// The same by group, the groups in the menu's order: [{name, entries}]
export function stitchedGroups() {
  const by = new Map();
  for (const e of stitchedBoards()) { if (!by.has(e.group)) by.set(e.group, []); by.get(e.group).push(e); }
  return [...by].map(([name, entries]) => ({name, entries}));
}

// Where the board remembers the video open in its video editor (Storyboard.jsx `editorKey`): written before a stitched video's part is opened there, the board opens on it.
export const editorKeyOf = board => `storyboard:editor:${board}`;
// Where a stitched video is held, for a reload: {part (its id), at (the part's second)}. The part and not the whole video's second: a fix to a part before it changes where that second falls.
export const placeKeyOf = board => `storyboard:all-videos:place:${board}`;
// Which video is selected on the page, for a reload: the board's id.
export const SELECTED_KEY = 'storyboard:all-videos:selected';
// All the comments of a stitched video, in the order it plays them (its parts in their order, each by its second): [{part, comment, number}]. Each is kept on its own part (`edits.comments[<the
// part's title>]`), but a stitched video is one video: `number` runs through all of it, and it is the number on the pin and in the inspector.
export const stitchedComments = (parts, edits) => parts
  .flatMap(part => [...commentsOf(edits, part.title)].sort((a, b) => a.at - b.at).map(comment => ({part, comment})))
  .map((row, i) => ({...row, number: i + 1}));

// The videos of the line "Videos" of a board, in the order they stand in it (the line the user made with line-shelf: the videos side by side on the left, not the detailed ones, which
// are in lines of their own), as runs. A board with no such line (or an empty one) has its videos in the order of lib/storyboardVideos.mjs. `runs`: runsOf(board, lines, true).
function stitchOrder(board, edits, runs) {
  const own = runs.filter(r => !r.twin), added = edits.lines?.added ?? {}, titles = edits.lines?.titles ?? {}, gone = new Set(edits.lines?.deleted ?? []);
  const shelved = shelvedRuns(added, board, new Set(own.map(r => r.id))), byLine = new Map();
  for (const [id, s] of shelved) { if (!byLine.has(s.line)) byLine.set(s.line, []); byLine.get(s.line).push({id, index: s.index}); }
  for (const [line, list] of byLine) {
    if (gone.has(line) || String(titles[line] ?? added[line]?.title ?? '').trim().toLowerCase() !== 'videos') continue;
    return list.sort((a, b) => a.index - b.index).map(x => own.find(r => r.id === x.id)).filter(Boolean);
  }
  const skip = NOT_STITCHED[board] ?? [];
  return own.filter(r => !skip.includes(r.id));
}

// The parts of a board's stitched video: each video of its "Videos" line with the slides it plays, as the board lays them out (the same frames the board's own player is handed:
// the slides of the lines of the video, a line of videos in place of its slides; components/Storyboard.jsx `videoRuns`). `video`: the board's captured data (public/storyboard/<board>.json),
// `edits`: its edits (normalizeEdits). -> [{id, title, frames}], the ones with no slides left out.
export function partsOf(board, video, edits) {
  const lineIds = boardLines(video.chapters, edits).map(l => l.id), all = orderedFrames(video.frames, edits, lineIds), cells = cellsOf(edits, all);
  const byId = Object.fromEntries(all.map(f => [f.id, f])), by = new Map();
  for (const f of cells.hidden.size ? all.filter(f => !cells.hidden.has(f.id)) : all) { if (!by.has(f.chapter)) by.set(f.chapter, []); by.get(f.chapter).push(f); }
  return stitchOrder(board, edits, runsOf(board, lineIds, true))
    .map(run => ({id: run.id, title: run.title, frames: run.lines.flatMap(id => expandLine(by.get(id) ?? [], cells, byId))}))
    .filter(part => part.frames.length);
}

// The board's canvas (the user, 2026-10-29: "the all video board should be like the other boards, with figma style paning etc"; then "make it exactly like the other boards ... the green should stay same
// size just don't show it next line"): the board's own rows. A green label for each group at the left, the size of a line's (1010 x 112, level with the bars), and ALL the group's videos in ONE line at
// its right, side by side, each as a video of a board is placed (the purple bar, 188 px under it the picture 1600 x 900, 40 px under that the bar of its controls). All in the board's own world px.
// -> {rows: [{name, x, y, w, h}], cells: [{entry, group, x, y, w, h}], bounds}
export const ALL_LAYOUT = {labelW: 1010, labelGap: 135, gapX: 107, head: 112, headGap: 188, barGap: 40, bar: 230, rowGap: 260};
export const cellHeight = (L = ALL_LAYOUT) => L.head + L.headGap + FRAME.h + L.barGap + L.bar;
export function layoutAll(groups, L = ALL_LAYOUT) {
  const x0 = L.labelW + L.labelGap, height = cellHeight(L), pitch = height + L.rowGap, rows = [], cells = [];
  groups.forEach((g, row) => {
    const y = row * pitch;
    rows.push({name: g.name, x: 0, y, w: L.labelW, h: L.head});
    g.entries.forEach((entry, i) => cells.push({entry, group: g.name, x: x0 + i * (FRAME.w + L.gapX), y, w: FRAME.w, h: height}));
  });
  return {rows, cells, bounds: union([...rows, ...cells.map(c => ({x: c.x, y: c.y, w: c.w, h: c.h}))])};
}
