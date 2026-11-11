'use client';
// Content Adaptation's art for the section videos (lib/sections/content-adaptation.mjs), drawn from a state given as data. Only the product's own screens and pieces (the user,
// 2026-10-20: "only real product UI"); what is not the product (the outlines of the two states) is drawn outside it:
//   view 'map'     the library's Meal & Rest Breaks mission (the product's mission card) scheduled in California and in Texas: their outlines, the mission card landing in each, a schedule
//                  in each one's time zone (the Increased Efficiency videos' schedule pill)
//   view 'mission' the mission opened in one of them (parts.jsx MissionPanel): its guide written line by line as that state's law has it, its alert, its checkpoints
//   view 'web'     the web app's Units page (tm/47-units.png): the locations with their City, County and State, the columns the content is adapted by
import {Fragment, useRef} from 'react';
import {MissionPanel} from './parts';
import {WebWindow, Ico, Card, useNames} from './StandardizingStage';
import {NAV} from '../DataReport';
import './content-adaptation.css';

export const ADAPTATION_BASE = {view: 'map', step: 2, sched: 2, juris: 'tx', expand: 1, write: 3, focus: null, pan: 0};

// ---- the two states (their outlines, longitude / latitude, drawn at 30 px a degree) ----
const CA = [[-124.21, 42], [-120, 42], [-120, 39], [-114.63, 35], [-114.57, 34.8], [-114.13, 34.27], [-114.43, 34.08], [-114.53, 33.93], [-114.7, 33.42], [-114.72, 32.72], [-117.12, 32.53], [-117.25, 32.87], [-117.4, 33.2], [-118, 33.7], [-118.42, 33.95], [-118.8, 34.02], [-119.2, 34.15], [-120, 34.45], [-120.62, 34.57], [-120.64, 35.14], [-121.3, 35.65], [-121.9, 36.3], [-121.97, 36.58], [-121.8, 36.85], [-122.03, 36.96], [-122.4, 37.2], [-122.51, 37.78], [-123, 38], [-123.7, 38.95], [-123.85, 39.8], [-124.35, 40.4], [-124.1, 41], [-124.21, 42]];
const TX = [[-103.04, 36.5], [-100, 36.5], [-100, 34.56], [-99.4, 34.4], [-98.6, 34.15], [-97.9, 33.9], [-97.15, 33.72], [-96.4, 33.75], [-95.7, 33.88], [-95, 33.88], [-94.48, 33.64], [-94.04, 33.55], [-94.04, 31.99], [-93.8, 31.7], [-93.55, 31.18], [-93.7, 30.6], [-93.84, 29.71], [-94.7, 29.35], [-95.3, 28.9], [-96.3, 28.4], [-96.95, 28], [-97.25, 27.4], [-97.4, 26.8], [-97.15, 25.95], [-97.5, 25.88], [-98.2, 26.07], [-99.1, 26.43], [-99.45, 27.03], [-99.52, 27.5], [-100.3, 28.2], [-100.65, 28.95], [-101, 29.35], [-101.4, 29.77], [-102.4, 29.8], [-102.7, 29.7], [-103.15, 28.97], [-103.8, 29.27], [-104.4, 29.57], [-104.7, 30.2], [-105, 30.68], [-105.6, 31.08], [-106.2, 31.47], [-106.62, 31.95], [-106.62, 32], [-103.06, 32], [-103.04, 36.5]];
const K = 30;
function outline(points) {
  const lat0 = (Math.min(...points.map(p => p[1])) + Math.max(...points.map(p => p[1]))) / 2, c = Math.cos((lat0 * Math.PI) / 180);
  const xs = points.map(p => p[0] * c * K), ys = points.map(p => -p[1] * K), x0 = Math.min(...xs), y0 = Math.min(...ys);
  return {w: Math.max(...xs) - x0, h: Math.max(...ys) - y0, d: points.map((p, i) => `${i ? 'L' : 'M'}${(xs[i] - x0).toFixed(1)} ${(ys[i] - y0).toFixed(1)}`).join(' ') + 'Z'};
}
const SHAPES = {ca: outline(CA), tx: outline(TX)};
// Each state is its own outline filled with land (a photograph: public/storyboard-art/land.jpg, scripts/generate-images.mjs `land`), its color over it once the mission is there.
const LAND = '/storyboard-art/land.jpg';
const STATES = [
  {id: 'ca', name: 'California', code: 'CA', x: 270, color: '#2a78d6', schedule: 'Daily · 9:00 AM PT', time: '09:00 AM'},
  {id: 'tx', name: 'Texas', code: 'TX', x: 742, color: '#eb6834', schedule: 'Daily · 9:00 AM CT', time: '09:00 AM'},
];
const PURPLE = '#7b3cf0', MISSION = 'Meal & Rest Breaks', BREAKS = {kind: 'Checklist', points: 10, title: MISSION, pill: '00:00:00'};
function StatesMap({s}) {
  const root = useRef(null);
  useNames(root);
  const srcY = 56, top = 290, cardY = 640, busY = 252;
  return <div ref={root} className="iq2-iso-layer sec-flow sec-ca-map" data-sec-part="Layer" style={{width: 1600, height: 900}}>
    <span className="iq2-rating-label sec-label sec-ca-label" style={{left: 521, top: srcY - 24}}>Missions › In Library</span>
    <Card c={{id: 'source', x: 521 - 167, y: srcY, scale: 1.05, mission: {...BREAKS, time: '09:00 AM'}}}/>
    <svg className="sec-flow-lines" width="1" height="1" style={{overflow: 'visible'}} aria-hidden="true">
      <defs><marker id="sec-ca-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
      <path d={`M521 ${srcY + 140} L521 ${busY}`} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" style={{opacity: s.step > 0 ? 1 : 0}}/>
      {STATES.map((st, i) => <path key={st.id} d={`M521 ${busY} L${st.x} ${busY} L${st.x} ${top - 12}`} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#sec-ca-arrow)" style={{opacity: s.step > i ? 1 : 0}}/>)}
    </svg>
    {STATES.map((st, i) => {
      const shape = SHAPES[st.id], on = s.step > i, H = 320, k = Math.min(1, H / shape.h);
      return <Fragment key={st.id}>
        <div className={`sec-ca-state${on ? ' is-on' : ''}`} data-iq-target={`state-${st.id}`} style={{left: st.x - (shape.w * k) / 2, top: top + (H - shape.h * k) / 2, width: shape.w * k, height: shape.h * k}}>
          <svg viewBox={`-4 -4 ${shape.w + 8} ${shape.h + 8}`} aria-hidden="true">
            <defs><pattern id={`sec-ca-land-${st.id}`} patternUnits="userSpaceOnUse" width={shape.w} height={shape.h}><image href={LAND} width={shape.w} height={shape.h} preserveAspectRatio="xMidYMid slice"/></pattern></defs>
            <path className="sec-ca-land" d={shape.d} fill={`url(#sec-ca-land-${st.id})`}/>
            <path className="sec-ca-tint" d={shape.d} style={{fill: on ? st.color : '#ffffff', fillOpacity: on ? 0.42 : 0.62}}/>
          </svg>
          <span className="sec-ca-name"><b>{st.code}</b>{st.name}</span>
        </div>
        <Card c={{id: `copy-${st.id}`, x: st.x - 167, y: cardY, scale: 0.9, opacity: on ? 1 : 0, mission: {...BREAKS, time: st.time}}}/>
        <span className="ev2-schedule sec-se-sched sec-ca-sched" data-iq-target={`sched-${st.id}`} style={{left: st.x, top: cardY + 136, opacity: s.sched > i ? 1 : 0, transform: `translateX(-50%) scale(${s.sched > i ? 1 : 0.85})`}}><Ico d="calendar" className="sec-se-ic"/>{st.schedule}</span>
      </Fragment>;
    })}
  </div>;
}

// ---- the mission in one state (parts.jsx MissionPanel): the guide written line by line, its alert, its checkpoints ----
const CONTENT = {
  tx: {where: 'Austin, TX / Store 12', alert: 'Breaks follow company policy in Texas.', lines: ['Texas law does not require meal or rest breaks for adult employees.', 'Our policy: one 30-minute meal break on every shift over 6 hours.', 'Clock out and back in for your meal break.'],
    items: [{id: 'meal', type: 'yesno', q: 'Did you take your 30-minute meal break?', answer: null}]},
  ca: {where: 'Los Angeles, CA / Store 4', alert: 'California law requires meal and rest breaks.', lines: ['Take a 30-minute meal break before the end of your 5th hour of work.', 'Take a paid 10-minute rest break for every 4 hours you work.', 'A missed break earns one extra hour of pay.'],
    items: [{id: 'meal', type: 'yesno', q: 'Did your meal break start before your 5th hour?', answer: null}, {id: 'rest', type: 'yesno', q: 'Did you take your 10-minute rest breaks?', answer: null}]},
};
function StateMission({s}) {
  const c = CONTENT[s.juris];
  return <MissionPanel kind="Checklist" points={10} title={MISSION} location={c.where} who="Posted by J. Maverick" date="09-23-26 09:00 AM" timer="00:00:05" expand={s.expand}
    brief={{instructions: <>{c.lines.map((line, i) => <span key={i} className="sec-ca-line" data-iq-target={`line-${i}`} style={{opacity: s.write > i ? 1 : 0}}>{line} </span>)}</>, alert: c.alert}}
    items={c.items} scrollTo="top"/>;
}

// ---- the web app's Units page (tm/47-units.png): the locations, their City, County and State ----
const UNIT_COLS = [['name', 'Name', 300], ['loc', 'Loc ID', 100], ['status', 'Status', 110], ['people', 'People', 90], ['tag', 'Tag', 130], ['team', 'Team', 170], ['city', 'City', 150], ['county', 'County', 150], ['state', 'State', 140], ['address', 'Address Line 1', 260]];
const u = (name, loc, people, tag, team, city, county, state, address) => ({name, loc, people, tag, team, city, county, state, address});
const UNITS = [
  u('Downtown LA Store', 'L004', 12, 'Los Angeles', 'Store Team', 'Los Angeles', 'Los Angeles', 'California', '240 S Spring St'),
  u('Santa Monica Store', 'L007', 8, 'Los Angeles', 'Store Team', 'Santa Monica', 'Los Angeles', 'California', '1440 4th St'),
  u('Pasadena Store', 'L009', 9, 'Los Angeles', 'Store Team', 'Pasadena', 'Los Angeles', 'California', '88 E Colorado Blvd'),
  u('San Diego Store', 'L012', 11, 'San Diego', 'Store Team', 'San Diego', 'San Diego', 'California', '505 Broadway'),
  u('Sacramento Store', 'L015', 7, 'Sacramento', 'Store Team', 'Sacramento', 'Sacramento', 'California', '1012 K St'),
  u('Austin Store', 'T002', 10, 'Austin', 'Store Team', 'Austin', 'Travis', 'Texas', '600 Congress Ave'),
  u('Round Rock Store', 'T005', 6, 'Austin', 'Store Team', 'Round Rock', 'Williamson', 'Texas', '201 E Main St'),
  u('Houston Store', 'T008', 13, 'Houston', 'Store Team', 'Houston', 'Harris', 'Texas', '1001 Main St'),
  u('Dallas Store', 'T011', 9, 'Dallas', 'Store Team', 'Dallas', 'Dallas', 'Texas', '1500 Elm St'),
  u('El Paso Store', 'T014', 5, 'El Paso', 'Store Team', 'El Paso', 'El Paso', 'Texas', '120 N Mesa St'),
  u('San Antonio Store', 'T017', 8, 'San Antonio', 'Store Team', 'San Antonio', 'Bexar', 'Texas', '300 Alamo Plaza'),
  u('Plano Store', 'T020', 7, 'Dallas', 'Store Team', 'Plano', 'Collin', 'Texas', '7200 Bishop Rd'),
];
const UCols = () => <colgroup>{UNIT_COLS.map(([k, , w]) => <col key={k} style={{width: w}}/>)}</colgroup>;
const Kebab = () => <svg className="sec-pl-kebab" viewBox="0 0 6 20" aria-hidden="true"><circle cx="3" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/></svg>;
function UnitsPage() {
  return <>
    <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span>
      <nav>{NAV.map(n => <span key={n} className={n === 'Units' ? 'is-active' : undefined}>{n}</span>)}</nav>
      <div className="ow-account"><span className="ow-icon-button"><Ico d="bell" className="ow-icon"/></span><span className="ow-icon-button"><Ico d="gear" className="ow-icon" sw={1.6}/></span><span className="ow-avatar">JM</span></div>
    </header>
    <div className="ow-toolbar sec-ca-tools">
      <span className="ow-tool"><Ico d="plusCircle" className="sec-pl-ic is-blue"/>New Location</span>
      <span className="ow-tool"><Ico d="tree" className="sec-pl-ic"/>Expand/Collapse</span>
      <span className="ow-tool"><Ico d="eye" className="sec-pl-ic"/>Hide/Show Column</span>
      <span className="ow-tool"><Ico d="export" className="sec-pl-ic"/>Export</span>
    </div>
    <div className="ow-table-scroll sec-ca-table">
      <table className="ow-table iq-ow-head" style={{width: 1600}}><UCols/>
        <thead><tr>{UNIT_COLS.map(([k, label]) => <th key={k} className={k === 'name' ? 'ow-name-cell' : ''} data-iq-col={k}><div><span>{label}</span>{k !== 'address' && <Kebab/>}</div></th>)}</tr></thead>
      </table>
      <div className="iq-ow-rows"><table className="ow-table sec-ca-rows" style={{width: 1600}}><UCols/>
        <tbody>{UNITS.map((r, i) => <tr key={r.loc} className="ow-data-row" data-iq-target={`unit-${r.loc}`}>
          <td className="ow-name-cell"><div className="sec-ca-uname"><em>{i + 1}.</em><b>{r.name}</b><Kebab/></div></td>
          <td>{r.loc}</td><td><span className="sec-ca-status"><i/>Active</span></td><td className="is-center">{r.people}</td>
          <td><span className="sec-se-chips"><i>{r.tag}</i></span></td><td><span className="sec-se-chips"><i>{r.team}</i></span></td>
          <td>{r.city}</td><td>{r.county}</td><td>{r.state}</td><td>{r.address}</td>
        </tr>)}</tbody>
      </table></div>
    </div>
    <footer className="sec-ca-pager"><span>Items Per Page:</span><span className="sec-ca-per">25<Ico d="down" className="sec-pl-caret"/></span><span>1 - {UNITS.length} of {UNITS.length}</span><span className="sec-ca-pages"><Ico d="left" className="sec-pl-caret"/><b>1</b><Ico d="right" className="sec-pl-caret"/></span></footer>
  </>;
}

export default function AdaptationStage({state}) {
  const s = {...ADAPTATION_BASE, ...state};
  if (s.view === 'mission') return <StateMission s={s}/>;
  if (s.view === 'web') return <WebWindow focus={s.focus} pan={s.pan} label="Taskmaverick web: Units"><UnitsPage/></WebWindow>;
  return <StatesMap s={s}/>;
}
