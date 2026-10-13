#!/usr/bin/env node
// Makes the Animations line, the first line of the Improved Quality board (lib/storyboardAnimations.mjs, docs/storyboard.md): one scene for
// each animation the storyboard's video plays, from duplicates of the board's own frames. Running it again makes the line again from the
// scenes in the lib (the frames of the line are removed and made anew; nothing else on the board is touched). A backup of the board is kept first.
//
//   node scripts/storyboard-animations.mjs [--dry]
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {linesOf, orderedFrames} from '../lib/storyboardEdits.mjs';
import {storyboardStore} from '../lib/storyboardStore.mjs';
import {ANIMATIONS, buildAnimations} from '../lib/storyboardAnimations.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD = 'improved-quality-v2', OTHERS = ['increased-efficiency-v2'];
const store = storyboardStore(path.join(ROOT, 'content', 'storyboard'));
const fail = message => { console.error(message); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dry = process.argv.includes('--dry');

async function loadBoard(video) {
  const {edits, rev} = await store.read(video);
  const captured = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'storyboard', `${video}.json`), 'utf8'));
  const lines = linesOf(captured.chapters, edits), frames = orderedFrames(captured.frames, edits, lines.map(l => l.id));
  return {video, edits, rev, frames, stage: captured.stage, htmlOf: hash => edits.library[hash] ?? captured.assets[hash]};
}

const board = await loadBoard(BOARD), other = {};
for (const id of OTHERS) other[id] = await loadBoard(id);
const built = buildAnimations(board.edits, {frames: board.frames, htmlOf: board.htmlOf, other});
for (const scene of built.scenes) console.log(`  ${scene.name.padEnd(24)} ${scene.ids.length} frame${scene.ids.length === 1 ? '' : 's'}: ${scene.ids.join(', ')}`);
for (const p of built.problems) console.log(`  ! ${p}`);
if (built.problems.length) fail('Some frames could not be made: the board is left as it is.');
if (dry) { console.log(`(dry run: ${built.ids.length} frames in the line ${ANIMATIONS.title}, nothing saved)`); process.exit(0); }
const newest = (await store.backups(BOARD))[0]; // (a backup unless one was kept in the last minutes: the board keeps the newest 80, and this can be run again and again)
if (!newest?.at || Date.now() - Date.parse(newest.at) > 10 * 60 * 1000) console.log(`backup: ${await store.backup(BOARD, 'manual')}`);
for (let i = 0; i < 8; i++) {
  const {edits, rev} = await store.read(BOARD), made = buildAnimations(edits, {frames: (await loadBoard(BOARD)).frames, htmlOf: hash => edits.library[hash] ?? board.htmlOf(hash), other});
  const done = await store.write(BOARD, made.edits, {rev});
  if (!done.conflict) { console.log(`saved: the line ${ANIMATIONS.title} has ${made.ids.length} frames (${BOARD}, revision ${done.rev})`); process.exit(0); }
  await sleep(300);
}
fail(`${BOARD} kept changing: run it again.`);
