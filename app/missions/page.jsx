import { OpenedMissionsGallery } from '@/components/OpenedMission';

export const metadata = {
  title: 'Phone — Opened Missions (all types)',
};

export default function MissionsPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '48px 20px 72px',
        background: '#eef1f5',
      }}
    >
      <h1
        style={{
          margin: '0 auto 8px',
          maxWidth: 1200,
          fontFamily: 'var(--font-poppins), sans-serif',
          fontWeight: 700,
          fontSize: 26,
          color: '#111',
          textAlign: 'center',
        }}
      >
        Opened Missions — all types
      </h1>
      <p
        style={{
          margin: '0 auto 40px',
          maxWidth: 640,
          color: '#64748b',
          textAlign: 'center',
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        Reusable phone “Mission Details” views (Task · Checklist · Media · Survey · Test ·
        Audit). The green timer pill ticks in real time per the timer rules.
      </p>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <OpenedMissionsGallery />
      </div>
    </main>
  );
}
