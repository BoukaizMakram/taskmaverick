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
// Alt+drag pulls a duplicate out of an asset, into its frame or another one. The
// same asset along a line of the board is linked: retyping it in one frame changes
// its duplicates too, until it is made unique (right-click); a chat bubble is always
// unique, and its handles resize its box (its words keep their size; with the Scale tool, K, the words scale with it). The pencil (P)
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
import {memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import StoryboardPlayer from './StoryboardPlayer';
import {runsOf, shelvedRuns} from '@/lib/storyboardVideos.mjs';
import {cellsOf, duplicateVideo, expandLine, followersOf, slidesOrder, withSlides} from '@/lib/storyboardCells.mjs';
import {FRAME, LAYOUT, clampZoom, fitRect, gapAt, glideZoom, intersects, dropTarget, keepView, lineDropIndex, layoutFrames, layoutGaps, panBy, parseView, restoreView, stepZoom, toWorld, union, viewBetween, viewKey, visibleWorld, wheelAction, zoomAt} from '@/lib/storyboardView.mjs';
import {SNAP_REACH, snapBox, snapTargets} from '@/lib/storyboardSnap.mjs';
import {EMPTY, FONTS, ANIM_CPS, animOf, animSeconds, animCps, hasAnim, setAnim, scaledLineHeight, addBlank, addBlankIn, addCopy, addInserts, addLine, createHistory, deleteFrame, duplicateLine, hasChanges, hideLayer, hideLine, intoLine, isEdited, lockOf, makeExport, readExport, setLock, setBubble, bubbleOf, layersOf, linesOf as boardLines, mergeEdits, moveFrame, moveInList, moveLayers, moveLine, noteOf, normalizeEdits, setBackground, backgroundOf, orderedFrames, record, redo, removeInsert, renameLine, resetAsset, resetFrame, setMove, setName, setNote, setLineView, setInsertHtml, setScale, setSize as setBoxSize, setStyle, setText, setTip, setUnique, styleOf, undo} from '@/lib/storyboardEdits.mjs';
import {TRASH, addToTrash, removeFromTrash, trashEntry, trashVideo} from '@/lib/storyboardTrash.mjs';
import {groupParts, hashString, partInsert, partList, searchParts} from '@/lib/storyboardParts.mjs';
import {PEN, PEN_WIDTHS, inkOf, normalizeHex, restyleInk, strokeInsert} from '@/lib/storyboardDraw.mjs';
import {ColorField, ColorWheel, EffectRow, IconButtons, LockButton, NumField, PaintField, PanelIcon, Section, SelectField, TextField, ToolButton, solidHex} from './StoryboardPanel';
import {isGradient} from '@/lib/storyboardPaint.mjs';
import {RECT_FILL, rectFrom, rectInsert} from '@/lib/storyboardShapes.mjs';
import {contentFactor, scaledBox, scaledStyles} from '@/lib/storyboardScale.mjs';
import {copyFrames, copyLayers, copyPicks, isClip, layerKeyOf, pasteFrames, pasteLayers} from '@/lib/storyboardClipboard.mjs';
import {addPick, framesOfPicks, groupPicks, hasPick, isBackdrop, nextLayer, picksOf, rectOf, removePick, sameSpot, samePicks} from '@/lib/storyboardPick.mjs';
import {isUnique, linkOf, linkedLayers, linkedParts, splitKey} from '@/lib/storyboardLinks.mjs';
import {imageInsert, isImage} from '@/lib/storyboardImages.mjs';
import {writeWords} from './storyboardHandwriting';
import {STAGE, applyEdits, assetsIn, boxOf, bubbleBoxOf, bubblePad, chainOf, colorAt, drawShape, editTargetAt, editTargetOf, elementOf, frameHtml, hitAt, isBubble, isWords, keyOf, layersAt, placeTimelines, linesOf, lookOf, whenFontsLoaded, moveTo, nameOf, parentScale, parseStyle, resizeKind, scaleOf, scaleTo, screenRectOf, setLines, setTextNumbers, sizeOf, sizeTo, stageBoxOf, stageOf, tailOff, tipToMiddle, targetKey, targetOf, textIn, textKeysOf, tipOf, translateOf, unitOf} from './storyboardDom';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';
import './ImprovedQualityV2Demo.css';
import './EfficiencyV2Demo.css';
import './ReferenceBoard.css';
import './CaptionBubbles.css';
import './DemoHand.css';
import './web/web.css';// the web app's pieces (Shift+A > Web app) need its own rules, e.g. a mission's 16px logo
import './Storyboard.css';

const VIDEOS = [{id: 'improved-quality-v2', name: 'Improved Quality'}, {id: 'increased-efficiency-v2', name: 'Increased Efficiency'}];
const BOARDS = [...VIDEOS, {id: TRASH, name: 'Trash'}];
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
const localOf = videoId => { try { const kept = JSON.parse(readLocal(`storyboard:${videoId}`) || 'null'); return kept && 'edits' in kept ? {rev: kept.rev ?? null, edits: normalizeEdits(kept.edits)} : {rev: null, edits: normalizeEdits(kept ?? {})}; } catch { return {rev: null, edits: EMPTY}; } };
async function loadSaved(videoId) {
  const mine = localOf(videoId);
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
const keepLocal = (videoId, rev, edits) => writeLocal(`storyboard:${videoId}`, JSON.stringify({rev, edits}));
// The Trash is a board of its own, saved like the others: what is deleted from a storyboard is
// put in its file (and this browser's copy) right away, and taken out again when the delete is undone.
async function changeTrash(change) {
  for (let tries = 0; tries < 4; tries++) {
    const saved = await loadSaved(TRASH), next = change(saved.edits);
    if (!saved.file) { keepLocal(TRASH, null, next); return; }
    const done = await postSaved(TRASH, next, saved.rev);
    if (!done.conflict) { keepLocal(TRASH, done.rev, next); return; } // (else it changed meanwhile: read it again and redo)
  }
  throw new Error('the Trash kept changing');
}
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
};

// The sidebar's rows of buttons: where an asset is aligned (in its frame, or to the others picked
// with it), how its text is aligned, and the weights a text can take.
const ALIGN = [{id: 'left', label: 'Align left', icon: PanelIcon.left}, {id: 'hcenter', label: 'Align horizontal centers', icon: PanelIcon.hcenter}, {id: 'right', label: 'Align right', icon: PanelIcon.right},
  {id: 'top', label: 'Align top', icon: PanelIcon.top}, {id: 'vcenter', label: 'Align vertical centers', icon: PanelIcon.vcenter}, {id: 'bottom', label: 'Align bottom', icon: PanelIcon.bottom}];
const TEXT_ALIGN = [{id: 'left', label: 'Text: left', icon: PanelIcon.tleft}, {id: 'center', label: 'Text: center', icon: PanelIcon.tcenter}, {id: 'right', label: 'Text: right', icon: PanelIcon.tright}, {id: 'justify', label: 'Text: justified', icon: PanelIcon.tjustify}];
const WEIGHTS = [[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semi Bold'], [700, 'Bold'], [800, 'Extra Bold'], [900, 'Black']];
const TOUCHED = ['moves', 'scales', 'sizes', 'tips', 'styles'];
const touched = (record, key) => TOUCHED.some(name => Object.keys(record?.[name] ?? {}).some(k => k === key || k.startsWith(`${key}/`)));
const when = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}); };

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
  let raf = 0, center = {x: 0, y: 0};
  const run = () => {
    raf = 0;
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
  };
})();

