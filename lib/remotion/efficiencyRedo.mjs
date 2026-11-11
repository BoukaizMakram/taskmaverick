// Increased Efficiency, the Remotion cut REDONE FROM THE STORYBOARD (the user, 2026-11-09: "redo the increased effeciency video based on http://localhost:3000/storyboard?video=all-storyboards,
// read the notes and what's in the slide and use remotion to redo the video"; asked again the same evening, once the row was reworked: "redo increased effeciency video, use remotion and follow
// storyboard in .../storyboard?video=all-storyboards"). The board All storyboards has the row "Increased Efficiency · Variation 4" (content/storyboard/all-storyboards.json): its slides reordered,
// copied, deleted, retyped and drawn on by the user, a note under some. This film tells it that way, in the row's order (`ie-v4:<n>` on the board, its id after it):
//   1  title            "There Is No Need To Micro-Manage People" (its yellow strike is hidden on the board: none here)
//   2  individuals      "Automated assignment · Mission(s) Are Automatically Posted Exactly When Due": four missions alone (no phones, no tablet), posted one after the other, each timer from 00:00:00.
//                       Its note, for every slide: "move the title from left to center then to right, for all slides, .3s to show then after scen is done .3 seconds to go right"; then
//                       "it should move slowely more, and doesn't cross each other, and it should show only the blue title at first then the white comes it with the animation we had": the blue
//                       label slides in alone, slowly, the white words are written, the whole slides out to the right; a second title only once the first has gone (`SLIDE`, `next`)
//   3  individuals#2    "Sense of urgency · Mission Timers Change In Color To Create A Sense Of Urgency", the cards 1.47 times as big; note "all green, then top two to orange, then top one to red"
//   4  individuals#3    "Automated prioritization · Important Missions Are Automatically Prioritized"; note "bottom one go to orange then move it 10% to the right then up then center. out,
//                       accelerate, up": Prepare Workspace (at the bottom) goes orange, out 10% of its width to the right, up (speeding up) above the green Safety Check, back in.
//                       Changed by the user on the video, 2026-11-10 ("move the missions to the right then increase time on all of them and make color of the mission to the right to
//                       orange"): it goes out to the right FIRST and stays there, time goes by on all four timers and the one at the right goes orange, then up and back in (`B.pull`);
//                       then ("the move it again to the right and increase to red and move up") the same once more: out again, time goes by, it goes RED and goes up over the orange
//                       Order Supplies (`B.pull2`), so the column is Inventory Check, Prepare Workspace, Order Supplies, Safety Check from there on (`PRIORITIZED`)
//   5  points           "Boost motivation · Reward Points Can Be Added To Increase Team Motivation With Gamification", closer still (the slide's cards are 1.96 times the first's), a circle and
//                       "POP" drawn on a points badge; note "Pop the points out in all of them": every mission's points pop, one after the other
//   6  code#2           "Individual recognition · Each Person's Contribution Can Be Easily Recognized", the tablet (four in Open, two in Claimed, three in Closed); note "zoom in on claimed and
//                       closed, and pop the 5 names": the four go onto the tablet's Open column as it comes in around them, the camera on Claimed and Closed, the five names pop
//   7  code#3           "Measured execution · Execution Duration Is Measured Per Mission": the zoom kept, the five execution timers pop (as Variation 6's first version did, the slide has no note)
//   8  shared           two titles: "Sharing devices · There Is No Need To Provide Each Person With Their Own Device" (at the RIGHT on the slide: the first; the user, the same evening: "always
//                       show the title on the right before the left one", "move the title to the right and show next coming from left"), then "Reduce cost · A Whole Team Can Share One
//                       Single Device"; the picture of the team with OUR tablet on its wall. The user, with a picture of that slide: "this image with tablet in slide 8 should be recreated
//                       using gpt image too, just to tell you that the transition from 7 to 8 should be seamless of the tablet going to wall and becoming the new image generated featuring
//                       exactly same missions on tablet"; then "the original looks so much more realistic": the camera pulls back, our tablet goes onto the real wall tablet of the
//                       picture (bent to its angle on the way), which comes in round it, and becomes it: the picture's screen shows our board with the very same missions (`SHARE_PHOTO`,
//                       `ON_WALL`, `skewAt`)
//   9  code             two titles: "Effective teamwork · Each Person Uses Their Code To Claim & Close Missions" (right: first), then "Seamless engagement · There Is No Need For Anyone To Login
//                       Or To Sign In"; note "start with 4 on the left, no close, no claimed, do not show the code. 3 avatars on the left, go up then claim then pop back in at the bottom. no
//                       personal code needed" + red arrows up the faces and across to the top mission: into the tablet on the wall; the missions done go (the four in Open stay); the top face
//                       goes up and across to the top mission, it is claimed, the face pops back in at the bottom; twice under the first title, once under the second
//   10 shared#3         "Instant update · People Working From Separate Devices Remain On The Same Page"; note "showing devices in their hands. Create Some visual effect of a star poping, showing
//                       that an action is reflected on other devices. USE GPT CHROME.": the picture of the three, each with a phone in their hands (`PHONES_PHOTO`); a star pops on one phone,
//                       then on the two others
//   11 shared#2         "Seamless flow · An Action On One Device Is Reflected On All Devices"; note "keep picture of the three people,": the same picture; another phone's star, then the others'
//   12 initiative       two titles: "Self initiative · Everyone Is Constantly Guided To Take Initiatives On Their Own" (right: first), then "Minimal downtime · Efficiency Increases By Reducing
//                       Downtime Between Tasks"; the tablet hidden, blue lines over the columns (the board's blue column tabs), red arrows from the top face to the top mission and across the
//                       columns: the board without its tablet, each person takes the top mission, works on it, closes it and pops back in at the bottom; one after the other
// Words first, then the action; one speed (a move 0.76 s on Easy Ease 70%, posts 0.15 s apart); what the slides circle POPS (no yellow outlines).
// A TITLE AND ITS ACTION (the user, 2026-11-10: "make all the transtions after the title finishes faster by 30%", then, of what the transitions are: "action after title end it should start as
// soon as the title ends showing up and .3 seconds title going away after action ends"; written, NOT played): on every slide the action starts the moment the title's last word is written, and
// the title starts to go 0.3 s after its action has ended (`GONE`, `acted`); a title with no action under it (slide 8's two, slide 10's) stays to be read. From one title to the next everything
// is 30% faster (`QUICK`, `TR`, `TR_WALL`; the titles' slide: `SLIDE` in cutCore.mjs).
// THE CEO'S REVIEW OF 2026-11-09 (docs/meetings/2026-11-09-ceo-review.md; done 2026-11-10, written, NOT played) changed what follows, over the slides' notes above where they differ:
//   2     the four missions alone are big from the start (the size slide 3 had: "this needs to be bigger ... it's going to look beautiful like this"); the user, 2026-11-10 ("show missions as
//         soon as Missions Are Automatically Posted Exactly When Due ends"; written, NOT played): they are posted the moment the sentence is written, with no wait after it (`B.post`)
//   8     the user, 2026-11-10 ("There Is No Need To Provide Each Person With Their Own Device, this shouldn't last that long"; written, NOT played): its first title stays 1.5 s once written,
//         not 3.6 s (`SHARE_READ`); then "both should stay one second only": that title and the one after it ("A Whole Team Can Share One Single Device", retyped "A Single Device Can Be
//         Displayed & Shared By A Team") each stay 1 s once written
//   all   the user, 2026-11-10 ("the art needs to be fixed to have the same space between it and the title and it and the top", "the backgorund behind the title should show up only when there
//         is an intersection of something behind title"; written, NOT played): the whole art is drawn `ART_DY` px lower, the tablet a little closer is centered on its frame (`CODE_CAM`), the
//         board without its tablet too (`LANES.y`); the color behind the title is seen only as much as the art goes behind the title (`shadeAt`, `SHADE`)
//   10    the user, 2026-11-10 ("People Working From Separate Devices Remain On The Same Page, make this go away faster"; written, NOT played): it stays 1.5 s once written, not 3.6 s
//         (`INSTANT_READ`)
//   6     the five names stay bigger, bold and black once popped ("make them more pronounced, like black, like bold, these names"), the cards of Claimed and Closed stand out of the board
//   6/7   the user, 2026-11-10 ("execution timer move it to the left in Execution Duration Is Measured Per Mission, make it bold and put a yellow strip behind it for both execution timer and
//         names too before this one"; written, NOT played): a yellow strip behind each name of slide 6 once popped; on slide 7 each execution timer, once popped, stays bigger, bold, on a yellow
//         strip, moved to the left clear of the timer pill, until the words go (`EXEC`, `execAt`, `staysAt`; --rc-exec-b, --rc-who-b in EfficiencyRedo.css)
//   9     FIVE avatars at the left ("let's do five avatars here"), one of them a Black man ("find me a Black guy"); a person goes to the top mission, pulls it to Claimed, then SITS ON IT where the
//         name is ("I want him to go back and sit here", "going back to where the name is"); to close, they come out of there, pull it to Closed and sit on it there; a new mission is posted in
//         Open each time one is taken ("constantly loading a mission ... this loading is very important"); ONE AT A TIME ("after he sits there, you'll pull the next one, give me time to know what
//         you did"); the order: claim, claim, close, close under "Each Person Uses Their Code To Claim & Close Missions", then "There Is No Need For Anyone To Login Or To Sign In" and two more
//         claims ("one, one, two, two, one, one", "four avatars are going to work and one avatar will be left here"): `crew`
//   10/11 NO star on slide 10, three on slide 11 (the user, 2026-11-10: "don't show stars in People Working From Separate Devices Remain On The Same Page; show three stars in An Action On One
//         Device Is Reflected On All Devices, and make one star on one device then 2 successively"; it is what the CEO's "I just wanted second, not on the first slide" meant): one person
//         presses on their phone and its star pops, then the two other phones' stars, one after the other ("the guy presses ... and it does this for the others"): `PRESSES`, `STARS`
//   12    the same five and the same order ("repeat the five actions here ... one, one, two, two, one, one"), one move at a time ("have this person sit here before this person takes off",
//         "why did it move at the same time ... orderly movement"), and BIGGER ("you could be bigger on this, you have a lot of space ... open, claimed, closed, make them bigger"): `LANES`
// VARIATION 7, THE LAYOUT 'straight' (the user, 2026-11-11: "read comments in increased effeciency and fix it in a new variation"; the four comments pinned on this film that day; written, NOT
// played). The same film, with what the comments ask (`V7` in `build`; Variation 6, the layout 'storyboard', plays as it did):
//   2-5   "another variation where title starts on the middle, and then moves right in this scene where we have missions and then fade out to next title or move vertically" (pinned at the
//         right of the missions alone): while the missions are alone their words are not in the band but BESIDE them, the blue label over the white words (`BESIDE` in cutCore.mjs). The first
//         title is written in the middle of the empty picture, glides to the right (`BESIDE_AT`), and the missions are posted at its left; each next title comes up into that place as the one
//         before goes up out of it. The missions' column is at the left (`FLOAT_SHIFT`), in the middle of the picture's height (no words under it), its closer look fitted to the picture
//         (`FLOAT_CAMS7`). From slide 6 on the tablet is there and the words are in the band as before (the CEO, 2026-11-09: a tablet or a big board, the words at the bottom).
//   7     "use a different color like an orange here" (pinned on an execution timer's yellow strip): the strip behind the execution timers is orange (`EXEC_STRIP`), the names' stays yellow
//   9, 12 "here we should claim 3 missions straight, meaning the avatar should claim the mission in front of him, and only close it when it's a straight line to the right. so first avatar
//         moves right claim first mission the second avatar claims second mission on the second line and so on" ("same here" on slide 12): every move is a STRAIGHT LINE to the right. The team
//         is a column with one person in front of each row of Open (`ROW_TEAM`: four, a tablet has four rows; `rowSeat`), and a mission lands UNDER the ones already in its new column
//         (not at the top), which is on its own row whenever the move is played. Then, the user having watched it (the same day: "after the first one claims the mission, the mission
//         under it should go up, then second person claims order supplies and then next missions goes up and the girl takes safety checks, then on closing inventory check, the missions
//         goes up normal in claim and then only the girl closes the mission so that everything goes to straight line"), the columns close up as on the product and only the moves that
//         are straight are played:
//           Ben (row 1) claims Inventory Check, row 1 to row 1; the missions under it go up (Prepare Workspace, Order Supplies, Safety Check on rows 1, 2, 3) and a new mission,
//             Clean The Windows, is posted on row 4
//           Leo (row 2) claims Order Supplies, now in front of him, row 2 to row 2; Open goes up again (Prepare Workspace, Safety Check, Clean The Windows) and Refill Napkins is posted
//           Maya (row 3) claims Clean The Windows, now in front of her, row 3 to row 3; Open goes up and Take Out The Trash is posted
//           Ben closes Inventory Check, row 1 to row 1; Claimed goes up (Order Supplies and Clean The Windows, Leo and Maya sitting on them, to rows 1 and 2)
//           the next title; ONLY Maya closes: Clean The Windows, row 2 of Claimed to row 2 of Closed, under Inventory Check. Leo does not close (Order Supplies on row 1 would land on row 3)
//         The first version of this left Safety Check on its row for Maya and posted the new missions only once the three were taken; the user, with two pictures of it (the gap Order
//         Supplies left in Open, Maya at Safety Check): "mission should deploy as soon as the mission claimed, the girl shouldn't claim safety check because safety check should go up and
//         the girl should claim the next mission that should've been deployed after inventory check claim". So Open ALWAYS goes up and a mission is posted at EVERY claim (`DEPLOY`).
//         The same on the board without its tablet, with its own people and missions. `rowCrew`, `turnsOf`.
// It is the variation look `remotion-storyboard` of increased-efficiency-v3 (the cut's layout 'storyboard', lib/remotion/cuts.mjs); components/remotion/EfficiencyRedo.jsx draws it; the Remotion project
// renders it as IE-Redo. Its words can be retyped like Variation 4's (`edits.cuts['IE-Redo']`, lib/remotion/cutWords.mjs). Pure: no React, no Remotion.
import {ANCHOR, ART_DY, BESIDE, CUT_FPS, CUT_H, EASE, FACES, M, OUT, POP, POST, SLIDE, WORDS_TOP, bezier, clamp, clock, cutMaker, keyed, mix, prog, story} from './cutCore.mjs';
import {BOARD, CAMS, CARD, COLORS, COLUMNS, FOLLOW, FULL, INTO, PEOPLE as CUT_PEOPLE, PHOTO, TABLET, UNIT, boardPoint, seatRect, slotRect, view} from './efficiencyCut.mjs';
export {ART_DY, BOARD, CARD, CUT_FPS, PHOTO, TABLET, WORDS_TOP, clamp, clock, mix, view};

