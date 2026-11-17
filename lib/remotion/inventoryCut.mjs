// Replenishing Inventory, the Remotion cut (the user, 2026-11-16: "based on all videos like requesting maintenance, precision planing, increased effeciency, the style and everything should
// be done to requesting support till reports & AI ... make it with remotion"; written, NOT played or rendered). It is the look `remotion` of lib/storyboardVariations.mjs on the board
// replenishing-inventory-v2: on the All videos page that board then plays THIS film in Remotion's Player (components/StoryboardRemotionCut.jsx), and the Remotion project
// D:\Documents\Saas\videos renders it to an MP4 (composition RI-Cut). The art is components/remotion/InventoryCut.jsx: the product's own pieces (a board's column tab, the missions' cards,
// the inventory check's panel, the replenishment's panel, the escalation alert's card, the Business Proofs on a tablet, the web report's gallery), set by THIS file as a function of the
// time, so a frame is the same in the Player and in a render.
//
// Told as Requesting Maintenance's is (lib/remotion/maintenanceCut.mjs is the model; what these films share, the style, the sizes, the speeds, the layouts, the tellers:
// lib/remotion/sectionCore.mjs; their pieces: components/remotion/SectionParts.jsx). The words slide, never more than two lines (a label, a sentence of two short lines: `SAYS`, not
// the narration's, which the board's slides still say: lib/sections/replenishing-inventory.mjs); the title is two lines (the narration's has three).
//   1 · posted: NO TABLET: the Stockroom's Open section by itself (its tab, Restock Napkins); the Inventory Check is posted by itself (no cursor): it pops in at the bottom of Open, outlined
//   2 · data: the cursor opens the check: its panel expands in the middle; the cursor presses each count, which comes (Item-A 15, Item-B 22, Item-C 5), the panel's window going down to
//       them; Item-C is below par: flagged, and it is the TRIGGER (in the ticket's pink), outlined
//   3 · order: the check STAYS OPEN and glides to the left; the mission it raises, Replenish Item-C, pops at its right, an arrow from the check to it, outlined (`CHAIN`)
//   4 · delays: the check still open at its left, the Replenish card turns orange, then red (its timer goes up fast, its pill pops at each color); then the camera pans to the right
//       (`PAN`): the check goes off to the left, fading, the card takes the left place and the escalation alert pops at its right, outlined
//   5 · evidence: the escalation alert goes, the card comes to the middle; the cursor opens it: its panel expands (its timer goes on, red), the cursor presses the count (30 comes), then
//       Add photo: the photo of the shelf comes, the window going down to it
//   6 · tablet: "from a mobile device": the device is the point, so this ONE scene has the flat black tablet, Business Proofs over its board, scrolled by the clock
//   7 · web: the web report, edge to edge: the cursor ticks Gallery View, every proof opens as a picture, the page scrolls
//   8 · the closing words, read over the gallery.
// ONE thread: Item-C, from the count below par to the photo of the full shelf. Pure: no React, no Remotion.
import {CUT_FPS, CUT_H, CUT_W, M, clock, cursorPlan, cutMaker, mix, prog, story, voiceOf} from './cutCore.mjs';
import {CARD, MID, PANEL, TR, XF, agingOf, chainLayout, panelLeft, panelRight, popped, sectionLayout, step, tellers, tg} from './sectionCore.mjs';
import {BOARD, RANGE, TABLET} from './auditingCut.mjs';

export {CUT_FPS, CUT_H, CUT_W, PANEL, BOARD, RANGE, TABLET};
export const INVENTORY_CUT_ID = 'RI-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['RI-Cut'])
export const TITLE_WORDS = {lines: ['Inventory Audits Automatically', 'Trigger Replenishment'], mark: null};

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['RI-Cut'], lib/remotion/cutWords.mjs). The label two or three words, the sentence two short lines, never more ----
const SAYS = {
  posted: ['Scheduled audits', ['Inventory Audits Are', 'Automatically Posted']],
  data: ['Collected data', ['Data Is Collected', 'On Available Items']],
  order: ['Automatic orders', ['Counts Below Par', 'Trigger Orders']],
  delays: ['Escalation', ['Ordering Delays Trigger', 'Escalation Alerts']],
  evidence: ['Visual evidence', ['Photos Prove', 'The Replenishment']],
  tablet: ['On any device', ['Inspect Visually From', 'A Mobile Device']],
  web: ['Or the web', ['Or Inspect', 'From The Web']],
  conclusion: ['Stocked displays', ['Timely Replenishment', 'Prevents Losses']],
};
const SEEN = 1.1;                 // how long the count below par is outlined once it is in
const TOUR = 2.4, WEB_TOUR = 1.6; // the proofs scrolled on the tablet, the gallery scrolled on the web

