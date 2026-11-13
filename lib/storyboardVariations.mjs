// A video's variations (the user, 2026-11-03, on the All videos page: "make me an other variation of this video (variations should show up on the right side inspector with dropdown between
// comments/the variations)"; of the second one: "show text in middle then go to the right, so middle with gray background, then go to the right and show art to the left with fade in", for every
// new sentence). A board's videos can be played another way: Variation 1 is the video as it is made, the others are kept in the board's edits,
//   edits.variations = {list: [{id, name, look}], active, at}
// `look` names one of `LOOKS`: what the variation changes in how the video plays, put in the video's profile (`withVariation`; lib/storyboardVideos.mjs) and played by the director and the engine
// (components/storyboardPlayerDom.js). `active`: the variation all the board's videos play (none or 'v1': Variation 1), wherever they are played: the board, All videos, the video editor, an export.
// Each variation has comments of its own (the user, the same day: "Yes, separate them"): Variation 1's are kept by the video's title, as they always were, another's by the title and the variation (`commentKeyOf`:
// "<title> [v2]"), and lib/storyboardComments.mjs reads and changes the ones of the variation that plays. Deleting a variation keeps its comments in the file (its id is never given again). `at`: when it was changed
// (the newer copy wins, `mergeVariations`).

export const ORIGINAL = Object.freeze({id: 'v1', name: 'Variation 1', look: null});
const MAX = 20;
// What a variation can change. `middle`: every new sentence is written in the middle of the picture on the gray of the words' side, which covers all of it; then the gray goes back to its side with the
// words and the art fades in at the left. Seconds: `cover` (the gray comes over the picture as the words before go), `reveal` (it goes back, the words with it, the art fading in), on After Effects'
// Easy Ease at `influence`; `still`: how long the picture stays once it is all there, at least.
// `focus` (the user, 2026-11-04: "add another variation which make sense to you, keep same design overhaull, but better animations, better titles etc.. because it feels like I have to look left right center"): the
// design as it is, but the eye has ONE place for the words and is led from them to the software. The words never leave the gray side (no middle, no rectangle), left-aligned (`align`) so they start next to the
// software, and they sit at the height of what they are about: a scene's words are as high as the yellow outlines it draws (`focusWords`), so the eye goes straight across. They come in word by word, each fading in
// and rising `rise` em over `fade` seconds, at the pace the pen had (the scene's time does not change). A title's words rise one after the other (`title`: `each` seconds apart, `fade`, `rise`) and the title pushes in
// by `push` while it holds.
// `aside` (the user, 2026-11-04, Increased Efficiency's Variation 5: "the secondary text wouldn't replace the text to the right, rather show up in middle of art (or in a place where users might be watching) fades out and keep right
// side same"): the first words of a screen are written on the gray side as always; a second sentence on the same screen is written on a rectangle in the middle of the software's side, fades out with it, and the gray side keeps the
// first words (`aside` in directorOf, components/storyboardPlayerDom.js). Seconds as `middle`'s: `cover` (the rectangle comes in), `reveal` (it goes), `influence`, `still`.
export const LOOKS = {
  middle: {label: 'Words in the middle first', note: 'Each new sentence is written in the middle on the gray, then goes to the right as the picture fades in at the left.', profile: {cover: 0.76, reveal: 0.76, influence: 0.7, still: 0.26}},
  focus: {label: 'Focus: one place for the words', note: 'The words stay on the gray side, at the height of what they are about, and come in word by word; titles rise word by word. The eye goes straight across.', profile: {align: 'left', fade: 0.42, rise: 0.35, margin: 70, title: {each: 0.11, fade: 0.6, rise: 0.45, push: 0.025}}},
  aside: {label: 'Second words over the art', note: 'The first words of a screen stay on the gray side; a second sentence on the same screen is written over the art, in its middle, then fades out.', profile: {cover: 0.76, reveal: 0.76, influence: 0.7, still: 0.26}},
  // `remotion` (the user, 2026-11-04, Increased Efficiency's Variation 4: "use remotion for this variation, and just use our UI but everything should be changed to a way to convey message in a better way u think"): not a way
  // of playing the board's slides but a film of its own, made in Remotion with the product's pieces (lib/remotion/efficiencyCut.mjs, components/remotion/). On the All videos page a board that has one (`boards`;
  // lib/remotion/cuts.mjs) plays it in Remotion's Player (components/StoryboardRemotionCut.jsx); its board, the video editor and an export play the slides as Variation 1 (an empty profile).
  remotion: {label: 'Remotion cut', note: 'A film of its own, made in Remotion with our UI: the software full frame, the words in one band under it, a new scene opening on its words, the same mission or missions followed all the way.', profile: {}, boards: ['increased-efficiency-v3', 'improved-quality-v2', 'live-oversight-v2', 'dynamic-auditing-v2', 'precision-planning-v2', 'requesting-maintenance-v2'], cut: {}},// (Improved Quality's: the user, 2026-11-05, lib/remotion/qualityCut.mjs; Live Oversight's: 2026-11-11, lib/remotion/oversightCut.mjs; Dynamic Auditing's and Precision Planning's: 2026-11-12, lib/remotion/auditingCut.mjs, planningCut.mjs)
  // `remotion-under` (the user, 2026-11-05, Improved Quality: "add another variation with text under the 9:16 phone, but smaller phone to fit 9:16 ration"): the same Remotion cut, but its mission is a
  // smaller 9:16 phone that fits over the band, and its words are UNDER it in the band like every other scene's (the cut's `layout`: 'under'; `remotion` has them beside the big phone)
  'remotion-under': {label: 'Remotion cut · words under the phone', note: 'The Remotion cut with the mission a smaller 9:16 phone, its words in the band under it like every scene.', profile: {}, boards: ['improved-quality-v2'], cut: {layout: 'under'}},
  // `remotion-like-ie` (the user, 2026-11-11: "now work on improve quality to be like increased efficiency"; Improved Quality's Variation 4): the same Remotion cut told as Increased
  // Efficiency's is since its Variations 6 and 7 (the cut's `layout`: 'ie', lib/remotion/qualityCut.mjs): the words slide (the blue label alone, then the white words), the action starts as
  // the last word is written, the scene changes are quicker and never open on words in the middle, the mission's words are beside it and follow what they are about, the tablets' and the web
  // report's are in the band
  'remotion-like-ie': {label: "Remotion cut · told as Increased Efficiency is", note: "The Remotion cut with Increased Efficiency's titles and pace: the blue label slides in, the white words are written, the action starts at once; the mission's words are beside it and follow what they are about; tablets and the web report keep theirs at the bottom.", profile: {}, boards: ['improved-quality-v2'], cut: {layout: 'ie'}},
  // `remotion-storyboard` (the user, 2026-11-09: "redo the increased effeciency video based on .../storyboard?video=all-storyboards, read the notes and what's in the slide and use remotion to redo
  // the video"): Increased Efficiency's Remotion cut made again from the row the user reworked on the board All storyboards, its notes and its drawings (lib/remotion/efficiencyRedo.mjs): a cut of
  // its own (the layout 'storyboard' of the board's cut, lib/remotion/cuts.mjs: its own words, its own render), the words sliding in from the left and out to the right
  'remotion-storyboard': {label: 'Remotion cut · from the storyboard', note: 'Increased Efficiency redone from the board All storyboards: its slides, notes and drawings; the words slide in from the left and out to the right.', profile: {}, boards: ['increased-efficiency-v3'], cut: {layout: 'storyboard'}},
  // `remotion-straight` (the user, 2026-11-11: "read comments in increased effeciency and fix it in a new variation"; Increased Efficiency's Variation 7): the cut redone from the storyboard with
  // the four comments pinned on it that day (lib/remotion/efficiencyRedo.mjs, `V7`; the layout 'straight', a cut of its own: its own words, its own render): while the missions are alone
  // their title is beside them (written in the middle, it glides to the right; the next ones come up into its place), the team claims three missions in a row, each person the mission in
  // front of them, every claim and close a straight line to the right, and the execution timers' strip is orange
  'remotion-straight': {label: 'Remotion cut · titles beside the missions, straight lines', note: 'The cut redone from the storyboard with the comments of 2026-11-11: the titles beside the missions alone, three claims in a row in straight lines (each person the mission in front of them), closes straight too, an orange strip behind the execution timers.', profile: {}, boards: ['increased-efficiency-v3'], cut: {layout: 'straight'}},
};
// The looks a board can have (a look with `boards` only on those)
export const looksFor = board => Object.entries(LOOKS).filter(([, l]) => !l.boards || l.boards.includes(board));
const now = () => new Date().toISOString();
const text = (v, n) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');

