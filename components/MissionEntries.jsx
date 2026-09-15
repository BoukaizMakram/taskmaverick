'use client';
import { useState } from 'react';

export const trainingMission = {
  id: 'checklist-training', type: 'Checklist', title: 'Checklist Training',
  location: "Ref: Juliana's Folder / Balcony", postedBy: 'M001 - Makram Location - Makram Team',
  date: '08-05-25', time: '10:54 AM', description: 'Training on checklists',
  status: 'open', age: 460, entries: { fridge: '', knives: '' },
};
export function entriesComplete(entries) {
  return entries && /^-?\d+(\.\d+)?$/.test(entries.fridge) && /^\d+$/.test(entries.knives);
}

export default function MissionEntries({ mission, state, onChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const values = mission.entries;
  const editable = state === 'claimed';
  const fields = [['fridge', 'Back Kitchen Fridge', '°C'], ['knives', 'Knives', '#']];
  const valid = [ /^-?\d+(\.\d+)?$/.test(values.fridge), /^\d+$/.test(values.knives) ];
  const done = valid.filter(Boolean).length;
  const update = (key, value) => {
    if (editable && (key === 'fridge' ? /^-?\d*\.?\d*$/ : /^\d*$/).test(value)) onChange(key, value.slice(0, 12));
  };
  return <div className="me-content">
    <section className={`me-group ${editable ? '' : 'me-readonly'}`}>
      <button className="me-group-heading" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><span className="me-chevron"><svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: collapsed ? 'rotate(-90deg)' : undefined }}><path d="m6 9 6 6 6-6" /></svg></span>Kitchen<span className="me-progress">{done === 2 && <span className="me-complete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 12 3.5 3.5 7.5-8" /></svg></span>}{done}/2</span></button>
      {!collapsed && fields.map(([key,label,unit], index) => <label className="me-row" key={key}><span>{index + 1}. {label}</span><span className="me-entry"><span>{unit}</span><input aria-label={label} inputMode={key === 'fridge' ? 'decimal' : 'numeric'} readOnly={!editable} value={values[key]} onChange={event => update(key,event.target.value)}/></span></label>)}
    </section>
  </div>;
}
