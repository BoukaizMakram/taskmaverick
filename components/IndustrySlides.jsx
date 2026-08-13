'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

/*
 * Flatten an industry's sections into one linear slide list. Media "carries
 * forward" inside a section (the source only stamps media on the first slide),
 * falling back to the section thumbnail so every slide has a visual.
 */
function buildDeck(industry) {
  const flat = [];
  const sections = [];
  industry.sections.forEach((sec, sIdx) => {
    sections.push({ name: sec.name, id: sec.id, start: flat.length, count: sec.slides.length });
    let carried = sec.thumb ? { type: 'image', src: sec.thumb } : null;
    sec.slides.forEach((s, i) => {
      if (s.media) carried = s.media;
      flat.push({
        sectionIdx: sIdx,
        sectionName: sec.name,
        indexInSection: i,
        countInSection: sec.slides.length,
        title: s.title,
        text: s.text,
        media: s.media || carried,
      });
    });
  });
  return { flat, sections };
}

/* Some slide text arrives from the DB with raw HTML (<p>…</p>). Strip tags,
   decode the common entities, and return clean paragraph strings. */
function cleanParagraphs(text) {
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

/* A short one-line brief for a slide, shown under its title in the contents. */
function toBrief(text, max = 92) {
  const s = cleanParagraphs(text).join(' ');
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function SlideMedia({ media, playing }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      v.pause();
    }
  }, [playing, media]);

  if (!media) return <div className="isl-media isl-media-empty" aria-hidden="true" />;

  if (media.type === 'video') {
    return (
      <video
        ref={videoRef}
        key={media.src}
        className="isl-media isl-video"
        src={media.src}
        muted
        loop
        playsInline
        autoPlay
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img key={media.src} className="isl-media isl-image" src={media.src} alt="" />;
}

export default function IndustrySlides({ industry }) {
  const { flat, sections } = useMemo(() => buildDeck(industry), [industry]);
  const total = flat.length;
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(true);
  const stepsRef = useRef(null);

  const slide = flat[cur];
  const activeSection = slide ? slide.sectionIdx : 0;
  const isVideo = slide && slide.media && slide.media.type === 'video';

  const go = useCallback(
    (delta) => setCur((c) => Math.min(total - 1, Math.max(0, c + delta))),
    [total]
  );
  const jumpToSection = (sIdx) => setCur(sections[sIdx].start);

  useEffect(() => {
    setPlaying(true);
  }, [cur]);

  // Keep the active line scrolled into view within the table of contents.
  useEffect(() => {
    const rail = stepsRef.current;
    if (!rail) return;
    const el = rail.querySelector(`[data-slide="${cur}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [cur]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (!slide) return null;

  const paragraphs = cleanParagraphs(slide.text);
  const showEyebrow =
    slide.sectionName.trim().toLowerCase() !== (slide.title || '').trim().toLowerCase();

  return (
    <section className="isl">
      <header className="isl-head">
        <Link href="/#use-cases" className="isl-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All use cases
        </Link>
        <div className="isl-title-wrap">
          <span className="isl-kicker">Use cases by industry</span>
          <h1 className="isl-industry">{industry.name}</h1>
        </div>
        <span className="isl-counter">
          {String(cur + 1).padStart(2, '0')} <i>/</i> {String(total).padStart(2, '0')}
        </span>
      </header>

      {/* Left: image with the slide text under it. Right: table of contents. */}
      <div className="isl-slide">
        <div className="isl-main">
          <div className="isl-media-col">
            <SlideMedia media={slide.media} playing={playing} />
            {isVideo && (
              <button
                type="button"
                className="isl-pause"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="6" y="4" width="4" height="16" rx="1" fill="#fff" />
                    <rect x="14" y="4" width="4" height="16" rx="1" fill="#fff" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5.5C8 4.1 9.5 3.3 10.7 4.1L20.2 9.9C21.4 10.6 21.4 12.3 20.2 13.1L10.7 18.9C9.5 19.7 8 18.9 8 17.5V5.5Z" fill="#fff" />
                  </svg>
                )}
                <span>{playing ? 'Pause' : 'Play'}</span>
              </button>
            )}
          </div>

          <div className="isl-text-col" key={cur}>
            {showEyebrow && <span className="isl-ov-cat">{slide.sectionName}</span>}
            <h2 className="isl-ov-title">{slide.title}</h2>
            {paragraphs.map((p, i) => (
              <p key={i} className="isl-ov-desc">
                {p}
              </p>
            ))}

            <div className="isl-slide-nav">
              <button type="button" className="isl-navbtn" onClick={() => go(-1)} disabled={cur === 0}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Previous
              </button>
              <button type="button" className="isl-navbtn isl-navbtn--next" onClick={() => go(1)} disabled={cur === total - 1}>
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Table of contents — every slide as a clickable line, grouped by section. */}
        <aside className="isl-toc" ref={stepsRef} aria-label="Contents">
          <p className="isl-toc-title">Contents</p>
          <div className="isl-toc-list">
            {sections.map((sec, sIdx) => (
              <div className="isl-toc-group" key={sec.id}>
                <button
                  type="button"
                  className={`isl-toc-section ${sIdx === activeSection ? 'is-active' : ''}`}
                  onClick={() => jumpToSection(sIdx)}
                >
                  {sec.name}
                </button>
                <ul className="isl-toc-slides">
                  {Array.from({ length: sec.count }).map((_, i) => {
                    const g = sec.start + i;
                    return (
                      <li key={g}>
                        <button
                          type="button"
                          data-slide={g}
                          className={`isl-toc-line ${g === cur ? 'is-active' : ''}`}
                          aria-current={g === cur}
                          onClick={() => setCur(g)}
                        >
                          <span className="isl-toc-line-title">{flat[g].title}</span>
                          {(() => {
                            const brief = toBrief(flat[g].text);
                            return brief ? <span className="isl-toc-line-brief">{brief}</span> : null;
                          })()}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
