import Navbar from '@/components/Navbar';
import About from '@/components/About';

export const metadata = {
  title: 'About · Taskmaverick',
  description: 'How Taskmaverick turns everyday operations into a system that runs itself.',
};

export default function AboutPage() {
  return (
    <div className="page">
      <Navbar />
      <div className="lp">
        <About />

        {/* ---------------- Final CTA ---------------- */}
        <section className="lp-cta" id="book">
          <div className="lp-container">
            <h2>See it for yourself.</h2>
            <p>
              Anybody who has seen Taskmaverick says they have never seen anything like how it comes
              together. Watch the walkthrough, or reach out for a personalized demo.
            </p>
            <div className="lp-cta-actions">
              <a href="/" className="btn-primary btn-lg">
                Watch the walkthrough
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
              <a href="/">Demo</a>
              <a href="/about#about">About</a>
              <a href="/#use-cases">Use cases</a>
              <a href="/about#book">Contact</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
