'use client';
// Data & AI's art for the section videos (lib/sections/training-data-ai.mjs): only the product's real screens (the user, 2026-10-20: "only real product UI").
//   page 'list'     the Reports page (screenshot 12): the saved reports; a click on one opens its side panel (screenshot 13: General Information, Actions, Open), whose Open opens the report
//   page 'report'   the Training Summary report, the Data Board's look and columns (components/DataReport.jsx, as Reporting & AI draws it): ten people, grouped by person; `level` 1: the
//                   first person opened to their ten trainings (Type, Folder, Course)
//   page 'history'  the Overview › Course board's History view (screenshots 10, 34, 41: Closed By, Opened At, Open, Claimed, Duration, Closed At), grouped by person: Anna's course, folded,
//                   opened (`open`) to each lesson she took, with its aging (Open: how long it waited) and its execution (Claimed: how long it took)
// Every row is always in the page and what is closed is folded, so the page moves from one state to the next; the window shows 1110 px of the page, centered on what is outlined (`useCenter`);
// a video shows all of it with the words under it.
import {useRef} from 'react';
import {useCenter} from './parts';
import {Icon, Sidebar, NAV, HEAD, Toggle, Pct} from '../DataReport';
import {Icon as OwIcon} from '../OverviewWorkspace';
import {OverviewBoard} from './MonitoringStage';
import './training-data-ai.css';

export const TRAINING_DATA_BASE = {focus: null, page: 'list', panel: 0, level: 0, open: 0, pan: 0, scrollTo: null};

// ---- the saved reports (the product's Reports page) and a report's side panel ----
const REPORTS = [['Training Summary', 'Training', 1, 'Maria Lopez', '10/20/2026 07:40 AM'], ['Weekly Operations', '', 1, 'James Miller', '10/19/2026 05:12 PM'], ['Food Safety Audits', 'Safety', 0, 'Maria Lopez', '10/18/2026 11:03 AM'],
  ['Opening Checklists', '', 0, 'Sarah Wilson', '10/17/2026 06:25 PM'], ['Cleaning Code Data', 'Cleaning', 0, 'Emily Carter', '10/16/2026 09:48 AM'], ['Maintenance Tickets', '', 1, 'Michael Davis', '10/15/2026 02:30 PM'],
  ['Inventory Counts', '', 0, 'James Miller', '10/14/2026 04:16 PM'], ['Guest Feedback', 'Service', 0, 'Nina Patel', '10/13/2026 10:05 AM'], ['Course Completions', 'Training', 1, 'Maria Lopez', '10/12/2026 08:51 AM'],
  ['Certificates Expiring', '', 0, 'Sarah Wilson', '10/10/2026 03:39 PM'], ['Closing Checklists', '', 0, 'Leo Tran', '10/09/2026 09:27 PM'], ['Temperature Logs', 'Safety', 1, 'Emily Carter', '10/08/2026 07:14 AM'],
  ['Monthly Audit Scores', '', 0, 'Michael Davis', '10/06/2026 12:02 PM'], ['Timesheet Exceptions', '', 0, 'Nina Patel', '10/05/2026 05:55 PM']];
const LIST_COLUMNS = [['Name', 330], ['Tag', 210], ['Subscription', 200], ['Created By', 260], ['Updated', 280], ['Updated By', 320]];
const PathIcon = ({d, w = 1.7}) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>;
function ReportPanel({open}) {
  return <aside className="sec-td-panel" aria-label="Report details" style={{transform: `translateX(${open ? 0 : 104}%)`, opacity: open ? 1 : 0}}>
    <header><h2>Training Summary</h2><span className="sec-td-x"><PathIcon d="M6 6l12 12M18 6 6 18" w={1.8}/></span></header>
    <div className="sec-td-actions">
      <span className="sec-td-actbtn"><PathIcon d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/><i/>Actions<i/><PathIcon d="m6 9 6 6 6-6" w={1.8}/></span>
      <span className="sec-td-open" data-iq-target={open ? 'panel-open' : undefined}><PathIcon d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/><i/>Open</span>
    </div>
    <section className="sec-td-info">
      <b><span className="sec-td-info-ic"><PathIcon d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" w={1.6}/></span>General Information</b>
      <dl><dt>Report Name</dt><dd>Training Summary</dd><dt>Subscription</dt><dd><span className="ow-position">Weekly Training</span></dd><dt>Created By</dt><dd>Maria Lopez</dd><dt>Updated</dt><dd>10/20/2026 07:40 AM</dd><dt>Updated By</dt><dd>Maria Lopez</dd></dl>
    </section>
  </aside>;
}
function ReportsList({panel}) {
  const cols = <colgroup>{LIST_COLUMNS.map(([key, w]) => <col key={key} style={{width: w}}/>)}</colgroup>, width = LIST_COLUMNS.reduce((n, [, w]) => n + w, 0);
  return <div className="ow-workspace iq-ow sec-td-list" aria-label="Taskmaverick Reports">
    <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span><nav>{NAV.map(n => <span key={n} className={n === 'Reports' ? 'is-active' : undefined}>{n}</span>)}</nav><div className="ow-account"><span className="ow-icon-button"><OwIcon name="bell"/></span><span className="ow-icon-button"><OwIcon name="settings"/></span><span className="ow-avatar">JM</span></div></header>
    <div className="ow-subnav"><nav><span className="is-active">Report</span><span>Subscriptions</span></nav></div>
    <div className="ow-toolbar"><span className="ow-tool sec-td-new"><svg className="ow-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>New Report</span></div>
    <div className="ow-table-scroll">
      <table className="ow-table iq-ow-head" style={{width}}>{cols}<thead><tr>{LIST_COLUMNS.map(([key]) => <th key={key}><div><span>{key}</span>{key === 'Updated' && <span className="sec-td-sort">↓</span>}<span className="ow-dots">⋮</span></div></th>)}</tr></thead></table>
      <div className="iq-ow-rows"><table className="ow-table" style={{width}}>{cols}<tbody>{REPORTS.map(([name, tag, subs, by, at], i) => <tr key={name} className={`ow-data-row${i === 0 && panel ? ' is-open' : ''}`}>
        <td><div className="sec-td-name"><span className="ow-number">{i + 1}.</span><span className="ow-mission-name" data-iq-target={i === 0 ? 'report-training' : undefined}>{name}</span><span className="ow-dots">⋮</span></div></td>
        <td>{tag && <span className="ow-position">{tag}</span>}</td><td>{subs}</td><td>{by}</td><td>{at}</td><td>{by}</td>
      </tr>)}</tbody></table></div>
    </div>
    <ReportPanel open={!!panel}/>
  </div>;
}

