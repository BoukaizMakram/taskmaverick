'use client';
// The pieces the Training group's stages share (Automated Coaching, Reactive Training, Dynamic Testing: components/sections/CoachingStage.jsx, ReactiveStage.jsx, TestingStage.jsx).
// Their looks are in components/sections/automated-coaching.css (`sec-tr-*`), which every page that draws the sections' art loads (components/sections/sectionStyles.js).
//   Panel      the mission by itself ("Mission Details", the Improved Quality film's 360 x 573 screen shown at 1.5x: the same box and the same classes as MissionPanel in parts.jsx, so a
//              lesson screen of lib/storyboardLesson.mjs takes its place exactly), with what MissionPanel has no room for: a footer button (Close, Submit), any content as children
//              (questions with True / False, a single or a multiple choice, a photo), a language button.
//   Question   a question of a mission: yes / no, true / false side by side, or the options of a single (round) or a multiple (square) choice one under the other.
//   Photo      a photo attached to a checkpoint (the file name under it).
//   MediaMission  an opened Media mission: the product's own (OpenedMission's Media body), in the phone view's box
//   Layer      cards on their own (the product's mission card, as FlowPart in parts.jsx draws them) with the purple connectors, words on the plate and faces, placed by the stage
//              (not centered by measuring: `center` says whether the group is centered on the plate, x 521, y 450).
import {useLayoutEffect, useRef} from 'react';
import {IconBack} from '../PhoneShell';
import MissionChip from '../MissionChip';
import {OpenedMission} from '../OpenedMission';

const round = n => Math.round(n * 100) / 100;
export const slug = text => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>;
export const PhotoIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5h3.2l1.8-2.7h7l1.8 2.7h3.2v10.7h-17Z"/><circle cx="12" cy="13.5" r="3.4"/></svg>;

// ---- The mission by itself ----
// `scrollTo`: the data-iq-target at the top of the window under the pinned summary card ('<name>@bottom': just enough to see it whole at the window's bottom); `expand` 0 to 1: popped as its summary card in the middle, then opened (MissionPanel's own way).
// `footer`: {label, target, tone} the product's footer button (OpenedMission's om-footer / om-cta: 'primary' blue, 'closed' gray). `lang`: the language button's letters (null: none). `tone`: the Timer pill's color.
export function Panel({kind = 'Checklist', points = 25, title, location, who = 'Anna F', date = '09-23-26 08:00 AM', timer = '00:00:00', tone = 'green', exec = null, brief = null, scrollTo = 'top', expand = 1,
  scale = 1.5, left = 341, top = 163, height = 573, name = 'Mission', lang = null, footer = null, children}) {
  const panel = useRef(null);
  useLayoutEffect(() => {
    const box = panel.current, content = box.querySelector('.iq2-m-content'), win = box.querySelector('.iq2-m-window'), chip = box.querySelector('.iq2-m-summary');
    const [key, edge] = String(scrollTo).split('@'), el = key === 'top' ? null : content.querySelector(`[data-iq-target="${key}"]`), from = content.getBoundingClientRect().top;
    const k = content.getBoundingClientRect().height / content.offsetHeight || 1, max = Math.max(0, content.offsetHeight - win.clientHeight);
    // ('<name>@bottom': scrolled only as far as it takes for it to be seen whole at the window's bottom, what is over it staying in view: Reactive Training's audit, the user, 2026-10-21)
    const y = Math.min(max, Math.max(0, !el ? 0 : edge === 'bottom' ? (el.getBoundingClientRect().bottom - from) / k - win.clientHeight + 8 : (el.getBoundingClientRect().top - from) / k - chip.offsetHeight - 8));
    content.style.transform = `translateY(${-y}px)`; chip.style.transform = `translateY(${y}px)`;
    chip.style.boxShadow = y > 2 ? '0 10px 14px -10px rgb(21 39 54 / 30%)' : 'none';
    const H = box.offsetHeight, top0 = chip.offsetTop + win.offsetTop, bottom = top0 + chip.offsetHeight, shift = (H / 2 - (top0 + bottom) / 2) * (1 - expand);
    box.style.transform = `translateY(${shift * scale}px) scale(${scale})`;
    box.firstElementChild.style.clipPath = `inset(${round(top0 * (1 - expand))}px 0px ${round((H - bottom) * (1 - expand))}px 0px round ${14 + 4 * expand}px)`; // (an inset even when open, not none: the video moves a clip from one inset to another, a none it cannot)
  });
  return <div ref={panel} className="iq2-mission sec-tr-panel" data-sec-part={name} style={{left, top, width: 360, height, transform: `scale(${scale})`}}>
    <div className="iq2-m">
      <header className="iq2-m-head"><span className="iq2-m-back"><IconBack/></span><b>Mission Details</b>{lang && <span className="iq2-m-translate" data-iq-target="translate">{lang}</span>}</header>
      <div className="iq2-m-window" data-sec-window><div className="iq2-m-content">
        <section className="iq2-m-summary" data-iq-target="mission-chip">
          <div className="iq2-m-kind"><img src="/mission-logo.png" alt=""/><span>{kind}</span>{points != null && <b>{points}</b>}{exec && <span className="sec-tr-exec" data-iq-target="mission-exec">{exec}</span>}<em className={`sec-timer sec-timer--${tone}`} data-iq-target="mission-timer">{timer}</em></div>
          <h3>{title}</h3><small>{location}</small>
          <div className="iq2-m-meta"><span data-iq-target="mission-who">{who}</span><time>{date}</time></div>
        </section>
        {brief && <section className="iq2-m-brief">{brief.instructions && <p data-iq-target="instructions">{brief.instructions}</p>}{brief.alert && <div className="iq2-m-alert" data-iq-target="warning">{brief.alert}</div>}</section>}
        {children}
      </div></div>
      {footer && <div className="om-footer sec-tr-foot"><span className={`om-cta om-cta--${footer.tone ?? 'primary'}`} data-iq-target={footer.target}>{footer.label}</span></div>}
    </div>
  </div>;
}

