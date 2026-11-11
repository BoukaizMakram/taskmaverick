'use client';
// Prediction & AI's art for the section videos (lib/sections/prediction-ai.mjs): the web report (Reporting & AI's look: the Data Board's page, its Risk Summary at the left) with all of it
// open, a location down to its teams, a team to its people, a person to their missions, a mission to every answer given, and the list scrolled through it (`scrollTo`: where the list is,
// the same DOM in every state, so the video scrolls).
import {useRef} from 'react';
import {useCenter} from './parts';
import {Icon, Sidebar, NAV, HEAD, GroupRow, Toggle, Pct} from '../DataReport';
import './prediction-ai.css';

export const PREDICTION_BASE = {focus: null, pan: 0, scrollTo: 'top'};
const UNITS = [['West Location', 6, 1617, 1512], ['East Location', 5, 1402, 1288], ['North Plant', 8, 1190, 1066], ['South Plant', 7, 1104, 951], ['Downtown Cafe', 4, 912, 880], ['Riverside Hotel', 9, 874, 760], ['Airport Kiosk', 3, 640, 598], ['Harbor Grill', 5, 588, 497], ['Midtown Deli', 4, 531, 502], ['University Dining', 6, 477, 391]];
const TEAMS = [['Operations', 5, 412, 388], ['Kitchen', 6, 301, 274], ['Maintenance', 3, 266, 241], ['Front Desk', 4, 244, 229], ['Housekeeping', 5, 218, 196], ['Security', 3, 176, 160]];
const PEOPLE = [['Emily Carter', 10, 88, 80], ['James Miller', 9, 84, 71], ['Michael Davis', 8, 79, 64], ['Sarah Wilson', 7, 71, 53], ['Ben Rivera', 6, 70, 56]];
const MISSIONS = [['Safety Audit', 'Audit', 14, 14], ['Incident Survey', 'Survey', 7, 7], ['Equipment Check', 'Checklist', 12, 11], ['Discrimination Survey', 'Survey', 3, 3], ['Break Compliance', 'Task', 20, 19], ['Temperature Log', 'Checklist', 28, 27], ['Opening Checklist', 'Checklist', 6, 6], ['Closing Checklist', 'Checklist', 6, 5], ['Fire Safety Training', 'Media', 1, 1], ['Report an Issue', 'Task', 2, 1]];
const STATEMENTS = [
  {key: 'exits', q: 'Are all exits clear?', response: 'Yes', type: 'Yes / No', at: '09/24/2026, 08:41 AM'},
  {key: 'hazards', q: 'Are there any safety hazards?', response: 'Yes', type: 'Yes / No', at: '09/24/2026, 08:42 AM', flag: true},
  {key: 'floor', q: 'Are wet floor signs in place?', response: 'Yes', type: 'Yes / No', at: '09/24/2026, 08:43 AM'},
  {key: 'near', q: 'Near misses this week', response: '2', type: 'Number', at: '09/24/2026, 08:44 AM', flag: true},
  {key: 'injury', q: 'Has anyone been injured?', response: 'No', type: 'Yes / No', at: '09/24/2026, 08:45 AM'},
];
const pct = (closed, posted) => (closed / posted) * 100;
const Block = ({id, children}) => <div data-iq-target={id} className="sec-block">{children}</div>;
function Statements() {
  return <div className="iq-dr-statements sec-pr-st" data-iq-target="statements">
    <div className="iq-dr-st-head">{['Statement', 'Response', 'Question Type', 'Responded At', 'Ticket Title'].map(h => <span key={h}>{h}</span>)}</div>
    {STATEMENTS.map((s, i) => <div className="iq-dr-st-row" key={s.key}><span className="iq-dr-st-text">{i + 1}. {s.q}</span><span className="is-center"><b className={s.flag ? 'is-anomaly' : undefined}>{s.response}</b></span><span className="is-center"><i className="iq-dr-chip">{s.type}</i></span><span className="is-center"><em>{s.at}</em></span><span className="is-center"><em className={s.flag ? 'is-ticket' : undefined}>{s.flag ? 'Safety Alert' : '-'}</em></span></div>)}
  </div>;
}

