'use client';

// ---------------------------------------------------------------------------
// RunningLab — authoring/preview harness for RunningBoard (route /running).
// Adds the full animation toolkit under the board:
//   • Timers — play / pause the live Open + Duration timers on the OPEN rows
//     (they tick up one whole second per second; Closed rows stay frozen).
//   • Highlight — none / column / row / cell, with a chooser.
//   • Effects — Dim others / Pop out / Zoom in, combinable.
//   • Scroll — pan the zoomed view (buttons or drag).
// Reuses the .ov-* control-panel styles.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import RunningBoard, { RUNNING_ROWS, RUNNING_COLS } from '@/components/RunningBoard';

const LOOP_SECONDS = 120;

const toSecs = (t) => {
  const [h, m, s] = String(t).split(':').map(Number);
  return h * 3600 + m * 60 + s;
};
const fmt = (total) => {
  const s = ((Math.floor(total) % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// Open rows carry live seconds (open + duration tick together); closed rows keep
// their static final strings.
const buildRows = () =>
  RUNNING_ROWS.map((r) =>
    r.state === 'open'
      ? { ...r, openBase: toSecs(r.open), durBase: toSecs(r.dur), openSecs: toSecs(r.open), durSecs: toSecs(r.dur) }
      : { ...r }
  );

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const STEP = 220;

export default function RunningLab() {
  const [rows, setRows] = useState(buildRows);
  const [paused, setPaused] = useState(false);
  const [highlight, setHighlight] = useState({ mode: 'none', effects: ['dim'], col: 5, row: 0 });
  const loopRef = useRef(0);
  const boardRef = useRef(null);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      loopRef.current += 1;
      const reset = loopRef.current >= LOOP_SECONDS;
      if (reset) loopRef.current = 0;
      setRows((prev) =>
        prev.map((r) =>
          r.state === 'open'
            ? { ...r, openSecs: reset ? r.openBase : r.openSecs + 1, durSecs: reset ? r.durBase : r.durSecs + 1 }
            : r
        )
      );
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  // board wants display strings
  const boardRows = rows.map((r) =>
    r.state === 'open' ? { ...r, open: fmt(r.openSecs), dur: fmt(r.durSecs) } : r
  );

  const setHl = (patch) => setHighlight((h) => ({ ...h, ...patch }));
  const toggleEffect = (e) =>
    setHighlight((h) => ({ ...h, effects: h.effects.includes(e) ? h.effects.filter((x) => x !== e) : [...h.effects, e] }));
  const colOn = highlight.mode === 'column' || highlight.mode === 'cell';
  const rowOn = highlight.mode === 'row' || highlight.mode === 'cell';
  const zoomOn = highlight.mode !== 'none' && highlight.effects.includes('zoom');
  const canX = highlight.mode !== 'column';
  const canY = highlight.mode !== 'row';
  const scroll = (dx, dy) => boardRef.current?.panBy(dx, dy);

  return (
    <div className="ov-lab">
      <RunningBoard ref={boardRef} rows={boardRows} highlight={highlight} />

      <div className="ov-controls">
        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Timers</span>
          <button type="button" className="ov-btn" onClick={() => setPaused((p) => !p)}>{paused ? '▶ Play' : '⏸ Pause'}</button>
          <button type="button" className="ov-btn" onClick={() => { setRows(buildRows()); loopRef.current = 0; }}>↺ Reset</button>
          <span className="ov-ctrl-hint">open rows tick up; closed rows stay frozen</span>
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Highlight</span>
          {['none', 'column', 'row', 'cell'].map((m) => (
            <button key={m} type="button" className={`ov-btn${highlight.mode === m ? ' is-on' : ''}`} onClick={() => setHl({ mode: m })}>{cap(m)}</button>
          ))}
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Effects</span>
          {[['dim', 'Dim others'], ['pop', 'Pop out'], ['zoom', 'Zoom in']].map(([s, label]) => (
            <button key={s} type="button" disabled={highlight.mode === 'none'} className={`ov-btn${highlight.effects.includes(s) ? ' is-on' : ''}`} onClick={() => toggleEffect(s)}>{label}</button>
          ))}
          <span className="ov-ctrl-hint">combine freely — e.g. Dim + Zoom</span>
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Column</span>
          {RUNNING_COLS.map((label, c) => (
            <button key={c} type="button" disabled={!colOn} className={`ov-btn${colOn && highlight.col === c ? ' is-on' : ''}`} onClick={() => setHl({ col: c })}>{label}</button>
          ))}
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Row</span>
          {rows.map((_, r) => (
            <button key={r} type="button" disabled={!rowOn} className={`ov-btn ov-btn--icon${rowOn && highlight.row === r ? ' is-on' : ''}`} onClick={() => setHl({ row: r })}>{r + 1}</button>
          ))}
        </div>

        {zoomOn && (
          <div className="ov-ctrl-row">
            <span className="ov-ctrl-label">Scroll</span>
            <button type="button" className="ov-btn ov-btn--icon" disabled={!canX} onClick={() => scroll(STEP, 0)} title="Scroll left">◀</button>
            <button type="button" className="ov-btn ov-btn--icon" disabled={!canX} onClick={() => scroll(-STEP, 0)} title="Scroll right">▶</button>
            <button type="button" className="ov-btn ov-btn--icon" disabled={!canY} onClick={() => scroll(0, STEP)} title="Scroll up">▲</button>
            <button type="button" className="ov-btn ov-btn--icon" disabled={!canY} onClick={() => scroll(0, -STEP)} title="Scroll down">▼</button>
            <button type="button" className="ov-btn" onClick={() => boardRef.current?.recenter()}>Recenter</button>
            <span className="ov-ctrl-hint">or drag the board</span>
          </div>
        )}
      </div>
    </div>
  );
}
