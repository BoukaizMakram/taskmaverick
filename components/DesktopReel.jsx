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
import CornerPlay from '@/components/CornerPlay';
import CtaPoster from '@/components/CtaPoster';
import PostedMissionsScene from '@/components/scenes/PostedMissionsScene';
import AutoManagerScene from '@/components/scenes/AutoManagerScene';
import { BADGES, BadgeIcon } from '@/components/HeroVideo';
import { PHILOSOPHY } from '@/lib/chapters';
import { useT } from '@/lib/i18n/LanguageProvider';
import { useEdit, EditText, EditIcon, EditVideoButton } from '@/components/InlineEdit';

const SCENES = {
  'posted-missions': PostedMissionsScene,
};

function ChapterMedia({ chapter, src, poster, editPath, bgPath }) {
  const edit = useEdit();
  // In the admin editor, always show the editable headline poster — never a
  // playing video or coded scene — so the chapter's text can be edited in place.
  if (edit && editPath) {
    return (
      <CtaPoster
        title={chapter.heroTitle || chapter.title}
        editPath={editPath}
        bg={chapter.bg}
        bgPath={bgPath}
      />
    );
  }

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

  // No coded scene and no video → a poster with the chapter's CTA inside the
  // frame (selectable background style).
  return (
    <CtaPoster
      title={chapter.heroTitle || chapter.title}
      editPath={editPath}
      bg={chapter.bg}
      bgPath={bgPath}
    />
  );
}

export default function DesktopReel({ chapters = [], philosophy, activeId, onSelect, onIndustries, src, poster }) {
  const t = useT();
  const edit = useEdit();
  // Field-level fallback: a partially-saved philosophy (e.g. only heroTitle)
  // must still fall back to the seed badges/title, never hide them.
  const phil = {
    ...PHILOSOPHY,
    ...(philosophy || {}),
    badges: philosophy?.badges?.length ? philosophy.badges : PHILOSOPHY.badges,
  };
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
          const raw = best.target.dataset.id;
          const id = raw === 'philosophy' ? 'philosophy' : Number(raw);
          if (id) {
            visibleId.current = id;
            onSelect?.(id);
          }
          // Mark the most-visible page so its badges (and any reveal) animate in;
          // clearing it on the others lets them re-animate when scrolled back to.
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

  // Navbar-driven selection: scroll the window to the chosen chapter. (Skip when
  // the change came from the observer above — the page is already in view.)
  // scroll-padding-top on <html> keeps the landing below the sticky nav.
  useEffect(() => {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    if (activeId === visibleId.current) return;
    const el = pages.current[activeId];
    // Jump straight to the chosen page — no animated scroll racing past every
    // chapter in between (the reel snaps hard between pages anyway).
    if (el) smoothScrollTo(el, { instant: true });
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
      // While the page is restoring back into Use Cases (nav-back from an
      // industry), Landing owns is-free-scroll — don't fight it as the section
      // top drifts during layout settle, or snap re-engages and half-covers it.
      if (root.classList.contains('lp-restoring')) return;
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
        {/* Intro page — Taskmaverick's philosophy — before Operations. */}
        <section
          className="dreel-page"
          id="dchapter-philosophy"
          data-id="philosophy"
          ref={(el) => {
            pages.current.philosophy = el;
          }}
        >
          <div className="stage-inner">
            <div className="video-frame-wrap">
              <div className="video-frame">
                <CtaPoster title={phil.heroTitle} editPath={['philosophy', 'heroTitle']} bg={phil.bg} bgPath={['philosophy', 'bg']} />
              </div>
              <CornerPlay />
            </div>
            <ul className="stage-badges">
              {(phil.badges || []).map((b, bi) => (
                <li className="stage-badge" key={bi} style={{ '--bi': bi }}>
                  <span className="stage-badge-icon">
                    <EditIcon name={b.icon} path={['philosophy', 'badges', bi, 'icon']} />
                  </span>
                  <span className="stage-badge-text">
                    <EditText as="b" path={['philosophy', 'badges', bi, 'title']} value={edit ? b.title : t(b.title)} />
                    <EditText as="small" path={['philosophy', 'badges', bi, 'sub']} value={edit ? b.sub : t(b.sub)} />
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
              <span>{t('Cases')} <span className="uc-by">{t('by')}</span> {t('Industry')}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </a>
          </div>
        </section>
        {chapters.map((c, i) => (
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
              <div className="video-frame-wrap">
                <div className="video-frame">
                  <ChapterMedia
                    chapter={c}
                    src={src}
                    poster={poster}
                    editPath={['chapters', c.baseIndex, 'heroTitle']}
                    bgPath={['chapters', c.baseIndex, 'bg']}
                  />
                </div>
                <CornerPlay />
                <EditVideoButton path={['chapters', c.baseIndex, 'src']} />
              </div>

              <ul className="stage-badges">
                {(c.badges?.length ? c.badges : BADGES).slice(0, 2).map((b, bi) => (
                  <li className="stage-badge" key={bi} style={{ '--bi': bi }}>
                    <span className="stage-badge-icon">
                      <EditIcon name={b.icon} path={['chapters', c.baseIndex, 'badges', bi, 'icon']} />
                    </span>
                    <span className="stage-badge-text">
                      <EditText as="b" path={['chapters', c.baseIndex, 'badges', bi, 'title']} value={edit ? b.title : t(b.title)} />
                      <EditText as="small" path={['chapters', c.baseIndex, 'badges', bi, 'sub']} value={edit ? b.sub : t(b.sub)} />
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
                <span>{t('Cases')} <span className="uc-by">{t('by')}</span> {t('Industry')}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </a>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
