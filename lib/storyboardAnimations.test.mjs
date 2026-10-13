import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY, layersOf, linesOf, normalizeEdits, orderedFrames} from './storyboardEdits.mjs';
import {ANIMATIONS, SCENES, buildAnimations, withoutAnimations} from './storyboardAnimations.mjs';
import {cellsOf} from './storyboardCells.mjs';

// A small board: a title, a mission with a chat box, and a board of another video with a chat box.
const html = {
  title: '<div data-sb-root="title"><h1>The words</h1></div>',
  mission: '<div data-sb-root="mission"><div><span>Mission</span></div></div>',
  bubble: '<div data-sb-root="bubble" data-sb-bubble="" data-sb-style="yellow"><div><p aria-label="Old words"><span>Old words</span></p></div></div>',
  other: '<div data-sb-root="board"><div><span>Cards</span></div></div>',
};
const layer = (key, name, kind, asset) => ({key, name, kind, asset, box: {x: 0, y: 0, w: 100, h: 100}});
const frame = (id, chapter, layers) => ({id, chapter, label: id, layers});
const FRAMES = [
  frame('conclusion/words', 'conclusion', [layer('title', 'Title', 'dom', 'title')]),
  frame('translation/words', 'translation', [layer('mission', 'Mission', 'dom', 'mission'), layer('bubble', 'Chat bubble', 'bubble', 'bubble')]),
  frame('translation/fading', 'translation', [layer('mission', 'Mission', 'dom', 'mission'), layer('bubble', 'Chat bubble', 'bubble', 'bubble')]),
];
const OTHER = {frames: [frame('priority/bubble', 'priority', [layer('board', 'Board', 'dom', 'other'), layer('bubble', 'Chat bubble', 'bubble', 'bubble')])], edits: EMPTY, htmlOf: hash => html[hash], stage: {}};
const SCENE_LIST = [
  {id: 'a', name: 'A title', frames: [{from: 'conclusion/words', title: 'Hello', name: 'A title · full', note: 'NOTE A'}, {from: 'conclusion/words', title: 'Hello', step: [0.64, 0.18], name: 'A title · step'}]},
  {id: 'b', name: 'A click', frames: [{from: 'translation/words', words: 'Click\nit', name: 'A click · arrives', note: 'NOTE B'}, {from: 'translation/fading', quiet: true, name: 'A click · pressed'}]},
  {id: 'c', name: 'Cards', frames: [{other: {board: 'other', id: 'priority/bubble'}, words: 'Cards glide', name: 'Cards · before', note: 'NOTE C'}]},
];
const build = (edits = EMPTY, scenes = SCENE_LIST) => buildAnimations(edits, {frames: FRAMES, htmlOf: hash => html[hash], other: {other: OTHER}}, scenes);

test('the line is made at the top of the board, its frames in the order of the scenes', () => {
  const made = build();
  assert.deepEqual(made.problems, []);
  assert.deepEqual(made.scenes.map(s => s.id), ['a', 'b', 'c']);
  assert.equal(made.ids.length, 5);
  const lines = linesOf([{id: 'conclusion', title: 'The closing words'}, {id: 'translation', title: 'Translate'}], made.edits);
  assert.deepEqual(lines.map(l => l.id), [ANIMATIONS.id, 'conclusion', 'translation'], 'first: before every captured line');
  assert.equal(lines[0].title, 'Animations');
  const board = orderedFrames(FRAMES, made.edits, lines.map(l => l.id)).filter(f => f.chapter === ANIMATIONS.id);
  assert.deepEqual(board.map(f => f.id), made.ids, 'the board shows them in the order made');
});

