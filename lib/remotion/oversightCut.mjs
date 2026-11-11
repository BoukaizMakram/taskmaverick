// Live Oversight, the Remotion cut (the user, 2026-11-11, having worked Increased Efficiency's and Improved Quality's over: "now do a variation in live oversight using the same way we did both
// previous videos, make sure to use remotion"; written, NOT played or rendered). It is the look `remotion` of lib/storyboardVariations.mjs on the board live-oversight-v2: on the All videos page
// that board then plays THIS film in Remotion's Player (components/StoryboardRemotionCut.jsx), and the Remotion project D:\Documents\Saas\videos renders it to an MP4 (composition LO-Cut). The art
// is components/remotion/OversightCut.jsx: the web app's own pages as the section's videos draw them (the Overview's Team Board with its mission details and its photo and video viewer, the Data
// Board, the Usage Report: components/OverviewScene.jsx, DataReport.jsx, UsageReport.jsx), set by THIS file as a function of the time, so a frame is the same in the Player and in a render.
//
// Told as the two films before it are (Increased Efficiency's Variation 7, Improved Quality's Variation 4):
//   - the words SLIDE (`story(words, {slide: true})`): the blue label comes in alone from the left, the white words are then written, the whole goes on to the right; the title is typed in place
//   - each thing is said as a BENEFIT in two or three words (the label) and one plain sentence on two lines, a subject that does something (`SAYS`). They are not the narration's words, which
//     the board's slides still say (lib/sections/live-oversight.mjs); "Execution Duration Is / Measured Per Mission" is Increased Efficiency's own sentence
//   - a title and its action: the action starts the moment the last word is written, and the words go `GONE` s after it has ended; words that only show something keep it `SHOW` s
//   - the CEO's rule (2026-11-09: "a tablet or a big board (planning, overview, reports): the words at the bottom"; 2026-10-20: big boards go edge to edge): this film is ONE big board, the web
//     window's whole 1600 px page across the picture, from its top to the band of the words; every sentence is in the band. Nothing moves the page: what changes is inside it
//   - what is only shown is outlined in yellow, as the board's videos have it since the CEO's review of 2026-10-20: the missions in a state as ROWS, from their number to that state's column,
//     with the column's title (open, claimed, closed); who performed and the duration as columns; the collected data, the report's statements and its flagged answers one after the other
//   - what is done is done by the cursor (`cursorPlan`, cutCore.mjs: the yellow hand, words first, out of the left of the words, gone after the last click of a run or before a clip plays): it
//     opens the mission, its photos, the next photo, closes them, plays the video, goes to Reports, back to the Overview and its History, searches the Name column, groups by person, goes to
//     the report, groups it by checkpoint and ticks Gallery View. It does not point at the outlines: they come by themselves
//   - one speed (a move 0.76 s on Easy Ease 70%), a change of page 0.3 s
// ONE thread: the same mission all the way, today's Storage Room Check: seen closed on the board, opened, its photos and its video, its measurements, the same measurements in the Data Board
// with the two that were flagged, its seven runs in History, by person, its proofs by checkpoint in the report, and the storage room day after day in the gallery.
// Pure: no React, no Remotion.
import {CUT_FPS, CUT_H, CUT_W, M, OUT, SLIDE, clamp, cursorPlan, cutMaker, prog, story} from './cutCore.mjs';
import {MOTION} from '../liveOversightStory.mjs';

