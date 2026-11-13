'use client';
// The pieces the sections' stages are made of (the user, 2026-10-14: "work on all the other sections ... same as the Improved Quality videos"). They are the product's own pieces in the
// Improved Quality film's frames (the tablet board, the mission by itself, the isolated cards with their purple connectors), drawn at a state given as data. A piece is one `data-sec-part`:
// scripts/capture-sections.mjs takes it apart as one layer of the board's frames, named as lib/storyboardPlayer.mjs knows it (Tablet, Mission, Isolated missions, Report, Layer).
import {useLayoutEffect, useRef} from 'react';
import InteractiveMissionBoard from '../InteractiveMissionBoard';
import MissionChip from '../MissionChip';
import TicketCard from '../TicketCard';
import {IconBack} from '../PhoneShell';
import {DemoVideo, PhotoIcon, VideoIcon} from '../ImprovedQualityV2Panels';
import {rowsRect} from '@/lib/sections/rows.mjs';

// ---- A dashboard centered on what is looked at (the user, 2026-10-15: "if it's a dashboard then scroll right or left to center always what we highlight ... but never show empty space"; "never move the
// tablet": only what is INSIDE the window moves) ----
// `ref` is the window (`.iq2-report`), its page `.iq2-report-page` slides sideways (the pan) and `scroller` (an element of the page that scrolls) goes up and down. `focus` names what is looked at:
// data-iq-target names, or 'col:<name>' for a table column (its header down to the bottom of the table); the page is panned, and the scroller scrolled, so that the middle of all of it is the
// middle of the window, as far as the page goes (the pan is kept between 0 and the page's width less the window's, the scroll between 0 and its end: never an empty edge); a thing wider or taller
// than the window starts at its edge. Without `focus` the page is where `pan` says, and the scroller at the top of `scrollTo` (an element name) or at 0. Also 'head:<name>' (a column's title)
// and 'rows:<state>:<column>' (the rows of the missions in a state, up to that column: `rowsRect`).
export function useCenter(ref, {focus = null, pan = 0, scroller = null, scrollTo = null, margin = 12} = {}) {
  useLayoutEffect(() => {
    const win = ref.current;
    if (!win) return;
    const page = win.querySelector('.iq2-report-page'), box = scroller ? win.querySelector(scroller) : null;
    if (!page) return;
    page.style.transform = 'translateX(0px)'; if (box) box.scrollTop = 0;
    const W = win.getBoundingClientRect(), k = W.width / (win.offsetWidth || 1) || 1;
    const rectOf = name => {
      if (name.startsWith('col:')) { const th = win.querySelector(`th[data-iq-col="${name.slice(4)}"]`), area = th?.closest('.ow-table-scroll'); if (!th || !area) return null; const a = th.getBoundingClientRect(), b = area.getBoundingClientRect(); return {left: a.left, top: a.top, right: a.right, bottom: b.bottom}; }
      if (name.startsWith('head:')) { const th = win.querySelector(`th[data-iq-col="${name.slice(5)}"]`); if (!th) return null; const r = th.getBoundingClientRect(); return {left: r.left, top: r.top, right: r.right, bottom: r.bottom}; }
      if (name.startsWith('rows:')) return rowsRect(win, ...name.slice(5).split(':'));
      const el = win.querySelector(`[data-iq-target="${name}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return {left: r.left, top: r.top, right: r.right, bottom: r.bottom};
    };
    const rects = [].concat(focus ?? []).map(rectOf).filter(Boolean);
    let x = pan, y = null;
    if (rects.length) {
      const U = {left: Math.min(...rects.map(r => r.left)), top: Math.min(...rects.map(r => r.top)), right: Math.max(...rects.map(r => r.right)), bottom: Math.max(...rects.map(r => r.bottom))};
      const maxX = Math.max(0, (page.offsetWidth || 0) - win.offsetWidth), w = (U.right - U.left) / k, left = (U.left - W.left) / k;
      x = Math.min(maxX, Math.max(0, w > win.offsetWidth - 2 * margin ? left - margin : left + w / 2 - win.offsetWidth / 2));
      if (box) { const S = box.getBoundingClientRect(), h = (U.bottom - U.top) / k, top = (U.top - S.top) / k, max = Math.max(0, box.scrollHeight - box.clientHeight); y = Math.min(max, Math.max(0, h > box.clientHeight - 2 * margin ? top - margin : top + h / 2 - box.clientHeight / 2)); }
    } else if (box && scrollTo) {
      const el = win.querySelector(`[data-iq-target="${scrollTo}"]`);
      if (el) y = Math.max(0, (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / k - 4);
    }
    page.style.transform = `translateX(${-x}px)`;
    if (box) box.scrollTop = y ?? 0;
  });
}

export const clock = s => { s = Math.max(0, Math.floor(s)); return [s / 3600, (s / 60) % 60, s % 60].map(n => String(Math.floor(n)).padStart(2, '0')).join(':'); };

// A mission of a board, in the shape the tablet board takes (components/InteractiveMissionBoard.jsx `demoState.missions`).
export const mission = (id, title, type, status, rest = {}) => ({id, title, type, status, points: null, date: '09-23-26', time: '03:05 PM', ageSeconds: 600, ...(type === 'Ticket' ? {responses: 1, location: 'Kitchen - Maintenance'} : {}), ...rest}); // (a ticket also says what raised it (`response`), how many responses, and where)

// ---- The tablet: a board of three columns (Open, Claimed, Closed), its menu or one of its own overlays ----
export function TabletPart({title = 'Team Board', missions, menu = false, overlay = null, name = 'Tablet', compact = false, ticketBoard = false, front = null, zoom = null, shade = null}) { // (`front`: what is drawn over the tablet's whole frame, not only its screen, in the tablet's own px: it is part of the tablet's layer, so it never goes behind it) (`zoom` {scale, x, y}: the tablet pushed in, moved `x`, `y` from the middle of the stage: it goes past the picture and the gray side is stacked over it, `data-sec-cut`) (`shade`: how dark the board is, `.sec-shade`, inside it so that a card can be over it)
  const root = useRef(null);
  useLayoutEffect(() => { // (what the cursor presses has a name: card-<mission id>, menu, add)
    root.current.querySelectorAll('.mi-card-button').forEach(el => {
      const id = `card-${el.dataset.missionId}`;
      el.setAttribute('data-iq-target', id);
      for (const [cls, key] of [['chip-exec', 'exec'], ['chip-who', 'who'], ['chip-performer-avatar', 'who'], ['chip-pill', 'pill'], ['chip-title', 'title'], ['chip-points', 'points']]) el.querySelector(`.${cls}`)?.setAttribute('data-iq-target', `${id}-${key}`);
    });
    root.current.querySelector('.tbl-header [aria-label="Menu"]')?.setAttribute('data-iq-target', 'menu');
    root.current.querySelector('.tbl-header [aria-label="Add"]')?.setAttribute('data-iq-target', 'add');
    root.current.querySelectorAll('.bn-menu-item').forEach(el => el.setAttribute('data-iq-target', `menu-${(el.textContent || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`));
  });
  return <div ref={root} className={`adx-tablet adx-tablet--engaged iq-tablet${compact ? ' sec-compact' : ''}`} data-sec-part={name} {...(zoom ? {'data-sec-cut': ''} : {})} style={{left: 800, top: 450, transform: zoom ? `translate(${zoom.x}px, ${zoom.y}px) translate(-50%,-50%) scale(${zoom.scale})` : 'translate(-50%,-50%) scale(1.1)'}}>
    <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={missions}
      demoState={{missions, elapsed: 0, selected: null, menuOpen: menu, boardTitle: title, ticketBoard, businessMediaLabel: 'Business Media'}} demoOverlay={overlay} demoBoard={shade == null ? null : <div className="sec-shade" aria-hidden="true" style={{opacity: shade}}/>}/>
    {front}
  </div>;
}

// ---- The On-Demand list (the + of the board): a drawer at the tablet's right with the missions that can be requested ----
// `items`: [kind, title, id?] (`id`: what the cursor presses is demand-<id> whatever the title is, else demand-<the title's slug>)
export function DemandPanel({department = 'Team Board', items = [], picked = null}) {
  return <aside className="mi-drawer" aria-label="On-Demand panel" style={{animation: 'none'}}><section className="bn-demand">
    <header className="bn-demand-header"><span className="ph-iconbtn"><IconBack/></span><h2>On-Demand - {department}</h2></header>
    <div className="bn-demand-body">
      <div className="bn-demand-tabs"><span className="is-active" style={{flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 9, background: '#187dc1', color: '#fff', font: '700 13px var(--font-montserrat),sans-serif'}}>By Mission</span><span style={{flex: 1, textAlign: 'center', padding: '9px 0', color: '#1271b7', font: '500 13px var(--font-montserrat),sans-serif'}}>By Reference</span></div>
      <div className="bn-demand-list">{items.map(([kind, title, id]) => <article className={`bn-demand-card${picked === title || (id && picked === id) ? ' is-picked' : ''}`} key={id ?? title} data-iq-target={`demand-${id ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}><div><img src="/mission-logo.png" alt=""/>{kind}</div><h3>{title}</h3></article>)}</div>
    </div>
  </section></aside>;
}

// ---- The mission by itself (the Improved Quality film's Mission Details, 360 x 573, shown at 1.5x) ----
// `items`: what the mission asks, in order. yesno {id, q, answer: 'yes' | 'no' | null, proof: {kind: 'photo' | 'video', state: 'ask' | 'rec' | 'done', poster, src}},
// text {id, q, value}, number {id, q, value, unit, flag}, training {id, q, title, done, text, poster}, quiz {id, answers: [i | null], questions: [{q, options}]},
// photo {id, q, state: 'ask' | 'done', poster}. `scrollTo`: the data-iq-target at the top of the window (the chip stays pinned over it).
const Box = ({checked}) => <span className={`iq-checkbox${checked ? ' is-checked' : ''}`} aria-hidden="true">{checked ? '✓' : ''}</span>;
const Play = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z"/></svg>;
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>;
function Request({kind, target, count = '0/1'}) {
  return <div className="iq-proof-request"><small>Add at least one {kind}</small>
    <div><span className="iq-proof-add" data-iq-target={target}><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 6.5v7M6.5 10h7"/></svg>Add {kind}</span><span>{count}</span></div>
  </div>;
}
function Proof({id, proof}) {
  if (!proof) return null;
  if (proof.state === 'ask') return <Request kind={proof.kind} target={`add-${proof.kind}-${id}`}/>;
  const video = proof.kind === 'video';
  return <div className="iq2-m-proof" data-iq-target={`${proof.kind}-proof-${id}`}>
    <div className={`iq2-m-frame${video ? '' : ' iq2-m-shot'}`} style={video ? undefined : {backgroundImage: `url('${proof.poster}')`}}>
      {video && <DemoVideo src={proof.src} poster={proof.poster} time={proof.time ?? 0}/>}
      {proof.state === 'rec' && <span className="iq2-rec"><i/>REC 00:0{proof.rec ?? 3}</span>}
    </div>
    {proof.state === 'done' && <div className="iq2-m-file">{video ? <VideoIcon/> : <PhotoIcon/>}<span>{proof.file ?? (video ? 'Video 9/23/2026 at 4:07:12 PM.mp4' : 'Photo 9/23/2026 at 4:07:12 PM.jpg')}</span></div>}
  </div>;
}
function Item({item, n}) {
  const head = <b>{n}. {item.q}</b>;
  if (item.type === 'yesno') return <section className="iq2-m-cp" data-iq-target={`cp-${item.id}`}>{head}
    <div className="iq2-m-options">
      <span role="checkbox" aria-checked={item.answer === 'yes'} className={item.answer === 'yes' ? 'is-selected' : undefined} data-iq-target={`yes-${item.id}`}><Box checked={item.answer === 'yes'}/>Yes</span>
      <span role="checkbox" aria-checked={item.answer === 'no'} className={item.answer === 'no' ? 'is-selected' : undefined} data-iq-target={`no-${item.id}`}><Box checked={item.answer === 'no'}/>No</span>
    </div><Proof id={item.id} proof={item.proof}/></section>;
  if (item.type === 'text') return <section className="iq2-m-cp" data-iq-target={`cp-${item.id}`}>{head}<div className={`sec-field${item.value ? ' has-value' : ''}`} data-iq-target={`field-${item.id}`}>{item.value || item.placeholder || 'Type here'}</div><Proof id={item.id} proof={item.proof}/></section>;
  if (item.type === 'number') return <section className="iq2-m-cp" data-iq-target={`cp-${item.id}`}>{head}<div className="sec-number"><span className={`sec-field sec-field--n${item.value != null ? ' has-value' : ''}${item.flag ? ' is-flag' : ''}`} data-iq-target={`field-${item.id}`}>{item.value ?? '#'}</span>{item.unit && <em>{item.unit}</em>}</div><Proof id={item.id} proof={item.proof}/></section>;
  if (item.type === 'photo') return <section className="iq2-m-cp" data-iq-target={`cp-${item.id}`}>{head}<Proof id={item.id} proof={{kind: 'photo', state: item.state ?? 'ask', poster: item.poster}}/></section>;
  if (item.type === 'training') return <section className="iq2-m-cp" data-iq-target={`cp-${item.id}`}>{head}
    <div className={`iq2-m-tile${item.done ? ' is-done' : ''}`} data-iq-target={`training-${item.id}`}>
      <span className="iq2-m-thumb" data-iq-target={`play-${item.id}`} style={{backgroundImage: `url('${item.poster}')`}}><i>{item.done ? <Check/> : <Play/>}</i></span>
      <span className="iq2-m-tile-text"><b>{item.title}</b><small>{item.done ? 'Video · Quiz' : item.meta ?? 'Video · 0:06'}</small></span>
      {item.done && <em className="iq2-m-done"><Check/>Done</em>}
    </div>
    {item.player && <div className="iq2-m-player" data-iq-target={`video-${item.id}`}><div className="iq2-m-frame"><DemoVideo src={item.player.src} poster={item.player.poster} time={item.player.time ?? 0}/></div>
      <div className="iq2-bar"><span><Play/></span><span className="iq2-bar-track"><i style={{width: `${Math.min(1, (item.player.time ?? 0) / (item.player.length ?? 6)) * 100}%`}}/></span><time>0:0{Math.max(0, Math.ceil((item.player.length ?? 6) - (item.player.time ?? 0)))}</time></div></div>}
    {item.text && <div className="sec-text" data-iq-target={`text-${item.id}`}>{item.text.map((p, i) => <p key={i}>{p}</p>)}</div>}
    {item.quiz && <Quiz id={item.id} quiz={item.quiz}/>}
  </section>;
  return null;
}
function Quiz({id, quiz}) {
  const done = quiz.answers.filter(a => a != null).length;
  return <div className="iq2-m-quiz" data-iq-target={`quiz-${id}`}><header><small>{quiz.questions.length}/{quiz.questions.length}</small><b>Quiz</b></header>
    {quiz.questions.map((q, i) => <section key={i}><p><span>{i + 1}.</span>{q.q}</p><div>{q.options.map((label, o) => <span role="checkbox" aria-checked={quiz.answers[i] === o} data-iq-target={`quiz-${id}-${i}-${o}`} key={label}><Box checked={quiz.answers[i] === o}/>{label}</span>)}</div></section>)}
    <span className={`iq2-m-submit${done === quiz.questions.length ? ' is-ready' : ''}`} data-iq-target={`quiz-submit-${id}`}>Submit</span>
  </div>;
}
export function MissionPanel({kind = 'Checklist', points = 25, title, location, who = 'Anna F', date = '09-23-26 04:03 PM', timer = '00:07:42', tone = 'green', status = 'claimed', brief = null, items = [], groupTitle = null, scrollTo = 'top', translate = false, name = 'Mission', scale = 1.5, closed = false, expand = 1, left = 341, top = 163, scrollMix = null}) { // (`scrollMix` {from, to, p}: the window between two scroll places, by a clock: a Remotion cut, components/remotion/AuditingCut.jsx; `scrollTo` is where it stands otherwise)
  const panel = useRef(null);
  useLayoutEffect(() => {
    const box = panel.current, content = box.querySelector('.iq2-m-content'), win = box.querySelector('.iq2-m-window'), chip = box.querySelector('.iq2-m-summary');
    const at = key => { if (key === 'top') return 0; const el = content.querySelector(`[data-iq-target="${key}"]`); return el ? el.getBoundingClientRect().top - content.getBoundingClientRect().top : 0; };
    const k = content.getBoundingClientRect().height / content.offsetHeight || 1, max = Math.max(0, content.offsetHeight - win.clientHeight);
    const place = key => Math.max(0, at(key) / k - chip.offsetHeight - 8);
    const y = Math.min(max, scrollMix ? place(scrollMix.from) + (place(scrollMix.to) - place(scrollMix.from)) * scrollMix.p : place(scrollTo));
    content.style.transform = `translateY(${-y}px)`; chip.style.transform = `translateY(${y}px)`;
    chip.style.boxShadow = y > 2 ? '0 10px 14px -10px rgb(21 39 54 / 30%)' : 'none';
    // popped as its summary card, centered, then expanded (the Improved Quality film's mission: the card is what is cut out of the panel, `expand` 0 to 1)
    const H = box.offsetHeight, top = chip.offsetTop + win.offsetTop, bottom = top + chip.offsetHeight, shift = (H / 2 - (top + bottom) / 2) * (1 - expand);
    box.style.transform = `translateY(${shift * scale}px) scale(${scale})`;
    box.firstElementChild.style.clipPath = expand >= 1 ? 'none' : `inset(${top * (1 - expand)}px 0 ${(H - bottom) * (1 - expand)}px 0 round ${14 + 4 * expand}px)`;
  });
  return <div ref={panel} className="iq2-mission" data-sec-part={name} style={{left, top, width: 360, height: 573, transform: `scale(${scale})`}}>
    <div className="iq2-m">
      <header className="iq2-m-head"><span className="iq2-m-back"><IconBack/></span><b>Mission Details</b>{translate && <span className="iq2-m-translate" data-iq-target="translate">ES</span>}</header>
      <div className="iq2-m-window" data-sec-window><div className="iq2-m-content">
        <section className="iq2-m-summary" data-iq-target="mission-chip">
          <div className="iq2-m-kind"><img src="/mission-logo.png" alt=""/><span>{kind}</span>{points != null && <b>{points}</b>}<em className={`sec-timer sec-timer--${tone}`} data-iq-target="mission-timer">{timer}</em></div>
          <h3>{title}</h3><small>{location}</small>
          <div className="iq2-m-meta"><span>{who}</span><time>{date}</time></div>
        </section>
        {brief && <section className="iq2-m-brief">
          {brief.instructions && <p data-iq-target="instructions">{brief.instructions}</p>}
          {brief.alert && <div className="iq2-m-alert" data-iq-target="warning">{brief.alert}</div>}
          {brief.link && <span className="iq2-m-link" data-iq-target="link">{brief.link} ↗</span>}
        </section>}
        {groupTitle && <div className="iq2-m-group" data-iq-target="checklist">{groupTitle.name}<span>{groupTitle.count}</span></div>}
        {items.map((item, i) => <Item key={item.id} item={item} n={i + 1}/>)}
        {closed && <div className="sec-closed" data-iq-target="closed-bar">Closed</div>}
      </div></div>
    </div>
  </div>;
}

// ---- Isolated missions: cards on their own, with the purple connectors the ratings use (the Improved Quality film's lifted mission) ----
// `chips`: [{id, x, y, mission: {kind, title, who, avatar, date, time, exec, pill, tone, points, tick, ...}, scale, opacity, after}] (`after`: what sits beside the card, scaled with it; `tick`: 'open' | 'claimed' | 'closed', the column the timers count in, `data-sec-tick`), `lines`: [{from: [x, y], to: [x, y], via, arrow}] in stage px, `labels`: [{x, y, text}].
const PURPLE = '#7b3cf0';
export function FlowPart({chips = [], lines = [], labels = [], name = 'Layer', center = true, free = false, middle = 521}) { // (named 'Layer', not 'Isolated missions': the video lifts a card named so out of a board, and these are not on one) (`free`: cards over a tablet that are not part of it: the video leaves them where they are when it fits the tablet, and glides them onto it in the next slide: `landCards`) (`middle`: the x the group is centered on)
  const root = useRef(null);
  const empty = !chips.length && !lines.length && !labels.length; // (nothing to draw: no layer at all; an empty one would be glided into the card that comes, from the size of the whole layer)
  // What is drawn is centered on the plate (the user, 2026-10-16: "the missions etc. it should be centered"): the cards, their arrows and labels are one group, moved as one so that the middle of the group
  // is the middle of the plate (x 521, y 450); a state with one more card is centered again (what is on the slide always is: everything glides to stay centered). What sits beside a card and is not seen yet does not
  // count (the user, 2026-10-30: "start centered then show schedule push them to the left, then center again when fade out").
  useLayoutEffect(() => {
    const el = root.current, inner = el?.querySelector('.sec-flow-inner');
    if (!inner || !center) return;
    inner.style.transform = 'none';
    const K = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
    let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
    for (const n of inner.querySelectorAll('.chip, .sec-flow-lines > path, .sec-label, .sec-after')) { if (n.matches('.sec-after') && n.firstElementChild?.style.opacity === '0') continue; const r = n.getBoundingClientRect(); if (r.width < 2 && r.height < 2) continue; L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); }
    if (!isFinite(L)) return;
    const o = el.getBoundingClientRect(), dx = middle - ((L + R) / 2 - o.left) / K, dy = 450 - ((T + B) / 2 - o.top) / K;
    inner.style.transform = `translate(${Math.round(dx * 10) / 10}px, ${Math.round(dy * 10) / 10}px)`;
  });
  useLayoutEffect(() => { // (the parts of a card: <id>-exec, <id>-who, <id>-pill, <id>-title, <id>-kind)
    root.current?.querySelectorAll('.sec-chip').forEach(el => {
      const id = el.dataset.secChip, chip = el.querySelector('.chip'); // (the card is what is pressed and outlined, not the wide board it is drawn on)
      chip?.setAttribute('data-iq-target', id);
      for (const [cls, key] of [['chip-exec', 'exec'], ['chip-who', 'who'], ['chip-performer-avatar', 'who'], ['chip-pill', 'pill'], ['chip-title', 'title'], ['chip-kind', 'kind'], ['chip-ratings', 'ratings'], ['chip-points', 'points']]) el.querySelector(`.${cls}`)?.setAttribute('data-iq-target', `${id}-${key}`);
    });
  });
  if (empty) return null;
  return <div ref={root} className="iq2-iso-layer sec-flow" data-sec-part={name} {...(free ? {'data-sec-free': ''} : {})} style={{width: 1600, height: 900}}>
    <div className="sec-flow-inner" style={{position: 'absolute', inset: 0}}>
    <svg className="sec-flow-lines" width="1" height="1" style={{overflow: 'visible'}} aria-hidden="true">
      <defs><marker id="sec-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
      {lines.map((l, i) => <path key={i} d={l.d ?? `M${l.from[0]} ${l.from[1]}${l.via ? ` L${l.via[0]} ${l.via[1]}` : ''} L${l.to[0]} ${l.to[1]}`} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd={l.arrow === false ? undefined : 'url(#sec-arrow)'} style={{opacity: l.opacity ?? 1}} data-iq-target={l.id}/>)}
    </svg>
    {chips.map(c => {
      const m = c.mission;
      return <div key={c.id} className="mi-interactive mi-interactive--tablet mi-reference iq2-iso sec-chip" data-sec-chip={c.id} {...(m.tick ? {'data-sec-tick': m.tick} : {})} style={{position: 'absolute', left: c.x, top: c.y, transform: `scale(${c.scale ?? 1.25})`, transformOrigin: '0 0', opacity: c.opacity ?? 1}}><div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: 334}}>
        {m.kind === 'Ticket' ? <TicketCard title={m.title} responses={m.responses ?? 1} response={m.response} location={m.location ?? 'Kitchen - Maintenance'} date={m.date ?? '09-23-26'} time={m.time ?? '03:05 PM'} showExec={m.exec != null} execTime={m.exec} pillTime={m.pill ?? '00:00:00'} pillClass={`chip--${m.tone ?? 'green'}`} who={m.who} avatar={m.avatar} alert/> : <MissionChip kind={m.kind} points={m.points ?? null} title={m.title} reference={m.reference} who={m.who} avatar={m.avatar} date={m.date ?? '09-23-26'} time={m.time ?? '03:05 PM'} showExec={m.exec != null} execTime={m.exec} pillTime={m.pill ?? '00:00:00'} pillClass={`chip--${m.tone ?? 'green'}`} rate={!!m.rate} ratings={m.ratings ?? []}/>}
      </div></div>{c.after ? <div className="sec-after">{c.after}</div> : null}</div>;
    })}
    {labels.map((l, i) => <span key={i} className="iq2-rating-label sec-label" style={{left: l.x, top: l.y}}>{l.text}</span>)}
    </div>
  </div>;
}

// ---- helpers for laying cards out on their own ----
export const AVATAR = {anna: '/avatars/02.png', ben: '/avatars/03.png', leo: '/avatars/01.png', carla: '/avatars/04.png', dan: '/avatars/05.png'};
export const TICKET_H = 232; // an alert ticket card is taller than a mission's (components/TicketCard.jsx), in px at scale 1
export const FLOW = {scale: 1.2, w: 334 * 1.2, h: 152, gap: 10}; // a card on its own: as wide as it is drawn, about as tall, and the room an arrow leaves round it
// (a ticket is taller: it is placed so that its middle is where a mission card's would be, so the arrows between a mission and a ticket stay level)
export const card = (id, x, y, m, extra = {}) => ({id, x, y: m.kind === 'Ticket' ? y + FLOW.h / 2 - (TICKET_H * FLOW.scale) / 2 : y, mission: m, scale: FLOW.scale, ...extra});
// an arrow from the right of one card to the left of the next, level with their middles
export const across = (id, from, to, level = FLOW.h / 2) => ({id, from: [from.x + FLOW.w + FLOW.gap, from.y + level], to: [to.x - FLOW.gap, to.y + level]});

// ---- a QR code (the look of one: the three finder squares, the alignment square, the timing lines and modules from a seed; it is not meant to be scanned) ----
function modulesOf(seed, n = 29) {
  let h = 2166136261; for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  const on = Array.from({length: n}, () => Array(n).fill(false)), fixed = Array.from({length: n}, () => Array(n).fill(false));
  const finder = (x, y) => { for (let j = -1; j <= 7; j++) for (let i = -1; i <= 7; i++) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= n || Y >= n) continue; fixed[Y][X] = true; on[Y][X] = i >= 0 && i <= 6 && j >= 0 && j <= 6 && (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)); } };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const X = n - 9 + i, Y = n - 9 + j; fixed[Y][X] = true; on[Y][X] = i === 0 || i === 4 || j === 0 || j === 4 || (i === 2 && j === 2); }
  for (let i = 8; i < n - 8; i++) { fixed[6][i] = fixed[i][6] = true; on[6][i] = on[i][6] = i % 2 === 0; }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fixed[y][x]) on[y][x] = rnd() < 0.5;
  return on;
}
export function Qr({size = 240, seed = 'taskmaverick', color = '#111'}) {
  const on = modulesOf(seed), n = on.length;
  const d = on.flatMap((row, y) => row.map((v, x) => (v ? `M${x + 2} ${y + 2}h1v1h-1z` : ''))).join('');
  return <svg viewBox={`0 0 ${n + 4} ${n + 4}`} width={size} height={size} shapeRendering="crispEdges" aria-hidden="true"><rect width={n + 4} height={n + 4} fill="#fff"/><path d={d} fill={color}/></svg>;
}
