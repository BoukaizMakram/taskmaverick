// Copy and paste in the storyboard (Ctrl/⌘ + C, X, V): the assets picked in a
// frame, or whole frames, carried to any frame of any board (the other video's
// board too: what is copied holds its own HTML). Pure: what is copied is plain
// data, and pasting gives new edits back.
//
// A copied asset keeps what was changed on it (moves, scale, retyped words, its
// tail's point). Pasted, it is an asset brought in (like Shift+A): a captured one
// is put back inside its own stage's classes, so it looks the same on any frame.
// On its own board a copy stays linked to what it was copied from (`link`, see
// lib/storyboardLinks.mjs): retyping one changes the others in the same line.
import {addBlank, addCopy, addInserts, layersOf, setAnim, setBubble, setLock, setMove, setNote, setScale, setSize, setStyle, setText, setTip} from './storyboardEdits.mjs';
import {hashString} from './storyboardParts.mjs';

export const CLIP_MARK = 'taskmaverick-storyboard';
const STAGE = {w: 1600, h: 900};
const OFFSET = 24; // pasted into the frame it came from, an asset lands a little down and right
const slug = name => String(name ?? 'asset').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'asset';
const attr = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// The asset (layer) an edit's key belongs to: `layer`, `layer/1.2` or `layer#0`
// (a piece of text right inside it) -> 'layer'.
export const layerKeyOf = key => String(key).split('/')[0].split('#')[0];
// What comes after the layer's key ('' for the layer itself), or null: another layer's.
const restOf = (key, layer) => (key === layer ? '' : key.startsWith(`${layer}/`) || key.startsWith(`${layer}#`) ? key.slice(layer.length) : null);
const pick = (record, layer) => Object.fromEntries(Object.entries(record ?? {}).map(([key, value]) => [restOf(key, layer), value]).filter(([rest]) => rest !== null));

// ---- Copy ----------------------------------------------------------------------
// The assets `keys` of a frame (in the frame's own order), with their changes.
// `htmlOf(hash)` gives an asset's HTML; `stage` is the video's stage ({className, style}).
export function copyLayers({frame, edit, keys, htmlOf, stage = {}, video = null}) {
  const wanted = new Set(keys.map(layerKeyOf)), brought = new Set((edit?.inserts ?? []).map(l => l.key));
  const items = layersOf(frame, edit).filter(l => wanted.has(l.key)).map(layer => {
    const {asset, ...rest} = layer;
    return {
      ...rest, html: htmlOf(asset) ?? '', insert: brought.has(layer.key),
      link: layer.kind === 'bubble' ? null : brought.has(layer.key) ? layer.link ?? null : layer.key, inner: brought.has(layer.key) && !!layer.inner, // (a chat bubble is always unique)
      ctx: {stageClass: frame.stageClass ?? stage.className ?? '', style: frame.stageStyle ?? stage.style ?? '', scene: frame.scene?.id ?? null, view: frame.scene?.view ?? null},
      moves: pick(edit?.moves, layer.key), texts: pick(edit?.texts, layer.key), scales: pick(edit?.scales, layer.key), sizes: pick(edit?.sizes, layer.key), styles: pick(edit?.styles, layer.key), locks: edit?.locks?.[layer.key] ?? null, bubble: edit?.bubbles?.[layer.key] ?? null, anim: edit?.anims?.[layer.key] ?? null, tipMove: edit?.tips?.[layer.key] ?? null,
    };
  }).filter(item => item.html);
  return {mark: CLIP_MARK, version: 1, kind: 'layers', video, from: frame.id, items};
}

// Assets picked in several frames (Shift+click across slides): `groups` is [{frame, edit, keys}].
// They are copied as one: pasted on a frame they land where they were. Only the first frame's keep
// their link to the original (a paste links to one frame's assets only); the others are plain copies.
export function copyPicks({groups, htmlOf, stage = {}, video = null}) {
  const copies = groups.map(({frame, edit, keys}) => copyLayers({frame, edit, keys, htmlOf, stage, video}));
  const items = copies.flatMap((copy, i) => (i === 0 ? copy.items : copy.items.map(item => ({...item, link: null}))));
  return {...copies[0], items};
}

