// POST /api/demo-ai/stt-token — a single-use ElevenLabs token so the browser
// can stream the visitor's microphone straight to Scribe v2 Realtime
// (wss://api.elevenlabs.io/v1/speech-to-text/realtime) without ever seeing the
// API key. Tokens expire after 15 minutes and are consumed on use.
import { sameOrigin, rateLimited, jsonError } from '@/lib/demoAi/guard.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Forbidden', 403);
  if (rateLimited(request, 'stt-token', 40)) return jsonError('Too many requests.', 429);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return jsonError('ELEVENLABS_API_KEY is not set on the server.', 503);
  try {
    const upstream = await fetch('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe', { method: 'POST', headers: { 'xi-api-key': key } });
    if (!upstream.ok) {
      console.error(`[demo-ai] ElevenLabs token ${upstream.status}: ${(await upstream.text().catch(() => '')).slice(0, 300)}`);
      return jsonError('Live transcription is unavailable right now.', 502);
    }
    const { token } = await upstream.json();
    return Response.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('Could not reach ElevenLabs.', 502);
  }
}
