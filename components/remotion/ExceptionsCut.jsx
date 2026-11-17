'use client';
// Exception Management, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the section's own pieces, each set by lib/remotion/exceptionsCut.mjs as a
// function of the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when
// exception-management-v2's variation is the look `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition EM-Cut).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeExceptionsCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band and the outlines are every cut's (components/remotion/CutParts.jsx); the pieces are the section films' (components/remotion/SectionParts.jsx: a layer, a
// section's tab, a card on its own, an arrow). The art has NO TABLET and no board of tickets:
//   - the manager's section: the Open tab of the Operations ticket board, by itself, counting the tickets raised
//   - a cause: the mission it is in (the section's, components/sections/ExceptionsStage.jsx `CausePanel`: a 9:16 phone's panel, the answer that raises the alert in the ticket's border
//     color), or the card it is on (the delayed mission, the one done too fast, the one rated poorly)
//   - the alert ticket it raises, an arrow from the cause to it; at the end the six of them together
// It has no rule of its own: no stylesheet.
import {useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts';
import {Arrow, Card, Layer, Name, Tab} from './SectionParts';
import {ALERTS, CAUSES, CausePanel, EXCEPTIONS_BASE, alertMission} from '../sections/ExceptionsStage';
import {makeExceptionsCut} from '@/lib/remotion/exceptionsCut.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import '../sections/sections.css';
import '../sections/sectionStyles';

// a ticket as its card (`c.kind`: the cause that raised it; `c.pill`: its timer, by the clock), and the card a cause is on (`c.pill`: the delayed mission's timer, which goes on)
const ticket = c => ({...c, mission: alertMission(ALERTS[c.kind], c.pill)});
const source = c => ({...c, mission: c.pill ? {...CAUSES[c.id], pill: c.pill} : CAUSES[c.id]});

export default function ExceptionsCut({words = null, hide = null, layout = null}) { // (`layout`: the variation's; 'narrator': the same film with the narrator's voice)
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeExceptionsCut(words ?? undefined, {layout}), [words, layout]);
  const s = cut.stateAt(t);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {/* the manager's section: the Open tab of the Operations ticket board, counting the tickets raised */}
    {/* (over it the board's name, in the ticket's color as a ticket board's header has it: the tab by itself said nothing about whose it is) */}
    <Layer id="tab">
      <Name x={s.tab.x + 4 * s.tab.k} y={s.tab.y - 24 * s.tab.k} text="Operations" part="Board name" tone="ticket"/>
      <Tab x={s.tab.x} y={s.tab.y} k={s.tab.k} label={`Open - ${s.tab.n}`} name="Column Open"/>
    </Layer>
    {/* a cause: the mission it is in (`trigger`: the answer that raises the alert is in the ticket's border color, every Yes at the right) */}
    {s.panels.map(p => <Layer key={p.id} id={p.id} op={p.op} part="Mission" box=".iq2-mission">
      <CausePanel s={{...EXCEPTIONS_BASE, view: 'panel', kind: p.id, step: p.step, timer: p.timer, trigger: true, place: {left: p.left, top: p.top, scale: p.scale}}}/>
    </Layer>)}
    {/* a cause on a card, every alert ticket and their arrows; at the end the six tickets together (a card is named by its cause, its ticket alert-<cause>: what the plan outlines) */}
    <Layer id="cards">
      {s.arrows.map(a => <Arrow key={a.id} a={a}/>)}
      {s.sources.map(c => <Card key={c.id} c={source(c)} name={`Mission ${CAUSES[c.id].title}`}/>)}
      {s.tickets.map(c => <Card key={c.id} c={ticket(c)} name={ALERTS[c.kind]}/>)}
      {s.grid.map(c => <Card key={c.id} c={ticket(c)} name={ALERTS[c.kind]}/>)}
    </Layer>
  </CutFrame>;
}
