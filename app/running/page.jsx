import { notFound } from 'next/navigation';

import RunningLab from '@/components/RunningLab';

export const metadata = {
  title: 'Running board — Team Board · Overview (Frame 1 - video 61 recreation)',
};

export default function RunningPage() {
  // ── FOR BAKING LATER — dev-only, not part of the public site ─────────────
  // Prototype used to author/preview the desktop Team Board · Running scene
  // (Figma "Frame 1 - video 61"). Hidden (404) in production so it never ships
  // or shows up in an audit; still reachable in `npm run dev`.
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#eef1f5',
      }}
    >
      <div style={{ width: 'min(1720px, 100%)' }}>
        <RunningLab />
      </div>
    </main>
  );
}
