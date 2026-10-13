// Paints for backgrounds and fills (the sidebar's Background of a frame and Fill of an asset): a plain
// color, or a gradient. A paint is a color string ('#1271b7', rgb(), transparent) or a gradient
// {kind: 'linear' | 'radial', angle (linear, degrees), stops: [{color, at}] (at: 0-100), texture?, edge?}.
// `edge` asks for a thin polished-metal line round the outside of an iPad's frame (the Device color).
// `texture` lays a surface over the gradient (TEXTURES: brushed metal, fine grain, cross-hatch, perforated,
// diamond plate): a metal is a gradient plus a texture. (`brushed: true`, as saved before, is texture 'brushed'.) Pure.
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|transparent)$/i;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = n => Math.round(n * 100) / 100;

export const isGradient = paint => !!paint && typeof paint === 'object';
const color = c => (typeof c === 'string' && COLOR.test(c.trim()) ? c.trim().toLowerCase() : null);

// A paint made well-formed, or null (nothing / not a paint). Gradients keep 2 to 8 stops, in order.
export function normalizePaint(raw) {
  if (typeof raw === 'string') return color(raw);
  if (!raw || typeof raw !== 'object' || !['linear', 'radial'].includes(raw.kind) || !Array.isArray(raw.stops)) return null;
  const stops = raw.stops.slice(0, 8).map((s, i, all) => ({color: color(s?.color), at: Number.isFinite(Number(s?.at)) ? clamp(Number(s.at), 0, 100) : (all.length > 1 ? (i / (all.length - 1)) * 100 : 0)})).filter(s => s.color);
  if (stops.length < 2) return null;
  stops.sort((a, b) => a.at - b.at);
  const out = {kind: raw.kind, stops: stops.map(s => ({color: s.color, at: round(s.at)}))};
  if (raw.kind === 'linear') out.angle = round((((Number(raw.angle) || 0) % 360) + 360) % 360);
  if (raw.flat === true) out.flat = true; // no rim light round it (a plain black frame)
  if (raw.edge === true) out.edge = true; // a thin polished-metal line round the outside (an iPad's frame)
  const texture = raw.brushed === true ? 'brushed' : raw.texture;
  if (typeof texture === 'string' && Object.hasOwn(TEXTURES, texture)) out.texture = texture;
  return out;
}
export const samePaint = (a, b) => JSON.stringify(normalizePaint(a)) === JSON.stringify(normalizePaint(b));

// The surfaces: name and the CSS layers drawn over the gradient (no pictures to load).
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .38 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\") 0 0 / 160px 160px";
export const TEXTURES = {
  brushed: {name: 'Brushed metal', css: 'repeating-linear-gradient(90deg, rgb(255 255 255 / 7%) 0px, rgb(255 255 255 / 7%) 1px, rgb(0 0 0 / 5%) 1px, rgb(0 0 0 / 5%) 2px, rgb(255 255 255 / 3%) 2px, rgb(255 255 255 / 3%) 4px)'},
  grain: {name: 'Fine grain', css: GRAIN},
  crosshatch: {name: 'Cross-hatch', css: 'repeating-linear-gradient(45deg, rgb(255 255 255 / 9%) 0px, rgb(255 255 255 / 9%) 2px, transparent 2px, transparent 9px), repeating-linear-gradient(-45deg, rgb(0 0 0 / 14%) 0px, rgb(0 0 0 / 14%) 2px, transparent 2px, transparent 9px)'},
  perforated: {name: 'Perforated', css: 'radial-gradient(circle, rgb(0 0 0 / 55%) 0px, rgb(0 0 0 / 55%) 2.6px, rgb(255 255 255 / 22%) 3.4px, transparent 4.2px) 0 0 / 16px 16px'},
  diamond: {name: 'Diamond plate', css: 'linear-gradient(135deg, rgb(255 255 255 / 30%) 0%, rgb(255 255 255 / 30%) 22%, transparent 24%) 0 0 / 28px 28px, linear-gradient(315deg, rgb(0 0 0 / 28%) 0%, rgb(0 0 0 / 28%) 22%, transparent 24%) 0 0 / 28px 28px, linear-gradient(45deg, rgb(255 255 255 / 18%) 0%, rgb(255 255 255 / 18%) 22%, transparent 24%) 14px 14px / 28px 28px, linear-gradient(225deg, rgb(0 0 0 / 22%) 0%, rgb(0 0 0 / 22%) 22%, transparent 24%) 14px 14px / 28px 28px'},
};
// The CSS `background` value of a paint ('' for none).
export function paintCss(paint) {
  const p = normalizePaint(paint);
  if (!p) return '';
  if (typeof p === 'string') return p;
  const stops = p.stops.map(s => `${s.color} ${s.at}%`).join(', ');
  const base = p.kind === 'linear' ? `linear-gradient(${p.angle}deg, ${stops})` : `radial-gradient(circle at 50% 42%, ${stops})`;
  return p.texture ? `${TEXTURES[p.texture].css}, ${base}` : base;
}
// The color to show where only one is wanted (a chip, a hex field): the paint itself, or a gradient's first stop.
export const firstColor = paint => { const p = normalizePaint(paint); return typeof p === 'string' ? p : p?.stops[0].color ?? null; };

