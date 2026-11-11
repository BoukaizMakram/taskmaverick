'use client';

// ---------------------------------------------------------------------------
// SectionVideo — a storyboard section video on the AI demo call's stage
// (/demo-ai), played the way the storyboard plays it (the director and the
// engine of components/storyboardPlayerDom.js, the board's own look: the edits
// of content/storyboard/<board>.json), from frames made in the visitor's page
// with the visitor's data (components/demo-ai/liveCapture.js).
// Chapter by chapter, in step with Mav's voice (the user, 2026-10-19: the
// video's words as designed, Mav says them, each chapter plays while she speaks
// its sentence, then waits): [[video scene <chapter>]] lets the chapter on
// finish, then plays that one and holds on its last picture.
//   load(video, run)  the part (a run of the board: lib/storyboardVideos.mjs) of a video
//   play()            the whole part from the start, by itself
//   scene(chapter)    one chapter (→ true once it has started; false: not in the part)
//   hold()            stop at the end of the chapter on
//   seek(t)           a still at second t of the part
//   info              {board, run, chapter, playing, chapters}
// ---------------------------------------------------------------------------

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { createPlayerEngine, directorOf } from '../storyboardPlayerDom';
import { profileOf, VIDEO_RUNS } from '@/lib/storyboardVideos.mjs';
import { linesOf, normalizeEdits, orderedFrames } from '@/lib/storyboardEdits.mjs';
import { cellsOf, expandLine } from '@/lib/storyboardCells.mjs';
import { defaultLooks } from '@/lib/sections/captureCore.mjs';
import planningEdits from '@/content/storyboard/precision-planning-v2.json';
import maintenanceEdits from '@/content/storyboard/requesting-maintenance-v2.json';
import '../EfficiencyStoryDemo.css';
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../sections/sections.css';
import '../sections/sectionStyles';
import '../TicketCard.css';
import '../EfficiencyV2Demo.css';
import '../ReferenceBoard.css';
import '../CaptionBubbles.css';
import '../DemoHand.css';
import '../web/web.css';
import '../Storyboard.css';

// The look each board gives its frames (the split design, the words and titles, the tablet): what the storyboard shows, so the call plays the board's video.
const BOARD_EDITS = { 'precision-planning-v2': planningEdits, 'requesting-maintenance-v2': maintenanceEdits };
const looks = new WeakMap();
function editsFor(video) {
  if (!looks.has(video)) {
    const edits = normalizeEdits(BOARD_EDITS[video.video] ?? {});
    looks.set(video, { ...edits, frames: defaultLooks(video.frames, edits.frames) }); // (a frame the board has no look for gets the one a capture gives it)
  }
  return looks.get(video);
}
// The slides of a part, as the board puts them together for its video.
function slidesOf(video, edits, run) {
  const all = orderedFrames(video.frames, edits, linesOf(video.chapters, edits).map(l => l.id));
  const cells = cellsOf(edits, all), byId = Object.fromEntries(all.map(f => [f.id, f])), by = new Map();
  for (const f of all) if (!cells.hidden.has(f.id)) { if (!by.has(f.chapter)) by.set(f.chapter, []); by.get(f.chapter).push(f); }
  return run.lines.flatMap(id => expandLine(by.get(id) ?? [], cells, byId));
}
export const runsOfBoard = board => VIDEO_RUNS[board] ?? [];

