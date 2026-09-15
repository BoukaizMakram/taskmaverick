'use client';

// Selectable background style for the CTA posters. Default is 'stars' (the
// original Starfield), so unset content is unchanged. Others are chosen in the
// admin editor via the <EditBgButton> dropdown. All variants fill the poster
// behind the headline (class .cover-cta-stars) and fade in on reveal.

import Starfield from '@/components/Starfield';
import NumberRain from '@/components/NumberRain';
import { TimersBg, MissionsBg, BoardBg } from '@/components/PosterUiBg';

// Options + labels for the admin dropdown (order preserved).
export const POSTER_BGS = [
  'stars',
  'numbers',
  'timers',
  'missions',
  'board',
  'grid',
  'aurora',
  'plain',
];
export const POSTER_BG_LABELS = {
  stars: 'Stars',
  numbers: 'Numbers',
  timers: 'Timers',
  missions: 'Mission chips',
  board: 'Mission board',
  grid: 'Grid',
  aurora: 'Aurora',
  plain: 'Plain',
};

export default function PosterBg({ variant = 'stars' }) {
  switch (variant) {
    case 'numbers':
      return <NumberRain className="cover-cta-stars" />;
    case 'timers':
      return <TimersBg />;
    case 'missions':
      return <MissionsBg />;
    case 'board':
      return <BoardBg />;
    case 'grid':
      return <div className="cover-cta-stars poster-bg--grid" aria-hidden="true" />;
    case 'aurora':
      return <div className="cover-cta-stars poster-bg--aurora" aria-hidden="true" />;
    case 'plain':
      return null; // just the navy gradient, no animated layer
    case 'stars':
    default:
      return <Starfield className="cover-cta-stars" />;
  }
}