// ---- One frame -----------------------------------------------------------------------
// The picture (cheap, always) and, while it is in view and big enough to matter,
// the live stage: the demo's own HTML with its changes put on (`urgent`: at once, not queued).
const FrameArt = memo(function FrameArt({frame, video, live, urgent, cx, cy, edit, library}) {
  const stageRef = useRef(null), playerRef = useRef(null), artRef = useRef(null), drawn = useRef(false);
  const stageStyle = useMemo(() => parseStyle(frame.stageStyle ?? video.stage.style), [frame.stageStyle, video]);
  const layers = useMemo(() => layersOf(frame, edit), [frame, edit?.hidden, edit?.inserts, edit?.order]); // eslint-disable-line react-hooks/exhaustive-deps
  const timelines = useMemo(() => layers.filter(l => /timeline/i.test(l.name ?? '')), [layers]);
  const html = useMemo(() => (live ? frameHtml(layers, hash => library[hash] ?? video.assets[hash], prefixOf(frame.id), frame.bubble) : ''), [live, layers, library, video, frame.id, frame.bubble]);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !live) { drawn.current = false; artRef.current?.removeAttribute('data-drawn'); return undefined; }
    let gone = false;
    const draw = () => {
      if (gone || stageRef.current !== stage) return;
      stage.innerHTML = html;
      applyEdits(stage, edit);
      if (timelines.length) placeTimelines(stage, timelines); // (the timeline of a video is on its film, as in the video)
      drawn.current = true;
      artRef.current?.setAttribute('data-drawn', ''); // (the capture and the white behind the stage are only for the moment before it is drawn: Storyboard.css)
      if (playerRef.current) playerRef.current.style.visibility = '';
      document.fonts?.ready.then(() => { if (!gone && stageRef.current === stage) { drawShape(stage, edit); if (timelines.length) placeTimelines(stage, timelines); } });
      whenFontsLoaded(edit, () => { if (!gone && stageRef.current === stage) drawShape(stage, edit); }); // (a font picked for the words: the chat box is drawn around them once it is in)
    };
    if (drawn.current || urgent) draw(); // a change to a frame already drawn, or the frame you are on: at once
    else liveQueue.add(frame.id, {x: cx, y: cy, draw});
    return () => { gone = true; liveQueue.drop(frame.id); };
  }, [live, html, edit]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (urgent && live) liveQueue.now(frame.id); }, [urgent, live, frame.id]);
  return <div ref={artRef} className="sb-art" data-art="">
    {frame.thumb && <img className="sb-thumb" src={frame.thumb} alt="" draggable={false} decoding="async"/>}
    {live && <div ref={playerRef} className={`${frame.shell ?? video.stage.shell ?? 'es-player demo-text-scope'} sb-player`} style={drawn.current ? undefined : {visibility: 'hidden'}}><div className="ad-fit ad-fit--embed"><div ref={stageRef} className={`${frame.stageClass ?? video.stage.className} sb-stage`} style={stageStyle} data-scene={frame.scene.id ?? undefined} data-view={frame.scene.view ?? undefined}/></div></div>}
  </div>;
});

