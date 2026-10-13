// Makes the storyboard's frames (public/storyboard/<video>.json and
// public/storyboard/<video>/*.jpg) from the running demos. Run it again whenever
// a video changes, against a running site (the dev server or `npm run start`):
//   npm run gen:storyboard -- [--base http://localhost:3000] [--video improved-quality-v2] [--only knowledge,alerts]
// It drives a headless Chrome/Edge over the DevTools protocol: opens the demo's
// player, scrubs to the time of every frame lib/storyboardFrames.mjs plans (one
// per action: hand, click, tail, empty bubble, words...) and takes the stage apart
// into layers (the tablet, the mission, the hand, the circle, the chat bubble...)
// that /storyboard lets you move and edit. Layers are the demo's own HTML (with
// its own classes), so they look exactly like the video.
// It also makes the list Shift+A offers, public/storyboard/ui-parts.json (+ thumbnails
// in public/storyboard/ui/): the product's UI a piece at a time, from the catalog page
// /storyboard-ui (components/StoryboardUi.jsx), the web app's screens (/running) and a
// few screens only the videos show (PARTS below). `--parts` makes just that list.
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, readdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {planVideo} from '../lib/storyboardFrames.mjs';
import {ASSETS} from '../lib/videoLibrary.mjs';
import * as quality from '../lib/improvedQualityV2Story.mjs';
import * as efficiency from '../lib/efficiencyV2Story.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const base = option('base', 'http://localhost:3000').replace(/\/$/, '');
const only = option('only', '')?.split(',').filter(Boolean);
const wanted = option('video', '')?.split(',').filter(Boolean);
const partsOnly = args.includes('--parts');
const PORT = 9343;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// No frame that shows nothing new (the user, 2026-10-05: "no duplicates, no small transitions
// like moving the cursor a little"). Each frame is compared with the last one kept in its
// chapter, without the hand and its click ripple: if no text changed (digits aside: the timers
// tick) and the picture is the same but for things a few px off (an animation all but done),
// it is the same frame. Of two such frames the more telling one stays (RANK: a click over the
// hand arriving on it, what a click did over the end of the chapter). The steps the storyboard
// shows on purpose always stay (KEPT), and so does every frame the storyboard's edits point at.
const SAME = 0.004;   // share of the picture that may differ (beyond SHIFT small px of movement)
const SMALL = 160;    // px wide: the picture the frames are compared at (1 px = 10 stage px)
const SHIFT = 2;      // small px a thing may be off and still be the same
const KEPT = new Set(['start', 'mark', 'tail', 'bubble', 'words', 'out', 'fading']);
const RANK = {end: 1, mid: 1, result: 2, hand: 3, click: 4};
// The frames the storyboard's edits point at (notes, moves, copies, the order, deletions).
async function pinnedOf(video) {
  try {
    const e = JSON.parse(await readFile(`content/storyboard/${video}.json`, 'utf8'));
    return new Set([...Object.keys(e.frames ?? {}), ...Object.values(e.copies ?? {}).map(c => c.from), ...Object.values(e.rows ?? {}).flat(), ...(e.deleted ?? [])].filter(Boolean));
  } catch { return new Set(); }
}

const VIDEOS = [
  {id: 'improved-quality-v2', name: 'Improved Quality', page: '/improved-quality-v2/embed?mode=player', stage: '.iq2-stage', story: quality.QUALITY_STORY, handStops: quality.HAND_STOPS, say: quality.SAY, textAt: quality.TEXT_AT, skip: quality.CLIP_SKIP},
  {id: 'increased-efficiency-v2', name: 'Increased Efficiency', page: '/increased-efficiency-v2/embed?mode=player', stage: '.ev2-stage', story: efficiency.EFFICIENCY_STORY, handStops: efficiency.HAND_STOPS, say: efficiency.SAY, textAt: efficiency.TEXT_AT, skip: efficiency.CLIP_SKIP},
].filter(v => !wanted.length || wanted.includes(v.id));

