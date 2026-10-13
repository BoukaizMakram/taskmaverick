import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY, deleteFrame, layersOf, noteOf, normalizeEdits, orderedFrames, setMove, setNote, setText} from './storyboardEdits.mjs';
import {copyFrames, pasteFrames} from './storyboardClipboard.mjs';
import {TRASH, addToTrash, removeFromTrash, trashEntry, trashVideo} from './storyboardTrash.mjs';

const ASSETS = {
  a1: '<div class="iq2-mission" data-sb-root="mission"><p>Opening Quality Check</p></div>',
  a2: '<div class="cb-caption" data-sb-root="bubble"><p aria-label="Hi"><span>Hi</span></p></div>',
};
const frame = (id, chapter = 'alerts', label = 'Words') => ({id, chapter, label, time: 3.2, scene: {id: chapter, view: 'mission'}, stageClass: 'ad-stage iq2-stage', layers: [
  {key: 'mission', name: 'Mission', kind: 'dom', asset: 'a1', box: {x: 480, y: 20, w: 420, h: 700}},
  {key: 'bubble', name: 'Chat bubble', kind: 'bubble', asset: 'a2', box: {x: 950, y: 200, w: 260, h: 80}, style: 'yellow', tip: [900, 240]},
]});
const board = {id: 'improved-quality-v2', name: 'Improved Quality', chapters: [{id: 'alerts', title: 'Alerts'}, {id: 'links', title: 'Links'}], stage: {className: 'ad-stage iq-stage', style: '--iq-caption-size: 27px;', shell: 'es-player iq-player demo-text-scope'}};
const htmlOf = edits => hash => edits.library[hash] ?? ASSETS[hash];
const T1 = '2026-10-04T10:00:00.000Z', T2 = '2026-10-05T10:00:00.000Z';

// delete a frame the way the board does: snapshot it, take it off the board, put the snapshot in the Trash
function trashed(edits, frames, ids, trash = EMPTY, at = T1) {
  const picked = frames.filter(f => ids.includes(f.id));
  const clip = copyFrames({frames: picked, edits, htmlOf: htmlOf(edits), stage: board.stage, video: board.id});
  const entries = clip.items.map((item, i) => trashEntry({item, frame: picked[i], board, at}));
  return {board: ids.reduce(deleteFrame, edits), trash: addToTrash(trash, entries, at)};
}

test('a deleted frame is kept whole in the Trash: where it came from, its look, its assets with their changes, its note', () => {
  const base = [frame('f1'), frame('f2')];
  let edits = setNote(setMove(EMPTY, 'f1', 'mission', [10, 5]), 'f1', 'Slower here');
  edits = setText(edits, 'f1', 'mission/0', 'Closing Check');
  const out = trashed(edits, base, ['f1']);
  assert.deepEqual(out.board.deleted, ['f1']);
  assert.deepEqual(orderedFrames(base, out.board).map(f => f.id), ['f2']);
  const {edits: trash, ids} = out.trash;
  assert.equal(ids.length, 1);
  const [entry] = trash.trash;
  assert.deepEqual([entry.id, entry.video, entry.videoName, entry.chapterTitle, entry.label, entry.time, entry.from, entry.deletedAt], [ids[0], 'improved-quality-v2', 'Improved Quality', 'Alerts', 'Words', 3.2, 'f1', T1]);
  assert.deepEqual(entry.look, {shell: 'es-player iq-player demo-text-scope', stageClass: 'ad-stage iq2-stage', stageStyle: '--iq-caption-size: 27px;', scene: {id: 'alerts', view: 'mission'}});
  const rec = trash.frames[entry.id];
  assert.deepEqual(rec.inserts.map(l => l.name), ['Mission', 'Chat bubble'], 'every asset, in the frame\'s order');
  assert.equal(noteOf(trash, entry.id), 'Slower here');
  assert.deepEqual(rec.moves, {'c1-mission': [10, 5]}, 'what was moved stays moved');
  assert.deepEqual(rec.texts, {'c1-mission/0.0.0': 'Closing Check'}, 'and what was retyped stays retyped');
  assert.match(trash.library[rec.inserts[0].asset], /Opening Quality Check/);
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(trash))).trash, trash.trash, 'it survives a save and a load');
});

test('frames deleted together land side by side in their order, a later delete goes first', () => {
  const base = [frame('f1'), frame('f2'), frame('f3')];
  const first = trashed(EMPTY, base, ['f1', 'f2'], EMPTY, T1);
  const second = trashed(first.board, base, ['f3'], first.trash.edits, T2);
  const ids = second.trash.edits.trash.map(t => t.id);
  assert.equal(new Set(ids).size, 3, 'each has an id of its own');
  const video = trashVideo({video: TRASH, name: 'Trash', stage: {className: 'ad-stage'}, assets: {}}, second.trash.edits);
  assert.deepEqual(video.frames.map(f => f.id), [ids[2], ids[0], ids[1]], 'the latest first, those deleted together as they were');
  assert.deepEqual(video.frames.map(f => noteOf(second.trash.edits, f.id)), ['', '', '']);
});

