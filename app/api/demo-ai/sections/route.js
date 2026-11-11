// POST /api/demo-ai/sections — the storyboard videos' data for an industry (lib/sections/liveData.mjs): Gemini writes the planning dashboard and the maintenance request of
// that kind of business (SECTIONS_SCHEMA), using the names of the workspace the call already set up for it, cleaned and cached per server instance.
// Body: { industry, pack? } (pack: the lib/sim/packs.mjs workspace). Env: GEMINI_API_KEY (required), GEMINI_MODEL.
// The call has the videos drawn from the workspace meanwhile (`fromPack`), so a slow or failed answer only means the videos keep those names.
import { SECTIONS_SCHEMA, sectionsPrompt, cleanSections } from '@/lib/sections/liveData.mjs';
import { cleanPack, industryKey } from '@/lib/sim/packs.mjs';
import { sameOrigin, rateLimited, jsonError } from '@/lib/demoAi/guard.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const cache = new Map();

async function generate(industry, pack, key, signal) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
  const body = thinking => JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: sectionsPrompt(industry, pack) }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SECTIONS_SCHEMA, maxOutputTokens: 3000, ...(thinking ? { thinkingConfig: { thinkingLevel: 'minimal' } } : {}) },
  });
  const call = thinking => fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: body(thinking), signal });
  let res = await call(true);
  if (res.status === 400) res = await call(false);
  if (!res.ok) { const error = new Error(`Gemini ${res.status}`); error.status = res.status; error.detail = (await res.text().catch(() => '')).slice(0, 400); throw error; }
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
  return cleanSections(JSON.parse(text), pack);
}

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Forbidden', 403);
  if (rateLimited(request, 'sections', 12)) return jsonError('Too many requests — please wait a moment.', 429);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return jsonError('GEMINI_API_KEY is not set on the server.', 503);
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON body.', 400); }
  const industry = String(body?.industry ?? '').trim().slice(0, 60);
  if (industryKey(industry).length < 2) return jsonError('Which industry?', 400);
  const pack = body?.pack ? cleanPack(body.pack) : null; // (what the page sends is made safe, like anything the AI wrote)
  const k = `${industryKey(industry)}|${pack ? `${pack.name}|${pack.teams.map(t => t.name).join(',')}` : ''}`; // (the same industry set up as another workspace has other names)
  if (cache.has(k)) return Response.json({ sections: cache.get(k), cached: true }, { headers: { 'Cache-Control': 'no-store' } });
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const sections = await generate(industry, pack, key, request.signal);
      cache.set(k, sections);
      if (cache.size > 60) cache.delete(cache.keys().next().value);
      return Response.json({ sections }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      if (request.signal.aborted) return new Response(null, { status: 499 });
      lastError = error;
      if ([400, 401, 402, 403, 404, 429].includes(error.status)) break; // (a refusal, a bad key or the key's quota (429: a retry only spends more of it) is not tried again; an overloaded model, a cut-off answer are)
      await new Promise(resolve => setTimeout(resolve, 900 * (attempt + 1)));
    }
  }
  console.error(`[demo-ai] sections "${industry}" failed (${MODEL}): ${lastError?.message} ${lastError?.detail || ''}`);
  if (process.env.NODE_ENV !== 'production') return Response.json({ error: "Couldn't write the videos' data right now.", detail: `${lastError?.message} ${lastError?.detail || ''}`.slice(0, 600) }, { status: 502 }); // (what went wrong, in development)
  return jsonError(lastError?.status === 402 ? 'The AI account is out of credits.' : "Couldn't write the videos' data right now.", 502);
}
