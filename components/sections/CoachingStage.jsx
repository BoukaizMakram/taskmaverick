'use client';
// Automated Coaching's art for the section videos (lib/sections/automated-coaching.mjs), drawn from a state given as data. Only the product's own screens (the user, 2026-10-20: no invented UI):
//   phones    three personal boards (Anna F, Ben R, Carla M: PhoneShell, MissionChip) the micro-lessons are posted to, 4, 2 and 3 of them (`posted`: how many have arrived on each)
//   lesson    the micro-lesson opened: the product's opened Media mission (OpenedMission, its Media body: a video 00:45, a text read aloud 00:38, a quiz, the Estimated Time), with its
//             translate button; a lesson tapped plays as the Improved Quality lesson screen in the videos (the spec's `lesson` / `lessonTopics`, lib/storyboardLesson.mjs)
//   timeline  the web app's Overview, Personal Board, Timeline over 31 days, grouped by person (Precision Planning's look, components/sections/PlanningStage.jsx): a person, their group of
//             lessons (its count, its lessons a day in orange), the lessons; Ben R's Sexual Harassment, posted on the 1st of every month
// Every piece keeps the same DOM in all its states (what is not there is folded or faded), so the video moves from one state to the next.
import {useRef} from 'react';
import {useCenter} from './parts';
import {MediaMission} from './trainingParts';
import PhoneShell from '../PhoneShell';
import MissionChip from '../MissionChip';
import {NAV} from '../DataReport';
import {BOARDS, VIEWS} from '@/lib/overviewModel.mjs';
import './automated-coaching.css';

export const COACHING_BASE = {view: 'phones', posted: 0, expand: 1, pressed: null, done: [], lang: 'en', focus: null, pan: 0, ben: false};

// ---- the three personal boards ----
const PEOPLE = {anna: {name: 'Anna F', src: '/avatars/02.png'}, ben: {name: 'Ben R', src: '/avatars/03.png'}, carla: {name: 'Carla M', src: '/avatars/04.png'}};
const PHONES = [['anna', ['Stock Shelving', 'Hand Washing', 'Safe Lifting', 'Allergen Awareness']], ['ben', ['Knife Safety', 'Stock Shelving']], ['carla', ['Spill Cleanup', 'Stock Shelving', 'Fire Safety']]];
const age = (j, n) => `00:00:${String(4 * (n - 1 - j)).padStart(2, '0')}`; // (the first lesson posted is the oldest: its Timer the longest)
function Phones({s}) {
  return <div className="sec-phones" data-sec-part="Board" style={{left: 11, top: 70, width: 1020, height: 760}}>
    {PHONES.map(([who, list], i) => {
      const shown = Math.min(s.posted, list.length);
      return <div className="sec-phone-col" key={who} style={{left: i * 360}}>
        <img className="adx-avatar sec-face" src={PEOPLE[who].src} alt="" data-iq-target={`face-${who}`}/>
        <div className="ph-fit adx-phone sec-phone-fit"><PhoneShell title="Personal Board" tabs={[{label: `Open - ${shown}`, active: true}, {label: 'Claimed - 0'}, {label: 'Closed - 0'}]}>
          {list.map((title, j) => <div className="iq2-reveal sec-co-slot" key={title} style={{gridTemplateRows: `${j < shown ? 1 : 0}fr`, opacity: j < shown ? 1 : 0}}><div>
            <div className="es-phone-mission sec-phone-card" data-iq-target={j < shown ? `phone-${who}-${j}` : undefined}><MissionChip kind="Media" title={title} points={5} date="09-23-26" time="08:00 AM" pillTime={age(j, shown)}/></div>
          </div></div>)}
        </PhoneShell></div>
      </div>;
    })}
  </div>;
}

