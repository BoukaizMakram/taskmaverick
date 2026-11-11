'use client';
// Improved Quality, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the product's own pieces, each placed and set by lib/remotion/qualityCut.mjs as a
// function of the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when improved-quality-v2's variation is
// the look `remotion`, and rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition IQ-Cut, src/iqcut/IQCut.jsx).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeQualityCut`), `layout` (its variation's: null, the mission's words
// beside the big 9:16 phone; 'under', the phone smaller and its words in the band: the look `remotion-under`; 'ie', told as Increased Efficiency is: the look `remotion-like-ie`, where the plan
// says how and this file only draws the art over the band `cut.artDy` px lower), `hide`, the key of the text being retyped on the page.
// The frame, the title, the band and the outlines are every cut's (components/remotion/CutParts.jsx); the pieces here are the Improved Quality demo's own (components/ImprovedQualityV2Panels.jsx: the
// Knowledge Base, the mission "Mission Details", the closed mission with its ratings, Business Proofs; components/UsageReport.jsx, the web report), given the state the plan says, their clips played by the
// cut's clock (CutVideo). Classes of its own: .rc-iq-* (components/remotion/QualityCut.css).
import {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame, CutVideo, boxOn} from './CutParts';
import InteractiveMissionBoard from '../InteractiveMissionBoard';
import PhoneShell from '../PhoneShell';
import UsageReport from '../UsageReport';
import {BusinessProofs, IsoMission, KnowledgeBase, StoryMission} from '../ImprovedQualityV2Panels';
import {BOARD_MISSIONS, FULL, ISO, MISSION, PHONE, RATED, REPORT, STEP_SPOT, TEAM_A, makeQualityCut} from '@/lib/remotion/qualityCut.mjs';
import {mix} from '@/lib/remotion/cutCore.mjs';
import '../ImprovedQualityDemo.css';   // .iq-* (the Knowledge Base, Business Proofs, the web report, the checkboxes)
import '../ImprovedQualityV2Demo.css'; // .iq2-* (the mission, the ratings, the report's box)
import './QualityCut.css';

const TOP = {from: 'top', to: 'top', p: 1};

// ---- a tablet: the product's board in the flat black frame (.rc-device), `tab` {x, y, w}; `overlay`: drawn over its board (the Knowledge Base, Business Proofs); `menu`: its menu open (the cursor
// opened it), `menuPop` how much it is seen (it pops from its corner, the board dims behind it; it stays open, unseen, while the cursor sets off from one of its items) ----
function Tablet({tab, name, missions, title, elapsed, overlay, menu = false, menuPop = 0}) {
  const demo = useMemo(() => ({missions, elapsed, selected: null, menuOpen: menu, boardTitle: title, businessMediaLabel: 'Business Media'}), [missions, elapsed, title, menu]);
  return <div className="rc-device rc-iq-tablet" data-rc-iq={name} style={{transform: `translate(${tab.x}px, ${tab.y}px) scale(${tab.w / 1000})`, '--rc-menu': menuPop.toFixed(3)}}>
    <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={missions} demoState={demo} demoOverlay={overlay}/>
  </div>;
}

// ---- 1 · the Team Board, the Knowledge Base coming in over it (the board dimmed as it comes) ----
function Knowledge({cut, t}) {
  const k = cut.kbAt(t);
  if (!k) return null;
  const overlay = k.kb.reveal > 0.001 ? <div className="rc-iq-kb" style={{'--rc-shade': k.kb.reveal.toFixed(3)}}><KnowledgeBase frame={{kb: k.kb}} playing speed={1} Video={CutVideo}/></div> : null;
  return <Tablet tab={FULL} name="kb-tablet" missions={BOARD_MISSIONS} title="Team Board" elapsed={k.elapsed} overlay={overlay} menu={k.menu} menuPop={k.menuPop}/>;
}

