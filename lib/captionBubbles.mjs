// The caption bubble: the demo's words in a yellow message (#ffec00, black
// outline, the form of a chat message) whose tail reaches what the hand is
// pointing at. It grows out of that point: first a small teardrop at the
// fingertip, then the bubble, then the words.
//
// Everything here is pure: given the words' box (stage px) and the point to
// reach, it returns the SVG of the bubble, where it grows from and how it pops
// in. The demos measure the boxes and draw the result
// (components/captionBubbleDom.js).
export const POP_TIME = 0.42; // seconds a bubble takes to pop in
const TAIL_TIME = 0.26; // the tail reaches out as the bubble grows
const clamp01 = p => Math.max(0, Math.min(1, p));
const mix = (a, b, p) => a + (b - a) * p;
const num = n => Math.round(n * 100) / 100;
const easeOut = p => 1 - (1 - clamp01(p)) ** 3;
const backOut = p => { p = clamp01(p); return 1 + 2.9 * (p - 1) ** 3 + 1.9 * (p - 1) ** 2; };
const sgn = v => (v < 0 ? -1 : 1);
const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return {x: x / l, y: y / l}; };

export const MESSAGE = {
  id: 'yellow',
  name: 'Yellow message',
  radius: 36,          // the rounded corners
  pad: [30, 20],       // room between the words and the outline, [x, y]
  fill: '#ffec00', stroke: '#111111', sw: 4.5,
  tail: {w: 36, bend: 0.3, inset: 14}, // how wide it is where it leaves, how much it curls, how far it reaches into the body
  shadow: '0 8px 18px rgb(0 0 0 / 16%)',
  lift: 22,            // how far above the level it points at the bubble sits, so the tail slopes
  gap: 52,             // extra room between the art and the bubble, so the tail has length
};
// (the words in it are Inter 600, a little larger than plain captions: see CaptionBubbles.css)

// ---- Pop -------------------------------------------------------------------
// p runs 0 -> 1 over POP_TIME; the bubble grows out of the point it reaches.
export const popPose = t => { const p = t / POP_TIME; return {scale: mix(0.04, 1, backOut(p)), rotate: 0, opacity: clamp01(p * 9)}; };

