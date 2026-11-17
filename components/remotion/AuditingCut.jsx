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
import {MotionTablet, running} from './MotionBoard';
import {Arrow, Card, Rider, Tab} from './SectionParts';
import {KnowledgeBase} from '../ImprovedQualityV2Panels';
import UsageReport, {ReportTree} from '../UsageReport';
import {AUDITING_BASE, AUDITS, AuditPanel, CorrectivePanel, TrainingPanel} from '../sections/AuditingStage';
import {REPORT_GROUPS, reportTree} from '@/lib/liveOversightData.mjs';
import {BOARD, PANEL, RANGE, SEAT, TABLET, makeAuditingCut} from '@/lib/remotion/auditingCut.mjs';
import {clock} from '@/lib/remotion/cutCore.mjs';
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

// ---- THE TREE (the user, 2026-11-16: "show answer yes on the right and the purple arrow coming from it to correct safety hazard and then move right to left to show next just like
// requesting maintenance", "instead of just popping things ... like a camera paning ... the camera should move down as if like we are paning in the same tree"): the audit's panel, still
// open, its Yes at the right (`trigger`); the corrective mission at the right of that Yes, the purple arrow from the Yes to it; the follow-up audit under the mission; the two trainings
// at the right of the follow-up audit, a line out of it branching to them (the user, the same day: "show north building audit-2 to their left like pan right to left and show those
// missions branching"). ONE layer, drawn `cam` px up and to the left: the camera pans over it (lib/remotion/auditingCut.mjs `TREE`, `treeAt`).
// The cards and the arrow are the section films' own pieces (components/remotion/SectionParts.jsx); a line is drawn as the camera goes (`p`: how far), its arrowhead once it is there ----
const FACE = {carla: '/avatars/04.png', ben: '/avatars/03.png', leo: '/avatars/01.png'}, PURPLE = '#7b3cf0';
// (the corrective mission: open, then claimed by Carla (her name, its execution timer from 00:00:00), then closed (gray, both timers stopped); its own avatar only keeps the place: the
// avatar that took it sits there, `is-bare`)
const missionOf = c => (c.id === 'corrective'
  ? {kind: 'Task', points: 10, title: 'Correct Safety Hazard', who: c.claimed ? 'Carla M' : null, avatar: c.claimed ? FACE.carla : null, exec: c.claimed ? clock(c.exec) : null, pill: clock(c.pill), tone: c.closed ? 'gray' : 'green'}
  : c.id === 'followup' ? {kind: 'Audit', points: 25, title: 'North Building Audit-2', who: null, exec: null, pill: clock(c.since), tone: 'green'}
    : {kind: 'Media', points: 10, title: 'Safety Training', who: c.id === 'training-1' ? 'Ben R' : 'Leo T', avatar: c.id === 'training-1' ? FACE.ben : FACE.leo, exec: null, pill: clock(c.since), tone: 'green'});
