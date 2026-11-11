// Increased Efficiency (website Narration (October 14, 2026).docx, section "Increased Efficiency"), made like the other sections (the format is described at the top of live-oversight.mjs and
// dynamic-auditing.mjs; the user, 2026-10-15: "go over increased efficiency, it's not good"): the missions assigned to individuals and to teams, each mission's schedule, points and timer color,
// the priority, the shared tablet with its faces and personal code, the claim and the close, the execution durations and the best performers, the initiative. The art is
// components/sections/EfficiencyStage.jsx.
// The CEO's review of 2026-10-28 (docs/meetings/2026-10-28-ceo-review.md, the user's decisions of 2026-10-29): the schedule, the points and the colors of the timers are shown on two or three missions (`zoomed`);
// the tablet with its team at the bottom right for the shared tablet; two people claim and close two missions, fast; their two closed missions are shown (`zoomed`), what each took and who did it highlighted
// together, no hand; the three people take a mission on their own and the closing words come on the same screen.
// The user's comments on the videos (2026-10-30; they are in `edits.comments`, `node scripts/storyboard.mjs vcomments`): the words first, then the action; one mission's timer before three; a mission is pulled to the
// right before it goes up; the picture of the three people with "A Whole Team Can Share", then, on our tablet, "There Is No Need To Provide…" before the team pops (the user, 2026-11-03).
// The tablet stays when the missions are shown (the user, 2026-11-02, over the CEO's "you don't have a tablet in that": "when we zoom in here to missions, u should keep tablet, and just zoom in to tablet and cut right
// side"): from the board the words are written, the tablet zooms in on its Open column and the gray side cuts it; it stays zoomed through the schedules and the points.
// Timers change in color on one mission of its own (the user, 2026-11-03: "show me just one mission in center, with timer going green, orange, red, for 2 seconds then start the tablet again from scratch with 4 missions posting, the timer mission should be unique"): `view: 'alone'`, then the whole tablet, empty, its four missions posted, the next words, and the tablet zooms in again for the rises.
// The schedules, the points and the timer's colors on the same two missions, out of the tablet (the user, 2026-11-04: "when we say Each Mission Has A Unique Schedule just isolate the two missions without tablet, so hide tablet, keep same two missions
// when saying Reward Points Can Be Added To Increase Motivation and Timers Change In Color To Create A Sense Of Urgency (change time of top one only)"): `pair`, the two top missions of the board lifted out of it as the tablet fades, the top one's timer
// running through the colors (it replaces the zoom of 2026-11-02 for these three scenes and the mission of its own of 2026-11-03); then the tablet from scratch as before.
// The words go before the picture changes (the user, 2026-11-04, every variation: "fade out Timers Change In Color To Create A Sense Of Urgency before going to next art. always fade out before changing art for the whole video"): `clearFirst`.
const board = extra => ({view: 'board', ...extra});
const zoomed = extra => board({zoom: 1, faces: 0, ...extra}); // (`EfficiencyStage.jsx`: `ZOOM`)
const pair = extra => ({view: 'pair', zoom: 0, faces: 0, sched: 0, pts: 1, pulse: 0, ...extra}); // (`EfficiencyStage.jsx`: `Pair`)
// The whole video faster (the user, 2026-10-30: "make the animations of movements/scale/opacity on all animations same speed, and make all of them 30% faster", then "make it faster more"): `quick` takes a time as it
// was and gives it at 1.7 times the speed (30% faster, twice), so 1.3 s is now 0.76 s. The one number to change.
const FASTER = 1.7, quick = seconds => seconds / FASTER;
// A person claims or closes a mission (`mission`: sig | ord) with their code, with no cursor (the user, 2026-10-30: "remove the cursor, when claiming move the avatar to the right position of the mission ...
// the code dot should be one by one show up in a smooth fast animation"): the avatar of the team goes to the mission's right edge and the code panel is there, the six dots come in one by one (the player
// draws them by the clock: `dots` in the profile), then the panel goes and the mission moves (`done`: claimed or closed). Claimed, the avatar gets small and sits on the card where the performer is and goes with it;
// closed, it is back in its place, at the left of the tablet since 2026-11-03 (it fades out on the mission and in there: `BACK`), and the card has the name (the user, 2026-10-30: `Team` in the stage).
// A claim is a grab (the user, 2026-10-30: "he should move it and move with it to the right before going to the name position, like the avatar is grabbing the mission"): the avatar stays at the mission's right
// edge while the mission goes to Claimed, on After Effects' curve, as the missions of the colors' scene do; once it is there the avatar goes to the name's place.
const grabs = (who, mission, more = {}) => [{name: `${who} grabs the mission`, state: {...more, [mission]: 'claimed'}}, {name: `${who}: claimed`, state: {badge: 0}}];
const turn = (who, mission, action, done) => [
  {name: `${who} goes to the mission`, state: {who, target: mission, action, badge: 2, code: 0}},
  {name: `${who} types the code`, state: {code: 6}},
  ...(done === 'claimed' ? grabs(who, mission, {code: -1}) : [{name: `${who}: ${done}`, state: {code: -1, badge: 0, [mission]: done}}]),
];
// The dots keep their own quick beat, as much faster: 0.05 s each (`dots`); the avatar and the mission move as in the queue (`CODE_QUEUE`).
const CODE_PACE = {dots: {lead: quick(0.04), each: quick(0.09), fade: quick(0.16), tail: quick(0.14)}};
// From the two closed missions on their own to the board after them, with no fade (the user, 2026-10-30: "those missions shouldn't transition to the tablet by fading out, the tablet should show up with no missions and
// those exact missions should go to tablet", "those missions should go to closed not to open, and the avatars shouldn't be there yet"): the empty tablet comes in behind the cards, they glide to Closed as they are
// (`landCards` in components/storyboardPlayerDom.js), four other missions come into Open as they land, then the three people pop, before the next words (the user: "before this show the avatars"). (`tablet`: the board they go on)
const team = n => ({name: `${n} of the team`, state: {faces: n}});
// The people show up one after the other, very fast (the user, 2026-10-30: "especially showing avatars should one after one very fast"): a run of `team` steps is played as one slide, each avatar popping `each`
// seconds after the one before (`pops` in components/storyboardPlayerDom.js). Seconds as they are, not by `quick`.
// On the team board the four missions pop with them, at that same speed, the first mission with the first person (the user, 2026-11-02: "show missions and avatars same time same speed as we have avatars right now"): `with`: the slides
// "mission 1…4" that come right after the team are played as part of its run, the column's count goes up with the cards, and the end of the video stays the 0.26 s still of the video's one speed. The board's slides are not touched.
// One speed for a mission being posted, on a phone or on a tablet (the user, 2026-11-02: "posting missions here should be faster ... a speed of posting missions should be same for all missions in video even in tablet, mission posting speed in
// "Work Missions Can Be Asigned To Teams on Team Boards" should be a little slower, and take it as refrence for all missions in video"): the team board's, a little slower: `each` seconds from one to the next, `fade` seconds for one to pop in. The one
// place to change it. On the phones a round at a time, each phone one more (`across`); the team pops with its missions at this speed; the two missions the tablet zooms out to go by it too (`post` of a `slides` entry, from `at` of that move).
const POST = {each: 0.15, fade: 0.34}; // (then "make a little slower", "0.15": 0.15 s apart, the pop in the same proportion)
const TEAM_POPS = {label: 'of the team', selector: '.sec-team > span', lead: 0.02, each: 0.09, fade: 0.22, tail: 0.1, with: {label: ': mission ', selector: '.mi-card-button', tally: {selector: '[aria-label="open missions"] .tbl-tab', words: 'Open - '}, tail: quick(0.45), ...POST}};
const PHONE_POPS = {label: ': phones ', selector: '.sec-phone-card', across: 3, tally: {selector: '.ph-tab.is-active', words: 'Open - '}, lead: 0.02, ...POST, tail: quick(0.45)};
const TABLET_POPS = {label: ': posted ', selector: '.mi-card-button', tally: {selector: '[aria-label="open missions"] .tbl-tab', words: 'Open - '}, lead: 0.02, ...POST, tail: 0}; // (the empty tablet after the timer mission, its four missions posted: the top one first; no still after the last: the next words start at once)
// Then the people work as a queue (the user, 2026-10-30: "show the avatars taking actions by claiming a mission then close it, and so on for all avatars ... the one on the far left goes and claim the mission and
// so on"): the one on the far left goes to a mission, grabs it and carries it to Claimed (`grabs`), goes to the name's place on it, then goes straight back to the right end of the row (`Team` in the stage: `row`;
// `rest`: who stays in the row meanwhile) as the mission moves to Closed (the user, 2026-10-30: "then it should go to dock bottom right without going to the right of the mission, just fade in the name, bold a bit then unbold,
// the weight of the text should be smooth bolding, not harsh transitioning": `NAME_IN`, seconds from the start of the slide: `namesAt` in components/storyboardPlayerDom.js); then the next one. No code: `turn` has
// shown it, this is the quick one ("boom ta ta"). The avatar stops only on the mission: `QUEUE`. Since 2026-11-03 the row is a column at the left of the tablet, the one at the top goes first, and the one who closes does not go
// back: it fades out on the mission and in at the bottom of the column (`BACK`).
const takes = (who, mission, rest) => [
  {name: `${who} goes to the mission`, state: {who, target: mission, badge: 2, row: rest}},
  ...grabs(who, mission),
  {name: `${who}: closed`, state: {[mission]: 'closed', row: [...rest, who]}},
];
// The timers of the scene count over an hour however long it takes (the user, 2026-10-30: "the timers should be faster in this scene mimiquing an hour passed and a lot of work has been done", then "make it faster a bit more"): `FASTER` shortens the scene, so it raises their rate too.
const HOUR_PASSES = {scenes: ['initiative'], rate: 200 * FASTER};
// One speed for the whole video, the one of "Timer Colors Create A Sense Of Urgency" (the user, 2026-10-30: "the missions just move super fast, it should be slow, but on a curve animation ... like in after effects where
// u have 70% left and right, so it's slow faster a bit then slow", then "use that animation speed as a reference for all animations in this video"), faster than it was (`quick`): a slide with no time of its own
// has 0.17 s at this video's pace, so everything that moves, scales or fades is told here: 0.76 s on After Effects' Easy Ease with 70% influence on both sides (`easyEase` in lib/storyboardPlayer.mjs), 0.26 s more once it
// is there. That is every step a scene goes on with (`End of the chapter`, the slides' label), every slide a scene's words come on (`/words`: the old words fade at this speed too, also where only the words change, and
// a scene that only shows something has no beat of its own, which would hold the pen back after the move: `beat`), the yellow outlines (`fade`), the title and the software a part opens on (`titleIn`), a name on a card
// (`NAME_IN`) and the cross between two parts on the All videos page (`cross`; the words of the part that comes in wait for the old ones to go: `firstPen`). Not moves, so as they were: the pen's 30 letters a second and
// the timers. Only the dots of a code and the avatars of the team (with the team board's missions) coming in keep a beat of their own, quicker ("in a smooth fast animation", `CODE_PACE`; "one after one very fast", `TEAM_POPS`).
// The missions of the phones come after the words (the user's comment on the video, 2026-10-30: "finish sentence and then start the action"; they came with the first word before). The picture of the three people is
// seen before its words are written ("show photo ... and then show the text"): it opens "One shared tablet", so the cross brings it in and that video's `firstPen` waits for it.
const STEADY = {move: quick(1.3), hold: quick(1.75), influence: 0.7};
// A mission that goes up is pulled to the right first, goes up beside the others and comes back in (the user's comment on the video, 2026-10-30: "Pull to the right before going up"): `pull`, a share of the card's
// width (`pullKeys` in components/storyboardPlayerDom.js). Its way is longer than a straight glide, so it has more time to go at the same speed.
const RISE = {move: quick(1.75), hold: quick(1.75) + STEADY.hold - STEADY.move, pull: 0.3};
// From the picture to our tablet, in one move at the video's one speed (the user, 2026-11-02: "the fade in of tablet was so slow I want it to be smooth", then "no I shouldn't see fully the tablet in ai image, I should see the tablet UI asap"): our
// tablet comes in on the picture's own as the zoom starts and grows with it to its place, so the picture's own is never seen big (`over`, `data-sec-land` on the picture, `landOn` in components/storyboardPlayerDom.js).
const ZOOM_OUT_POST = {post: {...POST, at: 0.4}, move: (POST.each + POST.fade) / 0.6, hold: (POST.each + POST.fade) / 0.6 + STEADY.hold - STEADY.move}; // (the two missions the tablet zooms out to pop once Open is on the picture, 40% into the move: the move is as long as their two pops need)
// The schedules come beside the two missions, and go at the points (the user, 2026-11-04: "when schedule fade in just move missions to left before faded in and fade out and move missions to right"): two steps one after the other,
// the missions making room then the schedules fading in, the schedules fading out then the missions moving back (`besideOf` in components/storyboardPlayerDom.js), each at the one speed, so those moves are twice as long. `still`: the seconds after it all.
const TWO_STEPS = still => ({move: 2 * STEADY.move, hold: 2 * STEADY.move + still});
const MOVES = {'/words': {...STEADY, beat: false}, 'priority/before': {...STEADY, beat: false}, 'intro/words': {hold: STEADY.move + quick(1.7)}, 'close/words': {move: 0.05, hold: STEADY.hold - STEADY.move}, 'End of the chapter': STEADY, 'over the picture': {...STEADY, over: true}, 'performers/end ': {...STEADY, ...ZOOM_OUT_POST}, 'schedule/end': {...STEADY, ...TWO_STEPS(quick(2.5) - STEADY.move)}, 'points/words': {...STEADY, beat: false, ...TWO_STEPS(STEADY.hold - STEADY.move)}, 'and rises': RISE, 'goes second': RISE, 'goes to the top': RISE, 'Outline on': {fade: STEADY.move, hold: STEADY.hold + 0.1, influence: STEADY.influence}}; // (in this order: a slide takes every entry it matches, the last one wins)
// One mission's timer shows what the colors are before the board's missions do it (the user's comment on the video, 2026-10-30: "Show only One mission before going to three"; 2026-11-02: "pop once, go over colors then remove the pop,
// not pop pop pop, it should be a mature good looking animation"; 2026-11-03: "timer going green, orange, red, for 2 seconds"): one slide, drawn by the clock (`profile.pulse`, components/storyboardPlayerDom.js): the pill grows once (`up`
// seconds, by `grow`), goes green, orange, red, and settles (`down`), both on After Effects' curve, 2 s from the first move of the pop to the last. A color changes at once. The slide's own picture is the last one.
const COLOR_SECONDS = 2, COLOR_RUN = {label: 'its timer runs through the colors', selector: '[data-iq-target="pair-inv-pill"]', colors: ['#007a33', '#ed7f04', '#bd1f59'], each: (COLOR_SECONDS - 2 * quick(0.5)) / 3, up: quick(0.5), down: quick(0.5), grow: 0.18, influence: STEADY.influence, tail: STEADY.hold - STEADY.move};
// (the name fades in at the one speed, swelling as it comes (`swell`: seconds after it starts) and settling within its slide: the next person is on the way by then)
const NAME_IN = {lead: quick(0.2), fade: STEADY.move, swell: 0.18, up: 0.25, down: 0.25, tail: 0.03, stroke: 0.5, influence: STEADY.influence};
// An avatar of the queue stops only on the mission (the user, 2026-11-03, on an avatar at the name's place on a claimed mission: "the avatars shouldn't stop unless it's in the mission like actually doing the task, otherwise move"; before it "faster but when
// moving, not how much the avatar settles"; a version with no stop at all was refused: "revert back to what we had"): from the row to the mission, with it to Claimed and to the name's place is one move with no stop. It stops there `ON_MISSION` seconds,
// doing the task, then is back in the row as the mission moves to Closed (a fade since 2026-11-03: `BACK`), and the next person leaves as it comes in. The avatars are drawn by the clock across the slides (`faces` of the profile, `facePlan` in components/storyboardPlayerDom.js).
// `QUEUE`: what each slide lasts: the two with no move only change under the avatar. `QUEUE_FACES`: when each step of the avatar starts, in seconds from the start of its slide, what it lasts (without `seconds`: the slide's own move) and its curve: light,
// with no slow start; only the two that land have the video's own end (`LAND`). The mission starts to go just before the avatar gets to it, on the slide's curve, which is the avatar's, so it stays on the card's edge. The ones in the row go with the same step.
// `QUEUE_PACE` (then "make it a tiny bit slower"): the one number for how fast it all moves; the stop on the mission is not in it.
// Back in the queue with no trip (the user, 2026-11-03, with the team moved to the left of the tablet: "when closing a mission, just fade in in left side don't go back with an animation"): as the mission goes to Closed, the one who closed it fades out
// where it is and fades in at the bottom of the column (`BACK`: `fade` [out, in] of a `faces` entry, seconds, on `curve`: `legsFade` in lib/storyboardPlayer.mjs). In the queue the fade out is half before the mission starts to go, so the avatar is all but gone
// before the card leaves it; it is the end of the stop on the mission. The others have closed up a whole place when it left, so its place is free (`ROW` in the stage).
const ON_MISSION = 0.4, QUEUE_PACE = 1.12, paced = seconds => seconds * QUEUE_PACE, GOING = [0.3, 0.3], LAND = [0.3, STEADY.influence], queueSlide = (move, hold, [influence, out] = GOING) => ({move, hold, natural: 0, rest: 0, influence, out});
const BACK = {fade: [paced(0.2), paced(0.4)], curve: [STEADY.influence, STEADY.influence]};
const QUEUE = {'goes to the mission': queueSlide(0, paced(0.1)), 'grabs the mission': queueSlide(paced(0.6), paced(0.68)), ': claimed': queueSlide(0, paced(0.13) + ON_MISSION), ': closed': queueSlide(paced(0.6), paced(0.83), LAND)}; // (about 2.35 s a person)
const QUEUE_FACES = {'goes to the mission': {at: paced(-0.29), seconds: paced(0.55), curve: [0.25, 0.3]}, 'grabs the mission': {at: 0, curve: GOING}, ': claimed': {at: paced(-0.32), seconds: paced(0.45), curve: LAND}, ': closed': {at: -BACK.fade[0] / 2, ...BACK}};
// The claim and the close with the personal code move the same way (the user, 2026-11-03: "fix the movement in "Each Person Uses A Unique Code To Claim And To Close Missions"", "make [it] matches" the queue): the same steps at the same pace, the same stop on the
// name's place, the next person leaving as the one before lands. One more stop: the avatar has to type, so it lands at the mission's edge (`LAND`) as the code panel comes in (the slide's move, so a slide with a move here) and stays for the dots (`dots`, `CODE_PACE`).
// A close fades as in the queue (`BACK`), from the start of its slide, with the code panel: before it the last dot is still coming in.
const CODE_QUEUE = {...QUEUE, 'goes to the mission': queueSlide(paced(0.3), paced(0.38))};
const CODE_FACES = {...QUEUE_FACES, 'goes to the mission': {at: paced(-0.25), seconds: paced(0.55), curve: LAND}, 'types the code': {at: 0, curve: GOING}, ': closed': {at: 0, ...BACK}};
const TABLET_AGAIN = board({zoom: 0, lit: 0, board: 4, tone: 3, pts: 1, sched: 0, faces: 0, sig: 'open', ord: 'open', code: -1, badge: 0}); // (red, orange, orange, green, with the points: the board the rises of the colors end on, and the one our tablet comes in as over the picture)
const NEXT_BOARD = board({zoom: 0, lit: 0, board: 4, more: 1, tone: 3, pts: 1, sched: 0, faces: 0, sig: 'closed', ord: 'closed', code: -1, badge: 0}); // (the two closed missions in Closed, four others in Open: "Teams Are Constantly Guided")
// (the user, 2026-10-29: "make all text speed 30 letters per second"; a scene's highlight + words then take what the words need) (the CEO, 2026-10-28: "I don't need the finger, just pop them up and highlight
// them": `handless`, no hand on what is only shown)
// (`clearFirst`: before every change of screen the words fade out, at the video's one speed, then the screen changes and the next words are written: `~clear` in directorOf, components/storyboardPlayerDom.js; `end` for the part
// whose next one opens on another screen, the picture of the three people)
const FAST = {beat: {seconds: 1.8}, profile: {handless: true, tempo: 0.6, natural: 0.3, rest: 0.2, slides: MOVES, pops: [TEAM_POPS, PHONE_POPS, TABLET_POPS], titleIn: STEADY.move, firstPen: STEADY.move * 0.7, clearFirst: STEADY}}; // (a slide that only writes words stays 0.3 s by itself and rests 0.2 s, as Live Oversight's full board; what moves goes by `MOVES`) (`firstPen`: 70% into the cross, the old words are all but gone)
const EACH_CODE = 'Each Person Uses A Unique Code / To Claim And To Close Missions'; // (one sentence over the claim and the close: the user, 2026-11-02, of "And To Close A Mission": "remove this and keep just Each Person Uses A Unique Code To Claim And To Close Missions")
export default {
  id: 'increased-efficiency',
  board: 'increased-efficiency-v3',
  name: 'Increased Efficiency',
  stage: 'increased-efficiency',
  view: 'tablet',
  cross: STEADY, // (the All videos page: the next part comes in over the one before at the video's one speed: `crossOf` in lib/storyboardAllVideos.mjs)
  base: {view: 'board', phones: 0, board: 4, sched: 0, pts: 0, tone: 0, faces: 0, code: -1, action: 'Claim', badge: 0, who: 'adam', target: 'sig', sig: 'open', ord: 'open', cards: 2, zoom: 0, cleared: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'There Is No Need To / Micro-Manage People'},
    // (the user's comments on the video, 2026-10-30: "finish sentence and then start the action / the action "4 missions"", "Show Text, then avatars and then missions in sequence": the words, then four missions on each phone (the user,
    // 2026-11-02: "it means 4 missions per phone"), a round at a time, each phone one more; on the team board the words, then the team pops at its left (its bottom right before 2026-11-03), as in "One shared tablet", with its four missions: the two runs below play as one, `TEAM_POPS`)
    {id: 'individuals', name: 'Assigned to individuals', words: 'Work Missions Can Be Automatically / Assigned To Individuals', point: ['phone-maya-3', 'phone-maya-2', 'phone-maya-1', 'phone-adam-0'], art: {view: 'phones', phones: 0},
      end: [1, 2, 3, 4].map(n => ({name: `phones ${n}`, state: {phones: n}}))},
    {id: 'teams', name: 'Assigned to teams', words: 'Or To Teams On Team Boards', point: ['card-prep', 'card-sig', 'card-ord', 'card-inv'], art: board({board: 0, sched: 0, pts: 0, tone: 0, faces: 0, sig: 'open', ord: 'open'}),
      end: [...[1, 2, 3].map(team), ...[1, 2, 3, 4].map(n => ({name: `mission ${n}`, state: {board: n}}))]},
    // Schedules, points and urgency: the video opens on the board the one before ends on (`fromBefore`), the words are written, the tablet zooms in and everything but two missions dims (nothing leaves the board: the user, 2026-11-02, "do not remove other missions, just dim everything"); the schedules come beside them (the
    // cards keep their place in the column: no tablet moves); at the points the schedules fade out, and there are no schedules from there on (the user, 2026-10-30: "when we reach reward points slowely fade out the schedule");
    // then one mission of its own in the middle, not one of the board's, its timer running through the colors; then the tablet starts again, whole and empty, and its four missions are posted; then the next words, written on that board (`fromBefore`: the user,
    // 2026-11-03, "show Critical Work Is Automatically Prioritized as soon as showing tablet, and after missions posting but before mission movement"), the tablet zooms in again as it was before the one mission ("zoom in back to tablet right like we have before showing one mission"),
    // three missions go orange, green, green / orange, orange, green / red, orange, orange (the user's comments on the video, 2026-10-30), and it zooms out
    // (since 2026-11-04 the two missions are lifted out of the board as the tablet fades, and stay by themselves through the schedules, the points and the colors, the top one's timer going green, orange, red: `pair`)
    {id: 'schedule', name: 'Unique schedules', words: 'Each Mission Has A Unique Schedule', fromBefore: true, art: pair(), end: [{name: 'the schedules', state: {sched: 1}}]},
    {id: 'points', name: 'Reward points', words: 'Reward Points Can Be Added / To Increase Motivation', art: pair(), marksLate: true, marksTogether: true, marks: [{target: 'pair-inv-points'}, {target: 'pair-ord-points'}]},
    {id: 'urgency', name: 'Timer colors', words: 'Timer Colors Create / A Sense Of Urgency', art: pair(),
      end: [{name: 'its timer runs through the colors', state: {pulse: 1}}, {name: 'the tablet starts again', state: board({board: 0, pulse: 0})}, ...[1, 2, 3, 4].map(n => ({name: `posted ${n}`, state: {board: n}}))]},
    {id: 'priority', name: 'Automatic priority', words: 'Critical Work Is / Automatically Prioritized', fromBefore: true, art: zoomed({cards: 3, tone: 0, pts: 1, sched: 0}),
      end: [{name: 'the middle one turns orange and rises', state: {tone: 1}}, {name: 'the bottom one turns orange and goes second', state: {tone: 2}}, {name: 'it turns red and goes to the top', state: {tone: 3}}, {name: 'the tablet zooms out', state: {...TABLET_AGAIN, lit: 1}}]}, // (`lit`: the cards shown stay over the shade as it goes: they do not dim for a moment)
    // One shared tablet: the picture of the three people in the tablet's place, then its words (the user's comment on the video, 2026-10-30: "show photo of three people AI generated, and then show the text"); the picture zooms in to
    // the tablet on its wall, and our tablet fades in over it, with the same boundaries (the user, 2026-11-02: "it's like u zoom in to the tablet then fade in our tablet with same boundries as tablet for the frame"; then "I should see the
    // tablet UI asap": it comes in on the picture's tablet as the zoom starts and grows with it; `over` in `MOVES`); the board the tablet zoomed out to, with no team yet, "There Is No Need To Provide…", and only then the team at the left
    // of the tablet (the user, 2026-11-03: ""A Whole Team Can Share One Single Device" should show image of the three persons, then when u zoom in the tablet and before showing avatars say "There Is No Need To Provide Each Person With Their Own
    // Device" before "Each Person Uses A Unique Code To Claim And To Close Missions""); on it two people claim and close two missions
    {id: 'shared', name: 'One shared tablet', words: 'A Whole Team Can Share / One Single Device', art: {view: 'photo'}, end: [{name: 'our tablet comes in over the picture', state: TABLET_AGAIN}]},
    {id: 'device', name: 'No device for each', words: 'There Is No Need To Provide / Each Person With Their Own Device', art: TABLET_AGAIN, end: [1, 2, 3].map(team)},
    {id: 'claim', name: 'Claim a mission', words: EACH_CODE, art: board({faces: 3}), end: [...turn('adam', 'sig', 'Claim', 'claimed'), ...turn('maya', 'ord', 'Claim', 'claimed')]},
    {id: 'close', name: 'Close a mission', words: EACH_CODE, art: board({}), end: [...turn('adam', 'sig', 'Close', 'closed'), ...turn('maya', 'ord', 'Close', 'closed')]},
    // What it shows: the video opens on the board the one before ends on (`fromBefore`), the words are written, the tablet zooms in on its Closed column, as it did on Open for the schedules (the user, 2026-11-02: "zoom in on tablet same way
    // on missions in 0:55 to 1 minute for those two completed missions"), everything but the two closed missions dimmed; what each took and who did it highlighted together; it zooms out as four other missions come into Open, the three
    // people pop before the next words (the user, 2026-10-30: "before this show the avatars"); then the tablet with three people and four missions: they take a mission on their own
    {id: 'execution', name: 'Execution duration', words: 'Each Execution Duration / Is Measured', fromBefore: true, art: zoomed({zoom: 2}), marksLate: true, marksTogether: true, marks: [{target: 'card-sig-exec'}, {target: 'card-ord-exec'}]},
    {id: 'performers', name: 'Best performers', words: 'The Best Performers / Are Easily Recognized', art: zoomed({zoom: 2}), marksLate: true, marksTogether: true, marks: [{target: 'card-sig-who'}, {target: 'card-ord-who'}], end: [{name: 'the tablet zooms out', marks: false, state: {...NEXT_BOARD, lit: 2}}, ...[1, 2, 3].map(team)]},
    {id: 'initiative', name: 'Teams take initiative', words: 'Teams Are Constantly Guided / To Take Initiatives On Their Own', art: {...NEXT_BOARD, faces: 3, cleared: 1}, // (the two closed missions fade out as these words come: `cleared` in the stage)
      end: [...takes('ben', 'inv', ['maya', 'adam']), ...takes('maya', 'desk', ['adam', 'ben']), ...takes('adam', 'room', ['ben', 'maya'])], marksAfter: true, marksTogether: true, marks: [{target: 'card-inv-who'}, {target: 'card-desk-who'}, {target: 'card-room-who'}]}, // (who took each one, outlined together: the cards' own outlines would pop over their neighbours in the column)
    {id: 'conclusion', name: 'The closing words', closing: true, words: 'Efficiency Increases / By Reducing Downtime / Between Tasks', art: board({})}, // (not a card of its own: the CEO, 2026-10-28, "it pops up Efficiency … right there")
  ],
  details: {
    assign: {scenes: {
      individuals: ['Each person has a personal board.', 'Missions arrive on it by themselves.'],
      teams: ['A team board has missions too.', 'They are posted as they are due.'],
    }, each: ['teams']},
    board: {scenes: {
      schedule: ['Each mission has its own schedule.'],
      points: ['Points can be added to a mission.'],
      priority: ['A mission turns orange and rises.', 'Another turns orange, then red, and goes to the top.'],
    }},
    tablet: {scenes: {
      shared: ['The whole team shares this tablet.'],
      claim: ['A person goes to the mission.', 'Types their personal code.', 'The mission moves to Claimed.'],
      close: ['The person goes to the mission again.', 'Types the code once more.', 'The mission moves to Closed.'],
    }},
    results: {scenes: {
      execution: ['The execution time of each mission is kept.'],
      performers: ['And the name of who did it.'],
      initiative: ['Someone takes the next mission on their own.'],
    }},
  },
  // (the user, 2026-10-29: "make the words show up faster, do it fast, start with increased efficiency"; then "make all text speed 30 letters per second"): the pen writes 30 letters a second in every
  // video, the detailed twins too, so a scene's highlight + words take the highlight's fade + the words' letters / 30 (the scene still stays 0.7 s once the words are written)
  // (the CEO, 2026-10-28: "the timers are not moving, eventually they should be moving in a quick way": in the colors' scenes the timers count 10 seconds a second)
  chunks: [
    {id: 'assign', title: 'Missions assigned to individuals and teams', lines: ['intro', 'individuals', 'teams'], ...FAST},
    {id: 'board', title: 'Schedules, points and urgency', lines: ['schedule', 'points', 'urgency', 'priority'], ...FAST, profile: {...FAST.profile, clearFirst: {...STEADY, end: true}, pulse: COLOR_RUN, tick: {scenes: ['urgency', 'priority'], rate: 10}, joins: true}}, // (`joins`: it goes on from the tablet the video before ends on: lib/storyboardVideos.mjs)
    {id: 'tablet', title: 'One shared tablet', lines: ['shared', 'device', 'claim', 'close'], ...FAST, profile: {...FAST.profile, ...CODE_PACE, slides: {...MOVES, ...CODE_QUEUE}, faces: CODE_FACES, firstPen: STEADY.hold, joins: true}}, // (`firstPen`: the picture comes in with the cross, its words are written 0.26 s after it is in)
    {id: 'results', title: 'What it shows', lines: ['execution', 'performers', 'initiative', 'conclusion'], ...FAST, profile: {...FAST.profile, slides: {...MOVES, ...QUEUE}, faces: QUEUE_FACES, names: NAME_IN, tick: HOUR_PASSES, joins: true}},
  ],
};
