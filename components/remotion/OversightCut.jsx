'use client';
// Live Oversight, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the web app's own pages, each set by lib/remotion/oversightCut.mjs as a function
// of the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when live-oversight-v2's variation is the
// look `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition LO-Cut, src/locut/LOCut.jsx).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeOversightCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band, the cursor and the outlines of single things are every cut's (components/remotion/CutParts.jsx). The art is ONE big board, edge to edge over the band: the web
// window's 1600 px page, which is the Overview (components/OverviewScene.jsx: the Team Board, the mission's details, the photo and video viewer), the Data Board (components/DataReport.jsx) or
// the Usage Report (components/UsageReport.jsx), as the section's videos draw them (components/sections/LiveOversightStage.jsx); a page a click goes to comes in over the one before. The
// outlines of the board's rows and columns are this file's (`BoardMarks`: measured on the table each frame, as the board's videos measure them: lib/sections/rows.mjs).
// Classes of its own: .rc-lo-* (components/remotion/OversightCut.css).
import {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame, CutVideo} from './CutParts';
import OverviewScene from '../OverviewScene';
import DataReport from '../DataReport';
import UsageReport, {ReportTree} from '../UsageReport';
import {REPORT_GROUPS, reportTree} from '@/lib/liveOversightData.mjs';
import {rowsRect} from '@/lib/sections/rows.mjs';
import {BOARD, CLIP, CUT_W, RANGE, makeOversightCut} from '@/lib/remotion/oversightCut.mjs';
import '../EfficiencyStoryDemo.css';   // (the films' shared pieces the pages lean on, as components/LiveOversightDemo.jsx and the sections' stage import them)
import '../ImprovedQualityDemo.css';   // .iq-ur-*, .iq-dr-* (the reports), .iq-mv-* (the viewer)
import '../ImprovedQualityV2Demo.css'; // .iq2-report (the web window)
import '../LiveOversightDemo.css';     // .iq-ow-*, .iq-od-*, .iq-ol-page (the Overview, the mission's details)
import '../web/web.css';               // .ow-* (the workspace)
import './OversightCut.css';

// the viewer's video, played by the cut's clock (CutVideo: it runs with the picture while it plays, else it holds its frame)
const Clip = props => <CutVideo {...props} src={CLIP}/>;

// ---- the pages: the one on, and for a moment the one a click went to coming in over it ----
function Usage({usage}) {
  const nodes = useMemo(() => reportTree(usage.groupBy), [usage.groupBy]);
  return <div className="iq-ol-page iq-lo-usage">
    <UsageReport web={usage.web} range={RANGE} groupBy={usage.groupBy} menu={usage.menu} options={REPORT_GROUPS} dip={0}><ReportTree nodes={nodes} rows={usage.rows}/></UsageReport>
  </div>;
}
function Pages({cut, t}) {
  const s = cut.stateAt(t);
  return <div className="iq2-report rc-lo-board" data-cut-part="Board" style={{left: 0, top: 0, width: BOARD.w, height: BOARD.h}}>
    {s.pages.map(p => <div key={p.page} className="iq2-report-page rc-lo-page" data-rc-lo={p.page} style={{height: BOARD.h, opacity: p.op < 1 ? p.op : undefined}}>
      {p.page === 'overview' && <div className="iq-ol-page"><OverviewScene frame={s.overview} playing speed={1} Video={Clip}/></div>}
      {p.page === 'data' && <div className="iq-ol-page"><DataReport/></div>}
      {p.page === 'usage' && <Usage usage={s.usage}/>}
    </div>)}
  </div>;
}

// ---- the outlines of the board's table: the rows of the missions in a state, from their number to that state's column (lib/sections/rows.mjs: only the rows the list shows), or a whole column
// from its title to the bottom of the list; measured each frame, so they follow the list; they pop in as every outline does ----
function BoardMarks({cut, t, stage}) {
  const list = cut.boardMarksAt(t), layer = useRef(null);
  useLayoutEffect(() => {
    const el = layer.current, root = stage.current;
    if (!el || !root) return;
    const S = root.getBoundingClientRect(), k = S.width / CUT_W || 1, page = root.querySelector('[data-rc-lo="overview"]');
    [...el.children].forEach((node, i) => {
      const m = list[i];
      let r = null;
      if (page && m?.kind === 'rows') r = rowsRect(page, m.state, m.col);
      else if (page && m) {
        const th = page.querySelector(`th[data-iq-col="${m.col}"]`), area = th?.closest('.ow-table-scroll')?.querySelector('.iq-ow-rows');
        if (th && area) { const a = th.getBoundingClientRect(), b = area.getBoundingClientRect(); r = {left: a.left, top: a.top, right: a.right, bottom: b.bottom - (m.pad + 8) * k}; } // (its bottom edge stays over the band of the words)
      }
      if (!r) { node.style.visibility = 'hidden'; return; }
      const x = (r.left - S.left) / k, y = (r.top - S.top) / k, w = (r.right - r.left) / k, h = (r.bottom - r.top) / k;
      node.style.visibility = '';
      node.style.width = `${(w + 2 * m.pad).toFixed(2)}px`; node.style.height = `${(h + 2 * m.pad).toFixed(2)}px`;
      node.style.transform = `translate(${(x - m.pad).toFixed(2)}px, ${(y - m.pad).toFixed(2)}px) scale(${m.pop.toFixed(4)})`;
    });
  });
  return <div ref={layer} className="rc-marks">{list.map(m => <i key={`${m.kind}:${m.state ?? ''}:${m.col}`} className="iq2-mark rc-mark" data-cut-part="Yellow outline" style={{opacity: m.op}}/>)}</div>;
}

export default function OversightCut({words = null, hide = null}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeOversightCut(words ?? undefined), [words]);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage} over={<BoardMarks cut={cut} t={t} stage={stage}/>}>
    <Pages cut={cut} t={t}/>
  </CutFrame>;
}
