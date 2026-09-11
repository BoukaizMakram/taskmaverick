// Outline shown in the landing page navigation (see LandingToc): four top-level
// sections, each with its subsections. Generated from 2393.xlsx. Each item maps,
// in order, to a reel chapter (see CHAPTERS).

export const LANDING_OUTLINE = [
  {
    id: 'operations',
    name: 'Operations',
    items: [
      'Automated Manager',
      'Workload Optimization',
      'Reward & Recognition',
      'Motivating Efficiency',
      'Ensuring Quality',
      'Personal Accountability',
      'Live Monitoring',
      'Dynamic Auditing',
      'Inventory Management',
      'Maintenance & Requests',
      'Managing by Exception',
      'Reporting  & AI',
    ],
  },
  {
    id: 'training',
    name: 'Training',
    items: [
      'Automated Coaching',
      'Assured Learning',
      'Dynamic Testing',
      'Adaptive Coaching',
      'Imbedded Guidance',
      'Mass Broadcasting',
      'Automating Certification',
      'Data & AI',
    ],
  },
  {
    id: 'risk',
    name: 'Risk',
    items: [
      'Risk & Liability',
      'Meal & Rest Breaks',
      'Fraud Prevention',
      'Prediction  & AI',
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    items: [
      'Standardizing Enterprise',
      'Powering Franchise',
      'Innovating Consulting',
    ],
  },
];

import { CHAPTERS } from './chapters';

export const OUTLINE_ITEM_COUNT = LANDING_OUTLINE.reduce((n, s) => n + s.items.length, 0);

export const LANDING_CHAPTERS = Array.from({ length: OUTLINE_ITEM_COUNT }, (_, i) => ({
  ...CHAPTERS[i % CHAPTERS.length],
  id: i + 1,
}));
