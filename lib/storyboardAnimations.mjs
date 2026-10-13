// The Animations line (the user, 2026-10-12: "add a line on top called animations where it's just different animation like cursor click on something,
// highlight, handwritten, zoom in, fade in with scale in, fadeout, etc.. all animation we already did, make sure it looks amazing"; then "make them videos not
// slides"): the first line of the Improved Quality board, one VIDEO for each animation the storyboard's videos play (lib/storyboardCells.mjs: the line is a line of
// videos, each made of the slides of its scene, which stay in the line and show again when the line is shown as slides). In the board's own look (a plate with the
// art on the left, the animation's name in white handwriting on the right); each slide has a name and the first slide of a scene a note telling how it moves
// (the numbers are the player's: components/storyboardPlayerDom.js), which is the video's note on the board. The line also has the reel of all of them in one
// video (lib/storyboardVideos.mjs, `animations`), at the end of the row.
//
// The slides are made from the board's own: a scene is a few frames that are duplicates of real ones (a scene of the video, so it plays exactly as it does
// there) with the words retyped to the animation's name, or frames of the other board pasted as frames of assets. Pure: edits in, edits out;
// scripts/storyboard-animations.mjs reads the boards, calls this and saves.
import {ANIM_CPS, addCopy, hideLayer, layersOf, moveLayers, prune, removeCopy, removeInsert, setAnim, setBackground, setInsertHtml, setMove, setName, setNote, setLineVideos, setScale, setSize, setStyle, setText, unhideLayer} from './storyboardEdits.mjs';
import {textsOf} from './storyboardHtml.mjs';
import {copyFrames, copyLayers, pasteFrames, pasteLayers} from './storyboardClipboard.mjs';
import {hashString} from './storyboardParts.mjs';

export const ANIMATIONS = {id: 'animations', title: 'Animations'};

// ---- What each animation is (the notes under the frames) ----
// The numbers are the video's (components/storyboardPlayerDom.js, lib/storyboardPlayer.mjs): keep them in step when those change.
const NOTE = {
  'fade-in': 'FADE IN WITH SCALE\nA title comes in small (70%) and faint and grows to its size while it fades in: 0.8 s, ease in-out. Every title and the closing words do it. This frame is the board\'s step; the video plays the real thing, never a half-faded slide.',
  'fade-out': 'FADE OUT\nA title that goes grows a little (10%) while it fades out, over the move to the next scene (0.6 s): the old words are gone before the new ones come. The two frames after are the board\'s steps. The last title of a video stays on.',
  'handwritten': 'HANDWRITTEN\nA pen writes the words along the strokes of the letters, 22 letters a second (the Speed slider, 4 to 60; the blue play button on the frame plays it here). Words first, then the action. Never typed, never half-faded.',
  'click': 'CURSOR CLICK\nThe cursor comes in from the top-left of the words, glides 0.6 s to the exact middle of what it clicks, hovers (the text turns bold, 0.3 s, without moving), presses (a dip, a ring) and THEN the screen changes, dissolving in over the old one: no hard cut. 1.15 s a click.',
  'highlight': 'HIGHLIGHT\nWhat is only shown (an alert, a timer, a card) gets no hand: a thick yellow rounded outline. It comes in after the art is there (0.25 s later, fading in over 0.25 s) and goes out first. The hand is only for actions.',
  'zoom': 'ZOOM IN\nThe same screen at another scale: it scales and moves in one glide, 0.9 s ease in-out, with all it holds. The dark panel over it cuts what runs under the words, so the screen is pushed in, not shrunk back.',
  'pop': 'POP UP\nA mission is lifted out of its board: the card rises from its own place on the board, growing and settling a hair over (0.85 s), as the board dims; no outline. Then the board goes and the card glides to the middle (0.85 s). What is isolated is what is talked about.',
  'expand': 'EXPAND\nA card opens into its details: the same screen in two states, so it grows (heights, 0.5 s) and its content scrolls into place, instead of one picture fading into the other.',
  'scroll': 'SCROLL\nA list moves under the cursor: the cursor presses, a swipe up (200 px) and the content scrolls with it. Only where going through a lot is the point (the proofs, the tour, the report).',
  'glide': 'GLIDE\nA card that goes somewhere else glides from where it was to where it is (0.6 s) and the others slide to make room: a mission that goes to the top pushes the others down.',
  'color': 'COLOR CHANGE\nA timer turns from green to orange to red as time runs short: it changes at once, no fade (colors snap). The outline comes in after the screen is still.',
  'panel': 'PANEL WIPE\nThe software comes in alone, centered, while nothing is said. When words come, the dark panel wipes in from the right edge and the tablet glides to the left to make room (0.6 s); then the words are written.',
  'drag': 'DRAG\nThe cursor presses (0.3 s), carries the rating knob along its track (to 0.75 of the move) and lets go; the knob goes with it, then the cursor goes on to Submit. A screen too big for its side is filmed from further back, whole.',
  'claim': 'CLAIM AND CLOSE\nA person takes a mission: their avatar lands on the card and the card glides from Open to Claimed. When it is done: the personal code, then the card glides on to Closed and goes gray, its timers stopped. No outline: the card moving is what is seen.',
  'menu': 'MENU, DRAWER, VIDEO\nOne click leads to the next: the burger menu opens (the tablet dims), the Knowledge Base slides in, Onboarding opens, and its video plays with a timeline running by the clock. The cursor stays on what it clicks until the screen has changed.',
};

