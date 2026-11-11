#!/usr/bin/env node
// QA of the video's text editor (the user, 2026-10-14: "double click any text on any video ... change the text size, font, content, position, boundaries on the fly"; docs/storyboard.md,
// "The video's text editor"). Opens the board in a headless Chrome and does what a person does: double-clicks a text in a video, uses the toolbar, drags the grip and the handles, types,
// presses Ctrl+Z. It never saves anything: the page's writes to /api/storyboard are caught and looked at, never sent. The site must be running (the videos are driven by
// `window.__sbSeek`, which only exists in development). Exits 1 if a check fails.
//
//   node scripts/storyboard-text-qa.mjs [A,B,C,D,E,F,G,H] [--out <folder for the pictures>] [--site http://localhost:3000]
//
//   A  the grip moves the text by the drag; Reset puts it back and leaves nothing to save      B  a caption several slides show is changed in all of them, no jump between clicks
//   C  a title                                                                                 D  a text of the software (a menu item of the tablet): its color
//   E  a `vtext` in the file is what the video plays (the page is given one: frame performer/words of Improved Quality; change it if that frame goes)
//   F  a video of the Animations line (a cell)                                                 G  Undo and Redo (a run of clicks is one step)
//   H  the words typed in a caption that several slides show are the words of all of them (the Knowledge Base video)
//   L  a caption of a detailed video is retyped in the video, apart from the slides
//   I  a size typed in the field and Done pressed at once is kept     J  Done: the look is the look of all the words, on both boards     K  Make unique: this text alone
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const flags = {}, picks = [];
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) flags[a.slice(2)] = process.argv[++i]; else picks.push(a); }
const only = (picks[0] ?? 'A,B,C,D,E,F,G,H,I,J,K,L').split(','), SITE = (flags.site ?? 'http://localhost:3000').replace(/\/+$/, '');

// ---- a headless Chrome on the site's /storyboard ----

const sleep = ms => new Promise(r => setTimeout(r, ms));
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync);

