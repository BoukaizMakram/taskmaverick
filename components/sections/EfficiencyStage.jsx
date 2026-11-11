'use client';
// Increased Efficiency's art for the section videos (lib/sections/increased-efficiency.mjs): the three personal boards (phones) the missions are assigned to, the team board on the shared tablet with
// each mission's schedule, points and timer color, the faces of the team, the personal code (a panel by the mission) and the claim and the close that move the mission, then the closed missions' execution
// timers and names. The same pieces and states as the other sections (components/sections/parts.jsx): what moves between two states is the same DOM, so the video moves it.
import {useLayoutEffect, useRef, useState} from 'react';
import {FlowPart, TabletPart, card, clock, mission} from './parts';
import PhoneShell from '../PhoneShell';
import MissionChip from '../MissionChip';
import {PersonalCodeKeypad} from '../PersonalCodeDialog';

// (the CEO's review of 2026-10-28, docs/meetings/2026-10-28-ceo-review.md, and the user, 2026-11-02: the priority is shown on three missions of the tablet, zoomed into (`zoom` 1, `cards` of them); the schedule, points and the timer's
// colors on the two top ones lifted out of it, with no tablet (`view: 'pair'`, the user, 2026-11-04);
// two people (`who` on the mission `target`) claim and close two missions, `sig` and `ord` (`open` | `claimed` | `closed`); those two closed missions are shown on the tablet zoomed into too (`zoom` 2);
// then the initiative on the board after those closes (`more`): the three people, one at a time, claim and close a mission (`row`))
export const EFFICIENCY_BASE = {view: 'board', phones: 0, board: 4, sched: 0, pts: 0, tone: 0, faces: 0, code: -1, action: 'Claim', badge: 0, who: 'adam', target: 'sig', sig: 'open', ord: 'open', cards: 2, zoom: 0, cleared: 0};
const ORANGE = '#ed7f04', RED = '#bd1f59';
const PEOPLE = [{id: 'adam', name: 'Adam F', src: '/avatars/team-adam.png'}, {id: 'ben', name: 'Ben R', src: '/avatars/team-ben.png'}, {id: 'maya', name: 'Maya R', src: '/avatars/team-maya.png'}, {id: 'leo', name: 'Leo T', src: '/avatars/03.png'}];
const face = id => PEOPLE.find(p => p.id === id);
const TEAM = ['adam', 'maya', 'ben']; // the people at the left of the tablet, from the bottom (`faces` of them, in this order). The three of the picture (the user, 2026-11-02: "make them 3 instead of 4", then "generate faces ... that looks like the guys in ai image and put them in similar avatar frames": Maya the ponytail, Adam the curls, Ben the short dark hair; public/avatars/team-*.png, the jobs `face-*` of scripts/generate-images.mjs)

