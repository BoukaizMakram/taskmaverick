'use client';

// ---------------------------------------------------------------------------
// WebDashboards — live dashboards: Reference (data entered in checklists —
// dimensions, weights — with anomalies flagged so the floor can correct while
// the work happens), Aging (open missions by timer color), Execution (how long
// missions take vs target) and the Personal / Team / Unit scoreboards.
// Prefix .wa-dash-*.
// ---------------------------------------------------------------------------

import { Fragment, useState } from 'react';
import { Icon } from '@/components/OverviewWorkspace';
import { WebSubnav } from './WebShell';
import { DASH_TABS, MEASURE_COLUMNS, MEASUREMENTS, AGING_ROWS, EXECUTION_ROWS, LEADERBOARD } from '@/lib/web/data.mjs';

const secs = t => t.split(':').reduce((s, n) => s * 60 + Number(n), 0);

function Filters({ tab }) {
  const [auto, setAuto] = useState(true);
  return <div className="ow-toolbar wa-dash-filters">
    {[['Mission', tab === 'Reference' ? 'L2 - Bar Dimensions…' : 'All'], ['Reference', 'All'], ['Unit', 'All'], ['Occurrence', 'All']].map(([l, v]) => <label key={l} className="wa-filter"><small>{l}</small><select defaultValue={v}><option>{v}</option></select></label>)}
    <label className="wa-filter"><small>Triggered Date</small><span className="wa-range"><Icon name="calendar"/>09/01/25 – 10/31/25</span></label>
    <label className="wa-filter"><small>Group By</small><select defaultValue="Person"><option>Person</option><option>Unit</option></select></label>
    <label className="wa-filter"><small>Table Levels</small><select defaultValue="Expand/Collapse"><option>Expand/Collapse</option></select></label>
    <label className="wa-filter"><small>Auto-Refresh</small><span className="wa-toggle-row"><button type="button" className={auto ? 'is-on' : ''} onClick={() => setAuto(true)}>On</button><button type="button" className={!auto ? 'is-on' : ''} onClick={() => setAuto(false)}>Off</button></span></label>
  </div>;
}

