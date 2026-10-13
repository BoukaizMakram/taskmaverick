// DOM helpers for the storyboard (/storyboard). A frame's layers are the demo's own
// HTML (captured by scripts/capture-storyboard.mjs): each layer's root has
// data-sb-root="<key>" and any element inside is addressed by `key/i.j.k`, the
// child indexes down from that root. Moving an asset sets its CSS `translate` and
// scaling it its CSS `scale` (both compose with the demo's own transform); a box (a
// picture, the spotlight) gets a new width and height; retyped words replace its text.
import {bubbleShape, bubbleStyle} from '@/lib/storyboardBubble.mjs';
import {isBackdrop, meets} from '@/lib/storyboardPick.mjs';
import {isGradient, paintCss} from '@/lib/storyboardPaint.mjs';

export const STAGE = 1600;
const SVG_NS = 'http://www.w3.org/2000/svg';
const ZWSP = String.fromCharCode(8203);
const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const parseStyle = text => {
  const out = {};
  for (const part of String(text || '').split(';')) { const i = part.indexOf(':'); if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim(); }
  return out;
};

// A frame's HTML can define ids (a mask, a gradient): make them its own, so two
// frames on the board never pick up each other's.
export function scopeIds(html, prefix) {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  let out = html;
  for (const id of ids) {
    const re = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`id="${re}"`, 'g'), `id="${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${re}\\)`, 'g'), `url(#${prefix}${id})`)
      .replace(new RegExp(`((?:xlink:)?href)="#${re}"`, 'g'), `$1="#${prefix}${id}"`);
  }
  return out;
}

// The stage's HTML for a frame: its layers in order. A chat bubble's shape goes
// just under its words, and the words say where the tail points and how much of
// the bubble to show (the shape is drawn by drawShape).
export function frameHtml(layers, htmlOf, prefix, bubbleMode) {
  const parts = layers.map(layer => {
    let html = htmlOf(layer.asset) ?? '';
    if (layer.kind !== 'bubble') return html;
    const part = (name, v) => (layer.tip && Number.isFinite(v) && v < 1 ? ` data-sb-${name}="${v}"` : ''); // a tail on its way out, or fading
    const attrs = ` data-sb-bubble="" data-sb-mode="${layer.mode ?? bubbleMode ?? 'words'}" data-sb-style="${layer.style || 'yellow'}"${layer.tip ? ` data-sb-tip="${layer.tip.join(',')}"` : ''}${part('reach', layer.reach)}${part('tail-opacity', layer.tailOpacity)}`;
    html = html.replace(`data-sb-root="${layer.key}"`, `data-sb-root="${layer.key}"${attrs}`);
    return `<svg class="sb-shape" data-sb-for="${layer.key}" viewBox="0 0 ${STAGE} 900" aria-hidden="true"${layer.z ? ` style="z-index:${layer.z}"` : ''}><g data-sb-shape="${layer.key}"></g></svg>${html}`;
  });
  return scopeIds(stillVideos(parts.join('')), prefix);
}