export const variationsOf = edits => [ORIGINAL, ...(edits?.variations?.list ?? [])];
export const activeVariation = edits => { const id = edits?.variations?.active; return (id && edits.variations.list.find(v => v.id === id)) || ORIGINAL; };
export const activeLook = edits => activeVariation(edits).look ?? null;
// The Remotion cut the variation that plays asks for ({layout}: how the cut is laid out; null: the board plays its slides): a look with `cut` (lib/remotion/cuts.mjs)
export const cutLookOf = edits => LOOKS[activeLook(edits)]?.cut ?? null;
// Where the comments of a video are kept for a variation (`edits.comments[<this>]`)
export const commentKeyOf = (title, id) => (!title || !id || id === ORIGINAL.id ? title : `${title} [${id}]`);
// The video's profile with what its variation changes (null look: as it is)
export const withVariation = (profile, look) => (LOOKS[look] ? {...(profile ?? {}), [look]: LOOKS[look].profile} : profile);

const withList = (edits, list, active, at) => {
  const next = {...edits};
  if (list.length || (active && active !== ORIGINAL.id)) next.variations = {list, active: active && list.some(v => v.id === active) ? active : null, at: at ?? now()};
  else delete next.variations;
  return next;
};
// A new variation, played at once -> {edits, id}. `id`: the one it should have (`v<n>`, the user naming it: "I said fifth because there is another session working on a 4th variation"), when it is free; else the next free one.
export function addVariation(edits, {name, look, id: wanted = null}, at = null) {
  const list = edits?.variations?.list ?? [];
  if (!LOOKS[look] || list.length >= MAX) return {edits, id: null};
  let n = 2;
  const kept = Object.keys(edits?.comments ?? {}); // (the comments of a variation deleted: a new one does not take them over)
  const taken = k => list.some(v => v.id === k) || kept.some(c => c.endsWith(` [${k}]`));
  while (taken(`v${n}`)) n++;
  const id = typeof wanted === 'string' && /^v([2-9]|[1-9]\d)$/.test(wanted) && !taken(wanted) ? wanted : `v${n}`;
  const num = v => Number(v.id.slice(1)) || 0; // (in the order of their numbers: a Variation 4 added after a 5 comes before it)
  return {edits: withList(edits, [...list, {id, name: text(name, 60) || `Variation ${list.length + 2}`, look}].sort((p, q) => num(p) - num(q)), id, at), id};
}
// The variation the videos play (Variation 1: 'v1' or null)
export function setActiveVariation(edits, id, at = null) {
  const list = edits?.variations?.list ?? [], to = id && id !== ORIGINAL.id && list.some(v => v.id === id) ? id : null;
  return (edits?.variations?.active ?? null) === to ? edits : withList(edits, list, to, at);
}
export function renameVariation(edits, id, name, at = null) {
  const list = edits?.variations?.list ?? [], clean = text(name, 60);
  if (!clean || !list.some(v => v.id === id && v.name !== clean)) return edits;
  return withList(edits, list.map(v => (v.id === id ? {...v, name: clean} : v)), edits.variations.active, at);
}
export function removeVariation(edits, id, at = null) {
  const list = edits?.variations?.list ?? [];
  if (!list.some(v => v.id === id)) return edits;
  const active = edits.variations.active === id ? null : edits.variations.active;
  return withList(edits, list.filter(v => v.id !== id), active, at);
}

// As it is kept in the file (normalizeEdits in lib/storyboardEdits.mjs), or null
export function cleanVariations(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.list)) return null;
  const seen = new Set([ORIGINAL.id]), list = [];
  for (const v of raw.list) {
    const id = typeof v?.id === 'string' ? v.id.slice(0, 20).replace(/[^\w-]/g, '') : '';
    if (!id || seen.has(id) || !LOOKS[v.look] || list.length >= MAX) continue;
    seen.add(id);
    list.push({id, name: text(v.name, 60) || `Variation ${list.length + 2}`, look: v.look});
  }
  const active = typeof raw.active === 'string' && list.some(v => v.id === raw.active) ? raw.active : null;
  return list.length ? {list, active, at: typeof raw.at === 'string' ? raw.at : now()} : null;
}
// Two copies: the newer one wins
export function mergeVariations(base, other) {
  if (other && (!base || String(other.at ?? '') > String(base.at ?? ''))) return {variations: other, changed: true};
  return {variations: base ?? null, changed: false};
}
