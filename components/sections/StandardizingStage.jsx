'use client';
// Standardizing Enterprise's art for the section videos (lib/sections/standardizing-enterprise.mjs), drawn from a state given as data:
//   view 'types'   the organization's knowledge (an Operations Manual) turned into missions: one card per mission type pops out of it (Task, Checklist, Survey, Audit, Media)
//   view 'mission' one of them opened: the product's own opened-mission screen of its type (components/OpenedMission.jsx: a task's guide and alert, a checklist's groups, a survey's and an
//                  audit's questions, a media mission's audio, illustration, video and quiz rows)
//   view 'web'     the web app's Missions › In Library (tm/04-home.png): the library table (its Type column), a mission's side panel (tm/44, tm/45: Content, Assigned)
//   view 'phone'   Anna F's phone (her Personal Board, her face over it): the mission arriving on it
//   view 'builder' the web app's mission builder (components/web/WebMissionBuilder.jsx): its Title retyped
//   view 'cards'   the product's mission cards on their own: the library's mission, its copy for Anna F and for the Kitchen Team, the new title on all, a schedule for each
// Only the product's own screens and pieces (the user, 2026-10-20: "only real product UI"); the Operations Manual is a document, not a screen.
// The pieces the other Knowledge boards share are exported from here (the web window and its chrome, the library page and a mission's side panel, the mission builder, the cards on
// their own, the spread of one mission to many): Powering Franchising, Innovating Consulting and Content Adaptation import them.
import {useLayoutEffect, useRef} from 'react';
import {useCenter, AVATAR} from './parts';
import MissionChip from '../MissionChip';
import PhoneShell from '../PhoneShell';
import {OpenedMission} from '../OpenedMission';
import {NAV} from '../DataReport';
import WebMissionBuilder from '../web/WebMissionBuilder';
import './standardizing-enterprise.css';

export const STANDARDIZING_BASE = {view: 'types', conv: 5, open: 'task', expand: 1, focus: null, pan: 0, pulled: null, panel: 0, tab: 'Content', assigned: 0, title: 0, step: 2, edit: 0, sched: 0};

// ---- icons (the web app's line icons) ----
const P = {
  bell: 'M18 8.5a6 6 0 0 0-12 0v5.2L4.4 16.5h15.2L18 13.7zM9.8 19.2a2.3 2.3 0 0 0 4.4 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  down: 'm6 9 6 6 6-6',
  right: 'm9.5 6 6 6-6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  import: 'M12 3.5v11m-4.5-4.5 4.5 4.5 4.5-4.5M4.5 15.5v4h15v-4',
  export: 'M12 15V4m-4.5 4.5L12 4l4.5 4.5M4.5 15.5v4h15v-4',
  plusCircle: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 8v8M8 12h8',
  send: 'M20 4 3.5 10.5l6.8 2.7L13 20z',
  folder: 'M3.5 6.5h6l2 2h9v10h-17z',
  bulk: 'M4 7h16M4 12h16M4 17h10',
  tree: 'M2.5 10.2h4.2v4.2H2.5zM15.8 3h4.2v4.2h-4.2zM15.8 10.2h4.2v4.2h-4.2zM15.8 17.4h4.2v4.2h-4.2zM6.7 12.3h4.6M11.3 5.1v14.4M11.3 5.1h4.5M11.3 19.5h4.5M11.3 12.3h4.5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4',
  info: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 11v5.5M12 7.8v.2',
  warn: 'M12 4 2.8 19.5h18.4zM12 10v4.5M12 17v.2',
  calendar: 'M4 5.5h16v15H4zM8 3v5M16 3v5M4 10h16',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  play: 'M8 5v14l11-7z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  audio: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  phone: 'M8 2.8h8a1.5 1.5 0 0 1 1.5 1.5v15.4a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5V4.3A1.5 1.5 0 0 1 8 2.8zM10.5 5.5h3',
  tablet: 'M4.5 4h15a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4zM11 17h2',
  store: 'M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12.5V20h13v-7.5M10 20v-4.5h4V20',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9M12 3C9.5 5.5 8.5 8.5 8.5 12s1 6.5 3.5 9',
  lock: 'M6.5 10.5h11v9.5h-11zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5',
  scale: 'M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  map: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20',
  close: 'M6 6l12 12M18 6 6 18',
  open: 'M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  left: 'm14.5 6-6 6 6 6',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.5 3.5 5.2',
  pin: 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4',
};
export const Ico = ({d, className = 'sec-se-ic', sw = 1.7, fill = false}) => <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={P[d]} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Kebab = () => <svg className="sec-pl-kebab" viewBox="0 0 6 20" aria-hidden="true"><circle cx="3" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/></svg>;
// the product's mission-type icons (a page with the type's color, as the library draws them)
const TYPE_COLOR = {Task: '#ef8f1d', Checklist: '#5b6fd8', Survey: '#1aa39a', Audit: '#d63c64', Media: '#8b5cf6', Test: '#ef8f1d', Ticket: '#d63c64'};
export const TypeIcon = ({type}) => <svg className="sec-se-type" viewBox="0 0 16 18" aria-hidden="true" style={{color: TYPE_COLOR[type] ?? '#5b6fd8'}}><path d="M3 1.2h7l3.8 3.8v10.6a1.2 1.2 0 0 1-1.2 1.2H3a1.2 1.2 0 0 1-1.2-1.2V2.4A1.2 1.2 0 0 1 3 1.2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M5 8h6M5 11h6M5 14h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;

