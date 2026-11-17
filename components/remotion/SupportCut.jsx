'use client';
// Requesting Support, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the product's own pieces, each set by lib/remotion/supportCut.mjs as a
// function of the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when
// requesting-support-v2's variation is the look `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition RS-Cut).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeSupportCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band, the cursor and the outlines are every cut's (components/remotion/CutParts.jsx); the pieces are the section films' (components/remotion/SectionParts.jsx:
// a section's tab, a card on its own, an arrow, the plus and its On-Demand list, the avatar that takes a card). The art has NO TABLET, as Requesting Maintenance's:
//   - the Front Desk's Open section by itself: its tab, its missions' cards under it, the plus beside it and the On-Demand list opening out of the plus
//   - the request's panel (the section's, components/sections/SupportStage.jsx: a 9:16 phone's panel), which stays open while the card it is posted as pops at its right and ages
//   - ONE card for the whole story (the request posted to the team that answers, that team's name over it), the escalation alert it raises, and that team's three sections as their tabs only
//   - the responder's avatar, which takes the card and closes it
//   - the request's QR card, the sign and the package that carry it, the phone that scans it (the section's own pieces), and the web Overview edge to edge (Live Oversight's board)
import {useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts';
import {Arrow, Card, DemandMenu, Layer, Name, Plus, Rider, Tab} from './SectionParts';
import OverviewScene from '../OverviewScene';
import {AVATAR} from '../sections/parts';
import {SUPPORT_BASE, RequestPanel, QrCard, Placed, Phone} from '../sections/SupportStage';
import {BOARD, DATA, PHONE, PLACED, QR, SEAT, makeSupportCut} from '@/lib/remotion/supportCut.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';    // .iq2-report (the web window), .iq2-rating-label (a card's label)
import '../LiveOversightDemo.css';        // .iq-ow-*, .iq-ol-page (the Overview)
import '../EfficiencyV2Demo.css';
import '../web/web.css';                  // .ow-* (the workspace)
import '../sections/sections.css';        // .sec-qrcard, .sec-sign, .sec-box, .sec-cam, .sec-form (the QR card, the sign, the package, the phone's camera and form)
import '../sections/sectionStyles';
import './OversightCut.css';              // .rc-lo-board, .rc-lo-page: the web page edge to edge, no border, corners or shadow

const d = DATA;
const title = s => s[0].toUpperCase() + s.slice(1);
const placed = p => ({left: p.left, top: p.top, transform: `scale(${p.scale})`, transformOrigin: '0 0'}); // (a piece of the section stood where the cut wants it, drawn `scale` times from its corner)

export default function SupportCut({words = null, hide = null, layout = null}) { // (`layout`: the variation's; 'narrator': the same film with the narrator's voice)
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeSupportCut(words ?? undefined, {layout}), [words, layout]);
  const s = cut.stateAt(t), o = s.open, r = s.request, c = s.cards, p = c.post, w = s.web;
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {/* 1 · the Front Desk's Open section, with no tablet: its tab, its missions, the plus beside the tab and the On-Demand list, which opens out of the plus */}
    {o.op > 0.001 && <Layer id="open" op={o.op}>
      <Tab x={o.x} y={o.y} k={o.k} label={`Open - ${o.count}`} name="Column Open"/>
      {o.chips.map(m => <Card key={m.id} c={m} name={`Mission ${m.mission.title}`}/>)}
      <Plus p={o.plus}/>
      <DemandMenu m={o.menu} department={d.team} items={d.demand}/>
    </Layer>}
    {/* 2 to 4 · the request's panel: it stays open while the card it is posted as pops at its right */}
    {r.op > 0.001 && <Layer id="request" op={r.op} part="Request" box=".iq2-mission">
      <RequestPanel s={{...SUPPORT_BASE, expand: r.expand, typed: r.typed, doc: r.doc, timer: r.timer, place: {left: r.left, top: r.top, scale: r.scale}}}/>
    </Layer>}
    {/* 5, 6 · the three sections of the team that answers, their tabs only */}
    {s.tabs.op > 0.001 && <Layer id="tabs" op={s.tabs.op} group="Sections">
      {s.tabs.list.map(x => <Tab key={x.status} x={x.x} y={s.tabs.y} k={s.tabs.k} label={`${title(x.status)} - ${x.n}`} name={`Column ${title(x.status)}`}/>)}
    </Layer>}
    {/* 3 to 6 · the one card (the request posted to the team that answers, its name over it), the escalation alert it raises and their arrows (`is-bare`: the card's own avatar keeps the
        performer's place and is never seen: the responder's sits there) */}
    {c.op > 0.001 && <Layer id="cards" op={c.op} className="is-bare">
      {c.arrows.map(a => <Arrow key={a.id} a={a}/>)}
      {c.label.op > 0.001 && <Name x={c.label.x} y={c.label.y} op={c.label.op} text={c.label.text} part="Team label"/>}{/* (the team the request is posted to: white on the dark, SectionParts `Name`) */}
      {c.escalation && <Card c={c.escalation} name="Escalation alert"/>}
      {p.pop > 0 && <Card c={{...p, mission: {...p.mission, avatar: p.mission.claimed ? AVATAR.carla : null}}} name="Request posted" pill={p.pillPop}/>}
    </Layer>}
    {/* 5, 6 · the responder's avatar, the same one to the end; it goes with the board */}
    {s.rider > 0.001 && <Layer id="rider" op={s.rider}>
      <Rider face={s.face} seat={SEAT} src={AVATAR.carla} on={'[data-rc-layer="cards"] [data-sec-chip="post"] .chip'}/>
    </Layer>}
    {/* 7 · the request's QR card by itself */}
    {s.qr.op > 0.001 && <Layer id="qr" op={s.qr.op} part="QR card" box=".sec-qrcard"><QrCard place={placed(QR)}/></Layer>}
    {/* 8 · the sign and the package that carry the code (each a piece of its own on the board All storyboards: the layer only holds them) */}
    {s.placed.op > 0.001 && <Layer id="placed" op={s.placed.op} group="Signs"><Placed place={placed(PLACED)}/></Layer>}
    {/* 9 · the phone that scans the code: its camera, then the form coming in over it */}
    {s.phone.op > 0.001 && <Layer id="phone" op={s.phone.op} part="Phone" box=".ph-phone"><Phone s={{...SUPPORT_BASE, scan: s.phone.scan, place: PHONE}}/></Layer>}
    {/* 10, 11 · the web Overview, edge to edge over the band (Live Oversight's board: components/remotion/OversightCut.jsx) */}
    {w.op > 0.001 && <Layer id="web" op={w.op}>
      <div className="iq2-report rc-lo-board" data-cut-part="Board" style={{left: 0, top: 0, width: BOARD.w, height: BOARD.h}}>
        <div className="iq2-report-page rc-lo-page" style={{height: BOARD.h}}><div className="iq-ol-page"><OverviewScene frame={w.overview} playing speed={1}/></div></div>
      </div>
    </Layer>}
  </CutFrame>;
}
