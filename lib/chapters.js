// ---------------------------------------------------------------------------
// Single source of truth for the landing page.
//
// 1. Drop your video file into /public/videos and set VIDEO_SRC below
//    (e.g. '/videos/overview.mp4'). Leave it '' to show the placeholder.
// 2. Edit the chapters list: title, minutes, and start (seconds into the
//    video) so the list can later seek the player.
// ---------------------------------------------------------------------------

export const VIDEO_SRC = '';

export const VIDEO_POSTER = '';

export const CHAPTERS = [
  {
    id: 1,
    title: 'Automating Management',
    minutes: 5,
    start: 0,
    // This chapter plays a code-driven animation scene (see the SCENES registry
    // in HeroVideo) instead of a video.
    scene: 'posted-missions',
  },
  { id: 2,  title: 'Preserving Knowledge',    minutes: 4, start: 300 },
  { id: 3,  title: 'Increasing Efficiency',   minutes: 4, start: 540 },
  { id: 4,  title: 'Improving Quality',       minutes: 5, start: 780 },
  { id: 5,  title: 'Automating Audits',       minutes: 4, start: 1080 },
  { id: 6,  title: 'Requesting Support',      minutes: 3, start: 1320 },
  { id: 7,  title: 'Live Monitoring',         minutes: 5, start: 1500 },
  { id: 8,  title: 'Training & Coaching',     minutes: 6, start: 1800 },
  { id: 9,  title: 'Risk & Liability',        minutes: 4, start: 2160 },
  { id: 10, title: 'Franchising',             minutes: 4, start: 2400 },
  { id: 11, title: 'Consulting',              minutes: 4, start: 2640 },
  { id: 12, title: 'Reporting & AI',          minutes: 3, start: 2880 },
];

export function formatDuration(minutes) {
  return `${minutes} min`;
}
