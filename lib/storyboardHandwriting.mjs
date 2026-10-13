// Handwriting, literally: a text appears as if a pen wrote it, along the strokes of its letters (not word by
// word, not line by line). The text is drawn as pixels, thinned to the center line of every stroke (a skeleton),
// and those lines are walked the way a hand writes: line after line, left to right, each stroke followed from
// its start to its end, the pen lifting and going on at the nearest stroke ahead of it. The page then reveals the
// text's own pixels along that path with a pen-thick line (components/storyboardHandwriting.js). Pure: bitmaps in,
// strokes and a timeline out.
const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

// Zhang-Suen thinning: `bits` (w x h, 1 = ink) -> a new bitmap whose strokes are one pixel wide. (The user, 2026-10-12: stutter: this was the costliest part of getting the pen ready, 30 ms
// of the 65 for one sentence, so a frame that came with words stopped the video for it. It works on a copy with a rim of empty pixels (no bounds checks) and only on the pixels
// that are still ink, which are fewer with every pass; what it gives is the same, pixel for pixel.)
export function thin(bits, w, h) {
  const W = w + 2, img = new Uint8Array(W * (h + 2));
  for (let y = 0; y < h; y++) img.set(bits.subarray ? bits.subarray(y * w, y * w + w) : bits.slice(y * w, y * w + w), (y + 1) * W + 1);
  let candidates = [];
  for (let y = 1; y < h - 1; y++) for (let i = (y + 1) * W + 2, end = (y + 1) * W + w; i < end; i++) if (img[i]) candidates.push(i); // (the pixels on the outer rim of the picture are never taken off)
  const mark = [];
  for (let changed = true; changed;) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      mark.length = 0;
      for (let k = 0; k < candidates.length; k++) {
        const i = candidates[k];
        if (!img[i]) continue;
        const p2 = img[i - W], p3 = img[i - W + 1], p4 = img[i + 1], p5 = img[i + W + 1], p6 = img[i + W], p7 = img[i + W - 1], p8 = img[i - 1], p9 = img[i - W - 1];
        const sum = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (sum < 2 || sum > 6) continue;
        const turns = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
        if (turns !== 1) continue;
        if (step === 0 ? (p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0) : (p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0)) mark.push(i);
      }
      if (mark.length) { changed = true; for (let k = 0; k < mark.length; k++) img[mark[k]] = 0; }
    }
    candidates = candidates.filter(i => img[i]);
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) out.set(img.subarray((y + 1) * W + 1, (y + 1) * W + 1 + w), y * w);
  return out;
}

// The strokes of a skeleton in the order a hand would write them: [[ [x, y], ... ], ...].
// `bands`: the text's lines as [y0, y1] (top to bottom): each is written in turn, left to right.
export function writePath(skel, w, h, {bands = null} = {}) {
  const lines = bands?.length ? bands : [[-Infinity, Infinity]], mid = ([a, b]) => (a + b) / 2;
  const owner = new Int16Array(w * h).fill(-1), list = lines.map(() => []);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (skel[y * w + x]) {
    let best = 0;
    lines.forEach((band, k) => { if (y >= band[0] && y <= band[1]) best = k; else if (Math.abs(y - mid(band)) < Math.abs(y - mid(lines[best])) && !(y >= lines[best][0] && y <= lines[best][1])) best = k; });
    owner[y * w + x] = best; list[best].push(y * w + x);
  }
  const done = new Uint8Array(w * h), out = [];
  const free = (i, line) => i >= 0 && !done[i] && owner[i] === line;
  const open = (i, line) => { let n = 0; const x = i % w, y = (i / w) | 0; for (const [dx, dy] of N8) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && free(ny * w + nx, line)) n++; } return n; };
  for (let line = 0; line < lines.length; line++) {
    for (const piece of piecesOf(list[line], line, owner, w, h)) {
    let left = piece.length, pen = null;
    const pixels = piece;
    while (left > 0) {
      // where the next stroke starts: the first one begins at the top left end of the piece (a stem is written downwards);
      // after that an end of a line, the nearest to the pen, a little ahead of it
      let start = -1, best = Infinity;
      for (const i of pixels) {
        if (done[i]) continue;
        const x = i % w, y = (i / w) | 0;
        const cost = pen ? Math.hypot(x - pen[0], y - pen[1]) + (x < pen[0] - 4 ? (pen[0] - x) * 1.5 : 0) + (open(i, line) >= 2 ? 9 : 0) : x + y * .8 + (open(i, line) >= 2 ? 40 : 0);
        if (cost < best) { best = cost; start = i; }
      }
      if (start < 0) break;
      // follow it: straight on where it can, else the closest turn
      const stroke = [[start % w, (start / w) | 0]];
      done[start] = 1; left--;
      let cur = start, dir = null;
      for (;;) {
        const x = cur % w, y = (cur / w) | 0;
        let next = -1, score = -Infinity;
        for (const [dx, dy] of N8) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || !free(ny * w + nx, line)) continue;
          const s = (dir ? (dx * dir[0] + dy * dir[1]) / Math.hypot(dx, dy) : 0) - (dx && dy ? .01 : 0); // (a straight step before a diagonal one)
          if (s > score) { score = s; next = ny * w + nx; }
        }
        if (next < 0) break;
        const nx = next % w, ny = (next / w) | 0;
        if (nx !== x && ny !== y) { // a diagonal step: the pixel at its corner would be left behind on its own, so the pen goes through it
          const across = y * w + nx, down = ny * w + x;
          if (free(across, line)) { done[across] = 1; left--; stroke.push([nx, y]); }
          if (free(down, line)) { done[down] = 1; left--; } // (the other corner: the pen's width covers it)
        }
        dir = dir ? [dir[0] * .7 + (nx - x) * .3, dir[1] * .7 + (ny - y) * .3] : [nx - x, ny - y];
        stroke.push([nx, ny]); done[next] = 1; left--; cur = next;
      }
      out.push(stroke);
      pen = stroke.at(-1);
    }
    }
  }
  return out;
}

