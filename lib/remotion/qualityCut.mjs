// Improved Quality, the Remotion cut (the user, 2026-11-05: "now work on a new variation improved quality same way we have increased efficiency with remotion etc.. same style as variation 4 increased
// efficiency"). It is the look `remotion` of lib/storyboardVariations.mjs on the board improved-quality-v2: on the All videos page that board then plays THIS film in Remotion's Player
// (components/StoryboardRemotionCut.jsx), and the Remotion project D:\Documents\Saas\videos renders it to an MP4 (composition IQ-Cut). The art is components/remotion/QualityCut.jsx: the product's own pieces
// (the tablet's board, the Knowledge Base, the mission "Mission Details" of the Improved Quality demo with its checklist, micro-training, photo and video proofs, the closed mission with its ratings,
// Business Proofs on the tablet and on a phone, the web Usage Report), each one placed and set by THIS file as a function of the time, so a frame is the same in the Player and in a render.
//
// Told as Increased Efficiency's cut is (lib/remotion/cutCore.mjs): the software has the picture, in its middle; the words are always in ONE band under it (the sentence centered and left-aligned, a thin
// line at its left and the chapter's label at the left of the line); a new scene opens on its words, written alone in the middle, then pulled down as its art comes in; the one speed (0.76 s, Easy Ease
// 70%); what is only shown is outlined in yellow, what is done happens by itself (no cursor); the words go before the picture changes. The board's words as they are (improved-quality-v2, the CEO's), each
// sentence on one or two longer lines for the band. The one exception: the mission is a big 9:16 panel at the left (the user, 2026-11-05: "should be a 9:16 ratio not as small as this"), so its words
// stand BESIDE it, on the board's own short lines; written in the middle, they glide to the right as the mission comes in from the left (`side`, cutCore.mjs).
// ONE thread: the SAME mission all the way, Opening Quality Check. The team works with the Knowledge Base at hand; the mission opens and shows what guides the work (instructions, an alert, a link, in
// Spanish too); it is done step by step, with a training in the middle of it and its proofs (a photo, a video); once closed it is rated by Anna herself, then by two peers; the managers see its proofs on
// the tablet, on a phone, on the web, who did it and when; the closing words show the mission (the guidance) beside its proofs (the oversight).
// VARIATION 4, THE LAYOUT 'ie': TOLD AS INCREASED EFFICIENCY IS NOW (the user, 2026-11-11, having worked Increased Efficiency's Variations 6 and 7 over: "now work on improve quality to be like
// increased efficiency"; the look `remotion-like-ie`; written, NOT played). The same film, the same mission, the same cursor and outlines; what changes is how it is told (`ie` in `build`):
//   - the words SLIDE (`story(words, {slide: true})`): the blue label comes in alone from the left, the white words are then written, the whole goes on to the right; the opening title is typed
//     where it stands (no yellow line under it, as Increased Efficiency's has none)
//   - a title and its action: the action starts the moment the title's last word is written, and words whose action has ended go `GONE` s after it; words that only show something (an
//     outline) keep the time they had to be read
//   - no scene opens on its words in the middle any more, and the scene changes are 30% faster (`TR`): the words slide out, the art there is goes in `TR`, the new art comes in in `TR` as its
//     label slides in (`scene`, `changes`, the cut's own `artAt`)
//   - the CEO's rule of 2026-11-09 ("no tablet (a phone, a display): the words NEXT TO it, moving up and down with what they are about; a tablet or a big board: the words at the bottom"): the
//     mission, a phone's 9:16 panel, has its nine sentences BESIDE it as Increased Efficiency's Variation 7 has them beside its missions (the blue label over the white words, each coming up
//     into its place as the one before goes up: `BESIDE`), the first written in the middle of the empty picture and gliding to the right as the mission comes in at its left; and each FOLLOWS
//     what it is about (`followOf`: the instructions, the alert, the link, the translate button, the Yes being ticked, the training, the proofs' checkpoints), up and down as the list scrolls.
//     The tablets, the ratings, the web report and the closing words keep their words in the band
//   - the art over the band has the same room over it as under it (`ART_DY`, cutCore.mjs: components/remotion/QualityCut.jsx draws it that much lower; the mission, which has no words under
//     it, stays in the middle of the picture's height), and the color behind the band's words is never drawn: nothing of this film goes behind them
// Pure: no React, no Remotion.
import {ANCHOR, ART_DY, BESIDE, CURSOR, CUT_FPS, CUT_H, CUT_W, M, OUT, POP, SLIDE, WORDS, clamp, cursorPlan, cutMaker, keyed, mix, prog, story} from './cutCore.mjs';
import {KNOWLEDGE, MICRO, MOTION as DEMO, QUIZ_ANSWERS} from '../improvedQualityV2Story.mjs';