// Whole frames (in board order), each with all its assets and its note.
export function copyFrames({frames, edits, htmlOf, stage = {}, video = null}) {
  const items = frames.map(frame => {
    const edit = edits.frames[frame.id];
    return {id: frame.id, label: frame.label, note: edit?.note ?? '', layers: copyLayers({frame, edit, keys: layersOf(frame, edit).map(l => l.key), htmlOf, stage, video}).items};
  });
  return {mark: CLIP_MARK, version: 1, kind: 'frames', video, items};
}

export const isClip = clip => !!clip && clip.mark === CLIP_MARK && ['layers', 'frames'].includes(clip.kind) && Array.isArray(clip.items) && clip.items.length > 0;

// ---- Paste ---------------------------------------------------------------------
// A captured asset inside its own stage's classes (so its CSS still applies on
// any frame), as a box of its own size at its own place.
function wrapped(item, key, z) {
  const b = item.box && item.box.w >= 1 && item.box.h >= 1 ? item.box : {x: 0, y: 0, ...STAGE}, c = item.ctx ?? {};
  const inner = item.html.replace(`data-sb-root="${item.key}"`, 'data-sb-was=""');
  const attrs = `${c.stageClass ? ` class="${attr(c.stageClass)}"` : ''}${c.scene ? ` data-scene="${attr(c.scene)}"` : ''}${c.view ? ` data-view="${attr(c.view)}"` : ''}`;
  const own = c.style ? `${attr(c.style).replace(/;?\s*$/, '')};` : '';
  return `<div data-sb-root="${key}" style="position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;z-index:${z}"><div${attrs} data-sb-wrap style="${own}position:absolute;left:${-b.x}px;top:${-b.y}px;width:${STAGE.w}px;height:${STAGE.h}px;transform:none;background:transparent;overflow:visible;cursor:default;pointer-events:none">${inner}</div></div>`;
}
// An asset that keeps its own root (a chat bubble, a piece brought in before): the
// root takes the new key and its new place in the stack (a bubble's words sit just
// above its shape, which is drawn at the layer's z).
function rekeyed(item, key, z) {
  const html = item.html.replace(`data-sb-root="${item.key}"`, `data-sb-root="${key}"`), at = html.indexOf(`data-sb-root="${key}"`);
  if (at < 0) return html;
  const open = html.lastIndexOf('<', at), close = html.indexOf('>', at), tag = html.slice(open, close);
  const raised = / style="/.test(tag) ? tag.replace(/ style="([^"]*)"/, (m, style) => ` style="${style.replace(/z-index:[^;"]*;?/g, '').replace(/;?\s*$/, '')};z-index:${z}"`) : `${tag} style="z-index:${z}"`;
  return html.slice(0, open) + raised + html.slice(close);
}
// A captured piece that is a box of its own (a yellow outline around what a chapter shows,
// a spotlight: its look does not depend on the demo's stage) is pasted as it is, not inside
// its stage, so the copy stays a box that stretches from its sides, like the original.
export const standsAlone = item => /^<[^>]*(\bclass="[^"]*\biq2-mark\b|\bdata-sb-box=)/.test(item.html ?? '');
// An edit's key on the pasted asset: the wrapped one's own HTML sits two levels in.
const keyFor = (key, rest, inside) => (!inside ? key + rest : rest === '' ? key : rest[0] === '/' ? `${key}/0.0.${rest.slice(1)}` : `${key}/0.0${rest}`);

// Give an asset brought into `frameId` its link (when it gets its first duplicate).
function linkSource(edits, frameId, key, link) {
  const record = edits.frames[frameId];
  if (!record?.inserts?.some(l => l.key === key && !l.link)) return edits;
  return {...edits, frames: {...edits.frames, [frameId]: {...record, inserts: record.inserts.map(l => (l.key === key ? {...l, link} : l))}}};
}

