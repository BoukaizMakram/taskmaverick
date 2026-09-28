'use client';

// ---------------------------------------------------------------------------
// What the AI presenter can point at while it talks. `pointables(frame)` lists
// the visible elements of one screen (phone, tablet or web) with the words that
// name them; `mentions(text, frames, prefer)` finds, in a sentence, every
// on-screen thing it names — in speaking order — so the cursor can glide there
// as the word is spoken. `findPointable` resolves an explicit [[… point X]].
// ---------------------------------------------------------------------------

const lower = v => String(v ?? '').toLowerCase();
const rectOf = el => el.getBoundingClientRect();
export const cut = (a, b) => ({ left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) });
const size = r => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
const OVERLAYS = '.dai-cursor, .dai-spot, .dai-ripple, .dai-captions';

// The part of the page an element may show in: every ancestor that clips
// (overflow ≠ visible) up to and including the shared stage.
export function clipOf(el) {
  let c = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
  for (let n = el.parentElement; n; n = n.parentElement) {
    const s = getComputedStyle(n);
    if (s.overflowX !== 'visible' || s.overflowY !== 'visible') c = cut(c, rectOf(n));
    if (n.classList.contains('dai-stage')) break;
  }
  return c;
}
// Boxes between the element and its screen that can scroll it into view (the
// phone list, a tablet column, a web table), innermost first. overflow:hidden
// counts — it still scrolls from code.
export function scrollersOf(el) {
  const out = [];
  for (let n = el.parentElement; n && !n.classList.contains('dai-frame'); n = n.parentElement) {
    const s = getComputedStyle(n);
    const y = s.overflowY !== 'visible' && n.scrollHeight > n.clientHeight + 1 && n.clientHeight > 60;
    const x = s.overflowX !== 'visible' && n.scrollWidth > n.clientWidth + 1 && n.clientWidth > 60;
    if (x || y) out.push({ node: n, x, y });
  }
  return out;
}
const hits = (el, x, y) => { const top = document.elementFromPoint(x, y); return !!top && (el === top || el.contains(top) || top.contains(el) || !!top.closest(OVERLAYS)); };

