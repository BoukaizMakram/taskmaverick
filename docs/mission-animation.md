# Mission Animation Engine

## Automation demo page

`/automation-demo` plays a 104-second, 11-scene Automation demo using the actual
`InteractiveMissionBoard` in tablet mode. `components/AutomationDemo.jsx` owns the
caption timings and GSAP camera/cursor timeline. The scripted clicks go through
the existing Personal Board, Team Board, Claim, personal-code, and Close controls.
Replay remounts the software to start a fresh take. Play/Pause and fullscreen are
available below the film. This is a browser-rendered film, not a pre-rendered MP4.

## Interactive recording previews

`/phone` and `/tablet` default to interactive mode in the local development site.
Both devices start at the personal home screen. My Board opens the personal board;
L001 - Sweet Beverly opens the location grid, with each location opening its own
team board. Mission state stays separate for each board during the preview session.
On either device, selecting a mission opens only its content. Click Claim to open
the personal-code keypad. Tablet content opens in the right-side drawer.
Menus use the exported SVG artwork from Figma page 1:2, with separate personal
and team action menus. Original icons are stored in public/board-icons.
Claim and Close both require a valid personal code. The rainbow divider animates
only while the completed six-digit code is being verified; typing controls are
disabled during verification. No next-digit highlight
or hover styling is applied to the interactive mission UI.
Enter `123456` for Anna F. - Staff or `654321` for J. Maverick. These are local
recording identities, not account authentication; Retrieve Codes displays them.
The sixth digit starts a short verification animation and then submits automatically. An unknown code keeps the mission Open.
Claiming places the mission first in Claimed, updates the counts, displays its
performer, and starts the execution timer at zero. Reset interaction restores the
initial board and timers for another take. State is local to each mounted preview.
The original animation tools remain available through the mode switch.

Shared implementation: `InteractiveMissionBoard` and `PersonalCodeDialog`; mission
cards and details reuse `MissionChip`, `PhoneShell`, and `OpenedMission`.

In-website animation software for Taskmaverick product demos. Instead of recording
videos, we **rebuild the real product UI in code and script it** with controllable
GSAP timelines. This keeps demos crisp at any size, editable in code, and cheap to
change when the product changes.

**Goal:** produce **12 animations**, each a code-accurate demo of what the software
actually looks like. We assemble each animation from **reusable, parameterized
components** (see *Component library* below) — build each component once, reuse it
across animations with different data. The tablet "Missions" board below is the
first slice.

## Stack

- **Next.js + React** (client components).
- **GSAP** + **@gsap/react** (`useGSAP`) for the timeline. Already a dependency.
- Plain CSS in `app/globals.css` (`.tbl-*` for the UI, `.am-*` for the animated variant).
- **Montserrat** font (matches the Figma source), registered in `app/layout.jsx`.

## Files

| File | Purpose |
|------|---------|
| `components/TabletMissions.jsx` | Static recreation of the Figma tablet board. |
| `components/AnimatedMissions.jsx` | Animated variant — the GSAP timeline lives here. |
| `components/OpenedMission.jsx` | **Opened mission** (phone "Mission Details") — one shell renders all types. |
| `lib/openedMissions.js` | Sample data for the six opened-mission types. |
| `app/tablet/page.jsx` | Preview route (`/tablet`) with Replay + speed controls. |
| `app/phone/page.jsx` | Preview route (`/phone`) — Personal Board. |
| `app/missions/page.jsx` | Preview route (`/missions`) — all six opened missions. |
| `app/globals.css` | `.tbl-*` (board UI), `.ph-*` (phone), `.chip-*` (card), `.om-*` (opened mission), `.am-*` (animation). |
| `public/mission-logo.png` | Taskmaverick pinwheel used on every card. |

## Coordinate system

Everything lives in a **fixed 1174×837 space** (the tablet, `.tbl-tablet`) that is
fluidly scaled to its container with a container-query transform
(`transform: scale(calc(100cqw / 1174px))`). Because the space is fixed, animated
positions are exact pixel values and stay correct at any rendered size.

