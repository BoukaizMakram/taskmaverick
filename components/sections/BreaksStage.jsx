'use client';
// Meal & Rest Breaks's art for the section videos (lib/sections/meal-rest-breaks.mjs), drawn from a state given as data:
//   wall    the break board on a tablet mounted on the wall of a break area (a photograph of the room: the display everyone passes, the live tablet over the one in the photo); the next scene
//           zooms the drawing in onto the board's own tablet
//   board   the Improved Quality tablet with the break board: the breaks due (Open), who is on break (Claimed, their faces and the time running), who took theirs (Closed)
//   flow    the break that ran 35 minutes on a 30-minute break and what it raises, cards on their own: the alert to the managers, the written notice and the training to the person
//   dash    the web Team Board (the Overview, Running), its header a table of its own over the rows, the rows scrolled (`scroll`, 0 to 1)
//   report  the web report of the breaks by person (due, taken, the average duration, the ones over the limit), scrolled down (`scrollTo`)
// Each break's title is its own (a timer in the video is known by its mission's title).
import {useLayoutEffect, useRef} from 'react';
import {TabletPart, FlowPart, mission, AVATAR, FLOW, card, useCenter, clock} from './parts';
import {Icon, Sidebar, NAV, HEAD, GroupRow as ReportGroup, Pct} from '../DataReport';
import {Icon as OwIcon} from '../OverviewWorkspace';
import './meal-rest-breaks.css';

export const BREAKS_BASE = {view: 'wall', claimed: 0, time: 0, flow: 0, scroll: 0, focus: null, pan: 0, scrollTo: null};
const PEOPLE = {anna: ['Anna F', AVATAR.anna], ben: ['Ben R', AVATAR.ben], carla: ['Carla M', AVATAR.carla], dan: ['Dan K', AVATAR.dan], leo: ['Leo T', AVATAR.leo]};

// ---- the break board ----
const DAY = {date: '09-23-26'};
function breaksOf(s) {
  const later = s.time ? 900 : 0; // (the second video looks at the board later in the day: the same breaks, further on, as the dashboard has them)
  const list = [
    mission('lunch', 'Lunch Break 30 min', 'Task', 'open', {...DAY, time: '11:30 AM', ageSeconds: s.time ? 2130 : 380, openOrder: 0}),
    mission('rest', 'Rest Break 10 min', 'Task', 'open', {...DAY, time: '11:32 AM', ageSeconds: s.time ? 480 : 285, openOrder: 1}),
    mission('meal', 'Meal Break 30 min', 'Task', 'open', {...DAY, time: '11:34 AM', ageSeconds: 130 + later, openOrder: 2}),
    mission('second', 'Second Rest Break 10 min', 'Task', 'open', {...DAY, time: '11:35 AM', ageSeconds: 50 + later, openOrder: 3}),
    mission('first-meal', 'First Meal Break 30 min', 'Task', 'closed', {...DAY, time: '10:15 AM', ageSeconds: 1900, performer: PEOPLE.dan[0], performerAvatar: PEOPLE.dan[1], executionSeconds: 1760, stopped: 20}),
    mission('first-rest', 'First Rest Break 10 min', 'Task', 'closed', {...DAY, time: '09:30 AM', ageSeconds: 730, performer: PEOPLE.carla[0], performerAvatar: PEOPLE.carla[1], executionSeconds: 588, stopped: 10}),
  ];
  const claim = (id, who, started, exec) => { const m = list.find(x => x.id === id); Object.assign(m, {status: 'claimed', performer: PEOPLE[who][0], performerAvatar: PEOPLE[who][1], started, executionSeconds: exec}); };
  if (s.claimed >= 1) claim('lunch', 'anna', 100, s.time ? 2100 : 4);
  if (s.claimed >= 2) claim('rest', 'ben', 200, s.time ? 375 : 2);
  return list;
}
// What the cursor and the outlines know on the tablet besides its cards: each column (col-open, col-claimed, col-closed), and the tablet on the wall (wall-tablet).
const WALL = {x: 520.9, y: 269.8, scale: 0.22}; // (written by scripts/generate-images.mjs: over the tablet of the room's photo; 0.33 before it, "the tablet looks too big, should be smaller", the user, 2026-10-27)
function Board({s}) {
  const mark = useRef(null), wall = s.view === 'wall', missions = breaksOf(s);
  useLayoutEffect(() => {
    const root = mark.current?.parentElement?.querySelector(':scope > [data-sec-part="Tablet"]');
    root?.querySelectorAll('.mi-columns > section').forEach(sec => sec.setAttribute('data-iq-target', `col-${(sec.getAttribute('aria-label') ?? '').split(' ')[0]}`));
  });
  return <><Room zoom={!wall} missions={missions}/>{!wall && <TabletPart title="Break Board" missions={missions}/>}<span ref={mark} hidden/></>;
}

