'use client';
// Mass Broadcasting's art for the section videos (lib/sections/mass-broadcasting.mjs), only the product's own UI (the user, 2026-10-20):
//   flow     an announcement (a Media mission: the product's mission card, MissionChip) on its own ('card'); sent to every person ('sent': their faces, each with the announcement's card on its
//            right, the purple connectors from the one card to all of them); who passed its quiz ('results': a check or a cross on the face) and the Confirmation Delay ticket (TicketCard) the
//            two who failed raise for the sender ('alert')
//   mission  the announcement opened: the product's opened Media mission (OpenedMission, its Media body): its text in the summary (a document), its media (the document, the video) and its quiz,
//            the Estimated Time. A lesson that plays (the video, the quiz) is the Improved Quality lesson screen in the videos (the spec's `lesson` / `lessonTopics`, lib/storyboardLesson.mjs)
//   web      the web app's Overview › Personal Board (OverviewBoard, as Live Monitoring draws its course board), grouped by person, whose Open / Claimed / Closed At columns say who has not reviewed,
//            who is reviewing and who understood
// Each a state given as data; the DOM of the cards is the same in every state of the flow (what is not there has no opacity and no name), so the video moves from one to the next.
import {useLayoutEffect, useRef} from 'react';
import {AVATAR, useCenter} from './parts';
import MissionChip from '../MissionChip';
import TicketCard from '../TicketCard';
import {OpenedMission} from '../OpenedMission';
import {OverviewBoard} from './MonitoringStage';
import {ALLERGEN_NOTICE} from '@/lib/sections/mass-broadcasting.mjs';
import './mass-broadcasting.css';

export const BROADCAST_BASE = {view: 'flow', ann: 'doc', flow: 'card', who: null, expand: 1, om: 'open', done: [], pressed: null, focus: null, pan: 0, rows: null};

// ---- the announcements: [row id, label, the media's kind (OpenedMission's tags), its length] ----
const ANN = {
  doc: {title: 'New Allergen Policy', description: ALLERGEN_NOTICE.join(' '), notice: 'Read it and take the quiz before your next shift.', estimated: '00:05', rows: [['doc', 'New Allergen Policy', 'illustration', 'n/a'], ['quiz', 'Quiz', 'quiz', 'n/a']]},
  video: {title: 'New Shelving Standards', description: 'Watch the new shelving standards and how to store each item.', notice: 'Watch it and take the quiz before your next shift.', estimated: '00:03', rows: [['video', 'Shelving Standards', 'video', '00:06'], ['quiz', 'Quiz', 'quiz', 'n/a']]},
};

// ---- the people it goes to: [id, name on a card, face]; who passes the quiz ----
const PEOPLE = [['anna', 'Anna F', AVATAR.anna], ['ben', 'Ben R', AVATAR.ben], ['carla', 'Carla M', AVATAR.carla], ['leo', 'Leo T', AVATAR.leo], ['dan', 'Dan K', AVATAR.dan]];
const FAILED = new Set(['ben', 'dan']);