// ---- The web window (the product's web app in the 1110 px window over its 1600 px page; a video shows the whole page across the picture) ----
// `overlay`: what is drawn over the whole window (a dialog), outside the page that pans.
export function WebWindow({focus = null, pan = 0, scroller = null, scrollTo = null, label = 'Taskmaverick web', className = '', overlay = null, children}) {
  const win = useRef(null);
  useCenter(win, {focus, pan, scroller, scrollTo});
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-pan}px)`, height: 776, width: 1600}}><div className="iq-ol-page">
      <div className={`ow-workspace iq-ow sec-pl sec-se-web ${className}`} aria-label={label}>{children}</div>
    </div></div>
    {overlay}
  </div>;
}
export const MISSION_TABS = ['In Library', 'In Teams', 'As Tickets', 'Within Processes', 'Within Courses', 'In Marketplace'];
export function WebChrome({active = 'Missions', tabs = MISSION_TABS, tab = 'In Library', right = null}) {
  return <>
    <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span>
      <nav>{NAV.map(n => <span key={n} className={n === active ? 'is-active' : undefined} data-iq-target={`nav-${n}`}>{n}</span>)}</nav>
      <div className="ow-account"><span className="ow-icon-button"><Ico d="bell" className="ow-icon"/></span><span className="ow-icon-button"><Ico d="gear" className="ow-icon" sw={1.6}/></span><span className="ow-avatar">JM</span></div>
    </header>
    <div className="ow-subnav"><nav>{tabs.map(t => <span key={t} className={t === tab ? 'is-active' : undefined} data-iq-target={`tab-${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{t}</span>)}</nav>{right}</div>
  </>;
}