test('the Trash board has a row per line the frames were deleted from, with the name of the line, and draws each frame with the look of its video', () => {
  const other = {id: 'increased-efficiency-v2', name: 'Increased Efficiency', chapters: [{id: 'x', title: 'X'}], stage: {className: 'ad-stage ev2-stage', style: '', shell: 'es-player ev2-player demo-text-scope'}};
  const a = trashed(EMPTY, [frame('f1')], ['f1']).trash.edits;
  const clip = copyFrames({frames: [frame('g1', 'x', 'Click')], edits: EMPTY, htmlOf: htmlOf(EMPTY), stage: other.stage, video: other.id});
  const {edits} = addToTrash(a, [trashEntry({item: clip.items[0], frame: frame('g1', 'x', 'Click'), board: other, at: T2})], T2);
  const video = trashVideo({video: TRASH, name: 'Trash', stage: {className: 'ad-stage', style: '', shell: 'es-player demo-text-scope'}, assets: {}}, edits);
  assert.deepEqual(video.chapters.map(c => [c.id, c.title]), [['increased-efficiency-v2::x', 'X'], ['improved-quality-v2::alerts', 'Alerts']], 'a row per line, its name, the line deleted from last first');
  const [g, f] = video.frames;
  assert.deepEqual([g.chapter, g.shell, g.stageClass, g.label], ['increased-efficiency-v2::x', 'es-player ev2-player demo-text-scope', 'ad-stage iq2-stage', 'Click']);
  assert.deepEqual([f.chapter, f.shell, f.label, f.time, f.thumb, f.layers], ['improved-quality-v2::alerts', 'es-player iq-player demo-text-scope', 'Words', 3.2, null, []]);
  assert.deepEqual(layersOf(f, edits.frames[f.id]).map(l => l.key), ['c1-mission', 'c1-chat-bubble'], 'its assets are the inserts, like a blank frame\'s');
  assert.deepEqual(trashVideo({video: TRASH, chapters: [], frames: []}, EMPTY).frames, [], 'an empty Trash has no rows');
});

test('from the Trash a frame is copied and pasted on a storyboard: a new frame holding the same assets', () => {
  const base = [frame('f1'), frame('f2')];
  const edits = setNote(setMove(EMPTY, 'f1', 'mission', [10, 5]), 'f1', 'Slower here');
  const out = trashed(edits, base, ['f1']);
  const trashEdits = out.trash.edits, id = out.trash.ids[0];
  const video = trashVideo({video: TRASH, assets: {}, stage: {}}, trashEdits), shown = video.frames.find(f => f.id === id);
  // Ctrl+C on the Trash board, Ctrl+V on the storyboard (a frame that is not on that board becomes a new frame there)
  const clip = copyFrames({frames: [shown], edits: trashEdits, htmlOf: htmlOf(trashEdits), stage: video.stage, video: TRASH});
  const pasted = pasteFrames(out.board, clip.items, {after: 'f2', known: () => false});
  assert.deepEqual(pasted.ids, ['blank-1']);
  assert.deepEqual(orderedFrames(base, pasted.edits).map(f => f.id), ['f2', 'blank-1'], 'f1 is still deleted; the pasted frame comes after f2');
  const rec = pasted.edits.frames['blank-1'];
  assert.deepEqual(rec.inserts.map(l => l.name), ['Mission', 'Chat bubble']);
  assert.equal(rec.note, 'Slower here');
  assert.deepEqual(rec.moves, {'c1-mission': [10, 5]});
});

test('deleting from the Trash is for good: the frame, its assets and its HTML go', () => {
  const base = [frame('f1'), frame('f2')];
  const both = trashed(EMPTY, base, ['f1', 'f2']).trash;
  const [one, two] = both.ids;
  const left = removeFromTrash(both.edits, [one]);
  assert.deepEqual(left.trash.map(t => t.id), [two]);
  assert.equal(left.frames[one], undefined);
  assert.ok(left.frames[two].inserts.length, 'the other frame is untouched');
  assert.ok(Object.keys(left.library).length > 0 && Object.keys(left.library).length < Object.keys(both.edits.library).length + 1);
  const none = removeFromTrash(left, [two]);
  assert.deepEqual([none.trash, none.frames, none.library], [[], {}, {}], 'an empty Trash keeps nothing');
});

test('a deleted duplicate or blank frame goes to the Trash too', () => {
  const base = [frame('f1')];
  let edits = pasteFrames(EMPTY, copyFrames({frames: base, edits: EMPTY, htmlOf: htmlOf(EMPTY), stage: board.stage}).items, {after: 'f1', known: () => false}).edits; // blank-1, with the assets
  const blank = orderedFrames(base, edits).find(f => f.id === 'blank-1');
  const out = trashed(edits, [blank], ['blank-1']);
  assert.equal(out.board.copies['blank-1'], undefined, 'it is removed from the board');
  assert.equal(out.trash.edits.trash[0].label, 'Blank frame');
  assert.equal(out.trash.edits.frames[out.trash.ids[0]].inserts.length, 2, 'with its assets');
});

test('a frame keeps the id it was given, so undoing a delete takes it out of the Trash and redoing puts the same one back', () => {
  const base = [frame('f1')];
  const clip = copyFrames({frames: base, edits: EMPTY, htmlOf: htmlOf(EMPTY), stage: board.stage, video: board.id});
  const entries = clip.items.map((item, i) => trashEntry({item, frame: base[i], board, at: T1, id: 'trash-abc-1'}));
  const put = addToTrash(EMPTY, entries, T1);
  assert.deepEqual(put.ids, ['trash-abc-1']);
  const out = removeFromTrash(put.edits, put.ids);
  assert.deepEqual([out.trash, out.frames, out.library], [[], {}, {}]);
  assert.deepEqual(addToTrash(out, entries, T1).ids, ['trash-abc-1'], 'put back as it was');
  assert.notEqual(addToTrash(put.edits, entries, T1).ids[0], 'trash-abc-1', 'an id already in the Trash is never used twice');
});
