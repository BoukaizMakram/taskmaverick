// Requesting Support, the Remotion cut (the user, 2026-11-16: "based on all videos like requesting maintenance, precision planing, increased effeciency, the style and everything should be
// done to requesting support till reports & AI ... make it with remotion"; written, NOT played or rendered). It is the look `remotion` of lib/storyboardVariations.mjs on the board
// requesting-support-v2: on the All videos page that board then plays THIS film in Remotion's Player (components/StoryboardRemotionCut.jsx), and the Remotion project
// D:\Documents\Saas\videos renders it to an MP4 (composition RS-Cut). The art is components/remotion/SupportCut.jsx: the product's own pieces, set by THIS file as a function of the time.
//
// TOLD AS REQUESTING MAINTENANCE'S IS (lib/remotion/maintenanceCut.mjs is the model; what the films of sections, cards and panels share, the style included, is
// lib/remotion/sectionCore.mjs, and their pieces components/remotion/SectionParts.jsx): NO TABLET, ONE request for the whole story, the request kept open while what it raises pops at its
// right, a camera pan, one avatar that takes and closes it. The words slide, a label and a sentence of two short lines (`SAYS`: not the narration's, which the board's slides still say,
// lib/sections/requesting-support.mjs); only what the real software has is drawn.
//   1 template   · the Front Desk's Open section alone (its tab, its missions), the plus beside it; the cursor presses the plus, the On-Demand list opens out of it, the cursor picks Clean
//                  Room, the list closes and the request is added at the bottom of Open (`OPEN`)
//   2 describe   · the cursor opens the request: its panel expands in the middle, the request is typed, Yes to record it, a video is added
//   3 posted     · the request STAYS OPEN and glides to the left; at its right the same request pops as the card posted to the team that answers it, that team's name over it, an arrow
//                  from the request to it, outlined (`CHAIN`)
//   4 delays     · the request still open at the left while the posted card turns orange, then red; then the camera pans to the right (`PAN`): the request goes off to the left, fading,
//                  the card takes the left place and the escalation alert pops at its right, outlined
//   5 responder  · the escalation alert goes; the SAME card (its timer goes on, red) glides under Open, Housekeeping's three sections being only their tabs (`SECT`); the responder's avatar
//                  pops at the left of Open, goes straight to the card's edge at the middle of its height, takes it to Claimed and sits at the name's place
//   6 tracked    · the avatar closes it the same way, in Closed (gray, its timers stopped); its execution time and who did it, outlined
//   7 qr         · outsiders: the request's QR card by itself, its code outlined
//   8 placed     · the sign and the package that carry it (two photographs), each outlined in turn
//   9 scan       · a phone: its camera on the code (outlined), then the form opens
//   10 dashboards · the web Overview, edge to edge over the band, going down its list
//   11 conclusion · the closing words, read over the dashboard
// ONE thread: the Clean Room request. Pure: no React, no Remotion (so the names and the words of the art are HERE, `DATA`: they are the section's, components/sections/SupportStage.jsx).
import {CUT_FPS, CUT_H, CUT_W, M, clock, cursorPlan, cutMaker, mix, prog, story, voiceOf} from './cutCore.mjs';
import {CARD, MID, PANEL, SIT, TR, XF, agingOf, boardLayout, chainLayout, panelLeft, panelRight, popped, rideAt, sectionLayout, step, tellers, tg} from './sectionCore.mjs';

