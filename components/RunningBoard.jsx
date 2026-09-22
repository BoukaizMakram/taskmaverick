'use client';

// ---------------------------------------------------------------------------
// RunningBoard — HTML/CSS recreation of Figma "2048w default" (Frame 1 - video
// 61): the Taskmaverick web app on the Team Board · Running (Overview) view.
// Built at the fixed 1848×879 window size and fluidly scaled to its container
// (.rb-fit), ready to animate later without a video.
//   Top nav → sub-nav tabs → toolbar → 10-column mission table with grouped
//   rows and Open / Claimed / Duration timer pills.
// Timer pills use the SAME font as the /overview board (Poppins Medium) and the
// same color tokens. Duration is outline while a mission is Open, filled gray
// once Closed (per the design).
// ---------------------------------------------------------------------------

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const NAV = ['Missions', 'People', 'Teams', 'Units', 'Ticket Boards', 'Groups', 'Certifications', 'Timesheets', 'Reports', 'Dashboards'];
const TABS = ['Team Board', 'Personal Board', 'Unit Ticket Board', 'Organization Ticket Board', 'Process', 'Course'];
const VIEWS = ['History', 'Running', 'Scheduled', 'Timeline'];
export const RUNNING_COLS = ['Name', 'Reference', 'Activity', 'Triggered at', 'Claimed By', 'Open', 'Claimed', 'Duration', 'Closed At', 'Type'];
const COLS = RUNNING_COLS;

// fixed 1848×879 coordinate space (matches the CSS below)
const COL_W = [451, 143, 190, 172, 131, 121, 129, 130, 165, 216];
const COL_LEFT = COL_W.reduce((acc, w, i) => { acc.push(i ? acc[i - 1] + COL_W[i - 1] : 0); return acc; }, []);
const HEAD_TOP = 123; // nav 44 + subnav 40 + toolbar 39
const BODY_TOP = 159; // + header 36
const GROUP_H = 34;
const ROW_H = 38;
const DATA_TOP = BODY_TOP + GROUP_H * 2; // below the two group rows

