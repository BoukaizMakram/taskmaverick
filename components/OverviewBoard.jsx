'use client';

// ---------------------------------------------------------------------------
// OverviewBoard — HTML/CSS recreation of the Figma "Overview / Running" board
// (Frame 47185): a white card with the TM logo + a date-range box, and a
// 5-column table (Mission · Closed By · Open · Claimed · Duration) of mission
// rows whose Open/Claimed/Duration values are timer pills.
//
// Presentational + interactive-per-cell only: it renders whatever `rows`/
// `headers`/`date` it's given, and supports two authoring affordances used by
// the /overview lab (OverviewLab):
//   • highlight — dim everything except a target, or pop the target out. The
//     target is a column, a row, or a single cell (see `highlight`).
//   • editable — double-click any text or timer to change it (EditableText).
// All timer ticking / play-pause / control buttons live in OverviewLab; this
// component is a pure function of its props.
// ---------------------------------------------------------------------------

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const IconMenu = () => (
  <svg className="ov-menu" viewBox="0 0 4 18" aria-hidden="true">
    <circle cx="2" cy="2.5" r="1.6" />
    <circle cx="2" cy="9" r="1.6" />
    <circle cx="2" cy="15.5" r="1.6" />
  </svg>
);

// Double-click to edit → swaps the text for an uncontrolled input (so the
// per-second re-render from the ticking timers never clobbers what's typed).
// Commits on blur or Enter; Escape cancels.
function EditableText({ value, onCommit, editable, className = '', inputClassName = '' }) {
  const [editing, setEditing] = useState(false);
  if (editable && editing) {
    return (
      <input
        className={`ov-input ${inputClassName}`}
        defaultValue={value}
        autoFocus
        onFocus={(e) => e.target.select()}
        onBlur={(e) => {
          setEditing(false);
          onCommit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.target.blur();
          else if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }
  return (
    <span
      className={`${editable ? 'ov-editable ' : ''}${className}`}
      onDoubleClick={() => editable && setEditing(true)}
    >
      {value}
    </span>
  );
}

const PILL_KEYS = ['open', 'claimed', 'duration'];

const OverviewBoard = forwardRef(function OverviewBoard(
  {
    headers = ['Mission', 'Closed By', 'Open', 'Claimed', 'Duration'],
    date = '11/1/2025 - 11/30/2026',
    rows = [],
    highlight = { mode: 'none', effects: ['dim'], col: 2, row: 0 },
    editable = false,
    onEdit = () => {},
  },
  ref
) {
  const active = highlight && highlight.mode !== 'none';
  // header cells use r === -1
  const isHl = (r, c) => {
    if (!active) return false;
    if (highlight.mode === 'column') return c === highlight.col;
    if (highlight.mode === 'row') return r === highlight.row;
    if (highlight.mode === 'cell') return r === highlight.row && c === highlight.col;
    return false;
  };
  // Effects stack: dim / pop / zoom can be on at the same time.
  const has = (e) => active && Array.isArray(highlight.effects) && highlight.effects.includes(e);
  const zoomOn = has('zoom');

  // Drag-to-pan while zoomed: a row pans left/right, a column up/down, a cell
  // both. Pan resets whenever the target changes (so it re-centers).
  const cardRef = useRef(null);
  const drag = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [highlight.mode, highlight.col, highlight.row]);

  const onPointerDown = (e) => {
    if (!zoomOn || e.target.closest('input')) return;
    const rect = cardRef.current.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, scale: rect.width / 900 };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const d = drag.current;
    setPan(clampPan({ x: d.panX + (e.clientX - d.x) / d.scale, y: d.panY + (e.clientY - d.y) / d.scale }));
  };
  const onPointerUp = (e) => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Geometry of the highlighted region in the fixed 900px coordinate space,
  // so pop can lift the whole target as ONE tile (not per-cell). Column widths
  // mirror the grid template (19/21/20/20/20); rows are a fixed 74px.
  // `pad` grows (negative) or shrinks (positive) the region: pop insets a few px
  // so the tile reads as its own card; the dim hole extends slightly so the
  // whole target cell (grid lines included) stays bright.
  const geom = (pad) => {
    const W = 900;
    const HEAD_H = 74;
    const ROW_H = 74;
    const HEAD_TOP = 96; // below the logo/date band
    const BODY_TOP = HEAD_TOP + HEAD_H;
    const widths = [19, 21, 20, 20, 20].map((f) => (f / 100) * W);
    const lefts = [];
    let acc = 0;
    for (const w of widths) {
      lefts.push(acc);
      acc += w;
    }
    if (highlight.mode === 'column') {
      return { left: lefts[highlight.col] + pad, top: HEAD_TOP + pad, width: widths[highlight.col] - pad * 2, height: HEAD_H + ROW_H * rows.length - pad * 2 };
    }
    if (highlight.mode === 'row') {
      return { left: pad, top: BODY_TOP + ROW_H * highlight.row + pad, width: W - pad * 2, height: ROW_H - pad * 2 };
    }
    if (highlight.mode === 'cell') {
      return { left: lefts[highlight.col] + pad, top: BODY_TOP + ROW_H * highlight.row + pad, width: widths[highlight.col] - pad * 2, height: ROW_H - pad * 2 };
    }
    return null;
  };
  const popGeom = has('pop') ? geom(3) : null;
  const dimGeom = has('dim') ? geom(0) : null;

  // ZOOM: a camera move — scale the whole board up and translate so the target
  // centers and fills more of the frame. A row locks the vertical axis (pan
  // left/right only), a column locks the horizontal axis (pan up/down only), a
  // cell allows both. Pan (drag or scroll buttons) is clamped to these limits.
  const Z = zoomOn ? (highlight.mode === 'cell' ? 2.2 : highlight.mode === 'row' ? 1.7 : 1.5) : 1;
  const panLimits = () => {
    const g = zoomOn ? geom(0) : null;
    if (!g) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const W = 900;
    const H = 762;
    const baseTx = W / 2 - (g.left + g.width / 2) * Z;
    const baseTy = H / 2 - (g.top + g.height / 2) * Z;
    const allowX = highlight.mode !== 'column';
    const allowY = highlight.mode !== 'row';
    return {
      minX: allowX ? W - W * Z - baseTx : 0,
      maxX: allowX ? -baseTx : 0,
      minY: allowY ? H - H * Z - baseTy : 0,
      maxY: allowY ? -baseTy : 0,
    };
  };
  const clampPan = (p) => {
    const l = panLimits();
    return { x: Math.min(l.maxX, Math.max(l.minX, p.x)), y: Math.min(l.maxY, Math.max(l.minY, p.y)) };
  };
  // Let the lab drive the pan from scroll buttons.
  useImperativeHandle(ref, () => ({
    panBy: (dx, dy) => setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy })),
    recenter: () => setPan({ x: 0, y: 0 }),
  }));

  const stageStyle = (() => {
    if (!zoomOn) return { transform: 'translate(0px, 0px) scale(1)' };
    const g = geom(0);
    if (!g) return { transform: 'translate(0px, 0px) scale(1)' };
    const W = 900;
    const H = 762;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const tx = clamp(W / 2 - (g.left + g.width / 2) * Z + pan.x, W - W * Z, 0);
    const ty = clamp(H / 2 - (g.top + g.height / 2) * Z + pan.y, H - H * Z, 0);
    return { transform: `translate(${tx}px, ${ty}px) scale(${Z})`, transition: dragging ? 'none' : 'transform 0.5s ease' };
  })();

  return (
    <div className="ov-fit">
      <div
        className={`ov-card${zoomOn ? ' is-pannable' : ''}${dragging ? ' is-dragging' : ''}`}
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="ov-stage" style={stageStyle}>
        {/* highlight overlays live INSIDE the stage so they scale/translate with
            the content when zoom is also active (keeping them aligned). */}
        {popGeom && <div className="ov-pop-tile" style={popGeom} aria-hidden="true" />}
        {dimGeom && <div className="ov-dim-hole" style={dimGeom} aria-hidden="true" />}
        {/* top band: logo + date range */}
        <div className="ov-top">
          <img className="ov-logo" src="/mission-logo.png" alt="" aria-hidden="true" />
          <div className="ov-daterange">
            <EditableText editable={editable} value={date} onCommit={(v) => onEdit({ type: 'date' }, v)} />
          </div>
        </div>

        {/* table */}
        <div className="ov-table">
          <div className="ov-head">
            <span className="ov-tabline" aria-hidden="true" />
            {headers.map((label, c) => (
              <div className={`ov-cell ov-cell--head${isHl(-1, c) ? ' ov-hl' : ''}`} key={c}>
                <EditableText
                  editable={editable}
                  value={label}
                  onCommit={(v) => onEdit({ type: 'header', col: c }, v)}
                  className="ov-h-label"
                  inputClassName="ov-h-label"
                />
                <IconMenu />
              </div>
            ))}
          </div>

          <div className="ov-body">
            {rows.map((row, r) => (
              <div className="ov-row" key={r}>
                <div className={`ov-cell ov-cell--text${isHl(r, 0) ? ' ov-hl' : ''}`}>
                  <EditableText editable={editable} value={row.mission} onCommit={(v) => onEdit({ type: 'mission', row: r }, v)} />
                </div>
                <div className={`ov-cell ov-cell--text${isHl(r, 1) ? ' ov-hl' : ''}`}>
                  <EditableText editable={editable} value={row.by} onCommit={(v) => onEdit({ type: 'by', row: r }, v)} />
                </div>
                {PILL_KEYS.map((key, i) => {
                  const c = 2 + i;
                  const cell = row[key];
                  return (
                    <div className={`ov-cell ov-cell--pill${isHl(r, c) ? ' ov-hl' : ''}`} key={key}>
                      <span className={`ov-pill ov-pill--${cell.tone}`}>
                        <EditableText
                          editable={editable}
                          value={cell.disp}
                          onCommit={(v) => onEdit({ type: 'timer', row: r, key }, v)}
                          className="ov-pill-txt"
                          inputClassName="ov-pill-input"
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});

export default OverviewBoard;
