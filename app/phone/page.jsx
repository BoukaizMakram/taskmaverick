import PhoneMissions from '@/components/PhoneMissions';

export const metadata = {
  title: 'Phone — Personal Board',
};

export default function PhonePage() {
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
