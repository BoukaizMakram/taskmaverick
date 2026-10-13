# Taskmaverick Website — agent rules

Next.js 14 (App Router) + React marketing site. Plain global CSS (no Tailwind).
A growing part of it is an **in-website animation engine** that scripts the
Taskmaverick product UI (mission boards) with GSAP instead of using demo videos.

## Golden rules

- **Never run `npm run dev`** unless you kill it afterwards. To verify changes,
  run **`npm run build`** (it must pass) — do not leave a dev server running.
- **Styling:** plain CSS in `app/globals.css`. No Tailwind, no CSS-in-JS. Reuse the
  existing tokens in `:root` (`--blue #1271b7`, `--ink #111`, `--muted`, etc.).
  Namespaced class prefixes: `.tbl-*` (tablet chrome), `.ph-*` (phone chrome),
  `.chip-*` (mission card), `.om-*` (opened-mission detail view), `.am-*`
  (animation overlay), `.fs-*` (feature showcase), `.al-*` (assets library), `.vl-*` (video library),
  `.sb-*` (storyboard).
- **Fonts** are registered in `app/layout.jsx` via `next/font`: Poppins
  (`--font-poppins`), Inter (`--font-inter`), Montserrat (`--font-montserrat`).
  Don't add font `<link>`s.
- **Self-contained assets.** Recreate UI as HTML/CSS + inline SVG; commit images to
  `/public`. Do NOT reference Figma `api/mcp/asset/...` URLs in committed code —
  they expire in ~7 days. Generic icons (plus, menu, back, expand) are fine as
  inline SVG; the mission logo is `/public/mission-logo.png`.

## Figma → code

- Use the `figma-design-to-code` skill + `get_design_context` for any Figma node.
- Match the design's exact colors and the **Montserrat** font.
- Recreate at a **fixed coordinate space** wrapped in a container-query scaler so it
  stays crisp and animatable: a `*-fit` container (`container-type: inline-size`,
  `aspect-ratio`) holding the device at fixed px, scaled with
  `transform: scale(calc(100cqw / <width>px))`. See `.tbl-fit` / `.ph-fit`.

## Mission animation engine / demo system

**Read `docs/mission-animation.md` before touching any mission animation** — it is
the source of truth. This is a growing system to produce **12 code-accurate
animations** of the real product, assembled from **reusable, parameterized
components** (build each once; reuse with different data per scene). Build
components **only as needed** — do not pre-build.

- **One component, many contexts; device-agnostic; types share a base.** A
  **mission chip is identical on tablet and phone**. Mission types (Checklist,
  Media, Test, Survey, …) are the *same* card with different contained info, not
  separate components. The **opened mission** (`components/OpenedMission.jsx`,
  preview `/missions`) applies the same idea to the phone "Mission Details" detail
  view: one shell renders all six types (Task, Checklist, Media, Survey, Test,
  Audit) from a data object in `lib/openedMissions.js`.
- **Opened-mission lifecycle (RULE):** open → claim → close. The **content is
  always visible** (per Figma) — don't gate it behind claiming. The footer button
  tells the state: **Claim** = open, **Close/Continue** = already claimed. Claiming
  swaps the footer, reveals the **Execution timer** (counts up from `00:00:00`), and
  changes `who` to the claimer; closing snaps the pill GRAY, freezes both timers,
  and moves the mission to Closed. Per-mission default = `initialState` in
  `lib/openedMissions.js`. Full rule in `docs/mission-animation.md`.
- Boards have three columns: **Open → Claimed → Closed**. Animate with **one GSAP
  timeline** (`useGSAP`, labels + position strings); manually controllable
  (`restart` / `timeScale` / `seek`). Files: `components/AnimatedMissions.jsx`,
  `TabletMissions.jsx`, `PhoneMissions.jsx`, `MissionChip.jsx`. Previews:
  `/tablet`, `/phone`.
- A moving mission always lands at the **top** of its destination column (others
  slide down, then back up) and renders above the others while moving.
- **Demo animation vocabulary:** zoom in, pop up, circle/highlight, moving, and
  "things working" (live timers/counts/checks). It must look like the real software.
- **Scenes** live in `components/scenes/` and render inside a fixed **1280×720**
  `.scene` (16:9) scaled to the hero frame via container-query transform. A chapter
  opts into one with a `scene` key in `lib/chapters.js`, resolved through the
  `SCENES` registry in `HeroVideo` (renders the scene instead of a `<video>`).
  First scene: `PostedMissionsScene` on Chapter 1.
