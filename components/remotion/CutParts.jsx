'use client';
// What every Remotion cut draws the same way (lib/remotion/cutCore.mjs; the user, 2026-11-05: Improved Quality's cut "same style as variation 4 increased efficiency"): the stage (1600 x 900, scaled to
// the video), its background, the title, the art as one layer (at a new scene it goes and comes as one, pulled down with the words: `artAt`), the yellow outlines (measured on the picture each frame,
// so they follow what moves), the band of words (the sentence centered and left-aligned, a thin line at its left and the chapter's label at the left of the line; a new scene's words first in the middle)
// and a video played by the cut's clock. Classes: .rc-* (components/remotion/CutParts.css). The texts that can be retyped say so: `data-rc-text` (a sentence's id, '<id>:kicker', 'title').
import {Fragment, useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {CURSOR, CUT_H, CUT_W, OUT, TITLE, WORDS, mix, prog, wordsOf} from '@/lib/remotion/cutCore.mjs';
import '../DemoHand.css'; // .iq2-mark
import './CutParts.css';

// The blue label on two lines like the white words (the user, 2026-11-06: "make the blue double decker too"): its words split where the two lines are nearest in length; one word stays one line
export function labelLines(label) {
  const w = String(label ?? '').split(' ').filter(Boolean);
  if (w.length < 2) return [w.join(' ')];
  let best = 1, gap = Infinity;
  for (let i = 1; i < w.length; i++) { const d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length); if (d < gap) { gap = d; best = i; } }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
}
// a sentence's label as it is drawn: the lines it was typed on when it was retyped with a new line (Shift+Enter in its text box; the user, 2026-11-10), else split in two by itself
const kickerLines = c => c.kickerLines ?? labelLines(c.kicker);
// a word of the band coming in moving to the right, `dist` em
const slideIn = (key, text, p, dist) => <span key={key} className="rc-word" style={{opacity: p, transform: `translateX(${(-(1 - p) * dist).toFixed(3)}em)`}}>{text}</span>;
export const word = (key, text, p, rise) => <span key={key} className="rc-word" style={{opacity: p, transform: `translateY(${((1 - p) * rise).toFixed(3)}em)`}}>{text}</span>;

// ---- the title: word by word, the picture pushing in, its marked words struck through or underlined in yellow, one after the other ----
export function Title({cut, t, hide}) {
  const a = cut.titleAt(t);
  if (a.op <= 0.001) return null;
  // a cut whose words slide (`story(..., {slide: true})`): written word by word where it stands, as the white words are, with no move (the user, 2026-11-09: "the first title should be typed the same
  // way without moving"), then it fades
  if (cut.slide) return <TypedTitle cut={cut} t={t} hide={hide} op={a.op}/>;
  const marked = cut.title.mark?.words ?? [], kind = cut.title.mark?.kind ?? 'strike';
  const all = cut.title.lines.join(' ').split(' ').filter(Boolean), hits = all.map(w => marked.includes(w)), count = hits.filter(Boolean).length;
  let n = 0, m = 0;
  return <div className="rc-title" data-rc-text="title" data-cut-part="Title" style={{opacity: a.op, transform: `translateY(-50%) scale(${a.scale})`, visibility: hide === 'title' ? 'hidden' : undefined}}>
    {cut.title.lines.map((line, i) => <div key={i} className="rc-title-line">{line.split(' ').filter(Boolean).map((w, j) => {
      const at = n++, p = prog(t, at * TITLE.each, TITLE.fade, OUT);
      if (!hits[at]) return <Fragment key={j}>{j ? ' ' : ''}{word('w', w, p, TITLE.rise)}</Fragment>;
      const k = m++, s = Math.min(1, Math.max(0, a.mark * count - k)), joined = k < count - 1 && hits[at + 1]; // (each marked word's line after the one before; it reaches over the space to the next marked word)
      return <Fragment key={j}>{j ? ' ' : ''}{word('w', <span className={`rc-mark-word is-${kind}${joined ? ' is-joined' : ''}`}>{w}<i style={{transform: `scaleX(${s.toFixed(3)})`}}/></span>, p, TITLE.rise)}</Fragment>;
    })}</div>)}
  </div>;
}