function Reference() {
  const [open, setOpen] = useState(MEASUREMENTS.map(g => g.unit));
  const [hover, setHover] = useState(null);
  const bad = (c, v) => typeof v === 'number' && ((c.min != null && v < c.min) || (c.max != null && v > c.max));
  return <div className="ow-table-scroll"><table className="ow-table wa-table wa-measure" style={{ width: 1720 }}>
    <colgroup>{[330, 150, 150, 150, 150, 190, 190, 170, 170, 200].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
    <thead><tr><th className="ow-name-cell"><div><span>Name ↑</span></div></th>{MEASURE_COLUMNS.map(c => <th key={c.key}><div><span>{c.label}</span></div>{c.min != null && <small className="wa-target">target {c.min}–{c.max}</small>}</th>)}</tr></thead>
    <tbody>{MEASUREMENTS.map(g => <Fragment key={g.unit}>
      <tr className="ow-group-row"><td className="ow-name-cell"><button type="button" className="ow-group-button" onClick={() => setOpen(o => (o.includes(g.unit) ? o.filter(x => x !== g.unit) : [...o, g.unit]))}><span className={`ow-collapse-icon${open.includes(g.unit) ? '' : ' is-collapsed'}`}><Icon name="chevron"/></span><span className="ow-group-label">{g.unit}</span><span className="ow-count">{g.rows.length}</span></button></td>{MEASURE_COLUMNS.map(c => <td key={c.key}/>)}</tr>
      {open.includes(g.unit) && g.rows.map((row, i) => <tr key={i} className="ow-data-row">
        <td className="ow-name-cell"><div className="ow-name-content" style={{ paddingLeft: 40 }}><span className="ow-mission-name">{row.name}</span></div></td>
        {MEASURE_COLUMNS.map(c => { const v = row[c.key]; const flagged = bad(c, v); return <td key={c.key} className={flagged ? 'wa-flag-cell' : ''} onMouseEnter={() => flagged && setHover(`${i}${c.key}`)} onMouseLeave={() => setHover(null)}>
          {v}{flagged && <span className="wa-flag" aria-label={`Out of range, target ${c.min} to ${c.max}`}>⚑</span>}{hover === `${i}${c.key}` && <span className="wa-tip">Target {c.min}–{c.max}. A correction ticket was raised.</span>}</td>; })}
      </tr>)}
    </Fragment>)}</tbody>
  </table></div>;
}

function Aging() {
  return <div className="wa-dash-cards">{AGING_ROWS.map(r => { const total = r.green + r.orange + r.red; return <article key={r.team} className="wa-dash-card">
    <header><b>{r.team}</b><span>{total} open</span></header>
    <div className="wa-aging-bar">{[['green', r.green], ['orange', r.orange], ['red', r.red]].map(([c, n]) => n > 0 && <i key={c} className={`is-${c}`} style={{ flex: n }}>{n}</i>)}</div>
    <p>Oldest: <b>{r.mission}</b> <span className={`ow-timer ${r.red ? 'is-red' : 'is-green'}`}>{r.oldest}</span></p>
  </article>; })}</div>;
}

function Execution() {
  return <div className="ow-table-scroll"><table className="ow-table wa-table" style={{ width: 1300 }}>
    <colgroup>{[380, 110, 150, 150, 150, 150, 210].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
    <thead><tr>{['Mission', 'Runs', 'Avg. Execution', 'Fastest', 'Slowest', 'Target', 'Vs Target'].map((h, i) => <th key={h} className={i === 0 ? 'ow-name-cell' : ''}><div><span>{h}</span></div></th>)}</tr></thead>
    <tbody>{EXECUTION_ROWS.map(r => { const ratio = secs(r.avg) / secs(r.target); return <tr key={r.mission} className="ow-data-row"><td className="ow-name-cell"><div className="ow-name-content" style={{ paddingLeft: 24 }}><span className="ow-mission-name">{r.mission}</span></div></td><td>{r.runs}</td><td><span className={`ow-timer ${ratio > 1 ? 'is-orange' : 'is-green'}`}>{r.avg}</span></td><td>{r.min}</td><td>{r.max}</td><td>{r.target}</td>
      <td><span className="wa-pct"><b>{Math.round(ratio * 100)}%</b><i><em className={`is-${ratio > 1 ? 'orange' : 'green'}`} style={{ width: `${Math.min(100, ratio * 100)}%` }}/></i></span></td></tr>; })}</tbody>
  </table></div>;
}

function Board({ tab }) {
  const [period, setPeriod] = useState('1W');
  const rows = tab === 'Unit' ? [['L001 - Sweet Beverly', 14130, 3.1, 4.7, 4.8], ['P001 - Riverside Plant', 11820, 2.6, 4.6, 4.9], ['T001 - Tarzana', 9650, 4.2, 4.4, 4.5]]
    : tab === 'Team' ? [['Register', 5220, 3.3, 4.8, 4.9], ['Kitchen', 4410, 2.8, 4.7, 4.6], ['QC Line Inspections', 3960, 2.4, 4.6, 5.0], ['Food Preparation', 2100, 1.9, 4.5, 4.7], ['Team A', 1880, 2.2, 4.4, 4.6]] : LEADERBOARD;
  return <div className="wa-leader"><div className="wa-periods">{['1W', '4W', '12W', '52W', 'All'].map(p => <button type="button" key={p} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p}</button>)}</div>
    <table className="wa-leader-table"><thead><tr><th>{tab === 'Personal' ? 'Person' : tab}</th><th>Points ↓</th><th>Missions/Hour</th><th>Work Quality</th><th>Objectivity Rating</th></tr></thead>
      <tbody>{rows.map(([name, pts, mph, wq, obj], i) => <tr key={name}><th scope="row"><span className={`wa-rank${i < 3 ? ` is-${i + 1}` : ''}`}>{i + 1}</span>{name}</th><td>{pts}</td><td>{mph}</td><td>★ {wq}</td><td>{obj}</td></tr>)}</tbody></table></div>;
}

export default function WebDashboards({ tab, onTab }) {
  return <>
    <WebSubnav tabs={DASH_TABS} active={tab} onTab={onTab}/>
    <Filters tab={tab}/>
    {tab === 'Reference' && <Reference/>}
    {tab === 'Aging' && <Aging/>}
    {tab === 'Execution' && <Execution/>}
    {['Personal', 'Team', 'Unit'].includes(tab) && <Board tab={tab} key={tab}/>}
  </>;
}
