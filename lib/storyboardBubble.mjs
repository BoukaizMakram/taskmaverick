// The storyboard draws the chat bubble itself (the same shape the video draws,
// lib/captionBubbles.mjs) from where the words are and where the tail points, so
// retyped words get a bubble that fits them, and a moved bubble keeps its tail on
// the same spot. Three states, one per frame:
//   'tail'   just the tail (the teardrop at the fingertip), no bubble
//   'empty'  the bubble with no words yet
//   'words'  the bubble with its words
import * as bubbles from './captionBubbles.mjs';

export const bubbleStyle = id => ({yellow: bubbles.MESSAGE, box: bubbles.BOX, closed: bubbles.CLOSED}[id] ?? bubbles.MESSAGE);

// rect: the words' box (stage px); tip: the point the tail reaches (or null); reach: how
// far the tail has got toward it (0-1, a hand coming out of the bubble); tailOpacity: how
// much of the tail shows (0-1, fading out).
// Returns {svg, outer, hasTail}: the SVG's paths and the bubble's outer box.
export function bubbleShape({style = 'yellow', rect, tip = null, mode = 'words', reach = 1, tailOpacity = 1}) {
  const look = bubbleStyle(style);
  const f = bubbles.bubbleFrame(look, {rect, tip, tailP: reach, tailOpacity, t: 99, remaining: 99});
  const paths = f.svg.match(/<path[^>]*\/>/g) ?? [];
  const hasTail = !!f.tail;
  // with a tail the SVG holds [body outline, tail outline, body fill, tail fill]
  // (a fading one: the closed bubble, then those four in a fading group)
  const svg = mode === 'tail' ? (hasTail ? paths.at(-3) + paths.at(-1) : '') : f.svg;
  return {svg, outer: f.outer, hasTail};
}
