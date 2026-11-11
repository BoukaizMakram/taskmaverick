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
  moveLayers, moveLine, setAnim, setBackground, setLineShelf, setLineView, setMove, setName, setNote, setScale, setSize, setStyle, setText, setTip, setVideoMove, styleValue,
} from '../lib/storyboardEdits.mjs';
import {cellsOf, followersOf, slidesOrder} from '../lib/storyboardCells.mjs';
import {DETAIL_VARIANTS, allRunsOf, shelvedRuns} from '../lib/storyboardVideos.mjs';
import {SECTION_BOARDS, sectionOfBoard} from '../lib/sections/index.mjs';
import {partsOf, stitchedBoards} from '../lib/storyboardAllVideos.mjs';
import {storyboardStore} from '../lib/storyboardStore.mjs';
import {TRASH, addToTrash, trashEntry, trashVideo} from '../lib/storyboardTrash.mjs';
import {copyFrames} from '../lib/storyboardClipboard.mjs';
import {splitKey} from '../lib/storyboardLinks.mjs';
import {PAINT_PRESETS, normalizePaint} from '../lib/storyboardPaint.mjs';
import {elementAt, findRoot, parseHtml, textOf, textsOf, wrapperScale} from '../lib/storyboardHtml.mjs';
import {CAPS, DASHES, LINE_CAPS, LINE_JOINS, frameFromStage} from '../lib/storyboardPaths.mjs';
import {ANIMATED, BLEND_MODES, EFFECTS, EFFECT_TYPES, FX_PROP, LABELS, LAYER_KINDS, addEffect, addKeyAt, addVideoLayer, isAnimated, isAnimatedProp, keyTimes, layersOf as videoLayersOf, propsInKey, removeEffect, removeKeyAt, removeVideoLayer, setAnimated, setLayerAt, setSpan, stackVideoLayer, updateVideoLayer} from '../lib/storyboardLayers.mjs';
import {addVideoComment, commentNumber, commentsOf as videoCommentsOf, removeVideoComment, updateVideoComment} from '../lib/storyboardComments.mjs';
import {LOOKS, ORIGINAL, activeVariation, addVariation, removeVariation, renameVariation, setActiveVariation, variationsOf} from '../lib/storyboardVariations.mjs';
import {cutLayoutOf, cutOf} from '../lib/remotion/cuts.mjs';
import {cutWordsOf, setCutText} from '../lib/remotion/cutWords.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS = [{id: 'improved-quality-v2', name: 'Improved Quality'}, {id: 'increased-efficiency-v2', name: 'Increased Efficiency'}, ...SECTION_BOARDS, {id: 'all-storyboards', name: 'All storyboards'}]; // (All storyboards: the cuts scene by scene, scripts/capture-cuts.mjs)
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
  text <frame> <key> <words>     retype a text, in that frame alone (nothing is linked; --only
                                 is no longer needed). \\n starts a new line in a bubble
  move <frame> <asset> <dx> <dy> move by stage px (the frame is 1600 x 900); --to: put its top
                                 left corner at <x> <y>
  vmove <frame|line> <asset> <dx> <dy>  its place in the VIDEO on that slide (or on every slide of a line, in one save), stage px over where the video lays
                                 it out, as a drag in the video editor; the slide on the board is not touched; 0 0 takes it off
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
  section-lines                  a section's board: its five lines of videos (Videos, Videos in detail and its three variants), at the top, each holding its videos (run again to repair)
  line-shelf <line> <video>... | none   the videos of the board (their ids or the start of their titles, in the order they stand in) put together in this line, side by side,
                                 instead of each at the right of its own last line; none puts them back (the videos of the board: runs)
  runs                           the videos of the board: id, title, its lines, the line that holds it
  all-videos                     the board "All videos" (/storyboard?video=all-videos): for each finished board, whether its stitched video is Final or In progress, and the
                                 videos of its line "Videos" it plays one after the other (a board is Final when its id is in FINAL_BOARDS, lib/storyboardAllVideos.mjs)