// ---- Videos are stills ----------------------------------------------------------------
// A frame holds the demos' <video>s paused on their first frame. Left as they are, each one keeps its file loaded, a decoder
// and a video layer of its own (60 of them on the board: the biggest part of what made it slow). A still is the same picture
// without any of that: the video says preload none, and its first frame is its poster, taken once per video file.
const stills = new Map(); // src -> the picture of its first frame (a blob url), or 'pending' while it is being made
const stillOf = src => { const still = stills.get(src); return still && still !== 'pending' ? still : ''; };
function stillVideos(html) {
  return html.replace(/<video\b([^>]*)>/gi, (tag, attrs) => {
    const clean = attrs.replace(/\s(?:preload|autoplay)(?:="[^"]*")?/gi, ''), src = /\ssrc="([^"]*)"/i.exec(clean)?.[1] ?? '';
    return `<video${clean}${!/\sposter=/i.test(clean) && stillOf(src) ? ` poster="${stillOf(src)}"` : ''} preload="none" data-sb-still="${src}">`;
  });
}
function makeStill(src) {
  stills.set(src, 'pending');
  const video = document.createElement('video');
  const done = url => {
    video.removeAttribute('src'); video.load();
    if (!url) { stills.delete(src); return; }
    stills.set(src, url);
    for (const el of document.querySelectorAll('video[data-sb-still]')) if (el.dataset.sbStill === src && !el.hasAttribute('poster')) el.setAttribute('poster', url);
  };
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  video.addEventListener('loadeddata', () => {
    try {
      const w = Math.min(960, video.videoWidth), canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = Math.round(w * video.videoHeight / video.videoWidth);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => done(blob ? URL.createObjectURL(blob) : null), 'image/jpeg', 0.9);
    } catch { done(null); }
  }, {once: true});
  video.addEventListener('error', () => done(null), {once: true});
  video.src = src;
}
// The videos of a drawn stage whose first frame is not made yet (they show nothing until it is).
function loadStills(stage) {
  for (const el of stage.querySelectorAll('video[data-sb-still]')) { const src = el.dataset.sbStill; if (src && !el.hasAttribute('poster') && !stills.has(src)) makeStill(src); }
}

// ---- Addressing ---------------------------------------------------------------
export function elementOf(stage, key) {
  const [layer, path = ''] = key.split('/');
  const root = stage.querySelector(`[data-sb-root="${CSS.escape(layer)}"]`);
  if (!root) return null;
  return path ? path.split('.').reduce((el, i) => el?.children[Number(i)] ?? null, root) : root;
}
export function keyOf(el) {
  const root = el.closest('[data-sb-root]');
  if (!root) return null;
  const path = [];
  for (let cur = el; cur !== root; cur = cur.parentElement) path.unshift([...cur.parentElement.children].indexOf(cur));
  return root.dataset.sbRoot + (path.length ? `/${path.join('.')}` : '');
}

// ---- Words --------------------------------------------------------------------
export const isWords = el => !!el?.matches?.('p[aria-label]');
export const linesOf = p => [...p.children].map(span => span.textContent.split(ZWSP).join('')).join(flows(p) ? ' ' : '\n');
// Words that flow as one text: in a chat box given a width, as they were captured (their lines were
// the demo's, made for its own width). Words you typed keep your lines (data-sb-typed).
export const flows = p => !!p.closest?.('[data-sb-fit]') && !p.hasAttribute('data-sb-typed');
export function setLines(p, text) {
  p.dataset.sbTyped = '';
  p.innerHTML = String(text).split('\n').map(line => `<span style="display:block;white-space:nowrap">${escape(line) || '&#8203;'}</span>`).join('');
}
const hasText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
// ---- Any text -------------------------------------------------------------------
// Every piece of text can be retyped. One that sits beside other things in its
// element (an icon, a badge) is addressed `key#n`: the n-th child node of the
// element at `key`.
const caretNode = (x, y) => document.caretPositionFromPoint?.(x, y)?.offsetNode ?? document.caretRangeFromPoint?.(x, y)?.startContainer ?? null;
const textNodes = el => [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
function nearestText(nodes, x, y) {
  let best = nodes[0], nearest = Infinity;
  for (const node of nodes) {
    const range = document.createRange(); range.selectNodeContents(node);
    const r = range.getBoundingClientRect(), d = Math.max(r.left - x, 0, x - r.right) + Math.max(r.top - y, 0, y - r.bottom);
    if (d < nearest) { nearest = d; best = node; }
  }
  return best;
}
const inside = (node, x, y, slack = 3) => {
  const range = document.createRange(); range.selectNodeContents(node);
  return [...range.getClientRects()].some(r => x >= r.left - slack && x <= r.right + slack && y >= r.top - slack && y <= r.bottom + slack);
};
// What `el` gives to retype: {el} (the words block, or an element holding only
// text) or {el, node} (a piece of text beside other things), else null. With a
// screen point (a double-click), a piece of text counts only if it is under it.
export function editTargetOf(el, x = null, y = null) {
  const block = el.closest?.('p[aria-label]');
  if (block) return {el: block};
  if (el.namespaceURI === SVG_NS) return null;
  if (!el.children.length) return el.textContent.trim() ? {el} : null;
  const texts = textNodes(el);
  if (!texts.length) return null;
  if (x == null) return {el, node: texts[0]};
  const at = caretNode(x, y), under = texts.filter(node => inside(node, x, y));
  return under.length ? {el, node: under.includes(at) ? at : nearestText(under, x, y)} : null;
}
// Something you cannot see through: a picture, or a background that is not clear.
function covers(el) {
  if (/^(IMG|VIDEO|CANVAS)$/.test(el.tagName)) return true;
  const c = getComputedStyle(el), color = c.backgroundColor;
  if (Number(c.opacity) < 0.6) return false;
  if (!color || color === 'transparent') return false;
  const alpha = /^rgba\(/.test(color) ? Number(color.split(',')[3]?.replace(')', '') ?? 1) : color.includes('/') ? Number(color.split('/')[1].replace(')', '')) : 1;
  return alpha > 0.6;
}
// The text a double-click at a screen point retypes: the topmost text under the
// pointer in `stage`, looking through what is clear (the demo's overlays, a
// shade) but not through what covers it.
export function editTargetAt(x, y, stage) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el === stage) break;
    if (!stage.contains(el) || !el.closest('[data-sb-root]') || el.closest('.sb-shape')) continue;
    const target = editTargetOf(el, x, y);
    if (target) return target;
    if (covers(el)) break;
  }
  return null;
}
export const targetKey = target => (target.node ? `${keyOf(target.el)}#${[...target.el.childNodes].indexOf(target.node)}` : keyOf(target.el));
export function targetOf(stage, key) {
  const [base, n] = key.split('#'), el = elementOf(stage, base);
  if (!el) return null;
  if (n == null) return {el};
  const node = el.childNodes[Number(n)];
  return node?.nodeType === 3 ? {el, node} : null;
}
// Every piece of text of an asset, in reading order (Tab goes to the next one).
export function textKeysOf(root) {
  const keys = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!node.textContent.trim() || !el || el.namespaceURI === SVG_NS) continue;
    const target = editTargetOf(el), key = target && targetKey(target.node ? {el, node} : target);
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

// What an asset's HTML says at `rest` ('' the asset itself, '/1.2' a part of it,
// '#0' or '/1.2#0' a piece of text), without drawing it; null when nothing is
// there. (To see whether a duplicate in another frame still says the same.)
const parsed = new Map();
export function textIn(html, layerKey, rest) {
  if (!html) return null;
  let template = parsed.get(html);
  if (!template) {
    template = document.createElement('template');
    template.innerHTML = html;
    if (parsed.size > 300) parsed.clear();
    parsed.set(html, template);
  }
  const [path, n] = rest.split('#');
  let el = template.content.querySelector(`[data-sb-root="${CSS.escape(layerKey)}"]`);
  for (const i of path ? path.slice(1).split('.') : []) el = el?.children[Number(i)] ?? null;
  if (!el) return null;
  if (n != null) { const node = el.childNodes[Number(n)]; return node?.nodeType === 3 ? node.textContent : null; }
  return isWords(el) ? linesOf(el) : el.textContent;
}

// ---- Geometry (stage px) --------------------------------------------------------
export const stageOf = el => el.closest('.sb-stage');
export const unitOf = stage => stage.getBoundingClientRect().width / STAGE;
export function boxOf(stage, el) {
  const S = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), u = S.width / STAGE;
  return {x: (r.left - S.left) / u, y: (r.top - S.top) / u, w: r.width / u, h: r.height / u};
}
// Screen px per css px in the space an element is laid out in (its parent's):
// the board's zoom and any scale the demo gave the parent.
export function parentScale(el) {
  const p = el.parentElement;
  return p && p.offsetWidth ? p.getBoundingClientRect().width / p.offsetWidth : 1;
}
export function translateOf(el) {
  const m = /(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?/.exec(el.style.translate || '');
  return m ? [Number(m[1]), Number(m[2] ?? 0)] : [0, 0];
}
export const moveTo = (el, [x, y]) => { el.style.translate = `${x}px ${y}px`; };

// ---- The timeline of a video ---------------------------------------------------------------
// The timeline of a video (a layer whose picture is a player bar) sits exactly on the bottom of the film it belongs to (the user, 2026-10-12: "from left to right of the video, with the
// same corner radius on the two bottom corners"): as wide as the film, flush with its bottom edge, its two bottom corners as round as the film's (the card the film is in clips it to
// that). It is drawn at the size it was made (`layer.box`) and scaled to the film's width, so what is in it keeps its proportions; what scale or move the layer was given (or the art
// filmed from further back) is not the one it is drawn at. Done on the board's frames and in the video the same, so they are one thing.
export function placeTimelines(stage, layers) {
  const film = stage.querySelector('.iq2-kb-film');
  if (!film) return;
  for (const layer of layers) {
    const root = stage.querySelector(`[data-sb-root="${CSS.escape(layer.key)}"]`);
    if (!root) continue;
    const W = layer.box?.w || 345, H = layer.box?.h || 38, f = film.getBoundingClientRect(), box = stage.getBoundingClientRect(), k = box.width / (stage.offsetWidth || 1), s = f.width / k / W, h = H * s;
    const card = film.closest('.iq-kb-card'), cs = card && getComputedStyle(card), ck = card ? card.getBoundingClientRect().width / (card.offsetWidth || 1) : 1; // (client px to a card's own px)
    const radius = cs ? Math.max(0, parseFloat(cs.borderBottomLeftRadius) - (parseFloat(cs.borderBottomWidth) || 0)) * ck / k : 0; // (stage px: what the card clips the film's corners to)
    Object.assign(root.style, {left: `${(f.left - box.left) / k}px`, top: `${(f.bottom - box.top) / k - h}px`, width: `${W}px`, height: `${H}px`, transformOrigin: '0 0', scale: String(s), translate: ''});
    if (root.firstElementChild) root.firstElementChild.style.borderRadius = `0 0 ${radius / s}px ${radius / s}px`;
  }
}

// ---- Scale --------------------------------------------------------------------------
export function scaleOf(el) {
  const m = /^(-?[\d.]+)(?:\s+(-?[\d.]+))?/.exec(el.style.scale || '');
  return m ? [Number(m[1]), Number(m[2] ?? m[1])] : [1, 1];
}
export const scaleTo = (el, [sx, sy]) => { el.style.scale = Math.abs(sx - 1) < 0.0005 && Math.abs(sy - 1) < 0.0005 ? '' : `${sx} ${sy}`; };
// A box's size, css px. The chat bubble's is the size of its yellow box (stage px), kept
// on its words (data-sb-size): its words are never scaled. Given a width, its words wrap to
// it (the next line when the box gets narrower; data-sb-fit, Storyboard.css) and the box is as
// tall as they are, or as tall as it was given if that is more (a height of 0: as tall as its words).
export const sizeOf = el => (el.hasAttribute('data-sb-bubble') ? (b => [b.w, b.h])(bubbleBoxOf(stageOf(el), el)) : [parseFloat(el.style.width) || el.offsetWidth, parseFloat(el.style.height) || el.offsetHeight]);
export function sizeTo(el, [w, h]) {
  if (!el.hasAttribute('data-sb-bubble')) { if (w) el.style.width = `${w}px`; if (h) el.style.height = `${h}px`; return; }
  el.dataset.sbSize = `${w},${h}`;
  const inner = w ? Math.max(1, w - 2 * bubbleStyle(el.dataset.sbStyle).pad[0]) : 0;
  if (inner) { el.dataset.sbFit = ''; el.style.setProperty('--sb-fit', `${inner}px`); } else { delete el.dataset.sbFit; el.style.removeProperty('--sb-fit'); }
}
// How an asset is resized by its handles. A box (a picture, a drawing, the spotlight,
// the chat bubble) gets a new width and height ('size'); anything else is scaled
// ('scale'). A UI element always keeps its proportions (free: false). The chat bubble
// and the spotlight stretch any way (Shift keeps the proportions); a picture or a
// drawing keeps them unless Shift is held (keep: true).
export function resizeKind(el) {
  const box = el.dataset?.sbBox || (el.hasAttribute?.('data-sb-root') && el.classList.contains('iq2-mark') ? 'spotlight' : '');
  if (box === 'image' || box === 'drawing') return {mode: 'size', free: true, keep: true};
  if (box) return {mode: 'size', free: true, keep: false};
  if (el.hasAttribute?.('data-sb-bubble')) return {mode: 'size', free: true, keep: false, bubble: true};
  return {mode: 'scale', free: false, keep: true};
}
// Where an asset is on screen, as its handles see it: the chat bubble by its yellow box.
export function screenRectOf(el) {
  if (!el.hasAttribute('data-sb-bubble')) return el.getBoundingClientRect();
  const stage = stageOf(el), S = stage.getBoundingClientRect(), u = S.width / STAGE, b = bubbleBoxOf(stage, el);
  const left = S.left + b.x * u, top = S.top + b.y * u, width = b.w * u, height = b.h * u;
  return {left, top, width, height, right: left + width, bottom: top + height};
}

// ---- The chat bubbles ---------------------------------------------------------------
export const isBubble = el => !!el?.hasAttribute?.('data-sb-bubble');
// Where a bubble's tail points now (stage px): where it was captured, plus any
// move of it (`override` = {key, delta} while it is being dragged).
export function tipOf(words, edit, override = null) {
  if (!words.dataset.sbTip || words.hasAttribute('data-sb-no-tail')) return null; // (its tail taken off: none)
  // (`override`: {key, delta} for one bubble, or {key: delta} for several)
  const key = words.dataset.sbRoot, d = (override && (override.key === key ? override.delta : override[key])) || edit?.tips?.[key] || [0, 0];
  const [x, y] = words.dataset.sbTip.split(',').map(Number);
  return {x: x + d[0], y: y + d[1]};
}
// Whether a bubble's tail is off: its point was dragged inside its box. It stays off,
// and the point goes along with the box, until the point is dragged out again.
export function tailOff(stage, words, edit, override = null) {
  const t = tipOf(words, edit, override);
  if (!t) return false;
  const b = bubbleBoxOf(stage, words);
  return t.x >= b.x && t.x <= b.x + b.w && t.y >= b.y && t.y <= b.y + b.h;
}
// How far a bubble's tail point has to be moved (from where it was captured) to be the middle of its box.
export function tipToMiddle(stage, words) {
  const b = bubbleBoxOf(stage, words), [x, y] = words.dataset.sbTip.split(',').map(Number);
  return [b.x + b.w / 2 - x, b.y + b.h / 2 - y];
}
// A chat bubble's yellow box (its body, without the tail), stage px: around its words,
// or the size it was given (data-sb-size; never smaller than its words), its words in
// the middle. (A bubble scaled before boxes had a size of their own keeps that: data-sb-grow.)
export function bubbleBoxOf(stage, words) {
  const p = words.querySelector('p') ?? words, S = stage.getBoundingClientRect(), u = S.width / STAGE, r = p.getBoundingClientRect();
  const [px, py] = bubbleStyle(words.dataset.sbStyle).pad;
  const text = {x: (r.left - S.left) / u, y: (r.top - S.top) / u, w: r.width / u, h: r.height / u};
  const own = [text.w + 2 * px, text.h + 2 * py], given = words.dataset.sbSize?.split(',').map(Number), grow = words.dataset.sbGrow?.split(',').map(Number);
  const w = Math.max(own[0], given?.[0] || own[0] * (grow?.[0] || 1)), h = Math.max(own[1], given?.[1] || own[1] * (grow?.[1] || 1));
  return {x: text.x + text.w / 2 - w / 2, y: text.y + text.h / 2 - h / 2, w, h, pad: [px, py]};
}
// Draws every bubble's shape around its words and onto its tail's point; called
// whenever the words, a bubble or a tail move.
export function drawShape(stage, edit, override = null) {
  for (const words of stage.querySelectorAll('[data-sb-bubble]')) {
    const key = words.dataset.sbRoot, g = stage.querySelector(`[data-sb-shape="${CSS.escape(key)}"]`), p = words.querySelector('p');
    if (!g || !p) continue;
    const box = bubbleBoxOf(stage, words);
    const rect = {x: box.x + box.pad[0], y: box.y + box.pad[1], w: box.w - 2 * box.pad[0], h: box.h - 2 * box.pad[1]};
    const mode = words.dataset.sbMode, style = words.dataset.sbStyle;
    const reach = Number(words.dataset.sbReach ?? 1), tailOpacity = Number(words.dataset.sbTailOpacity ?? 1);
    let {svg} = bubbleShape({style, rect, tip: tipOf(words, edit, override), mode, reach, tailOpacity});
    // the inspector's fill, stroke and opacity for a bubble go on its shape (applyStyle)
    const look = bubbleStyle(style), {sbFill: fill, sbStroke: stroke, sbStrokeWidth: width} = words.dataset;
    if (fill) svg = svg.split(`fill="${look.fill}"`).join(`fill="${fill}"`);
    if (stroke) svg = svg.split(`stroke="${look.stroke}"`).join(`stroke="${stroke}"`);
    if (width) svg = svg.split(`stroke-width="${look.sw * 2}"`).join(`stroke-width="${Number(width) * 2}"`);
    g.innerHTML = svg;
    g.style.opacity = words.style.opacity || '';
    const blur = Number(words.dataset.sbBlur) || 0; // the sidebar's layer blur blurs the shape with its words
    g.style.filter = svg ? `drop-shadow(${bubbleStyle(style).shadow})${blur ? ` blur(${blur}px)` : ''}` : 'none';
    words.style.visibility = mode === 'words' ? 'visible' : 'hidden';
  }
}

// ---- Styles: what the inspector sets (like Figma's design panel; lib/storyboardEdits.mjs STYLE_KEYS) ----
// On the asset itself: opacity, rotation, corners, fill, stroke, a drop shadow, a layer blur and a
// background blur. Only what is set is put on: the asset keeps everything else it had (the frame is
// drawn again from its HTML before its styles are put on, so nothing has to be taken off). Text styles reach
// every text in it (as Figma does for a selection), through attributes Storyboard.css reads. A
// chat bubble's fill and stroke go on its shape (drawShape); it is not rotated (its shape is drawn apart).
export const FONT_STACK = {patrickhand: 'var(--font-patrickhand), "Patrick Hand", "Segoe Script", cursive', indieflower: 'var(--font-indieflower), "Indie Flower", "Segoe Script", cursive', shadowsintolight: 'var(--font-shadowsintolight), "Shadows Into Light", "Segoe Script", cursive', reeniebeanie: 'var(--font-reeniebeanie), "Reenie Beanie", "Segoe Script", cursive', dancingscript: 'var(--font-dancingscript), "Dancing Script", "Segoe Script", cursive', permanentmarker: 'var(--font-permanentmarker), "Permanent Marker", "Segoe Script", cursive', homemadeapple: 'var(--font-homemadeapple), "Homemade Apple", "Segoe Script", cursive', nanumpen: 'var(--font-nanumpen), "Nanum Pen Script", "Segoe Script", cursive', gloria: 'var(--font-gloria), "Gloria Hallelujah", "Segoe Script", cursive', coveredbygrace: 'var(--font-coveredbygrace), "Covered By Your Grace", "Segoe Script", cursive', zeyada: 'var(--font-zeyada), "Zeyada", "Segoe Script", cursive', sacramento: 'var(--font-sacramento), "Sacramento", "Segoe Script", cursive', playfair: 'var(--font-playfair), "Playfair Display", Georgia, serif', fraunces: 'var(--font-fraunces), Fraunces, Georgia, serif', dmsans: 'var(--font-dmsans), "DM Sans", system-ui, sans-serif', sora: 'var(--font-sora), Sora, system-ui, sans-serif', spacegrotesk: 'var(--font-spacegrotesk), "Space Grotesk", system-ui, sans-serif', manrope: 'var(--font-manrope), Manrope, system-ui, sans-serif', caveat: 'var(--font-caveat), Caveat, "Segoe Script", cursive', kalam: 'var(--font-kalam), Kalam, "Segoe Print", cursive', inter: 'var(--font-inter), Inter, sans-serif', montserrat: 'var(--font-montserrat), Montserrat, sans-serif', poppins: 'var(--font-poppins), Poppins, sans-serif'};
// Which of our fonts a computed font-family is (next/font puts the family's name in its own hashed one).
const FONT_MATCH = [['playfair', /playfair/i], ['fraunces', /fraunces/i], ['dmsans', /dm[ _]sans/i], ['sora', /sora/i], ['spacegrotesk', /space[ _]grotesk/i], ['manrope', /manrope/i], ['caveat', /caveat/i], ['kalam', /kalam/i], ['patrickhand', /patrick/i], ['indieflower', /indie[ _]flower/i], ['shadowsintolight', /shadows[ _]into/i], ['reeniebeanie', /reenie/i], ['dancingscript', /dancing[ _]script/i], ['permanentmarker', /permanent[ _]marker/i], ['homemadeapple', /homemade/i], ['nanumpen', /nanum/i], ['gloria', /gloria/i], ['coveredbygrace', /covered[ _]by/i], ['zeyada', /zeyada/i], ['sacramento', /sacramento/i], ['montserrat', /montserrat/i], ['poppins', /poppins/i], ['inter', /inter/i]];
export const fontIdOf = family => FONT_MATCH.find(([, pattern]) => pattern.test(family ?? ''))?.[0] ?? null;
export const SHADOW = 'drop-shadow(0 8px 16px rgb(0 0 0 / 30%))';
export function applyStyle(el, s = {}) {
  const set = (name, value) => { if (value != null) el.style.setProperty(name, value); };
  const filters = (...own) => { const mine = own.filter(Boolean), had = el.style.filter && el.style.filter !== 'none' ? el.style.filter : ''; return mine.length ? [had, ...mine].filter(Boolean).join(' ') : null; };
  const bubble = isBubble(el);
  set('opacity', s.opacity != null ? String(s.opacity) : null);
  if (bubble) {
    for (const [key, value] of [['sbFill', isGradient(s.fill) ? null : s.fill], ['sbStroke', s.stroke], ['sbStrokeWidth', s.strokeWidth], ['sbBlur', s.blur]]) if (value == null) delete el.dataset[key]; else el.dataset[key] = String(value);
    set('filter', filters(s.blur ? `blur(${s.blur}px)` : '')); // (its words; drawShape blurs its shape)
  } else {
    set('rotate', s.rotate ? `${s.rotate}deg` : null);
    set('border-radius', s.radius != null ? `${s.radius}px` : null);
    set('background-color', s.fill == null || isGradient(s.fill) ? null : s.fill);
    set('background', isGradient(s.fill) ? paintCss(s.fill) : null); // a gradient fill (the Metal plate, ...)
    const stroked = s.stroke != null || s.strokeWidth != null;
    set('border-style', stroked ? 'solid' : null);
    set('border-color', stroked ? s.stroke ?? 'currentColor' : null);
    set('border-width', stroked ? `${s.strokeWidth ?? 1}px` : null);
    set('filter', filters(s.shadow ? SHADOW : '', s.blur ? `blur(${s.blur}px)` : ''));
    set('backdrop-filter', s.bgBlur ? `blur(${s.bgBlur}px)` : null);
    set('-webkit-backdrop-filter', s.bgBlur ? `blur(${s.bgBlur}px)` : null);
  }
  const text = (attr, name, value) => { if (value == null) { delete el.dataset[attr]; el.style.removeProperty(name); } else { el.dataset[attr] = ''; el.style.setProperty(name, value); } };
  // an iPad's frame (the device photo) in another color: the tablets in it get a tint (Storyboard.css, [data-sb-bezel])
  if (s.bezel) for (const device of [...(el.matches?.('.tbl-tablet') ? [el] : []), ...(el.querySelectorAll?.('.tbl-tablet') ?? [])]) { device.setAttribute('data-sb-bezel', isGradient(s.bezel) ? 'paint' : ''); device.style.setProperty('--sb-bezel', paintCss(s.bezel)); if (s.bezel.flat) device.setAttribute('data-sb-flat', ''); }
  if (s.bezel && isGradient(s.bezel) && s.bezel.edge) for (const device of [...(el.matches?.('.tbl-tablet') ? [el] : []), ...(el.querySelectorAll?.('.tbl-tablet') ?? [])]) addRim(device);
  text('sbColor', '--sb-color', s.color ?? null);
  text('sbFont', '--sb-font', s.font ? FONT_STACK[s.font] : null);
  text('sbFontSize', '--sb-font-size', s.size ? `${s.size}px` : null);
  text('sbWeight', '--sb-weight', s.weight ? String(s.weight) : null);
  text('sbAlign', '--sb-align', s.align ?? null);
  text('sbLine', '--sb-line', s.lineHeight ? `${s.lineHeight}px` : null);
  text('sbSpacing', '--sb-spacing', s.letterSpacing != null ? `${s.letterSpacing}px` : null);
}
// The Scale tool (K) puts the text numbers it scales on an asset while a handle is dragged (the same
// attributes applyStyle sets for the sidebar's fields, which the committed styles then set again): the font
// size, the line height and the letter spacing, px. A number left out is left as it is.
export function setTextNumbers(el, {size, lineHeight, letterSpacing}) {
  const put = (attr, name, value) => { if (value == null) return; el.dataset[attr] = ''; el.style.setProperty(name, `${value}px`); };
  put('sbFontSize', '--sb-font-size', size);
  put('sbLine', '--sb-line', lineHeight);
  put('sbSpacing', '--sb-spacing', letterSpacing);
}
// The padding of a chat box (stage px, [x, y]): what its style gives it round its words.
export const bubblePad = el => bubbleStyle(el.dataset.sbStyle).pad;
// The thin polished-metal line round an iPad's frame (a paint with `edge`): bright silver with a streak of light
// along the top, and a dark hairline inside it, like the metal edge of the glass. Drawn on the frame's outline
// (the photo's body x 47-1235, y 22-874 of 1285 x 896, corners of 36); last in the iPad, so the screen keeps its place.
let rims = 0;
function addRim(device) {
  device.querySelector(':scope > .sb-bezel-rim')?.remove();
  const id = `sbrim${++rims}`, rr = (inset, r) => `M${47 + inset + r} ${22 + inset}H${1235 - inset - r}A${r} ${r} 0 0 1 ${1235 - inset} ${22 + inset + r}V${874 - inset - r}A${r} ${r} 0 0 1 ${1235 - inset - r} ${874 - inset}H${47 + inset + r}A${r} ${r} 0 0 1 ${47 + inset} ${874 - inset - r}V${22 + inset + r}A${r} ${r} 0 0 1 ${47 + inset + r} ${22 + inset}Z`;
  device.insertAdjacentHTML('beforeend', `<i class="sb-bezel-rim" aria-hidden="true"><svg viewBox="0 0 1285 896" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0.18"><stop offset="0" stop-color="#8d949c"/><stop offset=".18" stop-color="#d9dde2"/><stop offset=".42" stop-color="#b5bbc2"/><stop offset=".62" stop-color="#ffffff"/><stop offset=".8" stop-color="#c3c8ce"/><stop offset="1" stop-color="#7e868f"/></linearGradient></defs><path d="${rr(1.6, 34.4)}" fill="none" stroke="url(#${id})" stroke-width="3.2"/><path d="${rr(3.9, 32.1)}" fill="none" stroke="rgb(0 0 0 / 60%)" stroke-width="1.6"/></svg></i>`);
}

// What an asset shows now, for the inspector: what the page computes (its first text for the
// text styles; a chat bubble's fill and stroke are its shape's).
export function lookOf(el) {
  const cs = getComputedStyle(el), texts = [el, ...(el.querySelectorAll?.('*') ?? [])].filter(n => n.namespaceURI !== SVG_NS && hasText(n)), ts = getComputedStyle(texts[0] ?? el);
  const stroked = cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0;
  const look = {opacity: Number(cs.opacity), rotate: parseFloat(el.style.rotate) || 0, radius: parseFloat(cs.borderTopLeftRadius) || 0, fill: cs.backgroundColor, stroke: stroked ? cs.borderTopColor : null, strokeWidth: stroked ? parseFloat(cs.borderTopWidth) : 0, shadow: cs.filter.includes('drop-shadow'),
    color: ts.color, font: fontIdOf(ts.fontFamily), size: parseFloat(ts.fontSize) || 0, weight: Number(ts.fontWeight) || 400,
    align: ts.textAlign === 'start' ? 'left' : ts.textAlign === 'end' ? 'right' : ts.textAlign, lineHeight: parseFloat(ts.lineHeight) || null, letterSpacing: parseFloat(ts.letterSpacing) || 0, text: texts.length > 0};
  if (!isBubble(el)) return look;
  const b = bubbleStyle(el.dataset.sbStyle);
  return {...look, fill: el.dataset.sbFill ?? b.fill, stroke: el.dataset.sbStroke ?? b.stroke, strokeWidth: Number(el.dataset.sbStrokeWidth ?? b.sw), radius: b.radius, shadow: true};
}
// An asset's box in its frame (stage px); a chat bubble's is its yellow box.
export function stageBoxOf(stage, el) {
  const S = stage.getBoundingClientRect(), r = screenRectOf(el), u = S.width / STAGE;
  return {x: (r.left - S.left) / u, y: (r.top - S.top) / u, w: r.width / u, h: r.height / u};
}

// The fonts the frame's styles use are loaded on demand (a font nobody used yet is not fetched): once they
// are in, `then` runs (the chat boxes' shapes are drawn again around their words as the new font sets them).
// No font to wait for: nothing runs.
export function whenFontsLoaded(edit, then) {
  const names = [...new Set(Object.values(edit?.styles ?? {}).map(s => s?.font).filter(Boolean))].map(id => FONT_NAMES[id]).filter(Boolean);
  if (!names.length || !document.fonts?.load) return;
  if (names.every(name => { try { return document.fonts.check(`24px "${name}"`); } catch { return false; } })) return; // (all in already: what was just drawn was drawn with them, and drawing it again — a measure of every chat box, the video's picture drawn twice — changes nothing)
  Promise.all(names.map(name => document.fonts.load(`24px "${name}"`).catch(() => []))).then(() => then());
}
const FONT_NAMES = {patrickhand: 'Patrick Hand', indieflower: 'Indie Flower', shadowsintolight: 'Shadows Into Light', reeniebeanie: 'Reenie Beanie', dancingscript: 'Dancing Script', permanentmarker: 'Permanent Marker', homemadeapple: 'Homemade Apple', nanumpen: 'Nanum Pen Script', gloria: 'Gloria Hallelujah', coveredbygrace: 'Covered By Your Grace', zeyada: 'Zeyada', sacramento: 'Sacramento', playfair: 'Playfair Display', fraunces: 'Fraunces', dmsans: 'DM Sans', sora: 'Sora', spacegrotesk: 'Space Grotesk', manrope: 'Manrope', caveat: 'Caveat', kalam: 'Kalam', inter: 'Inter', montserrat: 'Montserrat', poppins: 'Poppins'};

// A layer's place in the stacking. A z-index only counts on a positioned layer: one that is not (a demo's
// plain block) but has a transform, a move or a scale on it is stacked like a positioned one (and nothing
// else changes: `relative` with no offset leaves it where it is, and a transform already made it the
// containing block of what is placed inside it), so a layer sent behind another really goes behind it.
function stack(el, z) {
  el.style.zIndex = String(z);
  const cs = getComputedStyle(el);
  if (cs.position === 'static' && (cs.transform !== 'none' || cs.translate !== 'none' || cs.scale !== 'none')) el.style.position = 'relative';
}

// Puts a frame's saved changes on its freshly drawn stage.
export function applyEdits(stage, edit) {
  for (const [key, delta] of Object.entries(edit?.moves ?? {})) { const el = elementOf(stage, key); if (el) moveTo(el, delta); }
  for (const [key, size] of Object.entries(edit?.sizes ?? {})) { const el = elementOf(stage, key); if (el) sizeTo(el, size); }
  for (const [key, scale] of Object.entries(edit?.scales ?? {})) {
    const el = elementOf(stage, key);
    if (!el) continue;
    if (el.hasAttribute('data-sb-bubble')) el.dataset.sbGrow = scale.join(','); else scaleTo(el, scale); // a chat bubble's words are never scaled: its box grows
  }
  for (const [key, style] of Object.entries(edit?.styles ?? {})) { const el = elementOf(stage, key); if (el) applyStyle(el, style); }
  for (const [key, b] of Object.entries(edit?.bubbles ?? {})) { // a chat box: its tail off, its words shown or hidden
    const el = elementOf(stage, key);
    if (!el || !isBubble(el)) continue;
    if (b.tail === false) el.dataset.sbNoTail = '';
    if (b.words === true) el.dataset.sbMode = 'words';
    else if (b.words === false && el.dataset.sbMode === 'words') el.dataset.sbMode = 'empty';
  }
  for (const [key, text] of Object.entries(edit?.texts ?? {})) {
    if (key.includes('#')) { const node = targetOf(stage, key)?.node; if (node) node.textContent = text; continue; } // a piece of text beside other things
    const el = elementOf(stage, key);
    if (!el) continue;
    if (isWords(el)) setLines(el, text); else el.textContent = text;
  }
  stage.style.background = edit?.background ? paintCss(edit.background) : ''; // the frame's own background
  if (edit?.order?.length) { // the stacking you gave the assets: each one's place by its order in the frame (a chat box's words just above its shape)
    let i = 0;
    for (const root of stage.querySelectorAll('[data-sb-root]')) {
      if (root.parentElement?.closest('[data-sb-root]')) continue;
      const z = 20 + 2 * i++;
      stack(root, root.hasAttribute('data-sb-bubble') ? z + 1 : z);
      let outer = root; // a captured layer sits inside the demo's camera (a wrapper that is itself a layer of the stage): that wrapper is what is stacked among the others
      while (outer.parentElement && outer.parentElement !== stage) outer = outer.parentElement;
      if (outer !== root && outer.parentElement === stage) stack(outer, z);
      const shape = stage.querySelector(`svg.sb-shape[data-sb-for="${CSS.escape(root.dataset.sbRoot)}"]`);
      if (shape) shape.style.zIndex = String(z);
    }
  }
  loadStills(stage);
  drawShape(stage, edit);
}

// ---- Picking a color ------------------------------------------------------------------
const solid = color => { const m = /^rgba?\(([^)]+)\)/.exec(color || ''); if (!m) return false; const parts = m[1].split(/[\s,/]+/).filter(Boolean); return parts.length < 4 || Number(parts[3]) > 0.5; };
function pixelOf(img, x, y) {
  try {
    const r = img.getBoundingClientRect(), canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const g = canvas.getContext('2d');
    g.drawImage(img, (x - r.left) / r.width * img.naturalWidth, (y - r.top) / r.height * img.naturalHeight, 1, 1, 0, 0, 1, 1);
    const [red, green, blue, alpha] = g.getImageData(0, 0, 1, 1).data;
    return alpha > 127 ? `rgb(${red}, ${green}, ${blue})` : null;
  } catch { return null; }
}
// Whether an element shows at all (a faded-out shade of the demo does not).
function shown(el) {
  let opacity = 1;
  for (let cur = el; cur && cur.nodeType === 1 && !cur.classList.contains('sb-art'); cur = cur.parentElement) {
    const style = getComputedStyle(cur);
    if (style.visibility === 'hidden') return false;
    opacity *= Number(style.opacity);
  }
  return opacity > 0.5;
}
// The color under a screen point (Alt with the pencil), as the page computes it: the
// color of the text there, a picture's pixel, a shape's stroke or fill, else the first
// background that is not clear. null: nothing to pick.
export function colorAt(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest?.('.sb-overlay, [data-sb-ui]') || !shown(el)) continue;
    if (el.tagName === 'IMG') { const color = pixelOf(el, x, y); if (color) return color; continue; }
    const style = getComputedStyle(el);
    if (el.namespaceURI === SVG_NS) { const paint = [style.fill, style.stroke].find(solid); if (paint) return paint; continue; }
    if (textNodes(el).some(node => inside(node, x, y, 1)) && solid(style.color)) return style.color;
    if (solid(style.backgroundColor)) return style.backgroundColor;
  }
  return null;
}

