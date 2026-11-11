'use client';
// Reactive Training's art for the section videos (lib/sections/reactive-training.mjs), drawn from a state given as data:
//   audit     a safety audit by itself (the shared Panel): a Fail gives a lesson (a purple line to its card), the audit scrolls down, another Fail gives another (`failed`, `triggered`: checkpoint ids)
//   survey    a survey by itself: "How has your work been?" with four options to tick (Stressful is ticked), its Close
//   flow      the cards on their own that follow (FlowPart, parts.jsx): the closed survey and the lesson it gives
//   training  the lesson by itself: the product's opened Media mission, its text in the summary (so it is also a written notice), its quiz (the Improved Quality lesson screen in the
//             videos: the spec's `lessonTopics`)
import {useLayoutEffect, useRef, useState} from 'react';
import {FlowPart, card, AVATAR, FLOW} from './parts';
import {Panel, Question, Photo, MediaMission} from './trainingParts';
import {NOTICE} from '@/lib/sections/reactive-training.mjs';
import './reactive-training.css';

export const REACTIVE_BASE = {view: 'audit', closed: false, picked: [], failed: [], triggered: [], flow: 'survey', step: 0, expand: 1, pressed: null, done: [], scrollTo: 'top'};
const HINGE = '/demo-quality/damaged-hinge.png';
const lesson = (title, who, avatar) => ({kind: 'Media', points: 10, title, who, avatar, exec: null, pill: '00:00:00', tone: 'green'});