// ---- An opened Media mission: the product's own (components/OpenedMission.jsx, its Media body: the lessons with their kind and length, the Estimated Time) ----
// In the phone view's box (the Improved Quality mission's: 360 x 573 at 1.5, in the middle of the plate), so the Improved Quality lesson screen the videos play when a lesson is tapped
// (lib/storyboardLesson.mjs: a chunk's `lesson`, a spec's `lessonTopics`) takes its place exactly. `rows`: [[id, kind, label, length]] (what the cursor presses is row-<id>, its tag
// tag-<id>); `pressed`: the row just tapped; `done`: the lessons done (a check in place of their length, as the product's lesson list has it); `expand` 0 to 1: popped as its summary
// card, then opened (MissionPanel's way); `language`: the letters of its translate button (null: none); `description`: the summary's text (a written lesson is its notice).
export function MediaMission({title, location, who = 'Anna F', date = '09-23-26', time = '08:00 AM', points = 5, pill = '00:03:15', exec = '00:00:05', description, rows, estimated, pressed = null, done = [], expand = 1, language = null, name = 'Mission'}) {
  const ref = useRef(null), scale = 1.5;
  const mission = {id: 'media', type: 'Media', points, title, location, date, time, pillTime: pill, pillClass: 'chip--green', postedBy: 'Posted by: J. Maverick', claimedWho: who, description, estimated,
    contents: rows.map(([id, kind, label, length], i) => ({n: i + 1, label, kind, meta: done.includes(id) ? '✓' : length}))};
  useLayoutEffect(() => {
    const box = ref.current, om = box.querySelector('.om'), card = om?.querySelector('.om-card');
    if (!om || !card) return;
    om.querySelectorAll('.om-mrow').forEach((row, i) => { // (what the cursor presses and the outlines go round)
      const id = rows[i]?.[0];
      row.setAttribute('data-iq-target', `row-${id}`); row.classList.toggle('is-pressed', pressed === id);
      row.querySelector('.om-mtag')?.setAttribute('data-iq-target', `tag-${id}`);
    });
    om.querySelector('.om-media-est-box')?.setAttribute('data-iq-target', 'estimate');
    om.querySelector('.om-translate')?.setAttribute('data-iq-target', 'translate');
    om.querySelector('.om-sum-desc')?.setAttribute('data-iq-target', 'description');
    card.setAttribute('data-iq-target', 'mission-chip');
    const H = box.offsetHeight, top = card.offsetTop, bottom = top + card.offsetHeight, shift = (H / 2 - (top + bottom) / 2) * (1 - expand);
    box.style.transform = `translateY(${round(shift * scale)}px) scale(${scale})`;
    box.firstElementChild.style.clipPath = `inset(${round(top * (1 - expand))}px 0px ${round((H - bottom) * (1 - expand))}px 0px round ${14 + 4 * expand}px)`; // (an inset even when open: the video moves one inset to another)
  });
  return <div ref={ref} className="iq2-mission sec-co-om" data-sec-part={name} style={{left: 341, top: 163, width: 360, height: 573, transform: `scale(${scale})`}}>
    <div className="sec-co-om-clip">
      <OpenedMission mission={mission} state="claimed" showExec execTime={exec} showStatusBar={false} translation={language ? {language, label: 'Translate'} : undefined}/>
    </div>
  </div>;
}

