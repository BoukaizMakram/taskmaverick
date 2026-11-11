// The layers of a VIDEO (the user, 2026-10-22: "the video editor should be like after effects ... I should be able to add images", then "most importantly,
// is a shape tool, shapes, keyframes, and optimization where I can ask you to edit on the fly"): what the video editor (components/StoryboardVideoEditor.jsx)
// puts over the picture of a video, After Effects' way: a shape (a rectangle, an ellipse), a text or an image, on screen from `from` to `to` (seconds of the
// video), its place, size, turn and opacity animated by keyframes. Pure data: the page, the players and the command line (scripts/storyboard.mjs `vlayer…`)
// share it, so a layer can be added or changed from the command line while the page is open (it polls the file).
//
// Kept per video, by the video's title, in its board's edits: `edits.layers[title] = {items: [layer, …], at}` (the newer `at` wins when two copies meet).
// Coordinates are the video's picture, 1600 x 900 (the slides' STAGE); `items` go from the back to the front.
//   layer {id, kind: 'rect' | 'ellipse' | 'text' | 'image', name, from, to, hidden?, locked?,
//          x, y, w, h, rotation, opacity,              the values of a property that has no keyframe (x, y: the top left; rotation in degrees, around the middle)
//          fill, stroke, strokeWidth, radius,           a shape (fill: a color or a gradient of lib/storyboardPaint.mjs; stroke: a color, null for none)
//          text, font, size, weight, color, align,      a text (font: an id of FONT_STACK, components/storyboardDom.js)
//          src,                                         an image (a /storyboard/uploads/ file, or a data: URL where there is no upload route)
//          keys: [{t, ease?, x?, y?, w?, h?, rotation?, opacity?}]}
// A keyframe holds the properties it sets: a property is ANIMATED once a keyframe has it (After Effects' stopwatch), and between two keyframes that have it
// it goes from one value to the other (eased in and out, or `ease: 'linear'`); before the first it is the first's, after the last the last's.
import {normalizePaint} from './storyboardPaint.mjs';
import {CAPS, DASHES, LINE_CAPS, LINE_JOINS, MIN_POINTS, cleanPoints, frameFromStage} from './storyboardPaths.mjs';

//
// Then (the user, 2026-10-28: "make all layers this way ... move it trim it, frame by frame using page up and down, u to reveal all keyframes, have properties like opacity,
// effects and everything like after effects"):
//   effects      layer.fx = [{id, type, on?, params: {radius: 8}, color?}]: an effect is a CSS filter (EFFECTS below). Its numbers are animated like the transform's: a keyframe
//                holds `fx:<effect id>:<param>` (`fx:blur-1:radius`), the stopwatch and ◂ ◆ ▸ are the same.
//   blend, label layer.blend: a CSS mix-blend-mode (After Effects' mode); layer.label: 1..16, the color of its bar (After Effects' label colors; none: the kind's).
//   spans        `edits.layers[title].spans[<element's name>] = {from, to}`: the elements of the slides cannot move in time (they live on their slides), but their bar
//                can be trimmed: they are not seen before `from` or after `to` (components/storyboardLayers.js `drawSpans`).
export const STAGE_W = 1600, STAGE_H = 900;
export const LAYER_KINDS = ['rect', 'ellipse', 'text', 'image', 'path'];
export const ANIMATED = ['x', 'y', 'w', 'h', 'rotation', 'opacity', 'trimStart', 'trimEnd'];
export const TRIM = ['trimStart', 'trimEnd']; // (a path's only: After Effects' Trim Paths)
const BASE_PROPS = ANIMATED.filter(p => !TRIM.includes(p));
// the transform's properties a layer can animate (a path has the trim too)
export const transformProps = layer => (layer.kind === 'path' ? ANIMATED : BASE_PROPS);
export const SAME_KEY = 1 / 60; // (two keyframes closer than this are one)

