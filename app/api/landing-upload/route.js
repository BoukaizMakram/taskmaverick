// Saves an uploaded file (e.g. a cover video) to /public/uploads (git-ignored)
// and returns its public URL. Local-only; used by the admin dashboard.

import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Keep a filesystem-safe, collision-resistant name without relying on Date/random
// (those are fine here, but a counter keeps it simple and predictable).
function safeName(original) {
  const base = String(original || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80);
  return base || 'file';
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart form data' }, { status: 400 });
  }
  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Prefix with the incoming size so repeated uploads of the same name don't clash.
  const name = `${buf.length}-${safeName(file.name)}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);

  return Response.json({ url: `/uploads/${name}` });
}
