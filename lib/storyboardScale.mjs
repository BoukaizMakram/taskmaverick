// The Scale tool of the storyboard (K, like Figma's): a handle dragged scales an asset WITH what is in
// it, not just its boundaries (the user, 2026-10-07: "if I press K I should be able to scale it up with
// font not just boundaries"). A chat box grows with its words: the area of its words (its box without its
// padding) is scaled by one factor, so the words wrap exactly as they did and the corner dragged stays under
// the pointer; the padding, corners and outline a chat box's style gives it stay as they are.

// The factor a handle dragged to the pointer `p` scales the box `r` by (screen px: left, top, right,
// bottom). `pad` is [x, y] of the box that does not scale (a chat box's padding, once on each side). A
// corner follows the larger of its two sides; the middle of a side, its own; the opposite side stays put.
export function contentFactor(handle, r, p, {pad = [0, 0], min = 0.05} = {}) {
  const w = r.right - r.left, h = r.bottom - r.top;
  const along = (extent, size, edge) => (size - 2 * edge > 1e-6 ? (extent - 2 * edge) / (size - 2 * edge) : extent / size);
  const gx = handle.includes('e') ? along(p.x - r.left, w, pad[0]) : handle.includes('w') ? along(r.right - p.x, w, pad[0]) : null;
  const gy = handle.includes('s') ? along(p.y - r.top, h, pad[1]) : handle.includes('n') ? along(r.bottom - p.y, h, pad[1]) : null;
  const f = gx == null ? gy : gy == null ? gx : Math.max(gx, gy);
  return Math.max(min, Number.isFinite(f) ? f : 1);
}

// The size of a box scaled by `f` around its padding: the area inside the padding scales, the padding does not.
export const scaledBox = (box, pad, f) => [f * (box[0] - 2 * pad[0]) + 2 * pad[0], f * (box[1] - 2 * pad[1]) + 2 * pad[1]];

// What scaling by `f` does to the numbers an asset's text and outline carry: `size` is the font size its
// text shows now (null: no text), `own` what the sidebar set on it (a line height, letter spacing, outline
// width or corner radius it was given scales with it; what it was not given follows its text on its own).
// -> the style patch (setStyle).
export function scaledStyles(own, size, f) {
  const patch = {};
  if (size) patch.size = size * f;
  for (const key of ['lineHeight', 'letterSpacing', 'strokeWidth', 'radius']) if (own?.[key] != null) patch[key] = own[key] * f;
  return patch;
}
