// What you change in the storyboard, kept apart from the captured frames so the
// frames can be made again without losing it. Everything is pure (edits in, new
// edits out) so it can be undone.
//
//   frames[id]   per frame:
//     note         the description under the frame
//     name         the name the frame shows in its header instead of its label ("Cursor click · press"); the label stays what the video's
//                  director reads (a slide's kind: lib/storyboardAnimations.mjs)
//     moves        { layerKey/path: [dx, dy] }  how far an asset was moved (css px, inside its parent)
//     texts        { layerKey/path: text }      words you retyped
//     tips         { bubbleKey: [dx, dy] }      where a chat bubble's tail was moved to
//     scales       { layerKey/path: [sx, sy] }  how much an asset was scaled (a UI element: sx = sy)
//     sizes        { layerKey: [w, h] }         the size given to a box (an image, the spotlight), css px;
//                                               a chat bubble's box (its words wrap to its width; h 0: as
//                                               tall as its words)
//     hidden       [layerKey]                   captured assets you took out
//     inserts      [layer]                      UI elements brought in (Shift+A), pasted or dropped, with
//                                               their own keys; `inner` says that its own HTML sits inside a stage wrapper
//                                               (`link`, in older files, said what a copy was copied from: ignored, nothing is linked)
//     unique       [layerKey]                   (older files: assets made unique; nothing is linked since 2026-11-09, ignored)
//     anims        { bubbleKey: {type: 'handwrite', cps} } a chat box's words are written by a pen when the frame is
//                                               played (the blue play button at the frame's top right)
//     bubbles      { bubbleKey: {tail: false, words: true | false} } a chat box's tail taken off, its
//                                               words shown or hidden (else as captured)
//     locks        { layerKey: 'w' | 'h' | 'wh' } an asset's width, height or both locked (the sidebar's
//                                               locks): its handles and W / H leave them as they are
//     order        [layerKey]  the stacking you gave the assets, the one at the back first (Ctrl+[ / Ctrl+]); the
//                  assets not in it (added since) are on top, in their own order
//     background   the frame's own background: a color or a gradient (lib/storyboardPaint.mjs)
//     styles       { layerKey/path: {opacity, rotate, radius, fill, stroke, strokeWidth, shadow,
//                  blur, bgBlur, bezel (an iPad's frame color), color, font, size, weight, align, lineHeight, letterSpacing} }
//                  what the sidebar set (STYLE_KEYS; blur: a layer blur, bgBlur: a background
//                  blur, both in px)
//     vtext        { boxKey: {font, fontSize, weight, color, align, lineHeight, letterSpacing, rect: [x, y, w, h]} } how a text looks and where it
//                  is in the VIDEO only (the user, 2026-10-14: "double click any text on any video ... change the text size, font, content, position,
//                  boundaries on the fly"); the slide on the board is not touched. `boxKey` is the key of the text's box (a chat box's layer, or the
//                  element that holds a text); `rect` is its box in the frame's stage px (h 0: as tall as its words). The words themselves are
//                  `texts`, shared with the board. Put on the text after the video has laid it out (components/storyboardPlayerDom.js, applyVideoText)
//     vscale       { layerKey/path: [fx, fy] } an element's size in the VIDEO only (the video editor's handles, the user, 2026-10-22: "if I want to resize
//                  object it should apply ... same way after effects has it"): a factor over the video's own layout, around the element's middle, on every
//                  slide of the video it is on; the slide on the board is not touched (components/storyboardPlayerDom.js, applyVideoScale)
//     vmove        { layerKey/path: [dx, dy] } an element's place in the VIDEO on this slide, stage px over where the video lays it out (the video editor: a drag on the
//                  picture, a point of the motion path; the user, 2026-10-22: "make the keyframes actually show the selected layer position line, and I should able to change
//                  it"); over the tablet's fit too, which would undo a move given to the slide; the slide on the board is not touched
//   videoText    { words: {font, fontSize, weight, color, align, lineHeight, letterSpacing, at} } the look of ALL the words of the videos of the board (the user, 2026-10-14:
//                a change made in a video's text editor is the look of every video's words unless the text was made unique); a text's own `vtext` is on top of it
//   looks        { background | plate | panel: {fill, at}, outline: {stroke, strokeWidth, at} } the look of ALL the parts of a kind in every video and on every slide, the same on every
//                board (the user, 2026-10-21; LOOK_KINDS below); a part made unique keeps `frames[id].ownLooks[key]` ({fill} | {stroke, strokeWidth}; key BACKGROUND: the slide's background);
//                a VIDEO's own look is on its slides: `ownLooks['kind:<kind>']`, and `ownLooks['kind:words']` the look of its words ({font, fontSize, weight, color, align, ...}), what the
//                video's inspector changes first (the user, 2026-10-21: "it doesn't apply to all until I hit an apply to all button ... first it should apply to only the video I have")
//   captions     { run: { 'scene:n': words } } the words typed over the captions of a DETAILED video (lib/storyboardDetails.mjs), in the video itself (the user, 2026-10-14)
//   speed        { title: {cps, seconds, at} } a VIDEO's pen speed (letters a second) and the seconds a scene's highlight + words take (the video editor's Speed; the user, 2026-10-29)
//   variations   {list: [{id, name, look}], active, at} the board's videos played another way, and the one they play (lib/storyboardVariations.mjs; the All videos page's inspector, Variations; the user, 2026-11-03)
//   cuts         { <cut id>: {words: {key: text}, at} } the words retyped in a board's Remotion cut (a double-click on the All videos page; lib/remotion/cutWords.mjs; the user, 2026-11-05)
//   layers       { title: {items: [layer], at} } the layers a VIDEO has over its picture (shapes, texts, images, with keyframes: lib/storyboardLayers.mjs; the
//                video editor and `vlayer…` in scripts/storyboard.mjs; the user, 2026-10-22)
//   comments     { title: {items: [comment], updated} } the comments a VIDEO has: points placed on its picture at a second, with words (lib/storyboardComments.mjs; the video editor's
//                Comment tool and `vcomment…` in scripts/storyboard.mjs; never in the picture; the user, 2026-10-29)
//   copies[id]   frames you added: { from, after, row? }; `from` is the captured frame whose picture
//                it shows (null: a blank frame), `after` the frame it follows (null: put straight
//                into the line `row`, an empty one)
//   lines        { added: {id: {title, after, videos?, view?}}, titles: {id: title}, deleted: [id], order?: [id] } the board's
//                lines (rows): the video's chapters, the ones you added, renamed, deleted or dragged (order). A line you added can be a line of
//                VIDEOS (the user, 2026-10-12): `videos` [{id, name, ids: [frame id]}] are the videos, made of the slides `ids`; the board shows each as a video in
//                place of its first slide unless `view` is 'slides' (lib/storyboardCells.mjs)
//   rows         { chapterId: [frameId] } the order of the frames in each row once you have
//                moved one (a frame can go to another row); without it, the captured order
//   library      { hash: html } for the UI elements brought in
//   deleted      [frameId] captured frames you deleted: they leave the board (a duplicate or a blank
//                frame you delete is simply removed) and go to the Trash (lib/storyboardTrash.mjs)
//   trash        only in the Trash board's own file (content/storyboard/trash.json): the frames
//                deleted from the videos' boards, [{id, video, videoName, chapter, chapterTitle,
//                label, time, from, look, deletedAt}]; a trashed frame's assets are the inserts
//                of frames[id], like a blank frame's
import {normalizePaint} from './storyboardPaint.mjs';
import {cleanVideoLayers, mergeVideoLayers} from './storyboardLayers.mjs';
import {cleanVideoComments, mergeVideoComments} from './storyboardComments.mjs';
import {cleanRefs, mergeRefs} from './storyboardRefs.mjs';
import {cleanVariations, mergeVariations} from './storyboardVariations.mjs';
import {cleanCuts, mergeCuts} from './remotion/cutWords.mjs';
export const NO_LINES = {added: {}, titles: {}, deleted: []};
export const EMPTY = {version: 1, frames: {}, copies: {}, rows: {}, library: {}, deleted: [], trash: [], lines: NO_LINES};
const now = () => new Date().toISOString();
const KEYS = ['order', 'note', 'name', 'moves', 'texts', 'tips', 'scales', 'sizes', 'hidden', 'inserts', 'unique', 'styles', 'locks', 'bubbles', 'anims', 'background', 'vtext', 'ownLooks', 'vscale', 'vmove'];
const CHANGES = ['order', 'moves', 'texts', 'tips', 'scales', 'sizes', 'hidden', 'inserts', 'styles', 'bubbles', 'anims', 'background']; // what makes a frame differ from its capture (`vtext` is the video's, not the slide's)
const isEmpty = value => value == null || value === '' || (typeof value === 'object' && !Object.keys(value).length);
const round = n => Math.round(n * 100) / 100;
const fine = n => Math.round(n * 10000) / 10000;

// Put `patch` on one frame's record, dropping whatever ends up empty.
function update(edits, id, patch, at) {
  const next = {...(edits.frames[id] ?? {}), ...patch, updatedAt: at ?? now()};
  for (const key of KEYS) if (isEmpty(next[key])) delete next[key];
  const frames = {...edits.frames};
  if (KEYS.some(k => k in next)) frames[id] = next; else delete frames[id];
  return {...edits, frames};
}

