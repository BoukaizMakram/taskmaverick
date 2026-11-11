'use client';
// The storyboard's video (at the right of the first part of the demo, "The tablet and its Knowledge Base"): that
// line's frames played one after the other, drawn from what the board shows, so it follows the board as it is edited. Move an asset
// or retype words on a frame and the video has it (the next time it plays that frame, or at once if it
// is the one on). Picking a frame on the board (while the video is not playing) puts the video on it.
// A chat box with a pen (`anims`) is written by it as the video plays. A double-click on a text in the
// picture retypes it (the video stops on that frame): the words are changed on the board too. The text's look, place and boundaries are the VIDEO's own, changed with the
// text editor that comes with the double-click (components/StoryboardTextEditor.jsx, `onVideoText`; docs/storyboard.md, "The video's text editor"): its box is on the video, its fields
// in the sidebar (`onEditing`). A press on the video picks it: the sidebar is then its inspector (`onSelect`: the words, the colors); a double-click on a color (the background, the plate,
// the gray side, a yellow outline) picks it with that color's section in view (the user, 2026-10-21: "I would love to have it as an inspector on the right instead of popping up").
// The stages and the glide from one frame to the next are components/storyboardPlayerDom.js; the
// timing is lib/storyboardPlayer.mjs. It sits in the board's world, so it zooms and pans with it.
// `cell` (the user, 2026-10-12: "make them videos not slides"): a video of a line of videos (lib/storyboardCells.mjs) takes the place of a slide's picture: the
// screen and, over it, its controls (a big play button until it is played, a bar), in the frame it is in (its header and notes are the frame's).
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {FRAME, LAYOUT} from '@/lib/storyboardView.mjs';
import {clock, lineMarks, locate, posterAt, settledAt} from '@/lib/storyboardPlayer.mjs';
import {profileOf, withSpeed} from '@/lib/storyboardVideos.mjs';
import {activeLook, withVariation} from '@/lib/storyboardVariations.mjs';
import {ENGINE_BUILD, createPlayerEngine, directorOf} from './storyboardPlayerDom';
import {STAGE, assetsIn as assetsInStage, drawShape, editTargetAt, elementOf, guidesOf, isWords, keyOf, linesOf, parentScale, setLines, targetKey} from './storyboardDom';
import {connectorGeometry, connectorHit, drawLayers, drawSpans, hideReplaced} from './storyboardLayers';
import {STAGE_H, STAGE_W} from '@/lib/storyboardLayers.mjs';
import StoryboardPins, {showPins} from './StoryboardPins';
import StoryboardTextEditor from './StoryboardTextEditor';

const {bar: BAR, barGap: BAR_GAP, notesGap: NOTES_GAP, notes: NOTES_H} = LAYOUT;
export const PLAYER_HEAD = BAR + BAR_GAP;
const clamp01 = v => Math.min(1, Math.max(0, v));
const NO_LAYERS = [];

const Icon = {
  big: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>,
};

// A video far from the screen has no script yet: it is made when the video comes near (`armed`), not for all of them when the page
// opens (41 on Improved Quality, 90 ms; the user, 2026-10-22: "cache everything so it can make it super fast"). Until then its
// header and bar show the length and the line marks it had the last time, kept in this browser.
const clockKey = (board, title) => `storyboard:clock:${board}:${title}`;
function laterOf(board, title) {
  let kept = null;
  try { kept = JSON.parse(localStorage.getItem(clockKey(board, title)) || 'null'); } catch {}
  return {later: true, played: [], timeline: {total: Number(kept?.total) || 0, items: []}, info: new Map(), trace: null, marks: Array.isArray(kept?.marks) ? kept.marks : []};
}
function keepClock(board, title, total, marks) {
  try {
    const next = JSON.stringify({total: Math.round(total * 100) / 100, marks: marks.map(m => ({chapter: m.chapter, at: Math.round(m.at * 1e4) / 1e4}))});
    if (localStorage.getItem(clockKey(board, title)) !== next) localStorage.setItem(clockKey(board, title), next);
  } catch {}
}

