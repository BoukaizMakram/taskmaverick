// How a section's art becomes the frames of its board (public/storyboard/<board>.json): ONE loop for the two places that make them, so they never drift apart.
//   scripts/capture-sections.mjs      the boards on disk: the stage page (/section-stage) in a headless Chrome
//   components/demo-ai/liveCapture.js the AI demo call (/demo-ai): the same stage in a hidden frame of the visitor's page, drawn with the visitor's own data (their industry,
//                                     the missions the AI added: lib/sections/liveData.mjs), made again whenever the data changes
// The loop is the capture's own (the art, the yellow outlines, the chat box with the section's words, the cursor and its click, one frame for each step: Scene in, Outline on X,
// Bubble no words, Words, Hand on X, Click X, After the click, End of the chapter, in the split design); what draws the art is handed to it (`extract`: the state -> the art taken
// apart and the boxes of its targets), and so is the hash the assets are stored under.

// ---- The look of a frame (the split design: lib/storyboardSplit.mjs, docs/storyboard.md) ----
export const STAGE = {className: 'ad-stage iq-stage iq2-stage', style: '--iq-caption-size: 27px;', shell: 'es-player iq-player demo-text-scope'};
const PLATE = {x: -1.69, y: -2.25, w: 1601.69, h: 904.35}, PANEL = {x: 1042.61, y: 0, w: 1601.69, h: 904.35}, TITLE_PANEL_X = -1.69; // (a title: the dark panel over the whole picture, as the Improved Quality titles have it)
const rect = (key, box, background) => `<div data-sb-root="${key}" data-sb-box="rect" style="position:absolute;left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;box-sizing:border-box;background:${background}"></div>`;
const PLATE_FILL = 'linear-gradient(135deg,#656a73 0%,#656a73 50%,#9ea4b0 100%)', PANEL_FILL = 'linear-gradient(135deg,#404245 0%,#333537 50%,#444547 100%)';
const TIP = {x: 16 / 42, y: 1 / 52}, HAND = {w: 42, h: 52}, RIPPLE = 34.28, PAD = 8, PAD_MEDIUM = 11, PAD_SMALL = 15;
const round = n => Math.round(n * 100) / 100;
const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lines = words => String(words).split(' / ');
const plain = words => lines(words).join(' ');
const spans = (list, empty) => (empty ? '<span style="display:block;white-space:nowrap">&#8203;</span>' : list.map(l => `<span style="display:block;white-space:nowrap">${escape(l)}</span>`).join(''));
export const UNDER = {x: 250, y: 784, w: 1100, h: 100}; // (a chapter with `layout: 'under'`: the words under the art, in the middle of the gray band under a board shown edge to edge (768 to 900): the user, 2026-10-21)
const bubbleHtml = (words, empty, under = false) => `<div class="iq-caption iq2-caption cb-caption" style="left: ${under ? UNDER.x : 1171}px; transform: translate(0%, -50%); top: ${under ? UNDER.y + UNDER.h / 2 : 450}px; --iq2-origin: ${under ? '50% 50%' : '0% 50%'}; --iq-caption-fit: 1;" data-sb-root="bubble"><div data-demo-caption="" class="adx-title adx-msg adx-script-text adx-script-center " style="transform: translate(0px, 0px);"><p aria-label="${escape(plain(words))}" style="zoom: 1; width: max-content; max-width: none; margin-left: auto; margin-right: auto; opacity: 1; transform: none;">${spans(lines(words), empty)}</p></div></div>`;
const titleHtml = words => `<div data-demo-caption="" class="adx-title adx-msg adx-script-text adx-script-center es-title" style="transform:translate(0px,0px)" data-sb-root="title"><p aria-label="${escape(plain(words))}" style="zoom: 1; width: max-content; max-width: none; margin-left: auto; margin-right: auto; opacity: 1; transform: none;">${spans(lines(words))}</p></div>`;
const markHtml = (key, box) => `<span class="iq2-mark" aria-hidden="true" style="opacity: 1; transform: translate(${box.x}px, ${box.y}px); width: ${box.w}px; height: ${box.h}px;"${box.target ? ` data-sb-target="${escape(box.target)}" data-sb-pad-x="${box.px}" data-sb-pad-y="${box.py}"` : ''} data-sb-root="${key}"></span>`; // (`data-sb-target`: what it is round, its room round it: a video that shows the whole board puts it round it again, the CEO, 2026-10-16)
const hintHtml = box => `<span class="sec-hint" aria-hidden="true" style="position:absolute;left:0;top:0;opacity:0;pointer-events:none;transform:translate(${box.x}px,${box.y}px);width:${box.w}px;height:${box.h}px" data-sb-root="pointer-hint"></span>`;
const rippleHtml = box => `<span class="dh-ripple" aria-hidden="true" style="opacity: 0.85; transform: translate(${box.x}px, ${box.y}px); height: ${box.w}px; width: ${box.w}px;" data-sb-root="ripple"></span>`;
const handHtml = box => `<div class="dh-hand" aria-hidden="true" style="opacity: 1; transform: translate(${box.x}px, ${box.y}px) rotate(0deg) scale(1);" data-sb-root="hand"><img alt="" draggable="false" src="/demo-hand.png"></div>`;
const nice = key => String(key ?? '').replace(/^(yes|no|quiz|rate|iso|web)-?/, '$1 ').replace(/[-_:]+/g, ' ').trim().replace(/^\w/, c => c.toUpperCase());
const markKey = m => (m.col ? `col:${m.col}` : m.head ? `head:${m.head}` : m.rows ? `rows:${m.rows}:${m.to}` : m.target); // (what an outline goes round: a target, a column, a column's title, the rows of a state)
const markName = m => nice(m.col ? `${m.col} column` : m.head ? `${m.head} title` : m.rows ? `${m.rows} rows` : m.target);
const merge = (a, b) =>({...a, ...(b ?? {}), ...(b && 'pan' in b && !('focus' in b) ? {focus: null} : {})}); // (a state that says where the page is takes the centering off it)