export {CUT_FPS, CUT_H, CUT_W, PANEL};
export const SUPPORT_CUT_ID = 'RS-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['RS-Cut'])
export const TITLE_WORDS = {lines: ['Requesting Any Type Of Support', 'Is As Easy As Pressing A Button'], mark: null};
// The section's own names (components/sections/SupportStage.jsx): the team that asks and its open missions (how long each has waited: the longer the higher), its On-Demand list, the
// request, the team that answers and who responds
export const DATA = {
  team: 'Front Desk', answers: 'Housekeeping', request: 'Clean Room', responder: 'Carla M',
  problem: 'Room 12 needs to be cleaned before the next guests arrive.',
  open: [{id: 'check-in', title: 'Greet Guests', type: 'Task', age: 840}, {id: 'keys', title: 'Count Room Keys', type: 'Checklist', age: 640}],
  demand: [['Task', '10-Min Break AM'], ['Survey', 'All Cheese Crepe Waste'], ['Task', 'Clean Room', 'clean-room'], ['Checklist', 'Business Card Inventory'], ['Checklist', 'Chef Coat Inventory']],
};

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['RS-Cut'], lib/remotion/cutWords.mjs). The label two or three words, the sentence two short lines, never more ----
const SAYS = {
  template: ['Pick a template', ['A Request Is Made', 'By Selecting A Template']],
  describe: ['Text, photo, video', ['A Request Can Carry', 'Text, Photo Or Video']],
  posted: ['The right team', ['The Request Is Posted', 'To The Appropriate Team']],
  delays: ['Escalation', ['Response Delays Trigger', 'Escalation Alerts']],
  responder: ['Who responds', ['The Person Responding', 'Can Be Identified']],
  tracked: ['Response time', ['Response Time Is Tracked', 'Until It Is Fulfilled']],
  qr: ['Outside requests', ['Outsiders Make Requests', 'Via QR Code']],
  placed: ['Signs and packages', ['QR Codes Go On', 'Signs Or Packages']],
  scan: ['Scan to request', ['Scanning The Code', 'Opens A Request Form']],
  dashboards: ['Live dashboards', ['Requests And Resolutions', 'Are Tracked Live']],
  conclusion: ['Seamless requests', ['Requests Are Made And', 'Traced For Assurance']],
};
const TYPE = 1.5;   // the request typed in its panel
const AIM = 0.7;    // the phone's camera on the code before the form opens
const FORM = 0.5;   // the form coming in over the camera
const SCROLL = 1.6; // the dashboard going down its list (Live Oversight's)

// ---- where things stand (stage px; lib/remotion/sectionCore.mjs) ----
// 1 · the Front Desk's Open section, with no tablet: its tab, its two missions (room for the request, the third), the plus and the On-Demand list
export const OPEN = sectionLayout({slots: 3, plus: true});
// 3, 4 · the chain: the request's panel, an arrow, the card posted to the team that answers (a mission's card); after the pan that card, an arrow, the escalation alert (a ticket: taller, its
// middle level with the card's)
export const CHAIN = chainLayout({right: 'mission'});
export const PAN = CHAIN.pan;
const ESC_Y = MID.y - (CARD.ticket * CHAIN.k) / 2, LABEL_UP = 30; // (the team's name stands this far over its card)
// 5, 6 · Housekeeping's three sections with no tablet: only their tabs, and the one card under the one it is in; the responder's avatar pops at the left of Open
export const SECT = boardLayout({card: 'mission'});
export const SEAT = SECT.seat;
// 7 to 9 · the QR card (940 x 660), the sign and the package (they stand in a box of 960 x 600: the two pictures take x 40 to 940, y 10 to 530 of it) and the phone (401 x 838), each
// in the middle of the room
const QR_K = 0.9, PLACED_K = 1.1, PHONE_W = 330;
export const QR = {left: MID.x - (940 * QR_K) / 2, top: MID.y - (660 * QR_K) / 2, scale: QR_K};
export const PLACED = {left: MID.x - 490 * PLACED_K, top: MID.y - 270 * PLACED_K, scale: PLACED_K};
export const PHONE = {left: MID.x - PHONE_W / 2, top: Math.round(MID.y - (PHONE_W * 838 / 401) / 2), width: PHONE_W};
// 10 · the web page, edge to edge, from the picture's top to the band of the words (its straight edge, y 744)
export const BOARD = {w: CUT_W, h: 744};

