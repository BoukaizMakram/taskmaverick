'use client';

// The video editor (the user, 2026-10-22: "the videos I should be able to open like a video editor when I double click a video"; then "like after effects in
// terms of scroll in video, press doesn't play it selects, all elements should be editable, and I can apply to all ... the background the text everything should
// selectable, I should be able to add images ... timeline should be like after effects timeline"; then "most importantly, is a shape tool, shapes, keyframes").
// A video of the storyboard opened over the board; the board's sidebar at its right is the inspector of what is picked.
//   The viewer (After Effects' composition panel): the wheel zooms around the pointer, the middle button / Space / the Hand (H) pans, a press PICKS (it never plays):
//   a layer of the video, a color part (outline, connector, plate, gray side, background), the words, or an element of the slide on (Ctrl: the deepest thing there).
//   A layer is moved, resized and turned on the picture; an element of a slide is moved there (its place is that slide's: "place: slide"; its look in the sidebar
//   goes to every slide of the video: "look: video"). A double-click retypes a text. Tools: V select, H hand, R rectangle, E ellipse, T text, I image (or drop /
//   paste a picture); a new layer is on screen from now to the end of the line it is in.
//   The timeline (After Effects'): the layers of the video (front first) with their bars (drag: move, ends: trim) and keyframes (◆: drag, click), a twirl for
//   Position / Size / Rotation / Opacity with the stopwatch (animate), the values (drag or type) and ◂ ◆ ▸; then the elements of the slides, a bar while each is
//   on screen and ◆ where a slide starts (the eye hides it in this video); then the slides. The timing of the video itself is its own (asked: "timing fixed").
// Then (the user, 2026-10-26: "make the video editor much more smoother with more features like a video editing software, like multiselection etc."):
//   - several things picked at once: Shift+click on the picture, a rectangle drawn from the plate, the background or outside the picture (Shift: adds), Ctrl+A;
//     on the timeline Ctrl+click (one more) and Shift+click (a run) on the names, keyframes with Shift / Ctrl or a rectangle drawn on the layers' tracks. They are
//     moved, nudged, scaled by the box round them, aligned and spread (the sidebar), copied, cut and pasted (at the playhead, into any video), duplicated, split at
//     the playhead, deleted, brought forward or back, their bars and keyframes dragged together;
//   - the magnet: what is moved is taken by the picture's sides and middle, the other layers and the guide lines (red lines), on the timeline by the playhead,
//     the slides, the layers' ends and keyframes;
//   - a right-click menu, the stacking by dragging the names, the loop and its work area (B / N), the speed, a frame at a time, a time typed in;
//   - smooth: the picture pans and zooms without drawing the editor again, the wheel's zoom glides, Fit and the zoom menu ease there, the video itself and the
//     slides' rows of the timeline are not drawn again for a change of the layers.
// Then (the user, 2026-10-28, with a picture of After Effects' timeline: "make all layers this way ... move it, trim it, frame by frame using page up and down, u to reveal
// all keyframes, have properties like opacity, effects and everything like after effects"):
//   - every row is a bar like After Effects': the layers in the color of their label (click the square by the name), the elements of the slides in Sea Foam, with the notch on
//     their ends to trim them (a layer's bar also moves it in time; an element of the slides lives on its slides, so its ends only TRIM it: lib `spans`);
//   - Page Up / Down a frame (Shift: ten), the time as After Effects' timecode 0;00;01;07;
//   - U shows the properties with keyframes (the layers picked, else all), U U the changed ones; P S R T E over the timeline show Position, Size, Rotation, Opacity, Effects;
//   - the twirl has the layer's effects (the fx button adds one; each number has the stopwatch and keyframes like the transform's) and the inspector its blend mode and label.
//   Keys: Space play, ← → nudge what is picked (Shift 10) or the slide before / after, Page Up / Down a frame, J / K the keyframe before / after, , . a frame,
//   [ / ] the layers start / end now (Alt: trimmed), B / N the work area, Ctrl+C / X / V / D / A, Ctrl+Shift+D split, Delete, F9 easy ease, Ctrl + / − / 0 zoom, ?, Esc.
// Then (the user, 2026-10-29: "add a way to add comment to the video, the comment should be a point I can place and write what I want and save its placement and the comment itself, it
// can be deleted right clicking it and delete or selecting and hitting delete on the right inspector"): the Comment tool (C). A click on the picture puts a PIN there (a numbered dot with
// a speech bubble's corner, its tip on the point) at the second the playhead is on, picks it and the inspector (components/StoryboardCommentPanel.jsx) takes the words. A pin is dragged to
// move it, right-clicked for Delete (or Delete when it is picked, or the inspector's button), and has a mark on the ruler. It keeps its size when the picture is zoomed (it lives over the
// viewer in screen px, placed by `placePins`, not inside the picture), is on the picture only from its second to COMMENT_SHOW.after seconds after (picked: always, faded) and is NEVER part
// of the video: no player, export or clip draws it (lib/storyboardComments.mjs, `edits.comments[title]`). Pressing a pin never moves the playhead and never plays or pauses.
import {Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {locate, settledAt} from '@/lib/storyboardPlayer.mjs';
import {EFFECTS, EFFECT_TYPES, LABELS, LAYER_DEFAULTS, SLIDE_LABEL, STAGE_H, STAGE_W, addEffect, animatedGroups, easeKeys, groupsOf, isAnimated, isShownAt, keyTimes, labelOf, modifiedGroups, newEffectId, paramsOf, patchEffect, removeEffect, removeKeyAt, removeKeys, setAnimated, setLayerAt, shiftKeys, shiftLayer, trimLayer, valueAt, valuesAt} from '@/lib/storyboardLayers.mjs';
import {COMMENT_SHOW, isCommentShown} from '@/lib/storyboardComments.mjs';
import {moveTo, parentScale, resizeKind, scaleOf, scaleTo, translateOf} from './storyboardDom';
import {layerAt} from './storyboardLayers';
import {frameFromStage} from '@/lib/storyboardPaths.mjs';
import StoryboardPathEditor from './StoryboardPathEditor';
import StoryboardPlayer from './StoryboardPlayer';
import {ExportButton} from './StoryboardExport';

const tc = s => { const t = Math.max(0, s), m = Math.floor(t / 60); return `${m}:${(t - m * 60).toFixed(1).padStart(4, '0')}`; }; // 1:08.4
// After Effects' timecode (the user, 2026-10-28, with its picture): hours ; minutes ; seconds ; frames, 30 a second: 0;00;01;07
const two = n => String(n).padStart(2, '0');
const tcf = s => { const n = Math.max(0, Math.round(s * 30)); return `${Math.floor(n / 108000)};${two(Math.floor(n / 1800) % 60)};${two(Math.floor(n / 30) % 60)};${two(n % 30)}`; };
const parseTc = s => {
  const text = String(s).trim(), f = text.match(/^(\d+)[;:](\d+)[;:](\d+)[;:](\d+)$/);
  if (f) return Number(f[1]) * 3600 + Number(f[2]) * 60 + Number(f[3]) + Number(f[4]) / 30; // (0;00;01;07)
  const m = text.match(/^(?:(\d+):)?(\d+(?:\.\d*)?)$/);
  return m ? Number(m[1] ?? 0) * 60 + Number(m[2]) : null; // (1:08.4, or 68.4)
};
const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60];
const LEFT = 272, PAD = 12; // (the timeline's column of names and switches; the room before the time 0)
const NONE = [];
const NO_SPANS = {};
const FRAME_S = 1 / 30; // (one picture of the video: , . and Ctrl + ← →)
const SPEEDS = [0.25, 0.5, 1, 1.5, 2];
const SNAP_PX = 6; // (how near, on the screen, a line takes what is moved: the magnet, on the picture and on the timeline)
const PREVIEWS = new Set(['move', 'resize', 'rotate', 'gresize']); // (drags shown on the picture before they are kept)
const isField = el => !!el?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-sb-te]');
const noFocus = e => e.preventDefault(); // (a button pressed keeps the keyboard where it was)
const viewCss = v => `translate(${v.x}px, ${v.y}px) scale(${v.z})`;
const SLIDE_COLOR = LABELS[SLIDE_LABEL - 1].color; // (the bars of the elements of the slides: After Effects' Sea Foam)
const KEY_GROUPS = {p: () => ['position'], s: () => ['size'], r: () => ['rotation'], t: () => ['opacity'], e: l => (l.fx ?? []).map(e => `fx:${e.id}`)}; // (P S R T E on the timeline: After Effects' property keys)
const U_TWICE = 450; // (ms: U pressed twice shows what is changed, not only what is animated)
const ICON = {
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>,
  framePrev: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 6l-6 6 6 6"/></svg>,
  frameNext: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 6l6 6-6 6"/></svg>,
  prev: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="2.6" height="14" rx="1"/><path d="M19 6.3v11.4a.9.9 0 0 1-1.38.76l-8.6-5.7a.9.9 0 0 1 0-1.52l8.6-5.7A.9.9 0 0 1 19 6.3Z"/></svg>,
  next: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="16.4" y="5" width="2.6" height="14" rx="1"/><path d="M5 6.3v11.4a.9.9 0 0 0 1.38.76l8.6-5.7a.9.9 0 0 0 0-1.52l-8.6-5.7A.9.9 0 0 0 5 6.3Z"/></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  undo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>,
  redo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>,
  select: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5v15.2c0 .6.7.9 1.1.5l3.7-3.6 2.4 5.5c.2.4.6.5 1 .4l1.6-.7c.4-.2.5-.6.4-1l-2.4-5.4h5.2c.6 0 .9-.7.5-1.1L7.1 2.9C6.7 2.5 6 2.8 6 3.5Z"/></svg>,
  hand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V13M17 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7l-2.6-4a1.6 1.6 0 0 1 2.6-1.9L8 14"/></svg>,
  rect: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="6" width="16" height="12" rx="1.5"/></svg>,
  ellipse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="12" rx="8.5" ry="6.5"/></svg>,
  text: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6"/></svg>,
  pen: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5l6.5 6.2-3.2 8.3H8.7L5.5 9.7 12 3.5Z"/><path d="M12 3.5v8.2"/><circle cx="12" cy="13.3" r="1.5"/><path d="M8.7 18h6.6M9.4 20.5h5.2"/></svg>,
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8 8"/></svg>,
  comment: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><path d="M12 3.8a8.2 8.2 0 1 1-3.7 15.5L3.8 20.2l1-4.1A8.2 8.2 0 0 1 12 3.8Z"/><path d="M8.6 10.6h6.8M8.6 13.8h4.2"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>,
  twirl: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 6.5v11l8-5.5-8-5.5Z"/></svg>,
  watch: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M18.5 6l1.5-1.5"/></svg>,
  key: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12 12 3.5Z"/></svg>,
  keyPrev: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6.5v11L7 12l8-5.5Z"/></svg>,
  keyNext: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 6.5v11l8-5.5-8-5.5Z"/></svg>,
  loop: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l3 3-3 3"/><path d="M4 12v-1.5A4.5 4.5 0 0 1 8.5 6H20"/><path d="M7 21l-3-3 3-3"/><path d="M20 12v1.5a4.5 4.5 0 0 1-4.5 4.5H4"/></svg>,
  magnet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M5 4h4.2v7.5a2.8 2.8 0 0 0 5.6 0V4H19v7.5a7 7 0 0 1-14 0V4Z"/><path d="M5 8.2h4.2M14.8 8.2H19"/></svg>,
  help: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .9-1 1.6v.5"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>,
};
const TOOLS = [['select', 'Selection (V)', ICON.select], ['hand', 'Hand (H; or hold Space, or the middle button)', ICON.hand], ['rect', 'Rectangle (R)', ICON.rect], ['ellipse', 'Ellipse (E)', ICON.ellipse], ['pen', 'Pen (P): click for a corner, click and drag for a curve, the first point closes it; Enter ends it', ICON.pen], ['text', 'Text (T)', ICON.text], ['comment', 'Comment (C): click on the picture to put a pin there, then write in the inspector (a pin is not part of the video)', ICON.comment]];
const ZOOMS = [0.25, 0.5, 1, 2, 4];
const SHORTCUTS = [
  ['Pick', [['Click', 'A layer or an element of the slide (Ctrl: the deepest thing there)'], ['Shift + click', 'Add it to what is picked, or take it out'], ['Drag from the plate, the background or outside the picture', 'A rectangle: picks what it touches (Shift: adds)'], ['Ctrl + A', 'All the layers'], ['Esc', 'Nothing picked (again: close)']]],
  ['Edit', [['Drag · ← ↑ → ↓', 'Move what is picked (Shift: on one axis · by 10)'], ['The handles', 'Resize (several layers: all of them; Shift: proportions)'], ['Ctrl + C / X / V', 'Copy, cut, paste the layers (at the playhead, in any video)'], ['Ctrl + D', 'Duplicate'], ['Ctrl + Shift + D', 'Split at the playhead'], ['Ctrl + ] / [', 'Forward / backward (Shift: to the front / back)'], ['Delete', 'The layers, or the keyframes picked (a path\'s points picked: those)'], ['Right-click', 'The menu of what is under the pointer']]],
  ['Paths', [['Click a purple line of the software', 'It becomes a path of the video (its ends, color and points are yours); Delete gives the software\'s line back'], ['P', 'Pen: click a corner · click and drag a curve · the first point closes · Enter / Esc / double-click ends · Backspace: the last point · Shift: 45°'], ['A path picked: press a point', 'Moves it (Shift: one more, all picked move together); Delete takes the points picked off'], ['Alt + press a point · drag a handle', 'Smooth / corner · bend the line (Alt: one handle alone)'], ['Double-click the line', 'A point there, the curve kept as it was'], ['Inspector', 'Start and end caps (arrow, dot…), color, width, dash, closed; Trim Paths on the timeline']]],
  ['Time', [['Space', 'Play / pause'], ['Page Up / Down', 'A frame back / on (Shift: ten frames)'], [', / . · Ctrl + ← →', 'A frame back / on'], ['← →', 'The slide before / after (a layer picked: nudges it)'], ['J / K', 'The keyframe before / after'], ['B / N', 'The work area starts / ends now (the loop plays it)'], ['[ / ]', 'The layers start / end now (Alt: trimmed there)'], ['F9 · Ctrl + Alt + H', 'Easy ease · hold, on the keyframes picked'], ['Home / End', 'The start / the end']]],
  ['Timeline (pointer over it)', [['U', 'Show every property with a keyframe (of the layers picked, else of all); again: fold them'], ['U U', 'Show every property that is changed too'], ['P · S · R · T · E', 'Show Position, Size, Rotation, Opacity, Effects (Shift: add to what is shown)'], ['Drag a bar · its ends', 'Move a layer in time · trim it ([ ] and Alt + [ ] do it at the playhead)'], ['Drag the ends of an element of the slides', 'Trim it: it is not seen before / after']]],
  ['Comments', [['C', 'The Comment tool: click on the picture to put a pin there, write in the inspector (a pin is only in the editor, never in the video)'], ['Click a pin · drag it', 'Pick it (the playhead does not move) · move it'], ['Right-click a pin', 'Delete · go to its second · mark it done'], ['Delete', 'The pin picked (the cursor not in a field) · or the inspector\'s red button']]],
  ['View', [['Wheel', 'Zoom around the pointer'], ['Space + drag, middle button, H', 'Pan'], ['Ctrl + 0 / + / −', 'Fit / zoom'], ['Ctrl or Alt + wheel on the timeline', 'Zoom the time']]],
];

// What is picked (the user, 2026-10-26: "multiselection"): one thing ({type: 'layer', id} | {type: 'asset', frame, key, name}), or several: the one pressed last
// with all of them in `group` (the inspector and the motion path are the one pressed last's; a move, a nudge, Delete, Copy… are all of them's).
const itemsOf = sel => (!sel || sel.type === 'look' || sel.type === 'comment' ? NONE : sel.group ?? [sel]); // (a comment, {type: 'comment', id}, is picked alone: it is not a layer or an element of the slides)
const plainOf = q => (q.type === 'layer' ? {type: 'layer', id: q.id} : {type: 'asset', frame: q.frame, key: q.key, name: q.name ?? ''});
const sameItem = (a, b) => a.type === b.type && (a.type === 'layer' ? a.id === b.id : a.frame === b.frame && a.key === b.key);
const hasItem = (list, q) => list.some(x => sameItem(x, q));
function groupOf(items, primary = null) {
  if (!items.length) return null;
  if (items.length === 1) return plainOf(items[0]);
  const p = primary && hasItem(items, primary) ? primary : items.at(-1);
  return {...plainOf(p), group: items.map(plainOf)};
}
const layerIdsOf = sel => itemsOf(sel).filter(q => q.type === 'layer').map(q => q.id);
const pathOf = q => (q?.type === 'asset' && q.key.includes('/') ? q.key.slice(q.key.indexOf('/')) : '');
// keyframes picked on the timeline: {id, t, props} (props: a row of the twirl's, null: the whole keyframe, the layer's own row)
const propsKey = p => (p ? p.join() : '*');
const sameKey = (a, b) => a.id === b.id && Math.abs(a.t - b.t) < 1 / 60 && propsKey(a.props) === propsKey(b.props);
const byLayer = list => { const m = new Map(); for (const k of list) m.set(k.id, [...(m.get(k.id) ?? []), k]); return m; };
// boxes (stage px): a turned layer's box round it, the box round several, two that touch
function boundsOf(v) {
  const r = v.rotation * Math.PI / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r)), w = v.w * c + v.h * s, h = v.w * s + v.h * c;
  return {x: v.x + v.w / 2 - w / 2, y: v.y + v.h / 2 - h / 2, w, h};
}
function unionOf(boxes) {
  if (!boxes.length) return null;
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
  return {x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y};
}
const touches = (a, b) => a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
const rectOf = (a, b) => ({left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y)});
// a line of points [[x, y], ...]: how long it is, how far a point {x, y} is from it
const lineLength = pts => pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0);
function distToLine(pts, p) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy, u = len2 > 1e-9 ? Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(p.x - (ax + dx * u), p.y - (ay + dy * u)));
  }
  return best;
}
// the four corners of a box on the screen, turned by `r` degrees round its middle
function cornersOf(b) {
  const r = b.r * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [cx + (u * b.w * c - v * b.h * s) / 2, cy + (u * b.w * s + v * b.h * c) / 2]);
}
// The magnet: a box moved by the nearest line to one of its sides or its middle, on each axis (within `tol`) -> {dx, dy, x: [line], y: [line]}
function snapBox(b, xs, ys, tol) {
  const best = (edges, lines) => { let got = null; for (const e of edges) for (const c of lines) { const d = c - e; if (Math.abs(d) <= tol && (!got || Math.abs(d) < Math.abs(got.d))) got = {d, c}; } return got; };
  const gx = best([b.x, b.x + b.w / 2, b.x + b.w], xs), gy = best([b.y, b.y + b.h / 2, b.y + b.h], ys);
  return {dx: gx?.d ?? 0, dy: gy?.d ?? 0, x: gx ? [gx.c] : [], y: gy ? [gy.c] : []};
}
// The right-click menu's list: no separator first, last or twice
function tidy(list) {
  const out = [];
  for (const it of list) if (it !== '-' || (out.length && out.at(-1) !== '-')) out.push(it);
  while (out.at(-1) === '-') out.pop();
  return out;
}