// ---- the break area: a photograph of the room (public/storyboard-art/break-room.jpg, the plate's size: meal-rest-breaks.css) and the break board's tablet on its wall ----
// The photo was made from the drawing it replaces (a wall, the floor, a clock, a door, a plant, a bench) with our Team Board on its tablet (`break-room` in scripts/generate-images.mjs), and
// WALL puts this tablet over the photo's (measured by the script): the live board covers it. On the wall the tablet is small (189 px wide: the video does not blow it up to a tablet's usual size).
// Once the board is shown, the room is pushed in by as much as the tablet grows (about the tablet: its tablet lands exactly where the board's tablet is) and faded, while the board's own tablet
// comes in at its place: the video plays it as one zoom from the wall into the board. The tablet on the wall has the board's look (the flat black frame the videos give a tablet) and no names
// (the board's tablet has them).
const PUSH = 1.1 / WALL.scale, PUSHED = `translate(${(800 - PUSH * WALL.x).toFixed(1)}px, ${(450 - PUSH * WALL.y).toFixed(1)}px) scale(${PUSH.toFixed(4)})`;
function Room({zoom, missions}) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const t = root.current?.querySelector('.adx-tablet');
    if (!t) return;
    Object.assign(t.style, {left: `${WALL.x}px`, top: `${WALL.y}px`, transform: `translate(-50%,-50%) scale(${WALL.scale})`});
    t.querySelectorAll('[data-iq-target]').forEach(e => e.removeAttribute('data-iq-target'));
    const device = t.querySelector('.tbl-tablet');
    if (!device) return;
    device.setAttribute('data-iq-target', 'wall-tablet');
    device.setAttribute('data-sb-bezel', 'paint'); device.setAttribute('data-sb-flat', ''); device.style.setProperty('--sb-bezel', 'linear-gradient(0deg, #000000 0%, #000000 100%)');
  });
  return <div ref={root} className="sec-br-room" data-sec-part="Layer"><div className="sec-br-scene" style={{opacity: zoom ? 0 : 1, transform: zoom ? PUSHED : 'translate(0px, 0px) scale(1)'}}>
    <TabletPart title="Break Board" missions={missions} name="Wall tablet"/>
  </div></div>;
}

// ---- the break that ran over, and what it raises (cards on their own) ----
const SOURCE = {kind: 'Task', points: null, title: 'Lunch Break 30 min', who: 'Anna F', avatar: AVATAR.anna, exec: '00:35:00', pill: '00:41:20', tone: 'green', date: '09-23-26', time: '11:30 AM'};
const ALERT = {kind: 'Ticket', title: 'Break Exceeded', response: 'Anna F has been on a 30-min break for 35 min.', location: 'Main Street - Front Desk', who: null, exec: null, pill: '00:00:00', tone: 'green', date: '09-23-26', time: '12:05 PM'};
const NOTICE = {kind: 'Media', points: null, title: 'Break Policy Write-Up', who: 'Anna F', avatar: AVATAR.anna, exec: null, pill: '00:00:00', tone: 'green', date: '09-23-26', time: '12:05 PM'};
const TRAINING = {kind: 'Media', points: null, title: 'Break Policy Training', who: 'Anna F', avatar: AVATAR.anna, exec: null, pill: '00:00:00', tone: 'green', date: '09-23-26', time: '12:05 PM'};
const TH = 232 * FLOW.scale, GAP = 30, LEFT = 70, RIGHT = 570, BUS = 522, MID = 450;
const elbow = (id, from, y) => ({id, d: `M${LEFT + FLOW.w + FLOW.gap} ${from} L${BUS} ${from} L${BUS} ${y} L${RIGHT - FLOW.gap} ${y}`});
// The four cards are always there (the video finds a layer's cards the same way in every state): the ones not raised yet wait in the middle of the break, small and faded (they
// leave the group's middle where it is, and their words are nowhere near an outline), and grow out of it to their place when they are raised; the group is centered again each time (FlowPart).
const RAISED = [['alert', ALERT, TH], ['notice', NOTICE, FLOW.h], ['training', TRAINING, FLOW.h]];
function flowOf(n) {
  const shown = RAISED.slice(0, n), total = shown.reduce((a, [, , h]) => a + h, 0) + GAP * Math.max(0, n - 1), chips = [card('src', LEFT, MID - FLOW.h / 2, SOURCE)], lines = [];
  let y = MID - total / 2;
  RAISED.forEach(([id, m, h], i) => {
    if (i >= n) { const k = 0.15; chips.push({id, x: LEFT + FLOW.w / 2 - (334 * k) / 2, y: MID - (h / FLOW.scale) * k / 2, mission: m, scale: k, opacity: 0}); return; }
    chips.push({id, x: RIGHT, y, mission: m, scale: FLOW.scale});
    lines.push(n === 1 ? {id: `arrow-${id}`, from: [LEFT + FLOW.w + FLOW.gap, MID], to: [RIGHT - FLOW.gap, MID]} : elbow(`arrow-${id}`, MID, y + h / 2));
    y += h + GAP;
  });
  return {chips, lines};
}

