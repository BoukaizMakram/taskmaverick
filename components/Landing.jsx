'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { smoothScrollTo } from '@/lib/smoothScroll';
import { useT } from '@/lib/i18n/LanguageProvider';
import Navbar from '@/components/Navbar';
import DesktopReel from '@/components/DesktopReel';
import MobileReel from '@/components/MobileReel';
import IndustryGrid from '@/components/IndustryGrid';
import { CHAPTERS, VIDEO_SRC, VIDEO_POSTER } from '@/lib/chapters';

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

export default function Landing() {
  const t = useT();
  const container = useRef(null);
  const [activeId, setActiveId] = useState(1);
  // True while the industries (Use Cases) section is the current view. While
  // it's true the chapter selector freezes on the chapter you left and turns
  // into a blue "back up" button — see Navbar / MobileReel.
  const [atUseCases, setAtUseCases] = useState(false);
  const atUseCasesRef = useRef(false);
  const lockRef = useRef(false); // ignore observer updates during a scripted scroll

  // Preview toggle for the cover play-control style. Press:
  //   1 (default) → floating white chip
  //   2           → white corner tab
  //   3           → real cut-out (the image is masked out of the corner)
  // Toggles mutually-exclusive classes on <html> that the .cover-play CSS reads.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      const root = document.documentElement;
      if (e.key === '1') root.classList.remove('cover-cutout', 'cover-mask');
      else if (e.key === '2') {
        root.classList.add('cover-cutout');
        root.classList.remove('cover-mask');
      } else if (e.key === '3') {
        root.classList.add('cover-mask');
        root.classList.remove('cover-cutout');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    if (lockRef.current) return; // mid scripted scroll — keep the selector pinned
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
    smoothScrollTo('use-cases', { instant: true }); // jump, don't animate
    holdLockUntilSettled();
  }, [holdLockUntilSettled]);

  // Back-up button → clear the state; the caller scrolls back to its chapter
  // (desktop via #dchapter-<id>, mobile via the reel page).
  const exitUseCases = useCallback(() => {
    atUseCasesRef.current = false;
    setAtUseCases(false);
    holdLockUntilSettled();
  }, [holdLockUntilSettled]);

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
    <div className="page" ref={container}>
      <Navbar
        chapters={CHAPTERS}
        activeId={activeId}
        onSelect={handleSelect}
        atUseCases={atUseCases}
        onIndustries={enterUseCases}
        onExitUseCases={exitUseCases}
      />

      {/* ScrollSmoother wrapper — everything that scrolls lives inside
          #smooth-content; the nav stays outside (fixed/sticky elements must). */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
      {/* ---------------- Demo hero (desktop: snap-scroll chapter reel) --- */}
      <DesktopReel
        chapters={CHAPTERS}
        activeId={activeId}
        onSelect={handleSelect}
        onIndustries={enterUseCases}
        src={VIDEO_SRC}
        poster={VIDEO_POSTER}
      />

      {/* ---------------- Demo hero (mobile: TikTok-style chapter reel) --- */}
      <MobileReel
        chapters={CHAPTERS}
        activeId={activeId}
        onSelect={handleSelect}
        atUseCases={atUseCases}
        onIndustries={enterUseCases}
        onExitUseCases={exitUseCases}
        src={VIDEO_SRC}
        poster={VIDEO_POSTER}
      />

      {/* ---------------- Horizontal divider ---------------------------- */}
      <hr className="lp-divider" />

      {/* ---------------- Use cases + final CTA (About sections live on /about) --- */}
      <div className="lp">
        <section className="lp-section" id="use-cases">
          <div className="lp-container">
            <div className="lp-head center">
              <span className="lp-kicker">{t('Use cases by industry')}</span>
              <h2 className="lp-h2">{t('Endless applications, one for every industry.')}</h2>
              <p className="lp-lead">
                {t(
                  'See how teams in every industry put Taskmaverick to work. Open an industry for a slide-by-slide walkthrough of the everyday missions it runs.'
                )}
              </p>
            </div>
            <IndustryGrid />
          </div>
        </section>

        {/* ---------------- Final CTA ---------------- */}
        <section className="lp-cta" id="book">
          <div className="lp-container">
            <h2>{t('See it for yourself.')}</h2>
            <p>
              {t(
                'Anybody who has seen Taskmaverick says they have never seen anything like how it comes together. Watch the walkthrough above, or reach out for a personalized demo.'
              )}
            </p>
            <div className="lp-cta-actions">
              <a href="#overview" className="btn-primary btn-lg">
                <Icon name="play" size={18} /> {t('Watch the walkthrough')}
              </a>
              <a
                href="mailto:hello@taskmaverick.com?subject=Taskmaverick%20demo"
                className="btn-secondary btn-lg"
              >
                {t('Contact sales')}
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
