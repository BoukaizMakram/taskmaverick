'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Navbar from '@/components/Navbar';

/*
 * Flatten an industry's sections into one linear slide list. Media "carries
 * forward" inside a section (the source only stamps media on the first slide),
 * falling back to the section thumbnail so every slide has a visual. Also return
 * the sections with their starting slide index (drives the nav dropdown).
 */
function buildDeck(industry) {
  const flat = [];
  const sections = [];
  industry.sections.forEach((sec, sIdx) => {
    sections.push({ id: sIdx, name: sec.name, start: flat.length });
    let carried = sec.thumb ? { type: 'image', src: sec.thumb } : null;
    sec.slides.forEach((s, i) => {
      if (s.media) carried = s.media;
      flat.push({
        sectionIdx: sIdx,
        sectionName: sec.name,
        indexInSection: i,
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

// Industry deck rendered as a full-screen scroll-snap reel — one slide per page,
// same layout language and nav dropdown as the landing reel. The dropdown lists
// the industry's sections; picking one jumps to that section's first slide.
export default function IndustrySlides({ industry }) {
  const { flat } = useMemo(() => buildDeck(industry), [industry]);
  const [active, setActive] = useState(0);
  const pagesRef = useRef([]);

  // The nav dropdown lists every slide of the reel, labelled "Section-Title"
  // (e.g. "Philosophy-Traffic Systems"); the navbar renders the slide number
  // as its own badge. Picking one jumps straight to that slide.
  const slideChapters = useMemo(
    () => flat.map((s, i) => ({ id: i, title: `${s.sectionName}-${s.title}` })),
    [flat]
  );

  const jumpToSlide = (id) => {
    setActive(id);
    pagesRef.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Keep the dropdown in sync with the slide currently in view, and play only
  // that slide's video (like the landing reel).
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
  }, [flat.length]);

  return (
    <>
      <Navbar
        chapters={slideChapters}
        activeId={active}
        onSelect={jumpToSlide}
        backTo={{ href: '/industries', label: 'All industries' }}
      />

      <div className="ireel">
        {flat.map((slide, i) => {
          const paragraphs = cleanParagraphs(slide.text);
          return (
            <section
              className="ireel-page"
              key={i}
              data-idx={i}
              ref={(el) => {
                pagesRef.current[i] = el;
              }}
            >
              <div className="stage-inner">
                <div className="ireel-stage">
                  <div className="video-frame ireel-frame">
                    <SlideMedia media={slide.media} playing={i === active} />
                  </div>

                  {/* Desktop-only up/down slide navigation, to the frame's right. */}
                  <div className="ireel-nav">
                    <button
                      type="button"
                      className="ireel-navbtn"
                      aria-label="Previous slide"
                      disabled={i === 0}
                      onClick={() => jumpToSlide(i - 1)}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="ireel-navbtn"
                      aria-label="Next slide"
                      disabled={i === flat.length - 1}
                      onClick={() => jumpToSlide(i + 1)}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="stage-head">
                  {slide.title && <h2 className="stage-cta">{slide.title}</h2>}
                  {paragraphs.map((p, j) => (
                    <p key={j} className="ireel-text">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
