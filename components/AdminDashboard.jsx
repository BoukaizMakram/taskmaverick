'use client';

// The admin page IS the landing page, rendered in edit mode: double-click any
// text to edit it in place, click a badge icon to cycle it, use the frame's
// "Video" button to upload a cover video, then Save (floating bar).

import { EditProvider, SaveBar } from '@/components/InlineEdit';
import Landing from '@/components/Landing';

export default function AdminDashboard() {
  return (
    <EditProvider>
      <SaveBar />
      <Landing />
    </EditProvider>
  );
}
