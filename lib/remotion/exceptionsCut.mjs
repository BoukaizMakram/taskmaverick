// Exception Management, the Remotion cut (the user, 2026-11-16: "based on all videos like requesting maintenance, precision planing, increased effeciency, the style and everything should be
// done to requesting support till reports & AI ... make it with remotion, and make sure it's as good as the others"; written, NOT played or rendered). It is the look `remotion` of
// lib/storyboardVariations.mjs on the board exception-management-v2: on the All videos page that board then plays THIS film in Remotion's Player (components/StoryboardRemotionCut.jsx), and
// the Remotion project D:\Documents\Saas\videos renders it to an MP4 (composition EM-Cut). The art is components/remotion/ExceptionsCut.jsx: the section's own pieces
// (components/sections/ExceptionsStage.jsx: the mission a cause is in, the card a cause is on, the alert ticket it raises), set by THIS file as a function of the time.
//
// Told as Requesting Maintenance's is (lib/remotion/maintenanceCut.mjs is the model; the style, the sizes, the speeds and the layouts are lib/remotion/sectionCore.mjs, the pieces
// components/remotion/SectionParts.jsx): the words slide, a label and a sentence of two short lines (`SAYS`: not the narration's "Based On ...", which the board's slides still say); only what
// the real software has is drawn. It has no click: nothing is done, everything is shown, so it has no cursor.
//
// NO TABLET and no board of tickets. SIX CAUSES, each raising ONE alert ticket for the manager. What stands through the film is the manager's section: the Open tab of the Operations ticket
// board, over the place where each ticket pops, its count going up by one at each.
//   1 · alerted: the tab alone, "Open - 0", in the middle of the room (what is on a slide is centered); it glides to its place as the first cause comes in
//   2 · data: the mission the cause is in, its panel at the LEFT of that place (not in the middle first: the tab is there already, and a cause is in the same place from scene to scene);
//       the temperature is entered, 52 °F, out of range: flagged and the TRIGGER, in the ticket's border color; the Temperature Alert pops under the tab, an arrow from the mission to it,
//       outlined; the tab says Open - 1
//   3 · audit: a cause replaces the one before by a change of screen (the old cause, its arrow and its ticket go; the tab stays): the Closing Audit, "Are there any safety hazards?" answered
//       Yes, the trigger (at the right, pink), with its video; the Safety Alert
//   4 · delays: a CARD is the cause, where the mission was (it ends where the mission ended, so the arrow is the same one): Check Inventory, its timer red after more than an hour and
//       still running, outlined; then Performance Delays
//   5 · executions: Clean Room, done in one minute: its execution time outlined; then Quality Concern
//   6 · ratings: Clean Room with its two poor ratings, outlined; then Low Rating Alert
//   7 · surveys: the Safety Survey, "Have you been injured?" answered Yes, the trigger; the Injury Alert
//   8 · conclusion: the big picture. The six alert tickets pop one after the other into a grid of three by two under the tab "Open - 6", their timers going on from when each was raised
// A ticket's timer starts at 00:00:00 as it pops; the delayed mission's goes on a second a second, a closed card's are stopped; an open mission's panel counts too. Pure: no React, no Remotion.
import {CUT_FPS, CUT_H, CUT_W, M, POST, clock, cursorPlan, cutMaker, mix, prog, story, voiceOf} from './cutCore.mjs';
import {CARD, GONE, MID, PANEL, POPS, READ, SHOW, TR, XF, chainLayout, panelLeft, popped, step, tellers, tg} from './sectionCore.mjs';

export {CUT_FPS, CUT_H, CUT_W, PANEL};
export const EXCEPTIONS_CUT_ID = 'EM-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['EM-Cut'])
export const TITLE_WORDS = {lines: ['Managing By Exception', 'Optimizes Resource Utilization'], mark: null};

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['EM-Cut'], lib/remotion/cutWords.mjs). The label two or three words, the sentence two short lines, never more ----
const SAYS = {
  alerted: ['Automatic alerts', ['Managers Are Alerted', 'Automatically']],
  data: ['Data entries', ['Out-Of-Range Readings', 'Raise An Alert']],
  audit: ['Audit findings', ['Hazards Found In Audits', 'Raise An Alert']],
  delays: ['Excessive delays', ['Missions Left Open Too Long', 'Raise An Alert']],
  executions: ['Rushed work', ['Work Done Too Fast', 'Raises A Quality Concern']],
  ratings: ['Poor ratings', ['Poor Ratings From Peers', 'Raise An Alert']],
  surveys: ['Survey answers', ['Worrying Survey Answers', 'Raise An Alert']],
  conclusion: ['The big picture', ['Managers Are Freed For', 'The Big Picture']],
};

