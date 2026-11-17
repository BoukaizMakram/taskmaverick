'use client';
// Requesting Maintenance, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the product's own pieces, each set by lib/remotion/maintenanceCut.mjs as a
// function of the time (why it is told this way, and the user's notes it follows: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx)
// when requesting-maintenance-v2's variation is the look `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition RM-Cut, src/rmcut/RMCut.jsx).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeMaintenanceCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band, the cursor and the outlines are every cut's (components/remotion/CutParts.jsx); the pieces are the section films' (components/remotion/SectionParts.jsx:
// a section's tab, a card on its own, an arrow, the plus and its On-Demand list, the avatar that takes a card). The art has NO TABLET (the user's notes on its storyboard, 2026-11-16):
//   - the Open section of the team board by itself: its tab, its missions' cards under it, the plus beside it and the On-Demand list opening out of the plus
//   - the request's panel (the section's, components/sections/MaintenanceStage.jsx: a 9:16 phone's panel), which stays open while the alert ticket it raises pops at its right and ages
//   - ONE alert ticket for the whole story, the escalation alert it raises, and the ticket board's three sections as their tabs only
//   - the ticket's panel with the request's video, and the responder's avatar
import {useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts';
import {Arrow, Card, DemandMenu, Layer, Plus, Rider, Tab} from './SectionParts';
import {AVATAR} from '../sections/parts';
import {MAINTENANCE_BASE, RequestPanel, TicketPanel} from '../sections/MaintenanceStage';
import {DATA, PANEL, SEAT, makeMaintenanceCut} from '@/lib/remotion/maintenanceCut.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import '../sections/sections.css';
import '../sections/sectionStyles';

const d = DATA;
const DEMAND_ITEMS = [...d.demand.slice(0, 3).map(r => [r.type, r.title]), ['Survey', d.request, 'maintenance-request'], ...d.demand.slice(3).map(r => [r.type, r.title])];
const title = s => s[0].toUpperCase() + s.slice(1);

export default function MaintenanceCut({words = null, hide = null, layout = null}) { // (`layout`: the variation's; 'narrator': the same film with the narrator's voice)
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeMaintenanceCut(words ?? undefined, {layout}), [words, layout]);
  const s = cut.stateAt(t), o = s.open, r = s.request, c = s.cards, k = s.ticket, tk = c.ticket;
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {/* 1 · the Open section of the team board, with no tablet: its tab, its missions, the plus beside the tab and the On-Demand list, which opens out of the plus */}
    {o.op > 0.001 && <Layer id="open" op={o.op}>
      <Tab x={o.x} y={o.y} k={o.k} label={`Open - ${o.count}`} name="Column Open"/>
      {o.chips.map(m => <Card key={m.id} c={m} name={`Mission ${m.mission.title}`}/>)}
      <Plus p={o.plus}/>
      <DemandMenu m={o.menu} department={d.team} items={DEMAND_ITEMS}/>
    </Layer>}
    {/* 2 to 4 · the request's panel (`trigger`: Yes is what raises the ticket: at the right, in the ticket's border color) */}
    {r.op > 0.001 && <Layer id="request" op={r.op} part="Request" box=".iq2-mission">
      <RequestPanel s={{...MAINTENANCE_BASE, expand: r.expand, typed: r.typed, doc: r.doc, trigger: true, place: {left: r.left, top: r.top, scale: r.scale}}} d={d}/>
    </Layer>}
    {/* 5 to 8 · the ticket board's three sections, their tabs only */}
    {s.tabs.op > 0.001 && <Layer id="tabs" op={s.tabs.op} group="Sections">
      {s.tabs.list.map(x => <Tab key={x.status} x={x.x} y={s.tabs.y} k={s.tabs.k} label={`${title(x.status)} - ${x.n}`} name={`Column ${title(x.status)}`}/>)}
    </Layer>}
    {/* 3 to 8 · the one alert ticket, the escalation alert it raises and their arrows (`is-bare`: the card's own avatar keeps the performer's place and is never seen: the responder's sits there) */}
    {c.op > 0.001 && <Layer id="cards" op={c.op} className="is-bare">
      {c.arrows.map(a => <Arrow key={a.id} a={a}/>)}
      {c.escalation && <Card c={c.escalation} name="Escalation alert"/>}
      {tk.pop > 0 && <Card c={{...tk, mission: {...tk.mission, avatar: tk.mission.claimed ? AVATAR.carla : null}}} name="Alert ticket" pill={tk.pillPop}/>}
    </Layer>}
    {/* 5 · the ticket opened, with the video the request carried */}
    {k.op > 0.001 && <Layer id="ticket" op={k.op} part="Ticket" box=".iq2-mission">
      <TicketPanel s={{...MAINTENANCE_BASE, expand: k.expand, watch: k.watch, timer: k.timer, tone: k.tone, place: PANEL}} d={d}/>
    </Layer>}
    <Rider face={s.face} seat={SEAT} src={AVATAR.carla} on={'[data-rc-layer="cards"] [data-sec-chip="ticket"] .chip'}/>
  </CutFrame>;
}
