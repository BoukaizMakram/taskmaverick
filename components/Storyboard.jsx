'use client';
// Storyboard (/storyboard): the video as a board of frames, one per action, to
// plan it on. It works like Figma: an endless canvas (scroll to pan, Ctrl/⌘ +
// scroll or pinch to zoom, Space + drag or the hand tool to pan, Shift+1 fits
// everything, Shift+2 the selection), every frame numbered above with a notes box
// under it, and every asset in a frame can be moved (drag; double-click goes
// into a group; arrow keys nudge), scaled by its handles (a UI element keeps its
// proportions; the chat bubble, the spotlight and a picture can be stretched) and
// its words retyped (double-click; the font stays as it is). Any text can be retyped
// (Tab goes to the next text; the handles stay on while you type, to change its size).
// Click again at the same place and it goes to the layer under, one by one, then round
// again (not a double-click). Shift+click picks several assets, in any frames; a rectangle
// drawn on a frame's background picks the assets it touches. Frames picked together are
// carried together (by their number bar). Ctrl/⌘+C / X / V copy, cut and paste the
// picked assets or frames, onto any frame of any board (the other video's too); a picture is pasted from the clipboard or dropped on a frame;
// Alt+drag pulls a duplicate out of an asset, into its frame or another one. Nothing
// is linked (the user, 2026-11-09): every frame's assets and words are its own, a copy
// is a thing of its own from the moment it is made, and only Apply to all in this row /
// Delete in the whole row (pressed) reach the other frames; a chat bubble's handles resize its box (its words keep their size; with the Scale tool, K, the words scale with it). The pencil (P)
// draws on a frame, in the color of the wheel in the inspector (Alt+click picks one
// from the board); each stroke is an asset.
// Ctrl/⌘+D duplicates a frame, Delete takes an asset out of
// a frame (or deletes the frame: it goes to the Trash, a board of its own where it can be
// copied and pasted back on a storyboard), and Shift+A opens a plain search of the product's
// UI elements (Alert, Timer, Tablet, Hand...) and adds the one you pick to the
// frame, alone. The frames are made by scripts/capture-storyboard.mjs from the demo
// itself; what you change is kept apart (content/storyboard/<video>.json through
// /api/storyboard in local development, and in this browser).
// The sidebar at the right is the inspector, like Figma's design panel (what is picked: its
// position, size, look and text; a frame; a line; else the board: export, import, backups). The
// lines (rows) are added, renamed, duplicated and deleted from their green label. What is saved has
// a revision: the command line (scripts/storyboard.mjs, docs/storyboard.md) edits the same file and
// an open page takes it within seconds, merged with what is not saved here yet.
//
// Panning and zooming move the board directly (no React render per wheel tick);
// the page catches up when the movement settles.
import {memo, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {TextFields} from './StoryboardTextEditor';
import StoryboardPlayer from './StoryboardPlayer';
import StoryboardVideoEditor from './StoryboardVideoEditor';
import StoryboardAllVideos from './StoryboardAllVideos';
import {ALL_VIDEOS, ALL_VIDEOS_GROUP, ALL_VIDEOS_NAME} from '@/lib/storyboardAllVideos.mjs';
import {ALL_STORYBOARDS, ALL_STORYBOARDS_NAME, ONLY_BOARDS} from '@/lib/storyboardAllStoryboards.mjs';
import CommentPanel from './StoryboardCommentPanel';
import {addVideoComment, commentNumber, commentsOf as videoCommentsOf, newCommentId, removeVideoComment, updateVideoComment} from '@/lib/storyboardComments.mjs';
import {ExportMenuItem, ExportSection} from './StoryboardExport';
import {profileOf, runsOf, shelvedRuns} from '@/lib/storyboardVideos.mjs';
import {SPEED, setLineShelf, setVideoSpeed, videoSpeedOf, applyAlongRow, hideAlongRow} from '@/lib/storyboardEdits.mjs';
import {BOARD_GROUPS, SECTION_BOARDS} from '@/lib/sections/index.mjs';
import {cellsOf, duplicateVideo, expandLine, followersOf, slidesOrder, withSlides} from '@/lib/storyboardCells.mjs';
import {FRAME, LAYOUT, clampZoom, fitRect, gapAt, glideZoom, intersects, dropTarget, keepView, lineDropIndex, layoutFrames, layoutGaps, panBy, parseView, restoreView, stepZoom, toWorld, union, viewBetween, viewKey, visibleWorld, wheelAction, zoomAt} from '@/lib/storyboardView.mjs';
import {SNAP_REACH, snapBox, snapTargets} from '@/lib/storyboardSnap.mjs';
import {setLayerLook, layerLookOf, unhideLayer, setVideoScale, videoScaleOf, setVideoMove, videoMoveOf} from '@/lib/storyboardEdits.mjs';
import {BLEND_MODES, EFFECTS, EFFECT_TYPES, KIND_LABEL, LABELS, addEffect, addVideoLayer, fxProp, isAnimated as layerAnimated, keyTimes as layerKeyTimes, layersOf as videoLayersOf, moveEffect, newLayerId, orderVideoLayers, patchEffect, removeEffect, removeKeyAt as removeLayerKey, removeVideoLayer, setAnimated as setLayerAnimated, setKeyEase, setLayerAt, setSpan, spansOf, splitVideoLayer, stackVideoLayer, updateVideoLayer, valueAt as layerValueAt} from '@/lib/storyboardLayers.mjs';
import {BACKGROUND, setOwnLook, setSharedLook, setSharedLooks, sharedLookOf, setVideoTextAll, videoTextKindOf, EMPTY, FONTS, ANIM_CPS, animOf, animSeconds, animCps, hasAnim, setAnim, scaledLineHeight, addBlank, addBlankIn, addCopy, addInserts, addLine, createHistory, deleteFrame, duplicateLine, hasChanges, hideLayer, hideLine, intoLine, isEdited, lockOf, makeExport, readExport, setLock, setBubble, bubbleOf, layersOf, linesOf as boardLines, mergeEdits, moveFrame, moveInList, moveLayers, moveLine, noteOf, normalizeEdits, setBackground, backgroundOf, orderedFrames, record, redo, removeInsert, renameLine, resetAsset, resetFrame, setMove, setName, setNote, setLineView, setInsertHtml, setScale, setSize as setBoxSize, setStyle, setText, setTip, setCaption, setVideoText, setVideoTextKind, styleOf, undo} from '@/lib/storyboardEdits.mjs';
import {TRASH, addToTrash, removeFromTrash, trashEntry, trashVideo} from '@/lib/storyboardTrash.mjs';
import {groupParts, hashString, partInsert, partList, searchParts} from '@/lib/storyboardParts.mjs';
import {PEN, PEN_WIDTHS, inkOf, normalizeHex, restyleInk, strokeInsert} from '@/lib/storyboardDraw.mjs';
import {CAPS, CAP_NAMES, DASHES, LINE_CAPS, LINE_JOINS, refitPath, reversePoints, setSmooth} from '@/lib/storyboardPaths.mjs';
import {ColorField, ColorWheel, EffectRow, IconButtons, LockButton, NumField, PaintField, PanelIcon, Section, SelectField, TextField, ToolButton, solidHex} from './StoryboardPanel';
import {isGradient, paintFromCss} from '@/lib/storyboardPaint.mjs';
import {RECT_FILL, rectFrom, rectInsert} from '@/lib/storyboardShapes.mjs';
import {contentFactor, scaledBox, scaledStyles} from '@/lib/storyboardScale.mjs';
import {copyFrames, copyLayers, copyPicks, isClip, layerKeyOf, pasteFrames, pasteLayers} from '@/lib/storyboardClipboard.mjs';
import {addPick, framesOfPicks, groupPicks, hasPick, isBackdrop, nextLayer, picksOf, rectOf, removePick, sameSpot, samePicks} from '@/lib/storyboardPick.mjs';
import {linkOf, linkedLayers} from '@/lib/storyboardLinks.mjs';
import {imageInsert, isImage} from '@/lib/storyboardImages.mjs';
import StoryboardRefs, {makeRefs} from './StoryboardRefs';
import {addRefs, changeRef, refBoxes, refsOf, removeRef} from '@/lib/storyboardRefs.mjs';
import {writeWords} from './storyboardHandwriting';
import {cacheGet, cachePut} from './storyboardCache';
import {lookKindOfRoot, STAGE, applyEdits, blackPlate, assetsIn, boxOf, bubbleBoxOf, bubblePad, chainOf, colorAt, drawShape, drawShapes, editTargetAt, editTargetOf, elementOf, frameHtml, guidesOf, narrowPanel, hitAt, isBubble, isFixed, isWords, keyOf, layersAt, placeTimelines, linesOf, lookOf, whenFontsLoaded, moveTo, nameOf, parentScale, parseStyle, resizeKind, scaleOf, scaleTo, screenRectOf, setLines, setTextNumbers, sizeOf, sizeTo, stageBoxOf, stageOf, tailOff, tipToMiddle, targetKey, targetOf, textKeysOf, tipOf, translateOf, unitOf} from './storyboardDom';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';
import './ImprovedQualityV2Demo.css';
import './LiveOversightDemo.css';
import './sections/sections.css';
import './sections/sectionStyles';
import './TicketCard.css';// (the alert ticket's look: the captured sections' tickets are plain HTML here)
import './EfficiencyV2Demo.css';
import './ReferenceBoard.css';
import './CaptionBubbles.css';
import './DemoHand.css';
import './web/web.css';// the web app's pieces (Shift+A > Web app) need its own rules, e.g. a mission's 16px logo
import './remotion/CutParts.css';     // the Remotion cuts' pieces, on the board All storyboards (scripts/capture-cuts.mjs)
import './remotion/EfficiencyCut.css';
import './remotion/EfficiencyRedo.css'; // (the cut redone from the storyboard, if a row is made from it: capture-cuts --layout storyboard)
import './Storyboard.css';

const VIDEOS = [{id: 'improved-quality-v2', name: 'Improved Quality'}, {id: 'increased-efficiency-v2', name: 'Increased Efficiency (previous)'}, ...SECTION_BOARDS]; // (the sections of the website: lib/sections/index.mjs)
const BOARDS = [...VIDEOS, {id: TRASH, name: 'Trash'}];
// The board menu (the user, 2026-10-20: "add the name of each section in the dropdown like Risk then indent and show subtitles"): the boards under their group's name (Operations, Training,
// Risk, Knowledge: BOARD_GROUPS, the narration's order), then the rest (the Trash). A section still being built (`draft`) is in it too, marked "(in progress)" (the user, 2026-10-20:
// "I wanna see other section even if not finished, just show where we are so far"). The group on top is "All videos" (the user, 2026-10-29): the one page of videos, the lines "Videos" stitched
// (components/StoryboardAllVideos.jsx; it has no board of its own, so it is not in BOARDS: the shared looks are not copied to a file for it).
const menuOf = () => {
  // For now only All videos and All storyboards (the user, 2026-11-06: "hide all the other pages of storyboards ... keep just all videos and all storyboards"; lib/storyboardAllStoryboards.mjs
  // ONLY_BOARDS; the other boards are still there, by their address)
  if (ONLY_BOARDS) return {groups: [{name: ALL_VIDEOS_GROUP, boards: [{id: ALL_VIDEOS, name: ALL_VIDEOS_NAME}, {id: ALL_STORYBOARDS, name: ALL_STORYBOARDS_NAME}]}], rest: []};
  const named = new Map(BOARDS.map(b => [b.id, b.draft ? {...b, name: `${b.name} (in progress)`} : b])), grouped = new Set(BOARD_GROUPS.flatMap(g => g.boards));
  return {groups: [{name: ALL_VIDEOS_GROUP, boards: [{id: ALL_VIDEOS, name: ALL_VIDEOS_NAME}]}, ...BOARD_GROUPS.map(g => ({name: g.name, boards: g.boards.map(id => named.get(id)).filter(Boolean)})).filter(g => g.boards.length)], rest: BOARDS.filter(b => !grouped.has(b.id))};
};
// The Trash has no captured frames: its rows and frames come from what was deleted (trashVideo).
const TRASH_VIDEO = {version: 1, video: TRASH, name: 'Trash', stage: {className: 'ad-stage', style: '', shell: 'es-player demo-text-scope'}, chapters: [], frames: [], assets: {}};
const MENU_COLUMNS = 4; // the grid in the Shift+A menu (see .sb-tiles)
const LIVE_ZOOM = 0.1;   // below this, frames are pictures (cheap), above it the frames in view are live
const TEXT_ZOOM = 0.12;  // below this, the frames' names, times and notes are hidden
const {bar: BAR, barGap: BAR_GAP, notesGap: NOTES_GAP, notes: NOTES_H} = LAYOUT, HEAD = BAR + BAR_GAP; // a frame's number bar, and the room above the frame
const clock = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const readLocal = key => { try { return localStorage.getItem(key); } catch { return null; } };
const writeLocal = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
// What was changed on a board, as saved. In local development the file is what counts
// (content/storyboard/<video>.json, with its revision `rev`); this browser's copy ({rev, edits})
// only adds changes made from that same revision that were not saved yet. Without the file
// (production), this browser's copy. -> {edits, changed, file, rev}
// The copy is in IndexedDB (components/storyboardCache.js; it used to be localStorage, read once more for a copy kept there), with
// `pending`: changes not yet in the file (null: a copy from before, it is not known).
const localOf = async videoId => {
  const kept = (await cacheGet('boards', videoId)) ?? (() => { try { return JSON.parse(readLocal(`storyboard:${videoId}`) || 'null'); } catch { return null; } })();
  try { return kept && 'edits' in kept ? {rev: kept.rev ?? null, edits: normalizeEdits(kept.edits), pending: typeof kept.pending === 'boolean' ? kept.pending : null} : {rev: null, edits: normalizeEdits(kept ?? {}), pending: null}; } catch { return {rev: null, edits: EMPTY, pending: null}; }
};
async function loadSaved(videoId) {
  const mine = await localOf(videoId);
  try {
    const response = await fetch(`/api/storyboard?video=${videoId}`, {cache: 'no-store'});
    if (!response.ok) throw new Error();
    const data = await response.json(), base = normalizeEdits(data.edits), rev = data.rev ?? 0;
    if (mine.rev !== rev) return {edits: base, changed: false, file: true, rev}; // the file changed since (the command line, another tab): it wins
    return {...mergeEdits(base, mine.edits), file: true, rev};
  } catch { return {edits: mine.edits, changed: false, file: false, rev: 0}; }
}
// Save to the file. -> {rev} or {conflict: true, edits, rev} (the file changed since `rev`: what it holds now)
async function postSaved(videoId, edits, rev = null, reason = 'save') {
  const response = await fetch('/api/storyboard', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({video: videoId, edits, rev, reason})});
  const data = await response.json().catch(() => ({}));
  if (response.status === 409 && data.conflict) return {conflict: true, edits: normalizeEdits(data.edits), rev: data.rev};
  if (!response.ok) throw new Error(data.error || 'Save failed');
  return {rev: data.rev};
}
const keepLocal = (videoId, rev, edits, pending = false) => cachePut('boards', videoId, {rev, edits, pending}).then(done => {
  if (done == null) writeLocal(`storyboard:${videoId}`, JSON.stringify({rev, edits})); // (no IndexedDB here: as before)
  else try { localStorage.removeItem(`storyboard:${videoId}`); } catch {} // (the old copy: room for the rest)
});
// A board opens with what this browser had of it (the user, 2026-10-22: "cache everything so it can make it super fast"), read
// while the board's frames are still being fetched, and the file is asked only whether it changed since (`?rev=`: a few bytes
// when it did not). -> {mine, check: Promise of {same} | {edits, rev} | null}, or no check (no copy of a revision of the file here).
const early = new Map();
const openLocal = videoId => {
  const was = early.get(videoId);
  if (was && performance.now() - was.at < 10000) return was.made;
  const made = localOf(videoId).then(mine => ({mine, check: mine.rev != null && mine.pending != null ? fetch(`/api/storyboard?video=${videoId}&rev=${mine.rev}`, {cache: 'no-store'}).then(r => r.json()).catch(() => null) : null}));
  early.set(videoId, {at: performance.now(), made});
  return made;
};
// The Trash is a board of its own, saved like the others: what is deleted from a storyboard is
// put in its file (and this browser's copy) right away, and taken out again when the delete is undone.
// Any board's file can be changed from the page of another (the Trash; the look of all the video words, kept alike on both boards).
async function changeBoard(videoId, change) {
  for (let tries = 0; tries < 4; tries++) {
    const saved = await loadSaved(videoId), next = change(saved.edits);
    if (next === saved.edits) return {rev: saved.rev, edits: saved.edits}; // (-> what the file holds now: the All videos page keeps its copy of the board by it)
    if (!saved.file) { keepLocal(videoId, null, next); return {rev: null, edits: next}; }
    const done = await postSaved(videoId, next, saved.rev);
    if (!done.conflict) { keepLocal(videoId, done.rev, next); return {rev: done.rev, edits: next}; } // (else it changed meanwhile: read it again and redo)
  }
  throw new Error(`the ${videoId} board kept changing`);
}
const changeTrash = change => changeBoard(TRASH, change);
// A file to save (an export of the storyboard).
const download = (name, data) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
const isTyping = target => /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName) || target?.isContentEditable;
const prefixOf = id => `f${id.replace(/[^a-z0-9]/gi, '_')}-`; // keeps two frames' ids apart (masks, gradients)
// What was copied: kept here, and in the browser so it can be pasted on the other
// video's board (changing board loads the page again) or in another tab.
const CLIP = 'storyboard:clipboard';
const POSITION = 'storyboard:position'; // a position copied with Ctrl+Shift+C (any board)
const NO_GUIDES = [];
const BUBBLE_W = 300; // a chat box's width (stage px): every one starts this wide, not locked (the user, 2026-10-07)
let memoryClip = null;
function keepClip(clip) {
  memoryClip = {...clip, at: Date.now()};
  try { localStorage.setItem(CLIP, JSON.stringify(memoryClip)); return true; } catch { try { localStorage.removeItem(CLIP); } catch {} return false; } // too big for the browser: this page only
}
function readClip() {
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(CLIP) || 'null'); } catch {}
  const clip = isClip(stored) && (!memoryClip || (stored.at ?? 0) >= memoryClip.at) ? stored : memoryClip;
  return isClip(clip) ? clip : null;
}

// A picture's file is saved by the site (public/storyboard/uploads/, local development);
// where there is no such route, a small one is kept inside the frame instead.
async function saveImage(file) {
  let response = null;
  try { response = await fetch('/api/storyboard/upload', {method: 'POST', headers: {'Content-Type': file.type}, body: file}); } catch {}
  if (response?.ok) return (await response.json()).url;
  if (response && response.status !== 404) throw new Error((await response.json().catch(() => ({}))).error || 'it could not be saved');
  if (file.size > 1500000) throw new Error('it is too big to keep in the browser (1.5 MB)');
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('it could not be read')); reader.readAsDataURL(file); });
}
const imageSize = url => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve({w: img.naturalWidth, h: img.naturalHeight}); img.onerror = () => reject(new Error('it is not a picture the browser can show')); img.src = url; });
const HANDLES = ['nw', 'ne', 'se', 'sw'], SIDES = ['n', 'e', 's', 'w'];

const Icon = {
  move: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M4.5 3.5 15.5 9l-4.6 1.4L9 15.5 4.5 3.5Z"/></svg>,
  hand: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10V4.5a1.2 1.2 0 0 1 2.4 0V9m0-1.5V3.7a1.2 1.2 0 0 1 2.4 0V9m0-3.3a1.2 1.2 0 0 1 2.4 0V11m0-2.6a1.2 1.2 0 0 1 2.4 0V12a5 5 0 0 1-5 5h-.6a5 5 0 0 1-4-2l-2.4-3.4a1.2 1.2 0 0 1 1.8-1.5L7 12.2"/></svg>,
  undo: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5 3.5 8.5 7 12M4 8.5h7a4.5 4.5 0 0 1 0 9H8"/></svg>,
  redo: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m13 5 3.5 3.5L13 12M16 8.5H9a4.5 4.5 0 0 0 0 9h3"/></svg>,
  help: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><path d="M8 8a2 2 0 1 1 3 1.7c-.7.4-1 .9-1 1.6M10 14v.1"/></svg>,
  plus: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>,
  bin: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5 5.5l.7 10a1.5 1.5 0 0 0 1.5 1.4h5.6a1.5 1.5 0 0 0 1.5-1.4l.7-10M8.5 9v5M11.5 9v5"/></svg>,
  rect: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><rect x="3.5" y="5" width="13" height="10" rx="1.4"/></svg>,
  scale: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="7" height="7" rx="1.2"/><path d="M12 3.5h4.5V8M16.5 3.5 10.5 9.5"/></svg>,
  pencil: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13.2 3.6 3.2 3.2L7 16.2l-4 .8.8-4 9.4-9.4ZM11.4 5.4l3.2 3.2"/></svg>,
  comment: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><path d="M12 3.8a8.2 8.2 0 1 1-3.7 15.5L3.8 20.2l1-4.1A8.2 8.2 0 0 1 12 3.8Z"/><path d="M8.6 10.6h6.8M8.6 13.8h4.2"/></svg>,
};

// The sidebar's rows of buttons: where an asset is aligned (in its frame, or to the others picked
// with it), how its text is aligned, and the weights a text can take.
const ALIGN = [{id: 'left', label: 'Align left', icon: PanelIcon.left}, {id: 'hcenter', label: 'Align horizontal centers', icon: PanelIcon.hcenter}, {id: 'right', label: 'Align right', icon: PanelIcon.right},
  {id: 'top', label: 'Align top', icon: PanelIcon.top}, {id: 'vcenter', label: 'Align vertical centers', icon: PanelIcon.vcenter}, {id: 'bottom', label: 'Align bottom', icon: PanelIcon.bottom}];
// (the video editor, several picked: spread with the same room between each, the first and the last staying)
const DISTRIBUTE = [
  {id: 'h', label: 'Distribute horizontally (3 or more)', icon: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1.5" y="2" width="1.3" height="12" rx=".6"/><rect x="13.2" y="2" width="1.3" height="12" rx=".6"/><rect x="6.2" y="4.5" width="3.6" height="7" rx=".8"/></svg>},
  {id: 'v', label: 'Distribute vertically (3 or more)', icon: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="1.5" width="12" height="1.3" rx=".6"/><rect x="2" y="13.2" width="12" height="1.3" rx=".6"/><rect x="4.5" y="6.2" width="7" height="3.6" rx=".8"/></svg>},
];
const TEXT_ALIGN = [{id: 'left', label: 'Text: left', icon: PanelIcon.tleft}, {id: 'center', label: 'Text: center', icon: PanelIcon.tcenter}, {id: 'right', label: 'Text: right', icon: PanelIcon.tright}, {id: 'justify', label: 'Text: justified', icon: PanelIcon.tjustify}];
const WEIGHTS = [[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semi Bold'], [700, 'Bold'], [800, 'Extra Bold'], [900, 'Black']];
const TOUCHED = ['moves', 'scales', 'sizes', 'tips', 'styles'];
const touched = (record, key) => TOUCHED.some(name => Object.keys(record?.[name] ?? {}).some(k => k === key || k.startsWith(`${key}/`)));
const WHEN = typeof Intl === 'undefined' ? null : new Intl.DateTimeFormat([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}); // (one formatter: toLocaleString made one for every date, at every render of the board)
const when = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : WHEN ? WHEN.format(d) : d.toISOString(); };

// A line's name typed right on its label (double-click it): Enter or leaving it keeps it, Esc does not.
function LineName({title, onDone}) {
  const ref = useRef(null), done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    el.textContent = title; el.focus();
    const range = document.createRange(); range.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const finish = value => { if (done.current) return; done.current = true; onDone(value); };
  return <span ref={ref} className="sb-section-edit" contentEditable="plaintext-only" suppressContentEditableWarning spellCheck="false" data-sb-ui=""
    onPointerDown={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}
    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish(e.currentTarget.textContent); } else if (e.key === 'Escape') { e.preventDefault(); finish(null); } }}
    onBlur={e => finish(e.currentTarget.textContent)}/>;
}

// ---- Drawing frames live, a few at a time -------------------------------------------------
// A live frame is the heavy part of the board (the demo's HTML, its changes, its bubble). When many
// come into view at once (a fast zoom out), they are drawn a few per animation frame, the nearest to
// the middle of the view first, so the board keeps moving under the hand meanwhile; until a frame is
// drawn, its picture shows. The frame you are working on is drawn at once.
const liveQueue = (() => {
  const jobs = new Map();
  let raf = 0, center = {x: 0, y: 0}, held = false;
  const run = () => {
    raf = 0;
    if (held) return; // (the board is moving: frames are drawn once it settles, so the move stays smooth; until then their pictures show)
    const t0 = performance.now();
    while (jobs.size && performance.now() - t0 < 8) {
      let next = null, best = Infinity;
      for (const [key, job] of jobs) { const d = (job.x - center.x) ** 2 + (job.y - center.y) ** 2; if (d < best) { best = d; next = key; } }
      const job = jobs.get(next);
      jobs.delete(next);
      job.draw();
    }
    if (jobs.size) raf = requestAnimationFrame(run);
  };
  return {
    add(key, job) { jobs.set(key, job); if (!raf) raf = requestAnimationFrame(run); },
    drop(key) { jobs.delete(key); },
    now(key) { const job = jobs.get(key); if (job) { jobs.delete(key); job.draw(); } },
    center(point) { center = point; },
    hold(on) { held = on; if (!on && jobs.size && !raf) raf = requestAnimationFrame(run); }, // (while the board moves: the user, 2026-10-22, "faster")
  };
})();
// A font that comes in after a frame was drawn changes the size of its words: the chat boxes of the frames drawn are drawn again then.
// One listener for the board, not a wait on document.fonts.ready at each frame drawn (reading it made the page work its styles out
// again, for every frame: the user, 2026-10-22, "faster").
// Fonts come in one after another as frames come into view: all of it is drawn again once, in the next animation frame, every box
// measured before any is drawn (drawShapes).
const fontRedraws = (() => {
  const all = new Set();
  let on = false, raf = 0;
  const again = () => {
    raf = 0;
    const now = [...all].filter(f => f.alive());
    drawShapes(now.map(f => [f.stage, f.edit]));
    for (const f of now) if (f.timelines.length) placeTimelines(f.stage, f.timelines);
  };
  const soon = () => { if (!raf) raf = requestAnimationFrame(again); };
  return {add(entry) {
    if (!on && document.fonts) { on = true; document.fonts.addEventListener('loadingdone', soon); document.fonts.ready.then(soon); }
    all.add(entry);
    return () => all.delete(entry);
  }};
})();

// ---- One frame -----------------------------------------------------------------------
// The picture (cheap, always) and, while it is in view and big enough to matter,
// the live stage: the demo's own HTML with its changes put on (`urgent`: at once, not queued).
const FrameArt = memo(function FrameArt({frame, video, live, urgent, cx, cy, edit, library, looks, narrow = true, guides = false}) { // (`looks`: the shared looks, lib/storyboardEdits.mjs: every slide has them; `narrow`: the gray side of a slide with no tablet made narrower, not on Scratch and Fonts; `guides`: its guide lines shown)
  const stageRef = useRef(null), playerRef = useRef(null), artRef = useRef(null), drawn = useRef(false);
  const [lines, setLines] = useState(null), [drawnAt, setDrawnAt] = useState(0), guidesRef = useRef(guides); guidesRef.current = guides;
  const stageStyle = useMemo(() => parseStyle(frame.stageStyle ?? video.stage.style), [frame.stageStyle, video]);
  const layers = useMemo(() => layersOf(frame, edit), [frame, edit?.hidden, edit?.inserts, edit?.order]); // eslint-disable-line react-hooks/exhaustive-deps
  const timelines = useMemo(() => layers.filter(l => /timeline/i.test(l.name ?? '')), [layers]);
  const html = useMemo(() => (live ? frameHtml(layers, hash => library[hash] ?? video.assets[hash], prefixOf(frame.id), frame.bubble) : ''), [live, layers, library, video, frame.id, frame.bubble]);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !live) { drawn.current = false; artRef.current?.removeAttribute('data-drawn'); return undefined; }
    let gone = false, unfont = null;
    const draw = () => {
      if (gone || stageRef.current !== stage) return;
      stage.innerHTML = html;
      applyEdits(stage, edit, looks);
      if (narrow && narrowPanel(stage)) drawShape(stage, edit); // (no tablet on it: the gray side from where the tablet's frame would end, the words in its middle)
      if (narrow) blackPlate(stage); // (bare software, no device's frame: black behind it)
      if (timelines.length) placeTimelines(stage, timelines); // (the timeline of a video is on its film, as in the video)
      drawn.current = true;
      if (guidesRef.current) setDrawnAt(n => n + 1); // (the guide lines measured again)
      artRef.current?.setAttribute('data-drawn', ''); // (the capture and the white behind the stage are only for the moment before it is drawn: Storyboard.css)
      if (playerRef.current) playerRef.current.style.visibility = '';
      unfont ??= fontRedraws.add({stage, edit, timelines, alive: () => !gone && stageRef.current === stage});
      whenFontsLoaded(edit, () => { if (!gone && stageRef.current === stage) drawShape(stage, edit); }); // (a font picked for the words: the chat box is drawn around them once it is in)
    };
    if (drawn.current || urgent) draw(); // a change to a frame already drawn, or the frame you are on: at once
    else liveQueue.add(frame.id, {x: cx, y: cy, draw});
    return () => { gone = true; unfont?.(); liveQueue.drop(frame.id); };
  }, [live, html, edit, looks, narrow]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (urgent && live) liveQueue.now(frame.id); }, [urgent, live, frame.id]);
  useEffect(() => { // the guide lines of the slide as it is drawn (measured only while they are shown)
    if (!guides || !live) { setLines(null); return undefined; }
    const id = requestAnimationFrame(() => { const stage = stageRef.current; if (stage && drawn.current) setLines(guidesOf(stage)); });
    return () => cancelAnimationFrame(id);
  }, [guides, live, drawnAt]);
  return <div ref={artRef} className="sb-art" data-art="">
    {frame.thumb && <img className="sb-thumb" src={frame.thumb} alt="" draggable={false} decoding="async"/>}
    {guides && lines && <svg className="sb-guides" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">{lines.x.map(x => <line key={`x${x}`} x1={x} x2={x} y1={0} y2={900}/>)}{lines.y.map(y => <line key={`y${y}`} x1={0} x2={1600} y1={y} y2={y}/>)}</svg>}
    {live && <div ref={playerRef} className={`${frame.shell ?? video.stage.shell ?? 'es-player demo-text-scope'} sb-player`} style={drawn.current ? undefined : {visibility: 'hidden'}}><div className="ad-fit ad-fit--embed"><div ref={stageRef} className={`${frame.stageClass ?? video.stage.className} sb-stage`} style={stageStyle} data-scene={frame.scene.id ?? undefined} data-view={frame.scene.view ?? undefined}/></div></div>}
  </div>;
});

// (its name, time and notes are always there: zoomed far out the board hides them, .sb-world.is-far)
const Frame = memo(function Frame({frame, index, x, y, video, live, urgent, solid, edit, library, looks, note, selected, dragging, isNew, onNote, cell, narrow, guides}) {
  return <div className={`sb-frame${cell ? ' is-cell' : ''}${solid ? ' is-solid' : ''}${selected ? ' is-selected' : ''}${dragging ? ' is-dragging' : ''}${isNew ? ' is-new' : ''}${isEdited(edit) ? ' is-edited' : ''}`} data-frame={frame.id} style={{left: x, top: y - HEAD, width: FRAME.w, height: HEAD + FRAME.h + NOTES_GAP + NOTES_H}}>
    <div className="sb-fhead" data-ftitle={frame.id} style={{height: BAR, marginBottom: BAR_GAP}}>
      {cell ? <>
        <b className="sb-fnum">{index}</b>
        <span className="sb-fvtitle">{cell.name}</span>
        <i className="sb-ftime"/>
      </> : <>
        <span className="sb-fname">{edit?.name ?? `${frame.label}${frame.isCopy && !frame.isBlank ? ' · copy' : ''}`}</span>
        <b className="sb-fnum">{index}</b>
        <i className="sb-ftime">{frame.time != null ? clock(frame.time) : ''}</i>
      </>}
    </div>
    <div style={{height: FRAME.h}}>{cell
      ? <div className="sb-art sb-art--cell" data-art=""><StoryboardPlayer cell frames={cell.frames} title={cell.name} edits={cell.edits} video={video} onFrame={cell.onFrame} onText={cell.onText} onVideoText={cell.onVideoText} onCaption={cell.onCaption} onSelect={cell.onSelect} onEditing={cell.onEditing} onMenu={cell.onMenu} pins={cell.pins} commentTool={cell.commentTool} onDrawn={cell.onDrawn}/></div>
      : <FrameArt frame={frame} video={video} live={live} urgent={urgent} cx={x + FRAME.w / 2} cy={y + FRAME.h / 2} edit={edit} library={library} looks={looks} narrow={narrow} guides={guides}/>}</div>
    <div className="sb-notes-wrap" style={{marginTop: NOTES_GAP, height: NOTES_H}}>
      <textarea className="sb-notes" data-sb-ui="" value={note} onChange={e => onNote(frame.id, e.target.value)} placeholder="Notes for this frame…" spellCheck="true"/>
    </div>
  </div>;
});

// ---- The board ---------------------------------------------------------------------------
export default function Storyboard({video: videoId = 'improved-quality-v2'}) {
  const [video, setVideo] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setVideo(null); setError('');
    if (videoId === TRASH) { setVideo(TRASH_VIDEO); return undefined; }
    if (videoId === ALL_VIDEOS) return undefined; // (no frames of its own: it plays the other boards')
    openLocal(videoId); // (the edits, at the same time as the frames)
    fetch(`/storyboard/${videoId}.json`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { if (live) setVideo(data); }).catch(() => { if (live) setError('The frames are not made yet. Run  npm run gen:storyboard  with the site running, then reload.'); });
    return () => { live = false; };
  }, [videoId]);
  if (videoId === ALL_VIDEOS) return <StoryboardAllVideos menu={menuOf()} load={loadSaved} change={changeBoard}/>;
  if (error) return <div className="sb-root sb-message"><div><h1>Storyboard</h1><p>{error}</p><Link href="/">Home</Link></div></div>;
  if (!video) return <div className="sb-root sb-message"><div><h1>Storyboard</h1><p>Loading the frames…</p></div></div>;
  return <Board key={videoId} video={video} videoId={videoId}/>;
}

