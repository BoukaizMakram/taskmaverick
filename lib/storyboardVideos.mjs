// The videos of the storyboard (the user, 2026-10-09): one video for a run of lines that tell one thing, from the first scene to the last, with a
// transition between scenes; the video sits at the right of the last frame of the last line of its run. A line of the storyboard that is in no run
// (the ones you add yourself, Scratch, Fonts) has no video.
export const VIDEO_RUNS = {
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
// The beat the scenes with a highlight share (the user, 2026-10-13): the highlight first, then the words, 3 s together, the scene stays 0.7 s more.
const BEAT = {seconds: 3, hold: 0.7, fade: 0.35};
export const PROFILES = {
  'improved-quality-v2': {
    managers: {
      tempo: 0.6, natural: 0.3, rest: 0.2, cps: 42, asSlides: true, dimMenu: true,
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
  'increased-efficiency-v2': {
    board: {beats: {...BEAT, scenes: ['schedule', 'points', 'urgency', 'priority']}, centerMarks: true, marksInside: 14},
    tablet: {beats: {...BEAT, scenes: ['shared', 'code']}, centerMarks: true, marksInside: 14},
    results: {beats: {...BEAT, scenes: ['execution', 'performers', 'reminder']}, centerMarks: true, marksInside: 14},
    assign: {beats: {...BEAT, scenes: ['individuals', 'teams', 'initiative']}, centerMarks: true, marksInside: 14},
  },
};
// The profile of the video a player shows, by the board and the video's title (null: it is like the rest).
export const profileOf = (videoId, title) => { const run = (VIDEO_RUNS[videoId] ?? []).find(r => r.title === title); return run ? PROFILES[videoId]?.[run.id] ?? null : null; };

// The videos of a board put together in ONE line (the user, 2026-10-13: "take all videos and put them in one line, the videos starting from The tablet and its Knowledge Base"): the record of
// a line you added can have a `shelf`, the ids of runs (VIDEO_RUNS) whose video stands in that line's row, side by side in that order, instead of at the right of the last frame of the run's own
// last line. `added`: edits.lines.added; `shown`: the ids of the runs the board has (runsOf), the ones that are not leave no gap. A run on two shelves stands in the first one.
// -> Map(run id -> {line, index}) (index: its place in the row, from 0)
export function shelvedRuns(added, videoId, shown = null) {
  const have = new Set((VIDEO_RUNS[videoId] ?? []).map(r => r.id)), out = new Map();
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
// `chapters`: the chapter ids that exist (and have frames), in the board's order.
export function runsOf(videoId, chapters) {
  const have = new Set(chapters);
  return (VIDEO_RUNS[videoId] ?? []).map(run => { const lines = run.lines.filter(id => have.has(id)); return {id: run.id, title: run.title, lines, last: lines.at(-1)}; }).filter(run => run.lines.length);
}
