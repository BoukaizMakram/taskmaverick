'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Navbar from '@/components/Navbar';

// Up to this many ideas per page — fewer when their combined text is long.
const MAX_IDEAS_PER_PAGE = 4;
const CHAR_BUDGET = 520;

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
 * Build the reel as a list of PAGES. Each section contributes one cover image
 * (its first slide's media, else the section thumb) shown on top, plus its
 * slides grouped into "ideas" (a title + its text) listed underneath — up to
 * MAX_IDEAS_PER_PAGE per page, fewer when the combined text is long. Also
 * returns the sections with their starting page index (drives the dropdown).
 */
function buildDeck(industry) {
  const pages = [];
  const sections = [];
  industry.sections.forEach((sec, sIdx) => {
    sections.push({ id: sIdx, name: sec.name, start: pages.length });

    const firstWithMedia = sec.slides.find((s) => s.media);
    const cover =
      firstWithMedia?.media || (sec.thumb ? { type: 'image', src: sec.thumb } : null);

    // An idea needs at least a title or some text to be worth a row.
    const ideas = sec.slides
      .map((s) => ({ title: s.title, text: s.text }))
      .filter((idea) => idea.title || textLength(idea.text));

    let bucket = [];
    let chars = 0;
    const flush = () => {
      if (!bucket.length) return;
      pages.push({ sectionIdx: sIdx, sectionName: sec.name, media: cover, ideas: bucket });
      bucket = [];
      chars = 0;
    };
    ideas.forEach((idea) => {
      const len = (idea.title || '').length + textLength(idea.text);
      if (bucket.length >= MAX_IDEAS_PER_PAGE || (bucket.length > 0 && chars + len > CHAR_BUDGET)) {
        flush();
      }
      bucket.push(idea);
      chars += len;
    });
    flush();
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
  const { pages } = useMemo(() => buildDeck(industry), [industry]);
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const pagesRef = useRef([]);
  const pad = (n) => String(n).padStart(2, '0');

  const pageChapters = useMemo(
    () => pages.map((p, i) => ({ id: i, title: `${p.sectionName}-${p.ideas[0]?.title || ''}` })),
    [pages]
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
        backTo={{ href: '/industries', label: 'All industries' }}
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
            <span className="ch-menu-title">All industries</span>
            <svg className="ch-menu-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      )}

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
                    const paragraphs = cleanParagraphs(idea.text);
                    return (
                      <div className="ireel-idea" key={k}>
                        {idea.title && <h2 className="ireel-idea-title">{idea.title}</h2>}
                        {paragraphs.map((p, j) => (
                          <p key={j} className="ireel-idea-text">
                            {p}
                          </p>
                        ))}
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
