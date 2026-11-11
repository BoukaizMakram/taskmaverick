// The PATHS of a video's layers (the user, 2026-10-28: "make everything in video editor selectable even these purple lines, make them as a path that I can change the ends of it, like to
// a circle, arrows, change colors etc.. where each point is pointing, add a path tool to create a new one, change position of its points, delete them etc.. just like after effects").
// Pure geometry, no DOM: the layer cleaning (lib/storyboardLayers.mjs), the drawing (components/storyboardLayers.js), the video editor's pen and point editing
// (components/StoryboardVideoEditor.jsx) and the command line share it.
//
// A path layer keeps its points in its own FRAME: the layer's box (x, y, w, h, turned by `rotation` about its middle), the points in px from the box's top left as they were when the frame
// was `pw` x `ph` (a box made bigger or smaller by its handles scales its points: After Effects' scale). A point is {x, y, ix, iy, ox, oy, smooth}: `ix iy` / `ox oy` are the handles
// (the way in / the way out of the point) as offsets from it, none for a corner; `smooth` keeps the two handles in one line while one is dragged.
// The ends of an open path can have a CAP (an arrow, a dot...) pointing the way the line goes; the line can be trimmed (After Effects' Trim Paths: `trimStart`, `trimEnd`, 0 to 1).
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = (v, digits = 2) => { const k = 10 ** digits; return Math.round(v * k) / k; };
const lerp = (a, b, t) => a + (b - a) * t;
const COORD = 20000;
const num = v => { const n = Number(v); return Number.isFinite(n) ? round(clamp(n, -COORD, COORD)) : null; };

export const CAPS = ['none', 'arrow', 'triangle', 'circle', 'square', 'diamond', 'bar'];
export const CAP_NAMES = {none: 'None', arrow: 'Arrow', triangle: 'Triangle', circle: 'Dot', square: 'Square', diamond: 'Diamond', bar: 'Bar'};
export const DASHES = ['solid', 'dashed', 'dotted'];
export const LINE_CAPS = ['round', 'butt', 'square'];
export const LINE_JOINS = ['round', 'miter', 'bevel'];
export const MIN_POINTS = 2;
export const POINT_LIMIT = 500;

// ---- Points ----
// Points made well-formed (the file is edited by hand and by the command line too): numbers kept, handles only where they are not zero, `smooth` only with a handle
export function cleanPoints(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const p of raw.slice(0, POINT_LIMIT)) {
    const x = num(p?.x), y = num(p?.y);
    if (x == null || y == null) continue;
    const q = {x, y};
    for (const k of ['ix', 'iy', 'ox', 'oy']) { const v = num(p[k]); if (v) q[k] = v; }
    if (p.smooth === true && (q.ix || q.iy || q.ox || q.oy)) q.smooth = true;
    out.push(q);
  }
  return out;
}
export const hasHandles = p => !!(p.ix || p.iy || p.ox || p.oy);

// ---- The frame: the layer's box, its scale from the size the points were made at, its turn ----
// `v`: the values at a moment ({x, y, w, h, rotation}: a layer's own, or valuesAt(layer, t))
export function frameOf(l, v = l) {
  const w = Math.max(1, v.w), h = Math.max(1, v.h), pw = Math.max(1, l.pw || w), ph = Math.max(1, l.ph || h), r = (v.rotation || 0) * Math.PI / 180;
  return {x: v.x, y: v.y, w, h, kx: w / pw, ky: h / ph, cx: v.x + w / 2, cy: v.y + h / 2, cos: Math.cos(r), sin: Math.sin(r)};
}
// a point of the frame (its own px) on the picture, and back
export function toStage(f, px, py) {
  const dx = f.x + px * f.kx - f.cx, dy = f.y + py * f.ky - f.cy;
  return [f.cx + dx * f.cos - dy * f.sin, f.cy + dx * f.sin + dy * f.cos];
}
export function toLocal(f, sx, sy) {
  const dx = sx - f.cx, dy = sy - f.cy, ux = f.cx + dx * f.cos + dy * f.sin, uy = f.cy - dx * f.sin + dy * f.cos; // (turned back)
  return [(ux - f.x) / f.kx, (uy - f.y) / f.ky];
}
// a handle (an offset): the same without the place
export const vecToStage = (f, dx, dy) => { const a = dx * f.kx, b = dy * f.ky; return [a * f.cos - b * f.sin, a * f.sin + b * f.cos]; };
export const vecToLocal = (f, dx, dy) => { const a = dx * f.cos + dy * f.sin, b = -dx * f.sin + dy * f.cos; return [a / f.kx, b / f.ky]; };
// the points as they are on the picture: [{x, y, ix, iy, ox, oy, smooth}] in stage px (handles as offsets, turned and scaled)
export function stagePoints(l, v = l) {
  const f = frameOf(l, v);
  return l.points.map(p => {
    const [x, y] = toStage(f, p.x, p.y), [ix, iy] = vecToStage(f, p.ix || 0, p.iy || 0), [ox, oy] = vecToStage(f, p.ox || 0, p.oy || 0);
    return {x, y, ix, iy, ox, oy, smooth: !!p.smooth};
  });
}