// ---- the team board ----
const CARDS = [['inv', 'Inventory Check', 'Checklist', 10], ['ord', 'Order Supplies', 'Checklist', 15], ['sig', 'Safety Check', 'Checklist', 20], ['prep', 'Prepare Workspace', 'Task', 15]];
const POINTS = new Set(['inv', 'ord']); // (the CEO, 2026-10-28: "do only two of them with reward points, we don't need the lower ones")
// what each timer shows at each state of the colors: the order is the longest timer first (the open missions are in the order they were posted); a mission turns orange and rises, another turns orange and
// rises, then red and goes to the top: green green green, then orange green green, orange orange green, red orange orange (the user's comment on the video, 2026-10-30)
const AGE = {inv: [480, 480, 430, 430], ord: [360, 548, 548, 548], sig: [180, 180, 450, 640], prep: [120, 120, 120, 120], desk: [330, 330, 330, 330], room: [210, 210, 210, 210]};
const COLOR = {inv: [null, null, null, ORANGE], ord: [null, ORANGE, ORANGE, ORANGE], sig: [null, null, ORANGE, RED], prep: [null, null, null, null], desk: [null, null, null, null], room: [null, null, null, null]};
const ORDER = [['inv', 'ord', 'sig', 'prep'], ['ord', 'inv', 'sig', 'prep'], ['ord', 'sig', 'inv', 'prep'], ['sig', 'ord', 'inv', 'prep']];
const WHO = {sig: 'adam', ord: 'maya', inv: 'ben', desk: 'maya', room: 'adam'}; // who claims and closes which
const DONE = {sig: [252, 220], ord: [198, 220], inv: [96, 230], desk: [124, 240], room: [83, 250]}; // a closed mission: [what it took, when it was closed: the last one closed is on top of the column]
// The board after the two closes (`more`; the user, 2026-10-30: "those missions should go to closed"): the two closed missions in Closed where they already are, Order Supplies on top (each column keeps this list's order), four missions in Open, the longest timer first.
const MORE = [['desk', 'Restock Front Desk', 'Checklist', 10], ['room', 'Clean Break Room', 'Task', 10]];
// `cleared` (the user, 2026-11-02: "just fade out these two missions when reaching Teams Are Constantly Guided To Take Initiatives On Their Own"): the first two closed missions leave the column, or the three the team closes would push them down onto its avatars. They stay in the list with `gone`, so the video fades them where they are and nothing else is laid out again.
const NEXT_ROW = ['ord', 'sig', 'inv', 'desk', 'room', 'prep'].map(id => [...CARDS, ...MORE].find(c => c[0] === id)), NEXT_OPEN = ['inv', 'desk', 'room', 'prep'];
// ---- the tablet zoomed into (the user, 2026-11-02: "when we zoom in here to missions, u should keep tablet, and just zoom in to tablet and cut right side") ----
// `zoom` 1: the same tablet pushed in on its Open column, the left of it in the picture and the gray side over the rest (TabletPart's `zoom`). The numbers put its frame's top left corner 16 px from the picture's edges, its
// cards 1.45 times as big as the video's fitted tablet has them (1.45 x 1220 wide; `tabletFit`), the last of three missions ending 40 px over the picture's bottom. Since 2026-11-04 only the priority's three use it (the schedules and the
// points are on the two missions by themselves: `Pair`); the schedules drawn beside a card here (`Over`) are not shown any more.
// `zoom` 2 (the user, 2026-11-02: "zoom in on tablet same way on missions in 0:55 to 1 minute for those two completed missions"): as big and as high, on its Closed column, the last one, so the frame's right edge is where the fitted
// tablet has it, at the gray side (PANEL_EDGE, 1172): the tablet grows from that edge, and what goes is at the left of the picture.
// Two or three missions are shown (`cards`), then the two closed ones: all the missions stay on the board and everything else is dimmed (the user, 2026-11-02: "do not remove other missions, just dim everything when we want to show one mission etc"):
// the shade `DIM` is over the board, the cards shown are over the shade. `lit` (1 or 2, as `zoom`): they stay over it while the tablet zooms out and the shade goes.
const ZOOM = {1: {scale: 2.05, x: 33, y: 157.5}, 2: {scale: 2.05, x: -441, y: 157.5}}, DIM = 0.5;
const litOf = s => ((s.zoom || s.lit) === 2 ? ['sig', 'ord'] : ORDER[0].slice(0, s.cards));
function missionsOf(s) {
  const t = Math.min(3, s.tone), order = s.more ? NEXT_OPEN : ORDER[t], list = [];
  (s.more && s.board ? NEXT_ROW : CARDS.slice(0, s.board)).forEach(([id, title, type, points]) => {
    const base = {points: s.pts && POINTS.has(id) ? points : null, ageSeconds: AGE[id][t], openOrder: order.indexOf(id), timerColor: s.more ? undefined : COLOR[id][t] ?? undefined, date: '07-14-26', time: '08:00 AM'}; // (`more`: a fresh board, all green)
    const own = s[id] ?? 'open';
    if (own === 'claimed') list.push(mission(id, title, type, 'claimed', {...base, executionSeconds: 14, started: 200})); // (no performer of its own: the person's avatar of the team sits there, `Team`)
    else if (own === 'closed') list.push(mission(id, title, type, 'closed', {...base, performer: face(WHO[id]).name, showPerformerName: true, executionSeconds: DONE[id][0], stopped: DONE[id][1], timerColor: undefined, gone: !!s.cleared && (id === 'sig' || id === 'ord')}));
    else list.push(mission(id, title, type, 'open', base));
  });
  return list;
}
const CalendarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>;
const SCHEDULE = {inv: ['Daily · 8:00 AM'], ord: ['Mon · 10:00 AM', 'Thu · 10:00 AM']}; // (the CEO, 2026-10-28: "instead of monthly ... Mondays 10 a.m., Thursdays 10 a.m., like just two circles next to it, so they look the same size too")

