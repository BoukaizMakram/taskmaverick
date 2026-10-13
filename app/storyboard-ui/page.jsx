import {notFound} from 'next/navigation';
import StoryboardUi from '@/components/StoryboardUi';

export const metadata = {title: 'Storyboard — UI pieces', robots: {index: false}};

// The product's UI piece by piece: what scripts/capture-storyboard.mjs reads to
// make the Storyboard's Shift+A menu. Development only (like /missions).
export default async function Page({searchParams}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const query = await searchParams;
  return <StoryboardUi thumbs={query.thumbs === '1'}/>;
}