- **Lower-third captions (RULE):** narration text under a scene uses the
  `.lower-third` class — **34px Inter Medium (weight 500)**, white, centered
  horizontally, positioned in the **lower third** (near the bottom).
- **Storytelling cuts (`/improved-quality-v2`, `/increased-efficiency-v2`) — the hand acts, the yellow rectangle shows (RULE):**
  **the hand is for actions only** (a click, a drag, a scroll). **What is only shown — an alert, a
  link, a timer, a card, the tablet — gets NO hand: a thick yellow rounded rectangle is drawn around
  it** (`.iq2-mark`; every `point` stop of `HAND_STOPS`, `marksOf` in `lib/demoHand.mjs`).
  **The tail and the hand (RULE, 2026-10-05; all chapters of both videos):** *nothing on screen
  yet → the chat box pops EMPTY, already at the size of its words → the words type → the tail
  comes out of the bubble with the hand on its tip (the hand comes out of the bubble, never from
  outside) → the hand clicks / drags / swipes → THEN the tail fades out* (`launch` in
  `lib/demoHand.mjs`; `WORDS_FIRST` in the story). *More clicks with the same words: the hand
  stays on screen and moves to the next one, the box moving with it (no tail).* *The next chapter
  goes on with the hand (other words, same screen): the old words fade where they are (they do
  not follow the hand) → the hand moves to what it will click → a new bubble comes out of the
  hand: the tail, then the box, then the words → the click → the tail fades* (`relaunch`,
  `carryStop`, the last stop before says `stay`; `GOES_ON` in the story: steps, micro,
  rate, mobile, tour, remote; not Videos: its words come first). It swipes up **only where scrolling through a lot is the point**
  — Business Proofs, the tour, the report — never just to reach a checkpoint, and a swipe is
  near the list's right edge so the words come out of the hand. **What is only shown has NO
  tail of any kind:** the rectangle appears → the box comes on the right side of it (from its
  own middle) → the words type (the `CLOSED` bubble; all of Increased Efficiency). The hand is a big yellow pointer
  (`components/DemoHand.jsx`, timing in `lib/demoHand.mjs`); the caption is
  always the yellow message (`#ffec00`, black outline, `lib/captionBubbles.mjs`) —
  **what is on a slide is always centered** (the art and its words as one group; when
  more comes in, everything glides to stay centered) —
  the only style; there is nothing to choose. What the click does
  (scroll, timer turning red, the original claim/close…) starts at the click, not
  after the words. Title chapters are words only. Each chapter is also one
  asset in `/video-library` (one part at a time, no runs of several).