// What sits over the board, in the tablet's own px: the team at its left (the CEO, 2026-10-28: "three or four avatars here at the bottom on the tablet, as if they're sitting at the bottom of this
// tablet", bottom right; the user, 2026-11-03: at the left), the personal code and the person it is for, a mission's schedule beside it when the tablet is zoomed into (placed by measuring: the cards are where the board puts them).
function Over({s}) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const el = root.current, screen = el.closest('.tbl-screen'), lit = s.zoom || s.lit ? litOf(s) : [];
    screen.style.scale = s.zoom ? String(SCREEN) : ''; // (zoomed in, 3% is a dozen px: the outlines are measured on the screen at the size the boards draw it)
    screen.querySelectorAll('[data-mission-id]').forEach(m => { m.style.zIndex = lit.includes(m.dataset.missionId) ? 4 : ''; }); // (over the shade: `.sec-shade`)
    const S = screen.getBoundingClientRect(), k = S.width / screen.offsetWidth || 1;
    const rect = id => { const c = screen.querySelector(`[data-mission-id="${id}"] .chip`); if (!c) return null; const r = c.getBoundingClientRect(); return {x: (r.left - S.left) / k, y: (r.top - S.top) / k, w: r.width / k, h: r.height / k}; };
    el.querySelectorAll('[data-for]').forEach(n => {
      const r = rect(n.dataset.for);
      if (!r) { n.style.visibility = 'hidden'; return; }
      n.style.visibility = ''; n.style.left = `${r.x + r.w + (Number(n.dataset.dx) || 14)}px`; n.style.top = `${r.y + r.h * (n.dataset.at === 'top' ? 0 : 0.5) + (Number(n.dataset.dy) || 0)}px`;
    });
  });
  return <div ref={root} className="sec-over">
    <div className="adx-quick-code sec-code" data-for={s.target} data-dx="11" data-at="top" data-dy="45" style={{opacity: s.code >= 0 ? 1 : 0, visibility: s.code >= 0 ? 'visible' : 'hidden'}} data-iq-target="code-panel">
      <header className="adx-code-header">{s.action} Personal Code<span>×</span></header>
      <div data-sec-dots={Math.max(0, s.code)}>{Array.from({length: 6}, (_, i) => <b key={i}><span className="sec-dot" data-sec-dot={i} style={{opacity: i < s.code ? 1 : 0}}>●</span></b>)}</div><PersonalCodeKeypad tabIndex={-1}/>
    </div>
    {s.zoom ? Object.entries(SCHEDULE).map(([id, list]) => <div className="sec-after" key={id} data-for={id} data-dx="18" style={{marginLeft: 0}}>
      <div className="sec-sched" style={{opacity: s.sched ? 1 : 0, transform: `scale(${s.sched ? 1 : 0.9})`}}>{list.map(text => <span key={text} className="ev2-schedule sec-pill"><CalendarIcon/>{text}</span>)}</div>
    </div>) : null}
  </div>;
}

