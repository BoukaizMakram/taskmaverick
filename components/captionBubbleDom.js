import {bubbleFrame} from '@/lib/captionBubbles.mjs';

const clamp01 = v => Math.max(0, Math.min(1, v));

// Draws a caption's bubble (see lib/captionBubbles.mjs) into the stage's bubble
// layer and pops the words with it. Called by the demos each frame, after they
// have put the caption `cap` in place.
//   g        the layer's <g>            stage  the stage's client rect     unit  stage px per screen px
//   fit      how much the words are shrunk to fit the room, and originX (0-1) where from
//   layout   the caption's own left/top in stage px (before its centering shift)
//   tip      the point the tail reaches (null: the words are not beside anything)
//   t        seconds since the caption started      remaining  seconds until it leaves
//   middle   words first: it pops from its middle, the tail comes later (tailP); without it, it comes out of
//            `tip`, tail first. Either way the tail can fade alone (tailOpacity) while the bubble stays
export function drawBubble({g, cap, style, stage, unit, fit = 1, originX = 0, layout, tip, tailP, tailOpacity = 1, middle = false, t, remaining}) {
  cap.style.scale = '';
  cap.style.rotate = '';
  const r = cap.getBoundingClientRect();
  const box = {x: (r.left - stage.left) / unit, y: (r.top - stage.top) / unit, w: r.width / unit, h: r.height / unit};
  // the words are shrunk (around originX) inside their layout box
  const rect = {x: box.x + box.w * (1 - fit) * originX, y: box.y + box.h * (1 - fit) / 2, w: box.w * fit, h: box.h * fit};
  const f = bubbleFrame(style, {rect, tip, tailP, tailOpacity, middle, t, remaining});
  const {x, y} = f.origin;
  g.innerHTML = f.svg;
  // where the tail points and which look this is: the storyboard (/storyboard) redraws the bubble from them
  // (a style without a tail points at nothing; the tail is there only while it is out, and how far
  // it reaches and how much it shows are kept too, for the storyboard)
  const pointing = tip && style.tail && f.tail && tailOpacity > 0.005;
  if (pointing) g.dataset.tip = `${tip.x},${tip.y}`; else delete g.dataset.tip;
  const part = (key, v) => { if (pointing && v < 0.995) g.dataset[key] = String(Math.round(v * 100) / 100); else delete g.dataset[key]; };
  part('reach', middle ? clamp01(tailP ?? 1) : 1);
  part('tailOpacity', clamp01(tailOpacity));
  g.dataset.style = style.id;
  g.setAttribute('transform', `translate(${x} ${y}) rotate(${f.rotate}) scale(${f.scale}) translate(${-x} ${-y})`);
  g.style.opacity = f.opacity;
  g.style.filter = f.filter;
  // the words pop with their bubble, from the same point
  cap.style.transformOrigin = `${x - layout.left}px ${y - layout.top}px`;
  cap.style.scale = f.scale;
  cap.style.rotate = `${f.rotate}deg`;
  return f;
}

export function clearBubble(g, cap) {
  if (g) { g.innerHTML = ''; delete g.dataset.tip; }
  if (cap) { cap.style.scale = ''; cap.style.rotate = ''; cap.style.transformOrigin = ''; }
}