// ---- Missions › In Library (the product's table: tm/04-home.png) ----
const lib = (id, title, type, rest = {}) => ({id, title, type, guide: true, alert: false, team: [], process: '-', course: '-', cert: '-', category: 'Operations', tag: ['General'], ...rest});
export const LIBRARY_ROWS = [
  lib('opening', 'Opening Checklist', 'Checklist', {alert: true, team: ['Front Of House', '+2'], category: 'Operations', tag: ['Opening']}),
  lib('restock', 'Restock Front Shelves', 'Task', {team: ['Stock Team'], category: 'Operations', tag: ['Inventory']}),
  lib('experience', 'Customer Experience Survey', 'Survey', {team: ['Front Of House'], category: 'Service', tag: ['Customers']}),
  lib('food-safety', 'Food Safety Audit', 'Audit', {alert: true, team: ['Kitchen Team', '+1'], process: 'Daily Safety', category: 'Compliance', tag: ['Safety']}),
  lib('shelving', 'Stock Shelving Training', 'Media', {team: ['Stock Team'], course: 'New Hire', category: 'Training', tag: ['Training']}),
  lib('allergens', 'Allergen Awareness Test', 'Test', {team: ['Kitchen Team'], course: 'New Hire', category: 'Training', tag: ['Training']}),
  {id: 'kitchen', folder: true, title: 'Kitchen Procedures', count: 24, category: 'Operations', tag: ['Kitchen']},
  lib('closing', 'Closing Checklist', 'Checklist', {alert: true, team: ['Front Of House', '+2'], category: 'Operations', tag: ['Closing']}),
  lib('restroom', 'Restroom Check', 'Checklist', {team: ['Front Of House'], category: 'Operations', tag: ['Cleaning']}),
  lib('temps', 'Cooler Temperature Log', 'Survey', {alert: true, team: ['Kitchen Team'], process: 'Daily Safety', category: 'Compliance', tag: ['Temperature']}),
  lib('equipment', 'Equipment Inspection', 'Audit', {team: ['Maintenance'], category: 'Maintenance', tag: ['Equipment']}),
  {id: 'hr', folder: true, title: 'Human Resources', count: 18, category: 'HR', tag: ['HR']},
  lib('breaks', 'Break Policy', 'Media', {team: ['All Staff'], category: 'HR', tag: ['Policy']}),
  lib('dress', 'Dress Code', 'Task', {team: ['All Staff'], category: 'HR', tag: ['Policy']}),
  lib('cash', 'Cash Handling', 'Media', {team: ['Cashiers'], course: 'New Hire', category: 'Training', tag: ['Register']}),
];
const LIB_COLS = [['title', 'Title', 380], ['type', 'Type', 120], ['guide', 'Guide', 90], ['alert', 'Alert', 90], ['team', 'Team', 190], ['process', 'Process', 160], ['course', 'Course', 140], ['cert', 'Certificate', 130], ['category', 'Category', 140], ['tag', 'Tag', 160]];
const Chips = ({list}) => <span className="sec-se-chips">{list.map(t => (t.startsWith('+') ? <em key={t}>({t})</em> : <i key={t}>{t}</i>))}</span>;
const Cols = () => <colgroup>{LIB_COLS.map(([k, , w]) => <col key={k} style={{width: w}}/>)}</colgroup>;
// `rows`: the table's rows; `pulled`: the id of the row whose side panel is open (the product shows it in peach); `panel`: that side panel (MissionSidePanel), over the page's right side.
export function LibraryPage({rows = LIBRARY_ROWS, pulled = null, panel = null, total = 6349}) {
  const cell = (r, k) => {
    if (r.folder) return k === 'type' ? 'Folder' : k === 'category' ? <span className="sec-se-tag">{r.category}</span> : k === 'tag' ? <Chips list={r.tag}/> : '-';
    if (k === 'type') return r.type;
    if (k === 'guide') return r.guide ? <Ico d="info" className="sec-se-guide"/> : '-';
    if (k === 'alert') return r.alert ? <Ico d="warn" className="sec-se-alert"/> : '-';
    if (k === 'team') return r.team.length ? <Chips list={r.team}/> : '-';
    if (k === 'process') return r.process !== '-' ? <span className="sec-se-process"><Ico d="tree" className="sec-se-ic is-small"/>{r.process}</span> : '-';
    if (k === 'category') return <span className="sec-se-tag">{r.category}</span>;
    if (k === 'tag') return <Chips list={r.tag}/>;
    return r[k];
  };
  return <>
    <WebChrome tab="In Library"/>
    <div className="ow-toolbar sec-se-tools">
      <span className="ow-tool"><Ico d="import" className="sec-pl-ic is-green"/>Import Mission</span>
      <span className="ow-tool"><Ico d="plusCircle" className="sec-pl-ic is-blue"/>Create Mission<Ico d="down" className="sec-pl-caret"/></span>
      <span className="ow-tool"><i className="sec-se-assign"><Ico d="send" className="sec-se-ic" sw={1.6}/></i>Assign Mission</span>
      <span className="ow-tool"><Ico d="folder" className="sec-pl-ic is-red"/>New Folder</span>
      <span className="ow-tool"><Ico d="bulk" className="sec-pl-ic"/>Bulk Actions<Ico d="down" className="sec-pl-caret"/></span>
      <span className="ow-tool"><Ico d="tree" className="sec-pl-ic"/>Expand/Collapse</span>
      <span className="ow-tool"><Ico d="eye" className="sec-pl-ic"/>Hide/Show Column</span>
      <span className="sec-se-total">Total Missions: <b>{total}</b><Ico d="down" className="sec-pl-caret"/></span>
    </div>
    <div className="ow-table-scroll sec-se-table">
      <table className="ow-table iq-ow-head" style={{width: 1600}}><Cols/>
        <thead><tr>{LIB_COLS.map(([k, label]) => <th key={k} className={k === 'title' ? 'ow-name-cell' : ''} data-iq-col={k}><div><span>{label}</span><Kebab/></div></th>)}</tr></thead>
      </table>
      <div className="iq-ow-rows"><table className="ow-table sec-se-rows" style={{width: 1600}}><Cols/>
        <tbody>{rows.map((r, i) => <tr key={r.id} className={`${r.folder ? 'ow-group-row sec-se-folder' : 'ow-data-row'}${pulled === r.id ? ' is-pulled' : ''}`} data-iq-target={`row-${r.id}`}>
          {LIB_COLS.map(([k]) => <td key={k} className={k === 'title' ? 'ow-name-cell' : ['type', 'guide', 'alert', 'course', 'cert', 'process'].includes(k) ? 'is-center' : ''}>
            {k === 'title' ? <div className="sec-se-name">
              {r.folder ? <span className="sec-se-toggle"><Ico d="right" className="sec-se-ic" sw={2.2}/></span> : <span className="sec-se-toggle is-empty"/>}
              <em>{i + 1}.</em>{r.folder ? <Ico d="folder" className="sec-se-folder-ic"/> : <TypeIcon type={r.type}/>}
              <b data-iq-target={`lib-${r.id}`}>{r.title}</b>{r.folder && <small>{r.count}</small>}<Kebab/>
            </div> : cell(r, k)}
          </td>)}
        </tr>)}</tbody>
      </table></div>
    </div>
    {panel}
  </>;
}

