// The hand: a big yellow pointing hand flies to what the words are about,
// clicks it, and the speech bubble comes out of the click (first a teardrop at
// the fingertip, then the bubble, then the words). So a chapter goes:
//   the hand flies in -> it clicks (this is the action) -> the bubble -> the words.
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

// What the hand does at a stop (`kind`):
//   click   presses the target (a ripple where it lands)
//   scroll  presses and swipes up while the content scrolls (`hold` is when it lets go)
//   point   only points: it lands, nudges, and the bubble comes out
// (a click that is held until `hold` and follows its target is a drag).
// Whatever it does, it lingers just long enough for the bubble to pop, then
// fades out (and flies back in for a later stop).
export const leaveOf = stop => (stop.hold ?? stop.press) + HAND.linger;
export const SWIPE = -150; // stage px the hand moves up in a scroll

// stops: [{ target, ring, press, kind?, hold? }] in the order the hand visits
// them. Where the hand is at chapter time `e`:
//   { kind, from, fromKind, after, afterKind, to, p, since, down, swipe, opacity, index }
//   p: how far it has flown (0-1) from `from` (a target key, or 'edge' when it
//   comes in from outside) to `to`; after: the target of the stop before this
//   one (where the bubble's tail comes from, hand or no hand); since: seconds
//   since it landed (negative before); down: pressed; swipe: how far up it has
//   swiped (stage px).
export function handPose(stops, e) {
  if (!stops?.length) return null;
  let i = -1;
  stops.forEach((s, k) => { if (e >= s.ring) i = k; });
  if (i < 0) return null;
  const s = stops[i], prev = i ? stops[i - 1] : null, kind = s.kind ?? 'click';
  const stays = prev && s.ring < leaveOf(prev); // still on screen from the last stop
  const from = stays ? prev.target : 'edge';
  const arrive = s.press - HAND.arrive;
  const p = stays && prev.target === s.target && (prev.kind ?? 'click') === kind ? 1 : smooth((e - s.ring) / Math.max(0.05, arrive - s.ring));
  const since = e - s.press;
  const held = s.hold != null ? s.hold - s.press : HAND.press;
  const down = kind !== 'point' && since >= 0 && since < held;
  const swipe = kind === 'scroll' && since > 0 ? SWIPE * smooth(since / held) : 0;
  const opacity = (stays ? 1 : ease((e - s.ring) / HAND.fadeIn)) * (1 - ease((e - leaveOf(s)) / HAND.fadeOut));
  return {kind, from, fromKind: prev?.kind ?? 'click', after: prev ? prev.target : null, afterKind: prev?.kind ?? 'click', to: s.target, p, since, down, swipe, opacity, index: i};
}