// ---- the web Team Board (Overview, Running): the breaks of every team ----
const COLUMNS = [['name', 320], ['ref', 120], ['state', 120], ['triggered', 180], ['by', 135], ['open', 115], ['claimed', 115], ['duration', 115], ['closed', 180], ['type', 100], ['position', 130]];
const LABELS = {name: 'Name', ref: 'Reference', state: 'Activity', triggered: 'Triggered at', by: 'Claimed By', open: 'Open', claimed: 'Claimed', duration: 'Duration', closed: 'Closed At', type: 'Type', position: 'Position'};
const R = (name, state, open, claimed = 0, by = '', at = '', closed = '') => ({name, state, open, claimed, by, at, closed});
const UNITS = [
  {unit: 'Main Street Location', teams: [
    {team: 'Front Desk', rows: [R('Rest Break 10 min', 'Claimed', 105, 375, 'Ben R', '11:32 AM'), R('Lunch Break 30 min', 'Claimed', 30, 2100, 'Anna F', '11:30 AM'), R('Second Rest Break 10 min', 'Open', 950, 0, '', '11:35 AM'),
      R('Meal Break 30 min', 'Open', 1030, 0, '', '11:34 AM'), R('First Meal Break 30 min', 'Closed', 140, 1760, 'Dan K', '10:15 AM', '10:47 AM'), R('First Rest Break 10 min', 'Closed', 142, 588, 'Carla M', '09:30 AM', '09:42 AM')]},
    {team: 'Kitchen', rows: [R('Kitchen Rest Break 10 min', 'Claimed', 70, 240, 'Leo T', '11:40 AM'), R('Kitchen Lunch Break 30 min', 'Open', 610, 0, '', '11:36 AM'), R('Prep Rest Break 10 min', 'Closed', 95, 560, 'Maya R', '10:05 AM', '10:16 AM'),
      R('Kitchen Meal Break 30 min', 'Closed', 200, 1690, 'Sam P', '09:50 AM', '10:22 AM')]},
  ]},
  {unit: 'Riverside Location', teams: [
    {team: 'Front Desk', rows: [R('Riverside Lunch Break 30 min', 'Claimed', 45, 820, 'Nina L', '11:25 AM'), R('Riverside Rest Break 10 min', 'Open', 330, 0, '', '11:38 AM'), R('Riverside First Rest Break 10 min', 'Closed', 80, 602, 'Omar B', '09:40 AM', '09:52 AM')]},
    {team: 'Housekeeping', rows: [R('Housekeeping Rest Break 10 min', 'Claimed', 60, 190, 'Tess W', '11:41 AM'), R('Housekeeping Lunch Break 30 min', 'Open', 420, 0, '', '11:37 AM'), R('Housekeeping Meal Break 30 min', 'Closed', 120, 1745, 'Ivan D', '10:30 AM', '11:01 AM')]},
  ]},
];
const POSITION = {'Ben R': 'FD Staff', 'Anna F': 'FD Staff', 'Dan K': 'FD Lead', 'Carla M': 'FD Staff', 'Leo T': 'Cook', 'Maya R': 'Prep Cook', 'Sam P': 'Cook', 'Nina L': 'FD Staff', 'Omar B': 'FD Staff', 'Tess W': 'Housekeeper', 'Ivan D': 'Housekeeper'};
const LIMIT = name => (/10 min/.test(name) ? 600 : 1800); // (a break's own length: the claimed time past it is red, the rest of the board's timers green)
const Timer = ({seconds, kind, frozen, over}) => <span className={`ow-timer ${kind === 'duration' ? (frozen ? 'is-gray' : 'is-outline') : over ? 'is-red' : 'is-green'}`}>{clock(seconds)}</span>;
const Rail = () => <span className="iq-ow-rail" aria-hidden="true"/>;
function MissionRow({row, index, rail}) {
  const closed = row.state === 'Closed', cell = {
    name: <div className="ow-name-content">{rail && <Rail/>}<span className="ow-tree"/><span className="ow-number">{index + 1}.</span><span className="ow-mission-name">{row.name}</span><span className="ow-dots">⋮</span></div>,
    ref: '', state: <span className={`ow-state state-${row.state.toLowerCase()}`}><i/>{row.state}</span>, triggered: `09/23/2026 ${row.at}`, by: row.by,
    open: <Timer seconds={row.open}/>, claimed: row.claimed ? <Timer seconds={row.claimed} over={row.state === 'Claimed' && row.claimed > LIMIT(row.name)}/> : null,
    duration: <Timer seconds={row.open + row.claimed} kind="duration" frozen={closed}/>, closed: row.closed ? `09/23/2026 ${row.closed}` : '', type: 'Task',
    position: row.by ? <span className="ow-position">{POSITION[row.by]}</span> : null,
  };
  return <tr className="ow-data-row">{COLUMNS.map(([key]) => <td key={key} className={key === 'name' ? 'ow-name-cell' : ['open', 'claimed', 'duration'].includes(key) ? 'ow-timer-cell' : ''}>{cell[key]}</td>)}</tr>;
}
function GroupRow({label, index, count, rows, nested, last}) {
  const total = state => rows.filter(r => r.state === state).length;
  return <tr className={`ow-group-row${nested ? ' is-nested' : ''}`}>{COLUMNS.map(([key]) => <td key={key} className={key === 'name' ? 'ow-name-cell' : ['open', 'claimed', 'duration', 'closed'].includes(key) ? 'iq-ow-center' : ''}>{key === 'name'
    ? <span className="ow-group-button">{nested && <span className={`iq-ow-branch${last ? ' is-last' : ''}`} aria-hidden="true"/>}<span className="ow-collapse-icon"><OwIcon name="chevron"/></span><span className="ow-number">{index + 1}.</span><span className="ow-group-label">{label}</span><span className="ow-count">{count}</span></span>
    : ['open', 'claimed', 'closed'].includes(key) ? <span className="ow-total">{total({open: 'Open', claimed: 'Claimed', closed: 'Closed'}[key])}</span> : null}</td>)}</tr>;
}
const Svg = ({d, className = 'ow-icon'}) => <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const TOOL = {filter: 'M4 5h16l-6 7.5V18l-4 2v-7.5z', list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01', tree: 'M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4M7 12h8M7 11l8-5M7 13l8 5', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0', cloud: 'M7.5 18H7a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.4 1.46A3.75 3.75 0 0 1 17 18h-.5M12 11v10m-3-3 3 3 3-3', sort: 'M12 4v16m-5-5 5 5 5-5', gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2'};
const BulkIcon = () => <svg className="ow-icon iq-ow-bulk" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="currentColor"/><path d="m7.5 12.5 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const OW_NAV = ['Missions', 'People', 'Teams', 'Units', 'Ticket Boards', 'Groups', 'Certifications', 'Timesheets', 'Reports', 'Dashboards', 'Overview'];
function Dashboard({s}) {
  const rows = useRef(null), width = COLUMNS.reduce((sum, [, w]) => sum + w, 0);
  useLayoutEffect(() => { const el = rows.current; if (el) el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight) * s.scroll; });
  const cols = <colgroup>{COLUMNS.map(([key, w]) => <col key={key} style={{width: w}}/>)}</colgroup>;
  return <div className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 760}}><div className="iq-ol-page">
      <div className="ow-workspace iq-ow" aria-label="Taskmaverick Overview">
        <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span><nav>{OW_NAV.map(n => <span key={n} className={n === 'Overview' ? 'is-active' : undefined}>{n}</span>)}</nav><div className="ow-account"><span className="ow-icon-button"><OwIcon name="bell"/></span><span className="ow-icon-button"><Svg d={TOOL.gear}/></span><span className="ow-avatar">JM</span></div></header>
        <div className="ow-subnav"><nav>{['Team Board', 'Personal Board', 'Unit Ticket Board', 'Organization Ticket Board', 'Process', 'Course', 'Certification'].map(n => <span key={n} className={n === 'Team Board' ? 'is-active' : undefined}>{n}</span>)}</nav><nav className="ow-view-nav">{['History', 'Running', 'Scheduled', 'Timeline'].map(n => <span key={n} className={n === 'Running' ? 'is-active' : undefined}>{n}</span>)}</nav></div>
        <div className="ow-toolbar">
          <span className="ow-tool"><BulkIcon/>Bulk Action<OwIcon name="chevron"/></span>
          <span className="ow-tool iq-ow-filter"><Svg d={TOOL.filter}/>Filter: New Filter</span>
          <span className="ow-tool iq-ow-group"><Svg d={TOOL.list}/>Group by: Unit</span>
          <span className="ow-tool"><Svg d={TOOL.tree}/>Expand/Collapse</span>
          <span className="ow-tool"><Svg d={TOOL.eye}/>Hide/Show Column</span>
          <span className="ow-tool"><Svg d={TOOL.cloud}/>Export</span>
          <label className="ow-check"><input type="checkbox" readOnly checked={false}/>Only Boosted</label>
        </div>
        <div className="ow-table-scroll">
          <table className="ow-table iq-ow-head" style={{width}}>{cols}<thead><tr>{COLUMNS.map(([key]) => <th key={key} className={key === 'name' ? 'ow-name-cell' : ''} data-iq-col={key}><div><span>{LABELS[key]}</span>{key === 'triggered' && <Svg className="iq-ow-sort" d={TOOL.sort}/>}{key !== 'closed' && <span className="ow-dots">⋮</span>}</div></th>)}</tr></thead></table>
          <div className="iq-ow-rows" ref={rows} data-iq-target="dash-rows"><table className="ow-table" style={{width}}>{cols}<tbody>
            {UNITS.map((u, ui) => { const all = u.teams.flatMap(t => t.rows); return [<GroupRow key={u.unit} label={u.unit} index={ui} count={u.teams.length} rows={all}/>,
              ...u.teams.flatMap((t, ti) => { const last = ti === u.teams.length - 1; return [<GroupRow key={`${u.unit}-${t.team}`} nested last={last} label={t.team} index={ti} count={t.rows.length} rows={t.rows}/>, ...t.rows.map((r, ri) => <MissionRow key={r.name} row={r} index={ri} rail={!last}/>)]; })]; })}
          </tbody></table></div>
        </div>
      </div>
    </div></div>
  </div>;
}

