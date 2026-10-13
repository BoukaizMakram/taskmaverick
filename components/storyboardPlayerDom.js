// The DOM side of the storyboard's video (components/StoryboardPlayer.jsx). Two stages are kept, drawn
// exactly like a frame of the board (the demo's own HTML, then what was changed on the storyboard put
// on it: applyEdits), so the video shows what the board shows. One holds the frame on; to go to the
// next, the other draws it, and the two are played into each other over the move (lib/storyboardPlayer.mjs):
// an asset that is in both glides from where it was to where it is, one that is only in the first fades
// out, one only in the second fades in; two frames that are not drawn the same way (another scene) just
// fade. The moves are Web Animations, set once and paused: showing any moment (playing, or the bar
// dragged) is setting their time, so it always looks the same and is as smooth as the screen is.
// The words on the right are always WRITTEN by a pen (a chalkboard hand, about a second a line); a title fades in; nothing is ever shown half
// typed or half faded; what is highlighted is shown first and the highlight comes after (the user, 2026-10-08: "don't worry about the slides,
// just make me a good video"). The slides are only what the video is built from: the director (directorOf) drops the ones that only hold the
// start of the next one's words and the ones that look like the one before, and tells each frame what comes in late, what is written and how
// long it is on. With the right side gone (the Panel parked off the slide) the art is centered.
import {ANIM_CPS, animSeconds, layersOf, letterCount} from '@/lib/storyboardEdits.mjs';
import {LATE, ease, easeInv, fadeFrames, isArt, isOverlay, isTypingStep, locate, pairLayers, pairLists, roleOf, sameLook, takeOver, timelineOf, windowEasing, windowKeys, WRITE, writeProgress} from '@/lib/storyboardPlayer.mjs';
import {FONT_STACK, STAGE, applyEdits, bubblePad, drawShape, elementOf, frameHtml, isBubble, moveTo, parentScale, parseStyle, placeTimelines, scaleOf, setTextNumbers, sizeTo, translateOf, whenFontsLoaded} from './storyboardDom';
import {prepareWriting} from './storyboardHandwriting';
import {clickTarget, targetSelector} from '@/lib/demoTargets.mjs';
import {LESSON_FILM, LESSON_PLAY, LESSON_TARGETS, lessonAsset, lessonHtmlOf} from '@/lib/storyboardLesson.mjs';
import {HAND_STOPS as QUALITY_STOPS, RATE_LABELS} from '@/lib/improvedQualityV2Story.mjs';
import {HAND_STOPS as EFFICIENCY_STOPS} from '@/lib/efficiencyV2Story.mjs';

const STOPS = {'improved-quality-v2': QUALITY_STOPS, 'increased-efficiency-v2': EFFICIENCY_STOPS}; // (the demos' hand: what it clicks, chapter by chapter)

const STD_MOVE = 0.6; // every move of the video takes as long: the cursor going somewhere, a click (it presses, then the screen changes), a title and the art changing over
const END_CLICK = 0.95; // the last click of a part, made at the end of its last frame (press, ring, the cursor fades)
const CLICK_TOTAL = 1.15; // a click move: the cursor presses, the screen changes (0.3-0.6 of it), THEN the cursor goes on to the next (0.66-1.0 of it)
const TITLE_HOLD = 2.4, SCENE_MOVE = STD_MOVE, CLICK_MOVE = STD_MOVE; // a title stays long enough to read
const ZOOM_MOVE = 0.9; // the art pushed in or pulled back (its own scale changes by a third or more): a zoom is slower than the other moves, so it is seen
const TITLE = {in: 0.8, from: 0.7, grow: 0.1}; // a title (and the conclusion) fades in small and gets bigger (the user, 2026-10-09), and fades out growing
const TIP = {x: 16 / 42, y: 1 / 52};   // the fingertip of the cursor, in its box (components/DemoHand.css)
const HOVER = {lead: 0.1, fade: 0.3, pause: 0.15, stroke: '0.8px', transition: '-webkit-text-stroke-width 0.3s ease'}; // what the cursor rests on turns bold (a text stroke: the text does not move) a moment after it arrives; then a short pause before the click
const ROW_HOVER = {size: 2, weight: 0.021}; // a row of the tablet's menu under the cursor (a profile's `hover.row` says otherwise): its words get `size` px bigger and `weight` em of text stroke, and a yellow rectangle comes around the row. 0.021 em of stroke on the 400 the menu asks for (Montserrat is loaded at 500, 600, 700: 400 is drawn as 500) has the ink of a real 600 (measured on a canvas: 477 against 477 px of ink at 15 px)
const PLAY_SECONDS = 4.5; // a video that plays is on for this long after its timeline is in
const HAND_FROM = [360, 300]; // a cursor that comes in glides from this far (stage px) away when there are no words to come out of
const CLICKABLE = 'button, a, [role=button], .bn-menu-item, .iq-kb-card, [data-iq-target], .iq2-kb-film, .chip-rate, .iq-rate-knob'; // what a cursor can click in the tablet
const DRAG = {end: 0.75, swipe: 200}; // a held stop: the cursor presses (to 0.3 of the click), drags until `end` (what it holds going with it), then goes on; a swipe goes up so many stage px
const TABLET_FADE = {move: 2.4, share: 0.5}; // the board going to the mission's rating: the move takes `move` seconds; the tablet is gone over the first `share` of it (the mission stays), the mission zooms over the rest
const PEER_SEND = {first: 0.45, gap: 0.4, press: 0.2, after: 0.7}; // seconds, once the peers' ratings are in (the move of their last slide is over): the first peer's Submit Rate is pressed, `gap` later the second's (a press takes `press`: it dips and snaps gray half way), then the cards stay `after`
PEER_SEND.total = PEER_SEND.first + PEER_SEND.gap + PEER_SEND.press + PEER_SEND.after;
// The peers' ratings come in as a PATH drawn from the mission (the user, 2026-10-13: "don't show the avatar in mission until it hits submit, fix the purple line to be connected here, it connects
// afterwards but it didn't connect before, also make it has an animation like trim path in After Effects, where it smoothly goes from mission to rating 1 then rating 2"). The slides keep the
// connector as the demo had it at that moment (a bracket that has not yet reached the second card, the cards half in), so the video draws it by its own clock instead: out of the mission, down
// the bracket to the first card's level, its tick, on down to the second card's, its tick, one head moving along it, easing in and out (`peerDraw`); each card pops as the head gets to its tick;
// the faces on the mission pop when their Submit is pressed (`PEER_SEND`). All of it is custom properties on the elements (`--sb-out`, `--sb-trunk`, `--sb-tick`, `--sb-pop`, `--sb-av`) that
// the rules at the end of Storyboard.css turn into clips and opacity, never the elements' own inline styles: a move got ready ahead (`prepare`) reads those, and would take a half-drawn line as
// where the next slide goes from.
const PEER_DRAW = {start: 0.15, dur: 1.5, pop: 0.35, tail: 0.3, face: 0.3}; // seconds: after the move into the slide is over, the head starts, runs `dur`; a card pops over `pop`; `face`: a face on the mission pops
PEER_DRAW.total = PEER_DRAW.start + PEER_DRAW.dur + PEER_DRAW.pop + PEER_DRAW.tail;
const PEER_PATH = [23, 96, 25, 196, 25]; // the path, in the rating layout's own px: out of the mission, the bracket to the first card's level, its tick, the bracket on to the second's, its tick
const PEER_LEN = PEER_PATH.reduce((a, b) => a + b, 0), PEER_BRACKET = 294, PEER_REACH = 292; // (the bracket's full height, and how far down the second card's tick is on it)
const smoothstep = x => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const smoothAt = y => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (smoothstep(mid) < y) lo = mid; else hi = mid; } return hi; };
const peerAt = h => PEER_DRAW.start + PEER_DRAW.dur * smoothAt(h / PEER_LEN); // the second the head is `h` px along the path
// How much of the path is drawn `s` seconds after the move into the slide is over (< 0: none yet; Infinity: all of it) -> {out, trunk, tick: [first, second], pop: [first, second]} (each 0 to 1)
function peerDraw(s) {
  if (s === Infinity) return {out: 1, trunk: 1, tick: [1, 1], pop: [1, 1]};
  const [a, b, c, d, e] = PEER_PATH, h = smoothstep((s - PEER_DRAW.start) / PEER_DRAW.dur) * PEER_LEN;
  const down = h <= a ? 0 : h <= a + b ? h - a : h <= a + b + c ? b : h <= a + b + c + d ? b + (h - a - b - c) : b + d; // (px down the bracket)
  return {
    out: Math.min(1, h / a), trunk: down >= PEER_REACH ? 1 : down > 0 ? (down + 1) / PEER_BRACKET : 0,
    tick: [Math.min(1, Math.max(0, (h - a - b) / c)), Math.min(1, Math.max(0, (h - a - b - c - d) / e))],
    pop: [smoothstep((s - peerAt(a + b + c / 2)) / PEER_DRAW.pop), smoothstep((s - peerAt(PEER_LEN - e / 2)) / PEER_DRAW.pop)],
  };
}
const RATE_DRAG = 3; // seconds: the move in which the cursor drags the knob of a rating from Poor to Excellent (the user, 2026-10-13: "the review slider should go over all of the rate wording ... don't stop in each one but show the words")
const TAKE_OVER = 0.22; // of a move: the new screen comes in over the old one after a click (the user, 2026-10-12: no hard cuts)
const LIFT_MOVE = 0.85; // a card lifted out of its board (and put in the middle on its own): slower than the other moves, so it is seen rising (the user, 2026-10-12: smooth)
const NO_MARKS = {'improved-quality-v2': new Set(['emphasis']), 'increased-efficiency-v2': new Set(['claim', 'close'])}; // scenes that show no yellow outline (the user, 2026-10-12: "smooth out the pop animation and don't highlight", "claim and close animations should have no highlights"): the demo's outline is not played in them
const isMark = l => /outline|highlight/i.test(l.name ?? ''); // (a yellow outline, a highlight)
const FILM_GAP = 14; // stage px between a video (its timeline) and the card under it
const CLIP = 10; // seconds of the video in the drawer: its timeline runs over it