// ---- Curves: a segment is a straight line, or a cubic from the way out of one point to the way in of the next ----
function cubic(a, b, kx, ky) {
  if (!(a.ox || a.oy || b.ix || b.iy)) return null;
  return [(a.x + (a.ox || 0)) * kx, (a.y + (a.oy || 0)) * ky, (b.x + (b.ix || 0)) * kx, (b.y + (b.iy || 0)) * ky];
}
const bez = (p0, c1, c2, p1, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * p1; };
export const segmentCount = (n, closed) => (n < 2 ? 0 : closed ? n : n - 1);
// Each segment as a line of samples [[x, y], ...] from its start to its end, the points scaled by kx, ky (the frame's scale: px on the picture)
export function segmentLines(points, closed, kx = 1, ky = 1) {
  const n = points.length, out = [];
  for (let i = 0; i < segmentCount(n, closed); i++) {
    const a = points[i], b = points[(i + 1) % n], x0 = a.x * kx, y0 = a.y * ky, x1 = b.x * kx, y1 = b.y * ky, c = cubic(a, b, kx, ky);
    if (!c) { out.push([[x0, y0], [x1, y1]]); continue; }
    const chord = Math.hypot(c[0] - x0, c[1] - y0) + Math.hypot(c[2] - c[0], c[3] - c[1]) + Math.hypot(x1 - c[2], y1 - c[3]), steps = clamp(Math.ceil(chord / 5), 8, 60), line = [];
    for (let s = 0; s <= steps; s++) { const t = s / steps; line.push([bez(x0, c[0], c[2], x1, t), bez(y0, c[1], c[3], y1, t)]); }
    out.push(line);
  }
  return out;
}
// The whole path as one line with the length reached at each sample: {pts, cum, total}
export function flatten(points, closed, kx = 1, ky = 1) {
  const pts = [], cum = [];
  let total = 0;
  for (const line of segmentLines(points, closed, kx, ky)) {
    for (let i = pts.length ? 1 : 0; i < line.length; i++) { // (the first sample of a segment is where the one before ended)
      const q = line[i], last = pts.at(-1);
      if (last) total += Math.hypot(q[0] - last[0], q[1] - last[1]);
      pts.push(q); cum.push(total);
    }
  }
  return {pts, cum, total};
}
// The line between two lengths along it (the trimmed part)
export function sliceFlat(flat, a, b) {
  const {pts, cum, total} = flat;
  if (pts.length < 2) return pts.slice();
  const lo = clamp(a, 0, total), hi = clamp(b, 0, total);
  if (hi <= lo) return [];
  const at = s => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const span = cum[i] - cum[i - 1], u = span > 1e-9 ? (s - cum[i - 1]) / span : 0;
    return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
  };
  const out = [at(lo)];
  for (let i = 0; i < pts.length; i++) if (cum[i] > lo + 1e-6 && cum[i] < hi - 1e-6) out.push(pts[i]);
  out.push(at(hi));
  return out;
}
// The exact SVG path of the points (the frame's scale put on)
export function pathD(points, closed, kx = 1, ky = 1) {
  const n = points.length;
  if (n < 2) return '';
  const P = (p, dx = 0, dy = 0) => `${round((p.x + dx) * kx)} ${round((p.y + dy) * ky)}`;
  let d = `M${P(points[0])}`;
  for (let i = 0; i < segmentCount(n, closed); i++) {
    const a = points[i], b = points[(i + 1) % n];
    d += a.ox || a.oy || b.ix || b.iy ? `C${P(a, a.ox || 0, a.oy || 0)} ${P(b, b.ix || 0, b.iy || 0)} ${P(b)}` : `L${P(b)}`;
  }
  return closed ? `${d}Z` : d;
}
// The box round the points and their curves, in the points' own px -> {x, y, w, h} | null
export function boundsOf(points, closed) {
  if (points.length < 2) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const line of segmentLines(points, closed)) for (const [x, y] of line) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}
