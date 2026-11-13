// Dynamic Auditing, the Remotion cut (the user, 2026-11-12, after Live Oversight's: "do next ones dynamic auditing and precision planning ... using remotion and same style as increased effeciency";
// written, NOT played or rendered). It is the look `remotion` of lib/storyboardVariations.mjs on the board dynamic-auditing-v2: on the All videos page that board then plays THIS film in Remotion's
// Player (components/StoryboardRemotionCut.jsx), and the Remotion project D:\Documents\Saas\videos renders it to an MP4 (composition DA-Cut). The art is components/remotion/AuditingCut.jsx: the
// section's own pieces (components/sections/AuditingStage.jsx: the tablet's board of audits, the audit, the corrective mission, the training, the cards that follow an audit, the Knowledge Base, the
// web report's gallery), set by THIS file as a function of the time, so a frame is the same in the Player and in a render.
//
// Told as Live Oversight's, Increased Efficiency's Variation 7 and Improved Quality's Variation 4 are (lib/remotion/oversightCut.mjs says why, at its top):
//   - the words SLIDE (`story(words, {slide: true})`): the blue label alone from the left, the white words written, the whole goes on to the right; the title is typed in place
//   - NEVER MORE THAN TWO LINES of words on top of each other (the user, 2026-11-12: "always no more than two sentences on top of eachother (rewrite it if it's too long)"): a label (two or three
//     words) and a sentence of two short lines (`SAYS`). They are not the narration's, which the board's slides still say (lib/sections/dynamic-auditing.mjs). When words are retyped, the first
//     letter of each word is a capital (lib/remotion/cutWords.mjs `titleCase`)
//   - the action starts the moment the last word is written, and the words go `GONE` s after it has ended; words that only show something keep it `SHOW` s
//   - the CEO's rule (2026-11-09: a tablet or a big board: the words at the bottom): the tablet, the mission, the cards and the web page are all over the band, nothing moves them; the mission is a
//     smaller 9:16 phone in the middle of the picture, the words under it
//   - what is only shown is outlined in yellow, what is done is done by the cursor (`cursorPlan`: words first, comes out of the left of the words, clicks, leaves before the screen changes)
//   - one speed (a move 0.76 s on Easy Ease 70%), a change of screen 0.4 s: the new one comes in over the old, which goes as it comes
// ONE thread: the North Building Audit, from the tablet to the web report. It is posted, opened, answered step by step, a hazard is filmed; the hazard raises a mission, with the video as its
// evidence, closed with its time and who did it; a follow-up audit and two micro-trainings follow, one is read and answered in a quiz; the Knowledge Base; a link; the gallery of the evidence.
// Pure: no React, no Remotion.
import {CUT_FPS, CUT_H, CUT_W, M, SLIDE, clamp, cursorPlan, cutMaker, prog, story} from './cutCore.mjs';
import {FULL} from './qualityCut.mjs';

export {CUT_FPS, CUT_H, CUT_W};
export const AUDITING_CUT_ID = 'DA-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['DA-Cut'])
export const TITLE_WORDS = {lines: ['Audits Are Automatically Assigned', 'Exactly When Due'], mark: null};
export const TABLET = FULL;                                  // the tablet, whole, in the middle of the room (the same as Improved Quality's)
export const PANEL = {left: 620, top: 85.5, scale: 1.15};    // the mission, a 9:16 phone's panel (360 x 573) centered at x 800, y 372: over the band's straight edge (y 744) with its shadow
export const FLOW_DY = {corrective: -64, time: -64, followup: -39, training: -64}; // each group of cards moved up so the group is centered over the band; all of them +280 across (FLOW_DX)
export const FLOW_DX = 280;
export const FLOW_K = {corrective: 1.3, time: 1.3, followup: 1.1, training: 1.15}; // the cards are drawn this much bigger, about the middle of each group (x 520, y `FLOW_CY`): they were small over the picture; a group of two rows less, to stay between the picture's top and the band
export const FLOW_CY = {corrective: 436, time: 436, followup: 411, training: 436};
export const BOARD = {w: CUT_W, h: 744};                    // the web page, edge to edge over the band (as Live Oversight's)
export const RANGE = '09/22/2026 – 09/28/2026';

