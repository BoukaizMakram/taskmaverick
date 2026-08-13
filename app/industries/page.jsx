import Link from 'next/link';

import Navbar from '@/components/Navbar';
import IndustryToc from '@/components/IndustryToc';
import { INDUSTRY_ORDER, INDUSTRY_DECKS } from '@/lib/industryDecks';

export const metadata = {
  title: 'Use cases by industry · Taskmaverick',
  description:
    'A full index of how teams in every industry run their everyday operations with Taskmaverick — jump to any industry and section.',
};

const stripHtml = (s = '') =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function IndustriesPage() {
  const groups = INDUSTRY_ORDER.map((id) => {
    const d = INDUSTRY_DECKS[id];
    return { id, name: d.name, sections: d.sections.map((s) => ({ id: s.id, name: s.name })) };
  });

  return (
    <div className="page">
      <Navbar />

      <div className="itoc">
        <header className="itoc-hero">
          <span className="lp-kicker">Use cases by industry</span>
          <h1 className="itoc-title">Everything Taskmaverick runs, by industry.</h1>
          <p className="lp-lead">
            Browse the full index below — pick an industry and jump straight to the part you need,
            or scroll through every everyday mission and workflow. Open any industry for its full
            slide-by-slide walkthrough.
          </p>
        </header>

        <div className="itoc-layout">
          <IndustryToc groups={groups} />

          <div className="itoc-content">
            {INDUSTRY_ORDER.map((id) => {
              const d = INDUSTRY_DECKS[id];
              const slideCount = d.sections.reduce((n, s) => n + s.slides.length, 0);
              return (
                <section key={id} id={id} className="itoc-industry">
                  <div className="itoc-ind-head">
                    {d.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="itoc-ind-thumb" src={d.image} alt="" loading="lazy" />
                    ) : null}
                    <div className="itoc-ind-heading">
                      <h2>{d.name}</h2>
                      <p className="itoc-ind-meta">
                        {d.sections.length} sections · {slideCount} slides
                      </p>
                    </div>
                    <Link href={`/industries/${id}`} className="itoc-open">
                      Open walkthrough <ArrowIcon />
                    </Link>
                  </div>

                  <div className="itoc-sections">
                    {d.sections.map((sec) => (
                      <div key={sec.id} id={sec.id} className="itoc-section">
                        <h3 className="itoc-sec-name">{sec.name}</h3>
                        <ul className="itoc-slides">
                          {sec.slides.map((sl, i) => {
                            const text = stripHtml(sl.text);
                            return (
                              <li key={i} className="itoc-slide">
                                <span className="itoc-slide-title">{sl.title}</span>
                                {text ? <span className="itoc-slide-text">{text}</span> : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
