import test from 'node:test';
import assert from 'node:assert/strict';
import {moveLayers, moveLine, reorderKeys, setLineShelf} from './storyboardEdits.mjs';
import {EMPTY, setNote, setMove, setText, setTip, resetFrame, hasChanges, noteOf, normalizeEdits, mergeEdits, createHistory, record, undo, redo, layersOf, hideLayer, addInserts, removeInsert, addCopy, removeCopy, deleteFrame, isDeleted, isCopy, linesOf, addLine, renameLine, hideLine, duplicateLine, addBlankIn, intoLine, makeExport, readExport, scaledLineHeight, setAnim, animOf, animSeconds, animCps, letterCount, wordCount, hasAnim, setLock, lockOf, sizeBubbles, setBubble, bubbleOf, setTails, setSize, setStyle, styleOf, styleValue, resetAsset, isBlank, addBlank, orderedFrames, moveInList, moveFrame, rowsOf} from './storyboardEdits.mjs';
import {bubbleShape} from './storyboardBubble.mjs';

const T1 = '2026-10-01T10:00:00.000Z', T2 = '2026-10-01T11:00:00.000Z';
const layer = (key, extra = {}) => ({key, name: key, kind: 'dom', asset: `h-${key}`, box: {x: 0, y: 0, w: 10, h: 10}, ...extra});
const frame = (id, chapter, kind = 'hand', layers = [layer('mission')]) => ({id, chapter, kind, label: id, time: 1, bubble: null, thumb: `/t/${id}.jpg`, scene: {id: chapter, view: null}, layers});

test('a note, a move, a text and a tail move are kept per frame', () => {
  let e = setNote(EMPTY, 'a/1', 'the hand comes out of the bubble', T1);
  e = setMove(e, 'a/1', 'mission', [12, -4], T1);
  e = setText(e, 'a/1', 'bubble', 'Teams work', T1);
  e = setTip(e, 'a/1', 'bubble', [5, 6], T1);
  assert.equal(noteOf(e, 'a/1'), 'the hand comes out of the bubble');
  assert.deepEqual(e.frames['a/1'].moves, {mission: [12, -4]});
  assert.equal(e.frames['a/1'].texts.bubble, 'Teams work');
  assert.deepEqual(e.frames['a/1'].tips, {bubble: [5, 6]});
  assert.ok(hasChanges(e, 'a/1'));
  assert.equal(EMPTY.frames['a/1'], undefined, 'the original is untouched');
});

test('putting something back where it was removes the edit', () => {
  let e = setMove(EMPTY, 'a/1', 'mission', [3, 3], T1);
  e = setMove(e, 'a/1', 'mission', [0, 0], T2);
  assert.deepEqual(e.frames, {}, 'nothing left, so no record');
  e = setNote(setNote(EMPTY, 'a/1', 'x', T1), 'a/1', '', T2);
  assert.deepEqual(e.frames, {});
  e = setTip(setTip(EMPTY, 'a/1', 'bubble', [1, 1], T1), 'a/1', 'bubble', [0, 0], T2);
  assert.deepEqual(e.frames, {});
});

test('resetting a frame puts its assets back and keeps its note', () => {
  let e = setNote(EMPTY, 'a/1', 'keep me', T1);
  e = setMove(e, 'a/1', 'hand', [9, 9], T1);
  e = setText(e, 'a/1', 'bubble', 'x', T1);
  e = setTip(e, 'a/1', 'bubble', [1, 1], T1);
  e = hideLayer(e, 'a/1', 'ripple', T1);
  e = resetFrame(e, 'a/1', T2);
  assert.equal(noteOf(e, 'a/1'), 'keep me');
  assert.ok(!hasChanges(e, 'a/1'));
});

test('an asset can be taken out of a frame, and others brought in', () => {
  const f = frame('a/1', 'a', 'hand', [layer('mission'), layer('hand')]);
  let e = hideLayer(EMPTY, 'a/1', 'hand', T1);
  assert.deepEqual(layersOf(f, e.frames['a/1']).map(l => l.key), ['mission']);
  e = addInserts(e, 'a/1', [layer('a1-circle', {asset: 'hX'})], {hX: '<i data-sb-root="a1-circle"></i>'}, T1);
  assert.deepEqual(layersOf(f, e.frames['a/1']).map(l => l.key), ['mission', 'a1-circle']);
  assert.ok(e.library.hX);
  e = removeInsert(e, 'a/1', 'a1-circle', T2);
  assert.deepEqual(layersOf(f, e.frames['a/1']).map(l => l.key), ['mission']);
  assert.equal(e.library.hX, undefined, 'its HTML is not kept');
});

test('a duplicate sits right after its frame, with the same changes but not the note', () => {
  let e = setMove(setNote(EMPTY, 'a/2', 'note', T1), 'a/2', 'mission', [4, 5], T1);
  const {id, edits} = addCopy(e, {from: 'a/2', after: 'a/2', inherit: 'a/2'}, T2);
  assert.equal(id, 'a/2#2');
  assert.ok(isCopy(edits, id) && !isCopy(edits, 'a/2'));
  assert.deepEqual(edits.frames[id].moves, {mission: [4, 5]});
  assert.equal(edits.frames[id].note, undefined);
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('a/3', 'a'), frame('b/1', 'b')];
  assert.deepEqual(orderedFrames(base, edits).map(f => f.id), ['a/1', 'a/2', 'a/2#2', 'a/3', 'b/1']);
  assert.equal(orderedFrames(base, edits)[2].chapter, 'a');
  assert.equal(orderedFrames(base, edits)[2].isCopy, true);
  // edits to the copy are separate from the original's
  const moved = setMove(edits, id, 'mission', [100, 0], T2);
  assert.deepEqual(moved.frames['a/2'].moves, {mission: [4, 5]});
});