export const setNote = (edits, id, note, at) => update(edits, id, {note}, at);
// An element's size in the video (`vscale` above): `f` [fx, fy], or null / [1, 1] to take it off
export function setVideoScale(edits, id, key, f, at) {
  const vscale = {...(edits.frames[id]?.vscale ?? {})};
  if (!f || (Math.abs(f[0] - 1) < 0.001 && Math.abs(f[1] - 1) < 0.001)) delete vscale[key]; else vscale[key] = [fine(f[0]), fine(f[1])];
  return update(edits, id, {vscale}, at);
}
export const videoScaleOf = (edits, id, key) => edits.frames[id]?.vscale?.[key] ?? null;
// An element's place in the video on a slide (`vmove` above): `d` [dx, dy] stage px, or null / [0, 0] to take it off
export function setVideoMove(edits, id, key, d, at) {
  const vmove = {...(edits.frames[id]?.vmove ?? {})};
  if (!d || (Math.abs(d[0]) < 0.01 && Math.abs(d[1]) < 0.01)) delete vmove[key]; else vmove[key] = [round(d[0]), round(d[1])];
  return update(edits, id, {vmove}, at);
}
export const videoMoveOf = (edits, id, key) => edits.frames[id]?.vmove?.[key] ?? null;
export const setName = (edits, id, name, at) => update(edits, id, {name: String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)}, at);
export const nameOf = (edits, id) => edits.frames[id]?.name ?? '';
export function setMove(edits, id, key, delta, at) {
  const moves = {...(edits.frames[id]?.moves ?? {})};
  if (Math.abs(delta[0]) < 0.01 && Math.abs(delta[1]) < 0.01) delete moves[key]; else moves[key] = [round(delta[0]), round(delta[1])];
  return update(edits, id, {moves}, at);
}
export const setText = (edits, id, key, text, at) => update(edits, id, {texts: {...(edits.frames[id]?.texts ?? {}), [key]: text}}, at);
export function setTip(edits, id, key, delta, at) {
  const tips = {...(edits.frames[id]?.tips ?? {})};
  if (Math.abs(delta[0]) < 0.01 && Math.abs(delta[1]) < 0.01) delete tips[key]; else tips[key] = [round(delta[0]), round(delta[1])];
  return update(edits, id, {tips}, at);
}
// How much an asset is scaled ([1, 1] takes the scale off).
export function setScale(edits, id, key, scale, at) {
  const scales = {...(edits.frames[id]?.scales ?? {})};
  if (Math.abs(scale[0] - 1) < 0.0005 && Math.abs(scale[1] - 1) < 0.0005) delete scales[key]; else scales[key] = [fine(scale[0]), fine(scale[1])];
  return update(edits, id, {scales}, at);
}
// The size given to a box (null: its own size again).
export function setSize(edits, id, key, size, at) {
  const sizes = {...(edits.frames[id]?.sizes ?? {})};
  if (!size || (!size[0] && !size[1])) delete sizes[key]; else sizes[key] = [round(size[0]), round(size[1])];
  return update(edits, id, {sizes}, at);
}
// What the inspector sets on an asset, like Figma's design panel: STYLE_KEYS gives each one's
// kind. `patch` sets some (a value of null or '' takes one off).
export const STYLE_KEYS = {opacity: 'number', rotate: 'number', radius: 'number', fill: 'paint', bezel: 'paint', stroke: 'color', strokeWidth: 'number', shadow: 'bool', blur: 'number', bgBlur: 'number', color: 'color', font: 'font', size: 'number', weight: 'number', align: 'align', lineHeight: 'number', letterSpacing: 'number'};
export const FONTS = {inter: 'Inter', montserrat: 'Montserrat', poppins: 'Poppins', caveat: 'Caveat (handwritten)', kalam: 'Kalam (handwritten)', playfair: 'Playfair Display (serif)', fraunces: 'Fraunces (serif)', dmsans: 'DM Sans', sora: 'Sora', spacegrotesk: 'Space Grotesk', manrope: 'Manrope', patrickhand: 'Patrick Hand (handwritten)', indieflower: 'Indie Flower (handwritten)', shadowsintolight: 'Shadows Into Light (handwritten)', reeniebeanie: 'Reenie Beanie (handwritten)', dancingscript: 'Dancing Script (cursive)', permanentmarker: 'Permanent Marker (marker)', homemadeapple: 'Homemade Apple (cursive)', nanumpen: 'Nanum Pen Script (brush pen)', gloria: 'Gloria Hallelujah (handwritten)', coveredbygrace: 'Covered By Your Grace (handwritten)', zeyada: 'Zeyada (handwritten)', sacramento: 'Sacramento (monoline cursive)'};
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|transparent)$/i;
export function styleValue(key, value) {
  const kind = STYLE_KEYS[key];
  if (!kind || value == null || value === '' || value === false) return null;
  if (kind === 'number') return Number.isFinite(Number(value)) ? round(Number(value)) : null;
  if (kind === 'paint') return normalizePaint(value); // a color, or a gradient
  if (kind === 'color') return typeof value === 'string' && COLOR.test(value.trim()) ? value.trim().toLowerCase() : null;
  if (kind === 'bool') return true;
  if (kind === 'font') return typeof value === 'string' && Object.hasOwn(FONTS, value) ? value : null;
  if (kind === 'align') return ['left', 'center', 'right', 'justify'].includes(value) ? value : null;
  return null;
}
export function setStyle(edits, id, key, patch, at) {
  const styles = {...(edits.frames[id]?.styles ?? {})}, own = {...(styles[key] ?? {})};
  for (const [k, v] of Object.entries(patch)) { const clean = styleValue(k, v); if (clean == null) delete own[k]; else own[k] = clean; }
  if (Object.keys(own).length) styles[key] = own; else delete styles[key];
  return update(edits, id, {styles}, at);
}
export const styleOf = (edits, id, key) => edits.frames[id]?.styles?.[key] ?? {};
// How a text looks and where it is in the VIDEO (see `vtext` above): the look is STYLE_KEYS' (under `fontSize` for the text size, which is not the box's), the place is `rect`.
// What does not make sense is dropped, so a file or a field that was typed wrong never reaches the picture.
export const VIDEO_TEXT_LOOK = {font: 'font', fontSize: 'size', weight: 'weight', color: 'color', align: 'align', lineHeight: 'lineHeight', letterSpacing: 'letterSpacing'}; // (the name here: the one STYLE_KEYS knows it by)
const VIDEO_TEXT_RANGE = {fontSize: [4, 400], weight: [100, 900], lineHeight: [4, 800], letterSpacing: [-50, 100]};
export function cleanVideoText(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [name, kind] of Object.entries(VIDEO_TEXT_LOOK)) {
    const value = styleValue(kind, raw[name]), [lo, hi] = VIDEO_TEXT_RANGE[name] ?? [-Infinity, Infinity];
    if (value != null && !(typeof value === 'number' && (value < lo || value > hi))) out[name] = value;
  }
  const r = raw.rect;
  if (Array.isArray(r) && r.length === 4 && r.every(Number.isFinite) && Math.abs(r[0]) < 6000 && Math.abs(r[1]) < 6000 && r[2] >= 4 && r[2] < 6000 && r[3] >= 0 && r[3] < 6000) out.rect = r.map(round);
  return out;
}
// A text's look and place with `patch` on it (a value of null or '' takes that one off), cleaned. ({}: as the video lays it out)
export function mergeVideoText(own, patch) {
  const next = {...(own ?? {})};
  for (const [name, value] of Object.entries(patch ?? {})) { if (value == null || value === '' || value === false) delete next[name]; else next[name] = value; }
  return cleanVideoText(next);
}
// Change some of a text's look or place in frame `id` (every one off: the text is as the video lays it out). The same edits back when nothing changes.
export function setVideoText(edits, id, key, patch, at) {
  const all = {...(edits.frames[id]?.vtext ?? {})}, before = JSON.stringify(all[key] ?? null), clean = mergeVideoText(all[key], patch);
  if (Object.keys(clean).length) all[key] = clean; else delete all[key];
  return JSON.stringify(all[key] ?? null) === before ? edits : update(edits, id, {vtext: all}, at);
}
export const videoTextOf = (edits, id, key) => edits.frames[id]?.vtext?.[key] ?? {};
// The look of ALL the video texts of a kind (the user, 2026-10-14: "if I double click the text and change the font size and everything, it should change in the whole video and in all
// the videos, unless I press Done and make it unique"): `edits.videoText[kind]` = {font, fontSize, weight, color, align, lineHeight, letterSpacing, at}, the look of every text of that
// kind in every video of the board (a text's own `vtext` is on top of it: made unique). Only the look is shared, never a place or a box (`rect`: that is a text's own).
// Kinds: 'words' (the chat boxes on the right of the software). `at` says which of two copies is the newer (mergeEdits; the page keeps the two boards alike).
export const VIDEO_TEXT_KINDS = ['words'];
const cleanShared = raw => { const out = cleanVideoText(raw); delete out.rect; return out; };
// `look` put on the kind's look (a value of null takes that one off; `rect` is left out). The same edits back when nothing changes.
export function setVideoTextKind(edits, kind, look, at) {
  if (!VIDEO_TEXT_KINDS.includes(kind)) return edits;
  const {at: was, ...old} = edits.videoText?.[kind] ?? {}, clean = cleanShared(mergeVideoText(old, {...(look ?? {}), rect: null}));
  if (JSON.stringify(clean) === JSON.stringify(old)) return edits;
  const videoText = {...(edits.videoText ?? {})}, next = {...edits};
  if (Object.keys(clean).length) videoText[kind] = {...clean, at: at ?? now()}; else delete videoText[kind];
  if (Object.keys(videoText).length) next.videoText = videoText; else delete next.videoText;
  return next;
}
export const videoTextKindOf = (edits, kind) => { const {at, ...look} = edits.videoText?.[kind] ?? {}; return look; };
// The looks of all the video texts as `videoText` says (another board's: they are kept the same on every board). The same edits back when nothing changes.
export function setVideoTextAll(edits, videoText) {
  const out = {};
  for (const kind of VIDEO_TEXT_KINDS) { const clean = cleanShared(videoText?.[kind]); if (Object.keys(clean).length) out[kind] = {...clean, at: typeof videoText[kind].at === 'string' ? videoText[kind].at : now()}; }
  const next = Object.keys(out).length ? out : null;
  if (JSON.stringify(next) === JSON.stringify(edits.videoText ?? null)) return edits;
  const result = {...edits};
  if (next) result.videoText = next; else delete result.videoText;
  return result;
}
// The look of ALL the parts of a kind, in every video and on every slide of every board (the user, 2026-10-21: "add also a way to edit everything like the colors of background, and it should
// apply to all of the videos in all the storyboard and all slides unless I press undo or I press make unique and apply just like text"): `edits.looks[kind]` = {fill | stroke, strokeWidth, at},
// put over what the slides have (components/storyboardDom.js applyLooks) and kept the same on every board (the page copies it to the others). A part made unique has its own:
// `frames[id].ownLooks[key]` (a layer's key, or BACKGROUND for the slide's background). The kinds and what can be changed in each:
//   background  the slide's background, behind everything      plate  the light plate behind the software
//   panel       the gray side: the words' side, the band under a big board, a title's backdrop      outline  the yellow outlines (and the popped cards' borders)
//   connector   the purple lines between cards, their color, thickness and arrow head (ARROW_HEADS; the user, 2026-10-21: "make the purple line editable with changing arrow head and colors")
export const LOOK_KINDS = {background: ['fill'], plate: ['fill'], panel: ['fill'], outline: ['stroke', 'strokeWidth'], connector: ['stroke', 'strokeWidth', 'arrow', 'hide']}; // (`hide`: the lines deleted on a video, by name: its own only, never shared)
export const ARROW_HEADS = ['arrow', 'triangle', 'dot', 'none'];
const lookValue = (name, v) => (name === 'arrow' ? (ARROW_HEADS.includes(v) ? v : null) : name === 'hide' ? (Array.isArray(v) && v.length ? [...new Set(v.filter(n => typeof n === 'string' && n.length < 80))].slice(0, 50) : null) : styleValue(name, v));
export const BACKGROUND = '@background';
const cleanLook = (kind, raw) => { const out = {}; for (const name of LOOK_KINDS[kind] ?? []) { const v = lookValue(name, raw?.[name]); if (v != null) out[name] = v; } return out; };
// The look of every element of a NAME (the tablet, a mission card...) on every slide of every board: `looks.layers[name] = {style, at}`, what the video editor's Apply
// to all gives an element (the user, 2026-10-22: "all elements should be editable, and I can apply to all"); put on before a slide's own styles (`applyEdits`), so a
// slide that has its own keeps it. Its place (`rotate`) is never shared.
const cleanLayerLooks = raw => {
  const out = {};
  for (const [name, v] of Object.entries(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {})) {
    if (name.length > 120 || !v || typeof v !== 'object') continue;
    const style = Object.fromEntries(Object.entries(v.style ?? {}).filter(([k]) => k !== 'rotate').map(([k, x]) => [k, styleValue(k, x)]).filter(([, x]) => x != null));
    if (Object.keys(style).length) out[name] = {style, at: typeof v.at === 'string' ? v.at : now()};
  }
  return Object.keys(out).length ? out : null;
};
const cleanLooks = raw => {
  const out = {};
  for (const kind of Object.keys(LOOK_KINDS)) { const clean = cleanLook(kind, raw?.[kind]); if (Object.keys(clean).length) out[kind] = {...clean, at: typeof raw[kind].at === 'string' ? raw[kind].at : now()}; }
  const layers = cleanLayerLooks(raw?.layers);
  if (layers) out.layers = layers;
  return Object.keys(out).length ? out : null;
};
// `style` the look of every element named `name` (null or {}: none). The same edits back when nothing changes.
export function setLayerLook(edits, name, style, at) {
  const clean = style && Object.keys(style).length ? cleanLayerLooks({[name]: {style, at: at ?? now()}})?.[name] : null, was = edits.looks?.layers?.[name];
  if (JSON.stringify(clean?.style ?? null) === JSON.stringify(was?.style ?? null)) return edits;
  const layers = {...(edits.looks?.layers ?? {})}, looks = {...(edits.looks ?? {})}, next = {...edits};
  if (clean) layers[name] = clean; else delete layers[name];
  if (Object.keys(layers).length) looks.layers = layers; else delete looks.layers;
  if (Object.keys(looks).length) next.looks = looks; else delete next.looks;
  return next;
}
export const layerLookOf = (edits, name) => edits.looks?.layers?.[name]?.style ?? null;
const patchLook = (kind, old, patch) => { const next = {...old}; for (const [name, value] of Object.entries(patch ?? {})) { if (value == null || value === '') delete next[name]; else next[name] = value; } return kind === 'words' ? cleanShared(next) : cleanLook(kind, next); }; // ('words': a video's own look of its words, as the shared one is)
// `look` put on the kind's shared look (a value of null takes that one off). The same edits back when nothing changes.
export function setSharedLook(edits, kind, look, at) {
  if (!LOOK_KINDS[kind]) return edits;
  const {at: was, ...old} = edits.looks?.[kind] ?? {}, clean = patchLook(kind, old, look);
  if (JSON.stringify(clean) === JSON.stringify(cleanLook(kind, old))) return edits;
  const looks = {...(edits.looks ?? {})}, next = {...edits};
  if (Object.keys(clean).length) looks[kind] = {...clean, at: at ?? now()}; else delete looks[kind];
  if (Object.keys(looks).length) next.looks = looks; else delete next.looks;
  return next;
}
export const sharedLookOf = (edits, kind) => { const {at, ...look} = edits.looks?.[kind] ?? {}; return look; };
// All the shared looks as `looks` says (another board's: they are the same on every board). The same edits back when nothing changes.
export function setSharedLooks(edits, looks) {
  const clean = cleanLooks(looks);
  if (JSON.stringify(clean) === JSON.stringify(edits.looks ?? null)) return edits;
  const next = {...edits};
  if (clean) next.looks = clean; else delete next.looks;
  return next;
}
// A part's own look (made unique): `patch` put on it, `null` takes it off (the part follows the shared look again). The same edits back when nothing changes.
export function setOwnLook(edits, id, key, kind, patch, at) {
  const all = {...(edits.frames[id]?.ownLooks ?? {})}, before = JSON.stringify(all[key] ?? null);
  if (patch === null) delete all[key]; else { const clean = patchLook(kind, all[key], patch); if (Object.keys(clean).length) all[key] = clean; else delete all[key]; }
  return JSON.stringify(all[key] ?? null) === before ? edits : update(edits, id, {ownLooks: all}, at);
}
export const ownLookOf = (edits, id, key) => edits.frames[id]?.ownLooks?.[key] ?? null;
// The captions of the DETAILED videos (the user, 2026-10-14: "another line of videos under videos where it will have the same videos but citing all details"): the code gives each beat of each
// scene its caption (lib/storyboardDetails.mjs); the words typed over one in the video itself are `edits.captions[run][beat]` (a beat is `scene:n`, n the caption's place in the scene's
// list). '' takes it off.
export function setCaption(edits, run, beat, text) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 400), was = edits.captions?.[run]?.[beat];
  if ((clean || undefined) === was) return edits;
  const runs = {...(edits.captions ?? {})}, own = {...(runs[run] ?? {})}, next = {...edits};
  if (clean) own[beat] = clean; else delete own[beat];
  if (Object.keys(own).length) runs[run] = own; else delete runs[run];
  if (Object.keys(runs).length) next.captions = runs; else delete next.captions;
  return next;
}
export const captionOf = (edits, run, beat) => edits.captions?.[run]?.[beat] ?? null;
// A video's SPEED (the user, 2026-10-29: "add a way to change speed from editor", after "make the words show up faster"): `edits.speed[<video title>]` = {cps, seconds, at}, the pen's letters a
// second and the seconds the highlight and the words of a scene take together (lib/storyboardVideos.mjs has them in the video's profile). What is not set is the profile's. null takes one off.
export const SPEED = {cps: {min: 4, max: 90}, seconds: {min: 0.6, max: 8}};
const cleanSpeed = (name, v) => { const n = v == null || v === '' ? NaN : Number(v); return Number.isFinite(n) ? round1(Math.min(SPEED[name].max, Math.max(SPEED[name].min, n))) : null; };
export const videoSpeedOf = (edits, title) => { const {at, ...own} = edits.speed?.[title] ?? {}; return own; };
export function setVideoSpeed(edits, title, patch, at = null) {
  if (typeof title !== 'string' || !title || title.length >= 120) return edits;
  const was = videoSpeedOf(edits, title), own = {...was};
  for (const name of Object.keys(SPEED)) if (name in patch) { const v = cleanSpeed(name, patch[name]); if (v == null) delete own[name]; else own[name] = v; }
  if (JSON.stringify(own) === JSON.stringify(was)) return edits;
  const all = {...(edits.speed ?? {})}, next = {...edits};
  if (Object.keys(own).length) all[title] = {...own, at: at ?? now()}; else delete all[title];
  if (Object.keys(all).length) next.speed = all; else delete next.speed;
  return next;
}
// A text's own line height (px) after its font size goes from `from` to `to`: it moves with it (as Figma's does), so the lines
// keep the same distance in letter heights (the user, 2026-10-07: "I change the font size and it just spreads the lines apart").
// null when there is none to move (the line height follows the size by itself).
export const scaledLineHeight = (lineHeight, from, to) => (Number.isFinite(lineHeight) && lineHeight > 0 && from > 0 && to > 0 ? Math.round((lineHeight * to / from) * 100) / 100 : null);
// A chat box: its tail off (tail: false; true or null: as captured), its words shown or hidden
// (words: true / false; null: as captured).
export function setBubble(edits, id, key, patch, at) {
  const all = {...(edits.frames[id]?.bubbles ?? {})}, own = {...(all[key] ?? {})};
  if ('tail' in patch) { if (patch.tail === false) own.tail = false; else delete own.tail; }
  if ('words' in patch) { if (typeof patch.words === 'boolean') own.words = patch.words; else delete own.words; }
  if (Object.keys(own).length) all[key] = own; else delete all[key];
  return update(edits, id, {bubbles: all}, at);
}
// A chat box's words written by a pen (see lib/storyboardHandwriting.mjs): {type: 'handwrite', cps} (letters a second: the user, 2026-10-09,
// "letters per second, so it is consistent, because sometimes words are bigger"), or null to take it off. Older ones hold `wps` (words a second:
// about 6 letters a word) or `seconds` (the whole sentence's time: it was only the old default, the video does not follow it).
export const ANIM_SECONDS = {min: 0.5, max: 30, default: 4};
export const ANIM_CPS = {min: 4, max: 60, default: 30}; // (the user, 2026-10-29: "make all text speed 30 letters per second": the usual pen of every video, the detailed twins too, and of a slide that has none of its own)
const WORD_LETTERS = 6;
const round1 = n => Math.round(n * 10) / 10;
const given = v => v !== null && v !== '' && v !== undefined && Number.isFinite(Number(v));
const clampCps = n => round1(Math.min(ANIM_CPS.max, Math.max(ANIM_CPS.min, n)));
export function cleanAnim(raw) {
  if (!raw || typeof raw !== 'object' || raw.type !== 'handwrite') return null;
  if (given(raw.cps)) return {type: 'handwrite', cps: clampCps(Number(raw.cps))};
  if (given(raw.wps)) return {type: 'handwrite', cps: clampCps(Number(raw.wps) * WORD_LETTERS)};
  if (given(raw.seconds)) return {type: 'handwrite', seconds: round1(Math.min(ANIM_SECONDS.max, Math.max(ANIM_SECONDS.min, Number(raw.seconds))))};
  return {type: 'handwrite', cps: ANIM_CPS.default};
}
export const wordCount = text => String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
// The letters and digits of a text (what a pen's speed counts).
export const letterCount = text => (String(text ?? '').match(/[\p{L}\p{N}]/gu) ?? []).length;
// How long a pen takes for `text`, and how fast it goes (letters a second).
export const animSeconds = (anim, text) => (anim?.cps ? Math.max(0.3, letterCount(text) / anim.cps) : anim?.wps ? Math.max(0.3, wordCount(text) / anim.wps) : Number(anim?.seconds) || ANIM_SECONDS.default);
export const animCps = (anim, text) => (anim?.cps ? anim.cps : anim?.wps ? clampCps(anim.wps * WORD_LETTERS) : anim?.seconds && letterCount(text) ? clampCps(letterCount(text) / anim.seconds) : ANIM_CPS.default);
export function setAnim(edits, id, key, anim, at) {
  const anims = {...(edits.frames[id]?.anims ?? {})}, clean = cleanAnim(anim);
  if (clean) anims[key] = clean; else delete anims[key];
  return update(edits, id, {anims}, at);
}
export const animOf = (edits, id, key) => edits.frames[id]?.anims?.[key] ?? null;
export const hasAnim = (edits, id) => Object.keys(edits.frames[id]?.anims ?? {}).length > 0;
export const bubbleOf = (edits, id, key) => edits.frames[id]?.bubbles?.[key] ?? {};
// Every chat box of the board (`frames`, as laid out) that has a tail without it (`on`: with it again).
export function setTails(edits, frames, on, at) {
  let next = edits;
  for (const f of frames) for (const layer of layersOf(f, next.frames[f.id])) if (layer.kind === 'bubble' && layer.tip) next = setBubble(next, f.id, layer.key, {tail: on ? null : false}, at);
  return next;
}
// Lock an asset's width, height or both ('w', 'h', 'wh'; '' unlocks it).
export const LOCKS = ['w', 'h', 'wh'];
export function setLock(edits, id, key, axes, at) {
  const locks = {...(edits.frames[id]?.locks ?? {})}, clean = ['w', 'h'].filter(a => String(axes ?? '').includes(a)).join('');
  if (clean) locks[key] = clean; else delete locks[key];
  return update(edits, id, {locks}, at);
}
export const lockOf = (edits, id, key) => { const l = edits.frames[id]?.locks?.[key] ?? ''; return {w: l.includes('w'), h: l.includes('h')}; };
// Every chat bubble of the board (`frames`, as laid out) `w` wide (its height as it was: given, or
// as tall as its words), its width locked with `lock`.
export function sizeBubbles(edits, frames, w, {lock = true, at} = {}) {
  let next = edits;
  for (const f of frames) for (const layer of layersOf(f, next.frames[f.id])) {
    if (layer.kind !== 'bubble') continue;
    next = setSize(next, f.id, layer.key, [w, next.frames[f.id]?.sizes?.[layer.key]?.[1] ?? 0], at);
    next = setLock(next, f.id, layer.key, lock ? (lockOf(next, f.id, layer.key).h ? 'wh' : 'w') : (lockOf(next, f.id, layer.key).h ? 'h' : ''), at);
  }
  return next;
}
// Apply to all in its row (the user, 2026-11-06, the board "All storyboards": "if I change a title position ... and I hit apply to all instead of apply to unique, it should apply to the whole row of
// the same video"): what was done to the asset `layer` of frame `from` (where it was moved, its scale, size, look, lock, its chat box's tail; taken out or not) is put on each of
// `targets` [{frame, key}] (the same asset in the other frames of its row: lib/storyboardLinks.mjs linkedLayers), in place of what they had. Until then a change is that frame's alone.
// The WORDS are never carried: every frame's texts are its own (the user, 2026-11-09: "every text is not the same as others ... nothing is linked").
const ROW_FIELDS = ['moves', 'scales', 'sizes', 'styles', 'locks', 'tips', 'bubbles', 'anims'];
const ofLayer = (k, layer) => k === layer || k.startsWith(`${layer}/`) || k.startsWith(`${layer}#`);
export function applyAlongRow(edits, from, layer, targets, at) {
  const src = edits.frames[from] ?? {};
  let out = edits;
  for (const {frame, key} of targets) {
    if (frame === from && key === layer) continue;
    const dst = out.frames[frame] ?? {}, patch = {};
    for (const field of ROW_FIELDS) {
      const kept = Object.entries(dst[field] ?? {}).filter(([k]) => !ofLayer(k, key)), mine = Object.entries(src[field] ?? {}).filter(([k]) => ofLayer(k, layer)).map(([k, v]) => [key + k.slice(layer.length), v]);
      patch[field] = Object.fromEntries([...kept, ...mine]);
    }
    const hidden = (dst.hidden ?? []).filter(k => k !== key);
    patch.hidden = (src.hidden ?? []).includes(layer) ? [...hidden, key] : hidden;
    out = update(out, frame, patch, at);
  }
  return out;
}
// Delete in the whole row: the asset taken out of each of `targets` [{frame, key}] (the frame it was picked in too)
export const hideAlongRow = (edits, targets, at) => targets.reduce((out, {frame, key}) => update(out, frame, {hidden: [...new Set([...(out.frames[frame]?.hidden ?? []), key])]}, at), edits);
export const noteOf = (edits, id) => edits.frames[id]?.note ?? '';
export const isEdited = record => !!record && CHANGES.some(key => record[key]);
export const hasChanges = (edits, id) => isEdited(edits.frames[id]);

