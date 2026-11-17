// Reporting & AI, the Remotion cut (the user, 2026-11-16: "based on all videos like requesting maintenance, precision planing, increased effeciency, the style and everything should be done to
// requesting support till reports & AI ... make it with remotion"; written, NOT played or rendered). It is the look `remotion` of lib/storyboardVariations.mjs on the board reporting-ai-v2: on the
// All videos page that board then plays THIS film in Remotion's Player (components/StoryboardRemotionCut.jsx), and the Remotion project D:\Documents\Saas\videos renders it to an MP4
// (composition RA-Cut). The art is components/remotion/ReportingCut.jsx: the web app's Data Board as the section's videos draw it (components/sections/ReportingStage.jsx, in its `bare` way),
// set by THIS file as a function of the time.
//
// Told as Precision Planning's is (lib/remotion/planningCut.mjs: one big page whose rows the cursor opens), with the tellers and the speeds the section films share
// (lib/remotion/sectionCore.mjs):
//   - the words SLIDE (`story(words, {slide: true})`): the blue label alone from the left, the white words written, the whole goes on to the right; the title is typed in place
//   - NEVER MORE THAN TWO LINES of words on top of each other: a label (two or three words) and a sentence of two short lines (`SAYS`); the narration's three-line sentences are told in two.
//     They are not the narration's, which the board's slides still say (lib/sections/reporting-ai.mjs)
//   - the action starts the moment the last word is written, and the words go `GONE` s after it has ended; words that only show something keep it `SHOW` s
//   - the CEO's rule (2026-10-20: big boards go edge to edge, the words at the bottom): ONE page, 1600 px across the picture from its top to the band, every sentence in the band. Nothing
//     moves the page: a level folds open, its rows come in one after the other, the list scrolls to the row that was opened
//   - what is only shown is outlined in yellow, AFTER its level has opened; what is done is done by the cursor (it opens the unit, the team, the person, the mission, the photo, closes it,
//     opens the video), which leaves before a viewer comes in or a clip plays
//   - one speed (a move 0.76 s on Easy Ease 70%), a viewer comes in over the page in `XF`
// ONE thread, one level deeper in each scene: West Location, Operations, Emily Carter, Safety Check, the walkway's width (118) and the photo and the video that prove it.
// Pure: no React, no Remotion.
import {CURSOR, CUT_FPS, CUT_H, CUT_W, M, clamp, cursorPlan, cutMaker, prog, story, voiceOf} from './cutCore.mjs';
import {scrollAt} from './auditingCut.mjs';
import {EACH, SHOW, TR, XF, tellers, tg} from './sectionCore.mjs';

export {CUT_FPS, CUT_H, CUT_W};
export const REPORTING_CUT_ID = 'RA-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['RA-Cut'])
export const TITLE_WORDS = {lines: ['AI Optimization Requires', 'Collecting Extensive Data'], mark: null};
export const BOARD = {w: CUT_W, h: 744}; // the page, edge to edge, from the picture's top to the band of the words (its straight edge, y 744)

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['RA-Cut'], lib/remotion/cutWords.mjs). The label two or three words, the sentence two short lines, never more ----
const SAYS = {
  units: ['Per unit', ['Reports Show Execution', 'Summary Per Unit']],
  teams: ['Per team', ['Within Any Unit', 'Review Details By Team']],
  people: ['Per person', ['Within Any Team', 'Review Details Per Person']],
  missions: ['Per mission', ['For Any Person', 'Review Details Per Mission']],
  statements: ['Per statement', ['Within Any Mission', 'Review Each Statement']],
  evidence: ['Data and evidence', ['Review The Data Entered', 'And The Evidence Collected']],
  conclusion: ['Ready for AI', ['These Details Feed AI', 'To Optimize Performance']],
};

// ---- the speeds of its own (the others: sectionCore) ----
const ROWS = 0.9;                     // the rows of a level that opens, one after the other (all in by then)
const OPENED = Math.max(M, ROWS) + 0.1; // a level is open and its rows are in: it is outlined
const LOOK = 1.2;                     // the photo is looked at before the cursor comes back to close it
const WATCH = 2.6;                    // the video plays this long before the words go

