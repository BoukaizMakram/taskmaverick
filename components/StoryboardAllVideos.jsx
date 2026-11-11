'use client';
// All videos (/storyboard?video=all-videos; the user, 2026-10-29: "a new section where all videos are in one place, only videos ... stitch the whole line into one continuous video, then we
// start fixing it ... say on top if it's final, or in progress"; then "the all video board should be like the other boards, with figma style paning etc"). It is a board like the others: the
// same canvas (the wheel pans, Ctrl + wheel and a pinch zoom, Space + drag, the middle button or the Hand tool pan, Shift 1 / Shift 0, Ctrl + / −, the view kept for a reload), a green label for
// each group at the left (Operations, Training, Risk, Knowledge) and the videos at its right, each as a video of a board is: a purple bar with its name, the picture, the bar of its controls. No
// frames, no lines of frames: only videos, one for each finished board (lib/storyboardAllVideos.mjs), each under a pill that says In progress or Final.
// A video is the board's line "Videos" played from the first video to the last: every video of the line is a real StoryboardPlayer over the board's own slides and edits (so the pen speed,
// the layers and the looks fixed on the board are in it, and a slide fixed there is fixed here), and the canvas plays them one after the other as ONE video: one bar, one clock, the next
// video begins where the last ended (a short cross-fade between them). No numbers, no marks, no "where am I" (the user, 2026-10-29: "remove the numbering and those lines in the timeline,
// telling me where I am doesn't matter to me"). A video is drawn and fetched only when it is on screen and big enough to be seen (`LIVE_ZOOM`); far away it is its bar, with nothing in the picture.
// (the user, 2026-10-30: "the comments should be in /storyboard before going to video editor. double clicking should let me edit it without changing how it was, and without opening the
// video editor. the video editor should open if I right click the video, and it should show multiple options"): HERE TOO, as on a board, a double-click on the picture retypes a text in the
// part that is on (kept in ITS board's file: `apply`), a RIGHT-click opens a menu (Open in video editor, Add a comment here, Export, Open its board), and the Comment tool (C; or the menu) puts
// a numbered pin on the picture at the second the part is on. The comments are the board's own (`edits.comments[<the part's title>]`), so they are in its video editor too. The video editor
// is part of the board (`editorKeyOf`): it opens there, in a new tab, from the menu only.
// (the user, 2026-10-30: "first I should be able to select the video, when I play it, it should select it and show me selection in the title purple rectangle by a blue stroke, I can select
// video from title or from playing the video itself"): one video is selected at a time (`select`): a press on it, its title or anything in it, so playing it selects it. A comment picked on it too.
// Esc or a click on the empty canvas let it go, a reload keeps it (`SELECTED_KEY`).
// (the user, 2026-10-30: "selecting a video will show in inspector in the right all comments in the video"): the sidebar of a selected video is all its comments, the ones of all its parts, in the
// order it plays them and numbered through the whole video (`stitchedComments`: the same number on the pins here), each at its second of the whole video (`timing`). A click on one stops the video on
// it and picks it, its fields under the list (`commentsPanel`). The selected video is always made ready, wherever it is and however far the zoom (`live`).
// (the user, 2026-10-30: "comments should be easily selectable from video, I should be able to move their position by dragging, and on hover it should show the message"): a pin is the same size
// on screen at any zoom (`--sb-inv`), over the click layer; pressing one holds the video (`pickPin`), dragging it moves it, hovering it shows its words, past the picture's edge if it must.
// (the user, 2026-10-30: "when I select a comment and I click elsewhere in the video to play it, the comment should deselect itself"): a press on a video anywhere but on a pin puts it down (`select`).
// (the user, 2026-10-30: "the comment should last only for the scene where I commented"): a pin shows only in its scene, a line of the board, playing or held (`showPins`, `sceneAt`).
import {memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import StoryboardPlayer from './StoryboardPlayer';
import StoryboardPins, {showPins} from './StoryboardPins';
import StoryboardRefs, {makeRefs} from './StoryboardRefs';
import {addRefs, changeRef, refBoxes, refsOf, removeRef} from '@/lib/storyboardRefs.mjs';
import CommentPanel from './StoryboardCommentPanel';
import {TextFields} from './StoryboardTextEditor';
import {ExportAllButton, ExportMenuItem} from './StoryboardExport';
import {addVideoComment, commentsOf, newCommentId, removeVideoComment, updateVideoComment} from '@/lib/storyboardComments.mjs';
import {LOOKS, activeVariation, addVariation, looksFor, removeVariation, setActiveVariation, variationsOf} from '@/lib/storyboardVariations.mjs';
import StoryboardRemotionCut from './StoryboardRemotionCut';
import {CUT_PART, cutPartOf, playingCutOf, renderCommandOf} from '@/lib/remotion/cuts.mjs';
import {setCutText} from '@/lib/remotion/cutWords.mjs';
import {setCaption, setOwnLook, setText, setVideoText} from '@/lib/storyboardEdits.mjs';
import {STAGE_H, STAGE_W} from '@/lib/storyboardLayers.mjs';
import {clock} from '@/lib/storyboardPlayer.mjs';
import {clampZoom, fitRect, glideZoom, intersects, keepView, panBy, parseView, restoreView, stepZoom, toWorld, union, viewBetween, viewKey, visibleWorld, wheelAction, zoomAt} from '@/lib/storyboardView.mjs';
import {ALL_LAYOUT, ALL_VIDEOS, ALL_VIDEOS_NAME, cellHeight, crossOf, editorKeyOf, layoutAll, partsOf, placeKeyOf, SELECTED_KEY, stitchedComments, stitchedGroups} from '@/lib/storyboardAllVideos.mjs';
import './StoryboardAllVideos.css';

const LIVE_ZOOM = 0.28;  // a video is made ready only from this zoom on (26 of them at once would be too much), and only while it is on screen
const SIDE_KEY = 'storyboard:all-videos:inspector'; // what the inspector of a selected video shows, Comments or Variations (this browser's)
const LIVE_MARGIN = 500; // world px round the window: a video that is about to come in is ready
const Icon = {
  big: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>,
  move: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M4.5 3.5 15.5 9l-4.6 1.4L9 15.5 4.5 3.5Z"/></svg>,
  hand: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10V4.5a1.2 1.2 0 0 1 2.4 0V9m0-1.5V3.7a1.2 1.2 0 0 1 2.4 0V9m0-3.3a1.2 1.2 0 0 1 2.4 0V11m0-2.6a1.2 1.2 0 0 1 2.4 0V12a5 5 0 0 1-5 5h-.6a5 5 0 0 1-4-2l-2.4-3.4a1.2 1.2 0 0 1 1.8-1.5L7 12.2"/></svg>,
  fit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/></svg>,
  comment: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><path d="M12 3.8a8.2 8.2 0 1 1-3.7 15.5L3.8 20.2l1-4.1A8.2 8.2 0 0 1 12 3.8Z"/><path d="M8.6 10.6h6.8M8.6 13.8h4.2"/></svg>,
};
const round2 = n => Math.round(n * 100) / 100;
const NO_COMMENTS = Object.freeze([]);
// A text's look or box changed in the video's text editor (the board's `restyleVideo`, without its Undo): the look is this video's words on its slides, the box is this text's.
function restyleIn(edits, {targets, frames: ids = [], patch}) {
  const look = Object.fromEntries(Object.entries(patch).filter(([name]) => name !== 'rect')), off = Object.fromEntries(Object.keys(look).map(name => [name, null]));
  let cur = edits;
  if (Object.keys(look).length) cur = targets.reduce((c, t) => setVideoText(c, t.frame, t.key, off), (ids.length ? ids : targets.map(t => t.frame)).reduce((c, id) => setOwnLook(c, id, 'kind:words', 'words', look), cur));
  if ('rect' in patch) cur = targets.reduce((c, t) => setVideoText(c, t.frame, t.key, {rect: patch.rect}), cur);
  return cur;
}

// A board's captured data (public/storyboard/<board>.json), fetched once for the page.
const captured = new Map();
function capturedOf(board) {
  let made = captured.get(board);
  if (!made) {
    made = fetch(`/storyboard/${board}.json`).then(r => { if (!r.ok) throw new Error(`The frames of ${board} are not made yet (npm run gen:storyboard).`); return r.json(); });
    captured.set(board, made);
    made.catch(() => captured.delete(board));
  }
  return made;
}

// The part on, in its board's video editor, where it is now (a new tab: this page stays as it is).
function openInBoard(board, part, at) {
  try { localStorage.setItem(editorKeyOf(board), JSON.stringify({key: part, at: Math.round(Math.max(0, at) * 1000) / 1000})); } catch {}
  window.open(`/storyboard?video=${encodeURIComponent(board)}`, '_blank', 'noopener');
}

// The stitched video: its parts (a player each, one on at a time) and the one bar over all of them. Draws the picture and the bar (the bar's own grid, as a video's of a board).
// `io`: what the page does with the part that is on: {onText, onVideoText, onCaption (a text retyped in the picture: kept in the board), onEditing (the text's fields, for the sidebar), editing (a
// text is being retyped: the picture lets the pointer through to it), commentTool, pinSel, ops (the comments' changes), onPin(part, id, fresh), onMenu(event, info), onPinMenu(event, part, c),
// videos (a Map, board -> what stops this video on a comment), onTiming(board, starts) (the second of the whole video each part begins at, by its id)}
function Stitched({entry, parts, video, edits, onTotal, io}) {
  const n = parts.length, board = entry.board, {onText, onVideoText, onCaption, onEditing, editing, commentTool, pinSel, ops, onPin, onMenu, onPinMenu, videos, onTiming} = io;
  const trackEl = useRef(null), fillEl = useRef(null), knobEl = useRef(null), clockEl = useRef(null), screenEl = useRef(null), pinsEl = useRef(null);
  const apis = useMemo(() => parts.map(() => ({current: null})), [n]); // eslint-disable-line react-hooks/exhaustive-deps
  const [totals, setTotals] = useState([]);                          // each part's length, told by its player once it has made its script
  const scripts = useRef([]);                                        // each part's script (a pin shows only in its scene)
  const told = useMemo(() => parts.map((_, i) => script => { scripts.current[i] = script; const t = script?.timeline?.total ?? 0; setTotals(prev => { if (prev[i] === t) return prev; const next = prev.slice(); next[i] = t; return next; }); }), [n]); // eslint-disable-line react-hooks/exhaustive-deps
  const starts = useMemo(() => { let at = 0; return parts.map((_, i) => { const s = at; at += totals[i] || 0; return s; }); }, [totals, n]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = n ? starts[n - 1] + (totals[n - 1] || 0) : 0, ready = n > 0 && parts.every((_, i) => totals[i] > 0);
  const [cur, setCur] = useState(0), [was, setWas] = useState(-1), [playing, setPlaying] = useState(false), [started, setStarted] = useState(false);
  const curRef = useRef(0), playingRef = useRef(false), raf = useRef(0), fadeTimer = useRef(0), scrub = useRef(null);
  const on = Math.min(cur, Math.max(0, n - 1)), now = parts[on] ?? null;
  const comments = now ? commentsOf(edits, now.title) : NO_COMMENTS, picked = now && pinSel && pinSel.board === board && pinSel.title === now.title ? pinSel.id : null; // (the comments of the part that is on)
  const numbered = useMemo(() => stitchedComments(parts, edits), [parts, edits?.comments, edits?.variations]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = useRef(null); live.current = {starts, total, ready, n, comments, picked, parts, started};
  useEffect(() => { if (ready) onTotal?.(total); }, [ready, total]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready) onTiming(board, Object.fromEntries(parts.map((p, i) => [p.id, starts[i]]))); }, [ready, starts, parts]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready) for (let i = 1; i < n; i++) apis[i].current?.carryTimers(apis[i - 1].current?.timersEnd() ?? null); }, [ready, totals, n, apis]); // (a part that goes on from the one before, `joins`: its timers from where they ended there)
  // The pins: only the ones of the scene the part is on (the picked one always)
  const showHere = useCallback(() => { const {comments: list, picked: id} = live.current, i = curRef.current, api = apis[i]?.current; showPins(pinsEl.current, list, id, api ? api.time() : 0, scripts.current[i]); }, [apis]);
  useLayoutEffect(() => { showHere(); }, [comments, picked, playing, cur, showHere]);

  // What follows the time: the bar, the knob, the clock.
  const paintBar = useCallback(() => {
    showHere();
    const {starts: from, total: all} = live.current, i = curRef.current, api = apis[i]?.current;
    const at = (from[i] ?? 0) + (api ? api.time() : 0), p = all ? Math.min(1, at / all) : 0;
    if (fillEl.current) fillEl.current.style.transform = `scaleX(${p})`;
    if (knobEl.current) knobEl.current.style.left = `${p * 100}%`;
    if (clockEl.current) clockEl.current.textContent = `${clock(at)} / ${clock(all)}`;
  }, [apis, showHere]);
  useEffect(() => { paintBar(); }, [paintBar, totals, cur]);

  // Part `j` on, put at `local` seconds of itself (and playing, if `resume`): the part that was on stops; with `fade` it stays under the new one while that comes in.
  const stopPart = useCallback(() => { cancelAnimationFrame(raf.current); if (!playingRef.current) return; playingRef.current = false; setPlaying(false); apis[curRef.current]?.current?.stop(); }, [apis]);
  const cross = crossOf(board), crossing = cross.seconds;
  const go = useCallback((j, local, resume, fade = false) => {
    const from = curRef.current, to = apis[j]?.current;
    if (!to) return false;
    if (from !== j) apis[from]?.current?.stop();
    curRef.current = j; setCur(j);
    clearTimeout(fadeTimer.current);
    if (fade && from !== j) { setWas(from); fadeTimer.current = setTimeout(() => setWas(-1), crossing * 1000 + 150); } else setWas(-1);
    to.seek(local);
    if (resume) to.play();
    return !resume || to.playing();
  }, [apis, crossing]);
  const loop = useCallback(() => {
    const i = curRef.current, api = apis[i]?.current;
    if (!api) { stopPart(); return; }
    if (!api.playing()) { // this part is over: the next one begins, or the video ends
      if (i + 1 >= live.current.n || !go(i + 1, 0, true, true)) { paintBar(); playingRef.current = false; setPlaying(false); return; }
    }
    paintBar();
    raf.current = requestAnimationFrame(loop);
  }, [apis, go, paintBar, stopPart]);
  const play = useCallback(() => {
    const {starts: from, total: all, ready: ok} = live.current;
    if (playingRef.current || !ok) return;
    let i = curRef.current;
    const api = apis[i]?.current;
    if (!api) return;
    const at = from[i] + api.time(), partEnd = from[i + 1] ?? all;
    if (at >= all - 0.05) { go(0, 0, false); i = 0; } // at the end: from the start
    else if (at >= partEnd - 0.05) { go(i + 1, 0, false); i += 1; } // at the end of a part: the next one
    setStarted(true);
    playingRef.current = true; setPlaying(true);
    apis[i].current.play();
    if (!apis[i].current.playing()) { playingRef.current = false; setPlaying(false); return; }
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(loop);
  }, [apis, go, loop]);
  const toggle = () => (playingRef.current ? stopPart() : play());
  // anywhere on the video's whole length: the part it falls in, put at that second of itself
  const seekTo = useCallback(g => {
    const {starts: from, total: all, n: count} = live.current, t = Math.max(0, Math.min(all, g));
    let j = 0;
    for (let k = 0; k < count; k++) if (t >= from[k]) j = k;
    setStarted(true);
    go(j, Math.max(0, t - from[j]), false);
    paintBar();
  }, [go, paintBar]);
  const secondsAt = event => { const r = trackEl.current.getBoundingClientRect(); return Math.min(1, Math.max(0, (event.clientX - r.left) / Math.max(1, r.width))) * live.current.total; };
  const pressBar = event => {
    if (event.button !== 0 || !live.current.ready) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    scrub.current = {resume: playingRef.current};
    stopPart();
    seekTo(secondsAt(event));
  };
  const dragBar = event => { if (scrub.current) seekTo(secondsAt(event)); };
  const releaseBar = () => { const s = scrub.current; scrub.current = null; if (s?.resume) play(); };
  // A reload keeps the video on the second it was at, held there (the user, 2026-10-30: "if I refresh ... should keep me where I was with the video timeline in the moment I refreshed"). Saved when
  // the page goes and when the video leaves the screen, never before it was put back (a reload before it is ready leaves the place as it was), and only for a video that was played or moved.
  const placed = useRef(false);
  useEffect(() => {
    if (!ready || placed.current) return;
    placed.current = true;
    let place = null;
    try { place = JSON.parse(localStorage.getItem(placeKeyOf(board))); } catch {}
    const j = place ? parts.findIndex(p => p.id === place.part) : -1;
    if (j < 0) return;
    setStarted(true);
    go(j, Number(place.at) || 0, false);
    paintBar();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const keep = () => {
      const {parts: list, started: moved} = live.current, i = curRef.current, api = apis[i]?.current;
      if (!placed.current || !moved || !api || !list[i]) return;
      try { localStorage.setItem(placeKeyOf(board), JSON.stringify({part: list[i].id, at: round2(api.time())})); } catch {}
    };
    const hide = () => { if (document.visibilityState === 'hidden') keep(); };
    window.addEventListener('pagehide', keep); document.addEventListener('visibilitychange', hide);
    return () => { keep(); window.removeEventListener('pagehide', keep); document.removeEventListener('visibilitychange', hide); };
  }, [apis, board]);
  // A comment clicked in the inspector: the video stops on it (not ready yet: it opens there)
  const toComment = useCallback((id, at) => {
    const j = live.current.parts.findIndex(p => p.id === id);
    if (j < 0) return;
    if (!placed.current) { try { localStorage.setItem(placeKeyOf(board), JSON.stringify({part: id, at})); } catch {} return; }
    stopPart();
    setStarted(true);
    go(j, at, false);
    paintBar();
  }, [board, go, paintBar, stopPart]);
  useEffect(() => { videos.set(board, toComment); return () => { videos.delete(board); }; }, [videos, board, toComment]);
  // Where on the picture (1600 x 900) a pointer is, and the second the part that is on is at
  const pointOf = event => { const r = screenEl.current.getBoundingClientRect(); return r.width ? {x: round2((event.clientX - r.left) / r.width * STAGE_W), y: round2((event.clientY - r.top) / r.height * STAGE_H)} : null; };
  const secondOf = () => round2(apis[curRef.current]?.current?.time() ?? 0);
  // A double-click retypes a text in the part that is on (the board's own way; the change is kept in its board's file), a color is picked in its look: it no longer opens the video editor
  const retype = event => { event.preventDefault(); if (!ready || commentTool) return; stopPart(); apis[curRef.current]?.current?.retype(event); };
  // A click plays or pauses; with the Comment tool it puts a comment there, at this second, and picks it
  const click = event => {
    if (event.detail > 1 || !ready) return;
    if (!commentTool) { toggle(); return; }
    const point = pointOf(event);
    if (!now || !point) return;
    stopPart();
    const id = ops.addTo(board, now.title, {x: point.x, y: point.y, at: secondOf(), text: ''});
    if (id) onPin(now, id, true);
  };
  // A right-click: the part stops where it is and the page's menu opens (Open in video editor, a comment here, Export, Open its board)
  const menu = event => {
    event.preventDefault();
    if (!ready || !now) return;
    stopPart();
    onMenu(event, {board, name: entry.name, part: now, at: secondOf(), point: pointOf(event)});
  };
  // A pin pressed: the video holds where it is, so the pin is read and dragged over a still picture
  const pickPin = c => { stopPart(); if (now) onPin(now, c.id, false); };
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(fadeTimer.current); }, []);

  const hint = !ready ? 'Getting ready…' : commentTool ? 'Click to put a comment here' : `${playing ? 'Pause' : 'Play'} · double-click a text to retype it · right-click: open it in the video editor, a comment, export`;
  return <>
    <div ref={screenEl} className="sb-av-screen" data-sb-ui="">
      <div className="sb-art sb-art--cell sb-av-stack" data-art="" style={{'--sb-av-cross': `${cross.seconds}s`, '--sb-av-curve': cross.curve}}>
        {parts.map((part, i) => <div key={part.id} className={`sb-av-part${i === on ? ' is-on' : ''}${i === was ? ' is-was' : ''}${i === on && was >= 0 ? ' is-fading' : ''}`}>
          <StoryboardPlayer cell frames={part.frames} title={part.title} edits={edits} video={video} api={apis[i]} onScript={told[i]} onText={onText} onVideoText={onVideoText} onCaption={onCaption} onEditing={onEditing}/>
        </div>)}
      </div>
      <div className={`sb-av-hit${editing ? ' is-off' : ''}${commentTool ? ' is-comment' : ''}`} onClick={click} onDoubleClick={retype} onContextMenu={menu} title={hint}/>
      <StoryboardPins rootRef={pinsEl} className="sb-av-pins" screen={() => screenEl.current} list={comments} picked={picked} number={c => numbered.find(r => r.part.id === now?.id && r.comment.id === c.id)?.number}
        pick={pickPin} move={(c, xy) => now && ops.changeIn(board, now.title, c.id, xy)} menu={(event, c) => now && onPinMenu(event, now, c)}/>
      <span className={`sb-av-big${started ? ' is-gone' : ''}`} aria-hidden="true">{Icon.big}</span>
      {!ready && <span className="sb-av-wait">Getting ready…</span>}
    </div>
    <div className="sb-pl-bar sb-av-controls" data-sb-ui="" style={{marginTop: ALL_LAYOUT.barGap, height: ALL_LAYOUT.bar}}>
      <button type="button" className="sb-pl-play" onMouseDown={e => e.preventDefault()} onClick={toggle} disabled={!ready} aria-label={playing ? 'Pause the video' : 'Play the video'}>{playing ? Icon.pause : Icon.big}</button>
      <div className="sb-pl-seek" onPointerDown={pressBar} onPointerMove={dragBar} onPointerUp={releaseBar} onPointerCancel={releaseBar} role="slider" aria-label="Video position" aria-valuemin={0} aria-valuemax={Math.round(total)}>
        <div ref={trackEl} className="sb-pl-track"><i ref={fillEl} className="sb-pl-fill"/><i ref={knobEl} className="sb-pl-knob"/></div>
      </div>
      <span ref={clockEl} className="sb-pl-clock"/>
    </div>
  </>;
}