function TypedTitle({cut, t, hide, op}) {
  const lines = useMemo(() => wordsOf(cut.title.lines), [cut.title.lines]);
  return <div className="rc-title" data-rc-text="title" data-cut-part="Title" style={{opacity: op, transform: 'translateY(-50%)', visibility: hide === 'title' ? 'hidden' : undefined}}>
    {lines.map((line, i) => <div key={i} className="rc-title-line">{line.map(({w, s}, j) => <Fragment key={j}>{j ? ' ' : ''}{slideIn('w', w, prog(t, s, WORDS.fade, OUT), WORDS.slide)}</Fragment>)}</div>)}
  </div>;
}

// ---- the words: one band under the picture; the sentence left-aligned and centered on the picture, a thin vertical line at its left and the chapter's label at the left of that (the user, 2026-11-05:
// "basicly left aligned but center horizontally of the comp with a vertical thin line on left and then blue text on its left"); the line grows from its middle as the label comes in. A new scene's words
// are first in the middle of the picture, then pulled down to the band (`bandLift`). Beside tall art (`c.side`: the sentence's left edge at x, its middle at y; Improved Quality's 9:16 mission, the user,
// 2026-11-05) the words are not in the band: in the middle of the picture, they glide to the right to their place (`slideAt`: the group is centered, then moved by the way left to go, its own half
// width included, so nothing is measured). A cut whose words slide (`cut.slide`) has its own band: `SlidingBands` ----
export function Band(props) {
  return props.cut.slide ? <SlidingBands {...props}/> : <WrittenBand {...props}/>;
}
// The words that slide (the user, 2026-11-09: "move the title from left to center then to right"; then "it should move slowely more, and doesn't cross each other, and it should show only the blue
// title at first then the white comes it with the animation we had"): the label and its line come in alone from the left, slowly, the white words are then written word by word (as `WrittenBand`
// writes them), and once the scene is done the whole goes on to the right (`slideOf`); the cut chains two sentences so that the second comes in once the first has gone
function SlidingBands({cut, t, hide}) {
  return cut.captionsAt(t).map(c => (c.beside ? <BesideBand key={c.id} cut={cut} c={c} t={t} hide={hide}/> : <SlidingBand key={c.id} cut={cut} c={c} t={t} hide={hide}/>));
}
// Words beside the art (`c.beside` {x, y}; the user, 2026-11-11: "title starts on the middle, and then moves right in this scene where we have missions and then fade out to next title or move
// vertically"; written, NOT played): the blue label over the white words, left-aligned on the thin line, the sentence's left edge at x and the block's middle at y. The block is centered on the
// picture by the band's flex, then moved by the way left to go, its own half width included (`go`), so nothing is measured; it comes up into its place and goes up out of it (`besideOf`).
// A cut can have it FOLLOW what it is about (`cut.followOf(c, t)`: the CEO, 2026-11-09, "moving up and down with what they are about"): each frame the block's middle is put at the middle of
// that element as the picture shows it (the part of it seen in its window, when it is in one that scrolls), kept 24 px inside the picture; nothing is kept from one frame to the next
function BesideBand({cut, c, t, hide}) {
  const lines = useMemo(() => wordsOf(c.lines), [c]), band = useRef(null);
  const g = cut.besideOf(c, t), kKey = `${c.id}:kicker`, b = c.beside, follow = cut.followOf ? cut.followOf(c, t) : null;
  useLayoutEffect(() => {
    const el = band.current, root = el?.closest('.rc-stage');
    if (!el) return;
    let y = b.y;
    if (follow && root) {
      const S = root.getBoundingClientRect(), k = S.width / CUT_W || 1, win = follow.within ? root.querySelector(follow.within) : null, W = win ? boxOn(win, S, k) : null;
      const middle = sel => {
        const node = sel ? root.querySelector(sel) : null;
        if (!node) return null;
        const r = boxOn(node, S, k);
        if (!W) return r.y + r.h / 2;
        const top = Math.max(r.y, W.y), bottom = Math.min(r.y + r.h, W.y + W.h);
        return bottom > top ? (top + bottom) / 2 : Math.min(W.y + W.h, Math.max(W.y, r.y + r.h / 2)); // (out of its window: the window's nearest edge)
      };
      const ya = middle(follow.a), yb = follow.b ? middle(follow.b) : null, to = ya == null ? yb : yb == null ? ya : mix(ya, yb, follow.p ?? 1);
      if (to != null) { const half = el.offsetHeight / 2 + 24; y = mix(b.y, Math.min(CUT_H - half, Math.max(half, to)), g.go); } // (`go`: from the picture's middle, where it is written first, to its place)
    }
    el.style.top = `${y.toFixed(2)}px`;
  });
  return <div ref={band} className="rc-band is-beside" style={{top: b.y, opacity: g.op, transform: `translateY(calc(-50% + ${g.y.toFixed(2)}px))`}}>
    <div className="rc-group" style={{transform: `translateX(calc(${(g.go * (b.x - CUT_W / 2)).toFixed(2)}px + ${(g.go * 50).toFixed(3)}%))`}}>
      {c.kicker ? <>
        <span className="rc-kicker" data-rc-text={kKey} data-cut-part="Label" data-cut-pin="" style={{visibility: hide === kKey ? 'hidden' : undefined}}>{(c.kickerLines ?? [c.kicker]).map((l, i) => <span key={i} className="rc-kicker-line">{l}</span>)}</span>
        <i className="rc-rule" aria-hidden="true" data-cut-part="Line" data-cut-pin=""/>
      </> : null}
      <div className="rc-lines" data-rc-text={c.id} data-cut-part="Sentence" data-cut-pin="" style={{visibility: hide === c.id ? 'hidden' : undefined}}>
        {lines.map((line, i) => <span key={i} className="rc-line">{line.map(({w, s}, j) => <Fragment key={j}>{j ? ' ' : ''}{slideIn('w', w, prog(t, (c.white ?? c.at) + s, WORDS.fade, OUT), WORDS.slide)}</Fragment>)}</span>)}
      </div>
    </div>
  </div>;
}
function SlidingBand({cut, c, t, hide}) {
  const lines = useMemo(() => wordsOf(c.lines), [c]);
  const g = cut.slideOf(c, t), kKey = `${c.id}:kicker`;
  return <div className="rc-band" style={{opacity: g.op}}>
    <div className="rc-group" style={{transform: `translateX(${g.x.toFixed(2)}px)`}}>
      {c.kicker ? <>
        <span className="rc-kicker" data-rc-text={kKey} data-cut-part="Label" data-cut-pin="" style={{visibility: hide === kKey ? 'hidden' : undefined}}>{kickerLines(c).map((l, i) => <span key={i} className="rc-kicker-line">{l}</span>)}</span>
        <i className="rc-rule" aria-hidden="true" data-cut-part="Line" data-cut-pin=""/>
      </> : null}
      <div className="rc-lines" data-rc-text={c.id} data-cut-part="Sentence" data-cut-pin="" style={{visibility: hide === c.id ? 'hidden' : undefined}}>
        {lines.map((line, i) => <span key={i} className="rc-line">{line.map(({w, s}, j) => <Fragment key={j}>{j ? ' ' : ''}{slideIn('w', w, prog(t, (c.white ?? c.at) + s, WORDS.fade, OUT), WORDS.slide)}</Fragment>)}</span>)}
      </div>
    </div>
  </div>;
}
function WrittenBand({cut, t, hide}) {
  const c = cut.captionAt(t);
  const lines = useMemo(() => (c ? wordsOf(c.lines) : []), [c]);
  if (!c) return null;
  const gone = 1 - prog(t, c.until, WORDS.out, OUT), kKey = `${c.id}:kicker`, lift = cut.bandLift(c, t), kIn = prog(t, c.at, 0.4, OUT);
  const side = c.side, slide = side ? cut.slideAt(c, t) : 0;
  const bandStyle = side ? {top: side.y} : lift ? {transform: `translateY(${(-lift).toFixed(2)}px)`} : undefined;
  const groupStyle = side ? {transform: `translateX(calc(${(slide * (side.x - CUT_W / 2)).toFixed(2)}px + ${(slide * 50).toFixed(3)}%))`} : undefined;
  return <div className={`rc-band${side ? ' is-side' : ''}`} style={bandStyle}>
    <div className="rc-group" style={groupStyle}>
      {c.kicker ? <>
        <span className="rc-kicker" data-rc-text={kKey} data-cut-part="Label" data-cut-pin="" style={{opacity: kIn * gone, visibility: hide === kKey ? 'hidden' : undefined}}>{kickerLines(c).map((l, i) => <span key={i} className="rc-kicker-line">{l}</span>)}</span>
        <i className="rc-rule" aria-hidden="true" data-cut-part="Line" data-cut-pin="" style={{opacity: kIn * gone, transform: `scaleY(${kIn.toFixed(3)})`}}/>
      </> : null}
      <div className="rc-lines" data-rc-text={c.id} data-cut-part="Sentence" data-cut-pin="" style={{opacity: gone, visibility: hide === c.id ? 'hidden' : undefined}}>
        {lines.map((line, i) => <span key={i} className="rc-line">{line.map(({w, s}, j) => <Fragment key={j}>{j ? ' ' : ''}{slideIn('w', w, prog(t, (c.white ?? c.at) + s, WORDS.fade, OUT), WORDS.slide)}</Fragment>)}</span>)}
      </div>
    </div>
  </div>;
}

