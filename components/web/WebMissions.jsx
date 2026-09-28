'use client';

// ---------------------------------------------------------------------------
// WebMissions — Missions section of the web app: In Library (folders of
// missions — the organization's knowledge, "missionized"), In Teams, As
// Tickets, Within Processes (process builder), Within Courses, and In
// Marketplace (catalogs and bundles a franchisor or consultant publishes once
// and every location imports). Controlled by WebApp (tab / view).
// ---------------------------------------------------------------------------

import { Fragment, useEffect, useState } from 'react';
import { Icon } from '@/components/OverviewWorkspace';
import { WebSubnav } from './WebShell';
import WebMissionBuilder from './WebMissionBuilder';
import WebProcess from './WebProcess';
import { LIBRARY, LIBRARY_TOTAL, TEAMS_VIEW, TICKETS_VIEW, COURSES, PROCESSES, CATALOGS, BUNDLES, CATALOG_MISSIONS } from '@/lib/web/data.mjs';

export const MISSION_TABS = ['In Library', 'In Teams', 'As Tickets', 'Within Processes', 'Within Courses', 'In Marketplace'];
const TYPES = ['Task', 'Checklist', 'Survey', 'Media', 'Test', 'Audit', 'Process'];
const GuideIcon = () => <span className="wa-guide" title="Has a guide">ⓘ</span>;
const AlertIcon = () => <span className="wa-alert" title="Has an alert">⚠</span>;
const Chips = ({ list }) => <span className="wa-chips-inline">{list.map(t => <span key={t} className={t.startsWith('+') ? 'wa-more' : 'wa-chip'}>{t}</span>)}</span>;

