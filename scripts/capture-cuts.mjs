#!/usr/bin/env node
// Makes a row of the board "All storyboards" (/storyboard?video=all-storyboards, public/storyboard/all-storyboards.json) from a board's Remotion cut, scene by scene (the user, 2026-11-06: "make me a
// new one clean for all videos/storyboard, and put the increased efficiency video variation 4 in that storyboard by just putting what's in the video scene by scene, make sure it's editable just like
// in figma"). The cut is drawn at each scene by the dev page /cut-stage (components/remotion/CutStage.jsx: Remotion's Thumbnail) in a headless Chrome and taken apart into its pieces, each a layer of
// the frame you can move, resize, restyle, retype or delete: the background, the title, the blue label, its line, the sentence, the tablet, each mission, the faces, the phones, the yellow outlines...
// (each piece names itself: `data-cut-part`; a text of the band is put at its own box: `data-cut-pin`). A piece has the same name in every scene, so "Apply to all in this row"
// (pressed) puts a change of its place, size or look on all of them (lib/storyboardLinks.mjs); nothing else is linked, every frame's words are its own.
// The board is NOT the video: what you change there never changes the film, and running this again only makes the frames of that row again (what you edited is kept apart,
// content/storyboard/all-storyboards.json, by frame and piece).
//   node scripts/capture-cuts.mjs [--site http://localhost:3000] [--cut increased-efficiency-v3] [--row ie-v4] [--title "Increased Efficiency · Variation 4"] [--layout storyboard|none]
// (Increased Efficiency's cut redone from the storyboard, as a row of its own: --row ie-redo --title "Increased Efficiency · Redone from the storyboard" --layout storyboard)
// ALL the videos at once (the user, 2026-11-13: "build the storyboard for all videos using remotion, also redo the increased effeciency storyboard to match its video"):
//   node scripts/capture-cuts.mjs --all        one row for each board that has a Remotion cut, the cut as the variation that PLAYS now lays it out (ROWS below); `--only ie-v11,lo-v2` makes just those
// rows. The rows "ie-v4" and "ie-v7" (Increased Efficiency's rows the user reworked by hand: the plans Variations 6 and 11 were made from) are never touched by --all: Increased Efficiency's row is
// "ie-v11", the film that plays now (the user, 2026-11-16: "build all remotion videos, from increased effeciency to the right side"). A row made for the first time stands right under the other
// rows of its board.
// Every row has a frame for each sentence AND for each moment between them that shows something new (a star popping, a mission claimed, a phone pressed...: the user, 2026-11-16, "each slide
// should be visible like the stars show a slide with them, basically everything"); `--scenes-only` makes just the sentences' frames.
// The site must be running (npm run dev).
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {cutFor, cutLayoutOf} from '../lib/remotion/cuts.mjs';
import {cutWordsOf} from '../lib/remotion/cutWords.mjs';
import {ALL_STORYBOARDS, ALL_STORYBOARDS_NAME, STORYBOARDS_STAGE} from '../lib/storyboardAllStoryboards.mjs';

const args = process.argv.slice(2), option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const SITE = option('site', 'http://localhost:3000').replace(/\/$/, '');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'public', 'storyboard', `${ALL_STORYBOARDS}.json`);
const PORT = 9400 + Math.floor(Math.random() * 600), sleep = ms => new Promise(r => setTimeout(r, ms));
// The rows of --all: a board's Remotion cut, one row each, in the order of the videos on All videos (Increased Efficiency to Requesting Maintenance) (the board plays the variation its edits say; the row takes that variation's layout the first time it is made)
const ROWS = [
  {cut: 'increased-efficiency-v3', row: 'ie-v11', title: 'Increased Efficiency · Variation 11'},
  {cut: 'improved-quality-v2', row: 'iq-v4', title: 'Improved Quality · Variation 4'},
  {cut: 'live-oversight-v2', row: 'lo-v2', title: 'Live Oversight · Variation 2'},
  {cut: 'precision-planning-v2', row: 'pp-v2', title: 'Precision Planning · Variation 2'},
  {cut: 'dynamic-auditing-v2', row: 'da-v2', title: 'Dynamic Auditing · Variation 2'},
  {cut: 'requesting-maintenance-v2', row: 'rm-v2', title: 'Requesting Maintenance · Variation 2'},
  {cut: 'requesting-support-v2', row: 'rs-v2', title: 'Requesting Support · Variation 2'},
  {cut: 'tracking-expirations-v2', row: 'te-v2', title: 'Tracking Expirations · Variation 2'},
  {cut: 'replenishing-inventory-v2', row: 'ri-v2', title: 'Replenishing Inventory · Variation 2'},
  {cut: 'exception-management-v2', row: 'em-v2', title: 'Exception Management · Variation 2'},
  {cut: 'reporting-ai-v2', row: 'ra-v2', title: 'Reporting & AI · Variation 2'},
];
const only = option('only', '')?.split(',').filter(Boolean);
const JOBS = args.includes('--all') ? ROWS.filter(r => !only.length || only.includes(r.row))
  : [{cut: option('cut', 'increased-efficiency-v3'), row: option('row', 'ie-v4'), title: option('title', 'Increased Efficiency · Variation 4')}];
