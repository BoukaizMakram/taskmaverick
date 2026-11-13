// The words of a Remotion cut, retyped (the user, 2026-11-05: "is it possible to do it right now in the website double click" -> "Yes, build it"): a double-click on the words of a cut on the All videos
// page (components/StoryboardRemotionCut.jsx) retypes them in place, and they are kept in the board's edits,
//   edits.cuts = {<cut id>: {words: {<key>: text}, at}}
// `key`: a sentence's id (lib/remotion/efficiencyCut.mjs, its captions: 'individuals', 'teams', ...; lib/remotion/qualityCut.mjs: 'knowledge', 'instructions', ...), '<id>:kicker' (the label over it) or 'title'; or a text of the UI (the user, 2026-11-05: "what about UI
// text, like tablet missions" -> "Yes, build it"): 'mission:<id>' (a mission's name, on the tablet and on the phones), 'schedule:<id>:<n>', 'person:<who>' (the name on a closed mission), 'board:team' |
// 'board:personal' (the boards' titles); `text`: its lines, one per line ('\n'; a text of the UI is one line). A key that is not
// there plays the words as the cut has them (the narration's). The cut is made again from them (`makeCut(words)`): a longer sentence takes longer to write and what follows comes later. `at`: when they were
// changed (the newer copy wins, `mergeCuts`). The MP4 render reads the same file (D:\Documents\Saas\videos, src/ie/cutPlan.js). Pure data.
const MAX_KEYS = 120, MAX_LINES = 4, MAX_LINE = 120;
const now = () => new Date().toISOString();
const KEY = /^[a-z][\w-]{0,40}(:[\w-]{1,40}){0,2}$/i;
const ID = /^[\w-]{1,40}$/;

// a text as kept: its lines trimmed, the empty ones out, at most MAX_LINES of MAX_LINE letters ('' when nothing is left)
export const cleanCutText = v => (typeof v === 'string' ? v.split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim().slice(0, MAX_LINE)).filter(Boolean).slice(0, MAX_LINES).join('\n') : '');
export const linesOfText = text => cleanCutText(text).split('\n').filter(Boolean);

export function cleanCuts(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const [id, c] of Object.entries(raw)) {
    if (!ID.test(id) || !c || typeof c !== 'object') continue;
    const words = {};
    for (const [key, text] of Object.entries(c.words ?? {})) { const clean = cleanCutText(text); if (KEY.test(key) && clean && Object.keys(words).length < MAX_KEYS) words[key] = clean; }
    out[id] = {words, at: typeof c.at === 'string' ? c.at : now()}; // (an empty list is kept: it says the words were all put back)
  }
  return Object.keys(out).length ? out : null;
}
// Two copies: for each cut the newer one wins
export function mergeCuts(base, other) {
  let out = base ?? null, changed = false;
  for (const [id, theirs] of Object.entries(other ?? {})) {
    const mine = out?.[id];
    if (!mine || String(theirs.at ?? '') > String(mine.at ?? '')) { out = {...(out ?? {}), [id]: theirs}; changed = true; }
  }
  return {cuts: out, changed};
}
// The words retyped in a cut: {key: text} (raw files too: each text is cleaned)
export function cutWordsOf(edits, id) {
  const words = {};
  for (const [key, text] of Object.entries(edits?.cuts?.[id]?.words ?? {})) { const clean = cleanCutText(text); if (KEY.test(key) && clean) words[key] = clean; }
  return words;
}
// The first letter of every word a capital (the user, 2026-11-12: "when I edit the title it's always first letter in each word is capital by default"): the title, the labels and the sentences of a
// cut are Title Case as the narration's are; only the first letter of each word (and of a hyphenated part) is changed, so "AI", "&" and the rest of a word stay as typed. The texts of the UI
// (a mission's name, a person's, the boards' titles: `UI_TEXT`) are kept as typed.
const UI_TEXT = /^(mission|schedule|person|board):/;
export const titleCase = text => String(text ?? '').replace(/(^|[\s\-–—(“"/])(\p{Ll})/gu, (_, before, letter) => before + letter.toLocaleUpperCase());
// A text retyped: `original` is what the cut says without it (the same words, or none: the key goes and the cut's own words play again). The same edits back when nothing changes.
export function setCutText(edits, id, key, text, original = '', at = now()) {
  if (!ID.test(id) || !KEY.test(key)) return edits;
  const clean = cleanCutText(UI_TEXT.test(key) ? text : titleCase(text)), words = {...(edits?.cuts?.[id]?.words ?? {})};
  if (!clean || clean === cleanCutText(original)) { if (!(key in words)) return edits; delete words[key]; }
  else { if (words[key] === clean) return edits; words[key] = clean; }
  return {...edits, cuts: {...(edits?.cuts ?? {}), [id]: {words, at}}};
}