// ---- the six causes, in the narration's order. `panel`: the mission it is in is shown (its timer has run `base` s when it comes in); else the card it is on, `part` of which is outlined
// (FlowPart names a card's parts <id>-pill, <id>-exec, <id>-ratings). The art's own data (the missions, the cards, the tickets) is components/sections/ExceptionsStage.jsx's ----
export const CAUSES = [
  {id: 'data', panel: true, base: 252},
  {id: 'audit', panel: true, base: 408},
  {id: 'delays', part: 'pill'},
  {id: 'executions', part: 'exec'},
  {id: 'ratings', part: 'ratings'},
  {id: 'surveys', panel: true, base: 135},
];
const ANSWERED = 0.7; // an answer is seen this long before the ticket it raises pops
const SEEN = 0.9;     // what is wrong on a card is outlined this long before its ticket pops
const DELAYED = 4360; // the delayed mission's timer as it comes in (01:12:40): it goes on a second a second

// ---- where things stand (stage px; lib/remotion/sectionCore.mjs) ----
// a cause, an arrow, its ticket: the mission's panel and the ticket are RM's chain; a card that is the cause ENDS where the panel ends (`END`), so the arrow never changes
export const CHAIN = chainLayout({right: 'ticket'});
const END = CHAIN.right - CHAIN.gap;
export const PLACE = {left: panelLeft(CHAIN.left), top: PANEL.top, scale: PANEL.scale}; // the mission's panel, at the left
export const SOURCE = {k: CHAIN.k, x: END - CARD.w * CHAIN.k, y: MID.y - CARD.h * CHAIN.k / 2, rated: 35 * CHAIN.k}; // the card; one with its ratings under it is taller (about 70 board units): it stands half of that higher
// the manager's Open tab: over the ticket's place; alone, in the middle of the room
export const TAB = {k: CHAIN.k, h: 38 * CHAIN.k, gap: 22, x: CHAIN.right};
TAB.y = CHAIN.y - TAB.gap - TAB.h;
TAB.alone = {x: MID.x - CHAIN.w / 2, y: MID.y - TAB.h / 2};
// the big picture: the six tickets, three by two, under the tab in the middle; `at(i)`: the i-th's place
const GK = 1.1, GW = CARD.w * GK, GH = CARD.ticket * GK, GDX = 26, GDY = 22, GTAB = 38 * GK, GGAP = 20, GTOP = Math.round(MID.y - (GTAB + GGAP + 2 * GH + GDY) / 2), GX = MID.x - (3 * GW + 2 * GDX) / 2;
export const GRID = {k: GK, tab: {x: MID.x - GW / 2, y: GTOP}, at: i => ({x: GX + (i % 3) * (GW + GDX), y: GTOP + GTAB + GGAP + Math.floor(i / 3) * (GH + GDY)})};

