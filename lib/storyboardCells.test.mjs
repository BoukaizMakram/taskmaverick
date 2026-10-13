import test from 'node:test';
import assert from 'node:assert/strict';
import {cellsOf, duplicateVideo, expandLine, followersOf, slidesOrder, withSlides} from './storyboardCells.mjs';
import {EMPTY, addLine, duplicateLine, moveFrame, nameOf, normalizeEdits, orderedFrames, setLineVideos, setLineView} from './storyboardEdits.mjs';

const f = (id, chapter) => ({id, chapter, label: id});
// a line "anim" of two videos made of five slides, and a plain line "plain"
const FRAMES = [f('a1', 'anim'), f('a2', 'anim'), f('a3', 'anim'), f('b1', 'anim'), f('b2', 'anim'), f('p1', 'plain'), f('p2', 'plain')];
const withVideos = () => {
  const {id, edits} = addLine(EMPTY, {title: 'Anim'});
  return {id, edits: setLineVideos(edits, id, [{id: 'one', name: 'First', ids: ['a1', 'a2', 'a3']}, {id: 'two', name: 'Second', ids: ['b1', 'b2']}])};
};

test('a line of videos shows each video where its first slide is: the other slides are not on the board', () => {
  const {id, edits} = withVideos(), cells = cellsOf(edits, FRAMES.map(x => ({...x, chapter: x.chapter === 'anim' ? id : x.chapter})));
  assert.deepEqual([...cells.hidden].sort(), ['a2', 'a3', 'b2']);
  assert.deepEqual([...cells.anchors.keys()], ['a1', 'b1']);
  assert.equal(cells.anchors.get('a1').name, 'First');
  assert.deepEqual(cells.anchors.get('b1').ids, ['b1', 'b2']);
  assert.equal(cells.lines.get(id).slides, false);
});

test('shown as slides, nothing is hidden and there are no videos on the board, but the line still knows them', () => {
  const {id, edits} = withVideos(), slides = setLineView(edits, id, 'slides'), cells = cellsOf(slides, FRAMES);
  assert.equal(cells.hidden.size, 0);
  assert.equal(cells.anchors.size, 0);
  assert.equal(cells.lines.get(id).slides, true);
  assert.equal(cells.lines.get(id).scenes.length, 2);
  assert.equal(cellsOf(setLineView(slides, id, 'videos'), FRAMES).anchors.size, 2, 'and back');
});

test('a slide that is gone is left out of its video, a video with none is no video, a slide is in one video only', () => {
  const {id, edits} = addLine(EMPTY, {title: 'Anim'}), made = setLineVideos(edits, id, [{id: 'x', name: 'X', ids: ['gone', 'a2', 'a3']}, {id: 'y', name: 'Y', ids: ['gone', 'also gone']}, {id: 'z', name: 'Z', ids: ['a3', 'b1']}]);
  const cells = cellsOf(made, FRAMES);
  assert.deepEqual(cells.anchors.get('a2').ids, ['a2', 'a3'], 'the one that is gone is skipped: the next is its first slide');
  assert.equal([...cells.anchors.values()].some(s => s.id === 'y'), false);
  assert.deepEqual(cells.anchors.get('b1').ids, ['b1'], 'a3 is in the first video already');
  assert.equal(cells.hidden.has('b1'), false, 'a first slide is never hidden');
});

test('a line with no videos is as it was', () => {
  const cells = cellsOf(addLine(EMPTY, {title: 'Plain'}).edits, FRAMES);
  assert.equal(cells.hidden.size + cells.anchors.size + cells.lines.size, 0);
  assert.equal(cellsOf(EMPTY, FRAMES).hidden.size, 0);
});

test('the frames a line plays: the slides of every video in the order of the videos, a frame that is no video\'s as it is', () => {
  const {id, edits} = withVideos(), frames = FRAMES.map(x => ({...x, chapter: x.chapter === 'anim' ? id : x.chapter})), cells = cellsOf(edits, frames), byId = Object.fromEntries(frames.map(x => [x.id, x]));
  const shown = frames.filter(x => x.chapter === id && !cells.hidden.has(x.id));
  assert.deepEqual(expandLine(shown, cells, byId).map(x => x.id), ['a1', 'a2', 'a3', 'b1', 'b2']);
  const swapped = [shown[1], shown[0]], plain = {id: 'extra', chapter: id}; // the videos dragged the other way round, a blank frame between
  assert.deepEqual(expandLine([swapped[0], plain, swapped[1]], cells, byId).map(x => x.id), ['b1', 'b2', 'extra', 'a1', 'a2', 'a3']);
});