export {CUT_FPS, CUT_H, CUT_W};
export const QUALITY_CUT_ID = 'IQ-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['IQ-Cut'])
export const IE_LAYOUT = 'ie';          // the layout told as Increased Efficiency is (Variation 4, the look `remotion-like-ie`)
export const QUALITY_IE_CUT_ID = 'IQ-Cut-IE'; // where ITS retyped words are kept (edits.cuts['IQ-Cut-IE']): it has words of its own, `IE_WORDS`
// THE WORDS OF THE LAYOUT 'ie', REWRITTEN (the user, 2026-11-11, of Variation 4: "can you rewrite the whole sentences to be better short and just like increased effeciency"; written, NOT
// played). Increased Efficiency's film says each thing as a BENEFIT in two words (the blue label: "Sense of urgency", "Measured execution", "Minimal downtime") and one plain sentence on two
// lines, about eight words, each word capitalized ("Execution Duration Is / Measured Per Mission"). These say the same things as the board's (the CEO's narration, which Variations 2 and 3
// still play) that way: a subject that does something, no "can be", no list. The longest, the proofs' three sentences in one, is one sentence now. {id: [label, lines]}; the title too.
// A text retyped on the page is kept apart from the other variations' (`QUALITY_IE_CUT_ID`).
const IE_TITLE = {lines: ['Teams Are Guided To Perform', 'With Quality & Precision'], mark: null};
const IE_WORDS = {
  knowledge: ['Knowledge at hand', ['Answers Are Always At Hand', 'While Teams Work']],
  // beside the mission: short lines
  instructions: ['Clear standards', ['Instructions Reinforce', 'Standards In Every Mission']],
  alerts: ['Risk awareness', ['Alerts Warn Teams', 'About Risks']],
  links: ['Extra resources', ['Links Open', 'Outside Resources']],
  translation: ['Any language', ['Missions Translate', 'Instantly']],
  steps: ['Guided execution', ['Work Is Guided', 'Step By Step']],
  micro: ['Training in context', ['Micro-Trainings Play', 'Right Inside The Work']],
  capture: ['Genuine proof', ['Photos & Videos Are Taken', 'Inside The Mission,', 'Never Stored Or Reused']],
  photo: ['Photo proof', ['Photos Document', 'Proper Standards']],
  video: ['Video proof', ['Videos Report', 'Real Conditions']],
  // in the band: two lines
  emphasis: ['Quality first', ['Every Closed Mission', 'Can Be Rated For Quality']],
  rate: ['Personal accountability', ['Each Person Rates', 'Their Own Work']],
  peer: ['Crowdsourced quality', ['Peers Rate', "Each Other's Work"]],
  visibility: ['Total visibility', ['Managers See Every Proof', 'In One Place']],
  mobile: ['Any device', ['The Same Proof Is On', 'Any Mobile Device']],
  tour: ['Documented evidence', ['Evidence Is Toured', 'With A Swipe']],
  web: ['Web gallery', ['The Web Shows It All', 'In Gallery View']],
  remote: ['Remote oversight', ['Conditions Are Toured', 'From Anywhere']],
  performer: ['Clear ownership', ['Each Proof Shows', 'Who Performed']],
  timestamp: ['Exact timing', ['And The Exact', 'Date & Time']],
  conclusion: ['Assured quality', ['Quality Is Assured By In-Mission', 'Guidance & Constant Oversight']],
};
// Its speeds, Increased Efficiency's (lib/remotion/efficiencyRedo.mjs `QUICK`, `GONE`): a scene change is 30% faster than a move, and words whose action has ended go 0.3 s after it
const QUICK = 1.3, TR = M / QUICK, GONE = 0.3;
export const TITLE_WORDS = {lines: ['Teams Are Constantly', 'Guided To Perform', 'With Quality & Precision'], mark: {words: ['Quality', '&', 'Precision'], kind: 'underline'}};
// The clips as the panels play them (components/ImprovedQualityV2Panels.jsx says when each one runs by these): Onboarding's video, the micro-training, the video proof (recorded, then played back)
export const CLIPS = {kb: KNOWLEDGE.clip, training: MICRO.clip, rec: DEMO.rec};

// ---- the product's data (the Improved Quality demo's: components/ImprovedQualityV2Demo.jsx) ----
// the Team Board of the start: three open, two claimed
export const BOARD_MISSIONS = [
  ...['Ice Maker Filter Check', 'Opening Quality Check', 'Equipment Inspection'].map((title, i) => ({id: `quality-${i}`, type: i === 1 ? 'Checklist' : 'Task', title, status: 'open', points: null, date: '08-02-26', time: '11:19 AM', ageSeconds: 10563 - i * 180})),
  ...[['Walk-In Cooler Temp Log', 'Checklist', 'Anna F', 734, 11412, '10:48 AM'], ['Restroom Cleaning', 'Task', 'Gabriel F', 1512, 12105, '10:37 AM']]
    .map(([title, type, performer, executionSeconds, ageSeconds, time], i) => ({id: `quality-claimed-${i}`, type, title, status: 'claimed', points: null, performer, executionSeconds, ageSeconds, date: '08-02-26', time})),
];
// Team A's board, where the managers look: three open, two claimed, four closed (Opening Quality Check, done and rated, among them)
const teamMission = (title, type, points, rest) => ({id: `emphasis-${title}`, title, type, points, date: '09-23-26', ...rest});
export const TEAM_A = [
  ...[['Walk-In Freezer Check', 'Checklist', 25, 4720], ['Hand Sink Restock', 'Task', 10, 4540], ['Grease Trap Inspection', 'Task', 20, 4360]].map(([title, type, points, ageSeconds]) => teamMission(title, type, points, {status: 'open', time: '03:05 PM', ageSeconds})),
  ...[['Dining Room Reset', 'Checklist', 25, 'Carla M', 412, 5020], ['Dish Machine Temp Log', 'Task', 10, 'Ben R', 268, 5240]].map(([title, type, points, performer, executionSeconds, ageSeconds]) => teamMission(title, type, points, {status: 'claimed', performer, executionSeconds, ageSeconds, time: '02:58 PM'})),
  ...[['Opening Quality Check', 'Checklist', 25, 'Anna F', 522, 4935, '04:12 PM'], ['Ice Maker Filter Check', 'Task', 20, 'Anna F', 190, 5102, '04:03 PM'], ['Fry Dispenser Cleaning', 'Checklist', 25, 'Gabriel F', 77, 4925, '11:51 AM'], ['Brew Coffee', 'Task', 10, 'Gabriel F', 23, 5111, '11:49 AM']]
    .map(([title, type, points, performer, executionSeconds, ageSeconds, time], i) => teamMission(title, type, points, {status: 'closed', stopped: 4 - i, performer, executionSeconds, ageSeconds, time, rateable: true})),
];
// the mission of the whole film, closed (the card that is rated)
export const RATED = {type: 'Checklist', points: 25, title: 'Opening Quality Check', performer: 'Anna F', date: '09-23-26', time: '04:12 PM', executionSeconds: 522, ageSeconds: 4935};
export const SELF = {initials: 'AF', name: 'Anna F.', score: 5, avatar: '/avatars/02.png'};
export const PEERS = [{initials: 'BR', name: 'Ben R.', score: 4, avatar: '/avatars/03.png'}, {initials: 'LT', name: 'Leo T.', score: 3, avatar: '/avatars/01.png'}];