// (its name, time and notes are always there: zoomed far out the board hides them, .sb-world.is-far)
const Frame = memo(function Frame({frame, index, x, y, video, live, urgent, solid, edit, library, note, selected, dragging, playing, isNew, onNote, cell}) {
  return <div className={`sb-frame${cell ? ' is-cell' : ''}${solid ? ' is-solid' : ''}${selected ? ' is-selected' : ''}${playing ? ' is-playing' : ''}${dragging ? ' is-dragging' : ''}${isNew ? ' is-new' : ''}${isEdited(edit) ? ' is-edited' : ''}`} data-frame={frame.id} style={{left: x, top: y - HEAD, width: FRAME.w, height: HEAD + FRAME.h + NOTES_GAP + NOTES_H}}>
    <div className="sb-fhead" data-ftitle={frame.id} style={{height: BAR, marginBottom: BAR_GAP}}>
      <span className="sb-fname">{cell ? cell.name : edit?.name ?? `${frame.label}${frame.isCopy && !frame.isBlank ? ' · copy' : ''}`}</span>
      <b className="sb-fnum">{index}</b>
      <i className="sb-ftime">{cell ? 'VIDEO' : frame.time != null ? clock(frame.time) : ''}</i>
    </div>
    <div style={{height: FRAME.h}}>{cell
      ? <div className="sb-art sb-art--cell" data-art=""><StoryboardPlayer cell frames={cell.frames} title={cell.name} edits={cell.edits} video={video} onFrame={cell.onFrame} onText={cell.onText}/></div>
      : <FrameArt frame={frame} video={video} live={live} urgent={urgent} cx={x + FRAME.w / 2} cy={y + FRAME.h / 2} edit={edit} library={library}/>}</div>
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
    fetch(`/storyboard/${videoId}.json`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { if (live) setVideo(data); }).catch(() => { if (live) setError('The frames are not made yet. Run  npm run gen:storyboard  with the site running, then reload.'); });
    return () => { live = false; };
  }, [videoId]);
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
  const [playingId, setPlayingId] = useState(null);      // the frame the video is on while it plays (its number bar shows it)
  const [hoverGap, setHoverGap] = useState(null);         // the gap between two frames the pointer is in: where the + shows
  const [ctx, setCtx] = useState(null);                   // the right-click menu on assets: {x, y, frame, layers, linked, unique}
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
  const allByIdRef = useRef(allById); allByIdRef.current = allById;
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
    const runs = runsOf(video.video, [...rowOf.keys()]), shelved = shelvedRuns(edits.lines?.added, video.video, new Set(runs.map(r => r.id))); // (a line can hold the videos of the board side by side: the user, 2026-10-13)
    for (const run of runs) { // (the lines on the board: the captured ones and the ones added, like Animations)
      const shelf = shelved.get(run.id), shelfRow = shelf && rowOf.get(shelf.line);
      if (shelfRow) { out.push({x: L.labelW + L.labelGap + shelf.index * (FRAME.w + L.gapX), y: shelfRow.y + BAR + BAR_GAP, key: run.id, title: run.title, chapters: run.lines}); continue; }
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
  useEffect(() => {
    let live = true;
    (async () => {
      const {edits: merged, changed, file, rev} = await loadSaved(videoId);
      if (!live) return;
      revRef.current = rev;
      if (changed) dirty.current = true;
      setToFile(file); setHistory(createHistory(merged)); setLoaded(true);
    })();
    return () => { live = false; };
  }, [videoId, LOCAL]);
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    saveStatus('Saving…');
    const timer = setTimeout(async () => {
      keepLocal(videoId, revRef.current, edits);
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
        setHistory(h => record(h, dirty.current ? mergeEdits(remote, h.present).edits : remote));
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
    if (!raf.current) raf.current = requestAnimationFrame(paint);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => setView(viewRef.current), 130);
  }, [paint]);
  const setViewNow = useCallback(next => { viewRef.current = next; committed.current = next; setView(next); }, []);
  const fit = useCallback((box, options) => fitRect(box, size, options), [size]);
  // open where it was looked at (the user, 2026-10-13: "when I refresh the website using f5 or ctrl+shift+r or any way, I wanna be where I was before, when I refresh it takes me up"):
  // the view is kept as it settles and when the page is left (below), and a board opens on it again; else on the first row: its label and its first frames, big enough to read
  const opened = useRef(false);
  const windowNow = useCallback(() => { const r = viewport.current?.getBoundingClientRect(); return r && r.width > 0 && r.height > 0 ? {w: r.width, h: r.height} : sizeRef.current; }, []); // (the window as it is: the first measure may not have come in)
  const keepNow = useCallback(() => { if (opened.current) writeLocal(viewKey(videoId), JSON.stringify(keepView(viewRef.current, windowNow()))); }, [videoId, windowNow]); // (before the board is open it is not kept: it would keep the view it has before it is placed)
  useEffect(() => {
    if (opened.current || size.w < 300) return;
    const row = board.rows[0];
    if (!row) return; // (the Trash has its rows only once what it holds is loaded)
    opened.current = true;
    const whole = union([...board.rows.map(r => ({x: r.x, y: r.y, w: r.w, h: r.h})), ...Object.values(board.frames).map(p => ({x: p.x, y: p.y - HEAD, w: FRAME.w, h: HEAD + FRAME.h + NOTES_GAP + NOTES_H}))]); // (the lines' labels and every frame: the frames go far to the right of the labels)
    const kept = restoreView(parseView(readLocal(viewKey(videoId))), windowNow(), whole);
    if (kept) { setViewNow(kept); return; }
    const first = frames.filter(f => f.chapter === row.chapter.id).slice(0, 2).map(f => board.frames[f.id]).filter(Boolean);
    const box = union([{x: row.x, y: row.y, w: row.w, h: row.h}, ...first.map(p => ({x: p.x, y: p.y - HEAD, w: FRAME.w, h: HEAD + FRAME.h + NOTES_GAP + NOTES_H}))]);
    if (box) setViewNow(fit(box, {padding: 70}));
  }, [size, frames, board, fit, setViewNow, videoId, windowNow]);
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
  const fitAll = useCallback(() => goTo(fit(!trashing && videoSpots.length && frames.length ? union([board.bounds, ...videoSpots.map(v => ({x: v.x, y: v.y - HEAD, w: FRAME.w, h: HEAD + FRAME.h + NOTES_GAP + NOTES_H}))]) : board.bounds, {padding: 50})), [board, videoSpots, frames, trashing, goTo, fit]); // (the videos at the right of the lines are part of the board)
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
      if (!el) return null;
      const u = unitOf(stage), k = parentScale(el), t = translateOf(el), by = [dx * u / k, dy * u / k], off = offTail(stage, el, frame);
      return {frame, key, to: [t[0] + by[0], t[1] + by[1]], tip: off && [off.tip0[0] + by[0], off.tip0[1] + by[1]]};
    }).filter(Boolean);
    if (moves.length) commit(e => moves.reduce((cur, m) => (m.tip ? setTip(setMove(cur, m.frame, m.key, m.to), m.frame, m.key, m.tip) : setMove(cur, m.frame, m.key, m.to)), e), {merge: `move:${items.map(p => `${p.frame}:${p.key}`).join(',')}`});
  }, [commit]);

  // The same words in the other duplicates of an asset along its line of the board:
  // the ones that still say what this one said (`original`) are retyped with it.
  const duplicatesSaying = (e, frameId, key, original) => {
    const frame = allByIdRef.current[frameId]; // (a slide of a video that is not on the board is retyped too: the video says the same words in all its slides)
    if (!frame) return [];
    return linkedParts({frames: allFramesRef.current, edits: e, frame, key})
      .filter(part => (e.frames[part.frame]?.texts?.[part.key] ?? textIn(e.library[part.asset] ?? video.assets[part.asset], part.layer, part.rest)) === original);
  };
  // Retype a text (from the board, or from the video's picture): and the same words in the duplicates along its line.
  const retype = useCallback(({frame, key, original, text}) => {
    const also = duplicatesSaying(editsRef.current, frame, key, original);
    commit(e => [{frame, key}, ...also].reduce((cur, part) => setText(cur, part.frame, part.key, text), e));
    if (also.length) setStatus(`Also retyped in ${also.length} duplicate${also.length > 1 ? 's' : ''} in this line (right-click > Make unique to change one alone)`);
  }, [commit]); // eslint-disable-line react-hooks/exhaustive-deps
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
    const here = clip.video === videoId; // on its own board a copy stays linked to its original
    const made = pasteLayers(cur, byIdRef.current[target], clip.items, {nudge: here && clip.from === target, linked: here, source: here && byIdRef.current[clip.from] ? clip.from : null});
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
    return {id, art, at: {x: (x - art.left) / art.width * STAGE, y: (y - art.top) / art.height * FRAME.h}};
  };
  const onDragOver = event => { if ([...event.dataTransfer.types].includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } };
  const onDrop = event => {
    const files = [...event.dataTransfer.files].filter(isImage);
    if (![...event.dataTransfer.types].includes('Files')) return;
    event.preventDefault();
    if (!files.length) { setStatus('Only pictures (PNG, JPEG, WebP, GIF) can be dropped on a frame.'); return; }
    const over = frameAt(event.clientX, event.clientY);
    addImages(files, over?.id ?? frameAtCenter(), over?.at ?? null);
  };
  // Ctrl/⌘ + C, X, V come as the browser's own copy / cut / paste, so a picture in the clipboard can be read.
  useEffect(() => {
    const busy = event => isTyping(event.target) || editing.current;
    const mark = event => { try { event.clipboardData?.setData('text/plain', 'Taskmaverick storyboard'); } catch {} event.preventDefault(); };
    const onCopy = event => { if (!busy(event) && copySelected()) mark(event); };
    const onCut = event => { if (!busy(event) && copySelected()) { mark(event); removeSelected(); } };
    const onPaste = event => {
      if (busy(event)) return;
      const files = [...(event.clipboardData?.files ?? [])].filter(isImage);
      event.preventDefault();
      if (files.length) addImages(files, selRef.current?.frame ?? frameAtCenter(), null); else paste();
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
    applyEdits(stage, edit);
    return ghost;
  };
  const dropDuplicate = useCallback((d, event) => {
    const cur = editsRef.current;
    const [bx, by] = d.by ?? [event.clientX - d.client.x, event.clientY - d.client.y]; // (Shift may have kept it on one axis)
    const over = frameAt(d.client.x + bx, d.client.y + by), target = over?.id ?? d.frame;
    const from = d.stage.getBoundingClientRect(), to = over?.art ?? from, u = from.width / STAGE;
    const shift = [(bx - (to.left - from.left)) / u, (by - (to.top - from.top)) / u];
    const clip = copyLayers({frame: byIdRef.current[d.frame], edit: cur.frames[d.frame], keys: d.items.map(item => item.key), htmlOf: hash => cur.library[hash] ?? video.assets[hash], stage: video.stage, video: videoId});
    const made = pasteLayers(cur, byIdRef.current[target], clip.items, {shift, linked: true, source: d.frame});
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
    if (event.button !== 0 || event.target.closest('[data-sb-ui]')) return;
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
      const itemsOf = picks => picks.map(itemOf).filter(Boolean);
      const mine = {frame: id, key};
      if (event.shiftKey && s?.key) { // Shift: add it to the assets picked, in this frame or any other (a click on one already picked takes it out); a drag moves them all, along one axis while Shift is held
        cycleRef.current = null;
        const base = pickedItemsRef.current.length ? pickedItemsRef.current : picksOf(s.frame, [s.key]);
        if (hasPick(base, mine)) { begin({type: 'maybe-move', client, items: itemsOf(base), frame: id, stage: hit.stage, moved: false, keep: true, unpick: {pick: mine, items: base, depth: s.depth}}); return; }
        const items = addPick(base, mine);
        setPicked({items}); setSelection({frame: id, key, depth}); setFrameSel(framesOfPicks(items));
        begin({type: 'maybe-move', client, items: itemsOf(items), frame: id, stage: hit.stage, moved: false, keep: true});
        return;
      }
      if (again) { begin({type: 'maybe-move', client, items: itemsOf([mine]), frame: id, stage: hit.stage, moved: false, again: true}); return; }
      const group = hasPick(pickedItemsRef.current, mine) ? pickedItemsRef.current : [mine]; // dragging one of several picked moves them all
      if (group.length === 1) setPicked(null);
      setSelection({frame: id, key, depth}); setFrameSel(group.length > 1 ? framesOfPicks(group) : [id]);
      cycleRef.current = plain ? {frame: id, x: client.x, y: client.y, key} : null;
      if (event.altKey) { // Alt: what is dragged is a duplicate (of the whole asset, in this frame); the original stays
        const whole = [...new Set(group.filter(p => p.frame === id).map(p => layerKeyOf(p.key)))].map(k => { const item = elementOf(hit.stage, k); return item && {el: item, key: k, frame: id, stage: hit.stage, t0: translateOf(item), k: parentScale(item)}; }).filter(Boolean);
        begin({type: 'maybe-move', client, items: whole, frame: id, stage: hit.stage, moved: false, dup: true});
        return;
      }
      // something as big as the frame (a dim, a backdrop), not yet selected, with other assets in the frame to pick: dragging
      // from it draws a rectangle (a click still selects it). A frame of only that (the title's words): the drag moves it.
      const root = chain[0], box = screenRectOf(root), S = hit.stage.getBoundingClientRect(), whole = {left: S.left, top: S.top, right: S.right, bottom: S.bottom};
      const backdrop = plain && group.length === 1 && !(s?.frame === id && s.key && layerKeyOf(s.key) === layerKeyOf(key)) && isBackdrop({left: box.left, top: box.top, right: box.left + box.width, bottom: box.top + box.height}, S) && assetsIn(hit.stage, whole).length > 0;
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
      if (key === 'k') { const on = toolRef.current !== 'scale'; setTool(on ? 'scale' : 'move'); if (on) setStatus('Scale (K): drag a handle and the words scale with the box. K, V or Esc to leave.'); return; } // the Scale tool, like Figma's
      if (key === 'delete' || key === 'backspace') { event.preventDefault(); if (lineSelRef.current && !selRef.current) deleteLineOf(lineSelRef.current); else removeSelected(); return; }
      if (key === 'escape') {
        if (writers.current.length) { stopWriting(); return; }
        if (ctx) { setCtx(null); return; }
        if (drag.current?.type === 'line-move' && drag.current.started) { cancelLineMove(); return; }
        if (lineSelRef.current) { setLineSel(null); return; }
        if (toolRef.current === 'pencil' || toolRef.current === 'rect' || toolRef.current === 'scale') { setTool('move'); return; }
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
    const p = {x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100, key: s.key, link: frame ? linkOf(frame, edit, layer)?.id ?? null : null, name: nameOf(el, frame && layersOf(frame, edit).find(l => l.key === layer)?.name)};
    positionRef.current = p;
    writeLocal(POSITION, JSON.stringify(p));
    setStatus(`Copied the position of ${p.name}: ${Math.round(p.x)}, ${Math.round(p.y)}`);
    setTick(t => t + 1);
  };
  // The same asset in another frame: its key, else the one linked to it (a duplicate), else null.
  const matchIn = (frameId, p) => {
    const frame = byIdRef.current[frameId];
    if (!frame) return null;
    const edit = editsRef.current.frames[frameId], layers = layersOf(frame, edit), {layer, rest} = splitKey(p.key);
    if (layers.some(l => l.key === layer)) return p.key;
    const linked = p.link && layers.find(l => linkOf(frame, edit, l.key)?.id === p.link);
    return linked ? linked.key + rest : null;
  };
  // Each [frame, key]'s top left corner to p (stage px), in one step. -> how many were placed
  const placeAll = (parts, p) => {
    const moves = [];
    for (const {frame, key} of parts) {
      const stage = stageFor(frame), el = stage && elementOf(stage, key);
      if (!el) continue;
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
    for (const [anchor, scene] of cells.anchors) out.set(anchor, {name: scene.name, frames: scene.ids.map(id => allById[id]).filter(Boolean), edits, onText: retype, onFrame: id => setPlayingId(id ? anchor : null)});
    return out;
  }, [cells, allById, edits, retype]);
  const liveIds = useMemo(() => {
    const near = visibleWorld(view, size, Math.max(300, size.w) / view.zoom), ids = new Set();
    for (const f of frames) {
      const p = board.frames[f.id];
      if (!p) continue;
      if (hasChanges(edits, f.id) || (view.zoom >= LIVE_ZOOM && intersects(near, {x: p.x, y: p.y, w: FRAME.w, h: FRAME.h}))) ids.add(f.id);
    }
    if (selection) ids.add(selection.frame);
    for (const p of pickedItems) ids.add(p.frame); // (the assets picked in other frames are measured and moved: those frames are drawn)
    for (const id of forceDraw) ids.add(id);
    return ids;
  }, [view, size, frames, board, edits, selection, pickedItems, forceDraw]);
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
    const others = pickedItems.filter(p => !(p.frame === selection?.frame && p.key === selection?.key)).map(p => { const stage = stageFor(p.frame), el = stage && elementOf(stage, p.key); return el ? {key: `${p.frame}\n${p.key}`, ...rel(el.getBoundingClientRect())} : null; }).filter(Boolean);
    if (selection?.key) {
      const stage = stageFor(selection.frame), el = stage && elementOf(stage, selection.key);
      if (el) {
        const top = selection.key.split('/')[0], bubble = !selection.key.includes('/') && isBubble(el);
        const r = bubble ? screenRectOf(el) : el.getBoundingClientRect(); // (a bubble by its yellow box: that is what its handles resize)
        const f = byId[selection.frame], layer = f && layersOf(f, editsRef.current.frames[selection.frame]).find(l => l.key === top);
        const box = stageBoxOf(stage, el), u = unitOf(stage), name = nameOf(el, layer?.name);
        const kind = resizeKind(el), scale = scaleOf(el);
        const lock = lockOf(editsRef.current, selection.frame, selection.key);
        outline = {...rel(r), name, w: Math.round(r.width / u), h: Math.round(r.height / u), handles: pickedItems.length || (lock.w && lock.h) || (!kind.free && (lock.w || lock.h)) || (toolRef.current === 'scale' && kind.mode === 'size' && (lock.w || lock.h)) ? null : kind.free ? 'all' : 'corners', lock};
        info = {kind: 'asset', frame: board.frames[selection.frame]?.index, name, x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h), bubble, top: !selection.key.includes('/'),
          scale: kind.mode === 'scale' && (scale[0] !== 1 || scale[1] !== 1) ? scale.map(s => Math.round(s * 100)) : null, free: kind.free, keep: kind.keep,
          ink: el.dataset.sbBox === 'drawing' && layer ? inkOf(editsRef.current.library[layer.asset]) : null, lock: lockOf(editsRef.current, selection.frame, selection.key),
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
    const plays = [...new Set([...frameSel, ...(selection ? [selection.frame] : [])])].filter(id => hasAnim(editsRef.current, id) && !cells.anchors.has(id)).map(id => { // (a video has no pen of its own: its slides' pens write as it plays)
      const art = frameEl(id)?.querySelector('[data-art]'), r = art && rel(art.getBoundingClientRect());
      return r && r.width >= 110 ? {id, left: Math.round(r.left + r.width - 40), top: Math.round(r.top + 10)} : null; // (top right of the slide)
    }).filter(Boolean);
    const outlines = [...new Set(frameSel.concat(selection && !selection.key ? [selection.frame] : []))].map(id => { const art = frameEl(id)?.querySelector('[data-art]'); return art ? {id, ...rel(art.getBoundingClientRect())} : null; }).filter(Boolean);
    if (info && others.length) info.count = others.length + 1;
    setOverlay(o => (JSON.stringify([o.outline, o.tip, o.frames, o.info, o.picks, o.plays]) === JSON.stringify([outline, tip, outlines, info, others, plays]) ? o : {outline, tip, frames: outlines, info, picks: others, plays}));
  });

  // A handle of the selected asset: dragging it scales the asset (see the 'scale' drag).
  const startScale = (event, handle) => {
    event.stopPropagation(); event.preventDefault();
    if (editing.current) finishEdit(true);
    const s = selRef.current, stage = s?.key && stageFor(s.frame), el = stage && elementOf(stage, s.key);
    if (!el) return;
    const r = screenRectOf(el), kind = resizeKind(el);
    let content = null; // the Scale tool (K) on a box or a chat box: what scales with it besides its boundaries
    if (toolRef.current === 'scale' && kind.mode === 'size') {
      const own = styleOf(editsRef.current, s.frame, s.key);
      if (isBubble(el)) { const box = bubbleBoxOf(stage, el), given = (el.dataset.sbSize ?? '').split(',').map(Number); content = {bubble: true, own, size: lookOf(el).size, pad: bubblePad(el), box: [box.w, box.h], given: [given[0] || 0, given[1] || 0], u: unitOf(stage)}; }
      else content = {bubble: false, own};
    }
    begin({type: 'scale', handle, el, key: s.key, frame: s.frame, stage, kind, content, lock: lockOf(editsRef.current, s.frame, s.key), r0: {left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: Math.max(1, r.width), height: Math.max(1, r.height)}, s0: scaleOf(el), size0: sizeOf(el), k: parentScale(el), off: !!offTail(stage, el, s.frame), moved: false});
  };
  // Right-click on an asset: its menu (Make unique, copy, paste, delete).
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
    const cur = editsRef.current, edit = cur.frames[s.frame], layers = [...new Set(keys.map(layerKeyOf))], row = baseFramesRef.current.filter(f => f.chapter === frame.chapter);
    const linked = layers.filter(k => !isUnique(edit, k)).reduce((n, k) => { const link = linkOf(frame, edit, k); return n + (link ? Math.max(0, linkedLayers(row, cur, link.id).length - 1) : 0); }, 0);
    setCtx({x: event.clientX, y: event.clientY, frame: s.frame, layers, linked, unique: layers.filter(k => isUnique(edit, k)).length});
  };
  useEffect(() => { // the menu closes on a click anywhere else, or when the board moves
    if (!ctx) return;
    const close = event => { if (!event.target.closest?.('.sb-ctx')) setCtx(null); };
    window.addEventListener('pointerdown', close, true); window.addEventListener('wheel', close, true);
    return () => { window.removeEventListener('pointerdown', close, true); window.removeEventListener('wheel', close, true); };
  }, [ctx]);
  const makeUnique = on => { setUniqueOf(ctx.frame, ctx.layers, on); setCtx(null); };
  // A drawing in another color or width (one undo step while the wheel is dragged).
  const restyle = change => {
    const s = selection, cur = editsRef.current, layer = s?.key && cur.frames[s.frame]?.inserts?.find(l => l.key === s.key), html = layer && cur.library[layer.asset];
    if (!html) return;
    const next = restyleInk(html, change);
    if (next !== html) commit(e => setInsertHtml(e, s.frame, s.key, next, hashString(next)), {merge: `ink:${s.frame}:${s.key}`});
  };
  // ---- The sidebar: what it sets on the picked assets (a field typed or scrubbed is one undo step) ----
  const setLook = (patch, name = Object.keys(patch).join(',')) => {
    const items = itemsNow();
    if (!selRef.current?.key || !items.length) return;
    commit(e => items.reduce((cur, {frame, key}) => setStyle(cur, frame, key, patch), e), {merge: `look:${items.map(p => `${p.frame}:${p.key}`).join(',')}:${name}`});
  };
  // Align the picked assets, frame by frame: one in its frame, several in a frame to the box around them.
  const alignSelected = where => {
    const moves = [];
    for (const {frame, keys} of groupsNow()) {
      const stage = stageFor(frame);
      if (!stage) continue;
      const u = unitOf(stage), items = keys.map(key => { const el = elementOf(stage, key); return el && {key, el, b: stageBoxOf(stage, el)}; }).filter(Boolean);
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
    if (!el) return;
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
  // How many duplicates along its line the picked assets are linked to, and how many are unique.
  const linkInfo = (frameId, keys) => {
    const frame = byIdRef.current[frameId];
    if (!frame) return {layers: [], linked: 0, unique: 0};
    const cur = editsRef.current, edit = cur.frames[frameId], layers = [...new Set(keys.map(layerKeyOf))], row = baseFramesRef.current.filter(f => f.chapter === frame.chapter);
    const linked = layers.filter(k => !isUnique(edit, k)).reduce((n, k) => { const link = linkOf(frame, edit, k); return n + (link ? Math.max(0, linkedLayers(row, cur, link.id).length - 1) : 0); }, 0);
    return {layers, linked, unique: layers.filter(k => isUnique(edit, k)).length};
  };
  const setUniqueOf = (frameId, layers, on) => { commit(e => layers.reduce((cur, k) => setUnique(cur, frameId, k, on), e)); setStatus(on ? 'Made unique: it no longer changes with its duplicates.' : 'Linked to its duplicates again.'); };
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
    const L = info.look ?? {}, own = info.own ?? {}, many = !!info.count, links = linkInfo(selection.frame, keysNow());
    const fillPaint = isGradient(own.fill) ? own.fill : null, fill = fillPaint ?? solidHex(own.fill ?? L.fill), stroke = solidHex(own.stroke ?? L.stroke), weight = own.weight ?? L.weight ?? 400;
    const weights = WEIGHTS.some(([w]) => w === weight) ? WEIGHTS : [...WEIGHTS, [weight, String(weight)]].sort((a, b) => a[0] - b[0]);
    return <>
      <div className="sb-side-head"><b>{many ? `${info.count} assets` : info.name}</b><small>Frame {info.frame}</small></div>
      <Section title="Position" tools={<>
        <ToolButton icon={PanelIcon.copyPos} label="Copy the position (Ctrl+Shift+C)" onClick={copyPosition}/>
        <ToolButton icon={PanelIcon.pastePos} label="Paste the position (Ctrl+Shift+V)" onClick={pastePosition} disabled={!copiedPosition()}/>
      </>}>
        <IconButtons items={ALIGN} value={null} onChange={alignSelected}/>
        <div className="sb-row">
          <NumField label="X" value={info.x} onChange={v => setPosition('x', v)}/>
          <NumField label="Y" value={info.y} onChange={v => setPosition('y', v)}/>
        </div>
        {!info.bubble && <div className="sb-row"><NumField label={PanelIcon.rotate} title="Rotation" value={own.rotate ?? 0} unit="°" onChange={v => setLook({rotate: v || null})}/><span className="sb-row-fill"/></div>}
      </Section>
      <Section title="Layout">
        <div className="sb-row">
          <NumField label="W" value={info.w} min={1} disabled={many || info.lock?.w} onChange={v => resizeSelected(v, null)}/>
          <LockButton on={info.lock?.w} label="width" onClick={() => toggleLock('w')}/>
          <NumField label="H" value={info.h} min={1} disabled={many || info.lock?.h} onChange={v => resizeSelected(null, v)}/>
          <LockButton on={info.lock?.h} label="height" onClick={() => toggleLock('h')}/>
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
          {links.linked > 0 && <button type="button" onClick={() => setUniqueOf(selection.frame, links.layers, true)}>Make unique</button>}
          {links.unique > 0 && <button type="button" onClick={() => setUniqueOf(selection.frame, links.layers, false)}>Link again</button>}
          <button type="button" onClick={removeSelected} disabled={!info.top}>Delete</button>
        </div>
      </Section>
    </>;
  };
  const setFrameBackground = paint => { const ids = (frameSel.length ? frameSel : [selection.frame]).filter(id => byIdRef.current[id]); commit(e => ids.reduce((cur, id) => setBackground(cur, id, paint), e), {merge: `background:${ids.join(',')}`}); };
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
  const zoomPct = `${Math.round(view.zoom * (view.zoom < 0.1 ? 1000 : 100)) / (view.zoom < 0.1 ? 10 : 1)}%`;
  const cursor = space || tool === 'hand' ? (drag.current?.type === 'pan' ? 'grabbing' : 'grab') : tool === 'pencil' || tool === 'rect' ? 'crosshair' : drag.current?.dup && drag.current.moved ? 'copy' : 'default';
  const handleAt = (o, h) => ({left: o.left + (h.includes('w') ? 0 : h.includes('e') ? o.width : o.width / 2), top: o.top + (h.includes('n') ? 0 : h.includes('s') ? o.height : o.height / 2)});
  const info = overlay.info, selFrame = selection ? byId[selection.frame] : null;
  const targetLabel = menu ? `frame ${board.frames[menu.target]?.index ?? ''}` : '';

  return <div className="sb-root">
    <div className="sb-float sb-float--left">
      <Link href="/" className="sb-back" aria-label="Home">←</Link>
      <span className="sb-name">Storyboard</span>
      <select className="sb-video" value={videoId} onChange={e => { window.location.search = `?video=${e.target.value}`; }} aria-label="Board">{BOARDS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
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
      <button type="button" className={`sb-icon${help ? ' is-on' : ''}`} onClick={() => setHelp(h => !h)} title="Shortcuts" aria-label="Shortcuts" aria-pressed={help}>{Icon.help}</button>
    </div>
    <div ref={viewport} className="sb-viewport" style={{cursor: reorder ? 'grabbing' : cursor}} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerLeave={() => setHoverGap(null)} onClick={onClick} onDoubleClick={onDoubleClick} onContextMenu={onContextMenu} onDragOver={onDragOver} onDrop={onDrop}>
      <div ref={worldRef} className="sb-world" style={{transform: `translate(${viewRef.current.x}px,${viewRef.current.y}px) scale(${viewRef.current.zoom})`}}>
        {board.rows.map(row => <div key={row.chapter.id} className={`sb-section${row.chapter.title.length > 22 ? ' is-long' : ''}${lineSel === row.chapter.id ? ' is-selected' : ''}`} data-sb-row={row.chapter.id} style={{left: row.x, top: row.y, width: row.w, height: row.h}}>
          {lineEdit === row.chapter.id ? <LineName title={row.chapter.title} onDone={title => { setLineEdit(null); if (title != null) renameLineTo(row.chapter.id, title); }}/> : <span>{row.chapter.title}</span>}
        </div>)}
        {!trashing && board.rows.filter(row => !frames.some(f => f.chapter === row.chapter.id) && !shelfLines.has(row.chapter.id)).map(row => <button key={`empty-${row.chapter.id}`} type="button" className="sb-line-empty" data-sb-ui="" data-sb-empty={row.chapter.id} style={{left: LAYOUT.labelW + LAYOUT.labelGap, top: row.y + BAR + BAR_GAP, width: FRAME.w, height: FRAME.h}} onClick={() => addFrameIn(row.chapter.id)}><span>{Icon.plus}Add a frame</span></button>)}
        {!trashing && loaded && <button type="button" className="sb-line-add" data-sb-ui="" style={{left: 0, top: board.rows.length * board.rowHeight, width: LAYOUT.labelW, height: BAR}} onClick={() => addLineAfter(lines.at(-1)?.id ?? null)}><span>{Icon.plus}Add line</span></button>}
        {reorder && reorder.ids.filter(id => board.frames[id]).map(id => <div key={id} className="sb-slot" style={{left: board.frames[id].x, top: board.frames[id].y - HEAD, width: FRAME.w, height: HEAD + FRAME.h + NOTES_GAP + NOTES_H}}/>)}
        {!trashing && loaded && videoRuns.map(v => <StoryboardPlayer key={v.key} frames={v.frames} title={v.title} edits={edits} video={video} x={v.x} y={v.y} focus={selection?.frame ?? null} lines={lines} placed={board.frames} onFrame={setPlayingId} onText={retype}/>)}
        {frames.map(f => { const p = board.frames[f.id]; return p && <Frame key={f.id} frame={f} index={p.index} x={p.x} y={p.y} video={video} live={liveIds.has(f.id)} urgent={selection?.frame === f.id || forceDraw.has(f.id)} solid={solidIds.has(f.id)} edit={edits.frames[f.id]} library={edits.library} note={noteOf(edits, f.id)} selected={frameSel.includes(f.id) || (selection?.frame === f.id && !selection.key)} dragging={!!reorder?.ids.includes(f.id)} playing={playingId === f.id} isNew={fresh.has(f.id)} onNote={onNote} cell={cellProps.get(f.id) ?? null}/>; })}
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
      </> : info?.kind === 'asset' && selFrame ? assetPanel() : info?.kind === 'frame' && selFrame ? framePanel() : lineNow ? linePanel() : boardPanel()}
    </aside>
    {ctx && <div className="sb-ctx" data-sb-ui="" role="menu" style={{left: Math.min(ctx.x, size.w - 270), top: Math.min(ctx.y, size.h - 260)}}>
      {ctx.line ? <>
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
      <button type="button" role="menuitem" disabled={!ctx.linked} onClick={() => makeUnique(true)}>Make unique <kbd>{ctx.linked ? `${ctx.linked} duplicate${ctx.linked > 1 ? 's' : ''} in this line` : ctx.unique ? 'already unique' : 'no duplicates'}</kbd></button>
      {ctx.unique > 0 && <button type="button" role="menuitem" onClick={() => makeUnique(false)}>Link to its duplicates again</button>}
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
      <dl><dt>Click</dt><dd>Select an asset or a frame</dd><dt>Double-click</dt><dd>Go into a group · retype any text</dd><dt>Tab while typing</dt><dd>The next text</dd><dt>Shift + click</dt><dd>Pick several assets or frames</dd><dt>Ctrl / ⌘ + C · X · V</dt><dd>Copy · cut · paste (any board)</dd><dt>Ctrl / ⌘ + click</dt><dd>Select the deepest</dd><dt>Drag · arrows (Shift = 10)</dt><dd>Move</dd><dt>Shift while dragging</dt><dd>Straight: one axis only</dd><dt>Ctrl / ⌘ while dragging</dt><dd>No snapping</dd><dt>Ctrl Shift C · Ctrl Shift V</dt><dd>Copy · paste a position (on the picked assets, or the same asset in the picked frames)</dd><dt>Drag a corner handle</dt><dd>Scale (UI keeps its proportions; a chat box changes its box, its words keep their size)</dd><dt>K, then drag a handle</dt><dd>Scale the asset with its words: a chat box grows with its font (K, V or Esc: back)</dd><dt>Alt + drag</dt><dd>Duplicate, here or onto another frame</dd><dt>Right-click</dt><dd>Make unique (duplicates are linked)</dd><dt>Esc</dt><dd>Out one level</dd><dt>Ctrl Z · Ctrl Shift Z</dt><dd>Undo · redo</dd></dl>
      <h3>Frames and assets</h3>
      <dl><dt>Ctrl / ⌘ + ] / [</dt><dd>Bring forward / send backward (Shift: to the front / back)</dd><dt>Ctrl / ⌘ + D</dt><dd>Duplicate the frame</dd><dt>Delete</dt><dd>Take an asset out · move a frame to the Trash</dd><dt>Shift A</dt><dd>Add a UI element</dd><dt>Paste or drop a picture</dt><dd>Add it to the frame</dd><dt>P, then drag on a frame</dt><dd>Draw (Alt + click: pick a color)</dd><dt>The bin at the top, or Board &gt; Trash</dt><dd>Deleted frames: copy one, paste it on a storyboard</dd><dt>+ between two frames</dt><dd>Add a blank frame there</dd><dt>Click a line's name</dt><dd>Pick the line (Del · Ctrl D · Ctrl C / V)</dd><dt>Double-click a line's name</dt><dd>Rename it</dd><dt>Hold a frame's number bar, drag</dt><dd>Move it (Esc: put back)</dd></dl></div>}
  </div>;
}
