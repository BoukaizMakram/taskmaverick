'use client';
// Requesting Support's art for the section videos (lib/sections/requesting-support.mjs): the request made from a template (the tablet's On-Demand list), the request by itself, the post to the
// team that answers it, its escalation, claim and close; then the QR code, the sign and the package that carry it, the phone that scans it and the form it opens, the live overview board.
import {TabletPart, DemandPanel, MissionPanel, FlowPart, Qr, mission, AVATAR, card, across} from './parts';
import PhoneShell from '../PhoneShell';
import LiveOversightStage from './LiveOversightStage';

const CLIP = '/demo-quality/condition-report.mp4', ROOM = '/demo-quality/proofs/restroom-sinks.jpg';
export const SUPPORT_BASE = {view: 'board', board: 'base', drawer: null, pick: null, typed: false, doc: 'none', flow: 'posted', flowStep: 0, expand: 1, panel: 'request', scan: 0, scroll: 0};
const PROBLEM = 'Room 12 needs to be cleaned before the next guests arrive.';

// ---- the tablet: the requester's board, then the team that answers ----
function missionsOf(board) {
  const front = [
    mission('check-in', 'Greet Guests', 'Task', 'open', {ageSeconds: 840, openOrder: 3}),
    mission('keys', 'Count Room Keys', 'Checklist', 'open', {ageSeconds: 640, openOrder: 4}),
    mission('desk', 'Brew Coffee', 'Task', 'claimed', {performer: 'Anna F', performerAvatar: AVATAR.anna, executionSeconds: 305, started: 50, ageSeconds: 1210}),
    mission('log', 'Shift Log', 'Checklist', 'closed', {performer: 'Ben R', performerAvatar: AVATAR.ben, executionSeconds: 288, stopped: 20, ageSeconds: 2100}),
  ];
  const house = [
    mission('towels', 'Restock Towels', 'Task', 'open', {ageSeconds: 700, openOrder: 3}),
    mission('lobby', 'Vacuum Lobby', 'Checklist', 'claimed', {performer: 'Leo T', performerAvatar: AVATAR.leo, executionSeconds: 190, started: 60, ageSeconds: 900}),
    mission('linens', 'Fold Linens', 'Task', 'closed', {performer: 'Ben R', performerAvatar: AVATAR.ben, executionSeconds: 260, stopped: 30, ageSeconds: 1800}),
  ];
  const clean = (status, rest = {}) => mission('clean', 'Clean Room', 'Task', status, {ageSeconds: 8, openOrder: 0, ...rest});
  if (board === 'requested') return {title: 'Front Desk', list: [mission('req', 'Clean Room', 'Task', 'open', {ageSeconds: 4, openOrder: 0}), ...front]};
  if (board === 'posted') return {title: 'Housekeeping', list: [clean('open'), ...house]};
  if (board === 'claimed') return {title: 'Housekeeping', list: [clean('claimed', {performer: 'Carla M', performerAvatar: AVATAR.carla, executionSeconds: 118, started: 100, ageSeconds: 410}), ...house]};
  if (board === 'closed') return {title: 'Housekeeping', list: [clean('closed', {performer: 'Carla M', performerAvatar: AVATAR.carla, showPerformerName: true, executionSeconds: 1015, stopped: 110, ageSeconds: 1070}), ...house]};
  return {title: 'Front Desk', list: front};
}

// ---- the request by itself ----
function RequestPanel({s}) {
  const proof = s.doc === 'ask' ? {kind: 'video', state: 'ask'} : s.doc === 'done' ? {kind: 'video', state: 'done', src: CLIP, poster: ROOM, file: 'Video 9/23/2026 at 2:11:48 PM.mp4'} : null;
  return <MissionPanel kind="Task" points={null} title="Clean Room" location="Front Desk / Requests" who="Anna F" date="09-23-26 02:10 PM" timer="00:00:04" expand={s.expand}
    brief={{instructions: 'Tell us what you need.'}}
    items={[{id: 'describe', type: 'text', q: 'Describe issue', value: s.typed ? PROBLEM : '', placeholder: 'Describe the request'},
      {id: 'record', type: 'yesno', q: 'Record request?', answer: s.doc === 'none' ? null : 'yes', proof}]} scrollTo="top"/>;
}

