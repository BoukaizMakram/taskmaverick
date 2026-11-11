import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// A file put on the canvas of a board as a reference (lib/storyboardRefs.mjs): any kind, a video too, so it is
// streamed to the disk: public/storyboard/references/<hash>.<ext> (the same file twice is one file; not in git,
// they can be big) and answered with its URL. ?name=<the file's name> gives the extension. Local development
// only, like /api/storyboard.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const DIR = path.join(process.cwd(), 'public', 'storyboard', 'references');
const MAX = 4 * 1024 * 1024 * 1024;
const extensionOf = name => { const found = /\.([a-z0-9]{1,8})$/i.exec(name ?? ''); return found ? `.${found[1].toLowerCase()}` : ''; };

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin) return Response.json({ error: 'Upload must come from this site.' }, { status: 403 });
  if (!request.body) return Response.json({ error: 'The file is empty.' }, { status: 400 });
  const hash = createHash('sha1'), temporary = path.join(DIR, `${randomUUID()}.tmp`);
  let size = 0;
  try {
    await fs.mkdir(DIR, { recursive: true });
    await pipeline(Readable.fromWeb(request.body), async function* (source) {
      for await (const chunk of source) {
        size += chunk.length;
        if (size > MAX) throw new Error('over the limit');
        hash.update(chunk);
        yield chunk;
      }
    }, createWriteStream(temporary));
    if (!size) throw new Error('empty');
    const name = `${hash.digest('hex').slice(0, 20)}${extensionOf(url.searchParams.get('name'))}`;
    await fs.rename(temporary, path.join(DIR, name));
    return Response.json({ url: `/storyboard/references/${name}` });
  } catch {
    await fs.rm(temporary, { force: true }).catch(() => {});
    return Response.json({ error: size > MAX ? 'The file is over 4 GB.' : !size ? 'The file is empty.' : 'Could not save the file.' }, { status: size > MAX ? 413 : 500 });
  }
}