// ---- the announcement opened: the product's opened Media mission (components/OpenedMission.jsx), where every phone view of the sections is (the Improved Quality mission's box: 360 x 573 at
// 1.5, in the middle of the plate). `expand` 0 to 1 pops it as its summary card, then opens it (MissionPanel's way); `om` open (Claim) or claimed (its Execution timer, Close); `done`: the media
// watched (a check in place of its length); `pressed`: the row just tapped ----
const SCALE = 1.5, BOX = {left: 341, top: 163, width: 360, height: 573};
function Opened({s}) {
  const ref = useRef(null), a = ANN[s.ann], claimed = s.om === 'claimed';
  const mission = {id: `broadcast-${s.ann}`, type: 'Media', points: null, title: a.title, location: 'Main Street / All Staff', date: '10-20-26', time: '09:00 AM', pillTime: s.who ? '00:02:15' : '00:00:00', pillClass: 'chip--green',
    postedBy: 'Posted by: Maria L', openWho: s.who ?? 'All Staff', claimedWho: s.who ?? 'All Staff', description: a.description, notice: a.notice, estimated: a.estimated,
    contents: a.rows.map(([id, label, kind, meta], i) => ({n: i + 1, label, kind, meta: s.done.includes(id) ? '✓' : meta}))};
  useLayoutEffect(() => {
    const box = ref.current, om = box?.querySelector('.om'), card = om?.querySelector('.om-card');
    if (!om || !card) return;
    om.querySelectorAll('.om-mrow').forEach((row, i) => { // (what the cursor presses and the outlines go round)
      const id = a.rows[i]?.[0];
      row.setAttribute('data-iq-target', `row-${id}`); row.classList.toggle('is-pressed', s.pressed === id);
    });
    om.querySelector('.om-sum-desc')?.setAttribute('data-iq-target', 'announcement-text');
    card.setAttribute('data-iq-target', 'mission-chip');
    const e = s.expand, H = box.offsetHeight, top = card.offsetTop, bottom = top + card.offsetHeight, shift = (H / 2 - (top + bottom) / 2) * (1 - e);
    box.style.transform = `translateY(${Math.round(shift * SCALE * 100) / 100}px) scale(${SCALE})`;
    box.firstElementChild.style.clipPath = `inset(${Math.round(top * (1 - e) * 100) / 100}px 0px ${Math.round((H - bottom) * (1 - e) * 100) / 100}px 0px round ${14 + 4 * e}px)`;
  });
  return <div ref={ref} className="iq2-mission sec-mb-om" data-sec-part="Mission" style={{...BOX, transform: `scale(${SCALE})`}}>
    <div className="sec-mb-om-clip">
      <OpenedMission mission={mission} state={claimed ? 'claimed' : 'open'} showExec={claimed} execTime="00:00:48" showStatusBar={false}/>
    </div>
  </div>;
}

