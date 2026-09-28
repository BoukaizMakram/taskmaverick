'use client';

// ---------------------------------------------------------------------------
// SimMissionBody — the interactive body of an opened mission in the software
// simulator, rendered inside the shared OpenedMission shell (its `body` prop).
// One component for every type: checklist / survey / audit questions, numeric
// entries with photo proof, embedded lessons, media playlists, tests, and the
// trigger details of a ticket. Editable only while the mission is Claimed.
// Secondary screens (camera, lesson player, photo viewer) open as layers via
// `onLayer`, owned by SimDevice.
// ---------------------------------------------------------------------------

import { clock, fileStamp, itemDone, outOfRange } from '@/lib/sim/store.mjs';

export const PhotoGlyph = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5h3.2l1.8-2.7h7l1.8 2.7h3.2v10.7h-17Z"/><circle cx="12" cy="13.5" r="3.4"/></svg>;
export const VideoGlyph = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="m15.5 10.5 5.5-3v9l-5.5-3Z"/></svg>;
const Check = () => <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7.3 6 10l5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PlayGlyph = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z"/></svg>;
const MEDIA_ICON = { audio: 'media-audio', quiz: 'media-quiz', choice: 'media-quiz', image: 'media-image', video: 'media-video' };

function Box({ on, no }) {
  return <span className={`sim-box${on ? ' is-on' : ''}${no ? ' is-no' : ''}`} aria-hidden="true">{on ? <Check/> : null}</span>;
}

function ProofSlot({ m, item, kind, editable, onLayer }) {
  const proof = m.proofs?.[item.id];
  if (proof) {
    return <button type="button" className="sim-proof-file" onClick={() => onLayer({ kind: 'photo', src: proof.src, media: proof.kind, name: fileStamp(proof.at, proof.kind) })}>
      {proof.kind === 'video' ? <VideoGlyph/> : <PhotoGlyph/>}<span>{fileStamp(proof.at, proof.kind)}</span>
    </button>;
  }
  return <div className={`sim-proof-request${editable ? '' : ' is-locked'}`}>
    <small>Add at least one {kind}</small>
    <button type="button" disabled={!editable} onClick={() => onLayer({ kind: 'camera', missionId: m.id, itemId: item.id, media: kind })}>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 6.5v7M6.5 10h7"/></svg>
      Add {kind}<span>0/1</span>
    </button>
  </div>;
}

