// Requesting Maintenance, the Remotion cut (the user, 2026-11-12, after Dynamic Auditing's and Precision Planning's: "do next request maintenance"; written, NOT played or rendered). It is the look
// `remotion` of lib/storyboardVariations.mjs on the board requesting-maintenance-v2: on the All videos page that board then plays THIS film in Remotion's Player
// (components/StoryboardRemotionCut.jsx), and the Remotion project D:\Documents\Saas\videos renders it to an MP4 (composition RM-Cut). The art is components/remotion/MaintenanceCut.jsx: the
// section's own pieces (components/sections/MaintenanceStage.jsx: the team board and its On-Demand list, the request, the alert ticket and its escalation, the ticket board, the ticket opened),
// set by THIS file as a function of the time, so a frame is the same in the Player and in a render.
//
// Told as Dynamic Auditing's, Precision Planning's, Live Oversight's and Increased Efficiency's are (lib/remotion/auditingCut.mjs and oversightCut.mjs say why, at their top):
//   - the words SLIDE (`story(words, {slide: true})`): the blue label alone from the left, the white words written, the whole goes on to the right; the title is typed in place
//   - NEVER MORE THAN TWO LINES of words on top of each other (the user, 2026-11-12) and, retyped, the first letter of each word a capital (lib/remotion/cutWords.mjs `titleCase`): a label (two or
//     three words) and a sentence of two short lines (`SAYS`). They are not the narration's, which the board's slides still say (lib/sections/requesting-maintenance.mjs)
//   - only what the real software has is drawn (the user, 2026-11-12, of a box the stage had made up: "this UI doesn't exist in real software"): the team board, its plus and On-Demand list, a
//     request's panel, the alert tickets of the ticket board, a ticket's panel
//   - the action starts the moment the last word is written, and the words go `GONE` s after it has ended; words that only show something keep it `SHOW` s
//   - the CEO's rule (a tablet: the words at the bottom; no tablet, a phone's panel: the panel in the middle): the tablet and the cards are over the band, the request and the ticket a smaller 9:16
//     phone's panel in the middle, the words under it
//   - what is only shown is outlined in yellow; what is done is done by the cursor (`cursorPlan`: words first, comes out of the left of the words, clicks, leaves before the screen changes)
//   - one speed (a move 0.76 s on Easy Ease 70%), a change of screen 0.4 s
// ONE thread: the maintenance request. The plus, the On-Demand list, the request on the board; it is opened, described, documented with a video; it raises an alert ticket, which turns orange, red
// and raises an escalation alert; the ticket board, the ticket opened with the video, claimed, closed with its time and who did it. Pure: no React, no Remotion.
import {CUT_FPS, CUT_H, CUT_W, M, SLIDE, clamp, cursorPlan, cutMaker, prog, story} from './cutCore.mjs';
import {FLOW_CY, FLOW_DX, FLOW_DY, PANEL, TABLET} from './auditingCut.mjs';
import {DEFAULTS} from '../sections/liveData.mjs';

export {CUT_FPS, CUT_H, CUT_W, PANEL, TABLET, FLOW_CY, FLOW_DX, FLOW_DY};
export const MAINTENANCE_CUT_ID = 'RM-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['RM-Cut'])
export const TITLE_WORDS = {lines: ['Maintenance Requests Can Be Made', 'At A Press Of A Button'], mark: null};
export const DATA = DEFAULTS['requesting-maintenance'];
export const FLOW_K = 1.3; // the cards over the band, as Dynamic Auditing's single row

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

// ---- the speeds (Increased Efficiency's) ----
const QUICK = 1.3, TR = M / QUICK, GONE = 0.3;
const SHOW = 1.1, EACH = 0.45;
const XF = 0.4;      // a change of screen: the new one comes in over the old one, which goes as it comes
const TYPE = 1.3;    // the issue typed in the request
const READ = lines => 0.8 + lines.join('').replace(/\s+/g, '').length / 18;
const AGING_RATE = 900, AGING_FROM = 20; // the ticket's timer while it ages: 15 minutes of its time a second, from 00:00:20

// ---- what the cursor presses and what is outlined (each layer says its name: data-rc-ma) ----
const on = (layer, sel) => `[data-rc-ma="${layer}"] ${sel}`, tg = (layer, key) => on(layer, `[data-iq-target="${key}"]`), mi = (layer, id) => on(layer, `[data-mission-id="${id}"]`);
const P = {
  add: on('board', '.tbl-header [aria-label="Add"]'), demand: tg('board', 'demand-maintenance-request'),
  req: mi('board', 'req'), describe: tg('request', 'field-describe'), yes: tg('request', 'yes-doc'), video: tg('request', 'add-video-doc'),
  alert: tg('flow-alert', 'alert'), escalation: tg('flow-aging', 'escalation'),
  ticket: mi('tickets', 'ticket'), play: tg('ticket', 'play-evidence'),
  exec: `${mi('tickets', 'ticket')} .chip-exec`, who: `${mi('tickets', 'ticket')} .chip-performer-avatar`,
};

