'use client';

import { useEffect, useState } from 'react';

import { smoothScrollTo } from '@/lib/smoothScroll';
import { useLang, useT } from '@/lib/i18n/LanguageProvider';
import { LANGS } from '@/lib/i18n/languages';

// Compact language switcher — a blue rounded-square chip showing the current
// two-letter code (EN / ES / AR); clicking opens a small menu of the three
// languages. Switching flips the whole site (and <html dir> for Arabic).
function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!e.target.closest?.('.lang-switch')) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="lang-switch">
      <button
        type="button"
        className="lang-switch-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        {current.label}
      </button>
      {open && (
        <div className="lang-menu" role="listbox">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === lang}
              className={`lang-menu-item${l.code === lang ? ' is-active' : ''}`}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              <span className="lang-menu-code">{l.label}</span>
              <span className="lang-menu-name">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Right-hand chevron on every menu row, matches the live Taskmaverick burger.
function Chevron() {
  return (
    <svg className="burger-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Leading icon for each burger menu row — the real Taskmaverick published
// gradient icons from /public/icons/Published/Icon, keyed by `icon` name.
function MenuIcon({ name }) {
  const files = {
    home: 'Home.svg',
    about: 'View.svg',
    contact: 'Test.svg',
    calendar: 'Calendar-selected.svg',
    signin: 'Enter.svg',
    terms: 'Files.svg',
    privacy: 'Lock.svg',
  };
  // Dominant hue of each icon's gradient — the tile uses a faded version of it.
  const tints = {
    home: '#3C4F81',
    about: '#3EA4E3',
    contact: '#D08E31',
    calendar: '#3C4F81',
    signin: '#1271b7',
    terms: '#3EA4E3',
    privacy: '#D08E31',
  };
  // Icons that should render as a solid color instead of their gradient.
  const solid = {
    signin: '#1271b7',
  };
  const file = files[name];
  if (!file) return null;
  const src = `/icons/Published/Icon/${file}`;
  return (
    <span className="burger-nav-icon" style={{ background: `${tints[name] || '#3C4F81'}24` }}>
      {solid[name] ? (
        <span
          className="burger-nav-icon-mask"
          style={{
            background: solid[name],
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
          }}
        />
      ) : (
        <img src={src} alt="" width="26" height="26" />
      )}
    </span>
  );
}

// A burger menu row — a real link, or an inert (disabled) row that goes nowhere.
function BurgerLink({ link, onNavigate }) {
  const t = useT();
  const inner = (
    <>
      <MenuIcon name={link.icon} />
      <span>{t(link.label)}</span>
      <Chevron />
    </>
  );
  if (link.disabled) {
    // Clickable (hover/cursor like the others) but goes nowhere for now.
    return (
      <a href={link.href} className="burger-nav-link" onClick={(e) => e.preventDefault()}>
        {inner}
      </a>
    );
  }
  return (
    <a
      href={link.href}
      className={`burger-nav-link ${link.featured ? 'is-featured' : ''}`}
      onClick={onNavigate}
    >
      {inner}
    </a>
  );
}

// `disabled` items are inert for now (they don't navigate anywhere). Only Terms
// of Service is live.
const NAV_LINKS = [
  { label: 'Home', href: '/', icon: 'home', disabled: true },
  { label: 'About', href: '/about', icon: 'about', disabled: true },
  { label: 'Contact', href: '/contact', icon: 'contact', disabled: true },
  { label: 'Book Demo', href: '/book', icon: 'calendar', disabled: true },
  { label: 'Sign in', href: '/signin', icon: 'signin', disabled: true },
];

const FOOTER_LINKS = [
  { label: 'Terms of Service', href: '/terms', icon: 'terms' },
  { label: 'Privacy Policy', href: '#privacy', icon: 'privacy', disabled: true },
];

export default function Navbar({
  chapters = [],
  activeId,
  onSelect,
  atUseCases = false,
  onIndustries,
  onExitUseCases,
  backTo,
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [chOpen, setChOpen] = useState(false);
  const close = () => setOpen(false);

  const pad = (n) => String(n).padStart(2, '0');
  const activeIdx = chapters.findIndex((c) => c.id === activeId);
  const activeTitle = t(chapters[activeIdx]?.title || 'Chapters');

  // Lock the page behind the panel while it's open, and close on Escape.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Close the chapters dropdown on Escape or a click outside it.
  useEffect(() => {
    if (!chOpen) return;
    const onDown = (e) => {
      if (!e.target.closest?.('.nav-chapters')) setChOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setChOpen(false);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [chOpen]);

  return (
    <>
      <nav className="nav js-nav">
        {/* On the industry reel, the back button takes the brand's slot and is
            styled like the Book Demo button; elsewhere the logo shows. */}
        {backTo ? (
          <a href={backTo.href} className="nav-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t(backTo.label)}
          </a>
        ) : (
          <a href="/" className="brand" aria-label="Taskmaverick home">
            <img src="/logo.svg" alt="Taskmaverick" className="brand-logo" width="220" height="30" />
          </a>
        )}

        {chapters.length > 0 && (
          <div className="nav-center">
            <div className="nav-chapters">
              <button
                type="button"
                className={`nav-ch-btn${atUseCases ? ' is-back' : ''}`}
                aria-haspopup={atUseCases ? undefined : 'listbox'}
                aria-expanded={atUseCases ? undefined : chOpen}
                aria-label={atUseCases ? `Back to ${activeTitle}` : undefined}
                onClick={() => {
                  if (atUseCases) {
                    onExitUseCases?.();
                    smoothScrollTo(`dchapter-${activeId}`, { instant: true }); // jump back
                    return;
                  }
                  setChOpen((o) => !o);
                }}
              >
                <span className="nav-ch-label">{activeTitle}</span>
                <span className="nav-ch-num">{pad(activeIdx >= 0 ? activeIdx + 1 : 1)}</span>
                <svg className={`nav-ch-chev${chOpen || atUseCases ? ' is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {chOpen && !atUseCases && (
                <div className="nav-ch-menu" role="listbox">
                  {chapters.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={c.id === activeId}
                      className={`nav-ch-item${c.id === activeId ? ' is-active' : ''}`}
                      onClick={() => {
                        onSelect?.(c.id);
                        setChOpen(false);
                      }}
                    >
                      <span className="nav-ch-item-title">{t(c.title)}</span>
                      <span className="nav-ch-item-num">{pad(i + 1)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="nav-right">
          <a
            href="/#use-cases"
            className="btn-demo"
            onClick={(e) => {
              // On the landing, scroll down to the industries section; elsewhere
              // let the link navigate to /#use-cases.
              if (onIndustries && document.getElementById('use-cases')) {
                e.preventDefault();
                onIndustries();
              }
            }}
          >
            {t('Industries')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>

          <a
            href="/signin"
            className="nav-link nav-link--signin"
            onClick={(e) => e.preventDefault()}
          >
            {t('Sign in')}
          </a>

          <LanguageSwitcher />

          <button
            type="button"
            className="burger-menu"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Full-height slide-out panel, mirrored from the live site's burger */}
      <div
        className={`burger-dropdown ${open ? 'active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
      >
        <div className="burger-dropdown-header">
          <a href="/" className="burger-logo" onClick={close}>
            <img src="/logo.svg" alt="Taskmaverick" />
          </a>
          <button type="button" className="close-burger" aria-label="Close menu" onClick={close}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="burger-nav-menu">
          {NAV_LINKS.map((link) => (
            <BurgerLink key={link.label} link={link} onNavigate={close} />
          ))}
        </div>

        <div className="burger-nav-footer">
          {FOOTER_LINKS.map((link) => (
            <BurgerLink key={link.label} link={link} onNavigate={close} />
          ))}
        </div>
      </div>

      <div
        className={`burger-overlay ${open ? 'active' : ''}`}
        onClick={close}
        aria-hidden="true"
      />
    </>
  );
}