// ---- where things are on the picture (stage px): an element's box, and that box cut to a window's (minus `pad`, so an outline of it stays inside the window; null: nothing of it in the window) ----
export const boxOn = (el, S, k) => { const b = el.getBoundingClientRect(); return {x: (b.left - S.left) / k, y: (b.top - S.top) / k, w: b.width / k, h: b.height / k}; };
export function cutTo(r, win, pad, S, k) {
  if (!win) return r;
  const w = boxOn(win, S, k), x = Math.max(r.x, w.x + pad), y = Math.max(r.y, w.y + pad), right = Math.min(r.x + r.w, w.x + w.w - pad), bottom = Math.min(r.y + r.h, w.y + w.h - pad);
  return right - x < 1 || bottom - y < 1 ? null : {x, y, w: right - x, h: bottom - y};
}

// ---- the yellow outlines: round what the words are about, measured on the picture each frame (so they follow what moves); `within`: cut to that element's box (a window that scrolls) ----
export function Marks({cut, t, stage}) {
  const list = cut.marksAt(t), layer = useRef(null);
  useLayoutEffect(() => {
    const el = layer.current, root = stage.current;
    if (!el || !root) return;
    const S = root.getBoundingClientRect(), k = S.width / CUT_W || 1;
    el.querySelectorAll('[data-mark]').forEach(n => {
      const target = root.querySelector(n.dataset.mark), pad = Number(n.dataset.pad) || 9;
      const r = target && cutTo(boxOn(target, S, k), n.dataset.within ? root.querySelector(n.dataset.within) : null, pad, S, k);
      if (!r) { n.style.visibility = 'hidden'; return; }
      n.style.visibility = '';
      n.style.width = `${r.w + 2 * pad}px`; n.style.height = `${r.h + 2 * pad}px`;
      n.style.transform = `translate(${r.x - pad}px, ${r.y - pad}px) scale(${n.dataset.pop})`;
    });
  });
  return <div ref={layer} className="rc-marks">{list.flatMap((m, i) => m.targets.map(sel => <i key={`${i}:${sel}`} className="iq2-mark rc-mark" data-cut-part="Yellow outline" data-mark={sel} data-pad={m.pad} data-within={m.within ?? undefined} data-pop={m.pop} style={{opacity: m.op}}/>))}</div>;
}

