// The videos of the storyboard (the user, 2026-10-09): one video for a run of lines that tell one thing, from the first scene to the last, with a
// transition between scenes; the video sits at the right of the last frame of the last line of its run. A line of the storyboard that is in no run
// (the ones you add yourself, Scratch, Fonts) has no video.
import {DETAILS} from './storyboardDetails.mjs';
import {SECTIONS, SECTION_RUNS} from './sections/index.mjs';
import {ANIM_CPS} from './storyboardEdits.mjs';
const BASE_RUNS = {
  ...SECTION_RUNS, // (the sections of the website: a video for each chunk of lib/sections/<id>.mjs)
  'improved-quality-v2': [
    {id: 'animations', title: 'Animations', lines: ['animations']}, // (the user, 2026-10-12: the line on top that shows every animation the video plays; lib/storyboardAnimations.mjs)
    {id: 'knowledge', title: 'The tablet and its Knowledge Base', lines: ['knowledge']},
    {id: 'mission', title: 'The mission: instructions to video proof', lines: ['instructions', 'alerts', 'links', 'translation', 'steps', 'micro', 'photo', 'video']}, // (the user, 2026-10-12: "remove this part from the video": the line "Photos and videos: the proof checkpoints" (capture) stays on the board, the video does not play it; put 'capture' back before 'photo' to play it again)
    {id: 'ratings', title: 'The tablet, the mission, the ratings', lines: ['emphasis', 'rate', 'peer']},
    {id: 'managers', title: 'What managers see', lines: ['visibility', 'mobile', 'tour']},
    {id: 'report', title: 'The web report', lines: ['web', 'remote', 'performer', 'timestamp', 'conclusion']},
  ],
  'increased-efficiency-v2': [
    {id: 'board', title: 'The title, the board and its missions', lines: ['opening', 'schedule', 'points', 'urgency', 'priority']},
    {id: 'tablet', title: 'On the shared tablet', lines: ['shared', 'code', 'claim', 'close']},
    {id: 'results', title: 'What it shows', lines: ['execution', 'performers', 'reminder']},
    {id: 'assign', title: 'Who does what', lines: ['individuals', 'teams', 'initiative', 'conclusion']},
  ],
};
// The DETAILED videos (the user, 2026-10-14: "add another line of videos under videos where it will have the same videos but citing all details and always having that gray area to the right"): each
// video that has captions in lib/storyboardDetails.mjs has a twin that plays the same lines with a caption for each beat ("The user taps Menu."). They are runs of their own (id `<run>-detail`, title
// `<title> · in detail`, `like`: the run they follow), so they stand in a line of videos like the others (`line-shelf`) and play the lines' own slides.
export const DETAIL_SUFFIX = '-detail', DETAIL_TITLE = ' · in detail';
// The variants of a detailed video (the user, 2026-10-15: "a new line of videos like the videos with details but no yellow highlight, only the cursor visible all the time pointing on things we are
// talking about, on the bottom right of where the highlight rectangle was"; "another line where we have the yellow highlight with the cursor at the same time"): the detailed video itself, the same
// with the cursor instead of the highlight (`pointer: {marks: false}`), and with both (`marks: true`). They share the captions (`detail.run` is the detailed video's), so words typed over one are
// the words of all of them.
// The pop-up variant (the user, 2026-10-19: "a different line for the videos where we will be highlighting using cursor but with a small popup of the area we are highlighting and slight dimming of
// other things"): the cursor points as in the others, and instead of the yellow outline the area it was round lifts out of the picture as a card, a little bigger, while the rest dims
// (`popup: true`; `popMarks` in components/storyboardPlayerDom.js).
export const DETAIL_VARIANTS = [
  {suffix: '', title: '', pointer: null},
  {suffix: '-cursor', title: ', cursor only', pointer: {marks: false}},
  {suffix: '-both', title: ', highlight and cursor', pointer: {marks: true}},
  {suffix: '-popup', title: ', cursor and pop-up', pointer: {marks: true, popup: true}},
];
export const VIDEO_RUNS = BASE_RUNS;
// The twins stand only where they are put (a line's `shelf`): at the end of their lines they would be a second video beside each one.
export const DETAIL_RUNS = Object.fromEntries(Object.entries(BASE_RUNS).map(([board, runs]) => [board, runs.filter(r => DETAILS[board]?.[r.id]).flatMap(r => DETAIL_VARIANTS.map(v => ({id: `${r.id}${DETAIL_SUFFIX}${v.suffix}`, title: `${r.title}${DETAIL_TITLE}${v.title}`, lines: r.lines, like: r.id})))]));
export const allRunsOf = videoId => [...(VIDEO_RUNS[videoId] ?? []), ...(DETAIL_RUNS[videoId] ?? [])];