// ---- the micro-lesson opened: the product's opened Media mission (components/OpenedMission.jsx, its Media body: the lessons with their kind and length, the Estimated Time) ----
// (MediaMission, components/sections/trainingParts.jsx.) `pressed`: the lesson row just tapped; `done`: the lessons watched; `lang`: en or es (the mission's translate button).
const WORDS = {
  en: {title: 'Stock Shelving', location: 'Kitchen / Training', description: 'Watch each lesson, then take the quiz.', rows: ['Shelving Standards', 'Storage Rules', 'Quiz']},
  es: {title: 'Colocación en estantes', location: 'Cocina / Capacitación', description: 'Mire cada lección y luego haga la prueba.', rows: ['Normas de estantería', 'Reglas de almacenamiento', 'Prueba']},
};
const ROWS = [['video', 'video', '00:45'], ['text', 'audio', '00:38'], ['quiz', 'quiz', 'N/A']];
function LessonMission({s}) {
  const W = WORDS[s.lang] ?? WORDS.en;
  return <MediaMission title={W.title} location={W.location} description={W.description} estimated="01:23" rows={ROWS.map(([id, kind, length], i) => [id, kind, W.rows[i], length])}
    pressed={s.pressed} done={s.done} expand={s.expand} language={s.lang === 'es' ? 'EN' : 'ES'}/>;
}