export {CUT_FPS, CUT_H, CUT_W};
export const OVERSIGHT_CUT_ID = 'LO-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['LO-Cut'])
export const TITLE_WORDS = {lines: ['Remotely Monitor Operations', 'From Anywhere'], mark: null};
// the video proof's clip (the Overview's viewer plays it; components/ImprovedQualityPanels.jsx CLIP) and its length
export const CLIP = '/demo-quality/condition-report.mp4', REC = MOTION.rec;
export const RANGE = '09/22/2026 – 09/28/2026';
// The board: the web window's page, 1600 px wide, edge to edge, from the picture's top to the band of the words (its straight edge, y 744: .rc-band-shade)
export const BOARD = {w: CUT_W, h: 744};
const SEARCH = 'Storage Room Check'; // what is typed in the Name column's search

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['LO-Cut'], lib/remotion/cutWords.mjs) ----
const SAYS = {
  rhythm: ['Live rhythm', ['Feel The Business Rhythm', 'In Real Time']],
  aging: ['Aging missions', ['Open Missions Show', 'How Long They Have Waited']],
  claimed: ['Work in progress', ['Claimed Missions Show', 'What Is Being Done Now']],
  completed: ['Completed work', ['Closed Missions Show', 'What Was Completed']],
  performed: ['Clear ownership', ['Every Mission Shows', 'Who Performed It']],
  duration: ['Measured execution', ['Execution Duration Is', 'Measured Per Mission']],
  details: ['Full detail', ['Any Mission Opens', 'To Its Details']],
  photos: ['Photo proof', ['Photos Are Retrieved', 'In One Click']],
  videos: ['Video proof', ['Videos Play', 'Right On The Board']],
  data: ['Collected data', ['Every Answer Collected', 'Is There To See']],
  dashboards: ['Live dashboards', ['Collected Data Feeds', 'Live Dashboards']],
  anomalies: ['Instant correction', ['Anomalies Are Flagged', 'For Instant Correction']],
  history: ['Stored history', ['Performance History', 'Is Always Stored']],
  byMission: ['By mission', ["Find Any Mission's", 'Past Runs']],
  byPerson: ['By person', ['See The Runs', 'Of Each Person']],
  byCheckpoint: ['By checkpoint', ['Compare Answers', 'Checkpoint By Checkpoint']],
  gallery: ['Gallery view', ['Proofs Line Up', 'In Gallery View']],
  evolution: ['Evolution over time', ['Managers Inspect How An Area', 'Evolves Over Time']],
  visibility: ['Constant visibility', ['Monitor Trends, Audit Conditions', '& Keep Constant Visibility']],
};

// ---- the speeds (Increased Efficiency's: lib/remotion/efficiencyRedo.mjs `QUICK`, `GONE`) ----
const QUICK = 1.3, TR = M / QUICK, GONE = 0.3; // a transition (the board coming in and going) is 30% faster than a move; words go 0.3 s after their action has ended
const SHOW = 1.1, EACH = 0.45;                 // what is only shown stays outlined this long; several outlines come this far apart
const PAGE = 0.3;                              // a change of page (a click in the top bar): the new page comes in over the old one
const SCROLL = 1.6, EVOLVE = 4.2, TYPE = 0.9;  // the board going down to the West Location; the gallery scrolled through the week; the mission's name typed in the search
const READ = lines => 0.8 + lines.join('').replace(/\s+/g, '').length / 18; // words with nothing under them: read