- Screen: **1114×777**, inset 30px inside the bezel.
- Header: 73px tall. Content padding: 17px 16px.
- Board width: **1082** = 3 columns of **350** + two **16px** gaps.
- Column X (inside the board): `OPEN_X = 0`, `CLAIMED_X = 366`, `CLOSED_X = 732`.
- One row down = `card height + 8px` gap (computed at runtime from the card's height).

## Data model

Three status columns: **Open → Claimed → Closed**. Each mission is a card with:
`logo`, `kind` (Checklist / Media …), `badge` (points weight, e.g. 25), `title`,
`who` (scope while open, e.g. "Global - Organization"; claimer while claimed, e.g.
"Anna F. - Staff"), `date`, and two timers (see Timers below). Each column tab
shows a live count (`Open - N`).

### Mission lifecycle — open → claim → close (RULE)

A mission has three lifecycle states, and **opening one is a real interaction**, not
just a static card. **The mission's content is always visible** — the type body
(checklist items, questions, media playlist, test sections) shows whether the mission
is claimed or not, exactly as in Figma. **Follow the Figma frame to know the state:**
a **"Claim"** footer means *open*; a **"Close" / "Continue"** footer means *already
claimed*.

1. **Open** — the mission is **opened**: summary + description + red notice, and the
   full type content is shown. Footer reads **"Claim"**. Only the **Timer** (right,
   green) is shown; `who` is the poster/scope (e.g. "J. Maverick").
2. **Claimed** — on **Claim** the user takes it on: `who` becomes the **claimer**
   (e.g. "Posted by: Anna F. - Staff"), the **Execution timer** appears next to the
   pill and counts up from `00:00:00`, and the footer becomes **"Close"** (or
   **"Continue"** for a multi-step Test). *Claiming does not reveal the content — the
   content was already visible; claiming changes ownership, the timer, and the button.*
3. **Closed** — on **Close**, the mission is completed and **moves to the Closed
   column**. Both timers **freeze** (final values) and the Timer pill **snaps GRAY**
   (`#686f76`, no fade). The footer reads **"Closed"** (disabled).

So the opened detail view (`OpenedMission`) is the single-mission expression of the
same **Open → Claimed → Closed** lifecycle the board animates. Per-mission default
state lives in `lib/openedMissions.js` (`initialState`) and matches each Figma frame:
Task / Media / Survey / Audit start **open** (Claim); Checklist / Test start
**claimed** (Close / Continue). The board's rightward move is that same transition
seen from the board; the detail view is it seen from inside the mission.

### Timers — canonical names & behavior

Every mission has **two** timers, side by side. Use these names:

- **Execution timer** — the timer on the **LEFT** (plain text). Elapsed execution
  time; counts **up** from `00:00:00` (`HH:MM:SS`).
- **Timer** — the timer on the **RIGHT** (the colored rounded pill). This is "the
  timer", the one with colors. **Green by default** (`#007A33`); color aging
  (orange `#ed7f04` → red `#bd1f59`, gray `#686f76` on close) is **opt-in** and
  **snaps** (no fade).

Behavior (same on **tablet and phone**):

- **Open** → shows **only the Timer** (right pill), which runs. **No execution
  timer, and no performer name.**
- **Claimed** → both timers run; the **execution timer appears** and the performer
  (claimer) name shows.
- **Closed** → both timers **stopped** (frozen at their final values).
- Timers tick in **real time** (one whole second per second) unless explicitly told
  to animate fast.
- **Open ordering:** missions in the Open column are ordered by **time posted** —
  the **longer the Timer, the earlier it was posted**, so it sits **higher** (top).

Typography: performer name = 600 / 12px; execution timer + date = medium (500) / 12px.

## Animation rules

1. **A moving mission always lands at the TOP of its destination column.** Any card
   already there **slides down** one row to make room. When the moving mission
   leaves, the displaced card **slides back up** to the top.
2. **The moving mission renders above** the other cards while it moves (`z-index`).
3. **Lifecycle path:** `Open → (claim: move right) → Claimed → (close: move right
   again) → Closed`. Each transition is a rightward move to the next column's top.
4. **Counts update on every transition:** source column −1, destination +1, with a
   small scale "pop".
5. **Claimer name:** while Open the card shows its scope ("Global - Organization").
   On claim it cross-fades to the claimer's name ("Anna F. - Staff").
6. **Timers by state.** **Open** shows **only the Timer** (right pill), which runs —
   **no execution timer, no performer name**. **Claimed** adds the **Execution
   timer** (counts up from `00:00:00`) and the performer name. **Closed** → both
   **stopped** (frozen). Timers count up in real time.
   **Open ordering:** Open missions are ordered by time posted — **longer Timer =
   higher** (top).
7. **Timers tick in REAL TIME by default** — one whole second per second
   (`00:00:00 → 00:00:01 → …`), never a sped-up/compressed tween. Only compress or
   fast-forward when explicitly asked. (Impl: tween the seconds value with
   `duration` == the number of seconds, `ease:'none'`, and `Math.floor` for whole
   steps; the speed buttons / `timeScale` still let you fast-forward.)
8. **The Timer (right pill) is GREEN by default** (`#007A33`) and stays green.
   Color aging (orange `#ed7f04` → red `#bd1f59`, gray `#686f76` on close) is
   **opt-in** — apply it only when explicitly requested. Color changes **snap**
   (no fade).
9. **No points/score badge** appears during the move.

### Reference sequence (current prototype)

- Start: `Air Conditioning Cleaning` in **Open** (green pill, no execution timer);
  `Sanitize Surfaces` in **Claimed**. Counts `Open 1 · Claimed 1 · Closed 0`.
- **Claim:** the mission moves right into Claimed's top slot; `Sanitize Surfaces`
  slides down; the execution timer appears and starts counting up; claimer becomes
  "Anna F. - Staff"; counts → `0 · 2 · 0`.
- **Run:** the execution timer counts up in real time (one second per second);
  the pill stays green.
- **Close:** the mission moves right again into Closed's top slot; the execution
  timer freezes; `Sanitize Surfaces` slides back up to the top of Claimed; counts →
  `0 · 1 · 1`.
- Hold, then loop.

## Authoring the timeline

The whole story is a single GSAP timeline built in `useGSAP()` in
`AnimatedMissions.jsx`. Each `.to()` / `.call()` is one beat.

- **Positioning beats:** the string after a tween places it on the clock —
  `'claim'` (at the label), `'claim+=0.45'` (0.45s after), `'>-0.1'` (0.1s before the
  previous tween ends, i.e. a slight overlap).
- **Labels** (`addLabel('claim')`, `'close'`) are named moments you can retime
  without touching every number.
- **Reset block** runs at the top of every loop (`repeat: -1`), so each pass starts
  from a known state (positions, counts, timer, claimer text).
- **Timers:** each mission has its own clock object (e.g. `A` moving, `S` other)
  with `exec` and `timer` — **both count up** — tweened with `duration == seconds` +
  `ease:'none'` so they run 1:1 in real time. Moving mission's timers run `0 →
  CLOSE` then freeze; the other's run the whole loop.

## Manual control (it behaves like a video you can scrub)

The timeline is exposed via a ref, so you can drive it:

- `tl.restart()` — Replay button.
- `tl.timeScale(r)` — 0.5× / 1× / 2× speed buttons.
- Also available: `tl.pause()`, `tl.play()`, `tl.seek(2.4)`, `tl.tweenTo('close')`
  (jump to a label while authoring).

## Component library (build incrementally, only as needed)

The demo is assembled from **reusable, parameterized components** — build each once,
reuse it across the 12 animations with different data per scene.

Principles:

- **One component, many contexts.** A component takes props/content; the animation
  layer supplies scene-specific data.
- **Device-agnostic.** A component like the **mission chip is identical on tablet
  and phone** — same component, scaled by the board around it.
- **Types share a base.** Mission types — **Checklist, Media, Test, Survey, …** —
  are the *same* card with different contained information, not separate components.

**Built:** MissionChip (`components/MissionChip.jsx`); Tablet / Phone boards
(`TabletMissions`, `PhoneMissions`, `AnimatedMissions`); **Opened mission**
(`components/OpenedMission.jsx`) — the phone "Mission Details" detail view, one
shell that renders **all six types** (Task, Checklist, Media, Survey, Test, Audit)
from a data object. Reuses the phone bezel (`.ph-fit`/`.ph-phone`/`.ph-screen`)
and the shared timer pill/exec (`.chip-*`), so timers behave exactly like the board
chips (green pill, counts up in real time; `showExec` only when claimed). Body is
assembled from reusable primitives — collapsible group, numeric checklist item,
Yes/No/N-A option box, multi-select / single-choice rows, media-playlist row, test
section — so new mission variants are data, not new components. Preview at
`/missions`. Sample data: `lib/openedMissions.js`.

**To build (later, as needed — do not pre-build):**

- **Opened-mission secondary states** (animation beats layered on the shell):
  number-pad entry, correct-vs-answer states for Test, the "Personal Missions
  Assigned" confirm modal. (The **in-app camera is built** for the Improved
  Quality demo — `CaptureCamera` in `components/ImprovedQualityPanels.jsx`, an
  "Add Photo" / "Add Video" screen with no gallery button, since proof is captured
  live inside the mission, never picked from the device.) (The **content viewer /
  video player is built** — `components/MediaViewer.jsx`, a `.mv-*` full-screen
  player that takes over the phone as a second overlay layer; see `PhoneShell`'s
  `viewer` prop and `PostedMissionsScene` Act 4.)
- Everything else that used to be listed here (library, overview / timeline,
  marketplace, reports, gallery view, tickets, ticket board, media proof, test
  results, survey capture) is **built** — see *Software simulator*, *Web app* and
  *AI demo call* below. Still to build: the number-pad entry animation beat and
  the "Personal Missions Assigned" confirm modal.

## Software simulator (`/phone`, `components/sim/`)

The interactive product on a phone and the team's shared tablet, recreated from
the recorded sales demo. **One store backs both devices**
(`lib/sim/store.mjs` + `useSyncExternalStore`), so claim on the phone and the
tablet's Claimed column updates — "whatever happens on this phone happens on the
tablet". Seed data: `lib/sim/data.mjs` (restaurant unit L001 with Team A,
Kitchen, Register, Food Preparation…; factory unit P001 with QC Line
Inspections; the personal board; Maintenance / HR / QC ticket boards).

- `SimDevice` — screens (home dashboard, unit grid/list, ticket boards, board),
  Mission Details (reuses `OpenedMission` via its new `body` / `closable` props),
  personal code, board menu (`BoardMenu`'s new `onAction`), On-Demand requests,
  tablet column expand (scoreboard view), day badges and boosted cards on
  `MissionChip` (`days`, `chip--boosted`), ticket chips, live toasts.
- `SimMissionBody` — interactive question types: Yes/No(/N/A) with per-answer
  photo/video proof and ticket triggers, numeric entries with photo and range
  flags, text, Pass/Fail, embedded lessons, media playlists, tests.
- `SimLayers` — in-app camera (no gallery), lesson player (skip to quiz; fail →
  back to the lesson), photo/video viewer, Media Proofs feed, Rate panel,
  Knowledge Base, Test Completed.
- Automations run on Close (store): an answer with `ticketOn` raises a ticket
  carrying the question, answer, evidence and performer; a failed Test assigns
  the missed topics (Media) to the personal board. Tests: `lib/sim/store.test.mjs`.
- `remote = { id, cmd, … }` drives a device (open / claim / answer / capture /
  close / translate / board / expand …) — used by the AI demo call.
- Timer rules still hold: pills are green unless a mission opts into `aging`
  (as in Mission Settings → Timer Settings); closed snaps gray.
- Units live in the store (`state.units`, `state.industry`): `loadPack()` adds
  an industry's unit, boards (with their own On-Demand `requests`) and missions
  on top of the seed data (see *Your industry* below). Tests:
  `lib/sim/packs.test.mjs`.

## Web app (`/running`, `components/web/`)

`WebApp` routes the top nav: **Overview** (`OverviewWorkspace` — now with
Response / Info / Content drawer tabs, a photo lightbox, and schedule frequency
Once / Time period / At Specific Times), **Missions** (Library with folders,
Create Mission, the mission builder with live phone preview, content/step
builder, Mission Settings; In Teams, As Tickets, Within Processes with the flow
canvas, Within Courses, Marketplace catalogs and bundles), **Reports** (All
Reports → report with summary sidebar, Group by, Closed % bars, drill-down to
every answer, Gallery View) and **Dashboards** (Reference with flagged values,
Aging, Execution, scoreboards). `?section=` keeps the section in the URL.
`embedded` + `remote` let the AI demo drive it inside a scaled window. Data:
`lib/web/data.mjs`. Styles: `components/web/web.css` (`.wa-*`).

## AI demo call (`/demo-ai`, `components/demo-ai/`)

A video-call page where **Mav**, an AI product specialist, talks with the
visitor and shares its screen (`DemoStage`: web window + phone + shared tablet,
GSAP layouts devices / phone / tablet / web / all, an AI cursor that clicks).
Pipeline: speech recognition (`listener.js`: ElevenLabs Scribe v2 Realtime
over a WebSocket with a single-use token from `/api/demo-ai/stt-token`, mic
with echo cancellation; Web Speech API and record-then-transcribe as
fallbacks) → `/api/demo-ai/chat` (Gemini `gemini-3.5-flash`, streamed, with
`DemoStage.describe()` — the live contents of every screen) → `createSegmenter`
(`lib/demoAi/commands.mjs`: sentences + `[[commands]]`) → `VoiceQueue`
(`voice.js`: ElevenLabs `eleven_flash_v2_5` via `/api/demo-ai/tts`, commands
run in sync). Talking over Mav interrupts it.

The cursor is Mav's hand (`DemoStage` + `pointing.js`): while a sentence
plays it glides to each on-screen thing the sentence names (mission titles,
columns, "the timer", "History"…), timed to the word in the audio, first
uncovering it if a drawer / expanded column / other phone tab hides it.
Commands click the real elements in order (Back → Home → Tickets → board;
tab → card; Reports → report → Group by); mission actions go to the device
that has the mission open, and "open" follows the device named in the
sentence. Every action is logged in the call's chat transcript.
What Mav knows and the command vocabulary: `lib/demoAi/prompt.mjs`. Env:
`GEMINI_API_KEY` (required), `ELEVENLABS_API_KEY`, optional `GEMINI_MODEL`,
`DEMO_AI_VOICE_ID`, `DEMO_AI_TTS_MODEL`, `DEMO_AI_STT_MODEL`.

**Fully visible before pointing (RULE).** Mav only rings / clicks what the
visitor can see *entirely*. `pointing.js` `reach()` counts an element as shown
only when all of it is inside every clipping box up to the stage (and nothing
covers it); a mission further down a list is still pointable because the list
can scroll to it. `DemoStage` `reveal()` scrolls that list — the phone's card
list, a tablet column, a web table — until the whole element is in view (above
the caption bar when there's room; otherwise the captions fade while the ring
is on), then points. Lists scroll on their own like the app (header, tabs and
column titles stay put: `.sim-device--*` rules in `sim.css`); a board or tab
starts at the top, and after a claim / close / request the lists go back to
the top, where the moved mission lands.

**Guided tour** (`lib/demoAi/tour.mjs`): after the greeting Mav plays a fixed
19-chapter script that follows the recorded sales demo step by step (steps are
plain sentences with inline `[[commands]]`; `[[stage restore X]]` puts a
mission back to its seed state so a flow can run again). Talking pauses it and
keeps what was cut; Gemini answers with `tourContext()` in its instructions and
ends by offering to continue; a short "yes / sí / نعم / oui…" (`isContinue`)
resumes at once without an AI round-trip, and `[[tour continue | chapter N |
stop | start]]` lets Mav steer it. The side panel lists the chapters.

**Your industry** (`lib/sim/packs.mjs`): `[[stage industry hotel]]` sets the
app up for the visitor's industry — a unit with 3 team boards of missions
(open / claimed / closed), a ticket board for its alerts, a personal training
and On-Demand requests (`store.loadPack()`; the unit goes first on the home
dashboard and becomes CURRENT INDUSTRY in `describe()`), also shown as a
Library folder and under In Teams in the web app. Premade always wins: the
recorded demo's restaurant (L001) and factory (P001), then the reviewed packs
in `lib/sim/industryPacks.mjs` (14 industries, `findPremade` by name/alias —
generic extra words only, so "dental clinic" is not a hospital); any other
industry is generated live by `/api/demo-ai/industry` (Gemini structured
output, `PACK_SCHEMA`; two staggered requests, first complete wins; cleaned by
`cleanPack`, cached per server) while a "Setting up…" card shows. When it's on
screen the stage calls `onIndustry` and Mav gets a hidden "screen update" turn
(in the visitor's language) to present it with the real mission names.
`[[stage mission board=…; type=…; title=…; items=…]]` posts one new mission
live (items: plain = Yes/No, `!No` = alert ticket, `# label (unit) min-max`,
`photo:`, `text:`, `pass:`). Regenerate / add premade packs:
`node scripts/generate-industry-packs.mjs [ids…] [--force]`, then review.