// One board's video, as a video of a board is (its bar with the name and the length, the picture, the controls). Its frames and edits are fetched when it first comes to the screen big enough
// (`live`), and read again when the page is shown again (`stamp`: a fix was made on the board meanwhile).
// `data`: this board's {video, edits, rev}, kept by the page (a comment's panel and a retyped text reach the board's edits through it), `selected`: this is the video selected, `shared`: what the page
// gives every video: {setBoardData, apply (a change to a board's edits: shown at once, kept in its file a moment later), dirty (is a change of a board not kept yet), ops, onEditing, editing, commentTool,
// pinSel, onPin, onMenu, onPinMenu, onSelect (a press on the video, anywhere but on a pin: the Hand tool and a drag of the canvas never reach it), videos, onTiming}.
const Cell = memo(function Cell({cell, live, load, stamp, data, selected, shared}) {
  const {entry} = cell, board = entry.board, {setBoardData, apply, dirty, ops, onEditing, editing, commentTool, pinSel, onPin, onMenu, onPinMenu, onSelect, videos, onTiming} = shared;
  const [error, setError] = useState(''), [length, setLength] = useState(0), asked = useRef(false);
  useEffect(() => {
    if (!live || asked.current) return undefined;
    asked.current = true;
    let alive = true;
    Promise.all([capturedOf(board), load(board)])
      .then(([video, saved]) => setBoardData(board, {video, edits: saved.edits, rev: saved.file ? saved.rev : null})) // (the page keeps it, whether or not this video is still on the screen)
      .catch(e => { asked.current = false; if (alive) setError(e?.message || 'It could not be loaded.'); });
    return () => { alive = false; };
  }, [live, board, load, setBoardData]);
  useEffect(() => { // the page is shown again: the file's edits, if its revision changed (not while a change of ours is waiting to be kept)
    if (!data || !stamp || dirty(board)) return undefined;
    let alive = true;
    load(board).then(saved => { if (alive && saved.file && saved.rev !== data.rev && !dirty(board)) setBoardData(board, d => (d ? {...d, edits: saved.edits, rev: saved.rev} : d)); }).catch(() => {});
    return () => { alive = false; };
  }, [stamp]); // eslint-disable-line react-hooks/exhaustive-deps
  const edits = data?.edits;
  const parts = useMemo(() => (data ? partsOf(board, data.video, data.edits) : []), [data?.video, edits?.lines, edits?.copies, edits?.rows, edits?.deleted, board]); // eslint-disable-line react-hooks/exhaustive-deps
  // A text retyped in the picture, and its look or box changed in the text editor: the change is the board's (kept in its file)
  const onText = useCallback(({frame, key, text, also = []}) => apply(board, e => [{frame, key}, ...also].reduce((cur, part) => setText(cur, part.frame, part.key, text), e)), [apply, board]);
  const onVideoText = useCallback(change => apply(board, e => restyleIn(e, change)), [apply, board]);
  const onCaption = useCallback(({run, beat, text}) => apply(board, e => setCaption(e, run, beat, text)), [apply, board]);
  const onCutText = useCallback((id, key, text, original) => apply(board, e => setCutText(e, id, key, text, original.join('\n'))), [apply, board]); // (words retyped in the board's Remotion cut: lib/remotion/cutWords.mjs)
  const pick = useCallback((part, id, fresh) => onPin(part, id, fresh, board, entry.name), [onPin, board, entry.name]);
  const pinMenu = useCallback((event, part, c) => onPinMenu(event, {board, name: entry.name, part, c}), [onPinMenu, board, entry.name]);
  const io = useMemo(() => ({onText, onVideoText, onCaption, onCutText, onEditing, editing, commentTool, pinSel, ops, onPin: pick, onMenu, onPinMenu: pinMenu, videos, onTiming}), [onText, onVideoText, onCaption, onCutText, onEditing, editing, commentTool, pinSel, ops, pick, onMenu, pinMenu, videos, onTiming]);
  const cut = playingCutOf(board, edits); // (the variation that plays is the board's Remotion cut, either layout: lib/remotion/cuts.mjs)
  return <div className={`sb-pl sb-av-cell${selected ? ' is-selected' : ''}`} data-sb-ui="" data-board={entry.board} data-status={entry.status.id} style={{left: cell.x, top: cell.y, width: cell.w}} onPointerDown={event => { if (!event.target.closest?.('.sb-pl-pin')) onSelect(board); }}>
    <div className="sb-pl-head" style={{height: ALL_LAYOUT.head, marginBottom: ALL_LAYOUT.headGap}}>
      {/* (the Export button: the user, 2026-11-11, "add a way to export videos from the storyboard videos": the board's Remotion cut when it plays one, else every part of its video; dev only) */}
      <span className="sb-av-left"><span className={`sb-av-status is-${entry.status.id}`}>{entry.status.label}</span>
        {process.env.NODE_ENV !== 'production' && live && data && (cut || parts.length > 0) && <ExportAllButton board={board} titles={cut ? [cut.title] : parts.map(p => p.title)} options={cut ? {cut: true} : undefined}/>}</span>
      <span className="sb-fvtitle">{entry.name}</span>
      <i className="sb-ftime">{length ? clock(length) : ''}</i>
    </div>
    {live && data && cut ? <StoryboardRemotionCut entry={entry} cut={cut} edits={data.edits} onTotal={setLength} io={io}/>
      : live && data && parts.length ? <Stitched entry={entry} parts={parts} video={data.video} edits={data.edits} onTotal={setLength} io={io}/>
      : <>
        <div className="sb-av-screen" title={error || (data && !parts.length ? 'This board has no videos in its line “Videos” yet.' : '')}>
          <span className="sb-av-big" aria-hidden="true">{Icon.big}</span>
          {(error || (data && !parts.length) || (live && !data)) && <span className="sb-av-wait">{error || (data && !parts.length ? 'No videos in its line “Videos” yet' : 'Getting ready…')}</span>}
        </div>
        <div className="sb-pl-bar sb-av-controls" style={{marginTop: ALL_LAYOUT.barGap, height: ALL_LAYOUT.bar}}>
          <button type="button" className="sb-pl-play" disabled aria-label="Play the video">{Icon.big}</button>
          <div className="sb-pl-seek"><div className="sb-pl-track"><i className="sb-pl-fill"/></div></div>
          <span className="sb-pl-clock">0:00 / 0:00</span>
        </div>
      </>}
  </div>;
});

