'use client';

import Link from 'next/link';

import { INDUSTRY_LIST } from '@/lib/industryDecks';
import { useT } from '@/lib/i18n/LanguageProvider';

/*
 * Grid of industry cards. Each card links to that industry's slide deck
 * (`/industries/<id>`). Data comes from lib/industryDecks (generated from the
 * Taskmaverick Supabase content). Used on the landing "Use cases" section and
 * on the /industries hub.
 */
export default function IndustryGrid() {
  const t = useT();
  return (
    <div className="ind-grid">
      {INDUSTRY_LIST.map((ind) => (
        <Link key={ind.id} href={`/industries/${ind.id}`} className="ind-card">
          <span className="ind-card-media">
            {ind.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ind.image} alt="" loading="lazy" />
            ) : (
              <span className="ind-card-media-fallback" aria-hidden="true" />
            )}
          </span>
          <span className="ind-card-body">
            <span className="ind-card-name">{t(ind.name)}</span>
            <span className="ind-card-meta">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
