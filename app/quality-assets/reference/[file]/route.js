import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  const { file } = await params;
  if (process.env.NODE_ENV === 'production' || !/^(mobile|tablet)-[a-z-]+\.png$/.test(file)) return new Response('Not found', { status: 404 });
  try {
    const bytes = await readFile(path.join(process.cwd(), 'assets/quality-references', file));
    return new Response(bytes, { headers: { 'Content-Type':'image/png', 'Cache-Control':'no-store' } });
  } catch { return new Response('Not found', { status:404 }); }
}
