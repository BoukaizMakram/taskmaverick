#!/usr/bin/env node
// How smooth is the storyboard to pan and zoom? Opens the board in a headless Chrome (the machine's real GPU, so the numbers are
// what the user sees), scripts wheel input the way a mouse or a trackpad sends it, records a Chrome trace and prints, per scenario,
// how long the renderer's MAIN thread worked per frame (what has to stay under ~8 ms for a steady 60 fps: the GPU does the rest)
// and how many frames went over. It never saves anything: the page's writes to /api/storyboard are blocked.
//
//   node scripts/storyboard-perf.mjs [--video improved-quality-v2] [--site http://localhost:3000]
//        [--scenarios pan,zoom,panfar,gesture] [--check]      (--check: exit 1 when a scenario is over its budget)
//
// Scenarios: pan (80 wheel events at normal zoom), zoom (ctrl+wheel in and out), panfar (zoom far out so every frame is on screen, then pan),
// gesture (a short pan after the board sat idle, then the moment it settles). The site must be running (the user's dev server).
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const flags = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a === '--check') flags.check = true; else if (a.startsWith('--')) flags[a.slice(2)] = process.argv[++i]; }
const SITE = (flags.site ?? 'http://localhost:3000').replace(/\/$/, ''), VIDEO = flags.video ?? 'improved-quality-v2';
const SCENARIOS = (flags.scenarios ?? 'pan,zoom,panfar,gesture').split(',');
const BUDGET = {avg: 8, max: 24}; // ms of main-thread time per frame
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fail = message => { console.error(message); process.exit(1); };

const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find(existsSync);
if (!exe) fail('No Chrome or Edge found. Set CHROME_PATH.');
const port = 10700 + Math.floor(Math.random() * 200), profile = await mkdtemp(path.join(tmpdir(), 'sbperf-'));
const child = spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--force-device-scale-factor=1', 'about:blank'], {stdio: 'ignore'});
try {
  for (let t = 0; ; t++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { if (t > 60) fail('The browser did not start.'); await sleep(200); } }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json(), ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, {once: true}));
  let id = 0, finished;
  const pending = new Map(), trace = [], send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params})); });
  ws.addEventListener('message', async event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Fetch.requestPaused') { const {requestId, request} = m.params; await (request.method === 'GET' ? send('Fetch.continueRequest', {requestId}) : send('Fetch.failRequest', {requestId, errorReason: 'BlockedByClient'})); } // (the page never saves from here)
    else if (m.method === 'Tracing.dataCollected') trace.push(...m.params.value);
    else if (m.method === 'Tracing.tracingComplete') finished?.();
  });
  const evaluate = async expression => { const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result?.result?.value; };
  await send('Fetch.enable', {patterns: [{urlPattern: `${SITE}/api/storyboard*`, requestStage: 'Request'}]});
  await send('Emulation.setDeviceMetricsOverride', {width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false});
  await send('Page.enable');
  const info = (await send('SystemInfo.getInfo' )).result;
  const feature = info?.gpu?.featureStatus ?? {};
  console.log(`GPU: ${info?.gpu?.devices?.[0]?.deviceString ?? '?'} | compositing ${feature.gpu_compositing} | raster ${feature.rasterization}`);
  await send('Page.navigate', {url: `${SITE}/storyboard?video=${VIDEO}`});
  for (let w = 0; w < 120000 && !(await evaluate(`document.querySelectorAll('[data-frame]').length > 3`)); w += 400) await sleep(400);
  const frames = await evaluate(`document.querySelectorAll('[data-frame]').length`);
  await sleep(Math.min(25000, 4000 + frames * 120)); // the live frames draw a few at a time
  const wheel = (dx, dy, mods = 0) => send('Input.dispatchMouseEvent', {type: 'mouseWheel', x: 850, y: 500, deltaX: dx, deltaY: dy, modifiers: mods});
  const nodes = await evaluate(`document.querySelectorAll('*').length`);
  console.log(`${VIDEO}: ${frames} frames, ${nodes} DOM nodes\n`);

  const run = async name => {
    if (name === 'panfar') { for (let i = 0; i < 12; i++) { await wheel(0, 100, 2); await sleep(30); } await sleep(2500); }
    if (name === 'gesture') await sleep(1500);
    trace.length = 0;
    await send('Tracing.start', {traceConfig: {recordMode: 'recordUntilFull', includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'toplevel', 'cc', 'blink'], excludedCategories: []}, transferMode: 'ReportEvents'});
    await sleep(300);
    const t0 = Date.now();
    if (name === 'pan' || name === 'panfar') for (let i = 0; i < 80; i++) { await wheel(i < 40 ? 0 : 40, i < 40 ? 40 : 0); await sleep(12); }
    else if (name === 'zoom') for (let i = 0; i < 40; i++) { await wheel(0, i < 20 ? 60 : -60, 2); await sleep(14); }
    else if (name === 'gesture') for (let i = 0; i < 12; i++) { await wheel(0, 40); await sleep(12); }
    const elapsed = Date.now() - t0;
    await sleep(name === 'gesture' ? 1500 : 900); // (gesture: long enough for the board to settle: React, the layer dropped, drawn sharp again)
    await new Promise(async resolve => { finished = resolve; await send('Tracing.end'); });
    const threads = new Map(), procs = new Map();
    for (const e of trace) if (e.ph === 'M') { if (e.name === 'thread_name') threads.set(`${e.pid}:${e.tid}`, e.args.name); else if (e.name === 'process_name') procs.set(e.pid, e.args.name); }
    const main = trace.filter(e => e.ph === 'X' && e.name === 'ProxyMain::BeginMainFrame' && threads.get(`${e.pid}:${e.tid}`) === 'CrRendererMain').map(e => e.dur / 1000).sort((a, b) => a - b);
    const sum = name2 => trace.filter(e => e.ph === 'X' && e.name === name2 && threads.get(`${e.pid}:${e.tid}`) === 'CrRendererMain').reduce((a, e) => a + e.dur / 1000, 0);
    const avg = main.reduce((a, v) => a + v, 0) / Math.max(1, main.length), p95 = main[Math.floor(main.length * 0.95)] ?? 0, max = main.at(-1) ?? 0, over = main.filter(v => v > 16.7).length;
    const ok = avg <= BUDGET.avg && max <= BUDGET.max;
    console.log(`${name.padEnd(8)} frames ${String(main.length).padStart(4)} | main thread per frame: avg ${avg.toFixed(1).padStart(5)} ms  p95 ${p95.toFixed(1).padStart(5)}  max ${max.toFixed(1).padStart(5)} | over 16.7 ms: ${String(over).padStart(3)} | layerize ${Math.round(sum('Layerize'))} ms | input took ${elapsed} ms | ${ok ? 'OK' : `over budget (avg ${BUDGET.avg}, max ${BUDGET.max})`}`);
    return ok;
  };
  const results = [];
  for (const name of SCENARIOS) results.push(await run(name));
  if (flags.check && results.some(ok => !ok)) process.exitCode = 1;
} finally { child.kill(); await sleep(400); await rm(profile, {recursive: true, force: true}).catch(() => {}); }
