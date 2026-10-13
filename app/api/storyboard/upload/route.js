import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { IMAGE_TYPES } from '@/lib/storyboardImages.mjs';

// A picture pasted or dropped on the Storyboard (/storyboard): saved as
// public/storyboard/uploads/<hash>.<ext> (the same picture twice is one file) and
// answered with its URL. Local development only, like /api/storyboard: in
// production the page keeps small pictures inside the frame instead.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const DIR = path.join(process.cwd(), 'public', 'storyboard', 'uploads');
const MAX = 12 * 1024 * 1024;

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Upload must come from this site.' }, { status: 403 });
  const extension = IMAGE_TYPES[(request.headers.get('content-type') || '').split(';')[0].trim()];
  if (!extension) return Response.json({ error: 'Only PNG, JPEG, WebP, GIF or AVIF pictures.' }, { status: 415 });
  try {
    const bytes = Buffer.from(await request.arrayBuffer());
    if (!bytes.length || bytes.length > MAX) return Response.json({ error: 'The picture is empty or over 12 MB.' }, { status: 413 });
    const name = `${createHash('sha1').update(bytes).digest('hex').slice(0, 20)}.${extension}`;
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, name), bytes);
    return Response.json({ url: `/storyboard/uploads/${name}` });
  } catch { return Response.json({ error: 'Could not save the picture.' }, { status: 500 }); }
}