// ---- where things are (stage px; the room for the art is over the band, about y 18 to 688) ----
// The tablet as the site draws it (.tbl-tablet, 1285 x 896 px, its frame from 47, 22, 1188 x 852): drawn 1000 px wide, scaled to `w`
export const TABLET = {w: 1285, h: 896, frame: {x: 47, y: 22, w: 1188, h: 852}};
export const tabletH = w => w * TABLET.h / TABLET.w;
export const FULL = {x: 300, y: 18, w: 1000};                                 // the tablet, whole, in the middle of the room
const sideW = 760, sideK = sideW / TABLET.w;
export const PHONE = {w: 236, ratio: 838 / 401, gap: 60};
const pairW = TABLET.frame.w * sideK + PHONE.gap + PHONE.w;                   // the tablet's frame and the phone, as one group in the middle
export const SIDE = {x: ANCHOR.x - pairW / 2 - TABLET.frame.x * sideK, y: ANCHOR.y - tabletH(sideW) / 2, w: sideW}; // at the left, smaller, the phone at its right
export const PHONE_AT = {x: ANCHOR.x + pairW / 2 - PHONE.w, y: ANCHOR.y - PHONE.w * PHONE.ratio / 2};
// The mission by itself: the demo's 360 px panel, 9:16 and big, nearly the picture's height (the user, 2026-11-05: "this here should be a 9:16 ratio not as small as this"), at the left; its words BESIDE
// it (a band under it would cover it): the sentence's left edge at SIDE_WORDS.x, its middle on the picture's middle, the label and its line at its left; mission and words centered as one
export const MISSION = {w: 360, h: 640, s: 1.35};
export const MISSION_AT = {x: 172, y: CUT_H / 2 - (MISSION.h * MISSION.s) / 2};
export const SIDE_WORDS = {x: 972, y: CUT_H / 2};
// The variation with the words UNDER the mission (the look `remotion-under`, the user, 2026-11-05: "add another variation with text under the 9:16 phone, but smaller phone to fit 9:16 ration"): the same
// 9:16 panel, smaller, in the middle of the room over the band, its words in the band like every scene's
// The layout 'ie': the big 9:16 mission and its words as ONE group in the middle of the picture, the words (the blue label over them) starting 90 px at its right. `hold`: how long the first
// sentence stays in the middle of the empty picture once written, before it glides to the right
export const MISSION_IE = {x: 272, y: CUT_H / 2 - (MISSION.h * MISSION.s) / 2, s: MISSION.s};
export const WORDS_IE = {x: MISSION_IE.x + MISSION.w * MISSION.s + 90, y: CUT_H / 2, hold: 0.15};
const underS = 1.03;
export const MISSION_UNDER = {x: ANCHOR.x - (MISSION.w * underS) / 2, y: ANCHOR.y - (MISSION.h * underS) / 2, s: underS};
// The mission's sentences: on the board's own short lines beside the big phone, on one or two longer lines in the band under the smaller one
const MISSION_LINES = {
  instructions: [['Add Instructions.', 'Reinforce Standards.'], ['Add Instructions.', 'Reinforce Standards.']],
  alerts: [['Alerts Can Be Included', 'To Warn About Risks'], ['Alerts Can Be Included', 'To Warn About Risks']],
  links: [['Add Links To', 'Outside Resources'], ['Add Links To Outside Resources']],
  translation: [['Instantly Translate', 'All Mission Content'], ['Instantly Translate All Mission Content']],
  steps: [['Executions Can Be', 'Guided Step-By-Step'], ['Executions Can Be Guided Step-By-Step']],
  micro: [['Micro-Trainings Are', 'Delivered In Context', 'Of Actual Work'], ['Micro-Trainings Are Delivered', 'In Context Of Actual Work']],
  capture: [['Photos Or Videos Can', 'Be Taken Within Missions', 'They Are Not Stored', 'On The Device And', 'Cannot Be Used In', 'Future Instances'],
    ['Photos Or Videos Can Be Taken Within Missions', 'They Are Not Stored On The Device', 'And Cannot Be Used In Future Instances']],
  photo: [['Photos Document', 'Proper Standards'], ['Photos Document Proper Standards']],
  video: [['Videos Report', 'Conditions'], ['Videos Report Conditions']],
};
export const STEP_SPOT = 105; // board px between the pinned summary and a step's Yes, every step (the demo's)
// The closed mission out of its board, its card 334 board px wide (its height with its ratings row about ISO_H): alone in the middle; up, the self rating under it; smaller, at the left, the peers' at its right
export const ISO = {card: 334, h: 156, self: 228, peers: {right: 625, bottom: 494}};
const isoBox = (w, groupW, groupH) => { const k = w / ISO.card; return {w, x: ANCHOR.x - (groupW * k) / 2, y: ANCHOR.y - (groupH * k) / 2}; };
export const ISO_AT = {alone: isoBox(500, ISO.card, ISO.h), self: isoBox(500, ISO.card, ISO.h + ISO.self), peer: isoBox(430, ISO.peers.right, ISO.peers.bottom)};
// The web report (the 1600 px page, cut to `h`), nearly edge to edge
export const REPORT = {x: 48, y: 22, page: 1600, h: 700, s: 1504 / 1600};
// The closing words: the mission (the guidance) and the tablet with its proofs (the oversight), side by side in the middle
const endMissionS = 1.0, endTabletW = 640, endK = endTabletW / TABLET.w, endW = MISSION.w * endMissionS + 56 + TABLET.frame.w * endK;
export const END = {mission: {x: ANCHOR.x - endW / 2, y: ANCHOR.y - (MISSION.h * endMissionS) / 2, s: endMissionS}, tablet: {x: ANCHOR.x - endW / 2 + MISSION.w * endMissionS + 56 - TABLET.frame.x * endK, y: ANCHOR.y - tabletH(endTabletW) / 2, w: endTabletW}};
// the outlines in a window that scrolls are cut to it
const IN_MISSION = '[data-rc-iq="mission"] .rc-iq-layer .iq2-m-window', IN_REPORT = '[data-rc-iq="report"] .iq-ur-window';
const inMission = key => `[data-rc-iq="mission"] .rc-iq-layer [data-iq-target="${key}"]`;

