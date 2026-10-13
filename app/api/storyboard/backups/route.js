import path from 'node:path';
import { storyboardStore, videoOf } from '@/lib/storyboardStore.mjs';

// The storyboard's backups (content/storyboard/backups/<video>/, see lib/storyboardStore.mjs).
// GET ?video=<id>: { backups: [{ name, at, reason }] } newest first; with &name=<file>: { edits }.
// POST { video }: keep a backup of the file as it is now -> { name }.
// Local development only, like /api/storyboard.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const store = storyboardStore(path.join(process.cwd(), 'content', 'storyboard'));

export async function GET(request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  const params = new URL(request.url).searchParams, video = videoOf(params.get('video'));
  if (!video) return Response.json({ error: 'Unknown video.' }, { status: 400 });
  try {
    if (params.get('name')) return Response.json({ edits: await store.readBackup(video, params.get('name')) }, { headers: { 'Cache-Control': 'no-store' } });
    return Response.json({ backups: await store.backups(video) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'No such backup.' }, { status: 404 }); }
}

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Must come from this site.' }, { status: 403 });
  let video;
  try { video = videoOf((await request.json()).video); } catch {}
  if (!video) return Response.json({ error: 'Unknown video.' }, { status: 400 });
  try { return Response.json({ name: await store.backup(video, 'manual') }); }
  catch { return Response.json({ error: 'Backup failed.' }, { status: 500 }); }
}