// ---- Runs inside the stage's page ----
// The art taken apart. A stage marks each piece of its art with `data-sec-part="<layer name>"` (Report, Tablet, Mission, Lifted mission, Layer... the names the video knows: lib/storyboardPlayer.mjs `isArt`):
// every piece is cloned (scrolled lists made into transforms, so the video can move them) with its box, and the box of every target asked for is measured (what a window shows of it:
// `data-sec-window` on an element says which one clips its targets; else the piece itself). It is self-contained: the capture script sends its source to the page (`toString`).
export function extract(targets, stage = document.getElementById('sec-stage')) {
  const S = stage.getBoundingClientRect();
  const k = S.width / (stage.offsetWidth || 1); // (the page may film the stage bigger than its 1600: every box is in stage px)
  const num = v => Math.round(v * 100) / 100, box = r => ({x: num((r.left - S.left) / k), y: num((r.top - S.top) / k), w: num(r.width / k), h: num(r.height / k)});
  const roots = [...stage.querySelectorAll('[data-sec-part]')].filter(el => !el.parentElement.closest('[data-sec-part]'));
  const slug = name => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const seen = {};
  const parts = roots.map(art => {
    const clone = art.cloneNode(true), live = [...art.querySelectorAll('*')], copy = [...clone.querySelectorAll('*')];
    live.forEach((el, i) => {
      const top = el.scrollTop, left = el.scrollLeft;
      if (!(top > 0 || left > 0) || !copy[i] || !copy[i].firstElementChild) return;
      copy[i].style.overflow = 'hidden';
      const first = copy[i].firstElementChild; first.style.transform = `${first.style.transform ? first.style.transform + ' ' : ''}translate(${-left}px, ${-top}px)`;
    });
    clone.querySelectorAll('canvas,script,noscript').forEach(n => n.remove());
    clone.querySelectorAll('[tabindex]').forEach(n => n.removeAttribute('tabindex'));
    clone.querySelectorAll('img[loading]').forEach(n => n.removeAttribute('loading'));
    const name = art.dataset.secPart, base = slug(name), n = (seen[base] = (seen[base] ?? 0) + 1), key = n > 1 ? `${base}-${n}` : base;
    clone.setAttribute('data-sb-root', key);
    return {name, key, html: clone.outerHTML, box: box(art.getBoundingClientRect()), ...(art.hasAttribute('data-sec-cut') ? {cut: true} : {})}; // (`data-sec-cut`: a piece zoomed into, stacked under the gray side: `layersOf`)
  });
  const found = {};
  for (const t of targets) {
    let r = null, el = null;
    const key = t.col ? `col:${t.col}` : t.head ? `head:${t.head}` : t.rows ? `rows:${t.rows}:${t.to}` : t.target;
    if (t.col) { const th = stage.querySelector(`th[data-iq-col="${t.col}"]`), scroll = th?.closest('.ow-table-scroll'); el = th; if (th && scroll) { const a = th.getBoundingClientRect(), b = scroll.getBoundingClientRect(); r = {left: a.left, top: a.top, width: a.width, height: b.bottom - a.top}; } }
    else if (t.head) { el = stage.querySelector(`th[data-iq-col="${t.head}"]`); if (el) { const q = el.getBoundingClientRect(); r = {left: q.left, top: q.top, width: q.width, height: q.height}; } } // (a column's title by itself)
    else if (t.rows) { // (the rows of the missions in a state, from their left edge (the name) to the right of the column `to`, as far as the rows' list shows them: the CEO, 2026-10-20)
      el = stage.querySelector(`th[data-iq-col="${t.to}"]`); const area = el?.closest('.ow-table-scroll')?.querySelector('.iq-ow-rows');
      if (el && area) { const A = area.getBoundingClientRect(), rows = [...area.querySelectorAll(`tr[data-ov-state="${t.rows}"]`)].filter(tr => { const q = tr.getBoundingClientRect(); return q.bottom > A.top + 1 && q.top < A.bottom - 1; }), rs = rows.map(tr => tr.getBoundingClientRect()); if (rs.length) { const left = Math.min(...rows.map(tr => (tr.querySelector('.ow-number') ?? tr).getBoundingClientRect().left)), top =Math.max(A.top, Math.min(...rs.map(q => q.top))), bottom = Math.min(A.bottom, Math.max(...rs.map(q => q.bottom))); r = {left, top, width: el.getBoundingClientRect().right - left, height: bottom - top}; } }
    }
    else { el = stage.querySelector(`[data-iq-target="${t.target}"]`); if (el) { const q = el.getBoundingClientRect(); r = {left: q.left, top: q.top, width: q.width, height: q.height}; } }
    if (r) {
      // only what the window shows of it
      const A = (el.closest('[data-sec-window]') ?? el.closest('[data-sec-part]') ?? stage).getBoundingClientRect();
      const left = Math.max(r.left, A.left), top = Math.max(r.top, A.top), right = Math.min(r.left + r.width, A.right), bottom = Math.min(r.top + r.height, A.bottom);
      found[key] = right > left && bottom > top ? {...box({left, top, width: right - left, height: bottom - top}), clipped: left > r.left + 1 || right < r.left + r.width - 1} : null;
    } else found[key] = null;
  }
  return {parts, targets: found};
}