async function start({inject = null, width = 2300, height = 1300, video = 'improved-quality-v2'} = {}) { // (1300 high: the video editor's picture has room for the video at 1:1)
  const port = 11000 + Math.floor(Math.random() * 900), profile = await mkdtemp(path.join(tmpdir(), 'sbh-'));
  const child = spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--force-device-scale-factor=1', '--disable-gpu', 'about:blank'], {stdio: 'ignore'});
  for (let t = 0; ; t++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { if (t > 60) throw new Error('no browser'); await sleep(200); } }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json(), ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, {once: true}));
  let id = 0; const pending = new Map(), saves = [], errors = [];
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params})); });
  ws.addEventListener('message', async event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Fetch.requestPaused') {
      const {requestId, request} = m.params;
      if (request.method !== 'GET') { saves.push(request.postData); await send('Fetch.failRequest', {requestId, errorReason: 'BlockedByClient'}); }
      else if (inject && /\/api\/storyboard\?video=/.test(request.url) && !/rev=/.test(request.url)) {
        try { const real = await (await fetch(request.url)).json(); const edits = inject(real.edits, new URL(request.url).searchParams.get('video')) ?? real.edits; await send('Fetch.fulfillRequest', {requestId, responseCode: 200, responseHeaders: [{name: 'Content-Type', value: 'application/json'}, {name: 'Cache-Control', value: 'no-store'}], body: Buffer.from(JSON.stringify({edits, rev: real.rev})).toString('base64')}); }
        catch (error) { await send('Fetch.continueRequest', {requestId}); }
      } else await send('Fetch.continueRequest', {requestId});
    } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description?.slice(0, 300) ?? m.params.exceptionDetails.text);
  });
  const evaluate = async expression => { const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
  const mouse = (type, x, y, extra = {}) => send('Input.dispatchMouseEvent', {type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, ...extra});
  await send('Fetch.enable', {patterns: [{urlPattern: `${SITE}/api/storyboard*`, requestStage: 'Request'}]});
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: `${SITE}/storyboard?video=${video}`});
  for (let w = 0; w < 120000 && !(await evaluate(`document.querySelectorAll('[data-frame]').length > 3`)); w += 400) await sleep(400);
  await sleep(9000);
  // A text is retyped in the video editor (2026-10-22; since 2026-10-30 it opens from the video's right-click menu): its picture when it is open, else the video on the board.
  const ROOT = title => `([...document.querySelectorAll('.sb-pl-editor')].find(p => p.dataset.sbLine === ${JSON.stringify(title)}) ?? [...document.querySelectorAll('.sb-pl')].find(p => p.dataset.sbLine === ${JSON.stringify(title)}))`;
  const api = {
    send, evaluate, mouse, saves, errors, ROOT,
    async shot(dir, name, clip) { await mkdir(dir, {recursive: true}); const r = await send('Page.captureScreenshot', {format: 'png', ...(clip ? {clip: {...clip, scale: 1}} : {})}); await writeFile(path.join(dir, `${name}.png`), Buffer.from(r.result.data, 'base64')); },
    // the video's screen at 1:1 at the top left of the page
    // the video open in the video editor, its picture at 1:1 (the checks measure in page px)
    async show(title) {
      const open = `[...document.querySelectorAll('.sb-pl-editor')].some(p => p.dataset.sbLine === ${JSON.stringify(title)})`;
      if (!(await evaluate(open))) {
        if (await evaluate('!!document.querySelector(".sb-ve")')) { await evaluate(`document.querySelector('.sb-ve-back').click()`); await sleep(500); }
        await evaluate(`(() => { const root = [...document.querySelectorAll('.sb-pl')].find(p => p.dataset.sbLine === ${JSON.stringify(title)}), scr = root.querySelector('.sb-pl-screen'), world = document.querySelector('.sb-world'), m = new DOMMatrix(getComputedStyle(world).transform), r = scr.getBoundingClientRect(); const wx = (r.left - m.e) / m.a, wy = (r.top - m.f) / m.d; world.style.transform = 'translate(' + (10 - wx) + 'px,' + (10 - wy) + 'px) scale(0.5)'; return null; })()`);
        await sleep(900);
        const c = await evaluate(`(() => { const r = ${ROOT(title)}.querySelector('.sb-pl-screen').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
        // (2026-10-30: a double-click on a video retypes a text in it; the video editor opens from the video's right-click menu, "Open in video editor")
        await evaluate(`${ROOT(title)}.querySelector('.sb-pl-screen').dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true, clientX: ${c[0]}, clientY: ${c[1]}}))`);
        await sleep(300);
        await evaluate(`[...document.querySelectorAll('.sb-ctx button')].find(b => /^Open in video editor/.test(b.textContent))?.click()`);
        for (let w = 0; w < 8000 && !(await evaluate(open)); w += 200) await sleep(200);
      }
      await evaluate(`(() => { const fit = document.querySelector('.sb-ve-fit'), pl = fit.querySelector('.sb-pl-editor'); fit.style.width = '1600px'; fit.style.height = '900px'; fit.style.aspectRatio = 'auto'; pl.style.transform = 'none'; })()`);
      await sleep(1200);
    },
    async seek(title, t) { await evaluate(`(() => { window.__sbSeek[${JSON.stringify(title)}](${t}); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); })()`); await sleep(350); },
    // double-click at a page point
    async dblclick(x, y) { await mouse('mousePressed', x, y, {clickCount: 1}); await mouse('mouseReleased', x, y, {clickCount: 1}); await mouse('mousePressed', x, y, {clickCount: 2}); await mouse('mouseReleased', x, y, {clickCount: 2}); await sleep(600); },
    async drag(from, by, steps = 8) { await mouse('mousePressed', from[0], from[1]); for (let i = 1; i <= steps; i++) { await mouse('mouseMoved', from[0] + by[0] * i / steps, from[1] + by[1] * i / steps); await sleep(25); } await mouse('mouseReleased', from[0] + by[0], from[1] + by[1]); await sleep(500); },
    async close() { try { ws.close(); } catch {} child.kill(); await sleep(400); await rm(profile, {recursive: true, force: true}).catch(() => {}); },
  };
  return api;
}

// ---- the scenarios ----
const DIR = flags.out ?? path.join(tmpdir(), 'sbte');
const log = (...a) => console.log(...a);
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) failed++; log(cond ? 'PASS' : 'FAIL', name, extra); };
const REPORT = 'The web report', MANAGERS = 'What managers see';

const captionOf = (h, title) => h.evaluate(`(() => { const p = [...${h.ROOT(title)}.querySelectorAll('.sb-pl-screen [data-sb-bubble] p')].find(p => getComputedStyle(p.closest('.sb-pl-shell')).visibility !== 'hidden'); if (!p) return null; const cs = getComputedStyle(p.querySelector('span') ?? p), r = p.getBoundingClientRect(); return {size: parseFloat(cs.fontSize), family: cs.fontFamily.slice(0, 20), color: cs.color, p: [r.left - 10, r.top - 10, r.width, r.height].map(Math.round), text: p.textContent, rect: [r.left, r.top, r.width, r.height]}; })()`);
const near = (a, b, tol = 3) => Math.abs(a - b) <= tol;
// the last save made to a board (the saves are caught, never sent), and what a person does in the toolbar
const lastSave = (h, video) => h.saves.filter(Boolean).map(b => JSON.parse(b)).filter(b => b.video === video).at(-1);
const pressButton = async (h, selector) => { const at = await h.evaluate(`(() => { const b = document.querySelector('${selector}').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`); await h.mouse('mousePressed', ...at); await h.mouse('mouseReleased', ...at); };
const typeSize = async (h, n) => { const at = await h.evaluate(`(() => { const r = document.querySelector('.sb-te-size input').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`); await h.mouse('mousePressed', ...at); await h.mouse('mouseReleased', ...at); await h.send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65}); await h.send('Input.insertText', {text: String(n)}); await sleep(300); };
const editorOpen = h => h.evaluate(`!!document.querySelector('.sb-te-bar') && !!document.querySelector('.sb-te-box')`);
const center = rect => [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2];

if (only.includes('A')) {
  log('--- A: grip move and reset (the web report, Who performed)');
  const h = await start();
  try {
    await h.show(REPORT); await h.seek(REPORT, 9.5);
    const c0 = await captionOf(h, REPORT);
    await h.dblclick(...center(c0.rect));
    ok('the editor opens on a double-click', await editorOpen(h));
    const grip = await h.evaluate(`(() => { const r = document.querySelector('.sb-te-grip').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    await h.drag(grip, [-80, 60]);
    const c1 = await captionOf(h, REPORT);
    ok('the grip moves the text by the drag', near(c1.p[0] - c0.p[0], -80) && near(c1.p[1] - c0.p[1], 60), JSON.stringify([c0.p, c1.p]));
    ok('the editor stays open after the drag', await editorOpen(h));
    // the box's numbers
    const fields = await h.evaluate(`[...document.querySelectorAll('.sb-te-bar input[type=number]')].map(i => i.value)`);
    log('fields (size, x, y, w, h):', JSON.stringify(fields));
    await h.shot(DIR, 'A-moved');
    // Reset
    const reset = await h.evaluate(`(() => { const b = [...document.querySelectorAll('.sb-te-bar button')].find(b => b.textContent === 'Reset').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
    await h.mouse('mousePressed', ...reset); await h.mouse('mouseReleased', ...reset); await sleep(500);
    const c2 = await captionOf(h, REPORT);
    ok('Reset puts the text back where the video lays it out', near(c2.p[0], c0.p[0]) && near(c2.p[1], c0.p[1]) && c2.size === c0.size, JSON.stringify([c0.p, c2.p]));
    await sleep(3500);
    const last = h.saves.filter(Boolean).at(-1), body = last && JSON.parse(last), frame = body?.edits?.frames?.['performer/words'];
    ok('after Reset nothing of the video text is left to save', !frame?.vtext, JSON.stringify(frame?.vtext ?? null));
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('B')) {
  log('--- B: a caption shown by several slides is changed in all of them');
  const h = await start();
  try {
    // which videos have two played slides one after the other that say the same words
    const found = await h.evaluate(`(() => { const out = []; for (const [title, trace] of Object.entries(window.__sbScripts)) for (let i = 0; i + 1 < trace.length; i++) { const a = trace[i], b = trace[i + 1]; const norm = t => (t || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); if (norm(a.text) && norm(a.text) === norm(b.text) && a.id.split('/')[0] === b.id.split('/')[0]) out.push({title, i, a: a.id, b: b.id, startA: a.start, holdA: a.hold, startB: b.start, holdB: b.hold}); } return out; })()`);
    log('same-words pairs:', found.length, JSON.stringify(found.slice(0, 4)));
    const pick = found.find(f => f.holdB > 1.2 && f.holdA > 0.8) ?? found[0];
    if (!pick) { log('SKIP no pair'); }
    else {
      const title = pick.title;
      await h.show(title);
      await h.seek(title, pick.startB + Math.min(pick.holdB - 0.1, 1.2));
      const c0 = await captionOf(h, title);
      log('caption now:', JSON.stringify({size: c0.size, text: c0.text.slice(0, 30)}), 'second slide of', pick.b);
      await h.dblclick(...center(c0.rect));
      ok('editor opens on a caption of the second slide', await editorOpen(h));
      const plus = await h.evaluate(`(() => { const b = [...document.querySelectorAll('.sb-te-size button')][1].getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
      for (let i = 0; i < 5; i++) { await h.mouse('mousePressed', ...plus); await h.mouse('mouseReleased', ...plus); await sleep(60); }
      await sleep(400);
      const c1 = await captionOf(h, title);
      ok('the size grew by 5', near(c1.size, c0.size + 5, 0.6), `${c0.size} -> ${c1.size}`);
      const done = await h.evaluate(`(() => { const b = document.querySelector('.sb-te-done').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
      await h.mouse('mousePressed', ...done); await h.mouse('mouseReleased', ...done); await sleep(2500);
      const last = h.saves.filter(Boolean).at(-1), body = last && JSON.parse(last);
      ok('the change is the look of all the words (one record: both slides of the pair follow it)', body?.edits?.videoText?.words?.fontSize === c1.size, JSON.stringify(body?.edits?.videoText ?? null));
      await h.seek(title, pick.startA + Math.min(pick.holdA - 0.05, 0.6)); await sleep(500);
      const c2 = await captionOf(h, title);
      ok('the first slide of the pair shows the same size (no jump between clicks)', c2 && near(c2.size, c1.size, 0.6), `${c2?.size} vs ${c1.size}`);
      log('errors:', JSON.stringify(h.errors));
    }
  } finally { await h.close(); }
}

if (only.includes('C')) {
  log('--- C: a title (the closing words of the web report)');
  const h = await start();
  try {
    await h.show(REPORT);
    const total = await h.evaluate(`window.__sbScripts[${JSON.stringify(REPORT)}].at(-1).start + window.__sbScripts[${JSON.stringify(REPORT)}].at(-1).hold - 0.3`);
    await h.seek(REPORT, total);
    const el = await h.evaluate(`(() => { const out = []; for (const e of ${h.ROOT(REPORT)}.querySelectorAll('.sb-pl-screen *')) { if (![...e.childNodes].some(n => n.nodeType === 3 && n.data.trim())) continue; const r = e.getBoundingClientRect(); const sh = e.closest('.sb-pl-shell'); if (r.width > 20 && sh && getComputedStyle(sh).visibility !== 'hidden') out.push({t: e.textContent.slice(0, 40), tag: e.tagName, rect: [r.left, r.top, r.width, r.height], op: getComputedStyle(e).opacity}); } return out.slice(0, 6); })()`);
    log('visible texts:', JSON.stringify(el));
    const t = el.find(e => +e.op > 0.5);
    if (!t) log('SKIP no visible text'); else {
      const before = await h.evaluate(`(() => { const e = [...${h.ROOT(REPORT)}.querySelectorAll('.sb-pl-screen *')].find(e => e.textContent.startsWith(${JSON.stringify(t.t.slice(0, 12))}) && [...e.childNodes].some(n => n.nodeType === 3)); return parseFloat(getComputedStyle(e).fontSize); })()`);
      await h.dblclick(...center(t.rect));
      ok('the editor opens on a title', await editorOpen(h));
      const sizes = [];
      for (let i = 0; i < 4; i++) { const plus = await h.evaluate(`(() => { const b = [...document.querySelectorAll('.sb-te-size button')][1].getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`); await h.mouse('mousePressed', ...plus); await h.mouse('mouseReleased', ...plus); await sleep(60); sizes.push(plus.map(Math.round).join(',') + ' ' + await h.evaluate(`document.querySelector('.sb-te-bar input[type=number]').value`)); }
      log('plus clicks (position, size shown):', JSON.stringify(sizes));
      await sleep(400);
      const after = await h.evaluate(`(() => { const e = [...${h.ROOT(REPORT)}.querySelectorAll('.sb-pl-screen *')].find(e => e.textContent.startsWith(${JSON.stringify(t.t.slice(0, 12))}) && [...e.childNodes].some(n => n.nodeType === 3)); return parseFloat(getComputedStyle(e).fontSize); })()`);
      ok('the title grew', after > before + 2, `${before} -> ${after}`);
      await h.shot(DIR, 'C-title');
    }
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('D')) {
  log('--- D: text inside the tablet (the menu of What managers see)');
  const h = await start();
  try {
    await h.show(MANAGERS); await h.seek(MANAGERS, 3.0);
    const t = await h.evaluate(`(() => { const e = [...${h.ROOT(MANAGERS)}.querySelectorAll('.bn-menu-item')].find(e => /Personal Board/.test(e.textContent)); const s = [...e.querySelectorAll('*')].find(n => [...n.childNodes].some(c => c.nodeType === 3 && /Personal Board/.test(c.data))); const r = s.getBoundingClientRect(); return {rect: [r.left, r.top, r.width, r.height], color: getComputedStyle(s).color, size: getComputedStyle(s).fontSize}; })()`);
    await h.dblclick(...center(t.rect));
    ok('the editor opens on a text of the software', await editorOpen(h), JSON.stringify(t));
    await h.evaluate(`(() => { const c = document.querySelector('.sb-te-bar input[type=color]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(c, '#ff0000'); c.dispatchEvent(new Event('input', {bubbles: true})); c.dispatchEvent(new Event('change', {bubbles: true})); })()`);
    await sleep(500);
    const after = await h.evaluate(`(() => { const e = [...${h.ROOT(MANAGERS)}.querySelectorAll('.bn-menu-item')].find(e => /Personal Board/.test(e.textContent)); const s = [...e.querySelectorAll('*')].find(n => [...n.childNodes].some(c => c.nodeType === 3 && /Personal Board/.test(c.data))); return getComputedStyle(s).color; })()`);
    ok('its color changed', after === 'rgb(255, 0, 0)', `${t.color} -> ${after}`);
    await h.shot(DIR, 'D-menu', {x: 0, y: 0, width: 1700, height: 900});
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('E')) {
  log('--- E: what is saved is what the video plays (the page loads a vtext)');
  const h = await start({inject: (edits, video) => { if (video !== 'improved-quality-v2') return edits; const frames = {...edits.frames}; frames['performer/words'] = {...(frames['performer/words'] ?? {}), vtext: {bubble: {fontSize: 62, font: 'caveat', color: '#ffcc00', rect: [830, 120, 520, 0]}}, updatedAt: '2099-01-01T00:00:00.000Z'}; return {...edits, frames}; }});
  try {
    await h.show(REPORT); await h.seek(REPORT, 9.5);
    const c = await captionOf(h, REPORT);
    ok('the video plays the saved size, font and color', c && c.size === 62 && /Caveat/.test(c.family) && c.color === 'rgb(255, 204, 0)', JSON.stringify({size: c?.size, family: c?.family, color: c?.color}));
    ok('and the saved place and width', c && near(c.p[0], 830 + 30, 8) && near(c.p[1], 120 + 0, 40) && near(c.p[2], 520 - 60, 6), JSON.stringify(c?.p));
    await h.shot(DIR, 'E-loaded', {x: 800, y: 0, width: 800, height: 700});
    // and a play through it never fails
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('F')) {
  log('--- F: a video of the Animations line (a cell)');
  const h = await start();
  try {
    const cells = await h.evaluate(`[...document.querySelectorAll('.sb-pl-cell')].map(c => c.dataset.sbLine)`);
    log('cell videos:', cells.length, JSON.stringify(cells.slice(0, 4)));
    const title = cells.find(t => /hand/i.test(t)) ?? cells[0];
    await h.show(title);
    const total = await h.evaluate(`window.__sbScripts[${JSON.stringify(title)}].at(-1).start`);
    await h.seek(title, Math.min(total, 2.5));
    const words = await h.evaluate(`(() => { const out = []; for (const p of ${h.ROOT(title)}.querySelectorAll('.sb-pl-screen [data-sb-bubble] p')) { const r = p.getBoundingClientRect(), sh = p.closest('.sb-pl-shell'); if (r.width > 20 && getComputedStyle(sh).visibility !== 'hidden') out.push({t: p.textContent.slice(0, 30), rect: [r.left, r.top, r.width, r.height]}); } return out; })()`);
    log('captions:', JSON.stringify(words));
    if (!words.length) log('SKIP'); else {
      await h.dblclick(...center(words[0].rect));
      ok('the editor opens in a cell video', await editorOpen(h));
      const box = await h.evaluate(`(() => { const r = document.querySelector('.sb-te-box')?.getBoundingClientRect(); const c = ${h.ROOT(title)}.getBoundingClientRect(); return r && {inside: r.left >= c.left - 1 && r.right <= c.right + 1, r: [r.x, r.y, r.width, r.height].map(Math.round)}; })()`);
      ok('its box is drawn over the video', box?.inside, JSON.stringify(box));
      await h.shot(DIR, 'F-cell', {x: 0, y: 0, width: 1700, height: 950});
    }
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('G')) {
  log('--- G: undo');
  const h = await start();
  try {
    await h.show(REPORT); await h.seek(REPORT, 9.5);
    const c0 = await captionOf(h, REPORT);
    await h.dblclick(...center(c0.rect));
    for (let i = 0; i < 3; i++) { const plus = await h.evaluate(`(() => { const b = [...document.querySelectorAll('.sb-te-size button')][1].getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`); await h.mouse('mousePressed', ...plus); await h.mouse('mouseReleased', ...plus); await sleep(80); }
    const c1 = await captionOf(h, REPORT);
    const done = await h.evaluate(`(() => { const b = document.querySelector('.sb-te-done').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
    await h.mouse('mousePressed', ...done); await h.mouse('mouseReleased', ...done); await sleep(1500);
    ok('three steps up', near(c1.size, c0.size + 3, 0.6), `${c0.size} -> ${c1.size}`);
    await h.send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'z', code: 'KeyZ', modifiers: 2, windowsVirtualKeyCode: 90});
    await h.send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'z', code: 'KeyZ', modifiers: 2, windowsVirtualKeyCode: 90});
    await sleep(1500);
    const c2 = await captionOf(h, REPORT);
    ok('one Ctrl+Z takes the three clicks back (they are one step)', c2 && near(c2.size, c0.size, 0.6), `${c0.size} -> ${c1.size} -> ${c2?.size}`);
    await h.send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'z', code: 'KeyZ', modifiers: 10, windowsVirtualKeyCode: 90});
    await h.send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'z', code: 'KeyZ', modifiers: 10, windowsVirtualKeyCode: 90});
    await sleep(1500);
    const c3 = await captionOf(h, REPORT);
    ok('Ctrl+Shift+Z brings them back', c3 && near(c3.size, c1.size, 0.6), `${c3?.size}`);
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('H')) {
  log('--- H: the words typed in a caption that several slides show are the words of all of them');
  const h = await start();
  try {
    const KNOW = 'The tablet and its Knowledge Base';
    await h.show(KNOW);
    const trace0 = await h.evaluate(`window.__sbScripts[${JSON.stringify(KNOW)}].map(t => ({id: t.id, start: t.start, hold: t.hold}))`);
    const second = trace0.find(t => t.id === 'knowledge/fading');
    if (!second) { log('SKIP no knowledge/fading'); } else {
      await h.seek(KNOW, second.start + Math.min(second.hold - 0.1, 0.6));
      const c0 = await captionOf(h, KNOW);
      await h.dblclick(...center(c0.rect));
      await h.evaluate(`document.querySelector('.sb-pl-screen [contenteditable]')?.focus()`);
      await h.send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65});
      await h.send('Input.insertText', {text: 'ZZZ NEW'});
      await sleep(300);
      const done = await h.evaluate(`(() => { const b = document.querySelector('.sb-te-done').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
      await h.mouse('mousePressed', ...done); await h.mouse('mouseReleased', ...done); await sleep(2500);
      for (const id of ['knowledge/words', 'knowledge/fading', 'knowledge/fading#2']) {
        const t = await h.evaluate(`(() => { const t = window.__sbScripts[${JSON.stringify(KNOW)}].find(t => t.id === ${JSON.stringify(id)}); return t && {start: t.start, hold: t.hold}; })()`);
        if (!t) { ok(`${id} says the new words`, false, 'not played'); continue; }
        await h.seek(KNOW, t.start + Math.min(t.hold - 0.05, 1.0)); await sleep(500);
        const c = await captionOf(h, KNOW);
        ok(`${id} says the new words`, c?.text === 'ZZZ NEW', JSON.stringify(c?.text));
      }
      log('errors:', JSON.stringify(h.errors));
    }
  } finally { await h.close(); }
}

if (only.includes('I')) {
  log('--- I: a size typed in the field is kept when Done is pressed (the user, 2026-10-14: "I make it from 35 to 30 and press Done and it did not work")');
  const h = await start();
  try {
    await h.show(REPORT); await h.seek(REPORT, 9.5);
    const c0 = await captionOf(h, REPORT);
    await h.dblclick(...center(c0.rect));
    ok('the editor opens', await editorOpen(h));
    const field = await h.evaluate(`(() => { const r = document.querySelector('.sb-te-size input').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    await h.mouse('mousePressed', ...field); await h.mouse('mouseReleased', ...field);
    await h.send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65});
    await h.send('Input.insertText', {text: '30'});
    await sleep(300);
    const c1 = await captionOf(h, REPORT);
    ok('the size shows while it is typed', c1 && near(c1.size, 30, 0.6), `${c0.size} -> ${c1?.size}`);
    const done = await h.evaluate(`(() => { const b = document.querySelector('.sb-te-done').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
    await h.mouse('mousePressed', ...done); await h.mouse('mouseReleased', ...done); await sleep(2500);
    const c2 = await captionOf(h, REPORT);
    ok('and it is still 30 once Done is pressed', c2 && near(c2.size, 30, 0.6), `${c0.size} -> ${c1?.size} -> ${c2?.size}`);
    const mine = lastSave(h, 'improved-quality-v2');
    ok('the size that was typed is what is saved (the look of all the words)', mine?.edits?.videoText?.words?.fontSize === 30, JSON.stringify(mine?.edits?.videoText ?? null));
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('J')) {
  log('--- J: Done makes the look the look of ALL the words, in every video and on both boards');
  const h = await start();
  try {
    await h.show(REPORT); await h.seek(REPORT, 9.5);
    const c0 = await captionOf(h, REPORT);
    await h.dblclick(...center(c0.rect));
    ok('the editor opens', await editorOpen(h));
    await typeSize(h, 30);
    await pressButton(h, '.sb-te-done'); await sleep(2500);
    const c1 = await captionOf(h, REPORT);
    ok('this text is 30', c1 && near(c1.size, 30, 0.6), `${c0.size} -> ${c1?.size}`);
    await h.seek(REPORT, 14);
    const c2 = await captionOf(h, REPORT);
    ok('another text of the same video is 30 too', c2 && c2.text !== c1.text && near(c2.size, 30, 0.6), `${c2?.size} (${c2?.text})`);
    await h.show(MANAGERS); await h.seek(MANAGERS, 5.5);
    const c3 = await captionOf(h, MANAGERS);
    ok('and a text of another video', c3 && near(c3.size, 30, 0.6), `${c3?.size} (${c3?.text})`);
    const mine = lastSave(h, 'improved-quality-v2'), other = lastSave(h, 'increased-efficiency-v2');
    ok('this board has the look once, not on every frame', mine?.edits?.videoText?.words?.fontSize === 30 && !Object.values(mine.edits.frames ?? {}).some(r => r.vtext?.bubble?.fontSize === 30), JSON.stringify(mine?.edits?.videoText ?? null));
    ok('the other board is given it too', other?.edits?.videoText?.words?.fontSize === 30, JSON.stringify(other?.edits?.videoText ?? null));
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('K')) {
  log('--- K: Make unique keeps the change on this text alone');
  const h = await start();
  try {
    await h.show(REPORT); await h.seek(REPORT, 9.5);
    const c0 = await captionOf(h, REPORT);
    await h.dblclick(...center(c0.rect));
    ok('the editor opens', await editorOpen(h));
    ok('there is a Make unique button next to Done', await h.evaluate("!!document.querySelector('.sb-te-unique') && !!document.querySelector('.sb-te-done')"));
    await typeSize(h, 28);
    await h.shot(DIR, 'K-toolbar', {x: 0, y: 0, width: 2300, height: 1050});
    await pressButton(h, '.sb-te-unique'); await sleep(2500);
    const c1 = await captionOf(h, REPORT);
    ok('this text is 28', c1 && near(c1.size, 28, 0.6), `${c0.size} -> ${c1?.size}`);
    await h.seek(REPORT, 14);
    const c2 = await captionOf(h, REPORT);
    ok('another text of the same video stays as it was', c2 && c2.text !== c1.text && near(c2.size, c0.size, 0.6), `${c2?.size} (${c2?.text})`);
    await h.show(MANAGERS); await h.seek(MANAGERS, 5.5);
    const c3 = await captionOf(h, MANAGERS);
    ok('and a text of another video', c3 && near(c3.size, c0.size, 0.6), `${c3?.size}`);
    const mine = lastSave(h, 'improved-quality-v2');
    ok('nothing is shared, the text has its own look', !mine?.edits?.videoText && mine?.edits?.frames?.['performer/words']?.vtext, JSON.stringify([mine?.edits?.videoText ?? null, mine?.edits?.frames?.['performer/words']?.vtext ?? null]));
    ok('and the other board is not touched', !lastSave(h, 'increased-efficiency-v2'));
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

if (only.includes('L')) {
  log('--- L: a caption of a DETAILED video is retyped in the video and kept apart from the slides');
  const h = await start();
  try {
    const KD = 'The tablet and its Knowledge Base · in detail', KNOW = 'The tablet and its Knowledge Base';
    await h.show(KD);
    const items = await h.evaluate(`window.__sbScripts[${JSON.stringify(KD)}].map(t => ({id: t.id, start: t.start, hold: t.hold, text: t.text}))`);
    const menu = items.find(t => /taps Menu/.test(t.text));
    ok('the detailed video has its captions', !!menu, JSON.stringify(items.slice(0, 3)));
    if (menu) {
      await h.seek(KD, menu.start + Math.min(menu.hold - 0.1, 1.2));
      const c0 = await captionOf(h, KD);
      ok('the caption of the moment is there', c0 && /taps Menu/.test(c0.text), JSON.stringify(c0?.text));
      await h.dblclick(...center(c0.rect));
      ok('the editor opens on it', await editorOpen(h));
      await h.evaluate(`document.querySelector('.sb-pl-screen [contenteditable]')?.focus()`);
      await h.send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65});
      await h.send('Input.insertText', {text: 'The user opens the Menu.'});
      await sleep(300);
      await pressButton(h, '.sb-te-done'); await sleep(2500);
      const mine = lastSave(h, 'improved-quality-v2');
      ok('the words are kept as the first step of that scene', mine?.edits?.captions?.['knowledge-detail']?.['knowledge:0'] === 'The user opens the Menu.', JSON.stringify(mine?.edits?.captions ?? null));
      ok('the slides are not retyped', !Object.entries(mine?.edits?.frames ?? {}).some(([id, r]) => id.startsWith('knowledge/') && r.texts && Object.values(r.texts).includes('The user opens the Menu.')), 'a slide has the words');
      await h.seek(KD, menu.start + Math.min(menu.hold - 0.1, 1.2)); await sleep(500);
      const c1 = await captionOf(h, KD);
      ok('the detailed video says the new words', c1?.text === 'The user opens the Menu.', JSON.stringify(c1?.text));
      await h.show(KNOW);
      const orig = await h.evaluate(`window.__sbScripts[${JSON.stringify(KNOW)}].map(t => t.text).join('|')`);
      ok('the video it follows is as it was', !/opens the Menu/.test(orig) && /Readily Available/.test(orig), orig.slice(0, 120));
    }
    log('errors:', JSON.stringify(h.errors));
  } finally { await h.close(); }
}

log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
