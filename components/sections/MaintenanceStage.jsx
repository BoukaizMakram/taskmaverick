'use client';
// Requesting Maintenance's art for the section videos (lib/sections/requesting-maintenance.mjs): the tablet board and its On-Demand list, the request by itself (a typed description, a video),
// the alert ticket that follows (Isolated missions, with the arrow), the timer aging to red with its escalation alert, the ticket opened with its video, the ticket claimed and closed.
// The names (the team, its missions, the On-Demand list, the issue, the ticket board, the people) are the section's data (lib/sections/liveData.mjs: the board's own unless the AI demo
// call draws it with the visitor's); the evidence video is always the damaged door hinge.
import {TabletPart, DemandPanel, MissionPanel, FlowPart, mission, AVATAR, FLOW, card, across} from './parts';
import {DEFAULTS} from '@/lib/sections/liveData.mjs';

const HINGE = '/demo-quality/damaged-hinge.png', CLIP = '/demo-quality/condition-report.mp4';
export const MAINTENANCE_BASE = {view: 'board', board: 'base', drawer: null, pick: null, typed: false, doc: 'none', flow: 'alert', flowStep: 0, expand: 1, watch: 0};
const OPEN = [{ageSeconds: 1210, openOrder: 3}, {ageSeconds: 980, openOrder: 4}]; // (the board's two open missions; one added after them is younger)
const where = (area, d) => `${area} - ${d.ticketBoard}`;

// ---- the tablet: the same board through the life of the request ----
// (exported for the Remotion cut, components/remotion/MaintenanceCut.jsx, which draws these pieces by its clock: `s.place` {left, top, scale} is where a panel stands, `s.typed` may be the text typed so far)
// (`opts.bottom`: the new request / ticket comes at the BOTTOM of Open, as a mission that is posted does: the user, 2026-11-12, "new missions always comes from the bottom"; the slides keep it on top)
export function missionsOf(board, d, opts = {}) {
  const n = d.board.length, [anna, ben] = d.people;
  const list = d.board.map((m, i) => {
    if (i === n - 2) return mission(m.id, m.title, m.type, 'claimed', {performer: anna, performerAvatar: AVATAR.anna, executionSeconds: 412, started: 50, ageSeconds: 1500});
    if (i === n - 1) return mission(m.id, m.title, m.type, 'closed', {performer: ben, performerAvatar: AVATAR.ben, executionSeconds: 366, stopped: 20, ageSeconds: 2400, rateable: false});
    return mission(m.id, m.title, m.type, 'open', OPEN[i] ?? {ageSeconds: Math.max(60, 840 - 120 * (i - 2)), openOrder: 3 + i});
  });
  const request = status => mission('req', d.request, 'Survey', status, {ageSeconds: 6, openOrder: opts.bottom ? 99 : 0, performer: anna, executionSeconds: 54, stopped: 30, started: 30});
  if (board === 'requested') return [request('open'), ...list];
  return list;
}
// ---- the Maintenance ticket board (the user, 2026-10-16: the ticket board is the team board with the department in red, and the alert tickets as the product draws them) ----
const T_DATE = {date: '09-23-26', time: '10:21 AM'};
const OTHER_AT = [{date: '09-23-26', time: '09:40 AM', ageSeconds: 2460, openOrder: 1}, {date: '09-23-26', time: '08:55 AM', ageSeconds: 3400, executionSeconds: 612, started: 60}, {date: '09-22-26', time: '04:10 PM', ageSeconds: 5200, executionSeconds: 1380, stopped: 40}];
export function ticketsOf(board, d, opts = {}) { // (`opts.bare`: claimed, with no avatar on it yet: the cut's responder is on its way to the ticket's performer place)
  const [, ben, carla, leo] = d.people, [a, b, c] = d.others;
  const base = {response: d.problem, location: where(d.area, d), ...T_DATE};
  const mine = (status, rest = {}) => mission('ticket', d.ticket, 'Ticket', status, {...base, ageSeconds: 14, openOrder: opts.bottom ? 99 : 0, ...rest});
  const light = mission(a.id, a.title, 'Ticket', 'open', {response: a.problem, location: where(a.area, d), ...OTHER_AT[0]});
  const faucet = mission(b.id, b.title, 'Ticket', 'claimed', {response: b.problem, location: where(b.area, d), ...OTHER_AT[1], performer: ben, performerAvatar: AVATAR.ben});
  const latch = mission(c.id, c.title, 'Ticket', 'closed', {response: c.problem, location: where(c.area, d), ...OTHER_AT[2], performer: leo, performerAvatar: AVATAR.leo});
  if (board === 'claimed') return [mine('claimed', {performer: carla, performerAvatar: opts.bare ? undefined : AVATAR.carla, executionSeconds: 95, started: 100, ageSeconds: 380}), light, faucet, latch];
  if (board === 'closed') return [mine('closed', {performer: carla, performerAvatar: AVATAR.carla, executionSeconds: 1122, stopped: 110, ageSeconds: 1168}), light, faucet, latch];
  return [mine('open'), light, faucet, latch];
}