// ---- Hit testing and levels ---------------------------------------------------------
// What is under a screen point: the stage it is in, and the element (null on the
// frame's empty background). The chat bubble's shape counts as the bubble.
export function hitAt(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    const stage = el.closest?.('.sb-stage');
    if (!stage || !stage.closest('[data-frame]')) continue; // (the video's stages are not a frame)
    if (el === stage) return {stage, el: null};
    const shape = el.closest('.sb-shape');
    const target = shape ? stage.querySelector(`[data-sb-root="${CSS.escape(shape.dataset.sbFor)}"]`) : el;
    if (target?.closest('[data-sb-root]')) return {stage, el: target};
  }
  return null;
}

// Every layer under a screen point, the one on top first: for each element there, the deepest
// thing you can select on the way down to it (chainOf), each one once. A click again at the same
// place goes down this list. {stage, layers: [{el, key}]}; no layers on the frame's empty background.
export function layersAt(x, y) {
  const first = hitAt(x, y);
  if (!first) return {stage: null, layers: []};
  const {stage} = first, seen = new Set(), layers = [];
  for (const node of document.elementsFromPoint(x, y)) {
    if (node === stage || !stage.contains(node)) continue;
    const shape = node.closest?.('.sb-shape'), el = shape ? stage.querySelector(`[data-sb-root="${CSS.escape(shape.dataset.sbFor)}"]`) : node;
    if (!el?.closest('[data-sb-root]')) continue;
    const chain = chainOf(el), level = chain.at(-1);
    if (!level) continue;
    const key = keyOf(level);
    if (seen.has(key)) continue;
    seen.add(key);
    layers.push({el: level, key});
  }
  return {stage, layers};
}