## Demo animation vocabulary

The 12 animations are code-accurate demos of the real product. Motion techniques we
compose from:

- **Zoom in** — push into a region or element.
- **Pop up** — an element scales / fades into place.
- **Circle / highlight** — draw attention to a spot (ring, spotlight, outline).
- **Moving** — objects travel between places (e.g. a mission Open → Claimed → Closed).
- **"Things working"** — live activity: timers ticking, counts updating, items
  checking off, proof arriving, etc.

### Web films

`/improved-quality-demo` and `/live-oversight-demo` share one engine (stage,
camera layer, captions, press rings, `MOTION`). Web pages sit in a
`.iq-report-window` (1600x760 page at 0.9 scale) with the words centered below
it. Reuse the product's web UI rather than inventing screens:

- **Overview** — `components/OverviewScene.jsx`: the `/running` workspace's
  markup and `ow-*` styles, frame-driven (Running / History, mission sidebar
  with proofs and measurements).
- **Reports** — `components/UsageReport.jsx` (Usage Report: Group by menu,
  Gallery View with photo / video rows, grouped `ReportTree`) and
  `components/DataReport.jsx` (Data Board: risk summary, unit → person →
  mission, checkpoint table with flagged out-of-range responses). Group by and
  Gallery View live in **reports**, not in the Overview.