if (!JOBS.length) { console.error(`No such row. Rows: ${ROWS.map(r => r.row).join(', ')}`); process.exit(1); }
// A row's cut as its board has it: its retyped words, its layout. The layout: `--layout <name>` ('none': the cut's own), else the one the row was made with (a row made again stays the same film: the
// row "ie-v4" is Variation 4's even while Increased Efficiency plays another), else the one of the variation that plays
async function prepare({cut: BOARD, row: ROW, title: TITLE}) {
  let edits = {};
  try { edits = JSON.parse(await readFile(path.join(ROOT, 'content', 'storyboard', `${BOARD}.json`), 'utf8')); } catch {}
  let made = null;
  try { made = JSON.parse(await readFile(OUT, 'utf8')).chapters?.find(c => c.id === ROW)?.cut ?? null; } catch {}
  const asked = args.includes('--all') ? undefined : option('layout', undefined);
  const layout = asked !== undefined ? (asked === 'none' ? null : asked) : made && made.board === BOARD ? made.layout ?? null : cutLayoutOf(edits);
  const cut = cutFor(BOARD, layout);
  if (!cut) throw new Error(`${BOARD} has no Remotion cut (lib/remotion/cuts.mjs).`);
  const words = cutWordsOf(edits, cut.id), plan = cut.make(words, {layout});
  // The scenes: the title once its yellow line is drawn, then each sentence once its words are written and what it shows is done (its outlines still on)
  const scenes = [{id: 'title', label: plan.title.lines.join(' '), t: plan.B.mark + 0.7},
    ...plan.captions.map(c => ({id: c.id, label: `${c.kicker ? `${c.kicker}: ` : ''}${c.lines.join(' ')}`, t: Math.max(c.written + 0.2, c.until - 0.15)}))];
  return {BOARD, ROW, TITLE, layout, cut, words, plan, scenes};
}