// The assets of `stage` (the whole ones, not their parts) that a screen rectangle {left, top,
// right, bottom} touches, in the order they are drawn. The ones as big as the frame (a dim, a
// backdrop) and the ones nobody can see are left out. -> keys
export function assetsIn(stage, rect) {
  const S = stage.getBoundingClientRect(), keys = [];
  for (const el of stage.querySelectorAll('[data-sb-root]')) {
    if (el.parentElement?.closest('[data-sb-root]')) continue;
    const style = getComputedStyle(el);
    if (!isBubble(el) && (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) <= 0.05)) continue;
    const box = visibleBox(el);
    if (!box || isBackdrop(box, S) || !meets(rect, box)) continue;
    keys.push(el.dataset.sbRoot);
  }
  return keys;
}
// Where an asset shows: its own box, or, a holder with no size of its own (the demo's row of cards), the
// box around what is in it that shows. null when nothing shows.
function visibleBox(el) {
  const r = screenRectOf(el);
  if (r.width >= 1 && r.height >= 1) return {left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height};
  let box = null;
  for (const child of el.querySelectorAll('*')) {
    const c = child.getBoundingClientRect();
    if (c.width < 1 || c.height < 1 || getComputedStyle(child).visibility === 'hidden') continue;
    box = box ? {left: Math.min(box.left, c.left), top: Math.min(box.top, c.top), right: Math.max(box.right, c.right), bottom: Math.max(box.bottom, c.bottom)} : {left: c.left, top: c.top, right: c.right, bottom: c.bottom};
  }
  return box;
}

