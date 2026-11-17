// Requesting Maintenance, the Remotion cut (the user, 2026-11-12, after Dynamic Auditing's and Precision Planning's: "do next request maintenance"; written, NOT played or rendered). It is the look
// `remotion` of lib/storyboardVariations.mjs on the board requesting-maintenance-v2: on the All videos page that board then plays THIS film in Remotion's Player
// (components/StoryboardRemotionCut.jsx), and the Remotion project D:\Documents\Saas\videos renders it to an MP4 (composition RM-Cut). The art is components/remotion/MaintenanceCut.jsx: the
// product's own pieces (a board's column tab, the missions' cards, the On-Demand list, a request's panel, the alert ticket's card, a ticket's panel), set by THIS file as a function of the
// time, so a frame is the same in the Player and in a render.
//
// IT IS THE MODEL of the films made of sections, cards and panels: what they share (the style, the sizes, the speeds, the layouts, the tellers) is lib/remotion/sectionCore.mjs, and their
// pieces components/remotion/SectionParts.jsx. The words slide, never more than two lines (a label, a sentence of two short lines: `SAYS`, not the narration's, which the board's slides
// still say); only what the real software has is drawn (the user, 2026-11-12: "this UI doesn't exist in real software").
//
// THE USER'S NOTES ON ITS STORYBOARD (2026-11-16, the row "Requesting Maintenance · Variation 2" of the board All storyboards; written, NOT played or rendered): NO TABLET anywhere, and ONE
// ticket for the whole story.
//   1 · "show only the open section without the tablet", "... with the on demand + icon and menu opening up from it", "show mission adding to open without tablet": the Open section of the
//       team board alone (its tab and its missions), the plus beside it; the cursor presses the plus, the On-Demand list opens out of it, the cursor picks Maintenance Request, the list closes
//       and the request is added at the bottom of Open (`OPEN`)
//   2 · the cursor opens the request: it expands, the issue is typed, Yes to document it (the trigger: at the right, in the ticket's border color), a video is added
//   3 · "show what caused the ticket to show up without closing mission keep it open as it was": the request stays OPEN as it is (its panel, with what was typed and the video); it glides to
//       the left and the alert ticket pops at its right, an arrow from the request to it, outlined (`CHAIN`)
//   4 · "here keep mission open until 16", then "pan to the right to show the escalation alert to the right, and fade the mission on left while it's going left (it's like we are moving a
//       camera)": the request stays there while the ticket turns orange, then red; then the camera pans to the right (`PAN`): the request goes off to the left, fading, the ticket takes the
//       left place and the escalation alert pops at its right, outlined
//   5-8 · "here show only maintenance alert, nothing else, keep for the whole story just one ticket and claim it then goes to next": no ticket board and no other ticket. The SAME ticket (its
//       timer goes on, red) glides under Open, the three sections of the ticket board being only their tabs (`SECT`); the cursor opens it and plays the request's video; the responder's avatar
//       takes it to Claimed and sits on it; it closes it the same way, in Closed, its time and who did it outlined; the closing words over that.
// ONE thread: the maintenance request, and the one ticket it raises. Pure: no React, no Remotion.
import {CUT_FPS, CUT_H, CUT_W, M, clock, cursorPlan, cutMaker, mix, prog, story, voiceOf} from './cutCore.mjs';
import {MID, PANEL, PW, SIT, TR, XF, agingOf, boardLayout, chainLayout, panelLeft, panelRight, popped, rideAt, sectionLayout, step, tellers, tg} from './sectionCore.mjs';
import {DEFAULTS} from '../sections/liveData.mjs';

export {CUT_FPS, CUT_H, CUT_W, PANEL};
export const MAINTENANCE_CUT_ID = 'RM-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['RM-Cut'])
export const TITLE_WORDS = {lines: ['Maintenance Requests Can Be Made', 'At A Press Of A Button'], mark: null};
export const DATA = DEFAULTS['requesting-maintenance'];

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['RM-Cut'], lib/remotion/cutWords.mjs). The label two or three words, the sentence two short lines, never more ----
const SAYS = {
  list: ['Request from a list', ['A Request Is Made', 'From A Simple List']],
  document: ['Document the issue', ['The Issue Is Described', 'With Text Or Video']],
  alert: ['Alert ticket', ['A Request Triggers', 'An Alert Ticket']],
  delays: ['Escalation', ['Slow Responses Turn Red', 'And Raise An Alert']],
  evidence: ['Visual evidence', ['The Video Goes', 'With The Ticket']],
  responder: ['Who responds', ['The Responder Takes', 'The Ticket']],
  tracked: ['Response time', ['Response Time Is Tracked', 'Until It Is Resolved']],
  conclusion: ['Seamless requests', ['Requests Are Made', 'While People Work']],
};
const TYPE = 1.3; // the issue typed in the request