// ---- the cards on their own ----
const TONES = ['green', 'orange', 'red'], CLOCKS = ['00:12:08', '00:31:40', '01:02:15'];
function flowOf(s) {
  const left = 70, right = 570, mid = 360, a = {x: left, y: mid}, b = {x: right, y: mid};
  if (s.flow === 'posted') { // the request is posted to the team that answers it
    const chips = [card('request', left, mid, {kind: 'Task', title: 'Clean Room', who: 'Anna F', exec: '00:00:58', pill: '00:01:02', tone: 'gray'})], lines = [], labels = [];
    if (s.flowStep >= 1) { lines.push(across('arrow', a, b)); chips.push(card('post', right, mid, {kind: 'Task', title: 'Clean Room', who: null, exec: null, pill: '00:00:00', tone: 'green'})); labels.push({x: right, y: mid - 28, text: 'Housekeeping'}); }
    return {chips, lines, labels};
  }
  if (s.flow === 'aging') { // an unanswered request turns orange, then red, and an escalation alert pops
    const tone = Math.min(2, s.flowStep);
    const chips = [card('post', left, mid, {kind: 'Task', title: 'Clean Room', who: null, exec: null, pill: CLOCKS[tone], tone: TONES[tone]})], lines = [];
    if (s.flowStep >= 3) { lines.push(across('arrow', a, b)); chips.push(card('escalation', right, mid, {kind: 'Ticket', title: 'Escalation Alert', response: 'The request has not been answered in time.', location: 'Housekeeping - Support', who: null, exec: null, pill: '00:00:00', tone: 'green'})); }
    return {chips, lines, labels: []};
  }
  return {chips: [], lines: [], labels: []};
}

// ---- the QR code, the sign and the package that carry it (the sign and the package are photographs: public/storyboard-art/, scripts/generate-images.mjs) ----
const SEED = 'https://app.taskmaverick.com/request/room-12';
function QrCard() {
  return <div className="sec-qrcard" data-sec-part="Layer" style={{left: 50, top: 120}}>
    <img src="/mission-logo.png" alt=""/><h3>Request Support</h3>
    <div className="sec-qrcard-code" data-iq-target="qr"><Qr size={380} seed={SEED}/></div>
    <p>Scan with your phone</p>
  </div>;
}
function Placed() {
  return <div className="sec-placed" data-sec-part="Layer" style={{left: 40, top: 150, width: 960, height: 600}}>
    <div className="sec-sign" data-iq-target="sign" role="img" aria-label="Need something? Scan to request support. Room 12"/>
    <div className="sec-box" data-iq-target="package" role="img" aria-label="Package 4821: scan to report a problem"/>
  </div>;
}

// ---- the phone that scans it, and the form it opens ----
function Phone({s}) {
  const camera = <div className="sec-cam"><div className="sec-cam-view"><div className="sec-cam-code" data-iq-target="camera"><Qr size={210} seed={SEED}/></div>
    {['tl', 'tr', 'bl', 'br'].map(c => <i key={c} className={`sec-cam-corner sec-cam-corner--${c}`}/>)}</div><p>Point the camera at the QR code</p></div>;
  const form = <div className="sec-form" data-iq-target="form"><header><b>Experience Survey</b></header>
    <section><p>How was your experience?</p><div className="sec-stars" data-iq-target="stars">{[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= 4 ? 'is-on' : ''}>★</span>)}</div></section>
    <section><p>Was the room clean?</p><div className="iq2-m-options"><span className="is-selected"><span className="iq-checkbox is-checked">✓</span>Yes</span><span><span className="iq-checkbox"/>No</span></div></section>
    <section><p>Anything we should know?</p><div className="sec-field">Everything was great.</div></section>
    <span className="iq2-m-submit is-ready">Submit</span></div>;
  return <div className="ph-fit sec-phone" data-sec-part="Board" style={{position: 'absolute', left: 331, top: 40, width: 380}}>
    <PhoneShell title="Scan" tabs={[]} overlay={s.scan >= 1 ? form : camera}/>
  </div>;
}

export default function SupportStage({state}) {
  const s = {...SUPPORT_BASE, ...state};
  if (s.view === 'mission') return <RequestPanel s={s}/>;
  if (s.view === 'flow') { const f = flowOf(s); return <FlowPart chips={f.chips} lines={f.lines} labels={f.labels}/>; }
  if (s.view === 'qr') return <QrCard/>;
  if (s.view === 'placed') return <Placed/>;
  if (s.view === 'phone') return <Phone s={s}/>;
  if (s.view === 'web') return <LiveOversightStage state={{page: 'overview', pan: 0, view: 'Running', scroll: s.scroll}}/>;
  const {title, list} = missionsOf(s.board);
  const overlay = s.drawer === 'demand' ? <><div className="sec-shade"/><DemandPanel department={title} picked={s.pick} items={[['Task', '10-Min Break AM'], ['Survey', 'All Cheese Crepe Waste'], ['Task', 'Clean Room'], ['Checklist', 'Business Card Inventory'], ['Checklist', 'Chef Coat Inventory']]}/></> : null;
  return <TabletPart title={title} missions={list} overlay={overlay}/>;
}
