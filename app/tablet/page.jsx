import AnimatedMissions from '@/components/AnimatedMissions';

export const metadata = {
  title: 'Tablet — Missions (animation prototype)',
};

export default function TabletPage() {
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
