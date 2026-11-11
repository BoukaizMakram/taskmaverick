'use client';
// Live Oversight's art for the section videos (lib/sections/live-oversight.mjs): the web window of the Live Oversight film (components/LiveOversightDemo.jsx), the Overview, the Data Board or
// the Usage Report, at a state given as data instead of a time. The window shows 1110 px of the 1600 px page (`pan`), like the Improved Quality report's.
import OverviewScene from '../OverviewScene';
import DataReport from '../DataReport';
import UsageReport, {ReportTree} from '../UsageReport';
import {REPORT_GROUPS, reportTree} from '@/lib/liveOversightData.mjs';
import {useRef} from 'react';
import {useCenter} from './parts';

const FULL_H = 768; // (the full board's height: the picture (900) less the words' band (132), as a big board is shown in every video: `BOARD` in components/storyboardPlayerDom.js)
export const LIVE_OVERSIGHT_BASE = {full: false, focus: null, page: 'overview', pan: 0, view: 'Running', scroll: 1, drawer: 0, viewer: null, groupBy: 'Unit', menu: 0, gallery: false, reportScroll: 0, colMenu: null, filter: null, boardGroup: 'Unit', boardGroupMenu: false}; // (colMenu: a column's ⋮ menu open on the overview, {col, kw, people, picked}; filter: what History keeps, {name, by}; boardGroup: the overview's Group by ('Person': History by who closed each run), boardGroupMenu: its menu open)

export default function LiveOversightStage({state}) {
  const s = {...LIVE_OVERSIGHT_BASE, ...state}, win = useRef(null);
  useCenter(win, {focus: s.focus, pan: s.pan});
  const frame = {view: s.view, historyDip: 0, scroll: s.scroll, drawer: s.drawer, time: 0, menu: s.colMenu, filter: s.filter, group: s.boardGroup, groupMenu: s.boardGroupMenu, viewer: s.viewer ? {in: 1, live: 0, index: 0, ...s.viewer} : {kind: 'photo', in: 0, live: 0}};
  // `full`: the whole board (the page, 1600 wide) edge to edge over the picture, the words in the gray band under it (the user, 2026-10-21: "for the boards, you should go edge to edge ... instead
  // of having that light gray background behind the board ... with a gray area down. Make it as big as possible"): 1600 x 768, the band is the last 132 px (`UNDER`, lib/sections/captureCore.mjs)
  const box = s.full ? {left: 0, top: 0, width: 1600, height: FULL_H, borderRadius: 0, borderWidth: 0, boxShadow: 'none'} : {left: 24, top: 62, width: 1110, height: 776};
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={box}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: s.full ? FULL_H : 760}}>
      {s.page === 'overview' && <div className="iq-ol-page"><OverviewScene frame={frame} playing={false} speed={1}/></div>}
      {s.page === 'data' && <div className="iq-ol-page"><DataReport/></div>}
      {s.page === 'usage' && <div className="iq-ol-page iq-lo-usage">
        <UsageReport web={{gallery: s.gallery, scroll: s.reportScroll}} range="09/22/2026 – 09/28/2026" groupBy={s.groupBy} menu={s.menu} options={REPORT_GROUPS} dip={0}><ReportTree nodes={reportTree(s.groupBy)} rows={s.gallery ? 1 : 0}/></UsageReport>
      </div>}
    </div>
  </div>;
}