// ---- the web app's Overview, Personal Board, Timeline over 31 days, grouped by person (Precision Planning's look, components/sections/PlanningStage.jsx: the product's own) ----
// A person (level 1), their group of lessons (level 2: how many lessons it holds, and in orange how many fall on each day) and the lessons (level 3: a count on each day one is posted).
// Ben R's group opens to show Sexual Harassment, posted on the 1st of every month. Every row is always in the page, what is closed is folded (the page moves from one state to the next).
const DAYS = Array.from({length: 31}, (_, i) => { const d = new Date(2026, 8, 1 + i); return {key: i + 1, date: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`, day: d.toDateString().slice(0, 3)}; });
const COL = 38, NAME = 250, POS = 110, HEAD = 46, ROW = 38, PAGE = NAME + POS + DAYS.length * COL + 24;
const LESSONS = { // the lessons of each person's group, on the days they are posted (1 = 09/01, 31 = 10/01)
  anna: [['shelving', 'Stock Shelving', [1, 8, 15, 22, 29]], ['washing', 'Hand Washing', [2, 9, 16, 23, 30]], ['lifting', 'Safe Lifting', [3, 10, 17, 24, 31]], ['allergen', 'Allergen Awareness', [1, 4, 11, 18, 25]]],
  ben: [['knife', 'Knife Safety', [2, 9, 16, 23, 30]], ['shelving-ben', 'Stock Shelving', [5, 12, 19, 26]], ['harassment', 'Sexual Harassment', [1, 31]]],
};
const STAFF = [['anna', 'Anna F', 'Server'], ['ben', 'Ben R', 'Cook'], ['carla', 'Carla M', 'Server'], ['leo', 'Leo T', 'Cook'], ['dan', 'Dan K', 'Host']];
const perDay = days => DAYS.map(d => days.filter(x => x === d.key).length);
const groupDays = lessons => DAYS.map((_, i) => lessons.reduce((n, [, , days]) => n + perDay(days)[i], 0));
const count = n => (n ? <b>{n}</b> : <small>0</small>);
const Toggle = ({open, target}) => <span className={`sec-pl-toggle${open ? '' : ' is-closed'}`} aria-hidden="true" data-iq-target={target}><svg viewBox="0 0 16 16"><path d="m4.2 6.2 3.8 3.8 3.8-3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
const Kebab = () => <svg className="sec-pl-kebab" viewBox="0 0 6 20" aria-hidden="true"><circle cx="3" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/></svg>;
const Clip = () => <svg className="sec-pl-clip" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.2 4.6v9.6c0 .5.4.9.9.9h7.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 .9h5.3L13.8 4.4v8.1c0 .5-.4.9-.9.9H5.9c-.5 0-.9-.4-.9-.9z" fill="currentColor"/><path d="M10.1 1v3.6h3.6" fill="none" stroke="#fff" strokeWidth=".9" strokeLinejoin="round"/></svg>;
const Plane = () => <i className="sec-pl-bulk" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18.5 5.5 4.8 11l5 1.9 1.9 5z" fill="#fff"/><path d="m9.8 12.9 8.7-7.4" stroke="#1271b7" strokeWidth="1.3" strokeLinecap="round"/></svg></i>;
const Ic = ({d, sw = 1.7, cls = 'sec-pl-ic'}) => <svg className={cls} viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ICON = {
  bell: 'M18 8.5a6 6 0 0 0-12 0v5.2L4.4 16.5h15.2L18 13.7zM9.8 19.2a2.3 2.3 0 0 0 4.4 0', funnel: 'M4 5h16l-6.3 7.2v5.3l-3.4 2v-7.3z', list: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  tree: 'M2.5 10.2h4.2v4.2H2.5zM15.8 3h4.2v4.2h-4.2zM15.8 10.2h4.2v4.2h-4.2zM15.8 17.4h4.2v4.2h-4.2zM6.7 12.3h4.6M11.3 5.1v14.4M11.3 5.1h4.5M11.3 19.5h4.5M11.3 12.3h4.5', cloud: 'M7.5 17.5H7a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.4 10a3.6 3.6 0 0 1-.9 7.1M12 12.5v8.5M9 18l3 3 3-3',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 6.8V12h5.2', left: 'm14.5 6-6 6 6 6', right: 'm9.5 6 6 6-6 6', down: 'm6 9 6 6 6-6', sort: 'M12 19.5v-15M6.5 10l5.5-5.5 5.5 5.5',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
};
// the tree's lines (PlanningStage's): the middle of a level-1 toggle, of a level-2 toggle, where a branch ends
const X1 = 20, X2 = 37, END2 = 29, END3 = 52;
const Lines = ({pipes = [], elbow, down}) => <>
  {pipes.map(x => <i key={x} className="sec-pl-pipe" style={{left: x}}/>)}
  {elbow && <i className="sec-pl-elbow" style={{left: elbow[0], width: elbow[1] - elbow[0]}}/>}
  {down != null && <i className="sec-pl-down" style={{left: down}}/>}
</>;
const Reveal = ({open, children}) => <div className="iq2-reveal" style={{gridTemplateRows: `${open ? 1 : 0}fr`, opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden'}}><div>{children}</div></div>;
const Pick = ({id, from, to = from, top, height}) => <i className="sec-co-pick" data-iq-target={id} style={{left: NAME + POS + (from - 1) * COL, width: (to - from + 1) * COL, top, height}}/>; // (a part of the table the outlines go round: a date and its numbers, a stretch of days)
function Person({index, id, name, open, last}) {
  const lessons = LESSONS[id] ?? [], total = lessons.reduce((n, [, , days]) => n + days.length, 0);
  return <div className="sec-block" data-iq-target={`person-${id}`}>
    <div className={`sec-pl-row is-unit${open ? ' is-open' : ''}`} data-iq-target={`row-${id}`}>
      <span className="sec-pl-name"><Lines down={X1}/><Toggle open={open} target={`toggle-${id}`}/><em>{index}.</em><b>{name}</b><small>{lessons.length ? 1 : 0}</small></span>
      <span className="sec-pl-pos"/><span className="sec-pl-hours sec-co-days">{DAYS.map(d => <i key={d.key}/>)}</span>
    </div>
    {lessons.length > 0 && <Reveal open={open}>
      <div className="sec-pl-row is-team is-open" data-iq-target={`group-${id}`}>
        <span className="sec-pl-name"><Lines pipes={last ? [] : [X1]} elbow={[X1, END2]} down={X2}/><Toggle open/><em>1.</em><b>Micro-Lessons</b><small data-iq-target={`total-${id}`}>{total}</small><Clip/></span>
        <span className="sec-pl-pos"/>
        <span className="sec-pl-hours sec-co-days" data-iq-target={`days-${id}`}>{groupDays(lessons).map((n, i) => <i key={i}>{count(n)}</i>)}</span>
        <Pick id={`${id}-right`} from={16} to={31} top={0} height={ROW}/><Pick id={`${id}-left`} from={1} to={15} top={0} height={ROW}/>
      </div>
      {lessons.map(([key, title, days], j) => <div key={key} className="sec-pl-row is-mission" data-iq-target={`lesson-${key}`}>
        <span className="sec-pl-name"><Lines pipes={[...(last ? [] : [X1]), ...(j === lessons.length - 1 ? [] : [X2])]} elbow={[X2, END3]}/><em>{j + 1}.</em><span className="sec-pl-title">{title}</span><Kebab/></span>
        <span className="sec-pl-pos"><i className="sec-pl-tag">{STAFF.find(p => p[0] === id)[2]}</i></span>
        <span className="sec-pl-hours sec-co-days">{perDay(days).map((n, i) => <i key={i} data-iq-target={n ? `${key}-${i + 1}` : undefined}>{count(n)}</i>)}</span>
      </div>)}
    </Reveal>}
  </div>;
}
function Timeline({s}) {
  const win = useRef(null);
  useCenter(win, {focus: s.focus, pan: s.pan});
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: `translateX(${-s.pan}px)`, height: 776, width: PAGE}}><div className="iq-ol-page">
      <div className="ow-workspace iq-ow sec-pl sec-co-tl" aria-label="Taskmaverick web: Overview, Personal Board, Timeline">
        <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span>
          <nav>{NAV.map(n => <span key={n} className={n === 'Overview' ? 'is-active' : undefined}>{n}</span>)}</nav>
          <div className="ow-account"><span className="ow-icon-button"><Ic d={ICON.bell} cls="ow-icon"/></span><span className="ow-icon-button"><Ic d={ICON.gear} cls="ow-icon" sw={1.6}/></span><span className="ow-avatar">JM</span></div>
        </header>
        <div className="ow-subnav"><nav>{BOARDS.map(n => <span key={n} className={n === 'Personal Board' ? 'is-active' : undefined}>{n}</span>)}</nav><nav className="ow-view-nav">{VIEWS.map(n => <span key={n} className={n === 'Timeline' ? 'is-active' : undefined}>{n}</span>)}</nav></div>
        <div className="ow-toolbar">
          <span className="ow-tool"><Plane/>Bulk Action<Ic d={ICON.down} cls="sec-pl-caret"/></span>
          <span className="ow-tool"><Ic d={ICON.funnel} cls="sec-pl-ic is-orange" sw={2}/>Filter: New Filter</span>
          <span className="ow-tool"><Ic d={ICON.list} sw={1.8}/>Group by: Person</span>
          <span className="ow-tool"><Ic d={ICON.tree} sw={1.6}/>Expand/Collapse</span>
          <span className="ow-tool"><Ic d={ICON.cloud} sw={1.6}/>Export</span>
          <span className="ow-check"><i className="sec-pl-check"/>Idle</span>
          <span className="sec-pl-time">
            <span className="sec-pl-btn is-hours"><Ic d={ICON.clock}/>12 AM - 12 AM</span>
            <span className="sec-pl-span">1D</span><span className="sec-pl-span">7D</span><span className="sec-pl-span is-active">31D</span>
            <span className="sec-pl-btn is-arrow"><Ic d={ICON.left}/></span><span className="sec-pl-btn is-date" data-iq-target="period">09/01/2026 – 10/01/2026</span><span className="sec-pl-btn is-arrow"><Ic d={ICON.right}/></span>
          </span>
        </div>
        <div className="sec-pl-table sec-co-table">
          <div className="sec-pl-row is-head">
            <span className="sec-pl-name"><b>Name</b><Ic d={ICON.sort} cls="sec-pl-sort" sw={1.8}/><Kebab/></span>
            <span className="sec-pl-pos"><b>Positions</b><Kebab/></span>
            <span className="sec-pl-hours sec-co-days">{DAYS.map(d => <i key={d.key} data-iq-target={`day-${d.key}`}>{d.date}<small>{d.day}</small></i>)}</span>
          </div>
          <div className="sec-co-rows">
            {STAFF.map(([id, name], i) => <Person key={id} index={i + 1} id={id} name={name} open={id === 'anna' || (id === 'ben' && s.ben)} last={i === STAFF.length - 1}/>)}
          </div>
          <Pick id="pick-1" from={1} top={0} height={HEAD + 2 * ROW}/>
          <Pick id="pick-2" from={9} top={0} height={HEAD + 2 * ROW}/>
        </div>
      </div>
    </div></div>
  </div>;
}

export default function CoachingStage({state}) {
  const s = {...COACHING_BASE, ...state};
  if (s.view === 'lesson') return <LessonMission s={s}/>;
  if (s.view === 'timeline') return <Timeline s={s}/>;
  return <Phones s={s}/>;
}
