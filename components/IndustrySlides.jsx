'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

/*
 * Flatten an industry's sections into one linear slide list. Media "carries
 * forward" inside a section (the source only stamps media on the first slide),
 * falling back to the section thumbnail so every slide has a visual.
 */
function buildDeck(industry) {
  const flat = [];
  industry.sections.forEach((sec, sIdx) => {
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
  return flat;
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
// same layout language as the landing reel (media frame + title + text).
export default function IndustrySlides({ industry }) {
  const flat = useMemo(() => buildDeck(industry), [industry]);
  const [active, setActive] = useState(0);
  const pagesRef = useRef([]);

  // Play only the slide currently in view (like the landing reel).
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
    <div className="ireel">
      <Link href="/#use-cases" className="ireel-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        All use cases
      </Link>

      {flat.map((slide, i) => {
        const paragraphs = cleanParagraphs(slide.text);
        const showSection =
          slide.sectionName &&
          slide.sectionName.trim().toLowerCase() !== (slide.title || '').trim().toLowerCase();
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
              <div className="video-frame ireel-frame">
                <SlideMedia media={slide.media} playing={i === active} />
              </div>

              <div className="stage-head">
                <span className="stage-eyebrow">
                  {industry.name}
                  {showSection ? ` · ${slide.sectionName}` : ''}
                </span>
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
  );
}
