import { notFound } from 'next/navigation';

import OverviewLab from '@/components/OverviewLab';

export const metadata = {
  title: 'Overview — Running board (Frame 47185 recreation)',
};

export default function OverviewPage() {
  // ── FOR BAKING LATER — dev-only, not part of the public site ─────────────
  // Prototype used to author/preview the Overview "Running" board (Figma Frame
  // 47185). Hidden (404) in production so it never ships or shows up in an
  // audit; still reachable in `npm run dev` while the animation is being baked.
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
      <div style={{ width: 'min(900px, 100%)' }}>
        <OverviewLab />
      </div>
    </main>
  );
}
