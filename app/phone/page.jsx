import { notFound } from 'next/navigation';

import PhoneMissions from '@/components/PhoneMissions';

export const metadata = {
  title: 'Phone — Personal Board',
};

export default function PhonePage() {
  // ── FOR BAKING LATER — dev-only, not part of the public site ─────────────
  // Prototype used to author/preview the phone personal-board animations. Hidden
  // (404) in production so it never ships or shows up in an audit; still
  // reachable in `npm run dev` while the animations are being baked.
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
      <div style={{ width: 'min(401px, 100%)' }}>
        <PhoneMissions />
      </div>
    </main>
  );
}