// ---- 2-5 · the mission by itself: the demo's panel, opening from its summary card (`expand`), its window scrolled so the checkpoint the plan names sits under the pinned summary (the demo's own
// placing: ImprovedQualityV2Demo); in Spanish, a second panel comes over it and goes (`es`). Measured and placed each frame. ----
function placeMission(box, m) {
  if (!box) return;
  const clip = box.querySelector('.rc-iq-clip'), layers = [...box.querySelectorAll('.rc-iq-layer')];
  const first = layers[0], win0 = first?.querySelector('.iq2-m-window'), card0 = first?.querySelector('.iq2-m-summary');
  if (!clip || !win0 || !card0) return;
  // opening: only its summary card is seen, centered, then the whole panel (the demo's clip)
  const e = m.expand, H = box.offsetHeight, top = card0.offsetTop + win0.offsetTop, bottom = top + card0.offsetHeight;
  clip.style.transform = e < 1 ? `translateY(${((H / 2 - (top + bottom) / 2) * (1 - e)).toFixed(2)}px)` : '';
  clip.style.clipPath = e < 1 ? `inset(${(top * (1 - e)).toFixed(2)}px 0 ${((H - bottom) * (1 - e)).toFixed(2)}px 0 round ${(14 + 4 * e).toFixed(2)}px)` : '';
  // the scroll, in each panel (their words are not as long in Spanish)
  for (const layer of layers) {
    const content = layer.querySelector('.iq2-m-content'), win = layer.querySelector('.iq2-m-window'), chip = content?.querySelector('.iq2-m-summary');
    if (!content || !win || !chip) continue;
    const at = key => { if (key === 'top') return 0; const el = content.querySelector(`[data-iq-target="${key}"]`); return el ? el.getBoundingClientRect().top - content.getBoundingClientRect().top : 0; };
    const k = content.getBoundingClientRect().height / content.offsetHeight || 1, max = Math.max(0, content.offsetHeight - win.clientHeight), pinned = chip.offsetHeight;
    const place = key => (key === 'top' ? 0 : at(key) / k - pinned - (key.startsWith('yes-') ? STEP_SPOT : 8));
    const {from, to, p} = m.scroll, y = Math.min(max, Math.max(0, mix(place(from), place(to), p)));
    content.style.transform = `translateY(${(-y).toFixed(2)}px)`;
    chip.style.transform = `translateY(${y.toFixed(2)}px)`;
    chip.style.boxShadow = y > 2 ? '0 10px 14px -10px rgb(21 39 54 / 30%)' : 'none';
  }
}
function Mission({m, name, under = false}) {
  const box = useRef(null);
  useLayoutEffect(() => { if (m) placeMission(box.current, m); });
  if (!m) return null;
  const es = m.es ?? 0;
  return <div ref={box} className={`rc-iq-mission${under ? ' is-under' : ''}`} data-rc-iq={name} style={{left: m.x, top: m.y, width: MISSION.w, height: MISSION.h, transform: `scale(${m.s})`}}>
    <div className="rc-iq-clip">
      <div className="rc-iq-layer"><StoryMission frame={m.frame} playing speed={1} Video={CutVideo}/></div>
      {es > 0.001 && <div className="rc-iq-layer" style={{opacity: es}}><StoryMission frame={{...m.frame, mission: {...m.frame.mission, translated: true}}} playing speed={1} Video={CutVideo}/></div>}
    </div>
  </div>;
}

// ---- 6 · the closed mission out of its board, with Anna's rating under it and the peers' at its right (the demo's IsoMission), placed so all of it stays in the middle. Its purple lines are the cut's own
// (the user, 2026-11-05: "clean the purple lines too sometimes they feel disconnected": the panel's own are pieces placed by fixed offsets, apart from the cards while they come in): ONE path from the
// card to each rating, measured on the cards each frame so it always starts on the card and ends on the rating, with round corners, drawn out of the card like a trim path as the rating comes ----
function placeLines(layer, svg, lines) {
  if (!layer || !svg || !lines) return;
  const S = svg.getBoundingClientRect(), k = S.width / 1600 || 1, paths = svg.querySelectorAll('path'); // (measured from the lines' own layer, 1600 x 900 at the art's origin: right wherever the art is drawn, `artDy`)
  const chip = layer.querySelector('.iq2-iso-stack > .chip') ?? layer.querySelector('.chip'), self = layer.querySelector('.iq2-rating--self .iq2-rate-card'), peers = [...layer.querySelectorAll('.iq2-peer-slot .iq2-rate-card')];
  const draw = (path, d, p) => { if (!d || p <= 0.001) { path.style.visibility = 'hidden'; return; } path.style.visibility = ''; path.setAttribute('d', d); path.style.strokeDashoffset = (1 - p).toFixed(4); };
  if (!chip) { paths.forEach(path => draw(path, null, 0)); return; }
  const c = boxOn(chip, S, k), u = c.w / ISO.card, R = 12 * u, f = n => n.toFixed(2);
  // Anna's: straight down from the card, under its left, into the top of her rating (each end tucked under its card)
  if (self) { const s = boxOn(self, S, k), x = s.x + 36 * u; draw(paths[0], `M ${f(x)} ${f(c.y + c.h - 6)} V ${f(s.y + 6)}`, lines.self); } else draw(paths[0], null, 0);
  // each peer's: out of the card's right, along to the bracket, down to the rating's middle, into its left
  const y0 = c.y + c.h - 36 * u, bx = c.x + c.w + 29 * u;
  [0, 1].forEach(i => {
    const card = peers[i];
    if (!card) { draw(paths[1 + i], null, 0); return; }
    const p = boxOn(card, S, k), y1 = p.y + p.h / 2, r = Math.min(R, Math.abs(y1 - y0) / 2);
    draw(paths[1 + i], `M ${f(c.x + c.w - 6)} ${f(y0)} H ${f(bx - r)} Q ${f(bx)} ${f(y0)} ${f(bx)} ${f(y0 + r)} V ${f(y1 - r)} Q ${f(bx)} ${f(y1)} ${f(bx + r)} ${f(y1)} H ${f(p.x + 6)}`, lines.peers[i] ?? 0);
  });
}
function Ratings({cut, t}) {
  const r = cut.isoAt(t), layer = useRef(null), svg = useRef(null);
  useLayoutEffect(() => { if (r) placeLines(layer.current, svg.current, r.lines); });
  if (!r) return null;
  return <>
    <svg ref={svg} className="rc-iq-lines" viewBox="0 0 1600 900" aria-hidden="true">{[0, 1, 2].map(i => <path key={i} pathLength="1"/>)}</svg>
    <div ref={layer} className="iq2-iso-layer rc-iq-iso" data-rc-iq="iso" style={{transform: `translate(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px) scale(${(r.w / ISO.card).toFixed(4)})`}}>
      <IsoMission mission={{...RATED, ratings: r.ratings}} frame={{rating: r.rating}} width={ISO.card}/>
    </div>
  </>;
}