- Data and photos: `lib/businessProofs.mjs`, `lib/liveOversightData.mjs`
  (`npm run fetch:proofs` self-hosts the CC0 photos).

### Pacing (RULE)

Reference implementation: `lib/improvedQualityStory.mjs` (the Improved Quality
demo); its tests enforce these rules.

1. **Words first, then action.** Each chapter: the scene settles (a device
   enters or the camera moves), the words type out completely, and only then do
   the actions run — one at a time. Never tap, scroll or capture while the words
   are still typing. (A chapter may deliberately open with its action when the
   script says so, e.g. "words pop in as the menu is open".)
2. **One motion vocabulary.** All transitions share the same durations
   (`MOTION`): device out .45s, device in .8s, camera .9s, screen slide in .5s /
   out .4s, menu pop .4s, press ring leads its press by .6s, and what a press
   opens follows .35s later (once the ring has faded); presses on one screen are
   .7s apart; every tour scroll is 4.5s. Derive beat times from these — don't
   hand-tune one-off durations.
3. **No idle tails.** After a chapter's last beat, hold about a second (enough
   to read), then move on. No long pauses after an animation.
4. **Fade-outs keep their screen.** A device that fades out keeps its last
   state until it is gone — never let it swap to a different UI (e.g. snap back
   to the board) mid-fade.
