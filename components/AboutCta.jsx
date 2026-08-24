'use client';

// The final call-to-action + footer shown under the About sections. Split into
// its own client component so it can use the translation hook (the /about route
// file stays a server component that exports metadata).
import { useT } from '@/lib/i18n/LanguageProvider';

export default function AboutCta() {
  const t = useT();
  return (
    <>
      {/* ---------------- Final CTA ---------------- */}
      <section className="lp-cta" id="book">
        <div className="lp-container">
          <h2>{t('See it for yourself.')}</h2>
          <p>
            {t(
              'Anybody who has seen Taskmaverick says they have never seen anything like how it comes together. Watch the walkthrough, or reach out for a personalized demo.'
            )}
          </p>
          <div className="lp-cta-actions">
            <a href="/" className="btn-primary btn-lg">
              {t('Watch the walkthrough')}
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
            <a href="/">{t('Demo')}</a>
            <a href="/about#about">{t('About')}</a>
            <a href="/#use-cases">{t('Use cases')}</a>
            <a href="/about#book">{t('Contact')}</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