// ---- After Effects' layer labels (the color of a bar), blend modes and effects ----
export const LABELS = [
  {name: 'Red', color: '#e06a6a'}, {name: 'Yellow', color: '#e8dc5c'}, {name: 'Aqua', color: '#a9d6d0'}, {name: 'Pink', color: '#f5a9c4'},
  {name: 'Lavender', color: '#b3a9e6'}, {name: 'Peach', color: '#f0c29a'}, {name: 'Sea Foam', color: '#9ed8c2'}, {name: 'Blue', color: '#7fb0e8'},
  {name: 'Green', color: '#8fd18f'}, {name: 'Purple', color: '#a77fdb'}, {name: 'Orange', color: '#eb9c52'}, {name: 'Brown', color: '#b08a62'},
  {name: 'Fuchsia', color: '#dc7cc0'}, {name: 'Cyan', color: '#58c4e0'}, {name: 'Sandstone', color: '#cdb98e'}, {name: 'Dark Green', color: '#5a9a6c'},
];
export const KIND_LABEL = {rect: 5, ellipse: 4, text: 2, image: 3, path: 9}; // (the label a kind of layer has until it is given one)
export const SLIDE_LABEL = 7; // (the elements of the slides)
export const labelOf = layer => LABELS[(layer.label ?? KIND_LABEL[layer.kind] ?? 5) - 1] ?? LABELS[4];
export const BLEND_MODES = [
  ['normal', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen'], ['overlay', 'Overlay'], ['darken', 'Darken'], ['lighten', 'Lighten'], ['color-dodge', 'Color Dodge'],
  ['color-burn', 'Color Burn'], ['hard-light', 'Hard Light'], ['soft-light', 'Soft Light'], ['difference', 'Difference'], ['exclusion', 'Exclusion'], ['hue', 'Hue'],
  ['saturation', 'Saturation'], ['color', 'Color'], ['luminosity', 'Luminosity'], ['plus-lighter', 'Add'],
];
// The effects: a CSS filter each. params: {id, name, def, min, max, step, unit}; `color`: a color the effect has (not animated)
export const EFFECTS = {
  blur: {name: 'Gaussian Blur', params: [{id: 'radius', name: 'Blurriness', def: 8, min: 0, max: 300, step: 0.5, unit: 'px'}]},
  shadow: {name: 'Drop Shadow', color: '#000000', params: [
    {id: 'x', name: 'Distance X', def: 0, min: -800, max: 800, unit: 'px'}, {id: 'y', name: 'Distance Y', def: 14, min: -800, max: 800, unit: 'px'},
    {id: 'radius', name: 'Softness', def: 18, min: 0, max: 300, unit: 'px'}, {id: 'opacity', name: 'Opacity', def: 55, min: 0, max: 100, unit: '%'}]},
  glow: {name: 'Glow', color: '#ffec00', params: [{id: 'radius', name: 'Radius', def: 26, min: 0, max: 300, unit: 'px'}, {id: 'opacity', name: 'Intensity', def: 85, min: 0, max: 100, unit: '%'}]},
  brightness: {name: 'Brightness', params: [{id: 'amount', name: 'Brightness', def: 130, min: 0, max: 500, unit: '%'}]},
  contrast: {name: 'Contrast', params: [{id: 'amount', name: 'Contrast', def: 130, min: 0, max: 500, unit: '%'}]},
  saturation: {name: 'Saturation', params: [{id: 'amount', name: 'Saturation', def: 160, min: 0, max: 500, unit: '%'}]},
  hue: {name: 'Hue Shift', params: [{id: 'angle', name: 'Hue', def: 90, min: -3600, max: 3600, unit: '°'}]},
  grayscale: {name: 'Black & White', params: [{id: 'amount', name: 'Amount', def: 100, min: 0, max: 100, unit: '%'}]},
  sepia: {name: 'Sepia', params: [{id: 'amount', name: 'Amount', def: 100, min: 0, max: 100, unit: '%'}]},
  invert: {name: 'Invert', params: [{id: 'amount', name: 'Amount', def: 100, min: 0, max: 100, unit: '%'}]},
};
export const EFFECT_TYPES = Object.keys(EFFECTS);
export const FX_PROP = /^fx:[\w-]+:\w+$/;
export const fxProp = (id, param) => `fx:${id}:${param}`;
export const isAnimatedProp = prop => ANIMATED.includes(prop) || FX_PROP.test(prop);
// The properties a keyframe holds (everything but its time and its easing)
export const propsInKey = k => Object.keys(k).filter(p => p !== 't' && p !== 'ease' && k[p] != null);
// The transform's groups of the timeline's twirl (After Effects' Transform), then one group per effect of the layer
export const TRANSFORM_GROUPS = [
  {id: 'position', label: 'Position', props: ['x', 'y']},
  {id: 'size', label: 'Size', props: ['w', 'h']},
  {id: 'rotation', label: 'Rotation', props: ['rotation'], unit: '°'},
  {id: 'opacity', label: 'Opacity', props: ['opacity'], pct: true},
];
export const TRIM_GROUP = {id: 'trim', label: 'Trim Paths', props: ['trimStart', 'trimEnd'], pct: true}; // (a path's: After Effects' Trim Paths, the line drawn from its start to its end)
export const groupsOf = layer => [...TRANSFORM_GROUPS, ...(layer.kind === 'path' ? [TRIM_GROUP] : []), ...(layer.fx ?? []).map(e => ({id: `fx:${e.id}`, label: EFFECTS[e.type]?.name ?? e.type, fx: e.id, props: (EFFECTS[e.type]?.params ?? []).map(p => fxProp(e.id, p.id))}))];
// A group's parameters, for its rows: {prop, name, unit, min, max, step} (the transform's: its props)
export function paramsOf(layer, group) {
  const e = group.fx ? layer.fx?.find(x => x.id === group.fx) : null, spec = e ? EFFECTS[e.type]?.params ?? [] : [];
  return group.props.map((prop, i) => (e ? {prop, name: spec[i].name, unit: spec[i].unit ?? '', min: spec[i].min, max: spec[i].max, step: spec[i].step ?? 1} : {prop, name: prop, unit: group.unit ?? (group.pct ? '%' : ''), pct: group.pct}));
}
const effectSpec = (type, param) => EFFECTS[type]?.params.find(p => p.id === param) ?? null;
const NAMES = {rect: 'Rectangle', ellipse: 'Ellipse', text: 'Text', image: 'Image', path: 'Path'};
export const LAYER_DEFAULTS = {
  rect: {w: 320, h: 200, fill: '#ffec00', stroke: null, strokeWidth: 0, radius: 12},
  ellipse: {w: 240, h: 240, fill: '#ffec00', stroke: null, strokeWidth: 0, radius: 0},
  text: {w: 420, h: 80, text: 'Text', font: 'montserrat', size: 48, weight: 600, color: '#ffffff', align: 'left'},
  image: {w: 480, h: 320, src: ''},
  path: {w: 100, h: 100, stroke: '#7b3cf0', strokeWidth: 3, fill: null},
};
const now = () => new Date().toISOString();
const num = (v, lo, hi, digits = 2) => { const n = Number(v); if (!Number.isFinite(n)) return null; const k = 10 ** digits; return Math.round(Math.min(hi, Math.max(lo, n)) * k) / k; };
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : null);
const color = v => (typeof v === 'string' && v.length < 80 && /^(#[0-9a-f]{3,8}|rgba?\([^)]{1,60}\)|hsla?\([^)]{1,60}\)|[a-z]{3,20})$/i.test(v.trim()) ? v.trim() : null);
const LIMITS = {x: [-STAGE_W * 4, STAGE_W * 5], y: [-STAGE_H * 4, STAGE_H * 5], w: [1, STAGE_W * 6], h: [1, STAGE_H * 6], rotation: [-3600, 3600], opacity: [0, 1], trimStart: [0, 1], trimEnd: [0, 1]};
const valueOf = (prop, v) => num(v, ...LIMITS[prop], prop === 'opacity' || TRIM.includes(prop) ? 3 : 2);

// ---- Cleaning (the file is edited by hand and by the command line too) ----
function cleanKey(k) {
  if (!k || typeof k !== 'object') return null;
  const t = num(k.t, 0, 36000, 3);
  if (t == null) return null;
  const out = {t};
  for (const prop of ANIMATED) { const v = valueOf(prop, k[prop]); if (v != null) out[prop] = v; }
  for (const prop of Object.keys(k)) if (FX_PROP.test(prop) && prop.length < 60) { const v = num(k[prop], -1e5, 1e5, 3); if (v != null) out[prop] = v; } // (an effect's number: cleaned against its effect after)
  if (k.ease === 'linear' || k.ease === 'hold') out.ease = k.ease;
  return Object.keys(out).length > 1 ? out : null;
}
// The effects of a layer as kept: a known type, a unique id, every number in its range (the one missing: the default)
function cleanFx(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [], used = new Set();
  for (const e of raw.slice(0, 24)) {
    const spec = EFFECTS[e?.type];
    if (!spec) continue;
    let id = str(e.id, 40)?.replace(/[^\w-]/g, '');
    if (!id || used.has(id)) { let n = 1; while (used.has(`${e.type}-${n}`)) n++; id = `${e.type}-${n}`; }
    used.add(id);
    const params = {};
    for (const p of spec.params) params[p.id] = num(e.params?.[p.id], p.min, p.max, 3) ?? p.def;
    const fx = {id, type: e.type, params};
    if (e.on === false) fx.on = false;
    if (spec.color) fx.color = color(e.color) ?? spec.color;
    out.push(fx);
  }
  return out;
}
export function cleanVideoLayer(raw) {
  if (!raw || typeof raw !== 'object' || !LAYER_KINDS.includes(raw.kind)) return null;
  const id = str(raw.id, 60)?.replace(/[^\w-]/g, '');
  if (!id) return null;
  const base = LAYER_DEFAULTS[raw.kind], out = {id, kind: raw.kind, name: (str(raw.name, 80) ?? '').replace(/\s+/g, ' ').trim() || NAMES[raw.kind]};
  const from = num(raw.from, 0, 36000, 3) ?? 0, to = num(raw.to, 0, 36000, 3);
  out.from = from; out.to = to != null && to > from ? to : from + 5;
  if (raw.hidden === true) out.hidden = true;
  if (raw.locked === true) out.locked = true;
  // A path keeps its points in its frame (its box). Given with no frame (`pw`, `ph`: the command line, a conversion) the points are on the picture and the frame is made to fit them.
  let points = null, made = null;
  if (raw.kind === 'path') {
    points = cleanPoints(raw.points);
    if (points.length < MIN_POINTS) return null;
    if (raw.pw == null || raw.ph == null) { made = frameFromStage(points, raw.closed === true); if (!made) return null; points = made.points; }
  }
  out.x = made?.x ?? valueOf('x', raw.x) ?? (STAGE_W - base.w) / 2;
  out.y = made?.y ?? valueOf('y', raw.y) ?? (STAGE_H - base.h) / 2;
  out.w = made?.w ?? valueOf('w', raw.w) ?? base.w;
  out.h = made?.h ?? valueOf('h', raw.h) ?? base.h;
  out.rotation = valueOf('rotation', raw.rotation) ?? 0;
  out.opacity = valueOf('opacity', raw.opacity) ?? 1;
  if (raw.kind === 'rect' || raw.kind === 'ellipse') {
    out.fill = raw.fill === null ? null : normalizePaint(raw.fill) ?? base.fill;
    out.stroke = raw.stroke == null ? null : color(raw.stroke);
    out.strokeWidth = num(raw.strokeWidth, 0, 200) ?? 0;
    out.radius = num(raw.radius, 0, 2000) ?? base.radius;
  } else if (raw.kind === 'text') {
    out.text = str(raw.text, 2000) ?? base.text;
    out.font = (str(raw.font, 40) ?? base.font).replace(/[^\w-]/g, '') || base.font;
    out.size = num(raw.size, 4, 600) ?? base.size;
    out.weight = num(raw.weight, 100, 900, 0) ?? base.weight;
    out.color = color(raw.color) ?? base.color;
    out.align = ['left', 'center', 'right'].includes(raw.align) ? raw.align : base.align;
  } else if (raw.kind === 'path') {
    out.points = points;
    if (raw.closed === true) out.closed = true;
    out.pw = made?.pw ?? num(raw.pw, 1, 20000) ?? out.w;
    out.ph = made?.ph ?? num(raw.ph, 1, 20000) ?? out.h;
    out.stroke = color(raw.stroke) ?? base.stroke; // (the line's color; a width of 0 is no line)
    out.strokeWidth = num(raw.strokeWidth, 0, 200) ?? base.strokeWidth;
    out.fill = raw.fill == null ? null : color(raw.fill); // (a closed path's; a color)
    out.lineCap = LINE_CAPS.includes(raw.lineCap) ? raw.lineCap : 'round';
    out.lineJoin = LINE_JOINS.includes(raw.lineJoin) ? raw.lineJoin : 'round';
    out.dash = DASHES.includes(raw.dash) ? raw.dash : 'solid';
    out.startCap = CAPS.includes(raw.startCap) ? raw.startCap : 'none';
    out.endCap = CAPS.includes(raw.endCap) ? raw.endCap : 'none';
    out.capScale = num(raw.capScale, 0.25, 8) ?? 1;
    out.trimStart = valueOf('trimStart', raw.trimStart) ?? 0;
    out.trimEnd = valueOf('trimEnd', raw.trimEnd) ?? 1;
    const replaces = Array.isArray(raw.replaces) ? raw.replaces.filter(s => typeof s === 'string' && s.length > 0 && s.length < 80).slice(0, 60) : [];
    if (replaces.length) out.replaces = replaces;
  } else {
    const src = str(raw.src, 4e6) ?? '';
    out.src = /^(\/|https?:\/\/|data:image\/)/.test(src) ? src : '';
  }
  if (BLEND_MODES.some(([id]) => id === raw.blend) && raw.blend !== 'normal') out.blend = raw.blend;
  const label = raw.label == null ? null : num(raw.label, 1, LABELS.length, 0);
  if (label != null) out.label = label;
  const fx = cleanFx(raw.fx);
  if (fx.length) out.fx = fx;
  const keys = Array.isArray(raw.keys) ? raw.keys.map(cleanKey).filter(Boolean).sort((a, b) => a.t - b.t) : [];
  const merged = [];
  for (const k of keys) { const last = merged.at(-1); if (last && k.t - last.t < SAME_KEY) Object.assign(last, k, {t: last.t}); else merged.push(k); }
  const known = new Set(fx.flatMap(e => EFFECTS[e.type].params.map(p => fxProp(e.id, p.id)))); // (a keyframe of an effect that is not there, or of a number it has not, is dropped)
  const kept = merged.map(k => { const c = {...k}; for (const p of Object.keys(c)) if (FX_PROP.test(p) && !known.has(p)) delete c[p]; return c; }).filter(k => propsInKey(k).length);
  if (kept.length) out.keys = kept.slice(0, 500);
  return out;
}
// The trimmed windows of the elements of the slides: {name: {from, to}}
function cleanSpans(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const [name, s] of Object.entries(raw).slice(0, 400)) {
    if (!name || name.length > 160 || !s || typeof s !== 'object') continue;
    const from = s.from == null ? null : num(s.from, 0, 36000, 3), to = s.to == null ? null : num(s.to, 0, 36000, 3);
    if (from == null && to == null) continue;
    out[name] = {...(from != null ? {from} : {}), ...(to != null ? {to} : {})};
  }
  return Object.keys(out).length ? out : null;
}
// `edits.layers` as kept: {title: {items, spans?, at}}
export function cleanVideoLayers(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const [title, v] of Object.entries(raw)) {
    if (typeof title !== 'string' || title.length > 160 || !v || typeof v !== 'object') continue;
    const seen = new Set(), items = (Array.isArray(v.items) ? v.items : []).map(cleanVideoLayer).filter(l => l && !seen.has(l.id) && seen.add(l.id)).slice(0, 300), spans = cleanSpans(v.spans);
    out[title] = {items, ...(spans ? {spans} : {}), at: typeof v.at === 'string' ? v.at : now()}; // (an empty list is kept: it says all of them were deleted, and wins over an older copy that had some)
  }
  return Object.keys(out).length ? out : null;
}
// Two copies of the board's edits meet: for each video the newer list wins.
export function mergeVideoLayers(base, other) {
  let out = base ?? null, changed = false;
  for (const [title, theirs] of Object.entries(other ?? {})) {
    const mine = out?.[title];
    if (!mine || String(theirs.at ?? '') > String(mine.at ?? '')) { out = {...(out ?? {}), [title]: theirs}; changed = true; }
  }
  return {layers: out, changed};
}

