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
  (animation overlay), `.fs-*` (feature showcase).
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
- **To build later** (not now): library view, overview/history/running/timeline
  (Team Board + Personal Board), marketplace, reports, gallery view, tickets,
  ticket board, media proof, and opened-mission *secondary states* (content
  viewer, number-pad, Test answer states, Survey photo/video capture, confirm
  modal). Opened-mission primary views for all types are **built**.

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

- `app/` — routes (`page.jsx` landing, `tablet/`, `phone/`, `demo/`), `layout.jsx`,
  `globals.css`.
- `components/` — `Landing`, `HeroVideo`, `Chapters`, `FeatureShowcase`, mission
  components above.
- `lib/chapters.js` — landing chapters + per-chapter video/subtitle data.
- `docs/` — `mission-animation.md`.