// ---- the request by itself ----
export function RequestPanel({s, d}) {
  const proof = s.doc === 'ask' ? {kind: 'video', state: 'ask'} : s.doc === 'done' ? {kind: 'video', state: 'done', src: CLIP, poster: HINGE, file: 'Video 9/23/2026 at 10:21:08 AM.mp4'} : null;
  return <MissionPanel kind="Survey" points={null} title={d.request} location={`${d.area} / ${d.ticketBoard}`} who={d.people[0]} date="09-23-26 10:20 AM" timer="00:00:06" expand={s.expand}
    brief={{instructions: d.instructions}}
    items={[{id: 'describe', type: 'text', q: 'Describe issue', value: typeof s.typed === 'string' ? s.typed : s.typed ? d.problem : '', placeholder: 'Describe the issue'},
      {id: 'doc', type: 'yesno', q: 'Document issue?', answer: s.doc === 'none' ? null : 'yes', proof}]} scrollTo="top" {...(s.place ?? {})}/>;
}
// ---- the ticket opened, with the video the request carried ----
export function TicketPanel({s, d}) {
  return <MissionPanel kind="Ticket" points={null} title={d.ticket} location={`${d.ticketBoard} Board`} who={`Posted by ${d.people[0]}`} date="09-23-26 10:21 AM" timer="00:00:14" expand={s.expand}
    brief={{instructions: d.problem, alert: `Reported from the ${d.area}.`}}
    items={[{id: 'evidence', type: 'training', q: 'Evidence from the request', title: d.evidence, poster: HINGE, meta: 'Video · 0:06', done: false, player: s.watch ? {src: CLIP, poster: HINGE, time: s.watch, length: 6} : null}]} scrollTo="top" {...(s.place ?? {})}/>;
}

// ---- the cards on their own ----
const TONES = ['green', 'orange', 'red'], CLOCKS = ['00:12:08', '00:31:40', '01:02:15'];
export function flowOf(s, d) {
  const REQUEST = {kind: 'Survey', title: d.request, who: d.people[0], avatar: null, exec: '00:00:54', pill: '00:00:58', tone: 'gray'};
  const TICKET = {kind: 'Ticket', title: d.ticket, who: null, exec: null, response: d.problem, location: where(d.area, d), date: '09-23-26', time: '10:21 AM'};
  const left = 70, right = 570, mid = 360, a = {x: left, y: mid}, b = {x: right, y: mid};
  if (s.flow === 'alert') { // the request raises a ticket, for a vendor or a manager
    const chips = [card('request', left, mid, REQUEST)], lines = [];
    if (s.flowStep >= 1) { lines.push(across('arrow', a, b)); chips.push(card('alert', right, mid, {...TICKET, pill: '00:00:00', tone: 'green'})); }
    return {chips, lines};
  }
  if (s.flow === 'aging') { // a ticket nobody answers turns orange, then red, and an escalation alert pops
    const tone = Math.min(2, s.flowStep);
    const chips = [card('alert', left, mid, {...TICKET, pill: CLOCKS[tone], tone: TONES[tone]})], lines = [];
    if (s.flowStep >= 3) { lines.push(across('arrow', a, b)); chips.push(card('escalation', right, mid, {kind: 'Ticket', title: 'Escalation Alert', response: 'The ticket has not been answered in time.', location: where(d.area, d), who: null, exec: null, pill: '00:00:00', tone: 'green'})); }
    return {chips, lines};
  }
  return {chips: [], lines: []};
}

export default function MaintenanceStage({state, data = DEFAULTS['requesting-maintenance']}) {
  const s = {...MAINTENANCE_BASE, ...state}, d = data;
  if (s.view === 'mission') return s.panel === 'ticket' ? <TicketPanel s={s} d={d}/> : <RequestPanel s={s} d={d}/>;
  if (s.view === 'flow') { const f = flowOf(s, d); return <FlowPart chips={f.chips} lines={f.lines}/>; }
  const items = [...d.demand.slice(0, 3).map(r => [r.type, r.title]), ['Survey', d.request, 'maintenance-request'], ...d.demand.slice(3).map(r => [r.type, r.title])];
  const overlay = s.drawer === 'demand' ? <><div className="sec-shade"/><DemandPanel department={d.team} picked={s.pick} items={items}/></> : null;
  if (['ticketed', 'claimed', 'closed'].includes(s.board)) return <TabletPart title={d.ticketBoard} ticketBoard missions={ticketsOf(s.board, d)} compact/>;
  return <TabletPart title={d.team} missions={missionsOf(s.board, d)} overlay={overlay}/>;
}
