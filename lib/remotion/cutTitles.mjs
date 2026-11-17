// The titles of a Remotion cut that were ADDED on the All videos page (the user, 2026-11-14: "add a way to add titles to the video and the audio generates automatically, like in inspector if I double click the
// video I should be able to see all titles and their sequence vertically and I can add title (position always follow bottom) and generate voice automatically"; written, NOT tested).
// They are kept with the cut's retyped words (lib/remotion/cutWords.mjs, `edits.cuts[<cut id>].words`), so saving, merging, backups and the MP4 render (which reads the same file) need nothing of their own:
//   'add:order'      the added titles, in the order they play: their short ids, spaces between ('t1k2m9 t8x0aa')
//   'add:<k>'        the title's sentence (lines as typed)
//   'add:<k>:kicker' the label over it, if it has one
//   'add:<k>:after'  the id of the film's own sentence it was put AFTER (the user, 2026-11-16: "a new feature where we can put text in between texts and generate the voice over"; written, NOT
//                    played); none: after the last sentence of the film, as the titles of 2026-11-14 are
// An added title is a sentence of the cut like the others (its id is 'add:<k>'): it is said once the sentence it follows has gone, WHERE that sentence was (the band at the bottom, or beside the
// art when that sentence is: the position follows, the user does not place it), over the picture as that sentence left it, and stays until its voice has said it; what comes next waits for it.
// Several titles after the same sentence play in the order of 'add:order'. One with no sentence to follow (none said, or one the film no longer has) comes after the last sentence. Every plan
// puts them there by itself: `next` / `last` of `story`, lib/remotion/cutCore.mjs. Pure.
import {cutWordsOf, linesOfText, setCutText} from './cutWords.mjs';

export const ADD_ORDER = 'add:order';
const ID = /^[a-z][a-z0-9]{0,9}$/;

// A text as two lines of nearly the same length (a sentence of the cut is never more than two lines on top of each other)
export const halves = text => {
  const w = String(text ?? '').split(' ').filter(Boolean);
  if (w.length < 2) return [w.join(' ')];
  let best = 1, gap = Infinity;
  for (let i = 1; i < w.length; i++) { const d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length); if (d < gap) { gap = d; best = i; } }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
};
// What is typed, as it is kept: lines as typed, or, on one long line, two lines
export const brokenLines = text => {
  const typed = String(text ?? '').split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (typed.length !== 1) return typed.join('\n');
  return typed[0].length > 30 ? halves(typed[0]).join('\n') : typed[0];
};

export const addedIdsOf = words => String(words?.[ADD_ORDER] ?? '').split(/\s+/).filter(k => ID.test(k));
// The added titles of a cut's words: [{k, id ('add:<k>'), kicker, lines}]
export const addedOf = words => addedIdsOf(words).map(k => ({
  k, id: `add:${k}`,
  kicker: words[`add:${k}:kicker`] ? linesOfText(words[`add:${k}:kicker`]).join(' ') : '',
  lines: linesOfText(words[`add:${k}`] ?? ''),
  after: linesOfText(words[`add:${k}:after`] ?? '')[0] ?? null, // (the sentence it follows; null: the last one)
})).filter(a => a.lines.length);