// ---- A question ----
// `kind`: 'pair' (two options side by side: Yes / No, True / False), 'single' (round marks, one under the other), 'multi' (square marks). `answer`: the index picked, or a list of them (multi).
// What the cursor presses is <id>-<the option's slug> (q1-true, mood-stressful). `marks`: {index: 'wrong' | 'right'} a picked option shown as scored (a test once it is sent).
export function Question({id, n, q, hint = null, kind = 'pair', options, answer = null, children = null}) {
  const picked = o => (Array.isArray(answer) ? answer.includes(o) : answer === o);
  return <section className="iq2-m-cp sec-tr-q" data-iq-target={`cp-${id}`}>
    <b>{n}. {q}</b>{hint && <small className="sec-tr-hint">{hint}</small>}
    <div className={`sec-tr-opts sec-tr-opts--${kind}`}>
      {options.map((label, o) => <span key={label} role={kind === 'multi' ? 'checkbox' : 'radio'} aria-checked={picked(o)} className={`sec-tr-opt${picked(o) ? ' is-selected' : ''}${/^(no|fail)$/i.test(label) ? ' is-negative' : ''}`} data-iq-target={`${id}-${slug(label)}`}>
        <i className={`sec-tr-mark sec-tr-mark--${kind === 'single' ? 'round' : 'square'}`} aria-hidden="true">{kind !== 'single' && <Check/>}</i>{label}
      </span>)}
    </div>
    {children}
  </section>;
}

// ---- A photo attached to a checkpoint ----
export function Photo({id, src, file}) {
  return <div className="iq2-m-proof" data-iq-target={`photo-proof-${id}`}>
    <div className="iq2-m-frame iq2-m-shot" style={{backgroundImage: `url('${src}')`}}/>
    <div className="iq2-m-file"><PhotoIcon/><span>{file}</span></div>
  </div>;
}

