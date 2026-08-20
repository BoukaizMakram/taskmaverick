'use client';

// ---------------------------------------------------------------------------
// MobileReel — the mobile landing hero as a TikTok-style vertical pager.
// One full-screen page per chapter (the chapter's video/scene + its title),
// vertical scroll-snap so each swipe moves one page. A persistent chapter
// selector stays pinned at the top: it updates as you swipe (Intersection
// Observer) and jumps to a page (or to the Use Cases section) when changed.
// Shown only <=900px; desktop keeps the two-column hero.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

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
        // Recenter this chapter when the video is played.
        onPlay={(e) => {
          e.currentTarget
            .closest('.reel-page')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />
    );
  }

  return (
    <div className="video-placeholder">
      <span className="play-btn" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
          <path d="M8 5.14v13.72c0 .9 1 1.45 1.75.95l10.29-6.86a1.14 1.14 0 000-1.9L9.75 4.19A1.14 1.14 0 008 5.14z" />
        </svg>
      </span>
    </div>
  );
}

export default function MobileReel({
  chapters = [],
  activeId,
  onSelect,
  atUseCases = false,
  onIndustries,
  onExitUseCases,
  src,
  poster,
}) {
  const reelRef = useRef(null);
  const pages = useRef({});
  const [menuOpen, setMenuOpen] = useState(false);
  const pad = (n) => String(n).padStart(2, '0');
  const total = chapters.length;

  // Back-up button: clear the industries state and scroll back to the chapter
  // we left. Everything lives in the one window scroll now, so a plain
  // scrollIntoView (honouring scroll-padding-top) lands it below nav + selector.
  const goBackToChapter = () => {
    onExitUseCases?.();
    pages.current[activeId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Keep the selector in sync with whichever page is in view. The reel now
  // scrolls with the window (one scrollable area), so observe the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const e of entries) {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
        }
        if (best && best.intersectionRatio >= 0.5) {
          const id = Number(best.target.dataset.id);
          if (id) onSelect?.(id);
        }
      },
      { threshold: [0.5, 0.75, 1] }
    );

    Object.values(pages.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [chapters, onSelect]);

  const onPick = (v) => {
    if (v === 'use-cases') {
      document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    onSelect?.(Number(v));
    pages.current[v]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const idx = chapters.findIndex((c) => c.id === activeId);
  const pos = idx >= 0 ? idx + 1 : 1;
  const activeTitle = chapters[idx]?.title || chapters[0]?.title || '';

  const pick = (v) => {
    setMenuOpen(false);
    onPick(v);
  };

  return (
    <div className="reel-wrap">
      {/* persistent chapter selector */}
      <div className="reel-bar">
        <div className={`stage-chapters${atUseCases ? ' is-back' : ''}`}>
          <button
            type="button"
            className="stage-chapters-select"
            aria-haspopup={atUseCases ? undefined : 'listbox'}
            aria-expanded={atUseCases ? undefined : menuOpen}
            aria-label={atUseCases ? `Back to ${activeTitle}` : undefined}
            onClick={() => {
              if (atUseCases) {
                goBackToChapter();
                return;
              }
              setMenuOpen((o) => !o);
            }}
          >
            {activeTitle}
          </button>
          <span className="stage-chapters-count" aria-hidden="true">
            {pad(pos)}
          </span>
          <span className={`stage-chapters-chev${menuOpen || atUseCases ? ' is-open' : ''}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>

      {/* full-page dropdown menu */}
      {menuOpen && !atUseCases && (
        <div className="ch-menu" role="listbox" aria-label="Jump to a section">
            {chapters.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={c.id === activeId}
                className={`ch-menu-item${c.id === activeId ? ' is-active' : ''}`}
                onClick={() => pick(String(c.id))}
              >
                <span className="ch-menu-title">{c.title}</span>
                <span className="ch-menu-num">{pad(i + 1)}</span>
              </button>
            ))}
            <button
              type="button"
              className="ch-menu-item ch-menu-item--featured"
              onClick={() => {
                setMenuOpen(false);
                onIndustries?.();
              }}
            >
              <span className="ch-menu-title">Use Cases by Industry</span>
              <svg className="ch-menu-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
        </div>
      )}

      {/* one snap page per chapter */}
      <div className="reel" ref={reelRef}>
        {chapters.map((c) => (
          <section
            className="reel-page"
            key={c.id}
            data-id={c.id}
            ref={(el) => {
              pages.current[c.id] = el;
            }}
          >
            {/* Every page reads like the hero: video up top, headline under it,
                then the trust-badge cards. */}
            <div className="reel-media video-frame">
              <ChapterMedia chapter={c} src={src} poster={poster} />
            </div>

            <h1 className="reel-hero-title">{c.heroTitle || c.title}</h1>

            <ul className="stage-badges reel-badges">
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

            <button type="button" className="reel-uc" onClick={() => onIndustries?.()}>
              Use Cases by Industry
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