// The assets a frame shows: the captured ones you left in, then the ones you brought in.
// The assets of a frame, the one at the back first: as captured, then the ones brought in, unless you gave them another
// stacking (edit.order: the ones in it by that order, the others after them).
export function layersOf(frame, edit) {
  const all = [...frame.layers.filter(l => !edit?.hidden?.includes(l.key)), ...(edit?.inserts ?? [])], order = edit?.order;
  if (!order?.length) return all;
  const rank = new Map(order.map((k, i) => [k, i]));
  return all.map((layer, i) => ({layer, at: rank.has(layer.key) ? rank.get(layer.key) : order.length + i})).sort((a, b) => a.at - b.at).map(x => x.layer);
}
// `keys` (the ones picked) moved in `list` (bottom first): one place up ('forward') or down ('backward'), or past all
// the others ('front' / 'back'); the others keep their order. A new list, or the same one if nothing moved.
export function reorderKeys(list, keys, how) {
  const picked = new Set(keys), next = [...list];
  if (how === 'forward') { for (let i = next.length - 2; i >= 0; i--) if (picked.has(next[i]) && !picked.has(next[i + 1])) [next[i], next[i + 1]] = [next[i + 1], next[i]]; }
  else if (how === 'backward') { for (let i = 1; i < next.length; i++) if (picked.has(next[i]) && !picked.has(next[i - 1])) [next[i], next[i - 1]] = [next[i - 1], next[i]]; }
  else if (how === 'front') return [...next.filter(k => !picked.has(k)), ...next.filter(k => picked.has(k))].join('\n') === next.join('\n') ? list : [...next.filter(k => !picked.has(k)), ...next.filter(k => picked.has(k))];
  else if (how === 'back') return [...next.filter(k => picked.has(k)), ...next.filter(k => !picked.has(k))].join('\n') === next.join('\n') ? list : [...next.filter(k => picked.has(k)), ...next.filter(k => !picked.has(k))];
  return next.join('\n') === list.join('\n') ? list : next;
}
// Move assets of frame `id` in the stacking (the whole stacking is kept from then on). No change: the same edits back.
export function moveLayers(edits, frame, keys, how, at) {
  const current = layersOf(frame, edits.frames[frame.id]).map(l => l.key), next = reorderKeys(current, keys, how);
  return next === current ? edits : update(edits, frame.id, {order: next}, at);
}