// ---- the cards on their own: the announcement, the people with theirs, the ticket (one layer; placed here, centered on the plate by measuring what is there) ----
const PURPLE = '#7b3cf0', K = {ann: 1.15, copy: 0.9, ticket: 1.1}, H = 126.7, W = 334, FACE = 76, PITCH = 128, GAP = 14;
const ON = (on, extra = {}) => ({opacity: on ? 1 : 0, ...extra});
function chipBox(id, x, y, scale, on, chip, named = on) { // (`y`: the middle of the card: it is scaled round its left middle)
  return <div key={id} className="mi-interactive mi-interactive--tablet mi-reference iq2-iso sec-chip sec-mb-chip" data-sec-chip={id} data-on={on ? 1 : 0} data-name={named ? id : ''}
    style={{position: 'absolute', left: Math.round(x), top: Math.round(y - H / 2), transformOrigin: '0 50%', ...ON(on, {transform: `scale(${scale * (on ? 1 : 0.7)})`})}}>
    <div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: W}}>{chip}</div></div>
  </div>;
}
function Flow({s}) {
  const root = useRef(null), a = ANN[s.ann];
  const sent = s.flow !== 'card', results = s.flow === 'results' || s.flow === 'alert', alert = s.flow === 'alert';
  // where things are (before the centering): the announcement at the left, the people in a column at its right (or at the left, with the ticket at their right, once it is raised)
  const annW = W * K.ann, copyW = W * K.copy;
  const faceX = alert ? 0 : annW + 110, copyX = faceX + FACE + GAP, bus = annW + 55, ticketX = copyX + copyW + 110, mid = copyX + copyW + 55;
  const rowY = i => (i - 2) * PITCH;
  const lines = [
    {id: 'feed', d: `M${annW + 10} 0 L${bus} 0`, on: sent && !alert, arrow: false},
    {id: 'bus', d: `M${bus} ${rowY(0)} L${bus} ${rowY(4)}`, on: sent && !alert, arrow: false},
    ...PEOPLE.map(([id], i) => ({id: `to-${id}`, d: `M${bus} ${rowY(i)} L${faceX - 10} ${rowY(i)}`, on: sent && !alert})),
    ...PEOPLE.map(([id], i) => ({id: `late-${id}`, d: `M${copyX + copyW + 10} ${rowY(i)} L${mid} ${rowY(i)} L${mid} 0`, on: alert && FAILED.has(id), arrow: false})),
    {id: 'to-ticket', d: `M${mid} 0 L${ticketX - 10} 0`, on: alert},
  ];
  useLayoutEffect(() => { // (the parts of a card get their names, and what is there is centered on the plate, x 521, y 450: everything glides to stay centered as cards come and go)
    const el = root.current, inner = el?.querySelector('.sec-flow-inner');
    if (!inner) return;
    el.querySelectorAll('.sec-mb-chip').forEach(box => {
      const id = box.dataset.name, chip = box.querySelector('.chip');
      if (id) chip?.setAttribute('data-iq-target', id); else chip?.removeAttribute('data-iq-target');
      for (const [cls, key] of [['chip-pill', 'pill'], ['chip-title', 'title'], ['chip-who', 'who']]) { const part = box.querySelector(`.${cls}`); if (id) part?.setAttribute('data-iq-target', `${id}-${key}`); else part?.removeAttribute('data-iq-target'); }
    });
    inner.style.transform = 'none';
    const k = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
    let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
    for (const n of inner.querySelectorAll('[data-on="1"]')) { const r = (n.querySelector('.chip') ?? n).getBoundingClientRect(); if (r.width < 2 && r.height < 2) continue; L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); }
    if (!isFinite(L)) return;
    const o = el.getBoundingClientRect(), dx = 521 - ((L + R) / 2 - o.left) / k, dy = 450 - ((T + B) / 2 - o.top) / k;
    inner.style.transform = `translate(${Math.round(dx * 10) / 10}px, ${Math.round(dy * 10) / 10}px)`;
  });
  const chip = (who, tone = 'green', pill = '00:00:00') => <MissionChip kind="Media" points={null} title={a.title} who={who} date="10-20-26" time="09:00 AM" pillTime={pill} pillClass={`chip--${tone}`}/>;
  return <div ref={root} className="iq2-iso-layer sec-flow sec-mb-flow" data-sec-part="Layer" style={{width: 1600, height: 900}}>
    <div className="sec-flow-inner" style={{position: 'absolute', inset: 0}}>
      <svg className="sec-flow-lines" width="1" height="1" style={{overflow: 'visible'}} aria-hidden="true">
        <defs><marker id="sec-mb-head" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
        {lines.map(l => <path key={l.id} d={l.d} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd={l.arrow === false ? undefined : 'url(#sec-mb-head)'} data-on={l.on ? 1 : 0} style={{opacity: l.on ? 1 : 0}}/>)}
      </svg>
      {chipBox('announcement', 0, 0, K.ann, !alert, chip('All Staff'))}
      {PEOPLE.map(([id, name, face], i) => {
        const pass = results && !FAILED.has(id), fail = results && FAILED.has(id);
        return <div key={id} className="sec-mb-row">
          <div className="sec-mb-face" data-on={sent ? 1 : 0} data-iq-target={sent ? `face-${id}` : undefined} style={{left: faceX, top: rowY(i) - FACE / 2, ...ON(sent, {transform: `scale(${sent ? 1 : 0.6})`})}}>
            <img src={face} alt=""/>
            <span className={`sec-mb-badge ${fail ? 'is-fail' : 'is-pass'}`} data-iq-target={results ? `${fail ? 'fail' : 'pass'}-${id}` : undefined} style={ON(results, {transform: `scale(${results ? 1 : 0.4})`})}>
              {fail ? <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/></svg> : <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.6 10.6 8.4 14.4 15.6 6.2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </span>
          </div>
          {chipBox(`copy-${id}`, copyX, rowY(i), K.copy, sent, chip(name, pass ? 'gray' : 'green', pass ? '00:03:40' : '00:00:00'))}
        </div>;
      })}
      <div className="mi-interactive mi-interactive--tablet mi-reference iq2-iso sec-chip sec-mb-ticket" data-on={alert ? 1 : 0} style={{position: 'absolute', left: Math.round(ticketX), top: -116, transformOrigin: '0 50%', ...ON(alert, {transform: `scale(${K.ticket * (alert ? 1 : 0.6)})`})}}>
        <div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: W}}>
          <TicketCard title="Confirmation Delay" responses={2} response="Ben R and Dan K have not confirmed the New Allergen Policy." location="Main Street - Training" date="10-20-26" time="09:30 AM" pillTime="00:00:00" pillClass="chip--green" alert/>
        </div></div>
      </div>
    </div>
  </div>;
}

