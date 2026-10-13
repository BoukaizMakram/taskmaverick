#!/usr/bin/env node
// Makes the storyboard's frames look like the model the user designed (the "split" design: a dark metal
// gradient, a plate over the left part holding the frame's art, the words on the right in white handwriting
// with no chat box; lib/storyboardSplit.mjs, docs/storyboard.md). It reads the model frame (Scratch, frame 3:
// knowledge/bubble#3) for the background, the plate, the words' look, the iPad's frame and where the art and the
// words go, then, for every frame of the lines it is asked for, measures the frame in a headless browser (the
// site must be running), decides where its art goes and saves the edits the way the page and
// scripts/storyboard.mjs do (the board's revision; a backup first). Nothing it does is lost by running it
// again: a frame already made like the model stays as it is. The line named "Scratch" is never touched.
//
//   node scripts/storyboard-split.mjs [--video improved-quality-v2|increased-efficiency-v2|all]
//        [--lines id,title,...]   only these lines          [--skip id,title,...]  (default: Scratch, Fonts, Animations)
//        [--model <frame id>]     (default knowledge/bubble#3)   [--panel-away <line ids>]  (lines whose slides with no words have the dark panel off the right edge, so it comes in from the right when something is said: default knowledge)   [--backdrop <frame id>]  (the two layers behind the art: default knowledge/bubble#9, the Fonts line's slide 2)   [--site http://localhost:3000]   [--dry]
import {spawn} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {promises as fs} from 'node:fs';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {layersOf, linesOf, orderedFrames, setBackground} from '../lib/storyboardEdits.mjs';
import {storyboardStore} from '../lib/storyboardStore.mjs';
import {applyFrame, centerOf, fitLine, isOverlay, isPlateLike, isTitle, place, unionOf} from '../lib/storyboardSplit.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS = ['improved-quality-v2', 'increased-efficiency-v2'];
const store = storyboardStore(path.join(ROOT, 'content', 'storyboard'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fail = message => { console.error(message); process.exit(1); };
const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const round = n => Math.round(n * 100) / 100;

const flags = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a === '--dry') flags.dry = true; else if (a.startsWith('--')) flags[a.slice(2)] = process.argv[++i]; }
const SITE = (flags.site ?? 'http://localhost:3000').replace(/\/$/, ''), MODEL = flags.model ?? 'knowledge/bubble#3', BACKDROP = flags.backdrop ?? 'knowledge/bubble#9';
const list = text => String(text ?? '').split(',').map(s => norm(s)).filter(Boolean);
const SKIP = list(flags.skip ?? 'Scratch,Fonts,Animations'), AWAY = list(flags['panel-away'] ?? 'knowledge'), ONLY = list(flags.lines);
const videos = !flags.video || flags.video === 'all' ? VIDEOS : [flags.video];
for (const v of videos) if (!VIDEOS.includes(v)) fail(`Unknown video "${v}": ${VIDEOS.join(', ')}`);
const PAGE_JS = readFileSync(path.join(ROOT, 'scripts', 'storyboard-split.page.js'), 'utf8');

// ---- The board as the page lays it out ----
async function loadBoard(video) {
  const {edits, rev} = await store.read(video);
  const captured = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'storyboard', `${video}.json`), 'utf8'));
  const lines = linesOf(captured.chapters, edits), frames = orderedFrames(captured.frames, edits, lines.map(l => l.id));
  return {video, edits, rev, lines, frames};
}
const lineIs = (line, names) => names.includes(norm(line.id)) || names.includes(norm(line.title));
// save `change(edits)` on a board, again from the fresh file when the page or another session saved meanwhile
async function save(video, change, reason = 'save') {
  for (let i = 0; i < 8; i++) {
    const {edits, rev} = await store.read(video), done = await store.write(video, change(edits), {rev, reason});
    if (!done.conflict) return done.rev;
    await sleep(300);
  }
  fail(`${video} kept changing: run it again.`);
}

