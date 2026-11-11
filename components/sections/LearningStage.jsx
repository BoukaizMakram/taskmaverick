'use client';
// Learning Efficiency's art for the section videos (lib/sections/learning-efficiency.mjs): the lesson on the phone (its video playing, then skipped by a swipe up to the quiz, the quiz
// failed and the lesson repeated), the Overview's Course board in its History view (how long each lesson took) with the side window of one lesson (its budget, its execution), the work
// mission whose 4th step is a training that pops out as a video beside it, the audit and the test that trigger trainings, the Knowledge Base on the tablet, and the certificate that
// leads to a training. Each is a state given as data; what moves between two states is the same DOM, so the video moves it.
// The quiz is the Improved Quality one (lib/storyboardLesson.mjs: the video plays the lesson screen with this section's topic, `lessonTopics` in the spec): the quiz page here is drawn
// exactly as that screen is, so the one is put in the place of the other without a seam.
import {useLayoutEffect, useRef} from 'react';
import {TabletPart, FlowPart, mission, card, AVATAR, FLOW} from './parts';
import {IconBack} from '../PhoneShell';
import {KnowledgeBase} from '../ImprovedQualityV2Panels';
import AuditingStage from './AuditingStage';
import CertificationStage, {WebChrome, TOOL_ICON} from './CertificationStage';
import {BOARDS} from '@/lib/overviewModel.mjs';
import spec from '@/lib/sections/learning-efficiency.mjs';
import './learning-efficiency.css';

export const LEARNING_BASE = {view: 'lesson', page: 0, t: 1, ticks: '00', failed: false, sent: false, drawer: 0, expand: 1, scrollTo: 'top', side: 0, flowStep: 1, menu: false, kb: false, certScene: 'cert'};
const FIRST = '/demo-quality/shelving.png', LENGTH = 6; // (the training's picture: the first one of the shelving clip, public/demo-quality/shelving-training.mp4; a still, the bar under it moves)
// The lesson's quiz: the spec's own topic (the video plays the Improved Quality lesson screen with the same words)
export const TOPIC = spec.lessonTopics['learning-shelves'];

// ---- the lesson on the phone: the Improved Quality lesson screen (lib/storyboardLesson.mjs: its video on top, playing, with its own track; the Quiz bar; the quiz), and under it the
// same screen once the video is skipped (its written notice in the place of the video: the topic the video plays). The bar's down arrow goes to it: the screen scrolls up. When the quiz
// is failed, the product's own words ("The lesson will repeat until you pass.", components/sim/SimLayers.jsx) are under the quiz and the video starts again ----
const Up = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M4.8 9.2 10 4l5.2 5.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Down = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4.8 10.8 10 16l5.2-5.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Tick = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.6 10.6 8.4 14.4 15.6 6.2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Bar = ({label, down}) => <div className="sec-le-lq-bar"><b>{label}</b><span className="sec-le-lq-arrows"><i><Up/></i><i data-iq-target={down}><Down/></i></span></div>; // (`down`: the arrow to the next page has a name: the cursor presses it to skip)
function Lesson({s}) {
  const left = Math.max(0, LENGTH - s.t), fill = Math.min(1, s.t / LENGTH) * 100;
  return <div className="iq2-mission" data-sec-part="Mission" style={{left: 341, top: 163, width: 360, height: 573, transform: 'scale(1.5)'}}>
    <div className="iq2-m sec-le-lq" lang="en" style={{clipPath: 'inset(0px round 18px)'}}>
      <div className="sec-le-pager" style={{transform: `translateY(${-573 * s.page}px)`}}>
        <section className="sec-le-page" data-iq-target="video-page">
          <div className="sec-le-lq-video" data-iq-target="lesson-video"><span className="sec-le-picture" style={{backgroundImage: `url('${FIRST}')`}}/><div className="sec-le-lq-track"><span className="sec-le-lq-rail"><i style={{width: `${fill}%`}}/></span><time>0:0{Math.ceil(left)}</time></div></div>
          <Bar label="Quiz" down="skip"/>
          <div className="sec-le-lq-body"><p className="sec-le-lq-q"><b>1. Please select ALL of the correct statements.</b><small>*select the correct options</small></p>
            {TOPIC.statements.map((text, i) => <div key={i} className="sec-le-lq-opt"><span className="sec-le-lq-box"/><span className="sec-le-lq-text">{text}</span></div>)}
            <p className="sec-le-sfailed" data-iq-target="failed" style={{opacity: s.failed ? 1 : 0}}>The lesson will repeat until you pass.</p>
          </div>
          <div className="sec-le-lq-submit">Submit &amp; Close</div>
        </section>
        <section className="sec-le-page" data-iq-target="quiz-page">
          <div className="sec-le-lq-video is-notice"><div className="sec-le-lq-notice"><b>{TOPIC.title}</b>{TOPIC.notice.map(p => <p key={p}>{p}</p>)}</div></div>
          <Bar label="Quiz"/>
          <div className="sec-le-lq-body"><p className="sec-le-lq-q"><b>1. Please select ALL of the correct statements.</b><small>*select the correct options</small></p>
            {TOPIC.statements.map((text, i) => <div key={i} className={`sec-le-lq-opt${s.ticks[i] === '1' ? ' is-on' : ''}`}><span className="sec-le-lq-box" data-iq-target={`lq-box-${i + 1}`}>{s.ticks[i] === '1' ? <Tick/> : null}</span><span className="sec-le-lq-text">{text}</span></div>)}
          </div>
          <div className={`sec-le-lq-submit${s.sent ? ' is-sent' : ''}`} data-iq-target="lq-submit">Submit &amp; Close</div>
        </section>
      </div>
    </div>
  </div>;
}