// ---- what the cursor presses and what is outlined, on the picture (each page says its name: data-rc-lo) ----
const on = (page, sel) => `[data-rc-lo="${page}"] ${sel}`, target = (page, key) => on(page, `[data-iq-target="${key}"]`);
const HEAD = col => on('overview', `th[data-iq-col="${col}"]`);
const P = {
  name: target('overview', 'name-storage'), photo: target('overview', 'file-photo'), nextPhoto: target('overview', 'viewer-next'), close: on('overview', '.iq-mv-close'), video: target('overview', 'file-video'),
  reports: target('overview', 'nav-Reports'), overview: target('data', 'nav-Overview'), history: target('overview', 'view-History'),
  dots: target('overview', 'dots-name'), keyword: target('overview', 'kw-name'), apply: target('overview', 'apply-name'), groupBy: target('overview', 'board-group-by'), person: target('overview', 'board-group-Person'),
  usageGroup: target('usage', 'group-by'), checkpoint: target('usage', 'group-Checkpoint'), gallery: target('usage', 'gallery-view'), range: target('usage', 'date-range'),
};

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (the pages and what each shows), `boardMarksAt` (the outlines of rows and columns), `marksAt` (the others), `cursorAt`, `artAt`.
function build(words) {
  const st = story(words, {title: TITLE_WORDS, slide: true}), {B, captions, mark} = st;
  const {hand, click, leave, finish: handDone} = cursorPlan();
  const say = (id, at) => st.say(id, SAYS[id][0], SAYS[id][1], at);
  const next = c => c.until + SLIDE.out;                              // the next sentence: once these words have gone
  const acted = (c, end) => { c.until = end + GONE; return c; };       // words with an action: they go `GONE` s after it has ended
  const shown = (c, at, n = 1) => { c.until = at + (n - 1) * EACH + SHOW + GONE; return c; }; // words that show n things outlined from `at`
  // the outlines of the board's table: the rows of the missions in a state, from their number to that state's column, with the column's title; or a whole column
  const boardMarks = [];
  const rows = (c, state, col) => { shown(c, c.written); boardMarks.push({from: c.written, to: c.until, kind: 'rows', state, col, pad: 6}); mark(c.written, c.until, [HEAD(col)], 5); };
  const column = (c, col) => { shown(c, c.written); boardMarks.push({from: c.written, to: c.until, kind: 'col', col, pad: 5}); };
  const each = (c, at, targets, pad = 5) => { shown(c, at, targets.length); targets.forEach((sel, i) => mark(at + i * EACH, c.until, [sel], pad)); }; // one after the other, all staying

  // 1 · the board: it comes in as the title goes; once the words are written it goes down to the West Location, its timers running
  B.board = B.titleOut + 0.15;
  const rhythm = say('rhythm', B.board + TR * 0.55);
  B.scroll = Math.max(rhythm.written, B.board + TR);
  acted(rhythm, B.scroll + SCROLL);
  // 2 · what the board says, outlined: the open missions (to Open), the claimed ones (to Claimed), the closed ones (to Closed At); who performed; the duration
  const aging = say('aging', next(rhythm)); rows(aging, 'open', 'open');
  const claimed = say('claimed', next(aging)); rows(claimed, 'claimed', 'claimed');
  const completed = say('completed', next(claimed)); rows(completed, 'closed', 'closed');
  const performed = say('performed', next(completed)); column(performed, 'by');
  const duration = say('duration', next(performed)); column(duration, 'duration');
  // 3 · the mission: the cursor opens Storage Room Check, its details come in at the right
  const details = say('details', next(duration));
  B.open = click(details.written, P.name);
  leave(); // (a scene's last click: the cursor goes, it never waits for the next words)
  acted(details, B.open + M);
  // 4 · its photos: the cursor opens them, goes to the next one, closes the viewer
  const photos = say('photos', next(details));
  B.photo = click(photos.written, P.photo);
  B.nextPhoto = click(B.photo + M + 0.35, P.nextPhoto);
  B.photoClose = click(B.nextPhoto + 0.8, P.close);
  leave();
  acted(photos, B.photoClose + PAGE);
  // 5 · its video: the cursor opens it and it plays (no cursor then); the cursor closes it
  const videos = say('videos', next(photos));
  B.video = click(videos.written, P.video);
  leave();
  B.play = B.video + M;
  B.videoClose = click(B.play + REC + 0.1, P.close);
  leave();
  acted(videos, B.videoClose + PAGE);
  // 6 · the data it collected: the three measurements, one after the other
  const data = say('data', next(videos));
  each(data, data.written, ['height', 'width', 'length'].map(k => target('overview', `data-${k}`)), 3);
  // 7 · the Data Board: the cursor goes to Reports; the same three measurements, every answer listed
  const dashboards = say('dashboards', next(data));
  B.reports = click(dashboards.written, P.reports);
  leave();
  each(dashboards, B.reports + PAGE + 0.15, ['height', 'width', 'length'].map(k => target('data', `stmt-${k}`)));
  // 8 · the two answers that were out of range, flagged, each with the ticket it raised
  const anomalies = say('anomalies', next(dashboards));
  shown(anomalies, anomalies.written);
  mark(anomalies.written, anomalies.until, [target('data', 'anomaly-height'), target('data', 'anomaly-length')], 5);
  // 9 · history: the cursor goes back to the Overview, then to its History
  const history = say('history', next(anomalies));
  B.toOverview = click(history.written, P.overview);
  B.hist = click(B.toOverview + PAGE + 0.15, P.history);
  B.histSwitch = B.hist + 0.15; // (the table dips, then History is there)
  leave();
  acted(history, B.histSwitch + 0.6);
  // 10 · by mission: the Name column's menu, the mission's name typed in its search, Apply: only its runs are left
  const byMission = say('byMission', next(history));
  B.dots = click(byMission.written, P.dots);
  B.kw = click(B.dots + 0.3, P.keyword);
  B.apply = click(B.kw + TYPE + 0.1, P.apply);
  leave();
  acted(byMission, B.apply + 0.6);
  // 11 · by person: the toolbar's Group by, then Person: the runs under who closed each one
  const byPerson = say('byPerson', next(byMission));
  B.groupBy = click(byPerson.written, P.groupBy);
  B.person = click(B.groupBy + 0.3, P.person);
  leave();
  acted(byPerson, B.person + 0.7);
  // 12 · by checkpoint: the cursor goes to Reports (the Usage Report), opens its Group by, picks Checkpoint
  const byCheckpoint = say('byCheckpoint', next(byPerson));
  B.usage = click(byCheckpoint.written, P.reports);
  B.usageGroup = click(B.usage + PAGE + 0.15, P.usageGroup);
  B.checkpoint = click(B.usageGroup + 0.3, P.checkpoint);
  leave();
  acted(byCheckpoint, B.checkpoint + 0.7);
  // 13 · the gallery: the cursor ticks Gallery View, every proof opens as a picture; the week it covers outlined
  const gallery = say('gallery', next(byCheckpoint));
  B.gallery = click(gallery.written, P.gallery);
  leave();
  B.rows = B.gallery + 0.25;
  shown(gallery, B.rows + M);
  mark(B.rows + M, gallery.until, [P.range], 5);
  // 14 · the area over time: the gallery goes down through the week's photos of the storage room
  const evolution = say('evolution', next(gallery));
  B.evolve = evolution.written;
  acted(evolution, B.evolve + EVOLVE);
  // 15 · the closing words, over the gallery: read, then the words go, then the board
  const visibility = say('visibility', next(evolution));
  visibility.until = visibility.written + READ(visibility.lines);
  B.end = next(visibility);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  // the board comes in as the title goes and goes after the last words
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  // the pages on: the one a click went to comes in over the one before in `PAGE` s -> [{page, op}], the one under first
  const PAGES = [{t: -Infinity, page: 'overview'}, {t: B.reports, page: 'data'}, {t: B.toOverview, page: 'overview'}, {t: B.usage, page: 'usage'}];
  function pagesAt(t) {
    let i = 0;
    while (i + 1 < PAGES.length && t >= PAGES[i + 1].t) i++;
    const op = i ? clamp((t - PAGES[i].t) / PAGE) : 1;
    return op < 1 && PAGES[i - 1].page !== PAGES[i].page ? [{page: PAGES[i - 1].page, op: 1}, {page: PAGES[i].page, op}] : [{page: PAGES[i].page, op: 1}];
  }
  // the Overview's frame (OverviewScene's): its view, how far down it is, the mission's details, the viewer, the Name column's menu, what History keeps, how it is grouped
  function overviewAt(t) {
    const history = t >= B.histSwitch, typed = t < B.kw ? '' : SEARCH.slice(0, Math.round(SEARCH.length * clamp((t - B.kw) / TYPE)));
    const viewer = t >= B.video
      ? {kind: 'video', in: prog(t, B.video, M) * (1 - prog(t, B.videoClose, PAGE, OUT)), live: clamp(t - B.play, 0, REC), index: 0}
      : {kind: 'photo', in: prog(t, B.photo, M) * (1 - prog(t, B.photoClose, PAGE, OUT)), live: 0, index: t >= B.nextPhoto ? 1 : 0};
    return {
      view: history ? 'History' : 'Running', historyDip: clamp((t - B.hist) / 0.15) * (1 - prog(t, B.histSwitch, 0.3, OUT)),
      scroll: history ? 0 : prog(t, B.scroll, SCROLL), time: Math.floor(Math.max(0, t - B.board)),
      drawer: t < B.reports + PAGE ? prog(t, B.open, M) : 0, viewer, // (the details go with the page, at the click on Reports)
      menu: t >= B.dots && t < B.apply ? {col: 'name', kw: typed} : null, filter: t >= B.apply ? {name: SEARCH} : null,
      group: t >= B.person ? 'Person' : 'Unit', groupMenu: t >= B.groupBy && t < B.person,
    };
  }
  // the Usage Report: its Group by and its menu, Gallery View, how far its pictures are open, how far down it is
  function usageAt(t) {
    return {groupBy: t >= B.checkpoint ? 'Checkpoint' : 'Unit', menu: t >= B.usageGroup && t < B.checkpoint ? prog(t, B.usageGroup, 0.25, OUT) : 0,
      web: {gallery: t >= B.gallery, scroll: prog(t, B.evolve, EVOLVE)}, rows: prog(t, B.rows, M)};
  }
  const stateAt = t => ({pages: pagesAt(t), overview: overviewAt(t), usage: usageAt(t)});
  // the outlines of rows and columns on at `t` (as `marksAt`'s: {..., op, pop})
  const boardMarksAt = t => boardMarks.filter(m => t >= m.from && t < m.to + 0.3).map(m => ({...m, op: prog(t, m.from, 0.38, OUT) * (1 - prog(t, m.to, 0.3, OUT)), pop: 1.04 - 0.04 * prog(t, m.from, 0.38, OUT)}));

  return {
    words, layout: null, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt, boardMarksAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeOversightCut = cutMaker(build);