test('more duplicates: the newest follows the original, a copy of a copy follows the copy', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a')];
  let e = EMPTY;
  const first = addCopy(e, {from: 'a/1', after: 'a/1', inherit: 'a/1'}); e = first.edits;
  const second = addCopy(e, {from: 'a/1', after: 'a/1', inherit: 'a/1'}); e = second.edits;
  const third = addCopy(e, {from: first.id, after: first.id, inherit: first.id}); e = third.edits;
  assert.deepEqual([first.id, second.id, third.id], ['a/1#2', 'a/1#3', 'a/1#4']);
  assert.equal(e.copies[third.id].from, 'a/1', 'a copy of a copy shows the original picture');
  assert.deepEqual(orderedFrames(base, e).map(f => f.id), ['a/1', 'a/1#3', 'a/1#2', 'a/1#4', 'a/2']);
});

test('removing a duplicate takes it out and lets the frames after it follow what it followed', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a')];
  let e = EMPTY;
  const one = addCopy(e, {from: 'a/1', after: 'a/1'}); e = one.edits;
  const two = addCopy(e, {from: 'a/1', after: one.id}); e = two.edits;
  e = setNote(e, one.id, 'gone', T1);
  e = removeCopy(e, one.id);
  assert.equal(e.frames[one.id], undefined);
  assert.deepEqual(orderedFrames(base, e).map(f => f.id), ['a/1', two.id, 'a/2']);
  assert.equal(removeCopy(e, 'a/1'), e, 'a captured frame cannot be removed');
});

test('deleting a frame: a captured one is hidden, a duplicate is removed, and undo brings either back', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('b/1', 'b')];
  let e = addCopy(EMPTY, {from: 'a/1', after: 'a/1'}).edits; // a/1#2 follows a/1
  e = addCopy(e, {from: 'a/1', after: 'a/1#2'}).edits;       // a/1#3 follows a/1#2
  const ids = edits => orderedFrames(base, edits).map(f => f.id);
  assert.deepEqual(ids(e), ['a/1', 'a/1#2', 'a/1#3', 'a/2', 'b/1']);
  const deleted = deleteFrame(e, 'a/1');
  assert.deepEqual(deleted.deleted, ['a/1']);
  assert.equal(isDeleted(deleted, 'a/1'), true);
  assert.deepEqual(ids(deleted), ['a/1#2', 'a/1#3', 'a/2', 'b/1'], 'only the captured frame leaves; the duplicates made from it stay where they were');
  assert.equal(orderedFrames(base, deleted)[0].layers, base[0].layers, 'a duplicate still shows the picture it was made from');
  assert.equal(deleteFrame(deleted, 'a/1'), deleted, 'deleting it twice changes nothing');
  const gone = deleteFrame(deleted, 'a/1#2');
  assert.equal(gone.copies['a/1#2'], undefined, 'a duplicate is removed');
  assert.deepEqual(ids(gone), ['a/1#3', 'a/2', 'b/1'], 'the frame after it follows what it followed');
  // a row you ordered by hand drops the deleted frame too
  const ordered = {...EMPTY, rows: {a: ['a/2', 'a/1'], b: ['b/1']}};
  assert.deepEqual(ids(deleteFrame(ordered, 'a/1')), ['a/2', 'b/1']);
  // undo
  const h = record(createHistory(e), deleteFrame(e, 'a/2'));
  assert.deepEqual(undo(h).present.deleted, []);
  assert.deepEqual(ids(undo(h).present), ['a/1', 'a/1#2', 'a/1#3', 'a/2', 'b/1']);
});

test('the deleted frames and the Trash survive a save and a load, and merge without losing any', () => {
  const trash = {id: 't1', video: 'v', videoName: 'Video', chapter: 'a', chapterTitle: 'Alerts', label: 'Words', time: 3.2, from: 'a/1', deletedAt: T1, look: {shell: 's', stageClass: 'c', stageStyle: '--x: 1;', scene: {id: 'a', view: 'mission'}}};
  const e = normalizeEdits(JSON.parse(JSON.stringify({...EMPTY, deleted: ['a/1', 'a/1', 7], trash: [trash, trash, {id: 'bad'}, {video: 'v'}]})));
  assert.deepEqual(e.deleted, ['a/1'], 'a list of frame ids, each once');
  assert.deepEqual(e.trash, [trash], 'each trashed frame once, the broken ones dropped');
  assert.deepEqual(normalizeEdits({frames: {}, trash: [{id: 't2', video: 'v'}]}).trash[0].look.scene, {id: null, view: null});
  const merged = mergeEdits({...EMPTY, deleted: ['a/1'], trash: [trash]}, {...EMPTY, deleted: ['a/2'], trash: [trash, {...trash, id: 't2'}]});
  assert.deepEqual(merged.edits.deleted, ['a/1', 'a/2']);
  assert.deepEqual(merged.edits.trash.map(t => t.id), ['t1', 't2']);
  assert.ok(merged.changed);
  assert.equal(mergeEdits({...EMPTY, deleted: ['a/1'], trash: [trash]}, {...EMPTY, deleted: ['a/1'], trash: [trash]}).changed, false);
});