// ---- Overview › Course › History: how long each lesson took, and the side window of one ----
const LESSON_ROWS = [
  ['Ben R', 'Food Safety Basics', [['stocking', 'Stocking Shelves Safely', 'Media', '09/21/2026 08:00 AM', '00:01:46', '00:02:10', '09/21/2026 08:02 AM'], ['temps', 'Safe Food Temperatures', 'Media', '09/21/2026 08:03 AM', '00:02:31', '00:02:52', '09/21/2026 08:06 AM'], ['hands', 'Handwashing Basics', 'Media', '09/21/2026 08:06 AM', '00:01:58', '00:02:14', '09/21/2026 08:08 AM'], ['quiz', 'Food Safety Test', 'Test', '09/21/2026 08:09 AM', '00:01:12', '00:01:33', '09/21/2026 08:10 AM']]],
  ['Carla M', 'Food Safety Basics', [['c1', 'Stocking Shelves Safely', 'Media', '09/22/2026 07:30 AM', '00:02:05', '00:02:21', '09/22/2026 07:32 AM'], ['c2', 'Safe Food Temperatures', 'Media', '09/22/2026 07:33 AM', '00:01:51', '00:02:09', '09/22/2026 07:35 AM'], ['c3', 'Handwashing Basics', 'Media', '09/22/2026 07:36 AM', '00:01:37', '00:01:58', '09/22/2026 07:38 AM'], ['c4', 'Food Safety Test', 'Test', '09/22/2026 07:39 AM', '00:01:24', '00:01:41', '09/22/2026 07:41 AM']]],
  ['Leo T', 'Forklift Safety', [['l1', 'Pre-Use Inspection', 'Media', '09/22/2026 09:00 AM', '00:02:44', '00:03:02', '09/22/2026 09:03 AM'], ['l2', 'Safe Loading', 'Media', '09/22/2026 09:04 AM', '00:02:12', '00:02:30', '09/22/2026 09:06 AM'], ['l3', 'Forklift Test', 'Test', '09/22/2026 09:07 AM', '00:01:49', '00:02:05', '09/22/2026 09:09 AM']]],
];
const Toggle = () => <span className="sec-le-toggle" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m4.2 6.2 3.8 3.8 3.8-3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
const Ic = ({d, className = 'sec-pl-ic'}) => <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const FUNNEL = 'M4 5h16l-6.3 7.2v5.3l-3.4 2v-7.3z', EYE = 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', CLOSE = 'M6 6l12 12M18 6 6 18', CHECK = 'm5 12.5 4.5 4.5L19 7.5';
function History({s}) {
  return <div className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: 'translateX(0px)', height: 776, width: 1110}}><div className="iq-ol-page">
      <div className="ow-workspace iq-ow sec-pl sec-le-web" aria-label="Taskmaverick web: Overview, Course, History">
        <WebChrome active="Overview" tabs={BOARDS} tab="Course" right={<nav className="ow-view-nav">{['History', 'Running', 'Scheduled'].map(n => <span key={n} className={n === 'History' ? 'is-active' : undefined}>{n}</span>)}</nav>}
          tools={<><span className="ow-tool"><Ic d={FUNNEL} className="sec-pl-ic is-orange"/>Filter: New Filter</span><span className="ow-tool"><Ic d={TOOL_ICON.list}/>Group by: Person</span><span className="ow-tool"><Ic d={TOOL_ICON.tree}/>Expand/Collapse</span><span className="ow-tool"><Ic d={EYE}/>Hide/Show Column</span><span className="ow-tool"><Ic d={TOOL_ICON.cloud}/>Export</span><span className="sec-le-range">09/01/2026 – 09/30/2026</span></>}/>
        <div className="sec-le-table">
          <div className="sec-le-row is-head">{['Name', 'Closed By', 'Claimed', 'Duration', 'Closed At', 'Type', 'Position - Closed by'].map(h => <span key={h}><b>{h}</b>{h !== 'Closed At' && <i>⋮</i>}</span>)}</div>
          <div className="sec-scroll"><div className="sec-le-body">
            {LESSON_ROWS.map(([who, course, lessons], p) => <div key={who} className="sec-block">
              <div className="sec-le-row is-person"><span className="sec-le-name"><Toggle/><em>{p + 1}.</em><b>{who}</b><small>1</small></span>{[0, 1, 2, 3, 4, 5].map(i => <span key={i} className="is-dash">-</span>)}</div>
              <div className="sec-le-row is-course"><span className="sec-le-name is-course"><i className="sec-le-branch"/><Toggle/><em>1.</em><b>{course}</b><small>{lessons.length}</small></span><span className="is-dash">-</span><span className="is-dash">-</span><span className="is-dash">-</span><span className="is-dash">-</span><span>Course</span><span className="is-dash">-</span></div>
              {lessons.map(([id, title, type, opened, claimed, duration, closed], i) => <div key={id} className="sec-le-row is-lesson">
                <span className="sec-le-name is-lesson"><i className="sec-le-branch is-deep" data-last={i === lessons.length - 1 ? '1' : undefined}/><em>{i + 1}.</em><span data-iq-target={`row-${id}`}>{title}</span></span>
                <span>{who}</span><span className="is-pill"><i>{claimed}</i></span><span className="is-pill"><i data-iq-target={`dur-${id}`}>{duration}</i></span><span>{closed}</span><span>{type}</span><span><i className="sec-pl-tag">Staff</i></span>
              </div>)}
            </div>)}
          </div></div>
          <i className="sec-le-col" data-iq-target="col-claimed" style={{left: 440, width: 125}}/>
          <i className="sec-le-col" data-iq-target="col-duration" style={{left: 565, width: 125}}/>
        </div>
        <aside className="iq-od sec-le-drawer" aria-label="Lesson details" style={{transform: `translateX(${(1 - s.drawer) * 104}%)`}}>
          <header><h2>Stocking Shelves Safely</h2><span className="iq-od-close"><Ic d={CLOSE} className=""/></span></header>
          <div className="iq-od-chips"><span>Media</span><span>Food Safety Basics</span></div>
          <nav className="iq-od-tabs"><span className="is-active">Response</span><span>Info</span><span>Content</span></nav>
          <div className="iq-od-body">
            <div className="iq-od-performer"><i><Ic d={CHECK} className=""/></i>Ben R</div>
            <section className="iq-od-card is-data" data-iq-target="drawer-video"><div className="iq-od-q"><span><small>1.</small>Stocking Shelves Safely</span><em>Video</em></div><small className="iq-od-label">Response</small><div className="iq-od-value"><b>Skipped to the quiz at 0:02</b></div></section>
            <section className="iq-od-card is-data" data-iq-target="drawer-quiz"><div className="iq-od-q"><span><small>2.</small>Please select ALL of the correct statements.</span><em>Quiz</em></div><small className="iq-od-label">Response</small><div className="iq-od-value"><b>Passed · 2 of 2 correct</b></div></section>
          </div>
        </aside>
      </div>
    </div></div>
  </div>;
}