function Item({ m, item, n, lang, editable, store, onLayer }) {
  const label = (lang === 'es' && m.es?.items?.[item.id]) || item.label;
  const value = m.answers?.[item.id];
  const set = v => editable && store.answer(m.id, item.id, v);
  if (item.kind === 'lesson') {
    const done = m.lessonsDone?.includes(item.id);
    return <section className="sim-q">
      <p className="sim-q-prompt"><b>{n}.</b> {label}</p>
      <div className={`sim-lesson-launch${done ? ' is-done' : ''}`}>
        <span>{item.lesson.title}</span>
        <button type="button" disabled={!editable && !done} onClick={() => onLayer({ kind: 'lesson', missionId: m.id, itemId: item.id })}>
          {done ? <><Check/> Done</> : <><PlayGlyph/> Play</>}
        </button>
      </div>
    </section>;
  }
  if (item.kind === 'number') {
    const bad = outOfRange(item, value);
    return <section className={`sim-q sim-q--row${bad ? ' is-flagged' : ''}`}>
      <div className="sim-num-row">
        <p className="sim-q-prompt"><b>{n}.</b> {label}</p>
        <label className="sim-num"><span>{item.unit || '#'}</span>
          <input aria-label={label} inputMode="decimal" readOnly={!editable} value={value ?? ''} onChange={e => /^-?\d*\.?\d*$/.test(e.target.value) && set(e.target.value.slice(0, 10))}/>
        </label>
      </div>
      {bad && <p className="sim-flag">Out of range{item.min != null && item.max != null ? ` (target ${item.min}–${item.max})` : item.max != null ? ` (target ≤ ${item.max})` : ` (target ≥ ${item.min})`}</p>}
      {item.photo && (value != null && value !== '' || m.proofs?.[item.id]) && <ProofSlot m={m} item={item} kind="photo" editable={editable} onLayer={onLayer}/>}
    </section>;
  }
  if (item.kind === 'text') {
    return <section className="sim-q">
      <p className="sim-q-prompt"><b>{n}.</b> {label}</p>
      <input className="sim-text" aria-label={label} placeholder={item.placeholder} readOnly={!editable} value={value ?? ''} onChange={e => set(e.target.value.slice(0, 40))}/>
    </section>;
  }
  if (item.kind === 'photo') {
    return <section className="sim-q"><p className="sim-q-prompt"><b>{n}.</b> {label}</p><ProofSlot m={m} item={item} kind="photo" editable={editable} onLayer={onLayer}/></section>;
  }
  const options = item.options || (item.kind === 'passfail' ? ['Pass', 'Fail'] : ['Yes', 'No']);
  const proofKind = item.proofOn?.[value] || (item.kind === 'passfail' && item.photo && value ? 'photo' : null);
  const ticket = item.ticketOn?.[value];
  return <section className="sim-q">
    <p className="sim-q-prompt"><b>{n}.</b> {label}</p>
    <div className="sim-opts" role="radiogroup" aria-label={label}>
      {options.map(o => <button type="button" role="radio" aria-checked={value === o} key={o} disabled={!editable} className={`sim-opt${value === o ? ' is-on' : ''}${value === o && (o === 'No' || o === 'Fail') ? ' is-no' : ''}`} onClick={() => set(o)}>
        <Box on={value === o} no={o === 'No' || o === 'Fail'}/>{lang === 'es' ? ({ Yes: 'Sí', No: 'No', 'N/A': 'N/A', Pass: 'Aprobado', Fail: 'Falló' })[o] : o}
      </button>)}
    </div>
    {proofKind && <ProofSlot m={m} item={item} kind={proofKind} editable={editable} onLayer={onLayer}/>}
    {ticket && m.status !== 'closed' && <p className="sim-ticket-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>Closing raises a <b>{ticket.title}</b> ticket</p>}
  </section>;
}

function ItemsBody(props) {
  const { m } = props;
  const blocks = [];
  m.items.forEach((item, index) => {
    const last = blocks[blocks.length - 1];
    if (item.group && last?.group === item.group) last.items.push([item, index]);
    else blocks.push({ group: item.group, items: [[item, index]] });
  });
  return <div className="sim-items">{blocks.map(block => block.group
    ? <section className="sim-group" key={block.group}>
        <header><span className="sim-group-chev" aria-hidden="true">⌄</span><b>{block.group}</b>
          <span className="sim-group-count">{block.items.every(([it]) => itemDone(m, it)) && <i className="sim-done-dot"><Check/></i>}{block.items.filter(([it]) => itemDone(m, it)).length}/{block.items.length}</span></header>
        {block.items.map(([item, index]) => <Item key={item.id} {...props} item={item} n={index + 1}/>)}
      </section>
    : block.items.map(([item, index]) => <Item key={item.id} {...props} item={item} n={index + 1}/>))}</div>;
}

function LessonList({ m, editable, onLayer, lang }) {
  const total = m.lessons.reduce((sum, l) => sum + (l.seconds || (l.kind === 'video' ? 45 : l.kind === 'audio' ? 20 : 15)), 0);
  return <div className="sim-lessons">
    {m.lessons.map((l, i) => {
      const done = m.lessonsDone?.includes(l.id);
      return <button type="button" key={l.id} className={`sim-lesson-row${done ? ' is-done' : ''}`} disabled={!editable && !done} onClick={() => onLayer({ kind: 'lesson', missionId: m.id, lessonId: l.id })}>
        <span className="sim-lesson-n">{i + 1}.</span><span className="sim-lesson-title">{lang === 'es' && l.kind === 'quiz' ? 'Prueba' : l.title}</span>
        <span className={`om-mtag om-mtag--${l.kind === 'choice' ? 'quiz' : l.kind === 'image' ? 'illustration' : l.kind}`}><span className="om-mtag-ico"><img src={`/mission-icons/${MEDIA_ICON[l.kind]}.svg`} alt=""/></span><span className="om-mtag-meta">{done ? '✓' : l.seconds ? `00:${String(l.seconds).padStart(2, '0')}` : 'N/A'}</span></span>
      </button>;
    })}
    <div className="om-media-est"><span>Estimated Time ~</span><span className="om-media-est-box">{clock(total).text.slice(3)}</span></div>
    {!editable && m.status === 'open' && <p className="sim-hint">Claim the mission to start the lessons.</p>}
    {m.assignedBy && <p className="sim-hint">Assigned automatically after <b>{m.assignedBy}</b>.</p>}
  </div>;
}

function TestBody({ m, editable, store, now }) {
  if (m.result) {
    return <div className="sim-test-result-inline"><b>Score {m.result.score}/{m.questions.length} · {m.result.pct}%</b>{m.result.missed.length ? <span>Missed topics were assigned to the personal board.</span> : <span>Passed — no follow-up training needed.</span>}</div>;
  }
  const left = m.claimedAt ? Math.max(0, m.timeLimit - (now - m.claimedAt) / 1000) : m.timeLimit;
  return <div className="sim-test">
    <div className={`sim-test-timer${left < 60 ? ' is-low' : ''}`}>Time left <b>{clock(left).text}</b></div>
    {m.questions.map((q, i) => <section className="sim-q" key={q.id}>
      <p className="sim-q-prompt"><b>{i + 1}.</b> {q.prompt}</p>
      <div className="sim-choices">{q.options.map((o, j) => <button type="button" key={o} disabled={!editable} className={`sim-choice${m.answers?.[q.id] === j ? ' is-on' : ''}`} onClick={() => store.answer(m.id, q.id, j)}><span className="sim-radio" aria-hidden="true"/>{o}</button>)}</div>
    </section>)}
  </div>;
}

function TicketBody({ m, onLayer }) {
  const t = m.trigger || {};
  const proof = t.proof;
  return <div className="sim-trigger">
    <h4>Trigger Details</h4>
    <div className="sim-trigger-card">
      <p className="sim-trigger-count"><span className="sim-x">✕</span>{t.responses || 1} Response Triggered This Ticket</p>
      <p className="sim-trigger-q"><span className="sim-x">✕</span>{t.question}</p>
      <p className="sim-trigger-a"><span className="sim-x">✕</span>{t.answer}</p>
      <div className="sim-trigger-src"><span>{t.source}</span><em>{t.performer}</em></div>
      <p className="sim-trigger-loc">{t.location}</p>
    </div>
    {proof && <>
      <h4>Evidence</h4>
      <button type="button" className={`sim-trigger-proof${proof.kind === 'video' ? ' is-video' : ''}`} style={{ backgroundImage: `url('${proof.kind === 'video' ? '/demo-quality/damaged-hinge.png' : proof.src}')` }} onClick={() => onLayer({ kind: 'photo', src: proof.src, media: proof.kind, name: fileStamp(proof.at, proof.kind) })} aria-label="Open evidence">
        {proof.kind === 'video' && <i><PlayGlyph/></i>}
      </button>
    </>}
  </div>;
}

export default function SimMissionBody(props) {
  const { m } = props;
  if (m.type === 'Ticket') return <TicketBody {...props}/>;
  if (m.type === 'Test') return <TestBody {...props}/>;
  if (m.lessons) return <LessonList {...props}/>;
  if (m.items?.length) return <ItemsBody {...props}/>;
  return m.type === 'Task' ? <p className="sim-hint sim-hint--task">{m.status === 'open' ? 'Claim this mission to start. Your execution time is tracked from the moment you claim it.' : m.status === 'claimed' ? 'Close the mission when you are done.' : 'This mission is closed.'}</p> : null;
}
