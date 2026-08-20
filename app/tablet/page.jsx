import { notFound } from 'next/navigation';

import AnimatedMissions from '@/components/AnimatedMissions';

export const metadata = {
  title: 'Tablet — Missions (animation prototype)',
};

export default function TabletPage() {
  // ── FOR BAKING LATER — dev-only, not part of the public site ─────────────
  // Prototype used to author/preview the tablet mission-board animations. It is
  // hidden (404) in production so it never ships as a real page or shows up in
  // an audit, but stays reachable in `npm run dev` while the animations are
  // still being baked.
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 20px',
        background: '#eef1f5',
      }}
    >
      <div style={{ width: 'min(1174px, 100%)' }}>
        <AnimatedMissions />
      </div>
    </main>
  );
}
