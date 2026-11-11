// What every Remotion cut shares (the user, 2026-11-05: Improved Quality's cut "same style as variation 4 increased efficiency"): the stage, the one speed, the words (ONE band under the art, the
// chapter's label at the left of the sentence with a thin line between them, the sentence centered on the picture: `.rc-group`), a new scene opening on its words (written alone in the middle of the
// picture, then pulled down to the band as its art comes in, pulled down with them), the title (word by word, pushing in, a few words struck or underlined in yellow) and the yellow outlines.
// A cut (lib/remotion/efficiencyCut.mjs, lib/remotion/qualityCut.mjs) chains its beats from its words with `story(words, ...)`: what it says, when, and what follows the time for these parts; the art is its own.
// Its words can be retyped (lib/remotion/cutWords.mjs): a longer sentence takes longer to write and everything after it comes later. Pure: no React, no Remotion.
import {linesOfText} from './cutWords.mjs';

export const CUT_FPS = 30, CUT_W = 1600, CUT_H = 900;
export const ANCHOR = {x: 800, y: 367}; // the middle of the room over the words: what is shown is centered here

// ---- motion ----
// A CSS-like cubic-bezier (x1, y1, x2, y2) -> ease(p)
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let s = p;
    for (let i = 0; i < 8; i++) { const e = X(s) - p, d = dX(s); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; }
    if (!(s >= 0 && s <= 1) || Math.abs(X(s) - p) > 1e-4) { let lo = 0, hi = 1; s = p; for (let i = 0; i < 40; i++) { if (X(s) < p) lo = s; else hi = s; s = (lo + hi) / 2; } }
    return Y(s);
  };
}
export const EASE = bezier(0.7, 0, 0.3, 1);    // After Effects' Easy Ease, 70% influence on both sides
export const POP = bezier(0.3, 1.45, 0.55, 1); // a pop: one small overshoot, then still
export const OUT = bezier(0.2, 0.8, 0.3, 1);   // words and fades that only arrive
export const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const mix = (a, b, p) => a + (b - a) * p;
export const prog = (t, at, dur, ease = EASE) => ease(clamp(dur > 0 ? (t - at) / dur : t >= at ? 1 : 0));
export const clock = s => { s = Math.max(0, Math.floor(s)); return [s / 3600, (s / 60) % 60, s % 60].map(n => String(Math.floor(n)).padStart(2, '0')).join(':'); };
// value at `t` of keys [{t, v, dur = M, ease}]: from the key before to this one (dur 0: at once)
export function keyed(keys, t) {
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
  const k = keys[i];
  if (i === 0 || t < k.t) return {...keys[0].v};
  const dur = k.dur ?? M, p = (k.ease ?? EASE)(clamp(dur > 0 ? (t - k.t) / dur : 1)), a = keys[i - 1].v, out = {};
  for (const [key, b] of Object.entries(k.v)) out[key] = typeof b === 'number' ? mix(a[key] ?? b, b, p) : b;
  return out;
}