function Board({video: captured, videoId}) {
  const viewport = useRef(null), worldRef = useRef(null), overlayRef = useRef(null), menuInput = useRef(null);
  const [size, setSize] = useState({w: 1200, h: 800});
  const [view, setView] = useState({x: 0, y: 0, zoom: 0.3});
  const viewRef = useRef(view), committed = useRef(view), sizeRef = useRef(size); sizeRef.current = size;
  const [tool, setTool] = useState('move'), [space, setSpace] = useState(false);
  const [selection, setSelection] = useState(null);       // {frame, key, depth}: a frame (key null) or an asset in it
  const [frameSel, setFrameSel] = useState([]);           // frames picked with a rectangle or Shift
  const [picked, setPicked] = useState(null);             // several assets picked with Shift or a rectangle, in any frames: {items: [{frame, key}]}
  const [marquee, setMarquee] = useState(null);
  const [overlay, setOverlay] = useState({outline: null, tip: null, frames: [], info: null, picks: [], plays: []});
  const [playing, setPlaying] = useState(null);           // the frame whose chat boxes a pen is writing
  const writers = useRef([]);
  const [help, setHelp] = useState(false), [zoomMenu, setZoomMenu] = useState(false), [menu, setMenu] = useState(null);
  // The frame the video is on while it plays (its number bar shows it): marked on the frame itself (data-sb-playing, an attribute React leaves alone), not
  // kept in the board's state: the whole board was drawn again at every frame of a video playing, 0.1 s each time (the user, 2026-10-22: "super fast").
  const playingId = useRef(null);
  const setPlayingId = useCallback(id => {
    if (playingId.current === id) return;
    const frameEl = key => (key ? worldRef.current?.querySelector(`[data-frame="${CSS.escape(key)}"]`) : null);
    frameEl(playingId.current)?.removeAttribute('data-sb-playing');
    playingId.current = id;
    frameEl(id)?.setAttribute('data-sb-playing', '');
  }, []);
  const [hoverGap, setHoverGap] = useState(null);         // the gap between two frames the pointer is in: where the + shows
  const [ctx, setCtx] = useState(null);                   // the right-click menu on assets: {x, y, frame, layers, linked, unique}; on a line's label: {x, y, line}; on a video: {x, y, video}; on a reference: {x, y, ref}
  const [refSel, setRefSel] = useState(null), refSelRef = useRef(null), pointerAt = useRef(null); refSelRef.current = refSel; // the reference picked (its id: lib/storyboardRefs.mjs); where the pointer is on the canvas, in the window's px (a file pasted goes there); on a comment's pin: {x, y, pin}
  const [rectLook, setRectLook] = useState({fill: RECT_FILL, radius: 0}); // the rectangle tool: what the next one is filled with, its corners
  const rectLookRef = useRef(rectLook); rectLookRef.current = rectLook;
  const [pen, setPen] = useState(PEN);                    // the pencil: {color, width (stage px)}
  const penRef = useRef(pen), inkRef = useRef(null); penRef.current = pen;
  useEffect(() => { try { const kept = JSON.parse(readLocal('storyboard:pen') || 'null'), color = normalizeHex(kept?.color); if (color) setPen({color, width: Math.max(PEN_WIDTHS.min, Math.min(PEN_WIDTHS.max, Number(kept.width) || PEN.width))}); } catch {} }, []);
  useEffect(() => { writeLocal('storyboard:pen', JSON.stringify(pen)); }, [pen]);
  const [history, setHistory] = useState(() => createHistory(EMPTY));
  const edits = history.present;
  const trashing = videoId === TRASH;
  const video = useMemo(() => (trashing ? trashVideo(captured, edits) : captured), [trashing, captured, edits.trash]); // eslint-disable-line react-hooks/exhaustive-deps
  const [loaded, setLoaded] = useState(false), [toFile, setToFile] = useState(true), [status, setStatusNow] = useState('');
  // (a message stays at least a moment: what saving says waits until it has been read)
  const saidAt = useRef(0), saveSay = useRef(0);
  const setStatus = useCallback(text => { saidAt.current = Date.now(); clearTimeout(saveSay.current); setStatusNow(text); }, []);
  const saveStatus = useCallback(text => { clearTimeout(saveSay.current); const wait = 2500 - (Date.now() - saidAt.current); if (wait <= 0) setStatusNow(text); else saveSay.current = setTimeout(() => setStatusNow(text), wait); }, []);
  const dirty = useRef(false), selRef = useRef(null), frameSelRef = useRef([]), toolRef = useRef('move'), spaceRef = useRef(false), drag = useRef(null), editing = useRef(null), editsRef = useRef(edits);
  const [, setTick] = useState(0);
  selRef.current = selection; frameSelRef.current = frameSel; toolRef.current = tool; spaceRef.current = space; editsRef.current = edits;
  // the assets picked: the Shift+click ones while the selected one is among them, else just the selected one
  const pickedItems = useMemo(() => (selection?.key && picked && picked.items.length > 1 && hasPick(picked.items, {frame: selection.frame, key: selection.key}) ? picked.items : []), [selection, picked]);
  const pickedItemsRef = useRef(pickedItems); pickedItemsRef.current = pickedItems;
  const pickedKeys = useMemo(() => pickedItems.filter(p => p.frame === selection?.frame).map(p => p.key), [pickedItems, selection]); // (the ones in the selected asset's own frame)
  const pickedRef = useRef(pickedKeys); pickedRef.current = pickedKeys;
  const keysNow = () => (pickedRef.current.length ? pickedRef.current : selRef.current?.key ? [selRef.current.key] : []);
  // every asset picked with its frame (in any frames), and the same by frame
  const itemsNow = () => (pickedItemsRef.current.length ? pickedItemsRef.current : selRef.current?.key ? picksOf(selRef.current.frame, [selRef.current.key]) : []);
  const groupsNow = () => groupPicks(itemsNow());
  const pendingEdit = useRef(null);                       // {frame, key}: the text to retype once the frame is drawn again (Tab)
  const cycleRef = useRef(null), pendingCycle = useRef(null); // the last plain click {frame, x, y, key} (a click again there goes down a layer), and a click let go on it that waits for its click event to say it is not a double-click

  // the lines (rows): the video's chapters and the ones you added, renamed, minus the ones deleted
  const lines = useMemo(() => boardLines(video.chapters, edits), [video, edits.lines]); // eslint-disable-line react-hooks/exhaustive-deps
  const linesRef = useRef(lines); linesRef.current = lines;
  const lineIds = useMemo(() => lines.map(l => l.id), [lines]);
  const [lineSel, setLineSel] = useState(null);           // a line picked by its label
  const [lineEdit, setLineEdit] = useState(null);         // the line whose name is being typed on its label
  const lineSelRef = useRef(lineSel); lineSelRef.current = lineSel;
  // the frames: the captured ones, and the copies you made (each after its frame)
  const allFrames = useMemo(() => orderedFrames(video.frames, edits, lineIds), [video, edits.copies, edits.rows, edits.deleted, lineIds]); // eslint-disable-line react-hooks/exhaustive-deps
  // A line of videos (the user, 2026-10-12: "make them videos not slides", lib/storyboardCells.mjs): each video takes the place of its first slide on the board; its other slides are
  // not on it (they are frames of the line still: what the video plays, what the line shown as slides has). `baseFrames` are the frames ON the board, `allFrames` every one.
  const cells = useMemo(() => cellsOf(edits, allFrames), [edits.lines, allFrames]); // eslint-disable-line react-hooks/exhaustive-deps
  const baseFrames = useMemo(() => (cells.hidden.size ? allFrames.filter(f => !cells.hidden.has(f.id)) : allFrames), [allFrames, cells]);
  const allById = useMemo(() => Object.fromEntries(allFrames.map(f => [f.id, f])), [allFrames]);
  const cellsRef = useRef(cells); cellsRef.current = cells;
  const allFramesRef = useRef(allFrames); allFramesRef.current = allFrames;
  const [reorder, setReorder] = useState(null);           // frames being carried: {id (the one held), ids (all of them, in board order), chapter, index} = where they would land
  const frames = useMemo(() => (reorder ? moveInList(baseFrames, reorder.ids, reorder.chapter, reorder.index) : baseFrames), [baseFrames, reorder]);
  // the layout without the frames being carried: where they land is worked out against this, so the answer does not change as the others make room
  const reference = useMemo(() => (reorder ? layoutFrames(baseFrames.filter(f => !reorder.ids.includes(f.id)), lines) : null), [baseFrames, reorder?.id, lines]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = useMemo(() => Object.fromEntries(frames.map(f => [f.id, f])), [frames]);
  const byIdRef = useRef(byId); byIdRef.current = byId;
  const [lineMove, setLineMove] = useState(null);         // a line being carried by its label: {id, index} = where it would land among the others
  const lineMoveRef = useRef(lineMove); lineMoveRef.current = lineMove;
  const shownLines = useMemo(() => { // while a line is carried, the others make room for it
    if (!lineMove) return lines;
    const mine = lines.find(l => l.id === lineMove.id), rest = lines.filter(l => l.id !== lineMove.id);
    return mine ? [...rest.slice(0, lineMove.index), mine, ...rest.slice(lineMove.index)] : lines;
  }, [lines, lineMove]);
  const board = useMemo(() => layoutFrames(frames, shownLines), [frames, shownLines]);
  const gaps = useMemo(() => layoutGaps(frames, board.frames), [frames, board]);
  // The videos (the user, 2026-10-09: one video for the lines that tell one thing, from the first scene to the last, with the transitions between them): each run of
  // lines (lib/storyboardVideos.mjs) has one, at the right of the last frame of its last line (and the + after it); it plays all the lines of the run, one after the other
  const videoSpots = useMemo(() => {
    const L = board.layout, rowOf = new Map(board.rows.map(r => [r.chapter.id, r])), out = [];
    const runs = runsOf(video.video, [...rowOf.keys()], true), shelved = shelvedRuns(edits.lines?.added, video.video, new Set(runs.map(r => r.id))); // (a line can hold the videos of the board side by side: the user, 2026-10-13)
    for (const run of runs) { // (the lines on the board: the captured ones and the ones added, like Animations)
      const shelf = shelved.get(run.id), shelfRow = shelf && rowOf.get(shelf.line);
      if (shelfRow) { out.push({x: L.labelW + L.labelGap + shelf.index * (FRAME.w + L.gapX), y: shelfRow.y + BAR + BAR_GAP, key: run.id, title: run.title, chapters: run.lines, shelf: shelf.line}); continue; }
      if (run.twin) continue; // (a detailed video stands only in a line that holds it: at the end of its lines it would be a second video beside each one)
      const row = rowOf.get(run.last), mine = frames.filter(f => f.chapter === run.last && board.frames[f.id]);
      const end = mine.length ? Math.max(...mine.map(f => board.frames[f.id].x)) + FRAME.w : L.labelW + L.labelGap + FRAME.w; // (an empty line shows a frame-sized "Add a frame")
      out.push({x: end + 2 * L.gapX, y: row.y + BAR + BAR_GAP, key: run.id, title: run.title, chapters: run.lines});
    }
    return out;
  }, [board, frames, video, edits.lines]);
  const shelfLines = useMemo(() => new Set(Object.entries(edits.lines?.added ?? {}).filter(([, l]) => l?.shelf?.length).map(([id]) => id)), [edits.lines]); // (a line that holds videos is not empty: no "Add a frame" in it)
  const videoFramesOf0 = useMemo(() => {
    const by = new Map();
    for (const f of baseFrames) { if (!by.has(f.chapter)) by.set(f.chapter, []); by.get(f.chapter).push(f); }
    for (const [lineId, list] of by) by.set(lineId, expandLine(list, cells, allById)); // (the slides of each video, in the order of the videos on the board: where its first slide is, in whatever line)
    return by;
  }, [baseFrames, cells, allById]);
  const videoRuns = useMemo(() => videoSpots.map(v => ({...v, frames: v.chapters.flatMap(id => videoFramesOf0.get(id) ?? [])})), [videoSpots, videoFramesOf0]);
  const boardRef = useRef(board); boardRef.current = board;
  const baseFramesRef = useRef(baseFrames); baseFramesRef.current = baseFrames;
  const referenceRef = useRef(reference); referenceRef.current = reference;
  const reorderRef = useRef(reorder); reorderRef.current = reorder;

  const commit = useCallback((next, options) => { dirty.current = true; setHistory(h => record(h, typeof next === 'function' ? next(h.present) : next, options)); }, []);
  const revRef = useRef(0);                                // the file's revision these changes are made from
  const onNote = useCallback((id, text) => commit(e => setNote(e, id, text), {merge: `note:${id}`}), [commit]);

  // ---- Load and save the changes (the file first, plus this browser's copy) ----
  const LOCAL = `storyboard:${videoId}`;
  // The shared looks (lib/storyboardEdits.mjs `looks`) are the same on every board: a change made here (the look editor, Undo, Redo) is copied to the other boards' files; what comes from
  // this board's file (loaded, or changed elsewhere) is not sent on. `looksSent`: the looks as this page last had them from the file or sent them.
  const looksSent = useRef(undefined);
  const sharedOf = e => JSON.stringify({looks: e.looks ?? null, videoText: e.videoText ?? null}); // (the look of all the video words is kept alike the same way)
  useEffect(() => {
    if (!loaded) return undefined;
    const now = sharedOf(edits);
    if (looksSent.current === undefined) { looksSent.current = now; return undefined; }
    if (now === looksSent.current) return undefined;
    const {looks, videoText} = edits, timer = setTimeout(() => {
      looksSent.current = now;
      for (const other of VIDEOS) if (other.id !== videoId) changeBoard(other.id, e => setVideoTextAll(setSharedLooks(e, looks ?? null), videoText ?? null)).catch(() => setStatus(`The look could not be copied to ${other.name} (it is copied with its own page)`));
    }, 800);
    return () => clearTimeout(timer);
  }, [edits, loaded, videoId, setStatus]);
  useEffect(() => {
    let live = true;
    const take = ({edits: merged, changed, file, rev}) => {
      revRef.current = rev;
      if (changed) dirty.current = true;
      looksSent.current = sharedOf(merged); // (as the file has them: nothing to send)
      setToFile(file); setHistory(createHistory(merged)); setLoaded(true);
    };
    (async () => {
      const {mine, check} = await openLocal(videoId);
      if (!live) return;
      early.delete(videoId); // (taken: a board opened again later reads what is kept then)
      if (!check) { // (no copy here of a revision of the file: from the file, as always, and kept for the next time)
        const saved = await loadSaved(videoId);
        if (!live) return;
        take(saved);
        if (saved.file) keepLocal(videoId, saved.rev, saved.edits, saved.changed);
        return;
      }
      take({edits: mine.edits, changed: mine.pending, file: true, rev: mine.rev}); // at once, as this browser last had it
      const data = await check;
      if (!live) return;
      if (!data) { setToFile(false); return; } // (no file to save to: kept in this browser, as before)
      if (data.same || !data.edits) return;
      const remote = normalizeEdits(data.edits); // the file changed since (the command line, another board, another tab): it is taken, merged with what is not saved yet
      revRef.current = data.rev;
      setHistory(h => { const next = dirty.current ? mergeEdits(remote, h.present).edits : remote; looksSent.current = sharedOf(next); return h.past.length ? record(h, next) : createHistory(next); });
      keepLocal(videoId, data.rev, remote, dirty.current);
    })();
    return () => { live = false; };
  }, [videoId, LOCAL]);
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    saveStatus('Saving…');
    const timer = setTimeout(async () => {
      keepLocal(videoId, revRef.current, edits, toFile);
      if (!toFile) { dirty.current = false; saveStatus('Saved in this browser'); return; }
      try {
        const done = await postSaved(videoId, edits, revRef.current);
        if (done.conflict) { // the file changed meanwhile (the command line, another tab): both are kept, then saved
          revRef.current = done.rev;
          setHistory(h => ({...h, present: mergeEdits(done.edits, h.present).edits}));
          saveStatus('Merged with changes made elsewhere');
          return;
        }
        revRef.current = done.rev;
        if (editsRef.current === edits) dirty.current = false;
        keepLocal(videoId, done.rev, edits);
        saveStatus('Saved');
      } catch (error) { setStatus(`Not saved to the file (${error.message}); kept in this browser.`); }
    }, 600);
    return () => clearTimeout(timer);
  }, [edits, loaded, toFile, videoId, LOCAL]);
  // What is changed in the file meanwhile (the command line, another tab) shows here within
  // seconds: taken as it is when nothing is waiting to be saved here, else merged with it. It is
  // a step of its own (Ctrl+Z takes it back).
  useEffect(() => {
    if (!loaded || !toFile) return undefined;
    let stop = false;
    const timer = setInterval(async () => {
      if (stop || document.hidden || drag.current || editing.current) return;
      try {
        const data = await (await fetch(`/api/storyboard?video=${videoId}&rev=${revRef.current}`, {cache: 'no-store'})).json();
        if (stop || data.same || !data.edits || data.rev === revRef.current) return;
        const remote = normalizeEdits(data.edits);
        revRef.current = data.rev;
        setHistory(h => { const next = dirty.current ? mergeEdits(remote, h.present).edits : remote; looksSent.current = sharedOf(next); return record(h, next); }); // (looks that came from the file are not sent on)
        keepLocal(videoId, data.rev, remote);
        saveStatus('Updated from the file');
      } catch {}
    }, 2500);
    return () => { stop = true; clearInterval(timer); };
  }, [loaded, toFile, videoId]);

  // ---- The window ----
  useEffect(() => {
    const el = viewport.current;
    const measure = () => { const r = el.getBoundingClientRect(); setSize({w: r.width, h: r.height}); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ---- The view: moved directly while it moves, handed to React when it settles ----
  const raf = useRef(0), settle = useRef(0), animation = useRef(0), rasterZoom = useRef(null);
  const paint = useCallback(() => {
    raf.current = 0;
    const v = viewRef.current, c = committed.current, world = worldRef.current, over = overlayRef.current;
    if (!world) return;
    // While it moves the board is a layer (will-change: transform) that keeps the picture it had when it
    // started moving. Zoomed far out from there, that picture would have to cover the whole board at its
    // old sharpness (gigabytes): the browser runs out of memory and shows white. So when the zoom has
    // gone a factor of 2 from the one the layer was drawn at, the layer is drawn again at the new one.
    rasterZoom.current ??= c.zoom;
    if (Math.abs(Math.log(v.zoom / rasterZoom.current)) > Math.LN2) {
      rasterZoom.current = v.zoom;
      world.style.willChange = 'auto';
      requestAnimationFrame(() => { if (worldRef.current) worldRef.current.style.willChange = ''; });
    }
    world.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.zoom})`;
    world.classList.toggle('is-far', v.zoom < TEXT_ZOOM); // names, times and notes too small to read: hidden, nothing rendered again
    liveQueue.center(toWorld(v, {x: sizeRef.current.w / 2, y: sizeRef.current.h / 2}));
    const s = v.zoom / c.zoom; // what is drawn over the board (selection...) follows the move until it is measured again
    if (over) over.style.transform = `translate(${v.x - c.x * s}px,${v.y - c.y * s}px) scale(${s})`;
  }, []);
  const showView = useCallback(next => {
    viewRef.current = next;
    worldRef.current?.classList.add('is-moving');
    liveQueue.hold(true);
    if (!raf.current) raf.current = requestAnimationFrame(paint);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => { liveQueue.hold(false); setView(viewRef.current); }, 130);
  }, [paint]);
  const setViewNow = useCallback(next => { viewRef.current = next; committed.current = next; setView(next); }, []);
  const fit = useCallback((box, options) => fitRect(box, size, options), [size]);
  // open where it was looked at (the user, 2026-10-13: "when I refresh the website using f5 or ctrl+shift+r or any way, I wanna be where I was before, when I refresh it takes me up"):
  // the view is kept as it settles and when the page is left (below), and a board opens on it again; else on the first row: its label and its first frames, big enough to read
  const opened = useRef(false), lateView = useRef(null);
  const windowNow = useCallback(() => { const r = viewport.current?.getBoundingClientRect(); return r && r.width > 0 && r.height > 0 ? {w: r.width, h: r.height} : sizeRef.current; }, []); // (the window as it is: the first measure may not have come in)
  const keepNow = useCallback(() => { if (opened.current) writeLocal(viewKey(videoId), JSON.stringify(keepView(viewRef.current, windowNow()))); }, [videoId, windowNow]); // (before the board is open it is not kept: it would keep the view it has before it is placed)
  useEffect(() => {
    if (opened.current || size.w < 300) return;
    const row = board.rows[0];
    if (!row) return; // (the Trash has its rows only once what it holds is loaded)
    opened.current = true;
    const whole = union([...board.rows.map(r => ({x: r.x, y: r.y, w: r.w, h: r.h})), ...Object.values(board.frames).map(p => ({x: p.x, y: p.y - HEAD, w: FRAME.w, h: HEAD + FRAME.h + NOTES_GAP + NOTES_H}))]); // (the lines' labels and every frame: the frames go far to the right of the labels)
    const raw = readLocal(viewKey(videoId)), kept = restoreView(parseView(raw), windowNow(), whole);
    if (kept) { setViewNow(kept); return; }
    lateView.current = raw;
    const first = frames.filter(f => f.chapter === row.chapter.id).slice(0, 2).map(f => board.frames[f.id]).filter(Boolean);
    const box = union([{x: row.x, y: row.y, w: row.w, h: row.h}, ...first.map(p => ({x: p.x, y: p.y - HEAD, w: FRAME.w, h: HEAD + FRAME.h + NOTES_GAP + NOTES_H}))]);
    if (box) setViewNow(fit(box, {padding: 70}));
  }, [size, frames, board, fit, setViewNow, videoId, windowNow]);
  useEffect(() => { // (a view kept by a reference far from the frames: the references are known only once the edits are in)
    if (!loaded || !opened.current) return;
    const raw = lateView.current, boxes = refBoxes(editsRef.current);
    lateView.current = null;
    const kept = raw && boxes.length ? restoreView(parseView(raw), windowNow(), union(boxes)) : null;
    if (kept) setViewNow(kept);
  }, [loaded, board, setViewNow, windowNow]);
  useEffect(() => { keepNow(); }, [view, keepNow]); // (it settles: kept)
  useEffect(() => { // (the page is left, a reload included, in the 130 ms before a move has settled: kept as it is)
    const hide = () => { if (document.visibilityState === 'hidden') keepNow(); };
    window.addEventListener('pagehide', keepNow); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('pagehide', keepNow); document.removeEventListener('visibilitychange', hide); };
  }, [keepNow]);

  // Zooming glides (a wheel notch, Ctrl + / −, the zoom menu): the target moves at once and the view
  // eases to it around the pointer, so notches in a row add up smoothly. A pinch follows the fingers.
  const glide = useRef(null); // {target, at, raf, t}
  const stopGlide = useCallback(() => { if (glide.current) { cancelAnimationFrame(glide.current.raf); glide.current = null; } }, []);
  const glideTo = useCallback((to, at) => {
    cancelAnimationFrame(animation.current);
    const g = glide.current ?? (glide.current = {target: viewRef.current.zoom, raf: 0, t: 0});
    g.target = clampZoom(to(g.target)); g.at = at;
    if (g.raf) return;
    g.t = performance.now();
    const step = now => {
      const {view: next, done} = glideZoom(viewRef.current, g.target, g.at, now - g.t);
      g.t = now;
      showView(next);
      if (done) { glide.current = null; return; }
      g.raf = requestAnimationFrame(step);
    };
    g.raf = requestAnimationFrame(step);
  }, [showView]);
  const goTo = useCallback(target => {
    cancelAnimationFrame(animation.current);
    stopGlide();
    const from = viewRef.current, t0 = performance.now(), size = sizeRef.current;
    const step = now => {
      const p = Math.min(1, (now - t0) / 280), e = 1 - (1 - p) ** 3;
      showView(viewBetween(from, target, e, size));
      if (p < 1) animation.current = requestAnimationFrame(step);
    };
    animation.current = requestAnimationFrame(step);
  }, [showView, stopGlide]);
  const frameBox = useCallback(id => { const p = board.frames[id]; return p && {x: p.x, y: p.y - HEAD, w: FRAME.w, h: HEAD + FRAME.h + NOTES_GAP + NOTES_H}; }, [board]);
  const focusFrame = useCallback(id => { const box = frameBox(id); if (box) { setSelection({frame: id, key: null, depth: 0}); setFrameSel([id]); goTo(fit(box, {padding: 70, maxZoom: 0.9})); } }, [frameBox, goTo, fit]);
  const fitAll = useCallback(() => goTo(fit(union([board.bounds, ...(!trashing && videoSpots.length && frames.length ? videoSpots.map(v => ({x: v.x, y: v.y - HEAD, w: FRAME.w, h: HEAD + FRAME.h + NOTES_GAP + NOTES_H})) : []), ...refBoxes(editsRef.current)].filter(Boolean)) ?? board.bounds, {padding: 50})), [board, videoSpots, frames, trashing, goTo, fit]); // (the videos at the right of the lines, and the references, are part of the board)
  const fitSelection = useCallback(() => {
    const row = !selection && lineSel ? board.rows.find(r => r.chapter.id === lineSel) : null;
    if (row) { goTo(fit(union([{x: row.x, y: row.y, w: row.w, h: row.h}, ...frames.filter(f => f.chapter === lineSel).map(f => frameBox(f.id)).filter(Boolean)]), {padding: 70, maxZoom: 0.9})); return; } // a line picked: the whole line
    const ids = frameSel.length ? frameSel : selection ? [selection.frame] : [];
    const box = union(ids.map(frameBox).filter(Boolean));
    if (box) goTo(fit(box, {padding: 70, maxZoom: 0.9})); else fitAll();
  }, [frameSel, selection, lineSel, board, frames, frameBox, goTo, fit, fitAll]);
  const middle = () => ({x: sizeRef.current.w / 2, y: sizeRef.current.h / 2});
  const zoomTo = useCallback(zoom => glideTo(() => zoom, middle()), [glideTo]);
  const zoomStep = useCallback(dir => glideTo(z => stepZoom(z, dir), middle()), [glideTo]); // Ctrl + / Ctrl −: the next preset from where it is going

  useEffect(() => {
    const el = viewport.current;
    const onWheel = event => {
      if (event.target.closest?.('[data-sb-scroll]')) return;
      event.preventDefault();
      cancelAnimationFrame(animation.current);
      const action = wheelAction(event), rect = el.getBoundingClientRect(), v = viewRef.current, at = {x: event.clientX - rect.left, y: event.clientY - rect.top};
      if (action.type === 'zoom' && action.glide) { glideTo(z => z * action.factor, at); return; } // a wheel notch: glides there
      if (action.type === 'zoom') { stopGlide(); showView(zoomAt(v, v.zoom * action.factor, at)); return; } // a pinch: with the fingers
      showView(panBy(v, action.dx, action.dy));
    };
    el.addEventListener('wheel', onWheel, {passive: false});
    return () => el.removeEventListener('wheel', onWheel);
  }, [showView, glideTo, stopGlide]);

  // ---- Selecting, moving, editing ----
  const frameEl = id => viewport.current?.querySelector(`[data-frame="${CSS.escape(id)}"]`);
  const stageFor = id => frameEl(id)?.querySelector('.sb-stage') ?? null;
  // ---- Handwriting: a frame's chat boxes written by a pen, in the slide itself (the blue play button at its top right) ----
  const stopWriting = useCallback(() => { const list = writers.current; writers.current = []; for (const w of list) w.stop(); setPlaying(null); }, []);
  useEffect(() => () => { for (const w of writers.current) w.stop(); }, []);
  const playFrame = id => {
    stopWriting();
    const stage = stageFor(id), anims = editsRef.current.frames[id]?.anims;
    if (!stage || !anims) return;
    const todo = Object.entries(anims).map(([key, anim]) => { const bubble = elementOf(stage, key); return {bubble, seconds: animSeconds(anim, bubble?.querySelector('p')?.textContent)}; }).filter(x => x.bubble && isBubble(x.bubble));
    if (!todo.length) return;
    let left = todo.length;
    setPlaying(id);
    const started = todo.map(({bubble, seconds}) => writeWords(stage, bubble, {seconds, done: () => { left--; if (!left) { writers.current = []; setPlaying(null); } }}));
    if (left) writers.current = started;
  };
  const selectedEl = () => { const s = selRef.current; if (!s?.key) return null; const st = stageFor(s.frame); return st ? elementOf(st, s.key) : null; };
  const selectFrame = (id, add) => {
    setSelection({frame: id, key: null, depth: 0});
    setFrameSel(list => add ? (list.includes(id) ? list.filter(x => x !== id) : [...list, id]) : [id]);
  };
  // A chat bubble whose tail is off (its point was dragged inside its box) takes the point
  // along when the box moves, so the tail stays off: {tip0} = how far the point was moved, else null.
  const offTail = (stage, el, frameId) => (isBubble(el) && tailOff(stage, el, editsRef.current.frames[frameId]) ? {tip0: editsRef.current.frames[frameId]?.tips?.[el.dataset.sbRoot] ?? [0, 0]} : null);
  const moveSelectedBy = useCallback((dx, dy) => {
    if (!selRef.current?.key) return;
    const items = itemsNow(), moves = items.map(({frame, key}) => {
      const stage = stageFor(frame), el = stage && elementOf(stage, key);
      if (!el || isFixed(el)) return null; // (fixed in place: the background)
      const u = unitOf(stage), k = parentScale(el), t = translateOf(el), by = [dx * u / k, dy * u / k], off = offTail(stage, el, frame);
      return {frame, key, to: [t[0] + by[0], t[1] + by[1]], tip: off && [off.tip0[0] + by[0], off.tip0[1] + by[1]]};
    }).filter(Boolean);
    if (moves.length) commit(e => moves.reduce((cur, m) => (m.tip ? setTip(setMove(cur, m.frame, m.key, m.to), m.frame, m.key, m.tip) : setMove(cur, m.frame, m.key, m.to)), e), {merge: `move:${items.map(p => `${p.frame}:${p.key}`).join(',')}`});
  }, [commit]);

  // Retype a text (from the board, or from the video's picture): that text alone (the user, 2026-11-09: "if I change 123 to 000 in slide 4 it shouldn't
  // change it in slide 5", nothing is linked). `shown`: retyped in a VIDEO, the other slides of that video that show the very same chat box, one caption seen
  // across a scene's clicks, so its words do not jump while the video plays (`info.sameWords`); never other frames of the board.
  const retype = useCallback(({frame, key, text, also: shown = []}) => {
    commit(e => [{frame, key}, ...shown].reduce((cur, part) => setText(cur, part.frame, part.key, text), e));
  }, [commit]);
  // The look and the box of a text in a VIDEO, changed in the video's text editor (components/StoryboardTextEditor.jsx): kept on the frame's own record (`vtext`), apart from the slide. `targets`: every
  // slide that shows these words (a scene's click after click), so the words do not jump when the next click plays. A drag is one step of Undo.
  const SESSION = 3600000; // (a text editing is ONE step of Undo, however long it takes: the changes of the editing, and Done, carry its `session`)
  const restyleVideo = useCallback(({targets, frames: ids = [], patch, session}) => { // (the look: this video's words, `kind:words` on its slides, taken off the texts it was typed on so they show it; the box: this text's)
    const look = Object.fromEntries(Object.entries(patch).filter(([name]) => name !== 'rect')), off = Object.fromEntries(Object.keys(look).map(name => [name, null]));
    commit(e => {
      let cur = e;
      if (Object.keys(look).length) cur = targets.reduce((c, t) => setVideoText(c, t.frame, t.key, off), (ids.length ? ids : targets.map(t => t.frame)).reduce((c, id) => setOwnLook(c, id, 'kind:words', 'words', look), cur));
      if ('rect' in patch) cur = targets.reduce((c, t) => setVideoText(c, t.frame, t.key, {rect: patch.rect}), cur);
      return cur;
    }, session ? {merge: `vtext-session:${session}`, window: SESSION} : {merge: `vtext:${targets.map(t => `${t.frame}:${t.key}`).join(',')}:${Object.keys(patch).join(',')}`});
  }, [commit]);
  // The words typed over a caption of a DETAILED video (the user, 2026-10-14): kept apart from the slides, per video and beat, so the original video keeps its words.
  const retypeCaption = useCallback(({run, beat, text}) => commit(e => setCaption(e, run, beat, text)), [commit]);
  // ---- The video's inspector (the user, 2026-10-21: "I would love to have it as an inspector on the right instead of popping up. Same thing for the text and everything. So basically,
  // if I select a video, it should show everything on the inspector when it comes to editing"): a press on a video picks it (`videoSel`: its title, its slides, the look a kind has on the
  // frame it is on; `focus`: a color double-clicked in it); the text retyped in it hands its fields here (`textEd`). The colors are the shared looks (lib/storyboardEdits.mjs `looks`): for
  // ALL the videos and slides, or for THIS video (its slides' own, `kind:<kind>`); the words are the look of all the video words (`videoText.words`). One step of Undo per field.
  const [videoSel, setVideoSel] = useState(null), [textEd, setTextEd] = useState(null);
  // The comment picked on a video of the board (the user, 2026-10-30: "the comments should be in /storyboard before going to video editor"): {key (the video's), title, id}. Its inspector
  // is the sidebar (the same CommentPanel as in the video editor); picking anything else, or the video editor opening, puts it down.
  const [pinSel, setPinSel] = useState(null), pinSelRef = useRef(null); pinSelRef.current = pinSel;
  // The video editor (components/StoryboardVideoEditor.jsx): the video opened from its right-click menu ({key: its run, or the anchor of its cell; at: the second it was on})
  const [vEdit, setVEdit] = useState(null), vEditRef = useRef(null); vEditRef.current = vEdit;
  // The board behind the video editor is not seen (the user, 2026-10-27: "changing an option in video editor is super slow and tedious, like it freezes": each change drew
  // again, behind the editor, every slide of the video on the board, the whole slide each time, and made again every copy of the video on the lines of videos). While the
  // editor is open the board keeps the edits and the frame picked it had when it opened, and is drawn again once, when the editor closes. The frame picked in the editor stays
  // drawn with the changes (the inspector reads its look from it), and the editor's own video takes the changes as they settle (`veEdits`: deferred, so a field scrubbed or a
  // color dragged does not make the video again at every step of it; the sidebar answers at once).
  const frozen = useRef(null);
  if (!vEdit) frozen.current = null; else frozen.current ??= {edits, focus: selection?.frame ?? null};
  const boardEdits = frozen.current?.edits ?? edits, boardFocus = frozen.current ? frozen.current.focus : selection?.frame ?? null;
  const veEdits = useDeferredValue(vEdit ? edits : null) ?? edits; // (null while it is closed: no second drawing of the board for an edit made on the board)
  // Guide lines over the slides and the video editor's picture (the user, 2026-10-22, with a picture of Figma's): through where the tablet's frame ends and the words' edges.
  // On or off with the button or Shift+G; kept in this browser.
  const [showGuides, setShowGuides] = useState(false);
  useEffect(() => { if (readLocal('storyboard:guides') === '1') setShowGuides(true); }, []);
  const toggleGuides = useCallback(() => setShowGuides(on => { writeLocal('storyboard:guides', on ? '0' : '1'); return !on; }), []);
  const editorKey = `storyboard:editor:${videoId}`;
  const openVideo = useCallback((key, at) => { setPinSel(null); setVEdit({key, at}); writeLocal(editorKey, JSON.stringify({key, at})); }, [editorKey]);
  const editorTime = useCallback(t => { setVeT(t); const v = vEditRef.current; if (v) writeLocal(editorKey, JSON.stringify({key: v.key, at: Math.round(t * 1000) / 1000})); }, [editorKey]); // (held only: not each picture of a play)
  // A video drawn again (an edit, Undo, Redo): the inspector of the video picked reads what it shows from its picture, so it is drawn again after it (the user, 2026-10-22: "undo sometimes doesn't work")
  const [, setLookTick] = useState(0);
  const onVideoDrawn = useCallback(title => { if (videoSelRef.current?.title === title) setLookTick(n => n + 1); }, []);
  // what the editor has picked ({type: 'layer', id} | {type: 'asset', frame, key, name?} | {type: 'look', kind} | null) and its time while it is held (a layer's values then)
  const [veSel, setVeSel] = useState(null), veSelRef = useRef(null); veSelRef.current = veSel;
  const [veT, setVeT] = useState(0), veTitleRef = useRef(null);
  const veActions = useRef(null); // (what the editor does to all that is picked, for the sidebar's buttons: align, distribute, duplicate, split, restack, remove)
  const closeVideo = useCallback(() => { setVEdit(null); setVeSel(null); try { localStorage.removeItem(editorKey); } catch {} }, [editorKey]);
  const reopened = useRef(false);
  useEffect(() => { // (the board loaded: the video that was open in the editor before the reload, at the second it was on)
    if (!loaded || reopened.current) return;
    reopened.current = true;
    try { const kept = JSON.parse(readLocal(editorKey) || 'null'); if (kept?.key) setVEdit({key: String(kept.key), at: Math.max(0, Number(kept.at) || 0)}); } catch {}
  }, [loaded, editorKey]);
  const veSelect = useCallback(sel => { // an element of a slide picked in the editor is the board's selection (its inspector is the asset's); the rest is the editor's
    setVeSel(sel);
    if (sel?.type !== 'look') setVideoSel(v => (v?.line ? {...v, line: null} : v)); // (a connector line picked before is not what Delete takes now)
    if (sel?.type === 'asset') { setSelection({frame: sel.frame, key: sel.key, depth: sel.key.includes('/') ? sel.key.split('/')[1].split('.').length : 0}); setFrameSel([]); setPicked(null); }
    else if (sel?.type === 'layer' || sel?.type === 'comment' || !sel) setSelection(null);
  }, []);
  // The layers of the video open in the editor (lib/storyboardLayers.mjs): one step of Undo each, or one for a run of changes with the same `merge`
  const layerOps = useMemo(() => {
    const title = () => veTitleRef.current, once = merge => (merge ? {merge} : undefined);
    const idsFor = (t, list) => { const used = [...videoLayersOf(editsRef.current, t)]; return list.map(l => { const id = newLayerId(used, l.kind); used.push({id}); return id; }); }; // (new ids, one per layer, none taken)
    const listOf = (t, ids) => { const items = videoLayersOf(editsRef.current, t); return ids.map(id => items.find(x => x.id === id)).filter(Boolean); };
    const by = k => ({...k, ...(k.x != null ? {x: k.x + 24} : {}), ...(k.y != null ? {y: k.y + 24} : {})});
    return {
      // several at once, ONE step of Undo (the user, 2026-10-26: "multiselection"): `changes` {id: a patch or a function of the layer}; the others return the ids made
      changeMany: (changes, merge) => { const t = title(); if (t && Object.keys(changes).length) commit(e => Object.entries(changes).reduce((cur, [id, change]) => updateVideoLayer(cur, t, id, change), e), once(merge)); },
      removeMany: ids => { const t = title(); if (t && ids.length) commit(e => ids.reduce((cur, id) => removeVideoLayer(cur, t, id), e)); },
      addMany: list => { const t = title(); if (!t || !list.length) return []; const ids = idsFor(t, list); commit(e => list.reduce((cur, l, i) => addVideoLayer(cur, t, {...l, id: ids[i]}).edits, e)); return ids; },
      duplicateMany: ids => {
        const t = title(), list = t ? listOf(t, ids) : [];
        if (!list.length) return [];
        const made = idsFor(t, list);
        commit(e => list.reduce((cur, l, i) => addVideoLayer(cur, t, {...l, id: made[i], name: `${l.name} copy`, x: l.x + 24, y: l.y + 24, keys: l.keys?.map(by)}).edits, e));
        return made;
      },
      order: ids => { const t = title(); if (t) commit(e => orderVideoLayers(e, t, ids)); }, // (the whole stacking, from the back to the front)
      // an element of the slides trimmed (the user, 2026-10-28): its window in the video, {from?, to?}; null gives it the whole video back
      setSpan: (name, span, merge) => { const t = title(); if (t && name) commit(e => setSpan(e, t, name, span), merge ? {merge} : undefined); },
      split: (ids, at) => { // (cut in two at `at`: the second parts, just above the first)
        const t = title(), list = t ? listOf(t, ids).filter(l => at > l.from + 0.05 && at < l.to - 0.05) : [];
        if (!list.length) return [];
        const made = idsFor(t, list);
        commit(e => list.reduce((cur, l, i) => splitVideoLayer(cur, t, l.id, at, made[i]).edits, e));
        return made;
      },
      add: layer => { const t = title(); if (!t) return null; const id = layer.id ?? newLayerId(videoLayersOf(editsRef.current, t), layer.kind); commit(e => addVideoLayer(e, t, {...layer, id}).edits); return id; },
      change: (id, change, merge) => { const t = title(); if (t) commit(e => updateVideoLayer(e, t, id, change), merge ? {merge} : undefined); },
      remove: id => { const t = title(); if (t) commit(e => removeVideoLayer(e, t, id)); },
      stack: (id, dir) => { const t = title(); if (t) commit(e => stackVideoLayer(e, t, id, dir)); },
      duplicate: id => {
        const t = title(), items = t ? videoLayersOf(editsRef.current, t) : [], l = items.find(x => x.id === id);
        if (!l) return null;
        const nid = newLayerId(items, l.kind), by = k => ({...k, ...(k.x != null ? {x: k.x + 24} : {}), ...(k.y != null ? {y: k.y + 24} : {})});
        commit(e => addVideoLayer(e, t, {...l, id: nid, name: `${l.name} copy`, x: l.x + 24, y: l.y + 24, keys: l.keys?.map(by)}).edits);
        return nid;
      },
    };
  }, [commit]);
  // The comments of a video (lib/storyboardComments.mjs; the user, 2026-10-29): points placed on its picture, with words. One step of Undo each, or one for a run of
  // changes with the same `merge` (the words typed). They are never in the video: only the editor and the board draw their pins. The ones without a title are the video open in the
  // editor's, else the one whose comment is picked on the board (`pinSel`); `addTo` / `changeIn` / `removeIn` name the video (a comment placed from the board's menu, a pin moved there).
  const commentOps = useMemo(() => {
    const title = () => veTitleRef.current ?? pinSelRef.current?.title ?? null;
    const addTo = (t, comment) => { if (!t) return null; const id = newCommentId(videoCommentsOf(editsRef.current, t)); commit(e => addVideoComment(e, t, {...comment, id}).edits); return id; };
    const changeIn = (t, id, change, merge) => { if (t) commit(e => updateVideoComment(e, t, id, change), merge ? {merge} : undefined); };
    const removeIn = (t, id) => { if (t) commit(e => removeVideoComment(e, t, id)); };
    return {
      add: comment => addTo(title(), comment),
      change: (id, change, merge) => changeIn(title(), id, change, merge),
      remove: id => removeIn(title(), id),
      addTo, changeIn, removeIn,
    };
  }, [commit]);
  // An element of a slide moved in the editor (that slide only), or hidden in the video
  const sameInVideoRef = useRef(null); // (set where the video open is known: sameInVideo)
  const assetOps = useMemo(() => ({
    move: (frame, key, xy, merge) => commit(e => setMove(e, frame, key, xy), merge ? {merge} : undefined),
    // resized by its handles: by `f` [fx, fy] on every slide of the video it is on, in the video only (`vscale`; the user, 2026-10-22: "Every slide of this video")
    resize: (frame, key, f) => commit(e => (sameInVideoRef.current?.(frame, key) ?? [{frame, key}]).reduce((cur, q) => { const was = videoScaleOf(cur, q.frame, q.key) ?? [1, 1]; return setVideoScale(cur, q.frame, q.key, [was[0] * f[0], was[1] * f[1]]); }, e)),
    unsize: (frame, key) => commit(e => (sameInVideoRef.current?.(frame, key) ?? [{frame, key}]).reduce((cur, q) => setVideoScale(cur, q.frame, q.key, null), e)),
    // moved on the picture or by its point of the motion path: its place in the video on that slide only (`vmove`, stage px; the slide on the board is not touched)
    place: (frame, key, d, merge) => commit(e => setVideoMove(e, frame, key, d), merge ? {merge} : undefined),
    // several moved at once (with the layers picked with them: the same `merge`, one step of Undo): [{frame, key, d}] their places, [{frame, key, by: [dx, dy]}] moved by
    placeMany: (list, merge) => commit(e => list.reduce((cur, q) => setVideoMove(cur, q.frame, q.key, q.d), e), merge ? {merge} : undefined),
    shiftMany: (list, merge) => commit(e => list.reduce((cur, q) => { const m = videoMoveOf(cur, q.frame, q.key) ?? [0, 0]; return setVideoMove(cur, q.frame, q.key, [m[0] + q.by[0], m[1] + q.by[1]]); }, e), merge ? {merge} : undefined),
    unplace: (frame, key) => commit(e => (sameInVideoRef.current?.(frame, key) ?? [{frame, key}]).reduce((cur, q) => setVideoMove(cur, q.frame, q.key, null), e)),
    hide: (list, on) => commit(e => list.reduce((cur, {frame, key}) => (on ? hideLayer(cur, frame, key) : unhideLayer(cur, frame, key)), e)),
  }), [commit]);
  // A picture dropped, pasted or picked in the editor: a layer of the video, as big as fits in 640 x 400, where the middle of the picture is
  const addVideoImage = useCallback(async (file, place) => {
    try {
      setStatus('Adding the picture…');
      const url = await saveImage(file), size = await imageSize(url), k = Math.min(1, 640 / size.w, 400 / size.h), w = Math.round(size.w * k), h = Math.round(size.h * k);
      const id = layerOps.add({kind: 'image', src: url, name: (file.name || '').replace(/\.[a-z0-9]+$/i, '').slice(0, 40) || 'Image', x: place.cx - w / 2, y: place.cy - h / 2, w, h, from: place.from, to: place.to});
      if (id) veSelect({type: 'layer', id});
      setStatus('');
    } catch (error) { setStatus(`The picture was not added: ${error.message}`); }
  }, [layerOps, veSelect, setStatus]);
  const videoSelRef = useRef(null); videoSelRef.current = videoSel;
  const selectVideo = useCallback((picked, extra = {}) => { setSelection(null); setFrameSel([]); setLineSel(null); setVideoSel({...picked, focus: extra.focus ?? null, line: extra.line ?? null, at: Date.now()}); }, []);
  // A comment's pin pressed on a video of the board: it is what is picked (nothing else)
  const pickPin = useCallback((key, title, id) => { setSelection(null); setFrameSel([]); setLineSel(null); setVideoSel(null); setPicked(null); setPinSel({key, title, id}); }, []);
  useEffect(() => { if (selection || videoSel || lineSel) setPinSel(null); }, [selection, videoSel, lineSel]);
  const scrolledTo = useRef(0); // (the color double-clicked in a video is brought into view once, not at every change)
  const lookQueue = useRef(null); // (a color dragged on the wheel or the gradient bar: kept once a picture, not at every move of the pointer)
  const ownKeyOf = kind => (kind === 'background' ? BACKGROUND : `kind:${kind}`); // (a video's own look of a kind, on each of its slides; 'words': the look of its words)
  const changeVideoLook = useCallback((kind, ids, patch) => { // (this video only: the user, 2026-10-21, "first it should apply to only the video I have")
    const q = lookQueue.current;
    lookQueue.current = {kind, ids, patch: {...(q && q.kind === kind ? q.patch : {}), ...patch}, frame: q?.frame ?? requestAnimationFrame(() => {
      const {kind: k, ids: list, patch: change} = lookQueue.current; lookQueue.current = null;
      commit(e => list.reduce((cur, id) => setOwnLook(cur, id, ownKeyOf(k), k, change), e), {merge: `vlook:${k}:${Object.keys(change).join(',')}`});
    })};
  }, [commit]);
  // A connector line deleted on this video (the user, 2026-10-22: "give me a way to cancel any line I want by selecting and deleting"): double-click it in the video, then Delete (the key or the
  // inspector's button). It is gone from this video's slides (`hide` in its own connector look, kept apart from Apply to all); Bring back the lines shows them all again. One step of Undo.
  const deleteVideoLine = useCallback((ids, name) => {
    const hide = ids.map(id => editsRef.current.frames[id]?.ownLooks?.['kind:connector']?.hide).find(Boolean) ?? [];
    if (!name || hide.includes(name)) return;
    commit(e => ids.reduce((cur, id) => setOwnLook(cur, id, 'kind:connector', 'connector', {hide: [...hide, name]}), e));
    setVideoSel(v => (v ? {...v, line: null} : v));
    setStatus('Line deleted from this video (Ctrl+Z, or Bring back the lines)');
  }, [commit, setStatus]);
  const resetVideoLook = useCallback((kind, ids) => commit(e => ids.reduce((cur, id) => setOwnLook(cur, id, ownKeyOf(kind), kind, null), e)), [commit]); // (back to how all the videos have it)
  // Apply to all (the inspector's blue button, the user, 2026-10-21: "make sure it doesn't apply to all until I hit an apply to all button"): this video's looks become the looks of every video
  // and slide of every board (the colors: `looks`; the words: `videoText.words`), and the video follows them from then on. One step of Undo; the other boards get it from the effect above.
  const applyVideoToAll = useCallback(ids => {
    const at = new Date().toISOString(), cur0 = editsRef.current, mineOf = kind => ids.map(id => cur0.frames[id]?.ownLooks?.[ownKeyOf(kind)]).find(Boolean);
    const kinds = ['background', 'plate', 'panel', 'outline', 'connector', 'words'].filter(mineOf);
    if (!kinds.length) return;
    commit(e => kinds.reduce((cur, kind) => {
      const {hide, ...look} = mineOf(kind), shared = kind === 'words' ? setVideoTextKind(cur, 'words', look, at) : Object.keys(look).length ? setSharedLook(cur, kind, look, at) : cur; // (deleted lines stay this video's: never shared)
      return ids.reduce((c, id) => setOwnLook(c, id, ownKeyOf(kind), kind, hide ? {fill: null, stroke: null, strokeWidth: null, arrow: null} : null, at), shared);
    }, e));
    setStatus('This video\'s look is now the look of every video and slide of every board (Ctrl+Z takes it back)');
  }, [commit, setStatus]);
  const finishEdit = useCallback((keep = true) => {
    const ed = editing.current;
    if (!ed) return;
    editing.current = null;
    const {el, frame: id, key, words, original, piece} = ed, text = el.textContent, changed = keep && text !== original;
    el.removeAttribute('contenteditable'); el.style.whiteSpace = '';
    el.removeEventListener('input', ed.onInput); el.removeEventListener('keydown', ed.onKey); el.removeEventListener('blur', ed.onBlur);
    if (piece) el.replaceWith(document.createTextNode(changed ? text : original)); // the piece of text goes back where it was, bare
    if (changed) retype({frame: id, key, original, text});
    else if (words) { setLines(el, original); drawShape(stageOf(el), editsRef.current.frames[id]); }
    else if (!piece) el.textContent = original;
    setTick(t => t + 1);
  }, [retype]);
  // Retype a piece of text: `target` is {el} (a words block, or an element holding
  // only text) or {el, node} (text beside other things in its element: it is put in
  // a span of its own while it is typed in).
  const startEdit = useCallback(target => {
    finishEdit(true);
    const host = target.el, stage = stageOf(host), key = targetKey(target), id = stage.closest('[data-frame]').dataset.frame, piece = !!target.node;
    let el = host;
    if (piece) { el = document.createElement('span'); target.node.replaceWith(el); el.appendChild(target.node); }
    const words = !piece && isWords(el), original = words ? linesOf(el) : el.textContent;
    if (words) { el.textContent = original; el.style.whiteSpace = 'pre-wrap'; } // (in a chat box given a width, the lines wrap to it as you type)
    el.contentEditable = 'plaintext-only';
    const ed = {el, frame: id, key, words, original, piece};
    ed.onInput = () => { if (words) drawShape(stage, editsRef.current.frames[id]); setTick(t => t + 1); };
    ed.onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); finishEdit(false); }
      else if (event.key === 'Enter' && (!words || event.ctrlKey || event.metaKey)) { event.preventDefault(); finishEdit(true); }
      else if (event.key === 'Tab') { // on to the next text of this asset (Shift: the one before), like the cells of a table
        event.preventDefault();
        const root = host.closest('[data-sb-root]');
        finishEdit(true);
        const keys = root?.isConnected ? textKeysOf(root) : [], at = keys.indexOf(key), next = at < 0 ? null : keys[at + (event.shiftKey ? -1 : 1)];
        if (next) { pendingEdit.current = {frame: id, key: next}; setTick(t => t + 1); }
      }
      event.stopPropagation();
    };
    ed.onBlur = () => finishEdit(true);
    el.addEventListener('input', ed.onInput); el.addEventListener('keydown', ed.onKey); el.addEventListener('blur', ed.onBlur);
    editing.current = ed;
    el.focus();
    const range = document.createRange(); range.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }, [finishEdit]);

  // ---- Duplicating, removing, bringing in ----
  const pendingFocus = useRef(null);
  useEffect(() => { // a new frame that is out of sight: go to it
    const id = pendingFocus.current, p = id && board.frames[id];
    if (!p) return;
    pendingFocus.current = null;
    if (!intersects(visibleWorld(viewRef.current, sizeRef.current), {x: p.x, y: p.y, w: FRAME.w, h: FRAME.h})) focusFrame(id);
  }, [board, focusFrame]);
  // frames just added pop in (the ones after them slide over on their own)
  const [fresh, setFresh] = useState(() => new Set());
  const freshTimer = useRef(0);
  const markFresh = useCallback(ids => { setFresh(new Set(ids)); clearTimeout(freshTimer.current); freshTimer.current = setTimeout(() => setFresh(new Set()), 900); }, []);
  const addBlankAfter = useCallback(after => {
    const made = addBlank(editsRef.current, after);
    commit(made.edits);
    setHoverGap(null);
    markFresh([made.id]);
    pendingFocus.current = made.id;
    setSelection({frame: made.id, key: null, depth: 0}); setFrameSel([made.id]);
  }, [commit, markFresh]);
  const duplicate = useCallback(ids => {
    if (trashing) { setStatus('Frames in the Trash are not duplicated: copy one and paste it on a storyboard.'); return; }
    let cur = editsRef.current;
    const made = [];
    for (const id of ids) {
      const scene = cellsRef.current.anchors.get(id), r = scene ? duplicateVideo(cur, scene) : addCopy(cur, {from: id, after: id, inherit: id}); // (a video is duplicated whole: its slides, as a video right after it)
      cur = r.edits; made.push(scene ? r.anchor : r.id);
    }
    if (!made.length) return;
    commit(cur);
    markFresh(made);
    pendingFocus.current = made[0];
    setSelection({frame: made[0], key: null, depth: 0}); setFrameSel(made);
  }, [commit, markFresh, trashing]);
  // ---- Deleting a frame: it goes to the Trash ----
  // The Trash keeps what was deleted for as long as the delete stands: undoing it takes the frame
  // out of the Trash again, and redoing it puts it back. The states of the history that deleted
  // frames are remembered (`deletes`) and what the Trash holds is brought in line with them.
  const deletes = useRef(new WeakMap()), inTrash = useRef(new Set()), trashQueue = useRef(Promise.resolve());
  const [toast, setToast] = useState(null);
  const notify = useCallback((text, extra) => setToast({text, ...extra}), []);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(null), 7000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (trashing) return;
    const kept = states => states.map(state => deletes.current.get(state)).filter(Boolean);
    const queue = (work, failed) => { trashQueue.current = trashQueue.current.then(work).catch(error => setStatus(`${failed} (${error.message})`)); };
    for (const d of kept([...history.past, history.present])) if (!inTrash.current.has(d.id)) { inTrash.current.add(d.id); queue(() => changeTrash(e => addToTrash(e, d.entries, d.at).edits), 'It was deleted but could not be kept in the Trash'); }
    for (const d of kept(history.future)) if (inTrash.current.has(d.id)) { inTrash.current.delete(d.id); queue(() => changeTrash(e => removeFromTrash(e, d.entries.map(entry => entry.id))), 'It is back, but its copy could not be taken out of the Trash'); }
  }, [history, trashing]);
  // (each one goes to the Trash with the name of its line; `then` changes the board in the same step: a line deleted with them)
  const deleteFrames = useCallback((ids, {then = null, message = null} = {}) => {
    const cur = editsRef.current, frames = allFramesRef.current.filter(f => ids.includes(f.id));
    if (!frames.length && !then) return;
    const at = new Date().toISOString(), batch = `${Date.parse(at).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const board = {id: videoId, name: video.name, chapters: linesRef.current, stage: video.stage};
    const clip = frames.length ? copyFrames({frames, edits: cur, htmlOf: hash => cur.library[hash] ?? video.assets[hash], stage: video.stage, video: videoId}) : {items: []};
    const entries = clip.items.map((item, i) => trashEntry({item, frame: frames[i], board, at, id: `trash-${batch}-${i + 1}`}));
    let next = frames.reduce((e, f) => deleteFrame(e, f.id), cur);
    if (then) next = then(next);
    if (next === cur) return;
    if (entries.length) deletes.current.set(next, {id: batch, at, entries});
    commit(next);
    setSelection(null); setFrameSel([]); setPicked(null);
    notify(message ?? (frames.length > 1 ? `${frames.length} frames moved to the Trash` : `Frame ${boardRef.current.frames[frames[0].id]?.index ?? ''} moved to the Trash`), {open: entries.length > 0});
  }, [commit, notify, video, videoId]);
  const removeSelected = useCallback(() => {
    const s = selRef.current;
    if (!s) return;
    const cur = editsRef.current;
    if (s.key) {
      const items = itemsNow();
      if (items.some(({key}) => key.includes('/'))) { setStatus('Select the whole asset (Esc) to take it out.'); return; }
      const brought = new Set(items.flatMap(({frame}) => (cur.frames[frame]?.inserts ?? []).map(l => `${frame}\n${l.key}`)));
      commit(items.reduce((e, {frame, key}) => (brought.has(`${frame}\n${key}`) ? removeInsert(e, frame, key) : hideLayer(e, frame, key)), cur));
      setSelection({frame: s.frame, key: null, depth: 0}); setPicked(null); setFrameSel([s.frame]);
      return;
    }
    const ids = [...new Set(frameSelRef.current.length ? frameSelRef.current : [s.frame])].filter(id => byIdRef.current[id]);
    if (!ids.length) return;
    if (trashing) { // from the Trash a frame is gone for good (Ctrl+Z brings it back until the page is closed)
      commit(e => removeFromTrash(e, ids));
      setSelection(null); setFrameSel([]);
      notify(`${ids.length > 1 ? `${ids.length} frames` : 'The frame'} deleted from the Trash for good`);
      return;
    }
    const videos = cellsRef.current, all = withSlides(ids, videos), one = ids.length === 1 && videos.anchors.get(ids[0]); // (a video goes with all its slides)
    deleteFrames(all, one ? {message: `The video “${one.name}” and its ${all.length} frames moved to the Trash`} : {});
  }, [commit, deleteFrames, notify, trashing]);

  // ---- Lines: picked by their label (click), renamed on it (double-click), added, duplicated, deleted ----
  const lineFrames = id => allFramesRef.current.filter(f => f.chapter === id);
  const showLineAs = useCallback((id, view) => commit(e => setLineView(e, id, view, view === 'slides' ? slidesOrder(e, id, allFramesRef.current) : null)), [commit]); // (a line of videos: as videos, or as the slides they are made of)
  const pickLine = useCallback(id => { setLineSel(id); setSelection(null); setFrameSel([]); setPicked(null); }, []);
  useEffect(() => { if (selection) setLineSel(null); }, [selection]);
  const addLineAfter = useCallback(after => {
    if (trashing) return;
    const made = addLine(editsRef.current, {after});
    commit(made.edits);
    pickLine(made.id); setLineEdit(made.id);
  }, [commit, pickLine, trashing]);
  const renameLineTo = useCallback((id, title) => {
    const text = String(title ?? '').replace(/\s+/g, ' ').trim(), line = linesRef.current.find(l => l.id === id);
    if (text && line && text !== line.title) commit(e => renameLine(e, id, text));
  }, [commit]);
  const duplicateLineOf = useCallback(id => {
    const line = linesRef.current.find(l => l.id === id);
    if (!line || trashing) return;
    const made = duplicateLine(editsRef.current, line, lineFrames(id));
    commit(made.edits);
    markFresh(made.ids);
    pickLine(made.id);
    setStatus(`Duplicated the line “${line.title}”`);
  }, [commit, markFresh, pickLine, trashing]);
  const deleteLineOf = useCallback(id => {
    const line = linesRef.current.find(l => l.id === id), ids = lineFrames(id).map(f => f.id);
    if (!line) return;
    setLineSel(null);
    if (trashing) { // from the Trash its frames are gone for good
      if (!ids.length) return;
      commit(e => removeFromTrash(e, ids));
      notify(`“${line.title}” deleted from the Trash for good`);
      return;
    }
    deleteFrames(ids, {then: e => hideLine(e, id), message: ids.length ? `The line “${line.title}” and its ${ids.length} frame${ids.length > 1 ? 's' : ''} moved to the Trash` : `The line “${line.title}” is deleted`});
  }, [commit, deleteFrames, notify, trashing]);

  // ---- A video's right-click menu (the user, 2026-10-30: "the video editor should open if I right click the video, and it should show multiple options like delete, duplicate,
  // export, and take to video editor"). A double-click on a video retypes a text in it, as it always did; the menu has the rest. `m` (what the player says and the board adds): {kind:
  // 'cell' (a video of a line of videos: its slides are frames of the line) | 'run' (the video of some lines: it plays them), key, title, at (the second it is on), point (where on its
  // picture, or null), shelf (the line a run stands in, if it is on a shelf), lines (the lines a run plays)} ----
  const videoMenu = useCallback((event, m) => setCtx({x: event.clientX, y: event.clientY, video: m}), []);
  const duplicateVideoOf = useCallback(m => {
    if (m.kind === 'cell') { duplicate([m.key]); return; }
    if (m.shelf) return; // (a video stands once on a line)
    let cur = editsRef.current;
    const made = [];
    for (const id of m.lines) { // (the video is made of its lines: they are copied, each right after its own)
      const line = linesRef.current.find(l => l.id === id);
      if (!line) continue;
      const r = duplicateLine(cur, line, lineFrames(id));
      cur = r.edits; made.push(...r.ids);
    }
    if (!made.length) return;
    commit(cur);
    markFresh(made);
    setStatus(`Duplicated the ${m.lines.length} line${m.lines.length > 1 ? 's' : ''} of “${m.title}” (the copies are lines of slides: a video is made of the lines it plays)`);
  }, [commit, duplicate, markFresh]);
  const deleteVideoOf = useCallback(m => {
    if (m.kind === 'cell') { // the video and all its slides go to the Trash
      const all = withSlides([m.key], cellsRef.current);
      deleteFrames(all, {message: `The video “${m.title}” and its ${all.length} frames moved to the Trash`});
      return;
    }
    if (m.shelf) { // a video on a line of videos: taken off it (its lines stay as they are)
      const kept = (editsRef.current.lines?.added?.[m.shelf]?.shelf ?? []).filter(id => id !== m.key);
      commit(e => setLineShelf(e, m.shelf, kept));
      setVideoSel(null);
      notify(`“${m.title}” taken off its line. Its lines are untouched (Ctrl+Z puts it back).`);
      return;
    }
    const ids = m.lines.flatMap(id => lineFrames(id).map(f => f.id)); // the video of some lines: they go to the Trash with it
    deleteFrames(ids, {then: e => m.lines.reduce((cur, id) => hideLine(cur, id), e), message: `The video “${m.title}”, its ${m.lines.length} line${m.lines.length > 1 ? 's' : ''} and ${ids.length} frames moved to the Trash`});
    setVideoSel(null);
  }, [commit, deleteFrames, notify]);
  // A comment placed from the menu: a pin at the click, at the second the video is on, picked, with the keyboard in its words
  const addCommentAt = useCallback(m => {
    if (!m.point) return;
    const id = commentOps.addTo(m.title, {x: m.point.x, y: m.point.y, at: m.at, text: ''});
    if (!id) return;
    pickPin(m.key, m.title, id);
    setTimeout(() => document.querySelector('.sb-cm-text')?.focus(), 150); // (once the inspector is drawn)
  }, [commentOps, pickPin]);
  // The video editor opened on a comment: at its second, with it picked
  const openAtComment = useCallback((key, c) => { openVideo(key, c.at); veSelect({type: 'comment', id: c.id}); }, [openVideo, veSelect]);
  // What a video of the board is handed for its pins (`pins` of components/StoryboardPlayer.jsx)
  const pinsFor = useCallback((key, title) => ({
    list: videoCommentsOf(boardEdits, title),
    picked: pinSel && pinSel.title === title ? pinSel.id : null,
    pick: c => pickPin(key, title, c.id),
    move: (c, xy) => commentOps.changeIn(title, c.id, xy),
    menu: (event, c) => { pickPin(key, title, c.id); setCtx({x: event.clientX, y: event.clientY, pin: {key, title, id: c.id}}); },
    add: (point, at) => { addCommentAt({key, title, point, at}); setTool('move'); }, // (the Comment tool: a click on the picture; the tool is put down after one comment, as the editor's is)
  }), [boardEdits, pinSel, pickPin, commentOps, addCommentAt]);
  const addFrameIn = useCallback(id => {
    const list = lineFrames(id);
    if (list.length) { addBlankAfter(list.at(-1).id); return; }
    const made = addBlankIn(editsRef.current, id);
    commit(made.edits);
    markFresh([made.id]);
    pendingFocus.current = made.id;
    setSelection({frame: made.id, key: null, depth: 0}); setFrameSel([made.id]);
  }, [addBlankAfter, commit, markFresh]);
  const moveFrameToLine = useCallback((id, line) => { commit(e => moveFrame(e, baseFramesRef.current, id, line, lineFrames(line).filter(f => f.id !== id).length, followersOf(cellsRef.current))); pendingFocus.current = id; }, [commit]);

  const frameAtCenter = useCallback(() => {
    const c = toWorld(viewRef.current, {x: sizeRef.current.w / 2, y: sizeRef.current.h / 2});
    let best = null, nearest = Infinity;
    for (const f of byIdRef.current ? Object.values(byIdRef.current) : []) {
      const p = boardRef.current.frames[f.id];
      if (!p) continue;
      const d = (p.x + FRAME.w / 2 - c.x) ** 2 + (p.y + FRAME.h / 2 - c.y) ** 2;
      if (d < nearest) { nearest = d; best = f.id; }
    }
    return best;
  }, []);
  // ---- Stacking: Ctrl+] brings the picked assets forward, Ctrl+[ sends them back (Shift: to the front / back) ----
  const reorderSelected = how => {
    if (!selRef.current?.key || trashing) return;
    let next = editsRef.current, changed = false;
    for (const {frame, keys} of groupsNow()) {
      const f = byIdRef.current[frame];
      if (!f) continue;
      const after = moveLayers(next, f, [...new Set(keys.map(layerKeyOf))], how);
      if (after !== next) { next = after; changed = true; }
    }
    if (!changed) { setStatus(how === 'forward' || how === 'front' ? 'Already on top.' : 'Already at the back.'); return; }
    commit(next);
    setStatus({forward: 'Brought forward', backward: 'Sent backward', front: 'Brought to the front', back: 'Sent to the back'}[how]);
  };
  // ---- Copy, cut, paste ----
  // The picked assets (or, with no asset picked, the picked frames) are copied with
  // their own HTML and changes, so they can be pasted on any frame of any board.
  const copySelected = useCallback(() => {
    const s = selRef.current, line = lineSelRef.current, cur = editsRef.current, htmlOf = hash => cur.library[hash] ?? video.assets[hash];
    if (!s && !line) return false;
    let clip;
    if (!s) clip = copyFrames({frames: lineFrames(line), edits: cur, htmlOf, stage: video.stage, video: videoId}); // a line picked by its label: its frames
    else if (s.key) { // the assets picked, in one frame or several
      const groups = groupsNow().map(g => ({frame: byIdRef.current[g.frame], edit: cur.frames[g.frame], keys: g.keys})).filter(g => g.frame);
      clip = groups.length && copyPicks({groups, htmlOf, stage: video.stage, video: videoId});
    } else {
      const ids = new Set(withSlides(frameSelRef.current.length ? frameSelRef.current : [s.frame], cellsRef.current)); // (a video is copied with all its slides)
      clip = copyFrames({frames: allFramesRef.current.filter(f => ids.has(f.id)), edits: cur, htmlOf, stage: video.stage, video: videoId});
    }
    if (!clip?.items.length) return false;
    const kept = keepClip(clip), count = clip.items.length, what = clip.kind === 'frames' ? `frame${count > 1 ? 's' : ''}` : `asset${count > 1 ? 's' : ''}`;
    try { navigator.clipboard?.writeText('Taskmaverick storyboard').catch(() => {}); } catch {} // what the system clipboard held (a picture) is no longer the last thing copied
    setStatus(`Copied ${count} ${what}${kept ? '' : ' (too big to take to another board)'}`);
    return true;
  }, [video, videoId]);
  const paste = useCallback(() => {
    if (trashing) { setStatus('The Trash only keeps deleted frames: paste on a storyboard.'); return; }
    const clip = readClip(), cur = editsRef.current;
    if (!clip) { setStatus('Nothing to paste: copy an asset or a frame first (Ctrl+C).'); return; }
    const line = !selRef.current && lineSelRef.current;
    if (line && clip.kind === 'frames') { // onto a line picked by its label: at its end
      const after = lineFrames(line).at(-1)?.id ?? baseFramesRef.current[0]?.id;
      if (!after) return;
      const made = pasteFrames(cur, clip.items, {after, known: id => clip.video === videoId && !!byIdRef.current[id]});
      if (!made.ids.length) return;
      commit(intoLine(made.edits, made.ids, line));
      markFresh(made.ids);
      pendingFocus.current = made.ids[0];
      setSelection({frame: made.ids[0], key: null, depth: 0}); setFrameSel(made.ids); setPicked(null);
      setStatus(`Pasted ${made.ids.length} frame${made.ids.length > 1 ? 's' : ''}`);
      return;
    }
    const target = selRef.current?.frame ?? frameAtCenter();
    if (!target || !byIdRef.current[target]) return;
    if (clip.kind === 'frames') {
      const order = baseFramesRef.current.map(f => f.id), chosen = frameSelRef.current.filter(id => order.includes(id));
      const after = chosen.length ? chosen.sort((a, b) => order.indexOf(a) - order.indexOf(b)).at(-1) : target; // right after the last frame picked
      const made = pasteFrames(cur, clip.items, {after, known: id => clip.video === videoId && !!byIdRef.current[id]});
      if (!made.ids.length) return;
      commit(made.edits);
      markFresh(made.ids);
      pendingFocus.current = made.ids[0];
      setSelection({frame: made.ids[0], key: null, depth: 0}); setFrameSel(made.ids); setPicked(null);
      setStatus(`Pasted ${made.ids.length} frame${made.ids.length > 1 ? 's' : ''}`);
      return;
    }
    const made = pasteLayers(cur, byIdRef.current[target], clip.items, {nudge: clip.video === videoId && clip.from === target}); // (a copy of its own, on any board: nothing is linked)
    if (!made.keys.length) return;
    commit(made.edits);
    setSelection({frame: target, key: made.keys.at(-1), depth: 0}); setFrameSel([target]); setPicked(made.keys.length > 1 ? {items: picksOf(target, made.keys)} : null);
    setStatus(`Pasted ${made.keys.length} asset${made.keys.length > 1 ? 's' : ''}`);
  }, [commit, frameAtCenter, markFresh, trashing, videoId]);

  // ---- Pictures: pasted from the clipboard, or dropped on a frame ----
  const addImages = useCallback(async (files, target, at) => {
    if (!target || !byIdRef.current[target]) return;
    setStatus('Adding the picture…');
    const loaded = [];
    for (const file of files) {
      try { const url = await saveImage(file); loaded.push({url, ...(await imageSize(url)), name: (file.name || '').replace(/\.[a-z0-9]+$/i, '').slice(0, 40) || 'Image'}); }
      catch (error) { setStatus(`The picture was not added: ${error.message}.`); }
    }
    const frame = byIdRef.current[target];
    if (!loaded.length || !frame) return;
    const keys = [];
    const next = loaded.reduce((cur, image, i) => {
      const made = imageInsert({...image, taken: new Set(layersOf(frame, cur.frames[target]).map(l => l.key)), count: (cur.frames[target]?.inserts ?? []).length, at: at ? {x: at.x + i * 28, y: at.y + i * 28} : null});
      keys.push(made.inserts[0].key);
      return addInserts(cur, target, made.inserts, made.library);
    }, editsRef.current);
    commit(next);
    setSelection({frame: target, key: keys.at(-1), depth: 0}); setFrameSel([target]); setPicked(keys.length > 1 ? {items: picksOf(target, keys)} : null);
    setStatus(`Added ${keys.length} picture${keys.length > 1 ? 's' : ''}`);
  }, [commit]);
  // The frame under a screen point, and the point in that frame's stage px.
  const frameAt = (x, y) => {
    const el = document.elementsFromPoint(x, y).map(node => node.closest?.('[data-frame]')).find(Boolean), id = el?.dataset.frame;
    if (!id || !byIdRef.current[id]) return null;
    const art = el.querySelector('[data-art]').getBoundingClientRect();
    return {id, art, cell: el.classList.contains('is-cell'), at: {x: (x - art.left) / art.width * STAGE, y: (y - art.top) / art.height * FRAME.h}};
  };
  // ---- References: a file put on the canvas stays where it was put, a blank space too, any kind of file (lib/storyboardRefs.mjs). A picture put ON the picture of a frame still goes in that frame, at that point. ----
  const worldAt = useCallback((x, y) => { const r = viewport.current.getBoundingClientRect(); return toWorld(viewRef.current, {x: x - r.left, y: y - r.top}); }, []);
  const pickRef = useCallback(id => { setSelection(null); setFrameSel([]); setPicked(null); setLineSel(null); setVideoSel(null); setPinSel(null); setRefSel(id); }, []);
  const addReferences = useCallback(async (files, at) => {
    setStatus(`Adding ${files.length > 1 ? `${files.length} files` : files[0].name || 'the file'}…`);
    const {made, failed} = await makeRefs(files, at, viewRef.current.zoom);
    if (made.length) { commit(cur => addRefs(cur, made)); pickRef(made.at(-1).id); }
    setStatus(failed.length ? `Not added: ${failed[0]}` : `Added ${made.length} reference${made.length > 1 ? 's' : ''}`);
  }, [commit, pickRef, setStatus]);
  const moveRef = useCallback((id, box) => commit(cur => changeRef(cur, id, box)), [commit]);
  const deleteRef = useCallback(id => { commit(cur => removeRef(cur, id)); setRefSel(null); }, [commit]);
  const refZoom = useCallback(() => viewRef.current.zoom, []), refFree = useCallback(() => !spaceRef.current && (toolRef.current === 'move' || toolRef.current === 'scale'), []);
  const refMenu = useCallback((event, item) => setCtx({x: event.clientX, y: event.clientY, ref: item}), []);
  const inArt = over => !!over && !over.cell && over.at.x >= 0 && over.at.x <= STAGE && over.at.y >= 0 && over.at.y <= FRAME.h;
  // The browser never drags anything of a frame (a picture, a link, words picked): it would cancel the board's move and drop the picture back as a file, a copy (the user, 2026-11-06: "when I try
  // to change position of some things like the images, it just duplicate it")
  const onDragStart = event => { const el = event.target?.nodeType === 1 ? event.target : event.target?.parentElement; if (el?.closest?.('.sb-stage')) event.preventDefault(); }; // (not the notes under it)
  const onDragOver = event => { if ([...event.dataTransfer.types].includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } };
  const onDrop = event => {
    if (![...event.dataTransfer.types].includes('Files')) return;
    event.preventDefault();
    const files = [...event.dataTransfer.files], over = frameAt(event.clientX, event.clientY), pictures = inArt(over) ? files.filter(isImage) : [], others = files.filter(f => !pictures.includes(f));
    if (pictures.length) addImages(pictures, over.id, over.at);
    if (others.length) addReferences(others, worldAt(event.clientX, event.clientY));
  };
  // Ctrl/⌘ + C, X, V come as the browser's own copy / cut / paste, so a picture in the clipboard can be read.
  useEffect(() => {
    const busy = event => isTyping(event.target) || editing.current || !!vEditRef.current; // (the video editor open: it copies and pastes its own)
    const mark = event => { try { event.clipboardData?.setData('text/plain', 'Taskmaverick storyboard'); } catch {} event.preventDefault(); };
    const onCopy = event => { if (!busy(event) && copySelected()) mark(event); };
    const onCut = event => { if (!busy(event) && copySelected()) { mark(event); removeSelected(); } };
    const onPaste = event => {
      if (busy(event)) return;
      const all = [...(event.clipboardData?.files ?? [])], spot = pointerAt.current, under = spot ? frameAt(spot.x, spot.y) : null, frame = selRef.current?.frame ?? (inArt(under) ? under.id : null);
      event.preventDefault();
      if (!all.length) { paste(); return; }
      const pictures = frame ? all.filter(isImage) : [], others = all.filter(f => !pictures.includes(f)); // (a picture: in the frame picked, or under the pointer; anything else, or over a blank space: a reference there)
      if (pictures.length) addImages(pictures, frame, null);
      if (others.length) addReferences(others, spot ? worldAt(spot.x, spot.y) : toWorld(viewRef.current, {x: sizeRef.current.w / 2, y: sizeRef.current.h / 2}));
    };
    window.addEventListener('copy', onCopy); window.addEventListener('cut', onCut); window.addEventListener('paste', onPaste);
    return () => { window.removeEventListener('copy', onCopy); window.removeEventListener('cut', onCut); window.removeEventListener('paste', onPaste); };
  });

  // ---- Alt+drag: a duplicate pulled out of an asset, dropped in its frame or another one ----
  // While it is dragged, the duplicate is a stage of its own drawn over the board (so it
  // shows across frames); the original does not move.
  const makeGhost = d => {
    const frame = byIdRef.current[d.frame], cur = editsRef.current, edit = cur.frames[d.frame], over = overlayRef.current;
    if (!frame || !over) return null;
    const keys = new Set(d.items.map(item => item.key)), art = d.stage.getBoundingClientRect(), base = viewport.current.getBoundingClientRect();
    const ghost = document.createElement('div'), shell = document.createElement('div'), fit = document.createElement('div'), stage = document.createElement('div');
    ghost.className = 'sb-ghost';
    shell.className = `${frame.shell ?? video.stage.shell ?? 'es-player demo-text-scope'} sb-player`;
    fit.className = 'ad-fit ad-fit--embed';
    stage.className = `${frame.stageClass ?? video.stage.className} sb-stage`;
    for (const [name, value] of Object.entries(parseStyle(frame.stageStyle ?? video.stage.style))) stage.style.setProperty(name, value);
    if (frame.scene.id) stage.dataset.scene = frame.scene.id;
    if (frame.scene.view) stage.dataset.view = frame.scene.view;
    stage.innerHTML = frameHtml(layersOf(frame, edit).filter(l => keys.has(l.key)), hash => cur.library[hash] ?? video.assets[hash], 'ghost-', frame.bubble);
    fit.appendChild(stage); shell.appendChild(fit); ghost.appendChild(shell); over.appendChild(ghost);
    ghost.style.transform = `scale(${art.width / STAGE})`;
    d.ghostAt = {left: art.left - base.left, top: art.top - base.top};
    applyEdits(stage, edit, cur.looks);
    return ghost;
  };
  const dropDuplicate = useCallback((d, event) => {
    const cur = editsRef.current;
    const [bx, by] = d.by ?? [event.clientX - d.client.x, event.clientY - d.client.y]; // (Shift may have kept it on one axis)
    const over = frameAt(d.client.x + bx, d.client.y + by), target = over?.id ?? d.frame;
    const from = d.stage.getBoundingClientRect(), to = over?.art ?? from, u = from.width / STAGE;
    const shift = [(bx - (to.left - from.left)) / u, (by - (to.top - from.top)) / u];
    const clip = copyLayers({frame: byIdRef.current[d.frame], edit: cur.frames[d.frame], keys: d.items.map(item => item.key), htmlOf: hash => cur.library[hash] ?? video.assets[hash], stage: video.stage, video: videoId});
    const made = pasteLayers(cur, byIdRef.current[target], clip.items, {shift}); // (a copy of its own: nothing is linked)
    if (!made.keys.length) return;
    commit(made.edits);
    setSelection({frame: target, key: made.keys.at(-1), depth: 0}); setFrameSel([target]); setPicked(made.keys.length > 1 ? {items: picksOf(target, made.keys)} : null);
    setStatus(`Duplicated ${made.keys.length} asset${made.keys.length > 1 ? 's' : ''}`);
  }, [commit, video, videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shift+A: the product's UI as a grid of thumbnails by category (captured from the
  // product by gen:storyboard, plus the hand, the speech bubble and the spotlight).
  // Choosing one adds just that piece to the frame.
  const [parts, setParts] = useState(null);
  const [guides, setGuides] = useState(NO_GUIDES);         // the red lines an asset being dragged snapped to
  const partsLoad = useRef(null);
  const loadParts = useCallback(() => {
    partsLoad.current ??= fetch('/storyboard/ui-parts.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(found => { setParts(found); return found; });
    return partsLoad.current;
  }, []);
  const list = useMemo(() => partList(parts), [parts]);
  const openMenu = useCallback(() => {
    if (trashing) return;
    const target = selRef.current?.frame ?? frameAtCenter();
    if (!target) return;
    setMenu({query: '', index: 0, target});
    loadParts();
  }, [frameAtCenter, loadParts, trashing]);
  const results = useMemo(() => (menu ? searchParts(menu.query, list) : []), [menu?.query, list]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => groupParts(results), [results]);
  useEffect(() => { if (menu) menuInput.current?.focus(); }, [menu !== null]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (menu) document.querySelector('.sb-tile.is-on')?.scrollIntoView({block: 'nearest'}); }, [menu?.index, menu?.query]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = useCallback(async (id, target) => {
    setMenu(null);
    const catalog = parts ?? await loadParts(), into = byIdRef.current[target], cur = editsRef.current;
    if (!into) return;
    const made = partInsert({id, catalog, taken: new Set(layersOf(into, cur.frames[target]).map(l => l.key)), count: (cur.frames[target]?.inserts ?? []).length});
    if (!made) { setStatus('That is not captured yet. Run npm run gen:storyboard.'); return; }
    const bubble = made.inserts[0].kind === 'bubble' && made.inserts[0].key, added = addInserts(cur, target, made.inserts, made.library);
    commit(bubble ? setBoxSize(added, target, bubble, [BUBBLE_W, 0]) : added); // (a chat box: BUBBLE_W wide, not locked)
    setSelection({frame: target, key: made.inserts[0].key, depth: 0}); setFrameSel([target]);
  }, [parts, loadParts, commit]);

  // ---- Snapping while assets are dragged ----
  // Their box lines up with the frame's middle and edges and with the other assets' edges and
  // middles (Ctrl / ⌘ held: freely), lib/storyboardSnap.mjs; red guides show where. An Alt+drag copy
  // snaps in the frame it is over.
  const snapCtx = (d, frameId, stage) => {
    d.snapFrames ??= {};
    if (d.snapFrames[frameId]) return d.snapFrames[frameId];
    const S = stage.getBoundingClientRect(), u = S.width / STAGE, moving = new Set(d.items.filter(item => (item.frame ?? d.frame) === d.frame).map(item => layerKeyOf(item.key))); // (the assets picked in other frames are not in this stage)
    const others = [...stage.querySelectorAll('[data-sb-root]')]
      .filter(el => !el.parentElement?.closest('[data-sb-root]') && (d.dup || frameId !== d.frame || !moving.has(el.dataset.sbRoot)) && el.dataset.sbRoot !== 'dim')
      .filter(el => isBubble(el) || (getComputedStyle(el).visibility !== 'hidden' && Number(getComputedStyle(el).opacity) > 0.05))
      .map(el => stageBoxOf(stage, el));
    return (d.snapFrames[frameId] = {S, u, targets: snapTargets(FRAME, others)});
  };
  const snapDrag = (d, dx, dy, event, axes) => {
    d.box0 ??= union(d.items.filter(item => (item.frame ?? d.frame) === d.frame).map(item => stageBoxOf(d.stage, item.el))); // where the dragged box was in the frame pressed (stage px), before it moved; assets picked in other frames go the same way
    d.from ??= d.stage.getBoundingClientRect();
    let frameId = d.frame, stage = d.stage;
    if (d.dup) { const over = frameAt(event.clientX, event.clientY); if (over && over.id !== d.frame) { frameId = over.id; stage = stageFor(over.id) ?? d.stage; } }
    if (!d.box0) return [dx, dy];
    const c = snapCtx(d, frameId, stage), box = {...d.box0, x: d.box0.x + (dx + d.from.left - c.S.left) / c.u, y: d.box0.y + (dy + d.from.top - c.S.top) / c.u};
    const s = snapBox(box, c.targets, SNAP_REACH / c.u, axes), base = viewport.current.getBoundingClientRect();
    setGuides(s.guides.length ? s.guides.map(g => (g.axis === 'x'
      ? {axis: 'x', left: c.S.left - base.left + g.at * c.u, top: c.S.top - base.top + g.from * c.u, size: (g.to - g.from) * c.u}
      : {axis: 'y', left: c.S.left - base.left + g.from * c.u, top: c.S.top - base.top + g.at * c.u, size: (g.to - g.from) * c.u})) : NO_GUIDES);
    return [dx + s.dx * c.u, dy + s.dy * c.u];
  };

  // ---- Carrying frames to another place ----
  // Holding a frame's number bar lifts it: it follows the pointer and the others slide apart to make
  // room where it would land. Frames picked together (a rectangle, Shift+click) are carried together,
  // all of them, side by side as they were; they land side by side. The frame held never animates: it
  // stays under the pointer, and letting go puts them straight in their place.
  // put the carried frames down without a glide: nothing about them animates until they are in their place
  const land = el => {
    el.style.transition = 'none'; el.classList.remove('is-dragging'); el.style.transform = '';
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = ''; }));
  };
  const frameNode = id => viewport.current?.querySelector(`[data-frame="${CSS.escape(id)}"]`);
  const placeCarried = useCallback(() => {
    const d = drag.current;
    if (!d || d.type !== 'reorder' || !d.started) return;
    for (const id of d.ids) { // each one keeps its distance from the one held
      const el = frameNode(id), p = boardRef.current.frames[id], rel = d.rel[id];
      if (el && p && rel) el.style.transform = `translate(${d.floatX + rel.x - p.x}px,${d.floatY + rel.y - (p.y - HEAD)}px) scale(1.015)`;
    }
  }, []);
  useLayoutEffect(() => { placeCarried(); }, [board, placeCarried]); // their place changed: keep them under the pointer
  const cancelReorder = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    if (d?.raf) cancelAnimationFrame(d.raf);
    for (const id of d?.ids ?? []) { const el = frameNode(id); if (el) land(el); }
    setReorder(null);
  }, []);
  // ---- Carrying a whole line by its label: the label and its frames follow the pointer up and down, the other lines make room ----
  const lineNodes = id => [viewport.current?.querySelector(`[data-sb-row="${CSS.escape(id)}"]`), viewport.current?.querySelector(`[data-sb-empty="${CSS.escape(id)}"]`), ...baseFramesRef.current.filter(f => f.chapter === id).map(f => frameNode(f.id))].filter(Boolean);
  const placeLine = useCallback(() => {
    const d = drag.current;
    if (!d || d.type !== 'line-move' || !d.started) return;
    const row = boardRef.current.rows.find(r => r.chapter.id === d.id);
    if (!row) return;
    for (const el of lineNodes(d.id)) { el.style.transition = 'none'; el.style.zIndex = 40; el.style.transform = `translateY(${d.floatY - row.y}px)`; }
  }, []);
  useLayoutEffect(() => { placeLine(); }, [board, placeLine]); // the lines made room: keep the one carried under the pointer
  const landLine = id => { // put it down without a glide
    for (const el of lineNodes(id)) {
      el.style.transition = 'none'; el.style.transform = ''; el.style.zIndex = '';
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = ''; }));
    }
  };
  const cancelLineMove = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    if (d) landLine(d.id);
    setLineMove(null);
  }, []);
  const startReorder = (id, event) => {
    // pressing one of the frames picked together holds them all (Shift: picks or drops one, no carrying)
    const held = !event.shiftKey && frameSelRef.current.length > 1 && frameSelRef.current.includes(id) ? frameSelRef.current : null;
    if (held) setSelection({frame: id, key: null, depth: 0}); else selectFrame(id, event.shiftKey);
    const p = boardRef.current.frames[id];
    if (!p || event.shiftKey) return;
    const ids = held ? baseFramesRef.current.filter(f => held.includes(f.id) && boardRef.current.frames[f.id]).map(f => f.id) : [id];
    const rel = Object.fromEntries(ids.map(other => [other, {x: boardRef.current.frames[other].x - p.x, y: boardRef.current.frames[other].y - p.y}]));
    const rect = viewport.current.getBoundingClientRect(), world = toWorld(viewRef.current, {x: event.clientX - rect.left, y: event.clientY - rect.top});
    begin({type: 'reorder', id, ids, rel, origin: {x: event.clientX, y: event.clientY}, client: {x: event.clientX, y: event.clientY}, grab: {x: world.x - p.x, y: world.y - (p.y - HEAD)}, started: false});
  };
  // ---- Dragging and clicking ----
  const begin = state => { drag.current = state; };
  useEffect(() => {
    // while a frame is carried, every frame: scroll the board if the pointer is at an edge, keep the frame under the pointer, work out where it would land
    const carry = () => {
      const d = drag.current;
      if (!d || d.type !== 'reorder' || !d.started) return;
      const rect = viewport.current.getBoundingClientRect(), local = {x: d.client.x - rect.left, y: d.client.y - rect.top};
      const edge = 90, lean = (near, far) => (near < edge ? 1 - Math.max(0, near) / edge : far < edge ? -(1 - Math.max(0, far) / edge) : 0);
      const dx = 22 * lean(local.x, rect.width - local.x), dy = 22 * lean(local.y, rect.height - local.y);
      if (dx || dy) showView(panBy(viewRef.current, dx, dy));
      const world = toWorld(viewRef.current, local);
      d.floatX = world.x - d.grab.x; d.floatY = world.y - d.grab.y;
      const target = referenceRef.current && dropTarget(referenceRef.current, baseFramesRef.current.filter(f => !d.ids.includes(f.id)), {x: d.floatX + FRAME.w / 2, y: d.floatY + HEAD + FRAME.h / 2});
      if (target) setReorder(r => (r && r.chapter === target.chapter && r.index === target.index ? r : {id: d.id, ids: d.ids, ...target}));
      placeCarried();
      d.raf = requestAnimationFrame(carry);
    };
    const startCarry = d => {
      d.started = true; d.floatX = 0; d.floatY = 0;
      const all = baseFramesRef.current, chapter = all.find(f => f.id === d.id)?.chapter, lead = all.findIndex(f => f.id === d.id);
      // where it is now, counting the frames that stay (the ones carried are not in the row while they are carried)
      setReorder({id: d.id, ids: d.ids, chapter, index: all.filter((f, i) => i < lead && f.chapter === chapter && !d.ids.includes(f.id)).length});
      setHoverGap(null);
      d.raf = requestAnimationFrame(carry);
    };
    const move = event => {
      const d = drag.current;
      if (!d) return;
      const rect = viewport.current.getBoundingClientRect(), local = {x: event.clientX - rect.left, y: event.clientY - rect.top};
      if (d.type === 'maybe-move' && d.backdrop && !d.moved && Math.hypot(event.clientX - d.client.x, event.clientY - d.client.y) >= 3) { // dragged from something as big as the frame (a dim, a backdrop): that draws a rectangle
        drag.current = {type: 'pick', frame: d.frame, stage: d.stage, client: d.client, start: d.startLocal, add: false, base: [], moved: false, last: null};
        move(event);
        return;
      }
      if (d.type === 'pan') showView({...d.view, x: d.view.x + local.x - d.start.x, y: d.view.y + local.y - d.start.y});
      else if (d.type === 'rect') { // the rectangle being drawn
        const k = d.art.width / STAGE, to = {x: (event.clientX - d.art.left) / k, y: (event.clientY - d.art.top) / k};
        if (!d.moved && Math.hypot(event.clientX - (d.startLocal.x + rect.left), event.clientY - (d.startLocal.y + rect.top)) < 3) return;
        d.moved = true;
        d.box = rectFrom(d.from, to, {square: event.shiftKey});
        setMarquee({x: d.startLocal.x + (d.box.x - d.from.x) * k + (d.box.x < d.from.x ? 0 : 0), y: d.startLocal.y + (d.box.y - d.from.y) * k, w: d.box.w * k, h: d.box.h * k});
      }
      else if (d.type === 'pick') { // a rectangle drawn in a frame: the assets it touches are picked (Shift: added to the ones picked)
        if (!d.moved && Math.hypot(event.clientX - d.client.x, event.clientY - d.client.y) < 3) return;
        d.moved = true;
        setMarquee({x: Math.min(d.start.x, local.x), y: Math.min(d.start.y, local.y), w: Math.abs(local.x - d.start.x), h: Math.abs(local.y - d.start.y)});
        const keys = assetsIn(d.stage, rectOf(d.client, {x: event.clientX, y: event.clientY}));
        const items = d.add ? keys.reduce((list, key) => addPick(list, {frame: d.frame, key}), d.base) : picksOf(d.frame, keys);
        if (d.last && samePicks(d.last, items)) return;
        d.last = items;
        if (!items.length) { setSelection({frame: d.frame, key: null, depth: 0}); setPicked(null); setFrameSel([d.frame]); }
        else { const last = items.at(-1); setSelection({frame: last.frame, key: last.key, depth: 0}); setPicked(items.length > 1 ? {items} : null); setFrameSel(framesOfPicks(items)); }
      }
      else if (d.type === 'marquee') {
        const a = toWorld(viewRef.current, d.start), b = toWorld(viewRef.current, local);
        const box = {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y)};
        setMarquee({x: Math.min(d.start.x, local.x), y: Math.min(d.start.y, local.y), w: Math.abs(local.x - d.start.x), h: Math.abs(local.y - d.start.y)});
        const ids = Object.keys(byIdRef.current).filter(id => { const p = boardRef.current.frames[id]; return p && intersects(box, {x: p.x, y: p.y, w: FRAME.w, h: FRAME.h}); });
        setFrameSel(d.add ? [...new Set([...d.base, ...ids])] : ids);
        setSelection(ids.length ? {frame: ids[0], key: null, depth: 0} : null);
      } else if (d.type === 'reorder') {
        const ax = event.clientX - d.origin.x, ay = event.clientY - d.origin.y; // Shift: along one axis
        d.client = event.shiftKey ? (Math.abs(ax) >= Math.abs(ay) ? {x: event.clientX, y: d.origin.y} : {x: d.origin.x, y: event.clientY}) : {x: event.clientX, y: event.clientY};
        if (!d.started && Math.hypot(ax, ay) >= 6) startCarry(d);
      } else if (d.type === 'line-move') {
        if (!d.started && Math.abs(event.clientY - d.origin.y) >= 6) { d.started = true; setHoverGap(null); }
        if (d.started) {
          d.floatY = toWorld(viewRef.current, local).y - d.grab; // (the line only goes up and down)
          const index = lineDropIndex(boardRef.current.rowHeight, linesRef.current.length - 1, d.floatY);
          setLineMove(r => (r && r.index === index ? r : {id: d.id, index}));
          placeLine();
        }
      } else if (d.type === 'draw') {
        const p = {x: (event.clientX - d.art.left) / d.art.width * STAGE, y: (event.clientY - d.art.top) / d.art.height * FRAME.h}, last = d.points.at(-1);
        if (Math.hypot(p.x - last.x, p.y - last.y) < 1) return;
        d.points.push(p); d.screen.push(`${local.x} ${local.y}`);
        inkRef.current?.setAttribute('d', `M${d.screen.join('L')}`);
      } else if (d.type === 'scale') {
        // the handle follows the pointer; the opposite corner (or side) stays where it was
        const h = d.handle, r = d.r0;
        let fx = h.includes('e') ? (event.clientX - r.left) / r.width : h.includes('w') ? (r.right - event.clientX) / r.width : 1;
        let fy = h.includes('s') ? (event.clientY - r.top) / r.height : h.includes('n') ? (r.bottom - event.clientY) / r.height : 1;
        fx = Math.max(0.05, fx); fy = Math.max(0.05, fy);
        const c = d.content, keeps = !!c || !d.kind.free || d.kind.keep !== event.shiftKey; // (the Scale tool, K: always its proportions)
        if (keeps) { const f = h.length === 2 ? Math.max(fx, fy) : h === 'e' || h === 'w' ? fx : fy; fx = f; fy = f; } // its proportions are kept
        if (d.lock.w) fx = 1; // a locked width or height stays as it is (keeping its proportions, it does not change at all)
        if (d.lock.h) fy = 1;
        if (keeps && (d.lock.w || d.lock.h)) { fx = 1; fy = 1; }
        if (c?.bubble) { // the Scale tool on a chat box: its words scale with it, its padding does not (lib/storyboardScale.mjs)
          const locked = d.lock.w || d.lock.h, f = locked ? 1 : contentFactor(h, r, {x: event.clientX, y: event.clientY}, {pad: [c.pad[0] * c.u, c.pad[1] * c.u], min: Math.max(0.05, 4 / c.size)});
          fx = f; fy = f;
          setTextNumbers(d.el, {size: c.size * f, lineHeight: c.own.lineHeight != null ? c.own.lineHeight * f : null, letterSpacing: c.own.letterSpacing != null ? c.own.letterSpacing * f : null});
          if (c.own.strokeWidth != null) d.el.dataset.sbStrokeWidth = String(c.own.strokeWidth * f);
          const [bw, bh] = scaledBox(c.box, c.pad, f);
          sizeTo(d.el, [c.given[0] ? bw : 0, c.given[1] ? bh : 0]); // (a side it was not given stays as big as its words)
        } else if (d.kind.mode === 'size') sizeTo(d.el, [d.size0[0] * fx, d.size0[1] * fy]); else scaleTo(d.el, [d.s0[0] * fx, d.s0[1] * fy]);
        d.f = [fx, fy];
        if (c && !c.bubble) { // the Scale tool on a box: the corners and the outline it was given scale with it
          if (c.own.radius != null) d.el.style.borderRadius = `${c.own.radius * fx}px`;
          if (c.own.strokeWidth != null) d.el.style.borderWidth = `${c.own.strokeWidth * fx}px`;
        }
        const now = screenRectOf(d.el), ax = h.includes('w') ? 'right' : h.includes('e') ? 'left' : null, ay = h.includes('n') ? 'bottom' : h.includes('s') ? 'top' : null;
        const sx = ax ? r[ax] - now[ax] : (r.left + r.right - now.left - now.right) / 2, sy = ay ? r[ay] - now[ay] : (r.top + r.bottom - now.top - now.bottom) / 2;
        const t = translateOf(d.el);
        moveTo(d.el, [t[0] + sx / d.k, t[1] + sy / d.k]);
        if (d.off) d.tips = {[d.key]: tipToMiddle(d.stage, d.el)}; // a tail that is off stays off
        if (isBubble(d.el)) drawShape(d.stage, editsRef.current.frames[d.frame], d.tips ?? null);
        d.moved = true;
        setTick(n => n + 1);
      } else if (d.type === 'group-scale') { // several picked, scaled together from the corner opposite the handle (startGroupScale)
        const h = d.handle, r = d.boxes[d.main];
        const fx = h.includes('e') ? (event.clientX - r.left) / Math.max(1, r.width) : (r.right - event.clientX) / Math.max(1, r.width);
        const fy = h.includes('s') ? (event.clientY - r.top) / Math.max(1, r.height) : (r.bottom - event.clientY) / Math.max(1, r.height);
        const f = Math.max(0.05, Math.max(fx, fy)), tips = {};
        for (const it of d.items) {
          const box = d.boxes[it.frame], ax = h.includes('w') ? box.right : box.left, ay = h.includes('n') ? box.bottom : box.top;
          if (!(it.lock.w || it.lock.h)) {
            if (it.font) setTextNumbers(it.el, {size: it.font * f, lineHeight: it.own.lineHeight != null ? it.own.lineHeight * f : null, letterSpacing: it.own.letterSpacing != null ? it.own.letterSpacing * f : null}); // (its words grow with it)
            if (it.bubble) { const [bw, bh] = scaledBox(it.box0, it.pad, f); sizeTo(it.el, [it.given[0] ? bw : 0, it.given[1] ? bh : 0]); } // (a side it was not given stays as big as its words)
            else if (it.kind.mode === 'size') sizeTo(it.el, [it.size0[0] * f, it.text ? 0 : it.size0[1] * f]);
            else scaleTo(it.el, [it.s0[0] * f, it.s0[1] * f]);
            if (!it.bubble && it.kind.mode === 'size' && it.el.dataset.sbBox !== 'drawing') { // (the corners and the outline it was given scale with it)
              if (it.own.radius != null) it.el.style.borderRadius = `${it.own.radius * f}px`;
              if (it.own.strokeWidth != null) it.el.style.borderWidth = `${it.own.strokeWidth * f}px`;
            }
          }
          const now = screenRectOf(it.el), t = translateOf(it.el); // its top left corner f times as far from the anchor as it was
          moveTo(it.el, [t[0] + (ax + (it.r0.left - ax) * f - now.left) / it.k, t[1] + (ay + (it.r0.top - ay) * f - now.top) / it.k]);
          if (it.off) (tips[it.frame] ??= {})[it.key] = tipToMiddle(it.stage, it.el); // (a tail that is off stays off)
        }
        for (const it of d.items) if (it.bubble && d.items.find(x => x.bubble && x.frame === it.frame) === it) drawShape(it.stage, editsRef.current.frames[it.frame], tips[it.frame] ?? null);
        d.f = f; d.tips = tips; d.moved = true;
        setTick(n => n + 1);
      } else if (d.type === 'maybe-move' || d.type === 'tip') {
        let dx = event.clientX - d.client.x, dy = event.clientY - d.client.y;
        if (!d.moved && Math.hypot(dx, dy) < 3) return;
        d.moved = true;
        let axes = {x: true, y: true};
        if (event.shiftKey) { if (Math.abs(dx) >= Math.abs(dy)) { dy = 0; axes = {x: true, y: false}; } else { dx = 0; axes = {x: false, y: true}; } } // Shift: straight across or straight up and down, like Figma
        if (d.type === 'maybe-move') { if (event.ctrlKey || event.metaKey) setGuides(NO_GUIDES); else [dx, dy] = snapDrag(d, dx, dy, event, axes); } // it lines up (Ctrl / ⌘: freely)
        d.by = [dx, dy];
        if (d.type === 'maybe-move' && d.dup) { // Alt: the original stays, a copy follows the pointer
          d.ghost ??= makeGhost(d);
          if (d.ghost) { d.ghost.style.left = `${d.ghostAt.left + dx}px`; d.ghost.style.top = `${d.ghostAt.top + dy}px`; }
        } else if (d.type === 'maybe-move') { // (the assets picked may be in several frames: each moves in its own)
          for (const item of d.items) moveTo(item.el, [item.t0[0] + dx / item.k, item.t0[1] + dy / item.k]);
          d.tipList = d.items.filter(item => item.tip0).map(item => ({frame: item.frame ?? d.frame, key: item.key, to: [item.tip0[0] + dx / item.k, item.tip0[1] + dy / item.k]})); // a tail that is off stays off: its point goes with its box
          d.tips = Object.fromEntries(d.tipList.filter(t => t.frame === d.frame).map(t => [t.key, t.to]));
          for (const frame of new Set(d.items.filter(item => isBubble(item.el)).map(item => item.frame ?? d.frame))) {
            const stage = frame === d.frame ? d.stage : stageFor(frame);
            if (stage) drawShape(stage, editsRef.current.frames[frame], Object.fromEntries(d.tipList.filter(t => t.frame === frame).map(t => [t.key, t.to])));
          }
        } else {
          d.delta = [d.t0[0] + dx / d.u, d.t0[1] + dy / d.u];
          drawShape(d.stage, editsRef.current.frames[d.frame], {key: d.key, delta: d.delta});
        }
        setTick(t => t + 1);
      }
    };
    const up = event => {
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      if (d.type === 'maybe-move') setGuides(NO_GUIDES);
      if (d.type === 'scale' && d.moved) { const given = editsRef.current.frames[d.frame]?.sizes?.[d.key], measured = d.kind.mode === 'size' ? sizeOf(d.el) : null; // (a chat box's side not dragged stays as it was: given, or 0 = as big as its words)
        const c = d.content, f = d.f?.[0] ?? 1, patch = c ? scaledStyles(c.own, c.bubble ? c.size : null, f) : {}; // (the Scale tool, K: the words and the numbers it was given scale too, in the same step)
        const box = measured && (c?.bubble ? [c.given[0] ? measured[0] : 0, c.given[1] ? measured[1] : 0] : d.kind.bubble ? measured.map((n, i) => (Math.abs((d.f?.[i] ?? 1) - 1) < 1e-6 ? given?.[i] ?? 0 : n)) : measured), scale = scaleOf(d.el), to = translateOf(d.el); const tip = d.tips?.[d.key];
        commit(e => { let cur = setMove(box ? setBoxSize(e, d.frame, d.key, box) : setScale(e, d.frame, d.key, scale), d.frame, d.key, to); if (Math.abs(f - 1) > 1e-6 && Object.keys(patch).length) cur = setStyle(cur, d.frame, d.key, patch); return tip ? setTip(cur, d.frame, d.key, tip) : cur; }); }
      if (d.type === 'group-scale' && d.moved) { // every one picked: its size or scale, its words, its place, its tail; one step of Undo
        const f = d.f;
        commit(e => d.items.reduce((cur, it) => {
          let out = cur;
          if (!(it.lock.w || it.lock.h)) {
            if (it.bubble) { const m = sizeOf(it.el); out = setBoxSize(out, it.frame, it.key, [it.given[0] ? m[0] : 0, it.given[1] ? m[1] : 0]); }
            else if (it.kind.mode === 'size') out = setBoxSize(out, it.frame, it.key, sizeOf(it.el));
            else out = setScale(out, it.frame, it.key, scaleOf(it.el));
            const patch = it.kind.mode === 'size' ? scaledStyles(it.own, it.font, f) : {};
            if (Math.abs(f - 1) > 1e-6 && Object.keys(patch).length) out = setStyle(out, it.frame, it.key, patch);
          }
          out = setMove(out, it.frame, it.key, translateOf(it.el));
          const tip = d.tips?.[it.frame]?.[it.key];
          return tip ? setTip(out, it.frame, it.key, tip) : out;
        }, e));
      }
      if (d.type === 'maybe-move' && d.dup) { d.ghost?.remove(); if (d.moved) dropDuplicate(d, event); setTick(n => n + 1); return; }
      if (d.type === 'draw') { // the stroke becomes an asset of its frame
        inkRef.current?.setAttribute('d', '');
        const cur = editsRef.current, frame = byIdRef.current[d.frame];
        const made = frame && strokeInsert({points: d.points, color: d.color, width: d.width, taken: new Set(layersOf(frame, cur.frames[d.frame]).map(l => l.key)), count: (cur.frames[d.frame]?.inserts ?? []).length});
        if (made) commit(addInserts(cur, d.frame, made.inserts, made.library));
        return;
      }
      if (d.type === 'rect') { // the rectangle is an asset of the frame, filled as the panel says
        setMarquee(null);
        const cur = editsRef.current, frame = byIdRef.current[d.frame], box = d.box ?? rectFrom(d.from, d.from);
        const made = frame && rectInsert({box, taken: new Set(layersOf(frame, cur.frames[d.frame]).map(l => l.key)), count: (cur.frames[d.frame]?.inserts ?? []).length});
        if (made) {
          const look = rectLookRef.current;
          commit(setStyle(addInserts(cur, d.frame, made.inserts, made.library), d.frame, made.key, {fill: look.fill, radius: look.radius || null}));
          setSelection({frame: d.frame, key: made.key, depth: 0}); setFrameSel([d.frame]);
          setTool('move');
        }
        return;
      }
      if (d.type === 'marquee' || d.type === 'pick') setMarquee(null);
      if (d.type === 'line-move' && d.started) { // let go: the line is in its place (no glide)
        const target = lineMoveRef.current;
        landLine(d.id);
        if (target) commit(e => moveLine(e, linesRef.current.map(l => l.id), d.id, target.index));
        setLineMove(null);
      }
      if (d.type === 'reorder') {
        if (d.raf) cancelAnimationFrame(d.raf);
        if (d.started) { // let go: they are in their place (no glide)
          const target = reorderRef.current;
          for (const id of d.ids) { const el = frameNode(id); if (el) land(el); }
          if (target) commit(e => moveFrame(e, baseFramesRef.current, d.ids, target.chapter, target.index, followersOf(cellsRef.current))); // (a video takes its other slides with it)
          setReorder(null);
        }
      }
      if (d.type === 'maybe-move' && d.moved) { const moves = d.items.map(item => [item.frame ?? d.frame, item.key, translateOf(item.el)]), tips = d.tipList ?? []; commit(e => tips.reduce((cur, t) => setTip(cur, t.frame, t.key, t.to), moves.reduce((cur, [frame, key, to]) => setMove(cur, frame, key, to), e))); }
      if (d.type === 'maybe-move' && !d.moved && d.unpick) { // Shift+click on a picked asset: it is taken out of the picked ones
        const {pick, items: base, depth} = d.unpick, items = removePick(base, pick);
        if (!items.length) { setSelection({frame: d.frame, key: null, depth: 0}); setPicked(null); }
        else { const last = items.at(-1); setPicked(items.length > 1 ? {items} : null); setSelection({frame: last.frame, key: last.key, depth: last.key.includes('/') ? depth : 0}); setFrameSel(framesOfPicks(items)); }
      }
      if (d.type === 'maybe-move' && !d.moved && d.again) pendingCycle.current = {frame: d.frame, x: d.client.x, y: d.client.y}; // a click again at the same place: onClick (next) takes it down a layer, unless it was a double-click
      if (d.type === 'maybe-move' && !d.moved && d.items.length > 1 && !d.keep) { setPicked(null); setFrameSel([d.frame]); } // a click on one of several picked: just that one
      if (d.type === 'tip' && d.moved) commit(e => setTip(e, d.frame, d.key, d.delta));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [commit, showView, placeCarried, dropDuplicate]);

  // the + shows while the pointer is in the gap between two frames (or past the last one of a row)
  const onPointerMove = event => {
    pointerAt.current = {x: event.clientX, y: event.clientY};
    const zoom = viewRef.current.zoom;
    if (trashing || drag.current || editing.current || zoom < 0.08 || toolRef.current === 'pencil' || toolRef.current === 'rect' || event.target.closest('[data-sb-ui]')) { if (hoverGap) setHoverGap(null); return; }
    const rect = viewport.current.getBoundingClientRect();
    const hit = gapAt(gaps, toWorld(viewRef.current, {x: event.clientX - rect.left, y: event.clientY - rect.top}), zoom);
    if ((hit?.after ?? null) !== (hoverGap?.after ?? null)) setHoverGap(hit);
  };
  // The frame's empty background: the frame is picked (Shift: added to the frames picked). Drawing a
  // rectangle from here picks the assets it touches in this frame (Shift: added to the ones already
  // picked, in any frame).
  const startBackground = (id, stage, event, local) => {
    const base = event.shiftKey ? itemsNow() : [];
    cycleRef.current = null;
    selectFrame(id, event.shiftKey);
    if (!event.shiftKey) setPicked(null);
    begin({type: 'pick', frame: id, stage, client: {x: event.clientX, y: event.clientY}, start: local, add: event.shiftKey, base, moved: false, last: null});
  };
  const onPointerDown = event => {
    const rect = viewport.current.getBoundingClientRect(), local = {x: event.clientX - rect.left, y: event.clientY - rect.top};
    if (event.button === 1 || (event.button === 0 && (spaceRef.current || toolRef.current === 'hand'))) { event.preventDefault(); begin({type: 'pan', start: local, view: viewRef.current}); return; }
    if (event.button === 0 && !event.target.closest('.sb-ref')) setRefSel(null);
    if (event.button !== 0 || event.target.closest('[data-sb-ui]')) return;
    setVideoSel(null); setPinSel(null);
    if (editing.current) { if (editing.current.el.contains(event.target)) return; finishEdit(true); }
    if (toolRef.current === 'rect') { // the rectangle tool: drag on a frame (Shift: a square), or click for one of a usual size
      const over = frameAt(event.clientX, event.clientY);
      if (!over) { setStatus('The rectangle is drawn on a frame.'); return; }
      setSelection(null); setFrameSel([]); setPicked(null);
      begin({type: 'rect', frame: over.id, art: over.art, from: over.at, startLocal: local, box: null, moved: false});
      return;
    }
    if (toolRef.current === 'pencil') {
      if (event.altKey) { // Alt: the color under the pointer becomes the pencil's
        const color = normalizeHex(colorAt(event.clientX, event.clientY));
        if (color) { setPen(p => ({...p, color})); setStatus(`Picked ${color}`); } else setStatus('No color to pick there.');
        return;
      }
      const over = frameAt(event.clientX, event.clientY);
      if (!over) { setStatus('The pencil draws on a frame.'); return; }
      setSelection(null); setFrameSel([]); setPicked(null);
      const p = penRef.current, ink = inkRef.current;
      if (ink) { ink.setAttribute('stroke', p.color); ink.setAttribute('stroke-width', Math.max(1, p.width * over.art.width / STAGE)); ink.setAttribute('d', `M${local.x} ${local.y}l0.01 0`); }
      begin({type: 'draw', frame: over.id, art: over.art, points: [over.at], screen: [`${local.x} ${local.y}`], color: p.color, width: p.width});
      return;
    }
    const lineEl = event.target.closest('[data-sb-row]');
    if (lineEl) {
      const id = lineEl.dataset.sbRow, row = boardRef.current.rows.find(r => r.chapter.id === id);
      pickLine(id);
      if (row && !trashing && !event.shiftKey && linesRef.current.length > 1 && !event.target.closest('input, textarea, [contenteditable]')) { // dragging the label carries the whole line up or down
        begin({type: 'line-move', id, origin: {x: event.clientX, y: event.clientY}, grab: toWorld(viewRef.current, local).y - row.y, floatY: row.y, started: false});
      }
      return;
    }
    const title = event.target.closest('[data-ftitle]');
    if (title) { startReorder(title.dataset.ftitle, event); return; }
    pendingCycle.current = null;
    const hit = hitAt(event.clientX, event.clientY);
    if (hit) {
      const id = hit.stage.closest('[data-frame]').dataset.frame;
      if (!hit.el) { startBackground(id, hit.stage, event, local); return; }
      const chain = chainOf(hit.el), s = selRef.current, deep = event.ctrlKey || event.metaKey, plain = !event.shiftKey && !event.altKey && !deep;
      const client = {x: event.clientX, y: event.clientY};
      // A click again where the last one was, on what it left selected: nothing is selected again (a drag from
      // here moves it); let go without a drag (and not as a double-click), it goes down to the layer under (onClick).
      const again = plain && !!s?.key && s.frame === id && !pickedItemsRef.current.length && cycleRef.current?.frame === id && cycleRef.current.key === s.key && sameSpot(cycleRef.current, client);
      const depth = again ? s.depth : deep ? chain.length - 1 : s && s.frame === id ? Math.min(s.depth, chain.length - 1) : 0;
      const el = (again && elementOf(hit.stage, s.key)) || chain[depth], key = keyOf(el);
      // an asset of this frame, or of any other one picked with it, as a thing to drag
      const itemOf = pick => { const stage = pick.frame === id ? hit.stage : stageFor(pick.frame), item = stage && (pick.frame === id && pick.key === key ? el : elementOf(stage, pick.key)); return item && {el: item, key: pick.key, frame: pick.frame, stage, t0: translateOf(item), k: parentScale(item), ...offTail(stage, item, pick.frame)}; };
      const itemsOf = picks => picks.map(itemOf).filter(item => item && !isFixed(item.el)); // (what is fixed in place stays: it is picked, not dragged)
      const mine = {frame: id, key}, fixed = isFixed(el);
      if (event.shiftKey && s?.key) { // Shift: add it to the assets picked, in this frame or any other (a click on one already picked takes it out); a drag moves them all, along one axis while Shift is held
        cycleRef.current = null;
        const base = pickedItemsRef.current.length ? pickedItemsRef.current : picksOf(s.frame, [s.key]);
        if (hasPick(base, mine)) { begin({type: 'maybe-move', client, items: itemsOf(base), frame: id, stage: hit.stage, moved: false, keep: true, unpick: {pick: mine, items: base, depth: s.depth}}); return; }
        const items = addPick(base, mine);
        setPicked({items}); setSelection({frame: id, key, depth}); setFrameSel(framesOfPicks(items));
        begin({type: 'maybe-move', client, items: itemsOf(items), frame: id, stage: hit.stage, moved: false, keep: true});
        return;
      }
      if (again) { begin({type: 'maybe-move', client, items: itemsOf([mine]), frame: id, stage: hit.stage, moved: false, again: true, ...(fixed ? {backdrop: true, startLocal: local} : {})}); return; }
      const group = hasPick(pickedItemsRef.current, mine) ? pickedItemsRef.current : [mine]; // dragging one of several picked moves them all
      if (group.length === 1) setPicked(null);
      setSelection({frame: id, key, depth}); setFrameSel(group.length > 1 ? framesOfPicks(group) : [id]);
      cycleRef.current = plain ? {frame: id, x: client.x, y: client.y, key} : null;
      if (event.altKey && !fixed) { // Alt: what is dragged is a duplicate (of the whole asset, in this frame); the original stays
        const whole = [...new Set(group.filter(p => p.frame === id).map(p => layerKeyOf(p.key)))].map(k => { const item = elementOf(hit.stage, k); return item && {el: item, key: k, frame: id, stage: hit.stage, t0: translateOf(item), k: parentScale(item)}; }).filter(Boolean);
        begin({type: 'maybe-move', client, items: whole, frame: id, stage: hit.stage, moved: false, dup: true});
        return;
      }
      // something as big as the frame (a dim, a backdrop), not yet selected, with other assets in the frame to pick: dragging
      // from it draws a rectangle (a click still selects it). A frame of only that (the title's words): the drag moves it.
      const root = chain[0], box = screenRectOf(root), S = hit.stage.getBoundingClientRect(), whole = {left: S.left, top: S.top, right: S.right, bottom: S.bottom};
      // (fixed in place, the background: a drag from it always draws a rectangle, picked or not)
      const backdrop = (fixed && group.length === 1) || (plain && group.length === 1 && !(s?.frame === id && s.key && layerKeyOf(s.key) === layerKeyOf(key)) && isBackdrop({left: box.left, top: box.top, right: box.left + box.width, bottom: box.top + box.height}, S) && assetsIn(hit.stage, whole).length > 0);
      begin({type: 'maybe-move', client, items: itemsOf(group), frame: id, stage: hit.stage, moved: false, ...(backdrop ? {backdrop: true, startLocal: local} : {})});
      return;
    }
    const art = event.target.closest('[data-art]');
    if (art) { startReorder(art.closest('[data-frame]').dataset.frame, event); return; }
    // the empty board: a rectangle that picks frames
    begin({type: 'marquee', start: local, add: event.shiftKey, base: event.shiftKey ? frameSelRef.current : []});
    if (!event.shiftKey) { setSelection(null); setFrameSel([]); }
  };
  // A click again at the same place goes down to the layer under it, one by one, and round again after
  // the last (pointer-down kept the selection; a double-click is not this one: it retypes or goes in).
  const onClick = event => {
    const p = pendingCycle.current;
    pendingCycle.current = null;
    if (!p || event.detail > 1 || editing.current) return;
    const {stage, layers} = layersAt(p.x, p.y);
    if (!stage || stage.closest('[data-frame]')?.dataset.frame !== p.frame || layers.length < 2) return;
    const next = nextLayer(layers.map(l => l.key), selRef.current?.key), at = layers.findIndex(l => l.key === next);
    setSelection({frame: p.frame, key: next, depth: chainOf(layers[at].el).length - 1}); setFrameSel([p.frame]); setPicked(null);
    cycleRef.current = {frame: p.frame, x: p.x, y: p.y, key: next};
    setStatus(`Layer ${at + 1} of ${layers.length} under the pointer`);
  };
  const onDoubleClick = event => {
    if (event.target.closest('[data-sb-ui]') || spaceRef.current || (toolRef.current !== 'move' && toolRef.current !== 'scale')) return;
    const lineEl = event.target.closest('[data-sb-row]');
    if (lineEl) { if (!trashing) setLineEdit(lineEl.dataset.sbRow); return; }
    const hit = hitAt(event.clientX, event.clientY);
    if (!hit) { const art = event.target.closest('[data-art]'); if (art) focusFrame(art.closest('[data-frame]').dataset.frame); return; }
    const id = hit.stage.closest('[data-frame]').dataset.frame;
    if (!hit.el) { focusFrame(id); return; }
    // any text: retype it right there (like Figma, no need to go in level by level), also under the demo's clear overlays
    const target = editTargetAt(event.clientX, event.clientY, hit.stage);
    if (target) {
      // the text stays selected while it is typed (its handles are there to change its size): a piece of text is selected itself, words by the asset they are in
      if (!isWords(target.el)) { const into = chainOf(target.el), at = into.length - 1; if (at >= 0) setSelection({frame: id, key: keyOf(into[at]), depth: at}); }
      else { const root = target.el.closest('[data-sb-root]'), s = selRef.current; if (root && !(s?.frame === id && s.key && layerKeyOf(s.key) === root.dataset.sbRoot)) setSelection({frame: id, key: root.dataset.sbRoot, depth: 0}); }
      setFrameSel([id]); setPicked(null); cycleRef.current = null;
      startEdit(target);
      return;
    }
    const chain = chainOf(hit.el), s = selRef.current;
    // anything else: one level in
    const at = s?.key ? chain.findIndex(el => keyOf(el) === s.key) : -1;
    if (at >= 0 && chain[at + 1]) { const el = chain[at + 1]; setSelection({frame: id, key: keyOf(el), depth: at + 1}); }
  };

  // ---- The keyboard ----
  useEffect(() => {
    const down = event => {
      const typing = isTyping(event.target), mod = event.ctrlKey || event.metaKey, key = event.key.toLowerCase();
      if (mod && key === 'z') { event.preventDefault(); if (editing.current) finishEdit(true); setHistory(h => (event.shiftKey ? redo(h) : undo(h))); dirty.current = true; return; }
      if (mod && key === 'y') { event.preventDefault(); setHistory(h => redo(h)); dirty.current = true; return; }
      if (typing) return;
      if (event.shiftKey && !mod && key === 'g') { event.preventDefault(); toggleGuides(); return; } // (the guide lines: on the board and in the video editor)
      if (vEditRef.current) { // the video editor is open: the keys are its own; of the board's, only Undo, Redo and Delete of a connector line picked in it
        const v = videoSelRef.current;
        if ((key === 'delete' || key === 'backspace') && v?.line) { event.preventDefault(); deleteVideoLine(v.frameIds(), v.line); }
        return;
      }
      if (event.code === 'Space') { event.preventDefault(); setSpace(true); return; }
      if (mod && event.shiftKey && key === 'c') { event.preventDefault(); copyPosition(); return; }  // a position, not the asset
      if (mod && event.shiftKey && key === 'v') { event.preventDefault(); pastePosition(); return; } // (not the browser's paste as plain text)
      if (mod && key === 'd') { event.preventDefault(); if (lineSelRef.current && !selRef.current) { duplicateLineOf(lineSelRef.current); return; } const ids = frameSelRef.current.length ? frameSelRef.current : selRef.current ? [selRef.current.frame] : []; duplicate(ids); return; }
      if (mod && (event.code === 'BracketRight' || event.code === 'BracketLeft')) { event.preventDefault(); reorderSelected(event.code === 'BracketRight' ? (event.shiftKey ? 'front' : 'forward') : (event.shiftKey ? 'back' : 'backward')); return; } // Ctrl+] / Ctrl+[ (Shift: to the front / back)
      if (mod && ['=', '+', '-', '_', '0'].includes(event.key)) {
        event.preventDefault();
        if (event.key === '0') zoomTo(1); else zoomStep(['=', '+'].includes(event.key) ? 1 : -1);
        return;
      }
      if (mod) return;
      if (event.shiftKey && key === 'a') { event.preventDefault(); openMenu(); return; }
      if (event.shiftKey && event.code === 'Digit1') { event.preventDefault(); fitAll(); return; }
      if (event.shiftKey && event.code === 'Digit2') { event.preventDefault(); fitSelection(); return; }
      if (event.shiftKey && event.code === 'Digit0') { event.preventDefault(); zoomTo(1); return; }
      if (key === '=' || key === '+') { zoomStep(1); return; }
      if (key === '-') { zoomStep(-1); return; }
      if (key === 'v') { setTool('move'); return; }
      if (key === 'h') { setTool('hand'); return; }
      if (key === 'p') { setTool('pencil'); return; }
      if (key === 'r') { setTool('rect'); return; }
      if (key === 'c' && !mod) { const on = toolRef.current !== 'comment'; setTool(on ? 'comment' : 'move'); if (on) setStatus('Comment (C): click on a video to put a comment there. C, V or Esc to leave.'); return; } // the Comment tool, like the video editor's
      if (key === 'k') { const on = toolRef.current !== 'scale'; setTool(on ? 'scale' : 'move'); if (on) setStatus('Scale (K): drag a handle and the words scale with the box. K, V or Esc to leave.'); return; } // the Scale tool, like Figma's
      if (key === 'delete' || key === 'backspace') { event.preventDefault(); const v = videoSelRef.current, pin = pinSelRef.current; if (refSelRef.current) deleteRef(refSelRef.current); else if (pin && !selRef.current) { commentOps.removeIn(pin.title, pin.id); setPinSel(null); } else if (v?.line) deleteVideoLine(v.frameIds(), v.line); else if (lineSelRef.current && !selRef.current) deleteLineOf(lineSelRef.current); else removeSelected(); return; } // (a connector line picked in a video: deleted from it; a comment picked on a video: deleted)
      if (key === 'escape') {
        if (writers.current.length) { stopWriting(); return; }
        if (ctx) { setCtx(null); return; }
        if (refSelRef.current) { setRefSel(null); return; }
        if (pinSelRef.current) { setPinSel(null); return; }
        if (drag.current?.type === 'line-move' && drag.current.started) { cancelLineMove(); return; }
        if (lineSelRef.current) { setLineSel(null); return; }
        if (toolRef.current === 'pencil' || toolRef.current === 'rect' || toolRef.current === 'scale' || toolRef.current === 'comment') { setTool('move'); return; }
        if (drag.current?.type === 'reorder' && drag.current.started) { cancelReorder(); return; }
        const s = selRef.current;
        if (pickedItemsRef.current.length) { setPicked(null); return; }
        if (s?.key && s.depth > 0) { const el = selectedEl(), chain = el ? chainOf(el) : []; const up = chain[s.depth - 1]; if (up) { setSelection({frame: s.frame, key: keyOf(up), depth: s.depth - 1}); return; } }
        if (s?.key) { setSelection({frame: s.frame, key: null, depth: 0}); return; }
        setSelection(null); setFrameSel([]);
        return;
      }
      if (key === 'enter' && lineSelRef.current && !selRef.current) { event.preventDefault(); if (!trashing) setLineEdit(lineSelRef.current); return; }
      if (key === 'enter' && selRef.current?.key) {
        const el = selectedEl();
        if (el) { const chain = chainOf(el), s = selRef.current; const next = chain[s.depth + 1]; if (next) setSelection({frame: s.frame, key: keyOf(next), depth: s.depth + 1}); else { const target = editTargetOf(el); if (target) { event.preventDefault(); startEdit(target); } } }
        return;
      }
      if (key.startsWith('arrow') && selRef.current?.key) {
        event.preventDefault();
        const n = event.shiftKey ? 10 : 1;
        moveSelectedBy(key === 'arrowleft' ? -n : key === 'arrowright' ? n : 0, key === 'arrowup' ? -n : key === 'arrowdown' ? n : 0);
      }
    };
    const up = event => { if (event.code === 'Space') setSpace(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  });


  // ---- A position: copied from an asset (Ctrl+Shift+C), pasted on others (Ctrl+Shift+V) ----
  // Pasted on the assets picked in a frame (each one's top left corner goes there), or, with frames
  // picked, on the same asset in each of them (by its key, else its duplicate along the line). The
  // frames are drawn at once to be measured (forceDraw), then it is placed, in one step.
  const positionRef = useRef(null), pendingPlace = useRef(null);
  const copiedPosition = () => { if (positionRef.current) return positionRef.current; try { return JSON.parse(readLocal(POSITION) || 'null'); } catch { return null; } };
  const copyPosition = () => {
    const s = selRef.current, stage = s?.key && stageFor(s.frame), el = stage && elementOf(stage, s.key);
    if (!el) { setStatus('Pick an asset to copy its position (Ctrl+Shift+C).'); return; }
    const b = stageBoxOf(stage, el), frame = byIdRef.current[s.frame], edit = editsRef.current.frames[s.frame], layer = layerKeyOf(s.key);
    const p = {x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100, key: s.key, name: nameOf(el, frame && layersOf(frame, edit).find(l => l.key === layer)?.name)};
    positionRef.current = p;
    writeLocal(POSITION, JSON.stringify(p));
    setStatus(`Copied the position of ${p.name}: ${Math.round(p.x)}, ${Math.round(p.y)}`);
    setTick(t => t + 1);
  };
  // The same asset in another frame: the one with its key, else null.
  const matchIn = (frameId, p) => {
    const frame = byIdRef.current[frameId];
    if (!frame) return null;
    return layersOf(frame, editsRef.current.frames[frameId]).some(l => l.key === layerKeyOf(p.key)) ? p.key : null;
  };
  // Each [frame, key]'s top left corner to p (stage px), in one step. -> how many were placed
  const placeAll = (parts, p) => {
    const moves = [];
    for (const {frame, key} of parts) {
      const stage = stageFor(frame), el = stage && elementOf(stage, key);
      if (!el || isFixed(el)) continue;
      const b = stageBoxOf(stage, el), u = unitOf(stage), k = parentScale(el), t = translateOf(el), by = [(p.x - b.x) * u / k, (p.y - b.y) * u / k], off = offTail(stage, el, frame);
      moves.push({frame, key, to: [t[0] + by[0], t[1] + by[1]], tip: off && [off.tip0[0] + by[0], off.tip0[1] + by[1]]});
    }
    if (moves.length) commit(e => moves.reduce((cur, m) => (m.tip ? setTip(setMove(cur, m.frame, m.key, m.to), m.frame, m.key, m.tip) : setMove(cur, m.frame, m.key, m.to)), e));
    return moves.length;
  };
  const pastePosition = () => {
    const p = copiedPosition();
    if (!p) { setStatus('Copy a position first: Ctrl+Shift+C on an asset.'); return; }
    if (trashing) return;
    const s = selRef.current;
    if (s?.key) { const n = placeAll(itemsNow(), p); setStatus(n ? `Pasted the position on ${n} asset${n > 1 ? 's' : ''}` : 'Nothing to put there.'); return; }
    const ids = frameSelRef.current.length ? frameSelRef.current : s ? [s.frame] : [];
    if (!ids.length) { setStatus('Pick the assets, or the frames, to paste the position on.'); return; }
    const parts = ids.map(id => ({frame: id, key: matchIn(id, p)})).filter(x => x.key);
    if (!parts.length) { setStatus(`None of the picked frames has ${p.name}.`); return; }
    pendingPlace.current = {parts, p, missing: ids.length - parts.length, tries: 0};
    setForceDraw(new Set(parts.map(x => x.frame)));
  };

  // ---- What is live, and what is drawn over the board ----
  // What you see never depends on where you are or how far in you are (the user, 2026-10-06: "you
  // change what I see based on where I am, don't do that"): every frame you changed is drawn live,
  // everywhere on the board, at any zoom, and stays drawn; only the frames you did not change (their
  // picture IS the capture, so live or picture looks the same) are drawn live when they are near.
  // The frame you are on and the ones being measured are live too.
  const [forceDraw, setForceDraw] = useState(() => new Set()); // frames drawn at once to be measured (a position pasted on them)
  // the videos of the lines of videos, by the slide they take the place of: what the player in it needs
  const cellProps = useMemo(() => {
    const out = new Map();
    for (const [anchor, scene] of cells.anchors) out.set(anchor, {name: scene.name, frames: scene.ids.map(id => allById[id]).filter(Boolean), edits: boardEdits, onText: retype, onVideoText: restyleVideo, onCaption: retypeCaption, onSelect: selectVideo, onEditing: setTextEd, onFrame: id => setPlayingId(id ? anchor : null), onMenu: (event, m) => videoMenu(event, {kind: 'cell', key: anchor, title: scene.name, ...m}), pins: pinsFor(anchor, scene.name), commentTool: tool === 'comment', onDrawn: onVideoDrawn});
    return out;
  }, [cells, allById, boardEdits, retype, restyleVideo, retypeCaption, selectVideo, setPlayingId, videoMenu, pinsFor, tool, onVideoDrawn]);
  // The video open in the video editor (opened from its right-click menu): what its player is handed there, as on the board (the edits as they settle: `veEdits`)
  const vePlayer = useMemo(() => {
    if (!vEdit) return null;
    const run = videoRuns.find(v => v.key === vEdit.key), c = run ? null : cellProps.get(vEdit.key);
    if (run) return {frames: run.frames, title: run.title, edits: veEdits, video, lines, placed: board.frames, onFrame: setPlayingId, onText: retype, onVideoText: restyleVideo, onCaption: retypeCaption, onSelect: selectVideo, onEditing: setTextEd, onDrawn: onVideoDrawn};
    if (c) return {frames: c.frames, title: c.name, edits: veEdits, video, lines, placed: board.frames, onFrame: c.onFrame, onText: c.onText, onVideoText: c.onVideoText, onCaption: c.onCaption, onSelect: c.onSelect, onEditing: c.onEditing, onDrawn: onVideoDrawn};
    return null;
  }, [vEdit, videoRuns, cellProps, veEdits, video, lines, board, setPlayingId, retype, restyleVideo, retypeCaption, selectVideo, onVideoDrawn]);
  useEffect(() => { if (vEdit && !vePlayer) setVEdit(null); }, [vEdit, vePlayer]); // (the video is gone: a line deleted, Undo)
  veTitleRef.current = vePlayer?.title ?? null;
  // The same element on every slide of the video open in the editor (by its key, else by its name; a part of it by the same path): where its LOOK goes
  // ("look: video · place: slide", the user, 2026-10-22). -> [{frame, key}]
  const sameInVideo = (frame, key) => {
    const slides = vePlayer?.frames ?? [], cut = key.indexOf('/'), root = cut < 0 ? key : key.slice(0, cut), path = cut < 0 ? '' : key.slice(cut);
    const from = allById[frame], name = from && layersOf(from, editsRef.current.frames[frame]).find(l => l.key === root)?.name;
    return slides.flatMap(f => { const ls = layersOf(f, editsRef.current.frames[f.id]), hit = ls.find(l => l.key === root) ?? (name ? ls.find(l => l.name === name) : null); return hit ? [{frame: f.id, key: hit.key + path}] : []; });
  };
  sameInVideoRef.current = sameInVideo;
  const untouched = useMemo(() => new Set(lines.filter(l => /^(scratch|fonts)$/i.test(String(l.title ?? '').trim())).map(l => l.id)), [lines]); // (lines whose slides are never changed by a rule: the model, the fonts)
  // A frame is drawn live once it comes near the view (an edited one at any zoom: its picture would not show the edits), and stays drawn. Every edited frame used to be drawn at once,
  // on screen or not: with the split design that is every frame, 30 000 elements built before anything showed and worked on again at every edit (the user, 2026-10-22: "faster").
  const drawnOnce = useRef(new Set());
  const liveIds = useMemo(() => {
    const near = visibleWorld(view, size, Math.max(300, size.w) / view.zoom), ids = new Set(), drawn = drawnOnce.current;
    for (const f of frames) {
      const p = board.frames[f.id];
      if (!p) continue;
      if (drawn.has(f.id) || (intersects(near, {x: p.x, y: p.y, w: FRAME.w, h: FRAME.h}) && (view.zoom >= LIVE_ZOOM || hasChanges(boardEdits, f.id)))) { ids.add(f.id); drawn.add(f.id); }
    }
    if (selection) ids.add(selection.frame);
    for (const p of pickedItems) ids.add(p.frame); // (the assets picked in other frames are measured and moved: those frames are drawn)
    for (const id of forceDraw) ids.add(id);
    return ids;
  }, [view, size, frames, board, boardEdits, selection, pickedItems, forceDraw]);
  // The frames the page measures or works on (the one picked, the ones picked with it, the ones being measured) are always
  // fully drawn; the others are only drawn while they are near the view (CSS content-visibility, .sb-frame).
  const solidIds = useMemo(() => new Set([...(selection ? [selection.frame] : []), ...frameSel, ...pickedItems.map(p => p.frame), ...forceDraw]), [selection, frameSel, pickedItems, forceDraw]);

  // the view has settled (or something else rendered): what is drawn over the board is measured again
  useLayoutEffect(() => {
    committed.current = viewRef.current;
    worldRef.current?.classList.remove('is-moving');
    rasterZoom.current = null; // (settled: drawn sharp at this zoom)
    worldRef.current?.classList.toggle('is-far', viewRef.current.zoom < TEXT_ZOOM);
    liveQueue.center(toWorld(viewRef.current, {x: sizeRef.current.w / 2, y: sizeRef.current.h / 2}));
    const place = pendingPlace.current; // a position pasted on frames: they are drawn now, it is put on them
    if (place && (place.parts.every(x => stageFor(x.frame)?.childElementCount) || ++place.tries > 3)) {
      pendingPlace.current = null;
      const n = placeAll(place.parts, place.p);
      setForceDraw(new Set());
      setStatus(`Pasted the position on ${n} frame${n === 1 ? '' : 's'}${place.missing ? ` (${place.missing} without ${place.p.name})` : ''}`);
    }
    if (overlayRef.current) overlayRef.current.style.transform = '';
    const root = viewport.current;
    if (!root) return;
    const base = root.getBoundingClientRect();
    const rel = r => ({left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height});
    let outline = null, tip = null, info = null;
    const waiting = pendingEdit.current;
    if (waiting && !editing.current) { // Tab: the next text, now that its frame is drawn again
      pendingEdit.current = null;
      const stage = stageFor(waiting.frame), target = stage && targetOf(stage, waiting.key);
      if (target) { if (!isWords(target.el)) { const chain = chainOf(target.el), at = chain.length - 1; if (at >= 0 && keyOf(chain[at]) !== selRef.current?.key) setSelection({frame: waiting.frame, key: keyOf(chain[at]), depth: at}); } startEdit(target); }
    }
    const others = pickedItems.map(p => { const stage = stageFor(p.frame), el = stage && elementOf(stage, p.key); return el ? {key: `${p.frame}\n${p.key}`, ...rel(screenRectOf(el))} : null; }).filter(Boolean); // (several picked: each its own outline; the box with the handles is round all of them)
    if (selection?.key) {
      const stage = stageFor(selection.frame), el = stage && elementOf(stage, selection.key);
      if (el) {
        const top = selection.key.split('/')[0], bubble = !selection.key.includes('/') && isBubble(el);
        const r = bubble || !selection.key.includes('/') ? screenRectOf(el) : el.getBoundingClientRect(); // (a bubble by its yellow box: that is what its handles resize; a piece by what is seen of it, data-sb-seen)
        const f = byId[selection.frame], layer = f && layersOf(f, editsRef.current.frames[selection.frame]).find(l => l.key === top);
        const box = stageBoxOf(stage, el), u = unitOf(stage), name = nameOf(el, layer?.name);
        const kind = resizeKind(el), scale = scaleOf(el);
        const lock = lockOf(editsRef.current, selection.frame, selection.key), fixed = isFixed(el);
        outline = {...rel(r), name, w: Math.round(r.width / u), h: Math.round(r.height / u), handles: fixed || pickedItems.length || (lock.w && lock.h) || (!kind.free && (lock.w || lock.h)) || (toolRef.current === 'scale' && kind.mode === 'size' && (lock.w || lock.h)) ? null : kind.free ? 'all' : 'corners', lock};
        info = {kind: 'asset', frame: board.frames[selection.frame]?.index, name, x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h), bubble, top: !selection.key.includes('/'), fixed,
          scale: kind.mode === 'scale' && (scale[0] !== 1 || scale[1] !== 1) ? scale.map(s => Math.round(s * 100)) : null, free: kind.free, keep: kind.keep,
          ink: el.dataset.sbBox === 'drawing' ? (layer ? inkOf(editsRef.current.library[layer.asset]) : inkOf(el.outerHTML)) : null, // (a captured drawing: as it is drawn now) lock: lockOf(editsRef.current, selection.frame, selection.key),
          device: !!(el.matches('.tbl-tablet') || el.querySelector('.tbl-tablet')), look: lookOf(el), own: styleOf(editsRef.current, selection.frame, selection.key), chat: bubble ? {tail: !el.hasAttribute('data-sb-no-tail'), hasTail: !!el.dataset.sbTip, words: el.dataset.sbMode === 'words'} : null, changed: touched(editsRef.current.frames[selection.frame], selection.key)};
        if (bubble) {
          const t = tipOf(el, editsRef.current.frames[selection.frame], drag.current?.type === 'tip' ? {key: top, delta: drag.current.delta} : drag.current?.tips ?? null), S = stage.getBoundingClientRect();
          if (t) tip = {left: S.left - base.left + t.x * u, top: S.top - base.top + t.y * u};
        }
      }
    } else if (selection) {
      const f = byId[selection.frame];
      if (f) info = {kind: 'frame', frame: board.frames[selection.frame]?.index, name: f.label, copy: !!f.isCopy, many: frameSel.length > 1 ? frameSel.length : 0};
    }
    if (outline && pickedItems.length > 1) { // several picked: one box round the ones in the frame pressed, its corners scale them all (startGroupScale)
      const g = groupRectOf(selection.frame), stage = stageFor(selection.frame), u = stage ? unitOf(stage) : 1;
      outline = g ? {...rel(g.rect), name: `${pickedItems.length} picked`, w: Math.round(g.rect.width / u), h: Math.round(g.rect.height / u), handles: g.scalable ? 'corners' : null, lock: {w: false, h: false}} : null;
    }
    const plays = [...new Set([...frameSel, ...(selection ? [selection.frame] : [])])].filter(id => hasAnim(editsRef.current, id) && !cells.anchors.has(id)).map(id => { // (a video has no pen of its own: its slides' pens write as it plays)
      const art = frameEl(id)?.querySelector('[data-art]'), r = art && rel(art.getBoundingClientRect());
      return r && r.width >= 110 ? {id, left: Math.round(r.left + r.width - 40), top: Math.round(r.top + 10)} : null; // (top right of the slide)
    }).filter(Boolean);
    const outlines = [...new Set(frameSel.concat(selection && !selection.key ? [selection.frame] : []))].map(id => { const art = frameEl(id)?.querySelector('[data-art]'); return art ? {id, ...rel(art.getBoundingClientRect())} : null; }).filter(Boolean);
    if (info && pickedItems.length > 1) info.count = pickedItems.length;
    setOverlay(o => (JSON.stringify([o.outline, o.tip, o.frames, o.info, o.picks, o.plays]) === JSON.stringify([outline, tip, outlines, info, others, plays]) ? o : {outline, tip, frames: outlines, info, picks: others, plays}));
  });

  // ---- Several picked, scaled together (the user, 2026-11-09: "multiselection should give me ability to scale up everything at once") ----
  // The box round the ones picked in a frame has corner handles; one dragged scales every one picked by the same factor from the opposite corner, like Figma's: the
  // places spread out or close in with it and everything grows: a UI element by its scale, a box (a picture, a drawing, a rectangle, an outline) by its size, a text
  // box and a chat box WITH their words (the font size, and the line height / letter spacing / corners / outline they were given). Picked in several frames, each
  // frame's ones scale from the same corner of their own box. What is fixed in place (the background) stays; a locked width or height keeps that one's size, it
  // still moves with the others. One step of Undo ('group-scale' drag).
  const rectAround = rects => rects.reduce((g, r) => (g ? {left: Math.min(g.left, r.left), top: Math.min(g.top, r.top), right: Math.max(g.right, r.right), bottom: Math.max(g.bottom, r.bottom)} : {left: r.left, top: r.top, right: r.right, bottom: r.bottom}), null);
  const withSize = g => g && {...g, width: g.right - g.left, height: g.bottom - g.top};
  const groupRectOf = frameId => {
    const els = pickedItemsRef.current.filter(p => p.frame === frameId).map(p => { const stage = stageFor(p.frame); return stage && elementOf(stage, p.key); }).filter(Boolean);
    const movable = els.filter(el => !isFixed(el)), rect = withSize(rectAround((movable.length ? movable : els).map(screenRectOf)));
    return rect ? {rect, scalable: movable.length > 0} : null;
  };
  const startGroupScale = handle => {
    const cur = editsRef.current, items = itemsNow().map(({frame, key}) => {
      const stage = stageFor(frame), el = stage && elementOf(stage, key);
      if (!el || isFixed(el)) return null;
      const r = screenRectOf(el), kind = resizeKind(el), bubble = isBubble(el), text = !bubble && el.dataset.sbBox === 'text', given = bubble ? (el.dataset.sbSize ?? '').split(',').map(Number) : null;
      return {frame, key, el, stage, kind, bubble, text, lock: lockOf(cur, frame, key), own: styleOf(cur, frame, key) ?? {}, font: bubble || text ? lookOf(el).size || null : null,
        r0: {left: r.left, top: r.top}, s0: scaleOf(el), size0: sizeOf(el), k: parentScale(el), box0: bubble ? (b => [b.w, b.h])(bubbleBoxOf(stage, el)) : null,
        pad: bubble ? bubblePad(el) : null, given: given ? [given[0] || 0, given[1] || 0] : null, off: !!offTail(stage, el, frame)};
    }).filter(Boolean);
    if (!items.length) return;
    const boxes = {};
    for (const frame of new Set(items.map(it => it.frame))) boxes[frame] = withSize(rectAround(items.filter(it => it.frame === frame).map(it => screenRectOf(it.el))));
    const main = boxes[selRef.current?.frame] ? selRef.current.frame : items[0].frame;
    begin({type: 'group-scale', handle, items, boxes, main, f: 1, moved: false});
  };
  // A handle of the selected asset: dragging it scales the asset (see the 'scale' drag); several picked: all of them (startGroupScale).
  const startScale = (event, handle) => {
    event.stopPropagation(); event.preventDefault();
    if (editing.current) finishEdit(true);
    if (pickedItemsRef.current.length > 1) { startGroupScale(handle); return; }
    const s = selRef.current, stage = s?.key && stageFor(s.frame), el = stage && elementOf(stage, s.key);
    if (!el || isFixed(el)) return;
    const r = screenRectOf(el), kind = resizeKind(el);
    let content = null; // the Scale tool (K) on a box or a chat box: what scales with it besides its boundaries
    if (toolRef.current === 'scale' && kind.mode === 'size') {
      const own = styleOf(editsRef.current, s.frame, s.key);
      if (isBubble(el)) { const box = bubbleBoxOf(stage, el), given = (el.dataset.sbSize ?? '').split(',').map(Number); content = {bubble: true, own, size: lookOf(el).size, pad: bubblePad(el), box: [box.w, box.h], given: [given[0] || 0, given[1] || 0], u: unitOf(stage)}; }
      else content = {bubble: false, own};
    }
    begin({type: 'scale', handle, el, key: s.key, frame: s.frame, stage, kind, content, lock: lockOf(editsRef.current, s.frame, s.key), r0: {left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: Math.max(1, r.width), height: Math.max(1, r.height)}, s0: scaleOf(el), size0: sizeOf(el), k: parentScale(el), off: !!offTail(stage, el, s.frame), moved: false});
  };
  // Right-click on an asset: its menu (apply to all / delete in the row, copy, paste, delete).
  const onContextMenu = event => {
    const lineEl = event.target.closest('[data-sb-row]');
    if (lineEl) { event.preventDefault(); pickLine(lineEl.dataset.sbRow); setCtx({x: event.clientX, y: event.clientY, line: lineEl.dataset.sbRow}); return; }
    if (!event.target.closest('.sb-frame')) return;
    event.preventDefault();
    if (editing.current) return;
    const hit = hitAt(event.clientX, event.clientY);
    let s = selRef.current, keys = keysNow();
    if (hit?.el) { // on an asset that is not picked: it becomes the one picked
      const id = hit.stage.closest('[data-frame]').dataset.frame, top = keyOf(chainOf(hit.el)[0]);
      if (!(s?.frame === id && keys.some(k => layerKeyOf(k) === top))) { s = {frame: id, key: top, depth: 0}; keys = [top]; setSelection(s); setFrameSel([id]); setPicked(null); }
    }
    const frame = s?.key && byIdRef.current[s.frame];
    if (!frame) { setCtx(null); return; }
    setCtx({x: event.clientX, y: event.clientY, frame: s.frame, ...rowInfo(s.frame, keys)});
  };
  useEffect(() => { // the menu closes on a click anywhere else, or when the board moves
    if (!ctx) return;
    const close = event => { if (!event.target.closest?.('.sb-ctx')) setCtx(null); };
    window.addEventListener('pointerdown', close, true); window.addEventListener('wheel', close, true);
    return () => { window.removeEventListener('pointerdown', close, true); window.removeEventListener('wheel', close, true); };
  }, [ctx]);
  // A drawing in another color or width (one undo step while the wheel is dragged).
  const restyle = change => {
    const s = selection, cur = editsRef.current, layer = s?.key && cur.frames[s.frame]?.inserts?.find(l => l.key === s.key), html = layer && cur.library[layer.asset];
    if (s?.key && !layer) { // (a captured drawing: its color and width are its style, the captured HTML stays)
      const patch = {...(change.color ? {stroke: change.color} : {}), ...(Number.isFinite(change.width) ? {strokeWidth: change.width} : {})};
      if (Object.keys(patch).length) commit(e => setStyle(e, s.frame, s.key, patch), {merge: `ink:${s.frame}:${s.key}`});
      return;
    }
    if (!html) return;
    const next = restyleInk(html, change);
    if (next !== html) commit(e => setInsertHtml(e, s.frame, s.key, next, hashString(next)), {merge: `ink:${s.frame}:${s.key}`});
  };
  // ---- The sidebar: what it sets on the picked assets (a field typed or scrubbed is one undo step) ----
  const setLook = (patch, name = Object.keys(patch).join(',')) => {
    let items = itemsNow();
    if (vEditRef.current && veSelRef.current?.type === 'asset' && Object.keys(patch).some(k => k !== 'rotate')) { // (in the video editor a look goes to the element on every slide of the video; its turn is its slide's)
      const seen = new Map(items.map(p => [`${p.frame}:${p.key}`, p]));
      for (const p of items) for (const q of sameInVideo(p.frame, p.key)) seen.set(`${q.frame}:${q.key}`, q);
      items = [...seen.values()];
    }
    if ('rotate' in patch) items = items.filter(({frame, key}) => { const stage = stageFor(frame), el = stage && elementOf(stage, key); return !isFixed(el); }); // (what is fixed in place does not turn)
    if (!selRef.current?.key || !items.length) return;
    const kinds = Object.fromEntries(items.map(({frame, key}) => { const stage = stageFor(frame), el = stage && elementOf(stage, key); return [`${frame}:${key}`, el ? (el.matches('.iq2-mark') ? 'outline' : lookKindOfRoot(el)) : null]; }));
    const ownOf = (cur, frame, key) => { const kind = kinds[`${frame}:${key}`], shared = kind && sharedLookOf(cur, kind), mine = kind && Object.fromEntries(Object.entries(patch).filter(([n]) => n in (shared ?? {}))); return mine && Object.keys(mine).length ? setOwnLook(cur, frame, key, kind, mine) : cur; }; // (the sidebar changes one slide: over a shared look, that part keeps what you gave it)
    commit(e => items.reduce((cur, {frame, key}) => ownOf(setStyle(cur, frame, key, patch), frame, key), e), {merge: `look:${items.map(p => `${p.frame}:${p.key}`).join(',')}:${name}`});
  };
  // Align the picked assets, frame by frame: one in its frame, several in a frame to the box around them.
  const alignSelected = where => {
    const moves = [];
    for (const {frame, keys} of groupsNow()) {
      const stage = stageFor(frame);
      if (!stage) continue;
      const u = unitOf(stage), items = keys.map(key => { const el = elementOf(stage, key); return el && !isFixed(el) && {key, el, b: stageBoxOf(stage, el)}; }).filter(Boolean);
      if (!items.length) continue;
      const area = items.length > 1 ? union(items.map(item => item.b)) : {x: 0, y: 0, w: FRAME.w, h: FRAME.h};
      for (const {key, el, b} of items) {
        const dx = where === 'left' ? area.x - b.x : where === 'hcenter' ? area.x + (area.w - b.w) / 2 - b.x : where === 'right' ? area.x + area.w - b.w - b.x : 0;
        const dy = where === 'top' ? area.y - b.y : where === 'vcenter' ? area.y + (area.h - b.h) / 2 - b.y : where === 'bottom' ? area.y + area.h - b.h - b.y : 0;
        const k = parentScale(el), t = translateOf(el), by = [dx * u / k, dy * u / k], off = offTail(stage, el, frame);
        moves.push({frame, key, to: [t[0] + by[0], t[1] + by[1]], tip: off && [off.tip0[0] + by[0], off.tip0[1] + by[1]]});
      }
    }
    if (moves.length) commit(e => moves.reduce((cur, m) => (m.tip ? setTip(setMove(cur, m.frame, m.key, m.to), m.frame, m.key, m.tip) : setMove(cur, m.frame, m.key, m.to)), e));
  };
  // W or H typed: a box gets that size, anything else is scaled to it (a UI element and a picture
  // keep their proportions); its top left corner stays where it is.
  const resizeSelected = (w, h) => {
    const s = selRef.current, stage = s?.key && stageFor(s.frame), el = stage && elementOf(stage, s.key);
    if (!el || isFixed(el)) return;
    const kind = resizeKind(el), u = unitOf(stage), r0 = screenRectOf(el), k = parentScale(el), lock = lockOf(editsRef.current, s.frame, s.key), keeps = !kind.free || kind.keep;
    if ((w && lock.w) || (h && lock.h) || (keeps && (lock.w || lock.h))) return; // locked
    let fx = w ? w * u / Math.max(1e-6, r0.width) : 1, fy = h ? h * u / Math.max(1e-6, r0.height) : 1;
    if (keeps) { const f = w ? fx : fy; fx = f; fy = f; }
    if (kind.mode === 'size') { const z = sizeOf(el); sizeTo(el, [Math.max(1, z[0] * fx), Math.max(1, z[1] * fy)]); } else { const z = scaleOf(el); scaleTo(el, [z[0] * fx, z[1] * fy]); }
    const now = screenRectOf(el), t = translateOf(el);
    moveTo(el, [t[0] + (r0.left - now.left) / k, t[1] + (r0.top - now.top) / k]);
    const box = kind.mode === 'size' ? sizeOf(el) : null, scale = scaleOf(el), to = translateOf(el);
    commit(e => setMove(box ? setBoxSize(e, s.frame, s.key, box) : setScale(e, s.frame, s.key, scale), s.frame, s.key, to), {merge: `size:${s.frame}:${s.key}`});
  };
  // Lock the width or the height of the picked assets (or unlock it). A chat box's width locked is
  // pinned at what it is, its words wrapping to it.
  const toggleLock = axis => {
    const s = selRef.current, items = itemsNow();
    if (!s?.key || !stageFor(s.frame)) return;
    const on = !lockOf(editsRef.current, s.frame, s.key)[axis];
    commit(e => items.reduce((cur, {frame, key}) => {
      const stage = stageFor(frame), was = lockOf(cur, frame, key), next = {...was, [axis]: on}, el = stage && elementOf(stage, key), given = cur.frames[frame]?.sizes?.[key];
      let out = setLock(cur, frame, key, `${next.w ? 'w' : ''}${next.h ? 'h' : ''}`);
      if (on && el && isBubble(el)) { const box = sizeOf(el); out = setBoxSize(out, frame, key, axis === 'w' ? [given?.[0] || box[0], given?.[1] ?? 0] : [given?.[0] ?? 0, given?.[1] || box[1]]); }
      return out;
    }, e));
  };
  // The picked assets as they were captured: place, size, scale, tail and styles (their words stay).
  const putBack = () => { const s = selRef.current, items = itemsNow(); if (s?.key) commit(e => items.reduce((cur, {frame, key}) => resetAsset(cur, frame, key), e)); };
  // Apply to all in this row / Delete in the whole row (the user, 2026-11-06, the board All storyboards): the picked assets as they are in this frame put on the same assets in every frame of its row,
  // or taken out of all of them (lib/storyboardEdits.mjs applyAlongRow, hideAlongRow). Only when pressed: nothing is linked (the user, 2026-11-09), and "the same asset" is the captured one with
  // the same key (lib/storyboardLinks.mjs); what was pasted, Alt+dragged or brought in is its frame's own.
  const rowTargetsOf = (cur, frameId, k) => {
    const frame = byIdRef.current[frameId], link = frame && linkOf(frame, cur.frames[frameId], k);
    if (!link) return [];
    return linkedLayers(baseFramesRef.current.filter(f => f.chapter === frame.chapter), cur, link.id).filter(m => !(m.frame === frameId && m.key === k));
  };
  // The picked assets (their layers) and how many of the same are in the other frames of the row (for the two buttons above).
  const rowInfo = (frameId, keys) => {
    const layers = [...new Set(keys.map(layerKeyOf))];
    return {layers, inRow: layers.reduce((n, k) => n + rowTargetsOf(editsRef.current, frameId, k).length, 0)};
  };
  const applyToRow = (frameId, layers) => {
    const n = layers.reduce((sum, k) => sum + rowTargetsOf(editsRef.current, frameId, k).length, 0);
    if (!n) { setStatus('Nothing else in this row has it.'); return; }
    commit(e => layers.reduce((cur, k) => applyAlongRow(cur, frameId, k, rowTargetsOf(cur, frameId, k)), e));
    setStatus(`Applied to all in this row: ${n} more.`);
  };
  const deleteInRow = (frameId, layers) => {
    const n = layers.reduce((sum, k) => sum + rowTargetsOf(editsRef.current, frameId, k).length, 0);
    commit(e => layers.reduce((cur, k) => hideAlongRow(cur, [{frame: frameId, key: k}, ...rowTargetsOf(cur, frameId, k)]), e));
    setSelection(null);
    setStatus(`Deleted in the whole row${n ? ` (${n + layers.length} in all)` : ''}.`);
  };
  const startTip = event => {
    event.stopPropagation(); event.preventDefault();
    const s = selRef.current, stage = stageFor(s.frame), key = s.key.split('/')[0];
    begin({type: 'tip', client: {x: event.clientX, y: event.clientY}, frame: s.frame, key, stage, t0: editsRef.current.frames[s.frame]?.tips?.[key] ?? [0, 0], u: unitOf(stage), moved: false});
  };
  const setPosition = (axis, value) => {
    const v = Number(value);
    if (!Number.isFinite(v) || overlay.info?.kind !== 'asset') return;
    moveSelectedBy(axis === 'x' ? v - overlay.info.x : 0, axis === 'y' ? v - overlay.info.y : 0);
  };
  const emptyTrash = () => {
    if (!frames.length || !window.confirm(`Delete ${frames.length === 1 ? 'the frame' : `all ${frames.length} frames`} in the Trash for good?`)) return;
    commit(e => removeFromTrash(e, e.trash.map(t => t.id)));
    setSelection(null); setFrameSel([]);
    notify('The Trash is empty');
  };

  // ---- Export, import, backups ----
  // Export: the whole storyboard (every board's changes, the Trash too) in one file, editable:
  // Import puts it back. Nothing is replaced without a backup first: in local development the
  // file's backups (content/storyboard/backups/, listed in the sidebar), else the storyboard as it
  // was is downloaded before the import.
  const importInput = useRef(null);
  const [backups, setBackups] = useState(null);
  const loadBackups = useCallback(async () => {
    if (!toFile) return;
    try { const response = await fetch(`/api/storyboard/backups?video=${videoId}`, {cache: 'no-store'}); if (response.ok) setBackups((await response.json()).backups ?? []); } catch {}
  }, [toFile, videoId]);
  const boardShown = loaded && tool !== 'pencil' && tool !== 'rect' && !selection && !lineSel;
  useEffect(() => { if (boardShown) loadBackups(); }, [boardShown, loadBackups]);
  const exportBoards = useCallback(async (name = 'storyboard') => {
    const boards = {};
    for (const b of BOARDS) boards[b.id] = b.id === videoId ? editsRef.current : (await loadSaved(b.id)).edits;
    const at = new Date().toISOString();
    download(`${name}-${at.slice(0, 16).replace(/[:T]/g, '-')}.json`, makeExport(boards, at));
  }, [videoId]);
  const importFile = useCallback(async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    let data = null;
    try { data = JSON.parse(await file.text()); } catch {}
    const boards = readExport(data, BOARDS.map(b => b.id));
    if (!boards.length) { setStatus('That file is not a storyboard export.'); return; }
    const names = boards.map(([id]) => BOARDS.find(b => b.id === id).name).join(', ');
    if (!window.confirm(`Import “${file.name}”?\n\nIt replaces ${names}. What is there now is backed up first${toFile ? ' (Backups, in the sidebar)' : ' (downloaded)'}.`)) return;
    try {
      if (!toFile) await exportBoards('storyboard-before-import');
      for (const [id, next] of boards) {
        const rev = toFile ? (await postSaved(id, next, null, 'import')).rev : null;
        keepLocal(id, rev, next);
        if (id === videoId) { if (rev != null) revRef.current = rev; dirty.current = false; setHistory(h => record(h, next)); }
      }
      setStatus(`Imported ${names}`);
      loadBackups();
    } catch (error) { setStatus(`The import stopped (${error.message}); the backup has what was there.`); }
  }, [exportBoards, loadBackups, toFile, videoId]);
  const restoreBackup = useCallback(async backup => {
    if (!window.confirm(`Put this board back as it was on ${when(backup.at)}?\n\nWhat is there now is backed up first.`)) return;
    try {
      const response = await fetch(`/api/storyboard/backups?video=${videoId}&name=${encodeURIComponent(backup.name)}`, {cache: 'no-store'});
      if (!response.ok) throw new Error('it could not be read');
      const next = normalizeEdits((await response.json()).edits), done = await postSaved(videoId, next, null, 'restore');
      revRef.current = done.rev; dirty.current = false;
      keepLocal(videoId, done.rev, next);
      setHistory(h => record(h, next));
      setStatus(`Back as it was on ${when(backup.at)}`);
      loadBackups();
    } catch (error) { setStatus(`Not restored (${error.message}).`); }
  }, [loadBackups, videoId]);
  const backupNow = useCallback(async () => {
    try {
      const response = await fetch('/api/storyboard/backups', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({video: videoId})});
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'it failed');
      setStatus('Backed up');
      loadBackups();
    } catch (error) { setStatus(`Not backed up (${error.message}).`); }
  }, [loadBackups, videoId]);

  // ---- The sidebar's panels: the pencil, the picked asset(s), frame(s) or line, else the board ----
  const lineNow = lineSel ? lines.find(l => l.id === lineSel) ?? null : null;
  const assetPanel = () => {
    const L = info.look ?? {}, own = info.own ?? {}, many = !!info.count, links = rowInfo(selection.frame, keysNow()), fixedOne = !!info.fixed && !many; // (the background: fixed in place)
    const fillPaint = isGradient(own.fill) ? own.fill : null, fill = fillPaint ?? solidHex(own.fill ?? L.fill), stroke = solidHex(own.stroke ?? L.stroke), weight = own.weight ?? L.weight ?? 400;
    const weights = WEIGHTS.some(([w]) => w === weight) ? WEIGHTS : [...WEIGHTS, [weight, String(weight)]].sort((a, b) => a[0] - b[0]);
    return <>
      <div className="sb-side-head"><b>{many ? `${info.count} assets` : info.name}</b><small>Frame {info.frame}</small></div>
      <Section title="Position" tools={<>
        <ToolButton icon={PanelIcon.copyPos} label="Copy the position (Ctrl+Shift+C)" onClick={copyPosition}/>
        <ToolButton icon={PanelIcon.pastePos} label="Paste the position (Ctrl+Shift+V)" onClick={pastePosition} disabled={!copiedPosition()}/>
      </>}>
        {fixedOne && <p className="sb-side-note">Locked in place: its color and look change, not its position or size.</p>}
        {!fixedOne && <IconButtons items={ALIGN} value={null} onChange={alignSelected}/>}
        <div className="sb-row">
          <NumField label="X" value={info.x} disabled={fixedOne} onChange={v => setPosition('x', v)}/>
          <NumField label="Y" value={info.y} disabled={fixedOne} onChange={v => setPosition('y', v)}/>
        </div>
        {!info.bubble && <div className="sb-row"><NumField label={PanelIcon.rotate} title="Rotation" value={own.rotate ?? 0} unit="°" disabled={fixedOne} onChange={v => setLook({rotate: v || null})}/><span className="sb-row-fill"/></div>}
      </Section>
      <Section title="Layout">
        <div className="sb-row">
          <NumField label="W" value={info.w} min={1} disabled={many || fixedOne || info.lock?.w} onChange={v => resizeSelected(v, null)}/>
          {!fixedOne && <LockButton on={info.lock?.w} label="width" onClick={() => toggleLock('w')}/>}
          <NumField label="H" value={info.h} min={1} disabled={many || fixedOne || info.lock?.h} onChange={v => resizeSelected(null, v)}/>
          {!fixedOne && <LockButton on={info.lock?.h} label="height" onClick={() => toggleLock('h')}/>}
        </div>
      </Section>
      <Section title="Appearance">
        <div className="sb-row">
          <NumField label={PanelIcon.opacity} title="Opacity" value={Math.round((own.opacity ?? L.opacity ?? 1) * 100)} unit="%" min={0} max={100} onChange={v => setLook({opacity: v >= 100 ? null : v / 100}, 'opacity')}/>
          <NumField label={PanelIcon.radius} title="Corner radius" value={own.radius ?? L.radius ?? 0} min={0} disabled={info.bubble} onChange={v => setLook({radius: v}, 'radius')}/>
        </div>
      </Section>
      {info.device && <Section title="Device color" add={own.bezel ? null : () => setLook({bezel: '#535353'}, 'bezel')} addLabel="Change the color of the iPad's frame">
        {own.bezel && <PaintField label="Device color" edge value={own.bezel} onChange={paint => setLook({bezel: paint}, 'bezel')} onRemove={() => setLook({bezel: null})}/>}
      </Section>}
      {info.ink ? <Section title="Drawing">
        <ColorWheel value={info.ink.color} onChange={color => restyle({color})}/>
        <div className="sb-row"><NumField label="W" title="Stroke width" value={info.ink.width} min={PEN_WIDTHS.min} max={PEN_WIDTHS.max} onChange={width => restyle({width})}/><span className="sb-row-fill"/></div>
      </Section> : <>
        <Section title="Fill" add={fill ? null : () => setLook({fill: info.bubble ? null : '#ffffff'})} addLabel={info.bubble ? 'Bring the fill back' : 'Add a fill'}>
          {fill && <PaintField label="Fill" gradients={!info.bubble} presets={!info.bubble} value={fill} onChange={paint => setLook({fill: paint}, 'fill')} onRemove={info.bubble ? () => setLook({fill: 'transparent'}) : own.fill ? () => setLook({fill: null}) : () => setLook({fill: 'transparent'})}/>}
        </Section>
        <Section title="Stroke" add={stroke ? null : () => setLook({stroke: '#111111', strokeWidth: 2})}>
          {stroke && <>
            <ColorField label="Stroke" value={stroke} onChange={color => setLook({stroke: color}, 'stroke')} onRemove={own.stroke != null || own.strokeWidth != null ? () => setLook({stroke: null, strokeWidth: null}) : info.bubble ? null : () => setLook({strokeWidth: 0})}/>
            <div className="sb-row"><NumField label="W" title="Stroke weight" value={own.strokeWidth ?? L.strokeWidth ?? 1} min={0} step={0.5} onChange={v => setLook({strokeWidth: v}, 'strokeWidth')}/><span className="sb-row-fill"/></div>
          </>}
        </Section>
      </>}
      {info.chat && !many && <Section title="Chat box">
        <div className="sb-buttons">
          <button type="button" className={info.chat.tail && info.chat.hasTail ? 'is-on' : ''} disabled={!info.chat.hasTail} onClick={() => commit(e => setBubble(e, selection.frame, selection.key, {tail: info.chat.tail ? false : null}))} title={info.chat.hasTail ? 'Show or take off its tail' : 'It has no tail'}>{info.chat.tail && info.chat.hasTail ? 'Tail on' : 'Tail off'}</button>
          <button type="button" className={info.chat.words ? 'is-on' : ''} onClick={() => commit(e => setBubble(e, selection.frame, selection.key, {words: !info.chat.words}))} title="Show or hide its words">{info.chat.words ? 'Words shown' : 'Words hidden'}</button>
        </div>
      </Section>}
      {info.chat && !many && (() => {
        const anim = animOf(edits, selection.frame, selection.key);
        return <Section title="Handwriting">
          <div className="sb-buttons">
            <button type="button" className={anim ? 'is-on' : ''} onClick={() => commit(e => setAnim(e, selection.frame, selection.key, anim ? null : {type: 'handwrite', cps: ANIM_CPS.default}))} title="The words are written by a pen, stroke by stroke, when the slide is played">{anim ? 'Written by hand' : 'Write by hand'}</button>
            {anim && <button type="button" onClick={() => (playing ? stopWriting() : playFrame(selection.frame))}>{playing ? 'Stop' : 'Play'}</button>}
          </div>
          {anim && (() => {
            const cps = animCps(anim, elementOf(stageFor(selection.frame), selection.key)?.querySelector('p')?.textContent);
            return <label className="sb-light" title="How fast the words are written: letters a second">
              <span>Speed</span>
              <input type="range" min={ANIM_CPS.min} max={ANIM_CPS.max} step={1} value={cps} onChange={event => commit(e => setAnim(e, selection.frame, selection.key, {type: 'handwrite', cps: Number(event.target.value)}), {merge: `anim:${selection.frame}:${selection.key}`})}/>
              <span className="sb-num">{Math.round(cps)} letters/s</span>
            </label>;
          })()}
        </Section>;
      })()}
      <Section title="Effects" addLabel="Add an effect" onAdd={v => setLook(v === 'shadow' ? {shadow: true} : v === 'blur' ? {blur: 4} : {bgBlur: 8})}
        addMenu={[!info.bubble && !own.shadow && {value: 'shadow', label: 'Drop shadow'}, own.blur == null && {value: 'blur', label: 'Layer blur'}, !info.bubble && own.bgBlur == null && {value: 'bgBlur', label: 'Background blur'}].filter(Boolean)}>
        {own.shadow && <EffectRow icon={PanelIcon.shadow} name="Drop shadow" onRemove={() => setLook({shadow: null})}/>}
        {own.blur != null && <EffectRow icon={PanelIcon.blur} name="Layer blur" value={own.blur} onChange={v => setLook({blur: v}, 'blur')} onRemove={() => setLook({blur: null})}/>}
        {own.bgBlur != null && <EffectRow icon={PanelIcon.bgBlur} name="Background blur" value={own.bgBlur} onChange={v => setLook({bgBlur: v}, 'bgBlur')} onRemove={() => setLook({bgBlur: null})}/>}
      </Section>
      {L.text && !info.ink && <Section title="Text">
        <SelectField wide label="Font" value={own.font ?? L.font ?? ''} options={[...(own.font ?? L.font ? [] : [{value: '', label: 'As designed', disabled: true}]), ...Object.entries(FONTS).map(([value, label]) => ({value, label}))]} onChange={v => setLook({font: v})}/>
        <div className="sb-row">
          <SelectField label="Weight" value={String(weight)} options={weights.map(([value, label]) => ({value: String(value), label}))} onChange={v => setLook({weight: Number(v)})}/>
          <NumField label="Aa" title="Font size" value={own.size ?? L.size} min={1} onChange={v => setLook({size: v, ...(scaledLineHeight(own.lineHeight, own.size ?? L.size, v) ? {lineHeight: scaledLineHeight(own.lineHeight, own.size ?? L.size, v)} : {})}, 'size')}/>
        </div>
        <div className="sb-row">
          <NumField label={PanelIcon.lineHeight} title="Line height" value={own.lineHeight ?? L.lineHeight} min={0} placeholder="Auto" onChange={v => setLook({lineHeight: v || null}, 'lineHeight')}/>
          <NumField label={PanelIcon.spacing} title="Letter spacing" value={own.letterSpacing ?? L.letterSpacing ?? 0} step={0.1} onChange={v => setLook({letterSpacing: v || null}, 'letterSpacing')}/>
        </div>
        <IconButtons items={TEXT_ALIGN} value={own.align ?? L.align} onChange={v => setLook({align: v})}/>
        <div className="sb-sublabel">Color</div>
        <ColorField label="Text color" value={solidHex(own.color ?? L.color) ?? '#000000'} onChange={color => setLook({color}, 'color')} onRemove={own.color ? () => setLook({color: null}) : null}/>
      </Section>}
      <Section title={many ? 'Assets' : 'Asset'}>
        <div className="sb-buttons">
          <button type="button" onClick={putBack} disabled={!info.changed && !many}>Put back</button>
          {links.inRow > 0 && <button type="button" onClick={() => applyToRow(selection.frame, links.layers)} title="Put what was done to it here (its place, size, look; not its words) on the same piece in every frame of this row">Apply to all in this row</button>}
          <button type="button" onClick={removeSelected} disabled={!info.top}>Delete</button>
        </div>
      </Section>
    </>;
  };
  const setFrameBackground = paint => { const ids = (frameSel.length ? frameSel : [selection.frame]).filter(id => byIdRef.current[id]); commit(e => ids.reduce((cur, id) => { const next = setBackground(cur, id, paint); return sharedLookOf(next, 'background').fill ? setOwnLook(next, id, BACKGROUND, 'background', paint ? {fill: paint} : null) : next; }, e), {merge: `background:${ids.join(',')}`}); }; // (over a shared background, the slide keeps the one you gave it)
  const backgroundNow = backgroundOf(edits, selection?.frame ?? '');
  const framePanel = () => <>
    <div className="sb-side-head"><b>{info.many ? `${info.many} frames` : `Frame ${info.frame}`}</b>{!info.many && <small>{selFrame.label}{info.copy && !selFrame.isBlank ? ' · copy' : ''}</small>}</div>
    {!trashing && !info.many && <Section title="Name"><TextField allowEmpty label="Frame name" value={edits.frames[selection.frame]?.name ?? ''} onChange={name => commit(e => setName(e, selection.frame, name))}/></Section>}
    {!trashing && !info.many && <Section title="Line">
      <SelectField wide label="Line" value={selFrame.chapter} options={lines.map(l => ({value: l.id, label: l.title}))} onChange={line => moveFrameToLine(selection.frame, line)}/>
    </Section>}
    {!trashing && <Section title="Background" add={backgroundNow ? null : () => setFrameBackground('#ffffff')} addLabel="Change the background">
      <PaintField label="Background" value={backgroundNow ?? '#ffffff'} onChange={setFrameBackground} onRemove={backgroundNow ? () => setFrameBackground(null) : null}/>
    </Section>}
    <Section title={info.many ? 'Frames' : 'Frame'}>
      <div className="sb-buttons">
        {!trashing && <button type="button" onClick={() => duplicate(frameSel.length ? frameSel : [selection.frame])}>Duplicate</button>}
        {!trashing && !info.many && <button type="button" onClick={() => addBlankAfter(selection.frame)}>Add frame after</button>}
        {!trashing && copiedPosition() && <button type="button" onClick={pastePosition} title={`The same asset in ${info.many ? 'each picked frame' : 'this frame'} goes where the copied one was (Ctrl+Shift+V)`}>Paste position</button>}
        {!info.many && <button type="button" onClick={() => commit(e => resetFrame(e, selection.frame))} disabled={trashing || !hasChanges(edits, selection.frame)}>Reset</button>}
        <button type="button" onClick={removeSelected}>{trashing ? 'Delete for good' : 'Delete'}</button>
      </div>
    </Section>
  </>;
  const linePanel = () => {
    const count = frames.filter(f => f.chapter === lineNow.id).length;
    return <>
      <div className="sb-side-head"><b>Line</b><small>{cells.lines.get(lineNow.id) && !cells.lines.get(lineNow.id).slides ? `${count} video${count === 1 ? '' : 's'}` : `${count} frame${count === 1 ? '' : 's'}`}</small></div>
      <Section title="Name"><TextField label="Line name" value={lineNow.title} disabled={trashing} onChange={title => renameLineTo(lineNow.id, title)}/></Section>
      {!trashing && cells.lines.has(lineNow.id) && <Section title="Show">
        <div className="sb-buttons">
          <button type="button" className={cells.lines.get(lineNow.id).slides ? '' : 'is-on'} onClick={() => showLineAs(lineNow.id, 'videos')} title="Each animation is a video you can play">Videos</button>
          <button type="button" className={cells.lines.get(lineNow.id).slides ? 'is-on' : ''} onClick={() => showLineAs(lineNow.id, 'slides')} title="The slides the videos are made of: to move and retype what is on them">Slides</button>
        </div>
      </Section>}
      <Section title="Line">
        <div className="sb-buttons">
          {!trashing && <button type="button" onClick={() => addFrameIn(lineNow.id)}>Add frame</button>}
          {!trashing && <button type="button" onClick={() => addLineAfter(lineNow.id)}>Add line below</button>}
          {!trashing && <button type="button" onClick={() => duplicateLineOf(lineNow.id)}>Duplicate</button>}
          <button type="button" onClick={() => deleteLineOf(lineNow.id)}>{trashing ? 'Delete for good' : 'Delete'}</button>
        </div>
      </Section>
    </>;
  };
  const boardPanel = () => <>
    <div className="sb-side-head"><b>{video.name}</b><small>{lines.length} line{lines.length === 1 ? '' : 's'} · {frames.length} frame{frames.length === 1 ? '' : 's'}</small></div>
    {trashing
      ? <Section title="Trash"><div className="sb-buttons"><button type="button" onClick={emptyTrash} disabled={!frames.length}>Empty Trash</button></div></Section>
      : <Section title="Lines"><div className="sb-buttons"><button type="button" onClick={() => addLineAfter(lines.at(-1)?.id ?? null)}>Add line</button></div></Section>}
    <Section title="Storyboard">
      <div className="sb-buttons">
        <button type="button" onClick={async () => { await exportBoards(); setStatus('Exported'); }}>Export</button>
        <button type="button" onClick={() => importInput.current?.click()}>Import</button>
        {toFile && <button type="button" onClick={backupNow}>Back up now</button>}
      </div>
      <input ref={importInput} type="file" accept=".json,application/json" hidden onChange={importFile}/>
    </Section>
    {toFile && <Section title="Backups">
      {backups?.length
        ? <ul className="sb-backups">{backups.slice(0, 40).map(b => <li key={b.name}><span><b>{when(b.at)}</b><i>{b.reason}</i></span><button type="button" onClick={() => restoreBackup(b)}>Restore</button></li>)}</ul>
        : <p className="sb-side-none">{backups ? 'None yet' : '…'}</p>}
    </Section>}
  </>;
  const LOOK_PARTS = [['background', 'Background'], ['plate', 'Plate'], ['panel', 'Gray side'], ['outline', 'Yellow outline'], ['connector', 'Connector lines']];
  const HEAD_NAMES = [['arrow', 'Arrow'], ['triangle', 'Triangle'], ['dot', 'Dot'], ['none', 'None']]; // (a connector's arrow head: lib/storyboardEdits.mjs ARROW_HEADS)
  const videoPanel = () => {
    const ids = videoSel.frameIds(), mineOf = kind => ids.map(id => edits.frames[id]?.ownLooks?.[ownKeyOf(kind)]).find(Boolean), anyOwn = ['background', 'plate', 'panel', 'outline', 'connector', 'words'].some(kind => Object.keys(mineOf(kind) ?? {}).some(n => n !== 'hide')); // (deleted lines are not something to apply to all)
    const hasConnectors = ids.some(id => allById[id] && layersOf(allById[id], edits.frames[id]).some(l => /sec-flow-lines|sec-rk-arrows/.test(edits.library[l.asset] ?? video.assets[l.asset] ?? ''))); // (the purple lines between cards: only a video that has them shows their section)
    const ownWords = mineOf('words'), words = {...videoTextKindOf(edits, 'words'), ...(ownWords ?? {})}, wordsWeight = words.weight ?? 500, setWords = (patch, name) => changeVideoLook('words', ids, patch, name);
    return <>
      <div className="sb-side-head"><b>{videoSel.title || 'Video'}</b><small>Video · {ids.length} slide{ids.length === 1 ? '' : 's'} · changes stay on this video until Apply to all</small></div>
      {textEd ? <TextFields key={textEd.title} edit={textEd}/> : <Section title="Words" tools={ownWords ? <ToolButton icon={PanelIcon.minus} label="Back to how all the videos write their words" onClick={() => resetVideoLook('words', ids)}/> : null}>
        <SelectField wide label="Font" value={words.font ?? 'montserrat'} options={Object.entries(FONTS).map(([value, label]) => ({value, label}))} onChange={v => setWords({font: v})}/>
        <div className="sb-row">
          <SelectField label="Weight" value={String(wordsWeight)} options={WEIGHTS.map(([value, label]) => ({value: String(value), label}))} onChange={v => setWords({weight: Number(v)})}/>
          <NumField label="Aa" title="Text size" value={words.fontSize ?? 26} min={4} onChange={v => setWords({fontSize: v})}/>
        </div>
        <IconButtons items={TEXT_ALIGN.filter(a => a.id !== 'justify')} value={words.align ?? 'center'} onChange={v => setWords({align: v})}/>
        <div className="sb-sublabel">Color</div>
        <ColorField label="Words color" value={words.color ?? '#ffffff'} onChange={color => setWords({color})}/>
      </Section>}
      {videoSel.title && (() => { // (the video's Speed, the user, 2026-10-29: "add a way to change speed from editor": the pen's letters a second, and the seconds a highlighted scene takes; `edits.speed`, withSpeed)
        const title = videoSel.title, own = videoSpeedOf(edits, title), usual = profileOf(video.video, title), cps = own.cps ?? usual?.cps ?? ANIM_CPS.default, seconds = own.seconds ?? usual?.beats?.seconds;
        const setSpeed = (patch, name) => commit(e => setVideoSpeed(e, title, patch), {merge: `speed:${title}:${name}`});
        return <Section title="Speed" tools={Object.keys(own).length ? <ToolButton icon={PanelIcon.minus} label="Back to this video's usual speed" onClick={() => commit(e => setVideoSpeed(e, title, {cps: null, seconds: null}))}/> : null}>
          <label className="sb-light" title="How fast the words are written: letters a second">
            <span>Words</span>
            <input type="range" min={SPEED.cps.min} max={SPEED.cps.max} step={1} value={cps} onChange={event => setSpeed({cps: Number(event.target.value)}, 'cps')}/>
            <span className="sb-num">{Math.round(cps)} letters/s</span>
          </label>
          {seconds != null && <label className="sb-light" title="The seconds a highlighted scene takes: the highlight comes in, then the words are written, together (the scene then stays a moment more)">
            <span>Scene</span>
            <input type="range" min={SPEED.seconds.min} max={SPEED.seconds.max} step={0.1} value={seconds} onChange={event => setSpeed({seconds: Number(event.target.value)}, 'seconds')}/>
            <span className="sb-num">{seconds.toFixed(1)} s</span>
          </label>}
        </Section>;
      })()}
      {LOOK_PARTS.filter(([kind]) => kind !== 'connector' || hasConnectors).map(([kind, name]) => {
        const mine = mineOf(kind), set = mine ?? sharedLookOf(edits, kind), shown = videoSel.lookOf(kind);
        const look = kind === 'outline' ? {stroke: set?.stroke ?? solidHex(shown?.stroke) ?? '#ffc800', strokeWidth: set?.strokeWidth ?? Math.round(shown?.strokeWidth ?? 6)}
          : kind === 'connector' ? {stroke: set?.stroke ?? solidHex(shown?.stroke) ?? '#7b3cf0', strokeWidth: set?.strokeWidth ?? shown?.strokeWidth ?? 3, arrow: set?.arrow ?? shown?.arrow ?? 'arrow'}
          : {fill: set?.fill ?? paintFromCss(shown?.fill) ?? '#ffffff'};
        return <div key={kind} className={`sb-look${videoSel.focus === kind ? ' is-focus' : ''}`} ref={videoSel.focus === kind ? el => { if (el && scrolledTo.current !== videoSel.at) { scrolledTo.current = videoSel.at; el.scrollIntoView({block: 'nearest'}); } } : undefined}>
          <Section title={name} tools={mine ? <ToolButton icon={PanelIcon.minus} label={`Back to how all the videos have the ${name.toLowerCase()}`} onClick={() => resetVideoLook(kind, ids)}/> : null}>
            {kind === 'outline' ? <>
              <ColorField label="Outline color" value={look.stroke} onChange={stroke => changeVideoLook(kind, ids, {stroke})}/>
              <div className="sb-row"><NumField label="W" title="Thickness" value={look.strokeWidth} min={1} max={24} onChange={strokeWidth => changeVideoLook(kind, ids, {strokeWidth})}/><span className="sb-row-fill"/></div>
            </> : kind === 'connector' ? <>
              <div className="sb-seg sb-heads" role="group" aria-label="Arrow head">{HEAD_NAMES.map(([id, label]) => <button key={id} type="button" className={look.arrow === id ? 'is-on' : ''} aria-pressed={look.arrow === id} onClick={() => changeVideoLook(kind, ids, {arrow: id})}>{label}</button>)}</div>
              <ColorField label="Line color" value={look.stroke} onChange={stroke => changeVideoLook(kind, ids, {stroke})}/>
              <div className="sb-row"><NumField label="W" title="Thickness" value={look.strokeWidth} min={1} max={12} step={0.5} onChange={strokeWidth => changeVideoLook(kind, ids, {strokeWidth})}/><span className="sb-row-fill"/></div>
              <div className="sb-buttons">
                <button type="button" disabled={!videoSel.line} onClick={() => deleteVideoLine(ids, videoSel.line)} title={videoSel.line ? 'Delete the line you double-clicked from this video (Delete)' : 'Double-click a line in the video to pick it'}>{videoSel.line ? 'Delete this line' : 'Double-click a line to delete it'}</button>
                {mine?.hide?.length > 0 && <button type="button" onClick={() => changeVideoLook(kind, ids, {hide: null})} title="Show again the lines deleted from this video">Bring back the lines ({mine.hide.length})</button>}
              </div>
            </> : <PaintField label={name} value={look.fill} onChange={fill => changeVideoLook(kind, ids, {fill})}/>}
          </Section>
        </div>;
      })}
      <div className="sb-apply-all">
        <button type="button" disabled={!anyOwn} onClick={() => applyVideoToAll(ids)} title={anyOwn ? 'Give this video\'s look (its words, background, plate, gray side, outlines) to every video and slide of every board' : 'Nothing changed on this video yet'}>Apply to all</button>
        <small>{anyOwn ? 'Every video and slide of every board takes this video\'s look · Ctrl+Z takes it back' : 'What you change here stays on this video'}</small>
      </div>
      {process.env.NODE_ENV !== 'production' && videoSel.title && <ExportSection board={video.video} title={videoSel.title}/>}
    </>;
  };
  // ---- The video editor's inspector: a layer of the video (lib/storyboardLayers.mjs), its values at the editor's time; ◆ a keyframe there ----
  const LAYER_KIND_NAMES = {rect: 'Rectangle', ellipse: 'Ellipse', text: 'Text', image: 'Image', path: 'Path'};
  const CAP_OPTIONS = CAPS.map(value => ({value, label: CAP_NAMES[value]})), titled = list => list.map(value => ({value, label: value[0].toUpperCase() + value.slice(1)}));
  const layerPanel = () => {
    const l = videoLayersOf(edits, veTitleRef.current).find(x => x.id === veSel.id);
    if (!l) return <div className="sb-side-head"><b>Layer</b><small>It is not in this video any more</small></div>;
    const t = veT, val = p => layerValueAt(l, p, t), set = (patch, merge) => layerOps.change(l.id, x => setLayerAt(x, t, patch), merge), two = n => Math.round(n * 100) / 100;
    const keyed = props => props.some(p => layerAnimated(l, p)), here = props => props.some(p => (l.keys ?? []).some(k => k[p] != null && Math.abs(k.t - t) < 1 / 60));
    const keyButton = (props, name) => <button type="button" className={`sb-lkey${keyed(props) ? ' is-on' : ''}${here(props) ? ' is-here' : ''}`} title={here(props) ? `Take the ${name} keyframe at ${two(t)} s off` : `A ${name} keyframe at ${two(t)} s (the ${name} is animated from then on)`} aria-label={`${name} keyframe`}
      onClick={() => layerOps.change(l.id, x => (here(props) ? props.reduce((c, p) => removeLayerKey(c, t, p), x) : setLayerAt(props.reduce((c, p) => (layerAnimated(c, p) ? c : setLayerAnimated(c, p, t, true)), x), t, Object.fromEntries(props.map(p => [p, layerValueAt(x, p, t)])))))}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12 12 3.5Z"/></svg></button>;
    const shape = l.kind === 'rect' || l.kind === 'ellipse', times = layerKeyTimes(l);
    return <>
      <div className="sb-side-head"><b>{l.name}</b><small>{LAYER_KIND_NAMES[l.kind]} · a layer of this video · values at {two(t)} s</small></div>
      <Section title="Position" tools={keyButton(['x', 'y'], 'position')}>
        <IconButtons items={ALIGN.map(a => ({...a, label: `${a.label} of the picture`}))} value={null} onChange={kind => veActions.current?.align(kind)}/>
        <div className="sb-row"><NumField label="X" value={Math.round(val('x'))} onChange={v => set({x: v}, `lx:${l.id}`)}/><NumField label="Y" value={Math.round(val('y'))} onChange={v => set({y: v}, `ly:${l.id}`)}/></div>
        <div className="sb-row"><NumField label={PanelIcon.rotate} title="Rotation" value={two(val('rotation'))} unit="°" onChange={v => set({rotation: v}, `lr:${l.id}`)}/>{keyButton(['rotation'], 'rotation')}<span className="sb-row-fill"/></div>
      </Section>
      <Section title="Layout" tools={keyButton(['w', 'h'], 'size')}>
        <div className="sb-row"><NumField label="W" min={1} value={Math.round(val('w'))} onChange={v => set({w: v}, `lw:${l.id}`)}/><NumField label="H" min={1} value={Math.round(val('h'))} onChange={v => set({h: v}, `lh:${l.id}`)}/></div>
      </Section>
      <Section title="Appearance" tools={keyButton(['opacity'], 'opacity')}>
        <div className="sb-row">
          <NumField label={PanelIcon.opacity} title="Opacity" unit="%" min={0} max={100} value={Math.round(val('opacity') * 100)} onChange={v => set({opacity: v / 100}, `lo:${l.id}`)}/>
          {l.kind === 'rect' ? <NumField label={PanelIcon.radius} title="Corner radius" min={0} value={l.radius ?? 0} onChange={v => layerOps.change(l.id, {radius: v}, `lrad:${l.id}`)}/> : <span className="sb-row-fill"/>}
        </div>
      </Section>
      <Section title="Blend and label">
        <SelectField wide label="Blend mode" value={l.blend ?? 'normal'} options={BLEND_MODES.map(([value, label]) => ({value, label}))} onChange={blend => layerOps.change(l.id, {blend: blend === 'normal' ? null : blend})}/>
        <SelectField wide label="Label color (the color of its bar)" value={String(l.label ?? KIND_LABEL[l.kind])} options={LABELS.map((x, i) => ({value: String(i + 1), label: x.name}))} onChange={v => layerOps.change(l.id, {label: Number(v)})}/>
      </Section>
      <Section title="Effects" addMenu={EFFECT_TYPES.map(type => ({value: type, label: EFFECTS[type].name}))} addLabel="Add an effect" onAdd={type => layerOps.change(l.id, x => addEffect(x, type).layer)}>
        {(l.fx ?? []).length === 0 && <p className="sb-side-note">None. + adds Gaussian Blur, Drop Shadow, Glow, Brightness, Contrast, Saturation, Hue, Black &amp; White, Sepia or Invert; each number can be keyframed (the ◆).</p>}
        {(l.fx ?? []).map((e, n, all) => <div key={e.id} className="sb-fx">
          <div className="sb-row sb-fx-head">
            <label className="sb-fx-on" title="The effect on or off"><input type="checkbox" checked={e.on !== false} onChange={ev => layerOps.change(l.id, x => patchEffect(x, e.id, {on: ev.target.checked}))}/><b>{EFFECTS[e.type].name}</b></label>
            <button type="button" className="sb-sec-btn" disabled={n === 0} onClick={() => layerOps.change(l.id, x => moveEffect(x, e.id, -1))} title="Up: it is applied before the one above" aria-label="Move the effect up">↑</button>
            <button type="button" className="sb-sec-btn" disabled={n === all.length - 1} onClick={() => layerOps.change(l.id, x => moveEffect(x, e.id, 1))} title="Down" aria-label="Move the effect down">↓</button>
            <ToolButton icon={PanelIcon.minus} label={`Remove ${EFFECTS[e.type].name}`} onClick={() => layerOps.change(l.id, x => removeEffect(x, e.id))}/>
          </div>
          {EFFECTS[e.type].params.map(p => { const prop = fxProp(e.id, p.id); return <div key={p.id} className="sb-row sb-effect">
            <span className="sb-effect-name">{p.name}</span>
            <NumField label={p.unit || '#'} title={p.name} min={p.min} max={p.max} step={p.step ?? 1} value={two(val(prop))} onChange={v => set({[prop]: v}, `lfx:${l.id}:${prop}`)}/>
            {keyButton([prop], p.name)}
          </div>; })}
          {EFFECTS[e.type].color && <ColorField label="Color" value={e.color ?? EFFECTS[e.type].color} onChange={color => layerOps.change(l.id, x => patchEffect(x, e.id, {color}), `lfxc:${l.id}:${e.id}`)}/>}
        </div>)}
      </Section>
      {l.kind === 'path' && <>
        <Section title="Line">
          <ColorField label="Line color" value={l.stroke ?? '#7b3cf0'} onChange={stroke => layerOps.change(l.id, {stroke}, `lstroke:${l.id}`)}/>
          <div className="sb-row">
            <NumField label="W" title="Line width (0: no line)" min={0} max={200} step={0.5} value={l.strokeWidth ?? 3} onChange={v => layerOps.change(l.id, {strokeWidth: v}, `lsw:${l.id}`)}/>
            <SelectField label="Dash" value={l.dash ?? 'solid'} options={titled(DASHES)} onChange={dash => layerOps.change(l.id, {dash})}/>
          </div>
          <div className="sb-row">
            <SelectField label="Cap" value={l.lineCap ?? 'round'} options={titled(LINE_CAPS)} onChange={lineCap => layerOps.change(l.id, {lineCap})}/>
            <SelectField label="Join" value={l.lineJoin ?? 'round'} options={titled(LINE_JOINS)} onChange={lineJoin => layerOps.change(l.id, {lineJoin})}/>
          </div>
        </Section>
        <Section title="Ends">
          <SelectField wide label="Start" value={l.startCap ?? 'none'} options={CAP_OPTIONS} onChange={startCap => layerOps.change(l.id, {startCap})}/>
          <SelectField wide label="End" value={l.endCap ?? 'none'} options={CAP_OPTIONS} onChange={endCap => layerOps.change(l.id, {endCap})}/>
          <div className="sb-row"><NumField label="Size" title="The size of the ends (1: as drawn from the line's width)" min={0.25} max={8} step={0.25} value={l.capScale ?? 1} onChange={capScale => layerOps.change(l.id, {capScale}, `lcap:${l.id}`)}/><span className="sb-row-fill"/></div>
          <div className="sb-buttons"><button type="button" onClick={() => layerOps.change(l.id, x => ({...x, startCap: x.endCap, endCap: x.startCap}))} title="The start end takes the end's shape and the other way round">Swap the two ends</button></div>
        </Section>
        <Section title="Trim Paths" tools={null}>
          <div className="sb-row"><NumField label="Start" unit="%" min={0} max={100} value={Math.round(val('trimStart') * 1000) / 10} onChange={v => set({trimStart: Math.max(0, Math.min(100, v)) / 100}, `ltrs:${l.id}`)}/>{keyButton(['trimStart'], 'trim start')}</div>
          <div className="sb-row"><NumField label="End" unit="%" min={0} max={100} value={Math.round(val('trimEnd') * 1000) / 10} onChange={v => set({trimEnd: Math.max(0, Math.min(100, v)) / 100}, `ltre:${l.id}`)}/>{keyButton(['trimEnd'], 'trim end')}</div>
          <p className="sb-side-note">The line is drawn from its start to its end as End goes from 0 to 100 % (the ◆ makes keyframes; Linear in Keyframes below keeps the speed even).</p>
        </Section>
        <Section title={`Points (${l.points?.length ?? 0})`}>
          <label className="sb-row"><input type="checkbox" checked={!!l.closed} onChange={ev => layerOps.change(l.id, x => refitPath({...x, closed: ev.target.checked}))}/> Closed (the last point joins the first)</label>
          {l.closed && <ColorField label="Fill" value={l.fill ?? '#7b3cf0'} onChange={fill => layerOps.change(l.id, {fill}, `lfill:${l.id}`)} onRemove={l.fill ? () => layerOps.change(l.id, {fill: null}) : undefined}/>}
          <div className="sb-buttons">
            <button type="button" onClick={() => layerOps.change(l.id, x => refitPath({...x, points: x.points.reduce((pts, _, i) => setSmooth(pts, x.closed, i, true), x.points)}))} title="Every point smooth: its handles along the line">All smooth</button>
            <button type="button" onClick={() => layerOps.change(l.id, x => refitPath({...x, points: x.points.map(({ix, iy, ox, oy, smooth, ...rest}) => rest)}))} title="Every point a corner: no handles">All corners</button>
            <button type="button" onClick={() => layerOps.change(l.id, x => refitPath({...x, points: reversePoints(x.points)}))} title="The first point becomes the last: the ends swap places">Reverse</button>
          </div>
          <p className="sb-side-note">Pick the path, then press a point to move it (Shift: more) · Alt + press: smooth / corner · drag its handles to bend the line · Delete takes the points picked off · double-click the line adds one · P is the Pen</p>
          {l.replaces?.length > 0 && <p className="sb-side-note">It stands for {l.replaces.length} line{l.replaces.length === 1 ? '' : 's'} of the software, not seen while it is on (Delete gives them back; hide it to take them off the picture).</p>}
        </Section>
      </>}
      {shape && <Section title="Fill"><PaintField label="Fill" value={l.fill ?? '#ffec00'} onChange={fill => layerOps.change(l.id, {fill}, `lfill:${l.id}`)}/></Section>}
      {shape && <Section title="Stroke">
        <ColorField label="Stroke color" value={l.stroke ?? '#000000'} onChange={stroke => layerOps.change(l.id, {stroke, strokeWidth: l.strokeWidth || 2}, `lstroke:${l.id}`)} onRemove={l.stroke ? () => layerOps.change(l.id, {stroke: null, strokeWidth: 0}) : undefined}/>
        <div className="sb-row"><NumField label="W" title="Stroke width" min={0} max={200} value={l.strokeWidth ?? 0} onChange={v => layerOps.change(l.id, {strokeWidth: v, stroke: l.stroke ?? '#000000'}, `lsw:${l.id}`)}/><span className="sb-row-fill"/></div>
      </Section>}
      {l.kind === 'text' && <Section title="Text">
        <textarea key={`${l.id}:${l.text}`} className="sb-vl-words" rows={3} defaultValue={l.text} spellCheck="false" aria-label="The words" onKeyDown={e => e.stopPropagation()} onBlur={e => { if (e.target.value !== l.text) layerOps.change(l.id, {text: e.target.value}); }}/>
        <SelectField label="Font" wide value={l.font} options={Object.entries(FONTS).map(([value, label]) => ({value, label}))} onChange={font => layerOps.change(l.id, {font})}/>
        <div className="sb-row">
          <NumField label="Size" min={4} max={600} value={l.size} onChange={size => layerOps.change(l.id, {size}, `lsize:${l.id}`)}/>
          <SelectField label="Weight" value={String(l.weight)} options={WEIGHTS.map(([w, name]) => ({value: String(w), label: name}))} onChange={w => layerOps.change(l.id, {weight: Number(w)})}/>
        </div>
        <IconButtons items={TEXT_ALIGN.filter(a => a.id !== 'justify')} value={l.align} onChange={align => layerOps.change(l.id, {align})}/>
        <ColorField label="Text color" value={l.color} onChange={color => layerOps.change(l.id, {color}, `lcolor:${l.id}`)}/>
      </Section>}
      {l.kind === 'image' && <Section title="Image">
        <div className="sb-buttons"><label className="sb-file-btn">Replace the picture<input type="file" accept="image/*" hidden onChange={async e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; try { const src = await saveImage(file); layerOps.change(l.id, {src}); } catch (error) { setStatus(`The picture was not replaced: ${error.message}`); } }}/></label></div>
      </Section>}
      <Section title="Time">
        <div className="sb-row"><NumField label="In" title="On screen from (seconds)" step={0.1} min={0} value={two(l.from)} onChange={v => layerOps.change(l.id, {from: v}, `lin:${l.id}`)}/><NumField label="Out" title="On screen until (seconds)" step={0.1} min={0} value={two(l.to)} onChange={v => layerOps.change(l.id, {to: v}, `lout:${l.id}`)}/></div>
      </Section>
      {times.length > 0 && <Section title="Keyframes">
        {times.map(k => { const ease = (l.keys ?? []).find(x => Math.abs(x.t - k) < 1 / 60)?.ease ?? 'ease'; return <div key={k} className="sb-row sb-lkeys">
          <span className={`sb-lkeys-t${Math.abs(k - t) < 1 / 60 ? ' is-here' : ''}`}>◆ {two(k)} s</span>
          <SelectField label="Easing" value={ease} options={[{value: 'ease', label: 'Easy ease'}, {value: 'linear', label: 'Linear'}, {value: 'hold', label: 'Hold'}]} onChange={v => layerOps.change(l.id, x => setKeyEase(x, k, v))}/>
          <ToolButton icon={PanelIcon.minus} label="Delete this keyframe" onClick={() => layerOps.change(l.id, x => removeLayerKey(x, k))}/>
        </div>; })}
      </Section>}
      <div className="sb-buttons">
        <button type="button" onClick={() => { const id = layerOps.duplicate(l.id); if (id) veSelect({type: 'layer', id}); }} title="Duplicate (Ctrl+D)">Duplicate</button>
        <button type="button" disabled={!(t > l.from + 0.05 && t < l.to - 0.05)} onClick={() => veActions.current?.split()} title="Cut it in two at the playhead (Ctrl+Shift+D)">Split at the playhead</button>
        <button type="button" onClick={() => layerOps.stack(l.id, 1)} title="One layer forward">Bring forward</button>
        <button type="button" onClick={() => layerOps.stack(l.id, -1)} title="One layer back">Send backward</button>
        <button type="button" onClick={() => { layerOps.remove(l.id); veSelect(null); }} title="Delete (Delete)">Delete</button>
      </div>
    </>;
  };
  // ---- The video editor's inspector: a comment (the user, 2026-10-29: "it can be deleted ... selecting and hitting delete on the right inspector"): its words, place and second, a red Delete ----
  const commentPanel = () => {
    const list = videoCommentsOf(edits, veTitleRef.current), c = list.find(x => x.id === veSel.id) ?? null;
    return <CommentPanel comment={c} number={c ? commentNumber(list, c.id) : 0} total={list.length} ops={commentOps} onSeek={t => veActions.current?.seek?.(t)} onDelete={() => { commentOps.remove(veSel.id); veSelect(null); }}/>;
  };
  // The same inspector for a comment picked on a video of the board (the user, 2026-10-30): its second opens the video editor there
  const pinPanel = () => {
    const list = videoCommentsOf(edits, pinSel.title), c = list.find(x => x.id === pinSel.id) ?? null;
    return <CommentPanel comment={c} number={c ? commentNumber(list, c.id) : 0} total={list.length} byScene ops={commentOps} onSeek={() => c && openAtComment(pinSel.key, c)} seekLabel="Open in the video editor" seekTitle="Open the video in the video editor at the second of this comment"
      onDelete={() => { commentOps.removeIn(pinSel.title, pinSel.id); setPinSel(null); }}/>;
  };
  // ---- The video editor's inspector, several picked (the user, 2026-10-26: "multiselection"): what they are, aligned and spread (to the box round them all), their opacity, and
  // what is done to all of them (the editor's own: `veActions`) ----
  const groupPanel = () => {
    const items = veSel.group, all = videoLayersOf(edits, veTitleRef.current), ls = items.filter(q => q.type === 'layer').map(q => all.find(l => l.id === q.id)).filter(Boolean), elements = items.length - ls.length, a = veActions.current, t = veT, two = n => Math.round(n * 100) / 100;
    const opacities = ls.map(l => Math.round(layerValueAt(l, 'opacity', t) * 100)), sameOpacity = opacities.length > 0 && opacities.every(o => o === opacities[0]), hidden = ls.length > 0 && ls.every(l => l.hidden);
    const what = [ls.length && `${ls.length} layer${ls.length === 1 ? '' : 's'}`, elements && `${elements} element${elements === 1 ? '' : 's'} of the slides`].filter(Boolean).join(' · ');
    return <>
      <div className="sb-side-head"><b>{items.length} picked</b><small>{what} · values at {two(t)} s</small></div>
      <Section title="Align">
        <IconButtons items={ALIGN} value={null} onChange={kind => a?.align(kind)}/>
        <IconButtons items={DISTRIBUTE} value={null} onChange={axis => a?.distribute(axis)}/>
      </Section>
      {ls.length > 0 && <Section title="Appearance">
        <div className="sb-row"><NumField label={PanelIcon.opacity} title="Opacity (every layer picked; a keyframe now where it is animated)" unit="%" min={0} max={100} value={sameOpacity ? opacities[0] : ''} placeholder="Mixed" onChange={v => layerOps.changeMany(Object.fromEntries(ls.map(l => [l.id, x => setLayerAt(x, t, {opacity: Math.max(0, Math.min(100, v)) / 100})])), `gop:${ls.map(l => l.id).join()}`)}/><span className="sb-row-fill"/></div>
      </Section>}
      {ls.length > 0 && <div className="sb-buttons">
        <button type="button" onClick={() => a?.duplicate()} title="Duplicate the layers (Ctrl+D)">Duplicate</button>
        <button type="button" onClick={() => a?.split()} title="Cut the layers in two at the playhead (Ctrl+Shift+D)">Split at the playhead</button>
        <button type="button" onClick={() => a?.restack('front')} title="Bring to front (Ctrl+Shift+])">Bring to front</button>
        <button type="button" onClick={() => a?.restack('back')} title="Send to back (Ctrl+Shift+[)">Send to back</button>
        <button type="button" onClick={() => layerOps.changeMany(Object.fromEntries(ls.map(l => [l.id, {hidden: !hidden}])))}>{hidden ? 'Show' : 'Hide'}</button>
        <button type="button" onClick={() => a?.remove()} title="Delete the layers (Delete)">Delete</button>
      </div>}
      <p className="sb-side-note">Shift + click on the picture adds or takes out · a rectangle from the plate, the background or outside the picture picks what it touches · Ctrl + C / V copies the layers into any video, at the playhead · right-click: the menu</p>
    </>;
  };
  // An element of a slide picked in the editor: its look is on every slide of the video already; Apply to all gives it to every element of its name, everywhere
  const assetToAll = () => {
    const s = veSelRef.current;
    if (s?.type !== 'asset' || s.key.includes('/')) return;
    const f = allById[s.frame], name = f && layersOf(f, editsRef.current.frames[s.frame]).find(l => l.key === s.key)?.name;
    const own = {...styleOf(editsRef.current, s.frame, s.key)};
    delete own.rotate;
    if (!name || !Object.keys(own).length) return;
    const off = Object.fromEntries(Object.keys(own).map(k => [k, null]));
    commit(e => sameInVideo(s.frame, s.key).reduce((cur, q) => setStyle(cur, q.frame, q.key, off), setLayerLook(e, name, own))); // (the video's own look taken off: it is everyone's now)
    setStatus(`Every “${name}” on every slide of every board has this look now · Ctrl+Z takes it back`);
  };
  const editorAssetFooter = () => {
    const s = veSel, whole = !s.key.includes('/'), f = allById[s.frame], name = f && layersOf(f, edits.frames[s.frame]).find(l => l.key === s.key.split('/')[0])?.name;
    const own = styleOf(edits, s.frame, s.key), has = Object.keys(own).some(k => k !== 'rotate'), shared = name && layerLookOf(edits, name), vs = videoScaleOf(edits, s.frame, s.key), vm = videoMoveOf(edits, s.frame, s.key), movedOn = (sameInVideo(s.frame, s.key)).filter(q => videoMoveOf(edits, q.frame, q.key)).length;
    return <>{movedOn > 0 && <Section title="Place in this video" tools={<ToolButton icon={PanelIcon.minus} label="Back to where the video puts it (every slide of the video)" onClick={() => assetOps.unplace(s.frame, s.key)}/>}>
      <p className="sb-side-note">{vm ? `Moved ${Math.round(vm[0])}, ${Math.round(vm[1])} px on this slide` : 'Where the video puts it on this slide'}{movedOn > (vm ? 1 : 0) ? ` · moved on ${movedOn} slide${movedOn === 1 ? '' : 's'} of the video` : ''} (its motion path: the points on the picture)</p>
    </Section>}{vs && <Section title="Size in this video" tools={<ToolButton icon={PanelIcon.minus} label="Back to the size the video gives it (every slide of the video)" onClick={() => assetOps.unsize(s.frame, s.key)}/>}>
      <p className="sb-side-note">{vs[0] === vs[1] ? `${Math.round(vs[0] * 100)} %` : `${Math.round(vs[0] * 100)} % × ${Math.round(vs[1] * 100)} %`} of what the video gives it, on every slide of the video (its handles in the picture)</p>
    </Section>}<div className="sb-apply-all">
      <button type="button" disabled={!whole || !name || !has} onClick={assetToAll} title={whole ? `Give this look to every “${name ?? 'element'}” on every slide of every board` : 'Apply to all takes a whole element (click it without Ctrl)'}>Apply to all</button>
      <small>{!whole ? 'A part of an element: its look stays on this video' : !name ? 'It has no name to be found by on the other slides' : has ? `Its look is on every slide of this video; Apply to all gives it to every “${name}”` : shared ? `Every “${name}” has a look of all; what you change here stays on this video` : 'Its look goes to every slide of this video, moving it to this slide'}</small>
    </div>{process.env.NODE_ENV !== 'production' && vePlayer?.title && <ExportSection board={video.video} title={vePlayer.title}/>}</>;
  };
  const zoomPct = `${Math.round(view.zoom * (view.zoom < 0.1 ? 1000 : 100)) / (view.zoom < 0.1 ? 10 : 1)}%`;
  const cursor = space || tool === 'hand' ? (drag.current?.type === 'pan' ? 'grabbing' : 'grab') : tool === 'pencil' || tool === 'rect' ? 'crosshair' : drag.current?.dup && drag.current.moved ? 'copy' : 'default';
  const handleAt = (o, h) => ({left: o.left + (h.includes('w') ? 0 : h.includes('e') ? o.width : o.width / 2), top: o.top + (h.includes('n') ? 0 : h.includes('s') ? o.height : o.height / 2)});
  const info = overlay.info, selFrame = selection ? byId[selection.frame] : null;
  const targetLabel = menu ? `frame ${board.frames[menu.target]?.index ?? ''}` : '';

  return <div className={`sb-root${tool === 'comment' ? ' is-commenting' : ''}`}>
    <div className="sb-float sb-float--left">
      <Link href="/" className="sb-back" aria-label="Home">←</Link>
      <span className="sb-name">Storyboard</span>
      <select className="sb-video" value={videoId} onChange={e => { window.location.search = `?video=${e.target.value}`; }} aria-label="Board">{(m => [...m.groups.map(g => <optgroup key={g.name} label={g.name}>{g.boards.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>), ...m.rest.map(v => <option key={v.id} value={v.id}>{v.name}</option>)])(menuOf(videoId))}</select>
    </div>
    <div className="sb-float sb-float--right">
      <span className="sb-status" role="status">{status}</span>
      {trashing
        ? <button type="button" className="sb-text-btn" onClick={emptyTrash} disabled={!frames.length} title="Delete every frame in the Trash for good">Empty Trash</button>
        : <>
          <button type="button" className="sb-icon" onClick={openMenu} title="Add a UI element (Shift+A)" aria-label="Add a UI element">{Icon.plus}</button>
          <a className="sb-icon" href={`?video=${TRASH}`} title="Open the Trash: the frames you deleted" aria-label="Open the Trash">{Icon.bin}</a>
        </>}
      <button type="button" className="sb-icon" onClick={() => { setHistory(h => undo(h)); dirty.current = true; }} disabled={!history.past.length} title="Undo (Ctrl+Z)" aria-label="Undo">{Icon.undo}</button>
      <button type="button" className="sb-icon" onClick={() => { setHistory(h => redo(h)); dirty.current = true; }} disabled={!history.future.length} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">{Icon.redo}</button>
      <button type="button" className={`sb-icon${showGuides ? ' is-on' : ''}`} onClick={toggleGuides} title="Guide lines (Shift+G)" aria-label="Guide lines" aria-pressed={showGuides}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M14.5 3.5v17M3.5 9.5h17M3.5 14.5h17" strokeDasharray="2 2"/></svg></button>
      <button type="button" className={`sb-icon${help ? ' is-on' : ''}`} onClick={() => setHelp(h => !h)} title="Shortcuts" aria-label="Shortcuts" aria-pressed={help}>{Icon.help}</button>
    </div>
    <div ref={viewport} className="sb-viewport" style={{cursor: reorder ? 'grabbing' : cursor}} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerLeave={() => { setHoverGap(null); pointerAt.current = null; }} onClick={onClick} onDoubleClick={onDoubleClick} onContextMenu={onContextMenu} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
      <div ref={worldRef} className="sb-world" style={{transform: `translate(${viewRef.current.x}px,${viewRef.current.y}px) scale(${viewRef.current.zoom})`}}>
        {board.rows.map(row => <div key={row.chapter.id} className={`sb-section${row.chapter.title.length > 22 ? ' is-long' : ''}${lineSel === row.chapter.id ? ' is-selected' : ''}`} data-sb-row={row.chapter.id} style={{left: row.x, top: row.y, width: row.w, height: row.h}}>
          {lineEdit === row.chapter.id ? <LineName title={row.chapter.title} onDone={title => { setLineEdit(null); if (title != null) renameLineTo(row.chapter.id, title); }}/> : <span>{row.chapter.title}</span>}
        </div>)}
        {!trashing && board.rows.filter(row => !frames.some(f => f.chapter === row.chapter.id) && !shelfLines.has(row.chapter.id)).map(row => <button key={`empty-${row.chapter.id}`} type="button" className="sb-line-empty" data-sb-ui="" data-sb-empty={row.chapter.id} style={{left: LAYOUT.labelW + LAYOUT.labelGap, top: row.y + BAR + BAR_GAP, width: FRAME.w, height: FRAME.h}} onClick={() => addFrameIn(row.chapter.id)}><span>{Icon.plus}Add a frame</span></button>)}
        {!trashing && loaded && <button type="button" className="sb-line-add" data-sb-ui="" style={{left: 0, top: board.rows.length * board.rowHeight, width: LAYOUT.labelW, height: BAR}} onClick={() => addLineAfter(lines.at(-1)?.id ?? null)}><span>{Icon.plus}Add line</span></button>}
        {reorder && reorder.ids.filter(id => board.frames[id]).map(id => <div key={id} className="sb-slot" style={{left: board.frames[id].x, top: board.frames[id].y - HEAD, width: FRAME.w, height: HEAD + FRAME.h + NOTES_GAP + NOTES_H}}/>)}
        {!trashing && loaded && videoRuns.map(v => <StoryboardPlayer key={v.key} frames={v.frames} title={v.title} edits={boardEdits} video={video} x={v.x} y={v.y} focus={boardFocus} lines={lines} placed={board.frames} onFrame={setPlayingId} onText={retype} onVideoText={restyleVideo} onCaption={retypeCaption} onSelect={selectVideo} onEditing={setTextEd} onMenu={(event, m) => videoMenu(event, {kind: 'run', key: v.key, title: v.title, shelf: v.shelf ?? null, lines: v.chapters, ...m})} pins={pinsFor(v.key, v.title)} commentTool={tool === 'comment'} onDrawn={onVideoDrawn}/>)}
        {frames.map(f => { const p = board.frames[f.id], E = !vEdit ? edits : selection?.frame === f.id ? veEdits : boardEdits; return p && <Frame key={f.id} frame={f} index={p.index} x={p.x} y={p.y} video={video} live={liveIds.has(f.id)} urgent={selection?.frame === f.id || forceDraw.has(f.id)} solid={solidIds.has(f.id)} edit={E.frames[f.id]} library={E.library} looks={E.looks} note={noteOf(edits, f.id)} selected={frameSel.includes(f.id) || (selection?.frame === f.id && !selection.key)} dragging={!!reorder?.ids.includes(f.id)} isNew={fresh.has(f.id)} onNote={onNote} cell={cellProps.get(f.id) ?? null} narrow={!untouched.has(f.chapter)} guides={showGuides}/>; })}
        <StoryboardRefs items={refsOf(edits)} picked={refSel} zoom={view.zoom} zoomNow={refZoom} free={refFree} onPick={pickRef} onChange={moveRef} onMenu={refMenu}/>
      </div>
      <div ref={overlayRef} className="sb-overlay" aria-hidden="true">
        {!reorder && overlay.plays.map(pl => <button key={pl.id} type="button" className={`sb-play${playing === pl.id ? ' is-playing' : ''}`} data-sb-ui="" style={{left: pl.left, top: pl.top}} onPointerDown={e => e.stopPropagation()} onClick={() => (playing === pl.id ? stopWriting() : playFrame(pl.id))} title={playing === pl.id ? 'Stop' : 'Play: the words are written by hand'} aria-label={playing === pl.id ? 'Stop the handwriting' : 'Play the handwriting'}>
          {playing === pl.id ? <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="4.5" width="7" height="7" rx="1.6" fill="#fff"/></svg> : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.6 3.4v9.2c0 .5.55.8.97.53l7-4.6a.63.63 0 0 0 0-1.06l-7-4.6a.63.63 0 0 0-.97.53Z" fill="#fff"/></svg>}
        </button>)}
        {!reorder && overlay.frames.map(o => <div key={o.id} className="sb-frame-outline" style={{left: o.left, top: o.top, width: o.width, height: o.height}}/>)}
        {overlay.picks.map(o => <div key={o.key} className="sb-outline" style={{left: o.left, top: o.top, width: o.width, height: o.height}}/>)}
        {overlay.outline && <div className="sb-outline" style={{left: overlay.outline.left, top: overlay.outline.top, width: overlay.outline.width, height: overlay.outline.height}}><span>{overlay.outline.name} · {overlay.outline.w} × {overlay.outline.h}</span></div>}
        {overlay.outline?.handles && [...HANDLES, ...(overlay.outline.handles === 'all' ? SIDES : [])].filter(h => !(overlay.outline.lock?.w && (h === 'e' || h === 'w')) && !(overlay.outline.lock?.h && (h === 'n' || h === 's'))).map(h => <i key={h} className={`sb-handle sb-handle--${h}`} style={handleAt(overlay.outline, h)} onPointerDown={e => startScale(e, h)}/>)}
        {overlay.tip && <div className="sb-tip" style={{left: overlay.tip.left, top: overlay.tip.top}} onPointerDown={startTip} title="Drag to move where the tail points"/>}
        {hoverGap && !marquee && <div className="sb-gap" style={{left: hoverGap.x * view.zoom + view.x + hoverGap.w * view.zoom / 2, top: hoverGap.artTop * view.zoom + view.y, height: (hoverGap.artBottom - hoverGap.artTop) * view.zoom}}>
          <button type="button" className="sb-gap-add" onPointerDown={e => e.stopPropagation()} onClick={() => addBlankAfter(hoverGap.after)} title="Add a frame here" aria-label="Add a frame here">+</button>
        </div>}
        {marquee && <div className="sb-marquee" style={{left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h}}/>}
        {guides.map((g, i) => <i key={i} className={`sb-guide sb-guide--${g.axis}`} style={g.axis === 'x' ? {left: g.left, top: g.top, height: g.size} : {left: g.left, top: g.top, width: g.size}}/>)}
        <svg className="sb-ink"><path ref={inkRef} fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </div>
    {vePlayer && <StoryboardVideoEditor key={vEdit.key} board={video.video} player={vePlayer} startAt={vEdit.at} layers={videoLayersOf(edits, vePlayer.title)} spans={spansOf(edits, vePlayer.title)} comments={videoCommentsOf(edits, vePlayer.title)} commentOps={commentOps} selection={veSel} onSelection={veSelect} onTime={editorTime} layerOps={layerOps} assetOps={assetOps} onAddImage={addVideoImage} actions={veActions} guides={showGuides} onGuides={toggleGuides} onClose={closeVideo} onReveal={id => { closeVideo(); focusFrame(id); }} onUndo={() => { setHistory(h => undo(h)); dirty.current = true; }} onRedo={() => { setHistory(h => redo(h)); dirty.current = true; }} canUndo={!!history.past.length} canRedo={!!history.future.length}/>}
    <aside className="sb-side" data-sb-ui="" aria-label="Design">
      {tool === 'pencil' ? <>
        <div className="sb-side-head"><b>Pencil</b></div>
        <Section title="Stroke">
          <ColorWheel value={pen.color} onChange={color => setPen(p => ({...p, color}))}/>
          <div className="sb-row"><NumField label="W" title="Width" value={pen.width} min={PEN_WIDTHS.min} max={PEN_WIDTHS.max} onChange={width => setPen(p => ({...p, width}))}/><span className="sb-row-fill"/></div>
        </Section>
      </> : tool === 'rect' ? <>
        <div className="sb-side-head"><b>Rectangle</b></div>
        <Section title="Fill">
          <PaintField label="Fill" value={rectLook.fill} onChange={fill => setRectLook(l => ({...l, fill}))}/>
        </Section>
        <Section title="Appearance">
          <div className="sb-row"><NumField label={PanelIcon.radius} title="Corner radius" value={rectLook.radius} min={0} onChange={radius => setRectLook(l => ({...l, radius}))}/><span className="sb-row-fill"/></div>
        </Section>
      </> : vEdit && !textEd && veSel?.group ? groupPanel() : vEdit && !textEd && veSel?.type === 'comment' ? commentPanel() : vEdit && !textEd && veSel?.type === 'layer' ? layerPanel() : vEdit && !textEd && veSel?.type === 'asset' && info?.kind === 'asset' && selFrame ? <>{assetPanel()}{editorAssetFooter()}</> : pinSel && !vEdit && !textEd ? pinPanel() : videoSel || textEd ? (videoSel ? videoPanel() : null) : info?.kind === 'asset' && selFrame ? assetPanel() : info?.kind === 'frame' && selFrame ? framePanel() : lineNow ? linePanel() : boardPanel()}
    </aside>
    {ctx && <div className="sb-ctx" data-sb-ui="" role="menu" style={{left: Math.min(ctx.x, size.w - 270), top: Math.min(ctx.y, size.h - 260)}}>
      {ctx.ref ? (r => <>
        <button type="button" role="menuitem" onClick={() => { window.open(r.url, '_blank', 'noopener'); setCtx(null); }}>Open in a new tab</button>
        <hr/>
        <button type="button" role="menuitem" onClick={() => { deleteRef(r.id); setCtx(null); }}>Delete <kbd>Del</kbd></button>
      </>)(ctx.ref) : ctx.video ? (m => { // a video (the user, 2026-10-30): open it in the video editor, a comment on it, copy, export, delete
        const run = m.kind === 'run', n = m.lines?.length ?? 0, lines = `${n} line${n > 1 ? 's' : ''}`;
        return <>
          <button type="button" role="menuitem" onClick={() => { openVideo(m.key, m.at); setCtx(null); }}>Open in video editor <kbd>at {clock(m.at)}</kbd></button>
          <button type="button" role="menuitem" disabled={!m.point} onClick={() => { addCommentAt(m); setCtx(null); }} title={m.point ? 'A pin on the picture where you right-clicked, at the second the video is on' : 'Right-click on the picture to put a comment there'}>Add a comment here <kbd>{m.point ? `at ${clock(m.at)}` : 'on the picture'}</kbd></button>
          <hr/>
          <button type="button" role="menuitem" disabled={run && !!m.shelf} onClick={() => { duplicateVideoOf(m); setCtx(null); }} title={run ? (m.shelf ? 'A video stands once on a line' : 'A video is made of the lines it plays: they are copied') : 'The video and all its slides are copied, right after it'}>{run && !m.shelf ? `Duplicate its ${lines}` : 'Duplicate'}{run && m.shelf ? <kbd>stands once</kbd> : null}</button>
          {process.env.NODE_ENV !== 'production' && <ExportMenuItem board={video.video} title={m.title} onStart={() => setCtx(null)}/>}
          <hr/>
          <button type="button" role="menuitem" onClick={() => { deleteVideoOf(m); setCtx(null); }} title={m.kind === 'cell' ? 'The video and its slides go to the Trash' : m.shelf ? 'The video leaves this line; the lines it plays are not touched' : 'The video is made of the lines it plays: they go to the Trash with it'}>{m.kind === 'cell' ? 'Delete' : m.shelf ? 'Take off this line' : `Delete with its ${lines}`}</button>
        </>;
      })(ctx.video) : ctx.pin ? (p => { // a comment's pin on a video of the board
        const c = videoCommentsOf(edits, p.title).find(x => x.id === p.id) ?? null;
        return <>
          <button type="button" role="menuitem" disabled={!c} onClick={() => { openAtComment(p.key, c); setCtx(null); }}>Open in video editor <kbd>at its second</kbd></button>
          <button type="button" role="menuitem" disabled={!c} onClick={() => { commentOps.changeIn(p.title, p.id, {done: !c.done}); setCtx(null); }}>{c?.done ? 'Mark as not done' : 'Mark as done'}</button>
          <hr/>
          <button type="button" role="menuitem" onClick={() => { commentOps.removeIn(p.title, p.id); setPinSel(null); setCtx(null); }}>Delete the comment <kbd>Del</kbd></button>
        </>;
      })(ctx.pin) : ctx.line ? <>
        {!trashing && <button type="button" role="menuitem" onClick={() => { setLineEdit(ctx.line); setCtx(null); }}>Rename <kbd>Enter</kbd></button>}
        {!trashing && <button type="button" role="menuitem" onClick={() => { addFrameIn(ctx.line); setCtx(null); }}>Add a frame</button>}
        {!trashing && <button type="button" role="menuitem" onClick={() => { addLineAfter(ctx.line); setCtx(null); }}>Add a line below</button>}
        {!trashing && <button type="button" role="menuitem" onClick={() => { duplicateLineOf(ctx.line); setCtx(null); }}>Duplicate line <kbd>Ctrl D</kbd></button>}
        <hr/>
        <button type="button" role="menuitem" onClick={() => { copySelected(); setCtx(null); }}>Copy its frames <kbd>Ctrl C</kbd></button>
        {!trashing && <button type="button" role="menuitem" onClick={() => { paste(); setCtx(null); }}>Paste frames at its end <kbd>Ctrl V</kbd></button>}
        <hr/>
        <button type="button" role="menuitem" onClick={() => { deleteLineOf(ctx.line); setCtx(null); }}>{trashing ? 'Delete for good' : 'Delete line'} <kbd>Del</kbd></button>
      </> : <>
      <button type="button" role="menuitem" disabled={!ctx.inRow} onClick={() => { applyToRow(ctx.frame, ctx.layers); setCtx(null); }}>Apply to all in this row <kbd>{ctx.inRow ? `${ctx.inRow} more` : 'only here'}</kbd></button>
      <button type="button" role="menuitem" disabled={!ctx.inRow} onClick={() => { deleteInRow(ctx.frame, ctx.layers); setCtx(null); }}>Delete in the whole row</button>
      <hr/>
      <button type="button" role="menuitem" onClick={() => { copySelected(); setCtx(null); }}>Copy <kbd>Ctrl C</kbd></button>
      <button type="button" role="menuitem" onClick={() => { paste(); setCtx(null); }}>Paste <kbd>Ctrl V</kbd></button>
      <hr/>
      <button type="button" role="menuitem" onClick={() => { copyPosition(); setCtx(null); }}>Copy position <kbd>Ctrl Shift C</kbd></button>
      <button type="button" role="menuitem" disabled={!copiedPosition()} onClick={() => { pastePosition(); setCtx(null); }}>Paste position <kbd>Ctrl Shift V</kbd></button>
      <hr/>
      <button type="button" role="menuitem" onClick={() => { removeSelected(); setCtx(null); }}>Delete <kbd>Del</kbd></button>
      </>}
    </div>}
    <footer className="sb-bottom">
      <div className="sb-tools" role="toolbar" aria-label="Tools">
        <button type="button" className={tool === 'move' ? 'is-on' : ''} onClick={() => setTool('move')} title="Move (V)" aria-label="Move tool">{Icon.move}</button>
        <button type="button" className={tool === 'hand' ? 'is-on' : ''} onClick={() => setTool('hand')} title="Hand (H)" aria-label="Hand tool">{Icon.hand}</button>
        <button type="button" className={tool === 'scale' ? 'is-on' : ''} onClick={() => setTool(t => (t === 'scale' ? 'move' : 'scale'))} title="Scale (K): drag a handle, the words scale with the box" aria-label="Scale tool" aria-pressed={tool === 'scale'}>{Icon.scale}</button>
        <button type="button" className={tool === 'rect' ? 'is-on' : ''} onClick={() => setTool('rect')} title="Rectangle (R): drag on a frame, any fill" aria-label="Rectangle tool">{Icon.rect}</button>
        <button type="button" className={tool === 'pencil' ? 'is-on' : ''} onClick={() => setTool('pencil')} title="Pencil (P)" aria-label="Pencil tool">{Icon.pencil}<i className="sb-pen-color" style={{background: pen.color}}/></button>
        <button type="button" className={tool === 'comment' ? 'is-on' : ''} onClick={() => setTool(t => (t === 'comment' ? 'move' : 'comment'))} title="Comment (C): click on a video to put a comment there" aria-label="Comment tool" aria-pressed={tool === 'comment'}>{Icon.comment}</button>
      </div>
    </footer>
    {trashing && loaded && !frames.length && <div className="sb-empty"><b>The Trash is empty</b><p>Select a frame on a storyboard and press Delete: it lands here. Pick it here, copy it (Ctrl+C) and paste it back on a storyboard (Ctrl+V).</p></div>}
    {toast && <div className="sb-toast" data-sb-ui="" role="status">
      <span>{toast.text}</span>
      <button type="button" onClick={() => { setHistory(h => undo(h)); dirty.current = true; setToast(null); }}>Undo</button>
      {toast.open && <a href={`?video=${TRASH}`}>Open the Trash</a>}
    </div>}
    <div className="sb-zoom">
      <button type="button" onClick={() => setZoomMenu(m => !m)} aria-haspopup="menu" aria-expanded={zoomMenu}>{zoomPct}</button>
      {zoomMenu && <div className="sb-zoom-menu" role="menu" onClick={() => setZoomMenu(false)}>
        <button type="button" role="menuitem" onClick={() => zoomStep(1)}>Zoom in <kbd>Ctrl +</kbd></button>
        <button type="button" role="menuitem" onClick={() => zoomStep(-1)}>Zoom out <kbd>Ctrl −</kbd></button>
        <button type="button" role="menuitem" onClick={fitAll}>Zoom to fit <kbd>Shift 1</kbd></button>
        <button type="button" role="menuitem" onClick={fitSelection}>Zoom to selection <kbd>Shift 2</kbd></button>
        <button type="button" role="menuitem" onClick={() => zoomTo(0.5)}>Zoom to 50%</button>
        <button type="button" role="menuitem" onClick={() => zoomTo(1)}>Zoom to 100% <kbd>Shift 0</kbd></button>
      </div>}
    </div>
    {menu && <div className="sb-menu-wrap" data-sb-ui="" onPointerDown={e => { if (e.target === e.currentTarget) setMenu(null); }}>
      <div className="sb-menu" role="dialog" aria-label="Add UI">
        <input ref={menuInput} value={menu.query} placeholder="Search the UI" aria-label="Search the UI" spellCheck="false" autoComplete="off"
          onChange={e => setMenu(m => ({...m, query: e.target.value, index: 0}))}
          onKeyDown={e => {
            const go = delta => { e.preventDefault(); setMenu(m => ({...m, index: Math.max(0, Math.min(results.length - 1, m.index + delta))})); };
            if (e.key === 'Escape') { e.preventDefault(); setMenu(null); }
            else if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
            else if (e.key === 'ArrowDown') go(MENU_COLUMNS);
            else if (e.key === 'ArrowUp') go(-MENU_COLUMNS);
            else if (e.key === 'Enter' && results[menu.index]) { e.preventDefault(); choose(results[menu.index].id, menu.target); }
          }}/>
        <div className="sb-menu-body" data-sb-scroll="">
          {groups.map(({category, items}) => <section key={category}>
            <h4>{category}</h4>
            <div className="sb-tiles">
              {items.map(part => <button type="button" key={part.id} className={`sb-tile${results[menu.index]?.id === part.id ? ' is-on' : ''}`} onMouseEnter={() => setMenu(m => { const i = results.indexOf(part); return m.index === i ? m : {...m, index: i}; })} onClick={() => choose(part.id, menu.target)}>
                <span className="sb-tile-pic"><img src={`/storyboard/ui/${part.id}.jpg`} alt="" loading="lazy" draggable="false"/></span>
                <span className="sb-tile-name">{part.name}</span>
              </button>)}
            </div>
          </section>)}
          {!results.length && <p className="sb-menu-none">Nothing matches</p>}
        </div>
      </div>
    </div>}
    {help && <div className="sb-help" role="dialog" aria-label="Shortcuts"><h3>Move around</h3>
      <dl><dt>Scroll</dt><dd>Pan</dd><dt>Ctrl / ⌘ + scroll, pinch</dt><dd>Zoom</dd><dt>Space + drag, middle button, H</dt><dd>Pan</dd><dt>Shift 1 / Shift 2 / Shift 0</dt><dd>Fit all / selection / 100%</dd></dl>
      <h3>Edit</h3>
      <dl><dt>Click</dt><dd>Select an asset or a frame</dd><dt>Double-click</dt><dd>Go into a group · retype any text (in a video too: its look is in the sidebar) · a color in a video: its section in the sidebar</dd><dt>Click a video</dt><dd>The sidebar is its inspector: the words, the background, the plate, the gray side, the outlines (all videos, or this video)</dd><dt>Tab while typing</dt><dd>The next text</dd><dt>Shift + click</dt><dd>Pick several assets or frames</dd><dt>Ctrl / ⌘ + C · X · V</dt><dd>Copy · cut · paste (any board)</dd><dt>Ctrl / ⌘ + click</dt><dd>Select the deepest</dd><dt>Drag · arrows (Shift = 10)</dt><dd>Move</dd><dt>Shift while dragging</dt><dd>Straight: one axis only</dd><dt>Ctrl / ⌘ while dragging</dt><dd>No snapping</dd><dt>Ctrl Shift C · Ctrl Shift V</dt><dd>Copy · paste a position (on the picked assets, or the same asset in the picked frames)</dd><dt>Drag a corner handle</dt><dd>Scale (UI keeps its proportions; a chat box changes its box, its words keep their size)</dd><dt>K, then drag a handle</dt><dd>Scale the asset with its words: a chat box grows with its font (K, V or Esc: back)</dd><dt>Alt + drag</dt><dd>Duplicate, here or onto another frame</dd><dt>Right-click</dt><dd>Apply to all in this row · copy · paste · delete (nothing is linked: every frame's texts are its own)</dd><dt>Esc</dt><dd>Out one level</dd><dt>Ctrl Z · Ctrl Shift Z</dt><dd>Undo · redo</dd></dl>
      <h3>Frames and assets</h3>
      <dl><dt>Ctrl / ⌘ + ] / [</dt><dd>Bring forward / send backward (Shift: to the front / back)</dd><dt>Ctrl / ⌘ + D</dt><dd>Duplicate the frame</dd><dt>Delete</dt><dd>Take an asset out · move a frame to the Trash</dd><dt>Shift A</dt><dd>Add a UI element</dd><dt>Paste or drop a picture</dt><dd>Add it to the frame</dd><dt>P, then drag on a frame</dt><dd>Draw (Alt + click: pick a color)</dd><dt>The bin at the top, or Board &gt; Trash</dt><dd>Deleted frames: copy one, paste it on a storyboard</dd><dt>+ between two frames</dt><dd>Add a blank frame there</dd><dt>Click a line's name</dt><dd>Pick the line (Del · Ctrl D · Ctrl C / V)</dd><dt>Double-click a line's name</dt><dd>Rename it</dd><dt>Hold a frame's number bar, drag</dt><dd>Move it (Esc: put back)</dd></dl></div>}
  </div>;
}
