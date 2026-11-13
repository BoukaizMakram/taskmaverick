'use client';
// The motion Increased Efficiency's missions have, for the cuts that draw the product's own board and cards (the user, 2026-11-12, of Dynamic Auditing's, Precision Planning's and Requesting
// Maintenance's cuts: "the motion of popping timers, missions popping in and moving is not there it's like motion is only in title ... fix these three to have the motion we have in increased
// effeciency"; written, NOT played): a mission POPS in (0.34 s: from 0.86 and faded, the pop curve), a mission that changes place GLIDES to it over one move (0.76 s, Easy Ease 70%) and is over the
// others while it goes, with its lifted shadow, the timers run (the board's `elapsed`), and a timer's pill pops once as its color changes. Everything is set by the clock: nothing animates by itself.
//   MotionTablet: the product's board in the flat black frame, drawn at the state it goes TO; when it is going (`p` < 1) the board it comes FROM is drawn too, unseen, and each card is moved from
//     where it was there to where it is here (a card that is only in `to` pops, `pops` {id: 0 to 1}: how far it has popped; a card that was in `from` and `to` glides). Nothing is linked to a
//     plan: any cut says which lists and how far.
//   PopFlow: the cards that follow a mission (components/sections/parts.jsx FlowPart): the ones that stay are drawn, each card that is new pops over them at its own place and its arrow comes after it.
import {useLayoutEffect, useMemo, useRef} from 'react';
import InteractiveMissionBoard from '../InteractiveMissionBoard';
import {FLOW, FlowPart, TICKET_H} from '../sections/parts';
import {EASE, POP, clamp, mix} from '@/lib/remotion/cutCore.mjs';
import './MotionBoard.css';

// A board's demo state (the same object while its inputs are the same: the board does not draw again for nothing)
const demoOf = (missions, elapsed, title, ticketBoard, menuOpen) => ({missions, elapsed, selected: null, menuOpen, boardTitle: title, ticketBoard, businessMediaLabel: 'Business Media'});

// ---- the timers RUN (the user, 2026-11-12: "timers should always be running"): the section's missions have a fixed time (`ageSeconds`, `executionSeconds`), and the board shows a fixed time then. This makes
// them counts: an open or claimed mission's timer goes on from its age with the board's `elapsed` (a second a second); one that is posted in the film (`born`: the second it appears, the board's
// `elapsed` then) starts at 00:00:00 there; the execution timer of one that is claimed in the film (`claimedAt`) starts at 00:00:00 there; one that is closed in the film (`stoppedAt`) stops there;
// a mission that was closed before the film is left as it is ----
export const running = (list, {born = {}, claimedAt = {}, stoppedAt = {}} = {}) => list.map(m => {
  const stops = stoppedAt[m.id], isBorn = born[m.id] != null, shift = born[m.id] ?? 0;
  if (m.status === 'closed' && stops == null) return m;
  const out = {...m, ageSeconds: undefined, age: isBorn ? 0 : m.ageSeconds ?? m.age ?? 0, demoTimeOffset: -shift};
  if (m.status !== 'open') { out.executionSeconds = undefined; out.started = claimedAt[m.id] != null ? claimedAt[m.id] - shift : -(m.executionSeconds ?? 0) - shift + (isBorn ? shift : 0); }
  if (stops != null) out.stopped = stops;
  return out;
});
// The same for the cards of a flow (plain strings, 'hh:mm:ss'): a card that is not gray goes on `seconds` further, its execution time too
const parse = s => (/^\d\d:\d\d:\d\d$/.test(s ?? '') ? s.split(':').reduce((n, x) => n * 60 + Number(x), 0) : null);
const clockOf = s => [Math.floor(s / 3600), Math.floor(s / 60) % 60, Math.floor(s) % 60].map(n => String(n).padStart(2, '0')).join(':');
export const tickChip = (c, seconds) => {
  const m = c.mission;
  if (!m || m.tone === 'gray' || !(seconds > 0)) return c;
  const pill = parse(m.pill), exec = parse(m.exec);
  return {...c, mission: {...m, pill: pill == null ? m.pill : clockOf(pill + seconds), exec: exec == null ? m.exec : clockOf(exec + seconds)}};
};

