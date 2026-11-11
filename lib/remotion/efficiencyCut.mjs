// Increased Efficiency, the Remotion cut (the user, 2026-11-04, on the All videos page: "give me another variation of [All videos] in increased efficiency, use remotion for this variation, and
// just use our UI but everything should be changed to a way to convey message in a better way u think"). It is the look `remotion` of lib/storyboardVariations.mjs: on the All videos page the board
// increased-efficiency-v3 then plays THIS film in Remotion's Player instead of its slides (components/StoryboardRemotionCut.jsx), and the Remotion project D:\Documents\Saas\videos renders it to an MP4
// (composition IE-Cut). The art is components/remotion/EfficiencyCut.jsx: the product's own pieces (MissionChip, the tablet board, PhoneShell, the personal code panel, the team's faces, the picture
// of the three people), each one placed by THIS file as a function of the time, so a frame is the same in the Player and in a render.
//
// What it changes, to tell it better:
//  - ONE place for the eye (the user, 2026-11-04: "it feels like I have to look left right center"): the software has the whole picture, in its middle; the words are always in ONE band under it, a short
//    label (the chapter) at the LEFT of the sentence, the sentence left-aligned, the two centered as one (the user, 2026-11-05). Nothing is written at the left or the right of the software.
//  - A new scene opens on its words (the user, 2026-11-05: "when I introduce a new scene: show words in middle then pull down to show art"): the art there is goes, the words are written alone in the middle
//    of the picture, then they are pulled down to the band as the new art comes in, pulled down with them (`sceneIn`, `artAt`, `bandLift`; `INTRO`).
//  - ONE thread: the same missions go all the way. They are posted, two are lifted out to show what a mission carries (its schedule, its points, its timer), they go back, the one that turned red rises to the
//    top, it is claimed with a personal code and closed, then measured; the closing words are SHOWN, not only said: each person's shift with its idle gaps, the gaps close, another mission fits in the time won.
//  - Cause and effect in one picture: the mission whose timer goes red is the one that goes to the top; three phones go into the one tablet; the names on the closed missions become a count by each face.
//  - The narration's sentences as they are (the CEO's words), in the order of the story: the team taking initiative comes before what is measured.
//  - One speed, Increased Efficiency's (2026-10-30): a move is 0.76 s on After Effects' Easy Ease 70%; missions are posted 0.15 s apart, 0.34 s each; faces pop 0.09 s apart; the words come in word by word at the
//    pen's 30 letters a second, the action starts once they are written, and they go before the picture changes (2026-11-04).
// The words can be retyped (the user, 2026-11-05: a double-click on the All videos page; lib/remotion/cutWords.mjs): the whole cut is made from them, `makeCut(words)`, so a longer sentence takes longer to
// write and everything after it comes later; `makeCut()` is the cut with the narration's words.
// Pure: no React, no Remotion. What every cut shares (the motion, the band, the new scenes, the title, the outlines) is lib/remotion/cutCore.mjs, also exported from here.
import {ANCHOR, CUT_FPS, CUT_H, CUT_W, EASE, FACES, M, OUT, POP, POST, WORDS, clamp, clock, cutMaker, keyed, mix, prog, story} from './cutCore.mjs';
export {ANCHOR, BAND, CUT_FPS, CUT_H, CUT_W, EASE, FACES, INTRO, M, OUT, POP, POST, TITLE, WORDS, bezier, clamp, clock, keyed, mix, prog, wordsOf, writeTime} from './cutCore.mjs';

export const CUT_ID = 'IE-Cut'; // (its id in the Remotion project, and where its retyped words are kept: edits.cuts['IE-Cut'])
export const RISE = 1.03;                    // a mission that rises: pulled to the right, up beside the others, back in (a longer way at the same speed)
export const FOLLOW = 0.12;                  // the missions that make room start this much after the one that moves
export const INTO = 1.0;                     // from the picture of the three people into our tablet
export const GAP_CLOSE = 1.0;                // the idle gaps of a shift closing
export const COLORS = {seconds: 2, green: '#007a33', orange: '#ed7f04', red: '#bd1f59', gray: '#686f76'};
export const TITLE_WORDS = {lines: ['There Is No Need To', 'Micro-Manage People'], mark: {words: ['Micro-Manage'], kind: 'strike'}}; // the title, "Micro-Manage" struck through

// ---- the product's data ----
export const MISSIONS = {
  inv: {title: 'Inventory Check', kind: 'Checklist', points: 10, age: 480},
  ord: {title: 'Order Supplies', kind: 'Checklist', points: 15, age: 360},
  sig: {title: 'Safety Check', kind: 'Checklist', points: 20, age: 180},
  prep: {title: 'Prepare Workspace', kind: 'Task', points: 15, age: 120},
  desk: {title: 'Restock Front Desk', kind: 'Checklist', points: 10, age: 75},
  room: {title: 'Clean Break Room', kind: 'Task', points: 10, age: 50},
};
export const POINTS = ['inv', 'ord'];   // the two that get reward points (the CEO, 2026-10-28: "do only two of them with reward points")
export const SCHEDULES = {inv: ['Daily · 8:00 AM'], ord: ['Mon · 10:00 AM', 'Thu · 10:00 AM']};
export const PEOPLE = {
  adam: {name: 'Adam F', src: '/avatars/team-adam.png', code: '481592'},
  maya: {name: 'Maya R', src: '/avatars/team-maya.png', code: '736204'},
  ben: {name: 'Ben R', src: '/avatars/team-ben.png', code: '250817'},
};
export const TEAM = ['adam', 'maya', 'ben']; // their places at the left of the tablet, from the bottom
// every mission's name: the board's, and the ones only on a personal board (a name is the same wherever the mission is: one key, 'mission:<id>', retypes it everywhere)
export const MISSION_TITLES = {...Object.fromEntries(Object.entries(MISSIONS).map(([id, m]) => [id, m.title])),
  cash: 'Count The Cash Drawer', bins: 'Empty The Bins', counters: 'Wipe Down Counters', updates: 'Review Team Updates', lights: 'Check The Lights', plants: 'Water The Plants'};