// A gradient made from a color (what switching a plain color to Linear or Radial gives).
export function gradientFrom(paint, kind = 'linear') {
  const p = normalizePaint(paint);
  if (isGradient(p)) { const {angle, ...rest} = p; return normalizePaint({...rest, kind, ...(kind === 'linear' ? {angle: angle ?? 135} : {})}); }
  const base = typeof p === 'string' && p !== 'transparent' ? p : '#1271b7';
  return normalizePaint({kind, angle: 135, stops: [{color: base, at: 0}, {color: '#ffffff', at: 100}]});
}
// A plain color from a paint (switching a gradient back to Solid).
export const solidFrom = paint => firstColor(paint) ?? '#ffffff';

// Stops: one changed, one added (halfway between its neighbors, in the color there), one taken out (two stay).
export function setStop(paint, i, patch) {
  if (!isGradient(paint) || !paint.stops[i]) return paint;
  return normalizePaint({...paint, stops: paint.stops.map((s, k) => (k === i ? {...s, ...patch} : s))}) ?? paint;
}
export function addStop(paint) {
  if (!isGradient(paint)) return paint;
  const gaps = paint.stops.slice(1).map((s, i) => [s.at - paint.stops[i].at, i]), [, at] = gaps.sort((a, b) => b[0] - a[0])[0] ?? [0, 0];
  const a = paint.stops[at], b = paint.stops[at + 1] ?? a;
  return normalizePaint({...paint, stops: [...paint.stops, {color: a.color, at: (a.at + b.at) / 2}]}) ?? paint;
}
export const removeStop = (paint, i) => (isGradient(paint) && paint.stops.length > 2 ? normalizePaint({...paint, stops: paint.stops.filter((_, k) => k !== i)}) ?? paint : paint);

