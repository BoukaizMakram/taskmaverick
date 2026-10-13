'use client';
// The storyboard's video (at the right of the first part of the demo, "The tablet and its Knowledge Base"): that
// line's frames played one after the other, drawn from what the board shows, so it follows the board as it is edited. Move an asset
// or retype words on a frame and the video has it (the next time it plays that frame, or at once if it
// is the one on). Picking a frame on the board (while the video is not playing) puts the video on it.
// A chat box with a pen (`anims`) is written by it as the video plays. A double-click on a text in the
// picture retypes it (the video stops on that frame): the words are changed on the board too, and a position
// is not editable here, only on the board.
// The stages and the glide from one frame to the next are components/storyboardPlayerDom.js; the
// timing is lib/storyboardPlayer.mjs. It sits in the board's world, so it zooms and pans with it.
// `cell` (the user, 2026-10-12: "make them videos not slides"): a video of a line of videos (lib/storyboardCells.mjs) takes the place of a slide's picture: the
// screen and, over it, its controls (a big play button until it is played, a bar), in the frame it is in (its header and notes are the frame's).
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FRAME, LAYOUT} from '@/lib/storyboardView.mjs';
import {clock, lineMarks, locate, posterAt, settledAt} from '@/lib/storyboardPlayer.mjs';
import {profileOf} from '@/lib/storyboardVideos.mjs';
import {ENGINE_BUILD, createPlayerEngine, directorOf} from './storyboardPlayerDom';
import {drawShape, editTargetAt, isWords, linesOf, setLines, targetKey} from './storyboardDom';

const {bar: BAR, barGap: BAR_GAP, notesGap: NOTES_GAP, notes: NOTES_H} = LAYOUT;
export const PLAYER_HEAD = BAR + BAR_GAP;
const clamp01 = v => Math.min(1, Math.max(0, v));

const Icon = {
  big: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>,
};