export const BOARD_TITLES = {team: 'Team Board', personal: 'Personal Board'};
export const PHONES = [ // the personal boards (as components/sections/EfficiencyStage.jsx has them), by mission
  {who: 'adam', list: ['inv', 'ord', 'sig', 'cash']},
  {who: 'ben', list: ['prep', 'room', 'bins', 'counters']},
  {who: 'maya', list: ['desk', 'updates', 'lights', 'plants']},
];
export const PHOTO_SRC = '/storyboard-art/three-people.jpg';

// ---- where things are ----
// The tablet as the site draws it (.tbl-tablet, 1285 x 896 px, its screen at 92, 64, 1099 x 766; the flat black frame of the videos round it) and its board in board units (components/ReferenceBoard.css:
// 1080 units across the screen; columns 334 wide, 18 apart, from 21; the first card 150 under the screen's top, each 147 under the one before).
export const TABLET = {w: 1285, h: 896, screen: {x: 92, y: 64, w: 1099, h: 766}, frame: {x: 47, y: 22, w: 1188, h: 852, r: 36}};
export const UNIT = TABLET.screen.w / 1080;
export const CARD = {w: 334, h: 129};
export const BOARD = {col: c => 21 + c * 352, slot: i => 150 + i * 147, tabTop: 92, pitch: 352};
export const COLUMNS = ['open', 'claimed', 'closed'];
export const FULL = {x: 300, y: 18, w: 1000};              // the tablet, whole, in the middle of the room
export const SIDE = {x: 760.9, y: 136.9, w: 660};          // at the right, smaller, while three phones are at its left
const kOf = tab => tab.w / TABLET.w;
export const tabletH = w => w * TABLET.h / TABLET.w;
// the camera: the world point (fx, fy) is drawn at ANCHOR, `z` times as big
export const view = (cam, p) => ({x: (p.x - cam.fx) * cam.z + ANCHOR.x, y: (p.y - cam.fy) * cam.z + ANCHOR.y});
export function boardPoint(tab, bx, by) { const k = kOf(tab); return {x: tab.x + (TABLET.screen.x + bx * UNIT) * k, y: tab.y + (TABLET.screen.y + by * UNIT) * k}; }
// a card's place in a column: its top left on the stage and its scale (the card is drawn 334 px wide)
export function slotRect(tab, cam, col, slot) { const p = view(cam, boardPoint(tab, BOARD.col(COLUMNS.indexOf(col)), BOARD.slot(slot))); return {x: p.x, y: p.y, s: UNIT * kOf(tab) * cam.z}; }
const colMid = c => boardPoint(FULL, BOARD.col(c) + CARD.w / 2, 0).x;
const MID_Y = (boardPoint(FULL, 0, BOARD.tabTop).y + boardPoint(FULL, 0, BOARD.slot(3) + CARD.h).y) / 2;
const TABLET_MID = FULL.x + (TABLET.frame.x + TABLET.frame.w / 2) * kOf(FULL); // the middle of the tablet's frame, across
export const CAMS = {
  whole: {fx: ANCHOR.x, fy: ANCHOR.y, z: 1},
  open: {fx: TABLET_MID, fy: MID_Y, z: 1.35},  // closer, the tablet centered (the user, 2026-11-05: "center the tablet"), its Open column at the left: the priority
  code: {fx: ANCHOR.x, fy: MID_Y, z: 1.12},    // a little closer, the three columns still in: the codes
  closed: {fx: colMid(2), fy: MID_Y, z: 1.35}, // its Closed column: what each took, and who
};
// Two missions lifted out of the board: 1.55 times a board's card, in the middle (with their schedules beside them: the two together in the middle, so the cards glide to the left as the schedules come)
export const PAIR = {s: 1.55, gap: 18, beside: 28, schedW: 300};
const PAIR_H = CARD.h * PAIR.s * 2 + PAIR.gap * PAIR.s;
const PAIR_X = {alone: ANCHOR.x - CARD.w * PAIR.s / 2, beside: ANCHOR.x - (CARD.w * PAIR.s + PAIR.beside + PAIR.schedW) / 2};
// The three phones of the start (personal boards) and the three of "no device for each" (smaller, at the tablet's left)
export const PHONE_RATIO = 838 / 401;
export const START_PHONES = {w: 236, gap: 70, face: 84, top: 70}; // the faces over the phones, then the phones 12 under them
export const DEVICE_PHONES = {w: 150, gap: 30, face: 64, x: 205, top: 175};
export const startPhoneX = i => ANCHOR.x - (3 * START_PHONES.w + 2 * START_PHONES.gap) / 2 + i * (START_PHONES.w + START_PHONES.gap);
export const devicePhoneX = i => DEVICE_PHONES.x + i * (DEVICE_PHONES.w + DEVICE_PHONES.gap);
// The picture of the three people in the bounds of the tablet's frame (as the videos have it), and the tablet on its wall (its four corners in the picture's px: components/sections/EfficiencyStage.jsx `WALL_TABLET`)
export const PHOTO = {x: FULL.x + TABLET.frame.x * kOf(FULL), y: FULL.y + TABLET.frame.y * kOf(FULL), w: TABLET.frame.w * kOf(FULL), h: TABLET.frame.h * kOf(FULL), r: TABLET.frame.r * kOf(FULL), picture: {w: 1536, h: 1024}};
export const WALL = [[879.2, 118.6], [1211.8, 84.4], [1212.4, 400.9], [880.7, 401.8]];
const COVER = Math.max(PHOTO.w / PHOTO.picture.w, PHOTO.h / PHOTO.picture.h);
export const PHOTO_IMG = {w: PHOTO.picture.w * COVER, h: PHOTO.picture.h * COVER, x: (PHOTO.w - PHOTO.picture.w * COVER) / 2, y: (PHOTO.h - PHOTO.picture.h * COVER) / 2};
const wallBox = (() => { const xs = WALL.map(p => PHOTO.x + PHOTO_IMG.x + p[0] * COVER), ys = WALL.map(p => PHOTO.y + PHOTO_IMG.y + p[1] * COVER); return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}; })();
export const WALL_MID = {x: wallBox.x + wallBox.w / 2, y: wallBox.y + wallBox.h / 2};
const FRAME_MID = {x: PHOTO.x + PHOTO.w / 2, y: PHOTO.y + PHOTO.h / 2};
export const INTO_ZOOM = PHOTO.w / wallBox.w;
// The shifts of the end: each person's missions (green, as long as they took) and the idle gaps between them, in px of a lane 950 wide
export const SHIFT = {x: 400, w: 950, top: 223, pitch: 120, h: 48, gap: 12, faceX: 300, face: 64,
  rows: [{who: 'adam', blocks: [170, 120, 200, 140], gaps: [110, 90, 120], extra: 150}, {who: 'maya', blocks: [140, 190, 110, 170], gaps: [100, 130, 110], extra: 170}, {who: 'ben', blocks: [210, 100, 150, 130], gaps: [120, 140, 100], extra: 190}]};
