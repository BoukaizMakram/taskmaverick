// Tracking Expirations, the Remotion cut (the user, 2026-11-16: "based on all videos like requesting maintenance, precision planing, increased effeciency, the style and everything should be
// done to requesting support till reports & AI ... make it with remotion"; written, NOT played or rendered). It is the look `remotion` of lib/storyboardVariations.mjs on the board
// tracking-expirations-v2: on the All videos page that board then plays THIS film in Remotion's Player (components/StoryboardRemotionCut.jsx), and the Remotion project
// D:\Documents\Saas\videos renders it to an MP4 (composition TE-Cut). The art is components/remotion/ExpirationsCut.jsx: the product's own pieces (a board's column tab, the items' cards, an
// alert ticket's card), set by THIS file as a function of the time, so a frame is the same in the Player and in a render.
//
// Told as Requesting Maintenance's is (lib/remotion/maintenanceCut.mjs is the model; what these films share, the style, the sizes, the speeds, the layouts, the tellers:
// lib/remotion/sectionCore.mjs; their pieces: components/remotion/SectionParts.jsx). The words slide, never more than two lines (a label, a sentence of two short lines: `SAYS`, not the
// narration's, which the board's slides still say: lib/sections/tracking-expirations.mjs).
//   NO TABLET: the board "Food Freshness" is its Open section by itself, the tab over the five items (`OPEN`), in the middle of the room. No cursor: nothing is pressed in this film.
//   1 · posted: the tab, then the five items pop in one after the other, each at the bottom (the oldest first: the longer the timer, the higher), the tab's count going up
//   2 · timers: each item's timer outlined in turn
//   3 · nears: Cooked Rice's timer runs fast to the orange age, turns orange (its pill pops once) and the card rises to second place, the ones it passes going down
//   4 · cue: the two orange timers outlined
//   5 · expired: its timer runs fast to the red age, turns red (the pill pops), the card rises to the top
//   6 · alert: a camera move: the section goes to the left and the alert ticket pops at the right of the red item, level with it, an arrow from the item to it, outlined (`CHAIN`)
//   7 · the closing words, read over that
// ONE thread: Cooked Rice. Pure: no React, no Remotion.
import {CUT_FPS, CUT_H, CUT_W, M, clamp, clock, cutMaker, mix, prog, story, voiceOf} from './cutCore.mjs';
import {POPS, TR, chainLayout, popped, sectionLayout, step, tellers, tg} from './sectionCore.mjs';

export {CUT_FPS, CUT_H, CUT_W};
export const EXPIRATIONS_CUT_ID = 'TE-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['TE-Cut'])
export const TITLE_WORDS = {lines: ['Expiration Tracking Can Be', 'Automated To Minimize Waste'], mark: null};

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['TE-Cut'], lib/remotion/cutWords.mjs). The label two or three words, the sentence two short lines, never more ----
const SAYS = {
  posted: ['Automatic posting', ['Items Are Posted As', 'Received Or Produced']],
  timers: ['Aging timers', ['Each Item Has A Timer', 'Measuring Its Age']],
  nears: ['Nearing expiration', ['Near Expiration, Green', 'Turns To Orange']],
  cue: ['Visual cue', ['Orange Tells Teams', 'Expiration Is Near']],
  expired: ['Expired', ['At Expiration, Orange', 'Turns To Red']],
  alert: ['Automated alert', ['An Alert Tells Teams', 'To Remove The Item']],
  conclusion: ['No manual checks', ['Expirations Are Tracked', 'Without Manual Inspections']],
};

// ---- the items of the board, in the order they were posted, and how long each has waited when the film opens (the section's own: components/sections/ExpirationsStage.jsx `ITEMS`, phase 0:
// a plan cannot read a component's file, so the five are said again here) ----
export const ITEMS = [
  {id: 'chicken', title: 'Grilled Chicken', age: 18720},
  {id: 'salmon', title: 'Fresh Salmon', age: 7512},
  {id: 'mozzarella', title: 'Mozzarella', age: 6030},
  {id: 'tomatoes', title: 'Cut Tomatoes', age: 4222},
  {id: 'rice', title: 'Cooked Rice', age: 1844},
];
// An item's timer is green, orange from five hours (it nears expiration: Grilled Chicken is there when the film opens), red from eight (it has expired)
const ORANGE_AT = 5 * 3600, RED_AT = 8 * 3600, toneOf = s => (s >= RED_AT ? 'red' : s >= ORANGE_AT ? 'orange' : 'green');
// Every timer runs a second a second. Cooked Rice's alone runs FAST twice (the opt-in fast run of a timer that ages on screen, as Requesting Maintenance's ticket: sectionCore `agingOf`):
// two hours of its time a second, to just past the orange age, then to just past the red one; between and after, a second a second again
const RATE = 7200, PAST = 8;
const POSTS = 0.3; // items posted, one after the other (Dynamic Auditing's audits)