test('going back to slides, the slides of each video are together, in the order the videos are in', () => {
  const {id, edits} = withVideos(), frames = FRAMES.map(x => ({...x, chapter: x.chapter === 'anim' ? id : x.chapter}));
  assert.deepEqual(slidesOrder(edits, id, frames), ['a1', 'a2', 'a3', 'b1', 'b2']);
  const dragged = {...edits, rows: {[id]: ['b1', 'a1', 'a2', 'a3', 'b2'], plain: ['p1', 'p2']}}; // (the videos swapped on the board: b1 now comes before a1)
  const order = slidesOrder(dragged, id, orderedFrames(frames, dragged, [id, 'plain']));
  assert.deepEqual(order, ['b1', 'b2', 'a1', 'a2', 'a3']);
  const slides = setLineView(dragged, id, 'slides', order);
  assert.deepEqual(slides.rows[id], order, 'the row is made so');
  assert.deepEqual(setLineView(slides, id, 'videos').rows[id], order, 'and kept going back');
});

test('the videos of a line are part of its record: they survive the file, a view is only kept for a line with videos, bad ones are dropped', () => {
  const {id, edits} = withVideos(), slides = setLineView(edits, id, 'slides');
  const back = normalizeEdits(JSON.parse(JSON.stringify(slides)));
  assert.deepEqual(back.lines.added[id].videos.map(v => [v.id, v.name, v.ids.length]), [['one', 'First', 3], ['two', 'Second', 2]]);
  assert.equal(back.lines.added[id].view, 'slides');
  const plain = normalizeEdits({lines: {added: {p: {title: 'P', after: null, view: 'slides'}}}});
  assert.equal(plain.lines.added.p.view, undefined, 'a view means nothing without videos');
  const junk = normalizeEdits({lines: {added: {p: {title: 'P', after: null, videos: [null, {id: 'a'}, {id: 'b', ids: []}, {id: 'c', name: 'C', ids: ['x', 'x', 5, 'y']}]}}}});
  assert.deepEqual(junk.lines.added.p.videos, [{id: 'c', name: 'C', ids: ['x', 'y']}]);
  assert.equal(setLineVideos(edits, id, []).lines.added[id].videos, undefined, 'none takes them off');
  assert.equal(setLineView(EMPTY, 'nope', 'slides'), EMPTY, 'no such line, nothing changes');
  assert.equal(setLineView(addLine(EMPTY, {title: 'P'}).edits, 'line-1', 'slides').lines.added['line-1'].view, undefined, 'a line with no videos has no view');
});

test('a video stands for all its slides: picking it for the Trash, the clipboard or a copy means every slide', () => {
  const {id, edits} = withVideos(), frames = FRAMES.map(x => ({...x, chapter: x.chapter === 'anim' ? id : x.chapter})), cells = cellsOf(edits, frames);
  assert.deepEqual(withSlides(['a1'], cells), ['a1', 'a2', 'a3']);
  assert.deepEqual(withSlides(['p1', 'b1', 'a1', 'b1'], cells), ['p1', 'b1', 'b2', 'a1', 'a2', 'a3'], 'each once, a plain frame as it is');
  assert.deepEqual(withSlides(['a2'], cells), ['a2'], 'a slide that is not the first is not a video');
  assert.deepEqual(followersOf(cells), {a1: ['a2', 'a3'], b1: ['b2']});
});