// ---- the words: {id: [label, lines]} (retyped: edits.cuts['DA-Cut'], lib/remotion/cutWords.mjs). The label two or three words, the sentence two short lines, never more ----
const SAYS = {
  posted: ['Audits on time', ['Audits Are Posted', 'Exactly When Due']],
  guided: ['Guided audits', ['Auditors Are Guided', 'Step By Step']],
  hazard: ['Hazard proof', ['A Hazard Is Filmed', 'On The Spot']],
  corrective: ['Corrective action', ['A Hazard Triggers', 'A Corrective Mission']],
  evidence: ['Evidence attached', ['The Video Goes', 'With The Mission']],
  time: ['Response time', ['Response Times Are', 'Measured Per Mission']],
  followup: ['Follow-up audit', ['A Follow-Up Audit', 'Is Assigned By Itself']],
  trainings: ['Micro-training', ['An Issue Triggers', 'Training For Everyone']],
  text: ['Written notice', ['The Training Reads', 'As A Written Notice']],
  quiz: ['Quiz', ['A Quiz Confirms', 'It Was Understood']],
  knowledge: ['Knowledge base', ['Information Is Ready', 'While Auditors Work']],
  links: ['Outside links', ['Instructions Can Link', 'To Outside Resources']],
  gallery: ['Gallery view', ['Managers Tour', 'The Evidence']],
  conclusion: ['Always in control', ['Audits Keep Standards', 'And Close The Loop']],
};

// ---- the speeds (Increased Efficiency's) ----
const QUICK = 1.3, TR = M / QUICK, GONE = 0.3;
const SHOW = 1.1, EACH = 0.45;
const XF = 0.4;                                              // a change of screen: the new one comes in over the old one, which goes
const POSTS = 0.3;                                           // audits posted, one after the other
const READ = lines => 0.8 + lines.join('').replace(/\s+/g, '').length / 18;

// ---- what the cursor presses and what is outlined (each layer says its name: data-rc-ad) ----
const on = (layer, sel) => `[data-rc-ad="${layer}"] ${sel}`, tg = (layer, key) => on(layer, `[data-iq-target="${key}"]`);
const P = {
  card: on('board', '[data-mission-id="audit-North"]'), cards: ['North', 'South', 'East', 'West'].map(d => on('board', `[data-mission-id="audit-${d}"]`)),
  menu: on('board', '.tbl-header [aria-label="Menu"]'), kb: on('board', '.bn-menu-item:has(img[src="/board-icons/team-book.svg"])'),
  yes: i => tg('audit', `yes-${i}`), yesHazard: tg('audit', 'yes-hazard'), addVideo: tg('audit', 'add-video-hazard'),
  fix: tg('flow-corrective', 'corrective'), play: tg('corrective', 'play-evidence'),
  exec: tg('flow-time', 'corrective-exec'), who: tg('flow-time', 'corrective-who'),
  followup: tg('flow-followup', 'followup'), train1: tg('flow-training', 'training-1'), train2: tg('flow-training', 'training-2'), lesson: tg('training', 'play-lesson'),
  link: tg('audit-links', 'link'), gallery: tg('web', 'gallery-view'),
};