// ---- The scenes ----
// frame: {from: a frame of this board (it is duplicated: everything it has comes along), or other: {board, id} (a frame of the other board, pasted as a
//        frame of assets); name: what the frame's header says; note; words (its chat box's) / title (its title's words); quiet: no chat box here on purpose;
//        step: [scale, opacity] (a title shown at that size and faintness: a step of its fade); hide / show: [asset keys] taken out / brought back; plain: no yellow outline in it (the pop and the claim and close have none); bubbleFrom: a frame whose chat box is put in this one, with
//        look: {size, width, center: [x, y]} (the words' size, the box's width and where the middle of the words is); edit: (edits, id, {frame}) => edits}
const TITLE = 'conclusion/words', PEN = {type: 'handwrite', cps: ANIM_CPS.default};
const SIDE = {x: 521, y: 450}; // the middle of the left part of a frame (the plate), where the art of a scene sits
export const SCENES = [
  {id: 'fade-in', name: 'Fade in with scale', frames: [
    {from: TITLE, title: 'Fade In\nWith Scale', step: [0.64, 0.18], name: 'Fade in with scale · small and faint', note: NOTE['fade-in']},
    {from: TITLE, title: 'Fade In\nWith Scale', name: 'Fade in with scale · full size'},
  ]},
  {id: 'fade-out', name: 'Fade out', frames: [
    {from: TITLE, title: 'Fade Out', name: 'Fade out · full size', note: NOTE['fade-out']},
    {from: TITLE, title: 'Fade Out', step: [1.05, 0.45], name: 'Fade out · growing, half gone'},
    {from: TITLE, title: 'Fade Out', step: [1.1, 0.1], name: 'Fade out · almost gone'},
    {from: TITLE, hide: ['title'], name: 'Fade out · gone'}, // (the video needs something after the title for it to go: the last title of a video stays on)
  ]},
  {id: 'handwritten', name: 'Handwritten', frames: [
    {from: TITLE, hide: ['title'], bubbleFrom: 'translation/words', words: 'Handwritten\nA pen writes each letter', look: {size: 62, width: 1000, center: [800, 450]}, name: 'Handwritten · written by a pen', note: NOTE.handwritten},
  ]},
  {id: 'panel', name: 'Panel wipe', frames: [
    {from: 'knowledge/start#2', quiet: true, name: 'Panel wipe · the software comes in, nothing said', note: NOTE.panel},
    {from: 'knowledge/words', words: 'Panel Wipe\nThe tablet makes room', name: 'Panel wipe · the panel wipes in, the tablet glides left'},
  ]},
  {id: 'click', name: 'Cursor click', frames: [
    {from: 'translation/words', words: 'Cursor Click\nGlide, hover, press', name: 'Cursor click · the cursor arrives', note: NOTE.click},
    {from: 'translation/fading', words: 'Cursor Click\nGlide, hover, press', name: 'Cursor click · first click: translated'},
    {from: 'translation/result-2', words: 'Cursor Click\nGlide, hover, press', name: 'Cursor click · second click: back'},
  ]},
  {id: 'highlight', name: 'Highlight', frames: [
    {from: 'alerts/words', words: 'Highlight\nA yellow outline', name: 'Highlight · the outline comes in after the art', note: NOTE.highlight},
    {from: 'links/words', words: 'Highlight\nA yellow outline', name: 'Highlight · it goes, the next one comes in'},
  ]},
  {id: 'zoom', name: 'Zoom in', frames: [
    {from: 'emphasis/words', words: 'Zoom In\nOne smooth push', name: 'Zoom in · the whole board', note: NOTE.zoom},
    {from: 'emphasis/words', words: 'Zoom In\nOne smooth push', name: 'Zoom in · pushed in on the closed missions', edit: (e, id, {frame}) => {
      // the board 2.7 times bigger (measured in the page: a move of 1 is 1.28995 stage px here): the closed column's header and top cards on the plate, the screen's edge under the panel (no black bezel by it)
      let n = setScale(e, id, 'team-board', [2.575, 2.575]);
      n = setMove(n, id, 'team-board', [-37.69, 737.1]);
      return moveLayers(n, frame, ['panel'], 'forward'); // the panel over the board: it cuts what runs under the words
    }},
  ]},
  {id: 'pop', name: 'Pop up', frames: [
    {from: 'emphasis/words', words: 'Pop Up\nA mission lifts out', name: 'Pop up · the board', note: NOTE.pop},
    {from: 'emphasis/result', words: 'Pop Up\nA mission lifts out', plain: true, name: 'Pop up · lifted out, the board dimmed'},
    {from: 'emphasis/end', words: 'Pop Up\nA mission lifts out', plain: true, name: 'Pop up · isolated', edit: (e, id) => setMove(e, id, 'lifted-mission', [-77.9, 21.3])}, // (the card in the middle of the plate: the frame had it a little to the right)
  ]},
  {id: 'expand', name: 'Expand', frames: [
    {from: 'instructions/words', words: 'Expand\nA card opens', name: 'Expand · a card', note: NOTE.expand},
    {from: 'instructions/mark', words: 'Expand\nA card opens', name: 'Expand · opened into its details'},
  ]},
  {id: 'scroll', name: 'Scroll', frames: [
    {from: 'mobile/words', words: 'Scroll\nThe list moves', name: 'Scroll · the list', note: NOTE.scroll},
    {from: 'mobile/result', words: 'Scroll\nThe list moves', name: 'Scroll · scrolled up'},
    {from: 'mobile/end', words: 'Scroll\nThe list moves', name: 'Scroll · scrolled again'},
  ]},
  {id: 'drag', name: 'Drag', frames: [
    {from: 'rate/words', words: 'Drag\nThe cursor carries the knob', name: 'Drag · the mission to rate', note: NOTE.drag},
    {from: 'rate/result', words: 'Drag\nThe cursor carries the knob', name: 'Drag · the cursor presses the knob'},
    {from: 'rate/click-2', words: 'Drag\nThe cursor carries the knob', name: 'Drag · the knob dragged to its place'},
    {from: 'rate/click-3', words: 'Drag\nThe cursor carries the knob', name: 'Drag · Submit'},
    {from: 'rate/end', words: 'Drag\nThe cursor carries the knob', name: 'Drag · rated'},
  ]},
  {id: 'glide', name: 'Glide', frames: [
    {other: {board: 'increased-efficiency-v2', id: 'priority/bubble'}, words: 'Glide\nCards slide to place', name: 'Glide · before', note: NOTE.glide},
    {other: {board: 'increased-efficiency-v2', id: 'priority/words'}, words: 'Glide\nCards slide to place', name: 'Glide · the urgent card goes to the top'},
  ]},
  {id: 'color', name: 'Color change', frames: [
    {other: {board: 'increased-efficiency-v2', id: 'urgency/bubble'}, words: 'Color Change\nThe timer turns red', name: 'Color change · orange', note: NOTE.color},
    {other: {board: 'increased-efficiency-v2', id: 'urgency/words'}, words: 'Color Change\nThe timer turns red', name: 'Color change · red'},
  ]},
  {id: 'claim', name: 'Claim and close', frames: [
    {other: {board: 'increased-efficiency-v2', id: 'claim/bubble'}, words: 'Claim And Close\nA mission moves across', plain: true, name: 'Claim · a person takes a mission', note: NOTE.claim},
    {other: {board: 'increased-efficiency-v2', id: 'claim/words'}, words: 'Claim And Close\nA mission moves across', plain: true, name: 'Claim · it is in Claimed'},
    {other: {board: 'increased-efficiency-v2', id: 'close/words'}, words: 'Claim And Close\nA mission moves across', plain: true, name: 'Close · the personal code'},
    {other: {board: 'increased-efficiency-v2', id: 'close/end'}, words: 'Claim And Close\nA mission moves across', plain: true, name: 'Close · it is in Closed'},
  ]},
  {id: 'menu', name: 'Menu, drawer, video', frames: [
    {from: 'knowledge/fading#2', words: 'Menu, Drawer, Video\nOne click leads to the next', name: 'Menu · the cursor goes to the burger', note: NOTE.menu},
    {from: 'knowledge/result', quiet: true, name: 'Menu · it opens, the tablet dims'},
    {from: 'knowledge/hand-3#2', quiet: true, hide: ['bubble'], name: 'Drawer · the Knowledge Base slides in'},
    {from: 'knowledge/result-3', quiet: true, name: 'Video · Onboarding opens'},
    {from: 'knowledge/result-3#2', bubbleFrom: 'knowledge/result-3', name: 'Video · it plays, a timeline running', edit: (e, id) => setMove(e, id, 'panel', [-557.4, 0])}, // (the words of the frame before stay while the video plays, so the panel stays behind them: in the board this frame has its chat box taken out and the panel parked)
  ]},
];

