// Precision Planning, the Remotion cut (the user, 2026-11-12, after Live Oversight's: "do next ones dynamic auditing and precision planning ... using remotion and same style as increased effeciency";
// written, NOT played or rendered). It is the look `remotion` of lib/storyboardVariations.mjs on the board precision-planning-v2: on the All videos page that board then plays THIS film in Remotion's
// Player (components/StoryboardRemotionCut.jsx), and the Remotion project D:\Documents\Saas\videos renders it to an MP4 (composition PP-Cut). The art is components/remotion/PlanningCut.jsx: the web
// app's Overview, Personal Board, Timeline page as the section's videos draw it (components/sections/PlanningStage.jsx), set by THIS file as a function of the time.
//
// Told as Live Oversight's, Dynamic Auditing's, Increased Efficiency's Variation 7 and Improved Quality's Variation 4 are (lib/remotion/oversightCut.mjs says why, at its top):
//   - the words SLIDE (`story(words, {slide: true})`): the blue label alone from the left, the white words written, the whole goes on to the right; the title is typed in place
//   - NEVER MORE THAN TWO LINES of words on top of each other (the user, 2026-11-12: "always no more than two sentences on top of eachother (rewrite it if it's too long)"): a label (two or three
//     words) and a sentence of two short lines (`SAYS`); the narration's four-line closing words are told in two. They are not the narration's, which the board's slides still say
//     (lib/sections/precision-planning.mjs). When words are retyped, the first letter of each word is a capital (lib/remotion/cutWords.mjs `titleCase`)
//   - the action starts the moment the last word is written, and the words go `GONE` s after it has ended; words that only show something keep it `SHOW` s
//   - the CEO's rule (2026-10-20: big boards go edge to edge; planning is one of them; the words at the bottom): ONE page, 1600 px across the picture from its top to the band, every sentence in the
//     band. Nothing moves the page: rows fold open, the list scrolls to the team
//   - what is only shown is outlined in yellow; what is done is done by the cursor (opens the location, the team, the number 1, the second team)
//   - one speed (a move 0.76 s on Easy Ease 70%)
// ONE thread: the Restroom Cleaning mission and its team (Operations), from the list of locations to the schedules of two teams. Pure: no React, no Remotion.
import {CUT_FPS, CUT_H, CUT_W, M, SLIDE, cursorPlan, cutMaker, prog, story} from './cutCore.mjs';
import {scrollAt} from './auditingCut.mjs';

export {CUT_FPS, CUT_H, CUT_W};
export const PLANNING_CUT_ID = 'PP-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['PP-Cut'])
export const TITLE_WORDS = {lines: ['Planning Dashboards', 'Optimize Workload Distribution'], mark: null};
export const BOARD = {w: CUT_W, h: 744}; // the page, edge to edge, from the picture's top to the band of the words (its straight edge, y 744)

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['PP-Cut'], lib/remotion/cutWords.mjs). The label two or three words, the sentence two short lines, never more ----
const SAYS = {
  units: ['Units and locations', ['The Organization Is Divided', 'Into Units Or Locations']],
  teams: ['Teams', ['Each Location Holds', 'Its Own Teams']],
  distribution: ['Workload by hour', ['Each Team’s Workload Is', 'Spread Over Time']],
  missions: ['Scheduled missions', ['Open A Team To See', 'Its Scheduled Missions']],
  specific: ['Set times', ['A Mission Can Occur', 'At Specific Times']],
  recurring: ['Recurring', ['A Mission Can Recur', 'Within Time Intervals']],
  summary: ['Hourly counts', ['Each Number Is', 'A Run In That Hour']],
  multiple: ['Many teams', ['One Mission Can Be', 'Scheduled For Many Teams']],
  custom: ['Custom schedules', ['Every Team Customizes', 'Its Own Schedule']],
  conclusion: ['Balanced workload', ['No Team Is Overloaded', 'Or Underutilized']],
};

// ---- the speeds (Increased Efficiency's) ----
const QUICK = 1.3, TR = M / QUICK, GONE = 0.3;
const SHOW = 1.1, EACH = 0.45;
const READ = lines => 0.8 + lines.join('').replace(/\s+/g, '').length / 18;