test('edits from a file or the browser are cleaned', () => {
  const e = normalizeEdits({frames: {'a/1': {note: 'ok', moves: {mission: [1, 2], bad: [1], worse: ['x', 2]}, texts: {bubble: 'hi', no: 5}, tip: [3, 4], hidden: ['hand', 7], junk: true, inserts: [layer('a1-x', {asset: 'hX'}), {nope: true}]}, 'b/1': 'nope', 'c/1': {}}, copies: {'a/1#2': {from: 'a/1', after: 'a/1'}, bad: {from: 1}}, library: {hX: '<b></b>', hY: '<unused/>', bad: 5}});
  assert.deepEqual(Object.keys(e.frames), ['a/1']);
  assert.deepEqual(e.frames['a/1'].moves, {mission: [1, 2]});
  assert.deepEqual(e.frames['a/1'].texts, {bubble: 'hi'});
  assert.deepEqual(e.frames['a/1'].tips, {bubble: [3, 4]}, 'the old single tail point is the bubble\'s');
  assert.deepEqual(e.frames['a/1'].hidden, ['hand']);
  assert.equal(e.frames['a/1'].inserts.length, 1);
  assert.deepEqual(Object.keys(e.copies), ['a/1#2']);
  assert.deepEqual(Object.keys(e.library), ['hX'], 'only what an asset uses is kept');
  assert.deepEqual(normalizeEdits(null), EMPTY);
  assert.deepEqual(normalizeEdits({frames: [1]}), EMPTY);
});

test('two copies merge: the newest edit per frame wins and nothing is lost', () => {
  const file = {...EMPTY, frames: {'a/1': {note: 'old', updatedAt: T1}, 'b/1': {note: 'only in the file', updatedAt: T1}}, copies: {'a/1#2': {from: 'a/1', after: 'a/1'}}};
  const browser = {...EMPTY, frames: {'a/1': {note: 'new', updatedAt: T2}, 'c/1': {note: 'only here', updatedAt: T1}}, copies: {'b/1#2': {from: 'b/1', after: 'b/1'}}};
  const {edits, changed} = mergeEdits(file, browser);
  assert.equal(edits.frames['a/1'].note, 'new');
  assert.equal(edits.frames['b/1'].note, 'only in the file');
  assert.equal(edits.frames['c/1'].note, 'only here');
  assert.deepEqual(Object.keys(edits.copies).sort(), ['a/1#2', 'b/1#2']);
  assert.ok(changed);
  assert.equal(mergeEdits(file, file).changed, false);
});

test('undo and redo walk through the steps; typing in one place is one step', () => {
  let h = createHistory(EMPTY);
  h = record(h, setMove(h.present, 'a/1', 'hand', [1, 1]), {at: 0});
  h = record(h, setNote(h.present, 'a/1', 'h'), {merge: 'note:a/1', at: 10000});
  h = record(h, setNote(h.present, 'a/1', 'he'), {merge: 'note:a/1', at: 10200});
  h = record(h, setNote(h.present, 'a/1', 'hey'), {merge: 'note:a/1', at: 10400});
  assert.equal(h.past.length, 2, 'the move, then the note typed as one step');
  h = undo(h);
  assert.equal(noteOf(h.present, 'a/1'), '');
  assert.ok(h.present.frames['a/1'].moves);
  h = undo(h);
  assert.deepEqual(h.present.frames, {});
  assert.equal(undo(h), h, 'nothing before the start');
  h = redo(redo(h));
  assert.equal(noteOf(h.present, 'a/1'), 'hey');
  assert.equal(redo(h), h);
  assert.equal(record(h, h.present), h, 'no change, no step');
  const later = record(h, setNote(h.present, 'a/1', 'hey!'), {merge: 'note:a/1', at: 99999});
  assert.equal(later.past.length, h.past.length + 1, 'a long pause starts a new step');
  // a duplicate can be undone too
  const dup = record(createHistory(EMPTY), addCopy(EMPTY, {from: 'a/1', after: 'a/1'}).edits);
  assert.deepEqual(undo(dup).present.copies, {});
});

test('the chat bubble is drawn as a tail alone, an empty bubble, or the bubble with its words', () => {
  const rect = {x: 900, y: 300, w: 300, h: 90}, tip = {x: 560, y: 380};
  const words = bubbleShape({rect, tip, mode: 'words'}), empty = bubbleShape({rect, tip, mode: 'empty'}), tail = bubbleShape({rect, tip, mode: 'tail'});
  assert.equal(words.svg, empty.svg, 'the bubble is the same with or without words');
  assert.ok(words.hasTail);
  const count = s => (s.match(/<path/g) ?? []).length;
  assert.equal(count(words.svg), 4);
  assert.equal(count(tail.svg), 2, 'only the tail: its outline and its fill');
  assert.ok(!tail.svg.includes('H'), 'no rounded-rectangle body in it');
  assert.equal(count(bubbleShape({rect, tip: null, mode: 'tail'}).svg), 0, 'no tail to show');
  assert.ok(bubbleShape({rect, tip: null, mode: 'words', style: 'box'}).svg.length > 0, 'a boxed bubble has no tail but still a body');
  assert.ok(words.outer.w > rect.w, 'the bubble is wider than its words');
  assert.doesNotMatch(words.svg, /NaN|undefined/);
  // a tail on its way out (the hand coming out of the bubble) and a tail fading
  const half = bubbleShape({rect, tip, reach: 0.5}), fading = bubbleShape({rect, tip, tailOpacity: 0.65});
  assert.ok(half.hasTail && count(half.svg) === 4 && half.svg !== words.svg, 'halfway: a shorter tail');
  assert.ok(fading.hasTail && /<g opacity="0.65">/.test(fading.svg) && count(fading.svg) === 6, 'fading: the bubble with its tail fades over the closed bubble');
  assert.equal(count(bubbleShape({rect, tip, tailOpacity: 0}).svg), 2, 'faded out: the closed bubble');
  // kept when a captured bubble is copied onto a frame
  const kept = normalizeEdits({frames: {'a/1': {inserts: [{key: 'b1', name: 'Chat bubble', kind: 'bubble', asset: 'hB', tip: [1, 2], reach: 0.5, tailOpacity: 0.65}, {key: 'b2', name: 'Chat bubble', kind: 'bubble', asset: 'hB', tip: [1, 2], reach: 7}]}}, library: {hB: '<p></p>'}}).frames['a/1'].inserts;
  assert.deepEqual([kept[0].reach, kept[0].tailOpacity, kept[1].reach], [0.5, 0.65, undefined]);
});