// ---- the audit: each Fail gives a lesson (the user, 2026-10-21: "if he fails on something, just show a purple line going to a mission, and then you scroll down, and then a purple line going to
// another mission"; the CEO, 2026-10-20: "when you say no it triggers that ... we don't need to be so loyal to the way the software works"): no Close, no closed audit. The audit is in the middle of the
// plate until a lesson comes, then it moves left (smaller than a phone view usually is: the lessons have to fit on the plate at its right) and each lesson is level with the checkpoint that gave it,
// its purple line out of that checkpoint's Fail (as far as the audit's window shows it: a checkpoint scrolled away under the summary keeps its lesson, the line from the window's top) ----
const AUDIT = {scale: 1.3, left: 341, aside: 106, gap: 70}; // (`aside`: where the audit is once a lesson shows: the audit, the lines and the lessons are centered on the plate together)
const LESSONS = {hinges: lesson('Workplace Safety', 'Ben R', AVATAR.ben), extinguishers: lesson('Fire Safety', 'Leo T', AVATAR.leo)};
function AuditPanel({s}) {
  const failed = id => (s.failed.includes(id) ? 1 : null);
  return <Panel kind="Audit" points={25} title="Kitchen Safety Audit" location="Kitchen / Safety" who="Anna F" date="09-23-26 09:00 AM" exec="00:04:48" timer="00:05:02" tone="green"
    footer={{label: 'Close', target: 'close', tone: 'primary'}} expand={s.expand} scrollTo={s.scrollTo} scale={AUDIT.scale} left={s.triggered.length ? AUDIT.aside : AUDIT.left}>
    <Question id="walkways" n={1} q="Walkways are clear of obstacles." options={['Pass', 'Fail']} answer={0}/>
    <Question id="hinges" n={2} q="Door hinges are in safe condition." options={['Pass', 'Fail']} answer={failed('hinges')}><Photo id="hinges" src={HINGE} file="Photo 9/23/2026 at 9:03:12 AM.jpg"/></Question>
    <Question id="extinguishers" n={3} q="Fire extinguishers are in place." options={['Pass', 'Fail']} answer={failed('extinguishers')}/>
  </Panel>;
}
function AuditView({s}) {
  const root = useRef(null), [links, setLinks] = useState({chips: [], lines: []});
  useLayoutEffect(() => { // (measured once the audit is laid out and scrolled: its own layout effect runs first)
    const panel = root.current?.querySelector('.sec-tr-panel'), stage = panel?.closest('#sec-stage') ?? panel?.offsetParent, chips = [], lines = [];
    if (panel && stage && s.triggered.length) {
      const S = stage.getBoundingClientRect(), k = S.width / (stage.offsetWidth || 1) || 1, n = v => Math.round(v), at = el => { const r = el.getBoundingClientRect(); return {x: n((r.left - S.left) / k), y: n((r.top - S.top) / k), w: n(r.width / k), h: n(r.height / k)}; }; // (whole px: a fraction that moves between two layouts would draw it again and again)
      const P = at(panel), W = at(panel.querySelector('.iq2-m-window')), C = at(panel.querySelector('.iq2-m-summary'));
      const top = Math.max(W.y, C.y + C.h) + 8, bottom = W.y + W.h - 8, x = P.x + P.w + AUDIT.gap;
      let below = 20;
      for (const id of s.triggered) {
        const fail = panel.querySelector(`[data-iq-target="${id}-fail"]`);
        if (!fail || !LESSONS[id]) continue;
        const F = at(fail), sy = Math.min(bottom, Math.max(top, F.y + F.h / 2)), y = Math.max(below, Math.min(880 - FLOW.h, sy - FLOW.h / 2)), cy = y + FLOW.h / 2, sx = F.x + F.w + 6, ex = x - FLOW.gap, mx = (sx + ex) / 2;
        below = y + FLOW.h + 24;
        chips.push(card(`lesson-${id}`, x, y, LESSONS[id]));
        lines.push({id: `link-${id}`, d: Math.abs(sy - cy) < 1 ? `M${sx} ${sy} L${ex} ${cy}` : `M${sx} ${sy} L${mx} ${sy} L${mx} ${cy} L${ex} ${cy}`});
      }
    }
    if (JSON.stringify({chips, lines}) !== JSON.stringify(links)) setLinks({chips, lines});
  });
  return <div ref={root} style={{display: 'contents'}}><AuditPanel s={s}/><FlowPart chips={links.chips} lines={links.lines} center={false}/></div>;
}
// ---- the survey and the lesson by themselves ----
const MOODS = ['Comfortable', 'Boring', 'Confusing', 'Stressful'];
function SurveyPanel({s}) {
  return <Panel kind="Survey" points={10} title="Weekly Check-In" location="Kitchen / People" who="Dan K" date="09-23-26 04:30 PM" exec="00:00:41" timer="00:02:16" tone={s.closed ? 'gray' : 'green'}
    footer={{label: s.closed ? 'Closed' : 'Close', target: 'close', tone: s.closed ? 'closed' : 'primary'}} expand={s.expand}>
    <Question id="mood" n={1} q="How has your work been?" hint="*select multiple options" kind="multi" options={MOODS} answer={s.picked.map(m => MOODS.indexOf(m))}/>
  </Panel>;
}
function TrainingPanel({s}) { // (the lesson is a Media mission: the product's opened Media mission, its text in the summary: a written notice; its quiz plays as the lesson screen)
  return <MediaMission title="How To Inform Management" location="Kitchen / People" who="Dan K" date="09-23-26" time="04:31 PM" points={10} pill="00:00:12" exec="00:00:06" description={NOTICE.join(' ')}
    estimated="00:40" rows={[['lesson', 'audio', 'How To Inform Management', '00:40'], ['quiz', 'quiz', 'Quiz', 'N/A']]} pressed={s.pressed} done={s.done} expand={s.expand}/>;
}

// ---- the cards on their own ----
const SURVEY_CARD = {kind: 'Survey', points: 10, title: 'Weekly Check-In', who: 'Dan K', exec: '00:00:52', pill: '00:02:27', tone: 'gray'};
function flowOf(s) {
  const left = 70, right = 570, mid = 374, {w: W, h: H, gap} = FLOW;
  // the answer "Stressful" gives a lesson to the one who gave it
  const chips = [card('survey', left, mid, SURVEY_CARD)], lines = [];
  if (s.step >= 1) { chips.push(card('inform', right, mid, lesson('How To Inform Management', 'Dan K', AVATAR.dan))); lines.push({id: 'arrow', from: [left + W + gap, mid + H / 2], to: [right - gap, mid + H / 2]}); }
  return {chips, lines};
}

export default function ReactiveStage({state}) {
  const s = {...REACTIVE_BASE, ...state};
  if (s.view === 'survey') return <SurveyPanel s={s}/>;
  if (s.view === 'training') return <TrainingPanel s={s}/>;
  if (s.view === 'flow') { const f = flowOf(s); return <FlowPart chips={f.chips} lines={f.lines}/>; }
  return <AuditView s={s}/>;
}
