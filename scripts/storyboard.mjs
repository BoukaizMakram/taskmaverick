#!/usr/bin/env node
// The storyboard from the command line: to look at a board and change exactly one thing on it
// (a word, a color, a place, a note, a line), nothing else. Every change is saved the way the
// page saves it (content/storyboard/<video>.json, with its revision, so an open page shows it
// within seconds and nothing edited there is overwritten) and backed up (backups/).
//
//   node scripts/storyboard.mjs help
//
// Frames are named like the board numbers them: "<line>:<n>" (the line by its id or by its
// name, or the start of it; n counts from 1 in that line), or by their id. Assets by their key
// (or their name); a part of one by the key the `texts` command prints.
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  STYLE_KEYS, addBlank, addBlankIn, addCopy, addInserts, addLine, setBubble, setLock, setTails, sizeBubbles, deleteFrame, duplicateLine, hasChanges, hideLayer, hideLine, intoLine, layersOf,
  linesOf, makeExport, moveFrame, normalizeEdits, noteOf, orderedFrames, readExport, removeInsert, renameLine, resetAsset, resetFrame,
  moveLayers, moveLine, setAnim, setBackground, setLineShelf, setLineView, setMove, setName, setNote, setScale, setSize, setStyle, setText, setTip, styleValue,
} from '../lib/storyboardEdits.mjs';
import {cellsOf, followersOf, slidesOrder} from '../lib/storyboardCells.mjs';
import {VIDEO_RUNS, shelvedRuns} from '../lib/storyboardVideos.mjs';
import {storyboardStore} from '../lib/storyboardStore.mjs';
import {TRASH, addToTrash, trashEntry, trashVideo} from '../lib/storyboardTrash.mjs';
import {copyFrames} from '../lib/storyboardClipboard.mjs';
import {linkedParts, splitKey} from '../lib/storyboardLinks.mjs';
import {PAINT_PRESETS, normalizePaint} from '../lib/storyboardPaint.mjs';
import {elementAt, findRoot, parseHtml, textOf, textsOf, wrapperScale} from '../lib/storyboardHtml.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS = [{id: 'improved-quality-v2', name: 'Improved Quality'}, {id: 'increased-efficiency-v2', name: 'Increased Efficiency'}];
const BOARDS = [...VIDEOS.map(v => v.id), TRASH];
const store = storyboardStore(path.join(ROOT, 'content', 'storyboard'));

const HELP = `The storyboard from the command line (see docs/storyboard.md).

  node scripts/storyboard.mjs <command> [arguments] [--video <id>]
  --video   improved-quality-v2 (default) | increased-efficiency-v2 | trash

Look
  lines                          the lines, in order: id, name, frames
  frames [line]                  the frames of every line (or one): <line>:<n>, id, label, edited
  frame <frame>                  a frame: its note, its assets (key, name, box), what was changed
  texts <frame> [asset]          every text of a frame (or an asset) with its key and words
  find <words>                   the frames whose label, note or texts hold these words

Change (one thing; the rest of the board is left exactly as it is)
  note <frame> <words>           the note under a frame ("" takes it off)
  name <frame> <words>           the name a frame shows in its header instead of its label ("" takes it off)
  text <frame> <key> <words>     retype a text (its duplicates along the line too, as on the
                                 page; --only: this one alone). \\n starts a new line in a bubble
  move <frame> <asset> <dx> <dy> move by stage px (the frame is 1600 x 900); --to: put its top
                                 left corner at <x> <y>
  scale <frame> <asset> <s> [sy] scale a UI element (1 = as captured)
  size <frame> <asset> <w> <h>   the size of a box (a picture, the spotlight, a chat bubble)
  tip <frame> <bubble> <dx> <dy> move where a bubble's tail points (stage px)
  style <frame> <asset> k=v ...  like the sidebar: ${Object.keys(STYLE_KEYS).join(', ')}
                                 (k= takes one off; font: inter, montserrat, poppins)
  layer <frame> <asset> <back|front|backward|forward>  the stacking: send an asset to the back / front or one step down / up
  paint <frame> <background|asset> <color|preset|json>  a frame's background, or an asset's fill: a color (#rrggbb), a ready paint (PAINT_PRESETS id:
                                 night, gold, carbon…) or a gradient as JSON {"kind":"linear","angle":135,"stops":[{"color":"#000","at":0},{"color":"#fff","at":100}]}; none takes it off
  device <frame|all> <color|preset|none>  the color of the iPads' frame (the device photo) in a frame, or in every frame of the board
                                 (all in one save): device all "#535353" | device knowledge:5 chrome-mirror (a ready paint: see PAINT_PRESETS)
  lock <frame> <asset> <w|h|wh|none>  lock its width, height or both (handles and W / H leave them)
  tail <frame> <bubble> on|off   a chat box's tail      words <frame> <bubble> show|hide  its words
  tails on|off                   every chat box of the board with or without its tail
  highlight <frame> <x> <y> <w> <h>  a yellow rectangle there (stage px), like the demos' (.iq2-mark)
  add-html <frame> <name> <file> <x> <y> <w> <h>  an asset made of that HTML, at that place
  bubbles <width> [--lock]    every chat box of the board that wide (its words wrap to it, its
                                 height as it was), its width locked
  typing <file.json>             chat boxes mid-typing in one save: [{"frame": id, "asset": key, "key": text key, "text": "As Teams\\n\\n"}]
                                 (each shows its words: the first words, then empty lines so the box keeps its size)
  moves <file.json>              many moves in one save: [{"frame": id, "asset": key, "dx": 0, "dy": 12.5}] (stage px,
                                 each added to where the asset is now)
  put-back <frame> <asset>       the asset as captured (place, size, scale, tail, styles, locks)
  hide <frame> <asset>           take an asset out of a frame
  reset <frame>                  the frame as captured (its note stays)
  duplicate <frame>              a copy right after it
  blank <frame|line>             a blank frame after a frame, or at the end of a line
  delete <frame> ...             to the Trash, with its line's name
  drop <frame> ...               off the board WITHOUT the Trash (frames that exist only because of a recapture)
  to-line <frame> <line> [n]     move a frame to a line (at the end, or to be its n-th)
  animate <frame> <bubble> <handwrite|off> [letters/s]  a chat box's words written by a pen, so many letters a second (the play button on the slide)
  line-add <name> [--after <line> | --first]   line-rename <line> <name>
  line-duplicate <line>          line-delete <line> (its frames go to the Trash)
  line-view <line> videos|slides a line of videos (Animations) as videos, one player each, or as the slides they are made of
  line-shelf <line> <video>... | none   the videos of the board (their ids or the start of their titles, in the order they stand in) put together in this line, side by side,
                                 instead of each at the right of its own last line; none puts them back (the videos of the board: runs)
  runs                           the videos of the board: id, title, its lines, the line that holds it

Files
  export [file]                  the whole storyboard, editable (every board and the Trash)
  import <file>                  put an export back (each board is backed up first)
  backups                        the backups of a board, newest first
  backup                         keep a backup of a board now
  restore <backup>               put a board back as a backup has it (backed up first)
`;