// ---- Building it ----
const keyOfText = (html, layer) => textsOf(html(layer.asset) ?? '', layer.key)[0]?.key ?? null;
const px = (html, name) => Number(new RegExp(`${name}:\\s*(-?[\\d.]+)px`).exec(html)?.[1]);
const PAD = 30; // a chat box's room round its words, sideways (lib/captionBubbles.mjs)

// The line out of `edits`: its frames are duplicates (all of them removed), and the line itself.
export function withoutAnimations(edits) {
  let next = edits;
  for (const id of edits.rows?.[ANIMATIONS.id] ?? []) next = removeCopy(next, id);
  const rows = {...next.rows};
  delete rows[ANIMATIONS.id];
  const L = next.lines ?? {added: {}, titles: {}, deleted: []}, added = {...L.added};
  delete added[ANIMATIONS.id];
  return prune({...next, rows, lines: {...L, added}});
}

// `ctx`: {frames: this board's frames in order (the ones a scene is made from), htmlOf, other: {boardId: {frames, edits, htmlOf, stage}}}
// -> {edits, ids: [frame ids of the line, in order], scenes: [{id, name, ids}], problems: [text]}
export function buildAnimations(edits, {frames, htmlOf, other = {}}, scenes = SCENES) {
  const byId = new Map(frames.map(f => [f.id, f]));
  let next = withoutAnimations(edits);
  const L = next.lines ?? {added: {}, titles: {}, deleted: []};
  next = {...next, lines: {...L, added: {...L.added, [ANIMATIONS.id]: {title: ANIMATIONS.title, after: null}}}};
  const ids = [], made = [], problems = [];
  const anchor = scenes.flatMap(s => s.frames).find(f => f.from && byId.has(f.from))?.from ?? frames[0]?.id; // (a frame of the board the first one follows, so it is on the board before the line's order is given)
  const html = hash => next.library[hash] ?? htmlOf(hash);
  const frameNow = id => { const c = next.copies[id]; return {id, layers: c ? (c.from === null ? [] : byId.get(c.from)?.layers ?? []) : byId.get(id)?.layers ?? []}; };
  for (const scene of scenes) {
    const sceneIds = [];
    for (const [n, spec] of scene.frames.entries()) {
      const where = `${scene.name} ${n + 1}`, last = ids.at(-1);
      let id;
      if (spec.from) {
        if (!byId.has(spec.from)) { problems.push(`${where}: no frame ${spec.from} on this board`); continue; }
        ({id, edits: next} = addCopy(next, {from: spec.from, after: last ?? spec.from, inherit: spec.from}));
      } else if (spec.other) {
        const board = other[spec.other.board], source = board?.frames.find(f => f.id === spec.other.id);
        if (!source) { problems.push(`${where}: no frame ${spec.other.id} on ${spec.other.board}`); continue; }
        const clip = copyFrames({frames: [source], edits: board.edits, htmlOf: board.htmlOf, stage: board.stage, video: spec.other.board});
        const pasted = pasteFrames(next, clip.items, {after: last ?? anchor, known: () => false});
        next = pasted.edits; id = pasted.ids[0];
        const background = board.edits.frames[source.id]?.background;
        if (background) next = setBackground(next, id, background);
        next = setNote(next, id, ''); // (its note on the other board is not this line's)
        for (const layer of layersOf({id, layers: []}, next.frames[id])) { // a piece captured with no height (the cards of a scene: 1600 x 0) is pasted as tall as the frame, and what is scaled or moved on it goes about another middle: it keeps its own
          const at = layer.kind === 'dom' && layer.box && layer.box.h < 1 ? html(layer.asset) : null, fixed = at?.replace(/height:\s*900px/, 'height:0px');
          if (at && fixed !== at) next = setInsertHtml(next, id, layer.key, fixed, hashString(fixed));
        }
      } else { problems.push(`${where}: nothing to make it from`); continue; }
      ids.push(id); sceneIds.push(id);
      const frame = frameNow(id);
      for (const key of spec.hide ?? []) next = hideLayer(next, id, key);
      for (const key of spec.show ?? []) next = unhideLayer(next, id, key);
      if (spec.plain) for (const l of layersOf(frame, next.frames[id])) if (/outline|highlight/i.test(l.name ?? '')) next = next.frames[id]?.inserts?.some(x => x.key === l.key) ? removeInsert(next, id, l.key) : hideLayer(next, id, l.key); // (a scene with no yellow outline)
      if (spec.bubbleFrom) { // a chat box from another frame (a frame of only words has none)
        const src = byId.get(spec.bubbleFrom), at = src && layersOf(src, next.frames[src.id]).find(l => l.kind === 'bubble');
        if (!at) problems.push(`${where}: no chat box in ${spec.bubbleFrom}`);
        else next = pasteLayers(next, frame, copyLayers({frame: src, edit: next.frames[src.id], keys: [at.key], htmlOf: html}).items).edits;
      }
      const layers = layersOf(frame, next.frames[id]);
      const bubble = layers.find(l => l.kind === 'bubble'), title = layers.find(l => /^title$/i.test(l.name ?? '') && !next.frames[id]?.hidden?.includes(l.key));
      if (spec.words != null) {
        if (!bubble && spec.quiet) { /* no chat box in this frame on purpose */ } else if (!bubble) problems.push(`${where}: ${spec.from ?? spec.other.id} has no chat box for "${spec.words}"`);
        else {
          next = setText(next, id, keyOfText(html, bubble) ?? `${bubble.key}/0.0`, spec.words);
          next = setAnim(next, id, bubble.key, PEN); // the blue play button on the frame: the pen writes it
          if (spec.look) { // the words as the video's hero: this big, this wide, the middle of them here (the box starts at its own left, its words centered in it less the padding)
            const at = html(bubble.asset), left = px(at, 'left'), top = px(at, 'top'), [cx, cy] = spec.look.center;
            next = setStyle(next, id, bubble.key, {size: spec.look.size});
            next = setSize(next, id, bubble.key, [spec.look.width, 0]);
            next = setMove(next, id, bubble.key, [cx - (spec.look.width - 2 * PAD) / 2 - left, cy - top]);
          }
        }
      }
      if (spec.title != null) {
        if (!title) problems.push(`${where}: ${spec.from ?? spec.other.id} has no title for "${spec.title}"`);
        else {
          next = setText(next, id, keyOfText(html, title) ?? `${title.key}/0`, spec.title);
          if (spec.step) { next = setScale(next, id, title.key, [spec.step[0], spec.step[0]]); next = setStyle(next, id, title.key, {opacity: spec.step[1]}); }
        }
      }
      if (spec.edit) next = spec.edit(next, id, {layers, frame: frameNow(id)});
      if (spec.name) next = setName(next, id, spec.name);
      if (spec.note) next = setNote(next, id, spec.note);
    }
    made.push({id: scene.id, name: scene.name, ids: sceneIds});
  }
  // the line holds exactly these frames, in this order (a frame made from another is not in its row any more)
  const rows = Object.fromEntries(Object.entries(next.rows).map(([row, list]) => [row, list.filter(id => !ids.includes(id))]));
  next = prune({...next, rows: {...rows, [ANIMATIONS.id]: ids}});
  next = setLineVideos(next, ANIMATIONS.id, made.filter(s => s.ids.length)); // the line is a line of VIDEOS (the user, 2026-10-12: "make them videos not slides"): one for each scene, made of its slides
  return {edits: next, ids, scenes: made, problems};
}