export function MotionTablet({tab, title, to, from = null, p = 1, pops = null, elapsed = 0, ticketBoard = false, menuOpen = false, overlay = null, className = '', vars = null}) {
  const root = useRef(null), live = !!from && from !== to && p < 1;
  const toDemo = useMemo(() => demoOf(to, elapsed, title, ticketBoard, menuOpen), [to, elapsed, title, ticketBoard, menuOpen]);
  const fromDemo = useMemo(() => (from ? demoOf(from, elapsed, title, ticketBoard, false) : null), [from, elapsed, title, ticketBoard]);
  // each frame: the cards of the board it goes to are put where they are on their way (measured against the board it comes from)
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const here = el.querySelector('[data-mt="to"]'), was = el.querySelector('[data-mt="from"]');
    if (!here) return;
    const cards = [...here.querySelectorAll('.mi-card-button')];
    for (const c of cards) { c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = ''; c.style.position = ''; c.classList.remove('is-moving'); }
    const e = EASE(clamp(p));
    for (const c of cards) {
      const id = c.dataset.missionId, popped = pops?.[id];
      if (popped != null && popped < 1) { // a mission posted: it pops in
        c.style.transformOrigin = '50% 50%';
        c.style.transform = `scale(${mix(0.86, 1, POP(clamp(popped))).toFixed(4)})`;
        c.style.opacity = clamp(popped / 0.6).toFixed(3);
        continue;
      }
      if (!live || !was) continue;
      const before = was.querySelector(`.mi-card-button[data-mission-id="${CSS.escape(id)}"]`);
      if (!before) continue;
      const a = before.getBoundingClientRect(), b = c.getBoundingClientRect(), k = b.width / (c.offsetWidth || 1) || 1; // (k: how big the board is drawn: a move in its own pixels)
      const dx = (a.left - b.left) / k * (1 - e), dy = (a.top - b.top) / k * (1 - e);
      if (Math.abs(dx) + Math.abs(dy) < 0.5) continue;
      c.style.position = 'relative'; c.style.zIndex = '4'; c.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`; c.classList.add('is-moving'); // (the one that goes is over the others)
    }
  });
  return <div ref={root} className={`rc-device rc-iq-tablet rc-mt ${className}`} style={{transform: `translate(${tab.x}px, ${tab.y}px) scale(${tab.w / 1000})`, ...(vars ?? {})}}>
    <div data-mt="to"><InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={to} demoState={toDemo} demoOverlay={overlay}/></div>
    {live && <div data-mt="from" className="rc-mt-from" aria-hidden="true"><InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={from} demoState={fromDemo}/></div>}
  </div>;
}

// ---- the cards that follow a mission: those of `first` stay, each card of `last` that is not in `first` pops over them at its own place (its middle the pop's), its arrow comes after it ----
const sizeOf = c => ({w: FLOW.w, h: c.mission?.kind === 'Ticket' ? TICKET_H * FLOW.scale : FLOW.h});
// `since`: the seconds since the new cards popped, their timers run from 00:00:00 then (`stay`: the seconds the cards that stay have run since `first` was made, their timers too)
export function PopFlow({first, last, p = 0, pill = 1, since = 0, stay = 0}) {
  const added = last.chips.filter(c => !first.chips.some(f => f.id === c.id)), lines = last.lines.filter(l => !first.lines.some(f => f.id === l.id));
  return <div className="rc-mt-flow" style={{'--rc-pop': pill}}>
    <FlowPart chips={stay > 0 ? first.chips.map(c => tickChip(c, stay)) : first.chips} lines={first.lines} center={false}/>
    {added.map(c => { const s = sizeOf(c), q = POP(clamp(p));
      return <div key={c.id} className="rc-mt-pop" style={{opacity: clamp(p / 0.6), transformOrigin: `${c.x + s.w / 2}px ${c.y + s.h / 2}px`, transform: `translateY(${((1 - q) * 26).toFixed(2)}px) scale(${mix(0.86, 1, q).toFixed(4)})`}}><FlowPart chips={[tickChip(c, since)]} lines={[]} center={false}/></div>;
    })}
    {lines.length > 0 && p > 0.3 && <div className="rc-mt-pop" style={{opacity: clamp((p - 0.4) / 0.6)}}><FlowPart chips={[]} lines={lines} center={false}/></div>}
  </div>;
}
