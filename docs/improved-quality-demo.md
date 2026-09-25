# Improved Quality demo

Route: `/improved-quality-demo`. This is a silent, seekable animation. It has 8 chapters and runs for 43.9 seconds, ending on "Micro-Trainings Are Delivered / In Context Of Actual Work". Script slashes become explicit line breaks. Everything is derived from the single demo clock in `lib/improvedQualityStory.mjs`, so seeking in either direction is exact.

| # | Chapter | On screen |
|---|---|---|
| 1 | Teams Are Constantly Guided | Title words only |
| 2 | Knowledge Base | Tablet: press Menu, zoom in; open Knowledge Base. No mission is opened: the list of knowledge missions shows and three are highlighted in turn (`KB_TOUR`) |
| 3 | Instructions | Straight to the phone: the tablet steps back (it never opens the mission) as the phone arrives with Mission Details open. The camera zooms in (top-anchored), then the words type inside the phone and the instructions are highlighted |
| 4 | Alerts | Phone: camera pans to the alert |
| 5 | Links | Phone: camera pans to the link inside the instructions |
| 6 | Translate | Phone: press the ES button, the content crossfades to Spanish, then the camera eases out |
| 7 | Step-by-step | Phone pushes to the checklist mission; Yes is pressed three times. The whole phone is framed, top visible, with the words lowered beneath it (`LAYOUT.phoneCaptionTop`) |
| 8 | Micro-training | The phone grows down into the space the words left while the checklist scrolls to step 4; the words type inside the phone under it; Play is pressed; the video pops out beside the phone as the camera pans to frame both |

## Motion rules

- **Text never overlaps UI.** Captions own a column on the left, from x 80 to 520 (`LAYOUT`). Devices are centered in the area to the right (anchor 1060,450). `cameraAt()` clamps every zoom so the device edge never crosses x = 570 on screen. A test scans the whole timeline to enforce this.
- **Center the main object** within the device area. The tablet (1.1×) holds through the start of chapter 3, then the phone takes over. In chapter 8 the camera frames the phone and the video together.
- **Highlight with a purple rounded rectangle** (`highlights`, `.iq-highlight`). A rectangle pops onto each subject once the camera arrives (instructions, alert, link) and onto each pressed control. It pulses with a light fill on the press. It sits outside the camera layer, so the stroke never scales.
- **Camera** zooms and pans with smootherstep, about 0.8–0.9 s per move. Phone zooms are **top-anchored** (`topAnchored()`): the top of the phone always stays on screen, with `LAYOUT.topMargin` above it.
- **UI pops use expo-out:** quick start, long settle. The phone arrives from 0.88× with a short blur-to-sharp, and the side video grows out of the phone.
- **One caption size** for device captions (`--iq-caption-size`). The title style is used only in chapter 1.
- Focus points in `FOCUS` are stage coordinates measured from the live UI. Re-measure them if the layout changes.

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

Run `node --test lib/improvedQualityStory.test.mjs lib/automationState.test.mjs` and `npm run build`. The story tests cover:

- the 8-chapter script and its line breaks
- the Knowledge Base steps and presses
- the tablet-to-phone handoff
- the camera: no jumps, zoom-in on each subject, zoom-out for the video
- the translate, Yes and training presses, including reset on seek
