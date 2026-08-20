import { notFound } from 'next/navigation';

import Navbar from '@/components/Navbar';
import QualityStoryboard from '@/components/quality/QualityStoryboard';

export const metadata = {
  title: 'Improving Quality — Taskmaverick',
  description:
    'How Taskmaverick improves quality: guided steps, instant translation, ratings, alerts, and photo/video proof that cannot be faked or reused.',
};

export default function QualityPage() {
  // ── FOR BAKING LATER — dev-only, not part of the public site ─────────────
  // "Improving Quality" storyboard (GSAP scenes recreated from the Figma
  // animation storyboard). Hidden (404) in production so these still-baking
  // animated frames never ship or show up in an audit; reachable in
  // `npm run dev` while the scenes are finished.
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="page">
      <Navbar />

      <header className="q-hero">
        <div className="lp-container">
          <span className="lp-kicker">Improving quality</span>
          <h1 className="q-hero-title">Quality you can prove, on every shift.</h1>
          <p className="lp-lead">
            Taskmaverick guides people through the work, captures real evidence, and flags anything
            below standard — so quality is measured and documented, not assumed. Here is how.
          </p>
        </div>
      </header>

      <main>
        <QualityStoryboard />
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <img src="/logo.svg" alt="Taskmaverick" className="lp-footer-logo" />
          <nav>
            <a href="/">Home</a>
            <a href="/#overview">Demo</a>
            <a href="/#use-cases">Use cases</a>
            <a href="/#book">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
