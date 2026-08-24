'use client';

// ---------------------------------------------------------------------------
// About — the marketing "About Taskmaverick" sections, moved off the landing
// page onto their own /about route. Composes FeatureShowcase + Zone Coverage
// (FeatureSplit) + "Who we are" + "Why Taskmaverick".
// ---------------------------------------------------------------------------

import FeatureShowcase from '@/components/FeatureShowcase';
import FeatureSplit from '@/components/FeatureSplit';
import { useT } from '@/lib/i18n/LanguageProvider';

/* ---- tiny inline icon set (Feather-style, stroked) -------------------- */
const ICONS = {
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

export default function About() {
  const t = useT();
  return (
    <>
      <FeatureShowcase />

      <FeatureSplit kicker={t('Management')} title={t('Zone Coverage')} artSide="left">
        {t(
          'Optimize staff distribution throughout any facility, especially in high-touch areas.'
        )}
      </FeatureSplit>

      <section className="lp-section" id="about">
        <div className="lp-container">
          <div className="lp-head">
            <span className="lp-kicker">{t('Who we are')}</span>
            <h2 className="lp-h2">{t('We turn everyday operations into a system that runs itself.')}</h2>
            <p className="lp-lead">
              {t(
                'Taskmaverick is an Automated Business Manager. It guides every person on a tablet, phone, or the web, in their own language, so the right work gets done on time, measured, and recognized, without anyone having to micromanage. From a single café to a hospital running a hundred teams, it brings structure, accountability, and continuous training to the frontline.'
              )}
            </p>
          </div>

          <div className="lp-grid">
            {PILLARS.map((p) => (
              <div className="lp-feature" key={p.title}>
                <span className="lp-ficon">
                  <Icon name={p.icon} size={22} />
                </span>
                <h3>{t(p.title)}</h3>
                <p>{t(p.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section alt" id="why">
        <div className="lp-container">
          <div className="lp-head">
            <span className="lp-kicker">{t('Why Taskmaverick')}</span>
            <h2 className="lp-h2">{t('Everything your team needs to perform, in one place.')}</h2>
            <p className="lp-lead">
              {t(
                'Every capability pulls in the same direction, helping your people do their best work and giving you the visibility to prove it.'
              )}
            </p>
          </div>
          <ul className="lp-checks">
            {REASONS.map((r) => (
              <li key={r}>
                <Icon name="check" size={19} />
                <span>{t(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
