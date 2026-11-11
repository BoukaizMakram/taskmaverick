'use client';
// Risk & Liability's art for the section videos (lib/sections/risk-liability.mjs), drawn from a state given as data:
//   people    three people, a Discrimination Survey for each (the survey as its card), the three surveys opened and answered, the one "Yes" that raises the alert ticket, then the
//             whole art pushed right to left onto the alert opened with the steps that guide the responder. ONE layer with the same DOM in every state (what is not shown is faded), so
//             the video moves from each state to the next: the cards pop, open into the surveys, the answers tick, the ticket pops, the page slides over (`page`).
//   training  a survey opened with its HR training (pressed, it opens the lesson screen of the Improved Quality videos: the notice, then the quiz)
//   report    the web report grouped by person: a person opened to the surveys they took, a survey opened to its answers and the training completed
import {useLayoutEffect, useRef} from 'react';
import {MissionPanel, useCenter, AVATAR} from './parts';
import TicketCard from '../TicketCard';
import {Icon, Sidebar, NAV, Toggle, Pct} from '../DataReport';
import './risk-liability.css';

export const RISK_BASE = {view: 'people', step: 0, expand: 0, answers: 0, alert: 0, page: 'surveys', tExpand: 0, steps: 0, tScroll: 'top', done: false, trScroll: 'top', level: 0, focus: null, pan: 0, scrollTo: null};

const PEOPLE = [{id: 'anna', name: 'Anna F', avatar: AVATAR.anna}, {id: 'ben', name: 'Ben R', avatar: AVATAR.ben}, {id: 'carla', name: 'Carla M', avatar: AVATAR.carla}];
const QUESTIONS = [['q1', 'Have you been treated unfairly at work?'], ['q2', 'Have you witnessed any discrimination?'], ['q3', 'Have you experienced any harassment?']];
const YES = {ben: 'q2'}; // (the one answer that raises the alert: Ben has witnessed discrimination)
const STEPS = [['s0', 'Did you meet the employee in private?'], ['s1', 'Did you document the report?'], ['s2', 'Did you notify Human Resources?'], ['s3', 'Is a follow-up meeting scheduled?']];

// ---- the HR training's thumbnail (its cover: a photograph, scripts/generate-images.mjs `hr-training`; it was a drawn title card) ----
const SLIDE_TITLE = '/storyboard-art/hr-training.jpg';

// ---- the three people, their surveys, the alert, the alert opened (one layer: `page` slides it) ----
const K = 0.85, PH = 573 * K, X = [191, 521, 851]; // (a survey at 0.85: three side by side on the plate, centered on 521)
const OPEN_TOP = 178, CARD_MID = 520, FACE = {open: 46, shut: 296}; // (the surveys' visual top once open; a card's middle before; where the faces are in each)
const SHIFT = 640; // (the alert opened is that far right of the surveys: the art is pushed right to left onto it)
const ticketAt = {x: 521 - 167, y: 600}; // (the alert pops over the empty bottom of the middle survey, Ben's)
const opened = e => (e >= 1 ? 0.9999 : e); // (open, but its clip still a rectangle: the video moves a clip-path from one rectangle to another, not to none)