const decode = text => text.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
// The words of a captured asset: what its paragraphs SHOW (its aria-label is always the whole sentence, even while the demo has only typed the
// start of it); the aria-label only when it has no paragraph.
function capturedWords(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('style, script').forEach(n => n.remove());
  const paragraphs = [...doc.querySelectorAll('p')];
  if (!paragraphs.length) return doc.body.textContent.replace(/[\u200b]/g, '').trim();
  return paragraphs.map(p => (p.children.length ? [...p.children].map(c => c.textContent).join(' ') : p.textContent)).join(' ').replace(/[\u200b]/g, '').replace(/\s+/g, ' ').trim();
}
// The words of a frame: its chat box or its title, the ones retyped on the storyboard, else the demo's own.
function wordsOfFrame(edit, htmlOf, layers) {
  const layer = layers.find(l => l.kind === 'bubble' || roleOf(l) === 'title');
  if (!layer) return {layer: null, text: ''};
  const own = Object.entries(edit?.texts ?? {}).filter(([key]) => key.startsWith(`${layer.key}/`)).sort(([a], [b]) => (a < b ? -1 : 1)).map(([, value]) => value);
  const html = htmlOf(layer.asset) ?? '';
  return {layer, text: own.length ? own.join(' ') : capturedWords(html)};
}
const squash = text => String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// The script of the video, from the slides in order: which are played, and what each one needs.
// -> {played: [frame], info: Map(frame id -> {anims (the pen: {key: anim}), pen (seconds), title, type (seconds a title is typed), late (keys of what
//    comes in after the art), titleKeys, barKeys (the timeline of a video), hover (a cursor is on it), click (the cursor clicks as it comes in),
//    target (a selector the cursor goes to), layers / edit (when the cursor is carried in), tune}), timeline}
const handOf = x => x.layers.find(l => roleOf(l) === 'hand');
// The scene a slide belongs to: the line it was captured in (a duplicate of a slide, in a line of its own, is still a slide of that scene: it plays by that scene's rules).
const sceneOf = f => (f.copyOf && String(f.copyOf).includes('/') ? String(f.copyOf).split('/')[0] : f.chapter);
const artsOf = x => x?.layers.filter(isArt) ?? [];
const biggest = list => [...list].sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h)[0];
const handAt = (x, hand) => [hand.box.x + (x.edit?.moves?.[hand.key]?.[0] ?? 0), hand.box.y + (x.edit?.moves?.[hand.key]?.[1] ?? 0)];
// `layer` of frame `from` is also in frame `x`, where it is there (with what was changed on it).
function carryLayer(x, from, layer) {
  const key = layer.key, mine = k => k === key || k.startsWith(`${key}/`) || k.startsWith(`${key}#`);
  const copy = name => { const out = {...(x.edit?.[name] ?? {})}; for (const [k, v] of Object.entries(from.edit?.[name] ?? {})) if (mine(k)) out[k] = v; return out; };
  const edit = {...x.edit, hidden: (x.edit?.hidden ?? []).filter(k => k !== key), moves: copy('moves'), scales: copy('scales'), sizes: copy('sizes'), styles: copy('styles'), texts: copy('texts'), bubbles: copy('bubbles'), tips: copy('tips')};
  const rest = x.layers.filter(l => l.key !== key && !(roleOf(l) === 'hand' && roleOf(layer) === 'hand')), behind = roleOf(layer) === 'panel'; // (the panel goes behind the art, just over the plate)
  const at = behind ? rest.findIndex(l => roleOf(l) === 'plate') + 1 : rest.length;
  x.layers = [...rest.slice(0, at), layer, ...rest.slice(at)];
  x.edit = edit;
  x.carried = true;
}
// where a layer is in a frame (stage px): its box, moved
const rectOf = (x, l) => ({x: l.box.x + (x.edit?.moves?.[l.key]?.[0] ?? 0), y: l.box.y + (x.edit?.moves?.[l.key]?.[1] ?? 0), w: l.box.w, h: l.box.h});
// whether the cursor's fingertip is on (or next to) `rect` in frame x
function tipIn(x, rect, margin = 40) {
  const hand = handOf(x);
  if (!hand) return false;
  const p = rectOf(x, hand), tx = p.x + p.w * TIP.x, ty = p.y + p.h * TIP.y;
  return tx >= rect.x - margin && tx <= rect.x + rect.w + margin && ty >= rect.y - margin && ty <= rect.y + rect.h + margin;
}
// A list that was shown stopped at a place after another, each with a swipe of the hand, is scrolled ONCE, by the time (the user, 2026-10-13: "scroll continuously and show text"):
// after the click that opens it, only the first slide of each scene is played (its words) and what the last slide shows is the art in all of them; the engine moves the list from
// where it is when it opens to where the last slide has it (`driveScroll`). -> {kept, scroll: {from, to, selector, at (the slide the scroll starts with)}} (no scroll: the slides as they were)
const offsetOf = (html, selector) => { const el = new DOMParser().parseFromString(html ?? '', 'text/html').querySelector(selector), m = /translateY\((-?[\d.]+)px\)/.exec(el?.getAttribute('style') ?? ''); return m ? Number(m[1]) : null; }; // (where a list is scrolled to in a slide: its translateY)
function oneScroll(kept, spec, htmlOf) {
  const last = kept.findLast(x => spec.scenes.includes(sceneOf(x.frame))), art = last && artsOf(last)[0];
  const opens = kept.findLastIndex(x => sceneOf(x.frame) === spec.opens && x.handGone);
  if (!art || opens < 0) return {kept};
  const listOf = x => { for (const l of artsOf(x)) { const v = offsetOf(htmlOf(l.asset), spec.selector); if (v != null) return v; } return null; };
  const from = listOf(kept[opens]), to = listOf(last);
  if (from == null || to == null) return {kept};
  const firsts = spec.scenes.map(s => kept.find((x, i) => i > opens && sceneOf(x.frame) === s)).filter(Boolean);
  const out = kept.filter((x, i) => i <= opens || firsts.includes(x) || !(spec.scenes.includes(sceneOf(x.frame)) || sceneOf(x.frame) === spec.opens)); // (what comes after the scenes of the list is played as it was)
  for (const x of firsts) { carryLayer(x, last, art); x.profileMove = 0.35; x.profileHold = spec.seconds / firsts.length; x.scrolls = true; }
  return {kept: out, scroll: {from, to, selector: spec.selector, at: out.indexOf(firsts[0]), last: out.indexOf(firsts.at(-1))}};
}
// The lesson (the user, 2026-10-13: "when I hit the video of the shelving standards show what I sent as a new UI ... while fading out the mission details, then after hitting Submit & Close,
// go back to mission details"): the click on the training video opens the lesson screen in the place of the mission details (the mission fades out, the lesson comes), the cursor ticks the
// first two statements and hits Submit & Close, and the mission details come back with the training done. The slides in between (the video growing inside the mission, the quiz in it)
// are not played. `at` is the slide where the cursor arrives on the video, `end` the last one of the scene (the one after the click on Submit). -> the slides, with the beats of the lesson put in.
// The video PLAYS before the quiz is answered (the user, 2026-10-13: "make the video on top playing before answering the quiz"): the lesson opens paused (the picture blurred, its play
// button) and the cursor goes to the play button; it presses, the clip plays by the clock (`film`, `driveFilm`) while the cursor waits on it (`rest`); then it goes to the statements.
function lessonBeats(kept, spec) {
  const at = kept.findIndex(x => sceneOf(x.frame) === spec.scene && x.arrival), end = kept.findLastIndex(x => sceneOf(x.frame) === spec.scene);
  if (at < 0 || end <= at + 1) return kept;
  const base = kept[at], art = artsOf(base)[0];
  if (!art) return kept;
  const beat = (id, state, own) => ({...base, frame: {...base.frame, id: `${base.frame.id}~lesson${id}`}, layers: base.layers.map(l => (l.key === art.key ? {...l, asset: lessonAsset(state)} : l)), arrival: true, clickSel: undefined, target: undefined, merged: false, emph: undefined, drag: false, clickOut: false, handGone: false, endClick: false, rest: false, carried: true, ...own});
  const playing = beat('-play', 'play', {arrival: false, rest: true, holdSel: LESSON_PLAY, film: true, profileMove: LESSON_FILM.press, profileHold: LESSON_FILM.press + LESSON_FILM.clip + LESSON_FILM.tail});
  return [...kept.slice(0, at + 1), beat('-open', 'play', {clickSel: LESSON_PLAY}), playing, beat('1', '00', {clickSel: LESSON_TARGETS[0]}), beat('2', '10', {clickSel: LESSON_TARGETS[1]}), beat('3', '11', {clickSel: LESSON_TARGETS[2]}), ...kept.slice(end)];
}
// The video opens on the mission as a card and opens it AT ONCE (the user, 2026-10-13: "expand the mission as soon as the video starts"): it was the card with the words of the first scene
// written beside it for three seconds, and only then the mission opened. Now the card has no words (they are with the next slide), comes in over `spec.pop` seconds, and the move into the
// next slide, the mission opened, takes `spec.expand`; the words are written once it is open.
function openCard(kept, spec) {
  const [a, b] = kept;
  if (!a?.intro || !b || sceneOf(a.frame) !== sceneOf(b.frame) || !a.layer || a.layer.kind !== 'bubble' || squash(a.text) !== squash(b.text)) return;
  a.layers = a.layers.filter(l => l.key !== a.layer.key); a.carried = true; a.layer = null; a.text = '';
  a.introIn = spec.pop; a.natural = spec.pop; a.profileHold = spec.pop;
  b.profileMove = spec.expand;
}
// Scenes that have the same beat (the user, 2026-10-13: "instruction alert and link should have same timing, and make them stay longer, highlight then write on the right, keep it for like .7
// seconds ... so 3 seconds for writing and highlighting and 0.7 seconds for holding it"): once the move into the scene is over, the highlight comes in (`spec.fade`), THEN the words are written,
// so that highlight and words together take `spec.seconds` (the pen goes at the speed that fits: the words are not all as long), and the scene stays `spec.hold` more. The slide that has the words.
const BEAT_MOVE = 0.5; // the move into a scene of these, when the video does not say (the usual one)
function beatsOf(kept, spec) {
  for (const id of spec.scenes) {
    const at = kept.findIndex((y, i) => sceneOf(y.frame) === id && !!y.layer && y.layer.kind === 'bubble' && !!squash(y.text) && squash(y.text) !== squash(kept[i - 1]?.text) && y.layers.some(isOverlay)); // (the slide that writes the scene's words, with its highlight)
    const x = kept[at];
    if (!x) continue;
    const base = x.intro ? TITLE.in : (x.profileMove ??= BEAT_MOVE); // (what has to be over before the highlight comes: the move into the slide, or, for the first slide of a video, the art coming in)
    x.beat = {at: (x.intro ? TITLE.in : 0) + spec.fade + WRITE.gap, write: spec.seconds - spec.fade - WRITE.gap, fade: spec.fade}; // (the pen touches just after the highlight is in; `at` counts from the end of the move, so a first slide, which has none, counts the art coming in)
    x.profileHold = base + spec.seconds + spec.hold;
  }
}
export function directorOf(frames, edits, video, profile = null) {
  if (!edits || !video) return {played: frames, info: new Map(), timeline: timelineOf(frames)};
  const htmlOf = hash => edits.library[hash] ?? video.assets[hash] ?? lessonHtmlOf(hash);
  const found = frames.map(frame => { const edit = edits.frames[frame.id], all = layersOf(frame, edit), off = NO_MARKS[video.video]?.has(sceneOf(frame)), layers = all.filter(l => !/ripple/i.test(l.name ?? '') && !(off && isMark(l))); return {frame, edit, layers, carried: layers.length !== all.length, rippled: all.some(l => /ripple/i.test(l.name ?? '')), ...wordsOfFrame(edit, htmlOf, layers)}; }); // (the demo's own click ripple is not played: the video clicks by itself; nor is an outline in a scene that has none)
  const look = x => JSON.stringify([{...x.edit, note: undefined, anims: undefined}, x.layers.map(l => `${l.key}:${l.asset}`), x.frame.bubble ?? '', x.text]);
  // a slide of the storyboard that shows the tablet, a title or the words half faded (a step of a fade): the video does its own fades, it never shows one
  const faded = x => x.layers.some(l => (isArt(l) || ['title', 'words'].includes(roleOf(l))) && x.edit?.styles?.[l.key]?.opacity < 0.99);
  let kept = [];
  found.forEach((x, i) => {
    if (faded(x)) return;
    if (x.layers.some(l => roleOf(l) === 'title' && x.edit?.scales?.[l.key]?.[0] < 0.99)) return; // (a title shown smaller: a step of its growing in or out, the video grows it itself)
    if (x.text && found[i + 1] && isTypingStep(x.text, found[i + 1].text)) return; // (only the start of the next one's words: not shown)
    if (x.layer?.kind === 'bubble' && !squash(x.text) && found[i + 1]?.layer?.kind === 'bubble' && squash(found[i + 1].text)) return; // (an empty chat box before its words: nothing to see)
    if (x.layers.some(l => roleOf(l) === 'title') && !squash(x.text) && found[i + 1]?.layers.some(l => roleOf(l) === 'title') && squash(found[i + 1].text)) return; // (a title with nothing typed yet: the video brings the title in itself)
    if (x.layers.some(isLifted) && !kept.at(-1)?.layers.some(isLifted) && found[i + 1] && found[i + 1].layers.map(l => l.key).join('|') === x.layers.map(l => l.key).join('|') && squash(found[i + 1].text) === squash(x.text)) return; // (a card caught while it lifts out of its board: a step of the demo's own animation, the video lifts it in one move)
    if (kept.length && look(kept.at(-1)) === look(x)) return;                       // (looks like the one before: it would only keep it on longer)
    kept.push(x);
  });
  // After a title the next scene is the one with its text: the tablet by itself, in the middle, is not shown (the user, 2026-10-08).
  const titled = x => x.layers.some(l => roleOf(l) === 'title');
  // A video that opens on the software: the slide of it coming in (the demo's scene-in, caught half there) is not played; the video brings it in itself.
  if (kept.length > 1 && !titled(kept[0]) && /\/start(#\d+)?$/.test(kept[0].frame.id) && artsOf(kept[0]).some(a => artsOf(kept[1]).some(b => b.key === a.key))) kept.shift();
  if (kept[0] && !titled(kept[0])) kept[0].intro = true;
  kept = kept.filter((x, i) => !(i > 0 && titled(kept[i - 1]) && !titled(x) && !squash(x.text) && kept.slice(i + 1, i + 4).some(y => squash(y.text) && !titled(y))));
  // What the slides add to the tablet to show the cursor is on something (a bolder, bigger text) is not how the tablet is: the video applies it when
  // the cursor arrives, smoothly (`emph`).
  for (const x of kept) {
    const arts = artsOf(x);
    if (!arts.length) continue;
    const styles = {...(x.edit?.styles ?? {})}, scales = {...(x.edit?.scales ?? {})}, moves = {...(x.edit?.moves ?? {})}, emph = [];
    const inArt = k => arts.some(a => k.startsWith(`${a.key}/`)), screen = k => arts.some(a => k === `${a.key}/0.0.0.0`);
    const keys = new Set([...Object.keys(scales).filter(k => inArt(k) && !screen(k)), ...Object.keys(styles).filter(k => inArt(k) && styles[k].weight != null)]);
    for (const key of keys) { // (a text made bolder / bigger / nudged on the slide: the cursor is on it)
      const {weight, ...rest} = styles[key] ?? {};
      emph.push({key, weight: weight ?? 700, scale: scales[key] ?? null, move: moves[key] ?? null});
      if (Object.keys(rest).length) styles[key] = rest; else delete styles[key];
      delete scales[key]; delete moves[key];
    }
    if (emph.length) { x.edit = {...x.edit, styles, scales, moves}; x.emph = emph; x.carried = true; }
  }
  // The cursor (the user, 2026-10-09): ONE cursor, on screen from its first click to the end of the scene. A click is where the slide has it when the tablet
  // changes in the next slide. After a click it goes straight to the next thing to click (the menu, Knowledge Base, Onboarding, the video's play button),
  // hovers it, clicks. The slides in between (the same tablet, only the cursor and a highlight moving) are not played; the words that a slide shows while
  // the cursor is still at work come after the click that opens what they are about.
  const html = l => (l ? htmlOf(l.asset) ?? '' : '');
  const isTitle = x => x.layers.some(l => roleOf(l) === 'title');
  const panelAway = x => { const panel = x?.layers.find(l => roleOf(l) === 'panel'); return !panel || rectOf(x, panel).x > STAGE * 0.97; }; // (the words' side is not on the slide: the panel is parked off it)
  const tabletSig = x => artsOf(x).map(l => signature(l, x.edit, x.frame)).join('|');
  const artHtml = x => artsOf(x).map(html).join('');
  const screenOf = x => artHtml(x).replace(/-?\d+(\.\d+)?/g, '#'); // (what the screen shows, its clocks and counts, and how far along its animations are, left out)
  const far = (x, a, y, b) => Math.hypot(...handAt(x, a).map((v, k) => v - handAt(y, b)[k])) > 25;
  // Where the cursor clicks. The demo's click ripple marks the slide the click GIVES (caught as it was clicked): the click is made from the slide before it, the
  // cursor there (it is brought in from the ripple's slide when that one has none). Without ripples: where the cursor rests when the art changes in the next slide.
  // And: the cursor at the same place in two slides whose screen says something else (a second click there: translated, then back).
  const rippledLines = new Set(kept.filter(x => x.rippled && x.layers.some(l => roleOf(l) === 'hand')).map(x => sceneOf(x.frame))); // (each scene: with ripples or without)
  // A ripple's slide that still shows the screen before the click (the demo caught the press; what it gives came a moment later, a photo, a video): it is not
  // played, the click is made from the slide before it and gives the slide after it at once.
  const own = new Map(kept.map(x => [x, {edit: x.edit, hand: handOf(x)}])); // (each slide's own cursor, before one is brought in from another: where IT clicked)
  for (let r = kept.length - 2; r > 0; r--) {
    const p = kept[r - 1], x = kept[r], y = kept[r + 1], o = own.get(x), hand = o.hand;
    if (!x.rippled || !hand || isTitle(p) || isTitle(y) || sceneOf(y.frame) !== sceneOf(x.frame) || screenOf(x) !== screenOf(p) || screenOf(y) === screenOf(x) || squash(y.text) !== squash(x.text)) continue;
    if (!handOf(p) || far(p, handOf(p), o, hand)) carryLayer(p, o, hand);
    y.clickFrom = x; // (the slide that named the click)
    kept.splice(r, 1);
  }
  const natural = kept.map(handOf), dropped = new Set(), clicks = new Set();
  const words = x => artsOf(x).map(l => capturedWords(html(l))).join(' ').replace(/[0-9:]+/g, '');
  // The demo names its slides by what the cursor does: "Click Add video (2 of 2)" (the ripple's slide), "After the click (1 of 2)". A click whose own slide the
  // capture left out (no ripple for it: only the slide after) was made from the slide before that one, where the cursor rests after it.
  const labelOf = x => String(x.frame.label ?? '').replace(/\s*\(copy\)$/i, ''), stepOf = x => /\((\d+) of \d+\)/.exec(labelOf(x))?.[1] ?? '';
  // Whether the change from slide x to slide y was a click (not a list scrolling on, a timer ticking): y is named after one, or after a later stop than x.
  const clicked = (x, y) => /^(Click|After the click)/i.test(labelOf(y)) || (!!stepOf(y) && !!stepOf(x) && Number(stepOf(y)) > Number(stepOf(x))) || !/\(\d+ of \d+\)|^(Click|After the click|Hand on|Hand coming|Tail|Words|Scene in|End of|Moving|Bubble|Outline)/i.test(labelOf(y)); // (a slide of no known kind, one added on the board: as before, any change)
  const afterClick = (x, prev) => /^After the click/i.test(labelOf(x)) && !(/^(Click|After the click)/i.test(labelOf(prev)) && stepOf(prev) === stepOf(x)) && tabletSig(prev) !== tabletSig(x);
  const gives = new Map(); // (a click: the slide it gives)
  const addClick = (s, given) => { clicks.add(s); if (given) gives.set(s, given); };
  kept.forEach((x, r) => {
    if (rippledLines.has(sceneOf(x.frame))) {
      if (x.clickFrom && r > 0 && natural[r - 1]) addClick(r - 1, x.clickFrom);
      const o = own.get(x), p = kept[r - 1], y = kept[r + 1];
      if (x.rippled && o?.hand && p && y && /^Click/i.test(labelOf(x)) && stepOf(p) !== stepOf(x) && !isTitle(y) && sceneOf(y.frame) === sceneOf(x.frame) && screenOf(y) !== screenOf(x)) { // the press of another stop than the slide before's: what changed came from that one; this click's own comes after
        addClick(r, x);
        return;
      }
      if (x.clickFrom) return;
      if (!o?.hand || r === 0 || isTitle(kept[r - 1]) || !(x.rippled || afterClick(x, kept[r - 1]))) return;
      const s = r - 1;
      if (!natural[s] || far(kept[s], natural[s], o, o.hand)) { carryLayer(kept[s], o, o.hand); natural[s] = handOf(kept[s]); } // (the cursor clicks where this slide has it)
      addClick(s, x);
    } else {
      const o = own.get(x);
      if (o?.hand && r > 0 && !natural[r - 1] && !isTitle(kept[r - 1]) && afterClick(x, kept[r - 1])) { carryLayer(kept[r - 1], o, o.hand); natural[r - 1] = handOf(kept[r - 1]); addClick(r - 1, x); } // (the words came first, then the click: the slide after it has the cursor where it clicked)
      if (natural[r] && kept[r + 1] && !isTitle(kept[r + 1]) && tabletSig(x) && tabletSig(x) !== tabletSig(kept[r + 1]) && clicked(x, kept[r + 1])) addClick(r, kept[r + 1]);
    }
  });
  kept.forEach((x, i) => { const y = kept[i + 1], a = natural[i], b = y && handOf(y); if (a && b && !isTitle(y) && /^(Click|After the click)/i.test(labelOf(y)) && Math.hypot(...handAt(x, a).map((v, k) => v - handAt(y, b)[k])) < 25 && words(x) !== words(y)) addClick(i, y); }); // (a click named so: a list still scrolling under a still cursor is not one)
  const sources = [...clicks].sort((p, q) => p - q);
  for (const s of sources) { // what is clicked, by the demo's own name for it (the slides are named after the hand's stops): the cursor goes exactly to it
    const named = f => f && {chapter: sceneOf(f), label: f.label}, aim = clickTarget(STOPS[video.video], named(kept[s].frame), named(gives.get(s)?.frame));
    if (aim) { kept[s].clickSel = targetSelector(video.video, aim.name, aim.n); kept[s].drag = aim.stop.kind === 'scroll' || Number.isFinite(aim.stop.hold); } // (a stop held: the hand drags, or swipes up)
  }
  const plays = sources.length ? kept.findIndex((x, i) => i > sources.at(-1) && x.layers.some(l => /timeline/i.test(l.name ?? ''))) : -1; // (a video starts playing: one more click, on its play button)
  const playArrival = plays > 0 && artHtml(kept[plays - 1]).includes('iq2-kb-film') ? plays - 1 : -1;
  const arrivals = [...sources, ...(playArrival >= 0 ? [playArrival] : [])];
  if (arrivals.length) {
    for (const s of sources) { // what is clicked: the menu button opens the menu (the menu shows open in one of the slides after it)
      if (!kept[s].clickSel && !artHtml(kept[s]).includes('bn-menu') && [1, 2, 3, 4].some(d => artHtml(kept[s + d]).includes('bn-menu'))) kept[s].clickSel = 'button[aria-label="Menu"]';
    }
    // The cursor goes straight from a click to the next one when no new words come between them (one piece of work); when words come, it clicks, fades out,
    // and comes in again from the words for the next click.
    const newWords = j => j > 0 && !isTitle(kept[j]) && !!squash(kept[j].text) && squash(kept[j].text) !== squash(kept[j - 1].text);
    const together = (a, next) => { for (let j = a + 2; j <= next; j++) if (newWords(j)) return false; return true; }; // (words in the very frame after the click do not part them: they wait for the next click)
    const lastSource = sources.at(-1), handLayer = a => natural[a] ?? natural[lastSource], handFrame = a => (natural[a] ? kept[a] : kept[lastSource]);
    const aim = (x, a) => { x.arrival = true; if (a === playArrival) x.target = '.iq2-kb-film'; if (kept[a].clickSel) x.clickSel = kept[a].clickSel; if (kept[a].drag) x.drag = true; }; // (its middle is the play button)
    kept[arrivals[0]].arrival = true;
    if (arrivals[0] === playArrival) { carryLayer(kept[playArrival], kept[lastSource], natural[lastSource]); aim(kept[playArrival], playArrival); }
    arrivals.forEach((a, k) => {
      const next = arrivals[k + 1], c = a + 1;
      if (!kept[c] || isTitle(kept[c])) return;
      if (profile?.keepCursor && next !== undefined && !together(a, next) && handOf(kept[a]) && kept.slice(c, next).every(y => !isTitle(y))) { // the cursor is ONE thing from its first click to the end of the video (the user, 2026-10-13: "just keep it visible", "don't show the cursor coming from text"): it does not fade out and come in again from the words; it rests where it clicked while the words of the next scene come, then goes to the next click
        for (let j = c; j < next; j++) { carryLayer(kept[j], kept[a], handOf(kept[a])); kept[j].rest = true; kept[j].cursorOnly = true; } // (`cursorOnly`: the cursor is all this slide has to keep it; an empty beat is still dropped)
        if (next === playArrival) carryLayer(kept[next], kept[lastSource], natural[lastSource]);
        aim(kept[next], next);
        return;
      }
      if (next === undefined || !together(a, next)) { // the cursor's work ends with this click: it fades out (after the press), unless a video starts to play: then it stays and fades out over it
        if (!kept[a].target) kept[a].clickOut = true;
        if (next !== undefined) { if (next === playArrival) carryLayer(kept[next], kept[lastSource], natural[lastSource]); aim(kept[next], next); }
        return;
      }
      const x = kept[c];
      if (c === next) { if (next === playArrival) carryLayer(x, kept[lastSource], natural[lastSource]); aim(x, next); return; } // (the frame after the click is where the next click is)
      if (kept.slice(c + 1, next + 1).some(y => screenOf(y) !== screenOf(x))) { // the screen goes on by itself before the next click (a lesson plays, a quiz comes up): the cursor rests where it clicked, then goes to the next
        for (let j = c; j < next; j++) { carryLayer(kept[j], kept[a], handOf(kept[a])); kept[j].rest = true; }
        aim(kept[next], next);
        return;
      }
      carryLayer(x, handFrame(next), handLayer(next)); // (the cursor goes to the next click at once: this frame has it there)
      aim(x, next); x.merged = true;
      for (let j = c; j <= next && !x.emph; j++) if (kept[j].emph) x.emph = kept[j].emph;
      for (let j = c + 1; j <= next; j++) { // the slides in between are not played; what is drawn on them (a highlight) is
        dropped.add(j);
        for (const h of kept[j].layers.filter(l => /highlight/i.test(l.name ?? ''))) if (!x.layers.some(l => /highlight/i.test(l.name ?? ''))) carryLayer(x, kept[j], h);
      }
    });
    kept.forEach((x, i) => { if (!x.arrival && !x.rest && !dropped.has(i) && handOf(x)) { x.layers = x.layers.filter(l => roleOf(l) !== 'hand'); x.carried = true; } }); // (no cursor but where it clicks)
    const end = kept.reduce((m, x, i) => (x.arrival && !dropped.has(i) ? i : m), -1);  // the frame where the last cursor is
    if (end >= 0 && kept[end].target && kept[end + 1] && !isTitle(kept[end + 1])) { const x = kept[end + 1]; carryLayer(x, kept[end], handOf(kept[end])); x.handOut = true; x.target = kept[end].target; } // (a video plays after the last click: the cursor stays on it and fades out)
  }
  if (!arrivals.length) for (const x of kept) if (handOf(x)) { x.layers = x.layers.filter(l => roleOf(l) !== 'hand'); x.carried = true; } // (a cursor with no click to make is not shown)
  kept = kept.filter((x, i) => !dropped.has(i));
  { const last = kept.reduce((m, x, i) => (x.arrival ? i : m), -1); if (last >= 0 && (!kept[last + 1] || isTitle(kept[last + 1]))) kept[last].endClick = true; } // (the last click has no slide after it in this part: it is made at the end of the frame)
  const firstArrival = kept.findIndex(x => x.arrival);
  kept.forEach((x, i) => { // new words while the cursor is still at work: they come in the next frame, after the click (and the panel stays away until then)
    const prev = kept[i - 1], next = kept[i + 1];
    if (firstArrival < 0 || i <= firstArrival || !x.arrival || !x.merged || x.wordsDelayed || x.layer?.kind !== 'bubble' || !squash(x.text) || !next || isTitle(next) || squash(prev.text) === squash(x.text)) return;
    if (squash(next.text) !== squash(x.text)) { carryLayer(next, x, x.layer); next.layer = x.layer; next.text = x.text; }
    next.wordsDelayed = true; // (once: they are not pushed on again)
    x.layers = x.layers.filter(l => l.kind !== 'bubble'); x.layer = null; x.text = ''; x.carried = true;
    const panel = prev.layers.find(l => roleOf(l) === 'panel');
    if (panel) carryLayer(x, prev, panel);
  });
  kept.forEach((x, i) => { // the words that came after the click stay while what they are about goes on (the video plays), with the panel and the tablet beside them
    const prev = kept[i - 1];
    if (!prev || !(prev.wordsDelayed || prev.wordsKept) || !prev.layer || isTitle(x) || squash(x.text)) return;
    carryLayer(x, prev, prev.layer); x.layer = prev.layer; x.text = prev.text; x.wordsKept = true;
    const panel = prev.layers.find(l => roleOf(l) === 'panel');
    if (panel) carryLayer(x, prev, panel);
  });
  kept.forEach((x, i) => { // the text the cursor arrives on turns bold: the slide's own (made bolder / bigger / nudged there), or the ones of the slides on its way
    if (!x.arrival || x.emph) return;
    for (let j = i - 1; j >= 0 && !kept[j].arrival && !x.emph; j--) if (kept[j].emph) x.emph = kept[j].emph;
  });
  // A highlight comes after the cursor: one that the slide draws before the cursor is on it waits for the frame where the cursor has arrived on it.
  kept.forEach((x, i) => {
    for (const h of x.layers.filter(l => /highlight/i.test(l.name ?? ''))) {
      const rect = rectOf(x, h);
      if (x.arrival && tipIn(x, rect)) continue;
      let j = -1;
      for (let k = i + 1; k < Math.min(kept.length, i + 4) && j < 0; k++) {
        if (kept[k].layers.some(l => roleOf(l) === 'title')) break;
        if (kept[k].arrival && tipIn(kept[k], rect)) j = k;
      }
      if (j < 0) continue;
      x.layers = x.layers.filter(l => l !== h); x.carried = true;
      if (!kept[j].layers.some(l => /highlight/i.test(l.name ?? ''))) carryLayer(kept[j], x, h);
    }
  });
  // A slide where nothing is (no words, no title, no cursor, nothing over the art) between two others is not a beat of its own: the art goes on from the one
  // before to the one after in one move (between two scenes, the words of the first go and the next are written, the screen scrolling on meanwhile). Except the
  // software coming in after words only: that is a beat.
  kept = kept.filter((x, i) => i === 0 || i === kept.length - 1 || !!squash(x.text) || isTitle(x) || (!!handOf(x) && !x.cursorOnly) || x.layers.some(isOverlay) || kept[i - 1].arrival || isTitle(kept[i - 1]) || isTitle(kept[i + 1]) || !artsOf(kept[i - 1]).length); // (the software coming in after words only is a beat: it comes in alone, then the words)
  // Words first, then the cursor: a slide where new words come with the cursor is played twice, the words written first (no cursor), then the cursor comes in.
  kept = kept.flatMap((x, i) => {
    if (!x.arrival || x.merged || x.wordsDelayed || kept[i - 1]?.arrival || !squash(x.text) || x.layer?.kind !== 'bubble' || (i > 0 && squash(kept[i - 1].text) === squash(x.text))) return [x];
    const first = {...x, frame: {...x.frame, id: `${x.frame.id}~words`}, layers: x.layers.filter(l => roleOf(l) !== 'hand' && !/highlight/i.test(l.name ?? '')), arrival: false, emph: undefined, clickSel: undefined, target: undefined, endClick: false, clickOut: false, merged: false, carried: true};
    const left = profile?.keepCursor && i > 0 && handOf(kept[i - 1]); // (the cursor of the scene before is still there: it stays where it was left while the words are written, it does not come in from them)
    if (left) { carryLayer(first, kept[i - 1], left); first.rest = true; }
    x.intro = false; // (the video opens once: the slide with the words is the one that comes in; this one, the same screen with the cursor, did it again: the tablet faded out and in when the cursor came — the user, 2026-10-13: "the tablet flickers a lot")
    return [first, x];
  });
  // A click that ends the cursor's work: the cursor is in the next frame too, where it pressed, and fades out there once the screen has changed (drawn with
  // the new screen, it stays over it: the old frame's cursor would be under it).
  kept.forEach((x, i) => {
    const prev = kept[i - 1], hand = prev && handOf(prev);
    if (!prev?.clickOut || !prev.arrival || !hand || isTitle(x) || handOf(x)) return;
    carryLayer(x, prev, hand); x.handGone = true;
  });
  { // The right side is never empty (the user, 2026-10-13: "don't keep the right side empty, always fade out and show the first word right away", "show the text on the right as soon as you highlight, maybe highlight after showing the first word"):
    // a slide that has the software and no words (the outline that comes before its words, the cursor that clicks before the words come) is played with the words of the next slide that has them: the old words fade
    // out, the first word of the new ones is written at once, the outline and the clicks come after it. A slide that is only the outline, the same screen as the next one that has the words, is not a beat of its own.
    const wordsAfter = i => { for (let j = i + 1; j < kept.length && !isTitle(kept[j]); j++) if (kept[j].layer?.kind === 'bubble' && squash(kept[j].text) && sceneOf(kept[j].frame) === sceneOf(kept[i].frame)) return kept[j]; return null; };
    const ahead = new Set();
    kept.forEach((x, i) => {
      if (isTitle(x) || !artsOf(x).length || squash(x.text) || x.cursorOnly || x.film || panelAway(x)) return; // (no words' side on this slide, the panel is parked: the tablet is in the middle and nothing is written beside it)
      const next = kept[i + 1], y = wordsAfter(i), p = kept[i - 1];
      if (y && next === y && !handOf(x) && !x.arrival && !x.rest && screenOf(x) === screenOf(y) && x.layers.filter(isOverlay).every(l => y.layers.some(q => q.key === l.key))) { if (x.intro) y.intro = true; ahead.add(i); return; } // (only the outline before the words: the words, then the outline)
      const from = y ?? (p && !isTitle(p) && squash(p.text) && p.layer?.kind === 'bubble' && sceneOf(p.frame) === sceneOf(x.frame) ? p : null); // (no words to come: the last ones stay)
      if (!from) return;
      carryLayer(x, from, from.layer); x.layer = from.layer; x.text = from.text;
      x.layers = x.layers.filter(l => l.kind !== 'bubble' || l.key === from.layer.key);
      if (!x.layers.some(l => roleOf(l) === 'panel')) { const panel = from.layers.find(l => roleOf(l) === 'panel'); if (panel) carryLayer(x, from, panel); }
    });
    if (ahead.size) kept = kept.filter((x, i) => !ahead.has(i));
  }
  if (profile?.lesson) kept = lessonBeats(kept, profile.lesson); // (the click on the training video opens the lesson screen)
  { // the closed mission and the rating that follows it (the user, 2026-10-13: "the mission shouldn't move at all, just fade out the tablet and zoom in the mission simultaneously, because now it disappears then appears to left and moves"; then: "the mission shouldn't change its position, why it came here, just fade out the tablet and keep the mission in it's right position and then after tablet completly fade out zoom in on it"): the slides where the card is lifted out over the dimmed board (it was lifted to the middle: the card travelled) are not played; the board goes to the rating in ONE move: the tablet fades out first, the card staying exactly where it is on the board, then, the tablet gone, the card zooms to its place in the rating (`fadeThenZoom`, `TABLET_FADE`)
    const from = kept.findIndex(x => sceneOf(x.frame) === 'rate'), lifted = i => sceneOf(kept[i].frame) === 'emphasis' && artsOf(kept[i]).some(isLifted);
    if (video.video === 'improved-quality-v2' && from > 1 && sceneOf(kept[from - 1].frame) === 'emphasis') {
      const drop = kept.map((x, i) => (i < from && lifted(i) ? i : -1)).filter(i => i >= 0);
      if (drop.length && kept.some((x, i) => i < from && !drop.includes(i) && sceneOf(x.frame) === 'emphasis' && artsOf(x).length)) { // (the board itself is still there to go from)
        kept = kept.filter((x, i) => !drop.includes(i));
        const rating = kept[from - drop.length];
        rating.fadeThenZoom = true; rating.profileMove = TABLET_FADE.move;
      }
    }
  }
  { // the self rating's Submit: blue until the click on it, gray after (the slide after the click is the one with the cursor going out)
    const sent = kept.findIndex(x => sceneOf(x.frame) === 'rate' && x.handGone);
    if (sent >= 0) kept.forEach((x, i) => { if (['rate', 'peer'].includes(sceneOf(x.frame))) x.submit = i < sent ? 'ready' : 'done'; });
    // The peers' Submit Rate too (the user, 2026-10-13: "the submit button should become gray after submit, and blue before"): blue from the moment their cards are there (not blue only once
    // a knob has moved), and, when the last slide of the scene has their ratings in, each one is pressed (no cursor: they rate on their own devices) and turns gray.
    const peerSlides = kept.filter(x => sceneOf(x.frame) === 'peer');
    for (const x of peerSlides) x.peerSubmit = 'ready';
    if (peerSlides.length) peerSlides.at(-1).sendPeers = true;
    peerSlides.forEach((x, i) => { x.peerFlow = i === 0 ? 'draw' : 'drawn'; }); // (the first one draws the connector and pops the cards; the faces on the mission wait for the Submit presses of the last)
  }
  if (profile?.showStep) for (const x of kept) if (sceneOf(x.frame) === profile.showStep.scene) x.showStep = profile.showStep.gap; // (the step the cursor works on is not hidden under the mission's header)
  if (profile?.scenes) for (const [id, s] of Object.entries(profile.scenes)) { // a scene with a pace of its own (the user, 2026-10-13: "add 2 seconds to who performed and 2 seconds to date & time, make transition slower and smoother, a stop a bit then move"): `move` seconds for the move into its first slide, of which the screen waits `wait` seconds (the old words go) before it goes, `extra` seconds more on its last slide once all of it is there
    const own = kept.filter(x => sceneOf(x.frame) === id);
    if (!own.length) continue;
    if (s.move != null) own[0].profileMove = s.move;
    if (s.wait) own[0].still = s.wait;
    if (s.extra) own.at(-1).extra = s.extra;
  }
  if (profile?.open) openCard(kept, profile.open); // (the card, then the mission opened: at once)
  if (profile?.beats) beatsOf(kept, profile.beats); // (instructions, alert, link: the same beat)
  let scroll = null; // (a list scrolled by the time: see oneScroll)
  if (profile?.scroll) { const r = oneScroll(kept, profile.scroll, htmlOf); kept = r.kept; scroll = r.scroll ?? null; }
  const hv = profile?.hover ?? HOVER, tempo = profile?.tempo ?? 1; // (a video that has to be short moves faster, and what the cursor rests on thickens over longer)
  const info = new Map(), simple = x => x.layers.map(l => ({key: l.key, role: roleOf(l), sig: ''}));
  kept.forEach((x, i) => {
    const prev = kept[i - 1], title = x.layers.some(l => roleOf(l) === 'title'), prevTitle = !!prev?.layers.some(l => roleOf(l) === 'title');
    const late = new Set(prev ? pairLayers(simple(prev), simple(x)).added.filter(key => isOverlay(x.layers.find(l => l.key === key))) : x.intro ? x.layers.filter(isOverlay).map(l => l.key) : []); // (the opening: what is drawn over the software comes once it is there)
    const keep = new Set(); // (an outline the slide before had at the same place, by another name: it stays, it does not come in again)
    if (prev) for (const l of x.layers.filter(isOverlay)) { // an outline drawn somewhere else, or another size: the old one goes, the new one comes once the screen is still
      const box = (y, k) => { const r = rectOf(y, k), s = y.edit?.sizes?.[k.key]; return [r.x, r.y, s?.[0] || r.w, s?.[1] || r.h]; }, near = (p, q) => p.every((v, n) => Math.abs(v - q[n]) <= 6);
      const was = prev.layers.find(p => p.key === l.key);
      if (was && !near(box(prev, was), box(x, l))) late.add(l.key); // (one only nudged stays)
      if (!was && prev.layers.some(p => isOverlay(p) && !x.layers.some(q => q.key === p.key) && near(box(prev, p), box(x, l)))) { late.delete(l.key); keep.add(l.key); }
    }
    for (const key of [...late]) { // (an outline only nudged, a few px, glides with the rest: it does not go and come again)
      const l = x.layers.find(q => q.key === key), was = prev && l && prev.layers.find(p => p.key === key);
      if (was) { const d = [rectOf(prev, was), rectOf(x, l)]; if (Math.abs(d[0].x - d[1].x) <= 12 && Math.abs(d[0].y - d[1].y) <= 12 && JSON.stringify(prev.edit?.sizes?.[key] ?? null) === JSON.stringify(x.edit?.sizes?.[key] ?? null)) late.delete(key); }
    }
    const anims = {};
    let pen = 0;
    if (x.layer?.kind === 'bubble' && squash(x.text) && !(prev && squash(prev.text) === squash(x.text))) { // (words that are new: a pen writes them)
      const own = x.edit?.anims?.[x.layer.key], anim = profile?.cps ? {type: 'handwrite', cps: profile.cps} : own?.cps ? own : own?.wps ? {type: 'handwrite', cps: own.wps * 6} : {type: 'handwrite', cps: ANIM_CPS.default}; // (an older one in seconds was only the old default: the video goes at the usual speed)
      anims[x.layer.key] = x.beat ? {type: 'handwrite', cps: letterCount(x.text) / x.beat.write} : anim; // (a beat: the pen goes at the speed that has the words written when the beat says)
      pen = animSeconds(anims[x.layer.key], x.text);
    }
    const hand = handOf(x), before = prev && handOf(prev), arrival = !!x.arrival, bars = x.layers.filter(l => /timeline/i.test(l.name ?? '')).map(l => l.key);
    const click = !!(prev?.arrival && !title); // (the cursor rested where it is, now it clicks: the screen changes, and the cursor goes on to the next)
    const zoomed = !!prev && artsOf(x).some(a => { const was = artsOf(prev).find(p => p.key === a.key), now = x.edit?.scales?.[a.key]?.[0] ?? 1, before = prev.edit?.scales?.[a.key]?.[0] ?? 1; return !!was && Math.max(now, before) / Math.min(now, before) >= 1.3; });
    const lifts = !!prev && x.layers.some(isLifted) && x.layers.some(l => isArt(l) && !isLifted(l)) !== prev.layers.some(l => isArt(l) && !isLifted(l)) || (!!prev && x.layers.some(isLifted) && !prev.layers.some(isLifted)); // (a card lifts out of its board, or goes to the middle by itself)
    const slowDrag = !!prev?.drag && /rate/i.test(prev.clickSel ?? ''); // (the knob of a rating is dragged over all its words: Poor ... Excellent)
    const move = x.profileMove ?? (slowDrag ? RATE_DRAG : prev && title !== prevTitle ? SCENE_MOVE * tempo : click ? CLICK_TOTAL * tempo : arrival ? CLICK_MOVE * tempo : lifts ? LIFT_MOVE * tempo : zoomed ? ZOOM_MOVE * tempo : undefined); // (a click, then the cursor goes on: longer)
    const still = x.still && move ? Math.min(0.6, x.still / move) : 0; // (the share of the move the screen waits before it goes)
    const quick = profile?.dwell != null && arrival && !title && !bars.length && x.profileHold == null; // (the cursor has come to what it clicks: it presses at once, it does not wait on it; the user, 2026-10-13: "doesn't stop at something for a while before clicking")
    const penAfter = pen > 0 && !!prev && panelAway(prev) && !panelAway(x); // (the words' side comes in with this slide: the words are written once it is there)
    info.set(x.frame.id, {
      anims, pen, penAfter, title, late, keep, still, introIn: x.introIn ?? null, submit: x.submit, showStep: x.showStep ?? 0, slowDrag, scrolls: !!x.scrolls, click, intro: !!x.intro, clickOut: !!x.clickOut, handOut: !!x.handOut, handGone: !!x.handGone, rest: !!x.rest, film: !!x.film, fadeThenZoom: !!x.fadeThenZoom, peerSubmit: x.peerSubmit ?? null, sendPeers: !!x.sendPeers, peerFlow: x.peerFlow ?? null, holdSel: x.rest ? x.holdSel ?? null : null, endClick: !!x.endClick, hover: arrival, emph: arrival ? x.emph : undefined, target: x.target ?? null, clickSel: arrival ? x.clickSel ?? null : null, drag: arrival && !!x.drag, layers: x.carried ? x.layers : undefined, edit: x.carried ? x.edit : undefined,
      titleKeys: x.layers.filter(l => roleOf(l) === 'title').map(l => l.key), barKeys: bars,
      tune: {move, penAfter, minHold: x.profileHold ?? (title ? Math.max(TITLE_HOLD, (move ?? 0.5) + TITLE.in + 1.2) : x.sendPeers ? (move ?? 0.5) + (x.peerFlow === 'draw' ? PEER_DRAW.total : 0) + PEER_SEND.total : x.peerFlow === 'draw' ? (move ?? 0.5) + PEER_DRAW.total : bars.length ? (move ?? 0.5) + LATE.lead + LATE.fade + PLAY_SECONDS : arrival ? (move ?? 0.5) + (quick ? profile.dwell : hv.lead + hv.fade + hv.pause) + (x.endClick ? END_CLICK : 0) : 0), late: late.size > 0, ...(x.extra ? {extra: x.extra} : {}), ...(x.natural != null ? {natural: x.natural} : {}), ...(x.beat ? {penAt: x.beat.at, lateLead: 0, lateFade: x.beat.fade} : {}), ...(quick ? {natural: 0, rest: profile.dwell} : {})},
    });
  });
  const played = kept.map(x => x.frame);
  const trace = kept.map(x => ({id: x.frame.id, text: x.text, layers: x.layers.map(l => l.key).join(','), arrival: !!x.arrival, target: x.target, clickSel: x.clickSel, drag: !!x.drag, handOut: !!x.handOut, handGone: !!x.handGone, clickOut: !!x.clickOut, click: info.get(x.frame.id).click, pen: info.get(x.frame.id).pen})); // (what the director made: for looking at it)
  const timeline = timelineOf(played, id => info.get(id).pen, id => info.get(id).tune, profile ? {natural: profile.natural, rest: profile.rest} : {});
  timeline.items.forEach((item, i) => { trace[i].start = item.start; trace[i].move = item.move; trace[i].hold = item.hold; });
  const driven = scroll && profile ? {...profile, scroll: {...scroll, t0: timeline.items[scroll.at].start + timeline.items[scroll.at].move, t1: timeline.items[scroll.last].start + timeline.items[scroll.last].hold - 0.45}} : profile; // (the list is scrolled from when the words of the first scene have come, to just before the end)
  return {played, info, trace, timeline, profile: driven};
}

// An element at `f` (0 to 1) of what it shows (its own opacity is kept).
const setFade = (el, f) => {
  if (el.dataset.plBase === undefined) el.dataset.plBase = el.style.opacity;
  const base = el.dataset.plBase === '' ? 1 : Number(el.dataset.plBase);
  el.style.opacity = f >= 1 ? el.dataset.plBase : String(base * f);
};
const clamp01 = v => Math.min(1, Math.max(0, v));
// An element at `size` times its own scale.
const setSize = (el, size) => {
  if (el.dataset.plScale0 === undefined) el.dataset.plScale0 = el.style.scale;
  const [sx = 1, sy = sx] = (el.dataset.plScale0 || '1').split(/\s+/).map(Number); // (its own scale, times this)
  el.style.scale = Math.abs(size - 1) < 0.001 ? el.dataset.plScale0 : `${sx * size} ${sy * size}`;
};

const CAN_LINEAR = typeof CSS !== 'undefined' && !!CSS.supports?.('animation-timing-function', 'linear(0, 1)'); // (a part of a move is an easing written as linear(...): a browser that does not have it plays it at the move's own ease)
const D = 1000; // the animations run D "ms" for the whole move; the time shown is progress x D

// How a frame is drawn: the demo's classes and variables, and its scene.
const frameLook = (frame, video) => ({
  shell: frame.shell ?? video.stage?.shell ?? 'es-player demo-text-scope',
  stageClass: frame.stageClass ?? video.stage?.className ?? '',
  stageStyle: frame.stageStyle ?? video.stage?.style ?? '',
  scene: frame.scene?.id ?? '',
  view: frame.scene?.view ?? '',
});

// What an asset looks like, not where it is: its HTML and whatever was changed on it. The same in
// two frames: it only moves between them. (Its own move is where it is; a move of a part of it is its look.)
function signature(layer, edit, frame) {
  const mine = key => key === layer.key || key.startsWith(`${layer.key}/`) || key.startsWith(`${layer.key}#`), star = key => `*${key.slice(layer.key.length)}`; // (not under its own name: the cursor of one frame and the cursor of the next are the same asset)
  const parts = [];
  for (const name of ['texts', 'styles', 'sizes', 'scales', 'bubbles', 'tips', 'locks']) for (const [key, value] of Object.entries(edit?.[name] ?? {})) if (mine(key)) parts.push([name, star(key), value]);
  for (const [key, value] of Object.entries(edit?.moves ?? {})) if (key !== layer.key && mine(key)) parts.push(['moves', star(key), value]);
  parts.sort((a, b) => (a[0] + a[1] < b[0] + b[1] ? -1 : 1));
  const {box, z, name, key, link, ...look} = layer; // eslint-disable-line no-unused-vars
  return JSON.stringify([look, layer.kind === 'bubble' ? frame.bubble ?? '' : '', parts]); // (a frame's bubble mode, empty or words, is how its chat box looks, not how the tablet does)
}

// Puts the cursor's fingertip on the client point `at()` (a function: the point can move while the page settles) by what the screen says, not by a scale
// worked out: it is moved, seen where it went, and moved again (the user, 2026-10-09: it must be exactly on what it clicks, on any screen, at any zoom).
function fingertipTo(el, at) {
  for (let round = 0; round < 3; round++) {
    const r = el.getBoundingClientRect(), goal = at(), dx = goal.x - (r.left + r.width * TIP.x), dy = goal.y - (r.top + r.height * TIP.y);
    if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) return;
    const [x, y] = translateOf(el), a = el.getBoundingClientRect();
    moveTo(el, [x + 8, y + 8]);                      // (how far does 8 go on this screen?)
    const b = el.getBoundingClientRect(), kx = (b.left - a.left) / 8 || 1, ky = (b.top - a.top) / 8 || 1;
    moveTo(el, [x + dx / kx, y + dy / ky]);
  }
}

// The elements of an asset: its root, and (a chat box) the shape drawn around it.
const partsOf = (stage, key) => { const root = elementOf(stage, key); return root ? [root, ...stage.querySelectorAll(`svg.sb-shape[data-sb-for="${CSS.escape(key)}"]`)] : []; };
// Whether two pieces of art that are not one screen in two states are not the same software (the phones, then the tablet; a board, then a card lifted out of it): told by what they
// are (their class, their shape, their words), never by where they are: the same tablet in another place or at another size is still the tablet, and glides there (the user,
// 2026-10-12: the Panel wipe was the tablet going out and another coming in, not a tablet moving).
const wordsOf = el => new Set((el.textContent || '').toLowerCase().match(/[a-z]{3,}/g) ?? []);
// What is put on what (the card of a layer that has a card or two lifted out, else the piece): a lifted layer also holds the ratings under its card, which are there in one slide and not in the other.
const anchorOf = el => { const chips = el.querySelectorAll('.chip'); return chips.length && chips.length <= 3 && !el.querySelector('.mi-column, header') ? chips[0] : coreOf(el); };
const WRAPPER = /(^|\s)(ad-stage|iq-camera|ad-fit|es-player)(\s|$)/; // (what a copied layer is wrapped in: the demo's stage, its camera)
const coreOf = el => { let e = el; while (e.children.length === 1 && (!e.getAttribute('class') || WRAPPER.test(e.getAttribute('class')))) e = e.children[0]; return e; }; // (the piece itself, under those wrappers: not what moves inside it, a page panned in its window)
function differentArt(a, b) {
  if (coreOf(a).className !== coreOf(b).className) return true;
  const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), shape = ra.height && rb.height ? (ra.width / ra.height) / (rb.width / rb.height) : 1;
  if (shape < 0.88 || shape > 1.14) return true;
  const wa = wordsOf(a), wb = wordsOf(b);
  if (!wa.size || !wb.size) return false;
  let both = 0;
  for (const w of wa) if (wb.has(w)) both++;
  return both / Math.max(wa.size, wb.size) < 0.5;
}
const centerOf = el => { const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1 ? {x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2} : null; };
// Only words (a title, a chat box): no picture, no drawing, nothing with a background of its own. Words changed in the same place
// are swapped one after the other; anything else (a tablet, a card) is crossed over the one before, which can be seen through.
function wordsOnly(el) {
  if (!el || !el.querySelector('p[aria-label]')) return false;
  for (const n of [el, ...el.querySelectorAll('*')]) {
    if (n.matches('img, svg, canvas, video, picture, button, input, table')) return false;
    const cs = getComputedStyle(n);
    if (cs.backgroundImage !== 'none') return false;
    const alpha = /^rgba\(.*,\s*([\d.]+)\)$/.exec(cs.backgroundColor);
    if (/^rgb\(/.test(cs.backgroundColor) || (alpha && Number(alpha[1]) > 0.05)) return false;
  }
  return true;
}
// What an element shows when it is all there (a fade in progress, setFade, is not counted).
const opacityOf = el => {
  const base = el.dataset.plBase, keep = el.style.opacity;
  if (base !== undefined) el.style.opacity = base;
  const o = Number(getComputedStyle(el).opacity);
  if (base !== undefined) el.style.opacity = keep;
  return Number.isFinite(o) ? o : 1;
};

// The cursor comes in: from the top left of the words (else from afar), fading in at once, and glides to where it goes. `delayed`: after the one
// before has clicked and faded out.
function enter(el, B, play, delayed) {
  const k = parentScale(el) || 1, [bx, by0] = translateOf(el), o = opacityOf(el);
  const hand = B.layers.find(l => l.role === 'hand'), root = hand && elementOf(B.stage, hand.key), r = root?.getBoundingClientRect();
  const words = B.layers.find(l => l.role === 'words'), box = words && elementOf(B.stage, words.key)?.getBoundingClientRect();
  const from = box && r ? [box.left - (r.left + r.width * TIP.x), box.top - (r.top + r.height * TIP.y)] : HAND_FROM;
  const at = delayed ? 0.5 : 0, at2 = at + (1 - at) * 0.2, pos = f => `${bx + from[0] * f / k}px ${by0 + from[1] * f / k}px`;
  play(el, [{translate: pos(1), opacity: 0, offset: 0}, {translate: pos(1), opacity: 0, offset: at}, {translate: pos(0.8), opacity: o, offset: at2}, {translate: pos(0), opacity: o, offset: 1}]);
}

// The same screen of the software in two states (scrolled, opened, zoomed, a part revealed): it MOVES from the one to the other, like the software does,
// instead of the two being crossed (the user, 2026-10-09: "scroll animation in the software, expanding to show mission details in a smooth way").
// The demos keep these states in inline styles (a scroll is a translateY on the content, the camera a scale, a reveal a height or an opacity):
// every element of the new state that has a twin in the old one (same place in the tree, same tag) goes from the old values to its own; what is new
// fades in. `start`: the share of the move before it starts (a click: the press comes first).
const GEOMETRY = ['transform', 'translate', 'scale', 'height', 'width', 'top', 'left', 'maxHeight', 'gridTemplateRows', 'marginTop', 'clipPath']; // (what changes where things are)
const MORPH_PROPS = ['transform', 'scale', 'opacity', 'visibility', 'height', 'width', 'top', 'left', 'maxHeight', 'gridTemplateRows', 'marginTop', 'clipPath']; // (visibility: what shows at either end shows all the way)
function morphable(a, b) {
  if (!a || !b) return false;
  const shape = (el, depth) => (depth === 0 ? el.tagName : `${el.tagName}(${[...el.children].map(c => shape(c, depth - 1)).join(',')})`);
  return shape(a, 3) === shape(b, 3);
}
// What comes in where another thing was (the Knowledge Base drawer where the menu was): the drawer slides in from the right edge as it does in the software, its shade fades in.
function arrives(el, play, keys) {
  if (el.matches('aside.iq-knowledge')) play(el, keys({transform: 'translateX(100%)'}, {transform: el.style.transform || 'translateX(0%)'}));
  else if (el.matches('.mi-drawer-shade')) play(el, keys({opacity: 0}, {opacity: getComputedStyle(el).opacity}));
}
// The layout of the new screen in place of the old one (the user, 2026-10-12: "not smooth transitions": a card that grows, the things under it that go lower, a row that is gone and
// the rest higher were all there at once). What is in both and is somewhere else now goes from where it was (translate), and a box that is taller now grows down (clip-path), over
// the same part of the move as the rest. The two screens' children are paired by what they are (tag, class, words) in order, so a thing put in among others does not make each one
// after it the one before. What the demo already moves by its own styles (`played`) is left to that; what is inside something that moves is only moved by what it does on top.
const kindSig = el => `${el.tagName}|${(el.getAttribute('class') || '').trim().split(/\s+/).slice(0, 3).join('.')}`;
const kidSig = el => `${kindSig(el)}|${(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48)}`;
const pairKids = (ka, kb) => pairLists(ka.map(kidSig), kb.map(kidSig), ka.map(kindSig), kb.map(kindSig)); // -> [[index in ka, index in kb]]
// What goes with the move rather than being cut when one screen is the other changed (the user, 2026-10-12: "not smooth transitions"): a thing that is only in the old one (a phone that
// is gone, a row) fades out where it was. Words, numbers, times and colors that change in a thing that stays change at once, as they do in the software. -> {gone: [elements of the old screen]}
function flip(a, b, play, keys, moving, found = {gone: []}) {
  const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
  if (!ra.width || !rb.width) return found;
  // Everything is measured in the layout of each screen (its own px: the screen's scale taken out), since the new screen is put where the old one is, at its scale, for the move.
  const sa = ra.width / (a.offsetWidth || ra.width), sb = rb.width / (b.offsetWidth || rb.width);
  const rel = (el, r, s) => { const q = el.getBoundingClientRect(); return {x: (q.left - r.left) / s, y: (q.top - r.top) / s, w: q.width / s, h: q.height / s}; };
  const visit = (ea, eb, inherited, under, carried = 0) => { // `under`: inside something the demo moves by its own styles (the content scrolls, a section folds): it goes by those. `carried`: what the things above it that the demo grows (their height goes from the one to the other) have already moved it by: the page lays out what comes after them by itself
    const A = rel(ea, ra, sa), B = rel(eb, rb, sb), dx = A.x - B.x, dy = A.y - B.y, own = [dx - inherited[0], dy - inherited[1] + carried];
    let moved = moving.has(eb);
    if (!under && !moved && eb.style && B.w > 1 && B.h > 1 && A.w > 1 && A.h > 1 && Math.abs(dx) < 500 && Math.abs(dy) < 500) {
      const k = sb / (parentScale(eb) || 1), [tx, ty] = translateOf(eb), grow = B.h - A.h; // (root px to the px this element is moved in)
      const from = {}, to = {};
      if (Math.hypot(own[0], own[1]) > 0.6) { from.translate = `${tx + own[0] * k}px ${ty + own[1] * k}px`; to.translate = `${tx}px ${ty}px`; moved = true; }
      const cs = getComputedStyle(eb), boxy = !['rgba(0, 0, 0, 0)', 'transparent'].includes(cs.backgroundColor) || cs.boxShadow !== 'none';
      if (grow > 2 && boxy && Math.abs(A.w - B.w) < 3 && !eb.style.clipPath) { from.clipPath = `inset(-40px -40px ${grow * k}px -40px)`; to.clipPath = 'inset(-40px -40px -40px -40px)'; moved = true; } // (a box that is taller now grows down: its edge goes with it)
      if (Object.keys(to).length) play(eb, keys(from, to));
    }
    const ka = [...ea.children], kb = [...eb.children], pairs = pairKids(ka, kb), kept = new Set(pairs.map(p => p[0]));
    ka.forEach((e, i) => { if (!kept.has(i)) found.gone.push(e); });
    let sum = 0; // (the height the demo grows, in the things of this list so far: what comes after them is laid out lower by the page itself)
    for (const [i, j] of pairs) sum += visit(ka[i], kb[j], moved ? [dx, dy] : inherited, under || moving.has(eb), (moved ? 0 : carried) + sum);
    const grew = under ? 0 : moving.has(eb) ? B.h - A.h : sum;
    return grew && ['absolute', 'fixed'].includes(getComputedStyle(eb).position) ? 0 : grew; // (what is not in the flow — a line drawn down the side — does not make room: what comes after it is not moved by it)
  };
  visit(a, b, [0, 0], false);
  return found;
}
// The old screen is not shown while the new one moves, but for what is only in it and goes: that is shown by itself and fades out over the first part of the move (`w` of it). The old
// screen's own opacity cannot do that (what is under something hidden is hidden with it), and `visibility: hidden` does not hide what the demo has made visible by itself (a thing it
// reveals paints on): so the way down to each of them is shown with its own paint hidden, and everything else that hangs on that way is hidden by its opacity. -> false: not done
// (nothing to show, or too much hangs on the way: the old screen is hidden as a whole)
function showGone(root, gone, play, w) {
  if (!gone.length) return false;
  const chain = new Set(), targets = new Set(gone), hide = [];
  for (const g of gone) for (let y = g.parentElement; y; y = y.parentElement) { chain.add(y); if (y === root) break; }
  if (!chain.has(root)) return false;
  for (const y of chain) for (const c of y.children) if (!chain.has(c) && !targets.has(c)) hide.push(c);
  if (hide.length > 80) return false;
  for (const y of chain) play(y, [{visibility: 'hidden'}, {visibility: 'hidden'}]);
  for (const c of hide) play(c, fadeFrames('hide', 0));
  for (const g of gone) { const o = Number(getComputedStyle(g).opacity); play(g, windowKeys({opacity: o, visibility: 'visible'}, {opacity: 0, visibility: 'visible'}, 0, w)); }
  return true;
}
const TRACKS = /^\s*-?[\d.]+(fr|px|%)(\s+-?[\d.]+(fr|px|%))*\s*$/; // (a list of tracks: 1fr 2fr, 20px)
const sameTracks = (a, b) => TRACKS.test(a) && TRACKS.test(b) && a.trim().split(/\s+/).length === b.trim().split(/\s+/).length && a.match(/fr|px|%/g).join() === b.match(/fr|px|%/g).join(); // (the same number of tracks in the same units: it can go from the one to the other)
const heightOf = el => { const r = el.getBoundingClientRect(); return el.offsetWidth && r.width ? r.height * (el.offsetWidth / r.width) : el.offsetHeight; }; // (its own px: the scale it is drawn at taken out)
function morph(a, b, start, play0, end = 1) { // (`end`: the share of the move by which it is there: a drag, the cursor letting go)
  const moving = new Set(), play = (el, keyframes, own = true) => { if (own && keyframes.some(k => GEOMETRY.some(p => p in k))) moving.add(el); play0(el, keyframes); }; // (what moves a box by the demo's own styles: not the fades, not the screen's own glide)
  const twins = new Map(), named = new Map(), index = (el, path) => { twins.set(path, el); const k = moveKeyOf(el); if (k && !named.has(k)) named.set(k, el); [...el.children].forEach((c, i) => index(c, `${path}.${i}`)); };
  index(a, '');
  const keys = (from, to) => windowKeys(from, to, start, end); // (it goes from the one to the other over its part of the move, easing in and out in the move's time: not at the fastest from the first moment)
  const visit = (el, path) => {
    const twin = twins.get(path), name = moveKeyOf(el), was = name && named.get(name);
    if (was && was !== twin) { glideFrom(was, el, play, keys); return; } // (a card that went to another place, another column: it glides there)
    if (name && twin && moveKeyOf(twin) && !was) { play(el, keys({opacity: 0}, {opacity: getComputedStyle(el).opacity})); return; } // (a card that was not there: it comes in)
    if (!twin) { // new in this state: it comes in (with all it holds)
      if (path && el.style) play(el, keys({opacity: 0}, {opacity: getComputedStyle(el).opacity}));
      return;
    }
    if (twin.tagName !== el.tagName) { arrives(el, play, keys); return; } // (one thing put in the place of another, a picture by the video it took: a drawer slides in, the rest is just there, crossed with the old screen by the dissolve it comes in with)
    if (el.style && twin.style) {
      const from = {}, to = {};
      for (const prop of MORPH_PROPS) {
        if (!path && (prop === 'scale' || prop === 'transform' || (start && prop === 'opacity'))) continue; // (the screen's own scale and place: measured below, from where it is on the screen)
        const va = twin.style[prop], vb = el.style[prop];
        if (va === vb || (!va && !vb)) continue;
        const A = va || getComputedStyle(twin)[prop], B = vb || getComputedStyle(el)[prop];
        if (A === B || /auto/.test(`${A} ${B}`)) continue; // (an auto size cannot be moved to)
        if (prop === 'gridTemplateRows' && !sameTracks(A, B)) { // (a fold from `none` to 0.93fr cannot be moved through: it switches half way, the whole section under it jumped; its own height goes from the one to the other)
          const ha = heightOf(twin), hb = heightOf(el);
          if (Math.abs(ha - hb) > 0.5) { from.height = `${ha}px`; to.height = `${hb}px`; }
          continue;
        }
        from[prop] = A; to[prop] = B;
      }
      if (!path) { // the screen itself: it goes from where (and how big) the old one is on the screen to where the new one is, with the rest of it. Measured: the two slides can
        // have the demo's camera zoomed differently (the board lifting a mission is caught mid-zoom), so their own scale and place are not what is seen, and going from the one
        // to the other would make the whole screen swell and shrink back (the pulse in the Pop up).
        const span = glideSpan(twin, el);
        if (span) { Object.assign(from, span.from); Object.assign(to, span.to); }
      }
      if (Object.keys(to).length) play(el, keys(from, to), !!path); // (the screen's own glide is not the demo's)
    }
    [...el.children].forEach((c, i) => visit(c, `${path}.${i}`));
  };
  visit(b, '');
  return flip(a, b, play0, keys, moving);
}

// The software is never under the words (the user, 2026-10-09: a good video of the software): a slide that has it zoomed in so far that it goes into the right
// side, where the words are written, is filmed from further back: the software (and the cursor, the highlights on it) is made smaller and put in the middle
// of the left side, whole. What is cut off at the slide's other edges (a zoom on a part of a board) is left as it is.
const FIT = {margin: 60, slack: 6}; // stage px
const TABLET = {x: 0, y: 25, w: 1220, h: 851}; // stage px: the frame of the tablet in the 6th slide of the Scratch line
const WORDS = {margin: 24, size: 35, font: 'montserrat', width: 380}; // stage px: the words on the right side are written this big (the user, 2026-10-10: "font size 50"; 2026-10-13: "make text 45 size") and are all one width, 380: what the room at the right of a tablet gives them, in the middle of the room, whatever the slide (the user, 2026-10-13, on words running edge to edge in a slide with no tablet: "fix this spacing to always be like this on all of them"); `margin`: the least space they keep from the edges of the room
const DEVICE = {right: 1235 / 1285}; // where the iPad's frame ends in its photo (the photo has an empty margin round the frame: x 47 to 1235 of 1285)
// The web report (the dashboard) is shown as big as the tablet, over the edge of the plate (the user, 2026-10-13: "make the dashboard bigger like what we did with the tablet in previous
// videos, where it sticks out of the dark gray right side area and big enough"). It has no photo margin round it, so what is SEEN is the window itself: it ends where the tablet's frame
// is seen to end (x 1172), and is on the same middle line as the tablet (stage px).
const REPORT = {x: 40, w: 1132, margin: 40};
// What an element shows, in client px: the boxes of what paints in it (text, pictures, backgrounds, borders), each cut by what clips it. null: nothing.
function paintedBox(root) {
  let box = null;
  const cut = (r, c) => { const l = Math.max(r.left, c.left), t = Math.max(r.top, c.top), rr = Math.min(r.right, c.right), b = Math.min(r.bottom, c.bottom); return rr > l && b > t ? {left: l, top: t, right: rr, bottom: b} : null; };
  const walk = (el, clip) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || el.style.visibility === 'hidden' || (el !== root && Number(cs.opacity) === 0)) return; // (its own visibility: the slide is built out of sight; the root's fade is the video's)
    const r = el.getBoundingClientRect(), leaf = el.matches('img, svg, video, canvas, picture, input');
    const fills = s => s.backgroundImage !== 'none' || !/^(transparent|rgba\(.*,\s*0\))$/.test(s.backgroundColor);
    const pseudo = which => { const s = getComputedStyle(el, which); return s.content !== 'none' && s.content !== 'normal' && fills(s); }; // (a device's frame drawn by ::before)
    const paints = leaf || fills(cs) || parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth) > 0 || [...el.childNodes].some(n => n.nodeType === 3 && n.data.trim()) || pseudo('::before') || pseudo('::after');
    if (paints && r.width >= 1 && r.height >= 1) { const q = clip ? cut(r, clip) : r; if (q) box = box ? {left: Math.min(box.left, q.left), top: Math.min(box.top, q.top), right: Math.max(box.right, q.right), bottom: Math.max(box.bottom, q.bottom)} : {left: q.left, top: q.top, right: q.right, bottom: q.bottom}; }
    if (leaf) return;
    const own = cs.overflowX !== 'visible' || cs.overflowY !== 'visible' ? (clip ? cut(r, clip) : r) : clip;
    if (!own && (clip || cs.overflowX !== 'visible')) return; // (all of it clipped away)
    for (const c of el.children) walk(c, own);
  };
  walk(root, null);
  return box;
}
// Puts what is at client point C at D, f times as big: its own scale is made f times what it is, then it is moved so that its middle is where the zoom
// puts it, by what the screen says (a layer can sit in the demo's camera, itself scaled and moved: no sum is trusted).
function zoomLayer(el, f, C, D) {
  const a = el.getBoundingClientRect();
  if (!a.width && !a.height) return;
  const goal = [D[0] + f * ((a.left + a.right) / 2 - C[0]), D[1] + f * ((a.top + a.bottom) / 2 - C[1])];
  const [sx, sy] = scaleOf(el); el.style.scale = `${sx * f} ${sy * f}`;
  const b = el.getBoundingClientRect(), [tx, ty] = translateOf(el), pk = parentScale(el) || 1;
  moveTo(el, [tx + (goal[0] - (b.left + b.right) / 2) / pk, ty + (goal[1] - (b.top + b.bottom) / 2) / pk]);
}

