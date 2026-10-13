// Shift+A in the storyboard (and the Assets Library, /assets-library): the product's UI,
// a piece at a time, as a grid of thumbnails by category (Missions, Mission details,
// Boards, Navigation, Screens, Web app, Annotations). The pieces are real UI taken from the product by
// scripts/capture-storyboard.mjs (public/storyboard/ui-parts.json, thumbnails in
// public/storyboard/ui/); the hand, the speech bubble and the spotlight are made
// here. Choosing one adds just that piece to the frame, in the middle, as an
// asset that can be moved, retyped and deleted.
import {ELEMENTS} from './assetElements.mjs';
import {termsOf} from './assetsSearch.mjs';

export const CATEGORIES = ['Missions', 'Mission details', 'Boards', 'Navigation', 'Screens', 'Web app', 'Annotations'];
// Made here (no HTML to capture); w / h are their size in a frame.
export const SYNTHETIC = [
  {id: 'hand', name: 'Hand', category: 'Annotations', keywords: 'cursor pointer click tap finger yellow', w: 42, h: 52, synthetic: true},
  {id: 'speech-bubble', name: 'Speech bubble', category: 'Annotations', keywords: 'chat message caption words teardrop yellow', w: 240, h: 40, synthetic: true},
  {id: 'spotlight', name: 'Spotlight', category: 'Annotations', keywords: 'circle outline highlight callout dim', w: 360, h: 140, synthetic: true},
];
const STAGE = {w: 1600, h: 900};

// A short hash of a string (two 32-bit FNV-1a runs), for keying HTML.
export function hashString(text) {
  let a = 0x811c9dc5, b = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    a = Math.imul(a ^ text.charCodeAt(i), 0x01000193) >>> 0;
    b = Math.imul(b + text.charCodeAt(i), 0x85ebca6b) >>> 0;
  }
  return `h${a.toString(36)}${b.toString(36)}${text.length.toString(36)}`;
}

// A catalog without its HTML: all a page needs that only shows the pieces (their picture is
// public/storyboard/ui/<id>.jpg), a fraction of the size.
export const slimParts = catalog => Object.fromEntries(Object.entries(catalog ?? {}).map(([id, {html, ctx, ...rest}]) => [id, rest]));

// Everything on offer, category by category (a category keeps the order the pieces
// were captured in). `catalog`: {id: part} from ui-parts.json.
export function partList(catalog) {
  const all = [...Object.values(catalog ?? {}).filter(p => p?.name && CATEGORIES.includes(p.category)), ...SYNTHETIC];
  const rank = p => CATEGORIES.indexOf(p.category);
  return all.map((p, i) => ({p, i})).sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i).map(({p}) => p);
}
// [{category, items}] in category order, only the categories that have something.
export function groupParts(list) {
  return CATEGORIES.map(category => ({category, items: list.filter(p => p.category === category)})).filter(g => g.items.length);
}

// Every word typed has to start a word of the name (best), the category, the other
// names the library knows it by, or its keywords; the better the match, the higher
// it ranks. An empty search keeps everything.
export function searchParts(query, list) {
  const terms = termsOf(query);
  if (!terms.length) return list;
  const scored = [];
  list.forEach((part, order) => {
    const name = termsOf(part.name), rest = [...termsOf(part.category), ...termsOf(part.keywords ?? ''), ...(ELEMENTS[part.name] ?? []).flatMap(termsOf)];
    let score = 0;
    for (const term of terms) {
      const best = name.some(t => t.startsWith(term)) ? 3 : rest.some(t => t.startsWith(term)) ? 1 : 0;
      if (!best) return;
      score += best;
    }
    scored.push({part, order, score});
  });
  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map(s => s.part);
}

const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// (a piece may be cropped to the device it draws: `crop` {x, y, w, h} inside its w x h)
export const sizeOf = part => ({w: Math.round((part.crop?.w ?? part.w) * (part.k ?? 1)), h: Math.round((part.crop?.h ?? part.h) * (part.k ?? 1))});
export const sizeLabel = part => { const {w, h} = sizeOf(part); return `${w} × ${h}`; };
const centered = (w, h, nth) => { const off = (nth % 6) * 28; return {left: Math.max(0, Math.round((STAGE.w - w) / 2) + off), top: Math.max(0, Math.round((STAGE.h - h) / 2) + off)}; };

// The HTML of a piece with its root keyed `key`, placed at (left, top) and stacked at `z`
// (what is brought in sits above the frame's own things, each later one above the one before): a captured piece
// at the size it is drawn in the product, its stage's classes around it (if it had one)
// so its CSS still applies; the made ones from scratch.
export function partHtml(part, key, left, top, z = 20) {
  if (part.id === 'hand') return `<div class="dh-hand" data-sb-root="${key}" style="left:${left}px;top:${top}px;z-index:${z + 1};opacity:1;transform:none"><img src="/demo-hand.png" alt="" draggable="false"></div>`;
  if (part.id === 'spotlight') return `<div class="iq2-mark" data-sb-root="${key}" style="left:${left}px;top:${top}px;width:360px;height:140px;z-index:${z};opacity:1;transform:none"></div>`;
  if (part.id === 'speech-bubble') {
    const text = 'Your words here';
    return `<div class="iq-caption iq2-caption cb-caption" style="left:${left}px;top:${top}px;z-index:${z + 1};transform:translate(0%,-50%)" data-sb-root="${key}"><div class="adx-title adx-msg adx-script-text adx-lower-third"><p aria-label="${text}" style="zoom:1;width:max-content;max-width:none;margin-left:auto;margin-right:auto;opacity:1;transform:none"><span style="display:block;white-space:nowrap">${text}</span></p></div></div>`;
  }
  const ctx = part.ctx, k = part.k ?? 1, crop = part.crop;
  const attrs = `${ctx?.scene?.id ? ` data-scene="${ctx.scene.id}"` : ''}${ctx?.scene?.view ? ` data-view="${ctx.scene.view}"` : ''}`;
  return `<div data-sb-root="${key}" style="position:absolute;left:${left}px;top:${top}px;z-index:${z};width:${crop?.w ?? part.w}px;height:${crop?.h ?? part.h}px;${crop ? 'overflow:hidden;' : ''}transform:scale(${k});transform-origin:0 0"><div${ctx?.stageClass ? ` class="${ctx.stageClass}"${attrs}` : ''} data-sb-wrap style="position:absolute;left:${-(crop?.x ?? 0)}px;top:${-(crop?.y ?? 0)}px;width:${part.w}px;height:${part.h}px;transform:none;background:transparent;overflow:visible;cursor:default;pointer-events:none">${part.html}</div></div>`;
}

// What choosing the piece `id` adds to a frame: {inserts: [layer], library: {hash: html}}, or
// null when it is not in the catalog. `taken`: the keys the frame already has; `count`: how
// many things were brought in already (each lands a little lower than the last).
export function partInsert({id, catalog, taken = new Set(), count = 0}) {
  const part = SYNTHETIC.find(p => p.id === id) ?? catalog?.[id];
  if (!part) return null;
  let n = 1, key;
  do key = `p${n++}-${slug(part.name)}`; while (taken.has(key));
  const {w, h} = sizeOf(part), {left, top} = centered(w, h, count), z = 20 + 2 * count, html = partHtml(part, key, left, top, z), asset = hashString(html);
  const layer = id === 'speech-bubble' ? {kind: 'bubble', style: 'yellow', tip: [left - 110, top + 80], mode: 'words'} : {kind: 'dom'};
  return {inserts: [{key, name: part.name, asset, z, ...layer, box: {x: left, y: top, w, h}}], library: {[asset]: html}};
}