// Put copied assets into `frame` ({id, layers...} as on the board). -> {edits, keys}
//   nudge   they land a little off (pasting into the frame they came from)
//   shift   [dx, dy] stage px they land away from where they were (Alt+drag)
//   linked  they stay linked to what they were copied from (the same board only);
//           `source` is the frame they came from there
export function pasteLayers(edits, frame, items, {nudge = false, shift = null, linked = false, source = null} = {}) {
  const taken = new Set(layersOf(frame, edits.frames[frame.id]).map(l => l.key));
  let count = (edits.frames[frame.id]?.inserts ?? []).length, next = edits;
  const inserts = [], library = {}, keys = [], after = [];
  const off = [(shift?.[0] ?? 0) + (nudge ? OFFSET : 0), (shift?.[1] ?? 0) + (nudge ? OFFSET : 0)], moved = off[0] !== 0 || off[1] !== 0;
  for (const item of items) {
    let n = 1, key;
    do key = `c${n++}-${slug(item.name)}`; while (taken.has(key));
    taken.add(key);
    const z = 20 + 2 * count++, inside = item.kind !== 'bubble' && !item.insert && !standsAlone(item);
    const html = inside ? wrapped(item, key, z) : rekeyed(item, key, item.kind === 'bubble' ? z + 1 : z), asset = hashString(html);
    library[asset] = html;
    // on its own board a copy stays linked to its original (which gets a link too, if it had none)
    const link = !linked || item.kind === 'bubble' ? null : item.link ?? (source ? `dup:${source}:${item.key}` : null);
    if (link && !item.link && source) next = linkSource(next, source, item.key, link);
    inserts.push({key, name: item.name ?? 'Asset', kind: item.kind === 'bubble' ? 'bubble' : 'dom', asset, z, box: item.box, ...(link ? {link} : {}), ...(inside || item.inner ? {inner: true} : {}), ...(item.kind === 'bubble' ? {style: item.style ?? 'yellow', tip: item.tip ?? null, ...(item.mode ? {mode: item.mode} : {})} : {})});
    keys.push(key);
    const moves = {...item.moves};
    if (moved) moves[''] = [(moves['']?.[0] ?? 0) + off[0], (moves['']?.[1] ?? 0) + off[1]];
    // (a wrapped asset's own move is on its old root, inside: the shift and the move of the whole go on the new one)
    for (const [rest, delta] of Object.entries(moves)) after.push(e => setMove(e, frame.id, keyFor(key, rest, inside), delta));
    for (const [rest, text] of Object.entries(item.texts ?? {})) after.push(e => setText(e, frame.id, rest === '' && inside ? `${key}/0.0` : keyFor(key, rest, inside), text));
    for (const [rest, scale] of Object.entries(item.scales ?? {})) after.push(e => setScale(e, frame.id, keyFor(key, rest, inside), scale));
    for (const [rest, size] of Object.entries(item.sizes ?? {})) after.push(e => setSize(e, frame.id, keyFor(key, rest, inside), size));
    for (const [rest, style] of Object.entries(item.styles ?? {})) after.push(e => setStyle(e, frame.id, keyFor(key, rest, inside), style));
    if (item.locks) after.push(e => setLock(e, frame.id, key, item.locks));
    if (item.anim && item.kind === 'bubble') after.push(e => setAnim(e, frame.id, key, item.anim));
    if (item.bubble && item.kind === 'bubble') after.push(e => setBubble(e, frame.id, key, item.bubble));
    const tip = item.kind === 'bubble' && (item.tipMove || moved) ? [(item.tipMove?.[0] ?? 0) + off[0], (item.tipMove?.[1] ?? 0) + off[1]] : null; // the tail keeps pointing the same way
    if (tip) after.push(e => setTip(e, frame.id, key, tip));
  }
  if (!inserts.length) return {edits, keys: []};
  next = addInserts(next, frame.id, inserts, library);
  for (const change of after) next = change(next);
  return {edits: next, keys};
}

// Put copied frames right after `after`, in their order. A frame of this board
// (`known(id)`) becomes a duplicate of it; a frame of another board becomes a
// blank frame holding all its assets (and its note). -> {edits, ids}
export function pasteFrames(edits, items, {after, known = () => false} = {}) {
  let next = edits, last = after;
  const ids = [];
  for (const item of items) {
    if (known(item.id)) {
      const made = addCopy(next, {from: item.id, after: last, inherit: item.id});
      next = made.edits; last = made.id;
    } else {
      const made = addBlank(next, last);
      next = pasteLayers(made.edits, {id: made.id, layers: []}, item.layers ?? []).edits;
      if (item.note) next = setNote(next, made.id, item.note);
      last = made.id;
    }
    ids.push(last);
  }
  return {edits: next, ids};
}