// How a video is paced and shown when it is not like the rest, by the run's id (the user, 2026-10-13, on "What managers see", the video that ends with the line "Documented
// evidence": "the whole video can be in 10 seconds", "scroll continuously and show text", "the menu should dim everything else in tablet", "make the hover bolding smooth",
// "text size 50", "make tablet go over the gray area just like the slides"; "only the video of Documented evidence"):
//   tempo       every move of the video takes this share of the usual; `natural` / `rest` the seconds a slide stays by itself / rests once it is in; `cps` the pen's letters a second
//   asSlides    the tablet is as the slides have it (over the edge of the gray plate, not filmed from further back), the words in the room that is left at the right of it, 45 px
//   dimMenu     the menu opening shows its shade: everything else in the tablet is dimmed
//   hover       what the cursor rests on thickens (a text stroke that grows, in `fade` seconds, to `stroke`): `lead` after the cursor arrives, `pause` before the click;
//               a row of the tablet's menu (`row`) gets a yellow rounded rectangle instead, its words `size` px bigger and `weight` em of stroke bolder (400 to 600), all over the same `fade`
//   scroll      the list is shown stopped at a place after another, each with a swipe: the video moves it by the time, once, from where it is when `opens` has made it (the scene
//               whose last click opens it) to where the last slide of `scenes` has it, over `seconds`; the words of each scene come one after the other over it
//   lesson      the click on the training video opens the lesson screen (a video that plays, then a quiz): lib/storyboardLesson.mjs
//   showStep    in the scene `scene` the list of the mission is not scrolled so far that the first words of its last step are under the header: they have `gap` stage px of room under it
//   scenes      a scene of its own pace, by the scene's id: {extra: seconds more on its last slide once all of it is there, move: seconds of the move into its first slide,
//               wait: of those, the seconds the screen stays still (the old words go) before it moves; it then eases in and out over the rest}
//   centerMarks a yellow outline around one line of text is moved (grown if the words do not fit) so the words are in the middle of it, side to side and up and down
//   marksInside a yellow outline is never cut by the picture's edge: each side that comes closer than this many stage px is brought in (the outline round a whole tablet, against the left edge)
//   keepCursor  the cursor is one thing from its first click to the end: between two scenes it stays where it clicked while the words of the next one come, and goes to the next click
//               from there (it does not fade out and come in again from the words)
//   dwell       seconds the cursor stays on what it clicks before it presses (the usual: the hover's lead + fade + pause, over half a second)
//   open        the video opens on the software's first piece in its small form (the mission as a card): it comes in over `pop` seconds and opens at once, over `expand`, into its big form (Mission Details); the words of the scene are written after it, not while the card waits
//   beats       scenes with one beat each (the user, 2026-10-13: "instruction alert and link should have same timing ... highlight then write on the right, keep it for like .7 seconds ... 3 seconds for writing and highlighting and 0.7 seconds for holding it"): once the move into the scene is over the highlight comes in over `fade`, then the words are written, so that highlight and words together take `seconds`; the scene then stays `hold` more
//   joins       the video opens on the very picture the video before it ends on (a section's parts played as one video on the All videos page): its software does not come in again, its pen waits for the old words to go, its timers go on from where they ended there
// The beat the scenes with a highlight share (the user, 2026-10-13): the highlight first, then the words, 3 s together, the scene stays 0.7 s more.
const BEAT = {seconds: 3, hold: 0.7, fade: 0.35};
export const PROFILES = {
  'improved-quality-v2': {
    // (the user, 2026-10-21: "do not highlight or pop until the text finishes writing then highlight, clicks, then knowledge base show text, but while missions showing up it can be like first
    // mission then 2nd then 3rd etc... one by one while everything is dimmed a bit and then text then highlight onboarding"): the Knowledge Base opens, its cards come in one by one over the
    // dimmed board, the words are written, and only then the cursor comes, Onboarding is highlighted and clicked
    knowledge: {wordsFirst: true, stagger: {panel: 'class="iq-knowledge"', count: /class="iq-kb-card/g, selector: '.iq-knowledge .iq-kb-card', lead: 0.1, each: 0.22, fade: 0.4}},
    managers: {
      tempo: 0.6, natural: 0.3, rest: 0.2, asSlides: true, dimMenu: true,
      hover: {lead: 0.05, fade: 0.55, pause: 0.12, stroke: '1.5px', row: {size: 2, weight: 0.021}}, // (a row of the menu, Business Media: the yellow rectangle, +2 px, 400 to 600 by the same time; the user, 2026-10-13)
      scroll: {opens: 'visibility', scenes: ['mobile', 'tour'], selector: '.iq-bp-list', seconds: 5.2},
    },
    // (the user, 2026-10-13: the click on the training video of the mission opens a lesson screen, a video with a quiz under it, over the mission details; Submit & Close brings them back)
    // (the user, the same day: "make sure the cursor go and click doesn't stop at something for a while before clicking", "don't show the cursor coming from text when going to video, just show
    // the cursor fade in from where it was left", "don't fade out the cursor after the quiz just keep it visible from quiz to add photo and video going to the right place and clicking")
    mission: {lesson: {scene: 'micro'}, keepCursor: true, dwell: 0.12, showStep: {scene: 'video', gap: 18}, // (the user, 2026-10-13: "in video proof don't scroll up too much, I wanna see the video step text")
      open: {pop: 0.4, expand: 0.8}, beats: {...BEAT, scenes: ['instructions', 'alerts', 'links']}}, // (the user, 2026-10-13: "expand the mission as soon as the video starts"; "instruction alert and link should have same timing ... highlight then write on the right ... 3 seconds for writing and highlighting and 0.7 seconds for holding it")
    // (the user, 2026-10-13: "touring report should be continuous scrolling not two quick ones, just slow fast slow": one scroll of the report, easing in and out, the words over it)
    // (the same: "make sure the date & time is centered v and h inside the highlight rectangle": the yellow outlines have their words in the middle)
    // (the user, the same day: "add 2 seconds to who performed and 2 seconds to date & time, make transition slower and smoother, a stop a bit then move": Who performed stays 2 s longer, then the report goes sideways to Date & time slowly: the screen waits a moment, then eases in and out, and Date & time stays 2 s longer)
    report: {scroll: {opens: 'web', scenes: ['remote'], selector: '.iq-ur-window > div', seconds: 3.4}, centerMarks: true, scenes: {performer: {extra: 2}, timestamp: {move: 1.8, wait: 0.4, extra: 2}}},
  },
  // Increased Efficiency follows the Improved Quality videos (the user, 2026-10-13: "update the increase efficiency, slides + videos ... fix the slides to follow improve quality videos that we made"; "same beat per
  // scene", "same look too"): every scene with a highlight has the beat (highlight, then the words, 3 s + 0.7 s held; the scenes that are actions, claim and close, are as they were), and a yellow outline
  // around one line of text has the text in the middle of it (centerMarks), as the web report's.
  // (the user, 2026-10-29: "make the words show up faster, do it fast, start with increased efficiency"; then "make all text speed 30 letters per second": the usual pen, highlight + words as long as the words need)
  'increased-efficiency-v2': {
    board: {beats: {...BEAT, seconds: 1.8, scenes: ['schedule', 'points', 'urgency', 'priority']}, centerMarks: true, marksInside: 14},
    tablet: {beats: {...BEAT, seconds: 1.8, scenes: ['shared', 'code']}, centerMarks: true, marksInside: 14},
    results: {beats: {...BEAT, seconds: 1.8, scenes: ['execution', 'performers', 'reminder']}, centerMarks: true, marksInside: 14},
    assign: {beats: {...BEAT, seconds: 1.8, scenes: ['individuals', 'teams', 'initiative']}, centerMarks: true, marksInside: 14},
  },
};
// The sections of the website (lib/sections/<id>.mjs) are played like Increased Efficiency: a yellow outline has its words in the middle, never cut by the picture's edge, and a scene with an
// outline has the same beat (the outline first, then the words, 3 s together, 0.7 s held).
for (const section of SECTIONS) {
  const marked = section.chapters.filter(c => c.marks?.length).map(c => c.id);
  const shown = section.chapters.filter(c => !c.marks?.length && !c.title && !c.acts?.length && !c.end && !c.before).map(c => c.id); // (what only shows something has the beat too: a card, a sign, a phone)
  PROFILES[section.board] = Object.fromEntries(section.chunks.map(chunk => {
    const scenes = marked.filter(id => chunk.lines.includes(id)), plain = shown.filter(id => chunk.lines.includes(id)), closing = section.chapters.filter(c => c.closing && chunk.lines.includes(c.id)).map(c => c.id); // (`closingScenes`: the closing words, never a second sentence in the variation `aside`)
    return [chunk.id, {centerMarks: true, marksInside: 14, ...(closing.length ? {closingScenes: closing} : {}), ...(chunk.profile ?? {}), ...(chunk.showStep ? {showStep: chunk.showStep} : {}), ...(chunk.lesson ? {lesson: chunk.lesson, keepCursor: true} : {}), ...(chunk.pace ? {scenes: chunk.pace} : {}), ...(scenes.length || plain.length ? {beats: {...BEAT, ...(chunk.beat ?? {}), scenes, ...(plain.length ? {plain} : {})}} : {})}];
  }));
}
// The detailed twin of a video has the video's own ways with the software (the cursor, the lesson, the scroll, the highlights) but not its pace: a caption has to be read, so no `tempo`, `natural`,
// `rest`, `beats` (the scene's own time) or `scenes` (extra seconds); its pen is slower than the usual (`cps`) and a caption stays a while once it is written (`detail.read`), the words' side is
// always there (the gray area), and the beats of the scenes have their steps (`detail`: the run, the steps by scene, the scenes where each change of the software is a beat).
const PACE = ['tempo', 'natural', 'rest', 'cps', 'beats', 'scenes', 'asSlides', 'joins']; // (`joins`: a detailed video stands alone, it opens as the others do)
const DETAIL_PEN = ANIM_CPS.default, DETAIL_READ = 1.3; // (the user, 2026-10-14: "it's fast ... let the user read": a caption stays 1.3 s once it is written; the pen was 16 letters a second, then the user, 2026-10-29: "make all text speed 30 letters per second")
for (const [board, runs] of Object.entries(DETAILS)) {
  for (const [id, spec] of Object.entries(runs)) {
    const base = Object.fromEntries(Object.entries(PROFILES[board]?.[id] ?? {}).filter(([name]) => !PACE.includes(name)));
    for (const variant of DETAIL_VARIANTS) (PROFILES[board] ??= {})[`${id}${DETAIL_SUFFIX}${variant.suffix}`] = {...base, cps: DETAIL_PEN, detail: {run: `${id}${DETAIL_SUFFIX}`, scenes: spec.scenes, each: spec.each ?? [], read: DETAIL_READ}, ...(variant.pointer ? {pointer: variant.pointer} : {})};
  }
}
// The profile of the video a player shows, by the board and the video's title (null: it is like the rest).
export const profileOf = (videoId, title) => { const run = allRunsOf(videoId).find(r => r.title === title); return run ? PROFILES[videoId]?.[run.id] ?? null : null; };
// The profile with the video's own SPEED over it (the user, 2026-10-29: "add a way to change speed from editor"; `edits.speed[title]` = {cps, seconds}, set in the video's inspector): the pen's
// letters a second, and the seconds the highlight and the words of a scene take together (only a video that has scenes with a beat). The same profile back when there is nothing to change.
export function withSpeed(profile, speed) {
  if (!speed || (speed.cps == null && speed.seconds == null)) return profile;
  const next = {...(profile ?? {})};
  if (speed.cps != null) next.cps = speed.cps;
  if (speed.seconds != null && next.beats) next.beats = {...next.beats, seconds: speed.seconds, fixed: true}; // (a scene's seconds that are asked for are kept, the pen goes at the speed that fits; else the pen's `cps` sets how long a scene takes)
  return next;
}

// The videos of a board put together in ONE line (the user, 2026-10-13: "take all videos and put them in one line, the videos starting from The tablet and its Knowledge Base"): the record of
// a line you added can have a `shelf`, the ids of runs (VIDEO_RUNS) whose video stands in that line's row, side by side in that order, instead of at the right of the last frame of the run's own
// last line. `added`: edits.lines.added; `shown`: the ids of the runs the board has (runsOf), the ones that are not leave no gap. A run on two shelves stands in the first one.
// -> Map(run id -> {line, index}) (index: its place in the row, from 0)
export function shelvedRuns(added, videoId, shown = null) {
  const have = new Set(allRunsOf(videoId).map(r => r.id)), out = new Map();
  for (const [lineId, line] of Object.entries(added ?? {})) {
    let index = 0;
    for (const id of Array.isArray(line?.shelf) ? line.shelf : []) {
      if (!have.has(id) || out.has(id) || (shown && !shown.has(id))) continue;
      out.set(id, {line: lineId, index: index++});
    }
  }
  return out;
}

// The runs of a video that have lines on the board: [{id, title, lines: [chapterId in order of the run, only those that exist], last (the chapter the video sits after)}].
// `chapters`: the chapter ids that exist (and have frames), in the board's order. `twins`: the detailed videos too (`twin: true`: they stand only on a shelf).
export function runsOf(videoId, chapters, twins = false) {
  const have = new Set(chapters);
  return (twins ? allRunsOf(videoId) : VIDEO_RUNS[videoId] ?? []).map(run => { const lines = run.lines.filter(id => have.has(id)); return {id: run.id, title: run.title, lines, last: lines.at(-1), twin: !!run.like}; }).filter(run => run.lines.length);
}
