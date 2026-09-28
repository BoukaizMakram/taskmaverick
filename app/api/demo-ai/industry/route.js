// POST /api/demo-ai/industry — set the app up for an industry that has no
// premade workspace (lib/sim/industryPacks.mjs): Gemini writes a pack in the
// lib/sim/packs.mjs format, cleaned and cached per server instance.
// Body: { industry }. Env: GEMINI_API_KEY (required), GEMINI_MODEL.
// Structured output sometimes loops until its token cap, so a second request
// starts a few seconds after the first and the first complete pack wins.
import { generatePack, isComplete, industryKey } from '@/lib/sim/packs.mjs';
import { sameOrigin, rateLimited, jsonError } from '@/lib/demoAi/guard.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const STAGGER = 4000;
const cache = new Map();

function race(industry, key, signal) {
  const controllers = [];
  const stop = () => controllers.forEach(c => c.abort());
  signal.addEventListener('abort', stop);
  return new Promise((resolve, reject) => {
    let settled = false, failed = 0, lastError = null;
    const finish = (fn, value) => { if (settled) return; settled = true; stop(); fn(value); };
    const attempt = () => {
      if (settled || signal.aborted) return;
      const controller = new AbortController();
      controllers.push(controller);
      generatePack(industry, { key, model: MODEL, signal: controller.signal, maxTokens: 5000, missions: 4 }).then(pack => {
        if (pack === null) return finish(resolve, null); // not a kind of business
        if (isComplete(pack)) return finish(resolve, pack);
        if (++failed === 2) finish(reject, lastError || new Error('incomplete workspace'));
      }, error => { lastError = error; if (++failed === 2) finish(reject, error); });
    };
    attempt();
    setTimeout(attempt, STAGGER);
  }).finally(() => signal.removeEventListener('abort', stop));
}

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Forbidden', 403);
  if (rateLimited(request, 'industry', 10)) return jsonError('Too many requests — please wait a moment.', 429);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return jsonError('GEMINI_API_KEY is not set on the server.', 503);
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON body.', 400); }
  const industry = String(body?.industry ?? '').trim().slice(0, 60);
  const k = industryKey(industry);
  if (k.length < 2) return jsonError('Which industry should Mav set up?', 400);
  if (cache.has(k)) return Response.json({ pack: cache.get(k), cached: true }, { headers: { 'Cache-Control': 'no-store' } });

  try {
    const pack = await race(industry, key, request.signal);
    if (!pack) return jsonError(`"${industry}" doesn't look like a kind of business.`, 422);
    cache.set(k, pack);
    if (cache.size > 60) cache.delete(cache.keys().next().value);
    return Response.json({ pack }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error(`[demo-ai] industry "${industry}" failed (${MODEL}): ${error.message} ${error.detail || ''}`);
    return jsonError(error.status === 402 ? 'The AI account is out of credits.' : "Mav couldn't set up that industry right now.", 502);
  }
}
