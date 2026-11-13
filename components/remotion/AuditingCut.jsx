'use client';
// Dynamic Auditing, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the section's own pieces, each set by lib/remotion/auditingCut.mjs as a function of
// the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when dynamic-auditing-v2's variation is the look
// `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition DA-Cut, src/dacut/DACut.jsx).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeAuditingCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band, the cursor and the outlines are every cut's (components/remotion/CutParts.jsx). The art is the layers the plan names, the one a click went to coming in over the
// one before (`stateAt(t).layers`): the tablet's board (the product's board in the flat black frame, as Improved Quality's), the audit, the corrective mission and the training (the section's panels,
// components/sections/AuditingStage.jsx, a 9:16 phone's panel in the middle of the picture), the cards that follow an audit (FlowPart: the card that pops fades in over the ones that stay) and the web
// report's gallery. Classes of its own: .rc-ad-* (components/remotion/AuditingCut.css).
import {useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame, CutVideo} from './CutParts';
import {MotionTablet, PopFlow, running} from './MotionBoard';
import {KnowledgeBase} from '../ImprovedQualityV2Panels';
import UsageReport, {ReportTree} from '../UsageReport';
import {AUDITING_BASE, AUDITS, AuditPanel, CorrectivePanel, TrainingPanel, flowOf} from '../sections/AuditingStage';
import {REPORT_GROUPS, reportTree} from '@/lib/liveOversightData.mjs';
import {BOARD, FLOW_CY, FLOW_DX, FLOW_DY, FLOW_K, PANEL, RANGE, TABLET, makeAuditingCut} from '@/lib/remotion/auditingCut.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import '../sections/sections.css';
import '../sections/sectionStyles';
import './QualityCut.css';                 // .rc-iq-tablet, .rc-iq-kb: the tablet's menu and the Knowledge Base over its board
import './OversightCut.css';               // .rc-lo-board, .rc-lo-page: the web page edge to edge
import './AuditingCut.css';

const TITLE = 'Facilities Audits';

// ---- the tablet: the product's board in the flat black frame (.rc-device); the Knowledge Base comes in over it, the menu pops from its corner ----
// (the audits pop in as they are posted, the Knowledge Base and the menu come by the clock: components/remotion/MotionBoard.jsx)
// (the timers run: an audit starts at 00:00:00 when it is posted, `running`; MissionBoard's `elapsed` goes a second a second)
function Tablet({cut, t, board}) {
  const lists = useMemo(() => [0, 1, 2, 3, 4].map(n => running(AUDITS(n), cut.runs)), [cut]), missions = lists[board.audits], elapsed = cut.elapsedAt(t);
  const overlay = board.kb > 0.001 ? <div className="rc-iq-kb" style={{'--rc-shade': board.kb.toFixed(3)}}><KnowledgeBase frame={{kb: {reveal: board.kb, since: board.kbSince + 1, viewer: 0, video: 0}}} playing speed={1} Video={CutVideo}/></div> : null;
  return <MotionTablet tab={TABLET} title={TITLE} to={missions} pops={board.pops} elapsed={elapsed} menuOpen={board.menu} overlay={overlay} vars={{'--rc-menu': board.menuPop.toFixed(3)}}/>;
}

// ---- the cards that follow an audit: the ones that stay are drawn all the time, the card that is new pops over them at its own place, its arrow after it (nothing moves: the group is not centered by the stage) ----
function Flow({flow, p = 1, since = 0}) {
  const first = useMemo(() => flowOf({...AUDITING_BASE, flow, flowStep: 0}), [flow]), last = useMemo(() => flowOf({...AUDITING_BASE, flow, flowStep: 1}), [flow]);
  return <div className="rc-ad-flow" style={{transformOrigin: `520px ${FLOW_CY[flow]}px`, transform: `translate(${FLOW_DX}px, ${FLOW_DY[flow]}px) scale(${FLOW_K[flow]})`}}>
    <PopFlow first={flow === 'time' ? last : first} last={last} p={p} since={since}/>
  </div>;
}

// ---- the web report's gallery (Live Oversight's report page, edge to edge over the band) ----
function Web({web}) {
  const nodes = useMemo(() => reportTree('Checkpoint'), []);
  return <div className="iq2-report rc-lo-board" style={{left: 0, top: 0, width: BOARD.w, height: BOARD.h}}>
    <div className="iq2-report-page rc-lo-page" style={{height: BOARD.h}}><div className="iq-ol-page iq-lo-usage">
      <UsageReport web={{gallery: web.gallery, scroll: web.scroll}} range={RANGE} groupBy="Checkpoint" menu={0} options={REPORT_GROUPS} dip={0}><ReportTree nodes={nodes} rows={web.rows}/></UsageReport>
    </div></div>
  </div>;
}

const LINKS = {...AUDITING_BASE, view: 'mission', panel: 'audit', expand: 1, steps: 0, hazard: 'none', scrollTo: 'top', link: true, place: PANEL};

function Layer({id, s, cut, t}) {
  switch (id) {
    case 'board': return <Tablet cut={cut} t={t} board={s.board}/>;
    case 'audit': return <AuditPanel s={{...AUDITING_BASE, ...s.audit, place: PANEL}}/>;
    case 'audit-links': return <AuditPanel s={LINKS}/>;
    case 'corrective': return <CorrectivePanel s={{...AUDITING_BASE, panel: 'corrective', ...s.corrective, place: PANEL}}/>;
    case 'training': return <TrainingPanel s={{...AUDITING_BASE, panel: 'training', ...s.training, place: PANEL}}/>;
    case 'flow-corrective': return <Flow flow="corrective" p={s.flows.corrective} since={s.since.corrective}/>;
    case 'flow-time': return <Flow flow="time" p={0}/>;
    case 'flow-followup': return <Flow flow="followup" p={s.flows.followup} since={s.since.followup}/>;
    case 'flow-training': return <Flow flow="training" p={s.flows.training} since={s.since.training}/>;
    case 'web': return <Web web={s.web}/>;
    default: return null;
  }
}

export default function AuditingCut({words = null, hide = null}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeAuditingCut(words ?? undefined), [words]);
  const s = cut.stateAt(t);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {s.layers.map(l => <div key={l.id} className="rc-ad-layer" data-rc-ad={l.id} style={{opacity: l.op < 1 ? l.op : undefined}}><Layer id={l.id} s={s} cut={cut} t={t}/></div>)}
  </CutFrame>;
}