// ---- Runs in the page: the frame taken apart. Every piece (`data-cut-part`) as it is seen: its HTML (a text of the band put at its own box, its color written on it), its box in stage px, its
// opacity as seen (the layers it sits in included). A piece inside another (a phone's avatar) or in a group that only holds pieces (`data-cut-group`: the shifts' avatars, rows and timers) is a
// layer of its own, picked with one click on the board (the user, 2026-11-06: "I should be able to select one of them not the phone with it, I shouldn't have to double click to select"): it is put
// at its own box, and the piece it is in is drawn without it. Self-contained: its source is sent to the page. ----
function takeApart() {
  const stage = document.querySelector('#cut-stage .rc-stage');
  if (!stage) return {parts: []};
  const S = stage.getBoundingClientRect(), k = S.width / 1600 || 1, num = v => Math.round(v * 100) / 100;
  const box = r => ({x: num((r.left - S.left) / k), y: num((r.top - S.top) / k), w: num(r.width / k), h: num(r.height / k)});
  const seen = el => { let o = 1; for (let n = el; n && n !== stage.parentElement; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= Number(cs.opacity); } return o; };
  // How high a piece is stacked in the film: the z-indexes of it and the layers it sits in, from the stage down (a text of the band is in the band, z 41, over the band's shade, z 40; a mission is in
  // the missions' layer, z 10, over the tablet, z 5). On the board the pieces are siblings: they are put in that order and their own z-index is taken off, so the board's order is the film's (and
  // its Bring forward / Send backward work on it).
  const stackOf = el => { const zs = []; for (let n = el; n && n !== stage; n = n.parentElement) { const z = getComputedStyle(n).zIndex; if (z !== 'auto') zs.unshift(Number(z) || 0); } return zs; };
  const above = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] ?? 0) - (b[i] ?? 0); if (d) return d; } return 0; };
  const slug = name => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), count = {}, found = [];
  for (const el of stage.querySelectorAll('[data-cut-part]')) {
    if (el.dataset.cutPart === 'Band shade') continue; // (the dark fade over the words is the film's, not the board's: the user, 2026-11-06, "remove the black faded on top of the words")
    const r = el.getBoundingClientRect(), op = seen(el);
    if (r.width < 1 || r.height < 1 || op < 0.05) continue;
    found.push({el, r, op, stack: stackOf(el), i: found.length, inner: !!el.parentElement.closest('[data-cut-part], [data-cut-group]')}); // (a group only holds pieces: it is no layer)
  }
  found.sort((a, b) => above(a.stack, b.stack) || a.i - b.i);
  // A text the film writes word by word (each word its own element, fading in) becomes ONE plain text on the board (the user, 2026-11-06: "it should be a sentence, not each word on its own"),
  // in a text box whose width sets its lines (asWords below).
  const LINES = {'rc-lines': '.rc-line', 'rc-kicker': '.rc-kicker-line', 'rc-title': '.rc-title-line'};
  let titleBox = null;
  const asWords = (clone, live) => {
    const kind = Object.keys(LINES).find(c => live.classList.contains(c)), lines = kind ? [...clone.querySelectorAll(LINES[kind])] : [];
    if (!lines.length) return;
    const first = live.querySelector(LINES[kind]), cs = getComputedStyle(first);
    // The sentence, the blue label and the title: plain text, nothing but its words (the user, 2026-11-06: "just make it as a sentence I don't need it to be like the video in terms of layers"), in a
    // TEXT BOX (data-sb-box="text"): its width is where its lines break (its handles change it), retyping keeps it, it is as tall as its words; its line height and letter spacing go with its size
    // (the sidebar's font size keeps them in proportion). The title's yellow line goes with it (a text box is words only).
    const size = parseFloat(cs.fontSize) || 16, lh = parseFloat(cs.lineHeight), ls = parseFloat(cs.letterSpacing) || 0;
    if (kind === 'rc-title') { // (the title's box is its WORDS', not the picture-wide rows its lines are: each line's words measured as a range, so it breaks into the film's lines)
      const words = l => { const range = document.createRange(); range.selectNodeContents(l); return range.getBoundingClientRect(); };
      const S2 = stage.getBoundingClientRect(), rs = [...live.querySelectorAll(LINES[kind])].map(words), left = Math.min(...rs.map(r => r.left)), top = Math.min(...rs.map(r => r.top));
      const right = Math.max(...rs.map(r => r.right)), k2 = S2.width / 1600 || 1;
      titleBox = {x: num((left - S2.left) / k2), y: num((top - S2.top) / k2), w: num((right - left) / k2), h: num((Math.max(...rs.map(r => r.bottom)) - top) / k2)}; // (the piece's box on the board: its words)
      Object.assign(clone.style, {position: 'absolute', left: `${num((left - S2.left) / k2)}px`, top: `${num((top - S2.top) / k2)}px`, width: `${num((right - left) / k2)}px`, right: 'auto', bottom: 'auto', margin: '0', transform: 'none', color: getComputedStyle(live).color});
    }
    clone.replaceChildren(document.createTextNode(lines.map(l => l.textContent.replace(/\s+/g, ' ').trim()).join(' ')));
    clone.setAttribute('data-sb-box', 'text');
    Object.assign(clone.style, {font: `${cs.fontStyle} ${cs.fontWeight} ${size}px/${lh ? num(lh / size) : 'normal'} ${cs.fontFamily}`, letterSpacing: `${num(ls / size * 1000) / 1000}em`, textShadow: cs.textShadow,
      textTransform: cs.textTransform, whiteSpace: 'normal', width: `${Math.ceil(parseFloat(clone.style.width) || 0) + 4}px`, height: 'auto'});
  };
  const parts = found.map(({el, r, op, inner}) => {
    const clone = el.cloneNode(true), b = box(r);
    // What a clone loses: a list scrolled by the clock (its `scrollTop` is not in the HTML: what it holds is moved up by as much, the list still clips it), and the way the pieces round it
    // move it (`data-cut-lift`: the art that is drawn lower, `artDy`: the translate of the layers it sits in is put on the piece)
    const liveAll = [el, ...el.querySelectorAll('*')], cloneAll = [clone, ...clone.querySelectorAll('*')];
    liveAll.forEach((live, i) => {
      const sx = live.scrollLeft, sy = live.scrollTop;
      if (sx < 0.5 && sy < 0.5) return;
      for (const kid of cloneAll[i]?.children ?? []) kid.style.transform = `translate(${-num(sx)}px, ${-num(sy)}px) ${kid.style.transform && kid.style.transform !== 'none' ? kid.style.transform : ''}`;
    });
    if (el.hasAttribute('data-cut-lift')) {
      let lx = 0, ly = 0;
      for (let n = el.parentElement; n && n !== stage; n = n.parentElement) { const tr = getComputedStyle(n).transform; if (tr && tr !== 'none') { const m = new DOMMatrixReadOnly(tr); if (Math.abs(m.a - 1) < 0.001 && Math.abs(m.d - 1) < 0.001) { lx += m.e; ly += m.f; } } }
      const own = getComputedStyle(el).transform;
      if (lx || ly) clone.style.transform = `translate(${num(lx)}px, ${num(ly)}px) ${own && own !== 'none' ? own : ''}`;
      clone.removeAttribute('data-cut-lift');
    }
    if (el.classList.contains('rc-rule')) { // the line between the blue label and the sentence: a drawing, picked by its stroke, its color and width in the sidebar's Drawing, its length by its handles
      const cs = getComputedStyle(el), m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/.exec(cs.backgroundColor) || [];
      const hex = `#${[1, 2, 3].map(i => Math.round(Number(m[i]) || 0).toString(16).padStart(2, '0')).join('')}`, alpha = m[4] != null ? Number(m[4]) : 1;
      const pad = 8, w = num(b.w + 2 * pad), h = b.h, x = num(b.x - pad), d = `M${num(w / 2)} 0V${num(h)}`, sw = num(b.w) || 2;
      const name = el.dataset.cutPart, base = slug(name), n = (count[base] = (count[base] ?? 0) + 1), key = n > 1 ? `${base}-${n}` : base;
      const html = `<div data-sb-root="${key}" data-sb-box="drawing" style="position:absolute;left:${x}px;top:${b.y}px;width:${w}px;height:${h}px;pointer-events:none${op < 0.995 ? `;opacity:${num(op)}` : ''}">`
        + `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;width:100%;height:100%;overflow:visible;pointer-events:none">`
        + `<path d="${d}" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
        + `<path data-ink="" d="${d}" fill="none" stroke="${hex}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"${alpha < 1 ? ` stroke-opacity="${alpha}"` : ''}/></svg></div>`;
      return {key, name: n > 1 ? `${name} ${n}` : name, html, box: {x, y: b.y, w, h}, op: num(op), txt: ''};
    }
    // the pieces inside it are layers of their own: taken out of it (one placed by itself), or kept invisible where it holds the place of what follows it
    const own = [...clone.querySelectorAll('[data-cut-part]')];
    el.querySelectorAll('[data-cut-part]').forEach((live, j) => { if (/^(absolute|fixed)$/.test(getComputedStyle(live).position)) own[j].remove(); else own[j].style.visibility = 'hidden'; });
    clone.querySelectorAll('canvas,script,noscript').forEach(n => n.remove());
    clone.querySelectorAll('[tabindex]').forEach(n => n.removeAttribute('tabindex'));
    clone.removeAttribute('data-cut-pin');
    // fixed in place on the board (`data-cut-fixed`: the background; the user, 2026-11-06: "lock the background in all slides, to be editable in color but not position/scale"): data-sb-fixed
    if (el.hasAttribute('data-cut-fixed')) { clone.removeAttribute('data-cut-fixed'); clone.setAttribute('data-sb-fixed', ''); }
    // what is SEEN of it (`data-cut-seen`, a selector: a mission card is laid out in a 1080 px board, its sizes being that board's units, so it cannot be trimmed like a phone; the user,
    // 2026-11-09, "show selection only on mission"): data-sb-seen, its selection and clicks on the board are that element's (components/storyboardDom.js seenOf), and so is its box
    const seenEl = el.dataset.cutSeen && el.querySelector(el.dataset.cutSeen);
    if (el.dataset.cutSeen) { clone.setAttribute('data-sb-seen', el.dataset.cutSeen); clone.removeAttribute('data-cut-seen'); }
    if (seenEl && !el.dataset.cutBox) { const r2 = seenEl.getBoundingClientRect(); if (r2.width >= 1 && r2.height >= 1) Object.assign(b, box(r2)); }
    // its box trimmed to what is seen of it (`data-cut-box`: the element inside it that is; a phone is laid out at its full size and shrunk, its face above it is a piece of its own: the user,
    // 2026-11-06, "trim the selection to exactly the phone"): the piece at that box, what it holds moved back by as much, so it stays where it was
    const seenBox = el.dataset.cutBox && el.querySelector(el.dataset.cutBox);
    if (seenBox) {
      const v = box(seenBox.getBoundingClientRect()), dx = num(v.x - b.x), dy = num(v.y - b.y), wrap = document.createElement('div');
      wrap.style.cssText = `position:absolute;left:${-dx}px;top:${-dy}px;width:${b.w}px`;
      wrap.append(...clone.childNodes);
      clone.append(wrap);
      clone.removeAttribute('data-cut-box');
      Object.assign(clone.style, {left: `${v.x}px`, top: `${v.y}px`, width: `${v.w}px`, height: `${v.h}px`, overflow: 'visible'});
      Object.assign(b, v);
    }
    // a text of the band, or a piece that was inside another: at its own box (as seen, its scale in it), with the color and font it had from the pieces round it
    if (el.hasAttribute('data-cut-pin') || inner) {
      const cs = getComputedStyle(el);
      Object.assign(clone.style, {position: 'absolute', left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`, right: 'auto', bottom: 'auto', margin: '0', transform: 'none', color: cs.color});
      if (inner) clone.style.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
    }
    titleBox = null;
    asWords(clone, el); // (after its box is written: a plain text takes its width from it)
    if (titleBox) Object.assign(b, titleBox);
    // (a piece the film shows by its clock, an opacity written on it each frame, is hidden by its own style until then: the cursor, a click's ring, a yellow outline, an avatar. On the board
    // it has no clock, so what was seen whole says so itself, or it is there and not seen: the user, 2026-11-16, "if cursor is shown in video, show it in storyboard too")
    clone.style.opacity = op > 0.995 ? (el.style.opacity !== '' ? '1' : '') : String(num(op));
    clone.style.zIndex = 'auto';
    const name = el.dataset.cutPart, base = slug(name), n = (count[base] = (count[base] ?? 0) + 1), key = n > 1 ? `${base}-${n}` : base;
    clone.setAttribute('data-sb-root', key);
    // (`op` and `txt` are only for telling two moments apart: the opacity as seen, and the words of a text box)
    return {key, name: n > 1 ? `${name} ${n}` : name, html: clone.outerHTML, box: b, op: num(op), txt: clone.getAttribute('data-sb-box') === 'text' ? clone.textContent.replace(/\s+/g, ' ').trim() : ''};
  });
  // The title's yellow line (struck through or under its marked words): a path of its own over the title (picked by its stroke, its color and width in the sidebar's Drawing), so the
  // title can be plain text and still look like the film
  const bar = stage.querySelector('.rc-title .rc-mark-word > i'), at = parts.findIndex(p => p.key === 'title');
  if (bar && at >= 0) {
    const v = box(bar.getBoundingClientRect()), kind2 = bar.parentElement.classList.contains('is-underline') ? 'underline' : 'strike', pad = 10, sw = num(v.h) || 7;
    const x = num(v.x), y = num(v.y + v.h / 2 - pad), w = num(v.w), h = 2 * pad, d = `M${num(sw / 2)} ${pad}H${num(w - sw / 2)}`, name = kind2 === 'underline' ? 'Title underline' : 'Title strike', key = kind2 === 'underline' ? 'title-underline' : 'title-strike';
    const html = `<div data-sb-root="${key}" data-sb-box="drawing" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 7px rgb(255 236 0 / 45%))">`
      + `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;width:100%;height:100%;overflow:visible;pointer-events:none">`
      + `<path d="${d}" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
      + `<path data-ink="" d="${d}" fill="none" stroke="#ffec00" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></div>`;
    parts.splice(at + 1, 0, {key, name, html, box: {x, y, w, h}, op: 1, txt: ''});
  }
  // What the film sets ROUND its pieces that their rules lean on (`data-cut-scope` on a wrapper: a class the frame's stage takes on the board, where the pieces are no longer inside that
  // wrapper, and the custom properties the wrapper carries: Increased Efficiency's `.rc-redo`, the strips behind the names and the execution timers and their color)
  const scopes = [...stage.querySelectorAll('[data-cut-scope]')];
  return {parts, stageClass: scopes.map(el => el.dataset.cutScope).join(' '), stageStyle: scopes.flatMap(el => [...el.style].filter(n => n.startsWith('--')).map(n => `${n}:${el.style.getPropertyValue(n).trim()}`)).join(';')};
}

// Whether two frames (their `takeApart` pieces) show something different: a piece that is in one and not the other, one that moved or changed size by more than 14 board px, one that faded in or out
// by a quarter or more, words that changed, or something that changed INSIDE a piece (`sig`: a page that went to another, a row that opened, a menu, a card claimed inside its board, a pill's
// color: the user, 2026-11-16, "each slide should be visible ... basically everything"). A timer ticking or an animation all but done is the same frame. The cursor is a piece like the others
// (the user, the same day: "if cursor is shown in video, show it in storyboard too": where it is and whether it is there are compared; `cursor: false` leaves it out, to tell when two moments
// differ by the cursor alone); the yellow ring a click leaves is never compared (it only spreads and fades).
const RING = /^click-ring(-\d+)?$/, CURSOR = /^cursor(-\d+)?$/;
function differs(a, b, inside = 'sig', cursor = true) { // (`inside`: what is compared inside a piece, its 'sig' or only its 'shape')
  const looked = p => !RING.test(p.key) && (cursor || !CURSOR.test(p.key));
  const ma = new Map(a.filter(looked).map(p => [p.key, p])), mb = new Map(b.filter(looked).map(p => [p.key, p]));
  if (ma.size !== mb.size) return true;
  for (const [key, p] of ma) {
    const q = mb.get(key);
    if (!q) return true;
    if (Math.abs(p.box.x - q.box.x) > 14 || Math.abs(p.box.y - q.box.y) > 14 || Math.abs(p.box.w - q.box.w) > 14 || Math.abs(p.box.h - q.box.h) > 14 || Math.abs(p.op - q.op) >= 0.25 || p.txt !== q.txt || p[inside] !== q[inside]) return true;
  }
  return false;
}
// What a piece shows inside, for telling two moments apart: its HTML with what only ticks or eases taken out. The digits of its words go (a timer, a count), the numbers of its styles are rounded
// (a place or a size to 16 px, a scale or an opacity to a tenth: something still gliding, popping or fading is not the same 0.3 s later, something at rest is), its colors are kept whole: `sig`.
// `shape` is the same with the numbers of its styles left out altogether: what it is made of, its words, its states and its colors. Two moments with one shape and two sigs show the same
// thing at two points of a move (a pill in its pop, a list in its scroll).
const letters = n => String(n).replace(/\d/g, d => 'abcdefghij'[d]);
const NUMBER = /rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|-?\d*\.?\d+(?:e-?\d+)?/gi;
const hashed = text => createHash('sha1').update(text).digest('hex').slice(0, 12);
function signs(html) {
  const tidy = html
    .replace(/^(<[^>]*?)\sstyle="[^"]*"/, '$1')      // (the piece's own place, size and opacity are compared apart, by its box and `op`)
    .replace(/transform-origin:[^;"]*;?\s*/g, '')    // (where a pop grows from: nothing to see once it is done)
    .replace(/\sstyle="\s*"/g, '')                   // (an attribute React leaves empty once a style is taken off)
    .replace(/<([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)+)\s*(\/?)>/g, (m, tag, attrs, end) => `<${tag} ${attrs.match(/[^\s=>/]+(?:="[^"]*")?/g).sort().join(' ')}${end}>`); // (its attributes in one order: one that React puts on later is written after the others)
  const styled = number => tidy.replace(/style="([^"]*)"/g, (m, css) => `style="${css.replace(NUMBER, n => (/^(rgb|#)/i.test(n) ? letters(n) : number(Number(n))))}"`).replace(/\d+/g, '');
  return {sig: hashed(styled(v => (Math.abs(v) >= 8 ? `q${letters(Math.round(v / 16))}` : `t${letters(Math.round(v * 10))}`))), shape: hashed(styled(() => 'n'))};
}
const hasCursor = parts => parts.some(p => CURSOR.test(p.key));
// A moment is a slide only when it shows something the frame before it did not (`adds`: a new piece, one that moved, changed inside or came in more; things that only left or faded add
// nothing: the words gone before the next ones, the film's last fade), and when it has art (`bare`: nothing but the background and words is no slide of its own, the same words are on the next
// one with their art; the user, 2026-11-16: "now some have art some just titles"). The title's and the sentences' frames are kept whatever they hold.
const WORDS = /^(background|title|title-strike|title-underline|label|line|sentence)(-\d+)?$/;
const bare = parts => parts.every(p => WORDS.test(p.key) || RING.test(p.key) || CURSOR.test(p.key));
function adds(before, now) {
  const mb = new Map(before.map(p => [p.key, p]));
  return now.some(p => {
    if (RING.test(p.key)) return false;
    const q = mb.get(p.key);
    return !q || Math.abs(p.box.x - q.box.x) > 14 || Math.abs(p.box.y - q.box.y) > 14 || Math.abs(p.box.w - q.box.w) > 14 || Math.abs(p.box.h - q.box.h) > 14 || p.op - q.op >= 0.25 || p.txt !== q.txt || p.sig !== q.sig;
  });
}

// ---- The browser ----
const BROWSERS = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const browser = BROWSERS.find(existsSync);
if (!browser) { console.error('No Chrome or Edge found. Set CHROME_PATH.'); process.exit(1); }
const hash = html => createHash('sha1').update(html).digest('hex').slice(0, 12);
const profile = await mkdtemp(path.join(tmpdir(), 'cuts-'));
const child = spawn(browser, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--disable-gpu', '--force-device-scale-factor=1', 'about:blank'], {stdio: 'ignore'});
const stop = async () => { child.kill(); await sleep(400); await rm(profile, {recursive: true, force: true}).catch(() => {}); };

try {
  for (let tries = 0; ; tries++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { if (tries > 60) throw new Error('The browser did not start.'); await sleep(200); } }
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {method: 'PUT'})).json(), ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, {once: true}));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => { const m = JSON.parse(event.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(resolve => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({id: i, method, params})); });
  const evaluate = async (expression, awaitPromise = false) => { const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise}); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
  await send('Emulation.setDeviceMetricsOverride', {width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false});
  await send('Page.enable');
  await send('Page.navigate', {url: `${SITE}/cut-stage`});
  for (let waited = 0; waited < 90000 && !(await evaluate('!!window.__cut')); waited += 400) await sleep(400);
  if (!(await evaluate('!!window.__cut'))) throw new Error(`${SITE}/cut-stage did not load (is the site running?)`);

  for (const job of JOBS) {
    const {BOARD, ROW, TITLE, layout, cut, words, plan, scenes} = await prepare(job);
    console.log(`\n== ${TITLE} (${BOARD}${layout ? `, layout ${layout}` : ''}, ${plan.seconds.toFixed(1)} s) ==`);
    // the frames of the row, one a scene
    const assets = {}, frames = [];
    // (`own`: one of the film's own moments, `plan.moments`; what the film calls fleeting, `plan.fleeting`, names of pieces such as a star, is on those slides only, and not the one that is
    // all but faded there: the star before it)
    const fleeting = p => (plan.fleeting ?? []).some(name => p.name === name || p.name.startsWith(`${name} `));
    const snap = async (t, own = false) => {
      await evaluate(`window.__cut.show(${JSON.stringify(BOARD)}, ${t}, ${JSON.stringify(words)}, ${JSON.stringify(layout)})`, true);
      const shot = await evaluate(`(${takeApart.toString()})()`);
      return Object.assign(shot.parts.filter(p => (fleeting(p) ? own && p.op >= 0.3 : true)).map(p => ({...p, ...signs(p.html)})), {stageClass: shot.stageClass || '', stageStyle: shot.stageStyle || ''});
    };
    // Every sentence's frame (always kept), and the moments between them (the user, 2026-11-16: "build all of them in storyboards, each slide should be visible like the stars show a slide with
    // them, basically everything"): each beat of the plan (`plan.B`: when something pops, moves, is pressed, a star comes), looked at once its motion has settled, kept only when it shows
    // something the frame before it did not (no duplicates). `--scenes-only` makes just the sentences' frames, as before.
    const events = scenes.map(scene => ({scene, t: scene.t, parts: null}));
    if (!args.includes('--scenes-only')) {
      const beats = [];
      (function walk(o, d) { if (o == null || d > 4) return; if (typeof o === 'number') { if (Number.isFinite(o)) beats.push(o); } else if (Array.isArray(o)) o.forEach(v => walk(v, d + 1)); else if (typeof o === 'object') Object.values(o).forEach(v => walk(v, d + 1)); })(plan.B, 0);
      const last = plan.seconds - 0.6, times = [...new Set(beats.filter(b => b > 0.4 && b < last).map(b => Math.round(b * 4) / 4))].sort((a, b) => a - b);
      for (const [i, beat] of times.entries()) {
        let t = Math.min(last, beat + 0.35), parts = null, moving = false;
        for (let k = 0; k < 6; k++) { // (settled: it looks the same 0.3 s later; a thing that never stops is taken as it is at the last try, and said to be `moving`)
          parts = await snap(t);
          if (t + 0.3 > last) break;
          moving = differs(parts, await snap(t + 0.3));
          if (!moving || k === 5) break;
          t += 0.4;
        }
        t = Math.min(t, last);
        events.push({beat: true, t, parts, moving});
        if (i % 20 === 19) console.log(`   ...${i + 1}/${times.length} moments looked at`);
      }
      // what never holds still and is a slide all the same (`plan.moments`, seconds the film names itself: a star at its fullest): taken exactly then
      for (const t of plan.moments ?? []) if (t > 0.4 && t < last) events.push({beat: true, own: true, t, parts: null});
      // the cursor's stops (`plan.cursorAt.stops`, lib/remotion/cutCore.mjs `cursorPlan`; the user, 2026-11-16: "if cursor is shown in video, show it in storyboard too"): a slide each, the
      // cursor on what it clicks (pressed, just before the click does anything: what the click does is the next slide), on what it points at, in the middle of its swipe or its drag. In
      // most films it leaves right after a click, so no settled moment and no sentence's end ever had it.
      for (const s of plan.cursorAt?.stops ?? []) {
        const t = s.kind === 'click' ? s.t - 0.04 : s.until != null ? (s.t + s.until) / 2 : s.t + 0.15;
        if (t > 0.4 && t < last) events.push({beat: true, hand: true, t, parts: null});
      }
    }
    events.sort((a, b) => a.t - b.t);
    const chosen = []; // a moment is kept when it differs from the frame before it; a sentence's frame always is
    for (const e of events) {
      if (!e.parts) e.parts = await snap(e.t, !!e.own);
      if (e.hand && !hasCursor(e.parts)) e.hand = false; // (the cursor is not seen there after all: a moment like the others)
      const before = chosen[chosen.length - 1];
      if (e.beat && before) {
        if (!differs(before.parts, e.parts)) continue; // (the same, the cursor too)
        if (!differs(before.parts, e.parts, 'sig', false)) { // (they differ by the cursor alone)
          if (!hasCursor(e.parts)) continue; // (it left: nothing new)
          if (before.beat && !before.own && !before.hand && !hasCursor(before.parts)) { chosen[chosen.length - 1] = e; continue; } // (the same moment with the cursor on: that one stays)
          chosen.push(e); // (it came, or went to another thing: a slide)
          continue;
        }
        if (!e.own && !e.hand && (bare(e.parts) || !adds(before.parts, e.parts))) continue; // (no art, or nothing new: no slide)
      } else if (e.beat && !e.own && !e.hand && bare(e.parts)) continue;
      if (!e.beat && before?.beat && !differs(before.parts, e.parts, 'sig', false)) { // (a moment the sentence's frame repeats: the sentence's frame stays, with the cursor on if the moment had it)
        if (hasCursor(before.parts) && !hasCursor(e.parts)) { e.parts = before.parts; e.t = before.t; }
        chosen.pop();
      }
      chosen.push(e);
    }
    // a moment caught in a move (it was not at rest) that the next frame, under a second later, shows done (the same pieces, places, words, states and colors: only numbers inside differ) is no
    // slide: "an animation all but done is the same frame"
    for (let i = chosen.length - 2; i >= 0; i--) {
      const e = chosen[i], next = chosen[i + 1];
      if (e.beat && !e.own && e.moving && next.t - e.t < 1 && !differs(e.parts, next.parts, 'shape')) chosen.splice(i, 1);
    }
    // the sentence on at a time (the last whose words have come in; before the first, the title): the label and the name a moment's frame is given
    const capOf = t => { let c = null; for (const k of plan.captions) if (k.at <= t) c = k; return c; };
    const taken = new Set();
    for (const [i, e] of chosen.entries()) {
      const {parts} = e, t = Math.round(e.t * 100) / 100;
      const layers = parts.map(p => { const key = hash(p.html); assets[key] = p.html; return {key: p.key, name: p.name, kind: 'dom', box: p.box, asset: key}; });
      let id, label, sceneId;
      if (e.scene) { id = `${ROW}/${e.scene.id}`; label = e.scene.label; sceneId = e.scene.id; } else {
        const cap = capOf(e.t), base = cap ? cap.id : 'title';
        sceneId = base; id = `${ROW}/${base}@${t.toFixed(1)}`;
        for (let n = 2; taken.has(id); n++) id = `${ROW}/${base}@${t.toFixed(1)}-${n}`;
        label = `${cap ? `${cap.kicker ? `${cap.kicker}: ` : ''}${cap.lines.join(' ')}` : plan.title.lines.join(' ')} · ${t.toFixed(1)} s`;
      }
      taken.add(id);
      // (the frame's own stage on the board: the board's, with the film's scopes; components/Storyboard.jsx `frame.stageClass`, `frame.stageStyle`)
      const scope = {...(parts.stageClass ? {stageClass: `${STORYBOARDS_STAGE.className} ${parts.stageClass}`} : {}), ...(parts.stageStyle ? {stageStyle: [STORYBOARDS_STAGE.style, parts.stageStyle].filter(Boolean).join(';')} : {})};
      frames.push({id, chapter: ROW, chapterNumber: 0, kind: 'scene', label, time: t, at: t, bubble: null, scene: {id: sceneId, view: 'cut'}, layers, n: i + 1, ...scope});
      console.log(`${String(i + 1).padStart(2)}  ${t.toFixed(2).padStart(6)} s  ${layers.length} pieces  ${e.scene ? '' : '· '}${label}`);
    }

    // the board: this row made again (in its place if it was there, else at the end), the others as they were (each row is a video)
    let board = null;
    try { board = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
    const old = board?.chapters ?? [], at = old.findIndex(c => c.id === ROW), kept = (board?.frames ?? []).filter(f => f.chapter !== ROW);
    const row = {id: ROW, number: 0, title: TITLE, words: '', start: 0, end: Math.round(plan.seconds * 100) / 100, cut: {board: BOARD, id: cut.id, layout}};
    const under = old.findLastIndex(c => c.cut?.board === BOARD); // (a new row: right under the other rows of its board, else at the end)
    const chapters = (at >= 0 ? old.map(c => (c.id === ROW ? row : c)) : under >= 0 ? [...old.slice(0, under + 1), row, ...old.slice(under + 1)] : [...old, row]).map((c, i) => ({...c, number: i + 1}));
    // (the rows stand in the order of the videos on All videos, `ROWS`, whatever the order they were made in; a row that is not one of them, the ones the user reworked by hand, stays
    // right before its board's)
    const rank = c => { const i = ROWS.findIndex(r => r.row === c.id); if (i >= 0) return i; const j = ROWS.findIndex(r => r.cut === c.cut?.board); return j >= 0 ? j - 0.5 : -1; };
    chapters.sort((a, b) => rank(a) - rank(b));
    chapters.forEach((c, i) => { c.number = i + 1; });
    const number = new Map(chapters.map(c => [c.id, c.number])), all = [...kept, ...frames].map(f => ({...f, chapterNumber: number.get(f.chapter)}));
    const used = new Set(all.flatMap(f => f.layers.map(l => l.asset))), store = {...(board?.assets ?? {}), ...assets};
    const data = {version: 1, video: ALL_STORYBOARDS, name: ALL_STORYBOARDS_NAME, size: [1600, 900], stage: STORYBOARDS_STAGE, chapters, frames: all,
      assets: Object.fromEntries(Object.entries(store).filter(([k]) => used.has(k))), generated: new Date().toISOString()};
    await writeFile(OUT, JSON.stringify(data));
    console.log(`${TITLE}: ${frames.length} frames, ${Object.keys(assets).length} distinct pieces -> public/storyboard/${ALL_STORYBOARDS}.json (the row "${ROW}"; ${chapters.length} row${chapters.length > 1 ? 's' : ''} on the board)`);
    // a note written on a moment whose id is no longer made (its second changed with the film) is on no frame now: say so (nothing is changed here; scripts/storyboard.mjs `gone`, `note`, `forget`)
    try {
      const kept = JSON.parse(await readFile(path.join(ROOT, 'content', 'storyboard', `${ALL_STORYBOARDS}.json`), 'utf8')), made = new Set(frames.map(f => f.id));
      const lost = Object.keys(kept.frames ?? {}).filter(id => id.startsWith(`${ROW}/`) && !made.has(id) && !kept.copies?.[id]);
      if (lost.length) console.log(`   ! ${lost.length} frame${lost.length > 1 ? 's' : ''} with a note or edits ${lost.length > 1 ? 'are' : 'is'} no longer made (${lost.join(', ')}): node scripts/storyboard.mjs gone ${ROW} --video ${ALL_STORYBOARDS}`);
    } catch {}
  }
  ws.close();
} finally { await stop(); }
