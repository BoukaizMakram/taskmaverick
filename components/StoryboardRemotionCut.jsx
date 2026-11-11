'use client';
// A board's Remotion cut on the All videos page (the user, 2026-11-04: "give me another variation ... in increased efficiency, use remotion for this variation"): when the variation that plays is the look
// `remotion` (lib/storyboardVariations.mjs) and the board has a cut (lib/remotion/cuts.mjs), its video is THIS: Remotion's Player playing the composition (components/remotion/), in the same frame, with the
// same bar (play, the seek bar, the clock) as a stitched video (StoryboardAllVideos.jsx `Stitched`). What the page does with a video works here too: a press selects it, a click plays or pauses, the
// Comment tool (C) puts a pin at the second it is on, a pin shows only in its scene (a sentence of the cut), it is dragged, right-clicked, listed in the inspector; a right-click opens the page's menu.
// A double-click on its words retypes them (the user, 2026-11-05: "is it possible to do it right now in the website double click" -> "Yes, build it"): the sentence, the label over it or the title. The cut
// stops, the words are a text box in their place (Enter keeps them, Shift+Enter a new line, Esc leaves them as they were; emptied, the narration's words come back), and they are kept in the board's file
// (`edits.cuts`, lib/remotion/cutWords.mjs: `onCutText`). The cut is made again from them (`make(words)`), its length too, and the MP4 render reads the same file.
// `io`: the page's (the Cell's) {commentTool, pinSel, ops, onPin(part, id, fresh), onMenu(event, info), onPinMenu(event, part, c), videos, onTiming, onCutText(cutId, key, text, original)}.
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Player} from '@remotion/player';
import StoryboardPins from './StoryboardPins';
import {CUT_COMPONENTS} from './remotion';
import {commentsOf} from '@/lib/storyboardComments.mjs';
import {ALL_LAYOUT, placeKeyOf, stitchedComments} from '@/lib/storyboardAllVideos.mjs';
import {STAGE_H, STAGE_W} from '@/lib/storyboardLayers.mjs';
import {clock} from '@/lib/storyboardPlayer.mjs';
import {cutLayoutOf, cutPartOf} from '@/lib/remotion/cuts.mjs';
import {cutWordsOf} from '@/lib/remotion/cutWords.mjs';
import './StoryboardRemotionCut.css';

const Icon = {
  big: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>,
};
const round2 = n => Math.round(n * 100) / 100;
// where the text box of a retyped text is (stage px), from the box of the words on the picture: a sentence starts where it starts (left-aligned) and has room to grow to the right, the label at its left
// ends where it ends (right-aligned) and grows to the left (the user, 2026-11-05: the label at the left of the sentence), the title the picture's width (a text of the UI: its own box, a little wider)
const editBox = (kind, b) => {
  if (kind === 'ui') return {x: b.x - 6, w: Math.max(b.w + 90, 170), y: b.y - 4, h: b.h + 8};
  if (kind === 'title') return {x: 80, w: 1440, y: b.y - 12, h: b.h + 24};
  if (kind === 'kicker') { const w = Math.max(b.w + 100, 260), right = b.x + b.w + 12; return {x: Math.max(20, right - w), w: Math.min(w, right - 20), y: b.y - 10, h: b.h + 20}; }
  const x = b.x - 12; return {x, w: Math.min(STAGE_W - 20 - x, Math.max(b.w + 120, 560)), y: b.y - 8, h: b.h + 16};
};
const UI_KEY = /^(mission|schedule|person|board):/; // (the texts of the UI: one line each, lib/remotion/cutWords.mjs)
const kindOf = key => (UI_KEY.test(key) ? 'ui' : key === 'title' ? 'title' : key.endsWith(':kicker') ? 'kicker' : 'lines');