// ---- the Personal Board of announcements (the web app's Overview › Personal Board, Running, grouped by person: screenshot 19; the Team Board has no Group by: Person) ----
const COLUMNS = [['name', 330], ['ref', 100], ['state', 115], ['triggered', 175], ['by', 130], ['open', 115], ['claimed', 115], ['duration', 115], ['closed', 175], ['type', 100], ['position', 150]]; // (the Team Board's columns: OverviewScene)
const g = t => [t, 'green'], o = t => [t, 'outline'], gr = t => [t, 'gray'];
const WHO = {anna: 'Anna Fischer', ben: 'Ben Rivera', carla: 'Carla Mendes', leo: 'Leo Tran', dan: 'Dan Kowalski'};
const ann = (id, index, name, state, timers, closed = null) => ({kind: 'item', shallow: true, id, index, name, state, triggered: '10/20/2026 09:00 AM', by: state === 'Open' ? null : WHO[id.split('-')[0]], type: 'Media', position: 'Staff', closed: closed && `10/20/2026 ${closed}`, ...timers});
const open = t => ({open: g(t), duration: o(t)}), claimed = (w, c, d) => ({open: g(w), claimed: g(c), duration: o(d)}), closed = (w, c, d) => ({open: g(w), claimed: g(c), duration: gr(d)});
const person = (id, index, label, rows) => [{kind: 'person', id, index, label, count: rows.length, totals: {open: rows.filter(r => r.state === 'Open').length, claimed: rows.filter(r => r.state === 'Claimed').length, closed: rows.filter(r => r.state === 'Closed').length}}, ...rows];
export const BROADCAST_ROWS = [
  ...person('anna', 0, 'Anna Fischer', [ann('anna-allergen', 0, 'New Allergen Policy', 'Closed', closed('00:02:10', '00:03:40', '00:05:50'), '09:06 AM'), ann('anna-shelving', 1, 'New Shelving Standards', 'Closed', closed('00:05:12', '00:02:31', '00:07:43'), '09:08 AM'), ann('anna-holiday', 2, 'Holiday Hours Update', 'Claimed', claimed('00:21:05', '00:01:48', '00:22:53'))]),
  ...person('ben', 1, 'Ben Rivera', [ann('ben-allergen', 0, 'New Allergen Policy', 'Open', open('00:22:53')), ann('ben-shelving', 1, 'New Shelving Standards', 'Claimed', claimed('00:18:40', '00:04:13', '00:22:53')), ann('ben-holiday', 2, 'Holiday Hours Update', 'Open', open('00:22:53'))]),
  ...person('carla', 2, 'Carla Mendes', [ann('carla-allergen', 0, 'New Allergen Policy', 'Closed', closed('00:01:35', '00:03:02', '00:04:37'), '09:05 AM'), ann('carla-shelving', 1, 'New Shelving Standards', 'Closed', closed('00:04:50', '00:02:44', '00:07:34'), '09:12 AM'), ann('carla-holiday', 2, 'Holiday Hours Update', 'Closed', closed('00:08:15', '00:01:55', '00:10:10'), '09:20 AM')]),
  ...person('leo', 3, 'Leo Tran', [ann('leo-allergen', 0, 'New Allergen Policy', 'Closed', closed('00:06:20', '00:04:05', '00:10:25'), '09:10 AM'), ann('leo-shelving', 1, 'New Shelving Standards', 'Claimed', claimed('00:19:30', '00:03:23', '00:22:53')), ann('leo-holiday', 2, 'Holiday Hours Update', 'Open', open('00:22:53'))]),
  ...person('dan', 4, 'Dan Kowalski', [ann('dan-allergen', 0, 'New Allergen Policy', 'Open', open('00:22:53')), ann('dan-shelving', 1, 'New Shelving Standards', 'Open', open('00:22:53')), ann('dan-holiday', 2, 'Holiday Hours Update', 'Claimed', claimed('00:20:11', '00:02:42', '00:22:53'))]),
];
function Dashboard({s}) {
  const win = useRef(null);
  useCenter(win, {focus: s.focus, pan: s.pan, scroller: '.iq-ow-rows', scrollTo: s.rows});
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 760, width: 1620}}>
      <div className="iq-ol-page"><OverviewBoard board="Personal Board" view="Running" groupBy="Person" tools="running" columns={COLUMNS} rows={BROADCAST_ROWS}/></div>
    </div>
  </div>;
}

export default function BroadcastStage({state}) {
  const s = {...BROADCAST_BASE, ...state};
  if (s.view === 'web') return <Dashboard s={s}/>;
  if (s.view === 'mission') return <Opened s={s}/>;
  return <Flow s={s}/>;
}