// The team (the user, 2026-10-30: "put avatars on the right bottom corner, make them bigger, and remove the names", "move them down more like outside the frames of tablet", then, with a red rectangle
// drawn on the picture: "put it where the red rectangle I draw", "make them smaller", "sometimes they render behind the tablet"; then, 2026-11-03, with a green rectangle drawn on a picture of the video: "put these avatars to the left
// side of tablet"): three avatars (the three people of the picture: `TEAM`), no names, in a column at the left of the tablet, over its left edge. They are part of the TABLET's layer (`front` of TabletPart: over its whole frame, in its own px), so the video can never put them behind it (as a layer of their own they went behind
// the tablet of the slide that came in, while the one before faded out). The video fits the tablet to 1220 x 851 at (0, 25) (`tabletFit`), the tablet is 860 x 599.6 here: these are the places that give, in
// the video, 100 px avatars 8 px apart, 6 px from the picture's left edge (over the frame, which starts at x 44, and the screen's own edge: the cards of Open start at x 92, so they are not covered), the column ending at y 821, just inside the
// screen's bottom (it was a row at the bottom right, ending at x 1143 and centered on y 808). `y` is the top of place 0, places 1 to 3 are used. The first person is at the bottom, then the one over it.
const TEAM_AT = {x: 4.23, y: 262.22, size: 70.5, gap: 5.64};
// The person who claims or closes (`badge` 2, `who`) is the avatar of the team that goes to the mission, to its right edge, near its top (the user, 2026-10-30: "when claiming move the avatar to the right
// position of the mission"). Once the mission is claimed the avatar does not go back (the user, 2026-10-30: "they should get small and into the mission names position"): it gets small and sits on the card,
// where the performer is, and goes with the card, so the card has no performer of its own then. To close it goes to the mission's right edge again; closed, it is back in its place at the left of the tablet and the
// card has the name instead (the video does not fly it there: it fades out on the mission and in at its place, `fade` of the spec's `faces`). The same element all the way, so the video moves it. The mission's place is measured, as the personal code's is. While the code of a claim is open, its panel is over the card of
// the one who claimed before: that avatar fades as the panel comes (the avatars are over the whole tablet, the panel only over its screen).
const FLY = {size: 62, dx: -19, dy: 17};
// The row is a queue (`row`: who is in it, from the left; the user, 2026-10-30: "when an avatars leaves, the others take its place and when it come back, it goes to right and pushes the others on the left, and
// the one on the far left goes and claim the mission and so on"; the row is the column at the left since 2026-11-03, its left the top): the one at the top goes, the others close up `closeUp` of a place, and the one who comes back takes the end, the bottom, and pushes
// them the rest of the way. A whole place (the user, 2026-11-03: "when closing a mission, just fade in in left side don't go back with an animation"): the one who comes back fades in at the bottom, so the place has to be free
// for it, nothing is left to push. In places of the row (the last is `end`), as `TEAM_AT` counts them; a person who is not in `row` is at their place of the team.
const ROW = {seats: 3, end: 3, closeUp: 1};
const placeOf = (s, who, i) => { const at = s.row?.indexOf(who) ?? -1; return at < 0 ? ROW.end - i : ROW.end - (s.row.length - 1 - at) - (ROW.seats - s.row.length) * ROW.closeUp; }; // (it was `1 - closeUp`, which only gave half a place at 0.5)
const SCREEN = 1.03; // (the boards draw the tablet's screen this much bigger, about its middle, `defaultLooks` in lib/sections/captureCore.mjs; the avatars are not in the screen, so where they sit on a card is worked out with it)
function Team({s}) {
  const root = useRef(null), [at, setAt] = useState(null);
  useLayoutEffect(() => {
    const tablet = root.current?.closest('.adx-tablet');
    if (!tablet) return;
    const R = tablet.getBoundingClientRect(), k = R.width / (tablet.offsetWidth || 1) || 1;
    const box = selector => { const el = tablet.querySelector(selector), r = el?.getBoundingClientRect(); return r ? {left: (r.left - R.left) / k, top: (r.top - R.top) / k, width: r.width / k, height: r.height / k} : null; };
    const screen = box('.tbl-screen'), chip = box(`[data-mission-id="${s.target}"] .chip`), midX = screen.left + screen.width / 2, midY = screen.top + screen.height / 2;
    const seat = id => { const b = box(`[data-mission-id="${id}"] .chip-bottom`); return b && {left: midX + (b.left - midX) * SCREEN, top: midY + (b.top - midY) * SCREEN, size: b.height * SCREEN}; }; // (the card's bottom row is as tall as the performer's avatar and starts where it does)
    const next = {near: chip && {right: midX + (chip.left + chip.width - midX) * SCREEN, top: midY + (chip.top - midY) * SCREEN}, seats: Object.fromEntries(Object.keys(WHO).map(id => [id, seat(id)]))}; // (`near` with the screen's scale too: an avatar that carries a card stays at the same place on it from one column to the next)
    setAt(a => (JSON.stringify(a) === JSON.stringify(next) ? a : next));
  });
  return <div ref={root} className="sec-team">{TEAM.map((who, i) => {
    const mine = Object.keys(WHO).find(id => WHO[id] === who && s[id] === 'claimed'), working = s.badge === 2 && s.who === who; // (`mine`: the mission this person has on the go)
    const away = working && !!at?.near, seat = !working && mine ? at?.seats[mine] : null, on = away || !!seat || i < s.faces, covered = !!seat && s.code >= 0 && s.action === 'Claim';
    const size = away ? FLY.size : seat ? seat.size : TEAM_AT.size;
    const left = away ? at.near.right + FLY.dx : seat ? seat.left : TEAM_AT.x, top = away ? at.near.top + FLY.dy : seat ? seat.top : TEAM_AT.y + placeOf(s, who, i) * (TEAM_AT.size + TEAM_AT.gap);
    return <span key={who} data-iq-target={`face-${who}`} style={{left, top, width: size, height: size, opacity: on && !covered ? 1 : 0, transform: `scale(${on ? 1 : 0.4})`}}><img src={face(who).src} alt=""/></span>;
  })}</div>;
}