export const REDO_CUT_ID = 'IE-Redo';
// Variation 7 (the look `remotion-straight`, the layout 'straight' of the board's cut): the same film with the comments of 2026-11-11 in it; its own words (`edits.cuts['IE-Straight']`), its own render
export const STRAIGHT_LAYOUT = 'straight', STRAIGHT_CUT_ID = 'IE-Straight';
export const TITLE_WORDS = {lines: ['There Is No Need To', 'Micro-Manage People'], mark: null}; // (the board's title slide has its yellow strike hidden)

// ---- the product's data ----
export const MISSIONS = {
  // the four posted alone, then on the tablet's Open column (slides 2 to 9)
  inv: {title: 'Inventory Check', kind: 'Checklist', points: 10, time: '08:00 AM'},
  ord: {title: 'Order Supplies', kind: 'Checklist', points: 15, time: '08:00 AM'},
  sig: {title: 'Safety Check', kind: 'Checklist', points: 20, time: '08:00 AM'},
  prep: {title: 'Prepare Workspace', kind: 'Task', points: 15, time: '08:00 AM'},
  // the missions already taken when the tablet comes in (slides 6 to 8): two claimed, three closed, each with its person
  counters: {title: 'Wipe Down Counters', kind: 'Task', points: null, time: '07:00 AM'},
  cash: {title: 'Count The Cash Drawer', kind: 'Task', points: null, time: '07:00 AM'},
  desk: {title: 'Restock Front Desk', kind: 'Checklist', points: null, time: '06:30 AM'},
  room: {title: 'Clean Break Room', kind: 'Task', points: null, time: '06:30 AM'},
  bins: {title: 'Empty The Bins', kind: 'Task', points: null, time: '06:30 AM'},
  // the board without its tablet (slide 12)
  fridge: {title: 'Check Fridge Temperature', kind: 'Checklist', points: null, time: '10:00 AM'},
  delivery: {title: 'Receive Delivery', kind: 'Checklist', points: null, time: '10:00 AM'},
  floor: {title: 'Mop The Floor', kind: 'Task', points: null, time: '10:00 AM'},
  lights: {title: 'Check The Lights', kind: 'Task', points: null, time: '10:00 AM'},
  // posted as the others are taken (the CEO, 2026-11-09: "you're constantly loading a mission, when one goes, constantly loading"): on the tablet (slide 9), on the board without it (slide 12)
  windows: {title: 'Clean The Windows', kind: 'Task', points: null, time: '08:30 AM'},
  napkins: {title: 'Refill Napkins', kind: 'Task', points: null, time: '08:30 AM'},
  trash: {title: 'Take Out The Trash', kind: 'Task', points: null, time: '08:30 AM'},
  tables: {title: 'Wipe The Tables', kind: 'Checklist', points: null, time: '08:30 AM'},
  shelves: {title: 'Restock Shelves', kind: 'Checklist', points: null, time: '10:30 AM'},
  labels: {title: 'Label Containers', kind: 'Task', points: null, time: '10:30 AM'},
  sink: {title: 'Sanitize The Sink', kind: 'Task', points: null, time: '10:30 AM'},
  menu: {title: 'Update Menu Board', kind: 'Task', points: null, time: '10:30 AM'},
};
export const ALL_CARDS = Object.keys(MISSIONS);
const FLOATERS = ['inv', 'ord', 'sig', 'prep'];      // posted in this order (the longer the timer, the higher)
const PRIORITIZED = ['inv', 'prep', 'ord', 'sig'];   // after Prepare Workspace has risen twice (orange: over Safety Check; red: over Order Supplies)
export const POINTS = FLOATERS;                       // "Pop the points out in all of them" (slide 5)
// The missions taken before the tablet comes in: where, whose, and how long they have run (seconds: the timer, the execution timer) when it does
const DONE = {
  counters: {col: 'claimed', who: 'adam', age: 1500, exec: 420},
  cash: {col: 'claimed', who: 'maya', age: 1260, exec: 300},
  desk: {col: 'closed', who: 'ben', age: 2400, exec: 540},
  room: {col: 'closed', who: 'adam', age: 2160, exec: 660},
  bins: {col: 'closed', who: 'maya', age: 1980, exec: 480},
};
const DONE_ORDER = Object.keys(DONE); // (Claimed, then Closed, top to bottom: the order the names and the execution timers pop)
const LANE_CARDS = ['fridge', 'delivery', 'floor', 'lights'];
const BOARD_LOADS = ['windows', 'napkins', 'trash', 'tables'], LANE_LOADS = ['shelves', 'labels', 'sink', 'menu']; // the missions posted as the others are taken, in this order
// every name a mission has (the board's and the phones'): one key, 'mission:<id>', retypes it everywhere
export const TITLES = {...Object.fromEntries(Object.entries(MISSIONS).map(([id, m]) => [id, m.title])), updates: 'Review Team Updates'};
// The team is FIVE (the CEO, 2026-11-09: "let's do five avatars here", "find me a Black guy or something ... we don't want to offend"): the three of the pictures and two of the site's own avatars
// (public/avatars/03.png, 04.png: the same frame; in a white T-shirt, not the red uniform, until two are generated to match)
export const PEOPLE = {...CUT_PEOPLE, sam: {name: 'Sam T', src: '/avatars/03.png'}, leo: {name: 'Leo K', src: '/avatars/04.png'}};
export const CREW = Object.keys(PEOPLE);
// their places in the column at the left of the missions, from the bottom: the one on top goes first, four work and the one at the bottom is left ("four avatars are going to work and one avatar
// will be left here"); on the board without its tablet (slide 12) the column is the other way up, so the one who was left works there
export const TEAM = ['leo', 'sam', 'adam', 'maya', 'ben'];
const LANE_TEAM = ['ben', 'maya', 'adam', 'sam', 'leo'];
// Variation 7: one person in front of each mission of Open, from the TOP row down (the user, 2026-11-11: "the avatar should claim the mission in front of him"). Four: a tablet's column has four
// rows, and a fifth person would stand under the tablet, over the words. The three on top work, the fourth is left; on the board without its tablet the column is the other way up, so the one
// who was left works there
const ROW_TEAM = ['ben', 'leo', 'maya', 'adam'], LANE_ROW_TEAM = [...ROW_TEAM].reverse();
// Variation 7: a new mission is posted in Open at every claim (the user, 2026-11-11: "mission should deploy as soon as the mission claimed"), this long after the claimed one starts to go: the
// missions under it are going up then, and the last row is all but free (they start `FOLLOW` s after it and take M; by 0.58 s the bottom one is three quarters of the way)
const DEPLOY = FOLLOW + 0.6 * M;
// the strip behind the execution timers of slide 7 in Variation 7 (the user, 2026-11-11, on one of them: "use a different color like an orange here"): an orange light enough for the timer's dark
// bold figures; the names' strip of slide 6 stays the videos' yellow
const EXEC_STRIP = '#ffa126';

