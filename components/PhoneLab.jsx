'use client';

// ---------------------------------------------------------------------------
// PhoneLab — authoring/preview harness for PhoneBoard (route /phone). Adds the
// animation toolkit: pick a mission chip, then Dim others / Pop out / Zoom in
// (combinable), plus play/pause the live timers. Reuses the .ov-* controls.
// ---------------------------------------------------------------------------

import { useState } from 'react';

import PhoneBoard, { PHONE_CHIPS } from '@/components/PhoneBoard';

export default function PhoneLab() {
  const [paused, setPaused] = useState(false);
  const [highlight, setHighlight] = useState({ chip: null, effects: ['dim'] });

  const active = highlight.chip != null;
  const toggleEffect = (e) =>
    setHighlight((h) => ({ ...h, effects: h.effects.includes(e) ? h.effects.filter((x) => x !== e) : [...h.effects, e] }));

  return (
    <div className="ov-lab">
      <PhoneBoard highlight={highlight} paused={paused} />

      <div className="ov-controls" style={{ maxWidth: 520 }}>
        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Timers</span>
          <button type="button" className="ov-btn" onClick={() => setPaused((p) => !p)}>{paused ? '▶ Play' : '⏸ Pause'}</button>
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Chip</span>
          <button type="button" className={`ov-btn${highlight.chip === null ? ' is-on' : ''}`} onClick={() => setHighlight((h) => ({ ...h, chip: null }))}>None</button>
          {PHONE_CHIPS.map((c, i) => (
            <button key={c.title} type="button" className={`ov-btn${highlight.chip === i ? ' is-on' : ''}`} onClick={() => setHighlight((h) => ({ ...h, chip: i }))}>{c.title}</button>
          ))}
        </div>

        <div className="ov-ctrl-row">
          <span className="ov-ctrl-label">Effects</span>
          {[['dim', 'Dim others'], ['pop', 'Pop out'], ['zoom', 'Zoom in']].map(([s, label]) => (
            <button key={s} type="button" disabled={!active} className={`ov-btn${highlight.effects.includes(s) ? ' is-on' : ''}`} onClick={() => toggleEffect(s)}>{label}</button>
          ))}
          <span className="ov-ctrl-hint">combine freely — e.g. Dim + Zoom</span>
        </div>
      </div>
    </div>
  );
}