// `editor`: the big picture of the video editor (components/StoryboardVideoEditor.jsx): no bar of its own, driven by `api` (play, stop, seek, scrub), telling the time
// each picture (`onClock`) and its script (`onScript`), from `startAt`. On the board a double-click retypes a text in the video (the user, 2026-10-30: "double clicking should let me edit it
// without changing how it was, and without opening the video editor"); a RIGHT-click is the video's menu (`onMenu(event, {at, point})`: the board's, with Open in the video editor,
// Duplicate, Export, Delete: the user, 2026-10-30), `at` the second it is on and `point` where on its 1600 x 900 picture (null: not on the picture).
// `pins` (the user, 2026-10-30: "the comments should be in /storyboard before going to video editor"): the comments of the video as pins over its picture, on the board too:
// {list (lib/storyboardComments.mjs), picked (the id picked), pick(c), move(c, {x, y}), menu(event, c), add({x, y}, second)}; `commentTool`: the board's Comment tool is on, a click on the
// picture puts a comment there (`pins.add`). A pin shows only in the scene it was put in, playing or held (the picked one always).
// A pin is NEVER in the picture: no export or clip draws it (the export keeps the screen and the layers only).
export default function StoryboardPlayer({frames: slides, title, edits, video, x, y, focus, lines, placed, onFrame, onText, onVideoText, onCaption, onSelect, onEditing, onMenu, pins = null, commentTool = false, onClock, onScript, onDrawn, api, startAt = null, editor: isEditor = false, cell = false}) {
  const screen = useRef(null), track = useRef(null), fill = useRef(null), knob = useRef(null), clockEl = useRef(null), labelEl = useRef(null), pinsEl = useRef(null);
  const engine = useRef(null), time = useRef(0), raf = useRef(0), last = useRef(0), seen = useRef(-1);
  const playingRef = useRef(false), scrubbing = useRef(false), resume = useRef(false), lastFocus = useRef(null), lastFrames = useRef(null);
  const rate = useRef(1), span = useRef(null);          // (the video editor's transport: its speed, and the part it plays round and round, {from, to}: the user, 2026-10-26)
  const [playing, setPlaying] = useState(false), [started, setStarted] = useState(false);
  const fresh = useRef(true);                           // (a cell not played yet: it shows its poster, and plays from the start)
  // The video is not the slides one after the other: the director drops the ones that are only the start of the next, and says what each needs
  const speed = edits.speed?.[title];                    // (the video's own speed, from the editor's inspector: letters a second, seconds a scene; the user, 2026-10-29)
  const look = activeLook(edits);                        // (the board's videos played another way: the variation picked, lib/storyboardVariations.mjs)
  const profile = useMemo(() => withVariation(withSpeed(profileOf(video?.video, title), speed), look), [video, title, speed, look]); // (a video that is paced and shown its own way: lib/storyboardVideos.mjs)
  // (made again only when what it is made of changes: this video's slides and their edits, the board's library, the shared looks, the captions. An edit on another video's slide leaves it
  // as it is, and the video is not drawn again: the user, 2026-10-22, "make the storyboard tool mooore ... faster"; every video made its script again at every edit, half a second each time)
  const made = useRef(null), host = useRef(null), [armed, setArmed] = useState(isEditor);
  const script = useMemo(() => {
    const deps = [video, profile, edits.library, edits.videoText, edits.captions, edits.looks, ...slides.flatMap(f => [f, edits.frames[f.id]])], was = made.current;
    if (was && was.deps.length === deps.length && was.deps.every((d, i) => d === deps[i])) return was.script;
    if (!armed) return laterOf(video?.video, title);
    const next = directorOf(slides, edits, video, profile);
    made.current = {deps, script: next};
    return next;
  }, [slides, edits, video, profile, armed, title]), frames = script.played, timeline = script.timeline;
  const session = useRef(0);                             // one text editing, from the double-click to Done: all that it changes is ONE step of Undo
  const editing = useRef(null);                          // the text being retyped in the picture
  const [editor, setEditor] = useState(null), editorRef = useRef(null), closedAt = useRef(0), holding = useRef(false); // the text whose look and box are being changed with it ({key, frame, targets}), and when the editor was last closed
  editorRef.current = editor;
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') (window.__sbScripts ??= {})[title] = script.trace; // (for looking at what the director made)
  const marks = useMemo(() => script.marks ?? lineMarks(frames, timeline).filter(m => m.at > 0), [script, frames, timeline]);
  useEffect(() => { if (!script.later) keepClock(video?.video, title, timeline.total, marks); }, [script, marks, timeline, video, title]);
  // the video's own layers (shapes, texts, images with keyframes: lib/storyboardLayers.mjs), drawn over its picture each picture (components/storyboardLayers.js)
  const vlayers = edits.layers?.[title]?.items ?? NO_LAYERS, vspans = edits.layers?.[title]?.spans ?? null, layersEl = useRef(null);
  const live = useRef({}); live.current = {frames, slides, edits, video, script, timeline, lines, placed, onFrame, onText, onVideoText, onCaption, onSelect, onEditing, onMenu, pins, onClock, onDrawn, vlayers, vspans};
  useEffect(() => { if (!script.later) onScript?.(script); }, [script, onScript]);
  useEffect(() => { drawLayers(layersEl.current, vlayers, time.current); hideReplaced(screen.current, vlayers, time.current); }, [vlayers]); // (a layer changed while the video is held)
  useEffect(() => { drawSpans(screen.current, vspans, time.current); }, [vspans]); // (an element of the slides trimmed while the video is held)
  // What the board's inspector is handed when this video is picked: its slides, and the look a part of a kind has on the frame it is on (the color an inspector field starts from)
  const picked = useMemo(() => ({title, frameIds: () => live.current.slides.map(f => f.id), lookOf: kind => engine.current?.kindLook(kind) ?? null}), [title]);
  const select = useCallback((extra = {}) => live.current.onSelect?.(picked, extra), [picked]);

  // The comments' pins over the picture (the board's, `pins`): only the ones of the scene it is on (the picked one always)
  const showHere = useCallback(() => { const p = live.current.pins; if (p) showPins(pinsEl.current, p.list, p.picked, time.current, live.current.script); }, []);
  useLayoutEffect(() => { showHere(); }, [pins, playing, showHere]); // (a comment placed, picked or moved; the video started or stopped)
  // What follows the time: the bar, the clock, which frame it is on (said to the board while it plays).
  const paint = useCallback(at => {
    const {timeline: tl, frames: list, lines: titles, placed: spots, onFrame: tell, onClock: tick} = live.current;
    showHere();
    drawLayers(layersEl.current, live.current.vlayers, time.current);
    hideReplaced(screen.current, live.current.vlayers, time.current);
    drawSpans(screen.current, live.current.vspans, time.current);
    tick?.(time.current, playingRef.current);
    const p = tl.total ? time.current / tl.total : 0;
    if (fill.current) fill.current.style.transform = `scaleX(${p})`;
    if (knob.current) knob.current.style.left = `${p * 100}%`;
    if (clockEl.current) clockEl.current.textContent = `${clock(time.current)} / ${clock(tl.total)}`;
    if (at && at.index !== seen.current) {
      seen.current = at.index;
      const frame = list[at.index];
      if (labelEl.current) labelEl.current.textContent = frame ? `${titles.find(l => l.id === frame.chapter)?.title ?? ''} · ${spots[frame.id]?.index ?? ''}` : '';
      tell?.(frame && (playingRef.current || scrubbing.current) ? frame.id : null);
    }
  }, [showHere]);
  const render = useCallback((ahead = false) => {
    const e = engine.current;
    if (!e) return;
    const {frames: list, edits: changes, video: data, script: plan} = live.current;
    e.setSource({frames: list, edits: changes, video: data, script: plan});
    try { paint(e.show(time.current, ahead)); } catch (error) { console.error('storyboard video:', error); } // (a frame the video cannot draw never takes the board down with it)
  }, [paint]);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (!playingRef.current) return;
    playingRef.current = false; setPlaying(false); seen.current = -1;
    live.current.onFrame?.(null);
  }, []);
  const loop = useCallback(now => {
    const total = live.current.timeline.total, round = span.current;
    time.current = Math.min(total, time.current + Math.min(0.1, (now - last.current) / 1000) * rate.current); // (a tab that was away does not jump)
    last.current = now;
    const back = !!round && time.current >= Math.min(total, round.to) - 1e-4; // (looping: from the start of its part again, drawn as a seek is)
    if (back) { time.current = round.from; seen.current = -1; }
    render(!back);
    if (!round && time.current >= total) { stop(); return; }
    raf.current = requestAnimationFrame(loop);
  }, [render, stop]);
  const play = useCallback(() => {
    const total = live.current.timeline.total, round = span.current;
    if (!total || playingRef.current) return;
    if (round && (time.current < round.from - 1e-3 || time.current >= Math.min(total, round.to) - 0.05)) time.current = round.from; // (looping: played from the start of its part when it is not in it)
    else if (!round && (time.current >= total - 0.05 || fresh.current)) time.current = 0; // at the end, or never played (a cell shows its poster): from the start
    fresh.current = false; setStarted(true);
    playingRef.current = true; setPlaying(true); seen.current = -1;
    last.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  }, [loop]);
  const toggle = () => (playingRef.current ? stop() : play());
  // A right-click on the video on the board (the user, 2026-10-30): it stops where it is and the board's menu opens (Open in the video editor, a comment here, Duplicate, Export, Delete).
  // The press has picked the video already (its inspector is the sidebar, with an export's progress). Over a text being retyped the browser's own menu stays.
  const openMenu = event => {
    if (editing.current || !live.current.onMenu) return;
    event.preventDefault(); event.stopPropagation();
    stop();
    const r = screen.current.getBoundingClientRect(), inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom, round = n => Math.round(n * 10) / 10;
    live.current.onMenu(event, {at: Math.round(time.current * 100) / 100, point: inside ? {x: round((event.clientX - r.left) / r.width * STAGE_W), y: round((event.clientY - r.top) / r.height * STAGE_H)} : null});
  };
  // The comments' pins (components/StoryboardPins.jsx): picked, dragged and right-clicked as the board says (`pins`)
  const pinsUi = pins ? <StoryboardPins rootRef={pinsEl} screen={() => screen.current} list={pins.list} picked={pins.picked} pick={pins.pick} move={pins.move} menu={pins.menu}/> : null;
  // The pointer rests on the video (it is going to press play): the first pen of a play is made ready now, not as the video starts (60 to 120 ms there). Not while the board is
  // moving under the pointer (a pan passes over every video; each would do its 60 ms), and not for a pointer that is only passing.
  const hovered = useRef(0);
  const warm = useCallback(() => {
    clearTimeout(hovered.current);
    hovered.current = setTimeout(() => { if (!playingRef.current && !document.querySelector('.sb-world.is-moving')) engine.current?.warm(); }, 250);
  }, []);
  const unwarm = useCallback(() => clearTimeout(hovered.current), []);
  useEffect(() => () => clearTimeout(hovered.current), []);
  // With the board's Comment tool on (the user, 2026-10-30: "no comment tool in /storyboard") a click on the picture puts a comment there instead of playing: at the point and the second it is on
  const placeComment = event => {
    const r = screen.current.getBoundingClientRect(), round = n => Math.round(n * 10) / 10;
    stop();
    live.current.pins.add({x: round((event.clientX - r.left) / r.width * STAGE_W), y: round((event.clientY - r.top) / r.height * STAGE_H)}, Math.round(time.current * 100) / 100);
  };
  const clickScreen = event => {
    if (event.detail > 1 || editing.current || performance.now() - closedAt.current < 400) return; // (the second click of a double-click retypes: it does not play; nor does the click that ends the editing)
    if (commentTool && live.current.pins?.add) { placeComment(event); return; }
    toggle();
  };

  // Retype a text in the picture (double-click): the words as the board has them, changed on the board when you are done.
  const finishEdit = useCallback((keep = true) => { // (the look changed is this video's already: all the videos get it only from the inspector's Apply to all)
    const ed = editing.current;
    if (!ed) return;
    editing.current = null;
    const box = editorRef.current; // (the text editor that came with it: the slides that show the same words are retyped too)
    setEditor(null); closedAt.current = performance.now();
    const {el, frame, key, words, original, piece, stage, edit} = ed, text = el.textContent, changed = keep && text !== original;
    el.removeAttribute('contenteditable'); el.style.whiteSpace = '';
    el.removeEventListener('input', ed.onInput); el.removeEventListener('keydown', ed.onKey); el.removeEventListener('blur', ed.onBlur);
    screen.current?.classList.remove('is-hit');
    if (piece) el.replaceWith(document.createTextNode(changed ? text : original));
    else if (words) setLines(el, changed ? text : original);
    else el.textContent = changed ? text : original;
    if (words) drawShape(stage, edit);
    engine.current?.freeze(false);
    const rest = box && key.startsWith(box.key) ? key.slice(box.key.length) : null, also = rest == null ? [] : box.targets.filter(t => t.frame !== frame).map(t => ({frame: t.frame, key: t.key + rest})); // (a caption that several slides show: the words of the others are its words, or the video would keep saying the old ones)
    const caption = box?.kind === 'words' && key.startsWith(box.key) ? live.current.script?.info.get(frame)?.caption : null; // (the words of a DETAILED video are its captions, not the slide's: they are kept apart, `edits.captions`)
    if (changed && caption) live.current.onCaption?.({run: caption.run, beat: caption.beat, text});
    else if (changed) live.current.onText?.({frame, key, original, text, also}); // (the board retypes it, then hands the frame down drawn again)
    seen.current = -1;
    render(false);
  }, [render]);
  const startEdit = useCallback((target, shown) => {
    const host = target.el, piece = !!target.node, key = targetKey(target);
    let el = host;
    if (piece) { el = document.createElement('span'); target.node.replaceWith(el); el.appendChild(target.node); }
    const words = !piece && isWords(el), original = words ? linesOf(el) : el.textContent;
    if (words) { el.textContent = original; el.style.whiteSpace = 'pre-wrap'; }
    el.contentEditable = 'plaintext-only';
    const ed = {el, frame: shown.frame.id, key, words, original, piece, stage: shown.stage, edit: shown.edit};
    ed.onInput = () => { if (words) drawShape(shown.stage, shown.edit); };
    ed.onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); finishEdit(false); }
      else if (event.key === 'Enter' && (!words || event.ctrlKey || event.metaKey)) { event.preventDefault(); finishEdit(true); }
      event.stopPropagation();
    };
    // (the keyboard going to the toolbar of the text editor, or a handle of it being held, is not the end of the editing: the blur is judged a moment later, when the press that caused it has been seen)
    ed.onBlur = event => {
      if (event.relatedTarget?.closest?.('[data-sb-te]')) return;
      setTimeout(() => { if (editing.current === ed && !holding.current && !document.activeElement?.closest?.('[data-sb-te]')) finishEdit(true); }, 0);
    };
    el.addEventListener('input', ed.onInput); el.addEventListener('keydown', ed.onKey); el.addEventListener('blur', ed.onBlur);
    editing.current = ed;
    el.focus();
    const range = document.createRange(); range.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }, [finishEdit]);
  const retype = event => {
    event.preventDefault();
    if (editing.current) return;
    stop();
    const tl = live.current.timeline, at = locate(tl, time.current), item = at && tl.items[at.index];
    if (!item) return;
    if (at.moving || time.current < item.settle) time.current = settledAt(tl, at.index); // (the frame as it is when it is all there: moved in, written)
    seen.current = -1;
    render(false);
    screen.current.classList.add('is-hit'); // (the picture lets the pointer through to the words, for a moment)
    const shown = engine.current?.current(), target = shown && editTargetAt(event.clientX, event.clientY, shown.stage);
    if (!target) { // not a text: the look of what is there (the background, the plate, the gray side, a yellow outline), or nothing (the software)
      const part = shown && engine.current.lookTarget(event.clientX, event.clientY);
      screen.current.classList.remove('is-hit');
      if (part) select({focus: part.kind, line: part.line ?? null}); // (the inspector, with that color's section in view; a connector line double-clicked is picked, to delete it)
      return;
    }
    engine.current.freeze(true);
    startEdit(target, shown);
    // the text's box (a chat box, or the element that holds the text) gets the editor; a chat box shown by several slides one after the other is changed in all of them
    const id = shown.frame.id, key = keyOf(target.el.closest('[data-sb-bubble]') ?? target.el), same = live.current.script?.info.get(id)?.sameWords;
    session.current += 1;
    setEditor({key, frame: id, kind: engine.current.textBox(key)?.kind ?? null, targets: same?.some(t => t.frame === id && t.key === key) ? same : [{frame: id, key}]});
  };
  // The text editor (components/StoryboardTextEditor.jsx): the text box as it is, a change put on it at once (`keep`: and kept on the board's frames, in the video's own record).
  const readBox = useCallback(() => { const ed = editorRef.current; return ed ? engine.current?.textBox(ed.key) ?? null : null; }, []);
  const changeText = useCallback((patch, keep) => {
    const ed = editorRef.current;
    if (!ed || !engine.current) return;
    engine.current.liveText(ed.key, patch);
    if (keep) live.current.onVideoText?.({targets: ed.targets, frames: live.current.slides.map(f => f.id), patch, session: `${title}:${session.current}`}); // (the look: this video's words; the box: this text's)
  }, []);
  const resetText = useCallback(() => changeText({font: null, fontSize: null, weight: null, color: null, align: null, lineHeight: null, letterSpacing: null, rect: null}, true), [changeText]); // (this text, and this video's words, as the videos have them)
  const doneEditing = useCallback((keep = true) => finishEdit(keep), [finishEdit]);
  const focusText = useCallback(() => { const el = editing.current?.el; if (el && document.activeElement !== el) el.focus({preventScroll: true}); }, []);
  const editorUi = editor && screen.current ? <StoryboardTextEditor screen={screen.current} read={readBox} onPreview={patch => changeText(patch, false)} onCommit={patch => changeText(patch, true)} onDone={doneEditing} holding={holding} focusText={focusText}/> : null;
  useEffect(() => { // the text being retyped: its fields are in the board's sidebar (the video's inspector), the video picked with it
    if (!editor) return undefined;
    select();
    live.current.onEditing?.({title, kind: editor.kind, read: readBox, preview: patch => changeText(patch, false), commit: patch => changeText(patch, true), reset: resetText, done: doneEditing, focusText});
    return () => live.current.onEditing?.(null);
  }, [editor, title, select, readBox, changeText, resetText, doneEditing, focusText]);

  // the bar: press or drag to go anywhere (playing carries on from where it is let go)
  const seek = useCallback(seconds => { fresh.current = false; time.current = Math.max(0, Math.min(live.current.timeline.total, seconds)); if (!playingRef.current) render(false); }, [render]);
  useEffect(() => { // (for looking at the video frame by frame, in development)
    if (process.env.NODE_ENV === 'production') return undefined;
    const seeks = (window.__sbSeek ??= {}), totals = (window.__sbTotal ??= {}), total = () => live.current.timeline.total; // (and its length: scripts/storyboard-export.mjs takes a picture of every moment of it)
    seeks[title] = seek; totals[title] = total;
    return () => { if (seeks[title] === seek) delete seeks[title]; if (totals[title] === total) delete totals[title]; };
  }, [title, seek]);
  const secondsAt = event => { const r = track.current.getBoundingClientRect(); return clamp01((event.clientX - r.left) / Math.max(1, r.width)) * live.current.timeline.total; };
  const scrubStart = useCallback(() => {
    resume.current = playingRef.current;
    stop();
    fresh.current = false; setStarted(true);
    scrubbing.current = true; seen.current = -1;
  }, [stop]);
  const scrubEnd = useCallback(() => {
    if (!scrubbing.current) return;
    scrubbing.current = false;
    if (resume.current) { resume.current = false; play(); } else live.current.onFrame?.(null);
  }, [play]);
  const pressBar = event => {
    if (event.button !== 0) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    scrubStart();
    seek(secondsAt(event));
  };
  const dragBar = event => { if (scrubbing.current) seek(secondsAt(event)); };
  const releaseBar = scrubEnd;
  useEffect(() => { // (what the video editor drives it with)
    if (!api) return undefined;
    api.current = {play, stop, toggle: () => (playingRef.current ? stop() : play()), seek: seconds => { seen.current = -1; seek(seconds); }, scrubStart, scrubTo: seconds => { if (scrubbing.current) seek(seconds); }, scrubEnd, time: () => time.current, playing: () => playingRef.current, select,
      layersRoot: () => layersEl.current, screen: () => screen.current, retype: event => retype(event),
      timersEnd: () => engine.current?.timersEnd(live.current.script) ?? null, carryTimers: values => engine.current?.carryTimers(values, live.current.script), // (the All videos page: a part's timers go on from the part before)
      // Is there a text of the slide under a point of the picture (client px)? A double-click there retypes it; anywhere else it picks the element there (the video editor, the user, 2026-10-29)
      textAt(x, y) {
        const shown = engine.current?.current();
        if (!shown) return false;
        screen.current.classList.add('is-hit');
        try { return !!editTargetAt(x, y, shown.stage); } finally { screen.current.classList.remove('is-hit'); }
      },
      setRate: r => { rate.current = Math.max(0.05, Math.min(8, Number(r) || 1)); }, // (the transport's speed)
      setLoop: part => { span.current = part && part.to - part.from >= 0.1 ? {from: Math.max(0, part.from), to: part.to} : null; }, // (the transport's loop: the work area, or all of it)
      // The elements of the slide on that a rectangle of the picture touches (client px: the video editor's marquee), not a backdrop nor the words -> [{frame, key, name}]
      assetsIn(rect) {
        const out = [];
        for (const sc of engine.current?.onScreen() ?? []) for (const key of assetsInStage(sc.stage, rect)) {
          const el = elementOf(sc.stage, key);
          if (el && !el.hasAttribute('data-sb-bubble')) out.push({frame: sc.frame.id, key, name: el.dataset.sbName || ''});
        }
        return out;
      },
      // What is under a point of the picture: a color part of the video (an outline, a connector, the plate, the gray side, the background: their look is the video's),
      // the words, or an element of the slide that is on (the whole asset; `deep`: the deepest thing there). The video is held where the slide is all there first.
      // A purple line of the software (a rating's, a section's connector) is picked before the rest, near it (Ctrl: the deepest thing there, as before): the video editor turns it into a path.
      // -> {type: 'connector', frame, names} | {type: 'look', kind, line?} | {type: 'asset', frame, key, el, move, scale} | null
      pick(x, y, deep = false) {
        stop(); // (the time is not moved: what is on the picture now is picked, held or moving)
        const screens = engine.current?.onScreen() ?? [];
        if (!screens.length) return null;
        if (!deep) { const line = connectorHit(screens, x, y); if (line) return {type: 'connector', ...line}; }
        screen.current.classList.add('is-hit');
        try {
          const part = engine.current.lookTarget(x, y);
          let el = null, shown = null;
          for (const node of document.elementsFromPoint(x, y)) {
            const on = screens.find(sc => sc.stage !== node && sc.stage.contains(node));
            if (!on) continue;
            const shape = node.closest('.sb-shape'), hit = shape ? on.stage.querySelector(`[data-sb-root="${CSS.escape(shape.dataset.sbFor)}"]`) : node;
            if (hit?.closest('[data-sb-root]')) { el = hit; shown = on; break; }
          }
          const root = el?.closest('[data-sb-root]');
          if (root?.hasAttribute('data-sb-bubble')) return {type: 'look', kind: 'words'};
          if (part && part.kind !== 'background') return {type: 'look', kind: part.kind, line: part.line ?? null};
          if (!root) return part ? {type: 'look', kind: 'background'} : null;
          const target = deep && el !== root && keyOf(el) ? el : root, key = keyOf(target), frame = shown.frame.id;
          return {type: 'asset', frame, key, name: root.dataset.sbName || '', el: target, move: live.current.edits.frames[frame]?.moves?.[key] ?? [0, 0], scale: parentScale(target) || 1};
        } finally { screen.current.classList.remove('is-hit'); }
      },
      // The lines `names` of slide `frame` as paths on the picture (stage px), as the slide shows them now -> {paths, stroke, strokeWidth, endCap, names} | null (components/storyboardLayers.js)
      connector(frame, names) { const on = engine.current?.onScreen().find(sc => sc.frame.id === frame); return on ? connectorGeometry(on.stage, names) : null; },
      // The element `key` of slide `frame` as the picture shows it now (that slide on the picture, held or moving)
      assetEl(frame, key) { const on = engine.current?.onScreen().find(sc => sc.frame.id === frame); return on ? elementOf(on.stage, key) : null; },
      // The same element on whichever slide is on the picture now (`keys`: Map frame id -> its key on that slide), the one in front first
      elementIn(keys) { for (const sc of [...(engine.current?.onScreen() ?? [])].reverse()) { const key = keys.get(sc.frame.id), el = key && elementOf(sc.stage, key); if (el) return el; } return null; },
      guides() { const shown = engine.current?.current(); return shown ? guidesOf(shown.stage) : null; }, // (the guide lines of the slide on, held: stage px)
      measure: (index, key) => engine.current?.measure(index, key) ?? null, // (where an element is on a played slide, all there: the motion path)
      // Where an element is on the picture at each of `times` (seconds, in order) as the video moves it: its middle, stage px, measured on the copy of the video never seen (the video
      // editor's motion path, the line of its movement: the user, 2026-10-22). `keys`: Map frame id -> its key on that slide; between two slides the one more seen is taken. A few times a
      // picture; `onPoints(points, done)` gets them as they come: {t, x, y}, or {t, gap: true} where it is not on the picture. -> stop()
      track(keys, times, onPoints) {
        let k = 0, raf = 0;
        const out = [], seenOf = (el, shell) => { let o = 1; for (let c = el; c && o > 0; c = c === shell ? null : c.parentElement) o *= Number(getComputedStyle(c).opacity); return o; };
        const step = () => {
          const s = samplerOf();
          if (!s) return;
          const {frames: list, edits: changes, video: data, script: plan} = live.current, t0 = performance.now();
          s.engine.setSource({frames: list, edits: changes, video: data, script: plan});
          while (k < times.length && performance.now() - t0 < 8) {
            const t = times[k++];
            try { s.engine.show(t, false); } catch { out.push({t, gap: true}); continue; }
            let best = null;
            for (const sc of [...s.engine.onScreen()].reverse()) { // (the one in front first)
              const key = keys.get(sc.frame.id), el = key ? elementOf(sc.stage, key) : null;
              if (!el) continue;
              const seen = seenOf(el, sc.stage.closest('.sb-pl-shell'));
              if (!best || seen > best.seen + 0.01) best = {el, stage: sc.stage, seen};
            }
            if (!best || best.seen <= 0) { out.push({t, gap: true}); continue; }
            const S = best.stage.getBoundingClientRect(), r = best.el.getBoundingClientRect(), u = S.width / STAGE;
            out.push(u && r.width + r.height > 0 ? {t, x: ((r.left + r.right) / 2 - S.left) / u, y: ((r.top + r.bottom) / 2 - S.top) / u} : {t, gap: true});
          }
          onPoints(out.slice(), k >= times.length);
          if (k < times.length) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
      },
    };
    return () => { api.current = null; };
  }, [api, play, stop, seek, scrubStart, scrubEnd, select, render]); // eslint-disable-line react-hooks/exhaustive-deps

  // A video is made ready when it comes near the screen (there is one for every part of the demo: not all of them at once)
  useEffect(() => {
    if ((armed && !cell) || !host.current) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setArmed(true); return undefined; }
    const watch = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setArmed(true); if (!cell) watch.disconnect(); } else if (cell) setArmed(false); }, {rootMargin: '700px'}); // (a video of a line of videos is made ready near the screen and put away when it is far: there are many)
    watch.observe(host.current);
    return () => watch.disconnect();
  }, [armed, cell]);
  useEffect(() => { // the two stages
    if (!armed) return undefined;
    const e = createPlayerEngine(screen.current, {onRedraw: () => render(playingRef.current)});
    engine.current = e;
    shownFor.current = null; // (a new engine has drawn nothing yet: what was last drawn was the old one's. Development makes every engine twice, and the video editor's, armed from the start, stayed black)
    return () => { cancelAnimationFrame(raf.current); e.dispose(); engine.current = null; shownFor.current = null; if (sampler.current) { sampler.current.engine.dispose(); sampler.current.box.remove(); sampler.current = null; } };
  }, [render, armed, ENGINE_BUILD]);
  // A copy of the video that is never seen (off the page): put at any second to measure where an element is then, as the video moves it (`track`: the video editor's motion path)
  const sampler = useRef(null);
  const samplerOf = () => {
    const home = screen.current;
    if (sampler.current || !home?.parentElement) return sampler.current;
    const box = document.createElement('div');
    box.className = `${home.className} sb-pl-sampler`;
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = `position:absolute;left:-40000px;top:0;width:${home.offsetWidth || 1600}px;height:${home.offsetHeight || 900}px;pointer-events:none;`;
    home.parentElement.appendChild(box);
    sampler.current = {box, engine: createPlayerEngine(box)};
    return sampler.current;
  };
  const shownFor = useRef(null); // (what it was last drawn for: the script, the frame picked on the board if it is one of this video's, made ready or not)
  useEffect(() => { // the board changed (a frame edited, added, moved) or another frame was picked: show it, if it is not playing
    if (playingRef.current || scrubbing.current || editing.current || !armed) return; // (far from the screen: nothing to show it on yet)
    const mine = !!focus && !cell && slides.some(f => f.id === focus), was = shownFor.current;
    shownFor.current = {script, focus: mine ? focus : null, armed};
    if (was && was.script === script && was.armed === armed && was.focus === (mine ? focus : null)) return; // (nothing of this video changed: not drawn again)
    let at = focus && !cell ? frames.findIndex(f => f.id === focus) : -1;
    if (focus && at < 0) { // (a slide the video does not play: it is the next one it plays)
      const played = new Set(frames.map(f => f.id));
      let k = slides.findIndex(f => f.id === focus);
      while (k >= 0 && k < slides.length && !played.has(slides[k].id)) k++;
      at = k >= 0 && k < slides.length ? frames.findIndex(f => f.id === slides[k].id) : -1;
    }
    if (isEditor && fresh.current) { time.current = startAt ?? posterAt(timeline); fresh.current = false; } // (the editor opens where the video was on the board)
    else if (cell && fresh.current) time.current = posterAt(timeline); // (the poster: its first picture, all there)
    else if (!cell && at >= 0 && (lastFocus.current !== focus || lastFrames.current !== frames)) time.current = settledAt(timeline, at);
    lastFocus.current = focus; lastFrames.current = frames;
    time.current = Math.min(time.current, timeline.total);
    seen.current = -1;
    render(false);
    live.current.onDrawn?.(title); // (drawn again with the board's edits: the inspector reads the looks it shows from the picture, Undo included)
  }, [frames, slides, edits, video, focus, timeline, render, armed, cell, script]);
  useEffect(() => () => live.current.onFrame?.(null), []);

  const controls = <>
    <button type="button" className="sb-pl-play" onMouseDown={e => e.preventDefault()} onClick={toggle} aria-label={playing ? 'Pause the video' : 'Play the video'} tabIndex={-1}>{playing ? Icon.pause : Icon.play}</button>
    <div className="sb-pl-seek" onPointerDown={pressBar} onPointerMove={dragBar} onPointerUp={releaseBar} onPointerCancel={releaseBar} role="slider" aria-label="Video position" aria-valuemin={0} aria-valuemax={Math.round(timeline.total)}>
      <div ref={track} className="sb-pl-track">
        <i ref={fill} className="sb-pl-fill"/>
        {marks.map((m, i) => <i key={`${i}-${m.chapter}`} className="sb-pl-mark" style={{left: `${m.at * 100}%`}}/>)}
        <i ref={knob} className="sb-pl-knob"/>
      </div>
    </div>
    <span ref={clockEl} className="sb-pl-clock"/>
  </>;
  if (isEditor) return <div ref={host} className={`sb-pl sb-pl-editor${playing ? ' is-playing' : ''}`} data-sb-ui="" data-sb-line={title} onPointerEnter={warm} onPointerLeave={unwarm}>
    <div ref={screen} className="sb-pl-screen"/>
    <div ref={layersEl} className="sb-pl-layers" aria-hidden="true"/>
    {editorUi}
  </div>;
  const hint = `double-click a text to retype it, a color to edit it in the sidebar${onMenu ? ' · right-click: open it in the video editor, duplicate, export, delete' : ''}`;
  if (cell) return <div ref={host} className={`sb-pl sb-pl-cell${playing ? ' is-playing' : ''}${started ? ' is-started' : ''}`} data-sb-ui="" data-sb-line={title} onPointerEnter={warm} onPointerLeave={unwarm} onPointerDown={() => select()} onContextMenu={openMenu}>
    <div ref={screen} className="sb-pl-screen" onClick={clickScreen} onDoubleClick={commentTool ? undefined : retype} title={`${playing ? 'Pause' : 'Play'} · ${hint}`}/>
    <div ref={layersEl} className="sb-pl-layers" aria-hidden="true"/>
    {editorUi}
    {pinsUi}
    <span className="sb-pl-big" aria-hidden="true">{Icon.big}</span>
    <div className="sb-pl-over-bar">{controls}</div>
  </div>;
  return <div ref={host} className="sb-pl" data-sb-ui="" data-sb-line={title} style={{left: x, top: y - PLAYER_HEAD, width: FRAME.w}} onPointerEnter={warm} onPointerLeave={unwarm} onPointerDown={() => select()} onContextMenu={openMenu}>
    <div className="sb-pl-head" style={{height: BAR, marginBottom: BAR_GAP}}>
      <span/>
      <span className="sb-fvtitle">{title || 'the storyboard'}</span>
      <i className="sb-ftime">{clock(timeline.total)}</i>
    </div>
    <div className="sb-pl-stage">
      <div ref={screen} className="sb-pl-screen" onClick={clickScreen} onDoubleClick={commentTool ? undefined : retype} title={`${playing ? 'Pause' : 'Play'} · ${hint}`}/>
      <div ref={layersEl} className="sb-pl-layers" aria-hidden="true"/>
      {editorUi}
      {pinsUi}
    </div>
    <div className="sb-pl-bar" style={{marginTop: NOTES_GAP, height: NOTES_H}}>
      {controls}
      <span ref={labelEl} className="sb-pl-label"/>
    </div>
  </div>;
}
