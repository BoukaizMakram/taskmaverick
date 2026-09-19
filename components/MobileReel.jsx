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
import CtaPoster from '@/components/CtaPoster';
import PostedMissionsScene from '@/components/scenes/PostedMissionsScene';
import AutomationDemoScene from '@/components/scenes/AutomationDemoScene';
import { BADGES, BadgeIcon } from '@/components/HeroVideo';
import { PHILOSOPHY } from '@/lib/chapters';
import { useT } from '@/lib/i18n/LanguageProvider';

const SCENES = {
  'posted-missions': PostedMissionsScene,
  'automation-demo': AutomationDemoScene,
};

function ChapterMedia({ chapter, src, poster }) {
  // A coded scene wins; the cover image is its poster (shown until you hit play).
  const Scene = chapter.scene ? SCENES[chapter.scene] : null;
  if (Scene) return <Scene poster={chapter.cover} title={chapter.heroTitle || chapter.title} />;

  const video = chapter.src || src;
  if (video) {
    return (
      <CoverPlayer
        cover={chapter.cover}
        video={video}
        poster={poster}
        alt={chapter.heroTitle || chapter.title}
      />
    );
  }

  // No coded scene and no video → a black poster with the chapter's CTA inside
  // the frame, matching the Automating Management scene poster.
  return <CtaPoster title={chapter.heroTitle || chapter.title} bg={chapter.bg} />;
}

// Blue "Play" button pushed to the bottom-right corner, protruding outside the
// video frame. Shown on every chapter. Clicking it plays whatever is in the
// frame — the animation scene, a real video, or nothing (placeholder).
function CornerPlay() {
  const t = useT();
  const onClick = (e) => {
    const wrap = e.currentTarget.closest('.video-frame-wrap');
    if (!wrap) return;
    const scene = wrap.querySelector('.scene, .ad-stage');
    if (scene) {
      scene.click(); // the scene / demo stage toggles play/pause on click
      return;
    }
    const video = wrap.querySelector('video');
    if (video) {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    }
  };
  return (
    <button type="button" className="corner-play corner-play--inside" aria-label="Play video" onClick={onClick}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M8 5.14v13.72c0 .9 1 1.45 1.75.95l10.29-6.86a1.14 1.14 0 000-1.9L9.75 4.19A1.14 1.14 0 008 5.14z" />
      </svg>
      {t('Play')}
    </button>
  );
}

export default function MobileReel({
  chapters = [],
  philosophy,
  activeId,
  onSelect,
  atUseCases = false,
  onIndustries,
  onExitUseCases,
  src,
  poster,
}) {
  const t = useT();
  // Field-level fallback: a partially-saved philosophy (e.g. only heroTitle)
  // must still fall back to the seed badges/title, never hide them.
  const phil = {
    ...PHILOSOPHY,
    ...(philosophy || {}),
    badges: philosophy?.badges?.length ? philosophy.badges : PHILOSOPHY.badges,
  };
  const reelRef = useRef(null);
  const pages = useRef({});
  const [menuOpen, setMenuOpen] = useState(false);
  const pad = (n) => String(n).padStart(2, '0');
  const total = chapters.length;

  // Alt+2 vertically centers the active reel page's content (mobile); Alt+1
  // reverts to the default top alignment. Toggles a class on <html>.
  useEffect(() => {
    const onKey = (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === '2' || e.code === 'Digit2') {
        e.preventDefault();
        document.documentElement.classList.add('reel-vcenter');
      } else if (e.key === '1' || e.code === 'Digit1') {
        e.preventDefault();
        document.documentElement.classList.remove('reel-vcenter');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
          const raw = best.target.dataset.id;
          const id = raw === 'philosophy' ? 'philosophy' : Number(raw);
          if (id) onSelect?.(id);
          // Mark the most-visible page so its badges animate in; clearing the
          // others lets them re-animate when swiped back to.
          Object.values(pages.current).forEach((el) => {
            if (el) el.classList.toggle('is-in-view', el === best.target);
          });
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
  const activeTitle = t(chapters[idx]?.title || chapters[0]?.title || '');

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
                <span className="ch-menu-title">{t(c.title)}</span>
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
              <span className="ch-menu-title">{t('Cases')} <span className="uc-by">{t('by')}</span> {t('Industry')}</span>
              <svg className="ch-menu-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </button>
        </div>
      )}

      {/* one snap page per chapter */}
      <div className="reel" ref={reelRef}>
        {/* Intro page — Taskmaverick's philosophy — before Operations. */}
        <section className="reel-page" data-id="philosophy" ref={(el) => (pages.current.philosophy = el)}>
          <div className="reel-media video-frame-wrap">
            <div className="video-frame">
              <CtaPoster title={phil.heroTitle} editPath={['philosophy', 'heroTitle']} bg={phil.bg} bgPath={['philosophy', 'bg']} />
            </div>
            <CornerPlay />
          </div>
          <ul className="stage-badges reel-badges">
            {(phil.badges || []).map((b, bi) => (
              <li className="stage-badge" key={bi} style={{ '--bi': bi }}>
                <span className="stage-badge-icon">
                  <BadgeIcon name={b.icon} />
                </span>
                <span className="stage-badge-text">
                  <b>{t(b.title)}</b>
                  <small>{t(b.sub)}</small>
                </span>
              </li>
            ))}
          </ul>
          <a
            className="stage-uc reel-uc"
            href="#use-cases"
            onClick={(e) => {
              e.preventDefault();
              onIndustries?.();
            }}
          >
            <span>{t('Cases')} <span className="uc-by">{t('by')}</span> {t('Industry')}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </section>
        {chapters.map((c) => (
          <section
            className="reel-page"
            key={c.id}
            data-id={c.id}
            ref={(el) => {
              pages.current[c.id] = el;
            }}
          >
            {/* Every page reads like the hero: centered video with the corner
                Play button, then the trust-badge cards. */}
            <div className="reel-media video-frame-wrap">
              <div className="video-frame">
                <ChapterMedia chapter={c} src={src} poster={poster} />
              </div>
              <CornerPlay />
            </div>

            <ul className="stage-badges reel-badges">
              {(c.badges || BADGES).slice(0, 2).map((b, bi) => (
                <li className="stage-badge" key={b.title} style={{ '--bi': bi }}>
                  <span className="stage-badge-icon">
                    <BadgeIcon name={b.icon} />
                  </span>
                  <span className="stage-badge-text">
                    <b>{t(b.title)}</b>
                    <small>{t(b.sub)}</small>
                  </span>
                </li>
              ))}
            </ul>

            <a
              className="stage-uc reel-uc"
              href="#use-cases"
              onClick={(e) => {
                e.preventDefault();
                onIndustries?.();
              }}
            >
              <span>{t('Cases')} <span className="uc-by">{t('by')}</span> {t('Industry')}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </a>
          </section>
        ))}
      </div>
    </div>
  );
}
