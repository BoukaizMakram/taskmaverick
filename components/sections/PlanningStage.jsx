'use client';
// Precision Planning's art for the section videos (lib/sections/precision-planning.mjs): the web app's Overview, Personal Board, Timeline view, as the product draws it (the user, 2026-10-19:
// "look exactly like the UI I sent"): the top bar, the boards and their views, the toolbar (12 AM - 12 AM, 1D) and the table: Name, Positions and the 24 hours of the day. The locations (units),
// a location opened to its teams (each team's missions in each hour, orange), a team opened to its missions (a position each, a count in each hour it occurs) and the box that sums up a
// mission's schedule. Every row is always in the page and what is closed is folded to nothing (`Reveal`), so the page moves from one state to the next: rows fold open, the list scrolls.
// The page is 1600 wide (the real proportions): the 1110 window of the slides pans over it to what is talked about; a video shows all of it across the picture with the words under it
// (the CEO, 2026-10-16: `boardLayout` in components/storyboardPlayerDom.js).
import {useMemo, useRef} from 'react';
import {useCenter} from './parts';
import {NAV} from '../DataReport';
import {BOARDS, VIEWS} from '@/lib/overviewModel.mjs';
import {DEFAULTS} from '@/lib/sections/liveData.mjs';

export const PLANNING_BASE = {focus: null, unit: false, ops: false, kitchen: false, boxes: [], scrollTo: null, pan: 0};
const HOURS = Array.from({length: 24}, (_, h) => h);
const hourLabel = h => [`${String(h % 12 || 12).padStart(2, '0')}:00`, h < 12 ? 'AM' : 'PM'];
const timeOf = h => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
const cells = hours => HOURS.map(h => hours.filter(x => x === h).length);
const sum = lists => HOURS.map(h => lists.reduce((n, l) => n + l[h], 0));

// What is scheduled, by the hours of the day (a mission) and what that makes for its team: the section's data (lib/sections/liveData.mjs; the board's own unless the AI demo call
// draws it with the visitor's). The first two teams have their missions listed (and counted); the others have a count and a workload of their own.
const teamsOf = data => data.teams.map(t => {
  const missions = (t.missions ?? []).map(m => [m.id, m]);
  return {...t, missions, count: t.missions ? missions.length : t.count, perHour: missions.length ? sum(missions.map(([, m]) => cells(m.hours))) : cells(t.hours ?? [])};
});

// ---- the product's icons ----
const P = {
  bell: 'M18 8.5a6 6 0 0 0-12 0v5.2L4.4 16.5h15.2L18 13.7zM9.8 19.2a2.3 2.3 0 0 0 4.4 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  down: 'm6 9 6 6 6-6',
  left: 'm14.5 6-6 6 6 6',
  right: 'm9.5 6 6 6-6 6',
  funnel: 'M4 5h16l-6.3 7.2v5.3l-3.4 2v-7.3z',
  list: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  tree: 'M2.5 10.2h4.2v4.2H2.5zM15.8 3h4.2v4.2h-4.2zM15.8 10.2h4.2v4.2h-4.2zM15.8 17.4h4.2v4.2h-4.2zM6.7 12.3h4.6M11.3 5.1v14.4M11.3 5.1h4.5M11.3 19.5h4.5M11.3 12.3h4.5',
  cloud: 'M7.5 17.5H7a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.4 10a3.6 3.6 0 0 1-.9 7.1M12 12.5v8.5M9 18l3 3 3-3',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 6.8V12h5.2',
  sort: 'M12 19.5v-15M6.5 10l5.5-5.5 5.5 5.5',
  calendar: 'M4 5.5h16v15H4zM8 3v5M16 3v5M4 10h16',
};
const Svg = ({d, className, sw = 1.7}) => <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={P[d]} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Kebab = () => <svg className="sec-pl-kebab" viewBox="0 0 6 20" aria-hidden="true"><circle cx="3" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/></svg>;
const Plane = () => <i className="sec-pl-bulk" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18.5 5.5 4.8 11l5 1.9 1.9 5z" fill="#fff"/><path d="m9.8 12.9 8.7-7.4" stroke="#1271b7" strokeWidth="1.3" strokeLinecap="round"/></svg></i>;
const Clip = () => <svg className="sec-pl-clip" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.2 4.6v9.6c0 .5.4.9.9.9h7.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 .9h5.3L13.8 4.4v8.1c0 .5-.4.9-.9.9H5.9c-.5 0-.9-.4-.9-.9z" fill="currentColor"/><path d="M10.1 1v3.6h3.6" fill="none" stroke="#fff" strokeWidth=".9" strokeLinejoin="round"/></svg>;
const Toggle = ({open}) => <span className={`sec-pl-toggle${open ? '' : ' is-closed'}`} aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m4.2 6.2 3.8 3.8 3.8-3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;