// The ready backgrounds: id, name, paint.
export const PAINT_PRESETS = [
  {id: 'ipad-glass', name: 'iPad glass', paint: {kind: 'linear', angle: 100, edge: true, stops: [{color: '#05070a', at: 0}, {color: '#0b0e12', at: 16}, {color: '#262d35', at: 29}, {color: '#0c1014', at: 38}, {color: '#06080b', at: 52}, {color: '#1c2229', at: 60}, {color: '#4b535d', at: 66}, {color: '#161b21', at: 73}, {color: '#06080b', at: 84}, {color: '#0e1216', at: 100}]}},
  {id: 'ipad-glass-gray', name: 'iPad glass #535353', paint: {kind: 'linear', angle: 100, edge: true, stops: [{color: '#4a4a4a', at: 0}, {color: '#535353', at: 16}, {color: '#6a6a6a', at: 29}, {color: '#505050', at: 38}, {color: '#494949', at: 52}, {color: '#5f5f5f', at: 60}, {color: '#858585', at: 66}, {color: '#575757', at: 73}, {color: '#4b4b4b', at: 84}, {color: '#535353', at: 100}]}},
  {id: 'black', name: 'Black', paint: {kind: 'linear', angle: 0, flat: true, stops: [{color: '#000000', at: 0}, {color: '#000000', at: 100}]}},
  {id: 'metal-plate', name: 'Metal plate', paint: {kind: 'linear', angle: 135, texture: 'brushed', stops: [{color: '#8e959c', at: 0}, {color: '#e9edf0', at: 20}, {color: '#b1b8bf', at: 38}, {color: '#f6f8fa', at: 56}, {color: '#9aa2aa', at: 76}, {color: '#d8dde1', at: 100}]}},
  {id: 'brushed-steel', name: 'Brushed steel', paint: {kind: 'linear', angle: 90, texture: 'brushed', stops: [{color: '#a9afb5', at: 0}, {color: '#e3e7ea', at: 25}, {color: '#9ea5ab', at: 50}, {color: '#eef1f3', at: 75}, {color: '#aab0b6', at: 100}]}},
  {id: 'aluminium', name: 'Aluminium', paint: {kind: 'linear', angle: 120, texture: 'grain', stops: [{color: '#c8ced3', at: 0}, {color: '#f1f3f5', at: 35}, {color: '#bcc3c9', at: 62}, {color: '#e7eaed', at: 100}]}},
  {id: 'chrome', name: 'Chrome', paint: {kind: 'linear', angle: 180, stops: [{color: '#eef2f5', at: 0}, {color: '#9aa3ab', at: 42}, {color: '#2f353b', at: 50}, {color: '#8e979f', at: 53}, {color: '#dfe4e8', at: 100}]}},
  {id: 'chrome-mirror', name: 'Chrome mirror', paint: {kind: 'linear', angle: 118, stops: [{color: '#6f7a83', at: 0}, {color: '#46505a', at: 11}, {color: '#0f1317', at: 23}, {color: '#4d5862', at: 31}, {color: '#8a959e', at: 42}, {color: '#65717b', at: 50}, {color: '#1d2329', at: 58}, {color: '#080b0d', at: 66}, {color: '#424d56', at: 76}, {color: '#7b8791', at: 88}, {color: '#515c66', at: 100}]}},
  {id: 'titanium', name: 'Titanium', paint: {kind: 'linear', angle: 135, texture: 'brushed', stops: [{color: '#7d848b', at: 0}, {color: '#b9bfc5', at: 28}, {color: '#8a9198', at: 52}, {color: '#c7ccd1', at: 76}, {color: '#6f767d', at: 100}]}},
  {id: 'dark-metal', name: 'Dark metal', paint: {kind: 'linear', angle: 135, texture: 'brushed', stops: [{color: '#2b3036', at: 0}, {color: '#5b636b', at: 22}, {color: '#30363c', at: 42}, {color: '#6b747c', at: 62}, {color: '#2a2f35', at: 100}]}},
  {id: 'gunmetal', name: 'Gunmetal', paint: {kind: 'linear', angle: 145, texture: 'grain', stops: [{color: '#23282d', at: 0}, {color: '#4a525a', at: 40}, {color: '#2b3036', at: 70}, {color: '#555e66', at: 100}]}},
  {id: 'diamond-plate', name: 'Diamond plate', paint: {kind: 'linear', angle: 135, texture: 'diamond', stops: [{color: '#8b929a', at: 0}, {color: '#c9ced3', at: 45}, {color: '#9aa1a8', at: 100}]}},
  {id: 'perforated', name: 'Perforated steel', paint: {kind: 'linear', angle: 135, texture: 'perforated', stops: [{color: '#6b737b', at: 0}, {color: '#a4abb2', at: 50}, {color: '#6f777f', at: 100}]}},
  {id: 'carbon', name: 'Carbon', paint: {kind: 'linear', angle: 135, texture: 'crosshatch', stops: [{color: '#14171a', at: 0}, {color: '#2c3238', at: 50}, {color: '#14171a', at: 100}]}},
  {id: 'gold', name: 'Gold', paint: {kind: 'linear', angle: 135, texture: 'brushed', stops: [{color: '#8a6a1f', at: 0}, {color: '#f3d97a', at: 22}, {color: '#c79a2e', at: 45}, {color: '#fff0ac', at: 60}, {color: '#b78a25', at: 80}, {color: '#e8c75e', at: 100}]}},
  {id: 'brass', name: 'Brass', paint: {kind: 'linear', angle: 135, texture: 'grain', stops: [{color: '#7a5c1a', at: 0}, {color: '#d8b85a', at: 30}, {color: '#a88429', at: 55}, {color: '#e9d58a', at: 75}, {color: '#8c6c1f', at: 100}]}},
  {id: 'copper', name: 'Copper', paint: {kind: 'linear', angle: 135, texture: 'brushed', stops: [{color: '#6b3519', at: 0}, {color: '#d98a5c', at: 25}, {color: '#a8532b', at: 50}, {color: '#f0b48c', at: 68}, {color: '#8d4524', at: 100}]}},
  {id: 'rose-gold', name: 'Rose gold', paint: {kind: 'linear', angle: 135, texture: 'brushed', stops: [{color: '#b76e79', at: 0}, {color: '#f2c4c0', at: 30}, {color: '#c98a8f', at: 55}, {color: '#f9ddd6', at: 75}, {color: '#b9737c', at: 100}]}},
  {id: 'taskmaverick', name: 'Taskmaverick blue', paint: {kind: 'linear', angle: 135, stops: [{color: '#1271b7', at: 0}, {color: '#2fa4e7', at: 100}]}},
  {id: 'sky', name: 'Sky', paint: {kind: 'linear', angle: 180, stops: [{color: '#e8f4ff', at: 0}, {color: '#b9dcf5', at: 100}]}},
  {id: 'sunset', name: 'Sunset', paint: {kind: 'linear', angle: 135, stops: [{color: '#ff9a56', at: 0}, {color: '#ff5f7e', at: 55}, {color: '#7b4bd0', at: 100}]}},
  {id: 'mint', name: 'Mint', paint: {kind: 'linear', angle: 135, stops: [{color: '#dff8ec', at: 0}, {color: '#7be0b1', at: 100}]}},
  {id: 'night', name: 'Night', paint: {kind: 'linear', angle: 160, stops: [{color: '#121928', at: 0}, {color: '#364050', at: 100}]}},
  {id: 'spot', name: 'Spotlight', paint: {kind: 'radial', stops: [{color: '#ffffff', at: 0}, {color: '#cfd8e3', at: 100}]}},
];