5. **Cuts only on an empty frame.** The camera may cut only while nothing is
   visible; otherwise it moves.

## Scenes (hero animations)

Each animation is a **scene** in `components/scenes/`, a self-contained GSAP
component that fills the hero frame and loops. Structure: a fixed **1280×720**
(16:9) `.scene` stage scaled to the frame via a container-query transform
(`.scene-fit` → `transform: scale(calc(100cqw / 1280px))`), composing existing
components (device shells, `MissionChip`) on a backdrop.

- **Backdrop:** black with slow **moving dots** — `.dots-bg` (two tiled
  radial-gradient layers translating by exactly one tile → seamless loop).
- **Wiring:** a chapter opts into a scene with a `scene` key in `lib/chapters.js`,
  resolved through the `SCENES` registry in `HeroVideo`, which renders the scene
  instead of a `<video>`. First scene: `PostedMissionsScene` (Chapter 1) — 4
  missions pop into the phone's Open board, reward points pop up, caption fades in.
- **Reuse the shells:** `PhoneShell` (chrome) + `MissionChip` (card) so scenes stay
  device-accurate without duplicating markup.

### Lower-third caption (RULE)

Narration under a scene uses the **`.lower-third`** class: **34px Inter Medium
(weight 500)**, white, centered horizontally, positioned in the **lower third**
(near the bottom). Reuse it for every scene's caption.