function Survey({p, i, s}) {
  const shown = s.step > i, open = s.expand >= 1, mid = open ? OPEN_TOP + PH / 2 : CARD_MID;
  const items = QUESTIONS.map(([q, text], n) => ({id: `${p.id}-${q}`, type: 'yesno', q: text, answer: s.answers > n ? (YES[p.id] === q ? 'yes' : 'no') : null}));
  return <div className="sec-rk-pop" style={{opacity: shown ? 1 : 0, transform: `scale(${shown ? 1 : 0.9})`, transformOrigin: `${X[i]}px ${mid}px`}}>
    <MissionPanel kind="Survey" points={10} title="Discrimination Survey" location="Main Street / Front Desk" who={p.name} date="09-23-26 09:00 AM" timer="00:12:40"
      items={items} scrollTo="top" expand={opened(s.expand)} scale={K} left={X[i] - 180} top={mid - 573 / 2} name={`Survey ${p.name}`}/>
  </div>;
}
function Faces({s}) {
  const open = s.expand >= 1, top = open ? FACE.open : FACE.shut;
  return <>{PEOPLE.map((p, i) => <div key={p.id} className="sec-rk-face" data-iq-target={`face-${p.id}`} style={{left: X[i] - 70, top}}><img src={p.avatar} alt=""/><b>{p.name}</b></div>)}
    <svg className="sec-rk-arrows" width="1" height="1" aria-hidden="true" style={{opacity: open ? 0 : 1}}>
      <defs><marker id="sec-rk-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke="#7b3cf0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
      {X.map((x, i) => <path key={i} d={`M${x} ${FACE.shut + 112} L${x} ${CARD_MID - 72}`} fill="none" stroke="#7b3cf0" strokeWidth="3" strokeLinecap="round" markerEnd="url(#sec-rk-arrow)" style={{opacity: s.step > i ? 1 : 0}}/>)}
    </svg></>;
}
function Alert({s}) {
  const on = !!s.alert;
  return <div className="sec-rk-pop iq2-iso-layer" style={{opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 0.86})`, transformOrigin: `${ticketAt.x + 167}px ${ticketAt.y + 116}px`}}>
    <div className="mi-interactive mi-interactive--tablet mi-reference iq2-iso sec-chip sec-rk-ticket" style={{position: 'absolute', left: ticketAt.x, top: ticketAt.y}}><div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: 334}}>
      <TicketCard title="Discrimination Alert" responses={1} response="Have you witnessed any discrimination? Yes." location="Main Street - Human Resources" date="09-23-26" time="09:14 AM" pillTime="00:00:00" pillClass="chip--green" alert/>
    </div></div></div>
  </div>;
}
function Opened({s}) {
  const items = STEPS.map(([id, q], n) => ({id, type: 'yesno', q, answer: s.steps > n ? 'yes' : null}));
  return <MissionPanel kind="Ticket" points={null} title="Discrimination Alert" location="Main Street / Human Resources" who="Dan K" date="09-23-26 09:14 AM" timer="00:01:20"
    brief={{instructions: 'Ben R reported witnessing discrimination. Follow each step to resolve it.', alert: 'Keep this report confidential.'}}
    groupTitle={{name: 'Resolution Steps', count: `${s.steps}/4`}} items={items} scrollTo={s.tScroll} expand={opened(s.tExpand)} left={341 + SHIFT} top={163} name="Alert opened"/>;
}
function People({s}) {
  const root = useRef(null), ticket = s.page === 'ticket';
  useLayoutEffect(() => { // (the names of what the video points at and presses: each survey's card, the alert)
    root.current.querySelectorAll('.sec-rk-left .iq2-mission').forEach((el, i) => el.querySelector('.iq2-m-summary')?.setAttribute('data-iq-target', `card-${PEOPLE[i].id}`));
    root.current.querySelector('.sec-rk-ticket .chip')?.setAttribute('data-iq-target', 'alert');
    root.current.querySelector('.sec-rk-right .iq2-m-summary')?.setAttribute('data-iq-target', 'alert-chip');
  });
  return <div ref={root} className="sec-rk-layer" data-sec-part="Mission" style={{width: 1600, height: 900}}>
    <div className="sec-rk-pan" style={{transform: `translateX(${ticket ? -SHIFT : 0}px)`}}>
      <div className="sec-rk-left" style={{opacity: ticket ? 0 : 1}}>
        <Faces s={s}/>
        {PEOPLE.map((p, i) => <Survey key={p.id} p={p} i={i} s={s}/>)}
        <Alert s={s}/>
      </div>
      <div className="sec-rk-right" style={{opacity: ticket ? 1 : 0}}><Opened s={s}/></div>
    </div>
  </div>;
}

// ---- a survey with its HR training (the Improved Quality film's training tile; pressing it opens the Improved Quality lesson screen, which the video plays: lib/storyboardLesson.mjs,
// the spec's `lessonTopics`) ----
function Training({s}) {
  const items = [{id: 'hr', type: 'training', q: 'Complete this training before you answer.', title: 'Respect In The Workplace', poster: SLIDE_TITLE, meta: 'Text · 1 min', done: !!s.done},
    ...QUESTIONS.map(([q, text]) => ({id: `tr-${q}`, type: 'yesno', q: text, answer: null}))];
  return <MissionPanel kind="Survey" points={10} title="Discrimination Survey" location="Main Street / Front Desk" who="Anna F" date="10-23-26 09:00 AM" timer="00:01:12"
    brief={{instructions: 'Complete the training, then answer each question.'}} items={items} scrollTo={s.trScroll}/>;
}

// ---- the web report: grouped by person ----
const ROSTER = [['anna', 'Anna F', 12, 12], ['ben', 'Ben R', 12, 12], ['carla', 'Carla M', 12, 11], ['leo', 'Leo T', 12, 12], ['dan', 'Dan K', 9, 9], ['maya', 'Maya R', 12, 12], ['sam', 'Sam P', 6, 6], ['nina', 'Nina L', 12, 10], ['omar', 'Omar B', 12, 12], ['tess', 'Tess W', 3, 3]];
const TAKEN = [['Discrimination Survey · 09/23', 'Survey'], ['Discrimination Survey · 08/23', 'Survey'], ['Discrimination Survey · 07/23', 'Survey'], ['Discrimination Survey · 06/23', 'Survey'], ['Respect In The Workplace', 'Media'], ['Harassment Prevention', 'Media']];
const ANSWERS = QUESTIONS.map(([key, q], i) => ({key, q: `${i + 1}. ${q}`, response: 'No', type: 'Yes / No', at: `09/23/2026, 09:0${4 + i} AM`}));
const Reveal = ({open, children}) => <div className="iq2-reveal" style={{gridTemplateRows: `${open ? 1 : 0}fr`, opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden'}}><div>{children}</div></div>;
function Row({depth, index, label, count, posted, closed, position, type, open, target, toggle = true}) {
  return <div className={`iq-dr-row ${depth < 2 ? 'is-group' : 'is-mission'} depth-${depth}${depth === 2 && open ? ' is-expanded' : ''}`}>
    <span data-iq-target={target}>{toggle ? <Toggle open={open}/> : <i className="iq-dr-branch"/>}<em>{index}.</em><b>{label}</b><small>{count}</small></span><span/>
    <span className="is-num">{posted}</span><span className="is-num">{closed}</span><span><Pct pct={(closed / posted) * 100}/></span><span>{position && <i className="iq-dr-chip">{position}</i>}</span><span>{type}</span><span>HR</span><span/><span/>
  </div>;
}
function Statements() {
  return <div className="iq-dr-statements sec-rk-st">
    <div className="iq-dr-st-head">{['Statement', 'Response', 'Question Type', 'Responded At'].map(h => <span key={h}>{h}</span>)}</div>
    <div data-iq-target="answers-block">{ANSWERS.map(a => <div className="iq-dr-st-row" key={a.key}><span className="iq-dr-st-text">{a.q}</span><span className="is-center"><b>{a.response}</b></span><span className="is-center"><i className="iq-dr-chip">{a.type}</i></span><span className="is-center"><em>{a.at}</em></span></div>)}</div>
  </div>;
}
function Report({s}) {
  const win = useRef(null), L = s.level;
  useCenter(win, {focus: s.focus, pan: s.pan, scroller: '.sec-rk-scroll', scrollTo: s.scrollTo});
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 760}}><div className="iq-ol-page">
      <div className="iq-ur iq-dr" aria-label="Taskmaverick web: HR Survey Records">
        <header className="iq-ur-topbar"><img src="/logo.svg" alt="taskmaverick"/><nav>{NAV.map(n => <span key={n} className={n === 'Reports' ? 'is-active' : undefined}>{n}</span>)}</nav><div><Icon name="bell"/><Icon name="gear"/><span className="iq-ur-avatar">JM</span></div></header>
        <div className="iq-ur-page"><Sidebar/>
          <main className="iq-ur-main">
            <div className="iq-ur-head"><b>HR Survey Records</b><span className="iq-ur-link">Show Details</span><span className="iq-ur-range iq-dr-hours"><Icon name="clock"/>12 AM - 12 AM</span><span className="iq-ur-range iq-dr-range">01/01/2026 – 09/30/2026<Icon name="chev"/></span><span className="iq-ur-btn iq-dr-btn-muted">Update Default View</span><span className="iq-ur-btn is-primary">Save To My View</span></div>
            <div className="iq-ur-tools"><span><Icon name="view" className="iq-ur-ic is-blue"/>My View:Default</span><span><Icon name="group"/>Group by: Person</span><span><Icon name="expand"/>Expand/Collapse</span><span className="iq-ur-gallery"><i className="iq-ur-checkbox"/>Daily Distribution</span><span className="iq-ur-icons"><Icon name="gear"/><Icon name="cloud"/><Icon name="mail"/><Icon name="sync"/></span></div>
            <div className="iq-ur-summary"><span>Total Closed: 109 of 114 / 95.6%</span><span className="iq-ur-pill is-active"><i><Icon name="team"/></i>Team <b>31 of 33</b></span><span className="iq-ur-pill"><i><Icon name="person"/></i>Personal <b>78 of 81</b></span></div>
            <div className="iq-dr-table sec-table">
              <div className="iq-dr-row is-head">{['Name', 'Reference', 'Posted', 'Closed', 'Closed %', 'Position', 'Type', 'Folder', 'Process', 'Course'].map(h => <span key={h}>{h}<Icon name="dots"/></span>)}</div>
              <div className="sec-rk-scroll sec-scroll"><div className="iq-dr-body">
                {ROSTER.map(([id, name, posted, closed], i) => <div key={id} className="sec-block" data-iq-target={`person-block-${id}`}>
                  <Row depth={0} index={i + 1} label={name} count={TAKEN.length} posted={posted} closed={closed} position="FD Staff" open={i === 0 && L >= 1} target={`person-${id}`}/>
                  {i === 0 && <Reveal open={L >= 1}><div className="sec-block" data-iq-target="surveys-block">{TAKEN.slice(0, 4).map(([label, type], k) => <div key={label} className="sec-block">
                    <Row depth={2} index={k + 1} label={label} count={1} posted={1} closed={1} type={type} open={k === 0 && L >= 2} toggle={k === 0} target={`survey-${k}`}/>
                    {k === 0 && <Reveal open={L >= 2}><Statements/></Reveal>}
                  </div>)}</div>
                  <div className="sec-block" data-iq-target="trainings-block">{TAKEN.slice(4).map(([label, type], k) => <Row key={label} depth={2} index={k + 5} label={label} count={1} posted={1} closed={1} type={type} toggle={false} target={`training-${k}`}/>)}</div></Reveal>}
                </div>)}
              </div></div>
            </div>
          </main>
        </div>
      </div>
    </div></div>
  </div>;
}

export default function RiskStage({state}) {
  const s = {...RISK_BASE, ...state};
  if (s.view === 'training') return <Training s={s}/>;
  if (s.view === 'report') return <Report s={s}/>;
  return <People s={s}/>;
}
