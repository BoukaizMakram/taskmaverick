'use client';

// ---------------------------------------------------------------------------
// OpenedMission — the phone "Mission Details" (opened mission) view, one shell
// that renders every mission type: Task, Checklist, Media, Survey, Test, Audit.
// It reuses the phone device bezel (.ph-fit / .ph-phone / .ph-screen) and the
// shared timer pill/points/logo (.chip-*) so timers animate identically to the
// board chips. Type-specific bodies are small, reusable primitives below.
//
// Lifecycle (docs/mission-animation.md): a mission is OPENED (brief: summary +
// notice, "Claim" button) -> CLAIMED (deeper content appears — the type body;
// the claimer name + Execution timer show; the button becomes "Close") ->
// CLOSED (the mission moves to the Closed column; the pill snaps GRAY and both
// timers freeze). The green pill counts UP in real time throughout Open/Claimed.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import MissionEntries, { entriesComplete } from './MissionEntries';
import MediaTraining, { mediaComplete } from './MediaTraining';
import { OPENED_MISSIONS } from '@/lib/openedMissions';

const RUN = 3600; // run timers as a long real-time stopwatch (no visible reset)
const CLOSED_GRAY = '#686f76';

// ---- time helpers (shared with the board timer rules) ----
const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
const parse = (t) => {
  const [h = 0, m = 0, s = 0] = String(t).split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

// ---- generic inline icons (allowed per CLAUDE.md) ----
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconBack = () => (<svg viewBox="0 0 22 22"><path d="M16 11H6.5M10.5 6 5.5 11l5 5" {...stroke} /></svg>);
const IconPlus = () => (<svg viewBox="0 0 18 18"><path d="M9 3.5v11M3.5 9h11" {...stroke} /></svg>);
const IconMenu = () => (<svg viewBox="0 0 18 18"><path d="M3.5 5.5h11M3.5 9h11M3.5 12.5h11" {...stroke} /></svg>);
const IconClose = () => (<svg viewBox="0 0 18 18"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" {...stroke} /></svg>);
const IconUndo = () => (<svg viewBox="0 0 18 18"><path d="M6 6H11a4 4 0 0 1 0 8H5M6 6 3.5 3.5M6 6 3.5 8.5" {...stroke} /></svg>);
const IconChevDown = () => (<svg viewBox="0 0 12 12"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IconChevRight = () => (<svg viewBox="0 0 12 12"><path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="#1271b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IconCheckSm = ({ color = '#fff' }) => (<svg viewBox="0 0 14 14"><path d="M3 7.3 6 10l5-6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IconCollapseAll = () => (
  <svg viewBox="0 0 18 18" width="16" height="16"><path d="M6 6.5 9 3.5 12 6.5M12 11.5 9 14.5 6 11.5" fill="none" stroke="#1271b7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

function StatusIcons() {
  return (
    <span className="ph-status-icons" aria-hidden="true">
      <svg width="18" height="12" viewBox="0 0 18 12">
        <rect x="0" y="8" width="3" height="4" rx="1" fill="#000" />
        <rect x="5" y="5" width="3" height="7" rx="1" fill="#000" />
        <rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#000" />
        <rect x="15" y="0" width="3" height="12" rx="1" fill="#000" />
      </svg>
      <svg width="17" height="12" viewBox="0 0 17 12">
        <path d="M8.5 3.2c2.2 0 4.2.8 5.7 2.2l1.4-1.5A10 10 0 0 0 8.5 1 10 10 0 0 0 1.4 3.9l1.4 1.5A8 8 0 0 1 8.5 3.2z" fill="#000" />
        <path d="M8.5 6.6c1.3 0 2.5.5 3.4 1.4l1.4-1.5a7 7 0 0 0-9.6 0l1.4 1.5A4.8 4.8 0 0 1 8.5 6.6z" fill="#000" />
        <circle cx="8.5" cy="10" r="1.8" fill="#000" />
      </svg>
      <svg width="26" height="13" viewBox="0 0 26 13">
        <rect x="0.6" y="0.6" width="22" height="11.8" rx="3" fill="none" stroke="#000" strokeOpacity="0.4" />
        <rect x="2" y="2" width="18" height="9" rx="1.6" fill="#000" />
        <rect x="23.4" y="4" width="1.8" height="5" rx="0.9" fill="#000" fillOpacity="0.4" />
      </svg>
    </span>
  );
}

// =====================  reusable body primitives  =====================

// The "# [value]" numeric input used by checklist items (FilledNew).
function NumberInput({ value, tone }) {
  return (
    <span className={`om-num${tone ? ` om-num--${tone}` : ''}`}>
      <span className="om-num-hash">#</span>
      <span className="om-num-val">{value}</span>
    </span>
  );
}

function GroupStatus({ done, total }) {
  const complete = total != null && done === total;
  return (
    <span className="om-grp-status">
      {complete ? (
        <span className="om-check-circle" aria-hidden="true"><IconCheckSm /></span>
      ) : (
        <span className="om-dash-circle" aria-hidden="true" />
      )}
      {total != null ? <b>{done}/{total}</b> : null}
    </span>
  );
}

// A collapsible group card (checklist). Collapsed groups render as a bare divider
// row with a right-chevron (no card, no children).
function CollapseGroup({ title, done, total, tone, collapsed, titleSize = 18, children }) {
  if (collapsed) {
    return (
      <div className="om-grp-row">
        <span className="om-exp om-exp--collapsed" aria-hidden="true"><IconChevRight /></span>
        <span className="om-grp-title" style={{ fontSize: titleSize }}>{title}</span>
        <GroupStatus done={done} total={total} />
      </div>
    );
  }
  return (
    <div className={`om-grp${tone ? ` om-grp--${tone}` : ''}`}>
      <div className="om-grp-head">
        <span className="om-exp" aria-hidden="true"><IconChevDown /></span>
        <span className="om-grp-title" style={{ fontSize: titleSize }}>{title}</span>
        {total != null || done != null ? <GroupStatus done={done} total={total} /> : <span />}
      </div>
      {children}
    </div>
  );
}

function ChecklistItem({ n, label, value, tone }) {
  return (
    <div className="om-item">
      <span className="om-item-label"><b>{n}.</b> {label}</span>
      <NumberInput value={value} tone={tone} />
    </div>
  );
}

// A checkbox glyph. tone: 'off' (empty), 'blue', 'gray', 'red' (filled + check).
function Checkbox({ tone = 'off' }) {
  return (
    <span className={`om-cb om-cb--${tone}`} aria-hidden="true">
      {tone !== 'off' ? <IconCheckSm /> : null}
    </span>
  );
}

function Radio({ selected }) {
  return <span className={`om-radio${selected ? ' is-on' : ''}`} aria-hidden="true" />;
}

// A boxed Yes / No / N-A option (Audit / Survey). state: undefined | 'on' | 'no'.
function OptionBox({ label, state }) {
  const tone = state === 'on' ? 'gray' : state === 'no' ? 'red' : 'off';
  return (
    <span className={`om-opt${state === 'no' ? ' om-opt--no' : ''}`}>
      <Checkbox tone={tone} />
      <span className="om-opt-label">{label}</span>
    </span>
  );
}

function ChoiceRow({ label, selected, single }) {
  return (
    <div className="om-choice">
      {single ? <Radio selected={selected} /> : <Checkbox tone={selected ? 'blue' : 'off'} />}
      <span className="om-choice-label">{label}</span>
    </div>
  );
}

// A media playlist row (real Figma tag: colored icon well + duration/"n/a").
const MEDIA_ICON = { audio: 'media-audio', quiz: 'media-quiz', illustration: 'media-image', video: 'media-video' };
function MediaRow({ n, label, kind, meta }) {
  return (
    <div className="om-mrow">
      <span className="om-mrow-n">{n ? `${n}.` : ''}</span>
      <span className="om-mrow-title">{label}</span>
      <span className={`om-mtag om-mtag--${kind}`}>
        <span className="om-mtag-ico" aria-hidden="true">
          <img src={`/mission-icons/${MEDIA_ICON[kind]}.svg`} alt="" />
        </span>
        <span className="om-mtag-meta">{meta}</span>
      </span>
    </div>
  );
}

function TestQuestion({ n, label, status }) {
  return (
    <div className="om-tq">
      <span className="om-tq-label"><b>{n}.</b> {label}</span>
      <span className={`om-tq-status${status ? ` is-${status}` : ''}`} aria-hidden="true">
        {status === 'ok' ? <IconCheckSm color="#fff" /> : null}
      </span>
    </div>
  );
}

function AttachSlot({ label, count }) {
  return (
    <span className="om-attach">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
      {label} <b>{count}</b>
    </span>
  );
}

// =====================  type bodies (the "deep" content)  =====================

function ChecklistBody({ mission }) {
  return (
    <div className="om-checklist">
      <div className="om-section-title">
        <span>{mission.sectionTitle}</span>
        <span className="om-collapse-all"><IconCollapseAll /> Collapse All</span>
      </div>
      {mission.groups.map((g, i) => (
        <CollapseGroup key={i} title={g.title} done={g.done} total={g.total} tone={g.tone} collapsed={g.collapsed}>
          {g.items?.map((it) => (
            <ChecklistItem key={it.n} n={it.n} label={it.label} value={it.value} tone={g.tone} />
          ))}
        </CollapseGroup>
      ))}
    </div>
  );
}

function MediaBody({ mission }) {
  return (
    <div className="om-media">
      {mission.contents.map((c, i) => (
        <MediaRow key={i} n={c.n} label={c.label} kind={c.kind} meta={c.meta} />
      ))}
      <div className="om-media-est">
        <span>Estimated Time ~</span>
        <span className="om-media-est-box">{mission.estimated}</span>
      </div>
    </div>
  );
}

function QuestionsBody({ mission }) {
  return (
    <div className="om-questions">
      {mission.intro ? <p className="om-q-intro">{mission.intro}</p> : null}
      {mission.questions.map((q, i) => (
        <div className="om-q" key={i}>
          <p className="om-q-prompt"><b>{i + 1}.</b> {q.prompt}</p>
          {q.hint ? <p className="om-q-hint">{q.hint}</p> : null}

          {q.kind === 'yesno' && (
            <div className="om-opts">
              {q.options.map((o, j) => (
                <OptionBox key={j} label={o.label} state={o.state} />
              ))}
            </div>
          )}

          {q.kind === 'multi' && (
            <div className="om-choices">
              {q.options.map((o, j) => (
                <ChoiceRow key={j} label={o.label} selected={o.selected} />
              ))}
            </div>
          )}

          {q.kind === 'single' && (
            <div className="om-choices">
              {q.options.map((o, j) => (
                <ChoiceRow key={j} label={o.label} selected={o.selected} single />
              ))}
            </div>
          )}

          {q.attach && (
            <div className="om-attach-block">
              <p className="om-attach-note">{q.attach.note}</p>
              {q.attach.rows.map((r, j) => (
                <div className="om-attach-row" key={j}>
                  <AttachSlot label={r.photo.label} count={r.photo.count} />
                  <AttachSlot label={r.video.label} count={r.video.count} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TestBody({ mission }) {
  return (
    <div className="om-test">
      {mission.sections.map((s, i) => (
        <div className="om-tsec" key={i}>
          <div className="om-tsec-head">
            <span className="om-cb om-cb--blue" aria-hidden="true"><IconCheckSm /></span>
            <span className="om-tsec-title">{s.title}</span>
            <b className="om-tsec-count">{s.done}/{s.total}</b>
          </div>
          {s.questions.map((q) => (
            <TestQuestion key={q.n} n={q.n} label={q.label} status={q.status} />
          ))}
        </div>
      ))}
    </div>
  );
}

const BODIES = {
  Checklist: ChecklistBody,
  Media: MediaBody,
  Survey: QuestionsBody,
  Audit: QuestionsBody,
  Test: TestBody,
  Task: () => null,
};

// =====================  the shell  =====================

function HeaderRight({ translation }) {
  return <div className="om-head-actions om-mission-actions">
    <button type="button" className="om-hbtn" aria-label="Unboost mission" title="Unboost mission"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 22V3m0 1c5-4 9 4 15 0v11c-6 4-10-4-15 0" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
    {translation && <button type="button" className="om-hbtn om-translate" aria-label={translation.label} onClick={translation.onClick}>{translation.language}</button>}
    <button type="button" className="om-hbtn" aria-label="Cancel mission" title="Cancel mission"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="m6 4 12 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></button>
  </div>;
}

// Presentational shell. `state` is 'open' | 'claimed' | 'closed'. Whether a
// mission reads as claimed follows its Figma frame: a "Claim" footer = open;
// a "Close"/"Continue" footer = already claimed. The type body is ALWAYS shown
// (it's the mission content, visible open or claimed) — claiming only swaps the
// footer, reveals the Execution timer, and changes `who` to the claimer.
export function OpenedMission({ mission, state = 'open', showExec = false, onClaim, onClose, onBack, execTime = '00:00:00', showStatusBar = true, onEntryChange, onLessonComplete, translation }) {
  const [activeLesson,setActiveLesson]=useState(null);
  const previousState=useRef(state);
  useEffect(()=>{if(mission.lessons&&previousState.current==='open'&&state==='claimed')setActiveLesson(0);previousState.current=state;},[state,mission.lessons]);
  const Body=BODIES[mission.type]||(()=>null);
  const who=state==='open'?mission.openWho||mission.postedBy:mission.claimedWho||`Posted by: ${mission.claimer}`;
  const canClose=mission.lessons?mediaComplete(mission):!mission.entries||entriesComplete(mission.entries);
  const claimedFooter=mission.entries||mission.lessons?{label:'Close',variant:canClose?'primary':'muted'}:mission.claimedFooter||{label:'Close',variant:'muted'};
  const summary = (<div className="om-card">
        <div className="om-sum-top">
          <span className="om-sum-id">
            <img className="chip-logo" src="/mission-logo.png" alt="" aria-hidden="true" />
            <span className="om-sum-kind">{mission.typeLabel || mission.type}</span>
            {mission.points != null ? <span className="chip-points">{mission.points}</span> : null}
          </span>
          <span className="chip-timers">
            {showExec ? <span className="chip-exec">{execTime}</span> : null}
            <span className="chip-pill">{mission.pillTime}</span>
          </span>
        </div>

        <div className="om-sum-mid">
          <span className="om-sum-info">
            <h3 className="om-sum-title">{mission.title}</h3>
            <span className="om-sum-loc">{mission.location}</span>
            <span key={who} className="om-sum-by">{who}</span>
          </span>
          <span className="om-sum-date">{mission.date}&nbsp;&nbsp;{mission.time}</span>
        </div>

        <div className="om-sum-divider" />
        {mission.description ? <p className="om-sum-desc">{mission.description}</p> : null}
        {mission.notice ? <div className="om-notice"><span>{mission.notice}</span></div> : null}
        {mission.resourceLink ? <a className="om-resource-link" href={mission.resourceLink.href}>{mission.resourceLink.label} ↗</a> : null}
      </div>);
  const footer=<div className="om-footer">{state==='open'?<button className="om-cta om-cta--primary" onClick={onClaim}>{mission.claimLabel || 'Claim'}</button>:state==='claimed'?<button className={`om-cta om-cta--${claimedFooter.variant}`} disabled={!canClose} onClick={onClose}>{claimedFooter.label}</button>:<button className="om-cta om-cta--closed" disabled>Closed</button>}</div>;
  return <div data-mission-state={state} className={`om ${mission.pillClass||'chip--green'}${state==='closed'?' is-closed':''}`}>
    {showStatusBar&&<div className="ph-status"><span className="ph-time">9:41</span><span className="ph-island" aria-hidden="true"/><StatusIcons/></div>}
    <header className="om-header"><button className="om-hbtn om-hbtn--back" aria-label="Back" onClick={activeLesson!=null?()=>setActiveLesson(null):onBack}><IconBack/></button><span className="om-header-title">Mission Details</span>{mission.lessons?<button className="om-hbtn" aria-label="Lesson list" onClick={()=>setActiveLesson(null)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="3" width="6" height="5" rx="1"/><rect x="16" y="10" width="6" height="5" rx="1"/><rect x="16" y="18" width="6" height="4" rx="1"/><path d="M8 5h4v15h4m-4-7h4"/></svg></button>:<HeaderRight translation={translation}/>}</header>
    {!mission.lessons&&summary}
    <div className={`om-body om-body--${mission.type.toLowerCase()}${mission.lessons?' mt-body':''}`}>{mission.lessons?<MediaTraining summary={summary} footer={footer} mission={mission} state={state} active={activeLesson} onSelect={setActiveLesson} onComplete={onLessonComplete}/>:mission.entries?<MissionEntries mission={mission} state={state} onChange={onEntryChange}/>:<Body mission={mission}/>}</div>
    {!mission.lessons&&footer}
  </div>;
}
export default function OpenedMissionPhone({ mission }) {
  const root = useRef(null);
  const [state, setState] = useState(mission.initialState || 'open');
  const [live, setLive] = useState(false); // exec timer runs only after a LIVE claim
  const pillTween = useRef(null);
  const execTween = useRef(null);

  // Pill runs GREEN in real time (paused if the mission starts closed).
  useGSAP(
    () => {
      const el = root.current.querySelector('.chip-pill');
      if (!el) return;
      const clock = { t: parse(mission.pillTime) };
      pillTween.current = gsap.to(clock, { t: clock.t + RUN, duration: RUN, ease: 'none', onUpdate: () => (el.textContent = fmt(clock.t)) });
      if (mission.initialState === 'closed') pillTween.current.pause();
    },
    { scope: root }
  );

  // On a live Claim the Execution timer appears and counts up; Close freezes both.
  useEffect(() => {
    if (live && !execTween.current) {
      const el = root.current.querySelector('.chip-exec');
      if (el) {
        const clock = { t: 0 };
        execTween.current = gsap.to(clock, { t: RUN, duration: RUN, ease: 'none', onUpdate: () => (el.textContent = fmt(clock.t)) });
      }
    }
    if (state === 'closed') {
      pillTween.current?.pause();
      execTween.current?.pause();
    }
  }, [state, live]);

  useEffect(() => () => execTween.current?.kill(), []);

  return (
    <div className="ph-fit" ref={root}>
      <div className="ph-phone">
        <div className="ph-screen">
          <OpenedMission
            mission={mission}
            state={state}
            showExec={live}
            onClaim={() => { setState('claimed'); setLive(true); }}
            onClose={() => setState('closed')}
          />
        </div>
      </div>
    </div>
  );
}

// A gallery of all six opened-mission types (used by the /missions preview).
export function OpenedMissionsGallery() {
  return (
    <div className="om-gallery">
      {OPENED_MISSIONS.map((m) => (
        <figure className="om-gallery-item" key={m.id}>
          <OpenedMissionPhone mission={m} />
          <figcaption>{m.type}</figcaption>
        </figure>
      ))}
    </div>
  );
}
