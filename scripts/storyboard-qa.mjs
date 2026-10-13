#!/usr/bin/env node
// QA of the storyboard's VIDEOS (the user, 2026-10-12: "run a pass over all videos to check for any issue like stutter, highlight behind UI, not smooth
// transitions, etc ... make sure everything looks good, and consistent across all videos"). Opens the board in a headless Chrome, finds the videos on it
// (the players: one per line of videos, one per animation of the Animations line) and checks them. It never saves anything: the page's writes to
// /api/storyboard are blocked. The site must be running (the user's dev server: the videos are driven by `window.__sbSeek`, which only exists in development).
//
//   node scripts/storyboard-qa.mjs [cuts|marks|play] [--video improved-quality-v2|increased-efficiency-v2|all] [--line "part of a title"]
//        [--fps 30] [--step 0.1] [--keep <dir>] [--site http://localhost:3000]
//
//   cuts   (default) every video rendered at --fps by seeking, the change between neighbouring pictures: one that differs from its neighbours far more than
//          they do from each other is a cut or a jump; printed with its second (--keep saves the pictures of every video in <dir>/<video>/NNNNN.jpg to look at)
//   marks  is a yellow outline ever drawn BEHIND the software (or anything else that paints)? sampled every --step seconds
//   play   a real-time play in a Chrome trace + the CPU profile: how long the main thread worked per picture (what has to stay under ~16 ms for 60 fps), the slow
//          pictures in order and what the biggest ones did (a call chain: `getBoundingClientRect` high up is a page asked where things are, right after it changed)
//
// `cuts` needs sharp (it is in node_modules). Compare two runs of `cuts` with the same --keep folders to see what a change did.
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';

const mode = ['cuts', 'marks', 'play'].includes(process.argv[2]) ? process.argv[2] : 'cuts', flags = {};
for (let i = mode === process.argv[2] ? 3 : 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) flags[a.slice(2)] = process.argv[++i]; }
const SITE = (flags.site ?? 'http://localhost:3000').replace(/\/$/, ''), FPS = Number(flags.fps ?? 30), STEP = Number(flags.step ?? 0.1);
const BOARDS = !flags.video || flags.video === 'all' ? ['improved-quality-v2', 'increased-efficiency-v2'] : [flags.video];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fail = message => { console.error(message); process.exit(1); };
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync);
if (!exe) fail('No Chrome or Edge found. Set CHROME_PATH.');

// ---- one browser, one board ----------------------------------------------------------------------------------------------------------------------------
async function openBoard(video) {
  const port = 10400 + Math.floor(Math.random() * 300), profile = await mkdtemp(path.join(tmpdir(), 'sbqa-'));
  // (play: the machine's real GPU, so the numbers are what the user sees; the others: software, so the pictures are the same everywhere)
  const child = spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--force-device-scale-factor=1', ...(mode === 'play' ? [] : ['--disable-gpu']), 'about:blank'], {stdio: 'ignore'});
  for (let t = 0; ; t++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { if (t > 60) fail('The browser did not start.'); await sleep(200); } }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json(), ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, {once: true}));
  let id = 0, finished;
  const pending = new Map(), trace = [], send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params})); });
  ws.addEventListener('message', async event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Fetch.requestPaused') { const {requestId, request} = m.params; await (request.method === 'GET' ? send('Fetch.continueRequest', {requestId}) : send('Fetch.failRequest', {requestId, errorReason: 'BlockedByClient'})); }
    else if (m.method === 'Tracing.dataCollected') trace.push(...m.params.value);
    else if (m.method === 'Tracing.tracingComplete') finished?.();
  });
  const evaluate = async expression => { const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result?.result?.value; };
  await send('Fetch.enable', {patterns: [{urlPattern: `${SITE}/api/storyboard*`, requestStage: 'Request'}]});
  await send('Emulation.setDeviceMetricsOverride', {width: 1700, height: 1100, deviceScaleFactor: 1, mobile: false});
  await send('Page.enable');
  await send('Page.navigate', {url: `${SITE}/storyboard?video=${video}`});
  for (let w = 0; w < 120000 && !(await evaluate(`document.querySelectorAll('[data-frame]').length > 3`)); w += 400) await sleep(400);
  await sleep(9000); // (the live frames draw a few at a time, the fonts come in)
  return {send, evaluate, trace, ended: () => new Promise(async resolve => { finished = resolve; await send('Tracing.end'); }), close: async () => { try { ws.close(); } catch {} child.kill(); await sleep(400); await rm(profile, {recursive: true, force: true}).catch(() => {}); }};
}