// ---- what is outlined (each layer says its name: `Layer id`, SectionParts.jsx; the cards are all in the layer 'cards': a cause's card is named by its cause, its ticket alert-<cause>) ----
const P = {part: (id, part) => tg('cards', `${id}-${part}`), alert: id => tg('cards', `alert-${id}`)};

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (every piece of the picture, where it is and what it shows), `marksAt`, `cursorAt` (never anything: nothing is clicked), `artAt`.
// What the NARRATOR says, line by line (the layout `NARRATOR`, the look `remotion-narrator`; the user, 2026-11-16: "for all videos add a narrator style voice over variation ... the same
// video just with a narrator behind it instead of reading what's on screen", as Increased Efficiency's Variation 10): the screen shows the same words, the voice talks to the viewer about
// what is shown, in the second person. A sentence stays as long as the narrator talks (the voice sets the pace: lib/remotion/cutCore.mjs `story`). Change a line here, or retype it on the
// Titles panel ('<id>:voice'), then make the voice again (`npm run gen:voice -- --layout narrator`). Written, NOT played.
export const NARRATION = {
  title: "You can't watch everything. And you shouldn't have to.",
  alerted: "Instead, you're alerted automatically, only when something needs you.",
  data: "A reading that's out of range? You get an alert.",
  audit: "A hazard found during an audit? Another alert.",
  delays: "A mission left open for too long? You'll know.",
  executions: "Work that was done suspiciously fast gets flagged, too.",
  ratings: "So do poor ratings from peers.",
  surveys: "And so do survey answers that should worry you.",
  conclusion: "Everything else simply runs, and you're free to focus on the big picture.",
};
// `layout`: none, or `NARRATOR` (lib/remotion/cutCore.mjs): the same film with the narrator's voice
function build(words, {layout = null} = {}) {
  const st = story(words, {title: TITLE_WORDS, slide: true, ...voiceOf(EXCEPTIONS_CUT_ID, layout, NARRATION)}), {B, captions, mark} = st;
  const {hand, finish: handDone} = cursorPlan(); // (no stop: the cursor never shows)
  const {say, next, last, shown, read} = tellers(st, SAYS);

  // 1 · the manager's Open tab comes in as the title goes, alone in the middle: Open - 0
  B.board = B.titleOut + 0.15;
  const alerted = read(say('alerted', B.board + TR * 0.55));
  // 2 to 7 · the causes, one after the other: the cause comes in with its words (a change of screen), what is wrong is entered (a mission) or outlined (a card) as the last word is written,
  // then its ticket pops under the tab, its arrow after it, and is outlined
  let before = alerted;
  const scenes = CAUSES.map(k => {
    const c = say(k.id, next(before)), answer = c.written, pop = answer + (k.panel ? ANSWERED : SEEN);
    shown(c, pop + M);
    if (!k.panel) mark(answer, c.until, [P.part(k.id, k.part)], 5);
    mark(pop + M, c.until, [P.alert(k.id)], 6);
    B[`${k.id}In`] = c.at; B[`${k.id}Answer`] = answer; B[`${k.id}Pop`] = pop;
    before = c;
    return {...k, at: c.at, answer, pop};
  });
  // 8 · the big picture: the last cause goes, the tab glides to the middle, the six tickets pop one after the other into the grid; read
  const conclusion = say('conclusion', next(before));
  B.grid = conclusion.at;
  B.gather = Math.max(conclusion.written, B.grid + M);
  B.gathered = B.gather + (scenes.length - 1) * POST.each + POPS;
  conclusion.until = Math.max(conclusion.written + READ(conclusion.lines), B.gathered + SHOW + GONE);
  B.end = last(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  const after = (t, at) => Math.min(1, Math.max(0, (popped(t, at) - 0.4) / 0.6)); // (an arrow comes after the card it goes to)
  function stateAt(t) {
    // the tab: from the middle to its place over the tickets as the first cause comes in, to the middle again over the grid; it counts the tickets raised
    const p1 = step(t, scenes[0].at), p2 = step(t, B.grid);
    const tab = {x: mix(mix(TAB.alone.x, TAB.x, p1), GRID.tab.x, p2), y: mix(mix(TAB.alone.y, TAB.y, p1), GRID.tab.y, p2), k: mix(TAB.k, GRID.k, p2), n: scenes.filter(s => t >= s.pop).length};
    const panels = [], sources = [], tickets = [], arrows = [];
    scenes.forEach((s, i) => {
      const out = 1 - prog(t, scenes[i + 1]?.at ?? B.grid, XF), op = prog(t, s.at, XF) * out; // (a cause comes in over the one before, which goes as it comes)
      if (op > 0.001) {
        // the mission the cause is in: its panel, the answer entered or not yet, its timer going on
        if (s.panel) panels.push({id: s.id, op, step: t >= s.answer ? 1 : 0, timer: clock(s.base + Math.max(0, t - s.at)), left: PLACE.left, top: PLACE.top, scale: PLACE.scale});
        // the card the cause is on (`pill`: the delayed mission's timer, which goes on; null: the card's own, stopped)
        else sources.push({id: s.id, x: SOURCE.x, y: SOURCE.y - (s.part === 'ratings' ? SOURCE.rated : 0), k: SOURCE.k, op, pill: s.id === 'delays' ? clock(DELAYED + Math.max(0, t - s.at)) : null});
      }
      if (t >= s.pop && out > 0.001) {
        tickets.push({id: `alert-${s.id}`, kind: s.id, x: CHAIN.right, y: CHAIN.y, k: CHAIN.k, pop: popped(t, s.pop), op: out, pill: clock(t - s.pop)});
        const a = after(t, s.pop) * out;
        if (a > 0.001) arrows.push({id: s.id, from: [END + CHAIN.pad, MID.y], to: [CHAIN.right - CHAIN.pad, MID.y], op: a});
      }
    });
    // the big picture: every ticket again, in the grid, popping one after the other; its timer has gone on since it was raised
    const grid = scenes.map((s, i) => ({id: `all-${s.id}`, kind: s.id, ...GRID.at(i), k: GRID.k, pop: popped(t, B.gather + i * POST.each), pill: clock(t - s.pop)})).filter(g => g.pop > 0);
    return {tab, panels, sources, tickets, arrows, grid};
  }

  return {
    words, layout, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeExceptionsCut = cutMaker(build);
