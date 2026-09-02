// Default (seed) content for the editable landing page. This is the schema the
// admin dashboard edits and the shape the landing renders. Saved edits live in
// content/landing.local.json (git-ignored) and override these defaults.

import { CHAPTERS } from './chapters';
import { LANDING_OUTLINE } from './landingOutline';

// Icon names understood by <BadgeIcon> (components/HeroVideo.jsx).
export const BADGE_ICONS = [
  'book',
  'camera',
  'chart',
  'check',
  'clock',
  'compass',
  'graduation',
  'shield',
  'star',
  'users',
];

// Fallback badges for chapters that ship without their own (kept in sync with
// BADGES in components/HeroVideo.jsx so every chapter has editable badges).
export const DEFAULT_BADGES = [
  { icon: 'users', title: 'Automated Guidance', sub: 'Teams Are Guided To Take Initiatives On Their Own' },
  { icon: 'check', title: 'Automated Training', sub: 'Critical Training Is Automatically Repeated For Emphasis' },
  { icon: 'shield', title: 'Automated Risk Detection', sub: 'HR Violations Are Automatically Detected & Resolved' },
  { icon: 'chart', title: 'Optimized Workload', sub: 'Work Distribution Is Automatically Optimized' },
];

export const DEFAULT_LANDING = {
  useCases: {
    kicker: 'Use cases by industry',
    h2: 'Endless applications, one for every industry.',
    lead: 'See how teams in every industry put Taskmaverick to work. Open an industry for a slide-by-slide walkthrough of the everyday missions it runs.',
  },
  cta: {
    h2: 'See it for yourself.',
    p: 'Anybody who has seen Taskmaverick says they have never seen anything like how it comes together. Watch the walkthrough above, or reach out for a personalized demo.',
    primary: 'Watch the walkthrough',
    secondary: 'Contact sales',
  },
  chapters: CHAPTERS.map((c) => ({
    id: c.id,
    title: c.title || '',
    heroTitle: c.heroTitle || '',
    cover: c.cover || '',
    src: c.src || '', // cover video (empty → poster/placeholder)
    scene: c.scene || '',
    badges: (c.badges && c.badges.length ? c.badges : DEFAULT_BADGES).map((b) => ({
      icon: b.icon,
      title: b.title,
      sub: b.sub,
    })),
  })),
  outline: LANDING_OUTLINE.map((s) => ({ id: s.id, name: s.name, items: [...s.items] })),
};

// One reel page per outline item — real chapters first, then duplicates (cycled)
// to cover the remaining items. Ids are sequential so item N maps to id N+1.
export function buildLandingChapters(chapters = [], outline = []) {
  const base = chapters.length ? chapters : [{ id: 1 }];
  const count = outline.reduce((n, s) => n + (s.items?.length || 0), 0) || base.length;
  return Array.from({ length: count }, (_, i) => ({
    ...base[i % base.length],
    id: i + 1,
    baseIndex: i % base.length,
  }));
}
