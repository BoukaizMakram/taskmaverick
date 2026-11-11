import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_VIDEOS, FINAL_BOARDS, STATUS, partsOf, statusOf, stitchTitle, stitchedBoards, stitchedComments, stitchedGroups} from './storyboardAllVideos.mjs';
import {normalizeEdits} from './storyboardEdits.mjs';

// A board of Increased Efficiency's shape (lib/sections/increased-efficiency.mjs): its lines, one slide in each.
const IDS = ['intro', 'individuals', 'teams', 'schedule', 'points', 'urgency', 'priority', 'shared', 'code', 'claim', 'close', 'execution', 'performers', 'initiative', 'conclusion'];
const captured = {chapters: IDS.map(id => ({id, title: id})), frames: IDS.map(id => ({id: `${id}/1`, chapter: id}))};

test('the board All videos has its own id; the stitched boards are Improved Quality and the sections that are not drafts, the current Increased Efficiency first (the user, 2026-10-29)', () => {
  assert.equal(ALL_VIDEOS, 'all-videos');
  const boards = stitchedBoards().map(b => b.board);
  assert.equal(boards[0], 'increased-efficiency-v3');
  assert.ok(boards.includes('improved-quality-v2'));
  assert.equal(boards.includes('increased-efficiency-v2'), false, 'the previous Increased Efficiency board is not one');
  assert.equal(new Set(boards).size, boards.length, 'each board once');
  assert.deepEqual(stitchedGroups().map(g => g.name).slice(0, 4), ['Operations', 'Training', 'Risk', 'Knowledge']);
  assert.equal(stitchTitle('Improved Quality'), 'Improved Quality · all in one');
});

test('a video says In progress until its board is put in FINAL_BOARDS', () => {
  for (const b of stitchedBoards()) assert.equal(b.status, FINAL_BOARDS.includes(b.board) ? STATUS.final : STATUS.progress);
  assert.equal(statusOf('some-board-nobody-made'), STATUS.progress);
});

test('the comments of a stitched video are in the order it plays them, numbered through the whole video (the user, 2026-10-30)', () => {
  const parts = [{id: 'a', title: 'A'}, {id: 'b', title: 'B'}];
  const edits = {comments: {A: {items: [{id: 'comment-1', at: 5}, {id: 'comment-2', at: 1}]}, B: {items: [{id: 'comment-1', at: 0}]}, Elsewhere: {items: [{id: 'comment-1', at: 0}]}}};
  assert.deepEqual(stitchedComments(parts, edits).map(r => [r.number, r.part.id, r.comment.id]), [[1, 'a', 'comment-2'], [2, 'a', 'comment-1'], [3, 'b', 'comment-1']]);
  assert.deepEqual(stitchedComments(parts, {}), []);
});

test('the parts are the videos of the line "Videos", in the order it says; the detailed videos are not in it', () => {
  const edits = normalizeEdits({lines: {added: {
    'line-1': {title: 'Videos', after: null, shelf: ['board', 'assign', 'results', 'tablet']},
    'line-2': {title: 'Videos in detail', after: 'line-1', shelf: ['assign-detail', 'board-detail']},
  }}});
  const parts = partsOf('increased-efficiency-v3', captured, edits);
  assert.deepEqual(parts.map(p => p.id), ['board', 'assign', 'results', 'tablet']);
  assert.deepEqual(parts[0].frames.map(f => f.id), ['schedule/1', 'points/1', 'urgency/1', 'priority/1'], 'the slides of the video\'s lines, one after the other');
  assert.deepEqual(parts[1].frames.map(f => f.id), ['intro/1', 'individuals/1', 'teams/1']);
});

test('a board with no line "Videos" has its videos in their own order, the Animations of Improved Quality left out', () => {
  assert.deepEqual(partsOf('increased-efficiency-v3', captured, normalizeEdits({})).map(p => p.id), ['assign', 'board', 'tablet', 'results']);
  const quality = {chapters: [{id: 'animations', title: 'Animations'}, {id: 'knowledge', title: 'Knowledge'}], frames: [{id: 'animations/1', chapter: 'animations'}, {id: 'knowledge/1', chapter: 'knowledge'}]};
  assert.deepEqual(partsOf('improved-quality-v2', quality, normalizeEdits({})).map(p => p.id), ['knowledge']);
  assert.deepEqual(partsOf('no-such-board', captured, normalizeEdits({})), []);
});

test("the canvas: the board's rows, a label for each group the size of a line's, all its videos in one line (the user, 2026-10-29: exactly like the other boards, the green the same size, not shown on the next line)", async () => {
  const {layoutAll, ALL_LAYOUT, stitchedGroups} = await import('./storyboardAllVideos.mjs');
  const groups = stitchedGroups(), {rows, cells, bounds} = layoutAll(groups);
  assert.equal(rows.length, groups.length, 'a label for each group');
  assert.equal(cells.length, groups.reduce((n, g) => n + g.entries.length, 0), 'a place for each video');
  assert.ok(rows.every(r => r.w === 1010 && r.h === 112), "the label is the size of a line's: 1010 x 112");
  for (const a of cells) for (const b of cells) if (a !== b) assert.ok(a.x >= b.x + b.w || b.x >= a.x + a.w || a.y >= b.y + b.h || b.y >= a.y + a.h, `${a.entry.board} and ${b.entry.board} do not overlap`);
  for (const r of rows) assert.ok(cells.filter(c => c.group === r.name).every(c => c.y === r.y), `${r.name}: all its videos are in one line, level with its label`);
  assert.ok(cells.every(c => c.x >= ALL_LAYOUT.labelW + ALL_LAYOUT.labelGap), 'the videos are at the right of the labels');
  assert.ok(bounds.w > 0 && bounds.h > 0);
});