// A new title: the edits, and its short id (`k`: given, so a change replayed on newer edits makes the same title). `after`: the id of the film's own sentence it follows (none: the last one);
// `order`: the short ids of all the added titles as the film will play them, the new one among them (none: it is the last of them)
export const newTitleId = () => `t${Date.now().toString(36).slice(-6)}`;
export function addTitle(edits, cutId, {label = '', text, after = null, order = null}, k = newTitleId()) {
  let e = setCutText(edits, cutId, `add:${k}`, brokenLines(text));
  if (String(label).trim()) e = setCutText(e, cutId, `add:${k}:kicker`, label);
  if (after) e = setCutText(e, cutId, `add:${k}:after`, String(after));
  const ids = addedIdsOf(cutWordsOf(edits, cutId)).filter(x => x !== k);
  const asked = Array.isArray(order) ? order.filter((x, i) => (x === k || ids.includes(x)) && order.indexOf(x) === i) : null; // (only titles there are, each once)
  const next = asked?.includes(k) ? [...asked, ...ids.filter(x => !asked.includes(x))] : [...ids, k];
  return setCutText(e, cutId, ADD_ORDER, next.join(' '));
}
// A title taken off
export function removeTitle(edits, cutId, k) {
  let e = setCutText(edits, cutId, `add:${k}`, '');
  e = setCutText(e, cutId, `add:${k}:kicker`, '');
  e = setCutText(e, cutId, `add:${k}:after`, '');
  return setCutText(e, cutId, ADD_ORDER, addedIdsOf(cutWordsOf(edits, cutId)).filter(x => x !== k).join(' '));
}
// Where a new title goes when it is put right after the row `index` of the film's titles as they play (`rows`: [{id, after}] in that order; `after`: what an ADDED row follows): the
// sentence of the film it follows (`after`: that row's own id; after an added title: what THAT title follows, so the two stay together, none when it follows none) and the order of all
// the added titles with it in (`order`)
export function placeAfter(rows, index, k) {
  const row = rows[index], added = String(row?.id ?? '').startsWith('add:');
  const after = !row || row.id === 'title' ? null : added ? row.after ?? null : row.id;
  const order = [];
  rows.forEach((r, i) => { if (String(r.id).startsWith('add:')) order.push(String(r.id).slice(4)); if (i === index) order.push(k); });
  if (!order.includes(k)) order.push(k);
  return {after, order};
}

// Which boards and layouts have titles that can be added and a voice that is made for them: Increased Efficiency's cuts drawn by components/remotion/EfficiencyRedo.jsx (since 2026-11-14),
// and, since 2026-11-16 ("add voice over to all videos"), the cut every other board plays (lib/remotion/cutVoice.mjs; Improved Quality: its variation told as Increased Efficiency is, the
// layout 'ie'; its older variations and Increased Efficiency's Variation 4 have neither)
export const VOICE_LAYOUTS = ['storyboard', 'straight', 'flow', 'soft', 'narrator', 'story'];
export const VOICED_BOARDS = {
  'improved-quality-v2': ['ie', 'narrator'], 'live-oversight-v2': [null, 'narrator'], 'precision-planning-v2': [null, 'narrator'], 'dynamic-auditing-v2': [null, 'narrator'],
  'requesting-maintenance-v2': [null, 'narrator'], 'requesting-support-v2': [null, 'narrator'], 'tracking-expirations-v2': [null, 'narrator'], 'replenishing-inventory-v2': [null, 'narrator'],
  'exception-management-v2': [null, 'narrator'], 'reporting-ai-v2': [null, 'narrator'], // ('narrator': the same film with a narrator's voice, the look `remotion-narrator`)
};
// every voiced layout of a board (the one a variation asks for is among them)
export const voicedLayouts = board => (board === 'increased-efficiency-v3' ? VOICE_LAYOUTS : VOICED_BOARDS[board] ?? []);
export const titlesCut = (board, layout = null) => (board === 'increased-efficiency-v3' ? VOICE_LAYOUTS.includes(layout) : !!VOICED_BOARDS[board]?.includes(layout ?? null));
// What the narrator says for a line, as it is kept ('<id>:voice'): one sentence on lines of at most 100 letters (a kept line is cut at 120, four lines at most: lib/remotion/cutWords.mjs)
export const wrapVoice = text => {
  const out = [''];
  for (const w of String(text ?? '').split(/\s+/).filter(Boolean)) { if (out.at(-1) && (out.at(-1) + ' ' + w).length > 100) out.push(w); else out[out.length - 1] = out.at(-1) ? `${out.at(-1)} ${w}` : w; }
  return out.filter(Boolean).join('\n');
};
