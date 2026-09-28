'use client';

// ---------------------------------------------------------------------------
// WebReports — Reports section: All Reports, then a report with its summary
// sidebar (Mission / Ticket / Response totals), Group by (Unit · Team ·
// Person), Closed % per line, and a drill-down from a department to each
// person, each mission they closed and every answer with its evidence.
// Gallery View turns the responses into a feed of photo and video proofs.
// Controlled by WebApp (report id / group / gallery). Prefix .wa-report-*.
// ---------------------------------------------------------------------------

import { Fragment, useState } from 'react';
import { Icon } from '@/components/OverviewWorkspace';
import WebLightbox from './WebLightbox';
import { REPORTS, REPORT_TREE, PERSON_MISSIONS, GALLERY } from '@/lib/web/data.mjs';

const tone = pct => (pct >= 80 ? 'green' : pct >= 20 ? 'orange' : 'red');
function Pct({ posted, closed }) {
  const pct = posted ? (closed / posted) * 100 : 0;
  return <span className="wa-pct"><b>{pct.toFixed(2).replace(/\.00$/, '')}%</b><i><em className={`is-${tone(pct)}`} style={{ width: `${Math.min(100, pct)}%` }}/></i></span>;
}
const Stat = ({ label, value, total, pct, dot, active }) => <div className={`wa-stat${active ? ' is-active' : ''}`}><span>{label} ↗</span><b>{value}<small> / {total}</small><em>{pct}<i className={`wa-dot is-${dot}`}/></em></b></div>;

function Sidebar({ report, onBack }) {
  return <aside className="wa-report-side">
    <div className="wa-report-side-top"><button type="button" className="ow-text-button" onClick={onBack}>‹ Back To All Reports</button><span>⌥ ⇤</span></div>
    <input className="ow-search wa-side-search" placeholder="Search by keyword" aria-label="Search report"/>
    <div className="wa-report-title"><span>{report.code}</span><b>{report.name}</b><Icon name="chevron"/></div>
    <section className="wa-report-card"><header><span className="wa-badge is-orange">▤</span><b>Mission</b><Icon name="chevron"/></header>
      <div className="wa-total-line">Total Triggered <b>1799</b></div>
      <div className="wa-stats"><Stat label="Closed" value="1573" total="1799" pct="87.4%" dot="green" active/><Stat label="Running" value="41" total="1799" pct="2.3%" dot="red"/><Stat label="Canceled" value="185" total="1799" pct="10.3%" dot="red"/></div></section>
    <section className="wa-report-card is-row"><header><span className="wa-badge is-pink">✉</span><b>Ticket</b><small><b>185</b> Total Triggered</small><Icon name="chevron"/></header></section>
    <section className="wa-report-card"><header><span className="wa-badge is-purple">⌇</span><b>Response</b><Icon name="chevron"/></header>
      <div className="wa-total-line">Total Triggered <b>1045</b></div>
      <div className="wa-stats"><Stat label="Missions" value="355" total="1045" pct="34%" dot="red"/><Stat label="Tickets Triggered" value="12" total="1045" pct="1.1%" dot="red"/><Stat label="Pending" value="13" total="1045" pct="1.2%" dot="red"/></div></section>
  </aside>;
}

function Responses({ mission, onPhoto }) {
  return <tr className="wa-responses"><td colSpan={9}><table>
    <thead><tr><th>Statement</th><th>Divider</th><th>Response</th><th>Question Type</th><th>Responded At</th><th>Ticket Title</th></tr></thead>
    <tbody>{mission.responses.map((r, i) => <tr key={i} className={r.flagged ? 'is-flagged' : ''}><td>{i + 1}. {r.statement}</td><td>-</td>
      <td><span className={`wa-response${r.flagged ? ' is-flagged' : ''}`}>{r.response}</span>{r.photo && <button type="button" className="wa-photo-btn" onClick={() => onPhoto(r)} aria-label="Open photo">▣</button>}</td>
      <td><span className="wa-qtype">{r.type}</span></td><td>{mission.closedAt}</td><td>{r.ticket ? <span className="wa-chip is-ticket">{r.ticket}</span> : '-'}</td></tr>)}</tbody>
  </table></td></tr>;
}

