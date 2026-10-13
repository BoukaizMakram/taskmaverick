// The "split" design of the storyboard (the user, 2026-10-07: "follow this style in image and change all
// storyboard to follow this style, with same background, same text instead of chatbox, two half backgrounds
// with the tablet on its half"). The model is a frame the user designed (Scratch, frame 3): a dark metal
// gradient for the frame, a gray-blue plate over its left part holding the frame's art (the tablet), the words
// on the right in white handwriting with no chat box. This file is the pure part of applying it to any frame:
//   - where a frame's art goes (fitLine), and
//   - the edits that make a frame look like the model (applyFrame).
// scripts/storyboard-split.mjs measures the frames in a browser and calls these. Pure.
import {addInserts, layersOf, moveLayers, removeInsert, resetAsset, setBackground, setBubble, setMove, setScale, setSize, setStyle} from './storyboardEdits.mjs';
import {hashString} from './storyboardParts.mjs';

export const STAGE = {w: 1600, h: 900};
// Tuning (not from the model): art is never scaled up more than this, never down below this; a frame whose
// art is smaller than PARTIAL of the line's biggest (cards appearing one by one) is "partial" and keeps the
// place of the next full frame, so what stays on screen does not jump.
export const SPLIT = {maxUp: 1.35, minScale: 0.3, partial: 0.55};

// Layers that are not the frame's art but drawn over it (they move with it, and do not decide where it goes).
export const OVERLAY = /^(hand|click ripple|yellow outline|highlight|names|dates|rectangle|chat bubble|video timeline|circle|arrow|plate|panel)$/i;
export const isTitle = name => /^title$/i.test(name ?? '');
export const isOverlay = name => OVERLAY.test(name ?? '');

// ---- Boxes ({l, t, r, b}, stage px) ----
export const boxOf = ({x, y, w, h}) => ({l: x, t: y, r: x + w, b: y + h});
export const sizeOf = box => ({w: box.r - box.l, h: box.b - box.t});
export const centerOf = box => ({x: (box.l + box.r) / 2, y: (box.t + box.b) / 2});
export const areaOf = box => Math.max(0, box.r - box.l) * Math.max(0, box.b - box.t);
export function unionOf(boxes) {
  const list = boxes.filter(Boolean);
  return list.length ? {l: Math.min(...list.map(b => b.l)), t: Math.min(...list.map(b => b.t)), r: Math.max(...list.map(b => b.r)), b: Math.max(...list.map(b => b.b))} : null;
}

// ---- Where the art goes ----
// A line's frames, in board order, each with its art (the box of what its main layers paint, or null):
// -> {frameId: fit | null}. A fit maps a point p of the frame to `to + s * (p - from)`: one scale for the
// whole line (the biggest that lets every full frame's art fit the slot, never above SPLIT.maxUp), each full
// frame's art centered in the slot (art narrower than the slot: centered on the plate), a partial frame
// placed as the next full frame (else the one before).
export function fitLine(frames, design) {
  const {slot, plateCenterX} = design, sized = frames.filter(f => f.art && areaOf(f.art) > 0);
  const out = Object.fromEntries(frames.map(f => [f.id, null]));
  if (!sized.length) return out;
  const biggest = Math.max(...sized.map(f => areaOf(f.art))), full = sized.filter(f => areaOf(f.art) >= SPLIT.partial * biggest);
  const s = Math.max(SPLIT.minScale, Math.min(SPLIT.maxUp, ...full.map(f => Math.min(slot.w / sizeOf(f.art).w, slot.h / sizeOf(f.art).h))));
  const fits = new Map();
  for (const f of full) {
    const w = sizeOf(f.art).w * s, x = Math.min(slot.x + slot.w - w / 2, Math.max(plateCenterX, slot.x + w / 2));
    fits.set(f.id, {s, from: centerOf(f.art), to: {x, y: slot.y + slot.h / 2}});
  }
  frames.forEach((f, i) => {
    if (!f.art || areaOf(f.art) <= 0) return;
    if (fits.has(f.id)) { out[f.id] = fits.get(f.id); return; }
    const after = frames.slice(i + 1).find(g => fits.has(g.id)), before = frames.slice(0, i).reverse().find(g => fits.has(g.id));
    out[f.id] = fits.get((after ?? before).id);
  });
  return out;
}
export const place = (fit, p) => ({x: fit.to.x + fit.s * (p.x - fit.from.x), y: fit.to.y + fit.s * (p.y - fit.from.y)});

