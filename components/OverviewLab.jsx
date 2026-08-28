'use client';

// ---------------------------------------------------------------------------
// OverviewLab — authoring/preview harness for OverviewBoard (route /overview).
// Owns all state and renders a control panel under the board so different
// animations can be previewed:
//   • Timers — play / pause (real-time, one whole second per second) + reset.
//     While playing the pills tick up and loop every LOOP_SECONDS.
//   • Highlight — none / column / row / cell, with a chooser for which one.
//   • Effect — "Dim others" (fade everything but the target) or "Pop out"
//     (lift the target). Both animate smoothly (CSS transitions).
//   • Inline edit — double-click any text or timer on the board to change it.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import OverviewBoard from '@/components/OverviewBoard';

const LOOP_SECONDS = 60; // seamless loop: timers snap back to posted values

const toSecs = (t) => {
  const parts = String(t).trim().split(':').map((s) => parseInt(s, 10));
  if (!parts.length || parts.some((n) => Number.isNaN(n))) return NaN;
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else [s] = parts;
  return h * 3600 + m * 60 + s;
};
const fmt = (total) => {
  const s = ((Math.floor(total) % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const DEFAULT_HEADERS = ['Mission', 'Closed By', 'Open', 'Claimed', 'Duration'];
const DEFAULT_DATE = '11/1/2025 - 11/30/2026';

// Rows exactly as posted in Frame 47185. open/claimed carry their aging color;
// Duration is always gray.
const START = [
  { by: 'Freddy Espain', open: ['00:16:29', 'orange'], claimed: ['00:12:51', 'red'], duration: '00:29:20' },
  { by: 'Lisa Chang', open: ['00:22:40', 'red'], claimed: ['00:10:51', 'green'], duration: '00:33:31' },
  { by: 'Freddy Espain', open: ['00:04:01', 'green'], claimed: ['00:06:09', 'green'], duration: '00:10:11' },
  { by: 'Amy Sanchez', open: ['00:05:40', 'green'], claimed: ['00:12:43', 'green'], duration: '00:10:11' },
  { by: 'George Davis', open: ['00:01:13', 'green'], claimed: ['00:13:31', 'green'], duration: '00:14:54' },
  { by: 'Lisa Chang', open: ['00:16:29', 'orange'], claimed: ['00:12:51', 'red'], duration: '00:39:20' },
  { by: 'Freddy Espain', open: ['00:05:29', 'green'], claimed: ['00:30:51', 'red'], duration: '00:36:20' },
  { by: 'Amy Sanchez', open: ['00:01:30', 'green'], claimed: ['00:12:20', 'orange'], duration: '00:13:50' },
];

const buildRows = () =>
  START.map((r) => {
    const cell = (v, tone) => {
      const base = toSecs(v);
      return { base, secs: base, tone };
    };
    return {
      mission: 'Checklist',
      by: r.by,
      open: cell(r.open[0], r.open[1]),
      claimed: cell(r.claimed[0], r.claimed[1]),
      duration: cell(r.duration, 'gray'),
    };
  });

const cap = (s) => s[0].toUpperCase() + s.slice(1);

export default function OverviewLab() {
  const [headers, setHeaders] = useState(DEFAULT_HEADERS);
  const [date, setDate] = useState(DEFAULT_DATE);
  const [rows, setRows] = useState(buildRows);
  const [paused, setPaused] = useState(false);
  const [highlight, setHighlight] = useState({ mode: 'none', effects: ['dim'], col: 2, row: 0 });
  const loopRef = useRef(0);

  // Real-time tick (one whole second per second); loops every LOOP_SECONDS.
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      loopRef.current += 1;
      const reset = loopRef.current >= LOOP_SECONDS;
      if (reset) loopRef.current = 0;
      setRows((prev) =>
        prev.map((row) => {
          const step = (c) => ({ ...c, secs: reset ? c.base : c.secs + 1 });
          return { ...row, open: step(row.open), claimed: step(row.claimed), duration: step(row.duration) };
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  // Board wants display strings; keep numeric secs internally.
  const boardRows = rows.map((row) => ({
    mission: row.mission,
    by: row.by,
    open: { disp: fmt(row.open.secs), tone: row.open.tone },
    claimed: { disp: fmt(row.claimed.secs), tone: row.claimed.tone },
    duration: { disp: fmt(row.duration.secs), tone: row.duration.tone },
  }));

  const onEdit = (path, value) => {
    const v = value.trim();
    if (path.type === 'header') setHeaders((h) => h.map((x, i) => (i === path.col ? v : x)));
    else if (path.type === 'date') setDate(v);
    else if (path.type === 'mission') setRows((rs) => rs.map((r, i) => (i === path.row ? { ...r, mission: v } : r)));
    else if (path.type === 'by') setRows((rs) => rs.map((r, i) => (i === path.row ? { ...r, by: v } : r)));
    else if (path.type === 'timer') {
      const secs = toSecs(v);
      if (Number.isNaN(secs)) return;
      setRows((rs) => rs.map((r, i) => (i === path.row ? { ...r, [path.key]: { ...r[path.key], base: secs, secs } } : r)));
    }
  };

  const reset = () => {
    setHeaders(DEFAULT_HEADERS);
    setDate(DEFAULT_DATE);
    setRows(buildRows());
    loopRef.current = 0;
  };

  const setHl = (patch) => setHighlight((h) => ({ ...h, ...patch }));
  const toggleEffect = (e) =>
    setHighlight((h) => ({
      ...h,
      effects: h.effects.includes(e) ? h.effects.filter((x) => x !== e) : [...h.effects, e],
    }));
  const colOn = highlight.mode === 'column' || highlight.mode === 'cell';
  const rowOn = highlight.mode === 'row' || highlight.mode === 'cell';

  // Scroll buttons drive the zoom pan (imperative, so the board keeps the
  // clamp/geometry in one place). One 140px step animates via the CSS ease.
  const boardRef = useRef(null);
  const zoomOn = highlight.mode !== 'none' && highlight.effects.includes('zoom');
  const STEP = 140;
  const scroll = (dx, dy) => boardRef.current?.panBy(dx, dy);
  const canX = highlight.mode !== 'column'; // rows/cells pan horizontally
  const canY = highlight.mode !== 'row'; // columns/cells pan vertically

  return (
    <div className="ov-lab">
      <OverviewBoard ref={boardRef} headers={headers} date={date} rows={boardRows} highlight={highlight} editable onEdit={onEdit} />

      <div className="ov-controls">
        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Timers</span>
          <button type="button" className="ov-btn" onClick={() => setPaused((p) => !p)}>
            {paused ? '▶ Play' : '⏸ Pause'}
          </button>
          <button type="button" className="ov-btn" onClick={reset}>
            ↺ Reset
          </button>
          <span className="ov-ctrl-hint">Double-click any text or timer on the board to edit it</span>
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Highlight</span>
          {['none', 'column', 'row', 'cell'].map((m) => (
            <button
              key={m}
              type="button"
              className={`ov-btn${highlight.mode === m ? ' is-on' : ''}`}
              onClick={() => setHl({ mode: m })}
            >
              {cap(m)}
            </button>
          ))}
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Effects</span>
          {[
            ['dim', 'Dim others'],
            ['pop', 'Pop out'],
            ['zoom', 'Zoom in'],
          ].map(([s, label]) => (
            <button
              key={s}
              type="button"
              disabled={highlight.mode === 'none'}
              className={`ov-btn${highlight.effects.includes(s) ? ' is-on' : ''}`}
              onClick={() => toggleEffect(s)}
            >
              {label}
            </button>
          ))}
          <span className="ov-ctrl-hint">combine freely — e.g. Dim + Zoom</span>
        </div>

        {zoomOn && (
          <div className="ov-ctrl-row">
            <span className="ov-ctrl-label">Scroll</span>
            <button type="button" className="ov-btn ov-btn--icon" disabled={!canX} onClick={() => scroll(STEP, 0)} aria-label="Scroll left" title="Scroll left">◀</button>
            <button type="button" className="ov-btn ov-btn--icon" disabled={!canX} onClick={() => scroll(-STEP, 0)} aria-label="Scroll right" title="Scroll right">▶</button>
            <button type="button" className="ov-btn ov-btn--icon" disabled={!canY} onClick={() => scroll(0, STEP)} aria-label="Scroll up" title="Scroll up">▲</button>
            <button type="button" className="ov-btn ov-btn--icon" disabled={!canY} onClick={() => scroll(0, -STEP)} aria-label="Scroll down" title="Scroll down">▼</button>
            <button type="button" className="ov-btn" onClick={() => boardRef.current?.recenter()}>Recenter</button>
            <span className="ov-ctrl-hint">or drag the board</span>
          </div>
        )}

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Column</span>
          {headers.map((label, c) => (
            <button
              key={c}
              type="button"
              disabled={!colOn}
              className={`ov-btn${colOn && highlight.col === c ? ' is-on' : ''}`}
              onClick={() => setHl({ col: c })}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Row</span>
          {rows.map((_, r) => (
            <button
              key={r}
              type="button"
              disabled={!rowOn}
              className={`ov-btn${rowOn && highlight.row === r ? ' is-on' : ''}`}
              onClick={() => setHl({ row: r })}
            >
              #{r + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
