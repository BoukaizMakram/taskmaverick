#!/usr/bin/env node
// Export the storyboard's VIDEOS as MP4 files (the user, 2026-10-28: "add a way to export the videos in /storyboard"). It opens the board in a headless Chrome, puts a video on
// each moment of itself (`window.__sbSeek`, the same as dragging its bar), takes the picture of it and gives the pictures to ffmpeg, which makes the file: so the file is
// exactly the video the board plays, at any size, and the same every time (nothing is recorded in real time). The videos are silent. It never saves anything on the board:
// the page's writes to /api/storyboard are blocked. The site must be running in development (the user's dev server: `window.__sbSeek` only exists there).
//
//   node scripts/storyboard-export.mjs --video improved-quality-v2 [--line "The tablet and its Knowledge Base"] [--exact] [--list]
//        [--width 1920] [--fps 30] [--crf 18] [--format jpeg|png] [--out exports/storyboard] [--site http://localhost:3000] [--json]
//
//   --video   the board (the one in /storyboard?video=…); several with commas. --line: the video by its title (the exact title, else every one with those words in it); none: ALL its videos.
//   --exact   --line is a whole title (what the buttons in /storyboard ask for), not words in one
//   --list    only print the titles of the board's videos
//   --width   the file's width in pixels (a multiple of 32, 320 – 3840; 1920 = 1920 x 1080); the video is drawn 1600 x 900 and is taken at that size, not stretched
//   --fps     pictures a second (1 – 60), --crf the quality of H.264 (0 – 51, lower is better, 18 is as good as the eye can tell), --format of the pictures given to ffmpeg
//             (jpeg: fast, png: no loss at all, slower)
//   --json    one JSON object a line (start, progress, done, finished, error) instead of text: what app/api/storyboard/export/route.js reads
//
// Files: <out>/<board>/<title as a file name>.mp4 (exports/storyboard/ by default; it is not kept in git). Needs Chrome or Edge (CHROME_PATH) and ffmpeg (FFMPEG_PATH, the PATH, Shotcut,
// the one the Python package imageio-ffmpeg has; else `winget install Gyan.FFmpeg`). A video of a minute takes a few minutes: about 15 pictures a second.
import {spawn, spawnSync} from 'node:child_process';
import {existsSync, readdirSync} from 'node:fs';
import {mkdir, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DEFAULTS, SCREEN, encoderOf, ffmpegArgs, frameCount, namesOf, optionsOf, sizeOf, timeOf, wanted} from '../lib/storyboardExport.mjs';

const BOOLEAN = new Set(['json', 'list', 'help', 'exact']), flags = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { const name = a.slice(2); flags[name] = BOOLEAN.has(name) ? true : process.argv[++i]; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const emit = event => { if (flags.json) console.log(JSON.stringify(event)); };
const note = text => { if (!flags.json) console.error(text); };
const cleanups = [];
async function cleanUp() { for (const fn of cleanups.splice(0).reverse()) { try { await fn(); } catch { /* it is gone already */ } } }
async function fail(message) { emit({event: 'error', message}); if (!flags.json) console.error(message); await cleanUp(); process.exit(1); }
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { cleanUp().finally(() => process.exit(1)); });

if (flags.help || !flags.video) {
  console.error(`Export the storyboard's videos as MP4 files.\n  node scripts/storyboard-export.mjs --video <board> [--line "<title>"] [--list] [--width 1920] [--fps 30] [--crf 18] [--format jpeg|png] [--out exports/storyboard] [--site http://localhost:3000] [--json]\n  The site must be running in development (npm run dev). Without --line, every video of the board.`);
  process.exit(flags.help ? 0 : 1);
}
const SITE = (flags.site ?? 'http://localhost:3000').replace(/\/$/, ''), options = optionsOf(flags), size = sizeOf(options.width);
const BOARDS = String(flags.video).split(',').map(b => b.trim()).filter(Boolean), OUT = path.resolve(flags.out ?? path.join('exports', 'storyboard'));
const quality = DEFAULTS.quality;

// ---- the programs --------------------------------------------------------------------------------------------------------------------------------------
const browserPath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', path.join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'), 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync);
if (!browserPath) await fail('No Chrome or Edge found. Set CHROME_PATH to its chrome.exe.');

