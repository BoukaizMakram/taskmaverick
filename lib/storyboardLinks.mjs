// Duplicates in the storyboard are linked: the same asset shown several times in
// one line of the board (the frames of a chapter) is one thing, so retyping its
// words in one frame changes them in the others. An asset is "the same" as
// another when both are the captured asset with the same key, or copies of it
// (pasted, Alt+dragged, in a duplicated frame). Right-click > Make unique takes
// one out (`unique` in its frame's record). A chat bubble is always unique: its
// words are its own in every frame. Pure.
import {layersOf} from './storyboardEdits.mjs';

const INNER = '/0.0'; // where a pasted captured asset's own HTML sits inside its wrapper

// `key` -> {layer, rest}: the asset's key and what comes after it ('' for the asset
// itself, '/1.2' a part of it, '#0' or '/1.2#0' a piece of text).
export function splitKey(key) {
  const m = /^([^/#]+)(.*)$/.exec(String(key));
  return m ? {layer: m[1], rest: m[2]} : {layer: String(key), rest: ''};
}
// A part's place as every duplicate knows it (null: not a part of the shared HTML).
export const toShared = (rest, inner) => (!inner ? rest : rest === INNER ? '' : rest.startsWith(`${INNER}.`) ? `/${rest.slice(INNER.length + 1)}` : rest.startsWith(`${INNER}#`) ? rest.slice(INNER.length) : null);
// ... and back, in one duplicate.
export const fromShared = (rest, inner) => (!inner ? rest : rest === '' ? INNER : rest[0] === '/' ? `${INNER}.${rest.slice(1)}` : INNER + rest);

// What an asset of a frame is linked by: {id, inner}, or null (brought in and never
// duplicated, or a chat bubble: always unique).
export function linkOf(frame, edit, layerKey) {
  const brought = edit?.inserts?.find(l => l.key === layerKey);
  if (brought) return brought.link && brought.kind !== 'bubble' ? {id: brought.link, inner: !!brought.inner} : null;
  const own = frame.layers.find(l => l.key === layerKey);
  return own && own.kind !== 'bubble' ? {id: layerKey, inner: false} : null;
}
export const isUnique = (edit, layerKey) => !!edit?.unique?.includes(layerKey);

// Every asset linked by `id` in `frames` (one line of the board), the unique ones left out:
// [{frame, key, inner, asset}].
export function linkedLayers(frames, edits, id) {
  const out = [];
  for (const frame of frames) {
    const edit = edits.frames[frame.id];
    for (const layer of layersOf(frame, edit)) {
      const link = linkOf(frame, edit, layer.key);
      if (link?.id === id && !isUnique(edit, layer.key)) out.push({frame: frame.id, key: layer.key, inner: link.inner, asset: layer.asset});
    }
  }
  return out;
}

// The same part in every other duplicate of the asset `key` belongs to, in the frames of
// its line: [{frame, key, layer, asset, rest}] (rest: the part's place in that duplicate's own HTML).
export function linkedParts({frames, edits, frame, key}) {
  const {layer, rest} = splitKey(key), edit = edits.frames[frame.id];
  if (isUnique(edit, layer)) return [];
  const link = linkOf(frame, edit, layer), shared = link && toShared(rest, link.inner);
  if (shared == null) return [];
  return linkedLayers(frames.filter(f => f.chapter === frame.chapter), edits, link.id)
    .filter(m => !(m.frame === frame.id && m.key === layer))
    .map(m => { const own = fromShared(shared, m.inner); return {frame: m.frame, layer: m.key, key: m.key + own, rest: own, asset: m.asset}; });
}
