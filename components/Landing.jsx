'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import Navbar from '@/components/Navbar';
import HeroVideo from '@/components/HeroVideo';
import Chapters from '@/components/Chapters';
import DemoCtaOptions from '@/components/DemoCtaOptions';
import FeatureShowcase from '@/components/FeatureShowcase';
import FeatureSplit from '@/components/FeatureSplit';
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

/* ---- "About" content: a normal marketing site below the demo ---------- */
const PILLARS = [
  {
    icon: 'route',
    title: 'Guided execution',
    text: 'Step-by-step missions post exactly when they are due, with instructions, alerts, and instant translation at every step, so the right work gets done right the first time.',
  },
  {
    icon: 'activity',
    title: 'Live oversight',
    text: 'Managers feel the heartbeat of the operation from live dashboards that show who is working, what is done, and what is due, then travel back in time through the evidence.',
  },
  {
    icon: 'book',
    title: 'Built-in learning',
    text: 'Micro-training is woven into the work itself, reinforced with quick quizzes, so skills are learned through repetition and never forgotten.',
  },
];

const REASONS = [
  'Step-by-step guidance so every task is done right, the first time',
  'Micro-trainings injected directly into the flow of work',
  'A Knowledge Base always at your team’s fingertips',
  'Aging timers and gamification that keep work moving on time',
  'Quality documented with photo and video evidence',
  'Live dashboards showing what is due, in progress, and done',
  'Automatic alerts the moment something needs attention',
  'Reports broken down by team, person, mission, and checkpoint',
];

export default function Landing() {
  const container = useRef(null);
  const [activeId, setActiveId] = useState(1);
  const activeChapter = CHAPTERS.find((c) => c.id === activeId) || null;

  // CTA design-exploration: compare all three options, or isolate one.
  // 0 / Esc → all · 1 → button · 2 → purple · 3 → ticket
  const [ctaView, setCtaView] = useState('ticket');
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const map = { 1: 'button', 2: 'purple', 3: 'ticket', 0: 'all' };
      if (e.key in map) setCtaView(map[e.key]);
      else if (e.key === 'Escape') setCtaView('all');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

          <div className={`cta-slot js-panel cta-slot--${ctaView}`}>
            <DemoCtaOptions view={ctaView} />
          </div>
        </div>
      </main>

      {/* ---------------- Horizontal divider ---------------------------- */}
      <hr className="lp-divider" />

      {/* ---------------- About Taskmaverick (normal website) ----------- */}
      <div className="lp">
        <FeatureShowcase />

        <FeatureSplit kicker="Management" title="Zone Coverage" artSide="left">
          Optimize staff distribution throughout any facility, especially in high-touch areas.
        </FeatureSplit>

        <section className="lp-section" id="about">
          <div className="lp-container">
            <div className="lp-head">
              <span className="lp-kicker">Who we are</span>
              <h2 className="lp-h2">We turn everyday operations into a system that runs itself.</h2>
              <p className="lp-lead">
                Taskmaverick is an Automated Business Manager. It guides every person on a tablet,
                phone, or the web, in their own language, so the right work gets done on time,
                measured, and recognized, without anyone having to micromanage. From a single café
                to a hospital running a hundred teams, it brings structure, accountability, and
                continuous training to the frontline.
              </p>
            </div>

            <div className="lp-grid">
              {PILLARS.map((p) => (
                <div className="lp-feature" key={p.title}>
                  <span className="lp-ficon">
                    <Icon name={p.icon} size={22} />
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section alt" id="why">
          <div className="lp-container">
            <div className="lp-head">
              <span className="lp-kicker">Why Taskmaverick</span>
              <h2 className="lp-h2">Everything your team needs to perform, in one place.</h2>
              <p className="lp-lead">
                Every capability pulls in the same direction, helping your people do their best
                work and giving you the visibility to prove it.
              </p>
            </div>
            <ul className="lp-checks">
              {REASONS.map((r) => (
                <li key={r}>
                  <Icon name="check" size={19} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

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
              <a href="#about">About</a>
              <a href="#use-cases">Use cases</a>
              <a href="#book">Contact</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
