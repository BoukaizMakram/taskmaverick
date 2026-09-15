'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/LanguageProvider';
import styles from './Contact.module.css';

const MAIL = 'contact@taskmaverick.com';

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'mail' ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></> :
        name === 'chat' ? <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> :
        name === 'calendar' ? <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18m-13 5 2 2 4-4" /></> :
        <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  );
}

export default function Contact() {
  const t = useT();
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [opened, setOpened] = useState(false);
  const set = (key) => (event) => {
    setOpened(false);
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  };

  function onSubmit(event) {
    event.preventDefault();
    const subject = encodeURIComponent(`Contact from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\n${form.message}`);
    window.location.href = `mailto:${MAIL}?subject=${subject}&body=${body}`;
    setOpened(true);
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.intro} aria-labelledby="contact-title">
          <p className={styles.eyebrow}><span />{t('CONTACT US')}</p>
          <h1 id="contact-title">{t('Better operations.')}<br /><span>{t('One conversation away.')}</span></h1>
          <p className={styles.description}>{t('Tell us what your team needs. We’ll help you explore how Taskmaverick can make everyday work run better.')}</p>

          <ul className={styles.benefits}>
            {[
              ['01', 'Automate everyday operations', 'Guide teams to act on time, balance workloads, and reduce the need for constant manager reminders.'],
              ['02', 'Build consistent performance', 'Deliver short, targeted training in the flow of work so your standards are followed across teams and locations.'],
              ['03', 'Stay in control as you scale', 'Monitor execution in real time, flag risks early, and track issues through to resolution.'],
            ].map(([number, title, description]) => (
              <li className={styles.benefit} key={number}>
                <span className={styles.benefitNumber} aria-hidden="true">{number}</span>
                <div><h2>{t(title)}</h2><p>{t(description)}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="message-title">
          <div className={styles.cardHeader}>
            <h2 id="message-title">{t('Let’s start a conversation')}</h2>
            <p>{t('A question, an idea, or a challenge. We’re listening.')}</p>
          </div>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="c-name">{t('Name')} <span aria-hidden="true">*</span></label>
                <input id="c-name" name="name" autoComplete="name" placeholder={t('Your name')} value={form.name} onChange={set('name')} required />
              </div>
              <div className={styles.field}>
                <label htmlFor="c-email">{t('Email')} <span aria-hidden="true">*</span></label>
                <input id="c-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="c-company">{t('Company')} <span className={styles.optional}>({t('optional')})</span></label>
              <input id="c-company" name="company" autoComplete="organization" placeholder={t('Your company name')} value={form.company} onChange={set('company')} />
            </div>
            <div className={styles.field}>
              <label htmlFor="c-msg">{t('How can we help?')} <span aria-hidden="true">*</span></label>
              <textarea id="c-msg" name="message" rows={5} placeholder={t('Tell us a little about your team and what you’re looking for…')} value={form.message} onChange={set('message')} required />
            </div>
            <button type="submit" className={styles.submit}>{t('Prepare email')}<Icon /></button>
            <p className={styles.note}>{t('Opens your email app with your message ready to send.')}</p>
            {opened && <p className={styles.status} role="status">{t('Your email app should have opened. Send your message there to complete your inquiry. If it didn’t open, email us directly at')} <a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>}
          </form>
        </section>
      </div>
      <footer className={styles.footer}><span>{t('Built for teams. Designed for better work.')}</span><a href="/">{t('Explore Taskmaverick')}<Icon /></a></footer>
    </main>
  );
}

