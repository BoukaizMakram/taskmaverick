'use client';
// Precision Planning, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the section's own page, set by lib/remotion/planningCut.mjs as a function of the
// time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when precision-planning-v2's variation is the look
// `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition PP-Cut, src/ppcut/PPCut.jsx).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makePlanningCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band, the cursor and the outlines are every cut's (components/remotion/CutParts.jsx). The art is ONE page, edge to edge over the band: the web app's Overview, Personal
// Board, Timeline (components/sections/PlanningStage.jsx in its `bare` way: the whole 1600 px across, what folds open by numbers). The list is scrolled here, by the clock: the plan names a place
// ({from, to, p}) and this file measures the rows each frame, so the list goes to the team as the rows open. Classes of its own: .rc-pl-* (below, components/remotion/AuditingCut.css's neighbour:
// components/remotion/PlanningCut.css).
import {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts';
import PlanningStage from '../sections/PlanningStage';
import {BOARD, makePlanningCut} from '@/lib/remotion/planningCut.mjs';
import {OUT, POP, clamp, mix} from '@/lib/remotion/cutCore.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import '../sections/sections.css';
import '../sections/sectionStyles';
import './OversightCut.css';               // .rc-lo-board: the page edge to edge, no border, corners or shadow
import './PlanningCut.css';

// the list's scroll: from the place it was to the one the plan names (a row's top, measured on the rows as they are now), clamped to the list. It is a piece of its own, drawn after the page and
// before the outlines and the cursor (CutFrame draws them after its children), so the list is where it is going to be when they are measured
function ListScroll({scroll}) {
  const me = useRef(null);
  useLayoutEffect(() => {
    const root = me.current?.parentElement, win = root?.querySelector('.sec-scroll'), body = root?.querySelector('.sec-pl-body');
    if (!win || !body) return;
    const k = body.getBoundingClientRect().width / (body.offsetWidth || 1) || 1;
    const place = key => { if (key === 'top') return 0; const el = body.querySelector(`[data-iq-target="${key}"]`); return el ? (el.getBoundingClientRect().top - body.getBoundingClientRect().top) / k - 4 : 0; };
    const max = Math.max(0, body.offsetHeight - win.clientHeight), {from, to, p} = scroll;
    win.scrollTop = Math.min(max, Math.max(0, mix(place(from), place(to), p)));
  });
  return <i ref={me} hidden/>;
}

// the motion Increased Efficiency's missions have, for the rows that open (the user, 2026-11-12: "missions popping in ... is not there"): as a location or a team opens, its rows come in one after the
// other (a short rise and a fade, the way out) and the count in each of their hours pops once, the pop curve. By the clock, like the folding (`unit`, `ops`, `kitchen`: how far each is open)
function RowPop({open}) {
  const me = useRef(null);
  useLayoutEffect(() => {
    const root = me.current?.parentElement;
    if (!root) return;
    for (const [key, p] of [['teams-block', open.unit], ['missions-ops', open.ops], ['missions-kitchen', open.kitchen]]) {
      const box = root.querySelector(`[data-iq-target="${key}"]`);
      if (!box) continue;
      [...box.children].forEach((block, i) => {
        const row = block.querySelector(':scope > .sec-pl-row');
        if (!row) return;
        const q = clamp((p - 0.04 - i * 0.12) / 0.5), pop = clamp((p - 0.2 - i * 0.12) / 0.4);
        row.style.opacity = q < 1 ? OUT(q).toFixed(3) : '';
        row.style.transform = q < 1 ? `translateY(${((1 - OUT(q)) * 12).toFixed(2)}px)` : '';
        row.querySelectorAll('.sec-pl-hours > i > b').forEach(b => { b.style.display = 'inline-block'; b.style.transform = pop < 1 ? `scale(${mix(0.4, 1, POP(pop)).toFixed(4)})` : ''; });
      });
    }
  });
  return <i ref={me} hidden/>;
}

export default function PlanningCut({words = null, hide = null}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makePlanningCut(words ?? undefined), [words]);
  const s = cut.stateAt(t);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    <div className="rc-pl-page" data-rc-pl="page">
      <PlanningStage state={{unit: s.unit, ops: s.ops, kitchen: s.kitchen}} bare={BOARD}/>
      <RowPop open={s}/>
      <ListScroll scroll={s.scroll}/>
    </div>
  </CutFrame>;
}
