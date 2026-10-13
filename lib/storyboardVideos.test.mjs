import test from 'node:test';
import assert from 'node:assert/strict';
import {VIDEO_RUNS, runsOf, shelvedRuns} from './storyboardVideos.mjs';

test('the runs: the mission run ends on the video proof, the ratings run on the peer ratings', () => {
  const runs = runsOf('improved-quality-v2', ['knowledge', 'instructions', 'alerts', 'links', 'translation', 'steps', 'micro', 'capture', 'photo', 'video', 'emphasis', 'rate', 'peer', 'visibility', 'mobile', 'tour', 'web', 'remote', 'performer', 'timestamp', 'conclusion']);
  assert.equal(runs.length, 5);
  assert.deepEqual(runs[1].lines, ['instructions', 'alerts', 'links', 'translation', 'steps', 'micro', 'photo', 'video'], 'the proof checkpoints (capture) are on the board but not in the video (the user, 2026-10-12)');
  assert.equal(runs[1].last, 'video');
  assert.equal(runs[2].last, 'peer');
  assert.equal(runs.at(-1).last, 'conclusion');
});

test('a run only has the lines that exist; a run with none is left out; an unknown video has no runs', () => {
  const runs = runsOf('improved-quality-v2', ['alerts', 'links', 'line-1']);
  assert.deepEqual(runs.map(r => r.lines), [['alerts', 'links']]);
  assert.deepEqual(runsOf('nope', ['alerts']), []);
});

test('every captured line is in exactly one run', () => {
  for (const runs of Object.values(VIDEO_RUNS)) { const all = runs.flatMap(r => r.lines); assert.equal(new Set(all).size, all.length); }
});

test('the Animations line (added to the board, not captured) has the first video: the reel of every animation (the user, 2026-10-12)', () => {
  const runs = runsOf('improved-quality-v2', ['animations', 'knowledge', 'instructions']); // (the lines that are on the board: captured ones and added ones)
  assert.equal(runs[0].id, 'animations');
  assert.deepEqual(runs[0].lines, ['animations']);
  assert.equal(runs[0].last, 'animations');
  assert.equal(runsOf('improved-quality-v2', ['knowledge']).some(r => r.id === 'animations'), false, 'without the line there is no reel');
  assert.equal(runsOf('increased-efficiency-v2', ['animations']).length, 0, 'the other board has no such line');
});

test('a line can hold the videos of the board side by side, in the order it says (the user, 2026-10-13: "take all videos and put them in one line")', () => {
  const added = {'line-3': {title: 'Videos', after: 'animations', shelf: ['knowledge', 'mission', 'ratings', 'managers', 'report']}, 'line-4': {title: 'Other', shelf: ['report', 'nope']}};
  const at = shelvedRuns(added, 'improved-quality-v2');
  assert.deepEqual([...at].map(([id, p]) => id + ':' + p.line + ':' + p.index), ['knowledge:line-3:0', 'mission:line-3:1', 'ratings:line-3:2', 'managers:line-3:3', 'report:line-3:4'], 'in its order; a video on two shelves stands in the first; one the board does not have is no video');
  assert.equal(shelvedRuns({'line-3': {shelf: ['knowledge', 'mission', 'ratings']}}, 'improved-quality-v2', new Set(['knowledge', 'ratings'])).get('ratings').index, 1, 'a video the board shows no lines of leaves no gap');
  assert.equal(shelvedRuns({'line-3': {shelf: ['knowledge']}}, 'increased-efficiency-v2').size, 0, 'the runs of another board are not these');
  assert.equal(shelvedRuns({'line-3': {title: 'No shelf'}}, 'improved-quality-v2').size, 0, 'a line without a shelf holds nothing');
});
