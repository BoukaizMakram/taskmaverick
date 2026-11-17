'use client';
// Reporting & AI, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the section's own page, set by lib/remotion/reportingCut.mjs as a function of the
// time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when reporting-ai-v2's variation is the look
// `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition RA-Cut).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeReportingCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band, the cursor and the outlines are every cut's (components/remotion/CutParts.jsx). The art is ONE page, edge to edge over the band: the web app's Data Board
// (components/sections/ReportingStage.jsx in its `bare` way: the whole 1600 px across, each level open by a number), with the viewer of a photo or a video over it. As in Precision Planning's
// cut (components/remotion/PlanningCut.jsx), two things are done here, by the clock, on the page as it is drawn: the rows of a level that opens come in one after the other (`RowPop`), and the
// list is scrolled to the row that was opened (`ListScroll`: the plan names a place {from, to, p} and this file measures the rows each frame). Classes of its own: .rc-ra-* (ReportingCut.css).
import {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame, CutVideo} from './CutParts';
import ReportingStage from '../sections/ReportingStage';
import {BOARD, makeReportingCut} from '@/lib/remotion/reportingCut.mjs';
import {OUT, clamp, mix} from '@/lib/remotion/cutCore.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import '../sections/sections.css';
import '../sections/sectionStyles';
import './OversightCut.css';               // .rc-lo-board, .rc-lo-page: the page edge to edge, no border, corners or shadow
import './ReportingCut.css';

// the list's scroll: from the place it was to the one the plan names (a row's top, measured on the rows as they are now), clamped to the list. It is a piece of its own, drawn after the page and
// before the outlines and the cursor (CutFrame draws them after its children), so the list is where it is going to be when they are measured
function ListScroll({scroll}) {
  const me = useRef(null);
  useLayoutEffect(() => {
    const root = me.current?.parentElement, win = root?.querySelector('.sec-scroll'), body = win?.querySelector('.iq-dr-body');
    if (!win || !body) return;
    const k = body.getBoundingClientRect().width / (body.offsetWidth || 1) || 1;
    const place = key => { if (key === 'top') return 0; const el = body.querySelector(`[data-iq-target="${key}"]`); return el ? (el.getBoundingClientRect().top - body.getBoundingClientRect().top) / k - 4 : 0; };
    const max = Math.max(0, body.offsetHeight - win.clientHeight), {from, to, p} = scroll;
    win.scrollTop = Math.min(max, Math.max(0, mix(place(from), place(to), p)));
  });
  return <i ref={me} hidden/>;
}

// the rows of a level that opens come in one after the other (a short rise and a fade, the way out), as Precision Planning's do: by the clock, like the folding. `rows`: how far each level's
// have come in, [the unit's teams, the team's people, the person's missions, the mission's statements], each a straight 0 to 1; however many rows a level has, the last one is in by the end
const LEVELS = [['teams-block', true], ['people-block', true], ['missions-block', true], ['statements-block', false]]; // (a block of blocks, each with its row first; the statements' rows are the block's own children)
function RowPop({rows}) {
  const me = useRef(null);
  useLayoutEffect(() => {
    const root = me.current?.parentElement;
    if (!root) return;
    LEVELS.forEach(([key, nested], n) => {
      const box = root.querySelector(`[data-iq-target="${key}"]`);
      if (!box) return;
      const list = [...box.children].map(el => (nested ? el.querySelector(':scope > .iq-dr-row') : el)).filter(Boolean), gap = Math.min(0.12, 0.5 / Math.max(1, list.length - 1)), p = rows[n] ?? 0;
      list.forEach((row, i) => {
        const q = clamp((p - 0.04 - i * gap) / 0.42);
        row.style.opacity = q < 1 ? OUT(q).toFixed(3) : '';
        row.style.transform = q < 1 ? `translateY(${((1 - OUT(q)) * 12).toFixed(2)}px)` : '';
      });
    });
  });
  return <i ref={me} hidden/>;
}

export default function ReportingCut({words = null, hide = null, layout = null}) { // (`layout`: the variation's; 'narrator': the same film with the narrator's voice)
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeReportingCut(words ?? undefined, {layout}), [words, layout]);
  const s = cut.stateAt(t), v = s.viewer;
  // (the page says its name, `data-rc-layer`: what the cursor presses and what is outlined is found in it; on the board All storyboards the page is one piece, "Board", and the viewer another,
  // "Viewer": ReportingStage names them in its `bare` way)
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    <div className="rc-ra-page" data-rc-layer="page">
      <ReportingStage state={{open: s.open, viewer: v ? v.kind : null, viewerOp: v ? v.op : 1, viewerTime: v ? v.time : 0, viewerPlaying: !!v?.playing}} bare={BOARD} Video={CutVideo}/>
      <RowPop rows={s.rows}/>
      <ListScroll scroll={s.scroll}/>
    </div>
  </CutFrame>;
}