// The layers copied (Ctrl+C / X): kept for this page and in this browser, so another video, another board or a reload pastes them (Ctrl+V)
const CLIP = 'storyboard:ve-clip';
let clipboard = null;
function readClip() {
  let kept = null;
  try { kept = JSON.parse(localStorage.getItem(CLIP) || 'null'); } catch {}
  const got = [clipboard, kept].filter(c => Array.isArray(c?.layers) && c.layers.length).sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  return got[0] ?? null;
}
function writeClip(layers) {
  clipboard = {layers: JSON.parse(JSON.stringify(layers)), at: Date.now()};
  try { localStorage.setItem(CLIP, JSON.stringify(clipboard)); } catch {} // (a big picture kept as data: this page still has it)
}

// Runs of the same value one after the other: [{from, to, value}] (indexes of the played slides).
function runsOf(n, valueAt0) {
  const out = [];
  for (let i = 0; i < n; i++) { const v = valueAt0(i), last = out.at(-1); if (last && last.value === v) last.to = i; else out.push({from: i, to: i, value: v}); }
  return out;
}
// A box drawn from p0 to p1 (stage px; Shift: a square / a circle)
function boxOf(p0, p1, square) {
  let w = p1.x - p0.x, h = p1.y - p0.y;
  if (square) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * s; h = Math.sign(h || 1) * s; }
  return {x: Math.min(p0.x, p0.x + w), y: Math.min(p0.y, p0.y + h), w: Math.abs(w), h: Math.abs(h)};
}
// A layer resized by one of its handles (`h`: n, ne, e, se, s, sw, w, nw), in its own axes (it may be turned); `keep`: its proportions
function resized(base, h, dx, dy, keep) {
  const r = base.rotation * Math.PI / 180, cos = Math.cos(r), sin = Math.sin(r);
  const lx = dx * cos + dy * sin, ly = -dx * sin + dy * cos, e = h.includes('e') ? 1 : h.includes('w') ? -1 : 0, s = h.includes('s') ? 1 : h.includes('n') ? -1 : 0;
  let w = Math.max(1, base.w + e * lx), hh = Math.max(1, base.h + s * ly);
  if (keep) { const k = e && s ? Math.max(w / base.w, hh / base.h) : e ? w / base.w : hh / base.h; w = base.w * k; hh = base.h * k; }
  const cxl = (e || (keep && s) ? e : 0) * (w - base.w) / 2, cyl = (s || (keep && e) ? s : 0) * (hh - base.h) / 2; // (the middle moves by half of what the side moved)
  const cx = base.x + base.w / 2 + cxl * cos - cyl * sin, cy = base.y + base.h / 2 + cxl * sin + cyl * cos;
  return {...base, w, h: hh, x: cx - w / 2, y: cy - hh / 2};
}
// Several layers scaled by a handle of the box round them (`b`), from the side or corner across (Shift: their proportions): each one's place and size
function scaledGroup(list, b, h, dx, dy, keep) {
  const ex = h.includes('e') ? 1 : h.includes('w') ? -1 : 0, ey = h.includes('s') ? 1 : h.includes('n') ? -1 : 0;
  let fx = ex ? Math.max(0.02, (b.w + ex * dx) / Math.max(1, b.w)) : 1, fy = ey ? Math.max(0.02, (b.h + ey * dy) / Math.max(1, b.h)) : 1;
  if (keep) { const k = ex && ey ? Math.max(fx, fy) : ex ? fx : fy; fx = fy = k; }
  const ax = ex > 0 ? b.x : ex < 0 ? b.x + b.w : b.x + b.w / 2, ay = ey > 0 ? b.y : ey < 0 ? b.y + b.h : b.y + b.h / 2;
  return new Map(list.map(({id, base: v}) => {
    const w = v.w * fx, hh = v.h * fy, cx = ax + (v.x + v.w / 2 - ax) * fx, cy = ay + (v.y + v.h / 2 - ay) * fy;
    return [id, {...v, w, h: hh, x: cx - w / 2, y: cy - hh / 2}];
  }));
}

// A number of the timeline (After Effects' blue values): drag it sideways to change it (Shift: ten times faster), click to type it.
function Scrub({value, onChange, onDone, step = 1, digits = 0, unit = '', title}) {
  const [typing, setTyping] = useState(false), drag = useRef(null);
  const shown = Number.isFinite(value) ? value.toFixed(digits) : '–';
  if (typing) return <input className="sb-ve-scrub-in" defaultValue={shown} autoFocus onFocus={e => e.target.select()} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.target.value = shown; e.target.blur(); } }} onBlur={e => { const n = parseFloat(e.target.value); setTyping(false); if (Number.isFinite(n) && n.toFixed(digits) !== shown) { onChange(n); onDone?.(); } }}/>;
  return <span className="sb-ve-scrub" title={title} onPointerDown={e => { if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = {x: e.clientX, v: value, moved: false}; }}
    onPointerMove={e => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x; if (!d.moved && Math.abs(dx) < 2) return; d.moved = true; onChange(d.v + dx * step * (e.shiftKey ? 10 : 1)); }}
    onPointerUp={() => { const d = drag.current; drag.current = null; if (!d) return; if (d.moved) onDone?.(); else setTyping(true); }}>{shown}{unit}</span>;
}

// The motion path's line from what `track` measured: its parts where the element is on the picture (a gap, or a jump in time, ends one), the points where it is held only once.
const linesOf = pts => {
  const out = [];
  let cur = null, last = -1;
  for (const p of pts) {
    if (p.gap || p.t - last > 0.6) cur = null;
    last = p.t;
    if (p.gap) continue;
    if (!cur) out.push(cur = []);
    const q = cur.at(-1);
    if (!q || Math.abs(q[0] - p.x) + Math.abs(q[1] - p.y) > 0.5) cur.push([p.x, p.y]);
  }
  return out;
};
const pathD = lines => lines.filter(l => l.length > 1).map(l => `M${l.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')}`).join('');
// It never moves: its points and its line all within 2 px of one another
const stillOf = (pts, lines) => { const all = [...pts.map(q => [q.x, q.y]), ...lines.flat()]; if (!all.length) return false; const xs = all.map(q => q[0]), ys = all.map(q => q[1]); return Math.max(...xs) - Math.min(...xs) < 2 && Math.max(...ys) - Math.min(...ys) < 2; };

