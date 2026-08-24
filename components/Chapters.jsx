'use client';

import { formatDuration } from '@/lib/chapters';
import { useT } from '@/lib/i18n/LanguageProvider';

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Chapters({ chapters, activeId, onSelect }) {
  const t = useT();
  return (
    <aside className="panel js-panel" id="chapters" aria-label="Video sections">
      <div className="panel-head">
        <h2 className="panel-title">{t('Chapters')}</h2>
        <span className="panel-count">{chapters.length} {t('sections')}</span>
      </div>

      <ul className="chapter-list">
        {chapters.map((chapter, i) => (
          <li key={chapter.id} className="js-chapter">
            <button
              type="button"
              className={`chapter-row ${activeId === chapter.id ? 'is-active' : ''}`}
              onClick={() => onSelect(chapter.id)}
            >
              <span className="chapter-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="chapter-title">{t(chapter.title)}</span>
              <span className="chapter-time">{formatDuration(chapter.minutes)}</span>
              <span className="chapter-chevron"><ChevronIcon /></span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