// ---- the cursor (a cut whose plan has `cursorAt`; the user, 2026-11-05: "add a cursor to these animations"): the demos' yellow hand, as in the storyboard videos. Each frame it is placed between the
// spot it goes from and the one it goes to (measured on the picture: they follow what moves), on a slight arc; pressed, it shrinks a little about its fingertip; a click leaves a yellow ring. A spot:
// {entry} the left of the words (where it comes in from); a click: `anchor` in its target; a point: the outline's bottom right corner (its target's box cut to `within`, plus `pad`); a swipe: near the
// list's right edge, from low to high as it scrolls (`q`); a drag: the middle of what it carries ----
function spotAt(root, spot, S, k) {
  if (!spot) return null;
  if (spot.entry) {
    const el = root.querySelector('.rc-band .rc-kicker') ?? root.querySelector('.rc-band .rc-lines');
    if (!el) return {x: 560, y: 790};
    const r = boxOn(el, S, k);
    return {x: r.x - 40, y: r.y + r.h / 2 + 20};
  }
  const el = root.querySelector(spot.target);
  if (!el) return null;
  const r = boxOn(el, S, k);
  if (spot.kind === 'point') { const pad = spot.pad ?? 7, c = cutTo(r, spot.within ? root.querySelector(spot.within) : null, pad, S, k) ?? r; return {x: c.x + c.w + pad - 5, y: c.y + c.h + pad - 5}; }
  if (spot.kind === 'swipe') return {x: r.x + r.w - 46, y: r.y + r.h * mix(0.72, 0.3, spot.q ?? 0)};
  if (spot.kind === 'drag') return {x: r.x + r.w / 2, y: r.y + r.h / 2};
  return {x: r.x + r.w * (spot.anchor?.x ?? 0.5), y: r.y + r.h * (spot.anchor?.y ?? 0.55)};
}
export function Cursor({cut, t, stage}) {
  const c = cut.cursorAt ? cut.cursorAt(t) : null, hand = useRef(null), ring = useRef(null);
  useLayoutEffect(() => {
    const h = hand.current, rg = ring.current, root = stage.current;
    if (!h || !rg) return;
    const hide = el => { el.style.opacity = '0'; };
    if (!c || !root || c.op <= 0.001) { hide(h); hide(rg); return; }
    const S = root.getBoundingClientRect(), k = S.width / CUT_W || 1;
    const b = spotAt(root, c.to, S, k), a = spotAt(root, c.from, S, k) ?? b;
    if (!b) { hide(h); hide(rg); return; }
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), bow = d ? (Math.min(46, d * 0.14) * Math.sin(Math.PI * c.p)) / d : 0; // (a slight arc between two spots)
    const x = mix(a.x, b.x, c.p) - dy * bow, y = mix(a.y, b.y, c.p) + dx * bow;
    h.style.opacity = c.op.toFixed(3);
    h.style.transform = `translate(${(x - CURSOR.tip.x).toFixed(2)}px, ${(y - CURSOR.tip.y).toFixed(2)}px) scale(${(1 - 0.12 * c.press).toFixed(3)})`;
    const at = c.ripple && spotAt(root, c.ripple.spot, S, k);
    if (!at) { hide(rg); return; }
    const size = mix(16, 76, OUT(c.ripple.p));
    rg.style.opacity = ((1 - c.ripple.p) * c.op).toFixed(3);
    rg.style.width = rg.style.height = `${size.toFixed(2)}px`;
    rg.style.transform = `translate(${(at.x - size / 2).toFixed(2)}px, ${(at.y - size / 2).toFixed(2)}px)`;
  });
  if (!cut.cursorAt) return null;
  return <><span ref={ring} className="rc-ripple" aria-hidden="true" data-cut-part="Click ring"/><div ref={hand} className="rc-hand" aria-hidden="true" data-cut-part="Cursor" style={{width: CURSOR.w, height: CURSOR.h, transformOrigin: `${CURSOR.tip.x}px ${CURSOR.tip.y}px`}}><Img src="/demo-hand.png" alt=""/></div></>;
}

