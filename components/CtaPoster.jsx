'use client';

import { useEffect, useRef, useState } from 'react';

import { useT } from '@/lib/i18n/LanguageProvider';
import { useEdit, EditText, EditBgButton } from '@/components/InlineEdit';
import PosterBg from '@/components/PosterBg';

// CTA poster for chapters without a coded scene (or, in the editor, for any
// chapter): a selectable animated background behind the chapter's headline,
// which animates in line by line each time the poster scrolls into view.
// `bg` picks the background style (default 'stars'); `bgPath` binds the style
// selector shown in the admin editor.
export default function CtaPoster({ title, editPath, bg = 'stars', bgPath }) {
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

  // Edit mode: a single editable headline (double-click), no line animation,
  // plus a control to cycle the background style.
  if (edit && editPath) {
    return (
      <div className="cover-cta is-revealed">
        <PosterBg variant={bg} />
        {bgPath && <EditBgButton path={bgPath} current={bg} />}
        <EditText as="h2" className="stage-cta" multiline path={editPath} value={title || ''} />
      </div>
    );
  }

  const lines = t(title || '').split('\n');

  return (
    <div ref={ref} className={`cover-cta${revealed ? ' is-revealed' : ''}`}>
      <PosterBg variant={bg} />
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
