'use client';

// ---------------------------------------------------------------------------
// DemoStage — the AI presenter's shared screen on /demo-ai: a 1600×900
// "desktop" (scaled to fit) holding the web app in a browser window, the
// performer's phone and the team's shared tablet. Phone and tablet run on one
// simulator store, so an action on one appears on the other.
//
// The cursor is Mav's hand:
//   follow(text, audio) — while a sentence is spoken, glide to each on-screen
//     thing it names (mission titles, columns, "the timer", "History"…), timed
//     to where the word falls in the audio, with a highlight ring.
//   run(command) — perform a [[command]] the way a person would: click the
//     real elements in order (tab → card, Reports → report → Group by…); only
//     when there is no clickable path does it send the command to the screen
//     directly (the device / web app `remote` props), after pointing at it.
// Before pointing, reveal() scrolls the list holding the element so all of it
// is on screen (and fades the captions if they still cover it).
//
// Industries: [[stage industry hotel]] sets the app up for the visitor's
// industry — premade first (the recorded demo's restaurant / factory, then
// lib/sim/industryPacks.mjs), otherwise generated live (/api/demo-ai/industry)
// while a "Setting up…" card shows. `onIndustry` tells the call when it's on
// screen so Mav can present it. [[stage mission …]] posts one new mission.
// ---------------------------------------------------------------------------

import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import SimDevice from '@/components/sim/SimDevice';
import WebApp from '@/components/web/WebApp';
import LoadingLogo from '@/components/LoadingLogo';
import { useSim } from '@/components/sim/useSim';
import { mentions, findPointable, clipOf, scrollersOf, cut } from './pointing';
import { column, canClose, unitLabel } from '@/lib/sim/store.mjs';
import { findPremade, toSim, industryKey } from '@/lib/sim/packs.mjs';
import { INDUSTRY_PACKS } from '@/lib/sim/industryPacks.mjs';

const W = 1600, H = 900;
// [x, y, scale, opacity] of each screen per layout, in stage pixels.
export const LAYOUTS = {
  devices: { phone: [110, 56, 0.98, 1], tablet: [515, 98, 1.03, 1], web: [140, 70, 0.8, 0] },
  phone: { phone: [597, 30, 1.06, 1], tablet: [980, 170, 0.8, 0], web: [140, 70, 0.8, 0] },
  tablet: { phone: [60, 90, 0.9, 0], tablet: [198, 32, 1.2, 1], web: [140, 70, 0.8, 0] },
  web: { phone: [60, 90, 0.9, 0], tablet: [320, 170, 0.9, 0], web: [40, 22, 0.95, 1] },
  all: { phone: [560, 262, 0.78, 1], tablet: [830, 352, 0.72, 1], web: [40, 30, 0.64, 1] },
};
// How long a directly-sent command takes to show its result.
const SETTLE = { claim: 3000, close: 3400, capture: 4800, lesson: 2100, open: 950, board: 1400, home: 1300, unit: 1300, tickets: 1300, answer: 600, complete: 700, translate: 800, back: 700, menu: 900, proofs: 1300, knowledge: 1300, expand: 900, collapse: 700, tab: 650, request: 1900, rate: 800,
  overview: 1500, library: 1100, missions: 1100, create: 1300, edit: 1300, marketplace: 1100, catalog: 1100, process: 1300, reports: 1000, report: 1400, dashboard: 1200, section: 1000 };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MISSION_CMDS = ['claim', 'close', 'answer', 'capture', 'lesson', 'complete', 'translate', 'rate'];
