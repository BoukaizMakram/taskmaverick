# Taskmaverick · Website 2

A clean, single-screen landing page: a video on the left and a 7-chapter
"video sections" list on the right. Built with **Next.js (App Router)** and
**GSAP** for the intro + ambient animation. No database, no backend.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

Production build:

```bash
npm run build
npm start
```

## Add your video

1. Drop the file into `public/videos/` (e.g. `overview.mp4`).
2. Open `lib/chapters.js` and set:
   ```js
   export const VIDEO_SRC = '/videos/overview.mp4';
   // optional still frame:
   export const VIDEO_POSTER = '/videos/poster.jpg';
   ```

Until a source is set, the left side shows a play placeholder.

## Edit the chapters

Everything lives in `lib/chapters.js`. Change the titles, minutes, and the
`start` (seconds into the video). Clicking a chapter seeks the player to its
start time and marks it active.

```js
export const CHAPTERS = [
  { id: 1, title: 'Section 1', minutes: 5, start: 0 },
  // ...
];
```

## Where things are

| File | Purpose |
| --- | --- |
| `app/page.jsx` | Composes the page + the GSAP intro/ambient timeline |
| `app/layout.jsx` | Fonts (Poppins + Inter) and metadata |
| `app/globals.css` | All styling |
| `components/Navbar.jsx` | Top bar: logo, Book Demo, menu |
| `components/HeroVideo.jsx` | Left: animated rings + video / placeholder |
| `components/Chapters.jsx` | Right: the sections list |
| `lib/chapters.js` | Content + video config (edit this) |

Respects `prefers-reduced-motion`.