// ---- 7 · Team A's tablet with Business Proofs, then a phone beside it with the same proofs, both scrolled through them ----
function Proofs({cut, t}) {
  const p = cut.proofsAt(t);
  if (!p) return null;
  const pin = p.proofs.in, overlay = pin > 0.001 ? <div className="iq-bp-layer" style={{opacity: Math.min(1, pin * 1.5), transform: `translateX(${(4 * (1 - pin)).toFixed(2)}%)`}}><BusinessProofs tablet scroll={p.proofs.scroll}/></div> : null;
  return <>
    <Tablet tab={p.tab} name="tablet" missions={TEAM_A} title="Team A" elapsed={p.elapsed} overlay={overlay} menu={p.menu} menuPop={p.menuPop}/>
    {p.phone && <div className="rc-iq-phone" data-rc-iq="phone" style={{left: p.phone.x, top: p.phone.y, width: PHONE.w, opacity: p.phone.op, transform: `scale(${p.phone.pop.toFixed(4)})`}}>
      <div className="ph-fit"><PhoneShell title="Team A" tabs={[{label: 'Open - 3', active: true}, {label: 'Claimed - 2'}, {label: 'Closed - 4'}]} overlay={<div className="iq-bp-layer"><BusinessProofs scroll={p.proofs.scroll}/></div>}/></div>
    </div>}
  </>;
}

// ---- 8 · the web Usage Report, nearly edge to edge ----
function Report({cut, t}) {
  const w = cut.webAt(t);
  if (!w) return null;
  return <div className="iq2-report rc-iq-report" data-rc-iq="report" style={{left: REPORT.x, top: REPORT.y, width: REPORT.page, height: REPORT.h, transform: `scale(${REPORT.s})`}}>
    <div className="iq2-report-page"><UsageReport web={w}/></div>
  </div>;
}

// ---- 9 · the closing words: the mission, done (the guidance), beside the tablet with its proofs (the oversight) ----
function End({cut, t}) {
  const e = cut.endAt(t);
  if (!e) return null;
  return <div className="rc-iq-end" style={{opacity: e.op}}>
    <Mission m={{...e.mission, expand: 1, scroll: TOP, es: 0}} name="end-mission"/>
    <Tablet tab={e.tablet} name="end-tablet" missions={TEAM_A} title="Team A" elapsed={e.elapsed} overlay={<div className="iq-bp-layer"><BusinessProofs tablet scroll={0}/></div>}/>
  </div>;
}

export default function QualityCut({words = null, layout = null, hide = null}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeQualityCut(words ?? undefined, {layout}), [words, layout]);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage}>
    {/* the art that has the words under it, in the band: drawn `cut.artDy` px lower when the cut says so (the layout 'ie': as much room over it as between it and the words, Increased
        Efficiency's way; .rc-iq-ie: what that layout changes in its look). The mission has no words under it and stays where it is; it is over these (z 9) as it always was */}
    <div className={`rc-iq-art${cut.artDy ? ' rc-iq-ie' : ''}`} style={cut.artDy ? {transform: `translateY(${cut.artDy}px)`} : undefined}>
      <Knowledge cut={cut} t={t}/>
      <Ratings cut={cut} t={t}/>
      <Proofs cut={cut} t={t}/>
      <Report cut={cut} t={t}/>
      <End cut={cut} t={t}/>
    </div>
    <Mission m={cut.missionAt(t)} name="mission" under={layout === 'under'}/>
  </CutFrame>;
}
