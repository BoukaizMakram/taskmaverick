'use client';
// Exception Management's art for the section videos (lib/sections/exception-management.mjs): what raises an alert (a temperature out of range, an audit finding, a delay, an execution that took
// too little, poor ratings, a survey answer) and the alert ticket that goes to the manager, as the mission or the card it comes from, an arrow, and the ticket popping (Isolated missions).
import {TabletPart, MissionPanel, FlowPart, mission, AVATAR, card, across, FLOW} from './parts';

const HINGE = '/demo-quality/damaged-hinge.png', CLIP = '/demo-quality/condition-report.mp4';
export const EXCEPTIONS_BASE = {view: 'board', tickets: 0, kind: 'data', step: 0, alert: 0};

// ---- the mission the cause is in, at the left ----
const PANEL = {scale: 1.2}; // (the phone view is centered on the plate, and stays there: the ticket pops over its empty lower part)
function CausePanel({s}) {
  if (s.kind === 'data') return <MissionPanel {...PANEL} kind="Checklist" points={25} title="Walk-In Cooler Temp" location="Kitchen / Cold Storage" who="Anna F" date="09-23-26 09:10 AM" timer="00:04:12"
    items={[{id: 'door', type: 'yesno', q: 'Is the cooler door sealed?', answer: 'yes'}, {id: 'temp', type: 'number', q: 'Cooler temperature', value: s.step >= 1 ? 52 : null, unit: '°F', flag: s.step >= 1}]} scrollTo="top"/>;
  if (s.kind === 'audit') return <MissionPanel {...PANEL} kind="Audit" points={25} title="Closing Audit" location="Kitchen / Safety" who="Anna F" date="09-23-26 10:02 PM" timer="00:06:48"
    items={[{id: 'exits', type: 'yesno', q: 'Are all exits clear?', answer: 'yes'}, {id: 'hazard', type: 'yesno', q: 'Are there any safety hazards?', answer: s.step >= 1 ? 'yes' : null, proof: s.step >= 1 ? {kind: 'video', state: 'done', src: CLIP, poster: HINGE, file: 'Video 9/23/2026 at 10:04:51 PM.mp4'} : null}]} scrollTo="top"/>;
  return <MissionPanel {...PANEL} kind="Survey" points={10} title="Safety Survey" location="Kitchen / Safety" who="Ben R" date="09-23-26 05:30 PM" timer="00:02:15"
    items={[{id: 'safe', type: 'yesno', q: 'Did you feel safe today?', answer: 'yes'}, {id: 'injured', type: 'yesno', q: 'Have you been injured?', answer: s.step >= 1 ? 'yes' : null}]} scrollTo="top"/>;
}
const ALERTS = {data: 'Temperature Alert', audit: 'Safety Alert', surveys: 'Injury Alert', delays: 'Performance Delays', executions: 'Quality Concern', ratings: 'Low Rating Alert'};
const WHY = {'Temperature Alert': 'Cooler temperature: 52°F (the limit is 41°F).', 'Safety Alert': 'Are there any safety hazards? Yes.', 'Injury Alert': 'Have you been injured? Yes.', 'Performance Delays': 'Check Inventory has been open for too long.', 'Quality Concern': 'Clean Room was done in 1 minute.', 'Low Rating Alert': 'Clean Room was rated 1 and 2 by its peers.'};
const alertCard = (id, x, y, title) => card(id, x, y, {kind: 'Ticket', title, response: WHY[title], location: 'Kitchen - Operations', who: null, exec: null, pill: '00:00:00', tone: 'green'});

// ---- the card the cause is in, at the left (Isolated missions) ----
const RATERS = [{initials: 'BR', name: 'Ben R.', score: 1, avatar: AVATAR.ben}, {initials: 'LT', name: 'Leo T.', score: 2, avatar: AVATAR.leo}];
const CAUSES = {
  delays: {kind: 'Task', title: 'Check Inventory', who: null, exec: null, pill: '01:12:40', tone: 'red', points: 10},
  executions: {kind: 'Task', title: 'Clean Room', who: 'Carla M', avatar: AVATAR.carla, exec: '00:01:02', pill: '00:09:20', tone: 'gray', points: 10},
  ratings: {kind: 'Task', title: 'Clean Room', who: 'Carla M', avatar: AVATAR.carla, exec: '00:14:30', pill: '00:15:10', tone: 'gray', points: 10, rate: true, ratings: RATERS},
};

export default function ExceptionsStage({state}) {
  const s = {...EXCEPTIONS_BASE, ...state};
  if (s.view === 'panel') { // a mission with the cause in it, and the ticket it raises
    const x = 321, y = 610, lines = [], chips = [];
    if (s.alert) chips.push(alertCard('alert', x, y, ALERTS[s.kind]));
    return <><CausePanel s={s}/><FlowPart chips={chips} lines={lines} name="Mission cards" center={false}/></>; // (its own name: it is not the layer of the card scenes, so the video does not glide one into the other)
  }
  if (s.view === 'flow') { // a card with the cause in it, and the ticket it raises
    const left = 70, right = 570, mid = 360, a = {x: left, y: mid}, b = {x: right, y: mid};
    const chips = [card('source', left, mid, CAUSES[s.kind])], lines = [];
    if (s.alert) { lines.push(across('arrow', a, b)); chips.push(alertCard('alert', right, mid, ALERTS[s.kind])); }
    return <FlowPart chips={chips} lines={lines}/>;
  }
  const tickets = Object.values(ALERTS).slice(0, s.tickets).map((title, i) => mission(`ticket-${i}`, title, 'Ticket', 'open', {response: WHY[title], location: 'Kitchen - Operations', ageSeconds: 30 + i * 70, openOrder: -i}));
  return <TabletPart title="Operations" ticketBoard missions={tickets}/>;
}