export default function PredictionStage({state}) {
  const s = {...PREDICTION_BASE, ...state}, win = useRef(null);
  useCenter(win, {focus: s.focus, pan: s.pan, scroller: '.sec-pr-scroll', scrollTo: s.scrollTo});
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 760}}><div className="iq-ol-page">
      <div className="iq-ur iq-dr" aria-label="Taskmaverick web: Risk Data">
        <header className="iq-ur-topbar"><img src="/logo.svg" alt="taskmaverick"/><nav>{NAV.map(n => <span key={n} className={n === 'Reports' ? 'is-active' : undefined}>{n}</span>)}</nav><div><Icon name="bell"/><Icon name="gear"/><span className="iq-ur-avatar">JM</span></div></header>
        <div className="iq-ur-page"><Sidebar/>
          <main className="iq-ur-main">
            <div className="iq-ur-head"><b>Risk Data · All Units</b><span className="iq-ur-link">Show Details</span><span className="iq-ur-range iq-dr-hours"><Icon name="clock"/>12 AM - 12 AM</span><span className="iq-ur-range iq-dr-range">01/01/2026 – 09/28/2026<Icon name="chev"/></span><span className="iq-ur-btn iq-dr-btn-muted">Update Default View</span><span className="iq-ur-btn is-primary">Save To My View</span></div>
            <div className="iq-ur-tools"><span><Icon name="view" className="iq-ur-ic is-blue"/>My View:Default</span><span><Icon name="group"/>Group by: Unit</span><span><Icon name="expand"/>Expand/Collapse</span><span className="iq-ur-gallery"><i className="iq-ur-checkbox is-checked"/>Daily Distribution</span><span className="iq-ur-icons"><Icon name="gear"/><Icon name="cloud"/><Icon name="mail"/><Icon name="sync"/></span></div>
            <div className="iq-ur-summary"><span>Total Closed: 9,339 of 10,335 / 90.4%</span><span className="iq-ur-pill is-active"><i><Icon name="team"/></i>Team <b>8,912 of 9,861</b></span><span className="iq-ur-pill"><i><Icon name="person"/></i>Personal <b>427 of 474</b></span></div>
            <div className="iq-dr-table sec-table">
              <div className="iq-dr-row is-head">{HEAD.map(h => <span key={h}>{h}<Icon name="dots"/></span>)}</div>
              <div className="sec-pr-scroll sec-scroll"><div className="iq-dr-body" data-iq-target="rows">
                <Block id="unit-0">
                  <GroupRow depth={0} index={1} label={UNITS[0][0]} count={UNITS[0][1]} posted={UNITS[0][2]} closed={UNITS[0][3]} pct={pct(UNITS[0][3], UNITS[0][2])}/>
                  <Block id="teams">{TEAMS.map((t, i) => <Block key={t[0]} id={`team-${i}`}>
                    <GroupRow depth={1} index={i + 1} label={t[0]} count={t[1]} posted={t[2]} closed={t[3]} pct={pct(t[3], t[2])} open={i === 0}/>
                    {i === 0 && <Block id="people">{PEOPLE.map((p, j) => <Block key={p[0]} id={`person-${j}`}>
                      <GroupRow depth={2} index={j + 1} label={p[0]} count={p[1]} posted={p[2]} closed={p[3]} pct={pct(p[3], p[2])} position="WL Staff" open={j === 0}/>
                      {j === 0 && <Block id="missions">{MISSIONS.map(([name, type, posted, closed], k) => <Block key={name} id={`mission-${k}`}>
                        <div className={`iq-dr-row is-mission${k === 0 ? ' is-expanded' : ''}`}><span>{k === 0 ? <Toggle/> : <i className="iq-dr-branch"/>}<em>{k + 1}.</em><b>{name}</b><small>1</small></span><span/><span className="is-num">{posted}</span><span className="is-num">{closed}</span><span><Pct pct={pct(closed, posted)}/></span><span/><span>{type}</span><span>Safety</span><span/><span/></div>
                        {k === 0 && <Statements/>}
                      </Block>)}</Block>}
                    </Block>)}</Block>}
                  </Block>)}</Block>
                </Block>
                {UNITS.slice(1).map((u, i) => <Block key={u[0]} id={`unit-${i + 1}`}><GroupRow depth={0} index={i + 2} label={u[0]} count={u[1]} posted={u[2]} closed={u[3]} pct={pct(u[3], u[2])} open={false}/></Block>)}
              </div></div>
            </div>
          </main>
        </div>
      </div>
    </div></div>
  </div>;
}
