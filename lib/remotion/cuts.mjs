// The boards that have a Remotion cut (a look with `cut` in lib/storyboardVariations.mjs: `remotion`, `remotion-under`, `remotion-like-ie`, `remotion-storyboard`, `remotion-straight`): on the All videos page such a board, when that variation
// plays, is played by Remotion's Player (components/StoryboardRemotionCut.jsx) instead of its slides; the composition itself is in components/remotion/ (components/remotion/index.js maps a board to
// it, with the variation's layout) and the Remotion project D:\Documents\Saas\videos renders it to an MP4 (`render`: run there; `renders[<layout>]` for a variation laid out another way). Its comments
// are kept as a part of their own, `title`, under the variation that plays (lib/storyboardComments.mjs).
// A layout can also be a cut of its own (`layouts[<layout>]`: its own `id` (where its retyped words are kept), `make`, `render`): Increased Efficiency's 'storyboard', the cut redone from the board
// All storyboards (the user, 2026-11-09; lib/remotion/efficiencyRedo.mjs). `cutFor(board, layout)` is the cut a board plays laid out that way.
// Its words can be retyped (a double-click on them, the user, 2026-11-05): they are the board's `edits.cuts[<id>]` (lib/remotion/cutWords.mjs), and `make(words, {layout})` is the cut made from them
// (its length, its sentences and their scenes, what follows the time), laid out as its variation says (`cutLayoutOf`).
import {CUT_FPS, CUT_H, CUT_ID, CUT_W, makeCut} from './efficiencyCut.mjs';
import {REDO_CUT_ID, STRAIGHT_CUT_ID, STRAIGHT_LAYOUT, makeRedoCut} from './efficiencyRedo.mjs';
import {IE_LAYOUT, QUALITY_CUT_ID, QUALITY_IE_CUT_ID, makeQualityCut} from './qualityCut.mjs';
import {OVERSIGHT_CUT_ID, makeOversightCut} from './oversightCut.mjs';
import {cutWordsOf} from './cutWords.mjs';
import {cutLookOf} from '../storyboardVariations.mjs';

export const CUT_PART = 'remotion'; // the id of the one part a cut is, on the All videos page (its comments, the place a reload keeps)
export const CUTS = {
  'increased-efficiency-v3': {id: CUT_ID, title: 'Increased Efficiency · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Cut out/increased-efficiency-cut.mp4',
    // (the user, 2026-11-09: "redo the increased effeciency video based on .../storyboard?video=all-storyboards ... use remotion to redo the video": the look `remotion-storyboard`)
    layouts: {storyboard: {id: REDO_CUT_ID, make: makeRedoCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Redo out/increased-efficiency-redo.mp4'},
      // (the user, 2026-11-11: "read comments in increased effeciency and fix it in a new variation": that film with the comments in it, the look `remotion-straight`; its own words)
      [STRAIGHT_LAYOUT]: {id: STRAIGHT_CUT_ID, make: makeRedoCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Straight out/increased-efficiency-straight.mp4'}}},
  // (the user, 2026-11-05: "now work on a new variation improved quality same way we have increased efficiency with remotion": lib/remotion/qualityCut.mjs)
  'improved-quality-v2': {id: QUALITY_CUT_ID, title: 'Improved Quality · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeQualityCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IQ-Cut out/improved-quality-cut.mp4',
    // (its variation with the words under a smaller 9:16 phone: the look `remotion-under`)
    renders: {under: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IQ-Cut-Under out/improved-quality-cut-under.mp4'},
    // (its variation told as Increased Efficiency is, the look `remotion-like-ie`, the user, 2026-11-11: the same plan, but words of its own, rewritten short, so a cut of its own here:
    // its retyped words are kept apart from Variations 2 and 3's)
    layouts: {[IE_LAYOUT]: {id: QUALITY_IE_CUT_ID, make: makeQualityCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IQ-Cut-IE out/improved-quality-cut-ie.mp4'}}},
  // (the user, 2026-11-11: "now do a variation in live oversight using the same way we did both previous videos, make sure to use remotion": lib/remotion/oversightCut.mjs)
  'live-oversight-v2': {id: OVERSIGHT_CUT_ID, title: 'Live Oversight · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeOversightCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render LO-Cut out/live-oversight-cut.mp4'},
};
// How the board's cut is laid out, as the variation that plays has it (null: the cut's own way)
export const cutLayoutOf = edits => cutLookOf(edits)?.layout ?? null;
// The cut a board plays laid out `layout` (a layout that is a cut of its own: that one; the same object each time)
const laidOut = new Map();
export function cutFor(board, layout = null) {
  const c = CUTS[board], own = c && layout ? c.layouts?.[layout] : null;
  if (!own) return c ?? null;
  const key = `${board}|${layout}`;
  if (!laidOut.has(key)) laidOut.set(key, {...c, ...own, layouts: undefined, layout});
  return laidOut.get(key);
}
// The board's cut (as its edits lay it out, when they are given)
export const cutOf = (board, edits = null) => cutFor(board, edits ? cutLayoutOf(edits) : null);
export const cutPartOf = board => (CUTS[board] ? {id: CUT_PART, title: CUTS[board].title, frames: []} : null);
// The cut the board plays now: its playing variation's look is a Remotion cut and the board has one (else null: it plays its slides)
export const playingCutOf = (board, edits) => (edits && cutLookOf(edits) && CUTS[board] ? cutFor(board, cutLayoutOf(edits)) : null);
// The command that renders the board's cut as its variation lays it out
export const renderCommandOf = (board, edits) => { const layout = cutLayoutOf(edits), c = cutFor(board, layout); return c ? (layout && c.renders?.[layout]) || c.render : null; };
// The cut of a board as its edits have it (its retyped words, its variation's layout)
export const cutPlanOf = (board, edits) => { const layout = cutLayoutOf(edits), c = cutFor(board, layout); return c ? c.make(cutWordsOf(edits, c.id), {layout}) : null; };
