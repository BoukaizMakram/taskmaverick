# Mission Animation Engine

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
  number-pad entry, correct-vs-answer states for Test, photo/video capture for
  Survey, the "Personal Missions Assigned" confirm modal. (The **content viewer /
  video player is built** — `components/MediaViewer.jsx`, a `.mv-*` full-screen
  player that takes over the phone as a second overlay layer; see `PhoneShell`'s
  `viewer` prop and `PostedMissionsScene` Act 4.)
- **Library view.**
- **Overview / timeline** — history, running, timeline; for **Team Board** and
  **Personal Board**.
- **Marketplace.**
- **Reports.**
- **Gallery view.**
- **Tickets**, **Ticket board**, **Media proof**, etc.

## Demo animation vocabulary

The 12 animations are code-accurate demos of the real product. Motion techniques we
compose from:

- **Zoom in** — push into a region or element.
- **Pop up** — an element scales / fades into place.
- **Circle / highlight** — draw attention to a spot (ring, spotlight, outline).
- **Moving** — objects travel between places (e.g. a mission Open → Claimed → Closed).
- **"Things working"** — live activity: timers ticking, counts updating, items
  checking off, proof arriving, etc.

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
