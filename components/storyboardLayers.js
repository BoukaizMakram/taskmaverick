// Draws the layers of a video (lib/storyboardLayers.mjs: shapes, texts, images, with keyframes) over its picture, in every player of it (the board's, a
// cell's, the video editor's). `root` is a 1600 x 900 box over the video's screen (`.sb-pl-layers`). Called each picture with the video's time: an element is
// made once per layer and only its place, size, turn and opacity change with the time; it is made again only when the layer's look changed.
import {paintCss} from '@/lib/storyboardPaint.mjs';
import {fxCss, isInSpan, isShownAt, valuesAt} from '@/lib/storyboardLayers.mjs';
import {chainSegments, hitPath, parsePolylineD, pathMarkup, simplify} from '@/lib/storyboardPaths.mjs';
import {FONT_STACK, STAGE, lineName} from './storyboardDom';

const lookOf = l => JSON.stringify([l.kind, l.fill, l.stroke, l.strokeWidth, l.radius, l.text, l.font, l.size, l.weight, l.color, l.align, l.src, l.blend, l.points, l.closed, l.pw, l.ph, l.lineCap, l.lineJoin, l.dash, l.startCap, l.endCap, l.capScale]);
function make(l) {
  const el = document.createElement(l.kind === 'image' ? 'img' : 'div');
  el.dataset.vlayer = l.id;
  el.className = `sb-vl sb-vl--${l.kind}`;
  if (l.blend) el.style.mixBlendMode = l.blend; // (After Effects' blend mode)
  if (l.kind === 'image') { el.src = l.src || ''; el.alt = ''; el.draggable = false; el.decoding = 'async'; }
  else if (l.kind === 'text') {
    el.textContent = l.text ?? '';
    Object.assign(el.style, {fontFamily: FONT_STACK[l.font] ?? l.font, fontSize: `${l.size}px`, fontWeight: String(l.weight), color: l.color, textAlign: l.align});
  } else if (l.kind === 'path') { // (a line: its <svg> is drawn by `drawPath`, as the box and the trim are at that moment)
    el.innerHTML = '<svg class="sb-vl-svg" preserveAspectRatio="none" aria-hidden="true" focusable="false"></svg>'; // (none: a box dragged bigger is drawn stretched until it is let go)
    el.__pk = '';
  } else {
    Object.assign(el.style, {background: paintCss(l.fill) || 'transparent', border: l.stroke && l.strokeWidth ? `${l.strokeWidth}px solid ${l.stroke}` : 'none', borderRadius: l.kind === 'ellipse' ? '50%' : `${l.radius ?? 0}px`});
  }
  return el;
}
export function drawLayers(root, items, t) {
  if (!root) return;
  const made = (root.__made ??= new Map()), keep = new Set();
  items.forEach((l, i) => {
    keep.add(l.id);
    let got = made.get(l.id);
    const look = lookOf(l);
    if (!got || got.look !== look) { const el = make(l); if (got) got.el.replaceWith(el); got = {el, look}; made.set(l.id, got); }
    const el = got.el;
    if (root.children[i] !== el) root.insertBefore(el, root.children[i] ?? null); // (the stacking: the items' order)
    if (!isShownAt(l, t)) { if (el.style.display !== 'none') el.style.display = 'none'; return; }
    const v = valuesAt(l, t);
    el.style.display = '';
    el.style.width = `${v.w}px`; el.style.height = `${v.h}px`;
    el.style.transform = `translate(${v.x}px, ${v.y}px) rotate(${v.rotation}deg)`;
    el.style.opacity = String(v.opacity);
    const filter = l.fx?.length ? fxCss(l, t) : ''; // (the effects, each number as keyframed)
    if (el.style.filter !== filter) el.style.filter = filter;
    if (l.kind === 'path') drawPath(el, l, v);
  });
  for (const [id, got] of made) if (!keep.has(id)) { got.el.remove(); made.delete(id); }
}
// A path: its line, caps and fill drawn in its box, again only when the box or the trim changed (a path being trimmed in is drawn each picture)
function drawPath(el, l, v) {
  const key = `${v.w}|${v.h}|${v.trimStart}|${v.trimEnd}`;
  if (el.__pk === key) return;
  el.__pk = key;
  const svg = el.firstChild;
  if (!svg) return;
  svg.setAttribute('viewBox', `0 0 ${v.w} ${v.h}`);
  svg.innerHTML = pathMarkup(l, v);
}
// A path shown at once as it would be with `l`'s points (a point being dragged in the video editor: kept when it is let go); the next picture draws what is kept
export function previewPath(root, l, v) {
  const el = root?.querySelector(`[data-vlayer="${CSS.escape(l.id)}"]`);
  if (!el || el.firstChild?.tagName?.toLowerCase() !== 'svg') return;
  el.__pk = '';
  el.firstChild.setAttribute('viewBox', `0 0 ${v.w} ${v.h}`);
  el.firstChild.innerHTML = pathMarkup(l, v);
}
// The layer under a point of the picture (stage px), the one in front first; locked or hidden ones are passed over. A line is hit near it (`slop` px each side), a box inside it. -> layer | null
export function layerAt(items, t, x, y, slop = 6) {
  for (let i = items.length - 1; i >= 0; i--) {
    const l = items[i];
    if (l.locked || !isShownAt(l, t)) continue;
    if (l.kind === 'path') { if (hitPath(l, valuesAt(l, t), x, y, slop)) return l; continue; }
    const v = valuesAt(l, t), cx = v.x + v.w / 2, cy = v.y + v.h / 2, a = -v.rotation * Math.PI / 180;
    const dx = x - cx, dy = y - cy, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); // (the point turned back by the layer's turn)
    if (Math.abs(lx) <= v.w / 2 && Math.abs(ly) <= v.h / 2) return l;
  }
  return null;
}

