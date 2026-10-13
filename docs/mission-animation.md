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

## Storyboard (`/storyboard`)

The videos as a board of frames to plan on, built like Figma on a dark canvas
(`#1e1e1e`, laid out like the reference board): each frame a 1600×900 picture of the
video with its **number on a navy bar above** (each row counts from 1) and a **notes box below**, one row per
chapter with its name on a green label at the left; a few floating controls and, at the right, a
sidebar like Figma's design panel (what is picked: its position, size, look, text). `?video=improved-quality-v2` or
`increased-efficiency-v2` picks the video. **Editing it for the user, its lines, export / import
and backups: `docs/storyboard.md`.**

- **One frame per action** (`lib/storyboardFrames.mjs`, from each chapter's beats):
  a chapter that shows something: scene in → the outline → **the bubble with no words**
  (it has no tail) → **the words** → end of the chapter; a chapter where the hand acts with
  nothing on screen (words first): scene in → **the bubble with no words** → **the words** →
  **the hand coming out, the tail halfway** → **the tail and the hand on the target** (kind
  `hand`, so the storyboard's edits keep pointing at it) → **it clicks**, the tail still
  out → **the tail fading out** (about two thirds still showing) → what the click did → the
  next clicks (the hand on it, the click, what it did) → end; a chapter that goes on with the
  hand of the one before: scene in (the hand where it was) → **the hand on its new target**
  → **the tail out of the hand, alone** → **the bubble with no words** → **the words** → the
  click → the tail fading → what it did → end. A
  captured bubble keeps how far its tail reaches (`reach`) and how much of it shows
  (`tailOpacity`), so the board draws those two frames as the video does (plus a frame
  in the middle of any quiet stretch over 2.6 s). **No duplicates (the user,
  2026-10-05):** the capture compares each frame with the last one kept in its chapter
  *without the hand and its ripple*: same words (digits aside: timers tick) and under
  0.4% of a 160-px-wide picture different beyond 2 px of movement = the same frame, and
  only the more telling of the two stays (a click over the hand arriving on it, what a
  click did over the end of the chapter). So a frame where only the cursor moved, or an
  animation that is all but done, is not a frame. Scene in, the outline, the tail, the
  empty bubble, the words, the hand coming out and the tail fading always stay, and so
  does any frame the storyboard's edits point at. Pictures no frame uses are deleted.
  Frames are states, not clock ticks.
- **Making the frames:** `npm run gen:storyboard -- [--video id] [--only chapter,chapter]`
  with the site running. It scrubs each demo's player to every frame's time and takes the
  stage apart into layers (tablet, mission, hand, circle, chat bubble…) as the demo's own
  HTML (so they look exactly like the video), into `public/storyboard/<video>.json`
  and thumbnails in `public/storyboard/<video>/`. Run it again after the video changes.
- **Editing** (the font never changes): drag an asset or use the arrow keys
  (Shift = 10) or the X / Y boxes; double-click goes one level into a group
  (Ctrl/⌘+click picks the deepest); double-click on **any text** retypes it: the bubble's
  words, a text on its own, or a text beside an icon in the same element (kept as `key#n`,
  the n-th child node; the icon stays). It reaches text under the demo's clear overlays (the
  shade over the tablet) but not through what covers it (`editTargetAt` in
  `components/storyboardDom.js`). **Tab** goes to the next text of the asset (Shift+Tab the one
  before), like the cells of a table; Enter keeps, Esc drops. **Shift+click** picks several
  assets of a frame (drag or the arrows move them together, Delete takes them out). The chat bubble is
  drawn by the storyboard itself (`lib/storyboardBubble.mjs`) so it grows with its words
  and keeps its tail on the same spot when moved (drag the dot to move where the tail points).
  Notes, moves and retyped words are kept per frame in `content/storyboard/<video>.json`
  (through `/api/storyboard` in local development, and in this browser), apart from the frames.
- **Adding frames:** hover the gap between two frames (or past the last frame of a row) and a **+**
  appears on a blue line; clicking it adds a **blank frame** there (white, numbered, with its own
  notes box; Shift+A fills it with UI). Blank frames, like duplicates, are kept in
  `copies` of the edits file (`from: null`) and can be deleted.
- **Reordering and motion:** hold a frame's number bar (or its empty background) and drag: the
  frame lifts and follows the pointer, a dashed slot and the other frames show where it would
  land (they slide apart to make room), the board scrolls when the pointer is at an edge, and
  letting go puts it straight in its place; Esc puts it back. **The frame held never animates**
  (no transition while it is carried or when it lands: only the others slide). It can go to
  another row. Numbers always
  count 1.. along their row, and a frame's note, moved assets and retyped words are kept by its id,
  so they travel with it. The order is kept per row in `rows` of the edits file (`moveFrame` /
  `orderedFrames` in `lib/storyboardEdits.mjs`, `dropTarget` in `lib/storyboardView.mjs`).
  Frames glide (CSS transitions on `left` / `top`) whenever something is added, moved or removed,
  and a new frame pops in (`.is-new`).
- **Scale:** the selected asset has handles. A **UI element always keeps its proportions** (four
  corner handles, CSS `scale`, kept in `scales`); the **chat bubble and the spotlight stretch any
  way** (side handles too; Shift keeps the proportions); a **picture or a drawing** keeps its
  proportions unless Shift is held. Boxes (pictures, drawings, the spotlight, the chat bubble) get
  a new width and height (`sizes`) so nothing in them is distorted; the opposite corner stays where
  it was. **A chat bubble's words are never scaled**: its handles resize its yellow box, the words
  stay their size in the middle (`bubbleBoxOf`; the box is never smaller than its words).
  **Its tail is turned off by dragging its dot inside the box** (a point inside the bubble makes no
  tail, `tailShape`). A tail that is off stays off: the dot goes along when the box is moved,
  nudged or resized (`tailOff`), and the tail only comes back when the dot is dragged out of the
  box. A tail that is on keeps pointing at its spot when the box moves.
- **Pencil (P):** drag on a frame to draw; the stroke becomes an asset of that frame
  (`lib/storyboardDraw.mjs`: a box holding an SVG path, picked by its line only) that is moved,
  scaled, copied and deleted like the others. Its color and width are in the inspector: a **color
  wheel** (hue around, saturation from the middle, a brightness slider, ready colors, hex) and a
  width slider; **Alt+click with the pencil picks the color under the pointer** (`colorAt`: the
  text's color, a picture's pixel, a shape's stroke or fill, else the first background that
  shows). A drawing picked with the Move tool has the same wheel to recolor it. "Put asset back" takes the
  move and the scale off (`resizeKind` in `components/storyboardDom.js`).
- **Pictures:** paste one from the clipboard (Ctrl/⌘+V) or drop image files on a frame (it lands
  where it is dropped). The file is saved by `/api/storyboard/upload` to
  `public/storyboard/uploads/<hash>.<ext>` (local development; elsewhere a small picture is kept
  inside the frame) and the frame gets an asset for it (`lib/storyboardImages.mjs`).
- **Duplicates are linked along a line:** the same asset shown in several frames of one row (the
  captured asset with the same key, its copies made by paste or Alt+drag, everything in a
  duplicated frame) is one thing: **retyping its words in one frame retypes them in the others**
  that still say the same (`lib/storyboardLinks.mjs`; one undo step). **Right-click > Make unique**
  takes an asset out (`unique` in its frame's record); the menu also links it again. Moves and
  scale are never shared. **A chat bubble is always unique** (never linked: its words are its own
  in every frame).
- **Alt+drag** pulls a duplicate out of an asset (the whole asset; several if several are picked):
  **the original does not move; the copy follows the pointer** (a stage of its own drawn over the
  board, `.sb-ghost`, so it shows across frames) and is dropped in its own frame or on another one,
  where the pointer lets go.
- **Copy and paste (Ctrl/⌘ + C, X, V):** the picked assets, or with no asset picked the picked
  frames (Shift+click or a rectangle), are copied with their own HTML and their changes
  (`lib/storyboardClipboard.mjs`, kept in memory and in the browser's storage), so they paste on
  any frame of **any board** (the other video's too, or another tab). An asset pasted into the
  frame it came from lands 24px down and right, elsewhere in the same place; a captured asset is
  put back inside its own stage's classes so it looks the same anywhere. Frames pasted on their
  own board are duplicates right after the selected frame; on another board they arrive as blank
  frames holding all their assets and their note.
- **Duplicating and bringing things in:** Ctrl/⌘+D duplicates the selected frame (a copy right
  after it, with the same moves and words but an empty note; the frame inspector has the same
  button). Delete takes an asset out of a frame (Reset frame brings it back) or **deletes the
  frame, any frame, into the Trash** (next bullet). **Shift+A** opens the product's **UI as a grid of
  thumbnails by category** (a search box on top; arrows move, Enter adds, Esc closes): **Missions**
  (task, checklist, media, survey, test, audit, claimed, closed, rated — drawn as on the iPad: the
  reference board's chip, 334 wide, not the phone's wider card; `IPAD_CHIP` in `StoryboardUi.jsx`), **Mission details** (the
  opened mission: task, checklist, media, survey, test, audit, entries, lesson), **Boards** (tablet,
  phone, personal, mission on a tablet), **Navigation** (home on the phone and the tablet, units,
  the tablet menu, personal code), **Screens** (knowledge base, business proofs), **Web app**
  (overview, missions, reports, dashboards, usage report) and **Annotations** (hand, speech bubble, spotlight). Always a whole piece of UI,
  never a bare text like a performer's name. Choosing one adds **only that piece** to the frame, in
  the middle, at the size it has in the product (a tablet or phone is cropped to the device), as an
  asset that can be moved, retyped and deleted; each one brought in sits above the last
  (`z-index`). Where the pieces come from: the real components are laid out on `/storyboard-ui`
  (dev-only, `components/StoryboardUi.jsx`, the `ITEMS` list: id, category, name, width, search
  words, piece) and the web app on `/running`; `npm run gen:storyboard -- --parts` (site running)
  captures them into `public/storyboard/ui-parts.json` plus a thumbnail per piece in
  `public/storyboard/ui/<id>.jpg`. To offer a new piece: add it to `ITEMS` and re-run that. The
  hand, the speech bubble and the spotlight are made by `lib/storyboardParts.mjs`. What you
  bring in lives in `content/storyboard/<video>.json` (`inserts`, `library`, `hidden`; duplicates in
  `copies`), so it undoes and survives a new capture.
- **The Trash (`/storyboard?video=trash`, the bin at the top or "Trash" in the board menu):**
  Delete on a selected frame (or the inspector's Delete frame, or Ctrl+X) deletes **any** frame — a
  captured one is hidden (`deleted` in its board's edits), a duplicate or blank one is removed — and
  a note under the board says so, with Undo and a link to the Trash. The frame goes to the **Trash
  board**: a board like the others (rows = the video each frame came from, newest deleted first, each
  frame drawn live with the look of its video) kept in `content/storyboard/trash.json` (`trash` =
  where it came from; its assets are the inserts of `frames[id]`, like a blank frame's), so it is
  saved through the same `/api/storyboard` and in the browser (`lib/storyboardTrash.mjs`). **Copy a
  frame there (Ctrl+C) and paste it on a storyboard (Ctrl+V)**: it arrives as a new frame holding
  the same assets, moves, words and note. The Trash keeps what was deleted for as long as the delete
  stands: **undo takes the frame out of the Trash again and redo puts it back** (the history's
  states that deleted frames are remembered and the Trash is brought in line with them). In the
  Trash, Delete (or "Delete for good", or **Empty Trash**, which asks first) removes frames for
  good; adding, duplicating, resetting and pasting are off there.
- **Assets Library (`/assets-library`):** the same catalog as Shift+A as a page: every UI piece
  as a thumbnail, by category, with a search box (`/` focuses it), a category filter and a larger
  preview (arrows step, Esc closes; the address keeps `?q=`, `?category=`, `?asset=`). It reads
  `public/storyboard/ui-parts.json` on the server (`slimParts`, no HTML) and shows
  `public/storyboard/ui/<id>.jpg` (captured at up to 2x). Nothing is stored on it. Add a piece to
  `ITEMS` (see above) and re-capture, and it shows up here and in Shift+A. The animation clips are
  not here: they are in the **Video Library** (`/video-library`, `components/VideoLibrary.jsx`,
  `lib/videoLibrary.mjs`, ratings and notes in `content/video-library.json`, stills in
  `public/video-library/`), which was `/assets-library` until 2026-10-02.
- **Smooth panning:** the board and what is drawn over it (selection) are moved directly while
  you scroll or drag, and React only catches up (which frames are live, the zoom %) when the
  movement settles; `.sb-world.is-moving` lifts the board onto its own layer meanwhile.
- **Navigation like Figma:** scroll pans, Ctrl/⌘ + scroll or pinch zooms at the pointer,
  Space + drag / middle button / H pans, V is the move tool, Shift 1 fits everything, Shift 2
  the selection, Shift 0 is 100%, a rectangle on the empty board picks frames, Ctrl+Z / Ctrl+Shift+Z undo
  and redo. Double-click a frame to zoom to it. Far out, frames are pictures; the ones in view are live.

## Storytelling cuts: the hand and the speech bubble

`/improved-quality-v2` and `/increased-efficiency-v2` (CEO notes of 2026-09-28)
show one thing at a time. There are two orders, by what the chapter does:

- **Where the hand acts, the words come first (RULE, the user, 2026-10-05; replaces the
  2026-10-02 order).** In every chapter with a click, a drag or a swipe (Improved Quality:
  Knowledge Base, translate, step-by-step, micro-training, photo, video, emphasis,
  self-rating, visibility, mobile, tour, web, remote; `ACTING` in
  `lib/improvedQualityV2Story.mjs`). **With nothing on screen yet** (`WORDS_FIRST`:
  knowledge, translation, photo, emphasis, visibility, web):
  1. **the chat box pops empty**, from its own middle, already at the size of the words
     it will hold, level with what will be clicked (no tail, no hand);
  2. **the words type** into it;
  3. **the tail reaches out** of the bubble to what will be clicked, **with the hand on
     its tip**: the hand comes out of the bubble, from where the tail leaves it;
  4. **the hand clicks** (the tail still out), and what the click does starts there;
  5. **then the tail fades out** (the bubble stays, closed).
  **More clicks with the same words:** the hand stays on screen (never fades and comes
  back) and moves to the next one; the box moves with it, level with it (no tail).
  **The next chapter goes on with the hand** (other words, same screen; `GOES_ON`: steps,
  micro, rate, mobile, tour, remote; Videos is words first, the user 2026-10-05): the words before fade where they are at the
  end of their chapter (they do not follow the hand); the hand stays across the cut, moves
  to what it will click, **a new bubble comes out of the hand** (the tail, then the box,
  then the words: `middle: false`), it clicks, then the tail fades.
  Timing: `launch(say, ready)` / `relaunch(ring, ready)` → `{say, text, typed, ring,
  arrive, press, fade, open}` and `LAUNCH` in `lib/demoHand.mjs`; the chapter's first stop
  is a `launchStop` (`launch: true`) or a `carryStop` (`carry: {target, kind}` = where the
  chapter before left the hand; that chapter's last stop has `stay: true` so it does not
  fade); `launchTail(stops, e)` gives the tail's reach and opacity; `handPose` says `from:
  'bubble'` (or the carried target, with `fromSwipe` when a swipe left it up). Drawing:
  `bubbleFrame(…, {middle, tailP, tailOpacity})` (the fading tail is drawn over the closed
  bubble) returns `base`, where the tail leaves the outline, which the page hands to
  `drawHand` as `home`. A swipe presses near the list's right edge, level with where the
  tail meets it, so the words come out of the hand. A mission that has to scroll to its
  checkpoint does it before the box comes.
- **Where something is only shown there is no tail of any kind**: the yellow rectangle
  appears, the box comes on the right side of it (from its own middle: the `CLOSED`
  bubble), the words type (below). All of Increased Efficiency is only shown.

- **The hand acts, the yellow rectangle shows (RULE, 2026-10-02).** The hand is used
  only for an action: a click, a drag, a scroll. What a chapter **only shows** (an alert,
  a link, the proof block, the ratings, a timer, a mission card, the tablet, the phones)
  has **no hand at all**: a **thick yellow rounded rectangle** is drawn around it
  (`.iq2-mark` in `components/DemoHand.css`: 6px, `#ffc800`, a darker yellow than the
  bubble's so it shows on white), it appears first, then the box comes on its right (no tail).
  In code: a stop of kind `point` in `HAND_STOPS` = shown, not clicked. `marksOf(stops)`
  (`lib/demoHand.mjs`) gives the rectangles; a stop can say `mark: false` (nothing),
  `mark: 'key'` / `[keys]` (mark that instead: the whole tablet, each of two cells),
  `markAt`, `markUntil`. `drawMarks` (`components/demoHandDom.js`) places them each frame
  around the measured target. Improved Quality: instructions, alert, link, proof block,
  peer ratings, who performed, date & time. Increased Efficiency: every chapter (nothing
  there is clicked). The storyboard has an **"Outline on …" frame** for these instead of a
  hand frame. **The report is never darkened** for who performed / date & time (the user,
  2026-10-02): it stays as bright as ever, the two cells are marked.
- **The report scenes use the frame (chapters 18-21, the user, 2026-10-02).** The web report
  is shown big (`LAYOUT.report`: scale 1.02, from the left margin to the words' room, nearly
  top to bottom) instead of small in a corner; **the words stay on the right of the report**
  in all four scenes. Only a window of its width shows (`reportWindow`): its left part for
  Gallery View, the tour and who performed; for date & time the page **slides over** to its
  Date & Time column (it is not shrunk to fit). Who performed / when: a plain bubble (no
  tail) right of the report, level with the two marked cells.

- **Timing** (pure, tested): `lib/demoHand.mjs` (`tap`, `speak`, `launch`, `handPose`) and each
  story's beats. `HAND_STOPS[chapter]` lists where the hand goes and when it
  clicks; `SAY[chapter]` is when the bubble starts, `TEXT_AT[chapter]` when the
  words do (bubble + 0.3s; words first: + 0.45s, once the empty box has popped; going on with
  the hand: the bubble comes once the hand is on its target). The action (a scroll, a timer turning, the original
  claim and close) is keyed to the click, never to the words being typed.
- **Drawing:** the demo measures each target (`components/demoHandDom.js`,
  `components/captionBubbleDom.js`); the hand's fingertip is the bubble's tail tip (while
  there is a tail: it fades after the click).
  A target that has gone (Add photo once the photo is in) is found where it went.
- **Looks:** `lib/captionBubbles.mjs`: one style, the yellow message (`#ffec00`,
  black outline, the form of a chat message). There is no style picker.
- **Clips:** `/…/embed?clip=<chapter>&mode=player|preview|still` plays one chapter
  (`components/useClipSlice.js`); `/video-library` (the **Video Library**) lists every
  chapter as a building block. `npm run gen:posters` makes the stills.
- **Each clip is one thing.** A clip of a chapter starts when that chapter's own
  art has begun (`CLIP_SKIP` in each story), so it never shows a bit of another
  part — e.g. the mission clip does not open on the tablet fading out.
- **The hand presses only what is really clicked.** A `point` stop lands and
  stays still (no press, no nudge, no ripple); only `click` / `scroll` press.
  One target is enough when one makes the point (Best Performers: one name).
- **The tail never touches the text:** it stops 14 stage px past the target's
  right edge (`pointOf(key,'tail')`); a swipe presses 22 px inside that edge, level with it.
- **Words follow what the action made.** A story's `SETTLE[chapter] = [time,
  target]` glides the words (and the tail) to a new target once the action is
  done — Self-Ratings: up to the new rating when it is sent.
- **The ratings (chapters 13-14): exactly the user's drawing, in our UI (2026-10-05).**
  Each rating is our Rate box (`RateCard` in `ImprovedQualityV2Panels.jsx`: "Rate this
  mission:", the label, the slider with 1-5 under it, Submit Rate) with the **avatar** of
  who rates on its corner (`/avatars/*.png`: Anna F. 02, Ben R. 03 green, Leo T. 01
  orange); the card's rating row shows the same avatars with their score (self left, the
  peers right). Purple (`#7b3cf0`) lines, **no words on them** (the user removed the
  labels): under the card's left, a line down to the self rating; from the card's right,
  level with the peers' avatars, a line and a **bracket** with a tick into each peer's
  rating (no yellow rectangle there: the bracket points). **What is on the slide is always
  centered** (art and words as one group): the card moves as the ratings come (`ISO_AT`,
  `isoBox` in `devicesAt`). 13: centered with its words; the hand presses Rate, the self
  rating appears under it as everything glides up to stay centered; the hand drags it to
  Excellent and sends it, Anna's 5 pops onto the card and the self rating **stays**. 14:
  everything glides left to make room (`PEER.shift`), then the peers' ratings appear one
  after the other (the bracket grows down to each), each slider goes to its rating by
  itself (Great, Good), it is sent and the peer's avatar pops onto the card. The words sit
  beyond the peers' ratings. Everything but the card fades as it goes back into the tablet (15).
- **Boxed chapters (a trial, Improved Quality's instructions only):** `BOXED`
  chapters show no hand and a plain yellow box (`BOX` in `lib/captionBubbles.mjs`, no
  tail); the words come with the closed card, the card opens by itself, then
  `MARKS[chapter]` draws a glowing yellow outline around what they talk about
  (`.iq2-mark`). Where the hand acts the bubble has a tail while it brings the hand out (or
  comes out of it); what is only shown never has one.
- **The hand scrolls only when scrolling through a lot is the point** (mobile,
  tour, remote). Everywhere else the mission scrolls by itself to the checkpoint
  and the hand just clicks or points. In *Step by step* the hand answers three
  questions one after another **in one spot** (`STEP_SPOT` = 105 stage px below the chip: high enough that
  the instructions link under the chip is never seen; the user, 2026-10-06); after
  each answer the list scrolls up one question so the next Yes lands under the
  hand.
- **The mission chip stays on top.** When the opened mission scrolls, the chip
  (type, points, timer, name, performer, date) stays pinned under the back / ES
  bar and everything else scrolls beneath it; checkpoints land just below it.