export const RUNNING_ROWS = [
  { n: 1, name: 'Take a short break', flag: true, ref: 'Team Member - James', state: 'open', tone: 'red', trig: '07/10/2026 09:29 AM', by: '', open: '05:06:54', claimed: null, dur: '05:06:54', closed: '', type: 'Task', hl: true },
  { n: 2, name: 'Check work area', ref: '', state: 'open', tone: 'green', trig: '07/10/2026 02:30 PM', by: '', open: '00:06:16', claimed: null, dur: '00:06:16', closed: '', type: 'Checklist' },
  { n: 3, name: 'Check supplies', ref: '', state: 'open', tone: 'green', trig: '07/10/2026 02:25 PM', by: '', open: '00:11:15', claimed: null, dur: '00:11:15', closed: '', type: 'Task' },
  { n: 4, name: 'Check shared equipment', ref: '', state: 'open', tone: 'orange', trig: '07/10/2026 02:00 PM', by: '', open: '00:36:16', claimed: null, dur: '00:36:16', closed: '', type: 'Task' },
  { n: 5, name: 'Report missing items', ref: '', state: 'open', tone: 'orange', trig: '07/10/2026 02:00 PM', by: '', open: '00:36:16', claimed: null, dur: '00:36:16', closed: '', type: 'Survey' },
  { n: 6, name: 'Tidy work area', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 12:00 PM', by: 'Michael Davis', open: '02:06:54', claimed: '00:00:03', dur: '02:06:57', closed: '07/10/2026 02:06 PM', type: 'Task' },
  { n: 7, name: 'Request supplies', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 11:30 AM', by: 'Michael Davis', open: '01:57:58', claimed: '00:00:14', dur: '01:58:13', closed: '07/10/2026 01:28 PM', type: 'Survey' },
  { n: 8, name: 'Review available supplies', ref: 'Shared Supplies', state: 'closed', tone: 'red', trig: '07/10/2026 11:00 AM', by: 'Michael Davis', open: '02:23:24', claimed: '00:04:25', dur: '02:27:49', closed: '07/10/2026 01:27 PM', type: 'Survey' },
  { n: 9, name: 'Take a short break', ref: 'Team Member - Emily', state: 'closed', tone: 'red', trig: '07/10/2026 10:29 AM', by: 'Sarah Wilson', open: '03:50:03', claimed: '00:10:40', dur: '04:00:44', closed: '07/10/2026 02:30 PM', type: 'Task' },
  { n: 10, name: 'Review daily tasks', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 10:00 AM', by: 'Sarah Wilson', open: '01:51:25', claimed: '00:00:13', dur: '01:51:38', closed: '07/10/2026 11:51 AM', type: 'Checklist' },
  { n: 11, name: 'Update task status', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 10:00 AM', by: 'Michael Davis', open: '02:44:10', claimed: '00:00:09', dur: '02:44:19', closed: '07/10/2026 12:44 PM', type: 'Checklist' },
  { n: 12, name: 'Prepare for handoff', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 10:00 AM', by: 'Michael Davis', open: '02:44:26', claimed: '00:00:11', dur: '02:44:38', closed: '07/10/2026 12:44 PM', type: 'Checklist' },
  { n: 13, name: 'Check shared spaces', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 10:00 AM', by: 'Sarah Wilson', open: '01:51:47', claimed: '00:00:12', dur: '01:52:00', closed: '07/10/2026 11:52 AM', type: 'Checklist' },
  { n: 14, name: 'Review completed work', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 10:00 AM', by: 'Sarah Wilson', open: '01:52:08', claimed: '00:00:05', dur: '01:52:14', closed: '07/10/2026 11:52 AM', type: 'Checklist' },
  { n: 15, name: 'Report an issue', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 10:00 AM', by: 'Sarah Wilson', open: '01:52:20', claimed: '00:00:46', dur: '01:53:07', closed: '07/10/2026 11:53 AM', type: 'Survey' },
  { n: 16, name: 'Check shared equipment', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 10:00 AM', by: 'Sarah Wilson', open: '01:53:14', claimed: '00:03:01', dur: '01:56:16', closed: '07/10/2026 11:56 AM', type: 'Task' },
  { n: 17, name: 'Organize shared files', ref: '', state: 'closed', tone: 'red', trig: '07/10/2026 10:00 AM', by: 'Michael Davis', open: '02:44:44', claimed: '00:19:37', dur: '03:04:22', closed: '07/10/2026 01:04 PM', type: 'Checklist' },
];

const Dots = () => (
  <svg className="rb-dots" viewBox="0 0 3 15" aria-hidden="true">
    <circle cx="1.5" cy="2.5" r="1.1" />
    <circle cx="1.5" cy="7.5" r="1.1" />
    <circle cx="1.5" cy="12.5" r="1.1" />
  </svg>
);
const Chevron = () => (
  <svg className="rb-chev" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const st = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
const ICONS = {
  bulk: <svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="3" rx="1" {...st} /><rect x="2.5" y="6.5" width="11" height="3" rx="1" {...st} /><rect x="2.5" y="10.5" width="7" height="3" rx="1" {...st} /></svg>,
  filter: <svg viewBox="0 0 16 16"><path d="M2.5 3.5h11l-4.2 5v4l-2.6 1.3v-5.3z" {...st} /></svg>,
  group: <svg viewBox="0 0 16 16"><path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" {...st} /></svg>,
  expand: <svg viewBox="0 0 16 16"><path d="M6 3 3 6M3 3h3v3M10 13l3-3M13 13h-3v-3" {...st} /></svg>,
  hide: <svg viewBox="0 0 16 16"><path d="M1.8 8s2.4-4.2 6.2-4.2S14.2 8 14.2 8s-2.4 4.2-6.2 4.2S1.8 8 1.8 8Z" {...st} /><circle cx="8" cy="8" r="1.8" {...st} /></svg>,
  export: <svg viewBox="0 0 16 16"><path d="M8 10V2.5M5.2 5.3 8 2.5l2.8 2.8M3 10.5v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2" {...st} /></svg>,
};
const TOOLS = [
  { label: 'Bulk Action', icon: 'bulk', primary: true, caret: true },
  { label: 'Filter: New Filter', icon: 'filter' },
  { label: 'Group by: Unit', icon: 'group' },
  { label: 'Expand/Collapse', icon: 'expand' },
  { label: 'Hide/Show Column', icon: 'hide' },
  { label: 'Export', icon: 'export' },
];

function GroupRow({ label, count, open, claimed, duration, indent = 0 }) {
  return (
    <div className="rb-row rb-grp">
      <div className="rb-cell rb-cell--name" style={{ paddingLeft: 10 + indent * 24 }}>
        <span className="rb-toggle" aria-hidden="true"><Chevron /></span>
        <span className="rb-num">1.</span>
        <span className="rb-grp-label">{label}</span>
        <span className="rb-count">{count}</span>
      </div>
      <div className="rb-cell" />
      <div className="rb-cell" />
      <div className="rb-cell" />
      <div className="rb-cell" />
      <div className="rb-cell rb-sum">{open}</div>
      <div className="rb-cell rb-sum">{claimed}</div>
      <div className="rb-cell rb-sum">{duration}</div>
      <div className="rb-cell" />
      <div className="rb-cell" />
    </div>
  );
}

const RunningBoard = forwardRef(function RunningBoard(
  { rows = RUNNING_ROWS, highlight = { mode: 'none', effects: ['dim'], col: 5, row: 0 } },
  ref
) {
  const active = highlight && highlight.mode !== 'none';
  const has = (e) => active && Array.isArray(highlight.effects) && highlight.effects.includes(e);
  const zoomOn = has('zoom');

  // drag-to-pan while zoomed (row → left/right, column → up/down, cell → both)
  const winRef = useRef(null);
  const drag = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [highlight.mode, highlight.col, highlight.row]);

  // geometry of the highlighted region in the fixed 1848×879 space
  const geom = (pad) => {
    if (highlight.mode === 'column') {
      return { left: COL_LEFT[highlight.col] + pad, top: HEAD_TOP + pad, width: COL_W[highlight.col] - pad * 2, height: DATA_TOP + ROW_H * rows.length - HEAD_TOP - pad * 2 };
    }
    if (highlight.mode === 'row') {
      return { left: pad, top: DATA_TOP + ROW_H * highlight.row + pad, width: 1848 - pad * 2, height: ROW_H - pad * 2 };
    }
    if (highlight.mode === 'cell') {
      return { left: COL_LEFT[highlight.col] + pad, top: DATA_TOP + ROW_H * highlight.row + pad, width: COL_W[highlight.col] - pad * 2, height: ROW_H - pad * 2 };
    }
    return null;
  };
  const popGeom = has('pop') ? geom(3) : null;
  const dimGeom = has('dim') ? geom(0) : null;

  const Z = zoomOn ? (highlight.mode === 'cell' ? 2.4 : highlight.mode === 'row' ? 1.8 : 1.6) : 1;
  const panLimits = () => {
    const g = zoomOn ? geom(0) : null;
    if (!g) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const W = 1848;
    const H = 879;
    const baseTx = W / 2 - (g.left + g.width / 2) * Z;
    const baseTy = H / 2 - (g.top + g.height / 2) * Z;
    const allowX = highlight.mode !== 'column';
    const allowY = highlight.mode !== 'row';
    return { minX: allowX ? W - W * Z - baseTx : 0, maxX: allowX ? -baseTx : 0, minY: allowY ? H - H * Z - baseTy : 0, maxY: allowY ? -baseTy : 0 };
  };
  const clampPan = (p) => {
    const l = panLimits();
    return { x: Math.min(l.maxX, Math.max(l.minX, p.x)), y: Math.min(l.maxY, Math.max(l.minY, p.y)) };
  };
  useImperativeHandle(ref, () => ({
    panBy: (dx, dy) => setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy })),
    recenter: () => setPan({ x: 0, y: 0 }),
  }));

  const onPointerDown = (e) => {
    if (!zoomOn) return;
    const rect = winRef.current.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, scale: rect.width / 1848 };
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

  const stageStyle = (() => {
    if (!zoomOn) return { transform: 'translate(0px, 0px) scale(1)' };
    const g = geom(0);
    if (!g) return { transform: 'translate(0px, 0px) scale(1)' };
    const W = 1848;
    const H = 879;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const tx = clamp(W / 2 - (g.left + g.width / 2) * Z + pan.x, W - W * Z, 0);
    const ty = clamp(H / 2 - (g.top + g.height / 2) * Z + pan.y, H - H * Z, 0);
    return { transform: `translate(${tx}px, ${ty}px) scale(${Z})`, transition: dragging ? 'none' : 'transform 0.5s ease' };
  })();

  return (
    <div className="rb-fit">
      <div
        className={`rb-win${zoomOn ? ' is-pannable' : ''}${dragging ? ' is-dragging' : ''}`}
        ref={winRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="rb-stage" style={stageStyle}>
        {popGeom && <div className="rb-pop-tile" style={popGeom} aria-hidden="true" />}
        {dimGeom && <div className="rb-dim-hole" style={dimGeom} aria-hidden="true" />}
        {/* top nav */}
        <div className="rb-nav">
          <div className="rb-brand">
            <img className="rb-logo" src="/mission-logo.png" alt="" aria-hidden="true" />
            <span className="rb-brand-name">taskmaverick</span>
          </div>
          <nav className="rb-nav-menu">
            {NAV.map((x) => (
              <span className="rb-nav-item" key={x}>{x}</span>
            ))}
            <span className="rb-nav-item rb-nav-item--active">Overview</span>
          </nav>
          <div className="rb-nav-right">
            <svg className="rb-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3a4 4 0 0 0-4 4v3l-1.5 2.5h11L14 10V7a4 4 0 0 0-4-4ZM8 15a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <svg className="rb-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5 5l1.4 1.4M13.6 13.6 15 15M15 5l-1.4 1.4M6.4 13.6 5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <span className="rb-avatar">JM</span>
          </div>
        </div>

        {/* sub-nav tabs */}
        <div className="rb-subnav">
          <div className="rb-tabs">
            {TABS.map((t, i) => (
              <span className={`rb-tab${i === 0 ? ' is-active' : ''}`} key={t}>{t}</span>
            ))}
          </div>
          <div className="rb-views">
            {VIEWS.map((v) => (
              <span className={`rb-view${v === 'Running' ? ' is-active' : ''}`} key={v}>{v}</span>
            ))}
          </div>
        </div>

        {/* toolbar */}
        <div className="rb-toolbar">
          {TOOLS.map((t) => (
            <span className={`rb-tool${t.primary ? ' rb-tool--primary' : ''}`} key={t.label}>
              <span className="rb-tool-ic">{ICONS[t.icon]}</span>
              {t.label}
              {t.caret && <Chevron />}
            </span>
          ))}
          <span className="rb-tool rb-tool--check">
            <span className="rb-check--sq" aria-hidden="true" />
            Only Boosted
          </span>
        </div>

        {/* table */}
        <div className="rb-table">
          <div className="rb-row rb-head">
            {COLS.map((c) => (
              <div className="rb-cell rb-cell--head" key={c}>
                <span className="rb-h-label">
                  {c}
                  {c === 'Triggered at' && <span className="rb-sort" aria-hidden="true">↓</span>}
                </span>
                <Dots />
              </div>
            ))}
          </div>

          <div className="rb-body">
            <GroupRow label="L001 – Main Location" count="7" open="75" claimed="5" duration="88" />
            <GroupRow label="Operations" count="25" open="5" claimed="0" duration="20" indent={1} />

            {rows.map((r) => (
              <div className={`rb-row rb-drow${r.hl ? ' is-hl' : ''}`} key={r.n}>
                <div className="rb-cell rb-cell--name">
                  <span className="rb-tree" aria-hidden="true" />
                  <span className="rb-num">{r.n}.</span>
                  <span className="rb-name">{r.name}</span>
                  {r.flag && (
                    <svg className="rb-flag" viewBox="0 0 14 16" aria-hidden="true"><path d="M3 1v14M3 2h8l-1.6 2.2L11 6.6H3" fill="#c0304f" stroke="#c0304f" strokeWidth="1.1" strokeLinejoin="round" /></svg>
                  )}
                  <Dots />
                </div>
                <div className="rb-cell rb-cell--muted">{r.ref}</div>
                <div className="rb-cell rb-activity">
                  <span className={`rb-adot rb-adot--${r.state === 'open' ? r.tone : 'closed'}`} />
                  <span className={r.state === 'open' ? 'rb-astate' : 'rb-astate rb-astate--muted'}>{r.state === 'open' ? 'Open' : 'Closed'}</span>
                </div>
                <div className="rb-cell rb-cell--muted">{r.trig}</div>
                <div className="rb-cell rb-cell--muted">{r.by}</div>
                <div className="rb-cell rb-cell--center">{r.open && <span className={`rb-pill rb-pill--${r.tone}`}>{r.open}</span>}</div>
                <div className="rb-cell rb-cell--center">{r.claimed && <span className="rb-pill rb-pill--red">{r.claimed}</span>}</div>
                <div className="rb-cell rb-cell--center">{r.dur && <span className={`rb-pill ${r.state === 'open' ? 'rb-pill--outline' : 'rb-pill--gray'}`}>{r.dur}</span>}</div>
                <div className="rb-cell rb-cell--muted">{r.closed}</div>
                <div className="rb-cell rb-cell--muted">{r.type}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});

export default RunningBoard;