// ---- Arguments ----
const argv = process.argv.slice(2), flags = {}, args = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--only' || a === '--to' || a === '--lock') flags[a.slice(2)] = true;
  else if (a === '--z') flags.z = Number(argv[++i]);
  else if (a === '--first') flags.first = true;
  else if (a.startsWith('--')) flags[a.slice(2)] = argv[++i];
  else args.push(a);
}
const command = args.shift() ?? 'help';
const videoId = flags.video ?? 'improved-quality-v2';
const fail = message => { console.error(message); process.exit(1); };
if (!BOARDS.includes(videoId)) fail(`Unknown board "${videoId}": ${BOARDS.join(', ')}`);
const pad = (s, n) => String(s).padEnd(n);
const r = n => Math.round(n * 100) / 100;

// ---- The board as the page lays it out ----
async function loadBoard(id = videoId) {
  const {edits, rev} = await store.read(id);
  let video;
  if (id === TRASH) video = trashVideo({version: 1, video: TRASH, name: 'Trash', stage: {}, chapters: [], frames: [], assets: {}}, edits);
  else {
    try { video = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'storyboard', `${id}.json`), 'utf8')); }
    catch { fail(`No frames for ${id}: run npm run gen:storyboard with the site running.`); }
  }
  const lines = linesOf(video.chapters, edits), frames = orderedFrames(video.frames, edits, lines.map(l => l.id));
  const numbered = frames.map(f => ({...f, n: frames.filter(g => g.chapter === f.chapter).indexOf(f) + 1}));
  return {id, video, edits, rev, lines, frames: numbered, htmlOf: hash => edits.library[hash] ?? video.assets[hash]};
}
const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function lineOf(b, ref) {
  if (ref == null) fail('Which line?');
  const exact = b.lines.find(l => l.id === ref) ?? b.lines.find(l => norm(l.title) === norm(ref));
  if (exact) return exact;
  const some = b.lines.filter(l => norm(l.title).startsWith(norm(ref)) || norm(l.id).startsWith(norm(ref)));
  if (some.length === 1) return some[0];
  const inside = b.lines.filter(l => norm(l.title).includes(norm(ref)));
  if (inside.length === 1) return inside[0];
  fail(`${some.length + inside.length ? 'More than one' : 'No'} line matches "${ref}": ${(some.length ? some : inside.length ? inside : b.lines).map(l => `${l.id} (${l.title})`).join(', ')}`);
}
function frameOf(b, ref) {
  if (ref == null) fail('Which frame?');
  const byId = b.frames.find(f => f.id === ref);
  if (byId) return byId;
  const m = /^(.*)[:#]\s*(\d+)$/.exec(ref);
  if (!m) fail(`No frame "${ref}": name it <line>:<n> (see the frames command) or by its id.`);
  const line = lineOf(b, m[1]), f = b.frames.filter(g => g.chapter === line.id)[Number(m[2]) - 1];
  if (!f) fail(`The line ${line.title} has ${b.frames.filter(g => g.chapter === line.id).length} frames.`);
  return f;
}
const where = (b, f) => `${b.lines.find(l => l.id === f.chapter)?.title ?? f.chapter}:${f.n}`;
function assetOf(b, f, ref) {
  if (ref == null) fail('Which asset?');
  const layers = layersOf(f, b.edits.frames[f.id]), {layer, rest} = splitKey(ref);
  const found = layers.find(l => l.key === layer) ?? layers.find(l => norm(l.name) === norm(layer));
  if (!found) fail(`No asset "${layer}" in ${where(b, f)}: ${layers.map(l => `${l.key} (${l.name})`).join(', ')}`);
  return {layer: found, key: found.key + rest};
}
// The words a part says now (its retyped words, else what was captured).
function textNow(b, frameId, layer, rest) {
  const kept = b.edits.frames[frameId]?.texts?.[layer.key + rest];
  if (kept != null) return kept;
  const root = findRoot(parseHtml(b.htmlOf(layer.asset) ?? ''), layer.key);
  if (!root) return null;
  const [p, n] = rest.split('#'), el = elementAt(root, p ? p.slice(1) : '');
  if (!el) return null;
  if (n != null) { const node = el.children[Number(n)]; return node?.type === 'text' ? node.text : null; }
  return textsOf(b.htmlOf(layer.asset), layer.key).find(t => t.key === layer.key + rest)?.text ?? textOf(el);
}

// ---- Saving: the way the page does (its revision; a backup kept) ----
async function save(b, next, what, reason = 'save') {
  const done = await store.write(b.id, next, {rev: b.rev, reason});
  if (done.conflict) fail('The board changed while this ran (the page saved meanwhile): run it again.');
  console.log(`${what}  (saved: ${b.id}, revision ${done.rev})`);
}
async function changeTrash(change) {
  for (let i = 0; i < 4; i++) {
    const {edits, rev} = await store.read(TRASH), done = await store.write(TRASH, change(edits), {rev});
    if (!done.conflict) return;
  }
  fail('The Trash kept changing: run it again.');
}
// Frames to the Trash with their line's name (and, with `then`, a change made in the same save).
async function trashFrames(b, frames, then = null, what = '') {
  const at = new Date().toISOString(), batch = `${Date.parse(at).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const board = {id: b.id, name: VIDEOS.find(v => v.id === b.id)?.name ?? b.id, chapters: b.lines, stage: b.video.stage};
  const clip = frames.length ? copyFrames({frames, edits: b.edits, htmlOf: b.htmlOf, stage: b.video.stage, video: b.id}) : {items: []};
  const entries = clip.items.map((item, i) => trashEntry({item, frame: frames[i], board, at, id: `trash-${batch}-${i + 1}`}));
  if (entries.length) await changeTrash(e => addToTrash(e, entries, at).edits);
  let next = frames.reduce((e, f) => deleteFrame(e, f.id), b.edits);
  if (then) next = then(next);
  await save(b, next, what || `${frames.length} frame${frames.length === 1 ? '' : 's'} moved to the Trash`);
}

// An asset brought into a frame from its own HTML (a highlight, a piece made for one frame).
const freeKey = (b, f, name) => { const taken = new Set(layersOf(f, b.edits.frames[f.id]).map(l => l.key)), base = `c-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'asset'}`; let n = 1; while (taken.has(`${base}-${n}`)) n++; return `${base}-${n}`; };
const zOf = (b, f) => (Number.isFinite(flags.z) ? flags.z : 20 + 2 * (b.edits.frames[f.id]?.inserts ?? []).length); // (--z: its place in the stack)
const hashOf = text => { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0') + text.length.toString(16); };
function insertHtml(b, f, key, name, html, box) {
  const asset = hashOf(html);
  return addInserts(b.edits, f.id, [{key, name, kind: 'dom', asset, box, z: zOf(b, f)}], {[asset]: html});
}

// ---- Commands ----
const num = (v, name) => { const n = Number(v); if (!Number.isFinite(n)) fail(`${name} must be a number`); return n; };
const commands = {
  async help() { console.log(HELP); },

  async lines() {
    const b = await loadBoard();
    for (const l of b.lines) console.log(`${pad(l.id, 22)} ${pad(l.title, 46)} ${b.frames.filter(f => f.chapter === l.id).length} frames${l.added ? '  (added)' : ''}`);
  },

  async frames(line) {
    const b = await loadBoard(), only = line ? lineOf(b, line) : null;
    for (const l of only ? [only] : b.lines) {
      console.log(`\n${l.title}  [${l.id}]`);
      for (const f of b.frames.filter(g => g.chapter === l.id)) {
        const note = noteOf(b.edits, f.id);
        console.log(`  ${pad(`${l.id}:${f.n}`, 18)} ${pad(f.id, 26)} ${pad(f.label + (f.isCopy && !f.isBlank ? ' (copy)' : ''), 40)}${hasChanges(b.edits, f.id) ? ' edited' : ''}${note ? `  note: ${note.replace(/\s+/g, ' ').slice(0, 60)}` : ''}`);
      }
    }
  },

  async frame(ref) {
    const b = await loadBoard(), f = frameOf(b, ref), e = b.edits.frames[f.id] ?? {};
    console.log(`${where(b, f)}  id ${f.id}  ${f.label}${f.time != null ? `  at ${f.time}s` : ''}`);
    if (e.note) console.log(`note: ${e.note}`);
    console.log('assets (key, name, kind, captured box x,y w×h in stage px, what was changed):');
    for (const l of layersOf(f, e)) {
      const changes = ['moves', 'scales', 'sizes', 'tips', 'styles', 'locks'].map(k => { const own = Object.entries(e[k] ?? {}).filter(([key]) => splitKey(key).layer === l.key); return own.length ? `${k} ${own.map(([key, v]) => `${key}=${JSON.stringify(v)}`).join(' ')}` : null; }).filter(Boolean);
      const brought = e.inserts?.some(x => x.key === l.key);
      console.log(`  ${pad(l.key, 22)} ${pad(l.name, 22)} ${pad(l.kind + (brought ? '+' : ''), 8)} ${l.box ? `${r(l.box.x)},${r(l.box.y)} ${r(l.box.w)}×${r(l.box.h)}` : ''}${changes.length ? `\n${' '.repeat(26)}${changes.join(' · ')}` : ''}`);
    }
    if (e.hidden?.length) console.log(`taken out: ${e.hidden.join(', ')}`);
  },

  async texts(ref, asset) {
    const b = await loadBoard(), f = frameOf(b, ref), e = b.edits.frames[f.id];
    const layers = asset ? [assetOf(b, f, asset).layer] : layersOf(f, e);
    for (const l of layers) {
      const texts = textsOf(b.htmlOf(l.asset), l.key);
      if (!texts.length) continue;
      console.log(`${l.key} (${l.name})`);
      for (const t of texts) { const kept = e?.texts?.[t.key]; console.log(`  ${pad(t.key, 26)} ${JSON.stringify(kept ?? t.text)}${kept != null ? '  (retyped)' : ''}`); }
    }
  },

  async find(...words) {
    const b = await loadBoard(), q = norm(words.join(' '));
    if (!q) fail('Find what?');
    for (const f of b.frames) {
      const e = b.edits.frames[f.id], hits = [];
      if (norm(f.label).includes(q)) hits.push('label');
      if (norm(noteOf(b.edits, f.id)).includes(q)) hits.push('note');
      for (const l of layersOf(f, e)) for (const t of textsOf(b.htmlOf(l.asset), l.key)) if (norm(e?.texts?.[t.key] ?? t.text).includes(q)) hits.push(t.key);
      if (hits.length) console.log(`${pad(`${f.chapter}:${f.n}`, 18)} ${pad(f.id, 26)} ${hits.slice(0, 6).join(', ')}`);
    }
  },

  async note(ref, ...words) {
    const b = await loadBoard(), f = frameOf(b, ref);
    await save(b, setNote(b.edits, f.id, words.join(' ')), `Note of ${where(b, f)} set`);
  },

  async name(ref, ...words) {
    const b = await loadBoard(), f = frameOf(b, ref);
    await save(b, setName(b.edits, f.id, words.join(' ')), `Name of ${where(b, f)} set`);
  },

  async text(ref, key, ...words) {
    const b = await loadBoard(), f = frameOf(b, ref), {layer, key: full} = assetOf(b, f, key), {rest} = splitKey(full);
    const was = textNow(b, f.id, layer, rest);
    if (was == null) fail(`No text at ${full}: see the texts command.`);
    const now = words.join(' ').replace(/\\n/g, '\n');
    const also = flags.only ? [] : linkedParts({frames: b.frames, edits: b.edits, frame: f, key: full})
      .filter(p => { const pl = layersOf(b.frames.find(g => g.id === p.frame), b.edits.frames[p.frame]).find(l => l.key === p.layer); return pl && textNow(b, p.frame, pl, p.rest) === was; });
    const next = [{frame: f.id, key: full}, ...also].reduce((e, p) => setText(e, p.frame, p.key, now), b.edits);
    await save(b, next, `Retyped ${full} in ${where(b, f)}${also.length ? ` and its ${also.length} duplicate${also.length > 1 ? 's' : ''} in this line` : ''}: ${JSON.stringify(was)} -> ${JSON.stringify(now)}`);
  },

  async move(ref, asset, a, c) {
    const b = await loadBoard(), f = frameOf(b, ref), {layer, key} = assetOf(b, f, asset);
    const k = key.includes('/') ? 1 : wrapperScale(b.htmlOf(layer.asset), layer.key), cur = b.edits.frames[f.id]?.moves?.[key] ?? [0, 0];
    let to;
    if (flags.to) { if (key.includes('/') || !layer.box) fail('--to works on a whole asset.'); to = [cur[0] + (num(a, 'x') - (layer.box.x + cur[0] * k)) / k, cur[1] + (num(c, 'y') - (layer.box.y + cur[1] * k)) / k]; }
    else to = [cur[0] + num(a, 'dx') / k, cur[1] + num(c, 'dy') / k];
    await save(b, setMove(b.edits, f.id, key, to), `Moved ${key} in ${where(b, f)} (now ${r(to[0] * k)}, ${r(to[1] * k)} stage px from where it was captured)`);
  },

  async typing(file) {
    if (!file) fail('typing <file.json>');
    let list;
    try { list = JSON.parse(await fs.readFile(file, 'utf8')); } catch { fail(`Could not read ${file}`); }
    const b = await loadBoard();
    let next = b.edits, count = 0;
    for (const m of Array.isArray(list) ? list : []) {
      const f = b.frames.find(g => g.id === m.frame);
      if (!f) { console.warn(`! no frame ${m.frame}`); continue; }
      const {layer} = assetOf(b, f, m.asset);
      if (layer.kind !== 'bubble') { console.warn(`! ${m.asset} in ${m.frame} is not a chat box`); continue; }
      next = setText(setBubble(next, f.id, layer.key, {words: true}), f.id, m.key ?? `${layer.key}/0.0`, String(m.text));
      count++;
    }
    await save(b, next, `${count} chat boxes show the start of their words`);
  },

  async moves(file) {
    if (!file) fail('moves <file.json>');
    let list;
    try { list = JSON.parse(await fs.readFile(file, 'utf8')); } catch { fail(`Could not read ${file}`); }
    const b = await loadBoard();
    let next = b.edits, count = 0;
    for (const m of Array.isArray(list) ? list : []) {
      const f = b.frames.find(g => g.id === m.frame);
      if (!f) { console.warn(`! no frame ${m.frame}`); continue; }
      const {layer, key} = assetOf(b, f, m.asset), k = key.includes('/') ? 1 : wrapperScale(b.htmlOf(layer.asset), layer.key), cur = next.frames[f.id]?.moves?.[key] ?? [0, 0];
      next = setMove(next, f.id, key, [cur[0] + num(m.dx ?? 0, 'dx') / k, cur[1] + num(m.dy ?? 0, 'dy') / k]);
      count++;
    }
    await save(b, next, `${count} assets moved`);
  },

  async scale(ref, asset, sx, sy) {
    const b = await loadBoard(), f = frameOf(b, ref), {key} = assetOf(b, f, asset), x = num(sx, 'scale');
    await save(b, setScale(b.edits, f.id, key, [x, sy == null ? x : num(sy, 'scale')]), `Scaled ${key} in ${where(b, f)}`);
  },

  async size(ref, asset, w, h) {
    const b = await loadBoard(), f = frameOf(b, ref), {key} = assetOf(b, f, asset);
    await save(b, setSize(b.edits, f.id, key, [num(w, 'w'), num(h, 'h')]), `Sized ${key} in ${where(b, f)}`);
  },

  async tip(ref, asset, dx, dy) {
    const b = await loadBoard(), f = frameOf(b, ref), {layer} = assetOf(b, f, asset);
    if (layer.kind !== 'bubble') fail(`${layer.key} is not a chat bubble.`);
    const cur = b.edits.frames[f.id]?.tips?.[layer.key] ?? [0, 0];
    await save(b, setTip(b.edits, f.id, layer.key, [cur[0] + num(dx, 'dx'), cur[1] + num(dy, 'dy')]), `Moved the tail of ${layer.key} in ${where(b, f)}`);
  },

  async style(ref, asset, ...pairs) {
    const b = await loadBoard(), f = frameOf(b, ref), {key} = assetOf(b, f, asset), patch = {};
    for (const p of pairs) {
      const [k, ...v] = p.split('='), value = v.join('=');
      if (!(k in STYLE_KEYS)) fail(`No style "${k}": ${Object.keys(STYLE_KEYS).join(', ')}`);
      if (value !== '' && styleValue(k, value === 'true' ? true : value) == null) fail(`"${value}" is not a ${STYLE_KEYS[k]} for ${k}`);
      patch[k] = value === '' ? null : STYLE_KEYS[k] === 'bool' ? value !== 'false' : value;
    }
    if (!Object.keys(patch).length) fail('Which style? key=value');
    await save(b, setStyle(b.edits, f.id, key, patch), `Styled ${key} in ${where(b, f)}: ${pairs.join(' ')}`);
  },

  async layer(ref, asset, how) {
    if (!ref || !asset || !['back', 'front', 'backward', 'forward'].includes(how)) fail('layer <frame> <asset> <back|front|backward|forward>');
    const b = await loadBoard(), f = frameOf(b, ref), {key} = assetOf(b, f, asset), next = moveLayers(b.edits, f, [key], how);
    if (next === b.edits) { console.log('Already there.'); return; }
    await save(b, next, `${key} in ${where(b, f)} sent to the ${how}`);
  },

  async paint(ref, target, value) {
    if (!ref || !target || value == null) fail('paint <frame> <background|asset> <color|preset|json>');
    const b = await loadBoard(), f = frameOf(b, ref), preset = PAINT_PRESETS.find(p => p.id === value);
    let paint = ['none', 'off', ''].includes(value) ? null : preset ? preset.paint : value;
    if (typeof paint === 'string' && paint.trim().startsWith('{')) { try { paint = JSON.parse(paint); } catch { fail('That JSON is not valid.'); } }
    if (paint !== null && normalizePaint(paint) == null) fail(`"${value}" is not a color, a ready paint (${PAINT_PRESETS.map(p => p.id).join(', ')}) or a gradient as JSON`);
    if (target === 'background') { await save(b, setBackground(b.edits, f.id, paint), `Background of ${where(b, f)}: ${preset ? preset.name : paint === null ? 'as captured' : typeof paint === 'string' ? paint : 'gradient'}`); return; }
    const {key} = assetOf(b, f, target);
    await save(b, setStyle(b.edits, f.id, key, {fill: paint}), `Fill of ${key} in ${where(b, f)}: ${preset ? preset.name : paint === null ? 'as designed' : typeof paint === 'string' ? paint : 'gradient'}`);
  },

  async device(ref, color) {
    if (!ref || color == null) fail('device <frame|all> <color|none>');
    const preset = PAINT_PRESETS.find(p => p.id === color);
    const b = await loadBoard(), frames = ref === 'all' ? b.frames : [frameOf(b, ref)], value = ['none', 'off', ''].includes(color) ? null : preset ? preset.paint : color;
    if (value !== null && styleValue('bezel', value) == null) fail(`"${color}" is not a color (#rrggbb) or a ready paint: ${PAINT_PRESETS.map(p => p.id).join(', ')}`);
    let next = b.edits, tablets = 0, inFrames = 0;
    for (const f of frames) {
      let any = false;
      for (const layer of layersOf(f, next.frames[f.id])) {
        if (!(b.htmlOf(layer.asset) ?? '').includes('tbl-tablet')) continue; // (an asset with an iPad in it)
        next = setStyle(next, f.id, layer.key, {bezel: value}); tablets++; any = true;
      }
      if (any) inFrames++;
    }
    if (!tablets) { console.log('No iPad in there.'); return; }
    await save(b, next, `${value ? `iPad frame ${preset ? preset.name : value}` : 'iPad frame as designed'}: ${tablets} iPad${tablets === 1 ? '' : 's'} in ${inFrames} frame${inFrames === 1 ? '' : 's'}`);
  },

  async lock(ref, asset, axes) {
    const b = await loadBoard(), f = frameOf(b, ref), {key} = assetOf(b, f, asset);
    if (!['w', 'h', 'wh', 'hw', 'none'].includes(axes)) fail('Lock what? w, h, wh or none');
    await save(b, setLock(b.edits, f.id, key, axes === 'none' ? '' : axes), `${axes === 'none' ? 'Unlocked' : `Locked the ${axes.replace('w', 'width ').replace('h', 'height ').trim().replace(' ', ' and ')} of`} ${key} in ${where(b, f)}`);
  },

  async animate(ref, asset, kind, cps) {
    const b = await loadBoard(), f = frameOf(b, ref), {layer} = assetOf(b, f, asset);
    if (layer.kind !== 'bubble' || !['handwrite', 'off'].includes(kind)) fail('animate <frame> <chat box> <handwrite|off> [letters per second]');
    await save(b, setAnim(b.edits, f.id, layer.key, kind === 'off' ? null : {type: 'handwrite', cps: cps == null ? undefined : num(cps, 'letters per second')}), `${layer.key} in ${where(b, f)}: ${kind === 'off' ? 'no animation' : 'written by hand'}`);
  },

  async tail(ref, asset, state) {
    const b = await loadBoard(), f = frameOf(b, ref), {layer} = assetOf(b, f, asset);
    if (layer.kind !== 'bubble' || !['on', 'off'].includes(state)) fail('tail <frame> <chat box> on|off');
    await save(b, setBubble(b.edits, f.id, layer.key, {tail: state === 'on' ? null : false}), `The tail of ${layer.key} in ${where(b, f)} is ${state}`);
  },

  async words(ref, asset, state) {
    const b = await loadBoard(), f = frameOf(b, ref), {layer} = assetOf(b, f, asset);
    if (layer.kind !== 'bubble' || !['show', 'hide'].includes(state)) fail('words <frame> <chat box> show|hide');
    await save(b, setBubble(b.edits, f.id, layer.key, {words: state === 'show'}), `The words of ${layer.key} in ${where(b, f)}: ${state === 'show' ? 'shown' : 'hidden'}`);
  },

  async tails(state) {
    const b = await loadBoard();
    if (!['on', 'off'].includes(state)) fail('tails on|off');
    const count = b.frames.reduce((n, f) => n + layersOf(f, b.edits.frames[f.id]).filter(l => l.kind === 'bubble' && l.tip).length, 0);
    await save(b, setTails(b.edits, b.frames, state === 'on'), `${count} chat boxes ${state === 'on' ? 'have their tails again' : 'without their tails'}`);
  },

  async highlight(ref, x, y, w, h) {
    const b = await loadBoard(), f = frameOf(b, ref), box = {x: num(x, 'x'), y: num(y, 'y'), w: num(w, 'w'), h: num(h, 'h')};
    const key = freeKey(b, f, 'highlight'), html = `<div class="iq2-mark" data-sb-root="${key}" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;z-index:${zOf(b, f)};opacity:1;transform:none"></div>`;
    await save(b, insertHtml(b, f, key, 'Highlight', html, box), `A highlight (${key}) in ${where(b, f)} at ${box.x},${box.y} ${box.w}×${box.h}`);
  },

  async 'add-html'(ref, name, file, x, y, w, h) {
    const b = await loadBoard(), f = frameOf(b, ref), box = {x: num(x, 'x'), y: num(y, 'y'), w: num(w, 'w'), h: num(h, 'h')};
    let inner;
    try { inner = await fs.readFile(file, 'utf8'); } catch { fail(`Could not read ${file}`); }
    const key = freeKey(b, f, name), html = `<div data-sb-root="${key}" style="position:absolute;left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;z-index:${zOf(b, f)}">${inner.trim()}</div>`;
    await save(b, insertHtml(b, f, key, name, html, box), `${name} (${key}) added to ${where(b, f)}`);
  },

  async bubbles(width) {
    const b = await loadBoard(), w = num(width, 'width');
    if (b.id === TRASH) fail('Not in the Trash.');
    const count = b.frames.reduce((n, f) => n + layersOf(f, b.edits.frames[f.id]).filter(l => l.kind === 'bubble').length, 0);
    await save(b, sizeBubbles(b.edits, b.frames, w, {lock: !!flags.lock}), `${count} chat boxes are ${w} wide${flags.lock ? ', their width locked' : ', not locked'}`);
  },

  async 'put-back'(ref, asset) {
    const b = await loadBoard(), f = frameOf(b, ref), {key} = assetOf(b, f, asset);
    await save(b, resetAsset(b.edits, f.id, key), `${key} in ${where(b, f)} is as captured again`);
  },

  async hide(ref, asset) {
    const b = await loadBoard(), f = frameOf(b, ref), {layer} = assetOf(b, f, asset);
    const brought = b.edits.frames[f.id]?.inserts?.some(l => l.key === layer.key);
    await save(b, brought ? removeInsert(b.edits, f.id, layer.key) : hideLayer(b.edits, f.id, layer.key), `Took ${layer.key} out of ${where(b, f)}`);
  },

  async reset(ref) {
    const b = await loadBoard(), f = frameOf(b, ref);
    await save(b, resetFrame(b.edits, f.id), `${where(b, f)} is as captured again (its note stays)`);
  },

  async duplicate(ref) {
    const b = await loadBoard(), f = frameOf(b, ref), made = addCopy(b.edits, {from: f.id, after: f.id, inherit: f.id});
    await save(b, made.edits, `Duplicated ${where(b, f)} as ${made.id}`);
  },

  async blank(ref) {
    const b = await loadBoard(), f = b.frames.find(g => g.id === ref) ?? (/[:#]\d+$/.test(ref ?? '') ? frameOf(b, ref) : null);
    if (f) { const made = addBlank(b.edits, f.id); await save(b, made.edits, `A blank frame (${made.id}) after ${where(b, f)}`); return; }
    const line = lineOf(b, ref), list = b.frames.filter(g => g.chapter === line.id);
    const made = list.length ? addBlank(b.edits, list.at(-1).id) : addBlankIn(b.edits, line.id);
    await save(b, made.edits, `A blank frame (${made.id}) at the end of ${line.title}`);
  },

  async delete(...refs) {
    const b = await loadBoard();
    if (b.id === TRASH) fail('Frames are deleted from the Trash on the page (Delete): they are gone for good.');
    const frames = [...new Set(refs.map(ref => frameOf(b, ref)))];
    if (!frames.length) fail('Which frames?');
    await trashFrames(b, frames, null, `${frames.map(f => where(b, f)).join(', ')} moved to the Trash`);
  },

  async drop(...refs) {
    const b = await loadBoard();
    if (b.id === TRASH) fail('Not in the Trash.');
    const frames = [...new Set(refs.map(ref => frameOf(b, ref)))];
    if (!frames.length) fail('Which frames?');
    await save(b, frames.reduce((e, f) => deleteFrame(e, f.id), b.edits), `${frames.map(f => where(b, f)).join(', ')} taken off the board (not in the Trash)`);
  },

  async 'to-line'(ref, line, n) {
    const b = await loadBoard(), f = frameOf(b, ref), to = lineOf(b, line), cells = cellsOf(b.edits, b.frames);
    if (cells.hidden.has(f.id)) fail(`${where(b, f)} is a slide of a video, not on the board: show its line as slides first (line-view <line> slides), or move the video by its first slide.`);
    const shown = b.frames.filter(g => !cells.hidden.has(g.id)), count = shown.filter(g => g.chapter === to.id && g.id !== f.id).length; // (a video is on the board by its first slide and takes the others with it)
    const index = n == null ? count : Math.max(0, Math.min(count, num(n, 'n') - 1));
    await save(b, moveFrame(b.edits, shown, f.id, to.id, index, followersOf(cells)), `${where(b, f)} is now ${to.title}:${index + 1}`);
  },

  async 'line-add'(...words) {
    const b = await loadBoard(), after = flags.after ? lineOf(b, flags.after).id : b.lines.at(-1)?.id ?? null;
    const made = addLine(b.edits, {after: flags.first ? null : after, title: words.join(' ') || 'New line'});
    const ids = linesOf(b.video.chapters, made.edits).map(l => l.id), edits = flags.first ? moveLine(made.edits, ids, made.id, 0) : made.edits;
    await save(b, edits, `Added the line ${made.id} (${words.join(' ') || 'New line'})${flags.first ? ' at the top' : ''}`);
  },

  async 'line-rename'(line, ...words) {
    const b = await loadBoard(), l = lineOf(b, line);
    if (!words.length) fail('Rename it to what?');
    await save(b, renameLine(b.edits, l.id, words.join(' ')), `Renamed ${l.title} -> ${words.join(' ')}`);
  },

  async 'line-duplicate'(line) {
    const b = await loadBoard(), l = lineOf(b, line), made = duplicateLine(b.edits, l, b.frames.filter(f => f.chapter === l.id));
    await save(b, made.edits, `Duplicated ${l.title} as ${made.id} (${made.ids.length} frames)`);
  },

  async 'line-view'(line, view) {
    const b = await loadBoard(), l = lineOf(b, line);
    if (!b.edits.lines?.added?.[l.id]?.videos?.length) fail(`${l.title} is not a line of videos.`);
    if (view !== 'videos' && view !== 'slides') fail('Show it as videos or as slides?');
    await save(b, setLineView(b.edits, l.id, view, view === 'slides' ? slidesOrder(b.edits, l.id, b.frames) : null), `${l.title} is shown as ${view}`);
  },

  async runs() {
    const b = await loadBoard(), shelf = shelvedRuns(b.edits.lines?.added, b.id);
    for (const r of VIDEO_RUNS[b.id] ?? []) console.log(`${r.id.padEnd(14)} ${r.title.padEnd(46)} ${r.lines.join(', ')}${shelf.get(r.id) ? `   [in the line ${shelf.get(r.id).line}, place ${shelf.get(r.id).index + 1}]` : ''}`);
  },

  async 'line-shelf'(line, ...names) {
    const b = await loadBoard(), l = lineOf(b, line), runs = VIDEO_RUNS[b.id] ?? [];
    if (!b.edits.lines?.added?.[l.id]) fail(`${l.title} is a captured line: put the videos in a line you added (line-add).`);
    if (!names.length) fail('Which videos? (their ids or the start of their titles, or none: see runs)');
    if (names.length === 1 && names[0] === 'none') { await save(b, setLineShelf(b.edits, l.id, []), `${l.title} holds no videos any more: each video is at the right of its own last line`); return; }
    const picked = names.map(n => { const r = runs.find(x => x.id === n) ?? runs.find(x => x.title.toLowerCase().startsWith(n.toLowerCase())); if (!r) fail(`No video "${n}" on this board (runs lists them).`); return r; });
    await save(b, setLineShelf(b.edits, l.id, picked.map(r => r.id)), `${l.title} holds the videos: ${picked.map(r => r.title).join(' | ')}`);
  },

  async 'line-delete'(line) {
    const b = await loadBoard(), l = lineOf(b, line);
    if (b.id === TRASH) fail('Lines are deleted from the Trash on the page.');
    const frames = b.frames.filter(f => f.chapter === l.id);
    await trashFrames(b, frames, e => hideLine(e, l.id), `Deleted the line ${l.title}${frames.length ? ` (its ${frames.length} frames are in the Trash)` : ''}`);
  },

  async export(file) {
    const boards = {};
    for (const id of BOARDS) boards[id] = (await store.read(id)).edits;
    const at = new Date().toISOString(), out = path.resolve(file ?? path.join(ROOT, 'content', 'storyboard', 'exports', `storyboard-${at.slice(0, 16).replace(/[:T]/g, '-')}.json`));
    await fs.mkdir(path.dirname(out), {recursive: true});
    await fs.writeFile(out, `${JSON.stringify(makeExport(boards, at), null, 2)}\n`);
    console.log(`Exported to ${path.relative(process.cwd(), out)}`);
  },

  async import(file) {
    if (!file) fail('Import which file?');
    let data;
    try { data = JSON.parse(await fs.readFile(file, 'utf8')); } catch { fail(`Could not read ${file}`); }
    const boards = readExport(data, BOARDS);
    if (!boards.length) fail(`${file} is not a storyboard export.`);
    for (const [id, edits] of boards) { const done = await store.write(id, edits, {reason: 'import'}); console.log(`Imported ${id} (revision ${done.rev}; what was there is in its backups)`); }
  },

  async backups() {
    const list = await store.backups(videoId);
    if (!list.length) { console.log('No backups yet.'); return; }
    for (const x of list) console.log(`${pad(x.name, 52)} ${x.reason}`);
  },

  async backup() { console.log(`Backed up: ${await store.backup(videoId, 'manual')}`); },

  async restore(name) {
    if (!name) fail('Restore which backup? (see the backups command)');
    const edits = normalizeEdits(await store.readBackup(videoId, name).catch(() => fail(`No backup "${name}"`)));
    const done = await store.write(videoId, edits, {reason: 'restore'});
    console.log(`${videoId} is back as ${name} has it (revision ${done.rev}; what was there is in its backups)`);
  },
};

const run = commands[command];
if (!run) fail(`No command "${command}". node scripts/storyboard.mjs help`);
await run(...args);
