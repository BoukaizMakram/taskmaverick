'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/LanguageProvider';
import styles from './BookDemo.module.css';

const MAIL = 'contact@taskmaverick.com';
const TEAM_SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'];
const FOCUS = ['Increased efficiency', 'Improved quality', 'Live oversight'];

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'clock' ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> :
        name === 'check' ? <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8.5 12 2.5 2.5 4.5-5" /></> :
        name === 'eye' ? <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></> :
        name === 'tick' ? <path d="m5 12.5 4.5 4.5L19 7.5" /> :
        <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  );
}

// A live Timer pill (green, real time) like the one on a posted mission.
function LiveTimer() {
  const [seconds, setSeconds] = useState(12 * 60 + 47);
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const clock = [seconds / 3600, (seconds / 60) % 60, seconds % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':');
  return <span className={styles.pill}>{clock}</span>;
}

export default function BookDemo() {
  const t = useT();
  const [form, setForm] = useState({ name: '', email: '', company: '', size: '', focus: [], message: '' });
  const [opened, setOpened] = useState(false);
  const set = (key) => (event) => {
    setOpened(false);
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  };
  const toggleFocus = (item) => {
    setOpened(false);
    setForm((previous) => ({
      ...previous,
      focus: previous.focus.includes(item) ? previous.focus.filter((f) => f !== item) : [...previous.focus, item],
    }));
  };

  function onSubmit(event) {
    event.preventDefault();
    const subject = encodeURIComponent(`Demo request — ${form.company || form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nWork email: ${form.email}\nCompany: ${form.company}\nTeam size: ${form.size}\nFocus: ${form.focus.join(', ') || '—'}\n\n${form.message}`
    );
    window.location.href = `mailto:${MAIL}?subject=${subject}&body=${body}`;
    setOpened(true);
  }

  const agenda = [
    ['clock', 'Increased efficiency', 'Missions posted, claimed and closed on time, without manager reminders.', <LiveTimer key="timer" />],
    ['check', 'Improved quality', 'Checklists, micro-training and photo proof in the flow of work.', <span key="steps" className={styles.steps} aria-hidden="true"><i /><i /><i /><i /><i /></span>],
    ['eye', 'Live oversight', 'Real-time boards and reports for every team and location.', <span key="live" className={styles.live}>{t('Live')}</span>],
  ];

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.intro} aria-labelledby="book-title">
          <p className={styles.eyebrow}><span />{t('BOOK A DEMO')}</p>
          <h1 id="book-title">{t('See your operations')}<br /><span>{t('run themselves.')}</span></h1>
          <p className={styles.description}>{t('A walkthrough built around your team. Tell us how you work, and we’ll show you Taskmaverick running the missions, training and oversight that fit it.')}</p>

          <div className={styles.agenda}>
            <p className={styles.agendaTitle}>{t('WHAT WE’LL WALK THROUGH')}</p>
            <ul>
              {agenda.map(([icon, title, description, live]) => (
                <li className={styles.agendaItem} key={title}>
                  <span className={styles.agendaIcon}><Icon name={icon} /></span>
                  <div><h2>{t(title)}</h2><p>{t(description)}</p></div>
                  <div className={styles.agendaLive}>{live}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="request-title">
          <div className={styles.cardHeader}>
            <h2 id="request-title">{t('Request your walkthrough')}</h2>
            <p>{t('Takes under a minute. We’ll tailor the demo to your team.')}</p>
          </div>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="b-name">{t('Full name')} <span aria-hidden="true">*</span></label>
                <input id="b-name" name="name" autoComplete="name" placeholder={t('Your name')} value={form.name} onChange={set('name')} required />
              </div>
              <div className={styles.field}>
                <label htmlFor="b-email">{t('Work email')} <span aria-hidden="true">*</span></label>
                <input id="b-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="b-company">{t('Company')} <span aria-hidden="true">*</span></label>
              <input id="b-company" name="company" autoComplete="organization" placeholder={t('Your company name')} value={form.company} onChange={set('company')} required />
            </div>
            <fieldset className={styles.field}>
              <legend>{t('Team size')} <span aria-hidden="true">*</span></legend>
              <div className={styles.options}>
                {TEAM_SIZES.map((size) => (
                  <label className={styles.option} key={size}>
                    <input type="radio" name="size" value={size} checked={form.size === size} onChange={set('size')} required />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className={styles.field}>
              <legend>{t('What should we focus on?')} <span className={styles.optional}>({t('optional')})</span></legend>
              <div className={styles.options}>
                {FOCUS.map((item) => (
                  <label className={`${styles.option} ${styles.focus}`} key={item}>
                    <input type="checkbox" checked={form.focus.includes(item)} onChange={() => toggleFocus(item)} />
                    <span><Icon name="tick" />{t(item)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className={styles.field}>
              <label htmlFor="b-msg">{t('Anything else we should know?')} <span className={styles.optional}>({t('optional')})</span></label>
              <textarea id="b-msg" name="message" rows={3} placeholder={t('Locations, shifts, the tools you use today…')} value={form.message} onChange={set('message')} />
            </div>
            <button type="submit" className={styles.submit}>{t('Request demo')}<Icon /></button>
            <p className={styles.note}>{t('Opens your email app with your request ready to send.')}</p>
            {opened && <p className={styles.status} role="status">{t('Your email app should have opened. Send the email there to complete your request. If it didn’t open, email us directly at')} <a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>}
          </form>
        </section>
      </div>
      <footer className={styles.footer}><span>{t('Prefer to ask a question first?')}</span><a href="/contact">{t('Contact us')}<Icon /></a></footer>
    </main>
  );
}
