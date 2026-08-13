'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import Navbar from '@/components/Navbar';
import HeroVideo from '@/components/HeroVideo';
import Chapters from '@/components/Chapters';
import DemoCtaOptions from '@/components/DemoCtaOptions';
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
  const container = useRef(null);
  const [activeId, setActiveId] = useState(1);
  const activeChapter = CHAPTERS.find((c) => c.id === activeId) || null;

  useGSAP(
    () => {
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;

      // Intro reveal: one coordinated timeline.
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.js-nav', { y: -28, autoAlpha: 0, duration: 0.6 })
        .from('.js-cta', { y: 16, autoAlpha: 0, duration: 0.5 }, '-=0.2')
        .from('.js-video', { y: 30, scale: 0.98, autoAlpha: 0, duration: 0.8 }, '-=0.3')
        .from('.js-panel', { x: 44, autoAlpha: 0, duration: 0.7 }, '-=0.6')
        .from('.js-chapter', { x: 30, y: 10, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, '-=0.4');
    },
    { scope: container }
  );

  return (
    <div className="page" ref={container}>
      <Navbar />

      {/* ---------------- Demo hero: video + sections + text ------------- */}
      <main className="hero">
        <HeroVideo src={VIDEO_SRC} poster={VIDEO_POSTER} activeChapter={activeChapter} />
        <div className="panel-col">
          <Chapters chapters={CHAPTERS} activeId={activeId} onSelect={setActiveId} />

          <div className="cta-slot js-panel">
            <DemoCtaOptions />
          </div>
        </div>
      </main>

      {/* ---------------- Horizontal divider ---------------------------- */}
      <hr className="lp-divider" />

      {/* ---------------- Use cases + final CTA (About sections live on /about) --- */}
      <div className="lp">
        <section className="lp-section" id="use-cases">
          <div className="lp-container">
            <div className="lp-head center">
              <span className="lp-kicker">Use cases by industry</span>
              <h2 className="lp-h2">Endless applications, one for every industry.</h2>
              <p className="lp-lead">
                See how teams in every industry put Taskmaverick to work. Open an industry for a
                slide-by-slide walkthrough of the everyday missions it runs.
              </p>
            </div>
            <IndustryGrid />
          </div>
        </section>

        {/* ---------------- Final CTA ---------------- */}
        <section className="lp-cta" id="book">
          <div className="lp-container">
            <h2>See it for yourself.</h2>
            <p>
              Anybody who has seen Taskmaverick says they have never seen anything like how it comes
              together. Watch the walkthrough above, or reach out for a personalized demo.
            </p>
            <div className="lp-cta-actions">
              <a href="#overview" className="btn-primary btn-lg">
                <Icon name="play" size={18} /> Watch the walkthrough
              </a>
              <a
                href="mailto:hello@taskmaverick.com?subject=Taskmaverick%20demo"
                className="btn-secondary btn-lg"
              >
                Contact sales
              </a>
            </div>
          </div>
        </section>

        {/* ---------------- Footer ---------------- */}
        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <img src="/logo.svg" alt="Taskmaverick" className="lp-footer-logo" />
            <nav>
              <a href="#overview">Demo</a>
              <a href="/about">About</a>
              <a href="#use-cases">Use cases</a>
              <a href="#book">Contact</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