function Library({ onOpen, onCreate, extra = [] }) {
  const rows = [...extra, ...LIBRARY];
  const [openFolders, setOpenFolders] = useState(() => [...extra.slice(0, 1).map(r => r.title), 'Operations']);
  // A newly loaded industry opens at the top.
  const first = extra[0]?.title;
  useEffect(() => { if (first) setOpenFolders(f => (f.includes(first) ? f : [first, ...f])); }, [first]);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  const match = row => !query || row.title.toLowerCase().includes(query.toLowerCase());
  let n = 0;
  const row = (r, depth = 0, folder) => {
    n += 1;
    const index = n;
    if (r.folder) {
      const isOpen = openFolders.includes(r.title);
      return <Fragment key={r.title}><tr className="ow-group-row wa-folder-row">
        <td className="ow-name-cell"><button type="button" className="ow-group-button" aria-expanded={isOpen} onClick={() => setOpenFolders(f => (isOpen ? f.filter(x => x !== r.title) : [...f, r.title]))}><span className={`ow-collapse-icon${isOpen ? '' : ' is-collapsed'}`}><Icon name="chevron"/></span><span className="ow-number">{index}.</span><span className="wa-folder-ico">🗀</span><span className="ow-group-label">{r.title}</span><span className="ow-count">{r.count}</span></button></td>
        <td>Folder</td><td/><td/><td/><td/><td/><td><span className="wa-chip">{r.category}</span></td><td><Chips list={r.tag}/></td><td><span className="wa-active"><i className="wa-dot is-green"/>{r.status}</span></td>
      </tr>{isOpen && r.children.filter(match).map(c => row(c, depth + 1, r.title))}</Fragment>;
    }
    return <tr key={`${folder || ''}${r.title}`} className="ow-data-row wa-lib-row" tabIndex={0} onClick={() => onOpen({ ...r, folder })} onKeyDown={e => e.key === 'Enter' && onOpen({ ...r, folder })}>
      <td className="ow-name-cell"><div className="ow-name-content" style={{ paddingLeft: depth ? 78 : 44 }}>{depth > 0 && <span className="ow-tree"/>}<span className="ow-number">{index}.</span><span className="wa-mission-ico" aria-hidden="true"><img src="/mission-logo.png" alt=""/></span><span className="ow-mission-name">{r.title}</span><span className="ow-dots" aria-hidden="true">⋮</span></div></td>
      <td>{r.type}</td><td>{r.guide ? <GuideIcon/> : '-'}</td><td>{r.alert ? <AlertIcon/> : '-'}</td><td><Chips list={r.team}/></td><td>{r.process && <span className="wa-chip is-process">{r.process}</span>}</td><td>{r.course || '-'}</td><td><span className="wa-chip">{r.category}</span></td><td><Chips list={r.tag}/></td><td/>
    </tr>;
  };
  return <>
    <div className="ow-toolbar">
      <button type="button" className="ow-tool"><Icon name="export"/>Import Mission</button>
      <span className="wa-menu-anchor"><button type="button" className="ow-tool" aria-expanded={menu} onClick={() => setMenu(v => !v)}><Icon name="bulk"/>Create Mission<Icon name="chevron"/></button>
        {menu && <div className="wa-dropdown" role="menu">{TYPES.map(t => <button type="button" role="menuitem" key={t} onClick={() => { setMenu(false); onCreate(t); }}>{t}</button>)}</div>}</span>
      <button type="button" className="ow-tool"><Icon name="group"/>Assign Mission</button>
      <button type="button" className="ow-tool"><Icon name="calendar"/>New Folder</button>
      <button type="button" className="ow-tool"><Icon name="bulk"/>Bulk Actions<Icon name="chevron"/></button>
      <button type="button" className="ow-tool" onClick={() => setOpenFolders(f => (f.length ? [] : rows.filter(r => r.folder).map(r => r.title)))}><Icon name="expand"/>Expand/Collapse</button>
      <button type="button" className="ow-tool"><Icon name="eye"/>Hide/Show Column</button>
      <input className="ow-search" aria-label="Search missions" placeholder="Search missions" value={query} onChange={e => setQuery(e.target.value)}/>
      <span className="wa-total">Total Missions: {LIBRARY_TOTAL + extra.reduce((n, r) => n + (r.count || 0), 0)}</span>
    </div>
    <div className="ow-table-scroll"><table className="ow-table wa-table" style={{ width: 1720 }}>
      <colgroup>{[430, 110, 80, 80, 210, 170, 110, 150, 200, 150].map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
      <thead><tr>{['Title', 'Type', 'Guide', 'Alert', 'Team', 'Process', 'Course', 'Category', 'Tag', 'Folder Status'].map((h, i) => <th key={h} className={i === 0 ? 'ow-name-cell' : ''}><div><span>{h}</span><span className="ow-dots" aria-hidden="true">⋮</span></div></th>)}</tr></thead>
      <tbody>{rows.filter(r => r.folder ? r.children.some(match) || match(r) : match(r)).map(r => row(r))}</tbody>
    </table></div>
  </>;
}

function SimpleTable({ head, rows, widths }) {
  return <div className="ow-table-scroll"><table className="ow-table wa-table" style={{ width: widths.reduce((a, b) => a + b, 0) }}>
    <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }}/>)}</colgroup>
    <thead><tr>{head.map((h, i) => <th key={h} className={i === 0 ? 'ow-name-cell' : ''}><div><span>{h}</span></div></th>)}</tr></thead>
    <tbody>{rows}</tbody>
  </table></div>;
}