export default function StoryboardRemotionCut({entry, cut, edits, onTotal, io}) {
  const board = entry.board, {commentTool, pinSel, ops, onPin, onMenu, onPinMenu, videos, onTiming, onCutText} = io;
  const part = useMemo(() => cutPartOf(board), [board]), Comp = CUT_COMPONENTS[board];
  const player = useRef(null), trackEl = useRef(null), fillEl = useRef(null), knobEl = useRef(null), clockEl = useRef(null), screenEl = useRef(null), pinsEl = useRef(null), scrub = useRef(null), editEl = useRef(null);
  const [playing, setPlaying] = useState(false), [started, setStarted] = useState(false);
  // the cut as the board's file has its words
  const words = useMemo(() => cutWordsOf(edits, cut.id), [edits?.cuts, cut.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const layout = cutLayoutOf(edits); // (how the variation that plays lays the cut out: Improved Quality's mission words beside it, or 'under' it)
  const plan = useMemo(() => cut.make(words, {layout}), [cut, words, layout]), total = plan.seconds;
  // the text being retyped: {key, kind, lines, original, box}
  const [editing, setEditing] = useState(null), editingRef = useRef(null); editingRef.current = editing;
  const inputProps = useMemo(() => ({words, layout, hide: editing?.key ?? null}), [words, layout, editing?.key]);
  const comments = commentsOf(edits, part.title), picked = pinSel && pinSel.board === board && pinSel.title === part.title ? pinSel.id : null;
  const numbered = useMemo(() => stitchedComments([part], edits), [part, edits?.comments, edits?.variations]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = useRef(null); live.current = {comments, picked, started, plan};
  useEffect(() => { onTotal?.(total); }, [total]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onTiming(board, {[part.id]: 0}); }, [board, part]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = useCallback(() => (player.current?.getCurrentFrame() ?? 0) / cut.fps, [cut.fps]);
  // the pins of the scene the video is on (the picked one always), the bar, the knob, the clock
  const paint = useCallback(() => {
    const t = now(), {comments: list, picked: id, plan: p} = live.current, root = pinsEl.current, scene = p.sceneAt(t);
    if (root) for (const el of root.children) { const c = list.find(x => x.id === el.dataset.id); el.hidden = !(c && !c.done && (c.id === id || p.sceneAt(c.at) === scene)); }
    const all = p.seconds, at = all ? Math.min(1, t / all) : 0;
    if (fillEl.current) fillEl.current.style.transform = `scaleX(${at})`;
    if (knobEl.current) knobEl.current.style.left = `${at * 100}%`;
    if (clockEl.current) clockEl.current.textContent = `${clock(t)} / ${clock(all)}`;
  }, [now]);
  useLayoutEffect(() => { paint(); }, [comments, picked, playing, plan, paint]);
  useEffect(() => {
    const p = player.current;
    if (!p) return undefined;
    const onPlay = () => { setPlaying(true); setStarted(true); }, onStop = () => { setPlaying(false); paint(); };
    p.addEventListener('frameupdate', paint); p.addEventListener('play', onPlay); p.addEventListener('pause', onStop); p.addEventListener('ended', onStop);
    return () => { p.removeEventListener('frameupdate', paint); p.removeEventListener('play', onPlay); p.removeEventListener('pause', onStop); p.removeEventListener('ended', onStop); };
  }, [paint]);

  const stop = useCallback(() => { if (player.current?.isPlaying()) player.current.pause(); }, []);
  const seekTo = useCallback(seconds => { const {plan: p} = live.current, f = Math.round(Math.max(0, Math.min(p.seconds, seconds)) * cut.fps); player.current?.seekTo(Math.max(0, Math.min(p.frames - 1, f))); setStarted(true); paint(); }, [cut.fps, paint]);
  const toggle = () => { const p = player.current; if (!p || editingRef.current) return; setStarted(true); if (p.isPlaying()) p.pause(); else p.play(); };
  // A reload keeps the video on the second it was at (as a stitched video: placeKeyOf)
  useEffect(() => {
    let place = null;
    try { place = JSON.parse(localStorage.getItem(placeKeyOf(board))); } catch {}
    if (place?.part === part.id) seekTo(Number(place.at) || 0);
    const keep = () => { if (!live.current.started) return; try { localStorage.setItem(placeKeyOf(board), JSON.stringify({part: part.id, at: round2(now())})); } catch {} };
    const hide = () => { if (document.visibilityState === 'hidden') keep(); };
    window.addEventListener('pagehide', keep); document.addEventListener('visibilitychange', hide);
    return () => { keep(); window.removeEventListener('pagehide', keep); document.removeEventListener('visibilitychange', hide); };
  }, [board, part, now, seekTo]);
  // A comment clicked in the inspector: the video stops on it
  useEffect(() => { const go = (id, at) => { if (id !== part.id) return; stop(); seekTo(at); }; videos.set(board, go); return () => { videos.delete(board); }; }, [videos, board, part, stop, seekTo]);

  // the bar
  const secondsAt = event => { const r = trackEl.current.getBoundingClientRect(); return Math.min(1, Math.max(0, (event.clientX - r.left) / Math.max(1, r.width))) * live.current.plan.seconds; };
  const pressBar = event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); scrub.current = {resume: !!player.current?.isPlaying()}; stop(); seekTo(secondsAt(event)); };
  const dragBar = event => { if (scrub.current) seekTo(secondsAt(event)); };
  const releaseBar = () => { const s = scrub.current; scrub.current = null; if (s?.resume) player.current?.play(); };
  // the picture: a click plays or pauses (with the Comment tool: a comment there, at this second), a right-click opens the page's menu
  const pointOf = event => { const r = screenEl.current.getBoundingClientRect(); return r.width ? {x: round2((event.clientX - r.left) / r.width * STAGE_W), y: round2((event.clientY - r.top) / r.height * STAGE_H)} : null; };
  const click = event => {
    if (event.detail > 1) return;
    if (!commentTool) { toggle(); return; }
    const point = pointOf(event);
    if (!point) return;
    stop();
    const id = ops.addTo(board, part.title, {x: point.x, y: point.y, at: round2(now()), text: ''});
    if (id) onPin(part, id, true);
  };
  const menu = event => { event.preventDefault(); stop(); onMenu(event, {board, name: entry.name, part, at: round2(now()), point: pointOf(event), cut: true}); };
  const pickPin = c => { stop(); onPin(part, c.id, false); };

  // ---- retyping a text of the cut ----
  // the text under the pointer: one of the composition's `data-rc-text` (the picture lets every press through to the click layer, so they are found by their boxes), the one on top first, and only one that
  // is seen (its own opacity and its parents': at a new scene the art is there unseen under the words in the middle)
  const seen = (el, root) => { let o = 1; for (let n = el; n && n !== root && o >= 0.05; n = n.parentElement) { const s = getComputedStyle(n); if (s.visibility === 'hidden') return 0; o *= Number(s.opacity); } return o; };
  const textAt = event => {
    const root = screenEl.current;
    if (!root) return null;
    const S = root.getBoundingClientRect(), k = S.width / STAGE_W || 1, pad = 14 * k;
    for (const el of [...root.querySelectorAll('[data-rc-text]')].reverse()) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || seen(el, root) < 0.05) continue;
      if (event.clientX >= r.left - pad && event.clientX <= r.right + pad && event.clientY >= r.top - pad && event.clientY <= r.bottom + pad) return {key: el.dataset.rcText, box: {x: (r.left - S.left) / k, y: (r.top - S.top) / k, w: r.width / k, h: r.height / k}};
    }
    return null;
  };
  const retype = event => {
    event.preventDefault();
    if (commentTool) return;
    stop();
    const hit = textAt(event), text = hit && plan.textOf(hit.key);
    if (!text) return;
    const kind = kindOf(hit.key);
    setEditing({key: hit.key, kind, lines: text.lines, original: text.original, box: editBox(kind, hit.box)});
  };
  useLayoutEffect(() => { // (the box takes the keyboard, its words picked, as tall as they are)
    const el = editEl.current;
    if (!editing || !el) return;
    el.focus({preventScroll: true}); el.select();
    el.style.height = 'auto'; el.style.height = `${Math.max(el.scrollHeight, editing.box.h)}px`;
  }, [editing]);
  const keep = useCallback(() => { const ed = editingRef.current; if (!ed) return; editingRef.current = null; setEditing(null); onCutText(cut.id, ed.key, editEl.current?.value ?? ed.lines.join('\n'), ed.original); }, [cut.id, onCutText]);
  const leave = () => { editingRef.current = null; setEditing(null); };
  const editKey = event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); leave(); }
    else if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); keep(); }
  };
  const grow = event => { const el = event.currentTarget; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; };

  const hint = commentTool ? 'Click to put a comment here' : `${playing ? 'Pause' : 'Play'} · double-click its words to retype them · right-click: a comment here, the render command`;
  return <>
    <div ref={screenEl} className="sb-av-screen sb-av-cut" data-sb-ui="">
      {Comp ? <Player ref={player} component={Comp} inputProps={inputProps} durationInFrames={plan.frames} fps={cut.fps} compositionWidth={cut.width} compositionHeight={cut.height} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
        controls={false} clickToPlay={false} doubleClickToFullscreen={false} spaceKeyToPlayOrPause={false}/> : <span className="sb-av-wait">This board has no Remotion cut</span>}
      <div className={`sb-av-hit${commentTool ? ' is-comment' : ''}`} onClick={click} onDoubleClick={retype} onContextMenu={menu} title={hint}/>
      <StoryboardPins rootRef={pinsEl} className="sb-av-pins" screen={() => screenEl.current} list={comments} picked={picked} number={c => numbered.find(r => r.comment.id === c.id)?.number}
        pick={pickPin} move={(c, xy) => ops.changeIn(board, part.title, c.id, xy)} menu={(event, c) => onPinMenu(event, part, c)}/>
      {editing && <>
        <textarea ref={editEl} className={`sb-av-cut-edit is-${editing.kind}`} style={{left: editing.box.x, top: editing.box.y, width: editing.box.w, minHeight: editing.box.h}} defaultValue={editing.lines.join('\n')} rows={Math.max(1, editing.lines.length)}
          spellCheck={false} aria-label="Retype the words" onKeyDown={editKey} onInput={grow} onBlur={keep} onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()} onContextMenu={e => e.stopPropagation()}/>
        <span className="sb-av-cut-tip" style={{left: editing.box.x + editing.box.w / 2, top: editing.box.y}}>Enter: keep · Shift+Enter: a new line · Esc: leave it · empty: the narration's words</span>
      </>}
      <span className={`sb-av-big${started ? ' is-gone' : ''}`} aria-hidden="true">{Icon.big}</span>
    </div>
    <div className="sb-pl-bar sb-av-controls" data-sb-ui="" style={{marginTop: ALL_LAYOUT.barGap, height: ALL_LAYOUT.bar}}>
      <button type="button" className="sb-pl-play" onMouseDown={e => e.preventDefault()} onClick={toggle} aria-label={playing ? 'Pause the video' : 'Play the video'}>{playing ? Icon.pause : Icon.big}</button>
      <div className="sb-pl-seek" onPointerDown={pressBar} onPointerMove={dragBar} onPointerUp={releaseBar} onPointerCancel={releaseBar} role="slider" aria-label="Video position" aria-valuemin={0} aria-valuemax={Math.round(total)}>
        <div ref={trackEl} className="sb-pl-track"><i ref={fillEl} className="sb-pl-fill"/><i ref={knobEl} className="sb-pl-knob"/></div>
      </div>
      <span ref={clockEl} className="sb-pl-clock"/>
    </div>
  </>;
}