test('a blank frame goes in right after a frame, in its row, and can be removed', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('b/1', 'b')];
  const {id, edits} = addBlank(EMPTY, 'a/1', T1);
  assert.equal(id, 'blank-1');
  assert.ok(isCopy(edits, id) && isBlank(edits, id));
  const out = orderedFrames(base, edits);
  assert.deepEqual(out.map(f => f.id), ['a/1', 'blank-1', 'a/2', 'b/1']);
  const blank = out[1];
  assert.equal(blank.chapter, 'a');
  assert.equal(blank.isBlank, true);
  assert.deepEqual(blank.layers, []);
  assert.equal(blank.thumb, null);
  // a second one: the next number, and the newest sits right after the frame
  const second = addBlank(edits, 'a/1', T2);
  assert.equal(second.id, 'blank-2');
  assert.deepEqual(orderedFrames(base, second.edits).map(f => f.id), ['a/1', 'blank-2', 'blank-1', 'a/2', 'b/1']);
  // things can be brought into it, and a duplicate of it is a blank frame too (with them)
  const filled = addInserts(edits, id, [layer('p1-alert', {asset: 'hA'})], {hA: '<i data-sb-root="p1-alert"></i>'}, T1);
  const copy = addCopy(filled, {from: id, after: id, inherit: id}, T2);
  assert.ok(isBlank(copy.edits, copy.id));
  assert.equal(copy.edits.frames[copy.id].inserts.length, 1);
  assert.deepEqual(orderedFrames(base, copy.edits).map(f => f.id), ['a/1', 'blank-1', copy.id, 'a/2', 'b/1']);
  // removing it takes its things with it
  const gone = removeCopy(filled, id);
  assert.deepEqual(orderedFrames(base, gone).map(f => f.id), ['a/1', 'a/2', 'b/1']);
  assert.deepEqual(gone.library, {});
  // it survives the file and the browser
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(edits))).copies, {'blank-1': {from: null, after: 'a/1'}});
});

test('moving a frame keeps the new order, renumbers by position, and takes its note along', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('a/3', 'a'), frame('b/1', 'b')];
  let e = setNote(EMPTY, 'a/1', 'goes with the slide', T1);
  e = moveFrame(e, orderedFrames(base, e), 'a/1', 'a', 2); // between a/3 and the end: third
  assert.deepEqual(orderedFrames(base, e).map(f => f.id), ['a/2', 'a/3', 'a/1', 'b/1']);
  assert.equal(noteOf(e, 'a/1'), 'goes with the slide', 'the note is kept by the frame, not its place');
  // to the front, and to another row
  e = moveFrame(e, orderedFrames(base, e), 'a/1', 'a', 0);
  assert.deepEqual(orderedFrames(base, e).map(f => f.id), ['a/1', 'a/2', 'a/3', 'b/1']);
  e = moveFrame(e, orderedFrames(base, e), 'a/2', 'b', 0);
  const out = orderedFrames(base, e);
  assert.deepEqual(out.map(f => f.id), ['a/1', 'a/3', 'a/2', 'b/1']);
  assert.deepEqual(out.map(f => f.chapter), ['a', 'a', 'b', 'b'], 'a/2 now belongs to row b');
  assert.deepEqual(rowsOf(out), {a: ['a/1', 'a/3'], b: ['a/2', 'b/1']});
  // a row can be emptied
  e = moveFrame(e, orderedFrames(base, e), 'b/1', 'a', 5);
  assert.deepEqual(rowsOf(orderedFrames(base, e)).b, ['a/2']);
});

test('frames picked together move together, side by side, in their board order', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('a/3', 'a'), frame('a/4', 'a'), frame('b/1', 'b')];
  let e = setNote(EMPTY, 'a/3', 'keeps its note', T1);
  // picked in any order, they keep the order of the board; `index` counts the frames that stay
  e = moveFrame(e, orderedFrames(base, e), ['a/3', 'a/1'], 'a', 1);
  assert.deepEqual(orderedFrames(base, e).map(f => f.id), ['a/2', 'a/1', 'a/3', 'a/4', 'b/1']);
  assert.equal(noteOf(e, 'a/3'), 'keeps its note');
  // to another row, all of them belong to it from then on
  e = moveFrame(e, orderedFrames(base, e), ['a/2', 'a/4'], 'b', 0);
  const out = orderedFrames(base, e);
  assert.deepEqual(out.map(f => f.id), ['a/1', 'a/3', 'a/2', 'a/4', 'b/1']);
  assert.deepEqual(out.map(f => f.chapter), ['a', 'a', 'b', 'b', 'b']);
  // past the end, and into an empty row
  assert.deepEqual(moveInList(base, ['a/1', 'a/2'], 'a', 99).map(f => f.id), ['a/3', 'a/4', 'a/1', 'a/2', 'b/1']);
  assert.deepEqual(moveInList(base, ['a/1', 'a/2'], 'c', 0).map(f => `${f.id}:${f.chapter}`), ['a/3:a', 'a/4:a', 'b/1:b', 'a/1:c', 'a/2:c']);
  // a group that is already where it is changes nothing; a name that is not a frame is ignored
  assert.equal(moveFrame(EMPTY, orderedFrames(base, EMPTY), ['a/2', 'a/3'], 'a', 1), EMPTY);
  assert.deepEqual(moveInList(base, ['a/4', 'nope'], 'a', 0).map(f => f.id), ['a/4', 'a/1', 'a/2', 'a/3', 'b/1']);
  assert.equal(moveInList(base, [], 'a', 0), base);
});