Layers of a video (the video editor's shapes, texts and pictures, with keyframes: lib/storyboardLayers.mjs). <video> is a video's id or
title (runs), or a video of a line of videos by its name. Values: x y w h (the 1600 x 900 picture, top left), rotation (deg), opacity (0-1),
from to (seconds on screen), fill (a color, a ready paint or a gradient as JSON), stroke strokeWidth radius, text font size weight color
align, src (a picture: /storyboard/uploads/...), name, hidden locked (true/false). An open page shows each change within seconds.
  vlayers [video]                the videos that have layers, or one video's layers: id, kind, name, time, place, keyframes
  vlayer-add <video> <rect|ellipse|text|image|path> [k=v ...]   a new layer (on top); prints its id. A path: points="100,100;400,100;400,300" (on the picture; a curved
                                 point: x,y,inX,inY,outX,outY) endCap=arrow|triangle|circle|square|diamond|bar|none startCap= stroke=#7b3cf0 strokeWidth=4 dash=solid|dashed|dotted
                                 closed=true fill=#hex trimEnd=0..1 (animated: vlayer-key <video> <id> <s> trimEnd=1: the line drawn in, After Effects' Trim Paths)
  vlayer-set <video> <id> k=v ... [--at <s>]   change a layer; with --at, an animated value gets a keyframe at that second
  vlayer-key <video> <id> <s> [k=v ...]   a keyframe at <s> seconds (the values given are animated from then on; none: all the animated ones)
  vlayer-unkey <video> <id> <s> [prop]   take a keyframe off (or only that property's)
  vlayer-still <video> <id> <prop> [--at <s>]   stop animating a property (it keeps its value at --at, else at its first keyframe)
  vlayer-order <video> <id> front|back|forward|backward   the stacking
  vlayer-rm <video> <id>         delete a layer
  vlayer-fx <video> <id> <blur|shadow|glow|brightness|contrast|saturation|hue|grayscale|sepia|invert> [number=v ... color=#hex]   an effect on a layer (its numbers can have keyframes: vlayer-key ... fx:<effect id>:<number>=v)
  vlayer-fx-rm <video> <id> <effect id>   take an effect off (vlayers shows the ids)
  vlayer-span <video> <element name> <from s|-> <to s|->   trim an element of the slides: not seen before / after (clear: seen the whole time again)

Comments on a video (the video editor's pins, the user, 2026-10-29: a point on the picture at a second, with words; lib/storyboardComments.mjs; never in the video itself). They are read and
answered here: an open page shows each change within seconds. <board> is a board's id (--video <board> gives it too); <video> is as for the layers; <n|id> is a comment's number (what its pin
says) or its id. The picture is 1600 x 900: x y are px from its top left, <second> is the second of the video it is at. A board with variations: each has its own comments, and these commands read
and change the ones of the variation that plays (variation-use); vcomments lists another variation's under "<video> [v2]".
  vcomments [<video>] [--video <board>]   every comment of every video (of one board with --video or with the board first; of one video with <video>): board, video, number, id, second, x y,
                                 [done], the words (a JSON string)
  vcomment-add <board> <video> <second> <x> <y> "<words>"   a comment there; prints its number and id
  vcomment-set <board> <video> <n|id> [text="<words>"] [done=true|false] [at=<s>] [x=<px>] [y=<px>]   change one (the words, whether it is done, its second, its point)
  vcomment-rm <board> <video> <n|id>   delete a comment

Variations of a board's videos (the user, 2026-11-03: another way to play the same video, picked in the All videos page's inspector: Comments | Variations; lib/storyboardVariations.mjs).
Variation 1 (v1) is the video as it is made; the one picked plays everywhere (the board, All videos, the video editor, an export). Looks: ${Object.keys(LOOKS).join(', ')}.
  variations                     the board's variations, the one that plays marked *
  variation-add <look> ["<name>"] [--id v5]  a new variation with that look, played from now on; prints its id (--id: the one it should have, if free)
  variation-use <id>             play that one (v1: the video as it is made)
  variation-name <id> "<name>"    rename one
  variation-rm <id>              delete one (Variation 1 plays if it was the one)

The words of a board's Remotion cut (Increased Efficiency's Variation 4; lib/remotion/cutWords.mjs; on the All videos page a double-click on them retypes them; the MP4 render reads the same).
  cut-texts                      every text of the cut: title, each sentence and the label over it (<id>:kicker); * = retyped, with what the narration says; the cut's length
  cut-text <key> "<words>"        retype one (" / " between lines); "" puts the narration's words back

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
// ---- A video's layers: which video, which layer, the values typed ----
function videoTitleOf(b, ref) {
  if (!ref) fail('Which video? Its id or title (runs), or a video of a line of videos by its name.');
  const runs = allRunsOf(b.id), cells = Object.values(b.edits.lines?.added ?? {}).flatMap(l => l.videos ?? []).map(v => v.name).filter(Boolean);
  const titles = [...new Set([...runs.map(x => x.title), ...cells, ...Object.keys(b.edits.layers ?? {})])];
  const byId = runs.find(x => x.id === ref);
  if (byId) return byId.title;
  const exact = titles.find(t => t === ref) ?? titles.find(t => norm(t) === norm(ref));
  if (exact) return exact;
  const some = titles.filter(t => norm(t).startsWith(norm(ref)));
  if (some.length === 1) return some[0];
  fail(`${some.length ? 'More than one' : 'No'} video matches "${ref}": ${(some.length ? some : titles).join(' | ')}`);
}
function layerOfVideo(b, title, id) {
  const items = videoLayersOf(b.edits, title), l = items.find(x => x.id === id) ?? items.find(x => norm(x.name) === norm(id));
  if (!l) fail(`${title} has no layer "${id}": ${items.map(x => `${x.id} (${x.name})`).join(', ') || 'none yet'}`);
  return l;
}
// ---- Comments on a video: which board, which video, which comment ----
// The board of a comment command: given first (`vcomment-add improved-quality-v2 <video> …`) or by --video. The ones that write need one of the two (no guessing which board to write to).
function commentBoard(rest, needed) {
  if (rest[0] && BOARDS.includes(rest[0])) return {board: rest[0], rest: rest.slice(1)};
  if (flags.video != null) return {board: flags.video, rest};
  if (needed) fail(`Which board? Give it first (vcomment-… <board> <video> …) or with --video: ${VIDEOS.map(v => v.id).join(', ')}`);
  return {board: null, rest};
}
function commentOfVideo(b, title, ref) {
  const items = videoCommentsOf(b.edits, title), n = /^\d+$/.test(String(ref ?? '')) ? Number(ref) : 0;
  const c = items.find(x => x.id === ref) ?? (n ? items[n - 1] : null);
  if (!c) fail(`${title} has no comment "${ref ?? ''}": ${items.map((x, i) => `${i + 1} (${x.id})`).join(', ') || 'none yet'}`);
  return c;
}
const flag01 = (v, name) => { const s = String(v).toLowerCase(); if (['true', 'yes', '1', 'on'].includes(s)) return true; if (['false', 'no', '0', 'off'].includes(s)) return false; return fail(`${name} must be true or false`); };
const pointIn = (x, y) => { if (x < 0 || x > 1600 || y < 0 || y > 900) fail('x y are px on the 1600 x 900 picture, from its top left'); };
const LAYER_NUMBERS = new Set(['x', 'y', 'w', 'h', 'rotation', 'opacity', 'from', 'to', 'strokeWidth', 'radius', 'size', 'weight', 'capScale', 'trimStart', 'trimEnd']);
// A path's points: "x,y;x,y;..." on the picture (1600 x 900); a curved point is "x,y,inX,inY,outX,outY" (the handles as offsets from the point)
function pathPoints(v) {
  const points = v.split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const n = s.split(',').map(Number);
    if (![2, 6].includes(n.length) || n.some(x => !Number.isFinite(x))) fail(`"${s}" is not a point: x,y or x,y,inX,inY,outX,outY`);
    return n.length === 2 ? {x: n[0], y: n[1]} : {x: n[0], y: n[1], ix: n[2], iy: n[3], ox: n[4], oy: n[5], smooth: true};
  });
  if (points.length < 2) fail('A path needs two points at least: points="100,100;400,100"');
  return points;
}
function layerValues(pairs) {
  const out = {};
  for (const p of pairs) {
    const at = p.indexOf('=');
    if (at < 1) fail(`"${p}": values are key=value`);
    const k = p.slice(0, at), v = p.slice(at + 1);
    if (LAYER_NUMBERS.has(k) || FX_PROP.test(k)) out[k] = num(v, k); // (fx:<effect id>:<number>: an effect's number)
    else if (k === 'blend') { if (!BLEND_MODES.some(([id]) => id === v)) fail(`"${v}" is not a blend mode: ${BLEND_MODES.map(([id]) => id).join(' ')}`); out.blend = v === 'normal' ? null : v; }
    else if (k === 'label') { const n = /^\d+$/.test(v) ? Number(v) : LABELS.findIndex(x => x.name.toLowerCase() === v.toLowerCase()) + 1; if (!(n >= 1 && n <= LABELS.length)) fail(`"${v}" is not a label: 1-${LABELS.length}, or ${LABELS.map(x => x.name).join(', ')}`); out.label = n; }
    else if (k === 'hidden' || k === 'locked' || k === 'closed') out[k] = v !== 'false';
    else if (k === 'points') out.points = pathPoints(v);
    else if (k === 'startCap' || k === 'endCap') { if (!CAPS.includes(v)) fail(`"${v}" is not an end: ${CAPS.join(' ')}`); out[k] = v; }
    else if (k === 'dash') { if (!DASHES.includes(v)) fail(`"${v}" is not a dash: ${DASHES.join(' ')}`); out.dash = v; }
    else if (k === 'lineCap') { if (!LINE_CAPS.includes(v)) fail(`"${v}" is not a line cap: ${LINE_CAPS.join(' ')}`); out.lineCap = v; }
    else if (k === 'lineJoin') { if (!LINE_JOINS.includes(v)) fail(`"${v}" is not a line join: ${LINE_JOINS.join(' ')}`); out.lineJoin = v; }
    else if (k === 'fill' && ['none', 'off', ''].includes(v)) out.fill = null;
    else if (k === 'fill') {
      const preset = PAINT_PRESETS.find(x => x.id === v);
      let paint = ['none', 'off', ''].includes(v) ? null : preset ? preset.paint : v;
      if (typeof paint === 'string' && paint.trim().startsWith('{')) { try { paint = JSON.parse(paint); } catch { fail('That JSON is not valid.'); } }
      if (paint !== null && normalizePaint(paint) == null) fail(`"${v}" is not a color, a ready paint (${PAINT_PRESETS.map(x => x.id).join(', ')}) or a gradient as JSON`);
      out.fill = paint;
    } else if (k === 'stroke') out.stroke = ['none', 'off', ''].includes(v) ? null : v;
    else if (k === 'text') out.text = v.replace(/\\n/g, '\n');
    else if (['name', 'font', 'color', 'align', 'src'].includes(k)) out[k] = v;
    else fail(`No value "${k}" for a layer: x y w h rotation opacity from to fill stroke strokeWidth radius text font size weight color align src name hidden locked blend label (a path: points closed startCap endCap capScale dash lineCap lineJoin trimStart trimEnd) (fx:<effect id>:<number> for an effect's number)`);
  }
  return out;
}

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
    await save(b, setText(b.edits, f.id, full, now), `Retyped ${full} in ${where(b, f)} (that frame alone: nothing is linked): ${JSON.stringify(was)} -> ${JSON.stringify(now)}`);
  },

  async move(ref, asset, a, c) {
    const b = await loadBoard(), f = frameOf(b, ref), {layer, key} = assetOf(b, f, asset);
    const k = key.includes('/') ? 1 : wrapperScale(b.htmlOf(layer.asset), layer.key), cur = b.edits.frames[f.id]?.moves?.[key] ?? [0, 0];
    let to;
    if (flags.to) { if (key.includes('/') || !layer.box) fail('--to works on a whole asset.'); to = [cur[0] + (num(a, 'x') - (layer.box.x + cur[0] * k)) / k, cur[1] + (num(c, 'y') - (layer.box.y + cur[1] * k)) / k]; }
    else to = [cur[0] + num(a, 'dx') / k, cur[1] + num(c, 'dy') / k];
    await save(b, setMove(b.edits, f.id, key, to), `Moved ${key} in ${where(b, f)} (now ${r(to[0] * k)}, ${r(to[1] * k)} stage px from where it was captured)`);
  },

  async vmove(ref, asset, dx, dy) {
    const b = await loadBoard(), d = [num(dx, 'dx'), num(dy, 'dy')];
    const frames = ref == null || /[:#/]/.test(ref) ? [frameOf(b, ref)] : b.frames.filter(f => f.chapter === lineOf(b, ref).id);
    await save(b, frames.reduce((e, f) => setVideoMove(e, f.id, assetOf(b, f, asset).key, d), b.edits), `${asset} in the video, ${d[0]}, ${d[1]} stage px from where it lays it out: ${frames.map(f => where(b, f)).join(', ')}`);
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
    for (const r of allRunsOf(b.id)) console.log(`${r.id.padEnd(14)} ${r.title.padEnd(46)} ${r.lines.join(', ')}${shelf.get(r.id) ? `   [in the line ${shelf.get(r.id).line}, place ${shelf.get(r.id).index + 1}]` : ''}`);
  },

  // The board "All videos" (the user, 2026-10-29): each finished board's line "Videos" stitched into one video, with the status on top of it. Read only (the status is FINAL_BOARDS in lib/storyboardAllVideos.mjs).
  async 'all-videos'() {
    for (const e of stitchedBoards()) {
      const b = await loadBoard(e.board), parts = partsOf(e.board, b.video, b.edits);
      console.log(`${e.status.label.padEnd(12)} ${e.group.padEnd(10)} ${e.board.padEnd(28)} ${e.title}\n${parts.map((p, i) => `    ${i + 1}. ${p.id.padEnd(14)} ${p.title}  (${p.frames.length} slides)`).join('\n') || '    (no videos in its line "Videos")'}`);
    }
  },

  async 'line-shelf'(line, ...names) {
    const b = await loadBoard(), l = lineOf(b, line), runs = allRunsOf(b.id);
    if (!b.edits.lines?.added?.[l.id]) fail(`${l.title} is a captured line: put the videos in a line you added (line-add).`);
    if (!names.length) fail('Which videos? (their ids or the start of their titles, or none: see runs)');
    if (names.length === 1 && names[0] === 'none') { await save(b, setLineShelf(b.edits, l.id, []), `${l.title} holds no videos any more: each video is at the right of its own last line`); return; }
    const picked = names.map(n => { const r = runs.find(x => x.id === n) ?? runs.find(x => x.title.toLowerCase().startsWith(n.toLowerCase())); if (!r) fail(`No video "${n}" on this board (runs lists them).`); return r; });
    await save(b, setLineShelf(b.edits, l.id, picked.map(r => r.id)), `${l.title} holds the videos: ${picked.map(r => r.title).join(' | ')}`);
  },

  // A section's board gets its five lines of videos (docs/storyboard.md, "The other sections"): Videos, then Videos in detail and its three variants (DETAIL_VARIANTS), each at the top in that
  // order and holding its videos side by side. Made once after the first capture; run again, it finds the lines by their titles and puts each one's videos back.
  async 'section-lines'() {
    const b = await loadBoard(), section = sectionOfBoard(b.id);
    if (!section) fail(`${b.id} is not a section's board (lib/sections/index.mjs).`);
    const runs = new Set(allRunsOf(b.id).map(r => r.id));
    const wanted = [['Videos', null], ...DETAIL_VARIANTS.map(v => [`Videos in detail${v.title ? ` · ${v.title.replace(/^,\s*/, '')}` : ''}`, `-detail${v.suffix}`])];
    let edits = b.edits, prev = null;
    for (const [k, [title, suffix]] of wanted.entries()) {
      let id = Object.entries(edits.lines?.added ?? {}).find(([x, l]) => l.title === title && !edits.lines?.deleted?.includes(x))?.[0];
      if (!id) ({id, edits} = addLine(edits, {after: prev, title}));
      edits = moveLine(edits, linesOf(b.video.chapters, edits).map(l => l.id), id, k);
      const ids = suffix ? section.chunks.filter(c => !c.noTwin).map(c => c.id + suffix) : section.chunks.map(c => c.id);
      for (const r of ids) if (!runs.has(r)) fail(`No video "${r}" on ${b.id} (runs lists them).`);
      edits = setLineShelf(edits, id, ids);
      prev = id;
    }
    await save(b, edits, `${section.name}: the lines ${wanted.map(w => w[0]).join(' | ')}, with their videos`);
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

  // ---- Layers of a video (lib/storyboardLayers.mjs; the video editor makes them too) ----
  async vlayers(ref) {
    const b = await loadBoard(), all = b.edits.layers ?? {};
    if (!ref) {
      const titles = Object.keys(all).filter(t => all[t].items.length);
      if (!titles.length) { console.log('No video of this board has layers yet.'); return; }
      for (const t of titles) console.log(`${pad(all[t].items.length, 3)} layer${all[t].items.length === 1 ? ' ' : 's'}  ${t}`);
      return;
    }
    const title = videoTitleOf(b, ref), items = videoLayersOf(b.edits, title);
    console.log(`${title}: ${items.length} layer${items.length === 1 ? '' : 's'} (back first)`);
    for (const l of items) {
      const look = l.kind === 'path' ? `${l.points.length} points${l.closed ? ' closed' : ''} ${l.stroke} ${l.strokeWidth}px${l.startCap !== 'none' ? ` start ${l.startCap}` : ''}${l.endCap !== 'none' ? ` end ${l.endCap}` : ''}${l.replaces?.length ? ` (stands for ${l.replaces.join(', ')})` : ''}` : l.kind === 'text' ? JSON.stringify(l.text) : l.kind === 'image' ? l.src : typeof l.fill === 'string' ? l.fill : l.fill ? `${l.fill.kind} gradient` : 'no fill';
      console.log(`  ${pad(l.id, 12)} ${pad(l.kind, 8)} ${pad(JSON.stringify(l.name), 22)} ${r(l.from)}-${r(l.to)} s  x ${r(l.x)} y ${r(l.y)} w ${r(l.w)} h ${r(l.h)}${l.rotation ? ` rot ${r(l.rotation)}` : ''}${l.opacity !== 1 ? ` opacity ${r(l.opacity)}` : ''}  ${look}${l.hidden ? '  [hidden]' : ''}${l.locked ? '  [locked]' : ''}`);
      if (l.blend || l.label) console.log(`      ${l.blend ? `blend ${l.blend}  ` : ''}${l.label ? `label ${l.label} (${LABELS[l.label - 1].name})` : ''}`);
      for (const e of l.fx ?? []) console.log(`      fx ${pad(e.id, 14)} ${EFFECTS[e.type].name}${e.on === false ? ' [off]' : ''}  ${Object.entries(e.params).map(([k, v]) => `${k} ${r(v)}`).join('  ')}${e.color ? `  ${e.color}` : ''}`);
      for (const k of l.keys ?? []) console.log(`      ◆ ${r(k.t)} s  ${propsInKey(k).map(p => `${p} ${r(k[p])}`).join('  ')}${k.ease ? `  (${k.ease})` : ''}`);
    }
  },
  async 'vlayer-add'(ref, kind, ...pairs) {
    if (!LAYER_KINDS.includes(kind)) fail(`vlayer-add <video> <${LAYER_KINDS.join('|')}> [k=v ...]`);
    const b = await loadBoard(), title = videoTitleOf(b, ref), {edits, id} = addVideoLayer(b.edits, title, {kind, ...layerValues(pairs)});
    if (!id) fail('That layer is not valid.');
    await save(b, edits, `${title}: the ${kind} layer ${id} added`);
  },
  async 'vlayer-set'(ref, id, ...pairs) {
    const b = await loadBoard(), title = videoTitleOf(b, ref), l = layerOfVideo(b, title, id), values = layerValues(pairs), at = flags.at != null ? num(flags.at, '--at') : null;
    if (!Object.keys(values).length) fail('Which values? k=v');
    if (values.points) { // (a path's points are on the picture here: its frame is made to fit them)
      if (l.kind !== 'path') fail(`${l.id} is not a path`);
      Object.assign(values, frameFromStage(values.points, values.closed ?? !!l.closed) ?? {});
    }
    const next = updateVideoLayer(b.edits, title, l.id, x => (at != null ? setLayerAt(x, at, values) : {...x, ...values}));
    await save(b, next, `${title}: ${l.id} ${pairs.join(' ')}${at != null ? ` (at ${at} s)` : ''}`);
  },
  async 'vlayer-key'(ref, id, t, ...pairs) {
    const b = await loadBoard(), title = videoTitleOf(b, ref), l = layerOfVideo(b, title, id), at = num(t, 'the second'), values = layerValues(pairs);
    const bad = Object.keys(values).filter(k => !isAnimatedProp(k));
    if (bad.length) fail(`Only ${ANIMATED.join(', ')} and an effect's numbers (fx:<effect id>:<number>) have keyframes (not ${bad.join(', ')}): vlayer-set changes the rest`);
    const next = updateVideoLayer(b.edits, title, l.id, x => (Object.keys(values).length ? setLayerAt(Object.keys(values).reduce((c, p) => (isAnimated(c, p) ? c : setAnimated(c, p, at, true)), x), at, values) : addKeyAt(x, at)));
    await save(b, next, `${title}: a keyframe of ${l.id} at ${at} s ${pairs.join(' ')}`);
  },
  async 'vlayer-unkey'(ref, id, t, prop) {
    const b = await loadBoard(), title = videoTitleOf(b, ref), l = layerOfVideo(b, title, id), at = num(t, 'the second');
    if (!keyTimes(l).some(k => Math.abs(k - at) < 1 / 60)) fail(`${l.id} has no keyframe at ${at} s: ${keyTimes(l).map(r).join(', ') || 'none'}`);
    await save(b, updateVideoLayer(b.edits, title, l.id, x => removeKeyAt(x, at, prop ?? null)), `${title}: the keyframe of ${l.id} at ${at} s taken off${prop ? ` (${prop})` : ''}`);
  },
  async 'vlayer-still'(ref, id, prop) {
    if (!isAnimatedProp(prop ?? '')) fail(`vlayer-still <video> <id> <${ANIMATED.join('|')}|fx:<effect id>:<number>> [--at <s>]`);
    const b = await loadBoard(), title = videoTitleOf(b, ref), l = layerOfVideo(b, title, id), at = flags.at != null ? num(flags.at, '--at') : keyTimes(l, prop)[0] ?? 0;
    await save(b, updateVideoLayer(b.edits, title, l.id, x => setAnimated(x, prop, at, false)), `${title}: the ${prop} of ${l.id} is not animated any more`);
  },
  async 'vlayer-fx'(ref, id, type, ...pairs) {
    if (!EFFECT_TYPES.includes(type)) fail(`vlayer-fx <video> <id> <${EFFECT_TYPES.join('|')}> [number=value ... color=#hex]`);
    const b = await loadBoard(), title = videoTitleOf(b, ref), l = layerOfVideo(b, title, id), spec = EFFECTS[type], params = {}, extra = {};
    for (const p of pairs) {
      const at = p.indexOf('=');
      if (at < 1) fail(`"${p}": values are key=value`);
      const k = p.slice(0, at), v = p.slice(at + 1);
      if (k === 'color' && spec.color) extra.color = v;
      else if (spec.params.some(x => x.id === k)) params[k] = num(v, k);
      else fail(`${spec.name} has: ${spec.params.map(x => x.id).join(' ')}${spec.color ? ' color' : ''} (not ${k})`);
    }
    let made = null;
    const next = updateVideoLayer(b.edits, title, l.id, x => { const got = addEffect(x, type); made = got.id; return {...got.layer, fx: got.layer.fx.map(e => (e.id === got.id ? {...e, params: {...e.params, ...params}, ...extra} : e))}; });
    await save(b, next, `${title}: ${spec.name} (${made}) on ${l.id}`);
  },
  async 'vlayer-fx-rm'(ref, id, fxId) {
    const b = await loadBoard(), title = videoTitleOf(b, ref), l = layerOfVideo(b, title, id);
    if (!l.fx?.some(e => e.id === fxId)) fail(`${l.id} has no effect ${fxId}: ${(l.fx ?? []).map(e => e.id).join(', ') || 'none'}`);
    await save(b, updateVideoLayer(b.edits, title, l.id, x => removeEffect(x, fxId)), `${title}: ${fxId} taken off ${l.id}`);
  },
  // an element of the slides, trimmed: it is not seen before <from> or after <to> (seconds; - for no limit; clear: the whole video again)
  async 'vlayer-span'(ref, name, from, to) {
    const b = await loadBoard(), title = videoTitleOf(b, ref);
    if (!name) fail('vlayer-span <video> <element name> <from s|-> <to s|->   (clear: the element is seen the whole time again)');
    const span = from === 'clear' || (!from && !to) ? null : {...(from && from !== '-' ? {from: num(from, 'from')} : {}), ...(to && to !== '-' ? {to: num(to, 'to')} : {})};
    await save(b, setSpan(b.edits, title, name, span), `${title}: ${name} ${span ? `is seen ${span.from != null ? `from ${span.from} s` : ''}${span.to != null ? ` until ${span.to} s` : ''}` : 'is seen the whole time'}`);
  },
  async 'vlayer-order'(ref, id, how) {
    const dir = {front: 'front', back: 'back', forward: 1, backward: -1}[how];
    if (dir == null) fail('vlayer-order <video> <id> front|back|forward|backward');
    const b = await loadBoard(), title = videoTitleOf(b, ref), l = layerOfVideo(b, title, id);
    await save(b, stackVideoLayer(b.edits, title, l.id, dir), `${title}: ${l.id} to the ${how}`);
  },
  async 'vlayer-rm'(ref, id) {
    const b = await loadBoard(), title = videoTitleOf(b, ref), l = layerOfVideo(b, title, id);
    await save(b, removeVideoLayer(b.edits, title, l.id), `${title}: ${l.id} deleted`);
  },
  // ---- Comments on a video (lib/storyboardComments.mjs; the video editor's Comment tool makes them too, and shows a change made here within seconds) ----
  async vcomments(...args) {
    const {board, rest} = commentBoard(args, false), ref = rest[0] ?? null, ids = board ? [board] : VIDEOS.map(v => v.id);
    let found = 0;
    for (const id of ids) {
      const all = (await store.read(id)).edits.comments ?? {}, runs = allRunsOf(id);
      const mine = t => !ref || runs.some(x => x.title === t && x.id === ref) || norm(t) === norm(ref) || norm(t).includes(norm(ref));
      for (const [title, v] of Object.entries(all)) {
        if (!v.items.length || !mine(title)) continue;
        const done = v.items.filter(c => c.done).length;
        console.log(`${id} | ${title} | ${v.items.length} comment${v.items.length === 1 ? '' : 's'}${done ? `, ${done} done` : ''}`);
        v.items.forEach((c, i) => console.log(`  ${pad(i + 1, 3)} ${pad(c.id, 12)} ${pad(`${r(c.at)} s`, 9)} x ${pad(r(c.x), 6)} y ${pad(r(c.y), 6)} ${c.done ? '[done] ' : ''}${JSON.stringify(c.text)}`));
        found += v.items.length;
      }
    }
    if (!found) console.log(`No comment${ref ? ` on a video that matches "${ref}"` : ''}${board ? ` on ${board}` : ' on any board'}.`);
  },
  async 'vcomment-add'(...args) {
    const {board, rest} = commentBoard(args, true), [ref, second, x, y, ...words] = rest;
    if (ref == null || second == null || x == null || y == null) fail('vcomment-add <board> <video> <second> <x> <y> "<words>"');
    const at = num(second, 'the second'), px = num(x, 'x'), py = num(y, 'y');
    pointIn(px, py);
    const b = await loadBoard(board), title = videoTitleOf(b, ref), {edits, id} = addVideoComment(b.edits, title, {at, x: px, y: py, text: words.join(' ')});
    if (!id) fail('That comment is not valid.');
    await save(b, edits, `${title}: comment ${commentNumber(videoCommentsOf(edits, title), id)} (${id}) added at ${at} s, x ${px} y ${py}`);
  },
  async 'vcomment-set'(...args) {
    const {board, rest} = commentBoard(args, true), [ref, which, ...pairs] = rest;
    if (ref == null || which == null || !pairs.length) fail('vcomment-set <board> <video> <n|id> [text="<words>"] [done=true|false] [at=<s>] [x=<px>] [y=<px>]');
    const b = await loadBoard(board), title = videoTitleOf(b, ref), c = commentOfVideo(b, title, which), patch = {};
    for (const p of pairs) {
      const cut = p.indexOf('=');
      if (cut < 1) fail(`"${p}": values are key=value (text, done, at, x, y)`);
      const k = p.slice(0, cut), v = p.slice(cut + 1);
      if (k === 'text') patch.text = v;
      else if (k === 'done') patch.done = flag01(v, 'done');
      else if (k === 'at' || k === 'x' || k === 'y') patch[k] = num(v, k);
      else fail(`A comment has text, done, at, x, y (not ${k})`);
    }
    pointIn(patch.x ?? c.x, patch.y ?? c.y);
    const edits = updateVideoComment(b.edits, title, c.id, patch);
    if (edits === b.edits) { console.log(`${title}: comment ${commentNumber(videoCommentsOf(b.edits, title), c.id)} (${c.id}) is already like that.`); return; }
    await save(b, edits, `${title}: comment ${commentNumber(videoCommentsOf(edits, title), c.id)} (${c.id}) ${pairs.map(p => (p.startsWith('text=') ? 'text' : p)).join(' ')}`);
  },
  async 'vcomment-rm'(...args) {
    const {board, rest} = commentBoard(args, true), [ref, which] = rest;
    if (ref == null || which == null) fail('vcomment-rm <board> <video> <n|id>');
    const b = await loadBoard(board), title = videoTitleOf(b, ref), c = commentOfVideo(b, title, which), n = commentNumber(videoCommentsOf(b.edits, title), c.id);
    await save(b, removeVideoComment(b.edits, title, c.id), `${title}: comment ${n} (${c.id}) deleted`);
  },
  // ---- Variations of the board's videos (lib/storyboardVariations.mjs) ----
  async variations() {
    const b = await loadBoard(), on = activeVariation(b.edits).id;
    for (const v of variationsOf(b.edits)) console.log(`${v.id === on ? '*' : ' '} ${pad(v.id, 5)} ${pad(v.name, 24)} ${v.look ? `${v.look}: ${LOOKS[v.look].label}` : 'as it is made'}`);
  },
  async 'variation-add'(look, ...words) {
    if (!LOOKS[look]) fail(`variation-add <look> ["<name>"]: the looks are ${Object.keys(LOOKS).join(', ')}`);
    const b = await loadBoard(), {edits, id} = addVariation(b.edits, {name: words.join(' '), look, id: flags.id ?? null}); // (`--id v5`: the id it should have, when it is free)
    if (!id) fail('No more variations can be added to this board.');
    await save(b, edits, `${b.id}: ${variationsOf(edits).find(v => v.id === id).name} (${id}, ${LOOKS[look].label}) added, and it plays`);
  },
  async 'variation-use'(id) {
    const b = await loadBoard(), v = variationsOf(b.edits).find(x => x.id === id);
    if (!v) fail(`No variation "${id}": ${variationsOf(b.edits).map(x => x.id).join(', ')}`);
    const edits = setActiveVariation(b.edits, v.id);
    if (edits === b.edits) { console.log(`${b.id}: ${v.name} plays already.`); return; }
    await save(b, edits, `${b.id}: ${v.name} (${v.id}) plays`);
  },
  async 'variation-name'(id, ...words) {
    const b = await loadBoard();
    if (id === ORIGINAL.id || !b.edits.variations?.list.some(v => v.id === id) || !words.length) fail('variation-name <id> "<name>" (not v1)');
    await save(b, renameVariation(b.edits, id, words.join(' ')), `${b.id}: ${id} is "${words.join(' ')}"`);
  },
  async 'variation-rm'(id) {
    const b = await loadBoard();
    if (id === ORIGINAL.id || !b.edits.variations?.list.some(v => v.id === id)) fail(`variation-rm <id>: ${(b.edits.variations?.list ?? []).map(v => v.id).join(', ') || 'this board has no variation but v1'}`);
    await save(b, removeVariation(b.edits, id), `${b.id}: ${id} deleted`);
  },
  // ---- The words of a board's Remotion cut (lib/remotion/cutWords.mjs) ----
  async 'cut-texts'() {
    const b = await loadBoard(), c = cutOf(b.id, b.edits); // (as the variation that plays lays it out: a layout can be a cut of its own, lib/remotion/cuts.mjs)
    if (!c) fail(`${b.id} has no Remotion cut`);
    const words = cutWordsOf(b.edits, c.id), plan = c.make(words, {layout: cutLayoutOf(b.edits)});
    const show = (key, lines, original) => console.log(`${key in words ? '*' : ' '} ${pad(key, 22)} ${JSON.stringify(lines.join(' / '))}${key in words ? `  (the narration: ${JSON.stringify(original.join(' / '))})` : ''}`);
    show('title', plan.title.lines, plan.title.original);
    for (const cap of plan.captions) { show(`${cap.id}:kicker`, cap.kickerLines ?? [cap.kicker], [cap.original.kicker]); show(cap.id, cap.lines, cap.original.lines); }
    console.log(`${plan.seconds.toFixed(2)} s`);
  },
  async 'cut-text'(key, ...words) {
    const b = await loadBoard(), c = cutOf(b.id, b.edits);
    if (!c) fail(`${b.id} has no Remotion cut`);
    const plan = c.make(cutWordsOf(b.edits, c.id), {layout: cutLayoutOf(b.edits)}), text = plan.textOf(key ?? '');
    if (!text) fail(`cut-text <key> "<words>": the keys are title, ${plan.captions.map(x => x.id).join(', ')} (and <id>:kicker)`);
    const value = words.join(' ').split(/\s+\/\s+/).map(l => l.trim()).filter(Boolean).join('\n');
    const edits = setCutText(b.edits, c.id, key, value, text.original.join('\n'));
    if (edits === b.edits) { console.log('Nothing to change.'); return; }
    await save(b, edits, `${b.id}: the cut's ${key} is ${value ? JSON.stringify(value.split('\n').join(' / ')) : "the narration's again"}`);
  },
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
