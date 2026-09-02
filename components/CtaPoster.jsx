'use client';

import { useEffect, useRef, useState } from 'react';

import { useT } from '@/lib/i18n/LanguageProvider';
import { useEdit, EditText } from '@/components/InlineEdit';
import Starfield from '@/components/Starfield';

// Black CTA poster for chapters without a coded scene or video: a forward-flying
// starfield (hyperspace) behind the chapter's headline, which animates in (line
// by line) each time the poster scrolls into view.
export default function CtaPoster({ title, editPath }) {
  const t = useT();
  const edit = useEdit();
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setRevealed(e.isIntersecting), {
      threshold: 0.5,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Edit mode: a single editable headline (double-click), no line animation.
  if (edit && editPath) {
    return (
      <div className="cover-cta is-revealed">
        <Starfield className="cover-cta-stars" />
        <EditText as="h2" className="stage-cta" multiline path={editPath} value={title || ''} />
      </div>
    );
  }

  const lines = t(title || '').split('\n');

  return (
    <div ref={ref} className={`cover-cta${revealed ? ' is-revealed' : ''}`}>
      <Starfield className="cover-cta-stars" />
      <h2 className="stage-cta">
        {lines.map((line, i) => (
          <span className="cta-line" style={{ '--i': i }} key={i}>
            {line || ' '}
          </span>
        ))}
      </h2>
    </div>
  );
}