// ---- the art's own words (the section's: components/sections/InventoryStage.jsx) ----
export const NAPKINS = {id: 'napkins', kind: 'Task', title: 'Restock Napkins', age: 920};                // the Stockroom's open mission: it has waited this long
export const CHECK = {id: 'check', kind: 'Checklist', points: 25, title: 'Inventory Check', time: '07:00 AM'};
export const REPLENISH = {id: 'replenish', kind: 'Task', points: 10, title: 'Replenish Item-C', time: '07:06 AM'};
const ESCALATION = {kind: 'Ticket', title: 'Escalation Alert', response: 'Item-C has not been ordered in time.', location: 'Stockroom - Purchasing', date: '09-23-26', time: '08:06 AM'};

// ---- where things stand (stage px; lib/remotion/sectionCore.mjs) ----
// 1 · the Open section of the Stockroom's board, with no tablet: its tab, Restock Napkins, room for the check under it
export const OPEN = sectionLayout({slots: 2});
// 3, 4 · the chain: the check's panel, an arrow, the Replenish mission's card; after the pan the card, an arrow, the escalation alert (a ticket: taller, its middle level with the card's)
export const CHAIN = chainLayout({right: 'mission'});
export const PAN = CHAIN.pan; // the camera's pan to the right: everything goes this far to the left
const ALERT_Y = MID.y - (CARD.ticket * CHAIN.k) / 2, ALONE_X = MID.x - CHAIN.w / 2; // (5 · the card by itself, in the middle: its panel opens out of it there)

