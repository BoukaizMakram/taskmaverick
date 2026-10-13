// Pictures brought into the storyboard (pasted, or dropped on a frame): each is an
// asset of its own, a box holding the picture, that can be moved, scaled, copied
// and deleted like the others. The file itself is saved by /api/storyboard/upload
// (public/storyboard/uploads/); here is only what goes on the frame. Pure.
import {hashString} from './storyboardParts.mjs';

const STAGE = {w: 1600, h: 900};
export const IMAGE_TYPES = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif'};
export const isImage = file => !!file && file.type in IMAGE_TYPES;
const attr = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// A picture's size on the frame: its own, brought down to fit `max` (never blown up).
export function fitImage(w, h, max = {w: 800, h: 560}) {
  const k = Math.min(1, max.w / Math.max(1, w), max.h / Math.max(1, h));
  return {w: Math.max(8, Math.round(w * k)), h: Math.max(8, Math.round(h * k))};
}

// What adding the picture at `url` puts on a frame: {inserts: [layer], library: {hash: html}}.
// `at`: the stage point its middle goes to (default: the middle of the frame, each later
// one a little lower); `taken`: the keys the frame has; `count`: how many things were brought in.
export function imageInsert({url, w, h, name = 'Image', taken = new Set(), count = 0, at = null}) {
  let n = 1, key;
  do key = `i${n++}-image`; while (taken.has(key));
  const size = fitImage(w, h), off = at ? 0 : (count % 6) * 28;
  const cx = at?.x ?? STAGE.w / 2 + off, cy = at?.y ?? STAGE.h / 2 + off;
  const left = Math.round(cx - size.w / 2), top = Math.round(cy - size.h / 2), z = 20 + 2 * count;
  const html = `<div data-sb-root="${key}" data-sb-box="image" style="position:absolute;left:${left}px;top:${top}px;width:${size.w}px;height:${size.h}px;z-index:${z}"><img src="${attr(url)}" alt="" draggable="false" style="display:block;width:100%;height:100%"></div>`;
  const asset = hashString(html);
  return {inserts: [{key, name, kind: 'dom', asset, z, box: {x: left, y: top, w: size.w, h: size.h}}], library: {[asset]: html}};
}