// ---- the tree's lines: the middle of a level-1 toggle, of a level-2 toggle, and where a branch ends ----
const X1 = 20, X2 = 37, END2 = 29, END3 = 52;
const Lines = ({pipes = [], elbow, down}) => <>
  {pipes.map(x => <i key={x} className="sec-pl-pipe" style={{left: x}}/>)}
  {elbow && <i className="sec-pl-elbow" style={{left: elbow[0], width: elbow[1] - elbow[0]}}/>}
  {down != null && <i className="sec-pl-down" style={{left: down}}/>}
</>;
const Reveal = ({open, children}) => <div className="iq2-reveal" style={{gridTemplateRows: `${open ? 1 : 0}fr`, opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden'}}><div>{children}</div></div>;
const Block = ({id, children}) => <div data-iq-target={id} className="sec-block">{children}</div>;
const count = n => (n ? <b>{n}</b> : <small>0</small>);

function UnitRow({index, name, teams, open = false, id}) {
  return <div className={`sec-pl-row is-unit${open ? ' is-open' : ''}`} data-iq-target={id}>
    <span className="sec-pl-name"><Lines down={X1}/><Toggle open={open}/><em>{index}.</em><b>{name}</b><small>{teams}</small></span>
    <span className="sec-pl-pos"/>
    <span className="sec-pl-hours" data-iq-target={id ? `${id}-hours` : undefined}>{HOURS.map(h => <i key={h}/>)}</span>
  </div>;
}
function TeamRow({index, team, open, last}) {
  return <div className={`sec-pl-row is-team${open ? ' is-open' : ''}`} data-iq-target={`row-${team.id}`}>
    <span className="sec-pl-name"><Lines pipes={last ? [] : [X1]} elbow={[X1, END2]} down={X2}/><Toggle open={open}/><em>{index}.</em><b>{team.name}</b><small>{team.count}</small><Clip/></span>
    <span className="sec-pl-pos"/>
    <span className="sec-pl-hours" data-iq-target={`row-${team.id}-hours`}>{team.perHour.map((n, h) => <i key={h}>{count(n)}</i>)}</span>
  </div>;
}
// a mission: its row (the cursor presses the count of its first hour) and the box that sums up its schedule
function Mission({index, id, m, open, lastTeam, last}) {
  const pipes = [...(lastTeam ? [] : [X1]), ...(last ? [] : [X2])];
  return <Block id={`block-${id}`}>
    <div className="sec-pl-row is-mission" data-iq-target={`mission-${id}`}>
      <span className="sec-pl-name"><Lines pipes={pipes} elbow={[X2, END3]}/><em>{index}.</em><span className="sec-pl-title">{m.name}</span><Kebab/></span>
      <span className="sec-pl-pos"><i className="sec-pl-tag">{m.position}</i></span>
      <span className="sec-pl-hours">{cells(m.hours).map((n, h) => <i key={h} data-iq-target={h === m.hours[0] ? `badge-${id}` : undefined}>{count(n)}</i>)}</span>
    </div>
    <Reveal open={open}><div className="sec-pl-boxrow"><Lines pipes={pipes}/>
      <div className="sec-pl-box" data-iq-target={`box-${id}`}><Svg d="calendar"/><b>{m.name}</b><span>{m.rule}</span><em>{m.hours.map(h => <i key={h}>{timeOf(h)}</i>)}</em></div>
    </div></Reveal>
  </Block>;
}

export default function PlanningStage({state, data = DEFAULTS['precision-planning']}) {
  const s = {...PLANNING_BASE, ...state}, win = useRef(null);
  const TEAMS = useMemo(() => teamsOf(data), [data]);
  useCenter(win, {focus: s.focus, pan: s.pan, scroller: '.sec-scroll', scrollTo: s.scrollTo});
  const team = (t, i) => {
    const open = t.id === 'ops' ? s.ops : t.id === 'kitchen' ? s.kitchen : false, lastTeam = i === TEAMS.length - 1;
    return <Block key={t.id} id={`team-${t.id}`}>
      <TeamRow index={i + 1} team={t} open={open} last={lastTeam}/>
      {t.missions.length > 0 && <Reveal open={open}><div className="sec-block" data-iq-target={`missions-${t.id}`}>
        {t.missions.map(([id, m], j) => <Mission key={id} index={j + 1} id={id} m={m} open={s.boxes.includes(id)} lastTeam={lastTeam} last={j === t.missions.length - 1}/>)}
      </div></Reveal>}
    </Block>;
  };
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 776, width: 1600}}><div className="iq-ol-page">
      <div className="ow-workspace iq-ow sec-pl" aria-label="Taskmaverick web: Overview, Personal Board, Timeline">
        <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span>
          <nav>{NAV.map(n => <span key={n} className={n === 'Overview' ? 'is-active' : undefined}>{n}</span>)}</nav>
          <div className="ow-account"><span className="ow-icon-button"><Svg d="bell" className="ow-icon"/></span><span className="ow-icon-button"><Svg d="gear" className="ow-icon" sw={1.6}/></span><span className="ow-avatar">JM</span></div>
        </header>
        <div className="ow-subnav"><nav>{BOARDS.map(n => <span key={n} className={n === 'Personal Board' ? 'is-active' : undefined}>{n}</span>)}</nav><nav className="ow-view-nav">{VIEWS.map(n => <span key={n} className={n === 'Timeline' ? 'is-active' : undefined}>{n}</span>)}</nav></div>
        <div className="ow-toolbar">
          <span className="ow-tool"><Plane/>Bulk Action<Svg d="down" className="sec-pl-caret"/></span>
          <span className="ow-tool"><Svg d="funnel" className="sec-pl-ic is-orange" sw={2}/>Filter: New Filter</span>
          <span className="ow-tool"><Svg d="list" className="sec-pl-ic" sw={1.8}/>Group by: Unit</span>
          <span className="ow-tool"><Svg d="tree" className="sec-pl-ic" sw={1.6}/>Expand/Collapse</span>
          <span className="ow-tool"><Svg d="cloud" className="sec-pl-ic" sw={1.6}/>Export</span>
          <span className="ow-check"><i className="sec-pl-check"/>Idle</span>
          <span className="sec-pl-time">
            <span className="sec-pl-btn is-hours"><Svg d="clock" className="sec-pl-ic"/>12 AM - 12 AM</span>
            <span className="sec-pl-span is-active">1D</span><span className="sec-pl-span">7D</span><span className="sec-pl-span">31D</span>
            <span className="sec-pl-btn is-arrow"><Svg d="left" className="sec-pl-ic"/></span><span className="sec-pl-btn is-date">09/21/2026 – 09/21/2026</span><span className="sec-pl-btn is-arrow"><Svg d="right" className="sec-pl-ic"/></span>
          </span>
        </div>
        <div className="sec-pl-table">
          <div className="sec-pl-row is-head">
            <span className="sec-pl-name"><b>Name</b><Svg d="sort" className="sec-pl-sort" sw={1.8}/><Kebab/></span>
            <span className="sec-pl-pos"><b>Positions</b><Kebab/></span>
            <span className="sec-pl-hours" data-iq-target="hours-head">{HOURS.map(h => <i key={h}>{hourLabel(h)[0]}<small>{hourLabel(h)[1]}</small></i>)}</span>
          </div>
          <div className="sec-scroll"><div className="sec-pl-body">
            <Block id="units-block">
              <Block id="unit-0">
                <UnitRow index={1} id="row-unit" name={data.unit} teams={TEAMS.length} open={s.unit}/>
                <Reveal open={s.unit}><Block id="teams-block"><i className="sec-pl-dist" data-iq-target="distribution"/>{TEAMS.map(team)}</Block></Reveal>
              </Block>
              {data.others.map(({name, teams}, i) => <UnitRow key={`${i}-${name}`} index={i + 2} name={name} teams={teams}/>)}
            </Block>
          </div></div>
        </div>
      </div>
    </div></div>
  </div>;
}