// ---- the two missions by themselves, out of the tablet (the user, 2026-11-04: "when we say Each Mission Has A Unique Schedule just isolate the two missions without tablet, so hide tablet, keep same two missions when saying
// Reward Points Can Be Added To Increase Motivation and Timers Change In Color To Create A Sense Of Urgency (change time of top one only)"; it replaces the tablet zoomed into for these scenes and the one mission of its own of 2026-11-03) ----
// The two the board has on top of its Open column, Inventory Check over Order Supplies, bigger, in the middle of the black at the left of the gray side (PANEL_EDGE / 2), their schedules beside them (`sched`), the points on both (`pts`).
// They are 'Isolated missions': the video lifts them out of the board the slide before has (`liftSpan` in components/storyboardPlayerDom.js puts the layer by its first card), so the second is where the board has its own only if it is as far
// under the first: a card of the board is 334 x 129 of its 1080 units, 18 under the one before (components/ReferenceBoard.css), and here too, at `PAIR.scale`. `pulse`: the top one's timer has run through the colors (the video draws them by the clock,
// `COLOR_RUN` in the spec; this is the last one); the other stays green. The same DOM in every state (the schedules are there at opacity 0): what changes glides.
const PAIR = {ids: ['inv', 'ord'], scale: 1.6, pitch: 129 + 18};
function Pair({s}) {
  const chips = PAIR.ids.map((id, i) => {
    const [, title, kind, points] = CARDS.find(c => c[0] === id);
    const after = <div className="sec-sched" style={{opacity: s.sched ? 1 : 0, transform: `scale(${s.sched ? 1 : 0.9})`}}>{SCHEDULE[id].map(text => <span key={text} className="ev2-schedule sec-pill"><CalendarIcon/>{text}</span>)}</div>;
    return card(`pair-${id}`, 0, i * PAIR.pitch * PAIR.scale, {kind, title, points: s.pts && POINTS.has(id) ? points : null, date: '07-14-26', time: '08:00 AM', pill: clock(AGE[id][0]), tone: i === 0 && s.pulse ? 'red' : 'green', tick: 'open'}, {scale: PAIR.scale, after});
  });
  return <FlowPart name="Isolated missions" chips={chips} middle={586}/>;
}

