'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Navbar from '@/components/Navbar';
import CornerPlay from '@/components/CornerPlay';
import { useT } from '@/lib/i18n/LanguageProvider';

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

const textLength = (text) => cleanParagraphs(text).join(' ').length;

/*
 * Build the reel as a list of PAGES — ONE idea (slide) per page. Each page shows
 * that slide's own media on top (falling back to the section's cover / thumb
 * when the slide has none) and its single idea (title + text) underneath. Also
 * returns the sections with their starting page index (drives the dropdown).
 */
function buildDeck(industry) {
  const pages = [];
  const sections = [];
  industry.sections.forEach((sec, sIdx) => {
    sections.push({ id: sIdx, name: sec.name, start: pages.length });

    const firstWithMedia = sec.slides.find((s) => s.media);
    const fallback =
      firstWithMedia?.media || (sec.thumb ? { type: 'image', src: sec.thumb } : null);

    // One page per slide — needs at least a title or some text to be worth a page.
    sec.slides
      .filter((s) => s.title || textLength(s.text))
      .forEach((s) => {
        pages.push({
          sectionIdx: sIdx,
          sectionName: sec.name,
          media: s.media || fallback,
          ideas: [{ title: s.title, text: s.text }],
        });
      });
  });
  return { pages, sections };
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

// Industry deck rendered as a full-screen scroll-snap reel — one page per group
// of ideas, the section cover on top and the ideas listed left-justified below.
// The nav dropdown (navbar on desktop, pinned selector on mobile) lists every
// page, labelled "Section-<first idea>".
export default function IndustrySlides({ industry }) {
  const t = useT();
  const { pages } = useMemo(() => buildDeck(industry), [industry]);

  // Table of contents for the right rail: each section, with its ideas listed
  // underneath (each idea links to the page it lives on). Pages for a section
  // are contiguous (buildDeck emits them section by section).
  const toc = useMemo(() => {
    const secs = [];
    pages.forEach((p, pageIdx) => {
      let s = secs[secs.length - 1];
      if (!s || s.sectionIdx !== p.sectionIdx) {
        s = { sectionIdx: p.sectionIdx, name: p.sectionName, firstPage: pageIdx, items: [] };
        secs.push(s);
      }
      p.ideas.forEach((idea) => {
        if (idea.title) s.items.push({ title: idea.title, page: pageIdx });
      });
    });
    return secs;
  }, [pages]);

  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  // TOC number-side option: '1' = number before the title ("01  Compliance"),
  // '2' = number after it at the right edge ("Compliance  01"). Press 1 / 2 (or
  // click the toggle) to switch.
  const [side, setSide] = useState('1');
  const pagesRef = useRef([]);
  const pad = (n) => String(n).padStart(2, '0');

  // Keys 1 / 2 switch the number's side (left / right of the title).
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (e.key === '1') setSide('1');
      else if (e.key === '2') setSide('2');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The dropdowns (navbar + mobile selector) list SECTIONS only — just the
  // section titles (e.g. "Compliance", "Maintenance"), no per-slide subtitles.
  const sectionChapters = useMemo(
    () => toc.map((s) => ({ id: s.sectionIdx, title: s.name, firstPage: s.firstPage })),
    [toc]
  );
  const activeSection = pages[active]?.sectionIdx ?? 0;
  const activeTitle = t(pages[active]?.sectionName || '');
  const activeSecPos = sectionChapters.findIndex((c) => c.id === activeSection);

  const goTo = (id) => {
    const n = Math.max(0, Math.min(pages.length - 1, id));
    setActive(n);
    pagesRef.current[n]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  // Jump to a section by its first page.
  const goToSection = (sectionIdx) => {
    const sec = toc.find((s) => s.sectionIdx === sectionIdx);
    if (sec) goTo(sec.firstPage);
  };
  const pickSection = (sectionIdx) => {
    setMenuOpen(false);
    goToSection(sectionIdx);
  };

  // Keep the dropdown in sync with the page in view, and play only that page's
  // video (like the landing reel).
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            const idx = Number(e.target.dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { threshold: [0.6] }
    );
    pagesRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [pages.length]);

  return (
    <>
      <Navbar
        chapters={sectionChapters}
        activeId={activeSection}
        onSelect={goToSection}
        backTo={{ href: '/#use-cases', label: industry.name }}
      />

      {/* Mobile-only pinned selector, mirroring the landing reel's selector.
          Desktop uses the navbar dropdown (.nav-chapters). */}
      <div className="ireel-bar">
        <div className="stage-chapters">
          <button
            type="button"
            className="stage-chapters-select"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {activeTitle}
          </button>
          <span className="stage-chapters-count" aria-hidden="true">
            {pad(activeSecPos >= 0 ? activeSecPos + 1 : 1)}
          </span>
          <span className={`stage-chapters-chev${menuOpen ? ' is-open' : ''}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>
      {menuOpen && (
        <div className="ch-menu ireel-menu" role="listbox" aria-label="Jump to a section">
          {sectionChapters.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={c.id === activeSection}
              className={`ch-menu-item${c.id === activeSection ? ' is-active' : ''}`}
              onClick={() => pickSection(c.id)}
            >
              <span className="ch-menu-title">{t(c.title)}</span>
              <span className="ch-menu-num">{pad(i + 1)}</span>
            </button>
          ))}
          <a
            href="/industries"
            className="ch-menu-item ch-menu-item--featured"
            onClick={() => setMenuOpen(false)}
          >
            <span className="ch-menu-title">{t('All industries')}</span>
            <svg className="ch-menu-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      )}

      {/* Persistent table of contents on the right of the reel (desktop only —
          mobile keeps the pinned selector / navbar dropdown). Plain clickable
          text: just the section titles (e.g. Compliance, Maintenance). */}
      <nav className={`ireel-toc${side === '2' ? ' is-num-right' : ''}`} aria-label={t('On this page')}>
        {/* Up / down slide navigation — belongs to the sidebar, pinned just to
            its left so it sits close to the rail. */}
        <div className="ireel-side-nav">
          <button
            type="button"
            className="ireel-side-btn"
            aria-label="Previous slide"
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            className="ireel-side-btn"
            aria-label="Next slide"
            disabled={active === pages.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        <div className="ireel-toc-list">
          {toc.map((sec, i) => {
            const secActive = pages[active]?.sectionIdx === sec.sectionIdx;
            return (
              <div className={`ireel-toc-group${secActive ? ' is-active' : ''}`} key={sec.sectionIdx}>
                <button type="button" className="ireel-toc-sec" onClick={() => goTo(sec.firstPage)}>
                  <span className="ireel-toc-num">{pad(i + 1)}</span>
                  <span className="ireel-toc-name">{t(sec.name)}</span>
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="ireel">
        {pages.map((page, i) => (
          <section
            className="ireel-page"
            key={i}
            data-idx={i}
            ref={(el) => {
              pagesRef.current[i] = el;
            }}
          >
            <div className="stage-inner">
              <div className="video-frame-wrap">
                <div className="video-frame ireel-frame">
                  <SlideMedia media={page.media} playing={i === active} />
                </div>
                <CornerPlay />
              </div>

              {page.ideas.length > 0 && (
                <div className="ireel-ideas">
                  {page.ideas.map((idea, k) => {
                    const paragraphs = cleanParagraphs(t(idea.text));
                    return (
                      <div className="ireel-idea" key={k}>
                        {idea.title && <h2 className="ireel-idea-title">{t(idea.title)}</h2>}
                        {paragraphs.map((p, j) =>
                          p.trim() ? (
                            <p key={j} className="ireel-idea-text">
                              {p}
                            </p>
                          ) : null
                        )}
                        {/* Corner "Cases" button (styled like the cover's Play
                            button) — opens this industry's detailed case
                            documentation in a new tab. */}
                        <a
                          className="ireel-cases-btn"
                          href={`/industries/${industry.id}/cases`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${t(industry.name)} cases`}
                        >
                          {t('Cases')}
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mobile-only up / down slide nav under the idea box (the desktop
                  side-rail arrows are hidden on phones). */}
              <div className="ireel-mnav">
                <button
                  type="button"
                  className="ireel-side-btn"
                  aria-label="Previous slide"
                  disabled={i === 0}
                  onClick={() => goTo(i - 1)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ireel-side-btn"
                  aria-label="Next slide"
                  disabled={i === pages.length - 1}
                  onClick={() => goTo(i + 1)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Layout side option — 1 = content left, 2 = content right (also keys 1/2). */}
      <div className="ireel-side-toggle" role="group" aria-label="Layout side">
        <button type="button" className={side === '1' ? 'is-active' : ''} onClick={() => setSide('1')} aria-pressed={side === '1'}>1</button>
        <button type="button" className={side === '2' ? 'is-active' : ''} onClick={() => setSide('2')} aria-pressed={side === '2'}>2</button>
      </div>
    </>
  );
}