// ---- the Training Summary (the Data Board's look and columns, as Reporting & AI's): ten people, a person opened to their ten trainings ----
const PEOPLE = [['Anna Fischer', 10, 14, 13], ['Ben Rivera', 9, 12, 12], ['Carla Mendes', 8, 11, 9], ['Leo Tran', 9, 10, 10], ['Dan Kowalski', 7, 9, 7], ['Emily Carter', 10, 12, 12], ['James Miller', 8, 10, 9],
  ['Sarah Wilson', 9, 11, 11], ['Michael Davis', 6, 8, 6], ['Nina Patel', 10, 13, 13]];
const FOOD = 'Food Safety Course', OPENING = 'Opening Procedures Course';
const TRAININGS = [['Handwashing Basics', 'Media', 3, 3, FOOD], ['Allergen Awareness', 'Media', 1, 1, FOOD], ['Safe Food Storage', 'Test', 2, 2, FOOD], ['Food Temperature Control', 'Media', 1, 1, FOOD],
  ['Cleaning And Sanitizing', 'Checklist', 2, 2, FOOD], ['Cross-Contamination', 'Media', 1, 1, FOOD], ['Personal Hygiene', 'Test', 1, 1, FOOD], ['Pest Prevention', 'Media', 1, 1, FOOD],
  ['Receiving Deliveries', 'Task', 1, 1, OPENING], ['Food Safety Final Test', 'Test', 1, 0, FOOD]];
