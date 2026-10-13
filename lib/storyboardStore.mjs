// The storyboard's saved files (content/storyboard/<video>.json), for the site's API
// (app/api/storyboard) and the command line (scripts/storyboard.mjs).
//   rev      every save bumps it: a page that saves over a file that changed since it read
//            it (the command line edited it, another tab) is told so (a conflict) instead of
//            overwriting it, and it merges and saves again
//   backups  before a file is overwritten a copy of it is kept in backups/<video>/: always
//            before an import or a restore, and else at most one every BACKUP_EVERY; the
//            newest KEEP stay
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {EMPTY, normalizeEdits} from './storyboardEdits.mjs';

export const BACKUP_EVERY = 10 * 60 * 1000;
export const KEEP = 80;
export const videoOf = value => (/^[a-z0-9-]{1,48}$/i.test(String(value ?? '')) ? String(value) : null);
const REASONS = ['auto', 'import', 'restore', 'manual', 'cli'];

export function storyboardStore(dir) {
  const fileOf = video => path.join(dir, `${video}.json`), folderOf = video => path.join(dir, 'backups', video);
  async function readRaw(video) {
    try { return JSON.parse(await fs.readFile(fileOf(video), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  // { edits, rev }
  async function read(video) {
    const raw = await readRaw(video);
    return {edits: normalizeEdits(raw ?? EMPTY), rev: Number.isInteger(raw?.rev) ? raw.rev : 0};
  }
  // [{ name, at (ISO), reason }], newest first
  async function backups(video) {
    let names = [];
    try { names = (await fs.readdir(folderOf(video))).filter(name => name.endsWith('.json')); } catch {}
    return names.sort().reverse().map(name => {
      const m = /^(\d{4}-\d\d-\d\dT\d\d)-(\d\d)-(\d\d)-(\d{3})Z--(\w+)\.json$/.exec(name);
      return {name, at: m ? `${m[1]}:${m[2]}:${m[3]}.${m[4]}Z` : null, reason: m ? m[5] : 'auto'};
    });
  }
  // Keep a copy of the file as it is now. -> its name (null: there is no file yet)
  async function backup(video, reason = 'manual', at = new Date()) {
    const raw = await readRaw(video);
    if (!raw) return null;
    await fs.mkdir(folderOf(video), {recursive: true});
    const name = `${at.toISOString().replace(/[:.]/g, '-')}--${REASONS.includes(reason) ? reason : 'manual'}.json`;
    await fs.writeFile(path.join(folderOf(video), name), JSON.stringify(raw, null, 2) + '\n', 'utf8');
    for (const old of (await backups(video)).slice(KEEP)) await fs.rm(path.join(folderOf(video), old.name)).catch(() => {});
    return name;
  }
  // Save `edits`. `rev`: the revision they were made from (a save from an older one is a conflict:
  // { conflict: true, edits, rev } = what the file holds now). An import or a restore (`reason`)
  // replaces the file whatever its revision, after a backup. -> { rev, edits }
  async function write(video, edits, {rev = null, reason = 'save', at = new Date()} = {}) {
    const current = await read(video), saving = reason === 'save';
    if (saving && rev != null && rev !== current.rev) return {conflict: true, ...current};
    if (current.rev > 0 || await readRaw(video)) {
      const last = (await backups(video))[0], lastAt = last?.at ? Date.parse(last.at) : 0;
      if (!saving || at.getTime() - lastAt > BACKUP_EVERY) await backup(video, saving ? 'auto' : reason, at);
    }
    const clean = normalizeEdits(edits), file = fileOf(video), temporary = `${file}.${randomUUID()}.tmp`;
    await fs.mkdir(dir, {recursive: true});
    try {
      await fs.writeFile(temporary, JSON.stringify({...clean, rev: current.rev + 1}, null, 2) + '\n', 'utf8');
      await fs.rename(temporary, file);
    } finally { await fs.unlink(temporary).catch(() => {}); }
    return {rev: current.rev + 1, edits: clean};
  }
  async function readBackup(video, name) {
    if (!/^[\w.-]+\.json$/.test(String(name))) throw new Error('No such backup.');
    return normalizeEdits(JSON.parse(await fs.readFile(path.join(folderOf(video), name), 'utf8')));
  }
  return {read, write, backup, backups, readBackup, fileOf};
}