// 'shown' — entirely on screen (or as much of it as fits) and not covered by a
// drawer, dialog or shade; 'scroll' — hidden or cut off inside a list, but
// scrolling that list brings it fully into view; null — can't be seen.
export function reach(el) {
  if (!el?.isConnected) return null;
  const r = rectOf(el);
  if (!(r.width > 2 && r.height > 2)) return null;
  const clip = clipOf(el), seen = cut(r, clip);
  const full = size(seen) > 0 && seen.bottom - seen.top >= Math.min(r.height, clip.bottom - clip.top) - 2 && seen.right - seen.left >= Math.min(r.width, clip.right - clip.left) - 2;
  if (full) return hits(el, (seen.left + seen.right) / 2, seen.top + Math.min((seen.bottom - seen.top) / 2, 30)) ? 'shown' : null;
  const sc = scrollersOf(el)[0];
  if (!sc) return null;
  // Where it will sit once scrolled: that spot must belong to the list (not a drawer over it).
  const band = cut(rectOf(sc.node), clipOf(sc.node));
  if (size(band) <= 0) return null;
  const x = sc.x ? (band.left + band.right) / 2 : Math.min(Math.max(r.left + r.width / 2, band.left + 2), band.right - 2);
  const y = sc.y ? (band.top + band.bottom) / 2 : Math.min(Math.max(r.top + Math.min(r.height / 2, 30), band.top + 2), band.bottom - 2);
  const top = document.elementFromPoint(x, y);
  return top && (sc.node === top || sc.node.contains(top) || top.closest(OVERLAYS)) ? 'scroll' : null;
}
const visible = el => !!reach(el);
// Combining marks (Arabic vowels, accents) are dropped so vowelized text still matches.
const words = s => lower(s).normalize('NFD').replace(/\p{M}/gu, '').replace(/["“”‘’']/g, '').replace(/[^\p{L}\p{N}%]+/gu, ' ').trim();

// [selector, names, weight] — fixed things on the product screens.
const FIXED = [
  ['.om-notice', ['red alert', 'alert box', 'red box', 'instructions', 'alert'], 3],
  ['.chip-exec', ['execution timer', 'execution time', 'live timer', 'stopwatch'], 4],
  ['.om .chip-pill', ['timer', 'aging timer', 'green timer', 'clock'], 3],
  ['.mi-column-cards .chip-pill, .mi-phone-cards .chip-pill', ['timer', 'timers', 'live timer', 'live timers', 'green timer', 'aging timer'], 2],
  ['.om-cta', ['claim button', 'close button', 'submit button'], 4],
  ['.om-translate, .sim-lang', ['blue button', 'translate', 'translation', 'spanish', 'arabic', 'language'], 3],
  ['.om .chip-points', ['points', 'gamification', 'reward points'], 3],
  ['.sim-proof-request, .sim-proof-file', ['proof', 'photo', 'video', 'evidence', 'picture'], 3],
  ['.sim-lesson-launch', ['training', 'lesson', 'micro training', 'micro lesson'], 3],
  ['.sim-trigger-card', ['trigger details', 'the answer', 'checkpoint that failed', 'checkpoint'], 3],
  ['.sim-trigger-proof', ['video', 'evidence', 'diagnosis', 'diagnostic'], 4],
  ['.sim-test-timer', ['time left', 'five minutes', 'countdown', 'timer'], 4],
  ['.pc-dialog', ['personal code', 'code', 'pin', 'six digit'], 4],
  ['.sim-toast', ['alert', 'notification'], 2],
  ['.sim-result-body', ['score', 'test completed', 'zero percent'], 3],
  ['.sim-result-note', ['assigned', 'related media', 'reassigned'], 4],
  ['.bn-menu', ['menu'], 2],
  ['.sim-proofs-list', ['media proofs', 'feed', 'instagram', 'tiktok', 'social media'], 3],
  ['.sim-kb-list', ['knowledge base', 'knowledge'], 3],
  ['.chip-days', ['expired', 'expiring', 'day badge'], 2],
  ['.chip--boosted', ['boosted', 'yellow', 'prioritized', 'priority'], 3],
  ['.sim-camera-view', ['camera', 'record', 'recording'], 3],
  // web
  ['.ow-timer', ['timers', 'timer', 'green', 'orange'], 2],
  ['.ow-data-row.is-boosted', ['boosted', 'flag'], 2],
  ['.wa-pct', ['closed %', 'percent', 'percentage', 'execution rate', 'completion rate'], 3],
  ['.wa-flag-cell', ['flagged', 'anomaly', 'anomalies', 'out of range', 'in red'], 4],
  ['.wa-gallery-media', ['gallery', 'vlog', 'videos', 'photos'], 3],
  ['.wa-preview', ['preview', 'mission preview', 'what staff will see', 'phone preview'], 4],
  ['.wa-builder-form input', ['title', 'mission title'], 3],
  ['.wa-timer-rules', ['timer colors', 'timer settings', 'green', 'orange', 'red'], 3],
  ['.wa-builder-section:last-of-type', ['mission settings', 'alert tickets', 'automated prioritization', 're assignment', 'bounce back'], 3],
  ['.wa-report-side', ['total triggered', 'summary', 'response rate'], 2],
  ['.wa-responses', ['every answer', 'answers', 'responses', 'checkpoints'], 3],
  ['.ow-drawer', ['details', 'response', 'answers'], 2],
  ['.wa-lightbox-media', ['photo', 'picture', 'image'], 4],
  ['.wa-flow-canvas', ['process', 'branch', 'branches', 'flow', 'automation'], 2],
  ['.wa-catalogs', ['catalogs', 'catalog', 'marketplace'], 2],
  ['.wa-dash-cards', ['aging', 'oldest'], 2],
];

function textOf(el) { return el.getAttribute('aria-label')?.replace(/^Open mission /, '') || el.textContent; }

// Hit-testing needs the (normally click-through) stage to accept pointer hits.
function hitTestable(frame, fn) {
  const stage = frame.closest('.dai-stage');
  const passive = stage && !stage.classList.contains('is-interactive');
  if (passive) stage.classList.add('is-interactive');
  try { return fn(); } finally { if (passive) stage.classList.remove('is-interactive'); }
}

export function pointables(frame) {
  if (!frame) return [];
  return hitTestable(frame, () => collect(frame));
}

function collect(frame) {
  const out = [];
  const add = (el, names, weight) => { const how = reach(el); if (how) out.push({ el, names: names.map(words).filter(Boolean), weight: how === 'shown' ? weight : weight - 1 }); };
  for (const [selector, names, weight] of FIXED) { const el = frame.querySelector(selector); if (el) add(el, names, weight); }
  frame.querySelectorAll('.mi-card-button').forEach(b => add(b, [textOf(b)], 5));
  frame.querySelectorAll('.om-sum-title').forEach(el => add(el.closest('.om-card') || el, [el.textContent], 6));
  frame.querySelectorAll('.tbl-tab, .ph-tab').forEach(el => {
    const status = lower(el.textContent.split('-')[0].trim());
    const names = status === 'open' ? ['open column', 'under open', 'in open', 'open tab', 'open missions', 'open list', 'waiting', 'to do'] : status === 'claimed' ? ['claimed', 'claimed column', 'claimed tab', 'in progress', 'being worked on'] : ['closed', 'closed column', 'closed tab', 'completed', 'completed tasks', 'completed missions', 'finished'];
    add(el, names, 3);
  });
  frame.querySelectorAll('.mi-department, .ph-title, .bd-header h2').forEach(el => add(el, [el.textContent], 4));
  frame.querySelectorAll('.bd-location h3').forEach(el => add(el.closest('button') || el, [el.textContent], 4));
  frame.querySelectorAll('.sim-kb-card h3, .sim-lesson-title, .bn-demand-card h3, .pd-tile b').forEach(el => add(el.closest('button') || el, [el.textContent], 4));
  // Units on the home dashboard: "H001 - Oakridge Manor Hotel" answers to the name and the code.
  frame.querySelectorAll('.pd-unit-row u').forEach(el => { const t = el.textContent; add(el.closest('button') || el, [t, t.replace(/^\S+\s*-\s*/, ''), t.split(' ')[0]], 4); });
  frame.querySelectorAll('.ow-detail-tabs button, .wa-dropdown button').forEach(el => add(el, [el.textContent], 3));
  frame.querySelectorAll('.sim-q').forEach(el => {
    const prompt = words(el.querySelector('.sim-q-prompt')?.textContent || '').replace(/^\d+\s*/, '');
    const w = prompt.split(' ');
    const phrases = [];
    for (let i = 0; i + 3 <= w.length; i += 1) phrases.push(w.slice(i, i + 3).join(' '));
    add(el, phrases, 4);
  });
  // web
  frame.querySelectorAll('.ow-topbar nav button, .ow-subnav button, .ow-view-nav button').forEach(el => add(el, [el.textContent], 3));
  frame.querySelectorAll('.ow-mission-name, .ow-group-label, .wa-report-tile b, .wa-catalog h4, .wa-node b').forEach(el => add(el.closest('button, tr') || el, [el.textContent], 4));
  return out;
}

// Every on-screen thing a sentence names, in speaking order: [{ at, el, frame }].
export function mentions(text, frames, prefer) {
  const sentence = ` ${words(text)} `;
  const deviceAt = [];
  for (const [device, re] of [['tablet', / (tablet|shared device|shared screen) /g], ['phone', / (phone|mobile|app on my phone) /g], ['web', / (web|browser|dashboard|office|desktop|computer) /g]]) {
    let m; while ((m = re.exec(sentence))) deviceAt.push({ device, at: m.index });
  }
  const hits = [];
  for (const [device, frame] of Object.entries(frames)) {
    if (!frame) continue;
    for (const p of pointables(frame)) {
      for (const name of p.names) {
        if (name.length < 3) continue;
        let from = 0, i;
        while ((i = sentence.indexOf(` ${name} `, from)) !== -1) {
          // Closest device word before the mention (within ~12 words) decides the screen.
          const before = deviceAt.filter(d => d.at <= i && i - d.at < 90).sort((a, b) => b.at - a.at)[0];
          const score = p.weight * 10 + name.length + (before ? (before.device === device ? 25 : -25) : device === prefer ? 8 : 0);
          hits.push({ at: i, end: i + name.length, el: p.el, frame, device, score });
          from = i + name.length;
        }
      }
    }
  }
  // Best hit per overlapping span, then in order; skip repeats of the same element.
  hits.sort((a, b) => b.score - a.score);
  const chosen = [];
  for (const h of hits) if (!chosen.some(c => h.at < c.end && c.at < h.end)) chosen.push(h);
  chosen.sort((a, b) => a.at - b.at);
  return chosen.filter((h, i) => i === 0 || h.el !== chosen[i - 1].el).map(h => ({ ...h, at: Math.max(0, h.at - 1) / Math.max(1, sentence.length - 2) }));
}

export function findPointable(frame, query) {
  const q = words(query);
  if (!q) return null;
  let best = null;
  for (const p of pointables(frame)) for (const name of p.names) {
    const score = name === q ? 100 : name.includes(q) || q.includes(name) ? 50 + Math.min(name.length, q.length) : 0;
    if (score && (!best || score + p.weight > best.score)) best = { el: p.el, score: score + p.weight };
  }
  return best?.el || null;
}