export const M = 0.76;                       // every move, scale and fade
export const POST = {each: 0.15, fade: 0.34}; // something posted (a mission, a card): one after the other
export const FACES = 0.09;                   // faces, one after the other
export const WORDS = {lps: 45, fade: 0.3, rise: 0.35, out: 0.38, size: 34, lead: 0.5, slide: 0.6}; // (45 letters a second, each word in 0.3 s: the user, 2026-11-06, "faster" ... "not cursor timing but the text"; were 30 and 0.42) // letters a second; a word fades in and rises `rise` em in `fade` s; the words go in `out` s
// (the band: the blue label comes in first, alone, and the white words `lead` s after it, each one moving `slide` em to the right into its place: the user, 2026-11-06)
// The band: the words' bottom `bottom` px over the picture's bottom edge, a line 1.3 em tall; a new scene's words are first centered on the picture's middle (`mid`)
export const BAND = {bottom: 34, line: WORDS.size * 1.3, mid: CUT_H / 2};
// A new scene: its words start `gap` x M after the art there is starts to go, are held `hold` s once written, then pulled down to the band in M as the new art comes in from `pull` px above its place
export const INTRO = {gap: 0.65, hold: 0.4, pull: 70};
// THE ART HAS THE SAME ROOM OVER IT AS UNDER IT (the user, 2026-11-10, Increased Efficiency's Variation 6: "the title should stay where it is, but the art needs to be fixed to have the same
// space between it and the title and it and the top"): art centered on ANCHOR.y is drawn `ART_DY` px lower, so its middle is the middle of the room from the picture's top to the top of the
// words' capital letters (`WORDS_TOP`: two lines of words; 10: from a line's box to the top of its capitals). The cuts told that way move their art by it (lib/remotion/efficiencyRedo.mjs,
// lib/remotion/qualityCut.mjs with the layout 'ie').
export const WORDS_TOP = CUT_H - BAND.bottom - 2 * BAND.line + 10;
export const ART_DY = Math.round(WORDS_TOP / 2 - ANCHOR.y);
// The cursor a cut can have (`cursorAt` in its plan; components/remotion/CutParts.jsx Cursor): the demos' yellow hand (public/demo-hand.png, `w` x `h`, its fingertip at `tip`). A click: it is there
// `lead` s before, the press and a yellow ring (`ripple` s); after the last thing of a run it stays `hold` s, then fades in `fade` s
export const CURSOR = {go: 0.76, lead: 0.12, ripple: 0.5, hold: 0.45, fade: 0.3, // (`go`: one move of the cursor, the one speed; the user's "faster" of 2026-11-06 was the words, not the cursor)
   w: 52, h: 64, tip: {x: 19.8, y: 1.2}};
// The title: its words one after the other (`each` s apart, each fading in over `fade` s and rising `rise` em), the picture pushing in by `push` while it holds
export const TITLE = {each: 0.11, fade: 0.6, rise: 0.45, push: 0.025};
// Words that SLIDE (a cut made with `story(words, {slide: true})`; the user, 2026-11-09, on the board All storyboards: "move the title from left to center then to right, for all slides, .3s to show
// then after scen is done .3 seconds to go right"; then, having watched it: "the titles shouldn't move the way it moves right now, it should move slowely more, and doesn't cross each other, and it
// should show only the blue title at first then the white comes it with the animation we had. also the first title should be typed the same way without moving"): the blue label and its line come in
// ALONE from the left, slowly (`in` s, `dist` px); `lead` s after they have arrived the white words are written word by word as every cut's are (WORDS); once the scene is done the whole goes on to
// the right, slowly (`out` s), fading at the far end. A second sentence on the same picture comes in only once the first has gone: they never cross (the cut chains them so). The title is written word
// by word where it stands, with no move, and fades.
// 30% FASTER (the user, 2026-11-10, of the film that has them, lib/remotion/efficiencyRedo.mjs: "make all the transtions after the title finishes faster by 30%"; written, NOT played): in 0.65 s,
// out 0.58 s, the white words 0.09 s after the label (they were 0.85, 0.75 and 0.12); the film's other transitions are its own `QUICK`
export const SLIDE = {in: 0.65, out: 0.58, dist: 170, lead: 0.09};
// Words BESIDE the art (a sentence said with `{beside: {x, y, moveAt}}` in a cut whose words slide; the user, 2026-11-11, a comment on Increased Efficiency's Variation 6, pinned at the right of the
// missions alone: "another variation where title starts on the middle, and then moves right in this scene where we have missions and then fade out to next title or move vertically"; written, NOT
// played): the words are not in the band but at the right of what they are about, the blue label OVER the white words, both left-aligned on the thin line (the sentence's left edge at `x`, the
// block's middle at `y`). They come in from `rise` px lower, fading in (`in` s: the label alone, the white words written `lead` s after), and go the same way, up and fading (`out` s), so the
// next ones come up into their place: a vertical move, never crossing. With `moveAt` the block is first centered on the picture (nothing is there yet) and glides to its place from then, in M
// (`besideOf`; components/remotion/CutParts.jsx BesideBand).
// THEY MOVE UP AND DOWN WITH WHAT THEY ARE ABOUT (the CEO, 2026-11-09, his rule for the videos with no tablet: "the words NEXT TO it, moving up and down with what they are about"): a cut can
// say what a sentence follows, `followOf(c, t)` -> {a, b, p, within} (the element `a`, or the way `p` from `a` to `b`; `within`: a window that scrolls, the part of the element seen in it),
// and the block's middle is put at that element's middle each frame, kept inside the picture (BesideBand measures it on the picture, as the outlines are)
export const BESIDE = {in: 0.45, out: 0.45, rise: 34, lead: 0.09};
export const SLIDE_IN = bezier(0.2, 0.6, 0.3, 1);    // arrives, slowing down gently to its place
export const SLIDE_OUT = bezier(0.5, 0, 0.75, 0.6);  // leaves, gently speeding up