// Take a captured asset out of a frame (Reset frame brings it back).
export const hideLayer = (edits, id, key, at) => update(edits, id, {hidden: [...new Set([...(edits.frames[id]?.hidden ?? []), key])]}, at);
// ... and an asset taken out brought back (as captured, with what was changed on it).
export const unhideLayer = (edits, id, key, at) => (edits.frames[id]?.hidden?.includes(key) ? prune(update(edits, id, {hidden: edits.frames[id].hidden.filter(k => k !== key)}, at)) : edits);
// Bring UI elements in (their HTML goes in the library, keyed by hash).
export const addInserts = (edits, id, inserts, library, at) => update({...edits, library: {...edits.library, ...library}}, id, {inserts: [...(edits.frames[id]?.inserts ?? []), ...inserts]}, at);
export const removeInsert = (edits, id, key, at) => prune(update(edits, id, {inserts: (edits.frames[id]?.inserts ?? []).filter(l => l.key !== key)}, at));
// The same asset with other HTML (a drawing in another color): `hash` keys the new HTML.
export function setInsertHtml(edits, id, key, html, hash, at) {
  const record = edits.frames[id];
  if (!record?.inserts?.some(l => l.key === key)) return edits;
  return prune(update({...edits, library: {...edits.library, [hash]: html}}, id, {inserts: record.inserts.map(l => (l.key === key ? {...l, asset: hash} : l))}, at));
}
// Back to the frame as it was captured (the note stays).
// The frame's own background (a color or a gradient; null: as captured).
export const setBackground = (edits, id, paint, at) => update(edits, id, {background: normalizePaint(paint)}, at);
export const backgroundOf = (edits, id) => edits.frames[id]?.background ?? null;
export const resetFrame = (edits, id, at) => prune(update(edits, id, {order: null, background: null, moves: null, texts: null, tips: null, scales: null, sizes: null, hidden: null, inserts: null, unique: null, styles: null, locks: null, bubbles: null, anims: null}, at));
// One asset back as it was captured: its place, size, scale, tail point, styles and locks (its words stay).
export function resetAsset(edits, id, key, at) {
  const r = edits.frames[id];
  if (!r) return edits;
  const without = name => { const o = {...(r[name] ?? {})}; for (const k of Object.keys(o)) if (k === key || k.startsWith(`${key}/`)) delete o[k]; return o; };
  return update(edits, id, {moves: without('moves'), scales: without('scales'), sizes: without('sizes'), tips: without('tips'), styles: without('styles'), locks: without('locks'), bubbles: without('bubbles')}, at);
}