// Screens that only the videos show (the rest of the UI is read from /storyboard-ui):
// one clean copy of each from the frame where it shows biggest, fully in view.
const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const PARTS = [
  ['Knowledge base', '.iq-knowledge', 'Screens', 'library documents information wiki'],
  ['Business proofs', '.iq-bp-window', 'Screens', 'media proofs gallery photos evidence'],
  ['Usage report', '.iq2-report', 'Web app', 'dashboard reports web browser'],
].map(([name, sel, category, keywords]) => ({id: slug(name), name, sel, category, keywords}));

// ---- Runs inside the page --------------------------------------------------
// The share of picture `b` that is not in `a` (either way), allowing `shift` px of movement.
async function differ(a, b, shift, threshold) {
  const load = src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
  const [A, B] = await Promise.all([load(a), load(b)]), w = B.width, h = B.height;
  const pixels = img => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h); return g.getImageData(0, 0, w, h).data; };
  const pa = pixels(A), pb = pixels(B);
  const missing = (from, to) => {
    let count = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let found = false;
      for (let dy = -shift; dy <= shift && !found; dy++) for (let dx = -shift; dx <= shift && !found; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = (yy * w + xx) * 4;
        found = Math.max(Math.abs(from[j] - to[i]), Math.abs(from[j + 1] - to[i + 1]), Math.abs(from[j + 2] - to[i + 2])) <= threshold;
      }
      if (!found) count++;
    }
    return count;
  };
  return Math.max(missing(pa, pb), missing(pb, pa)) / (w * h);
}
// Takes the stage apart into layers at the time the player is parked on. Written
// as one self-contained function: it is sent to the page as source.
function extract(selector, bests, parts) {
  const stage = document.querySelector(selector);
  const S = stage.getBoundingClientRect(), unit = S.width / 1600;
  const num = v => Math.round(v * 100) / 100;
  const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sized = el => { const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1; };
  // on screen: it shows itself, or (a zero-height holder) something in it does
  const shown = el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.02) return false;
    return sized(el) || [...el.querySelectorAll('*')].some(c => sized(c) && getComputedStyle(c).visibility !== 'hidden');
  };
  const NAMES = [
    ['iq2-kb-tablet', 'tablet', 'Tablet'], ['iq-emphasis-tablet', 'team-board', 'Team board'], ['iq2-mission', 'mission', 'Mission'],
    ['iq2-report', 'report', 'Report'], ['iq2-iso-layer', 'lifted-mission', 'Lifted mission'], ['iq2-dim', 'dim', 'Dark'],
    ['iq2-pop--name', 'names', 'Names'], ['iq2-pop--date', 'dates', 'Dates'], ['iq2-mark', 'circle', 'Yellow outline'],
    ['ev2-board-root', 'board', 'Board'], ['ev2-cards', 'cards', 'Mission cards'], ['ev2-iso', 'isolated', 'Isolated missions'],
    ['adx-quick-code', 'quick-code', 'Quick code'], ['adx-tablet', 'tablet', 'Tablet'], ['adx-phone', 'phone', 'Phone'],
    ['dh-hand', 'hand', 'Hand'], ['dh-ripple', 'ripple', 'Click ripple'], ['es-title', 'title', 'Title'], ['adx-title', 'words', 'Words'],
  ];
  const nameOf = el => { const hit = NAMES.find(([cls]) => el.classList.contains(cls)); return hit ? {key: hit[1], name: hit[2]} : {key: String(el.className?.baseVal ?? el.className ?? el.tagName).split(' ')[0] || 'layer', name: 'Layer'}; };
  // The typed words are one <span> per letter: make them plain lines (all the
  // letters, or only the ones showing).
  const flatten = (root, all) => {
    root.querySelectorAll('p[aria-label]').forEach(p => {
      const lines = [...p.children].map(line => [...line.querySelectorAll('[data-intro-letter]')].filter(l => all || parseFloat(l.style.opacity || '1') > 0.5).map(l => l.textContent.replace(/\u00a0/g, ' ')).join('').replace(/\s+$/, ''));
      p.style.opacity = '1'; p.style.transform = 'none';
      p.innerHTML = lines.map(line => `<span style="display:block;white-space:nowrap">${escape(line) || '&#8203;'}</span>`).join('');
    });
  };
  const clean = clone => {
    clone.querySelectorAll('canvas,script,noscript').forEach(n => n.remove());
    clone.querySelectorAll('[tabindex]').forEach(n => n.removeAttribute('tabindex'));
    clone.querySelectorAll('img[loading]').forEach(n => n.removeAttribute('loading'));
  };
  const layers = [], used = {};
  const take = (name, extra) => { used[name.key] = (used[name.key] ?? 0) + 1; return {key: used[name.key] > 1 ? `${name.key}-${used[name.key]}` : name.key, name: name.name, ...extra}; };
  const wrap = (html, chain) => chain.reduceRight((inner, el) => `<div class="${el.className}" style="${el.getAttribute('style') ?? ''}" data-sb-wrap>${inner}</div>`, html);
  const addDom = (el, chain, all = false) => {
    if (!shown(el)) return;
    const r = el.getBoundingClientRect(), clone = el.cloneNode(true), meta = take(nameOf(el), {kind: 'dom'});
    clean(clone); flatten(clone, all); clone.setAttribute('data-sb-root', meta.key);
    layers.push({...meta, html: wrap(clone.outerHTML, chain), box: {x: num((r.left - S.left) / unit), y: num((r.top - S.top) / unit), w: num(r.width / unit), h: num(r.height / unit)}});
  };
  const cap = stage.querySelector('.cb-caption'), g = stage.querySelector('.cb-layer g');
  const drawn = !!g && g.children.length > 0;
  let bubble = null, bubbleAt = null;// the bubble sits where the demo's bubble layer is: under the ripple and the hand
  for (const child of stage.children) {
    if (child.classList.contains('cb-layer')) { bubbleAt = layers.length; continue; }
    if (child.matches('canvas.ad-stars,.cb-caption')) continue;
    if (child.classList.contains('iq-camera')) { for (const c of child.children) addDom(c, [child]); continue; }
    addDom(child, [], !child.classList.contains('es-title'));
  }
  if (cap && shown(cap)) {
    const keep = [cap.style.scale, cap.style.rotate, cap.style.transformOrigin];
    cap.style.scale = ''; cap.style.rotate = '';
    const r = cap.getBoundingClientRect();
    const clone = cap.cloneNode(true);
    [cap.style.scale, cap.style.rotate, cap.style.transformOrigin] = keep;
    clean(clone); flatten(clone, drawn); clone.style.scale = ''; clone.style.rotate = ''; clone.style.transformOrigin = '';
    const box = {x: num((r.left - S.left) / unit), y: num((r.top - S.top) / unit), w: num(r.width / unit), h: num(r.height / unit)};
    if (drawn) {
      const tip = g.dataset.tip ? g.dataset.tip.split(',').map(Number).map(num) : null;
      clone.setAttribute('data-sb-root', 'bubble');
      bubble = {kind: 'bubble', key: 'bubble', name: 'Chat bubble', html: clone.outerHTML, box, style: g.dataset.style || 'yellow', tip};
      // a tail on its way out (how far it reaches) or fading (how much of it shows)
      if (tip && g.dataset.reach) bubble.reach = Number(g.dataset.reach);
      if (tip && g.dataset.tailOpacity) bubble.tailOpacity = Number(g.dataset.tailOpacity);
    } else if (clone.textContent.split(String.fromCharCode(8203)).join('').trim()) {// plain words, once they show
      const meta = take({key: 'words', name: 'Words'}, {kind: 'dom'});
      clone.setAttribute('data-sb-root', meta.key);
      layers.push({...meta, html: clone.outerHTML, box});
    }
  }
  if (bubble) layers.splice(bubbleAt ?? layers.length, 0, bubble);
  // One clean copy of each UI element at its biggest, fully in view and fully opaque;
  // of equal size, the most settled (the most parts of it showing: no cards still
  // popping in). Only sent when it beats the best so far (bests: id -> {area, vis}).
  const opaque = el => { let o = 1; for (let e = el; e && e !== stage; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const found = [];
  for (const part of parts) {
    let best = null;
    for (const el of stage.querySelectorAll(part.sel)) {
      if (!shown(el) || el.offsetWidth < 8 || el.offsetHeight < 8 || opaque(el) < 0.98) continue;
      const r = el.getBoundingClientRect(), w = r.width / unit, h = r.height / unit, x = (r.left - S.left) / unit, y = (r.top - S.top) / unit;
      if (x < -0.08 * w || y < -0.08 * h || x + w > 1600 + 0.08 * w || y + h > 900 + 0.08 * h) continue;
      if (!best || w * h > best.area) best = {el, area: w * h, w, k: w / el.offsetWidth};
    }
    if (!best) continue;
    const before = bests[part.id] ?? {area: 0, vis: 0};
    if (best.area < before.area - 1) continue;
    const vis = [...best.el.querySelectorAll('*')].filter(c => parseFloat(getComputedStyle(c).opacity) >= 0.98).length;
    if (!(best.area > before.area + 1 || vis > before.vis)) continue;
    const clone = best.el.cloneNode(true), st = clone.style;
    clean(clone); flatten(clone, true);
    // a part is shown at rest: lists back at the top (no scroll), the knowledge base as its list
    clone.querySelectorAll('.iq2-m-content, .iq2-m-summary, .iq-bp-list').forEach(e => { e.style.transform = ''; e.style.boxShadow = ''; });
    clone.querySelectorAll('.iq2-kb-viewer').forEach(e => e.remove());
    for (const prop of ['transform', 'translate', 'left', 'top', 'right', 'bottom', 'filter', 'opacity', 'clipPath', 'willChange', 'zIndex']) st[prop] = '';
    // where it sits is the wrapper's job: pin everything the demo's CSS might move it by
    st.position = 'relative'; st.margin = '0'; st.left = '0'; st.top = '0'; st.right = 'auto'; st.bottom = 'auto'; st.transform = 'none'; st.translate = 'none';
    // a size container (the knowledge base panel) has no size of its own: keep the one it has
    if (/size/.test(getComputedStyle(best.el).containerType)) { st.boxSizing = 'border-box'; st.width = `${best.el.offsetWidth}px`; st.height = `${best.el.offsetHeight}px`; }
    found.push({id: part.id, name: part.name, category: part.category, keywords: part.keywords, html: clone.outerHTML, w: best.el.offsetWidth, h: best.el.offsetHeight, k: Math.round(best.k * 1000) / 1000, area: Math.round(best.area), vis, ctx: {stageClass: stage.className, scene: {id: stage.dataset.scene || (/ev2-scene-([a-z0-9-]+)/.exec(stage.className) || [])[1] || null, view: stage.dataset.view || null}}});
  }
  const scene = stage.dataset.scene || (/ev2-scene-([a-z0-9-]+)/.exec(stage.className) || [])[1] || null;
  const shell = stage.closest('.es-player');
  return {scene: {id: scene, view: stage.dataset.view || null}, layers, parts: found, stage: {className: stage.className, style: stage.getAttribute('style') ?? '', shell: shell ? shell.className : 'es-player'}, rect: {x: S.left, y: S.top, w: S.width, h: S.height}};
}

// Runs inside /storyboard-ui: every [data-ui] piece, cleaned, with its size.
function extractUi() {
  return [...document.querySelectorAll('[data-ui]')].map(wrap => {
    const el = wrap.firstElementChild, clone = el.cloneNode(true), st = clone.style;
    clone.querySelectorAll('canvas,script,noscript,.mi-recording-controls,.mi-announcement').forEach(n => n.remove());
    clone.querySelectorAll('[tabindex]').forEach(n => n.removeAttribute('tabindex'));
    clone.querySelectorAll('img[loading]').forEach(n => n.removeAttribute('loading'));
    const w = el.offsetWidth, h = el.offsetHeight;
    st.position = 'relative'; st.margin = '0'; st.left = '0'; st.top = '0'; st.transform = 'none'; st.width = w + 'px'; st.height = h + 'px';
    // a tablet or phone is cropped to the device itself (its box is bigger than what it draws)
    const device = el.matches('.tbl-tablet, .ph-phone') ? el : el.querySelector('.tbl-tablet, .ph-phone'), b = el.getBoundingClientRect();
    let crop = null;
    if (device) { const r = device.getBoundingClientRect(); if (r.width < b.width - 2 || r.height < b.height - 2) crop = {x: Math.round(r.left - b.left), y: Math.round(r.top - b.top), w: Math.round(r.width), h: Math.round(r.height)}; }
    return {id: wrap.dataset.ui, name: wrap.dataset.name, category: wrap.dataset.category, keywords: wrap.dataset.keywords || '', html: clone.outerHTML, w, h, k: 1, crop, ctx: null};
  });
}
// Runs inside a web app page (/running): the whole app, cleaned.
function extractWeb() {
  const el = document.querySelector('main.ow-workspace'), clone = el.cloneNode(true), st = clone.style;
  clone.querySelectorAll('canvas,script,noscript').forEach(n => n.remove());
  clone.querySelectorAll('[tabindex]').forEach(n => n.removeAttribute('tabindex'));
  const w = el.offsetWidth, h = el.offsetHeight;
  st.position = 'relative'; st.margin = '0'; st.left = '0'; st.top = '0'; st.transform = 'none'; st.width = w + 'px'; st.height = h + 'px';
  return {html: clone.outerHTML, w, h};
}

// ---- Node side ---------------------------------------------------------------
const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const browser = BROWSERS.find(existsSync);
if (!browser) { console.error('No Chrome or Edge found. Set CHROME_PATH.'); process.exit(1); }
if (!VIDEOS.length) { console.error('No such video.'); process.exit(1); }

// public/storyboard/ui-parts.json: one entry per piece of UI. `source` says where it came from
// ('ui' the catalog page, 'web' the web app, 'video:<id>' a video); each source is made again on its own.
const PARTS_FILE = 'public/storyboard/ui-parts.json';
async function readParts() {
  try { return Object.fromEntries(Object.entries(JSON.parse(await readFile(PARTS_FILE, 'utf8'))).filter(([, p]) => p.source)); } catch { return {}; }
}
// The pieces taken from a video: the one that shows biggest wins.
async function keepParts(found, video) {
  const all = await readParts(), source = `video:${video}`;
  for (const [id, part] of Object.entries(found)) if (!all[id] || all[id].source === source || part.area > all[id].area) all[id] = {...part, source};
  for (const [id, part] of Object.entries(all)) if (part.source === source && !found[id]) delete all[id];
  await writeFile(PARTS_FILE, JSON.stringify(all));
}
// All the pieces of a source, in the order given, ahead of the others.
async function replaceParts(source, items) {
  const rest = Object.fromEntries(Object.entries(await readParts()).filter(([, p]) => p.source !== source));
  await writeFile(PARTS_FILE, JSON.stringify({...Object.fromEntries(items.map(p => [p.id, {...p, source}])), ...rest}));
}
const hash = html => createHash('sha1').update(html).digest('hex').slice(0, 12);
const profile = await mkdtemp(path.join(tmpdir(), 'storyboard-'));
const child = spawn(browser, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--disable-gpu', '--force-device-scale-factor=1', 'about:blank'], {stdio: 'ignore'});
const stop = async () => { child.kill(); await sleep(400); await rm(profile, {recursive: true, force: true}).catch(() => {}); };

try {
  for (let tries = 0; ; tries++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { if (tries > 60) throw new Error('The browser did not start.'); await sleep(200); }
  }
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {method: 'PUT'})).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, {once: true}));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); } });
  const send = (method, params = {}) => new Promise(resolve => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({id: i, method, params})); });
  const evaluate = async (expression, awaitPromise = false) => {
    const reply = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise});
    if (reply.result?.exceptionDetails) throw new Error(JSON.stringify(reply.result.exceptionDetails).slice(0, 500));
    return reply.result?.result?.value;
  };
  await send('Emulation.setDeviceMetricsOverride', {width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false});
  await send('Page.enable');
  const open = async (url, ready, wait = 2500) => {
    await send('Page.navigate', {url: 'about:blank'});
    await send('Page.navigate', {url});
    for (let waited = 0; waited < 120000 && !(await evaluate(ready)); waited += 400) await sleep(400);
    await sleep(wait);
  };
  const viewport = (width, height) => send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});

  // the product's UI piece by piece, from the catalog page and the web app
  const captureUi = async () => {
    console.log('\n== UI pieces (/storyboard-ui)');
    await viewport(1800, 1000);
    await open(`${base}/storyboard-ui`, 'document.querySelectorAll("[data-ui]").length > 0');
    const items = await evaluate(`(${extractUi.toString()})()`);
    console.log(`${items.length} pieces: ${items.map(p => p.name).join(', ')}`);
    const web = [];
    await viewport(1440, 900);
    for (const [name, url, keywords] of [['Web overview', '/running', 'home start'], ['Web missions', '/running?section=missions', 'library marketplace builder processes'], ['Web reports', '/running?section=reports', 'usage report'], ['Web dashboards', '/running?section=dashboards', 'charts']]) {
      await open(`${base}${url}`, '!!document.querySelector("main.ow-workspace")', 2500);
      const page = await evaluate(`(${extractWeb.toString()})()`);
      web.push({id: slug(name), name, category: 'Web app', keywords, ...page, k: Math.round(Math.min(1, 1500 / page.w, 860 / page.h) * 1000) / 1000, ctx: null});
      console.log(`${name}: ${page.w} x ${page.h}`);
    }
    await replaceParts('ui', items);
    await replaceParts('web', web);
    await viewport(1700, 1000);
  };
  // a picture of every piece, made from the HTML that will be added (so it is what you get)
  const makeThumbs = async () => {
    const all = Object.values(await readParts());
    await mkdir('public/storyboard/ui', {recursive: true});
    await viewport(1800, 1000);
    await open(`${base}/storyboard-ui?thumbs=1`, `document.querySelectorAll("[data-thumb]").length >= ${all.length}`, 3000);
    const boxes = JSON.parse(await evaluate('JSON.stringify([...document.querySelectorAll("[data-thumb]")].map(e => { const r = e.getBoundingClientRect(); return {id: e.dataset.thumb, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height}; }))'));
    for (const b of boxes) {
      const shot = await send('Page.captureScreenshot', {format: 'jpeg', quality: 82, captureBeyondViewport: true, clip: {x: b.x, y: b.y, width: b.w, height: b.h, scale: Math.min(2, 1100 / b.w)}});
      await writeFile(`public/storyboard/ui/${b.id}.jpg`, Buffer.from(shot.result.data, 'base64'));
    }
    console.log(`\n${boxes.length} thumbnails -> public/storyboard/ui/`);
    await viewport(1700, 1000);
  };

  if (!partsOnly) for (const VIDEO of VIDEOS) {
    const planned = planVideo(VIDEO).filter(f => !only?.length || only.includes(f.chapter));
    const outDir = `public/storyboard/${VIDEO.id}`;// the frames' pictures; the layers are public/storyboard/<video>.json
    await mkdir(outDir, {recursive: true});
    console.log(`\n== ${VIDEO.name}: ${planned.length} frames planned`);
    await send('Page.navigate', {url: 'about:blank'});
    await send('Page.navigate', {url: `${base}${VIDEO.page}`});
    for (let waited = 0; waited < 90000 && !(await evaluate('!!document.querySelector("input.ad-scrub")')); waited += 400) await sleep(400);
    await sleep(800);
    await evaluate('(()=>{const r=document.querySelector("input.ad-scrub");r.step="any";})()');

    const assets = {}, html = {}, frames = [], bests = {}, found = {}, pinned = await pinnedOf(VIDEO.id);
    let stageInfo = null, last = null; // last: the last frame kept, its words and its small picture
    for (const [n, frame] of planned.entries()) {
      await evaluate(`(async()=>{
        const range=document.querySelector("input.ad-scrub");
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(range,${frame.time});
        range.dispatchEvent(new Event("input",{bubbles:true}));
        for(let i=0;i<4;i++)await new Promise(r=>requestAnimationFrame(r));
        await new Promise(r=>setTimeout(r,160));
        for(let i=0;i<2;i++)await new Promise(r=>requestAnimationFrame(r));
      })()`, true);
      const out = await evaluate(`(${extract.toString()})(${JSON.stringify(VIDEO.stage)}, ${JSON.stringify(bests)}, ${JSON.stringify(PARTS)})`);
      for (const part of out.parts) { bests[part.id] = {area: part.area, vis: part.vis}; found[part.id] = {...part, video: VIDEO.id}; }
      if (out.scene.id !== frame.chapter) console.warn(`! ${frame.id}: the player shows "${out.scene.id}" at ${frame.time}s`);
      stageInfo ??= out.stage;
      const layers = out.layers.map(layer => {
        const {html: source, ...rest} = layer, key = hash(source);
        html[key] = source;
        return {...rest, asset: key};
      });
      // a boxed chapter has no tail to show on its own
      if (frame.kind === 'tail' && !layers.some(l => l.kind === 'bubble' && l.tip)) { console.log(`- ${frame.id} has no tail`); continue; }
      // what it shows, without the hand and its ripple: its words (no digits) and a small picture
      const words = await evaluate(`(()=>{document.querySelectorAll('.dh-hand,.dh-ripple').forEach(e=>{e.style.visibility='hidden';});return (document.querySelector(${JSON.stringify(VIDEO.stage)})?.innerText??'').replace(/[0-9]/g,'').replace(/\\s+/g,' ').trim();})()`);
      const small = `data:image/png;base64,${(await send('Page.captureScreenshot', {format: 'png', clip: {x: out.rect.x, y: out.rect.y, width: out.rect.w, height: out.rect.h, scale: SMALL / out.rect.w}})).result.data}`;
      await evaluate(`document.querySelectorAll('.dh-hand,.dh-ripple').forEach(e=>{e.style.visibility='';})`);
      // nothing new since the last frame kept in this chapter: one of the two goes
      const keep = KEPT.has(frame.kind) || pinned.has(frame.id);
      if (!keep && last && last.frame.chapter === frame.chapter && last.words === words) {
        const share = await evaluate(`(${differ.toString()})(${JSON.stringify(last.small)}, ${JSON.stringify(small)}, ${SHIFT}, 48)`, true);
        if (share < SAME) {
          const before = last.frame;
          if (KEPT.has(before.kind) || pinned.has(before.id) || (RANK[frame.kind] ?? 0) <= (RANK[before.kind] ?? 0)) { console.log(`- ${frame.id} shows nothing new (${(share * 100).toFixed(2)}% differs from ${before.id})`); continue; }
          frames.pop(); // the one before shows the same, less well: this one takes its place
          console.log(`- ${before.id} gives way to ${frame.id} (${(share * 100).toFixed(2)}% differs)`);
        }
      }
      last = {frame, words, small};
      const shot = await send('Page.captureScreenshot', {format: 'jpeg', quality: 62, clip: {x: out.rect.x, y: out.rect.y, width: out.rect.w, height: out.rect.h, scale: 640 / out.rect.w}});
      const file = frame.id.replace('/', '--') + '.jpg';
      await writeFile(path.join(outDir, file), Buffer.from(shot.result.data, 'base64'));
      frames.push({...frame, scene: out.scene, stageClass: out.stage.className, thumb: `/storyboard/${VIDEO.id}/${file}`, layers});
      console.log(`✓ ${String(n + 1).padStart(3)}/${planned.length} ${frame.id} (${layers.map(l => l.key).join(', ')})`);
    }
    // renumber after dropping repeats; only the layers and pictures of the frames kept stay
    frames.forEach((f, i) => { f.n = i + 1; });
    for (const f of frames) for (const l of f.layers) assets[l.asset] = html[l.asset];
    const pictures = new Set(frames.map(f => path.basename(f.thumb)));
    for (const file of await readdir(outDir)) if (file.endsWith('.jpg') && !pictures.has(file)) await rm(path.join(outDir, file));
    const titleOf = s => ASSETS.find(a => a.id === `${VIDEO.id}/${s.id}`)?.title ?? s.text.replace(/\s+/g, ' ').trim();
    const chapters = VIDEO.story.filter(s => frames.some(f => f.chapter === s.id)).map(s => ({id: s.id, number: s.number, title: titleOf(s), words: s.text.replace(/\s+/g, ' ').trim(), start: s.start, end: s.end}));
    const data = {version: 1, video: VIDEO.id, name: VIDEO.name, size: [1600, 900], stage: stageInfo, chapters, frames, assets, generated: new Date().toISOString()};
    const file = `public/storyboard/${VIDEO.id}.json`;
    await writeFile(file, JSON.stringify(data));
    await keepParts(found, VIDEO.id);
    console.log(`\n${VIDEO.name}: ${frames.length} frames, ${Object.keys(assets).length} distinct layers -> ${file}`);
  }
  await captureUi();
  await makeThumbs();
  ws.close();
} finally { await stop(); }