// `menu`: the board menu (Storyboard.jsx `menuOf`), `load`: what the board reads a board's saved edits with (`loadSaved`: the file, else this browser's copy), `change(board, fn)`: what it changes
// a board's saved edits with (`changeBoard`: reads the file, applies `fn`, saves it; -> {rev, edits}).
export default function StoryboardAllVideos({menu, load, change}) {
  const groups = useMemo(() => stitchedGroups(), []), layout = useMemo(() => layoutAll(groups), [groups]);
  const all = useMemo(() => groups.flatMap(g => g.entries), [groups]), finals = all.filter(e => e.status.id === 'final').length;
  const [stamp, setStamp] = useState(0);
  useEffect(() => {
    const shown = () => { if (document.visibilityState === 'visible') setStamp(s => s + 1); };
    document.addEventListener('visibilitychange', shown);
    return () => document.removeEventListener('visibilitychange', shown);
  }, []);

  // ---- The boards' edits, kept here (a video's picture, the comments' panel and a retyped text all read and change the same ones). A change is shown at once and kept in its board's file 0.4 s
  // later (the changes of a board in that time are kept together, in order, on top of what the file holds then) ----
  const [store, setStore] = useState({}), storeRef = useRef(store); storeRef.current = store;
  const [note, setNote] = useState('');
  const setBoardData = useCallback((board, updater) => setStore(s => { const was = s[board] ?? null, next = typeof updater === 'function' ? updater(was) : updater; return next === was ? s : {...s, [board]: next}; }), []);
  const pending = useRef(new Map()); // board -> {fns, timer, busy}
  const flush = useCallback(board => {
    const p = pending.current.get(board);
    if (!p || !p.fns.length) return;
    const fns = p.fns; p.fns = [];
    p.busy = p.busy.then(async () => {
      try {
        const done = await change(board, e => fns.reduce((cur, fn) => fn(cur), e));
        if (done?.rev != null) setBoardData(board, d => (d ? {...d, rev: done.rev} : d));
        setNote('');
      } catch (error) { setNote(`A change to ${board} was not saved (${error.message})`); }
    });
  }, [change, setBoardData]);
  const apply = useCallback((board, fn) => {
    setBoardData(board, d => (d ? {...d, edits: fn(d.edits)} : d));
    const p = pending.current.get(board) ?? {fns: [], timer: 0, busy: Promise.resolve()};
    pending.current.set(board, p);
    p.fns.push(fn); clearTimeout(p.timer); p.timer = setTimeout(() => flush(board), 400);
  }, [flush, setBoardData]);
  const dirty = useCallback(board => { const p = pending.current.get(board); return !!p && p.fns.length > 0; }, []);
  useEffect(() => { // (the page is left or hidden: what waits is kept now)
    const now = () => { for (const [board, p] of pending.current) { clearTimeout(p.timer); flush(board); } };
    const hide = () => { if (document.visibilityState === 'hidden') now(); };
    window.addEventListener('pagehide', now); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('pagehide', now); document.removeEventListener('visibilitychange', hide); };
  }, [flush]);
  // The comments of a part (its title, in its board's edits): put, changed and taken away
  const ops = useMemo(() => ({
    addTo: (board, title, comment) => { const d = storeRef.current[board]; if (!d) return null; const id = newCommentId(commentsOf(d.edits, title)); apply(board, e => addVideoComment(e, title, {...comment, id}).edits); return id; },
    changeIn: (board, title, id, patch) => apply(board, e => updateVideoComment(e, title, id, patch)),
    removeIn: (board, title, id) => apply(board, e => removeVideoComment(e, title, id)),
  }), [apply]);
  const [pinSel, setPinSel] = useState(null), pinSelRef = useRef(null); pinSelRef.current = pinSel; // the comment picked: {board, title, part (its id), name (the video's), id}
  const [ctx, setCtx] = useState(null);                                                                // the right-click menu: {x, y, ...} of a video (`part`) or of a pin (`pin`)
  const [textEd, setTextEd] = useState(null);                                                          // the text being retyped: its fields are the sidebar's
  const [selected, setSelected] = useState(null);                                                      // the video selected (its board): its title has the blue stroke
  // A video selected, or none (null), and the comment picked put down: every press on a video that is not on a pin comes here, so a click elsewhere on the picture to play it lets the comment go
  const select = useCallback(board => {
    setSelected(board);
    setPinSel(null);
    try { if (board) localStorage.setItem(SELECTED_KEY, board); else localStorage.removeItem(SELECTED_KEY); } catch {}
  }, []);
  useEffect(() => { try { const kept = localStorage.getItem(SELECTED_KEY); if (all.some(e => e.board === kept)) setSelected(kept); } catch {} }, [all]);
  // The video selected and all its comments, for the sidebar
  const chosen = all.find(e => e.board === selected) ?? null, chosenData = selected ? store[selected] ?? null : null, chosenEdits = chosenData?.edits;
  const chosenIsCut = !!playingCutOf(selected, chosenEdits); // (its Remotion cut plays: one part, the cut, with its own comments)
  const chosenParts = useMemo(() => (chosenIsCut ? [cutPartOf(selected)] : chosenData ? partsOf(selected, chosenData.video, chosenEdits) : []), [chosenIsCut, selected, chosenData?.video, chosenEdits?.lines, chosenEdits?.copies, chosenEdits?.rows, chosenEdits?.deleted]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => stitchedComments(chosenParts, chosenEdits), [chosenParts, chosenEdits?.comments, chosenEdits?.variations]); // (the comments of the variation that plays) // eslint-disable-line react-hooks/exhaustive-deps
  const [timing, setTiming] = useState({}), videos = useRef(new Map());                               // board -> {a part's id: the second of the whole video it begins at}; board -> what stops it on a comment
  const onTiming = useCallback((board, starts) => setTiming(t => ({...t, [board]: starts})), []);
  useEffect(() => { document.querySelector('.sb-av-cm.is-on')?.scrollIntoView({block: 'nearest'}); }, [pinSel?.part, pinSel?.id]); // (a comment picked on the picture: it is seen in the list)
  const onPin = useCallback((part, id, fresh, board, name) => { // (`board`, `name`: set by the video that says it)
    select(board); // (a pin takes its press: it does not reach the video's own `onSelect`)
    setPinSel({board, title: part.title, part: part.id, name, id});
    if (fresh) { setTool('move'); setTimeout(() => document.querySelector('.sb-cm-text')?.focus(), 150); } // (a comment just placed: the tool is put down, the keyboard goes to its words)
  }, [select]);

  // ---- The canvas: the board's own (components/Storyboard.jsx): a view {x, y, zoom} kept in a ref, the world moved as it changes, the page told once it settles ----
  const viewport = useRef(null), worldRef = useRef(null), viewRef = useRef({x: 0, y: 0, zoom: 0.2}), sizeRef = useRef({w: 1200, h: 800}), raf = useRef(0), settle = useRef(0), glide = useRef(null), animation = useRef(0), opened = useRef(false), lateView = useRef(null);
  const [view, setView] = useState(viewRef.current), [size, setSize] = useState(sizeRef.current), [tool, setTool] = useState('move'), [space, setSpace] = useState(false), [zoomMenu, setZoomMenu] = useState(false), [panning, setPanning] = useState(false);
  const paint = useCallback(() => { raf.current = 0; const v = viewRef.current; if (worldRef.current) worldRef.current.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.zoom})`; }, []);
  const showView = useCallback(next => {
    viewRef.current = next;
    worldRef.current?.classList.add('is-moving');
    if (!raf.current) raf.current = requestAnimationFrame(paint);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => { worldRef.current?.classList.remove('is-moving'); setView(viewRef.current); }, 130);
  }, [paint]);
  const setViewNow = useCallback(next => { viewRef.current = next; setView(next); paint(); }, [paint]);
  useEffect(() => { // the window's size
    const el = viewport.current;
    if (!el) return undefined;
    const measure = () => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) { sizeRef.current = {w: r.width, h: r.height}; setSize(sizeRef.current); } };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const windowNow = useCallback(() => { const r = viewport.current?.getBoundingClientRect(); return r && r.width > 0 && r.height > 0 ? {w: r.width, h: r.height} : sizeRef.current; }, []);
  const keepNow = useCallback(() => { if (!opened.current) return; try { localStorage.setItem(viewKey(ALL_VIDEOS), JSON.stringify(keepView(viewRef.current, windowNow()))); } catch {} }, [windowNow]);
  useEffect(() => { // open where it was looked at (a reload keeps its place), else on the first row: its label and its first two videos
    if (opened.current || size.w < 300) return;
    opened.current = true;
    let kept = null, raw = null;
    try { raw = localStorage.getItem(viewKey(ALL_VIDEOS)); kept = restoreView(parseView(raw), windowNow(), layout.bounds); } catch {}
    if (kept) { setViewNow(kept); return; }
    lateView.current = raw;
    const first = layout.rows[0], box = union([{x: first.x, y: first.y, w: first.w, h: cellHeight()}, ...layout.cells.filter(c => c.group === first.name).slice(0, 2).map(c => ({x: c.x, y: c.y, w: c.w, h: c.h}))]); // (the first line of videos: its label and its first two)
    setViewNow(fitRect(box, windowNow(), {padding: 70}));
  }, [size, layout, setViewNow, windowNow]);
  useEffect(() => { keepNow(); }, [view, keepNow]);
  useEffect(() => {
    const hide = () => { if (document.visibilityState === 'hidden') keepNow(); };
    window.addEventListener('pagehide', keepNow); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('pagehide', keepNow); document.removeEventListener('visibilitychange', hide); };
  }, [keepNow]);
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(settle.current); cancelAnimationFrame(animation.current); }, []);

  // Zooming glides (a wheel notch, Ctrl + / −, the zoom menu): the target moves at once and the view eases to it around the pointer. A pinch follows the fingers.
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
    const from = viewRef.current, t0 = performance.now(), now = sizeRef.current;
    const step = at => {
      const p = Math.min(1, (at - t0) / 280), e = 1 - (1 - p) ** 3;
      showView(viewBetween(from, target, e, now));
      if (p < 1) animation.current = requestAnimationFrame(step);
    };
    animation.current = requestAnimationFrame(step);
  }, [showView, stopGlide]);
  const middle = () => ({x: sizeRef.current.w / 2, y: sizeRef.current.h / 2});
  const fitAll = useCallback(() => goTo(fitRect(union([layout.bounds, ...refBoxes(storeRef.current[ALL_VIDEOS]?.edits)]), sizeRef.current, {padding: 50})), [layout, goTo]); // (the references are part of the board)
  const zoomTo = useCallback(zoom => glideTo(() => zoom, middle()), [glideTo]);
  const zoomStep = useCallback(dir => glideTo(z => stepZoom(z, dir), middle()), [glideTo]);
  const focusCell = useCallback(cell => goTo(fitRect({x: cell.x, y: cell.y, w: cell.w, h: cell.h}, sizeRef.current, {padding: 70, maxZoom: 0.9})), [goTo]);
  useEffect(() => {
    const el = viewport.current;
    const onWheel = event => {
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

  // ---- References: a file put on this canvas stays where it was put, a blank space too, any kind of file (lib/storyboardRefs.mjs). This page's own are kept like a board's, in content/storyboard/all-videos.json. ----
  const [refSel, setRefSel] = useState(null), refSelRef = useRef(null), pointerAt = useRef(null), freeRef = useRef(true);
  refSelRef.current = refSel; freeRef.current = tool === 'move' && !space;
  const refsIn = !!store[ALL_VIDEOS];
  useEffect(() => { load(ALL_VIDEOS).then(saved => setBoardData(ALL_VIDEOS, {edits: saved.edits, rev: saved.file ? saved.rev : null})).catch(() => setNote('The references of this page could not be read.')); }, [load, setBoardData]);
  useEffect(() => { // (a view kept by a reference far from the videos: the references are known only once they are read)
    if (!refsIn || !opened.current) return;
    const raw = lateView.current, boxes = refBoxes(storeRef.current[ALL_VIDEOS]?.edits);
    lateView.current = null;
    const kept = raw && boxes.length ? restoreView(parseView(raw), windowNow(), union(boxes)) : null;
    if (kept) setViewNow(kept);
  }, [refsIn, size, setViewNow, windowNow]);
  const worldAt = useCallback((x, y) => { const r = viewport.current.getBoundingClientRect(); return toWorld(viewRef.current, {x: x - r.left, y: y - r.top}); }, []);
  const pickRef = useCallback(id => { setPinSel(null); setRefSel(id); }, []);
  const addReferences = useCallback(async (files, at) => {
    setNote(`Adding ${files.length > 1 ? `${files.length} files` : files[0].name || 'the file'}…`);
    const {made, failed} = await makeRefs(files, at, viewRef.current.zoom);
    if (made.length) { apply(ALL_VIDEOS, e => addRefs(e, made)); pickRef(made.at(-1).id); }
    setNote(failed.length ? `Not added: ${failed[0]}` : '');
  }, [apply, pickRef]);
  const moveRef = useCallback((id, box) => apply(ALL_VIDEOS, e => changeRef(e, id, box)), [apply]);
  const deleteRef = useCallback(id => { apply(ALL_VIDEOS, e => removeRef(e, id)); setRefSel(null); }, [apply]);
  const refZoom = useCallback(() => viewRef.current.zoom, []), refFree = useCallback(() => freeRef.current, []);
  const refMenu = useCallback((event, item) => setCtx({x: event.clientX, y: event.clientY, ref: item}), []);
  const onDragOver = event => { if ([...event.dataTransfer.types].includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } };
  const onDrop = event => {
    if (![...event.dataTransfer.types].includes('Files')) return;
    event.preventDefault();
    const files = [...event.dataTransfer.files];
    if (files.length && storeRef.current[ALL_VIDEOS]) addReferences(files, worldAt(event.clientX, event.clientY));
  };
  useEffect(() => { // (a file pasted: where the pointer is, else in the middle of the window)
    const paste = event => {
      const files = [...(event.clipboardData?.files ?? [])], spot = pointerAt.current;
      if (!files.length || event.target?.closest?.('input, textarea, [contenteditable]') || !storeRef.current[ALL_VIDEOS]) return;
      event.preventDefault();
      addReferences(files, spot ? worldAt(spot.x, spot.y) : toWorld(viewRef.current, {x: sizeRef.current.w / 2, y: sizeRef.current.h / 2}));
    };
    window.addEventListener('paste', paste);
    return () => window.removeEventListener('paste', paste);
  }, [addReferences, worldAt]);

  // Panning with the pointer: the Hand tool, Space held, the middle button, or the background with the left button (there is nothing to pick on this board). A video's own controls keep their clicks.
  const drag = useRef(null);
  const onPointerDownCapture = event => {
    if (event.button === 0 && !event.target.closest?.('.sb-ref')) setRefSel(null);
    const grab = event.button === 1 || (event.button === 0 && (tool === 'hand' || space));
    if (!grab && (event.button !== 0 || event.target.closest?.('[data-sb-ui]'))) return;
    if (event.target.closest?.('.sb-side, .sb-float, .sb-bottom, .sb-zoom')) return;
    event.preventDefault();
    if (grab) event.stopPropagation(); // (over a video too: the video does not play)
    cancelAnimationFrame(animation.current); stopGlide();
    drag.current = {x: event.clientX, y: event.clientY, view: viewRef.current, empty: !grab};
    viewport.current.setPointerCapture?.(event.pointerId);
    setPanning(true);
  };
  const onPointerMove = event => { pointerAt.current = {x: event.clientX, y: event.clientY}; const d = drag.current; if (d) showView({...d.view, x: d.view.x + event.clientX - d.x, y: d.view.y + event.clientY - d.y}); };
  const onPointerUp = event => {
    const d = drag.current;
    if (!d) return;
    drag.current = null; setPanning(false); viewport.current.releasePointerCapture?.(event.pointerId);
    if (d.empty && Math.hypot(event.clientX - d.x, event.clientY - d.y) < 4) select(null); // (a click on the empty canvas, not a drag of it)
  };

  useEffect(() => { // the keys the board has for moving around
    const typing = t => t instanceof Element && (t.matches('input, textarea, select, [contenteditable]'));
    const down = event => {
      if (typing(event.target)) return;
      if (event.code === 'Space') { event.preventDefault(); setSpace(true); return; }
      const mod = event.ctrlKey || event.metaKey;
      if (mod && (event.key === '+' || event.key === '=')) { event.preventDefault(); zoomStep(1); }
      else if (mod && event.key === '-') { event.preventDefault(); zoomStep(-1); }
      else if (event.shiftKey && (event.key === '!' || event.code === 'Digit1')) { event.preventDefault(); fitAll(); }
      else if (event.shiftKey && (event.key === ')' || event.code === 'Digit0')) { event.preventDefault(); zoomTo(1); }
      else if (!mod && event.key.toLowerCase() === 'h') setTool('hand');
      else if (!mod && event.key.toLowerCase() === 'v') setTool('move');
      else if (!mod && event.key.toLowerCase() === 'c') setTool(t => (t === 'comment' ? 'move' : 'comment')); // (the Comment tool)
      else if ((event.key === 'Delete' || event.key === 'Backspace') && refSelRef.current) { event.preventDefault(); deleteRef(refSelRef.current); } // (a reference picked: deleted)
      else if ((event.key === 'Delete' || event.key === 'Backspace') && pinSelRef.current) { // (a comment picked: deleted)
        event.preventDefault();
        const p = pinSelRef.current;
        ops.removeIn(p.board, p.title, p.id); setPinSel(null);
      } else if (event.key === 'Escape') { setZoomMenu(false); setCtx(null); setRefSel(null); select(null); setTool(t => (t === 'comment' ? 'move' : t)); }
    };
    const up = event => { if (event.code === 'Space') setSpace(false); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [zoomStep, fitAll, zoomTo, ops, select, deleteRef]);

  // ---- The right-click menus (the user, 2026-10-30): a video's, and a comment pin's. They close on a press anywhere else, or when the canvas moves. ----
  const onMenu = useCallback((event, info) => setCtx({x: event.clientX, y: event.clientY, video: info}), []);
  const onPinMenu = useCallback((event, info) => { select(info.board); setPinSel({board: info.board, title: info.part.title, part: info.part.id, name: info.name, id: info.c.id}); setCtx({x: event.clientX, y: event.clientY, pin: info}); }, [select]);
  useEffect(() => {
    if (!ctx) return undefined;
    const close = event => { if (!event.target.closest?.('.sb-ctx')) setCtx(null); };
    window.addEventListener('pointerdown', close, true); window.addEventListener('wheel', close, true);
    return () => { window.removeEventListener('pointerdown', close, true); window.removeEventListener('wheel', close, true); };
  }, [ctx]);
  const addCommentHere = m => { // a pin where the video was right-clicked, at the second it was on; picked, with the keyboard in its words
    if (!m.point) return;
    const id = ops.addTo(m.board, m.part.title, {x: m.point.x, y: m.point.y, at: m.at, text: ''});
    if (id) onPin(m.part, id, true, m.board, m.name);
  };
  const onEditing = useCallback(ed => { setTextEd(ed); if (ed) setPinSel(null); }, []); // (a text being retyped: its fields are the sidebar's, not a comment's)
  const shared = useMemo(() => ({setBoardData, apply, dirty, ops, onEditing, editing: !!textEd, commentTool: tool === 'comment', pinSel, onPin, onMenu, onPinMenu, onSelect: select, videos: videos.current, onTiming}), [setBoardData, apply, dirty, ops, onEditing, textEd, tool, pinSel, onPin, onMenu, onPinMenu, select, onTiming]);

  // Which videos are made ready: the ones in the window (and just round it), once the zoom is big enough to see them.
  const liveBoards = useMemo(() => {
    if (view.zoom < LIVE_ZOOM) return new Set();
    const seen = visibleWorld(view, size, LIVE_MARGIN);
    return new Set(layout.cells.filter(c => intersects({x: c.x, y: c.y, w: c.w, h: c.h}, seen)).map(c => c.entry.board));
  }, [view, size, layout]);
  const zoomPct = `${Math.round(view.zoom * 100)}%`, cursor = panning ? 'grabbing' : tool === 'hand' || space ? 'grab' : 'default';

  // A comment clicked in the list: the video stops on it, on screen, and it is picked
  const goToComment = ({part, comment}) => {
    videos.current.get(selected)?.(part.id, comment.at);
    setPinSel({board: selected, title: part.title, part: part.id, name: chosen.name, id: comment.id});
    const cell = layout.cells.find(c => c.entry.board === selected);
    if (cell && !intersects({x: cell.x, y: cell.y, w: cell.w, h: cell.h}, visibleWorld(viewRef.current, sizeRef.current))) focusCell(cell);
  };
  // The inspector of a selected video shows its comments or its variations (the user, 2026-11-03: "variations should show up on the right side inspector with dropdown between comments/the variations")
  const [side, setSide] = useState('comments');
  useEffect(() => { try { if (localStorage.getItem(SIDE_KEY) === 'variations') setSide('variations'); } catch {} }, []);
  const pickSide = value => { setSide(value); if (value === 'variations') setPinSel(null); try { localStorage.setItem(SIDE_KEY, value); } catch {} };
  const sideHead = (small, shown) => <div className="sb-side-head">
    <div className="sb-av-side-row"><b>{chosen.name}</b><select className="sb-av-side-pick" value={shown} onChange={e => pickSide(e.target.value)} aria-label="What the inspector shows"><option value="comments">Comments</option><option value="variations">Variations</option></select></div>
    <small>{small}</small>
  </div>;
  // The variations of the video selected (lib/storyboardVariations.mjs): the one that plays is picked (it plays everywhere: here, on its board, in the video editor, in an export), one is added with a look, or deleted.
  // Kept in its board's file, as a comment is (`apply`).
  const variationsPanel = () => {
    const list = variationsOf(chosenEdits), on = activeVariation(chosenEdits);
    return <>
      {sideHead(!chosenData ? 'Getting ready…' : `${list.length} variation${list.length > 1 ? 's' : ''} · ${on.name} plays`, 'variations')}
      {chosenData && <div className="sb-av-vars">
        {list.map(v => <div key={v.id} className={`sb-av-var${v.id === on.id ? ' is-on' : ''}`}>
          <button type="button" onClick={() => apply(selected, e => setActiveVariation(e, v.id))} aria-pressed={v.id === on.id} title={v.id === on.id ? 'This variation plays' : 'Play this variation'}>
            <i className="sb-av-var-dot"/>
            <span><b>{v.name}</b><small>{v.look ? LOOKS[v.look].note : 'The video as it is made.'}</small></span>
          </button>
          {v.look && <button type="button" className="sb-av-var-rm" onClick={() => apply(selected, e => removeVariation(e, v.id))} title="Delete this variation (its comments stay in the board's file)" aria-label={`Delete ${v.name}`}>×</button>}
        </div>)}
      </div>}
      {chosenData && <div className="sb-av-var-add">{looksFor(selected).map(([look, l]) => <button key={look} type="button" onClick={() => apply(selected, e => addVariation(e, {look}).edits)} title={l.note}>+ New variation: {l.label}</button>)}</div>}
      <p className="sb-side-note sb-av-vars-note">The one picked plays here, on its board, in the video editor and in an export. Each variation has its own comments: the Comments show the ones of the variation that plays.</p>
    </>;
  };
  // The inspector of the video selected: all its comments, in the order it plays them, and under them the one picked (the board's own Comment panel: its words, place and second; "Open in the video editor" opens its board there)
  const commentsPanel = () => {
    const row = pinSel ? rows.find(r => r.part.id === pinSel.part && r.comment.id === pinSel.id) ?? null : null, done = rows.filter(r => r.comment.done).length, starts = timing[selected];
    const edit = pinSel && {change: (id, patch) => ops.changeIn(pinSel.board, pinSel.title, id, patch), remove: id => ops.removeIn(pinSel.board, pinSel.title, id)};
    return <>
      {sideHead(!chosenData ? 'Getting ready…' : `${rows.length ? `${rows.length} comment${rows.length > 1 ? 's' : ''}${done ? ` · ${done} done` : ''}` : 'No comments yet'}${variationsOf(chosenEdits).length > 1 ? ` · ${activeVariation(chosenEdits).name}` : ''}`, 'comments')}
      {rows.length > 0 && <div className={`sb-av-comments${pinSel ? ' is-short' : ''}`}>
        {rows.map(r => { const {part, comment: c, number} = r, on = pinSel?.part === part.id && pinSel?.id === c.id, begins = starts?.[part.id]; return <button key={`${part.id}:${c.id}`} type="button" className={`sb-av-cm${on ? ' is-on' : ''}${c.done ? ' is-done' : ''}`} onClick={() => goToComment(r)} title="Go to this comment on the video" aria-pressed={on}>
          <i className="sb-av-cm-pin">{number}</i>
          <span className="sb-av-cm-text">{c.text.trim() || 'No words yet'}</span>
          <time>{begins == null ? '' : clock(begins + c.at)}</time>
        </button>; })}
      </div>}
      {chosenData && !rows.length && <p className="sb-side-note sb-av-empty">Press C, then click on the video to put a comment there.</p>}
      {pinSel && <CommentPanel comment={row?.comment ?? null} number={row?.number ?? 0} total={rows.length} offset={starts?.[pinSel.part] ?? 0} byScene ops={edit}
        {...(pinSel.part === CUT_PART ? {onSeek: t => videos.current.get(pinSel.board)?.(pinSel.part, t), seekLabel: 'Go to its second', seekTitle: 'The Remotion cut stops on the second of this comment'} // (a Remotion cut has no video editor)
          : {onSeek: t => openInBoard(pinSel.board, pinSel.part, t), seekLabel: 'Open in the video editor', seekTitle: "Open its board's video editor at the second of this comment (a new tab)"})}
        onDelete={() => { ops.removeIn(pinSel.board, pinSel.title, pinSel.id); setPinSel(null); }}/>}
    </>;
  };
  const found = ctx?.pin ? commentsOf(store[ctx.pin.board]?.edits, ctx.pin.part.title).find(x => x.id === ctx.pin.c.id) ?? null : null;

  return <div className={`sb-root sb-av-root${tool === 'comment' ? ' is-commenting' : ''}`}>
    <div className="sb-float sb-float--left">
      <Link href="/" className="sb-back" aria-label="Home">←</Link>
      <span className="sb-name">Storyboard</span>
      <select className="sb-video" value={ALL_VIDEOS} onChange={e => { window.location.search = `?video=${e.target.value}`; }} aria-label="Board">{[...menu.groups.map(g => <optgroup key={g.name} label={g.name}>{g.boards.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>), ...menu.rest.map(v => <option key={v.id} value={v.id}>{v.name}</option>)]}</select>
    </div>
    <div className="sb-float sb-float--right">
      <span className="sb-status" role="status">{note}</span>
      <button type="button" className="sb-icon" onClick={fitAll} title="Zoom to fit (Shift+1)" aria-label="Zoom to fit">{Icon.fit}</button>
    </div>
    <div ref={viewport} className="sb-viewport" style={{cursor}} onPointerDownCapture={onPointerDownCapture} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={() => { pointerAt.current = null; }} onDragOver={onDragOver} onDrop={onDrop}>
      <div ref={worldRef} className={`sb-world${view.zoom < 0.12 ? ' is-far' : ''}`} style={{transform: `translate(${viewRef.current.x}px,${viewRef.current.y}px) scale(${viewRef.current.zoom})`, '--sb-inv': 1 / view.zoom}}>
        {layout.rows.map(row => <div key={row.name} className="sb-section" style={{left: row.x, top: row.y, width: row.w, height: row.h}}><span>{row.name}</span></div>)}
        {layout.cells.map(cell => <Cell key={cell.entry.board} cell={cell} live={liveBoards.has(cell.entry.board) || selected === cell.entry.board} load={load} stamp={stamp} data={store[cell.entry.board] ?? null} selected={selected === cell.entry.board} shared={shared}/>)}
        <StoryboardRefs items={refsOf(store[ALL_VIDEOS]?.edits)} picked={refSel} zoom={view.zoom} zoomNow={refZoom} free={refFree} onPick={pickRef} onChange={moveRef} onMenu={refMenu}/>
      </div>
    </div>
    <aside className="sb-side" data-sb-ui="" aria-label="Videos">
      {textEd && !pinSel ? <>
        <div className="sb-side-head"><b>{textEd.title}</b><small>Retyping a text in this video · Esc leaves</small></div>
        <TextFields key={textEd.title} edit={textEd}/>
      </> : chosen ? (side === 'variations' && !pinSel ? variationsPanel() : commentsPanel()) : <>
        <div className="sb-side-head"><b>{ALL_VIDEOS_NAME}</b><small>{all.length} videos · {finals} Final · {all.length - finals} In progress</small></div>
        {groups.map(g => <div key={g.name} className="sb-av-list">
          <h4>{g.name}</h4>
          {g.entries.map(e => { const cell = layout.cells.find(c => c.entry.board === e.board); return <button key={e.board} type="button" className="sb-av-item" onClick={() => cell && focusCell(cell)} title={`${e.name}: ${e.status.label}. Click to go to it.`}><i className={`sb-av-dot is-${e.status.id}`}/><span>{e.name}</span></button>; })}
        </div>)}
      </>}
    </aside>
    <footer className="sb-bottom">
      <div className="sb-tools" role="toolbar" aria-label="Tools">
        <button type="button" className={tool === 'move' ? 'is-on' : ''} onClick={() => setTool('move')} title="Move (V)" aria-label="Move tool">{Icon.move}</button>
        <button type="button" className={tool === 'hand' ? 'is-on' : ''} onClick={() => setTool('hand')} title="Hand (H; or hold Space, or the middle button)" aria-label="Hand tool">{Icon.hand}</button>
        <button type="button" className={tool === 'comment' ? 'is-on' : ''} onClick={() => setTool(t => (t === 'comment' ? 'move' : 'comment'))} title="Comment (C): click on a video to put a comment there" aria-label="Comment tool" aria-pressed={tool === 'comment'}>{Icon.comment}</button>
      </div>
    </footer>
    {ctx && <div className="sb-ctx" data-sb-ui="" role="menu" style={{left: Math.min(ctx.x, size.w - 270), top: Math.min(ctx.y, size.h - 230)}}>
      {ctx.ref ? (r => <>
        <button type="button" role="menuitem" onClick={() => { window.open(r.url, '_blank', 'noopener'); setCtx(null); }}>Open in a new tab</button>
        <hr/>
        <button type="button" role="menuitem" onClick={() => { deleteRef(r.id); setCtx(null); }}>Delete <kbd>Del</kbd></button>
      </>)(ctx.ref) : ctx.video?.cut ? (m => <>
        <button type="button" role="menuitem" disabled={!m.point} onClick={() => { addCommentHere(m); setCtx(null); }} title={m.point ? 'A pin on the picture where you right-clicked, at the second the video is on' : 'Right-click on the picture to put a comment there'}>Add a comment here <kbd>at {clock(m.at)}</kbd></button>
        <hr/>
        {process.env.NODE_ENV !== 'production' && <ExportMenuItem board={m.board} title={m.part.title} options={{cut: true}} text="Export as MP4" onStart={() => { setNote('Rendering the film with Remotion: it is downloaded when it is done (a few minutes)'); setCtx(null); }}/>}
        <button type="button" role="menuitem" onClick={() => { try { navigator.clipboard.writeText(renderCommandOf(m.board, store[m.board]?.edits)).catch(() => {}); } catch {} setNote('The render command of the Remotion cut is copied: run it in a terminal'); setCtx(null); }} title={renderCommandOf(m.board, store[m.board]?.edits) ?? ''}>Copy the render command <kbd>MP4</kbd></button>
        <button type="button" role="menuitem" onClick={() => { window.open(`/storyboard?video=${encodeURIComponent(m.board)}`, '_blank', 'noopener'); setCtx(null); }} title="Opens the board this video is made from (a new tab)">Open its board <kbd>new tab</kbd></button>
      </>)(ctx.video) : ctx.video ? (m => <>
        <button type="button" role="menuitem" onClick={() => { openInBoard(m.board, m.part.id, m.at); setCtx(null); }} title="Opens this part in its board's video editor, at this second (a new tab)">Open in video editor <kbd>at {clock(m.at)}</kbd></button>
        <button type="button" role="menuitem" disabled={!m.point} onClick={() => { addCommentHere(m); setCtx(null); }} title={m.point ? 'A pin on the picture where you right-clicked, at the second the video is on' : 'Right-click on the picture to put a comment there'}>Add a comment here <kbd>at {clock(m.at)}</kbd></button>
        <hr/>
        {process.env.NODE_ENV !== 'production' && <ExportMenuItem board={m.board} title={m.part.title} text="Export this part as MP4" onStart={() => setCtx(null)}/>}
        <button type="button" role="menuitem" onClick={() => { window.open(`/storyboard?video=${encodeURIComponent(m.board)}`, '_blank', 'noopener'); setCtx(null); }} title="Opens the board this video is made on (a new tab): its videos are duplicated, deleted and edited there">Open its board <kbd>new tab</kbd></button>
      </>)(ctx.video) : (p => <>
        <button type="button" role="menuitem" disabled={!found || p.part.id === CUT_PART} onClick={() => { openInBoard(p.board, p.part.id, found.at); setCtx(null); }}>Open in video editor <kbd>at its second</kbd></button>
        <button type="button" role="menuitem" disabled={!found} onClick={() => { ops.changeIn(p.board, p.part.title, p.c.id, {done: !found.done}); setCtx(null); }}>{found?.done ? 'Mark as not done' : 'Mark as done'}</button>
        <hr/>
        <button type="button" role="menuitem" onClick={() => { ops.removeIn(p.board, p.part.title, p.c.id); setPinSel(null); setCtx(null); }}>Delete the comment <kbd>Del</kbd></button>
      </>)(ctx.pin)}
    </div>}
    <div className="sb-zoom">
      <button type="button" onClick={() => setZoomMenu(m => !m)} aria-haspopup="menu" aria-expanded={zoomMenu}>{zoomPct}</button>
      {zoomMenu && <div className="sb-zoom-menu" role="menu" onClick={() => setZoomMenu(false)}>
        <button type="button" role="menuitem" onClick={() => zoomStep(1)}>Zoom in <kbd>Ctrl +</kbd></button>
        <button type="button" role="menuitem" onClick={() => zoomStep(-1)}>Zoom out <kbd>Ctrl −</kbd></button>
        <button type="button" role="menuitem" onClick={fitAll}>Zoom to fit <kbd>Shift 1</kbd></button>
        <button type="button" role="menuitem" onClick={() => zoomTo(0.5)}>Zoom to 50%</button>
        <button type="button" role="menuitem" onClick={() => zoomTo(1)}>Zoom to 100% <kbd>Shift 0</kbd></button>
      </div>}
    </div>
  </div>;
}
