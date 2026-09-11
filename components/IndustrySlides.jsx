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
          sectionId: sec.id,
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
  // Which sections are expanded in the TOC — a Set, so multiple can stay open
  // at once. Scrolling opens the section in view without collapsing the others.
  const [expandedSecs, setExpandedSecs] = useState(() => new Set()); // all collapsed on open
  const toggleSec = (idx) =>
    setExpandedSecs((cur) => {
      const next = new Set(cur);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  // TOC number-side option: '1' = number before the title ("01  Compliance"),
  // '2' = number after it at the right edge ("Compliance  01"). Press 1 / 2 (or
  // click the toggle) to switch.
  const [side, setSide] = useState('1');
  const pagesRef = useRef([]);
  // While a programmatic jump is scrolling, ignore the scroll observer so the
  // selection lands directly on the target instead of stepping through pages.
  const navLock = useRef(false);
  const navTimer = useRef(null);
  const pad = (n) => String(n).padStart(2, '0');

  // Keys 1 / 2 switch the number's side (left / right of the title); "h" hides /
  // shows the right-hand table-of-contents sidebar (a class on <html> hides it
  // and reclaims its reserved space).
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '1') setSide('1');
      else if (e.key === '2') setSide('2');
      else if (e.key === 'h' || e.key === 'H') {
        document.documentElement.classList.toggle('hide-toc');
      }
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

  // No auto-expand on scroll: an industry opens with every section collapsed and
  // stays that way until the reader clicks a section to expand it. The active
  // section is still tracked (its rectangle sits on the collapsed title, and
  // moves to the active item once the section is manually opened).

  const goTo = (id) => {
    const n = Math.max(0, Math.min(pages.length - 1, id));
    setActive(n);
    // Lock the scroll observer so the highlight jumps straight to the target
    // rather than tracking every page the smooth scroll passes through.
    navLock.current = true;
    clearTimeout(navTimer.current);
    const release = () => {
      navLock.current = false;
      window.removeEventListener('scrollend', release);
      clearTimeout(navTimer.current);
    };
    window.addEventListener('scrollend', release, { once: true });
    navTimer.current = setTimeout(release, 1200);
    // Jump straight to the slide — no animated scroll (matches the landing page).
    pagesRef.current[n]?.scrollIntoView({ behavior: 'auto', block: 'start' });
  };
  // Jump to a section by its first page.
  const goToSection = (sectionIdx) => {
    const sec = toc.find((s) => s.sectionIdx === sectionIdx);
    if (sec) goTo(sec.firstPage);
  };

  // Coming back from the Cases page (?p=<index>): jump straight to the page the
  // reader left, so "Back" lands them where they were.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('p');
    if (raw === null) return;
    const p = Number(raw);
    if (!Number.isInteger(p) || p < 0 || p >= pages.length) return;
    setActive(p);
    requestAnimationFrame(() => {
      pagesRef.current[p]?.scrollIntoView({ block: 'start' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the dropdown in sync with the page in view, and play only that page's
  // video (like the landing reel).
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (navLock.current) return; // don't track pages during a programmatic jump
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
        <div className={`stage-chapters${side === '1' ? ' is-num-left' : ''}`}>
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
        <div className={`ch-menu ireel-menu${side === '1' ? ' is-num-left' : ''}`} role="listbox" aria-label="Jump to a section">
          {toc.map((sec, i) => {
            const secOpen = expandedSecs.has(sec.sectionIdx);
            return (
              <div className={`ch-menu-group${secOpen ? ' is-open' : ''}`} key={sec.sectionIdx}>
                {/* Tapping a section only expands its titles (accordion); tapping
                    a title jumps and closes the menu. */}
                <button
                  type="button"
                  aria-expanded={secOpen}
                  className={`ch-menu-item${sec.sectionIdx === activeSection ? ' is-active' : ''}`}
                  onClick={() => toggleSec(sec.sectionIdx)}
                >
                  <span className="ch-menu-title">{t(sec.name)}</span>
                  <span className="ch-menu-num">{pad(i + 1)}</span>
                  <svg className={`ch-menu-chev${secOpen ? ' is-open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {sec.items.length > 0 && (
                  <div className="ch-menu-subwrap">
                    <ul className="ch-menu-subs">
                      {sec.items.map((it, k) => (
                        <li className="ch-menu-sub-li" key={k}>
                          <button
                            type="button"
                            className={`ch-menu-sub${it.page === active ? ' is-active' : ''}`}
                            tabIndex={secOpen ? 0 : -1}
                            onClick={() => {
                              setMenuOpen(false);
                              goTo(it.page);
                            }}
                          >
                            <span className="ch-menu-sub-letter">
                              {String.fromCharCode(65 + (k % 26))}.
                            </span>
                            <span className="ch-menu-sub-text">{t(it.title)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* Persistent table of contents on the right of the reel (desktop only) —
          the SAME tree design as the landing sidebar (.lp-toc.lp-opt-2): a left
          ▶ toggle, numbered subsections, and L-shaped connectors. */}
      <nav className="ireel-toc lp-toc lp-opt-2" aria-label={t('On this page')}>
        <div className="ireel-toc-list">
          {toc.map((sec) => {
            const secActive = pages[active]?.sectionIdx === sec.sectionIdx;
            const full = expandedSecs.has(sec.sectionIdx);
            return (
              <div
                className={`ireel-toc-group${secActive ? ' is-active' : ''}${full ? ' is-open' : ''}`}
                key={sec.sectionIdx}
              >
                <button
                  type="button"
                  className="ireel-toc-sec"
                  aria-expanded={full}
                  onClick={() => toggleSec(sec.sectionIdx)}
                >
                  <span className="lp-tree-toggle" aria-hidden="true">
                    <svg className={`lp-tree-chev${full ? ' is-open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                  <span className="ireel-toc-name">{t(sec.name)}</span>
                </button>
                {/* Collapsed shows NO items (0); expanding reveals all as an
                    L-tree (grid-rows animation, see .isl-page .lp-items). */}
                {sec.items.length > 0 && (
                  <div className={`lp-items${full ? ' is-open' : ''}`}>
                    <ul className="ireel-toc-items">
                      {sec.items.map((it, k) => (
                        <li className="ireel-toc-item-li" key={it.page}>
                          <button
                            type="button"
                            className={`ireel-toc-item${it.page === active ? ' is-active' : ''}`}
                            onClick={() => goTo(it.page)}
                          >
                            <span className="lp-mark">{k + 1}.</span>
                            {t(it.title)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
    </>
  );
}