// ---- the work mission: its 4th step is a training, which pops out beside it as its lesson screen, the video playing on top ----
const Box = ({checked}) => <span className={`iq-checkbox${checked ? ' is-checked' : ''}`} aria-hidden="true">{checked ? '✓' : ''}</span>;
const Play = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z"/></svg>;
const Pause = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>;
const STEPS = ['Are all surfaces sanitized?', 'Is the walk-in cooler door sealed?', 'Are the floors mopped?'];
// the shelving lesson's own quiz (lib/storyboardLesson.mjs: the Improved Quality lesson screen)
const SHELVING = ['Heavy items are stored on the lower shelves, and lighter items on the upper shelves.', 'Every container is labeled, with its label facing out, and older stock is used first.', 'It is OK to leave boxes on the floor in front of the shelves, when the shelves are full.'];
function Work({s}) {
  const root = useRef(null), side = s.side, k = side ? 1.2 : 1.5, left = side ? 110 : 341; // (with the lesson beside it: the two phones, 1.2 times as big, side by side round x 521)
  useLayoutEffect(() => { // (MissionPanel's own: the content scrolled under the pinned chip, the card popped then expanded)
    const box = root.current.querySelector('.iq2-mission'), content = box.querySelector('.iq2-m-content'), win = box.querySelector('.iq2-m-window'), chip = box.querySelector('.iq2-m-summary');
    const at = key => { if (key === 'top') return 0; const el = content.querySelector(`[data-iq-target="${key}"]`); return el ? el.getBoundingClientRect().top - content.getBoundingClientRect().top : 0; };
    const kk = content.getBoundingClientRect().height / content.offsetHeight || 1, max = Math.max(0, content.offsetHeight - win.clientHeight);
    const y = Math.min(max, Math.max(0, at(s.scrollTo) / kk - chip.offsetHeight - 8));
    content.style.transform = `translateY(${-y}px)`; chip.style.transform = `translateY(${y}px)`;
    chip.style.boxShadow = y > 2 ? '0 10px 14px -10px rgb(21 39 54 / 30%)' : 'none';
    const H = box.offsetHeight, top = chip.offsetTop + win.offsetTop, bottom = top + chip.offsetHeight, e = s.expand, shift = (H / 2 - (top + bottom) / 2) * (1 - e);
    box.style.transform = `translateY(${shift * k}px) scale(${k})`;
    box.firstElementChild.style.clipPath = `inset(${top * (1 - e)}px 0px ${(H - bottom) * (1 - e)}px 0px round ${14 + 4 * e}px)`; // (always an inset: the video moves from the card to the opened mission)
  });
  return <div ref={root} className="sec-le-work" data-sec-part="Mission">
    <div className="iq2-mission" style={{left, top: 163, width: 360, height: 573, transform: `scale(${k})`}}>
      <div className="iq2-m">
        <header className="iq2-m-head"><span className="iq2-m-back"><IconBack/></span><b>Mission Details</b></header>
        <div className="iq2-m-window" data-sec-window><div className="iq2-m-content">
          <section className="iq2-m-summary" data-iq-target="mission-chip">
            <div className="iq2-m-kind"><img src="/mission-logo.png" alt=""/><span>Checklist</span><b>25</b><em className="sec-timer sec-timer--green" data-iq-target="mission-timer">00:06:12</em></div>
            <h3>Closing Checklist</h3><small>Kitchen / Closing</small>
            <div className="iq2-m-meta"><span>Ben R</span><time>09-23-26 09:40 PM</time></div>
          </section>
          <section className="iq2-m-brief"><p data-iq-target="instructions">Close the kitchen step by step. Every step is checked before the next.</p></section>
          {STEPS.map((q, i) => <section className="iq2-m-cp" key={q} data-iq-target={`cp-${i + 1}`}><b>{i + 1}. {q}</b>
            <div className="iq2-m-options"><span className="is-selected"><Box checked/>Yes</span><span><Box/>No</span></div></section>)}
          <section className="iq2-m-cp" data-iq-target="cp-4"><b>4. Restock the dry storage shelves.</b>
            <div className="iq2-m-tile" data-iq-target="training-4">
              <span className="iq2-m-thumb" data-iq-target="play-4" style={{backgroundImage: `url('${FIRST}')`}}><i><Play/></i></span>
              <span className="iq2-m-tile-text"><b>{TOPIC.title}</b><small>Training · Video · 0:06</small></span>
            </div>
          </section>
          <section className="iq2-m-cp" data-iq-target="cp-5"><b>5. Is the back door locked?</b>
            <div className="iq2-m-options"><span><Box/>Yes</span><span><Box/>No</span></div></section>
        </div></div>
      </div>
    </div>
    <div className="iq2-mission sec-le-side" data-iq-target="side-video" style={{left: 572, top: 163, width: 360, height: 573, opacity: side ? 1 : 0, visibility: side ? 'visible' : 'hidden', transform: `translateX(${side ? 0 : -90}px) scale(${side ? 1.2 : 1.02})`}}>
      <div className="iq2-m sec-le-lq" lang="en" style={{clipPath: 'inset(0px round 18px)'}}>
        <div className="sec-le-lq-video"><span className="sec-le-picture" style={{backgroundImage: `url('${FIRST}')`}}/><div className="sec-le-lq-track"><span className="sec-le-lq-rail"><i style={{width: `${Math.min(1, s.t / LENGTH) * 100}%`}}/></span><time>0:0{Math.max(0, Math.ceil(LENGTH - s.t))}</time></div></div>
        <Bar label="Quiz"/>
        <div className="sec-le-lq-body"><p className="sec-le-lq-q"><b>1. Please select ALL of the correct statements.</b><small>*select the correct options</small></p>
          {SHELVING.map(text => <div key={text} className="sec-le-lq-opt"><span className="sec-le-lq-box"/><span className="sec-le-lq-text">{text}</span></div>)}
        </div>
        <div className="sec-le-lq-submit">Submit &amp; Close</div>
      </div>
    </div>
  </div>;
}