const NAMES = {corrective: 'Mission Correct Safety Hazard', followup: 'Follow-up audit', 'training-1': 'Training Ben R', 'training-2': 'Training Leo T'};
function Line({l}) {
  const [x, y] = l.end, head = l.to === 'down' ? `M${x - 10} ${y - 18}L${x} ${y}L${x + 10} ${y - 18}` : `M${x - 18} ${y - 10}L${x} ${y}L${x - 18} ${y + 10}`;
  return <g data-cut-part="Arrow"><path d={l.d} pathLength="1" strokeDasharray="1" strokeDashoffset={(1 - l.p).toFixed(4)} strokeWidth="3"/>{l.p > 0.96 && <path d={head} strokeWidth="4.5" opacity={((l.p - 0.96) / 0.04).toFixed(3)}/>}</g>;
}
function Tree({s}) {
  const tr = s.tree, a = tr.audit;
  return <><div className="rc-ad-cam" style={{transform: tr.cam.x || tr.cam.y ? `translate(${(-tr.cam.x).toFixed(2)}px, ${(-tr.cam.y).toFixed(2)}px)` : undefined}}>
    {a.op > 0.001 && <div className="rc-ad-sub" data-rc-ad="audit" data-cut-part="Audit" data-cut-box=".iq2-mission" style={{opacity: a.op < 1 ? a.op : undefined}}>
      <AuditPanel s={{...AUDITING_BASE, ...s.audit, trigger: true, place: {left: a.left, top: a.top, scale: a.scale}}}/>
    </div>}
    {tr.lines.length > 0 && <svg className="rc-ad-lines" viewBox="0 0 1600 900" fill="none" stroke={PURPLE} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{tr.lines.map(l => <Line key={l.id} l={l}/>)}</svg>}
    {tr.arrow.op > 0.001 && <Arrow a={tr.arrow}/>}
    {tr.cards.map(c => (c.id === 'corrective'
      ? <div key={c.id} className="rc-sp-layer is-bare"><Card c={{...c, mission: missionOf(c)}} name={NAMES[c.id]}/></div>
      : <Card key={c.id} c={{...c, mission: missionOf(c)}} name={NAMES[c.id]}/>))}
  </div>
  {/* the mission's board: its three sections, only their tabs (the picture's own space: the camera is still while it is claimed and closed) */}
  {tr.sections.op > 0.001 && <div className="rc-ad-sub" data-cut-group="Sections" style={{opacity: tr.sections.op < 1 ? tr.sections.op : undefined}}>
    {tr.sections.list.map(x => <Tab key={x.status} x={x.x} y={tr.sections.y} k={tr.sections.k} label={`${x.status} - ${x.n}`} name={`Column ${x.status}`}/>)}
  </div>}
  {/* the avatar that takes the mission to Claimed and to Closed, and stays on it (measured on the card each frame: it follows it wherever the camera goes) */}
  <Rider face={tr.face} seat={SEAT} src={FACE.carla} on={'[data-rc-ad="tree"] [data-sec-chip="corrective"] .chip'}/>
  </>;
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

// What each layer is called on the board All storyboards (scripts/capture-cuts.mjs: `data-cut-part`), and the element inside it that is what is seen (`data-cut-box`: the piece is picked at that box)
// (the tree's pieces name themselves: the audit's panel, each card, each arrow)
const PART = {board: ['Tablet', '.rc-device'], 'audit-links': ['Audit', '.iq2-mission'], corrective: ['Corrective mission', '.iq2-mission'], training: ['Training', '.iq2-mission'], web: ['Web report', '.iq2-report']};

const LINKS = {...AUDITING_BASE, view: 'mission', panel: 'audit', expand: 1, steps: 0, hazard: 'none', scrollTo: 'top', link: true, place: PANEL};

function Layer({id, s, cut, t}) {
  switch (id) {
    case 'board': return <Tablet cut={cut} t={t} board={s.board}/>;
    case 'tree': return <Tree s={s}/>;
    case 'audit-links': return <AuditPanel s={LINKS}/>;
    case 'corrective': return <CorrectivePanel s={{...AUDITING_BASE, panel: 'corrective', ...s.corrective, place: PANEL}}/>;
    case 'training': return <TrainingPanel s={{...AUDITING_BASE, panel: 'training', ...s.training, place: PANEL}}/>;
    case 'web': return <Web web={s.web}/>;
    default: return null;
  }
}

export default function AuditingCut({words = null, hide = null, layout = null}) { // (`layout`: the variation's; 'narrator': the same film with the narrator's voice)
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeAuditingCut(words ?? undefined, {layout}), [words, layout]);
  const s = cut.stateAt(t);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {s.layers.map(l => <div key={l.id} className="rc-ad-layer" data-rc-ad={l.id} data-cut-part={PART[l.id]?.[0]} data-cut-box={PART[l.id]?.[1]} style={{opacity: l.op < 1 ? l.op : undefined}}><Layer id={l.id} s={s} cut={cut} t={t}/></div>)}
  </CutFrame>;
}