// ---- the pictures (generated with ChatGPT, as the user asked: "use chatgpt chrome") ----
// A picture is drawn in the bounds of the tablet's frame (PHOTO, as the videos have it), covering them: its box there, and a point of it (picture px) on the stage
export function photoBox(picture) {
  const cover = Math.max(PHOTO.w / picture.w, PHOTO.h / picture.h);
  return {cover, w: picture.w * cover, h: picture.h * cover, x: (PHOTO.w - picture.w * cover) / 2, y: (PHOTO.h - picture.h * cover) / 2};
}
const onStage = (img, [px, py]) => ({x: PHOTO.x + img.x + px * img.cover, y: PHOTO.y + img.y + py * img.cover});
// Slide 8: the team at the tablet on its wall, the tablet showing the board of slide 7. `wall`: the four corners of the tablet's FRAME in the picture (picture px: top left, top right, bottom right,
// bottom left), where our tablet lands. Made with ChatGPT from Variation 4's picture (its real wall tablet kept, at its slight angle) and our app's tablet (public/storyboard/ui/tablet-board.jpg), the
// screen showing slide 7's board (2026-11-09); its corners measured on it (the bottom right one, behind Ben's head, from the edges).
export const SHARE_PHOTO = {src: '/storyboard-art/team-wall-tablet.jpg', front: '/storyboard-art/team-wall-tablet-front.png', picture: {w: 1536, h: 1024}, wall: [[880, 118], [1212, 86], [1212.5, 401.5], [880.5, 402.5]]};
// How much of OUR tablet stays seen on the wall (1: ours, the very missions of slide 7, over the picture's own; 0: the picture's own once ours has landed). The user, on the first new picture:
// "the original looks so much more realistic", so the picture keeps the original's real wall tablet at its slight angle; then, of the tablet ChatGPT drew on it: "the tablet here still doesn't look
// good": so OUR tablet stays on it, bent to its angle (`skewAt`), a little warmer in the room's light (`wallToneAt`), and Ben's head, in front of its bottom right corner, is drawn over it again
// (`front`: the picture with only his head, cut out of it by its dark hair joined to one point in it)
export const ON_WALL = 1;
// Slides 10 and 11: the three seen from straight above, far apart in a triangle (Maya at the top, Adam at the bottom left, Ben at the bottom right), each looking down at their own phone, our
// Personal Board on its screen (made with ChatGPT from Variation 4's picture and our app's phone, public/storyboard/ui/personal-board.jpg; the user: "they should be looking at their phone without
// showing their faces to camera/phone", "in a triangle like far from each other", "maybe a top down view"; 2026-11-09). `stars`: the middle of each phone's screen (picture px), in the order the
// stars use them: Adam's, Maya's, Ben's. With no `src`, our three phones in a triangle (`TRIO`).
export const PHONES_PHOTO = {src: '/storyboard-art/team-phones.jpg', picture: {w: 1536, h: 1024}, stars: [[383, 642], [802, 392], [1143, 642]]};
// A star: it pops out of a phone's screen (a ring and sparks with it) and goes, `dur` s
// A press (the CEO, 2026-11-09: "the guy presses with his hand ... and it does this for the others"): a fingertip on ONE phone's screen and two rings going out, `press` s; that phone's star
// pops `after` s later, then, `then` s after it, the two other phones' stars one after the other, `gap` s apart (the user, 2026-11-10: "one star on one device then 2 successively")
export const STAR = {dur: 1.05, gap: 0.4, then: 0.65, size: 78, press: 0.8, after: 0.38};

