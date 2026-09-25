'use client';

import { useEffect, useState } from 'react';
import InteractiveMissionBoard from './InteractiveMissionBoard';
import { REFERENCE_MISSIONS } from '@/lib/referenceMissions';

export default function SoftwarePreview({ onAnimationTools, referenceBoard = false }) {
  const [mode, setMode] = useState('full');
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const device = mode === 'full' ? (mobile ? 'phone' : 'tablet') : mode;
  return <div className={`sp-preview sp-preview--${mode}${referenceBoard ? ' sp-preview--reference' : ''}`}>
    <div className="sp-surface"><InteractiveMissionBoard key={device} device={device} referenceLayout={referenceBoard} initialScreen={referenceBoard ? 'board' : 'home'} initialMissions={referenceBoard ? REFERENCE_MISSIONS : null}/></div>
    <details className="sp-options"><summary>View options</summary><div>
      <label>Display<select aria-label="Display mode" value={mode} onChange={event => setMode(event.target.value)}><option value="full">Full screen · responsive</option><option value="phone">Phone frame</option><option value="tablet">Tablet frame</option></select></label>
      <button onClick={onAnimationTools}>Animation tools</button>
      {process.env.NODE_ENV !== 'production' && <a href="/quality-assets" style={{display:'block',marginTop:12,color:'#1271b7',textAlign:'center'}}>Improved Quality asset library ↗</a>}
    </div></details>
  </div>;
}