// ---- what the cursor presses and what is outlined (the page says its name: data-rc-layer="page"; the rows are named by components/sections/ReportingStage.jsx: unit-0, team-0, person-0,
// mission-0, and their blocks) ----
const WIN = '[data-rc-layer="page"] .sec-scroll'; // (an outline is cut to the list's window when the list scrolls)
const row = id => `${tg('page', id)} > .iq-dr-row`; // (the row of a block: its first child)
const P = {
  unit: `${row('unit-0')} .iq-ur-toggle`, team: `${row('team-0')} .iq-ur-toggle`, person: `${row('person-0')} .iq-ur-toggle`, // (a group's row is opened by its toggle)
  mission: `${row('mission-0')} > span:first-child > b`,                                                                    // (a mission's by its name)
  entry: tg('page', 'entry'), photo: tg('page', 'evidence-photo'), close: tg('page', 'lightbox-close'), video: tg('page', 'evidence-video'),
};
const BLOCK = {units: tg('page', 'units-block'), teams: tg('page', 'teams-block'), people: tg('page', 'people-block'), missions: tg('page', 'missions-block'), statements: tg('page', 'statements-block')};

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (how far each level is open, its rows, where the list is, the viewer), `marksAt`, `cursorAt`, `artAt`.
// What the NARRATOR says, line by line (the layout `NARRATOR`, the look `remotion-narrator`; the user, 2026-11-16: "for all videos add a narrator style voice over variation ... the same
// video just with a narrator behind it instead of reading what's on screen", as Increased Efficiency's Variation 10): the screen shows the same words, the voice talks to the viewer about
// what is shown, in the second person. A sentence stays as long as the narrator talks (the voice sets the pace: lib/remotion/cutCore.mjs `story`). Change a line here, or retype it on the
// Titles panel ('<id>:voice'), then make the voice again (`npm run gen:voice -- --layout narrator`). Written, NOT played.
export const NARRATION = {
  title: "AI is only as good as the data behind it. So let's look at the data.",
  units: "Reports start with a summary of execution, unit by unit.",
  teams: "Open a unit, and you see how each team is doing.",
  people: "Open a team, and you see each person.",
  missions: "Pick a person, and there are their missions.",
  statements: "Inside a mission, you can review every single statement.",
  evidence: "Right down to the data that was entered, and the evidence that was collected.",
  conclusion: "It's exactly this level of detail that lets AI optimize your performance.",
};
// `layout`: none, or `NARRATOR` (lib/remotion/cutCore.mjs): the same film with the narrator's voice
function build(words, {layout = null} = {}) {
  const st = story(words, {title: TITLE_WORDS, slide: true, ...voiceOf(REPORTING_CUT_ID, layout, NARRATION)}), {B, captions, mark} = st;
  const {hand, click, leave, finish: handDone} = cursorPlan();
  const {say, next, last, acted, shown, read} = tellers(st, SAYS);
  const outline = (c, at, targets, pad = 5) => { shown(c, at, targets.length); targets.forEach((sel, i) => mark(at + i * EACH, c.until, [sel], pad, WIN)); }; // one after the other, all staying
  // a level: the cursor opens its row as the last word is written and leaves; once it is open and its rows are in, it is outlined
  const level = (c, target, block) => { const at = click(c.written, target); leave(); outline(c, at + OPENED, [block]); return at; };

  // 1 · the page comes in as the title goes: every unit with what was done in each, outlined
  B.board = B.titleOut + 0.15;
  const units = say('units', B.board + TR * 0.55);
  outline(units, Math.max(units.written, B.board + TR), [BLOCK.units]);
  // 2 · the cursor opens the first unit (West Location): its teams, outlined
  const teams = say('teams', next(units));
  B.unit = level(teams, P.unit, BLOCK.teams);
  // 3 · the cursor opens the first team (Operations): the list goes to it, its people, outlined
  const people = say('people', next(teams));
  B.team = level(people, P.team, BLOCK.people);
  // 4 · the cursor opens the first person (Emily Carter): their missions, outlined
  const missions = say('missions', next(people));
  B.person = level(missions, P.person, BLOCK.missions);
  // 5 · the cursor opens the first mission (Safety Check): its statements, outlined
  const statements = say('statements', next(missions));
  B.mission = level(statements, P.mission, BLOCK.statements);
  // 6 · the data entered is outlined (the walkway's 118); then the cursor opens the photo (the viewer comes in over the page; the cursor leaves: the CEO, 2026-10-16, "when you press on it,
  // make the hand disappear ... if you want to close the picture, make the hand appear again and close it"), comes back to close it, then opens the video, which plays (the cursor leaves)
  const evidence = say('evidence', next(statements));
  B.entry = evidence.written;
  B.photo = click(B.entry + SHOW, P.photo);
  leave();
  mark(B.entry, B.photo - 0.3, [P.entry], 6, WIN); // (gone as the viewer comes: an outline is drawn over everything)
  B.closePhoto = click(B.photo + XF + LOOK, P.close);
  B.video = click(B.closePhoto + XF + 0.15, P.video);
  leave();
  B.play = B.video + CURSOR.hold + CURSOR.fade; // (the clip plays once the viewer is in and the cursor has gone)
  acted(evidence, B.play + WATCH);
  B.shut = st.until(evidence); // (the viewer goes with these words, or with the last title added after them: the closing words are read over the page)
  // 7 · the closing words, over the page open down to the statements: read, then the words go, then the page
  const conclusion = read(say('conclusion', next(evidence)));
  B.end = last(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  // where the list is scrolled: to the row that was opened, as it opens (components/remotion/ReportingCut.jsx measures the rows each frame)
  const SCROLL = [{t: -Infinity, key: 'top'}, {t: B.unit, key: 'unit-0'}, {t: B.team, key: 'team-0'}, {t: B.person, key: 'person-0'}, {t: B.mission, key: 'mission-0'}];
  const OPENS = [B.unit, B.team, B.person, B.mission];
  function stateAt(t) {
    // the viewer: the photo (in at its click, out at the close's), then the video (in at its click, playing once the cursor has gone, out as the words go). It is on the page from the
    // photo's click to the end, unseen (`op` 0) between the two: the cursor goes from its close button to the video, and a place that is no longer drawn cannot be measured
    const isVideo = t >= B.video, op = isVideo ? prog(t, B.video, XF) * (1 - prog(t, B.shut, XF)) : prog(t, B.photo, XF) * (1 - prog(t, B.closePhoto, XF));
    const on = t >= B.photo && t < B.shut + XF;
    return {
      open: OPENS.map(at => prog(t, at, M)),          // how far each level is open: [the unit, the team, the person, the mission], 0 to 1 (the fold)
      rows: OPENS.map(at => clamp((t - at) / ROWS)),  // how far its rows have come in, one after the other (a straight 0 to 1)
      scroll: scrollAt(SCROLL, t),
      viewer: on ? {kind: isVideo ? 'video' : 'photo', op, playing: isVideo && t >= B.play, time: isVideo ? Math.max(0, t - B.play) : 0} : null,
    };
  }

  return {
    words, layout, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeReportingCut = cutMaker(build);