// The same screen laid out another way (the cards of a board in another order, at other places): each card that is in both glides from where it was to
// where it is (and to its size), like the software moving it; what is only in the new one fades in, the old one fades out under it ("magic move"). The
// cards are known by the demo's own names for them. -> how many glide (0: not this kind of change).
const MOVE_KEYS = ['data-card', 'data-mission-id', 'data-iq-target'];
const moveKeyOf = el => { for (const k of MOVE_KEYS) { const v = el.getAttribute?.(k); if (v) return `${k}=${v}`; } return null; };
// The two ends of a glide: where `el` has to start (its translate and scale) to look as `from` does on the screen (the same middle, the same width), and where it
// is. Measured on the screen, so it is right whatever holds the two (the demo's camera can be zoomed more in one slide than in the other). null: they are at one place.
function glideSpan(from, el) {
  const piece = anchorOf(el), ra = anchorOf(from).getBoundingClientRect(), rb = piece.getBoundingClientRect(), pk = parentScale(el) || 1, [tx, ty] = translateOf(el), [sx, sy] = scaleOf(el);
  const dx = (ra.left + ra.right - rb.left - rb.right) / 2, dy = ra.top - rb.top, s = rb.width > 1 && ra.width > 1 ? ra.width / rb.width : 1; // (the middles side to side, the tops up and down: a card that grows keeps its top)
  if (Math.hypot(dx, dy) < 0.5 && Math.abs(s - 1) < 0.002) return null;
  const own = {scale: el.style.scale, translate: el.style.translate};
  el.style.scale = `${sx * s} ${sy * s}`; // (put on `from` by what the screen says: its scale, then moved till its middle is on the other's; a layer scales about its own origin, which is not always its middle)
  for (let round = 0; round < 3; round++) {
    const now = piece.getBoundingClientRect(), mx = (ra.left + ra.right - now.left - now.right) / 2, my = ra.top - now.top;
    if (Math.abs(mx) < 0.3 && Math.abs(my) < 0.3) break;
    const [x, y] = translateOf(el);
    moveTo(el, [x + mx / pk, y + my / pk]);
  }
  const start = {translate: el.style.translate, scale: el.style.scale};
  el.style.scale = own.scale; el.style.translate = own.translate; // (and put back)
  return {from: start, to: {translate: `${tx}px ${ty}px`, scale: `${sx} ${sy}`}};
}
// `el` glides from where `from` is (and from its size) to where it is. `keys(from, to)`: the keyframes of the move. -> false when they are at one place.
function glideFrom(from, el, play, keys) {
  const span = glideSpan(from, el);
  if (!span) return false;
  play(el, keys(span.from, span.to));
  return true;
}

