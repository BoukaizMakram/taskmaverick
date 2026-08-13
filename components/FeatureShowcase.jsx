'use client';

// ---------------------------------------------------------------------------
// Auto-rotating feature showcase (Intercom-style): a preview on top that swaps
// per section, with three feature columns below. Each column runs a 5-second
// progress bar; when it fills, the showcase flips to the next one. Clicking a
// column jumps to it (and restarts its 5 seconds).
//
// Images are not wired yet — set `image: '/path.png'` on a feature to show it;
// until then a placeholder with the section's tagline is shown.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import WorkGetsDoneScene from '@/components/scenes/WorkGetsDoneScene';
import TrainScene from '@/components/scenes/TrainScene';

const DEFAULT_DURATION = 5000;

const FEATURES = [
  {
    id: 'automate',
    title: 'Work Gets Done Automatically',
    lead: 'No more chasing employees.',
    body: 'Taskmaverick automatically sends tasks, checklists, audits, and reminders to the right people at the right time.',
    tagline: 'Tell Taskmaverick what needs to happen. It makes sure it happens.',
    Scene: WorkGetsDoneScene,
    duration: 14000, // matches the full lifecycle loop
  },
  {
    id: 'train',
    title: 'Train and Guide Your Team',
    lead: 'Give employees the help they need, exactly when they need it.',
    body: 'Provide quick training, step-by-step instructions, videos, and knowledge directly inside the work they are doing.',
    tagline: 'Train people while they work.',
    Scene: TrainScene,
    duration: 8000, // matches the train scene loop
  },
  {
    id: 'realtime',
    title: 'See Everything in Real Time',
    lead: "Know what's happening across your business.",
    body: 'Track completed work, overdue tasks, quality issues, audits, and team performance from live dashboards.',
    tagline: "If something needs attention, you'll know immediately.",
    image: null,
  },
];

export default function FeatureShowcase() {
  const [active, setActive] = useState(0);

  const feature = FEATURES[active];
  const duration = feature.duration || DEFAULT_DURATION;

  // Advance to the next section after this feature's duration. Re-arms whenever
  // `active` changes, so a click also grants a full turn.
  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % FEATURES.length), duration);
    return () => clearTimeout(t);
  }, [active, duration]);

  return (
    <section className="lp-section fs-section" id="how" aria-label="How Taskmaverick works">
      <div className="lp-container">
        <div className="fs">
          <div className="fs-stage">
            {feature.Scene ? (
              <div className="fs-scene" key={feature.id}>
                <feature.Scene />
              </div>
            ) : (
              <div className="fs-window" key={feature.id}>
                <div className="fs-window-bar" aria-hidden="true">
                  <span className="fs-tl fs-tl-r" />
                  <span className="fs-tl fs-tl-y" />
                  <span className="fs-tl fs-tl-g" />
                </div>
                <div className="fs-screen">
                  {feature.image ? (
                    <img className="fs-shot" src={feature.image} alt={feature.title} />
                  ) : (
                    <div className="fs-placeholder">
                      <p className="fs-placeholder-tagline">{feature.tagline}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="fs-items" role="tablist">
            {FEATURES.map((f, i) => {
              const isActive = i === active;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`fs-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  <span className="fs-track" aria-hidden="true">
                    {isActive ? (
                      <span className="fs-track-fill" key={active} style={{ animationDuration: `${duration}ms` }} />
                    ) : null}
                  </span>
                  <span className="fs-bullet" aria-hidden="true" />
                  <span className="fs-item-title">{f.title}</span>
                  <span className="fs-item-lead">{f.lead}</span>
                  <span className="fs-item-body">{f.body}</span>
                  <span className="fs-learn">Learn more →</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