// ---- Reading and changing the layers of a video (edits in, edits out) ----
export const layersOf = (edits, title) => edits?.layers?.[title]?.items ?? [];
export function setLayers(edits, title, items, at = now()) {
  const spans = edits.layers?.[title]?.spans;
  return {...edits, layers: {...(edits.layers ?? {}), [title]: {items, ...(spans ? {spans} : {}), at}}};
}
// The trimmed windows of the elements of the slides (see the top): {name: {from?, to?}}
const NO_SPANS = Object.freeze({});
export const spansOf = (edits, title) => edits?.layers?.[title]?.spans ?? NO_SPANS; // (the same empty object each time: what is memoized on it is not drawn again)
// An element's window set (`span` null: given back the whole video); a window that holds everything is no window
export function setSpan(edits, title, name, span, at = now()) {
  const spans = {...spansOf(edits, title)};
  const clean = span ? cleanSpans({[name]: span}) : null;
  if (clean) spans[name] = clean[name]; else delete spans[name];
  const items = layersOf(edits, title), {spans: _, ...rest} = edits.layers?.[title] ?? {};
  return {...edits, layers: {...(edits.layers ?? {}), [title]: {...rest, items, ...(Object.keys(spans).length ? {spans} : {}), at}}};
}
export const isInSpan = (span, t) => !span || ((span.from == null || t >= span.from - 1e-6) && (span.to == null || t <= span.to + 1e-6));
export function newLayerId(items, kind) {
  const used = new Set(items.map(l => l.id));
  for (let n = 1; ; n++) { const id = `${kind}-${n}`; if (!used.has(id)) return id; }
}
// A new layer (on top), its values cleaned; -> {edits, id}
export function addVideoLayer(edits, title, layer) {
  const items = layersOf(edits, title), id = layer.id && !items.some(l => l.id === layer.id) ? layer.id : newLayerId(items, layer.kind);
  const clean = cleanVideoLayer({...LAYER_DEFAULTS[layer.kind], ...layer, id});
  if (!clean) return {edits, id: null};
  return {edits: setLayers(edits, title, [...items, clean]), id};
}
// `change`: a patch, or a function of the layer -> the layer (cleaned after)
export function updateVideoLayer(edits, title, id, change) {
  const items = layersOf(edits, title), i = items.findIndex(l => l.id === id);
  if (i < 0) return edits;
  const next = cleanVideoLayer(typeof change === 'function' ? change(items[i]) : {...items[i], ...change});
  if (!next) return edits;
  return setLayers(edits, title, items.map((l, k) => (k === i ? next : l)));
}
export const removeVideoLayer = (edits, title, id) => setLayers(edits, title, layersOf(edits, title).filter(l => l.id !== id));
// Up the stacking (dir 1: one forward, 'front'; -1: one back, 'back')
export function stackVideoLayer(edits, title, id, dir) {
  const items = [...layersOf(edits, title)], i = items.findIndex(l => l.id === id);
  if (i < 0) return edits;
  const [layer] = items.splice(i, 1), to = dir === 'front' ? items.length : dir === 'back' ? 0 : Math.max(0, Math.min(items.length, i + dir));
  items.splice(to, 0, layer);
  return setLayers(edits, title, items);
}
// The whole stacking at once (`ids` from the back to the front: the timeline's names dragged up or down, several layers brought forward together); a layer
// not named stays, in front of them
export function orderVideoLayers(edits, title, ids) {
  const items = layersOf(edits, title), byId = new Map(items.map(l => [l.id, l])), seen = new Set();
  const out = ids.map(id => byId.get(id)).filter(l => l && !seen.has(l.id) && seen.add(l.id));
  for (const l of items) if (!seen.has(l.id)) out.push(l);
  return setLayers(edits, title, out);
}
// A layer cut in two at `at` (After Effects' Split Layer, Ctrl+Shift+D): it ends there and its copy (`newId`) starts there, just above it, with the same
// keyframes (they are times of the video: the two go on as the one did) -> {edits, id}
export function splitVideoLayer(edits, title, id, at, newId = null) {
  const items = layersOf(edits, title), i = items.findIndex(l => l.id === id), l = items[i];
  if (!l || at <= l.from + 0.05 || at >= l.to - 0.05) return {edits, id: null};
  const nid = newId && !items.some(x => x.id === newId) ? newId : newLayerId(items, l.kind);
  const first = cleanVideoLayer({...l, to: at}), second = cleanVideoLayer({...l, id: nid, from: at});
  if (!first || !second) return {edits, id: null};
  return {edits: setLayers(edits, title, [...items.slice(0, i), first, second, ...items.slice(i + 1)]), id: nid};
}
export function duplicateVideoLayer(edits, title, id, shift = 0) {
  const items = layersOf(edits, title), l = items.find(x => x.id === id);
  if (!l) return {edits, id: null};
  return addVideoLayer(edits, title, {...l, id: null, name: `${l.name} copy`, x: l.x + 24, y: l.y + 24, from: l.from + shift, to: l.to + shift, keys: l.keys?.map(k => ({...k, ...(k.x != null ? {x: k.x + 24} : {}), ...(k.y != null ? {y: k.y + 24} : {}), t: k.t + shift}))});
}

