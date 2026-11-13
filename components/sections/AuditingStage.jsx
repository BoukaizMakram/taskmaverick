'use client';
// Dynamic Auditing's art for the section videos (lib/sections/dynamic-auditing.mjs): the tablet board of audits, the audit by itself (steps, a hazard with its video, the training and its quiz),
// the cards that follow from it (corrective action, follow-up audit, micro-trainings) with their connectors, the Knowledge Base and the web gallery. Each is a state given as data.
import {useLayoutEffect, useRef} from 'react';
import {TabletPart, MissionPanel, FlowPart, mission} from './parts';
import {KnowledgeBase} from '../ImprovedQualityV2Panels';
import LiveOversightStage from './LiveOversightStage';

const SHELVING = '/demo-quality/shelving.png', HAZARD = '/demo-quality/damaged-hinge.png', CLIP = '/demo-quality/condition-report.mp4';
export const AUDITING_BASE = {view: 'board', audits: 4, menu: false, kb: false, expand: 1, steps: 0, hazard: 'none', scrollTo: 'top', link: false, flow: 'corrective', flowStep: 0, panel: 'audit', training: 'none', watch: 0, quiz: [null, null], gallery: false, reportScroll: 0};

const DIRECTIONS = ['North', 'South', 'East', 'West'];
export const AUDITS = n => DIRECTIONS.slice(0, n).map((d, i) => mission(`audit-${d}`, `${d} Building Audit`, 'Audit', 'open', {points: 25, ageSeconds: 14 + (n - i) * 9, openOrder: i, time: '08:00 AM', date: '09-23-26'}));

// ---- the audit by itself ----
const QUESTIONS = ['Are all fire exits clear?', 'Are the fire extinguishers charged and in place?', 'Is the emergency lighting working?'];
// (the Remotion cut, components/remotion/AuditingCut.jsx, draws these panels itself by its clock: `s.place` {left, top, scale} where the panel stands, `s.scrollMix` {from, to, p} its scroll, `s.grow` how
// far the corrective mission and the training are open; the slides' states have none of them and are drawn as they were)
export function AuditPanel({s}) {
  const answered = i => (s.steps > i ? 'yes' : null);
  const items = QUESTIONS.map((q, i) => ({id: String(i), type: 'yesno', q, answer: answered(i)}));
  const hazardProof = s.hazard === 'ask' ? {kind: 'video', state: 'ask'} : s.hazard === 'rec' ? {kind: 'video', state: 'rec', src: CLIP, poster: HAZARD, rec: 4} : s.hazard === 'done' ? {kind: 'video', state: 'done', src: CLIP, poster: HAZARD, file: 'Video 9/23/2026 at 8:14:31 AM.mp4'} : null;
  items.push({id: 'hazard', type: 'yesno', q: 'Are there any safety hazards?', answer: s.hazard === 'none' ? null : 'yes', proof: hazardProof});
  const count = (s.steps) + (s.hazard === 'done' ? 1 : 0);
  return <MissionPanel kind="Audit" title="North Building Audit" location="North Building / Safety" who="Anna F" date="09-23-26 08:00 AM" timer="00:00:14" status="claimed"
    brief={{instructions: 'Walk the building and check every point below. Report anything that is not safe.', alert: 'Photograph or film every hazard you find.', link: s.link ? 'View the audit standards guide' : null}}
    groupTitle={{name: 'Audit', count: `${count}/4`}} items={items} scrollTo={s.scrollTo} scrollMix={s.scrollMix} expand={s.expand} {...(s.place ?? {})}/>;
}

// ---- the mission with its video evidence, or a training ----
export function CorrectivePanel({s}) {
  return <MissionPanel kind="Task" points={10} title="Correct Safety Hazard" location="North Building / Safety" who={s.panel === 'corrective-closed' ? 'Carla M' : 'Posted by Anna F'} date="09-23-26 08:15 AM" timer={s.panel === 'corrective-closed' ? '00:07:12' : '00:00:21'} tone={s.panel === 'corrective-closed' ? 'gray' : 'green'}
    brief={{instructions: 'Repair the damaged door hinge on the walk-in cooler.', alert: 'Watch the video of the hazard first.'}}
    items={[{id: 'evidence', type: 'training', q: 'Evidence from the audit', title: 'Damaged door hinge', poster: HAZARD, meta: 'Video · 0:06', done: false, player: s.watch ? {src: CLIP, poster: HAZARD, time: s.watch, length: 6} : null}]} scrollTo="top" expand={s.grow ?? 1} closed={s.panel === 'corrective-closed'} {...(s.place ?? {})}/>;
}
export function TrainingPanel({s}) {
  const text = s.training === 'text' || s.training === 'quiz';
  return <MissionPanel kind="Media" points={10} title="Safety Training" location="North Building / Safety" who="Ben R" date="09-23-26 08:16 AM" timer="00:00:09"
    brief={{instructions: 'Read the notice below and answer the quiz.'}}
    items={[{id: 'lesson', type: 'training', q: 'Please complete this training before proceeding.', title: 'Keeping Fire Exits Clear', poster: SHELVING, meta: 'Text · 1 min', done: s.training === 'done',
      text: text ? ['Fire exits must be clear at all times.', 'Never store boxes, carts or equipment in front of an exit or in a corridor that leads to one.', 'Tell your manager at once if you see a blocked exit.'] : null,
      quiz: s.training === 'quiz' ? {answers: s.quiz, questions: [{q: 'A fire exit may be used to store boxes for a short time.', options: ['True', 'False']}, {q: 'Tell your manager at once if an exit is blocked.', options: ['True', 'False']}]} : null}]}
    scrollTo={s.training === 'quiz' ? 'quiz-lesson' : 'top'} scrollMix={s.scrollMix} expand={s.grow ?? 1} {...(s.place ?? {})}/>;
}

