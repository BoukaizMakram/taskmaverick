import { notFound } from 'next/navigation';
import Link from 'next/link';

import { INDUSTRY_ORDER, getIndustry } from '@/lib/industryDecks';

// Detailed case documentation for one industry — a TEMPLATE served by the dynamic
// [industry] param, so every industry gets the same layout from its deck data.
// Linked from each slide's corner "Cases" button (opens in a new tab).

export function generateStaticParams() {
  return INDUSTRY_ORDER.map((industry) => ({ industry }));
}

export async function generateMetadata({ params }) {
  const { industry } = await params;
  const ind = getIndustry(industry);
  if (!ind) return { title: 'Cases · Taskmaverick' };
  return {
    title: `${ind.name} cases · Taskmaverick`,
    description: `Detailed use-case documentation for ${ind.name} teams using Taskmaverick.`,
  };
}

// Some slide text ships with light HTML — strip it to clean paragraph strings.
function paragraphs(text) {
  if (!text) return [];
  return String(text)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&apos;/gi, '’')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function IndustryCasesPage({ params }) {
  const { industry } = await params;
  const ind = getIndustry(industry);
  if (!ind) notFound();

  return (
    <div className="page cases-page">
      <header className="cases-topbar">
        <Link href="/" className="cases-brand" aria-label="Taskmaverick home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Taskmaverick" width="200" height="28" />
        </Link>
        <Link href={`/industries/${ind.id}`} className="cases-back">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to {ind.name}
        </Link>
      </header>

      <main className="cases-wrap">
        <p className="cases-eyebrow">Use-case documentation</p>
        <h1 className="cases-title">{ind.name}</h1>
        <p className="cases-lead">
          A detailed walkthrough of how {ind.name.toLowerCase()} teams run their
          everyday operations with Taskmaverick — organized by area, with the key
          ideas behind each.
        </p>

        {ind.sections.map((sec) => {
          const cards = sec.slides.filter((s) => s.title || paragraphs(s.text).length);
          if (!cards.length) return null;
          return (
            <section className="cases-sec" id={sec.id} key={sec.id}>
              <h2 className="cases-sec-title">{sec.name}</h2>
              <div className="cases-cards">
                {cards.map((s, i) => (
                  <article className="cases-card" key={i}>
                    {s.title && <h3 className="cases-card-title">{s.title}</h3>}
                    {paragraphs(s.text).map((p, j) => (
                      <p className="cases-card-text" key={j}>
                        {p}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