// ---- Shape -----------------------------------------------------------------
function roundRect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${num(x + r)} ${num(y)}H${num(x + w - r)}A${num(r)} ${num(r)} 0 0 1 ${num(x + w)} ${num(y + r)}V${num(y + h - r)}A${num(r)} ${num(r)} 0 0 1 ${num(x + w - r)} ${num(y + h)}H${num(x + r)}A${num(r)} ${num(r)} 0 0 1 ${num(x)} ${num(y + h - r)}V${num(y + r)}A${num(r)} ${num(r)} 0 0 1 ${num(x + r)} ${num(y)}Z`;
}

// The bubble's body around the words' box `text`: its path, its outer box, and
// where a line from the middle toward a point leaves it (with the outward normal).
function bodyOf(style, text) {
  const [px, py] = style.pad, W = text.w + 2 * px, H = text.h + 2 * py;
  const c = {x: text.x + text.w / 2, y: text.y + text.h / 2};
  const box = {x: text.x - px, y: text.y - py, w: W, h: H}, r = Math.min(style.radius, W / 2, H / 2);
  const hit = (toward, hw = 20) => {
    const dx = toward.x - c.x, dy = toward.y - c.y, tx = dx ? box.w / 2 / Math.abs(dx) : Infinity, ty = dy ? box.h / 2 / Math.abs(dy) : Infinity, t = Math.min(tx, ty);
    const p = {x: c.x + dx * t, y: c.y + dy * t}, along = (lo, hi, v, m) => (lo + m > hi - m ? (lo + hi) / 2 : Math.max(lo + m, Math.min(hi - m, v)));
    const m = r + hw * 0.9; // keep the tail away from the rounded corners
    if (tx <= ty) return {p: {x: p.x, y: along(box.y, box.y + box.h, p.y, m)}, n: {x: sgn(dx), y: 0}};
    return {p: {x: along(box.x, box.x + box.w, p.x, m), y: p.y}, n: {x: 0, y: sgn(dy)}};
  };
  return {d: roundRect(box.x, box.y, box.w, box.h, r), hit, outer: box, c};
}

// How far the bubble reaches past the words on each side (for placing them).
export function bubbleMetrics(style, w, h) {
  const body = bodyOf(style, {x: 0, y: 0, w, h});
  return {left: -body.outer.x, right: body.outer.x + body.outer.w - w, top: -body.outer.y, bottom: body.outer.y + body.outer.h - h};
}

// How much wider than plain words a bubble with a typical caption is: its
// outline, a tail's length and its larger type. The demos make this much room
// (the tablet and the report give way to it) so the words stay their size.
export function bubbleRoom(style) {
  const m = bubbleMetrics(style, 260, 110);
  return Math.round(m.left + m.right + Math.min(style.gap, 48) + 30);
}

// ---- Tail ------------------------------------------------------------------
// A curl: both edges bow the same way (downward), like a chat message's tail.
function tailShape(style, body, tip, reach) {
  const {w, bend, inset} = style.tail;
  if (Math.hypot(tip.x - body.c.x, tip.y - body.c.y) < 1) return null; // right in the middle
  const {p: B0, n} = body.hit(tip, w / 2);
  if (Math.hypot(tip.x - B0.x, tip.y - B0.y) < 14) return null; // the point is inside the bubble
  const T = {x: mix(B0.x, tip.x, reach), y: mix(B0.y, tip.y, reach)}; // reaching out
  const L = Math.hypot(T.x - B0.x, T.y - B0.y);
  if (L < 6) return null;
  // a long reach (across a board) gets a slimmer tail so it covers less on the way
  const full = Math.hypot(tip.x - B0.x, tip.y - B0.y), u = unit(T.x - B0.x, T.y - B0.y), perp = {x: -u.y, y: u.x};
  const hw = Math.min(w * Math.max(0.4, Math.min(1, 130 / full)), L * 0.95) / 2;
  const A = {x: B0.x + perp.x * hw - n.x * inset, y: B0.y + perp.y * hw - n.y * inset};
  const C = {x: B0.x - perp.x * hw - n.x * inset, y: B0.y - perp.y * hw - n.y * inset};
  const mid = (P, Q) => ({x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2});
  const s = perp.y >= 0 ? 1 : -1, k = s * bend * L * 0.6;
  const c1 = {x: mid(A, T).x + perp.x * k, y: mid(A, T).y + perp.y * k};
  const c2 = {x: mid(C, T).x + perp.x * k, y: mid(C, T).y + perp.y * k};
  const d = `M${num(A.x)} ${num(A.y)}Q${num(c1.x)} ${num(c1.y)} ${num(T.x)} ${num(T.y)}Q${num(c2.x)} ${num(c2.y)} ${num(C.x)} ${num(C.y)}Z`;
  return {base: B0, tip: T, d};
}

// ---- One frame ---------------------------------------------------------------
// input: rect = the words' box, tip = the point to reach (or null), tailP = how
// much of the tail is wanted (0-1), t = seconds since the bubble started,
// remaining = seconds until it leaves.
export function bubbleFrame(style, {rect, tip = null, tailP = 1, t = 99, remaining = 99}) {
  const body = bodyOf(style, rect);
  const reach = easeOut(t / TAIL_TIME) * clamp01(tailP);
  const tail = tip && reach > 0.01 ? tailShape(style, body, tip, reach) : null;
  const paths = [body.d, ...(tail ? [tail.d] : [])];
  // The outline is drawn twice as thick, then the fills cover its inner half, so
  // the body and the tail join with no line between them.
  const svg = paths.map(d => `<path d="${d}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="${style.sw * 2}" stroke-linejoin="round" stroke-linecap="round"/>`).join('')
    + paths.map(d => `<path d="${d}" fill="${style.fill}"/>`).join('');
  const pose = popPose(t);
  return {
    svg, outer: body.outer, tail: tail && {base: tail.base, tip: tail.tip}, origin: tip ?? body.c,
    scale: pose.scale, rotate: pose.rotate, opacity: pose.opacity * clamp01(remaining / 0.28),
    filter: `drop-shadow(${style.shadow})`,
  };
}
