// The hand: a big yellow pointing hand flies to what the words are about,
// clicks it, and the speech bubble comes out of the click (first a teardrop at
// the fingertip, then the bubble, then the words). So a chapter goes:
//   the hand flies in -> it clicks (this is the action) -> the bubble -> the words.
// Where the cursor acts (the user, 2026-10-05; LAUNCH below):
//   nothing on screen yet: the empty box -> the words -> the tail reaches out, the
//     cursor on its tip -> the cursor clicks -> then the tail fades -> what the click does;
//   more clicks with the same words: the cursor stays and goes on to the next, the box
//     going with it;
//   the next chapter goes on with the cursor (other words): the words before fade where
//     they are, the cursor goes to what it will click, a new bubble comes out of it (the
//     tail, then the box, then the words), it clicks, the tail fades.
// What is only shown has no tail at all: the box on the right, then its words.
// Pure timing; the demos measure where the targets are and draw the hand
// (components/demoHandDom.js).
const clamp01 = p => Math.max(0, Math.min(1, p));
const ease = p => 1 - (1 - clamp01(p)) ** 3;
const smooth = p => { p = clamp01(p); return p * p * p * (p * (p * 6 - 15) + 10); };

export const HAND = {
  travel: 0.8,   // from leaving its spot to clicking a target, when it comes from afar
  hop: 0.5,      // between targets that are close together
  arrive: 0.1,   // the hand is on its target this long before the click
  press: 0.18,   // how long the click stays down
  say: 0.05,     // the bubble starts this long after the click
  linger: 0.6,   // the hand stays this long after a click, then fades out
  textLag: 0.3,  // the words start this long after the bubble starts
  fadeIn: 0.2, fadeOut: 0.25,
};

// A click: the hand leaves at `ring`, clicks at `press`, and what it opened is
// ready `open` seconds later.
export const tap = (ring, open = 0.35, lead = HAND.travel) => ({ring, press: ring + lead, open: ring + lead + open});

// The bubble's and the words' times after the click at `press`, with the words
// `ready` seconds long: { say, text, typed }.
export function speak(press, ready) {
  const say = press + HAND.say, text = say + HAND.textLag;
  return {say, text, typed: text + ready};
}

// ---- Words first ---------------------------------------------------------------
// Nothing on screen yet (`launch`): the box pops EMPTY, already at the size of the
// words it will hold; the words type; then the tail reaches out of the bubble to what
// will be clicked, with the cursor on its tip (it comes out of the bubble, where the
// tail comes from); the cursor clicks; then the tail fades out (the user, 2026-10-05).
export const LAUNCH = {
  textLag: 0.45, // the words start this long after the empty box starts (it has popped)
  pause: 0.35,   // the words are in: a beat before the tail and the cursor come out (or before the click)
  out: 0.6,      // the tail reaches its target, the cursor riding its tip
  hold: 0.12,    // both rest there, then the click
  after: 0.1,    // the tail starts fading this long after the click
  fade: 0.25,    // and is gone this long after that
};
// A chapter that starts with nothing on screen, its box starting at `say`, with words
// `ready` seconds long: { say, text, typed, ring (the tail and the cursor set off), arrive
// (they are on the target), press (the click), fade (the tail starts fading), open (what
// the click opened is ready) }.
export function launch(say, ready, open = 0.35) {
  const text = say + LAUNCH.textLag, typed = text + ready, ring = typed + LAUNCH.pause, arrive = ring + LAUNCH.out;
  const press = arrive + LAUNCH.hold;
  return {say, text, typed, ring, arrive, press, fade: press + LAUNCH.after, open: press + open};
}
// A chapter that goes on with the cursor of the one before (`relaunch`), other words: the
// words before have faded where they were; the cursor sets off at `ring` and is on what it
// will click `travel` later; the bubble comes out of it (the tail, then the box), the words
// type, a beat, the click, then the tail fades. Same shape as `launch`.
export function relaunch(ring, ready, open = 0.35, travel = HAND.hop + 0.1) {
  const arrive = ring + travel, say = arrive + HAND.say, text = say + HAND.textLag, typed = text + ready, press = typed + LAUNCH.pause;
  return {say, text, typed, ring, arrive, press, fade: press + LAUNCH.after, open: press + open};
}
// The stop of that first click (or swipe: `extra` = {kind: 'scroll', hold}).
export const launchStop = (target, t, extra) => ({target, ring: t.ring, arrive: t.arrive, fade: t.fade, press: t.press, launch: true, ...extra});
// The first stop of a chapter that goes on with the cursor: `from` is the last stop of the
// chapter before ({target, kind}), where the cursor still is when this one starts.
export const carryStop = (target, t, from, extra) => ({target, ring: t.ring, arrive: t.arrive, fade: t.fade, press: t.press, carry: {target: from.target, kind: from.kind ?? 'click'}, ...extra});
export const launches = stops => !!stops?.[0]?.launch;
export const carries = stops => !!stops?.[0]?.carry;
// The tail of a chapter where the cursor acts, at chapter time `e`: how far it reaches (0-1,
// with the cursor; a bubble coming out of the cursor brings its own tail: 1) and how much it
// shows (1, then fading to 0 after the click). No tail anywhere else.
export function launchTail(stops, e) {
  const s = stops?.[0];
  if (!s?.launch && !s?.carry) return {reach: 0, opacity: 0};
  const opacity = 1 - clamp01((e - s.fade) / LAUNCH.fade);
  if (s.carry) return {reach: 1, opacity};
  if (e < s.ring) return {reach: 0, opacity: 0};
  return {reach: smooth((e - s.ring) / Math.max(0.05, s.arrive - s.ring)), opacity};
}

