// GET /api/demo-ai/tts?text=…&prev=…  — streams the AI presenter's voice
// (MP3) from ElevenLabs so an <audio> element starts playing while it loads.
// Env: ELEVENLABS_API_KEY (required), DEMO_AI_VOICE_ID (default: the site's
// narration voice), DEMO_AI_TTS_MODEL (default eleven_flash_v2_5, lowest latency).
import { TTS_VOICE_ID } from '@/lib/demoScript.mjs';
import { sameOrigin, rateLimited, jsonError } from '@/lib/demoAi/guard.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!sameOrigin(request)) return jsonError('Forbidden', 403);
  if (rateLimited(request, 'tts', 400)) return jsonError('Too many requests.', 429);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return jsonError('ELEVENLABS_API_KEY is not set on the server.', 503);
  const params = new URL(request.url).searchParams;
  const text = (params.get('text') || '').trim().slice(0, 700);
  if (!text) return jsonError('text is required.', 400);
  const previous = (params.get('prev') || '').slice(0, 300);
  const voice = process.env.DEMO_AI_VOICE_ID || TTS_VOICE_ID;
  let upstream;
  try {
    upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/stream?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: process.env.DEMO_AI_TTS_MODEL || 'eleven_flash_v2_5', previous_text: previous || undefined, voice_settings: { stability: 0.45, similarity_boost: 0.8, speed: 1.04 } }),
      signal: request.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') return new Response(null, { status: 499 });
    return jsonError('Could not reach ElevenLabs.', 502);
  }
  if (!upstream.ok) return jsonError(`ElevenLabs returned ${upstream.status}. ${(await upstream.text().catch(() => '')).slice(0, 200)}`, 502);
  return new Response(upstream.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
}
