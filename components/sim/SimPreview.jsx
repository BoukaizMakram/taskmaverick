'use client';

// ---------------------------------------------------------------------------
// SimPreview — /phone harness for the software simulator: a phone and the
// shared team tablet on ONE store, side by side, as in the product demo
// ("whatever happens on this phone happens on the tablet"). Codes: 123456
// Anna F., 456456 Ben R., 654321 J. Maverick (Retrieve Codes shows them).
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { createSimStore } from '@/lib/sim/store.mjs';
import SimDevice from './SimDevice';
import { useMounted } from './useSim';

export default function SimPreview({ onClassic, onAnimationTools }) {
  const mounted = useMounted();
  const [store, setStore] = useState(() => createSimStore());
  const [layout, setLayout] = useState('both');
  const [take, setTake] = useState(0);
  const reset = () => { setStore(createSimStore()); setTake(t => t + 1); };
  if (!mounted) return <div className="sim-preview sim-preview--loading" aria-busy="true"/>;
  return <div className={`sim-preview sim-preview--${layout}`}>
    <div className="sim-preview-stage" key={take}>
      {layout !== 'tablet' && <div className="sim-preview-phone"><SimDevice store={store} device="phone" initialScreen="home"/></div>}
      {layout !== 'phone' && <div className="sim-preview-tablet"><SimDevice store={store} device="tablet" initialScreen="board" initialBoard="L001-team-a"/></div>}
    </div>
    <div className="sim-preview-bar">
      <div className="sim-preview-seg" role="group" aria-label="Devices">
        {[['both', 'Phone + Tablet (synced)'], ['phone', 'Phone'], ['tablet', 'Tablet']].map(([id, label]) => <button type="button" key={id} aria-pressed={layout === id} onClick={() => setLayout(id)}>{label}</button>)}
      </div>
      <button type="button" className="ov-btn" onClick={reset}>Reset simulation</button>
      {onClassic && <button type="button" className="ov-btn" onClick={onClassic}>Classic board preview</button>}
      {onAnimationTools && <button type="button" className="ov-btn" onClick={onAnimationTools}>Animation tools</button>}
      <span className="sim-preview-hint">Codes: <b>123456</b> Anna F. · <b>456456</b> Ben R. · <b>654321</b> J. Maverick</span>
    </div>
  </div>;
}