// The cursor (the user, 2026-11-05: "add a cursor to these animations"): the demos' yellow hand (public/demo-hand.png, its fingertip at `tip` of its w x h box), as in the storyboard videos
export const HAND = CURSOR; // (every cut's: lib/remotion/cutCore.mjs)
// what it presses, on the picture
const KB_MENU = '[data-rc-iq="kb-tablet"] .tbl-header [aria-label="Menu"]', KB_ITEM = '[data-rc-iq="kb-tablet"] .bn-menu-item:has(img[src="/board-icons/team-book.svg"])', KB_CARD = '[data-rc-iq="kb-tablet"] [data-iq-target="kb-type-2"]';
const TEAM_MENU = '[data-rc-iq="tablet"] .tbl-header [aria-label="Menu"]', TEAM_MEDIA = '[data-rc-iq="tablet"] [data-iq-target="business-media"]', TABLET_LIST = '[data-rc-iq="tablet"] .iq-bp-window';
const PHONE_SEL = '[data-rc-iq="phone"] .ph-phone', PHONE_LIST = '[data-rc-iq="phone"] .iq-bp-window';
const ISO_RATE = '[data-rc-iq="iso"] .chip-rate', ISO_KNOB = '[data-rc-iq="iso"] .iq2-rating--self .iq-rate-knob', ISO_SUBMIT = '[data-rc-iq="iso"] [data-iq-target="rate-submit"]', ISO_BADGES = '[data-rc-iq="iso"] .chip-ratings';
const GALLERY = '[data-rc-iq="report"] [data-iq-target="gallery-view"]', REPORT_WIN = '[data-rc-iq="report"] .iq-ur-window';
const NAME = i => `[data-rc-iq="report"] span:has(> [data-iq-target="web-name-${i}"])`, DATE = i => `[data-rc-iq="report"] [data-iq-target="web-date-${i}"]`;