// ffmpeg: the first one (FFMPEG_PATH, the PATH, then the places a copy is known to be) that can make H.264
function findFfmpeg() {
  const names = process.platform === 'win32' ? ['ffmpeg.exe'] : ['ffmpeg'], candidates = [process.env.FFMPEG_PATH];
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) for (const name of names) if (dir) candidates.push(path.join(dir, name));
  candidates.push('C:/Program Files/Shotcut/ffmpeg.exe', 'C:/Program Files (x86)/Shotcut/ffmpeg.exe', 'C:/Program Files/ffmpeg/bin/ffmpeg.exe', 'C:/ffmpeg/bin/ffmpeg.exe');
  const python = path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Python'); // (imageio-ffmpeg: pip install imageio-ffmpeg)
  try { for (const version of readdirSync(python)) { const bins = path.join(python, version, 'Lib', 'site-packages', 'imageio_ffmpeg', 'binaries'); if (existsSync(bins)) for (const file of readdirSync(bins)) if (/^ffmpeg/i.test(file)) candidates.push(path.join(bins, file)); } } catch { /* no Python */ }
  for (const exe of candidates.filter(c => c && existsSync(c))) {
    const listing = spawnSync(exe, ['-hide_banner', '-encoders'], {encoding: 'utf8', timeout: 20000, maxBuffer: 1 << 24 }), encoder = listing.status === 0 ? encoderOf(listing.stdout) : null;
    if (encoder) return {exe, encoder};
  }
  return null;
}
const ffmpeg = flags.list ? null : findFfmpeg();
if (!flags.list && !ffmpeg) await fail('No ffmpeg that can make H.264 was found. Install it (winget install Gyan.FFmpeg) or set FFMPEG_PATH to its ffmpeg.exe.');

// ---- one browser, one board ----------------------------------------------------------------------------------------------------------------------------
async function openBoard(board) {
  const port = 10700 + Math.floor(Math.random() * 300), profile = await mkdtemp(path.join(tmpdir(), 'sbx-'));
  // (the software renderer, like the other checks: the same pictures on every machine)
  const child = spawn(browserPath, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--force-device-scale-factor=1', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', 'about:blank'], {stdio: 'ignore'});
  let ws = null;
  const close = async () => { try { ws?.close(); } catch { /* closed */ } child.kill(); await sleep(400); await rm(profile, {recursive: true, force: true}).catch(() => {}); };
  cleanups.push(close);
  for (let t = 0; ; t++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { if (t > 80) throw new Error('The browser did not start.'); await sleep(200); } }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, {once: true}); ws.addEventListener('error', () => reject(new Error('Could not talk to the browser.')), {once: true}); });
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}, ms = 90000) => new Promise((resolve, reject) => {
    const i = ++id, timer = setTimeout(() => { pending.delete(i); reject(new Error(`The browser did not answer (${method}).`)); }, ms);
    pending.set(i, m => { clearTimeout(timer); resolve(m); });
    ws.send(JSON.stringify({id: i, method, params}));
  });
  ws.addEventListener('close', () => { for (const [, answer] of pending) answer({error: {message: 'The browser closed.'}}); pending.clear(); });
  ws.addEventListener('message', async event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Fetch.requestPaused') { // (nothing the page does is saved)
      const {requestId, request} = m.params;
      try { await send(request.method === 'GET' ? 'Fetch.continueRequest' : 'Fetch.failRequest', request.method === 'GET' ? {requestId} : {requestId, errorReason: 'BlockedByClient'}); } catch { /* the page is gone */ }
    }
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (r.error) throw new Error(r.error.message);
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description?.split('\n')[0] ?? r.result.exceptionDetails.text ?? 'The page raised an error.');
    return r.result?.result?.value;
  };
  await send('Fetch.enable', {patterns: [{urlPattern: `${SITE}/api/storyboard*`, requestStage: 'Request'}]});
  await send('Emulation.setDeviceMetricsOverride', {width: 1700, height: 1100, deviceScaleFactor: 1, mobile: false});
  await send('Page.enable');
  await send('Page.navigate', {url: `${SITE}/storyboard?video=${encodeURIComponent(board)}`});
  let loaded = false;
  for (let w = 0; w < 180000 && !loaded; w += 400) { loaded = await evaluate(`document.querySelectorAll('[data-frame]').length > 3 && document.querySelectorAll('.sb-pl').length > 0`).catch(() => false); if (!loaded) await sleep(400); }
  if (!loaded) throw new Error(`The board "${board}" did not open at ${SITE}. Is the site running (npm run dev) and is the board's name right?`);
  await evaluate('document.fonts.ready.then(() => true)');
  await sleep(2500); // (the frames draw a few at a time)
  return {send, evaluate, close};
}