// ---- where things stand (stage px; lib/remotion/sectionCore.mjs) ----
// 1 · the Open section of the team board, with no tablet: its tab, its missions under it (room for the request, the third), the plus and the On-Demand list
const OPEN_AGES = [1210, 980]; // (the board's two open missions have waited this long: the longer the higher)
export const OPEN = sectionLayout({slots: 3, plus: true});
// 3, 4 · the chain: the request's panel, an arrow, the alert ticket; after the pan the ticket, an arrow, the escalation alert
export const CHAIN = chainLayout({right: 'ticket'});
export const PAN = CHAIN.pan; // the camera's pan to the right: everything goes this far to the left
// 5 to 8 · the ticket board's three sections with no tablet: only their tabs, and the one ticket under the one it is in; the responder's avatar pops at the left of Open
export const SECT = boardLayout({card: 'ticket'});
export const SEAT = SECT.seat; // (level with the ticket's middle: it goes straight across to the ticket)

// ---- what the cursor presses and what is outlined ----
const P = {
  add: tg('open', 'add'), demand: tg('open', 'demand-maintenance-request'), req: tg('open', 'req'),
  describe: tg('request', 'field-describe'), yes: tg('request', 'yes-doc'), video: tg('request', 'add-video-doc'),
  alert: tg('cards', 'ticket'), escalation: tg('cards', 'escalation'),
  ticket: tg('cards', 'ticket'), play: tg('ticket', 'play-evidence'),
  exec: tg('cards', 'ticket-exec'), who: '.rc-sp-face', // (who did it: the responder's avatar, sitting on the ticket where its performer is)
};

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (every piece of the picture, where it is and what it shows), `marksAt`, `cursorAt`, `artAt`.
// What the NARRATOR says, line by line (the layout `NARRATOR`, the look `remotion-narrator`; the user, 2026-11-16: "for all videos add a narrator style voice over variation ... the same
// video just with a narrator behind it instead of reading what's on screen", as Increased Efficiency's Variation 10): the screen shows the same words, the voice talks to the viewer about
// what is shown, in the second person. A sentence stays as long as the narrator talks (the voice sets the pace: lib/remotion/cutCore.mjs `story`). Change a line here, or retype it on the
// Titles panel ('<id>:voice'), then make the voice again (`npm run gen:voice -- --layout narrator`). Written, NOT played.
export const NARRATION = {
  title: "Something's broken? Reporting it should take one press of a button.",
  list: "You simply pick the request from a list.",
  document: "Then you describe the issue, in a few words, or with a quick video.",
  alert: "The moment you send it, an alert ticket goes out.",
  delays: "And if nobody responds in time, the ticket turns red, and it's escalated.",
  evidence: "Your video travels with the ticket, so the responder knows what to expect.",
  responder: "Someone takes the ticket, and you know exactly who.",
  tracked: "From there, the response time is tracked, right up until it's resolved.",
  conclusion: "And all of it happens without anyone leaving their work.",
};
// `layout`: none, or `NARRATOR` (lib/remotion/cutCore.mjs): the same film with the narrator's voice
function build(words, {layout = null} = {}) {
  const st = story(words, {title: TITLE_WORDS, slide: true, ...voiceOf(MAINTENANCE_CUT_ID, layout, NARRATION)}), {B, captions, mark} = st;
  const {hand, click, leave, finish: handDone} = cursorPlan();
  const {say, next, last, acted, shown, each, read} = tellers(st, SAYS);

  // 1 · the Open section comes in as the title goes; the cursor presses the plus, the On-Demand list opens out of it, the cursor picks Maintenance Request: the request is added to Open
  B.board = B.titleOut + 0.15;
  const list = say('list', B.board + TR * 0.55);
  B.add = click(Math.max(list.written, B.board + TR), P.add);
  B.pick = click(B.add + M + 0.4, P.demand);
  leave();
  B.posted = B.pick + 0.3; // (the list is going: the request pops in at the bottom of Open, as a mission that is posted does)
  acted(list, B.posted + M + 0.2);
  // 2 · the cursor opens the request: it expands, the issue is typed, Yes to document it, a video is added
  const doc = say('document', next(list));
  B.openReq = click(doc.written, P.req);
  leave();
  B.describe = click(B.openReq + M + 0.4, P.describe);
  B.typed = B.describe + 0.2;
  B.yesDoc = click(B.typed + TYPE + 0.3, P.yes);
  B.addVideo = click(B.yesDoc + 0.9, P.video);
  leave();
  acted(doc, B.addVideo + 0.9);
  // 3 · the request raises an alert ticket: the request stays open as it is and goes to the left; the ticket pops at its right, an arrow from the request to it, outlined
  const alert = say('alert', next(doc));
  B.aside = alert.at;
  B.pop = Math.max(alert.written, B.aside + M);
  shown(alert, B.pop + M);
  mark(B.pop + M, alert.until, [P.alert], 6);
  // 4 · nobody answers: the request still open at its left, the ticket turns orange, then red (its timer goes up fast, its pill pops at each color); then the camera pans to the right, the
  // request goes off to the left, fading, and the escalation alert pops at the right of the ticket, outlined
  const delays = say('delays', next(alert));
  B.tick = delays.written;
  const age = agingOf({pop: B.pop, tick: B.tick});
  B.orange = age.orange;
  B.red = age.red;
  B.aged = age.done; // (from there it runs a second a second again)
  B.pan = B.red + 1;
  B.esc = B.pan + M * 0.55;
  shown(delays, B.esc + M);
  mark(B.esc + M, delays.until, [P.escalation], 6);
  // 5 · the one ticket, nothing else: the escalation alert goes, the ticket glides under Open (the ticket board's three sections are only their tabs); the cursor opens it, then plays the
  // video of the request
  const evidence = say('evidence', next(delays));
  B.sections = evidence.at;
  B.openTicket = click(Math.max(evidence.written, B.sections + M), P.ticket);
  leave();
  B.play = click(B.openTicket + M + 0.5, P.play);
  leave();
  B.played = B.play + 0.9;
  acted(evidence, B.played + 0.8);
  // 6 · who responds: back on the sections, the responder's avatar pops at the left of Open, goes straight to the ticket's edge at the middle of its height (the user, 2026-11-16: "make it go to
  // the center of ticket vertically before going to name place"), the ticket goes with it to Claimed, and the avatar goes to the name's place on the ticket and sits there. It is the SAME avatar
  // all along: it is never changed for the card's own ("make sure to don't change the avatar to the shape it had before")
  const responder = say('responder', next(evidence));
  B.back = responder.at;
  B.faceIn = responder.written;
  B.faceGo = B.faceIn + 0.55;
  B.claim = B.faceGo + M + 0.3;
  B.settle = B.claim + M + 0.1;
  B.settled = B.settle + SIT;
  acted(responder, B.settled + 0.2);
  // 7 · the response time: the avatar closes the ticket the way it took it ("make it go to the same place as before ... the same way when moving to close"): out of the name's place to the
  // ticket's edge, with the ticket to Closed, back to the name's place; then its execution time and who did it, outlined
  const tracked = say('tracked', next(responder));
  B.out = tracked.written;
  B.close = B.out + SIT + 0.1;
  B.rest = B.close + M + 0.1;
  B.rested = B.rest + SIT;
  each(tracked, B.rested + 0.15, [P.exec, P.who], 5);
  // 8 · the closing words, over the ticket: read, then the words go, then the picture
  const conclusion = read(say('conclusion', next(tracked)));
  B.end = last(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  const [, , carla] = DATA.people, openMissions = DATA.board.slice(0, DATA.board.length - 2); // (the board's last two missions are claimed and closed: they are not in the Open section)
  const where = `${DATA.area} - ${DATA.ticketBoard}`, after = (t, at) => Math.min(1, Math.max(0, (popped(t, at) - 0.4) / 0.6)); // (an arrow comes after the card it goes to)
  function stateAt(t) {
    const typed = t < B.typed ? '' : DATA.problem.slice(0, Math.round(DATA.problem.length * Math.min(1, (t - B.typed) / TYPE)));
    // 1 · the Open section: how far the On-Demand list is open (it opens at the plus and goes as the request is picked), where the group is, its missions and their running timers
    const menu = prog(t, B.add, M) * (1 - prog(t, B.pick + 0.1, 0.3)), gx = mix(OPEN.closed, OPEN.opened, menu), ran = Math.max(0, t - B.board), posted = t >= B.posted;
    const openChip = (id, i, m, pop = 1) => ({id, x: gx, y: OPEN.slotY(i), k: OPEN.k, pop, mission: {date: '09-23-26', time: '03:05 PM', tone: 'green', who: null, exec: null, points: null, ...m}});
    const open = {
      op: 1 - prog(t, B.openReq, XF), x: gx, y: OPEN.y, k: OPEN.k, count: openMissions.length + (posted ? 1 : 0),
      chips: [...openMissions.map((m, i) => openChip(m.id, i, {kind: m.type, title: m.title, pill: clock((OPEN_AGES[i] ?? 600) + ran)})),
        ...(posted ? [openChip('req', openMissions.length, {kind: 'Survey', title: DATA.request, pill: clock(t - B.posted), time: '10:20 AM'}, popped(t, B.posted))] : [])],
      plus: OPEN.plusAt(gx), menu: {p: menu, ...OPEN.menuAt(gx), picked: t >= B.pick ? 'maintenance-request' : null},
    };
    // 2 to 4 · the request's panel: in the middle, then at the left of the ticket it raises (still open, as it was), then off to the left, fading, as the camera pans to the right
    const aside = step(t, B.aside), pan = step(t, B.pan), left = mix(PANEL.left, panelLeft(CHAIN.left), aside) - PAN * pan;
    const request = {op: prog(t, B.openReq, XF) * (1 - pan), left, top: PANEL.top, scale: PANEL.scale, expand: step(t, B.openReq), typed, doc: t >= B.addVideo ? 'done' : t >= B.yesDoc ? 'ask' : 'none'};
    // 3 to 8 · the one ticket: at the right of the request, then at the left of the escalation alert, then under Open, Claimed, Closed
    const seconds = age.seconds(t, B.close), sect = step(t, B.sections), claim = step(t, B.claim), close = step(t, B.close), closed = t >= B.close, claimed = t >= B.claim;
    const tk = mix(CHAIN.k, SECT.k, sect), tx = mix(CHAIN.right - PAN * pan, SECT.x0, sect) + SECT.pitch * (claim + close), ty = mix(CHAIN.y, SECT.cardY, sect);
    const ticket = {id: 'ticket', x: tx, y: ty, k: tk, pop: popped(t, B.pop), pillPop: age.pillPop(t), moving: (claim > 0 && claim < 1) || (close > 0 && close < 1),
      mission: {kind: 'Ticket', title: DATA.ticket, response: DATA.problem, location: where, date: '09-23-26', time: '10:21 AM', pill: clock(seconds),
        tone: closed ? 'gray' : age.tone(seconds), exec: claimed ? clock(Math.min(t, B.close) - B.claim) : null, who: claimed ? carla : null, claimed}};
    const gone = 1 - prog(t, B.sections, XF); // (the escalation alert and its arrow go as the ticket goes under Open)
    const escalation = t >= B.esc && gone > 0.001 ? {id: 'escalation', x: CHAIN.second, y: CHAIN.y, k: CHAIN.k, pop: popped(t, B.esc), op: gone,
      mission: {kind: 'Ticket', title: 'Escalation Alert', response: 'The ticket has not been answered in time.', location: where, date: '09-23-26', time: '11:21 AM', pill: clock(t - B.esc), tone: 'green', who: null, exec: null}} : null;
    const arrows = [
      {id: 'raised', from: [panelRight(left) + CHAIN.pad, MID.y], to: [tx - CHAIN.pad, MID.y], op: after(t, B.pop) * (1 - pan)},
      {id: 'escalated', from: [tx + CHAIN.w + CHAIN.pad, MID.y], to: [CHAIN.second - CHAIN.pad, MID.y], op: after(t, B.esc) * gone},
    ].filter(a => a.op > 0.001);
    // the ticket's panel is over everything while it is open: the cards and the tabs go as it comes, and come back as it goes
    const panel = prog(t, B.openTicket, XF) * (1 - prog(t, B.back, XF));
    const count = {open: claimed ? 0 : 1, claimed: claimed && !closed ? 1 : 0, closed: closed ? 1 : 0};
    return {
      open, request,
      cards: {op: t >= B.pop ? 1 - panel : 0, ticket, escalation, arrows},
      tabs: {op: prog(t, B.sections, XF) * (1 - panel), y: SECT.tabY, k: SECT.k, list: ['open', 'claimed', 'closed'].map((status, i) => ({status, x: SECT.colX(i), n: count[status]}))},
      ticket: {op: panel, expand: step(t, B.openTicket), watch: t >= B.played ? 4 : t >= B.play ? 2 : 0, timer: clock(seconds), tone: age.tone(seconds)},
      // the responder's avatar, the same one to the end (sectionCore `rideAt`)
      face: rideAt(t, {in: B.faceIn, go: B.faceGo, settle: B.settle, out: B.out, rest: B.rest}),
    };
  }

  return {
    words, layout, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeMaintenanceCut = cutMaker(build);
