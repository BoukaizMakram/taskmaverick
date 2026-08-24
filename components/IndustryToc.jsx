'use client';

// ---------------------------------------------------------------------------
// IndustryToc — the sticky table of contents for the /industries page. Renders
// a nested list (industry -> sections) of anchor links to the detailed content
// rendered alongside it, and highlights the entry the reader is currently on
// (IntersectionObserver watches each section block by id).
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { useT } from '@/lib/i18n/LanguageProvider';

export default function IndustryToc({ groups }) {
  const t = useT();
  const [active, setActive] = useState(null);

  useEffect(() => {
    const ids = groups.flatMap((g) => g.sections.map((s) => s.id));
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [groups]);

  const activeIndustry = groups.find((g) => g.sections.some((s) => s.id === active))?.id;

  return (
    <nav className="itoc-nav" aria-label="Use cases table of contents">
      <p className="itoc-nav-title">{t('On this page')}</p>
      <ul className="itoc-nav-list">
        {groups.map((g) => (
          <li key={g.id} className={`itoc-nav-industry ${activeIndustry === g.id ? 'is-open' : ''}`}>
            <a href={`#${g.id}`} className={`itoc-nav-ind ${activeIndustry === g.id ? 'is-active' : ''}`}>
              {t(g.name)}
              <span className="itoc-nav-count">{g.sections.length}</span>
            </a>
            <ul className="itoc-nav-sections">
              {g.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={`itoc-nav-sec ${active === s.id ? 'is-active' : ''}`}>
                    {t(s.name)}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