export default function StoryboardVideoEditor({board, player, startAt = 0, layers = NONE, spans = NO_SPANS, comments = NONE, commentOps, selection = null, onSelection, onTime, layerOps, assetOps, onAddImage, actions, guides = false, onGuides, onClose, onReveal, onUndo, onRedo, canUndo, canRedo}) {
  const api = useRef(null), rootEl = useRef(null), viewEl = useRef(null), compEl = useRef(null), gizmo = useRef(null), marksEl = useRef(null), hoverEl = useRef(null), boxEl = useRef(null), snapEl = useRef(null);
  const headEl = useRef(null), knobEl = useRef(null), timeEl = useRef(null), slideEl = useRef(null), scroller = useRef(null), tlIn = useRef(null), tboxEl = useRef(null), dropEl = useRef(null), fileEl = useRef(null);
  const clipEls = useRef([]), shown = useRef(-1), anchor = useRef(null), drag = useRef(null), ghost = useRef(new Map()), spaceHeld = useRef(null), timeRef = useRef(startAt), told = useRef(0), pasteWait = useRef(0);
  const [script, setScript] = useState(null), [playing, setPlaying] = useState(false), [zoom, setZoom] = useState(1), [width, setWidth] = useState(800);
  // the picture's place and zoom: `viewRef` is where it is (the picture and the boxes over it follow it at once), `view` what React draws with, a moment after (the zoom menu, the path's squares)
  const viewRef = useRef({x: 0, y: 0, z: 0.5, fit: true}), [view, setViewNow] = useState(viewRef.current), viewLater = useRef(0), viewMotion = useRef(0), glide = useRef(null);
  const [tool, setTool] = useState('select'), toolRef = useRef(tool); toolRef.current = tool;
  const [now, setNow] = useState(startAt), [reveal, setReveal] = useState(() => new Map()), [keySel, setKeySel] = useState(NONE), [drawBox, setDrawBox] = useState(null), [draft, setDraftNow] = useState(null), [naming, setNaming] = useState(null);
  const [snapOn, setSnapOn] = useState(true), [loop, setLoop] = useState(false), [work, setWork] = useState(null), [speed, setSpeed] = useState(1), [menu, setMenu] = useState(null), [help, setHelp] = useState(false), [typingTime, setTypingTime] = useState(false);
  const snapRef = useRef(snapOn); snapRef.current = snapOn;
  const pathEd = useRef(null); // (the Pen and the points of the path picked: components/StoryboardPathEditor.jsx)
  const keySelRef = useRef(keySel); keySelRef.current = keySel;
  const menuRef = useRef(menu); menuRef.current = menu;
  const draftRef = useRef(null), setDraft = d => { draftRef.current = d; setDraftNow(d); }; // (what a drag on the timeline has made, layer id -> the layer, kept when it is let go)
  const [spanDraft, setSpanDraftNow] = useState(null), spanDraftRef = useRef(null), setSpanDraft = d => { spanDraftRef.current = d; setSpanDraftNow(d); }; // (an element of the slides being trimmed: {name, from, to})
  const hoverTl = useRef(false), lastU = useRef(0); // (the pointer is over the timeline: P S R T E show properties there; the time U was pressed last)
  const {title, lines = [], placed = {}, edits} = player;
  const timeline = script?.timeline ?? null, played = script?.played ?? NONE, total = timeline?.total ?? 0;
  const pps = total ? (width / total) * zoom : 0; // timeline px a second
  const layersRef = useRef(layers); layersRef.current = layers;
  const selRef = useRef(selection); selRef.current = selection;
  const pinsEl = useRef(null), commentsRef = useRef(comments); commentsRef.current = comments; // (the comments' pins over the viewer, and the comments as they are now)
  const geo = useRef({}); geo.current = {pps, timeline, played, total, playing};
  const rowOfSelRef = useRef(null), slideRowsRef = useRef(NONE), rowsKept = useRef(null); // (the row of an element picked, the rows of the slides: set below, read by the selection boxes)
  const revealRef = useRef(onReveal); revealRef.current = onReveal;
  const layerOf = id => layersRef.current.find(l => l.id === id) ?? null;
  const pickNone = () => { onSelection(null); api.current?.select(); }; // (nothing picked: the video itself, in the inspector)
  useEffect(() => { try { if (localStorage.getItem('storyboard:ve-snap') === '0') setSnapOn(false); } catch {} }, []);
  const toggleSnap = () => setSnapOn(on => { try { localStorage.setItem('storyboard:ve-snap', on ? '0' : '1'); } catch {} return !on; });

  // ---- what is picked, on the picture: a box with handles (a layer: move, resize, turn; an element of a slide: move, resize); several: each one outlined and the
  // box round them all (its handles scale them when they are all layers). Drawn each picture, with no React drawing. ----
  const assetElOf = q => { // (an element of the slides on whichever slide shows it now: by its row)
    const row = rowOfSelRef.current?.(q), path = pathOf(q);
    return (row ? api.current?.elementIn(new Map([...row.at].map(([i, key]) => [geo.current.played[i]?.id, key + path]))) : null) ?? api.current?.assetEl(q.frame, q.key) ?? null;
  };
  const valuesNow = (l, t) => ghost.current.get(l.id) ?? (isShownAt(l, t) ? valuesAt(l, t) : null);
  const screenBoxOf = (q, t) => { // (px over the viewer; a layer turned with it: {x, y, w, h, r, layer}; an element: {x, y, w, h, r: 0, el}; null where it is not on the picture)
    const v = viewRef.current;
    if (q.type === 'layer') { const l = layerOf(q.id), val = l && valuesNow(l, t); return val ? {x: v.x + val.x * v.z, y: v.y + val.y * v.z, w: val.w * v.z, h: val.h * v.z, r: val.rotation, layer: l} : null; }
    const el = assetElOf(q), vr = viewEl.current?.getBoundingClientRect();
    if (!el || !vr) return null;
    const r = el.getBoundingClientRect();
    return r.width || r.height ? {x: r.left - vr.left, y: r.top - vr.top, w: r.width, h: r.height, r: 0, el} : null;
  };
  const stageBoxOf = (q, t) => { // (the box round it on the picture, stage px: aligning, snapping)
    if (q.type === 'layer') { const l = layerOf(q.id), val = l && valuesNow(l, t); return val ? boundsOf(val) : null; }
    const b = screenBoxOf(q, t), v = viewRef.current;
    return b ? {x: (b.x - v.x) / v.z, y: (b.y - v.y) / v.z, w: b.w / v.z, h: b.h / v.z} : null;
  };
  const hereOf = q => { // (an element of the slides as the slide held now has it: the same element there; its place is that slide's)
    if (q.type !== 'asset') return q;
    const tl = geo.current.timeline, i = tl ? locate(tl, timeRef.current)?.index ?? -1 : -1, root = rowOfSelRef.current?.(q)?.at.get(i), frame = geo.current.played[i];
    return root != null && frame ? {...q, frame: frame.id, key: root + pathOf(q)} : q;
  };
  const outlineAll = boxes => { // (dashed boxes over the picture: the others picked, or what a rectangle being drawn picks)
    const m = marksEl.current;
    if (!m) return;
    while (m.children.length < boxes.length) m.appendChild(document.createElement('i'));
    [...m.children].forEach((el, n) => {
      const b = boxes[n];
      el.style.display = b ? '' : 'none';
      if (b) { el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.r}deg)`; el.style.width = `${b.w}px`; el.style.height = `${b.h}px`; }
    });
  };
  const placeGizmo = useCallback(() => {
    const g = gizmo.current, t = timeRef.current, items = itemsOf(selRef.current);
    if (!g) return;
    const boxes = items.map(q => ({q, b: screenBoxOf(q, t)})).filter(x => x.b);
    if (drag.current?.type !== 'marquee') outlineAll(items.length > 1 ? boxes.map(x => x.b) : NONE);
    let box = null;
    if (items.length > 1 && boxes.length) {
      const pts = boxes.flatMap(x => cornersOf(x.b)), xs = pts.map(c => c[0]), ys = pts.map(c => c[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
      box = {x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0, r: 0, handles: boxes.length === items.length && boxes.every(x => x.b.layer && !x.b.layer.locked), noTurn: true, name: `${items.length} picked`};
    } else if (boxes.length === 1) {
      const {q, b} = boxes[0];
      if (b.layer) box = {...b, handles: !b.layer.locked, name: b.layer.name};
      else { const kind = resizeKind(b.el); box = {...b, handles: !kind.bubble, corners: !kind.free, noTurn: true, name: q.name ?? ''}; } // (a UI element only by its corners: it keeps its proportions)
    }
    if (!box) { g.style.display = 'none'; return; }
    g.style.display = '';
    g.style.transform = `translate(${box.x}px, ${box.y}px) rotate(${box.r}deg)`;
    g.style.width = `${box.w}px`; g.style.height = `${box.h}px`;
    g.classList.toggle('has-handles', !!box.handles);
    g.classList.toggle('is-corners', !!box.corners);
    g.classList.toggle('no-turn', !!box.noTurn);
    g.classList.toggle('is-group', items.length > 1);
    g.dataset.name = box.name;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const drawGhost = (id, values) => { // (a drag on the picture is shown at once and kept when it is let go: one step of Undo)
    ghost.current.set(id, values);
    const el = api.current?.layersRoot()?.querySelector(`[data-vlayer="${CSS.escape(id)}"]`);
    if (el) { el.style.display = ''; el.style.width = `${values.w}px`; el.style.height = `${values.h}px`; el.style.transform = `translate(${values.x}px, ${values.y}px) rotate(${values.rotation}deg)`; el.style.opacity = String(values.opacity); }
  };
  const previewLayer = (id, values) => { drawGhost(id, values); placeGizmo(); };
  const hideHover = () => { if (hoverEl.current) hoverEl.current.style.display = 'none'; };
  // ---- the comments' pins: over the viewer in screen px, so they keep their size when the picture is zoomed (the tip of a pin is on its point). Placed at once (zoom, pan, the time),
  // with no React drawing: shown from the comment's second to COMMENT_SHOW.after seconds after it; the one picked is always shown (faded where its time is not now); one marked done never is ----
  const placePins = useCallback(() => {
    const root = pinsEl.current;
    if (!root) return;
    const v = viewRef.current, t = timeRef.current, d = drag.current, sel = selRef.current;
    for (const el of root.children) {
      const c = commentsRef.current.find(x => x.id === el.dataset.id);
      if (!c) { el.style.display = 'none'; continue; }
      const on = isCommentShown(c, t), mine = !c.done && sel?.type === 'comment' && sel.id === c.id;
      el.style.display = on || mine ? '' : 'none';
      el.classList.toggle('is-late', mine && !on);
      const at = d?.type === 'pin' && d.id === c.id && d.to ? d.to : c, key = `${v.x}|${v.y}|${v.z}|${at.x}|${at.y}`;
      if (el.__key !== key) { el.__key = key; el.style.transform = `translate(${v.x + at.x * v.z}px, ${v.y + at.y * v.z}px)`; }
    }
  }, []);

  // ---- the viewer: the video's 1600 x 900 picture, zoomed and panned. Moved at once, without drawing the editor again (the user, 2026-10-26: "much more smoother");
  // while it moves it is lifted onto a layer of its own (drawn sharp again when it stops) ----
  const setView = useCallback((v, draw = false) => {
    viewRef.current = v;
    const c = compEl.current;
    if (c) c.style.transform = viewCss(v);
    hideHover();
    placeGizmo();
    placePins();
    clearTimeout(viewLater.current);
    if (draw) { c?.classList.remove('is-moving'); setViewNow(v); return; }
    c?.classList.add('is-moving');
    viewLater.current = setTimeout(() => { compEl.current?.classList.remove('is-moving'); setViewNow(viewRef.current); }, 120);
  }, [placeGizmo]); // eslint-disable-line react-hooks/exhaustive-deps
  const stopViewMotion = () => { cancelAnimationFrame(viewMotion.current); glide.current = null; };
  const animateView = useCallback(to => { // (Fit, the zoom menu, Ctrl + / − / 0: eased there in a fifth of a second)
    stopViewMotion();
    const from = viewRef.current, t0 = performance.now();
    const step = at => {
      const u = Math.min(1, (at - t0) / 200), e = 1 - (1 - u) ** 3;
      if (u >= 1) { setView(to, true); return; }
      setView({x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, z: from.z * (to.z / from.z) ** e, fit: false});
      viewMotion.current = requestAnimationFrame(step);
    };
    viewMotion.current = requestAnimationFrame(step);
  }, [setView]); // eslint-disable-line react-hooks/exhaustive-deps
  const fitTarget = () => { const el = viewEl.current, W = el.clientWidth, H = el.clientHeight, z = Math.max(0.05, Math.min((W - 48) / STAGE_W, (H - 48) / STAGE_H)); return {x: (W - STAGE_W * z) / 2, y: (H - STAGE_H * z) / 2, z, fit: true}; };
  const fitView = useCallback((smooth = false) => {
    if (!viewEl.current) return;
    if (smooth) animateView(fitTarget()); else { stopViewMotion(); setView(fitTarget(), true); }
  }, [setView, animateView]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = viewEl.current;
    if (!el) return undefined;
    const watch = new ResizeObserver(() => { if (viewRef.current.fit) fitView(); });
    watch.observe(el);
    fitView();
    return () => watch.disconnect();
  }, [fitView]);
  // zoomed around a point of the viewer (px; its middle by default): at once, or gliding there (`smooth`: a mouse's wheel, a notch at a time, a little of the way each picture)
  const zoomAt = useCallback((z, px, py, smooth = false) => {
    const el = viewEl.current;
    if (!el) return;
    const x = px ?? el.clientWidth / 2, y = py ?? el.clientHeight / 2, to = Math.max(0.05, Math.min(8, z));
    if (!smooth) { stopViewMotion(); const v = viewRef.current; setView({x: x - (x - v.x) * to / v.z, y: y - (y - v.y) * to / v.z, z: to, fit: false}); return; }
    if (glide.current) { Object.assign(glide.current, {z: to, x, y}); return; }
    cancelAnimationFrame(viewMotion.current);
    glide.current = {z: to, x, y};
    const step = () => {
      const g = glide.current;
      if (!g) return;
      const v = viewRef.current, done = Math.abs(Math.log(g.z / v.z)) < 0.004, k = done ? g.z : Math.exp(Math.log(v.z) + Math.log(g.z / v.z) * 0.32);
      setView({x: g.x - (g.x - v.x) * k / v.z, y: g.y - (g.y - v.y) * k / v.z, z: k, fit: false});
      if (done) { glide.current = null; return; }
      viewMotion.current = requestAnimationFrame(step);
    };
    viewMotion.current = requestAnimationFrame(step);
  }, [setView]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // the wheel zooms the picture around the pointer (After Effects); Shift + wheel pans it sideways
    const el = viewEl.current;
    if (!el) return undefined;
    const wheel = e => {
      if (e.target.closest?.('.sb-ve-help')) return;
      e.preventDefault();
      const r = el.getBoundingClientRect(), v = viewRef.current;
      if (e.shiftKey && !e.ctrlKey) { stopViewMotion(); setView({...v, x: v.x - (e.deltaY || e.deltaX), fit: false}); return; }
      const lines = e.deltaMode === 1, notch = lines || (!e.ctrlKey && Math.abs(e.deltaY) >= 40); // (a mouse's notch glides; a trackpad's pinch or swipe follows the fingers)
      zoomAt((glide.current?.z ?? v.z) * Math.exp(-e.deltaY * (lines ? 0.06 : e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left, e.clientY - r.top, notch);
    };
    el.addEventListener('wheel', wheel, {passive: false});
    return () => el.removeEventListener('wheel', wheel);
  }, [zoomAt, setView]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { clearTimeout(viewLater.current); cancelAnimationFrame(viewMotion.current); clearTimeout(pasteWait.current); clearTimeout(told.wait); cancelAnimationFrame(told.raf); }, []);
  const toStage = e => { const r = viewEl.current.getBoundingClientRect(), v = viewRef.current; return {x: (e.clientX - r.left - v.x) / v.z, y: (e.clientY - r.top - v.y) / v.z}; };

  // ---- the time, each picture: the playhead, the clock, the slide on, the selection box (no React drawing for it) ----
  const label = useCallback(i => { const frame = geo.current.played[i]; return frame ? `${lines.find(l => l.id === frame.chapter)?.title ?? ''} · ${placed[frame.id]?.index ?? ''}` : ''; }, [lines, placed]);
  const onClock = useCallback((t, isPlaying) => {
    const {pps: k, timeline: tl, total: all} = geo.current;
    timeRef.current = t;
    if (headEl.current) headEl.current.style.transform = `translateX(${t * k}px)`;
    if (knobEl.current) knobEl.current.style.transform = `translateX(${t * k}px)`;
    if (timeEl.current) timeEl.current.textContent = `${tcf(t)} / ${tcf(all)}`;
    const at = tl ? locate(tl, t) : null, i = at ? at.index : -1;
    if (i !== shown.current) {
      clipEls.current[shown.current]?.classList.remove('is-on');
      clipEls.current[i]?.classList.add('is-on');
      shown.current = i;
      if (slideEl.current) slideEl.current.textContent = label(i);
    }
    if (isPlaying !== geo.current.playing) setPlaying(isPlaying);
    placePins();
    if (!PREVIEWS.has(drag.current?.type)) { ghost.current.clear(); placeGizmo(); }
    const el = scroller.current, x = t * k;
    if (isPlaying && el && (x < el.scrollLeft || x > el.scrollLeft + el.clientWidth - LEFT - 60)) el.scrollLeft = Math.max(0, x - 40); // (playing: the playhead stays in view)
    if (!isPlaying && Math.abs(t - told.current) > 1e-4) { // (held: the inspector and the values of the timeline follow; not each picture while it plays, a few times a second while it is scrubbed)
      told.current = t;
      const tell = () => { setNow(timeRef.current); onTime?.(timeRef.current); };
      if (drag.current?.type === 'scrub') { if (!told.wait) told.wait = setTimeout(() => { told.wait = 0; tell(); }, 80); }
      else { cancelAnimationFrame(told.raf); told.raf = requestAnimationFrame(tell); }
    }
  }, [label, placeGizmo, placePins, onTime]);
  useLayoutEffect(() => { placePins(); }, [comments, selection, placePins]); // (a comment placed, moved, written or picked: its pin there before the picture is painted)
  useEffect(() => { shown.current = -1; const t = api.current?.time(); if (t != null) onClock(t, api.current.playing()); }, [script, pps, onClock]); // (drawn again: put back on)
  useEffect(() => { api.current?.select(); onTime?.(startAt); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.current?.setRate?.(speed); }, [speed, script]);
  useEffect(() => { api.current?.setLoop?.(loop ? work ?? {from: 0, to: total} : null); }, [loop, work, total, script]);
  const [guideLines, setGuideLines] = useState(null); // (the guide lines of the slide on: measured while the video is held)
  useEffect(() => {
    if (!guides || playing) { setGuideLines(null); return undefined; }
    const id = requestAnimationFrame(() => { const got = api.current?.guides?.() ?? null; setGuideLines(was => (JSON.stringify(was) === JSON.stringify(got) ? was : got)); }); // (the same lines: not drawn again)
    return () => cancelAnimationFrame(id);
  }, [guides, playing, now, script, edits, layers]);
  // The video itself is not drawn again for a change of the editor's (a drag on the timeline, a pick, the time held): only when it is handed something new
  const playerEl = useMemo(() => <StoryboardPlayer editor api={api} startAt={startAt} onClock={onClock} onScript={setScript} {...player}/>, [player, startAt, onClock]);

  const seekTo = useCallback(seconds => api.current?.seek(Math.max(0, Math.min(geo.current.total, seconds))), []);
  const slideAt = useCallback(dir => {
    const {timeline: tl, total: all} = geo.current, t = api.current?.time() ?? 0;
    if (!tl) return;
    const at = locate(tl, t), i = at ? at.index : 0, here = settledAt(tl, i);
    const to = dir < 0 ? (t > here + 0.05 ? i : i - 1) : i + 1;
    if (to < 0) seekTo(0); else if (to >= tl.items.length) seekTo(all); else seekTo(settledAt(tl, to));
  }, [seekTo]);
  const stepFrames = n => { api.current?.stop(); seekTo((Math.round((api.current?.time() ?? 0) / FRAME_S) + n) * FRAME_S); };
  const setWorkEdge = edge => { // B / N: the work area starts / ends now (the loop plays it)
    const t = timeRef.current, all = geo.current.total;
    setWork(w => {
      const cur = w ?? {from: 0, to: all}, next = edge === 'from' ? {from: t, to: cur.to > t + 0.1 ? cur.to : all} : {from: cur.from < t - 0.1 ? cur.from : 0, to: t};
      return next.to - next.from >= 0.1 ? next : null;
    });
  };
  // from now to the end of the line it is in: when a new layer is on screen
  const spanAt = t => {
    const {timeline: tl, played: list, total: all} = geo.current;
    if (!tl || !list.length) return {from: 0, to: 5};
    const i = locate(tl, t)?.index ?? 0;
    let j = i;
    while (j + 1 < list.length && list[j + 1].chapter === list[i].chapter) j++;
    const end = tl.items[j + 1]?.start ?? all, from = Math.round(t * 100) / 100;
    return {from, to: end - from >= 0.5 ? end : Math.min(all, from + 3)};
  };

  // ---- new layers ----
  const addLayer = layer => { const id = layerOps.add({...spanAt(timeRef.current), ...layer}); if (id) onSelection({type: 'layer', id}); setTool('select'); return id; };
  // A purple line of the software pressed (the user, 2026-10-28: "make everything in video editor selectable even these purple lines, make them as a path that I can change the ends of"): it becomes
  // paths of the video. The line is measured on the picture when its slide is all there (the video goes there first if it was held while the slide moved in), each trail of it (the pieces that meet
  // are one path) is a path layer from when the slide is in to the end of the line (the chapter) it is in, and the software's lines are not seen while the paths are on (`replaces`); Delete takes
  // the paths off and gives them back. The rating's connector that the video draws out of the mission keeps that drawing: its paths are trimmed in (Trim Paths keyframes), the mission first.
  // One step of Undo; the path nearest the press is the one picked.
  const convertConnector = (hit, p) => {
    const DRAW = {start: 0.15, dur: 1.5}; // (seconds after the slide is in; components/storyboardPlayerDom.js PEER_DRAW)
    const tl = geo.current.timeline, list = geo.current.played;
    if (!tl) return;
    const here = locate(tl, timeRef.current)?.index ?? 0;
    let i = -1;
    list.forEach((f, k) => { if (f.id === hit.frame && (i < 0 || Math.abs(k - here) < Math.abs(i - here))) i = k; });
    if (i < 0) return;
    const make = () => {
      const got = api.current?.connector(hit.frame, hit.names);
      if (!got) return;
      let j = i;
      while (j + 1 < list.length && list[j + 1].chapter === list[i].chapter) j++;
      const item = tl.items[i], from = Math.round((item.start + (item.move || 0)) * 100) / 100, to = tl.items[j + 1]?.start ?? geo.current.total;
      const made = got.paths.map(path => ({path, frame: frameFromStage(path.pts.map(([x, y]) => ({x, y})), path.closed)})).filter(x => x.frame);
      if (!made.length) return;
      const drawn = script?.info?.get(hit.frame)?.peerFlow === 'draw', lens = made.map(x => lineLength(x.path.pts)), sum = lens.reduce((a, b) => a + b, 0) || 1;
      const order = made.map((_, n) => n).sort((a, b) => (a === 0 ? -1e9 : made[a].path.pts.at(-1)[1]) - (b === 0 ? -1e9 : made[b].path.pts.at(-1)[1])); // (the first trail, then the rest from the top)
      const starts = new Map();
      let at = 0;
      for (const n of order) { starts.set(n, [from + DRAW.start + DRAW.dur * at / sum, from + DRAW.start + DRAW.dur * (at + lens[n]) / sum]); at += lens[n]; }
      const specs = made.map(({path, frame}, n) => ({
        kind: 'path', name: made.length > 1 ? `Connector ${n + 1}` : 'Connector', from, to, ...frame, closed: path.closed, stroke: got.stroke, strokeWidth: got.strokeWidth, endCap: got.endCap, replaces: path.ids,
        ...(drawn ? {keys: [{t: Math.round(starts.get(n)[0] * 1000) / 1000, trimEnd: 0, ease: 'linear'}, {t: Math.round(starts.get(n)[1] * 1000) / 1000, trimEnd: 1}]} : {}),
      }));
      const ids = layerOps.addMany(specs);
      if (!ids.length) return;
      let near = 0, nearest = Infinity;
      made.forEach((x, n) => { const d = distToLine(x.path.pts, p); if (d < nearest) { nearest = d; near = n; } });
      onSelection({type: 'layer', id: ids[near] ?? ids[0]});
    };
    const at = locate(tl, timeRef.current);
    if (at?.moving || timeRef.current < tl.items[i].settle - 1e-3 || at?.index !== i) { // (not all there: the video goes to where the slide is, and the line is measured there)
      api.current?.stop(); seekTo(settledAt(tl, i));
      requestAnimationFrame(() => requestAnimationFrame(make));
    } else make();
  };
  const editText = useCallback(id => {
    const el = api.current?.layersRoot()?.querySelector(`[data-vlayer="${CSS.escape(id)}"]`), l = layerOf(id);
    if (!el || !l) return;
    const original = l.text ?? '';
    el.contentEditable = 'plaintext-only'; el.style.pointerEvents = 'auto';
    el.focus();
    const range = document.createRange(); range.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    if (gizmo.current) gizmo.current.style.visibility = 'hidden';
    const end = keep => {
      el.removeEventListener('blur', blur); el.removeEventListener('keydown', key);
      const text = el.textContent;
      el.removeAttribute('contenteditable'); el.style.pointerEvents = '';
      if (gizmo.current) gizmo.current.style.visibility = '';
      if (keep && text !== original) layerOps.change(id, {text}); else el.textContent = original;
    };
    const blur = () => end(true);
    const key = e => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); end(false); } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); el.blur(); } };
    el.addEventListener('blur', blur); el.addEventListener('keydown', key);
  }, [layerOps]); // eslint-disable-line react-hooks/exhaustive-deps
  const addText = p => { const d = LAYER_DEFAULTS.text, id = addLayer({kind: 'text', x: p.x, y: p.y - d.size * 0.6}); if (id) setTimeout(() => editText(id), 150); }; // (once the layer is drawn)
  // A comment placed (the user, 2026-10-29): a pin at the click, at the second the playhead is on (a click outside the picture puts none); it is picked at once and the inspector's words field
  // takes the keyboard. Pressing, moving and deleting a pin: `onPinDown`, `onViewMove` / `onViewUp` (type 'pin'), `commentMenu`, `removeComment`
  const addComment = p => {
    if (!commentOps || p.x < 0 || p.y < 0 || p.x > STAGE_W || p.y > STAGE_H) return;
    const id = commentOps.add({x: p.x, y: p.y, at: Math.round(timeRef.current * 100) / 100, text: ''});
    if (!id) return;
    onSelection({type: 'comment', id}); setTool('select');
    setTimeout(focusComment, 150); // (once the inspector is drawn)
  };
  const addImages = files => { const v = viewRef.current, el = viewEl.current; for (const file of files) onAddImage?.(file, {...spanAt(timeRef.current), cx: el ? (el.clientWidth / 2 - v.x) / v.z : STAGE_W / 2, cy: el ? (el.clientHeight / 2 - v.y) / v.z : STAGE_H / 2}); };

  // ---- what is done to all that is picked (the keys, the right-click menu, the sidebar: `actions`) ----
  const shiftAll = (moves, merge = `shift:${performance.now()}`) => { // (layers and elements of the slides moved, each by its own dx dy, stage px: one step of Undo)
    const t = timeRef.current, live = moves.filter(m => Math.abs(m.dx) > 0.01 || Math.abs(m.dy) > 0.01), ls = live.filter(m => m.q.type === 'layer'), as = live.filter(m => m.q.type === 'asset');
    if (ls.length) layerOps.changeMany(Object.fromEntries(ls.map(m => [m.q.id, l => { const v = valuesAt(l, t); return setLayerAt(l, t, {x: v.x + m.dx, y: v.y + m.dy}); }])), merge);
    if (as.length) assetOps.shiftMany(as.map(m => ({frame: m.q.frame, key: m.q.key, by: [m.dx, m.dy]})), merge);
  };
  const movable = () => itemsOf(selRef.current).map(hereOf).filter(q => q.type !== 'layer' || (layerOf(q.id) && !layerOf(q.id).locked));
  const nudge = (dx, dy) => {
    const items = movable();
    if (!items.length) return false;
    shiftAll(items.map(q => ({q, dx, dy})), `nudge:${items.map(q => (q.type === 'layer' ? q.id : `${q.frame}:${q.key}`)).join()}`);
    return true;
  };
  const alignTo = kind => { // (several: to the box round them all; one: to the picture)
    const t = timeRef.current, got = movable().map(q => ({q, b: stageBoxOf(q, t)})).filter(x => x.b);
    if (!got.length) return;
    const to = got.length > 1 ? unionOf(got.map(x => x.b)) : {x: 0, y: 0, w: STAGE_W, h: STAGE_H};
    shiftAll(got.map(({q, b}) => ({q,
      dx: kind === 'left' ? to.x - b.x : kind === 'hcenter' ? to.x + (to.w - b.w) / 2 - b.x : kind === 'right' ? to.x + to.w - b.w - b.x : 0,
      dy: kind === 'top' ? to.y - b.y : kind === 'vcenter' ? to.y + (to.h - b.h) / 2 - b.y : kind === 'bottom' ? to.y + to.h - b.h - b.y : 0})));
  };
  const distribute = axis => { // (three or more: the first and the last stay, the others go between with the same room between each)
    const t = timeRef.current, got = movable().map(q => ({q, b: stageBoxOf(q, t)})).filter(x => x.b);
    if (got.length < 3) return;
    const X = axis === 'h' ? 'x' : 'y', W = axis === 'h' ? 'w' : 'h', list = [...got].sort((a, b) => a.b[X] + a.b[W] / 2 - (b.b[X] + b.b[W] / 2));
    const first = list[0].b, last = list.at(-1).b, gap = (last[X] + last[W] - first[X] - list.reduce((s, x) => s + x.b[W], 0)) / (list.length - 1);
    let at = first[X];
    shiftAll(list.map(({q, b}) => { const d = at - b[X]; at += b[W] + gap; return {q, dx: axis === 'h' ? d : 0, dy: axis === 'v' ? d : 0}; }));
  };
  const selectAll = () => { const all = layersRef.current.filter(l => !l.locked).map(l => ({type: 'layer', id: l.id})); if (all.length) onSelection(groupOf(all)); };
  const copyLayers = cut => {
    const ids = layerIdsOf(selRef.current), list = layersRef.current.filter(l => ids.includes(l.id));
    if (!list.length) return false;
    writeClip(list);
    if (cut) deleteSel();
    return true;
  };
  const pasteLayers = () => { // (at the playhead: the first of them starts now; where they were on the picture)
    const clip = readClip();
    if (!clip) return false;
    const by = timeRef.current - Math.min(...clip.layers.map(l => l.from)), ids = layerOps.addMany(clip.layers.map(l => ({...shiftLayer(l, by), id: undefined})));
    if (ids.length) onSelection(groupOf(ids.map(id => ({type: 'layer', id}))));
    return true;
  };
  const duplicateSel = () => { const ids = layerIdsOf(selRef.current); if (!ids.length) return; const made = layerOps.duplicateMany(ids); if (made.length) onSelection(groupOf(made.map(id => ({type: 'layer', id})))); };
  const splitAt = () => { const ids = layerIdsOf(selRef.current); if (!ids.length) return; const made = layerOps.split(ids, timeRef.current); if (made.length) onSelection(groupOf(made.map(id => ({type: 'layer', id})))); };
  function deleteSel() {
    const items = itemsOf(selRef.current), ids = items.filter(q => q.type === 'layer').map(q => q.id);
    if (!ids.length) return false;
    layerOps.removeMany(ids);
    const rest = items.filter(q => q.type !== 'layer');
    if (rest.length) onSelection(groupOf(rest)); else pickNone();
    return true;
  }
  const restack = dir => { // forward / backward one step, or to the front / back: all of them, in their order
    const ids = layerIdsOf(selRef.current);
    if (!ids.length) return;
    const order = layersRef.current.map(l => l.id), moving = order.filter(id => ids.includes(id)), rest = order.filter(id => !ids.includes(id));
    let next = [...order];
    if (dir === 'front') next = [...rest, ...moving];
    else if (dir === 'back') next = [...moving, ...rest];
    else {
      const step = dir === 'forward' ? 1 : -1;
      for (const id of step > 0 ? [...moving].reverse() : moving) { const i = next.indexOf(id), j = i + step; if (j < 0 || j >= next.length || ids.includes(next[j])) continue; [next[i], next[j]] = [next[j], next[i]]; }
    }
    if (next.join() !== order.join()) layerOps.order(next);
  };
  const toggleFlag = flag => { const ls = layerIdsOf(selRef.current).map(layerOf).filter(Boolean); if (!ls.length) return; const on = !ls.every(l => l[flag]); layerOps.changeMany(Object.fromEntries(ls.map(l => [l.id, {[flag]: on}]))); };
  const layersTo = (edge, trim) => { // [ / ]: the layers picked start / end now (Alt: trimmed there; After Effects)
    const t = timeRef.current, ids = layerIdsOf(selRef.current).filter(id => !layerOf(id)?.locked);
    if (!ids.length) return;
    layerOps.changeMany(Object.fromEntries(ids.map(id => [id, l => (trim ? trimLayer(l, edge, t) : shiftLayer(l, Math.max(-l.from, t - (edge === 'from' ? l.from : l.to))))])));
  };
  const easeSelected = ease => { const list = keySelRef.current.filter(k => !layerOf(k.id)?.locked); if (list.length) layerOps.changeMany(Object.fromEntries([...byLayer(list)].map(([id, ks]) => [id, l => easeKeys(l, ks.map(k => k.t), ease)]))); };
  const deleteKeys = () => { const list = keySelRef.current.filter(k => !layerOf(k.id)?.locked); if (!list.length) return; layerOps.changeMany(Object.fromEntries([...byLayer(list)].map(([id, ks]) => [id, l => removeKeys(l, ks)]))); setKeySel(NONE); };
  useEffect(() => { // (the sidebar's buttons for all that is picked: Storyboard.jsx, the inspector of several)
    if (!actions) return undefined;
    actions.current = {align: alignTo, distribute, duplicate: duplicateSel, remove: deleteSel, split: splitAt, restack, copy: () => copyLayers(false), seek: t => { api.current?.stop(); seekTo(t); }};
    return () => { actions.current = null; };
  });

  // ---- the right-click menu (of what is under the pointer: the layers picked, the keyframes picked, or the picture) ----
  useEffect(() => {
    if (!menu) return undefined;
    const close = e => { if (!e.target.closest?.('.sb-ve-menu')) setMenu(null); };
    const away = () => setMenu(null);
    window.addEventListener('pointerdown', close, true); window.addEventListener('blur', away);
    return () => { window.removeEventListener('pointerdown', close, true); window.removeEventListener('blur', away); };
  }, [menu]);
  const openMenu = (e, list) => {
    e.preventDefault();
    const r = rootEl.current?.getBoundingClientRect(), items = tidy(list);
    if (!r || !items.length) return;
    setMenu({x: Math.max(4, Math.min(e.clientX - r.left, r.width - 264)), y: Math.max(4, Math.min(e.clientY - r.top, r.height - items.length * 31 - 16)), items});
  };
  const itemsMenu = sel => {
    const t = timeRef.current, ls = layerIdsOf(sel).map(layerOf).filter(Boolean), clip = readClip(), n = itemsOf(sel).length;
    return [
      ...(ls.length ? [{label: 'Cut', keys: 'Ctrl+X', run: () => copyLayers(true)}, {label: 'Copy', keys: 'Ctrl+C', run: () => copyLayers(false)}] : []),
      {label: clip ? `Paste ${clip.layers.length === 1 ? 'the layer' : `${clip.layers.length} layers`} at the playhead` : 'Paste', keys: 'Ctrl+V', off: !clip, run: pasteLayers},
      ...(ls.length ? ['-',
        {label: 'Duplicate', keys: 'Ctrl+D', run: duplicateSel},
        {label: 'Split at the playhead', keys: 'Ctrl+Shift+D', off: !ls.some(l => t > l.from + 0.05 && t < l.to - 0.05), run: splitAt},
        {label: ls.length === 1 ? 'Delete' : `Delete ${ls.length} layers`, keys: 'Delete', run: deleteSel}, '-',
        {label: 'Bring to front', keys: 'Ctrl+Shift+]', run: () => restack('front')}, {label: 'Bring forward', keys: 'Ctrl+]', run: () => restack('forward')},
        {label: 'Send backward', keys: 'Ctrl+[', run: () => restack('backward')}, {label: 'Send to back', keys: 'Ctrl+Shift+[', run: () => restack('back')}, '-',
        {label: 'Start at the playhead', keys: '[', run: () => layersTo('from', false)}, {label: 'End at the playhead', keys: ']', run: () => layersTo('to', false)}, '-',
        {label: ls.every(l => l.hidden) ? 'Show' : 'Hide', run: () => toggleFlag('hidden')}, {label: ls.every(l => l.locked) ? 'Unlock' : 'Lock', run: () => toggleFlag('locked')}, '-',
        {label: 'Add effect\u2026', run: m => setMenu({x: m.x, y: m.y, items: effectItems(ls.map(l => l.id))})}, {label: 'Label color\u2026', run: m => setMenu({x: m.x, y: m.y, items: labelItems(ls.map(l => l.id))})}] : []),
      ...(n > 1 ? ['-', {label: 'Align horizontal centers', run: () => alignTo('hcenter')}, {label: 'Align vertical centers', run: () => alignTo('vcenter')}] : []),
      '-', {label: 'Select all the layers', keys: 'Ctrl+A', off: !layersRef.current.length, run: selectAll},
      ...(n ? [{label: 'Pick nothing', keys: 'Esc', run: pickNone}] : []),
    ];
  };
  const effectItems = ids => EFFECT_TYPES.map(type => ({label: EFFECTS[type].name, run: () => addFx(ids, type)}));
  const labelItems = ids => LABELS.map((x, i) => ({label: x.name, swatch: x.color, run: () => layerOps.changeMany(Object.fromEntries(ids.map(id => [id, {label: i + 1}])))}));
  const idsAround = l => (layerIdsOf(selRef.current).includes(l.id) ? layerIdsOf(selRef.current) : [l.id]); // (the layers picked, if this one is one of them; else it alone)
  const effectsMenu = (e, l) => { // the fx button of a layer: the effects to add, and the switch of all of them
    const ids = idsAround(l), ls = ids.map(layerOf).filter(Boolean), withFx = ls.filter(x => x.fx?.length), allOn = withFx.every(x => x.fx.every(f => f.on !== false));
    openMenu(e, [...effectItems(ids), ...(withFx.length ? ['-', {label: allOn ? 'Turn all the effects off' : 'Turn all the effects on', run: () => layerOps.changeMany(Object.fromEntries(withFx.map(x => [x.id, y => ({...y, fx: y.fx.map(f => ({...f, on: !allOn}))})])))}] : [])]);
  };
  const labelMenu = (e, l) => openMenu(e, labelItems(idsAround(l)).map((it, i) => ({...it, label: `${it.label}${labelOf(l) === LABELS[i] ? '  \u2713' : ''}`})));
  const keysMenu = keys => [
    {label: 'Easy ease', keys: 'F9', run: () => easeSelected('ease')}, {label: 'Linear', run: () => easeSelected('linear')}, {label: 'Hold', keys: 'Ctrl+Alt+H', run: () => easeSelected('hold')}, '-',
    {label: keys.length === 1 ? 'Delete the keyframe' : `Delete ${keys.length} keyframes`, keys: 'Delete', run: deleteKeys},
  ];
  const onViewMenu = e => {
    e.preventDefault();
    if (toolRef.current !== 'select' || drag.current) return;
    const p = toStage(e), l = layerAt(layersRef.current, timeRef.current, p.x, p.y);
    let sel = selRef.current;
    if (l && !layerIdsOf(sel).includes(l.id)) { sel = {type: 'layer', id: l.id}; onSelection(sel); }
    openMenu(e, [...itemsMenu(sel), ...(commentOps ? ['-', {label: 'Add a comment here', run: () => { api.current?.stop(); addComment(p); }}] : [])]); // (a pin there, at the second the playhead is on)
  };
  const menuOnLayer = (e, l) => {
    e.stopPropagation();
    let sel = selRef.current;
    if (!layerIdsOf(sel).includes(l.id)) { sel = {type: 'layer', id: l.id}; onSelection(sel); setKeySel(NONE); }
    openMenu(e, itemsMenu(sel));
  };
  const menuOnKey = (e, l, t, props) => {
    e.stopPropagation();
    const me = {id: l.id, t, props};
    let keys = keySelRef.current;
    if (!keys.some(k => sameKey(k, me))) { keys = [me]; setKeySel(keys); }
    openMenu(e, keysMenu(keys));
  };

  // ---- the comments' pins (the user, 2026-10-29): picked by a press (the playhead does not move, nothing plays or pauses), dragged to move (one step of Undo), right-clicked for the menu,
  // deleted by that menu, by Delete when one is picked (and the keyboard is not in a field) or by the inspector's red button: each one step of Undo ----
  const pinPicked = c => selRef.current?.type === 'comment' && selRef.current.id === c.id;
  const pickComment = c => { if (!pinPicked(c)) onSelection({type: 'comment', id: c.id}); };
  const focusComment = () => { document.querySelector('.sb-cm-text')?.focus(); };
  const removeComment = id => { commentOps?.remove(id); pickNone(); };
  const commentMenu = c => [
    {label: 'Delete', keys: 'Delete', run: () => removeComment(c.id)},
    '-',
    {label: c.done ? 'Mark as not done' : 'Mark as done', run: () => commentOps?.change(c.id, {done: !c.done})},
    {label: `Go to its second (${tc(c.at)})`, run: () => { api.current?.stop(); seekTo(c.at); }},
  ];
  const menuOnPin = (e, c) => { e.stopPropagation(); pickComment(c); setKeySel(NONE); openMenu(e, commentMenu(c)); };
  const onPinDown = (e, c) => {
    if (e.button !== 0 || toolRef.current === 'hand' || spaceHeld.current) return; // (the hand and a right-click are the viewer's own)
    e.preventDefault(); e.stopPropagation();
    if (menuRef.current) setMenu(null);
    setKeySel(NONE);
    pickComment(c);
    viewEl.current.setPointerCapture(e.pointerId);
    drag.current = {type: 'pin', id: c.id, p0: toStage(e), base: {x: c.x, y: c.y}, moved: false, to: null};
  };

  // ---- the viewer's pointer: a press picks (Shift: adds or takes out) and a drag moves all that is picked; from where there is nothing to move, a rectangle ----
  const startMove = (p, items, t, collapse) => {
    const list = [];
    for (const raw of items) {
      const q = hereOf(raw);
      if (q.type === 'layer') { const l = layerOf(q.id); if (l && !l.locked && isShownAt(l, t)) list.push({q, base: valuesAt(l, t)}); continue; }
      const el = assetElOf(q);
      if (el) list.push({q, el, t0: translateOf(el), k: parentScale(el) || 1, base: edits.frames[q.frame]?.vmove?.[q.key] ?? [0, 0]});
    }
    drag.current = {type: 'move', list, p0: p, t, box: unionOf(list.map(x => stageBoxOf(x.q, t)).filter(Boolean)), moved: false, collapse, dx: 0, dy: 0};
  };
  const snapLines = moving => { // (what a box moved is taken by: the picture's sides and middle, the guide lines of the slide, the other layers' sides and middles)
    const t = timeRef.current, xs = [0, STAGE_W / 2, STAGE_W], ys = [0, STAGE_H / 2, STAGE_H], gl = api.current?.guides?.();
    if (gl) { xs.push(...gl.x); ys.push(...gl.y); }
    for (const l of layersRef.current) {
      if (moving.some(q => q.type === 'layer' && q.id === l.id) || !isShownAt(l, t)) continue;
      const b = boundsOf(valuesAt(l, t));
      xs.push(b.x, b.x + b.w / 2, b.x + b.w); ys.push(b.y, b.y + b.h / 2, b.y + b.h);
    }
    return {x: xs, y: ys};
  };
  const showSnap = got => { const el = snapEl.current; if (el) el.innerHTML = got ? [...got.x.map(x => `<line x1="${x}" x2="${x}" y1="-4000" y2="4900"/>`), ...got.y.map(y => `<line x1="-4000" x2="5600" y1="${y}" y2="${y}"/>`)].join('') : ''; };
  const marqueeItems = d => { // (what a rectangle drawn on the picture touches: the layers, and the elements of the slide on that are not a backdrop)
    const r = rectOf(d.c0, d.c1), v = viewRef.current, vr = viewEl.current.getBoundingClientRect(), t = timeRef.current;
    const s = {x: (r.left - vr.left - v.x) / v.z, y: (r.top - vr.top - v.y) / v.z, w: (r.right - r.left) / v.z, h: (r.bottom - r.top) / v.z};
    const got = layersRef.current.filter(l => !l.locked && isShownAt(l, t) && touches(boundsOf(valuesAt(l, t)), s)).map(l => ({type: 'layer', id: l.id}));
    for (const a of api.current?.assetsIn?.(r) ?? []) got.push({type: 'asset', frame: a.frame, key: a.key, name: a.name});
    return got;
  };
  const hoverAt = e => { // (the layer under the pointer, outlined: what a press would pick)
    const el = hoverEl.current;
    if (!el) return;
    if (toolRef.current !== 'select' || spaceHeld.current || e.buttons) { el.style.display = 'none'; return; }
    const p = toStage(e), t = timeRef.current, l = layerAt(layersRef.current, t, p.x, p.y);
    if (!l || layerIdsOf(selRef.current).includes(l.id)) { el.style.display = 'none'; return; }
    const v = viewRef.current, val = valuesAt(l, t);
    el.style.display = '';
    el.style.transform = `translate(${v.x + val.x * v.z}px, ${v.y + val.y * v.z}px) rotate(${val.rotation}deg)`;
    el.style.width = `${val.w * v.z}px`; el.style.height = `${val.h * v.z}px`;
  };
  const onViewDown = e => {
    if (menuRef.current) setMenu(null);
    if (e.target.closest('[data-sb-te], .sb-ve-handle, .sb-ve-help') || (e.target.isContentEditable)) return;
    const v = viewRef.current;
    if (e.button === 1 || (e.button === 0 && (toolRef.current === 'hand' || spaceHeld.current))) {
      e.preventDefault(); viewEl.current.setPointerCapture(e.pointerId);
      stopViewMotion(); hideHover();
      if (spaceHeld.current) spaceHeld.current.panned = true;
      drag.current = {type: 'pan', x0: e.clientX, y0: e.clientY, v0: v};
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault(); viewEl.current.setPointerCapture(e.pointerId);
    hideHover();
    const p = toStage(e), t = timeRef.current, kind = toolRef.current, add = e.shiftKey, items = itemsOf(selRef.current);
    setKeySel(NONE);
    if (kind === 'rect' || kind === 'ellipse') { api.current?.stop(); drag.current = {type: 'draw', kind, p0: p, p1: p}; return; }
    if (kind === 'text') { api.current?.stop(); addText(p); return; }
    if (kind === 'comment') { api.current?.stop(); addComment(p); return; }
    if (kind === 'pen') return; // (the Pen's own: components/StoryboardPathEditor.jsx)
    api.current?.stop();
    const l = layerAt(layersRef.current, t, p.x, p.y, Math.max(3, Math.min(16, 7 / v.z))), hit = l ? null : api.current?.pick(e.clientX, e.clientY, e.ctrlKey || e.metaKey); // (a path is pressed near its line)
    if (hit?.type === 'connector') { convertConnector(hit, p); return; } // (a purple line of the software: it becomes a path of the video)
    const got = l ? {type: 'layer', id: l.id} : hit?.type === 'asset' ? {type: 'asset', frame: hit.frame, key: hit.key, name: hit.name} : null;
    if (got) {
      const was = hasItem(items, got);
      if (add) { // (Shift: one more, or taken out)
        const next = was ? items.filter(q => !sameItem(q, got)) : [...items, got];
        if (next.length) onSelection(groupOf(next, was ? null : got)); else pickNone();
        if (was) return;
        startMove(p, next, t, null);
        return;
      }
      if (!was) onSelection(got);
      else if (!sameItem(plainOf(selRef.current), got)) onSelection(groupOf(items, got)); // (pressed in the group: it is the one the inspector shows, the group stays to be moved)
      startMove(p, was ? items : [got], t, was && items.length > 1 ? got : null);
      return;
    }
    // nothing to move there: a color part (the plate, the gray side, an outline, the words, the background) is picked as before; dragged, a rectangle picks what it touches
    if (!add) {
      if (hit?.type === 'look') { onSelection({type: 'look', kind: hit.kind}); api.current?.select({focus: hit.kind, line: hit.line ?? null}); }
      else pickNone();
    }
    drag.current = {type: 'marquee', c0: {x: e.clientX, y: e.clientY}, c1: {x: e.clientX, y: e.clientY}, base: add ? items : NONE, moved: false};
  };
  const onViewMove = e => {
    const d = drag.current;
    if (!d) { hoverAt(e); return; }
    if (d.type === 'pan') { setView({...d.v0, x: d.v0.x + e.clientX - d.x0, y: d.v0.y + e.clientY - d.y0, fit: false}); return; }
    const p = toStage(e), z = viewRef.current.z;
    if (d.type === 'pin') { // a pin dragged: shown there at once, kept when it is let go (one step of Undo); it stays on the picture
      if (!d.moved && Math.hypot(p.x - d.p0.x, p.y - d.p0.y) * z < 3) return;
      d.moved = true; d.to = {x: Math.max(0, Math.min(STAGE_W, d.base.x + p.x - d.p0.x)), y: Math.max(0, Math.min(STAGE_H, d.base.y + p.y - d.p0.y))};
      placePins();
      return;
    }
    if (d.type === 'draw') { d.p1 = p; const b = boxOf(d.p0, p, e.shiftKey), v = viewRef.current; setDrawBox({kind: d.kind, left: v.x + b.x * z, top: v.y + b.y * z, width: b.w * z, height: b.h * z}); return; }
    if (d.type === 'marquee') {
      d.c1 = {x: e.clientX, y: e.clientY};
      if (!d.moved && Math.hypot(d.c1.x - d.c0.x, d.c1.y - d.c0.y) < 4) return;
      d.moved = true;
      const vr = viewEl.current.getBoundingClientRect(), r = rectOf(d.c0, d.c1), el = boxEl.current;
      if (el) { el.style.display = ''; el.style.transform = `translate(${r.left - vr.left}px, ${r.top - vr.top}px)`; el.style.width = `${r.right - r.left}px`; el.style.height = `${r.bottom - r.top}px`; }
      if (!d.raf) d.raf = requestAnimationFrame(() => { // (what it would pick, outlined as it goes: a few times a second, not at every move)
        d.raf = 0;
        if (drag.current !== d) return;
        const t = timeRef.current;
        d.got = marqueeItems(d);
        outlineAll([...d.base, ...d.got].map(q => screenBoxOf(q, t)).filter(Boolean));
      });
      return;
    }
    if (d.type === 'move') {
      let dx = p.x - d.p0.x, dy = p.y - d.p0.y;
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; } // (Shift: along one line)
      if (!d.moved && Math.hypot(dx, dy) * z < 3) return;
      d.moved = true;
      let got = null;
      if (snapRef.current && d.box) { // (the magnet: the box round all that is moved, taken by the nearest line)
        d.lines ??= snapLines(d.list.map(x => x.q));
        const lockX = e.shiftKey && dx === 0, lockY = e.shiftKey && dy === 0, s = snapBox({...d.box, x: d.box.x + dx, y: d.box.y + dy}, d.lines.x, d.lines.y, SNAP_PX / z);
        if (!lockX) dx += s.dx;
        if (!lockY) dy += s.dy;
        got = {x: lockX ? [] : s.x, y: lockY ? [] : s.y};
      }
      showSnap(got);
      d.dx = dx; d.dy = dy;
      for (const x of d.list) {
        if (x.q.type === 'layer') drawGhost(x.q.id, {...x.base, x: x.base.x + dx, y: x.base.y + dy});
        else moveTo(x.el, [x.t0[0] + dx * z / x.k, x.t0[1] + dy * z / x.k]); // (its place in the video on this slide: shown at once, kept when let go)
      }
      placeGizmo();
      return;
    }
    if (d.type === 'resize') { d.values = resized(d.base, d.h, p.x - d.p0.x, p.y - d.p0.y, e.shiftKey); previewLayer(d.id, d.values); return; }
    if (d.type === 'gresize') { d.values = scaledGroup(d.list, d.b0, d.h, p.x - d.p0.x, p.y - d.p0.y, e.shiftKey); for (const [id, v] of d.values) drawGhost(id, v); placeGizmo(); return; }
    if (d.type === 'rotate') {
      const cx = d.base.x + d.base.w / 2, cy = d.base.y + d.base.h / 2, a0 = Math.atan2(d.p0.y - cy, d.p0.x - cx), a = Math.atan2(p.y - cy, p.x - cx);
      let r = d.base.rotation + (a - a0) * 180 / Math.PI;
      if (e.shiftKey) r = Math.round(r / 15) * 15;
      d.values = {...d.base, rotation: Math.round(r * 10) / 10}; previewLayer(d.id, d.values);
      return;
    }
    if (d.type === 'aresize') { // (from its middle: the side or corner pressed follows the pointer, the other one goes the other way)
      const corner = d.h.length === 2, dx0 = d.x0 - d.c.x, dy0 = d.y0 - d.c.y, dx1 = e.clientX - d.c.x, dy1 = e.clientY - d.c.y, clampF = f => Math.max(0.05, Math.min(20, f));
      let fx = /[ew]/.test(d.h) ? Math.abs(dx1) / Math.max(2, Math.abs(dx0)) : 1, fy = /[ns]/.test(d.h) ? Math.abs(dy1) / Math.max(2, Math.abs(dy0)) : 1;
      if (!d.free || d.keep !== e.shiftKey) { const f = corner ? Math.hypot(dx1, dy1) / Math.max(2, Math.hypot(dx0, dy0)) : /[ew]/.test(d.h) ? fx : fy; fx = fy = f; } // (a UI element keeps its proportions; a picture too unless Shift; a box only with Shift)
      d.f = [clampF(fx), clampF(fy)];
      moveTo(d.el, d.t0); scaleTo(d.el, [d.s0[0] * d.f[0], d.s0[1] * d.f[1]]);
      const r = d.el.getBoundingClientRect(); // (its middle stays where it was: the element's own transform may start from its corner)
      moveTo(d.el, [d.t0[0] + (d.c.x - (r.left + r.right) / 2) / d.k, d.t0[1] + (d.c.y - (r.top + r.bottom) / 2) / d.k]);
      placeGizmo();
      return;
    }
    if (d.type === 'path') { // a point of the motion path dragged: where the layer is at that keyframe, where the element is on that slide
      let dx = p.x - d.p0.x, dy = p.y - d.p0.y;
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      if (!d.moved && Math.hypot(dx, dy) * z < 3) return;
      d.moved = true; d.to = {x: d.pt.x + dx, y: d.pt.y + dy};
      setMotion(m => (m ? {...m, points: m.points.map((q, n) => (n === d.n ? {...q, ...d.to} : q)), line: m.kind === 'asset' ? m.points.map((q, n) => (n === d.n ? [d.to.x, d.to.y] : [q.x, q.y])) : m.line} : m));
    }
  };
  const onViewUp = e => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.type === 'pin') { if (d.moved && d.to) commentOps?.change(d.id, {x: d.to.x, y: d.to.y}); placePins(); return; }
    if (d.type === 'draw') {
      setDrawBox(null);
      const b = boxOf(d.p0, d.p1, e.shiftKey), def = LAYER_DEFAULTS[d.kind], small = b.w * viewRef.current.z < 4 || b.h * viewRef.current.z < 4;
      addLayer({kind: d.kind, ...(small ? {x: d.p0.x - def.w / 2, y: d.p0.y - def.h / 2, w: def.w, h: def.h} : b)});
      return;
    }
    if (d.type === 'marquee') {
      cancelAnimationFrame(d.raf);
      if (boxEl.current) boxEl.current.style.display = 'none';
      if (d.moved) {
        const got = marqueeItems(d), all = [...d.base, ...got.filter(q => !hasItem(d.base, q))];
        if (all.length) onSelection(groupOf(all)); else if (!d.base.length) pickNone();
      }
      placeGizmo();
      return;
    }
    if (d.type === 'move') {
      showSnap(null);
      if (!d.moved) { if (d.collapse) onSelection(plainOf(d.collapse)); return; } // (a press on one of several, not dragged: that one alone, as in Figma)
      const merge = `move:${performance.now()}`, ls = d.list.filter(x => x.q.type === 'layer'), as = d.list.filter(x => x.q.type === 'asset');
      if (ls.length) layerOps.changeMany(Object.fromEntries(ls.map(x => [x.q.id, l => setLayerAt(l, d.t, {x: x.base.x + d.dx, y: x.base.y + d.dy})])), merge);
      if (as.length) assetOps.placeMany(as.map(x => ({frame: x.q.frame, key: x.q.key, d: [x.base[0] + d.dx, x.base[1] + d.dy]})), merge);
      ghost.current.clear(); // (the layers as kept, from now)
      return;
    }
    if ((d.type === 'resize' || d.type === 'rotate') && d.values) {
      const v = d.values;
      layerOps.change(d.id, l => setLayerAt(l, d.t, d.type === 'rotate' ? {rotation: v.rotation} : {x: v.x, y: v.y, w: v.w, h: v.h}));
      ghost.current.clear();
      return;
    }
    if (d.type === 'gresize' && d.values) {
      layerOps.changeMany(Object.fromEntries([...d.values].map(([id, v]) => [id, l => setLayerAt(l, d.t, {x: v.x, y: v.y, w: v.w, h: v.h})])));
      ghost.current.clear();
      return;
    }
    if (d.type === 'path') {
      if (!d.moved) return; // (a point pressed: the time is not moved, J / K go to it; the user, 2026-10-22)
      const dx = d.to.x - d.pt.x, dy = d.to.y - d.pt.y;
      if (d.kind === 'layer') layerOps.change(d.id, l => { const v = valuesAt(l, d.pt.t); return setLayerAt(l, d.pt.t, {x: v.x + dx, y: v.y + dy}); });
      else assetOps.place(d.pt.frame, d.pt.key, [d.pt.vmove[0] + dx, d.pt.vmove[1] + dy]);
    }
    if (d.type === 'aresize' && d.f) assetOps.resize(d.frame, d.key, d.f);
  };
  const onViewDouble = e => {
    if (toolRef.current !== 'select' || e.target.closest('[data-sb-te], .sb-ve-help, .sb-ve-pin')) return;
    const p = toStage(e), l = layerAt(layersRef.current, timeRef.current, p.x, p.y, Math.max(3, Math.min(16, 7 / viewRef.current.z)));
    if (l) { if (l.kind === 'text') editText(l.id); else if (l.kind === 'path') pathEd.current?.insertAt(p); return; } // (a path: a point on its line)
    if (!api.current?.textAt?.(e.clientX, e.clientY)) { // (the user, 2026-10-29: "when I double click an element even inside a board I should be able to select it and change its size": not a text, so the deepest element there is picked, with its handles)
      const hit = api.current?.pick(e.clientX, e.clientY, true);
      if (hit?.type === 'asset') { onSelection({type: 'asset', frame: hit.frame, key: hit.key, name: hit.name}); return; }
    }
    api.current?.retype(e); // (a text of the slide: retyped in the picture; a color: its section of the inspector)
  };
  const onHandleDown = e => {
    e.preventDefault(); e.stopPropagation();
    const sel = selRef.current, items = itemsOf(sel), h = e.currentTarget.dataset.h, t = timeRef.current;
    if (items.length > 1) { // several layers: scaled together by the box round them (not turned)
      const ls = items.map(q => (q.type === 'layer' ? layerOf(q.id) : null));
      if (h === 'rot' || ls.some(l => !l || l.locked)) return;
      const list = ls.filter(l => isShownAt(l, t)).map(l => ({id: l.id, base: valuesAt(l, t)}));
      if (!list.length) return;
      viewEl.current.setPointerCapture(e.pointerId);
      drag.current = {type: 'gresize', h, t, list, b0: unionOf(list.map(x => boundsOf(x.base))), p0: toStage(e)};
      return;
    }
    const l = sel?.type === 'layer' ? layerOf(sel.id) : null;
    if (sel?.type === 'asset') { // an element of a slide resized around its middle (After Effects' anchor point), in the video only, on every slide of it (when let go)
      const el = assetElOf(sel);
      if (!el || h === 'rot') return;
      const kind = resizeKind(el), r = el.getBoundingClientRect();
      if (kind.bubble) return;
      viewEl.current.setPointerCapture(e.pointerId);
      drag.current = {type: 'aresize', h, el, frame: sel.frame, key: sel.key, s0: scaleOf(el), t0: translateOf(el), k: parentScale(el) || 1, c: {x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2}, x0: e.clientX, y0: e.clientY, free: kind.free, keep: kind.keep};
      return;
    }
    if (!l || l.locked) return;
    viewEl.current.setPointerCapture(e.pointerId);
    drag.current = {type: h === 'rot' ? 'rotate' : 'resize', h, id: l.id, t, base: valuesAt(l, t), p0: toStage(e)};
  };
  const onDrop = e => { const files = [...(e.dataTransfer?.files ?? [])].filter(f => /^image\//.test(f.type)); if (!files.length) return; e.preventDefault(); addImages(files); };
  // a paste: a picture in it is a layer of the video; else the layers copied (Ctrl+C), at the playhead
  const onPaste = e => {
    if (isField(e.target)) return;
    clearTimeout(pasteWait.current); pasteWait.current = 0;
    const files = [...(e.clipboardData?.files ?? [])].filter(f => /^image\//.test(f.type));
    if (files.length) { e.preventDefault(); e.stopImmediatePropagation(); addImages(files); return; }
    if (readClip()) { e.preventDefault(); e.stopImmediatePropagation(); pasteLayers(); }
  };
  const pasteRef = useRef(onPaste); pasteRef.current = onPaste;
  useEffect(() => {
    const paste = e => pasteRef.current(e);
    window.addEventListener('paste', paste, true);
    return () => window.removeEventListener('paste', paste, true);
  }, []);

  // ---- the motion path of what is picked (After Effects'): a layer's position keyframes, or an element of the slides where it is on each slide it is on (measured by the video
  // on a slot of its own, one slide a picture). A point is dragged to move it there (a layer: at that keyframe; an element: on that slide, in the video); a press never moves the time (J / K go to a point).
  // The line is where it really goes as the video plays (the user, 2026-10-22: "I don't see the line"): the glides, scrolls and zooms between two slides too, measured on a copy of the
  // video that is never seen (`track`), kept until the video or its edits change. Something that never moves says so by its point. Several picked: the one pressed last's. ----
  const [motion, setMotion] = useState(null);
  const nowIndex = timeline ? locate(timeline, now)?.index ?? -1 : -1;
  const rowOfSel = useCallback(sel => (sel?.type === 'asset' ? slideRowsRef.current.find(r => [...r.at].some(([i, key]) => geo.current.played[i]?.id === sel.frame && key === sel.key.split('/')[0])) ?? null : null), []);
  rowOfSelRef.current = rowOfSel;
  const pathRow = selection?.type === 'asset' ? rowOfSel(selection) : null, pathKey = pathRow ? pathRow.name + pathOf(selection) : null; // (what is picked: its row, not the slide it is on now)
  const tracks = useRef(new Map()); // (the lines measured: row -> {script, edits, lines})
  useEffect(() => { // a layer of the video: its position keyframes
    const sel = selection;
    if (sel?.type === 'layer') {
      const l = layers.find(x => x.id === sel.id);
      if (!l) { setMotion(null); return undefined; }
      const keys = [...new Set([...keyTimes(l, 'x'), ...keyTimes(l, 'y')])].sort((a, b) => a - b), times = keys.length ? keys : [Math.max(l.from, Math.min(l.to, now))]; // (no position keyframe: where it is, a square to move it)
      const at = t => { const v = valuesAt(l, t); return [v.x + v.w / 2, v.y + v.h / 2]; }, line = [];
      for (let t = times[0]; t < times.at(-1); t += 1 / 30) line.push(at(t));
      line.push(at(times.at(-1)));
      setMotion({kind: 'layer', id: l.id, still: !keys.length, points: times.map(t => { const [x, y] = at(t); return {x, y, t}; }), lines: [line]});
    }
    return undefined;
  }, [selection, layers, now]);
  useEffect(() => { // an element of the slides: where it rests on each slide (the points), and where it goes as the video plays (the line)
    const sel = selRef.current;
    if (sel?.type === 'layer') return undefined;
    const row = pathKey ? rowOfSel(sel) : null;
    if (!row || !timeline) { setMotion(null); return undefined; }
    const path = pathOf(sel), list = [...row.at].map(([i, key]) => ({i, key: key + path})).sort((a, b) => a.i - b.i), pts = [];
    const kept = tracks.current.get(pathKey), ready = kept && kept.script === script && kept.edits === edits ? kept.lines : null;
    let lines = ready, k = 0, raf = 0, stopTrack = null, shownAt = 0, wait = 0;
    const quiet = !ready && !!kept?.points; // (the same element changed since it was measured: measured again over the path it had, shown when it is all there)
    const show = () => setMotion({kind: 'asset', key: pathKey, points: [...pts], lines: lines ?? [pts.map(q => [q.x, q.y])], tracking: !lines, still: !!lines && stillOf(pts, lines)});
    const keys = new Map(list.map(({i, key}) => [played[i]?.id, key]));
    const startTrack = () => { // (the times it is on the picture: closely while it moves in, less often while it is held)
      const times = [];
      for (const s of row.segs) for (let i = s.from; i <= s.to; i++) {
        const item = timeline.items[i], end = timeline.items[i + 1]?.start ?? total, moved = item.start + (item.move || 0);
        for (let t = item.start; t < moved; t += 1 / 24) times.push(t);
        for (let t = moved; t < end - 1e-3; t += 0.25) times.push(t);
      }
      stopTrack = api.current?.track(keys, times, (got, done) => {
        const now0 = performance.now();
        if (!done && (quiet || now0 - shownAt < 120)) return; // (the line grows a few times a second, not every picture; measured again over the path it had: shown when it is all there)
        shownAt = now0; lines = linesOf(got);
        if (done) tracks.current.set(pathKey, {script, edits, lines, points: [...pts]});
        setMotion({kind: 'asset', key: pathKey, points: [...pts], lines, tracking: !done, still: done && stillOf(pts, lines)});
      }) ?? null;
    };
    const step = () => { // (a few slides a picture: the board does not stop)
      const t0 = performance.now();
      while (k < list.length && performance.now() - t0 < 10) { const {i, key} = list[k++], m = api.current?.measure(i, key); if (m) pts.push({x: m.x, y: m.y, t: settledAt(timeline, i), i, frame: played[i].id, key, vmove: m.vmove}); }
      if (!quiet) show();
      if (k < list.length) raf = requestAnimationFrame(step);
      else if (!lines) { startTrack(); if (quiet && !stopTrack) show(); }
    };
    if (quiet) { // (changed since it was measured, the same element: the path it had stays, measured again only once the changes stop, not at every step of a field dragged; the user, 2026-10-27: "like it freezes")
      setMotion({kind: 'asset', key: pathKey, points: kept.points, lines: kept.lines, tracking: true, still: false});
      wait = setTimeout(() => { raf = requestAnimationFrame(step); }, 700);
    } else raf = requestAnimationFrame(step);
    return () => { clearTimeout(wait); cancelAnimationFrame(raf); stopTrack?.(); };
  }, [pathKey, timeline, played, edits, script, total, rowOfSel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // (held on another slide, the elements of the slides picked stay picked: the same elements on that slide, as a layer stays picked in After Effects)
    const sel = selRef.current, tl = geo.current.timeline;
    if (!sel || sel.type === 'look' || !tl || playing) return;
    const i = locate(tl, now)?.index ?? -1, frame = geo.current.played[i];
    if (!frame) return;
    const follow = q => { if (q.type !== 'asset' || q.frame === frame.id) return q; const root = rowOfSel(q)?.at.get(i); return root == null ? q : {...q, frame: frame.id, key: root + pathOf(q)}; };
    const items = itemsOf(sel), moved = items.map(follow);
    if (moved.every((q, n) => q === items[n])) return;
    onSelection(items.length > 1 ? groupOf(moved, follow(plainOf(sel))) : moved[0]);
  }, [now, playing, rowOfSel, onSelection]);
  const onPathDown = (e, n) => {
    if (e.button !== 0 || !motion) return;
    const q = motion.points[n], on = Math.abs(q.t - timeRef.current) < 0.02 || (motion.kind === 'asset' && q.i === nowIndex);
    if (!on) { // (a point of another time under the picked thing itself: the press is the thing's, dragged now it makes a keyframe now, as in After Effects)
      const p = toStage(e), sel = selRef.current;
      if (motion.kind === 'layer' && layerAt(layersRef.current, timeRef.current, p.x, p.y)?.id === motion.id) return;
      const el = sel?.type === 'asset' ? api.current?.assetEl(sel.frame, sel.key) : null, r = el?.getBoundingClientRect();
      if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return;
    }
    e.preventDefault(); e.stopPropagation();
    viewEl.current.setPointerCapture(e.pointerId);
    drag.current = {type: 'path', kind: motion.kind, id: motion.id, n, pt: motion.points[n], p0: toStage(e), moved: false};
  };
  // the keyframes of what is picked: a layer's, or the slides an element of the slides is on
  const keyStep = useCallback(dir => {
    const sel = selRef.current, tl = geo.current.timeline, t = api.current?.time() ?? 0;
    let times = [];
    if (sel?.type === 'layer') { const l = layerOf(sel.id); times = l ? keyTimes(l) : []; }
    else if (sel?.type === 'asset' && tl) { const row = rowOfSel(sel); times = row ? [...row.at.keys()].sort((a, b) => a - b).map(i => settledAt(tl, i)) : []; }
    const to = dir < 0 ? [...times].reverse().find(x => x < t - 1e-3) : times.find(x => x > t + 1e-3);
    if (to != null) seekTo(to);
  }, [seekTo, rowOfSel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const undoKeys = e => {
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (!mod || (k !== 'z' && k !== 'y')) return;
      const t = e.target;
      if (t?.isContentEditable || t?.tagName === 'TEXTAREA' || (t?.tagName === 'INPUT' && !/^(range|checkbox|radio|color|button)$/i.test(t.type) && t.closest?.('.sb-ve-tl, .sb-ve-top, .sb-ve-transport'))) return; // (a text being typed: its own undo)
      e.preventDefault(); e.stopPropagation();
      if (k === 'y' || e.shiftKey) onRedo?.(); else onUndo?.();
    };
    window.addEventListener('keydown', undoKeys, true);
    return () => window.removeEventListener('keydown', undoKeys, true);
  }, [onUndo, onRedo]);
  // ---- the keyboard is the editor's while it is open (the board's own keys wait; Undo and Redo stay the board's) ----
  const onKey = e => {
    if (e.defaultPrevented || isField(e.target) || isField(document.activeElement)) return;
    const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase(), sel = selRef.current, ids = layerIdsOf(sel);
    if (k === 'escape' && menuRef.current) { e.preventDefault(); setMenu(null); return; }
    if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomAt((glide.current?.z ?? viewRef.current.z) * 1.25, undefined, undefined, true); return; }
    if (mod && (k === '-' || k === '_')) { e.preventDefault(); zoomAt((glide.current?.z ?? viewRef.current.z) / 1.25, undefined, undefined, true); return; }
    if (mod && k === '0') { e.preventDefault(); fitView(true); return; }
    if (mod && k === 'a') { e.preventDefault(); if (e.shiftKey) pickNone(); else selectAll(); return; }
    if (mod && (k === 'c' || k === 'x') && !e.shiftKey) { if (copyLayers(k === 'x')) e.preventDefault(); return; }
    if (mod && k === 'v' && !e.shiftKey) { clearTimeout(pasteWait.current); pasteWait.current = setTimeout(() => { pasteWait.current = 0; pasteLayers(); }, 80); return; } // (the browser's paste comes first, with a picture in it; this, if it does not come)
    if (mod && k === 'd') { e.preventDefault(); if (e.shiftKey) splitAt(); else duplicateSel(); return; }
    if (mod && (e.code === 'BracketRight' || e.code === 'BracketLeft')) { if (!ids.length) return; e.preventDefault(); restack(e.code === 'BracketRight' ? (e.shiftKey ? 'front' : 'forward') : (e.shiftKey ? 'back' : 'backward')); return; }
    if (mod && e.altKey && k === 'h') { e.preventDefault(); easeSelected('hold'); return; }
    if (mod && (k === 'arrowleft' || k === 'arrowright')) { e.preventDefault(); stepFrames(k === 'arrowleft' ? -1 : 1); return; }
    if (mod) return;
    if (e.key === 'F9') { e.preventDefault(); easeSelected('ease'); return; }
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) spaceHeld.current = {panned: false}; return; }
    if ((e.code === 'BracketLeft' || e.code === 'BracketRight') && ids.length) { e.preventDefault(); layersTo(e.code === 'BracketLeft' ? 'from' : 'to', e.altKey); return; }
    if (e.key === '?') { e.preventDefault(); setHelp(h => !h); return; }
    const pen = pathEd.current; // (the Pen: Enter and Esc end the line, Backspace takes its last point off; a path's points picked: Delete takes them off)
    if (pen?.hasDraft() && (k === 'enter' || k === 'escape')) { e.preventDefault(); pen.finish(true); return; }
    if (pen && (k === 'backspace' || k === 'delete') && !keySelRef.current.length) {
      if (pen.hasDraft()) { e.preventDefault(); pen.back(); return; }
      if (pen.hasPicked()) { e.preventDefault(); pen.deletePicked(); return; }
    }
    if (k === 'u' && !e.altKey) { e.preventDefault(); if (!e.repeat) pressU(); return; }
    if (hoverTl.current && !e.altKey && KEY_GROUPS[k]) { e.preventDefault(); if (!e.repeat) revealWith(KEY_GROUPS[k], e.shiftKey); return; } // (over the timeline R E T are After Effects' properties; elsewhere they are the tools)
    if (k === 'v') setTool('select');
    else if (k === 'h') setTool('hand');
    else if (k === 'r') setTool('rect');
    else if (k === 'e') setTool('ellipse');
    else if (k === 't') setTool('text');
    else if (k === 'c') setTool('comment');
    else if (k === 'p') setTool('pen');
    else if (k === 'i') fileEl.current?.click();
    else if (k === 'b') setWorkEdge('from');
    else if (k === 'n') setWorkEdge('to');
    else if (k === ',' || k === '.') { e.preventDefault(); stepFrames(k === ',' ? -1 : 1); }
    else if (k === 'escape') { e.preventDefault(); if (help) setHelp(false); else if (keySelRef.current.length) setKeySel(NONE); else if (toolRef.current !== 'select') setTool('select'); else if (sel) pickNone(); else onClose(); }
    else if (k === 'delete' || k === 'backspace') { if (keySelRef.current.length) { e.preventDefault(); deleteKeys(); } else if (ids.length) { e.preventDefault(); deleteSel(); } else if (sel?.type === 'comment') { e.preventDefault(); removeComment(sel.id); } } // (a pin picked: deleted, one step of Undo)
    else if (k === 'j' || k === 'k') keyStep(k === 'j' ? -1 : 1);
    else if (k.startsWith('arrow')) {
      e.preventDefault();
      const n = e.shiftKey ? 10 : 1, dx = k === 'arrowleft' ? -n : k === 'arrowright' ? n : 0, dy = k === 'arrowup' ? -n : k === 'arrowdown' ? n : 0;
      if (!nudge(dx, dy) && dx) { if (e.shiftKey) seekTo((api.current?.time() ?? 0) + Math.sign(dx)); else slideAt(Math.sign(dx)); }
    } else if (k === 'pageup' || k === 'pagedown') { e.preventDefault(); stepFrames((k === 'pageup' ? -1 : 1) * (e.shiftKey ? 10 : 1)); } // (After Effects': a frame at a time, Shift ten)
    else if (k === 'home') { e.preventDefault(); seekTo(0); }
    else if (k === 'end') { e.preventDefault(); seekTo(geo.current.total); }
  };
  const keyRef = useRef(onKey); keyRef.current = onKey;
  useEffect(() => {
    const down = e => keyRef.current(e);
    const up = e => { if (e.code !== 'Space' || isField(e.target)) return; const held = spaceHeld.current; spaceHeld.current = null; if (held && !held.panned) api.current?.toggle(); }; // (Space tapped: play / pause; held while dragging: the hand)
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ---- the timeline ----
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    const fit = () => setWidth(Math.max(200, el.clientWidth - LEFT - PAD * 2));
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  useLayoutEffect(() => { // (zoomed around the pointer: the second under it stays under it)
    const a = anchor.current, el = scroller.current;
    if (!a || !el || !pps) return;
    anchor.current = null;
    el.scrollLeft = Math.max(0, a.seconds * pps - a.x);
  }, [pps]);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    const wheel = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) { // (zoom the time, around the pointer: Ctrl or Alt + wheel, After Effects)
        e.preventDefault();
        const r = el.getBoundingClientRect(), x = e.clientX - r.left - LEFT - PAD, k = geo.current.pps;
        anchor.current = {x, seconds: (x + el.scrollLeft) / Math.max(1e-6, k)};
        setZoom(z => Math.max(1, Math.min(60, z * Math.exp(-e.deltaY * 0.0022))));
      } else if (e.shiftKey) { e.preventDefault(); el.scrollLeft += e.deltaY || e.deltaX; }
    };
    el.addEventListener('wheel', wheel, {passive: false});
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  const secondsAt = clientX => { const el = scroller.current, r = el.getBoundingClientRect(); return (clientX - r.left + el.scrollLeft - LEFT - PAD) / Math.max(1e-6, geo.current.pps); };
  // the timeline's magnet (on with the picture's): the playhead, the slides' starts, the work area, the other layers' ends and keyframes
  const snapTo = (t, d) => {
    if (!snapRef.current) return null;
    d.cands ??= [timeRef.current, ...(geo.current.timeline?.items.map(i => i.start) ?? []), ...(work ? [work.from, work.to] : []), ...layersRef.current.filter(l => !d.ids?.includes(l.id)).flatMap(l => [l.from, l.to, ...keyTimes(l)])];
    const k = geo.current.pps;
    let best = null;
    for (const c of d.cands) { const gap = Math.abs(c - t) * k; if (gap < SNAP_PX && (!best || gap < best.gap)) best = {c, gap}; }
    return best?.c ?? null;
  };
  const snap = (t, d) => snapTo(t, d) ?? t;
  const keysIn = r => { // (the keyframes a rectangle drawn on the tracks takes in: their middles)
    const seen = new Set(), out = [];
    for (const el of scroller.current?.querySelectorAll('.sb-ve-key[data-id]') ?? []) {
      const b = el.getBoundingClientRect(), x = (b.left + b.right) / 2, y = (b.top + b.bottom) / 2;
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const props = el.dataset.props ? el.dataset.props.split(',') : null, pick = {id: el.dataset.id, t: Number(el.dataset.t), props}, sig = `${pick.id}|${pick.t}|${propsKey(props)}`;
      if (!seen.has(sig)) { seen.add(sig); out.push(pick); }
    }
    return out;
  };
  const dropAt = (clientY, ids) => { // (where the names dragged go: before the first layer whose middle is under the pointer)
    const rows = [...(scroller.current?.querySelectorAll('.sb-ve-group[data-layer]') ?? [])].filter(el => !ids.includes(el.dataset.layer)), top = tlIn.current?.getBoundingClientRect().top ?? 0;
    for (let n = 0; n < rows.length; n++) { const r = rows[n].getBoundingClientRect(); if (clientY < (r.top + r.bottom) / 2) return {at: n, y: r.top - top}; }
    const last = rows.at(-1)?.getBoundingClientRect();
    return {at: rows.length, y: last ? last.bottom - top : null};
  };
  const onLinePress = e => { // the ruler or the rows of the slides: the playhead; an empty part of a layer's track: a rectangle that picks keyframes (a click: the playhead)
    if (menuRef.current) setMenu(null);
    if (e.button !== 0 || e.target.closest('.sb-ve-left, .sb-ve-bar, .sb-ve-key, .sb-ve-clip, .sb-ve-seg, .sb-ve-spanmark, .sb-ve-work-x')) return;
    const el = scroller.current, r = el.getBoundingClientRect();
    if (e.clientY - r.top > el.clientHeight || e.clientX - r.left > el.clientWidth) return; // (the scrollbars)
    e.preventDefault(); el.setPointerCapture(e.pointerId);
    if (e.target.closest('.sb-ve-row--layer, .sb-ve-row--prop')) { drag.current = {type: 'tbox', x0: e.clientX, y0: e.clientY, add: e.shiftKey || e.ctrlKey || e.metaKey, base: keySelRef.current, moved: false}; return; }
    drag.current = {type: 'scrub'};
    api.current?.scrubStart(); api.current?.scrubTo(secondsAt(e.clientX));
  };
  const onLineMove = e => {
    const d = drag.current;
    if (!d) return;
    if (d.type === 'scrub') { api.current?.scrubTo(secondsAt(e.clientX)); return; }
    if (d.type === 'tbox') {
      if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 4) return;
      d.moved = true;
      const r = rectOf({x: d.x0, y: d.y0}, {x: e.clientX, y: e.clientY}), inR = tlIn.current.getBoundingClientRect(), box = tboxEl.current;
      if (box) { box.style.display = ''; box.style.left = `${r.left - inR.left}px`; box.style.top = `${r.top - inR.top}px`; box.style.width = `${r.right - r.left}px`; box.style.height = `${r.bottom - r.top}px`; }
      if (!d.raf) d.raf = requestAnimationFrame(() => { d.raf = 0; if (drag.current !== d) return; const got = keysIn(r); setKeySel(d.add ? [...d.base, ...got.filter(k => !d.base.some(b => sameKey(b, k)))] : got.length ? got : NONE); });
      return;
    }
    if (d.type === 'reorder') {
      if (!d.moved && Math.abs(e.clientY - d.y0) < 4) return;
      if (!d.moved) { d.moved = true; try { scroller.current.setPointerCapture(e.pointerId); } catch {} } // (held only once it moves: a double-click on the name still renames it)
      const got = dropAt(e.clientY, d.ids), line = dropEl.current;
      d.at = got.at;
      if (line) { line.style.display = got.y == null ? 'none' : ''; line.style.top = `${got.y ?? 0}px`; }
      return;
    }
    if (!d.moved && Math.abs(e.clientX - d.x0) < 3) return;
    d.moved = true;
    const dt = (e.clientX - d.x0) / Math.max(1e-6, geo.current.pps);
    if (d.type === 'bar') { // (all the layers picked, by the same time; their in or their out taken by the magnet)
      const l = layerOf(d.id);
      if (!l) return;
      const a = snapTo(l.from + dt, d), b = a == null ? snapTo(l.to + dt, d) : null;
      const by = Math.max(a != null ? a - l.from : b != null ? b - l.to : dt, -Math.min(...d.ids.map(id => layerOf(id)?.from ?? 0)));
      setDraft(new Map(d.ids.map(id => layerOf(id)).filter(Boolean).map(x => [x.id, shiftLayer(x, by)])));
    } else if (d.type === 'in' || d.type === 'out') {
      const l = layerOf(d.id);
      if (l) setDraft(new Map([[l.id, trimLayer(l, d.type === 'in' ? 'from' : 'to', snap((d.type === 'in' ? l.from : l.to) + dt, d))]]));
    } else if (d.type === 'sin' || d.type === 'sout') { // (an element of the slides trimmed: it is not seen before / after; its slides keep their own time)
      const at = snap(d.t0 + dt, d), total0 = geo.current.total;
      setSpanDraft({name: d.name, from: d.type === 'sin' ? Math.max(0, Math.min(at, d.win.to - 0.1)) : d.win.from, to: d.type === 'sout' ? Math.min(total0, Math.max(at, d.win.from + 0.1)) : d.win.to});
    } else if (d.type === 'keys') { // (all the keyframes picked, by the same time)
      const by = Math.max(snap(d.t + dt, d) - d.t, -Math.min(...d.keys.map(k => k.t)));
      d.dt = by;
      setDraft(new Map([...byLayer(d.keys)].map(([id, ks]) => [id, layerOf(id)]).filter(([, l]) => l).map(([id, l]) => [id, shiftKeys(l, d.keys.filter(k => k.id === id), by)])));
    }
  };
  const onLineUp = e => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.type === 'scrub') { api.current?.scrubEnd(); return; }
    if (d.type === 'tbox') {
      cancelAnimationFrame(d.raf);
      if (tboxEl.current) tboxEl.current.style.display = 'none';
      if (!d.moved) { setKeySel(NONE); seekTo(secondsAt(e.clientX)); }
      return;
    }
    if (d.type === 'reorder') {
      if (dropEl.current) dropEl.current.style.display = 'none';
      if (!d.moved) { if (d.collapse) onSelection(plainOf(d.collapse)); return; }
      if (d.at == null) return;
      const order = [...layersRef.current].reverse().map(l => l.id), rest = order.filter(id => !d.ids.includes(id)), next = [...rest.slice(0, d.at), ...order.filter(id => d.ids.includes(id)), ...rest.slice(d.at)];
      if (next.join() !== order.join()) layerOps.order(next.reverse()); // (the timeline shows the front first; the layers are kept from the back)
      return;
    }
    if (d.type === 'sin' || d.type === 'sout') {
      const sd = spanDraftRef.current;
      setSpanDraft(null);
      if (d.moved && sd) { // (a window that holds the whole row is no window)
        const whole = sd.from <= d.A + 0.02 && sd.to >= d.B - 0.02;
        layerOps.setSpan(d.name, whole ? null : {from: sd.from > d.A + 0.02 ? sd.from : undefined, to: sd.to < d.B - 0.02 ? sd.to : undefined});
      }
      return;
    }
    const made = draftRef.current;
    setDraft(null);
    if (d.type === 'keys') {
      if (!d.moved) { if (d.collapse) setKeySel([d.collapse]); return; }
      if (made?.size) layerOps.changeMany(Object.fromEntries([...made].map(([id, l]) => [id, () => l])));
      setKeySel(d.keys.map(k => ({...k, t: Math.max(0, Math.round((k.t + (d.dt ?? 0)) * 1000) / 1000)})));
      return;
    }
    if (d.moved && made?.size) layerOps.changeMany(Object.fromEntries([...made].map(([id, l]) => [id, () => l])));
    else if (!d.moved && d.collapse) onSelection(plainOf(d.collapse));
  };
  const pressName = (e, l) => { // a layer's name: picked (Ctrl: one more or taken out; Shift: the run from the one picked last), dragged up or down: the stacking
    if (e.button !== 0 || e.target.closest('button, input')) return;
    if (menuRef.current) setMenu(null);
    const items = itemsOf(selRef.current), me = {type: 'layer', id: l.id}, was = hasItem(items, me);
    setKeySel(NONE);
    if (e.ctrlKey || e.metaKey) { const next = was ? items.filter(q => !sameItem(q, me)) : [...items, me]; if (next.length) onSelection(groupOf(next, was ? null : me)); else pickNone(); return; }
    if (e.shiftKey) {
      const order = [...layersRef.current].reverse().map(x => x.id), sel = selRef.current, from = sel?.type === 'layer' ? order.indexOf(sel.id) : -1, to = order.indexOf(l.id);
      if (from < 0) { onSelection(me); return; }
      const run = order.slice(Math.min(from, to), Math.max(from, to) + 1).map(id => ({type: 'layer', id}));
      onSelection(groupOf([...items.filter(q => !hasItem(run, q)), ...run], plainOf(sel)));
      return;
    }
    if (!was) onSelection(me);
    else if (!sameItem(plainOf(selRef.current), me)) onSelection(groupOf(items, me));
    drag.current = {type: 'reorder', ids: was ? layerIdsOf(selRef.current) : [l.id], y0: e.clientY, moved: false, collapse: was && items.length > 1 ? me : null};
  };
  const pressLayerPart = (e, type, l) => { // a bar or one of its ends (several layers picked: their bars move together)
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    if (menuRef.current) setMenu(null);
    const items = itemsOf(selRef.current), me = {type: 'layer', id: l.id}, was = hasItem(items, me), add = e.ctrlKey || e.metaKey || e.shiftKey;
    setKeySel(NONE);
    if (add) { const next = was ? items.filter(q => !sameItem(q, me)) : [...items, me]; if (next.length) onSelection(groupOf(next, was ? null : me)); else pickNone(); if (was) return; }
    else if (!was) onSelection(me);
    else if (!sameItem(plainOf(selRef.current), me)) onSelection(groupOf(items, me));
    if (l.locked) return;
    scroller.current.setPointerCapture(e.pointerId);
    const ids = type === 'bar' ? [...new Set([...(was || add ? layerIdsOf(selRef.current) : []), l.id])].filter(id => !layerOf(id)?.locked) : [l.id];
    drag.current = {type, id: l.id, ids, x0: e.clientX, moved: false, collapse: !add && was && items.length > 1 ? me : null};
  };
  const pressSpan = (e, type, r, win, A, B) => { // an end of an element of the slides: dragged, it trims it (it is not seen before / after)
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    if (menuRef.current) setMenu(null);
    scroller.current.setPointerCapture(e.pointerId);
    drag.current = {type, name: r.name, x0: e.clientX, moved: false, t0: type === 'sin' ? win.from : win.to, win, A, B};
  };
  const pressKey = (e, l, t, props) => { // a keyframe: picked (Shift / Ctrl: one more or taken out), dragged with all the others picked (the time is not moved: J / K go to it)
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    if (menuRef.current) setMenu(null);
    const me = {id: l.id, t, props}, list = keySelRef.current, was = list.some(k => sameKey(k, me)), add = e.ctrlKey || e.metaKey || e.shiftKey;
    const next = add ? (was ? list.filter(k => !sameKey(k, me)) : [...list, me]) : was ? list : [me];
    setKeySel(next);
    const items = itemsOf(selRef.current), lay = {type: 'layer', id: l.id};
    if (!hasItem(items, lay)) onSelection(add && items.length ? groupOf([...items, lay], lay) : lay);
    if (add && was) return;
    scroller.current.setPointerCapture(e.pointerId);
    drag.current = {type: 'keys', t, keys: next.filter(k => !layerOf(k.id)?.locked), ids: [], x0: e.clientX, moved: false, collapse: !add && was && next.length > 1 ? me : null};
  };

  // the layers as the timeline shows them (bars or keyframes being dragged: as they are going)
  const shownLayers = useMemo(() => (draft ? layers.map(l => draft.get(l.id) ?? l) : layers), [layers, draft]);
  // the elements of the slides: one row each (by name), a bar while it is on screen, ◆ where a slide of it starts
  const slideRows = useMemo(() => {
    if (!played.length) return [];
    const rows = new Map();
    played.forEach((f, i) => {
      const edit = edits.frames[f.id], seen = new Set(), own = script?.info.get(f.id)?.layers;
      (own ?? [...(f.layers ?? []), ...(edit?.inserts ?? [])]).forEach((l, z) => {
        const name = l.name || l.key;
        if (seen.has(name)) return;
        seen.add(name);
        const row = rows.get(name) ?? {name, kind: l.kind, at: new Map(), hidden: 0, z};
        row.at.set(i, l.key);
        if (edit?.hidden?.includes(l.key)) row.hidden++;
        row.z = Math.max(row.z, z);
        rows.set(name, row);
      });
    });
    const next = [...rows.values()].map(r => ({...r, all: r.at.size, off: r.hidden === r.at.size, segs: runsOf(played.length, i => r.at.has(i)).filter(s => s.value)})).sort((a, b) => b.z - a.z);
    const sign = next.map(r => `${r.name}|${r.kind}|${r.hidden}|${[...r.at].join()}`).join('\n'), was = rowsKept.current; // (a change of a look, a place or a size leaves the rows as they were: the same rows, not drawn again)
    if (was && was.sign === sign && was.played === played) return was.rows;
    rowsKept.current = {sign, played, rows: next};
    return next;
  }, [played, edits.frames, script]);
  slideRowsRef.current = slideRows;
  const toggleRow = (r, me) => { // (an element of the slides added to what is picked, or taken out: by its row)
    const items = itemsOf(selRef.current), mine = q => q.type === 'asset' && rowOfSel(q) === r, was = items.some(mine), next = was ? items.filter(q => !mine(q)) : [...items, me];
    if (next.length) onSelection(groupOf(next, was ? null : me)); else pickNone();
  };
  const pickRow = (row, add) => { // an element of the slides picked from its row: on the slide on, or the first slide it is on
    const t = timeRef.current, i = timeline ? locate(timeline, t)?.index ?? 0 : 0;
    const at = row.at.has(i) ? i : row.segs[0]?.from;
    if (at == null) return;
    const me = {type: 'asset', frame: played[at].id, key: row.at.get(at), name: row.name}; // (the time is not moved: the user, 2026-10-22)
    if (add) toggleRow(row, me); else onSelection(me);
  };
  const pickSeg = (e, r, s) => { // a bar of an element of the slides: it on the slide on now, or on the slide pressed
    const now0 = locate(timeline, timeRef.current)?.index ?? -1, i = r.at.has(now0) ? now0 : Math.max(s.from, Math.min(s.to, locate(timeline, secondsAt(e.clientX))?.index ?? s.from));
    const me = {type: 'asset', frame: played[i].id, key: r.at.get(i), name: r.name};
    if (e.shiftKey || e.ctrlKey || e.metaKey) toggleRow(r, me); else onSelection(me);
  };
  const ticks = useMemo(() => {
    if (!pps) return [];
    const step = STEPS.find(s => s * pps >= 64) ?? 120, minor = step / (step * pps / 5 >= 10 ? 5 : 2), out = [];
    for (let k = 0, t = 0; t <= total + 1e-6; k++, t = k * minor) out.push({t, major: Math.abs(t / step - Math.round(t / step)) < 1e-6});
    return out;
  }, [pps, total]);
  const tNow = now;
  const box = (from, to) => ({left: from * pps, width: Math.max(2, (to - from) * pps)});
  // What the twirls show (After Effects' U, UU and P S R T E, the user, 2026-10-28: "u to reveal all keyframes"): per layer, 'all' (the twirl) or the groups shown
  const groupsShown = l => { const r = reveal.get(l.id); return r === 'all' ? groupsOf(l) : r ? groupsOf(l).filter(g => r.has(g.id)) : NONE; };
  const toggleOpen = l => setReveal(prev => { const next = new Map(prev); if (prev.get(l.id)) next.delete(l.id); else next.set(l.id, 'all'); return next; });
  const revealTargets = () => { const ids = layerIdsOf(selRef.current), list = ids.length ? ids.map(layerOf).filter(Boolean) : layersRef.current; return list; }; // (the layers picked; none picked: all of them)
  const sameGroups = (cur, want) => !!cur && cur !== 'all' && cur.size === want.length && want.every(x => cur.has(x));
  const revealWith = (pick, add) => { // `pick(layer)` -> the group ids to show. The same pressed again folds them; Shift adds them to what is shown (or takes them out)
    const list = revealTargets();
    if (!list.length) return;
    setReveal(prev => {
      const next = new Map(prev), wants = list.map(l => [l, pick(l)]), folded = wants.every(([l, want]) => want.length > 0 && sameGroups(prev.get(l.id), want));
      for (const [l, want] of wants) {
        const cur = prev.get(l.id);
        let set;
        if (add) { set = cur === 'all' ? new Set(groupsOf(l).map(g => g.id)) : new Set(cur ?? []); const on = want.length > 0 && want.every(x => set.has(x)); for (const x of want) { if (on) set.delete(x); else set.add(x); } }
        else set = folded ? new Set() : new Set(want);
        if (set.size) next.set(l.id, set); else next.delete(l.id);
      }
      return next;
    });
  };
  const pressU = () => { const at = performance.now(), twice = at - lastU.current < U_TWICE; lastU.current = twice ? 0 : at; revealWith(twice ? modifiedGroups : animatedGroups, false); };
  const showGroup = (id, gid) => setReveal(prev => { const cur = prev.get(id); if (cur === 'all') return prev; const next = new Map(prev); next.set(id, new Set([...(cur ?? []), gid])); return next; }); // (an effect just added is shown)
  // effects added to layers: their group is shown, the numbers have their defaults
  const addFx = (ids, type) => {
    const list = ids.map(layerOf).filter(Boolean);
    if (!list.length) return;
    const made = list.map(l => [l.id, `fx:${newEffectId(l, type)}`]);
    layerOps.changeMany(Object.fromEntries(list.map(l => [l.id, x => addEffect(x, type).layer])));
    for (const [id, gid] of made) showGroup(id, gid);
  };
  const propValue = (l, p) => valueAt(l, p, tNow);
  const setProp = (l, props, values, merge) => layerOps.change(l.id, x => setLayerAt(x, tNow, Object.fromEntries(props.map((p, i) => [p, values[i]]))), merge);
  const animated = (l, props) => props.some(p => isAnimated(l, p));
  const toggleWatch = (l, props) => { const on = !animated(l, props); layerOps.change(l.id, x => props.reduce((cur, p) => setAnimated(cur, p, tNow, on), x)); };
  const keyHere = (l, props) => props.some(p => (l.keys ?? []).some(k => k[p] != null && Math.abs(k.t - tNow) < 1 / 60));
  const toggleKey = (l, props) => layerOps.change(l.id, x => (keyHere(x, props) ? props.reduce((cur, p) => removeKeyAt(cur, tNow, p), x) : setLayerAt(props.reduce((cur, p) => (isAnimated(cur, p) ? cur : setAnimated(cur, p, tNow, true)), x), tNow, Object.fromEntries(props.map(p => [p, valueAt(x, p, tNow)])))));
  const keyNav = (l, props, dir) => { const times = [...new Set(props.flatMap(p => keyTimes(l, p)))].sort((a, b) => a - b), to = dir < 0 ? [...times].reverse().find(x => x < tNow - 1e-3) : times.find(x => x > tNow + 1e-3); if (to != null) seekTo(to); };
  // A row of properties: its stopwatch, its name and its values (blue: drag or type), the keyframe before / now / after, and its keyframes on the track. `meta[i]`: {prop, name, unit, pct?, min?, max?, step?}
  const propRow = (l, g, meta) => {
    const props = g.props, anim = animated(l, props), vals = props.map(p => propValue(l, p)), here = keyHere(l, props), ktimes = [...new Set(props.flatMap(p => keyTimes(l, p)))], isFx = !!g.fx;
    return <div key={g.id} className={`sb-ve-row sb-ve-row--prop${isFx ? ' is-fx' : ''}`}>
      <div className="sb-ve-left">
        <button type="button" className={`sb-ve-watch${anim ? ' is-on' : ''}`} onMouseDown={noFocus} onClick={() => toggleWatch(l, props)} title={anim ? 'Stop animating it (keeps its value now)' : 'Animate it: a keyframe now'} aria-label={`Animate ${isFx ? meta[0].name : g.label}`} aria-pressed={anim}>{ICON.watch}</button>
        <span className="sb-ve-prop">{isFx ? meta[0].name : g.label}</span>
        <span className="sb-ve-vals">{props.map((p, i) => { const m = meta[i]; return <Scrub key={p} value={m.pct ? vals[i] * 100 : vals[i]} unit={m.unit} digits={m.step && m.step < 1 ? 1 : 0} step={m.step ?? 1} title={m.name} onChange={v => setProp(l, [p], [m.pct ? Math.max(0, Math.min(100, v)) / 100 : m.min != null ? Math.max(m.min, Math.min(m.max, v)) : v], `prop:${l.id}:${p}`)}/>; })}</span>
        {anim && <span className="sb-ve-nav">
          <button type="button" onMouseDown={noFocus} onClick={() => keyNav(l, props, -1)} title="The keyframe before" aria-label="The keyframe before">{ICON.keyPrev}</button>
          <button type="button" className={here ? 'is-on' : ''} onMouseDown={noFocus} onClick={() => toggleKey(l, props)} title={here ? 'Take the keyframe off' : 'A keyframe now'} aria-label="Keyframe now">{ICON.key}</button>
          <button type="button" onMouseDown={noFocus} onClick={() => keyNav(l, props, 1)} title="The keyframe after" aria-label="The keyframe after">{ICON.keyNext}</button>
        </span>}
      </div>
      <div className="sb-ve-right" style={{width: trackW}}>
        {ktimes.map(t => <i key={t} className={`sb-ve-key${keyPicked(l.id, t, props) ? ' is-picked' : ''}`} data-id={l.id} data-t={t} data-props={props.join()} style={{left: t * pps}} onPointerDown={e => pressKey(e, l, t, props)} onContextMenu={e => menuOnKey(e, l, t, props)} title={`${isFx ? meta[0].name : g.label}: keyframe at ${tc(t)}`}/>)}
      </div>
    </div>;
  };
  // An effect: its head (on / off, its name, remove), then a row for each of its numbers
  const fxRows = (l, g) => {
    const e = l.fx?.find(x => x.id === g.fx);
    if (!e) return null;
    const meta = paramsOf(l, g);
    return <Fragment key={g.id}>
      <div className="sb-ve-row sb-ve-row--prop sb-ve-row--fxhead">
        <div className="sb-ve-left">
          <button type="button" className={`sb-ve-sw${e.on === false ? '' : ' is-on'}`} onMouseDown={noFocus} onClick={() => layerOps.change(l.id, x => patchEffect(x, e.id, {on: e.on === false}))} title={e.on === false ? 'The effect is off: click to turn it on' : 'The effect is on: click to turn it off'} aria-label="The effect on or off">{ICON.eye}</button>
          <span className="sb-ve-fxname">{g.label}</span>
          <button type="button" className="sb-ve-x" onMouseDown={noFocus} onClick={() => layerOps.change(l.id, x => removeEffect(x, e.id))} title="Remove the effect" aria-label="Remove the effect">{ICON.close}</button>
        </div>
        <div className="sb-ve-right" style={{width: trackW}}/>
      </div>
      {g.props.map((p, i) => propRow(l, {id: `${g.id}:${p}`, label: meta[i].name, props: [p], fx: g.fx}, [meta[i]]))}
    </Fragment>;
  };
  const pickedIds = new Set(layerIdsOf(selection)), many = itemsOf(selection).length > 1;
  const keyOffset = drag.current?.type === 'keys' && drag.current.moved ? drag.current.dt ?? 0 : 0; // (keyframes being dragged: still lit where they are going)
  const keyPicked = (id, t, props) => keySel.some(k => k.id === id && Math.abs(k.t + keyOffset - t) < 1 / 60 && propsKey(k.props) === propsKey(props));
  const trackW = total * pps;
  const pickedRows = new Set(itemsOf(selection).filter(q => q.type === 'asset').map(q => rowOfSel(q)?.name).filter(Boolean)), pickedRowsKey = [...pickedRows].join('\n');
  // the rows of the slides and the slides themselves: drawn again only when they change (not for a drag of a layer, the time held, a keyframe picked)
  const slidesPart = useMemo(() => <>
    <div className="sb-ve-row sb-ve-row--group"><div className="sb-ve-left"><span>From the slides</span></div><div className="sb-ve-right" style={{width: trackW}}/></div>
    {timeline && slideRows.map(r => {
      const A = timeline.items[r.segs[0].from].start, B = timeline.items[r.segs.at(-1).to + 1]?.start ?? total;
      const sp = spanDraft?.name === r.name ? spanDraft : spans[r.name], win = {from: Math.max(A, Math.min(B, sp?.from ?? A)), to: Math.max(A, Math.min(B, sp?.to ?? B))};
      return <div key={r.name} className={`sb-ve-row sb-ve-row--slide${pickedRows.has(r.name) ? ' is-picked' : ''}${r.off ? ' is-off' : ''}${sp ? ' is-trimmed' : ''}`} style={{'--c': SLIDE_COLOR}}>
      <div className="sb-ve-left" onPointerDown={e => { if (e.button === 0 && !e.target.closest('button')) pickRow(r, e.shiftKey || e.ctrlKey || e.metaKey); }}>
        <button type="button" className={`sb-ve-sw${r.off ? '' : ' is-on'}`} onMouseDown={noFocus} onClick={() => assetOps.hide([...r.at].map(([i, key]) => ({frame: played[i].id, key})), !r.off)} title={r.off ? 'Show it in this video' : 'Hide it in this video'} aria-label={r.off ? 'Show it in this video' : 'Hide it in this video'}>{ICON.eye}</button>
        <span className="sb-ve-sw"/>
        <span className="sb-ve-twirl"/>
        <i className="sb-ve-label sb-ve-label--slide"/>
        <span className="sb-ve-name" title={r.name}>{r.name}</span>
        {sp && <button type="button" className="sb-ve-fx is-on" onMouseDown={noFocus} onClick={() => layerOps.setSpan(r.name, null)} title={`Trimmed to ${tc(win.from)} → ${tc(win.to)}: click to show it the whole time`} aria-label="Show it the whole time">trim ×</button>}
      </div>
      <div className="sb-ve-right" style={{width: trackW}}>
        {r.segs.map(s => <div key={`g${s.from}`} className="sb-ve-seg is-ghost" style={box(timeline.items[s.from].start, timeline.items[s.to + 1]?.start ?? total)} onPointerDown={e => { if (e.button !== 0) return; e.stopPropagation(); pickSeg(e, r, s); }}/>)}
        {r.segs.map(s => {
          const a = timeline.items[s.from].start, b = timeline.items[s.to + 1]?.start ?? total, ca = Math.max(a, win.from), cb = Math.min(b, win.to);
          if (cb <= ca) return null;
          return <div key={s.from} className="sb-ve-seg" style={box(ca, cb)} title={`${r.name} · ${tc(ca)} → ${tc(cb)}: its slides keep their own time; drag its ends to trim it`} onPointerDown={e => { if (e.button !== 0) return; e.stopPropagation(); pickSeg(e, r, s); }}>
            {Array.from({length: s.to - s.from + 1}, (_, k) => s.from + k).filter(i => timeline.items[i].start >= ca - 1e-6 && timeline.items[i].start <= cb).map(i => <i key={i} className="sb-ve-dot" style={{left: (timeline.items[i].start - ca) * pps}}/>)}
          </div>;
        })}
        <i className="sb-ve-spanmark sb-ve-spanmark--in" style={{left: win.from * pps}} onPointerDown={e => pressSpan(e, 'sin', r, win, A, B)} title="Trim: it is not seen before this"/>
        <i className="sb-ve-spanmark sb-ve-spanmark--out" style={{left: win.to * pps}} onPointerDown={e => pressSpan(e, 'sout', r, win, A, B)} title="Trim: it is not seen after this"/>
      </div>
    </div>; })}
    <div className="sb-ve-row sb-ve-row--slides">
      <div className="sb-ve-left"><span className="sb-ve-sw"/><span className="sb-ve-sw"/><span className="sb-ve-twirl"/><i className="sb-ve-label sb-ve-label--slides"/><span className="sb-ve-name">Slides</span></div>
      <div className="sb-ve-right" style={{width: trackW}}>
        {timeline && played.map((f, i) => <button key={`${f.id}-${i}`} ref={el => { clipEls.current[i] = el; }} type="button" className={`sb-ve-clip${shown.current === i ? ' is-on' : ''}`} style={{...box(timeline.items[i].start, timeline.items[i + 1]?.start ?? total), backgroundImage: f.thumb ? `url("${f.thumb}")` : undefined}} onMouseDown={noFocus} onClick={() => seekTo(settledAt(timeline, i))} onDoubleClick={() => revealRef.current?.(f.id)} title={`${label(i)} · ${tc(timeline.items[i].start)} · double-click: that frame on the board`}><span>{placed[f.id]?.index ?? ''}</span></button>)}
      </div>
    </div>
  </>, [timeline, slideRows, pickedRowsKey, pps, trackW, total, played, placed, label, assetOps, spans, spanDraft, layerOps]); // eslint-disable-line react-hooks/exhaustive-deps

  const viewerCursor = tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair';
  const takeKeys = e => { const a = document.activeElement; if (a && a !== document.body && isField(a) && !isField(e.target)) a.blur(); }; // (the user, 2026-10-22: "still doesn't work, the jk nor ctrl+z": a field of the sidebar used before kept the keyboard, the picture's presses do not take it)
  const timeShown = `${tcf(timeRef.current)} / ${tcf(total)}`;
  return <div ref={rootEl} className="sb-ve" onPointerDownCapture={takeKeys} data-sb-ui="" role="dialog" aria-label={`Video editor: ${title}`} onDragOver={e => { if ([...(e.dataTransfer?.items ?? [])].some(i => i.kind === 'file')) e.preventDefault(); }} onDrop={onDrop}>
    <header className="sb-ve-top">
      <button type="button" className="sb-ve-back" onMouseDown={noFocus} onClick={onClose} title="Back to the board (Esc)">{ICON.back}<span>Board</span></button>
      <div className="sb-ve-tools" role="toolbar" aria-label="Tools">
        {TOOLS.map(([id, name, icon]) => <button key={id} type="button" className={`sb-ve-icon${tool === id ? ' is-on' : ''}`} onMouseDown={noFocus} onClick={() => setTool(id)} title={name} aria-label={name} aria-pressed={tool === id}>{icon}</button>)}
        <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={() => fileEl.current?.click()} title="Image (I; or drop / paste a picture)" aria-label="Add an image">{ICON.image}</button>
        <input ref={fileEl} type="file" accept="image/*" multiple hidden onChange={e => { addImages([...e.target.files]); e.target.value = ''; }}/>
        <button type="button" className={`sb-ve-icon${guides ? ' is-on' : ''}`} onMouseDown={noFocus} onClick={onGuides} title="Guide lines (Shift+G)" aria-label="Guide lines" aria-pressed={guides}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M14.5 3.5v17M3.5 9.5h17M3.5 14.5h17" strokeDasharray="2 2"/></svg></button>
        <button type="button" className={`sb-ve-icon${snapOn ? ' is-on' : ''}`} onMouseDown={noFocus} onClick={toggleSnap} title="Snapping: what is moved is taken by the picture's sides and middle, the other layers and the guide lines; on the timeline by the playhead, the slides, the layers' ends and keyframes" aria-label="Snapping" aria-pressed={snapOn}>{ICON.magnet}</button>
      </div>
      <div className="sb-ve-title"><b>{title || 'Video'}</b><small>{played.length ? `${played.length} slide${played.length === 1 ? '' : 's'} · ${tc(total)} · ${layers.length} layer${layers.length === 1 ? '' : 's'}${many ? ` · ${itemsOf(selection).length} picked` : ''}` : 'Making the video…'}</small></div>
      <span className="sb-ve-fill"/>
      {process.env.NODE_ENV !== 'production' && board && title && <ExportButton board={board} title={title}/>}{/* (an MP4 of this video: development only, it needs the dev server, Chrome and ffmpeg) */}
      <button type="button" className={`sb-ve-icon${help ? ' is-on' : ''}`} onMouseDown={noFocus} onClick={() => setHelp(h => !h)} title="Shortcuts (?)" aria-label="Shortcuts" aria-pressed={help}>{ICON.help}</button>
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">{ICON.undo}</button>
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">{ICON.redo}</button>
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={onClose} title="Close (Esc)" aria-label="Close the video editor">{ICON.close}</button>
    </header>

    <div ref={viewEl} className={`sb-ve-view is-${tool}`} style={{cursor: viewerCursor}} onPointerDown={onViewDown} onPointerMove={onViewMove} onPointerUp={onViewUp} onPointerCancel={onViewUp} onPointerLeave={hideHover} onDoubleClick={onViewDouble} onContextMenu={onViewMenu}>
      <div ref={compEl} className="sb-ve-comp" style={{transform: viewCss(viewRef.current)}}>
        {playerEl}
        <StoryboardPathEditor ref={pathEd} layer={selection?.type === 'layer' && !selection.group ? layers.find(l => l.id === selection.id) ?? null : null} now={now} tool={tool} zoom={view.z} toStage={toStage} layersRoot={() => api.current?.layersRoot()} panning={() => !!spaceHeld.current}
          onChange={(id, change, merge) => layerOps.change(id, change, merge)} onCreate={addLayer} onRemove={id => { layerOps.remove(id); pickNone(); }}/>
        {motion && motion.points.length > 0 && <svg className="sb-ve-path" viewBox="0 0 1600 900" preserveAspectRatio="none">
          {motion.lines.some(l => l.length > 1) && <>
            <path className="sb-ve-path-edge" d={pathD(motion.lines)}/>
            <path className={motion.tracking ? 'is-tracking' : ''} d={pathD(motion.lines)}/>
          </>}
          {motion.still && motion.points[0] && <text x={motion.points.find(q => q.i === nowIndex)?.x ?? motion.points[0].x} y={(motion.points.find(q => q.i === nowIndex)?.y ?? motion.points[0].y) - 12 / view.z} fontSize={11 / view.z} textAnchor="middle">{motion.kind === 'layer' ? 'No position keyframes: it does not move' : 'It does not move in this video'}</text>}
          {motion.points.map((q, n) => ({q, n, on: Math.abs(q.t - now) < 0.02 || (motion.kind === 'asset' && q.i === nowIndex)})).sort((a, b) => a.on - b.on).map(({q, n, on}) => { const s = 5 / view.z; return <rect key={n} className={on ? 'is-on' : ''} x={q.x - s} y={q.y - s} width={2 * s} height={2 * s} onPointerDown={e => onPathDown(e, n)}><title>{`${tc(q.t)} · drag to move it there${motion.kind === 'asset' ? ' (this slide)' : ''}; a click: the video there`}</title></rect>; })}
        </svg>}
        {guides && guideLines && <svg className="sb-guides" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">{guideLines.x.map(x => <line key={`x${x}`} x1={x} x2={x} y1={0} y2={900}/>)}{guideLines.y.map(y => <line key={`y${y}`} x1={0} x2={1600} y1={y} y2={y}/>)}</svg>}
        <svg ref={snapEl} className="sb-ve-snap" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true"/>
      </div>
      <div ref={marksEl} className="sb-ve-marks" aria-hidden="true"/>
      <div ref={hoverEl} className="sb-ve-hover" style={{display: 'none'}} aria-hidden="true"/>
      <div ref={gizmo} className="sb-ve-gizmo" style={{display: 'none'}}>
        {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => <i key={h} className={`sb-ve-handle sb-ve-handle--${h}`} data-h={h} onPointerDown={onHandleDown}/>)}
        <i className="sb-ve-handle sb-ve-handle--rot" data-h="rot" onPointerDown={onHandleDown} title="Turn (Shift: by 15°)"/>
      </div>
      <div ref={boxEl} className="sb-ve-marquee" style={{display: 'none'}} aria-hidden="true"/>
      <div ref={pinsEl} className="sb-ve-pins">{/* the comments' pins: only here, never in the video (placed by `placePins`) */}
        {comments.map((c, n) => <div key={c.id} data-id={c.id} role="button" aria-label={`Comment ${n + 1}${c.text.trim() ? `: ${c.text.trim()}` : ''}`} className={`sb-ve-pin${selection?.type === 'comment' && selection.id === c.id ? ' is-on' : ''}${c.x > STAGE_W * 0.6 ? ' is-flip' : ''}`}
          onPointerDown={e => onPinDown(e, c)} onContextMenu={e => menuOnPin(e, c)} onDoubleClick={e => { e.stopPropagation(); focusComment(); }}>
          <b>{n + 1}</b><span className="sb-ve-pin-text">{c.text.trim() ? c.text : 'No words yet'}</span>
        </div>)}
      </div>
      {drawBox && <div className={`sb-ve-draw sb-ve-draw--${drawBox.kind}`} style={{left: drawBox.left, top: drawBox.top, width: drawBox.width, height: drawBox.height}}/>}
      <div className="sb-ve-mag" onPointerDown={e => e.stopPropagation()}>
        <select value={view.fit ? 'fit' : ZOOMS.find(z => Math.abs(z - view.z) < 1e-3) ?? 'now'} onChange={e => { const pick = e.target.value; e.target.blur(); if (pick === 'fit') { fitView(true); return; } const el = viewEl.current, z = Number(pick), v = viewRef.current, x = el.clientWidth / 2, y = el.clientHeight / 2; animateView({x: x - (x - v.x) * z / v.z, y: y - (y - v.y) * z / v.z, z, fit: false}); }} aria-label="Zoom the picture" title="Zoom (wheel on the picture; Ctrl + / − / 0)">
          <option value="fit">Fit</option>
          {!view.fit && !ZOOMS.some(z => Math.abs(z - view.z) < 1e-3) && <option value="now">{Math.round(view.z * 100)}%</option>}
          {ZOOMS.map(z => <option key={z} value={z}>{z * 100}%</option>)}
        </select>
      </div>
      {help && <div className="sb-help sb-ve-help" role="dialog" aria-label="Shortcuts of the video editor" onPointerDown={e => e.stopPropagation()}>
        <button type="button" className="sb-ve-help-x" onClick={() => setHelp(false)} aria-label="Close the shortcuts">{ICON.close}</button>
        {SHORTCUTS.map(([group, rows]) => <div key={group}><h3>{group}</h3><dl>{rows.map(([keys, what]) => <div key={keys} className="sb-ve-help-row"><dt>{keys}</dt><dd>{what}</dd></div>)}</dl></div>)}
      </div>}
    </div>

    <div className="sb-ve-transport">
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={() => slideAt(-1)} title="The slide before (←)" aria-label="The slide before">{ICON.prev}</button>
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={() => stepFrames(-1)} title="A frame back (Page Up; Shift: ten)" aria-label="A frame back">{ICON.framePrev}</button>
      <button type="button" className="sb-ve-play" onMouseDown={noFocus} onClick={() => api.current?.toggle()} title={playing ? 'Pause (Space)' : 'Play (Space)'} aria-label={playing ? 'Pause' : 'Play'}>{playing ? ICON.pause : ICON.play}</button>
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={() => stepFrames(1)} title="A frame on (Page Down; Shift: ten)" aria-label="A frame on">{ICON.frameNext}</button>
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={() => slideAt(1)} title="The slide after (→)" aria-label="The slide after">{ICON.next}</button>
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={() => keyStep(-1)} disabled={!selection || selection.type === 'look' || selection.type === 'comment'} title="The keyframe before of what is picked (J)" aria-label="The keyframe before">{ICON.keyPrev}<i className="sb-ve-keymark"/></button>
      <button type="button" className="sb-ve-icon" onMouseDown={noFocus} onClick={() => keyStep(1)} disabled={!selection || selection.type === 'look' || selection.type === 'comment'} title="The keyframe after of what is picked (K)" aria-label="The keyframe after"><i className="sb-ve-keymark"/>{ICON.keyNext}</button>
      <button type="button" className={`sb-ve-icon${loop ? ' is-on' : ''}`} onMouseDown={noFocus} onClick={() => setLoop(on => !on)} title={work ? `Loop the work area, ${tc(work.from)} → ${tc(work.to)} (B / N)` : 'Loop (B / N: a work area to loop)'} aria-label="Loop" aria-pressed={loop}>{ICON.loop}</button>
      <select className="sb-ve-speed" value={speed} onChange={e => { setSpeed(Number(e.target.value)); e.target.blur(); }} aria-label="Speed" title="The speed it plays at">{SPEEDS.map(s => <option key={s} value={s}>{s}×</option>)}</select>
      {typingTime
        ? <input className="sb-ve-time-in" defaultValue={tcf(timeRef.current)} autoFocus aria-label="Go to a time" onFocus={e => e.target.select()} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.target.value = ''; e.target.blur(); } }} onBlur={e => { setTypingTime(false); const s = parseTc(e.target.value); if (s != null) { api.current?.stop(); seekTo(s); } }}/>
        : <span ref={timeEl} className="sb-ve-time" onClick={() => setTypingTime(true)} title="Click to type a time (0;00;01;07, 1:08.4, or 68.4)">{timeShown}</span>}
      <span ref={slideEl} className="sb-ve-slide"/>
      <span className="sb-ve-fill"/>
      <label className="sb-ve-zoom" title="Zoom the timeline (Ctrl or Alt + wheel on it)">
        <span>Time zoom</span>
        <input type="range" min={0} max={1} step={0.001} value={Math.log(zoom) / Math.log(60)} onChange={e => setZoom(60 ** Number(e.target.value))} aria-label="Zoom the timeline"/>
      </label>
      <button type="button" className="sb-ve-fitbtn" onMouseDown={noFocus} onClick={() => setZoom(1)} disabled={zoom === 1} title="The whole video in the timeline">Fit</button>
    </div>

    <div ref={scroller} className="sb-ve-tl" onPointerEnter={() => { hoverTl.current = true; }} onPointerLeave={() => { hoverTl.current = false; }} onPointerDown={onLinePress} onPointerMove={onLineMove} onPointerUp={onLineUp} onPointerCancel={onLineUp} onContextMenu={e => e.preventDefault()}>
      <div ref={tlIn} className="sb-ve-tl-in" style={{width: LEFT + trackW + PAD * 2}}>
        <div className="sb-ve-row sb-ve-row--ruler">
          <div className="sb-ve-left sb-ve-cols"><span className="sb-ve-col-sw" title="Shown">{ICON.eye}</span><span className="sb-ve-col-sw" title="Locked">{ICON.lock}</span><span>Layer name</span></div>
          <div className="sb-ve-right" style={{width: trackW}}>
            {work && <span className="sb-ve-work" style={{left: work.from * pps, width: Math.max(2, (work.to - work.from) * pps)}} title={`The work area: ${tc(work.from)} → ${tc(work.to)} (B / N; the loop plays it)`}><button type="button" className="sb-ve-work-x" onPointerDown={e => e.stopPropagation()} onClick={() => setWork(null)} title="Take the work area off" aria-label="Take the work area off">×</button></span>}
            {ticks.map(k => <i key={k.t} className={k.major ? 'is-major' : ''} style={{left: k.t * pps}}>{k.major && <b>{tc(k.t).replace(/\.0$/, '')}</b>}</i>)}
            {comments.map((c, n) => <span key={c.id} className={`sb-ve-cmark${selection?.type === 'comment' && selection.id === c.id ? ' is-on' : ''}${c.done ? ' is-done' : ''}`} style={{left: c.at * pps, '--w': `${COMMENT_SHOW.after * pps}px`}} onPointerDown={e => { if (e.button !== 0) return; e.stopPropagation(); setKeySel(NONE); pickComment(c); }} onDoubleClick={e => { e.stopPropagation(); api.current?.stop(); seekTo(c.at); }} onContextMenu={e => menuOnPin(e, c)}
              title={`Comment ${n + 1} at ${tc(c.at)}${c.text.trim() ? `: ${c.text.trim().slice(0, 140)}` : ''} (click: pick it, the playhead stays · double-click: go there · right-click: Delete)`}>{n + 1}</span>)}
            <span ref={knobEl} className="sb-ve-knob" aria-hidden="true"/>
          </div>
        </div>

        {/* the layers of the video, the front one first */}
        {[...shownLayers].reverse().map(l => {
          const shownGroups = groupsShown(l), isOpen = shownGroups.length > 0, on = pickedIds.has(l.id), times = keyTimes(l), color = labelOf(l).color;
          return <div key={l.id} data-layer={l.id} className={`sb-ve-group${on ? ' is-picked' : ''}${on && many && selection?.id === l.id ? ' is-primary' : ''}`}>
            <div className="sb-ve-row sb-ve-row--layer" onContextMenu={e => menuOnLayer(e, l)}>
              <div className="sb-ve-left" onPointerDown={e => pressName(e, l)}>
                <button type="button" className={`sb-ve-sw${l.hidden ? '' : ' is-on'}`} onMouseDown={noFocus} onClick={() => layerOps.change(l.id, {hidden: !l.hidden})} title={l.hidden ? 'Show' : 'Hide'} aria-label={l.hidden ? 'Show the layer' : 'Hide the layer'}>{ICON.eye}</button>
                <button type="button" className={`sb-ve-sw${l.locked ? ' is-on' : ''}`} onMouseDown={noFocus} onClick={() => layerOps.change(l.id, {locked: !l.locked})} title={l.locked ? 'Unlock' : 'Lock'} aria-label={l.locked ? 'Unlock the layer' : 'Lock the layer'}>{l.locked ? ICON.lock : null}</button>
                <button type="button" className={`sb-ve-twirl${isOpen ? ' is-open' : ''}`} onMouseDown={noFocus} onClick={() => toggleOpen(l)} aria-label={isOpen ? 'Fold its properties' : 'Show its properties'} aria-expanded={isOpen} title="Its properties (U: the ones with keyframes; P S R T E)">{ICON.twirl}</button>
                <button type="button" className="sb-ve-label" style={{background: color}} onMouseDown={noFocus} onClick={e => labelMenu(e, l)} title={`Label: ${labelOf(l).name} (click: the colors; they are the color of its bar)`} aria-label="Label color"/>
                {naming === l.id
                  ? <input className="sb-ve-rename" defaultValue={l.name} autoFocus onFocus={e => e.target.select()} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.target.value = l.name; e.target.blur(); } }} onBlur={e => { setNaming(null); const name = e.target.value.trim(); if (name && name !== l.name) layerOps.change(l.id, {name}); }}/>
                  : <span className="sb-ve-name" onDoubleClick={() => setNaming(l.id)} title="Double-click to rename · drag up or down: the stacking · Ctrl / Shift + click: several">{l.name}</span>}
                <button type="button" className={`sb-ve-fx${l.fx?.length ? ' is-on' : ''}`} onMouseDown={noFocus} onClick={e => effectsMenu(e, l)} title="Effects: Gaussian Blur, Drop Shadow, Glow, Brightness, Contrast, Saturation, Hue, Black & White, Sepia, Invert" aria-label="Effects">fx</button>
              </div>
              <div className="sb-ve-right" style={{width: trackW}}>
                <div className={`sb-ve-bar${l.hidden ? ' is-off' : ''}${l.locked ? ' is-locked' : ''}`} style={{...box(l.from, l.to), '--c': color}} onPointerDown={e => pressLayerPart(e, 'bar', l)} title={`${l.name}: ${tc(l.from)} → ${tc(l.to)} (drag to move it in time, with the others picked; its ends to trim it)`}>
                  <i className="sb-ve-trim sb-ve-trim--in" onPointerDown={e => pressLayerPart(e, 'in', l)}/>
                  <i className="sb-ve-trim sb-ve-trim--out" onPointerDown={e => pressLayerPart(e, 'out', l)}/>
                </div>
                {!isOpen && times.map(t => <i key={t} className={`sb-ve-key${keyPicked(l.id, t, null) ? ' is-picked' : ''}`} data-id={l.id} data-t={t} style={{left: t * pps}} onPointerDown={e => pressKey(e, l, t, null)} onContextMenu={e => menuOnKey(e, l, t, null)} title={`Keyframe at ${tc(t)} (Shift / Ctrl + click: several; F9: easy ease)`}/>)}
              </div>
            </div>
            {shownGroups.map(g => (g.fx ? fxRows(l, g) : propRow(l, g, paramsOf(l, g))))}
          </div>;
        })}
        {!layers.length && <div className="sb-ve-row sb-ve-row--hint"><div className="sb-ve-left"><span>No layers yet: R, E, T, I or drop a picture</span></div><div className="sb-ve-right" style={{width: trackW}}/></div>}

        {/* the elements of the slides, then the slides with their pictures */}
        {slidesPart}
        <div ref={tboxEl} className="sb-ve-tbox" style={{display: 'none'}} aria-hidden="true"/>
        <div ref={dropEl} className="sb-ve-drop" style={{display: 'none'}} aria-hidden="true"/>
        <div ref={headEl} className="sb-ve-head" aria-hidden="true"/>
      </div>
    </div>

    {menu && <div className="sb-ctx sb-ve-menu" role="menu" style={{left: menu.x, top: menu.y}} onContextMenu={e => e.preventDefault()}>
      {menu.items.map((it, n) => (it === '-' ? <hr key={n}/> : <button key={n} type="button" role="menuitem" disabled={!!it.off} onMouseDown={noFocus} onClick={() => { setMenu(null); it.run(menu); }}>{it.swatch && <i className="sb-ve-swatch" style={{background: it.swatch}}/>}{it.label}{it.keys && <kbd>{it.keys}</kbd>}</button>))}
    </div>}
  </div>;
}