// ---- the web report: the breaks by person (the Data Board's report, as Reporting & AI has it: Posted, Closed, Closed % for each person and each of their breaks) ----
const ROSTER = [['anna', 'Anna F', 'FD Staff', [['Lunch Break 30 min', 5, 5], ['Rest Break 10 min', 10, 10]]], ['ben', 'Ben R', 'FD Staff', [['Lunch Break 30 min', 5, 5], ['Rest Break 10 min', 10, 10]]],
  ['carla', 'Carla M', 'FD Staff', [['Lunch Break 30 min', 5, 5], ['Rest Break 10 min', 10, 9]]], ['dan', 'Dan K', 'FD Lead', [['Meal Break 30 min', 5, 5], ['Rest Break 10 min', 10, 10]]],
  ['leo', 'Leo T', 'Cook', [['Meal Break 30 min', 5, 5], ['Rest Break 10 min', 10, 10]]], ['maya', 'Maya R', 'Prep Cook', [['Meal Break 30 min', 5, 4], ['Rest Break 10 min', 10, 10]]],
  ['sam', 'Sam P', 'Cook', [['Meal Break 30 min', 5, 5], ['Rest Break 10 min', 10, 10]]], ['nina', 'Nina L', 'FD Staff', [['Lunch Break 30 min', 5, 5], ['Rest Break 10 min', 10, 10]]],
  ['omar', 'Omar B', 'FD Staff', [['Lunch Break 30 min', 5, 5], ['Rest Break 10 min', 10, 10]]], ['tess', 'Tess W', 'Housekeeper', [['Lunch Break 30 min', 5, 5], ['Rest Break 10 min', 10, 10]]]];