// ---- A library mission's side panel (the product's, tm/44-mission-panel.png, tm/45-mission-assigned.png): its title and close, Actions ▾ and Open, the tabs, then
// Content (General Information, the checkpoints with their response types) or Assigned (Schedules: People, Team Boards). `tab`: 'Content' | 'Assigned'.
// It is always there (the same page in every state: the video moves it); `open` 0 keeps it off the page's right edge.
export function MissionSidePanel({mission, tab = 'Content', people = 0, teams = 0, open = 1}) {
  return <aside className="sec-se-side" data-iq-target="side-panel" style={{transform: `translateX(${(1 - open) * 104}%)`}}>
    <header><b>{mission.title}</b><span className="sec-se-side-x"><Ico d="close" className="sec-se-ic" sw={2}/></span></header>
    <div className="sec-se-side-actions"><span className="sec-se-side-btn" data-iq-target="panel-actions"><Ico d="pencil" className="sec-se-ic"/><i/>Actions<i/><Ico d="down" className="sec-se-ic"/></span>
      <span className="sec-se-side-open"><Ico d="open" className="sec-se-ic"/><i/>Open</span></div>
    <nav className="sec-se-side-tabs"><Ico d="left" className="sec-se-ic is-small"/>{['Content', 'Settings', 'Assigned', 'Activity', 'History', 'Genera'].map(t => <span key={t} className={t === tab ? 'is-active' : undefined} data-iq-target={`panel-tab-${t.toLowerCase()}`}>{t}</span>)}<Ico d="right" className="sec-se-ic is-small"/></nav>
    <div className="sec-se-side-body">
      <div className="sec-se-side-pane" style={{opacity: tab === 'Content' ? 1 : 0}}>
        <section className="sec-se-side-card" data-iq-target="general-information">
          <h5><span className="sec-se-side-ico"><Ico d="info" className="sec-se-ic"/></span>General Information</h5>
          <dl>
            <dt>Title</dt><dd>{mission.title}</dd>
            <dt>Guide</dt><dd>{mission.guide}</dd>
            <dt>Alert</dt><dd>{mission.alert}</dd>
            <dt>Team</dt><dd><span className="sec-se-chips">{mission.team.map(t => <i key={t}>{t}</i>)}</span></dd>
            <dt>Category</dt><dd><span className="sec-se-chips"><i>{mission.category}</i></span></dd>
            <dt>Tag</dt><dd><span className="sec-se-chips">{mission.tag.map(t => <i key={t}>{t}</i>)}</span></dd>
          </dl>
        </section>
        {mission.steps.map((q, i) => <section key={q} className="sec-se-side-card sec-se-side-q"><div><span>{i + 1}. {q}</span><em>Yes or No</em></div><small>Response</small><p><span>Yes</span><span>No</span></p></section>)}
      </div>
      <div className="sec-se-side-pane" style={{opacity: tab === 'Assigned' ? 1 : 0}}>
        <h5 className="sec-se-side-h"><span className="sec-se-side-ico"><Ico d="calendar" className="sec-se-ic"/></span>Schedules</h5>
        <div className="sec-se-side-sched">
          <section data-iq-target="assigned-people"><header><Ico d="person" className="sec-se-ic"/>People<b>{people}</b></header><span><Ico d="open" className="sec-se-ic"/><i/>Schedules<b>{people}</b></span></section>
          <section data-iq-target="assigned-teams"><header><Ico d="people" className="sec-se-ic"/>Team Boards<b>{teams}</b></header><span><Ico d="open" className="sec-se-ic"/><i/>Schedules<b>{teams}</b></span></section>
        </div>
      </div>
    </div>
  </aside>;
}

