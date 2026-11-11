'use client';
// Reporting & AI's art for the section videos (lib/sections/reporting-ai.mjs): the Data Board of the web app (components/DataReport.jsx's page, with its own rows): the execution summary per
// unit, opened one level at a time (teams, people, missions, statements) down to the data a person entered and the photo and video they collected. `level` says how deep it is open.
import {Fragment, useRef} from 'react';
import {useCenter} from './parts';
import {Icon, Sidebar, NAV, HEAD, GroupRow, Toggle, Pct} from '../DataReport';
import {DemoVideo} from '../ImprovedQualityV2Panels';
import {REPORT} from '@/lib/liveOversightData.mjs';

export const REPORTING_BASE = {focus: null, level: 0, pan: 0, scrollTo: null, viewer: null};
const PHOTO = '/demo-quality/proofs/fire-exit.jpg', POSTER = '/demo-quality/damaged-hinge.png', CLIP = '/demo-quality/condition-report.mp4';
const UNITS = [['West Location', 6, 1617, 1512], ['East Location', 5, 1402, 1288], ['North Plant', 8, 1190, 1066], ['South Plant', 7, 1104, 951], ['Downtown Cafe', 4, 912, 880], ['Riverside Hotel', 9, 874, 760], ['Airport Kiosk', 3, 640, 598], ['Harbor Grill', 5, 588, 497], ['Midtown Deli', 4, 531, 502], ['University Dining', 6, 477, 391]];
const TEAMS = [['Operations', 5, 412, 388], ['Support', 4, 301, 274], ['Administration', 3, 266, 241], ['Kitchen', 6, 244, 229], ['Service', 5, 218, 196], ['Maintenance', 3, 176, 160]];
const PEOPLE = [['Emily Carter', 10, 88, 80], ['James Miller', 9, 84, 71], ['Michael Davis', 8, 79, 64], ['Sarah Wilson', 7, 71, 53], ['Ben Rivera', 6, 70, 56]];
const MISSIONS = [['Safety Check', 'Checklist', 14, 14], ['Storage Room Check', 'Checklist', 7, 7], ['Check work area', 'Checklist', 4, 4], ['Receive deliveries', 'Task', 3, 3], ['Update task list', 'Task', 5, 4], ['Tidy work area', 'Checklist', 3, 3], ['Check supplies', 'Checklist', 4, 3], ['Report an issue', 'Task', 2, 1], ['Opening Checklist', 'Checklist', 6, 6], ['Closing Checklist', 'Checklist', 6, 5]];
const STATEMENTS = [
  {key: 'exits', q: 'Are all exits clear?', response: 'Yes', type: 'Yes / No', at: '09/24/2026, 08:41 AM'},
  {key: 'extinguisher', q: 'Is the extinguisher charged?', response: 'Yes', type: 'Yes / No', at: '09/24/2026, 08:42 AM'},
  {key: 'walkway', q: 'Walkway width (cm)', response: '118', type: 'Number', at: '09/24/2026, 08:43 AM', evidence: true},
  {key: 'hazards', q: 'Are there any safety hazards?', response: 'No', type: 'Yes / No', at: '09/24/2026, 08:44 AM'},
];
const pct = (closed, posted) => (closed / posted) * 100;