test('dropping a frame where it already is changes nothing (no history step)', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('b/1', 'b')];
  const same = moveFrame(EMPTY, orderedFrames(base, EMPTY), 'a/1', 'a', 0);
  assert.equal(same, EMPTY);
  const next = moveFrame(EMPTY, orderedFrames(base, EMPTY), 'a/2', 'a', 1);
  assert.equal(next, EMPTY, 'index counts the others: a/2 after a/1 is where it is');
  assert.equal(moveInList(base, 'nope', 'a', 0), base);
});

test('frames added after a reorder go in next to their frame, and removing one takes it out of the order', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('a/3', 'a')];
  let e = moveFrame(EMPTY, orderedFrames(base, EMPTY), 'a/3', 'a', 0); // a/3 a/1 a/2
  const blank = addBlank(e, 'a/1');
  assert.deepEqual(orderedFrames(base, blank.edits).map(f => f.id), ['a/3', 'a/1', blank.id, 'a/2']);
  const copy = addCopy(blank.edits, {from: 'a/3', after: 'a/3', inherit: 'a/3'});
  assert.deepEqual(orderedFrames(base, copy.edits).map(f => f.id), ['a/3', copy.id, 'a/1', blank.id, 'a/2']);
  const gone = removeCopy(copy.edits, blank.id);
  assert.deepEqual(orderedFrames(base, gone).map(f => f.id), ['a/3', copy.id, 'a/1', 'a/2']);
  assert.ok(!gone.rows.a.includes(blank.id));
});

test('a frame missing from the saved order goes to the end of its own row; the order survives the file', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('b/1', 'b')];
  const e = normalizeEdits({rows: {a: ['a/2', 'a/2', 'ghost'], b: ['b/1']}});
  assert.deepEqual(e.rows.a, ['a/2', 'ghost'], 'repeats go');
  assert.deepEqual(orderedFrames(base, e).map(f => f.id), ['a/2', 'a/1', 'b/1']);
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(e))).rows, e.rows);
  const merged = mergeEdits(EMPTY, e);
  assert.deepEqual(merged.edits.rows, e.rows);
  assert.ok(merged.changed);
});

test('lines: the chapters, the ones you add (right after the one you add them after), renamed and deleted ones', () => {
  const chapters = [{id: 'a', title: 'Alerts'}, {id: 'b', title: 'Links'}];
  let e = EMPTY;
  const one = addLine(e, {after: 'a', title: 'Extra'}); e = one.edits;
  const two = addLine(e, {after: one.id}); e = two.edits;
  const first = addLine(e, {after: null, title: 'Intro'}); e = first.edits;
  assert.deepEqual(linesOf(chapters, e).map(l => [l.id, l.title, l.added]), [[first.id, 'Intro', true], ['a', 'Alerts', false], [one.id, 'Extra', true], [two.id, 'New line', true], ['b', 'Links', false]]);
  e = renameLine(e, 'b', 'Outside links');
  e = hideLine(e, one.id);
  assert.deepEqual(linesOf(chapters, e).map(l => l.title), ['Intro', 'Alerts', 'New line', 'Outside links'], 'a line added after a deleted one stays');
  const saved = normalizeEdits(JSON.parse(JSON.stringify(e)));
  assert.deepEqual(saved.lines, e.lines, 'they survive a save');
  const merged = mergeEdits(EMPTY, e).edits;
  assert.deepEqual(linesOf(chapters, merged).map(l => l.title), ['Intro', 'Alerts', 'New line', 'Outside links']);
});

test('a line dragged to another place keeps it: lines added later still go right after the line they follow', () => {
  const chapters = [{id: 'a', title: 'A'}, {id: 'b', title: 'B'}, {id: 'c', title: 'C'}];
  const ids = e => linesOf(chapters, e).map(l => l.id);
  assert.equal(moveLine(EMPTY, ids(EMPTY), 'b', 1), EMPTY, 'no change: the same edits');
  let e = moveLine(EMPTY, ids(EMPTY), 'c', 0);
  assert.deepEqual(ids(e), ['c', 'a', 'b']);
  e = moveLine(e, ids(e), 'c', 5);
  assert.deepEqual(ids(e), ['a', 'b', 'c'], 'past the end: last');
  e = moveLine(e, ids(e), 'a', 1);
  assert.deepEqual(ids(e), ['b', 'a', 'c']);
  const extra = addLine(e, {after: 'a', title: 'Extra'}); e = extra.edits;
  assert.deepEqual(ids(e), ['b', 'a', extra.id, 'c'], 'a new line follows the one it was added after');
  const first = addLine(e, {after: null, title: 'Intro'}); e = first.edits;
  assert.deepEqual(ids(e), [first.id, 'b', 'a', extra.id, 'c']);
  e = hideLine(e, 'b');
  assert.deepEqual(ids(e), [first.id, 'a', extra.id, 'c'], 'a deleted line leaves the order');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(e))).lines.order, e.lines.order, 'the order survives a save');
  assert.deepEqual(linesOf(chapters, mergeEdits(EMPTY, e).edits).map(l => l.id), ids(e), 'and a merge');
});