const short = name => String(name || '').replace(' - Staff', '');
const spoken = s => ` ${String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
// Screens a sentence explicitly talks about ("on the tablet", "my phone").
const devicesIn = text => { const t = spoken(text); return ['tablet', 'phone'].filter(d => t.includes(` ${d} `) || (d === 'tablet' && / shared (device|screen) /.test(t))); };
// Words about what is inside an open mission: talking about them should show it.
const CONTENT = / (training|lesson|micro training|checklist|question|questions|step|steps|proof|photo|video|red alert|instructions|claim button|close button|execution timer|quiz) /;
const statusIn = text => { const t = spoken(text); return / (claimed|in progress|being worked on) /.test(t) ? 'claimed' : / (closed|completed|finished) /.test(t) ? 'closed' : / (under open|open column|open tab|in open|waiting) /.test(t) ? 'open' : null; };

// Where an open mission stands, item by item, so the AI knows what's left.
function progress(m) {
  if (!m) return '';
  if (m.type === 'Test') return ` Test: ${m.questions.filter(q => m.answers?.[q.id] != null).length}/${m.questions.length} answered.`;
  if (m.lessons) return ` Lessons: ${m.lessons.map((l, i) => `${i + 1}) ${l.title} ${m.lessonsDone?.includes(l.id) ? 'done' : 'to do'}`).join(', ')}.`;
  if (!m.items?.length) return '';
  return ` Items: ${m.items.map((it, i) => {
    const v = it.kind === 'lesson' ? (m.lessonsDone?.includes(it.id) ? 'done' : 'not done') : m.answers?.[it.id] ?? 'unanswered';
    const proof = m.proofs?.[it.id] ? ' + proof' : '';
    const rule = Object.entries(it.ticketOn || {}).map(([a, t]) => ` (${a} raises ${t.title})`).join('');
    return `${i + 1}) ${it.kind === 'lesson' ? 'training' : it.kind} "${it.label.slice(0, 60)}" = ${v}${proof}${rule}`;
  }).join('; ')}.`;
}
const lower = v => String(v ?? '').toLowerCase();
const clean = v => String(v ?? '').replace(/["“”‘’]/g, '').replace(/\s+(mission|checklist|task|ticket)$/i, '').trim();
const cleanBoard = v => clean(v).replace(/\s+board$/i, '').trim() || clean(v);
const byText = (root, selector, text, exact = false) => { const t = lower(text); if (!root || !t) return null; const els = [...root.querySelectorAll(selector)]; return els.find(el => lower(el.textContent.trim()) === t) || (exact ? null : els.find(el => lower(el.textContent).includes(t))); };
const cardFor = (root, title) => { const t = lower(clean(title)); if (!root || !t) return null; const cards = [...root.querySelectorAll('.mi-card-button')]; return cards.find(b => lower(b.getAttribute('aria-label')) === `open mission ${t}`) || cards.find(b => lower(b.getAttribute('aria-label')).includes(t)); };

function urlFor(view) {
  if (!view) return 'app.taskmaverick.com/overview/department/running';
  const d = lower(view.detail);
  if (view.section === 'Missions') return d.includes('builder') ? 'app.taskmaverick.com/library/mission/manage' : d.includes('marketplace') || d.includes('catalog') ? 'app.taskmaverick.com/library/list/tm/marketplace' : d.includes('process') ? 'app.taskmaverick.com/library/process' : 'app.taskmaverick.com/library/list/organization';
  if (view.section === 'Reports') return d.includes('all reports') ? 'app.taskmaverick.com/reporting-v2/reports' : 'app.taskmaverick.com/reporting-v2/report/view/default';
  if (view.section === 'Dashboards') return `app.taskmaverick.com/dashboards/${d || 'reference'}`;
  return 'app.taskmaverick.com/overview/department/running';
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
const captionsNear = el => el?.closest('.dai-stage-wrap')?.querySelector('.dai-captions') || null;
const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const scrollTo = (node, top, left = node.scrollLeft, duration = 0.4) => new Promise(resolve => {
  const at = { top: node.scrollTop, left: node.scrollLeft };
  top = clamp(top, 0, node.scrollHeight - node.clientHeight); left = clamp(left, 0, node.scrollWidth - node.clientWidth);
  if (Math.abs(top - at.top) < 1 && Math.abs(left - at.left) < 1) return resolve();
  gsap.to(at, { top, left, duration, ease: 'power2.inOut', onUpdate: () => { node.scrollTop = at.top; node.scrollLeft = at.left; }, onComplete: resolve });
});

// Bring an element FULLY into view before pointing at it: scroll each list
// that clips it (phone list, tablet column, web table — innermost first) so
// the whole element sits inside what the viewer sees, above the caption bar
// when there's room. Never scrolls the page itself.
async function reveal(el) {
  if (!el?.isConnected) return;
  for (const { node, x, y } of scrollersOf(el)) {
    const nb = node.getBoundingClientRect();
    let band = cut(nb, clipOf(node));
    const cap = captionsNear(node)?.getBoundingClientRect();
    if (cap?.width && cap.left < band.right && band.left < cap.right && cap.top < band.bottom && cap.top - band.top > 180) band = { ...band, bottom: cap.top - 6 };
    const r = el.getBoundingClientRect();
    const ky = nb.height / node.offsetHeight || 1, kx = nb.width / node.offsetWidth || 1;
    const m = 10 * ky;
    // Too big to fit: show its start; otherwise the smallest move that shows all of it.
    const delta = (lo, hi, a, b) => (b - a + 2 * m > hi - lo || a < lo + m ? a - lo - m : b > hi - m ? b - hi + m : 0);
    const dy = y ? delta(band.top, band.bottom, r.top, r.bottom) / ky : 0;
    const dx = x ? delta(band.left, band.right, r.left, r.right) / kx : 0;
    if (Math.abs(dy) >= 1 || Math.abs(dx) >= 1) await scrollTo(node, node.scrollTop + dy, node.scrollLeft + dx);
  }
}
// "Is the gate locked? !No | # Chlorine (ppm) 1-3 | photo: Pool deck | text: Lot | pass: Seal" →
// mission items. A trailing !No / !Yes raises an alert ticket on that answer.
function parseItems(spec, ticketBoard) {
  return String(spec || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 8).map((raw, i) => {
    const id = `i${i + 1}`;
    let m;
    if ((m = raw.match(/^#\s*(.+)$/))) {
      let label = m[1].trim();
      const item = { id, kind: 'number', label };
      const range = label.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (range) { item.min = Number(range[1]); item.max = Number(range[2]); label = label.slice(0, range.index).trim(); }
      const max = !range && label.match(/(?:max|≤|<=|under|below)\s*(-?\d+(?:\.\d+)?)\s*$/i);
      if (max) { item.max = Number(max[1]); label = label.slice(0, max.index).trim(); }
      const unit = label.match(/\(([^)]{1,10})\)\s*$/);
      if (unit) { item.unit = unit[1]; label = label.slice(0, unit.index).trim(); }
      item.label = label;
      return item;
    }
    if ((m = raw.match(/^photo\s*:\s*(.+)$/i))) return { id, kind: 'photo', label: m[1] };
    if ((m = raw.match(/^text\s*:\s*(.+)$/i))) return { id, kind: 'text', label: m[1] };
    if ((m = raw.match(/^pass(?:\/fail)?\s*:\s*(.+)$/i))) return { id, kind: 'passfail', label: m[1] };
    const alert = raw.match(/\s*!(yes|no)\s*$/i);
    const item = { id, kind: 'yesno', label: alert ? raw.slice(0, alert.index).trim() : raw };
    if (alert && ticketBoard) { const answer = alert[1][0].toUpperCase() + alert[1].slice(1).toLowerCase(); item.ticketOn = { [answer]: { board: ticketBoard.id, title: ticketBoard.alert || 'Alert' } }; item.proofOn = { [answer]: 'photo' }; }
    return item;
  });
}
// Lists back to their top (where a mission that just moved lands).
const listsOf = root => [...(root?.querySelectorAll('.mi-column-cards, .ph-cards') || [])];

// Where to point before a directly-sent command, so the cursor shows the thing.
function hintFor(root, c) {
  const cmd = c.cmd;
  if (cmd === 'claim' || cmd === 'close') return root.querySelector('.om-cta');
  if (cmd === 'capture') return root.querySelector('.sim-proof-request button');
  if (cmd === 'lesson') return root.querySelector('.sim-lesson-launch button');
  if (cmd === 'complete') return root.querySelector('.om-body');
  if (cmd === 'rate') return root.querySelector('.chip-rate');
  if (cmd === 'board' || cmd === 'home' || cmd === 'tickets' || cmd === 'unit') return root.querySelector('.ph-title, .mi-department, .bd-header h2, .pd-shell');
  if (c.target === 'web') return root.querySelector('.ow-topbar nav .is-active') || root.querySelector('.ow-topbar');
  return null;
}

const DemoStage = forwardRef(function DemoStage({ store, interactive = false, onView, onAction, onIndustry, muted = true }, ref) {
  const outer = useRef(null), inner = useRef(null), cursor = useRef(null), ripple = useRef(null), spot = useRef(null);
  const frames = { phone: useRef(null), tablet: useRef(null), web: useRef(null) };
  const [scale, setScale] = useState(0.5);
  const scaleRef = useRef(0.5);
  const layoutRef = useRef('devices');
  const [remote, setRemote] = useState({ phone: null, tablet: null, web: null });
  const [webView, setWebView] = useState(null);
  const views = useRef({});
  const seq = useRef(0);
  const busy = useRef(false);
  const followId = useRef(0);
  const lastDevice = useRef('tablet');
  const lastPoint = useRef({ el: null, at: 0 });
  const raw = useRef({});
  const lastMission = useRef({});
  const lastSentence = useRef('');
  const results = useRef([]);
  const [preparing, setPreparingState] = useState(null);
  const preparingRef = useRef(null);
  const setPreparing = v => { preparingRef.current = v; setPreparingState(v); };
  const loaded = useRef(new Map()); // industry key → unit id
  const sim = useSim(store);

  useLayoutEffect(() => {
    const el = outer.current;
    const fit = () => { const s = Math.min(el.clientWidth / W, el.clientHeight / H); scaleRef.current = s; setScale(s); };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const place = useCallback((name, animate) => {
    const spec = LAYOUTS[name] || LAYOUTS.devices;
    for (const key of ['web', 'tablet', 'phone']) {
      const [x, y, s, o] = spec[key];
      const el = frames[key].current;
      if (!el) continue;
      const vars = { x, y, scale: s, autoAlpha: o, transformOrigin: '0 0', zIndex: key === 'phone' ? 3 : key === 'tablet' ? 2 : 1 };
      if (animate) gsap.to(el, { ...vars, duration: 0.9, ease: 'power3.inOut', overwrite: 'auto' }); else gsap.set(el, vars);
    }
  }, []);
  useLayoutEffect(() => { place('devices', false); gsap.set(cursor.current, { x: 1480, y: 820, autoAlpha: 0 }); gsap.set([spot.current, ripple.current], { autoAlpha: 0 }); }, [place]);

  const report = useCallback(() => onView?.({ stage: layoutRef.current, ...views.current }), [onView]);
  const setLayout = useCallback(name => {
    const next = LAYOUTS[name] ? name : 'devices';
    layoutRef.current = next;
    place(next, true);
    report();
  }, [place, report]);
  const shown = device => (LAYOUTS[layoutRef.current] || LAYOUTS.devices)[device][3] > 0;

  // Stage coordinates of an element's box.
  const boxOf = target => {
    const box = inner.current.getBoundingClientRect(), r = target.getBoundingClientRect ? target.getBoundingClientRect() : target, s = scaleRef.current;
    return { x: (r.left - box.left) / s, y: (r.top - box.top) / s, w: (r.right - r.left) / s, h: (r.bottom - r.top) / s };
  };
  const glide = (x, y, duration = 0.5) => new Promise(resolve => { gsap.to(cursor.current, { autoAlpha: 1, duration: 0.15 }); gsap.to(cursor.current, { x, y, duration, ease: 'power2.inOut', overwrite: 'auto', onComplete: resolve }); });

  // Point: glide next to the element and ring it (no click).
  const dodgeTimer = useRef(null);
  const pointAt = useCallback(async (el, { ring = true, duration = 0.5 } = {}) => {
    if (!el || !inner.current) return;
    lastPoint.current = { el, at: performance.now() };
    await reveal(el);
    if (!el.isConnected) return;
    const seen = cut(el.getBoundingClientRect(), clipOf(el));
    const b = boxOf(seen);
    if (b.w < 2 || b.h < 2) return;
    // Still under the caption bar (nothing left to scroll): fade the captions while pointing.
    const cap = captionsNear(outer.current);
    if (cap && overlaps(seen, cap.getBoundingClientRect())) {
      cap.classList.add('is-dodging');
      clearTimeout(dodgeTimer.current);
      dodgeTimer.current = setTimeout(() => cap.classList.remove('is-dodging'), (duration + 2.2) * 1000);
    }
    const x = b.x + Math.min(b.w * 0.5, b.w - 6), y = b.y + Math.min(b.h * 0.5, 60);
    if (ring) {
      const pad = 6;
      gsap.killTweensOf(spot.current);
      gsap.set(spot.current, { x: b.x - pad, y: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2 });
      gsap.fromTo(spot.current, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.3, delay: duration * 0.6 });
      gsap.to(spot.current, { autoAlpha: 0, duration: 0.4, delay: duration + 1.6 });
    }
    await glide(x, y, duration);
  }, []);

  // Click: glide onto the element, press, then really click it.
  const clickEl = useCallback(async (el, device, settle = 450) => {
    if (!el) return false;
    await pointAt(el, { ring: false, duration: 0.45 });
    if (!el.isConnected) return false;
    const b = boxOf(cut(el.getBoundingClientRect(), clipOf(el)));
    const x = b.x + b.w / 2, y = b.y + Math.min(b.h / 2, 60);
    gsap.fromTo(ripple.current, { x, y, scale: 0.2, autoAlpha: 0.9 }, { scale: 1.6, autoAlpha: 0, duration: 0.45, ease: 'power2.out' });
    gsap.fromTo(cursor.current, { scale: 1 }, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 });
    await sleep(140);
    el.click();
    await sleep(settle);
    return true;
  }, [pointAt]);

  const send = useCallback(async (device, c) => {
    seq.current += 1;
    setRemote(r => ({ ...r, [device]: { ...c, id: seq.current } }));
    const wait = c.cmd === 'type' ? String(c.text || '').length * 55 + 500 : SETTLE[c.cmd] || 900;
    await sleep(wait);
  }, []);

  // ---- click paths ---------------------------------------------------------------
  const deviceClicks = useCallback(async (device, c) => {
    const root = frames[device].current;
    const click = (el, settle) => clickEl(el, device, settle);
    const q = sel => root.querySelector(sel);
    const detailOpen = () => !!q('.mi-detail-inner, .sim-camera, .sim-lesson, .sim-viewer, .sim-rate, .sim-kb, .sim-proofs, .sim-result, .bn-demand');
    const backOut = async () => { for (let i = 0; i < 3 && detailOpen(); i += 1) { const b = q('.sim-head-back, .om-hbtn--back, .bn-demand-header .ph-iconbtn'); if (!b) break; await click(b, 450); } };
    const onBoard = title => { const h = q('.bd-directory, .pd-shell') ? null : q('.ph-title, .mi-department'); return h && lower(h.textContent.trim()) === lower(title); };
    // Walk there the way a person taps: Back → Home → Tickets / My Board / My Teams → tile.
    const gotoBoard = async name => {
      const boards = store.getState().boards;
      const target = boards.find(b => lower(b.title) === lower(name)) || boards.find(b => lower(b.title).includes(lower(name)));
      if (!target) return false;
      await backOut();
      if (onBoard(target.title)) return true;
      for (let step = 0; step < 6; step += 1) {
        const tile = byText(root, '.bd-location h3', target.title, true)?.closest('button');
        if (tile) { await click(tile, 1100); return true; }
        const homeTile = label => [...root.querySelectorAll('.pd-tile')].find(t => lower(t.querySelector('b')?.textContent) === lower(label));
        if (q('.pd-shell')) {
          if (target.kind === 'personal') return click(homeTile('My Board'), 1100);
          if (target.kind === 'ticket' && homeTile('Tickets')) { await click(homeTile('Tickets'), 1100); continue; }
          const row = [...root.querySelectorAll('.pd-unit-row')].find(r => lower(r.textContent).includes(lower(target.unit)));
          if (row) { await click(row, 1100); continue; }
          if (homeTile('My Teams')) { await click(homeTile('My Teams'), 700); continue; }
          return false;
        }
        const back = q('.tbl-header [aria-label="Back"], .ph-header [aria-label="Back"], .bd-header [aria-label="Back to home"]');
        if (!back) return false;
        await click(back, 1000);
      }
      return false;
    };
    switch (c.cmd) {
      case 'open': {
        const title = clean(c.mission);
        let card = cardFor(root, title);
        if (!card && detailOpen()) { await backOut(); card = cardFor(root, title); }
        if (!card) {
          // On another board: go there first (the mission that isn't closed, if any).
          const m = store.getState().missions.filter(x => lower(x.title) === lower(title) || lower(x.title).includes(lower(title))).sort((a, b) => (a.status === 'closed') - (b.status === 'closed'))[0];
          const board = m && store.getState().boards.find(b => b.id === m.boardId);
          if (board && !onBoard(board.title) && await gotoBoard(board.title)) card = cardFor(root, title);
        }
        if (!card && device === 'phone') {
          const m = store.getState().missions.filter(x => lower(x.title).includes(lower(title))).sort((a, b) => (a.status === 'closed') - (b.status === 'closed'))[0];
          const tab = m && byText(root, '.ph-tab', m.status);
          if (tab) { await click(tab, 350); card = cardFor(root, title); }
        }
        if (card) { await click(card, 750); return true; }
        return false;
      }
      case 'back': return click(q('.sim-head-back, .om-hbtn--back, [aria-label="Back"]'), 700);
      case 'menu': await backOut(); return click(q('[aria-label="Menu"]'), 700);
      case 'proofs': case 'knowledge': case 'request': {
        await backOut();
        if (!(await click(q('[aria-label="Menu"]'), 600))) return false;
        const item = byText(root, '.bn-menu-item', cmdLabel(c.cmd));
        if (!item) return false;
        await click(item, 900);
        if (c.cmd === 'request' && c.title) { const card = byText(root, '.bn-demand-card', c.title); if (card) await click(card, 900); }
        return true;
      }
      case 'tab': return click(byText(root, '.ph-tab', c.status || 'open'), 500);
      case 'expand': return click(byText(root, '.tbl-tab', c.status || 'closed')?.querySelector('.sim-expand'), 700);
      case 'collapse': return click(q('.sim-expanded .sim-expand'), 600);
      case 'translate': return click(q('.sim-lang') || q('.om-translate'), 700);
      case 'answer': {
        const m = store.get(views.current[`${device}Id`]);
        const item = root.querySelectorAll('.sim-q')[(Number(c.item) || 1) - 1];
        if (!item) return false;
        if (m?.type === 'Test' || item.querySelector('.sim-choice')) {
          const q2 = m?.questions?.[(Number(c.item) || 1) - 1];
          const index = q2 ? (lower(c.value) === 'wrong' ? (q2.correct + 1) % q2.options.length : lower(c.value) === 'right' ? q2.correct : Number(c.value) || 0) : 0;
          return click(item.querySelectorAll('.sim-choice')[index], 450);
        }
        const option = byText(item, '.sim-opt', c.value || '', true);
        if (option && !option.disabled) return click(option, 500);
        return false;
      }
      case 'board': return gotoBoard(cleanBoard(c.board));
      case 'tickets': { await backOut(); for (let i = 0; i < 3 && !q('.pd-shell'); i += 1) { const back = q('.tbl-header [aria-label="Back"], .ph-header [aria-label="Back"], .bd-header [aria-label="Back to home"]'); if (!back) break; await click(back, 1000); } const t = [...root.querySelectorAll('.pd-tile')].find(x => lower(x.querySelector('b')?.textContent) === 'tickets'); return t ? click(t, 1100) : false; }
      case 'home': { await backOut(); for (let i = 0; i < 3 && !q('.pd-shell'); i += 1) { const back = q('.tbl-header [aria-label="Back"], .ph-header [aria-label="Back"], .bd-header [aria-label="Back to home"]'); if (!back) return false; await click(back, 1000); } return !!q('.pd-shell'); }
      default: return false;
    }
  }, [clickEl, store]);

  const webClicks = useCallback(async c => {
    const root = frames.web.current;
    const click = (el, settle) => clickEl(el, 'web', settle);
    const q = sel => root.querySelector(sel);
    const goSection = async name => {
      const b = byText(root, '.ow-topbar nav button', name, true);
      if (!b) return false;
      if (!b.classList.contains('is-active')) await click(b, 900);
      return true;
    };
    const closeViews = async () => { const close = byText(root, '.wa-builder-actions button, .wa-flow-actions button', 'Close', true); if (close) await click(close, 600); };
    const missionsTab = async tab => { await goSection('Missions'); await closeViews(); const t = byText(root, '.ow-subnav button', tab, true); if (t && !t.classList.contains('is-active')) await click(t, 700); return !!t; };
    switch (c.cmd) {
      case 'section': return goSection(c.name || 'Overview');
      case 'overview': {
        await goSection('Overview');
        const board = byText(root, '.ow-subnav nav:first-child button', c.board || 'Team Board', true);
        if (board && !board.classList.contains('is-active')) await click(board, 700);
        const view = byText(root, '.ow-view-nav button', c.view || 'Running', true);
        if (view && !view.classList.contains('is-active')) await click(view, 800);
        if (c.mission) { const row = byText(root, '.ow-mission-name', clean(c.mission)); if (row) await click(row, 900); }
        return !!board;
      }
      case 'reports': { await goSection('Reports'); const back = byText(root, '.wa-report-side button', 'Back To All Reports'); if (back) await click(back, 700); return true; }
      case 'report': {
        await goSection('Reports');
        const name = clean(c.report || c.name || '');
        const current = q('.wa-report-head h2')?.textContent || '';
        if (!lower(current).includes(lower(name)) || !name) {
          const back = byText(root, '.wa-report-side button', 'Back To All Reports');
          if (back) await click(back, 700);
          const tile = byText(root, '.wa-report-tile b', name)?.closest('button');
          if (!tile) return false;
          await click(tile, 900);
        }
        if (c.group) {
          const g = byText(root, '.wa-report-tools button', 'Group by');
          if (g && !lower(g.textContent).includes(lower(c.group))) { await click(g, 400); const opt = byText(root, '.wa-dropdown button', c.group); if (opt) await click(opt, 700); }
        }
        if (c.gallery != null) {
          const want = /^(yes|true|on|1)$/i.test(String(c.gallery));
          const box = [...root.querySelectorAll('.wa-report-tools label')].find(l => l.textContent.includes('Gallery View'))?.querySelector('input');
          if (box && box.checked !== want) await click(box, 900);
        }
        return true;
      }
      case 'dashboard': case 'dashboards': { await goSection('Dashboards'); const t = byText(root, '.ow-subnav button', c.tab || 'Reference', true); if (t && !t.classList.contains('is-active')) await click(t, 800); return true; }
      case 'library': case 'missions': return missionsTab('In Library');
      case 'marketplace': return missionsTab('In Marketplace');
      case 'catalog': {
        await missionsTab('In Marketplace');
        const back = byText(root, '.wa-crumb button', 'Catalogs'); if (back) await click(back, 600);
        const card = byText(root, '.wa-catalog h4', clean(c.name || c.catalog || ''))?.closest('.wa-catalog')?.querySelector('.wa-catalog-img');
        return card ? click(card, 900) : false;
      }
      case 'process': {
        await missionsTab('Within Processes');
        const row = byText(root, '.ow-mission-name', clean(c.name || ''))?.closest('tr') || q('.wa-table tbody tr');
        return row ? click(row, 1000) : false;
      }
      case 'create': {
        await missionsTab('In Library');
        const btn = byText(root, '.ow-toolbar button', 'Create Mission');
        if (!btn) return false;
        await click(btn, 400);
        const opt = byText(root, '.wa-dropdown button', c.type || 'Task', true);
        return opt ? click(opt, 900) : false;
      }
      case 'edit': {
        await missionsTab('In Library');
        const row = byText(root, '.ow-mission-name', clean(c.mission || ''), true)?.closest('tr');
        return row ? click(row, 1000) : false;
      }
      case 'type': { const input = q('.wa-builder-form input'); if (input) await click(input, 200); return false; }
      default: return false;
    }
  }, [clickEl]);

  // Post-conditions: did the command change the app the way it should?
  const checkDone = useCallback((device, c, mid, proofsBefore) => {
    if (device === 'web') return true;
    const st = store.getState(), v = raw.current[device] || {};
    const m = mid && st.missions.find(x => x.id === mid);
    const n = (Number(c.item) || 1) - 1;
    switch (c.cmd) {
      case 'open': return !!v.mission && lower(v.mission).includes(lower(clean(c.mission)));
      case 'claim': return !!m && m.status !== 'open';
      case 'close': return !!m && m.status === 'closed';
      case 'complete': return !!m && (m.status !== 'claimed' || canClose(m));
      case 'lesson': return !!m && (m.items ? m.items.filter(i => i.kind === 'lesson') : m.lessons || []).every(l => m.lessonsDone.includes(l.id));
      case 'capture': return !!m && Object.keys(m.proofs || {}).length > proofsBefore;
      case 'answer': {
        if (!m) return false;
        if (m.type === 'Test') return m.answers[m.questions?.[n]?.id] != null;
        const it = m.items?.[n];
        return !!it && m.answers[it.id] != null && (['number', 'text'].includes(it.kind) || lower(m.answers[it.id]) === lower(c.value));
      }
      case 'board': {
        const name = lower(cleanBoard(c.board));
        const b = st.boards.find(x => lower(x.title) === name) || st.boards.find(x => lower(x.title).includes(name));
        return !b || v.boardId === b.id;
      }
      default: return true;
    }
  }, [store]);

  // ---- industries -----------------------------------------------------------------
  const note = useCallback((text, ok = true) => {
    results.current = [...results.current, `${text} ${ok ? '✓' : '✗'}`].slice(-12);
    onAction?.(`${text} ${ok ? '✓' : '✗'}`);
  }, [onAction]);
  // Put an industry on screen: its first team board on the tablet, the home
  // dashboard (with its unit on top) on the phone.
  const showUnit = useCallback(async unitId => {
    const st = store.getState();
    const first = st.boards.find(b => b.unit === unitId && b.kind === 'team');
    if (layoutRef.current === 'web' || layoutRef.current === 'phone') { setLayout('devices'); await sleep(950); }
    if (first) await deviceClicks('tablet', { cmd: 'board', board: first.title });
    await deviceClicks('phone', { cmd: 'home' });
  }, [store, deviceClicks, setLayout]);
  const summary = useCallback((unitId, source) => {
    const st = store.getState();
    const unit = st.units.find(u => u.id === unitId);
    return { industry: unit?.industry, unit: unitLabel(unitId, st.units), source,
      teams: st.boards.filter(b => b.unit === unitId && b.kind === 'team').map(b => b.title),
      tickets: st.boards.filter(b => b.unit === unitId && b.kind === 'ticket').map(b => b.title) };
  }, [store]);
  const loadIndustry = useCallback(async query => {
    const name = clean(query);
    const key = industryKey(name);
    if (!key) return;
    const st = store.getState();
    const premade = findPremade(name, INDUSTRY_PACKS);
    // The recorded demo's own restaurant / factory, or an industry already loaded: just show it.
    const already = premade?.builtin ? premade.unit : loaded.current.get(premade?.id || key);
    if (already && st.units.some(u => u.id === already)) {
      await showUnit(already);
      note(`stage · industry ${name} (already in the app)`);
      onIndustry?.(summary(already, 'existing'));
      return;
    }
    let pack = premade && !premade.builtin ? premade : null;
    if (!pack) {
      // Not premade: generate it (a few seconds) while Mav keeps talking.
      setPreparing(name);
      try {
        const res = await fetch('/api/demo-ai/industry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ industry: name }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.pack) throw new Error(data.error || `status ${res.status}`);
        pack = data.pack;
      } catch (error) {
        setPreparing(null);
        note(`stage · industry ${name} (${error.message})`, false);
        onIndustry?.({ industry: name, failed: true, error: error.message });
        return;
      }
      // Don't pull the screen from under a command that's running.
      for (let i = 0; i < 40 && busy.current; i += 1) await sleep(150);
    }
    const now = store.getState();
    const unit = store.loadPack(toSim(pack, { codes: now.units.map(u => u.id), titles: now.boards.map(b => b.title) }));
    loaded.current.set(premade?.id || key, unit.id);
    setPreparing(null);
    busy.current = true;
    try { await showUnit(unit.id); } finally { busy.current = false; }
    note(`stage · industry ${pack.industry} (${premade ? 'premade' : 'generated'})`);
    onIndustry?.(summary(unit.id, premade ? 'premade' : 'generated'));
  }, [store, showUnit, note, onIndustry, summary]);

  // Post one new mission, live, on a team board (under Open), and show it.
  const postMission = useCallback(async c => {
    const st = store.getState();
    const want = lower(cleanBoard(c.board || ''));
    const teamBoards = st.boards.filter(b => b.kind === 'team');
    const onTablet = st.boards.find(b => b.id === raw.current.tablet?.boardId);
    const board = (want && (teamBoards.find(b => lower(b.title) === want) || teamBoards.find(b => lower(b.title).includes(want))))
      || (onTablet?.kind === 'team' ? onTablet : null) || teamBoards.find(b => b.unit === st.industry?.id) || teamBoards[0];
    const tickets = st.boards.find(b => b.kind === 'ticket' && b.unit === board.unit);
    const type = ['Task', 'Checklist', 'Survey', 'Audit'].find(t => lower(t) === lower(c.type)) || (c.items ? 'Checklist' : 'Task');
    const title = clean(c.title || c.arg || '').slice(0, 48) || 'New Mission';
    const items = type === 'Task' ? undefined : parseItems(c.items, tickets && { id: tickets.id, alert: clean(c.alert) || 'Alert' });
    if (!shown('tablet')) { setLayout('devices'); await sleep(950); }
    if (raw.current.tablet?.boardId !== board.id) await deviceClicks('tablet', { cmd: 'board', board: board.title });
    const id = store.addMission(board.id, { type, title, points: type === 'Checklist' || type === 'Audit' ? 25 : 10, description: clean(c.description || c.guide || '') || undefined, notice: clean(c.notice || c.alert_text || '') || undefined, items });
    await sleep(350);
    const card = frames.tablet.current?.querySelector(`[data-mission-id="${id}"]`);
    if (card) await pointAt(card);
    note(`stage · mission ${title} on ${board.title}`, !!card);
  }, [store, deviceClicks, setLayout, pointAt, note]);

  const run = useCallback(async c => {
    if (!c) return;
    followId.current += 1;
    busy.current = true;
    try {
      if (c.target === 'stage') {
        if (c.cmd === 'restore') { store.restoreMission(clean(c.arg || c.mission || '')); await sleep(150); return; }
        if (c.cmd === 'industry') { await loadIndustry(c.arg || c.name || c.industry || ''); return; }
        if (c.cmd === 'mission') { await postMission(c); return; }
        if (LAYOUTS[c.cmd] && c.cmd === layoutRef.current) return;
        setLayout(c.cmd); await sleep(950); return;
      }
      let device = c.target;
      if (device !== 'web') {
        const other = device === 'phone' ? 'tablet' : 'phone';
        const said = devicesIn(lastSentence.current);
        // Opening follows the screen named in the sentence ("on the phone …").
        if (c.cmd === 'open' && said.length === 1 && said[0] !== device) device = said[0];
        // Mission actions go to the screen that actually has that mission open.
        if (MISSION_CMDS.includes(c.cmd) && !raw.current[device]?.missionId) {
          if (raw.current[other]?.missionId) device = other;
          else if (lastMission.current[device]) await deviceClicks(device, { cmd: 'open', mission: lastMission.current[device] });
        }
        // Never expand an empty column — point at it instead.
        if (c.cmd === 'expand') {
          const v = raw.current[device];
          const status = lower(c.status) || 'closed';
          if (v?.boardId && !column(store.getState().missions, v.boardId, status).length) {
            await pointAt(byText(frames[device].current, '.tbl-tab', status));
            onAction?.(`${device} · skipped expanding the empty ${status} column`);
            await sleep(600);
            return;
          }
        }
      }
      const label = `${device} · ${c.cmd}${Object.entries(c).filter(([k]) => !['target', 'cmd', 'id'].includes(k)).map(([, v]) => ` ${v}`).join('')}`;
      const mid = raw.current[device]?.missionId;
      const proofsBefore = mid ? Object.keys(store.get(mid)?.proofs || {}).length : 0;
      lastDevice.current = device;
      if (!shown(device)) { setLayout(device === 'web' ? 'web' : layoutRef.current === 'web' ? device : 'devices'); await sleep(950); }
      const root = frames[device].current;
      if (c.cmd === 'point') { await pointAt(findPointable(root, c.arg || c.what || c.mission || '')); await sleep(900); return; }
      // Generic: click whatever on-screen thing has that name (a row, a tab, a photo, a lesson…).
      if (c.cmd === 'click') {
        const el = findPointable(root, c.arg || '');
        const ok = el ? await clickEl(el, device, 900) : false;
        results.current = [...results.current, `${label} ${ok ? '✓' : '✗ (not on screen)'}`].slice(-12);
        onAction?.(`${label} ${ok ? '✓' : '✗ not on screen'}`);
        return;
      }
      const clicked = device === 'web' ? await webClicks(c) : await deviceClicks(device, c);
      if (!clicked) {
        const hint = hintFor(root, c);
        if (hint) { await pointAt(hint, { ring: false, duration: 0.45 }); gsap.fromTo(ripple.current, { x: gsap.getProperty(cursor.current, 'x'), y: gsap.getProperty(cursor.current, 'y'), scale: 0.2, autoAlpha: 0.9 }, { scale: 1.6, autoAlpha: 0, duration: 0.45 }); }
        await send(device, c);
      }
      // Did it really happen? If a click path didn't do it, do it directly once more.
      let ok = checkDone(device, c, raw.current[device]?.missionId || mid, proofsBefore);
      if (!ok && clicked) { await send(device, c); ok = checkDone(device, c, raw.current[device]?.missionId || mid, proofsBefore); }
      results.current = [...results.current, `${label} ${ok ? '✓' : '✗ (did not happen)'}`].slice(-12);
      onAction?.(`${label} ${ok ? '✓' : '✗ did not happen'}`);
      // A claimed / closed / requested mission lands at the top of its column.
      if (ok && ['claim', 'close', 'request'].includes(c.cmd)) for (const d of ['tablet', 'phone']) listsOf(frames[d].current).forEach(l => scrollTo(l, 0));
    } finally { busy.current = false; }
  }, [setLayout, pointAt, webClicks, deviceClicks, send, onAction, store, checkDone, loadIndustry, postMission]);

  // While a sentence plays, point at what it names, timed to the audio.
  // Make the screen show what the sentence talks about: close a drawer or an
  // expanded column hiding the column / mission it names; switch the phone tab.
  const tidy = useCallback(async text => {
    const t = spoken(text);
    const status = statusIn(text);
    const said = devicesIn(text);
    for (const d of ['tablet', 'phone']) {
      const v = raw.current[d];
      if (!shown(d) || !v || v.screen !== 'board' || !(said.includes(d) || (!said.length && lastDevice.current === d))) continue;
      const root = frames[d].current;
      if (root.querySelector('.pc-dialog, .sim-camera, .sim-lesson, .sim-viewer, .sim-result')) continue;
      const named = store.getState().missions.filter(m => m.boardId === v.boardId && t.includes(spoken(m.title)));
      if (!status && !named.length) {
        // Talking about what's inside a mission (training, questions, proof…) while it's closed: reopen it.
        const last = store.getState().missions.find(m => m.boardId === v.boardId && m.title === lastMission.current[d]);
        if (!v.missionId && last && last.status !== 'closed' && CONTENT.test(t)) await deviceClicks(d, { cmd: 'open', mission: last.title });
        continue;
      }
      const aboutOpenMission = named.length > 0 && named.every(m => m.id === v.missionId) && !status;
      if (v.missionId && !aboutOpenMission) { const back = root.querySelector('.om-hbtn--back'); if (back) await clickEl(back, d, 500); }
      if (v.expanded && status !== v.expanded) { const collapse = root.querySelector('.sim-expanded .sim-expand'); if (collapse) await clickEl(collapse, d, 500); }
      const want = named.find(m => m.id !== v.missionId)?.status || status;
      if (d === 'phone' && want && want !== raw.current.phone?.tab) { const tab = byText(root, '.ph-tab', want); if (tab) await clickEl(tab, d, 400); }
    }
  }, [clickEl, store, deviceClicks]);

  const follow = useCallback(async (text, audio) => {
    const id = ++followId.current;
    lastSentence.current = text;
    if (!busy.current) await tidy(text);
    if (id !== followId.current) return;
    const frameMap = Object.fromEntries(['phone', 'tablet', 'web'].filter(shown).map(d => [d, frames[d].current]));
    const list = mentions(text, frameMap, lastDevice.current).slice(0, 4);
    if (!list.length) return;
    const started = performance.now();
    const estimate = Math.max(1.2, text.length / 14.5);
    let next = 0;
    const tick = () => {
      if (id !== followId.current) return;
      const playing = audio && audio.currentTime > 0;
      const t = playing ? audio.currentTime : (performance.now() - started) / 1000;
      const duration = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : estimate;
      while (next < list.length && t >= list[next].at * duration - 0.35) {
        const { el } = list[next];
        next += 1;
        if (busy.current || !el.isConnected) continue;
        if (lastPoint.current.el === el && performance.now() - lastPoint.current.at < 2500) continue;
        pointAt(el);
      }
      if (next < list.length) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [pointAt, tidy]);
  const unfollow = useCallback(() => { followId.current += 1; }, []);

  // What is on every screen right now, for the AI (sent with each turn).
  const describe = useCallback(() => {
    const st = store.getState();
    const lines = [`Stage layout: ${layoutRef.current} — visible screens: ${['phone', 'tablet', 'web'].filter(shown).join(', ')}.`];
    lines.push(`UNITS in the app: ${st.units.map(u => `${u.code} ${u.name} (${u.industry})`).join('; ')}.${preparingRef.current ? ` Still setting up: ${preparingRef.current} (not on screen yet).` : ''}`);
    if (st.industry) {
      const u = st.industry;
      const boards = st.boards.filter(b => b.unit === u.id);
      lines.push(`CURRENT INDUSTRY: ${u.industry} — ${u.code} ${u.name}. ${boards.map(b => b.kind === 'ticket' ? `Ticket board "${b.title}"` : `Team "${b.title}": ${['open', 'claimed', 'closed'].map(s => `${s} ${column(st.missions, b.id, s).map(m => m.title).join(', ') || '-'}`).join(' / ')}`).join('. ')}.`);
    }
    for (const d of ['tablet', 'phone']) {
      const v = raw.current[d];
      if (!v) continue;
      const hidden = shown(d) ? '' : ' (not visible right now)';
      if (v.screen !== 'board') { lines.push(`${d.toUpperCase()}${hidden}: ${v.screen === 'home' ? `home dashboard of ${st.industry?.name || 'Taskmaverick Demo'} (tiles My Board, My Courses, My Teams, Tickets; My Teams lists the units ${st.units.map(u => u.code).join(', ')})` : v.screen === 'unit' ? `list of teams in ${v.unit}` : 'list of ticket boards'}.`); continue; }
      const cols = ['open', 'claimed', 'closed'].map(status => {
        const list = column(st.missions, v.boardId, status);
        return `${status[0].toUpperCase()}${status.slice(1)} (${list.length})${list.length ? ': ' + list.slice(0, 7).map(m => `${m.title}${status !== 'open' && m.performer ? ` [${short(m.performer)}]` : ''}`).join(', ') + (list.length > 7 ? ', …' : '') : ': EMPTY'}`;
      });
      let line = `${d.toUpperCase()}${hidden}: board "${v.board}". ${cols.join(' | ')}.`;
      if (d === 'phone') line += ` The phone lists one column at a time; it shows the ${v.tab} tab now.`;
      if (v.expanded) line += ` The ${v.expanded} column is EXPANDED, so the other columns are hidden.`;
      if (v.missionId) {
        const m = st.missions.find(x => x.id === v.missionId);
        line += ` Mission Details OPEN ${d === 'tablet' ? 'as a drawer that covers the Claimed and Closed columns' : 'full screen, covering the lists'}: "${v.mission}" — ${m?.status}${m?.performer ? ` by ${short(m.performer)}` : ''}.${progress(m)}`;
      }
      if (v.layer) line += ` On top: ${v.layer}.`;
      lines.push(line);
    }
    const web = frames.web.current;
    if (web) {
      const active = [...web.querySelectorAll('.ow-topbar nav .is-active, .ow-subnav .is-active, .ow-view-nav .is-active')].map(b => b.textContent.trim()).filter(Boolean);
      const extra = web.querySelector('.wa-report-head h2')?.firstChild?.textContent || web.querySelector('.wa-builder-head .wa-crumbs b')?.textContent || '';
      lines.push(`WEB${shown('web') ? '' : ' (not visible right now)'}: ${[...new Set(active)].join(' › ')}${extra ? ` › ${extra}` : ''}.`);
    }
    if (results.current.length) {
      lines.push(`YOUR LAST ACTIONS (what really happened): ${results.current.join('; ')}.`);
      results.current = [];
    }
    return lines.join('\n');
  }, [store]);

  useImperativeHandle(ref, () => ({ run, follow, unfollow, setLayout, describe, get layout() { return layoutRef.current; } }), [run, follow, unfollow, setLayout, describe]);

  // The industries loaded into the simulator, as Library folders and teams in the web app.
  const webLibrary = useMemo(() => sim.units.filter(u => !['L001', 'P001'].includes(u.id)).map(u => {
    const boards = sim.boards.filter(b => b.unit === u.id && b.kind === 'team');
    const seen = new Set();
    const children = boards.flatMap(b => sim.missions.filter(m => m.boardId === b.id && !seen.has(m.title) && seen.add(m.title)).map(m => ({
      title: m.title, type: m.type, guide: !!m.description, alert: !!m.notice || !!m.items?.some(i => i.ticketOn), team: [b.title], process: '', course: '',
      category: 'Operations', tag: [u.industry], items: m.items, description: m.description, notice: m.notice })));
    return { folder: true, title: `${u.industry} - ${u.name}`, count: children.length, category: 'Operations', tag: [u.industry], status: 'Active', children };
  }), [sim.units, sim.boards, sim.missions]);
  const webTeams = useMemo(() => sim.units.filter(u => !['L001', 'P001'].includes(u.id)).flatMap(u => sim.boards.filter(b => b.unit === u.id && b.kind === 'team').map(b => ({
    team: `${u.code} - ${u.name} - ${b.title}`, missions: [...new Set(sim.missions.filter(m => m.boardId === b.id).map(m => m.title))] }))), [sim.units, sim.boards, sim.missions]);

  const viewOf = key => v => {
    if (key === 'web') { views.current = { ...views.current, web: v }; setWebView(v); }
    else {
      raw.current[key] = v;
      if (v.mission) lastMission.current[key] = v.mission;
      views.current = { ...views.current, [key]: { board: v.board || v.screen, mission: v.mission ? `${v.mission} (${v.missionStatus})` : null, layer: v.layer }, [`${key}Id`]: v.missionId };
    }
    report();
  };
  const onPhone = useCallback(viewOf('phone'), [report]);
  const onTablet = useCallback(viewOf('tablet'), [report]);
  const onWeb = useCallback(viewOf('web'), [report]);

  return <div className={`dai-stage${interactive ? ' is-interactive' : ''}`} ref={outer}>
    <div className="dai-stage-inner" ref={inner} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
      <div className="dai-frame dai-frame--web" ref={frames.web}>
        <div className="dai-browser">
          <div className="dai-browser-bar"><span className="dai-lights"><i/><i/><i/></span><span className="dai-tab"><img src="/mission-logo.png" alt=""/>Taskmaverick</span></div>
          <div className="dai-browser-url"><span>‹ ›  ⟳</span><b>🔒 {urlFor(webView)}</b></div>
          <div className="dai-browser-content"><WebApp embedded remote={remote.web} onView={onWeb} library={webLibrary} teams={webTeams}/></div>
        </div>
      </div>
      <div className="dai-frame dai-frame--tablet" ref={frames.tablet}><SimDevice store={store} device="tablet" initialScreen="board" initialBoard="L001-team-a" remote={remote.tablet} onView={onTablet} muted={muted}/></div>
      <div className="dai-frame dai-frame--phone" ref={frames.phone}><SimDevice store={store} device="phone" initialScreen="board" initialBoard="L001-team-a" remote={remote.phone} onView={onPhone} muted={muted}/></div>
      {preparing && <div className="dai-preparing" role="status"><LoadingLogo/><b>Setting up a {preparing} workspace…</b><small>Teams, missions, tickets and trainings for your industry</small></div>}
      <span className="dai-spot" ref={spot} aria-hidden="true"/>
      <span className="dai-ripple" ref={ripple} aria-hidden="true"/>
      <span className="dai-cursor" ref={cursor} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 2.5 19.5 13l-7 1.4 3.9 7.3-2.6 1.3-3.9-7.3L4.5 20Z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/></svg><em>Mav</em></span>
    </div>
  </div>;
});

function cmdLabel(cmd) { return cmd === 'proofs' ? 'Media Proofs' : cmd === 'knowledge' ? 'Knowledge Base' : 'Make Request'; }

export default DemoStage;
