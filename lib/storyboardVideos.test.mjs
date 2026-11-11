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

// ---- The detailed videos: the same videos with a caption for each beat (the user, 2026-10-14) ----
test('every video that has captions has a detailed twin: the same lines, a title of its own, found only when asked for', async () => {
  const {DETAIL_RUNS, allRunsOf, profileOf} = await import('./storyboardVideos.mjs');
  const chapters = ['knowledge', 'instructions', 'alerts', 'links', 'translation', 'steps', 'micro', 'photo', 'video', 'emphasis', 'rate', 'peer', 'visibility', 'mobile', 'tour', 'web', 'remote', 'performer', 'timestamp', 'conclusion'];
  assert.equal(runsOf('improved-quality-v2', chapters).some(r => r.twin), false, 'a twin is not at the end of its lines unless it is asked for');
  const all = runsOf('improved-quality-v2', chapters, true);
  assert.equal(all.length, 25, 'five videos, and each has the detailed twin and its three variants');
  const mission = all.find(r => r.id === 'mission'), twin = all.find(r => r.id === 'mission-detail');
  assert.deepEqual(twin.lines, mission.lines);
  assert.equal(twin.title, 'The mission: instructions to video proof · in detail');
  assert.equal(twin.twin, true);
  assert.equal(DETAIL_RUNS['increased-efficiency-v2'].length, 12, 'a video with nothing to add has no twin: three videos, four each');
  assert.equal(allRunsOf('nope').length, 0);
  assert.equal(profileOf('improved-quality-v2', twin.title).detail.run, 'mission-detail');
});

test('a detailed twin has the video\'s ways with the software but not its pace, and its captions are in lib/storyboardDetails.mjs', async () => {
  const {profileOf, PROFILES} = await import('./storyboardVideos.mjs');
  const {DETAILS} = await import('./storyboardDetails.mjs');
  const managers = profileOf('improved-quality-v2', 'What managers see'), twin = profileOf('improved-quality-v2', 'What managers see · in detail');
  assert.ok(managers.tempo < 1 && managers.natural != null, 'the original is short');
  for (const pace of ['tempo', 'natural', 'rest', 'beats', 'scenes', 'asSlides']) assert.equal(pace in twin, false, `${pace} is not the twin's`);
  assert.deepEqual(twin.scroll, managers.scroll, 'the list is still scrolled');
  assert.equal(twin.dimMenu, true);
  assert.ok(twin.cps === 30 && twin.detail.read >= 1, 'its pen is the usual 30 letters a second and a caption stays a while once it is written: the user reads it');
  assert.deepEqual(twin.detail.scenes, DETAILS['improved-quality-v2'].managers.scenes);
  const mission = profileOf('improved-quality-v2', 'The mission: instructions to video proof · in detail');
  assert.ok(mission.lesson && mission.keepCursor && mission.showStep && mission.open, 'the lesson, the cursor, the step and the opening card are the mission\'s');
  assert.equal(PROFILES['increased-efficiency-v2']['board-detail'].centerMarks, true);
});

test('every step is a few words, and every scene of a twin is a scene of the lines it plays', async () => {
  const {DETAILS} = await import('./storyboardDetails.mjs');
  for (const [board, videos] of Object.entries(DETAILS)) {
    for (const [id, spec] of Object.entries(videos)) {
      const run = VIDEO_RUNS[board].find(r => r.id === id);
      assert.ok(run, `${board}/${id} is a video of the board`);
      for (const [scene, steps] of Object.entries(spec.scenes)) {
        assert.ok(run.lines.includes(scene), `${scene} is a line of ${id}`);
        for (const step of steps) { assert.ok(step.length > 10 && step.length <= 56, `${step} (${step.length} letters): short`); assert.ok(/[.!?]$/.test(step), `${step}: a sentence`); }
      }
      for (const scene of spec.each ?? []) assert.ok(spec.scenes[scene]?.length, `${scene}: a scene whose every change is a step has steps`);
    }
  }
});

