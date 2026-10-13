// Shapes drawn on a frame with the rectangle tool (R): each is an asset of its own (a box), moved, resized
// by its handles, copied and deleted like the others; its look (any fill, a gradient or a metal, a corner
// radius, a stroke, a shadow) is the sidebar's Fill / Appearance / Stroke / Effects. Pure.
import {hashString} from './storyboardParts.mjs';

const STAGE = {w: 1600, h: 900};
export const RECT_SIZE = {w: 360, h: 220};   // a click (no drag) makes one this big, centered there
export const RECT_MIN = 6;                   // a drag shorter than this (stage px) is a click
// What a new rectangle is filled with until another is picked: the blue of the product.
export const RECT_FILL = {kind: 'linear', angle: 135, stops: [{color: '#1271b7', at: 0}, {color: '#2fa4e7', at: 100}]};

// The box between two stage points; `square`: as wide as high (the longer side), grown from the first point.
export function rectBox(from, to, {square = false} = {}) {
  let dx = to.x - from.x, dy = to.y - from.y;
  if (square) { const m = Math.max(Math.abs(dx), Math.abs(dy)); dx = (dx < 0 ? -1 : 1) * m; dy = (dy < 0 ? -1 : 1) * m; }
  return {x: Math.round(Math.min(from.x, from.x + dx)), y: Math.round(Math.min(from.y, from.y + dy)), w: Math.round(Math.abs(dx)), h: Math.round(Math.abs(dy))};
}
// The box a press ended at: the dragged one, or (a click) a default one centered on the point.
export function rectFrom(from, to, options = {}) {
  const box = rectBox(from, to, options);
  if (box.w >= RECT_MIN || box.h >= RECT_MIN) return {...box, w: Math.max(RECT_MIN, box.w), h: Math.max(RECT_MIN, box.h)};
  return {x: Math.round(from.x - RECT_SIZE.w / 2), y: Math.round(from.y - RECT_SIZE.h / 2), w: RECT_SIZE.w, h: RECT_SIZE.h};
}

// What drawing a rectangle puts on a frame: {key, inserts: [layer], library: {hash: html}}. The box has a plain
// gray of its own, so it shows even with its styles put back; the sidebar's fill goes over it.
export function rectInsert({box, taken = new Set(), count = 0}) {
  let n = 1, key;
  do key = `r${n++}-rectangle`; while (taken.has(key));
  const z = 20 + 2 * count, {x, y, w, h} = box;
  const html = `<div data-sb-root="${key}" data-sb-box="rect" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${z};box-sizing:border-box;background:#cfd6dd"></div>`;
  const asset = hashString(html);
  return {key, inserts: [{key, name: 'Rectangle', kind: 'dom', asset, z, box: {x, y, w, h}}], library: {[asset]: html}};
}
export const inStage = point => ({x: Math.min(STAGE.w, Math.max(0, point.x)), y: Math.min(STAGE.h, Math.max(0, point.y))});
