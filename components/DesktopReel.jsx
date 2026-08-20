'use client';

// ---------------------------------------------------------------------------
// DesktopReel — the desktop hero as a snap-scroll chapter reel (same idea as
// MobileReel, but keeping the desktop layout: centered video + title +
// horizontal badges + "Use Cases by Industry"). Scrolling snaps chapter to
// chapter; past the last chapter it flows into the Use Cases section (no snap).
// The navbar Chapters dropdown drives it (selecting scrolls the reel), and the
// reel keeps the dropdown in sync as you scroll. Shown only > 900px.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { smoothScrollTo } from '@/lib/smoothScroll';
import CoverPlayer from '@/components/CoverPlayer';
import PostedMissionsScene from '@/components/scenes/PostedMissionsScene';
import { BADGES, BadgeIcon } from '@/components/HeroVideo';

const SCENES = {
  'posted-missions': PostedMissionsScene,
};

function ChapterMedia({ chapter, src, poster }) {
  if (chapter.cover) {
    return (
      <CoverPlayer
        cover={chapter.cover}
        video={chapter.src || src || ''}
        poster={poster}
        alt={chapter.heroTitle || chapter.title}
      />
    );
  }

  const Scene = chapter.scene ? SCENES[chapter.scene] : null;
  if (Scene) return <Scene />;

  const s = chapter.src || src;
  if (s) {
    return (
      <video
        className="video-el"
        src={s}
        poster={poster || undefined}
        controls
        playsInline
        preload="metadata"
        // Free smooth scroll means you can pause between chapters — hitting play
        // recenters this chapter's page in the viewport.
        onPlay={(e) => {
          const page = e.currentTarget.closest('.dreel-page');
          if (page) smoothScrollTo(page);
        }}
      />
    );
  }

  return (
    <div className="video-placeholder">
      <span className="play-btn" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
          <path d="M8 5.14v13.72c0 .9 1 1.45 1.75.95l10.29-6.86a1.14 1.14 0 000-1.9L9.75 4.19A1.14 1.14 0 008 5.14z" />
        </svg>
      </span>
    </div>
  );
}

export default function DesktopReel({ chapters = [], activeId, onSelect, onIndustries, src, poster }) {
  const wrapRef = useRef(null);
  const pages = useRef({});
  const visibleId = useRef(activeId);

  // Keep the navbar dropdown in sync with whichever page is snapped. The reel
  // now scrolls with the window (one scrollbar for the whole page), so observe
  // against the viewport rather than an inner scroll container.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const e of entries) {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
        }
        if (best && best.intersectionRatio >= 0.5) {
          const id = Number(best.target.dataset.id);
          if (id) {
            visibleId.current = id;
            onSelect?.(id);
          }
        }
      },
      { threshold: [0.5, 0.75, 1] }
    );
    Object.values(pages.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [chapters, onSelect]);

  // Navbar-driven selection: scroll the window to the chosen chapter. (Skip when
  // the change came from the observer above — the page is already in view.)
  // scroll-padding-top on <html> keeps the landing below the sticky nav.
  useEffect(() => {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    if (activeId === visibleId.current) return;
    const el = pages.current[activeId];
    if (el) smoothScrollTo(el);
  }, [activeId]);

  // Desktop: the reel hard-flips chapter-to-chapter (mandatory scroll-snap), but
  // once the Use Cases section reaches the nav line the whole page below it
  // (industries, CTA, footer) must scroll FREELY — no snap trap, and no awkward
  // half-snap on the reel→Use Cases boundary. Toggle a class on <html> that
  // turns scroll-snap off while Use Cases (or anything after it) is at the top.
  useEffect(() => {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    const root = document.documentElement;
    const navH = parseInt(getComputedStyle(root).getPropertyValue('--nav-h'), 10) || 64;
    const update = () => {
      const uc = document.getElementById('use-cases');
      if (!uc) return;
      // Free-scroll once the Use Cases top has scrolled up to (or past) the nav.
      const free = uc.getBoundingClientRect().top <= navH + 2;
      root.classList.toggle('is-free-scroll', free);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      root.classList.remove('is-free-scroll');
    };
  }, []);

  return (
    <div className="dreel-wrap" ref={wrapRef}>
      <div className="dreel">
        {chapters.map((c) => (
          <section
            className="dreel-page"
            key={c.id}
            id={`dchapter-${c.id}`}
            data-id={c.id}
            ref={(el) => {
              pages.current[c.id] = el;
            }}
          >
            <div className="stage-inner">
              <div className="video-frame">
                <ChapterMedia chapter={c} src={src} poster={poster} />
              </div>

              <div className="stage-head">
                <h1 className="stage-cta">
                  {c.heroTitle || c.title}
                </h1>
              </div>

              <ul className="stage-badges">
                {(c.badges || BADGES).map((b) => (
                  <li className="stage-badge" key={b.title}>
                    <span className="stage-badge-icon">
                      <BadgeIcon name={b.icon} />
                    </span>
                    <span className="stage-badge-text">
                      <b>{b.title}</b>
                      <small>{b.sub}</small>
                    </span>
                  </li>
                ))}
              </ul>

              <a
                className="stage-uc"
                href="#use-cases"
                onClick={(e) => {
                  e.preventDefault();
                  onIndustries?.();
                }}
              >
                Use Cases by Industry
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