// The pieces of one line of text in the order they are written: a piece is a set of pixels that touch (a letter, or a
// whole word in a joined hand), the pieces go left to right, and a small piece sitting over a bigger one (the dot of an
// i, the bar of a t, an accent) waits until the bigger one is written. -> [[pixel index, ...], ...]
function piecesOf(pixels, line, owner, w, h) {
  const seen = new Set(), pieces = [];
  for (const first of pixels) {
    if (seen.has(first)) continue;
    const piece = [first], box = {x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity};
    seen.add(first);
    for (let k = 0; k < piece.length; k++) {
      const i = piece[k], x = i % w, y = (i / w) | 0;
      box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x); box.y0 = Math.min(box.y0, y); box.y1 = Math.max(box.y1, y);
      for (const [dx, dy] of N8) {
        const nx = x + dx, ny = y + dy, j = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || owner[j] !== line || seen.has(j)) continue;
        seen.add(j); piece.push(j);
      }
    }
    pieces.push({pixels: piece, ...box, key: box.x0});
  }
  const tall = Math.max(0, ...pieces.map(p => p.y1 - p.y0));
  const small = p => p.y1 - p.y0 < tall * .4 && p.x1 - p.x0 < tall * .6;
  for (const p of pieces) {
    if (!small(p)) continue;
    const cx = (p.x0 + p.x1) / 2, host = pieces.filter(q => !small(q) && cx >= q.x0 - 6 && cx <= q.x1 + 6).sort((a, b) => a.x0 - b.x0).at(-1);
    if (host) p.key = host.x1 + p.x0 * 1e-4; // (written right after the piece it belongs to)
  }
  return pieces.sort((a, b) => a.key - b.key).map(p => p.pixels);
}

// The strokes as steps of a timeline: each step is a piece of line (drawn: the pen is down) or a lift (the pen
// moves to the next stroke without writing). `units` is the time a step takes, in pen lengths (`at`: when it starts):
// a lift costs a little (a quarter of its distance and a fixed pause), going to a new line a bit more.
export function timeline(strokes, {lift = .25, pause = 10, newLine = 36, bands = null} = {}) {
  const steps = [];
  let pen = null, total = 0, lineOf = null;
  const bandOf = y => (bands?.length ? Math.max(0, bands.findIndex(b => y <= b[1])) : 0);
  const add = step => { steps.push({...step, at: total}); total += step.units; };
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    const first = stroke[0], line = bandOf(first[1]);
    if (pen) {
      const d = Math.hypot(first[0] - pen[0], first[1] - pen[1]);
      add({x0: pen[0], y0: pen[1], x1: first[0], y1: first[1], units: (d > 1.5 ? d * lift + pause : .5) + (line !== lineOf ? newLine : 0), draw: false});
    }
    for (let k = 1; k < stroke.length; k++) {
      const a = stroke[k - 1], b = stroke[k];
      add({x0: a[0], y0: a[1], x1: b[0], y1: b[1], units: Math.hypot(b[0] - a[0], b[1] - a[1]), draw: true});
    }
    if (stroke.length === 1) add({x0: first[0], y0: first[1], x1: first[0], y1: first[1], units: .5, draw: true}); // (a dot)
    pen = stroke.at(-1); lineOf = line;
  }
  return {steps, total};
}

// What the pen does between two moments of the writing (`from` < `to`, in units): the pieces of line it draws and where it is
// at `to`. -> {segments: [[x0, y0, x1, y1]], pen: [x, y] | null}
export function writeBetween(line, from, to) {
  const {steps} = line, segments = [];
  let lo = 0, hi = steps.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (steps[mid].at + steps[mid].units <= from) lo = mid + 1; else hi = mid; }
  let pen = null;
  for (let i = lo; i < steps.length && steps[i].at < to; i++) {
    const s = steps[i], a = Math.max(0, (from - s.at) / (s.units || 1)), b = Math.min(1, (to - s.at) / (s.units || 1));
    if (s.draw) segments.push([s.x0 + (s.x1 - s.x0) * a, s.y0 + (s.y1 - s.y0) * a, s.x0 + (s.x1 - s.x0) * b, s.y0 + (s.y1 - s.y0) * b]);
    pen = [s.x0 + (s.x1 - s.x0) * b, s.y0 + (s.y1 - s.y0) * b];
  }
  return {segments, pen};
}

// How thick the pen has to be to cover a stroke of this ink: the ink's area over the skeleton's length, a little more.
export const penWidth = (inkPixels, skeletonPixels) => Math.max(4, (inkPixels / Math.max(1, skeletonPixels)) * 1.9 + 2);
