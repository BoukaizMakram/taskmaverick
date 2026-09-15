'use client';

import { useEffect, useState } from 'react';
import InteractiveMissionBoard from './InteractiveMissionBoard';

export default function SoftwarePreview({ onAnimationTools }) {
  const [mode, setMode] = useState('full');
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const device = mode === 'full' ? (mobile ? 'phone' : 'tablet') : mode;
  return <div className={`sp-preview sp-preview--${mode}`}>
    <div className="sp-surface"><InteractiveMissionBoard device={device}/></div>
    <details className="sp-options"><summary>View options</summary><div>
      <label>Display<select aria-label="Display mode" value={mode} onChange={event => setMode(event.target.value)}><option value="full">Full screen · responsive</option><option value="phone">Phone frame</option><option value="tablet">Tablet frame</option></select></label>
      <button onClick={onAnimationTools}>Animation tools</button>
    </div></details>
  </div>;
}