// ---- a test whose wrong answers assign lessons (the cards on their own, as Dynamic Auditing's audit that assigns trainings) ----
function TestFlow({s}) {
  const left = 70, mid = 360, right = 570, upper = 180, lower = 540, W = FLOW.w, H = FLOW.h, gap = FLOW.gap, bus = left + W + 50;
  const chips = [card('test', left, mid, {kind: 'Test', points: 20, title: 'Food Safety Test', who: 'Ben R', avatar: AVATAR.ben, exec: '00:03:12', pill: '00:03:40', tone: 'gray'})], lines = [], labels = [];
  if (s.flowStep >= 1) {
    chips.push(card('lesson-1', right, upper, {kind: 'Media', points: 10, title: 'Safe Food Temperatures', who: 'Ben R', avatar: AVATAR.ben, exec: null, pill: '00:00:00', tone: 'green'}), card('lesson-2', right, lower, {kind: 'Media', points: 10, title: 'Cross-Contamination', who: 'Ben R', avatar: AVATAR.ben, exec: null, pill: '00:00:00', tone: 'green'}));
    lines.push({id: 'wrong-1', d: `M${left + W + gap} ${mid + H / 2} L${bus} ${mid + H / 2} L${bus} ${upper + H / 2} L${right - gap} ${upper + H / 2}`}, {id: 'wrong-2', d: `M${bus} ${mid + H / 2} L${bus} ${lower + H / 2} L${right - gap} ${lower + H / 2}`});
    labels.push({x: bus - 222, y: upper + H / 2, text: 'Question 2: wrong'}, {x: bus - 222, y: lower + H / 2, text: 'Question 4: wrong'}); // (left of the connector, where the test card leaves room)
  }
  return <FlowPart chips={chips} lines={lines} labels={labels}/>;
}