test('a frame made plain has no yellow outline: one the board had is hidden, one pasted from the other board is taken out, a frame not made plain keeps it', () => {
  const marked = {...html, outline: '<div data-sb-root="c1-yellow-outline" class="iq2-mark"></div>', ring: '<div data-sb-root="circle" class="iq2-mark"></div>'};
  const frames = [frame('emphasis/result', 'emphasis', [layer('mission', 'Mission', 'dom', 'mission'), layer('c1-yellow-outline', 'Yellow outline', 'dom', 'outline')])];
  const other = {frames: [frame('claim/words', 'claim', [layer('board', 'Board', 'dom', 'other'), layer('circle', 'Yellow outline', 'dom', 'ring')])], edits: EMPTY, htmlOf: hash => marked[hash], stage: {}};
  const scenes = [{id: 'p', name: 'Pop', frames: [{from: 'emphasis/result', plain: true, name: 'made plain'}, {from: 'emphasis/result', name: 'not made plain'}, {other: {board: 'other', id: 'claim/words'}, plain: true, name: 'pasted, plain'}, {other: {board: 'other', id: 'claim/words'}, name: 'pasted'}]}];
  const made = buildAnimations(EMPTY, {frames, htmlOf: hash => marked[hash], other: {other}}, scenes), names = id => layersOf({id, layers: id.startsWith('emphasis') ? frames[0].layers : []}, made.edits.frames[id]).map(l => l.name);
  assert.deepEqual(made.problems, []);
  const [plain, kept, pastedPlain, pasted] = made.ids;
  assert.deepEqual(names(plain), ['Mission'], 'the outline the board had is hidden');
  assert.deepEqual(names(kept), ['Mission', 'Yellow outline'], 'a frame not made plain keeps it');
  assert.equal(names(pastedPlain).includes('Yellow outline'), false, 'the one pasted is taken out');
  assert.equal(names(pasted).includes('Yellow outline'), true);
});

test('the line is a line of VIDEOS: one per scene, made of the frames of its scene; the board shows each in place of its first frame', () => {
  const made = build(), line = made.edits.lines.added[ANIMATIONS.id];
  assert.deepEqual(line.videos.map(v => [v.id, v.name, v.ids.length]), [['a', 'A title', 2], ['b', 'A click', 2], ['c', 'Cards', 1]]);
  assert.deepEqual(line.videos.flatMap(v => v.ids), made.ids, 'the slides of the videos are the frames of the line, in order');
  assert.equal(line.view, undefined, 'shown as videos');
  const frames = orderedFrames(FRAMES, made.edits, [ANIMATIONS.id, 'conclusion', 'translation']), cells = cellsOf(made.edits, frames);
  assert.deepEqual([...cells.anchors.keys()], [made.ids[0], made.ids[2], made.ids[4]], 'the first frame of each scene is its video on the board');
  assert.deepEqual([...cells.hidden].sort(), [made.ids[1], made.ids[3]].sort(), 'the other frames are not on it');
  assert.deepEqual(normalizeEdits(JSON.parse(JSON.stringify(made.edits))).lines.added[ANIMATIONS.id].videos, line.videos, 'and it is kept in the file');
});

test('each frame has its name and note, the words or title retyped, and the pen on its chat box', () => {
  const made = build(), at = made.edits.frames;
  assert.equal(at[made.ids[0]].name, 'A title · full');
  assert.equal(at[made.ids[0]].note, 'NOTE A');
  assert.equal(at[made.ids[0]].texts['title/0'], 'Hello', 'the title retyped');
  assert.deepEqual(at[made.ids[1]].scales.title, [0.64, 0.64], 'a step of the fade: small');
  assert.equal(at[made.ids[1]].styles.title.opacity, 0.18, 'and faint');
  assert.equal(at[made.ids[2]].texts['bubble/0.0'], 'Click\nit', 'the chat box retyped');
  assert.equal(at[made.ids[2]].anims.bubble.type, 'handwrite', 'the pen writes it (the blue play button)');
  assert.equal(at[made.ids[3]].texts?.['bubble/0.0'], undefined, 'a quiet frame keeps what it had');
  assert.equal(at[made.ids[3]].note, undefined);
});

test('a frame of another board is pasted whole, with its own words retyped and no note of its own', () => {
  const made = build(), id = made.ids.at(-1), mine = layersOf({id, layers: []}, made.edits.frames[id]);
  assert.ok(mine.some(l => l.kind === 'bubble'), 'its chat box came with it');
  assert.ok(mine.some(l => /board/i.test(l.name)), 'and its board');
  assert.equal(made.edits.frames[id].note, 'NOTE C', 'only the note of the scene');
  assert.ok(Object.values(made.edits.frames[id].texts).includes('Cards glide'));
});