function Report({s}) {
  const win = useRef(null);
  useCenter(win, {focus: s.focus, pan: s.pan, scroller: '.sec-br-scroll', scrollTo: s.scrollTo});
  const sum = (list, i) => list.reduce((a, r) => a + r[i], 0);
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 760}}><div className="iq-ol-page">
      <div className="iq-ur iq-dr" aria-label="Taskmaverick web: Break Compliance">
        <header className="iq-ur-topbar"><img src="/logo.svg" alt="taskmaverick"/><nav>{NAV.map(n => <span key={n} className={n === 'Reports' ? 'is-active' : undefined}>{n}</span>)}</nav><div><Icon name="bell"/><Icon name="gear"/><span className="iq-ur-avatar">JM</span></div></header>
        <div className="iq-ur-page"><Sidebar/>
          <main className="iq-ur-main">
            <div className="iq-ur-head"><b>Break Compliance</b><span className="iq-ur-link">Show Details</span><span className="iq-ur-range iq-dr-hours"><Icon name="clock"/>12 AM - 12 AM</span><span className="iq-ur-range iq-dr-range">09/22/2026 – 09/28/2026<Icon name="chev"/></span><span className="iq-ur-btn iq-dr-btn-muted">Update Default View</span><span className="iq-ur-btn is-primary">Save To My View</span></div>
            <div className="iq-ur-tools"><span><Icon name="view" className="iq-ur-ic is-blue"/>My View:Default</span><span><Icon name="group"/>Group by: Person</span><span><Icon name="expand"/>Expand/Collapse</span><span className="iq-ur-gallery"><i className="iq-ur-checkbox"/>Daily Distribution</span><span className="iq-ur-icons"><Icon name="gear"/><Icon name="cloud"/><Icon name="mail"/><Icon name="sync"/></span></div>
            <div className="iq-ur-summary"><span>Total Closed: 147 of 150 / 98%</span><span className="iq-ur-pill is-active"><i><Icon name="team"/></i>Team <b>147 of 150</b></span><span className="iq-ur-pill"><i><Icon name="person"/></i>Personal <b>0 of 0</b></span></div>
            <div className="iq-dr-table sec-table">
              <div className="iq-dr-row is-head">{HEAD.map(h => <span key={h}>{h}<Icon name="dots"/></span>)}</div>
              <div className="sec-br-scroll sec-scroll"><div className="iq-dr-body">
                {ROSTER.map(([id, name, position, breaks], i) => <div key={id} className="sec-block" data-iq-target={`person-${id}`}>
                  <ReportGroup depth={0} index={i + 1} label={name} count={breaks.length} posted={sum(breaks, 1)} closed={sum(breaks, 2)} pct={(sum(breaks, 2) / sum(breaks, 1)) * 100} position={position}/>
                  {breaks.map(([label, posted, closed], k) => <div key={label} className="iq-dr-row is-mission"><span><i className="iq-dr-branch"/><em>{k + 1}.</em><b>{label}</b><small>1</small></span><span/><span className="is-num">{posted}</span><span className="is-num">{closed}</span><span><Pct pct={(closed / posted) * 100}/></span><span/><span>Task</span><span>Breaks</span><span/><span/></div>)}
                </div>)}
              </div></div>
            </div>
          </main>
        </div>
      </div>
    </div></div>
  </div>;
}

export default function BreaksStage({state}) {
  const s = {...BREAKS_BASE, ...state};
  if (s.view === 'flow') { const f = flowOf(s.flow); return <FlowPart chips={f.chips} lines={f.lines}/>; }
  if (s.view === 'dash') return <Dashboard s={s}/>;
  if (s.view === 'report') return <Report s={s}/>;
  return <Board s={s}/>;
}