// ---- the three personal boards ----
// (the user's comment on the video, 2026-10-30: the action "4 missions", and on 2026-11-02: "it means 4 missions per phone": `phones` is how many each phone has, each new one under the others, its timer the shortest)
const PHONES = [{who: 'adam', list: ['Inventory Check', 'Order Supplies', 'Safety Check', 'Count The Cash Drawer']}, {who: 'ben', list: ['Prepare Workspace', 'Clean Break Room', 'Empty The Bins', 'Wipe Down Counters']}, {who: 'maya', list: ['Restock Front Desk', 'Review Team Updates', 'Check The Lights', 'Water The Plants']}];
function Phones({s}) {
  return <div className="sec-phones" data-sec-part="Board" style={{left: 11, top: 70, width: 1020, height: 760}}>
    {PHONES.map((p, i) => <div className="sec-phone-col" key={p.who} style={{left: i * 346}}>
      <img className="adx-avatar sec-face" src={face(p.who).src} alt="" data-iq-target={`face-${p.who}`}/>
      <div className="ph-fit adx-phone sec-phone-fit"><PhoneShell title="Personal Board" tabs={[{label: `Open - ${Math.min(s.phones, p.list.length)}`, active: true}, {label: 'Claimed - 0'}, {label: 'Closed - 0'}]}>
        {p.list.map((title, j) => <div className="es-phone-mission sec-phone-card" key={title} data-iq-target={`phone-${p.who}-${j}`} style={{opacity: s.phones > j ? 1 : 0, transform: `translateY(${s.phones > j ? 0 : 14}px) scale(${s.phones > j ? 1 : 0.92})`, height: s.phones > j ? 'auto' : 0, overflow: 'hidden'}}>
          <MissionChip title={title} points={[10, 15, 20, 15][j]} date="07-14-26" time="08:00 AM" pillTime={`00:0${5 - j}:10`}/></div>)}
      </PhoneShell></div>
    </div>)}
  </div>;
}

// ---- the picture of the three people (the user's comment on the video, 2026-10-30: "show photo of three people AI generated"; the CEO, 2026-10-28: "the picture will be like the tablet, the same space") ----
// The AI picture the user already had, three people looking at the Team Board on the wall (public/storyboard-art/three-people.jpg, scripts/generate-images.mjs `three-people`), in the boundaries of the tablet's frame as
// the video shows it (`tabletFit` and the frame's own shape in /tablet-frame.png: seen from 45, 44 to 1173, 856, with corners of 34 px, `.sec-photo`).
// `data-sec-land` (the user, 2026-11-02: "it's like u zoom in to the tablet then fade in our tablet with same boundries as tablet for the frame", then "I shouldn't see fully the tablet in ai image, I should see the tablet UI asap"): where the tablet
// on its wall is in that box, for the video's own tablet to come in on it as the picture is pushed in, and grow with it to the box (`landOn` in components/storyboardPlayerDom.js). It is seen from the side and looks squarer than ours, so it is said by
// its four corners. `WALL_TABLET`: the corners of its frame in the picture's px, top left first, clockwise, from lines fitted on its edges (the bottom right one is behind the head).
const PHOTO = {left: 45, top: 44, width: 1128, height: 812}, PICTURE = {w: 1536, h: 1024}, WALL_TABLET = [[879.2, 118.6], [1211.8, 84.4], [1212.4, 400.9], [880.7, 401.8]];
const COVER = Math.max(PHOTO.width / PICTURE.w, PHOTO.height / PICTURE.h), inBox = ([x, y]) => [(PHOTO.width - PICTURE.w * COVER) / 2 + x * COVER, (PHOTO.height - PICTURE.h * COVER) / 2 + y * COVER]; // (the picture is `object-fit: cover`)
const LAND = WALL_TABLET.flatMap(inBox).map(n => n.toFixed(2)).join(' ');
const Photo = () => <div className="sec-photo" data-sec-part="Board" data-sec-land={LAND} style={PHOTO}><img src="/storyboard-art/three-people.jpg" alt=""/></div>;

export default function EfficiencyStage({state}) {
  const s = {...EFFICIENCY_BASE, ...state};
  if (s.view === 'phones') return <Phones s={s}/>;
  if (s.view === 'photo') return <Photo/>;
  if (s.view === 'pair') return <Pair s={s}/>;
  return <TabletPart title="Team Board" missions={missionsOf(s)} zoom={ZOOM[s.zoom] ?? null} shade={s.zoom ? DIM : 0} overlay={<Over s={s}/>} front={<Team s={s}/>}/>;
}
