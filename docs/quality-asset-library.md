# Improved Quality asset library

Open `/quality-assets` in the existing local development server, or use `/phone` → View options → Improved Quality asset library.

The library contains 18 screen assets, each with mobile (390 × 844) and tablet (1080 × 808) previews. Select a screen, choose a state, and use **Open clean preview** for an isolated composition. Reset restores its initial demo state. The asset manifest downloads the shot mapping and source inventory as JSON.

## Reuse and scope

- `MissionChip`, its styles, the original reference board, `OpenedMission`, media training, and existing icon files are reused. No shared mission chip dimensions or icons were edited.
- New surfaces and styles are isolated under `components/quality-assets`.
- The screen inventory is in `lib/qualityAssets.js`; shot numbers follow the supplied storyboard images.
- This is an asset library, not a new video timeline. Existing demos are unchanged.

## Live references

PNG references were captured from the authenticated mobile Taskmaverick application on September 23, 2026. The library includes personal mission boards, an opened and expanded Checklist Training mission, a Coffee Machine Cleaning training list/text lesson/quiz, tablet home and team menu, and a mobile loading state. Captures preserve the original app state and captured resolution.

Local references live in `assets/quality-references/`, are ignored by Git, and are served through a development-only file route. The library, clean preview, and reference route return 404 in production. No credentials were saved in source or assets.

## Items still requiring source material

The accessible `6. Test Gia` team and the inspected Makram Team board showed zero open, claimed, and closed missions. The inspected team menu did not include Business Media. No live missions were closed, quiz answers submitted, or ratings recorded to manufacture screenshots.

The library labels new demo compositions separately from captured references. Populated self/peer ratings, translation, step guidance, evidence capture, Business Media, and gallery screens still need live references from the appropriate team/mission. In particular, the standard shelving photo and damaged-item video were not available in the inspected content.

Use **Media & icons** to select a local photo and video for the current preview session. Those files appear in checkpoint/feed/gallery assets but are not uploaded or persisted; clean-preview links do not carry session media. The existing training MP4 remains available and downloadable.

## Validation

The production build and the existing quality-demo checks pass. All 18 assets were rendered in both device layouts with no browser errors; quiz gating, three guided checkpoints, and menu-to-Business-Media navigation were exercised locally.
