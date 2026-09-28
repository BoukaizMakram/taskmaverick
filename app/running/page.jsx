import { notFound } from 'next/navigation';

import RunningLab from '@/components/RunningLab';
import WebApp from '@/components/web/WebApp';

export const metadata = {
  title: 'Overview — Taskmaverick',
};

export default async function RunningPage({ searchParams }) {
  // ── FOR BAKING LATER — dev-only, not part of the public site ─────────────
  // The web app replica (Overview, Missions, Reports, Dashboards — see
  // components/web/WebApp.jsx); ?preview=1 opens the Running animation lab.
  // Prototype used to author/preview the desktop Team Board · Running scene
  // (Figma "Frame 1 - video 61"). Hidden (404) in production so it never ships
  // or shows up in an audit; still reachable in `npm run dev`.
  if (process.env.NODE_ENV === 'production') notFound();

  const query = await searchParams;
  if (query.preview !== '1') return <WebApp />;

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