// ---- The edits ----
const plateAsset = (key, box) => {
  const html = `<div data-sb-root="${key}" data-sb-box="rect" style="position:absolute;left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;z-index:20;box-sizing:border-box;background:#cfd6dd"></div>`;
  return {html, hash: hashString(html)};
};
// An old plate: a big rectangle with a fill of its own (the user made one by hand), or one of ours.
export const isPlateLike = (edit, layer) => {
  const size = edit?.sizes?.[layer.key] ?? [layer.box?.w ?? 0, layer.box?.h ?? 0];
  return /^(rectangle|plate|panel)$/i.test(layer.name) && size[0] * size[1] >= 0.25 * STAGE.w * STAGE.h && !!edit?.styles?.[layer.key]?.fill;
};

// The frame as the model: `plan` is what was measured and decided for it (scripts/storyboard-split.mjs):
//   plate     true: the backdrop behind the art: a light plate over the whole slide and, over it, a dark panel on the right (the words' side)
//   titleBackdrop  true (a slide of only words): the same two layers, the panel over the whole slide
//   panel     'right' (default) | 'full' | 'away': where the dark panel is (away: off the right edge, a slide with nothing said)
//   roots     [{key, translate: [x, y], scale: [sx, sy] | null, size: [w, h] | null}]  the art and what is over it, placed
//   bubble    {key, translate: [x, y], size: [w, h] | null}   its chat box, as the model's words
//   title     [{key, size}]  a title's words in the model's handwriting (a frame with only words)
//   tablets   {roots: [key], screens: [key], tabs: [{key, size}], chips: [key]}  an iPad's frame and screen (a screen a bit bigger: a thinner frame), the column names and the chips as the model has them
export function applyFrame(edits, frame, plan, design) {
  const id = frame.id;
  let e = setBackground(edits, id, design.background);
  const had = layersOf(frame, e.frames[id]);
  for (const layer of had) if (isPlateLike(e.frames[id], layer)) e = removeInsert(resetAsset(e, id, layer.key), id, layer.key);
  if (plan.plate || plan.titleBackdrop) {
    // two layers, so the dark one can move across the light one from slide to slide (the user, 2026-10-08, after his Fonts slide 2)
    const taken = new Set(layersOf(frame, e.frames[id]).map(l => l.key)), free = base => { let key = base, n = 1; while (taken.has(key)) key = `${base}-${++n}`; taken.add(key); return key; };
    const plateKey = free('plate'), panelKey = free('panel');
    // the panel is ONE size (as wide as the plate) and only moves: over the right side behind the words, over the whole slide (words only),
    // or just off the right edge (nothing to say: it comes in from the right when something is said, in the video)
    const state = plan.panel ?? (plan.plate ? 'right' : 'full'), pb = design.plate.box;
    const panelBox = {...design.panel.box, w: pb.w, x: state === 'full' ? pb.x : state === 'away' ? pb.x + pb.w : design.panel.box.x};
    for (const [key, name, box, fill] of [[plateKey, 'Plate', design.plate.box, design.plate.fill], [panelKey, 'Panel', panelBox, design.panel.fill]]) {
      const {html, hash} = plateAsset(key, box);
      e = addInserts(e, id, [{key, name, kind: 'dom', asset: hash, box, z: 20}], {[hash]: html});
      e = setStyle(e, id, key, {fill});
    }
    e = moveLayers(e, frame, [panelKey], 'back');
    e = moveLayers(e, frame, [plateKey], 'back');
  }
  for (const r of plan.roots ?? []) {
    e = setMove(e, id, r.key, r.translate);
    if (r.scale) e = setScale(e, id, r.key, r.scale);
    if (r.size) e = setSize(e, id, r.key, r.size);
  }
  if (plan.bubble) {
    const b = plan.bubble;
    e = setStyle(e, id, b.key, design.text.styles);
    e = setBubble(e, id, b.key, {tail: false});
    e = setMove(e, id, b.key, b.translate);
    if (b.size) e = setSize(e, id, b.key, b.size);
  }
  for (const t of plan.title ?? []) e = setStyle(e, id, t.key, {...design.title.styles, size: t.size});
  const tab = plan.tablets;
  if (tab) {
    if (design.bezel) for (const key of tab.roots) e = setStyle(e, id, key, {bezel: design.bezel});
    if (design.screenScale > 1) for (const key of tab.screens ?? []) e = setScale(e, id, key, [design.screenScale, design.screenScale]);
    for (const t of tab.tabs) if (e.frames[id]?.styles?.[t.key]?.size == null) e = setStyle(e, id, t.key, {size: t.size});
    for (const key of tab.chips) e = setStyle(e, id, key, {shadow: true});
  }
  return e;
}