// Drop library HTML nothing uses any more.
export function prune(edits) {
  const used = new Set();
  for (const r of Object.values(edits.frames)) for (const l of r.inserts ?? []) used.add(l.asset);
  const library = Object.fromEntries(Object.entries(edits.library).filter(([hash]) => used.has(hash)));
  return Object.keys(library).length === Object.keys(edits.library).length ? edits : {...edits, library};
}

// ---- Duplicated and blank frames ------------------------------------------------------
export const isCopy = (edits, id) => id in edits.copies;
export const isBlank = (edits, id) => edits.copies[id]?.from === null;
export function nextBlankId(edits) {
  let n = 1;
  while (`blank-${n}` in edits.copies) n++;
  return `blank-${n}`;
}
export function nextCopyId(edits, rootId) {
  let n = 2;
  while (`${rootId}#${n}` in edits.copies) n++;
  return `${rootId}#${n}`;
}
// A new frame that shows `from`, placed right after `after`. With `inherit` it
// also takes that frame's moves, retyped words, tail points and assets (not its
// note): that is a duplicate.
// `id` right after `after` in the explicit order of its row (if there is one).
function intoRows(rows, after, id) {
  for (const [row, ids] of Object.entries(rows)) {
    const i = ids.indexOf(after);
    if (i >= 0) return {...rows, [row]: [...ids.slice(0, i + 1), id, ...ids.slice(i + 1)]};
  }
  return rows;
}
export function addCopy(edits, {from, after, inherit = null}, at) {
  const blank = from == null || isBlank(edits, from); // a copy of a blank frame is a blank frame
  const root = blank ? null : edits.copies[from]?.from ?? from, id = blank ? nextBlankId(edits) : nextCopyId(edits, root);
  const source = inherit ? edits.frames[inherit] : null;
  const record = source ? {...Object.fromEntries([...CHANGES, 'unique', 'locks'].filter(k => source[k]).map(k => [k, JSON.parse(JSON.stringify(source[k]))])), updatedAt: at ?? now()} : null;
  return {id, edits: {...edits, rows: intoRows(edits.rows, after, id), copies: {...edits.copies, [id]: {from: root, after}}, frames: record && Object.keys(record).length > 1 ? {...edits.frames, [id]: record} : edits.frames}};
}
// A blank frame (white, nothing in it) right after `after`: the + between two frames.
export const addBlank = (edits, after, at) => addCopy(edits, {from: null, after}, at);
// A blank frame straight into a line (an empty one has no frame to follow): at its end.
export function addBlankIn(edits, line) {
  const id = nextBlankId(edits);
  return {id, edits: {...edits, copies: {...edits.copies, [id]: {from: null, after: null, row: line}}, rows: {...edits.rows, [line]: [...(edits.rows[line] ?? []), id]}}};
}
// Remove a duplicate or a blank frame (the captured frames cannot be removed). Frames that followed it follow what it followed.
export function removeCopy(edits, id) {
  if (!isCopy(edits, id)) return edits;
  const copies = {};
  for (const [key, c] of Object.entries(edits.copies)) if (key !== id) copies[key] = c.after === id ? {...c, after: edits.copies[id].after} : c;
  const frames = {...edits.frames};
  delete frames[id];
  const rows = Object.fromEntries(Object.entries(edits.rows).map(([row, ids]) => [row, ids.filter(x => x !== id)]));
  return prune({...edits, copies, frames, rows});
}
// Any frame can be deleted: a duplicate or a blank frame is removed, a captured one is
// put in `deleted` (what is captured is never edited, only hidden). The frames that
// were duplicated from it stay.
export const isDeleted = (edits, id) => (edits.deleted ?? []).includes(id);
export function deleteFrame(edits, id) {
  if (isCopy(edits, id)) return removeCopy(edits, id);
  if (isDeleted(edits, id)) return edits;
  return {...edits, deleted: [...(edits.deleted ?? []), id]};
}

// ---- Lines (the rows of the board) ------------------------------------------------------
// A line is one of the video's chapters or one you added; you can rename it or delete it (its
// frames are deleted one by one, so the Trash gets them, with the line's name).
// The board's lines in order: [{id, title, added}] (`chapters`: the video's [{id, title}]). A line
// you added comes right after the one it was added after (null: before the first).
export function linesOf(chapters, edits) {
  const L = edits.lines ?? NO_LINES, out = [], placed = new Set(), after = {};
  for (const [id, line] of Object.entries(L.added)) (after[line.after ?? ''] ??= []).push(id);
  const visit = (id, title, added) => {
    if (placed.has(id)) return;
    placed.add(id);
    if (!L.deleted.includes(id)) out.push({id, title: L.titles[id] ?? title, added});
    for (const child of [...(after[id] ?? [])].reverse()) visit(child, L.added[child].title, true); // the newest right after it
  };
  for (const id of [...(after[''] ?? [])].reverse()) visit(id, L.added[id].title, true);
  for (const c of chapters) visit(c.id, c.title, false);
  for (const id of Object.keys(L.added)) visit(id, L.added[id].title, true); // (after a line that is no more: at the end)
  return withOrder(out, L.order);
}
// The order you gave the lines by dragging them (`order`: line ids). The lines in it keep that
// order; one that is not in it (added since) goes right after the line before it in the default order.
function withOrder(out, order) {
  if (!order?.length) return out;
  const rank = new Map(order.map((id, i) => [id, i])), result = out.filter(l => rank.has(l.id)).sort((a, b) => rank.get(a.id) - rank.get(b.id));
  out.forEach((line, i) => {
    if (rank.has(line.id)) return;
    result.splice(i ? result.findIndex(l => l.id === out[i - 1].id) + 1 : 0, 0, line);
  });
  return result;
}
// A line moved to a place among the others: `ids` are the board's lines as they are now (linesOf), `index` is
// the place it takes (0 = first) among the others. The whole order is kept from then on. No change: the same edits.
export function moveLine(edits, ids, id, index) {
  if (!ids.includes(id)) return edits;
  const rest = ids.filter(x => x !== id), at = Math.max(0, Math.min(index, rest.length)), order = [...rest.slice(0, at), id, ...rest.slice(at)];
  if (order.join('\n') === ids.join('\n')) return edits;
  return {...edits, lines: {...(edits.lines ?? NO_LINES), order}};
}
export function addLine(edits, {after = null, title = 'New line'} = {}) {
  const L = edits.lines ?? NO_LINES;
  let n = 1;
  while (`line-${n}` in L.added) n++;
  const id = `line-${n}`;
  return {id, edits: {...edits, lines: {...L, added: {...L.added, [id]: {title: String(title).slice(0, 120), after}}}}};
}
// The videos of a line you added (lib/storyboardCells.mjs): [{id, name, ids}], the slides of each in order; none takes them off.
const cleanVideo = v => {
  if (!v || typeof v !== 'object' || typeof v.id !== 'string' || !v.id || v.id.length > 60 || !Array.isArray(v.ids)) return null;
  const ids = [...new Set(v.ids.filter(i => typeof i === 'string' && i && i.length < 200))].slice(0, 100);
  return ids.length ? {id: v.id, name: text(v.name, 120) || v.id, ids} : null;
};
// The videos of the board put together in this line (lib/storyboardVideos.mjs, `shelvedRuns`; the user, 2026-10-13: "take all videos and put them in one line"): `shelf` is the ids of the
// runs (VIDEO_RUNS) whose video stands in this line's row, in this order. A line with a shelf has no frames of its own to show.
const cleanShelf = list => (Array.isArray(list) ? [...new Set(list.filter(r => typeof r === 'string' && r && r.length < 60))].slice(0, 30) : []);
export function setLineShelf(edits, id, runs) {
  const L = edits.lines ?? NO_LINES, line = L.added[id];
  if (!line) return edits;
  const {shelf: ignored, ...rest} = line, list = cleanShelf(runs); // eslint-disable-line no-unused-vars
  return {...edits, lines: {...L, added: {...L.added, [id]: list.length ? {...rest, shelf: list} : rest}}};
}
export function setLineVideos(edits, id, videos) {
  const L = edits.lines ?? NO_LINES, line = L.added[id];
  if (!line) return edits;
  const {videos: ignoredVideos, view: ignoredView, ...rest} = line, list = (videos ?? []).map(cleanVideo).filter(Boolean).slice(0, 200); // eslint-disable-line no-unused-vars
  return {...edits, lines: {...L, added: {...L.added, [id]: list.length ? {...rest, videos: list} : rest}}};
}
// A line of videos shown as videos (the default) or as the slides they are made of. To slides, `order` (the ids of the line's frames, the slides of each video
// together) is the row the slides then have; nothing changes in the row going back to videos.
export function setLineView(edits, id, view, order = null) {
  const L = edits.lines ?? NO_LINES, line = L.added[id];
  if (!line?.videos?.length) return edits;
  const {view: ignored, ...rest} = line; // eslint-disable-line no-unused-vars
  const next = {...edits, lines: {...L, added: {...L.added, [id]: view === 'slides' ? {...rest, view: 'slides'} : rest}}};
  return view === 'slides' && order?.length ? {...next, rows: {...next.rows, [id]: [...new Set(order)]}} : next;
}
export const renameLine = (edits, id, title) => { const L = edits.lines ?? NO_LINES; return {...edits, lines: {...L, titles: {...L.titles, [id]: String(title).slice(0, 120)}}}; };
// The line leaves the board (delete its frames too, for the Trash).
export const hideLine = (edits, id) => { const L = edits.lines ?? NO_LINES; return {...edits, lines: {...L, deleted: [...new Set([...L.deleted, id])]}}; };
// A copy of a line right after it ("<title> copy"): a copy of each of its frames (`frames`, in
// board order), with their changes and notes. -> {id, ids, edits}
export function duplicateLine(edits, line, frames) {
  const made = addLine(edits, {after: line.id, title: `${line.title} copy`});
  let next = made.edits;
  const ids = [];
  for (const f of frames) {
    const r = addCopy(next, {from: f.id, after: f.id, inherit: f.id});
    next = r.edits;
    const note = edits.frames[f.id]?.note;
    if (note) next = setNote(next, r.id, note);
    ids.push(r.id);
  }
  const rows = Object.fromEntries(Object.entries(next.rows).map(([row, list]) => [row, list.filter(id => !ids.includes(id))]));
  let out = {...next, rows: {...rows, [made.id]: ids}};
  const was = (edits.lines ?? NO_LINES).added[line.id], copyOf = Object.fromEntries(frames.map((f, i) => [f.id, ids[i]]));
  if (was?.videos?.length) { // a line of videos is copied as one: the copies of the slides are the slides of its videos
    out = setLineVideos(out, made.id, was.videos.map(v => ({...v, ids: v.ids.map(id => copyOf[id]).filter(Boolean)})));
    if (was.view === 'slides') out = setLineView(out, made.id, 'slides');
  }
  return {id: made.id, ids, edits: out};
}

