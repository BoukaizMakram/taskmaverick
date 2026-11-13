'use client';
// Requesting Maintenance, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the section's own pieces, each set by lib/remotion/maintenanceCut.mjs as a
// function of the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when requesting-maintenance-v2's
// variation is the look `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition RM-Cut, src/rmcut/RMCut.jsx).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeMaintenanceCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band, the cursor and the outlines are every cut's (components/remotion/CutParts.jsx). The art is the layers the plan names, the one a click went to coming in over the
// one before (`stateAt(t).layers`): the team board and the ticket board (the product's board in the flat black frame, as Dynamic Auditing's tablet), the request and the ticket (the section's
// panels, components/sections/MaintenanceStage.jsx, a 9:16 phone's panel in the middle) and the cards (FlowPart: the card that pops fades in over the one that stays; the ticket turns orange, red
// by the clock). Classes of its own: .rc-ma-* (components/remotion/MaintenanceCut.css).
import {useLayoutEffect, useMemo, useRef} from 'react';
import {Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts';
import {MotionTablet, PopFlow, running} from './MotionBoard';
import {AVATAR, DemandPanel} from '../sections/parts';
import {CUT_W, POP, clamp, clock, mix} from '@/lib/remotion/cutCore.mjs';
import {MAINTENANCE_BASE, RequestPanel, TicketPanel, flowOf, missionsOf, ticketsOf} from '../sections/MaintenanceStage';
import {DATA, FLOW_CY, FLOW_DX, FLOW_DY, FLOW_K, PANEL, TABLET, makeMaintenanceCut} from '@/lib/remotion/maintenanceCut.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import '../sections/sections.css';
import '../sections/sectionStyles';
import './QualityCut.css';                 // .rc-iq-tablet: the tablet's frame and the shadow of its cards
import './MaintenanceCut.css';

const d = DATA, TONES = ['green', 'orange', 'red'];
// (the boards by what they show, their timers RUNNING (`running`: the request and the ticket start at 00:00:00 when they are posted, the ticket's execution timer when it is claimed, it stops when
// it is closed); a new request or ticket comes at the BOTTOM of Open (`bottom`); the same objects each frame, made for a cut once)
const listsOf = runs => ({
  boards: {base: running(missionsOf('base', d, {bottom: true}), runs), requested: running(missionsOf('requested', d, {bottom: true}), runs)},
  tickets: {ticketed: running(ticketsOf('ticketed', d, {bottom: true}), runs), claimedBare: running(ticketsOf('claimed', d, {bottom: true, bare: true}), runs),
    claimed: running(ticketsOf('claimed', d, {bottom: true}), runs), closed: running(ticketsOf('closed', d, {bottom: true}), runs)},
});
const DEMAND_ITEMS = [...d.demand.slice(0, 3).map(r => [r.type, r.title]), ['Survey', d.request, 'maintenance-request'], ...d.demand.slice(3).map(r => [r.type, r.title])];

// ---- the tablet: the product's board in the flat black frame (.rc-device); the On-Demand list comes in over it from the plus (the board dims behind it); the ticket board is the compact one ----
// (the motion is Increased Efficiency's: the request pops in at the top of Open and the missions under it glide down, the ticket glides to Claimed and to Closed: components/remotion/MotionBoard.jsx)
function Tablet({title, to, from, p, pops = null, ticketBoard = false, drawer = 0, elapsed}) {
  const overlay = drawer > 0.001 ? <div className="rc-ma-drawer" style={{opacity: drawer, transform: `translateX(${((1 - drawer) * 36).toFixed(2)}px)`}}><div className="sec-shade"/><DemandPanel department={d.team} picked={null} items={DEMAND_ITEMS}/></div> : null;
  return <MotionTablet tab={TABLET} title={title} to={to} from={from} p={p} pops={pops} ticketBoard={ticketBoard} elapsed={elapsed} overlay={overlay} className={ticketBoard ? 'rc-ma-compact' : ''}/>;
}

// ---- the cards: the ones that stay are drawn all the time, the card that is new pops over them at its own place, its arrow after it (nothing moves: the group is not centered by the stage) ----
// The timers run here too (the user, 2026-11-12: "timers should always be running"): a card that pops starts at 00:00:00 (`since`); while the ticket ages (flow 'aging') its timer goes UP fast, green, then
// orange, then red, and its pill pops at each color (`pill`: the clock's, lib/remotion/maintenanceCut.mjs `pillPop`)
function Flow({flow, f}) {
  const step = flow === 'aging' ? f.tone : 0;
  const first = useMemo(() => flowOf({...MAINTENANCE_BASE, flow, flowStep: step}, d), [flow, step]), last = useMemo(() => flowOf({...MAINTENANCE_BASE, flow, flowStep: flow === 'aging' ? 3 : 1}, d), [flow]);
  const aged = c => (flow === 'aging' && c.id === 'alert' ? {...c, mission: {...c.mission, pill: clock(f.seconds), tone: TONES[f.tone]}} : c);
  const stay = {chips: first.chips.map(aged), lines: first.lines};
  return <div className="rc-ma-flow" style={{transformOrigin: `520px ${FLOW_CY.corrective}px`, transform: `translate(${FLOW_DX}px, ${FLOW_DY.corrective}px) scale(${FLOW_K})`}}>
    <PopFlow first={stay} last={{chips: last.chips.map(c => stay.chips.find(x => x.id === c.id) ?? c), lines: last.lines}} p={flow === 'aging' ? f.aging : f.alert}
      pill={f.pill} since={flow === 'aging' ? f.sinceEscalation : f.sinceAlert}/>
  </div>;
}

// ---- the responder (the user, 2026-11-12: "show an avatar on the left and takes the second ticket"): its avatar pops at the left of the tablet (where the team sits in Increased Efficiency), goes to the
// ticket (the second of Open), goes with it to Claimed and settles on it where its performer is, then the board's own avatar is there. Placed each frame on the ticket's card, measured, so it follows it ----
const SEAT = {x: TABLET.x + 47 * TABLET.w / 1285 - 84 - 18, y: TABLET.y + (64 + 766) * TABLET.w / 1285 - 84, size: 84};
function Responder({face}) {
  const me = useRef(null);
  useLayoutEffect(() => {
    const el = me.current, layer = el?.parentElement, stage = layer?.closest('.rc-stage');
    if (!el || !stage) return;
    const card = face.on ? layer.querySelector('.mi-card-button[data-mission-id="ticket"]') : null;
    if (!card) { el.style.opacity = '0'; return; }
    const S = stage.getBoundingClientRect(), k = S.width / CUT_W || 1, b = card.getBoundingClientRect();
    const c = {x: (b.left - S.left) / k, y: (b.top - S.top) / k, w: b.width / k, h: b.height / k};
    const edge = {x: c.x + c.w - 0.14 * c.w, y: c.y - 0.05 * c.w, s: 0.2 * c.w}, spot = {x: c.x + 0.05 * c.w, y: c.y + c.h - 0.118 * c.w, s: 0.085 * c.w};
    const at = (a, z, p) => ({x: mix(a.x, z.x, p), y: mix(a.y, z.y, p), s: mix(a.s, z.s, p)});
    const g = at(SEAT, edge, face.go), r = at(g, spot, face.spot), pop = mix(0.4, 1, POP(face.pop));
    el.style.opacity = clamp(face.pop / 0.6).toFixed(3);
    el.style.width = el.style.height = `${r.s.toFixed(2)}px`;
    el.style.transform = `translate(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px) scale(${pop.toFixed(4)})`;
  });
  return <div ref={me} className="rc-ma-face" aria-hidden="true" data-cut-part="Face"><Img src={AVATAR.carla} alt=""/></div>;
}

function Layer({id, s, lists, elapsed}) {
  switch (id) {
    case 'board': return <Tablet title={d.team} to={lists.boards[s.board.to]} from={lists.boards[s.board.from]} p={s.board.p} pops={s.board.pops} drawer={s.board.drawer} elapsed={elapsed}/>;
    case 'request': return <RequestPanel s={{...MAINTENANCE_BASE, ...s.request, place: PANEL}} d={d}/>;
    case 'flow-alert': return <Flow flow="alert" f={s.flows}/>;
    case 'flow-aging': return <Flow flow="aging" f={s.flows}/>;
    case 'tickets': return <><Tablet title={d.ticketBoard} to={lists.tickets[s.tickets.to]} from={lists.tickets[s.tickets.from]} p={s.tickets.p} ticketBoard elapsed={elapsed}/><Responder face={s.face}/></>;
    case 'ticket': return <TicketPanel s={{...MAINTENANCE_BASE, ...s.ticket, place: PANEL}} d={d}/>;
    default: return null;
  }
}

export default function MaintenanceCut({words = null, hide = null}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeMaintenanceCut(words ?? undefined), [words]), lists = useMemo(() => listsOf(cut.runs), [cut]);
  const s = cut.stateAt(t), elapsed = cut.elapsedAt(t);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {s.layers.map(l => <div key={l.id} className="rc-ma-layer" data-rc-ma={l.id} style={{opacity: l.op < 1 ? l.op : undefined}}><Layer id={l.id} s={s} lists={lists} elapsed={elapsed}/></div>)}
  </CutFrame>;
}
