'use client';
// Replenishing Inventory, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the product's own pieces, each set by lib/remotion/inventoryCut.mjs as a
// function of the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when
// replenishing-inventory-v2's variation is the look `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition RI-Cut).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeInventoryCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band, the cursor and the outlines are every cut's (components/remotion/CutParts.jsx); the pieces are the section films' (components/remotion/SectionParts.jsx:
// a section's tab, a card on its own, an arrow). The art, as Requesting Maintenance's, has NO TABLET but in the one scene that is about a mobile device:
//   - the Stockroom's Open section by itself: its tab, its missions' cards under it
//   - the inventory check's panel (the section's, components/sections/InventoryStage.jsx: a 9:16 phone's panel), which stays open while the mission it raises pops at its right and ages
//   - ONE mission for the whole story, Replenish Item-C, the escalation alert it raises, then its own panel with the count and the photo of the shelf
//   - the tablet with Business Proofs over its board (the product's board in the flat black frame, as Dynamic Auditing's), and the web report's gallery edge to edge (as Live Oversight's)
import {useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts';
import {Arrow, Card, Layer, Tab} from './SectionParts';
import {MotionTablet, running} from './MotionBoard';
import {BusinessProofs} from '../ImprovedQualityV2Panels';
import UsageReport, {ReportTree} from '../UsageReport';
import {CheckPanel, INVENTORY_BASE, ReplenishPanel, missionsOf} from '../sections/InventoryStage';
import {REPORT_GROUPS, reportTree} from '@/lib/liveOversightData.mjs';
import {REPLENISH_PROOFS, REPLENISH_READY, replenishTree} from '@/lib/replenishProofs.mjs';
import {BOARD, PANEL, RANGE, TABLET, makeInventoryCut} from '@/lib/remotion/inventoryCut.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import '../sections/sections.css';
import '../sections/sectionStyles';
import './QualityCut.css';                 // .rc-iq-tablet: the tablet's frame and the shadow of its cards
import './OversightCut.css';               // .rc-lo-board, .rc-lo-page: the web page edge to edge

const TEAM = 'Stockroom';

// ---- 6 · the tablet: the product's board in the flat black frame (.rc-device), Business Proofs over it, scrolled by the clock (the board's timers run under it) ----
function Tablet({tablet}) {
  const missions = useMemo(() => running(missionsOf('checked'), {}), []);
  // (the proofs are the replenishments' own: the photos of the shelves restocked, lib/replenishProofs.mjs; the user, 2026-11-16: "it should show replishement photos". Until the photos
  // are there, `REPLENISH_READY`, the ones it showed before)
  return <MotionTablet tab={TABLET} title={TEAM} to={missions} elapsed={tablet.elapsed} overlay={<div className="iq-bp-layer"><BusinessProofs tablet scroll={tablet.scroll} proofs={REPLENISH_READY ? REPLENISH_PROOFS : undefined}/></div>}/>;
}
// ---- 7 · the web report's gallery (Live Oversight's report page, edge to edge over the band) ----
function Web({web}) {
  const nodes = useMemo(() => (REPLENISH_READY ? replenishTree() : reportTree('Checkpoint')), []); // (the replenishments' photo checkpoints and their runs: lib/replenishProofs.mjs)
  return <div className="iq2-report rc-lo-board" style={{left: 0, top: 0, width: BOARD.w, height: BOARD.h}}>
    <div className="iq2-report-page rc-lo-page" style={{height: BOARD.h}}><div className="iq-ol-page iq-lo-usage">
      <UsageReport web={{gallery: web.gallery, scroll: web.scroll}} range={RANGE} groupBy="Checkpoint" menu={0} options={REPORT_GROUPS} dip={0}><ReportTree nodes={nodes} rows={web.rows}/></UsageReport>
    </div></div>
  </div>;
}

export default function InventoryCut({words = null, hide = null, layout = null}) { // (`layout`: the variation's; 'narrator': the same film with the narrator's voice)
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeInventoryCut(words ?? undefined, {layout}), [words, layout]);
  const s = cut.stateAt(t), o = s.open, ck = s.check, c = s.cards, rp = s.replenish;
  // (each layer says its name, `Layer id`: what the cursor presses and what is outlined is found in it; on the board All storyboards every piece is a layer of its own, `data-cut-part`,
  // a panel, the tablet and the web page picked at their own box: scripts/capture-cuts.mjs)
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {/* 1 · the Open section of the Stockroom's board, with no tablet: its tab and its missions (the Inventory Check pops in under Restock Napkins) */}
    {o.op > 0.001 && <Layer id="open" op={o.op}>
      <Tab x={o.x} y={o.y} k={o.k} label={`Open - ${o.count}`} name="Column Open"/>
      {o.chips.map(m => <Card key={m.id} c={m} name={`Mission ${m.mission.title}`}/>)}
    </Layer>}
    {/* 2 to 4 · the check's panel (`trigger`: the count below par is what raises the order: in the ticket's color) */}
    {ck.op > 0.001 && <Layer id="check" op={ck.op} part="Inventory check" box=".iq2-mission">
      <CheckPanel s={{...INVENTORY_BASE, panel: 'check', expand: ck.expand, counts: ck.counts, scrollMix: ck.scrollMix, timer: ck.timer, trigger: true, place: {left: ck.left, top: ck.top, scale: ck.scale}}}/>
    </Layer>}
    {/* 3 to 5 · the one mission it raises, the escalation alert that one raises, and their arrows */}
    {c.op > 0.001 && <Layer id="cards" op={c.op}>
      {c.arrows.map(a => <Arrow key={a.id} a={a}/>)}
      {c.escalation && <Card c={c.escalation} name="Escalation alert"/>}
      {c.replenish.pop > 0 && <Card c={c.replenish} name={`Mission ${c.replenish.mission.title}`} pill={c.replenish.pillPop}/>}
    </Layer>}
    {/* 5 · the replenishment opened: the count, then the photo of the shelf */}
    {rp.op > 0.001 && <Layer id="replenish" op={rp.op} part="Replenishment" box=".iq2-mission">
      <ReplenishPanel s={{...INVENTORY_BASE, panel: 'replenish', expand: rp.expand, count: rp.count, photo: rp.photo, scrollMix: rp.scrollMix, timer: rp.timer, tone: rp.tone, place: PANEL}}/>
    </Layer>}
    {/* 6 · from a mobile device: the tablet, Business Proofs over its board */}
    {s.tablet.op > 0.001 && <Layer id="tablet" op={s.tablet.op} part="Tablet" box=".rc-device"><Tablet tablet={s.tablet}/></Layer>}
    {/* 7, 8 · or from the web: the report's gallery, edge to edge */}
    {s.web.op > 0.001 && <Layer id="web" op={s.web.op} part="Web report" box=".iq2-report"><Web web={s.web}/></Layer>}
  </CutFrame>;
}