// Frames put at the end of a line (pasted onto a line picked by its label), taken out of the others.
export function intoLine(edits, ids, line) {
  const rows = Object.fromEntries(Object.entries(edits.rows ?? {}).map(([row, list]) => [row, list.filter(id => !ids.includes(id))]));
  return {...edits, rows: {...rows, [line]: [...(rows[line] ?? []), ...ids]}};
}

// A frame with nothing in it: its assets are the ones brought in (Shift+A).
const blankFrame = id => ({id, kind: 'blank', label: 'Blank frame', time: null, bubble: null, thumb: null, scene: {id: null, view: null}, layers: [], isBlank: true});

// The captured frames in order, each followed by its copies (the newest right after
// it), a copy's own copies after it. A copy sits in the row of the frame it follows.
function defaultOrder(base, edits) {
  const byId = Object.fromEntries(base.map(f => [f.id, f]));
  const children = {};
  for (const [id, c] of Object.entries(edits.copies)) (children[c.after] ??= []).push(id);
  const out = [];
  const follow = (parent, chapter) => {
    for (const id of [...(children[parent] ?? [])].reverse()) {
      const from = edits.copies[id].from, source = from === null ? blankFrame(id) : byId[from];
      if (!source) continue;
      out.push({...source, id, chapter, copyOf: from === null ? null : source.id, isCopy: true});
      follow(id, chapter);
    }
  };
  const gone = new Set(edits.deleted ?? []); // not on the board, but the duplicates made from one still follow where it was
  for (const frame of base) { if (!gone.has(frame.id)) out.push(frame); follow(frame.id, frame.chapter); }
  // frames put straight into a line (an empty one): at its end
  const shown = new Set(out.map(f => f.id));
  for (const [id, c] of Object.entries(edits.copies)) {
    if (shown.has(id) || !c.row) continue;
    const source = c.from === null ? blankFrame(id) : byId[c.from];
    if (!source) continue;
    out.push({...source, id, chapter: c.row, copyOf: c.from === null ? null : source.id, isCopy: true});
    follow(id, c.row);
  }
  return out;
}

// The board's frames, row by row: the order you gave them (edits.rows), else the
// default. A frame you moved sits in the row you put it in. `lines`: the board's lines in
// order (linesOf); a frame in no line on the board (a deleted one) is not on it.
export function orderedFrames(base, edits, lines = null) {
  const def = defaultOrder(base, edits);
  const chapters = lines ?? [...new Set([...base.map(f => f.chapter), ...def.map(f => f.chapter)])];
  if (!Object.keys(edits.rows ?? {}).length) return lines ? def.filter(f => chapters.includes(f.chapter)) : def;
  const byId = Object.fromEntries(def.map(f => [f.id, f]));
  const lists = {}, seen = new Set();
  for (const chapter of chapters) {
    lists[chapter] = [];
    for (const id of edits.rows[chapter] ?? []) if (byId[id] && !seen.has(id)) { seen.add(id); lists[chapter].push(id); }
  }
  for (const f of def) if (!seen.has(f.id)) { seen.add(f.id); (lists[f.chapter] ??= []).push(f.id); } // not in the order you gave: at the end of its own row
  return chapters.flatMap(chapter => (lists[chapter] ?? []).map(id => ({...byId[id], chapter})));
}

// `frames` (in board order) with `id` moved into row `chapter`, so that it is the
// `index`-th there (0 = first). The moved frame belongs to that row from now on.
// `id` may be several ids (frames picked together): they go in side by side, in the
// order they have on the board, and `index` counts the frames that stay (not the ones moved).
export function moveInList(frames, id, chapter, index) {
  const ids = new Set(Array.isArray(id) ? id : [id]), moving = frames.filter(f => ids.has(f.id));
  if (!moving.length) return frames;
  const rest = frames.filter(f => !ids.has(f.id)), row = rest.filter(f => f.chapter === chapter);
  const moved = moving.map(f => ({...f, chapter})), at = Math.max(0, Math.min(index, row.length));
  if (row[at]) { const i = rest.indexOf(row[at]); return [...rest.slice(0, i), ...moved, ...rest.slice(i)]; }
  if (row.length) { const i = rest.indexOf(row.at(-1)); return [...rest.slice(0, i + 1), ...moved, ...rest.slice(i + 1)]; }
  return [...rest, ...moved];
}
// The order of every row as it is now.
export function rowsOf(frames) {
  const rows = {};
  for (const f of frames) (rows[f.chapter] ??= []).push(f.id);
  return rows;
}
// Move a frame to a place in a row: the whole order is kept from then on. The note
// and everything else about the frame travel with it (they are kept by its id). No
// change in the order: the same edits back. `followers` ({frameId: [frameId]}, lib/storyboardCells.mjs): frames that are not in `frames` (the other slides of a
// video, which is on the board by its first slide only) and stay right after the frame they follow, wherever it goes: the order kept has them.
export function moveFrame(edits, frames, id, chapter, index, followers = null) {
  const before = rowsOf(frames), after = rowsOf(moveInList(frames, id, chapter, index));
  for (const row of Object.keys(before)) after[row] ??= [];
  const same = Object.keys(after).every(row => (after[row] ?? []).join('\n') === (before[row] ?? []).join('\n'));
  if (same) return edits;
  const rows = followers ? Object.fromEntries(Object.entries(after).map(([row, ids]) => [row, ids.flatMap(x => [x, ...(followers[x] ?? [])])])) : after;
  return {...edits, rows};
}

// ---- Files and the browser --------------------------------------------------------
const pair = v => Array.isArray(v) && v.length === 2 && v.every(n => Number.isFinite(n)) ? [round(v[0]), round(v[1])] : null;
const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const box = v => (v && typeof v === 'object' ? Object.fromEntries(['x', 'y', 'w', 'h'].map(k => [k, Number.isFinite(v[k]) ? v[k] : 0])) : undefined);
function cleanLayer(l) {
  if (!l || typeof l !== 'object' || typeof l.key !== 'string' || typeof l.asset !== 'string' || !['dom', 'bubble'].includes(l.kind)) return null;
  const out = {key: text(l.key, 120), name: text(l.name, 80) || 'Layer', kind: l.kind, asset: text(l.asset, 40), box: box(l.box)};
  if (Number.isFinite(l.z)) out.z = l.z; // its stacking order
  // (`link`, what an older copy was a duplicate of, is dropped: nothing is linked since 2026-11-09)
  if (l.inner === true) out.inner = true;
  if (l.kind === 'bubble') {
    out.style = text(l.style, 20) || 'yellow'; out.tip = pair(l.tip); if (['tail', 'empty', 'words'].includes(l.mode)) out.mode = l.mode;
    for (const k of ['reach', 'tailOpacity']) if (Number.isFinite(l[k]) && l[k] >= 0 && l[k] < 1) out[k] = l[k]; // a tail on its way out, or fading
  }
  return out;
}

