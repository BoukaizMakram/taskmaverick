import {QUALITY_STORY, TEXT_AT as QUALITY_TEXT_AT, CLIP_SKIP as QUALITY_SKIP} from './improvedQualityV2Story.mjs';
import {EFFICIENCY_STORY, TEXT_AT as EFFICIENCY_TEXT_AT, CLIP_SKIP as EFFICIENCY_SKIP} from './efficiencyV2Story.mjs';
import {ELEMENTS, SUGGESTIONS} from './assetElements.mjs';

// The Assets Library (/assets-library): the animations as building blocks.
// Every asset is ONE part of a demo, on its own (the alert, the link, the
// translation, the tablet…), never a run of several. Hover one to watch it,
// search by what it shows, then rate it and write notes on it (saved to
// content/assets-library.json by asset id).
//
// An asset is one chapter of a storytelling cut (see components/useClipSlice.js):
//   shows     what is on screen, by the product's own names. Each name is an
//             ELEMENT, so its aliases are searchable too ("warning" finds an
//             Alert). The thing the hand clicks comes first. The hand and the
//             speech bubble are in every clip but the title cards; they are
//             added at the end.
//   keywords  anything else worth finding it by
//   poster    how far into the clip its still frame is (0-1). Left out, it is
//             the moment the words are all typed. The stills are made by
//             `npm run gen:posters`.
export const DEMOS = [
  {id: 'improved-quality-v2', name: 'Improved Quality', page: '/improved-quality-v2', src: '/improved-quality-v2/embed', story: QUALITY_STORY, textAt: QUALITY_TEXT_AT, skip: QUALITY_SKIP},
  {id: 'increased-efficiency-v2', name: 'Increased Efficiency', page: '/increased-efficiency-v2', src: '/increased-efficiency-v2/embed', story: EFFICIENCY_STORY, textAt: EFFICIENCY_TEXT_AT, skip: EFFICIENCY_SKIP},
];
export {ELEMENTS, SUGGESTIONS};

const TITLE_POSTER = 0.75; // a title card: typed in full, before it fades out
const fileOf = id => `/assets-library/${id.replace(/\//g, '--')}.jpg`;
const round = n => Math.round(n * 10) / 10;
function chapter(demo, id, rest) {
  const scene = demo.story.find(s => s.id === id);
  if (!scene) throw new Error(`${demo.id} has no chapter ${id}`);
  const title = rest.shows.length === 1 && rest.shows[0] === 'Title card';
  const skip = demo.skip[id] ?? 0, length = scene.duration - skip; // a clip starts when its own art has begun
  const typed = (demo.textAt[id] ?? 0) + scene.ready - skip;
  const assetId = `${demo.id}/${id}`;
  return {
    id: assetId, demo: demo.id, demoName: demo.name, page: demo.page, src: demo.src, clip: id, kind: 'Clip', number: scene.number,
    seconds: round(length), words: scene.text, keywords: [], image: fileOf(assetId),
    poster: title ? TITLE_POSTER : Math.min(0.95, Math.max(0.3, (typed + 0.5) / length)),
    ...rest, shows: title ? rest.shows : [...rest.shows, 'Hand', 'Speech bubble'],
  };
}

const [QUALITY, EFFICIENCY] = DEMOS;