// ---- one video -----------------------------------------------------------------------------------------------------------------------------------------
const quoted = title => JSON.stringify(title);
const rootOf = title => `[...document.querySelectorAll('.sb-pl')].find(p => p.dataset.sbLine === ${quoted(title)})`;
const raf2 = 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))';

// The picture alone in the browser's window: the board at its own size with the video's corner in the window's corner, and everything round it (the sidebar, the other videos, the
// controls) not painted. Then the video is waited for (it is made ready only when it is on the screen) and its length is read.
async function frame(page, title) {
  await page.send('Emulation.setDeviceMetricsOverride', {width: SCREEN.w, height: SCREEN.h, deviceScaleFactor: size.scale, mobile: false});
  const placed = await page.evaluate(`(() => {
    for (const el of window.__sbxHidden ?? []) el.style.removeProperty('visibility');
    window.__sbxHidden = [];
    const root = ${rootOf(title)};
    if (!root) throw new Error('This board has no video called ' + ${quoted(title)});
    const screen = root.querySelector('.sb-pl-screen'), layers = root.querySelector('.sb-pl-layers'), keep = [screen, layers].filter(Boolean);
    document.getElementById('sbx-css')?.remove();
    const css = document.createElement('style'); css.id = 'sbx-css'; document.head.appendChild(css);
    const rule = move => '.sb-world { transform: ' + move + ' !important; transition: none !important; } html, body { overflow: hidden !important; }';
    css.textContent = rule('none');
    const r = screen.getBoundingClientRect();
    css.textContent = rule('translate(' + (-r.left) + 'px,' + (-r.top) + 'px)');
    const above = new Set();
    for (const k of keep) for (let e = k.parentElement; e; e = e.parentElement) { above.add(e); if (e === document.body) break; }
    for (const e of above) for (const c of e.children) if (!above.has(c) && !keep.includes(c)) { c.style.setProperty('visibility', 'hidden', 'important'); window.__sbxHidden.push(c); }
    const now = screen.getBoundingClientRect();
    return {x: now.left, y: now.top, w: now.width, h: now.height};
  })()`);
  if (Math.abs(placed.x) > 1 || Math.abs(placed.y) > 1 || Math.abs(placed.w - SCREEN.w) > 1 || Math.abs(placed.h - SCREEN.h) > 1) throw new Error(`The video is not where it should be in the window (${Math.round(placed.x)}, ${Math.round(placed.y)}, ${Math.round(placed.w)} x ${Math.round(placed.h)}).`);
  let total = 0;
  for (let w = 0; w < 40000; w += 250) { // (the video is made ready when it comes near the screen: a moment after it was brought there)
    total = Number(await page.evaluate(`(() => {
      const seek = window.__sbSeek?.[${quoted(title)}];
      if (!seek) return -1;
      const screen = ${rootOf(title)}.querySelector('.sb-pl-screen');
      seek(0);
      return screen.childElementCount > 0 ? window.__sbTotal?.[${quoted(title)}]?.() ?? 0 : 0;
    })()`));
    if (total < 0) throw new Error('The page has no way to put a video on a moment of itself: the site must be running in development (npm run dev).');
    if (total > 0) break;
    await sleep(250);
  }
  if (!(total > 0)) throw new Error(`The video "${title}" did not get ready.`);
  await page.evaluate('document.fonts.ready.then(() => true)');
  return total;
}

// The video put on second `t`, and waited for until what it shows has come: its pictures (the first time one is on), the lesson's clip (it is put on its own second)
function settle(title, t) {
  return `(async () => {
    const seek = window.__sbSeek[${quoted(title)}], screen = ${rootOf(title)}.querySelector('.sb-pl-screen'), waited = (window.__sbxWaited ??= new WeakMap());
    // (only what is on the picture is waited for, and for a second and a half at most: a clip or a picture of a slide that is not on, or one that does not come, never holds the video up)
    const seen = el => { let o = 1; for (let e = el; e && e !== screen.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= Number(cs.opacity); } return o; };
    seek(${t});
    await ${raf2};
    for (let k = 0; k < 80; k++) {
      const films = [...screen.querySelectorAll('video')].filter(v => (v.currentSrc || v.getAttribute('src')) && seen(v) > 0.02), pictures = [...screen.querySelectorAll('img')].filter(i => i.getAttribute('src') && seen(i) > 0.02);
      const loading = films.filter(v => v.readyState < 2), busy = [...loading, ...films.filter(v => v.seeking), ...pictures.filter(i => !i.complete)].filter(el => (waited.get(el) ?? 0) < 1500);
      if (!busy.length) break;
      for (const el of busy) waited.set(el, (waited.get(el) ?? 0) + 45);
      await new Promise(r => setTimeout(r, 40));
      if (loading.length) seek(${t}); // (a clip cannot be put on its second before it has loaded)
      await ${raf2};
    }
    await ${raf2};
    return true;
  })()`;
}

