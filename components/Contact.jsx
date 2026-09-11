'use client';

// Contact page in the landing-page style (Navbar + .lp sections + footer). A
// hero, three direct contact methods, and a message form that opens the
// visitor's mail client (no backend needed).

import { useState } from 'react';

import { useT } from '@/lib/i18n/LanguageProvider';

const MAIL = 'contact@taskmaverick.com';

function Icon({ name }) {
  const p = {
    viewBox: '0 0 24 24',
    width: 22,
    height: 22,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (name === 'mail')
    return (
      <svg {...p}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 6-10 7L2 6" />
      </svg>
    );
  if (name === 'chat')
    return (
      <svg {...p}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  if (name === 'calendar')
    return (
      <svg {...p}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Contact() {
  const t = useT();
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact from ${form.name || 'the website'}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\n${form.message}`
    );
    window.location.href = `mailto:${MAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="lp-section contact-hero">
        <div className="lp-container">
          <div className="lp-head center">
            <h2 className="lp-kicker lp-kicker--title">{t('Contact')}</h2>
          </div>
        </div>
      </section>

      {/* ---------------- Methods + form ---------------- */}
      <section className="lp-section contact-body">
        <div className="lp-container contact-grid">
          <aside className="contact-methods">
            <a className="contact-method" href={`mailto:${MAIL}`}>
              <span className="contact-method-icon"><Icon name="mail" /></span>
              <span className="contact-method-text">
                <b>{t('Email us')}</b>
                <small>{MAIL}</small>
              </span>
            </a>
            <a
              className="contact-method"
              href={`mailto:${MAIL}?subject=${encodeURIComponent('Taskmaverick — sales')}`}
            >
              <span className="contact-method-icon"><Icon name="chat" /></span>
              <span className="contact-method-text">
                <b>{t('Talk to sales')}</b>
                <small>{t('Pricing, rollout, and a walkthrough for your team.')}</small>
              </span>
            </a>
            <a className="contact-method" href="/#book">
              <span className="contact-method-icon"><Icon name="calendar" /></span>
              <span className="contact-method-text">
                <b>{t('Book a demo')}</b>
                <small>{t('See it run on your everyday operations.')}</small>
              </span>
            </a>
          </aside>

          <div className="contact-card">
            {sent ? (
              <p className="contact-sent">
                {t('Thanks — your email client should have opened with your message ready to send.')}
              </p>
            ) : (
              <form className="contact-form" onSubmit={onSubmit} noValidate>
                <div className="contact-row">
                  <div className="contact-field">
                    <label htmlFor="c-name">{t('Name')}</label>
                    <input id="c-name" type="text" autoComplete="name" value={form.name} onChange={set('name')} required />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="c-email">{t('Email')}</label>
                    <input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
                  </div>
                </div>
                <div className="contact-field">
                  <label htmlFor="c-company">
                    {t('Company')} <span className="contact-opt">({t('optional')})</span>
                  </label>
                  <input id="c-company" type="text" autoComplete="organization" value={form.company} onChange={set('company')} />
                </div>
                <div className="contact-field">
                  <label htmlFor="c-msg">{t('Message')}</label>
                  <textarea id="c-msg" rows={5} value={form.message} onChange={set('message')} required />
                </div>
                <button type="submit" className="btn-primary btn-lg contact-submit">
                  {t('Send message')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </>
  );
}