### On-screen text — titles & taglines (RULE)

Some narration is **animated *inside* the scene** (a title / tagline that reads
like part of the product film) rather than shown as a lower-third caption. When
text lives on the screen this way, it MUST follow these rules — the intro of
`PostedMissionsScene` (`.scene-intro`, centered on the dots backdrop) is the
reference implementation:

1. **Whole lines, centered — never left-to-right.** Each line animates in and out
   as one unit (fade + a small vertical rise). **Do not type it out, wipe it, or
   reveal it character-by-character / left-to-right.** The text is centered and
   grows from the middle, so it never "reads across" the frame.
2. **Capital first word, always.** The first word of every sentence/phrase starts
   with a capital letter (e.g. **T**askmaverick, **A**utomatically, **N**o need).
   A continuation line that is grammatically part of the previous line stays
   lowercase (e.g. "…Teams" → next line "to take initiatives…").
3. **Break only where the line makes sense on its own.** A line break must fall at
   a point where the line reads as a complete, sensible thought — **never split a
   phrase mid-thought.**

   ✅ `Automatically guides Teams` / `to take initiatives on their own`
   ❌ `Automatically guides Teams to` / `take initiatives on their own`

4. **Group related lines into verses, stacked in one block.** Verses share a
   single centered column with a **space between them**. Reveal them in sequence
   and keep earlier verses on screen — don't swap them out: **verse 1 fades in
   centered on its own → wait a beat → the block rises as verse 2 fades in
   below it**, so the pair ends up centered. (Impl: reserve verse 2's slot with
   `visibility` from the start, offset the block down by half of (verse 2 height +
   gap) so verse 1 reads centered, then tween that offset to 0 as verse 2 appears.)
5. Style: `.scene-intro` — **Montserrat**, white, centered; brand line heavier /
   larger (`.scene-intro-brand`), tagline lines lighter. It is *not* a caption, so
   it does **not** use `.lower-third` / `.scene-subtitle`.

## Extending

- **More missions / people:** add more "actor" cards, each with its own sub-timeline;
  offset their start times so claims happen in parallel.
- **True data-driven reflow** (real cards rearranging, not scripted actors): switch to
  GSAP's **Flip** plugin — snapshot layout, change React state, `Flip.from(state)`.
- **New columns/statuses:** add an X constant and extend the lifecycle path.
