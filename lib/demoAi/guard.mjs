// ---------------------------------------------------------------------------
// /demo-ai API guards (server only). The routes spend the site's Gemini and
// ElevenLabs keys, so they only answer this site's own pages and throttle
// each visitor. The limiter is per server instance — a speed bump, not a quota.
// ---------------------------------------------------------------------------

const buckets = new Map();

export function clientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
}

// Same-origin only: fetch() sends Origin; <audio src> sends Sec-Fetch-Site.
export function sameOrigin(request) {
  const site = request.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).host === request.headers.get('host'); } catch { return false; }
}

export function rateLimited(request, scope, limit, windowMs = 5 * 60 * 1000) {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter(t => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some(t => now - t < windowMs)) buckets.delete(k);
  return hits.length > limit;
}

export const jsonError = (error, status) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