// Points on the picture (stage px) made into a frame: the box round them, the points written in it -> {x, y, w, h, pw, ph, points}
export function frameFromStage(points, closed = false) {
  const box = boundsOf(points, closed);
  if (!box) return null;
  const w = Math.max(1, round(box.w)), h = Math.max(1, round(box.h));
  return {x: round(box.x), y: round(box.y), w, h, pw: w, ph: h, points: points.map(p => ({...p, x: round(p.x - box.x), y: round(p.y - box.y)}))};
}

// ---- Hitting a path ----
// The nearest place on a path to (x, y) (px on the frame at the scale kx, ky) -> {seg, t, x, y, d} | null; `t` is how far along the segment (0 to 1)
export function nearestOnPath(points, closed, x, y, kx = 1, ky = 1) {
  let best = null;
  segmentLines(points, closed, kx, ky).forEach((line, seg) => {
    for (let k = 0; k < line.length - 1; k++) {
      const [ax, ay] = line[k], [bx, by] = line[k + 1], dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy, u = len2 > 1e-9 ? clamp(((x - ax) * dx + (y - ay) * dy) / len2, 0, 1) : 0;
      const px = ax + dx * u, py = ay + dy * u, d = Math.hypot(x - px, y - py);
      if (!best || d < best.d) best = {seg, t: (k + u) / (line.length - 1), x: px, y: py, d};
    }
  });
  return best;
}
const inside = (pts, x, y) => { // (a point in a polygon)
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
// Whether a point of the picture is on a path layer: on its line (`slop` px each side of it) or, closed and filled, inside it. `v`: the layer's values at that moment.
export function hitPath(l, v, x, y, slop = 6) {
  const f = frameOf(l, v), [lx, ly] = toLocal(f, x, y), qx = lx * f.kx, qy = ly * f.ky, near = nearestOnPath(l.points, l.closed, qx, qy, f.kx, f.ky);
  if (near && near.d <= slop + (l.strokeWidth || 0) / 2) return true;
  return !!(l.closed && l.fill && inside(flatten(l.points, true, f.kx, f.ky).pts, qx, qy));
}

// ---- Changing points ----
// A point added on a segment, the curve kept as it was (de Casteljau) -> {points, index}
export function insertPoint(points, closed, seg, t) {
  const n = points.length, a = points[seg], b = points[(seg + 1) % n];
  if (!a || !b) return {points, index: -1};
  const u = clamp(t, 0.02, 0.98), out = points.map(p => ({...p}));
  const c = cubic(a, b, 1, 1);
  let made;
  if (!c) made = {x: round(lerp(a.x, b.x, u)), y: round(lerp(a.y, b.y, u))};
  else {
    const p0 = [a.x, a.y], p1 = [c[0], c[1]], p2 = [c[2], c[3]], p3 = [b.x, b.y], mix = (p, q) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
    const q0 = mix(p0, p1), q1 = mix(p1, p2), q2 = mix(p2, p3), r0 = mix(q0, q1), r1 = mix(q1, q2), s = mix(r0, r1);
    made = {x: round(s[0]), y: round(s[1]), ix: round(r0[0] - s[0]), iy: round(r0[1] - s[1]), ox: round(r1[0] - s[0]), oy: round(r1[1] - s[1]), smooth: true};
    out[seg] = {...out[seg], ox: round(q0[0] - a.x), oy: round(q0[1] - a.y)};
    const bi = (seg + 1) % n;
    out[bi] = {...out[bi], ix: round(q2[0] - b.x), iy: round(q2[1] - b.y)};
  }
  const index = seg + 1;
  out.splice(index, 0, made);
  return {points: out, index};
}
// Points taken out (`indexes`): the rest, as they were; null when fewer than two would be left (the layer goes)
export function deletePoints(points, indexes) {
  const gone = new Set(indexes), rest = points.filter((_, i) => !gone.has(i));
  return rest.length >= MIN_POINTS ? rest : null;
}
// A point made a corner (no handles) or smooth (handles along the line from the point before to the one after, a third of the way to each)
export function setSmooth(points, closed, index, smooth) {
  const n = points.length, p = points[index];
  if (!p) return points;
  const out = points.map(q => ({...q}));
  if (!smooth) { const {ix, iy, ox, oy, smooth: _, ...rest} = p; out[index] = rest; return out; }
  const prev = closed || index > 0 ? points[(index - 1 + n) % n] : null, next = closed || index < n - 1 ? points[(index + 1) % n] : null;
  const from = prev ?? p, to = next ?? p, dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const lenIn = prev ? Math.hypot(p.x - prev.x, p.y - prev.y) / 3 : 0, lenOut = next ? Math.hypot(next.x - p.x, next.y - p.y) / 3 : 0;
  out[index] = {...p, ix: round(-ux * lenIn), iy: round(-uy * lenIn), ox: round(ux * lenOut), oy: round(uy * lenOut), smooth: true};
  return out;
}
// The path run the other way: the first point last, each point's handle in and out swapped (the ends swap with it: a path's start cap is at its first point)
export const reversePoints = points => [...points].reverse().map(p => {
  const {ix, iy, ox, oy, ...rest} = p, q = {...rest};
  if (ox || oy) { q.ix = ox; q.iy = oy; }
  if (ix || iy) { q.ox = ix; q.oy = iy; }
  return q;
});
// A handle dragged to (hx, hy), an offset from its point; a smooth point's other handle turns to the other way (its length kept; the same when it had none)
export function setHandle(p, which, hx, hy) {
  const mine = which === 'in' ? ['ix', 'iy'] : ['ox', 'oy'], other = which === 'in' ? ['ox', 'oy'] : ['ix', 'iy'], q = {...p, [mine[0]]: round(hx), [mine[1]]: round(hy)};
  if (p.smooth) {
    const len = Math.hypot(hx, hy) || 1, keep = Math.hypot(p[other[0]] || 0, p[other[1]] || 0) || len;
    q[other[0]] = round(-hx / len * keep); q[other[1]] = round(-hy / len * keep);
  }
  return q;
}
// A layer's frame made to fit its points again (after a point was moved, added or deleted), the path staying exactly where it is on the picture: the points are written in the new
// frame and the frame is moved so that the turn about its new middle puts them where they were. Not when its place, size or turn is animated (the frame would have to be moved at
// each keyframe): the points then keep the frame they have.
export function refitPath(l) {
  if (['x', 'y', 'w', 'h', 'rotation'].some(p => l.keys?.some(k => k[p] != null))) return l;
  const box = boundsOf(l.points, l.closed);
  if (!box) return l;
  const f = frameOf(l), w = Math.max(1, round(box.w * f.kx)), h = Math.max(1, round(box.h * f.ky)), pw = Math.max(1, round(box.w)), ph = Math.max(1, round(box.h));
  const ux = f.x + box.x * f.kx, uy = f.y + box.y * f.ky, ncx = ux + w / 2, ncy = uy + h / 2, mx = ncx - f.cx, my = ncy - f.cy;
  const dx = mx - (mx * f.cos - my * f.sin), dy = my - (mx * f.sin + my * f.cos); // ((I - turn) · the middle's move)
  return {...l, x: round(ux - dx), y: round(uy - dy), w, h, pw, ph, points: l.points.map(p => ({...p, x: round(p.x - box.x), y: round(p.y - box.y)}))};
}

// ---- Drawing: the SVG markup of a path layer at a moment ----
const capSize = l => Math.max(9, (l.strokeWidth || 0) * 3 + 6) * (l.capScale || 1);
// The shape of a cap, the tip at (x, y) with the line arriving from behind it (`angle`: the way it points, degrees)
function capMarkup(kind, x, y, angle, size, color, sw) {
  const s = size, at = `transform="translate(${round(x)} ${round(y)}) rotate(${round(angle)})"`, line = `fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case 'arrow': return `<path ${at} d="M${round(-s)} ${round(-s * 0.6)}L0 0L${round(-s)} ${round(s * 0.6)}" ${line}/>`;
    case 'triangle': return `<path ${at} d="M0 0L${round(-s)} ${round(-s * 0.6)}L${round(-s)} ${round(s * 0.6)}Z" fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round"/>`;
    case 'circle': return `<circle ${at} cx="0" cy="0" r="${round(s * 0.45)}" fill="${color}"/>`;
    case 'square': return `<rect ${at} x="${round(-s * 0.4)}" y="${round(-s * 0.4)}" width="${round(s * 0.8)}" height="${round(s * 0.8)}" fill="${color}"/>`;
    case 'diamond': return `<path ${at} d="M${round(s * 0.6)} 0L0 ${round(-s * 0.6)}L${round(-s * 0.6)} 0L0 ${round(s * 0.6)}Z" fill="${color}"/>`;
    case 'bar': return `<path ${at} d="M0 ${round(-s * 0.7)}L0 ${round(s * 0.7)}" ${line}/>`;
    default: return '';
  }
}
const angleOf = line => (line.length > 1 ? Math.atan2(line.at(-1)[1] - line[0][1], line.at(-1)[0] - line[0][0]) * 180 / Math.PI : 0);
// The inside of the layer's <svg> (its viewBox is `0 0 v.w v.h`), `v`: the values at a moment ({w, h, trimStart, trimEnd}); '' where nothing shows
export function pathMarkup(l, v) {
  if (!l.points || l.points.length < MIN_POINTS) return '';
  const f = frameOf(l, v), color = l.stroke ?? '#7b3cf0', sw = Math.max(0, l.strokeWidth ?? 3), flat = flatten(l.points, l.closed, f.kx, f.ky), total = flat.total;
  const s0 = clamp(v.trimStart ?? l.trimStart ?? 0, 0, 1), s1 = clamp(v.trimEnd ?? l.trimEnd ?? 1, 0, 1), lo = Math.min(s0, s1) * total, hi = Math.max(s0, s1) * total;
  let out = '';
  if (l.closed && l.fill) out += `<path d="${pathD(l.points, true, f.kx, f.ky)}" fill="${l.fill}" stroke="none"/>`;
  if (hi - lo < 0.5) return out; // (trimmed away)
  const open = !l.closed, size = capSize(l), startCap = open && l.startCap && l.startCap !== 'none' ? l.startCap : null, endCap = open && l.endCap && l.endCap !== 'none' ? l.endCap : null;
  const inA = startCap === 'triangle' ? Math.min(size * 0.85, (hi - lo) / 2) : 0, inB = endCap === 'triangle' ? Math.min(size * 0.85, (hi - lo) / 2) : 0; // (a solid head stops the line at its base)
  const exact = s0 <= 0 && s1 >= 1 && !inA && !inB;
  let d = '';
  if (exact) d = pathD(l.points, l.closed, f.kx, f.ky);
  else { const sub = sliceFlat(flat, lo + inA, hi - inB); if (sub.length > 1) d = `M${sub.map(q => `${round(q[0])} ${round(q[1])}`).join('L')}`; }
  if (d && sw > 0) {
    const dash = l.dash === 'dashed' ? ` stroke-dasharray="${round(sw * 3)} ${round(sw * 2)}"` : l.dash === 'dotted' ? ` stroke-dasharray="0 ${round(sw * 2)}"` : '';
    out += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${l.dash === 'dotted' ? 'round' : l.lineCap || 'round'}" stroke-linejoin="${l.lineJoin || 'round'}"${dash}/>`;
  }
  if (endCap) { const tail = sliceFlat(flat, Math.max(lo, hi - 8), hi); if (tail.length > 1) out += capMarkup(endCap, tail.at(-1)[0], tail.at(-1)[1], angleOf(tail), size, color, sw); }
  if (startCap) { const head = sliceFlat(flat, lo, Math.min(hi, lo + 8)); if (head.length > 1) out += capMarkup(startCap, head[0][0], head[0][1], angleOf([...head].reverse()), size, color, sw); }
  return out;
}

