// Outline shown in the landing page's navigation (see LandingToc): four
// top-level sections, each with placeholder items for now.
const PLACEHOLDERS = [
  'Placeholder A',
  'Placeholder B',
  'Placeholder C',
  'Placeholder D',
  'Placeholder E',
];

export const LANDING_OUTLINE = [
  {
    id: 'operations',
    name: 'Operations',
    items: [
      'Automated Guidance',
      'Workload Optimization',
      'Recognition & Reward',
      'Motivating Efficiency',
      'Ensuring Quality',
      'Verifying Outcomes',
      'Live Monitoring',
      'Audits & Inventory',
      'Maintenance & Requests',
      'Process Automation',
      'Managing by Exception',
      'Reporting & AI',
    ],
  },
  { id: 'training', name: 'Training', items: [...PLACEHOLDERS] },
  { id: 'risk', name: 'Risk', items: [...PLACEHOLDERS] },
  { id: 'knowledge', name: 'Knowledge', items: [...PLACEHOLDERS] },
];

// One reel page per outline item — real chapters first, then duplicates (cycled)
// to cover the remaining placeholders. Ids are sequential so item N maps to id N+1.
import { CHAPTERS } from './chapters';

export const OUTLINE_ITEM_COUNT = LANDING_OUTLINE.reduce((n, s) => n + s.items.length, 0);

export const LANDING_CHAPTERS = Array.from({ length: OUTLINE_ITEM_COUNT }, (_, i) => ({
  ...CHAPTERS[i % CHAPTERS.length],
  id: i + 1,
}));