// ---- Keyframes ----
export const isAnimated = (layer, prop) => !!layer.keys?.some(k => k[prop] != null);
const easeInOut = u => (u < 0.5 ? 4 * u * u * u : 1 - ((-2 * u + 2) ** 3) / 2);
// What a property is when it has no keyframe: the layer's own number, or an effect's (`fx:<id>:<param>`)
function baseOf(layer, prop) {
  if (!prop.startsWith('fx:')) return layer[prop];
  const [, id, param] = prop.split(':');
  return layer.fx?.find(e => e.id === id)?.params?.[param];
}
function withBase(layer, prop, v) {
  if (!prop.startsWith('fx:')) return {...layer, [prop]: v};
  const [, id, param] = prop.split(':');
  return {...layer, fx: (layer.fx ?? []).map(e => (e.id === id && param in (e.params ?? {}) ? {...e, params: {...e.params, [param]: v}} : e))};
}
// Every property of a layer that can be animated: the transform's, then each effect's numbers
export const propsOf = layer => [...transformProps(layer), ...(layer.fx ?? []).flatMap(e => (EFFECTS[e.type]?.params ?? []).map(p => fxProp(e.id, p.id)))];
// One property at a time `t`.
export function valueAt(layer, prop, t) {
  const keys = layer.keys?.filter(k => k[prop] != null);
  if (!keys?.length) return baseOf(layer, prop);
  if (t <= keys[0].t) return keys[0][prop];
  const last = keys.at(-1);
  if (t >= last.t) return last[prop];
  let i = 0;
  while (keys[i + 1].t < t) i++;
  const a = keys[i], b = keys[i + 1];
  if (a.ease === 'hold') return a[prop];
  const u = (t - a.t) / Math.max(1e-6, b.t - a.t), e = a.ease === 'linear' ? u : easeInOut(u);
  return a[prop] + (b[prop] - a[prop]) * e;
}
// Every animated value at `t` -> {x, y, w, h, rotation, opacity}
export function valuesAt(layer, t) {
  const out = {};
  for (const prop of ANIMATED) out[prop] = valueAt(layer, prop, t);
  return out;
}
export const isShownAt = (layer, t) => !layer.hidden && t >= layer.from - 1e-6 && t <= layer.to + 1e-6;
// A change made at `t` (on the picture, in the inspector): an animated property gets a keyframe there (made, or the one there changed), the others change
// for the whole layer (After Effects).
export function setLayerAt(layer, t, patch) {
  let next = {...layer};
  const keyed = {};
  for (const [prop, v] of Object.entries(patch)) {
    if (isAnimatedProp(prop) && isAnimated(layer, prop)) keyed[prop] = v; else next = withBase(next, prop, v);
  }
  if (Object.keys(keyed).length) next.keys = upsertKey(layer.keys ?? [], t, keyed);
  return next;
}
function upsertKey(keys, t, values) {
  const at = keys.findIndex(k => Math.abs(k.t - t) < SAME_KEY);
  if (at >= 0) return keys.map((k, i) => (i === at ? {...k, ...values} : k));
  return [...keys, {t, ...values}].sort((a, b) => a.t - b.t);
}
// The stopwatch of a property: on, it gets its first keyframe at `t` with the value it has; off, it loses all of them and keeps the value it has at `t`.
export function setAnimated(layer, prop, t, on) {
  if (on === isAnimated(layer, prop)) return layer;
  if (on) return {...layer, keys: upsertKey(layer.keys ?? [], t, {[prop]: valueAt(layer, prop, t)})};
  const value = valueAt(layer, prop, t), keys = (layer.keys ?? []).map(k => { const {[prop]: _, ...rest} = k; return rest; }).filter(k => propsInKey(k).length);
  return {...withBase(layer, prop, value), keys};
}
// A keyframe at `t` for every animated property (all of the transform's when none is): the ◆ button and the K key
export function addKeyAt(layer, t) {
  const props = propsOf(layer).filter(p => isAnimated(layer, p)), on = props.length ? props : BASE_PROPS;
  return {...layer, keys: upsertKey(layer.keys ?? [], t, Object.fromEntries(on.map(p => [p, valueAt(layer, p, t)])))};
}
export function removeKeyAt(layer, t, prop = null) {
  const keys = (layer.keys ?? []).map(k => {
    if (Math.abs(k.t - t) >= SAME_KEY) return k;
    if (!prop) return null;
    const {[prop]: _, ...rest} = k;
    return rest;
  }).filter(k => k && propsInKey(k).length);
  return {...layer, keys};
}
// A keyframe dragged on the timeline (all that are at `from`; `prop`: only that property's)
export function moveKey(layer, from, to, prop = null) {
  const at = Math.max(0, to), keys = [];
  for (const k of layer.keys ?? []) {
    if (Math.abs(k.t - from) >= SAME_KEY) { keys.push(k); continue; }
    if (!prop) { keys.push({...k, t: at}); continue; }
    const {[prop]: v, ...rest} = k;
    if (propsInKey(rest).length) keys.push(rest);
    if (v != null) keys.push({t: at, [prop]: v, ...(k.ease ? {ease: k.ease} : {})});
  }
  const sorted = keys.sort((a, b) => a.t - b.t), merged = [];
  for (const k of sorted) { const last = merged.at(-1); if (last && k.t - last.t < SAME_KEY) Object.assign(last, k, {t: last.t}); else merged.push({...k}); }
  return {...layer, keys: merged};
}
// Keyframes picked on the timeline, several at once (the user, 2026-10-26: "multiselection"): `picks` [{t, props}], `props` the properties of the keyframe
// at `t` that are picked (a row of the twirl: ['x', 'y']…), null for all of it (the layer's own row)
function pickedProps(k, picks) {
  const hits = picks.filter(p => Math.abs(p.t - k.t) < SAME_KEY);
  if (!hits.length) return [];
  return (hits.some(p => !p.props) ? propsInKey(k) : [...new Set(hits.flatMap(p => p.props))]).filter(p => k[p] != null);
}
// ... moved together by `by` seconds (their easing goes with them); one landing on a keyframe that stays is merged into it, its values winning
export function shiftKeys(layer, picks, by) {
  const out = [], moved = [];
  for (const k of layer.keys ?? []) {
    const take = pickedProps(k, picks);
    if (!take.length) { out.push({...k}); continue; }
    const go = {t: Math.max(0, Math.round((k.t + by) * 1000) / 1000), ...(k.ease ? {ease: k.ease} : {})}, stay = {...k};
    for (const p of take) { go[p] = k[p]; delete stay[p]; }
    moved.push(go);
    if (propsInKey(stay).length) out.push(stay);
  }
  for (const m of moved) { const at = out.find(k => Math.abs(k.t - m.t) < SAME_KEY); if (at) Object.assign(at, m, {t: at.t}); else out.push(m); }
  return {...layer, keys: out.sort((a, b) => a.t - b.t)};
}
// ... taken off (Delete)
export function removeKeys(layer, picks) {
  const keys = (layer.keys ?? []).map(k => { const take = pickedProps(k, picks); if (!take.length) return k; const rest = {...k}; for (const p of take) delete rest[p]; return rest; });
  return {...layer, keys: keys.filter(k => propsInKey(k).length)};
}
// ... their easing (F9: easy ease; the right-click menu: linear, hold)
export const easeKeys = (layer, times, ease) => times.reduce((cur, t) => setKeyEase(cur, t, ease), layer);
export const keyTimes = (layer, prop = null) => [...new Set((layer.keys ?? []).filter(k => (prop ? k[prop] != null : true)).map(k => k.t))].sort((a, b) => a - b);
export const setKeyEase = (layer, t, ease) => ({...layer, keys: (layer.keys ?? []).map(k => (Math.abs(k.t - t) < SAME_KEY ? {...k, ...(ease === 'ease' ? {ease: undefined} : {ease})} : k))});
// The bar moved (`by` seconds: the layer and its keyframes go together), or one of its ends dragged
export const shiftLayer = (layer, by) => ({...layer, from: Math.max(0, layer.from + by), to: Math.max(0, layer.to + by), keys: layer.keys?.map(k => ({...k, t: Math.max(0, k.t + by)}))});
export const trimLayer = (layer, end, t) => (end === 'from' ? {...layer, from: Math.max(0, Math.min(t, layer.to - 0.1))} : {...layer, to: Math.max(layer.from + 0.1, t)});