test('making the line again gives the same line (the frames are made anew, nothing piles up)', () => {
  const first = build(), second = build(first.edits);
  assert.deepEqual(second.ids, first.ids);
  assert.deepEqual(second.edits.copies, first.edits.copies);
  assert.deepEqual(second.edits.rows, first.edits.rows);
  assert.deepEqual(second.edits.lines.added[ANIMATIONS.id].videos, first.edits.lines.added[ANIMATIONS.id].videos, 'the same videos');
  assert.deepEqual(Object.keys(second.edits.library).sort(), Object.keys(first.edits.library).sort(), 'no HTML left over');
});

test('the rest of the board is left exactly as it is', () => {
  const edits = normalizeEdits({frames: {'translation/words': {note: 'mine', moves: {mission: [3, 4]}}}, copies: {'translation/fading#2': {from: 'translation/fading', after: 'translation/fading'}}});
  const made = build(edits);
  assert.deepEqual(made.edits.frames['translation/words'], edits.frames['translation/words'], 'a frame of the board: untouched');
  assert.ok('translation/fading#2' in made.edits.copies, 'a frame you duplicated stays');
  assert.equal(made.ids.includes('translation/fading#2'), false, 'and is not taken for one of the line');
});

test('a scene made from a frame that is not there is a problem, said by its scene and place', () => {
  const made = build(EMPTY, [{id: 'x', name: 'Lost', frames: [{from: 'nope/words', name: 'x'}, {other: {board: 'other', id: 'none/words'}, name: 'y'}, {name: 'z'}]}]);
  assert.equal(made.problems.length, 3);
  assert.match(made.problems[0], /^Lost 1: no frame nope\/words/);
  assert.match(made.problems[1], /^Lost 2: no frame none\/words on other/);
  assert.match(made.problems[2], /^Lost 3: nothing to make it from/);
  assert.equal(made.ids.length, 0);
});

test('a frame that must have words but whose source has no chat box is a problem, unless it is quiet', () => {
  const loud = build(EMPTY, [{id: 'x', name: 'S', frames: [{from: 'conclusion/words', words: 'Words', name: 'n'}]}]);
  assert.match(loud.problems[0], /has no chat box for "Words"/);
  const quiet = build(EMPTY, [{id: 'x', name: 'S', frames: [{from: 'conclusion/words', words: 'Words', quiet: true, name: 'n'}]}]);
  assert.deepEqual(quiet.problems, []);
});

test('taking the line away takes its frames, its row and the line, and the HTML only they used', () => {
  const made = build(), bare = withoutAnimations(made.edits);
  assert.deepEqual(bare.copies, {});
  assert.equal(bare.rows[ANIMATIONS.id], undefined);
  assert.equal(bare.lines.added[ANIMATIONS.id], undefined);
  assert.deepEqual(bare.library, {});
  assert.deepEqual(bare.frames, {});
});

test('the scenes of the line: every one has a name and frames made from something, and the first frame of a scene tells how it moves', () => {
  assert.ok(SCENES.length >= 12, 'every animation the video plays');
  for (const scene of SCENES) {
    assert.ok(scene.id && scene.name && scene.frames.length, scene.id);
    assert.ok(scene.frames[0].note && /^[A-Z ,]+\n/.test(scene.frames[0].note), `${scene.id}: a note that starts with its name`);
    assert.ok(scene.frames[0].note.length < 340, `${scene.id}: it fits the notes box`);
    for (const f of scene.frames) assert.ok(f.name && (f.from || f.other), `${scene.id}: ${f.name}`);
  }
  assert.equal(new Set(SCENES.map(s => s.id)).size, SCENES.length);
  for (const id of ['fade-in', 'fade-out', 'handwritten', 'click', 'highlight', 'zoom', 'pop', 'expand', 'scroll', 'drag', 'glide', 'color']) assert.ok(SCENES.some(s => s.id === id), id);
});