// ---- The browser ----
async function launch() {
  const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
  const exe = candidates.find(existsSync);
  if (!exe) fail('No Chrome or Edge found. Set CHROME_PATH.');
  const port = 9600 + Math.floor(Math.random() * 300), profile = await mkdtemp(path.join(tmpdir(), 'sbsplit-'));
  const child = spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--disable-gpu', '--force-device-scale-factor=1', 'about:blank'], {stdio: 'ignore'});
  for (let t = 0; ; t++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { if (t > 60) fail('The browser did not start.'); await sleep(200); } }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json(), ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, {once: true}));
  let id = 0;
  const pending = new Map(), send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params})); });
  ws.addEventListener('message', async event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Fetch.requestPaused') { const {requestId, request} = m.params; await (request.method === 'GET' ? send('Fetch.continueRequest', {requestId}) : send('Fetch.failRequest', {requestId, errorReason: 'BlockedByClient'})); } // (the page never saves from here)
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800));
    return r.result?.result?.value;
  };
  await send('Fetch.enable', {patterns: [{urlPattern: `${SITE}/api/storyboard*`, requestStage: 'Request'}]});
  await send('Emulation.setDeviceMetricsOverride', {width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false});
  await send('Page.enable');
  return {
    evaluate,
    // the board of a video, its frames drawn live (`ids`: the ones we need), seen 1:1, fonts in
    async open(video, ids) {
      await send('Page.navigate', {url: 'about:blank'});
      await send('Page.navigate', {url: `${SITE}/storyboard?video=${video}`});
      for (let w = 0; w < 120000 && !(await evaluate(`document.querySelectorAll('[data-frame]').length > 0`)); w += 400) await sleep(400);
      await evaluate(PAGE_JS);
      let last = -1, still = 0;
      for (;;) {
        const n = await evaluate(`window.__split.liveCount(${JSON.stringify(ids)})`);
        if (n >= ids.length) break;
        still = n === last ? still + 1 : 0; last = n;
        if (still > 40) { console.log(`  (${ids.length - n} frames did not draw: they are left out)`); break; }
        await sleep(500);
      }
      await evaluate(`window.__split.actual()`);
      if (!(await evaluate(`window.__split.preload()`))) console.log('  (the handwriting font did not load: words may be measured wrong)');
      await sleep(600);
    },
    async close() { try { ws.close(); } catch {} child.kill(); await sleep(400); await rm(profile, {recursive: true, force: true}).catch(() => {}); },
  };
}