// ---- one video: the player of a title ------------------------------------------------------------------------------------------------------------------
const ROOT = title => `[...document.querySelectorAll('.sb-pl')].find(p => p.dataset.sbLine === ${JSON.stringify(title)})`;
async function showVideo(page, title) { // the video's picture at the top left of the view, half size (the board's own controls are hidden: they are not what is looked at)
  await page.evaluate(`(() => { const root = ${ROOT(title)}, scr = root.querySelector('.sb-pl-screen'), world = document.querySelector('.sb-world'), m = new DOMMatrix(getComputedStyle(world).transform), r = scr.getBoundingClientRect(); const wx = (r.left - m.e) / m.a, wy = (r.top - m.f) / m.d; world.style.transform = 'translate(' + (20 - wx * 0.5) + 'px,' + (20 - wy * 0.5) + 'px) scale(0.5)'; document.getElementById('sbqa-css')?.remove(); const st = document.createElement('style'); st.id = 'sbqa-css'; st.textContent = '.sb-pl-over-bar, .sb-pl-big, [class*="sb-float"] { display: none !important; } video { visibility: hidden !important; }'; document.head.appendChild(st); })()`);
  await sleep(1800);
  const total = await page.evaluate(`(() => { const m = /\\/ (\\d+):(\\d+)/.exec(${ROOT(title)}.querySelector('.sb-pl-clock').textContent); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; })()`);
  const rect = await page.evaluate(`(() => { const r = ${ROOT(title)}.querySelector('.sb-pl-screen').getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; })()`);
  return {total, rect};
}
const seekTo = (page, title, t) => page.evaluate(`(() => { window.__sbSeek[${JSON.stringify(title)}](${t}); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); })()`);

// ---- cuts -----------------------------------------------------------------------------------------------------------------------------------------------
async function cuts(page, title, board) {
  const sharp = createRequire(import.meta.url)(path.resolve('node_modules/sharp'));
  const {total, rect} = await showVideo(page, title), d = [], t = [];
  const keep = flags.keep ? path.join(flags.keep, board, title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()) : null;
  if (keep) await mkdir(keep, {recursive: true});
  let prev = null, n = 0;
  for (let at = 0; at <= total + 1e-6; at += 1 / FPS, n++) {
    await seekTo(page, title, at);
    const shot = await page.send('Page.captureScreenshot', {format: 'jpeg', quality: 72, clip: {x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1}}), buf = Buffer.from(shot.result.data, 'base64');
    if (keep) await writeFile(path.join(keep, `${String(n).padStart(5, '0')}.jpg`), buf);
    const raw = await sharp(buf).resize(200, 113).greyscale().raw().toBuffer();
    if (prev) { let sum = 0; for (let i = 0; i < raw.length; i++) sum += Math.abs(raw[i] - prev[i]); d.push(sum / raw.length); } else d.push(0);
    t.push(at); prev = raw;
  }
  const med = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)], spikes = [];
  for (let i = 2; i < d.length - 2; i++) { const around = [d[i - 2], d[i - 1], d[i + 1], d[i + 2]], base = Math.max(0.15, med(around)); if (d[i] > 1.0 && d[i] / base > 4) spikes.push(`${t[i].toFixed(2)}s (change ${d[i].toFixed(1)}, its neighbours ${around.map(x => x.toFixed(1)).join(' ')})`); }
  console.log(`${title} (${board}) ${total}s: ${n} pictures, mean change ${(d.reduce((a, b) => a + b, 0) / d.length).toFixed(2)}, ${spikes.length ? 'JUMPS:' : 'no jumps'}`);
  for (const s of spikes.slice(0, 30)) console.log(`   a jump at ${s}`);
  return spikes.length;
}