// ---- where things stand (stage px; lib/remotion/sectionCore.mjs) ----
// the Open section with no tablet: its tab over five cards, in the middle of the room (as big as five cards fit over the band)
export const OPEN = sectionLayout({k: 0.88, slots: 5});
// 6 · the section and the alert ticket it raises at its right: the section goes this far to the left (the camera's move), the ticket pops level with the first card, the red item's
export const CHAIN = chainLayout({leftW: OPEN.w, k: 1, right: 'ticket'});
const LEVEL = OPEN.slotY(0) + OPEN.card / 2;
export const ALERT = {x: CHAIN.right, y: LEVEL - CHAIN.h / 2, k: CHAIN.k};

// ---- what is outlined (each layer says its name; a card's timer is <id>-pill: components/sections/parts.jsx FlowPart) ----
const P = {pill: id => tg('open', `${id}-pill`), alert: tg('cards', 'alert')};

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (every piece of the picture, where it is and what it shows), `marksAt`, `artAt`. It has no cursor.
// What the NARRATOR says, line by line (the layout `NARRATOR`, the look `remotion-narrator`; the user, 2026-11-16: "for all videos add a narrator style voice over variation ... the same
// video just with a narrator behind it instead of reading what's on screen", as Increased Efficiency's Variation 10): the screen shows the same words, the voice talks to the viewer about
// what is shown, in the second person. A sentence stays as long as the narrator talks (the voice sets the pace: lib/remotion/cutCore.mjs `story`). Change a line here, or retype it on the
// Titles panel ('<id>:voice'), then make the voice again (`npm run gen:voice -- --layout narrator`). Written, NOT played.
export const NARRATION = {
  title: "Keeping track of what expires, and when, doesn't have to be done by hand.",
  posted: "Each item is posted as it's received, or as it's made.",
  timers: "And each one gets a timer that measures its age.",
  nears: "As an item gets close to expiring, its timer turns from green to orange.",
  cue: "That orange is the cue: use it soon.",
  expired: "When time is up, orange turns to red.",
  alert: "And an alert tells the team to take the item off the shelf.",
  conclusion: "No clipboards, no manual checks. And a lot less waste.",
};
// `layout`: none, or `NARRATOR` (lib/remotion/cutCore.mjs): the same film with the narrator's voice
function build(words, {layout = null} = {}) {
  const st = story(words, {title: TITLE_WORDS, slide: true, ...voiceOf(EXPIRATIONS_CUT_ID, layout, NARRATION)}), {B, captions, mark} = st;
  const {say, next, last: ends, acted, shown, each, read} = tellers(st, SAYS); // (`ends`: the film's end, after its last sentence and the added titles that follow none)
  const rice = ITEMS.find(it => it.id === 'rice'), last = ITEMS.length - 1;

  // 1 · the Open section comes in as the title goes (its tab, no item yet); the items are posted one after the other, each at the bottom
  B.board = B.titleOut + 0.15;
  const posted = say('posted', B.board + TR * 0.55);
  B.post = Math.max(posted.written, B.board + TR);
  acted(posted, B.post + last * POSTS + POPS + 0.5);
  // 2 · each item has a timer: outlined in turn, from the top
  const timers = say('timers', next(posted));
  each(timers, timers.written, ITEMS.map(it => P.pill(it.id)), 5);
  // 3 · Cooked Rice nears expiration: its timer runs fast to the orange age, turns orange (the pill pops), and the card rises to second place
  const nears = say('nears', next(timers));
  B.run1 = nears.written;
  const v1 = rice.age + (B.run1 - B.board);              // what its timer says when it starts to run
  B.orange = B.run1 + (ORANGE_AT - v1) / RATE;
  B.done1 = B.run1 + (ORANGE_AT + PAST - v1) / RATE;      // (from there it runs a second a second again)
  B.rise1 = B.orange + 0.35;
  acted(nears, B.rise1 + M + 0.25);
  // 4 · the visual cue: the two orange timers, outlined
  const cue = say('cue', next(nears));
  each(cue, cue.written, [P.pill('chicken'), P.pill('rice')], 5);
  // 5 · it expires: its timer runs fast to the red age, turns red (the pill pops), and the card rises to the top
  const expired = say('expired', next(cue));
  B.run2 = expired.written;
  const v2 = ORANGE_AT + PAST + (B.run2 - B.done1);
  B.red = B.run2 + (RED_AT - v2) / RATE;
  B.done2 = B.run2 + (RED_AT + PAST - v2) / RATE;
  B.rise2 = B.red + 0.35;
  acted(expired, B.rise2 + M + 0.25);
  // 6 · the alert: the section goes to the left (a camera move), the alert ticket pops at the right of the red item, an arrow from the item to it, outlined
  const alert = say('alert', next(expired));
  B.aside = alert.at;
  B.pop = Math.max(alert.written, B.aside + M);
  shown(alert, B.pop + M);
  mark(B.pop + M, alert.until, [P.alert], 6);
  // 7 · the closing words, over the section and its alert: read, then the words go, then the picture
  const conclusion = read(say('conclusion', next(alert)));
  B.end = ends(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});

  // ---- what the picture shows at `t` ----
  // Cooked Rice's timer, in seconds: a second a second, but for its two fast runs
  const riceSeconds = t => {
    if (t < B.run1) return rice.age + Math.max(0, t - B.board);
    if (t < B.done1) return v1 + (t - B.run1) * RATE;
    if (t < B.run2) return ORANGE_AT + PAST + (t - B.done1);
    if (t < B.done2) return v2 + (t - B.run2) * RATE;
    return RED_AT + PAST + (t - B.done2);
  };
  // its pill pops once as its color changes, up and down
  const UP = 0.3, GROW = 0.16;
  const ricePop = t => 1 + GROW * (prog(t, B.orange - UP / 2, UP) - prog(t, B.orange + 0.45, UP)) + GROW * (prog(t, B.red - UP / 2, UP) - prog(t, B.red + 0.45, UP));
  const after = (t, at) => clamp((popped(t, at) - 0.4) / 0.6); // (an arrow comes after the card it goes to)
  function stateAt(t) {
    const ran = Math.max(0, t - B.board), aside = step(t, B.aside), gx = mix(OPEN.closed, CHAIN.left, aside), up1 = step(t, B.rise1), up2 = step(t, B.rise2);
    // the place of each item in the section (the longer the timer, the higher): Cooked Rice goes from the last place to the second, then to the first; the ones it passes go down one
    const slot = {chicken: up2, salmon: 1 + up1, mozzarella: 2 + up1, tomatoes: 3 + up1, rice: mix(mix(last, 1, up1), 0, up2)};
    const rising = (up1 > 0 && up1 < 1) || (up2 > 0 && up2 < 1);
    // (Cooked Rice is the last of the list, so it is drawn last: over the cards it passes)
    const chips = ITEMS.map((it, i) => ({it, at: B.post + i * POSTS})).filter(x => t >= x.at).map(({it, at}) => {
      const mine = it.id === 'rice', seconds = mine ? riceSeconds(t) : it.age + ran;
      return {id: it.id, x: gx, y: OPEN.slotY(slot[it.id]), k: OPEN.k, pop: popped(t, at), up: mine && rising, pillPop: mine ? ricePop(t) : 1,
        mission: {kind: 'Task', title: it.title, points: null, who: null, exec: null, date: '09-23-26', time: '08:15 AM', pill: clock(seconds), tone: toneOf(seconds)}};
    });
    // 6 · the alert ticket and the arrow from the red item (the first card) to it
    const on = t >= B.pop;
    const ticket = on ? {id: 'alert', x: ALERT.x, y: ALERT.y, k: ALERT.k, pop: popped(t, B.pop),
      mission: {kind: 'Ticket', title: 'Item Expired', response: `${rice.title} has expired: remove it.`, location: 'Kitchen - Food Safety', date: '09-23-26', time: '04:15 PM', pill: clock(t - B.pop), tone: 'green', who: null, exec: null}} : null;
    const arrows = [{id: 'alerted', from: [gx + OPEN.w + CHAIN.pad, LEVEL], to: [ALERT.x - CHAIN.pad, LEVEL], op: after(t, B.pop)}].filter(a => a.op > 0.001);
    return {
      open: {op: 1, x: gx, y: OPEN.y, k: OPEN.k, count: chips.length, chips},
      cards: {op: on ? 1 : 0, ticket, arrows},
    };
  }

  return {
    words, layout, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand: [], title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, stateAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeExpirationsCut = cutMaker(build);
