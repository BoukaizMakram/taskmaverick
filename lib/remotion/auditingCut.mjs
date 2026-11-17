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
import {CUT_FPS, CUT_H, CUT_W, M, SLIDE, clamp, cursorPlan, cutMaker, mix, prog, story, voiceOf} from './cutCore.mjs';
import {FULL} from './qualityCut.mjs';
import {PANEL as PANEL_AT, SIT, boardLayout, rideAt} from './sectionCore.mjs';

export {CUT_FPS, CUT_H, CUT_W};
export const AUDITING_CUT_ID = 'DA-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['DA-Cut'])
export const TITLE_WORDS = {lines: ['Audits Are Automatically Assigned', 'Exactly When Due'], mark: null};
export const TABLET = FULL;                                  // the tablet, whole, in the middle of the room (the same as Improved Quality's)
export const PANEL = PANEL_AT;                               // the mission, a 9:16 phone's panel (360 x 573) centered at x 800, y 372: over the band's straight edge (y 744) with its shadow
export const FLOW_DY = {corrective: -64, time: -64, followup: -39, training: -64}; // each group of cards moved up so the group is centered over the band; all of them +280 across (FLOW_DX)
export const FLOW_DX = 280;
export const FLOW_K = {corrective: 1.3, time: 1.3, followup: 1.1, training: 1.15}; // the cards are drawn this much bigger, about the middle of each group (x 520, y `FLOW_CY`): they were small over the picture; a group of two rows less, to stay between the picture's top and the band
export const FLOW_CY = {corrective: 436, time: 436, followup: 411, training: 436};
export const BOARD = {w: CUT_W, h: 744};                    // the web page, edge to edge over the band (as Live Oversight's)
export const RANGE = '09/22/2026 – 09/28/2026';
// WHAT THE AUDIT RAISES IS ONE TREE, AND THE CAMERA PANS OVER IT (the user, 2026-11-16, of this film: after "A Hazard Is Filmed On The Spot" it "should show answer yes on the right and the
// purple arrow coming from it to correct safety hazard and then move right to left to show next just like requesting maintenance", then "instead of just popping things, I want it to be
// like a camera paning for example in north building auditing the camera should move down as if like we are paning in the same tree"; written, NOT played). It was four screens of
// cards that cut from one to the next. Now the audit's panel STAYS OPEN and glides to the left, its Yes at the right (the trigger); the corrective mission pops at the right of that Yes,
// the purple arrow from the Yes to it; then the camera goes on: to the right (everything moves right to left, the audit off, fading) so the mission is in the middle, where it is opened
// and closed; DOWN to the follow-up audit under it, an arrow drawn down to it as the camera goes; then ON, RIGHT TO LEFT again, to the two trainings: the follow-up audit (North Building Audit-2) now at
// the left, the trainings branching at its right (the user, the same day: "show north building audit-2 to their left like pan right to left and show those missions branching"; they
// were first lower, on a trunk that came down from the Yes).
// Everything is placed in the tree's own space (stage px with the camera at rest); `stateAt(t).tree.cam` is how far the camera has gone.
const PW = 360 * PANEL.scale;
export const TREE = (() => {
  const k = 1.3, w = 334 * k, h = 129 * k, gap = 120, pad = 12, row = 150, x0 = 800 - (PW + gap + w) / 2; // the panel is seen from x0, a card `gap` at its right; `row`: between a card and the one under it
  const yes = 345;                                   // the level of the audit's Yes in the panel as it stands, its video attached (the middle of its row: 302 px under the panel's top as it is seen)
  const fix = {x: x0 + PW + gap, y: yes - h / 2}, follow = {x: fix.x, y: fix.y + h + row};
  const side = 150, split = 40;                        // the trainings: `side` at the right of the follow-up audit, one over and one under its level, `split` between them
  const train1 = {x: follow.x + w + side, y: follow.y + h / 2 - split / 2 - h}, train2 = {x: train1.x, y: follow.y + h / 2 + split / 2}, bus = follow.x + w + side / 2; // (`bus`: where the line out of the follow-up audit branches)
  const cx = fix.x + w / 2 - 800, mid = c => c.y + h / 2 - 372; // (the camera: the cards' column in the middle of the room)
  return {k, w, h, pad, yes, bus, panelLeft: x0 + (PW - 360) / 2, panelRight: x0 + PW, fix, follow, train1, train2,
    cam: {fix: {x: cx, y: mid(fix)}, follow: {x: cx, y: mid(follow)}, train: {x: follow.x + (2 * w + side) / 2 - 800, y: mid(follow)}}}; // (`train`: the follow-up audit and its two trainings in the middle of the room as one group)
})();
const POPS = 0.34;                                         // a card that pops in as the camera gets to it
// THE MISSION IS CLAIMED AND CLOSED (the user, 2026-11-16: "in Response Times Are Measured Per Mission show the mission go to claim wiht avatar then closed and then highlight"): the
// three sections of its board, only their tabs, the card under the one it is in; an avatar pops at the left of Open, takes the card to Claimed and sits on it, takes it to Closed, as in
// Requesting Maintenance (sectionCore `boardLayout`, `rideAt`; SectionParts `Tab`, `Rider`). The tabs and the avatar's seat are in the picture's own space: the camera is still then.
export const SECT = boardLayout({card: 'mission'});
export const SEAT = SECT.seat;

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
  fix: tg('tree', 'corrective'), play: tg('corrective', 'play-evidence'),
  exec: tg('tree', 'corrective-exec'), who: tg('tree', 'corrective-who'),
  followup: tg('tree', 'followup'), train1: tg('tree', 'training-1'), train2: tg('tree', 'training-2'), lesson: tg('training', 'play-lesson'),
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
// What the NARRATOR says, line by line (the layout `NARRATOR`, the look `remotion-narrator`; the user, 2026-11-16: "for all videos add a narrator style voice over variation ... the same
// video just with a narrator behind it instead of reading what's on screen", as Increased Efficiency's Variation 10): the screen shows the same words, the voice talks to the viewer about
// what is shown, in the second person. A sentence stays as long as the narrator talks (the voice sets the pace: lib/remotion/cutCore.mjs `story`). Change a line here, or retype it on the
// Titles panel ('<id>:voice'), then make the voice again (`npm run gen:voice -- --layout narrator`). Written, NOT played.
export const NARRATION = {
  title: "Audits shouldn't depend on someone remembering to do them.",
  posted: "Here, each audit is posted by itself, exactly when it's due.",
  guided: "The auditor is guided through it, one step at a time.",
  hazard: "Spot a hazard? Film it, right there.",
  corrective: "That one answer triggers a corrective mission, automatically.",
  evidence: "And the video goes with it, so whoever fixes it sees exactly what's wrong.",
  time: "From that moment, the response time is being measured.",
  followup: "Once it's fixed, a follow-up audit is assigned by itself, just to make sure.",
  trainings: "An issue can also trigger training, for everyone who needs it.",
  text: "It can be as simple as a written notice.",
  quiz: "With a short quiz, to confirm it was understood.",
  knowledge: "And while auditors work, the information they need is always at hand.",
  links: "Instructions can even link out to other resources.",
  gallery: "Later, you can tour all the evidence yourself.",
  conclusion: "So audits don't just find problems. They make sure the loop is closed.",
};
// `layout`: none, or `NARRATOR` (lib/remotion/cutCore.mjs): the same film with the narrator's voice
function build(words, {layout = null} = {}) {
  const st = story(words, {title: TITLE_WORDS, slide: true, ...voiceOf(AUDITING_CUT_ID, layout, NARRATION)}), {B, captions, mark} = st;
  const {hand, click, leave, finish: handDone} = cursorPlan();
  const say = (id, at) => st.say(id, SAYS[id][0], SAYS[id][1], at);
  const next = c => st.next(c);                                       // the next sentence: once these words have gone, and the titles added after them have been said (cutCore `story`)
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
  // 4 · the hazard triggers a mission: the audit stays open and glides to the left; the corrective mission pops at the right of its Yes, the purple arrow from the Yes to it, outlined
  const corrective = say('corrective', next(hazard));
  B.aside = corrective.at;
  B.pop = Math.max(corrective.written, B.aside + M);
  shown(corrective, B.pop + M);
  mark(B.pop + M, corrective.until, [P.fix], 6);
  // 5 · its evidence: the camera goes on (everything moves right to left: the audit off to the left, fading), the mission in the middle; the cursor opens it, then plays the video
  const evidence = say('evidence', next(corrective));
  B.pan = evidence.at;
  B.openFix = click(Math.max(evidence.written, B.pan + M), P.fix);
  leave();
  B.play = click(B.openFix + M + 0.5, P.play);
  leave();
  B.played = B.play + 0.9;
  B.toVideo = B.play + 0.15;                 // (the user, 2026-11-16: "here scroll down to show video": the panel scrolls down to the evidence, the video whole)
  acted(evidence, B.played + 1.1);
  // 6 · response time. The mission's panel folds back into its card WHILE the words before it go ("show that mission closing while The Video Goes With The Mission fades"); the three
  // sections' tabs come and the card glides under Open; an avatar pops at the left of Open, takes the card to Claimed and sits on it, takes it to Closed and sits again; THEN its
  // execution time and who did it are outlined
  B.fold = st.until(evidence);
  B.timeView = B.fold + M;
  const time = say('time', next(evidence));
  B.sections = Math.max(B.timeView, time.at);
  B.faceIn = Math.max(time.written, B.sections + M);
  B.faceGo = B.faceIn + 0.55;
  B.claim = B.faceGo + M + 0.3;
  B.settle = B.claim + M + 0.1;
  B.out = B.settle + SIT + 0.5;
  B.close = B.out + SIT + 0.1;
  B.rest = B.close + M + 0.1;
  B.rested = B.rest + SIT;
  each(time, B.rested + 0.15, [P.exec, P.who], 5);
  // 7 · a follow-up audit: the camera moves DOWN the tree, an arrow drawn down from the corrected mission as it goes; the follow-up audit pops under it as the camera gets there
  const followup = say('followup', next(time));
  B.unsect = followup.at;                    // (the tabs go and the closed mission glides back to its place in the tree, then the camera moves)
  B.down = Math.max(followup.written, B.unsect + M);
  B.popFollow = B.down + M * 0.55;
  shown(followup, B.popFollow + M);
  mark(B.popFollow + M, followup.until, [P.followup], 6);
  // 8 · micro-trainings: the camera goes on, right to left: the follow-up audit at the left now, a line out of it branching to the two trainings, which pop at its right
  const trainings = say('trainings', next(followup));
  B.across = trainings.written;
  B.popTrain = B.across + M * 0.55;
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
  B.end = st.last(conclusion); // (with the added titles that follow no sentence)
  B.total = B.end + TR + 0.3;

  const told = st.finish();
  told.artAt = t => ({op: prog(t, B.board, TR) * (1 - prog(t, B.end, TR)), x: 0, y: 0});
  const cursorAt = handDone();

  // ---- what the picture shows at `t` ----
  // the layers on: the one a click or a new sentence went to comes in over the one before in `XF` s, the one before goes as it comes -> [{id, op}], the one under first
  // ('tree': the audit's panel and all it raises, one layer the camera pans over; the corrective mission and the training open over it)
  const LAYERS = [{t: -Infinity, id: 'board'}, {t: B.open, id: 'tree'}, {t: B.openFix, id: 'corrective'}, {t: B.timeView, id: 'tree'},
    {t: B.openTrain, id: 'training'}, {t: B.kbView, id: 'board'}, {t: B.linkView, id: 'audit-links'}, {t: B.webView, id: 'web'}];
  function layersAt(t) {
    let i = 0;
    while (i + 1 < LAYERS.length && t >= LAYERS[i + 1].t) i++;
    const p = i ? prog(t, LAYERS[i].t, XF) : 1;
    return p < 1 ? [{id: LAYERS[i - 1].id, op: 1 - p}, {id: LAYERS[i].id, op: p}] : [{id: LAYERS[i].id, op: 1}];
  }
  const AUDIT_SCROLL = [{t: -Infinity, key: 'top'}, {t: B.open + 0.2, key: 'cp-0'}, {t: B.y0, key: 'cp-1'}, {t: B.y1, key: 'cp-2'}, {t: B.y2, key: 'cp-hazard'}];
  const FIX_SCROLL = [{t: -Infinity, key: 'top'}, {t: B.toVideo, key: 'cp-evidence'}, {t: B.fold, key: 'top'}]; // (down to the video once it plays; back as the panel folds)
  const TRAIN_SCROLL = [{t: -Infinity, key: 'top'}, {t: B.openTrain + M, key: 'cp-lesson'}, {t: B.quiz, key: 'quiz-lesson'}, {t: B.done, key: 'top'}];
  const step = (t, at) => prog(t, at, M);
  // The tree at `t`: how far the camera has gone (`cam`, px: everything is drawn that far up and to the left), where the audit's panel stands and how much it is seen, the cards (each pops
  // as the camera gets to it; `since`: the seconds since, its timer runs from 00:00:00; the corrective one `done` once its panel has folded), the arrow out of the Yes, and the lines
  // drawn as the camera goes down (`p` 0 to 1: how far each is drawn)
  function treeAt(t) {
    const aside = step(t, B.aside), pan = step(t, B.pan), d1 = step(t, B.down), d2 = step(t, B.across), T = TREE, c = T.cam;
    const sect = step(t, B.sections) * (1 - step(t, B.unsect)), claim = step(t, B.claim), close = step(t, B.close), claimed = t >= B.claim, closed = t >= B.close; // (the mission under Open, Claimed, Closed, then back in the tree)
    const left = mix(PANEL.left, T.panelLeft, aside), right = left - (PW - 360) / 2 + PW, popOf = at => clamp((t - at) / POPS), since = at => Math.max(0, t - at), mid = k => k.y + T.h / 2, cardX = T.fix.x + T.w / 2;
    return {
      cam: {x: c.fix.x * pan + (c.train.x - c.follow.x) * d2, y: c.fix.y * pan + (c.follow.y - c.fix.y) * d1 + (c.train.y - c.follow.y) * d2},
      audit: {left, top: PANEL.top, scale: PANEL.scale, op: 1 - pan},
      cards: [
        {id: 'corrective', x: mix(T.fix.x, SECT.colX(0) + c.fix.x + SECT.pitch * (claim + close), sect), y: mix(T.fix.y, SECT.cardY + c.fix.y, sect), k: mix(T.k, SECT.k, sect), pop: popOf(B.pop),
          claimed: t >= B.claim, closed: t >= B.close, exec: Math.max(0, Math.min(t, B.close) - B.claim), pill: Math.max(0, Math.min(t, B.close) - B.pop), moving: (claim > 0 && claim < 1) || (close > 0 && close < 1)},
        {id: 'followup', ...T.follow, k: T.k, pop: popOf(B.popFollow), since: since(B.popFollow)},
        {id: 'training-1', ...T.train1, k: T.k, pop: popOf(B.popTrain), since: since(B.popTrain)},
        {id: 'training-2', ...T.train2, k: T.k, pop: popOf(B.popTrain + 0.15), since: since(B.popTrain + 0.15)},
      ].filter(k => k.pop > 0),
      // the three sections' tabs (the picture's own space) and the avatar that takes the mission (SectionParts `Rider`)
      sections: {op: prog(t, B.sections, XF) * (1 - prog(t, B.unsect, XF)), y: SECT.tabY, k: SECT.k, list: [['Open', claimed ? 0 : 1], ['Claimed', claimed && !closed ? 1 : 0], ['Closed', closed ? 1 : 0]].map(([status, n], i) => ({status, n, x: SECT.colX(i)}))},
      face: rideAt(t, {in: B.faceIn, go: B.faceGo, settle: B.settle, out: B.out, rest: B.rest}),
      arrow: {id: 'raised', from: [right + T.pad, T.yes], to: [T.fix.x - T.pad, T.yes], op: clamp((t - B.pop) / 0.3) * (1 - pan)},
      lines: [
        {id: 'down', d: `M${cardX} ${T.fix.y + T.h + T.pad}L${cardX} ${T.follow.y - T.pad}`, end: [cardX, T.follow.y - T.pad], to: 'down', p: d1},
        {id: 'branch-1', d: `M${T.follow.x + T.w + T.pad} ${mid(T.follow)}L${T.bus} ${mid(T.follow)}L${T.bus} ${mid(T.train1)}L${T.train1.x - T.pad} ${mid(T.train1)}`, end: [T.train1.x - T.pad, mid(T.train1)], to: 'right', p: d2},
        {id: 'branch-2', d: `M${T.bus} ${mid(T.follow)}L${T.bus} ${mid(T.train2)}L${T.train2.x - T.pad} ${mid(T.train2)}`, end: [T.train2.x - T.pad, mid(T.train2)], to: 'right', p: prog(t, B.across + 0.15, M)},
      ].filter(l => l.p > 0.001),
    };
  }
  function stateAt(t) {
    return {
      layers: layersAt(t),
      // the board: the audits posted so far, each popping in as it is posted (0 to 1: how far it has popped: components/remotion/MotionBoard.jsx)
      board: {audits: [0, 1, 2, 3].filter(i => t >= B.post + i * POSTS).length, pops: Object.fromEntries(['North', 'South', 'East', 'West'].map((d, i) => [`audit-${d}`, clamp((t - (B.post + i * POSTS)) / 0.34)])), menu: t >= B.menu && t < B.item + 0.1, menuPop: prog(t, B.menu, 0.25) * (1 - prog(t, B.item + 0.1, 0.2)), kb: prog(t, B.kbShown, M), kbSince: Math.max(0, t - B.kbShown)},
      audit: {expand: prog(t, B.open, M), steps: (t >= B.y0) + (t >= B.y1) + (t >= B.y2), hazard: t >= B.attached ? 'done' : t >= B.addV ? 'rec' : t >= B.yesH ? 'ask' : 'none', scrollMix: scrollAt(AUDIT_SCROLL, t)},
      corrective: {grow: prog(t, B.openFix, M) * (1 - prog(t, B.fold, M)), watch: t >= B.played ? 4 : t >= B.play ? 2 : 0, scrollMix: scrollAt(FIX_SCROLL, t)},
      tree: treeAt(t),
      training: {grow: prog(t, B.openTrain, M), training: t >= B.done ? 'done' : t >= B.quiz ? 'quiz' : t >= B.text ? 'text' : 'none', scrollMix: scrollAt(TRAIN_SCROLL, t)},
      links: {},
      web: {gallery: t >= B.gallery, rows: prog(t, B.rows, M), scroll: prog(t, B.rows + M + 0.3, 1.3)},
    };
  }

  // the seconds the board has run (its timers go by it) and the second, on it, each audit is posted (its timer starts at 00:00:00 there)
  const elapsedAt = t => Math.floor(Math.max(0, t - B.board));
  const runs = {born: Object.fromEntries(['North', 'South', 'East', 'West'].map((d, i) => [`audit-${d}`, Math.floor(B.post + i * POSTS - B.board)]))};
  return {
    words, layout, fps: CUT_FPS, B, captions, scenes: [], marks: st.marks, hand, title: st.title, ui: st.ui, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, cursorAt, stateAt, elapsedAt, runs,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeAuditingCut = cutMaker(build);