// ---- Cards on their own at places of their own (the Isolated missions' look: parts.jsx FlowPart's card, without its centering: the art places them) ----
// `chips`: [{id, x, y, scale, mission: {kind, points, title, who, avatar, exec, pill, tone, date, time}, opacity, pop}]; each card's `.chip` is named <id> and its parts <id>-title|pill|exec|who
export function useNames(root, selector = '[data-chip]') {
  useLayoutEffect(() => {
    root.current?.querySelectorAll(selector).forEach(el => {
      const id = el.dataset.chip, chip = el.querySelector('.chip');
      chip?.setAttribute('data-iq-target', id);
      for (const [cls, key] of [['chip-exec', 'exec'], ['chip-who', 'who'], ['chip-performer-avatar', 'who'], ['chip-pill', 'pill'], ['chip-title', 'title'], ['chip-kind', 'kind']]) el.querySelector(`.${cls}`)?.setAttribute('data-iq-target', `${id}-${key}`);
    });
  });
}
export function Card({c}) {
  const m = c.mission, shown = c.opacity ?? 1;
  return <div className="mi-interactive mi-interactive--tablet mi-reference iq2-iso sec-chip sec-se-chip" data-chip={c.id} style={{position: 'absolute', left: c.x, top: c.y, width: 334, transform: `scale(${(c.scale ?? 1) * (shown ? 1 : 0.92)})`, transformOrigin: c.origin ?? '50% 50%', opacity: shown}}>
    <div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: 334}}>
      <MissionChip kind={m.kind} points={m.points ?? null} title={m.title} who={m.who} avatar={m.avatar} date={m.date ?? '09-23-26'} time={m.time ?? '08:00 AM'} showExec={m.exec != null} execTime={m.exec} pillTime={m.pill ?? '00:00:00'} pillClass={`chip--${m.tone ?? 'green'}`}/>
    </div></div>
  </div>;
}

