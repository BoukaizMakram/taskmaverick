'use client';
// Increased Efficiency, the Remotion cut redone from the storyboard (the user, 2026-11-09: "redo the increased effeciency video based on .../storyboard?video=all-storyboards, read the notes and what's
// in the slide and use remotion to redo the video"): a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the product's own pieces, each placed by
// lib/remotion/efficiencyRedo.mjs as a function of the time (what each slide and note asked for: the top of that file). Played on the All videos page by Remotion's Player when the board's variation is
// the look `remotion-storyboard` (components/remotion/index.js gives it the layout 'storyboard'), rendered by the Remotion project D:\Documents\Saas\videos (composition IE-Redo).
// The look `remotion-straight` (the layout 'straight', composition IE-Straight) is the same film as Variation 7 has it (the user's comments of 2026-11-11: the titles beside the missions alone,
// straight-line claims and closes, an orange strip behind the execution timers; the plan says how, this file only gives it the layout and the strip's color).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs; the cut is made from them), `hide`, the key of the text being retyped on the page,
// `layout`, the variation's ('storyboard', 'straight'; none: 'storyboard').
// The pieces: the missions alone (MissionChip as the board draws it), the picture of the team, the tablet's board (InteractiveMissionBoard: frame, header, columns with their counts; its own cards
// hidden, the missions drawn over it), the board without its tablet (its blue column tabs), the team's faces, the picture of the three with their phones (three PhoneShells until it is made) and
// the stars popping on the phones.
// The stage, the title and the words are every cut's (components/remotion/CutParts.jsx); classes of its own: .rc-* (components/remotion/EfficiencyRedo.css, with EfficiencyCut.css).
import {memo, useLayoutEffect, useMemo, useRef} from 'react';
import {Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts';
import InteractiveMissionBoard from '../InteractiveMissionBoard';
import MissionChip from '../MissionChip';
import PhoneShell from '../PhoneShell';
import {ALL_CARDS, ART_DY, BOARD, CARD, CREW, LANES, LANE_TAB, PEOPLE, PHONES_IMG, PHONES_PHOTO, PHOTO, SHARE_IMG, SHARE_PHOTO, STAR, clamp, laneX, makeRedoCut, view} from '@/lib/remotion/efficiencyRedo.mjs';
import '../ImprovedQualityV2Demo.css'; // .iq2-iso-* (a card out of its board)
import './EfficiencyCut.css';         // .rc-card, .rc-tablet, .rc-face, .rc-phone, .rc-photo (the cut it redoes)
import './EfficiencyRedo.css';

const EXPAND = 'M7 3H3v4M13 3h4v4M17 3l-5 5M3 13v4h4M3 17l5-5M17 13v4h-4'; // (the board's column tab icon)

// ---- the picture of the team at the tablet on its wall (slide 8): it comes in round our tablet as ours goes onto its wall, pushes in, and our tablet comes out of it again ----
// `front`: the same picture with only what stands in front of its wall tablet (Ben's head), drawn over our tablet on the wall
function Photo({cut, t, front = false}) {
  const p = cut.photoAt(t), src = front ? SHARE_PHOTO.front : SHARE_PHOTO.src;
  if (p.op <= 0.001 || !src) return null;
  return <div className={`rc-photo${front ? ' rc-photo--front' : ''}`} data-cut-part={front ? 'Picture (in front)' : 'Picture'} style={{left: PHOTO.x, top: PHOTO.y, width: PHOTO.w, height: PHOTO.h, borderRadius: PHOTO.r, opacity: p.op}}>
    <Img src={src} alt="" style={{left: SHARE_IMG.x, top: SHARE_IMG.y, width: SHARE_IMG.w, height: SHARE_IMG.h, transformOrigin: `${p.origin.x}px ${p.origin.y}px`, transform: `translate(${p.dx}px, ${p.dy}px) scale(${p.z})`}}/>
  </div>;
}

// ---- a star popping out of a phone (slides 10 and 11: "a star poping, showing that an action is reflected on other devices"): the star with one small overshoot, turning a little, a ring going
// out and six sparks; `p` 0 to 1 over STAR.dur ----
const STAR_PATH = 'M0 -50 C6 -14 14 -6 50 0 C14 6 6 14 0 50 C-6 14 -14 6 -50 0 C-14 -6 -6 -14 0 -50 Z';
const ease = p => 1 - (1 - p) ** 3;
function Star({x, y, p}) {
  const size = STAR.size, grow = p < 0.32 ? 0.15 + 1.05 * ease(p / 0.32) * (1 + 0.18 * Math.sin(Math.PI * Math.min(1, p / 0.32))) : 1.2 - 0.2 * ease(Math.min(1, (p - 0.32) / 0.3));
  const op = p < 0.68 ? 1 : 1 - (p - 0.68) / 0.32, ring = ease(Math.min(1, p / 0.7)), spark = ease(Math.min(1, p / 0.6));
  return <div className="rc-star" data-cut-part="Star" style={{left: x - size / 2, top: y - size / 2, width: size, height: size}}>
    <i className="rc-star-ring" style={{transform: `scale(${0.3 + 1.5 * ring})`, opacity: 0.85 * (1 - ring)}}/>
    {[0, 1, 2, 3, 4, 5].map(k => { const a = (k * 60 + 30) * Math.PI / 180, d = size * (0.18 + 0.62 * spark); return <i key={k} className="rc-star-spark" style={{transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(${1 - 0.6 * spark})`, opacity: p < 0.15 ? 0 : 1 - Math.min(1, (p - 0.2) / 0.45)}}/>; })}
    <svg viewBox="-50 -50 100 100" style={{transform: `scale(${grow}) rotate(${(28 * ease(Math.min(1, p / 0.8))).toFixed(2)}deg)`, opacity: op}} aria-hidden="true"><path d={STAR_PATH}/></svg>
  </div>;
}

// ---- a press on a phone's screen (the CEO, 2026-11-09: "the guy presses with his hand ... and it does this for the others"): a fingertip coming down on the screen and two rings going out of
// it; the stars then pop on the OTHER phones. `p` 0 to 1 over STAR.press ----
function Press({x, y, p}) {
  const size = STAR.size * 0.9, dot = 1.3 - 0.5 * ease(Math.min(1, p / 0.22)), op = Math.min(1, p / 0.1) * (p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3);
  return <div className="rc-press" data-cut-part="Press" style={{left: x - size / 2, top: y - size / 2, width: size, height: size}}>
    {[0, 1].map(k => { const q = Math.max(0, Math.min(1, (p - 0.18 - k * 0.2) / 0.6)); return <i key={k} className="rc-press-ring" style={{transform: `scale(${(0.3 + 1.3 * ease(q)).toFixed(3)})`, opacity: q <= 0 ? 0 : 0.9 * (1 - q)}}/>; })}
    <i className="rc-press-dot" style={{transform: `scale(${dot.toFixed(3)})`, opacity: op}}/>
  </div>;
}

// ---- slides 10 and 11: the picture of the three, each with a phone in their hands, or (until it is made) our three phones in a triangle, each with its person's face; the stars over them ----
function Phones({cut, t}) {
  const p = cut.phonesAt(t);
  if (p.op <= 0.001) return null;
  const stars = p.stars.length || p.presses.length ? <div className="rc-stars" data-cut-group="Stars" style={{opacity: p.op}}>{p.presses.map(s => <Press key={s.key} x={s.x} y={s.y} p={s.p}/>)}{p.stars.map(s => <Star key={s.key} x={s.x} y={s.y} p={s.p}/>)}</div> : null;
  if (PHONES_PHOTO.src) return <>
    <div className="rc-photo rc-photo--phones" data-cut-part="Picture phones" style={{left: PHOTO.x, top: PHOTO.y, width: PHOTO.w, height: PHOTO.h, borderRadius: PHOTO.r, opacity: p.op}}>
      <Img src={PHONES_PHOTO.src} alt="" style={{left: PHONES_IMG.x, top: PHONES_IMG.y, width: PHONES_IMG.w, height: PHONES_IMG.h, transformOrigin: `${PHOTO.w / 2 - PHONES_IMG.x}px ${PHOTO.h / 2 - PHONES_IMG.y}px`, transform: `scale(${p.z})`}}/>
    </div>
    {stars}
  </>;
  return <><div className="rc-trio" data-cut-group="Phones" style={{opacity: p.op}}>
    {p.phones.map(ph => <div key={ph.who} className="rc-phone" data-cut-part={`Phone ${PEOPLE[ph.who].name}`} data-cut-box=".ph-phone" style={{left: ph.x, top: ph.y, width: ph.w, transform: `scale(${ph.s})`}}>
      <div className="ph-fit"><PhoneShell title={cut.names.board.personal} tabs={[{label: `Open - ${ph.list.length}`, active: true}, {label: 'Claimed - 0'}, {label: 'Closed - 0'}]}>
        {ph.list.map(m => <div key={m.id} className="es-phone-mission" data-rc-mission={m.id}><MissionChip title={m.title} points={null} date="07-14-26" time="10:00 AM" pillTime={m.pill}/></div>)}
      </PhoneShell></div>
      <Img className="rc-phone-face rc-trio-face" data-cut-part={`Phone ${PEOPLE[ph.who].name} avatar`} src={PEOPLE[ph.who].src} alt="" style={{left: -ph.face * 0.35, top: -ph.face * 0.35, width: ph.face, height: ph.face}}/>
    </div>)}
  </div>{stars}</>;
}

// ---- the tablet: the board's own frame, header and columns (their counts follow the story), with no cards of its own; `dim`: the Open column darkened (the camera on Claimed and Closed) ----
const placeholders = counts => ['open', 'claimed', 'closed'].flatMap(status => Array.from({length: counts[status]}, (_, i) => ({id: `rc-${status}-${i}`, title: '', type: 'Task', status, points: null, date: '', time: '', ageSeconds: 0})));
const Board = memo(function Board({open, claimed, closed, dim, title}) {
  const missions = useMemo(() => placeholders({open, claimed, closed}), [open, claimed, closed]);
  const demo = useMemo(() => ({missions, elapsed: 0, selected: null, menuOpen: false, boardTitle: title, businessMediaLabel: 'Business Media'}), [missions, title]);
  const shade = dim > 0 ? [0].map(c => <i key={c} className="rc-colshade" aria-hidden="true" style={{left: `calc(${BOARD.col(c) - 9} * var(--ref-u))`, width: `calc(${BOARD.pitch} * var(--ref-u))`, opacity: dim * 0.55}}/>) : null;
  return <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={missions} demoState={demo} demoBoard={shade}/>;
});
function Tablet({cut, t, ctx}) {
  const {tab, cam} = ctx;
  if (tab.op <= 0.001) return null;
  const p = view(cam, tab), n = cut.countsAt(t);
  return <div className="rc-tablet rc-device" data-cut-part="Tablet" style={{transform: `translate(${p.x}px, ${p.y}px) scale(${(tab.w * cam.z) / 1000})`, opacity: tab.op}}>
    <Board open={n.open} claimed={n.claimed} closed={n.closed} dim={Math.round(cut.dimAt(t) * 100) / 100} title={cut.names.board.team}/>
  </div>;
}

// ---- the board without its tablet (the initiative): its blue column tabs over the three columns ----
function LaneTabs({cut, t}) {
  const op = cut.laneOp(t);
  if (op <= 0.001) return null;
  const n = cut.laneCountsAt(t);
  return <div className="rc-lanes" data-cut-group="Columns" style={{opacity: op}}>
    {['open', 'claimed', 'closed'].map((status, c) => <div key={status} className="rc-lane-tab" data-cut-part={`Column ${status[0].toUpperCase()}${status.slice(1)}`} data-cut-seen=".tbl-tab"
      style={{transform: `translate(${laneX(c)}px, ${LANES.y - LANE_TAB.gap - LANE_TAB.h}px) scale(${LANES.s})`}}>
      <div className="mi-interactive mi-interactive--tablet mi-reference"><div className="mi-tablet-board iq2-iso-board"><div style={{width: CARD.w}}>
        <h2 className="tbl-tab">{status[0].toUpperCase() + status.slice(1)} - {n[status]}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={EXPAND}/></svg></h2>
      </div></div></div>
    </div>)}
  </div>;
}

// ---- a mission: the board's card, drawn on its own so it can go anywhere; what pops on it (its timer, its points, the name, the execution timer) is scaled by the clock ----
function Card({cut, id, t, ctx}) {
  const c = cut.cardAt(id, t, ctx);
  if (!c || c.op <= 0.001) return null;
  const m = cut.chipAt(id, t), dim = c.col === 'open' ? cut.dimAt(t) : 0;
  const lift = c.board && c.col && c.col !== 'open' ? cut.dimAt(t) : 0; // (the missions of Claimed and Closed stand out of the board while the camera is on them: the CEO, 2026-11-09, "make these missions visible")
  const alone = c.board ? c.landing ?? 0 : 1; // (how much it is on the dark, off the tablet: its deeper shadow there, going as it lands on the tablet)
  return <div className={`rc-card${c.up ? ' is-up' : ''}`} data-rc-card={id} data-rc-who={m.whoId ?? undefined} data-cut-part={`Mission ${m.title}`} data-cut-seen=".chip"
    style={{transform: `translate(${c.x}px, ${c.y}px) scale(${c.s})`, opacity: c.op, zIndex: c.moving ? 4 : 2, '--rc-alone': alone, '--rc-air': c.air ?? 1, filter: dim > 0.001 ? `brightness(${1 - 0.55 * dim})` : undefined}}>
    <div className="rc-card-pop" style={c.pop !== 1 ? {transform: `scale(${c.pop})`} : undefined}>
      <div className="mi-interactive mi-interactive--tablet mi-reference"><div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: CARD.w}}>
        <MissionChip kind={m.kind} points={m.points} title={m.title} who={m.who ?? undefined} date={m.date} time={m.time} showExec={m.showExec} execTime={m.execTime} pillTime={m.pillTime}
          style={{'--rc-pill': m.pill, '--rc-pop': m.pillPop, '--rc-pts-o': clamp(m.ptsO), '--rc-pts-s': m.ptsS, '--rc-who': m.whoOn, '--rc-who-s': m.whoS, '--rc-who-b': m.whoB, '--rc-who-w': m.whoW, '--rc-who-o': m.whoO, '--rc-exec-s': m.execS, '--rc-exec-b': m.execB, '--rc-exec-w': m.execW, '--rc-exec-o': m.execO,'--rc-lift': lift}}/>
      </div></div></div>
    </div>
  </div>;
}

// ---- the team (five): their faces in the column at the left, going up and across to a mission, pulling it to its new column, then sitting on its card where the name is ----
function Faces({cut, t, ctx}) {
  return CREW.map(who => {
    const f = cut.faceAt(who, t, ctx);
    if (!f) return null;
    return <div key={who} className="rc-face" data-cut-part={`Face ${PEOPLE[who].name}`} style={{transform: `translate(${f.x}px, ${f.y}px) scale(${f.pop})`, width: f.size, height: f.size, opacity: f.op, zIndex: f.moving ? 5 : 3}}>{/* (in the missions' own layer, see `STACK` below: a face that sits 3, the one that moves 5, over the mission that moves, 4) */}
      <Img src={PEOPLE[who].src} alt=""/>
    </div>;
  });
}

// ---- the texts of the UI that can be retyped (a mission's name, the name on a mission, the boards' titles): named here each frame; the one being retyped is not drawn ----
function UiTexts({stage, hide}) {
  useLayoutEffect(() => {
    const root = stage.current;
    if (!root) return;
    const tag = (el, key) => { if (!el) return; el.dataset.rcText = key; el.style.visibility = hide === key ? 'hidden' : ''; };
    root.querySelectorAll('[data-rc-card]').forEach(card => { tag(card.querySelector('.chip-title'), `mission:${card.dataset.rcCard}`); if (card.dataset.rcWho) tag(card.querySelector('.chip-who'), `person:${card.dataset.rcWho}`); });
    root.querySelectorAll('[data-rc-mission]').forEach(card => tag(card.querySelector('.chip-title'), `mission:${card.dataset.rcMission}`));
    root.querySelectorAll('.rc-tablet .mi-department').forEach(el => tag(el, 'board:team'));
    root.querySelectorAll('.rc-phone .ph-title').forEach(el => tag(el, 'board:personal'));
  });
  return null;
}

// the tablet and its missions on the wall of the picture: bent to its tablet, and a little warmer and dimmer, as the room's light is
function onboardStyle(cut, t) {
  const skew = cut.skewAt(t), w = cut.wallToneAt(t);
  return {transform: skew ?? undefined, filter: w > 0.001 ? `brightness(${(1 - 0.1 * w).toFixed(3)}) saturate(${(1 - 0.12 * w).toFixed(3)}) sepia(${(0.14 * w).toFixed(3)})` : undefined};
}

export default function EfficiencyRedo({words = null, hide = null, layout = null}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeRedoCut(words ?? undefined, {layout}), [words, layout]), ctx = cut.frameCtx(t);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage} over={<UiTexts stage={stage} hide={hide}/>}>
    {/* (the whole art is drawn ART_DY px lower than its own space: as much room over it as between it and the title, which does not move; lib/remotion/efficiencyRedo.mjs) */}
    <div className="rc-redo" style={{transform: `translateY(${ART_DY}px)`, '--rc-exec-strip': cut.look?.execStrip ?? undefined}}>{/* (--rc-exec-strip: the strip behind the execution timers, when a variation changes it) */}
      <Photo cut={cut} t={t}/>
      <Phones cut={cut} t={t}/>
      <div className="rc-onboard" style={onboardStyle(cut, t)}>{/* (the tablet and its missions, bent as one to the angle of the tablet on the picture's wall) */}
        <Tablet cut={cut} t={t} ctx={ctx}/>
        {/* STACK: the missions and the faces are ONE layer (the user, 2026-11-10, with a picture of a mission going to Closed under the avatar sitting on the mission there: "the mission moving
            should be on top with it's avatar"; written, NOT played). From the bottom: a mission at rest 2, a face sitting (on its mission, in the column) 3, the mission that moves 4, its face 5.
            The faces were a layer of their own over every mission (14), so a sitting face was drawn over a mission passing by. They are never there while the tablet is bent onto the wall. */}
        <div className="rc-cards">
          {ALL_CARDS.map(id => <Card key={id} cut={cut} id={id} t={t} ctx={ctx}/>)}
          <Faces cut={cut} t={t} ctx={ctx}/>
        </div>
      </div>
      <Photo cut={cut} t={t} front/>
      <LaneTabs cut={cut} t={t}/>
    </div>
  </CutFrame>;
}
