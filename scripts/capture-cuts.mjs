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
const SITE = option('site', 'http://localhost:3000').replace(/\/$/, ''), BOARD = option('cut', 'increased-efficiency-v3');
const ROW = option('row', 'ie-v4'), TITLE = option('title', 'Increased Efficiency · Variation 4');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'public', 'storyboard', `${ALL_STORYBOARDS}.json`);
const PORT = 9400 + Math.floor(Math.random() * 600), sleep = ms => new Promise(r => setTimeout(r, ms));
// The cut as its board has it: its retyped words, its layout. The layout: `--layout <name>` ('none': the cut's own), else the one the row was made with (a row made again stays the same film: the
// row "ie-v4" is Variation 4's even while Increased Efficiency plays its cut redone from the storyboard, the layout 'storyboard'), else the one of the variation that plays
let edits = {};
try { edits = JSON.parse(await readFile(path.join(ROOT, 'content', 'storyboard', `${BOARD}.json`), 'utf8')); } catch {}
let made = null;
try { made = JSON.parse(await readFile(OUT, 'utf8')).chapters?.find(c => c.id === ROW)?.cut ?? null; } catch {}
const asked = option('layout', undefined);
const layout = asked !== undefined ? (asked === 'none' ? null : asked) : made && made.board === BOARD ? made.layout ?? null : cutLayoutOf(edits);
const cut = cutFor(BOARD, layout);
if (!cut) { console.error(`${BOARD} has no Remotion cut (lib/remotion/cuts.mjs).`); process.exit(1); }
const words = cutWordsOf(edits, cut.id), plan = cut.make(words, {layout});
// The scenes: the title once its yellow line is drawn, then each sentence once its words are written and what it shows is done (its outlines still on)
const scenes = [{id: 'title', label: plan.title.lines.join(' '), t: plan.B.mark + 0.7},
  ...plan.captions.map(c => ({id: c.id, label: `${c.kicker ? `${c.kicker}: ` : ''}${c.lines.join(' ')}`, t: Math.max(c.written + 0.2, c.until - 0.15)}))];

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
    if (el.classList.contains('rc-rule')) { // the line between the blue label and the sentence: a drawing, picked by its stroke, its color and width in the sidebar's Drawing, its length by its handles
      const cs = getComputedStyle(el), m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/.exec(cs.backgroundColor) || [];
      const hex = `#${[1, 2, 3].map(i => Math.round(Number(m[i]) || 0).toString(16).padStart(2, '0')).join('')}`, alpha = m[4] != null ? Number(m[4]) : 1;
      const pad = 8, w = num(b.w + 2 * pad), h = b.h, x = num(b.x - pad), d = `M${num(w / 2)} 0V${num(h)}`, sw = num(b.w) || 2;
      const name = el.dataset.cutPart, base = slug(name), n = (count[base] = (count[base] ?? 0) + 1), key = n > 1 ? `${base}-${n}` : base;
      const html = `<div data-sb-root="${key}" data-sb-box="drawing" style="position:absolute;left:${x}px;top:${b.y}px;width:${w}px;height:${h}px;pointer-events:none${op < 0.995 ? `;opacity:${num(op)}` : ''}">`
        + `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;width:100%;height:100%;overflow:visible;pointer-events:none">`
        + `<path d="${d}" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
        + `<path data-ink="" d="${d}" fill="none" stroke="${hex}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"${alpha < 1 ? ` stroke-opacity="${alpha}"` : ''}/></svg></div>`;
      return {key, name: n > 1 ? `${name} ${n}` : name, html, box: {x, y: b.y, w, h}};
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
    clone.style.opacity = op > 0.995 ? '' : String(num(op));
    clone.style.zIndex = 'auto';
    const name = el.dataset.cutPart, base = slug(name), n = (count[base] = (count[base] ?? 0) + 1), key = n > 1 ? `${base}-${n}` : base;
    clone.setAttribute('data-sb-root', key);
    return {key, name: n > 1 ? `${name} ${n}` : name, html: clone.outerHTML, box: b};
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
    parts.splice(at + 1, 0, {key, name, html, box: {x, y, w, h}});
  }
  return {parts};
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

  // the frames of the row, one a scene
  const assets = {}, frames = [];
  for (const [i, scene] of scenes.entries()) {
    await evaluate(`window.__cut.show(${JSON.stringify(BOARD)}, ${scene.t}, ${JSON.stringify(words)}, ${JSON.stringify(layout)})`, true);
    const {parts} = await evaluate(`(${takeApart.toString()})()`);
    const layers = parts.map(p => { const key = hash(p.html); assets[key] = p.html; return {key: p.key, name: p.name, kind: 'dom', box: p.box, asset: key}; });
    frames.push({id: `${ROW}/${scene.id}`, chapter: ROW, chapterNumber: 0, kind: 'scene', label: scene.label, time: Math.round(scene.t * 100) / 100, at: Math.round(scene.t * 100) / 100, bubble: null,
      scene: {id: scene.id, view: 'cut'}, layers, n: i + 1});
    console.log(`${String(i + 1).padStart(2)}  ${scene.t.toFixed(2).padStart(6)} s  ${layers.length} pieces  ${scene.label}`);
  }
  ws.close();

  // the board: this row made again, the others as they were (each row is a video)
  let board = null;
  try { board = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
  const rows = (board?.chapters ?? []).filter(c => c.id !== ROW), kept = (board?.frames ?? []).filter(f => f.chapter !== ROW);
  const chapters = [...rows, {id: ROW, number: 0, title: TITLE, words: '', start: 0, end: Math.round(plan.seconds * 100) / 100, cut: {board: BOARD, id: cut.id, layout}}].map((c, i) => ({...c, number: i + 1}));
  const number = new Map(chapters.map(c => [c.id, c.number])), all = [...kept, ...frames].map(f => ({...f, chapterNumber: number.get(f.chapter)}));
  const used = new Set(all.flatMap(f => f.layers.map(l => l.asset))), store = {...(board?.assets ?? {}), ...assets};
  const data = {version: 1, video: ALL_STORYBOARDS, name: ALL_STORYBOARDS_NAME, size: [1600, 900], stage: STORYBOARDS_STAGE, chapters, frames: all,
    assets: Object.fromEntries(Object.entries(store).filter(([k]) => used.has(k))), generated: new Date().toISOString()};
  await writeFile(OUT, JSON.stringify(data));
  console.log(`\n${TITLE}: ${frames.length} frames, ${Object.keys(assets).length} distinct pieces -> public/storyboard/${ALL_STORYBOARDS}.json (the row "${ROW}"; ${chapters.length} row${chapters.length > 1 ? 's' : ''} on the board)`);
} finally { await stop(); }
