'use client';
// Increased Efficiency, the Remotion cut: a Remotion composition (1600 x 900 drawn, scaled to the video's size) made of the product's own pieces, each placed by lib/remotion/efficiencyCut.mjs as a function of
// the time (why it is told this way: the top of that file). Played on the All videos page by Remotion's Player (components/StoryboardRemotionCut.jsx) when the board's variation is the look `remotion`, and
// rendered to an MP4 by the Remotion project D:\Documents\Saas\videos (composition IE-Cut, src/ie/IECut.jsx).
// Props (Remotion's input props): `words`, the words retyped ({key: text}, lib/remotion/cutWords.mjs: the cut is made from them, `makeCut`), `hide`, the key of the text being retyped on the page (it is not
// drawn: the text editor is over it). The texts that can be retyped say so: `data-rc-text` (a sentence's id, '<id>:kicker', 'title').
// The pieces: the tablet's board (InteractiveMissionBoard: its frame, header and column titles with their counts; its own cards are hidden, the missions are drawn over it as lifted cards, so each one can
// glide anywhere: from a column to another, out of the board, back), MissionChip, PhoneShell, the personal code panel (.adx-quick-code + PersonalCodeKeypad), the schedule pill (.ev2-schedule), the yellow
// outline (.iq2-mark), the team's faces and the picture of the three people. Classes of its own: .rc-* (components/remotion/EfficiencyCut.css).
import {memo, useLayoutEffect, useMemo, useRef} from 'react';
import {Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {CutFrame} from './CutParts'; // (the stage, the title, the band, the outlines: every cut's)
import InteractiveMissionBoard from '../InteractiveMissionBoard';
import MissionChip from '../MissionChip';
import PhoneShell from '../PhoneShell';
import {PersonalCodeKeypad} from '../PersonalCodeDialog';
import {
  ALL_CARDS, BOARD, CARD, M, OUT, PAIR, PEOPLE, PHOTO, PHOTO_IMG, PHOTO_SRC, POP, POST, FACES, SHIFT, START_PHONES, TEAM,
  clamp, clock, makeCut, mix, prog, view,
} from '@/lib/remotion/efficiencyCut.mjs';
import '../ImprovedQualityV2Demo.css'; // .iq2-iso-* (a card out of its board)
import '../EfficiencyV2Demo.css';      // .ev2-schedule
import './EfficiencyCut.css';

const CalendarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>;
// ---- the three personal boards of the start (they come and go with the art) ----
function StartPhones({cut, t}) {
  const {B} = cut;
  if (t < B.phonesIn || t >= B.phonesGone) return null;
  return cut.startPhonesAt(t).map(p => <div key={p.who} className="rc-phone" data-cut-part={`Phone ${PEOPLE[p.who].name}`} data-cut-box=".ph-phone" style={{left: p.x, top: p.y, width: START_PHONES.w, opacity: p.op, transform: `scale(${p.scale})`}}>
    <Img className="rc-phone-face" data-cut-part={`Phone ${PEOPLE[p.who].name} avatar`} src={PEOPLE[p.who].src} alt="" style={{left: (START_PHONES.w - START_PHONES.face) / 2, width: START_PHONES.face, height: START_PHONES.face}}/>
    <div className="ph-fit" style={{marginTop: START_PHONES.face + 12}}>
      <PhoneShell title={cut.names.board.personal} tabs={[{label: `Open - ${p.n}`, active: true}, {label: 'Claimed - 0'}, {label: 'Closed - 0'}]}>
        {p.cards.map((c, j) => <div key={c.id} className="es-phone-mission rc-phone-card" data-rc-mission={c.id} style={{opacity: c.op, transform: `translateY(${c.y}px) scale(${c.pop})`}}>
          <MissionChip title={c.title} points={[10, 15, 20, 15][j]} date="07-14-26" time="08:00 AM" pillTime={clock(310 - j * 60 + Math.max(0, t - c.at))}/>
        </div>)}
      </PhoneShell>
    </div>
  </div>);
}

// ---- "no device for each": three phones that go into the one tablet ----
function DevicePhones({cut, t}) {
  return cut.devicePhonesAt(t).map(p => (p.op > 0.001 ? <div key={p.who} className="rc-phone rc-phone--small" data-cut-part={`Small phone ${PEOPLE[p.who].name}`} data-cut-box=".ph-phone" style={{left: p.x, top: p.y, width: p.w, opacity: p.op}}>
    <div className="ph-fit"><PhoneShell title={cut.names.board.personal} tabs={[{label: 'Open - 2', active: true}, {label: 'Claimed - 0'}, {label: 'Closed - 0'}]}>
      {p.list.map((m, j) => <div key={m.id} className="es-phone-mission" data-rc-mission={m.id}><MissionChip title={m.title} points={[10, 15][j]} date="07-14-26" time="08:00 AM" pillTime={clock(250 - j * 60)}/></div>)}
    </PhoneShell></div>
  </div> : null));
}

// ---- the picture of the three people, pushed in to the tablet on its wall ----
function Photo({cut, t}) {
  const p = cut.photoAt(t);
  if (p.op <= 0.001) return null;
  return <div className="rc-photo" data-cut-part="Picture" style={{left: PHOTO.x, top: PHOTO.y, width: PHOTO.w, height: PHOTO.h, borderRadius: PHOTO.r, opacity: p.op}}>
    <Img src={PHOTO_SRC} alt="" style={{left: PHOTO_IMG.x, top: PHOTO_IMG.y, width: PHOTO_IMG.w, height: PHOTO_IMG.h, transformOrigin: `${p.origin.x}px ${p.origin.y}px`, transform: `translate(${p.dx}px, ${p.dy}px) scale(${p.z})`}}/>
  </div>;
}

// ---- the tablet: the board's own frame, header and columns (their counts follow the story), with no cards of its own; `dim`: the Open and Claimed columns darkened ----
const placeholders = counts => ['open', 'claimed', 'closed'].flatMap(status => Array.from({length: counts[status]}, (_, i) => ({id: `rc-${status}-${i}`, title: '', type: 'Task', status, points: null, date: '', time: '', ageSeconds: 0})));
const Board = memo(function Board({open, claimed, closed, dim, title}) {
  const missions = useMemo(() => placeholders({open, claimed, closed}), [open, claimed, closed]);
  const demo = useMemo(() => ({missions, elapsed: 0, selected: null, menuOpen: false, boardTitle: title, businessMediaLabel: 'Business Media'}), [missions, title]);
  const shade = dim > 0 ? [0, 1].map(c => <i key={c} className="rc-colshade" aria-hidden="true" style={{left: `calc(${BOARD.col(c) - 9} * var(--ref-u))`, width: `calc(${BOARD.pitch} * var(--ref-u))`, opacity: dim * 0.55}}/>) : null;
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

// ---- a mission: the board's card, drawn on its own so it can go anywhere ----
function Card({cut, id, t, ctx}) {
  const c = cut.cardAt(id, t, ctx);
  if (!c || c.op <= 0.001) return null;
  const m = cut.chipAt(id, t), dim = m.closed ? 0 : cut.dimAt(t);
  return <div className={`rc-card${c.up ? ' is-up' : ''}`} data-rc-card={id} data-rc-who={m.whoId ?? undefined} data-cut-part={`Mission ${m.title}`} data-cut-seen=".chip" style={{transform: `translate(${c.x}px, ${c.y}px) scale(${c.s})`, opacity: c.op, zIndex: c.up ? 4 : 2, filter: dim > 0.001 ? `brightness(${1 - 0.55 * dim})` : undefined}}>
    <div className="rc-card-pop" style={c.pop !== 1 ? {transform: `scale(${c.pop})`} : undefined}>
      <div className="mi-interactive mi-interactive--tablet mi-reference"><div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: CARD.w}}>
        <MissionChip kind={m.kind} points={m.points} title={m.title} who={m.who ?? undefined} avatar={m.avatar ?? undefined} date="07-14-26" time="08:00 AM" showExec={m.showExec} execTime={m.execTime} pillTime={m.pillTime}
          style={{'--rc-pill': m.pill, '--rc-pop': m.pillPop, '--rc-pts-o': clamp(m.ptsOn), '--rc-pts-s': mix(0.4, 1, m.ptsOn), '--rc-who': m.whoOn}}/>
      </div></div></div>
    </div>
  </div>;
}

// ---- the schedules beside the two missions lifted out ----
function Schedules({cut, t, ctx}) {
  const {B} = cut;
  if (t < B.sched - 0.1 || t > B.schedOut + M) return null;
  let n = 0;
  const out = 1 - prog(t, B.schedOut, M * 0.6, OUT);
  return ['inv', 'ord'].map(id => {
    const c = cut.cardAt(id, t, ctx);
    if (!c) return null;
    const pills = cut.names.schedules[id].map((text, j) => ({text, j, i: n++}));
    return <div key={id} className="rc-sched" data-rc-sched={id} data-cut-part={`Schedules ${cut.names.mission[id]}`} style={{transform: `translate(${c.x + CARD.w * c.s + PAIR.beside}px, ${c.y + (CARD.h * c.s) / 2}px) translateY(-50%) scale(${c.s})`}}>
      {pills.map(p => { const q = cut.schedPop(p.i, t); return <span key={p.j} className="ev2-schedule" style={{opacity: clamp(q) * out, transform: `scale(${mix(0.85, 1, q)})`}}><CalendarIcon/><span data-rc-text={`schedule:${id}:${p.j}`}>{p.text}</span></span>; })}
    </div>;
  });
}

// ---- the personal code, by the mission, typed digit by digit ----
function CodePanel({cut, t, ctx}) {
  const c = cut.codeAt(t, ctx);
  if (!c || c.op <= 0.001) return null;
  return <div className="rc-code" data-cut-part="Code panel" style={{transform: `translate(${c.x}px, ${c.y}px) scale(${c.s * c.pop})`, opacity: c.op}}>
    <div className="adx-quick-code">
      <header className="adx-code-header">{c.action} Personal Code<span>×</span></header>
      <div>{Array.from({length: 6}, (_, i) => <b key={i}><span style={{opacity: i < c.typed ? 1 : 0}}>●</span></b>)}</div>
      <PersonalCodeKeypad activeKey={c.key ?? undefined} tabIndex={-1}/>
    </div>
  </div>;
}

// ---- the team: their faces at the left of the tablet, at a mission, on its card; how many each one closed, the best one lit ----
function Faces({cut, t, ctx}) {
  const {B} = cut, counts = t >= B.badges ? cut.closedBy(t) : null, best = counts ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : null;
  return TEAM.map((who, i) => {
    const f = cut.faceAt(who, t, ctx);
    if (!f) return null;
    const badge = counts ? prog(t, B.badges + i * FACES, POST.fade, POP) : 0, ring = who === best ? prog(t, B.badges + 0.35, 0.5, OUT) : 0;
    return <div key={who} className="rc-face" data-cut-part={`Face ${PEOPLE[who].name}`} style={{transform: `translate(${f.x}px, ${f.y}px) scale(${f.pop})`, width: f.size, height: f.size, opacity: f.op}}>
      <Img src={PEOPLE[who].src} alt=""/>
      {ring > 0 && <i className="rc-face-ring" style={{opacity: ring, transform: `scale(${mix(1.25, 1, ring)})`}}/>}
      {badge > 0 && <b className="rc-face-badge" style={{opacity: clamp(badge), transform: `scale(${badge})`, fontSize: f.size * 0.2}}>{counts[who]}</b>}
    </div>;
  });
}

// ---- the end: each person's shift, its idle gaps closing, another mission in the time won back (no logo after it: the user, 2026-11-05) ----
function Shift({cut, t}) {
  const s = cut.shiftAt(t);
  if (!s) return null;
  const pop = p => ({opacity: clamp(p), transform: `scale(${mix(0.8, 1, p)})`});
  // (on the board "All storyboards" each avatar, row and timer is a piece of its own, picked with one click: the user, 2026-11-06; the shifts as a whole only hold them, `data-cut-group`: they
  // cover the whole picture)
  return <div className="rc-shift" data-cut-group="Shifts" style={{opacity: s.op}}>
    {s.rows.map(row => { const name = `Shift ${PEOPLE[row.who].name}`; return <div key={row.who} className="rc-shift-row" style={{top: row.y, height: SHIFT.h}}>
      <Img className="rc-shift-face" data-cut-part={`${name} avatar`} src={PEOPLE[row.who].src} alt="" style={{left: SHIFT.faceX, top: (SHIFT.h - SHIFT.face) / 2, width: SHIFT.face, height: SHIFT.face}}/>
      <div className="rc-lane" data-cut-part={`${name} row`} style={{left: SHIFT.x, width: SHIFT.w, height: SHIFT.h}}>
        {row.gaps.map((g, j) => <i key={j} className="rc-gap" style={{left: g.x, width: g.w}}/>)}
        {row.blocks.map((b, j) => <span key={j} className="rc-block" data-cut-part={`${name} timer ${j + 1}`} style={{left: b.x, width: b.w, ...pop(b.pop)}}>{b.label}</span>)}
        {row.extra.pop > 0 && <span className="rc-block rc-block--new" data-cut-part={`${name} timer ${row.blocks.length + 1}`} style={{left: row.extra.x, width: row.extra.w, ...pop(row.extra.pop)}}>{row.extra.label}</span>}
      </div>
    </div>; })}
    <div className="rc-saved" data-rc-saved="" style={{left: s.saved.x, top: s.saved.y, width: s.saved.w, height: s.saved.h}}/>
  </div>;
}

// ---- the texts of the UI that can be retyped: the product's pieces draw them, so they are named here, each frame (a mission's name on a card or a phone, the name on a closed mission, the boards' titles;
// the schedules name theirs themselves), and the one being retyped is not drawn ----
function UiTexts({stage, hide}) {
  useLayoutEffect(() => {
    const root = stage.current;
    if (!root) return;
    const tag = (el, key) => { if (!el) return; el.dataset.rcText = key; el.style.visibility = hide === key ? 'hidden' : ''; };
    root.querySelectorAll('[data-rc-card]').forEach(card => { tag(card.querySelector('.chip-title'), `mission:${card.dataset.rcCard}`); if (card.dataset.rcWho) tag(card.querySelector('.chip-who'), `person:${card.dataset.rcWho}`); });
    root.querySelectorAll('[data-rc-mission]').forEach(card => tag(card.querySelector('.chip-title'), `mission:${card.dataset.rcMission}`));
    root.querySelectorAll('.rc-tablet .mi-department').forEach(el => tag(el, 'board:team'));
    root.querySelectorAll('.rc-phone .ph-title').forEach(el => tag(el, 'board:personal'));
    root.querySelectorAll('[data-rc-text^="schedule:"]').forEach(el => { el.style.visibility = hide === el.dataset.rcText ? 'hidden' : ''; });
  });
  return null;
}

export default function EfficiencyCut({words = null, hide = null}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps, stage = useRef(null);
  const cut = useMemo(() => makeCut(words ?? undefined), [words]), ctx = cut.frameCtx(t);
  return <CutFrame cut={cut} t={t} hide={hide} stage={stage} over={<UiTexts stage={stage} hide={hide}/>}>
    <StartPhones cut={cut} t={t}/>
    <Photo cut={cut} t={t}/>
    <Tablet cut={cut} t={t} ctx={ctx}/>
    <div className="rc-cards">{ALL_CARDS.map(id => <Card key={id} cut={cut} id={id} t={t} ctx={ctx}/>)}</div>
    <Schedules cut={cut} t={t} ctx={ctx}/>
    <CodePanel cut={cut} t={t} ctx={ctx}/>
    <DevicePhones cut={cut} t={t}/>
    <Faces cut={cut} t={t} ctx={ctx}/>
    <Shift cut={cut} t={t}/>
  </CutFrame>;
}
