// Saves an uploaded file (e.g. a cover video) to /public/uploads (git-ignored)
// and returns its public URL. Local-only; used by the admin dashboard.

import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Files land in /public and are served same-origin, so only allow inert media
// extensions — never .html/.svg/.js etc., which would execute on our own origin.
const ALLOWED_EXT = new Set([
  '.mp4', '.webm', '.mov', '.m4v', '.ogg',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif',
]);
const MAX_BYTES = 512 * 1024 * 1024; // 512 MB cap (cover videos can be large)

// Dev-only editor upload; no auth, so it must never be reachable in production.
const PROD = process.env.NODE_ENV === 'production';

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
  if (PROD) return new Response(null, { status: 404 });

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

  // Only accept an allow-listed media extension — reject anything executable.
  const ext = path.extname(String(file.name || '')).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return Response.json({ error: 'Unsupported file type' }, { status: 415 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    return Response.json({ error: 'File too large or empty' }, { status: 413 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Prefix with the incoming size so repeated uploads of the same name don't clash.
  const name = `${buf.length}-${safeName(file.name)}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);

  return Response.json({ url: `/uploads/${name}` });
}