// ---- the cut, made from its words ----
// words: {key: text} (lib/remotion/cutWords.mjs): a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`), its new scenes (`scenes`), `title`, its
// length (`seconds`, `frames`) and what each piece is at a time (`kbAt`, `missionAt`, `isoAt`, `cursorAt`, ...). `layout`: 'under' (the look `remotion-under`): the mission smaller, its words under it.
function build(words, {layout = null} = {}) {
  const under = layout === 'under', ie = layout === IE_LAYOUT; // (`ie`: told as Increased Efficiency is, the top of this file)
  const st = story(words, {title: ie ? IE_TITLE : TITLE_WORDS, slide: ie}), {B, captions, scenes, marks, title, mark} = st;
  // (the layout 'ie' says each thing in its own words, `IE_WORDS`; the others the board's, as each sentence below has them)
  const worded = (id, kicker, lines) => (ie && IE_WORDS[id] ? IE_WORDS[id] : [kicker, lines]);
  const say = (id, kicker, lines, at, opts) => st.say(id, ...worded(id, kicker, lines), at, opts);
  const sceneIn = (id, kicker, lines, out, gap, opts) => st.sceneIn(id, ...worded(id, kicker, lines), out, gap, opts);
  const next = c => (ie ? c.until + (c.beside ? BESIDE.out : SLIDE.out) : c.until + WORDS.out + 0.05); // the next sentence on the same art: once these words are gone
  const leaves = c => (ie ? next(c) : c.until + WORDS.out); // a scene's art starts to go: once its last words are gone
  const tail = s => (ie ? Math.min(s, GONE) : s);          // how long words stay once their ACTION has ended ('ie': never more than `GONE`)
  // A new scene. As it always was: `sceneIn` (its words in the middle, pulled down as its art comes in). 'ie': the art there is goes in `TR` from `out`, the new art comes in in `TR` from
  // `dark` as its label slides in; words beside the art that say `middle` are first written in the middle of the empty picture, then glide to their place as the art comes in (`moveAt`)
  const changes = [];
  const scene = (id, kicker, lines, out, gap, opts = {}) => {
    if (!ie) return sceneIn(id, kicker, lines, out, gap, opts);
    const c = say(id, kicker, lines, out + TR * (opts.beside?.middle ? 1 : 0.55), opts); // (words written in the middle: once the art there is has gone)
    c.dark = out + TR;
    if (c.beside?.middle) { c.beside.moveAt = c.written + WORDS_IE.hold; c.dark = c.beside.moveAt; }
    changes.push({out, dark: c.dark});
    return c;
  };
  // when the action of a sentence starts. 'ie': the moment its last word is written (a new scene's: its art in too; words written in the middle: once they are at their place)
  const after = c => (!ie ? st.after(c) : c.beside?.moveAt != null ? c.beside.moveAt + M : c.dark != null ? Math.max(c.written, c.dark + TR) : c.written);

  // The cursor's stops. It does what is done (a click, a drag, a swipe) and points at what is outlined (its fingertip at the outline's bottom right corner, the outline popping out of it then). Words
  // first: it sets off once they are written, glides at the one speed (M), and stays on a screen from one thing to the next; it comes in from the left of the words and fades out after the last thing
  // of a run, before the screen changes or a clip plays (`leave`). What it does starts at its click. (Every cut's since 2026-11-11: `cursorPlan`, lib/remotion/cutCore.mjs.)
  const {hand, click, point, swipe, drag, leave, finish: handDone} = cursorPlan();
  const settle = M - HAND.go; // (the cursor is quicker than a scroll or a glide: it waits for one that it goes with)

  // 1 · the Knowledge Base (a new scene): the Team Board; the cursor opens its menu, then the Knowledge Base, which comes in over the board, its cards one after the other; it opens Onboarding, whose video plays
  const kn = scene('knowledge', 'Knowledge Base', ['As Teams Work', 'Information Is Readily Available'], B.titleOut, 1);
  B.board = kn.dark;
  B.menu = click(after(kn), KB_MENU);
  B.kb = click(B.menu + 0.3, KB_ITEM);
  B.open = click(B.kb + 0.45, KB_CARD, {x: 0.82, y: 0.5}); // (the cards are all in by 0.92 s, before it gets there)
  leave();                                                  // (no cursor while the video plays)
  B.play = B.open + M;
  kn.until = B.play + CLIPS.kb + tail(0.5);
  mark(B.play + 0.15, kn.until, ['[data-iq-target="kb-video"]'], 7);

  // 2 · the mission by itself (a new scene): the cursor opens its card; what guides the work outlined one by one; in Spanish, and back
  // (`beside`: a getter, each sentence its own place; 'ie': the words beside the mission, the label over them, each one following what it is about)
  const ml = id => MISSION_LINES[id][under ? 1 : 0], missionBox = ie ? MISSION_IE : under ? MISSION_UNDER : {...MISSION_AT, s: MISSION.s};
  const besideOf = (middle = false) => (ie ? {beside: {x: WORDS_IE.x, y: WORDS_IE.y, moveAt: null, middle}} : under ? {} : {side: SIDE_WORDS});
  const where = {get beside() { return besideOf(); }};
  B.missionOut = leaves(kn);
  const ins = scene('instructions', 'Instructions', ml('instructions'), B.missionOut, undefined, besideOf(true));
  B.mission = ins.dark;
  B.expand = click(after(ins), inMission('mission-chip'), {x: 0.78, y: 0.55});
  B.insMark = point(B.expand + 0.3, inMission('instructions'), 7, IN_MISSION);
  ins.until = B.insMark + 1.3;
  mark(B.insMark, ins.until, [inMission('instructions')], 7, IN_MISSION);
  const al = say('alerts', 'Alerts', ml('alerts'), next(ins), where.beside);
  B.alMark = point(after(al), inMission('alert'), 6, IN_MISSION); al.until = B.alMark + 1.4;
  mark(B.alMark, al.until, [inMission('alert')], 6, IN_MISSION);
  const li = say('links', 'Links', ml('links'), next(al), where.beside);
  B.liMark = point(after(li), inMission('link'), 6, IN_MISSION); li.until = B.liMark + 1.4;
  mark(B.liMark, li.until, [inMission('link')], 6, IN_MISSION);
  const tr = say('translation', 'Translation', ml('translation'), next(li), where.beside);
  B.es = click(after(tr), inMission('translate'));
  B.en = click(B.es + 1.2, inMission('translate'));
  tr.until = B.en + M + 0.2;
  mark(B.es, B.en, [inMission('translate')], 6);
  // 3 · step by step: the list goes up to each question's Yes, which lands under the cursor, and it ticks it
  const sp = say('steps', 'Step by step', ml('steps'), next(tr), where.beside);
  B.steps = []; B.ticks = [];
  for (let i = 0; i < 3; i++) { B.steps.push(i ? B.ticks[i - 1] + 0.35 : after(sp)); B.ticks.push(click(B.steps[i] + settle, inMission(`yes-${i}`), {x: 0.22, y: 0.5})); }
  sp.until = B.ticks[2] + tail(0.9);
  // 4 · the micro-training: the cursor plays its tile, which opens into its video (no cursor while it plays); then it answers the quiz and sends it; both fold into a Done tile
  const mi = say('micro', 'Micro-training', ml('micro'), next(sp), where.beside);
  B.micro = after(mi);
  B.tile = click(B.micro + settle, inMission('training-play'));
  leave();
  B.train = B.tile + M;
  B.quiz = B.train + CLIPS.training + 0.1;
  B.answers = [];
  QUIZ_ANSWERS.forEach((o, i) => B.answers.push(click(i ? B.answers[i - 1] + 0.1 : B.quiz + settle + 0.1, inMission(`quiz-${i}-${o}`), {x: 0.2, y: 0.5})));
  B.submit = click(B.answers[2] + 0.1, inMission('quiz-submit'));
  leave();
  B.fold = B.submit + 0.35;
  B.done = B.fold + M;
  mi.until = B.done + 1.3;
  mark(B.done + 0.05, mi.until, [inMission('training-tile')], 6, IN_MISSION);
  // 5 · the proofs: the two checkpoints that ask for them; the cursor adds a photo; it answers No, so a video is asked for, and adds one: it is recorded and played back (no cursor then)
  const ca = say('capture', 'Proof', ml('capture'), next(mi), where.beside);
  B.capScroll = after(ca);
  B.capMark = point(B.capScroll + settle + 0.1, inMission('cp5'), 6, IN_MISSION);
  ca.until = B.capMark + 1.6;
  mark(B.capMark, ca.until, [inMission('cp5'), inMission('cp6')], 6, IN_MISSION);
  const ph = say('photo', 'Photo proof', ml('photo'), next(ca), where.beside);
  B.shot = click(after(ph), inMission('cp5'), {x: 0.3, y: 0.8}); // (where "Add photo" is: the photo takes its place at the click)
  B.phMark = point(B.shot + 0.3, inMission('photo-proof'), 6, IN_MISSION);
  ph.until = B.phMark + 1.3;
  mark(B.phMark, ph.until, [inMission('photo-proof')], 6, IN_MISSION);
  const vi = say('video', 'Video proof', ml('video'), next(ph), where.beside);
  B.vScroll = after(vi);
  B.no = click(B.vScroll + settle, inMission('no-5'), {x: 0.22, y: 0.5});
  B.vOpen = click(B.no + 0.45, inMission('cp6'), {x: 0.3, y: 0.86}); // (where "Add video" is)
  leave();
  B.record = B.vOpen + M;
  B.stop = B.record + CLIPS.rec;
  B.playback = B.stop + 0.3;
  vi.until = B.playback + CLIPS.rec + tail(0.6);
  mark(B.playback + 0.1, vi.until, [inMission('video-proof')], 6, IN_MISSION);
  const SCROLLS = [
    ...B.steps.map((at, i) => ({t: at, to: `yes-${i}`})),
    {t: B.micro, to: 'cp4'}, {t: B.quiz, to: 'training-quiz'}, {t: B.fold, to: 'cp4'},
    {t: B.capScroll, to: 'cp5'}, {t: B.vScroll, to: 'cp6'},
  ];

  // 6 · the ratings (a new scene): the mission, closed, alone in the middle; Anna rates it (the cursor presses Rate, drags the knob, sends it); then two peers rate it on their own, each badge on the card.
  // The purple lines are drawn out of the card to each rating as it comes (`lines`)
  B.missionGone = leaves(vi);
  const em = scene('emphasis', 'Quality', ['Quality Is Systematically Emphasized'], B.missionGone);
  B.iso = em.dark;
  B.emMark = point(after(em), ISO_RATE, 7); em.until = B.emMark + 1.3;
  mark(B.emMark, em.until, [ISO_RATE], 7);
  const ra = say('rate', 'Self-rating', ['Self-Ratings Encourage', 'Personal Accountability'], next(em));
  B.toSelf = click(after(ra), ISO_RATE);
  B.drag = drag(B.toSelf + 0.6, 1.6, ISO_KNOB); B.dragged = B.drag + 1.6;
  B.sent = click(B.dragged + 0.1, ISO_SUBMIT);
  B.selfBadge = B.sent + 0.3;
  B.raMark = point(B.selfBadge + 0.15, ISO_BADGES, 6);
  leave();
  ra.until = B.raMark + 1.3;
  mark(B.raMark, ra.until, [ISO_BADGES], 6);
  const pe = say('peer', 'Peer ratings', ['Peer Ratings Crowdsource', 'Quality Control'], next(ra));
  B.toPeer = after(pe);
  B.peers = PEERS.map((p, i) => { const at = B.toPeer + M * 0.6 + i * 1.7; return {...p, at, slide: at + 0.45, set: at + 1.35, rated: at + 1.6}; });
  pe.until = B.peers.at(-1).rated + 1.5;
  mark(B.peers.at(-1).rated + 0.35, pe.until, [ISO_BADGES], 6);

  // 7 · what the managers see (a new scene): Team A's tablet; the cursor opens its menu, then Business Media: Business Proofs comes in and it swipes through them; a phone joins, the same proofs; it swipes through them there
  B.isoGone = leaves(pe);
  const vis = scene('visibility', 'Visibility', ['Managers Enjoy Total Visibility'], B.isoGone);
  B.teamA = vis.dark;
  B.tMenu = click(after(vis), TEAM_MENU);
  B.proofs = click(B.tMenu + 0.3, TEAM_MEDIA);
  B.swipe1 = swipe(B.proofs + 0.3, 1.6, TABLET_LIST);
  vis.until = B.swipe1 + 1.6 + tail(0.5);
  const mo = say('mobile', 'Any device', ['From Any Mobile Device'], next(vis));
  B.split = after(mo);
  B.phoneMark = point(B.split + settle + 0.1, PHONE_SEL, 8);
  mo.until = B.phoneMark + 1.3;
  mark(B.phoneMark, mo.until, [PHONE_SEL], 8);
  const to = say('tour', 'Evidence', ['They Tour Documented Evidence'], next(mo));
  B.swipe2 = swipe(after(to), 2.2, PHONE_LIST);
  leave();
  to.until = B.swipe2 + 2.2 + tail(0.6);

  // 8 · the web (a new scene): the Usage Report; the cursor ticks Gallery View; it swipes through the photos; it points at who performed, then at what date and time
  B.devicesGone = leaves(to);
  const we = scene('web', 'Web report', ['From The Web', 'In Gallery View'], B.devicesGone);
  B.web = we.dark;
  B.gallery = click(after(we), GALLERY);
  we.until = B.gallery + 0.25 + M + tail(1.0);
  mark(B.gallery, B.gallery + 0.25 + M + 0.6, [GALLERY], 6);
  const re = say('remote', 'Remote tour', ['They Remotely Tour Conditions'], next(we));
  B.remote = swipe(after(re), 2.4, REPORT_WIN);
  re.until = B.remote + 2.4 + tail(0.5);
  const pf = say('performer', 'Who', ['Who Performed'], next(re));
  B.pfMark = point(after(pf), NAME(3), 6, IN_REPORT); pf.until = B.pfMark + 1.4;
  mark(B.pfMark, pf.until, [NAME(2), NAME(3)], 6, IN_REPORT);
  const ts = say('timestamp', 'When', ['At What Exact Date & Time'], next(pf));
  B.tsMark = point(after(ts), DATE(3), 6, IN_REPORT); ts.until = B.tsMark + 1.4;
  mark(B.tsMark, ts.until, [DATE(2), DATE(3)], 6, IN_REPORT);
  leave();

  // 9 · the closing words (a new scene): the mission and its proofs side by side; the guidance outlined, then the oversight (no cursor: it is only shown)
  B.webGone = leaves(ts);
  const end = scene('conclusion', 'The result', ['Execution Quality Is Assured', 'With In-Mission Guidance', 'And Constant Oversight'], B.webGone);
  B.recap = end.dark;
  B.guideMark = after(end); B.overMark = B.guideMark + 1.1;
  end.until = B.overMark + 1.8;
  mark(B.guideMark, end.until, ['[data-rc-iq="end-mission"]'], 8);
  mark(B.overMark, end.until, ['[data-rc-iq="end-tablet"] .tbl-screen'], 8);
  // the end: the words go, then the art; no logo
  B.end = leaves(end);
  B.total = B.end + M + 0.4;

  const told = st.finish(); // (what follows the time for the words, the new scenes, the title and the outlines: handed on whole, CutParts reads it)
  // 'ie': the art goes and comes at each scene change by itself (no words in the middle: `changes`), in `TR`; no color behind the band's words (nothing of this film goes behind them); and
  // what each sentence beside the mission follows: {a, b, p, within} (cutCore.mjs `BESIDE`). The steps follow the Yes being ticked: as the list goes up to the next one, the way from the last
  // Yes to the next, which stays at the one place every Yes lands on
  if (ie) {
    const FOLLOWS = {instructions: 'instructions', alerts: 'alert', links: 'link', translation: 'translate', micro: 'cp4', capture: 'cp5', photo: 'cp5', video: 'cp6'};
    told.artAt = t => { let a = {op: 1, x: 0, y: 0}; for (const s of changes) { if (t < s.out) break; a = {op: t < s.dark ? 1 - prog(t, s.out, TR) : prog(t, s.dark, TR), x: 0, y: 0}; } return a; };
    told.shadeAt = () => 0;
    told.followOf = (c, t) => {
      if (!c.beside) return null;
      if (c.id === 'steps') { let i = 0; while (i + 1 < B.steps.length && t >= B.steps[i + 1]) i++; return {a: inMission(`yes-${Math.max(0, i - 1)}`), b: inMission(`yes-${i}`), p: i ? prog(t, B.steps[i], M) : 1, within: null}; }
      return FOLLOWS[c.id] ? {a: inMission(FOLLOWS[c.id]), b: null, p: 1, within: IN_MISSION} : null;
    };
  }

  // ---- what each piece is at `t` (null: not there) ----
  const within = (t, from, to) => t >= from && t < to;
  // a board's menu: open from the click on its button until the cursor has left its item (where it set off from must still be there), seen from that click until the click on its item
  const menuOf = (t, opened, picked, gone) => ({menu: t >= opened && t < gone, menuPop: prog(t, opened, 0.3, OUT) * (1 - prog(t, picked, 0.25, OUT))});
  // the Team Board with its menu and the Knowledge Base over it: {elapsed (its timers, real time), menu, menuPop, kb: the panel's frame.kb}
  function kbAt(t) {
    if (!within(t, B.board, ins.dark)) return null;
    return {elapsed: Math.floor(t - B.board), ...menuOf(t, B.menu, B.kb, B.open), kb: {reveal: prog(t, B.kb, M), since: t - B.kb, viewer: prog(t, B.open, M), video: clamp(t - B.play, 0, CLIPS.kb), menuPop: 0}};
  }
  // where the mission's window is scrolled to: {from, to, p} (keys of its checkpoints; 'top')
  function scrollAt(t) {
    let from = 'top', to = 'top', p = 1;
    for (const k of SCROLLS) { if (t < k.t) break; from = to; to = k.to; p = prog(t, k.t, M); }
    return {from, to, p};
  }
  // what the mission shows: the panel's frame (StoryMission's: mission, steps, training, photo, video)
  function missionFrame(t, done = false) {
    const T = done ? Infinity : t;
    return {
      mission: {translated: false, clock: Math.floor(Math.max(0, t - B.mission))},
      steps: B.ticks.filter(at => T >= at).length,
      training: {video: prog(T, B.tile, M) * (1 - prog(T, B.fold, M)), seconds: done ? CLIPS.training : clamp(t - B.train, 0, CLIPS.training), quiz: prog(T, B.quiz, M) * (1 - prog(T, B.fold, M)),
        answers: B.answers.filter(at => T >= at).length, done: T >= B.done},
      photo: {taken: T >= B.shot, in: prog(T, B.shot, M), flash: done ? 0 : Math.max(0, 1 - Math.abs(t - B.shot - 0.05) / 0.15)},
      video: {answered: T >= B.no, box: prog(T, B.no + 0.1, 0.4, OUT), in: prog(T, B.vOpen, M), recording: T >= B.record && T < B.stop, rec: Math.floor(Math.min(B.stop, Math.max(B.record, T)) - B.record),
        attached: T >= B.stop, live: done ? 0 : Math.max(0, t - B.vOpen), playback: done ? CLIPS.rec : clamp(t - B.playback, 0, CLIPS.rec)},
    };
  }
  // the mission: its box, how far it is open (`expand`), its scroll, how Spanish it is (`es`: a Spanish panel comes over it and goes), its frame
  function missionAt(t) {
    if (!within(t, B.mission, em.dark)) return null;
    return {...missionBox, expand: prog(t, B.expand, M), scroll: scrollAt(t), es: prog(t, B.es, M) * (1 - prog(t, B.en, M)), frame: missionFrame(t)};
  }
  // the closed mission alone, then with its ratings: {x, y, w (its card's width on the stage), rating (IsoMission's frame.rating), ratings (the badges on the card), lines (how far each purple line is drawn:
  // the self one as Rate is pressed, each peer's just before its rating pops in, so the rating comes in at the end of its line)}
  const ISO_KEYS = [{t: 0, v: ISO_AT.alone}, {t: B.toSelf, v: ISO_AT.self}, {t: B.toPeer, v: ISO_AT.peer}];
  function isoAt(t) {
    if (!within(t, B.iso, vis.dark)) return null;
    const box = keyed(ISO_KEYS, t), badge = at => clamp((t - at) / 0.3);
    const self = {in: prog(t, B.toSelf + 0.3, M), value: 4 * prog(t, B.drag, B.dragged - B.drag), moved: t >= B.drag, sent: t >= B.sent};
    const peers = B.peers.map(p => ({...p, in: prog(t, p.at, M), value: (p.score - 1) * prog(t, p.slide, p.set - p.slide), moved: t >= p.slide, sent: t >= p.set}));
    const ratings = [...(t >= B.selfBadge ? [{...SELF, pop: POP(badge(B.selfBadge))}] : []), ...B.peers.filter(p => t >= p.rated).map(p => ({...p, pop: POP(badge(p.rated))})).reverse()];
    const lines = {self: prog(t, B.toSelf + 0.05, 0.5, OUT), peers: B.peers.map(p => prog(t, p.at - 0.3, 0.5, OUT))};
    return {...box, rating: {self, peers, shown: 1}, ratings, lines};
  }
  // Team A's tablet with its menu and Business Proofs, and the phone: {tab: {x, y, w}, elapsed, menu, menuPop, proofs: {in, scroll (with the cursor's swipes)}, phone: {x, y, op, pop} | null}
  const TEAM_KEYS = [{t: 0, v: FULL}, {t: B.split, v: SIDE}];
  function proofsAt(t) {
    if (!within(t, B.teamA, we.dark)) return null;
    const scroll = 0.4 * prog(t, B.swipe1, 1.6) + 0.6 * prog(t, B.swipe2, 2.2), c = clamp((t - (B.split + 0.25)) / 0.45);
    return {tab: keyed(TEAM_KEYS, t), elapsed: Math.floor(t - B.teamA), ...menuOf(t, B.tMenu, B.proofs, B.swipe1), proofs: {in: prog(t, B.proofs, M), scroll},
      phone: t >= B.split + 0.25 ? {...PHONE_AT, op: clamp(c / 0.6), pop: mix(0.9, 1, POP(c))} : null};
  }
  // the web report: UsageReport's `web` ({gallery, rows, scroll (with the cursor's swipe)})
  function webAt(t) {
    if (!within(t, B.web, end.dark)) return null;
    return {gallery: t >= B.gallery, rows: prog(t, B.gallery + 0.25, M), scroll: 0.93 * prog(t, B.remote, 2.4)};
  }
  // the closing words' two pieces: {op (they go after the last words), mission: {x, y, s, frame}, tablet: {x, y, w}}
  function endAt(t) {
    if (t < B.recap) return null;
    return {op: 1 - prog(t, B.end, M), mission: {...END.mission, frame: missionFrame(t, true)}, tablet: END.tablet, elapsed: Math.floor(t - B.teamA)};
  }

  // ---- the cursor at `t`: {op, from, to (where it goes from and to: a stop's spot {kind, target, anchor, pad, within, q}, or {entry: true}: the left of the words), p (how far, Easy Ease),
  // press (0 to 1: pressed), ripple: {spot, p} (a click's yellow ring)} or null. The picture says where a spot is (components/remotion/QualityCut.jsx measures it each frame). ----
  const cursorAt = handDone(); // (lib/remotion/cutCore.mjs `cursorPlan`)

  return {
    words, layout, fps: CUT_FPS, B, captions, scenes, title, ui: st.ui, marks, hand, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    artDy: ie ? ART_DY : 0, // (how much lower the art over the band is drawn: the same room over it as under it)
    ...told, kbAt, missionAt, isoAt, proofsAt, webAt, endAt, scrollAt, cursorAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeQualityCut = cutMaker(build);
// The cut with the board's words
export const DEFAULT_QUALITY_CUT = makeQualityCut();
export const QUALITY_CUT_SECONDS = DEFAULT_QUALITY_CUT.seconds, QUALITY_CUT_FRAMES = DEFAULT_QUALITY_CUT.frames;