function Tree({ group, onPhoto }) {
  const [open, setOpen] = useState(() => REPORT_TREE.filter(u => u.open).map(u => u.name).concat(['U001 - American Fork - Quality Control/QC Line Inspections']));
  const [openMission, setOpenMission] = useState(null);
  const toggle = key => setOpen(o => (o.includes(key) ? o.filter(k => k !== key) : [...o, key]));
  const persons = REPORT_TREE.flatMap(u => u.children.flatMap(t => t.children.map(p => ({ ...p, key: `${u.name}/${t.name}/${p.name}` }))));
  const teams = REPORT_TREE.flatMap(u => u.children.map(t => ({ ...t, key: `${u.name}/${t.name}` })));
  const personRow = (p, i, depth) => {
    const isOpen = open.includes(p.key);
    return <Fragment key={p.key}>
      <tr className="ow-group-row wa-person-row"><td className="ow-name-cell"><button type="button" className="ow-group-button" style={{ paddingLeft: 18 + depth * 22 }} onClick={() => toggle(p.key)}><span className={`ow-collapse-icon${isOpen ? '' : ' is-collapsed'}`}><Icon name="chevron"/></span><span className="ow-number">{i + 1}.</span><span className="ow-group-label">{p.name}</span></button></td><td/><td>{p.posted}</td><td>{p.closed}</td><td><Pct posted={p.posted} closed={p.closed}/></td><td><span className="ow-position">{p.position}</span></td><td/><td/><td/></tr>
      {isOpen && PERSON_MISSIONS.map((mm, j) => { const key = `${p.key}/${mm.name}`; return <Fragment key={key}>
        <tr className={`ow-data-row${openMission === key ? ' is-open' : ''}`} onClick={() => setOpenMission(openMission === key ? null : key)}><td className="ow-name-cell"><div className="ow-name-content" style={{ paddingLeft: 60 + depth * 22 }}><span className="ow-tree" style={{ left: 40 + depth * 22 }}/><span className="ow-number">{j + 1}.</span><span className="ow-mission-name">{mm.name}</span></div></td><td>{mm.ref || '-'}</td><td>1</td><td>1</td><td><Pct posted={1} closed={1}/></td><td/><td>{mm.type}</td><td>{mm.folder}</td><td>-</td></tr>
        {openMission === key && <Responses mission={mm} onPhoto={onPhoto}/>}
      </Fragment>; })}
    </Fragment>;
  };
  const groupRow = (g, i, key, depth, children) => {
    const isOpen = open.includes(key);
    return <Fragment key={key}><tr className={`ow-group-row${children ? '' : ' wa-no-children'}`}><td className="ow-name-cell"><button type="button" className="ow-group-button" style={{ paddingLeft: 18 + depth * 22 }} onClick={() => children && toggle(key)} aria-expanded={children ? isOpen : undefined}><span className={`ow-collapse-icon${isOpen && children ? '' : ' is-collapsed'}`}><Icon name="chevron"/></span><span className="ow-number">{i + 1}.</span><span className="ow-group-label">{g.name}</span></button></td><td/><td>{g.posted}</td><td>{g.closed}</td><td><Pct posted={g.posted} closed={g.closed}/></td><td/><td/><td/><td/></tr>
      {isOpen && children}</Fragment>;
  };
  let body;
  if (group === 'Person') body = persons.map((p, i) => personRow(p, i, 0));
  else if (group === 'Team') body = teams.map((t, i) => groupRow(t, i, t.key, 0, t.children.length ? t.children.map((p, j) => personRow({ ...p, key: `${t.key}/${p.name}` }, j, 1)) : null));
  else body = REPORT_TREE.map((u, i) => groupRow(u, i, u.name, 0, u.children.length ? u.children.map((t, j) => groupRow(t, j, `${u.name}/${t.name}`, 1, t.children.map((p, k) => personRow({ ...p, key: `${u.name}/${t.name}/${p.name}` }, k, 2)))) : null));
  return <div className="ow-table-scroll"><table className="ow-table wa-table" style={{ width: 1560 }}>
    <colgroup>{[460, 190, 90, 90, 190, 140, 110, 170, 120].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
    <thead><tr>{['Name', 'Reference', 'Posted', 'Closed', 'Closed %', 'Position', 'Type', 'Folder', 'Process'].map((h, i) => <th key={h} className={i === 0 ? 'ow-name-cell' : ''}><div><span>{h}{h === 'Closed %' && ' ↓'}</span><span className="ow-dots" aria-hidden="true">⋮</span></div></th>)}</tr></thead>
    <tbody>{body}</tbody>
  </table></div>;
}

function Gallery({ onPhoto }) {
  return <div className="wa-gallery">{GALLERY.map((g, i) => <article key={i} className="wa-gallery-item">
    <p className="wa-gallery-crumb"><u>{g.mission}</u> / <u>{g.statement}</u></p>
    <div className="wa-gallery-row"><button type="button" className={`wa-gallery-media${g.kind === 'video' ? ' is-video' : ''}`} style={{ backgroundImage: `url('${g.kind === 'video' ? g.poster : g.src}')` }} onClick={() => onPhoto(g)} aria-label={`Open ${g.kind} from ${g.person}`}>{g.kind === 'video' && <i>▶</i>}</button>
      <dl><div><dt>Person</dt><dd>{g.person}</dd></div><div><dt>Type</dt><dd>{g.type}</dd></div><div><dt>Response</dt><dd><span className={`wa-response${g.response === 'No' ? ' is-flagged' : ''}`}>{g.response}</span></dd></div>{g.ticket && <div><dt>Ticket</dt><dd><span className="wa-chip is-ticket">{g.ticket}</span></dd></div>}</dl></div>
  </article>)}</div>;
}

export default function WebReports({ reportId, onReport, group, onGroup, gallery, onGallery }) {
  const [menu, setMenu] = useState(false);
  const [photo, setPhoto] = useState(null);
  const report = REPORTS.find(r => r.id === reportId);
  if (!report) return <section className="wa-reports-home">
    <div className="ow-toolbar"><h2 className="wa-h2">All Reports</h2><button type="button" className="ow-primary">+ Create Report</button><input className="ow-search" placeholder="Search reports" aria-label="Search reports"/></div>
    <div className="wa-report-grid">{REPORTS.map(r => <button type="button" key={r.id} className="wa-report-tile" onClick={() => onReport(r.id)}><span className="wa-report-code">{r.code}</span><b>{r.name}</b><p>{r.text}</p><small>{r.owner} · Updated {r.updated}</small></button>)}</div>
  </section>;
  const lightItems = photo ? (photo.statement && photo.person ? GALLERY.map(g => ({ src: g.src, poster: g.poster, kind: g.kind, name: `${g.mission} — ${g.person}` })) : [{ src: photo.photo || photo.src, kind: 'photo', name: photo.statement || 'Photo' }]) : [];
  return <section className="wa-report">
    <Sidebar report={report} onBack={() => onReport(null)}/>
    <div className="wa-report-main">
      <div className="wa-report-head"><h2>{report.name} <button type="button" className="ow-text-button">Show Details</button></h2><span className="wa-range"><Icon name="calendar"/>07/22/2026 – 07/28/2026</span><button type="button" className="ow-secondary">Update Default View</button><button type="button" className="ow-primary">Save To My View</button></div>
      <div className="ow-toolbar wa-report-tools">
        <span className="ow-tool"><Icon name="eye"/>My View: Default</span>
        <span className="wa-menu-anchor"><button type="button" className="ow-tool" onClick={() => setMenu(v => !v)} aria-expanded={menu}><Icon name="group"/>Group by: {group}<Icon name="chevron"/></button>
          {menu && <div className="wa-dropdown" role="menu">{['Unit', 'Team', 'Person'].map(g => <button type="button" role="menuitem" key={g} className={g === group ? 'is-active' : ''} onClick={() => { onGroup(g); setMenu(false); }}>{g}{g === group ? ' ✓' : ''}</button>)}</div>}</span>
        <span className="ow-tool"><Icon name="expand"/>Expand/Collapse</span>
        <span className="ow-tool">Report Summary</span>
        <label className="ow-check"><input type="checkbox" checked={gallery} onChange={e => onGallery(e.target.checked)}/>Gallery View</label>
        <label className="ow-check"><input type="checkbox"/>Daily Distribution</label>
      </div>
      <div className="wa-report-chips"><span>Total Closed: <b>1573</b> of 1799 | 87.4%</span><span className="wa-chip-team">Team: 1573 / 1799 | 87.4%</span><span>Personal: 0 of 0 | 0%</span>{gallery && <span className="wa-chip-filter">Proof: Photo ✕ · Video ✕</span>}</div>
      {gallery ? <Gallery onPhoto={setPhoto}/> : <Tree key={group} group={group} onPhoto={setPhoto}/>}
    </div>
    {photo && <WebLightbox items={lightItems} index={photo.statement && photo.person ? GALLERY.indexOf(photo) : 0} onClose={() => setPhoto(null)}/>}
  </section>;
}