// What the hand does at a stop (`kind`):
//   click   presses the target (a ripple where it lands)
//   scroll  presses and swipes up while the content scrolls (`hold` is when it lets go)
//   point   nothing is done, something is only shown (an alert, a link, a timer): there
//           is NO hand. What is shown is marked with a thick yellow rounded rectangle
//           (marksOf below) and the bubble comes out of it
// (a click that is held until `hold` and follows its target is a drag).
// The hand is for actions only: clicking, dragging, scrolling.
// Between the clicks of a chapter it stays on screen, going from one to the next; after
// the last one it lingers a moment, then fades out (unless the next chapter goes on with
// it: that stop says `stay`).
export const leaveOf = stop => (stop.hold ?? stop.press) + HAND.linger;

// What a chapter only shows is marked, not pointed at: a thick yellow rounded
// rectangle around it. From its `point` stops: [{target, from, until}], seconds into
// the chapter. A stop can say `mark: false` (nothing to mark), `mark: key` or
// `mark: [keys]` (what to mark instead of its target), `markAt` (when it appears;
// default: a moment after the hand would have set off, so a chapter opens clean)
// and `markUntil` (when it goes).
export const MARK = {lead: 0.15, fade: 0.3, pad: [12, 9]}; // seconds before it starts, and to fade in / out; stage px around what it marks
export const markFrom = stop => stop.markAt ?? stop.ring + MARK.lead;
export function marksOf(stops) {
  return (stops ?? []).filter(s => s.kind === 'point' && s.mark !== false)
    .flatMap(s => [s.mark ?? s.target].flat().map(target => ({target, from: markFrom(s), until: s.markUntil ?? Infinity})));
}
// How much a mark shows at chapter time `e` (0-1).
export const markOpacity = (mark, e) => (e < mark.from ? 0 : Math.min(1, (e - mark.from) / MARK.fade) * (e <= mark.until ? 1 : Math.max(0, 1 - (e - mark.until) / MARK.fade)));
export const SWIPE = -150; // stage px the hand moves up in a scroll

// stops: [{ target, ring, press, kind?, hold?, launch?, carry?, stay? }] in the order the
// hand visits them. Where the hand is at chapter time `e`:
//   { kind, from, fromKind, fromSwipe, after, afterKind, to, p, since, down, swipe, opacity, index }
//   p: how far it has flown (0-1) from `from` (a target key: the stop before, or where the
//   chapter before left it; 'bubble' when it first comes out of the bubble; 'edge' when it
//   comes in from outside) to `to`; fromSwipe: how far up it was there (it had swiped up);
//   after: the target of the stop before this one (where the bubble's tail comes from, hand
//   or no hand); since: seconds since it landed (negative before); down: pressed; swipe: how
//   far up it has swiped (stage px).
// A chapter that goes on with the cursor (`carry`) has it where the chapter before left it
// from its very start.
export function handPose(stops, e) {
  if (!stops?.length) return null;
  let i = -1;
  stops.forEach((s, k) => { if (e >= s.ring) i = k; });
  if (i < 0) {
    const c = stops[0].carry;
    if (!c) return null;
    return {kind: c.kind, from: c.target, fromKind: c.kind, fromSwipe: 0, after: null, afterKind: c.kind, to: c.target, p: 1, since: -Infinity, down: false, swipe: c.kind === 'scroll' ? SWIPE : 0, opacity: 1, index: -1};
  }
  const s = stops[i], prev = i ? stops[i - 1] : null, kind = s.kind ?? 'click', last = i === stops.length - 1;
  const origin = prev ? {target: prev.target, kind: prev.kind ?? 'click'} : s.carry ?? null; // where it flies from: it is already on screen
  const from = origin ? origin.target : s.launch ? 'bubble' : 'edge';
  const fromKind = origin?.kind ?? 'click', fromSwipe = fromKind === 'scroll' ? SWIPE : 0;
  const arrive = s.arrive ?? s.press - HAND.arrive;
  const p = origin && origin.target === s.target && fromKind === kind && !fromSwipe ? 1 : smooth((e - s.ring) / Math.max(0.05, arrive - s.ring));
  const since = e - s.press;
  const held = s.hold != null ? s.hold - s.press : HAND.press;
  const down = kind !== 'point' && since >= 0 && since < held;
  const swipe = kind === 'scroll' && since > 0 ? SWIPE * smooth(since / held) : 0;
  const shown = origin ? 1 : ease((e - s.ring) / HAND.fadeIn), leaving = last && !s.stay ? 1 - ease((e - leaveOf(s)) / HAND.fadeOut) : 1;
  const opacity = kind === 'point' ? 0 : shown * leaving; // (no hand on what is only shown)
  return {kind, from, fromKind, fromSwipe, after: origin ? origin.target : null, afterKind: fromKind, to: s.target, p, since, down, swipe, opacity, index: i};
}
