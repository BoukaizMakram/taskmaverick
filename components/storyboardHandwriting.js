// Writes a chat box's words with a pen, literally: along the strokes of the letters (lib/storyboardHandwriting.mjs
// finds the path), not word by word and not line by line. The words are drawn on a canvas in their own font, exactly
// where the page has them; a second canvas collects what the pen has passed over (a round, pen-thick line); the
// first, masked by the second, is what shows, with a small nib where the pen is. When it is done the canvases go and
// the page's own words are back, so a frame never changes.
//   prepareWriting(stage, bubble)   the writing made ready (the costly part: thinning the letters), driven from outside by
//                                   progress(0..1): the storyboard's video drives it by its clock, writeWords by real time
//   writeWords(stage, bubble, ...)  the play button on a slide: prepareWriting + a clock of its own
import {penWidth, thin, timeline, writeBetween, writePath} from '@/lib/storyboardHandwriting.mjs';

const STAGE = 1600;
// What it costs to get the pen ready is the thinning of the letters and the walk along them, which go with the number of pixels (the user, 2026-10-12: stutter: a frame that
// came with words stopped the video for 60 ms). So (1) they are done on a grid this many times coarser when the picture is big (a quarter of the pixels): the pen is as thick as the
// strokes of the letters, a pixel or two of error in its path is not seen; (2) the path of words already made ready is kept: the same words set the same way are written along the same path.
const GRID = 2, PATHS = new Map();

// Every word of the chat box with where it is (stage px) and how it is set.
function wordBoxes(p, S, u) {
  const out = [], walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const cs = getComputedStyle(node.parentElement);
    for (const m of node.textContent.matchAll(/[^\s​]+/g)) {
      const range = document.createRange();
      range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
      const r = range.getClientRects()[0];
      if (!r) continue;
      out.push({text: m[0], x: (r.left - S.left) / u, y: (r.top - S.top) / u, w: r.width / u, h: r.height / u, style: cs.fontStyle, weight: cs.fontWeight, size: parseFloat(cs.fontSize) || 16, family: cs.fontFamily, spacing: parseFloat(cs.letterSpacing) || 0, color: cs.color});
    }
  }
  return out;
}

