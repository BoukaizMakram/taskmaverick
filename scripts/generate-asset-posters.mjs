// Makes the still frame of every Assets Library card (public/assets-library/*.jpg).
// Run it after the animations change, against a running site (the dev server
// or `npm run start`):
//   npm run gen:posters -- [--base http://localhost:3000] [--only id,id] [--wait 1200]
// It drives a headless Chrome/Edge over the DevTools protocol, opens each
// asset's /embed page in `still` mode and saves what the stage shows.
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ASSETS} from '../lib/assetsLibrary.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const base = option('base', 'http://localhost:3000').replace(/\/$/, '');
const only = option('only', '')?.split(',').filter(Boolean);
const settle = Number(option('wait', 1200));
const SIZE = {width: 960, height: 540};
const PORT = 9341;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const browser = BROWSERS.find(existsSync);
if (!browser) { console.error('No Chrome or Edge found. Set CHROME_PATH.'); process.exit(1); }

const profile = await mkdtemp(path.join(tmpdir(), 'posters-'));
const child = spawn(browser, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--disable-gpu', 'about:blank'], {stdio: 'ignore'});
const stop = async () => { child.kill(); await sleep(400); await rm(profile, {recursive: true, force: true}).catch(() => {}); };

try {
  for (let tries = 0; ; tries++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { if (tries > 50) throw new Error('The browser did not start.'); await sleep(200); }
  }
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {method: 'PUT'})).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, {once: true}));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); } });
  const send = (method, params = {}) => new Promise(resolve => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({id: i, method, params})); });
  const evaluate = async expression => (await send('Runtime.evaluate', {expression, returnByValue: true})).result?.result?.value;
  await send('Emulation.setDeviceMetricsOverride', {...SIZE, deviceScaleFactor: 1, mobile: false});
  await send('Page.enable');

  const list = ASSETS.filter(asset => !only?.length || only.includes(asset.id));
  await mkdir('public/assets-library', {recursive: true});
  for (const [n, asset] of list.entries()) {
    const url = `${base}${asset.src}?clip=${asset.clip}&mode=still&still=${asset.poster}`;
    await send('Page.navigate', {url: 'about:blank'});
    await send('Page.navigate', {url});
    let ready = false;
    for (let waited = 0; waited < 90000 && !ready; waited += 400) { await sleep(400); ready = await evaluate('document.documentElement.dataset.embedReady === "still"'); }
    if (!ready) { console.error(`✗ ${asset.id}: the page never got ready (${url})`); continue; }
    await sleep(settle);
    const shot = await send('Page.captureScreenshot', {format: 'jpeg', quality: 80});
    await writeFile(path.join('public', asset.image), Buffer.from(shot.result.data, 'base64'));
    console.log(`✓ ${String(n + 1).padStart(2)}/${list.length} ${asset.id}`);
  }
  ws.close();
} finally { await stop(); }
