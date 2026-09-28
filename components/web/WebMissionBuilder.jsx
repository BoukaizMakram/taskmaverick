'use client';

// ---------------------------------------------------------------------------
// WebMissionBuilder — create / edit a mission (Missions → Library → Create
// Mission, or open any mission). Left: Mission Attributes, Content Builder
// (Edit Content opens the step builder), Mission Settings (alert tickets on
// timers, automated prioritization, timer colors, automated re-assignment).
// Right: the live phone "Mission Preview" — the real OpenedMission shell, so
// what you type is exactly what the performer will see.
// `typing` = { id, field, text } lets a presenter type into a field live.
// Prefix .wa-builder-*.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { OpenedMission } from '@/components/OpenedMission';
import SimMissionBody from '@/components/sim/SimMissionBody';
import { Icon } from '@/components/OverviewWorkspace';

const TYPES = ['Task', 'Checklist', 'Survey', 'Media', 'Test', 'Audit'];
const STEP_KINDS = [['yesno', 'Yes or No'], ['number', 'Number'], ['text', 'Text'], ['passfail', 'Pass or Fail'], ['photo', 'Photo']];
const seedSteps = (title, type) => {
  if (title === 'Lobby Restroom Clean') return [
    { id: 's1', kind: 'yesno', label: 'Restock and clean the bathroom.', proofOn: { Yes: 'photo' }, ticketOn: {} },
    { id: 's2', kind: 'yesno', label: 'Are all fixtures working properly?', proofOn: { No: 'video' }, ticketOn: { No: { title: 'Maintenance Alert' } } },
  ];
  if (type === 'Checklist' || type === 'Audit' || type === 'Survey') return [{ id: 's1', kind: 'yesno', label: 'Restock and clean the area.', proofOn: {}, ticketOn: {} }];
  return [];
};

function Counter({ value, max }) { return <span className="wa-counter">{value.length}/{max}</span>; }
function Rich({ label, value, max, onChange, placeholder, required }) {
  return <div className="wa-field wa-field--rich"><span className="wa-label">{label}{required && '*'} <i className="wa-info">i</i></span>
    <div className="wa-rich"><div className="wa-rich-bar" aria-hidden="true"><b>B</b><i>I</i><u>U</u><span>🔗</span><span>≡</span><span>☰</span></div>
      <textarea value={value} maxLength={max} placeholder={placeholder} onChange={e => onChange(e.target.value)}/><Counter value={value} max={max}/></div></div>;
}
function Duration({ label, value, onChange, children }) {
  const [hh = '', mm = ''] = (value || '').split(':');
  return <div className="wa-duration-row"><span className="wa-duration-label">{label}</span>
    <span className="wa-duration"><label><small>weeks</small><input value="" readOnly placeholder="ww"/></label><label><small>days</small><input value="" readOnly placeholder="dd"/></label>
      <label><small>hh:mm</small><input value={value || ''} placeholder="hh:mm" onChange={e => onChange(e.target.value.replace(/[^\d:]/g, '').slice(0, 5))} aria-label={`${label} (hh:mm)`}/></label></span>
    {children}</div>;
}
function Section({ title, open, onToggle, right, children }) {
  return <section className={`wa-builder-section${open ? ' is-open' : ''}`}>
    <header><button type="button" onClick={onToggle}><span className="wa-sq">{open ? '✓' : ''}</span>{title}</button>{right}</header>
    {open && <div className="wa-builder-section-body">{children}</div>}
  </section>;
}