test('the detailed videos have three variants: the cursor instead of the highlight, the cursor with it (the user, 2026-10-15), the cursor with the area popped up (2026-10-19)', async () => {
  const {DETAIL_RUNS, DETAIL_VARIANTS, profileOf} = await import('./storyboardVideos.mjs');
  const runs = DETAIL_RUNS['improved-quality-v2'].filter(r => r.like === 'knowledge');
  assert.deepEqual(runs.map(r => r.id), ['knowledge-detail', 'knowledge-detail-cursor', 'knowledge-detail-both', 'knowledge-detail-popup']);
  assert.deepEqual(runs.map(r => r.title), ['The tablet and its Knowledge Base · in detail', 'The tablet and its Knowledge Base · in detail, cursor only', 'The tablet and its Knowledge Base · in detail, highlight and cursor', 'The tablet and its Knowledge Base · in detail, cursor and pop-up']);
  assert.equal(DETAIL_VARIANTS.length, 4);
  const [plain, cursor, both, popup] = runs.map(r => profileOf('improved-quality-v2', r.title));
  assert.equal(plain.pointer, undefined, 'the detailed video itself is as it was');
  assert.deepEqual(cursor.pointer, {marks: false}, 'no highlight, the cursor points');
  assert.deepEqual(both.pointer, {marks: true}, 'the highlight and the cursor');
  assert.deepEqual(popup.pointer, {marks: true, popup: true}, 'the cursor, the area popped up, the rest dimmed (the user, 2026-10-19)');
  assert.equal(popup.detail.run, 'knowledge-detail');
  assert.equal(cursor.detail.run, 'knowledge-detail', 'the captions are the detailed video: words typed over one are the words of the three');
  assert.equal(both.detail.run, 'knowledge-detail');
  assert.deepEqual(cursor.detail.scenes, plain.detail.scenes);
  const mission = profileOf('improved-quality-v2', 'The mission: instructions to video proof · in detail, cursor only');
  assert.ok(mission.lesson && mission.keepCursor && mission.showStep, 'the missions own ways are kept');
});

test('the pointer is the cursor of the demo as a layer of its own, and the fingertip goes where it is asked', async () => {
  const {POINTER_ASSET, POINTER_LAYER, POINT, pointerHtmlOf, cornerOf, pointerMove} = await import('./storyboardPointer.mjs');
  assert.equal(POINTER_LAYER.name, 'Hand');
  assert.equal(POINTER_LAYER.asset, POINTER_ASSET);
  assert.ok(pointerHtmlOf(POINTER_ASSET).includes('/demo-hand.png'));
  assert.equal(pointerHtmlOf('f13070bd2996'), undefined, 'any other asset is not this one');
  assert.deepEqual(cornerOf([{x: 100, y: 50, w: 200, h: 40}]), {x: 300 - POINT.dx, y: 90 - POINT.dy}, 'the bottom right corner, a little inside');
  assert.deepEqual(cornerOf([{x: 100, y: 50, w: 200, h: 40}, {x: 400, y: 60, w: 100, h: 80}]), {x: 500 - POINT.dx, y: 140 - POINT.dy}, 'of the whole of the highlights');
  assert.deepEqual(cornerOf([{x: 1000, y: 200, w: 150, h: 690}], 900), {x: 1150 - POINT.dx, y: 900 - POINT.room}, 'a highlight down to the edge of the picture: the whole hand is on the picture');
  const tip = {x: 16 / 42, y: 1 / 52}, [dx, dy] = pointerMove({x: 300, y: 200}, tip);
  assert.ok(Math.abs(POINTER_LAYER.box.x + dx + POINTER_LAYER.box.w * tip.x - 300) < 1e-9 && Math.abs(POINTER_LAYER.box.y + dy + POINTER_LAYER.box.h * tip.y - 200) < 1e-9, 'the fingertip lands on the point');
});