// ---- Cards on their own ----
// chips  [{id, x, y, mission: {kind, title, who, avatar, exec, pill, tone, points, date, time}, scale, opacity}]: the product's card (the names <id>, <id>-who, -pill, -title, -kind)
// lines  [{id, d | from, to, arrow, opacity}]: purple connectors (stage px)
// labels [{id, x, y, text, opacity, kind}]: words on the plate (not the product's): white ('label'), or dark ('dark': where an outline goes round them)
// faces  [{id, x, y, src, name, note, size, opacity}]: a person (the hexagon avatar, the name under it, a note under that)
export const PURPLE = '#7b3cf0';
const named = x => ((x.opacity ?? 1) > 0 ? x.id : undefined); // (what is not seen yet has no name: an outline or the cursor that points never goes to it)
export function Layer({chips = [], lines = [], labels = [], faces = [], name = 'Layer', center = false}) {
  const root = useRef(null);
  const empty = !chips.length && !lines.length && !labels.length && !faces.length;
  useLayoutEffect(() => { // (centered on the plate as one group, as FlowPart does, when `center`)
    const el = root.current, inner = el?.querySelector('.sec-flow-inner');
    if (!inner) return;
    inner.style.transform = 'none';
    if (!center) return;
    const K = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
    let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
    for (const n of inner.querySelectorAll('.chip, .sec-flow-lines > path, .sec-tr-label, .sec-tr-face')) { const r = n.getBoundingClientRect(); if (r.width < 2 && r.height < 2) continue; L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); }
    if (!isFinite(L)) return;
    const o = el.getBoundingClientRect(), dx = 521 - ((L + R) / 2 - o.left) / K, dy = 450 - ((T + B) / 2 - o.top) / K;
    inner.style.transform = `translate(${Math.round(dx * 10) / 10}px, ${Math.round(dy * 10) / 10}px)`;
  });
  useLayoutEffect(() => {
    root.current?.querySelectorAll('.sec-chip').forEach(el => {
      const id = el.dataset.secChip, chip = el.querySelector('.chip');
      chip?.setAttribute('data-iq-target', id);
      for (const [cls, key] of [['chip-exec', 'exec'], ['chip-who', 'who'], ['chip-performer-avatar', 'who'], ['chip-pill', 'pill'], ['chip-title', 'title'], ['chip-kind', 'kind']]) el.querySelector(`.${cls}`)?.setAttribute('data-iq-target', `${id}-${key}`);
    });
  });
  if (empty) return null;
  return <div ref={root} className="iq2-iso-layer sec-flow" data-sec-part={name} style={{width: 1600, height: 900}}>
    <div className="sec-flow-inner" style={{position: 'absolute', inset: 0}}>
      <svg className="sec-flow-lines" width="1" height="1" style={{overflow: 'visible'}} aria-hidden="true">
        <defs><marker id="sec-tr-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
        {lines.map((l, i) => <path key={l.id ?? i} d={l.d ?? `M${l.from[0]} ${l.from[1]}${l.via ? ` L${l.via[0]} ${l.via[1]}` : ''} L${l.to[0]} ${l.to[1]}`} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd={l.arrow === false ? undefined : 'url(#sec-tr-arrow)'} style={{opacity: l.opacity ?? 1}} data-iq-target={l.id}/>)}
      </svg>
      {faces.map(f => <div key={f.id} className="sec-tr-face" data-iq-target={named(f)} style={{left: f.x, top: f.y, width: f.size ?? 96, opacity: f.opacity ?? 1}}>
        <img className="adx-avatar" src={f.src} alt="" style={{width: f.size ?? 96, height: f.size ?? 96}}/><b>{f.name}</b>{f.note && <small data-iq-target={named(f) && `${f.id}-note`}>{f.note}</small>}
      </div>)}
      {chips.map(c => {
        const m = c.mission;
        return <div key={c.id} className="mi-interactive mi-interactive--tablet mi-reference iq2-iso sec-chip" data-sec-chip={c.id} style={{position: 'absolute', left: c.x, top: c.y, transform: `scale(${c.scale ?? 1.2})`, transformOrigin: '0 0', opacity: c.opacity ?? 1}}><div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: 334}}>
          <MissionChip kind={m.kind} points={m.points ?? null} title={m.title} who={m.who} avatar={m.avatar} date={m.date ?? '09-23-26'} time={m.time ?? '08:00 AM'} showExec={m.exec != null} execTime={m.exec} pillTime={m.pill ?? '00:00:00'} pillClass={`chip--${m.tone ?? 'green'}`}/>
        </div></div></div>;
      })}
      {labels.map((l, i) => <span key={l.id ?? i} className={`sec-tr-label sec-tr-label--${l.kind ?? 'label'}`} data-iq-target={named(l)} style={{left: l.x, top: l.y, opacity: l.opacity ?? 1}}>{l.text}</span>)}
    </div>
  </div>;
}