// ---- Knowledge turned into missions: the Operations Manual, a purple branch to each mission type ----
const PURPLE = '#7b3cf0';
export const TYPES = [
  {id: 'type-task', kind: 'Task', points: 10, title: 'Restock Front Shelves'},
  {id: 'type-checklist', kind: 'Checklist', points: 25, title: 'Opening Checklist'},
  {id: 'type-survey', kind: 'Survey', points: 15, title: 'Customer Experience Survey'},
  {id: 'type-audit', kind: 'Audit', points: null, title: 'Food Safety Audit'},
  {id: 'type-media', kind: 'Media', points: 10, title: 'Stock Shelving Training'},
];
function KnowledgeFlow({s}) {
  const root = useRef(null);
  useNames(root);
  const K = 0.92, W = 334 * K, H = 128 * K, GAP = 18, n = TYPES.length, total = n * H + (n - 1) * GAP, top = 450 - total / 2;
  const doc = {x: 10, y: 450 - 197, w: 590, h: 394}, cardX = 712, bus = 650; // (the manual is the user's picture, 3:2: the bound book, its light and its six plaques, its backdrop taken out (the user, 2026-10-27; the book alone was 380 × 475); the line starts at the plaques)
  const mid = i => top + i * (H + GAP) + H / 2;
  const chips = TYPES.map((t, i) => ({id: t.id, x: cardX - (334 - W) / 2, y: mid(i) - 128 / 2, scale: K, opacity: s.conv > i ? 1 : 0, mission: {kind: t.kind, points: t.points, title: t.title, pill: '00:00:00', date: '09-23-26', time: '08:00 AM'}}));
  return <div ref={root} className="iq2-iso-layer sec-flow sec-se-flow" data-sec-part="Layer" style={{width: 1600, height: 900}}>
    <div className="sec-se-book" data-iq-target="manual" style={{left: doc.x, top: doc.y, width: doc.w, height: doc.h}}>
      <img src="/storyboard-art/operational-manual-plaques.webp" alt="Operational Manual: Planning, Execution, Monitoring, Improvement, Resources, Success"/>
    </div>
    <svg className="sec-flow-lines" width="1" height="1" style={{overflow: 'visible'}} aria-hidden="true">
      <defs><marker id="sec-se-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
      <path d={`M${doc.x + doc.w + 10} 450 L${bus} 450`} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" style={{opacity: s.conv > 0 ? 1 : 0}}/>
      {TYPES.map((t, i) => <path key={t.id} d={`M${bus} 450 L${bus} ${mid(i)} L${cardX - 12} ${mid(i)}`} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#sec-se-arrow)" style={{opacity: s.conv > i ? 1 : 0}}/>)}
    </svg>
    {chips.map(c => <Card key={c.id} c={c}/>)}
  </div>;
}

// ---- Each type opened: the product's own opened-mission screen (components/OpenedMission.jsx, the Figma "Mission Details" of every type, lib/openedMissions.js' shape), in the place of the
// Mission Details (the same 360 x 573 box at 1.5x). `expand` 0 to 1: popped as its summary card, centered, then opened (the way parts.jsx MissionPanel opens). Its media rows are named
// media-row-<kind> for the outlines.
const COMMON = {location: 'Main Street / Store', postedBy: 'J. Maverick', date: '09-23-26', time: '08:00 AM', pillTime: '00:00:06', pillClass: 'chip--green'};
const OPENED = {
  task: {...COMMON, id: 'task', type: 'Task', title: 'Restock Front Shelves', points: 10, description: 'Fill the front shelves from the backroom. Face every product forward.', notice: 'Use the step stool for the top shelf'},
  checklist: {...COMMON, id: 'checklist', type: 'Checklist', title: 'Opening Checklist', points: 25, description: 'Open the store the same way every day, step by step.', notice: 'Unlock the doors only at 8:00 AM', sectionTitle: 'Checklist',
    groups: [{title: 'Registers', done: 2, total: 2, items: [{n: 1, label: 'Registers open', value: 2}, {n: 2, label: 'Drawers counted', value: 2}]}, {title: 'Sales Floor', done: 0, total: 3, collapsed: true}, {title: 'Shelves', done: 1, total: 4, collapsed: true}, {title: 'Total', tone: 'yellow', items: [{n: 1, label: 'Checks', value: 4}]}]},
  survey: {...COMMON, id: 'survey', type: 'Survey', title: 'Customer Experience Survey', points: 15, description: 'Walk the store as a customer would and answer honestly.', notice: 'Answer every question', intro: 'How does the store look today?',
    questions: [{kind: 'yesno', prompt: 'Are the restrooms stocked?', options: [{label: 'Yes', state: 'on'}, {label: 'No'}, {label: 'N/A'}], attach: {note: 'Attach at least one photo:', rows: [{photo: {label: 'Photo', count: '1/2'}, video: {label: 'Add Video', count: '0/1'}}]}},
      {kind: 'yesno', prompt: 'Is the floor clean?', options: [{label: 'Yes', state: 'on'}, {label: 'No'}]}, {kind: 'yesno', prompt: 'Are the shelves full?', options: [{label: 'Yes'}, {label: 'No', state: 'on'}]}]},
  audit: {...COMMON, id: 'audit', type: 'Audit', title: 'Food Safety Audit', points: null, description: 'Please answer all the questions below', notice: 'Photograph anything out of range',
    questions: [{kind: 'yesno', prompt: 'Are cold foods held below 41°F?', options: [{label: 'Yes'}, {label: 'No'}, {label: 'N/A'}]},
      {kind: 'multi', prompt: 'Which items are labeled and dated?', hint: '*select multiple options', options: [{label: 'Dairy', selected: true}, {label: 'Produce', selected: true}, {label: 'Deli'}, {label: 'Bakery'}]},
      {kind: 'single', prompt: 'How clean is the walk-in cooler?', options: [{label: 'Excellent'}, {label: 'Good', selected: true}, {label: 'Fair'}]}]},
  media: {...COMMON, id: 'media', type: 'Media', title: 'Stock Shelving Training', points: 10, description: 'Listen to the lesson, watch the video, then answer the quiz.', notice: 'Read the safety instructions first', estimated: '02:10',
    contents: [{n: 1, label: 'Shelving Basics', kind: 'audio', meta: '00:50'}, {label: 'Quiz-1', kind: 'quiz', meta: 'n/a', sub: true}, {n: 2, label: 'Shelving Illustration', kind: 'illustration', meta: 'n/a'},
      {n: 3, label: 'How To Stock Shelves', kind: 'video', meta: '00:06'}, {label: 'Quiz-2', kind: 'quiz', meta: 'n/a', sub: true}]},
};
function TypeMission({s}) {
  const m = OPENED[s.open] ?? OPENED.task, root = useRef(null), expand = s.expand ?? 1, scale = 1.5;
  useLayoutEffect(() => {
    const box = root.current, card = box?.querySelector('.om-card');
    if (!card) return;
    box.querySelectorAll('.om-mrow').forEach((row, i) => { const kind = m.contents?.[i]?.kind; if (kind === 'audio' || kind === 'video') row.setAttribute('data-iq-target', `media-row-${kind}`); });
    const H = box.offsetHeight, top = card.offsetTop, bottom = top + card.offsetHeight, shift = (H / 2 - (top + bottom) / 2) * (1 - expand);
    box.style.transform = `translateY(${shift * scale}px) scale(${scale})`;
    box.style.clipPath = `inset(${Math.round(top * (1 - expand) * 100) / 100}px 0px ${Math.round((H - bottom) * (1 - expand) * 100) / 100}px 0px round ${14 + 4 * expand}px)`;
  });
  return <div ref={root} className="iq2-mission sec-se-om" data-sec-part="Mission" style={{left: 341, top: 163, width: 360, height: 573, transform: `scale(${scale})`}}>
    <OpenedMission mission={m} state="open" showStatusBar={false}/>
  </div>;
}

// ---- One mission sent to many: the product's mission cards on their own (FlowPart's look), the source on top, a purple branch down to each copy ----
// `source`: {label, mission}; `targets`: [{id, name, sub, avatars | icon, mission, schedule}]; `step`: how many copies are there; `edit` 2: every title is the new one (`newTitle`);
// `sched`: how many schedules are shown (the Increased Efficiency videos' schedule pill, by the card it is for). Nothing in it is a screen of its own: the cards are the product's.
const CARD = {w: 334, h: 128};
function Faces({avatars}) { return <span className="sec-se-faces">{avatars.map((src, i) => <img key={i} src={src} alt=""/>)}</span>; }
export function CardsSpread({source, targets, step = targets.length, edit = 0, sched = 0, newTitle, top = 0}) {
  const root = useRef(null);
  useNames(root);
  const n = targets.length, K = n >= 3 ? 0.86 : 1, w = CARD.w * K, gap = n >= 3 ? 30 : 90, total = n * w + (n - 1) * gap;
  const xs = targets.map((_, i) => 521 - total / 2 + w / 2 + i * (w + gap));
  const srcY = 210 + top, busY = 400 + top, headY = 428 + top, cardY = 506 + top;
  const title = m => (edit === 2 ? newTitle : m.title);
  return <div ref={root} className="iq2-iso-layer sec-flow sec-se-spread" data-sec-part="Layer" style={{width: 1600, height: 900}}>
    <span className="iq2-rating-label sec-label sec-se-label" style={{left: 521, top: srcY - 26}}>{source.label}</span>
    <Card c={{id: 'source', x: 521 - CARD.w / 2, y: srcY, scale: 1.05, mission: {...source.mission, title: title(source.mission)}}}/>
    <svg className="sec-flow-lines" width="1" height="1" style={{overflow: 'visible'}} aria-hidden="true">
      <defs><marker id="sec-se-arrow-2" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
      <path d={`M521 ${srcY + 145} L521 ${busY}`} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" style={{opacity: step > 0 ? 1 : 0}}/>
      {targets.map((t, i) => <path key={t.id} d={`M521 ${busY} L${xs[i]} ${busY} L${xs[i]} ${headY - 8}`} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#sec-se-arrow-2)" style={{opacity: step > i ? 1 : 0}} data-iq-target={`arrow-${t.id}`}/>)}
    </svg>
    {targets.map((t, i) => {
      const on = step > i, shown = sched > i;
      return <div key={t.id} className={`sec-se-target${on ? ' is-on' : ''}`} style={{left: xs[i], top: headY}} data-iq-target={`target-${t.id}`}>
        <div className="sec-se-head" data-iq-target={`head-${t.id}`}>
          {t.avatars ? <Faces avatars={t.avatars}/> : <span className="sec-se-place"><Ico d={t.icon ?? 'store'} className="sec-se-ic" sw={1.6}/></span>}
          <span className="sec-se-who"><b>{t.name}</b>{t.sub && <small>{t.sub}</small>}</span>
        </div>
        {t.schedule && <span className="ev2-schedule sec-se-sched" data-iq-target={`sched-${t.id}`} style={{opacity: shown ? 1 : 0, transform: `translateX(-50%) scale(${shown ? 1 : 0.85})`}}><Ico d="calendar" className="sec-se-ic"/>{t.schedule}</span>}
      </div>;
    })}
    {targets.map((t, i) => <Card key={`c-${t.id}`} c={{id: `copy-${t.id}`, x: xs[i] - CARD.w / 2, y: cardY, scale: K, opacity: step > i ? 1 : 0, mission: {...t.mission, title: title(t.mission)}}}/>)}
  </div>;
}

// ---- The person's phone (her Personal Board, an avatar over it: the Increased Efficiency phones) ----
function PhoneScene({mission, on}) {
  return <div className="sec-phones sec-se-phones" data-sec-part="Board" style={{left: 521 - 150, top: 40, width: 300, height: 820}}>
    <div className="sec-phone-col" style={{left: 0}}>
      <img className="adx-avatar sec-face" src={AVATAR.anna} alt="" data-iq-target="face-anna"/>
      <div className="ph-fit adx-phone sec-phone-fit"><PhoneShell title="Personal Board" tabs={[{label: `Open - ${on ? 3 : 2}`, active: true}, {label: 'Claimed - 0'}, {label: 'Closed - 1'}]}>
        {[{title: 'Restroom Check', kind: 'Checklist', points: 15, pill: '00:51:30', time: '07:00 AM'}, {title: 'Restock Front Shelves', kind: 'Task', points: 10, pill: '00:42:10', time: '07:15 AM'}, mission].map((m, j) => <div className="es-phone-mission sec-phone-card" key={m.title} data-iq-target={j === 2 ? 'phone-mission' : undefined} style={j !== 2 ? undefined : {opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 14}px) scale(${on ? 1 : 0.92})`, height: on ? 'auto' : 0, overflow: 'hidden'}}>
          <MissionChip kind={m.kind} points={m.points} title={m.title} date="09-23-26" time={m.time ?? '08:00 AM'} pillTime={m.pill ?? '00:00:00'}/></div>)}
      </PhoneShell></div>
    </div>
  </div>;
}
// ---- The mission builder (the web app's Edit Mission: components/web/WebMissionBuilder.jsx), its Title field named for the cursor ----
function Builder({mission}) {
  const root = useRef(null);
  useLayoutEffect(() => { root.current?.querySelector('.wa-builder-form input')?.setAttribute('data-iq-target', 'field-title'); root.current?.querySelector('.wa-builder-actions .ow-primary')?.setAttribute('data-iq-target', 'builder-actions'); });
  return <div ref={root} className="sec-se-builder"><WebMissionBuilder key={mission.title} mission={mission} type={mission.type}/></div>;
}

// ---- This board's mission: the library's Opening Checklist, sent to Anna F and to the Kitchen Team ----
export const STANDARD_TITLE = 'Store Opening Checklist';
const OPENING = {title: 'Opening Checklist', type: 'Checklist', folder: 'Operations', guide: 'Open the store the same way every day, step by step.', alert: 'Unlock the doors only at 8:00 AM.',
  team: ['Front Of House', 'Kitchen Team'], category: 'Operations', tag: ['Opening'], steps: ['Lights and music are on?', 'Registers are counted?', 'Aisles are clear and clean?', 'Doors unlocked at 8:00 AM?']};
// a mission as the builder takes it (its guide, alert and checkpoints)
export const builderMissionOf = ({title, type, folder, guide, alert, team, category, tag, steps}) => ({title, type, folder, description: guide, notice: alert, team, category, tag, items: steps.map((label, i) => ({id: `s${i + 1}`, kind: 'yesno', label}))});
export function BuilderWindow({mission, tab = 'In Library', focus = null, pan = 0}) {
  return <WebWindow focus={focus} pan={pan} label="Taskmaverick web: Edit Mission"><WebChrome tab={tab}/><Builder mission={builderMissionOf(mission)}/></WebWindow>;
}
const SPREAD_SOURCE = {label: 'Missions › In Library', mission: {kind: 'Checklist', points: 25, title: 'Opening Checklist', pill: '00:00:00', date: '09-23-26', time: '08:00 AM'}};
const SPREAD_TARGETS = [
  {id: 'anna', name: 'Anna F', sub: 'Personal Board', avatars: [AVATAR.anna], schedule: 'Daily · 8:00 AM', mission: {kind: 'Checklist', points: 25, title: 'Opening Checklist', pill: '00:00:00', time: '08:00 AM'}},
  {id: 'kitchen', name: 'Kitchen Team', sub: 'Team Board', avatars: [AVATAR.ben, AVATAR.carla, AVATAR.leo], schedule: 'Mon · Wed · Fri · 6:00 AM', mission: {kind: 'Checklist', points: 25, title: 'Opening Checklist', pill: '00:00:00', time: '06:00 AM'}},
];

export default function StandardizingStage({state}) {
  const s = {...STANDARDIZING_BASE, ...state};
  const title = s.edit === 2 ? STANDARD_TITLE : OPENING.title;
  if (s.view === 'mission') return <TypeMission s={s}/>;
  if (s.view === 'web') return <WebWindow focus={s.focus} pan={s.pan} label="Taskmaverick web: Missions, In Library">
    <LibraryPage pulled={s.panel ? 'opening' : s.pulled} panel={<MissionSidePanel mission={{...OPENING, title}} tab={s.tab} people={s.assigned ? 1 : 0} teams={s.assigned ? 1 : 0} open={s.panel ? 1 : 0}/>}/>
  </WebWindow>;
  if (s.view === 'builder') return <BuilderWindow mission={{...OPENING, title: s.title ? STANDARD_TITLE : OPENING.title}} focus={s.focus} pan={s.pan}/>;
  if (s.view === 'phone') return <PhoneScene mission={{kind: 'Checklist', points: 25, title, pill: '00:00:00', time: '08:00 AM'}} on={s.step >= 1}/>;
  if (s.view === 'cards') return <CardsSpread source={SPREAD_SOURCE} targets={SPREAD_TARGETS} step={s.step} edit={s.edit} sched={s.sched} newTitle={STANDARD_TITLE}/>;
  return <KnowledgeFlow s={s}/>;
}