// A scroll between places: [{t, key}] in order -> {from, to, p} at `t` (the window goes from the key before to the one a click named, in a move)
export function scrollAt(list, t) {
  let i = 0;
  while (i + 1 < list.length && t >= list[i + 1].t) i++;
  const here = list[i], before = list[i - 1] ?? here;
  return {from: before.key, to: here.key, p: i ? prog(t, here.t, M) : 1};
}

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

  // 1 · the tablet comes in as the title goes; the four audits are posted one after the other, then outlined
  B.board = B.titleOut + 0.15;
  const posted = say('posted', B.board + TR * 0.55);
  B.post = Math.max(posted.written, B.board + TR);
  each(posted, B.post + 3 * POSTS + 0.5, P.cards, 5);
  // 2 · guided: the cursor opens the North Building Audit; the mission expands and goes to its first point; three Yes, each point comes up under the summary
  const guided = say('guided', next(posted));
  B.open = click(guided.written, P.card);
  leave();
  B.y0 = click(B.open + M + 0.5, P.yes(0));
  B.y1 = click(B.y0 + M + 0.2, P.yes(1));
  B.y2 = click(B.y1 + M + 0.2, P.yes(2));
  leave();
  acted(guided, B.y2 + 0.4);
  // 3 · a hazard: Yes, a video is asked for, the cursor adds one, it is attached
  const hazard = say('hazard', next(guided));
  B.yesH = click(hazard.written, P.yesHazard);
  B.addV = click(B.yesH + 0.9, P.addVideo);
  leave();
  B.attached = B.addV + 1.5;
  acted(hazard, B.attached + 0.5);
  // 4 · the hazard triggers a mission: the audit alone, the corrective mission pops to its right, outlined
  const corrective = say('corrective', next(hazard));
  B.fixView = corrective.at;
  B.pop = corrective.written;
  shown(corrective, B.pop + M);
  mark(B.pop + M, corrective.until, [P.fix], 6);
  // 5 · its evidence: the cursor opens the mission, then plays the video
  const evidence = say('evidence', next(corrective));
  B.openFix = click(evidence.written, P.fix);
  leave();
  B.play = click(B.openFix + M + 0.5, P.play);
  leave();
  B.played = B.play + 0.9;
  acted(evidence, B.played + 0.8);
  // 6 · the mission folds into its card, closed: its execution time and who did it, outlined
  const time = say('time', next(evidence));
  B.fold = time.written;
  B.timeView = B.fold + M;
  each(time, B.timeView + XF + 0.1, [P.exec, P.who], 5);
  // 7 · a follow-up audit: the audit and the corrected mission, the follow-up pops under them
  const followup = say('followup', next(time));
  B.followView = followup.at;
  B.popFollow = followup.written;
  shown(followup, B.popFollow + M);
  mark(B.popFollow + M, followup.until, [P.followup], 6);
  // 8 · micro-trainings: the audit, two trainings pop to its right
  const trainings = say('trainings', next(followup));
  B.trainView = trainings.at;
  B.popTrain = trainings.written;
  each(trainings, B.popTrain + M, [P.train1, P.train2], 6);
  // 9 · the lower training: the cursor opens it, it is written as text
  const text = say('text', next(trainings));
  B.openTrain = click(text.written, P.train2);
  leave();
  B.text = B.openTrain + M * 0.7;
  acted(text, B.openTrain + M + 0.4);
  // 10 · a quiz: the cursor opens the training, the quiz follows its notice; the training is done
  const quiz = say('quiz', next(text));
  B.quiz = click(quiz.written, P.lesson);
  leave();
  B.done = B.quiz + 1.9;
  acted(quiz, B.done + 0.5);
  // 11 · the Knowledge Base: back on the board, the cursor opens the menu, then the Knowledge Base
  const knowledge = say('knowledge', next(quiz));
  B.kbView = knowledge.at;
  B.menu = click(knowledge.written, P.menu);
  B.item = click(B.menu + 0.5, P.kb);
  leave();
  B.kbShown = B.item + 0.1;
  acted(knowledge, B.kbShown + M);
  // 12 · a link: the audit's instructions hold a link, outlined
  const links = say('links', next(knowledge));
  B.linkView = links.at;
  shown(links, links.written);
  mark(links.written, links.until, [P.link], 7);
  // 13 · the gallery: the web report; the cursor ticks Gallery View, every proof opens as a picture
  const gallery = say('gallery', next(links));
  B.webView = gallery.at;
  B.gallery = click(gallery.written, P.gallery);
  leave();
  B.rows = B.gallery + 0.25;
  acted(gallery, B.rows + M + 1.6);
  // 14 · the closing words, over the gallery: read, then the words go, then the picture
  const conclusion = say('conclusion', next(gallery));
  conclusion.until = conclusion.written + READ(conclusion.lines);
  B.end = next(conclusion);
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  // the layers on: the one a click or a new sentence went to comes in over the one before in `XF` s, the one before goes as it comes -> [{id, op}], the one under first
  const LAYERS = [{t: -Infinity, id: 'board'}, {t: B.open, id: 'audit'}, {t: B.fixView, id: 'flow-corrective'}, {t: B.openFix, id: 'corrective'}, {t: B.timeView, id: 'flow-time'},
    {t: B.followView, id: 'flow-followup'}, {t: B.trainView, id: 'flow-training'}, {t: B.openTrain, id: 'training'}, {t: B.kbView, id: 'board'}, {t: B.linkView, id: 'audit-links'}, {t: B.webView, id: 'web'}];
  function layersAt(t) {
    let i = 0;
    while (i + 1 < LAYERS.length && t >= LAYERS[i + 1].t) i++;
    const p = i ? prog(t, LAYERS[i].t, XF) : 1;
    return p < 1 ? [{id: LAYERS[i - 1].id, op: 1 - p}, {id: LAYERS[i].id, op: p}] : [{id: LAYERS[i].id, op: 1}];
  }
  const AUDIT_SCROLL = [{t: -Infinity, key: 'top'}, {t: B.open + 0.2, key: 'cp-0'}, {t: B.y0, key: 'cp-1'}, {t: B.y1, key: 'cp-2'}, {t: B.y2, key: 'cp-hazard'}];
  const TRAIN_SCROLL = [{t: -Infinity, key: 'top'}, {t: B.openTrain + M, key: 'cp-lesson'}, {t: B.quiz, key: 'quiz-lesson'}, {t: B.done, key: 'top'}];
  const step = (t, at) => prog(t, at, M);
  function stateAt(t) {
    return {
      layers: layersAt(t),
      // the board: the audits posted so far, each popping in as it is posted (0 to 1: how far it has popped: components/remotion/MotionBoard.jsx)
      board: {audits: [0, 1, 2, 3].filter(i => t >= B.post + i * POSTS).length, pops: Object.fromEntries(['North', 'South', 'East', 'West'].map((d, i) => [`audit-${d}`, clamp((t - (B.post + i * POSTS)) / 0.34)])), menu: t >= B.menu && t < B.item + 0.1, menuPop: prog(t, B.menu, 0.25) * (1 - prog(t, B.item + 0.1, 0.2)), kb: prog(t, B.kbShown, M), kbSince: Math.max(0, t - B.kbShown)},
      audit: {expand: prog(t, B.open, M), steps: (t >= B.y0) + (t >= B.y1) + (t >= B.y2), hazard: t >= B.attached ? 'done' : t >= B.addV ? 'rec' : t >= B.yesH ? 'ask' : 'none', scrollMix: scrollAt(AUDIT_SCROLL, t)},
      corrective: {grow: prog(t, B.openFix, M) * (1 - prog(t, B.fold, M)), watch: t >= B.played ? 4 : t >= B.play ? 2 : 0},
      // the cards that follow an audit: how far the card that pops is there (0 to 1)
      flows: {corrective: clamp((t - B.pop) / 0.34), followup: clamp((t - B.popFollow) / 0.34), training: clamp((t - B.popTrain) / 0.34)},
      // (the seconds since each card popped: its timer runs from 00:00:00 then)
      since: {corrective: Math.max(0, t - B.pop), followup: Math.max(0, t - B.popFollow), training: Math.max(0, t - B.popTrain)},
      training: {grow: prog(t, B.openTrain, M), training: t >= B.done ? 'done' : t >= B.quiz ? 'quiz' : t >= B.text ? 'text' : 'none', scrollMix: scrollAt(TRAIN_SCROLL, t)},
      links: {},
      web: {gallery: t >= B.gallery, rows: prog(t, B.rows, M), scroll: prog(t, B.rows + M + 0.3, 1.3)},
    };
  }

  // the seconds the board has run (its timers go by it) and the second, on it, each audit is posted (its timer starts at 00:00:00 there)
  const elapsedAt = t => Math.floor(Math.max(0, t - B.board));
  const runs = {born: Object.fromEntries(['North', 'South', 'East', 'West'].map((d, i) => [`audit-${d}`, Math.floor(B.post + i * POSTS - B.board)]))};
  return {
    words, layout: null, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt, elapsedAt, runs,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeAuditingCut = cutMaker(build);
