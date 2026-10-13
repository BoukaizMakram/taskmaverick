// The storyboard's frames: one per action in the video. Pure timing, from the
// story's own beats (hand stops, when the bubble comes out, when the words type).
// Where something is only shown (a yellow rectangle marks it; there is no tail):
//   Scene in -> the outline -> the BUBBLE with no words -> the WORDS -> end.
// Where the hand acts with nothing on screen yet, the words come first (a stop with
// `launch`, lib/demoHand.mjs):
//   Scene in -> the BUBBLE with no words -> the WORDS -> the hand coming OUT of the
//   bubble, the tail halfway -> the tail out, the hand on its target ("hand": the
//   storyboard's edits keep that id) -> it clicks (the tail still out) -> the tail
//   FADING -> what the click did -> (the next clicks: the hand on it, the click, what
//   it did) -> end.
// Where a chapter goes on with the hand of the one before (a stop with `carry`):
//   Scene in (the hand where it was) -> the hand on its new target -> the TAIL coming
//   out of it, alone -> the BUBBLE with no words -> the WORDS -> the click -> the tail
//   FADING -> what it did -> (the next clicks) -> end.
// (The tail, the empty bubble and the words are separate frames on purpose: the
// storyboard shows each step on its own.) Frames closer than SPACING seconds are
// merged (the more important one stays) and a long quiet stretch gets a frame in
// the middle, so nothing that happens goes unseen.
import {LAUNCH, MARK, markFrom} from './demoHand.mjs';
export const SPACING = 0.04;  // two frames closer than this are one (the frames are states, not clock ticks: the hand lands, clicks and the tail comes out within 0.2 s)
export const MAX_GAP = 2.6;   // a quiet stretch longer than this gets a frame in the middle
export const TAIL_AFTER = 0.03; // seconds after the bubble starts: the tail, alone
const WEIGHT = {start: 1, end: 1, mid: 1, result: 2, hand: 3, mark: 3, click: 4, out: 5, fading: 5, tail: 6, bubble: 6, words: 6};
export const OUT_AT = 0.5;     // the "coming out" frame: this share of the way (the hand and the tail halfway)
export const FADING_AT = 0.35; // the "fading" frame: this share of the tail's fade (it is still mostly there)

const nice = key => String(key ?? '').replace(/^(yes|no|quiz|rate|iso|web)-?/, '$1 ').replace(/[-_:]+/g, ' ').trim().replace(/^\w/, c => c.toUpperCase());
const round = n => Math.round(n * 100) / 100;

// What the bubble is at `e` seconds into a chapter: null (not yet), 'tail'
// (just the tail), 'empty' (the bubble before its words) or 'words'.
// (`tail`: the bubble comes out of the hand, its tail first; else it starts empty.)
export function bubbleMode(e, {say, textAt, tail = false}) {
  if (say == null || e < say) return null;
  if (tail && e < say + TAIL_AFTER + 0.12) return 'tail';
  return e < textAt ? 'empty' : 'words';
}

// One chapter's frames: [{kind, label, time (seconds into the chapter), bubble}].
export function planChapter(scene, {stops = [], say = null, textAt = 0, skip = 0} = {}) {
  const events = [], last = scene.duration - 0.05, ready = scene.ready ?? 1, tailFirst = !!stops[0]?.carry;
  const mode = time => bubbleMode(time, {say, textAt, tail: tailFirst});
  const push = (time, kind, label) => { if (time >= skip && time <= last) events.push({time: round(time), kind, label, bubble: mode(time)}); };
  push(skip + 0.12, 'start', 'Scene in');
  stops.forEach((stop, i) => {
    const click = (stop.kind ?? 'click') !== 'point', nth = stops.length > 1 ? ` (${i + 1} of ${stops.length})` : '';
    // what is only shown has no hand: its frame is the yellow rectangle around it, once it is drawn
    if (!click) { if (stop.mark !== false) push(Math.max(stop.press - 0.1, markFrom(stop) + MARK.fade + 0.02), 'mark', `Outline on ${nice(stop.target)}${nth}`); return; }
    if (stop.launch) { // words first: the hand comes out of the bubble on the tail, then rests on its target with it
      push(stop.ring + (stop.arrive - stop.ring) * OUT_AT, 'out', 'Hand coming out, tail halfway');
      push(stop.arrive + 0.06, 'hand', `Tail and hand on ${nice(stop.target)}`);
    } else push(stop.carry ? stop.arrive + 0.01 : stop.press - 0.1, 'hand', `Hand on ${nice(stop.target)}${nth}`);
    push(stop.press + 0.03, 'click', `Click ${nice(stop.target)}${nth}`);
    if (stop.launch || stop.carry) push(stop.fade + LAUNCH.fade * FADING_AT, 'fading', 'Tail fading out'); // after the click
    // (what the click did, once it is done: `settle` is when its animation ends, so the frame never shows it half way, the user, 2026-10-06)
    push(Math.max((stop.hold ?? stop.press) + 0.55, stop.settle ?? 0), 'result', `After the click${nth}`);
  });
  if (say != null) {
    if (tailFirst) push(say + TAIL_AFTER, 'tail', 'Tail out of the hand');
    push(textAt - 0.01, 'bubble', 'Bubble, no words');
  }
  push(Math.min(textAt + ready + 0.12, scene.duration - 0.2), 'words', 'Words');
  push(scene.duration - 0.25, 'end', 'End of the chapter');
  events.sort((a, b) => a.time - b.time);
  // merge frames that are too close: the more important one stays
  const kept = [];
  for (const event of events) {
    const previous = kept.at(-1);
    if (previous && event.time - previous.time < SPACING) { if (WEIGHT[event.kind] > WEIGHT[previous.kind]) kept[kept.length - 1] = event; continue; }
    kept.push(event);
  }
  // fill the quiet stretches (a mission expanding, a list scrolling)
  const filled = [];
  kept.forEach((event, i) => {
    filled.push(event);
    const next = kept[i + 1];
    if (!next) return;
    const parts = Math.ceil((next.time - event.time) / MAX_GAP);
    for (let k = 1; k < parts; k++) {
      const time = round(event.time + (next.time - event.time) * k / parts);
      filled.push({time, kind: 'mid', label: 'Moving', bubble: mode(time)});
    }
  });
  return filled;
}

// The whole video: every chapter's frames in order, numbered 1.. with a stable id
// (`chapter/kind`, or `chapter/kind-2` when a kind repeats in a chapter).
export function planVideo({story, handStops = {}, say = {}, textAt = {}, skip = {}}) {
  const frames = [];
  story.forEach((scene, index) => {
    const seen = {};
    planChapter(scene, {stops: handStops[scene.id], say: say[scene.id] ?? null, textAt: textAt[scene.id] ?? 0, skip: skip[scene.id] ?? 0}).forEach(event => {
      seen[event.kind] = (seen[event.kind] ?? 0) + 1;
      frames.push({
        id: `${scene.id}/${event.kind}${seen[event.kind] > 1 ? `-${seen[event.kind]}` : ''}`,
        n: frames.length + 1, chapter: scene.id, chapterNumber: index + 1, kind: event.kind, label: event.label,
        time: round(scene.start + event.time), at: event.time, bubble: event.bubble,
      });
    });
  });
  return frames;
}