function Marketplace({ onCatalog }) {
  const [query, setQuery] = useState('');
  const card = c => <article className="wa-catalog" key={c.id}>
    <button type="button" className="wa-catalog-img" style={{ backgroundImage: `url('${c.img}')` }} onClick={() => onCatalog(c.id)} aria-label={`Open ${c.name}`}/>
    <h4><img src="/mission-logo.png" alt=""/>{c.name}</h4><small>{c.missions} Missions</small><p>{c.text}</p>
    <footer><button type="button" className="ow-text-button" onClick={() => onCatalog(c.id)}>👁 Preview</button><button type="button" className="ow-secondary">+ Import</button><input type="checkbox" aria-label={`Compare ${c.name}`}/></footer>
  </article>;
  return <div className="wa-market">
    <aside className="wa-filters"><h4>Filters</h4>{['Vendor', 'Industry', 'Classification', 'Tags', 'Category'].map(f => <label key={f}><span>{f}:</span><select defaultValue=""><option value="">{f}</option></select></label>)}
      <h5>State</h5><label className="ow-check"><input type="checkbox"/>Imported</label><label className="ow-check"><input type="checkbox"/>Not Imported</label></aside>
    <div className="wa-market-main">
      <div className="wa-market-bar"><input className="ow-search" placeholder="Search by keyword" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search the marketplace"/><button type="button" className="ow-secondary">Compare List</button><button type="button" className="ow-secondary">Import List</button></div>
      <div className="wa-market-section"><h3><span className="wa-sq is-on">✓</span>Catalogs</h3><a className="ow-text-button">See All Catalogs ›</a></div>
      <div className="wa-catalogs">{CATALOGS.filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase())).map(card)}</div>
      <div className="wa-market-section"><h3><span className="wa-sq">✓</span>Bundles</h3><a className="ow-text-button">See All Bundles ›</a></div>
      <div className="wa-catalogs">{BUNDLES.map(b => <article className="wa-catalog is-bundle" key={b.id}><div className="wa-catalog-img" style={{ backgroundImage: `url('${b.img}')` }}/><h4><img src="/mission-logo.png" alt=""/>{b.name}</h4><small>{b.by} · {b.missions} Missions</small><p>{b.text}</p><footer><button type="button" className="ow-text-button">👁 Preview</button><button type="button" className="ow-secondary">+ Import</button></footer></article>)}</div>
    </div>
  </div>;
}

function Catalog({ id, onBack }) {
  const c = CATALOGS.find(x => x.id === id) || CATALOGS[0];
  const [picked, setPicked] = useState([]);
  const [imported, setImported] = useState([]);
  return <div className="wa-market">
    <aside className="wa-filters"><h4>Filters</h4><input className="ow-search" placeholder="Search by keyword" aria-label="Search catalog"/>
      <h5>Mission Type</h5>{['Task', 'Survey', 'Media', 'Checklist', 'Ticket', 'Test', 'Audit'].map((t, i) => <label className="ow-check" key={t}><input type="checkbox"/>{t}<span className="wa-muted">{[24, 18, 11, 69, 3, 6, 4][i]}</span></label>)}
      <h5>Category</h5><select defaultValue=""><option value="">Category</option></select><h5>Tag</h5><select defaultValue=""><option value="">Tags</option></select>
      <h5>State</h5><label className="ow-check"><input type="checkbox"/>Imported</label><label className="ow-check"><input type="checkbox"/>Not Imported</label></aside>
    <div className="wa-market-main">
      <div className="wa-market-bar"><nav className="wa-crumb"><button type="button" className="ow-text-button" onClick={onBack}>‹ Catalogs</button> / <b>{c.name}</b></nav><button type="button" className="ow-secondary" disabled={!picked.length}>Compare List</button><button type="button" className="ow-primary" disabled={!picked.length} onClick={() => { setImported(i => [...new Set([...i, ...picked])]); setPicked([]); }}>Import {picked.length ? `(${picked.length})` : 'List'}</button></div>
      <div className="wa-catalog-hero" style={{ backgroundImage: `url('${c.img}')` }}/>
      <p className="wa-catalog-count"><b>{c.missions}</b> Missions in this Catalog</p>
      <ol className="wa-catalog-list">{CATALOG_MISSIONS.map(mm => <li key={mm.n}>
        <input type="checkbox" checked={picked.includes(mm.n)} onChange={e => setPicked(p => (e.target.checked ? [...p, mm.n] : p.filter(x => x !== mm.n)))} aria-label={`Select ${mm.title}`}/>
        <span className="ow-number">{mm.n}.</span><img src="/mission-logo.png" alt=""/><b>{mm.title}</b>{(mm.imported || imported.includes(mm.n)) && <span className="wa-imported">Imported</span>}
        <span className={`wa-media-badge${mm.media ? '' : ' is-empty'}`}>{mm.media}</span><span className="wa-muted wa-qcount">{mm.questions} Questions</span><span className="wa-open" aria-hidden="true">↗</span>
      </li>)}</ol>
    </div>
  </div>;
}