// ---- Effects (the user, 2026-10-28: "have properties like opacity, effects and everything like after effects") ----
const hexRgb = c => { const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c ?? ''); if (!m) return null; const h = m[1].length === 3 ? [...m[1]].map(x => x + x).join('') : m[1]; return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const withAlpha = (c, a) => { const rgb = hexRgb(c), k = Math.max(0, Math.min(1, a)); return rgb ? `rgba(${rgb.join(',')},${k.toFixed(3)})` : `color-mix(in srgb, ${c} ${Math.round(k * 100)}%, transparent)`; };
// The CSS filter of a layer's effects at `t` ('' for none): in the order of the list, each number as keyframed, held to its range
export function fxCss(layer, t) {
  if (!layer.fx?.length) return '';
  const parts = [];
  for (const e of layer.fx) {
    if (e.on === false || !EFFECTS[e.type]) continue;
    const p = id => { const s = effectSpec(e.type, id), v = valueAt(layer, fxProp(e.id, id), t); return Math.max(s.min, Math.min(s.max, Number.isFinite(v) ? v : s.def)); };
    if (e.type === 'blur') parts.push(`blur(${p('radius')}px)`);
    else if (e.type === 'shadow') parts.push(`drop-shadow(${p('x')}px ${p('y')}px ${p('radius')}px ${withAlpha(e.color, p('opacity') / 100)})`);
    else if (e.type === 'glow') { const c = withAlpha(e.color, p('opacity') / 100); parts.push(`drop-shadow(0 0 ${p('radius')}px ${c})`, `drop-shadow(0 0 ${p('radius') / 3}px ${c})`); }
    else if (e.type === 'hue') parts.push(`hue-rotate(${p('angle')}deg)`);
    else parts.push(`${e.type === 'saturation' ? 'saturate' : e.type}(${p('amount') / 100})`); // (brightness, contrast, grayscale, sepia, invert)
  }
  return parts.join(' ');
}
export function newEffectId(layer, type) {
  const used = new Set((layer.fx ?? []).map(e => e.id));
  for (let n = 1; ; n++) { const id = `${type}-${n}`; if (!used.has(id)) return id; }
}
// A layer with one more effect (its numbers at their defaults) -> {layer, id}
export function addEffect(layer, type) {
  const spec = EFFECTS[type];
  if (!spec) return {layer, id: null};
  const id = newEffectId(layer, type), fx = {id, type, params: Object.fromEntries(spec.params.map(p => [p.id, p.def])), ...(spec.color ? {color: spec.color} : {})};
  return {layer: {...layer, fx: [...(layer.fx ?? []), fx]}, id};
}
// ... one effect gone, with its keyframes
export function removeEffect(layer, id) {
  const keys = (layer.keys ?? []).map(k => { const c = {...k}; for (const p of Object.keys(c)) if (p.startsWith(`fx:${id}:`)) delete c[p]; return c; }).filter(k => propsInKey(k).length);
  return {...layer, fx: (layer.fx ?? []).filter(e => e.id !== id), keys};
}
// ... its switch / its color (the numbers go through `setLayerAt`, as the transform's do)
export const patchEffect = (layer, id, patch) => ({...layer, fx: (layer.fx ?? []).map(e => (e.id === id ? {...e, ...patch} : e))});
// ... one place up (-1) or down (1) the list (the filters apply in that order)
export function moveEffect(layer, id, dir) {
  const fx = [...(layer.fx ?? [])], i = fx.findIndex(e => e.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= fx.length) return layer;
  [fx[i], fx[j]] = [fx[j], fx[i]];
  return {...layer, fx};
}

// ---- Revealing properties (After Effects' U and UU) ----
// U: the groups of a layer with a keyframe; UU: those too that are not as they start (a turn, an opacity, every effect)
export const animatedGroups = layer => groupsOf(layer).filter(g => g.props.some(p => isAnimated(layer, p))).map(g => g.id);
export function modifiedGroups(layer) {
  const out = new Set(animatedGroups(layer));
  for (const g of groupsOf(layer)) {
    if (g.fx) out.add(g.id);
    else if (g.id === 'rotation' && layer.rotation) out.add(g.id);
    else if (g.id === 'opacity' && layer.opacity !== 1) out.add(g.id);
    else if (g.id === 'trim' && (layer.trimStart > 0 || layer.trimEnd < 1)) out.add(g.id);
  }
  return [...out];
}
