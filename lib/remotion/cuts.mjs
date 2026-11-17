// The boards that have a Remotion cut (a look with `cut` in lib/storyboardVariations.mjs: `remotion`, `remotion-under`, `remotion-like-ie`, `remotion-storyboard`, `remotion-straight`): on the All videos page such a board, when that variation
// plays, is played by Remotion's Player (components/StoryboardRemotionCut.jsx) instead of its slides; the composition itself is in components/remotion/ (components/remotion/index.js maps a board to
// it, with the variation's layout) and the Remotion project D:\Documents\Saas\videos renders it to an MP4 (`render`: run there; `renders[<layout>]` for a variation laid out another way). Its comments
// are kept as a part of their own, `title`, under the variation that plays (lib/storyboardComments.mjs).
// A layout can also be a cut of its own (`layouts[<layout>]`: its own `id` (where its retyped words are kept), `make`, `render`): Increased Efficiency's 'storyboard', the cut redone from the board
// All storyboards (the user, 2026-11-09; lib/remotion/efficiencyRedo.mjs). `cutFor(board, layout)` is the cut a board plays laid out that way.
// Its words can be retyped (a double-click on them, the user, 2026-11-05): they are the board's `edits.cuts[<id>]` (lib/remotion/cutWords.mjs), and `make(words, {layout})` is the cut made from them
// (its length, its sentences and their scenes, what follows the time), laid out as its variation says (`cutLayoutOf`).
import {CUT_FPS, CUT_H, CUT_ID, CUT_W, makeCut} from './efficiencyCut.mjs';
import {FLOW_CUT_ID, FLOW_LAYOUT, NARRATOR_CUT_ID, NARRATOR_LAYOUT, REDO_CUT_ID, SOFT_CUT_ID, SOFT_LAYOUT, STORY_CUT_ID, STORY_LAYOUT, STRAIGHT_CUT_ID, STRAIGHT_LAYOUT, makeRedoCut} from './efficiencyRedo.mjs';
import {IE_LAYOUT, QUALITY_CUT_ID, QUALITY_IE_CUT_ID, makeQualityCut} from './qualityCut.mjs';
import {OVERSIGHT_CUT_ID, makeOversightCut} from './oversightCut.mjs';
import {AUDITING_CUT_ID, makeAuditingCut} from './auditingCut.mjs';
import {PLANNING_CUT_ID, makePlanningCut} from './planningCut.mjs';
import {MAINTENANCE_CUT_ID, makeMaintenanceCut} from './maintenanceCut.mjs';
import {EXPIRATIONS_CUT_ID, makeExpirationsCut} from './expirationsCut.mjs';
import {SUPPORT_CUT_ID, makeSupportCut} from './supportCut.mjs';
import {INVENTORY_CUT_ID, makeInventoryCut} from './inventoryCut.mjs';
import {EXCEPTIONS_CUT_ID, makeExceptionsCut} from './exceptionsCut.mjs';
import {REPORTING_CUT_ID, makeReportingCut} from './reportingCut.mjs';
import {cutWordsOf} from './cutWords.mjs';
import {NARRATOR} from './cutCore.mjs';
import {cutLookOf} from '../storyboardVariations.mjs';

