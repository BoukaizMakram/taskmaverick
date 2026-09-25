import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DEMO_IDS, EMPTY_DEMO_TEXT, validateDemoText } from '@/lib/demoTextSettings.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const revision = text => createHash('sha256').update(text).digest('hex');
async function read(file) {
  try { return await fs.readFile(file, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return JSON.stringify(EMPTY_DEMO_TEXT); throw error; }
}
async function fileFor(params) {
  const {demo} = await params;
  return DEMO_IDS.includes(demo) ? path.join(process.cwd(), 'content', 'demo-text', `${demo}.json`) : null;
}
export async function GET(request, {params}) {
  if (process.env.NODE_ENV === 'production') return new Response(null, {status:404});
  const file = await fileFor(params);
  if (!file) return new Response(null, {status:404});
  try {
    const raw = await read(file);
    return Response.json({config:validateDemoText(JSON.parse(raw)), revision:revision(raw)}, {headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Could not read saved demo text.'}, {status:500}); }
}
export async function POST(request, {params}) {
  if (process.env.NODE_ENV === 'production') return new Response(null, {status:404});
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error:'Save must come from this site.'}, {status:403});
  const file = await fileFor(params);
  if (!file) return new Response(null, {status:404});
  let body, config;
  try {
    const raw = await request.text();
    if (raw.length > 1000000) throw new Error('Demo text file is too large.');
    body = JSON.parse(raw); config = validateDemoText(body.config);
  } catch (error) { return Response.json({error:error.message}, {status:400}); }
  let temporary;
  try {
    if (body.revision !== revision(await read(file))) return Response.json({error:'This demo was saved elsewhere. Export your edits, then reload before saving again.'}, {status:409});
    const raw = JSON.stringify(config, null, 2)+'\n';
    await fs.mkdir(path.dirname(file), {recursive:true});
    temporary = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, raw, 'utf8');
    await fs.rename(temporary, file);
    return Response.json({revision:revision(raw)});
  } catch { return Response.json({error:'Save failed. Your preview edits are still here; please try again or export them.'}, {status:500}); }
  finally { if (temporary) await fs.unlink(temporary).catch(()=>{}); }
}