test('an empty line gets a blank frame of its own; a line is duplicated with its frames, notes and changes', () => {
  const base = [frame('a/1', 'a'), frame('a/2', 'a'), frame('b/1', 'b')], chapters = [{id: 'a', title: 'A'}, {id: 'b', title: 'B'}];
  let e = setNote(setMove(EMPTY, 'a/1', 'mission', [5, 5], T1), 'a/1', 'first', T1);
  const line = addLine(e, {after: 'a'}); e = line.edits;
  const ids = () => orderedFrames(base, e, linesOf(chapters, e).map(l => l.id)).map(f => `${f.chapter}:${f.id}`);
  const blank = addBlankIn(e, line.id); e = blank.edits;
  assert.deepEqual(ids(), ['a:a/1', 'a:a/2', `${line.id}:${blank.id}`, 'b:b/1']);
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(e))).copies[blank.id], {from: null, after: null, row: line.id}, 'it survives a save');
  const lineA = linesOf(chapters, e).find(l => l.id === 'a'), framesA = orderedFrames(base, e).filter(f => f.chapter === 'a');
  const dup = duplicateLine(e, lineA, framesA); e = dup.edits;
  assert.deepEqual(linesOf(chapters, e).map(l => l.title), ['A', 'A copy', 'New line', 'B']);
  assert.deepEqual(ids(), ['a:a/1', 'a:a/2', `${dup.id}:a/1#2`, `${dup.id}:a/2#2`, `${line.id}:${blank.id}`, 'b:b/1'], 'the copies sit in the new line, in order');
  assert.deepEqual([e.frames['a/1#2'].note, e.frames['a/1#2'].moves], ['first', {mission: [5, 5]}]);
  // frames pasted onto a line go to its end
  const moved = intoLine(e, ['b/1'], line.id);
  assert.deepEqual(orderedFrames(base, moved, linesOf(chapters, moved).map(l => l.id)).filter(f => f.chapter === line.id).map(f => f.id), [blank.id, 'b/1']);
  // a deleted line's frames are not on the board
  e = hideLine(e, dup.id);
  assert.ok(!ids().some(x => x.startsWith(dup.id)));
});

test('an export holds every board, editable; reading it keeps the known boards, cleaned, and refuses anything else', () => {
  const one = setNote(EMPTY, 'a/1', 'hello', T1), file = JSON.parse(JSON.stringify(makeExport({'improved-quality-v2': one, trash: EMPTY, nope: one}, T2)));
  assert.equal(file.exportedAt, T2);
  const boards = readExport(file, ['improved-quality-v2', 'increased-efficiency-v2', 'trash']);
  assert.deepEqual(boards.map(([id]) => id), ['improved-quality-v2', 'trash']);
  assert.equal(boards[0][1].frames['a/1'].note, 'hello');
  assert.deepEqual(readExport({boards: {trash: EMPTY}}, ['trash']), [], 'not without its mark');
  assert.deepEqual(readExport(null, ['trash']), []);
});

test('locks: a width, a height or both, kept, cleaned, copied with a duplicate, taken off with Put back', () => {
  let e = setLock(EMPTY, 'a/1', 'bubble', 'hw', T1);
  assert.deepEqual([e.frames['a/1'].locks, lockOf(e, 'a/1', 'bubble')], [{bubble: 'wh'}, {w: true, h: true}]);
  e = setLock(e, 'a/1', 'bubble', 'w', T1);
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify({...e, frames: {'a/1': {...e.frames['a/1'], locks: {bubble: 'w', bad: 'x'}}}}))).frames['a/1'].locks, {bubble: 'w'});
  const dup = addCopy(e, {from: 'a/1', after: 'a/1', inherit: 'a/1'}, T2);
  assert.deepEqual(dup.edits.frames[dup.id].locks, {bubble: 'w'});
  assert.equal(setLock(e, 'a/1', 'bubble', '', T2).frames['a/1'], undefined, 'unlocked, nothing left');
  assert.deepEqual(lockOf(resetAsset(e, 'a/1', 'bubble', T2), 'a/1', 'bubble'), {w: false, h: false});
});

test('a chat box: its tail off, its words shown or hidden; every tail of a board at once', () => {
  const bubble = (key, extra = {}) => layer(key, {kind: 'bubble', style: 'yellow', tip: [10, 10], ...extra});
  const base = [frame('a/1', 'a', 'words', [layer('mission'), bubble('bubble')]), frame('a/2', 'a', 'bubble', [bubble('bubble')])];
  let e = setBubble(EMPTY, 'a/2', 'bubble', {words: true}, T1);
  assert.deepEqual(bubbleOf(e, 'a/2', 'bubble'), {words: true});
  assert.ok(hasChanges(e, 'a/2'), 'a change to the frame');
  e = setTails(e, orderedFrames(base, e), false, T2);
  assert.deepEqual([bubbleOf(e, 'a/1', 'bubble'), bubbleOf(e, 'a/2', 'bubble')], [{tail: false}, {words: true, tail: false}]);
  assert.equal(bubbleOf(e, 'a/1', 'mission').tail, undefined, 'only chat boxes');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify({...e, frames: {...e.frames, 'a/3': {bubbles: {bubble: {tail: true, words: 'x'}}}}}))).frames['a/2'].bubbles, {bubble: {words: true, tail: false}});
  e = setTails(e, orderedFrames(base, e), true, T2);
  assert.deepEqual([bubbleOf(e, 'a/1', 'bubble'), bubbleOf(e, 'a/2', 'bubble')], [{}, {words: true}], 'tails back as captured');
  assert.deepEqual(bubbleOf(resetAsset(e, 'a/2', 'bubble', T2), 'a/2', 'bubble'), {});
});