// THE NARRATOR'S VARIATION (the user, 2026-11-16: "for all videos add a narrator style voice over variation ... the same video just with a narrator behind it"; the look `remotion-narrator`):
// every cut that plays has the layout `NARRATOR` too: the same film and the same words on the screen (the SAME `id`: its retyped words and added titles are the film's), the voice a narrator's
// (each plan's `NARRATION`; lib/remotion/cutCore.mjs `story`), its own render (<composition>-Narrator). Improved Quality's is its variation told as Increased Efficiency is ('ie') with the narrator.
export const CUT_PART = 'remotion'; // the id of the one part a cut is, on the All videos page (its comments, the place a reload keeps)
export const CUTS = {
  'increased-efficiency-v3': {id: CUT_ID, title: 'Increased Efficiency · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Cut out/increased-efficiency-cut.mp4',
    // (the user, 2026-11-09: "redo the increased effeciency video based on .../storyboard?video=all-storyboards ... use remotion to redo the video": the look `remotion-storyboard`)
    layouts: {storyboard: {id: REDO_CUT_ID, make: makeRedoCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Redo out/increased-efficiency-redo.mp4'},
      // (the user, 2026-11-11: "read comments in increased effeciency and fix it in a new variation": that film with the comments in it, the look `remotion-straight`; its own words)
      [STRAIGHT_LAYOUT]: {id: STRAIGHT_CUT_ID, make: makeRedoCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Straight out/increased-efficiency-straight.mp4'},
      // (the user, 2026-11-13: "a variation of increased effeciency with less emphesis on the text and the text flow with the action with the voice on top": Variation 7's film, quiet words, an ElevenLabs voice-over, shorter; the look `remotion-flow`)
      [FLOW_LAYOUT]: {id: FLOW_CUT_ID, make: makeRedoCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Flow out/increased-efficiency-flow.mp4'},
      // (the user, 2026-11-13: "keep the words same style just less pronounced in terms of timing": Variation 7's words with Variation 8's timing; the look `remotion-soft`)
      [SOFT_LAYOUT]: {id: SOFT_CUT_ID, make: makeRedoCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Soft out/increased-efficiency-soft.mp4'},
      // (the user, 2026-11-13: "making it a narration video ... like a narator talking to the viewer": Variation 8's quiet words, a narrator's voice; the look `remotion-narrator`)
      [NARRATOR_LAYOUT]: {id: NARRATOR_CUT_ID, make: makeRedoCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Narrator out/increased-efficiency-narrator.mp4'},
      // (the user, 2026-11-13: "in storyboard I added some slides to increased effeciency, make me a new variation with our good tilte UI, then add the voice to it based on the new slides we added"; the look `remotion-story`)
      [STORY_LAYOUT]: {id: STORY_CUT_ID, make: makeRedoCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IE-Story out/increased-efficiency-story.mp4'}}},
  // (the user, 2026-11-05: "now work on a new variation improved quality same way we have increased efficiency with remotion": lib/remotion/qualityCut.mjs)
  'improved-quality-v2': {id: QUALITY_CUT_ID, title: 'Improved Quality · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeQualityCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IQ-Cut out/improved-quality-cut.mp4',
    // (its variation with the words under a smaller 9:16 phone: the look `remotion-under`)
    renders: {under: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IQ-Cut-Under out/improved-quality-cut-under.mp4'},
    // (its variation told as Increased Efficiency is, the look `remotion-like-ie`, the user, 2026-11-11: the same plan, but words of its own, rewritten short, so a cut of its own here:
    // its retyped words are kept apart from Variations 2 and 3's)
    layouts: {[IE_LAYOUT]: {id: QUALITY_IE_CUT_ID, make: makeQualityCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IQ-Cut-IE out/improved-quality-cut-ie.mp4'},
      [NARRATOR]: {id: QUALITY_IE_CUT_ID, make: makeQualityCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render IQ-Cut-Narrator out/improved-quality-cut-narrator.mp4'}}},
  // (the user, 2026-11-11: "now do a variation in live oversight using the same way we did both previous videos, make sure to use remotion": lib/remotion/oversightCut.mjs)
  'live-oversight-v2': {id: OVERSIGHT_CUT_ID, title: 'Live Oversight · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeOversightCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render LO-Cut out/live-oversight-cut.mp4',
    layouts: {[NARRATOR]: {id: OVERSIGHT_CUT_ID, make: makeOversightCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render LO-Cut-Narrator out/live-oversight-cut-narrator.mp4'}}},
  // (the user, 2026-11-12: "do next ones dynamic auditing and precision planing ... using remotion and same style as increased effeciency": lib/remotion/auditingCut.mjs, lib/remotion/planningCut.mjs)
  'dynamic-auditing-v2': {id: AUDITING_CUT_ID, title: 'Dynamic Auditing · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeAuditingCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render DA-Cut out/dynamic-auditing-cut.mp4',
    layouts: {[NARRATOR]: {id: AUDITING_CUT_ID, make: makeAuditingCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render DA-Cut-Narrator out/dynamic-auditing-cut-narrator.mp4'}}},
  'precision-planning-v2': {id: PLANNING_CUT_ID, title: 'Precision Planning · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makePlanningCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render PP-Cut out/precision-planning-cut.mp4',
    layouts: {[NARRATOR]: {id: PLANNING_CUT_ID, make: makePlanningCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render PP-Cut-Narrator out/precision-planning-cut-narrator.mp4'}}},
  // (the user, 2026-11-12: "do next request maintenance": lib/remotion/maintenanceCut.mjs)
  'requesting-maintenance-v2': {id: MAINTENANCE_CUT_ID, title: 'Requesting Maintenance · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeMaintenanceCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render RM-Cut out/requesting-maintenance-cut.mp4',
    layouts: {[NARRATOR]: {id: MAINTENANCE_CUT_ID, make: makeMaintenanceCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render RM-Cut-Narrator out/requesting-maintenance-cut-narrator.mp4'}}},
  // (the user, 2026-11-16: "based on all videos like requesting maintenance, precision planing, increased effeciency, the style and everything should be done to requesting support till
  // reports & AI ... make it with remotion": the films made of sections, cards and panels, lib/remotion/sectionCore.mjs; Reporting & AI's is one big page, as Precision Planning's)
  'tracking-expirations-v2': {id: EXPIRATIONS_CUT_ID, title: 'Tracking Expirations · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeExpirationsCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render TE-Cut out/tracking-expirations-cut.mp4',
    layouts: {[NARRATOR]: {id: EXPIRATIONS_CUT_ID, make: makeExpirationsCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render TE-Cut-Narrator out/tracking-expirations-cut-narrator.mp4'}}},
  'requesting-support-v2': {id: SUPPORT_CUT_ID, title: 'Requesting Support · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeSupportCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render RS-Cut out/requesting-support-cut.mp4',
    layouts: {[NARRATOR]: {id: SUPPORT_CUT_ID, make: makeSupportCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render RS-Cut-Narrator out/requesting-support-cut-narrator.mp4'}}},
  'replenishing-inventory-v2': {id: INVENTORY_CUT_ID, title: 'Replenishing Inventory · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeInventoryCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render RI-Cut out/replenishing-inventory-cut.mp4',
    layouts: {[NARRATOR]: {id: INVENTORY_CUT_ID, make: makeInventoryCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render RI-Cut-Narrator out/replenishing-inventory-cut-narrator.mp4'}}},
  'exception-management-v2': {id: EXCEPTIONS_CUT_ID, title: 'Exception Management · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeExceptionsCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render EM-Cut out/exception-management-cut.mp4',
    layouts: {[NARRATOR]: {id: EXCEPTIONS_CUT_ID, make: makeExceptionsCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render EM-Cut-Narrator out/exception-management-cut-narrator.mp4'}}},
  'reporting-ai-v2': {id: REPORTING_CUT_ID, title: 'Reporting & AI · Remotion cut', fps: CUT_FPS, width: CUT_W, height: CUT_H, make: makeReportingCut,
    render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render RA-Cut out/reporting-ai-cut.mp4',
    layouts: {[NARRATOR]: {id: REPORTING_CUT_ID, make: makeReportingCut, render: 'cd "D:\\Documents\\Saas\\videos" && npx remotion render RA-Cut-Narrator out/reporting-ai-cut-narrator.mp4'}}},
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