// The things you can select on the way down to `el`, outermost first (like
// Figma's groups: click selects the outer one, double-click goes one level in).
// A wrapper that is the same box as its parent is not a level of its own.
export function chainOf(el) {
  const root = el.closest('[data-sb-root]');
  if (!root) return [];
  if (isBubble(root)) return [root];
  const down = [];
  for (let cur = el; cur; cur = cur.parentElement) { down.unshift(cur); if (cur === root) break; }
  const u = unitOf(stageOf(root)), chain = [root];
  let last = root;
  for (const cur of down.slice(1)) {
    if (cur.namespaceURI === SVG_NS && cur.tagName !== 'svg') break;
    if (cur.hasAttribute('data-sb-wrap')) continue; // the stage around a piece brought in: not a level
    const a = cur.getBoundingClientRect(), b = last.getBoundingClientRect();
    const apart = Math.abs(a.left - b.left) + Math.abs(a.top - b.top) + Math.abs(a.width - b.width) + Math.abs(a.height - b.height);
    if (apart > 3 * u || hasText(cur) || cur.tagName === 'IMG') { chain.push(cur); last = cur; }
  }
  return chain;
}

// Names for the demo's parts, for the inspector (anything else: its text, or its class).
const FRIENDLY = {
  'iq2-m-head': 'Mission header', 'iq2-m-back': 'Back button', 'iq2-m-translate': 'Translate button', 'iq2-m-window': 'Mission window', 'iq2-m-content': 'Mission content',
  'iq2-m-summary': 'Mission card', 'iq2-m-kind': 'Type and timer', 'iq2-m-meta': 'Performer and date', 'iq2-m-brief': 'Instructions block', 'iq2-m-alert': 'Alert', 'iq2-m-link': 'Link',
  'iq2-m-group': 'Checklist header', 'iq2-m-cp': 'Checkpoint', 'iq2-m-options': 'Yes / No', 'iq2-m-tile': 'Training tile', 'iq2-m-thumb': 'Video thumbnail', 'iq2-m-player': 'Video', 'iq2-m-quiz': 'Quiz', 'iq2-m-submit': 'Submit',
  chip: 'Mission chip', 'chip-top': 'Chip top', 'chip-title': 'Chip title', 'chip-pill': 'Timer', 'chip-exec': 'Execution timer', 'chip-who': 'Performer', 'chip-date': 'Date', 'chip-rate': 'Rate', 'chip-rating': 'Rating', 'chip-points': 'Points', 'chip-kind': 'Type', 'chip-timers': 'Timers', 'chip-bottom': 'Chip bottom',
  'tbl-header': 'Header', 'tbl-tab': 'Column', 'tbl-tablet': 'Tablet', 'bn-menu': 'Menu', 'bn-menu-item': 'Menu item',
  'iq-ur-topbar': 'Report bar', 'iq-ur-row': 'Report row', 'iq-ur-stat': 'Statistic', 'iq-ur-person': 'Person', 'iq-ur-mission': 'Mission', 'iq-ur-question': 'Question', 'iq-ur-proof': 'Proof', 'iq-ur-images': 'Photos',
};
// A readable name for the inspector.
export function nameOf(el, layerName) {
  if (el.dataset?.sbRoot) return layerName ?? el.dataset.sbRoot;
  const classes = String(el.className?.baseVal ?? el.className ?? '').split(' ').filter(Boolean);
  const known = classes.map(c => FRIENDLY[c]).find(Boolean);
  const text = hasText(el) ? el.textContent.trim().replace(/\s+/g, ' ') : '';
  const quoted = text ? `“${text.length > 26 ? `${text.slice(0, 26)}…` : text}”` : '';
  if (quoted && (!known || !el.children.length)) return quoted;
  if (known) return known;
  return classes[0] ? classes[0].replace(/^[a-z0-9]+-/, '').replace(/[-_]+/g, ' ') : el.tagName.toLowerCase();
}
