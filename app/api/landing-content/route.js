// Local content "database" for the editable landing page.
//   GET  → the saved content (content/landing.local.json), or the defaults.
//   POST → overwrite the saved content with the request body (full object).
// Node runtime so we can touch the filesystem; local-only by design.

import { promises as fs } from 'fs';
import path from 'path';

import { DEFAULT_LANDING } from '@/lib/landingDefaults';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'content', 'landing.local.json');

export async function GET() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return Response.json(JSON.parse(raw));
  } catch {
    // No saved file yet → serve the defaults.
    return Response.json(DEFAULT_LANDING);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Expected a content object' }, { status: 400 });
  }
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(body, null, 2), 'utf8');
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