function StepBuilder({ draft, onApply, onClose }) {
  const [steps, setSteps] = useState(() => draft.steps.length ? draft.steps.map(s => ({ ...s })) : [{ id: 's1', kind: 'yesno', label: '', proofOn: {}, ticketOn: {} }]);
  const [edition, setEdition] = useState('Edition 1');
  const [at, setAt] = useState(0);
  const step = steps[at];
  const update = patch => setSteps(list => list.map((s, i) => (i === at ? { ...s, ...patch } : s)));
  const answers = step?.kind === 'passfail' ? ['Pass', 'Fail'] : ['Yes', 'No'];
  return <div className="wa-modal-layer" role="dialog" aria-modal="true" aria-label="Checklist Builder">
    <div className="wa-modal">
      <header className="wa-modal-head"><b>Content Builder</b><div><button type="button" className="ow-primary" onClick={() => onApply(steps)}>✓ Apply</button><button type="button" className="ow-secondary" onClick={onClose}>Close</button></div></header>
      <div className="wa-stepbuilder">
        <aside>
          <h4>Content Summary</h4>
          <label className="wa-field"><span className="wa-label">Edition Title</span><input value={edition} onChange={e => setEdition(e.target.value)}/></label>
          <p className="wa-muted">Steps: {steps.length}</p>
          <div className="wa-step-add"><button type="button" className="ow-secondary" onClick={() => { setSteps(s => [...s, { id: `s${Date.now()}`, kind: 'yesno', label: 'A new step', proofOn: {}, ticketOn: {} }]); setAt(steps.length); }}>+ Step</button><button type="button" className="ow-secondary">Add divider +</button></div>
          <ol>{steps.map((s, i) => <li key={s.id} className={i === at ? 'is-active' : ''}><button type="button" onClick={() => setAt(i)}>{i + 1}. {s.label || 'Untitled step'}</button><button type="button" aria-label="Delete step" onClick={() => { setSteps(list => list.filter((_, j) => j !== i)); setAt(0); }}>🗑</button></li>)}</ol>
        </aside>
        {step && <div className="wa-stepbuilder-main">
          <h4>Checklist Builder</h4>
          <div className="wa-step-card">
            <div className="wa-step-top"><span className="wa-step-n">{at + 1}</span><b>Step {at + 1}</b>
              <label className="wa-inline">Type <select value={step.kind} onChange={e => update({ kind: e.target.value })}>{STEP_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label></div>
            <div className="wa-rich"><div className="wa-rich-bar" aria-hidden="true"><b>B</b><i>I</i><u>U</u><span>🔗</span><span>≡</span></div><textarea value={step.label} maxLength={500} placeholder="Write the statement or question" onChange={e => update({ label: e.target.value })}/><span className="wa-counter">{step.label.length}/500</span></div>
            {['yesno', 'passfail'].includes(step.kind) && <>
              <label className="ow-check wa-na"><input type="checkbox" checked={!!step.options?.includes('N/A')} onChange={e => update({ options: e.target.checked ? [...answers, 'N/A'] : undefined })}/>Allow N/A</label>
              {answers.map(a => <div className="wa-answer-rule" key={a}>
                <span className={`wa-answer is-${a === 'Yes' || a === 'Pass' ? 'yes' : 'no'}`}>{a}</span>
                <div className="wa-rule-line">Require performer to provide visual documentation in the form of
                  {['photo', 'video'].map(kind => <label key={kind} className="ow-check"><input type="radio" name={`proof-${a}`} checked={step.proofOn?.[a] === kind} onChange={() => update({ proofOn: { ...step.proofOn, [a]: kind } })}/>{kind === 'photo' ? 'Photo' : 'Video'}</label>)}
                  {step.proofOn?.[a] && <button type="button" className="ow-text-button" onClick={() => { const next = { ...step.proofOn }; delete next[a]; update({ proofOn: next }); }}>clear</button>}</div>
                <div className="wa-rule-line">Trigger an alert ticket if this response is selected
                  <button type="button" className={`wa-ticket-toggle${step.ticketOn?.[a] ? ' is-on' : ''}`} onClick={() => { const next = { ...step.ticketOn }; if (next[a]) delete next[a]; else next[a] = { title: a === 'No' || a === 'Fail' ? 'Maintenance Alert' : 'Management Alert' }; update({ ticketOn: next }); }}>{step.ticketOn?.[a] ? `✓ ${step.ticketOn[a].title}` : '+ Ticket'}</button></div>
              </div>)}
            </>}
            {step.kind === 'number' && <div className="wa-rule-line">Flag values outside <input className="wa-mini" placeholder="min" value={step.min ?? ''} onChange={e => update({ min: e.target.value === '' ? undefined : Number(e.target.value) })}/> – <input className="wa-mini" placeholder="max" value={step.max ?? ''} onChange={e => update({ max: e.target.value === '' ? undefined : Number(e.target.value) })}/> and require a photo <input type="checkbox" checked={!!step.photo} onChange={e => update({ photo: e.target.checked })}/></div>}
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

export default function WebMissionBuilder({ mission, type = 'Task', onClose, typing }) {
  const editing = !!mission;
  const [draft, setDraft] = useState(() => ({
    type: mission?.type || type, title: mission?.title || '', folder: mission ? (mission.folder || 'Multiple Locations') : 'New',
    guide: editing ? mission.description || 'Please complete the following' : '', alert: editing ? mission.notice ?? 'Ensure to use the designated cleaning tools and solutions.' : '',
    team: mission?.team?.filter(t => !t.startsWith('+')) || [], category: mission?.category || 'General', tags: mission?.tag?.filter(t => !t.startsWith('+')) || ['General'],
    steps: mission?.items?.length ? mission.items.map(s => ({ proofOn: {}, ticketOn: {}, ...s })) : seedSteps(mission?.title, mission?.type || type),
    settings: { openBeyond: '00:12', notClosed: '', claimedBeyond: '', claimedBelow: '', boost: '00:07', green: '00:30:00', orange: '01:00:00', bounce: '' },
  }));
  const [open, setOpen] = useState({ attributes: true, content: editing, settings: !editing ? false : true });
  const [builder, setBuilder] = useState(false);
  const [saved, setSaved] = useState('');
  const set = patch => setDraft(d => ({ ...d, ...patch }));
  const setting = (key, value) => setDraft(d => ({ ...d, settings: { ...d.settings, [key]: value } }));
  const typed = useRef(null);
  useEffect(() => {
    if (!typing || typing.id === typed.current) return;
    typed.current = typing.id;
    const field = ['title', 'guide', 'alert'].includes(typing.field) ? typing.field : 'title';
    setOpen(o => ({ ...o, attributes: true }));
    let i = 0; const text = String(typing.text || '');
    set({ [field]: '' });
    const id = setInterval(() => { i += 1; set({ [field]: text.slice(0, i) }); if (i >= text.length) clearInterval(id); }, 55);
    return () => clearInterval(id);
  }, [typing]);
  const now = new Date();
  const preview = {
    type: draft.type, title: draft.title || 'Mission Title', description: draft.guide || 'Please perform this mission carefully.', notice: draft.alert || 'Please pay attention to all details.',
    points: 10, location: draft.team[0] || 'Team', openWho: "Performer's Name", pillTime: '00:00:00', pillClass: 'chip--green',
    date: `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getFullYear()).slice(2)}`, time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
  const previewMission = { ...preview, id: 'preview', status: 'open', items: draft.steps.map(s => ({ ...s, ticketOn: Object.fromEntries(Object.entries(s.ticketOn || {}).map(([k, v]) => [k, v])) })), answers: {}, proofs: {}, lessonsDone: [] };
  const titleMax = 36;
  return <section className="wa-builder" aria-label={editing ? `Edit ${draft.title}` : `New ${draft.type}`}>
    <header className="wa-builder-head">
      <div className="wa-crumbs">{editing ? <><b>{draft.folder} / {draft.title}</b><span className="wa-version">1.0 ▾ <i className="wa-dot is-green"/>Published</span><span className="wa-lang">⊕ Language ▾</span></> : <b>New {draft.type}</b>}</div>
      <div className="wa-builder-actions"><button type="button" className="ow-tool"><Icon name="expand"/>Expand/Collapse</button><button type="button" className="ow-secondary" onClick={onClose}>Close</button>
        <button type="button" className="ow-primary" disabled={!draft.title.trim()} onClick={() => setSaved(editing ? 'Changes published' : `"${draft.title}" saved to the Library`)}>Actions <Icon name="chevron"/></button></div>
    </header>
    <div className="wa-builder-grid">
      <div className="wa-builder-form">
        <Section title="Mission Attributes" open={open.attributes} onToggle={() => setOpen(o => ({ ...o, attributes: !o.attributes }))}>
          <label className="wa-field"><span className="wa-label">Title* <i className="wa-info">i</i></span><input value={draft.title} maxLength={titleMax} placeholder="Mission Title" onChange={e => set({ title: e.target.value })}/><Counter value={draft.title} max={titleMax}/></label>
          <Rich label="Guide" value={draft.guide} max={160} placeholder="Please perform this mission carefully." onChange={v => set({ guide: v })}/>
          <Rich label="Alert" value={draft.alert} max={160} placeholder="Please pay attention to all details." onChange={v => set({ alert: v })}/>
          {editing && <div className="wa-field"><span className="wa-label">Team <i className="wa-info">i</i></span><div className="wa-chips">{(draft.team.length ? draft.team : ['Housekeeping (Inactive)']).map(t => <span className="wa-chip" key={t}>{t}</span>)}</div></div>}
          <div className="wa-field"><span className="wa-label">Category* <i className="wa-info">i</i></span><div className="wa-chips wa-select"><span className="wa-chip">{draft.category} ✕</span><span className="wa-caret">⌄</span></div></div>
          <div className="wa-field"><span className="wa-label">Tags* <i className="wa-info">i</i></span><div className="wa-chips wa-select">{draft.tags.map(t => <span className="wa-chip" key={t}>{t} ✕</span>)}<span className="wa-caret">⌄</span></div></div>
          {!editing && <label className="wa-field"><span className="wa-label">Type</span><select value={draft.type} onChange={e => set({ type: e.target.value, steps: seedSteps('', e.target.value) })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>}
        </Section>
        {draft.type !== 'Task' && <Section title={<>Content Builder <small className="wa-muted">Edition 1</small></>} open={open.content} onToggle={() => setOpen(o => ({ ...o, content: !o.content }))}
          right={<span className="wa-section-tools"><span className="wa-chip">✎ Geography</span><button type="button" className="ow-secondary" onClick={() => setBuilder(true)}>✎ Edit Content</button></span>}>
          {draft.steps.length ? <ol className="wa-step-list">{draft.steps.map(s => <li key={s.id}><span>{s.label || 'Untitled step'}</span><em>{STEP_KINDS.find(([k]) => k === s.kind)?.[1]}</em>{Object.values(s.proofOn || {}).length > 0 && <em className="is-proof">proof</em>}{Object.values(s.ticketOn || {}).length > 0 && <em className="is-ticket">ticket</em>}</li>)}</ol> : <p className="wa-muted">No steps yet — click Edit Content.</p>}
        </Section>}
        {editing && <button type="button" className="wa-add-edition">+ Add Edition - 2</button>}
        <Section title="Mission Settings" open={open.settings} onToggle={() => setOpen(o => ({ ...o, settings: !o.settings }))} right={<button type="button" className="ow-tool"><Icon name="expand"/>Expand/Collapse</button>}>
          <details className="wa-sub"><summary>Configuration Settings</summary><div className="wa-config"><label className="ow-check"><input type="checkbox" defaultChecked/>Require personal code to claim and close</label><label className="ow-check"><input type="checkbox" defaultChecked/>Show on shared team devices</label><label className="wa-inline">Points <input className="wa-mini" defaultValue="10"/></label></div></details>
          <details className="wa-sub" open><summary>Performance Settings</summary>
            <h5>Alert Tickets <i className="wa-info">i</i></h5>
            <p className="wa-rule-title">Trigger alert tickets based on mission timer durations</p>
            <Duration label="If open beyond*" value={draft.settings.openBeyond} onChange={v => setting('openBeyond', v)}><span className="wa-ticket-pill">🗑 Management Alert</span></Duration>
            <p className="wa-andor">And/Or</p>
            <Duration label="If not closed within" value={draft.settings.notClosed} onChange={v => setting('notClosed', v)}><button type="button" className="wa-ticket-add">+ Ticket</button></Duration>
            <p className="wa-rule-title">Trigger alert tickets based on claimed duration</p>
            <Duration label="Beyond this duration" value={draft.settings.claimedBeyond} onChange={v => setting('claimedBeyond', v)}><button type="button" className="wa-ticket-add">+ Ticket</button></Duration>
            <p className="wa-andor">And/Or</p>
            <Duration label="Below this duration" value={draft.settings.claimedBelow} onChange={v => setting('claimedBelow', v)}><button type="button" className="wa-ticket-add">+ Ticket</button></Duration>
            <h5>Automated Prioritization <i className="wa-info">i</i></h5>
            <Duration label="Automatically boost this mission to be prioritized if it ages beyond" value={draft.settings.boost} onChange={v => setting('boost', v)}/>
            <h5>Timer Settings <i className="wa-info">i</i></h5>
            <p className="wa-rule-title">Timer colors can be set to change based on custom durations per mission.</p>
            <div className="wa-timer-rules">
              <div><span className="wa-timer-chip is-green">Green</span><span>00:00:00 –</span><input value={draft.settings.green} onChange={e => setting('green', e.target.value)} aria-label="Green until"/></div>
              <div><span className="wa-timer-chip is-orange">Orange</span><span>{draft.settings.green} –</span><input value={draft.settings.orange} onChange={e => setting('orange', e.target.value)} aria-label="Orange until"/></div>
              <div><span className="wa-timer-chip is-red">Red</span><span>More than</span><b>{draft.settings.orange}</b></div>
            </div>
            <p className="wa-note">Note: Mission timers can increase efficiency by escalating in color as they age.</p>
            <h5>Automated Re-Assignment <i className="wa-info">i</i></h5>
            <Duration label="Bounce back this mission to open if it becomes claimed for a duration beyond" value={draft.settings.bounce} onChange={v => setting('bounce', v)}/>
          </details>
        </Section>
        {saved && <p className="wa-saved" role="status">✓ {saved}</p>}
      </div>
      <aside className="wa-preview" aria-label="Mission Preview">
        <div className="ph-fit"><div className="ph-phone"><div className="ph-screen">
          <OpenedMission mission={preview} state="open" body={<SimMissionBody m={{ ...previewMission, type: ['Test', 'Media'].includes(draft.type) ? 'Checklist' : draft.type }} lang="en" now={Date.now()} editable={false} onLayer={() => {}}/>}/>
        </div></div></div>
        <p>Mission Preview</p>
      </aside>
    </div>
    {builder && <StepBuilder draft={draft} onClose={() => setBuilder(false)} onApply={steps => { set({ steps }); setBuilder(false); setOpen(o => ({ ...o, content: true })); }}/>}
  </section>;
}
