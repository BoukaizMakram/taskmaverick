'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Navbar from '@/components/Navbar';
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
  const pagesRef = useRef([]);
  const pad = (n) => String(n).padStart(2, '0');

  const pageChapters = useMemo(
    () =>
      pages.map((p, i) => ({
        id: i,
        title: `${t(p.sectionName)}-${t(p.ideas[0]?.title || '')}`,
      })),
    [pages, t]
  );
  const activeTitle = pageChapters[active]?.title || '';

  const goTo = (id) => {
    const n = Math.max(0, Math.min(pages.length - 1, id));
    setActive(n);
    pagesRef.current[n]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const pick = (id) => {
    setMenuOpen(false);
    goTo(id);
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
        chapters={pageChapters}
        activeId={active}
        onSelect={goTo}
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
            {pad(active + 1)}
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
          {pageChapters.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`ch-menu-item${i === active ? ' is-active' : ''}`}
              onClick={() => pick(i)}
            >
              <span className="ch-menu-title">{c.title}</span>
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
          text: sections as headings, their slides indented underneath. */}
      <nav className="ireel-toc" aria-label={t('On this page')}>
        {toc.map((sec) => {
          const secActive = pages[active]?.sectionIdx === sec.sectionIdx;
          return (
            <div className={`ireel-toc-group${secActive ? ' is-active' : ''}`} key={sec.sectionIdx}>
              <button type="button" className="ireel-toc-sec" onClick={() => goTo(sec.firstPage)}>
                {t(sec.name)}
              </button>
              <ul className="ireel-toc-items">
                {sec.items.map((it, k) => (
                  <li key={k}>
                    <button
                      type="button"
                      className={`ireel-toc-item${active === it.page ? ' is-active' : ''}`}
                      onClick={() => goTo(it.page)}
                    >
                      {t(it.title)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
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

                {/* Up / down page navigation on the right of the video,
                    matching the landing reel. */}
                <div className="reel-nav">
                  <button
                    type="button"
                    className="reel-nav-btn"
                    aria-label="Previous slide"
                    disabled={i === 0}
                    onClick={() => goTo(i - 1)}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="reel-nav-btn"
                    aria-label="Next slide"
                    disabled={i === pages.length - 1}
                    onClick={() => goTo(i + 1)}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
