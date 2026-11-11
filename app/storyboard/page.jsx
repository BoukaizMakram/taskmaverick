import {preload} from 'react-dom';
import Storyboard from '@/components/Storyboard';
import {ALL_VIDEOS} from '@/lib/storyboardAllVideos.mjs';
import {ALL_STORYBOARDS} from '@/lib/storyboardAllStoryboards.mjs';

export const metadata = {title: 'Storyboard — Taskmaverick', robots: {index: false}};

// The video as a board of frames to plan it on (see components/Storyboard.jsx).
// ?video=improved-quality-v2 picks the video; without it, All storyboards (for now the board menu shows only All videos and All storyboards: lib/storyboardAllStoryboards.mjs).
export default async function Page({searchParams}) {
  const query = await searchParams;
  const asked = Array.isArray(query.video) ? query.video[0] : query.video;
  const video = /^[a-z0-9-]{1,48}$/i.test(String(asked ?? '')) ? String(asked) : ALL_STORYBOARDS;
  if (video !== 'trash' && video !== ALL_VIDEOS) preload(`/storyboard/${video}.json`, {as: 'fetch', crossOrigin: 'anonymous'}); // (the frames come while the page's code does: the board does not wait for them after)
  return <Storyboard video={video}/>;
}
