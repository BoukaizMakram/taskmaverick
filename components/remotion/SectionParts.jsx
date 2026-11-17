'use client';
// The pieces of the cuts made of a board's sections, cards and panels (lib/remotion/sectionCore.mjs says the style they share; Requesting Maintenance's first, then Requesting Support,
// Tracking Expirations, Replenishing Inventory, Exception Management): a layer, a section's tab, a card on its own, an arrow, the board's plus and the On-Demand list that opens out of it,
// the avatar that takes a card. Everything is placed by the clock (a plan's `stateAt`, in stage px); nothing here animates by itself. Classes: .rc-sp-* (SectionParts.css).
// On the board All storyboards every piece is a layer of its own (`data-cut-part`; scripts/capture-cuts.mjs).
import {useLayoutEffect, useRef} from 'react';
import {Img} from 'remotion';
import {IconPlus} from '../PhoneShell';
import {DemandPanel, FlowPart} from '../sections/parts';
import {CUT_W, POP, clamp, mix} from '@/lib/remotion/cutCore.mjs';
import './MotionBoard.css';  // .rc-mt-flow: a card on its own, its shadow on the dark, its timer's pill popped by the clock (--rc-pop)
import './SectionParts.css';

const CARD_W = 334, CARD_H = {mission: 129, ticket: 232}; // (a card's size in the board's own units)
const EXPAND = 'M7 3H3v4M13 3h4v4M17 3l-5 5M3 13v4h4M3 17l5-5M17 13v4h-4'; // (the board's column tab icon)
const PURPLE = '#7b3cf0'; // (the arrows of the flows: components/sections/parts.jsx)

// ---- a layer of the art: it says its name (`id`: what the cursor presses and what is outlined is found in it, sectionCore `tg`), its opacity by the clock. `part`: its name on the board All
// storyboards when the whole layer is one piece (a panel: `box` is the element in it that is seen, the piece is picked at that box); `group`: it only holds pieces ----
export function Layer({id, op = 1, part, box, group, className = '', children}) {
  return <div className={`rc-sp-layer${className ? ` ${className}` : ''}`} data-rc-layer={id} data-cut-part={part} data-cut-box={box} data-cut-group={group} style={{opacity: op < 1 ? op : undefined}}>{children}</div>;
}

// ---- a section of a board with no tablet: the board's own column tab (the same markup, 334 board units wide as a card is), placed and scaled by the clock ----
export function Tab({x, y, k, label, name}) {
  return <div className="rc-sp-tab" data-cut-part={name} data-cut-seen=".tbl-tab" style={{transform: `translate(${x}px, ${y}px) scale(${k})`}}>
    <div className="mi-interactive mi-interactive--tablet mi-reference"><div className="mi-tablet-board iq2-iso-board"><div style={{width: CARD_W}}>
      <h2 className="tbl-tab">{label}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={EXPAND}/></svg></h2>
    </div></div></div>
  </div>;
}

// ---- a card on its own, a mission's or an alert ticket's (components/sections/parts.jsx FlowPart draws it and names it and its parts for the cursor and the outlines: <id>, <id>-exec,
// <id>-who, <id>-pill): `c` {id, x, y, k, mission, pop, op, moving}, placed and scaled by the clock; one that is posted pops in (`pop` 0 to 1: from 0.86 and a little lower, the pop curve);
// its timer's pill pops by the clock (`pill`: its scale) ----
export function Card({c, name, pill = 1}) {
  const ticket = c.mission.kind === 'Ticket', w = CARD_W * c.k, h = (ticket ? CARD_H.ticket : CARD_H.mission) * c.k, p = c.pop ?? 1, q = POP(clamp(p));
  return <div className="rc-mt-flow rc-sp-card" data-cut-part={name} data-cut-box=".chip"
    style={{opacity: (c.op ?? 1) * (p < 1 ? clamp(p / 0.6) : 1), transformOrigin: `${c.x + w / 2}px ${c.y + h / 2}px`, transform: p < 1 ? `translateY(${((1 - q) * 26).toFixed(2)}px) scale(${mix(0.86, 1, q).toFixed(4)})` : undefined,
      zIndex: c.moving ? 10 : undefined, '--rc-pop': pill}}>{/* (`moving`: over the other cards. Each card's own layer is z 9 in the art, components/sections/parts.jsx `.iq2-iso-layer`, so the one that moves needs more than 9: with 4 it went UNDER the cards it crossed) */}
    <FlowPart chips={[{id: c.id, x: c.x, y: c.y, scale: c.k, mission: c.mission}]} lines={[]} center={false}/>
  </div>;
}

// ---- a name over a section or a card (the team a request is posted to, the board a section belongs to): its left at `x`, its middle at `y`, white on the dark (the flows' label is purple
// and was made for a light plate); `tone` 'ticket': a ticket board's name, in the ticket's color as its header has it ----
export function Name({x, y, op = 1, text, part = 'Team name', tone = null}) {
  return <span className={`rc-sp-name${tone ? ` is-${tone}` : ''}`} data-cut-part={part} style={{left: x, top: y, opacity: op}}>{text}</span>;
}