// ---- the team's tablet and its Knowledge Base ----
const BOARD = [['open-1', 'Opening Checklist', 'Checklist', 25, 1500], ['open-2', 'Restock Dry Storage', 'Task', 10, 1210], ['open-3', 'Clean The Slicer', 'Task', 10, 980], ['open-4', 'Closing Checklist', 'Checklist', 25, 640]];
const missionsOf = () => BOARD.map(([id, title, type, points, age], i) => mission(id, title, type, 'open', {points, ageSeconds: age, openOrder: i, date: '09-23-26', time: '08:00 AM'}));

export default function LearningStage({state}) {
  const s = {...LEARNING_BASE, ...state};
  if (s.view === 'web') return <History s={s}/>;
  if (s.view === 'work') return <Work s={s}/>;
  if (s.view === 'audit') return <AuditingStage state={{view: 'flow', flow: 'training', flowStep: s.flowStep}}/>;
  if (s.view === 'test') return <TestFlow s={s}/>;
  if (s.view === 'cert') return <CertificationStage state={{view: 'cert', scene: s.certScene, renewKind: 'Media', renewTitle: 'Food Safety Refresher'}}/>;
  if (s.view === 'board') {
    const overlay = s.kb ? <KnowledgeBase frame={{kb: {reveal: 1, since: 9, viewer: 0, video: 0}}} playing={false} speed={1}/> : null;
    return <TabletPart title="Kitchen Team" missions={missionsOf()} menu={s.menu} overlay={overlay}/>;
  }
  return <Lesson s={s}/>;
}