// A card lifted out of the board (the user, 2026-10-12: "smooth out the pop animation"; the Pop up, the ratings' mission, the isolated missions). It rises FROM the place the
// card has on the board (the slide it comes in has the board's own card hidden: the lifted one is drawn exactly over it at once, so there is no gap and no flash) to where it is
// lifted to, growing, and settles a hair over (the board dims by the same clock). `el` is the lifted layer, `A` the stage of the slide before.
const isLifted = layer => /^(lifted mission|isolated missions)$/i.test(layer?.name ?? '');
const chipTitle = chip => chip.querySelector('.chip-title')?.textContent.trim() ?? '';
// -> {from: {translate, scale}, to: {translate, scale}} (as glideSpan: where the layer starts so that its first card is on the board's own), or null (no such card on the board)
const visibleIn = (el, stage) => { // (it is seen there: not hidden, not faded, not scrolled out of the window that holds it)
  const r = el.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
  for (let y = el; y && y !== stage; y = y.parentElement) {
    const cs = getComputedStyle(y);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.5) return false;
    if (y !== el && (cs.overflowX !== 'visible' || cs.overflowY !== 'visible')) { const q = y.getBoundingClientRect(); if (cx < q.left || cx > q.right || cy < q.top || cy > q.bottom) return false; }
  }
  return true;
};
// The slide as it will be once its entrance is over (the video opens on the software a little small and faint, `setFade` / `setSize`): what a move is made from is measured there, not
// where the slide is on its way in (the user, 2026-10-13, on the closed mission: the move is made ready while the first slide is still coming in, and the card on the board was
// seen as faint and not found: the mission was not kept on its place and a copy of it grew at the left instead). The inline fades and sizes are put back after.
function settled(stage, measure) {
  const undo = [];
  for (const el of stage.querySelectorAll('[data-pl-base], [data-pl-scale0]')) {
    const base = el.dataset.plBase, scale0 = el.dataset.plScale0, was = {opacity: el.style.opacity, scale: el.style.scale};
    if (base !== undefined && (base === '' || Number(base) <= 1)) el.style.opacity = base; // (an opacity; the bold text's font size is kept under the same name)
    if (scale0 !== undefined) el.style.scale = scale0;
    undo.push([el, was]);
  }
  try { return measure(); } finally { for (const [el, was] of undo) { el.style.opacity = was.opacity; el.style.scale = was.scale; } }
}
function liftSpan(el, stage) {
  const chip = el.querySelector('.chip'), title = chip && chipTitle(chip);
  const board = title && settled(stage, () => { const c = [...stage.querySelectorAll('.chip')].find(c => chipTitle(c) === title && c.getBoundingClientRect().width > 1 && visibleIn(c, stage)); return c ? {goal: c.getBoundingClientRect()} : null; }); // (a card of the same name that is hidden, or that is on another screen the lifted one does not come from, is not the one it rises from)
  const target = chip?.getBoundingClientRect();
  if (!board || !target || target.width < 1) return null;
  const goal = board.goal, pk = parentScale(el) || 1, [sx, sy] = scaleOf(el), [tx, ty] = translateOf(el), s = goal.width / target.width, own = {scale: el.style.scale, translate: el.style.translate};
  const mid = r => ({x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2}), at = mid(goal);
  el.style.scale = `${sx * s} ${sy * s}`; // (put where the card is, by what the screen says: its own scale, then moved till its card is on the other)
  for (let round = 0; round < 3; round++) {
    const now = mid(chip.getBoundingClientRect()), dx = at.x - now.x, dy = at.y - now.y;
    if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) break;
    const [x, y] = translateOf(el);
    moveTo(el, [x + dx / pk, y + dy / pk]);
  }
  const from = {translate: el.style.translate, scale: el.style.scale};
  el.style.scale = own.scale; el.style.translate = own.translate; // (and put back)
  return {from, to: {translate: `${tx}px ${ty}px`, scale: `${sx} ${sy}`}, cFrom: at, cTo: mid(target), pk};
}
const SPRING = g => { const x = g - 1; return 1 + 1.7 * x ** 3 + 0.7 * x ** 2; }; // 0 to 1, going about 2% over (at 0.72) and back: a settle, not a bounce
// The keyframes of a lift: `n` samples, so the settle is smooth (the move's own ease runs over them). The card's middle goes in a straight line from where it is on the board to
// where it is lifted to while its size settles (the layer scales about its own origin, so the translate is worked out for every sample: the middle moves by what the scale and
// the translate each do to it, which is linear in both).
function liftKeys({from, to, cFrom, cTo, pk}, opacity, n = 10, settle = true) { // (`settle`: the size overshoots a hair and settles; off: it goes straight, the move's easing is all it has)
  const nums = v => String(v).replace(/px/g, '').trim().split(/\s+/).map(Number), mix = (p, q, f) => p + (q - p) * f;
  const [fx, fy = fx] = nums(from.scale), [gx, gy = gx] = nums(to.scale), [ax, ay = 0] = nums(from.translate), [bx, by = 0] = nums(to.translate);
  const ds = fx - gx, ux = Math.abs(ds) > 1e-6 ? (cFrom.x - cTo.x - (ax - bx) * pk) / ds : 0, uy = Math.abs(ds) > 1e-6 ? (cFrom.y - cTo.y - (ay - by) * pk) / ds : 0; // (how far the middle moves for one more of scale)
  return Array.from({length: n + 1}, (_, i) => {
    const g = i / n, h = settle ? SPRING(g) : g, sx = mix(fx, gx, h), sy = mix(fy, gy, h), cx = mix(cFrom.x, cTo.x, g), cy = mix(cFrom.y, cTo.y, g);
    return {opacity, scale: `${sx} ${sy}`, translate: `${bx + (cx - cTo.x - (sx - gx) * ux) / pk}px ${by + (cy - cTo.y - (sx - gx) * uy) / pk}px`, offset: g};
  });
}
function magicMove(a, b, play, start = 0) {
  const inA = new Map();
  for (const el of a.querySelectorAll(MOVE_KEYS.map(k => `[${k}]`).join(','))) { const k = moveKeyOf(el); if (k && !inA.has(k)) inA.set(k, el); }
  if (inA.size < 2) return 0;
  const pairs = [], find = el => { const k = moveKeyOf(el), twin = k && inA.get(k); if (twin) { pairs.push([twin, el]); return; } for (const c of el.children) find(c); };
  find(b);
  if (pairs.length < 2) return 0;
  const holds = new Set(); // (what holds a card that glides: it is gone through, not faded as a whole)
  for (const [, el] of pairs) for (let p = el.parentElement; p && p !== b.parentElement; p = p.parentElement) holds.add(p);
  const glides = new Set(pairs.map(([, el]) => el));
  const keys = (from, to) => windowKeys(from, to, start, 1);
  for (const [twin, el] of pairs) if (glideFrom(twin, el, play, keys)) play(twin, fadeFrames('hide', 0));
  const fadeIn = el => { if (glides.has(el)) return; if (holds.has(el)) { for (const c of el.children) fadeIn(c); return; } if (el.style) play(el, keys({opacity: 0}, {opacity: getComputedStyle(el).opacity})); };
  for (const c of b.children) fadeIn(c);
  play(a, [{opacity: opacityOf(a), offset: 0}, {opacity: opacityOf(a), offset: start}, {opacity: 0, offset: 1}]);
  return pairs.length;
}