// A frame in the Trash: where it came from, and the look its stage had (its assets are in frames[id]).
function cleanTrash(t) {
  if (!t || typeof t !== 'object' || typeof t.id !== 'string' || !t.id || t.id.length > 200 || typeof t.video !== 'string' || !t.video) return null;
  const look = t.look && typeof t.look === 'object' ? t.look : {}, scene = look.scene && typeof look.scene === 'object' ? look.scene : {};
  return {
    id: t.id, video: text(t.video, 60), videoName: text(t.videoName, 80) || text(t.video, 60), chapter: text(t.chapter, 80), chapterTitle: text(t.chapterTitle, 120),
    label: text(t.label, 120) || 'Frame', time: Number.isFinite(t.time) ? t.time : null, from: text(t.from, 200), deletedAt: text(t.deletedAt, 40) || now(),
    look: {shell: text(look.shell, 200), stageClass: text(look.stageClass, 200), stageStyle: text(look.stageStyle, 1000), scene: {id: text(scene.id, 60) || null, view: text(scene.view, 60) || null}},
  };
}

// Edits from a file or the browser: keep what is well formed, drop the rest.
export function normalizeEdits(raw) {
  const out = {version: 1, frames: {}, copies: {}, rows: {}, library: {}, deleted: [], trash: [], lines: {added: {}, titles: {}, deleted: []}};
  if (!raw || typeof raw !== 'object') return out;
  const lines = raw.lines && typeof raw.lines === 'object' ? raw.lines : {};
  for (const [id, l] of Object.entries(lines.added && typeof lines.added === 'object' ? lines.added : {})) if (id.length < 80 && l && typeof l === 'object') { const videos = Array.isArray(l.videos) ? l.videos.map(cleanVideo).filter(Boolean).slice(0, 200) : [], shelf = cleanShelf(l.shelf); out.lines.added[id] = {title: text(l.title, 120) || 'New line', after: typeof l.after === 'string' ? text(l.after, 120) : null, ...(videos.length ? {videos} : {}), ...(shelf.length ? {shelf} : {}), ...(videos.length && l.view === 'slides' ? {view: 'slides'} : {})}; }
  for (const [id, title] of Object.entries(lines.titles && typeof lines.titles === 'object' ? lines.titles : {})) if (id.length < 120 && typeof title === 'string') out.lines.titles[id] = title.slice(0, 120);
  if (Array.isArray(lines.deleted)) out.lines.deleted = [...new Set(lines.deleted.filter(i => typeof i === 'string' && i.length < 120))];
  if (Array.isArray(lines.order)) { const order = [...new Set(lines.order.filter(i => typeof i === 'string' && i.length < 120))].slice(0, 500); if (order.length) out.lines.order = order; }
  if (Array.isArray(raw.deleted)) out.deleted = [...new Set(raw.deleted.filter(i => typeof i === 'string' && i.length < 200))].slice(0, 500);
  if (Array.isArray(raw.trash)) { const seen = new Set(); for (const t of raw.trash) { const kept = cleanTrash(t); if (kept && !seen.has(kept.id) && seen.size < 1000) { seen.add(kept.id); out.trash.push(kept); } } }
  for (const [row, ids] of Object.entries(raw.rows && typeof raw.rows === 'object' && !Array.isArray(raw.rows) ? raw.rows : {})) if (row.length < 100 && Array.isArray(ids)) out.rows[row] = [...new Set(ids.filter(i => typeof i === 'string' && i.length < 200))].slice(0, 500);
  for (const [id, c] of Object.entries(raw.copies && typeof raw.copies === 'object' && !Array.isArray(raw.copies) ? raw.copies : {})) {
    if (id.length >= 200 || !c || !(typeof c.from === 'string' || c.from === null) || !(typeof c.after === 'string' || (c.after === null && typeof c.row === 'string'))) continue;
    out.copies[id] = {from: c.from, after: c.after, ...(typeof c.row === 'string' ? {row: text(c.row, 120)} : {})};
  }
  let size = 0;
  for (const [hash, html] of Object.entries(raw.library && typeof raw.library === 'object' ? raw.library : {})) if (hash.length < 60 && typeof html === 'string' && html.length < 3e6 && (size += html.length) < 12e6) out.library[hash] = html;
  const frames = raw.frames;
  if (frames && typeof frames === 'object' && !Array.isArray(frames)) {
    for (const [id, r] of Object.entries(frames)) {
      if (id.length > 200 || !r || typeof r !== 'object') continue;
      const rec = {};
      if (typeof r.note === 'string' && r.note.trim()) rec.note = r.note.slice(0, 20000);
      if (typeof r.name === 'string' && r.name.trim()) rec.name = r.name.replace(/\s+/g, ' ').trim().slice(0, 120);
      if (r.moves && typeof r.moves === 'object') { const moves = {}; for (const [k, v] of Object.entries(r.moves)) if (k.length < 200 && pair(v)) moves[k] = pair(v); if (Object.keys(moves).length) rec.moves = moves; }
      if (r.texts && typeof r.texts === 'object') { const texts = {}; for (const [k, v] of Object.entries(r.texts)) if (k.length < 200 && typeof v === 'string') texts[k] = v.slice(0, 5000); if (Object.keys(texts).length) rec.texts = texts; }
      const tips = {};
      if (r.tips && typeof r.tips === 'object') for (const [k, v] of Object.entries(r.tips)) if (k.length < 200 && pair(v)) tips[k] = pair(v);
      if (pair(r.tip) && !tips.bubble) tips.bubble = pair(r.tip); // the old single tail point
      if (Object.keys(tips).length) rec.tips = tips;
      for (const kind of ['scales', 'sizes']) {
        const kept = {};
        const fits = v => (kind === 'scales' ? v.every(n => n > 0) : v.every(n => n >= 0) && v[0] + v[1] > 0); // (a size's 0: as big as its content)
        if (r[kind] && typeof r[kind] === 'object') for (const [k, v] of Object.entries(r[kind])) if (k.length < 200 && Array.isArray(v) && v.length === 2 && v.every(n => Number.isFinite(n)) && fits(v)) kept[k] = kind === 'scales' ? [fine(v[0]), fine(v[1])] : [round(v[0]), round(v[1])];
        if (Object.keys(kept).length) rec[kind] = kept;
      }
      if (r.anims && typeof r.anims === 'object') {
        const anims = {};
        for (const [k, a] of Object.entries(r.anims)) { const clean = k.length < 200 ? cleanAnim(a) : null; if (clean) anims[k] = clean; }
        if (Object.keys(anims).length) rec.anims = anims;
      }
      if (r.bubbles && typeof r.bubbles === 'object') {
        const bubbles = {};
        for (const [k, b] of Object.entries(r.bubbles)) { if (k.length >= 200 || !b || typeof b !== 'object') continue; const own = {}; if (b.tail === false) own.tail = false; if (typeof b.words === 'boolean') own.words = b.words; if (Object.keys(own).length) bubbles[k] = own; }
        if (Object.keys(bubbles).length) rec.bubbles = bubbles;
      }
      if (r.locks && typeof r.locks === 'object') { const locks = Object.fromEntries(Object.entries(r.locks).filter(([k, v]) => k.length < 200 && LOCKS.includes(v))); if (Object.keys(locks).length) rec.locks = locks; }
      if (Array.isArray(r.unique)) { const unique = [...new Set(r.unique.filter(k => typeof k === 'string' && k.length < 120))]; if (unique.length) rec.unique = unique; }
      if (Array.isArray(r.hidden)) { const hidden = r.hidden.filter(k => typeof k === 'string' && k.length < 120); if (hidden.length) rec.hidden = hidden; }
      if (Array.isArray(r.inserts)) { const inserts = r.inserts.map(cleanLayer).filter(Boolean); if (inserts.length) rec.inserts = inserts; }
      { const background = normalizePaint(r.background); if (background) rec.background = background; }
      if (Array.isArray(r.order)) { const order = [...new Set(r.order.filter(k => typeof k === 'string' && k.length < 120))]; if (order.length) rec.order = order; }
      if (r.styles && typeof r.styles === 'object') {
        const styles = {};
        for (const [k, s] of Object.entries(r.styles)) {
          if (k.length >= 200 || !s || typeof s !== 'object') continue;
          const own = Object.fromEntries(Object.entries(s).map(([name, v]) => [name, styleValue(name, v)]).filter(([, v]) => v != null));
          if (Object.keys(own).length) styles[k] = own;
        }
        if (Object.keys(styles).length) rec.styles = styles;
      }
      if (r.vtext && typeof r.vtext === 'object') {
        const vtext = {};
        for (const [k, v] of Object.entries(r.vtext)) { if (k.length >= 200) continue; const own = cleanVideoText(v); if (Object.keys(own).length) vtext[k] = own; }
        if (Object.keys(vtext).length) rec.vtext = vtext;
      }
      if (r.vmove && typeof r.vmove === 'object' && !Array.isArray(r.vmove)) {
        const vmove = {};
        for (const [k, v] of Object.entries(r.vmove)) { const d = k.length < 200 ? pair(v) : null; if (d && Math.abs(d[0]) < 10000 && Math.abs(d[1]) < 10000) vmove[k] = d; }
        if (Object.keys(vmove).length) rec.vmove = vmove;
      }
      if (r.vscale && typeof r.vscale === 'object' && !Array.isArray(r.vscale)) {
        const vscale = {};
        for (const [k, v] of Object.entries(r.vscale)) if (k.length < 200 && Array.isArray(v) && v.length === 2 && v.every(n => Number.isFinite(n) && n > 0.01 && n < 100)) vscale[k] = [fine(v[0]), fine(v[1])];
        if (Object.keys(vscale).length) rec.vscale = vscale;
      }
      if (r.ownLooks && typeof r.ownLooks === 'object' && !Array.isArray(r.ownLooks)) { // (a part's own look, made unique: its kind is told by its key, or by what it holds)
        const ownLooks = {};
        for (const [k, v] of Object.entries(r.ownLooks)) { if (k.length >= 200 || !v || typeof v !== 'object') continue; const own = k === 'kind:words' ? cleanShared(v) : Object.fromEntries(['fill', 'stroke', 'strokeWidth', 'arrow', 'hide'].map(name => [name, lookValue(name, v[name])]).filter(([, x]) => x != null)); if (Object.keys(own).length) ownLooks[k] = own; }
        if (Object.keys(ownLooks).length) rec.ownLooks = ownLooks;
      }
      if (Object.keys(rec).length) out.frames[id] = {...rec, updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now()};
    }
  }
  if (raw.videoText && typeof raw.videoText === 'object') {
    for (const kind of VIDEO_TEXT_KINDS) {
      const clean = cleanShared(raw.videoText[kind]);
      if (Object.keys(clean).length) out.videoText = {...(out.videoText ?? {}), [kind]: {...clean, at: typeof raw.videoText[kind]?.at === 'string' ? raw.videoText[kind].at : now()}};
    }
  }
  { const looks = raw.looks && typeof raw.looks === 'object' ? cleanLooks(raw.looks) : null; if (looks) out.looks = looks; }
  if (raw.captions && typeof raw.captions === 'object' && !Array.isArray(raw.captions)) {
    for (const [run, beats] of Object.entries(raw.captions)) {
      if (run.length >= 80 || !beats || typeof beats !== 'object') continue;
      const own = {};
      for (const [beat, words] of Object.entries(beats)) { const clean = typeof words === 'string' ? words.replace(/\s+/g, ' ').trim().slice(0, 400) : ''; if (beat.length < 80 && clean) own[beat] = clean; }
      if (Object.keys(own).length) out.captions = {...(out.captions ?? {}), [run]: own};
    }
  }
  { const layers = cleanVideoLayers(raw.layers); if (layers) out.layers = layers; }
  { const comments = cleanVideoComments(raw.comments); if (comments) out.comments = comments; }
  { const refs = cleanRefs(raw.refs); if (refs) out.refs = refs; } // (the files put on the canvas: lib/storyboardRefs.mjs)
  { const variations = cleanVariations(raw.variations); if (variations) out.variations = variations; } // (the board's videos played another way: lib/storyboardVariations.mjs)
  { const cuts = cleanCuts(raw.cuts); if (cuts) out.cuts = cuts; } // (the words retyped in a Remotion cut: lib/remotion/cutWords.mjs)
  if (raw.speed && typeof raw.speed === 'object' && !Array.isArray(raw.speed)) { // (a video's speed: letters a second, seconds a scene)
    for (const [title, s] of Object.entries(raw.speed)) {
      if (title.length >= 120 || !s || typeof s !== 'object') continue;
      const own = {};
      for (const name of Object.keys(SPEED)) { const v = cleanSpeed(name, s[name]); if (v != null) own[name] = v; }
      if (Object.keys(own).length) out.speed = {...(out.speed ?? {}), [title]: {...own, at: typeof s.at === 'string' ? s.at : now()}};
    }
  }
  return prune(out);
}