// ---- a video played by the cut's clock: `time` (seconds into the clip) goes on with the picture while it plays (a Sequence started that long ago), else it holds that frame (Freeze); the same props as the
// demos' DemoVideo (components/ImprovedQualityV2Panels.jsx), so their panels take it as their `Video` ----
const FILL = {position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', objectFit: 'cover'};
export function CutVideo({time = 0, src, playing = false}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), at = Math.max(0, Math.round(time * fps));
  const video = <OffthreadVideo src={src} muted style={FILL}/>;
  if (playing) return <Sequence from={frame - at} layout="none">{video}</Sequence>; // (while it plays, `frame - at` stays the same: the video runs on its own)
  return <Freeze frame={at}>{video}</Freeze>;
}

// ---- the frame of a cut: the stage, the title, the art (`children`, as one layer), the outlines, what the cut adds over them (`over`), the band ----
export function CutFrame({cut, t, hide, stage, over = null, children}) {
  const {width} = useVideoConfig(), art = cut.artAt(t), shade = cut.shadeAt ? cut.shadeAt(t) : 1;
  return <AbsoluteFill className="rc-root">
    <div ref={stage} className="rc-stage" style={{transform: `scale(${width / CUT_W})`}}>
      <div className="rc-bg" data-cut-part="Background" data-cut-fixed=""/>{/* (on All storyboards it is fixed in place: its color changes, not its place or size) */}
      <Title cut={cut} t={t} hide={hide}/>
      {/* the art: at a new scene it goes as one, then comes in as one, pulled down with the words (`artAt`) */}
      <div className="rc-art" style={{opacity: art.op, transform: art.x || art.y ? `translate(${(art.x ?? 0).toFixed(2)}px, ${(art.y ?? 0).toFixed(2)}px)` : undefined}}>{children}</div>
      <Marks cut={cut} t={t} stage={stage}/>
      {over}
      <Cursor cut={cut} t={t} stage={stage}/>
      <div className="rc-band-shade" data-cut-part="Band shade" style={shade < 1 ? {opacity: shade} : undefined}/>
      <Band cut={cut} t={t} hide={hide}/>
    </div>
  </AbsoluteFill>;
}
