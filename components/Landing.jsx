'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { smoothScrollTo } from '@/lib/smoothScroll';
import { useT } from '@/lib/i18n/LanguageProvider';
import Navbar from '@/components/Navbar';
import LandingToc from '@/components/LandingToc';
import DesktopReel from '@/components/DesktopReel';
import MobileReel from '@/components/MobileReel';
import IndustryGrid from '@/components/IndustryGrid';
import { useLandingContent } from '@/lib/useLandingContent';
import { buildLandingChapters } from '@/lib/landingDefaults';
import { useEdit, EditText } from '@/components/InlineEdit';

/* ---- tiny inline icon set (Feather-style, stroked) -------------------- */
const ICONS = {
  play: <polygon points="6 4 20 12 6 20 6 4" />,
  check: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </>
  ),
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  chevron: <path d="M9 6l6 6-6 6" />,
};

function Icon({ name, size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

export default function Landing({ content: contentProp }) {
  const t = useT();
  const container = useRef(null);
  // Editable content: an explicit prop (admin preview) wins; otherwise load the
  // saved local content, falling back to defaults.
  const editCtx = useEdit();
  const fetched = useLandingContent();
  const content = editCtx?.content || contentProp || fetched;
  const chapters = useMemo(
    () => buildLandingChapters(content.chapters, content.outline),
    [content]
  );
  const [activeId, setActiveId] = useState('philosophy'); // land on the Home page
  // True while the industries (Use Cases) section is the current view. While
  // it's true the chapter selector freezes on the chapter you left and turns
  // into a blue "back up" button — see Navbar / MobileReel.
  const [atUseCases, setAtUseCases] = useState(false);
  const atUseCasesRef = useRef(false);
  const lockRef = useRef(false); // ignore observer updates during a scripted scroll
  const restoringRef = useRef(false); // restoring the selection after nav-back

  // Preview toggle for the cover play-control style. Press:
  //   1 (default) → floating white chip
  //   2           → white corner tab
  //   3           → real cut-out (the image is masked out of the corner)
  // Toggles mutually-exclusive classes on <html> that the .cover-play CSS reads.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      // Ignore modifier combos (e.g. Ctrl+Alt+1 toggles the language switcher).
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const root = document.documentElement;
      if (e.key === '1') {
        root.classList.remove('cover-cutout', 'cover-mask');
      } else if (e.key === '2') {
        // Swap the use-cases chevron between up (default) and left ("back").
        root.classList.toggle('uc-arrow-left');
      } else if (e.key === '3') {
        root.classList.add('cover-mask');
        root.classList.remove('cover-cutout');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Remember the active chapter across navigation. Leaving for an industry page
  // and coming back via the nav-back (/#use-cases) remounts the landing; without
  // this the sidebar selection would reset to the first chapter.
  useEffect(() => {
    // Only when coming back to the industries view (nav-back → /#use-cases): put
    // the page into that view and restore the chapter the sidebar was on.
    if (typeof window === 'undefined' || window.location.hash !== '#use-cases') return;
    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem('lpActiveId')) || 0;
    } catch {
      /* sessionStorage unavailable */
    }
    // Freeze persistence + the observer while we settle back into Use Cases so
    // nothing clobbers the restored selection with a chapter briefly in view.
    restoringRef.current = true;
    atUseCasesRef.current = true;
    lockRef.current = true;
    setAtUseCases(true);
    // Cover the restore (jump + settle) with the logo loader so the reader never
    // sees the page scrolling itself into place. On a full reload the head script
    // already added this class before first paint; add it here too for client nav.
    document.documentElement.classList.add('tm-boot-restore');
    // is-free-scroll turns snapping off so Use Cases lands flush; lp-restoring
    // tells the reel's snap handler to leave it alone while the remounted page
    // settles (otherwise a drifting section top re-engages snap and half-covers).
    document.documentElement.classList.add('is-free-scroll', 'lp-restoring');
    if (saved) setActiveId(saved);
    const root = document.documentElement;
    const navH = parseInt(getComputedStyle(root).getPropertyValue('--nav-h'), 10) || 64;
    const jump = () => smoothScrollTo('use-cases', { instant: true });
    // The section is "in place" once its top has reached the nav line. We keep
    // re-asserting the jump each frame until then (ScrollSmoother can take a few
    // frames to init on a cold load), so the loader lifts the instant the page is
    // actually positioned — not a frame before (which showed the scroll replay)
    // and not on a long fixed timer (which felt slow).
    const positioned = () => {
      const uc = document.getElementById('use-cases');
      return !!uc && Math.abs(uc.getBoundingClientRect().top - navH) <= 4;
    };
    let startTs = 0;
    let rafId = 0;
    let doneTimer = 0;
    const finalize = () => {
      if (saved) setActiveId(saved); // re-assert after the jump
      lockRef.current = false;
      restoringRef.current = false;
      root.classList.remove('lp-restoring');
      root.classList.add('tm-boot-restore-out'); // begin the fade
      doneTimer = window.setTimeout(() => {
        root.classList.remove('tm-boot-restore', 'tm-boot-restore-out');
      }, 260);
    };
    const tick = (ts) => {
      if (!startTs) startTs = ts;
      jump();
      const elapsed = ts - startTs;
      // Hide once positioned (with a tiny floor so the fade never flickers), or
      // after a 1500ms safety cap if something never settles.
      if ((positioned() && elapsed > 150) || elapsed > 1500) {
        finalize();
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(doneTimer);
      document.documentElement.classList.remove(
        'lp-restoring',
        'tm-boot-restore',
        'tm-boot-restore-out'
      );
    };
  }, []);
  useEffect(() => {
    // Don't persist while restoring — the mount-time write would overwrite the
    // saved value before the restore applies.
    if (restoringRef.current) return;
    try {
      sessionStorage.setItem('lpActiveId', String(activeId));
    } catch {
      /* ignore */
    }
  }, [activeId]);

  // Hold the lock until a scripted scroll actually settles (scroll events go
  // quiet), instead of a fixed timeout — a jump from chapter 3 down to the
  // industries section can take well over a second.
  const holdLockUntilSettled = useCallback(() => {
    lockRef.current = true;
    let t = window.setTimeout(release, 1800); // safety cap
    const onScroll = () => {
      window.clearTimeout(t);
      t = window.setTimeout(release, 150);
    };
    function release() {
      lockRef.current = false;
      window.removeEventListener('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }, []);

  // While pinned to the industries section the selector stays on the chapter you
  // left. When a chapter scrolls back into view (you went back up), clear that
  // state so the selector returns to the normal dropdown for the live chapter.
  const handleSelect = useCallback((id) => {
    if (lockRef.current || restoringRef.current) return; // keep the selector pinned
    if (atUseCasesRef.current) {
      atUseCasesRef.current = false;
      setAtUseCases(false);
    }
    setActiveId(id);
  }, []);

  // Industries / "Use Cases by Industry" → scroll down to the section, freeze
  // the selector on the current chapter, and flip it to the back-up button.
  const enterUseCases = useCallback(() => {
    atUseCasesRef.current = true;
    setAtUseCases(true);
    // Turn OFF scroll-snap before the jump so nothing half-snaps a reel page
    // above the section — Use Cases lands flush under the nav and covers the view.
    document.documentElement.classList.add('is-free-scroll');
    smoothScrollTo('use-cases', { instant: true }); // jump, don't animate
    holdLockUntilSettled();
  }, [holdLockUntilSettled]);

  // Philosophy → the intro reel page (before Operations). Mark it active (so the
  // Philosophy nav button highlights and the sidebar shows nothing selected) and
  // lock the observer so scrolling up past chapter 1 doesn't reselect it.
  const goToPhilosophy = useCallback(() => {
    atUseCasesRef.current = false;
    setAtUseCases(false);
    setActiveId('philosophy');
    holdLockUntilSettled();
    const mobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
    if (mobile) {
      document
        .querySelector('.reel-page[data-id="philosophy"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      smoothScrollTo('dchapter-philosophy');
    }
  }, [holdLockUntilSettled]);

  // Back-up button → clear the state; the caller scrolls back to its chapter
  // (desktop via #dchapter-<id>, mobile via the reel page). Explicitly drop the
  // free-scroll/restoring classes so the sidebar reliably slides back in — the
  // reel's scroll handler alone was sometimes missed after an instant jump (or
  // while still restoring from an industry), leaving the menu stuck hidden.
  const exitUseCases = useCallback(() => {
    atUseCasesRef.current = false;
    restoringRef.current = false;
    setAtUseCases(false);
    document.documentElement.classList.remove('is-free-scroll', 'lp-restoring');
    holdLockUntilSettled();
  }, [holdLockUntilSettled]);

  // Outline sidebar → jump the reel to a chapter. Set it active and HOLD the
  // observer lock so the highlight stays on the clicked item instead of stepping
  // through every chapter the scripted scroll passes, then scroll the reel.
  const goToChapter = useCallback(
    (id) => {
      if (id == null) return;
      atUseCasesRef.current = false;
      setAtUseCases(false);
      setActiveId(id);
      holdLockUntilSettled();
      const mobile =
        typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
      if (mobile) {
        document
          .querySelector(`.reel-page[data-id="${id}"]`)
          ?.scrollIntoView({ behavior: 'auto', block: 'start' });
      } else {
        smoothScrollTo(`dchapter-${id}`, { instant: true });
      }
    },
    [holdLockUntilSettled]
  );

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      // Intro reveal only. Scrolling itself is now native CSS scroll-snap — a
      // hard chapter-to-chapter flip (see the desktop reel rules in
      // globals.css), the same pager the mobile reel uses. No ScrollSmoother.
      gsap.from('.js-nav', { y: -28, autoAlpha: 0, duration: 0.6, ease: 'power3.out' });
    },
    { scope: container }
  );

  return (
    <div className="page lp-page" ref={container}>
      <Navbar
        chapters={chapters}
        activeId={activeId}
        onSelect={handleSelect}
        atUseCases={atUseCases}
        onIndustries={enterUseCases}
        onExitUseCases={exitUseCases}
        onPhilosophy={goToPhilosophy}
      />

      {/* Right-hand outline sidebar (replaces the navbar chapter dropdown on
          desktop). Items map to reel chapters — see LandingToc. */}
      <LandingToc
        outline={content.outline}
        chapters={chapters}
        activeId={activeId}
        onNavigate={goToChapter}
      />

      {/* ScrollSmoother wrapper — everything that scrolls lives inside
          #smooth-content; the nav stays outside (fixed/sticky elements must). */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
      {/* ---------------- Demo hero (desktop: snap-scroll chapter reel) --- */}
      <DesktopReel
        chapters={chapters}
        philosophy={content.philosophy}
        activeId={activeId}
        onSelect={handleSelect}
        onIndustries={enterUseCases}
        src=""
        poster=""
      />

      {/* ---------------- Demo hero (mobile: TikTok-style chapter reel) --- */}
      <MobileReel
        chapters={chapters}
        philosophy={content.philosophy}
        activeId={activeId}
        onSelect={handleSelect}
        atUseCases={atUseCases}
        onIndustries={enterUseCases}
        onExitUseCases={exitUseCases}
        src=""
        poster=""
      />

      {/* ---------------- Horizontal divider ---------------------------- */}
      <hr className="lp-divider" />

      {/* ---------------- Use cases + final CTA (About sections live on /about) --- */}
      <div className="lp">
        <section className="lp-section" id="use-cases">
          <div className="lp-container">
            <div className="lp-head center">
              <EditText as="h2" className="lp-kicker lp-kicker--title" path={['useCases', 'kicker']} value={editCtx ? content.useCases?.kicker : t(content.useCases?.kicker || '')} />
              <EditText as="p" className="lp-kicker-sub" path={['useCases', 'sub']} value={editCtx ? content.useCases?.sub : t(content.useCases?.sub || '')} />
            </div>
            <IndustryGrid />
          </div>
        </section>

        {/* ---------------- Final CTA ---------------- */}
        <section className="lp-cta" id="book">
          <div className="lp-container">
            <EditText as="h2" path={['cta', 'h2']} value={editCtx ? content.cta?.h2 : t(content.cta?.h2 || '')} />
            <EditText as="p" multiline path={['cta', 'p']} value={editCtx ? content.cta?.p : t(content.cta?.p || '')} />
            <div className="lp-cta-actions">
              <a href="#overview" className="btn-primary btn-lg">
                <Icon name="play" size={18} />{' '}
                <EditText path={['cta', 'primary']} value={editCtx ? content.cta?.primary : t(content.cta?.primary || '')} />
              </a>
              <a
                href="mailto:hello@taskmaverick.com?subject=Taskmaverick%20demo"
                className="btn-secondary btn-lg"
              >
                <EditText path={['cta', 'secondary']} value={editCtx ? content.cta?.secondary : t(content.cta?.secondary || '')} />
              </a>
            </div>
          </div>
        </section>

        {/* ---------------- Footer ---------------- */}
        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <img src="/logo.svg" alt="Taskmaverick" className="lp-footer-logo" />
            <nav>
              <a href="#overview">{t('Demo')}</a>
              <a href="/about">{t('About')}</a>
              <a href="#use-cases">{t('Use cases')}</a>
              <a href="#book">{t('Contact')}</a>
            </nav>
          </div>
        </footer>
      </div>
        </div>
      </div>
    </div>
  );
}