// The writing of the words of `bubble` (its root element) inside `stage`, made ready: null when there is nothing to write.
// -> {show(), progress(p), hide(), alive()}
//    show()      the canvas goes over the words, which are hidden (nothing is written yet)
//    progress(p) the pen has written p (0 to 1) of it: forward it draws on, back it starts again (so a bar can be dragged)
//    hide()      the canvas goes and the page's own words are back
//    alive()     false once the canvas was thrown away with the frame (the frame was drawn again)
export function prepareWriting(stage, bubble) {
  const p = bubble.querySelector('p');
  if (!p || !stage.isConnected) return null;
  const S = stage.getBoundingClientRect(), u = S.width / STAGE || 1, words = wordBoxes(p, S, u);
  if (!words.length) return null;

  // the canvas covers the words with a margin (the letters' loops and tails reach past their boxes)
  const PAD = 26, x0 = Math.floor(Math.min(...words.map(w => w.x)) - PAD), y0 = Math.floor(Math.min(...words.map(w => w.y)) - PAD);
  const W = Math.ceil(Math.max(...words.map(w => w.x + w.w)) + PAD - x0), H = Math.ceil(Math.max(...words.map(w => w.y + w.h)) + PAD - y0);
  const K = Math.max(1, Math.min(3, 1500 / Math.max(W, H))); // canvas px per stage px
  const cw = Math.ceil(W * K), ch = Math.ceil(H * K), D = cw * ch > 200000 ? GRID : 1;
  const canvas = () => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };
  const ink = canvas(), mask = canvas(), view = canvas();
  const g = ink.getContext('2d', {willReadFrequently: true}), m = mask.getContext('2d'), v = view.getContext('2d');

  // the words, set exactly as the page sets them (on the ink canvas; a big one is thinned from the same words on a canvas D times smaller)
  const setWords = ctx => {
    const ascent = new Map(); // (a font's ascent is the font's, not the word's: asked once for each font, not for every word)
    ctx.textBaseline = 'alphabetic';
    for (const w of words) {
      ctx.font = `${w.style} ${w.weight} ${w.size * K}px ${w.family}`;
      try { ctx.letterSpacing = `${w.spacing * K}px`; } catch {}
      ctx.fillStyle = w.color;
      if (!ascent.has(ctx.font)) ascent.set(ctx.font, ctx.measureText(w.text).fontBoundingBoxAscent);
      ctx.fillText(w.text, (w.x - x0) * K, (w.y - y0) * K + ascent.get(ctx.font));
    }
  };
  setWords(g);
  const key = JSON.stringify([cw, ch, K, D, words.map(w => [w.text, Math.round((w.x - x0) * 10), Math.round((w.y - y0) * 10), w.size, w.weight, w.style, w.family, w.spacing])]);
  let path = PATHS.get(key);
  if (path === undefined) {
    const gw = Math.ceil(cw / D), gh = Math.ceil(ch / D);
    let from = g;
    if (D > 1) { // (a quarter of the pixels to read and to walk: the cost of the pen was the letters' pixels)
      const small = document.createElement('canvas'); small.width = gw; small.height = gh;
      from = small.getContext('2d', {willReadFrequently: true}); from.scale(1 / D, 1 / D); setWords(from);
    }
    const px = new Uint32Array(from.getImageData(0, 0, gw, gh).data.buffer), bits = new Uint8Array(gw * gh), little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
    let inkCount = 0;
    for (let i = 0; i < px.length; i++) if ((little ? px[i] >>> 24 : px[i] & 255) > 96) { bits[i] = 1; inkCount++; } // (a pixel is a number, its alpha the top byte: one read for each, not four)
    const skeleton = thin(bits, gw, gh);
    let skeletonCount = 0;
    for (let i = 0; i < skeleton.length; i++) skeletonCount += skeleton[i];
    if (!skeletonCount) path = null;
    else {
      // the lines of text, top to bottom: the pen writes one, then the next
      const rows = [];
      for (const w of [...words].sort((a, b) => a.y - b.y)) {
        const row = rows.find(r => Math.abs(r.y - w.y) < w.h * .5);
        if (row) { row.top = Math.min(row.top, w.y); row.bottom = Math.max(row.bottom, w.y + w.h); } else rows.push({y: w.y, top: w.y, bottom: w.y + w.h});
      }
      const centers = rows.map(r => ((r.top + r.bottom) / 2 - y0) * K / D), bands = centers.map((c, i) => [i ? (centers[i - 1] + c) / 2 : -Infinity, i < centers.length - 1 ? (c + centers[i + 1]) / 2 : Infinity]); // (on the grid)
      const strokes = writePath(skeleton, gw, gh, {bands});
      path = {line: timeline(strokes, {bands, pause: 10 * K / D, newLine: 36 * K / D}), pen: penWidth(inkCount * D * D, skeletonCount * D)}; // (the ink's area and the skeleton's length in the canvas' own pixels)
    }
    PATHS.set(key, path);
    if (PATHS.size > 80) PATHS.delete(PATHS.keys().next().value);
  }
  if (!path) return null;
  const {line, pen} = path, color = words[0].color;

  view.setAttribute('data-sb-writing', '');
  view.style.cssText = `position:absolute;left:${x0}px;top:${y0}px;width:${W}px;height:${H}px;pointer-events:none;z-index:9000`;
  m.strokeStyle = '#000'; m.lineWidth = pen; m.lineCap = 'round'; m.lineJoin = 'round';
  let drawn = 0, shown = false, saved = '';
  return {
    show() {
      if (shown) return;
      shown = true; saved = p.style.visibility;
      stage.appendChild(view);
      p.style.visibility = 'hidden';
    },
    progress(progress) {
      if (!shown) this.show();
      const upTo = Math.min(1, Math.max(0, progress)) * line.total;
      if (upTo < drawn) { m.clearRect(0, 0, cw, ch); drawn = 0; } // (back: from the start again)
      const {segments, pen: tip} = writeBetween(line, drawn, upTo);
      drawn = upTo;
      if (segments.length) { m.beginPath(); for (const [ax, ay, bx, by] of segments) { m.moveTo(ax * D, ay * D); m.lineTo(bx * D, by * D); } m.stroke(); }
      v.clearRect(0, 0, cw, ch);
      v.globalCompositeOperation = 'source-over'; v.drawImage(ink, 0, 0);
      v.globalCompositeOperation = 'destination-in'; v.drawImage(mask, 0, 0);
      v.globalCompositeOperation = 'source-over';
      if (tip && progress > 0 && progress < 1) { v.save(); v.fillStyle = color; v.shadowColor = color; v.shadowBlur = pen * .9; v.beginPath(); v.arc(tip[0] * D, tip[1] * D, pen * .3, 0, Math.PI * 2); v.fill(); v.restore(); }
    },
    hide() {
      if (!shown) return;
      shown = false;
      view.remove();
      p.style.visibility = saved;
    },
    alive: () => !shown || view.isConnected,
  };
}

// Write the words of `bubble` (its root element) inside `stage` over `seconds`. `done('finished' | 'stopped')` runs once.
// -> {stop()}
export function writeWords(stage, bubble, {seconds = 4, done = () => {}} = {}) {
  let ended = false, raf = 0;
  const none = {stop() {}}, finish = how => { if (!ended) { ended = true; done(how); } };
  const pen = prepareWriting(stage, bubble);
  if (!pen) { finish('stopped'); return none; }
  pen.show();
  const restore = () => { cancelAnimationFrame(raf); pen.hide(); };
  const t0 = performance.now() + 150; // (a moment before the pen touches)
  const frame = now => {
    if (ended) return;
    if (!pen.alive()) { restore(); finish('stopped'); return; } // the frame was drawn again
    const progress = Math.min(1, Math.max(0, (now - t0) / 1000 / seconds));
    pen.progress(progress);
    if (progress >= 1) { setTimeout(() => { if (!ended) { restore(); finish('finished'); } }, 200); raf = 0; return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {stop() { if (ended) return; restore(); finish('stopped'); }};
}