// ---- the cut, made from its words ----
// words: {key: text}: a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`, `title`), its length (`seconds`, `frames`) and what
// follows the time: `stateAt` (the layers on and what each shows), `marksAt`, `cursorAt`, `artAt`.
function build(words) {
  const st = story(words, {title: TITLE_WORDS, slide: true}), {B, captions, mark} = st;
  const {hand, click, leave, finish: handDone} = cursorPlan();
  const say = (id, at) => st.say(id, SAYS[id][0], SAYS[id][1], at);
  const next = c => c.until + SLIDE.out;                              // the next sentence: once these words have gone
  const acted = (c, end) => { c.until = end + GONE; return c; };       // words with an action: they go `GONE` s after it has ended
  const shown = (c, at, n = 1) => { c.until = at + (n - 1) * EACH + SHOW + GONE; return c; };
  const each = (c, at, targets, pad = 6) => { shown(c, at, targets.length); targets.forEach((sel, i) => mark(at + i * EACH, c.until, [sel], pad)); };

  // 1 · the tablet comes in as the title goes; the cursor presses the plus, the On-Demand list opens, the cursor picks Maintenance Request: the request is posted on the board
  B.board = B.titleOut + 0.15;
  const list = say('list', B.board + TR * 0.55);
  B.add = click(Math.max(list.written, B.board + TR), P.add);
  B.pick = click(B.add + M + 0.4, P.demand);
  leave();
  B.posted = B.pick + 0.3; // (the list has gone: the request pops in at the top of Open and the missions under it glide down)
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
  // 3 · the request raises an alert ticket: the request alone, the ticket pops to its right, outlined
  const alert = say('alert', next(doc));
  B.alertView = alert.at;
  B.pop = alert.written;
  shown(alert, B.pop + M);
  mark(B.pop + M, alert.until, [P.alert], 6);
  // 4 · nobody answers: the ticket turns orange, then red, an escalation alert pops, outlined
  const delays = say('delays', next(alert));
  B.agingView = delays.at;
  B.tick = delays.written;                  // the ticket's timer goes up, fast (AGING_RATE s a second), green, then orange at half an hour, red at an hour: the pill pops at each color
  B.orange = B.tick + (1800 - AGING_FROM) / AGING_RATE;
  B.red = B.tick + (3600 - AGING_FROM) / AGING_RATE;
  B.esc = B.red + 1.1;
  shown(delays, B.esc + M);
  mark(B.esc + M, delays.until, [P.escalation], 6);
  // 5 · the ticket board: the cursor opens the ticket, then plays the video of the request
  const evidence = say('evidence', next(delays));
  B.ticketsView = evidence.at;
  B.openTicket = click(evidence.written, P.ticket);
  leave();
  B.play = click(B.openTicket + M + 0.5, P.play);
  leave();
  B.played = B.play + 0.9;
  acted(evidence, B.played + 0.8);
  // 6 · who responds (the user, 2026-11-12: "show an avatar on the left and takes the second ticket"): back on the board, the responder's avatar pops at the left of the tablet, goes to the ticket (the
  // second of Open: a new ticket comes at the bottom), the ticket goes with it to Claimed, and the avatar settles on the ticket where its performer is
  const responder = say('responder', next(evidence));
  B.boardAgain = responder.at;
  B.faceIn = responder.written;
  B.faceGo = B.faceIn + 0.55;
  B.claim = B.faceGo + M + 0.3;
  B.settle = B.claim + M + 0.1;
  B.settled = B.settle + M * 0.7;
  acted(responder, B.settled + 0.2);
  // 7 · the response time: the ticket is closed; its execution time and who did it, outlined
  const tracked = say('tracked', next(responder));
  B.close = tracked.written;
  each(tracked, B.close + M, [P.exec, P.who], 5);
  // 8 · the closing words, over the board: read, then the words go, then the picture
  const conclusion = say('conclusion', next(tracked));
  conclusion.until = conclusion.written + READ(conclusion.lines);
  B.end = next(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  // the layers on: the one a click or a new sentence went to comes in over the one before in `XF` s, the one before goes as it comes -> [{id, op}], the one under first
  const LAYERS = [{t: -Infinity, id: 'board'}, {t: B.openReq, id: 'request'}, {t: B.alertView, id: 'flow-alert'}, {t: B.agingView, id: 'flow-aging'}, {t: B.ticketsView, id: 'tickets'},
    {t: B.openTicket, id: 'ticket'}, {t: B.boardAgain, id: 'tickets'}];
  function layersAt(t) {
    let i = 0;
    while (i + 1 < LAYERS.length && t >= LAYERS[i + 1].t) i++;
    const p = i ? prog(t, LAYERS[i].t, XF) : 1;
    return p < 1 ? [{id: LAYERS[i - 1].id, op: 1 - p}, {id: LAYERS[i].id, op: p}] : [{id: LAYERS[i].id, op: 1}];
  }
  const step = (t, at) => prog(t, at, M);
  const POP_UP = 0.3, GROW = 0.16;
  const pillPop = t => 1 + GROW * (prog(t, B.orange - POP_UP / 2, POP_UP) - prog(t, B.orange + 0.45, POP_UP)) + GROW * (prog(t, B.red - POP_UP / 2, POP_UP) - prog(t, B.red + 0.45, POP_UP));
  function stateAt(t) {
    const typed = t < B.typed ? '' : DATA.problem.slice(0, Math.round(DATA.problem.length * Math.min(1, (t - B.typed) / TYPE)));
    return {
      layers: layersAt(t),
      // the team board: how far the On-Demand list is open (it comes in at the plus and goes as the request is picked), and whether the request is on the board
      // (the motion is Increased Efficiency's: a mission pops in 0.34 s, one that changes place glides over a move, `p` 0 to 1 from the list it was in `from` to the one it is in `to`: components/remotion/MotionBoard.jsx)
      board: {from: 'base', to: t >= B.posted ? 'requested' : 'base', p: step(t, B.posted), pops: {req: clamp((t - B.posted) / 0.34)}, drawer: prog(t, B.add, M) * (1 - prog(t, B.pick + 0.1, 0.3))},
      request: {expand: step(t, B.openReq), typed, doc: t >= B.addVideo ? 'done' : t >= B.yesDoc ? 'ask' : 'none'},
      // the cards: how far the one that pops is there (0 to 1); the ticket's tone (0 green, 1 orange, 2 red) and how far its timer's pill has popped (it pops once as its color goes, up and down)
      // (`since`: seconds since the new card popped, its timer runs from 00:00:00 then; `seconds`: the ticket's timer while it ages, going up)
      flows: {alert: clamp((t - B.pop) / 0.34), aging: clamp((t - B.esc) / 0.34), tone: t >= B.red ? 2 : t >= B.orange ? 1 : 0, pill: pillPop(t),
        sinceAlert: Math.max(0, t - B.pop), sinceEscalation: Math.max(0, t - B.esc), seconds: Math.min(3600 + 8, AGING_FROM + Math.max(0, t - B.tick) * AGING_RATE)},
      // the ticket board: which list it is in (ticketed, claimedBare: claimed and no avatar on it yet, claimed, closed)
      tickets: t >= B.close ? {from: 'claimed', to: 'closed', p: step(t, B.close)} : t >= B.settled ? {from: 'claimed', to: 'claimed', p: 1}
        : t >= B.claim ? {from: 'ticketed', to: 'claimedBare', p: step(t, B.claim)} : {from: 'ticketed', to: 'ticketed', p: 1},
      // the responder's avatar: popped (0 to 1), on its way from its place at the left to the ticket (0 to 1), on its way to the ticket's performer place (0 to 1), seen
      face: {pop: clamp((t - B.faceIn) / 0.34), go: prog(t, B.faceGo, M), spot: prog(t, B.settle, M * 0.7), on: t >= B.faceIn && t < B.settled},
      ticket: {expand: step(t, B.openTicket), watch: t >= B.played ? 4 : t >= B.play ? 2 : 0},
    };
  }

  // the seconds the board has run (its timers go by it) and the second, on it, each thing happens (a mission posted in the film starts its timer there, a claimed one its execution timer; a closed one stops)
  const elapsedAt = t => Math.floor(Math.max(0, t - B.board)), onBoard = t => Math.floor(t - B.board);
  const runs = {born: {req: onBoard(B.posted), ticket: onBoard(B.ticketsView)}, claimedAt: {ticket: onBoard(B.claim)}, stoppedAt: {ticket: onBoard(B.close)}};
  return {
    words, layout: null, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt, elapsedAt, runs,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeMaintenanceCut = cutMaker(build);