test('every chat bubble of a board a given width, its height as it was, its width locked', () => {
  const bubble = (key, extra = {}) => layer(key, {kind: 'bubble', style: 'yellow', ...extra});
  const base = [frame('a/1', 'a', 'words', [layer('mission'), bubble('bubble')]), frame('a/2', 'a', 'words', [bubble('bubble')])];
  let e = setSize(EMPTY, 'a/2', 'bubble', [250, 140], T1);
  e = sizeBubbles(e, orderedFrames(base, e), 300, {at: T2});
  assert.deepEqual([e.frames['a/1'].sizes, e.frames['a/2'].sizes], [{bubble: [300, 0]}, {bubble: [300, 140]}], 'h 0: as tall as its words');
  assert.deepEqual([e.frames['a/1'].locks, e.frames['a/2'].locks], [{bubble: 'w'}, {bubble: 'w'}]);
  assert.equal(e.frames['a/1'].sizes.mission, undefined, 'only bubbles');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(e))).frames['a/1'].sizes, {bubble: [300, 0]}, 'a size with an auto height survives a save');
});

test('letters per second: the time a pen takes follows the letters; older speeds still work', () => {
  assert.equal(animSeconds({type: 'handwrite', cps: 10}, 'abcde fghij'), 1, 'ten letters at ten a second');
  assert.equal(animSeconds({type: 'handwrite', wps: 2}, 'one two three four'), 2, 'older: words a second');
  assert.equal(animSeconds({type: 'handwrite', seconds: 6}, 'a b'), 6, 'older: the whole sentence');
  assert.equal(animCps({type: 'handwrite', wps: 3}, 'x'), 18, 'older: shown as letters a second');
  assert.equal(animCps({type: 'handwrite', seconds: 2}, 'abcdefghij'), 5);
  assert.equal(letterCount('As Teams, Work 2!'), 12);
  assert.equal(wordCount('  As Teams   Work '), 3);
});

test('a chat box can have its words written by a pen: kept per frame, checked, copied with a duplicate, taken off with null', () => {
  let e = setAnim(EMPTY, 'a/1', 'bubble', {type: 'handwrite', seconds: 99}, T1);
  assert.deepEqual(animOf(e, 'a/1', 'bubble'), {type: 'handwrite', seconds: 30}, 'at most 30 seconds');
  assert.ok(hasAnim(e, 'a/1') && !hasAnim(e, 'a/2') && hasChanges(e, 'a/1'), 'it is a change of the frame');
  e = setAnim(e, 'a/1', 'bubble', {type: 'handwrite'}, T1);
  assert.deepEqual(animOf(e, 'a/1', 'bubble'), {type: 'handwrite', cps: 22}, 'the default: 22 letters a second');
  assert.deepEqual(animOf(setAnim(e, 'a/1', 'bubble', {type: 'handwrite', cps: 999}, T1), 'a/1', 'bubble'), {type: 'handwrite', cps: 60}, 'at most 60 letters a second');
  assert.deepEqual(animOf(setAnim(e, 'a/1', 'bubble', {type: 'handwrite', wps: 3}, T1), 'a/1', 'bubble'), {type: 'handwrite', cps: 18}, 'an older one in words a second');
  assert.equal(animOf(setAnim(e, 'a/1', 'bubble', {type: 'zoom'}, T1), 'a/1', 'bubble'), null, 'only a pen is known');
  const dup = addCopy(e, {from: 'a/1', after: 'a/1', inherit: 'a/1'}, T2);
  assert.deepEqual(animOf(dup.edits, dup.id, 'bubble'), {type: 'handwrite', cps: 22}, 'a duplicate writes too');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify({...e, frames: {'a/1': {...e.frames['a/1'], anims: {bubble: {type: 'handwrite', seconds: 0}, bad: 'x'}}}}))).frames['a/1'].anims, {bubble: {type: 'handwrite', seconds: 0.5}});
  assert.equal(setAnim(e, 'a/1', 'bubble', null, T2).frames['a/1'], undefined, 'taken off, nothing left');
  assert.equal(resetFrame(e, 'a/1', T2).frames['a/1'], undefined, 'Reset takes it off');
});

test('a fixed line height moves with the font size, so the lines never spread apart', () => {
  assert.equal(scaledLineHeight(45.49, 34.99, 26), 33.8, 'smaller text: the lines come closer by the same share');
  assert.equal(scaledLineHeight(45.49, 34.99, 60), 78.01);
  assert.equal(scaledLineHeight(null, 34.99, 26), null, 'no fixed line height: nothing to move');
  assert.equal(scaledLineHeight(45.49, 0, 26), null);
});

test('styles: what the inspector sets on an asset, checked, taken off with null, reset with the asset', () => {
  let e = setStyle(EMPTY, 'a/1', 'mission', {opacity: 0.5, rotate: 12.345, color: '#FF0000', font: 'poppins', align: 'center', shadow: true, weight: 700}, T1);
  assert.deepEqual(styleOf(e, 'a/1', 'mission'), {opacity: 0.5, rotate: 12.35, color: '#ff0000', font: 'poppins', align: 'center', shadow: true, weight: 700});
  assert.ok(hasChanges(e, 'a/1'), 'a style is a change');
  e = setStyle(e, 'a/1', 'mission', {color: 'red; background: url(x)', font: 'comic', opacity: null, shadow: false, nope: 3}, T2);
  assert.deepEqual(styleOf(e, 'a/1', 'mission'), {rotate: 12.35, align: 'center', weight: 700}, 'bad values are refused, null and false take one off');
  assert.equal(styleValue('fill', 'rgb(1, 2, 3)'), 'rgb(1, 2, 3)');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify({...e, frames: {'a/1': {...e.frames['a/1'], styles: {mission: {rotate: 'x', color: '#00f', bad: 1}}}}}))).frames['a/1'].styles, {mission: {color: '#00f'}});
  e = setMove(e, 'a/1', 'mission', [3, 3], T2);
  e = setText(e, 'a/1', 'mission/0', 'Kept', T2);
  e = resetAsset(e, 'a/1', 'mission', T2);
  assert.deepEqual([e.frames['a/1'].moves, e.frames['a/1'].styles, e.frames['a/1'].texts], [undefined, undefined, {'mission/0': 'Kept'}], 'its words stay');
});

