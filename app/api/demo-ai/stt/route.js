// POST /api/demo-ai/stt — transcribes a short recording (multipart "audio")
// with ElevenLabs Scribe. Fallback for browsers without live speech
// recognition (the page uses the Web Speech API when it can, which is faster).
// Env: ELEVENLABS_API_KEY, DEMO_AI_STT_MODEL (default scribe_v2).
import { sameOrigin, rateLimited, jsonError } from '@/lib/demoAi/guard.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Forbidden', 403);
  if (rateLimited(request, 'stt', 80)) return jsonError('Too many requests.', 429);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return jsonError('ELEVENLABS_API_KEY is not set on the server.', 503);
  let form;
  try { form = await request.formData(); } catch { return jsonError('Expected multipart form data.', 400); }
  const audio = form.get('audio');
  if (!audio || typeof audio === 'string') return jsonError('audio is required.', 400);
  if (audio.size > 8 * 1024 * 1024) return jsonError('Recording is too long.', 413);
  const upstreamForm = new FormData();
  upstreamForm.append('file', audio, 'speech.webm');
  upstreamForm.append('model_id', process.env.DEMO_AI_STT_MODEL || 'scribe_v2');
  const language = form.get('language');
  if (typeof language === 'string' && /^[a-z]{2,3}$/.test(language)) upstreamForm.append('language_code', language);
  try {
    const upstream = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: upstreamForm, signal: request.signal });
    if (!upstream.ok) return jsonError(`ElevenLabs returned ${upstream.status}.`, 502);
    const data = await upstream.json();
    return Response.json({ text: String(data.text || '').trim() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error.name === 'AbortError') return new Response(null, { status: 499 });
    return jsonError('Could not reach ElevenLabs.', 502);
  }
}
