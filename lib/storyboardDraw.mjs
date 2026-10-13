// The pencil of the storyboard: a stroke drawn on a frame becomes an asset of its
// own (a box holding an SVG path) that can be moved, scaled, copied and deleted
// like the others; and the colors it is drawn with (the wheel in the inspector,
// Alt+click to pick one from the board). Pure.
import {hashString} from './storyboardParts.mjs';

export const PEN = {color: '#ff3b30', width: 6};
export const PEN_WIDTHS = {min: 1, max: 40};
export const SWATCHES = ['#111111', '#ffffff', '#ff3b30', '#ffec00', '#1271b7', '#007a33'];
const r1 = n => Math.round(n * 10) / 10;
const clamp01 = n => Math.max(0, Math.min(1, n));
const hex2 = n => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');

// ---- Colors ---------------------------------------------------------------------
// '#abc', '#aabbcc', 'rgb(1, 2, 3)', 'rgba(1 2 3 / .5)' -> '#aabbcc' (null: not a color).
export function normalizeHex(value) {
  const text = String(value ?? '').trim().toLowerCase();
  let m = /^#?([0-9a-f]{3})$/.exec(text);
  if (m) return `#${[...m[1]].map(c => c + c).join('')}`;
  m = /^#?([0-9a-f]{6})$/.exec(text);
  if (m) return `#${m[1]}`;
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(text);
  return m ? `#${hex2(Number(m[1]))}${hex2(Number(m[2]))}${hex2(Number(m[3]))}` : null;
}
// hue 0-360, saturation and value 0-1
export function hexToHsv(hex) {
  const n = normalizeHex(hex) ?? '#000000';
  const [r, g, b] = [1, 3, 5].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const h = !d ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return {h: Math.round(h * 60 * 10) / 10 % 360, s: max ? d / max : 0, v: max};
}
export function hsvToHex({h, s, v}) {
  const f = n => { const k = (n + (((h % 360) + 360) % 360) / 60) % 6; return v - v * clamp01(s) * Math.max(0, Math.min(k, 4 - k, 1)); };
  return `#${hex2(f(5) * 255)}${hex2(f(3) * 255)}${hex2(f(1) * 255)}`;
}
// The color wheel: hue around it, saturation from the middle (0) to the rim (1).
// A point (dx, dy) from the middle of a wheel of radius R, and back.
export const wheelAt = (dx, dy, R) => ({h: (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, s: clamp01(Math.hypot(dx, dy) / R)});
export const wheelPoint = ({h, s}, R) => ({x: Math.cos(h * Math.PI / 180) * clamp01(s) * R, y: Math.sin(h * Math.PI / 180) * clamp01(s) * R});

// ---- Strokes ---------------------------------------------------------------------
// The points worth keeping: one at least `min` away from the last kept (and the last one).
export function thin(points, min = 2) {
  const out = [];
  for (const p of points) { const last = out.at(-1); if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= min) out.push(p); }
  const end = points.at(-1);
  if (end && out.at(-1) !== end && out.length > 1) out.push(end);
  return out;
}
// A smooth path through the points (curves through the middles of each pair).
export function pathOf(points) {
  if (!points.length) return '';
  const [a, ...rest] = points;
  if (!rest.length) return `M${r1(a.x)} ${r1(a.y)}l0.01 0`; // a dot
  if (rest.length === 1) return `M${r1(a.x)} ${r1(a.y)}L${r1(rest[0].x)} ${r1(rest[0].y)}`;
  let d = `M${r1(a.x)} ${r1(a.y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], q = points[i + 1];
    d += `Q${r1(p.x)} ${r1(p.y)} ${r1((p.x + q.x) / 2)} ${r1((p.y + q.y) / 2)}`;
  }
  const end = points.at(-1);
  return `${d}L${r1(end.x)} ${r1(end.y)}`;
}
const inkHtml = ({key, left, top, w, h, z, d, color, width}) =>
  `<div data-sb-root="${key}" data-sb-box="drawing" style="position:absolute;left:${left}px;top:${top}px;width:${w}px;height:${h}px;z-index:${z};pointer-events:none">`
  + `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;width:100%;height:100%;overflow:visible;pointer-events:none">`
  // a wide, clear line under the stroke: it is easy to pick, and only the stroke is (not its whole box)
  + `<path d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(18, width + 12)}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
  + `<path data-ink="" d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></div>`;

// What a stroke drawn on a frame adds to it: {inserts: [layer], library: {hash: html}} (null:
// nothing drawn). `points`: stage px, in order; `taken`: the keys the frame has; `count`: how
// many things were brought in already (it goes on top of them).
export function strokeInsert({points, color = PEN.color, width = PEN.width, taken = new Set(), count = 0}) {
  const kept = thin(points.filter(p => Number.isFinite(p?.x) && Number.isFinite(p?.y)));
  if (!kept.length) return null;
  let n = 1, key;
  do key = `d${n++}-drawing`; while (taken.has(key));
  const pad = Math.ceil(width / 2) + 2, xs = kept.map(p => p.x), ys = kept.map(p => p.y);
  const left = Math.floor(Math.min(...xs)) - pad, top = Math.floor(Math.min(...ys)) - pad;
  const w = Math.max(2 * pad, Math.ceil(Math.max(...xs)) + pad - left), h = Math.max(2 * pad, Math.ceil(Math.max(...ys)) + pad - top), z = 20 + 2 * count;
  const html = inkHtml({key, left, top, w, h, z, d: pathOf(kept.map(p => ({x: p.x - left, y: p.y - top}))), color: normalizeHex(color) ?? PEN.color, width});
  const asset = hashString(html);
  return {inserts: [{key, name: 'Drawing', kind: 'dom', asset, z, box: {x: left, y: top, w, h}}], library: {[asset]: html}};
}
// A drawing's color and width, read from its HTML (null: not a drawing).
export function inkOf(html) {
  const m = /<path data-ink=""[^>]* stroke="([^"]+)" stroke-width="([\d.]+)"/.exec(String(html ?? ''));
  return m ? {color: normalizeHex(m[1]) ?? PEN.color, width: Number(m[2])} : null;
}
// The same drawing in another color or width.
export function restyleInk(html, {color, width}) {
  const now = inkOf(html);
  if (!now) return html;
  const c = normalizeHex(color) ?? now.color, w = Number.isFinite(width) ? Math.max(PEN_WIDTHS.min, Math.min(PEN_WIDTHS.max, width)) : now.width;
  return html
    .replace(/(<path data-ink=""[^>]*) stroke="[^"]+" stroke-width="[\d.]+"/, `$1 stroke="${c}" stroke-width="${w}"`)
    .replace(/(stroke="transparent" stroke-width=")[\d.]+"/, `$1${Math.max(18, w + 12)}"`);
}