// ---- the words ----
const lettersOf = s => s.replace(/\s+/g, '').length;
export const writeTime = lines => lettersOf(lines.join(' ')) / WORDS.lps + WORDS.fade;
// [[{w, s}]]: each word of each line and when it starts, in seconds from the caption's start (at the pen's pace)
export function wordsOf(lines) {
  let n = 0;
  return lines.map(line => line.split(' ').filter(Boolean).map(w => { const s = n / WORDS.lps; n += lettersOf(w); return {w, s}; }));
}

// ---- a cut's story: its words, its new scenes, its outlines, as its beats are chained ----
// words: {key: text} (retyped: lib/remotion/cutWords.mjs). title: {lines, mark: {words: [...], kind: 'strike' | 'underline'}} (the narration's). -> {
//   say(id, kicker, lines, at, {side, beside}): a sentence in the band, written from `at` (its lines as retyped, else `lines`); -> the caption {id, kicker, lines, at, written, until (set by the cut), down, side,
//     original}. `side` {x, y}: the words are not in the band but BESIDE tall art (Improved Quality's 9:16 mission, the user, 2026-11-05: "should be a 9:16 ratio not as small as this"): the sentence's
//     left edge at x, its middle at y, the label and its line at its left as in the band. `beside` {x, y, moveAt}: sliding words that are beside the art instead (`BESIDE`), the label over them
//   sceneIn(id, kicker, lines, out, gap, {side}): a sentence that opens a new scene: at `out` (the words before gone) the art there is goes in M, the words are written in the middle from
//     `out + gap x M`, held, then pulled down (`down`) as the new art comes in (beside it, `side`: they glide to the right as the art comes in from the left, as Increased Efficiency's "words in
//     the middle" variation did); the new art is put in its place unseen at `dark` (c.dark): any change of a piece there is at once (dur 0)
//   after(c): when the action of a sentence starts (once its words are written; a new scene's: once they are down and its art is in)
//   mark(from, to, targets, pad, within): yellow outlines round the elements `targets` (selectors) from `from` to `to` (`within`: a selector the outline is cut to, a window that scrolls)
//   named(key, original): a text of the UI as retyped (one line)
//   title: {lines, original, mark}, B: the title's beats (`title`, `mark`: the yellow line drawn, `titleOut`)
//   finish(): what follows the time for these parts: {artAt, bandLift, slideAt, shadeAt, captionAt, marksAt, titleAt, sceneAt, textOf}
// }
// `slide`: the label slides in alone and the whole slides out (SLIDE); the white words are written as always. The title is written in place, with no move.
export function story(words = {}, {title: told, slide = false}) {
  const captions = [], scenes = [], marks = [], ui = {}, B = {};
  const say = (id, kicker, lines, at, {side = null, beside = null} = {}) => {
    // (the label retyped on several lines, Shift+Enter in its text box: the user, 2026-11-10, "add a way to add a new line using shift+enter to the title": its lines are kept as typed,
    // `kickerLines`; typed on one line, or not retyped, it is split in two by itself: components/remotion/CutParts.jsx `labelLines`)
    const own = words[id] ? linesOfText(words[id]) : lines, typed = words[`${id}:kicker`] ? linesOfText(words[`${id}:kicker`]) : null, label = typed ? typed.join(' ') : kicker;
    const c = {id, kicker: label, kickerLines: typed && typed.length > 1 ? typed : null, lines: own.length ? own : lines, at, written: 0, until: null, down: null, side, beside, original: {kicker, lines}};
    c.white = at + (!label ? 0 : beside ? BESIDE.in + BESIDE.lead : slide ? SLIDE.in + SLIDE.lead : WORDS.lead); // (the label alone first, then the white words)
    c.written = c.white + writeTime(c.lines);
    captions.push(c);
    return c;
  };
  const sceneIn = (id, kicker, lines, out, gap = INTRO.gap, opts = {}) => {
    const c = say(id, kicker, lines, out + M * gap, opts);
    c.dark = out + M; c.down = c.written + INTRO.hold;
    scenes.push({id, out, dark: c.dark, down: c.down, side: !!c.side});
    return c;
  };
  const after = c => (c.down != null ? c.down + M : c.written) + 0.12;
  const mark = (from, to, targets, pad = 9, within = null) => marks.push({from, to, targets, pad, within});
  const named = (key, original) => { const value = words[key] ? linesOfText(words[key]).join(' ') || original : original; ui[key] = {value, original}; return value; };

  // the title (retyped: as long as its words need)
  const lines = words.title ? linesOfText(words.title) : told.lines, count = lines.join(' ').split(' ').filter(Boolean).length;
  const title = {lines: lines.length ? lines : told.lines, original: told.lines, mark: told.mark ?? null};
  B.title = 0; B.mark = Math.max(1.5, (count - 1) * TITLE.each + TITLE.fade + 0.2); B.titleOut = Math.max(3.0, B.mark + 1.5);
  if (slide) { B.mark = writeTime(title.lines) + 0.3; B.titleOut = writeTime(title.lines) + Math.max(1.6, 0.25 * count); } // (written at the words' pace, read, then it fades)
  // A sentence or the title sliding at `t` ({x: px from its place, op}): in from the left from `at`, out to the right from `until`
  const slid = (t, at, until) => {
    const pin = clamp((t - at) / SLIDE.in), pout = until == null ? 0 : clamp((t - until) / SLIDE.out);
    return {x: -SLIDE.dist * (1 - SLIDE_IN(pin)) + SLIDE.dist * SLIDE_OUT(pout), op: clamp(pin / 0.6) * (1 - clamp((pout - 0.35) / 0.65))};
  };
  const tail = slide ? SLIDE.out : WORDS.out; // (how long words take to go)

  const finish = () => {
    // How much the art is seen and how far from its place it is, at `t` ({op, x, y}): at a new scene the art there is goes in M, then there is none (the words alone, in the middle), then the new art
    // comes in in M as the words are pulled down, from `INTRO.pull` px above its place (the same curve as the words); beside the words (`side`), from that far at its left as they glide to the right
    const artAt = t => {
      for (const s of scenes) {
        if (t < s.out) break;
        if (t < s.down) return {op: 1 - prog(t, s.out, M), x: 0, y: 0};
        if (t < s.down + M) { const p = prog(t, s.down, M), off = -INTRO.pull * (1 - p); return {op: p, x: s.side ? off : 0, y: s.side ? 0 : off}; }
      }
      return {op: 1, x: 0, y: 0};
    };
    // How far words beside the art are on their way from the middle of the picture to their place (0 to 1): a new scene's glide there from `down` in M; the others are there
    const slideAt = (c, t) => (!c?.side ? 0 : c.down == null ? 1 : prog(t, c.down, M));
    // How much the band's shade is seen: none while the words are beside tall art (it would darken its bottom); it goes and comes back while the art is gone, at a new scene
    // It has a straight edge since 2026-11-10 (the user: "the faded color behind title shouldn't be faded, should be a solid", "solid edges I mean"; the background's own dark blue, not a color
    // of its own: `.rc-band-shade`), so it would trim what a fade let through: none under the opening title
    // (`bar`: it comes in as the title goes), and at a new scene it goes and comes back with the art, the words being alone in the middle of the picture
    const shadeAt = t => {
      const first = scenes[0];
      if (first && first.out <= B.titleOut + M && t < first.down) return 0; // (a film that opens on a new scene's words: no bar until its art comes in)
      const bar = prog(t, B.titleOut, M);
      let i = -1;
      scenes.forEach((s, j) => { if (s.out <= t) i = j; });
      if (i < 0) return bar;
      const s = scenes[i], was = i > 0 && scenes[i - 1].side;
      if (s.side) return was ? 0 : bar * (1 - prog(t, s.out, M));
      return was && t < s.down ? 0 : bar * artAt(t).op;
    };
    // How far a sentence's words are over their place in the band, at `t`: a new scene's are centered on the picture's middle until `down`, then pulled down in M (words beside the art: none)
    const bandLift = (c, t) => {
      if (!c || c.down == null || c.side) return 0;
      const h = c.lines.length * BAND.line;
      return (CUT_H - BAND.bottom - h - (BAND.mid - h / 2)) * (1 - prog(t, c.down, M));
    };
    // the words on at `t` (one at a time: the next starts after the last has gone; each with its label at its left)
    const captionAt = t => captions.find(c => t >= c.at && t < c.until + tail) ?? null;
    // all the words on at `t` (sliding words: two while one goes to the right as the next comes in from the left)
    const captionsAt = t => captions.filter(c => t >= c.at && t < c.until + tail);
    // where sliding words are at `t` ({x, op})
    const slideOf = (c, t) => slid(t, c.at, c.until);
    // where words beside the art are at `t` ({op, y: px under their place, go: 0 to 1 from the middle of the picture to their place}): up into their place, then up out of it
    const besideOf = (c, t) => {
      const pin = prog(t, c.at, BESIDE.in, OUT), pout = c.until == null ? 0 : prog(t, c.until, BESIDE.out);
      return {op: pin * (1 - pout), y: BESIDE.rise * (1 - pin) - BESIDE.rise * pout, go: c.beside?.moveAt == null ? 1 : prog(t, c.beside.moveAt, M)};
    };
    // the outlines on at `t`
    const marksAt = t => marks.filter(m => t >= m.from && t < m.to + 0.3).map(m => ({...m, op: prog(t, m.from, 0.38, OUT) * (1 - prog(t, m.to, 0.3, OUT)), pop: mix(1.06, 1, prog(t, m.from, 0.38, OUT))}));
    // the title: in, pushing in, its yellow line drawn, then out (growing a little); sliding: in from the left, pushing in, out to the right (`x`)
    const titleAt = t => {
      if (slide) return {op: 1 - prog(t, B.titleOut, WORDS.out, OUT), x: 0, scale: 1, mark: prog(t, B.mark, 0.5)}; // (written where it stands, no move)
      return {op: 1 - prog(t, B.titleOut, M), x: 0, scale: 1 + TITLE.push * prog(t, 0, B.titleOut, x => x) + 0.04 * prog(t, B.titleOut, M), mark: prog(t, B.mark, 0.5)};
    };
    // the sentence a second is in (from a little before its words come; -1 before the first): a comment's pin shows only in its scene
    const sceneAt = t => { let at = -1; captions.forEach((c, i) => { if (c.at - 0.8 <= t) at = i; }); return at; };
    // the text a key is (the editor's first words): its lines and what the cut says without it
    const textOf = key => {
      if (key === 'title') return {lines: title.lines, original: title.original};
      if (ui[key]) return {lines: [ui[key].value], original: [ui[key].original], ui: true};
      const [id, part] = key.split(':'), c = captions.find(x => x.id === id);
      if (!c) return null;
      return part === 'kicker' ? {lines: c.kickerLines ?? [c.kicker], original: [c.original.kicker]} : {lines: c.lines, original: c.original.lines};
    };
    return {artAt, bandLift, slideAt, shadeAt, captionAt, captionsAt, slideOf, besideOf, marksAt, titleAt, sceneAt, textOf, slide};
  };
  return {B, captions, scenes, marks, ui, title, say, sceneIn, after, mark, named, finish};
}

