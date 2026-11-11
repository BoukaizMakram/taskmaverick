// The board "All storyboards" (/storyboard?video=all-storyboards; the user, 2026-11-06: "make me a new one clean for all videos/storyboard, and put the increased efficiency video variation 4 in that
// storyboard by just putting what's in the video scene by scene, make sure it's editable just like in figma ... the new storyboard will not be connected to videos at all, so if I change something
// there it shouldn't change the video, but it should be connected to the video, meaning if I change a title position ... and I hit apply to all ... it should apply to the whole row of the same video").
// A board like the others (every Figma-like tool of components/Storyboard.jsx), with one ROW for each video, a frame for each of its scenes, made by scripts/capture-cuts.mjs from a board's Remotion
// cut (public/storyboard/all-storyboards.json); what is edited is its own (content/storyboard/all-storyboards.json) and never reaches a video. A piece has the same key in every scene of its row, but
// nothing is linked (the user, 2026-11-09): retyped, moved, resized, restyled or deleted in one frame, it changes there alone; only "Apply to all in this row" (its place, size and look, never
// its words) or "Delete in the whole row", pressed, put it on all of them (lib/storyboardEdits.mjs applyAlongRow, hideAlongRow; lib/storyboardLinks.mjs).
// For now the board menu shows only All videos and this board (the user, the same day: "hide all the other pages of storyboards ... keep just all videos and all storyboards"): ONLY_BOARDS.
export const ALL_STORYBOARDS = 'all-storyboards', ALL_STORYBOARDS_NAME = 'All storyboards';
// How its frames are drawn: the storyboard's stage (.ad-stage) with the cuts' look (.rc-sb-stage: the cuts' font and background; their pieces' rules: components/remotion/CutParts.css, EfficiencyCut.css)
export const STORYBOARDS_STAGE = {className: 'ad-stage rc-sb-stage', style: '', shell: 'es-player demo-text-scope'};
// The boards the board menu shows, for now (null: all of them)
export const ONLY_BOARDS = ['all-videos', ALL_STORYBOARDS];