export default function StoryboardPlayer({frames: slides, title, edits, video, x, y, focus, lines, placed, onFrame, onText, cell = false}) {
  const screen = useRef(null), track = useRef(null), fill = useRef(null), knob = useRef(null), clockEl = useRef(null), labelEl = useRef(null);
  const engine = useRef(null), time = useRef(0), raf = useRef(0), last = useRef(0), seen = useRef(-1);
  const playingRef = useRef(false), scrubbing = useRef(false), resume = useRef(false), lastFocus = useRef(null), lastFrames = useRef(null);
  const [playing, setPlaying] = useState(false), [started, setStarted] = useState(false);
  const fresh = useRef(true);                           // (a cell not played yet: it shows its poster, and plays from the start)
  // The video is not the slides one after the other: the director drops the ones that are only the start of the next, and says what each needs
  const profile = useMemo(() => profileOf(video?.video, title), [video, title]); // (a video that is paced and shown its own way: lib/storyboardVideos.mjs)
  const script = useMemo(() => directorOf(slides, edits, video, profile), [slides, edits, video, profile]), frames = script.played, timeline = script.timeline;
  const editing = useRef(null);                          // the text being retyped in the picture
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') (window.__sbScripts ??= {})[title] = script.trace; // (for looking at what the director made)
  const marks = useMemo(() => lineMarks(frames, timeline).filter(m => m.at > 0), [frames, timeline]);
  const live = useRef({}); live.current = {frames, slides, edits, video, script, timeline, lines, placed, onFrame, onText};

  // What follows the time: the bar, the clock, which frame it is on (said to the board while it plays).
  const paint = useCallback(at => {
    const {timeline: tl, frames: list, lines: titles, placed: spots, onFrame: tell} = live.current;
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
  }, []);
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
    const total = live.current.timeline.total;
    time.current = Math.min(total, time.current + Math.min(0.1, (now - last.current) / 1000)); // (a tab that was away does not jump)
    last.current = now;
    render(true);
    if (time.current >= total) { stop(); return; }
    raf.current = requestAnimationFrame(loop);
  }, [render, stop]);
  const play = useCallback(() => {
    const total = live.current.timeline.total;
    if (!total || playingRef.current) return;
    if (time.current >= total - 0.05 || fresh.current) time.current = 0; // at the end, or never played (a cell shows its poster): from the start
    fresh.current = false; setStarted(true);
    playingRef.current = true; setPlaying(true); seen.current = -1;
    last.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  }, [loop]);
  const toggle = () => (playingRef.current ? stop() : play());
  // The pointer rests on the video (it is going to press play): the first pen of a play is made ready now, not as the video starts (60 to 120 ms there). Not while the board is
  // moving under the pointer (a pan passes over every video; each would do its 60 ms), and not for a pointer that is only passing.
  const hovered = useRef(0);
  const warm = useCallback(() => {
    clearTimeout(hovered.current);
    hovered.current = setTimeout(() => { if (!playingRef.current && !document.querySelector('.sb-world.is-moving')) engine.current?.warm(); }, 250);
  }, []);
  const unwarm = useCallback(() => clearTimeout(hovered.current), []);
  useEffect(() => () => clearTimeout(hovered.current), []);
  const clickScreen = event => { if (event.detail > 1 || editing.current) return; toggle(); }; // (the second click of a double-click retypes: it does not play)

  // Retype a text in the picture (double-click): the words as the board has them, changed on the board when you are done.
  const finishEdit = useCallback((keep = true) => {
    const ed = editing.current;
    if (!ed) return;
    editing.current = null;
    const {el, frame, key, words, original, piece, stage, edit} = ed, text = el.textContent, changed = keep && text !== original;
    el.removeAttribute('contenteditable'); el.style.whiteSpace = '';
    el.removeEventListener('input', ed.onInput); el.removeEventListener('keydown', ed.onKey); el.removeEventListener('blur', ed.onBlur);
    screen.current?.classList.remove('is-hit');
    if (piece) el.replaceWith(document.createTextNode(changed ? text : original));
    else if (words) setLines(el, changed ? text : original);
    else el.textContent = changed ? text : original;
    if (words) drawShape(stage, edit);
    engine.current?.freeze(false);
    if (changed) live.current.onText?.({frame, key, original, text}); // (the board retypes it, then hands the frame down drawn again)
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
    ed.onBlur = () => finishEdit(true);
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
    if (!target) { screen.current.classList.remove('is-hit'); return; }
    engine.current.freeze(true);
    startEdit(target, shown);
  };

  // the bar: press or drag to go anywhere (playing carries on from where it is let go)
  const seek = useCallback(seconds => { fresh.current = false; time.current = Math.max(0, Math.min(live.current.timeline.total, seconds)); if (!playingRef.current) render(false); }, [render]);
  useEffect(() => { // (for looking at the video frame by frame, in development)
    if (process.env.NODE_ENV === 'production') return undefined;
    const seeks = (window.__sbSeek ??= {});
    seeks[title] = seek;
    return () => { if (seeks[title] === seek) delete seeks[title]; };
  }, [title, seek]);
  const secondsAt = event => { const r = track.current.getBoundingClientRect(); return clamp01((event.clientX - r.left) / Math.max(1, r.width)) * live.current.timeline.total; };
  const pressBar = event => {
    if (event.button !== 0) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    resume.current = playingRef.current;
    stop();
    fresh.current = false; setStarted(true);
    scrubbing.current = true; seen.current = -1;
    seek(secondsAt(event));
  };
  const dragBar = event => { if (scrubbing.current) seek(secondsAt(event)); };
  const releaseBar = () => {
    if (!scrubbing.current) return;
    scrubbing.current = false;
    if (resume.current) { resume.current = false; play(); } else live.current.onFrame?.(null);
  };

  // A video is made ready when it comes near the screen (there is one for every part of the demo: not all of them at once)
  const host = useRef(null), [armed, setArmed] = useState(false);
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
    return () => { cancelAnimationFrame(raf.current); e.dispose(); engine.current = null; };
  }, [render, armed, ENGINE_BUILD]);
  useEffect(() => { // the board changed (a frame edited, added, moved) or another frame was picked: show it, if it is not playing
    if (playingRef.current || scrubbing.current || editing.current) return;
    let at = focus && !cell ? frames.findIndex(f => f.id === focus) : -1;
    if (focus && at < 0) { // (a slide the video does not play: it is the next one it plays)
      const played = new Set(frames.map(f => f.id));
      let k = slides.findIndex(f => f.id === focus);
      while (k >= 0 && k < slides.length && !played.has(slides[k].id)) k++;
      at = k >= 0 && k < slides.length ? frames.findIndex(f => f.id === slides[k].id) : -1;
    }
    if (cell && fresh.current) time.current = posterAt(timeline); // (the poster: its first picture, all there)
    else if (!cell && at >= 0 && (lastFocus.current !== focus || lastFrames.current !== frames)) time.current = settledAt(timeline, at);
    lastFocus.current = focus; lastFrames.current = frames;
    time.current = Math.min(time.current, timeline.total);
    seen.current = -1;
    render(false);
  }, [frames, slides, edits, video, focus, timeline, render, armed, cell]);
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
  if (cell) return <div ref={host} className={`sb-pl sb-pl-cell${playing ? ' is-playing' : ''}${started ? ' is-started' : ''}`} data-sb-ui="" data-sb-line={title} onPointerEnter={warm} onPointerLeave={unwarm}>
    <div ref={screen} className="sb-pl-screen" onClick={clickScreen} onDoubleClick={retype} title={playing ? 'Pause · double-click a text to retype it' : 'Play · double-click a text to retype it'}/>
    <span className="sb-pl-big" aria-hidden="true">{Icon.big}</span>
    <div className="sb-pl-over-bar">{controls}</div>
  </div>;
  return <div ref={host} className="sb-pl" data-sb-ui="" data-sb-line={title} style={{left: x, top: y - PLAYER_HEAD, width: FRAME.w}} onPointerEnter={warm} onPointerLeave={unwarm}>
    <div className="sb-pl-head" style={{height: BAR, marginBottom: BAR_GAP}}>
      <span className="sb-fname">{`Video · ${title || 'the storyboard'}`}</span>
      <b className="sb-fnum">{playing ? 'PLAYING' : 'VIDEO'}</b>
      <i className="sb-ftime">{clock(timeline.total)}</i>
    </div>
    <div ref={screen} className="sb-pl-screen" onClick={clickScreen} onDoubleClick={retype} title={playing ? 'Pause · double-click a text to retype it' : 'Play · double-click a text to retype it'}/>
    <div className="sb-pl-bar" style={{marginTop: NOTES_GAP, height: NOTES_H}}>
      {controls}
      <span ref={labelEl} className="sb-pl-label"/>
    </div>
  </div>;
}
