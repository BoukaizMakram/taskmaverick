'use client';

// Shared marketing footer used across the standalone pages (sign in, contact,
// book a demo). Mirrors the footer inlined on the landing / about pages.
import { useT } from '@/lib/i18n/LanguageProvider';

export default function SiteFooter() {
  const t = useT();
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <img src="/logo.svg" alt="Taskmaverick" className="lp-footer-logo" />
        <nav>
          <a href="/">{t('Demo')}</a>
          <a href="/about">{t('About')}</a>
          <a href="/#use-cases">{t('Use cases')}</a>
          <a href="/contact">{t('Contact')}</a>
          <a href="/book">{t('Book a demo')}</a>
          <a href="/signin">{t('Sign in')}</a>
          <a href="/terms">{t('Terms')}</a>
        </nav>
      </div>
    </footer>
  );
}