// Two copies (the saved file, this browser): per frame the newest edit wins and
// nothing written in only one of them is lost. `changed`: the result holds
// something `base` did not.
export function mergeEdits(base, other) {
  const frames = {...base.frames}, copies = {...base.copies}, library = {...base.library};
  let changed = false, rows = base.rows ?? {};
  if (!Object.keys(rows).length && Object.keys(other?.rows ?? {}).length) { rows = other.rows; changed = true; }
  for (const [id, r] of Object.entries(other?.frames ?? {})) {
    if (!frames[id] || String(r.updatedAt ?? '') > String(frames[id].updatedAt ?? '')) { frames[id] = r; changed = true; }
  }
  for (const [id, c] of Object.entries(other?.copies ?? {})) if (!(id in copies)) { copies[id] = c; changed = true; }
  for (const [hash, html] of Object.entries(other?.library ?? {})) if (!(hash in library)) { library[hash] = html; changed = true; }
  const deleted = [...(base.deleted ?? [])], trash = [...(base.trash ?? [])], inTrash = new Set(trash.map(t => t.id));
  for (const id of other?.deleted ?? []) if (!deleted.includes(id)) { deleted.push(id); changed = true; }
  for (const t of other?.trash ?? []) if (!inTrash.has(t.id)) { trash.push(t); changed = true; }
  const bl = base.lines ?? NO_LINES, ol = other?.lines ?? NO_LINES, lines = {added: {...bl.added}, titles: {...bl.titles}, deleted: [...bl.deleted]};
  if (bl.order) lines.order = bl.order; else if (ol.order) { lines.order = ol.order; changed = true; }
  for (const [id, l] of Object.entries(ol.added)) if (!(id in lines.added)) { lines.added[id] = l; changed = true; }
  for (const [id, t] of Object.entries(ol.titles)) if (!(id in lines.titles)) { lines.titles[id] = t; changed = true; }
  for (const id of ol.deleted) if (!lines.deleted.includes(id)) { lines.deleted.push(id); changed = true; }
  let videoText = base.videoText;
  for (const kind of VIDEO_TEXT_KINDS) { // (the look of all the texts of a kind: the newer one wins)
    const theirs = other?.videoText?.[kind], mine = videoText?.[kind];
    if (theirs && (!mine || String(theirs.at ?? '') > String(mine.at ?? ''))) { videoText = {...(videoText ?? {}), [kind]: theirs}; changed = true; }
  }
  let looks = base.looks;
  for (const kind of Object.keys(LOOK_KINDS)) { // (the shared look of a kind: the newer one wins)
    const theirs = other?.looks?.[kind], mine = looks?.[kind];
    if (theirs && (!mine || String(theirs.at ?? '') > String(mine.at ?? ''))) { looks = {...(looks ?? {}), [kind]: theirs}; changed = true; }
  }
  for (const [name, theirs] of Object.entries(other?.looks?.layers ?? {})) { // (an element's shared look, by its name: the newer one wins)
    const mine = looks?.layers?.[name];
    if (!mine || String(theirs.at ?? '') > String(mine.at ?? '')) { looks = {...(looks ?? {}), layers: {...(looks?.layers ?? {}), [name]: theirs}}; changed = true; }
  }
  let captions = base.captions;
  for (const [run, beats] of Object.entries(other?.captions ?? {})) for (const [beat, words] of Object.entries(beats)) { if (captions?.[run]?.[beat] == null) { captions = {...(captions ?? {}), [run]: {...(captions?.[run] ?? {}), [beat]: words}}; changed = true; } } // (what is only in the other copy is kept; where both have words, the file's are)
  const {layers, changed: layersChanged} = mergeVideoLayers(base.layers, other?.layers); // (a video's layers: the newer list wins)
  if (layersChanged) changed = true;
  const {comments, changed: commentsChanged} = mergeVideoComments(base.comments, other?.comments); // (a video's comments: the newer list wins)
  if (commentsChanged) changed = true;
  const {refs, changed: refsChanged} = mergeRefs(base.refs, other?.refs); // (the files on the canvas: the newer list wins)
  if (refsChanged) changed = true;
  const {variations, changed: variationsChanged} = mergeVariations(base.variations, other?.variations); // (the board's variations: the newer one wins)
  if (variationsChanged) changed = true;
  const {cuts, changed: cutsChanged} = mergeCuts(base.cuts, other?.cuts); // (the words of a Remotion cut: the newer copy wins)
  if (cutsChanged) changed = true;
  let speed = base.speed;
  for (const [title, theirs] of Object.entries(other?.speed ?? {})) { // (a video's speed: the newer one wins)
    const mine = speed?.[title];
    if (!mine || String(theirs.at ?? '') > String(mine.at ?? '')) { speed = {...(speed ?? {}), [title]: theirs}; changed = true; }
  }
  return {edits: {version: 1, frames, copies, rows, library, deleted, trash, lines, ...(videoText ? {videoText} : {}), ...(looks ? {looks} : {}), ...(captions ? {captions} : {}), ...(layers ? {layers} : {}), ...(comments ? {comments} : {}), ...(refs ? {refs} : {}), ...(variations ? {variations} : {}), ...(cuts ? {cuts} : {}), ...(speed ? {speed} : {})}, changed};
}

// ---- Export / import: the whole storyboard in one file, editable ------------------
// { mark, version, exportedAt, boards: { <board id>: edits } } (the boards: the videos and the Trash).
export const EXPORT_MARK = 'taskmaverick-storyboard-export';
export const makeExport = (boards, at = now()) => ({mark: EXPORT_MARK, version: 1, exportedAt: at, boards});
// The boards an export holds, among the `known` ones, each cleaned: [[id, edits]] ([] when it is not an export).
export function readExport(data, known) {
  if (!data || data.mark !== EXPORT_MARK || !data.boards || typeof data.boards !== 'object' || Array.isArray(data.boards)) return [];
  return Object.entries(data.boards).filter(([id]) => known.includes(id)).map(([id, raw]) => [id, normalizeEdits(raw)]);
}

// ---- Undo / redo ---------------------------------------------------------------
// Each change is a step; typing in the same place within `window` ms is one step.
export const createHistory = present => ({past: [], present, future: [], last: null});
export function record(history, next, {merge = null, at = Date.now(), window = 900} = {}) {
  if (next === history.present) return history;
  const joins = merge && history.last && history.last.merge === merge && at - history.last.at < window;
  return {past: joins ? history.past : [...history.past, history.present].slice(-200), present: next, future: [], last: {merge, at}};
}
export const undo = h => h.past.length ? {past: h.past.slice(0, -1), present: h.past.at(-1), future: [h.present, ...h.future], last: null} : h;
export const redo = h => h.future.length ? {past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1), last: null} : h;