test('a video dragged to another place takes its slides with it: they stay right after its first slide in the row', () => {
  const {id, edits} = withVideos(), frames = FRAMES.map(x => ({...x, chapter: x.chapter === 'anim' ? id : x.chapter})), cells = cellsOf(edits, frames);
  const shown = frames.filter(f => !cells.hidden.has(f.id)); // (what the board shows: a1, b1, p1, p2)
  const moved = moveFrame(edits, shown, 'b1', id, 0, followersOf(cells));
  assert.deepEqual(moved.rows[id], ['b1', 'b2', 'a1', 'a2', 'a3'], 'b1 first, each with its slides');
  const away = moveFrame(edits, shown, 'a1', 'plain', 1, followersOf(cells));
  assert.deepEqual(away.rows.plain, ['p1', 'a1', 'a2', 'a3', 'p2'], 'to another line: the slides go too');
  assert.deepEqual(away.rows[id], ['b1', 'b2']);
  const order = orderedFrames(frames, away, [id, 'plain']);
  assert.deepEqual(order.map(f => `${f.chapter}:${f.id}`), [`${id}:b1`, `${id}:b2`, 'plain:p1', 'plain:a1', 'plain:a2', 'plain:a3', 'plain:p2'], 'the slides are in their anchor\'s row, none lost');
  assert.equal(moveFrame(edits, shown, 'a1', id, 0, followersOf(cells)), edits, 'no change in the order: the same edits');
  assert.deepEqual(moveFrame(edits, shown, 'b1', id, 0).rows[id], ['b1', 'a1'], 'without followers the slides are not in the rows (the old way)');
});

test('a video duplicated: every slide is copied (changes, note, name) and the copies are a video of the line right after the original', () => {
  const {id, edits: made} = withVideos();
  let edits = {...made, frames: {...made.frames, a1: {note: 'about a1', name: 'First', updatedAt: 'x'}}};
  const frames = orderedFrames(FRAMES.map(x => ({...x, chapter: x.chapter === 'anim' ? id : x.chapter})), edits, [id, 'plain']);
  const scene = cellsOf(edits, frames).anchors.get('a1'), copy = duplicateVideo(edits, scene);
  assert.equal(copy.ids.length, 3);
  assert.equal(copy.anchor, copy.ids[0]);
  assert.deepEqual(copy.ids, ['a1#2', 'a2#2', 'a3#2']);
  assert.equal(copy.edits.frames['a1#2'].note, 'about a1');
  assert.equal(nameOf(copy.edits, 'a1#2'), 'First');
  assert.deepEqual(copy.edits.lines.added[id].videos.map(v => [v.id, v.ids.join('+')]), [['one', 'a1+a2+a3'], ['one-2', 'a1#2+a2#2+a3#2'], ['two', 'b1+b2']]);
  const after = orderedFrames(FRAMES.map(x => ({...x, chapter: x.chapter === 'anim' ? id : x.chapter})), copy.edits, [id, 'plain']), cells = cellsOf(copy.edits, after);
  assert.deepEqual([...cells.anchors.keys()], ['a1', 'a1#2', 'b1']);
  assert.deepEqual(after.filter(f => !cells.hidden.has(f.id) && f.chapter === id).map(f => f.id), ['a1', 'a1#2', 'b1'], 'on the board: the copy right after the original');
  assert.equal(duplicateVideo(edits, {...scene, line: 'no such line'}).edits.lines.added[id].videos.length, 2, 'a video of a line that is not there changes nothing');
});

test('a line of videos duplicated is a line of videos: the copies of the slides are the slides of the copies of the videos', () => {
  const {id, edits} = withVideos(), frames = FRAMES.map(x => ({...x, chapter: x.chapter === 'anim' ? id : x.chapter})).filter(f => f.chapter === id);
  const made = duplicateLine(edits, {id, title: 'Anim'}, frames), line = made.edits.lines.added[made.id];
  assert.equal(made.ids.length, 5);
  assert.deepEqual(line.videos.map(v => [v.id, v.name, v.ids.join('+')]), [['one', 'First', 'a1#2+a2#2+a3#2'], ['two', 'Second', 'b1#2+b2#2']]);
  assert.equal(line.view, undefined);
  const slides = duplicateLine(setLineView(edits, id, 'slides'), {id, title: 'Anim'}, frames);
  assert.equal(slides.edits.lines.added[slides.id].view, 'slides', 'a line shown as slides is copied as slides');
});