// ---- what the cursor presses and what is outlined (the page says its name: data-rc-pl) ----
const tg = key => `[data-rc-pl="page"] [data-iq-target="${key}"]`, WIN = '[data-rc-pl="page"] .sec-scroll'; // (an outline is cut to the list's window when the list scrolls)
const P = {unit: tg('row-unit'), ops: tg('row-ops'), kitchen: tg('row-kitchen')};
const HOURS = id => `${tg(`mission-${id}`)} .sec-pl-hours`; // (a mission's 24 hours with the count in each)
const TOGGLE = {x: 0.03, y: 0.5}; // (a row is pressed at its left, where its toggle is)

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (what is open and where the list is), `marksAt`, `cursorAt`, `artAt`.
function build(words) {
  const st = story(words, {title: TITLE_WORDS, slide: true}), {B, captions, mark} = st;
  const {hand, click, leave, finish: handDone} = cursorPlan();
  const say = (id, at) => st.say(id, SAYS[id][0], SAYS[id][1], at);
  const next = c => c.until + SLIDE.out;                              // the next sentence: once these words have gone
  const acted = (c, end) => { c.until = end + GONE; return c; };       // words with an action: they go `GONE` s after it has ended
  const shown = (c, at, n = 1) => { c.until = at + (n - 1) * EACH + SHOW + GONE; return c; };
  const outline = (c, at, targets, pad = 5) => { shown(c, at, targets.length); targets.forEach((sel, i) => mark(at + i * EACH, c.until, [sel], pad, WIN)); }; // one after the other, all staying

  // 1 · the page comes in as the title goes: the locations, outlined
  B.board = B.titleOut + 0.15;
  const units = say('units', B.board + TR * 0.55);
  outline(units, Math.max(units.written, B.board + TR), [tg('units-block')]);
  // 2 · the cursor opens the location: its teams, outlined
  const teams = say('teams', next(units));
  B.unit = click(teams.written, P.unit, TOGGLE);
  leave();
  outline(teams, B.unit + M + 0.1, [tg('teams-block')]);
  // 3 · each team's workload by the hour, outlined
  const distribution = say('distribution', next(teams));
  outline(distribution, distribution.written, [tg('distribution')], 3);
  // 4 · the cursor opens the team: the list goes to it, its missions, outlined
  const missions = say('missions', next(distribution));
  B.ops = click(missions.written, P.ops, TOGGLE);
  leave();
  outline(missions, B.ops + M + 0.1, [tg('missions-ops')]);
  // 5 · a mission at set times, 6 · a mission that recurs: outlined
  const specific = say('specific', next(missions));
  outline(specific, specific.written, [tg('mission-opening')]);
  const recurring = say('recurring', next(specific));
  outline(recurring, recurring.written, [tg('mission-restroom-ops')]);
  // 7 · the counts: the number in each hour a mission occurs, outlined (the real page has no box that sums a schedule up: the user, 2026-11-12, of the stage's: "this UI doesn't exist in real
  // software", so it is not drawn here (`bare` leaves it out) and nothing is pressed)
  const summary = say('summary', next(recurring));
  outline(summary, summary.written, [HOURS('restroom-ops')], 3);
  // 8 · the same mission in two teams: the cursor opens the second team, both missions outlined
  const multiple = say('multiple', next(summary));
  B.kitchen = click(multiple.written, P.kitchen, TOGGLE);
  leave();
  outline(multiple, B.kitchen + M + 0.1, [tg('mission-restroom-ops'), tg('mission-restroom-kitchen')]);
  // 9 · each team's own schedule: the hours of each, one after the other
  const custom = say('custom', next(multiple));
  outline(custom, custom.written, [HOURS('restroom-ops'), HOURS('restroom-kitchen')], 3);
  // 10 · the closing words: read, then the words go, then the page
  const conclusion = say('conclusion', next(custom));
  conclusion.until = conclusion.written + READ(conclusion.lines);
  B.end = next(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t`: how far each row is open (0 to 1), the schedule boxes, where the list is scrolled ----
  const SCROLL = [{t: -Infinity, key: 'top'}, {t: B.ops, key: 'team-ops'}];
  function stateAt(t) {
    return {unit: prog(t, B.unit, M), ops: prog(t, B.ops, M), kitchen: prog(t, B.kitchen, M), scroll: scrollAt(SCROLL, t)};
  }

  return {
    words, layout: null, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makePlanningCut = cutMaker(build);
