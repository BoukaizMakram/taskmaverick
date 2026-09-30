import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Ratings and notes from the Assets Library (/assets-library), saved to
// content/assets-library.json so they can be read to edit the animations.
// Local development only (like /api/demo-text): production has no writable
// source tree, so the page keeps its edits in the browser there.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const FILE = path.join(process.cwd(), 'content', 'assets-library.json');
const EMPTY = { version: 1, reviews: {} };

function validate(body) {
  const reviews = body?.reviews;
  if (!reviews || typeof reviews !== 'object' || Array.isArray(reviews)) throw new Error('Expected { reviews }.');
  const clean = {};
  for (const [id, review] of Object.entries(reviews)) {
    if (typeof id !== 'string' || id.length > 200 || !review || typeof review !== 'object') throw new Error(`Bad review ${id}.`);
    const rating = review.rating == null ? null : Number(review.rating);
    if (rating != null && !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) throw new Error(`Rating for ${id} must be 1-5.`);
    const notes = String(review.notes ?? '');
    if (notes.length > 20000) throw new Error(`Notes for ${id} are too long.`);
    if (rating == null && !notes.trim()) continue;
    clean[id] = { rating, notes, updatedAt: String(review.updatedAt ?? new Date().toISOString()) };
  }
  return { version: 1, reviews: clean };
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  try {
    const raw = await fs.readFile(FILE, 'utf8').catch(error => error.code === 'ENOENT' ? JSON.stringify(EMPTY) : Promise.reject(error));
    return Response.json(JSON.parse(raw), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Could not read the saved reviews.' }, { status: 500 }); }
}

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Save must come from this site.' }, { status: 403 });
  let data;
  try {
    const raw = await request.text();
    if (raw.length > 1000000) throw new Error('Too large.');
    data = validate(JSON.parse(raw));
  } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
  const temporary = `${FILE}.${randomUUID()}.tmp`;
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(temporary, JSON.stringify(data, null, 2) + '\n', 'utf8');
    await fs.rename(temporary, FILE);
    return Response.json({ saved: Object.keys(data.reviews).length });
  } catch { return Response.json({ error: 'Save failed.' }, { status: 500 }); }
  finally { await fs.unlink(temporary).catch(() => {}); }
}