const SectionVideo = forwardRef(function SectionVideo(_, ref) {
  const screen = useRef(null), engine = useRef(null), raf = useRef(0);
  const st = useRef({ video: null, edits: null, run: null, script: null, spans: new Map(), order: [], t: 0, stopAt: 0, playing: false, last: 0, waiters: [] });

  const draw = useCallback(ahead => {
    const s = st.current, e = engine.current;
    if (!e || !s.script) return;
    e.setSource({ frames: s.script.played, edits: s.edits, video: s.video, script: s.script });
    try { e.show(s.t, ahead); } catch (error) { console.error('[video]', error); } // (a picture it cannot draw never takes the call down)
  }, []);
  const release = () => { const s = st.current, list = s.waiters; s.waiters = []; list.forEach(done => done()); };
  const tick = useCallback(now => {
    const s = st.current;
    if (!s.playing) return;
    s.t = Math.min(s.stopAt, s.t + Math.min(0.1, (now - s.last) / 1000)); // (a tab that was away does not jump)
    s.last = now;
    draw(true);
    if (s.t >= s.stopAt) { s.playing = false; draw(false); release(); return; }
    raf.current = requestAnimationFrame(tick);
  }, [draw]);
  const start = useCallback(() => {
    const s = st.current;
    if (s.playing || s.t >= s.stopAt) return;
    s.playing = true; s.last = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);
  const stopped = ms => new Promise(resolve => {
    const s = st.current;
    if (!s.playing) return resolve(true);
    const timer = setTimeout(() => resolve(false), ms);
    s.waiters.push(() => { clearTimeout(timer); resolve(true); });
  });
  const chapterAt = t => { const s = st.current; return s.order.find(id => t < s.spans.get(id).end - 0.01) ?? s.order.at(-1) ?? null; };

  useEffect(() => {
    const e = createPlayerEngine(screen.current, { onRedraw: () => draw(st.current.playing) });
    engine.current = e;
    draw(false);
    return () => { cancelAnimationFrame(raf.current); e.dispose(); engine.current = null; release(); };
  }, [draw]);

  useImperativeHandle(ref, () => ({
    load(video, runId) {
      const run = runsOfBoard(video.video).find(r => r.id === runId) ?? runsOfBoard(video.video)[0];
      if (!run) return false;
      const s = st.current, edits = editsFor(video), slides = slidesOf(video, edits, run);
      const script = directorOf(slides, edits, video, profileOf(video.video, run.title));
      const spans = new Map(), order = [];
      script.played.forEach((frame, i) => {
        const item = script.timeline.items[i], span = spans.get(frame.chapter);
        if (!span) { spans.set(frame.chapter, { start: item.start, end: item.start + item.hold }); order.push(frame.chapter); } else span.end = item.start + item.hold;
      });
      cancelAnimationFrame(raf.current);
      Object.assign(s, { video, edits, run, script, spans, order, t: 0, stopAt: 0, playing: false });
      release();
      draw(false);
      return true;
    },
    play() { const s = st.current; if (!s.script) return; s.t = 0; s.stopAt = s.script.timeline.total; start(); },
    async scene(id) {
      const s = st.current, span = s.spans.get(id);
      if (!span) return false;
      const now = chapterAt(s.t);
      if (s.playing) {
        s.stopAt = Math.min(s.stopAt, s.spans.get(now).end - 0.001); // (the chapter on is let to finish, never cut)
        if (now === id) return true;
        await stopped(9000);
      }
      if (Math.abs(s.t - span.start) > 0.05) s.t = span.start; // (a chapter that is not the next one: from its start)
      s.stopAt = span.end - 0.001;
      start();
      return true;
    },
    hold() { const s = st.current; if (s.playing) s.stopAt = Math.min(s.stopAt, s.spans.get(chapterAt(s.t)).end - 0.001); },
    seek(t) { const s = st.current; if (!s.script) return; cancelAnimationFrame(raf.current); s.playing = false; release(); s.t = Math.max(0, Math.min(s.script.timeline.total, t)); s.stopAt = s.t; draw(false); }, // (a still at second t: to compare it with the board's own video)
    get info() { const s = st.current; return s.video ? { board: s.video.video, run: s.run?.id, chapter: chapterAt(s.t), playing: s.playing, chapters: s.order } : null; },
  }), [draw, start]);

  return <div className="dai-video" aria-label="Storyboard video"><div ref={screen} className="sb-pl-screen"/></div>;
});

export default SectionVideo;