// ---- the cursor of a cut that has one (Improved Quality's, lib/remotion/qualityCut.mjs, where this was written; Live Oversight's, lib/remotion/oversightCut.mjs) ----
// The demos' yellow hand by the storyboard videos' rules. It does what is done (a click, a drag, a swipe) and can point at what is outlined (its fingertip at the outline's bottom right corner).
// Words first: a cut sets it off once they are written; it glides at the one speed (CURSOR.go) and stays on a screen from one thing to the next; it comes in from the left of the words and fades
// out after the last thing of a run, before the screen changes or a clip plays (`leave`). What it does starts at its click.
// -> {hand: the stops [{kind, t (the click; the arrival of a point; the start of a swipe or a drag), until, target, anchor (where in the target a click lands), pad, within (an outline's), run}],
//   click(from, target, anchor) -> when it clicks (it sets off at `from`, is there CURSOR.go later, clicks CURSOR.lead after), point(from, target, pad, within) -> when it is there,
//   swipe(from, dur, target), drag(from, dur, target) -> when it starts, leave(): the run ends,
//   finish() -> cursorAt(t): {op, from, to (a stop's spot {kind, target, anchor, pad, within, q}, or {entry: true}: the left of the words), p (how far, Easy Ease), press (0 to 1),
//     ripple: {spot, p} (a click's yellow ring)} or null; the picture says where a spot is (components/remotion/CutParts.jsx Cursor measures it each frame)}
export function cursorPlan() {
  const hand = [];
  let run = 0;
  const stop = (kind, t, target, extra) => { hand.push({kind, t, target, run, ...extra}); return t; };
  const click = (from, target, anchor = null) => stop('click', from + CURSOR.go + CURSOR.lead, target, {anchor});
  const point = (from, target, pad = 7, within = null) => stop('point', from + CURSOR.go, target, {pad, within});
  const swipe = (from, dur, target) => { const at = from + CURSOR.go; stop('swipe', at, target, {until: at + dur}); return at; }; // up a list, near its right edge, as it scrolls
  const drag = (from, dur, target) => { const at = from + CURSOR.go; stop('drag', at, target, {until: at + dur}); return at; };  // holding what it carries
  const leave = () => { run++; };
  const finish = () => {
    const arriveOf = s => (s.kind === 'click' ? s.t - CURSOR.lead : s.t);
    const doneOf = s => s.until ?? s.t;
    const runs = [];
    for (const s of hand) (runs[s.run] ??= {stops: []}).stops.push(s);
    for (const r of runs) if (r) { r.from = arriveOf(r.stops[0]) - CURSOR.go; r.gone = doneOf(r.stops.at(-1)) + CURSOR.hold; r.to = r.gone + CURSOR.fade; }
    const spotOf = (s, q = 0) => ({kind: s.kind, target: s.target, anchor: s.anchor ?? null, pad: s.pad ?? null, within: s.within ?? null, q});
    return function cursorAt(t) {
      const r = runs.find(x => x && t >= x.from && t < x.to);
      if (!r) return null;
      let i = 0;
      while (i + 1 < r.stops.length && t >= arriveOf(r.stops[i + 1]) - CURSOR.go) i++;
      const s = r.stops[i], prev = r.stops[i - 1], holds = s.kind === 'swipe' || s.kind === 'drag';
      const press = holds ? prog(t, s.t - 0.08, 0.14, OUT) * (1 - prog(t, s.until, 0.14, OUT)) : s.kind === 'click' ? clamp(1 - Math.abs(t - s.t + 0.02) / 0.14) : 0;
      const clicked = r.stops.find(x => x.kind === 'click' && t >= x.t && t < x.t + CURSOR.ripple);
      return {
        op: prog(t, r.from, 0.3, OUT) * (1 - prog(t, r.gone, CURSOR.fade, OUT)),
        from: prev ? spotOf(prev, 1) : {entry: true}, to: spotOf(s, s.kind === 'swipe' ? prog(t, s.t, s.until - s.t) : 0), p: prog(t, arriveOf(s) - CURSOR.go, CURSOR.go), press,
        ripple: clicked ? {spot: spotOf(clicked), p: (t - clicked.t) / CURSOR.ripple} : null,
      };
    };
  };
  return {hand, click, point, swipe, drag, leave, finish};
}

// A cut made from its words and how it is laid out (`opts.layout`: a variation's, lib/remotion/cuts.mjs), the same object for the same ones (a few are kept): `build(words, opts)` -> the cut
export function cutMaker(build) {
  const made = new Map(), NONE = Object.freeze({});
  return (words = NONE, opts = {}) => {
    const layout = opts?.layout ?? null, key = JSON.stringify([layout, ...Object.keys(words ?? {}).sort().map(k => [k, words[k]])]);
    let cut = made.get(key);
    if (!cut) {
      cut = build(words ?? NONE, {layout});
      made.set(key, cut);
      if (made.size > 12) made.delete(made.keys().next().value);
    }
    return cut;
  };
}
