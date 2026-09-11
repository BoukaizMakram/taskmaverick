import { notFound } from 'next/navigation';

import AdminDashboard from '@/components/AdminDashboard';

export const metadata = {
  title: 'Landing editor · Taskmaverick',
  robots: { index: false, follow: false },
};

// Local-only content editor for the landing page. Not linked from the site, and
// hidden (404) in production — like the other dev-only routes — so the
// unauthenticated editor + its write APIs never ship publicly.
export default function AdminPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <AdminDashboard />;
}