// ---- an arrow from what raised a card to the card (the flows' purple arrow): `a` {from: [x, y], to: [x, y], op}, level ----
export function Arrow({a}) {
  const [x1, y] = a.from, w = Math.max(24, a.to[0] - x1), H = 28, m = H / 2;
  return <svg className="rc-sp-arrow" data-cut-part="Arrow" viewBox={`0 0 ${w} ${H}`} style={{left: x1, top: y - m, width: w, height: H, opacity: a.op}} fill="none" stroke={PURPLE} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={`M2 ${m}H${w - 5}`} strokeWidth="3"/><path d={`M${w - 21} ${m - 10}L${w - 3} ${m}L${w - 21} ${m + 10}`} strokeWidth="4.5"/>
  </svg>;
}

// ---- the plus of the board (On-Demand), by itself beside a section's tab: `p` {x, y, size}; the cursor presses it (`target`) ----
export function Plus({p, target = 'add'}) {
  return <span className="rc-sp-plus" data-iq-target={target} data-cut-part="Plus" style={{left: p.x, top: p.y, width: p.size, height: p.size}}><IconPlus/></span>;
}
// ---- the On-Demand list, out of the plus: the board's own list in a box of its own; `m` {p (how far it is open, 0 to 1), x, y, w, h, k, picked}: it grows from its corner by the plus.
// `items`: [kind, title, id?] (what the cursor presses is demand-<id>, else demand-<the title's slug>) ----
export function DemandMenu({m, department, items}) {
  if (!(m.p > 0.001)) return null;
  return <div className="rc-sp-menu" data-cut-part="On-Demand list" style={{left: m.x, top: m.y, width: m.w, height: m.h, opacity: clamp(m.p / 0.7), transform: `scale(${(m.k * mix(0.55, 1, m.p)).toFixed(4)})`}}>
    <DemandPanel department={department} picked={m.picked} items={items}/>
  </div>;
}

// ---- the avatar that takes a card (the user, 2026-11-16: "make sure to don't change the avatar to the shape it had before and make it go to the center of ticket vertically before going to
// name place and make it go to the same place as before ... the same way when moving to close", then "it shouldn't be a circle"). ONE avatar, the same to the end, its picture's own octagon:
// it pops at its `seat` {x, y, s}, goes straight to the card's right edge at the middle of its height, goes with the card to the next section, then to the name's place on it and sits there
// (the card's own avatar only keeps that place and is never seen: put `is-bare` on the cards' layer); to close, it comes out to the edge again, goes with the card and back to the name's
// place. `face`: sectionCore `rideAt`; `on`: the card's `.chip` (a selector in the stage). Placed each frame on the card, measured, so it follows it. `.rc-sp-face` is what a plan outlines ----
const SITS = 38 / 334; // (how big it sits on the card, of the card's width: Increased Efficiency's 38 board units)
export function Rider({face, seat, src, on}) {
  const me = useRef(null);
  useLayoutEffect(() => {
    const el = me.current, stage = el?.closest('.rc-stage');
    if (!el || !stage) return;
    const card = face.on ? stage.querySelector(on) : null;
    if (!card) { el.style.opacity = '0'; return; }
    const S = stage.getBoundingClientRect(), k = S.width / CUT_W || 1, box = n => { const b = n.getBoundingClientRect(); return {x: (b.left - S.left) / k, y: (b.top - S.top) / k, w: b.width / k, h: b.height / k}; };
    const c = box(card), own = card.querySelector('.chip-performer-avatar'), o = own ? box(own) : null, big = 0.2 * c.w, small = SITS * c.w;
    const edge = {x: c.x + c.w - 0.14 * c.w, y: c.y + (c.h - big) / 2, s: big}; // (at the card's right edge, the middle of its height)
    const name = o ? {x: o.x + (o.w - small) / 2, y: o.y + (o.h - small) / 2, s: small} : {x: c.x + 0.045 * c.w, y: c.y + c.h - 0.15 * c.w, s: small}; // (where the performer is on the card)
    const at = (a, z, p) => ({x: mix(a.x, z.x, p), y: mix(a.y, z.y, p), s: mix(a.s, z.s, p)});
    const r = [[edge, face.go], [name, face.spot], [edge, face.out ?? 0], [name, face.rest ?? 0]].reduce((from, [to, p]) => at(from, to, p), seat), pop = mix(0.4, 1, POP(face.pop));
    el.style.opacity = clamp(face.pop / 0.6).toFixed(3);
    el.style.width = el.style.height = `${r.s.toFixed(2)}px`;
    el.style.transform = `translate(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px) scale(${pop.toFixed(4)})`;
  });
  return <div ref={me} className="rc-sp-face" aria-hidden="true" data-cut-part="Face"><Img src={src} alt=""/></div>;
}