// The elements of the slides, trimmed (lib/storyboardLayers.mjs `spans`): not seen before a window starts or after it ends. `screen` is the video's picture; an element is found by its
// name (`data-sb-name`), else by its key (an element with no name: its row is named by its key). Called each picture; only the elements that change are touched.
const hide = el => el.style.setProperty('visibility', 'hidden', 'important');
export function drawSpans(screen, spans, t) {
  if (!screen) return;
  const was = (screen.__trimmed ??= new Set()), now = new Set();
  for (const [name, span] of Object.entries(spans ?? {})) {
    if (isInSpan(span, t)) continue;
    const q = CSS.escape(name);
    for (const el of screen.querySelectorAll(`[data-sb-name="${q}"], [data-sb-root="${q}"]`)) { now.add(el); hide(el); }
  }
  for (const el of was) if (!now.has(el)) { if (el.style.getPropertyPriority('visibility') === 'important') el.style.removeProperty('visibility'); } // (its window is back: what the video had on it is not ours to keep)
  screen.__trimmed = now;
}

// The purple lines of the software, by a name that is the same on every slide that has them: the rating's lines (`.iq2-line`: `iq2:peers:tick#1`) and the sections' connector lines
// (an svg path: `svg:<its name>`, the one the connector look gives it). A path layer that stands for some of them (`replaces`) is made from them by clicking one in the video editor.
const LINES = '.iq2-line, svg.sec-flow-lines > path, svg.sec-rk-arrows > path';
export function connectorName(el) {
  if (el.classList.contains('iq2-line')) {
    const rating = el.closest('.iq2-rating'), kind = [...el.classList].find(c => c.startsWith('iq2-line--'))?.slice(10) ?? 'line';
    const side = (rating && [...rating.classList].find(c => c.startsWith('iq2-rating--'))?.slice(12)) || 'x';
    return `iq2:${side}:${kind}#${[...(rating ?? el.parentNode).querySelectorAll(`.iq2-line--${kind}`)].indexOf(el)}`;
  }
  return `svg:${lineName(el)}`;
}
export const connectorsIn = stage => [...stage.querySelectorAll(LINES)];
// How much of an element is seen: its opacity and its ancestors' up to the stage (0: hidden)
function seenOf(el, stage) {
  let o = 1;
  for (let c = el; c && o > 0.001; c = c === stage ? null : c.parentElement) { const cs = getComputedStyle(c); o *= Number(cs.opacity); if (cs.visibility === 'hidden') return 0; }
  return o;
}
const distToSeg = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy, u = len2 > 1e-9 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2)) : 0; return Math.hypot(x - (ax + dx * u), y - (ay + dy * u)); };
// Whether a point of the screen (client px) is on a line of the software, within `slop` px of it (a rating's line is 2 px thick: the slop is what can be pressed)
function nearLine(el, x, y, slop) {
  const r = el.getBoundingClientRect();
  if (x < r.left - slop || x > r.right + slop || y < r.top - slop || y > r.bottom + slop) return false;
  if (typeof el.getTotalLength !== 'function') return true; // (a box: its own, and the slop)
  const len = el.getTotalLength(), ctm = el.getScreenCTM();
  if (!ctm || !len) return false;
  const step = Math.max(3, len / 240);
  let prev = null;
  for (let s = 0; s <= len + step; s += step) {
    const p = el.getPointAtLength(Math.min(s, len)), q = [ctm.a * p.x + ctm.c * p.y + ctm.e, ctm.b * p.x + ctm.d * p.y + ctm.f];
    if (prev && distToSeg(x, y, prev, q) <= slop) return true;
    prev = q;
  }
  return false;
}
// The line of the software under a point of the screen (client px), on whichever slide is on, the one in front first: the slide, and the names of the lines drawn with it (a rating's
// lines are one drawing; a section's connector is one line) -> {frame, names} | null. `screens`: the engine's `onScreen()`.
export function connectorHit(screens, x, y, slop = 5) {
  for (const sc of [...screens].reverse()) {
    for (const el of connectorsIn(sc.stage)) {
      if (!nearLine(el, x, y, slop) || el.hasAttribute('data-sb-hid') || seenOf(el, sc.stage) < 0.05) continue; // (the cheap test first: a press is checked against every line on the slide)
      const group = el.classList.contains('iq2-line') ? [...(el.closest('.iq2-rating') ?? el.parentNode).querySelectorAll('.iq2-line')] : [el];
      return {frame: sc.frame.id, names: group.map(connectorName)};
    }
  }
  return null;
}
// The lines called `names` of a slide's stage as paths on the picture (stage px) and how they look -> {paths: [{pts: [[x, y], ...], closed, ids}], stroke, strokeWidth, endCap, names} | null.
// A rating's pieces (boxes) are chained into trails where they meet; a section's connector keeps its corners and its arrow head.
export function connectorGeometry(stage, names) {
  const S = stage.getBoundingClientRect(), u = S.width / STAGE || 1, out = {paths: [], stroke: null, strokeWidth: 3, endCap: 'none', names: []}, segs = [];
  const toStage = (cx, cy) => [(cx - S.left) / u, (cy - S.top) / u];
  for (const el of connectorsIn(stage)) {
    const name = connectorName(el);
    if (!names.includes(name) || el.hasAttribute('data-sb-hid')) continue;
    out.names.push(name);
    if (el.classList.contains('iq2-line')) { // (a box 2 px thick: its middle line)
      const r = el.getBoundingClientRect(), a = toStage(r.left, r.top), b = toStage(r.right, r.bottom), w = b[0] - a[0], h = b[1] - a[1];
      out.stroke ??= getComputedStyle(el).backgroundColor;
      out.strokeWidth = Math.max(2, Math.round(Math.min(w, h)));
      segs.push(w >= h ? [[a[0], a[1] + h / 2], [b[0], a[1] + h / 2], name] : [[a[0] + w / 2, a[1]], [a[0] + w / 2, b[1]], name]);
      continue;
    }
    const ctm = el.getScreenCTM();
    if (!ctm) continue;
    const map = (px, py) => toStage(ctm.a * px + ctm.c * py + ctm.e, ctm.b * px + ctm.d * py + ctm.f);
    out.stroke ??= el.getAttribute('stroke') || getComputedStyle(el).stroke;
    out.strokeWidth = Math.round(Number(el.getAttribute('stroke-width') || 3) * (Math.hypot(ctm.a, ctm.b) / u) * 10) / 10;
    const head = el.parentNode?.dataset?.sbArrow ?? (el.getAttribute('marker-end') ? 'arrow' : 'none');
    out.endCap = {arrow: 'arrow', triangle: 'triangle', dot: 'circle', none: 'none'}[head] ?? 'none';
    let subs = parsePolylineD(el.getAttribute('d'));
    if (!subs) { // (a curve: sampled, then cut down to its corners)
      const len = el.getTotalLength(), step = Math.max(2, len / 120), pts = [];
      for (let s = 0; s < len; s += step) { const p = el.getPointAtLength(s); pts.push([p.x, p.y]); }
      const end = el.getPointAtLength(len);
      pts.push([end.x, end.y]);
      subs = [{pts: simplify(pts, 0.8), closed: false}];
    }
    for (const sub of subs) out.paths.push({pts: sub.pts.map(([px, py]) => map(px, py)), closed: sub.closed, ids: [name]});
  }
  if (segs.length) for (const t of chainSegments(segs, 4)) out.paths.push({pts: t.pts, closed: false, ids: t.ids});
  return out.paths.length ? out : null;
}
// Those lines are not seen while a path layer that replaces them is on (`from` to `to`, hidden or not: a hidden path takes them away and shows nothing); a path taken away gives them back.
// `screen` is the video's picture. Called each picture, only touching what changes.
export function hideReplaced(screen, items, t) {
  if (!screen) return;
  const names = new Set();
  for (const l of items) if (l.replaces?.length && t >= l.from - 1e-6 && t <= l.to + 1e-6) for (const n of l.replaces) names.add(n);
  if (!names.size && !screen.__replaced) return;
  screen.__replaced = names.size > 0;
  for (const el of screen.querySelectorAll(`${LINES}, [data-sb-hid]`)) {
    if (names.size && el.matches(LINES) && names.has(connectorName(el))) { if (!el.hasAttribute('data-sb-hid')) el.setAttribute('data-sb-hid', ''); el.style.visibility = 'hidden'; }
    else if (el.hasAttribute('data-sb-hid')) { el.removeAttribute('data-sb-hid'); el.style.visibility = ''; }
  }
}