// ---- The model ----
async function deriveDesign(browser) {
  const b = await loadBoard('improved-quality-v2'), frame = b.frames.find(f => f.id === MODEL), rec = b.edits.frames[MODEL];
  if (!frame || !rec) fail(`The model frame ${MODEL} is not on the Improved Quality board.`);
  const layers = layersOf(frame, rec), names = Object.fromEntries(layers.map(l => [l.key, l.name]));
  const plateLayer = layers.find(l => isPlateLike(rec, l) && (rec.moves?.[l.key] || rec.sizes?.[l.key])), bubbleLayer = layers.find(l => l.kind === 'bubble'), tablet = layers.find(l => /^tablet$/i.test(l.name));
  if (!rec.background || !plateLayer || !bubbleLayer || !tablet) fail(`The model ${MODEL} needs a background, a plate, a chat box and a tablet.`);
  const size = rec.sizes?.[plateLayer.key] ?? [plateLayer.box.w, plateLayer.box.h], at = rec.moves?.[plateLayer.key] ?? [0, 0];
  const plate = {box: {x: round(plateLayer.box.x + at[0]), y: round(plateLayer.box.y + at[1]), w: size[0], h: size[1]}, fill: rec.styles[plateLayer.key].fill};
  const own = rec.styles?.[bubbleLayer.key] ?? {};
  const text = {styles: Object.fromEntries(['strokeWidth', 'fill', 'stroke', 'color', 'font', 'size'].filter(k => own[k] != null).map(k => [k, own[k]]))};
  if (!text.styles.size || !text.styles.font) fail(`The model's chat box needs a font and a size.`);
  await browser.open('improved-quality-v2', [MODEL]);
  const m = await browser.evaluate(`JSON.stringify(window.__split.measure(${JSON.stringify(MODEL)}))`).then(JSON.parse);
  if (!m) fail(`The model ${MODEL} is not drawn on the page.`);
  const art = unionOf(m.roots.filter(r => r.mode !== 'bubble' && !isOverlay(names[r.key]) && !isTitle(names[r.key])).map(r => r.paint)), words = m.roots.find(r => r.mode === 'bubble');
  if (!art || !words?.words) fail('Could not measure the model.');
  const screenKey = m.roots.flatMap(r => r.screens ?? [])[0], screenScale = rec.scales?.[screenKey]?.[0] ?? 1; // (the model's screen is a bit bigger than its frame's cutout: a thinner frame)
  const x0 = Math.max(0, plate.box.x), x1 = Math.min(1600, plate.box.x + plate.box.w); // (where the art centers: the old model's plate)
  // the two layers behind the art (the user, 2026-10-08): a light plate over the whole slide, a darker panel over its right side
  const brec = b.edits.frames[BACKDROP], bframe = b.frames.find(f => f.id === BACKDROP);
  if (!brec || !bframe) fail(`The backdrop frame ${BACKDROP} is not on the Improved Quality board.`);
  const rects = layersOf(bframe, brec).filter(l => isPlateLike(brec, l)).map(l => {
    const sz = brec.sizes?.[l.key] ?? [l.box.w, l.box.h], mv = brec.moves?.[l.key] ?? [0, 0];
    return {box: {x: round(l.box.x + mv[0]), y: round(l.box.y + mv[1]), w: sz[0], h: sz[1]}, fill: brec.styles[l.key].fill};
  }).sort((p, q) => q.box.w * q.box.h - p.box.w * p.box.h);
  if (rects.length !== 2) fail(`The backdrop ${BACKDROP} needs exactly two big rectangles (a light plate, a dark panel), it has ${rects.length}.`);
  const slot = {x: round(art.l), y: round(art.t), w: round(art.r - art.l), h: round(art.b - art.t)};
  return {
    background: rec.background, plate: rects[0], panel: rects[1], slot, plateCenterX: round((x0 + x1) / 2),
    text: {center: {x: round((words.words.l + words.words.r) / 2), y: round((words.words.t + words.words.b) / 2)}, styles: text.styles, pad: 30},
    // a title's words keep the demos' own title font, Poppins bold, as it was before (the user, 2026-10-08), white; the size is the one measured (so a second run leaves it)
    title: {styles: {font: 'poppins', color: text.styles.color, weight: 700}, scale: 1},
    bezel: rec.styles?.[tablet.key]?.bezel ?? null, screenScale, headerScale: 1.1,
  };
}