// A short hash of an asset's HTML (where a page has no crypto at hand: the demo call). The script on disk keeps its SHA-1, so the boards' files do not change.
export function quickHash(text) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ((h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')).slice(0, 12);
}

// ---- The loop ----
// The frames of a section (`spec`: lib/sections/<id>.mjs). `draw(state, targets)` draws the art at a state and takes it apart (`extract`, in the stage's page) -> {parts, targets};
// `hash(html)` -> the key an asset is stored under. `only`: the ids of the chapters to make (the others are left out). `onOutlines(chapter, count, boxes)`: the outlines of a chapter
// as they are measured (the script draws them on a picture to look at them). `log` / `warn`: what it says as it goes.
// -> {version, video, name, size, stage, chapters, frames, assets} (the board's file without its `generated` date)
export async function captureSection(spec, {draw, hash, only = [], onOutlines = null, log = () => {}, warn = () => {}}) {
  const assets = {}, frames = [], chapters = [];
  const asset = html => { const key = hash(html); assets[key] = html; return key; };
  let state = {...spec.base}, time = 0;
  // The art at a state, and where the targets are in it.
  let pointing = []; // (the targets the cursor that only points goes to in the chapter, the first that is in view: `chapter.point`)
  const look = async (s, targets = []) => {
    const found = await draw(s, [...targets, ...pointing.map(target => ({target}))]);
    const at = pointing.find(t => found.targets[t]);
    found.parts.point = at ? found.targets[at] : null;
    return found;
  };
  for (const [index, chapter] of spec.chapters.entries()) {
    if (only.length && !only.includes(chapter.id)) continue;
    const start = round(time), made = {};
    pointing = chapter.point ? [].concat(chapter.point) : [];
    const under = chapter.layout === 'under';
    const layersOf = (parts, {mode = null, words = null, panel = !chapter.title && !under} = {}) => {
      const side = {key: 'panel', name: 'Panel', kind: 'dom', box: {...PANEL, x: panel ? PANEL.x : TITLE_PANEL_X}, html: rect('panel', {...PANEL, x: panel ? PANEL.x : TITLE_PANEL_X}, PANEL_FILL)}, cut = parts.art?.some(a => a.cut); // (`cut`: a piece zoomed into goes into the words' side, and the gray side is over it: the tablet is cut there, the video does not film it from further back)
      const layers = [{key: 'plate', name: 'Plate', kind: 'dom', box: PLATE, html: rect('plate', PLATE, PLATE_FILL)}, ...(cut ? [] : [side])];
      for (const a of parts.art ?? []) layers.push({key: a.key, name: a.name, kind: 'dom', box: a.box, html: a.html});
      if (cut) layers.push(side);
      if (parts.art?.point) { const r = parts.art.point, box = {x: round(r.x - PAD), y: round(r.y - PAD), w: round(r.w + 2 * PAD), h: round(r.h + 2 * PAD)}; layers.push({key: 'pointer-hint', name: 'Pointer hint', kind: 'dom', box, html: hintHtml(box)}); } // (where the cursor that only points goes: round what the words are about, like an outline, which is not drawn)
      if (words != null && mode) layers.push({key: 'bubble', name: 'Chat bubble', kind: 'bubble', box: under ? UNDER : {x: 1171, y: 400, w: 300, h: 100}, style: 'closed', tip: null, html: bubbleHtml(words, mode === 'empty', under)});
      (parts.marks ?? []).forEach(({target, px, py, ...box}, i) => layers.push({key: i ? `circle-${i + 1}` : 'circle', name: 'Yellow outline', kind: 'dom', box, html: markHtml(i ? `circle-${i + 1}` : 'circle', {...box, target, px, py})}));
      if (parts.ripple) layers.push({key: 'ripple', name: 'Click ripple', kind: 'dom', box: parts.ripple, html: rippleHtml(parts.ripple)});
      if (parts.hand) layers.push({key: 'hand', name: 'Hand', kind: 'dom', box: parts.hand, html: handHtml(parts.hand)});
      return layers;
    };
    const push = (kind, label, parts, extra) => {
      made[kind] = (made[kind] ?? 0) + 1;
      const frameId = `${chapter.id}/${kind}${made[kind] > 1 ? `-${made[kind]}` : ''}`;
      time = round(time + 1.2);
      frames.push({id: frameId, chapter: chapter.id, chapterNumber: index + 1, kind, label, time, at: round(time - start), bubble: extra?.mode ?? null, scene: {id: chapter.id, view: chapter.title ? 'title' : chapter.view ?? spec.view ?? 'web', ...(under ? {under: true} : {})}, stageClass: STAGE.className,
        layers: layersOf(parts, {mode: extra?.mode, words: chapter.words, panel: !chapter.title && !under}).map(({html, ...layer}) => ({...layer, asset: asset(html)}))});
    };
    if (chapter.title) {
      time = round(time + 1.2);
      frames.push({id: `${chapter.id}/words`, chapter: chapter.id, chapterNumber: index + 1, kind: 'words', label: 'Words', time, at: 1.2, bubble: 'words', scene: {id: chapter.id, view: 'title'}, stageClass: STAGE.className,
        layers: [...layersOf({}, {panel: false}).map(({html, ...layer}) => ({...layer, asset: asset(html)})), {key: 'title', name: 'Title', kind: 'dom', box: {x: 0, y: 0, w: 1600, h: 900}, asset: asset(titleHtml(chapter.words))}]});
      chapters.push({id: chapter.id, number: index + 1, title: chapter.name, words: plain(chapter.words), start, end: round(time + 1.2)});
      time = round(time + 1.2);
      log(`✓ ${chapter.id} (title)`);
      continue;
    }
    if (chapter.fromBefore) push('before', 'As the scene before ends', {art: (await look(state)).parts}); // (`fromBefore`: the chapter goes on from the picture the one before ends on, a zoom into it: that picture is its first slide, a video that starts here opens on it)
    state = merge(merge(state, {focus: null}), chapter.art);
    const markTargets = (chapter.marks ?? []).map(markKey);
    const focusOf = count => chapter.focus ?? (chapter.marksSequence ? [markTargets[count - 1]] : markTargets.slice(0, count)); // (what the page is centered on while the first `count` outlines are shown; `focus`: the chapter says, when all of them do not fit in the window)
    let lastParts = null;
    const outlinesOf = async (s, marks, count) => {
      state = merge(state, {focus: focusOf(count)}); // (the page goes to what is outlined, as far as it goes: the window is never empty at an edge, nothing but what is inside it moves)
      const found = await look({...s, focus: focusOf(count)}, marks); const boxes = []; lastParts = found.parts;
      for (const m of chapter.marksSequence ? [marks[count - 1]] : marks.slice(0, count)) { // (`marksSequence`: one outline at a time, going from one to the next; else they add up)
        const r = found.targets[markKey(m)];
        if (!r) { warn(`! ${chapter.id}: ${JSON.stringify(m)} is not in view`); continue; }
        const small = Math.min(r.w, r.h), base = m.pad ?? (small < 36 ? PAD_SMALL : small < 70 ? PAD_MEDIUM : PAD), px = m.padX ?? base, py = m.padY ?? base; // (a small thing gets room: the outline's thick border does not touch it)
        boxes.push({x: round(r.x - px), y: round(r.y - py), w: round(r.w + 2 * px), h: round(r.h + 2 * py), target: markKey(m), px, py});
      }
      if (onOutlines && boxes.length) await onOutlines(chapter, count, boxes);
      return {found, boxes};
    };
    const marks = chapter.marks ?? [], acts = chapter.acts ?? [];
    const counts = chapter.marksTogether ? [marks.length] : marks.map((_, i) => i + 1); // (`marksTogether`: all the outlines of the chapter at once, one frame (the CEO, 2026-10-28: "highlight these two simultaneously"); else one after the other)
    // the scene comes in, centered on what it is about: the first outline, else what the cursor presses first
    if (!('focus' in (chapter.art ?? {}))) state = merge(state, {focus: acts.length && !chapter.marksFirst ? [acts[0].target] : marks.length && !chapter.marksAfter ? focusOf(1) : null});
    const first = await look(state);
    let art = first.parts;
    push('start', 'Scene in', {art});
    const withMarks = marks.length && (!acts.length || chapter.marksFirst) && !chapter.marksAfter && !chapter.marksLate; // (`marksAfter`: the outlines are drawn on the state the chapter ends in)
    let boxes = [];
    if (withMarks) { for (const k of counts) { ({boxes} = await outlinesOf(state, marks, k)); push('mark', `Outline on ${markName(marks[k - 1])}${marks.length > 1 ? ` (${k} of ${marks.length})` : ''}`, {art: lastParts, marks: boxes}); } art = lastParts; }
    push('bubble', 'Bubble, no words', {art, marks: boxes}, {mode: 'empty'});
    push('words', 'Words', {art, marks: boxes}, {mode: 'words'});
    if (chapter.marksLate && marks.length) for (const k of counts) { ({boxes} = await outlinesOf(state, marks, k)); push('mark', `Outline on ${markName(marks[k - 1])}${marks.length > 1 ? ` (${k} of ${marks.length})` : ''}`, {art: lastParts, marks: boxes}, {mode: 'words'}); } // (`marksLate`: the words first, then the outlines one after the other)
    if (chapter.marksLate && lastParts) art = lastParts;
    let current = art;
    for (const [k, step] of (chapter.before ?? []).entries()) { // (the art goes on to a state before the cursor works on it: a quiz that pops, a list that fills)
      state = merge(state, step.state ?? step); const more = await look(state); current = more.parts;
      push('end', `End of the chapter: ${step.name ?? k + 1}`, {art: current, marks: boxes}, {mode: 'words'});
    }
    // the cursor presses what the words are about, one act after the other
    for (const [k, act] of acts.entries()) {
      const nth = acts.length > 1 ? ` (${k + 1} of ${acts.length})` : '', before = await look(state = merge(state, {focus: [act.target]}), [{target: act.target}]), spot = before.targets[act.target];
      if (!spot) { warn(`! ${chapter.id}: ${act.target} is not in view`); continue; }
      const tip = {x: spot.x + spot.w / 2, y: spot.y + spot.h / 2}, hand = {x: round(tip.x - HAND.w * TIP.x), y: round(tip.y - HAND.h * TIP.y), ...HAND}, ripple = {x: round(tip.x - RIPPLE / 2), y: round(tip.y - RIPPLE / 2), w: RIPPLE, h: RIPPLE};
      current = before.parts;
      push('hand', `Hand on ${nice(act.target)}${nth}`, {art: current, hand}, {mode: 'words'});
      push('click', `Click ${nice(act.target)}${nth}`, {art: current, hand, ripple}, {mode: 'words'});
      state = merge(state, act.state);
      const after = await look(state);
      current = after.parts;
      push('result', `After the click${nth}`, {art: current, hand}, {mode: 'words'});
      for (const [j, next] of (act.then ?? []).entries()) { // (what the click goes on to do by itself: a mission that opens and then expands, a list that scrolls on)
        state = merge(state, next.state ?? next); const more = await look(state); current = more.parts;
        push('end', `End of the chapter: ${next.name ?? `${act.name ?? nice(act.target)} ${j + 1}`}`, {art: current, hand}, {mode: 'words'});
      }
      if (k === acts.length - 1) boxes = [];
    }
    if (marks.length && acts.length && !chapter.marksAfter && !chapter.marksFirst && !chapter.marksLate) { // what is outlined once the cursor has done its work
      for (const k of counts) { ({boxes} = await outlinesOf(state, marks, k)); push('mark', `Outline on ${markName(marks[k - 1])}${marks.length > 1 ? ` (${k} of ${marks.length})` : ''}`, {art: lastParts, marks: boxes, hand: undefined}, {mode: 'words'}); }
      current = lastParts;
    }
    const steps = chapter.end ? (Array.isArray(chapter.end) ? chapter.end : [chapter.end]) : []; // (the art goes on to another state, or one after the other: `end` is a state, or a list of states)
    for (const [k, step] of steps.entries()) { const name = step.state ? step.name : null; state = merge(state, step.state ?? step); if (chapter.marksAfter && markTargets.length && k === steps.length - 1) state = merge(state, {focus: focusOf(1)}); const end = await look(state); current = end.parts; if (step.marks === false) boxes = []; // (the outlines go when this state comes: they would be where the rows were)
      push('end', steps.length > 1 || name ? `End of the chapter: ${name ?? k + 1}` : 'End of the chapter', {art: current, marks: boxes}, {mode: 'words'}); }
    if (chapter.marksAfter && marks.length) for (const k of counts) { ({boxes} = await outlinesOf(state, marks, k)); push('mark', `Outline on ${markName(marks[k - 1])}${marks.length > 1 ? ` (${k} of ${marks.length})` : ''}`, {art: lastParts, marks: boxes}, {mode: 'words'}); }
    chapters.push({id: chapter.id, number: index + 1, title: chapter.name, words: plain(chapter.words), start, end: round(time + 1.2)});
    time = round(time + 1.2);
    log(`✓ ${chapter.id}: ${frames.filter(f => f.chapter === chapter.id).map(f => f.kind).join(', ')}`);
  }
  frames.forEach((f, i) => { f.n = i + 1; });
  return {version: 1, video: spec.board, name: spec.name, size: [1600, 900], stage: STAGE, chapters, frames, assets};
}

// ---- The look the board gives a new frame ----
// The split design's look of the words (white, no chat box, no tail, 300 wide) on every frame that has them, and the tablet of the Improved Quality videos (the user, 2026-10-15: "use the
// tablet we used in improve quality": a flat black frame, thinner (its screen 1.03 times as big), the titles of its columns at 15.67 px), unless the frame has a look of its own already
// (what you changed on the board stays). `frames`: the captured ones; `own`: edits.frames. -> the frames' edits with those looks added (`own` itself when nothing is added).
const TABLET = {bezel: {kind: 'linear', stops: [{color: '#000000', at: 0}, {color: '#000000', at: 100}], angle: 0, flat: true}};
export function defaultLooks(frames, own = {}, at = new Date().toISOString()) {
  const next = {...own};
  let added = false;
  for (const f of frames) if (f.layers.some(l => l.kind === 'bubble') && !next[f.id]) { next[f.id] = {styles: {bubble: {strokeWidth: 0, fill: 'transparent', stroke: '#ffffff', color: '#ffffff', font: 'caveat', size: 34.99}}, bubbles: {bubble: {tail: false}}, sizes: {bubble: [f.scene?.under ? UNDER.w : 300, 0]}, updatedAt: at}; added = true; }
  for (const f of frames) if (f.layers.some(l => l.key === 'title') && !next[f.id]) { next[f.id] = {styles: {title: {font: 'poppins', color: '#ffffff', weight: 700, size: 36}}, updatedAt: at}; added = true; } // (36: the CEO, 2026-10-16, and the user, 2026-10-19: titles 36) // (white, like the Improved Quality titles)
  for (const f of frames) for (const layer of f.layers.filter(l => /^tablet/.test(l.key))) {
    const mine = next[f.id] ?? {}, k = layer.key;
    if (mine.styles?.[k]?.bezel) continue;
    const styles = {...(mine.styles ?? {}), [k]: {...(mine.styles?.[k] ?? {}), ...TABLET}}, scales = {...(mine.scales ?? {}), [`${k}/0.0.0.0`]: [1.03, 1.03]};
    for (const i of [0, 1, 2]) styles[`${k}/0.0.0.0.0.2.${i}.0`] = {...(styles[`${k}/0.0.0.0.0.2.${i}.0`] ?? {}), size: 15.67};
    next[f.id] = {...mine, styles, scales, updatedAt: at};
    added = true;
  }
  return added ? next : own;
}
