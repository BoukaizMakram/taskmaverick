// The cursor that POINTS (the user, 2026-10-15: "a new line of videos like the videos with details but no yellow highlight, only the cursor visible all the time pointing on things we are talking
// about, on the bottom right of where the highlight rectangle was"; "another line where we have the yellow highlight with the cursor at the same time when we highlight").
//
// The videos' own cursor is a layer the slides have where the demo clicks; a slide that only SHOWS something (a highlight, the words) has none, and the Increased Efficiency board has none at all.
// The pointing videos (`PROFILES[...].pointer`, lib/storyboardVideos.mjs; `pointBeats` in components/storyboardPlayerDom.js) give every slide with software a cursor of this kind: the same
// picture as the demo's (`/demo-hand.png`, 42 x 52, its fingertip near the top) as a layer of its own, put by slide coordinates (so the art's fitting to the video moves it with the art, as it does
// the demo's), at the bottom right of the highlight rectangle of the slide, or where the slide before left it.
//   POINTER_LAYER        the layer (key 'hand', name 'Hand': it is the cursor to the video, `roleOf`)
//   pointerHtmlOf(name)  the HTML of the asset (undefined: not this one), as `lessonHtmlOf` does for the lesson
//   POINT                where the fingertip goes from the rectangle's bottom right corner, stage px (inside it); `room`: the least between the fingertip and the picture's bottom, so the whole hand is seen
export const POINTER_ASSET = 'sb-pointer:hand';
export const POINTER_LAYER = {key: 'hand', name: 'Hand', kind: 'dom', asset: POINTER_ASSET, box: {x: 0, y: 0, w: 42, h: 52}};
export const POINT = {dx: 10, dy: 6, room: 92};
const HTML = '<div class="dh-hand" aria-hidden="true" style="opacity: 1; transform: translate(0px, 0px) rotate(0deg) scale(1);" data-sb-root="hand"><img alt="" draggable="false" src="/demo-hand.png"></div>';
export const pointerHtmlOf = name => (name === POINTER_ASSET ? HTML : undefined);
// Where the fingertip is, in slide coordinates, for a rectangle {x, y, w, h}: its bottom right corner, a little inside. `height`: the slide's (a column of a table runs to the bottom of the
// window, and a cursor there would be cut by the picture's edge: the fingertip stops `POINT.room` above it).
export const cornerOf = (rects, height = Infinity) => ({x: Math.max(...rects.map(r => r.x + r.w)) - POINT.dx, y: Math.min(Math.max(...rects.map(r => r.y + r.h)) - POINT.dy, height - POINT.room)});
// The `moves` of the pointer layer that put its fingertip (the fractions `tip` of its box) on `at`.
export const pointerMove = (at, tip) => [at.x - POINTER_LAYER.box.x - POINTER_LAYER.box.w * tip.x, at.y - POINTER_LAYER.box.y - POINTER_LAYER.box.h * tip.y];