const pct = (closed, posted) => (closed / posted) * 100;
const Reveal = ({open, children}) => <div className="iq2-reveal" style={{gridTemplateRows: `${open ? 1 : 0}fr`, opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden'}}><div>{children}</div></div>;
const Block = ({id, children}) => <div data-iq-target={id} className="sec-block">{children}</div>;
function Report({level}) {
  return <div className="iq-ur iq-dr sec-td" aria-label="Taskmaverick web: Training Summary">
    <header className="iq-ur-topbar"><img src="/logo.svg" alt="taskmaverick"/><nav>{NAV.map(n => <span key={n} className={n === 'Reports' ? 'is-active' : undefined}>{n}</span>)}</nav><div><Icon name="bell"/><Icon name="gear"/><span className="iq-ur-avatar">JM</span></div></header>
    <div className="iq-ur-page"><Sidebar/>
      <main className="iq-ur-main">
        <div className="iq-ur-head"><b>Training Summary</b><span className="iq-ur-link">Show Details</span><span className="iq-ur-range iq-dr-hours"><Icon name="clock"/>12 AM - 12 AM</span><span className="iq-ur-range iq-dr-range">10/01/2026 – 10/20/2026<Icon name="chev"/></span><span className="iq-ur-btn iq-dr-btn-muted">Update Default View</span><span className="iq-ur-btn is-primary">Save To My View</span></div>
        <div className="iq-ur-tools"><span><Icon name="view" className="iq-ur-ic is-blue"/>My View:Default</span><span><Icon name="group"/>Group by: Person</span><span><Icon name="expand"/>Expand/Collapse</span><span className="iq-ur-gallery"><i className="iq-ur-checkbox"/>Daily Distribution</span><span className="iq-ur-icons"><Icon name="gear"/><Icon name="cloud"/><Icon name="mail"/><Icon name="sync"/></span></div>
        <div className="iq-ur-summary"><span>Total Closed: 102 of 110 / 92.7%</span><span className="iq-ur-pill"><i><Icon name="team"/></i>Team <b>0 of 0 / 0%</b></span><span className="iq-ur-pill is-active"><i><Icon name="person"/></i>Personal <b>102 of 110 / 92.7%</b></span></div>
        <div className="iq-dr-table sec-table">
          <div className="iq-dr-row is-head">{HEAD.map(h => <span key={h}>{h}<Icon name="dots"/></span>)}</div>
          <div className="sec-scroll"><div className="iq-dr-body">
            <Block id="people-block">{PEOPLE.map(([name, count, posted, closed], i) => <Block key={name} id={`person-${i}`}>
              <div className="iq-dr-row is-group depth-0">
                <span><span className="sec-td-toggle" data-iq-target={`toggle-person-${i}`}><Toggle open={i === 0 && level >= 1}/></span><em>{i + 1}.</em><b>{name}</b><small>{count}</small></span><span/>
                <span className="is-num">{posted}</span><span className="is-num">{closed}</span><span><Pct pct={pct(closed, posted)}/></span><span><i className="iq-dr-chip">Staff</i></span><span/><span/><span/><span/>
              </div>
              {i === 0 && <Reveal open={level >= 1}><Block id="missions-block">{TRAININGS.map(([title, type, tPosted, tClosed, course], k) => <Block key={title} id={`mission-${k}`}>
                <div className="iq-dr-row is-mission sec-td-lesson"><span><i className="iq-dr-branch"/><em>{k + 1}.</em><b>{title}</b><small>{tPosted}</small></span><span/>
                  <span className="is-num">{tPosted}</span><span className="is-num">{tClosed}</span><span><Pct pct={pct(tClosed, tPosted)}/></span><span/><span>{type}</span><span>Training</span><span/><span>{course}</span></div>
              </Block>)}</Block></Reveal>}
            </Block>)}</Block>
          </div></div>
        </div>
      </main>
    </div>
  </div>;
}

// ---- the Course board's History: Anna's course opened to each lesson she took, its Open (aging) and Claimed (execution) timers, its Duration and when it was closed (newest first: Opened At ↓) ----
const HISTORY_COLUMNS = [['name', 380], ['ref', 120], ['by', 160], ['triggered', 190], ['open', 125], ['claimed', 125], ['duration', 125], ['closed', 190], ['type', 110], ['position', 95]];
const RUNS = [['Handwashing Basics', '10/20', '00:12:15', '00:05:18', '00:17:33', '08:17 AM', 'Media'], ['Pest Prevention', '10/19', '00:28:15', '00:07:45', '00:36:00', '08:36 AM', 'Media'],
  ['Personal Hygiene', '10/18', '00:11:30', '00:04:50', '00:16:20', '08:16 AM', 'Test'], ['Cross-Contamination', '10/17', '00:19:55', '00:06:40', '00:26:35', '08:26 AM', 'Media'],
  ['Cleaning And Sanitizing', '10/16', '00:12:10', '00:09:30', '00:21:40', '08:21 AM', 'Checklist'], ['Food Temperature Control', '10/15', '00:24:30', '00:07:05', '00:31:35', '08:31 AM', 'Media'],
  ['Allergen Awareness', '10/14', '00:21:05', '00:08:21', '00:29:26', '08:29 AM', 'Media'], ['Handwashing Basics', '10/13', '00:18:05', '00:06:30', '00:24:35', '08:24 AM', 'Media'],
  ['Safe Food Storage', '10/09', '00:16:40', '00:06:15', '00:22:55', '08:22 AM', 'Test'], ['Handwashing Basics', '10/06', '00:12:40', '00:05:12', '00:17:52', '08:17 AM', 'Media']];
const historyRows = open => [
  {kind: 'person', id: 'anna', index: 0, label: 'Anna Fischer', count: 1},
  {kind: 'course', id: 'food-safety', index: 0, label: FOOD, count: RUNS.length, plain: true, shut: !open},
  ...RUNS.map(([name, day, aging, exec, total, closed, type], i) => ({kind: 'item', id: `run-${i}`, index: i, name, state: 'Closed', by: 'Anna Fischer', triggered: `${day}/2026 08:00 AM`, open: [aging, 'green'], claimed: [exec, 'green'], duration: [total, 'gray'], closed: `${day}/2026 ${closed}`, type, position: 'Staff', folded: !open})),
  ...PEOPLE.slice(1).map(([name], i) => ({kind: 'person', id: `p${i + 1}`, index: i + 1, label: name, count: 1, open: false})),
];

export default function TrainingDataStage({state}) {
  const s = {...TRAINING_DATA_BASE, ...state}, win = useRef(null);
  useCenter(win, {focus: s.focus, pan: s.pan, scroller: s.page === 'report' ? '.sec-scroll' : '.iq-ow-rows', scrollTo: s.scrollTo});
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 760, ...(s.page === 'history' ? {width: 1620} : {})}}><div className="iq-ol-page">
      {s.page === 'list' ? <ReportsList panel={s.panel}/> : s.page === 'report' ? <Report level={s.level}/> : <OverviewBoard board="Course" view="History" groupBy="Person" tools="history" columns={HISTORY_COLUMNS} rows={historyRows(!!s.open)}/>}
    </div></div>
  </div>;
}