test('layers move one place or to the front / back, the others keeping their order', () => {
  const list = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(reorderKeys(list, ['b'], 'forward'), ['a', 'c', 'b', 'd', 'e']);
  assert.deepEqual(reorderKeys(list, ['b'], 'backward'), ['b', 'a', 'c', 'd', 'e']);
  assert.deepEqual(reorderKeys(list, ['b'], 'front'), ['a', 'c', 'd', 'e', 'b']);
  assert.deepEqual(reorderKeys(list, ['d'], 'back'), ['d', 'a', 'b', 'c', 'e']);
  assert.deepEqual(reorderKeys(list, ['b', 'd'], 'forward'), ['a', 'c', 'b', 'e', 'd'], 'two picked: each one place');
  assert.deepEqual(reorderKeys(list, ['b', 'c'], 'forward'), ['a', 'd', 'b', 'c', 'e'], 'next to each other: together past the next one');
  assert.deepEqual(reorderKeys(list, ['c', 'e'], 'front'), ['a', 'b', 'd', 'c', 'e'], 'to the front: their order kept');
  assert.equal(reorderKeys(list, ['e'], 'forward'), list, 'already on top: the same list');
  assert.equal(reorderKeys(list, ['a'], 'backward'), list);
  assert.equal(reorderKeys(list, ['e'], 'front'), list);
  assert.equal(reorderKeys(list, ['a'], 'back'), list);
  assert.equal(reorderKeys(list, ['nope'], 'forward'), list, 'something that is not there changes nothing');
});

test('the stacking you gave a frame is kept, and what is added later goes on top', () => {
  const f = frame('f', 'a', 'hand', [layer('mission'), layer('bubble'), layer('hand')]); // the stack, the one at the back first
  const e1 = moveLayers(EMPTY, f, ['hand'], 'back');
  assert.deepEqual(layersOf(f, e1.frames.f).map(l => l.key), ['hand', 'mission', 'bubble']);
  assert.deepEqual(e1.frames.f.order, ['hand', 'mission', 'bubble']);
  const e2 = addInserts(e1, 'f', [{key: 'r1-rectangle', name: 'Rectangle', kind: 'dom', asset: 'x', z: 20, box: {x: 0, y: 0, w: 1, h: 1}}], {x: '<div></div>'});
  assert.deepEqual(layersOf(f, e2.frames.f).map(l => l.key), ['hand', 'mission', 'bubble', 'r1-rectangle'], 'new on top');
  const e3 = moveLayers(e2, f, ['r1-rectangle'], 'backward');
  assert.deepEqual(layersOf(f, e3.frames.f).map(l => l.key), ['hand', 'mission', 'r1-rectangle', 'bubble']);
  assert.equal(moveLayers(e3, f, ['bubble'], 'front'), e3, 'nothing to do: no history step');
  assert.deepEqual(layersOf(f, resetFrame(e3, 'f').frames.f), f.layers, 'reset: as captured');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(e3))).frames.f.order, e3.frames.f.order, 'it survives the file');
  assert.deepEqual(layersOf(f, {order: ['bubble', 'ghost']}).map(l => l.key), ['bubble', 'mission', 'hand'], 'a name that is not there is ignored');
});

test('a frame can have a name of its own: shown instead of its label, kept in the file, not an edit of the frame, not copied by a duplicate, taken off with nothing', async () => {
  const {setName, nameOf, isEdited} = await import('./storyboardEdits.mjs');
  let e = setName(EMPTY, 'a/1', '  Cursor   click · press ', T1);
  assert.equal(nameOf(e, 'a/1'), 'Cursor click · press', 'tidy: one space, no ends');
  assert.equal(hasChanges(e, 'a/1'), false, 'a name is not a change of what the frame shows (like its note)');
  assert.equal(isEdited(e.frames['a/1']), false);
  assert.equal(normalizeEdits(JSON.parse(JSON.stringify(e))).frames['a/1'].name, 'Cursor click · press', 'it survives the file');
  assert.equal(normalizeEdits({frames: {'a/1': {name: '   '}}}).frames['a/1'], undefined, 'a blank name is nothing');
  e = setMove(e, 'a/1', 'mission', [3, 4], T1);
  const copy = addCopy(e, {from: 'a/1', after: 'a/1', inherit: 'a/1'});
  assert.equal(nameOf(copy.edits, copy.id), '', 'a duplicate does not take the name');
  assert.equal(resetFrame(e, 'a/1').frames['a/1'].name, 'Cursor click · press', 'reset keeps the name, like the note');
  assert.equal(nameOf(setName(e, 'a/1', ''), 'a/1'), '', 'emptied: gone');
});

test("a line's shelf of videos is kept, cleaned and taken off (the user, 2026-10-13)", () => {
  const made = addLine(EMPTY, {title: 'Videos'}), id = made.id;
  const put = setLineShelf(made.edits, id, ['a', 'b', 'a', 7, '']);
  assert.deepEqual(put.lines.added[id].shelf, ['a', 'b'], 'each once, strings only');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(put))).lines.added[id].shelf, ['a', 'b'], 'it survives a save and a load');
  assert.equal('shelf' in setLineShelf(put, id, []).lines.added[id], false, 'none takes it off');
  assert.equal(setLineShelf(EMPTY, 'nope', ['a']), EMPTY, 'a line that is not there: no change');
});
