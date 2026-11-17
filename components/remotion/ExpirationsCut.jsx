'use client';
// Tracking Expirations, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the product's own pieces, each set by lib/remotion/expirationsCut.mjs as a
// function of the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when
// tracking-expirations-v2's variation is the look `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition TE-Cut).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeExpirationsCut`), `hide`, the key of the text being retyped.
// The frame, the title, the band and the outlines are every cut's (components/remotion/CutParts.jsx; this film has no cursor: nothing is pressed); the pieces are the section films'
// (components/remotion/SectionParts.jsx: a section's tab, a card on its own, an arrow). The art has NO TABLET (the user, 2026-11-16, of Requesting Maintenance's: "show only the open section
// without the tablet"):
//   - the Open section of the board "Food Freshness" by itself: its tab over the five items' cards, each with its running timer; Cooked Rice's turns orange, then red, and the card rises
//   - the alert ticket the expired item raises, at its right, an arrow from the item to it
// Classes of its own: .rc-ex-* (components/remotion/ExpirationsCut.css).
import {useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts';
import {Arrow, Card, Layer, Tab} from './SectionParts';
import {makeExpirationsCut} from '@/lib/remotion/expirationsCut.mjs';
import '../EfficiencyStoryDemo.css';       // (the films' shared pieces the sections' art leans on, as components/sections/SectionStage.jsx imports them)
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import '../sections/sections.css';
import '../sections/sectionStyles';
import './ExpirationsCut.css';

export default function ExpirationsCut({words = null, hide = null, layout = null}) { // (`layout`: the variation's; 'narrator': the same film with the narrator's voice)
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeExpirationsCut(words ?? undefined, {layout}), [words, layout]);
  const s = cut.stateAt(t), o = s.open, c = s.cards;
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {/* the Open section of the board, with no tablet: its tab, then its items, each posted at the bottom. An item is in a box of its own only so that the one that rises has a lifted card's
        shadow (`is-up`); it is the last of the list, so it is drawn over the ones it passes (a card's own z-index would put it under them: every card's layer has one) */}
    {o.op > 0.001 && <Layer id="open" op={o.op}>
      <Tab x={o.x} y={o.y} k={o.k} label={`Open - ${o.count}`} name="Column Open"/>
      {o.chips.map(m => <div key={m.id} className={`rc-ex-item${m.up ? ' is-up' : ''}`}><Card c={m} name={`Mission ${m.mission.title}`} pill={m.pillPop}/></div>)}
    </Layer>}
    {/* the alert ticket the expired item raises, and the arrow from the item to it */}
    {c.op > 0.001 && <Layer id="cards" op={c.op}>
      {c.arrows.map(a => <Arrow key={a.id} a={a}/>)}
      {c.ticket && <Card c={c.ticket} name="Alert ticket"/>}
    </Layer>}
  </CutFrame>;
}