const Reveal = ({open, children}) => <div className="iq2-reveal" style={{gridTemplateRows: `${open ? 1 : 0}fr`, opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden'}}><div>{children}</div></div>;
function Block({id, children}) { return <div data-iq-target={id} className="sec-block">{children}</div>; }
function Statements() {
  return <div className="iq-dr-statements sec-st" data-iq-target="statements-block">
    <div className="iq-dr-st-head">{['Statement', 'Response', 'Question Type', 'Responded At', 'Evidence'].map(h => <span key={h}>{h}</span>)}</div>
    {STATEMENTS.map((s, i) => <div className="iq-dr-st-row" key={s.key}>
      <span className="iq-dr-st-text" data-iq-target={`stmt-${s.key}`}>{i + 1}. {s.q}</span>
      <span className="is-center"><b data-iq-target={s.evidence ? 'entry' : undefined}>{s.response}</b></span>
      <span className="is-center"><i className="iq-dr-chip">{s.type}</i></span>
      <span className="is-center"><em>{s.at}</em></span>
      <span className="sec-evidence">{s.evidence && <>
        <span className="sec-thumb" data-iq-target="evidence-photo" style={{backgroundImage: `url('${PHOTO}')`}}><Icon name="image"/></span>
        <span className="sec-thumb" data-iq-target="evidence-video" style={{backgroundImage: `url('${POSTER}')`}}><Icon name="video"/></span></>}</span>
    </div>)}
  </div>;
}

export default function ReportingStage({state}) {
  const s = {...REPORTING_BASE, ...state}, win = useRef(null), L = s.level;
  useCenter(win, {focus: s.focus, pan: s.pan, scroller: '.sec-scroll', scrollTo: s.scrollTo});
  const unit = (u, i) => <GroupRow key={u[0]} depth={0} index={i + 1} label={u[0]} count={u[1]} posted={u[2]} closed={u[3]} pct={pct(u[3], u[2])} open={i === 0 && L >= 1}/>;
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 760}}><div className="iq-ol-page">
      <div className="iq-ur iq-dr" aria-label="Taskmaverick web: Data Board">
        <header className="iq-ur-topbar"><img src="/logo.svg" alt="taskmaverick"/><nav>{NAV.map(n => <span key={n} className={n === 'Reports' ? 'is-active' : undefined}>{n}</span>)}</nav><div><Icon name="bell"/><Icon name="gear"/><span className="iq-ur-avatar">JM</span></div></header>
        <div className="iq-ur-page"><Sidebar/>
          <main className="iq-ur-main">
            <div className="iq-ur-head"><b>Execution Summary</b><span className="iq-ur-link">Show Details</span><span className="iq-ur-range iq-dr-hours"><Icon name="clock"/>12 AM - 12 AM</span><span className="iq-ur-range iq-dr-range">09/22/2026 – 09/28/2026<Icon name="chev"/></span><span className="iq-ur-btn iq-dr-btn-muted">Update Default View</span><span className="iq-ur-btn is-primary">Save To My View</span></div>
            <div className="iq-ur-tools"><span><Icon name="view" className="iq-ur-ic is-blue"/>My View:Default</span><span><Icon name="group"/>Group by: Unit</span><span><Icon name="expand"/>Expand/Collapse</span><span className="iq-ur-gallery"><i className="iq-ur-checkbox"/>Daily Distribution</span><span className="iq-ur-icons"><Icon name="gear"/><Icon name="cloud"/><Icon name="mail"/><Icon name="sync"/></span></div>
            <div className="iq-ur-summary"><span>{REPORT.summary.total}</span><span className="iq-ur-pill is-active"><i><Icon name="team"/></i>Team <b>{REPORT.summary.team}</b></span><span className="iq-ur-pill"><i><Icon name="person"/></i>Personal <b>{REPORT.summary.personal}</b></span></div>
            <div className="iq-dr-table sec-table">
              <div className="iq-dr-row is-head">{HEAD.map(h => <span key={h}>{h}<Icon name="dots"/></span>)}</div>
              <div className="sec-scroll"><div className="iq-dr-body">
                <Block id="units-block">
                  <Block id="unit-0">
                    {unit(UNITS[0], 0)}
                    <Reveal open={L >= 1}><Block id="teams-block">{TEAMS.map((t, i) => <Block key={t[0]} id={`team-${i}`}>
                      <GroupRow depth={1} index={i + 1} label={t[0]} count={t[1]} posted={t[2]} closed={t[3]} pct={pct(t[3], t[2])} open={i === 0 && L >= 2}/>
                      {i === 0 && <Reveal open={L >= 2}><Block id="people-block">{PEOPLE.map((p, j) => <Block key={p[0]} id={`person-${j}`}>
                        <GroupRow depth={2} index={j + 1} label={p[0]} count={p[1]} posted={p[2]} closed={p[3]} pct={pct(p[3], p[2])} position="WL Staff" open={j === 0 && L >= 3}/>
                        {j === 0 && <Reveal open={L >= 3}><Block id="missions-block">{MISSIONS.map(([name, type, posted, closed], k) => <Block key={name} id={`mission-${k}`}>
                          <div className={`iq-dr-row is-mission${k === 0 && L >= 4 ? ' is-expanded' : ''}`}><span>{k === 0 && L >= 4 ? <Toggle/> : <i className="iq-dr-branch"/>}<em>{k + 1}.</em><b>{name}</b><small>1</small></span><span/><span className="is-num">{posted}</span><span className="is-num">{closed}</span><span><Pct pct={pct(closed, posted)}/></span><span/><span>{type}</span><span>Operations</span><span/><span/></div>
                          {k === 0 && <Reveal open={L >= 4}><Statements/></Reveal>}
                        </Block>)}</Block></Reveal>}
                      </Block>)}</Block></Reveal>}
                    </Block>)}</Block></Reveal>
                  </Block>
                  {UNITS.slice(1).map((u, i) => unit(u, i + 1))}
                </Block>
              </div></div>
            </div>
          </main>
        </div>
      </div>
    </div></div>
    {s.viewer && <div className="sec-lightbox" data-sec-window><div className="sec-lightbox-card">{s.viewer === 'photo' ? <img src={PHOTO} alt=""/> : <DemoVideo src={CLIP} poster={POSTER} time={s.viewerTime ?? 0}/>}<span className="sec-lightbox-x" data-iq-target="lightbox-close">×</span></div></div>}
  </div>;
}