// ---- marks ----------------------------------------------------------------------------------------------------------------------------------------------
async function marks(page, title, board) {
  const {total} = await showVideo(page, title);
  const audit = `(() => {
    const root = ${ROOT(title)}.querySelector('.sb-pl-screen');
    if (!document.getElementById('sbqa-pe')) { const st = document.createElement('style'); st.id = 'sbqa-pe'; st.textContent = '.sb-pl-screen * { pointer-events: auto !important; }'; document.head.appendChild(st); }
    const eff = el => { let o = 1; for (let e = el; e && e !== root.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); o *= Number(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; } return o; };
    const paints = e => { if (e.matches('svg.sb-shape')) return false; if (/^(IMG|SVG|VIDEO|CANVAS|PICTURE)$/i.test(e.tagName)) return true; const cs = getComputedStyle(e), m = /rgba?\\(([^)]*)\\)/.exec(cs.backgroundColor), a = m ? (m[1].split(',').length > 3 ? Number(m[1].split(',')[3]) : 1) : 0; return a >= 0.3 || cs.backgroundImage !== 'none'; };
    const out = [];
    for (const el of root.querySelectorAll('[data-sb-root]')) {
      const key = el.getAttribute('data-sb-root');
      if (!/outline|circle|highlight/i.test(key)) continue;
      const op = eff(el); if (op < 0.4) continue;
      const b = el.getBoundingClientRect(); if (b.width < 8 || b.height < 8) continue;
      const inset = (parseFloat(getComputedStyle(el).borderLeftWidth) || 6) / 2 + 1, pts = [];
      for (const f of [0.2, 0.5, 0.8]) pts.push([b.left + b.width * f, b.top + inset], [b.left + b.width * f, b.bottom - inset]);
      for (const f of [0.3, 0.5, 0.7]) pts.push([b.left + inset, b.top + b.height * f], [b.right - inset, b.top + b.height * f]);
      let covered = 0; const by = {};
      for (const [x, y] of pts) {
        let hit = null;
        for (const e of document.elementsFromPoint(x, y)) { // what is seen there first: an outline (on top: fine) or something that paints (it covers the outline)
          const k = (e.closest('[data-sb-root]') || {getAttribute: () => ''}).getAttribute('data-sb-root');
          if (/outline|circle|highlight/i.test(k)) { if (eff(e) >= 0.3) break; else continue; }
          if (!/hand|ripple/i.test(k) && paints(e) && eff(e) >= 0.3) { hit = k || '?'; break; }
        }
        if (hit) { covered++; by[hit] = (by[hit] || 0) + 1; }
      }
      out.push({key, op: Math.round(op * 100) / 100, covered, by});
    }
    return JSON.stringify(out);
  })()`;
  const found = [];
  for (let at = 0; at <= total + 1e-6; at += STEP) { await seekTo(page, title, at); for (const o of JSON.parse(await page.evaluate(audit))) if (o.covered >= 2) found.push({t: at, ...o}); }
  console.log(`${title} (${board}) ${total}s: a yellow outline is covered by the software in ${found.length} of ${Math.round(total / STEP)} samples${found.length ? ':' : ''}`);
  let run = null; const flush = () => { if (run) console.log(`   ${run.from.toFixed(2)}-${run.to.toFixed(2)}s  ${run.key}: ${run.max}/12 points covered by ${Object.keys(run.by).join(', ')}`); run = null; };
  for (const f of found) { if (run && run.key === f.key && f.t - run.to < STEP * 1.6) { run.to = f.t; run.max = Math.max(run.max, f.covered); Object.assign(run.by, f.by); } else { flush(); run = {from: f.t, to: f.t, key: f.key, max: f.covered, by: {...f.by}}; } }
  flush();
  return found.length;
}

