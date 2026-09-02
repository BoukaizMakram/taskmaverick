import AdminDashboard from '@/components/AdminDashboard';

export const metadata = {
  title: 'Landing editor · Taskmaverick',
  robots: { index: false, follow: false },
};

// Local-only content editor for the landing page. Not linked from the site.
export default function AdminPage() {
  return <AdminDashboard />;
}
