'use client';
// Live Monitoring's art for the section videos (lib/sections/live-monitoring.mjs): the web app's Overview › Course board (the product's screen, the user's screenshot 34-overview-course): grouped by
// person, each person's course (● Pending) and its lessons (● Open / Claimed / Closed) with their timers (Open, Claimed, Duration, Closed At), the Type and the Position. The window shows 1110 px of
// the 1620 px page, centered on what is outlined (`useCenter`); a video shows the whole page with the words under it. A lesson that has waited too long has its Open timer red (aging); the alert it
// raises is shown OUTSIDE the product window, as the product's own cards on their own (`alert` 1: the lesson's mission card with its red Timer; 2: the Performance Delays ticket popping out of it),
// as Exception Management shows its alerts.
// `OverviewBoard` is the Overview's board itself, given its rows as data, in the views the product has (screenshots 10, 18, 19, 34, 41): Running or History, the Course board (Cancel Course) or
// the Team / Personal Board (Bulk Action, Only Boosted); Mass Broadcasting draws its Personal Board of announcements with it, Data & AI the Course board's History.
import {useRef} from 'react';
import {useCenter, FlowPart, card, across} from './parts';
import {Icon} from '../OverviewWorkspace';
import './live-monitoring.css';

const NAV = ['Missions', 'People', 'Teams', 'Units', 'Ticket Boards', 'Groups', 'Certifications', 'Timesheets', 'Reports', 'Dashboards', 'Overview'];
const BOARDS = ['Team Board', 'Personal Board', 'Unit Ticket Board', 'Organization Ticket Board', 'Process', 'Course', 'Certification'];
const LABELS = {name: 'Name', ref: 'Reference', state: 'Activity', triggered: 'Triggered at', by: 'Claimed By', open: 'Open', claimed: 'Claimed', duration: 'Duration', closed: 'Closed At', type: 'Type', position: 'Position'};
const HISTORY_LABELS = {...LABELS, triggered: 'Opened At', by: 'Closed By'}; // (the History view's own names: screenshots 10, 41)
const NO_MENU = ['closed', 'position'];
const P = {
  filter: 'M4 5h16l-6 7.5V18l-4 2v-7.5z', list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  tree: 'M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4M7 12h8M7 11l8-5M7 13l8 5',
  cloud: 'M7.5 18H7a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.4 1.46A3.75 3.75 0 0 1 17 18h-.5M12 11v10m-3-3 3 3 3-3', sort: 'M12 4v16m-5-5 5 5 5-5',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2', down: 'm6 9 6 6 6-6',
};
const Svg = ({d, className = 'ow-icon'}) => <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={P[d]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Ticked = () => <svg className="ow-icon iq-ow-bulk" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="currentColor"/><path d="m7.5 12.5 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Dash = () => <span className="sec-lm-dash">-</span>;
const Toggle = ({open = true, target}) => <span className={`ow-collapse-icon${open ? '' : ' sec-lm-shut'}`} data-iq-target={target}><Icon name="chevron"/></span>; // (closed: outlined, pointing right, as the product draws a folded group: screenshot 36)

// ---- a timer: [text, tone] ('green' | 'red' | 'outline' | 'gray'); a running one ticks in the video (the row's state says which run: the timer rules) ----
const Timer = ({t, target}) => (t ? <span className={`ow-timer is-${t[1] ?? 'green'}`} data-iq-target={target}>{t[0]}</span> : <Dash/>);
const total = n => (n == null ? <Dash/> : <span className="ow-total">{n}</span>);
// A row that folds (a group closed: its rows are in the page, folded to nothing, so the page MOVES when the group opens): each cell's content is in a box whose height goes to 0.
const ROW_H = 41;
const Fold = ({folded, children, center}) => (folded == null ? children : <div className={`sec-lm-cell${center ? ' is-center' : ''}`} style={{height: folded ? 0 : ROW_H, opacity: folded ? 0 : 1}}>{children}</div>);
const foldTd = folded => (folded == null ? undefined : {borderBottomWidth: folded ? 0 : 1});

// ---- the rows (a flat list, in order) ----
//   {kind: 'person', id, label, index, count, totals: {open, claimed, closed}, open}            a person (the group): the totals of their lessons, orange (none in History: dashes)
//   {kind: 'course', id, label, index, count, state, triggered, open, claimed, duration, plain, shut}   a course under them (a group of its own, with its timers; `plain`: dashes, as History has it)
//   {kind: 'item', id, name, index, state, triggered, by, open, claimed, duration, closed, type, position, shallow, rail, folded}   a lesson (or a mission right under the person: `shallow`)
function PersonRow({row, columns}) {
  return <tr className="ow-group-row" data-sec-row={row.id}>{columns.map(([key]) => <td key={key} className={key === 'name' ? 'ow-name-cell' : 'iq-ow-center'}>
    {key === 'name' ? <span className="ow-group-button" data-iq-target={`person-${row.id}`}><Toggle open={row.open !== false}/><span className="ow-number">{row.index + 1}.</span><span className="ow-group-label">{row.label}</span><span className="ow-count">{row.count}</span></span>
      : row.totals && ['open', 'claimed', 'closed'].includes(key) && row.totals[key] != null ? total(row.totals[key]) : <Dash/>}
  </td>)}</tr>;
}
function CourseRow({row, columns}) {
  const cell = row.plain ? {} : {
    state: <span className={`ow-state ${row.state === 'Closed' ? 'state-closed' : 'state-open sec-lm-pending'}`}><i/>{row.state}</span>, // (a Pending course runs like an Open mission: its timers tick)
    triggered: row.triggered, open: <Timer t={row.open}/>, claimed: total(row.claimed ?? 0), duration: <Timer t={row.duration}/>, closed: row.closedAt ?? <Dash/>, type: 'Course',
  };
  cell.name = <span className="ow-group-button"><span className={`iq-ow-branch${row.last === false ? '' : ' is-last'}`} aria-hidden="true"/><Toggle open={!row.shut} target={`toggle-course-${row.id}`}/><span className="ow-number">{row.index + 1}.</span><span className={`ow-group-label${row.plain ? '' : ' ow-mission-name'}`} data-iq-target={`course-${row.id}`}>{row.label}</span><span className="ow-count">{row.count}</span><span className="ow-dots">⋮</span></span>;
  return <tr className="ow-group-row is-nested sec-lm-course" data-sec-row={row.id}>{columns.map(([key]) => <td key={key} className={key === 'name' ? 'ow-name-cell' : 'iq-ow-center'}>{cell[key] ?? <Dash/>}</td>)}</tr>;
}
function ItemRow({row, columns}) {
  const cell = {
    name: <div className="ow-name-content">{row.rail && <span className="iq-ow-rail" aria-hidden="true"/>}<span className="ow-tree"/><span className="ow-number">{row.index + 1}.</span><span className="ow-mission-name" data-iq-target={`item-${row.id}`}>{row.name}</span><span className="ow-dots">⋮</span></div>,
    ref: <Dash/>, state: <span className={`ow-state state-${row.state.toLowerCase()}`}><i/>{row.state}</span>, triggered: row.triggered, by: row.by ?? <Dash/>,
    open: <Timer t={row.open} target={row.openTarget}/>, claimed: <Timer t={row.claimed}/>, duration: <Timer t={row.duration}/>, closed: row.closed ?? <Dash/>, type: row.type,
    position: row.position ? <span className="ow-position">{row.position}</span> : <Dash/>,
  };
  return <tr className={`ow-data-row${row.shallow ? ' sec-lm-shallow' : ''}${row.folded != null ? ' sec-lm-fold' : ''}`} data-sec-row={row.id}>{columns.map(([key]) => <td key={key} style={foldTd(row.folded)} className={key === 'name' ? 'ow-name-cell' : ['open', 'claimed', 'duration'].includes(key) ? 'ow-timer-cell' : 'iq-ow-center'}><Fold folded={row.folded} center={key !== 'name'}>{cell[key]}</Fold></td>)}</tr>;
}

// ---- the board: the top bar, the boards and views, the toolbar, the header (its own table, always seen) and the rows (they scroll under it) ----
// `tools`: 'course' (Cancel Course: the Course board, screenshot 34), 'running' (Bulk Action ▾ … Only Boosted: the Team / Personal Board's Running view), 'history' (no first tool, the dates at the right)
export function OverviewBoard({board = 'Course', view = 'Running', groupBy = 'Person', columns, rows, tools = 'course', range = '10/01/2026 – 10/20/2026'}) {
  const width = columns.reduce((sum, [, w]) => sum + w, 0), labels = view === 'History' ? HISTORY_LABELS : LABELS;
  const views = board === 'Course' ? ['History', 'Running', 'Scheduled'] : ['History', 'Running', 'Scheduled', 'Timeline'];
  const cols = <colgroup>{columns.map(([key, w]) => <col key={key} style={{width: w}}/>)}</colgroup>;
  return <div className="ow-workspace iq-ow sec-lm" aria-label="Taskmaverick Overview">
    <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span><nav>{NAV.map(n => <span key={n} className={n === 'Overview' ? 'is-active' : undefined}>{n}</span>)}</nav><div className="ow-account"><span className="ow-icon-button"><Icon name="bell"/></span><span className="ow-icon-button"><Svg d="gear"/></span><span className="ow-avatar">JM</span></div></header>
    <div className="ow-subnav"><nav>{BOARDS.map(n => <span key={n} className={n === board ? 'is-active' : undefined}>{n}</span>)}</nav><nav className="ow-view-nav">{views.map(n => <span key={n} className={n === view ? 'is-active' : undefined}>{n}</span>)}</nav></div>
    <div className="ow-toolbar">
      {tools === 'course' && <span className="ow-tool"><Ticked/>Cancel Course</span>}
      {tools === 'running' && <span className="ow-tool"><Ticked/>Bulk Action<Svg d="down"/></span>}
      <span className={`ow-tool iq-ow-filter${tools === 'history' ? ' sec-lm-first' : ''}`}><Svg d="filter"/>Filter: New Filter</span>
      <span className="ow-tool iq-ow-group"><Svg d="list"/>Group by: {groupBy}</span>
      <span className="ow-tool"><Svg d="tree"/>Expand/Collapse</span>
      <span className="ow-tool"><Svg d="eye"/>Hide/Show Column</span>
      <span className="ow-tool"><Svg d="cloud"/>Export</span>
      {tools === 'running' && <label className="ow-check"><input type="checkbox" readOnly checked={false}/>Only Boosted</label>}
      {tools === 'history' && <span className="sec-lm-range">{range}<Svg d="down"/></span>}
    </div>
    <div className="ow-table-scroll">
      <table className="ow-table iq-ow-head" style={{width}}>{cols}
        <thead><tr>{columns.map(([key]) => <th key={key} className={key === 'name' ? 'ow-name-cell' : ''} data-iq-col={key}><div><span>{labels[key]}</span>{key === 'triggered' && <Svg d="sort" className="iq-ow-sort"/>}{!NO_MENU.includes(key) && <span className="ow-dots">⋮</span>}</div></th>)}</tr></thead>
      </table>
      <div className="iq-ow-rows"><table className="ow-table" style={{width}}>{cols}
        <tbody>{rows.map(row => (row.kind === 'person' ? <PersonRow key={row.id} row={row} columns={columns}/> : row.kind === 'course' ? <CourseRow key={row.id} row={row} columns={columns}/> : <ItemRow key={row.id} row={row} columns={columns}/>))}</tbody>
      </table></div>
    </div>
  </div>;
}

// ---- Live Monitoring's course board ----
export const MONITORING_BASE = {focus: null, pan: 0, scrollTo: null, alert: 0};
const COLUMNS = [['name', 380], ['ref', 120], ['state', 125], ['triggered', 185], ['open', 120], ['claimed', 120], ['duration', 125], ['closed', 185], ['type', 120], ['position', 140]]; // (1620: Position runs past the page's edge, as in the product)
const DAY = '10/20/2026';
const at = time => `${DAY} ${time}`;
const g = t => [t, 'green'], o = t => [t, 'outline'], gr = t => [t, 'gray'];
const person = (id, index, label, open, claimed) => ({kind: 'person', id, index, label, count: 1, totals: {open, claimed}});
const course = (id, label, count, state, time, open, claimed, duration) => ({kind: 'course', id, index: 0, label, count, state, triggered: at(time), open, claimed, duration});
const lesson = (id, index, name, state, time, type, timers, closed = null) => ({kind: 'item', id, index, name, state, triggered: at(time), type, position: 'Staff', closed: closed && at(closed), ...timers});
export const MONITORING_ROWS = [
  person('anna', 0, 'Anna Fischer', 1, 1),
  course('food-safety', 'Food Safety Course', 3, 'Pending', '08:05 AM', g('00:31:40'), 1, o('00:31:40')),
  lesson('handwashing', 0, 'Handwashing Basics', 'Closed', '08:05 AM', 'Media', {open: g('00:04:12'), claimed: g('00:09:30'), duration: gr('00:13:42')}, '08:18 AM'),
  lesson('allergens', 1, 'Allergen Awareness', 'Claimed', '08:05 AM', 'Media', {open: g('00:15:05'), claimed: g('00:08:21'), duration: o('00:23:26')}),
  lesson('storage', 2, 'Safe Food Storage', 'Open', '08:05 AM', 'Test', {open: g('00:31:40'), duration: o('00:31:40')}),
  person('ben', 1, 'Ben Rivera', 0, 1),
  course('service', 'Customer Service Course', 3, 'Pending', '07:40 AM', g('00:56:15'), 1, o('00:56:15')),
  lesson('greeting', 0, 'Greeting Guests', 'Closed', '07:40 AM', 'Media', {open: g('00:03:05'), claimed: g('00:07:44'), duration: gr('00:10:49')}, '07:50 AM'),
  lesson('complaints', 1, 'Handling Complaints', 'Closed', '07:40 AM', 'Media', {open: g('00:12:20'), claimed: g('00:11:02'), duration: gr('00:23:22')}, '08:03 AM'),
  lesson('upselling', 2, 'Upselling With Care', 'Claimed', '07:40 AM', 'Test', {open: g('00:24:31'), claimed: g('00:05:12'), duration: o('00:29:43')}),
  person('carla', 2, 'Carla Mendes', 1, 0),
  course('opening', 'Opening Procedures Course', 2, 'Pending', '06:10 AM', g('02:26:15'), 0, o('02:26:15')),
  lesson('unlocking', 0, 'Unlocking The Store', 'Closed', '06:10 AM', 'Media', {open: g('00:05:40'), claimed: g('00:06:18'), duration: gr('00:11:58')}, '06:22 AM'),
  {...lesson('cash-drawer', 1, 'Cash Drawer Setup', 'Open', '06:10 AM', 'Test', {open: ['02:26:15', 'red'], duration: o('02:26:15')}), openTarget: 'aged-timer'}, // (it has waited too long: its Open timer is red, the alert's cause)
  person('leo', 3, 'Leo Tran', 2, 0),
  course('safety', 'Workplace Safety Course', 2, 'Pending', '08:33 AM', g('00:03:25'), 0, o('00:03:25')),
  lesson('lifting', 0, 'Lifting Safely', 'Open', '08:33 AM', 'Media', {open: g('00:03:25'), duration: o('00:03:25')}),
  lesson('fire-exits', 1, 'Fire Exit Drill', 'Open', '08:33 AM', 'Task', {open: g('00:03:25'), duration: o('00:03:25')}),
  person('dan', 4, 'Dan Kowalski', 0, 0),
  {...course('closing', 'Closing Procedures Course', 2, 'Closed', '05:30 AM', g('00:02:10'), 0, gr('00:24:35')), closedAt: at('05:55 AM')},
  lesson('closing-review', 0, 'Closing Checklist Review', 'Closed', '05:30 AM', 'Media', {open: g('00:02:10'), claimed: g('00:09:05'), duration: gr('00:11:15')}, '05:41 AM'),
  lesson('cash-count', 1, 'Cash Count And Deposit', 'Closed', '05:30 AM', 'Test', {open: g('00:12:05'), claimed: g('00:12:30'), duration: gr('00:24:35')}, '05:55 AM'),
];

// ---- the alert, outside the product window: the lesson's mission card (its Timer red: it has waited too long), then the Performance Delays ticket popping out of it ----
const LESSON_CARD = {kind: 'Test', points: null, title: 'Cash Drawer Setup', who: null, exec: null, pill: '02:26:15', tone: 'red', date: '10-20-26', time: '06:10 AM'};
const TICKET = {kind: 'Ticket', title: 'Performance Delays', response: 'Cash Drawer Setup has been open for too long.', location: 'Main Street - Training', who: null, exec: null, pill: '00:00:00', tone: 'green', date: '10-20-26', time: '08:36 AM'};
function Alert({step}) {
  const left = 70, right = 570, mid = 360, a = {x: left, y: mid}, b = {x: right, y: mid};
  const chips = [card('lesson-card', left, mid, LESSON_CARD)], lines = [];
  if (step >= 2) { lines.push(across('alert-arrow', a, b)); chips.push(card('ticket', right, mid, TICKET)); }
  return <FlowPart chips={chips} lines={lines}/>;
}

export default function MonitoringStage({state}) {
  const s = {...MONITORING_BASE, ...state}, win = useRef(null);
  useCenter(win, {focus: s.focus, pan: s.pan, scroller: '.iq-ow-rows', scrollTo: s.scrollTo});
  if (s.alert) return <Alert step={s.alert}/>;
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 760, width: 1620}}>
      <div className="iq-ol-page"><OverviewBoard board="Course" groupBy="Person" columns={COLUMNS} rows={MONITORING_ROWS}/></div>
    </div>
  </div>;
}
