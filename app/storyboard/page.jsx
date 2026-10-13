import Storyboard from '@/components/Storyboard';

export const metadata = {title: 'Storyboard — Taskmaverick', robots: {index: false}};

// The video as a board of frames to plan it on (see components/Storyboard.jsx).
// ?video=improved-quality-v2 picks the video.
export default async function Page({searchParams}) {
  const query = await searchParams;
  const asked = Array.isArray(query.video) ? query.video[0] : query.video;
  const video = /^[a-z0-9-]{1,48}$/i.test(String(asked ?? '')) ? String(asked) : 'improved-quality-v2';
  return <Storyboard video={video}/>;
}