export const ASSETS = [
  // ---- Improved Quality ---------------------------------------------------
  chapter(QUALITY, 'guidance', {title: 'The title', about: 'Words only, typed on a clean screen.', shows: ['Title card']}),
  chapter(QUALITY, 'knowledge', {title: 'The tablet and its Knowledge Base', about: 'The Team Board pops in on a tablet; the hand opens Menu, then Knowledge Base, then the Onboarding video, which plays.', shows: ['Tablet', 'Knowledge base', 'Menu', 'Training video', 'Team board', 'Mission chip', 'Timer', 'Execution timer', 'Performer']}),
  chapter(QUALITY, 'instructions', {title: 'The mission opens: instructions', about: 'One mission card pops in on its own; the hand presses it and it expands; the hand goes to the instructions and the bubble comes out there.', shows: ['Instructions', 'Mission chip', 'Mission details', 'Points', 'Timer', 'Performer']}),
  chapter(QUALITY, 'alerts', {title: 'Alert', about: 'The hand flies to the alert inside the mission and points at it; the bubble comes out there, then the hand fades out.', shows: ['Alert', 'Mission details', 'Instructions', 'Link']}),
  chapter(QUALITY, 'links', {title: 'Link', about: 'The hand flies to the resource link inside the mission and points at it; the bubble comes out there, then the hand fades out.', shows: ['Link', 'Mission details', 'Alert', 'Instructions']}),
  chapter(QUALITY, 'translation', {title: 'Translate', about: 'The hand presses ES and fades out: the whole mission turns Spanish and the bubble comes out; once the words are in, the hand returns, presses again, and the mission is English again.', shows: ['Translate button', 'Mission details', 'Instructions', 'Alert', 'Link']}),
  chapter(QUALITY, 'steps', {title: 'Step by step', about: 'The hand swipes up as the mission scrolls to its checklist, then answers three questions in turn; the bubble follows it.', shows: ['Checklist', 'Yes / No answers', 'Mission details']}),
  chapter(QUALITY, 'micro', {title: 'Micro-training', about: 'The hand swipes up as the mission scrolls to the training tile, then plays it; it opens into its video; then the quiz opens under it, the hand answers three questions and presses Submit, and both fold into a Done tile.', shows: ['Micro-training', 'Training video', 'Quiz', 'Checklist', 'Mission details']}),
  chapter(QUALITY, 'capture', {title: 'Photos and videos: the proof checkpoints', about: 'The hand swipes up as the mission scrolls to its two proof checkpoints, then points at them; the bubble comes out.', shows: ['Photo', 'Video', 'Proof', 'Mission details']}),
  chapter(QUALITY, 'photo', {title: 'Photo proof', about: 'The hand presses Add photo: the photo appears under its checkpoint, named by its capture time.', shows: ['Photo', 'Proof', 'Date & time', 'Mission details']}),
  chapter(QUALITY, 'video', {title: 'Video proof', about: 'The hand swipes up as the mission scrolls, answers No and presses Add video: it records under its checkpoint, then plays back.', shows: ['Video', 'Proof', 'Date & time', 'Yes / No answers', 'Mission details']}),
  chapter(QUALITY, 'emphasis', {title: 'A closed mission, lifted out', about: "Team A's board pops in on a tablet; the hand clicks one closed mission and it lifts out, alone.", shows: ['Mission chip', 'Closed mission', 'Timer', 'Execution timer', 'Performer', 'Points', 'Rating', 'Tablet', 'Team board']}),
  chapter(QUALITY, 'rate', {title: 'Self-rating', about: 'The hand presses Rate on the lone mission, drags the slider from Poor to Excellent and presses Submit; the badge pops onto the card.', shows: ['Self-rating', 'Rating', 'Mission chip', 'Closed mission', 'Performer', 'Points']}),
  chapter(QUALITY, 'peer', {title: 'Peer ratings', about: 'The hand points at the ratings; two peers rate the mission in turn, each announced under the card.', shows: ['Peer rating', 'Rating', 'Mission chip', 'Closed mission', 'Performer']}),
  chapter(QUALITY, 'visibility', {title: 'Business Proofs: what managers see', about: 'The mission goes back into the tablet; the hand presses Menu, then Business Media, and Business Proofs opens: every mission with its photos, which the hand swipes up through.', shows: ['Business proofs', 'Menu', 'Tablet', 'Photo', 'Performer', 'Timer']}),
  chapter(QUALITY, 'mobile', {title: 'On a tablet, a mobile device', about: "The hand swipes up on Business Proofs and they scroll on the tablet — 'a tablet is a mobile device too'.", shows: ['Business proofs', 'Tablet', 'Photo', 'Performer', 'Timer']}),
  chapter(QUALITY, 'tour', {title: 'Documented evidence', about: 'The hand swipes up again and the proofs keep scrolling: each mission with the photos it was documented by.', shows: ['Business proofs', 'Tablet', 'Photo', 'Performer', 'Date & time', 'Timer']}),
  chapter(QUALITY, 'web', {title: 'The web report: gallery view', about: 'The web report pops in; the hand presses Gallery View.', shows: ['Web report', 'Gallery view', 'Photo']}),
  chapter(QUALITY, 'remote', {title: 'Touring the report', about: 'The hand swipes up on the report, which scrolls through the photos and stops with two performers in view.', shows: ['Web report', 'Gallery view', 'Photo', 'Performer']}),
  chapter(QUALITY, 'performer', {title: 'Who performed', about: 'Everything darkens except the two performers; the hand points at them and they scale up next to the words.', shows: ['Performer', 'Web report', 'Spotlight']}),
  chapter(QUALITY, 'timestamp', {title: 'Date & time', about: 'The report widens to its Date & Time column; the hand points at the two dates and they scale up.', shows: ['Date & time', 'Web report', 'Spotlight']}),
  chapter(QUALITY, 'conclusion', {title: 'The closing words', about: 'Words only: the closing lines type centered and stay.', shows: ['Title card']}),
  // ---- Increased Efficiency -----------------------------------------------
  chapter(EFFICIENCY, 'opening', {title: 'The title', about: 'Words only, typed on a clean screen.', shows: ['Title card']}),
  chapter(EFFICIENCY, 'schedule', {title: 'Unique schedules', about: 'The missions pop in one by one, each with its own schedule beside it; the hand points at the first.', shows: ['Schedule', 'Mission chip', 'Timer', 'Points', 'Checklist']}),
  chapter(EFFICIENCY, 'points', {title: 'Reward points', about: 'The hand points at the points of two missions and they grow.', shows: ['Points', 'Mission chip', 'Timer']}),
  chapter(EFFICIENCY, 'urgency', {title: 'Timers change color', about: "The hand points at the oldest mission's timer; it turns orange, then red, to create urgency.", shows: ['Timer', 'Timer color', 'Mission chip']}),
  chapter(EFFICIENCY, 'priority', {title: 'Automatic priority', about: 'The hand points at the critical mission: it turns red and moves to the top on its own.', shows: ['Priority order', 'Mission chip', 'Timer', 'Timer color', 'Points']}),
  chapter(EFFICIENCY, 'shared', {title: 'One shared tablet', about: 'The team comes in; the tablet drops in, the people go left; the hand points at the tablet.', shows: ['Tablet', 'Avatar', 'Team board', 'Open mission', 'Mission chip', 'Timer']}),
  chapter(EFFICIENCY, 'code', {title: 'Personal code', about: 'The hand points at the critical mission; Adam leaves the rail for it and types his small personal code.', shows: ['Personal code', 'Avatar', 'Tablet', 'Team board', 'Mission chip']}),
  chapter(EFFICIENCY, 'claim', {title: 'Claim a mission', about: 'The hand points at the mission; Adam grabs it and docks it in the name slot; it moves to Claimed.', shows: ['Claimed mission', 'Personal code', 'Avatar', 'Mission chip', 'Performer', 'Execution timer', 'Timer', 'Tablet', 'Team board']}),
  chapter(EFFICIENCY, 'close', {title: 'Close a mission', about: 'The hand points at the mission; the same code closes it: the pill turns gray, both timers freeze and it moves to Closed.', shows: ['Closed mission', 'Personal code', 'Avatar', 'Mission chip', 'Timer', 'Execution timer', 'Performer', 'Tablet', 'Team board']}),
  chapter(EFFICIENCY, 'execution', {title: 'Execution duration', about: 'The tablet goes; two closed missions are lifted out and the hand points at their execution times.', shows: ['Execution timer', 'Mission chip', 'Closed mission', 'Timer', 'Performer']}),
  chapter(EFFICIENCY, 'performers', {title: 'Best performers', about: 'The same two closed missions; the hand points at who performed each.', shows: ['Performer', 'Mission chip', 'Closed mission', 'Execution timer', 'Timer']}),
  chapter(EFFICIENCY, 'reminder', {title: 'No reminders needed', about: 'The two closed missions stay in view; the hand points at them while the words say no manager has to remind anyone.', shows: ['Mission chip', 'Closed mission', 'Execution timer', 'Timer', 'Performer']}),
  chapter(EFFICIENCY, 'individuals', {title: 'Assigned to individuals', about: 'Three personal boards pop in, their missions one by one with live timers; the hand points at them.', shows: ['Personal board', 'Mission chip', 'Open mission', 'Timer', 'Points', 'Avatar']}),
  chapter(EFFICIENCY, 'teams', {title: 'Assigned to teams', about: 'Missions posted to a team board on the shared tablet; the hand points at the board.', shows: ['Team board', 'Tablet', 'Open mission', 'Mission chip', 'Timer', 'Avatar']}),
  chapter(EFFICIENCY, 'initiative', {title: 'Teams take initiative', about: 'The hand points at the board; then the original loop: people keep claiming the next mission on their own.', shows: ['Team board', 'Tablet', 'Avatar', 'Personal code', 'Mission chip', 'Claimed mission', 'Open mission', 'Closed mission', 'Performer', 'Timer', 'Execution timer']}),
  chapter(EFFICIENCY, 'conclusion', {title: 'The closing words', about: 'Words only: the closing lines type centered and stay.', shows: ['Title card']}),
];

for (const a of ASSETS) for (const name of a.shows) if (!ELEMENTS[name]) throw new Error(`${a.id} shows "${name}", which is not in ELEMENTS`);

// Ratings and notes from two places (the saved file, this browser): per clip the
// newest edit wins, and a note written in one place is never dropped for want of
// the other. `changed` says the result holds something `base` did not.
export function mergeReviews(base = {}, other = {}) {
  const merged = {...base};
  let changed = false;
  for (const [id, review] of Object.entries(other || {})) {
    if (!review || (review.rating == null && !String(review.notes ?? '').trim())) continue;
    const mine = merged[id];
    if (!mine || String(review.updatedAt ?? '') > String(mine.updatedAt ?? '')) { merged[id] = review; changed = true; }
  }
  return {reviews: merged, changed};
}
