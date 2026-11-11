// Nothing in the storyboard is linked (the user, 2026-11-09: "remove the link between slides, each slide is its
// own slide, every text is not the same as others, I should be able to add text, copy from somewhere else with
// no issue, nothing is linked"): retyping a text, moving, sizing or styling an asset changes that frame's asset
// alone; a copy (pasted, Alt+dragged, in a duplicated frame) is a thing of its own from the moment it is made.
//
// What is left here is only for the EXPLICIT row actions (Apply to all in this row, Delete in the whole row,
// paste a position on picked frames): "the same piece" in the other frames of a row is the captured asset with
// the same key. A brought-in asset (pasted, Alt+dragged, Shift+A, a picture) and a chat bubble are always their
// frame's own (an old `link` on a pasted one is ignored). Pure.
import {layersOf} from './storyboardEdits.mjs';

// `key` -> {layer, rest}: the asset's key and what comes after it ('' for the asset
// itself, '/1.2' a part of it, '#0' or '/1.2#0' a piece of text).
export function splitKey(key) {
  const m = /^([^/#]+)(.*)$/.exec(String(key));
  return m ? {layer: m[1], rest: m[2]} : {layer: String(key), rest: ''};
}

// What an asset of a frame is the same piece as, along its row: {id} (its captured key), or null
// (brought in, or a chat bubble: always its frame's own).
export function linkOf(frame, edit, layerKey) {
  if (edit?.inserts?.some(l => l.key === layerKey)) return null;
  const own = frame.layers.find(l => l.key === layerKey);
  return own && own.kind !== 'bubble' ? {id: layerKey} : null;
}

// The same captured piece `id` in `frames` (one row of the board): [{frame, key, asset}].
export function linkedLayers(frames, edits, id) {
  const out = [];
  for (const frame of frames) {
    const edit = edits.frames[frame.id];
    for (const layer of layersOf(frame, edit)) if (linkOf(frame, edit, layer.key)?.id === id) out.push({frame: frame.id, key: layer.key, asset: layer.asset});
  }
  return out;
}