// ---- where things are ----
// THE TRANSITIONS ARE 30% FASTER (the user, 2026-11-10: "make all the transtions after the title finishes faster by 30%"; written, NOT played): what takes the film from one title to the next, from
// the opening title on. `QUICK` is the one number: `TR` is a transition's move or fade (the camera going closer or back, the tablet coming in round the missions and the missions landing on it,
// the pictures and the board without its tablet coming in and going, the names and execution timers going back to themselves as their words go), `TR_WALL` the tablet going onto the wall of the
// picture and out of it. The titles' own slide in and out are `SLIDE` (lib/remotion/cutCore.mjs: this film is the only one with sliding words), 30% faster there too. What a scene DOES keeps the
// one speed, M: a mission posted, pulled, risen, claimed, closed, a face going to its mission, a pop, a star; the writing of the words and how long they are read are not changed either.
const QUICK = 1.3, TR = M / QUICK, TR_WALL = INTO / QUICK;
// THE ART HAS THE SAME ROOM OVER IT AS UNDER IT (the user, 2026-11-10, with pictures of the team's picture, the whole tablet and the tablet a little closer: "fix the issue of spacing, the title
// should stay where it is, but the art needs to be fixed to have the same space between it and the title and it and the top"; written, NOT played). The words never move. The art was centered on
// ANCHOR.y (367), which left 35 px over the tablet and 90 px between it and the letters. Its middle is now the middle of the room from the picture's top to the top of the title's capital
// letters (`WORDS_TOP`): the WHOLE art of this film is drawn `ART_DY` px lower (components/remotion/EfficiencyRedo.jsx moves `.rc-redo`; every place in this file is as before, in the art's own
// space, and what has to be told from the picture's edges adds `ART_DY`). Two things were not centered on ANCHOR and are now: the tablet a little closer (`CODE_CAM`: the middle of its FRAME, not
// of its columns, which pushed its top out of the picture) and the board without its tablet (`LANES.y`).
// (`WORDS_TOP`, `ART_DY`: lib/remotion/cutCore.mjs since 2026-11-11, Improved Quality's cut told this way uses them too; exported from here as before)
// The color behind the title is there ONLY when something goes behind the title (the user, the same message: "the backgorund behind the title should show up only when there is an intersection of
// something behind title"): it comes in as the lowest edge of the art (the tablet's frame, a mission) goes from `from` to `from + over` (picture px), and is not there otherwise (`shadeAt`)
const SHADE = {from: WORDS_TOP - 16, over: 16};
const FS = UNIT * FULL.w / TABLET.w;                 // a board's card on the whole tablet (334 board units -> 264.5 px)
export const CARD_S = FS;
// The missions alone (slides 2 to 5): a column of the board without its board, in the middle of the room
const PITCH = 147 * FS;
export const FLOAT = {x: ANCHOR.x - CARD.w * FS / 2, y: ANCHOR.y - (3 * PITCH + CARD.h * FS) / 2, pitch: PITCH};
const FLOAT_CAMS = {
  whole: {fx: ANCHOR.x, fy: ANCHOR.y, z: 1.47},                                        // big from the start (the CEO, 2026-11-09, of the cards at z 1: "this needs to be bigger"; of these: "it's going to look beautiful like this")
  close: {fx: ANCHOR.x, fy: ANCHOR.y, z: 1.47},                                        // slide 3: the same size (it was the first closer look)
  points: {fx: ANCHOR.x, fy: FLOAT.y + (ANCHOR.y + ART_DY - 30) / (1.55 / FS), z: 1.55 / FS},  // slide 5: 1.96 times, the top card 30 px under the picture's top (`ART_DY`: the art is drawn that much lower)
};
// Variation 7, the missions alone with their words BESIDE them (the user, 2026-11-11: "title starts on the middle, and then moves right in this scene where we have missions"): the words' place
// (`x`: the sentence's left edge, `y`: the block's middle, the middle of the picture's height), the middle of the missions' column across (`cx`), and how long the first title stays in the
// middle once written before it glides to the right (`hold`). At the closer look the column is 480 px wide: it ends 60 px before the words' thin line, and the longest sentence ends about
// 140 px before the picture's right edge
const BESIDE_AT = {x: 736, y: CUT_H / 2, cx: 410, hold: 0.15};
// the column moved there (art px: the art is drawn ART_DY lower), in the middle of the picture's height since no words are under it
const FLOAT_SHIFT = {dx: BESIDE_AT.cx - ANCHOR.x, dy: CUT_H / 2 - ANCHOR.y - ART_DY};
// its looks: big from the start as Variation 6's; the points' closer look as big as the picture lets the four be, 40 px over and under them
const FLOAT_CAMS7 = {whole: FLOAT_CAMS.whole, close: FLOAT_CAMS.close, points: {fx: ANCHOR.x, fy: ANCHOR.y, z: (CUT_H - 80) / (3 * PITCH + CARD.h * FS)}};
// The tablet a little closer (slide 9: the team at its left), its FRAME in the middle of the room, so it has the same room over it as under it (it was Variation 4's `CAMS.code`, centered on the
// columns: the frame's top was out of the picture and 65 px were left under it)
const CODE_CAM = {fx: ANCHOR.x, fy: FULL.y + (TABLET.frame.y + TABLET.frame.h / 2) * FULL.w / TABLET.w, z: CAMS.code.z};
// The tablet's Claimed and Closed columns, closer (slides 6 and 7): their three first places
const colMid = c => boardPoint(FULL, BOARD.col(c) + CARD.w / 2, 0).x;
const DONE_CAM = {fx: (colMid(1) + colMid(2)) / 2, fy: (boardPoint(FULL, 0, BOARD.tabTop).y + boardPoint(FULL, 0, BOARD.slot(2) + CARD.h).y) / 2, z: 1.5};
// The board without its tablet (slide 12): three columns, their blue tabs over them, the team's column at the left of Open
// BIGGER (the CEO, 2026-11-09: "you could be bigger on this, you have a lot of space ... open, claimed, closed, make them bigger, use the space, the missions bigger"): a card `s` times the board's
// (347 px wide; it was 264), four of them from under the tabs to just over the band of words, the five faces in a column as tall
export const LANES = {s: 1.04, pitch: 400, y: 90, face: 92, faceGap: 30};
const LS = LANES.s, LPITCH = 147 * LS;
LANES.x0 = ANCHOR.x - (LANES.face + LANES.faceGap + 2 * LANES.pitch + CARD.w * LS) / 2 + LANES.face + LANES.faceGap;
export const laneX = c => LANES.x0 + c * LANES.pitch;
export const LANE_TAB = {h: 38 * LS, gap: 20 * LS};
// (its height: from the top of the tabs to the bottom of the fourth mission; as much room over it as between it and the title: `y` was 90, 30 px over the tabs and 95 under the missions)
LANES.y = (WORDS_TOP - (LANE_TAB.h + LANE_TAB.gap + 3 * LPITCH + CARD.h * LS)) / 2 + LANE_TAB.h + LANE_TAB.gap - ART_DY;
const laneSeat = i => ({x: LANES.x0 - LANES.faceGap - LANES.face, y: LANES.y + 3 * LPITCH + CARD.h * LS - LANES.face - i * (LANES.face + 10), size: LANES.face});
// Slides 10 and 11 until the picture is made: three phones in a triangle (our UI), each with its person's face at its corner
export const TRIO = {w: 180, face: 66, phones: [
  {who: 'adam', x: ANCHOR.x - 90 - 250, y: 292, list: ['inv', 'counters']},
  {who: 'maya', x: ANCHOR.x - 90, y: 58, list: ['cash', 'updates']},
  {who: 'ben', x: ANCHOR.x - 90 + 250, y: 292, list: ['prep', 'bins']},
]};
const TRIO_STARS = TRIO.phones.map(p => ({x: p.x + TRIO.w / 2, y: p.y + TRIO.w * (838 / 401) * 0.42}));
// The pictures' boxes, the tablet on the wall of the team's picture (its middle, how much the picture is pushed in for it to fill the tablet's frame)
export const SHARE_IMG = photoBox(SHARE_PHOTO.picture);
export const PHONES_IMG = photoBox(PHONES_PHOTO.picture);
const WALL_BOX = (() => { const ps = SHARE_PHOTO.wall.map(p => onStage(SHARE_IMG, p)), xs = ps.map(p => p.x), ys = ps.map(p => p.y); return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}; })();
const WALL_MID = {x: WALL_BOX.x + WALL_BOX.w / 2, y: WALL_BOX.y + WALL_BOX.h / 2};
const WALL_PTS = SHARE_PHOTO.wall.map(p => onStage(SHARE_IMG, p));
// The CSS matrix that takes four corners to four others ([[x, y] x 4], in the same order): a plane seen in perspective (as lib/storyboardPlayer.mjs `quadMatrix`, kept here so the cut stays free of the
// board's modules)
const square = ([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) => {
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, ax = x1 - x2, ay = y1 - y2, bx = x3 - x2, by = y3 - y2, det = ax * by - bx * ay, g = (sx * by - bx * sy) / det, h = (ax * sy - sx * ay) / det;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
};
function quadMatrix(from, to) {
  const [a, b, c, d, e, f, g, h] = square(from), i = [e - f * h, c * h - b, b * f - c * e, f * g - d, a - c * g, c * d - a * f, d * h - e * g, b * g - a * h, a * e - b * d], t = square(to);
  const m = [0, 3, 6].flatMap(r => [0, 1, 2].map(k => t[r] * i[k] + t[r + 1] * i[k + 3] + t[r + 2] * i[k + 6])), w = m[8];
  return `matrix3d(${[m[0], m[3], 0, m[6], m[1], m[4], 0, m[7], 0, 0, w, 0, m[2], m[5], 0, w].map(n => +(n / w).toFixed(10)).join(', ')})`;
}
const WALL_ZOOM = PHOTO.w / WALL_BOX.w;
const FRAME_MID = {x: PHOTO.x + PHOTO.w / 2, y: PHOTO.y + PHOTO.h / 2};
const PUSH = 0.035;                                   // a picture held pushes in this much, slowly
// a face taking a mission: it goes up then across to the mission (`GO`), pulls it to its new column (M), then goes to the name's place on the card and sits there (`SIT`); to close, it comes out of
// there to the card's edge (`COME`) and pulls again. The next person leaves `REST` s after this one has sat (the CEO, 2026-11-09: "after he sits there, you'll pull the next one, give me time to
// know what you did", "you're too fast"). A mission is posted in Open `LOAD` s after the one taken has landed.
const GO = 0.85, SIT = 0.5, COME = 0.45, REST = 0.6, LOAD = 0.1;
// the names of slide 6, once popped: they stay `big` times their size, bold and black, until the next words come (`peak`: the pop's top)
const NAME = {peak: 1.9, big: 1.55};
// the execution timers of slide 7, once popped (the user, 2026-11-10: "execution timer move it to the left ... make it bold and put a yellow strip behind it"): they stay `big` times their size,
// bold, on a yellow strip, moved to the left clear of the timer pill (the move itself is in EfficiencyRedo.css), until the words go
const EXEC = {peak: 1.4, big: 1.3};
const STRIP = 0.45; // the yellow strip behind a name or an execution timer: drawn from its left edge to its right in this many seconds
// slide 4's rise, in two moves (the user, 2026-11-10: "move the missions to the right then increase time on all of them and make color of the mission to the right to orange"): the PULL, out to
// the right (10% of the card's width, `RISE_PULL_T` s), where it stays while time goes by on every timer (`PRI_LAPSE`: how long, how fast) and its own goes orange; then the RISE, up (speeding
// up) for `RISE_UP_PART` of `RISE_T` s and back in for the rest
const RISE_T = 0.98, RISE_UP_PART = 2 / 3, RISE_PULL = 0.1, RISE_PULL_T = 0.45, RISE_OUT = bezier(0.25, 0.1, 0.25, 1), RISE_UP = bezier(0.55, 0, 0.18, 1);
// (`again`: how long it rests in its new place before it is pulled out the second time, for red)
const PRI_LAPSE = {wait: 0.15, orange: 0.7, after: 0.3, rate: 300, again: 0.25};
// a pop (the user's word on the slides: a name, a timer, a points badge): up with one small overshoot, held, back
export const PULSE = {up: 0.34, hold: 0.7, down: 0.3};
const pulse = (t, at, peak = 1.4, hold = PULSE.hold) => (at == null || t < at ? 1 : mix(mix(1, peak, POP(clamp((t - at) / PULSE.up))), 1, prog(t, at + PULSE.up + hold, PULSE.down)));
const popIn = (t, at, peak = 1.45) => {
  if (at == null || t < at) return {o: 0, s: 0.4};
  const q = clamp((t - at) / PULSE.up);
  return {o: clamp(q / 0.5), s: mix(mix(0.4, peak, POP(q)), 1, prog(t, at + PULSE.up + PULSE.hold, PULSE.down))};
};
const POPPED = n => (n - 1) * 0.3 + PULSE.up + PULSE.hold + PULSE.down; // n things popping 0.3 s apart: how long until the last has settled
const STAYED = n => (n - 1) * 0.3 + PULSE.up + 0.2 + PULSE.down;        // n things that pop and STAY big (`staysAt`): how long until the last is at its stayed size
// A TITLE AND ITS ACTION (the user, 2026-11-10, of what "transitions" are: "action after title end it should start as soon as the title ends showing up and .3 seconds title going away after
// action ends"; written, NOT played): the action starts the moment the title's last word is written (there was a wait after it, 0.7 to 1.5 s by its length), and the title starts to go `GONE` s
// after its action has ended (there was a still of 0.5 to 1 s, and never less than a reading time, `READ`). A title with NO action under it (slide 8's two, slide 10's) stays to be read: `READ`, or a time of its own (`SHARE_READ`, `INSTANT_READ`)
const GONE = 0.3;
const lettersOf = lines => lines.join(' ').replace(/\s+/g, '').length;
const READ = lines => 0.8 + lettersOf(lines) / 18;
// "There Is No Need To Provide Each Person With Their Own Device" (slide 8's first title): how long it stays once written (the user, 2026-11-10: "this shouldn't last that long"; `READ` gave it
// 3.6 s with nothing happening under it). The one number to change if it is still too long, or now too short.
// ONE SECOND, and slide 8's second title too (the user, the same day, of "There Is No Need To Provide Each Person With Their Own Device" and "A Single Device Can Be Displayed & Shared By A
// Team", as the second is now worded: "both should stay one second only"; it was 1.5 s for the first and `READ`, about 3 s, for the second)
const SHARE_READ = 1;
// "People Working From Separate Devices Remain On The Same Page" (slide 10): the same (the user, 2026-11-10: "make this go away faster"; `READ` gave it 3.6 s with nothing happening under it,
// its stars being slide 11's). The one number to change if it is still too long, or now too short
const INSTANT_READ = 1.5;

// ---- the cut, made from its words ----
function build(words, {layout = null} = {}) {
  const V7 = layout === STRAIGHT_LAYOUT; // Variation 7: the comments of 2026-11-11 (the top of this file)
  const st = story(words, {title: TITLE_WORDS, slide: true}), {B, captions, say, named} = st;
  const hold = (c, done, read = READ(c.lines)) => { c.until = Math.max(done, c.written + read); return c.until; }; // (`read`: how long the words stay once written, when not `READ`)
  const acted = (c, end) => { c.until = end + GONE; return c.until; }; // a title with an action: it goes `GONE` s after the action has ended (`end`)
  const next = c => c.until + (c.beside ? BESIDE.out : SLIDE.out); // another slide: its words come in once these have gone
  // Variation 7: the words of the missions alone are beside them (the first ones: written in the middle of the picture, then gliding to the right, `moveAt`)
  const beside = () => (V7 ? {beside: {x: BESIDE_AT.x, y: BESIDE_AT.y, moveAt: null}} : {});
  const names = {
    mission: Object.fromEntries(Object.entries(TITLES).map(([id, title]) => [id, named(`mission:${id}`, title)])),
    person: Object.fromEntries(Object.entries(PEOPLE).map(([who, p]) => [who, named(`person:${who}`, p.name)])),
    board: {team: named('board:team', 'Team Board'), personal: named('board:personal', 'Personal Board')},
  };
  const life = Object.fromEntries(ALL_CARDS.map(id => [id, {posted: null, age0: 0, exec0: 0, claimed: null, closed: null, who: null, whoAt: null}]));
  const POPS = {pts: {}, who: {}, exec: {}};
  const floatEvents = [], boardEvents = [], laneEvents = [];
  // ---- the team: each person's face as segments in time ({t, kind, ...}: `faceAt`) ----
  const faces = Object.fromEntries(CREW.map(who => [who, []]));
  const face = (who, seg) => faces[who].push(seg);
  // the column at the left of the missions: each in their place (`i` from the bottom), popping in one after the other; nobody changes place when one leaves (one move at a time)
  const seats = (team, popAt) => team.forEach((who, i) => face(who, {t: popAt + (team.length - 1 - i) * FACES, kind: 'seat', i, pop: true}));
  // A team at work on a board (its `events`, the missions of its Open column from the top, the ones posted as they are taken, the team from the bottom). One move at a time:
  //   claim(at): the person on top of the column goes up and across to the top mission of Open, pulls it to Claimed (their face at its edge), then sits on it where the name is; a new mission is
  //     posted at the bottom of Open as the taken one lands
  //   close(who, at): they come out of their place on their mission to its edge, pull it to Closed and sit on it there
  // -> {who, id, at, move (the mission starts to go), landed, sat (the person is sitting: the next turn `REST` s after)}
  function crew(events, open0, loads, team) {
    const open = [...open0], queue = [...team], spare = [...loads], on = {};
    const claim = at => {
      const who = queue.pop(), id = open.shift(), move = at + GO - 0.06, landed = move + M, sat = landed + SIT;
      events.push({t: move, id, type: 'go', to: 'claimed'});
      Object.assign(life[id], {claimed: move, who});
      face(who, {t: at, kind: 'go', card: id, dur: GO});
      face(who, {t: at + GO, kind: 'edge', card: id, dur: 0});
      face(who, {t: landed, kind: 'spot', card: id, dur: SIT});
      const fresh = spare.shift();
      if (fresh) { events.push({t: landed + LOAD, id: fresh, type: 'post'}); life[fresh].posted = landed + LOAD; open.push(fresh); }
      on[who] = id;
      return {who, id, at, move, landed, sat};
    };
    const close = (who, at) => {
      const id = on[who], move = at + COME, landed = move + M, sat = landed + SIT;
      events.push({t: move, id, type: 'go', to: 'closed'});
      life[id].closed = move;
      face(who, {t: at, kind: 'edge', card: id, dur: COME});
      face(who, {t: landed, kind: 'spot', card: id, dur: SIT});
      return {who, id, at, move, landed, sat};
    };
    return {claim, close};
  }
  // Variation 7, a team in ROWS (the user, 2026-11-11: "claim 3 missions straight ... the avatar should claim the mission in front of him, and only close it when it's a straight line to the
  // right"): `team` from the top row down, each in front of the mission of Open on their row. Every move is a straight line to the right:
  // A mission keeps its ROW from one column to the next (`open`, `claimed`: the rows of the two columns as the turns leave them, an empty row null):
  //   seat(popAt): the column, each in front of their row, popping in from the top down
  //   claim(at): the next person down goes straight to the mission in front of them, pulls it to Claimed on its row and sits on it where the name is. The missions under it go up as it
  //     leaves, as on the product (the user, the same day: "after the first one claims the mission, the mission under it should go up"), and a new mission is posted on the last row
  //     `DEPLOY` s later ("mission should deploy as soon as the mission claimed"): so the mission in front of the next person is the one that has come up to their row, a new one for the third
  //   close(who, at, up): they come out to their mission's edge, pull it to Closed on the row it is on and sit on it there. `up`: the missions under it in Claimed go up, the people sitting
  //     on them with them ("on closing inventory check, the missions goes up normal in claim")
  // The turns are chosen so that every mission lands under the ones already in its new column AND on its own row (`turnsOf`): that is what a straight line takes
  function rowCrew(events, open0, loads, team) {
    const open = [...open0], claimed = [], spare = [...loads], on = {};
    let turn = 0;
    const left = (list, row, up) => { // a mission leaves `row`: the ones under it go up (`up`), or its row stays empty
      list[row] = null;
      if (up) list.splice(0, list.length, ...list.filter(Boolean)); else while (list.length && list[list.length - 1] == null) list.pop();
    };
    const post = (id, t) => { events.push({t, id, type: 'post'}); life[id].posted = t; open.push(id); };
    const seat = popAt => team.forEach((who, r) => face(who, {t: popAt + r * FACES, kind: 'row', r, pop: true}));
    const claim = at => {
      const row = turn++, who = team[row], id = open[row], move = at + GO - 0.06, landed = move + M, sat = landed + SIT;
      events.push({t: move, id, type: 'go', to: 'claimed', row, up: true});
      left(open, row, true);
      if (spare.length) post(spare.shift(), move + DEPLOY);
      claimed[row] = id;
      Object.assign(life[id], {claimed: move, who});
      face(who, {t: at, kind: 'go', card: id, dur: GO, line: true});
      face(who, {t: at + GO, kind: 'edge', card: id, dur: 0});
      face(who, {t: landed, kind: 'spot', card: id, dur: SIT});
      on[who] = id;
      return {who, id, at, move, landed, sat};
    };
    const close = (who, at, up = false) => {
      const id = on[who], row = claimed.indexOf(id), move = at + COME, landed = move + M, sat = landed + SIT;
      events.push({t: move, id, type: 'go', to: 'closed', row, up});
      left(claimed, row, up);
      life[id].closed = move;
      face(who, {t: at, kind: 'edge', card: id, dur: COME});
      face(who, {t: landed, kind: 'spot', card: id, dur: SIT});
      return {who, id, at, move, landed, sat};
    };
    return {seat, claim, close};
  }
  // A team's turns under two titles (slide 9 on the tablet, slide 12 on the board without it): `first` the title on, `second(at)` says the next one, `start(n)` when the first person leaves
  // (n: how many are in the column). -> {second: its caption, from (the first mission starts to go), to (the last person has sat)}
  //   Variation 6 (the CEO, 2026-11-09: "one, one, two, two, one, one"): claim, claim, close, close | claim, claim; a new mission posted each time one is taken
  //   Variation 7 (the user, 2026-11-11): claim, claim, claim (at each the missions under it go up and a new one is posted), the first closes (Claimed goes up) | only the third closes:
  //   every one of these lands under the missions already in its new column on the row it left, a straight line. The second person never closes: their mission, gone up to the first row of
  //   Claimed, would land on the third of Closed ("only the girl closes the mission so that everything goes to straight line")
  function turnsOf(events, lanes, open0, loads, popAt, first, second, start) {
    if (V7) {
      const team = lanes ? LANE_ROW_TEAM : ROW_TEAM, c = rowCrew(events, open0, loads, team);
      c.seat(popAt);
      const a1 = c.claim(start(team.length)), a2 = c.claim(a1.sat + REST), a3 = c.claim(a2.sat + REST);
      const z1 = c.close(a1.who, a3.sat + REST, true);
      acted(first, z1.sat);
      const then = second(next(first)), z3 = c.close(a3.who, Math.max(then.written, z1.sat + REST));
      acted(then, z3.sat);
      return {second: then, from: a1.move, to: z3.sat};
    }
    const team = lanes ? LANE_TEAM : TEAM, c = crew(events, open0, loads, team);
    seats(team, popAt);
    const c1 = c.claim(start(team.length)), c2 = c.claim(c1.sat + REST), c3 = c.close(c1.who, c2.sat + REST), c4 = c.close(c2.who, c3.sat + REST);
    acted(first, c4.sat);
    const then = second(next(first)), c5 = c.claim(Math.max(then.written, c4.sat + REST)), c6 = c.claim(c5.sat + REST);
    acted(then, c6.sat);
    return {second: then, from: c1.move, to: c6.sat};
  }

  // 2 · automated assignment: four missions alone, posted one after the other, each timer from zero
  const assign = say('assign', 'Automated assignment', ['Missions Are Automatically', 'Posted Exactly When Due'], B.titleOut + SLIDE.out, beside());
  // (the user, 2026-11-10: "show missions as soon as Missions Are Automatically Posted Exactly When Due ends": the first mission is posted the moment the last word is written, with no wait;
  // it was about 1.2 s after. Then, for every title: the action as soon as the title is in, the title gone `GONE` s after the action: `acted`)
  B.post = assign.written;
  // (Variation 7: the title is written in the middle of the empty picture, glides to the right, and the missions are posted at its left as it gets there)
  if (V7) { assign.beside.moveAt = assign.written + BESIDE_AT.hold; B.post = assign.beside.moveAt + M - 0.15; }
  FLOATERS.forEach((id, i) => { const t = B.post + i * POST.each; floatEvents.push({t, id, type: 'post'}); life[id].posted = t; });
  acted(assign, B.post + 3 * POST.each + POST.fade);
  // 3 · sense of urgency: closer (1.47); time goes by; the top two go orange, then the top one red (its timer pops once, through both)
  const urg = say('urgency', 'Sense of urgency', ['Mission Timers Change In Color', 'To Create A Sense Of Urgency'], next(assign), beside());
  B.zoom2 = urg.written;
  B.lapse = B.zoom2 + (FLOAT_CAMS.close.z === FLOAT_CAMS.whole.z ? 0 : TR); // (the cards are that size already: time goes by as soon as the title is in)
  B.orange = B.lapse + 0.7;
  B.red = B.orange + 1.0;
  B.lapseEnd = B.red + 0.3;
  acted(urg, B.red + PULSE.up + 0.35 + PULSE.down);
  // 4 · automated prioritization (the user, 2026-11-10): the bottom one goes out to the right and stays there; time goes by on all four timers and the one at the right goes orange; then it
  // goes up above the green one and back in
  const pri = say('priority', 'Automated prioritization', ['Important Missions Are', 'Automatically Prioritized'], next(urg), beside());
  B.pull = pri.written;
  floatEvents.push({t: B.pull, id: 'prep', type: 'pull'});
  B.priLapse = B.pull + RISE_PULL_T + PRI_LAPSE.wait;
  B.prepTone = B.priLapse + PRI_LAPSE.orange;
  B.priLapseEnd = B.prepTone + PRI_LAPSE.after;
  B.rise = B.prepTone + PULSE.up + 0.35 + PULSE.down + 0.1;
  floatEvents.push({t: B.rise, id: 'prep', type: 'rise', index: 2});
  // and once more (the user, right after: "the move it again to the right and increase to red and move up"): out to the right again, time goes by on all four, its timer goes red, and it goes up
  // above the orange Order Supplies, under the red Inventory Check (the longer timer stays on top)
  B.pull2 = B.rise + RISE_T + PRI_LAPSE.again;
  floatEvents.push({t: B.pull2, id: 'prep', type: 'pull'});
  B.priLapse2 = B.pull2 + RISE_PULL_T + PRI_LAPSE.wait;
  B.prepRed = B.priLapse2 + PRI_LAPSE.orange;
  B.priLapseEnd2 = B.prepRed + PRI_LAPSE.after;
  B.rise2 = B.prepRed + PULSE.up + 0.35 + PULSE.down + 0.1;
  floatEvents.push({t: B.rise2, id: 'prep', type: 'rise', index: 1});
  acted(pri, B.rise2 + RISE_T);
  // 5 · boost motivation: closer still; every mission's points pop, top to bottom
  const pts = say('points', 'Boost motivation', ['Reward Points Can Be Added To Increase', 'Team Motivation With Gamification'], next(pri), beside());
  B.zoom4 = pts.written; // (the action: the camera goes closer, then the points pop)
  B.pts = B.zoom4 + TR + 0.1;
  PRIORITIZED.forEach((id, i) => { POPS.pts[id] = B.pts + i * 0.3; });
  acted(pts, B.pts + POPPED(PRIORITIZED.length));
  // 6 · individual recognition: the four go onto the tablet's Open column as it comes in round them (the missions done already on it, each with its person); the camera on Claimed and Closed;
  // the five names pop
  B.toBoard = next(pts);
  for (const [id, d] of Object.entries(DONE)) Object.assign(life[id], {posted: B.toBoard, claimed: B.toBoard, closed: d.col === 'closed' ? B.toBoard : null, age0: d.age, exec0: d.exec, who: d.who, whoAt: -1});
  const rec = say('recognition', 'Individual recognition', ["Each Person's Contribution", 'Can Be Easily Recognized'], B.toBoard + TR * 0.55);
  B.doneCam = Math.max(rec.written, B.toBoard + TR + 0.05); // (the action: the camera goes to Claimed and Closed, then the names pop)
  B.names = B.doneCam + TR + 0.1;
  DONE_ORDER.forEach((id, i) => { POPS.who[id] = B.names + i * 0.3; });
  acted(rec, B.names + STAYED(DONE_ORDER.length));
  B.namesEnd = rec.until; // (the names stay big, bold and black until these words go)
  // 7 · measured execution: the zoom kept, the five execution timers pop, then stay bigger, bold, on a yellow strip, at the left of where they were
  const dur = say('measured', 'Measured execution', ['Execution Duration Is', 'Measured Per Mission'], next(rec));
  B.execs = dur.written;
  DONE_ORDER.forEach((id, i) => { POPS.exec[id] = B.execs + i * 0.3; });
  acted(dur, B.execs + STAYED(DONE_ORDER.length));
  B.execsEnd = dur.until; // (the execution timers stay big, bold and on their yellow strip until these words go)
  // 8 · sharing devices, then reduce cost (two titles: the one at the right on the slide first): the camera pulls back as the words go, our tablet goes onto the wall of the picture of the team as
  // the picture comes in round it (the same missions on it), and it pushes in slowly
  B.camOut = dur.until;
  B.toWall = B.camOut + TR * 0.6;
  B.onWall = B.toWall + TR_WALL;
  const share = say('sharing', 'Sharing devices', ['There Is No Need To Provide', 'Each Person With Their Own Device'], B.toWall + TR_WALL * 0.6);
  // (the user, 2026-11-10: "There Is No Need To Provide Each Person With Their Own Device, this shouldn't last that long": nothing happens under these words once the tablet is on the wall, so
  // they stay `SHARE_READ` s once written, not `READ`'s 3.6 s; never going before the tablet has landed on the wall)
  hold(share, B.onWall + 0.3, SHARE_READ);
  const cost = say('cost', 'Reduce cost', ['A Whole Team Can Share', 'One Single Device'], next(share));
  hold(cost, 0, SHARE_READ); // ("both should stay one second only")
  // 9 · effective teamwork, then seamless engagement (two titles): into the tablet on the wall; the missions done go (a new round: the four in Open); the five at the left. The CEO's order
  // (2026-11-09: "one, one, two, two, one, one"): two people claim, one after the other, each sitting on their mission, then each closes theirs; the words change; two more claim. A new mission
  // is posted each time one is taken; one person is left in the column (no code shown)
  B.into = next(cost);
  B.intoDone = B.into + TR_WALL;
  B.clear = B.intoDone + 0.1;
  boardEvents.push({t: B.clear, type: 'clear', ids: DONE_ORDER});
  const team = say('teamwork', 'Effective teamwork', ['Each Person Uses Their Code', 'To Claim & Close Missions'], B.intoDone - 0.25);
  B.codeCam = team.written; // (the action: the camera goes to the Open column as the five pop in at its left, then the first one leaves)
  B.facesIn = Math.max(team.written, B.clear + 0.45);
  // (Variation 7, the user, 2026-11-11: three claims in a row, each person the mission in front of them, in straight lines; then the closes, straight too: `turnsOf`)
  const {second: login} = turnsOf(boardEvents, false, PRIORITIZED, BOARD_LOADS, B.facesIn, team, at => say('login', 'Seamless engagement', ['There Is No Need For Anyone', 'To Login Or To Sign In'], at),
    n => Math.max(B.codeCam + TR + 0.1, B.facesIn + (n - 1) * FACES + 0.4));
  // 10 · instant update: the picture of the three with their phones (the tablet and the team go); nothing pops (the user, 2026-11-10: "don't show stars in People Working From Separate
  // Devices Remain On The Same Page"): the words, read, the picture pushing in slowly
  B.s10 = next(login);
  const inst = say('instant', 'Instant update', ['People Working From Separate Devices', 'Remain On The Same Page'], B.s10 + TR * 0.55);
  hold(inst, 0, INSTANT_READ); // (it stays `INSTANT_READ` s once written, not `READ`'s 3.6 s: "make this go away faster")
  // 11 · seamless flow: the same picture; three stars (the user, 2026-11-10: "one star on one device then 2 successively"): one person presses on their phone and its star pops, then the
  // star of each of the two other phones, one after the other
  const flow = say('flow', 'Seamless flow', ['An Action On One Device', 'Is Reflected On All Devices'], next(inst));
  B.press = flow.written;
  B.star1 = B.press + STAR.after;
  B.star2 = B.star1 + STAR.then;
  B.star3 = B.star2 + STAR.gap;
  acted(flow, B.star3 + STAR.dur);
  const PRESSES = [{t: B.press, phone: 0}]; // (Adam's phone, at the bottom left; then Maya's at the top, then Ben's at the right)
  const STARS = [{t: B.star1, phone: 0}, {t: B.star2, phone: 1}, {t: B.star3, phone: 2}];
  // 12 · self initiative, then minimal downtime (two titles): the board without its tablet, bigger; the five and the same order as on the tablet ("repeat the five actions here"): two take the
  // top mission and sit on it, each closes theirs, the words change, two more take one; a new mission is posted each time one is taken
  B.s12 = next(flow);
  B.lanesFaces = B.s12 + TR * 0.6;
  const init = say('initiative', 'Self initiative', ['Everyone Is Constantly Guided', 'To Take Initiatives On Their Own'], B.s12 + TR - 0.15);
  LANE_CARDS.forEach((id, i) => Object.assign(life[id], {posted: B.s12, age0: 540 - i * 120})); // (on the board already: the longer the timer, the higher)
  const worked = turnsOf(laneEvents, true, LANE_CARDS, LANE_LOADS, B.lanesFaces, init, at => say('downtime', 'Minimal downtime', ['Efficiency Increases By Reducing', 'Downtime Between Tasks'], at),
    n => Math.max(init.written, B.lanesFaces + (n - 1) * FACES + 0.4));
  const down = worked.second;
  B.end = next(down);
  B.total = B.end + TR + 0.3;

  // ---- where each mission is: the boards played as events (a post at the bottom of Open, a move to the TOP of its new column, a rise to a place in its own column, the missions done going); every
  // mission whose place changes gets a key (the one that moves at the event's time, the ones that make room FOLLOW after). Three spaces: the missions alone ('float'), the tablet ('board'), the board
  // without its tablet ('lane'). A mission that comes from another space glides there ('land').
  const tracks = {};
  const key = (id, k) => { (tracks[id] ??= []).push(k); };
  function play(space, start, cols0, events) {
    const cols = {open: [...(cols0.open ?? [])], claimed: [...(cols0.claimed ?? [])], closed: [...(cols0.closed ?? [])]}, log = [];
    const placeOf = (col, slot) => (space === 'float' ? {float: slot} : space === 'lane' ? {lane: COLUMNS.indexOf(col), slot} : {col, slot});
    const where = () => { const out = {}; for (const c of COLUMNS) cols[c].forEach((id, i) => { if (id) out[id] = {col: c, slot: i}; }); return out; }; // (a column can have empty rows: Variation 7's straight lines)
    for (const c of COLUMNS) cols[c].forEach((id, i) => { key(id, {t: start, place: placeOf(c, i), kind: tracks[id]?.length ? 'land' : 'jump'}); log.push({t: start, id, col: c}); });
    for (const e of [...events].sort((a, b) => a.t - b.t)) {
      const before = where();
      if (e.type === 'pull') { key(e.id, {t: e.t, place: placeOf(before[e.id].col, before[e.id].slot), kind: 'pull'}); continue; } // (out to the right of its own place: nothing changes place)
      if (e.type === 'post') cols.open.push(e.id);
      else if (e.type === 'go' && e.row != null) { // a straight line: it lands on the same row of its new column; the missions under it go up (`up`), or its row stays empty
        const from = before[e.id].col;
        cols[from][before[e.id].slot] = null;
        if (e.up) cols[from] = cols[from].filter(Boolean);
        while (cols[from].length && cols[from][cols[from].length - 1] == null) cols[from].pop();
        while (cols[e.to].length <= e.row) cols[e.to].push(null);
        cols[e.to][e.row] = e.id;
      }
      else if (e.type === 'clear') for (const id of e.ids) { const c = before[id].col; cols[c].splice(cols[c].indexOf(id), 1); }
      else {
        const from = before[e.id].col;
        cols[from].splice(cols[from].indexOf(e.id), 1);
        if (e.type === 'rise') cols[from].splice(e.index, 0, e.id); else cols[e.to].unshift(e.id);
      }
      const now = where();
      if (e.type === 'clear') for (const id of e.ids) { key(id, {t: e.t, place: placeOf(before[id].col, before[id].slot), kind: 'gone'}); log.push({t: e.t, id, col: null}); }
      for (const [id, b] of Object.entries(now)) {
        const a = before[id];
        if (!a) { key(id, {t: e.t, place: placeOf(b.col, b.slot), kind: 'post'}); log.push({t: e.t, id, col: 'open'}); continue; }
        if (a.col === b.col && a.slot === b.slot) continue;
        const mine = id === e.id;
        key(id, {t: mine ? e.t : e.t + (e.type === 'rise' ? 0 : FOLLOW), place: placeOf(b.col, b.slot), kind: mine ? (e.type === 'rise' ? 'rise' : 'move') : 'shift'}); // (a rise: the one it passes goes down as it goes up)
        if (mine && e.type === 'go') log.push({t: e.t, id, col: e.to});
      }
    }
    return {cols, log: log.sort((a, b) => a.t - b.t)};
  }
  const floated = play('float', 0, {}, floatEvents);
  const doneIn = col => DONE_ORDER.filter(id => DONE[id].col === col);
  const boarded = play('board', B.toBoard, {open: floated.cols.open, claimed: doneIn('claimed'), closed: doneIn('closed')}, boardEvents);
  const laned = play('lane', B.s12, {open: LANE_CARDS}, laneEvents);
  for (const list of Object.values(tracks)) list.sort((a, b) => a.t - b.t);
  const countsIn = log => t => { const last = {}; for (const e of log) { if (e.t > t) break; last[e.id] = e.col; } const n = {open: 0, claimed: 0, closed: 0}; for (const c of Object.values(last)) if (c) n[c]++; return n; };
  const countsAt = countsIn(boarded.log), laneCountsAt = countsIn(laned.log);

  // ---- the team: the tablet's column and its turns, gone with the tablet, then the column and the turns of the board without its tablet (`seats`, `crew`, above) ----
  CREW.forEach(who => face(who, {t: B.s10 + 0.45, kind: 'away'}));
  for (const list of Object.values(faces)) list.sort((a, b) => a.t - b.t);

  // ---- what follows the time ----
  const told = st.finish();
  const floatOp = () => 1; // (the missions alone never fade: they glide onto the tablet)
  const laneOp = t => prog(t, B.s12, TR) * (1 - prog(t, B.end, TR));
  const facesOp = t => (t < B.s12 ? 1 - prog(t, B.s10, 0.4 / QUICK, OUT) : laneOp(t));
  // (the camera's moves are transitions: each one in `TR`)
  const FCAMS = V7 ? FLOAT_CAMS7 : FLOAT_CAMS, FL = V7 ? FLOAT_SHIFT : {dx: 0, dy: 0}; // (Variation 7: the missions alone at the left, their words beside them)
  const floatCamAt = t => keyed([{t: 0, v: FCAMS.whole}, {t: B.zoom2, v: FCAMS.close, dur: TR}, {t: B.zoom4, v: FCAMS.points, dur: TR}], t);
  const cameraAt = t => keyed([{t: 0, v: CAMS.whole}, {t: B.doneCam, v: DONE_CAM, dur: TR}, {t: B.camOut, v: CAMS.whole, dur: TR}, {t: B.codeCam, v: CODE_CAM, dur: TR}], t);
  const dimAt = t => prog(t, B.doneCam, TR) * (1 - prog(t, B.camOut, TR)); // (the Open column darkened while the camera is on Claimed and Closed)
  // our tablet ON the tablet of the wall in the picture pushed in `z` times (about it), carried `e` of the way to the frame's place (e 1: the tablet whole, FULL)
  const zoomOf = (z0, e) => z0 * (WALL_ZOOM / z0) ** e;
  const PUSH0 = 1 + PUSH;
  function wallTablet(z, e) {
    const c = {x: mix(WALL_MID.x, FRAME_MID.x, e), y: mix(WALL_MID.y, FRAME_MID.y, e)}, w = WALL_BOX.w * z * (TABLET.w / TABLET.frame.w), k = w / TABLET.w;
    return {x: c.x - (TABLET.frame.x + TABLET.frame.w / 2) * k, y: c.y - (TABLET.frame.y + TABLET.frame.h / 2) * k, w};
  }
  const wallHold = t => clamp((t - B.onWall) / (B.into - B.onWall));
  // Our tablet (and its missions) bent to the angle of the tablet of the wall as it lands on it, and back to flat as it comes out of it: the matrix that takes our tablet's frame to the picture's
  // tablet, `1 - e` of the way (e 1: flat, the tablet whole), or null when it is flat
  // where the tablet is between the whole room and the wall: {z (the picture pushed in), e (1: the tablet whole, 0: on the wall)}, or null
  function wallPhase(t) {
    if (t >= B.toWall && t < B.onWall) { const e = 1 - EASE(clamp((t - B.toWall) / TR_WALL)); return {e, z: zoomOf(1, e)}; }
    if (t >= B.onWall && t < B.into) return {e: 0, z: 1 + PUSH * wallHold(t)};
    if (t >= B.into && t < B.intoDone) { const e = EASE(clamp((t - B.into) / TR_WALL)); return {e, z: zoomOf(PUSH0, e)}; }
    return null;
  }
  // how much our tablet takes the room's warmer, dimmer light (0 to 1: on the wall)
  const wallToneAt = t => { const w = wallPhase(t); return w ? 1 - w.e : 0; };
  function skewAt(t) {
    const w = wallPhase(t);
    if (!w || w.e > 0.999) return null;
    const {e, z} = w;
    const tab = wallTablet(z, e), k = tab.w / TABLET.w, f = {x: tab.x + TABLET.frame.x * k, y: tab.y + TABLET.frame.y * k, w: TABLET.frame.w * k, h: TABLET.frame.h * k};
    const flat = [[f.x, f.y], [f.x + f.w, f.y], [f.x + f.w, f.y + f.h], [f.x, f.y + f.h]];
    const wall = WALL_PTS.map(p => [WALL_MID.x + (p.x - WALL_MID.x) * z + e * (FRAME_MID.x - WALL_MID.x), WALL_MID.y + (p.y - WALL_MID.y) * z + e * (FRAME_MID.y - WALL_MID.y)]);
    return quadMatrix(flat, flat.map((q, i) => [mix(wall[i][0], q[0], e), mix(wall[i][1], q[1], e)]));
  }
  // The tablet {x, y, w, op}: in round the missions at slide 6, onto the wall of the picture at slide 8 (staying there, `ON_WALL`), out of it again at slide 9, gone at slide 10
  function tabletAt(t) {
    if (t < B.toBoard) return {...FULL, op: 0};
    if (t < B.toWall) return {...FULL, op: prog(t, B.toBoard, TR * 0.6, OUT)};
    if (t < B.onWall) { const p = clamp((t - B.toWall) / TR_WALL), e = 1 - EASE(p); return {...wallTablet(zoomOf(1, e), e), op: mix(ON_WALL, 1, clamp(e / 0.35))}; }
    if (t < B.into) return {...wallTablet(1 + PUSH * wallHold(t), 0), op: ON_WALL};
    if (t < B.intoDone) { const p = clamp((t - B.into) / TR_WALL), e = EASE(p); return {...wallTablet(zoomOf(PUSH0, e), e), op: mix(ON_WALL, 1, clamp(p / 0.35))}; }
    return {...FULL, op: 1 - prog(t, B.s10, TR)};
  }
  // The picture of the team: {op, z (about the tablet on its wall), dx, dy (the wall's tablet carried to the frame's middle), origin}; it comes in round our tablet as it goes onto its wall
  function photoAt(t) {
    let op = 0, z = 1, e = 0;
    if (t >= B.toWall && t < B.intoDone) {
      if (t < B.onWall) { e = 1 - EASE(clamp((t - B.toWall) / TR_WALL)); z = zoomOf(1, e); op = prog(t, B.camOut + TR, 0.45 / QUICK, OUT); }
      else if (t < B.into) { op = 1; z = 1 + PUSH * wallHold(t); }
      else { op = 1; e = EASE(clamp((t - B.into) / TR_WALL)); z = zoomOf(PUSH0, e); }
    }
    return {op, z, dx: e * (FRAME_MID.x - WALL_MID.x), dy: e * (FRAME_MID.y - WALL_MID.y), origin: {x: WALL_MID.x - PHOTO.x - SHARE_IMG.x, y: WALL_MID.y - PHOTO.y - SHARE_IMG.y}};
  }
  // The picture of the three with their phones (or our three phones), pushing in slowly, and the stars on the phones: {op, z, phones, stars: [{x, y, p}]}
  function phonesAt(t) {
    const op = prog(t, B.s10, TR) * (1 - prog(t, B.s12, TR)), q = clamp((t - B.s10) / (B.s12 + TR - B.s10)), z = 1 + PUSH * q;
    const mid = {x: PHOTO.x + PHOTO.w / 2, y: PHOTO.y + PHOTO.h / 2};
    const spots = PHONES_PHOTO.src ? PHONES_PHOTO.stars.map(p => { const s = onStage(PHONES_IMG, p); return {x: mid.x + (s.x - mid.x) * z, y: mid.y + (s.y - mid.y) * z}; })
      : TRIO_STARS.map(s => ({x: mid.x + (s.x - mid.x) * z, y: mid.y + (s.y - mid.y) * z}));
    const stars = STARS.filter(s => t >= s.t && t < s.t + STAR.dur).map(s => ({...spots[s.phone], key: `${s.t}-${s.phone}`, p: (t - s.t) / STAR.dur}));
    const presses = PRESSES.filter(s => t >= s.t && t < s.t + STAR.press).map(s => ({...spots[s.phone], key: `press-${s.phone}`, p: (t - s.t) / STAR.press}));
    return {op, z, stars, presses, phones: TRIO.phones.map((p, i) => ({...p, w: TRIO.w, face: TRIO.face, s: mix(0.94, 1, prog(t, B.s10 + i * FACES, TR)) * z,
      list: p.list.map((id, j) => ({id, title: names.mission[id], pill: clock(300 - j * 75 + Math.max(0, t - B.s10))}))}))};
  }
  const frameCtx = t => ({tab: tabletAt(t), cam: cameraAt(t), fcam: floatCamAt(t)});

  // A mission's place: {x, y, s (the card is drawn 334 px wide), col (on the tablet), op, pop, up (off the tablet: the lifted card's shadow), moving (over the others), board (on the tablet)}, or null
  function rectOf(place, ctx) {
    if (place.float != null) { const p = view(ctx.fcam, {x: FLOAT.x, y: FLOAT.y + place.float * PITCH}); return {x: p.x + FL.dx, y: p.y + FL.dy, s: FS * ctx.fcam.z}; }
    if (place.lane != null) return {x: laneX(place.lane), y: LANES.y + place.slot * LPITCH, s: LS};
    return {...slotRect(ctx.tab, ctx.cam, place.col, place.slot), col: place.col};
  }
  const opIn = (place, t, ctx) => (place.float != null ? floatOp(t) : place.lane != null ? laneOp(t) : ctx.tab.op);
  function cardAt(id, t, ctx = frameCtx(t)) {
    const tr = tracks[id];
    if (!tr || t < tr[0].t) return null;
    let i = 0;
    while (i + 1 < tr.length && tr[i + 1].t <= t) i++;
    const k = tr[i], to = rectOf(k.place, ctx), board = k.place.col != null, up = !board;
    let op = opIn(k.place, t, ctx);
    if (k.kind === 'gone') op *= 1 - prog(t, k.t, 0.4, OUT);
    if (k.kind === 'post') { const p = clamp((t - k.t) / POST.fade); return {...to, op: clamp(p / 0.6) * op, pop: mix(0.86, 1, POP(p)), up, board, moving: false}; }
    if (k.kind === 'pull') // out to the right of its place, and it stays there (over the others) until it rises
      return {...to, x: to.x + RISE_PULL * CARD.w * to.s * RISE_OUT(clamp((t - k.t) / RISE_PULL_T)), op, pop: 1, up: true, board, moving: true};
    const dur = k.kind === 'rise' ? RISE_T : k.kind === 'jump' || k.kind === 'gone' ? 0 : k.kind === 'land' ? TR : M, p = dur > 0 ? clamp((t - k.t) / dur) : 1;
    if (p >= 1 || i === 0) return {...to, op, pop: 1, up, board, moving: false};
    const from = rectOf(tr[i - 1].place, ctx);
    if (k.kind === 'rise') { // from where it was pulled out to: up (speeding up), then back in
      const pull = RISE_PULL * CARD.w * to.s, out = 1 - EASE(clamp((p - RISE_UP_PART) / (1 - RISE_UP_PART)));
      return {...to, x: to.x + pull * out, y: mix(from.y, to.y, RISE_UP(clamp(p / RISE_UP_PART))), op, pop: 1, up: true, board, moving: true};
    }
    const e = EASE(p);
    return {...to, x: mix(from.x, to.x, e), y: mix(from.y, to.y, e), s: mix(from.s, to.s, e), op: k.kind === 'land' ? 1 : op, pop: 1, up: up || k.kind === 'move' || k.kind === 'land', board,
      moving: k.kind === 'move' || k.kind === 'land', landing: k.kind === 'land' ? 1 - e : 0, // (`landing`: 1 to 0 as a mission alone lands on the tablet: its deep shadow on the dark goes with it)
      // `air`: how much a mission moving on the tablet is off the board (0 to 1): its deeper, lifted shadow comes as it leaves its place and is back to the resting one as it lands, so the
      // shadow never jumps at either end (the user, 2026-11-10: "add moooore shadows to missions in tablet in all scenes")
      air: Math.min(1, k.kind === 'land' ? 1 : p / 0.25, (1 - p) / 0.25)};
  }

  // A face: in its place in the column ('seat'), going up then across to a mission ('go'), at the mission's right edge, going with it ('edge'), small on its card where the performer is ('spot')
  const edgeOf = c => { const cw = CARD.w * c.s; return {x: c.x + cw - 0.0835 * cw, y: c.y + 0.0747 * cw, size: 0.2725 * cw}; };
  const spotOf = c => ({x: c.x + 12 * c.s, y: c.y + 84 * c.s, size: 38 * c.s}); // (sitting on its mission, where the name is: the CEO, 2026-11-09, "going back to where the name is")
  const seatOf = (i, t, ctx) => (t >= B.s12 ? laneSeat(i) : seatRect(i, ctx.tab, ctx.cam));
  // Variation 7: a person's place in front of row `r` of Open, at the left of the tablet (or of the board without it), at the height of the mission's middle
  const rowSeat = (r, t, ctx) => {
    if (t >= B.s12) return {x: LANES.x0 - LANES.faceGap - LANES.face, y: LANES.y + r * LPITCH + (CARD.h * LS - LANES.face) / 2, size: LANES.face};
    const seat = seatRect(0, ctx.tab, ctx.cam), c = slotRect(ctx.tab, ctx.cam, 'open', r);
    return {x: seat.x, y: c.y + (CARD.h * c.s - seat.size) / 2, size: seat.size};
  };
  const segAt = (who, t) => { const list = faces[who]; let i = -1; while (i + 1 < list.length && list[i + 1].t <= t) i++; return {seg: list[i] ?? null, prev: list[i - 1] ?? null}; };
  function faceRect(seg, t, ctx) {
    if (!seg || seg.kind === 'away') return null;
    if (seg.kind === 'seat') return seatOf(seg.i, t, ctx);
    if (seg.kind === 'row') return rowSeat(seg.r, t, ctx);
    const c = cardAt(seg.card, t, ctx);
    return c ? (seg.kind === 'spot' ? spotOf(c) : edgeOf(c)) : null;
  }
  function faceAt(who, t, ctx = frameCtx(t)) {
    const {seg, prev} = segAt(who, t);
    let rect = faceRect(seg, t, ctx);
    if (!rect) return null;
    let op = 1, pop = 1;
    const d = seg.dur ?? M, p = d > 0 ? clamp((t - seg.t) / d) : 1, from = p < 1 && !seg.pop ? faceRect(prev, t, ctx) : null;
    if (from) {
      const e = EASE(p), size = mix(from.size, rect.size, e);
      if (seg.kind === 'go' && !seg.line) { // (`line`, Variation 7: straight to the mission in front of them, the plain move below) up, then across: a curve whose turn is straight over where it starts, at the height of where it goes (it never stops on the way)
        const a = {x: from.x + from.size / 2, y: from.y + from.size / 2}, b = {x: rect.x + rect.size / 2, y: rect.y + rect.size / 2}, u = 1 - e;
        rect = {x: u * u * a.x + 2 * u * e * a.x + e * e * b.x - size / 2, y: u * u * a.y + 2 * u * e * b.y + e * e * b.y - size / 2, size};
      } else rect = {x: mix(from.x, rect.x, e), y: mix(from.y, rect.y, e), size};
    }
    if (seg.pop) { const q = clamp((t - seg.t) / 0.3); op = clamp(q / 0.6); pop = mix(0.4, 1, POP(q)); }
    if (seg.fadeAt != null) op *= 1 - prog(t, seg.fadeAt, 0.28, OUT);
    op *= facesOp(t);
    // `moving`: on its way (to a mission, with it at its edge, to its place on it): drawn over the faces that are sitting (the user, 2026-11-10: "the avatar that moves should be on top")
    return op > 0.001 ? {...rect, op, pop, moving: seg.kind === 'go' || seg.kind === 'edge' || (seg.kind === 'spot' && p < 1)} : null;
  }

  // a timer's own clock: real time, faster where time is made to go by (the urgency, the priority, the work of the initiative)
  const WARPS = [{from: B.lapse, to: B.lapseEnd, rate: 300}, {from: B.priLapse, to: B.priLapseEnd, rate: PRI_LAPSE.rate}, {from: B.priLapse2, to: B.priLapseEnd2, rate: PRI_LAPSE.rate},
    {from: worked.from, to: worked.to, rate: 40}];
  const clockAt = t => t + WARPS.reduce((s, w) => s + (w.rate - 1) * clamp(t - w.from, 0, w.to - w.from), 0);
  const TONES = {inv: [[B.orange, 'orange'], [B.red, 'red']], ord: [[B.orange, 'orange']], prep: [[B.prepTone, 'orange'], [B.prepRed, 'red']]};
  const toneAt = (id, t) => { let tone = 'green'; for (const [when, c] of TONES[id] ?? []) if (t >= when) tone = c; return tone; };
  // a timer that changes color pops ONCE: up as it changes, held through its colors, back (Inventory Check's through orange and red)
  const pillPopAt = (id, t) => (id === 'inv' ? pulse(t, B.orange - 0.08, 1.22, B.red - B.orange + 0.35) : id === 'ord' ? pulse(t, B.orange - 0.08, 1.22, 0.35) : id === 'prep' ? pulse(t, B.prepTone - 0.08, 1.22, 0.35) * pulse(t, B.prepRed - 0.08, 1.22, 0.35) : 1); // (Prepare Workspace's: once for orange, once again for red)
  // What a mission's card shows at `t` (MissionChip's props and the looks the cut puts on it)
  function chipAt(id, t) {
    const m = MISSIONS[id], L = life[id], claimed = L.claimed != null && t >= L.claimed, closed = L.closed != null && t >= L.closed, end = closed ? L.closed : t;
    const pts = POINTS.includes(id) ? popIn(t, POPS.pts[id]) : null, shown = L.who && L.whoAt != null && t >= L.whoAt; // (the performer's name, once the mission is theirs on the board)
    const name = nameAt(id, t), exec = execAt(id, t);
    return {
      kind: m.kind, title: names.mission[id], points: pts ? m.points : null, ptsO: pts ? pts.o : 0, ptsS: pts ? pts.s : 1, date: '07-14-26', time: m.time, closed, whoId: shown ? L.who : null,
      showExec: claimed, execTime: clock(claimed ? L.exec0 + clockAt(end) - clockAt(L.claimed) : 0), execS: exec.s, execB: exec.b, execW: exec.w, execO: exec.o,
      pillTime: clock(L.age0 + (L.posted == null ? 0 : clockAt(end) - clockAt(L.posted))), pill: COLORS[closed ? 'gray' : toneAt(id, t)], pillPop: pillPopAt(id, t),
      who: shown ? names.person[L.who] : null, whoOn: shown ? prog(t, L.whoAt, 0.4, OUT) : 0, whoS: name.s, whoB: name.b, whoW: name.w, whoO: name.o,
    };
  }
  // What pops and STAYS ({s: its scale, b: how much of its stayed look it has, 0 to 1; w, o: its yellow strip, how much of it is drawn from its left edge and how much it is seen}): up to
  // `look.peak` at `at`, held at `look.big`, back to itself over `TR` from `end`. The strip is drawn from left to right in `STRIP` s as the pop starts (the user, 2026-11-10: "make the strip
  // comes from left to right") and fades with the rest at the end
  function staysAt(at, end, look, t) {
    if (at == null || t < at) return {s: 1, b: 0, w: 0, o: 0};
    const back = prog(t, end, TR), up = mix(1, look.peak, POP(clamp((t - at) / PULSE.up))), held = mix(up, look.big, prog(t, at + PULSE.up + 0.2, PULSE.down));
    return {s: mix(held, 1, back), b: clamp((t - at) / 0.25) * (1 - back), w: EASE(clamp((t - at) / STRIP)), o: 1 - back};
  }
  // A name of slide 6 (b: how bold and black it is, and how much of its yellow strip is there): it pops, then STAYS bigger, bold and black until the words go (the CEO, 2026-11-09: "make these
  // bigger here, make them more pronounced, like black, like bold, these names"), on a yellow strip (the user, 2026-11-10: "a yellow strip behind it for both execution timer and names too")
  const nameAt = (id, t) => staysAt(POPS.who[id], B.namesEnd, NAME, t);
  // An execution timer of slide 7 (b: how bold it is, how far to the left, how much of its yellow strip is there): it pops, then stays bigger, bold, on a yellow strip, at the left of its place,
  // until the words go (the user, 2026-11-10)
  const execAt = (id, t) => staysAt(POPS.exec[id], B.execsEnd, EXEC, t);

  // How much of the color behind the title is seen (0 to 1): only as much as the art goes behind the title (`SHADE`): the tablet's frame (closer on Claimed and Closed, it runs under the words)
  // or a mission (the points' closer look), each as much as it is seen. Nothing behind the title: no color there, so nothing of the art or of its shadow is trimmed by its edge
  function shadeAt(t) {
    const ctx = frameCtx(t), {tab, cam} = ctx, behind = y => clamp((y + ART_DY - SHADE.from) / SHADE.over);
    let most = tab.op > 0.001 ? tab.op * behind(view(cam, {x: 0, y: tab.y + (TABLET.frame.y + TABLET.frame.h) * tab.w / TABLET.w}).y) : 0;
    for (const id of ALL_CARDS) {
      if (most >= 1) break;
      const c = cardAt(id, t, ctx);
      if (V7 && c && (!c.board || c.landing > 0)) continue; // (Variation 7: the missions alone have no words under them, so nothing to keep clear of; nor while they land on the tablet)
      if (c && c.op > 0.001) most = Math.max(most, c.op * behind(c.y + CARD.h * c.s));
    }
    return most;
  }

  return {
    words, fps: CUT_FPS, B, captions, scenes: [], marks: [], title: st.title, names, ui: st.ui, life, seconds: B.total, frames: Math.ceil(B.total * CUT_FPS), cardScale: FS,
    layout, look: {execStrip: V7 ? EXEC_STRIP : null}, // (`look`: the colors a variation changes; null: the film's own)
    ...told, shadeAt, countsAt, laneCountsAt, tabletAt, skewAt, wallToneAt, photoAt, phonesAt, cameraAt, dimAt, floatOp, laneOp, frameCtx, chipAt, cardAt, faceAt,
  };
}

// The cut made from these words (the same object for the same words: a few are kept)
export const makeRedoCut = cutMaker(build);
