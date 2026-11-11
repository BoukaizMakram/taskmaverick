#!/usr/bin/env node
// Makes the frames of the sections' boards (public/storyboard/<board>.json) from the sections' specs (lib/sections/*.mjs): the art of each state is drawn by the stage page
// (/section-stage, components/sections/SectionStage.jsx), taken apart in a headless Chrome, and put together as the frames the storyboard and its videos are made of, the way
// scripts/capture-storyboard.mjs makes the frames of Improved Quality: the art, the yellow outlines, the chat box with the section's words, the cursor and its click, one frame for each
// step (Scene in, Outline on X, Bubble no words, Words, Hand on X, Click X, After the click, End of the chapter), in the split design (a plate over the left, the dark panel over the right).
// The loop is lib/sections/captureCore.mjs (the AI demo call makes the same frames in the visitor's page, with the visitor's data).
//   node scripts/capture-sections.mjs [--site http://localhost:3000] [--section live-oversight] [--only chapter,chapter] [--out file.json]
// The site must be running. What you edit on the board is kept apart (content/storyboard/<board>.json), so running it again does not lose it.
// `--out`: the board is written there instead (one section), and the board's edits are not touched (to compare a capture with the one on disk).
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SECTIONS} from '../lib/sections/index.mjs';
import {captureSection, defaultLooks, extract} from '../lib/sections/captureCore.mjs';
import {storyboardStore} from '../lib/storyboardStore.mjs';

const args = process.argv.slice(2), option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const SHOTS = option('shots', ''); // (a folder: a picture of the art with each outline drawn on it, to look at them)
const OUT = option('out', '');
const SITE = option('site', 'http://localhost:3000').replace(/\/$/, ''), wanted = (option('section', '') ?? '').split(',').filter(Boolean), only = (option('only', '') ?? '').split(',').filter(Boolean);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), store = storyboardStore(path.join(ROOT, 'content', 'storyboard'));
const PORT = Number(option('port', 0)) || 9400 + Math.floor(Math.random() * 600), sleep = ms => new Promise(r => setTimeout(r, ms)); // (a port of its own: several sections can be captured at once)
const sections = SECTIONS.filter(s => !wanted.length || wanted.includes(s.id) || wanted.includes(s.board));
if (!sections.length) { console.error('No such section.'); process.exit(1); }
if (OUT && sections.length > 1) { console.error('--out takes one section (--section <id>).'); process.exit(1); }

// ---- The browser ----
const BROWSERS = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const browser = BROWSERS.find(existsSync);
if (!browser) { console.error('No Chrome or Edge found. Set CHROME_PATH.'); process.exit(1); }
const hash = html => createHash('sha1').update(html).digest('hex').slice(0, 12);
const profile = await mkdtemp(path.join(tmpdir(), 'sections-'));
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
  await send('Page.navigate', {url: `${SITE}/section-stage`});
  for (let waited = 0; waited < 90000 && !(await evaluate('!!window.__stage')); waited += 400) await sleep(400);
  await sleep(800);

  for (const spec of sections) {
    console.log(`\n== ${spec.name} (${spec.board})`);
    // The art at a state, taken apart in the page.
    const draw = async (s, targets) => {
      await evaluate(`window.__stage.show(${JSON.stringify(spec.stage)}, ${JSON.stringify(s)})`, true);
      return evaluate(`(${extract.toString()})(${JSON.stringify(targets)})`);
    };
    const onOutlines = SHOTS ? async (chapter, count, boxes) => { // (the art with its outlines, as the stage draws them: to look at)
      await evaluate(`(() => { const st = document.getElementById('sec-stage'); st.querySelectorAll('.sec-debug').forEach(n => n.remove()); for (const b of ${JSON.stringify(boxes)}) { const d = document.createElement('div'); d.className = 'sec-debug'; d.style.cssText = 'position:absolute;z-index:99;box-sizing:border-box;border:6px solid #ffc800;border-radius:18px;box-shadow:0 0 16px 3px rgb(255 200 0 / 55%);left:' + b.x + 'px;top:' + b.y + 'px;width:' + b.w + 'px;height:' + b.h + 'px'; st.appendChild(d); } })()`);
      const shot = await send('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width: 1600, height: 900, scale: 1}});
      await mkdir(SHOTS, {recursive: true}); await writeFile(path.join(SHOTS, `${spec.board}-${chapter.id}-${count}.png`), Buffer.from(shot.result.data, 'base64'));
      await evaluate(`document.querySelectorAll('.sec-debug').forEach(n => n.remove())`);
    } : null;
    const board = await captureSection(spec, {draw, hash, only, onOutlines, log: text => console.log(text), warn: text => console.warn(text)});
    const data = {...board, generated: new Date().toISOString()};
    if (OUT) { await mkdir(path.dirname(path.resolve(OUT)), {recursive: true}); await writeFile(OUT, JSON.stringify(data)); console.log(`\n${spec.name}: ${data.frames.length} frames -> ${OUT} (the board's edits not touched)`); continue; }
    await mkdir('public/storyboard', {recursive: true});
    await writeFile(`public/storyboard/${spec.board}.json`, JSON.stringify(data));
    // The look the board gives a new frame (the split design's words, the Improved Quality tablet), unless the frame has edits already (what you changed on the board stays).
    const {edits, rev} = await store.read(spec.board);
    await store.write(spec.board, {...edits, frames: defaultLooks(data.frames, edits.frames)}, {rev, reason: 'cli'});
    console.log(`\n${spec.name}: ${data.frames.length} frames, ${Object.keys(data.assets).length} distinct layers -> public/storyboard/${spec.board}.json`);
  }
  ws.close();
} finally { await stop(); }