- **Storyboard (`/storyboard`) — one frame per action (RULE):** the videos as a
  Figma-style board (`components/Storyboard.jsx`, pure parts in `lib/storyboard*.mjs`):
  every frame numbered on top (each chapter row counts from 1), a notes box under it, every asset movable and its
  words editable (the font is not; **scale: a UI element keeps its proportions**, only the chat bubble, the spotlight and pictures stretch). **Every action is its own frame — a showing chapter: the
  outline, the empty bubble, the words (no tail); an action chapter: the empty bubble, the words,
  the hand halfway out on the tail, the tail and the hand on the target, the click, the tail
  fading; a chapter going on with the hand: the hand on its new target, the tail out of it, the
  empty bubble, the words, the click, the tail fading**
  (`lib/storyboardFrames.mjs`). **No duplicates:** a frame that shows nothing new but the
  cursor moved (or an animation all but done) is dropped at capture, the more telling of
  the two staying (`SAME`/`KEPT`/`RANK` in `scripts/capture-storyboard.mjs`). The frames are captured from the demos with
  `npm run gen:storyboard` (site running); what is edited lives apart in
  `content/storyboard/<video>.json` (`/api/storyboard`, local dev) and survives a new capture.
  A **+** appears between two frames on hover and adds a blank frame there (it pops in, the others
  glide over). Holding a frame's number bar and dragging reorders it (numbers renumber per row, its
  note goes with it; **the frame held never animates**, only the others slide). **Any text** is
  retyped with a double-click (Tab: the next text); **Delete on a frame deletes any frame into the
  Trash** (`/storyboard?video=trash`: a board of its own, `lib/storyboardTrash.mjs`; copy a frame
  there and paste it on a storyboard; undo takes it out of the Trash again); **Shift+click** picks several assets **in any frames** (move, nudge, copy, cut, delete, align and the sidebar act on all of them; `lib/storyboardPick.mjs`); **a click again at the same place** (not a double-click) goes to the next layer under the pointer, one by one, round again after the last; **dragging on a frame's background draws a rectangle that picks the assets it touches** (Shift adds; from a full-frame backdrop that is not selected it draws one too, a click still selects it); **frames picked together (Shift+click or a rectangle on the board) are carried together** by their number bar; **double-click on text retypes it with the scale handles still on** (to change its size); **rectangle tool (R)** draws a box with any fill (gradients, metals); **The split design (the user, 2026-10-07): every frame of both boards looks like the model** (Scratch, frame 3: a dark metal gradient, a plate over the left half holding the art, the words on the right in white Caveat with no chat box, a flat black thinner iPad; the line named **Scratch** is never touched): `node scripts/storyboard-split.mjs` (the site running; run it again for a new or recaptured frame; `docs/storyboard.md`); **Scale tool (K)**: a handle drag scales an asset **with its words** (a chat box's font grows with its box; `docs/storyboard.md`); **Ctrl+] / Ctrl+[** move the picked assets forward / back in the stacking (Shift: front / back); **Background** (sidebar, with a frame picked; all picked frames at once) is a color or a linear / radial gradient, and an asset's **Fill** too (`lib/storyboardPaint.mjs`: the ready ones, only gradients, 14 metals first (**Metal plate**, steel, aluminium, chrome, titanium, gold, copper, brass, rose gold, diamond plate, perforated, carbon…), each a gradient + a **texture** (brushed, fine grain, cross-hatch, perforated, diamond plate; a Texture menu on any gradient); no plain-color presets; the video follows it); **the videos (the user, 2026-10-09: one video for the lines that tell one thing, from the first scene to the last, with the transitions between scenes): the lines are in runs (`lib/storyboardVideos.mjs`, edit the table to regroup) and each run has ONE video at the right of the last frame of its last line, playing all of its lines one after the other - Improved Quality: the Knowledge Base; the mission (instructions, alert, link, translate, steps, micro-training, photos and videos, photo proof, video proof: ~68 s); the tablet, the mission, the ratings (closed mission, self-rating, peer ratings); what managers see; the web report and the closing words. Increased Efficiency: the title and the board's missions; the shared tablet; what it shows; who does what. The first one, "The tablet and its Knowledge Base", is the model (the user, 2026-10-08): `directorOf` turns the slides of any run into the script: titles fade in growing, words written by the pen, the cursor clicks where the demo clicked, highlights after the cursor; the lines of your own, Scratch and Fonts have no video; **the software MOVES, it is not crossfaded** (the user, 2026-10-09: "scroll animation, expanding to show mission details"): the same screen in two slides morphs (scrolls, opens, folds), named cards glide to their new place (claim, close, priority), the cursor aims at the demo's own click targets (`lib/demoTargets.mjs`, from the slides' names), drags the rating knob and swipes lists, a zoom that goes under the words is filmed from further back, and in the video the words are 45 px, 380 wide, in the middle of the room at the right of the tablet (the user, 2026-10-13; first 50 px across the whole side, 2026-10-10), the first word is written as soon as the old words are gone and the right side is never empty (`directorOf`, `penStart`); `docs/storyboard.md`, "A good video of the software"; **the first line of Improved Quality is Animations (the user, 2026-10-12; then "make them videos not slides"): one VIDEO on the board for each animation the videos play (fade in with scale, fade out, handwritten, panel wipe, cursor click, highlight, zoom in, pop up, expand, scroll, drag, glide, color change, claim and close, menu / drawer / video), each a player (a poster, a big play button, a control bar; click to play) with a purple VIDEO header and a note under it that says how it moves, with the numbers the player uses; its slides (named, the first one noted) are still frames of the line but are not on the board while the line is shown as videos (sidebar, the line picked: **Show: Videos | Slides**; `line-view <line> videos|slides` in the CLI; `lines.added[id].videos`, `lib/storyboardCells.mjs`); a video is moved, deleted, copied and duplicated with all its slides; the line's own video, the reel (all of them in a row, about 1 min 15 s), is still at the end of its row; it is made from duplicates of the board's own frames by `node scripts/storyboard-animations.mjs` (`lib/storyboardAnimations.mjs`; running it again makes the line anew: change it by hand only with `scripts/storyboard.mjs`); a frame can have a **name** (header and sidebar, `name` in the CLI) that never changes how a video plays; the proof checkpoints line (`capture`, "Photos or videos can be taken within missions…") is on the board but not in the mission video; smooth and the same in every video (the user, 2026-10-12: "fix this timeline … smooth out the pop animation and don't highlight … claim and close … no highlights … a pass over all videos for stutter, highlight behind UI, not smooth transitions"): the Video timeline is as wide as its film, flush with its bottom edge, with the film's bottom corner radius (`placeTimelines`); the pop rises out of the board's own card and there is no yellow outline in the pop, claim and close of any video (`NO_MARKS`; `plain` in the Animations line); a screen moves by where it IS (`glideSpan`), nothing starts or stops at speed (`windowEasing`), no hard cut at a click (`takeOver`), layout changes are animated (`flip`); no stutter: the next slide is made ready a step in each picture of the hold (`prepareAhead`: drawn, laid out, the pen, the animations), not all in the first one; a video can have its own pace and look (`PROFILES` in `lib/storyboardVideos.mjs`: What managers see is 10 s, scrolls its list once, dims the menu, thickens the hover smoothly, tablet as the slides: the user, 2026-10-13; **whenever a video shows a tablet it is the size of the 6th slide of the Scratch line, over the dark gray** (`tabletFit`; the web report's dashboard too, as wide as the tablet's frame is seen: `REPORT`; and a list scrolled by the time is got ready where it is when the move starts, so it never jumps back while playing); **the peers’ ratings (the user, 2026-10-13): the purple connector is drawn out of the mission like an After Effects trim path (the mission, rating 1, then rating 2, each card popping as it arrives) and a peer’s face appears on the mission only when that peer’s Submit is pressed: `peerDraw`, `PEER_DRAW`, `docs/storyboard.md`**; **the mission video (the user, 2026-10-13): it opens on the mission card and expands it at once, and instructions / alert / link share one beat: the highlight first, then the words written on the right, 3 s together + 0.7 s held (`PROFILES.mission.open`, `.beats`; the instruction words are two short sentences, "Add Instructions. / Reinforce Standards.")**; **all the videos of a board in one line (the user, 2026-10-13: "take all videos and put them in one line, starting from The tablet and its Knowledge Base"): a line you added can hold a `shelf` of videos (`shelvedRuns`, `line-shelf`, `runs`; Improved Quality has the line "Videos" under Animations: they play the runs' own lines, so slide edits show in them)**; **Increased Efficiency follows the Improved Quality videos (the user, 2026-10-13): its four videos are in the line "Videos" at the top, every scene with a highlight has the same beat (highlight, then the words, 3 s + 0.7 s held), outline text is centered and an outline is never cut by the picture's edge: `PROFILES['increased-efficiency-v2']`**; the web report's tour is one scroll and its yellow outlines have their words centered: `PROFILES.report`); check every video again with `node scripts/storyboard-qa.mjs cuts|marks|play` (jumps between pictures, outlines behind the software, real-time stutter); `docs/storyboard.md`, "Smooth and the same in every video"**;
  **handwriting (the user, 2026-10-07)**: a chat box with `anims` is written by a pen along its letters, at a **speed in words a second** (a slider), when its slide is played (a small blue round **play** button with a white triangle at the slide's top right while it is selected; sidebar **Handwriting**; `animate` in the CLI; `lib/storyboardHandwriting.mjs`, `docs/storyboard.md`), and the **Fonts** line above Scratch shows the same slide in 14 handwriting faces; **Ctrl+C / X / V** copy, cut and paste assets or frames onto any frame of any board
  (`lib/storyboardClipboard.mjs`); a **picture** is pasted or dropped on a frame; the **pencil (P)** draws on a frame (color wheel in the inspector, Alt+click picks a color); **Alt+drag** duplicates an asset (the original stays, the copy follows the pointer; a copy of a yellow outline is still an outline that stretches from its sides); **Shift while dragging** keeps anything on one axis, like Figma; a **chat bubble's handles resize its box, never its words, and it is always unique**; **duplicates along a line are linked** (retyping one retypes the others) until **right-click > Make unique**. Ctrl+D duplicates a frame; **Shift+A** opens the product's UI as a **grid of thumbnails
  by category** (Missions, Mission details, Boards, Navigation, Screens, Web app, Annotations) —
  whole pieces (a mission chip, the tablet board, the checklist details…), never loose text — with a
  search box; the one you pick is added to the frame. The pieces are real components rendered on
  `/storyboard-ui` (dev-only; add one to `ITEMS` in `components/StoryboardUi.jsx`), captured by
  `npm run gen:storyboard -- --parts`. The same pieces are browsable as a grid at
  **`/assets-library`** (the **Assets Library**: UI pieces by category; **Open the asset** in a
  piece's dialog opens the real piece, zoomable, at `/assets-library/<id>` —
  `components/AssetViewer.jsx`); the animation clips are in the **Video Library**
  (`/video-library`). Anywhere a piece is drawn (`components/AssetPiece.jsx`, the Storyboard) must
  import `components/web/web.css` — the web app's `.wa-*` rules (a mission's 16px logo, tags…)
  live there, not in `globals.css`.
- **Editing the storyboard when the user asks (RULE): DO NOT CHANGE HOW IT LOOKS.** Change exactly
  what was asked, with `node scripts/storyboard.mjs` (look: `lines`, `frames`, `frame`, `texts`;
  change: `text`, `style`, `move`, `note`, `line-*`…), never by rewriting
  `content/storyboard/*.json` by hand, never by recapturing or touching the demos for it. An open
  page shows the change within seconds (it polls the file's revision and merges). Guide:
  **`docs/storyboard.md`**. The page has a Figma-like **sidebar** (Position, Layout, Appearance,
  Fill, Stroke, Effects, Text with its color), **lines** (click a line's label: rename, add,
  duplicate, delete — a deleted line's or frame's frames go to the Trash with the line's name),
  **Export / Import** of the whole storyboard as editable JSON, and **backups**
  (`content/storyboard/backups/`, always before an import or a restore). Also: layer / background
  **blur** (Effects), **snapping** guides while dragging, **Ctrl+Shift+C / V** copy and paste a
  position, W / H **locks**. **Every chat box starts 300 wide, its words wrapping, NOT locked (the user, 2026-10-07: "remove the lock by default")**
  (the user, 2026-10-06; after a recapture: `node scripts/storyboard.mjs bubbles 300` per video).
  **On the storyboard no chat box has a tail** (`tails off`; the videos keep theirs) **and every chat
  box is centered vertically** in its frame (the user, 2026-10-06; `docs/storyboard.md`).
- **Built from the sales-demo recording:** the software simulator on `/phone`
  (`components/sim/`, phone + shared tablet on one store: tickets, guided
  checklists with proof, lessons, tests, Media Proofs, ratings), the web app on
  `/running` (`components/web/`: Overview, Missions library / builder /
  marketplace / processes, Reports, Dashboards) and the AI demo call `/demo-ai`
  (`components/demo-ai/`, Gemini + ElevenLabs). See `docs/mission-animation.md`.
  Still to build: number-pad entry beat, "Personal Missions Assigned" modal.

### Timer names & rules (do NOT change without being asked)

- Names: **Execution timer** = the **left** timer (plain, counts up). **Timer** =
  the **right** timer (the colored pill).
- **Timers by state:** **Open** shows only the **Timer** (right pill), which runs —
  **no execution timer, no performer name**. **Claimed** adds the execution timer
  (counts up from `00:00:00`) + the performer name. **Closed** → both **stopped**
  (frozen).
- **Open ordering:** Open missions are ordered by time posted — the **longer the
  Timer, the higher** (top).
- **Timers tick in REAL TIME** — one whole second per second
  (`00:00:00 → 00:00:01 → …`). Never sped-up/compressed unless the user explicitly
  says to animate fast. Impl: tween the seconds value with `duration` == number of
  seconds, `ease:'none'`, `Math.floor` for whole steps.
- **The Timer (right pill) is GREEN by default** (`#007A33`) and stays green. Color
  aging (orange `#ed7f04` → red `#bd1f59`, gray `#686f76` on close) is **opt-in
  only**, and color changes **snap** (no fade).

## Project structure

- `app/` — routes (`page.jsx` landing, `tablet/`, `phone/`, `running/`, `demo/`, `demo-ai/`, `video-library/`, `assets-library/`, `storyboard/`, `api/demo-ai/*`), `layout.jsx`,
  `globals.css`.
- `components/` — `Landing`, `HeroVideo`, `Chapters`, `FeatureShowcase`, mission
  components above.
- `lib/chapters.js` — landing chapters + per-chapter video/subtitle data.
- `docs/` — `mission-animation.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
