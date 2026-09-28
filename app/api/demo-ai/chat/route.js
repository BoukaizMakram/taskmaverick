// POST /api/demo-ai/chat — streams the AI presenter's next reply as plain text
// (spoken sentences with inline [[screen commands]]) from Gemini.
// Body: { messages: [{ role: 'user' | 'assistant', text }], view: {...} }
// Env: GEMINI_API_KEY (required), GEMINI_MODEL (default gemini-3.5-flash).
import { SYSTEM_PROMPT, describeView } from '@/lib/demoAi/prompt.mjs';
import { sameOrigin, rateLimited, jsonError } from '@/lib/demoAi/guard.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:streamGenerateContent?alt=sse`;

function toContents(messages) {
  // Consecutive turns of one role (e.g. several scripted tour steps) are merged,
  // so the conversation always alternates user / model.
  const contents = [];
  for (const m of messages.filter(x => x && typeof x.text === 'string' && x.text.trim()).slice(-40)) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const last = contents[contents.length - 1];
    if (last?.role === role) last.parts[0].text = `${last.parts[0].text}\n\n${m.text}`.slice(-6000);
    else contents.push({ role, parts: [{ text: m.text.slice(0, 4000) }] });
  }
  if (!contents.length || contents[0].role !== 'user') contents.unshift({ role: 'user', parts: [{ text: '(The prospect joined the video call.)' }] });
  return contents;
}

// GET — which services are configured (booleans only), for the join screen.
export function GET() {
  return Response.json({ ai: !!process.env.GEMINI_API_KEY, voice: !!process.env.ELEVENLABS_API_KEY, model: MODEL }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Forbidden', 403);
  if (rateLimited(request, 'chat', 60)) return jsonError('Too many requests — please wait a moment.', 429);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return jsonError('GEMINI_API_KEY is not set on the server. Add it to .env.local and restart the server.', 503);

  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON body.', 400); }
  if (!Array.isArray(body?.messages) || body.messages.length > 80) return jsonError('messages must be an array.', 400);

  const payload = thinking => JSON.stringify({
    systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\n${typeof body.screen === 'string' && body.screen.trim() ? `CURRENT SCREEN (live — trust this over your memory):\n${body.screen.slice(0, 5000)}` : describeView(body.view || {})}${typeof body.tour === 'string' && body.tour ? `\n\n${body.tour.slice(0, 3000)}` : ''}` }] },
    contents: toContents(body.messages),
    generationConfig: { maxOutputTokens: 900, ...(thinking ? { thinkingConfig: { thinkingLevel: 'minimal' } } : {}) },
  });
  const call = thinking => fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: payload(thinking), signal: request.signal });

  let upstream;
  try {
    upstream = await call(true);
    // Older / other models may not accept thinkingLevel — retry without it.
    if (upstream.status === 400) upstream = await call(false);
  } catch (error) {
    if (error.name === 'AbortError') return new Response(null, { status: 499 });
    return jsonError('Could not reach Gemini.', 502);
  }
  if (!upstream.ok) {
    // Full detail for the site owner (server log); a plain message for visitors.
    const detail = (await upstream.text().catch(() => '')).slice(0, 500);
    console.error(`[demo-ai] Gemini ${upstream.status} (${MODEL}): ${detail}`);
    const reason = upstream.status === 402 ? 'the AI account is out of credits'
      : upstream.status === 429 ? 'the AI is getting too many requests'
      : upstream.status === 401 || upstream.status === 403 ? 'the AI key was rejected'
      : upstream.status === 404 ? `the model ${MODEL} is not available for this key`
      : 'the AI service had a problem';
    return jsonError(`Mav can't answer right now: ${reason}. Please try again later.`, 502);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = '';
  const stream = new ReadableStream({
    async pull(controller) {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) { controller.close(); return; }
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split(/\r?\n/);
        pending = lines.pop();
        let out = '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const data = JSON.parse(line.slice(5));
            for (const part of data.candidates?.[0]?.content?.parts || []) if (part.text && !part.thought) out += part.text;
          } catch { /* keep-alive or partial line */ }
        }
        if (out) { controller.enqueue(encoder.encode(out)); return; }
      }
    },
    cancel() { reader.cancel().catch(() => {}); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
}