// ---- play -----------------------------------------------------------------------------------------------------------------------------------------------
async function play(page, title, board) {
  const {total} = await showVideo(page, title), {send, evaluate, trace} = page;
  await send('Profiler.enable'); await send('Profiler.setSamplingInterval', {interval: 250}); await send('Profiler.start');
  trace.length = 0;
  await send('Tracing.start', {traceConfig: {recordMode: 'recordUntilFull', includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'toplevel', 'cc', 'blink', 'v8'], excludedCategories: []}, transferMode: 'ReportEvents'});
  await sleep(300);
  await evaluate(`${ROOT(title)}.querySelector('.sb-pl-play').click()`);
  const wall0 = Date.now();
  for (;;) { await sleep(400); const playing = await evaluate(`${ROOT(title)}.querySelector('.sb-pl-play').getAttribute('aria-label') === 'Pause the video'`); if ((!playing && Date.now() - wall0 > 1500) || Date.now() - wall0 > (total + 8) * 1000) break; }
  const prof = (await send('Profiler.stop')).result.profile;
  await page.ended();
  const threads = new Map();
  for (const e of trace) if (e.ph === 'M' && e.name === 'thread_name') threads.set(`${e.pid}:${e.tid}`, e.args.name);
  const main = e => threads.get(`${e.pid}:${e.tid}`) === 'CrRendererMain';
  const frames = trace.filter(e => e.ph === 'X' && e.name === 'ProxyMain::BeginMainFrame' && main(e)).map(e => ({ts: e.ts / 1e6, ms: e.dur / 1000})).sort((a, b) => a.ts - b.ts), t0 = frames[0]?.ts ?? 0;
  const ms = frames.map(f => f.ms).sort((a, b) => a - b), pct = p => ms[Math.min(ms.length - 1, Math.floor(ms.length * p))] ?? 0, avg = ms.reduce((a, v) => a + v, 0) / Math.max(1, ms.length);
  console.log(`${title} (${board}) ${total}s | ${frames.length} pictures | main thread per picture: avg ${avg.toFixed(1)} ms, p95 ${pct(0.95).toFixed(1)}, p99 ${pct(0.99).toFixed(1)}, max ${pct(1).toFixed(1)} | over 16.7 ms: ${frames.filter(f => f.ms > 16.7).length}, over 33 ms: ${frames.filter(f => f.ms > 33).length}`);
  console.log(`   slow pictures (second into the trace: ms): ${frames.filter(f => f.ms > 20).map(f => `${(f.ts - t0).toFixed(2)}:${f.ms.toFixed(0)}`).join(' ') || 'none'}`);
  // what the JS did inside the biggest ones: self time by call chain
  const nodes = new Map(prof.nodes.map(n => [n.id, n])), parent = new Map();
  for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const inside = f => {
    let at = prof.startTime; const self = new Map();
    for (let i = 0; i < prof.samples.length; i++) {
      at += prof.timeDeltas[i] || 0;
      if (at < f.ts * 1e6 - 3000 || at > (f.ts + f.ms / 1000) * 1e6 + 3000) continue;
      const n = nodes.get(prof.samples[i]), name = n.callFrame.functionName;
      if (name === '(idle)' || name === '(program)') continue;
      const chain = [];
      for (let p = n.id, k = 0; p && k < 9; p = parent.get(p), k++) { const fn = nodes.get(p).callFrame.functionName; if (fn && fn !== '(root)' && fn !== 'run' && !fn.startsWith('runWithFiber') && !fn.startsWith('react_stack')) chain.push(fn); }
      const key = chain.slice(0, 6).join(' < ');
      self.set(key, (self.get(key) || 0) + (prof.timeDeltas[i] || 0) / 1000);
    }
    return [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `        ${v.toFixed(0).padStart(4)} ms  ${k}`).join('\n');
  };
  for (const f of [...frames].sort((a, b) => b.ms - a.ms).slice(0, 5).filter(f => f.ms > 20)) console.log(`   ${f.ms.toFixed(0)} ms at ${(f.ts - t0).toFixed(2)}s\n${inside(f)}`);
  return frames.filter(f => f.ms > 33).length;
}

// ---- go -------------------------------------------------------------------------------------------------------------------------------------------------
const run = {cuts, marks, play}[mode];
let problems = 0;
for (const board of BOARDS) {
  const page = await openBoard(board);
  try {
    const titles = JSON.parse(await page.evaluate(`JSON.stringify([...document.querySelectorAll('.sb-pl')].map(p => p.dataset.sbLine))`)).filter(title => !flags.line || title.toLowerCase().includes(flags.line.toLowerCase()));
    if (!titles.length) { console.log(`${board}: no video${flags.line ? ` with "${flags.line}" in its title` : ''}`); continue; }
    for (const title of titles) problems += await run(page, title, board);
  } finally { await page.close(); }
}
console.log(problems ? `\n${problems} to look at.` : '\nNothing to look at.');