async function exportVideo(page, board, title, file) {
  const total = await frame(page, title), count = frameCount(total, options.fps);
  emit({event: 'start', board, title, seconds: total, frames: count, width: size.w, height: size.h});
  note(`${title} (${board}): ${total.toFixed(1)} s, ${count} pictures, ${size.w} x ${size.h}`);
  await mkdir(path.dirname(file), {recursive: true});
  const ff = spawn(ffmpeg.exe, ffmpegArgs({fps: options.fps, format: options.format, crf: options.crf, encoder: ffmpeg.encoder, out: file}), {stdio: ['pipe', 'ignore', 'pipe']});
  let errors = '';
  ff.stderr.on('data', d => { errors = (errors + d).slice(-3000); });
  ff.stdin.on('error', () => {}); // (ffmpeg stopped: its exit says why)
  const stopped = new Promise(resolve => { ff.on('close', code => resolve(code)); ff.on('error', e => { errors += String(e); resolve(-1); }); });
  const kill = () => { if (ff.exitCode === null) ff.kill(); };
  cleanups.push(kill);
  const give = async buffer => { // (to ffmpeg, waiting for it when it is slower than the pictures)
    if (ff.exitCode !== null || ff.stdin.destroyed) throw new Error(`ffmpeg stopped: ${errors.trim() || 'no reason given'}`);
    if (!ff.stdin.write(buffer)) await Promise.race([new Promise(r => ff.stdin.once('drain', r)), stopped]);
  };
  let last = 0;
  try {
    for (let n = 0; n < count; n++) {
      await page.evaluate(settle(title, timeOf(n, total, options.fps)));
      const shot = await page.send('Page.captureScreenshot', {format: options.format, ...(options.format === 'jpeg' ? {quality} : {}), optimizeForSpeed: true});
      if (shot.error || !shot.result?.data) throw new Error(`The browser could not take the picture at ${timeOf(n, total, options.fps).toFixed(2)} s: ${shot.error?.message ?? 'no picture'}`);
      await give(Buffer.from(shot.result.data, 'base64'));
      if (Date.now() - last > 250 || n === count - 1) {
        last = Date.now();
        emit({event: 'progress', title, done: n + 1, total: count});
        if (!flags.json) process.stderr.write(`\r   ${n + 1} / ${count} (${Math.round(((n + 1) / count) * 100)} %)   `);
      }
    }
    ff.stdin.end();
  } catch (error) { ff.stdin.destroy(); kill(); await rm(file, {force: true}).catch(() => {}); throw error; }
  const code = await stopped;
  if (!flags.json) process.stderr.write('\n');
  if (code !== 0) { await rm(file, {force: true}).catch(() => {}); throw new Error(`ffmpeg failed (${code}): ${errors.trim() || 'no reason given'}`); }
  emit({event: 'done', board, title, file, name: path.basename(file)});
  note(`   saved ${path.relative(process.cwd(), file)}`);
  return file;
}

// ---- go ------------------------------------------------------------------------------------------------------------------------------------------------
const files = [];
for (const board of BOARDS) {
  let page;
  try {
    page = await openBoard(board);
    const all = JSON.parse(await page.evaluate(`JSON.stringify([...document.querySelectorAll('.sb-pl')].map(p => p.dataset.sbLine).filter(Boolean))`)), titles = wanted(all, flags.line, !!flags.exact);
    if (!titles.length) { await fail(flags.line ? `${board}: no video with "${flags.line}" in its title. (${all.length} videos: ${all.slice(0, 6).join(' | ')}${all.length > 6 ? ' …' : ''})` : `${board}: no video on this board.`); }
    if (flags.list) console.log(`${board}: ${titles.length} video${titles.length === 1 ? '' : 's'}\n${titles.map(t => `  ${t}`).join('\n')}`);
    else {
      const names = namesOf(titles);
      for (const title of titles) files.push(await exportVideo(page, board, title, path.join(OUT, board, `${names.get(title)}.mp4`)));
    }
  } catch (error) { await fail(error.message); }
  if (page) { cleanups.splice(cleanups.indexOf(page.close), 1); await page.close(); }
}
emit({event: 'finished', files});
if (!flags.json && files.length) console.error(`${files.length} video${files.length === 1 ? '' : 's'} in ${path.relative(process.cwd(), OUT) || OUT}`);
await cleanUp();