// ---- Lines of the software turned into paths ----
// `segs`: straight pieces [[x0, y0], [x1, y1], id?] (stage px; `id`: what the piece is, to say which pieces a trail is made of). Pieces that meet (within `tol` px; an end on the middle
// of another piece cuts it there) are chained into trails, a trail stopping where three or more meet -> [{pts: [[x, y], ...], ids: [id, ...]}, ...]
export function chainSegments(segs, tol = 4) {
  const lines = segs.map(s => [[s[0][0], s[0][1]], [s[1][0], s[1][1]], s[2] ?? null]), ends = lines.flatMap(l => [l[0], l[1]]), pieces = [];
  for (const [a, b, id] of lines) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), cuts = [];
    if (len > tol * 2) for (const e of ends) {
      if (e === a || e === b) continue;
      const u = ((e[0] - a[0]) * (b[0] - a[0]) + (e[1] - a[1]) * (b[1] - a[1])) / (len * len);
      if (u * len <= tol || (1 - u) * len <= tol) continue;
      if (Math.hypot(e[0] - (a[0] + (b[0] - a[0]) * u), e[1] - (a[1] + (b[1] - a[1]) * u)) <= tol && !cuts.some(c => Math.abs(c - u) * len <= tol)) cuts.push(u);
    }
    cuts.sort((p, q) => p - q);
    const stops = [a, ...cuts.map(u => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]), b];
    for (let i = 0; i < stops.length - 1; i++) pieces.push([stops[i], stops[i + 1], id]);
  }
  const nodes = [], nodeOf = p => { let i = nodes.findIndex(q => Math.hypot(q[0] - p[0], q[1] - p[1]) <= tol); if (i < 0) { nodes.push([p[0], p[1]]); i = nodes.length - 1; } return i; };
  const edges = [];
  for (const [a, b, id] of pieces) { const ia = nodeOf(a), ib = nodeOf(b); if (ia !== ib) edges.push({a: ia, b: ib, id}); }
  const adj = nodes.map(() => []);
  edges.forEach((e, k) => { adj[e.a].push(k); adj[e.b].push(k); });
  const used = new Set(), trails = [];
  const walk = (start, first) => {
    const trail = {nodes: [start], ids: new Set()};
    let cur = start, e = first;
    for (;;) {
      used.add(e);
      const edge = edges[e], next = edge.a === cur ? edge.b : edge.a;
      trail.nodes.push(next); cur = next;
      if (edge.id != null) trail.ids.add(edge.id);
      if (adj[cur].length !== 2) break;
      const more = adj[cur].find(k => k !== e && !used.has(k));
      if (more == null) break;
      e = more;
    }
    return trail;
  };
  nodes.forEach((_, n) => { if (adj[n].length !== 2) for (const e of adj[n]) if (!used.has(e)) trails.push(walk(n, e)); });
  edges.forEach((e, k) => { if (!used.has(k)) trails.push(walk(e.a, k)); }); // (loops)
  return trails.map(t => ({pts: t.nodes.map(n => nodes[n]), ids: [...t.ids]}));
}
// A polyline kept to its corners (Douglas-Peucker): the points of a sampled curve cut down to the ones that matter
export function simplify(pts, eps = 1.5) {
  if (pts.length < 3) return pts.slice();
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop(), [ax, ay] = pts[i], [bx, by] = pts[j], len = Math.hypot(bx - ax, by - ay) || 1;
    let far = -1, dist = eps;
    for (let k = i + 1; k < j; k++) { const d = Math.abs((pts[k][0] - ax) * (by - ay) - (pts[k][1] - ay) * (bx - ax)) / len; if (d > dist) { dist = d; far = k; } }
    if (far >= 0) { keep[far] = true; stack.push([i, far], [far, j]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// The corners of an SVG path made only of M, L, H, V and Z (the connector lines of the sections are) -> [{pts: [[x, y], ...], closed}] | null for anything else (curves: sample it)
export function parsePolylineD(d) {
  if (typeof d !== 'string' || /[^MmLlHhVvZz\d\s,.eE+-]/.test(d)) return null;
  const tokens = d.match(/[MmLlHhVvZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const out = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, cur = null;
  const read = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    if (!cmd) return null;
    const rel = cmd === cmd.toLowerCase(), up = cmd.toUpperCase();
    if (up === 'Z') { // (it takes no numbers: one after it is something this does not read)
      if (cur) { cur.closed = true; x = sx; y = sy; }
      if (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) return null;
      continue;
    }
    if (up === 'M') { const a = read(), b = read(); x = rel ? x + a : a; y = rel ? y + b : b; sx = x; sy = y; cur = {pts: [[x, y]], closed: false}; out.push(cur); continue; }
    if (!cur) return null;
    if (up === 'L') { const a = read(), b = read(); x = rel ? x + a : a; y = rel ? y + b : b; }
    else if (up === 'H') { const a = read(); x = rel ? x + a : a; }
    else if (up === 'V') { const b = read(); y = rel ? y + b : b; }
    if (![x, y].every(Number.isFinite)) return null;
    cur.pts.push([x, y]);
  }
  return out.filter(p => p.pts.length > 1);
}