// ---- what the cursor presses and what is outlined ----
const P = {
  add: tg('open', 'add'), demand: tg('open', 'demand-clean-room'), req: tg('open', 'req'),
  describe: tg('request', 'field-describe'), yes: tg('request', 'yes-record'), video: tg('request', 'add-video-record'),
  post: tg('cards', 'post'), escalation: tg('cards', 'escalation'),
  exec: tg('cards', 'post-exec'), who: '.rc-sp-face', // (who did it: the responder's avatar, sitting on the card where its performer is)
  qr: tg('qr', 'qr'), sign: tg('placed', 'sign'), package: tg('placed', 'package'), camera: tg('phone', 'camera'),
};

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (every piece of the picture, where it is and what it shows), `marksAt`, `cursorAt`, `artAt`.
// What the NARRATOR says, line by line (the layout `NARRATOR`, the look `remotion-narrator`; the user, 2026-11-16: "for all videos add a narrator style voice over variation ... the same
// video just with a narrator behind it instead of reading what's on screen", as Increased Efficiency's Variation 10): the screen shows the same words, the voice talks to the viewer about
// what is shown, in the second person. A sentence stays as long as the narrator talks (the voice sets the pace: lib/remotion/cutCore.mjs `story`). Change a line here, or retype it on the
// Titles panel ('<id>:voice'), then make the voice again (`npm run gen:voice -- --layout narrator`). Written, NOT played.
export const NARRATION = {
  title: "Need a hand? Asking for support is as easy as pressing a button.",
  template: "You start by choosing a template.",
  describe: "Then you add what's needed: a note, a photo, or a video.",
  posted: "Your request goes straight to the team that can help.",
  delays: "If it sits too long, an escalation alert makes sure it's seen.",
  responder: "You can see who is taking care of it.",
  tracked: "And the response time is tracked until the request is fulfilled.",
  qr: "People outside your team can ask for help too, with a QR code.",
  placed: "Put the code on a sign, or on a package.",
  scan: "They scan it, and a request form opens on their phone.",
  dashboards: "Meanwhile, every request and every resolution is tracked, live.",
  conclusion: "So nothing gets lost. Every request is made, followed, and accounted for.",
};
// `layout`: none, or `NARRATOR` (lib/remotion/cutCore.mjs): the same film with the narrator's voice
function build(words, {layout = null} = {}) {
  const st = story(words, {title: TITLE_WORDS, slide: true, ...voiceOf(SUPPORT_CUT_ID, layout, NARRATION)}), {B, captions, mark} = st;
  const {hand, click, leave, finish: handDone} = cursorPlan();
  const {say, next, last, acted, shown, each, read} = tellers(st, SAYS);

  // 1 · the Open section comes in as the title goes; the cursor presses the plus, the On-Demand list opens out of it, the cursor picks Clean Room: the request is added to Open
  B.board = B.titleOut + 0.15;
  const template = say('template', B.board + TR * 0.55);
  B.add = click(Math.max(template.written, B.board + TR), P.add);
  B.pick = click(B.add + M + 0.4, P.demand);
  leave();
  B.posted = B.pick + 0.3; // (the list is going: the request pops in at the bottom of Open, as a mission that is posted does)
  acted(template, B.posted + M + 0.2);
  // 2 · the cursor opens the request: it expands, the request is typed, Yes to record it, a video is added
  const describe = say('describe', next(template));
  B.openReq = click(describe.written, P.req);
  leave();
  B.describe = click(B.openReq + M + 0.4, P.describe);
  B.typed = B.describe + 0.2;
  B.yes = click(B.typed + TYPE + 0.3, P.yes);
  B.addVideo = click(B.yes + 0.9, P.video);
  leave();
  acted(describe, B.addVideo + 0.9);
  // 3 · the request is posted to the team that answers: it stays open as it is and goes to the left; the card pops at its right under that team's name, an arrow from the request, outlined
  const posted = say('posted', next(describe));
  B.aside = posted.at;
  B.pop = Math.max(posted.written, B.aside + M);
  shown(posted, B.pop + M);
  mark(B.pop + M, posted.until, [P.post], 6);
  // 4 · nobody answers: the request still open at its left, the card turns orange, then red (its timer goes up fast, its pill pops at each color); then the camera pans to the right, the
  // request goes off to the left, fading, and the escalation alert pops at the right of the card, outlined
  const delays = say('delays', next(posted));
  B.tick = delays.written;
  const age = agingOf({pop: B.pop, tick: B.tick});
  B.orange = age.orange;
  B.red = age.red;
  B.aged = age.done; // (from there it runs a second a second again)
  B.pan = B.red + 1;
  B.esc = B.pan + M * 0.55;
  shown(delays, B.esc + M);
  mark(B.esc + M, delays.until, [P.escalation], 6);
  // 5 · who responds: the escalation alert goes, the card glides under Open (Housekeeping's three sections are only their tabs); the responder's avatar pops at the left of Open, goes straight
  // to the card's edge at the middle of its height, the card goes with it to Claimed, and the avatar goes to the name's place on the card and sits there (the same avatar to the end)
  const responder = say('responder', next(delays));
  B.sections = responder.at;
  B.faceIn = Math.max(responder.written, B.sections + M);
  B.faceGo = B.faceIn + 0.55;
  B.claim = B.faceGo + M + 0.3;
  B.settle = B.claim + M + 0.1;
  B.settled = B.settle + SIT;
  acted(responder, B.settled + 0.2);
  // 6 · the response time: the avatar closes the card the way it took it (out of the name's place to the card's edge, with the card to Closed, back to the name's place); then its execution
  // time and who did it, outlined
  const tracked = say('tracked', next(responder));
  B.out = tracked.written;
  B.close = B.out + SIT + 0.1;
  B.rest = B.close + M + 0.1;
  B.rested = B.rest + SIT;
  each(tracked, B.rested + 0.15, [P.exec, P.who], 5);
  // 7 · outsiders: the board goes, the request's QR card comes in by itself; its code outlined
  const qr = say('qr', next(tracked));
  B.qr = qr.at;
  B.code = Math.max(qr.written, B.qr + XF);
  shown(qr, B.code);
  mark(B.code, qr.until, [P.qr], 8);
  // 8 · the sign and the package that carry the code, each outlined in turn
  const placed = say('placed', next(qr));
  B.placed = placed.at;
  each(placed, Math.max(placed.written, B.placed + XF), [P.sign, P.package], 4);
  // 9 · a phone scans it: its camera on the code (outlined), then the form opens over the camera
  const scan = say('scan', next(placed));
  B.phone = scan.at;
  B.aim = Math.max(scan.written, B.phone + XF);
  B.form = B.aim + AIM;
  mark(B.aim, B.form + 0.1, [P.camera], 8);
  shown(scan, B.form + FORM);
  // 10 · every request and resolution is tracked live: the web Overview comes in over the phone, edge to edge, and goes down its list
  const dashboards = say('dashboards', next(scan));
  B.web = dashboards.at;
  B.scroll = Math.max(dashboards.written, B.web + XF);
  acted(dashboards, B.scroll + SCROLL + 0.5);
  // 11 · the closing words, over the dashboard: read, then the words go, then the picture
  const conclusion = read(say('conclusion', next(dashboards)));
  B.end = last(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  const after = (t, at) => Math.min(1, Math.max(0, (popped(t, at) - 0.4) / 0.6)); // (an arrow, or a card's label, comes after the card it goes to)
  function stateAt(t) {
    const typed = t < B.typed ? '' : DATA.problem.slice(0, Math.round(DATA.problem.length * Math.min(1, (t - B.typed) / TYPE)));
    // 1 · the Open section: how far the On-Demand list is open (it opens at the plus and goes as the request is picked), where the group is, its missions and their running timers
    const menu = prog(t, B.add, M) * (1 - prog(t, B.pick + 0.1, 0.3)), gx = mix(OPEN.closed, OPEN.opened, menu), ran = Math.max(0, t - B.board), isPosted = t >= B.posted;
    const openChip = (id, i, m, pop = 1) => ({id, x: gx, y: OPEN.slotY(i), k: OPEN.k, pop, mission: {date: '09-23-26', time: '01:50 PM', tone: 'green', who: null, exec: null, points: null, ...m}});
    const open = {
      op: 1 - prog(t, B.openReq, XF), x: gx, y: OPEN.y, k: OPEN.k, count: DATA.open.length + (isPosted ? 1 : 0),
      chips: [...DATA.open.map((m, i) => openChip(m.id, i, {kind: m.type, title: m.title, pill: clock(m.age + ran)})),
        ...(isPosted ? [openChip('req', DATA.open.length, {kind: 'Task', title: DATA.request, pill: clock(t - B.posted), time: '02:10 PM'}, popped(t, B.posted))] : [])],
      plus: OPEN.plusAt(gx), menu: {p: menu, ...OPEN.menuAt(gx), picked: t >= B.pick ? 'clean-room' : null},
    };
    // 2 to 4 · the request's panel: in the middle, then at the left of the card it is posted as (still open, as it was), then off to the left, fading, as the camera pans to the right
    const aside = step(t, B.aside), pan = step(t, B.pan), left = mix(PANEL.left, panelLeft(CHAIN.left), aside) - PAN * pan;
    const request = {op: prog(t, B.openReq, XF) * (1 - pan), left, top: PANEL.top, scale: PANEL.scale, expand: step(t, B.openReq), typed, doc: t >= B.addVideo ? 'done' : t >= B.yes ? 'ask' : 'none',
      timer: clock(Math.max(0, t - B.posted))};
    // 3 to 6 · the one card, posted to the team that answers: at the right of the request, then at the left of the escalation alert, then under Open, Claimed, Closed
    const seconds = age.seconds(t, B.close), sect = step(t, B.sections), claim = step(t, B.claim), close = step(t, B.close), closed = t >= B.close, claimed = t >= B.claim;
    const k = mix(CHAIN.k, SECT.k, sect), x = mix(CHAIN.right - PAN * pan, SECT.x0, sect) + SECT.pitch * (claim + close), y = mix(CHAIN.y, SECT.cardY, sect);
    const post = {id: 'post', x, y, k, pop: popped(t, B.pop), pillPop: age.pillPop(t), moving: (claim > 0 && claim < 1) || (close > 0 && close < 1),
      mission: {kind: 'Task', title: DATA.request, points: null, date: '09-23-26', time: '02:12 PM', pill: clock(seconds), tone: closed ? 'gray' : age.tone(seconds),
        exec: claimed ? clock(Math.min(t, B.close) - B.claim) : null, who: claimed ? DATA.responder : null, claimed}};
    const gone = 1 - prog(t, B.sections, XF); // (the escalation alert, its arrow and the team's name go as the card goes under Open)
    const escalation = t >= B.esc && gone > 0.001 ? {id: 'escalation', x: CHAIN.second, y: ESC_Y, k: CHAIN.k, pop: popped(t, B.esc), op: gone,
      mission: {kind: 'Ticket', title: 'Escalation Alert', response: 'The request has not been answered in time.', location: `${DATA.answers} - Support`, date: '09-23-26', time: '03:12 PM', pill: clock(t - B.esc), tone: 'green', who: null, exec: null}} : null;
    const arrows = [
      {id: 'posted', from: [panelRight(left) + CHAIN.pad, MID.y], to: [x - CHAIN.pad, MID.y], op: after(t, B.pop) * (1 - pan)},
      {id: 'escalated', from: [x + CHAIN.w + CHAIN.pad, MID.y], to: [CHAIN.second - CHAIN.pad, MID.y], op: after(t, B.esc) * gone},
    ].filter(a => a.op > 0.001);
    // 7 to 10 · what comes after the board, each in over the one before
    const toQr = prog(t, B.qr, XF), toPlaced = prog(t, B.placed, XF), toPhone = prog(t, B.phone, XF), toWeb = prog(t, B.web, XF);
    const count = {open: claimed ? 0 : 1, claimed: claimed && !closed ? 1 : 0, closed: closed ? 1 : 0};
    return {
      open, request,
      cards: {op: t >= B.pop ? 1 - toQr : 0, post, escalation, arrows, label: {text: DATA.answers, x, y: y - LABEL_UP, op: after(t, B.pop) * gone}},
      tabs: {op: prog(t, B.sections, XF) * (1 - toQr), y: SECT.tabY, k: SECT.k, list: ['open', 'claimed', 'closed'].map((status, i) => ({status, x: SECT.colX(i), n: count[status]}))},
      // the responder's avatar, the same one to the end (sectionCore `rideAt`); it goes with the board
      face: rideAt(t, {in: B.faceIn, go: B.faceGo, settle: B.settle, out: B.out, rest: B.rest}), rider: 1 - toQr,
      qr: {op: toQr * (1 - toPlaced)},
      placed: {op: toPlaced * (1 - toPhone)},
      phone: {op: toPhone * (1 - toWeb), scan: t < B.form ? 0 : Math.min(1, prog(t, B.form, FORM))},
      // the Overview's frame (components/OverviewScene.jsx): Running, how far down its list it is, its timers running, nothing open
      web: {op: toWeb, overview: {view: 'Running', historyDip: 0, scroll: prog(t, B.scroll, SCROLL), time: Math.floor(Math.max(0, t - B.web)), drawer: 0,
        viewer: {kind: 'photo', in: 0, live: 0, index: 0}, menu: null, filter: null, group: 'Unit', groupMenu: false}},
    };
  }

  return {
    words, layout, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeSupportCut = cutMaker(build);