function makeSlot(screen, index) {
  const shell = document.createElement('div'), fit = document.createElement('div'), stage = document.createElement('div');
  const bg = document.createElement('div'); // the frame's background (a color or a gradient), a layer of its own so it can cross-fade while the assets glide
  bg.className = 'sb-pl-bg';
  fit.className = 'ad-fit ad-fit--embed';
  shell.style.visibility = 'hidden';
  fit.appendChild(bg); fit.appendChild(stage); shell.appendChild(fit); screen.appendChild(shell);
  return {index, shell, fit, bg, bgCss: '#fff', stage, frame: null, edit: null, library: null, video: null, look: null, layers: [], stamp: 0, pens: new Map()};
}

// Changes with every load of this file: an open page that gets new code makes a new engine (an engine made by the old code would go on with the old rules).
export const ENGINE_BUILD = Math.random();

export function createPlayerEngine(screen, {onRedraw} = {}) {
  const backdrop = document.createElement('div'); // under both: what the frame moving in has behind it (the old background fades out over it)
  backdrop.className = 'sb-pl-backdrop';
  screen.appendChild(backdrop);
  const slots = [makeSlot(screen, 0), makeSlot(screen, 1)];
  let src = {frames: [], edits: null, video: null, script: null}, timeline = timelineOf([]);
  let shown = null; // {mode: 'static', index, slot} | {mode: 'move', a, b}
  let prep = null;  // the move being got ready: {a, b, sa, sb, stampA, stampB, anims, glide (the frames are drawn the same way)}
  let stamps = 0;
  let frozen = false; // a text is being retyped in the picture: nothing is drawn again under it
  let playing = false; // the video is playing (not looked at by seeking): what plays by itself (the film) is let to
  let nowT = 0; // the video's time as it was shown last
  const hover = () => { const p = src.script?.profile?.hover; return p ? {...HOVER, ...p, transition: `-webkit-text-stroke-width ${p.fade}s cubic-bezier(0.4, 0, 0.2, 1)`} : HOVER; }; // (what the cursor rests on thickens: the video's own way, else the usual)
  // A list that is scrolled by the time (the profile's `scroll`): from where it is when it opens to where it ends, once, easing in and out. Every slot has it at the same place at any moment, so
  // no move between two slides scrolls it by itself, and the words change over it without it stopping.
  function driveScroll(slot, t) {
    const sc = src.script?.profile?.scroll;
    if (!sc || !slot.info?.scrolls) return; // (the list is moved by the time in the slides that are on it, not in the ones before or after)
    const list = slot.stage.querySelector(sc.selector);
    if (list) list.style.transform = `translateY(${sc.from + (sc.to - sc.from) * ease(clamp01((t - sc.t0) / Math.max(0.01, sc.t1 - sc.t0)))}px)`;
  }

  const dropPrep = () => { if (prep) { for (const anim of prep.anims) anim.cancel(); prep = null; } };
  // The move's animations only live while the move is shown: a paused one holds its first keyframe, which would override the fades the frames do by their clock.
  const liveAnims = p => { if (!p.live) { for (const [el, keyframes] of p.specs) { const anim = el.animate(keyframes, {duration: D, fill: 'both', easing: keyframes.easing && CAN_LINEAR ? keyframes.easing : 'linear'}); anim.pause(); p.anims.push(anim); } p.live = true; } };
  const idleAnims = p => { if (p?.live) { for (const anim of p.anims) anim.cancel(); p.anims = []; p.live = false; } };
  const fresh = (slot, frame) => slot.frame === frame && slot.edit === src.edits.frames[frame.id] && slot.library === src.edits.library && slot.video === src.video && slot.info === (src.script?.info.get(frame.id) ?? null);

  // Draw `frame` on a slot the way the board draws it.
  function build(slot, frame) {
    dropPrep();
    const {edits, video} = src, info = src.script?.info.get(frame.id) ?? null, raw = edits.frames[frame.id], edit = info?.edit ?? raw, layers = info?.layers ?? layersOf(frame, raw), look = frameLook(frame, video);
    const htmlOf = hash => edits.library[hash] ?? video.assets[hash] ?? lessonHtmlOf(hash);
    slot.shell.className = `${look.shell} sb-player sb-pl-shell`;
    slot.stage.className = `${look.stageClass} sb-stage sb-in-video${src.script?.profile?.dimMenu ? ' sb-dim-menu' : ''}`; // (sb-dim-menu: the menu's shade is shown: components/Storyboard.css)
    slot.stage.removeAttribute('style');
    for (const [name, value] of Object.entries(parseStyle(look.stageStyle))) slot.stage.style.setProperty(name, value);
    if (look.scene) slot.stage.dataset.scene = look.scene; else delete slot.stage.dataset.scene;
    if (look.view) slot.stage.dataset.view = look.view; else delete slot.stage.dataset.view;
    slot.pens.clear();
    slot.stage.innerHTML = frameHtml(layers, htmlOf, `pl${slot.index}-`, frame.bubble);
    applyEdits(slot.stage, edit);
    const bgCss = slot.stage.style.background || '#fff'; // (applyEdits put the frame's background on its stage: it goes on the layer behind it)
    slot.stage.style.background = '';
    slot.bg.style.background = bgCss;
    Object.assign(slot, {bgCss});
    Object.assign(slot, {frame, edit: raw, library: edits.library, video, look, layers: layers.map(l => ({key: l.key, role: roleOf(l), art: isArt(l), name: l.name ?? '', sig: signature(l, edit, frame)})), stamp: ++stamps});
    slot.info = info;
    slot.hover = undefined; slot.ring = null; slot.clicking = false; slot.hoverFrom0 = false; slot.rest = null; slot.pressImg = null;
    slot.raw = layers; slot.base = new Map(); slot.fit = undefined; slot.drawEdit = edit;
    if (info?.peerSubmit) for (const el of slot.stage.querySelectorAll('.iq2-rating--peers .iq2-rate-submit')) el.classList.toggle('is-ready', info.peerSubmit === 'ready'); // (the peers' too: blue while they rate; `sendPeers` presses them)
    if (info?.peerFlow) { // (the connector and the faces of the peers' ratings are drawn by the clock, `pensAt`: the rules at the end of Storyboard.css find them by these marks; a face is tied to its card by who it is)
      const faces = [...slot.stage.querySelectorAll('.iq2-rating--peers .iq2-peer-slot')].map(card => card.querySelector('.iq2-rate-avatar')?.getAttribute('src'));
      for (const el of slot.stage.querySelectorAll('.iq2-rating--peers')) el.setAttribute('data-sb-peers', '');
      for (const el of slot.stage.querySelectorAll('.chip-rating--avatar')) { const i = faces.indexOf(el.querySelector('img')?.getAttribute('src')); if (i >= 0) el.setAttribute('data-sb-rater', String(i)); }
    }
    if (info?.submit) for (const el of slot.stage.querySelectorAll('.iq2-rating--self .iq2-rate-submit')) el.classList.toggle('is-ready', info.submit === 'ready'); // (the user, 2026-10-13: "submit should be blue before clicking on it, after clicking on it should become gray")
    driveScroll(slot, nowT); // (a list that is scrolled by the time is where it is now, in every slide: the move between two slides never scrolls it by itself)
    slot.layoutKey = null;    // (laid out by `ensureLayout` when it is needed: the tablet in the middle with the right side gone, the cursor on what it clicks, the timeline on the video; a frame got ready ahead of time is laid out in a picture of its own)
    if (info?.target || info?.barKeys.length || info?.film) for (const film of slot.stage.querySelectorAll('video[data-sb-still]')) warmFilm(film); // (the video that is clicked to play is loaded by then)
    const stamp = slot.stamp;
    // Fonts still loading: the chat boxes' shapes are drawn again around their words once they are in, with no
    // move held (measured under one, a shape would be drawn around the words where the move holds them).
    const redraw = () => { if (slot.stamp === stamp) { dropPrep(); endPens(slot); drawShape(slot.stage, edit); onRedraw?.(); } }; // (the pens were made with a font that was not there yet)
    whenFontsLoaded(edit, redraw); // (a font picked for the words)
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(redraw);
  }

  // Everything that is placed by measuring (the art centered, the cursor in the middle of what it clicks, the timeline on its video), from the places the slides
  // gave. Done again when the layout changes (the fonts come in, the player is another size), so it is never placed by a layout that is gone.
  // What the layout depends on, WITHOUT asking the page to lay itself out (it was asked twice a frame while a frame was held, and that was most of what the video cost: 2 s of 24): the
  // size of the player (its own layout size, watched: the board's zoom does not change how a slide lays out), the fonts, the stylesheets (one that comes in late changes how the slide lays out).
  let screenWidth = 0;
  const watch = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(entries => { screenWidth = Math.round(entries.at(-1).contentRect.width); }) : null;
  watch?.observe(screen);
  const layoutKeyOf = () => `${screenWidth}|${document.fonts?.status}|${document.styleSheets.length}`;
  function layoutSlot(slot) {
    const layers = slot.raw;
    for (const l of layers) for (const el of partsOf(slot.stage, l.key)) { if (el.dataset.sbTrim) { const [w, h] = JSON.parse(el.dataset.sbTrim); el.style.width = w; el.style.height = h; delete el.dataset.sbTrim; } if (slot.base.has(el)) { const b = slot.base.get(el); moveTo(el, b.at); el.style.scale = b.scale; } else slot.base.set(el, {at: translateOf(el), scale: el.style.scale}); }
    slot.tablet = false;
    setWordsFont(slot, layers);
    const tablet = tabletFit(slot, layers); // (the words go at its right: it is placed first)
    spreadWords(slot, layers);
    if (!tablet) fitArt(slot, layers);
    centerArt(slot, layers);
    if (slot.info?.showStep) keepStepInView(slot, slot.info.showStep);
    placeHand(slot, layers);
    centerHand(slot, layers);
    if (src.script?.profile?.centerMarks) centerMarks(slot, layers);
    if (src.script?.profile?.marksInside) keepMarksIn(slot, layers, src.script.profile.marksInside);
    placeBars(slot);
    slot.layoutKey = layoutKeyOf(slot);
  }
  // The step a mission's list is scrolled to is not under the mission's own header (the user, 2026-10-13: "in video proof don't scroll up too much, I wanna see the video step text"): the demo scrolls the
  // list as far as its last step goes, and the first words of that step end up under the header that stays at the top. The list is put back down by what hides them, `gap` stage px of room above them left
  // (the header moves with it the other way: it stays where it is).
  function keepStepInView(slot, gap) {
    const box = slot.stage.getBoundingClientRect(), k = box.width / (slot.stage.offsetWidth || 1), shift = (el, by) => { const m = /translateY\((-?[\d.]+)px\)/.exec(el.style.transform ?? ''); if (!m) return false; el.style.transform = el.style.transform.replace(m[0], `translateY(${Number(m[1]) + by}px)`); return true; };
    for (const content of slot.stage.querySelectorAll('.iq2-m-content')) {
      const head = content.querySelector(':scope > .iq2-m-summary'), cps = [...content.querySelectorAll('.iq2-m-cp')];
      if (!head || !cps.length || !content.offsetHeight) continue;
      const under = head.getBoundingClientRect().bottom, per = content.getBoundingClientRect().height / content.offsetHeight; // (the header's bottom; screen px for each px of the list)
      const cp = cps.find(c => { const r = c.getBoundingClientRect(); return r.bottom > under && r.top < under; }); // (the step that goes under the header)
      const word = cp && [...cp.querySelectorAll('*')].find(e => [...e.childNodes].some(n => n.nodeType === 3 && n.data.trim()));
      if (!word) continue;
      const by = (under + gap * k - word.getBoundingClientRect().top) / (per || 1);
      if (by < 0.5) continue;
      if (shift(content, by)) shift(head, -by);
    }
  }
  // A yellow outline is never cut by the picture's edge (the user, 2026-10-13: "same look too", the Improved Quality checks on Increased Efficiency): the one that goes round a whole tablet, which sits
  // against the left edge, lost its left side. Each side that comes closer than `margin` stage px to the edge is brought in (the outline is made smaller on that side, the rest does not move).
  function keepMarksIn(slot, layers, margin) {
    const box = slot.stage.getBoundingClientRect(), k = box.width / (slot.stage.offsetWidth || 1);
    if (!k) return;
    const room = margin * k;
    for (const l of layers.filter(isMark)) {
      const el = elementOf(slot.stage, l.key), m = el?.getBoundingClientRect();
      if (!m || m.width < 4 || m.height < 4) continue;
      const left = Math.max(0, box.left + room - m.left), top = Math.max(0, box.top + room - m.top), right = Math.max(0, m.right - (box.right - room)), bottom = Math.max(0, m.bottom - (box.bottom - room));
      if (left + top + right + bottom < 0.5) continue;
      const own = m.width / (el.offsetWidth || 1), pk = parentScale(el) || 1, [x, y] = translateOf(el); // (client px per its own px, per its parent's px)
      el.dataset.sbTrim = JSON.stringify([el.style.width, el.style.height]); // (a layout again starts from the outline as it was)
      if (left + right > 0.5) el.style.width = `${el.offsetWidth - (left + right) / own}px`;
      if (top + bottom > 0.5) el.style.height = `${el.offsetHeight - (top + bottom) / own}px`;
      const now = el.getBoundingClientRect(); // (it scales about its middle: put its left and top where they were meant to be)
      moveTo(el, [x + (m.left + left - now.left) / pk, y + (m.top + top - now.top) / pk]);
    }
  }
  // A yellow outline around one line of text has the text in the middle of it, side to side and up and down (the user, 2026-10-13: "make sure the date & time is centered v and h
  // inside the highlight rectangle"): measured on the words themselves (what they paint, not the cell they are in), after the art is placed; the outline is moved, never the slide.
  // An outline that is too small for its words (6 px at the sides, 3 above and under) is made as big as they need.
  function centerMarks(slot, layers) {
    const texts = [];
    for (const l of layers.filter(isArt)) for (const el of partsOf(slot.stage, l.key)) {
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n; (n = walk.nextNode());) {
        if (!n.data.trim() || Number(getComputedStyle(n.parentElement).opacity) === 0) continue;
        const range = document.createRange(); range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) texts.push(r);
      }
    }
    for (const l of layers.filter(isMark)) {
      const el = elementOf(slot.stage, l.key), m = el?.getBoundingClientRect();
      if (!m || m.width < 4 || m.height < 4) continue;
      const inside = texts.filter(r => (r.left + r.right) / 2 > m.left && (r.left + r.right) / 2 < m.right && (r.top + r.bottom) / 2 > m.top && (r.top + r.bottom) / 2 < m.bottom);
      if (!inside.length) continue;
      const u = {left: Math.min(...inside.map(r => r.left)), top: Math.min(...inside.map(r => r.top)), right: Math.max(...inside.map(r => r.right)), bottom: Math.max(...inside.map(r => r.bottom))};
      if (u.bottom - u.top > Math.max(...inside.map(r => r.height)) * 1.8) continue; // (more than one line: it is not a line the outline is around)
      const k = m.width / (el.offsetWidth || 1), sk = slot.stage.getBoundingClientRect().width / (slot.stage.offsetWidth || 1); // (client px per its own px, per stage px)
      const growX = Math.max(0, u.right - u.left + 12 * sk - m.width) / k, growY = Math.max(0, u.bottom - u.top + 6 * sk - m.height) / k;
      if (growX > 0.5) el.style.width = `${el.offsetWidth + growX}px`;
      if (growY > 0.5) el.style.height = `${el.offsetHeight + growY}px`;
      const now = el.getBoundingClientRect(), pk = parentScale(el) || 1, [x, y] = translateOf(el);
      moveTo(el, [x + ((u.left + u.right) / 2 - (now.left + now.right) / 2) / pk, y + ((u.top + u.bottom) / 2 - (now.top + now.bottom) / 2) / pk]);
    }
  }
  function ensureLayout(slot) { if (slot.raw && slot.layoutKey !== layoutKeyOf(slot)) { dropPrep(); layoutSlot(slot); } }
  // The words in a video are Montserrat, 35 (the user, 2026-10-14: "on the videos fix the font to be monsterrat 35 size"): the slides keep their own (a handwriting face, 35), the video
  // writes every chat box of words in the same plain one, whatever slide it is on and whether it is spread over the words' side or not. Before the layout measures them.
  function setWordsFont(slot, layers) {
    let changed = false;
    for (const l of layers) {
      const el = roleOf(l) === 'words' ? elementOf(slot.stage, l.key) : null;
      if (!el?.hasAttribute('data-sb-bubble')) continue;
      el.dataset.sbFont = ''; el.style.setProperty('--sb-font', FONT_STACK[WORDS.font]);
      setTextNumbers(el, {size: WORDS.size});
      changed = true;
    }
    if (changed) drawShape(slot.stage, slot.drawEdit);
  }
  // The words have all the right side to be written on (the user, 2026-10-09: "this whole space should be able to be used when writing"): a chat box there is
  // as wide as the side less its margins, in its middle, at the height it had (the slides keep their own narrower boxes).
  function spreadWords(slot, layers) {
    const box = slot.stage.getBoundingClientRect(), k = box.width / (slot.stage.offsetWidth || 1), panel = layers.find(l => /^panel$/i.test(l.name ?? '')), panelEl = panel && elementOf(slot.stage, panel.key);
    if (!k || !panelEl) return;
    const W = slot.stage.offsetWidth, left = (panelEl.getBoundingClientRect().left - box.left) / k;
    if (left > W * 0.97 || left < W * 0.3) return; // (no words' side on this slide)
    let edge = left, margin = WORDS.margin; // (where the room for the words begins)
    if (slot.tablet) { // the tablet is over the edge of the plate: the words have what is left at the right of it (the user, 2026-10-13: "center it between the tablet and the right side": from where the tablet's frame is SEEN to end, the photo of it has an empty margin at its right)
      const dev = bigDevice(slot, layers), q = dev?.getBoundingClientRect();
      if (q) edge = Math.max(edge, (q.left + q.width * (dev.matches('.iq2-report') ? 1 : DEVICE.right) - box.left) / k);
      edge = Math.min(edge, W * 0.85);
    }
    let spread = false;
    for (const l of layers) {
      const el = roleOf(l) === 'words' ? elementOf(slot.stage, l.key) : null, p = el?.hasAttribute('data-sb-bubble') ? el.querySelector('p') : null;
      if (!p) continue;
      const before = p.getBoundingClientRect();
      if ((before.left - box.left) / k < left - 4) continue; // (words that are not on the right side)
      setTextNumbers(el, {size: WORDS.size});
      sizeTo(el, [Math.min(WORDS.width, W - edge - 2 * margin) + 2 * bubblePad(el)[0], 0]); // (the box has its padding round the words: the words themselves are one width everywhere, as wide as the room allows, in the middle of it)
      const after = p.getBoundingClientRect(), pk = parentScale(el) || 1, [x, y] = translateOf(el);
      moveTo(el, [x + (box.left + (edge + (W - edge) / 2) * k - (after.left + after.right) / 2) / pk, y + ((before.top + before.bottom) / 2 - (after.top + after.bottom) / 2) / pk]);
      spread = true;
    }
    if (spread) drawShape(slot.stage, slot.drawEdit);
  }
  // The art going into the words' side: filmed from further back (FIT). Measured on every layout, from the slide as it is (`slot.fit`, stage px): a style
  // that came in late (the demo's own stylesheet) is counted.
  function fitArt(slot, layers) {
    slot.fit = null;
    const panelAt = layers.findIndex(l => /^panel$/i.test(l.name ?? ''));
    if (panelAt >= 0 && layers.some((l, i) => i < panelAt && isArt(l))) return; // the panel is stacked OVER the art: what runs under it is hidden on purpose (a zoom: the screen pushed in, cut by the panel), not to be pulled back
    const box = slot.stage.getBoundingClientRect(), k = box.width / (slot.stage.offsetWidth || 1), panel = layers.find(l => /^panel$/i.test(l.name ?? '')), panelEl = panel && elementOf(slot.stage, panel.key);
    const edge = panelEl && (panelEl.getBoundingClientRect().left - box.left) / k, W = slot.stage.offsetWidth, H = slot.stage.offsetHeight;
    if (!k || !edge || edge > W * 0.97) return; // (no words' side on this slide)
    let all = null;
    for (const l of layers.filter(isArt)) for (const el of partsOf(slot.stage, l.key)) { const p = paintedBox(el); if (p) all = all ? {left: Math.min(all.left, p.left), top: Math.min(all.top, p.top), right: Math.max(all.right, p.right), bottom: Math.max(all.bottom, p.bottom)} : p; }
    if (!all) return;
    const r = {x: (all.left - box.left) / k, y: (all.top - box.top) / k, w: (all.right - all.left) / k, h: (all.bottom - all.top) / k};
    if (r.x + r.w <= edge + FIT.slack) return; // (it keeps to its side)
    const f = Math.min(1, (edge - 2 * FIT.margin) / r.w, (H - 2 * FIT.margin) / r.h);
    applyFit(slot, layers, slot.fit = {f, C: [r.x + r.w / 2, r.y + r.h / 2], D: [edge / 2, H / 2]}, box, k);
  }
  // The art (the tablet, the cursor, what is drawn on it) scaled by `fit.f` about `fit.C` (stage px) and put with that point on `fit.D`.
  function applyFit(slot, layers, fit, box, k) {
    const client = p => [box.left + p[0] * k, box.top + p[1] * k], C = client(fit.C), D = client(fit.D);
    for (const l of layers) {
      const role = roleOf(l);
      if (['plate', 'panel', 'words', 'title'].includes(role)) continue;
      for (const el of partsOf(slot.stage, l.key)) {
        if (role !== 'hand') { zoomLayer(el, fit.f, C, D); continue; }
        const tipAt = () => { const r = el.getBoundingClientRect(); return [r.left + r.width * TIP.x, r.top + r.height * TIP.y]; }; // (client px)
        const goal = (p => [D[0] + fit.f * (p[0] - C[0]), D[1] + fit.f * (p[1] - C[1])])(tipAt());
        const [sx, sy] = scaleOf(el); el.style.scale = `${sx * fit.f} ${sy * fit.f}`; // (the cursor is filmed from as far back as the rest)
        const now = tipAt(), [tx, ty] = translateOf(el), pk = parentScale(el) || 1;
        moveTo(el, [tx + (goal[0] - now[0]) / pk, ty + (goal[1] - now[1]) / pk]);
      }
    }
  }
  // The tablet as big as the one in the 6th slide of the Scratch line (the user, 2026-10-13: "make the tablet as big as the 6th slide in the scratch line on all videos, whenever
  // there is a tablet show it the same, going over the dark gray right side"): its frame 1220 x 851 at the left, 25 from the top: it goes over the edge of the plate onto the dark
  // side, and the words have what is left at its right. Not a tablet that is zoomed into (only a part of it is the picture), nor one that is alone (no words' side: it is centered).
  // -> whether it was done.
  function tabletFit(slot, layers) {
    slot.fit = null;
    const panel = layers.find(l => /^panel$/i.test(l.name ?? '')), panelEl = panel && elementOf(slot.stage, panel.key);
    const box = slot.stage.getBoundingClientRect(), k = box.width / (slot.stage.offsetWidth || 1), W = slot.stage.offsetWidth, H = slot.stage.offsetHeight;
    if (!k || !panelEl) return false;
    const edge = (panelEl.getBoundingClientRect().left - box.left) / k;
    if (edge > W * 0.97 || edge < W * 0.3) return false; // (no words' side on this slide)
    const bezel = bigDevice(slot, layers);
    if (!bezel) return false;
    const q = bezel.getBoundingClientRect(), r = {x: (q.left - box.left) / k, y: (q.top - box.top) / k, w: q.width / k, h: q.height / k};
    if (r.w < 300 || r.x < -60 || r.y < -60 || r.x + r.w > W + 60 || r.y + r.h > H + 60) return false; // (zoomed in: it goes past the slide)
    const web = bezel.matches('.iq2-report'), to = web ? REPORT : TABLET, f = Math.min(to.w / r.w, web ? (H - 2 * REPORT.margin) / r.h : Infinity); // (the report: as wide as the tablet's frame is seen, never taller than the slide less its margins)
    applyFit(slot, layers, slot.fit = {f, C: [r.x + r.w / 2, r.y + r.h / 2], D: [to.x + to.w / 2, TABLET.y + TABLET.h / 2]}, box, k);
    slot.tablet = true;
    return true;
  }
  // What a video shows big over the plate's edge: the web report if the slide has it, else the tablet (its bezel).
  function bigDevice(slot, layers) {
    const arts = layers.filter(isArt).flatMap(l => partsOf(slot.stage, l.key)), find = sel => arts.map(el => (el.matches(sel) ? el : el.querySelector(sel))).find(Boolean); // (the report's layer IS the window; the tablet's layer holds the bezel)
    return find('.iq2-report') ?? find('.tbl-tablet');
  }
  // The right side is gone (the Panel is parked off the slide): the art (the tablet, the cursor, what is on it) goes to the middle of the
  // slide, so the tablet is the main thing. Everything is measured, so the cursor and the tablet glide there from the slide before.
  function centerArt(slot, layers) {
    const named = re => layers.find(l => re.test(l.name ?? '')), panel = named(/^panel$/i), tablet = biggest(layers.filter(isArt));
    const panelEl = panel && elementOf(slot.stage, panel.key), tabletEl = tablet && elementOf(slot.stage, tablet.key);
    if (!panelEl || !tabletEl) return;
    const stage = slot.stage.getBoundingClientRect(), edge = panelEl.getBoundingClientRect(), art = tabletEl.getBoundingClientRect();
    if (!stage.width || edge.left < stage.left + stage.width * 0.97) return; // (the Panel is on the slide: the words are there and the tablet keeps its half)
    const dx = stage.left + stage.width / 2 - (art.left + art.right) / 2;
    if (Math.abs(dx) < 0.5) return;
    for (const l of layers) {
      if (/^(plate|panel)$/i.test(l.name ?? '') || roleOf(l) === 'words') continue;
      for (const el of partsOf(slot.stage, l.key)) { const [x, y] = translateOf(el); moveTo(el, [x + dx / (parentScale(el) || 1), y]); }
    }
  }
  // The cursor's fingertip on the middle of `info.target`.
  function placeHand(slot, layers) {
    const selector = slot.info?.target, hand = layers.find(l => roleOf(l) === 'hand');
    if (!selector || !hand) return;
    const handEl = elementOf(slot.stage, hand.key), target = slot.stage.querySelector(selector);
    if (!handEl || !target) return;
    fingertipTo(handEl, () => { const t = target.getBoundingClientRect(); return {x: (t.left + t.right) / 2, y: (t.top + t.bottom) / 2}; });
  }
  // The cursor's fingertip in the exact middle of what it clicks (a button, a menu row, a card): the text it rests on if there is one in it, else the
  // thing itself. (The slides have it about there.)
  function centerHand(slot, layers) {
    const info = slot.info;
    if (!(info?.hover || info?.holdSel) || info.target) return; // (`holdSel`: a cursor that rests on what it pressed while the screen goes on, the lesson's play button, is on it in every view, not only after the move that brought it there)
    const tip = tipOf(slot), root = slot.stage;
    if (!tip) return;
    let hit = null, area = Infinity, near = null, nearest = 90;
    for (const el of root.querySelectorAll(CLICKABLE)) {
      const b = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (b.width < 4 || b.height < 4 || Number(cs.opacity) === 0) continue; // (the slide is built hidden: visibility says nothing)
      if (tip.x >= b.left - 10 && tip.x <= b.right + 10 && tip.y >= b.top - 10 && tip.y <= b.bottom + 10) { if (b.width * b.height < area) { hit = el; area = b.width * b.height; } }
      else { const d = Math.hypot((b.left + b.right) / 2 - tip.x, (b.top + b.bottom) / 2 - tip.y); if (d < nearest) { nearest = d; near = el; } }
    }
    // what is clicked: the thing named for it (the menu button); else the one the slide makes bold (the cursor points at the word that turns bold); else the one
    // the slide highlights; else what is under the cursor on the slide
    let el = (info.clickSel ?? info.holdSel) && root.querySelector(info.clickSel ?? info.holdSel), label = null;
    if (!el) for (const e of info.emph ?? []) { const t = elementOf(slot.stage, e.key); if (t) { label = t; el = t.closest(CLICKABLE) ?? t; break; } }
    if (!el) {
      const mark = slot.layers.filter(l => /highlight/i.test(l.name ?? '')).map(l => elementOf(slot.stage, l.key)).find(Boolean), m = mark?.getBoundingClientRect();
      if (m) { // the clickable thing whose middle is nearest the middle of the highlight
        let best = 80;
        for (const c of root.querySelectorAll(CLICKABLE)) { const b = c.getBoundingClientRect(), d = Math.hypot((b.left + b.right) / 2 - (m.left + m.right) / 2, (b.top + b.bottom) / 2 - (m.top + m.bottom) / 2); if (b.width >= 4 && d < best) { best = d; el = c; } }
      }
    }
    el = el || hit || near;
    if (el?.matches?.('button[aria-label="Add"]')) el = root.querySelector('button[aria-label="Menu"]') ?? el; // (the plus is never what the videos click: the burger menu is, whatever the slide's cursor is nearer to)
    if (!el) return;
    if (!label) for (const e of info.emph ?? []) { const t = elementOf(slot.stage, e.key); if (t && el.contains(t)) label = t; }
    if (!label) { const texts = [...el.querySelectorAll('*')].filter(n => [...n.childNodes].some(c => c.nodeType === 3 && c.data.trim())); if (texts.length === 1) label = texts[0]; } // (one text in it: that is what is clicked)
    const range = document.createRange();
    if (label) range.selectNodeContents(label);
    fingertipTo(tip.el, () => { const r = label ? range.getBoundingClientRect() : el.getBoundingClientRect(); return {x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2}; }); // (the middle of the words themselves)
  }
  // The timeline of a video sits exactly on the bottom of the video it belongs to (the user, 2026-10-12: "from left to right of the video, with the same corner
  // radius on the two bottom corners"): as wide as the video, flush with its bottom edge, its two bottom corners as round as the video's (the card the video is in
  // clips it to that). It is drawn at the size it was made (its own box) and scaled to the video's width, so what is in it keeps its proportions. (The art may have
  // been filmed from further back, `fitArt`: that scale is the layer's own, and is not the one it is drawn at.)
  function placeBars(slot) {
    const film = slot.stage.querySelector('.iq2-kb-film');
    if (!film) return;
    { // the cards under the video keep their distance from it (and from its timeline): they are moved down, not touched
      const next = film.closest('.iq-kb-card')?.nextElementSibling, box = slot.stage.getBoundingClientRect(), k = box.width / (slot.stage.offsetWidth || 1);
      if (next) { next.style.marginTop = ''; const gap = (next.getBoundingClientRect().top - film.getBoundingClientRect().bottom) / k; if (gap < FILM_GAP) next.style.marginTop = `${FILM_GAP - gap}px`; }
    }
    placeTimelines(slot.stage, (slot.raw ?? []).filter(l => slot.info?.barKeys?.includes(l.key)));
  }
  const handElOf = slot => { const hand = slot.layers.find(l => l.role === 'hand'); return hand ? elementOf(slot.stage, hand.key) : null; }; // the cursor's element
  const tipOf = slot => { // the cursor's fingertip, in client px
    const el = handElOf(slot);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {el, x: r.left + r.width * TIP.x, y: r.top + r.height * TIP.y};
  };
  // What the cursor rests on, and what it does to it: the slides' own emphasis of it (bolder, bigger) when they have one, else bold.
  function hoverTargets(slot) {
    if (slot.hover) return slot.hover;
    const list = [];
    for (const e of slot.info?.emph ?? []) { const el = elementOf(slot.stage, e.key); if (el) list.push({el}); }
    if (!list.length) { // the smallest text under the fingertip, in the tablet
      const tip = tipOf(slot), root = slot.stage;
      let area = Infinity, best = null;
      if (tip && root) {
        for (const el of root.querySelectorAll('*')) {
          if (![...el.childNodes].some(n => n.nodeType === 3 && n.data.trim())) continue;
          if (src.script?.profile?.hover && !el.closest(CLICKABLE)) continue; // (a video that thickens what the cursor rests on: only a thing it can click, not a clock or a battery next to it)
          const b = el.getBoundingClientRect();
          if (tip.x < b.left - 4 || tip.x > b.right + 4 || tip.y < b.top - 4 || tip.y > b.bottom + 4 || b.width * b.height >= area) continue;
          area = b.width * b.height; best = el;
        }
      }
      if (best) list.push({el: best});
    }
    slot.hover = list.filter(t => !t.el.closest('.iq2-m-options, .sb-lq')); // (the user, 2026-10-13: "don't bold the yeses": the answers of a checklist are ticked, not bolded, when the cursor is on them)
    return slot.hover;
  }
  const smooth01 = x => { const c = clamp01(x); return c * c * (3 - 2 * c); };
  function setStroke({el}, grown) { // the text stroke at (grown) 0 to 1 of what the video gives it
    const row = el.closest('.bn-menu-item');
    if (row) { // (the user, 2026-10-13: "highlight business media using the yellow rectangle, and bold it a tiny bit, like if it's 400 make it 600 ... font size slightly bigger like by 2 px but only on hover with a smooth transition": a row of the menu gets the yellow rounded rectangle, its words a little bolder and bigger, all growing with the video's time)
      const {size, weight} = hover().row ?? ROW_HOVER;
      if (!grown && el.dataset.plHover === undefined) return; // (the cursor has not been on it yet: nothing to undo)
      let mark = row.querySelector(':scope > .sb-row-mark');
      if (!mark) { row.style.position = 'relative'; mark = document.createElement('i'); mark.className = 'sb-row-mark'; mark.setAttribute('aria-hidden', 'true'); row.appendChild(mark); }
      mark.style.opacity = grown.toFixed(3);
      if (el.dataset.plBase === undefined) { el.dataset.plBase = String(parseFloat(getComputedStyle(el).fontSize)); el.style.setProperty('-webkit-text-stroke-color', 'currentColor'); el.style.transition = 'none'; }
      el.style.fontSize = `${(Number(el.dataset.plBase) + size * grown).toFixed(3)}px`;
      el.style.setProperty('-webkit-text-stroke-width', `${(weight * grown).toFixed(4)}em`); // (a stroke, so the weight grows by the time: the font has only whole weights, which would jump)
      el.dataset.plHover = grown > 0 ? '1' : '0';
      return;
    }
    if (el.dataset.plHover === undefined) { el.style.setProperty('-webkit-text-stroke-color', 'currentColor'); el.style.transition = 'none'; }
    el.style.setProperty('-webkit-text-stroke-width', `${(parseFloat(hover().stroke) * grown).toFixed(3)}px`);
    el.dataset.plHover = grown > 0 ? '1' : '0';
  }
  function setHover(t, on, instant) {
    const {el} = t, was = el.dataset.plHover;
    if (was === (on ? '1' : '0')) return;
    if (was === undefined) { el.style.setProperty('-webkit-text-stroke-color', 'currentColor'); el.style.setProperty('-webkit-text-stroke-width', '0px'); el.style.transition = 'none'; void el.offsetWidth; }
    el.style.transition = instant ? 'none' : hover().transition;
    el.style.setProperty('-webkit-text-stroke-width', on ? hover().stroke : '0px');
    el.dataset.plHover = on ? '1' : '0';
  }
  // Where the cursor of a slot is, in stage px (its fingertip), measured now.
  function restOf(slot) {
    const tip = tipOf(slot), box = slot.stage.getBoundingClientRect();
    if (!tip) return null;
    const k = box.width / (slot.stage.offsetWidth || 1);
    return {x: (tip.x - box.left) / k, y: (tip.y - box.top) / k};
  }
  // The cursor's way in a drag (the click of a held stop), client px from where it is in B: {P0: where it presses (where it is in A), P1: where it lets go}.
  // What it holds is in both frames somewhere else (the rating's knob): it goes with it; else (a list) it swipes up.
  function dragOf(A, B) {
    const ta = tipOf(A), tb = tipOf(B);
    if (!ta || !tb) return null;
    const P0 = [ta.x - tb.x, ta.y - tb.y], sel = A.info?.clickSel;
    const a = sel && A.stage.querySelector(sel), b = sel && B.stage.querySelector(sel), ca = a && centerOf(a), cb = b && centerOf(b);
    if (ca && cb && Math.hypot(cb.x - ca.x, cb.y - ca.y) > 4) return {P0, P1: [P0[0] + cb.x - ca.x, P0[1] + cb.y - ca.y]};
    const k = B.stage.getBoundingClientRect().width / (B.stage.offsetWidth || 1);
    return {P0, P1: [P0[0], P0[1] - DRAG.swipe * k]};
  }
  // The click: the cursor presses (a dip) and a ring spreads from its fingertip. `tm`: seconds into the click, -1: none.
  function clickAt(slot, tm, from = null) { // (`from`: the frame the cursor comes from: its cursor presses when this one has none, and the ring spreads where it rests)
    if (tm < 0 && !slot.clicking) return;
    if (tm < 0 || tm > 0.8) { if (slot.pressImg) slot.pressImg.style.transform = ''; if (slot.ring) slot.ring.style.opacity = '0'; slot.clicking = false; return; }
    const host = handElOf(slot) ? slot : from, hand = host && handElOf(host); // (the cursor itself, not where it is: measured once, with the ring below; asking the page for the place of anything every picture of the move makes it lay out the whole screen twice, and the screen is changing: 10 ms a picture)
    if (!hand) return;
    const img = hand.querySelector('img') ?? hand;
    slot.pressImg = img;
    slot.clicking = true;
    img.style.transform = `scale(${tm < 0.12 ? 1 - 0.2 * tm / 0.12 : tm < 0.3 ? 0.8 + 0.2 * (tm - 0.12) / 0.18 : 1})`;
    if (!slot.ring) {
      const ring = document.createElement('i'), rest = restOf(from ?? slot) ?? {x: 0, y: 0};
      ring.style.cssText = `position:absolute;z-index:99;width:10px;height:10px;box-sizing:border-box;border:5px solid #ffec00;border-radius:50%;background:rgb(255 236 0 / 28%);box-shadow:0 0 0 3px #111;pointer-events:none;opacity:0;left:${rest.x - 5}px;top:${rest.y - 5}px`;
      slot.stage.appendChild(ring); slot.ring = ring;
    }
    const p = clamp01((tm - 0.1) / 0.5);
    slot.ring.style.opacity = p > 0 && p < 1 ? String(0.9 * (1 - p)) : '0';
    slot.ring.style.transform = `scale(${1 + p * 5})`;
  }
  // A film that will play is loaded before it is needed (not when the click is made), and paused when its frame is left.
  function warmFilm(film) { if (film.dataset.plLoad === undefined) { film.dataset.plLoad = '1'; film.preload = 'auto'; film.muted = true; film.load(); } }
  const pauseFilms = slot => { for (const film of slot.stage.querySelectorAll('video[data-sb-still]')) if (!film.paused) film.pause(); };
  function runFilm(film, since, item, mode) { // a clip is at `since` seconds of itself: while the video plays it plays itself and is only set right when it drifts, else (still, scrubbed) it is put on that picture
    warmFilm(film);
    const at = Math.min(since, (film.duration || since) - 0.05);
    if (playing && !mode && item) {
      if (film.paused) { film.muted = true; film.play().catch(() => {}); }
      if (film.readyState > 0 && Math.abs(film.currentTime - at) > 0.4) { try { film.currentTime = at; } catch { /* not seekable yet */ } }
    } else {
      if (!film.paused) film.pause();
      if (film.readyState > 0 && Math.abs(film.currentTime - at) > 0.05) { try { film.currentTime = at; } catch { /* not seekable yet */ } }
    }
  }
  function endPens(slot) { for (const pen of slot.pens.values()) pen?.hide(); slot.pens.clear(); }
  // Made ready ahead of time, while the frame before is held (the costly part, thinning the letters, would stop the video where the pen
  // touches): measured before the move into the frame is set up, so the words are where they will stay.
  function warmPens(slot) {
    for (const key of Object.keys(slot.info?.anims ?? {})) {
      if (slot.pens.has(key)) continue;
      const bubble = elementOf(slot.stage, key);
      slot.pens.set(key, bubble && isBubble(bubble) ? prepareWriting(slot.stage, bubble) : null); // (null: nothing to write; it is done)
    }
  }
  // What fades in and out by the clock (the last click's cursor, the outlines that come late, a cursor that has gone or goes out, the opening, a title). Apart from the pens because a move is
  // got ready AHEAD (`prepare`, in the first pictures of the hold) from what the slide it goes from looks like, and that is what it looks like at the END of its hold, not at that moment: the
  // opening card (which comes in over the first fraction of a second) was read half faded, so the move began with it faint, a flash, and an outline that was not in yet was read as not there.
  function fadesAt(slot, local, item, mode) {
    const endTm = slot.info?.endClick && item && !mode ? local - (item.hold - END_CLICK) : null; // (seconds into the last click of the part)
    if (slot.info?.endClick) { // the last click: the cursor presses, then fades
      const f = mode === 'before' || endTm === null ? 1 : 1 - clamp01((endTm - 0.45) / 0.45);
      for (const l of slot.layers) if (l.role === 'hand') for (const el of partsOf(slot.stage, l.key)) setFade(el, f);
    }
    const late = slot.info?.late;
    if (late?.size) {
      const f = mode === 'before' ? 0 : mode === 'done' || !item ? 1 : clamp01((local - (slot.info?.intro ? TITLE.in : item.move) - (slot.info?.tune?.lateLead ?? LATE.lead)) / (slot.info?.tune?.lateFade ?? LATE.fade));
      for (const key of late) for (const el of partsOf(slot.stage, key)) setFade(el, f);
    }
    if (slot.info?.handGone) for (const l of slot.layers) if (l.role === 'hand') for (const el of partsOf(slot.stage, l.key)) setFade(el, mode === 'before' ? 1 : 0); // (it pressed and faded out in the move)
    if (slot.info?.handOut) { // (the last click is made and the video plays: the cursor fades out)
      const f = mode === 'before' ? 1 : mode === 'done' || !item ? 0 : 1 - clamp01((local - item.move - 0.3) / 0.5);
      for (const l of slot.layers) if (l.role === 'hand') for (const el of partsOf(slot.stage, l.key)) setFade(el, f);
    }
    if (slot.info?.intro) { // (the video opens on the software: it comes in, a little small and faint, and settles)
      const p = mode === 'done' || !item ? 1 : clamp01(local / (slot.info.introIn ?? TITLE.in)), f = ease(p), size = 0.94 + 0.06 * f;
      for (const l of slot.layers) if (l.art) for (const el of partsOf(slot.stage, l.key)) { setFade(el, f); setSize(el, size); }
    }
    if (slot.info?.title) { // (a title: small and faint, it grows and comes in; the conclusion stays: it does not fade out at the end)
      const inP = mode === 'before' ? 0 : mode === 'done' || !item ? 1 : clamp01((local - (item?.move ?? 0)) / TITLE.in);
      const f = ease(inP), size = TITLE.from + (1 - TITLE.from) * ease(inP);
      for (const key of slot.info.titleKeys) for (const el of partsOf(slot.stage, key)) { setFade(el, f); setSize(el, size); }
    }
    // The peers' ratings (the user, 2026-10-13: "the green guy review goes down for a split second if I play the video, but if I drag the timeline I don't see this glitch"): the connector is drawn out of
    // the mission, the cards pop as it gets to them, the faces on the mission pop when their Submit is pressed; all by the clock, so scrubbing shows it right. It is here, with the other things the
    // clock fades, and not with the pens, because a card that has not popped yet sits 14 px low and a little small (Storyboard.css, `--sb-pop`): the move into the next slide is got ready ahead
    // in the first pictures of the hold and reads that place as where the card goes from, so the next slide's card began low and rose to its own place as the move began, a dip that only a
    // real play shows (a drag of the bar got the move ready with the slide at the end of its hold).
    if (slot.info?.peerFlow) {
      const since = mode === 'done' ? Infinity : mode === 'before' || !item ? -1 : local - item.move, root = slot.stage.querySelector('.iq2-rating--peers');
      const drawn = slot.info.peerFlow === 'draw' ? peerDraw(since) : peerDraw(Infinity), lag = slot.info.peerFlow === 'draw' ? PEER_DRAW.total : 0; // (a slide that is also the one with the presses: they come after the drawing)
      if (root) {
        root.style.setProperty('--sb-out', String(drawn.out)); root.style.setProperty('--sb-trunk', String(drawn.trunk));
        root.querySelectorAll('.iq2-peer-slot').forEach((el, i) => { el.style.setProperty('--sb-tick', String(drawn.tick[i] ?? 1)); el.style.setProperty('--sb-pop', String(drawn.pop[i] ?? 1)); });
      }
      for (const el of slot.stage.querySelectorAll('.chip-rating[data-sb-rater]')) { // (a peer's face on the mission: not there until that peer's Submit Rate is pressed, then it pops)
        const at = !slot.info.sendPeers ? -1 : since === Infinity ? Infinity : since < 0 ? -1 : since - lag - PEER_SEND.first - Number(el.dataset.sbRater) * PEER_SEND.gap; // (seconds into the press)
        el.style.setProperty('--sb-av', String(at === Infinity ? 1 : smoothstep((at - PEER_SEND.press / 2) / PEER_DRAW.face)));
      }
    }
  }
  // What the frame does by its clock: the pens write (before: not there yet; done: written), what comes in after the art fades in once the
  // move is over, the first title fades in.
  function pensAt(slot, local, item, mode) {
    const endTm = slot.info?.endClick && item && !mode ? local - (item.hold - END_CLICK) : null; // (seconds into the last click of the part)
    fadesAt(slot, local, item, mode);
    for (const [key, anim] of Object.entries(slot.info?.anims ?? {})) {
      const bubble = elementOf(slot.stage, key), words = bubble?.querySelector('p');
      if (!bubble || !words || !isBubble(bubble)) continue;
      const progress = mode === 'before' ? -1 : mode === 'done' ? 2 : writeProgress(item, animSeconds(anim, words.textContent), local);
      if (progress > 0 && progress < 1) {
        if (!slot.pens.has(key) || (slot.pens.get(key) && !slot.pens.get(key).alive())) { words.style.visibility = ''; slot.pens.set(key, prepareWriting(slot.stage, bubble)); }
        const pen = slot.pens.get(key);
        if (pen) pen.progress(progress); else words.style.visibility = '';
      } else {
        slot.pens.get(key)?.hide();
        words.style.visibility = progress <= 0 ? 'hidden' : '';
      }
    }
    if (slot.info?.barKeys?.length && mode !== 'done') { // (a video that plays: its timeline and its picture run by the clock)
      const since = mode === 'before' || !item ? 0 : Math.max(0, local - item.move - LATE.lead - LATE.fade);
      for (const key of slot.info.barKeys) {
        const root = elementOf(slot.stage, key), fill = root?.querySelector('.iq2-bar-track i'), time = root?.querySelector('time');
        if (!fill || !time) continue;
        fill.style.width = `${Math.min(100, since / CLIP * 100)}%`;
        time.textContent = `${Math.floor(since / 60)}:${String(Math.floor(since % 60)).padStart(2, '0')}`;
      }
      const film = slot.stage.querySelector('video[data-sb-still]');
      if (film) runFilm(film, since, item, mode);
    }
    if (slot.info?.sendPeers) { // (the peers' ratings are in: each Submit Rate is pressed, one after the other, and turns gray; blue before it, as a function of the time so scrubbing shows it right; no fade: a colour changes at once)
      const lag = slot.info.peerFlow === 'draw' ? PEER_DRAW.total : 0; // (when the slide that draws the connector is also the one with the presses, they come after it)
      [...slot.stage.querySelectorAll('.iq2-rating--peers .iq2-rate-submit')].forEach((el, i) => {
        const at = mode === 'done' ? Infinity : mode === 'before' || !item ? -1 : local - item.move - lag - PEER_SEND.first - i * PEER_SEND.gap; // (seconds into this one's press)
        el.classList.toggle('is-ready', at < PEER_SEND.press / 2);
        el.style.transform = at > 0 && at < PEER_SEND.press ? `scale(${(1 - 0.07 * Math.sin(Math.PI * at / PEER_SEND.press)).toFixed(4)})` : '';
      });
    }
    if (slot.info?.film) { // (the lesson's video plays by the clock, the user, 2026-10-13: "make the video on top playing before answering the quiz": once the cursor has pressed play the picture clears, the play button goes, its bar runs and the clip plays; every state of it is a function of the time, so scrubbing shows it right)
      const since = mode === 'done' ? LESSON_FILM.clip : mode === 'before' || !item ? 0 : Math.max(0, local - item.move), clear = smooth01(since / LESSON_FILM.clear);
      const box = slot.stage.querySelector('.sb-lq-video'), film = box?.querySelector('video[data-sb-still]');
      if (box) {
        const fill = box.querySelector('[data-lq="fill"]'), time = box.querySelector('[data-lq="time"]'), button = box.querySelector('.sb-lq-play'), track = box.querySelector('.sb-lq-track');
        if (film) { film.style.filter = clear >= 1 ? 'none' : `blur(${(9 * (1 - clear)).toFixed(2)}px) saturate(${(0.9 + 0.1 * clear).toFixed(3)})`; film.style.transform = clear >= 1 ? 'none' : `scale(${(1 + 0.16 * (1 - clear)).toFixed(4)})`; } // (the blurred paused picture, a little larger so its edge does not show, goes sharp)
        if (button) button.style.opacity = String(1 - clear);
        if (track) track.style.opacity = String(clear);
        if (fill) fill.style.width = `${clamp01(since / LESSON_FILM.clip) * 100}%`;
        if (time) time.textContent = `0:0${Math.max(0, Math.min(LESSON_FILM.clip, Math.ceil(LESSON_FILM.clip - since - 1e-6)))}`; // (the seconds that are left)
      }
      if (film) runFilm(film, since, item, mode);
    }
    if (slot.info?.hover && !(mode === 'before' && src.script?.profile?.hover && !slot.hover && !slot.hoverFrom0)) { // (what the cursor rests on turns bold, smoothly, a moment after it arrives; in a video that thickens it its own way what it rests on is found once the cursor is THERE, not at the start of the move, when the cursor is still where it came from)
      const on = mode === 'done' || (mode === 'before' ? slot.hoverFrom0 : !!item && local >= item.move + hover().lead);
      if (src.script?.profile?.hover) { // the thickness GROWS with the time (a stage has no CSS transitions: the usual bold came all at once): none at first, then the stroke, over the fade time, easing in and out
        const grown = mode === 'done' ? 1 : mode === 'before' ? (slot.hoverFrom0 ? 1 : 0) : item ? smooth01((local - item.move - hover().lead) / hover().fade) : 0;
        for (const t of hoverTargets(slot)) setStroke(t, grown);
      } else for (const t of hoverTargets(slot)) setHover(t, on, mode === 'before');
    }
    if (endTm !== null) clickAt(slot, endTm); else if (mode !== 'done' && slot.clicking) clickAt(slot, -1);
  }

  // The two slots for a move from frame `a` to frame `b`: the ones that already hold them, else built.
  function pair(a, b, drawnOnly = false) { // (`drawnOnly`: the frames are drawn but not laid out yet: it is done in another picture, `prepareAhead`)
    const {frames} = src, A = frames[a], B = frames[b];
    let sa = slots.findIndex(s => fresh(s, A)), sb = slots.findIndex((s, i) => i !== sa && fresh(s, B));
    if (sa < 0 && sb >= 0) sa = 1 - sb;
    else if (sa >= 0 && sb < 0) sb = 1 - sa;
    else if (sa < 0 && sb < 0) { sa = 0; sb = 1; }
    if (!fresh(slots[sa], A)) build(slots[sa], A);
    if (!fresh(slots[sb], B)) build(slots[sb], B);
    if (!drawnOnly) { ensureLayout(slots[sa]); ensureLayout(slots[sb]); }
    return [sa, sb];
  }

  // Get the move from frame `a` to frame `b` ready: measure both, make every animation, paused.
  function prepare(a, b) {
    const [sa, sb] = pair(a, b), A = slots[sa], B = slots[sb];
    if (!(prep && prep.a === a && prep.b === b && prep.sa === sa && prep.sb === sb && prep.stampA === A.stamp && prep.stampB === B.stamp)) warmPens(B);
    if (prep && prep.a === a && prep.b === b && prep.sa === sa && prep.sb === sb && prep.stampA === A.stamp && prep.stampB === B.stamp) return prep;
    dropPrep();
    B.hoverFrom0 = false;
    const live = shown?.mode === 'static' && shown.index === a && !!timeline.items[a]; // (the slide it goes from is on show, held: it is by the clock)
    fadesAt(A, 0, null, 'done'); // (the move goes from the slide as it is when its hold is over)
    // A list that is scrolled by the time is where it is WHEN THE MOVE STARTS in both slides, not where it is as the move is got ready: it is got ready ahead, during the hold, while the list is
    // still scrolling, and the move took that place as the one it goes from, so the report jumped back up as the move to the next scene began and scrolled down again (the user, 2026-10-13:
    // "between touring the report and who performed the scrolling goes up and down when playing, not when I drag the timeline").
    const startsAt = timeline.items[b]?.start;
    if (startsAt != null) { driveScroll(A, startsAt); driveScroll(B, startsAt); }
    const specs = [], play = (el, keyframes) => { specs.push([el, keyframes]); };
    const slide = (el, by, fromBy, toBy, wait = 0) => { // glide: the pointer's px, in the element's own space (`wait`: it stays put for that share of the move first)
      const k = parentScale(el) || 1, [bx, by0] = translateOf(el), at = f => `${bx + by[0] * f / k}px ${by0 + by[1] * f / k}px`;
      play(el, wait ? windowKeys({translate: at(fromBy)}, {translate: at(toBy)}, wait, 1) : [{translate: at(fromBy)}, {translate: at(toBy)}]);
    };
    const glide = sameLook(A.look, B.look) || (A.layers.some(l => l.role === 'plate') && B.layers.some(l => l.role === 'plate')); // (the slides of one design are drawn over one another, piece by piece, whatever demo they came from)
    if (!glide) play(B.shell, fadeFrames('fade-in', 1)); // (another scene: the next frame fades in over this one)
    else {
      if (A.bgCss !== B.bgCss) play(A.bg, fadeFrames('fade-out', 1)); // another background: the old one fades out over the new one
      const {matched, gone, added} = pairLayers(A.layers, B.layers);
      const words = (stage, key) => wordsOnly(elementOf(stage, key)), penned = key => !!B.info?.anims?.[key]; // (`penned`: a pen writes the words)
      const tabletBy = (() => { const ta = A.layers.find(l => l.role === 'tablet'), tb = B.layers.find(l => l.role === 'tablet'), ca = ta && partsOf(A.stage, ta.key)[0] && centerOf(partsOf(A.stage, ta.key)[0]), cb = tb && partsOf(B.stage, tb.key)[0] && centerOf(partsOf(B.stage, tb.key)[0]); return ca && cb ? [cb.x - ca.x, cb.y - ca.y] : [0, 0]; })(); // (how far the tablet glides)
      const scene = A.layers.some(l => l.role === 'title') !== B.layers.some(l => l.role === 'title') || A.layers.some(l => l.art) !== B.layers.some(l => l.art); // (a title and the art, or words only and the art: the one goes out, then the other comes in)
      const panelOver = slot => { const at = slot.layers.findIndex(l => l.role === 'panel'); return at >= 0 && slot.layers.some((l, i) => i < at && l.art); };
      const overlay = (slot, key) => { const layer = slot.layers.find(l => l.key === key); return !!layer && isOverlay({key, name: layer.name, kind: layer.kind}); };
      let swapping = gone.some(key => words(A.stage, key)); // (words that leave: the ones that come in wait for them)
      const artLeaves = !scene && gone.some(k => A.layers.find(l => l.key === k)?.art) && B.layers.some(l => l.art); // (a piece of the software leaves while another stays and changes: it goes first)
      const unlike = ({key, from}) => { const l = B.layers.find(x => x.key === key), as = partsOf(A.stage, from), bs = partsOf(B.stage, key); return !!l?.art && !!as[0] && !!bs[0] && !morphable(as[0], bs[0]) && differentArt(as[0], bs[0]); };
      const swapped = matched.some(m => m.same !== true && unlike(m)); // (a pair of art that has nothing in common: one goes, the other comes)
      for (const {key, from, same: looksSame} of matched) {
        const as = partsOf(A.stage, from), bs = partsOf(B.stage, key), ca = as[0] && centerOf(as[0]), cb = bs[0] && centerOf(bs[0]);
        const role = B.layers.find(l => l.key === key)?.role, same = (looksSame && ((as[0]?.style.scale ?? '') === (bs[0]?.style.scale ?? '') || (!!as[0] && !!bs[0] && !glideSpan(bs[0], as[0])))) || role === 'hand'; // (the same look in the same place and size on the screen is the same thing, whatever the styles that put it there say: two copies crossed would dip, the picture seen through itself: the flicker when the cursor comes in) // (the cursor is one thing: it glides, it is never crossed with another; one filmed from further back in the next is not the same)
        const by = ca && cb ? [cb.x - ca.x, cb.y - ca.y] : [0, 0], moves = Math.abs(by[0]) > 0.01 || Math.abs(by[1]) > 0.01;
        const click = !!B.info?.click && !!B.layers.find(l => l.key === key)?.art; // (a click: the screen changes after the cursor has pressed)
        if (role === 'hand') B.hoverFrom0 = !A.info?.handGone && Math.hypot(by[0], by[1]) < 30; // (the cursor stays: what it rests on is bold already)
        if (role === 'panel' && (panelOver(A) || panelOver(B))) { // the panel is stacked over the art in one of the two (a zoom: the screen pushed in, cut by the panel): B's is the one on show, over B's art all through the move, so what runs under it is cut all the way
          for (const el of as) play(el, fadeFrames('hide', 0));
          const top = Math.max(0, ...B.layers.filter(l => l.art).flatMap(l => partsOf(B.stage, l.key)).map(e => Number(getComputedStyle(e).zIndex) || 0));
          for (const el of bs) { if (moves) slide(el, by, -1, 0); if ((Number(getComputedStyle(el).zIndex) || 0) <= top) play(el, [{zIndex: top + 1, offset: 0}, {zIndex: top + 1, offset: 1}]); }
          continue;
        }
        if (B.info?.late?.has(key) && overlay(B, key)) { for (const el of as) play(el, fadeFrames('quick-out', opacityOf(el))); for (const el of bs) play(el, fadeFrames('hide', 0)); continue; } // (an outline that changes: it goes, the new one comes after: pensAt)
        if (same && role !== 'hand' && overlay(B, key)) { // an outline that is the same one a little further on: the NEW frame's glides from where the old one is (the old one waits out of sight), so it is over the new art all the way and never goes behind it (the user, 2026-10-12: no highlight behind the UI)
          for (const el of as) play(el, fadeFrames('hide', 0));
          if (moves) for (const el of bs) slide(el, by, -1, 0);
          continue;
        }
        const other = !same && !!B.layers.find(l => l.key === key)?.art && as[0] && bs[0] && !morphable(as[0], bs[0]) && differentArt(as[0], bs[0]); // (the software shown another way altogether, the phones then the tablet: one goes, then the other comes, never both half there)
        const swap = other || (!same && (scene || wordsOnly(as[0])) && wordsOnly(bs[0]) && (scene || as[0].textContent.trim() !== bs[0].textContent.trim())); // (the same words box with other words: the old ones go, then the new ones come; the same words only cross)
        if (swap) swapping = true;
        if (role === 'hand') { // the cursor is always on top of what changes: the next frame's one (over the old tablet) glides from where the old one is, the old one waits out of sight
          for (const el of as) play(el, fadeFrames('hide', 0));
          const drag = A.info?.drag && B.info?.click && !A.info?.handGone && dragOf(A, B);
          if (drag) { // it presses, drags what it holds (the knob goes with it; a list is swiped up and scrolls), lets go, then goes on (or rests there, or fades)
            const {P0, P1} = drag, stay = B.info?.rest || B.info?.handGone;
            for (const el of bs) {
              const k = parentScale(el) || 1, o = opacityOf(el);
              if (stay) { const [x, y] = translateOf(el); moveTo(el, [x + P1[0] / k, y + P1[1] / k]); } // (where it lets go is where it is after)
              const [bx, by0] = translateOf(el), base = stay ? P1 : [0, 0], at = p => `${bx + (p[0] - base[0]) / k}px ${by0 + (p[1] - base[1]) / k}px`;
              // The cursor holds the knob (the user, 2026-10-13: "the cursor is slower than the slide, it should be the one dragging the slide so stay put on top of the knob"): what it holds
              // goes by the curve of `windowEasing(t0, DRAG.end)` (the knob's own: eased, over its part of the move), so the cursor is on it at every moment, not behind it. The
              // move's clock is itself eased, so the curve is sampled in it: the cursor is where the knob is at the moment each sample is shown.
              const t0 = B.info?.slowDrag ? 0.12 : 0.3, last = stay ? P1 : [0, 0], N = 60, mix = (a, b, g) => [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g];
              play(el, Array.from({length: N + 1}, (_, i) => {
                const p = easeInv(i / N), holding = p <= DRAG.end, away = clamp01((p - DRAG.end) / (1 - DRAG.end)); // (p: how far the move is in its own time)
                const where = holding ? mix(P0, P1, ease(clamp01((p - t0) / (DRAG.end - t0)))) : mix(P1, last, ease(away));
                return {translate: at(where), opacity: B.info?.handGone ? o * (1 - away) : o, offset: i / N};
              }));
            }
          } else if (A.info?.handGone) for (const el of bs) enter(el, B, play, false); // (the one before has gone: this one comes in, from the words)
          else if (B.info?.rest) { // it waits where it clicked (put exactly where the one before is) while the screen goes on
            for (const el of bs) { const k = parentScale(el) || 1, [x, y] = translateOf(el); moveTo(el, [x - by[0] / k, y - by[1] / k]); }
          } else if (B.info?.handGone) { // the click that ends its work: it stays where it pressed (going along with the tablet) and fades out once the screen has changed
            const k0 = tabletBy;
            for (const el of bs) { const k = parentScale(el) || 1, [bx, by0] = translateOf(el), o = opacityOf(el), at = f => `${bx + (-by[0] + k0[0] * f) / k}px ${by0 + (-by[1] + k0[1] * f) / k}px`; play(el, [{translate: at(0), opacity: o, offset: 0}, {translate: at(0.3), opacity: o, offset: 0.3}, {translate: at(0.6), opacity: 0, offset: 0.6}, {translate: at(1), opacity: 0, offset: 1}]); }
          } else if (moves && B.info?.click) { // a click: the cursor stays on what it clicks (it goes along with the tablet, which glides to its new place), presses, the screen changes, THEN it goes on to the next
            const wait = 0.66, k0 = tabletBy;
            for (const el of bs) { const k = parentScale(el) || 1, [bx, by0] = translateOf(el), at = (dx, dy) => `${bx + dx / k}px ${by0 + dy / k}px`; play(el, [{translate: at(-by[0], -by[1]), offset: 0}, {translate: at(-by[0] + k0[0] * wait, -by[1] + k0[1] * wait), offset: wait}, {translate: at(0, 0), offset: 1}]); }
          } else if (moves) for (const el of bs) slide(el, by, -1, 0);
          continue;
        }
        if (!same && !scene && B.layers.find(l => l.key === key)?.art && morphable(as[0], bs[0])) { // the same screen in another state: it moves to it (scrolls, opens, zooms)
          const start = B.info?.click ? (B.info?.slowDrag ? 0.12 : 0.3) : artLeaves && !isLifted(B.layers.find(l => l.key === key)) ? 0.45 : 0, end = B.info?.click && A.info?.drag ? DRAG.end : 1; // (a click: the old screen until the cursor has pressed, then the new one, moving; a drag: as the cursor goes; another piece leaving: once it has gone, unless it is a lifted card, which goes along with the board leaving)
          const wait = start ? 0 : B.info?.still ?? 0, lead = start || wait; // (`wait`: a scene that asks for the screen to stand still a moment before it moves, the user, 2026-10-13: the new screen is there from the first moment, at the place of the old one, and goes after `wait` of the move: no dissolve, which showed two screens at once)
          if (moves) for (const el of bs.slice(1)) slide(el, by, -1, 0, lead); // (the screen itself goes to its place in the morph)
          const found = morph(as[0], bs[0], lead, play, end), till = Math.min(end, lead + TAKE_OVER); // (found.gone: what is only in the old screen; it fades out over the first part of the move, like the dissolve)
          const lonely = !start && showGone(as[0], found.gone, play, till); // (no click: the old screen is not shown but for that)
          for (const el of as) { if (lonely && el === as[0]) continue; const o = opacityOf(el); play(el, start ? takeOver(o, start, TAKE_OVER).old : fadeFrames('hide', 0)); } // (a click: the old screen stays under the new one while it comes in, then goes: what is the same does not change, what is different is crossed, never cut)
          if (start) for (const el of bs) { const o = opacityOf(el); play(el, takeOver(o, start, TAKE_OVER).next); } // (the root's own opacity is not morphed then)
          if (start) for (const el of found.gone) play(el, windowKeys({opacity: Number(getComputedStyle(el).opacity)}, {opacity: 0}, start, till)); // (what is only in the old screen is gone by the time it is covered)
          continue;
        }
        const placed = !same && !scene && !other && !!B.layers.find(l => l.key === key)?.art && !!as[0] && !!bs[0] && !glideSpan(bs[0], as[0]); // (the piece is in the same place and size in both: what changed is inside it)
        if (placed && magicMove(as[0], bs[0], play, B.info?.click ? 0.3 : 0)) continue; // the cards rearranged (on the same board): each glides to its new place
        // the same software filmed another way (its place, its size), not one screen in two states: the old one glides and scales to where the new one is, the new one from where the old one was, so the two are one tablet on the move, crossed
        const gliding = !same && !other && role !== 'hand' && !!B.layers.find(l => l.key === key)?.art && !!as[0] && !!bs[0], toNew = gliding ? glideSpan(bs[0], as[0]) : null, fromOld = gliding ? glideSpan(as[0], bs[0]) : null;
        for (const el of as) {
          if (gliding && el === as[0]) { if (toNew) play(el, [{...toNew.to, offset: 0}, {...toNew.from, offset: 1}]); }
          else if (moves && !other) slide(el, by, 0, 1, role === 'hand' && B.info?.click ? 0.45 : 0); // (a click: the cursor presses first, then goes on to the next)
          if (!same) play(el, fadeFrames(swap ? 'swap-out' : click ? 'click-out' : 'out', opacityOf(el)));
          if (!same && role === 'title') play(el, [{scale: '1'}, {scale: String(1 + TITLE.grow)}]); // (a title that goes grows a little, whatever takes its place)
        }
        for (const el of bs) {
          if (same) { play(el, fadeFrames('hide', 0)); continue; } // it is there already (the first glided to it): its copy waits
          if (gliding && el === bs[0]) { if (fromOld) play(el, [{...fromOld.from, offset: 0}, {...fromOld.to, offset: 1}]); }
          else if (moves && !other) slide(el, by, -1, 0);
          play(el, fadeFrames(penned(key) && !B.info?.penAfter ? 'pen-in' : swap ? 'swap-in' : click ? 'click-in' : 'in', opacityOf(el)));
        }
      }
      // what is only in one of the two: a picture is crossed (the new over the old, which leaves after it: no dip to the background), words are swapped
      for (const key of gone) for (const el of partsOf(A.stage, key)) { if (A.layers.find(l => l.key === key)?.role === 'title') play(el, [{scale: '1'}, {scale: String(1 + TITLE.grow)}]); } // (a title that goes grows a little)
      const artSwap = (gone.some(k => A.layers.find(l => l.key === k)?.art) || swapped) && added.some(k => B.layers.find(l => l.key === k)?.art); // (the software shown by another piece: the phones, then the tablet: one goes, then the other comes)
      for (const key of gone) for (const el of partsOf(A.stage, key)) play(el, fadeFrames((artSwap || artLeaves) && A.layers.find(l => l.key === key)?.art ? 'swap-out' : A.layers.find(l => l.key === key)?.role === 'hand' ? (A.info?.handOut || A.info?.endClick || A.info?.handGone ? 'hide' : A.info?.clickOut && B.info?.click ? 'click-out' : scene ? 'swap-out' : 'fade-out') : overlay(A, key) ? 'quick-out' : words(A.stage, key) || scene ? 'swap-out' : 'out', opacityOf(el))); // (a highlight goes first)
      for (const key of added) for (const el of partsOf(B.stage, key)) {
        if (B.layers.find(l => l.key === key)?.role === 'hand') { enter(el, B, play, false); continue; } // (the cursor comes in from the top left of the words)
        if (!scene && isLifted(B.layers.find(l => l.key === key)) && A.layers.some(l => l.art)) { // a card lifted out of the board: it rises from where the board has the card
          const zoom = !!B.info?.fadeThenZoom, o = opacityOf(el), span = zoom || sceneOf(A.frame) === sceneOf(B.frame) ? liftSpan(el, A.stage) : null; // (a card of the same name on the board of ANOTHER scene — covered by what is on it, a list on a page — is not the one this rises from: it comes in by itself; except the closed mission, which goes from its place on the board to the rating)
          if (span && zoom) { play(el, Object.assign(liftKeys(span, o, 12, false), {easing: windowEasing(TABLET_FADE.share, 1)})); continue; } // (the closed mission, the user, 2026-10-13: it stays exactly on its place on the board, drawn over its own card, while the tablet fades out (the first half of the move); then it zooms to the rating, easing in and out, with no lift and no overshoot)
          if (span) { play(el, liftKeys(span, o)); continue; }
          const [sx, sy] = scaleOf(el), [tx, ty] = translateOf(el), k = parentScale(el) || 1, card = el.querySelector('.chip') ?? el, rc = centerOf(el), cc = centerOf(card); // (no such card on the board: it grows where it is, from 85%, around its card)
          const d = rc && cc ? [(cc.x - rc.x) / k, (cc.y - rc.y) / k] : [0, 0], at = g => `${tx + d[0] * (1 - g)}px ${ty + d[1] * (1 - g)}px`, size = g => `${sx * g} ${sy * g}`;
          play(el, Array.from({length: 11}, (_, i) => { const g = i / 10, h = 0.85 + 0.15 * SPRING(g); return {opacity: o * Math.min(1, g * 2.5), scale: size(h), translate: at(h), offset: g}; }));
          continue;
        }
        if (B.info?.keep?.has(key)) continue; // (the same outline as before, by another name: it is there)
        play(el, fadeFrames(B.info?.late.has(key) || B.layers.find(l => l.key === key)?.role === 'title' ? 'hide' : artSwap && B.layers.find(l => l.key === key)?.art ? 'swap-in' : penned(key) && !B.info?.penAfter ? 'pen-in' : words(B.stage, key) ? (swapping || scene ? 'swap-in' : 'fade-in') : scene ? 'swap-in' : 'in', opacityOf(el))); // (a highlight waits until the art is in: pensAt)
      }
    }
    prep = {a, b, sa, sb, stampA: A.stamp, stampB: B.stamp, specs, anims: [], live: false, glide};
    if (live) fadesAt(A, nowT - timeline.items[a].start, timeline.items[a]); // (and back to where the clock has it: the picture shown next is not the end of the hold)
    if (startsAt != null) { driveScroll(A, nowT); driveScroll(B, nowT); } // (the lists go back to where they are NOW: a picture shown with them at the move's start would flash the end of the scroll)
    return prep;
  }

  // The move into the next frame is the heaviest thing the video does (the frame drawn, laid out, the pen made ready, every animation made: 60 to 140 ms in one picture), and it
  // was all done in the first picture of the hold, which stopped the video there (the user, 2026-10-12: stutter). It is done a step in each picture of the hold instead, each step
  // only if it is not done already: what is there is kept, so a move that comes before all the steps are taken (a hold of a few pictures, a jump on the bar) does what is left at once.
  function prepareAhead(a) {
    const b = a + 1, next = slots.findIndex(s => fresh(s, src.frames[b]));
    if (next < 0) { pair(a, b, true); return; }                                                                               // 1. the next frame, drawn
    const slot = slots[next];
    if (slot.layoutKey !== layoutKeyOf()) { ensureLayout(slot); return; }                                                     // 2. laid out: measured, everything placed
    if (Object.keys(slot.info?.anims ?? {}).some(key => !slot.pens.has(key))) { warmPens(slot); return; }                     // 3. the pen made ready (the costly part: thinning the letters)
    prepare(a, b);                                                                                                            // 4. the animations of the move (made once, then kept)
  }

  // The word of a rating (Poor, Fair, Good, Great, Excellent) is the one the knob is at, all the way: the knob is moved over a move, the word is the slide's own at its two ends.
  function followRate(slot) {
    for (const knob of slot.stage.querySelectorAll('.iq-rate-knob')) {
      const track = knob.parentElement, label = track?.parentElement?.querySelector('h4');
      if (!label || !track.clientWidth || !knob.getAnimations().length) continue;
      const word = RATE_LABELS[Math.max(0, Math.min(RATE_LABELS.length - 1, Math.round(parseFloat(getComputedStyle(knob).left) / track.clientWidth * (RATE_LABELS.length - 1))))];
      if (word && label.textContent !== word) label.textContent = word;
    }
  }

  function showStatic(index) {
    const frame = src.frames[index], visible = shown?.mode === 'static' ? [shown.slot] : [0, 1];
    let s = slots.findIndex(slot => fresh(slot, frame));
    if (s < 0) { s = [0, 1].find(i => !visible.includes(i)) ?? 0; build(slots[s], frame); }
    ensureLayout(slots[s]);
    if (shown?.mode === 'static' && shown.index === index && shown.slot === s && slots[s].shell.style.visibility === 'visible') return;
    if (prep && prep.a !== index) dropPrep(); else idleAnims(prep);
    backdrop.style.visibility = 'hidden';
    slots.forEach((slot, i) => {
      slot.shell.style.visibility = i === s ? 'visible' : 'hidden';
      slot.shell.style.zIndex = i === s ? '2' : '1';
      slot.shell.style.background = '';
      slot.shell.classList.remove('sb-pl-over');
      if (i !== s) pauseFilms(slot);
    });
    shown = {mode: 'static', index, slot: s};
  }

  // `u` is how far the move has gone, already eased.
  function showMove(a, b, u, tm) {
    const p = prepare(a, b), A = slots[p.sa], B = slots[p.sb];
    A.shell.style.visibility = B.shell.style.visibility = 'visible';
    A.shell.style.zIndex = '1'; B.shell.style.zIndex = '2';
    B.shell.classList.toggle('sb-pl-over', p.glide); // glide: what is under it shows through (the first frame's background stays)
    B.shell.style.background = p.glide ? '' : '#fff';
    backdrop.style.background = B.bgCss; backdrop.style.visibility = p.glide ? 'visible' : 'hidden'; // a fade to another scene: the next one is solid, or the first would show through it
    liveAnims(p);
    for (const anim of p.anims) anim.currentTime = u * D;
    followRate(B); // (the word of a rating goes with its knob)
    pensAt(A, 0, null, 'done'); pensAt(B, 0, null, 'before'); // (what was written stays; what is to be written is not there yet)
    clickAt(B, B.info?.click ? tm : -1, A);
    shown = {mode: 'move', a, b};
  }

  return {
    // The frames (in the order they play), what was changed on the storyboard, and the video's own data.
    setSource({frames, edits, video, script}) {
      const changed = frames !== src.frames || edits !== src.edits || video !== src.video || script !== src.script;
      src = {frames, edits, video, script};
      if (changed) timeline = script?.timeline ?? timelineOf(frames);
      return timeline;
    },
    get timeline() { return timeline; },
    // Show the video at second `t`. `ahead`: while playing, the next frame is got ready during the hold.
    show(t, ahead = false) {
      if (!src.frames.length || !src.edits || !src.video) return null;
      const at = locate(timeline, t);
      playing = ahead;
      if (frozen) return at;
      nowT = t;
      for (const slot of slots) driveScroll(slot, t);
      if (at.moving) showMove(at.index - 1, at.index, ease(at.progress), at.progress * timeline.items[at.index].move);
      else {
        showStatic(at.index);
        pensAt(slots[shown.slot], at.local, timeline.items[at.index]);
        if (ahead && at.index + 1 < src.frames.length) prepareAhead(at.index);
      }
      return at;
    },
    // The frame on, when it is held (not moving): where a text can be retyped. -> {stage, frame, edit, index} | null
    current() {
      if (shown?.mode !== 'static') return null;
      const slot = slots[shown.slot];
      return slot.frame ? {stage: slot.stage, frame: slot.frame, edit: slot.edit, index: shown.index} : null;
    },
    // The pen of the frame that is on is made ready (the pointer has come to the picture to press play: the first pen of a play was made as the video started, 60 to 120 ms).
    warm() { if (!frozen && shown?.mode === 'static') warmPens(slots[shown.slot]); },
    // While a text is retyped in the picture nothing is drawn again under it, and the words are plain (no pen over them).
    freeze(on) {
      frozen = !!on;
      if (frozen && shown?.mode === 'static') pensAt(slots[shown.slot], 0, null, 'done');
    },
    dispose() { watch?.disconnect(); dropPrep(); for (const slot of slots) { endPens(slot); slot.shell.remove(); } backdrop.remove(); },
  };
}
