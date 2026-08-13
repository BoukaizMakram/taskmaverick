'use client';

import { useEffect, useState } from 'react';

// Right-hand chevron on every menu row, matches the live Taskmaverick burger.
function Chevron() {
  return (
    <svg className="burger-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '#contact' },
  { label: 'Book Demo', href: '#book' },
  { label: 'Sign in', href: '#signin' },
];

const FOOTER_LINKS = [
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Privacy Policy', href: '#privacy' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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

  return (
    <>
      <nav className="nav js-nav">
        <a href="/" className="brand" aria-label="Taskmaverick home">
          <img src="/logo.svg" alt="Taskmaverick" className="brand-logo" width="220" height="30" />
        </a>

        <div className="nav-right">
          <a href="/#book" className="btn-demo">
            Book a Demo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </a>

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
            <a key={link.label} href={link.href} className="burger-nav-link" onClick={close}>
              <span>{link.label}</span>
              <Chevron />
            </a>
          ))}
        </div>

        <div className="burger-nav-footer">
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="burger-nav-link" onClick={close}>
              <span>{link.label}</span>
              <Chevron />
            </a>
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
