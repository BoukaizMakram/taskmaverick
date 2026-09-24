# Improved Quality demo

Route: `/improved-quality-demo`. The silent, seekable animation has 23 chapters and runs for 107.1 seconds. Script slashes become explicit line breaks. Captions reuse the Increased Efficiency letter animation at 1.18 times its reveal rate; panel reveals take approximately 0.3–0.6 seconds.

Knowledge Base opens Cooking Food Temps directly, then Start, the text lesson, and the chart. This sequence is independent of team missions: it never claims a mission, asks for a code, or adds an item to Closed. The guided workplace checklist is a separate mission.

The single demo clock controls Yes selections, quiz answers and the passing gate, photo/video captures, media playback, ratings, scrolling, and emphasis. Backward seeking resets those states. Shared components provide the tablet board, menu, mission details, and phone frame. Knowledge Base media screens follow the supplied screenshots. Capture and rating data are fictional demonstration fixtures; Media Proofs uses the user's reference images and their displayed mission metadata.

The reference link is present as soon as mission instructions open. Three paired Yes/No checkbox rows precede the fourth-step Play row. The training viewer expands into a separate video-topped quiz with three checkbox statements, sequential selections, and Submit & Close. After passing, it fades away and enables Continue. Phone and gallery entrances run once across their consecutive chapters to keep each device visible between captions.

Media Proofs follows `C:/Users/makra/Documents/images UI/image 30.png` and `image 31.png`: the mission type, timers, category, title, performer and timestamp sit above a three-column photo mosaic. The original reference images are copied unchanged to `public/demo-quality/media-proofs-temperature.png` and `media-proofs-pest.png`; CSS clips their existing headers so animated HTML metadata can be emphasized without duplication. The evidence chapter shows the phone layout followed by the tablet layout, then the web gallery retains the same grouping. The menu label is Media Proofs, matching the supplied software UI.

## Sample media

Created with the built-in imagegen tool, not captured from the user's software. Videos are six-second inspection pans derived from the generated stills, encoded locally with FFmpeg; they are illustrative demo clips, not recordings of real inspections.

- `public/demo-quality/shelving.png`
- `public/demo-quality/damaged-hinge.png`
- `public/demo-quality/shelving-training.mp4`
- `public/demo-quality/condition-report.mp4`

Shelving prompt:

> Create a realistic documentary photo used as sample evidence inside a workplace software demo. Landscape 16:9. Clean commercial kitchen dry-storage shelving, stainless steel shelves, neatly arranged sealed transparent ingredient containers with small blank white labels, plates stacked evenly, clear floor, bright natural overhead lighting. Straight-on smartphone inspection photograph, everyday authentic detail, no people, no text overlays, no UI, no logos. Save as a project asset.

Damaged-equipment prompt:

> A realistic sample workplace inspection photo for a software demo, landscape 16:9. Close-up of a stainless steel commercial kitchen prep cabinet with a clearly broken loose lower door hinge, one screw missing and door slightly misaligned, visible bent hinge plate near center right. Ordinary clean restaurant kitchen, neutral bright lighting, everyday smartphone photo, fine material texture, no people, no logos, no captions or UI. The defect should be very easy to identify.

## Validation

Run `node --test lib/improvedQualityStory.test.mjs lib/automationState.test.mjs` and `npm run build`. The story tests cover all 23 chapters, explicit line breaks, Knowledge Base independence, sequential Yes selections, quiz gating, ordered evidence capture, and translation reset on seek.