// where a face sits at the left of the tablet (its place `i`, from the bottom)
export function seatRect(i, tab, cam) {
  const f = tab.w / FULL.w, size = 84 * f, k = kOf(tab);
  const p = view(cam, {x: tab.x + TABLET.frame.x * k - size - 18 * f, y: tab.y + (TABLET.screen.y + TABLET.screen.h) * k - size - i * (size + 10 * f)});
  return {x: p.x, y: p.y, size: size * cam.z};
}
const CODE = {go: 0.62, panel: 0.3, dot: 0.09, hold: 0.12, seat: 0.45};   // a claim or a close with the personal code
const QUEUE = {go: 0.55, seat: 0.3, stay: 0.4};                          // a mission taken with no code (the initiative): it stops only on the mission

// ---- the cut, made from its words ----
// words: {key: text} (lib/remotion/cutWords.mjs): a sentence's id, '<id>:kicker' or 'title' -> its lines ('\n'). -> the cut: its beats (`B`), its words (`captions`: {id, kicker, lines, at, written, until,
// down (a new scene's: when its words are pulled down from the middle), original: {kicker, lines}}, `title`), its new scenes (`scenes`), its length (`seconds`, `frames`) and what follows the time
// (`cardAt`, `faceAt`, `artAt`, ...).
function build(words) {
  // the band, the new scenes, the title and the outlines (lib/remotion/cutCore.mjs `story`): a new scene (the user, 2026-11-05: "when I introduce a new scene: show words in middle then pull down to
  // show art") is `sceneIn`: its art is put in its place unseen at `dark`, every change of a piece there at once (dur 0), and comes in as the words are pulled down
  const st = story(words, {title: TITLE_WORDS}), {B, captions, scenes, marks, title, say, sceneIn, after, mark, named} = st;
  const events = [], faces = {adam: [], maya: [], ben: []}, turns = [];
  const face = (who, seg) => faces[who].push(seg);
  const go = (id, t, to, who) => events.push({t, id, type: 'go', to, who});
  // the texts of the UI, retyped or as the product has them (one line each; they change no beat): `st.ui` {key: {value, original}}
  const names = {
    mission: Object.fromEntries(Object.entries(MISSION_TITLES).map(([id, title]) => [id, named(`mission:${id}`, title)])),
    schedules: Object.fromEntries(Object.entries(SCHEDULES).map(([id, list]) => [id, list.map((text, i) => named(`schedule:${id}:${i}`, text))])),
    person: Object.fromEntries(Object.entries(PEOPLE).map(([who, p]) => [who, named(`person:${who}`, p.name)])),
    board: Object.fromEntries(Object.entries(BOARD_TITLES).map(([id, title]) => [id, named(`board:${id}`, title)])),
  };

  // (the title: `title`, its beats B.title, B.mark, B.titleOut)
  // 1 · assigned to individuals: three personal boards, four missions on each, a round at a time (a new scene: its words once the title is gone)
  const ind = sceneIn('individuals', 'Automatic assignment', ['Work Missions Can Be Automatically', 'Assigned To Individuals'], B.titleOut, 1);
  B.phonesIn = ind.dark;
  B.postPhones = after(ind);
  ind.until = B.postPhones + 11 * POST.each + POST.fade + 0.6;
  B.phonesOut = ind.until + WORDS.out;
  // 2 · or to teams: the team board (a new scene), the team pops at its left with the board's four missions
  const team = sceneIn('teams', 'Team boards', ['Or To Teams On Team Boards'], B.phonesOut);
  B.phonesGone = B.tabletIn = team.dark;
  B.team = after(team);
  ['inv', 'ord', 'sig', 'prep'].forEach((id, i) => events.push({t: B.team + i * POST.each, id, type: 'post'}));
  team.until = B.team + 3 * POST.each + POST.fade + 0.55;
  // 3 · what a mission carries: the two top missions alone, in the middle (a new scene: the tablet goes): their schedules, their points, the lower one's timer through the colors
  B.lift = team.until + WORDS.out;
  const sched = sceneIn('schedule', 'Schedules', ['Each Mission Has A Unique Schedule'], B.lift);
  B.alone = sched.dark;
  B.sched = after(sched);
  B.schedMark = B.sched + 2 * POST.each + POST.fade;
  sched.until = B.schedMark + 1.1;
  B.schedOut = sched.until; // the schedules go with the words, the cards glide back to the middle
  mark(B.schedMark, sched.until, ['[data-rc-sched="inv"]', '[data-rc-sched="ord"]']);
  const pts = say('points', 'Reward points', ['Reward Points Can Be Added', 'To Increase Motivation'], sched.until + WORDS.out + 0.05);
  B.points = after(pts);
  B.pointsMark = B.points + POST.each + POST.fade + 0.1;
  pts.until = B.pointsMark + 1.1;
  mark(B.pointsMark, pts.until, ['[data-rc-card="inv"] .chip-points', '[data-rc-card="ord"] .chip-points'], 7);
  const urg = say('urgency', 'Urgency', ['Timer Colors Create', 'A Sense Of Urgency'], pts.until + WORDS.out + 0.05);
  B.urgency = after(urg);
  B.colors = B.urgency + 0.3; // Order Supplies' timer: time goes by, green, orange, red (Inventory Check stays green)
  urg.until = B.colors + COLORS.seconds + 0.7;
  mark(B.urgency, urg.until, ['[data-rc-card="ord"] .chip-pill'], 7);
  // 4 · priority: the tablet again (a new scene), closer and centered, the two missions back in their places; the red one rises to the top, then an orange one above the green
  B.back = urg.until + WORDS.out;
  const pri = sceneIn('priority', 'Priority', ['Critical Work Is', 'Automatically Prioritized'], B.back);
  B.board = pri.dark;
  B.rise1 = after(pri);
  events.push({t: B.rise1, id: 'ord', type: 'rise', index: 0});
  B.orange = B.rise1 + RISE + 0.15;
  B.rise2 = B.orange + 0.3;
  events.push({t: B.rise2, id: 'sig', type: 'rise', index: 1});
  B.priMark = B.rise2 + RISE + 0.15;
  pri.until = B.priMark + 1.0;
  mark(B.priMark, pri.until, ['[data-rc-card="ord"] .chip', '[data-rc-card="sig"] .chip'], 7);
  // 5 · one shared device: the picture of the three people (a new scene); into the tablet on its wall, ours coming in on it; then three phones go into the one tablet, their people stay at its left
  B.photo = pri.until + WORDS.out;
  const share = sceneIn('shared', 'One device', ['A Whole Team Can Share', 'One Single Device'], B.photo);
  B.photoIn = share.dark;
  share.until = after(share) + 1.0;
  B.into = share.until + WORDS.out;
  B.intoDone = B.into + INTO;
  const own = say('device', 'One device', ['There Is No Need To Provide', 'Each Person With Their Own Device'], B.intoDone + 0.15);
  B.side = after(own);
  B.merge = B.side + M + 0.55;
  B.center = B.merge + 2 * 0.12 + M;
  own.until = B.center + M + 0.4;
  TEAM.forEach(who => {
    const i = PHONES.findIndex(p => p.who === who), seat = TEAM.indexOf(who);
    face(who, {t: B.team + seat * FACES, mode: 'seat', fade: 'pop', fadeDur: 0.3});
    face(who, {t: B.photoIn, mode: 'away'});
    face(who, {t: B.side + 0.2 + i * FACES, mode: 'phone', phone: i, fade: 'pop', fadeDur: 0.3});
    face(who, {t: B.merge + i * 0.12, mode: 'seat'});
  });
  // 6 · personal codes: Adam claims the red one, Maya the orange one, Adam closes his
  const code = say('code', 'Personal codes', ['Each Person Uses A Unique Code', 'To Claim And To Close Missions'], own.until + WORDS.out + 0.02);
  B.codeCam = code.at;
  const codeTurn = (who, id, action, at, fromSpot) => {
    const r = {who, id, action, at, reach: at + CODE.go};
    r.panel = r.reach - 0.12; r.dots = r.panel + CODE.panel; r.typed = r.dots + 6 * CODE.dot; r.gone = r.typed + CODE.hold; r.move = r.gone + 0.1;
    if (fromSpot) face(who, {t: at, mode: 'spot', card: id, dur: 0, fade: 'show'});
    face(who, {t: at, mode: 'edge', card: id, dur: CODE.go});
    if (action === 'Claim') face(who, {t: r.move + M, mode: 'spot', card: id, dur: CODE.seat});
    else { face(who, {t: r.gone, mode: 'edge', card: id, fade: 'out', fadeDur: 0.25}); face(who, {t: r.gone + 0.3, mode: 'seat', fade: 'in', fadeDur: 0.4}); }
    go(id, r.move, action === 'Claim' ? 'claimed' : 'closed', who);
    turns.push(r);
    return r;
  };
  const a1 = codeTurn('adam', 'ord', 'Claim', after(code));
  const m1 = codeTurn('maya', 'sig', 'Claim', a1.move + 0.35);
  const a2 = codeTurn('adam', 'ord', 'Close', m1.move + 0.4, true);
  code.until = a2.move + M + 0.7;
  // 7 · the team takes initiative: two more missions are posted, an hour goes by (the timers run fast), each one takes a mission and closes it with no one telling them
  B.more = code.until + WORDS.out;
  B.morePost = B.more + 0.3;
  events.push({t: B.morePost, id: 'desk', type: 'post'}, {t: B.morePost + POST.each, id: 'room', type: 'post'});
  const init = say('initiative', 'Initiative', ['Teams Are Constantly Guided', 'To Take Initiatives On Their Own'], B.morePost + POST.each + POST.fade + 0.1);
  B.lapse = after(init);
  const queueTurn = (who, id, at) => {
    const r = {who, id, at, move: at + QUEUE.go - 0.06};
    r.landed = r.move + M; r.close = r.landed + QUEUE.seat + QUEUE.stay; r.closed = r.close + M;
    face(who, {t: at, mode: 'edge', card: id, dur: QUEUE.go});
    face(who, {t: r.landed, mode: 'spot', card: id, dur: QUEUE.seat});
    face(who, {t: r.close, mode: 'spot', card: id, fade: 'out', fadeDur: 0.3});
    face(who, {t: r.close + 0.3, mode: 'seat', fade: 'in', fadeDur: 0.4});
    go(id, r.move, 'claimed', who); go(id, r.close, 'closed', who);
    return r;
  };
  const closeTurn = (who, id, at) => { // already claimed: it goes to Closed, the face leaves the card and is back in its place
    face(who, {t: at, mode: 'spot', card: id, fade: 'out', fadeDur: 0.3});
    face(who, {t: at + 0.3, mode: 'seat', fade: 'in', fadeDur: 0.4});
    go(id, at, 'closed', who);
    return {who, id, at, closed: at + M};
  };
  const q1 = queueTurn('ben', 'inv', B.lapse);
  const q2 = closeTurn('maya', 'sig', q1.close + M + 0.15);
  const q3 = queueTurn('adam', 'desk', q2.at + 0.5 - QUEUE.go + 0.06); // (his mission lands in Claimed once Maya's has mostly left it)
  B.lapseEnd = q3.closed;
  init.until = q3.closed + 0.6;
  // 8 · durations: closer on Closed, the rest dimmed, what each one took outlined
  B.closedCam = init.until + WORDS.out;
  const dur = say('duration', 'Durations', ['Each Execution Duration', 'Is Measured'], B.closedCam + M * 0.6);
  B.durMarks = after(dur);
  dur.until = B.durMarks + 1.4;
  mark(B.durMarks, dur.until, ['desk', 'sig', 'inv', 'ord'].map(id => `[data-rc-card="${id}"] .chip-exec`), 7);
  // 9 · the best performers: who did each outlined; back to the whole tablet, how many each one closed by their face, the best one lit
  const perf = say('performers', 'Performers', ['The Best Performers', 'Are Easily Recognized'], dur.until + WORDS.out + 0.02);
  B.nameMarks = after(perf);
  B.rank = B.nameMarks + 1.2;
  B.badges = B.rank + M;
  perf.until = B.badges + 3 * FACES + POST.fade + 1.3;
  mark(B.nameMarks, B.rank + M * 0.5, ['desk', 'sig', 'inv', 'ord'].map(id => `[data-rc-card="${id}"] .chip-who`), 7);
  // 10 · the result: each person's shift with its idle gaps (a new scene: its missions pop as it comes in); the gaps close; the time won back outlined; another mission fits in it
  B.track = perf.until + WORDS.out;
  const end = sceneIn('result', 'The result', ['Efficiency Increases', 'By Reducing Downtime', 'Between Tasks'], B.track);
  B.shiftIn = end.dark;
  B.blocks = end.down + 0.15;
  B.closeGaps = Math.max(after(end), B.blocks + (SHIFT.rows.length - 1) * FACES + 3 * 0.06 + POST.fade + 0.15);
  B.saved = B.closeGaps + GAP_CLOSE + 2 * 0.1 + 0.15;
  B.extra = B.saved + 0.5;
  end.until = B.extra + 2 * POST.each + POST.fade + 1.4;
  mark(B.saved, end.until, ['[data-rc-saved]'], 6);
  // the end: the words go, then the shifts; no logo (the user, 2026-11-05: "remove the logo at the end of the video")
  B.end = end.until + WORDS.out;
  B.total = B.end + M + 0.4;
  for (const list of Object.values(faces)) list.sort((a, b) => a.t - b.t);

  // ---- the board: where each mission is, as the story moves it ----
  // The board is played as events (posted at the bottom of Open, a mission goes to the TOP of its new column, a rise goes to a place in its own column); every mission whose place changes gets a key:
  // the one that moves at the event's time, the ones that make room FOLLOW after. -> tracks {id: [{t, place: {col, slot} | {pair}, kind}]}, life {id: {posted, claimed, closed, who}}, counts [{t, open, claimed, closed}]
  const board = (() => {
    const cols = {open: [], claimed: [], closed: []}, tracks = {}, life = {}, counts = [{t: -1, open: 0, claimed: 0, closed: 0}];
    const where = () => { const out = {}; for (const c of COLUMNS) cols[c].forEach((id, i) => { out[id] = {col: c, slot: i}; }); return out; };
    for (const e of [...events].sort((a, b) => a.t - b.t)) {
      const before = where();
      if (e.type === 'post') { cols.open.push(e.id); life[e.id] = {posted: e.t}; }
      else {
        const from = before[e.id].col;
        cols[from].splice(cols[from].indexOf(e.id), 1);
        if (e.type === 'rise') cols[from].splice(e.index, 0, e.id);
        else { cols[e.to].unshift(e.id); if (e.to === 'claimed') Object.assign(life[e.id], {claimed: e.t, who: e.who}); if (e.to === 'closed') Object.assign(life[e.id], {closed: e.t, who: life[e.id].who ?? e.who}); }
      }
      const now = where();
      for (const [id, b] of Object.entries(now)) {
        const a = before[id];
        if (!a) { tracks[id] = [{t: e.t, place: b, kind: 'post'}]; continue; }
        if (a.col === b.col && a.slot === b.slot) continue;
        const mine = id === e.id;
        tracks[id].push({t: mine ? e.t : e.t + (e.type === 'rise' ? 0.13 : FOLLOW), place: b, kind: mine ? (e.type === 'rise' ? 'rise' : 'move') : 'shift'});
      }
      counts.push({t: e.t, open: cols.open.length, claimed: cols.claimed.length, closed: cols.closed.length});
    }
    // the two missions alone in the middle, then back where they were (nothing moves them on the board meanwhile): both at once, unseen (each is a new scene)
    POINTS.forEach((id, i) => {
      const tr = tracks[id], was = tr.filter(k => k.t <= B.lift).at(-1).place;
      tr.push({t: B.alone, place: {pair: i}, kind: 'jump'}, {t: B.board, place: was, kind: 'jump'});
      tr.sort((a, b) => a.t - b.t);
    });
    return {tracks, life, counts};
  })();
  const LIFE = board.life;
  const countsAt = t => board.counts.filter(c => c.t <= t).at(-1);

  // ---- what follows the time ----
  // (the band, the new scenes, the title, the outlines: what follows the time for them is the story's)
  const told = st.finish(); // (handed on whole: CutParts reads artAt, bandLift, slideAt, shadeAt, captionAt, marksAt, titleAt; the page sceneAt, textOf)
  // the tablet's place: each change at a new scene is at once, unseen (`artAt`)
  const TAB_KEYS = [
    {t: 0, v: {...FULL, op: 0}},
    {t: B.tabletIn, v: {...FULL, op: 1}, dur: 0},
    {t: B.alone, v: {...FULL, op: 0}, dur: 0},
    {t: B.board, v: {...FULL, op: 1}, dur: 0},
    {t: B.photoIn, v: {...FULL, op: 0}, dur: 0},
    {t: B.intoDone, v: {...FULL, op: 1}, dur: 0},
    {t: B.side, v: {...SIDE, op: 1}},
    {t: B.center, v: {...FULL, op: 1}},
    {t: B.shiftIn, v: {...FULL, op: 0}, dur: 0},
  ];
  // The tablet: {x, y, w (its width in the world), op}. Coming out of the picture it is ON the tablet of the wall and grows with the zoom (`photoAt`).
  function tabletAt(t) {
    if (t >= B.into && t < B.intoDone) {
      const p = clamp((t - B.into) / INTO), e = EASE(p), z = INTO_ZOOM ** e, c = {x: mix(WALL_MID.x, FRAME_MID.x, e), y: mix(WALL_MID.y, FRAME_MID.y, e)};
      const w = (PHOTO.w / INTO_ZOOM) * z * (TABLET.w / TABLET.frame.w), k = w / TABLET.w, fx = (TABLET.frame.x + TABLET.frame.w / 2) * k, fy = (TABLET.frame.y + TABLET.frame.h / 2) * k;
      return {x: c.x - fx, y: c.y - fy, w, op: clamp(p / 0.35)};
    }
    return keyed(TAB_KEYS, t);
  }
  // The picture: its push in to the wall's tablet (the scale and the move of the image in its frame) and how much it is seen
  function photoAt(t) {
    const op = t >= B.photoIn && t < B.intoDone ? 1 : 0; // (it comes in with the art: `artAt`)
    const e = EASE(clamp((t - B.into) / INTO)), z = INTO_ZOOM ** e;
    return {op, z, dx: e * (FRAME_MID.x - WALL_MID.x), dy: e * (FRAME_MID.y - WALL_MID.y), origin: {x: WALL_MID.x - PHOTO.x - PHOTO_IMG.x, y: WALL_MID.y - PHOTO.y - PHOTO_IMG.y}};
  }
  const CAM_KEYS = [
    {t: 0, v: CAMS.whole},
    {t: B.board, v: CAMS.open, dur: 0},    // (the tablet is not seen then: it comes in already close)
    {t: B.photoIn, v: CAMS.whole, dur: 0}, // (nor then)
    {t: B.codeCam, v: CAMS.code},
    {t: B.more, v: CAMS.whole},
    {t: B.closedCam, v: CAMS.closed},
    {t: B.rank, v: CAMS.whole},
  ];
  const cameraAt = t => keyed(CAM_KEYS, t);
  // how dark what is not looked at is (the durations: all but Closed)
  const dimAt = t => prog(t, B.closedCam, M) * (1 - prog(t, B.rank, M));
  const frameCtx = t => ({tab: tabletAt(t), cam: cameraAt(t)});

  // a timer's own clock: real time, faster where time is made to go by (Order Supplies' colors; the hour of the initiative)
  const WARPS = [{from: B.colors, to: B.colors + COLORS.seconds, rate: 60, ids: ['ord']}, {from: B.lapse, to: B.lapseEnd, rate: 240}];
  const clockAt = (id, t) => t + WARPS.reduce((s, w) => (!w.ids || w.ids.includes(id) ? s + (w.rate - 1) * clamp(t - w.from, 0, w.to - w.from) : s), 0);
  function toneAt(id, t) {
    if (id === 'ord') return t < B.colors + COLORS.seconds / 3 ? 'green' : t < B.colors + COLORS.seconds * 2 / 3 ? 'orange' : 'red';
    if (id === 'sig') return t < B.orange ? 'green' : 'orange';
    return 'green';
  }
  // the timer pill pops ONCE as its color goes (up, the colors, down)
  function pillPopAt(id, t) {
    const up = 0.3, grow = 0.16;
    if (id === 'ord') return 1 + grow * (prog(t, B.colors - up / 2, up) - prog(t, B.colors + COLORS.seconds - up / 2, up));
    if (id === 'sig') return 1 + grow * (prog(t, B.orange - up / 2, up) - prog(t, B.orange + 0.45, up));
    return 1;
  }
  // the schedules beside the lifted missions: how much they are in (the cards glide to the left as they come, back to the middle as they go)
  const schedOn = t => prog(t, B.sched - 0.05, M) - prog(t, B.schedOut, M);
  const schedPop = (i, t) => prog(t, B.sched + i * POST.each, POST.fade, POP);
  const pairRect = (i, t) => ({x: mix(PAIR_X.alone, PAIR_X.beside, schedOn(t)), y: ANCHOR.y - PAIR_H / 2 + i * (CARD.h + PAIR.gap) * PAIR.s, s: PAIR.s});

  // A mission's place: {x, y, s (its scale: the card is drawn 334 px wide), op, pop, up (lifted or moving: over the others, its own shadow), board (on the tablet)}, or null before it is posted
  function cardAt(id, t, ctx = frameCtx(t)) {
    const tr = board.tracks[id];
    if (!tr || t < tr[0].t) return null;
    let i = 0;
    while (i + 1 < tr.length && tr[i + 1].t <= t) i++;
    const k = tr[i], rect = place => (place.pair != null ? pairRect(place.pair, t) : slotRect(ctx.tab, ctx.cam, place.col, place.slot));
    const to = rect(k.place), onBoard = k.place.pair == null;
    if (k.kind === 'post') { const p = clamp((t - k.t) / POST.fade); return {...to, op: clamp(p / 0.6) * ctx.tab.op, pop: mix(0.86, 1, POP(p)), up: false, board: true}; }
    const dur = k.kind === 'rise' ? RISE : k.kind === 'jump' ? 0 : M, p = dur > 0 ? clamp((t - k.t) / dur) : 1;
    if (p >= 1) return {...to, op: onBoard ? ctx.tab.op : 1, pop: 1, up: !onBoard, board: onBoard};
    const from = rect(tr[i - 1].place);
    if (k.kind === 'rise') { // to the right, up beside the others, back in
      const pull = 0.3 * CARD.w * to.s, out = p < 0.3 ? EASE(p / 0.3) : p > 0.7 ? EASE((1 - p) / 0.3) : 1;
      return {x: to.x + pull * out, y: mix(from.y, to.y, EASE(clamp((p - 0.2) / 0.6))), s: to.s, op: ctx.tab.op, pop: 1, up: true, board: true};
    }
    const e = EASE(p);
    return {x: mix(from.x, to.x, e), y: mix(from.y, to.y, e), s: mix(from.s, to.s, e), op: k.kind === 'shift' ? ctx.tab.op : 1, pop: 1, up: k.kind !== 'shift', board: onBoard};
  }

  // ---- the faces of the team ----
  // where a face is: in its place at the left of the tablet (`seat`), over its phone (`phone`), at a mission's right edge (`edge`: the person at the mission, it goes with it) or on its card where the performer is (`spot`)
  function faceRect(who, seg, t, ctx) {
    if (seg.mode === 'seat') return seatRect(TEAM.indexOf(who), ctx.tab, ctx.cam);
    if (seg.mode === 'phone') { const x = devicePhoneX(seg.phone) + DEVICE_PHONES.w / 2; return {x: x - DEVICE_PHONES.face / 2, y: DEVICE_PHONES.top, size: DEVICE_PHONES.face}; }
    const c = seg.card && cardAt(seg.card, t, ctx);
    if (!c) return null;
    const cw = CARD.w * c.s;
    if (seg.mode === 'edge') return {x: c.x + cw - 0.0835 * cw, y: c.y + 0.0747 * cw, size: 0.2725 * cw};
    return {x: c.x + 15 * c.s, y: c.y + 86 * c.s, size: 32 * c.s}; // spot: where the card has its performer's face (.chip-performer-avatar, 32 px)
  }
  const segAt = (who, t) => { const list = faces[who]; let i = -1; while (i + 1 < list.length && list[i + 1].t <= t) i++; return {seg: list[i] ?? null, prev: list[i - 1] ?? null}; };
  // the person whose face sits on this card now (the card draws it then)
  function seatedOn(id, t) {
    for (const who of TEAM) { const {seg} = segAt(who, t); if (seg && seg.mode === 'spot' && seg.card === id && !seg.fade && t >= seg.t + (seg.dur ?? M)) return who; }
    return null;
  }
  // a face: {x, y, size, op, pop}
  function faceAt(who, t, ctx = frameCtx(t)) {
    const {seg, prev} = segAt(who, t);
    if (!seg || seg.mode === 'away') return null;
    let rect = faceRect(who, seg, t, ctx);
    if (!rect) return null;
    const dur = seg.dur ?? (seg.fade ? 0 : M), p = dur > 0 ? clamp((t - seg.t) / dur) : 1;
    if (p < 1 && prev && prev.mode !== 'away') { const from = faceRect(who, prev, t, ctx); if (from) { const e = EASE(p); rect = {x: mix(from.x, rect.x, e), y: mix(from.y, rect.y, e), size: mix(from.size, rect.size, e)}; } }
    let op = 1, pop = 1;
    if (seg.fade === 'pop') { const q = clamp((t - seg.t) / seg.fadeDur); op = clamp(q / 0.6); pop = mix(0.4, 1, POP(q)); }
    else if (seg.fade === 'in') op = prog(t, seg.t, seg.fadeDur, OUT);
    else if (seg.fade === 'out') op = 1 - prog(t, seg.t, seg.fadeDur, OUT);
    if (seg.mode === 'spot' && !seg.fade && p >= 1) op = 0; // (the card has it now)
    if (seg.mode !== 'phone') op *= ctx.tab.op;
    return op > 0.001 ? {...rect, op, pop} : null;
  }
  // how many missions each person closed by `t`
  function closedBy(t) {
    const n = {adam: 0, maya: 0, ben: 0};
    for (const life of Object.values(LIFE)) if (life.closed != null && life.closed <= t && life.who) n[life.who]++;
    return n;
  }
  // What a mission's card shows at `t` (MissionChip's props and the looks the cut puts on it)
  function chipAt(id, t) {
    const m = MISSIONS[id], life = LIFE[id], claimed = life.claimed != null && t >= life.claimed, closed = life.closed != null && t >= life.closed, end = closed ? life.closed : t;
    const pts = POINTS.indexOf(id), ptsOn = pts < 0 ? 0 : prog(t, B.points + pts * POST.each, POST.fade, POP);
    const seated = seatedOn(id, t);
    return {
      kind: m.kind, title: names.mission[id], points: pts < 0 ? null : m.points, ptsOn, closed, whoId: closed ? life.who : null,
      showExec: claimed, execTime: clock(claimed ? clockAt(id, end) - clockAt(id, life.claimed) : 0), pillTime: clock(m.age + clockAt(id, end) - clockAt(id, life.posted)),
      pill: COLORS[closed ? 'gray' : toneAt(id, t)], pillPop: pillPopAt(id, t),
      who: closed ? names.person[life.who] : null, whoOn: closed ? prog(t, life.closed + 0.25, 0.4, OUT) : 1,
      avatar: !closed && seated ? PEOPLE[seated].src : null,
    };
  }

  // ---- the personal code: the panel by the mission while a person types: {who, id, action, x, y, s, op, typed, key} or null ----
  function codeAt(t, ctx = frameCtx(t)) {
    const r = turns.find(x => t >= x.panel && t < x.gone + 0.3);
    if (!r) return null;
    const c = cardAt(r.id, t, ctx);
    if (!c) return null;
    const cw = CARD.w * c.s, op = prog(t, r.panel, CODE.panel, OUT) * (1 - prog(t, r.gone, 0.22, OUT));
    const n = clamp(Math.floor((t - r.dots) / CODE.dot) + 1, 0, 6), press = t >= r.dots && t < r.typed && (t - r.dots) % CODE.dot < CODE.dot * 0.7;
    const s = (0.809 * cw) / 184, y = Math.min(c.y + 0.519 * cw, 676 - 215 * s); // (the panel is about 215 px tall at 1: it never goes down into the words' band)
    return {who: r.who, id: r.id, action: r.action, x: c.x + cw + 0.048 * cw, y, s, op, pop: mix(0.92, 1, prog(t, r.panel, CODE.panel, POP)), typed: n, key: press ? PEOPLE[r.who].code[n - 1] : null};
  }

  // ---- the phones ----
  // the start: three personal boards (they come and go with the art: `artAt`); `n` missions on each by `t` (a round at a time), each card's pop
  function startPhonesAt(t) {
    return PHONES.map((p, i) => {
      const cards = p.list.map((id, j) => { const at = B.postPhones + (j * 3 + i) * POST.each, c = clamp((t - at) / POST.fade); return {id, title: names.mission[id], at, op: clamp(c / 0.6), pop: mix(0.92, 1, POP(c)), y: mix(14, 0, OUT(c))}; });
      return {who: p.who, x: startPhoneX(i), y: START_PHONES.top, op: 1, scale: 1, cards, n: cards.filter(c => t >= c.at).length};
    });
  }
  // "no device for each": three phones at the tablet's left, then into it one after the other
  function devicePhonesAt(t) {
    if (t < B.side - 0.01 || t > B.merge + 1.6) return [];
    const k = kOf(SIDE), target = {x: SIDE.x + (TABLET.screen.x + TABLET.screen.w / 2) * k, y: SIDE.y + (TABLET.screen.y + TABLET.screen.h / 2) * k};
    const h = DEVICE_PHONES.w * PHONE_RATIO, top = DEVICE_PHONES.top + DEVICE_PHONES.face + 10;
    return PHONES.map((p, i) => {
      const q = clamp((t - (B.side + i * FACES)) / 0.4), e = EASE(clamp((t - (B.merge + i * 0.12)) / M));
      const x0 = devicePhoneX(i), cx = mix(x0 + DEVICE_PHONES.w / 2, target.x, e), cy = mix(top + h / 2, target.y, e), s = mix(1, 0.18, e);
      return {who: p.who, x: cx - (DEVICE_PHONES.w * s) / 2, y: cy - (h * s) / 2 + mix(20, 0, OUT(q)), w: DEVICE_PHONES.w * s, op: clamp(q / 0.6) * (1 - clamp((e - 0.45) / 0.55)), list: p.list.slice(0, 2).map(id => ({id, title: names.mission[id]}))};
    });
  }

  // ---- the shifts of the end ----
  function shiftAt(t) {
    const op = (t >= B.shiftIn ? 1 : 0) * (1 - prog(t, B.end, M)); // (it comes in with the art: `artAt`; it goes after the last words)
    if (op <= 0.001) return null;
    const rows = SHIFT.rows.map((row, r) => {
      const close = prog(t, B.closeGaps + r * 0.1, GAP_CLOSE);
      let x = 0;
      const blocks = row.blocks.map((w, j) => { const at = x; x += w + (j < row.gaps.length ? mix(row.gaps[j], SHIFT.gap, close) : 0); const pop = prog(t, B.blocks + r * FACES + j * 0.06, POST.fade, POP); return {x: at, w, pop, label: clock(w * 9)}; });
      const gaps = row.gaps.map((g, j) => ({x: blocks[j].x + blocks[j].w, w: mix(g, SHIFT.gap, close)}));
      const endAt = blocks.at(-1).x + blocks.at(-1).w, extraPop = prog(t, B.extra + r * POST.each, POST.fade, POP);
      return {who: row.who, y: SHIFT.top + r * SHIFT.pitch, blocks, gaps, extra: {x: endAt + SHIFT.gap, w: row.extra, pop: extraPop, label: clock(row.extra * 9)}};
    });
    const ends = SHIFT.rows.map(row => row.blocks.reduce((a, b) => a + b, 0) + row.gaps.length * SHIFT.gap);
    return {op, rows, saved: {x: SHIFT.x + Math.max(...ends) + 4, y: SHIFT.top - 4, w: SHIFT.w - Math.max(...ends) - 4, h: 2 * SHIFT.pitch + SHIFT.h + 8}};
  }

  return {
    words, fps: CUT_FPS, B, captions, scenes, title, names, ui: st.ui, turns, marks, life: LIFE, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS),
    ...told, countsAt, tabletAt, photoAt, cameraAt, dimAt, frameCtx, chipAt, cardAt, schedOn, schedPop, pairRect, seatedOn, faceAt, closedBy, codeAt,
    startPhonesAt, devicePhonesAt, shiftAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeCut = cutMaker(build);
// The cut with the narration's words
export const DEFAULT_CUT = makeCut();
export const CUT_SECONDS = DEFAULT_CUT.seconds, CUT_FRAMES = DEFAULT_CUT.frames, ALL_CARDS = Object.keys(MISSIONS);
