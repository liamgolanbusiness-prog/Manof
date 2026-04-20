// Simple in-memory sliding-window rate limiter.
// Enough to deter auth bruteforce + abusive form submission from a single
// process. Multi-instance deploys (Vercel serverless) run a per-instance
// limiter — treat this as defense-in-depth, not the only gate. Pair with
// Supabase's own rate limits (dashboard: Auth → Rate limits).

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

// Evict stale entries opportunistically so the map doesn't grow forever.
function evict(now: number) {
  if (buckets.size < 500) return;
  for (const [k, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(k);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  evict(now);
  const w = buckets.get(key);
  if (!w || w.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (w.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((w.resetAt - now) / 1000)) };
  }
  w.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function clientIpFromHeaders(h: Headers): string {
  const fwd = h.get("x-forwarded-for") || "";
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}
