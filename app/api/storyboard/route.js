import path from 'node:path';
import { storyboardStore, videoOf } from '@/lib/storyboardStore.mjs';

// What you change in the Storyboard (/storyboard): the notes under the frames,
// assets you moved, words you retyped. Saved to content/storyboard/<video>.json
// so it can be read to rebuild the video. Local development only (like
// /api/video-library): production has no writable source tree, so the page keeps
// the changes in the browser there. The Trash (frames deleted from the boards, see
// lib/storyboardTrash.mjs) is a board like the others: content/storyboard/trash.json.
// Each save bumps the file's `rev`: a save made from an older one is refused (409,
// with what the file holds now) so nothing edited meanwhile (the command line,
// scripts/storyboard.mjs; another tab) is lost; the page merges and saves again.
// Backups: lib/storyboardStore.mjs and /api/storyboard/backups.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const store = storyboardStore(path.join(process.cwd(), 'content', 'storyboard'));

// ?video=<id>: { edits, rev }. With &rev=<n>: { same: true } when the file is still at n.
export async function GET(request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  const params = new URL(request.url).searchParams, video = videoOf(params.get('video'));
  if (!video) return Response.json({ error: 'Unknown video.' }, { status: 400 });
  try {
    const { edits, rev } = await store.read(video);
    if (params.has('rev') && Number(params.get('rev')) === rev) return Response.json({ same: true, rev }, { headers: { 'Cache-Control': 'no-store' } });
    return Response.json({ edits, rev }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Could not read the saved changes.' }, { status: 500 }); }
}

// { video, edits, rev?, reason? ('save' | 'import' | 'restore') } -> { saved, rev } or 409 { conflict, edits, rev }
export async function POST(request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Save must come from this site.' }, { status: 403 });
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 16000000) throw new Error('Too large.');
    body = JSON.parse(raw);
    if (!videoOf(body.video)) throw new Error('Unknown video.');
  } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
  try {
    const reason = ['import', 'restore'].includes(body.reason) ? body.reason : 'save';
    const done = await store.write(videoOf(body.video), body.edits, { rev: Number.isInteger(body.rev) ? body.rev : null, reason });
    if (done.conflict) return Response.json({ conflict: true, edits: done.edits, rev: done.rev }, { status: 409 });
    return Response.json({ saved: Object.keys(done.edits.frames).length, rev: done.rev });
  } catch { return Response.json({ error: 'Save failed.' }, { status: 500 }); }
}