// ---- One board ----
async function split(video, design, browser) {
  const b = await loadBoard(video), lines = b.lines.filter(l => !lineIs(l, SKIP) && (!ONLY.length || lineIs(l, ONLY)));
  const targets = lines.flatMap(l => b.frames.filter(f => f.chapter === l.id));
  console.log(`\n== ${video}: ${targets.length} frames in ${lines.length} lines${b.lines.length > lines.length ? ` (left alone: ${b.lines.filter(l => !lines.includes(l)).map(l => l.title).join(', ')})` : ''}`);
  if (!targets.length) return;
  if (!flags.dry) {
    const name = await store.backup(video, 'manual');
    console.log(`  backup: ${name}`);
    await save(video, e => targets.reduce((cur, f) => setBackground(cur, f.id, design.background), e)); // (the frames are drawn live from here on)
  }
  await browser.open(video, targets.map(f => f.id));
  const {edits} = await store.read(video), plans = new Map(), notes = [];
  for (const line of lines) {
    const frames = b.frames.filter(f => f.chapter === line.id), measured = new Map();
    for (const f of frames) {
      const m = await browser.evaluate(`JSON.stringify(window.__split.measure(${JSON.stringify(f.id)}))`).then(JSON.parse);
      if (!m) { notes.push(`${f.id}: not drawn, left alone`); continue; }
      const names = Object.fromEntries(layersOf(f, edits.frames[f.id]).map(l => [l.key, l.name]));
      measured.set(f.id, {m, names, art: unionOf(m.roots.filter(r => r.mode !== 'bubble' && !isOverlay(names[r.key]) && !isTitle(names[r.key])).map(r => r.paint))});
    }
    const fits = fitLine(frames.filter(f => measured.has(f.id)).map(f => ({id: f.id, art: measured.get(f.id).art})), design);
    for (const f of frames) {
      const got = measured.get(f.id);
      if (!got) continue;
      const {m, names} = got, fit = fits[f.id], layers = new Map(layersOf(f, edits.frames[f.id]).map(l => [l.key, l]));
      const spec = {roots: {}, bubble: null}, plan = {plate: !!fit, titleBackdrop: false, roots: [], bubble: null, title: [], tablets: null};
      for (const r of m.roots) {
        const name = names[r.key];
        if (r.mode === 'bubble') {
          const own = edits.frames[f.id]?.sizes?.[r.key];
          spec.bubble = {key: r.key, target: design.text.center, fontPx: design.text.styles.size, color: design.text.styles.color, pad: design.text.pad, size: own ? null : [300, 0]};
        } else if (isTitle(name)) plan.title.push({key: r.key, size: round((r.font?.px ?? 44) * design.title.scale)});
        else if (fit && !(layers.get(r.key) && isPlateLike(edits.frames[f.id], layers.get(r.key))) && !/^(plate|panel)$/i.test(name)) spec.roots[r.key] = {mode: r.mode, scale: fit.s, ideal: place(fit, centerOf(r.rect))};
      }
      plan.panel = fit && !spec.bubble && lineIs(line, AWAY) ? 'away' : undefined; // (nothing said in this slide: the dark panel is off the right edge)
      plan.titleBackdrop = !fit && plan.title.length > 0; // (a slide of only words: the same two layers, the dark one over the whole slide)
      const done = await browser.evaluate(`JSON.stringify(window.__split.apply(${JSON.stringify(f.id)}, ${JSON.stringify(spec)}))`).then(JSON.parse);
      if (!done) { notes.push(`${f.id}: could not be placed`); continue; }
      plan.roots = Object.entries(done.roots).map(([key, v]) => ({key, translate: v.translate, scale: v.scale, size: v.size}));
      if (spec.bubble && done.bubble) plan.bubble = {key: spec.bubble.key, translate: done.bubble.translate, size: spec.bubble.size};
      const tablets = m.roots.filter(r => r.mode !== 'bubble' && !isTitle(names[r.key]));
      const kit = {roots: tablets.filter(r => r.tablet).map(r => r.key), screens: tablets.flatMap(r => r.screens ?? []), tabs: tablets.flatMap(r => r.tabs ?? []).map(t => ({key: t.key, size: round(t.size * design.headerScale)})), chips: tablets.flatMap(r => r.chips ?? [])};
      if (kit.roots.length || kit.screens.length || kit.tabs.length || kit.chips.length) plan.tablets = kit;
      plans.set(f.id, plan);
      console.log(`  ${f.id.padEnd(26)} ${fit ? `art ${Math.round(got.art.r - got.art.l)}x${Math.round(got.art.b - got.art.t)} -> x${round(fit.s)} at ${Math.round(fit.to.x)},${Math.round(fit.to.y)}` : 'no art'.padEnd(30)}${spec.bubble ? `  words at ${Math.round(done.bubble.middle.x)},${Math.round(done.bubble.middle.y)}` : ''}${plan.title.length ? '  title' : ''}`);
    }
  }
  for (const n of notes) console.log(`  ! ${n}`);
  if (flags.dry) { console.log('  (dry run: nothing saved)'); return; }
  const frames = new Map(b.frames.map(f => [f.id, f]));
  const rev = await save(video, e => [...plans].reduce((cur, [id, plan]) => applyFrame(cur, frames.get(id), plan, design), e));
  console.log(`  saved: ${plans.size} frames, revision ${rev}`);
}

const browser = await launch();
try {
  const design = await deriveDesign(browser);
  console.log('The model:', JSON.stringify({plate: design.plate.box, slot: design.slot, plateCenterX: design.plateCenterX, text: design.text.center, font: design.text.styles.size, weight: design.title.styles.weight, screenScale: design.screenScale}));
  for (const video of videos) await split(video, design, browser);
} finally { await browser.close(); }