// ---- what the cursor presses and what is outlined ----
const P = {
  check: tg('open', 'check'),
  fieldA: tg('check', 'field-item-A'), fieldB: tg('check', 'field-item-B'), fieldC: tg('check', 'field-item-C'), itemC: tg('check', 'cp-item-C'), window: '[data-rc-layer="check"] .iq2-m-window',
  replenish: tg('cards', 'replenish'), escalation: tg('cards', 'escalation'),
  count: tg('replenish', 'field-count'), addPhoto: tg('replenish', 'add-photo-shelf'),
  gallery: tg('web', 'gallery-view'),
};

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (every piece of the picture, where it is and what it shows), `marksAt`, `cursorAt`, `artAt`.
// What the NARRATOR says, line by line (the layout `NARRATOR`, the look `remotion-narrator`; the user, 2026-11-16: "for all videos add a narrator style voice over variation ... the same
// video just with a narrator behind it instead of reading what's on screen", as Increased Efficiency's Variation 10): the screen shows the same words, the voice talks to the viewer about
// what is shown, in the second person. A sentence stays as long as the narrator talks (the voice sets the pace: lib/remotion/cutCore.mjs `story`). Change a line here, or retype it on the
// Titles panel ('<id>:voice'), then make the voice again (`npm run gen:voice -- --layout narrator`). Written, NOT played.
export const NARRATION = {
  title: "Running out of stock is expensive. So let the system watch it for you.",
  posted: "Inventory audits are posted on their own, right on schedule.",
  data: "Someone counts what's on the shelf, and enters the numbers.",
  order: "If a count is below par, an order is triggered automatically.",
  delays: "And if that order is slow to go out, an escalation alert follows.",
  evidence: "When the shelf is restocked, photos prove it.",
  tablet: "You can check those photos from any mobile device.",
  web: "Or from the web, wherever you happen to be.",
  conclusion: "Shelves stay full, and you stop losing sales to empty ones.",
};
// `layout`: none, or `NARRATOR` (lib/remotion/cutCore.mjs): the same film with the narrator's voice
function build(words, {layout = null} = {}) {
  const st = story(words, {title: TITLE_WORDS, slide: true, ...voiceOf(INVENTORY_CUT_ID, layout, NARRATION)}), {B, captions, mark} = st;
  const {hand, click, leave, finish: handDone} = cursorPlan();
  const {say, next, last, acted, shown, read} = tellers(st, SAYS);

  // 1 · the Open section comes in as the title goes; the Inventory Check is posted by itself: it pops in at the bottom of Open, outlined
  B.board = B.titleOut + 0.15;
  const posted = say('posted', B.board + TR * 0.55);
  B.posted = Math.max(posted.written, B.board + TR);
  shown(posted, B.posted + M);
  mark(B.posted + M, posted.until, [P.check], 6);
  // 2 · the cursor opens the check: it expands; the cursor presses each count, which comes; the window goes down to the next one; Item-C is below par: the trigger, outlined
  const data = say('data', next(posted));
  B.openCheck = click(data.written, P.check);
  leave();
  B.countA = click(B.openCheck + M + 0.4, P.fieldA);
  B.countB = click(B.countA + 0.35, P.fieldB);
  B.countC = click(B.countB + 0.35, P.fieldC);
  leave();
  B.below = B.countC + 0.4;
  mark(B.below, B.below + SEEN, [P.itemC], 5, P.window);
  acted(data, B.below + SEEN);
  // 3 · the count below par raises an order: the check stays open as it is and goes to the left; Replenish Item-C pops at its right, an arrow from the check to it, outlined
  const order = say('order', next(data));
  B.aside = order.at;
  B.pop = Math.max(order.written, B.aside + M);
  shown(order, B.pop + M);
  mark(B.pop + M, order.until, [P.replenish], 6);
  // 4 · nobody orders: the check still open at its left, the card turns orange, then red (its timer goes up fast, its pill pops at each color); then the camera pans to the right, the check
  // goes off to the left, fading, and the escalation alert pops at the right of the card, outlined
  const delays = say('delays', next(order));
  B.tick = delays.written;
  const age = agingOf({pop: B.pop, tick: B.tick});
  B.orange = age.orange;
  B.red = age.red;
  B.aged = age.done; // (from there it runs a second a second again)
  B.pan = B.red + 1;
  B.esc = B.pan + M * 0.55;
  shown(delays, B.esc + M);
  mark(B.esc + M, delays.until, [P.escalation], 6);
  // 5 · the replenishment and its proof: the escalation alert goes, the card comes to the middle; the cursor opens it (its panel expands), presses the count (30), then Add photo (the photo
  // of the shelf comes, the window going down to it)
  const evidence = say('evidence', next(delays));
  B.alone = evidence.at;
  B.openRep = click(Math.max(evidence.written, B.alone + M), P.replenish);
  leave();
  B.count = click(B.openRep + M + 0.4, P.count);
  B.photo = click(B.count + 0.6, P.addPhoto);
  leave();
  acted(evidence, B.photo + M + 1);
  // 6 · from a mobile device: the tablet, Business Proofs over its board, scrolled through
  const tablet = say('tablet', next(evidence));
  B.tabletView = tablet.at;
  B.tour = tablet.written;
  acted(tablet, B.tour + TOUR + 0.2);
  // 7 · or from the web: the web report edge to edge; the cursor ticks Gallery View, every proof opens as a picture, the page scrolls
  const web = say('web', next(tablet));
  B.webView = web.at;
  B.gallery = click(Math.max(web.written, B.webView + XF), P.gallery);
  leave();
  B.rows = B.gallery + 0.25;
  B.webTour = B.rows + M + 0.3;
  acted(web, B.webTour + WEB_TOUR);
  // 8 · the closing words, over the gallery: read, then the words go, then the picture
  const conclusion = read(say('conclusion', next(web)));
  B.end = last(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  const after = (t, at) => Math.min(1, Math.max(0, (popped(t, at) - 0.4) / 0.6)); // (an arrow comes after the card it goes to)
  const chip = (m, i, pill, pop = 1) => ({id: m.id, x: OPEN.closed, y: OPEN.slotY(i), k: OPEN.k, pop,
    mission: {kind: m.kind, title: m.title, points: m.points ?? null, date: '09-23-26', time: m.time ?? '06:45 AM', tone: 'green', who: null, exec: null, pill}});
  function stateAt(t) {
    const ran = Math.max(0, t - B.board), isPosted = t >= B.posted;
    // 1 · the Open section: Restock Napkins (its timer runs), then the Inventory Check under it (the new one comes at the bottom; its timer starts at 00:00:00)
    const open = {op: 1 - prog(t, B.openCheck, XF), x: OPEN.closed, y: OPEN.y, k: OPEN.k, count: 1 + (isPosted ? 1 : 0),
      chips: [chip(NAPKINS, 0, clock(NAPKINS.age + ran)), ...(isPosted ? [chip(CHECK, 1, clock(t - B.posted), popped(t, B.posted))] : [])]};
    // 2 to 4 · the check's panel: in the middle, then at the left of the mission it raises (still open, as it was), then off to the left, fading, as the camera pans to the right. Its counts
    // come one after the other; its window goes down to Item-B, then to Item-C
    const aside = step(t, B.aside), pan = step(t, B.pan), left = mix(PANEL.left, panelLeft(CHAIN.left), aside) - PAN * pan, toC = prog(t, B.countB + 0.15, M);
    const check = {op: prog(t, B.openCheck, XF) * (1 - pan), left, top: PANEL.top, scale: PANEL.scale, expand: step(t, B.openCheck), timer: clock(t - B.posted),
      counts: t >= B.countC ? 3 : t >= B.countB ? 2 : t >= B.countA ? 1 : 0,
      scrollMix: toC > 0 ? {from: 'cp-item-B', to: 'cp-item-C', p: toC} : {from: 'top', to: 'cp-item-B', p: prog(t, B.countA + 0.15, M)}};
    // 3 to 5 · the Replenish mission's card: at the right of the check, then at the left of the escalation alert, then by itself in the middle, where its panel opens out of it
    const seconds = age.seconds(t), alone = step(t, B.alone), rx = mix(CHAIN.right - PAN * pan, ALONE_X, alone), tone = age.tone(seconds);
    const replenish = {id: REPLENISH.id, x: rx, y: CHAIN.y, k: CHAIN.k, pop: popped(t, B.pop), pillPop: age.pillPop(t), moving: alone > 0 && alone < 1,
      mission: {kind: REPLENISH.kind, points: REPLENISH.points, title: REPLENISH.title, date: '09-23-26', time: REPLENISH.time, pill: clock(seconds), tone, who: null, exec: null}};
    const gone = 1 - prog(t, B.alone, XF); // (the escalation alert and its arrow go as the card comes to the middle)
    const escalation = t >= B.esc && gone > 0.001 ? {id: 'escalation', x: CHAIN.second, y: ALERT_Y, k: CHAIN.k, pop: popped(t, B.esc), op: gone,
      mission: {...ESCALATION, pill: clock(t - B.esc), tone: 'green', who: null, exec: null}} : null;
    const arrows = [
      {id: 'raised', from: [panelRight(left) + CHAIN.pad, MID.y], to: [rx - CHAIN.pad, MID.y], op: after(t, B.pop) * (1 - pan)},
      {id: 'escalated', from: [rx + CHAIN.w + CHAIN.pad, MID.y], to: [CHAIN.second - CHAIN.pad, MID.y], op: after(t, B.esc) * gone},
    ].filter(a => a.op > 0.001);
    // 5 · the replenishment's panel comes in over the card (which goes as it comes): the count, then the photo of the shelf, the window going down to it; it goes as the tablet comes
    const panel = prog(t, B.openRep, XF);
    const replenishment = {op: panel * (1 - prog(t, B.tabletView, XF)), expand: step(t, B.openRep), count: t >= B.count ? 30 : null, photo: t >= B.photo ? 'done' : 'none',
      scrollMix: {from: 'top', to: 'cp-shelf', p: prog(t, B.count + 0.15, M)}, timer: clock(seconds), tone};
    return {
      open, check,
      cards: {op: t >= B.pop ? 1 - panel : 0, replenish, escalation, arrows},
      replenish: replenishment,
      // 6 · the tablet: how far the proofs are scrolled; the seconds its board has run
      tablet: {op: prog(t, B.tabletView, XF) * (1 - prog(t, B.webView, XF)), scroll: prog(t, B.tour, TOUR), elapsed: Math.floor(ran)},
      // 7, 8 · the web report: Gallery View ticked, how far the pictures' rows are open, how far the page is scrolled
      web: {op: prog(t, B.webView, XF), gallery: t >= B.gallery, rows: prog(t, B.rows, M), scroll: prog(t, B.webTour, WEB_TOUR)},
    };
  }

  return {
    words, layout, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeInventoryCut = cutMaker(build);