export default function WebMissions({ tab, onTab, view, onView, typing, library = [], teams = [] }) {
  if (view?.kind === 'builder') return <WebMissionBuilder key={view.key || view.mission?.title || view.type} mission={view.mission} type={view.type} typing={typing} onClose={() => onView(null)}/>;
  if (view?.kind === 'process') return <WebProcess process={PROCESSES.find(p => p.id === view.id) || PROCESSES[0]} onClose={() => onView(null)}/>;
  return <>
    <WebSubnav tabs={MISSION_TABS} active={tab} onTab={t => { onView(null); onTab(t); }}/>
    {tab === 'In Library' && <Library extra={library} onOpen={mission => onView({ kind: 'builder', mission })} onCreate={type => onView({ kind: 'builder', type, key: `new-${type}-${Date.now()}` })}/>}
    {tab === 'In Teams' && <SimpleTable head={['Name', 'Type', 'Status']} widths={[600, 200, 200]} rows={[...teams, ...TEAMS_VIEW].map((t, i) => <Fragment key={t.team}>
      <tr className="ow-group-row"><td className="ow-name-cell"><div className="ow-group-button"><span className="ow-number">{i + 1}.</span><span className="ow-group-label">{t.team}</span><span className="ow-count">{t.missions.length}</span></div></td><td/><td/></tr>
      {t.missions.map((mm, j) => <tr key={mm + j} className="ow-data-row"><td className="ow-name-cell"><div className="ow-name-content"><span className="ow-tree"/><span className="ow-number">{j + 1}.</span><span className="ow-mission-name">{mm}</span></div></td><td>Mission</td><td><span className="wa-active"><i className="wa-dot is-green"/>Deployed</span></td></tr>)}
    </Fragment>)}/>}
    {tab === 'As Tickets' && <SimpleTable head={['Ticket', 'Ticket Board', 'Source Mission', 'Trigger']} widths={[380, 280, 380, 260]} rows={TICKETS_VIEW.map((t, i) => <tr key={t.title} className="ow-data-row"><td className="ow-name-cell"><div className="ow-name-content" style={{ paddingLeft: 24 }}><span className="ow-number">{i + 1}.</span><span className="ow-mission-name">{t.title}</span></div></td><td>{t.board}</td><td>{t.source}</td><td><span className="wa-chip is-ticket">{t.trigger}</span></td></tr>)}/>}
    {tab === 'Within Processes' && <SimpleTable head={['Name', 'Tag', 'Category', 'Version', 'Levels', 'Status']} widths={[420, 160, 170, 130, 110, 160]} rows={PROCESSES.map((p, i) => <tr key={p.id} className="ow-data-row" tabIndex={0} onClick={() => onView({ kind: 'process', id: p.id })} onKeyDown={e => e.key === 'Enter' && onView({ kind: 'process', id: p.id })}><td className="ow-name-cell"><div className="ow-name-content" style={{ paddingLeft: 24 }}><span className="ow-number">{i + 1}.</span><span className="ow-mission-name">{p.name}</span></div></td><td><span className="wa-chip">{p.tag}</span></td><td><span className="wa-chip">{p.category}</span></td><td>{p.version}</td><td>{p.levels}</td><td><span className="wa-active"><i className="wa-dot is-green"/>Published</span></td></tr>)}/>}
    {tab === 'Within Courses' && <SimpleTable head={['Course', 'Steps', 'Enrolled']} widths={[420, 640, 140]} rows={COURSES.map((c, i) => <tr key={c.title} className="ow-data-row"><td className="ow-name-cell"><div className="ow-name-content" style={{ paddingLeft: 24 }}><span className="ow-number">{i + 1}.</span><span className="ow-mission-name">{c.title}</span></div></td><td>{c.steps.join(' → ')}</td><td>{c.enrolled}</td></tr>)}/>}
    {tab === 'In Marketplace' && (view?.kind === 'catalog' ? <Catalog id={view.id} onBack={() => onView(null)}/> : <Marketplace onCatalog={id => onView({ kind: 'catalog', id })}/>)}
  </>;
}
