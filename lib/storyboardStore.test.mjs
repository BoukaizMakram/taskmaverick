import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readdir, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {storyboardStore, BACKUP_EVERY, KEEP, videoOf} from './storyboardStore.mjs';
import {EMPTY, setNote} from './storyboardEdits.mjs';

const withStore = async run => {
  const dir = await mkdtemp(path.join(tmpdir(), 'sb-store-'));
  try { await run(storyboardStore(dir), dir); } finally { await rm(dir, {recursive: true, force: true}); }
};
const T0 = new Date('2026-10-06T10:00:00.000Z'), later = ms => new Date(T0.getTime() + ms);

test('a file that is not there yet reads as empty, revision 0; each save bumps the revision', () => withStore(async store => {
  assert.deepEqual(await store.read('v1'), {edits: EMPTY, rev: 0});
  const one = await store.write('v1', setNote(EMPTY, 'a/1', 'hi'), {rev: 0, at: T0});
  assert.equal(one.rev, 1);
  const back = await store.read('v1');
  assert.deepEqual([back.rev, back.edits.frames['a/1'].note], [1, 'hi']);
  assert.equal((await store.write('v1', back.edits, {rev: 1, at: later(1000)})).rev, 2);
  assert.equal(videoOf('../x'), null);
}));

test('saving over a file that changed since it was read is a conflict: nothing is overwritten', () => withStore(async store => {
  await store.write('v1', setNote(EMPTY, 'a/1', 'from the page'), {rev: 0, at: T0});
  await store.write('v1', setNote(EMPTY, 'a/1', 'from the command line'), {rev: 1, at: later(1000)}); // rev 2 now
  const stale = await store.write('v1', setNote(EMPTY, 'a/1', 'stale page'), {rev: 1, at: later(2000)});
  assert.ok(stale.conflict);
  assert.deepEqual([stale.rev, stale.edits.frames['a/1'].note], [2, 'from the command line'], 'it says what the file holds now');
  assert.equal((await store.read('v1')).edits.frames['a/1'].note, 'from the command line');
}));

test('backups: before an import or a restore always, while saving at most one every 10 minutes, the newest kept', () => withStore(async (store, dir) => {
  await store.write('v1', setNote(EMPTY, 'a/1', 'one'), {at: T0});
  assert.equal((await store.backups('v1')).length, 0, 'nothing to back up before the first save');
  await store.write('v1', setNote(EMPTY, 'a/1', 'two'), {at: later(1000)});
  await store.write('v1', setNote(EMPTY, 'a/1', 'three'), {at: later(2000)});
  let list = await store.backups('v1');
  assert.deepEqual(list.map(b => b.reason), ['auto'], 'one while saving');
  assert.equal((await store.readBackup('v1', list[0].name)).frames['a/1'].note, 'one', 'what was there before');
  await store.write('v1', setNote(EMPTY, 'a/1', 'four'), {at: later(BACKUP_EVERY + 5000)});
  await store.write('v1', setNote(EMPTY, 'a/1', 'imported'), {reason: 'import', at: later(BACKUP_EVERY + 6000)});
  list = await store.backups('v1');
  assert.deepEqual(list.map(b => b.reason), ['import', 'auto', 'auto'], 'newest first');
  assert.equal((await store.readBackup('v1', list[0].name)).frames['a/1'].note, 'four');
  assert.ok(Date.parse(list[0].at) > Date.parse(list[1].at));
  for (let i = 0; i < KEEP + 3; i++) await store.backup('v1', 'manual', later(BACKUP_EVERY * 2 + i * 1000));
  assert.equal((await store.backups('v1')).length, KEEP, 'only the newest are kept');
  await assert.rejects(store.readBackup('v1', '../../v1.json'));
  const saved = JSON.parse(await readFile(path.join(dir, 'v1.json'), 'utf8'));
  assert.equal(saved.rev, 5, 'the revision is in the file');
  assert.ok((await readdir(dir)).every(name => !name.endsWith('.tmp')));
}));