// ---- the cards that follow an audit (Isolated missions) ----
const AVATAR = {anna: '/avatars/02.png', ben: '/avatars/03.png', leo: '/avatars/01.png', carla: '/avatars/04.png'};
const SCALE = 1.2, W = 334 * SCALE, H = 152; // a card on its own, as wide as it is drawn; about as tall
const card = (id, x, y, m, extra = {}) => ({id, x, y, mission: m, scale: SCALE, ...extra});
const AUDIT_CARD = {kind: 'Audit', points: 25, title: 'North Building Audit', who: 'Anna F', exec: '00:04:48', pill: '00:05:10', tone: 'gray'};
const FIX_OPEN = {kind: 'Task', points: 10, title: 'Correct Safety Hazard', who: null, exec: null, pill: '00:00:00', tone: 'green'};
const FIX_DONE = {kind: 'Task', points: 10, title: 'Correct Safety Hazard', who: 'Carla M', avatar: AVATAR.carla, exec: '00:07:12', pill: '00:07:26', tone: 'gray'};
export function flowOf(s) {
  const left = 70, right = 570, mid = 360, step = s.flowStep, gap = 10;
  if (s.flow === 'corrective') { // the hazard triggers a corrective action: it pops to the right of the audit
    const chips = [card('audit', left, mid, AUDIT_CARD)], lines = [];
    if (step >= 1) { lines.push({id: 'arrow', from: [left + W + gap, mid + H / 2], to: [right - gap, mid + H / 2]}); chips.push(card('corrective', right, mid, FIX_OPEN)); }
    return {chips, lines};
  }
  if (s.flow === 'time') { // the corrective mission, closed: its execution time and who did it
    return {chips: [card('audit', left, mid, AUDIT_CARD), card('corrective', right, mid, FIX_DONE)], lines: [{id: 'arrow', from: [left + W + gap, mid + H / 2], to: [right - gap, mid + H / 2]}]};
  }
  if (s.flow === 'followup') { // once it is corrected, a follow-up audit is assigned
    const top = 150, low = 520, chips = [card('audit', left, top, AUDIT_CARD), card('corrective', right, top, FIX_DONE)];
    const lines = [{id: 'arrow-1', from: [left + W + gap, top + H / 2], to: [right - gap, top + H / 2]}];
    if (step >= 1) { lines.push({id: 'arrow-2', d: `M${right + W / 2} ${top + H + gap} L${right + W / 2} ${(top + low) / 2 + 40} L${left + W / 2} ${(top + low) / 2 + 40} L${left + W / 2} ${low - gap - 4}`}); chips.push(card('followup', left, low, {kind: 'Audit', points: 25, title: 'North Building Audit-2', who: null, exec: null, pill: '00:00:00', tone: 'green'})); }
    return {chips, lines};
  }
  if (s.flow === 'training') { // the same checkpoint assigns a micro-training to two people
    const chips = [card('audit', left, mid, AUDIT_CARD)], lines = [], upper = 180, lower = 540, bus = left + W + 50;
    if (step >= 1) {
      chips.push(card('training-1', right, upper, {kind: 'Media', points: 10, title: 'Safety Training', who: 'Ben R', avatar: AVATAR.ben, exec: null, pill: '00:00:00', tone: 'green'}), card('training-2', right, lower, {kind: 'Media', points: 10, title: 'Safety Training', who: 'Leo T', avatar: AVATAR.leo, exec: null, pill: '00:00:00', tone: 'green'}));
      lines.push({id: 'branch-1', d: `M${left + W + gap} ${mid + H / 2} L${bus} ${mid + H / 2} L${bus} ${upper + H / 2} L${right - gap} ${upper + H / 2}`}, {id: 'branch-2', d: `M${bus} ${mid + H / 2} L${bus} ${lower + H / 2} L${right - gap} ${lower + H / 2}`});
    }
    return {chips, lines};
  }
  return {chips: [], lines: []};
}

// ---- the whole stage ----
export default function AuditingStage({state}) {
  const s = {...AUDITING_BASE, ...state};
  if (s.view === 'web') return <LiveOversightStage state={{page: 'usage', pan: 340, groupBy: 'Checkpoint', gallery: s.gallery, reportScroll: s.reportScroll}}/>;
  if (s.view === 'mission') return s.panel === 'audit' ? <AuditPanel s={s}/> : s.panel.startsWith('corrective') ? <CorrectivePanel s={s}/> : <TrainingPanel s={s}/>;
  if (s.view === 'flow') { const f = flowOf(s); return <FlowPart chips={f.chips} lines={f.lines}/>; }
  const overlay = s.kb ? <KnowledgeBase frame={{kb: {reveal: 1, since: 9, viewer: 0, video: 0}}} playing={false} speed={1}/> : null;
  return <TabletPart title="Facilities Audits" missions={AUDITS(s.audits)} menu={s.menu} overlay={overlay}/>;
}
